---
title: 如何在服务器上部署外置大脑？
commentSlug: '2026-07-19-How-To-Deploy-CC'
published: 2026-07-19T00:00:00.000Z
draft: false
description: 关于 如何提高科研效率
image: /post-covers/2026-07-19-how-to-deploy-cc.jpg
tags:
  - 生活
category: 生活
lang: zh-CN
---
在这里开始写正文内容。

# 如何在服务器中部署Claude Code

如今的科研时代，没有 AI 的辅助，很多东西都是寸步难行的，其实 我认为也不能怪自己能力不行，因为有 AI 别人迭代进步的太快了，如果你不会使用 AI 去完成一些 流水线一样的固定式操作，你的进度会比别人慢很大一截。

> 在这里，对于一位标准的科研的本科生，肯定会使用到的就是 服务器，那 如何在 服务器上部署 AI呢？如果服务器的IP在国内，不能访问CC，Codex 这些工具怎么办？

## 缺陷

1. 首先我这个教程并不能解决 如何 翻墙 去访问官方 Claude Code 的API....（但是 如果有中转站或者国产API都是可以成功访问的）,因为 我认为 Claude Code 厉害的并不是这个 大模型，而是他设计的 这个 Claude Code 这个工具，合理使用 这个 Claude Code 这个外壳，也可以让自己比较孱弱的 大模型发挥出不一样的效果

2. 当前教程主要不针对于 API 的问题去提出 解决方案，其实就是一个 非常简单的教程，教大家如何在服务器上部署，让大家的科研效率更快

## 操作流程

1. 首先我们要在 服务器上安装 Node.js[链接如下🔗](https://nodejs.org/en/download)，选择**自己合适的版本（根据自己服务器的配置自己选择）**，一般的 服务器 的版本都是 Linux + x64的版本形式
2. 将 这个 压缩包上传到 服务器上，然后 在local 路径下解压缩:

```text
tar -xvJf node-v24.11.1-linux-x64.tar.xz
```

3. 然后配置 文件

```text
vim ~/.bashrc
```

在这个 .bashrc 中加入:

```
export NODE_HOME=/home/xxx/node-v24.11.1-linux-x64 export PATH="$NODE_HOME/bin:$PATH"
```

这个 NODE_HOME 是你的 解压缩包的 文件路径,所以跟我这个肯定不会一模一样

4. 然后安装 CC

```
npm install -g @anthropic-ai/claude-code
```

5. 更换 API

这个步骤不同的厂商操作可能不同，不做详细介绍，一般API相关文档会有部署到 Claude Code 中的介绍

### 随记(想到什么说什么)

至于为什么一定要在自己的用户的 local 路径下解除 压缩 这是因为 local 路径一般会默认将数据写入SSD中，并不会占用系统盘，这也是要注意的问题，如果不知道哪些数据会存到哪，要询问管理员，哪个位置的文件数据是不会存储到系统盘中的，因为一般的系统盘比较小，实验数据放到系统盘会影响服务器性能
