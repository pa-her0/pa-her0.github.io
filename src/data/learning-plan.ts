export const learningTrackIds = ["algorithm", "ai-infra", "agent"] as const
export type LearningTrackId = typeof learningTrackIds[number]
export const legacyCompetitionTrackIds = ["nowcoder", "hdu", "regional-vp"] as const
export const acceptedLearningTrackIds = [...learningTrackIds, ...legacyCompetitionTrackIds] as const

// Old bookmarks, article frontmatter and local drafts still use these three IDs.
export function resolveLearningTrackId(value: unknown): LearningTrackId | undefined {
  if (typeof value !== "string") return undefined
  if (learningTrackIds.some((id) => id === value)) return value as LearningTrackId
  if (legacyCompetitionTrackIds.some((id) => id === value)) return "algorithm"
}

export const learningNoteMaxLength = 1000

export interface LearningTask {
  id: string
  label: string
  summary?: string
  outcome?: string
  href?: string
}

export interface LearningUnit {
  id: string
  title: string
  description: string
  href: string
  tasks: LearningTask[]
  layout?: "list"
  sourceLabel?: string
}

export interface LearningTrack {
  id: LearningTrackId
  title: string
  shortTitle: string
  description: string
  sourceLabel: string
  sourceHref: string
  units: LearningUnit[]
  completion?: { summary: string; href: string; label: string }
  groups?: { id: string; label: string; unitIds: string[] }[]
}

const nowcoderContests = [
  { number: 1, id: "133876", problems: ["A", "C", "E", "F", "G", "H", "J"] },
  { number: 2, id: "133877", problems: ["B", "F", "G", "L", "M", "N"] },
  { number: 3, id: "133878", problems: ["A", "B", "F", "G", "J", "K", "L"] },
  { number: 4, id: "133879", problems: ["B", "C", "D", "F", "I"] },
  { number: 5, id: "133880", problems: ["B", "C", "E", "I", "K", "L", "N"] },
  { number: 6, id: "133881", problems: ["D", "F", "G", "H", "I"] },
  { number: 7, id: "133882", problems: ["A", "D", "G", "H", "K", "L"] },
  { number: 8, id: "133883", problems: ["B", "E", "G", "H", "I", "M"] },
  { number: 9, id: "133884", problems: ["B", "D", "F", "H", "I"] },
  { number: 10, id: "133885", problems: ["A", "B", "E", "J", "K", "L"] },
] as const

const hduContests = [
  { number: 1, id: "1229", problems: ["1001", "1004", "1005", "1006", "1008", "1010", "1012"] },
  { number: 2, id: "1230", problems: ["1001", "1003", "1004", "1006", "1007", "1008", "1010", "1011"] },
  { number: 3, id: "1231", problems: ["1002", "1003", "1004", "1005", "1006", "1008", "1009", "1010"] },
  { number: 4, id: "1232", problems: ["1002", "1003", "1004", "1005", "1006", "1007", "1010", "1011"] },
  { number: 5, id: "1233", problems: ["1003", "1004", "1005", "1006", "1008", "1009", "1010", "1012"] },
  { number: 6, id: "1234", problems: ["1001", "1002", "1003", "1004", "1006", "1008", "1009", "1010", "1012"] },
  { number: 7, id: "1235", problems: ["1001", "1002", "1003", "1004", "1006", "1008", "1009", "1011", "1012"] },
  { number: 8, id: "1236", problems: ["1001", "1002", "1003", "1004", "1007", "1008", "1009", "1010", "1012"] },
  { number: 9, id: "1237", problems: ["1001", "1003", "1004", "1005", "1007", "1010", "1011", "1012"] },
  { number: 10, id: "1238", problems: ["1002", "1003", "1004", "1005", "1006", "1007", "1008", "1010", "1011"] },
] as const

const nowcoderUnits: LearningUnit[] = nowcoderContests.map((contest) => {
  const href = `https://ac.nowcoder.com/acm/contest/${contest.id}`
  return {
    id: `nowcoder-${contest.number}`,
    title: `牛客多校第${contest.number}场`,
    description: `${contest.problems.length} 道计划题目 · Contest ${contest.id}`,
    href,
    tasks: contest.problems.map((problem) => ({
      id: `nowcoder-${contest.number}-${problem.toLowerCase()}`,
      label: `${problem} 题`,
      href: `${href}/${problem}`,
    })),
  }
})

const hduUnits: LearningUnit[] = hduContests.map((contest) => {
  const href = `https://acm.hdu.edu.cn/contest/problems?cid=${contest.id}`
  return {
    id: `hdu-${contest.number}`,
    title: `HDU 多校第${contest.number}场`,
    description: `${contest.problems.length} 道计划题目 · Contest ${contest.id}`,
    href,
    tasks: contest.problems.map((problem) => ({
      id: `hdu-${contest.number}-${problem}`,
      label: problem,
      href: `https://acm.hdu.edu.cn/contest/problem?cid=${contest.id}&pid=${problem}`,
    })),
  }
})

export const aiInfraGuideHref = "https://caomaolufei.github.io/AIInfraGuide/guides/ai-infra%E5%AD%A6%E4%B9%A0%E8%B7%AF%E7%BA%BF/"

const cs336Descriptions = [
  "Overview, tokenization [Percy]",
  "PyTorch (einops), resource accounting (FLOPs, memory, arithmetic intensity) [Percy]",
  "Architectures, hyperparameters [Tatsu]",
  "Attention alternatives and mixture of experts [Tatsu]",
  "GPUs, TPUs [Tatsu]",
  "Kernels, Triton [Percy]",
  "Parallelism [Percy]",
  "Parallelism [Tatsu]",
  "Scaling laws [Tatsu]",
  "Inference [Percy]",
  "Scaling laws [Tatsu]",
  "Evaluation [Percy]",
  "Data (sources, datasets) [Percy]",
  "Data (filtering, deduplication, mixing, synthetic data) [Percy]",
  "Mid/post-training (SFT/RLHF) [Tatsu]",
  "Post-training - RLVR [Tatsu]",
] as const

const cs336Unit: LearningUnit = {
  id: "ai-infra-cs336",
  title: "CS336 · Language Modeling from Scratch",
  description: "Schedule · YouTube playlist",
  href: "https://www.youtube.com/watch?list=PLoROMvodv4rMqXOcazWaTUHhq-yembLCV&v=JuoVZkPBiKk",
  sourceLabel: "YouTube playlist",
  layout: "list",
  tasks: cs336Descriptions.map((description, index) => ({
    id: `ai-infra-cs336-${String(index + 1).padStart(2, "0")}`,
    label: `${String(index + 1).padStart(2, "0")} · ${description}`,
  })),
}

const aiInfraUnits: LearningUnit[] = [
  {
    id: "ai-infra-foundation",
    title: "第零层 · 前置基础",
    description: "先建立模型、编程、数学与通信直觉，再进入系统优化。",
    href: aiInfraGuideHref,
    tasks: [
      { id: "ai-infra-0-python", label: "Python 工程基础", summary: "面向对象、装饰器、生成器、并发与性能分析。" },
      { id: "ai-infra-0-cpp-linux", label: "C/C++ 与 Linux", summary: "指针、内存、编译链接，以及服务器日常操作。" },
      { id: "ai-infra-0-math", label: "数学基础", summary: "矩阵运算、概率统计、Softmax、交叉熵与梯度。" },
      { id: "ai-infra-0-transformer", label: "Transformer 架构", summary: "Attention、FFN、位置编码、LayerNorm 与完整前向过程。" },
      { id: "ai-infra-0-pytorch", label: "PyTorch 框架", summary: "Tensor、Autograd、训练循环、Checkpoint 与 Profiler。" },
      { id: "ai-infra-0-communication", label: "通信拓扑", summary: "NVLink、PCIe、InfiniBand、集合通信与 NCCL。" },
    ],
  },
  {
    id: "ai-infra-cuda",
    title: "第一层 · CUDA 与算子优化",
    description: "理解硬件、存储层次和 Kernel，再逐步完成经典算子优化。",
    href: aiInfraGuideHref,
    tasks: [
      { id: "ai-infra-1-gpu", label: "GPU 硬件架构", summary: "SM、CUDA Core、Tensor Core、HBM 与 Memory Wall。" },
      { id: "ai-infra-1-cuda", label: "CUDA 编程模型", summary: "Grid、Block、Thread、Warp，以及全局与共享内存。" },
      { id: "ai-infra-1-reduce", label: "Reduce 算子", summary: "树形归约、共享内存与 Warp Shuffle。" },
      { id: "ai-infra-1-gemm", label: "GEMM 算子", summary: "分块、向量化、Shared Memory Tiling 与 Tensor Core。" },
      { id: "ai-infra-1-softmax", label: "Softmax 与算子融合", summary: "Online Softmax、访存优化与 Kernel Fusion。" },
      { id: "ai-infra-1-attention", label: "Attention 算子", summary: "FlashAttention、Flash-Decoding、FlashInfer 与 PagedAttention Kernel。" },
      { id: "ai-infra-1-compiler", label: "AI 编译器", summary: "Triton、TVM、XLA 与 torch.compile。" },
      { id: "ai-infra-1-profiling", label: "性能分析工具链", summary: "Nsight Systems、Nsight Compute 与瓶颈判断。" },
    ],
  },
  {
    id: "ai-infra-distributed",
    title: "第二层 · 分布式训练",
    description: "围绕计算、通信和显存，掌握并行策略与训练框架。",
    href: aiInfraGuideHref,
    tasks: [
      { id: "ai-infra-2-architecture", label: "模型架构演进", summary: "MHA、MQA、GQA、MLA 与 MoE 对切分策略的影响。" },
      { id: "ai-infra-2-optimizer", label: "优化器与显存账本", summary: "SGD、AdamW、LAMB，以及优化器状态开销。" },
      { id: "ai-infra-2-data-parallel", label: "数据并行", summary: "DP、DDP、FSDP 与梯度同步。" },
      { id: "ai-infra-2-tensor-parallel", label: "张量与序列并行", summary: "TP、SP 的切分维度和通信开销。" },
      { id: "ai-infra-2-pipeline", label: "流水线并行", summary: "PP 切层、Micro Batch 与流水线气泡。" },
      { id: "ai-infra-2-zero", label: "ZeRO 系列", summary: "ZeRO-1/2/3 的状态、梯度和参数切分。" },
      { id: "ai-infra-2-memory", label: "混合精度与显存优化", summary: "FP16、BF16、FP8、梯度累积与 Activation Checkpointing。" },
      { id: "ai-infra-2-framework", label: "3D 并行与训练框架", summary: "Megatron-LM、DeepSpeed、PyTorch FSDP 的组合实践。" },
    ],
  },
  {
    id: "ai-infra-inference",
    title: "第三层 · 推理与部署",
    description: "从 KV Cache 到生产部署，以可复现指标检验优化收益。",
    href: aiInfraGuideHref,
    tasks: [
      { id: "ai-infra-3-basics", label: "LLM 推理基础", summary: "Prefill、Decode、KV Cache、TTFT、TPOT 与吞吐。" },
      { id: "ai-infra-3-engine", label: "推理引擎核心", summary: "PagedAttention、Continuous Batching、Prefix Cache 与调度。" },
      { id: "ai-infra-3-quantization", label: "量化", summary: "W8A8、INT4、KV Cache 量化与 FP8 的取舍。" },
      { id: "ai-infra-3-speculative", label: "Speculative Decoding", summary: "Draft/Target、Medusa、EAGLE-2 与并行验证。" },
      { id: "ai-infra-3-disaggregation", label: "分布式推理与 P/D 解耦", summary: "Prefill/Decode 拆分、KV 迁移、资源配比与 Goodput。" },
      { id: "ai-infra-3-benchmark", label: "性能分析与 Benchmark", summary: "QPS、延迟分位数、GenAI-Perf、MLPerf 与回归门禁。" },
      { id: "ai-infra-3-production", label: "生产部署与优化选型", summary: "先定位瓶颈，再选择缓存、量化、并行或调度方案。" },
    ],
  },
]

const regionalVpHref = "https://vjudge.net/contest"
export const agentEncyclopediaHref = "/notes/llm/agent-technical-encyclopedia/"

// Starter checklists: the contest year, location and problem set can be recorded in the track note.
const regionalVpUnits: LearningUnit[] = [
  {
    id: "regional-vp-icpc", title: "ICPC 区域赛 VP", description: "选一场区域赛，完整走过模拟、补题与复盘。", href: regionalVpHref,
    tasks: [
      { id: "regional-vp-icpc-select", label: "选择赛站与题单", summary: "记录年份、赛站、比赛链接和本次目标。" },
      { id: "regional-vp-icpc-contest", label: "完成一次限时 VP", summary: "按正式赛时模拟，记录通过题数与罚时。" },
      { id: "regional-vp-icpc-upsolve", label: "补齐赛中未通过题目", summary: "先独立思考，再整理题解与关键实现。" },
      { id: "regional-vp-icpc-review", label: "整理赛后复盘", summary: "回顾读题、选题、配合与时间分配。" },
    ],
  },
  {
    id: "regional-vp-ccpc", title: "CCPC 区域赛 VP", description: "把模拟赛变成发现薄弱点的一次练习。", href: regionalVpHref,
    tasks: [
      { id: "regional-vp-ccpc-select", label: "选择赛站与题单", summary: "记录年份、赛站与计划练习的题目。" },
      { id: "regional-vp-ccpc-contest", label: "完成一次限时 VP", summary: "记录过题顺序、卡题时间与提交情况。" },
      { id: "regional-vp-ccpc-upsolve", label: "完成赛后补题", summary: "补齐关键知识点并重新独立实现。" },
      { id: "regional-vp-ccpc-review", label: "整理训练笔记", summary: "提炼可复用的结论、模板与下一轮目标。" },
    ],
  },
]

const agentUnits: LearningUnit[] = [
  {
    id: "agent-architecture",
    title: "Agent 技术、架构与企业落地",
    description: "第一部分 · 从产品边界到系统架构、训练与企业应用",
    href: `${agentEncyclopediaHref}#agent-architecture`,
    sourceLabel: "阅读这一部分",
    layout: "list",
    tasks: [
      { id: "agent-notes-01", label: "01. Agent 基础与产品边界", outcome: "整理自主性等级、任务边界、终止条件、业务价值与常见失败模式。", href: `${agentEncyclopediaHref}#agent-chapter-01` },
      { id: "agent-notes-02", label: "02. Agent 全栈架构与分层职责", outcome: "形成 Model、Runtime、Harness、Framework、Application 五层架构及三平面的职责对照。", href: `${agentEncyclopediaHref}#agent-chapter-02` },
      { id: "agent-notes-03", label: "03. 模型能力与推理机制", outcome: "梳理模型结构、注意力、推理、约束解码、搜索与长上下文机制。", href: `${agentEncyclopediaHref}#agent-chapter-03` },
      { id: "agent-notes-04", label: "04. Prompt Engineering 与指令管理", outcome: "整理分层指令、提示词版本、工具描述、输出协议与回归测试方法。", href: `${agentEncyclopediaHref}#agent-chapter-04` },
      { id: "agent-notes-05", label: "05. Context Engineering 上下文工程", outcome: "沉淀上下文选择、压缩、渐进式披露、缓存与跨会话交接的设计笔记。", href: `${agentEncyclopediaHref}#agent-chapter-05` },
      { id: "agent-notes-06", label: "06. 规划、推理与执行控制模式", outcome: "对照 ReAct、计划执行、反思、状态机与搜索式规划的适用边界。", href: `${agentEncyclopediaHref}#agent-chapter-06` },
      { id: "agent-notes-07", label: "07. Tool Use 与 Agent–Computer Interface", outcome: "整理工具接口、结构化调用、错误反馈与大工具集选择的机制和取舍。", href: `${agentEncyclopediaHref}#agent-chapter-07` },
      { id: "agent-notes-08", label: "08. MCP、A2A 与 Agent 互操作协议", outcome: "梳理协议分工、传输、能力协商、连接生命周期与工具接入工程。", href: `${agentEncyclopediaHref}#agent-chapter-08` },
      { id: "agent-notes-09", label: "09. Runtime：Agent 运行时", outcome: "整理执行循环、状态持久化、调度、重试、隔离和中断恢复。", href: `${agentEncyclopediaHref}#agent-chapter-09` },
      { id: "agent-notes-10", label: "10. Harness Engineering 与长任务执行", outcome: "形成长任务初始化、增量推进、环境管理与跨会话交接的参考方案。", href: `${agentEncyclopediaHref}#agent-chapter-10` },
      { id: "agent-notes-11", label: "11. Memory：Agent 记忆系统", outcome: "归纳记忆类型、写入、检索、更新、遗忘与权限隔离的设计方法。", href: `${agentEncyclopediaHref}#agent-chapter-11` },
      { id: "agent-notes-12", label: "12. RAG、搜索与企业知识系统", outcome: "整理检索训练、近邻索引、重排、数据更新与企业知识服务参考架构。", href: `${agentEncyclopediaHref}#agent-chapter-12` },
      { id: "agent-notes-13", label: "13. Multi-Agent Systems 多智能体系统", outcome: "对照编排协作、上下文交接、DAG 调度与质量、成本和延迟的权衡。", href: `${agentEncyclopediaHref}#agent-chapter-13` },
      { id: "agent-notes-14", label: "14. Browser、Computer Use 与移动端 Agent", outcome: "整理视觉定位、动作空间、坐标系、状态校验与人工接管的工程边界。", href: `${agentEncyclopediaHref}#agent-chapter-14` },
      { id: "agent-notes-15", label: "15. Coding Agent 与软件工程工作流", outcome: "梳理代码定位、仓库图、开发环境、补丁验证与代码协作流程。", href: `${agentEncyclopediaHref}#agent-chapter-15` },
      { id: "agent-notes-16", label: "16. 文档、数据与多模态 Agent", outcome: "整理文档、表格、演示文稿与语音任务的计算、呈现和渲染验证方法。", href: `${agentEncyclopediaHref}#agent-chapter-16` },
      { id: "agent-notes-17", label: "17. Skills、插件与可复用工作流", outcome: "沉淀能力包结构、按需加载、路由、Token 预算和跨任务复用机制。", href: `${agentEncyclopediaHref}#agent-chapter-17` },
      { id: "agent-notes-18", label: "18. 安全、身份、权限与企业治理", outcome: "整理提示注入、最小权限、沙箱威胁模型、租户隔离与审批治理。", href: `${agentEncyclopediaHref}#agent-chapter-18` },
      { id: "agent-notes-19", label: "19. Observability 与 AgentOps", outcome: "形成 Trace、日志、评分、采样存储、成本归集与反馈管道的架构笔记。", href: `${agentEncyclopediaHref}#agent-chapter-19` },
      { id: "agent-notes-20", label: "20. 生产部署、可靠性与系统工程", outcome: "整理幂等、恢复、事件历史、确定性重放与版本迁移的可靠性方案。", href: `${agentEncyclopediaHref}#agent-chapter-20` },
      { id: "agent-notes-21", label: "21. 性能、成本与模型服务优化", outcome: "汇总 vLLM、SGLang、KV Cache、调度、量化与推理压测的机制和排障顺序。", href: `${agentEncyclopediaHref}#agent-chapter-21` },
      { id: "agent-notes-22", label: "22. 框架、SDK 与企业平台技术地图", outcome: "形成控制模式、扩展边界、可观测性与评测能力的框架选型对照。", href: `${agentEncyclopediaHref}#agent-chapter-22` },
      { id: "agent-notes-23", label: "23. Agent 训练、后训练与强化学习", outcome: "整理训练目标、轨迹数据、算法损失、Rollout、分布式训练与实验诊断。", href: `${agentEncyclopediaHref}#agent-chapter-23` },
      { id: "agent-notes-24", label: "24. 自改进 Agent 与 RSI", outcome: "梳理提示词、上下文、代码与权重的改进层级，以及生成、评估和选择循环。", href: `${agentEncyclopediaHref}#agent-chapter-24` },
      { id: "agent-notes-25", label: "25. Agent 产品交互与人机协作", outcome: "整理任务委托、进度反馈、人工接管、信任校准与成果验收的交互原则。", href: `${agentEncyclopediaHref}#agent-chapter-25` },
      { id: "agent-notes-26", label: "26. 企业典型场景与参考架构", outcome: "汇总企业场景的组件分工、工具与数据权限、核心指标和参考方案。", href: `${agentEncyclopediaHref}#agent-chapter-26` },
    ],
  },
  {
    id: "agent-evaluation",
    title: "Agent 测评体系与 Benchmark",
    description: "第二部分 · 从任务设计、评分与归因到持续评测和报告",
    href: `${agentEncyclopediaHref}#agent-evaluation`,
    sourceLabel: "阅读这一部分",
    layout: "list",
    tasks: [
      { id: "agent-notes-27", label: "27. Agent 测评的对象与层级", outcome: "整理模型、组件、Harness、系统和业务层的评测对象与责任边界。", href: `${agentEncyclopediaHref}#agent-chapter-27` },
      { id: "agent-notes-28", label: "28. 评测数据集、任务与环境设计", outcome: "形成任务采样、数据切分、环境状态、难度分布与数据权限的设计笔记。", href: `${agentEncyclopediaHref}#agent-chapter-28` },
      { id: "agent-notes-29", label: "29. 测评指标与成功标准", outcome: "梳理结果、过程、约束、副作用，以及质量、稳定性、成本和延迟指标。", href: `${agentEncyclopediaHref}#agent-chapter-29` },
      { id: "agent-notes-30", label: "30. Graders：自动评分与人工评审", outcome: "整理代码评分、模型裁判、人类评审、裁判校准与评分器验证方法。", href: `${agentEncyclopediaHref}#agent-chapter-30` },
      { id: "agent-notes-31", label: "31. 执行轨迹评测与失败归因", outcome: "建立从执行 Trace 到错误分类、根因分析与可复现失败样例的整理框架。", href: `${agentEncyclopediaHref}#agent-chapter-31` },
      { id: "agent-notes-32", label: "32. 统计方法、公平对比与可复现性", outcome: "归纳重复试验、置信区间、配对比较、预算控制与实验版本记录。", href: `${agentEncyclopediaHref}#agent-chapter-32` },
      { id: "agent-notes-33", label: "33. 离线、线上与持续评测闭环", outcome: "整理离线回归、线上监测、人工反馈与改进验证的持续评测流程。", href: `${agentEncyclopediaHref}#agent-chapter-33` },
      { id: "agent-notes-34", label: "34. 组件与场景专项测评", outcome: "汇总工具、RAG、记忆、Skills、协作、GUI、Coding、研究和文档任务的专项标准。", href: `${agentEncyclopediaHref}#agent-chapter-34` },
      { id: "agent-notes-35", label: "35. Agent 安全与鲁棒性测评", outcome: "整理注入、越权、数据外泄、审批绕过、工具故障与防护回归的测试维度。", href: `${agentEncyclopediaHref}#agent-chapter-35` },
      { id: "agent-notes-36", label: "36. 测评框架与评测基础设施", outcome: "形成 Runner、Environment、Grader、Reporter 与主流评测平台的技术地图。", href: `${agentEncyclopediaHref}#agent-chapter-36` },
      { id: "agent-notes-37", label: "37. Agent Benchmark 图谱与原始资料", outcome: "整理工具、代码、浏览器、办公、记忆、安全和长任务基准的原始资料索引。", href: `${agentEncyclopediaHref}#agent-chapter-37` },
      { id: "agent-notes-38", label: "38. 面向产品岗位的 Benchmark 选读与组合", outcome: "归纳按产品场景组合公开 Benchmark、私有验收集与业务指标的阅读路线。", href: `${agentEncyclopediaHref}#agent-chapter-38` },
      { id: "agent-notes-39", label: "39. 企业 Agent 评测方案与报告模板", outcome: "沉淀实验设置、指标结果、失败分析、发布建议和评测局限的报告模板。", href: `${agentEncyclopediaHref}#agent-chapter-39` },
    ],
  },
  {
    id: "agent-research",
    title: "技术报告与前沿研究",
    description: "第三部分 · 厂商技术报告、自改进研究与资料索引",
    href: `${agentEncyclopediaHref}#agent-research`,
    sourceLabel: "阅读这一部分",
    layout: "list",
    tasks: [
      { id: "agent-notes-40", label: "40. Anthropic：架构、Harness、上下文与测评", outcome: "整理有效 Agent、上下文工程、工具设计、长任务 Harness 与评测的原始资料。", href: `${agentEncyclopediaHref}#agent-chapter-40` },
      { id: "agent-notes-41", label: "41. OpenAI：Agent 系统、Codex Harness 与评测", outcome: "汇总 Agent 系统、代码工作环境、工具与技能组合，以及评测改进闭环的阅读笔记。", href: `${agentEncyclopediaHref}#agent-chapter-41` },
      { id: "agent-notes-42", label: "42. DeepSeek：推理训练、Agent 数据与高效模型架构", outcome: "整理模型架构、推理强化学习、Agent 数据合成与高效推理的技术报告线索。", href: `${agentEncyclopediaHref}#agent-chapter-42` },
      { id: "agent-notes-43", label: "43. Kimi／Moonshot：Agent 训练、并行协作与长上下文", outcome: "汇总推理训练、Agent 协作、长上下文与模型结构演进的技术资料。", href: `${agentEncyclopediaHref}#agent-chapter-43` },
      { id: "agent-notes-44", label: "44. RSI 与自改进系统：补充原始论文", outcome: "整理 ADAS、SICA、DGM、GEPA、ACE 与 AlphaEvolve 的研究问题和原始论文入口。", href: `${agentEncyclopediaHref}#agent-chapter-44` },
    ],
  },
]

export const learningTracks: LearningTrack[] = [
  {
    id: "algorithm",
    title: "算法竞赛",
    shortTitle: "算法竞赛",
    description: "牛客多校、HDU 多校与区域赛 VP，按场次训练、补题与复盘。",
    sourceLabel: "打开训练题单",
    sourceHref: nowcoderUnits[0].href,
    units: [...nowcoderUnits, ...hduUnits, ...regionalVpUnits],
    groups: [
      { id: "nowcoder", label: "牛客多校", unitIds: nowcoderUnits.map((unit) => unit.id) },
      { id: "hdu", label: "HDU 多校", unitIds: hduUnits.map((unit) => unit.id) },
      { id: "regional-vp", label: "区域赛 VP", unitIds: regionalVpUnits.map((unit) => unit.id) },
    ],
  },
  {
    id: "ai-infra",
    title: "AI Infra 学习路线",
    shortTitle: "AI Infra",
    description: "从前置基础到推理部署，按章节建立可检验、可复盘的知识树。",
    sourceLabel: "查看原始学习路线",
    sourceHref: aiInfraGuideHref,
    units: [...aiInfraUnits, cs336Unit],
    groups: [
      { id: "roadmap", label: "学习路线", unitIds: aiInfraUnits.map((unit) => unit.id) },
      { id: "cs336", label: "CS336", unitIds: [cs336Unit.id] },
    ],
  },
  {
    id: "agent",
    title: "Agent 学习",
    shortTitle: "Agent 学习",
    description: "《Agent 产品技术百科》44 章笔记，覆盖技术架构、测评体系与前沿研究。",
    sourceLabel: "阅读 Agent 产品技术百科",
    sourceHref: agentEncyclopediaHref,
    units: agentUnits,
    completion: {
      summary: "已完成《Agent 产品技术百科》44 章笔记，形成技术与架构知识体系、Agent 测评方案与报告模板，以及技术报告和原始研究资料索引。",
      href: `${agentEncyclopediaHref}#agent-learning-results`,
      label: "查看完整成果",
    },
  },
]

export const learningTasks = learningTracks.flatMap((track) =>
  track.units.flatMap((unit) => unit.tasks.map((task) => ({ ...task, trackId: track.id, unitId: unit.id }))),
)
