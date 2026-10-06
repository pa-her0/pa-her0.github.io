export const learningTrackIds = ["nowcoder", "hdu", "regional-vp", "ai-infra", "agent"] as const
export type LearningTrackId = typeof learningTrackIds[number]

export interface LearningTask {
  id: string
  label: string
  summary?: string
  href?: string
}

export interface LearningUnit {
  id: string
  title: string
  description: string
  href: string
  tasks: LearningTask[]
}

export interface LearningTrack {
  id: LearningTrackId
  title: string
  shortTitle: string
  description: string
  sourceLabel: string
  sourceHref: string
  units: LearningUnit[]
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
const agentCourseHref = "https://huggingface.co/learn/agents-course/unit0/introduction"

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
    id: "agent-foundation", title: "Agent 基础", description: "理解模型如何从回答问题走向完成任务。", href: agentCourseHref,
    tasks: [
      { id: "agent-foundation-loop", label: "理解 Agent 执行循环", summary: "梳理观察、推理、行动与反馈之间的关系。" },
      { id: "agent-foundation-tools", label: "实现工具调用", summary: "定义工具参数，处理调用结果与失败重试。" },
      { id: "agent-foundation-prompt", label: "设计任务指令", summary: "明确目标、上下文、输出格式与完成条件。" },
    ],
  },
  {
    id: "agent-workflow", title: "工作流与记忆", description: "让多步骤任务有状态、有上下文、可恢复。", href: agentCourseHref,
    tasks: [
      { id: "agent-workflow-state", label: "搭建多步骤工作流", summary: "实践任务拆分、路由、状态管理与人工确认。" },
      { id: "agent-workflow-memory", label: "加入检索与记忆", summary: "区分对话上下文、长期记忆与知识检索。" },
      { id: "agent-workflow-cooperate", label: "尝试多 Agent 协作", summary: "明确角色边界、交接信息与终止条件。" },
    ],
  },
  {
    id: "agent-project", title: "实践与评估", description: "用一个小项目，把学习沉淀为可验证的能力。", href: agentCourseHref,
    tasks: [
      { id: "agent-project-build", label: "完成一个 Agent 小项目", summary: "从学习助手、资料整理或自动化任务开始。" },
      { id: "agent-project-evaluate", label: "建立评估样例", summary: "检查成功率、工具调用、耗时与成本。" },
      { id: "agent-project-review", label: "记录失败案例与复盘", summary: "整理不稳定环节，并验证改进前后的表现。" },
    ],
  },
]

export const learningTracks: LearningTrack[] = [
  {
    id: "nowcoder",
    title: "牛客多校训练",
    shortTitle: "牛客",
    description: "十场训练、逐题补齐。完成后把思路与易错点同步进算法笔记。",
    sourceLabel: "打开牛客训练",
    sourceHref: nowcoderUnits[0].href,
    units: nowcoderUnits,
  },
  {
    id: "hdu",
    title: "杭电 HDU 多校",
    shortTitle: "HDU",
    description: "按场次推进 HDU 题单，记录关键算法、补题状态与复盘。",
    sourceLabel: "打开 HDU 训练",
    sourceHref: hduUnits[0].href,
    units: hduUnits,
  },
  {
    id: "regional-vp",
    title: "区域赛VP练习题",
    shortTitle: "区域赛 VP",
    description: "从一场完整的模拟赛开始，连接限时训练、赛后补题与复盘。具体赛站和题单记在下方进度说明中。",
    sourceLabel: "选择 VP 比赛",
    sourceHref: regionalVpHref,
    units: regionalVpUnits,
  },
  {
    id: "ai-infra",
    title: "AI Infra 学习路线",
    shortTitle: "AI Infra",
    description: "从前置基础到推理部署，按章节建立可检验、可复盘的知识树。",
    sourceLabel: "查看原始学习路线",
    sourceHref: aiInfraGuideHref,
    units: aiInfraUnits,
  },
  {
    id: "agent",
    title: "Agent学习",
    shortTitle: "Agent 学习",
    description: "从工具调用到工作流、记忆与评估，一步步做出能完成实际任务的 Agent。",
    sourceLabel: "打开 Agent 课程",
    sourceHref: agentCourseHref,
    units: agentUnits,
  },
]

export const learningTasks = learningTracks.flatMap((track) =>
  track.units.flatMap((unit) => unit.tasks.map((task) => ({ ...task, trackId: track.id, unitId: unit.id }))),
)
