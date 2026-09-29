// 首页滚动叙事：只需在这里修改文案，不必修改动画组件。
export const homeJourney = {
  opening: {
    lines: ["路要怎么走，", "答案在脚下。"],
    caption: "低头积蓄，抬头向前。",
  },
  introduction: {
    greeting: "你好，我是",
    name: "Jiely",
    lead: "保持好奇，\n学习一切有趣的事物。",
    description: "在代码与日常之间，探索自己的方向。把学到的知识写下来，也把想做的事情一步步实现。",
    interests: ["HPC 高性能计算", "AI Infra", "GitHub 开源"],
    linkLabel: "再多了解一点",
    link: "/about/",
  },
  philosophy: {
    title: "知行合一",
    subtitle: "知，是起点。行，是答案。",
    heading: ["不止于知道，", "更在于做到。"],
    description: "读过的书、写过的代码、走过的路，慢慢成为自己的注脚。这里记录探索，也记录成长。",
    entries: [
      { index: "01", title: "以学求知", description: "整理知识，让理解生根。", href: "/notes/" },
      { index: "02", title: "以行作答", description: "动手实践，让想法落地。", href: "/projects/" },
      { index: "03", title: "以记留痕", description: "记录生活，珍藏日常微光。", href: "/life/" },
    ],
    latestLabel: "读一篇最近的记录",
  },
} as const
