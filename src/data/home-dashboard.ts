export interface HomeTrack {
  title: string
  artist: string
  album: string
  cover: string
  src: string
  href: string
}

// Edit personal content here. Audio uses the same public links as Serein,
// upgraded to HTTPS; availability depends on the music provider.
export const homeDashboard = {
  // Flip-disk display: up to 5 characters (A-Z, 0-9, colon or space).
  flipMatrix: { text: "JIELY", defaultMode: "text" },
  aboutScene: {
    title: "关于我",
    scene: "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
  },
  // Optional public WakaTime share JSON URLs. Never put an API key here.
  wakatime: { languagesUrl: "", calendarUrl: "" },
  intro: {
    title: "Hi, I'm Jiely !",
    lines: [
      "🎓 在人工智能与复杂系统之间寻找清晰结构。",
      "⚡ 关注多智能体、计算机视觉与算法交易实践。",
      "🍊 喜欢噜噜，也记录学习、阅读与日常生活。",
      "🔭 保持好奇，学习一切有趣的事物。",
    ],
  },
  location: "China, Chengdu",
  coordinates: [30.5728, 104.0668] as [number, number],
  stack: [
    { name: "Python", icon: "/icons/tech/python.svg" },
    { name: "C++", icon: "/icons/tech/cplusplus.svg" },
    { name: "Linux", icon: "/icons/tech/linux.svg" },
    { name: "Git", icon: "/icons/tech/git.svg" },
    { name: "PyTorch", icon: "/icons/tech/pytorch.svg" },
  ],
  gallery: [
    { src: "/home-gallery/hero-avatar-02.webp", alt: "噜噜站在蓝色阶梯上" },
    { src: "/home-gallery/hero-avatar-03.webp", alt: "噜噜演绎大白鲨" },
    { src: "/home-gallery/hero-avatar-04.webp", alt: "噜噜坐在复古座椅上" },
    { src: "/home-gallery/hero-avatar-05.webp", alt: "噜噜演绎肖申克的救赎" },
    { src: "/home-gallery/hero-avatar.webp", alt: "噜噜在雪山前唱歌" },
  ],
  tracks: [
    {
      title: "Color Your Night", artist: "Lotus Juice, 高橋あず美",
      album: "PERSONA3 RELOAD ORIGINAL SOUNDTRACK",
      cover: "https://i.scdn.co/image/ab67616d0000b273e59bdb7ca29ddfcb23ec4bf6",
      src: "https://music.163.com/song/media/outer/url?id=2129437761.mp3",
      href: "https://music.163.com/#/song?id=2129437761",
    },
    {
      title: "Full Moon Full Life", artist: "高橋あず美, Lotus Juice",
      album: "PERSONA3 RELOAD ORIGINAL SOUNDTRACK",
      cover: "https://i.scdn.co/image/ab67616d0000b273e59bdb7ca29ddfcb23ec4bf6",
      src: "https://music.163.com/song/media/outer/url?id=2129437576.mp3",
      href: "https://music.163.com/#/song?id=2129437576",
    },
    {
      title: "Beneath the Mask -rain-", artist: "Lyn",
      album: "PERSONA5 ORIGINAL SOUNDTRACK",
      cover: "https://i.scdn.co/image/ab67616d0000b2732a061f8cc383443cbb46adf6",
      src: "https://music.163.com/song/media/outer/url?id=454231783.mp3",
      href: "https://music.163.com/#/song?id=454231783",
    },
  ] satisfies HomeTrack[],
  illustration: { src: "/hero-avatar-05.jpg", hover: "/hero-avatar-04.jpg", alt: "噜噜的电影时刻" },
} as const
