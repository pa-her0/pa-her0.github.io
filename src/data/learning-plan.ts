export type LearningTrackId = "nowcoder" | "hdu" | "ai-infra"

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
  eyebrow: string
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

export const learningTracks: LearningTrack[] = [
  {
    id: "nowcoder",
    title: "牛客多校训练",
    shortTitle: "牛客",
    eyebrow: "NOWCODER",
    description: "十场训练、逐题补齐。完成后把思路与易错点同步进算法笔记。",
    sourceLabel: "打开牛客训练",
    sourceHref: nowcoderUnits[0].href,
    units: nowcoderUnits,
  },
  {
    id: "hdu",
    title: "杭电 HDU 多校",
    shortTitle: "HDU",
    eyebrow: "HANGZHOU DIANZI UNIVERSITY",
    description: "按场次推进 HDU 题单，记录关键算法、补题状态与复盘。",
    sourceLabel: "打开 HDU 训练",
    sourceHref: hduUnits[0].href,
    units: hduUnits,
  },
  {
    id: "ai-infra",
    title: "AI Infra 学习路线",
    shortTitle: "AI Infra",
    eyebrow: "SYSTEMS FOR AI",
    description: "从前置基础到推理部署，按章节建立可检验、可复盘的知识树。",
    sourceLabel: "查看原始学习路线",
    sourceHref: aiInfraGuideHref,
    units: aiInfraUnits,
  },
]

export const learningTasks = learningTracks.flatMap((track) =>
  track.units.flatMap((unit) => unit.tasks.map((task) => ({ ...task, trackId: track.id, unitId: unit.id }))),
)
