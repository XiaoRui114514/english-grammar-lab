/* ============================================================
 * core.js — 上海初高语法填空 核心引擎
 * 数据 / 存储 / 答题判定 / 分析 / 推荐 / 错题本
 * 全部逻辑挂在 window.EGL 命名空间，由 ui.js 调用。
 * 题库注册表：window.__GRAMMAR_LAB__ （data/*.js 写入）
 * 路线图：window.__GRAMMAR_LAB_ROADMAP__
 * ============================================================ */
(function () {
  'use strict';
  window.EGL = window.EGL || {};

  var LS_KEY = 'EGL_LAB_DATA_v1';
  var DATA_VERSION = 3;
  /* 错题复习排期：刚错的当天到期；之后每答对一次，到期日往后推 1/2/4/7/15 天；
     连续答对 5 次算掌握（不再进今日复习队列，但仍留在错题本里）。 */
  var SRS_STEPS = [1, 2, 4, 7, 15];

  /* ---------- 工具 ---------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function dayKey(ts) {
    var d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function startOfDay(ts) {
    var d = new Date(ts || Date.now());
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  function addDays(ts, n) {
    var d = new Date(ts || Date.now());
    d.setDate(d.getDate() + n);
    return d.getTime();
  }
  function nowTs() { return Date.now(); }
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // 作者隐形指纹（brand.js 提供；缺失时原样返回，不影响任何逻辑）
  function markText(s) {
    var b = window.EGL_BRAND || (window.EGL && window.EGL.brand);
    return (b && b.mark) ? b.mark(s) : s;
  }

  /* ---------- 答案归一化 ---------- */
  function normalizeAnswer(s) {
    if (s == null) return '';
    s = String(s)
      .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:。，！？；：]+$/, '');
    // 先处理特殊整体缩写，再做通用词尾展开，便于 "hasn't finished" == "has not finished"
    var special = {
      "won't": 'will not', "can't": 'cannot', "shan't": 'shall not', 'cannot': 'can not',
      "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
      "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
      "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not',
      "couldn't": 'could not', "shouldn't": 'should not', "wouldn't": 'would not',
      "mustn't": 'must not', "needn't": 'need not'
    };
    s = s.replace(/\b(?:won't|shan't|can't|cannot|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|couldn't|shouldn't|wouldn't|mustn't|needn't)\b/g,
      function (w) { return special[w] || w; })
      .replace(/'ve\b/g, ' have')
      .replace(/'ll\b/g, ' will')
      .replace(/'re\b/g, ' are')
      .replace(/'m\b/g, ' am')
      .replace(/n't\b/g, ' not')
      .replace(/\s+/g, ' ')
      .trim();
    return s;
  }
  function stripApostrophes(s) { return s.replace(/'/g, ''); }

  function checkInputAnswer(userInput, accepted) {
    var u = normalizeAnswer(userInput);
    if (!u) return false;
    var plainU = stripApostrophes(u);
    var i, a, plainA;
    for (i = 0; i < (accepted || []).length; i++) {
      a = normalizeAnswer(accepted[i]);
      if (!a) continue;
      if (a === u) return true;
      plainA = stripApostrophes(a);
      if (plainA === plainU) return true;
      if (a.replace(/ /g, '') === u.replace(/ /g, '')) return true;
      if (plainA.replace(/ /g, '') === plainU.replace(/ /g, '')) return true;
    }
    return false;
  }

  /* ---------- 默认数据 ---------- */
  function emptyData() {
    return {
      version: DATA_VERSION,
      global: { answered: 0, correct: 0 },
      topics: {},
      tags: {},
      errorTypes: {},
      wrongBook: [],
      sessions: [],
      daily: {},
      usedPool: {},
      challengeUnlocked: {},
      lastStudyAt: 0,
      createdAt: nowTs(),
      goal: 12,                                     // 每日目标题量（设置页可改）
      agg: {                                        // 答题画像（v3 新增）
        byType: { choice: { a: 0, c: 0 }, input: { a: 0, c: 0 } },
        byDiff: {},
        timeSum: 0, timeCount: 0
      },
      custom: null                                  // 最近一次「我的专卷」
    };
  }

  /* 老错题补齐 v3 字段（不丢原数据，只补默认值） */
  function normalizeWrongEntry(w) {
    if (!w || typeof w !== 'object') return w;
    if (!w.times) w.times = 1;
    if (typeof w.stage !== 'number') w.stage = 0;
    if (typeof w.mastered !== 'boolean') w.mastered = false;
    if (!w.dueAt && !w.mastered) w.dueAt = nowTs();   // 老错题：立刻排进今日复习（已掌握的不再排期）
    if (!w.notes) w.notes = '';
    if (!w.catId) w.catId = catOfTopicId(w.topicId || '');
    if (!('snapshot' in w)) w.snapshot = null;
    return w;
  }
  function ensureDataShape(d) {
    if (!d.global) d.global = { answered: 0, correct: 0 };
    if (!d.topics) d.topics = {};
    if (!d.tags) d.tags = {};
    if (!d.errorTypes) d.errorTypes = {};
    if (!Array.isArray(d.wrongBook)) d.wrongBook = [];
    if (!Array.isArray(d.sessions)) d.sessions = [];
    if (!d.daily) d.daily = {};
    if (!d.usedPool) d.usedPool = {};
    if (!d.challengeUnlocked) d.challengeUnlocked = {};
    if (typeof d.goal !== 'number' || !(d.goal >= 1)) d.goal = 12;
    if (!d.agg || typeof d.agg !== 'object') {
      d.agg = { byType: { choice: { a: 0, c: 0 }, input: { a: 0, c: 0 } }, byDiff: {}, timeSum: 0, timeCount: 0 };
    }
    if (!d.agg.byType) d.agg.byType = { choice: { a: 0, c: 0 }, input: { a: 0, c: 0 } };
    if (!d.agg.byType.choice) d.agg.byType.choice = { a: 0, c: 0 };
    if (!d.agg.byType.input) d.agg.byType.input = { a: 0, c: 0 };
    if (!d.agg.byDiff) d.agg.byDiff = {};
    if (typeof d.agg.timeSum !== 'number') d.agg.timeSum = 0;
    if (typeof d.agg.timeCount !== 'number') d.agg.timeCount = 0;
    if (!('custom' in d)) d.custom = null;
    d.wrongBook.forEach(normalizeWrongEntry);
    return d;
  }
  /* v1 / v2 → v3：只补字段，不删任何历史记录 */
  function migrateData(d) {
    if (!d || typeof d !== 'object') return null;
    if (d.version !== 1 && d.version !== 2 && d.version !== 3) return null;
    ensureDataShape(d);
    d.version = DATA_VERSION;
    return d;
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return emptyData();
      var d = migrateData(JSON.parse(raw));
      return d || emptyData();
    } catch (e) {
      try { localStorage.removeItem(LS_KEY); } catch (e2) {}
      return emptyData();
    }
  }
  var data = loadData();
  var saveListener = null;
  // 回调和返回值均报告是否成功，失败时保留内存数据，供用户导出或重试。
  function save() {
    var saved = false;
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); saved = true; } catch (e) {}
    if (typeof saveListener === 'function') {
      try { saveListener(saved); } catch (e2) {}
    }
    return saved;
  }
  function setSaveListener(fn) { saveListener = fn; }

  /* ---------- 题库注册表 ---------- */
  function bank() { return window.__GRAMMAR_LAB__ || window.GRAMMAR_BANK || {}; }
  function roadmap() { return window.__GRAMMAR_LAB_ROADMAP__ || window.GRAMMAR_ROADMAP || null; }

  function topicMeta(no) {
    var r = roadmap();
    if (!r) return null;
    for (var i = 0; i < r.topics.length; i++) if (r.topics[i].no === no) return r.topics[i];
    return null;
  }
  // 可用（有题库）的专题 id 列表，按序号排序
  function availableTopicIds() {
    var keys = Object.keys(bank()).filter(function (k) {
      return /^tense\d\d$/.test(k) && bank()[k].questions && bank()[k].questions.length;
    });
    keys.sort();
    return keys;
  }
  function isChallengeAvailable() { return !!(bank().challenge && bank().challenge.questions); }

  /* ---------- 专题统计 ---------- */
  function topicStat(tid) {
    if (!data.topics[tid]) {
      data.topics[tid] = { attempts: 0, correct: 0, runs: 0, lastCorrect: 0, lastTotal: 0, lastMode: '', finished: false, bestRunPct: 0, lastAt: 0 };
    }
    return data.topics[tid];
  }
  // 核心12题整体正确率
  function topicAccuracy(tid) {
    var s = topicStat(tid);
    return s.attempts === 0 ? null : (s.correct / s.attempts);
  }
  function topicStatus(tid) {
    var s = topicStat(tid);
    if (s.attempts === 0) return 'none';
    var acc = s.correct / s.attempts;
    if (acc >= 0.9 && s.finished) return 'master';
    if (acc >= 0.7) return 'learning';
    return 'weak';
  }
  // 只统计“核心整轮”（kind = normal|blind，total>=12）；drill/retrain/challenge 不计入专题主正确率
  function updateTopicStat(tid, correctCount, totalCount, mode) {
    var s = topicStat(tid);
    var isCoreRun = (mode === 'normal' || mode === 'blind') && totalCount >= 10;
    if (isCoreRun) {
      s.attempts += totalCount;
      s.correct += correctCount;
      s.runs++;
      s.lastCorrect = correctCount;
      s.lastTotal = totalCount;
      s.lastMode = mode;
      s.lastAt = nowTs();
      if (totalCount >= 12) s.finished = true;
      var runAcc = correctCount / totalCount;
      if (runAcc > s.bestRunPct) s.bestRunPct = runAcc;
      var acc = s.correct / s.attempts;
      if (acc >= 0.9 && s.finished) data.challengeUnlocked[tid] = true;
    }
    data.lastStudyAt = nowTs();
    save();
  }
  // 答对是否解锁挑战（≥90% 且完成过整轮）
  function isChallengeUnlocked(tid) {
    if (data.challengeUnlocked[tid]) return true;
    var s = topicStat(tid);
    return !!s.finished && s.bestRunPct >= 0.9;
  }

  // 全局计数（任何作答都计入）
  function addGlobal(correct, total) {
    data.global.answered += total;
    data.global.correct += correct;
    save();
  }

  // 记录单题到 tag 统计
  function recordTag(topicId, tag, correct) {
    var key = topicId + '|' + tag;
    if (!data.tags[key]) data.tags[key] = { attempts: 0, correct: 0, streakWrong: 0, lastWrong: false };
    var t = data.tags[key];
    t.attempts++;
    if (correct) { t.correct++; t.streakWrong = 0; t.lastWrong = false; }
    else { t.streakWrong++; t.lastWrong = true; }
    save();
    return t;
  }
  function tagAccuracy(topicId, tag) {
    var key = topicId + '|' + tag;
    var t = data.tags[key];
    return t ? (t.attempts ? t.correct / t.attempts : null) : null;
  }

  /* ---------- 大专题(curriculum) 能力统计 ----------
   * 题源 tag 的 topicId 可能是 'tense01'（原题库）或 'ai:<大专题id>'（AI 题），
   * 统一归入大专题统计，供"我的语法填空能力总览"使用。
   */
  function catOfTopicId(topicId) {
    if (!topicId) return 'verb';
    if (topicId.indexOf('ai:') === 0) return topicId.slice(3);
    if (topicId.indexOf('paper:') === 0) return topicId.slice(6);
    if (topicId === 'challenge') return 'verb';
    var no = String(topicId).replace(/^tense/, '');
    var cur = window.__EGL_CURRICULUM__;
    if (cur && cur.catByTopicNo) {
      var c = cur.catByTopicNo(no);
      if (c) return c;
    }
    // 兜底：无归类时并入"其他/拓展"
    return 'extra';
  }
  function categoryName(catId) {
    var cur = window.__EGL_CURRICULUM__;
    if (cur && cur.category) {
      var c = cur.category(catId);
      if (c) return c;
    }
    return { name: catId, icon: '' };
  }
  // 聚合：data.tags 按 大专题 汇总（含题库与 AI 题）
  function categoryStats() {
    var map = {};
    Object.keys(data.tags).forEach(function (key) {
      var p = key.indexOf('|');
      if (p < 0) return;
      var cat = catOfTopicId(key.slice(0, p));
      if (!map[cat]) map[cat] = { attempts: 0, correct: 0 };
      var t = data.tags[key];
      map[cat].attempts += t.attempts;
      map[cat].correct += t.correct;
    });
    var out = [];
    Object.keys(map).forEach(function (cat) {
      var c = map[cat];
      var meta = categoryName(cat);
    out.push({ catId: cat, name: meta.name, icon: meta.icon, color: meta.color || 'var(--ink-faint)',
                 attempts: c.attempts, correct: c.correct,
                 pct: c.attempts ? c.correct / c.attempts : null });
    });
    out.sort(function (a, b) { return (a.pct === null ? 1 : a.pct) - (b.pct === null ? 1 : b.pct); });
    return out;
  }

  /* ---------- 错题本 ---------- */
  function findWrongEntry(qid) {
    for (var i = 0; i < data.wrongBook.length; i++) {
      if (data.wrongBook[i].qid === qid) return { idx: i, entry: data.wrongBook[i] };
    }
    return null;
  }
  /* 题目快照：AI 题 / 组卷题离开原上下文后仍能复习或重做 */
  function snapshotQuestion(q) {
    if (!q) return null;
    q = q || {};
    return {
      type: q.type === 'choice' ? 'choice' : 'input',
      question: q.question || '',
      hint: q.hint || '',
      accepted: (q.accepted || []).slice(0, 8),
      options: q.options ? q.options.slice(0, 8) : null,
      answerIndex: (typeof q.answerIndex === 'number') ? q.answerIndex : null,
      answerText: q.answerText || '',
      tag: q.tag || '',
      wrongType: q.wrongType || '',
      difficulty: q.difficulty || 3,
      catId: (q.aiMeta && q.aiMeta.catId) || '',
      catName: (q.aiMeta && q.aiMeta.catName) || '',
      knowledgePoint: (q.aiMeta && q.aiMeta.knowledgePoint) || '',
      explanation: q.explanation ? {
        answer: q.explanation.answer || '',
        keyPoint: q.explanation.keyPoint || '',
        clue: q.explanation.clue || '',
        chain: q.explanation.chain || '',
        why: q.explanation.why || '',
        whyOthers: q.explanation.whyOthers || '',
        memory: q.explanation.memory || ''
      } : null
    };
  }
  function addWrong(item) {
    var found = findWrongEntry(item.qid);
    if (found) {
      // 又错了：错误次数累加，并把复习计划打回第一阶（当天再到期）
      found.entry.times = (found.entry.times || 1) + 1;
      found.entry.lastDate = todayStr();
      found.entry.lastAt = nowTs();
      found.entry.myAnswer = item.myAnswer;
      found.entry.stage = 0;
      found.entry.mastered = false;
      found.entry.dueAt = nowTs();
      if (item.snapshot && !found.entry.snapshot) found.entry.snapshot = item.snapshot;
      bumpErrorType(item.wrongType);
      save();
      return found.entry;
    }
    var entry = {
      id: 'wb_' + item.qid,
      topicId: item.topicId,
      topicTitle: item.topicTitle || '',
      qid: item.qid,
      question: markText(item.question),   // 错题记录同样带作者隐形指纹
      tag: item.tag || '',
      kp: item.kp || '',
      myAnswer: item.myAnswer,
      correctAnswer: item.correctAnswer,
      wrongType: item.wrongType || 'VERB_FORM_ERROR',
      source: item.source || 'bank',          // 'bank' | 'paper' | 'ai' | 'review' | 'custom'
      catId: item.catId || catOfTopicId(item.topicId || ''), // 大专题
      times: 1,
      lastDate: todayStr(),
      lastAt: nowTs(),
      // —— v3：复习计划 ——
      stage: 0,              // 0 = 刚错；1..5 = 已连续答对次数
      mastered: false,
      dueAt: nowTs(),        // 当天就排进「今日复习」
      notes: '',             // 我的笔记：我为什么错
      snapshot: item.snapshot || null
    };
    data.wrongBook.unshift(entry);
    if (data.wrongBook.length > 400) data.wrongBook.pop();
    bumpErrorType(item.wrongType);
    save();
    return entry;
  }
  function bumpErrorType(code) { data.errorTypes[code] = (data.errorTypes[code] || 0) + 1; }
  function removeWrong(qid) {
    for (var i = data.wrongBook.length - 1; i >= 0; i--) {
      if (data.wrongBook[i].qid === qid) data.wrongBook.splice(i, 1);
    }
    save();
  }
  function clearWrong() { data.wrongBook = []; save(); }

  /* ---------- 复习计划（间隔重复） ---------- */
  function setWrongNote(qid, note) {
    var f = findWrongEntry(qid);
    if (!f) return null;
    f.entry.notes = String(note || '').slice(0, 500);
    save();
    return f.entry;
  }
  // 复习一题：答对升阶（第 5 次答对 → 掌握），答错回到第一阶、当天再到期
  function reviewWrong(qid, correct, userText) {
    var f = findWrongEntry(qid);
    if (!f) return null;
    var e = f.entry;
    e.lastReviewAt = nowTs();
    if (correct) {
      e.stage = Math.min((e.stage || 0) + 1, SRS_STEPS.length);
      if (e.stage >= SRS_STEPS.length) {
        e.mastered = true;
        e.dueAt = 0;
      } else {
        e.dueAt = addDays(nowTs(), SRS_STEPS[e.stage - 1]);
      }
    } else {
      e.stage = 0;
      e.mastered = false;
      e.dueAt = nowTs();
      e.times = (e.times || 1) + 1;
      e.lastDate = todayStr();
      e.lastAt = nowTs();
      if (userText !== undefined) e.myAnswer = userText;
    }
    save();
    return e;
  }
  function wrongStats() {
    var total = data.wrongBook.length;
    var mastered = 0, due = 0;
    data.wrongBook.forEach(function (w) {
      if (w.mastered) mastered++;
      else if (w.dueAt && w.dueAt <= nowTs()) due++;
    });
    return { total: total, mastered: mastered, due: due, active: total - mastered };
  }
  function dueWrong() {
    var now = nowTs();
    var arr = data.wrongBook.filter(function (w) {
      return !w.mastered && w.dueAt && w.dueAt <= now;
    });
    arr.sort(function (a, b) { return (a.dueAt || 0) - (b.dueAt || 0); });
    return arr;
  }
  /* 把错题记录还原成一道可重做的题：
     1) 有快照用快照（AI 题 / 组卷题 / 真题语篇）
     2) 题库题直接反查
     3) 真题语篇按 qid 里的 paperId 重建
     4) 都不行返回 null（老数据只做"看解析"） */
  function resolveWrongQuestion(w) {
    if (!w) return null;
    var q = null;
    if (w.snapshot && w.snapshot.question) {
      var s = w.snapshot;
      q = {
        id: w.qid,
        source: 'review',
        isReview: true,
        type: s.type === 'choice' ? 'choice' : 'input',
        question: s.question,
        hint: s.hint || '',
        accepted: (s.accepted && s.accepted.length) ? s.accepted : [w.correctAnswer],
        options: s.options || null,
        answerIndex: (typeof s.answerIndex === 'number') ? s.answerIndex : 0,
        answerText: s.answerText || w.correctAnswer,
        tag: s.tag || w.tag || '',
        wrongType: s.wrongType || w.wrongType || '',
        difficulty: s.difficulty || 3,
        aiMeta: { catId: s.catId || w.catId || '', catName: s.catName || catLabelOf(s.catId || w.catId), knowledgePoint: s.knowledgePoint || w.kp || '' },
        explanation: s.explanation || { answer: w.correctAnswer, keyPoint: w.kp || '', why: w.explText || '' }
      };
      if (q.type === 'choice' && (!q.options || q.options.length < 2)) {
        q.type = 'input';
        q.options = null;
      }
      q._reviewTid = w.topicId;
      return q;
    }
    var m = /^paper_(.+)_b(\d+)$/.exec(String(w.qid || ''));
    if (m) {
      var p = paperById(m[1]);
      if (p) {
        var list = paperToQuestions(p);
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === w.qid) { list[i]._reviewTid = w.topicId; return list[i]; }
        }
      }
    }
    var bankQ = findQuestion(w.topicId, w.qid);
    if (bankQ) {
      // 复制一份再挂复习标记：不要污染题库原对象（同一题还会在专题训练里用）
      var copy = {};
      for (var bk in bankQ) if (bankQ.hasOwnProperty(bk)) copy[bk] = bankQ[bk];
      copy._reviewTid = w.topicId;
      copy.aiMeta = {
        catId: w.catId || catOfTopicId(w.topicId || ''),
        catName: catLabelOf(w.catId || catOfTopicId(w.topicId || '')),
        knowledgePoint: w.kp || w.tag || ''
      };
      return copy;
    }
    var pool = (window.EGL && window.EGL.ai && window.EGL.ai.getPool) ? window.EGL.ai.getPool() : [];
    for (var pi = 0; pi < pool.length; pi++) {
      var qs = (pool[pi] && pool[pi].questions) || [];
      for (var qi = 0; qi < qs.length; qi++) {
        if (qs[qi] && qs[qi].id === w.qid) {
          var pq = {};
          for (var pk in qs[qi]) if (qs[qi].hasOwnProperty(pk)) pq[pk] = qs[qi][pk];
          pq._reviewTid = w.topicId;
          return pq;
        }
      }
    }
    return null;
  }
  function reviewQueue(limit) {
    limit = limit || 12;
    var out = [];
    var due = dueWrong();
    for (var i = 0; i < due.length && out.length < limit; i++) {
      var q = resolveWrongQuestion(due[i]);
      if (q) out.push(q);
    }
    return out;
  }

  /* ---------- 每日与总览 ---------- */
  function dailyToday() {
    var t = todayStr();
    if (!data.daily[t]) data.daily[t] = { answered: 0, correct: 0 };
    return data.daily[t];
  }
  function addDaily(correct, total) {
    var d = dailyToday();
    d.answered += total;
    d.correct += correct;
    save();
  }
  /* 每日目标（设置页可改，默认 12 题） */
  function dailyGoal() { return (data.goal >= 1 && data.goal <= 100) ? data.goal : 12; }
  function setGoal(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 100)) return dailyGoal();
    data.goal = n;
    save();
    return data.goal;
  }
  /* 连续学习天数：今天还没做就从昨天开始数（不让"今天还没开始"把记录清零） */
  function streak() {
    var todayK = todayStr();
    var cursor = startOfDay(nowTs());
    var todayDone = !!(data.daily[todayK] && data.daily[todayK].answered > 0);
    if (!todayDone) cursor = addDays(cursor, -1);
    var days = 0;
    for (var guard = 0; guard < 4000; guard++) {
      var k = dayKey(cursor);
      var d = data.daily[k];
      if (d && d.answered > 0) {
        days++;
        cursor = addDays(cursor, -1);
      } else break;
    }
    return { days: days, today: todayDone };
  }
  /* 近 n 天：用于首页小柱图 / 记录页 */
  function weekSeries(n) {
    n = n || 7;
    var out = [];
    var labels = ['日', '一', '二', '三', '四', '五', '六'];
    var base = startOfDay(nowTs());
    for (var i = n - 1; i >= 0; i--) {
      var ts = addDays(base, -i);
      var k = dayKey(ts);
      var d = data.daily[k] || { answered: 0, correct: 0 };
      out.push({ key: k, label: labels[new Date(ts).getDay()], answered: d.answered, correct: d.correct, today: i === 0 });
    }
    return out;
  }
  /* 答题画像：选择/输入、难度分层、平均每题耗时 */
  function noteAgg(type, difficulty, correct, seconds) {
    var a = data.agg;
    var t = type === 'choice' ? 'choice' : 'input';
    if (!a.byType[t]) a.byType[t] = { a: 0, c: 0 };
    a.byType[t].a++;
    if (correct) a.byType[t].c++;
    var d = Math.max(1, Math.min(5, parseInt(difficulty, 10) || 3));
    if (!a.byDiff[d]) a.byDiff[d] = { a: 0, c: 0 };
    a.byDiff[d].a++;
    if (correct) a.byDiff[d].c++;
    var sec = Number(seconds);
    if (sec > 0 && sec < 600) { a.timeSum += sec; a.timeCount++; }
    save();
  }
  function profileStats() {
    var a = data.agg;
    function p(x) { return x && x.a ? x.c / x.a : null; }
    var byDiff = [];
    for (var d = 1; d <= 5; d++) {
      var x = a.byDiff[d];
      byDiff.push({ difficulty: d, attempts: x ? x.a : 0, correct: x ? x.c : 0, pct: p(x) });
    }
    return {
      choice: { attempts: a.byType.choice.a, correct: a.byType.choice.c, pct: p(a.byType.choice) },
      input: { attempts: a.byType.input.a, correct: a.byType.input.c, pct: p(a.byType.input) },
      byDiff: byDiff,
      avgSeconds: a.timeCount ? (a.timeSum / a.timeCount) : null,
      totalAttempts: a.byType.choice.a + a.byType.input.a
    };
  }
  function papersDone() {
    var n = 0;
    papers().forEach(function (p) {
      if (p && p.id && topicStat('paper:' + p.id).attempts > 0) n++;
    });
    return n;
  }
  /* 真题考点频次：8 篇语篇按大专题聚合（哪类考点年年考） */
  function paperFreq() {
    var map = {};
    papers().forEach(function (p) {
      var seen = {};
      (p.blanks || []).forEach(function (b) {
        var cid = b.catId || 'extra';
        if (!map[cid]) map[cid] = { catId: cid, name: catLabelOf(cid), blanks: 0, papers: 0, points: [] };
        map[cid].blanks++;
        if (b.point && map[cid].points.indexOf(b.point) < 0 && map[cid].points.length < 5) map[cid].points.push(b.point);
        if (!seen[cid]) { seen[cid] = 1; map[cid].papers++; }
      });
    });
    var out = [];
    Object.keys(map).forEach(function (k) { out.push(map[k]); });
    out.sort(function (a, b) { return b.blanks - a.blanks; });
    return out;
  }
  function overallStats() {
    var tids = availableTopicIds();
    var finished = 0;
    tids.forEach(function (tid) {
      var s = topicStat(tid);
      if (s.finished && s.attempts >= 12) finished++;
    });
    var ws = wrongStats();
    return {
      answered: data.global.answered,
      correct: data.global.correct,
      pct: data.global.answered ? data.global.correct / data.global.answered : null,
      finished: finished,
      available: tids.length,
      totalPlan: roadmap() ? roadmap().total : 60,
      todayAnswered: dailyToday().answered,
      todayCorrect: dailyToday().correct,
      goal: dailyGoal(),
      streak: streak(),
      week: weekSeries(7),
      due: ws.due,
      wrongTotal: ws.total,
      wrongMastered: ws.mastered,
      papersTotal: availablePaperIds().length,
      papersDone: papersDone()
    };
  }
  function addSession(tid, kind, correct, total, seconds, label) {
    data.sessions.push({ date: todayStr(), topicId: tid, mode: kind, correct: correct, total: total, seconds: seconds, at: nowTs(), label: label || '' });
    if (data.sessions.length > 1000) data.sessions.splice(0, data.sessions.length - 1000);
    save();
  }
  function sessionsOfTopic(tid) {
    return data.sessions.filter(function (s) { return s.topicId === tid; });
  }

  /* ---------- 薄弱点 / 推荐 ---------- */
  function tagList() {
    var out = [];
    Object.keys(data.tags).forEach(function (key) {
      var t = data.tags[key];
      var parts = key.split('|');
      out.push({ topicId: parts[0], tag: parts[1], attempts: t.attempts, correct: t.correct,
                 pct: t.attempts ? t.correct / t.attempts : null, streakWrong: t.streakWrong });
    });
    return out;
  }
  function weakTopics() {
    var tids = availableTopicIds();
    var arr = [];
    tids.forEach(function (tid) {
      var s = topicStat(tid);
      if (s.attempts > 0) {
        arr.push({ id: tid, meta: metaOfTopic(tid), attempts: s.attempts, correct: s.correct,
                   pct: s.correct / s.attempts, finished: s.finished, status: topicStatus(tid) });
      }
    });
    arr.sort(function (a, b) { return a.pct - b.pct; });
    return arr;
  }
  function metaOfTopic(tid) {
    var b = bank();
    if (b[tid]) return b[tid];
    var no = tid.replace('tense', '');
    var m = topicMeta(no);
    if (m) return m;
    return null;
  }
  function nextUnstarted() {
    var tids = availableTopicIds();
    for (var j = 0; j < tids.length; j++) {
      var st = topicStat(tids[j]);
      if (st.attempts === 0) return tids[j];
    }
    return null;
  }
  function recommendNext() {
    var weak = weakTopics();
    for (var i = 0; i < weak.length; i++) {
      if (weak[i].pct < 0.9 && weak[i].attempts >= 6) {
        return { type: 'topic', topicId: weak[i].id, reason: '该专题正确率 ' + Math.round(weak[i].pct * 100) + '%，是目前最需要加强的。' };
      }
    }
    var next = nextUnstarted();
    if (next) return { type: 'topic', topicId: next, reason: '这是你的下一个新专题，按顺序学下去最稳。' };
    if (weak.length) return { type: 'topic', topicId: weak[0].id, reason: '核心专题都练过了，从正确率最低的开始回炉巩固。' };
    return { type: 'challenge', reason: '试试综合挑战，检验真实判断力。' };
  }

  /* ---------- 题库查询 ---------- */
  function topicQuestions(tid) {
    var t = bank()[tid];
    return t ? (t.questions || []) : [];
  }
  function poolQuestions(tid) {
    var t = bank()[tid];
    return t ? (t.pool || []) : [];
  }
  function findQuestion(tid, qid) {
    var list = topicQuestions(tid).concat(poolQuestions(tid));
    for (var i = 0; i < list.length; i++) if (list[i].id === qid) return list[i];
    return null;
  }
  function markPoolUsed(tid, q) {
    if (!data.usedPool[tid]) data.usedPool[tid] = {};
    data.usedPool[tid][q.id] = (data.usedPool[tid][q.id] || 0) + 1;
    save();
  }
  function poolFresh(tid) {
    var used = data.usedPool[tid] || {};
    var pool = poolQuestions(tid);
    var fresh = pool.filter(function (q) { return !used[q.id]; });
    return fresh.length ? fresh : pool;
  }
  // “再练5题”：优先指定 tag（薄弱点）的 pool 新题，不足用该专题其他 pool 新题
  function pickRetrain(tid, tag, count) {
    count = count || 5;
    var fresh = poolFresh(tid);
    var byTag = fresh.filter(function (q) { return q.tag === tag; });
    var rest = fresh.filter(function (q) { return q.tag !== tag; });
    var picked = byTag.slice(0, count);
    var need = count - picked.length;
    if (need > 0) picked = picked.concat(rest.slice(0, need));
    // pool 不足 5 时从核心题里按难度补足
    need = count - picked.length;
    if (need > 0) {
      var core = topicQuestions(tid).filter(function (q) { return q.type === 'input'; });
      core = shuffle(core).slice(0, need);
      picked = picked.concat(core);
    }
    picked.forEach(function (q) { markPoolUsed(tid, q); });
    return picked;
  }
  // 挑战模式5题：从 pool 里抽（全输入、15-30词）
  function pickChallenge(tid) {
    return pickRetrain(tid, null, 5);
  }
  // 错题回炉（挑输入题）
  function pickWrongRetrain(topicId, count) {
    count = count || 5;
    var wb = data.wrongBook.filter(function (w) { return w.topicId === topicId; });
    var qs = [];
    wb.forEach(function (w) {
      var q = findQuestion(topicId, w.qid);
      if (q && q.type === 'input' && qs.length < count) qs.push(q);
    });
    var pool = poolFresh(topicId);
    var extra = pool.filter(function (q) { return qs.indexOf(q) < 0; });
    return qs.concat(extra).slice(0, count);
  }

  /* ---------- 真题语篇（整篇 10 空，独立于 tenseNN 单句题库） ----------
   * 数据由 data/bank-papers-*.js 注册到 window.__EGL_PAPERS__；
   * 一篇 = 10 个空，每个空转换成一条 input 题（带整篇上下文 aiCtx），
   * 复用「整篇卷面」做题流程与判分/错题/大专题统计。 */
  function papers() { return window.__EGL_PAPERS__ || []; }
  function availablePaperIds() {
    var out = [];
    papers().forEach(function (p) {
      if (p && p.id && p.blanks && p.blanks.length) out.push(p.id);
    });
    return out;
  }
  function paperById(id) {
    var list = papers();
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
    return null;
  }
  // 语篇整体统计：data.topics['paper:paper01']
  function paperStat(pid) { return topicStat('paper:' + pid); }
  function catLabelOf(catId) {
    var c = categoryName(catId);
    return (c && c.name) ? c.name : (catId || '其他/拓展');
  }
  // 取第 n 个空所在的整句（逐空卡片/回顾用）：向前到上一个句末标点，向后到下一个
  function sentenceAt(passage, n) {
    var text = String(passage || '');
    var re = /_{4,}/g, m, marks = [];
    while ((m = re.exec(text))) marks.push({ i: m.index, len: m[0].length });
    if (!marks.length) return '______';
    var nth = marks[n - 1] || marks[marks.length - 1];
    var start = 0;
    for (var k = nth.i - 1; k >= 0; k--) {
      var ch = text[k];
      if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') {
        start = k + 1;
        while (start < text.length && (text[start] === ' ' || text[start] === '\n')) start++;
        break;
      }
    }
    var end = nth.i + nth.len;
    for (var j = nth.i + nth.len; j < text.length; j++) {
      var c2 = text[j];
      if (c2 === '.' || c2 === '!' || c2 === '?') { end = j + 1; break; }
    }
    var s = text.slice(start, end);
    var rel = nth.i - start;
    if (rel >= 0 && rel + nth.len <= s.length && /_{4,}/.test(s.slice(rel, rel + nth.len))) {
      s = s.slice(0, rel) + '______' + s.slice(rel + nth.len);
    }
    return s.replace(/\s+/g, ' ').trim() || '______';
  }
  // 一篇语篇 → 每空一条题目（结构与 AI 语篇题一致，可直接进整篇卷面流程）
  function paperToQuestions(paper) {
    var out = [];
    if (!paper || !paper.blanks) return out;
    var total = paper.blanks.length;
    paper.blanks.forEach(function (b, i) {
      var n = b.n || (i + 1);
      var catName = catLabelOf(b.catId);
      var acc = [b.answer];
      (b.accepted || []).forEach(function (a) {
        if (String(a).toLowerCase() !== String(b.answer).toLowerCase() && acc.indexOf(a) < 0) acc.push(a);
      });
      var why = '';
      if (b.sense) why += '句意：' + b.sense;
      if (b.why) why += (why ? '\n' : '') + '判断：' + b.why;
      out.push({
        id: 'paper_' + paper.id + '_b' + n,
        source: 'paper',
        isPaper: true,
        paperId: paper.id,
        type: 'input',
        difficulty: b.difficulty || 3,
        question: sentenceAt(paper.passage, n),
        hint: b.given || '',
        accepted: acc,
        answerText: b.answer,
        tag: b.point || catName,
        wrongType: b.wrongType || 'CONTEXT_ERROR',
        aiMeta: { topicId: 'paper:' + (b.catId || 'extra'), catId: b.catId || 'extra', catName: catName, knowledgePoint: b.point || '', type: b.catId || '' },
        aiCtx: { kind: 'passage', isSentence: false, paperIndex: 0, paperCount: 1, title: paper.title, passage: paper.passage, total: total, blankN: n, given: b.given || '' },
        explanation: {
          answer: b.answer,
          keyPoint: '考查点：' + (b.point || catName),
          clue: b.clue || '',
          chain: (b.point || catName) + ' → ' + b.answer,
          why: why || '（本篇暂无解析）',
          whyOthers: b.others || '',
          commonError: '',
          memory: b.tip || '',
          examMind: '',
          cue: ''
        }
      });
    });
    return out;
  }
  // 一篇语篇的考点分布（页面上展示“10 空都考了什么”）
  function paperBreakdown(paper) {
    var map = {}, out = [];
    (paper && paper.blanks || []).forEach(function (b) {
      var cid = b.catId || 'extra';
      if (!map[cid]) { map[cid] = { catId: cid, name: catLabelOf(cid), count: 0, points: [] }; out.push(map[cid]); }
      map[cid].count++;
      if (b.point) map[cid].points.push(b.point);
    });
    out.sort(function (a, b) { return b.count - a.count; });
    return out;
  }

  /* ---------- 我的专卷（按薄弱点组 10 题） ---------- */
  function customCatOf(q) {
    if (q && q.aiMeta && q.aiMeta.catId) return q.aiMeta.catId;
    var tid = (q && q._reviewTid) || '';
    var m = /^(tense\d\d)/.exec(String((q && q.id) || ''));
    if (!tid && m) tid = m[1];
    return catOfTopicId(tid);
  }
  function customItemOf(q) {
    var snap = snapshotQuestion(q);
    snap.catId = customCatOf(q);
    snap.catName = catLabelOf(snap.catId);
    return snap;
  }
  // 最近一次组卷 → 可做题（每题都按“单句卡”呈现，自带提示词与解析）
  function customToQuestions(cust) {
    cust = cust || data.custom;
    if (!cust || !cust.items || !cust.items.length) return [];
    var n = cust.items.length;
    return cust.items.map(function (it, i) {
      var isChoice = it.type === 'choice' && it.options && it.options.length >= 2;
      return {
        id: it.id,
        source: 'custom',
        isCustom: true,
        type: isChoice ? 'choice' : 'input',
        question: it.question,
        hint: it.hint || '',
        accepted: (it.accepted && it.accepted.length) ? it.accepted : [it.answerText],
        options: isChoice ? it.options : null,
        answerIndex: isChoice ? ((typeof it.answerIndex === 'number') ? it.answerIndex : 0) : 0,
        answerText: it.answerText,
        tag: it.tag || it.knowledgePoint || '',
        wrongType: it.wrongType || 'CONTEXT_ERROR',
        difficulty: it.difficulty || 3,
        aiMeta: { catId: it.catId, catName: it.catName, knowledgePoint: it.knowledgePoint || '' },
        aiCtx: {
          kind: 'sentence', isSentence: true,
          paperIndex: i, paperCount: n, title: '第 ' + (i + 1) + ' 题',
          passage: it.question, total: 1, blankN: 1, given: it.hint || ''
        },
        explanation: it.explanation || { answer: it.answerText, keyPoint: it.knowledgePoint || '', why: '' }
      };
    });
  }
  /* 组卷：先取未掌握错题（最多 4 题）→ 再按薄弱大专题取真题语篇空 → 最后用题库扩展题补满 10 题 */
  function buildCustomPaper() {
    var items = [], used = {};
    function addQ(q) {
      if (!q || !q.id || used[q.id] || items.length >= 10) return;
      used[q.id] = 1;
      items.push(q);
    }
    var wrongs = data.wrongBook.filter(function (w) { return !w.mastered; }).slice();
    wrongs.sort(function (a, b) { return (a.dueAt || 0) - (b.dueAt || 0); });
    for (var i = 0; i < wrongs.length && items.length < 4; i++) {
      var wq = resolveWrongQuestion(wrongs[i]);
      if (wq) addQ(wq);
    }
    var weakCats = [];
    categoryStats().forEach(function (c) {
      if (c.attempts >= 3 && weakCats.length < 3) weakCats.push(c.catId);
    });
    if (!weakCats.length) {
      categoryStats().forEach(function (c) { if (c.attempts > 0 && weakCats.length < 3) weakCats.push(c.catId); });
    }
    var paperPool = [];
    papers().forEach(function (p) {
      paperToQuestions(p).forEach(function (q) { paperPool.push(q); });
    });
    var byCat = {};
    paperPool.forEach(function (q) {
      var cid = (q.aiMeta && q.aiMeta.catId) || 'extra';
      (byCat[cid] = byCat[cid] || []).push(q);
    });
    weakCats.forEach(function (cid) {
      var list = shuffle(byCat[cid] || []);
      for (var j = 0; j < list.length && items.length < 8; j++) addQ(list[j]);
    });
    var bankPool = [];
    availableTopicIds().forEach(function (tid) {
      bankPool = bankPool.concat(poolQuestions(tid));
    });
    shuffle(bankPool).forEach(function (q) { addQ(q); });
    shuffle(paperPool).forEach(function (q) { addQ(q); });
    var finalItems = shuffle(items).slice(0, 10);
    var dist = {};
    finalItems.forEach(function (q) {
      var cid = customCatOf(q);
      dist[cid] = (dist[cid] || 0) + 1;
    });
    var cust = {
      id: 'custom_' + nowTs(),
      ts: nowTs(),
      date: todayStr(),
      items: finalItems.map(customItemOf),
      dist: dist
    };
    data.custom = cust;
    save();
    return cust;
  }
  function getCustomPaper() { return data.custom || null; }
  function clearCustomPaper() { data.custom = null; save(); }

  // 数据导入导出（防丢数据）
  function exportData() {
    var out = data;
    try {
      var b = window.EGL_BRAND || (window.EGL && window.EGL.brand);
      var st = (b && b.stamp) ? b.stamp() : null;
      if (st) {
        // 版权元数据随备份文件一起传播（导入时忽略，不影响数据结构）
        out = deepClone(data);
        out._brand = st;
        out._notice = '本数据由 ' + st.tag + ' 的《上海初高语法填空》导出，仅供个人免费学习使用，禁止商用。'
          + ' 抖音 ' + st.douyin + ' · 小红书 ' + st.xhs;
      }
    } catch (e) { out = data; }
    return JSON.stringify(out, null, 1);
  }
  /* 用新数据替换当前数据对象（保持 EGL.data 这个外部引用仍然有效） */
  function replaceData(next) {
    Object.keys(data).forEach(function (k) { delete data[k]; });
    Object.keys(next).forEach(function (k) { data[k] = next[k]; });
    if (window.EGL) window.EGL.data = data;
    save();
  }
  function importData(json) {
    try {
      var d = JSON.parse(json);
      if (!d || !d.global) return false;
      delete d._brand; delete d._notice;
      var next = migrateData(d);
      if (!next) return false;
      replaceData(next);
      return true;
    } catch (e) { return false; }
  }
  function resetData() { replaceData(emptyData()); }

  /* ---------- 对外 API ---------- */
  EGL.DATA_VERSION = DATA_VERSION;
  EGL.util = { pad2: pad2, todayStr: todayStr, dayKey: dayKey, startOfDay: startOfDay, addDays: addDays,
               nowTs: nowTs, deepClone: deepClone, shuffle: shuffle,
               normalizeAnswer: normalizeAnswer, checkInputAnswer: checkInputAnswer };
  EGL.data = data;
  EGL.save = save;
  EGL.setSaveListener = setSaveListener;
  EGL.loadData = loadData;
  EGL.migrateData = migrateData;
  EGL.bank = bank;
  EGL.roadmap = roadmap;
  EGL.topicMeta = topicMeta;
  EGL.availableTopicIds = availableTopicIds;
  EGL.isChallengeAvailable = isChallengeAvailable;
  EGL.topicStat = topicStat;
  EGL.topicAccuracy = topicAccuracy;
  EGL.topicStatus = topicStatus;
  EGL.updateTopicStat = updateTopicStat;
  EGL.isChallengeUnlocked = isChallengeUnlocked;
  EGL.addGlobal = addGlobal;
  EGL.recordTag = recordTag;
  EGL.tagAccuracy = tagAccuracy;
  EGL.addWrong = addWrong;
  EGL.removeWrong = removeWrong;
  EGL.clearWrong = clearWrong;
  EGL.snapshotQuestion = snapshotQuestion;
  EGL.setWrongNote = setWrongNote;
  EGL.reviewWrong = reviewWrong;
  EGL.wrongStats = wrongStats;
  EGL.dueWrong = dueWrong;
  EGL.resolveWrongQuestion = resolveWrongQuestion;
  EGL.reviewQueue = reviewQueue;
  EGL.addDaily = addDaily;
  EGL.dailyGoal = dailyGoal;
  EGL.setGoal = setGoal;
  EGL.streak = streak;
  EGL.weekSeries = weekSeries;
  EGL.noteAgg = noteAgg;
  EGL.profileStats = profileStats;
  EGL.papersDone = papersDone;
  EGL.paperFreq = paperFreq;
  EGL.overallStats = overallStats;
  EGL.addSession = addSession;
  EGL.sessionsOfTopic = sessionsOfTopic;
  EGL.tagList = tagList;
  EGL.weakTopics = weakTopics;
  EGL.metaOfTopic = metaOfTopic;
  EGL.nextUnstarted = nextUnstarted;
  EGL.recommendNext = recommendNext;
  EGL.topicQuestions = topicQuestions;
  EGL.poolQuestions = poolQuestions;
  EGL.findQuestion = findQuestion;
  EGL.pickRetrain = pickRetrain;
  EGL.pickChallenge = pickChallenge;
  EGL.pickWrongRetrain = pickWrongRetrain;
  EGL.buildCustomPaper = buildCustomPaper;
  EGL.getCustomPaper = getCustomPaper;
  EGL.clearCustomPaper = clearCustomPaper;
  EGL.customToQuestions = customToQuestions;
  EGL.papers = papers;
  EGL.availablePaperIds = availablePaperIds;
  EGL.paperById = paperById;
  EGL.paperStat = paperStat;
  EGL.paperToQuestions = paperToQuestions;
  EGL.paperBreakdown = paperBreakdown;
  EGL.catLabelOf = catLabelOf;
  EGL.exportData = exportData;
  EGL.importData = importData;
  EGL.resetData = resetData;
  EGL.catOfTopicId = catOfTopicId;
  EGL.categoryName = categoryName;
  EGL.categoryStats = categoryStats;
})();
