# 首页卡片配置

首页参考 LongHZ140516/serein 的 Bento 首页。只改变首页，文章、项目、留言板等页面继续使用原来的内容和路由。原项目的许可见 THIRD-PARTY-NOTICES.md。

## 内容在哪里修改

| 内容 | 文件 / 字段 | 说明 |
| --- | --- | --- |
| 自我介绍 | src/data/home-dashboard.ts → intro | 固定标题与四行简介 |
| 地球位置 | 同文件 → location、coordinates | 文案与经纬度，顺序是纬度、经度 |
| 技术栈 | 同文件 → stack | 图标位于 public/icons/tech |
| 图片堆叠 | 同文件 → gallery | 点击图片将它移到最后，支持键盘操作 |
| 音乐 | 同文件 → tracks | title、artist、album、cover、src、href |
| 翻盘点阵 | 同文件 → flipMatrix | text 设置文字，defaultMode 设置默认模式 |
| 右下角 3D 场景 | 同文件 → aboutScene | title 是标题，scene 是 Spline 导出的场景地址；“了解我”跳转 /about/ |
| 布局和配色 | src/styles/home-bento.css | 样式限定于首页，明暗模式均适配 |
| 卡片交互 | src/components/hero.tsx | 图片、音乐、热力图等 |

中间卡片显示翻盘点阵，最新文章保留在卡片底部的小链接中。首页下方不追加文章列表，全部文章在导航“博客 → 文章”中。

文章列表按最后更新时间倒序排列，卡片日期与年份分组使用同一更新时间。更新时间取文章 `updated`、Git 修改记录与 `published` 中最新的有效日期；未填写 `updated` 且无 Git 修改记录时回退至发表日期。同一更新时间使用文章 slug 稳定排序，避免翻页顺序变化。文章详情、时间线的发表日期字段保留不变。

## 点阵文字配置

在 `src/data/home-dashboard.ts` 中修改：

```ts
flipMatrix: { text: "JIELY", defaultMode: "text" },
```

`text` 支持最多 5 个英文字母、数字、冒号或空格，小写会自动转为大写；超出部分会截断。`defaultMode` 可选 `text`、`time`、`wave`、`noise`。前端只保留模式切换，不提供文字输入框。修改配置后，本地预览自动更新；线上需要重新构建部署。

## 音乐

播放器现在播放实际音频，不再合成音符。默认沿用参考项目中的公开音乐外链（改为 HTTPS），不复制或重新分发歌曲文件。点击播放才请求音频，不自动播放；支持暂停、前后换曲、进度拖动。

外链可能因网络、地区或版权限制失效，页面会提供原站收听链接。也可将有权使用的 MP3 放在 public/music/，把 src 改成 /music/文件名.mp3。切换曲目默认暂停，离开首页停止播放。

## 统计的数据来源

未配置 WakaTime 时：

- 左下角以词云展示实际发表文章的分类和标签，字号按相关文章数量加权；同一文章的同名分类、标签只计算一次。最多取前 28 个主题，空间不足时优先保留高频词，不重复填充词汇。悬停词语可查看数量，配色跟随明暗主题。
- 热力图展示过去 18 周的文章与碎碎念发表数量，每个格子可悬停/聚焦查看日期与数量。
- 月份自动跨月、跨年排列，未来日期不计数。静态部署的数据在重新构建后更新。

如需与参考项目相同的 WakaTime 编程统计，在自己的 WakaTime 后台创建公开分享图表，将 JSON 地址填入 src/data/home-dashboard.ts 的 wakatime：

- languagesUrl：语言时长分享 JSON（data 数组，元素有 name、hours）。
- calendarUrl：日历分享 JSON（days 数组，元素有 date、total，total 单位秒）。

配置后相应卡片自动使用 WakaTime 数据。仅支持 https://wakatime.com/share/ 开头的公开地址；不要填写 API 密钥或私人凭据。未配置不会请求 WakaTime；失败时保留真实博客统计并提示。未将原作者的数据冒充为本博客数据。

## 验证

首页相册使用 `public/home-gallery/` 中的 480px WebP 缩略图；原始 JPG 保留不变。替换原图后执行 `node scripts/optimize-home-images.mjs` 重新生成缩略图。3D 场景进入可视区后延迟约 1.2 秒，再等待浏览器空闲初始化，避免与首屏交互争抢资源；切到后台或离开可视区仍会暂停。开发与生产依赖缓存已分开，构建不会再覆盖开发中的 React 模块。

```powershell
pnpm check
pnpm build
node --experimental-strip-types --test tests/home-activity.test.mjs
```

桌面宽屏按三行卡片展示；平板/手机重新排列并允许纵向滚动，避免为塞进一屏而缩小文字。Blog 导航与原有橙/红配色选择器保留，首页使用独立的参考站浅蓝视觉，其他页面的配色选择不变。
