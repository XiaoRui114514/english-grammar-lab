#!/usr/bin/env node
/* validate/probe.js — 打印指定专题的题干+答案（人工抽查用） */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const key = process.argv[2] || 'tense01';
const what = process.argv[3] || 'core'; // core | pool
const ROOT = path.join(__dirname, '..');

const sb = { console };
sb.window = sb;
sb.localStorage = {
  getItem: () => null, setItem: () => {}, removeItem: () => {}
};
const mm = key.match(/^tense(\d+)$/);
const fname = mm ? 'bank-tense-' + mm[1] + '.js' : 'bank-' + key + '.js';
const code = fs.readFileSync(path.join(ROOT, 'data', fname), 'utf8').replace(/^\uFEFF/, '');vm.createContext(sb);
vm.runInContext(code, sb);
const t = sb.window.__GRAMMAR_LAB__[key];
if (!t) { console.log('not found'); process.exit(1); }
const list = what === 'pool' ? t.pool : t.questions;
list.forEach(q => {
  const ans = q.type === 'choice' ? LETTER(q.answerIndex) + ' ' + q.options[q.answerIndex] : q.answerText;
  const wc = (q.question.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
  console.log(q.id + ' | d' + q.difficulty + ' | ' + wc + '词 | tag=' + q.tag);
  console.log('   ' + q.question + (q.hint ? '   【hint:' + q.hint + '】' : ''));
  console.log('   答案: ' + ans + (q.accepted && q.accepted.length ? '  accepted=' + q.accepted.join(' / ') : ''));
});
function LETTER(i) { return String.fromCharCode(65 + i); }
