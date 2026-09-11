#!/usr/bin/env node
/* ============================================================
 * validate/flow-test.js — 引擎级整轮流程测试（不依赖 DOM）
 * 模拟普通模式一轮 12 题：前6全对/后6错2 → 校验统计/错题本/每日
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const store = {};
const sb = { console };
sb.window = sb;
sb.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
vm.createContext(sb);
['src/core.js', 'data/roadmap.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^\uFEFF/, ''), sb, { filename: f });
});
fs.readdirSync(path.join(ROOT, 'data'))
  .filter(f => /^bank-.*\.js$/.test(f)).sort()
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8').replace(/^\uFEFF/, ''), sb, { filename: f }));

const E = sb.EGL;
let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } }

// 模拟 quiz 单题提交路径（与 ui-quiz.commitStats 相同调用）
function commitQuestion(tid, q, userText, mode) {
  const isChoice = q.type === 'choice';
  let okAns;
  if (isChoice) okAns = false; // 不走这里，仅占位
  const correct = isChoice ? (Number(userText) === q.answerIndex)
    : E.util.checkInputAnswer(userText, q.accepted);
  E.addDaily(correct ? 1 : 0, 1);
  E.addGlobal(correct ? 1 : 0, 1);
  E.recordTag(tid, q.tag || '未分类', correct);
  if (!correct) {
    const corText = isChoice ? q.options[q.answerIndex] : (q.answerText || q.accepted[0]);
    E.addWrong({
      topicId: tid, topicTitle: E.bank()[tid].title, qid: q.id, question: q.question,
      tag: q.tag || '', myAnswer: userText, correctAnswer: corText,
      wrongType: q.wrongType || 'VERB_FORM_ERROR'
    });
  }
  return correct;
}

console.log('[flow] tense06 普通一轮：前6选择全对，后6输入对4错2');
const tid = 'tense06';
const qs = E.bank()[tid].questions;
let correct = 0;
qs.slice(0, 6).forEach(q => { if (commitQuestion(tid, q, String(q.answerIndex), 'normal')) correct++; });
const inputAnswers = [
  qs[6].answerText,                       // 对
  'wrong answer here',                    // 错
  qs[8].accepted[0],                      // 对
  qs[9].answerText,                       // 对
  'also wrong',                           // 错
  qs[11].answerText                       // 对
];
qs.slice(6).forEach((q, i) => { if (commitQuestion(tid, q, inputAnswers[i], 'normal')) correct++; });

ok(correct === 10, '模拟答对 10 题（实际 ' + correct + '）');
E.updateTopicStat(tid, correct, 12, 'normal');
E.addSession(tid, 'normal', correct, 12, 95);

const st = E.topicStat(tid);
ok(st.attempts === 12 && st.correct === 10, '专题累计 12/10');
ok(st.finished === true, '整轮完成 finished=true');
ok(st.bestRunPct >= 0.8 && st.bestRunPct <= 1, 'bestRunPct=' + st.bestRunPct);
ok(st.lastMode === 'normal', '模式记录');

ok(E.data.wrongBook.length === 2, '错题本 2 条');
ok(E.data.wrongBook[0].topicTitle === '现在完成时' || E.data.wrongBook[0].topicTitle, '错题带专题名');

const daily = E.data.daily[E.util.todayStr()];
ok(daily && daily.answered === 12 && daily.correct === 10, '每日统计 12/10');
ok(E.data.global.answered === 12 && E.data.global.correct === 10, '全局统计 12/10');
ok(E.data.sessions.length === 1, '会话记录 1 条');

// 错题再错 → times 累加
const w = E.data.wrongBook.find(x => x.qid === qs[7].id);
commitQuestion(tid, qs[7], 'wrong again', 'retrain');
const w2 = E.data.wrongBook.find(x => x.qid === qs[7].id);
ok(w2 && w2.times === 2, '同一错题 times 累加=2');

// 答对同一题不再新增
commitQuestion(tid, qs[7], qs[7].answerText, 'retrain');
ok(E.data.wrongBook.length === 2, '答对后错题数仍 2');

// 挑战解锁：bestRunPct<0.9 → 未解锁；补一轮满分 → 解锁
ok(E.isChallengeUnlocked(tid) === false, '10/12 未解锁挑战');
E.updateTopicStat(tid, 12, 12, 'normal');
ok(E.isChallengeUnlocked(tid) === true, '12/12 后解锁挑战');

// 再练5题抽题
const r5 = E.pickRetrain(tid, null, 5);
ok(r5.length === 5, '再练5题数量');
ok(r5.every(q => q.type === 'input'), '再练全为输入');
const r5b = E.pickRetrain(tid, null, 5);
ok(r5b.length === 5, '第二轮再练仍能出5题');

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
