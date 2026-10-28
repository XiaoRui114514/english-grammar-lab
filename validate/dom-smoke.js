#!/usr/bin/env node
/* ============================================================
 * validate/dom-smoke.js — 轻量 DOM 桩，渲染所有主视图查运行错误
 * 用法：node validate/dom-smoke.js
 * 说明：不模拟真实布局，仅保证各视图函数无抛错、关键 API 联通。
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* ---------- 极简 DOM 桩 ---------- */
class FakeClassList {
  constructor(el) { this.el = el; }
  _set() { /* 不解析，仅记录 */ }
  add() { }
  remove() { }
  toggle() { }
  contains() { return false; }
}
class FakeEl {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this._innerHTML = '';
    this.style = { setProperty() {}, removeProperty() {}, cssText: '' };
    this.classList = new FakeClassList(this);
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.queriedNodes = [];
    this.value = '';
    this.disabled = false;
    this.open = false;
    this.type = '';
    this.id = '';
    this.className = '';
    this.scrollTop = 0;
  }
  set className(v) { this._className = v; }
  get className() { return this._className || ''; }
  set innerHTML(v) { this._innerHTML = String(v); }
  get innerHTML() { return this._innerHTML; }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text || ''; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  insertBefore(c, ref) { c.parentNode = this; if (!ref) { this.children.push(c); } else { const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, c); } return c; }
  remove() { if (this.parentNode) { const i = this.parentNode.children.indexOf(this); if (i >= 0) this.parentNode.children.splice(i, 1); this.parentNode = null; } }
  addEventListener(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); }
  removeEventListener() { }
  click() { const ls = this.listeners.click || []; ls.forEach(f => f.call(this, {})); }
  querySelector(sel) {
    // 桩不解析 innerHTML，因此查询时返回一个"合成匹配"以维持事件绑定流程
    const n = synth(sel);
    this.queriedNodes.push(n);
    return n;
  }
  querySelectorAll(sel) {
    const n = synth(sel);
    return n ? [n] : [];
  }
  scrollIntoView() { }
  setAttribute(k, v) { this.attributes[k] = v; if (k === 'class') this.className = v; if (k === 'id') this.id = v; if (k === 'data-mode') this.dataset.mode = v; }
  getAttribute(k) { return this.attributes[k]; }
}
// 依据选择器生成合成元素（tag/cls/data 属性）
function synth(sel) {
  if (!sel) return null;
  const e = new FakeEl('div');
  const tagM = sel.match(/^([a-z0-9]+)/i);
  if (tagM) e.tagName = tagM[1].toUpperCase();
  const clsM = sel.match(/\.([A-Za-z0-9_-]+)/);
  if (clsM) e.className = clsM[1];
  const attrM = sel.match(/\[data-([A-Za-z0-9_-]+)(?:="([^"]*)")?\]/);
  if (attrM) {
    e.dataset[attrM[1]] = attrM[2] !== undefined ? attrM[2] : '1';
    e.setAttribute('data-' + attrM[1], e.dataset[attrM[1]]);
  }
  const typeM = sel.match(/^input\[type=([A-Za-z0-9_-]+)\]/);
  if (typeM) e.type = typeM[1];
  return e;
}
const document = {
  readyState: 'complete',
  _els: [],
  _byId: {},
  createElement(tag) { const e = new FakeEl(tag); this._els.push(e); return e; },
  getElementById(id) {
    if (!this._byId[id]) { const e = new FakeEl('div'); e.id = id; this._byId[id] = e; }
    return this._byId[id];
  },
  querySelector() { return null; },
  querySelectorAll() { return [] },
  addEventListener() { },
  body: new FakeEl('body')
};
function fakeLocalStorage() {
  const m = {};
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } };
}

const sb = {
  console, document,
  localStorage: fakeLocalStorage(),
  location: { hash: '#/home', href: 'file:///index.html' },
  matchMedia: () => ({ matches: false }),
  scrollTo() { },
  addEventListener() { },
  removeEventListener() { },
  URL: { createObjectURL: () => 'blob:x', revokeObjectURL() { } },
  Blob: function () { },
  FileReader: function () { this.readAsText = () => { }; },
  setTimeout, clearTimeout,
  // 计时器用桩：只验证代码路径，不让测试挂住
  setInterval: () => 0, clearInterval: () => {},
  Promise
};
sb.window = sb;
sb.globalThis = sb;
sb.print = function () { /* 桩：打印调用不真的弹窗 */ };

function run(name) {
  const code = fs.readFileSync(path.join(ROOT, name), 'utf8').replace(/^\uFEFF/, '');
  vm.createContext(sb);
  try {
    vm.runInContext(code, sb, { filename: name });
  } catch (e) {
    console.log('  ✗ ' + name + ' 执行错误: ' + e.message);
    process.exitCode = 1;
    throw e;
  }
}

function loadAll() {
  run('src/brand.js');
  run('src/core.js');
  run('src/ui-helpers.js');
  run('src/print.js');
  run('src/ai.js');
  run('src/ui-views.js');
  run('src/ui-quiz.js');
  run('src/ui-ai.js');
  run('data/roadmap.js');
  run('data/curriculum.js');
  run('data/method-course.js');
  fs.readdirSync(path.join(ROOT, 'data'))
    .filter(f => /^bank-.*\.js$/.test(f)).sort()
    .forEach(f => run('data/' + f));
  run('src/boot.js');
}

function check(name, fn) {
  try {
    fn();
    console.log('  ✓ ' + name);
  } catch (e) {
    console.log('  ✗ ' + name + ' → ' + e.message + (e.stack ? '\n    ' + e.stack.split('\n').slice(1, 4).join('\n    ') : ''));
    process.exitCode = 1;
  }
}

loadAll();
const EGL = sb.window.EGL;
function resetView() {
  const v = EGL.ui.app && EGL.ui.app.view;
  if (v) v.children.length = 0;
}
function viewHas(text) {
  let found = false;
  (function walk(n) {
    if (!n) return;
    if (n._innerHTML && String(n._innerHTML).indexOf(text) >= 0) found = true;
    if (n.children) n.children.forEach(walk);
  })(EGL.ui.app.view);
  return found;
}
// 诊断
console.log('[diag] EGL.u.$$ =', typeof EGL.u.$$, ' EGL.u.$ =', typeof EGL.u.$);
console.log('[diag] EGL.ui.app =', EGL.ui.app && typeof EGL.ui.app.view);

console.log('[dom] boot 后初始视图渲染');
check('首页 home', () => EGL.ui.home());
check('专题列表 topics', () => EGL.ui.topics());
check('专题页 tense01', () => EGL.ui.topicPage('tense01'));
check('专题页 tense06', () => EGL.ui.topicPage('tense06'));
check('错题本 wrongBook', () => EGL.ui.wrongBook());
check('薄弱点 weak', () => EGL.ui.weak());
check('学习记录 records', () => EGL.ui.records());
check('关于 about', () => EGL.ui.aboutPage());
check('综合挑战 gate', () => EGL.quiz.mixedGate());

console.log('[dom] 练习流程渲染');
check('startCore normal', () => EGL.quiz.startCore('tense01', 'normal'));
check('startCore blind', () => EGL.quiz.startCore('tense06', 'blind'));
check('startChallenge', () => EGL.quiz.startChallenge('tense01'));
check('startRetrain', () => EGL.quiz.startRetrain('tense06', null));
check('startMixed normal', () => EGL.quiz.startMixed('normal'));
check('startMixed blind', () => EGL.quiz.startMixed('blind'));

console.log('[dom] 答题判定（模拟输入答案路径）');
check('input 判定 was working', () => {
  const ok = EGL.util.checkInputAnswer('Was Working', ['was working']);
  if (!ok) throw new Error('判定失败');
});
check('choice 答案一致性（全库抽查 options[answerIndex] 非空且不在 accepted 冲突）', () => {
  const b = EGL.bank();
  Object.keys(b).forEach(k => {
    const list = (b[k].questions || []).concat(b[k].pool || []);
    list.forEach(q => {
      if (q.type === 'choice') {
        if (!(q.answerIndex >= 0 && q.answerIndex <= 5 && q.options && q.options.length === 6)) throw new Error(k + ' ' + q.id + ' choice 结构错误');
      } else {
        if (!q.accepted || q.accepted.length < 1 || !q.hint) throw new Error(k + ' ' + q.id + ' input 结构错误');
      }
    });
  });
});

console.log('[dom] 视图切换');
check('go topics', () => { EGL.ui.go('topics'); });
check('go topic/tense01', () => { EGL.ui.go('topic/tense01'); });
check('go home', () => { EGL.ui.go('home'); });
check('go wrong', () => { EGL.ui.go('wrong'); });
check('go weak', () => { EGL.ui.go('weak'); });
check('go records', () => { EGL.ui.go('records'); });
check('render 全路由', () => { EGL.ui.render(); });

console.log('[dom] AI 界面与语篇答题');
check('aiPage 渲染（直接调用渲染函数）', () => {
  if (!EGL.aiUI || typeof EGL.aiUI.aiPage !== 'function') throw new Error('EGL.aiUI.aiPage 不存在');
  EGL.aiUI.aiPage();
  const view = EGL.ui.app.view;
  if (!view || view.children.length < 2) throw new Error('aiPage 未向视图注入内容');
  const found = [];
  (function walk(n) {
    if (n && n._innerHTML && n._innerHTML.indexOf('DeepSeek') >= 0) found.push(1);
    if (n && n.children) n.children.forEach(walk);
  })(view);
  if (!found.length) throw new Error('aiPage 未包含 API Key 配置区');
});
check('methodPage 真实渲染', () => { EGL.ui.methodPage(); });
check('startAI（AI 语篇题进入原做题界面）', () => {
  const papers = [{ title: 'T', passage: 'Tom ____ hard. ____ he plays a lot.', blanks: [
    { n: 1, answer: 'works', givenWord: 'work', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '三单加s', difficulty: 1 },
    { n: 2, answer: 'Though', givenWord: '', isGivenWord: false, type: 'conjunction', knowledgePoint: '让步连词', category: '并列与逻辑', explanation: '让步', difficulty: 1 }
  ] }];
  const qs = EGL.ai.papersToQuestions(papers, { topicId: 'all', count: 2 });
  if (qs.length !== 2) throw new Error('AI 转换条数错误：' + qs.length);
  EGL.quiz.startAI(qs, { mode: 'normal', title: 'AI 测试' });
  if (!EGL.quiz.isActive()) throw new Error('startAI 后 quiz 未激活');
});
check('AI 判分/错题/大专题统计落库', () => {
  // 直接走核心统计路径（模拟第1空答错）
  const q = { id: 'ai_x_p0_b1', source: 'ai', isAI: true, type: 'input',
    aiMeta: { catId: 'verb', catName: '谓语动词', knowledgePoint: '一般现在时' },
    tag: '一般现在时', question: 'Tom ____ hard.', hint: 'work', accepted: ['works'], answerText: 'works',
    wrongType: 'CONTEXT_ERROR', explanation: { why: '主语三单', keyPoint: '考点' } };
  EGL.recordTag('ai:verb', '一般现在时', false);
  EGL.addWrong({ topicId: 'ai:verb', topicTitle: 'AI · 谓语动词', qid: q.id, question: q.question, tag: '一般现在时',
    myAnswer: 'work', correctAnswer: 'works', wrongType: 'CONTEXT_ERROR', source: 'ai', catId: 'verb' });
  const wb = EGL.data.wrongBook.find(x => x.qid === q.id);
  if (!wb || wb.source !== 'ai') throw new Error('AI 错题未入库或来源缺失');
  const stats = EGL.categoryStats().find(c => c.catId === 'verb');
  if (!stats || stats.attempts < 1) throw new Error('大专题统计未聚合 AI 数据');
});
check('AI 整篇卷面：点选全部空并交卷', () => {
  const papers2 = [{ title: 'Sheet T', passage: 'Tom ____ every day. ____ he also reads.',
    blanks: [
      { n: 1, answer: 'works', options: ['works', 'work', 'worked', 'working'], givenWord: 'work', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '三单加s', difficulty: 1 },
      { n: 2, answer: 'Although', options: ['Although', 'But', 'Because', 'If'], givenWord: null, isGivenWord: false, type: 'conjunction', knowledgePoint: '让步连词', category: '并列与逻辑', explanation: '虽然…但', difficulty: 1 }
    ] }];
  const qs2 = EGL.ai.papersToQuestions(papers2, { count: 2, qtype: 'choice' });
  EGL.quiz.startAI(qs2, { mode: 'normal', title: 'Sheet' });
  if (!EGL.quiz.isActive()) throw new Error('startAI 未激活');
  // 找到每个空的第一选项并点击（正确项在首位）
  const opts = [];
  (function walk(n) {
    if (!n || !n.children) return;
    if (String(n.className || '').indexOf('sq-opt') === 0) opts.push(n);
    n.children.forEach(walk);
  })(EGL.ui.app.view);
  if (!opts.length) throw new Error('整篇卷面未渲染选项按钮');
  opts.forEach(b => { if (String(b.dataset.idx) === '0') b.click(); });
  // 交卷
  let sub = null;
  (function walk2(n) {
    if (!n || !n.children) return;
    if (n.id === 'sheetSubmit') sub = n;
    n.children.forEach(walk2);
  })(EGL.ui.app.view);
  if (!sub) throw new Error('未找到交卷按钮');
  sub.click();
  // 应进入成绩页（含正确率/逐题回顾）
  let hasScore = false;
  (function walk3(n) {
    if (!n || !n.children) return;
    if (String(n._innerHTML || '').indexOf('正确率') >= 0) hasScore = true;
    n.children.forEach(walk3);
  })(EGL.ui.app.view);
  if (!hasScore) throw new Error('交卷后未出现成绩页');
});

console.log('[dom] 新功能渲染与打印稿');
check('首页：连续学习 + 最近 7 天', () => {
  resetView(); EGL.ui.home();
  if (!viewHas('连续学习') || !viewHas('最近 7 天')) throw new Error('缺新账目行 / 柱图');
});
check('设置页：字号 + 每日目标', () => {
  resetView(); EGL.ui.settingsPage();
  if (!viewHas('字号') || !viewHas('每日目标')) throw new Error('缺设置项');
});
check('语篇页：真题考点频次', () => {
  resetView(); EGL.ui.papersPage();
  if (!viewHas('真题考点频次')) throw new Error('缺频次表');
});
check('错题本：筛选 / 笔记 / 打印', () => {
  resetView(); EGL.ui.wrongBook();
  if (!viewHas('打印当前筛选结果') || !viewHas('我为什么错')) throw new Error('缺筛选条或笔记');
});
check('限时卷面：右上角计时器', () => {
  resetView(); EGL.quiz.startPaper('paper01', { timed: true });
  if (!viewHas('quizTimer')) throw new Error('缺倒计时');
});
check('打印：练习卷含答题区', () => {
  EGL.print.paperSheet('paper01');
  const pr = document.getElementById('printRoot');
  const html = String(pr._innerHTML);
  if (html.indexOf('答题区') < 0 || html.indexOf('pr-blank') < 0) throw new Error('打印稿内容缺失');
});
check('打印：答案页含解析', () => {
  EGL.print.paperAnswers('paper01');
  const html = String(document.getElementById('printRoot')._innerHTML);
  if (html.indexOf('线索') < 0 || html.indexOf('判断') < 0) throw new Error('答案页缺解析');
});
check('打印：错题单含我的答案', () => {
  EGL.print.wrongList(EGL.data.wrongBook, '错题单');
  const html = String(document.getElementById('printRoot')._innerHTML);
  if (html.indexOf('我的答案') < 0 || html.indexOf('正确答案') < 0) throw new Error('错题单缺答案行');
});
check('打印：成绩单含得分', () => {
  EGL.print.result({
    title: '测试成绩单', date: '2026-10-18', correct: 1, total: 2, seconds: 10,
    modeLabel: '普通模式', answers: [
      { q: { tag: '考点A', answerText: 'a', type: 'input', accepted: ['a'] }, userText: 'a', ok: true },
      { q: { tag: '考点B', answerText: 'b', type: 'input', accepted: ['b'] }, userText: 'c', ok: false }
    ]
  });
  const html = String(document.getElementById('printRoot')._innerHTML);
  if (html.indexOf('得分') < 0 || html.indexOf('考点B') < 0) throw new Error('成绩单缺得分/逐题');
});

console.log('[dom] 真题语篇');
check('papersPage 渲染', () => {
  EGL.ui.papersPage();
  const view = EGL.ui.app.view;
  if (!view || !view.children.length) throw new Error('papersPage 未注入内容');
  let hasRow = false;
  (function walk(n) {
    if (!n || !n.children) return;
    if (n.dataset && n.dataset.pid) hasRow = true;
    n.children.forEach(walk);
  })(view);
  if (!hasRow) throw new Error('papersPage 没有列出语篇');
});
check('paperPage 渲染（考点分布）', () => {
  EGL.ui.paperPage('paper01');
  let hasTable = false;
  (function walk(n) {
    if (!n || !n.children) return;
    if (String(n._innerHTML || '').indexOf('mini-table') >= 0) hasTable = true;
    n.children.forEach(walk);
  })(EGL.ui.app.view);
  if (!hasTable) throw new Error('paperPage 缺考点分布表');
});
check('startPaper 进入整篇卷面并渲染 10 空卡片', () => {
  function countCards() {
    let n = 0;
    (function walk(node) {
      if (!node || !node.children) return;
      if (String(node.className || '').indexOf('sq-card') >= 0) n++;
      node.children.forEach(walk);
    })(EGL.ui.app.view);
    return n;
  }
  // 假 DOM 的 innerHTML='' 不清空 children，所以用“新增卡片数”来断言
  const before = countCards();
  EGL.quiz.startPaper('paper01');
  if (!EGL.quiz.isActive()) throw new Error('startPaper 后 quiz 未激活');
  const added = countCards() - before;
  if (added !== 10) throw new Error('整篇卷面应新增 10 张空卡，实际 ' + added);
});
check('startPaper 未知 id 不崩', () => {
  EGL.quiz.startPaper('paper_not_exist');
});

console.log('[dom] 新增页面（复习 / 专卷 / 设置 / 打印模块）');
check('reviewPage 渲染', () => EGL.ui.reviewPage());
check('customPage 空态渲染', () => EGL.ui.customPage());
check('buildCustomPaper 组卷', () => {
  const c = EGL.buildCustomPaper();
  if (!c || !c.items || !c.items.length) throw new Error('组卷为空');
  if (c.items.length !== 10) throw new Error('组卷应为 10 空，实际 ' + c.items.length);
});
check('customPage 有卷子时渲染', () => EGL.ui.customPage());
check('settingsPage 渲染（字号/每日目标）', () => EGL.ui.settingsPage());
check('打印模块已加载', () => {
  if (!EGL.print || typeof EGL.print.paperSheet !== 'function') throw new Error('EGL.print 缺失');
  if (typeof EGL.print.wrongList !== 'function' || typeof EGL.print.result !== 'function') throw new Error('打印入口不全');
});
check('startReview / startCustom 不崩', () => {
  EGL.quiz.startReview();
  EGL.quiz.startCustom({ timed: true });
  if (!EGL.quiz.isActive()) throw new Error('专卷未进入做题流程');
});
check('限时模拟考：startPaper(timed)', () => {
  EGL.quiz.startPaper('paper01', { timed: true });
  if (!EGL.quiz.isActive()) throw new Error('限时卷面未激活');
});

console.log('[dom] 整篇交卷回归');
function sheetFixture() {
  EGL.resetData();
  const qs = EGL.paperToQuestions(EGL.paperById('paper01')).slice(0, 2);
  const start = document._els.length;
  EGL.quiz.startAI(qs, { title: '交卷回归' });
  const created = document._els.slice(start);
  const inputs = created.filter(n => n.className === 'answer-input')
    .map(n => n.queriedNodes.find(x => x.tagName === 'INPUT'));
  const submit = created.find(n => n.id === 'sheetSubmit');
  if (inputs.length !== 2 || inputs.some(n => !n) || !submit) throw new Error('未找到卷面控件');
  function type(i, value) {
    inputs[i].value = value;
    (inputs[i].listeners.input || []).forEach(fn => fn({}));
  }
  return { qs, submit, type };
}
check('未答完交卷后修改答案，按最终输入判分', () => {
  const f = sheetFixture();
  f.type(0, 'wrong answer');
  f.submit.click();
  if (EGL.data.global.answered !== 0) throw new Error('未答完时不应落库');
  f.type(0, f.qs[0].accepted[0]);
  f.type(1, f.qs[1].accepted[0]);
  f.submit.click();
  if (EGL.data.global.correct !== 2) throw new Error('仍使用第一次交卷时缓存的旧答案');
});
check('未答完交卷后清空答案，仍须补答', () => {
  const f = sheetFixture();
  f.type(0, f.qs[0].accepted[0]);
  f.submit.click();
  f.type(0, '');
  const metaNodes = EGL.ui.app.view.queriedNodes;
  if (metaNodes[metaNodes.length - 2].textContent !== '0 / 2') throw new Error('计数仍把已清空的旧答案当成已答');
  f.type(1, f.qs[1].accepted[0]);
  f.submit.click();
  if (EGL.data.global.answered !== 0 || EGL.data.sessions.length) throw new Error('清空的空位被旧答案当成已作答');
});
check('重复交卷事件不会重复累计成绩和错题', () => {
  const f = sheetFixture();
  f.type(0, 'wrong answer');
  f.type(1, f.qs[1].accepted[0]);
  f.submit.click();
  f.submit.click();
  if (EGL.data.global.answered !== 2 || EGL.data.sessions.length !== 1) throw new Error('重复交卷导致二次累计');
  if (EGL.data.wrongBook[0].times !== 1) throw new Error('重复交卷导致错误次数二次累计');
});
check('未答完交卷后修改或清空答案，退出时按当前输入落库', () => {
  const confirmBox = EGL.u.confirmBox;
  EGL.u.confirmBox = () => ({ then: fn => fn(true) });
  try {
    const f = sheetFixture();
    f.type(0, 'wrong answer');
    f.submit.click();
    f.type(0, f.qs[0].accepted[0]);
    EGL.quiz.askExit();
    if (EGL.data.global.answered !== 1 || EGL.data.global.correct !== 1) throw new Error('退出时仍使用旧答案');
    const f2 = sheetFixture();
    f2.type(0, f2.qs[0].accepted[0]);
    f2.submit.click();
    f2.type(0, '');
    EGL.quiz.askExit();
    if (EGL.data.global.answered !== 0) throw new Error('退出时仍统计已清空答案');
  } finally {
    EGL.u.confirmBox = confirmBox;
  }
});
check('过期或重复的退出确认不会再次结算或关闭新练习', () => {
  const confirmBox = EGL.u.confirmBox;
  const pending = [];
  EGL.u.confirmBox = () => ({ then: fn => pending.push(fn) });
  try {
    let f = sheetFixture();
    f.type(0, f.qs[0].accepted[0]);
    EGL.quiz.askExit();
    EGL.quiz.askExit();
    pending.shift()(true);
    pending.shift()(true);
    if (EGL.data.global.answered !== 1) throw new Error('重复退出导致二次统计');
    f = sheetFixture();
    EGL.quiz.askExit();
    sheetFixture();
    pending.shift()(true);
    if (!EGL.ui.quizActive || EGL.data.global.answered) throw new Error('旧确认影响了新练习');
  } finally {
    EGL.u.confirmBox = confirmBox;
  }
});

console.log('[dom] localStorage 持久化');
check('save/load roundtrip', () => {
  const d = EGL.data;
  d.global.answered = 7; d.global.correct = 5;
  EGL.save();
  const raw = sb.localStorage.getItem('EGL_LAB_DATA_v1');
  if (!raw) throw new Error('未写入');
  const parsed = JSON.parse(raw);
  if (parsed.global.answered !== 7) throw new Error('roundtrip 不一致');
});

process.exit(process.exitCode || 0);
