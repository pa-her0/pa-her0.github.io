---
title: Hermes-EM：自迭代多 Agent 金融情绪市场仿真与风险感知交易
commentSlug: 'hermes-em-knowledge-graph-report'
published: 2026-07-31T00:30:00.000Z
draft: false
description: 将金融情绪传播、多 Agent 仿真、风险感知交易和经验保留组织为可追踪的知识与决策闭环。
image: /report-assets/hermes-em-knowledge-graph-report/dynamic_agent_market.png
tags:
  - 知识图谱
  - 多智能体
  - Hermes-EM
category: 学习
lang: zh-CN
---
西南财经大学计算机与人工智能学院\
School of Computing and Artificial Intelligence, SWUFE\
期末报告


**Hermes-EM：自迭代多 Agent 金融情绪市场仿真与风险感知交易**

**42311102刘勇杰**


金融市场中的价格波动并不只来自历史行情和基本面信息，新闻事件、社交传播、投资者注意力、订单簿结构和交易主体行为共同构成了复杂的金融大数据环境。传统算法交易系统通常依赖历史行情回测或价格动量信号，难以在可控条件下复现新闻冲击、社交过热、短线资金撤退和流动性收缩等情绪驱动场景；已有市场仿真又往往停留在现象展示层面，缺少与风险感知交易 Agent 的闭环连接。针对这一问题，本文提出 Hermes-EM，一个面向算法交易研究的多 Agent 情绪市场仿真框架。该框架以 A 股交易规则和异质投资者行为为约束，构造新闻事件、社交传播、订单簿撮合、群体情绪和价格反馈之间的动态循环，并将 Hermes Quant Agent 嵌入该仿真市场中进行观察、决策、复盘和经验更新。实验以“涨停失败/主力诱多”场景为例，展示价格情绪曲线、社交传播链、微观结构信号和策略财富曲线。结果表明，Hermes 情绪感知策略能够在社交过热、传闻扩散和流动性下降阶段主动降低风险暴露，最终取得 1.66% 的收益率和 0.28% 的最大回撤；相比之下，追涨动量基线收益率为 -5.10%，最大回撤为 6.72%。该结果说明，多 Agent 仿真市场可为算法交易 Agent 提供可控、可解释、可复盘的情绪风险测试环境。代码仓库：[HanaViolet/Hermes-EM](https://github.com/HanaViolet/Hermes-EM)。

多 Agent 仿真；算法交易；金融大数据；情绪市场；投资者情绪；风险感知决策

# 1 引言

随着金融市场信息源不断扩展，算法交易面对的数据已经从单一价格序列扩展为行情、成交、新闻、社交媒体、订单簿、资金流和投资者行为共同组成的金融大数据流。对交易系统而言，关键问题不再只是预测下一时刻价格涨跌，而是判断价格变化背后的信息来源、传播路径、交易拥挤程度和潜在风险。尤其在 A 股市场中，涨跌停制度、散户参与度、短线资金行为和社交平台热度会放大情绪传播，形成“利好扩散–追涨聚集–封单松动–恐慌杀跌”的复杂链条。若交易系统只观察价格动量，就可能在上涨后段继续加仓；若只观察新闻情绪，又可能被短期叙事牵引而忽视盘口流动性。

已有量化交易框架如 FinRL、FinRL-Meta 和 TradeMaster 将交易任务抽象为环境、状态、动作、奖励与回测评估，为深度强化学习和自动化策略比较提供了标准化研究基础。同时，金融大语言模型和多 Agent 技术使交易系统能够理解文本新闻、整合外部信息、记录记忆并生成自然语言解释。然而，面向可解释金融智能体研究，仍然存在三个不足：第一，端到端交易模型往往难以说明交易信号来自新闻、技术指标、社交热度还是风险控制；第二，普通历史回测很难低成本复现封单失败、传闻扩散、社交恐慌等极端情绪情景；第三，Agent 的运行日志不一定能沉淀为下一轮可检索、可验证的经验准则。

本文围绕 Hermes-EM 系统展开研究，将多 Agent 情绪传播市场与 Hermes Quant Agent 统一到同一仿真环境中。本文的核心论点是：在可控市场中同时模拟新闻冲击、社交传播、订单行为、价格反馈和交易者复盘，有助于算法交易 Agent 在动态情景中区分趋势延续、情绪过热和流动性风险。由此，金融大数据不再仅作为输入变量集合，算法交易也不再仅表现为买卖动作输出，而是形成“认知–传播–交易–反馈–进化”的闭环过程。

本文主要工作包括四点。第一，设计面向 A 股市场的多 Agent 情绪仿真环境，将新闻事件、社交传播、订单簿撮合和异质投资者行为放入同一动态系统。第二，构建情绪市场与交易 Agent 的协同建模框架，使新闻冲击、社交扩散、盘口变化和交易反馈能够在同一环境中被观察和追踪。第三，提出风险优先的多 Agent 交易决策链，使 Hermes Agent 在生成 Buy/Sell/Hold 前经过市场感知、指标分析、新闻情绪、风险闸门、回测证据和经验记忆等环节。第四，通过“涨停失败/主力诱多”仿真数据展示系统如何识别社交过热、传闻扩散和流动性收缩，并比较动量基线与 Hermes 情绪感知策略的表现。

# 2 相关工作

## 2.1 金融大数据与投资者情绪

行为金融研究表明，噪声交易、过度反应、信息瀑布和从众行为会影响资产价格，投资者情绪并非只是一种心理描述，而可以通过新闻文本、媒体语调、搜索行为、交易活跃度和社交表达间接观测。在 A 股市场中，涨跌停制度和高换手率会进一步放大短线注意力：当价格接近涨停时，社交热度、封单强度和资金流向会共同影响投资者对后续走势的判断。因此，金融大数据分析需要同时处理结构化行情数据和非结构化文本、社交互动与订单簿信号。

## 2.2 多智能体金融市场仿真

人工股票市场和多智能体金融建模强调，市场价格可以看作异质主体在信息、偏好和约束下交互形成的结果。与静态数据集相比，多 Agent 仿真能够构造可控场景，并观察不同角色在新闻冲击、社交传播和订单簿撮合中的行为差异。在此基础上，Hermes-EM 将散户学习者、游资、公募、北向资金、稳定资金、普通量化和训练型 Hermes Agent 放入同一个 A 股式仿真市场中，使市场状态由新闻、社交传播、异质订单和价格反馈共同生成。

## 2.3 算法交易与金融 Agent

算法交易从早期技术指标和统计套利，发展到机器学习预测、强化学习和多任务交易平台。FinRL 系列框架降低了金融强化学习的实验门槛，TradeMaster 则进一步强调多任务、多数据集和标准化评估。近年来，LLM Agent 在金融场景中被用于新闻理解、策略解释、信息整合和记忆反思。但金融 Agent 若要进入交易决策环节，仍需要风险约束、回测证据、仓位控制和可审计决策链。本文的 Hermes Agent 采用多 Agent 分工与风险优先机制，结合 LLM 的解释能力与量化风控机制。

## 2.4 可解释金融 Agent 与经验记忆

可解释金融 Agent 的核心挑战在于将多源信号转化为可审计的交易理由。仅依赖端到端模型可能得到较高回测收益，却难以说明一次买卖动作是由价格趋势、新闻叙事、社交热度还是风险约束驱动。FinAgent 和 FinMem 等研究已经引入反思与记忆机制，使 Agent 能够利用历史经验调整后续判断。本文沿着这一思路，将交易后的收益、回撤、风险暴露和错误归因压缩为策略级经验，并将经验记忆纳入下一轮交易决策，使仿真市场中的实验结果能够影响后续行为。

# 3 基础与定义

## 3.1 多 Agent 仿真市场基本要素

本文将多 Agent 情绪市场表示为
$$
\mathcal{M}_t=(\mathcal{A}_t,\mathcal{I}_t,\mathcal{O}_t,\mathcal{S}_t,\mathcal{R}),
$$
其中 $\mathcal{A}_t$ 表示市场参与者集合，$\mathcal{I}_t$ 表示新闻、帖子和传闻等信息集合，$\mathcal{O}_t$ 表示订单与成交记录，$\mathcal{S}_t$ 表示价格、成交量、情绪、拥挤度和流动性等市场状态，$\mathcal{R}$ 表示交易制度和角色行为规则。该表示不追求复刻真实市场中的每个主体，而是用可控的异质行为刻画情绪传播、交易拥挤和价格反馈之间的关系。

具体而言，信息事件包括订单利好、封单不足传闻和游资撤退等外部冲击，它们会改变市场主体的信息暴露和情绪判断；市场主体包括散户、游资、公募、量化研究员和 Hermes Agent，不同主体依据各自风险偏好、信息来源和交易约束生成委托、撤单、成交与持仓变化；社交传播则通过看多帖、风险提醒、传闻帖和分析帖的点赞、收藏、转发与推荐曝光放大或反转市场情绪。上述过程共同影响价格、成交量、盘口深度、拥挤度和流动性，并进一步形成可被交易 Agent 读取的市场状态。交易结束后，收益、回撤、风险暴露和失败归因会被压缩为经验记忆，在验证通过后影响后续相似情景中的决策。

## 3.2 动态市场状态

在仿真市场中，一个 tick 的市场状态可写为
$$
E_t=(P_t,V_t,S_t,H_t,L_t,Q_t,N_t),
$$
其中 $P_t$ 为价格，$V_t$ 为成交量，$S_t$ 为市场情绪，$H_t$ 为从众或拥挤度，$L_t$ 为流动性，$Q_t$ 为订单簿状态，$N_t$ 为新闻和社交信息集合。市场状态更新由新闻冲击、Agent 订单、社交传播和规则约束共同决定：
$$
E_{t+1}=\Phi(E_t,N_t,O_t,A_t)+\epsilon_t,
$$
其中 $O_t$ 表示 tick $t$ 的订单集合，$A_t$ 表示 Agent 群体的行为状态，$\epsilon_t$ 表示随机扰动。该定义强调新闻不会直接决定价格，而是通过投资者认知、社交传播和订单簿反馈逐步传导。

## 3.3 风险优先交易决策

Hermes Agent 的交易动作集合记为 $\mathcal{D}=\{\mathrm{Buy},\mathrm{Sell},\mathrm{Hold},\mathrm{RiskOff}\}$。在每一轮决策中，系统先计算策略、市场状态、风险、回测、指标、新闻和记忆等分项评分，再经风险闸门修正。综合评分可写为
$$
D_t=0.30S_{\mathrm{strategy}}+0.18S_{\mathrm{regime}}+0.18(100-R_{\mathrm{risk}})
+0.10S_{\mathrm{backtest}}+0.10S_{\mathrm{indicator}}+0.09S_{\mathrm{news}}+0.05S_{\mathrm{memory}}.
$$
若风险分数 $R_{\mathrm{risk}}$ 过高，即使策略评分较高，系统也会降低仓位或输出 RiskOff。该机制使交易动作不由单一信号决定，而由市场状态、情绪传播、风险约束和经验记忆共同决定。

# 4 应用模型及方法

## 4.1 系统总体架构

Hermes-EM 的总体设计可以概括为“多 Agent 情绪市场 + 风险感知交易 Agent + 经验自进化机制”。这一框架服务于三个相互衔接的研究任务：多 Agent 情绪市场用于生成可控且可追踪的市场情景，风险感知交易 Agent 用于在行情、情绪、盘口和历史经验之间形成交易判断，经验自进化机制则将交易结果和失败归因转化为后续可复用的行为准则。三者共同解决一个核心问题：如何将非结构化情绪信息、结构化行情信号和交易经验转化为可解释、可复盘的算法交易过程。

图 1 展示 Hermes-EM 的整体市场仿真闭环。外部新闻、投资者认知、社交传播、订单形成和价格反馈并非彼此独立，而是在同一市场环境中相互触发，并为交易 Agent 提供可观察的风险场景。

图中上方对应外部信息进入市场后的认知更新路径，中部对应信息传播与订单行为之间的交易闭环，下方给出规则约束、异质主体、传播可追踪和路径推演四类实验条件。该结构使价格反转能够被分解为新闻冲击、情绪扩散、订单变化和策略反馈组成的证据链，而非仅归因于价格波动本身。

<figure id="fig:market_arch">
<img src="/report-assets/hermes-em-knowledge-graph-report/market_design_architecture.png" style="width:94.0%" />
<figcaption>A 股情绪传播仿真市场架构。新闻、社交传播、订单行为、价格反馈和策略学习共同构成可观测的市场测试环境。</figcaption>
</figure>

图 2 进一步给出 Hermes Quant Agent 的内部决策链。交易动作并非由单一价格信号直接产生，而是在数据接入、指标分析、新闻情绪、风险控制、回测证据和策略记忆共同约束后生成。

<figure id="fig:agent_arch">
<img src="/report-assets/hermes-em-knowledge-graph-report/hermes_quant_agent_architecture.png" style="width:82.0%" />
<figcaption>Hermes Quant Agent 架构。系统从数据接入、指标分析、新闻情绪、风险控制、回测证据和策略记忆中生成可解释交易决策。</figcaption>
</figure>

## 4.2 金融大数据层：情绪市场与传播链

金融大数据层的任务是将真实市场中难以直接控制的情绪传播过程转化为可观察、可复现实验环境。系统设置散户学习者、游资、公募基金、北向资金、稳定资金、普通量化和 Hermes Agent 等角色。不同角色拥有不同信息源、风险偏好和行为约束：散户更容易受推荐流和传闻影响，游资关注涨停接力和撤退阈值，机构更重视估值与组合约束，Hermes Agent 则将这些行为作为训练环境中的可观测信号。

<figure id="fig:dynamic_market">
<img src="/report-assets/hermes-em-knowledge-graph-report/dynamic_agent_market.png" style="width:96.0%" />
<figcaption>动态多 Agent 市场环境。外部新闻经由异质 Agent 的认知更新、社交互动和订单簿反馈形成多条可能市场路径。</figcaption>
</figure>

## 4.3 信息传播与交易证据融合

信息传播层连接金融大数据与算法交易。其处理过程包括四步：第一，从新闻事件和社交帖子中刻画事件类型、情绪方向、强度、可信度和时间衰减；第二，记录帖子传播、点赞、收藏、转发和关注关系，以刻画社交热度扩散过程；第三，记录每个 Agent 的观察、决策、委托、成交和收益，以形成可复查的行为轨迹；第四，将市场状态、策略结果和复盘结论写入经验记忆。由此，卖出决策可被追溯至一组明确证据：tick 52 出现封单不足传闻，风险帖子热度上升，游资净流出，盘口流动性下降，且历史经验提示高拥挤、低流动性场景应降低仓位。

## 4.4 算法交易层：多 Agent 决策链

算法交易层由 Hermes Quant Agent 完成。该层并非由单一模型直接输出买卖信号，而是将交易任务拆分为多个专业环节：市场感知 Agent 读取行情、成交量和订单簿；指标分析 Agent 计算 RSI、MACD、动量和波动率；新闻情绪 Agent 读取事件与社交传播记录；策略 Agent 生成候选交易动作；风险 Agent 检查回撤、仓位和拥挤风险；回测 Agent 提供历史表现证据；反思 Agent 将本轮结果压缩为经验记忆。

该设计使算法交易结果具有可审计性。若系统给出“减仓”而不是“继续追涨”，研究者可以回溯到具体市场证据：社交热度是否过快上升，传闻是否出现，游资是否撤退，订单簿买盘深度是否下降，历史经验中是否存在相似失败案例。该回溯能力使 Hermes Agent 的交易建议不再是孤立信号，而是由市场状态、主体行为和风险约束共同支撑的可解释结果。

## 4.5 经验自进化机制

Hermes-EM 中的经验自进化机制采用“记录–评价–归因–候选经验–验证–保留”的闭环。系统并不将一次交易日志直接视为新规则，而是先评估收益、回撤和解释一致性，再分析导致成功或失败的市场条件，最后在独立验证场景中检验候选经验是否稳定有效。只有当候选经验能够同时改善风险收益表现和决策可解释性时，经验才会进入下一轮行为准则。对市场角色而言，该机制可避免散户、游资、机构和量化角色因单次噪声反馈而偏离原有画像；对 Hermes Agent 而言，该机制可将“高社交热度 + 低流动性 + 游资撤退”这类失败模式压缩为可复用风险纪律。经验更新机制的文献依据见附录。

# 5 实验分析

## 5.1 实验数据

实验采用 Hermes-EM 生成的仿真市场数据，而非真实交易数据。场景命名为“涨停失败/主力诱多”，共包含 0–90 个 tick。原始记录由 tick 级行情与情绪、事件日志、社交传播链、Agent 关键决策、阶段统计和策略财富曲线六类数据组成。主要字段包括价格、成交量、市场情绪、散户情绪、游资情绪、盘口不平衡、拥挤度、新闻冲击、买卖主动比例、流动性、波动率、社交热度、传闻热度、资金净流、Hermes 动作和动作理由。

| 阶段     | tick 区间 |  均价 | 最高价 | 平均情绪 | 平均拥挤度 | 平均流动性 |
|:---------|:---------:|------:|-------:|---------:|-----------:|-----------:|
| 稳定吸筹 |   0–20    | 10.00 |  10.03 |    0.002 |      0.097 |      0.722 |
| 利好铺垫 |   21–34   | 10.26 |  10.48 |    0.278 |      0.310 |      0.797 |
| 拉升追涨 |   35–48   | 10.71 |  10.92 |    0.656 |      0.632 |      0.782 |
| 封单松动 |   49–60   | 10.51 |  10.87 |    0.251 |      0.678 |      0.579 |
| 恐慌杀跌 |   61–72   |  9.76 |  10.03 |   -0.503 |      0.759 |      0.361 |
| 护盘修复 |   73–90   |  9.69 |   9.88 |   -0.362 |      0.572 |      0.488 |

涨停失败场景的阶段统计

## 5.2 评价指标及基准模型

本文实验以方法验证为目标，不将仿真收益外推为真实市场收益。评价指标包括四类：第一，传播可解释性，即能否从事件日志和社交传播链追踪情绪变化来源；第二，微观结构识别能力，即能否在价格大幅下跌前观察到盘口不平衡、流动性收缩和拥挤度上升；第三，策略表现，包括最终收益率和最大回撤；第四，经验沉淀能力，即系统能否把交易结果压缩为后续可检索的经验摘要。

对照基准为追涨动量策略。该策略在价格拉升阶段买入，在恐慌下跌后被动退出，主要依据价格动量作出动作。Hermes 情绪感知策略则同时读取新闻、社交热度、传闻强度、拥挤度、盘口流动性和 Agent 行为，并在社交过热与封单风险出现时主动降低仓位。

## 5.3 实验方法

实验事件链如下：tick 22 出现虚拟产业订单利好；tick 36 游资集中买入并发布看多内容，推荐系统放大热度；tick 48 Hermes 观测到社交热度、拥挤度和盘口买盘同时处于高位；tick 52 出现封单不足传闻，风险帖子热度超过看多帖；tick 56 游资撤单并集中卖出；tick 64 买盘深度快速下降，价差扩大，恐慌情绪沿社交边传播；tick 74 稳定资金入场，盘口买盘深度修复。

在此过程中，仿真日志持续记录三类证据：一是事件及其情绪冲击，二是帖子传播和社交热度变化，三是 Agent 订单、资金流和市场状态变化。Hermes Agent 的动作也被同步记录，例如 tick 24 小仓位试探买入，tick 45 在社交热度与盘口买盘同时过热时降低追涨暴露，tick 52 在封单不足传闻扩散且游资净流出时退出高位仓位，tick 74 在护盘资金入场且卖压衰减时分批低吸。

## 5.4 实验结果与分析

首先，价格和情绪曲线说明该场景并非单调利好行情。图 <a href="#fig:price_sentiment" data-reference-type="ref" data-reference="fig:price_sentiment">4</a> 显示，价格先在利好和游资推动下从 10 元附近上升至 10.9 元附近，随后在传闻和流动性冲击下快速回落。市场情绪也经历了由中性到乐观、再由乐观转为恐慌的过程。该结果说明情绪传播链能够生成比普通历史回测更丰富的训练情景。

<figure id="fig:price_sentiment">
<img src="/report-assets/hermes-em-knowledge-graph-report/price_sentiment.png" style="width:88.0%" />
<figcaption>价格与市场情绪变化。价格先被利好和游资行为推高，随后在传闻扩散与流动性冲击下快速下行。</figcaption>
</figure>

其次，社交传播和微观结构信号提供了价格反转前的风险证据。传闻出现后，风险帖子快速获得点赞、收藏和转发，社交热度没有立即下降，反而从看多扩散转向恐慌扩散；与此同时，在封单松动后，拥挤度仍处于高位，但流动性明显下降，形成“高拥挤、低流动性”的危险组合。该组合正是 Hermes Agent 降低仓位的主要证据。相关传播曲线与盘口信号见附录“补充实验结果”。

这一结果也说明，多 Agent 情绪市场的价值不仅在于生成价格路径，还在于同时保留价格路径背后的传播证据和交易证据。对于算法交易 Agent 而言，这类证据可以帮助区分正常回调、情绪退潮和流动性坍缩三种不同风险来源。

最后，策略对比结果表明情绪市场仿真能够改善风险暴露时点。追涨动量基线在上涨后段继续跟随价格，最终财富为 949000 元，收益率为 -5.10%，最大回撤为 6.72%。Hermes 情绪感知策略在 tick 45 降低追涨暴露，在 tick 52 退出高位仓位，并在护盘修复阶段分批低吸，最终财富为 1016640 元，收益率为 1.66%，最大回撤为 0.28%。两者差异并不只来自最终收益，而来自决策证据的不同：动量策略只能看到价格仍在高位，Hermes Agent 还能看到传闻扩散、社交恐慌、游资撤退、流动性下降和历史经验中的相似风险模式。

<figure id="fig:strategy">
<img src="/report-assets/hermes-em-knowledge-graph-report/strategy_comparison.png" style="width:86.0%" />
<figcaption>Hermes 情绪感知策略与追涨动量基线的财富曲线对比。Hermes 在社交过热和传闻扩散阶段降低仓位，从而避开主要下跌段。</figcaption>
</figure>

| 策略                | 最终财富/元 | 收益率 | 最大回撤 |
|:--------------------|------------:|-------:|---------:|
| 追涨动量基线        |      949000 | -5.10% |    6.72% |
| Hermes 情绪感知策略 |     1016640 |  1.66% |    0.28% |

策略对比结果

此外，实验记录了经验沉淀过程。系统将多轮运行后的单次交易记录压缩为策略级经验摘要，并在下一轮面对相似市场状态时检索使用。例如，“社交热度与传闻热度同时上升且盘口流动性下降时，应降低追涨仓位”由 tick 45–64 的风险链条提供支持。该类经验由交易结果、风险指标和验证门控共同筛选形成，相关可视化记录和补充证据见附录。

# 6 总结与展望

本文围绕 Hermes-EM 构建了融合金融大数据、多 Agent 情绪市场和算法交易 Agent 的方法框架。情绪市场生成新闻、社交传播、订单簿和异质主体行为；交易 Agent 读取市场状态、情绪传播、风险约束和历史经验，在风险约束下给出可解释交易动作，并将交易结果反向沉淀为经验准则。

实验分析表明，在“涨停失败/主力诱多”场景中，仅基于价格动量难以及时识别上涨后段的拥挤风险，而 Hermes Agent 可以结合社交热度、传闻扩散、盘口流动性、游资撤退和历史经验提前降低风险暴露。进一步研究可结合真实新闻、公告、研报和盘口数据，并引入更严格的回测协议、交易成本建模和跨场景经验验证。


99 De Long, J. B., Shleifer, A., Summers, L. H., and Waldmann, R. J. Noise trader risk in financial markets. *Journal of Political Economy*, 1990.

Bikhchandani, S., Hirshleifer, D., and Welch, I. A theory of fads, fashion, custom, and cultural change as informational cascades. *Journal of Political Economy*, 1992.

Tetlock, P. C. Giving content to investor sentiment: The role of media in the stock market. *Journal of Finance*, 2007.

Loughran, T., and McDonald, B. When is a liability not a liability? Textual analysis, dictionaries, and 10-Ks. *Journal of Finance*, 2011.

Lux, T., and Marchesi, M. Scaling and criticality in a stochastic multi-agent model of a financial market. *Nature*, 1999.

LeBaron, B., Arthur, W. B., and Palmer, R. Time series properties of an artificial stock market. *Journal of Economic Dynamics and Control*, 1999.

Farmer, J. D., and Foley, D. The economy needs agent-based modelling. *Nature*, 2009.

Liu, X.-Y., et al. FinRL: Deep reinforcement learning framework to automate trading in quantitative finance. 2021.

Liu, X.-Y., et al. FinRL-Meta: Market environments and benchmarks for data-driven financial reinforcement learning. 2022.

Sun, S., et al. TradeMaster: A holistic quantitative trading platform empowered by reinforcement learning. 2023.

Yang, H., et al. FinGPT: Open-source financial large language models. 2023.

Yang, H., et al. FinRobot: An open-source AI agent platform for financial applications. 2024.

Zhang, W., et al. FinAgent: A multimodal foundation agent for financial trading. 2024.

Yu, Y., et al. FinMem: A performance-enhanced LLM trading agent with layered memory and character design. 2025.

Huang, Z., Xu, J., Yang, Y., Gong, Z., Yang, Q., Tian, M., Wang, X., Lv, C., Gao, X., Dai, Q., Liu, B., Qiu, K., Yang, X., Chen, D., Zheng, X., and Luo, C. From raw experience to skill consumption: A systematic study of model-generated agent skills. *arXiv preprint arXiv:2605.23899*, 2026.

Yang, Y., Gong, Z., Huang, W., Yang, Q., Zhou, Z., Huang, Z., Li, Y., Gao, X., Dai, Q., Liu, B., et al. SkillOpt: Executive strategy for self-evolving agent skills. *arXiv preprint arXiv:2605.23904*, 2026.

alchaincyf. Darwin-skill: Autoresearch-inspired autonomous skill optimization for Claude Code. GitHub repository, 2026. <https://github.com/alchaincyf/darwin-skill>.


# 附录

## 补充实验结果

本节补充展示正文实验分析中未展开的传播链、微观结构和经验沉淀结果。这些材料主要说明“社交过热–传闻扩散–流动性下降–风险降仓”这一证据链，不额外引入新的实验结论。

图 A1 展示情绪传播由“看多扩散”转向“风险扩散”的过程。传闻热度上升后，社交热度并未立即降温，而是在推荐机制作用下继续放大，进而推动恐慌情绪扩散。

<figure id="fig:social_spread">
<img src="/report-assets/hermes-em-knowledge-graph-report/social_spread.png" style="width:88.0%" />
<figcaption>社交热度、传闻热度与拥挤度变化。风险帖子被推荐系统放大后，情绪由乐观追涨切换为恐慌传播。</figcaption>
</figure>

图 A2 补充说明盘口层面的风险信号。封单松动后，买卖盘不平衡快速转弱，而拥挤度仍处于高位，表明大量资金仍暴露在流动性下降的环境中，该信号构成 Hermes Agent 主动降仓的重要依据。

三条曲线分别对应不同风险维度：拥挤度反映追涨仓位集中程度，流动性反映仓位退出条件，盘口不平衡反映买卖力量变化。当拥挤度未明显下降而流动性先行转弱时，交易拥挤可能进一步放大价格下行压力。

结合正文策略财富曲线可见，Hermes Agent 在高位降低仓位并非由价格下跌本身触发，而是由流动性、盘口和拥挤度共同提供的前置风险信号触发。该结果支持本文关于“交易动作应由多源风险证据共同约束”的设计原则。

<figure id="fig:microstructure">
<img src="/report-assets/hermes-em-knowledge-graph-report/microstructure_signals.png" style="width:88.0%" />
<figcaption>盘口不平衡、流动性和拥挤度变化。封单松动后买盘深度下降，拥挤交易暴露出更高下行风险。</figcaption>
</figure>

图 A3 展示交易复盘向经验记忆转化的过程。系统将收益、风险和失败归因压缩为可检索经验，使下一轮相似场景中的交易动作受到历史风险纪律约束。

<figure id="fig:experience">
<img src="/report-assets/hermes-em-knowledge-graph-report/agent_experience_module.png" style="width:90.0%" />
<figcaption>Hermes Agent 经验学习模块。系统将多轮交易结果压缩为策略级经验摘要，并展示运行档案、收益、风险和经验结论。</figcaption>
</figure>

## 仿真过程可视化记录

本节给出 Hermes-EM 的可视化记录，用于补充说明仿真市场状态和 Agent 行为轨迹的观测方式。这些记录主要说明实验过程如何被观察和回溯，不额外引入新的实验结论。

图 A4 给出多 Agent 市场沙盘的整体状态记录。该图表明，仿真市场并非单一价格序列，而是由不同角色、市场场景和交易状态共同构成的动态实验空间。

<figure id="fig:app_market_sandbox">
<img src="/report-assets/hermes-em-knowledge-graph-report/frontend_market_sandbox_method.png" style="width:95.0%" />
<figcaption>多 Agent 市场沙盘记录。不同市场角色被放置在同一仿真空间中，使主体行为、市场场景和交易状态可以相互对应。</figcaption>
</figure>

图 A5 展示单个 Agent 或 Agent 群体的行为记录。资产、持仓、收益、观察、决策、委托和反馈被组织在同一记录框架中，用于追踪一次交易动作从观察到执行再到结果反馈的完整链条。

该材料将“市场角色”从抽象设定转化为可检查的行为记录。通过比较不同主体在同一事件冲击下的仓位变化、交易动作和收益反馈，可以区分单一主体异常行为与多主体同向共振对市场波动的影响。

<figure id="fig:app_agent_cards">
<img src="/report-assets/hermes-em-knowledge-graph-report/frontend_agent_cards_method.png" style="width:90.0%" />
<figcaption>Agent 群体卡片与动作流程记录。图中展示资产、持仓、收益、观察、决策、委托和反馈，为仿真市场行为轨迹提供可观察记录。</figcaption>
</figure>

## 经验更新机制的文献依据

Hermes-EM 的经验自进化模块使用了 Darwin-skill 与 SkillOpt/SkillLens 的方法思想。Darwin-skill 强调“评估–改进–验证–保留或回滚”的棘轮式优化过程，只在候选经验带来可测量改进时更新基线。SkillOpt 将自然语言技能视为冻结 Agent 的外部可训练状态，通过轨迹采样、反思、受限编辑和验证门控生成可部署的经验规则；SkillLens 则从经验生成、技能抽取和技能消费三个阶段系统研究模型生成技能的有效性，为本文的经验抽取与复用提供了方法论依据。在本文中，这些方法被转化为交易场景下的经验筛选机制：只有经过收益、回撤、风险暴露和解释一致性验证的交易经验，才会进入 Hermes Agent 的后续决策准则。

图 A6 从流程验证和性能保留两个角度说明经验更新机制。上图展示候选经验的评估、改进、验证和确认流程；下图展示仅保留有效改进、回滚退化候选的棘轮机制，以避免噪声样本破坏稳定决策基线。

<figure id="fig:app_darwin">
<img src="/report-assets/hermes-em-knowledge-graph-report/darwin_skill_core_loop.png" style="width:90.0%" />
<img src="/report-assets/hermes-em-knowledge-graph-report/darwin_skill_ratchet_mechanism.png" style="width:90.0%" />
<figcaption>Darwin-skill 式经验保留机制。上图展示评估、改进、验证和确认流程；下图展示只保留有效改进、退化候选自动回滚的棘轮逻辑。</figcaption>
</figure>

图 A7 进一步说明文本形式经验规则的优化过程。交易轨迹首先形成反馈，再经过反思和受限编辑生成候选规则，最后由验证门控决定是否进入后续决策准则。

与图 A6 侧重经验保留机制不同，图 A7 侧重经验规则的文本化表达。在交易场景中，复盘结果不仅包含盈亏数字，还需要提炼为可被下一轮检索的条件化表述，例如“社交热度持续上升但盘口流动性转弱时，应降低追涨仓位”。这类文本经验经过验证后，可由复盘记录转化为策略约束。

<figure id="fig:app_skillopt">
<img src="/report-assets/hermes-em-knowledge-graph-report/skillopt_training_loop.png" style="width:94.0%" />
<figcaption>SkillOpt 式文本空间训练循环。该方法将经验规则视为可优化文本对象，通过轨迹反馈、反思编辑和验证门控形成可复用技能。</figcaption>
</figure>

图 A7 对应到本文实验时，失败轨迹不会被直接写入交易策略，而是先形成候选经验，再通过验证门控判断是否保留。如果候选经验只能解释一次偶然波动，系统仍保留原有规则；只有当它能够稳定降低回撤或改善决策一致性时，才会成为下一轮可检索的经验。

在“涨停失败/主力诱多”场景中，经验更新主要提取 tick 45–64 之间的风险条件，包括社交热度继续上升、封单不足传闻扩散、游资净流出和盘口流动性下降。经过验证后，这些条件被整理为风险提醒，帮助 Hermes Agent 在相似场景中优先降低高位追涨暴露。

附录材料主要补充两类证据：一类是市场状态和 Agent 行为轨迹，另一类是经验规则生成与验证流程。二者共同说明，Hermes-EM 可以在同一仿真链条中观察情绪传播、交易拥挤和经验更新过程；相关结论主要对应本文设置的仿真场景。
