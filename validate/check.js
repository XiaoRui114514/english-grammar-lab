#!/usr/bin/env node
/* ============================================================
 * validate/check.js — 题库结构质量校验（Node 运行）
 * 用法：node validate/check.js
 * 它把 data/bank-*.js 当作 <script> 读取，在模拟 window 中执行，
 * 然后逐条校验 DATA_SCHEMA.md 规定的结构约束，并打印报告。
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

const ERR_TYPES = ['TIME_SIGNAL_ERROR','CONTEXT_ERROR','TENSE_CONFUSION','VOICE_ERROR',
  'SUBJECT_VERB_AGREEMENT','VERB_FORM_ERROR','SPELLING_ERROR','WORD_FORM_ERROR',
  'PREPOSITION_ERROR','ARTICLE_ERROR','PRONOUN_ERROR','CONJUNCTION_ERROR','CLAUSE_ERROR','COLLOCATION_ERROR'];

function loadRegistry() {
  const window = {};          // 模拟浏览器 window
  const files = fs.readdirSync(DATA_DIR).filter(f => /^bank-.*\.js$/.test(f)).sort();
  const errors = [];
  const loaded = [];
  for (const f of files) {
    const full = path.join(DATA_DIR, f);
    let code;
    try {
      code = fs.readFileSync(full, 'utf8');
    } catch (e) { errors.push(`[读取失败] ${f}: ${e.message}`); continue; }
    try {
      // 去掉可能导致严格模式问题的 BOM
      code = code.replace(/^\uFEFF/, '');
      // eslint-disable-next-line no-new-func
      new Function('window', code)(window);
      loaded.push(f);
    } catch (e) {
      errors.push(`[执行失败] ${f}: ${e.message}`);
    }
  }
  return { reg: (window.__GRAMMAR_LAB__ || {}), papers: (window.__EGL_PAPERS__ || []), errors, loaded };
}

/* ---------- 上海真题语篇（整篇 10 空）校验 ---------- */
const CAT_IDS = ['verb', 'nonfinite', 'transform', 'attrib', 'nominal', 'adverbial', 'prep', 'article', 'pronoun', 'coord', 'extra'];
function wordsOfText(s) {
  const m = String(s).match(/[A-Za-z][A-Za-z'’-]*/g);
  return m ? m.length : 0;
}
function checkPapers(papers) {
  const issues = [];
  if (!papers || !papers.length) { issues.push('没有载入真题语篇（window.__EGL_PAPERS__ 为空）'); return issues; }
  const seen = new Set();
  papers.forEach((p, idx) => {
    const label = `语篇${p.no || idx + 1}《${p.title || ''}》`;
    if (!p.id) issues.push(label + ': 缺 id');
    else if (seen.has(p.id)) issues.push(label + ': id 重复 ' + p.id);
    else seen.add(p.id);
    if (!p.title) issues.push(label + ': 缺 title');
    if (!p.source) issues.push(label + ': 缺 source（卷别出处）');
    if (!p.level) issues.push(label + ': 缺 level（年级）');
    if (!p.genre) issues.push(label + ': 缺 genre（体裁）');
    if (!p.passage) issues.push(label + ': 缺 passage');
    const blanks = p.blanks || [];
    if (blanks.length !== 10) issues.push(label + `: blanks 应恰 10 个，实际 ${blanks.length}`);
    const marks = (String(p.passage || '').match(/______/g) || []).length;
    if (marks !== blanks.length) issues.push(label + `: 正文空位 ${marks} 个，与 blanks ${blanks.length} 个不一致`);
    if (wordsOfText(p.passage) < 180) issues.push(label + ': 语篇词数偏少（' + wordsOfText(p.passage) + '），真卷一般 250-330 词');
    const parts = String(p.passage || '').split(/_{4,}/);
    for (let i = 1; i < parts.length - 1; i++) {
      const w = wordsOfText(parts[i]);
      if (w < 3) issues.push(label + `: 第 ${i} 与第 ${i + 1} 空只隔 ${w} 个词，太密`);
    }
    let givenN = 0;
    blanks.forEach((b, i) => {
      const q = label + ' 第' + (i + 1) + '空';
      if (b.n != null && b.n !== i + 1) issues.push(q + ': n 应与顺序一致');
      if (!b.answer) issues.push(q + ': 缺 answer');
      if (!Array.isArray(b.accepted) || !b.accepted.length) issues.push(q + ': 缺 accepted');
      else {
        const low = b.accepted.map(x => String(x).toLowerCase());
        if (new Set(low).size !== low.length) issues.push(q + ': accepted 含重复变体');
        if (low.indexOf(String(b.answer).toLowerCase()) < 0) issues.push(q + ': accepted 未包含 answer');
      }
      if (b.isGiven) { givenN++; if (!b.given) issues.push(q + ': isGiven 为真但缺 given'); }
      else if (b.given) issues.push(q + ': 未标 isGiven 却给了 given');
      if (!CAT_IDS.includes(b.catId)) issues.push(q + ': catId「' + b.catId + '」不在大专题列表');
      if (!b.wrongType) issues.push(q + ': 缺 wrongType');
      ['point', 'sense', 'clue', 'why', 'others', 'tip'].forEach(f => {
        if (!b[f] || !String(b[f]).trim()) issues.push(q + ': 解析缺 ' + f);
      });
      if (b.isGiven && b.given) {
        const g = String(b.given).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!new RegExp('_{4,}\\s*\\(\\s*' + g + '\\s*\\)', 'i').test(String(p.passage))) {
          issues.push(q + ': 正文里找不到紧跟空位的提示词（' + b.given + '）');
        }
      }
      const ans = String(b.answer || '').trim();
      if (ans.length >= 6 || ans.indexOf(' ') >= 0) {
        const re = new RegExp('\\b' + ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        if (re.test(String(p.passage).replace(/\([^)]*\)/g, ' '))) {
          issues.push(q + ': 答案「' + ans + '」出现在了正文里（答案只能写在 blanks）');
        }
      }
    });
    if (givenN < 4 || givenN > 6) issues.push(label + ': 有提示词应 4-6 空，实际 ' + givenN);
  });
  return issues;
}

function wordsOf(text) {
  const cleaned = String(text).replace(/\([^)]*\)/g, ' ').replace(/______/g, ' ');
  const m = cleaned.match(/[A-Za-z][A-Za-z'’-]*/g);
  return m ? m.length : 0;
}
function blanksOf(text) {
  return (String(text).match(/______/g) || []).length;
}

function checkTopic(reg) {
  const issues = [];
  const ids = new Set();
  const sentences = [];
  const topics = Object.keys(reg).filter(k => /^tense\d\d$/.test(k)).sort();
  const wanted = [];
  for (let i = 1; i <= 12; i++) wanted.push('tense' + String(i).padStart(2, '0'));
  for (const w of wanted) if (!reg[w]) issues.push(`缺少专题 ${w}`);

  for (const key of topics) {
    const t = reg[key];
    const label = `${t.no || key} ${t.title || ''}`;
    if (!t.title) issues.push(`${key}: 缺 title`);
    if (!t.icon) issues.push(`${key}: 缺 icon`);
    if (!/^#[0-9a-fA-F]{6}$/.test(t.color || '')) issues.push(`${key}: color 应为 #rrggbb，实际 ${t.color}`);
    if (!t.knowledgeCard) issues.push(`${key}: 缺 knowledgeCard`);
    else {
      for (const f of ['oneLine','structure','scenes','examples','commonMistake','judgment','memory'])
        if (!t.knowledgeCard[f] || !String(t.knowledgeCard[f]).trim()) issues.push(`${key}: knowledgeCard.${f} 为空`);
    }
    if (!Array.isArray(t.review5) || t.review5.length !== 5) issues.push(`${label}: review5 应为 5 条`);
    if (!Array.isArray(t.examFlow) || t.examFlow.length < 3) issues.push(`${label}: examFlow 至少 3 条`);
    if (!Array.isArray(t.tags) || t.tags.length < 4) issues.push(`${label}: tags 至少 4 个`);
    const qs = t.questions;
    if (!qs || qs.length !== 12) { issues.push(`${label}: questions 应为 12 个，实际 ${qs ? qs.length : 0}`); continue; }
    qs.forEach((q, i) => {
      const pos = i + 1;
      const p = `${label} #${pos}`;
      if (q.pos !== pos) issues.push(`${p}: pos=${q.pos} 应=${pos}`);
      if (!q.id || ids.has(q.id)) issues.push(`${p}: id 缺失或重复 ${q.id}`);
      ids.add(q.id);
      if (!/^tense\d\d[qp]\d+$/.test(q.id || '')) issues.push(`${p}: id 格式 ${q.id}`);
      const wantChoice = pos <= 6;
      const gotType = q.type;
      if (wantChoice && gotType !== 'choice') issues.push(`${p}: 应为 choice`);
      if (!wantChoice && gotType !== 'input') issues.push(`${p}: 应为 input`);
      if (!(q.difficulty >= 1 && q.difficulty <= 5)) issues.push(`${p}: difficulty ${q.difficulty}`);
      if (!q.tag) issues.push(`${p}: 缺 tag`);
      else if (t.tags && !t.tags.includes(q.tag)) issues.push(`${p}: tag「${q.tag}」不在 tags 列表`);
      if (!ERR_TYPES.includes(q.wrongType)) issues.push(`${p}: wrongType ${q.wrongType}`);
      if (!q.question || blanksOf(q.question) !== 1) issues.push(`${p}: question 应恰含 1 个 ______`);
      const wc = wordsOf(q.question);
      if (wc < 8) issues.push(`${p}: 句子过短 ${wc} 词：「${String(q.question).slice(0, 60)}…」`);
      else if (wc < 10) issues.push(`${p}: 句子偏短 ${wc} 词(建议≥10)：「${String(q.question).slice(0, 60)}…」`);
      if (sentences.includes(q.question)) issues.push(`${p}: 与库内其它题重复`);
      sentences.push(q.question);
      if (gotType === 'choice') {
        if (!Array.isArray(q.options) || q.options.length !== 6) issues.push(`${p}: options 应恰 6 个`);
        else {
          if (!(q.answerIndex >= 0 && q.answerIndex <= 5)) issues.push(`${p}: answerIndex 无效`);
          const set = new Set(q.options);
          if (set.size !== 6) issues.push(`${p}: options 有重复`);
          for (const o of q.options) if (!o || typeof o !== 'string') issues.push(`${p}: 空选项`);
        }
        if (q.hint && q.hint.trim()) issues.push(`${p}: choice 题不应有 hint`);
      } else {
        if (!q.hint || !q.hint.trim()) issues.push(`${p}: input 题缺 hint`);
        if (!Array.isArray(q.accepted) || q.accepted.length < 1) issues.push(`${p}: input 题 accepted 至少 1 个`);
        else {
          const normA = q.accepted.map(a => String(a).trim().toLowerCase());
          if (normA.some(a => !a)) issues.push(`${p}: accepted 含空项`);
          if (new Set(normA).size !== normA.length) issues.push(`${p}: accepted 含重复变体（占位式假变体）`);
        }
        if (!q.answerText) issues.push(`${p}: 缺 answerText`);
      }
      const ex = q.explanation || {};
      for (const f of ['answer','keyPoint','clue','trap','why','whyOthers','commonError','memory','examMind','cue','chain'])
        if (!ex[f] || !String(ex[f]).trim()) issues.push(`${p}: explanation.${f} 为空`);
    });
    // pool
    const pool = t.pool;
    if (!pool || pool.length !== 6) issues.push(`${label}: pool 应为 6 个，实际 ${pool ? pool.length : 0}`);
    else pool.forEach((q, i) => {
      const p = `${label} pool#${i + 1}`;
      if (!/^tense\d\dp\d+$/.test(q.id || '')) issues.push(`${p}: id 格式 ${q.id}`);
      if (q.type !== 'input') issues.push(`${p}: pool 应为 input`);
      if (!(q.difficulty >= 3 && q.difficulty <= 5)) issues.push(`${p}: difficulty ${q.difficulty}`);
      const wc = wordsOf(q.question);
      if (wc < 12) issues.push(`${p}: pool 句过短 ${wc} 词`);
      if (blanksOf(q.question) !== 1) issues.push(`${p}: pool question 应恰含 1 个 ______`);
      if (!Array.isArray(q.accepted) || q.accepted.length < 1) issues.push(`${p}: accepted <1`);
      else {
        const normP = q.accepted.map(a => String(a).trim().toLowerCase());
        if (normP.some(a => !a)) issues.push(`${p}: accepted 含空项`);
        if (new Set(normP).size !== normP.length) issues.push(`${p}: accepted 含重复变体`);
      }
      if (!q.answerText) issues.push(`${p}: 缺 answerText`);
      if (q.tag && t.tags && !t.tags.includes(q.tag)) issues.push(`${p}: tag 不在 tags`);
      if (!ERR_TYPES.includes(q.wrongType)) issues.push(`${p}: wrongType`);
      const ex = q.explanation || {};
      for (const f of ['answer','keyPoint','clue','trap','why','whyOthers','commonError','memory','cue'])
        if (!ex[f]) issues.push(`${p}: explanation.${f} 为空`);
    });
  }
  return issues;
}

function checkChallenge(reg) {
  const issues = [];
  const c = reg.challenge;
  if (!c) return ['缺少 challenge 综合挑战题组'];
  const qs = c.questions || [];
  if (qs.length !== 20) issues.push(`challenge: 应为 20 题，实际 ${qs.length}`);
  qs.forEach((q, i) => {
    const wantChoice = i < 10;
    if (wantChoice && q.type !== 'choice') issues.push(`challenge#${i + 1}: 应为 choice`);
    if (!wantChoice && q.type !== 'input') issues.push(`challenge#${i + 1}: 应为 input`);
    if (!(q.difficulty >= 3 && q.difficulty <= 5)) issues.push(`challenge#${i + 1}: difficulty ${q.difficulty}`);
    const wc = wordsOf(q.question);
    if (wc < 13) issues.push(`challenge#${i + 1}: 句过短 ${wc} 词`);
    if (blanksOf(q.question) !== 1) issues.push(`challenge#${i + 1}: 应恰含 1 个 ______`);
    if (wantChoice && (!q.options || q.options.length !== 6)) issues.push(`challenge#${i + 1}: options 应 6 个`);
    if (!wantChoice && (!q.hint || !q.accepted || q.accepted.length < 1)) issues.push(`challenge#${i + 1}: hint/accepted 问题`);
    if (!ERR_TYPES.includes(q.wrongType)) issues.push(`challenge#${i + 1}: wrongType`);
    const ex = q.explanation || {};
    for (const f of ['answer','keyPoint','clue','trap','why','whyOthers','commonError','memory','cue'])
      if (!ex[f]) issues.push(`challenge#${i + 1}: explanation.${f} 为空`);
  });
  return issues;
}

const { reg, papers, errors, loaded } = loadRegistry();
console.log('已加载数据文件:', loaded.join(', ') || '(无)');
const allIssues = [...errors, ...checkTopic(reg), ...checkChallenge(reg), ...checkPapers(papers)];
if (allIssues.length === 0) {
  console.log('\n✅ 全部校验通过（12 专题 × 12 核心题 + 6 pool + 20 挑战题 + ' + papers.length + ' 篇真题语篇 × 10 空）。');
} else {
  console.log(`\n❌ 发现 ${allIssues.length} 个问题：`);
  allIssues.slice(0, 120).forEach(x => console.log(' - ' + x));
  if (allIssues.length > 120) console.log(`   … 还有 ${allIssues.length - 120} 条未显示`);
  process.exitCode = 1;
}
