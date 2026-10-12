---
slug: llm1
title: LLM 的 Reasoning.....
commentSlug: llm1
published: 2026-08-04T02:27:00.000Z
draft: true
description: Thinking.....
image: 'https://dns.whalefall.top/LLM.png'
tags:
  - 学习
  - 热爱
category: 学习
series: LLM
seriesOrder: 1
lang: zh-CN
updated: 2026-10-12T04:39:11.000Z
pinned: false
section: note
---
>[!NOTE]
> 控制一个人的最高手段，应该是对他了如指掌，如果你都不清楚他怎么运作的，你怎么好去控制他呢？

# 推理模型背后的秘密
其实我认为这个推理模型其实也是没有解决大模型是一个概率模型的问题，我一直有一个疑问:**大模型是一个概率模型，他是一个百科全书，但是百科全书 可以对未知的领域进行思考与探索吗？**，突然想到一个回答，**涌现**，这是大模型一个非常牛皮的地方，就是 零样本 进行未知问题的解答 的涌现效应，这感觉也是目前唯一能够解释 大模型能进行真正的思考与解答的答案了。

## 推理链
其实 大模型所谓的 思考能力，就是 **任务拆分**，链式的解决思路，如果大家经常使用GPT的Thinking模型就会知道，在 Thinking 过程，大模型是不会一次性回答答案的，他类似于一种**DFS**的执行策略，就是在不断的寻找答案的过程，在 **思考--方案--验证** 的过程，其实这个可能也是 GPT 的 Thinking 的一个重要设计，就是 **一个解决问题的工作流设计**，目前的LLMs已经从学习 “要回答什么问题” 转变成 “如何回答问题” 的转变
![图片说明](https://dns.whalefall.top/llm1-1788928520599.png)

## 推理架构(CoT)
这个 推理的设计到底意味着什么？其实 就是一个 结构化推理的过程，LLMs 不仅要学习回答什么？更要学会“如何去回答”，我认为是通过**加长模型的回答时间，用来提升模型的回答质量**，也是从 **训练阶段的计算 到 推理阶段**的转变，我认为 是 **从预训练 到 后训练** 的转变？
所以我们要首先介绍一下 **Pre-training** 和 **
![图片说明](https://dns.whalefall.top/llm1-1791779668491.png)

### 预训练(Train-time Compute)
所以一开始为了提升模型性能，常用的手段（训练时计算）:
1. 模型
2. 数据集(tokens)
3. 计算量(FLOPs)

这三种手段体现了 AI 的底层基本能力，但是 这个 预训练方法的手段收益并不是 一个线性函数，而是随着你累的资源越多，可能模型的提升反而更不明显
### 学习资料

![学习链接](https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-reasoning-llms)
