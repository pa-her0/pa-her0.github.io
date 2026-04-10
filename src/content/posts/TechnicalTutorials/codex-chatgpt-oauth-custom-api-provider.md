---
title: 如何让 Codex 同时支持 ChatGPT OAuth 与自定义 API Provider
published: 2026-04-10
description: "祝大家蹬 Codex 蹬得愉快!"
image: ""
tags: []
category: 技术教程
draft: false
---

最近 OpenAI 又调整了 ChatGPT OAuth 登录的 codex 用量，原本可能已经不是很宽裕的 5 小时窗口又被削减了一轮，再加上 4 月 2 号开始的双倍额度活动也结束了，我自己的实际体感是现在可能半小时到一小时就会蹬完五小时的额度……但活总得继续干下去呀？

所以我需要一个 fallback 方案：平时继续用 ChatGPT OAuth 登录，毕竟订阅额度不蹬白不蹬；额度不够的时候无缝切到第三方 API provider 继续续命。Codex CLI 本身是支持自定义 provider 和 profile 切换的，所以这件事技术上完全可行。但我实际配置的时候踩了不少坑，这篇文章就是把整个过程讲清楚。

# 我碰到的问题

首先，Codex CLI 支持两种登录路径：

1. **Sign in with ChatGPT**：浏览器 OAuth 回调，走 ChatGPT 的额度和数据策略
2. **Sign in with API key**：直接用 OpenAI 平台的 API key，走 API 侧的计费

在此基础上，Codex 还允许你定义自定义的 `model_provider`，指向任何兼容 OpenAI 协议的第三方服务，很多第三方中转的配置方式就是让你在 config.toml 文件里覆盖他们的配置以通过中转来调用codex模型的。

因此，我最开始的配置直接用了三方中转的方案：定义一个自定义 provider，指向中转服务的 base URL，然后加上 `requires_openai_auth = true`。想法很朴素，觉得这样就能"借用 OpenAI 的登录态，走第三方的线路"，两全其美。

结果就是各种稀奇古怪的认证报错，排查下来问题出在三个地方：

**`requires_openai_auth = true` 不是我以为的那个意思。** 这行配置的真实含义是：这个 provider 没有自己的 API key，它的认证来源是 OpenAI。一旦我们这么写，它就不是一个"独立通道"，而是 OpenAI 身份体系下的一个变体。所以当你试图在 ChatGPT OAuth 和第三方中转之间切 profile 的时候，底层的认证根本就没换过，两条路共享同一套身份。

**`auth.json` 被我搞脏了。** Codex 会把登录信息缓存在 `~/.codex/auth.json` 里，我之前把第三方中转的 API key 也塞进了这个文件。OAuth 缓存和第三方 key 混在一起，Codex 自己都分不清当前该用哪个凭证。

**`openai_base_url` 会污染内建 provider。** Codex 有一个顶层配置项可以直接改写内建 `openai` provider 的 base URL。如果你在全局设了这个字段指向中转，那即便你写 `model_provider = "openai"`，请求也不是真的走官方。名字叫 openai，实际已经被改写了。

这就导致明明我选择 `codex --profile chatgpt` 了，请求还是跑到中转，或者报出莫名其妙的 key 错误。

# 正确的配置方案

ChatGPT OAuth 应当走内建的 `openai` provider，不动它的 base URL，不塞任何多余的东西。第三方中转走一个全新的自定义 provider，用自己的 `env_key` 读取自己的 API key，跟 OpenAI 的登录态没有任何关系。

我用的是站内的 foxcode，因此配置文件 `config.toml`就以此为例：

```toml
# 默认走 ChatGPT OAuth
profile = "chatgpt"

model = "gpt-5.4"
model_reasoning_effort = "medium"
disable_response_storage = true

# ---- Profiles ----
[profiles.chatgpt]
model_provider = "openai"
model = "gpt-5.4"
model_reasoning_effort = "medium"

[profiles.fox-api]
model_provider = "fox"
model = "gpt-5.4"
model_reasoning_effort = "medium"

# ---- 第三方中转 Provider ----
[model_providers.fox]
name = "fox"
base_url = "https://code.newcli.com/codex/v1"
wire_api = "responses"
env_key = "FOX_API_KEY"
```

在这份配置里：

- **默认 profile 是 `chatgpt`**，日常直接输 `codex` 就走官方 OAuth，不需要每次手动指定
- **第三方 provider 没有 `requires_openai_auth`**，它只认 `FOX_API_KEY` 这个环境变量，跟 OpenAI 的登录态完全解耦
- **没有设置 `openai_base_url`**，内建 openai provider 保持纯净，指向官方

然后是环境变量和 alias：

```bash
# 在 .zshrc / .bashrc 中
export FOX_API_KEY="你的第三方中转key"

# 日常快捷入口
alias codexfox='codex --profile fox-api'
alias codexg='codex --profile chatgpt'
```

**不要把第三方 key 命名成 `OPENAI_API_KEY`**，也不要在 shell 里全局导出 `OPENAI_BASE_URL` 指向中转。这些残留变量会覆盖 Codex 的配置，profile 切换会直接失效。

# 处理 auth.json

如果你之前往 `~/.codex/auth.json` 里塞过第三方 key，直接删掉这个文件，然后重新跑一次 `codex login`，让 ChatGPT OAuth 生成一份干净的缓存。第三方 provider 的 key 只通过环境变量读取，不经过 `auth.json`。

如果你在意安全性，还可以把凭证缓存切到系统 keyring：

```toml
cli_auth_credentials_store = "keyring"
```

# 日常使用

配置完之后日常使用很简单：

```bash
# 平时用 ChatGPT OAuth 额度
codex "帮我重构这个函数"

# 额度不够了，切第三方中转
codexfox "帮我重构这个函数"
```

`codex` 走官方，`codexfox` 走中转。不需要手动清环境变量，不需要删 auth 缓存，不需要记住"我现在到底是什么状态"。后续如果你还想加更多 provider，继续沿用同一套原则：**新的 profile，新的 provider，新的 env_key，不碰 openai。**

# 其他的常见误区

|误区|为什么有问题|正确做法|
|---|---|---|
|给第三方 provider 加 `requires_openai_auth = true`|借用 OpenAI 登录态，两条通道的认证没有真正分开|去掉，改用 `env_key`|
|把第三方 key 塞进 `auth.json`|和 OAuth 缓存混在一起，身份混乱|只通过环境变量传入|
|在全局设 `openai_base_url` 指向中转|内建 openai provider 被改写，ChatGPT OAuth 也跟着跑偏|不设这个字段|
|shell 里全局导出 `OPENAI_API_KEY` / `OPENAI_BASE_URL`|环境变量优先级高于配置文件，profile 切换形同虚设|清理掉，第三方用独立变量名|

祝大家蹬 Codex 蹬得愉快！