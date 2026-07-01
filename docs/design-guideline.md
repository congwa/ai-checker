# AI Checker UI Design Guideline

## Inspiration Notes

本次参考了 Dribbble 上 `ai analytics dashboard dark ui` 相关热门作品，并用 Chrome/本地下载图片做视觉分析。当前公开端只采用一个模板风格：**dark signal console**。可复用模式：

- 深色数据工作台以黑色沟槽区分模块，避免把所有区域都做成高亮玻璃卡片。
- 第一屏优先展示 KPI、状态和趋势，不做营销式 hero。
- 图表面积大于指标卡，状态色只用于线条、徽标、细边和关键数字。
- 侧栏和页头保持紧凑，操作按钮使用图标+短文本。
- 公开端使用左侧任务目录 + 右侧指标/趋势工作台，不使用大字标题和大面积单色渐变。

## Visual System

- 背景：近黑底色叠加 canvas 细网格、信号线、节点连接和轻扫描线，保持专业监控感。
- 面板：`8px` 圆角、细边框、低透明白内高光，避免厚重玻璃拟态。
- 色彩：公开端主信号为 teal，状态辅助为 amber/rose；避免大面积紫蓝渐变。
- 字体：使用 IBM Plex Sans / IBM Plex Sans Condensed 作为主要层级，数字启用 tabular nums。
- 动效：GSAP 只做 150-500ms 的 opacity/translate/scale 微交互和克制扫描层，并尊重 reduced motion。

## Component Rules

- KPI：数字优先，标题小而稳定，使用细线或小刻度作为装饰。
- 图表：虚线网格、深色 tooltip、清晰指示线、适度面积填充。
- 列表：表头、选中态和操作列保持固定扫描节奏。
- 状态：成功用 teal/lime，警告用 amber，失败用 rose；不依赖颜色单独表达含义。
- 公开看板：保持只读、脱敏、低认知负担，当前评分是第一视觉焦点。
