"""
从 komiic.com 拉取当前账号的收藏漫画，写入 public/data/comics.json。

权限（二选一）：
  推荐 —— 账号密码（可以长期自动，每次登录拿新 token）
    KOMIIC_EMAIL
    KOMIIC_PASSWORD

  也可以直接塞已登录的 JWT（24h 有效，到期要手动换）
    KOMIIC_TOKEN

输出格式与 Feishu 管线一致：
  {"data": {"items": [{"fields": {...}, "id": ..., "record_id": ...}, ...], "total": N}}

图片下载复用 test_feishu_bitable 里那套压缩逻辑（WebP / 300KB 封顶）。
"""

import os
import json
import hashlib
import urllib.request
import urllib.error
from io import BytesIO
from PIL import Image


LOGIN_ENDPOINT = "https://komiic.com/api/login"
KOMIIC_ENDPOINT = "https://komiic.com/api/query"
EMAIL = os.getenv("KOMIIC_EMAIL")
PASSWORD = os.getenv("KOMIIC_PASSWORD")
TOKEN = os.getenv("KOMIIC_TOKEN")

REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
OUTPUT_JSON = os.path.join(REPO_ROOT, "public", "data", "comics.json")
IMAGE_DIR = os.path.join(REPO_ROOT, "public", "images", "comics")
IMAGE_URL_PREFIX = "/images/comics"

MAX_SIZE = (800, 1200)
WEBP_QUALITY = 85
MAX_FILE_SIZE = 300 * 1024

# komiic status → 连载状态
STATUS_MAP = {
    "ONGOING": "连载中",
    "COMPLETED": "完结",
    "FINISHED": "完结",
    "ENDED": "完结",
    "DROPPED": "腰斩",
}


UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
)


def login(email: str, password: str) -> str:
    """用账号密码登录，拿 24h JWT"""
    body = json.dumps({"email": email, "password": password}).encode()
    req = urllib.request.Request(
        LOGIN_ENDPOINT, data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "Origin": "https://komiic.com",
            "Referer": "https://komiic.com/login",
            "User-Agent": UA,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            status = r.status
            resp_headers = dict(r.headers)
            raw = r.read()
    except urllib.error.HTTPError as e:
        raw = e.read()
        status = e.code
        resp_headers = dict(e.headers or {})
        print(f"[komiic] login HTTP {status}: {raw[:500].decode(errors='replace')}")
        raise
    # 自动解 gzip / brotli（有些 CDN 默认压缩就算请求里没要）
    enc = (resp_headers.get("Content-Encoding") or "").lower()
    if enc == "gzip":
        import gzip
        raw = gzip.decompress(raw)
    elif enc == "br":
        try:
            import brotli
            raw = brotli.decompress(raw)
        except ImportError:
            pass
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        snippet = raw[:500].decode(errors="replace")
        key_headers = {k: v for k, v in resp_headers.items()
                       if k.lower() in ("content-type","content-length","content-encoding","cf-ray","server","x-served-by")}
        raise RuntimeError(
            f"login response not JSON (status={status}, headers={key_headers}, body={snippet!r})"
        )
    token = payload.get("token")
    if not token:
        raise RuntimeError(f"login response missing token: {payload}")
    return token


def resolve_token() -> str:
    """先试 KOMIIC_TOKEN，否则用账号密码登录"""
    if TOKEN:
        print("[komiic] using KOMIIC_TOKEN from env")
        return TOKEN
    if EMAIL and PASSWORD:
        print(f"[komiic] logging in as {EMAIL}")
        return login(EMAIL, PASSWORD)
    raise RuntimeError(
        "no auth: set either KOMIIC_TOKEN, or both KOMIIC_EMAIL and KOMIIC_PASSWORD"
    )


def _headers(token: str):
    return {
        "Content-Type": "application/json",
        "Origin": "https://komiic.com",
        "Referer": "https://komiic.com/favorite",
        "Cookie": f"komiic-access-token={token}",
        "User-Agent": UA,
    }


_TOKEN: str | None = None


def graphql(operation: str, query: str, variables: dict) -> dict:
    assert _TOKEN, "token not initialized"
    body = json.dumps({
        "operationName": operation,
        "variables": variables,
        "query": query,
    }).encode()
    req = urllib.request.Request(KOMIIC_ENDPOINT, data=body, headers=_headers(_TOKEN), method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        payload = json.loads(r.read())
    if "errors" in payload:
        raise RuntimeError(f"GraphQL error: {payload['errors']}")
    return payload["data"]


def fetch_favorite_ids() -> list[str]:
    """分页拉取全部收藏的 comicId"""
    query = """
        query favoritesQuery($pagination: Pagination!) {
          favoritesV2(pagination: $pagination) {
            id comicId dateAdded lastAccess
          }
        }
    """
    ids: list[str] = []
    offset = 0
    page_size = 50
    while True:
        data = graphql("favoritesQuery", query, {
            "pagination": {
                "limit": page_size, "offset": offset,
                "orderBy": "COMIC_DATE_UPDATED", "status": "",
                "asc": True, "readProgress": "ALL",
            }
        })
        batch = data.get("favoritesV2") or []
        if not batch:
            break
        ids.extend(b["comicId"] for b in batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return ids


def fetch_comic_details(comic_ids: list[str]) -> list[dict]:
    """批量拉漫画详情，一次最多给 50 个 ID"""
    query = """
        query comicByIds($comicIds: [ID]!) {
          comicByIds(comicIds: $comicIds) {
            id title status year imageUrl
            authors { id name }
            categories { id name }
            dateUpdated monthViews views favoriteCount
            lastBookUpdate lastChapterUpdate
            contentType imageCount isFavorite
          }
        }
    """
    results: list[dict] = []
    for i in range(0, len(comic_ids), 50):
        chunk = comic_ids[i:i + 50]
        data = graphql("comicByIds", query, {"comicIds": chunk})
        results.extend(data.get("comicByIds") or [])
    return results


def fetch_read_progress(comic_ids: list[str]) -> dict[str, dict]:
    """拉取每部漫画的已读进度，返回 {comicId: {book, chapter}}"""
    query = """
        query comicsReadProgress($comicIds: [ID]!) {
          comicsReadProgress(comicIds: $comicIds) {
            comicId bookReadProgress chapterReadProgress
          }
        }
    """
    out: dict[str, dict] = {}
    for i in range(0, len(comic_ids), 50):
        chunk = comic_ids[i:i + 50]
        data = graphql("comicsReadProgress", query, {"comicIds": chunk})
        for p in data.get("comicsReadProgress") or []:
            out[p["comicId"]] = {
                "book": p.get("bookReadProgress") or "",
                "chapter": p.get("chapterReadProgress") or "",
            }
    return out


def compress_image(image_data: bytes) -> bytes:
    img = Image.open(BytesIO(image_data))
    if img.mode in ("RGBA", "P"):
        if img.mode == "P":
            img = img.convert("RGBA")
        has_alpha = min(img.split()[3].getextrema()) < 255 if img.mode == "RGBA" else False
    else:
        has_alpha = False
        img = img.convert("RGB")

    if img.size[0] > MAX_SIZE[0] or img.size[1] > MAX_SIZE[1]:
        img.thumbnail(MAX_SIZE, Image.LANCZOS)

    output = BytesIO()
    quality = WEBP_QUALITY
    while True:
        output.seek(0); output.truncate()
        if has_alpha:
            img.save(output, format="WEBP", quality=quality, method=4, lossless=False, exact=True)
        else:
            img.save(output, format="WEBP", quality=quality, method=4, lossless=False)
        if output.tell() <= MAX_FILE_SIZE or quality <= 40:
            break
        quality -= 5
    return output.getvalue()


def download_cover(url: str) -> str | None:
    try:
        os.makedirs(IMAGE_DIR, exist_ok=True)
        filename = f"{hashlib.md5(url.encode()).hexdigest()}.webp"
        local_path = os.path.join(IMAGE_DIR, filename)
        if os.path.exists(local_path):
            return f"{IMAGE_URL_PREFIX}/{filename}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0", "Referer": "https://komiic.com/",
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
        compressed = compress_image(raw)
        with open(local_path, "wb") as f:
            f.write(compressed)
        print(f"    downloaded {filename} ({len(raw)//1024}KB → {len(compressed)//1024}KB)")
        return f"{IMAGE_URL_PREFIX}/{filename}"
    except Exception as e:
        print(f"    error downloading {url}: {e}")
        return None


_READ_STATE = {
    "UNREAD": "想读",
    "STARTED": "追更中",
    "READING": "追更中",
    "FINISHED": "已读完",
    "COMPLETED": "已读完",
}


def _derive_tracking(serial: str, chapter_state: str, book_state: str) -> str:
    """根据 komiic 返回的阅读状态枚举推导追读状态"""
    for s in (chapter_state, book_state):
        if s in _READ_STATE:
            return _READ_STATE[s]
    return "想读"


def to_record(c: dict, progress: dict | None) -> dict:
    authors = ", ".join(a["name"] for a in c.get("authors") or [])
    categories = [cat["name"] for cat in c.get("categories") or []]
    serial = STATUS_MAP.get(c.get("status") or "", c.get("status") or "")

    cover_local = download_cover(c["imageUrl"]) if c.get("imageUrl") else None
    cover_field = [{"url": c["imageUrl"], "local_path": cover_local}] if cover_local else None

    latest_chapter = c.get("lastChapterUpdate") or ""
    read_chapter = (progress or {}).get("chapter") or ""
    read_book = (progress or {}).get("book") or ""
    tracking = _derive_tracking(serial, latest_chapter, read_chapter)

    fields = {
        "作品名": c.get("title") or "",
        "作者": authors,
        "连载状态": serial,
        "追读状态": tracking,
        "最新话数": latest_chapter,
        "最新卷数": c.get("lastBookUpdate") or "",
        "分类": categories,
        "年份": c.get("year"),
        "更新时间": c.get("dateUpdated") or "",
        "komiic_id": c["id"],
        "komiic_url": f"https://komiic.com/comic/{c['id']}",
    }
    if cover_field:
        fields["封面"] = cover_field

    return {"id": f"komiic-{c['id']}", "record_id": f"komiic-{c['id']}", "fields": fields}


def main():
    global _TOKEN
    try:
        _TOKEN = resolve_token()
    except Exception as e:
        print(f"Error: {e}")
        return 1

    print("[komiic] fetching favorites...")
    ids = fetch_favorite_ids()
    print(f"[komiic] got {len(ids)} favorites")

    if not ids:
        return 0

    print("[komiic] fetching comic details...")
    details = fetch_comic_details(ids)
    print(f"[komiic] got details for {len(details)} comics")

    print("[komiic] fetching read progress...")
    progress_map = fetch_read_progress(ids)
    print(f"[komiic] got progress for {len(progress_map)} comics")

    # 保留 komiic favorites 里的顺序（按更新时间）
    order = {cid: i for i, cid in enumerate(ids)}
    details.sort(key=lambda c: order.get(c["id"], 1e9))

    items = [to_record(c, progress_map.get(c["id"])) for c in details]
    payload = {"data": {"items": items, "total": len(items)}}

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"[komiic] saved → public/data/comics.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
