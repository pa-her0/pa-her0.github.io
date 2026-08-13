---
title: 关于转生成为传奇交易员这件事
commentSlug: 'hermes-quant-agent-algorithmic-trading'
published: 2026-07-31T00:20:00.000Z
draft: false
description: 面向仿真情绪市场的 Hermes Quant Agent：从多 Agent 协同、风险修正到经验学习与算法交易实验。
image: >-
  /report-assets/hermes-quant-agent-algorithmic-trading/hermes_quant_agent_architecture.png
tags:
  - 算法交易
  - 多智能体
  - Hermes-EM
category: 学习
lang: zh-CN
---
------------------------------------------------------------------------


**关于转生成为传奇交易员这件事**


------------------------------------------------------------------------


|              |              |              |
|:------------:|:------------:|:------------:|
|  **刘勇杰**  |  **李家豪**  |  **闫晨曦**  |
| 西南财经大学 | 西南财经大学 | 西南财经大学 |


**Abstract**


算法交易正在从单一预测模型转向由多源信息、风险约束和自适应决策共同构成的智能交易系统。然而，现有量化交易 Agent 往往存在三类不足：其一，模型容易将价格、新闻、技术指标和风险控制混合在同一黑箱中，难以解释交易决策的形成过程；其二，许多 Agent 主要在历史行情回测中优化，缺少可控的情绪传播与极端市场情景试炼；其三，Agent 的经验积累容易停留在一次性记录层面，难以形成可复用、可验证的行为准则。针对这些问题，本文设计并实现一个面向仿真情绪市场的自进化多 Agent 量化交易者 Hermes Quant Agent（下称 Hermes Agent）。该系统将交易过程抽象为市场感知、专业分析、风险审查、决策解释和经验进化五个功能层，并通过前端可视化展示不同 Agent 的分析结果、证据冲突和修正过程。进一步地，本文将 Hermes Agent 与多 Agent 仿真情绪市场连接，使其在新闻冲击、社交传播、盘口变化和群体情绪反馈构成的沙盒环境中接受训练。实验部分展示系统前端功能、Agent 决策链和经验学习结果。结果表明，该架构能够把交易决策从单一买卖信号扩展为可追踪的认知–传播–交易–反馈闭环，为低成本训练、解释和优化量化 Agent 提供可复用框架。项目代码见 GitHub：[`HanaViolet/Hermes-EM`](https://github.com/HanaViolet/Hermes-EM)。

多 Agent；量化交易；仿真情绪市场；可解释决策；经验自优化；金融大数据


# 一、引言

随着金融市场数据维度不断扩展，量化交易系统已经不再只是对价格序列进行拟合的预测模型，而逐渐演化为能够同时处理行情、新闻、指标、风险和执行约束的自动化决策系统。传统算法交易通常依赖技术指标、统计套利、机器学习预测或强化学习策略。近年来，FinRL、FinRL-Meta 和 TradeMaster 等框架将交易任务抽象为环境、状态、动作、奖励和回测评估，使深度强化学习能够在标准化交易流程中训练和比较。与此同时，大语言模型和 Agent 技术的发展，使交易系统可以调用工具、理解自然语言新闻、保留记忆并进行多角色协同，从而更接近真实交易员的分析流程。

<figure id="fig:intro_multi_agent">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/intro_multi_agent_collaboration.png" style="width:72.0%" />
<figcaption>多 Agent 协作范式示意。复杂任务可以被拆分给多个具有不同能力的 Agent，并通过协同通信、证据汇聚和结果整合形成最终解决方案。</figcaption>
</figure>

然而，面向真实金融市场的量化 Agent 仍然面临重要瓶颈。第一，单 Agent 或端到端模型容易把价格、新闻、风险和回测结果混合到黑箱中，用户难以判断交易建议来自何种证据。第二，历史数据回测只能复现已经发生的行情，较难低成本覆盖新闻冲击、情绪扩散、追涨过热、封单失败、恐慌杀跌等非平稳场景。第三，交易 Agent 即使能够保留运行记录，也不一定能把失败或成功经验转化为下一轮可执行的行为准则。换言之，一个更合理的量化 Agent 既不能只依赖价格和成交量，也不能只追随新闻和社交热度，而应当在识别真实趋势、情绪噪声和流动性冲击的基础上给出风险约束下的可解释决策。

相关研究已经从不同方向推进了这一问题。机器学习在中国股票市场中的研究说明，市场微观结构、散户参与和交易成本会显著影响预测信号的有效性；风险感知和层次化强化学习工作强调，日内交易和高频交易必须同时优化收益和风险；多专家交易和多 Agent 金融系统进一步表明，交易决策可以由多个专门模型或角色共同形成。不过，这些工作多以历史行情或标准化 benchmark 为主要训练对象，对情绪传播、社交曝光和订单簿反馈之间的闭环刻画仍然有限。StockAgent 和 MarS 等仿真市场研究说明，大模型或生成式 Agent 可以用于构造更复杂的投资者行为和市场环境，为本文将量化交易者放入仿真情绪市场中训练提供了启发。

本文提出 Hermes Agent，一个面向仿真情绪市场的自进化多 Agent 量化交易框架。系统不把交易任务压缩为单一预测模型，而是将其组织为“市场信息感知–专业 Agent 分析–风险约束审查–可解释交易决策–经验反馈进化”的链式结构。不同 Agent 分别负责行情、技术状态、新闻情绪、策略候选、风险测度、历史经验和决策审查，最终由协同决策机制给出交易动作、置信度、仓位约束和解释理由。该过程通过前端控制室可视化展示，使用户能够观察不同 Agent 如何形成判断、发生冲突并完成修正。

本文的主要贡献包括四点。第一，构建模块化、可解释的多 Agent 量化决策链，将传统量化交易中混合在同一模型内的数据处理、技术指标、新闻情绪、策略生成、风险控制、回测评估和交易解释拆分为可观察的专业 Agent。第二，引入风险优先的二阶段决策机制，使系统先由评分模型生成初始 Buy/Sell/Hold，再经过投票聚合、批判审查、冲突消解和决策修正，避免交易动作完全由单一模型或单一信号决定。第三，将量化交易 Agent 与仿真情绪市场连接，把新闻冲击、社交传播、盘口变化和群体情绪反馈纳入训练闭环，使 Agent 能在可控沙盒中学习区分真实趋势、情绪过热和流动性风险。第四，借鉴 SkillOpt 的思想，将交易后的收益、风险、回撤和 Agent 责任归因转化为可复用经验，并在验证门控下更新行为准则，从而使 Agent 具备可记录、可压缩、可验证的自优化能力。

# 二、相关工作

## （一）强化学习与机器学习量化交易

机器学习与深度强化学习已经成为量化交易的重要实现路径。Leippold 等对中国股票市场的机器学习研究表明，市场微观结构、流动性和交易成本会影响机器学习信号的有效性。FinRL 将数据处理、交易环境、深度强化学习算法和回测评估组织为可复现框架，降低了自动化交易研究的工程门槛；FinRL-Meta 进一步强调，交易研究需要统一的数据接口、市场环境和 benchmark，以便比较不同算法在多市场条件下的表现。TradeMaster 则将多任务交易、数据集和强化学习算法集成到统一平台，体现了量化交易研究从单个模型转向系统平台的趋势。

风险和交易执行也是强化学习交易的重要主题。DeepScalper 面向日内交易场景，强调在捕捉短暂机会时必须考虑风险约束；EarnHFT 针对高频交易提出层次化强化学习框架，说明复杂交易任务往往需要多层决策而非单一策略函数。AlphaMix 等多专家交易工作则通过混合不同交易专家来应对市场状态变化。与这些研究相比，本文不以提出新的强化学习算法为目标，而是把交易系统拆解为可解释 Agent 链条，并进一步把情绪传播与社交反馈纳入训练环境。

## （二）LLM 与多 Agent 金融决策

近年来，金融专用大语言模型为 Agent 化金融决策提供了新的基础能力。BloombergGPT 通过大规模金融语料训练领域模型，说明金融文本、市场数据和通用语料的混合训练可以提升金融任务表现；FinGPT 则从开放金融数据、自动化数据工程和轻量化适配角度，提出更低成本的开源金融 LLM 路径。在此基础上，FinRobot 将金融任务进一步组织为由专业 Agent、金融推理链、模型配置和数据工程组成的平台化工作流，体现了金融 AI 从单模型问答走向可组合工具链的趋势。

在交易决策层面，FinAgent 将多模态金融信息、工具调用和反思机制结合起来，用于金融交易任务；FinMem 通过分层记忆和角色设计增强 LLM 交易 Agent 对历史信息的吸收能力。TradingAgents 将交易过程组织为多角色协作，使不同 Agent 分别承担分析师、研究员、交易员和风险管理者等职责；FinCon 进一步提出带有概念化语言强化的多 Agent 金融决策系统，通过经理–分析师层级、风险控制和经验信念更新来改善序列投资决策；HedgeAgents 则从多 Agent 风险平衡角度讨论交易系统如何在波动市场中保持稳健。这些研究共同说明，LLM Agent 的价值不只是生成交易文本，而是将信息理解、记忆、讨论、审查和经验更新组织为可执行的决策流程。

与此同时，金融 Agent 的评估也需要更贴近真实交易任务。InvestorBench 指出，金融决策型 LLM Agent 不应只用一般问答准确率评价，而应结合收益、风险和任务成功率等指标。本文继承多 Agent 金融决策的思想，但对系统边界作出更严格限定：LLM 可以辅助新闻理解、策略建议和自然语言解释，但最终 Buy/Sell/Hold 由可控评分模型、风险闸门和批判修正共同决定。这一设计可以降低单一 LLM 幻觉、过度自信或被短期叙事牵引的风险。

## （三）仿真市场与情绪传播

真实金融市场中的价格变化不仅来自基本面，也来自新闻冲击、社交传播、群体情绪和流动性反馈。StockAgent 通过 LLM Agent 构造模拟投资者和股票市场环境，展示了大语言模型在市场行为仿真中的潜力。MarS 则进一步提出由生成式基础模型驱动的金融市场仿真引擎，用于刻画 Agent、订单和市场反馈之间的关系。这些工作说明，仿真市场可以为交易 Agent 提供历史回测之外的可控训练环境。

本文的“仿真情绪市场”与上述研究的目标一致，但更强调课程项目中的 A 股情境和情绪传播链条。该市场将外部新闻事件、投资者认知、社交传播、A 股交易规则和策略学习层放入同一闭环。新闻不直接决定价格，而是先改变异质 Agent 的信念、情绪和风险偏好，再通过关注网络、热榜推荐、买卖订单和订单簿反馈影响市场状态。这样的设计使 Hermes Agent 可以在低成本沙盒中反复经历平稳吸筹、利好拉升、追涨过热、封单松动、谣言扩散、恐慌杀跌和护盘修复等场景。

## （四）Agent 经验积累与行为准则自优化

交易 Agent 若只能输出一次性决策，就难以在复杂市场中持续进步。FinAgent 和 FinMem 已经引入反思与记忆机制，使 Agent 能够利用历史经验调整后续判断。SkillOpt 进一步把 Agent 的外部化技能文档视为可训练状态，而不是一次性人工提示：系统先收集带评分的 rollout 轨迹，再通过小批量反思生成候选技能编辑，并用受限文本更新、held-out validation gate 和慢速元更新来决定是否接受新技能。这一思想适合量化交易场景，因为交易结果通常可以用收益、夏普比率、最大回撤、风险分数和胜率等指标进行评价。

本文借鉴 SkillOpt 的自优化路径，将每轮交易的收益、夏普比率、最大回撤、风险分数、多 Agent 一致性和错误归因转化为策略级经验摘要。当同一类策略积累足够多的成功与失败样本后，系统对经验进行窗口式压缩，并在验证门控通过后更新后续行为准则。与普通运行记录不同，这种经验具有明确的行为指向，例如“风险分数超过阈值时降低仓位”“低胜率策略需要更严格止损”“多 Agent 一致但结果负面时必须重新检查风险纪律”。因此，Hermes Agent 的自优化不是一次性提示词调整，而是一个可记录、可拒绝、可验证的行为准则更新过程。

# 三、方法论：可解释多 Agent 交易链与情绪市场协同进化

## （一）总体架构

本文的核心方法不是把若干功能环节机械串联，而是构建一个“情绪市场试炼场 + 可解释多 Agent 交易链”的协同进化架构。图 <a href="#fig:sentiment_market_training" data-reference-type="ref" data-reference="fig:sentiment_market_training">2</a> 概括外部训练环境：仿真情绪市场提供新闻、行情、情绪反馈与风险冲击，量化 Agent 在其中接受试炼，并把交易结果反馈给策略优化过程。图 <a href="#fig:method_framework" data-reference-type="ref" data-reference="fig:method_framework">3</a> 展示 Agent 内部实现：系统接入层连接数据接口、任务调度、交易 Agent 和运行观测模块；交易决策层将市场数据转化为指标状态、新闻情绪、策略候选、风险约束、回测证据、策略记忆和协同判断，最终输出 Buy、Sell、Hold 或 Risk Off 等动作。

<figure id="fig:sentiment_market_training">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/sentiment_market_training_overview.png" style="width:98.0%" />
<figcaption>仿真情绪市场中的量化 Agent 历练流程。传奇交易员的日常生活被抽象为仿真情绪市场，市场中的新闻、行情、情绪与反馈共同构成训练场，量化交易者 Agent 在其中持续试炼、接收反馈并优化策略。</figcaption>
</figure>

<figure id="fig:method_framework">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/hermes_quant_agent_architecture.png" style="width:82.0%" />
<figcaption>Hermes Quant Agent 的总体架构。系统从数据接入、任务调度和运行观测进入交易决策流程，并在指标分析、市场状态识别、新闻情绪、策略选择、风险控制、回测证据和策略记忆之间形成可解释的多 Agent 协同链条。</figcaption>
</figure>

因此，与传统端到端预测模型相比，Hermes Agent 的重点不是直接预测涨跌，而是在情绪噪声、风险冲击和反馈迭代中保留每个判断环节，使交易决策能够被观察、被质疑和被修正。

## （二）多 Agent 协同机制

Hermes Agent 的多 Agent 协同并不是让多个 Agent 独立给出买卖建议后简单投票，而是让不同 Agent 承担交易认知链中的不同功能。信息型 Agent 负责把原始市场数据转化为可比较的状态变量；分析型 Agent 负责识别趋势、波动、情绪和策略适配关系；约束型 Agent 负责检查风险、回撤和仓位边界；反思型 Agent 负责发现证据冲突、记录经验并修正后续行为准则。通过这种分工，系统能够把“一个交易决策”拆解为若干可以单独检查的判断环节。

协同机制可以概括为“先分工、再对齐、后修正”。首先，不同 Agent 分别从价格、技术指标、新闻情绪、历史表现和市场状态中形成局部证据。其次，系统将这些局部证据汇总为统一的决策分数，并显式标记不同证据之间的冲突。例如，新闻情绪可能偏正面，但风险状态可能提示高波动；技术指标可能显示短期上行，但回测表现可能不稳定。最后，风险审查和批判机制对初始决策进行修正，决定是否执行、降低仓位或等待确认。这样，系统输出的不只是交易方向，还包括“为什么现在不应激进交易”的解释。

| 功能层 | 处理对象 | 方法作用 |
|:---|:---|:---|
| 市场感知 | 行情/成交/新闻/社交/盘口 | 多源信息标准化为市场状态 |
| 专业分析 | 技术趋势/情绪状态/策略候选/历史表现 | 形成局部证据，避免单一指标支配 |
| 风险审查 | 波动率/回撤/拥挤度/仓位暴露 | 施加风险边界与仓位约束 |
| 协同决策 | Agent 证据/冲突/置信度 | 聚合证据，解释冲突并输出建议 |
| 经验进化 | 交易结果/失败归因/成功条件 | 沉淀下一轮可复用经验 |

Hermes Quant Agent 的功能层与方法作用 {#tab:agent_modules}

图 <a href="#fig:agent_modules_frontend" data-reference-type="ref" data-reference="fig:agent_modules_frontend">4</a> 展示了上述功能层在前端中的可视化映射。系统没有把 Agent 隐藏在后台日志中，而是将市场数据室、指标实验室、策略实验室、风险报警室、决策调度台、执行日志台和报告分析室组织为可观察房间。每个房间对应一个可解释的分析环节，用户可以看到输入数据、输出结果、关键指标和自然语言解释，从而把方法论中的“多 Agent 协同链”转化为可检查的交互界面。

<figure id="fig:agent_modules_frontend">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/agent-frontend-modules.png" style="width:98.0%" />
<figcaption>Hermes Quant Agent 功能模块的前端可视化。不同房间对应行情感知、指标分析、策略评估、风险审查、决策调度、执行记录和报告解释等 Agent 模块。</figcaption>
</figure>

## （三）风险优先的二阶段决策机制

系统采用“评分初判 + 风险修正”的二阶段决策机制。第一阶段将策略适配度、市场状态、风险程度、历史表现、技术指标、新闻情绪和经验反馈转化为统一决策分数：
$$
D ={}& 0.30S_{strategy}+0.18S_{regime}+0.18(100-R_{risk}) \\
&+0.10S_{backtest}+0.10S_{indicator}+0.09S_{news}+0.05S_{memory}.
$$
其中，$S_{strategy}$ 表示候选策略得分，$S_{regime}$ 表示策略与市场状态的适配度，$R_{risk}$ 为风险分数，$S_{backtest}$ 表示历史表现，$S_{indicator}$ 表示技术指标信号，$S_{news}$ 表示新闻情绪，$S_{memory}$ 表示历史经验加成。该公式的作用不是追求一个绝对正确的分数，而是把不同来源的证据放入同一比较框架，使交易方向、风险和经验可以共同影响最终判断。

第二阶段对初始交易建议进行风险修正。本文把风险理解为由历史回撤、当前波动、趋势状态和情绪拥挤共同决定的约束，而不是事后附加的止损规则。当市场情绪很热但波动率和拥挤度同步上升时，系统会降低追涨权重；当历史表现较好但当前状态缺少确认时，系统会倾向观望；当新闻情绪与风险状态冲突时，风险约束优先于情绪信号。由此，Hermes Agent 的目标不是成为最激进的收益追逐者，而是在多变市场中保持理性、可解释和可控。

## （四）Agent 自优化策略

Hermes Agent 的自优化策略可以概括为“试炼–评价–反思–沉淀–再试炼”。在仿真情绪市场和历史行情任务中，Agent 首先根据当前市场状态做出交易判断；随后，系统根据收益、风险、回撤、胜率和决策一致性评价该次判断；若结果不理想，系统进一步分析失败来自情绪信号误判、风险约束不足、策略适配错误还是过度观望；最后，系统把这些反思压缩为可复用经验，并作用于下一轮交易。

SkillOpt 为这一过程提供了更清晰的方法参照。它不直接改变基座模型参数，而是把 skill 文档视为 Agent 的外部可训练状态：前向阶段收集带评分的执行轨迹，反向阶段从成功和失败案例中总结可编辑经验，随后把经验转化为受限的文本更新，并通过验证集门控决定是否写入长期技能，如图 <a href="#fig:skillopt_loop" data-reference-type="ref" data-reference="fig:skillopt_loop">5</a> 所示。本文将这一思想迁移到量化交易中：收益、风险、回撤、胜率和多 Agent 冲突记录对应带评分的交易轨迹；策略经验卡片对应候选 skill；风险门控和验证任务对应留出验证检查。由此，Agent 的自优化被定义为可评估的行为准则更新，而不是随意追加运行日志。

<figure id="fig:skillopt_loop">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/skillopt_training_loop.png" style="width:88.0%" />
<figcaption>SkillOpt 的文本空间训练循环示意。该方法将 Agent skill 视为可训练文本状态，通过 rollout、反思、受限更新和验证门控实现稳定的技能进化。</figcaption>
</figure>

与普通交易日志不同，本文的经验不是对单次结果的简单描述，而是把多个案例压缩为行为准则。例如，当某类策略在高波动场景中反复出现低胜率和高回撤时，经验系统会倾向于降低其仓位上限；当情绪市场中出现社交热度过快扩散但盘口流动性下降时，经验系统会强化“等待确认”的行为倾向。借鉴 SkillOpt 的思想，行为准则的更新需要经过验证门控：只有能够改善验证场景评价的经验更新才被接受。这保证了自优化不是任意改写规则，而是在可评价结果约束下逐步修正交易者的行为边界。

## （五）与仿真情绪市场的协同进化

本文将仿真情绪市场视为 Hermes Agent 的低成本试炼场。该市场可以构造平稳吸筹、利好拉升、追涨过热、封单松动、谣言扩散、恐慌杀跌和护盘修复等场景。Hermes Agent 在市场中读取价格、成交、新闻、社交热度、风险信号和盘口变化，并输出交易动作、仓位与解释；仿真市场根据交易行为更新订单簿、成交价格、流动性、社交热度和群体情绪；交易结果再反向进入 Agent 的经验总结系统。当 Agent 学到新的风险控制或信号确认经验后，它的后续行为又会改变市场中的交易轨迹。

图 <a href="#fig:hermes_session_loop" data-reference-type="ref" data-reference="fig:hermes_session_loop">6</a> 进一步说明了 Hermes Agent 的经验如何跨轮次保留。一次交易任务结束后，Agent 不只保存原始日志，而是先触发经验检查，将有效反思写入 skill patch，再归档到可检索的会话记忆中。下一轮面对相似市场状态时，系统会从历史会话中取回相关经验，使前一轮试炼的结果能够进入后一轮决策。图 <a href="#fig:hermes_logo" data-reference-type="ref" data-reference="fig:hermes_logo">7</a> 所示的标识用于在前端与报告中统一指代这一自进化交易者。

<figure id="fig:hermes_session_loop">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/hermes_agent_session_loop.png" style="width:90.0%" />
<figcaption>Hermes Agent 的跨会话经验沉淀流程。交易执行后的经验检查、技能修订、会话归档和下一轮检索共同构成可追踪的自我学习链条。</figcaption>
</figure>

<figure id="fig:hermes_logo">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/hermes_agent_logo.png" style="width:62.0%" />
<figcaption>Hermes Agent 项目标识。本文用 Hermes Agent 指代面向仿真情绪市场进行试炼、反思和行为准则更新的自进化量化交易者。</figcaption>
</figure>

因此，本文中的仿真情绪市场不是静态数据集，Hermes Agent 也不是市场外部的观察者。二者共同构成“市场生成情景、Agent 学习经验、Agent 行为反过来改变市场”的互相迭代架构。这一设计可以降低 Agent 自迭代成本，提高其接触不同市场状态的速度，并使研究者能够追踪情绪从新闻、社交传播、订单行为到价格反馈的完整路径。

# 四、实验测试与案例分析

## （一）实验目标与可视化环境

实验部分主要验证四个问题：第一，系统是否能完整展示多 Agent 量化决策链；第二，仿真情绪市场是否能够呈现新闻、社交传播、盘口变化和 Agent 行为之间的反馈关系；第三，Hermes Agent 是否能利用情绪传播链提前识别拥挤风险并调整交易暴露；第四，Agent 是否能够把多轮交易结果抽象为可观察的经验总结。本文不将仿真结果解释为真实投资收益保证，而是将其用于验证系统流程、展示解释链、识别情绪风险和说明自优化机制。

图 <a href="#fig:agent_modules_frontend" data-reference-type="ref" data-reference="fig:agent_modules_frontend">4</a> 展示了 Hermes Agent 控制室。该界面不是普通的策略回测面板，而是把量化交易过程可视化为“市场数据–指标分析–策略评估–风险报警–决策调度–报告解释”的连续空间。用户可以在一个界面中看到当前资产、运行状态、最终决策、风险等级、组合表现和 Agent 状态。更重要的是，底部详情面板展示了当前房间的输入、输出、关键指标和解释文本，使交易结论不再只是一个孤立的 Buy/Sell/Hold 标签。

## （二）仿真情绪市场场景展示

图 <a href="#fig:sentiment_overview" data-reference-type="ref" data-reference="fig:sentiment_overview">8</a> 展示了仿真情绪市场的前端总览。由于该市场属于“金融大数据技术”课程项目，本文只保留一张代表性界面作为交互环境说明。该界面同时呈现市场行情与盘口监控、Agent 群体状态与行为、社交热榜与影响力排行、实验控制与训练反馈。与普通回测界面不同，该市场不仅显示价格曲线，还显示社交热度、资金流、Agent 行为分布和新闻事件，使研究者能够观察市场情绪如何通过投资者网络传播并影响交易行为。对 Hermes Agent 而言，该市场的作用不是直接证明收益，而是提供可控的情绪传播沙盒，用来测试 Agent 在乐观过热、流动性下降和群体行为冲击下是否仍能保持风险约束。

<figure id="fig:sentiment_overview">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/sentiment-market-overview.png" style="width:98.0%" />
<figcaption>仿真情绪市场前端总览。界面展示行情、Agent 状态、社交热榜和实验控制，用于构造可控的情绪传播沙盒。</figcaption>
</figure>

## （三）Hermes Agent 的交易表现

为了检验仿真情绪市场对算法交易者的训练价值，本文将“金融大数据技术”报告中的涨停失败场景迁移到算法交易实验中进行说明。该场景不用于证明某一策略具有真实市场收益，而用于观察 Hermes Agent 是否能够在新闻利好、社交热度上升、盘口拥挤和传闻扩散之间形成更稳健的风险判断。实验设置了一个简单对照：动量基线策略在价格拉升阶段追涨买入，并在恐慌下跌阶段被动卖出；Hermes 情绪感知策略则在早期利好但拥挤度较低时小仓位试探，在社交热度和盘口买盘同时过热时降低暴露，并在封单不足传闻扩散、游资净流出时退出高位仓位，随后在稳定资金入场且卖压衰减时分批低吸。

<figure id="fig:hermes_strategy_comparison">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/hermes_strategy_comparison.png" style="width:92.0%" />
<figcaption>Hermes 情绪感知策略与追涨动量基线的收益对比。Hermes 在社交过热和传闻扩散阶段降低仓位，从而避开主要下跌段。</figcaption>
</figure>

如图 <a href="#fig:hermes_strategy_comparison" data-reference-type="ref" data-reference="fig:hermes_strategy_comparison">9</a> 所示，在该仿真场景结束时，动量基线收益为 -5.10%，Hermes 情绪感知策略收益为 1.66%。更重要的是，二者差异并不只来自最终收益，而来自风险暴露时点的不同：动量基线主要跟随价格变化，因此容易在上涨后段继续追高；Hermes Agent 同时读取社交热度、谣言热度、拥挤度和盘口资金变化，因此能够在价格尚未完全反转前识别“高情绪、高拥挤、低流动性”的风险组合。为保证过程可检查，实验同步记录了 tick 级行情与情绪、新闻事件序列、社交互动路径、关键 Agent 行为轨迹和策略财富曲线，使价格反转、情绪扩散、信息曝光、订单决策和收益变化能够互相印证。由此可见，仿真情绪市场为算法交易者提供的不是普通历史回测曲线，而是一组可解释的市场状态训练样本，帮助 Agent 在情绪驱动行情中区分趋势延续与拥挤反转。

## （四）决策链展示结果

从前端展示结果看，Hermes Agent 将一次交易任务拆解为多个可观察环节。控制室顶部给出当前资产、运行模式、系统状态和最终决策；左侧面板展示当前分析进度、收益预期、风险等级和组合表现；右侧面板展示不同 Agent 的运行状态；底部面板展示当前分析房间的输入、输出和解释。以图 <a href="#fig:agent_modules_frontend" data-reference-type="ref" data-reference="fig:agent_modules_frontend">4</a> 中的指标实验室为例，系统不仅给出 RSI、MACD 和波动率数值，还用自然语言解释这些指标对交易行为的含义。由此，实验结果体现出本文系统的核心设计目标：交易建议不是单一数值输出，而是由多 Agent 证据链支撑的可解释结果。

结合仿真情绪市场，系统进一步展示了“市场状态–群体行为–社交传播–交易反馈”的连续关系。图 <a href="#fig:sentiment_overview" data-reference-type="ref" data-reference="fig:sentiment_overview">8</a> 表明，实验界面能够同时呈现行情、Agent 群体状态、社交热榜和实验控制。这样的结果说明，仿真市场可以为 Hermes Agent 提供比普通历史回测更丰富的训练信号：Agent 不只观察价格，还观察情绪扩散、资金拥挤和盘口变化，从而具备识别情绪过热与流动性风险的条件。

## （五）经验学习模块展示

本文进一步通过前端经验模块展示 Agent 的经验积累结果。图 <a href="#fig:experience_module" data-reference-type="ref" data-reference="fig:experience_module">10</a> 展示了策略记忆库界面：系统在多轮运行后共形成 41 条单次经验记录，并进一步压缩出 2 类策略级经验摘要。该界面同时展示经验记录数量、策略级摘要、近期运行档案和历史记忆反思，使经验学习不再只是后台记录，而成为可以被观察和复核的实验结果。

<figure id="fig:experience_module">
<img src="/report-assets/hermes-quant-agent-algorithmic-trading/agent_experience_module.png" style="width:98.0%" />
<figcaption>Agent 经验学习模块前端展示。系统将多轮交易结果压缩为策略级经验摘要，并在运行档案中展示收益、夏普比率、交易信号和经验结论。</figcaption>
</figure>

从图 <a href="#fig:experience_module" data-reference-type="ref" data-reference="fig:experience_module">10</a> 可以看到，Momentum 策略在样本中取得 39.56% 的平均收益和 1.15 的平均夏普值，但这并不意味着策略已经稳定可靠。收益和夏普反映的是样本期平均表现，低胜率和回撤压力则反映交易路径中的风险暴露，因此经验模块仍将其标记为需要“等待确认、强化多信号一致性、收紧止损”的策略。MA 均线策略取得 61.48% 的平均收益，但平均夏普值为 0.89，说明其在强趋势中有效，却不适合在风险分数升高或指标转弱时盲目加仓。由此可见，Hermes Agent 的学习目标不是简单追求单次或样本期收益最大，而是把收益、胜率、回撤和风险状态共同转化为下一轮可执行、可解释、可验证的行为准则。

# 五、结论与展望

本文设计了一个结合仿真情绪市场的可解释多 Agent 量化交易者 Hermes Agent。系统的核心贡献不在于宣称单一收益率提升，而在于把量化交易决策拆解为可观察、可质疑、可修正、可学习的模块化链条。通过前端可视化展示，用户可以看到不同 Agent 如何从行情、指标、新闻、风险和历史经验中形成判断；通过情绪市场沙盒，Agent 可以在新闻冲击、社交传播和盘口反馈构成的可控环境中接受试炼；通过经验抽象和验证门控，Agent 可以把历史表现沉淀为可复用行为准则。该框架为课程中的“仿真情绪市场”和“算法交易 Agent”建立了统一的协同进化架构。

总体而言，Hermes Agent 将量化交易从“预测价格后给出信号”的单点任务，扩展为“识别市场状态、解释证据冲突、控制风险暴露、沉淀经验准则”的连续过程。它既避免了只依赖价格和指标的机械化交易，也避免了只追随新闻和社交热度的情绪化交易。对于课程项目而言，该系统将算法交易、金融大数据、仿真情绪市场和自优化 Agent 连接成一个完整闭环，为后续研究可解释金融 AI 和自进化交易系统提供了可继续扩展的研究原型。


99

Leippold, M., Wang, Q., & Zhou, W. (2022). Machine learning in the Chinese stock market. *Journal of Financial Economics*, 145(2), 64–82.

Liu, X.-Y., Yang, H., Chen, Q., Zhang, R., Yang, L., Xiao, B., & Wang, C. D. (2021). FinRL: Deep reinforcement learning framework to automate trading in quantitative finance. *Proceedings of the ACM International Conference on AI in Finance*.

Liu, X.-Y., Xia, Z., Rui, J., Gao, J., Yang, H., Zhu, M., Wang, C. D., Wang, Z., & Guo, J. (2022). FinRL-Meta: Market environments and benchmarks for data-driven financial reinforcement learning. *NeurIPS Datasets and Benchmarks Track*.

Sun, S., Qin, M., Yang, H., Wang, C., Xu, B., & Liu, X.-Y. (2023). TradeMaster: A holistic quantitative trading platform empowered by reinforcement learning. *Advances in Neural Information Processing Systems*.

Sun, S., Wang, R., An, B., & others. (2022). DeepScalper: A risk-aware reinforcement learning framework to capture fleeting intraday trading opportunities. *Proceedings of the 31st ACM International Conference on Information and Knowledge Management*.

Qin, M., Sun, S., Zhang, W., Zhang, J., Liang, X., Li, Y., & Liu, X.-Y. (2024). EarnHFT: Efficient hierarchical reinforcement learning for high frequency trading. *Proceedings of the AAAI Conference on Artificial Intelligence*.

Sun, S., An, B., & others. (2023). Mastering stock markets with efficient mixture of diversified trading experts. *Proceedings of the 29th ACM SIGKDD Conference on Knowledge Discovery and Data Mining*.

Wu, S., Irsoy, O., Lu, S., Dabravolski, V., Dredze, M., Gehrmann, S., Kambadur, P., Rosenberg, D., & Mann, G. (2023). BloombergGPT: A large language model for finance. *arXiv preprint arXiv:2303.17564*.

Yang, H., Liu, X.-Y., & Wang, C. D. (2023). FinGPT: Open-source financial large language models. *arXiv preprint arXiv:2306.06031*.

Yang, H., Zhang, B., Wang, N., Guo, C., Zhang, X., Lin, L., Wang, J., Zhou, T., Guan, M., Zhang, R., & Wang, C. D. (2024). FinRobot: An open-source AI agent platform for financial applications using large language models. *arXiv preprint arXiv:2405.14767*.

Zhang, W., Yang, H., & others. (2024). FinAgent: A multimodal foundation agent for financial trading. *Proceedings of the 30th ACM SIGKDD Conference on Knowledge Discovery and Data Mining*.

Yu, Y., Wang, Z., & others. (2025). FinMem: A performance-enhanced LLM trading agent with layered memory and character design. *IEEE Transactions on Big Data*.

TradingAgents. (2024). TradingAgents: Multi-agents LLM financial trading framework. *arXiv preprint arXiv:2412.20138*.

Yu, Y., Yao, Z., Li, H., Deng, Z., Cao, Y., Chen, Z., Suchow, J. W., Liu, R., Cui, Z., Xu, Z., Zhang, D., Subbalakshmi, K., Xiong, G., He, Y., Huang, J., Li, D., & Xie, Q. (2024). FinCon: A synthesized LLM multi-agent system with conceptual verbal reinforcement for enhanced financial decision making. *Advances in Neural Information Processing Systems*.

Li, Y., Zhang, Y., & others. (2025). InvestorBench: A benchmark for financial decision-making tasks with LLM-based agents. *Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics*.

HedgeAgents. (2025). HedgeAgents: A balanced-aware multi-agent financial trading system. *Proceedings of the ACM International Conference on AI in Finance*.

Zhang, Y., Wang, H., & others. (2024). StockAgent: Large language model-based stock trading in simulated real-world environments. *arXiv preprint*.

Li, J., Zhang, Y., & others. (2024). MarS: A financial market simulation engine powered by generative foundation model. *arXiv preprint*.

Yang, Y., Gong, Z., Huang, W., Yang, Q., Zhou, Z., Huang, Z., Li, Y., Gao, X., Dai, Q., Liu, B., Qiu, K., Yang, Y., Chen, D., Yang, X., & Luo, C. (2026). SkillOpt: Executive strategy for self-evolving agent skills. *arXiv preprint arXiv:2605.23904*.
