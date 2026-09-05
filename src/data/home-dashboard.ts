export interface HomeTrack {
  title: string
  artist: string
  album: string
  cover: string
  src: string
  mimeType: string
  href: string
}

const localMp3 = (file: string) => ({ src: `/music/${file}`, mimeType: "audio/mpeg" } as const)

// Edit personal content here. The audio files are served from public/music.
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
      "🎓 兴趣: HPC 高性能计算 与 AI Infra",
      "⚡ 热衷前沿技术和Github开源项目。",
      "🍊 记录生活，记录学习。",
      "🔭 保持好奇，学习一切有趣的事物。",
    ],
  },
  location: "China, Chengdu",
  playlist: { name: "blog", id: "13584583094", href: "https://music.163.com/#/playlist?id=13584583094" },
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
      title: "Color Your Night", artist: "Lotus Juice, 高橋あず美, アトラスサウンドチーム, ATLUS GAME MUSIC",
      album: "ペルソナ3 リロード オリジナル・サウンドトラック",
      cover: "https://p1.music.126.net/wV5oF-XNh-RsjrYzmBbe3w==/109951172181637798.jpg",
      ...localMp3("color-your-night.mp3"),
      href: "https://music.163.com/#/song?id=2123807718",
    },
    {
      title: "红", artist: "罗言", album: "When the world is came，take it！",
      cover: "https://p1.music.126.net/G-inyKjA-jO5MuOuV3g7Pg==/109951167027986653.jpg",
      ...localMp3("red.mp3"),
      href: "https://music.163.com/#/song?id=1918576268",
    },
    {
      title: "总有一天你会出现在我身边", artist: "棱镜乐队", album: "一次有预谋的初次相遇",
      cover: "https://p2.music.126.net/RfUHXkanpxImcaGqFNWBeA==/109951163598901405.jpg",
      ...localMp3("one-day-you-will-appear.mp3"),
      href: "https://music.163.com/#/song?id=1303027499",
    },
    {
      title: "两 难", artist: "加木", album: "两 难",
      cover: "https://p2.music.126.net/Qvenb5t_hL37b7hRfscjaw==/109951169686160429.jpg",
      ...localMp3("dilemma.mp3"),
      href: "https://music.163.com/#/song?id=2163210456",
    },
    {
      title: "最近", artist: "王小帅", album: "最近 (正式版)",
      cover: "https://p2.music.126.net/OS8zeoIGLdE4o2kDGCCo1A==/109951171485395177.jpg",
      ...localMp3("recently.mp3"),
      href: "https://music.163.com/#/song?id=1357825630",
    },
    {
      title: "还是分开", artist: "张叶蕾", album: "还是分开",
      cover: "https://p1.music.126.net/tH5FdakJX47uy8mlM0GMWQ==/19218363741925314.jpg",
      ...localMp3("still-apart.mp3"),
      href: "https://music.163.com/#/song?id=465921195",
    },
    {
      title: "晴れゆく空", artist: "RADWIMPS", album: "天気の子",
      cover: "https://p1.music.126.net/dRwInA9PpkiKkmNWeUvi0w==/109951164220136544.jpg",
      ...localMp3("clearing-sky.mp3"),
      href: "https://music.163.com/#/song?id=1378492140",
    },
    {
      title: "グランドエスケープ (Movie edit)", artist: "三浦透子, RADWIMPS", album: "天気の子",
      cover: "https://p1.music.126.net/dRwInA9PpkiKkmNWeUvi0w==/109951164220136544.jpg",
      ...localMp3("grand-escape-movie-edit.mp3"),
      href: "https://music.163.com/#/song?id=1378491296",
    },
    {
      title: "痛快", artist: "Aioz, 董唧唧", album: "痛快",
      cover: "https://p1.music.126.net/4d0TEEUvB9vjolovUiB0Vw==/109951164744024471.jpg",
      ...localMp3("happy.mp3"),
      href: "https://music.163.com/#/song?id=1426233208",
    },
    {
      title: "我该怎么描述遗憾", artist: "莫得桑, 刘宏宇Honey L", album: "我该怎么描述遗憾",
      cover: "https://p1.music.126.net/2y7TT5kS8O1iNlrEDoYdbg==/109951169210378440.jpg",
      ...localMp3("regret.mp3"),
      href: "https://music.163.com/#/song?id=2111736129",
    },
    {
      title: "不再联系", artist: "夏天Alex", album: "不再联系",
      cover: "https://p1.music.126.net/1IyS4hDwsxgzIObfQU5__g==/71468255818380.jpg",
      ...localMp3("no-contact.mp3"),
      href: "https://music.163.com/#/song?id=175072",
    },
    {
      title: "我爱他", artist: "王小帅", album: "我爱他",
      cover: "https://p1.music.126.net/BHiLD5MChwKG6pveY1qX7g==/109951171482536944.jpg",
      ...localMp3("i-love-him.mp3"),
      href: "https://music.163.com/#/song?id=1412022967",
    },
    {
      title: "好久不见", artist: "陈奕迅", album: "认了吧",
      cover: "https://p1.music.126.net/o_OjL_NZNoeog9fIjBXAyw==/18782957139233959.jpg",
      ...localMp3("long-time-no-see.mp3"),
      href: "https://music.163.com/#/song?id=65538",
    },
    {
      title: "遥不可及的你(Live)", artist: "花粥", album: "花粥2019“两碗三百”巡演LIVE",
      cover: "https://p1.music.126.net/dbLkqitOHj-l9_W3XWJN2g==/109951164836699487.jpg",
      ...localMp3("unreachable-you-live.mp3"),
      href: "https://music.163.com/#/song?id=1433736573",
    },
    {
      title: "不如不见面", artist: "王极, 梁淞Tsong", album: "不如不见面",
      cover: "https://p1.music.126.net/HPNMl6kw6crK_dDIzG2iVg==/109951169682298615.jpg",
      ...localMp3("better-not-meet.mp3"),
      href: "https://music.163.com/#/song?id=572980533",
    },
    {
      title: "卡农（经典钢琴版）", artist: "dylanf", album: "卡农Canon in D",
      cover: "https://p1.music.126.net/fL7FAeRby1s7JreBqoOKjg==/109951165175371079.jpg",
      ...localMp3("canon-piano.mp3"),
      href: "https://music.163.com/#/song?id=478507889",
    },
    {
      title: "愛にできることはまだあるかい (Movie edit)", artist: "RADWIMPS", album: "天気の子",
      cover: "https://p1.music.126.net/dRwInA9PpkiKkmNWeUvi0w==/109951164220136544.jpg",
      ...localMp3("is-there-still-anything-love-can-do-movie-edit.mp3"),
      href: "https://music.163.com/#/song?id=1378492142",
    },
    {
      title: "一般的一天", artist: "Wiz_H张子豪", album: "一般的一天",
      cover: "https://p2.music.126.net/ldE9ZonTO_PbRxOcQz7KFg==/109951168667718667.jpg",
      ...localMp3("ordinary-day.mp3"),
      href: "https://music.163.com/#/song?id=2054300084",
    },
    {
      title: "最后的旅行（伴奏）", artist: "上杉绘梨衣", album: "龙族",
      cover: "https://p2.music.126.net/hlEe-IWaFrXwXjwAj69Flw==/109951170006323682.jpg",
      ...localMp3("last-journey-instrumental.mp3"),
      href: "https://music.163.com/#/song?id=2632584632",
    },
  ] satisfies HomeTrack[],
  illustration: { src: "/hero-avatar-05.jpg", hover: "/hero-avatar-04.jpg", alt: "噜噜的电影时刻" },
} as const
