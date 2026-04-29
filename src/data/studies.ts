// 专题数据 —— 临时 mock，第二步会迁到 Obsidian content collection
// 字段与设计稿 (studies-data.js) 对齐

export type StudyStatus = "在读" | "沉淀中" | "暂搁" | "已结"

export type ResourceTypeKey = "册" | "文" | "影" | "课" | "谈" | "播" | "网"

export type Study = {
  id: string
  no: string
  title: string
  subtitle: string
  epigraph: string
  intro: string
  started: string // "YYYY · MM"
  updated: string // "YYYY · MM · DD"
  status: StudyStatus
  field: string
  counts: Partial<Record<ResourceTypeKey, number>>
}

export type StudyResource = {
  id: string
  type: ResourceTypeKey
  title: string
  author: string
  year?: number
  date: string // "YYYY·MM·DD"
  note?: string
  status: string
  tags: string[]
}

export type StudyNote = {
  id: string
  after: string // resource id
  date: string
  body: string
}

export type ResourceTypeMeta = {
  label: string
  full: string
  en: string
}

export const RESOURCE_TYPES: Record<ResourceTypeKey, ResourceTypeMeta> = {
  册: { label: "册", full: "书籍", en: "Book" },
  文: { label: "文", full: "论文", en: "Paper" },
  影: { label: "影", full: "影片", en: "Film" },
  课: { label: "课", full: "课程", en: "Course" },
  谈: { label: "谈", full: "访谈", en: "Talk" },
  播: { label: "播", full: "播客", en: "Pod" },
  网: { label: "网", full: "文章", en: "Article" },
}

export const RESOURCE_TYPE_ORDER: ResourceTypeKey[] = ["册", "文", "影", "课", "谈", "播", "网"]

export const STUDIES: Study[] = [
  {
    id: "post-subculture",
    no: "03",
    title: "后现代亚文化的终结",
    subtitle: "Post-Subcultures",
    epigraph: "当反叛被美学化为风格，亚文化是否还存在？",
    intro:
      "从伯明翰学派的「抵抗仪式」开始，追到当下平台算法对亚文化身份的吸纳与稀释。一个核心追问：在「人人都是亚文化」的处境里，亚文化作为概念本身是否已经失效。",
    started: "2026 · 02",
    updated: "2026 · 04 · 22",
    status: "在读",
    field: "社会学",
    counts: { 册: 5, 文: 7, 影: 2, 课: 1, 谈: 3 },
  },
  {
    id: "alignment-question",
    no: "05",
    title: "对齐问题：从规范到价值",
    subtitle: "On Alignment",
    epigraph: "我们到底想让模型对齐什么？",
    intro:
      "把 RLHF、Constitutional AI、宪政式对齐这些技术路径，放回到伦理学和政治哲学的语境里看。资料从 Anthropic 的论文出发，回溯到 Rawls、Habermas、以及当代多元价值论。",
    started: "2026 · 01",
    updated: "2026 · 04 · 25",
    status: "在读",
    field: "AI · 哲学",
    counts: { 册: 4, 文: 12, 课: 2, 谈: 5, 播: 4 },
  },
  {
    id: "platform-labor",
    no: "02",
    title: "平台劳动与算法管理",
    subtitle: "Platform Labor",
    epigraph: "当老板是一行代码。",
    intro:
      "外卖骑手、网约车司机、内容创作者——三类职业里的人，正在被同一种算法逻辑塑形。读了一些田野调查，也想理论化地看「数字泰勒制」这个说法。",
    started: "2025 · 11",
    updated: "2026 · 03 · 14",
    status: "沉淀中",
    field: "社会学",
    counts: { 册: 6, 文: 9, 影: 3, 谈: 2 },
  },
  {
    id: "scaling-law",
    no: "06",
    title: "Scaling Law 的尽头",
    subtitle: "Limits of Scale",
    epigraph: "更大就一定更好吗？",
    intro:
      "从 GPT-3 时代的乐观，到 2024 年开始的「数据墙」讨论。试图厘清：「scaling」究竟在 scale 什么？模型能力的相变是真有，还是 benchmark 的幻觉？",
    started: "2026 · 03",
    updated: "2026 · 04 · 26",
    status: "在读",
    field: "AI",
    counts: { 文: 15, 影: 1, 课: 1, 谈: 4, 播: 6 },
  },
  {
    id: "loneliness-modern",
    no: "01",
    title: "孤独作为现代经验",
    subtitle: "On Loneliness",
    epigraph: "我们什么时候开始觉得「一个人」是个问题？",
    intro:
      "孤独并非天然的人类感受，而是一种被现代性塑造的经验。从韦伯的祛魅，到鲍曼的液态现代性，再到当代的「空巢青年」现象。",
    started: "2025 · 06",
    updated: "2026 · 01 · 08",
    status: "暂搁",
    field: "社会学",
    counts: { 册: 8, 文: 4, 影: 4, 谈: 1 },
  },
  {
    id: "interpretability",
    no: "04",
    title: "可解释性：打开黑箱",
    subtitle: "Interpretability",
    epigraph: "当我们说「理解」一个神经网络，是在说什么？",
    intro:
      "Mechanistic interpretability 这条路径最近的进展非常迷人。一边读 Anthropic 和 DeepMind 的论文，一边补认知科学和心智哲学的旧账——「理解」这个词本身就值得拆解。",
    started: "2026 · 02",
    updated: "2026 · 04 · 18",
    status: "在读",
    field: "AI · 认知科学",
    counts: { 文: 18, 课: 1, 谈: 2, 播: 3 },
  },
]

// 「对齐问题」详情页资源 —— mock，待第二步迁 Obsidian
export const STUDY_RESOURCES: Record<string, StudyResource[]> = {
  "post-subculture": [
    {
      id: "ps-r1",
      type: "册",
      title: "Resistance Through Rituals",
      author: "Stuart Hall, Tony Jefferson (eds.)",
      year: 1976,
      date: "2026·04·22",
      note: "伯明翰学派的奠基之作。把亚文化读成阶级位置的「象征性反抗」，今天看仍很锋利——但它假设的那个稳定的阶级结构，正在被平台经济搅得面目全非。",
      status: "已读",
      tags: ["伯明翰学派", "亚文化"],
    },
    {
      id: "ps-r2",
      type: "文",
      title: "Post-subcultures Reader 中关于 scene 的章节",
      author: "Bennett & Kahn-Harris (eds.)",
      year: 2004,
      date: "2026·04·15",
      note: "「scene」「neo-tribe」「lifestyle」这些后亚文化概念，回避了阶级，但也丢掉了「抵抗」的解释力。读完会有一种被温柔架空的感觉。",
      status: "已读",
      tags: ["后亚文化"],
    },
    {
      id: "ps-r3",
      type: "册",
      title: "亚文化：风格的意义",
      author: "迪克·赫伯迪格",
      year: 1979,
      date: "2026·04·08",
      note: "「风格即抵抗」的著名论断。今天读它，我更在意的是它如何描述「收编」的过程——主流文化总是先嘲讽、再消费、最后定价。这条链路在算法时代被压缩到了几周。",
      status: "在读 · 第 3 章",
      tags: ["伯明翰学派"],
    },
    {
      id: "ps-r4",
      type: "文",
      title: "TikTok 上的「土味」：审美抵抗还是流量符号？",
      author: "某青年研究季刊",
      year: 2024,
      date: "2026·03·30",
      note: "案例文。作者认为「土味」已经从一种自下而上的美学反讽，变成一类可被算法预设的内容标签。但我觉得它没说清楚：当反讽被结构性地制作出来，它还算反讽吗？",
      status: "已读",
      tags: ["田野", "短视频"],
    },
    {
      id: "ps-r5",
      type: "影",
      title: "We Are X",
      author: "Stephen Kijak",
      year: 2016,
      date: "2026·03·18",
      note: "X Japan 的纪录片。视觉系作为亚文化样本——一种几乎是宗教化的群体认同。今天的「饭圈」继承了形式，但抽掉了那种「我们要把自己烧给某种东西」的纵向献身。",
      status: "已看",
      tags: ["视觉系", "纪录片"],
    },
    {
      id: "ps-r6",
      type: "册",
      title: "After Subculture",
      author: "Andy Bennett, Keith Kahn-Harris",
      year: 2004,
      date: "2026·03·02",
      note: "标题就在「事后」。如果亚文化已成往事，研究者要做的不是哀悼，而是去描述「亚文化之后」的那种弥漫的、临时的、可换装的群体形态。",
      status: "在读",
      tags: ["后亚文化", "理论"],
    },
    {
      id: "ps-r7",
      type: "谈",
      title: "项飙 × 许知远 谈「悬浮的青年」",
      author: "十三邀",
      year: 2023,
      date: "2026·02·24",
      note: "项飙的「附近的消失」框架可以接到亚文化讨论上：当一个年轻人没有「附近」可以反叛，所谓的反叛就只剩下美学姿态——它的对象不是父辈、不是体制，而是上一周的算法推荐。",
      status: "已听",
      tags: ["访谈", "项飙"],
    },
    {
      id: "ps-r8",
      type: "文",
      title: "Algorithmic Identity",
      author: "John Cheney-Lippold",
      year: 2011,
      date: "2026·02·14",
      note: "他提出我们正被算法分类成「受众种类」（measurable types），而不是自我建构出身份。如果亚文化曾是「自下而上的身份生产」，那它最大的对手现在是这种自上而下的分类机器。",
      status: "已读",
      tags: ["算法", "身份"],
    },
  ],
  "alignment-question": [
    {
      id: "r1",
      type: "文",
      title: "Constitutional AI: Harmlessness from AI Feedback",
      author: "Bai et al., Anthropic",
      year: 2022,
      date: "2026·04·25",
      note: "重新读第 3 节。最让我在意的是「宪法」这个隐喻——它把价值表达为一组明文条款，但真正起作用的，可能是条款之间的张力如何被模型内化。",
      status: "已读",
      tags: ["RLHF", "对齐"],
    },
    {
      id: "r2",
      type: "册",
      title: "正义论",
      author: "约翰·罗尔斯",
      year: 1971,
      date: "2026·04·22",
      note: "「无知之幕」的设定和当代对齐研究里的「general principles」之间，有一种隐秘的同构。两者都假设可以从特殊性中抽身，去寻一个普遍可接受的位置。",
      status: "在读 · 第 4 章",
      tags: ["政治哲学"],
    },
    {
      id: "r3",
      type: "播",
      title: "Dwarkesh × Dario Amodei",
      author: "Dwarkesh Patel",
      year: 2024,
      date: "2026·04·20",
      note: "Dario 谈到「可信赖的 AI 助手」时，用了「同事」这个比喻——这个比喻把对齐从「驯服」转向了「合作」，但合作的前提是双方都有自己的判断。",
      status: "已听",
      tags: ["访谈"],
    },
    {
      id: "r4",
      type: "文",
      title: "The Capacity for Moral Self-Correction in Large Language Models",
      author: "Ganguli et al.",
      year: 2023,
      date: "2026·04·15",
      note: "模型规模到一定程度后，「告诉它别有偏见」就有效了——这个结果很反直觉。它意味着「对齐」可能不是一个外加的修补，而是某种已经在模型内部存在的能力的激活。",
      status: "已读",
      tags: ["RLHF"],
    },
    {
      id: "r5",
      type: "课",
      title: "Ethics of AI",
      author: "University of Helsinki",
      year: 2024,
      date: "2026·04·10",
      note: "第 5 章关于「问责性」的讨论很扎实。但整体偏入门，把它当作梳理框架的脚手架。",
      status: "进行中 · 6/9 章",
      tags: ["课程"],
    },
    {
      id: "r6",
      type: "册",
      title: "交往行为理论",
      author: "尤尔根·哈贝马斯",
      year: 1981,
      date: "2026·04·06",
      note: "理想言谈情境的四个有效性主张——可理解、真诚、真实、正当。如果把这套搬到「人机对话」上会发生什么？模型对「真诚」这一项的承担方式，注定和人不同。",
      status: "在读 · 第 2 卷",
      tags: ["哲学"],
    },
    {
      id: "r7",
      type: "文",
      title: "Pluralistic Alignment",
      author: "Sorensen et al.",
      year: 2024,
      date: "2026·03·30",
      note: "如果价值是多元、有时不可通约的，对齐就不能只对齐到「一个」目标。这篇把多元主义引入了对齐讨论，但具体做法仍然太靠近 voting。",
      status: "已读",
      tags: ["多元主义"],
    },
    {
      id: "r8",
      type: "谈",
      title: "Stuart Russell on Beneficial AI",
      author: "Lex Fridman Podcast",
      year: 2023,
      date: "2026·03·22",
      note: "Russell 的「inverse reward design」思路——别让 AI 知道目标是什么，让它去推断我们想要什么。这是一种「认识论上的谦虚」。",
      status: "已听",
      tags: ["访谈"],
    },
    {
      id: "r9",
      type: "文",
      title: "Concrete Problems in AI Safety",
      author: "Amodei et al.",
      year: 2016,
      date: "2026·03·15",
      note: "回看十年前的论文。当时担心的具体问题——奖励黑客、可扩展监督——很多今天反而更尖锐了。",
      status: "已读",
      tags: ["AI Safety"],
    },
    {
      id: "r10",
      type: "影",
      title: "AlphaGo",
      author: "Greg Kohs · 2017",
      year: 2017,
      date: "2026·03·02",
      note: "「第 37 手」那个时刻——它是一个无人理解、但事后证明很美的选择。这是对齐的反面：当模型走出我们的判断范围时，我们还能信任它吗？",
      status: "已看",
      tags: ["纪录片"],
    },
  ],
}

export const STUDY_NOTES: Record<string, StudyNote[]> = {
  "post-subculture": [
    {
      id: "ps-n1",
      after: "ps-r3",
      date: "2026·04·07",
      body: "赫伯迪格那个「收编→定价」的链路，在 TikTok 时代变成了几乎实时的过程。一个亚文化符号从出现到被广告化，过去要一年，现在只要两周。这意味着「反抗」连发酵的时间都没有。",
    },
    {
      id: "ps-n2",
      after: "ps-r7",
      date: "2026·02·25",
      body: "「附近的消失」其实是亚文化失能的根因之一。亚文化要成立，得有一个具体的、可被反叛的「我们身边的世界」；而平台时代的青年，反叛的对象常常是抽象的、远的、或者干脆只是上一条推荐视频。",
    },
  ],
  "alignment-question": [
    {
      id: "n1",
      after: "r2",
      date: "2026·04·24",
      body: "罗尔斯的「无知之幕」其实给对齐研究提供了一个很有意思的形式工具：如果让一个不知道自己将服务于谁的模型去学习偏好，它学到的会是什么？这或许不只是个思想实验。",
    },
    {
      id: "n2",
      after: "r6",
      date: "2026·04·05",
      body: "把哈贝马斯放回来读，发现「沟通理性」的预设——所有参与者都把对话当作目的而非手段——在人机对话里几乎一定不成立。但这不是缺陷，反而是一个有用的镜子。",
    },
    {
      id: "n3",
      after: "r9",
      date: "2026·03·12",
      body: "重读 2016 年的旧论文有一种考古的感觉。「具体的安全问题」这个标题本身就是一种姿态——拒绝形而上学，先把工程问题列清楚。十年过去，这种克制依然值得学。",
    },
  ],
}

export function getStudyById(id: string): Study | undefined {
  return STUDIES.find((s) => s.id === id)
}
