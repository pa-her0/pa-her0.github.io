import os
import json
import requests
import hashlib
from pathlib import Path
from PIL import Image
from io import BytesIO

APP_ID = os.getenv('FEISHU_APP_ID')
APP_SECRET = os.getenv('FEISHU_APP_SECRET')
APP_TOKEN = os.getenv('FEISHU_APP_TOKEN')

# 三个数据源：书籍 / 漫画 / 论文
# image_subdir 为 None 表示该数据源无封面字段
DATA_SOURCES = [
    {
        "name": "books",
        "table_id": os.getenv('FEISHU_TABLE_ID'),
        "output_json": "public/data/books.json",
        "image_subdir": "books",
    },
    {
        "name": "comics",
        "table_id": os.getenv('FEISHU_TABLE_ID_COMICS'),
        "output_json": "public/data/comics.json",
        "image_subdir": "comics",
    },
    {
        "name": "papers",
        "table_id": os.getenv('FEISHU_TABLE_ID_PAPERS'),
        "output_json": "public/data/papers.json",
        "image_subdir": None,
    },
]

MAX_SIZE = (800, 1200)
WEBP_QUALITY = 85
MAX_FILE_SIZE = 300 * 1024
WEBP_LOSSLESS = False
WEBP_METHOD = 4

REPO_ROOT = os.path.dirname(os.path.dirname(__file__))


def compress_image(image_data):
    img = Image.open(BytesIO(image_data))

    if img.mode in ('RGBA', 'P'):
        if img.mode == 'P':
            img = img.convert('RGBA')
        if img.mode == 'RGBA':
            alpha = img.split()[3]
            has_alpha = min(alpha.getextrema()) < 255
        else:
            has_alpha = False
    else:
        has_alpha = False
        img = img.convert('RGB')

    if img.size[0] > MAX_SIZE[0] or img.size[1] > MAX_SIZE[1]:
        img.thumbnail(MAX_SIZE, Image.LANCZOS)

    output = BytesIO()
    quality = WEBP_QUALITY

    while True:
        output.seek(0)
        output.truncate()

        if has_alpha:
            img.save(output, format='WEBP', quality=quality, method=WEBP_METHOD,
                     lossless=WEBP_LOSSLESS, exact=True)
        else:
            img.save(output, format='WEBP', quality=quality, method=WEBP_METHOD,
                     lossless=WEBP_LOSSLESS)

        if output.tell() <= MAX_FILE_SIZE or quality <= 40:
            break
        quality -= 5

    return output.getvalue()


def get_tenant_access_token():
    url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
    response = requests.post(url, json={"app_id": APP_ID, "app_secret": APP_SECRET})
    return response.json().get("tenant_access_token")


def fetch_all_records(table_id, token):
    """分页拉取表中全部记录"""
    items = []
    page_token = None
    while True:
        url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/records"
        params = {"page_size": 500}
        if page_token:
            params["page_token"] = page_token

        response = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params=params)
        data = response.json()

        if data.get("code") != 0:
            print(f"  API error: {data}")
            return None

        payload = data.get("data", {})
        items.extend(payload.get("items", []))

        if not payload.get("has_more"):
            break
        page_token = payload.get("page_token")

    return {"data": {"items": items, "total": len(items)}}


def download_image(url, token, save_dir, url_prefix):
    try:
        url_hash = hashlib.md5(url.encode()).hexdigest()
        filename = f"{url_hash}.webp"
        local_path = os.path.join(save_dir, filename)

        if os.path.exists(local_path):
            print(f"    image cached: {filename}")
            return f"{url_prefix}/{filename}"

        response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        response.raise_for_status()

        compressed = compress_image(response.content)
        with open(local_path, 'wb') as f:
            f.write(compressed)

        original_kb = len(response.content) / 1024
        compressed_kb = len(compressed) / 1024
        ratio = (1 - compressed_kb / original_kb) * 100 if original_kb > 0 else 0
        print(f"    downloaded: {filename} ({original_kb:.1f}KB → {compressed_kb:.1f}KB, -{ratio:.1f}%)")

        return f"{url_prefix}/{filename}"
    except Exception as e:
        print(f"    error downloading {url}: {e}")
        return None


def process_covers(records, token, image_subdir):
    """下载封面图，写入 local_path。image_subdir 为 None 时跳过。"""
    if not image_subdir:
        return records
    if not records or 'data' not in records or 'items' not in records['data']:
        return records

    save_dir = os.path.join(REPO_ROOT, 'public', 'images', image_subdir)
    os.makedirs(save_dir, exist_ok=True)
    url_prefix = f"/images/{image_subdir}"

    for item in records['data']['items']:
        fields = item.get('fields', {})
        covers = fields.get('封面')
        # 兜底：漫画表用 `封面URL`（URL 字段，komiic 直链），无附件 token，需走匿名下载
        if not covers:
            url_field = fields.get('封面URL')
            url = (url_field or {}).get('link') if isinstance(url_field, dict) else None
            if url:
                local_path = download_image_anonymous(url, save_dir, url_prefix)
                if local_path:
                    fields['封面'] = [{'url': url, 'local_path': local_path}]
            continue
        new_covers = []
        for cover in covers:
            if 'url' in cover:
                local_path = download_image(cover['url'], token, save_dir, url_prefix)
                if local_path:
                    c = cover.copy()
                    c['local_path'] = local_path
                    new_covers.append(c)
        if new_covers:
            item['fields']['封面'] = new_covers

    return records


def download_image_anonymous(url, save_dir, url_prefix):
    """无需飞书 token 的匿名下载，用于 komiic 等公开 URL"""
    try:
        url_hash = hashlib.md5(url.encode()).hexdigest()
        filename = f"{url_hash}.webp"
        local_path = os.path.join(save_dir, filename)
        if os.path.exists(local_path):
            return f"{url_prefix}/{filename}"
        response = requests.get(url, headers={
            'User-Agent': 'Mozilla/5.0', 'Referer': 'https://komiic.com/'
        }, timeout=30)
        response.raise_for_status()
        compressed = compress_image(response.content)
        with open(local_path, 'wb') as f:
            f.write(compressed)
        print(f"    downloaded: {filename} ({len(response.content)//1024}KB → {len(compressed)//1024}KB)")
        return f"{url_prefix}/{filename}"
    except Exception as e:
        print(f"    error downloading {url}: {e}")
        return None


def save_json(data, relative_path):
    output_path = os.path.join(REPO_ROOT, relative_path)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f"  saved → {relative_path}")


def process_source(source, token):
    name = source["name"]
    table_id = source["table_id"]

    if not table_id:
        print(f"[{name}] skip: table_id env not set")
        return

    print(f"[{name}] fetching table {table_id}...")
    records = fetch_all_records(table_id, token)
    if records is None:
        print(f"[{name}] failed to fetch")
        return

    total = records["data"]["total"]
    print(f"[{name}] got {total} records")

    records = process_covers(records, token, source["image_subdir"])
    # 漫画：根据 komiic_id 合成 komiic_url，前端跳转用
    if name == "comics":
        for item in records["data"]["items"]:
            kid = item.get("fields", {}).get("komiic_id")
            if isinstance(kid, str) and kid:
                item["fields"]["komiic_url"] = f"https://komiic.com/comic/{kid}"
    save_json(records, source["output_json"])


def main():
    required = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'FEISHU_APP_TOKEN']
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        print(f"Error: missing env vars: {', '.join(missing)}")
        return

    token = get_tenant_access_token()
    if not token:
        print("Error: failed to obtain tenant_access_token")
        return

    for source in DATA_SOURCES:
        process_source(source, token)


if __name__ == "__main__":
    main()
