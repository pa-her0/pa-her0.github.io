"""
把 komiic 收藏同步到飞书多维表（漫画表）。

走 lark-cli（user_access_token，你本人身份），绕开 tenant_access_token 那套协作者权限麻烦。
按 komiic_id upsert：已存在就更新客观字段；不存在就插入新行（含追读状态初值）。
飞书表里手动维护的字段（短评/推荐状态等）原样保留。

环境变量：
  KOMIIC_EMAIL, KOMIIC_PASSWORD（或 KOMIIC_TOKEN）
  FEISHU_APP_TOKEN, FEISHU_TABLE_ID_COMICS  （非 secret，可硬编码）

参数：
  --wipe      先删除所有现存记录再插入
  --dry-run   只打印计划
"""

import os
import sys
import json
import argparse
import subprocess

import sync_komiic

APP_TOKEN = os.getenv("FEISHU_APP_TOKEN", "LB3Ob7h95aiymVsPw9DcBdYBnHg")
TABLE_ID = os.getenv("FEISHU_TABLE_ID_COMICS", "tblvDAjRbWTxw93C")

OBJECTIVE_FIELDS = {"作品名", "作者", "连载状态", "封面URL", "komiic_id"}


def lark(method: str, path: str, data: dict | None = None) -> dict:
    cmd = ["lark-cli", "api", method, path]
    if data is not None:
        cmd += ["--data", json.dumps(data, ensure_ascii=False)]
    env = {**os.environ, "LARK_CLI_NO_PROXY": "1"}
    r = subprocess.run(cmd, capture_output=True, text=True, env=env)
    out = r.stdout.strip()
    if not out:
        raise RuntimeError(f"lark-cli empty: stderr={r.stderr}")
    payload = json.loads(out)
    if payload.get("code") != 0:
        raise RuntimeError(f"lark-cli error: {payload}")
    return payload.get("data", {})


def list_records() -> list[dict]:
    items, page_token = [], None
    while True:
        path = f"/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{TABLE_ID}/records?page_size=500"
        if page_token:
            path += f"&page_token={page_token}"
        d = lark("GET", path)
        items.extend(d.get("items", []))
        if not d.get("has_more"):
            break
        page_token = d.get("page_token")
    return items


def batch_delete(record_ids):
    for i in range(0, len(record_ids), 500):
        chunk = record_ids[i:i + 500]
        lark("POST",
             f"/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{TABLE_ID}/records/batch_delete",
             {"records": chunk})
        print(f"  deleted {len(chunk)}")


def batch_create(records):
    for i in range(0, len(records), 500):
        chunk = records[i:i + 500]
        lark("POST",
             f"/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{TABLE_ID}/records/batch_create",
             {"records": [{"fields": rec} for rec in chunk]})
        print(f"  created {len(chunk)}")


def batch_update(updates):
    for i in range(0, len(updates), 500):
        chunk = updates[i:i + 500]
        lark("POST",
             f"/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{TABLE_ID}/records/batch_update",
             {"records": [{"record_id": rid, "fields": f} for rid, f in chunk]})
        print(f"  updated {len(chunk)}")


def to_feishu_fields(item: dict) -> dict:
    f = item["fields"]
    cover = (f.get("封面") or [None])[0]
    out = {
        "作品名": f.get("作品名") or "",
        "作者": f.get("作者") or "",
        "连载状态": f.get("连载状态") or "",
        "komiic_id": f.get("komiic_id") or "",
    }
    cover_url = (cover or {}).get("url") if cover else ""
    if cover_url:
        out["封面URL"] = {"link": cover_url, "text": cover_url}
    out["_initial_tracking"] = f.get("追读状态") or "想读"
    return out


def extract_text(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "".join(seg.get("text", "") for seg in value if isinstance(seg, dict))
    return str(value or "")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wipe", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    sync_komiic._TOKEN = sync_komiic.resolve_token()
    print("[komiic] fetching favorites...")
    ids = sync_komiic.fetch_favorite_ids()
    print(f"[komiic] {len(ids)} favorites")
    details = sync_komiic.fetch_comic_details(ids)
    progress = sync_komiic.fetch_read_progress(ids)
    order = {cid: i for i, cid in enumerate(ids)}
    details.sort(key=lambda c: order.get(c["id"], 1e9))
    items = [sync_komiic.to_record(c, progress.get(c["id"])) for c in details]
    print(f"[komiic] {len(items)} records ready")

    print("[feishu] listing existing records...")
    existing = list_records()
    print(f"[feishu] {len(existing)} existing records")

    if args.wipe:
        ids_to_del = [r["record_id"] for r in existing]
        print(f"[feishu] wiping {len(ids_to_del)}")
        if not args.dry_run and ids_to_del:
            batch_delete(ids_to_del)
        existing = []

    by_kid = {}
    for r in existing:
        kid = extract_text((r.get("fields") or {}).get("komiic_id"))
        if kid:
            by_kid[kid] = r

    to_create, to_update = [], []
    for it in items:
        f = to_feishu_fields(it)
        kid = f["komiic_id"]
        initial = f.pop("_initial_tracking")
        if kid in by_kid:
            to_update.append((by_kid[kid]["record_id"],
                              {k: v for k, v in f.items() if k in OBJECTIVE_FIELDS}))
        else:
            f["追读状态"] = initial
            to_create.append(f)

    print(f"[feishu] plan: create {len(to_create)}, update {len(to_update)}")
    if args.dry_run:
        for c in to_create: print("  + CREATE", c.get("作品名"))
        for rid, u in to_update: print("  ~ UPDATE", rid, u.get("作品名"))
        return 0

    if to_create: batch_create(to_create)
    if to_update: batch_update(to_update)
    print("[done]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
