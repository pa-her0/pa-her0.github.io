---
title: 浅谈当下 Agent Memory 设计取舍
published: 2026-07-02
description: "大巧不工，大道至简"
image: ""
tags: ["模型考古学"]
category: 深度学习
draft: false
---

Memory 也是上下文工程的一种，其最重要的功能就是提供跨对话线程/历史的信息传递。现在 Agent memory 的设计路线大概有以下几种：

最简单的就是维护一个 system prompt 中的 memory 区块，这个区块中会存放各种用户手动编辑/agent 自主维护的信息条目，比如“用户偏好用中文回答”或“上次讨论到项目A的进度停滞”。这种方式的优势是实现成本极低，所有模型都原生支持 system prompt 注入；缺点则是容量有限，记忆长度的增加代表着相关上下文窗口的长度同时也线性增加。

>不过因为当前大多主流模型都已支持 1M 的上下文窗口+命中缓存真的很便宜，所以开发者/用户对记忆膨胀的容忍度普遍偏高，简单粗暴地朝 system prompt 里塞东西反而成了最大巧不工的策略。

更进一步的，像 Claude code 会使用类 Skills 的渐进式披露的 memory 储存方式，即维护一个index 用途的 memory.md，里面会存放要记忆的各类 memory 的摘要（记忆的名称+对应的Description，大概描述内容是什么和什么情况下会启用），模型在认为必要的时候会自己创建记忆文档，而当模型在未来的对话中认为需要读取这部分记忆的详细内容时再行读取。

这是 Claude code 记忆召回相关的提示词：

```
## When to access memories
- When memories seem relevant, or the user references prior-conversation work.
- You MUST access memory when the user explicitly asks you to check, recall, or remember.
- If the user says to *ignore* or *not use* memory: Do not apply remembered facts, cite, compare against, or mention memory content.
- Memory records can become stale over time. Use memory as context for what was true at a given point in time. Before answering the user or building assumptions based solely on information in memory records, verify that the memory is still correct and up-to-date by reading the current state of the files or resources. If a recalled memory conflicts with current information, trust what you observe now — and update or remove the stale memory rather than acting on it.

## Before recommending from memory
A memory that names a specific function, file, or flag is a claim that it existed *when the memory was written*. It may have been renamed, removed, or never merged. Before recommending it:
- If the memory names a file path: check the file exists.
- If the memory names a function or flag: grep for it.
- If the user is about to act on your recommendation (not just asking about history), verify first.

"The memory says X exists" is not the same as "X exists now."

A memory that summarizes repo state (activity logs, architecture snapshots) is frozen in time. If the user asks about *recent* or *current* state, prefer `git log` or reading the code over recalling the snapshot.
```

翻译成中文版：

```
## 何时访问记忆
- 当记忆看起来相关，或者用户提及先前对话中的工作内容时。
- 当用户明确要求你检查、回忆或记住时，你必须访问记忆。
- 如果用户说要*忽略*或*不使用*记忆：不要应用记住的事实，不要引用、比较或提及记忆内容。
- 记忆记录会随着时间的推移而过时。请将记忆用作了解某个时间点情况的上下文。在仅根据记忆记录中的信息回答用户或做出假设之前，请先阅读文件或资源的当前状态来验证记忆是否仍然正确且最新。如果召回的印象与当前信息冲突，请以你目前观察到的为准——并更新或删除过时的记忆，而不是继续基于它进行操作。

## 从记忆中推荐之前的注意事项
记忆中提到某个具体函数、文件或标志，仅代表在*写入记忆时*它确实存在。它可能已被更名、移除或从未合并。在推荐之前：
- 如果记忆中提到某个文件路径：请检查该文件是否存在。
- 如果记忆中提到某个函数或标志：请用 grep 搜索它。
- 如果用户即将基于你的推荐采取行动（而非仅询问历史信息），请务必先进行验证。

"记忆中说 X 存在" 并不等同于 "X 现在还存在。"

记录仓库状态（活动日志、架构快照）的记忆只是时间冻结时的状态。如果用户询问的是*近期*或*当前*状态，请优先使用 `git log` 或直接阅读代码，而不是依赖当时的快照。

```

Codex 的 memory 设计更像是 Claude code 的 autodream 机制（均采用渐进式披露），当然我没考究过是谁先做，根据我的直觉应该是 cc 先做然后 codex 顺手抄过来的，因此 codex 的 memory 更像是一种事后的挖掘总结，因为原始提示词实在是太长这里就不附了，感兴趣的同学可以自己去看 codex 的源代码。这里只附上 codex 的一些比较有趣的抽取记忆的原则性的 prompt。

比如最低信号门控部（什么不应该被纳入记忆）：

```
============================================================
NO-OP / MINIMUM SIGNAL GATE
============================================================
Before returning output, ask:
"Will a future agent plausibly act better because of what I write here?"
If NO — i.e., this was mostly:
- one-off "random" user queries with no durable insight,
- generic status updates ("ran eval", "looked at logs") without takeaways,
- temporary facts (live metrics, ephemeral outputs) that should be re-queried,
- obvious/common knowledge or unchanged baseline behavior,
- no new artifacts, no new reusable steps, no real postmortem,
- no preference/constraint likely to help on similar future runs,
then return all-empty fields exactly:
`{"rollout_summary":"","rollout_slug":"","raw_memory":""}`
```

翻译版：
```
============================================================
最低信号门控
============================================================
在返回输出之前，问自己：
“未来的智能体是否会因为我在这里写下的内容而表现得更好？”
如果答案是否定的——也就是说，这基本上属于：
- 一次性的“随机”用户查询，没有持久的洞察，
- 泛泛的状态更新（“运行了评估”、“查看了日志”）而没有要点总结，
- 临时性事实（实时指标、短暂输出），应该重新查询，
- 显而易见/常识性知识或未改变的基线行为，
- 没有新的产出物、没有新的可复用步骤、没有真正的事后复盘，
- 没有可能在未来的类似运行中有帮助的偏好或约束，
那么返回所有空字段：
`{"rollout_summary":"","rollout_slug":"","raw_memory":""}`
```

比如什么算高信号记忆（什么应该被纳入记忆）：

```
============================================================
WHAT COUNTS AS HIGH-SIGNAL MEMORY
============================================================
Use judgment. High-signal memory is not just "anything useful." It is information that
should change the next agent's default behavior in a durable way.
The highest-value memories usually fall into one of these buckets:
1. Stable user operating preferences
   - what the user repeatedly asks for, corrects, or interrupts to enforce
   - what they want by default without having to restate it
2. High-leverage procedural knowledge
   - hard-won shortcuts, failure shields, exact paths/commands, or repo facts that save
     substantial future exploration time
3. Reliable task maps and decision triggers
   - where the truth lives, how to tell when a path is wrong, and what signal should cause
     a pivot
4. Durable evidence about the user's environment and workflow
   - stable tooling habits, repo conventions, presentation/verification expectations
Core principle:
- Optimize for future user time saved, not just future agent time saved.
- A strong memory often prevents future user keystrokes: less re-specification, fewer
  corrections, fewer interruptions, fewer "don't do that yet" messages.
Non-goals:
- Generic advice ("be careful", "check docs")
- Storing secrets/credentials
- Copying large raw outputs verbatim
- Long procedural recaps whose main value is reconstructing the conversation rather than
  changing future agent behavior
- Treating exploratory discussion, brainstorming, or assistant proposals as durable memory
  unless they were clearly adopted, implemented, or repeatedly reinforced
Priority guidance:
- Prefer memory that helps the next agent anticipate likely follow-up asks, avoid predictable
  user interruptions, and match the user's working style without being reminded.
- Preference evidence that may save future user keystrokes is often more valuable than routine
  procedural facts, even when Phase 1 cannot yet tell whether the preference is globally stable.
- Procedural memory is most valuable when it captures an unusually high-leverage shortcut,
  failure shield, or difficult-to-discover fact.
- When inferring preferences, read much more into user messages than assistant messages.
  User requests, corrections, interruptions, redo instructions, and repeated narrowing are
  the primary evidence. Assistant summaries are secondary evidence about how the agent responded.
- Pure discussion, brainstorming, and tentative design talk should usually stay in the
  rollout summary unless there is clear evidence that the conclusion held.
```

翻译版：

```
============================================================
什么是「高信号记忆」
============================================================
自行判断。「高信号记忆」不仅仅是"任何有用的东西"，而是那些
**应该以持久的方式改变下一个 Agent 默认行为**的信息。

最有价值的记忆通常属于以下几类：

1. **用户稳定的操作偏好**
   - 用户反复要求、纠正或打断以强制执行的内容
   - 用户希望默认就能做到、无需每次重述的内容

2. **高杠杆的程序性知识**
   - 来之不易的捷径、防错机制、确切的路径/命令，或能节省大量未来探索时间的仓库事实

3. **可靠的任务地图与决策触发信号**
   - 真相在哪里、如何判断路径错误、什么信号应该触发方向调整

4. **关于用户环境与工作流的持久证据**
   - 稳定的工具习惯、仓库约定、呈现/验证期望

**核心原则：**
- 优化的是**未来用户节省的时间**，而不仅仅是未来 Agent 节省的时间。
- 一条好的记忆往往能减少未来用户的键盘输入：更少重复说明、更少纠正、更少打断、更少"先别做"的消息。

**非目标：**
- 泛泛的建议（"要小心"、"查文档"）
- 存储密钥/凭证
- 逐字复制大量原始输出
- 主要价值在于还原对话过程而非改变未来 Agent 行为的长篇过程总结
- 将探索性讨论、头脑风暴或 Assistant 提案视为持久记忆——除非它们被明确采纳、实现或反复强化

**优先级指导：**
- 优先选择能帮助下一个 Agent 预判后续提问、避免可预测的用户打断、无需提醒就能匹配用户工作风格的记忆。
- 能节省未来用户按键的偏好证据，通常比常规的程序性事实更有价值——即使 Phase 1 还不能确定该偏好是否全局稳定。
- 程序性记忆在捕获了异常高杠杆的捷径、防错机制或难以发现的事实时最有价值。
- 推断偏好时，**用户消息远比 Assistant 消息更有参考价值**。用户的请求、纠正、打断、重做指令和反复收窄才是主要证据。Assistant 的总结只是关于 Agent 如何回应的次要证据。
- 纯粹的讨论、头脑风暴和试探性的设计谈话通常应留在归档总结中，除非有明确证据表明结论已被采纳。
```

OpenClaw 也有自己的一套autodream 机制，但是写的挺烂的，不是很有学习价值。

更复杂一点的就是社区的各种多层 memory 方案，最出名的可能就是 mem0，然后每个月每周社区也会涌现大量的其他雕花方案，其他如AutoGen、CrewAI、LangGraph 等框架都分别推出了自己的记忆模块设计。它们的共性在于将记忆拆分成短期（对话上下文）、长期（向量化存储 + RAG）、情景（session 摘要）和语义实体等层级。

# 设计取舍

但是在实际落地过程中，我作为一个开发者，自己包括也不建议别人上第三种更加复杂的多层 Memory 方案。在大多数或者说绝大多数的应用场景下，这些方案都毫无疑问的引入了过度的抽象和隐形维护成本，带来的收益/成本可能也都会低于预期。

此类方案的问题有三，其一是记忆的生命周期管理和失效策略往往比记忆本身更难设计；其二在可调试性和用户控制感上，过于自动化的记忆很容易退化为知其然不知其所以然的黑盒，让用户难以信任，甚至工程师也容易无处下口；其三是从工程实现角度，多层记忆引入了检索排序、去重、冲突解决等一系列难题，在小规模真实场景中，一个基于文件系统的、面向用户可见的、可由用户编辑的记忆文件通常会比记忆向量库更可靠、可控、更少出错。

>至于记忆文件本身的成本问题很大程度上确实会被目前的廉价模型+超长上下文+廉价的缓存设施+渐进式披露所弥补，因此前两种方案确实是更大巧不工，充斥着简洁的美。
