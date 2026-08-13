---
title: 传奇交易员的日常生活
commentSlug: 'hermes-em-financial-big-data'
published: 2026-07-31T00:10:00.000Z
draft: false
description: 以 Hermes-EM 为核心，介绍多 Agent 金融情绪市场、角色行为、技能进化机制与可视化实验结果。
image: /report-assets/hermes-em-financial-big-data/market_design_architecture.png
tags:
  - 金融大数据
  - 多智能体
  - Hermes-EM
category: 学习
lang: zh-CN
---
------------------------------------------------------------------------


**传奇交易员的日常生活**


------------------------------------------------------------------------


|              |              |
|:------------:|:------------:|
|  **刘勇杰**  |  **李家豪**  |
| 西南财经大学 | 西南财经大学 |


**Abstract**


金融市场价格并不只由基本面和历史收益决定，新闻冲击、投资者注意力、社交互动和群体情绪也会共同改变交易行为。与“算法交易”报告中的自进化量化交易者相对应，本文将“传奇交易员的日常生活”定义为 Hermes Quant Agent（下称 Hermes Agent）的情绪市场试炼场，并将系统命名为 Hermes-EM：市场既生成新闻、社交传播、盘口冲击和群体交易行为，也让不同市场角色在交易反馈中持续更新自身 Skill。本文设计了一个面向 A 股市场的多智能体情绪传播仿真系统，通过限价订单簿、A 股交易规则、仿真新闻生成器、社交网络推荐机制和动态市场环境刻画“新闻–情绪–社交传播–交易行为–价格反馈”的闭环。进一步地，本文引入 Darwin.SKILL 式人物 Skill 蒸馏思想，为散户、游资、价值资金、量化研究员和 Hermes Agent 等角色配置初始行为倾向，并通过交易反馈、经验反思、候选 Skill 更新和验证门控形成可进化的市场参与者。实验构造了“平稳吸筹–利好拉升–追涨过热–封单松动–恐慌杀跌–护盘修复”的涨停失败场景。结果表明，情绪传播链不仅能够解释价格剧烈反转前的社交热度、盘口失衡和流动性收缩，还能为 Hermes Agent 提供比单纯价格动量更稳健的风险识别信号。项目代码见 GitHub：[`HanaViolet/Hermes-EM`](https://github.com/HanaViolet/Hermes-EM)。

A 股仿真市场；多智能体系统；投资者情绪；角色 Skill 蒸馏；自进化 Agent；算法交易


# 一、引言

投资者情绪是解释金融市场短期波动的重要变量。行为金融学表明，噪声交易者风险、信息瀑布、注意力驱动买入和媒体语调都会导致价格偏离基本面。在 A 股市场中，这一问题更为突出：个人投资者占比高、涨跌停制度显著、热点题材和短线资金行为容易形成交易拥挤，价格限制机制甚至可能诱发“涨停吸引买盘、次日或随后反转”的破坏性市场行为。因此，若算法交易系统只学习价格和成交量，而忽略情绪如何被新闻、社交网络和推荐机制放大，就很难在真实市场中识别诱多、出货、恐慌踩踏等高风险过程。

已有研究为“用多智能体刻画情绪市场”提供了重要依据。人工股票市场和多智能体建模能够从微观交易规则出发，复现收益厚尾、波动聚集和临界行为等宏观现象；社会互动和从众行为研究则说明，投资者并非独立决策，邻居、社交网络和群体信念会影响市场参与与风险承担。与此同时，文本金融研究发现，新闻语调、财报词典和搜索行为均与资产价格和波动有关。这些研究共同表明，情绪传播不是外生噪声，而是金融市场仿真中需要显式建模的机制。

然而，传统研究多从实证相关性角度讨论情绪与市场表现，例如检验新闻语调是否预测收益、社交媒体情绪是否领先指数变化，或投资者注意力是否解释散户买入。此类工作能够回答“情绪传播之后发生了什么”，但较难展示“情绪沿哪些节点、通过哪些推荐和互动路径传播，并最终如何改变不同投资者的订单行为”。因此，本文从仿真市场内部重建情绪传播链：新闻事件先改变 Agent 的信念和风险偏好，Agent 再通过社交帖子、点赞、收藏、转发和关注关系形成传播网络，推荐算法进一步放大高热度信息，最后由不同类型 Agent 的交易策略反馈到价格、盘口深度和市场情绪。

本文与“算法交易”报告形成互补关系：算法交易报告关注自进化量化交易员如何形成可解释交易决策，本文则关注该交易员所处的情绪市场如何生成信息、传播情绪并反馈到价格。换言之，本文不把仿真市场视为静态数据集，而是将其设计为一个可反复试炼、可记录反馈、可与交易 Agent 共同演化的训练环境。

<figure id="fig:intro_legendary_trader_life">
<img src="/report-assets/hermes-em-financial-big-data/intro_legendary_trader_life.png" style="width:86.0%" />
<figcaption>本文方法的概念入口：“传奇交易员的日常生活”被设定为 Hermes Agent 面对新闻、社交情绪、盘口冲击和角色进化的市场试炼场。</figcaption>
</figure>

围绕这一定位，本文的主要工作包括五点。第一，提出面向 A 股的情绪传播仿真市场架构，将交易制度、订单簿、市场状态和多类投资者放入同一解释框架。第二，设计动态市场环境，使新闻不再直接决定价格，而是通过多 Agent 交互、社交传播和订单簿反馈生成多样化市场路径。第三，构建准真实社交网络和推荐曝光机制，使情绪能够沿关注关系、热榜内容和互动行为被追踪。第四，引入 Darwin.SKILL 式人物 Skill 蒸馏，为市场角色配置初始行为倾向，并通过交易结果和经验反思持续更新角色 Skill。第五，为 Hermes Agent 提供带有新闻、情绪、社交热度和盘口信号的训练环境，用于学习市场情绪传播链和交易风险识别。

# 二、相关工作

## （一）投资者情绪、新闻与市场价格

投资者情绪研究通常从两个入口展开：一类从行为金融理论出发，讨论噪声交易、过度反应、信息瀑布和动量反转；另一类从可观测文本和注意力数据出发，研究媒体内容、财报语调或搜索指数对资产价格的预测能力。这些研究说明，情绪并非无法度量，而是可以通过新闻文本、搜索行为、交易活跃度和社交表达间接刻画。本文借鉴这一思路，将新闻事件的方向、强度、可信度和衰减过程转化为 Agent 的情绪增量和交易倾向。

在 A 股环境下，情绪和微观结构的交互尤其重要。涨跌停制度、散户主导的交易结构和高换手率会放大短线注意力，价格接近涨停时可能吸引更多买盘，并在封单失败或大资金撤退后产生剧烈反转。因此，本文的实验不采用一般的单调利好场景，而选择“涨停失败/诱多回落”作为测试案例，用以展示情绪传播链如何帮助 Hermes Agent 识别价格上涨背后的拥挤风险。

## （二）社交传播与推荐算法

社会传播研究表明，行为扩散依赖网络结构、邻居影响和群体强化机制，大规模社交网络中也存在可观测的情绪传染现象。在投资语境下，社交互动不仅影响是否参与市场，也会影响个体对信息可信度和风险的判断。推荐算法进一步改变了信息暴露结构：它不只是被动展示帖子，而会根据互动、热度、关注关系和时间衰减重新排序内容；从协同过滤到深度候选召回与排序模型，推荐系统已经成为塑造信息流的重要基础设施。同时，生成式 Agent 研究表明，通过记忆、规划和交互机制可以构造具有连续行为轨迹的个体模拟。本文在仿真系统中引入“关注者内容 + 全站热榜”的混合推荐机制，使得情绪传播既有社交邻接路径，也有平台算法放大路径。

## （三）多智能体金融市场仿真

多智能体金融市场将宏观价格波动分解为微观交易规则、异质信念和局部互动。经典人工股票市场研究表明，只要 Agent 具有异质预期和适应性学习，就可能产生复杂时间序列性质；随机多智能体模型也能复现金融市场的标度律和临界现象。更一般地，Agent-based modelling 被认为是处理金融系统非线性反馈、异质主体和政策冲击的重要工具。本文在此基础上增加了新闻和社交推荐模块，使 Agent 的情绪不再是静态参数，而是在市场中动态传播和反馈。

## （四）自进化 Agent 与 Skill 蒸馏

生成式 Agent 研究强调，记忆、规划和交互可以让个体模拟呈现连续行为轨迹。进一步地，SkillOpt 将 Agent 的外部化 skill 文档视为可训练状态：系统先收集带评分的 rollout 轨迹，再通过反思生成候选 skill 修改，并用验证门控决定是否接受更新。Darwin.SKILL 则从工程实践角度提供了“人物 Skill 蒸馏”的可复用思路，即把特定人物或角色的决策风格、语言偏好和行为准则压缩为可安装、可组合、可迭代的 Skill。这些工作说明，Agent 的能力不必只存在于模型参数中，也可以沉淀为可解释、可编辑、可验证的外部行为规则。本文借鉴的是这种“Skill 可蒸馏、可更新”的机制，而不是直接照搬非金融人物设定。

## （五）本文定位

已有研究分别解释了情绪变量、信息传播、推荐排序、人工市场和 Agent 自优化，但较少把这些模块放入同一个可交互、可演化的 A 股仿真环境。本文关注的不是单一新闻因子是否预测收益，而是新闻如何进入 Agent 认知、如何通过社交网络扩散、如何被推荐算法放大，以及如何经由订单簿影响价格。进一步地，本文把市场参与者自身也设计为可进化对象，使情绪市场不只是 Hermes Agent 的训练场，也是不同角色 Skill 共同迭代的实验环境。

# 三、方法论

本节从设计层面描述情绪传播仿真市场。本文的目标不是复现某一条固定价格序列，而是在 A 股交易规则约束下构造一个可交互、可解释、可重复实验的人工市场。该市场借鉴人工股票市场和多智能体金融建模思想，将投资者情绪从外生指标推进为可追踪的传播过程：新闻影响 Agent 认知，社交网络改变信息暴露，异质主体把信念转化为订单，市场价格和流动性再反向影响下一轮决策。

## （一）A 股情绪传播仿真市场架构

A 股市场具有个人投资者参与度高、价格涨跌停约束明显、短线题材传播快和盘口流动性易变化等特征。为了刻画这些机制，本文将仿真市场设计为五个层次：外部信息层、投资者认知层、社交传播层、A 股交易层和策略学习层，如图 <a href="#fig:market_design_architecture" data-reference-type="ref" data-reference="fig:market_design_architecture">2</a> 所示。外部信息层产生公告、媒体报道、研报和市场传闻；投资者认知层由散户、游资、公募基金、北向资金、国家队、普通量化和 Hermes Agent 等异质主体组成；社交传播层决定信息在关注网络和热榜中的曝光；A 股交易层通过订单簿、价格优先规则、100 股整数倍和涨跌停约束完成价格发现；策略学习层记录收益、回撤和风险信号，供 Hermes Agent 学习。

<figure id="fig:market_design_architecture">
<img src="/report-assets/hermes-em-financial-big-data/market_design_architecture.png" style="width:98.0%" />
<figcaption>A 股情绪传播仿真市场的设计架构。图中只保留关键层次和闭环关系，强调新闻、社交传播、订单行为和策略学习之间的解释链条。</figcaption>
</figure>

这种分层设计的作用在于把“情绪影响价格”的黑箱关系拆解为一条可解释链路。行为金融研究说明，噪声交易、注意力驱动买入和信息瀑布会造成短期价格偏离；多智能体金融市场研究进一步表明，异质预期和局部交互可以产生波动聚集、厚尾和非线性反馈等宏观现象。因此，本文不把情绪作为单一数值直接作用于价格，而是让情绪先改变 Agent 的认知和风险偏好，再通过社交传播与订单簿反馈进入市场状态。

系统中的 Agent 被设计为不同市场参与者的抽象画像。散户更容易受到热榜和传闻影响，具有追涨杀跌和从众倾向；游资关注涨停接力、封板强度和撤退阈值；公募基金以估值锚和组合再平衡为主要约束；北向资金对趋势和宏观风险更敏感；国家队在极端下跌或流动性不足时提供稳定买盘；普通量化利用动量、均值回归和盘口不平衡信号；Hermes Agent 则作为学习型交易员，在同一市场中观察传播链、评估风险并调整交易暴露。这样的角色划分并非为了精确复制某一类真实机构，而是为了在实验中形成足够丰富的异质行为和相互反馈。

为了让上述方法结构可以被直接观察，本文同时构建了前端可视化界面。多 Agent 市场沙盘将不同资金类型放入同一空间化市场环境中，便于观察异质主体在新闻、盘口和社交传播冲击下的位置关系与行动状态；Agent 群体卡片则把每类主体的现金、持仓、收益、行为倾向和动作流程集中展示，使角色设定不只停留在参数表中，而能被追踪为可交互的市场参与者。

<figure id="fig:frontend_market_sandbox_method">
<img src="/report-assets/hermes-em-financial-big-data/frontend_market_sandbox_method.png" style="width:96.0%" />
<figcaption>多 Agent 市场沙盘前端界面。不同市场角色被放置在同一仿真空间中，研究者可以直观看到资金类型、角色位置和市场场景之间的对应关系。</figcaption>
</figure>

沙盘视图强调“市场环境中的谁在哪里”，适合观察异质资金如何共同进入同一交易场景；而角色卡片视图进一步回答“每类 Agent 正在做什么”。因此，前端展示被设计为由宏观空间视图下钻到微观角色视图：前者用于理解市场结构，后者用于追踪每类主体的观察、决策、委托和反馈过程。

在实现上，沙盘并不替代订单簿和情绪传播模型，而是把模型中的抽象主体、市场区域和交互状态映射为可观察对象。研究者可以先从沙盘中定位哪些资金正在参与、哪些角色处于同一信息环境，再进入卡片视图查看其情绪、持仓和动作链条。这样的前端组织方式使方法部分的“多主体–多路径–可反馈”设计具有可检查的界面入口。

<figure id="fig:frontend_agent_cards_method">
<img src="/report-assets/hermes-em-financial-big-data/frontend_agent_cards_method.png" style="width:82.0%" />
<figcaption>Agent 群体卡片与动作流程前端界面。界面展示每类 Agent 的资产状态、持仓、收益、行为偏好和观察、决策、委托、反馈等动作环节。</figcaption>
</figure>

## （二）Darwin.SKILL 驱动的人物角色蒸馏与自进化

为了让仿真市场中的角色不只是固定参数集合，本文引入 Darwin.SKILL 式人物 Skill 蒸馏机制。该机制参考 Darwin.SKILL 开源项目（[GitHub 仓库](https://github.com/alchaincyf/darwin-skill)），其基本思想是：每个市场参与者先拥有一个初始角色 Skill，定义其信息偏好、风险态度、社交表达方式和交易反应；随后，角色在市场中经历新闻冲击、社交传播、收益反馈和失败案例；最后，系统将这些轨迹压缩为候选 Skill 更新，并通过验证门控决定是否写入下一轮角色行为。由此，散户、游资、价值资金、量化研究员和 Hermes Agent 都可以在同一情绪市场中逐步形成更稳定的行为倾向。

更具体地说，Darwin.SKILL 不是一次性写出固定提示词，而是把 Skill 视为可迭代的外部行为规则。系统先评估当前 Skill 在任务中的表现，再生成改进方案，并通过验证集和人工确认判断改动是否真正提升能力；只有当分数上升时，候选 Skill 才会被保留，否则回滚到上一稳定版本，如图 <a href="#fig:darwin_skill_core_loop" data-reference-type="ref" data-reference="fig:darwin_skill_core_loop">5</a> 所示。

<figure id="fig:darwin_skill_core_loop">
<img src="/report-assets/hermes-em-financial-big-data/darwin_skill_core_loop.png" style="width:90.0%" />
<figcaption>Darwin.SKILL 的核心优化闭环。系统依次完成评估、改进、验证和确认，并根据分数是否提升决定保留或回滚候选 Skill。</figcaption>
</figure>

该机制的关键在于“只让有效基线向上移动”。换言之，每一轮优化都必须超过已有稳定版本，失败候选不会覆盖当前 Skill。对于本文的金融市场仿真而言，这意味着市场角色可以从交易结果和风险暴露中学习，但不会因为单次噪声反馈而破坏原有角色一致性，如图 <a href="#fig:darwin_skill_ratchet" data-reference-type="ref" data-reference="fig:darwin_skill_ratchet">6</a> 所示。

<figure id="fig:darwin_skill_ratchet">
<img src="/report-assets/hermes-em-financial-big-data/darwin_skill_ratchet_mechanism.png" style="width:86.0%" />
<figcaption>Darwin.SKILL 的棘轮机制。有效基线只在验证得分提升时更新，低于当前基线的候选版本被拒绝，从而保持 Skill 迭代的稳定性。</figcaption>
</figure>

在角色初始化阶段，本文不追求逐字复刻某位真实人物，而是借鉴人物 Skill 蒸馏思想，为不同市场角色提供可解释的初始行为来源。具体而言，散户学习者借鉴彼得·林奇面向普通投资者的公司理解和长期观察方式；投机交易者借鉴杰西·利弗莫尔对趋势、仓位和止损的交易纪律；宏观交易者借鉴乔治·索罗斯的反身性思想和宏观冲击判断；价值守门员借鉴巴菲特与芒格的安全边际、长期主义和逆向思考；量化研究员借鉴 Jim Simons 与 Cliff Asness 的数据建模、因子验证和组合研究方法；风险控制者借鉴塔勒布与达利欧对不确定性、尾部风险和组合防御的理解。Hermes Agent 则不是某一人物的复制体，而是在上述市场角色共同构成的情绪市场中接受试炼，并把交易结果压缩为可验证的行为准则。


**市场人物 Skill 蒸馏与仿真行为**

| 市场角色 | 蒸馏参考 | 仿真行为作用 |
| --- | --- | --- |
| 散户学习者 | 彼得·林奇 | 关注公司故事、产品认知和大众可理解信息，刻画普通投资者的学习型买入与情绪跟随。 |
| 投机交易者 | 杰西·利弗莫尔 | 强调趋势、仓位、止损和撤退纪律，刻画短线资金在拉升与反转中的快速行动。 |
| 宏观交易者 | 乔治·索罗斯 | 强调反身性和宏观冲击，刻画政策、流动性和市场预期之间的反馈。 |
| 价值守门员 | 巴菲特 / 芒格 | 强调安全边际、长期主义和逆向思考，提供估值锚与情绪过热时的约束。 |
| 量化研究员 | Jim Simons / Cliff Asness | 强调数据建模、因子验证和组合研究，为价格、盘口和情绪信号提供量化解释。 |
| 风险控制者 | 塔勒布 / 达利欧 | 强调尾部风险、反脆弱和组合防御，在恐慌扩散与流动性收缩时约束风险暴露。 |


<figure id="fig:darwin_skill_persona_market">
<img src="/report-assets/hermes-em-financial-big-data/darwin_skill_persona_market.png" style="width:98.0%" />
<figcaption>市场人物 Skill 蒸馏驱动的情绪市场角色初始化与自进化示意。不同像素人物从投资交易代表人物中获得初始行为倾向，并在交易反馈、经验反思、Skill 更新和再次入场之间形成闭环。</figcaption>
</figure>

从方法角度看，若将第 $i$ 个市场角色的 Skill 表示为 $K_i^t$，其在第 $t$ 轮市场中的交易、发帖、互动和收益轨迹表示为 $\tau_i^t$，则角色更新可以抽象为
$
K_i^{t+1}=\mathcal{G}(K_i^t,\tau_i^t,R_i^t,V_i),
$
其中 $R_i^t$ 表示收益、回撤、社交影响力和风险暴露等评价结果，$V_i$ 表示验证门控。只有当候选更新能在保留角色一致性的同时改善验证场景表现时，该更新才会进入下一轮市场。这样的设计使仿真情绪市场本身成为自进化系统：市场角色会根据过往成功和失败调整行为准则，而这些调整又会影响下一轮新闻传播、订单行为和价格反馈。对 Hermes Agent 而言，训练环境不再是静态沙盒，而是一个会随参与者共同学习而改变的试炼场。

## （三）动态市场设计：多 Agent 交互与路径非唯一性

真实市场不是新闻冲击到价格变化的单向映射。同一条利好新闻可能被机构视为估值修复，被游资视为打板机会，被散户理解为追涨信号，也可能在传闻反转后演化为恐慌踩踏。为刻画这种路径非唯一性，本文将市场环境表示为随 tick 演化的状态：
$
E_t=(S_t,\sigma_t,F_t,L_t,Q_t,C_t,N_t),
$
其中 $S_t$ 表示市场情绪，$\sigma_t$ 表示波动率，$F_t$ 表示资金流，$L_t$ 表示流动性，$Q_t$ 表示盘口深度，$C_t$ 表示交易拥挤度，$N_t$ 表示最近新闻冲击。环境的下一期状态由新闻、订单和社交互动共同决定：
$
E_{t+1}=\Phi(E_t,N_t,O_t,G_t)+\epsilon_t,
$
其中 $O_t$ 为多 Agent 产生的订单集合，$G_t$ 为社交互动网络，$\epsilon_t$ 表示异质性和随机扰动。该式强调的是设计逻辑：新闻只给出外部状态，真正的市场路径由 Agent 之间的认知差异、传播差异和交易反馈共同生成。

在仿真实现中，上述状态变量会被同步写入事件日志和前端面板。价格、波动率和盘口深度用于刻画交易层变化，资金流和交易拥挤度用于识别短线资金是否过度集中，社交互动网络则记录帖子、关注和推荐曝光如何改变 Agent 的信息集合。这样一来，同一条新闻可以在不同角色之间形成不同的认知路径，最终表现为不同的下单节奏和风险暴露。

<figure id="fig:dynamic_agent_market">
<img src="/report-assets/hermes-em-financial-big-data/dynamic_agent_market.png" style="width:98.0%" />
<figcaption>动态多 Agent 市场环境示意。外部新闻并不直接决定价格，而是通过异质 Agent 的认知更新、社交互动和订单簿反馈形成多条可能路径。</figcaption>
</figure>

在每个 tick 中，Agent 会根据自身角色读取新闻、社交 feed、价格、盘口、资金流和历史收益，并形成新的情绪和交易倾向。随后，订单进入 A 股规则约束下的订单簿，成交结果改变价格、流动性和未成交队列；这些市场结果又被 Agent 观察，并影响下一轮发帖、跟随、撤单或反向交易。该闭环使市场变化不再是预设曲线，而是由“认知–传播–交易–反馈”的连续交互产生。对于 Hermes Agent 而言，学习目标也不再是简单预测下一 tick 涨跌，而是在动态环境中识别何时上涨来自基本面改善，何时上涨只是社交推荐和短线资金共同放大的拥挤交易。

## （四）准真实社交网络与推荐算法

情绪传播需要同时刻画人际网络和平台曝光。本文将每个 Agent 视为社交网络中的节点，关注关系、点赞、收藏、转发和评论构成有向加权边。帖子内容来自 Agent 对新闻和市场状态的解释，类型包括观点、传闻、分析和预警。互动概率由三类因素共同决定：第一，信息是否符合接收者当前情绪和持仓方向；第二，发帖者是否具有较高影响力或同类身份；第三，推荐系统是否把该内容放入更靠前的曝光位置。这样的设计借鉴了社会扩散与情绪传染研究，使市场情绪不只是全局平均值，而是可以沿节点和边追踪的传播过程。

推荐机制采用“关注流 + 热榜流”的混合结构。关注流保留社交邻接关系，使 Agent 更容易接收熟悉节点或同类群体的观点；热榜流按照互动强度和时间衰减排序，模拟平台对高热度内容的放大效应。帖子热度定义为：
$
H(p,t)=\frac{L_p+2C_p+3R_p}{(\Delta t/30+2)^{1.5}},
$
其中 $L_p$、$C_p$、$R_p$ 分别为点赞、收藏和转发次数，$\Delta t$ 为帖子年龄。每个 Agent 的推荐流主要来自关注对象的高分帖子，同时保留一定比例的全站热榜内容。该设计既能形成同温层，也能让极端情绪、传闻或风险预警跨越原有关注边界扩散。

社交推荐机制在本文中承担两类功能。第一，它提供情绪传播的可解释路径：研究者可以观察某条利好、传闻或澄清信息经过哪些节点、被哪些互动放大，并最终影响哪些交易行为。第二，它为 Hermes Agent 提供更接近真实市场的信息环境：量化交易员看到的不仅是价格和成交量，还包括热度、拥挤度、意见领袖观点和风险帖扩散速度。由此，Hermes Agent 可以学习把“社交热度上升”区分为基本面确认、情绪过热或风险传导，而不是把所有热度都理解为买入信号。

上述四部分共同限定了本文的研究对象：本文关注“情绪如何传播并改变交易行为”，而不是单纯回放行情。市场架构提供制度约束，角色蒸馏机制提供可演化的异质主体，动态环境提供多路径反馈，社交推荐机制提供可追踪的信息暴露路径，四者共同构成面向算法交易训练的 A 股情绪传播仿真市场。

# 四、实验测试与案例分析

## （一）实验场景设计

实验采用仿真数据而非真实交易数据，目的是展示报告所需的市场现象和传播链条。场景命名为“涨停失败/主力诱多”：前 20 个 tick 价格围绕 10 元平稳波动；第 22 个 tick 出现订单利好；第 36 个 tick 游资集中买入并发布看多内容，推荐系统放大热度；第 48 个 tick Hermes 识别到社交热度、拥挤度和盘口买盘同时过热；第 52 个 tick 出现封单不足传闻；第 56 个 tick 游资撤退；第 64 个 tick 买盘深度快速下降，散户恐慌扩散；第 74 个 tick 稳定资金入场，价格和情绪开始修复。

| 阶段     | tick 区间 |  均价 | 最高价 | 平均情绪 | 平均拥挤度 |
|:---------|----------:|------:|-------:|---------:|-----------:|
| 稳定吸筹 |      0–20 | 10.00 |  10.03 |     0.00 |       0.10 |
| 利好铺垫 |     21–34 | 10.26 |  10.48 |     0.28 |       0.31 |
| 拉升追涨 |     35–48 | 10.71 |  10.92 |     0.66 |       0.63 |
| 封单松动 |     49–60 | 10.51 |  10.87 |     0.25 |       0.68 |
| 恐慌杀跌 |     61–72 |  9.76 |  10.03 |    -0.50 |       0.76 |
| 护盘修复 |     73–90 |  9.69 |   9.88 |    -0.36 |       0.57 |

涨停失败场景的阶段统计 {#tab:phase}

<figure id="fig:price_sentiment">
<img src="/report-assets/hermes-em-financial-big-data/price_sentiment.png" style="width:92.0%" />
<figcaption>价格与市场情绪在涨停失败场景中的共同变化。价格先被利好和游资行为推高，随后在传闻与流动性冲击下快速下行。</figcaption>
</figure>

除曲线结果外，本文还截取了实验过程中的界面细节作为可视化证据。图 <a href="#fig:experiment_frontend_details" data-reference-type="ref" data-reference="fig:experiment_frontend_details">10</a> 展示了价格拉升与成交放大、Agent 群体状态、社交热榜与影响力排行、盘口新闻和资金流等关键画面，使涨停失败场景不只由价格曲线呈现，也能看到传播链在仿真市场中的具体表现。

<figure id="fig:experiment_frontend_details">
<img src="/report-assets/hermes-em-financial-big-data/experiment_frontend_details.png" style="width:98.0%" />
<figcaption>涨停失败实验的前端细节截图。四个子图分别展示价格拉升与成交放大、Agent 群体状态、社交热榜与影响力、盘口新闻和资金流，补充说明情绪传播链在实验界面中的可观察性。</figcaption>
</figure>

## （二）传播链与微观结构信号

从传播链看，利好新闻最先推动散户和游资情绪升温；游资看多帖子在推荐流中获得较高点赞和转发，散户情绪随后更剧烈地上升；当封单不足传闻出现后，热榜内容从“追涨”切换为“风险提醒”，谣言热度迅速超过普通社交热度。此时价格虽然仍处于高位，但订单簿不平衡已经从买盘占优转向卖压占优，流动性开始收缩。也就是说，情绪传播链比价格更早暴露了市场结构变化。

从界面读图顺序看，价格与成交面板给出行情结果，Agent 群体状态面板解释哪些主体正在承担风险，社交热榜与影响力面板揭示情绪扩散来源，盘口与资金流面板则显示交易压力如何落到订单簿上。四类信息合在一起，使本文的实验不只是“价格先涨后跌”的回放，而是能够追踪新闻、情绪、社交互动和盘口反馈如何共同推动市场状态改变。

<figure id="fig:social_spread">
<img src="/report-assets/hermes-em-financial-big-data/social_spread.png" style="width:92.0%" />
<figcaption>社交热度、传闻热度与拥挤度变化。传闻出现后，推荐系统将风险帖子推到更高位置，情绪由乐观转为恐慌。</figcaption>
</figure>

<figure id="fig:microstructure">
<img src="/report-assets/hermes-em-financial-big-data/microstructure_signals.png" style="width:92.0%" />
<figcaption>盘口不平衡、流动性和拥挤度变化。封单松动后，拥挤度仍高但流动性下降，形成高风险交易区间。</figcaption>
</figure>

为保证实验过程可检查，本文同步记录了 tick 级行情与情绪、新闻事件序列、社交互动路径和关键 Agent 行为轨迹。上述记录分别对应价格反转、情绪扩散、信息曝光和订单决策四个观测层面，用于支撑图 <a href="#fig:price_sentiment" data-reference-type="ref" data-reference="fig:price_sentiment">9</a>、图 <a href="#fig:social_spread" data-reference-type="ref" data-reference="fig:social_spread">11</a> 和图 <a href="#fig:microstructure" data-reference-type="ref" data-reference="fig:microstructure">12</a> 的曲线结果，并与图 <a href="#fig:experiment_frontend_details" data-reference-type="ref" data-reference="fig:experiment_frontend_details">10</a> 的过程截图相互印证。

# 五、结论与展望

本文设计了一个面向 A 股市场的多智能体情绪传播仿真系统，并将其定位为 Hermes Quant Agent 的可解释试炼场。与只观察情绪结果的研究不同，本文强调情绪传播链：新闻从不同来源进入 Agent 认知，社交网络和推荐算法放大或反转情绪，异质交易策略将情绪转化为订单，价格、流动性和成交再反过来更新市场环境。进一步地，本文通过 Darwin.SKILL 式人物 Skill 蒸馏，将市场参与者也纳入自进化框架，使仿真市场能够与算法交易报告中的自进化量化交易员形成互相迭代的结构。实验结果和界面细节截图共同表明，在涨停失败这类典型短线场景中，社交热度、传闻热度、盘口不平衡和流动性收缩能够在价格大幅下跌前形成可观测信号，为 Hermes Agent 学习风险识别提供了有效样本。

# 参考文献

1. De Long, J. Bradford and Shleifer, Andrei and Summers, Lawrence H. and Waldmann, Robert J. (1990). Noise Trader Risk in Financial Markets. *Journal of Political Economy*.
2. Bikhchandani, Sushil and Hirshleifer, David and Welch, Ivo (1992). A Theory of Fads, Fashion, Custom, and Cultural Change as Informational Cascades. *Journal of Political Economy*.
3. Hong, Harrison and Stein, Jeremy C. (1999). A Unified Theory of Underreaction, Momentum Trading, and Overreaction in Asset Markets. *The Journal of Finance*.
4. Lux, Thomas and Marchesi, Michele (1999). Scaling and Criticality in a Stochastic Multi-Agent Model of a Financial Market. *Nature*.
5. LeBaron, Blake and Arthur, W. Brian and Palmer, Richard (1999). Time Series Properties of an Artificial Stock Market. *Journal of Economic Dynamics and Control*.
6. Hirshleifer, David and Teoh, Siew Hong (2003). Herd Behaviour and Cascading in Capital Markets: A Review and Synthesis. *European Financial Management*.
7. Hong, Harrison and Kubik, Jeffrey D. and Stein, Jeremy C. (2004). Social Interaction and Stock-Market Participation. *The Journal of Finance*.
8. Adomavicius, Gediminas and Tuzhilin, Alexander (2005). Toward the Next Generation of Recommender Systems: A Survey of the State-of-the-Art and Possible Extensions. *IEEE Transactions on Knowledge and Data Engineering*.
9. Baker, Malcolm and Wurgler, Jeffrey (2006). Investor Sentiment and the Cross-Section of Stock Returns. *The Journal of Finance*.
10. Tetlock, Paul C. (2007). Giving Content to Investor Sentiment: The Role of Media in the Stock Market. *The Journal of Finance*.
11. Barber, Brad M. and Odean, Terrance (2008). All That Glitters: The Effect of Attention and News on the Buying Behavior of Individual and Institutional Investors. *The Review of Financial Studies*.
12. Farmer, J. Doyne and Foley, Duncan (2009). The Economy Needs Agent-Based Modelling. *Nature*.
13. Centola, Damon (2010). The Spread of Behavior in an Online Social Network Experiment. *Science*.
14. Loughran, Tim and McDonald, Bill (2011). When Is a Liability Not a Liability? Textual Analysis, Dictionaries, and 10-Ks. *The Journal of Finance*.
15. Kramer, Adam D. I. and Guillory, Jamie E. and Hancock, Jeffrey T. (2014). Experimental Evidence of Massive-Scale Emotional Contagion through Social Networks. *Proceedings of the National Academy of Sciences*.
16. Da, Zhi and Engelberg, Joseph and Gao, Pengjie (2015). The Sum of All FEARS Investor Sentiment and Asset Prices. *The Review of Financial Studies*.
17. Chen, Ting and Gao, Zhenyu and He, Jibao and Jiang, Wenxi and Xiong, Wei (2019). Daily Price Limits and Destructive Market Behavior. *Journal of Econometrics*.
18. Leippold, Markus and Wang, Qian and Zhou, Wenyu (2022). Machine Learning in the Chinese Stock Market. *Journal of Financial Economics*.
19. Covington, Paul and Adams, Jay and Sargin, Emre (2016). Deep Neural Networks for YouTube Recommendations. *Proceedings of the 10th ACM Conference on Recommender Systems*.
20. Park, Joon Sung and O'Brien, Joseph C. and Cai, Carrie J. and Morris, Meredith Ringel and Liang, Percy and Bernstein, Michael S. (2023). Generative Agents: Interactive Simulacra of Human Behavior. *Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology*.
21. Yang, Y. and Gong, Z. and Huang, W. and Yang, Q. and Zhou, Z. and Huang, Z. and Li, Y. and Gao, X. and Dai, Q. and Liu, B. and Qiu, K. and Yang, Y. and Chen, D. and Yang, X. and Luo, C. (2026). SkillOpt: Executive Strategy for Self-Evolving Agent Skills.
22. {alchaincyf} (2026). Darwin.SKILL: A System for Self-Evolving Agent Skills. [链接](https://github.com/alchaincyf/darwin-skill)
