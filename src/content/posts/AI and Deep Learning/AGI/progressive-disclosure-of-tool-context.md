---
title: 关于渐进式披露工具上下文的几种方向讨论
published: 2026-08-05
description: "既然知识约束（Skills）可以被渐进式披露，那占据上下文另一大头的工具行不行呢？"
image: ""
tags: ["模型考古学"]
category: 深度学习
draft: false
---

首先的首先，我们可以把大模型粗略看作一个极其复杂的函数。在这个函数里，每一次交互的输出（Response），都建立在输入（Context）的基础之上；如果写出来可能是：

$$
\text{Response} = \text{LLM}(\textcolor{gray}{System\_Prompt},\; \textcolor{gray}{History},\; \textcolor{gray}{Tools},\; \textcolor{gray}{Skills})
$$

在之前的 Agent 开发中，受限于各种繁杂的业务需求，以及在 AI 辅助开发的各种防御型编程习惯的诱导下，很多开发者为了让 Agent 在长程任务中表现得更聪明、不犯错，会倾向于在 System Prompt 里塞入无穷无尽的规范，在 Tools 里注册成百上千的工具 API，识图期望通过穷尽一切可能性，来覆盖复杂的业务场景。

>至少我之前工作的公司就这么干的

毫无疑问，这种暴力堆料必定会碰到两面墙：一面是理论的墙，一面是现实的墙。

从**信息论**的视角来看，输入与期望输出之间的 **互信息** 决定了模型表现的上限。现实世界的信息复杂性是无法被轻易压缩的，这意味着为了让模型准确理解“目标是什么、为什么这么做、以及具体该怎么做”，我们确实必须给它提供相当充足的上下文。但矛盾之处在于，当我们指望 Agent 去执行一个横跨数小时、涉及几十轮决策的长程任务时，**整个任务的决策树会呈现指数级的膨胀**。如果我们为了应对所有潜在分支，在一开始就把极其庞杂的信息（成百上千的工具、巨细靡遗的规范）全部塞进去，那么对于模型在**当前这一步**的决策而言，大部分上下文不仅无效，反而构成了巨大的噪声。有效信息被淹没，互信息被严重稀释。信息越涣散，模型调和冲突与“瞎猜”的空间就越大，幻觉和偏离目标的概率随之飙升。


![bad503b974aacb9b62b5b7f7f0ce6870.png](https://pic.lapis.cafe/2026/07/bad503b974aacb9b62b5b7f7f0ce6870.png)
>图：当前的 agent 与 harness 的关系 bybike：

> 在信息论中，**互信息**（Mutual Information, MI）衡量的是一个随机变量中包含的关于另一个随机变量的信息量，或者说通过观察一个变量所能减少的对另一个变量不确定性的程度。输入与期望输出之间的互信息实际上构成了模型输出质量的信息论上界：如果输入所携带的关于目标输出的互信息不足，无论模型能力多强，也无法可靠地还原出完整、准确的期望输出。

而从**现实工程**的视角来看，无限膨胀的上下文意味着什么？意味着令人难以忍受的首字延迟（TTFT），意味着极速燃烧的 Token 预算，以及在超出 Prompt Cache 命中范围后高昂的算力成本。

> 随着一个 ai agent 系统的不断发展，如果人类不会定期彻底审阅一遍 ai 的各种规则上下文（agent.md，memory，各种项目记忆开发规范等），那 ai 看到的上下文里的规则冲突会越来越多，直到编程一大坨屎山。模型在长程任务中就必须不断消耗宝贵的思考 TOKEN 去调和这些相互冲突的指令，去跳大神猜测哪条优先，用户到底想要什么。

>最好的例子就是 SuperPower 等各种所谓的深度定制化规范开发的 Skills，可能它在六个月前确实是一个还不错的 harness 方案，但在 5.6 之后就显得十分的臃肿可憎。A\ 在迭代 Cladue 5 时代的 harness 时，直接将 Claude code 的系统提示词删掉了 80% 且没有观测到能力受损，可见模型能力进步之幅度。

![image.png](https://pic.lapis.cafe/2026/07/f7e4fc212772d1d840090322399cd6b4.png)
>图源：A\ 工程师的官方博客，描述了上下文规则里相互打架的现象

那我们应该如何破解这个「既要足够的信息量，又要极低的噪音和成本」的死局呢？

目前的一个相对较优的答案是：**渐进式披露**。Anthropic 此前提出的 [Skills 机制](https://www.lapis.cafe/posts/ai-and-deep-learning/agi/context-scarcity-rag-memory-skills/)向工程界普及了这一哲学：我们不在一开始把所有知识甩给模型，而是给模型一个目录/索引，让它在需要时主动去检索和加载。这极大地释放了 System Prompt 的空间。

既然“知识约束（Skills）”可以被渐进式披露，那占据上下文另一大头的“工具（Tools）”行不行呢？

答案是可行的。随着当前模型直觉规划能力和错误反思能力的提升，工具的按需加载在当前阶段已经具备了落地条件。但与普通的文本检索不同，工具的渐进式披露有着极其特殊的工程挑战。今天我们就来盘点一下，为了让工具“按需出现”，业内到底演化出了哪几种截然不同的方向。

# 一、必要的理解上下文

## 1.当前 agent 的工具调用机制是什么？

相关概念我在之前的博客里已经重复过很多遍了，不过这里最好还是再重复一遍：我们日常看到的所有 Agent——不管是 Claude code、codex、Cursor 还是别的什么 Harness 框架——其内部的模型都一直，且只会做一件事，即**预测并输出下一个 token**。所谓调用工具，本质上是模型在某一刻，按照预先约定的格式，吐出了一段结构化的文本。

这是理解后续一切设计取舍的起点。

### 一次请求长什么样？

当我们和 Agent 对话时，每一次发给模型的请求除了 system prompt，除了我们看到的聊天信息，背后大概还会附加一个 `tools` 的参数。一个最简化的请求大概是这样的：

```json
{
  "messages": [
    { "role": "user", "content": "查询北京天气" }
  ],
  "tools": [
    {
      "name": "get_weather",
      "description": "查询指定城市的天气",
      "parameters": {
        "type": "object",
        "properties": {
          "city": { "type": "string" }
        },
        "required": ["city"]
      }
    }
  ]
}
```

此即「注册工具」，我们把工具的名字、用途描述、参数契约塞到请求的 `tools` 字段里，告诉模型「这次对话中你可以用下面的这些东西」；模型在收到请求后，有两种可能的回应方式。第一种是我们最熟悉的，它会直接回一段自然语言：

```json
{ "role": "assistant", "content": "好的，我来帮你查一下北京的天气。" }
```

第二种就比较有趣了，模型可能会判断「这个问题我应该调用工具而不是直接回答」，于是它返回的内容变成了这样：

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_123",
      "name": "get_weather",
      "arguments": { "city": "北京" }
    }
  ]
}
```

注意，这个 `tool_calls` 不是我们从模型输出的普通文本里用正则抠出来的，它是 Provider API 返回的原生结构，通常还会带一个 `finish_reason: "tool_calls"` 的标记。我们本地的 agent 程序看到这个标记，就知道模型不是在对用户说话，而是在说：「我需要执行这个工具，请把结果拿回来给我。」

至于 Provider 内部是怎么让模型乖乖吐出这种格式的，各家不完全一样：可能把工具定义序列化成特殊的提示词格式，可能用训练过的专用 tool-call token 标记调用边界，也可能在输出阶段施加 JSON Schema 级别的语法约束，确保模型产出的参数类型和结构严格符合注册时的定义。但万变不离其宗，**输入中多了工具定义，输出中多了一个结构化的工具调用通道，仅此而已。**

### 如果不注册呢？

反正大模型是一个输入什么东西然后再输出什么东西的黑箱嘛，那假设我们不把 `get_weather` 放进 `tools` 数组，只在聊天消息里写一句：「你可以调用 get_weather，参数是 `{"city": "北京"}`」，这种情况下模型也当然认得这句话，甚至可能输出一段看起来很规整的 JSON：

```json
{
  "name": "get_weather",
  "arguments": { "city": "北京" }
}
```

但这只是普通文本。在这种情况下，Provider 不会把它标记为 `finish_reason: tool_calls`，不会帮我们做参数校验，也不会给我们一个 call_id 来匹配后续的工具执行结果。我们的本地程序必须自己解析文本、猜测这段 JSON 是不是工具调用、手动校验参数格式、自己处理各种边界情况。

不过话说回来，**这种「文本协议」在过去其实也流行过**。在 2023 到 2024 年乃至2025年，很多 Agent 框架和工具走的恰恰就是这条路，最典型的就是 ReAct，还有 2024 年的 Claude Dev/Cline，以及后来继承这套机制的 Roo Code 和 Kilo Code 早期版本。它们的做法很朴素：**在 System Prompt 里用 XML 或 Markdown 描述所有可用工具，然后让模型在对话中按约定格式输出调用指令。客户端捕获到符合格式的文本块后，解析、执行、把结果拼回对话**。

这种实现在早期主要是为了快速兼容不同渠道的模型，不用管它们是否真的支持 Tool Calling；但代价是没有 Provider 层的语法约束，模型偶尔会写出格式跑偏的调用，如参数名拼错、少一个括号、甚至自由发挥出一段解释代替调用。这就对框架本身提出了很高的要求。随着各个 Provider 的原生 Tool Calling 越来越成熟、尤其是 Strict Tool Use 和结构化输出这类能力逐渐普及，文本协议路线在可靠性上的差距被越拉越大，慢慢退出了主流视野。

换句话说，两条路线的根本性差距在于：

```
❌ 文本协议（不注册）：
模型输出普通文本 → 本地自己解析 → 判断是不是工具调用 → 校验参数 → 执行
↗ 灵活，但可靠性和工程复杂度全由框架承担

✅ 原生 Tool Calling：
Provider 返回正式 tool_calls → 本地直接读取 name、arguments、call_id → 校验授权 → 执行 → 按 call_id 回传结果
↗ 可靠，但受限于 Provider 的 JSON Schema 约束
```

### 这件事为什么重要？

在前面的讨论中，我们可以得到一个很简单的结论：

> **要做原生 Tool Calling，工具就必须出现在请求的 `tools` 参数里。Provider 在推理开始前就需要拿到所有工具的完整契约，否则它无法建立语法约束，也就无法产出合法的原生 tool call。**

这件事听起来简直就像「人被杀就会死」一样合理自然，单独来看确实没什么。大部分 Agent 几个十几个甚至几十个工具，我们全部注册进去不就完了？

直到 Agent 的能力越来越强，直到我们可能期望**它在一个会话中灵活调度上百个工具**。这时候，把全部工具定义一次性塞进 `tools` 数组就变得不再现实。

我们可以做一个简单的算术：假设一个工具的平均定义（名称、描述、参数 Schema）需要 400 个 token（这是一个非常保守的估算），**那么两百个工具就占据了 80k token 的上下文**；如果用户再疯狂一点多加一个 MCP，这些工具定义的总 token 数会迅速逼近甚至突破模型上下文窗口的**实际可用的注意力上限**；而即便没有突破，留给用户消息、历史记录和推理链的空间也会变得极其紧张。

> 几个月前，主流旗舰模型的实际可用上下文窗口大概在 150k 左右，而现在则普遍到了400-500k，不由得令人感慨 AI 能力提升之迅速；但可用窗口的增长不代表我们就可以当败家子嗯造上下文空间了，模型的注意力机制在大量低相关性的工具描述上仍然会产生显著的信息稀释和上下文腐烂效应。

那么，我们假设，**如果一个 agent 有几百个工具，我只想在模型真正需要时才把工具的定义给它，会发生什么？实现起来容易吗？**

## 2.渐进式披露，和为什么渐进式披露工具需要独特的工程设计

### 为什么渐进式披露 Tools 会比 Skills 更加困难 

答案是：**在当前的 Agent 架构下，这件事会比想象中困难一点。** 它触及了原生 Tool Calling 机制的一个根本性矛盾。在讨论 Tools 之前，我们先看一个相对轻松的参照物：**Skills**。

Skills 的渐进式披露在业界已经相当成熟，实现起来几乎没有阻力，因为 Skills 的本质是纯文本内容，一段 markdown 指令。它的加载流程是：用户提问，模型判断需要某个 Skill，Agent 从本地读取对应文件学习到相关领域知识，并据此回复或工作。

在这个过程中，**所有的信息增量发生在消息的末尾，不涉及任何最前方请求结构的改动。** 而“不改动前面的上下文结构”在当今的 AI 工程实践中恰恰是极其巨大的一项优势——因为它完美契合了各大模型厂商的**上下文缓存（Prompt Cache）机制**。

为了降低长文本推理的成本和延迟，当前主流 Provider（如 Anthropic、OpenAI）的缓存逻辑是：**只要两次连续请求的前缀（Prefix）在 token 层面完全一致，模型就能直接复用前一次的 KV 计算结果**。但这个机制极其严苛：前缀必须一模一样，哪怕在中间修改或插入了一个 token，后续所有的缓存就会瞬间报废。

理解了这一点，我们就会明白 Skills 渐进式披露的做法有多么平滑。当客户端在对话中途追加一条带有 Skill 内容的消息时，排在它前面的 System prompt、`tools` 数组、以及早先的历史消息可谓纹丝不动。因此，新请求的前缀没有遭到任何破坏，庞大的基础上下文依然能稳定命中缓存。新加载的知识只影响它之后的计算过程。

但 Tools 不同。 回顾第一节，**原生 Tool Calling 要求工具的完整定义必须出现在请求的 `tools` 参数中**。Provider 在推理开始前就需要拿到所有工具的 name、description 和完整的 JSON Schema，才能：

- 构建工具调用的特殊语法约束（如 Anthropic 的 Strict Tool Use 或 OpenAI 的 function calling grammar）。
- 在输出阶段识别 `finish_reason: tool_calls` 并正确解析结构化字段。
- 验证工具名称和参数类型是否合法，拒绝模型产生的幻觉工具调用。

如果我们不在 `tools` 中预先注册某个工具，Provider 就不会为它建立语法约束。即使模型自己在普通文本中写出了该工具的名称和参数，Provider 也不会将其识别为合法的原生 tool call，客户端只能退回到自己写正则解析 JSON 的“文本协议”野路子，失去原生调用的所有保障。

这意味着：**要做原生工具调用，工具就必须出现在请求的 `tools` 数组里。而 `tools` 数组是请求结构的一部分，这代表它永远驻扎在请求的最前端，即我们传递给模型全部 prompt 的一个相对起始位置。**

可以设想一下：我们的 Agent 有 200 个工具。为了做渐进式披露，我们固然可以在第一轮只把 5 个高频工具塞进 `tools` 数组。到第三轮对话时，模型意识到自己需要一个「创建 PDF」的工具——但这个工具不在初始的 5 个里。客户端此时只有两个选择：

- **选择 A**：在下一轮请求中，把「创建 PDF」临时塞进 `tools` 数组。  
    后果：`tools` 数组变了 → 请求最前方的结构变了 → **整个 Prompt Cache 全部报废** → 几万甚至几十万 token 的历史消息必须重新算一遍，不仅巨慢而且巨贵。
- **选择 B**：保缓存，不修改 `tools` 数组，让模型直接在普通对话里按格式把参数当纯文本输出。  
    后果：失去了原生 Tool Calling 的结构化校验，各种参数幻觉和格式错误只能由客户端自己写兜底逻辑去擦屁股。

所以，正常情况下渐进式披露工具的核心死结出现了：

> **原生工具调用的可信度建立在「Provider 在推理前就知道所有工具的完整契约」这一前提上；而渐进式披露的本质是「推理前坚决不让 Provider 知道所有工具」。这两个需求在系统结构上是天然互斥的。**

理解了这些约束之后，我们就可以来看业内为了解决「既要原生 tool calling，又要按需加载、不破坏缓存」这个三角难题，到底演化出了哪些思路。

# 二、业内都是怎么做的？
## 1.最正统：Anthropic 的 Tool Search Tool

A\ 在 2025 年 11 月发布了[Tool Search Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)，大致的原理是：首先，**客户端仍然需要把完整的工具契约全部发给 Anthropic**；但是我们可以把某些没那么必要的工具标注为 `defer_loading`，被标注的工具不会进入模型的初始长下文。在这种情况下，agent 的初始上下文中只有 Tool Search 和少量的非延迟加载工具。Astropick 将会在服务端维护隐藏的工具目录。

大概的工具契约是这样的：

```json
{
  "tools": [
    {
      "type": "tool_search_tool_bm25_20251119",
      "name": "tool_search_tool_bm25"
    },
    {
      "name": "learning_create_cards",
      "description": "Create learning cards...",
      "input_schema": {
        "...": "完整严格 schema"
      },
      "defer_loading": true
    },
    {
      "name": "learning_create_plan",
      "description": "Create a study plan...",
      "input_schema": {
        "...": "完整严格 schema"
      },
      "defer_loading": true
    }
  ]
}

```

这里我们假设这个 Agent 是一个学习场景的专用 Agent，我们给它注入的工具有一大堆学习相关的工具，比如制卡之类的；那么当模型需要学习制卡能力的时候，agent 就会调用：

```json
{
  "name": "tool_search_tool_bm25",
  "input": {
    "query": "create flashcards from study notes"
  }
}

```

Anthropic 在服务端搜索工具目录，返回特殊的 `tool_reference`：

```json
{
  "type": "tool_reference",
  "tool_name": "learning_create_cards"
}
```

Provider 随后在当前对话位置把这个引用展开成完整工具定义。模型看到真实 schema 后，可以直接产生：

```json
{
  "type": "tool_use",
  "name": "learning_create_cards",
  "input": {
    "...": "严格参数"
  }
}
```

内置搜索在 Anthropic 服务端运行，搜索结果和目标工具调用甚至可以出现在同一个 assistant response 中。客户端只需要执行最终的具体工具。

> 顺带一提，搜索有两个变体：`tool_search_tool_regex_20251119` 让模型写 Python `re.search()` 正则模式来匹配（上限 200 字符），`tool_search_tool_bm25_20251119` 则接受自然语言查询（上限 500 字符）。两者都会搜索工具名、描述、参数名和参数描述。

那么问题又来了，这种方式会破坏缓存吗？当然不会。这里的关键不是「发现后不改变工具列表」，而是 Anthropic 对 `defer_loading` 有一套特殊语义：

```text
原始缓存前缀：
[Tool Search]
[System Prompt]
[历史消息]

发现工具后：
[Tool Search]
[System Prompt]
[历史消息]
[tool_reference → 展开的真实工具契约]

```

我们可以看到，完整工具定义是在发现位置追加进去的，没有回头修改最前面的工具前缀。历史消息里出现过的 `tool_reference` 会被 API 全程展开，所以模型在后续轮次可以直接复用已发现的工具，不需要重新搜索。

这种实现方法的坏处是——强依赖于 Anthropic 这个 Provider，我们是没办法在自己的程序中离开 A\ 去复刻的，因为 A\ 控制了模型推理前的内部处理：

```
我们发送的 tools
        ↓
Anthropic 分成：
- 隐藏工具搜索索引
- 模型可见上下文
- Tool Calling 严格语法
        ↓
按需将契约插入对话中间
```

那么其他 Provider 呢？OpenAI 自家的 Responses API 如今也提供了同构的 `tool_search` + `defer_loading` 协议（我们放到本节末尾再讲），但广大「OpenAI 兼容」生态——vLLM、OpenRouter、各家自建兼容层等通常只能二选一：发送 tools → 全部进入模型上下文，或者不发送 tools → Provider 不承认对应的原生调用。它们缺少 `defer_loading` 和 `tool_reference` 这种 Provider 级协议。因此我们如果自己动手动态增加工具，就会改变早期前缀并破坏缓存。

于是就有了下面两条客户端自救路线。

## 2.但是服务端不支持怎么办？一个折中的压缩选项：stub 注册工具

这是我之前实现过的一个方案，核心思路是：**既然 `tools` 数组一个字都不能动，那就在「注册全部工具」的前提下，把每一个工具的契约在未被需要之前压缩到极限**。

具体做法可以分为两部分。第一部分是把每个真实工具都注册成一个 **stub**：保留真实工具名，描述尽量压缩，参数契约则换成一个宽松的万能外壳；第二部分是在工具列表里常驻一个普通的 `load_tool_schemas` 工具，由我们的客户端实现。Stub 大概长这样：

```json
{
  "name": "learning_create_cards",
  "description": "从学习笔记创建记忆卡片。调用前必须先调用 load_tool_schemas 获取完整参数契约。",
  "parameters": {
    "type": "object",
    "properties": {
      "arguments": { "type": "object", "additionalProperties": true }
    }
  }
}
```

完整的调用流程是：
```text
模型认为自己需要制卡能力
    ↓
1. 模型调用 load_tool_schemas({ "tools": ["learning_create_cards"] })
2. 客户端返回完整 JSON Schema（作为普通 tool_result 文本）
3. 模型按照刚拿到的 schema 调用 learning_create_cards 这个 stub
```

注意第 2 步的完整契约是以**消息**的形式回来的，追加在对话尾部，不碰任何前缀，因此可以复用之前的全部缓存。我们可以计算一下这种方案的 tokens 消耗：第一节中我们按照 400 token/工具估过 200 个工具的上下文消耗大概为 80k；换成 stub 之后，每个工具大概只剩名字、一句话描述和宽松契约，约 60-80tokens，**同样的 200 个工具的上下文消耗大概可以被压缩到 15k 左右**，降低了 80%的上下文消耗。

但这个方案并没有让问题消失，stub 的数量依然是 $O(N)$ 的，并没有实现真正的渐进式披露加载；而且每个 stub 都常驻在模型的上下文中，对于模型注意力的消耗也仍然是实打实的。另外它本质上是一种「半原生」方案：Provider 的语法约束还在，但约束的是 stub 那个宽松外壳，真实参数的合法性需要完全靠客户端自己约束。
## 3.进一步简化：客户端实现 tool search，注册更宽松的工具

当然，我们可以进一步简化。

让我们重新审视一下目前工具调用的两个基本前提：

1. 工具在 Provider 注册；
2. 模型可以正确遵循工具契约。

第一条其实可以被收窄到极限——注册的可以只有**一个**工具；而第二条，随着当前旗舰模型指令遵循能力的提升，「把契约以文本形式交给模型，它就能照着填参数」已经是一项相当可靠的能力。因此**我们完全可以定义一个通用的、全能的 `invoke_tool`**，把所有真实工具都藏到其背后：

```json
{
  "name": "invoke_tool",
  "description": "执行工具目录中的工具。请先用 search_tools 找到目标工具，再按返回的契约填写 arguments。",
  "parameters": {
    "type": "object",
    "properties": {
      "tool_name": { "type": "string" },
      "arguments": { "type": "object", "additionalProperties": true }
    },
    "required": ["tool_name", "arguments"]
  }
}
```

`tools` 数组从此恒定，里面只有两个工具：`search_tools` 和 `invoke_tool`。一次完整的发现与调用是这样的：

```json
1. 模型 → search_tools({ "query": "create flashcards from study notes" })
2. 客户端 → 返回目录条目（工具名 + 一行描述，不含完整 schema）
3. 模型 → invoke_tool({
     "tool_name": "learning_create_cards",
     "arguments": { "notes": "...", "mode": "qa" }
   })
4. 客户端 → 按 tool_name 取出真实 schema 校验 → 执行 → 回传结果
   （校验失败 → 回结构化错误 → agent 修正重试）
```

对比一下之前 2.2 节的方案：

```text
之前：
N 个具体 Stub + load_tool_schemas

现在：
1 个 invoke_tool + search_tools
```

初始上下文占用从 $O(N)$ 直接变成了 $O(1)$——不管工具目录里躺着 100 个还是 10,000 个工具，**模型看到的永远只有初始的两个工具**（大概只有几百 tokens 的占用）。工具目录本身可以是一个普通的本地索引、一张数据库表、甚至一个 embedding 检索服务，我们在本地可以实现非常自由的检索。

那么，这个方案的代价又是什么呢？

代价是我们无法复刻 Anthropic 的一个核心能力：Provider 只知道 `invoke_tool` 的外层 schema，不知道 `learning_create_cards` 的内层 schema。也就是说，**在 Provider 侧是无法约束校验这个工具调用的参数是否「真的」格式正确的**——外层有语法约束，但里面的 `arguments` 则是一个不设防的黑盒。真实校验必须由我们的客户端完整承担，一旦失败，就返回结构化校验错误让 agent 修正。除此之外还有一些隐性成本：**真实参数变成了「JSON 里的 JSON」，转义和嵌套多了一层**；而且这条路线对模型本身的指令遵循能力有门槛，太弱的模型会在第 3 步频繁出错。

公平起见，补偿也是有的：因为所有具体调用都收敛到了同一个入口，校验、授权、审计、限流这些横切关注点反而只需要在 Gateway 一处实现——这在多 User/Agent 场景里简直是意外之喜。

因此，没有 Provider 原生配合时，以下三个目标无法同时满足：

1. 初始上下文不包含 N 个具体工具或 Stub；
2. 工具列表始终稳定，不破坏早期 Prompt Cache；
3. 每个具体工具仍以独立原生工具和严格 schema 被 Provider 调用、约束。

三者只能取二：

|选择|结果|
|---|---|
|缓存稳定 + 具体工具原生调用|必须常驻 N 个真实工具或 Stub|
|初始无 N 个工具 + 具体工具原生调用|发现后动态修改 `tools`，破坏早期缓存|
|缓存稳定 + 初始无 N 个工具|只能常驻一个通用原生调用外壳，由客户端还原具体工具|

## 4.Moonshot 的按需加载工具机制

Moonshot 在 Kimi K3 的 API 里提供了一个叫「[动态加载工具](https://platform.kimi.com/docs/guide/use-dynamic-tool-loading)」的机制。月暗的思路是：**工具声明不一定要待在请求开头的 `tools` 字段里，它可以是一条消息。**

具体做法是：在 `messages` 中插入一条 `role` 为 `system`、携带 `tools` 字段的消息。声明格式与请求顶层 `tools` 完全一致，且必须提供工具的完整信息（name、description、parameters）：

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are Kimi, an AI assistant..."
    },
    {
      "role": "user",
      "content": "Calculate fuel consumption."
    },
    {
      "role": "system",
      "tools": [
        {
          "type": "function",
          "function": {
            "name": "Calculator",
            "description": "计算器，只支持单个算术表达式的求值",
            "parameters": {
              "type": "object",
              "properties": {
                "expr": {
                  "type": "string",
                  "description": "算术表达式，支持四则运算、指数运算、对数函数、三角函数，使用 javascript 语法"
                }
              },
              "required": ["expr"]
            }
          }
        }
      ]
    }
  ]
}
```

这个设计有几个关键的语义：

- 携带 `tools` 的 system 消息与普通消息地位相同：**它出现在 `messages` 的哪个位置，工具就从哪个位置开始对模型可见**；
- 动态加载的工具与顶层 `tools` 声明的全局工具并存，模型可以同时看到两类；
- 注入的声明必须是完整定义，不能只传个工具名；
- 这条 system 消息**不能再带 `content` 字段**，否则请求会以 400 报错。

那缓存呢？官方给的原则有四条：

|操作|对前缀缓存的影响|
|---|---|
|在 `messages` 末尾追加工具声明|不影响已有前缀缓存|
|后续请求原样保留已注入的工具声明|前缀保持稳定，有利于持续命中缓存|
|删除、修改对话中间的消息，或在中间插入新声明|变更位置之后的缓存可能无法命中|
|在顶层 `tools` 字段声明全局工具|不影响缓存命中|

换句话说：**追加，不要插入；注入了就别删。** 工具声明被当成普通对话内容的一部分往后追加，前缀纹丝不动，就和 Skills 的加载路径一模一样。基于这个思路，官方顺手给出了 tool search 的参考实现（API 层面并没有内置的搜索接口）：

1. 顶层 `tools` 里只声明一个自己实现的 `search_tools`；
2. 在 system prompt 里告诉模型有哪些可搜索的工具目录/领域关键词；
3. 模型需要工具时先调 `search_tools`，后端按关键词返回匹配的工具名和简介；
4. 应用把命中工具的**完整声明**通过一条带 `tools` 的 system 消息追加到末尾；
5. 模型在后续生成中直接原生调用这些新加载的工具。

我们可以将**Kimi 的按需加载工具方案可以视为一种 Provider 原生支持的、协议设计更轻量、使用更自由的选择**。它在协议层面上不需要任何的额外概念，不需要提供  `defer_loading`、`tool_reference` 等新字段，声明格式与顶层 `tools` 完全一致；在位置上，工具在 `messages` 的哪个位置注入，就从哪个位置开始对模型可见，直觉且可控，且天然的对缓存友好；在自由度更高的基础上还依然享有 Provider 侧的原生约束，不会像 `invoke_tool` 那样把参数黑盒化，十分之优雅，令人眼馋。

# 三、总结：渐进式披露与 tokens 经济学

> 在 Tokens 经济学中，我们会更加关注 Agent 运行过程中真正的高相关信息能够占据多少注意力，以及已经支付过计算成本的上下文能否被持续复用。

因此，一个好的工具系统并不是简单地让模型“知道尽可能多的工具”，我们的目标应当是**让模型在当前决策中，只看到足以支持这一步行动的信息**。将数百个工具的完整 Schema 一次性注入上下文，固然最大限度地保留了能力边界，却也会让大量与当前任务无关的定义长期占据注意力、Token 预算和首字延迟。工具越多，这种暴力注册的边际收益越低，边际成本越高。

但工具又不同于普通知识。Skills 可以作为文本自然地追加在消息末尾，而原生 Tool Calling 通常要求 Provider 在推理前获得完整工具契约。于是，**严格原生调用、稳定的 Prompt Cache 和真正的按需加载，构成了一个无法仅靠普通客户端同时满足的三角约束**。缺少 Provider 配合时，我们只能在三个目标之间进行取舍：

- 保留每个工具的独立原生调用，就必须让真实工具或 Stub 常驻上下文；
- 动态修改 `tools` 数组，可以获得严格 Schema，却会破坏早期缓存；
- 保持缓存稳定并将初始占用压缩到常数级，就只能通过 `invoke_tool` 之类的统一外壳，把真实校验下放给客户端。

至于如何抉择，那就要看各位 Agent 工程师们自己的权衡和 taste 了。

## 相关文档与延伸阅读

- [Anthropic：Tool Search Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
  Anthropic 官方的工具搜索与延迟加载方案，介绍了 `defer_loading`、BM25/Regex 搜索以及工具发现后的调用流程。
- [OpenAI：Tool Search](https://developers.openai.com/api/docs/guides/tools-tool-search)
  OpenAI Responses API 的工具搜索机制，支持通过 `defer_loading` 按需加载 Function、Namespace 和 MCP 工具。
- [Moonshot AI：动态加载工具](https://platform.kimi.com/docs/guide/use-dynamic-tool-loading)
  Kimi API 的动态工具加载协议，允许通过 `messages` 中的 System Message，在对话过程中追加完整工具声明。
- [Anthropic：Tool Reference](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference)
  Anthropic 工具协议的完整字段说明，包括 `defer_loading`、`tool_reference`、Strict Tool Use 等机制。
- [Anthropic：Tool Use with Prompt Caching](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching)
  介绍工具定义与 Prompt Cache 的关系，以及修改、追加工具时可能造成的缓存失效问题。
- [延伸阅读：上下文稀缺、RAG、Memory 与 Skills](https://www.lapis.cafe/posts/ai-and-deep-learning/agi/context-scarcity-rag-memory-skills/)
  关于上下文稀缺性，以及 RAG、Memory 和 Skills 等上下文管理机制的进一步讨论。
