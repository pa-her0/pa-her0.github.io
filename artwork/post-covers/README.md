# 文章封面 · Anime v1

- 更新日期：2026-10-04
- 生成方式：内置 image_gen（不是外部 API 或命令行生成）。
- 范围：原本引用 `/post-covers/*.jpg` 线稿的 36 篇文章；正文、标题、发布日期没有改动。
- 新图：`public/post-covers/anime-v1/*.webp`，横版约 16:9；旧 JPG 保留。
- [本地封面总览](preview.html)
- [逐张生成提示词](anime-cover-prompts.json)
- [生成原图位置](generated-files.json)
- `node scripts/prepare-anime-covers.mjs` 从保留的原图重新输出 WebP；原图位于生成时的本机目录，因此其他电脑需要先取得原图并更新清单中的 source。

## 提示词补充

基础提示词和逐张主题、标题、人物、配色、图示见 JSON。后续批次附加约束：Use a clean almost-solid pastel background, no detailed scenic environment. Keep labels exact; do not invent additional paragraphs, factual claims or sample results. Diagrams must be conceptual and correct.

两张图在生成后进行了局部修订，最终采用修订版本：

- `2025-09-21-ai`：保留人物、版式和标题，只将回答气泡改为“看起来很合理，但还需要核实。”；移除服务商标志，换成通用 AI 图标。
- `2025-03-25-old-alogrithm`：保留左侧拆分过程，右侧合并输入改为已排序的 [1, 4] 与 [2, 3]，输出为 [1, 2, 3, 4]。

## 对应文章

- Astro 的开始 → `astro-start.webp`
- 服务器:Time Out? → `2025-08-27-connect-error.webp`
- 为什么AI胡言乱语 → `2025-09-21-ai.webp`
- GiT仓库管理 → `2025-08-26-git.webp`
- OrangePi5部署YOLO推理模型 → `2025-04-15-yolo-orangepi5.webp`
- 如何在服务器上部署外置大脑？ → `2026-07-19-how-to-deploy-cc.webp`
- 服务器上实验的相关优化策略 → `2026-07-28-my-post.webp`
- Python算法学习--备战蓝桥杯 → `2025-03-24-python.webp`
- 算法笔记1.0 → `2025-03-25-old-alogrithm.webp`
- 开端 → `2025-03-25-start.webp`
- 数据库基础知识 → `2025-04-12-dataset.webp`
- Latex基础公式学习 → `2025-04-28-latex.webp`
- 文字的魅力 → `2025-04-30-beauty-of-chinese.webp`
- 算法笔记2.0 → `2025-05-16-alogrithm-note2.webp`
- 牛客赛 → `2025-06-10-on-time-nowcoder.webp`
- 基于YOLO的神经网络剪枝条 → `2025-06-14-yolo-basic.webp`
- 操作系统笔记-王道考研 → `2025-06-19-operation-system.webp`
- 毛概复习(全面版) → `2025-06-29-maozedong.webp`
- 情绪传播机制--相关文献调研 → `2025-07-05-emotion-article.webp`
- 人工合成网络--相关文献调研 → `2025-07-09-network.webp`
- 生成式对抗网络(GAN)--相关文献调研 → `2025-07-12-gan.webp`
- 科研思考1.0 → `2025-07-16-thinking1.webp`
- 科研思考2.0 → `2025-07-21-thinking2.webp`
- 算法小记 → `2025-07-25-alogrithm-note.webp`
- 暑假闲事-基础技能 → `2025-08-03-basical-knowledge.webp`
- 学习麻花 → `2025-08-05-four-popular-ai.webp`
- 秋 → `2025-08-07-autumn.webp`
- 最近 → `2025-09-18-last.webp`
- 数据结构(算法) → `2025-09-21-alogrithm-structure.webp`
- 图论(算法) → `2025-10-27-graph.webp`
- 数学(算法) → `2025-10-27-math.webp`
- 贝叶斯 AND KNN → `2025-11-12-knn-bayesi.webp`
- NLP--基础知识 → `2025-12-25-nlp.webp`
- 动手学深度学习 → `2026-01-27-dl.webp`
- 动手学强化学习 → `2026-01-27-rl.webp`
- 未来规划 → `2026-05-12-future-plan.webp`
