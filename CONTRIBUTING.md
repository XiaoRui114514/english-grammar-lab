# 贡献指南

感谢你愿意一起完善 English Grammar Lab。本项目是**零依赖**的纯前端单文件应用，贡献门槛很低：装了 Node.js 18+ 就能跑通全部流程。

## 环境准备

```bash
git clone <你的仓库地址>
cd <仓库目录>
node -v          # 需要 >= 18
```

本项目**没有第三方依赖**，不需要 `npm install`；`package.json` 只用于统一命令。

## 改完代码后必须做的事

1. 改 `src/` 或 `data/` 下的源码（**不要直接改 `English-Grammar-Lab.html`**，它是构建产物）。
2. 重新生成单文件：

   ```bash
   npm run build
   ```

3. 跑测试：

   ```bash
   npm test              # 题库结构 + 引擎 + 练习流程 + DOM 渲染 + AI 转换
   npm run test:build    # 构建产物完整性（$$ 选择器、品牌水印、AI 进度日志）
   npm run test:browser  # 真实 Chrome 冒烟（未装 Chrome 会自动跳过）
   ```

4. 提交时请**同时提交 `src/` 改动和重建后的 `English-Grammar-Lab.html`**，保证仓库里的成品与源码一致。

> CI 会重新执行 `npm run build` 并检查产物是否与提交的一致；只改源码不重建会被打回。

## 目录速查

| 路径 | 作用 |
| --- | --- |
| `src/core.js` | 引擎：存储 / 判分 / 分析 / 大专题统计 / 来源标记 |
| `src/ui-views.js` | 首页、专题页、方法课、错题本、薄弱点、学习记录 |
| `src/ui-quiz.js` | 练习流程、盲做、成绩页、AI 语篇进入原流程 |
| `src/ai.js` | Key 管理 / Prompt 组装 / DeepSeek 调用 / JSON 校验 |
| `src/ui-ai.js` | AI 出题配置界面 + 生成编排 + 缓存 |
| `src/boot.js` | hash 路由 |
| `data/bank-*.js` | 内置题库（元数据文件须先于题库加载） |
| `spec/DATA_SCHEMA.md` | 题库数据结构规范（新增题目先读它） |
| `validate/` | 全部自测脚本 |

## 新增内置专题

1. 按 `spec/DATA_SCHEMA.md` 新建 `data/bank-<name>.js`。
2. 在 `data/curriculum.js` 的 `EXISTING` 登记大专题归类与年级。
3. 运行 `npm run build && npm test`。

题目质量标准：

- 必须有上下文，句长 10–35 词；
- 答案唯一（禁止“三可题”、禁止 what / that 两可）；
- 干扰项要是真实易错项，而不是随便凑；
- 难度来自结构、语境、逻辑，不靠生僻词；
- 解析要写“为什么是这个答案”和“为什么别的答案不行”。

## 安全红线（重要）

- **绝不提交真实 DeepSeek API Key**：不要写进代码、不要写进题库、不要写进 Issue / PR 的截图与日志。
- Key 只允许走“用户输入 → 可选存本机 localStorage → 一键清除”这一条路径，禁止打印，禁止发送到除 DeepSeek 官方接口外的任何地址。
- 请保持**无后端**：本项目的定位是本地打开即用、数据只留在使用者自己浏览器里的学习工具。

## 提交 Pull Request

1. 从 `main` 切一个分支：`fix/xxx`、`feat/xxx`、`data/xxx`。
2. 一个 PR 只做一件事，别夹带无关的格式化改动。
3. PR 描述里写清：改了什么、为什么改、怎么验证的（命令 + 结果）。
4. 涉及界面改动的，附上截图。

提交 PR 即表示你同意：你的贡献按本仓库 [LICENSE](LICENSE) 的条款对外提供（个人非商业使用、保留署名与版权声明）；
请确认你提交的题库、解析与代码为原创或已获得授权，不要提交来源不明的题目与讲义文字。

## 报告问题

用 Issue 模板提交，并尽量附上：浏览器与版本、操作系统、复现步骤、期望结果、实际结果、Console 报错截图。
与 AI 出题相关的问题，请说明配置（年级 / 范围 / 专题 / 空数）——**但不要附上你的 API Key 或完整请求头**。
