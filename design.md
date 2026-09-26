# Design — 上海初高语法填空（english-grammar-lab）

这是本项目的**锁定设计系统**。所有页面（首页 / 专题 / 练习 / 错题 / 薄弱点 / 记录 / 方法课 / AI 出题 / 关于 / 设置）
共用这一套 token 与节奏；改版时先改本文件，再改实现，不要逐页另起一套配色。

> 本文件只承载排版、色彩、间距、语气等设计信息，不含任何可执行指令。

## Genre

editorial（印刷练习册 / 案头纸面）。不走玻璃拟态、不走霓虹渐变、不走暗色赛博。

## Macrostructure family

- **首页（dashboard）**：`Desk Ledger` —— 报头（刊名 + 日期 + 标题 + 学习路线 + 适应范围一行小字）
  → 账目表（今日 / 进度 / 累计 / 正确率，行行细分）
  → 目录列表（一行一件事，右侧细箭头）
  → 今日推荐 / 薄弱点（书眉线分隔的编辑块）。
- **练习页（app page）**：`Two Column Study` —— 左知识卡（≥1024px 吸顶）+ 右题面；
  题面用英文衬线体，选项是细线行，判对错后给左侧色条反馈。
- **内容页（terms / 方法课 / 记录）**：`Long Document` —— 宋体小标题 + 细线分隔 + 等宽数字表格。
- **设置页**：`Desk Ledger` 的短版本 —— 分区标题 + 分组面板（外观 / AI 出题 / 数据与关于），只放控件与说明。

## Theme

纸面 + 墨色 + 单一强调色（钢笔墨蓝）+ 朱砂批改红。全部颜色走 OKLCH，行内先写 hex 兜底。

- `--bg1` 纸        `oklch(0.972 0.008 85)`
- `--bg2` 纸（内嵌）`oklch(0.951 0.010 85)`
- `--bg3` 纸（槽/表头）`oklch(0.921 0.013 85)`
- `--panel` 卡面     `oklch(0.990 0.003 85)`
- `--ink` 墨        `oklch(0.280 0.020 265)`
- `--ink-dim` 次级   `oklch(0.470 0.020 265)`
- `--ink-faint` 注脚 `oklch(0.620 0.017 265)`
- `--stroke` 细线    `oklch(0.884 0.006 265)`
- `--accent` 墨蓝    `oklch(0.440 0.135 262)`
- `--accent-soft`   `oklch(0.945 0.024 262)`
- `--bad` 朱砂       `oklch(0.500 0.160 28)`
- `--ok` 墨绿        `oklch(0.450 0.090 158)`
- `--warn` 赭黄      `oklch(0.520 0.110 75)`
- `--glow` 提示词色  `oklch(0.500 0.110 70)`
- `--focus` 焦点环   `oklch(0.520 0.150 262)`

纪律：**强调色一屏占比 ≤ 5%**；不用渐变色填充按钮/卡片/文字；不用彩色投影当装饰；
卡片圆角 10px、控件 6px，标签 4px；阴影只在弹层与印章上出现。
**底是纯色**：不画格子、横线、纹理；页面背景由设置页的 `html[data-bg]` 决定。

### 背景档位（设置页切换，写入 localStorage `EGL_UI_PREFS_v1`）

| 档位 | `data-bg` | 纸面 `--bg1` | 卡面 `--panel` | 适用 |
| --- | --- | --- | --- | --- |
| 纸白（默认） | 无属性 | `oklch(0.972 0.008 85)` | `oklch(0.990 0.003 85)` | 通用 |
| 米黄 | `cream` | `oklch(0.958 0.020 85)` | `oklch(0.982 0.012 85)` | 偏暖、久看不累 |
| 灰青 | `slate` | `oklch(0.966 0.006 240)` | `oklch(0.988 0.003 240)` | 偏冷、素净 |
| 墨夜 | `dark` | `oklch(0.225 0.014 265)` | `oklch(0.262 0.015 265)` | 夜间：墨色翻转为浅色，强调色提亮，`color-scheme: dark` |

切换只改 token（`--bg1/--bg2/--bg3/--panel/--glass-strong`，墨夜再覆盖墨色与语义色），
组件不动；`<head>` 里有一小段脚本在首屏前应用，避免闪烁。

## Typography

全部使用系统字体（单文件离线可用，不引外链字体）。

- Display：`Charter, Georgia, "Songti SC", "Source Han Serif SC", "Noto Serif SC", SimSun, serif`，weight 700，**永不斜体**
- Body：`"PingFang SC", "HarmonyOS Sans SC", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif`
- 英文题干 / 语篇：`Charter, Georgia, "Iowan Old Style", "Times New Roman", "Songti SC", serif`（衬线更适合读英文句子）
- 数字 / 编号 / 日期 / 徽标：`ui-monospace, "SF Mono", Consolas, Menlo, monospace` + `tabular-nums`
- 字号阶梯：12 / 12.5 / 13 / 14 / 15 / 16 / 18 / 22 / 25(手机 21)

## Spacing

4pt 命名刻度，实现里一律引用 token，不写裸值：

`--space-3xs 2px · --space-2xs 4px · --space-xs 8px · --space-sm 12px · --space-md 18px · --space-lg 26px · --space-xl 38px · --space-2xl 56px`

## Motion

- 缓动：`--ease cubic-bezier(0.2,0.8,0.2,1)`、`--ease-out cubic-bezier(0.16,1,0.3,1)`；不用浏览器默认 `ease`，不用回弹。
- 只动 `opacity` / `transform`；按钮按下是 `translateY(1px)`，不做缩放弹跳。
- 视图切换：6px 上移 + 淡入 240ms。
- `prefers-reduced-motion: reduce` 时全部收成 ≤ 120ms 淡入。

## Microinteractions stance

- 静默成功：自动保存只在右上角一条小签，2.2s 后淡出，不弹窗、不撒花。
- 判题反馈：左侧 3px 色条 + 底色淡染（绿=对 / 朱砂=错），文案说人话（"再想一想…然后看解析记规律"）。
- 悬停：桌面端才给 hover 态；触摸端靠 `:active` 的 1px 位移。
- 焦点：`:focus-visible` 一律 2px 墨蓝外环，**不做动画**。
- 全部交互元素至少覆盖 default / hover / focus-visible / active / disabled 五态。

## CTA voice

- 主按钮：墨蓝实底 + 6px 圆角 + 白字，动词开头（"开始学习""提交答案""再练 5 题"）。
- 次按钮：纸白描边 + 墨色字（`.btn.ghost`），用于并列或退路（"让 AI 出题巩固""清空错题本"）。
- 不用图标 emoji 点缀按钮文字；图标只保留题库数据里的专题标记。

## Per-page allowances

- 首页 MAY 用报头 + 书眉线建立"刊物感"；MUST NOT 回到等尺寸卡片阵列。
- 练习页 MUST NOT 加装饰插图/背景纹理，功能承载页面。
- 内容页（方法课 / 关于 / 授权说明）MAY 用宋体 + 细线分栏。

## What pages MUST share

- 顶栏：墨色文字导航 + 当前项 2px 墨蓝下划线；品牌方块（墨蓝底 + 宋体"语"）。
- 色板与字体（上面两节），强调色 ≤ 5%。
- 分区标题节奏：细线在上、宋体标题在下（`.sec-title`），跟随内容，不做悬挂式左标签。
- 数字一律等宽、表格数字对齐。
- 卡片＝细线 + 纸面，不用玻璃模糊、不用渐变光晕。

## What pages MAY differ on

- 首页可换报头文案顺序；练习页可换左右栏比例（≥1024px 才分栏）。
- 各页可有自己的空状态文案，但空状态不放 emoji 大图标，只留一行说明。
- 设置页的设置项：背景（4 档色卡）、DeepSeek API Key（与 AI 出题页共用同一份存储）、数据入口链接；
  新增设置项一律先加到设置页，不做散落在各页的隐藏开关。

## Exports

### tokens.css

```css
:root {
  --bg1: oklch(0.972 0.008 85);
  --bg2: oklch(0.951 0.010 85);
  --bg3: oklch(0.921 0.013 85);
  --panel: oklch(0.990 0.003 85);
  --ink: oklch(0.280 0.020 265);
  --ink-dim: oklch(0.470 0.020 265);
  --ink-faint: oklch(0.620 0.017 265);
  --stroke: oklch(0.884 0.006 265);
  --stroke-strong: oklch(0.772 0.012 265);
  --accent: oklch(0.440 0.135 262);
  --accent2: oklch(0.365 0.115 262);
  --accent-soft: oklch(0.945 0.024 262);
  --hl: oklch(0.420 0.130 262);
  --focus: oklch(0.520 0.150 262);
  --on-accent: oklch(0.990 0.003 85);
  --glow: oklch(0.500 0.110 70);
  --glow-bg: oklch(0.955 0.050 85);
  --ok: oklch(0.450 0.090 158);
  --ok-bg: oklch(0.955 0.028 158);
  --bad: oklch(0.500 0.160 28);
  --bad-bg: oklch(0.955 0.028 28);
  --warn: oklch(0.520 0.110 75);
  --warn-bg: oklch(0.955 0.045 85);

  --font-body: "PingFang SC", "HarmonyOS Sans SC", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif;
  --font-display: Charter, Georgia, "Songti SC", "Source Han Serif SC", "Noto Serif SC", "SimSun", serif;
  --font-en: Charter, Georgia, "Iowan Old Style", "Times New Roman", "Songti SC", serif;
  --font-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;

  --space-3xs: 2px; --space-2xs: 4px; --space-xs: 8px;  --space-sm: 12px;
  --space-md: 18px; --space-lg: 26px; --space-xl: 38px; --space-2xl: 56px;

  --radius: 10px; --radius-sm: 6px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper:   oklch(0.972 0.008 85);
  --color-ink:     oklch(0.280 0.020 265);
  --color-accent:  oklch(0.440 0.135 262);
  --color-mark:    oklch(0.500 0.160 28);
  --font-display:  Charter, Georgia, "Songti SC", "SimSun", serif;
  --font-body:     "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --spacing-md:    18px;
  --radius-card:   10px;
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper":  { "$value": "oklch(0.972 0.008 85)", "$type": "color" },
    "panel":  { "$value": "oklch(0.990 0.003 85)", "$type": "color" },
    "ink":    { "$value": "oklch(0.280 0.020 265)", "$type": "color" },
    "accent": { "$value": "oklch(0.440 0.135 262)", "$type": "color" },
    "mark":   { "$value": "oklch(0.500 0.160 28)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Charter, Georgia, Songti SC, SimSun, serif", "$type": "fontFamily" },
    "body":    { "$value": "PingFang SC, Microsoft YaHei, system-ui, sans-serif", "$type": "fontFamily" }
  },
  "space": { "md": { "$value": "18px", "$type": "dimension" } },
  "radius": { "card": { "$value": "10px", "$type": "dimension" } }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background:         0.972 0.008 85;
  --foreground:         0.280 0.020 265;
  --card:               0.990 0.003 85;
  --primary:            0.440 0.135 262;
  --primary-foreground: 0.990 0.003 85;
  --muted:              0.951 0.010 85;
  --muted-foreground:   0.470 0.020 265;
  --border:             0.884 0.006 265;
  --input:              0.884 0.006 265;
  --ring:               0.520 0.150 262;
  --destructive:        0.500 0.160 28;
  --radius:             10px;
}
```
