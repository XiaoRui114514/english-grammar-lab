# brief-challenge 时态综合挑战（20题大综合）

文件：data/bank-challenge.js 注册 key：challenge | 无 knowledgeCard | 无 pool

## 性质
完成 01-12 全部专题后解锁的【时态综合挑战】：20 题，不提示专题、不提示考点、不提示时态。
前 10 题 type:'choice'，后 10 题 type:'input'。句子长度 15-35 词。难度明显高于专项题。
整体观感应接近"上海高中真实语法填空/时态综合题"。

## 数据对象 schema（该文件注册的对象结构特殊）
```js
window.__GRAMMAR_LAB__ = window.__GRAMMAR_LAB__ || {};
window.__GRAMMAR_LAB__.challenge = {
  id: 'challenge',
  no: 'CH',
  title: '时态综合挑战',
  phase: 1,
  icon: '🎯',
  color: '#fdcb6e',
  available: true,
  description: '20 题大综合：七大时态混合，不提示考点，检验你的真实判断力。',
  questions: [ /* 恰 20 个：0-9 choice，10-19 input */ ]
};
```
- 每题结构同 DATA_SCHEMA §3 question 对象（含 explanation 全字段）。
- tag 填写该题实际考的时态名（如 '现在完成时'、'过去进行时'、'一般将来时'），wrongType 照常。
- **不设 hint 之外的专题提示**；input 题的 hint 照常给词（如 'work'、'already / leave'）。
- 20 题的时态分布尽量均匀（七大时态每类 2-3 题），且**不要与 12 个专题文件里的原句重复**，全部新写。
- 每题必须答案唯一无歧义（同 DATA_SCHEMA R3/R4），句子有完整上下文。

## 12 题蓝图参考（可微调，但保持无提示大综合的性质）
1-2 choice：有标志但语境略绕；3-4 choice：需跨句判断；5 choice：完成 vs 过去；6 choice：进行 vs 一般；
7 choice：过去进行/过去完成（第二动作）；8 choice：将来多种表达；9 choice：长复合句综合；10 choice：语篇式（2-3 句）综合。
11-14 input：信号明显但要求拼写（不规则形式）；15-16 input：无信号上下文；17 input：完成 vs 过去辨析；
18 input：进行 vs 一般辨析；19 input：语篇（2-3 句）；20 input：接近上海作业的长语篇（3-4 句，单空）。
难度 difficulty 全为 3-5。
