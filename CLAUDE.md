# 给 Claude 的项目说明

## 飞书多维表操作 —— 必须用 lark-cli

**写飞书永远走 `lark-cli` (user_access_token)，别用 Python + tenant_access_token。**

### 为什么
- `tenant_access_token`（机器人身份）即使 `bitable:app` 权限齐全，也写不了这个 wiki-bound bitable，会返回 `91403 Forbidden`
- 飞书 UI"添加协作者"搜不到这个 bot（哪怕 bot capability 已启用、APP 已发布）
- `lark-cli` 走 user_access_token，相当于以本人 (Lapis0x0) 身份操作，所有者权限直通

### 怎么用
```bash
# 读
lark-cli api GET "/open-apis/bitable/v1/apps/<APP_TOKEN>/tables/<TABLE_ID>/records?page_size=500"

# 写
lark-cli api POST "/open-apis/bitable/v1/apps/<APP_TOKEN>/tables/<TABLE_ID>/records/batch_create" \
  --data '{"records":[{"fields":{...}}]}'
```

Python 里包一层 subprocess 即可，参考 `scripts/sync_komiic_to_feishu.py`。

### 例外
CI（GH Actions）里只读飞书，用现成的 tenant_access_token 路径就行（`scripts/test_feishu_bitable.py`），读权限是通的。

## 数据流概览

```
书籍/论文：飞书 ←(手动维护)              →(CI 周日)→ books.json / papers.json
漫画：    komiic ─(本地 sync-comics.sh)→ 飞书 ─(CI 周日)→ comics.json
```

- 漫画同步脚本：`scripts/sync_komiic_to_feishu.py`
- macOS 快捷指令包装：`~/bin/sync-comics.sh`
- 凭证：`~/.config/vermilion-secrets.env`（KOMIIC_EMAIL/PASSWORD），不入库
- komiic 在 GitHub Actions IP 段被 Cloudflare 拦，所以 komiic 同步只能本地跑

## 飞书非机密 ID（写代码默认值）
- APP_ID: `cli_a701d5cbc5599013`（应用名"博客书库页面读取"）
- APP_TOKEN: `LB3Ob7h95aiymVsPw9DcBdYBnHg`（多维表"时歌的书库"）
- TABLE_ID 书籍: `tblsYMU7naUvz3cB`
- TABLE_ID 漫画: `tblvDAjRbWTxw93C`
- TABLE_ID 论文: `tbl7ibh7GGBGGLjq`

APP_SECRET 在 GitHub Secrets 和本地 secrets.env 里。
