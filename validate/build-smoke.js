#!/usr/bin/env node
/* ============================================================
 * validate/build-smoke.js — 直接执行【打包产物】English-Grammar-Lab.html
 * 的内联脚本（数据块 + 应用块），验证 $ / $$ 助手在产物中语义正确、
 * 各视图渲染不抛错。
 * 用途：曾出现 build.js 用字符串 replace 导致 $$→$ 的产物级损坏，
 * 源码级测试无法发现，故必须对产物本身跑一遍。
 * 用法：node validate/build-smoke.js
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'English-Grammar-Lab.html'), 'utf8');

/* ---------- 极简 DOM 桩（与 dom-smoke 相同） ---------- */
class FakeClassList { add() {} remove() {} toggle() {} contains() { return false; } }
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
  insertBefore(c, ref) { c.parentNode = this; if (!ref) this.children.push(c); else { const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, c); } return c; }
  remove() { if (this.parentNode) { const i = this.parentNode.children.indexOf(this); if (i >= 0) this.parentNode.children.splice(i, 1); this.parentNode = null; } }
  addEventListener(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); }
  removeEventListener() { }
  click() { (this.listeners.click || []).forEach(f => f.call(this, {})); }
  querySelector() { return synth('div'); }
  querySelectorAll() { return [synth('div')]; }
  scrollIntoView() { }
  setAttribute(k, v) { this.attributes[k] = v; if (k === 'id') this.id = v; if (k === 'data-ai') this.dataset.ai = v; if (k === 'class') this.className = v; }
  getAttribute(k) { return this.attributes[k]; }
}
function synth(sel) {
  const e = new FakeEl('div');
  if (!sel) return e;
  const tagM = sel.match(/^([a-z0-9]+)/i);
  if (tagM) e.tagName = tagM[1].toUpperCase();
  return e;
}
const document = {
  readyState: 'complete',
  _root: null,
  createElement(tag) { return new FakeEl(tag); },
  getElementById() { if (!this._root) this._root = new FakeEl('div'); return this._root; },
  querySelector() { return synth('div'); },
  querySelectorAll() { return [synth('div')]; },
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
  FileReader: function () { },
  setTimeout, clearTimeout, Promise, navigator: {}
};
sb.window = sb;
sb.globalThis = sb;

/* ---------- 提取并执行产物内联脚本 ---------- */
const scripts = [];
const re = /<script>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(HTML))) {
  const code = m[1];
  if (code.trim()) scripts.push(code);
}
console.log('[build] 提取内联脚本块：' + scripts.length);
vm.createContext(sb);
scripts.forEach((code, i) => {
  try {
    vm.runInContext(code, sb, { filename: 'English-Grammar-Lab.html#script' + i });
  } catch (e) {
    console.log('  ✗ 脚本块 ' + i + ' 执行错误: ' + e.message);
    process.exitCode = 1;
    throw e;
  }
});

let pass = 0, fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log('  ✓ ' + name);
  } catch (e) {
    fail++;
    console.log('  ✗ ' + name + ' → ' + e.message);
    process.exitCode = 1;
  }
}

const EGL = sb.window.EGL;
console.log('[build] $ / $$ 助手语义（产物级）');
check('EGL.u.$ 存在', () => { if (typeof EGL.u.$ !== 'function') throw new Error('EGL.u.$ 缺失'); });
check('EGL.u.$$ 存在（曾因构建吞 $$ 而缺失）', () => { if (typeof EGL.u.$$ !== 'function') throw new Error('EGL.u.$$ 缺失'); });
check('EGL.u.$ 返回单个元素', () => { const r = EGL.u.$('#probe'); if (Array.isArray(r)) throw new Error('$ 返回了数组（构建损坏特征）'); if (!r || typeof r.appendChild !== 'function') throw new Error('$ 返回值非元素'); });
check('EGL.u.$$ 返回数组', () => { const r = EGL.u.$$('.x'); if (!Array.isArray(r)) throw new Error('$$ 未返回数组'); });
check('EGL.u.$$ 导出键名正确', () => { const u = EGL.u; if (!('$$' in u)) throw new Error('EGL.u 无 $$ 键'); });

console.log('[build] 视图渲染（产物级）');
check('home', () => EGL.ui.home());
check('topics', () => EGL.ui.topics());
check('topicPage tense01', () => EGL.ui.topicPage('tense01'));
check('wrongBook', () => EGL.ui.wrongBook());
check('weak', () => EGL.ui.weak());
check('records', () => EGL.ui.records());
check('mixedGate', () => EGL.quiz.mixedGate());
check('methodPage', () => EGL.ui.methodPage());

console.log('[build] 练习流程（产物级）');
check('startCore normal', () => EGL.quiz.startCore('tense01', 'normal'));
check('startCore blind', () => EGL.quiz.startCore('tense06', 'blind'));
check('startChallenge', () => EGL.quiz.startChallenge('tense01'));

console.log('[build] AI 界面（产物级）');
check('aiPage 渲染', () => {
  if (!EGL.aiUI || typeof EGL.aiUI.aiPage !== 'function') throw new Error('aiUI 缺失');
  EGL.aiUI.aiPage();
});
check('startAI', () => {
  const papers = [{ title: 'T', passage: 'Tom ____ hard.', blanks: [
    { n: 1, answer: 'works', givenWord: 'work', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '三单加s', difficulty: 1 } ] }];
  const qs = EGL.ai.papersToQuestions(papers, { gradeKey: 'g1' });
  EGL.quiz.startAI(qs, { mode: 'normal', title: 'AI 测试', gradeKey: 'g1' });
  if (!EGL.quiz.isActive()) throw new Error('quiz 未激活');
});

console.log('结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(process.exitCode || 0);
