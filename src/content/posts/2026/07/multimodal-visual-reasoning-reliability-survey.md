---
slug: "multimodal-visual-reasoning-reliability-survey"
title: 当模型“看见但不理解”：多模态视觉推理可靠性问题综述
commentSlug: 'multimodal-visual-reasoning-reliability-survey'
published: 2026-07-31T00:00:00.000Z
draft: false
description: 围绕感知、定位、推理、验证与纠错闭环，系统梳理多模态视觉推理的可靠性问题、代表方法与评测基准。
image: >-
  /report-assets/multimodal-visual-reasoning-reliability-survey/pgrv-framework.png
tags:
  - 机器视觉
  - 多模态
  - 综述
category: 学习
lang: zh-CN
---
> 作者：刘勇杰（42311102）

## 摘要

多模态大模型已从图像描述和视觉问答扩展到多图、视频、3D、像素级理解、长链推理和统一理解与生成。然而，模型“能够回答”并不等于“真正看懂并可靠推理”。本文围绕感知（Perception）、定位（Grounding）、推理（Reasoning）、验证（Verification）和纠错（Correction）构建 PGRVC 闭环，系统梳理视觉证据进入语言推理空间时的主要可靠性问题、代表性方法和评测基准，并讨论多模态幻觉、证据忠实性、过程监督、鲁棒性与主动视觉推理等开放问题。

**关键词：** 多模态大模型；视觉推理；视觉定位；多模态幻觉；过程监督；可靠性

# 引言

**表 1　代表性综述与本文定位比较**

| 综述 | 年份 | 主要对象 | 分类主线 | 与本文的关系 |
| --- | --- | --- | --- | --- |
| Multimodal ML Survey | 2019 | 多模态机器学习 | 表示、翻译、对齐、融合、协同学习 | 建立经典任务分类，但主要形成于现代MLLM之前。 |
| Unified MUG Survey | 2025 | 理解与生成统一模型 | 架构、tokenizer、训练目标 | 梳理统一理解与生成范式，但可靠推理不是主线。 |
| MMR Survey | 2025 | 多模态数学推理 | 感知、对齐、推理 | 提供PAR框架，但主要面向数学推理任务。 |
| 本文 | 2026 | 可靠多模态视觉推理 | PGRVC闭环与可靠性评测 | 围绕视觉证据、推理过程和纠错机制组织可靠性综述。 |


<figure id="fig:pgrv">
<img src="/report-assets/multimodal-visual-reasoning-reliability-survey/pgrv-framework.png" alt="" />

<figcaption>PGRVC闭环分析框架。验证与纠错把错误信号反馈到感知、Grounding和推理阶段，使视觉证据、推理过程与最终答案形成可检查的闭环。</figcaption>
</figure>

图像描述模型将卷积视觉特征映射为自然语言句子，证明视觉到语言生成可以通过端到端神经网络学习。随后，视觉–语义嵌入和区域级图文对齐把视觉类别、图像区域和语言片段置于同一语义空间。CLIP进一步用大规模自然语言监督学习可迁移视觉表示，ALBEF则强调在跨模态融合前先建立图文对齐。在大语言模型成为通用推理接口之后，Flamingo、BLIP和BLIP-2等工作把冻结视觉编码器、连接模块和语言模型组合起来，使模型能够处理交错图文输入并进行开放式回答。

然而，多模态视觉推理的可靠性并没有随模型规模自动解决。首先，视觉编码器或token压缩可能遗漏小目标、细粒度属性、深度关系、运动方向和事件边界。其次，全局图文对齐并不保证对象、属性和关系在区域或像素层面绑定正确，绑定错误会在问答和推理链中被放大。再次，模型在视觉证据与文本提示冲突时可能更相信文本先验，在长链推理中可能生成视觉上不成立的中间步骤。最后，许多基准只检查最终答案，无法区分答案偶然正确、证据错误、过程错误和鲁棒性不足。

已有综述各有重点。Multimodal Machine Learning从表示、翻译、对齐、融合和协同学习角度提供了经典分类，但其主要形成于现代MLLM之前。统一多模态理解与生成综述关注理解模型和生成模型在架构、tokenizer和训练目标上的统一趋势，但可靠推理不是主线。多模态数学推理综述围绕数学题中的感知、对齐和推理组织文献，为过程验证提供启发，但覆盖的视觉输入和可靠性问题相对集中。本文不同于这些综述：我们不按年份罗列模型，也不泛泛介绍所有多模态大模型，而是围绕可靠视觉推理构建闭环分析框架，分析视觉证据如何被提取、绑定、推理、验证并修正。

本文贡献如下。第一，构建PGRVC分析框架，将Perception、Grounding、Reasoning、Verification和Correction作为可靠视觉推理的五个阶段，强调可靠性来自证据、绑定、推理、验证和纠错的协同，而不是单一模型规模。第二，按证据形式、作用阶段、监督信号、验证机制和典型失效模式组织代表性工作，覆盖视觉token、结构化感知、视频时空理解、区域/像素级定位、多步推理、过程奖励和幻觉缓解。第三，将评测体系整理为Answer、Evidence、Process和Executability四级验证对象，并把Robustness作为横向鲁棒性维度，避免用单一准确率概括复杂可靠性问题。

# 基础概念与发展脉络

<figure id="fig:timeline">
<img src="/report-assets/multimodal-visual-reasoning-reliability-survey/timeline.png" alt="" />

<figcaption>2011–2025年多模态视觉推理的发展脉络。早期工作侧重表示学习和图文对齐，后续模型逐步转向统一架构、长链推理和可靠性验证。</figcaption>
</figure>

<figure id="fig:arch">
<img src="/report-assets/multimodal-visual-reasoning-reliability-survey/architecture-evolution.png" alt="" />

<figcaption>多模态模型架构从双编码器、对齐后融合和连接器接口，逐步演进到多编码器、统一tokenizer以及多图、视频和3D输入。</figcaption>
</figure>

<figure id="fig:ar-diffusion-encoding">
<img src="/report-assets/multimodal-visual-reasoning-reliability-survey/ar_diffusion_encoding_original.png" />
<figcaption>统一多模态理解与生成模型中的像素、语义、查询和混合编码范式，根据文献[12]整理。不同编码路径决定了视觉证据进入语言推理空间的粒度和损失边界。</figcaption>
</figure>

<figure id="fig:unified-roadmap">
<img src="/report-assets/multimodal-visual-reasoning-reliability-survey/unified_models_original.png" />
<figcaption>公开与非公开统一多模态模型的发布时间线，根据文献[12]整理。模型发布节奏显示，理解、生成和多输入形态正在向同一视觉语言接口汇聚。</figcaption>
</figure>

## 文献检索与筛选标准

本文检索CVPR、ICCV、ECCV、NeurIPS、ICML、ICLR、ACL/EMNLP及TPAMI等主要来源，重点覆盖2023–2025年多模态视觉推理、视觉grounding、幻觉检测、过程验证和纠错方法；对于统一多模态基础架构，适当追溯至2011–2022年的代表性工作。纳入标准包括：研究对象与视觉证据、跨模态绑定、推理过程、验证机制或纠错机制直接相关；方法或基准能够解释可靠性问题的来源；实验对象覆盖图像、视频、多图、3D、文档图表或像素级输入之一。排除标准包括：仅报告通用模型发布而缺少可靠性分析、仅关注纯文本推理、或与视觉证据链无直接关系。基于上述标准，本文最终纳入59篇代表性文献，并按PGRVC阶段而非发表年份组织讨论。

## 可靠视觉推理的形式化定义

给定视觉输入$x$和问题$q$，多模态模型可被表示为输出三元组
$
\mathcal{M}(x,q)=(\hat{y},\hat{E},\hat{R}),
$
其中$\hat{y}$为最终答案，$\hat{E}$为模型显式或隐式依赖的视觉证据，$\hat{R}$为可读或可复核的推理过程。可靠性不仅要求$\hat{y}=y^{*}$，还要求$\hat{E}\approx E^{*}$、$\hat{R}\vDash\hat{E}$且$\hat{R}\Rightarrow\hat{y}$，即答案正确、证据定位正确、推理过程与证据一致，并且过程能够推出答案。需要注意的是，可读的思维链并不必然等于模型内部真实计算路径，因此过程级评测还应检查关键证据被删除、替换或扰动后，答案和中间结论是否发生相应变化。

## 从多模态表示到连接器接口

早期研究回答的是如何学习跨模态共享表示。Multimodal Deep Learning证明多模态训练可以提升单模态特征质量，DeViSE将视觉类别映射到文本语义空间以支持开放类别泛化，Deep Visual-Semantic Alignments把全局类别推进到区域与句子片段对齐，Show and Tell则建立了视觉编码器到语言解码器的生成范式。随后，CLIP以大规模自然语言监督学习可迁移视觉表示，ALBEF强调先对齐后融合，Flamingo、BLIP和BLIP-2进一步通过连接模块（connector）把冻结视觉编码器接入LLM。这些工作构成现代MLLM的基础，但它们主要优化全局语义对齐和开放式生成，并不保证区域、对象、像素、深度或时间证据被忠实传入语言推理空间。

## 可靠性问题前移

近期模型把可靠性问题前移到数据、视觉表示和计算结构，而不是只在语言推理端补救。数据侧，Molmo/PixMo用高质量描述、自由问答和2D指点数据增强可观察证据，MM1.5系统分析OCR、合成描述和视觉指令数据对不同能力的影响。表示侧，TokenFlow试图在统一tokenizer中兼顾语义和像素信息，Eagle通过多视觉编码器组合扩大视觉前端覆盖范围。输入形态侧，LLaVA-Interleave和UniVLG分别处理多图、视频、3D交错输入和2D到3D grounding迁移。系统侧，LV-XAttn降低长视觉输入的cross-attention通信开销。这些路线共同说明，视觉证据在进入推理之前已经被数据分布、tokenizer、connector和计算预算筛选；一旦对象、位置或时序信息在接口处丢失，后续LLM很难仅凭语言推理恢复。

# 视觉感知：模型看到了什么

**表 2　2025 年代表性工作的 PGRVC 定位与可靠性维度**

| PGRVC阶段 | 代表工作 | 证据粒度 | 监督/成本 | 验证或纠错信号 | 主要失效边界 |
| --- | --- | --- | --- | --- | --- |
| Perception | Molmo/PixMo; TokenFlow; Eagle; SSR | 描述、深度、visual token | 数据/结构成本较高 | 可观察证据覆盖度 | 小目标、低频事件和深度关系仍易丢失。 |
| Grounding | TCRT; Few Heads; ROD-MLLM; UniPixel | 区域、对象、mask、像素 | 需要定位监督或诊断 | 区域匹配、注意力、mask一致性 | 全局对齐正确时仍可能局部绑定错误。 |
| Reasoning | GFlowVLM; Insight-V; OpenVLThinker; VideoChat-R1.5 | 图像/视频证据与CoT | SFT/RL或测试时搜索 | 路径得分、过程奖励、答案一致性 | 推理文本可读但未必真实依赖视觉证据。 |
| Verification | MME-CoT; MIRAGE; TOMATO; PhysBench | 答案、证据、过程、规则 | 评测或验证器成本 | 过程质量、帧序敏感性、物理约束 | 验证器可能继承语言先验或缺少视觉观察。 |
| Correction | DPO; ClearSight; Nullu; Hidden Life; Critic-V | 偏好、视觉强度、logits、反馈 | 训练或推理额外成本 | 偏好反馈、视觉增强、critic信号 | 无外部反馈时可能自我强化错误。 |


## 局部细节与全局上下文

研究问题是模型如何同时保留任务相关细节和全局语义。Local-to-Global Attention指出，随机裁剪等增强可能引入背景噪声或使模型过度关注局部细节，因此用注意力引导的裁剪和特征选择补充全局上下文。What’s in the Image?从模型内部分析VLM如何在查询token、层和注意力头中保存图像信息，说明“模型看到了什么”需要通过内部表征诊断而非只看最终回答。Molmo/PixMo则从数据侧补足感知，使用高质量图像描述和2D pointing数据帮助模型建立更细的视觉观察能力。

这三类方法分别对应输入选择、内部诊断和数据构建。Local-to-Global Attention不改变基础VLM，而是改变视觉信息选择方式；What’s in the Image?不直接提高模型，而是揭示视觉信息在模型内部的存储机制；Molmo/PixMo通过数据覆盖提升模型可见证据的质量。局限在于，注意力选择可能错过低显著但关键的证据，内部诊断结论可能随模型结构变化，高质量数据也难以覆盖所有细粒度关系。

## 结构化视觉感知

可靠推理需要的不只是图像token，还包括对象、深度、空间结构和像素级信息。Perception Tokens把深度图、检测框等中间视觉结果转化为模型可生成和使用的辅助token，使视觉感知结果成为类似思维链的中间证据。SSR将深度信息转化为结构化rationale，再蒸馏为可接入VLM的latent embedding，用于增强空间推理。UniPixel把对象指代、分割和像素级视觉推理统一起来，补足整体图像理解模型缺少像素对齐的问题。Visual Structures Help Visual Reasoning则指出LVLM常受binding problem限制，通过在视觉输入中加入低层空间结构并配合顺序解析提示，帮助模型把视觉特征绑定到正确对象。

这些方法的共同点是显式结构化视觉证据。差异在于Perception Tokens和SSR引入可推理的中间表示，UniPixel把输出粒度推进到像素级，VISER则通过输入结构而非训练新模型来改善绑定。它们说明结构化视觉信息能够改善后续推理，但也带来新的问题：结构来自外部工具、训练监督或输入改造时，结构本身的错误会成为后续推理的上游噪声。

## 视频时空感知

视频推理的难点不只是输入更长，而是证据具有时间位置、对象身份和运动关系三种约束。现有方法大致对应三种处理方式。第一类显式保留时空位置，例如LLaVA-ST用语言对齐的位置嵌入和Spatial-Temporal Packer组织细粒度空间–时间信息，DTOS用专门token表示事件边界和目标位置，用文本引导clip sampler降低关键片段漏采样风险。第二类先建立跨帧对象关联，再把关联结果作为推理证据；Coarse Correspondences使用跟踪模型提取帧间或视角间对象粗对应，优点是不必改动MLLM，局限是依赖外部跟踪质量。第三类控制进入上下文的证据量，BOLT在长视频中选择与查询相关的帧，PAVE则通过轻量patch让Video-LLM利用音频、3D cues或多视角视频等侧通道信息。MotionBench的意义在于补上评测侧约束：如果基准不能区分运动方向、动态变化和静态场景线索，模型的“视频理解”容易被高估。

因此，视频可靠性应从三个问题评价：关键帧是否被选中，对象身份是否跨帧保持，运动或事件关系是否真正参与答案。不同方法的训练成本并不等价，BOLT和Coarse Correspondences更接近推理时证据选择或外部提示，LLaVA-ST、PAVE和DTOS需要更明确的模型适配或任务训练。共同边界也更清楚：所有方法都要压缩视频证据，长视频中的低频事件、遮挡对象和跨片段因果关系仍可能在进入LLM之前丢失。

## 多图和三维感知

多图和3D输入要求模型跨视角整合证据。LLaVA-Interleave通过交错视觉指令调优把多图、多帧视频和多视角3D放进统一模型。MMIE把图文交错理解扩展到多图、视频和3D场景，暴露模型在复杂交错上下文中的不足。Thinking in Space用VSI-Bench评估模型能否从连续视频观察中形成空间记忆并回答空间问题。UniVLG则通过共享语言条件mask decoder和2D-to-3D lifting，将2D视觉语言模型迁移到3D grounding。

四者的差异在于：LLaVA-Interleave重在统一输入形式，MMIE重在评测复杂交错理解，Thinking in Space重在空间记忆和召回，UniVLG重在2D/3D grounding结构。多图和3D推理的难点不是简单增加图像数量，而是如何维持跨视角对象身份、空间关系和尺度一致性。

# 视觉定位与跨模态绑定

**表 3　感知与 Grounding 方法比较**

| 方法 | 视觉表示 | 结构形式 | PGRVC阶段 | 核心贡献 |
| --- | --- | --- | --- | --- |
| Perception Tokens | 深度/检测token | 显式中间表征 | Perception + Reasoning | 将视觉结构转化为可生成、可引用的证据。 |
| SSR | 深度rationale/latent | 深度理据 | Perception + Reasoning | 用深度信息增强空间推理。 |
| VISER | 低层空间结构 | 输入结构化 | Grounding + Reasoning | 通过顺序解析缓解对象绑定错误。 |
| TCRT | 文本相关视觉特征 | 跨模态精炼 | Grounding | 按任务语义选择相关视觉证据。 |
| Few Attention Heads | 注意力图 | 隐式定位头 | Grounding | 在冻结模型中定位少量关键注意力头。 |
| UniPixel | mask/像素对齐 | 像素级表征 | Grounding + Reasoning | 统一指代、分割和像素级视觉推理。 |
## 视觉Token与语言模型接口

视觉token与LLM接口决定证据能否进入推理空间。CLIP式双编码器适合全局对齐，但缺少token级交互。ALBEF在对齐后引入跨模态融合。BLIP-2的Q-Former通过少量查询token从冻结视觉编码器提取信息，Flamingo用Perceiver Resampler和跨注意力处理交错视觉输入。从统一理解模型的架构归纳看，Connector大致可分为三类：projection-based接口用MLP或线性投影压缩视觉特征，query-based接口用可学习查询从视觉编码器中抽取证据，fusion-based接口在语言模型内部通过跨注意力或多头注意力融合视觉信息。2025年的TokenFlow、多编码器Eagle和LV-XAttn分别从统一tokenizer、多视觉前端和长视觉cross-attention角度扩展接口。

接口设计的根本权衡是压缩与忠实性。少量token降低计算成本，却可能抹去小目标和局部关系；更多视觉token保留证据，却增加上下文和显存负担。可靠推理因此要求接口不仅传递语义，还要保留可定位、可回溯、可验证的视觉证据。

## 区域级和像素级定位

区域级定位解决语言表达对应哪一块视觉区域的问题。TCRT利用LLM任务先验和跨模态特征精炼提升视觉grounding。Few Attention Heads发现冻结LVLM中少数attention heads已有定位能力，因此可通过文本到图像的注意力图实现训练无关grounding。ROD-MLLM把可靠目标检测引入MLLM，特别强调对不存在对象的拒识能力。UniPixel进一步把对象指代和分割统一到像素级视觉推理中。

这些方法形成从区域框到像素mask、从监督训练到训练无关挖掘、从检测到拒识的谱系。TCRT和ROD-MLLM依赖任务数据和专门模块，Few Attention Heads成本低但受注意力质量限制，UniPixel粒度最细但需要更高标注和计算成本。它们共同表明，全局图文对齐良好并不意味着对象级或像素级grounding可靠。

## 视觉–语言绑定问题

绑定问题指模型无法稳定地把属性、关系或文本短语绑定到正确视觉对象。Words or Vision通过文本扰动发现VLM在图文冲突时可能过度相信文本，这意味着语言先验会干扰视觉绑定。VISER从输入结构入手，通过低层空间结构和顺序解析提示改善计数、视觉搜索和空间关系任务。Semantic Grounding Correction则研究模型是否能在无微调、无oracle反馈的条件下自我修正grounding错误。

三者分别揭示绑定错误的来源、输入侧缓解方式和自我纠错可能性。它们也提醒：绑定可靠性不能只通过最终问答准确率衡量，而需要检查文本短语、视觉区域和推理步骤是否一致。

# 多模态视觉推理

**表 4　推理、强化学习和测试时扩展方法比较**

| 方法 | 推理范式 | 监督信号 | 推理时机制 | 核心贡献 |
| --- | --- | --- | --- | --- |
| Insight-V | 长链视觉推理 | 推理轨迹数据 | 长链生成 | 为复杂视觉任务构造更充分的思维链。 |
| GFlowVLM | 多路径搜索 | GFlowNet奖励 | 多样路径采样 | 探索多解空间，避免单一路径坍缩。 |
| OpenVLThinker | 迭代SFT—RL | SFT与RL循环 | 反思式推理 | 通过训练循环优化复杂视觉语言推理。 |
| Chain-of-Step | 步骤级推理 | 过程奖励模型 | 步骤质量评估 | 将奖励粒度推进到中间推理步骤。 |
| VideoChat-R1.5 | 迭代感知 | 时空监督RL | 动态区域聚焦 | 在测试时重新分配视觉注意力。 |
| BOLT | 长视频选择 | 无训练 | 查询相关采样 | 从长视频中选择与问题相关的证据帧。 |
## 直接推理与多模态思维链

直接生成答案容易掩盖视觉证据缺失，因此近年工作开始构造或评估多模态思维链。Insight-V关注长链视觉推理数据和训练流程，试图让MLLM在复杂任务中生成更充分的推理路径。MME-CoT从质量、鲁棒性和效率三个维度评估多模态CoT，覆盖数学、科学、OCR、逻辑、时空和一般场景。GFlowVLM用生成流网络鼓励多样化推理路径，而不是只优化单一最大回报轨迹。

比较来看，Insight-V偏向数据和训练，MME-CoT偏向评测，GFlowVLM偏向搜索式训练目标。它们共同改变了“回答即推理”的假设，但仍面临过程真实性问题：模型生成的推理链可能语言上连贯，却未必对应真实视觉证据。

## 多路径搜索与强化学习

当视觉问题需要搜索、规划或逐步检查时，单一路径推理不足。GFlowVLM通过GFlowNet鼓励多路径解。OpenVLThinker提出SFT与RL交替：SFT先激活潜在推理行为，RL再优化复杂视觉语言推理。Chain-of-Step Reasoning把推理拆成步骤级单元，并用过程奖励模型评估中间步骤。VideoChat-R1.5把RL与时空监督结合，在测试时通过迭代感知逐步聚焦高置信区域。

这些方法的关键差异在奖励粒度和视觉反馈位置。GFlowVLM关注多样路径分布，OpenVLThinker关注训练循环，Chain-of-Step关注步骤奖励，VideoChat-R1.5把感知本身放入推理迭代。开放问题是：奖励模型是否真正看懂图像，以及RL优化是否会把错误视觉启发固化为高奖励策略。

## 迭代感知与测试时扩展

迭代感知的核心思想是推理过程中可以重新观察。VideoChat-R1.5通过Visual Test-Time Scaling让模型在推理时逐步更新时空关注。BOLT虽然不做强化学习，但也在推理时选择相关帧，属于长视频证据选择的测试时扩展。Self-Reflective Tokens则让模型在知识型VQA中判断是否需要外部知识，从而触发额外检索或反思。

这类方法把计算从训练阶段部分转移到推理阶段，适合长视频、多图或知识密集场景。局限是测试时扩展增加延迟和成本，且若第一次关注区域错误，后续迭代可能围绕错误证据不断强化。

## 专项推理能力

专项推理能力可以看作证据需求的不同组合。空间任务要求模型维护对象位置、深度和视角关系，Thinking in Space和SSR分别从空间记忆评测和深度rationale增强这一问题。时间任务要求模型证明答案依赖帧序和运动变化，TOMATO、MotionBench和VidHalluc分别从帧序敏感性、细粒度运动和时间幻觉侧面施压。物理、数学和科学任务进一步要求视觉证据进入符号或因果推理，PhysBench和EMMA分别代表物理世界理解与跨学科图文联合推理。多图、3D和像素级任务则强调跨输入一致性和局部证据可见性，MMIE、LLaVA-Interleave和UniPixel分别对应交错视觉输入、统一多视觉指令调优和像素级对齐。

这些能力之间并非并列清单，而是存在误差传播关系：空间关系错误会改变物理判断，时间定位错误会诱发视频问答幻觉，像素级定位错误会污染对象属性和关系推理。因此，可靠视觉推理需要共享的证据表示和验证机制，而不是为每个任务单独报告一个准确率。

# 验证、纠错与鲁棒性

<figure id="fig:error">
<img src="/report-assets/multimodal-visual-reasoning-reliability-survey/error-propagation.png" alt="" />

<figcaption>可靠视觉推理中的错误传播与纠错路径。感知遗漏、绑定错误和关系错误会逐级放大为推理链幻觉，验证和纠错模块需要在中间阶段截断错误传播。</figcaption>
</figure>

**表 5　幻觉检测、验证和纠错方法比较**

| 方法 | 目标问题 | 验证信号 | 干预位置 | 核心贡献 |
| --- | --- | --- | --- | --- |
| MIRAGE | 推理链幻觉 | 感知/推理隔离 | 评测基准 | 区分看错之后的错误和推理诱发幻觉。 |
| VidHalluc | 视频时间幻觉 | 动作、顺序、转场 | 视频评测 | 测量视频模型的时序幻觉。 |
| DPO on-policy | 对象幻觉 | 偏好对齐 | 训练目标 | 强调偏好数据需贴近参考策略。 |
| PerturboLLaVA | 描述幻觉 | 视觉扰动 | 训练数据 | 降低模型对语言先验的依赖。 |
| ClearSight | 对象幻觉 | 视觉信号强度 | 解码阶段 | 在推理时增强视觉证据。 |
| Nullu | 对象幻觉 | HalluSpace | 表示空间 | 通过子空间投影削弱幻觉特征。 |
| Hidden Life/VISTA | 视觉信息衰减 | token logits | 推理阶段 | 在logit层面引导视觉忠实token。 |
| Critic-V | 推理错误 | Critic反馈 | 推理链 | 用独立批评器发现视觉理解和推理错误。 |
## 错误类型与触发信号

本文将多模态幻觉分为四类，并把它们视为闭环纠错的触发信号。第一是感知诱发幻觉，即模型没有看到或误看视觉对象；PerturboLLaVA认为密集图像描述中的幻觉与模型过度依赖语言先验相关，并通过视觉扰动训练降低该依赖。第二是定位和绑定幻觉，即对象存在但属性、关系或短语绑定错误；Words or Vision和VISER分别从模态偏置和binding problem角度揭示该问题。第三是推理诱发幻觉，即感知正确但推理链出现逻辑或事实错误；MIRAGE专门构造这类情形以区分感知错误和推理错误。第四是视频时间幻觉，VidHalluc从动作、时间顺序和场景转移上评估视频MLLM幻觉。这四类错误分别对应重观察、重定位、重推理和时间一致性检查，因此能够把幻觉检测结果转化为PGRVC闭环中的反馈路径。

## Verification：答案、证据与过程验证

最终答案正确不代表推理过程正确。Verification阶段需要同时检查答案是否正确、证据是否存在、推理步骤是否由证据支持。Critic-V把Reasoner和Critic拆开，由Critic检查视觉理解和推理路径中的错误。Chain-of-Step Reasoning把推理拆为步骤并使用过程奖励评估中间步骤。MME-CoT提供质量、鲁棒性和效率指标，避免只奖励更长的CoT。MIRAGE进一步指出，即便图像被正确感知，推理链仍可能出现幻觉。

这些方法体现了从结果验证到过程验证的转移，但过程验证不能只检查文本是否流畅。语言模型生成的推理文本不一定等于模型内部真实计算路径，因此更可靠的验证应检查：删除被声称使用的视觉证据后答案是否变化，替换关键区域后中间结论是否相应改变，推理中提到的对象是否可以定位，以及中间结论能否由检测、OCR、分割、物理规则或程序工具复核。问题在于，验证器自身也可能缺少视觉证据或受语言先验影响，因此验证器应尽量具备独立视觉观察能力，而不是只检查文本推理链。

## Correction：重观察、重定位与重推理

Correction阶段不是一般意义上的“减少幻觉”，而是把验证信号反馈到具体出错位置。若错误来自视觉遗漏，系统需要重观察或增强视觉信号；若错误来自短语与区域绑定，系统需要重定位；若错误来自证据组合或逻辑链，系统需要重推理。数据与偏好优化方面，DPO on-policy data指出偏好样本必须贴近参考策略，否则DPO对幻觉的缓解不稳定。视觉扰动训练方面，PerturboLLaVA通过扰动视觉信号训练模型减少语言先验依赖。视觉信号增强方面，ClearSight在推理时增强视觉证据，而不是简单压制语言先验。表示空间干预方面，Nullu识别HalluSpace并将特征投影到其零空间。Token logit引导方面，Hidden Life of Tokens发现视觉信息会在生成过程中衰减，并提出VISTA在logit层面引导视觉忠实token。Critic反馈方面，Critic-V用独立批评模块捕捉错误。自我纠错方面，Semantic Grounding Correction表明模型可通过合适提示迭代修正grounding错误。

这些方法的差异在于是否需要训练、是否改变模型权重、是否依赖外部验证以及反馈回到哪个阶段。一个真正的闭环还需要停止条件：当验证分数高于阈值时接受答案；当证据不足时重观察；当绑定不一致时重定位；当逻辑不成立时重推理；当多轮修正后不确定性仍然存在时拒答。没有一种方法能覆盖全部幻觉来源：DPO依赖偏好数据，扰动训练依赖扰动设计，表示干预依赖子空间估计，Critic依赖自身视觉能力，自我纠错可能在无外部反馈时陷入错误循环。

## 时序一致性和鲁棒性

视频模型的可靠性还包括时间一致性。Video Temporal Consistency通过一系列探针检查模型的时间定位回答是否与初始grounding一致。TOMATO指出很多视频问题可以用单帧或乱序帧解决，因此需要多帧增益和帧序敏感性指标。SVLTA用合成视频情境控制时间分布和语言描述，测试视觉–语言时间对齐。VidHalluc则直接评估动作、时间序列和场景转移幻觉。

这些评测共同说明：视频理解的准确率如果不控制帧序、事件边界和视觉差异，可能高估模型真正的时间推理能力。

# 数据集与评测

现有数据集已经覆盖从单图、多图、视频、3D、多视角、文档图表到像素级任务的多种视觉输入形态。不同输入形态对应的错误模式并不相同：静态图像更容易暴露对象、属性和空间关系错误，视频任务更强调帧序、事件边界和动作持续性，多视角与3D任务则要求模型在视角变化中保持空间记忆与证据一致性。单图和多图数据主要检验问答、描述、定位、跨图一致性与交错理解；视频和3D数据进一步引入时间顺序、运动、空间记忆和视角变换；图表、文档和视觉数学数据则强调OCR、符号推理和可执行计算。已有综述显示，FigureQA、DVQA、PlotQA、ChartQA、IconQA、TabMWP和MathVista等数据集已经提供了大量最终答案监督。因此，可靠视觉推理评测的主要瓶颈不再只是题目数量，而是缺少可定位视觉证据、过程级推理轨迹和可执行验证标注；数据集比较也应同时报告输入形态、证据粒度和复核协议。

本文将相关基准按“四级验证对象+横向鲁棒性维度”重新组织。Answer-level检查最终答案，常用Accuracy、F1或Exact Match；Evidence-level检查区域、帧、对象、mask或深度证据，区别于方法层面的Grounding，强调证据是否可以被评测；Process-level检查每一步是否与视觉证据一致，不能只奖励更长或更流畅的CoT；Executability-level要求推理过程可由规则、程序、工具或人工协议复核；Robustness不是第五个递进层级，而是贯穿前四类对象的横向属性，用于评估扰动、模态冲突、帧序变化和反事实条件下的稳定性。按照这一视角，MMIE和VSI-Bench主要暴露输入组织与空间记忆问题，EMMA和MME-CoT关注复杂任务中的过程推理质量，MotionBench、TOMATO、SVLTA和VidHalluc约束时间证据与视频幻觉，PhysBench和MIRAGE分别检验物理理解与推理链幻觉。因此，benchmark选择不应只依据任务名称或总分，而应明确它主要检验答案、证据、过程、可执行复核还是鲁棒性。

从实验设计角度看，这一划分也有助于避免平均分掩盖错误来源。若目标是发现感知遗漏，应优先选择带有区域、帧或对象证据的Evidence-level基准；若目标是验证长链推理是否忠实，应结合Process-level标注和关键证据删除；若目标是比较真实部署中的稳定性，则需报告扰动、模态冲突和帧序变化下的Robustness表现。这样才能把“答对了什么”和“为什么答对”区分开来。

基于上述整理，Figure <a href="#fig:par-pgrv" data-reference-type="ref" data-reference="fig:par-pgrv">[fig:par-pgrv]</a>保留原有PAR分类图，用于说明现有多模态数学推理评测通常从“What to extract”“How to align”和“How to perform reasoning”三个问题组织任务；Table <a href="#tab:benchmark" data-reference-type="ref" data-reference="tab:benchmark">[tab:benchmark]</a>进一步把代表性基准映射到答案、证据、过程、可执行复核和鲁棒性维度。图和表的作用不同：前者提供任务谱系的外部参照，后者给出本文可靠性视角下的横向比较。

<figure id="fig:par-pgrv">
<img src="/report-assets/multimodal-visual-reasoning-reliability-survey/par_taxonomy_original.png" alt="Perception–Alignment–Reasoning 分类框架" />
<figcaption>Perception–Alignment–Reasoning 分类框架。该框架为多模态数学推理评测提供任务组织方式，也为本文进一步区分 Evidence、Process、Executability 和 Robustness 提供参照。</figcaption>
</figure>

**表 6　代表性基准与可靠性评测维度（A/E/P/X/R 分别表示 Answer、Evidence、Process、Executability 和 Robustness；✓ 为主要覆盖，○ 为部分覆盖）**

| Benchmark | A | E | P | X | R | 证据标注 | 过程标注 | 主要用途 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MMIE | ✓ | ✓ | — | — | ○ | 部分 | 否 | 评测多图、视频、3D和文本交错输入下的组织与证据选择能力。 |
| EMMA | ✓ | — | ✓ | ○ | — | 否 | 部分 | 覆盖数学、物理、化学和代码等跨学科多模态推理，并关注任务复杂度。 |
| MME-CoT | ✓ | — | ✓ | — | ✓ | 否 | 是 | 评估CoT质量、鲁棒性和效率，避免只用推理链长度衡量能力。 |
| MotionBench | ✓ | ✓ | — | — | ○ | 部分 | 否 | 约束模型对细粒度运动、时间证据和动作变化的理解。 |
| TOMATO | ✓ | ○ | — | — | ✓ | 部分 | 否 | 检查模型是否真正利用多帧增益、帧序信息和视觉差异。 |
| PhysBench | ✓ | — | ○ | ✓ | ○ | 否 | 否 | 用物理属性、关系和动态约束评估可复核的视觉推理。 |
| VidHalluc | ✓ | ○ | — | — | ✓ | 部分 | 否 | 直接测量动作、时间序列和场景转移中的视频幻觉。 |
| SVLTA | — | ✓ | — | — | ✓ | 是 | 否 | 通过可控合成视频隔离视觉—语言时间对齐和描述偏差。 |
| VSI-Bench | ✓ | ✓ | — | — | ○ | 部分 | 否 | 评测连续观察后的空间记忆、路径更新和视觉召回能力。 |
| MIRAGE | ✓ | ○ | ✓ | — | ○ | 部分 | 是 | 区分感知正确后的推理链幻觉与普通感知错误，定位错误来源。 |

# 讨论与结论

多模态视觉推理的核心在于平衡视觉证据表达、推理可靠性和计算效率。隐式视觉token便于端到端训练，也便于复用大语言模型的推理能力，但其可解释性较弱。显式视觉结构更适合定位、验证和纠错，却依赖额外工具、监督信号或结构化预处理。一次性感知效率较高，但容易遗漏关键证据；迭代感知能够根据推理需求持续补充信息，但会增加token、显存和推理延迟。

训练和推理机制也存在类似权衡。SFT主要用于学习高质量推理范式，强化学习和过程奖励可进一步优化复杂目标，测试时扩展则能够动态分配感知与推理计算。相比只约束最终答案的结果奖励，过程奖励更有利于提升推理可靠性，但前提是奖励模型或验证器能够真正理解视觉内容。内部自检成本较低，却可能继承模型自身的错误先验；外部工具验证更可控，但受到工具接口和工具可靠性的限制。

因此，可靠的多模态视觉推理不仅取决于语言模型的推理能力，还取决于视觉证据是否完整、视觉与语言是否准确绑定，以及错误能否被有效发现和修正。基于这一判断，PGRVC闭环将系统划分为Perception、Grounding、Reasoning、Verification与Correction五个环节：Perception决定可用证据的上限，Grounding保证视觉证据能够被语言准确引用，Reasoning负责组织和组合证据，Verification用于发现错误，Correction则使系统能够从错误中恢复。

# 参考文献

1. Ngiam et al. (2011). Multimodal Deep Learning. *Proceedings of the International Conference on Machine Learning*.
2. Frome et al. (2013). DeViSE: A Deep Visual-Semantic Embedding Model. *Advances in Neural Information Processing Systems*.
3. Karpathy and Fei-Fei (2015). Deep Visual-Semantic Alignments for Generating Image Descriptions. *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition*.
4. Vinyals et al. (2015). Show and Tell: A Neural Image Caption Generator. *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition*.
5. Baltrusaitis et al. (2019). Multimodal Machine Learning: A Survey and Taxonomy. *IEEE TPAMI 2019*.
6. Radford et al. (2021). Learning Transferable Visual Models From Natural Language Supervision. *Proceedings of the International Conference on Machine Learning*.
7. Li et al. (2021). Align before Fuse: Vision and Language Representation Learning with Momentum Distillation. *Advances in Neural Information Processing Systems*.
8. Alayrac et al. (2022). Flamingo: a Visual Language Model for Few-Shot Learning. *Advances in Neural Information Processing Systems*.
9. Li et al. (2022). BLIP: Bootstrapping Language-Image Pre-training for Unified Vision-Language Understanding and Generation. *Proceedings of the International Conference on Machine Learning*.
10. Li et al. (2023). BLIP-2: Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models. *Proceedings of the International Conference on Machine Learning*.
11. Yang et al. (2026). A Survey of Multimodal Mathematical Reasoning: From Perception, Alignment to Reasoning. *arXiv preprint arXiv:2603.08291*.
12. Zhang et al. (2025). Unified Multimodal Understanding and Generation Models: Advances, Challenges, and Opportunities. *arXiv preprint arXiv:2505.02567*.
13. Deitke et al. (2025). Molmo and PixMo: Open Weights and Open Data for State-of-the-Art Vision-Language Models. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
14. Qu et al. (2025). TokenFlow: Unified Image Tokenizer for Multimodal Understanding and Generation. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
15. Liu et al. (2025). Coarse Correspondences Boost Spatial-Temporal Reasoning in Multimodal Language Model. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
16. Kang et al. (2025). GFlowVLM: Enhancing Multi-step Reasoning in Vision-Language Models with Generative Flow Networks. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
17. Bigverdi et al. (2025). Perception Tokens Enhance Visual Reasoning in Multimodal Language Models. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
18. Li et al. (2025). LLaVA-ST: A Multimodal Large Language Model for Fine-Grained Spatial-Temporal Understanding. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
19. Liu et al. (2025). PAVE: Patching and Adapting Video Large Language Models. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
20. Liu et al. (2025). BOLT: Boost Large Vision-Language Model Without Training for Long-form Video Understanding. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
21. Hong et al. (2025). MotionBench: Benchmarking and Improving Fine-grained Video Motion Understanding for Vision Language Models. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
22. Li et al. (2025). VidHalluc: Evaluating Temporal Hallucinations in Multimodal Large Language Models for Video Understanding. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
23. Jung et al. (2025). On the Consistency of Video Large Language Models in Temporal Comprehension. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
24. Du et al. (2025). SVLTA: Benchmarking Vision-Language Temporal Alignment via Synthetic Video Situation. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
25. Tian et al. (2025). DTOS: Dynamic Time Object Sensing with Large Multimodal Model. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
26. Chen et al. (2025). Task-aware Cross-modal Feature Refinement Transformer with Large Language Models for Visual Grounding. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
27. Kang et al. (2025). Your Large Vision-Language Model Only Needs A Few Attention Heads For Visual Grounding. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
28. Yin et al. (2025). ROD-MLLM: Towards More Reliable Object Detection in Multimodal Large Language Models. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
29. Yang et al. (2025). Thinking in Space: How Multimodal Large Language Models See, Remember, and Recall Spaces. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
30. Kaduri et al. (2025). What's in the Image? A Deep-Dive into the Vision of Vision Language Models. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
31. Deng et al. (2025). Words or Vision: Do Vision-Language Models Have Blind Faith in Text?. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
32. Zhang et al. (2025). Critic-V: VLM Critics Help Catch VLM Errors in Multimodal Reasoning. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
33. Dong et al. (2025). Insight-V: Exploring Long-Chain Visual Reasoning with Multimodal Large Language Models. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
34. Cocchi et al. (2025). Augmenting Multimodal LLMs with Self-Reflective Tokens for Knowledge-based Visual Question Answering. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
35. Yang et al. (2025). Mitigating Hallucinations in Large Vision-Language Models via DPO: On-Policy Data Hold the Key. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
36. Yin et al. (2025). ClearSight: Visual Signal Enhancement for Object Hallucination Mitigation in Multimodal Large Language Models. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
37. Yang et al. (2025). Nullu: Mitigating Object Hallucinations in Large Vision-Language Models via HalluSpace Projection. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
38. Liao et al. (2025). Can Large Vision-Language Models Correct Semantic Grounding Errors By Themselves?. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition*.
39. Xia et al. (2025). MMIE: Massive Multimodal Interleaved Comprehension Benchmark for Large Vision-Language Models. *International Conference on Learning Representations*.
40. Zhang et al. (2025). Do Vision-Language Models Represent Space and How? Evaluating Spatial Frame of Reference under Ambiguities. *International Conference on Learning Representations*.
41. Chow et al. (2025). PhysBench: Benchmarking and Enhancing Vision-Language Models for Physical World Understanding. *International Conference on Learning Representations*.
42. Li et al. (2025). LLaVA-Interleave: Tackling Multi-image, Video, and 3D in Large Multimodal Models. *International Conference on Learning Representations*.
43. Shi et al. (2025). Eagle: Exploring The Design Space for Multimodal LLMs with Mixture of Encoders. *International Conference on Learning Representations*.
44. Chen et al. (2025). PerturboLLaVA: Reducing Multimodal Hallucinations with Perturbative Visual Training. *International Conference on Learning Representations*.
45. Shangguan et al. (2025). TOMATO: Assessing Visual Temporal Reasoning Capabilities in Multimodal Foundation Models. *International Conference on Learning Representations*.
46. Haotian Zhang et al. (2025). MM1.5: Methods, Analysis \& Insights from Multimodal LLM Fine-tuning. *International Conference on Learning Representations*.
47. Cai et al. (2025). From Local Details to Global Context: Advancing Vision-Language Models with Attention-Based Selection. *Proceedings of the International Conference on Machine Learning*.
48. Chang and Venkataraman (2025). LV-XAttn: Distributed Cross-Attention for Long Visual Inputs in Multimodal Large Language Models. *Proceedings of the International Conference on Machine Learning*.
49. Hao et al. (2025). Can MLLMs Reason in Multimodality? EMMA: An Enhanced MultiModal ReAsoning Benchmark. *Proceedings of the International Conference on Machine Learning*.
50. Jain et al. (2025). Unifying 2D and 3D Vision-Language Understanding. *Proceedings of the International Conference on Machine Learning*.
51. Jiang et al. (2025). MME-CoT: Benchmarking Chain-of-Thought in Large Multimodal Models for Reasoning Quality, Robustness, and Efficiency. *Proceedings of the International Conference on Machine Learning*.
52. Zhuowei Li et al. (2025). The Hidden Life of Tokens: Reducing Hallucination of Large Vision-Language Models Via Visual Information Steering. *Proceedings of the International Conference on Machine Learning*.
53. Jin et al. (2025). Unveiling Chain of Step Reasoning for Vision-Language Models with Fine-grained Rewards. *Advances in Neural Information Processing Systems*.
54. Yan et al. (2025). VideoChat-R1.5: Visual Test-Time Scaling to Reinforce Multimodal Reasoning by Iterative Perception. *Advances in Neural Information Processing Systems*.
55. Dong et al. (2025). MIRAGE: Assessing Hallucination in Multimodal Reasoning Chains of MLLM. *Advances in Neural Information Processing Systems*.
56. Zhang et al. (2025). OpenVLThinker: Complex Vision-Language Reasoning via Iterative SFT-RL Cycles. *Advances in Neural Information Processing Systems*.
57. Liu et al. (2025). SSR: Enhancing Depth Perception in Vision-Language Models via Rationale-Guided Spatial Reasoning. *Advances in Neural Information Processing Systems*.
58. Zhao et al. (2025). UniPixel: Unified Object Referring and Segmentation for Pixel-Level Visual Reasoning. *Advances in Neural Information Processing Systems*.
59. Izadi et al. (2025). Visual Structures Help Visual Reasoning: Addressing the Binding Problem in LVLMs. *Advances in Neural Information Processing Systems*.
