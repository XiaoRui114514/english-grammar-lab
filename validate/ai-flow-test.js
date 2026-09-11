#!/usr/bin/env node
/* ============================================================
 * validate/ai-flow-test.js — AI 出题流程测试（网络用 stub 模拟）
 * 覆盖 §83 场景：Key缺失/无效、网络失败、JSON异常、记住/清除 Key、
 * 批量编排（每篇10空拆分）、转换后进入做题结构
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function makeEnv(fetchImpl) {
  const store = {};
  const ss = {};
  const sb = {
    console, Promise, setTimeout, clearTimeout,
    fetch: fetchImpl,
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    },
    sessionStorage: {
      getItem: k => (k in ss ? ss[k] : null),
      setItem: (k, v) => { ss[k] = String(v); },
      removeItem: k => { delete ss[k]; }
    }
  };
  sb.window = sb;
  sb.globalThis = sb;
  return { sb, store, ss };
}
function run(sb, file) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/^\uFEFF/, '');
  vm.createContext(sb);
  vm.runInContext(code, sb, { filename: file });
}
function loadAI(fetchImpl) {
  const env = makeEnv(fetchImpl);
  run(env.sb, 'src/core.js');
  run(env.sb, 'src/ui-helpers.js');
  run(env.sb, 'data/roadmap.js');
  run(env.sb, 'data/curriculum.js');
  run(env.sb, 'src/ai.js');
  return { E: env.sb.EGL, store: env.store, ss: env.ss, sb: env.sb };
}

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } }

const http = status => ({ ok: false, status, json: () => Promise.resolve({}) });
const chat = content => ({ ok: true, status: 200, json: () => Promise.resolve({ choices: [{ message: { content } }] }) });
const SAMPLE = JSON.stringify({
  papers: [{ title: 'A Day', passage: 'Tom ____ hard every day. ____ he also reads.',
    blanks: [
      { answer: 'works', givenWord: 'work', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '三单加s', difficulty: 1 },
      { answer: 'Although', givenWord: null, isGivenWord: false, type: 'conjunction', knowledgePoint: '让步连词', category: '并列与逻辑', explanation: '虽然…但', difficulty: 1 },
      { answer: 'the', givenWord: null, isGivenWord: false, type: 'article', knowledgePoint: '冠词', category: '冠词', explanation: '特指', difficulty: 1 },
      { answer: 'happily', givenWord: 'happy', isGivenWord: true, type: 'wordform', knowledgePoint: 'adj→adv', category: '词性转换', explanation: '修饰动词用副词', difficulty: 1 }
    ] }]
});

async function main() {
  console.log('[ai] 场景6-8/11：Key 缺失 / 无效 / 网络失败 / 记住与清除');
  {
    let hit = false;
    const env = makeEnv(async () => { hit = true; return chat(SAMPLE); });
    run(env.sb, 'src/core.js'); run(env.sb, 'src/ui-helpers.js'); run(env.sb, 'src/ai.js');
    const E = env.sb.EGL;
    try {
      await E.ai.callDeepSeek('prompt', { apiKey: '', reasoning: 'low' });
      ok(false, '空 Key 应被拦截');
    } catch (e) {
      ok(!hit, '空 Key 未发起请求');
      ok(/API Key/.test(e.msg), '提示输入 Key');
    }
  }
  {
    const env = makeEnv(async () => http(401));
    run(env.sb, 'src/core.js'); run(env.sb, 'src/ui-helpers.js'); run(env.sb, 'src/ai.js');
    try { await env.sb.EGL.ai.callDeepSeek('p', { apiKey: 'sk-bad' }); ok(false, '401 应报错'); }
    catch (e) { ok(e.code === 'BAD_KEY', '401 → Key 无效提示'); }
  }
  {
    const env = makeEnv(async () => { throw new Error('boom'); });
    run(env.sb, 'src/core.js'); run(env.sb, 'src/ui-helpers.js'); run(env.sb, 'src/ai.js');
    try { await env.sb.EGL.ai.callDeepSeek('p', { apiKey: 'sk-x' }); ok(false, '网络错误应报错'); }
    catch (e) { ok(e.code === 'NET', '网络失败 → 友好提示'); }
  }
  {
    const env = makeEnv(async () => http(429));
    run(env.sb, 'src/core.js'); run(env.sb, 'src/ui-helpers.js'); run(env.sb, 'src/ai.js');
    try { await env.sb.EGL.ai.callDeepSeek('p', { apiKey: 'sk-x' }); } catch (e) { ok(e.code === 'RATE', '429 → 限流提示'); }
  }
  {
    const env = makeEnv(async () => chat('```json\n' + SAMPLE + '\n```'));
    run(env.sb, 'src/core.js'); run(env.sb, 'src/ui-helpers.js');
    run(env.sb, 'data/roadmap.js'); run(env.sb, 'data/curriculum.js');
    run(env.sb, 'src/ai.js');
    const E = env.sb.EGL;
    // Key 记住/清除
    E.ai.saveKey('sk-secret', true);
    ok(env.store['EGL_AI_KEY_v1'] === 'sk-secret', '勾选记住 → 存入 localStorage');
    E.ai.clearKey();
    ok(!env.store['EGL_AI_KEY_v1'], '清除 Key → localStorage 移除');
    // 真实调用（stub 返回 fenced JSON）
    E.ai.saveKey('sk-x', false);
    const text = await E.ai.callDeepSeek('hi', { apiKey: 'sk-x', reasoning: 'low' });
    const raw = E.ai.extractJSON(text);
    ok(raw && raw.papers && raw.papers.length === 1, '去代码块解析成功');
    const papers = E.ai.validateAndNormalize(raw, { count: 4 });
    ok(papers.length === 1 && papers[0].blanks.length === 4, '校验/规范化 4 空');
    const qs = E.ai.papersToQuestions(papers, { gradeKey: 'g1', gradeName: '高一', stage: '1', topicId: 'verb', count: 4 });
    ok(qs.length === 4, '4 空 → 4 条 input 题（进入原做题界面结构）');
    ok(qs.every(q => q.isAI && q.source === 'ai'), '全部标记 AI 来源');
    ok(qs.some(q => q.aiCtx && q.aiCtx.passage.indexOf('Tom') >= 0), '语篇上下文保留');
    ok(qs.every(q => q.accepted.length >= 1 && q.explanation.why), '每题 accepted+解析就位');

    // n 选 1 点选（qtype=choice）：AI 可给 3~6 个选项，正确项必须在内
    const rawC = { papers: [{ title: 'Choice Test', passage: 'Tom ____ hard every day.',
      blanks: [
        { answer: 'works', givenWord: 'work', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '三单加s', difficulty: 1,
          options: ['works', 'work', 'worked', 'working', 'is working', 'has worked'] },
        { answer: 'Although', givenWord: null, isGivenWord: false, type: 'conjunction', knowledgePoint: '让步连词', category: '并列与逻辑', explanation: '虽然…但', difficulty: 1,
          options: ['Although', 'But', 'Because', 'If', 'So', 'Unless'] },
        { answer: 'the', givenWord: null, isGivenWord: false, type: 'article', knowledgePoint: '冠词', category: '冠词', explanation: '特指', difficulty: 1,
          options: ['the', 'a', 'an', 'this', 'that'] }
      ] }] };
    const pC = E.ai.validateAndNormalize(rawC, { count: 3 });
    ok(pC[0].blanks.every(b => Array.isArray(b.options) && b.options.length >= 2
      && b.options.some(o => o.toLowerCase() === b.answer)), '选择题：options 保留且含正确项');
    const qC = E.ai.papersToQuestions(pC, { gradeKey: 'g1', gradeName: '高一', stage: '1', topicId: 'all', count: 3, qtype: 'choice' });
    ok(qC.length === 3 && qC.every(q => q.type === 'choice'), 'qtype=choice → 全部转选择题');
    ok(qC.every(q => q.options && q.options.length >= 2 && q.options.length <= 6), '选项个数 2~6（n 选 1）');
    ok(qC.every(q => q.answerIndex >= 0 && String(q.options[q.answerIndex]).toLowerCase() === q.accepted[0].toLowerCase()), 'answerIndex 指向正确项');
    ok(qC.every(q => q.hint === ''), '选择题题干不附加打字用提示');
    const qI = E.ai.papersToQuestions(pC, { gradeKey: 'g1', count: 3, qtype: 'input' });
    ok(qI.length === 3 && qI.every(q => q.type === 'input' && q.accepted.length >= 1), 'qtype=input → 仍为填空输入（原流程保留）');

    // 兜底：AI 把答案写进正文（无下划线）→ 自动重建空位
    const rawNoMark = { papers: [{ title: 'NoMark', passage: 'Tom works hard. Although he is tired he keeps going.',
      blanks: [
        { answer: 'works', givenWord: 'work', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '三单', difficulty: 1 },
        { answer: 'Although', givenWord: null, isGivenWord: false, type: 'conjunction', knowledgePoint: '让步', category: '并列与逻辑', explanation: '让步', difficulty: 1 }
      ] }] };
    const pNM = E.ai.validateAndNormalize(rawNoMark, { count: 2 });
    ok(pNM[0].passage.indexOf('______') >= 0, '无空标正文 → 自动重建空位下划线');
    const qNM = E.ai.papersToQuestions(pNM, { gradeKey: 'g1', count: 2, qtype: 'choice' });
    ok(qNM.length === 2 && qNM.every(q => String(q.question).indexOf('______') >= 0), '重建后每空题干含下划线');
    ok(qNM[0].question.indexOf('Although') < 0, '题干只取所在句，不会卷进后文（修复第一题混乱）');

    // 单句 + 语篇 混合结构（仿上海高一作业：几个句子 + 一篇文章）
    const rawMix = { grade: '高一',
      sentences: [{ sentence: 'I ____ (teach) Italian these days.', blanks: [
        { answer: 'am teaching', givenWord: 'teach', isGivenWord: true, type: 'tense', knowledgePoint: '现在进行时', category: '谓语动词', explanation: 'these days 提示现在进行', difficulty: 1,
          options: ['am teaching', 'was teaching', 'taught', 'teach', 'will teach'] } ] }],
      papers: [{ title: 'Trees', passage: 'Trees ____ (grow) slowly.', blanks: [
        { answer: 'grow', givenWord: 'grow', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '客观规律', difficulty: 1,
          options: ['grow', 'grew', 'are growing', 'have grown', 'will grow'] } ] }]
    };
    const secMix = E.ai.validateAndNormalize(rawMix, { count: 2, structure: 'mixed' });
    ok(secMix.length === 2 && secMix[0].kind === 'sentence' && secMix[1].kind === 'passage', '混合结构：单句+语篇 两段');
    const qMix = E.ai.papersToQuestions(secMix, { gradeKey: 'g1', gradeName: '高一', count: 2, structure: 'mixed', qtype: 'choice' });
    ok(qMix.length === 2 && qMix[0].aiCtx && qMix[0].aiCtx.kind === 'sentence' && qMix[1].aiCtx && qMix[1].aiCtx.kind === 'passage', '单句/语篇 均标记 kind');
    ok(String(qMix[0].question).indexOf('______') >= 0 && qMix[0].question.indexOf('these days') >= 0, '单句题干含空与时间状语语境');
    ok(qMix[0].type === 'choice' && qMix[0].optionCount === undefined, '单句为点选选择题');
    ok(((String(qMix[0].question).match(/\(teach\)/g) || []).length === 1), '单句题干仅保留一份提示词（不重复）');

    // 一句两空 → 两句（各自一空、blankN 1/2），可两排选项
    const raw2 = { grade: '高一', sentences: [{ sentence: 'I ____ (be) a teacher, but I ____ (teach) Italian these days.', blanks: [
      { answer: 'am', givenWord: 'be', isGivenWord: true, type: 'tense', knowledgePoint: '一般现在时', category: '谓语动词', explanation: '主语 I 用 am', difficulty: 1, options: ['am', 'is', 'are', 'was', 'be'] },
      { answer: 'am teaching', givenWord: 'teach', isGivenWord: true, type: 'tense', knowledgePoint: '现在进行时', category: '谓语动词', explanation: 'these days 提示现在进行', difficulty: 1, options: ['am teaching', 'was teaching', 'taught', 'teach', 'will teach'] } ] }] };
    const sec2 = E.ai.validateAndNormalize(raw2, { count: 2, structure: 'sentence' });
    ok(sec2.length === 1 && sec2[0].kind === 'sentence' && sec2[0].blanks.length === 2, '一句两空被识别');
    const q2 = E.ai.papersToQuestions(sec2, { gradeKey: 'g1', count: 2, structure: 'sentence', qtype: 'choice' });
    ok(q2.length === 2 && q2[0].aiCtx.blankN === 1 && q2[1].aiCtx.blankN === 2, '一句两空 → 两个空（第1空/第2空）');

    // 缓存
    E.ai.cacheSession({ questions: qs, meta: { title: 't' } });
    ok(E.ai.readCachedSession() && E.ai.readCachedSession().questions.length === 4, 'sessionStorage 缓存可用');
    // AI 出题记录池：生成完成即持久保存（未做完也能找回）；可删除/清空；不存 API Key
    const cfgFull = { gradeKey: 'g1', gradeName: '高一', stage: '1', topicId: 'verb', count: 4, apiKey: 'sk-x', rememberKey: true, reasoning: 'low' };
    E.ai.pushToPool(papers, qs, cfgFull, { title: 'AI · 高一 · 测试', gradeName: '高一' });
    let pool = E.ai.getPool();
    ok(pool.length === 1, '生成记录写入池（1 条）');
    ok(pool[0].questions && pool[0].questions.length === 4, '记录保留题目（可继续/重做）');
    ok(!(JSON.stringify(pool[0]).indexOf('sk-x') >= 0), '记录中不保存 API Key');
    ok(pool[0].cfg && !pool[0].cfg.apiKey, 'cfg 已脱敏');
    const id = pool[0].id;
    E.ai.pushToPool(papers, qs, cfgFull, { title: '第二组' });
    pool = E.ai.getPool();
    ok(pool.length === 2, '第二组入池');
    E.ai.removeFromPool(id);
    pool = E.ai.getPool();
    ok(pool.length === 1 && pool[0].meta.title === '第二组', '按 id 删除生效');
    E.ai.clearPool();
    ok(E.ai.getPool().length === 0, '清空池生效');
  }
  {
    // JSON 异常
    const env = makeEnv(async () => chat('抱歉，我无法生成'));
    run(env.sb, 'src/core.js'); run(env.sb, 'src/ui-helpers.js'); run(env.sb, 'src/ai.js');
    const E = env.sb.EGL;
    const text = await E.ai.callDeepSeek('p', { apiKey: 'sk-x' });
    try { E.ai.extractJSON(text); ok(false, '垃圾输出应抛错'); }
    catch (e) { ok(/JSON|解析|失败/.test(e.msg), 'JSON 异常 → 明确提示'); }
  }

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('测试崩溃:', e); process.exit(1); });
