export interface HomeTrack {
  title: string
  artist: string
  album: string
  cover: string
  src: string
  mimeType: string
  href: string
}

const applePreview = (src: string) => ({ src, mimeType: 'audio/mp4; codecs="mp4a.40.2"' } as const)

// Edit personal content here. Playlist metadata comes from the public NetEase
// playlist; direct playback uses confirmed HTTPS previews where available.
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
      title: "Color Your Night", artist: "Lotus Juice, 高橋あず美, ATLUS GAME MUSIC",
      album: "ペルソナ3 リロード オリジナル・サウンドトラック",
      cover: "https://p1.music.126.net/wV5oF-XNh-RsjrYzmBbe3w==/109951172181637798.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/32/75/ae/3275ae8f-b72b-a742-71f8-89c7a6edd7c4/mzaf_7866588247365893353.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=2123807718",
    },
    {
      title: "红", artist: "罗言", album: "When the world is came，take it！",
      cover: "https://p1.music.126.net/G-inyKjA-jO5MuOuV3g7Pg==/109951167027986653.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/14/86/3d/14863d27-303e-d0cb-751f-fbe69d437df6/mzaf_11966529949809566500.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=1918576268",
    },
    {
      title: "还是分开", artist: "张叶蕾", album: "还是分开",
      cover: "https://p1.music.126.net/tH5FdakJX47uy8mlM0GMWQ==/19218363741925314.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/69/28/a0/6928a0ed-f26d-bf93-7fe9-626d0e96f41a/mzaf_11681966968364511203.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=465921195",
    },
    {
      title: "晴れゆく空", artist: "RADWIMPS", album: "天気の子",
      cover: "https://p1.music.126.net/dRwInA9PpkiKkmNWeUvi0w==/109951164220136544.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b9/42/e4/b942e4ea-a3c4-4f88-e246-8b6c7745bd54/mzaf_7036707976427874414.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=1378492140",
    },
    {
      title: "痛快", artist: "Aioz, 董唧唧", album: "痛快",
      cover: "https://p1.music.126.net/4d0TEEUvB9vjolovUiB0Vw==/109951164744024471.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/45/cc/17/45cc17c9-5963-cb95-0b8c-33a7c092f815/mzaf_14660695672884565463.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=1426233208",
    },
    {
      title: "我该怎么描述遗憾", artist: "莫得桑, 刘宏宇Honey L", album: "我该怎么描述遗憾",
      cover: "https://p1.music.126.net/2y7TT5kS8O1iNlrEDoYdbg==/109951169210378440.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/93/51/65/93516585-c172-ce0b-4a4a-34225896ec3e/mzaf_6691274926752410753.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=2111736129",
    },
    {
      title: "不再联系", artist: "夏天Alex", album: "不再联系",
      cover: "https://p1.music.126.net/1IyS4hDwsxgzIObfQU5__g==/71468255818380.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/8f/ca/b6/8fcab6b5-2397-54d4-8c2e-5a43f396f50d/mzaf_8929340981270531818.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=175072",
    },
    {
      title: "我爱他", artist: "王小帅", album: "我爱他",
      cover: "https://p1.music.126.net/BHiLD5MChwKG6pveY1qX7g==/109951171482536944.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/9b/12/c8/9b12c824-6c06-c9e6-5ea4-bc6ba2a4c6ce/mzaf_6479825854719730853.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=1412022967",
    },
    {
      title: "好久不见", artist: "陈奕迅", album: "认了吧",
      cover: "https://p1.music.126.net/o_OjL_NZNoeog9fIjBXAyw==/18782957139233959.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/1f/1f/071f1f75-6b42-e932-e8a3-cf5f1e019b6d/mzaf_15016512238504534591.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=65538",
    },
    {
      title: "遥不可及的你(Live)", artist: "花粥", album: "花粥2019“两碗三百”巡演LIVE",
      cover: "https://p1.music.126.net/dbLkqitOHj-l9_W3XWJN2g==/109951164836699487.jpg",
      ...applePreview("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/56/61/d6/5661d67c-43ae-e03e-8103-fe90356ad078/mzaf_7822685735505503353.plus.aac.p.m4a"),
      href: "https://music.163.com/#/song?id=1433736573",
    },
  ] satisfies HomeTrack[],
  illustration: { src: "/hero-avatar-05.jpg", hover: "/hero-avatar-04.jpg", alt: "噜噜的电影时刻" },
} as const
