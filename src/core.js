/* ============================================================
 * core.js — English Grammar Lab 核心引擎
 * 数据 / 存储 / 答题判定 / 分析 / 推荐 / 错题本
 * 全部逻辑挂在 window.EGL 命名空间，由 ui.js 调用。
 * 题库注册表：window.__GRAMMAR_LAB__ （data/*.js 写入）
 * 路线图：window.__GRAMMAR_LAB_ROADMAP__
 * ============================================================ */
(function () {
  'use strict';
  window.EGL = window.EGL || {};

  var LS_KEY = 'EGL_LAB_DATA_v1';

  /* ---------- 工具 ---------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
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
      version: 2,
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
      createdAt: nowTs()
    };
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return emptyData();
      var d = JSON.parse(raw);
      if (!d || (d.version !== 1 && d.version !== 2)) return emptyData();
      if (d.version === 1) d.version = 2;              // 平滑升级
      if (!d.global) d.global = { answered: 0, correct: 0 };
      return d;
    } catch (e) {
      try { localStorage.removeItem(LS_KEY); } catch (e2) {}
      return emptyData();
    }
  }
  var data = loadData();
  var saveListener = null;
  // 任意一次自动保存后回调（右上角"已保存"提示由 UI 注册；无 UI 环境不注册即可）
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {}
    if (typeof saveListener === 'function') {
      try { saveListener(); } catch (e2) {}
    }
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
    return { name: catId, icon: '📌' };
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
      out.push({ catId: cat, name: meta.name, icon: meta.icon, color: meta.color || '#8b93b5',
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
  function addWrong(item) {
    var found = findWrongEntry(item.qid);
    if (found) {
      found.entry.times++;
      found.entry.lastDate = todayStr();
      found.entry.lastAt = nowTs();
      found.entry.myAnswer = item.myAnswer;
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
      myAnswer: item.myAnswer,
      correctAnswer: item.correctAnswer,
      wrongType: item.wrongType || 'VERB_FORM_ERROR',
      source: item.source || 'bank',          // 'bank' | 'ai'
      grade: item.grade || '',                // 年级
      stage: item.stage || '',                // 阶段
      catId: item.catId || catOfTopicId(item.topicId || ''), // 大专题
      times: 1,
      lastDate: todayStr(),
      lastAt: nowTs()
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
  function overallStats() {
    var tids = availableTopicIds();
    var finished = 0;
    tids.forEach(function (tid) {
      var s = topicStat(tid);
      if (s.finished && s.attempts >= 12) finished++;
    });
    return {
      answered: data.global.answered,
      correct: data.global.correct,
      pct: data.global.answered ? data.global.correct / data.global.answered : null,
      finished: finished,
      available: tids.length,
      totalPlan: roadmap() ? roadmap().total : 60,
      todayAnswered: dailyToday().answered,
      todayCorrect: dailyToday().correct
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
        out._notice = '本数据由 ' + st.tag + ' 的 English Grammar Lab 导出，仅供个人免费学习使用，禁止商用。'
          + ' 抖音 ' + st.douyin + ' · 小红书 ' + st.xhs;
      }
    } catch (e) { out = data; }
    return JSON.stringify(out, null, 1);
  }
  function importData(json) {
    try {
      var d = JSON.parse(json);
      if (!d || !d.global) return false;
      delete d._brand; delete d._notice;
      data = d;
      save();
      return true;
    } catch (e) { return false; }
  }
  function resetData() { data = emptyData(); save(); }

  /* ---------- 对外 API ---------- */
  EGL.util = { pad2: pad2, todayStr: todayStr, nowTs: nowTs, deepClone: deepClone, shuffle: shuffle,
               normalizeAnswer: normalizeAnswer, checkInputAnswer: checkInputAnswer };
  EGL.data = data;
  EGL.save = save;
  EGL.setSaveListener = setSaveListener;
  EGL.loadData = loadData;
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
  EGL.addDaily = addDaily;
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
  EGL.exportData = exportData;
  EGL.importData = importData;
  EGL.resetData = resetData;
  EGL.catOfTopicId = catOfTopicId;
  EGL.categoryName = categoryName;
  EGL.categoryStats = categoryStats;
})();
