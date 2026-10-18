#!/usr/bin/env node
/* ============================================================
 * validate/features-test.js — 本轮新增功能的数据层测试
 * 覆盖：v3 迁移 / 复习排期(SRS) / 复习队列 / 连续天数 / 答题画像 /
 *       智能组卷 / 真题考点频次 / AI 讲解缓存 / AI 导出题库 / 默认填空
 * 用法：node validate/features-test.js
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const store = {};

/* 预置一份 v2 老数据：验证迁移不丢记录 */
const dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = new Date();
const yest = new Date(Date.now() - 86400000);
const before = new Date(Date.now() - 2 * 86400000);
store['EGL_LAB_DATA_v1'] = JSON.stringify({
  version: 2,
  global: { answered: 30, correct: 20 },
  topics: {},
  tags: { 'tense06|现在完成时': { attempts: 6, correct: 2, streakWrong: 2, lastWrong: true } },
  errorTypes: { CONTEXT_ERROR: 3 },
  wrongBook: [{
    id: 'wb_tense06q08', topicId: 'tense06', topicTitle: '现在完成时', qid: 'tense06q08',
    question: 'Old question ______ here.', tag: '现在完成时', myAnswer: 'has go',
    correctAnswer: 'has gone', wrongType: 'VERB_FORM_ERROR', source: 'bank',
    times: 2, lastDate: dayKey(yest), lastAt: Date.now() - 86400000
  }],
  sessions: [],
  daily: {
    [dayKey(today)]: { answered: 4, correct: 3 },
    [dayKey(yest)]: { answered: 6, correct: 5 },
    [dayKey(before)]: { answered: 3, correct: 2 }
  },
  usedPool: {}, challengeUnlocked: {}, lastStudyAt: 0, createdAt: Date.now()
});

const sb = {
  console,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setTimeout, clearTimeout, Promise, Math, Date, JSON, RegExp
};
sb.window = sb;
vm.createContext(sb);
['src/core.js', 'src/ui-helpers.js', 'src/ai.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^\uFEFF/, ''), sb, { filename: f });
});
['data/roadmap.js', 'data/curriculum.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^\uFEFF/, ''), sb, { filename: f });
});
fs.readdirSync(path.join(ROOT, 'data'))
  .filter(f => /^bank-.*\.js$/.test(f)).sort()
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8').replace(/^\uFEFF/, ''), sb, { filename: f }));

const E = sb.EGL;
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.log('  ✗ ' + msg); }
}

console.log('[1] v2 → v3 数据迁移');
ok(E.DATA_VERSION === 3, 'DATA_VERSION = 3');
ok(E.data.version === 3, '老数据版本已升到 3');
ok(E.data.global.answered === 30, '全局统计未丢');
ok(E.data.daily[dayKey(today)].answered === 4, '每日记录未丢');
ok(E.data.tags['tense06|现在完成时'].attempts === 6, 'tag 统计未丢');
const w0 = E.data.wrongBook[0];
ok(w0 && w0.stage === 0 && w0.mastered === false, '老错题补齐 stage/mastered');
ok(typeof w0.dueAt === 'number', '老错题补齐 dueAt');
ok(w0.notes === '' && w0.snapshot === null, '老错题补齐 notes/snapshot');
ok(E.data.goal === 12 && E.data.agg && E.data.custom === null, 'v3 新字段已补齐');

console.log('[2] 连续学习天数 / 近 7 天');
const st = E.streak();
ok(st.days === 3, '连续 3 天（实际 ' + st.days + '）');
ok(st.today === true, '今天已打卡');
const wk = E.weekSeries(7);
ok(wk.length === 7 && wk[6].today === true, '近 7 天序列正常');

console.log('[3] 错题复习排期（SRS）');
const w1 = E.data.wrongBook[0];
ok(E.wrongStats().total === 1 && E.wrongStats().due === 1, '今日到期 1 条');
// 连对 5 次 → 已掌握
for (let i = 0; i < 5; i++) E.reviewWrong(w1.qid, true, 'has gone');
ok(w1.mastered === true, '连续答对 5 次 → 已掌握');
ok(w1.dueAt === 0, '掌握后不再排期');
// 再答错 → 回到第一阶
E.reviewWrong(w1.qid, false, 'has go');
ok(w1.mastered === false && w1.stage === 0, '答错回到第一阶');
ok(w1.times === 3, '复习答错也累加错误次数');
// 复习队列能还原题库题
const q1 = E.resolveWrongQuestion(w1);
ok(q1 && q1.id === w1.qid && q1.type, '题库错题可还原为可做题');
const queue = E.reviewQueue(5);
ok(queue.length >= 1, '今日复习队列非空');

console.log('[4] 真题语篇错题可还原');
const paperQ = E.paperToQuestions(E.paperById('paper01'))[2];
E.addWrong({
  topicId: 'paper:' + paperQ.aiMeta.catId, topicTitle: '真题语篇 · 测试', qid: paperQ.id,
  question: paperQ.question, tag: paperQ.tag, myAnswer: 'x', correctAnswer: paperQ.answerText,
  wrongType: 'CONTEXT_ERROR', source: 'paper', catId: paperQ.aiMeta.catId
});
const pw = E.data.wrongBook.filter(x => x.qid === paperQ.id)[0];
const pj = E.resolveWrongQuestion(pw);
ok(pj && pj.id === paperQ.id && pj.question.indexOf('______') >= 0, '真题语篇错题按 qid 还原');
ok(E.dueWrong().length >= 1, '到期队列包含语篇错题');

console.log('[5] 答题画像');
E.noteAgg('choice', 2, true, 12);
E.noteAgg('input', 4, false, 30);
E.noteAgg('input', 4, true, 18);
const pf = E.profileStats();
ok(pf.choice.attempts === 1 && pf.choice.correct === 1, '选择题统计');
ok(pf.input.attempts === 2 && pf.input.correct === 1, '输入题统计');
ok(pf.byDiff.find(d => d.difficulty === 4).attempts === 2, '难度分层统计');
ok(pf.avgSeconds === 20, '平均每题耗时 = (12+30+18)/3（实际 ' + pf.avgSeconds + '）');

console.log('[6] 真题考点频次');
const freq = E.paperFreq();
const totalBlanks = freq.reduce((s, c) => s + c.blanks, 0);
ok(totalBlanks === 80, '8 篇 × 10 空全部聚合（实际 ' + totalBlanks + '）');
ok(freq[0].blanks >= freq[freq.length - 1].blanks, '按空数从多到少排序');
ok(freq.every(c => c.name), '每个大类都有中文名');

console.log('[7] 智能组卷');
const cust = E.buildCustomPaper();
ok(cust && cust.items.length === 10, '组出 10 空（实际 ' + (cust && cust.items.length) + '）');
ok(Object.keys(cust.dist).length >= 1, '带考点分布');
const cqs = E.customToQuestions(cust);
ok(cqs.length === 10 && cqs.every(q => q.aiCtx && q.aiCtx.kind === 'sentence'), '专卷题可直接进整篇卷面');
ok(cqs.every(q => q.accepted && q.accepted.length && q.question.indexOf('______') >= 0), '专卷题结构完整');
ok(E.getCustomPaper() && E.getCustomPaper().id === cust.id, '专卷可保存/读取');
E.clearCustomPaper();
ok(E.getCustomPaper() === null, '专卷可删除');
// 专卷里也可能抽到选择题：选项必须完整保留
const choiceQ = E.bank().tense01.questions[0];
E.addWrong({
  topicId: 'tense01', topicTitle: '一般现在时', qid: choiceQ.id, question: choiceQ.question,
  tag: choiceQ.tag, myAnswer: 'x', correctAnswer: choiceQ.answerText,
  wrongType: choiceQ.wrongType, source: 'bank', snapshot: E.snapshotQuestion(choiceQ)
});
const cust2 = E.buildCustomPaper();
const qs2 = E.customToQuestions(cust2);
ok(qs2.some(q => q.type === 'choice' && q.options && q.options.length === 6), '专卷可含选择题且选项完整');
ok(qs2.every(q => !(q.type === 'choice' && (!q.options || q.options.length < 2))), '专卷不会出现“选择题却没选项”');
E.clearCustomPaper();

console.log('[8] 每日目标 / 导出导入');
ok(E.setGoal(20) === 20 && E.dailyGoal() === 20, '每日目标可设置');
ok(E.overallStats().goal === 20, '总览读取每日目标');
const json = E.exportData();
ok(JSON.parse(json).version === 3, '导出为 v3');
E.resetData();
ok(E.data.version === 3 && E.data.wrongBook.length === 0, '重置后数据为空且仍是 v3');
ok(E.importData(json) === true, '导入备份成功');
ok(E.data.global.answered === 30, '导入后统计恢复');
ok(E.data.version === 3, '导入老版本数据会自动迁移');

console.log('[9] AI：默认填空 / 薄弱点提示词');
const def = E.ai.defaultConfig();
ok(def.qtype === 'input', '默认答题形式为填空输入');
const rawSec = [{
  kind: 'passage', title: 'T', passage: 'Tom ______ (work) hard. ______ he plays.',
  blanks: [
    { n: 1, answer: 'works', answerRaw: 'works', accepted: [], givenWord: 'work', isGivenWord: true, category: '谓语动词', knowledgePoint: '一般现在时', sense: 's', rule: 'r', clue: 'c', why: 'w', others: 'o', tip: 't', difficulty: 1 },
    { n: 2, answer: 'though', answerRaw: 'Though', accepted: ['although'], givenWord: '', isGivenWord: false, category: '并列与逻辑', knowledgePoint: '让步连词', sense: 's', rule: 'r', clue: 'c', why: 'w', others: 'o', tip: 't', difficulty: 1 }
  ]
}];
const qsDef = E.ai.papersToQuestions(rawSec, { count: 2 });
ok(qsDef.length === 2 && qsDef.every(q => q.type === 'input'), '未指定 qtype 时转成填空');
const qsChoice = E.ai.papersToQuestions([{
  kind: 'passage', title: 'T', passage: 'Tom ______ (work) hard.',
  blanks: [{ n: 1, answer: 'works', options: ['works', 'work'], givenWord: 'work', isGivenWord: true, category: '谓语动词' }]
}], { qtype: 'choice' });
ok(qsChoice[0].type === 'choice', 'qtype=choice 仍可点选');
const promptWeak = E.ai.buildPrompt({ topicId: 'all', count: 10, weakTags: ['现在完成时（40%）', '被动语态（50%）'] });
ok(promptWeak.indexOf('现在完成时') >= 0 && promptWeak.indexOf('薄弱点') >= 0, '薄弱点写进 prompt');

console.log('[10] AI：讲解缓存 / 中断 / 导出题库');
E.ai.setExplainCache('q_test', { simple: '一句话', examples: ['a'] });
ok(E.ai.getExplainCache('q_test').simple === '一句话', '讲解缓存写入/读取');
ok(E.ai.cancelActive() === false, '没有进行中的请求时 cancelActive=false');
ok(typeof E.ai.explainQuestion === 'function', 'explainQuestion 存在');
E.ai.explainQuestion({ question: 'x ______', answerText: 'a' }, {}).then(() => {
  ok(false, '无 Key 时 explainQuestion 应该失败');
}, (err) => {
  ok(err && err.code === 'NO_KEY', '无 Key 时 explainQuestion 拒绝（NO_KEY）');
  finishAll();
});

function finishAll() {
  console.log('\n[11] AI 导出题库文件');
  const marks = Array.from({ length: 10 }, (_, i) => ' ______ ' + (i < 5 ? '(hold) ' : '')).join(' word ');
  const blanks = Array.from({ length: 10 }, (_, i) => ({
    n: i + 1, answer: 'answer' + i, answerRaw: 'answer' + i, accepted: ['answer' + i],
    isGivenWord: i < 5, givenWord: i < 5 ? 'hold' : '', category: '谓语动词',
    knowledgePoint: '考点' + i, sense: '句意', clue: '线索', why: '判断', others: '其它', tip: '记忆', difficulty: 2
  }));
  const res = E.ai.buildBankFile({
    date: '2026-10-18', cfg: { modelId: 'test-model' },
    papers: [{ kind: 'passage', title: 'AI Passage', passage: 'Intro sentence here.' + marks, blanks }]
  });
  ok(res.ok === true, '合法记录可以导出（' + (res.errors || []).join('；') + '）');
  ok(/bank-papers-ai-\d{8}\.js/.test(res.filename), '文件名符合 bank-papers-ai-日期.js');
  // 把导出的 JS 真跑一遍，确认能注册进 __EGL_PAPERS__
  const sb2 = { window: {}, console };
  sb2.window = sb2;
  vm.createContext(sb2);
  vm.runInContext(res.js, sb2, { filename: res.filename });
  ok(Array.isArray(sb2.window.__EGL_PAPERS__) && sb2.window.__EGL_PAPERS__.length === 1, '导出的 JS 能直接执行并注册语篇');
  const bp = sb2.window.__EGL_PAPERS__[0];
  ok(bp.blanks.length === 10 && bp.passage.indexOf('______') >= 0, '导出语篇 10 空且正文带空位');
  ok(bp.blanks.every(b => b.catId && b.point && b.wrongType), '导出空字段齐全（catId/point/wrongType）');
  // 结构错误必须拦住
  const bad = E.ai.buildBankFile({
    papers: [{ kind: 'passage', passage: 'only ______ here', blanks: [] }]
  });
  ok(bad.ok === false && bad.errors.length > 0, '空数不对时拒绝导出');
  const single = E.ai.buildBankFile({ papers: [{ kind: 'sentence', passage: 'a ______ b', blanks: [] }] });
  ok(single.ok === false, '单句记录拒绝导出（题库只收整篇）');

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
}
