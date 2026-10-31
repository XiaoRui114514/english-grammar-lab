/* Cloud payload is deliberately separate from exportData(): offline backups may
 * contain drafts and AI caches. Only this schema can enter the cloud API. */
(function () {
  'use strict';
  var E = window.EGL;
  function record(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function safeKey(k) { return k !== '__proto__' && k !== 'prototype' && k !== 'constructor'; }
  function scalar(v) { return v === null || typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && isFinite(v)); }
  function fields(v, names) {
    var out = {};
    if (!record(v)) return out;
    names.split(' ').forEach(function (k) { if (scalar(v[k])) out[k] = v[k]; });
    return out;
  }
  function map(v, fn) {
    var out = Object.create(null);
    if (record(v)) Object.keys(v).forEach(function (k) { if (safeKey(k)) out[k] = fn(v[k]); });
    return out;
  }
  function nums(v) { return map(v, function (n) { return typeof n === 'number' && isFinite(n) ? n : 0; }); }
  function counts(v) { return fields(v, 'answered correct'); }
  function ac(v) { return fields(v, 'a c'); }
  function strings(v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }).slice(0, 8) : null; }
  function snapshot(v) {
    if (!record(v)) return null;
    var out = fields(v, 'id type question hint answerIndex answerText tag wrongType difficulty catId catName knowledgePoint');
    out.accepted = strings(v.accepted) || [];
    out.options = strings(v.options);
    out.explanation = record(v.explanation) ? fields(v.explanation, 'answer keyPoint clue chain why whyOthers memory') : null;
    return out;
  }
  function project(v) {
    if (!record(v) || [1, 2, 3].indexOf(v.version) < 0 || !record(v.global)) throw new Error('学习数据格式不正确');
    var out = fields(v, 'version lastStudyAt createdAt goal');
    out.version = 3;
    out.global = counts(v.global);
    out.topics = map(v.topics, function (x) { return fields(x, 'attempts correct runs lastCorrect lastTotal lastMode finished bestRunPct lastAt'); });
    out.tags = map(v.tags, function (x) { return fields(x, 'attempts correct streakWrong lastWrong'); });
    out.errorTypes = nums(v.errorTypes);
    out.wrongBook = (Array.isArray(v.wrongBook) ? v.wrongBook : []).map(function (x) {
      x = record(x) ? x : {};
      var w = fields(x, 'id topicId topicTitle qid question tag kp myAnswer correctAnswer wrongType source catId times lastDate lastAt stage mastered dueAt notes lastReviewAt');
      w.snapshot = snapshot(x.snapshot); return w;
    });
    out.sessions = (Array.isArray(v.sessions) ? v.sessions : []).map(function (x) { return fields(x, 'date topicId mode correct total seconds at label'); });
    out.daily = map(v.daily, counts);
    out.usedPool = map(v.usedPool, nums);
    out.challengeUnlocked = map(v.challengeUnlocked, function (x) { return x === true; });
    var a = record(v.agg) ? v.agg : {};
    out.agg = fields(a, 'timeSum timeCount');
    out.agg.byType = { choice: ac(a.byType && a.byType.choice), input: ac(a.byType && a.byType.input) };
    out.agg.byDiff = map(a.byDiff, ac);
    out.custom = null;
    if (record(v.custom)) {
      out.custom = fields(v.custom, 'id ts date');
      out.custom.items = (Array.isArray(v.custom.items) ? v.custom.items : []).map(snapshot).filter(Boolean);
      out.custom.dist = nums(v.custom.dist);
    }
    return out;
  }
  E.cloudData = {
    project: project,
    read: function () { return project(E.data); },
    apply: function (v) {
      var next = project(v);
      if (!E.importData(JSON.stringify(next))) throw new Error('无法导入云端记录');
      if (!E.save()) throw new Error('本机空间不足，请先下载备份；云端记录未能保存到本机');
      if (E.ui && E.ui.render) E.ui.render();
    },
    empty: function (v) {
      return !(v.goal !== 12 || v.global.answered || v.global.correct || v.lastStudyAt || v.wrongBook.length || v.sessions.length || v.custom
        || Object.keys(v.topics).some(function (k) { return v.topics[k].attempts || v.topics[k].runs || v.topics[k].finished; })
        || Object.keys(v.tags).some(function (k) { return v.tags[k].attempts; })
        || Object.keys(v.daily).some(function (k) { return v.daily[k].answered || v.daily[k].correct; })
        || Object.keys(v.errorTypes).some(function (k) { return v.errorTypes[k]; })
        || Object.keys(v.usedPool).some(function (k) { return Object.keys(v.usedPool[k]).length; })
        || Object.keys(v.challengeUnlocked).some(function (k) { return v.challengeUnlocked[k]; })
        || v.agg.timeCount);
    }
  };
})();
