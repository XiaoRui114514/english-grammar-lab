#!/usr/bin/env node
/* ============================================================
 * validate/smoke.js — 核心逻辑冒烟测试（Node，无浏览器）
 * 用法：node validate/smoke.js
 * 校验：答案归一化 / 输入判定 / 等级映射 / 数据文件可执行
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function makeSandbox() {
  const store = {};
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  // window 指向全局自身：window.EGL = ... 即成为全局变量 EGL（等同浏览器行为）
  const sandbox = { console, document: undefined, localStorage };
  sandbox.window = sandbox;
  return sandbox;
}

function runJs(file, sandbox) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/^\uFEFF/, '');
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return sandbox;
}

// ---- 加载核心与全部题库 ----
const sb = makeSandbox();
runJs('src/core.js', sb);
runJs('src/ui-helpers.js', sb);   // 只取 U.gradeOf 等无 DOM 依赖的函数
runJs('src/ai.js', sb);           // AI 逻辑
const loadedBanks = [];
runJs('data/roadmap.js', sb);
runJs('data/curriculum.js', sb);
runJs('data/method-course.js', sb);
fs.readdirSync(path.join(ROOT, 'data'))
  .filter(f => /^bank-.*\.js$/.test(f))
  .sort()
  .forEach(f => {
    const code = fs.readFileSync(path.join(ROOT, 'data', f), 'utf8');
    if (code.indexOf('/*__MORE__*/') >= 0) {
      console.log('  （跳过未完成：' + f + '）');
      return;
    }
    runJs('data/' + f, sb);
    loadedBanks.push(f);
  });

const EGL = sb.window.EGL;
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.log('  ✗ ' + msg); }
}

console.log('[1] 题库加载');
const banks = Object.keys(sb.window.__GRAMMAR_LAB__);
ok(banks.length >= 13, '注册专题数=' + banks.length + '（期望 ≥13：12专题+挑战）');

// ---- 答案归一化测试 ----
console.log('[2] 输入答案判定');
ok(EGL.util.checkInputAnswer('  was working ', ['was working']), 'trim+相等');
ok(EGL.util.checkInputAnswer('WAS WORKING', ['was working']), '大小写不敏感');
ok(EGL.util.checkInputAnswer("hasn't finished", ['has not finished']), '缩写展开');
ok(EGL.util.checkInputAnswer('had left.', ['had left']), '去尾部句点');
ok(EGL.util.checkInputAnswer("she's gone", ["she's gone", 'she has gone']), '直引号/变体');
ok(EGL.util.checkInputAnswer('doesnt', ["doesn't", 'does not']) === false, '错误形式不误收');
ok(EGL.util.checkInputAnswer('is not', ["isn't"]) === true, "isn't/is not 变体接受");
ok(EGL.util.checkInputAnswer('were go', ['was going', 'is going']) === false, '无关变体不收');
ok(!EGL.util.checkInputAnswer('', ['a']), '空输入判错');
ok(EGL.util.checkInputAnswer('HAS BEEN RUNNING', ['has been running']), '多词+大写');
ok(EGL.util.checkInputAnswer("could not", ["couldn't"]), "couldn't/could not");
ok(EGL.util.checkInputAnswer('He was working', ['was working']) === false, '多余词判错');
ok(EGL.util.checkInputAnswer("can't", ['cannot']) ? true : true, "can't 处理不抛错");

// ---- 等级映射 ----
console.log('[3] 等级映射');
ok(EGL.u.gradeOf(12, 12).g === 'S', '12/12 → S');
ok(EGL.u.gradeOf(11, 12).g === 'A+', '11/12 → A+');
ok(EGL.u.gradeOf(10, 12).g === 'A', '10/12 → A');
ok(EGL.u.gradeOf(9, 12).g === 'B+', '9/12 → B+');
ok(EGL.u.gradeOf(8, 12).g === 'B', '8/12 → B');
ok(EGL.u.gradeOf(7, 12).g === 'C' && EGL.u.gradeOf(6, 12).g === 'C', '6-7/12 → C');
ok(EGL.u.gradeOf(5, 12).g === 'D', '5/12 → D');

// ---- 每专题结构抽查（与浏览器端一致的重复校验） ----
console.log('[4] 结构抽查（与 validate/check.js 相同口径的关键项）');
const ERR_TYPES = ['TIME_SIGNAL_ERROR','CONTEXT_ERROR','TENSE_CONFUSION','VOICE_ERROR','SUBJECT_VERB_AGREEMENT','VERB_FORM_ERROR','SPELLING_ERROR','WORD_FORM_ERROR','PREPOSITION_ERROR','ARTICLE_ERROR','PRONOUN_ERROR','CONJUNCTION_ERROR','CLAUSE_ERROR','COLLOCATION_ERROR'];
Object.keys(sb.window.__GRAMMAR_LAB__).forEach(k => {
  const t = sb.window.__GRAMMAR_LAB__[k];
  if (/^tense\d\d$/.test(k)) {
    ok(t.questions && t.questions.length === 12, `${k}: 12 题`);
    const qs = t.questions;
    for (let i = 0; i < 6; i++) {
      ok(qs[i].type === 'choice' && qs[i].options && qs[i].options.length === 6, `${k} q${i + 1}: choice+6选项`);
      ok(qs[i].answerIndex >= 0 && qs[i].answerIndex < 6, `${k} q${i + 1}: answerIndex 有效`);
    }
    for (let i = 6; i < 12; i++) {
      ok(qs[i].type === 'input' && qs[i].hint && qs[i].accepted && qs[i].accepted.length >= 1, `${k} q${i + 1}: input+hint+accepted`);
    }
    ok(t.pool && t.pool.length === 6, `${k}: pool 6 题`);
    ok(t.review5 && t.review5.length === 5, `${k}: review5 5条`);
    ok(t.knowledgeCard && t.knowledgeCard.memory, `${k}: knowledgeCard.memory`);
    // 句子字数下限
    let minW = 999;
    qs.concat(t.pool || []).forEach(q => {
      const wc = (q.question.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
      if (wc < minW) minW = wc;
      ok((q.question.match(/______/g) || []).length === 1, `${k} ${q.id}: 恰一个空`);
      ok(ERR_TYPES.indexOf(q.wrongType) >= 0, `${k} ${q.id}: wrongType 合法`);
      ok(q.explanation && q.explanation.chain && q.explanation.cue && q.explanation.why, `${k} ${q.id}: 解析核心字段`);
      // 检验正确答案与 accepted/answerIndex 一致性
      if (q.type === 'choice') {
        const opt = q.options[q.answerIndex];
        ok(!!opt, `${k} ${q.id}: 答案项非空`);
      } else {
        ok(q.answerText && q.answerText.length >= 1, `${k} ${q.id}: answerText`);
      }
    });
    ok(minW >= 8, `${k}: 最短句 ${minW} 词`);
  }
  if (k === 'challenge') {
    const qs = t.questions || [];
    ok(qs.length === 20, 'challenge: 20 题');
    ok(qs.slice(0, 10).every(q => q.type === 'choice' && q.options.length === 6), 'challenge: 前10为六选一');
    ok(qs.slice(10).every(q => q.type === 'input' && q.hint), 'challenge: 后10为输入题');
  }
});

// ---- 推荐/薄弱点核心函数不崩 ----
console.log('[5] 分析函数');
ok(typeof EGL.overallStats() === 'object', 'overallStats 可运行');
ok(Array.isArray(EGL.availableTopicIds()) && EGL.availableTopicIds().length === 12, 'availableTopicIds=12');
const rec = EGL.recommendNext();
ok(rec && rec.type, 'recommendNext 返回推荐');

// ---- 课程体系（大专题） ----
console.log('[6] 课程体系（curriculum/method）');
const cur = sb.window.__EGL_CURRICULUM__;
ok(cur && cur.categories.length === 11, '大专题 11 个');
ok(cur && !cur.grades && typeof cur.gradeDef === 'undefined', '专题体系不再按年级分类');
ok(sb.window.__EGL_METHOD_COURSE__ && sb.window.__EGL_METHOD_COURSE__.steps.length === 5, '解题方法课 5 步');
ok(EGL.catOfTopicId('tense06') === 'verb', 'tense06 → 谓语动词');
ok(EGL.catOfTopicId('ai:nonfinite') === 'nonfinite', 'ai:nonfinite → 非谓语');
ok(typeof EGL.categoryStats() === 'object' && Array.isArray(EGL.categoryStats()), 'categoryStats 可运行');

// ---- AI 引擎（无网络，仅逻辑层） ----
console.log('[7] AI 逻辑层（prompt/JSON/校验/转换）');
ok(typeof EGL.ai === 'object', 'EGL.ai 存在');
const cfg = { topicId: 'nonfinite', count: 10, apiKey: 'sk-x' };
const prompt = EGL.ai.buildPrompt(cfg);
ok(typeof prompt === 'string' && prompt.indexOf('非谓语动词') >= 0 && prompt.indexOf('高一') < 0, 'buildPrompt 只含专题、不再含年级');
ok(prompt.indexOf('____') >= 0 && prompt.toLowerCase().indexOf('json') >= 0, 'buildPrompt 含空标规则与 JSON 输出约束');
const goodJSON = JSON.stringify({
  papers: [{ title: 'T', passage: 'Tom ____ (work) hard. ____ he plays a lot.', blanks: [
    { answer: 'works', givenWord: 'work', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '三单加s', difficulty: 1 },
    { answer: 'Though', givenWord: null, isGivenWord: false, type: 'conjunction', knowledgePoint: '让步连词', category: '并列与逻辑', explanation: '句意让步', difficulty: 1 }
  ] }]
});
const parsed = EGL.ai.extractJSON(goodJSON);
ok(parsed && parsed.papers, 'extractJSON 正常');
const fenced = '```json\n' + goodJSON + '\n```';
ok(EGL.ai.extractJSON(fenced).papers, 'extractJSON 去代码块');
ok(EGL.ai.extractJSON('说明文字 ' + goodJSON + ' 结尾文字').papers, 'extractJSON 提取主体');
const cfgSmall = { topicId: 'nonfinite', count: 2, apiKey: 'sk-x' };
const badRaw = EGL.ai.validateAndNormalize(parsed, cfgSmall);
ok(badRaw && badRaw.length >= 1, 'validateAndNormalize 通过样例');
let threw = false;
try { EGL.ai.validateAndNormalize({ papers: [] }, cfgSmall); } catch (e) { threw = true; }
ok(threw, '空语篇被拦截');
let threw2 = false;
try { EGL.ai.validateAndNormalize(parsed, cfg); } catch (e) { threw2 = true; } // count=10 但仅 2 空
ok(threw2, '数量远小于请求被拦截');
const qs = EGL.ai.papersToQuestions(badRaw, cfgSmall);
ok(qs.length === 2, '两空转换 2 条 input 题');
ok(qs[0].isAI === true && qs[0].source === 'ai' && qs[0].aiCtx && qs[0].aiCtx.passage, '转换题带 AI 来源/语篇上下文');
ok(Array.isArray(qs[0].accepted) && qs[0].accepted.length === 1, 'accepted 就位');
ok(qs[0].explanation && qs[0].explanation.why, '解析字段就位');

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
