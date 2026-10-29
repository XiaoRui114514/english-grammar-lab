/* ============================================================
 * ui-quiz.js — 练习流程引擎（逐题作答/盲做/挑战/再练/综合挑战）
 * ============================================================ */
(function () {
  'use strict';
  var E = window.EGL, U = E.u;
  var $ = U.$, $$ = U.$$, el = U.el, esc = U.esc, pct = U.pct;

  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var S = null; // session
  var DRAFT_KEY = 'EGL_QUIZ_DRAFT_v1';
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch(e) {} }
  function saveDraft() {
    if (!S || S._finished) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({version:1, savedAt:Date.now(), session:S}, function(k,v) {
      return k === '_timerId' || k === '_blankStart' ? undefined : v;
    })); } catch(e) { if (!S._draftWarned) { S._draftWarned=true; U.toast('练习草稿未能保存，请保留页面', 'bad'); } }
  }
  function readDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(DRAFT_KEY));
      var v = d && d.session;
      if (d.version !== 1 || !v || v._finished || !Array.isArray(v.questions) || !v.questions.length || v.questions.length > 500 || !Array.isArray(v.answers) || !Number.isInteger(v.idx) || v.idx < 0 || v.idx >= v.questions.length || !Number.isFinite(v.startTs)) return null;
      return d;
    } catch(e) { return null; }
  }
  function resumeDraft() {
    var d = readDraft(); if (!d) return false;
    clearTimer(); S=d.session;
    if (!S.limitSec && Number.isFinite(d.savedAt)) S.startTs += Math.max(0,Date.now()-d.savedAt);
    S._timerId=0; S._draftWarned=false;
    E.ui.quizActive=true; renderPractice();
    if (S.limitSec) { if (Date.now()-S.startTs >= S.limitSec*1000) autoSubmit(); else startTimer(); }
    return true;
  }
  function showResumeBanner() {
    if (E.ui.quizActive || !readDraft()) return;
    var v=appView(); if (!v) return;
    var box=el('div','glass'); box.style.padding='14px';
    box.appendChild(el('p','','有未完成练习。限时练习离开页面后仍继续计时。'));
    var resume=el('button','btn primary'); resume.textContent='继续上次练习'; resume.addEventListener('click',resumeDraft);
    var discard=el('button','btn ghost'); discard.textContent='丢弃草稿'; discard.addEventListener('click',function(){clearDraft(); box.remove();});
    box.appendChild(resume); box.appendChild(discard); v.appendChild(box);
  }
  if (window.addEventListener) window.addEventListener('pagehide',saveDraft);
  var LIMIT_SEC = 600;   // 限时模拟考：10 分钟

  function appView() { return E.ui && E.ui.app ? E.ui.app.view : null; }
  function isSheetKind(k) { return k === 'ai' || k === 'paper' || k === 'custom'; }

  /* ---------- 计时器（限时模拟考） ---------- */
  function clockText(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function clearTimer() {
    if (S && S._timerId) {
      try { if (typeof clearInterval === 'function') clearInterval(S._timerId); } catch (e) {}
      S._timerId = 0;
    }
  }
  function startTimer() {
    if (!S || !S.limitSec) return;
    if (typeof setInterval !== 'function') return;
    clearTimer();
    S._timerId = setInterval(function () {
      if (!S) return;
      var left = S.limitSec - Math.floor((E.util.nowTs() - S.startTs) / 1000);
      var node = document.getElementById ? document.getElementById('quizTimer') : null;
      if (node) {
        node.textContent = '⏱ ' + clockText(left);
        if (node.className !== undefined) node.className = 'pn timer' + (left <= 60 ? ' urgent' : '');
      }
      if (left <= 0) {
        clearTimer();
        autoSubmit();
      }
    }, 500);
  }
  function autoSubmit() {
    if (!S) return;
    U.toast('时间到，自动交卷', 'bad');
    if (isSheetKind(S.kind)) submitSheet(true);
    else finish();
  }

  /* ---------- 键盘 / 焦点 ---------- */
  function isTypingTarget(t) {
    if (!t) return false;
    var tag = String(t.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable === true;
  }
  function isTouchLike() {
    try { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { return false; }
  }
  function focusSoon(node) {
    if (!node || typeof node.focus !== 'function') return;
    setTimeout(function () { try { node.focus({ preventScroll: true }); } catch (e) { try { node.focus(); } catch (e2) {} } }, 40);
  }
  // 空位上下文：显示空前后各三个词，帮学生确认“空在哪”（不泄露答案）
  function slotHintHTML(q) {
    var s = String((q && q.question) || '');
    var i = s.indexOf('______');
    if (i < 0) return '';
    var left = s.slice(0, i).trim().split(/\s+/).slice(-3).join(' ');
    var right = s.slice(i + 6).trim().split(/\s+/).slice(0, 3).join(' ');
    return '<span class="faint">…</span>' + (left ? esc(left) + ' ' : '')
      + '<b class="slot-mark">______</b>'
      + (right ? ' ' + esc(right) : '') + '<span class="faint"> …</span>';
  }
  function onKeyDown(e) {
    if (!S || S._finished || !e) return;
    if (e.key === 'Escape') { askExit(); return; }
    var sheet = isSheetKind(S.kind);
    if (isTypingTarget(e.target)) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (sheet) submitSheet();
      }
      return;
    }
    if (sheet) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitSheet(); }
      return;
    }
    var q = S.questions[S.idx];
    if (!q) return;
    if (S.answers[S.idx]) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (S._next) S._next();
        else if (lastQ()) finish();
      }
      return;
    }
    if (q.type === 'choice') {
      var idx = -1;
      if (/^[1-6]$/.test(e.key)) idx = parseInt(e.key, 10) - 1;
      else if (/^[a-fA-F]$/.test(e.key)) idx = e.key.toLowerCase().charCodeAt(0) - 97;
      if (idx >= 0 && idx < (q.options || []).length) {
        e.preventDefault();
        if (S._pick) S._pick(idx);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (S._submitChoice) S._submitChoice();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (S._submitText) S._submitText();
    }
  }
  if (document && document.addEventListener) document.addEventListener('keydown', onKeyDown);

  /* ---------- 启动 ---------- */
  function startCore(tid, mode) {
    var topic = E.bank()[tid];
    if (!topic) return;
    clearTimer();
    S = {
      kind: 'core', mode: mode, topicId: tid, title: topic.title, icon: topic.icon,
      questions: (topic.questions || []).slice(), idx: 0, answers: [], startTs: E.util.nowTs(),
      modeLabel: mode === 'blind' ? '盲做模式' : '普通模式'
    };
    E.ui.quizActive = true;
    renderPractice();
  }
  function startChallenge(tid) {
    var topic = E.bank()[tid];
    if (!topic) return;
    var qs = E.pickChallenge(tid);
    if (!qs.length) { U.toast('该专题暂时没有挑战题', 'bad'); return; }
    clearTimer();
    S = {
      kind: 'challenge', mode: 'normal', topicId: tid, title: topic.title, icon: topic.icon,
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(),
      modeLabel: '加练 · 高难 5 题（全输入）'
    };
    E.ui.quizActive = true;
    renderPractice();
  }
  function startRetrain(tid, tag) {
    var topic = E.bank()[tid];
    if (!topic) return;
    var qs = E.pickRetrain(tid, tag || null, 5);
    if (!qs.length) { U.toast('暂无可再练题目', 'bad'); return; }
    clearTimer();
    S = {
      kind: 'retrain', mode: 'normal', topicId: tid, title: topic.title, icon: topic.icon,
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(),
    modeLabel: '再练 5 题' + (tag ? '（' + tag + '）' : '')
    };
    E.ui.quizActive = true;
    renderPractice();
  }
  function startWrongRetrain(tid) {
    var topic = E.bank()[tid];
    if (!topic) return;
    var qs = E.pickWrongRetrain(tid, 5);
    if (!qs.length) { U.toast('该专题还没有可回炉的输入错题', 'bad'); return; }
    clearTimer();
    S = {
      kind: 'wrongretrain', mode: 'normal', topicId: tid, title: topic.title, icon: topic.icon,
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(), modeLabel: '错题回炉 5 题'
    };
    E.ui.quizActive = true;
    renderPractice();
  }
  function startMixed(mode) {
    var ch = E.bank().challenge;
    if (!ch || !ch.questions || !ch.questions.length) return;
    mode = mode || 'normal';
    clearTimer();
    S = {
      kind: 'mixed', mode: mode, topicId: 'challenge', title: ch.title || '综合挑战', icon: ch.icon || '',
      questions: ch.questions.slice(), idx: 0, answers: [], startTs: E.util.nowTs(),
      modeLabel: '综合挑战 · 20 题 · ' + (mode === 'blind' ? '盲做' : '普通')
    };
    E.ui.quizActive = true;
    renderPractice();
  }

  /* ---------- 今日复习（跨专题 / 真题 / AI 错题混排） ---------- */
  function startReview(qids) {
    var qs = [];
    if (qids && qids.length) {
      qids.forEach(function (qid) {
        var w = E.data.wrongBook.filter(function (x) { return x.qid === qid; })[0];
        var q = w ? E.resolveWrongQuestion(w) : null;
        if (q) qs.push(q);
      });
    } else {
      qs = E.reviewQueue(12);
    }
    if (!qs.length) { U.toast('今天没有可复习的错题', 'bad'); return; }
    clearTimer();
    S = {
      kind: 'review', mode: 'normal', topicId: 'review', title: '今日复习', icon: '',
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(),
      modeLabel: '间隔复习 · ' + qs.length + ' 空（答对升一档，答错回到第一档）'
    };
    E.ui.quizActive = true;
    renderPractice();
  }

  /* ---------- 我的专卷（10 空，按薄弱点抽取） ---------- */
  function startCustom(opts) {
    opts = opts || {};
    var cust = E.getCustomPaper();
    if (!cust) { E.buildCustomPaper(); cust = E.getCustomPaper(); }
    var qs = E.customToQuestions(cust);
    if (!qs.length) { U.toast('还没有可做的专卷', 'bad'); return; }
    clearTimer();
    S = {
      kind: 'custom', mode: 'normal', topicId: 'custom', title: (cust.date || '') + ' 我的专卷', icon: '',
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(),
      limitSec: opts.timed ? LIMIT_SEC : 0,
      modeLabel: opts.timed ? '限时模拟考 · 10 分钟' : '我的专卷 · 10 空',
      _custom: cust
    };
    E.ui.quizActive = true;
    renderPractice();
  }

  /* ---------- AI 语篇题进入原做题流程 ----------
   * questions 是 AI 每空转换后的 input 题（q.aiCtx 保存整篇语篇上下文）
   * 题目来源、判分、解析、错题全部复用原流程；统计按 q.aiMeta 归入大专题。 */
  function startAI(questions, meta) {
    meta = meta || {};
    if (!questions || !questions.length) return;
    var mode = meta.mode || 'normal';
    clearTimer();
    S = {
      kind: 'ai', mode: mode, topicId: 'ai', title: meta.title || 'AI 出题训练',
      icon: meta.icon || '', subtitle: meta.subtitle || '',
      questions: questions.slice(), idx: 0, answers: [], startTs: E.util.nowTs(),
      limitSec: meta.timed ? LIMIT_SEC : 0,
      modeLabel: 'AI 生成 · ' + (mode === 'blind' ? '盲做' : (meta.timed ? '限时 10 分钟' : '普通')),
      _aiQuestions: questions.slice(), _aiMeta: meta
    };
    E.ui.quizActive = true;
    renderPractice();
  }

  /* ---------- 真题语篇进入整篇卷面（一篇 10 空，全部答完统一交卷） ---------- */
  function startPaper(pid, opts) {
    opts = opts || {};
    var paper = E.paperById(pid);
    if (!paper) { U.toast('没有找到这篇语篇', 'bad'); return; }
    var qs = E.paperToQuestions(paper);
    if (!qs.length) { U.toast('这篇语篇暂时没有题目', 'bad'); return; }
    clearTimer();
    S = {
      kind: 'paper', mode: 'normal', topicId: 'paper', title: paper.title, icon: '',
      subtitle: paper.source || '', paperId: pid,
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(),
      limitSec: opts.timed ? LIMIT_SEC : 0,
      modeLabel: opts.timed ? '限时模拟考 · 10 分钟' : '上海真题语篇 · 整篇作答',
      _paperId: pid, _aiQuestions: qs, _aiMeta: { mode: 'normal', title: paper.title }
    };
    E.ui.quizActive = true;
    renderPractice();
  }

  /* ---------- 练习主屏 ---------- */
  function renderPractice() {
    saveDraft();
    var v = appView();
    if (!v || !S) return;
    // AI 语篇题 / 真题语篇 / 我的专卷：整篇一次展示、全部空一起作答（不要一空一空翻）
    if (isSheetKind(S.kind)) { renderSheetAI(); return; }
    v.innerHTML = '';
    var topic = E.bank()[S.topicId];

    var head = el('div', 'learn-head glass');
    head.innerHTML = '<button class="btn ghost sm" data-exit="1" aria-label="退出本轮练习">✕</button>'
      + '<div class="tt">' + esc(S.title) + '</div>'
      + '<div class="mode">' + esc(S.modeLabel) + (S.kind === 'core' ? ' · 12 题 · 1-6 选择 / 7-12 输入' : '') + '</div>'
      + '<span class="pn">' + (S.idx + 1) + ' / ' + S.questions.length + '</span>';    v.appendChild(head);
    S._qStart = E.util.nowTs();

    var dots = el('div', 'dots');
    S.questions.forEach(function (_, i) {
      var d = el('i');
      if (i < S.answers.length) d.className = (S.mode !== 'blind' && S.answers[i].ok) ? 'done-ok'
        : (S.mode !== 'blind' && !S.answers[i].ok) ? 'done-bad' : 'done';
      if (i === S.idx) d.className += ' cur';
      dots.appendChild(d);
    });
    v.appendChild(dots);

    var layout = el('div', 'learn-layout');
    layout.style.marginTop = '12px';

    // 桌面左栏：知识卡
    if (topic && S.kind === 'core') {
      var aside = el('aside', '');
      var det = el('details', 'panel');
      det.style.marginTop = '0';
      if (window.matchMedia && window.matchMedia('(min-width:1024px)').matches) det.open = true;
      det.innerHTML = '<summary>知识卡<span class="arr">▶</span></summary><div class="inner">'
        + U.knowledgeCardHTML(topic) + '</div>';
      aside.appendChild(det);
      layout.appendChild(aside);
    }

    var q = S.questions[S.idx];
    var qbox = el('div', 'qbox glass');
    qbox.dataset.qid = q.id;
    var isAI = !!(q.isAI || q.source === 'ai');
    var aiMeta = q.aiMeta || {};
    var grammarName = aiMeta.catName || (isAI ? 'AI出题'
      : ((E.bank()[S.topicId] && E.bank()[S.topicId].title) || S.title || ''));
    var chip = q.type === 'choice' ? '点选选择题（点 A/B/C…，不用打字）' : '输入题（自己拼写）';
    qbox.appendChild(el('div', 'qno',
      '<span class="badge badge-grammar">考点：' + esc(grammarName) + '</span> '
      + (isAI ? '<span class="badge gray">AI 题</span> ' : '')
      + (S.kind === 'review' ? '<span class="badge amber">今日复习</span> ' : '')
      + chip
      + (q.tag ? ' <span class="qtag">· ' + esc(q.tag) + '</span>' : '')
      + (q.difficulty ? ' <span class="qtag">· 难度 ' + q.difficulty + '/5</span>' : '')));
    // AI 语篇题：顶部展示整篇语境（含当前空定位）；非 AI 显示句子
    if (isAI && q.aiCtx) {
      qbox.appendChild(el('div', '', U.passagePanelHTML(q.aiCtx)));
    }
    qbox.appendChild(el('div', '', U.renderSentence(q, { hideInlineHint: q.type === 'input' })));
    layout.appendChild(qbox);
    v.appendChild(layout);

    var answered = !!S.answers[S.idx];
    if (!answered) {
      if (q.type === 'choice') renderChoiceInput(qbox, q);
      else renderTextInput(qbox, q);
    } else {
      renderAnswered(qbox, q);
    }

    // 退出
    var exitBtn = $('[data-exit]', v);
    if (exitBtn) exitBtn.addEventListener('click', askExit);
    v.scrollIntoView({ block: 'start' });
  }

  /* ---------- AI 整篇卷面：全文 + 全部空同时展示，全部答完一起交卷 ---------- */
  function sheetPassageHTML(ctx) {
    if (!ctx || !ctx.passage) return '';
    var parts = String(ctx.passage).split(/_{4,}/);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      out.push(esc(parts[i]).replace(/\n/g, '<br>'));
      if (i < parts.length - 1) out.push('<span class="passage-blank">(' + (i + 1) + ')<i class="pb-u"></i></span>');
    }
    return '<div class="passage-body">' + out.join('') + '</div>';
  }
  function renderSheetAI() {
    var v = appView();
    if (!v || !S) return;
    S._sheetMode = true;
    S._typed = S._typed || [];
    S._blankStart = {};
    v.innerHTML = '';

    var headMode = S.kind === 'paper'
      ? '上海真题语篇 · 整篇 ' + S.questions.length + ' 空一起作答，答完统一交卷看解析'
      : S.kind === 'custom'
        ? '我的专卷 · ' + S.questions.length + ' 空，答完统一交卷看解析'
        : '整篇卷面 · 全部空一起作答，答完统一交卷看解析';
    var head = el('div', 'learn-head glass');
    head.innerHTML = '<button class="btn ghost sm" data-exit="1" aria-label="退出本轮练习">✕</button>'
      + '<div class="tt">' + esc(S.title) + '</div>'
      + '<div class="mode">' + headMode + (S.limitSec ? '　·　Enter 换下一空，Ctrl/⌘+Enter 交卷' : '') + '</div>'
      + (S.limitSec ? '<span class="pn timer" id="quizTimer">⏱ ' + clockText(S.limitSec) + '</span>' : '')
      + '<span class="pn" id="sheetCount">0 / ' + S.questions.length + '</span>';
    v.appendChild(head);
    var exitBtn = $('[data-exit]', v);
    if (exitBtn) exitBtn.addEventListener('click', askExit);

    // 按语篇分组；单句（sentence）与语篇（passage）分开展示
    var passGroups = [], sentGroups = [];
    var passOrd = {}, sentOrd = {};
    S.questions.forEach(function (q, i) {
      var kind = (q.aiCtx && q.aiCtx.kind === 'sentence') ? 'sentence' : 'passage';
      var pi = (q.aiCtx && q.aiCtx.paperIndex != null) ? q.aiCtx.paperIndex : 0;
      var arr = kind === 'sentence' ? sentGroups : passGroups;
      var key = kind + ':' + pi;
      var idx = kind === 'sentence' ? (sentOrd[key] === undefined ? (sentOrd[key] = arr.length) : sentOrd[key])
        : (passOrd[key] === undefined ? (passOrd[key] = arr.length) : passOrd[key]);
      if (!arr[idx]) arr[idx] = { ctx: q.aiCtx || {}, items: [] };
      arr[idx].items.push({ q: q, i: i });
    });

    function bindSheetInput(inp, qidx) {
      inp.value = S._typed[qidx] || "";
      inp.addEventListener('input', function () {
        if (!S._blankStart[qidx]) S._blankStart[qidx] = E.util.nowTs();
        S._typed[qidx] = inp.value;
        saveDraft();
        updateSheetMeta();
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          var v2 = appView();
          var inputs = v2 ? $$('.sq-card input[type=text]', v2) : [];
          var pos = inputs.indexOf(inp);
          if (pos >= 0 && pos < inputs.length - 1 && inputs[pos + 1].focus) inputs[pos + 1].focus();
          else submitSheet();
        }
      });
    }

    function renderCards(g) {
      var sheet = el('div', 'sheet-cards');
      g.items.forEach(function (it) {
        var q = it.q;
        var n = (q.aiCtx && q.aiCtx.blankN) || (it.i + 1);
        var isS = q.aiCtx && q.aiCtx.kind === 'sentence';
        var card = el('div', 'sq-card');
        card.dataset.qrow = String(it.i);
        var h = el('div', 'sq-head');
        h.innerHTML = '<span class="badge ' + (isS ? 'green' : 'gray') + '">'
          + (isS ? '单句' : '语篇') + ' · 第 ' + n + ' 空</span>'
          + (q.aiMeta && q.aiMeta.catName ? ' <span class="badge blue">' + esc(q.aiMeta.catName) + '</span>' : '')
          + (q.type === 'choice' ? '' : ' <span class="badge amber">填空输入</span>');
        card.appendChild(h);
        var stem = el('div', 'sq-stem');
        stem.style.cssText = 'font-size:15px;line-height:1.9;margin-top:8px;color:var(--ink-dim)';
        stem.innerHTML = U.renderSentence(q, { hideInlineHint: !q.isPaper });
        card.appendChild(stem);
        if (q.type === 'choice') {
          var row = el('div', 'sq-opts');
          q.options.forEach(function (txt, oi) {
            var b = el('button', 'sq-opt');
            b.type = 'button';
            b.dataset.idx = String(oi);
            b.innerHTML = '<b>' + LETTERS[oi] + '</b><span>' + esc(txt) + '</span>';
            (function (qidx, oi2) {
              b.addEventListener('click', function () { pickSheet(qidx, oi2); });
            })(it.i, oi);
            row.appendChild(b);
          });
          card.appendChild(row);
        } else {
          var ai = el('div', 'answer-input');
          ai.style.marginTop = '8px';
          ai.innerHTML = '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入该空答案">';
          var inp = $('input', ai);
          bindSheetInput(inp, it.i);
          card.appendChild(ai);
        }
        sheet.appendChild(card);
      });
      return sheet;
    }
    // 单句显示：整句一次展示（所有空带编号+给定词），下面每空一排 A/B/C 选项
    function sentenceDisplayHTML(g) {
      var raw = String((g.ctx && g.ctx.passage) || '');
      var parts = raw.split(/(_{4,})/);
      var out = [];
      var bi = 0;
      for (var i = 0; i < parts.length; i++) {
        if (/_{4,}/.test(parts[i])) {
          bi++;
          var it = g.items[bi - 1];
          var gw = (it && it.q && it.q.aiCtx && it.q.aiCtx.given) || '';
          var after = (parts[i + 1] || '');
          var inline = gw && after.trim().toLowerCase().indexOf('(' + gw.toLowerCase() + ')') === 0;
          out.push('<span class="passage-blank">(' + bi + ')<i class="pb-u"></i>'
            + (gw && !inline ? ' (' + esc(gw) + ')' : '') + '</span>');
        } else {
          out.push(esc(parts[i]).replace(/\n/g, '<br>'));
        }
      }
      return out.join('');
    }
    function renderSentenceCard(g) {
      var card = el('div', 'sq-card');
      card.style.marginTop = '10px';
      var k = g.items.length;
      var h = el('div', 'sq-head');
      h.innerHTML = '<span class="badge green">单句' + (k > 1 ? ' · 共 ' + k + ' 空' : '') + '</span>'
        + (k > 1 ? ' <span class="badge gray">每空一排选项</span>' : '');
      card.appendChild(h);
      var stem = el('div', 'sq-stem');
      stem.style.cssText = 'font-size:15px;line-height:1.9;margin-top:8px;color:var(--ink-dim)';
      stem.innerHTML = sentenceDisplayHTML(g);
      card.appendChild(stem);
      g.items.forEach(function (it, bIdx) {
        var q = it.q;
        var n = (q.aiCtx && q.aiCtx.blankN) || (bIdx + 1);
        var sub = el('div', 'sq-blank-row');
        sub.style.marginTop = (bIdx === 0 ? '10px' : '12px');
        sub.dataset.qrow = String(it.i); // 供 pickSheet 定位并高亮本空所选选项
        var lbl = el('div', '');
        lbl.style.cssText = 'font-size:12px;color:var(--ink-dim);margin-bottom:6px;font-weight:800;letter-spacing:.5px';
        lbl.textContent = k > 1 ? '第 ' + n + ' 空（' + LETTERS[0] + '—' + LETTERS[q.options ? q.options.length - 1 : 0] + '）' : '';
        if (lbl.textContent) sub.appendChild(lbl);
        if (q.type === 'choice' && q.options) {
          var row = el('div', 'sq-opts');
          q.options.forEach(function (txt, oi) {
            var b = el('button', 'sq-opt');
            b.type = 'button';
            b.dataset.idx = String(oi);
            b.innerHTML = '<b>' + LETTERS[oi] + '</b><span>' + esc(txt) + '</span>';
            (function (qidx, oi2) {
              b.addEventListener('click', function () { pickSheet(qidx, oi2); });
            })(it.i, oi);
            row.appendChild(b);
          });
          sub.appendChild(row);
        } else {
          var ai = el('div', 'answer-input');
          ai.style.marginTop = '6px';
          ai.innerHTML = '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入该空答案">';
          var inp = $('input', ai);
          bindSheetInput(inp, it.i);
          sub.appendChild(ai);
        }
        card.appendChild(sub);
      });
      return card;
    }

    function renderPassageBlock(g, gIdx, headIcon, headLabel) {
      var paper = el('div', 'passage-panel sheet-paper sheet-paper-top');
      paper.style.marginTop = (gIdx === 0 ? '12px' : '16px');
      var t = el('div', 'passage-title', (headIcon ? headIcon + ' ' : '') + esc(g.ctx.title || (headLabel + ' ' + (gIdx + 1)))
        + ' <span class="faint small" style="font-weight:500">本区固定顶部 · 通读后在下方作答</span>');
      paper.appendChild(t);
      paper.appendChild(el('div', '', sheetPassageHTML(g.ctx)));
      v.appendChild(paper);
      v.appendChild(renderCards(g));
    }

    // 单句：每句一次展示 + 每空一排选项（一句两空 → 第一排第1空、第二排第2空）
    sentGroups.forEach(function (g) { if (g) v.appendChild(renderSentenceCard(g)); });
    // 语篇：文章固定顶部 + 各空卡片
    passGroups.forEach(function (g, gIdx) { if (g) renderPassageBlock(g, gIdx, '', '语篇'); });

    var act = el('div', 'btn-row');
    act.style.cssText = 'position:sticky;bottom:12px;margin-top:16px';
    var sub = el('button', 'btn block', '全部答完，交卷看成绩');
    sub.id = 'sheetSubmit';
    sub.type = 'button';
    sub.setAttribute && sub.setAttribute('aria-label', '交卷并查看成绩');
    sub.addEventListener('click', function () { submitSheet(); });
    act.appendChild(sub);
    v.appendChild(act);
    if (S.limitSec) startTimer();
    v.scrollIntoView({ block: 'start' });
  }

  function pickSheet(qidx, oi) {
    if (!S) return;
    var q = S.questions[qidx];
    if (!q) return;
    var entry = { qid: q.id, q: q, userText: q.options[oi], ok: oi === q.answerIndex, answerIndex: oi };
    S.answers[qidx] = entry;
    var v = appView();
    if (v) {
      $$('[data-qrow="' + qidx + '"] .sq-opt', v).forEach(function (x) {
        x.classList.toggle('sel', Number(x.dataset.idx) === oi);
      });
    }
    saveDraft();
    updateSheetMeta();
  }
  function updateSheetMeta() {
    if (!S) return;
    // 选择题选中即算已答；输入题要看是否已经打字（S._typed），否则计数永远是 0
    var answered = 0;
    S.questions.forEach(function (q, i) {
      if (q.type === 'choice' && S.answers[i]) { answered++; return; }
      if (q.type !== 'choice' && S._typed && String(S._typed[i] || '').trim()) answered++;
    });
    var elC = $('#sheetCount', appView());
    if (elC) elC.textContent = answered + ' / ' + S.questions.length;
    var sub = $('#sheetSubmit', appView());
    if (sub) sub.textContent = answered === S.questions.length
      ? '已全部作答（' + answered + '/' + S.questions.length + '），交卷看成绩'
      : '已作答 ' + answered + '/' + S.questions.length + '，交卷';
  }
  function syncSheetAnswers() {
    // 未答完交卷后用户仍可修改或清空输入，每次都以当前文本重新判定。
    S.questions.forEach(function (q, i) {
      if (q.type === 'choice') return;
      var t = String((S._typed && S._typed[i]) || '').trim();
      if (t) S.answers[i] = { qid: q.id, q: q, userText: t, ok: E.util.checkInputAnswer(t, q.accepted), answerIndex: undefined };
      else delete S.answers[i];
    });
  }
  function submitSheet(force) {
    if (!S || S._finished) return;
    syncSheetAnswers();
    var missingIdx = -1;
    S.questions.forEach(function (q, i) {
      if (!S.answers[i] && missingIdx < 0) missingIdx = i;
    });
    if (missingIdx >= 0 && !force) {
      var nums = [];
      S.questions.forEach(function (q, i) { if (!S.answers[i]) nums.push((q.aiCtx && q.aiCtx.blankN) || (i + 1)); });
      var shown = nums.slice(0, 6).join('、');
      U.toast('还有 ' + nums.length + ' 空未作答（' + shown + (nums.length > 6 ? '…' : '') + '）', 'bad');
      var v = appView();
      if (v) {
        var card = $('[data-qrow="' + missingIdx + '"]', v);
        if (card && card.scrollIntoView) card.scrollIntoView({ block: 'center' });
      }
      return;
    }
    // 限时到点强制交卷：未作答的空记“未答”，只计分、不进错题本
    if (force) {
      S.questions.forEach(function (q, i) {
        if (!S.answers[i]) S.answers[i] = { qid: q.id, q: q, userText: '', ok: false, skipped: true };
      });
    }
    // 每题耗时：从第一次输入到交卷（没动过的空不计）
    var now = E.util.nowTs();
    S.questions.forEach(function (q, i) {
      var st = S._blankStart && S._blankStart[i];
      if (S.answers[i] && !S.answers[i].sec) S.answers[i].sec = st ? Math.max(1, Math.round((now - st) / 1000)) : 0;
    });
    // 全部答完 → 统计落库 + 出成绩（成绩页含逐空回顾与解析）
    S.questions.forEach(function (q, i) {
      if (S.answers[i]) commitStats(q, S.answers[i], S.answers[i].sec || 0);
    });
    finish();
  }

  /* 选择题作答区（未答） */
  function renderChoiceInput(qbox, q) {
    var sel = -1;
    var opts = el('div', 'opts');
    opts.setAttribute('role', 'group');
    opts.setAttribute('aria-label', '选项');
    function pick(i) {
      sel = i;
      S._sel = i;
      $$('.opt', opts).forEach(function (x, j) {
        x.classList.toggle('sel', j === i);
        if (x.setAttribute) x.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      });
    }
    q.options.forEach(function (text, i) {
      var b = el('button', 'opt');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="L">' + LETTERS[i] + '</span><span>' + esc(text) + '</span>';
      b.addEventListener('click', function () { pick(i); });
      opts.appendChild(b);
    });
    qbox.appendChild(opts);

    var hint = el('div', 'kbd-hint', '键盘：按 <b>' + LETTERS[0] + '–' + LETTERS[q.options.length - 1] + '</b> 或 <b>1–' + q.options.length + '</b> 选择，<b>Enter</b> 提交');
    qbox.appendChild(hint);

    var act = el('div', 'act-row');
    var sub = el('button', 'btn', S.mode === 'blind' ? (lastQ() ? '交卷' : '下一题 →') : '提交答案');
    sub.type = 'button';
    act.appendChild(sub);
    qbox.appendChild(act);
    S._pick = pick;
    S._submitChoice = function () {
      if (sel < 0) { U.toast('请先选择一个答案', 'bad'); return; }
      finishAnswer(q, { answerIndex: sel });
    };
    sub.addEventListener('click', function () { S._submitChoice(); });
  }

  /* 输入题作答区（未答）——支持“有提示词 / 无提示词(纯逻辑填空)”两种 */
  function renderTextInput(qbox, q) {
    var hasHint = !!(q.hint && String(q.hint).trim());
    // 考点 + 填空类型徽章
    var grammarName = (q.aiMeta && q.aiMeta.catName) || (E.bank()[S.topicId] && E.bank()[S.topicId].title) || '';
    var typeLine = el('div', 'qno', '');
    typeLine.style.marginTop = '12px';
    typeLine.innerHTML = '<span class="badge badge-grammar">考点：' + esc(grammarName) + '</span>'
      + (hasHint
        ? ' <span class="badge gray">提示词题 · 结合括号词变形</span>'
        : ' <span class="badge amber">纯逻辑填空 · 介/连/冠/代，无提示词</span>');
    qbox.appendChild(typeLine);

    var row = el('div', 'answer-row');
    var ai = el('div', 'answer-input');
    ai.style.flex = '1';
    ai.style.minWidth = '0';
    ai.innerHTML = '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false"'
      + (hasHint ? '' : ' style="color:var(--warn)"')
      + ' placeholder="' + (hasHint ? '输入变形后的答案，如 was working' : '直接填介/连/冠词等') + '">';
    var inp = $('input', ai);
    S._singleTyped = S._singleTyped || {};
    inp.value = S._singleTyped[S.idx] || '';
    inp.addEventListener('input',function(){ S._singleTyped[S.idx]=inp.value; saveDraft(); });
    row.appendChild(ai);
    if (hasHint) {
      // 提示词字卡：置于输入框右侧
      var hw = el('span', 'hint-word', '(' + esc(String(q.hint).trim()) + ')');
      row.appendChild(hw);
    }
    qbox.appendChild(row);

    // 空位提示：实在看不清空在哪，点开看一眼前后三个词（只给位置，不给答案）
    var pos = el('div', 'pos-hint-row');
    var posBtn = el('button', 'btn ghost sm', '看不清空在哪？');
    posBtn.type = 'button';
    var posBox = el('div', 'pos-hint');
    posBox.style.display = 'none';
    posBox.innerHTML = slotHintHTML(q);
    posBtn.addEventListener('click', function () {
      var on = posBox.style.display !== 'none';
      posBox.style.display = on ? 'none' : '';
      posBtn.textContent = on ? '看不清空在哪？' : '收起';
    });
    pos.appendChild(posBtn);
    pos.appendChild(posBox);
    qbox.appendChild(pos);

    var act = el('div', 'act-row');
    var sub = el('button', 'btn', S.mode === 'blind' ? (lastQ() ? '交卷' : '下一题 →') : '提交');
    sub.type = 'button';
    act.appendChild(sub);
    qbox.appendChild(act);
    var hintLine = el('div', 'kbd-hint', '键盘：<b>Enter</b> 提交，<b>Esc</b> 退出本轮');
    qbox.appendChild(hintLine);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); sub.click(); }
    });
    S._submitText = function () {
      var val = inp.value.trim();
      if (!val) { U.toast('先输入你的答案再提交', 'bad'); return; }
      finishAnswer(q, { userText: val });
    };
    sub.addEventListener('click', function () { S._submitText(); });
    // 桌面端自动聚焦输入框（手机端不抢焦点，避免一进题就弹键盘）
    if (!isTouchLike()) focusSoon(inp);
  }

  /* 统一收答案：判对错 → 记库 → 普通模式展示反馈/盲做直接前进 */
  function finishAnswer(q, res) {
    var ok, userText, answerIndex;
    if (res.answerIndex !== undefined) {
      answerIndex = res.answerIndex;
      ok = answerIndex === q.answerIndex;
      userText = q.options[answerIndex];
    } else {
      userText = res.userText;
      ok = E.util.checkInputAnswer(userText, q.accepted);
    }
    var sec = (S._qStart && (E.util.nowTs() - S._qStart) > 400) ? Math.round((E.util.nowTs() - S._qStart) / 1000) : 0;
    var entry = { qid: q.id, q: q, userText: userText, ok: ok, answerIndex: answerIndex, sec: sec };
    S.answers[S.idx] = entry;
    saveDraft();
    commitStats(q, entry, sec);

    // 复习题：给一句“下次什么时候再见”，比单纯对错更有用
    var reviewLine = '';
    if (S.kind === 'review') {
      var w = null;
      for (var wi = 0; wi < E.data.wrongBook.length; wi++) {
        if (E.data.wrongBook[wi].qid === q.id) { w = E.data.wrongBook[wi]; break; }
      }
      reviewLine = ok
        ? (w && w.mastered ? '　已连续答对 5 次，标为已掌握。' : (w ? '　' + E.ui.dueLabel(w) + '。' : ''))
        : '　回到第一档，今天还会再到期。';
    }

    if (S.mode === 'blind') {
      if (lastQ()) finish();
      else { S.idx++; renderPractice(); }
    } else {
      // 普通模式：显示反馈 + 解析（默认折叠） + 下一题
      var qbox = appView().querySelector('.qbox');
      // 清理旧的作答控件（输入框 / 提交按钮行），避免残留
      $$('.answer-input', qbox).forEach(function (n) { n.remove(); });
      $$('.act-row', qbox).forEach(function (n) { n.remove(); });
      $$('.kbd-hint', qbox).forEach(function (n) { n.remove(); });
      $$('.pos-hint-row', qbox).forEach(function (n) { n.remove(); });
      if (q.type === 'choice') {
        markOptionsRightWrong(qbox, q, answerIndex, ok);
        var fb = el('div', 'fb ' + (ok ? 'ok' : 'bad'));
        fb.setAttribute('role', 'status');
        fb.innerHTML = ok ? '<span class="big">✅</span>回答正确！' + reviewLine : '<span class="big">❌</span>再想一想…然后看解析记规律' + reviewLine;
        qbox.appendChild(fb);
      } else {
        var fb2 = el('div', 'fb ' + (ok ? 'ok' : 'bad'));
        fb2.setAttribute('role', 'status');
        fb2.innerHTML = ok ? '<span class="big">✅</span>回答正确！' + reviewLine : '<span class="big">❌</span>再想一想…然后看解析记规律' + reviewLine;
        qbox.appendChild(fb2);
        var ai = el('div', 'answer-input');
        ai.innerHTML = '<input type="text" disabled value="' + esc(userText) + '">';
        qbox.appendChild(ai);
      }
      appendAnalysis(qbox, q, entry);
      var act = el('div', 'act-row');
      var nx = el('button', 'btn ' + (lastQ() ? 'ok' : ''), lastQ() ? '查看成绩' : '下一题 →');
      nx.type = 'button';
      nx.setAttribute('data-next', '1');
      S._next = function () {
        if (lastQ()) finish(); else { S.idx++; renderPractice(); }
      };
      nx.addEventListener('click', function () { S._next(); });
      act.appendChild(nx);
      qbox.appendChild(act);
    }
  }

  // 标记选项对错：答错时不亮出正确项（保留在解析里），只标红所选
  function markOptionsRightWrong(qbox, q, myIdx, ok) {
    var opts = qbox.querySelector('.opts');
    if (opts) opts.innerHTML = '';
    var container = opts || el('div', 'opts');
    if (!opts) qbox.appendChild(container);
    q.options.forEach(function (text, i) {
      var cls = 'opt';
      if (ok) {
        if (i === q.answerIndex) cls += ' right';
        else cls += ' dim';
      } else {
        if (i === myIdx) cls += ' wrong';
        else cls += ' dim';
      }
      var b = el('div', cls);
      b.innerHTML = '<span class="L">' + LETTERS[i] + '</span><span>' + esc(text) + '</span>';
      container.appendChild(b);
    });
  }

  function appendAnalysis(qbox, q, entry) {
    var corText = q.type === 'choice' ? q.options[q.answerIndex] : (q.answerText || (q.accepted && q.accepted[0]));
    var det = el('details', 'qa explanation-panel');
    // 考点名：AI 题用其大专题，普通题用专题语法点
    var isAI = !!(q.isAI || q.source === 'ai');
    var grammarName = (q.aiMeta && q.aiMeta.catName) || (isAI ? 'AI出题'
      : ((E.bank()[S.topicId] && E.bank()[S.topicId].title) || ''));
    det.innerHTML = '<summary>解析与考点（点击展开）</summary>'
      + U.explanationHTML(q, { correctText: corText, myText: entry.userText, myOk: entry.ok, grammar: grammarName });
    qbox.appendChild(det);
    appendAIExplain(qbox, q);
  }

  /* ---------- AI 讲解：把这道题的解析换成更简单的话（按 qid 缓存） ---------- */
  function appendAIExplain(host, q) {
    if (!E.ai || !E.ai.explainQuestion) return;
    var wrap = el('div', 'ai-explain-row');
    var btn = el('button', 'btn ghost sm', '让 AI 用更简单的话讲这道题');
    btn.type = 'button';
    wrap.appendChild(btn);
    host.appendChild(wrap);
    btn.addEventListener('click', function () { explainQuestion(q); });
  }
  function renderExplainHTML(r) {
    r = r || {};
    var out = '';
    if (r.simple) out += '<p class="ex-simple">' + esc(r.simple) + '</p>';
    if (r.pitfall) out += '<p class="ex-pitfall"><b>最容易混：</b>' + esc(r.pitfall) + '</p>';
    if (r.examples && r.examples.length) {
      out += '<div class="ex-examples"><b>同类例句</b><ul>';
      r.examples.forEach(function (x) { out += '<li>' + esc(x) + '</li>'; });
      out += '</ul></div>';
    }
    if (r.tip) out += '<p class="ex-tip">记一句：' + esc(r.tip) + '</p>';
    return out || '<p class="muted">AI 没有返回内容，请重试。</p>';
  }
  function explainQuestion(q) {
    var cfg = E.ai && E.ai.quickCfg ? E.ai.quickCfg() : null;
    if (!cfg || !cfg.apiKey) {
      U.toast('先在「AI 出题」页填 API Key，才能用 AI 讲解', 'bad');
      return;
    }
    var cached = E.ai.getExplainCache ? E.ai.getExplainCache(q.id) : null;
    var ov = U.modal('<h3>AI 用简单的话讲这道题</h3>'
      + '<div class="ai-explain-body">' + (cached ? renderExplainHTML(cached) : '<p class="muted">正在生成…（约 5–15 秒）</p>') + '</div>'
      + '<div class="btn-row" style="margin-top:12px"><button class="btn ghost" data-exp-close="1">关闭</button></div>');
    var closeBtn = null;
    try { closeBtn = ov.querySelector('[data-exp-close]'); } catch (e) {}
    if (closeBtn) closeBtn.addEventListener('click', function () { if (ov.close) ov.close(); });
    if (cached) return;
    E.ai.explainQuestion(q, cfg).then(function (res) {
      var body = null;
      try { body = ov.querySelector('.ai-explain-body'); } catch (e) {}
      if (body) body.innerHTML = renderExplainHTML(res);
      if (E.ai.setExplainCache) E.ai.setExplainCache(q.id, res);
    }, function (err) {
      var body = null;
      try { body = ov.querySelector('.ai-explain-body'); } catch (e) {}
      if (body) body.innerHTML = '<p class="fb bad">' + esc((err && err.msg) || '生成失败，请重试。') + '</p>';
    });
  }

  function lastQ() { return S.idx >= S.questions.length - 1; }

  /* 已答题的回显（返回/重绘时用） */
  function renderAnswered(qbox, q) {
    var entry = S.answers[S.idx];
    if (entry && !entry.ok && entry.userText && q.accepted) {
      try {
        if (localStorage.getItem('EGL_STRICT_ANSWER_v1')==='true') qbox.appendChild(el('p','fb bad','严格拼写：请对照答案检查词形、空格与撇号。你的输入：'+esc(entry.userText)+'；可接受答案：'+esc(q.accepted.join(' / '))));
      } catch(e) {}
    }

    if (!entry) return;
    if (q.type === 'choice') markOptionsRightWrong(qbox, q, entry.answerIndex, entry.ok);
    var fb = el('div', 'fb ' + (entry.ok ? 'ok' : 'bad'));
    fb.setAttribute('role', 'status');
    fb.innerHTML = entry.ok ? '<span class="big">✅</span>回答正确！' : '<span class="big">❌</span>这题刚才答错了，看解析记规律';
    qbox.appendChild(fb);
    if (q.type !== 'choice') {
      var ai = el('div', 'answer-input');
      ai.innerHTML = '<input type="text" disabled value="' + esc(entry.userText) + '">';
      qbox.appendChild(ai);
    }
    appendAnalysis(qbox, q, entry);
    var act = el('div', 'act-row');
    var nx = el('button', 'btn ' + (lastQ() ? 'ok' : ''), lastQ() ? '查看成绩' : '下一题 →');
    nx.type = 'button';
    nx.addEventListener('click', function () {
      if (lastQ()) finish(); else { S.idx++; renderPractice(); }
    });
    act.appendChild(nx);
    qbox.appendChild(act);
  }

  /* ---------- 单题统计落库（AI 题 / 真题语篇 / 复习 / 专卷） ---------- */
  function commitStats(q, entry, seconds) {
    var isAI = !!(q.isAI || q.source === 'ai');
    var isPaper = !!(q.isPaper || q.source === 'paper');
    var isCustom = !!(q.isCustom || q.source === 'custom');
    var meta = q.aiMeta || {};
    // 统计归属：复习题回原专题；AI/专卷记 ai:大专题；真题语篇记 paper:大专题
    var tid = q._reviewTid
      || (isAI || isCustom ? ('ai:' + (meta.catId || 'extra'))
        : isPaper ? ('paper:' + (meta.catId || 'extra'))
        : S.topicId);
    var tag = q.tag || '未分类';
    E.addDaily(entry.ok ? 1 : 0, 1);
    E.addGlobal(entry.ok ? 1 : 0, 1);
    E.recordTag(tid, tag, entry.ok);
    E.noteAgg(q.type === 'choice' ? 'choice' : 'input', q.difficulty, entry.ok, seconds);

    // 复习题：更新间隔重复排期（答对升档、答错回第一档），不再新建错题
    if (S.kind === 'review') {
      E.reviewWrong(q.id, entry.ok, entry.userText);
      return;
    }
    // 限时到点未作答：只计分，不写错题本（没做不等于错题）
    if (entry.skipped) return;
    if (!entry.ok) {
      var corText = q.type === 'choice' ? q.options[q.answerIndex] : (q.answerText || (q.accepted && q.accepted[0]));
      var topicTitle = isAI ? ('AI · ' + (meta.catName || '语法填空'))
        : isPaper ? ('真题语篇 · ' + (S.title || ''))
        : isCustom ? ('专卷 · ' + (meta.catName || '语法填空'))
        : (E.bank()[S.topicId] ? E.bank()[S.topicId].title : (S.title || ''));
      E.addWrong({
        topicId: tid,
        topicTitle: topicTitle,
        qid: q.id,
        question: q.question,
        tag: tag,
        myAnswer: entry.userText,
        correctAnswer: corText,
        wrongType: q.wrongType || 'CONTEXT_ERROR',
        source: isAI ? 'ai' : isPaper ? 'paper' : isCustom ? 'custom' : 'bank',
        catId: meta.catId || '',
        explText: q.explanation ? (q.explanation.why || '') : '',
        kp: meta.knowledgePoint || tag,
        snapshot: E.snapshotQuestion(q)
      });
    }
  }

  /* ---------- 完成一轮 ---------- */
  function finish() {
    if (!S || S._finished) return;
    clearTimer();
    S._finished = true;
    clearDraft();
    var seconds = Math.round((E.util.nowTs() - S.startTs) / 1000);
    var correct = 0, total = S.questions.length, unanswered = 0;
    S.answers.forEach(function (a) {
      if (a && a.ok) correct++;
      if (a && a.skipped) unanswered++;
    });

    var tid = S.topicId;
    if (S.kind === 'core' && (S.mode === 'normal' || S.mode === 'blind')) {
      E.updateTopicStat(tid, correct, total, S.mode);
    }
    // 真题语篇：整篇成绩记到 paper:<id>，供语篇列表查看
    if (S.kind === 'paper' && S._paperId) {
      E.updateTopicStat('paper:' + S._paperId, correct, total, 'normal');
    }
    var sessLabel = S.kind === 'ai' ? (S.title || 'AI 出题训练')
      : S.kind === 'paper' ? ('真题语篇 · ' + (S.title || ''))
      : S.kind === 'custom' ? ('我的专卷 · ' + (S._custom && S._custom.date || ''))
      : S.kind === 'review' ? '今日复习' : '';
    E.addSession(tid, kindModeName(), correct, total, seconds, sessLabel);
    E.save();

    var choiceC = 0, choiceT = 0, inputC = 0, inputT = 0;
    var errByTag = {}, errByType = {};
    var advN = 0, resetN = 0;
    S.answers.forEach(function (a) {
      if (!a) return;
      if (a.q.type === 'choice') { choiceT++; if (a.ok) choiceC++; }
      else { inputT++; if (a.ok) inputC++; }
      if (S.kind === 'review') { if (a.ok) advN++; else resetN++; }
      if (!a.ok) {
        var tg = a.q.tag || '未分类';
        errByTag[tg] = (errByTag[tg] || 0) + 1;
        errByType[a.q.wrongType || 'OTHER'] = (errByType[a.q.wrongType || 'OTHER'] || 0) + 1;
      }
    });
    renderResult({
      correct: correct, total: total, seconds: seconds, unanswered: unanswered,
      choiceC: choiceC, choiceT: choiceT, inputC: inputC, inputT: inputT,
      errByTag: errByTag, errByType: errByType,
      advN: advN, resetN: resetN
    });
    // 本轮已结束（成绩页）：解除"练习中"保护，允许正常导航
    E.ui.quizActive = false;
  }
  function kindModeName() {
    if (S.kind === 'retrain') return 'retrain';
    if (S.kind === 'challenge') return 'challenge';
    if (S.kind === 'wrongretrain') return 'wrongretrain';
    if (S.kind === 'mixed') return 'mixed';
    if (S.kind === 'ai') return 'ai';
    if (S.kind === 'paper') return 'paper';
    if (S.kind === 'custom') return 'custom';
    if (S.kind === 'review') return 'review';
    return S.mode;
  }

  /* ---------- 成绩页 ---------- */
  function renderResult(m) {
    var v = appView();
    if (!v) return;
    v.innerHTML = '';
    var p = m.correct / m.total;
    var grade = U.gradeOf(m.correct, m.total);
    var isCore = S.kind === 'core';
    var topicFull = E.bank()[S.topicId];

    var hero = el('div', 'glass score-hero');
    hero.style.setProperty('--p', (p * 100));
    hero.style.setProperty('--grade-c', grade.color);
    hero.innerHTML = '<div class="grade-ring"><div class="g" style="color:' + grade.color + '">' + grade.g + '</div>'
      + '<div class="gsub">等级</div></div>'
      + '<div class="big">' + m.correct + ' / ' + m.total + '</div>'
      + '<div class="sub">正确率 ' + pct(p) + ' · 用时 ' + U.fmtTime(m.seconds)
      + (m.unanswered ? ' · 未作答 ' + m.unanswered + ' 空' : '') + '</div>';
    v.appendChild(hero);

    var ov = el('div', 'grid cards3');
    ov.style.marginTop = '12px';
    ov.innerHTML =
      '<div class="glass metric"><div class="v">' + m.correct + '/' + m.total + '</div><div class="k">总正确</div></div>'
      + '<div class="glass metric"><div class="v">' + (m.choiceT ? m.choiceC + '/' + m.choiceT : '—') + '</div><div class="k">选择题</div></div>'
      + '<div class="glass metric"><div class="v">' + (m.inputT ? m.inputC + '/' + m.inputT : '—') + '</div><div class="k">输入题</div></div>';

    var printFrag = '';
    if (S.kind === 'review') printFrag += '<button class="btn ghost sm" data-goto="review">继续今日复习</button>';
    printFrag += '<button class="btn ghost sm" data-print-result="1">打印这份成绩单</button>';
    var resultActs = el('div', 'btn-row');
    resultActs.style.marginTop = '10px';
    resultActs.innerHTML = printFrag;
    v.appendChild(ov);
    v.appendChild(resultActs);

    // 复习结果：升档 / 回炉统计（间隔重复的反馈）
    if (S.kind === 'review') {
      var rv = el('div', 'glass rec-card');
      rv.style.marginTop = '12px';
      rv.innerHTML = '<b>复习进度</b><div class="why">'
        + m.advN + ' 空升了一档（下次隔更久再复习）'
        + (m.resetN ? '；' + m.resetN + ' 空回到第一档，今天还会再到期' : '；没有回炉的')
        + '。</div>'
        + '<div class="small faint" style="margin-top:6px">错题按 1 / 2 / 4 / 7 / 15 天排期，连续答对 5 次算掌握。</div>';
      v.appendChild(rv);
    }

    var wrongTotal = m.total - m.correct;

    // 加练解锁提示（单专题的高难 5 题，不是 20 题综合挑战）
    if (isCore && p >= 0.9) {
      var ul = el('div', 'glass rec-card');
      ul.style.marginTop = '12px';
      ul.innerHTML = '<b>「加练 · 高难 5 题」已解锁！</b>'
        + '<div class="why">正确率 ≥90%！做 5 道「全输入 · 15-30 词 · 无提示」的题，检验真功夫。</div>'
        + '<div class="btn-row" style="margin-top:10px"><button class="btn warn sm" data-chal="1">开始加练</button></div>';
      v.appendChild(ul);
    }

    // 主要问题
    var tagKeys = Object.keys(m.errByTag);
    if (tagKeys.length) {
      var pr = el('div', 'glass', '');
      pr.style.marginTop = '12px';
      pr.style.padding = '14px 16px';
      var chips = tagKeys.map(function (k) {
        return '<span class="problem-chip"><b>' + m.errByTag[k] + '</b> 空 · ' + esc(k) + '</span>';
      }).join('');
      pr.innerHTML = '<div class="sec-title" style="margin-top:0">你的主要问题</div><div>' + chips + '</div>';
      v.appendChild(pr);

      var topTag = tagKeys[0];
      var sug = el('div', 'glass rec-card');
      sug.style.marginTop = '12px';
      // 真题语篇 / AI 题没有题库可回炉，给它们自己的下一步
      if (S.kind === 'paper') {
        sug.innerHTML = '<div class="sec-title" style="margin-top:0">建议</div>'
          + '<p class="muted small">先对着解析把 <b>' + esc(topTag) + '</b> 那几空想明白，再把整篇重做一遍——'
          + '同一篇能全对，才说明这个考点真的会了。</p>'
          + '<div class="btn-row" style="margin-top:10px">'
          + '<button class="btn ok sm" data-repaper="1">整篇再做一遍</button>'
          + '<button class="btn ghost sm" data-goto="papers">返回真题语篇</button></div>';
      } else if (S.kind === 'ai') {
        sug.innerHTML = '<div class="sec-title" style="margin-top:0">建议</div>'
          + '<p class="muted small">针对 <b>' + esc(topTag) + '</b> 再生成一组新题，比重复做同一套更有效。</p>'
          + '<div class="btn-row" style="margin-top:10px">'
          + '<button class="btn ok sm" data-goto="ai">再生成一组 AI 题</button>'
          + '<button class="btn ghost sm" data-goto="wrong">去错题本</button></div>';
      } else if (S.kind === 'review') {
        sug.innerHTML = '<div class="sec-title" style="margin-top:0">建议</div>'
          + '<p class="muted small">这次回炉的 <b>' + esc(topTag) + '</b> 还不稳。按排期继续复习，比马上再刷新题更划算。</p>'
          + '<div class="btn-row" style="margin-top:10px">'
          + '<button class="btn ok sm" data-goto="review">继续今日复习</button>'
          + '<button class="btn ghost sm" data-goto="wrong">去错题本</button></div>';
      } else if (S.kind === 'custom') {
        sug.innerHTML = '<div class="sec-title" style="margin-top:0">建议</div>'
          + '<p class="muted small">这套卷是按你当时的薄弱点组的。<b>' + esc(topTag) + '</b> 错了，重新组一套会换新题、并提高弱项权重。</p>'
          + '<div class="btn-row" style="margin-top:10px">'
          + '<button class="btn ok sm" data-goto="custom">重新组卷</button>'
          + '<button class="btn ghost sm" data-goto="weak">看薄弱点</button></div>';
      } else {
        sug.innerHTML = '<div class="sec-title" style="margin-top:0">建议</div>'
          + '<p class="muted small">先回看知识卡 → 再用「再练 5 题」专攻 <b>' + esc(topTag) + '</b>（会生成全新句子，不重复）。</p>'
          + '<div class="btn-row" style="margin-top:10px">'
          + '<button class="btn ok sm" data-retrain="1">再练 5 题</button>'
          + '<button class="btn ghost sm" data-topic="' + S.topicId + '">回看知识卡</button></div>';
      }
      v.appendChild(sug);
    }

    // 逐题回顾（可只看错题）
    var rev = el('div', 'rev-list');
    var revHead = el('div', 'rev-head');
    revHead.innerHTML = '<div class="rev-title">逐题回顾（点开看答案与解析）</div>'
      + '<div class="seg rev-toggle"><button type="button" class="on" data-rev="all">全部</button>'
      + '<button type="button" data-rev="wrong"' + (wrongTotal ? '' : ' disabled') + '>只看错题' + (wrongTotal ? '（' + wrongTotal + '）' : '') + '</button></div>';
    rev.appendChild(revHead);
    S.answers.forEach(function (a, i) {
      if (!a) return;
      var card = el('div', 'glass wb-item ' + (a.ok ? 'ok' : 'bad'));
      card.style.borderLeftColor = a.ok ? 'var(--ok)' : 'var(--bad)';
      var unit = (isSheetKind(S.kind) || S.kind === 'review') ? '空' : '题';
      var head = '<div class="head"><span class="badge ' + (a.ok ? 'green' : 'red') + '">第' + (i + 1) + unit + ' · ' + (a.ok ? '对' : '错') + '</span>'
        + (a.skipped ? '<span class="badge gray">限时未答</span>' : '')
        + (a.q.tag ? '<span class="badge blue">' + esc(a.q.tag) + '</span>' : '')
        + (a.q.type === 'choice' ? '<span class="badge gray">选择</span>' : '<span class="badge gray">输入</span>') + '</div>';
      var corText = a.q.type === 'choice' ? a.q.options[a.q.answerIndex] : (a.q.answerText || (a.q.accepted && a.q.accepted[0]));
      card.innerHTML = head + '<div class="q">' + esc(a.q.question) + '</div>'
        + '<div class="wb-meta"><span>我的答案：<span style="color:' + (a.ok ? 'var(--ok)' : 'var(--bad)') + ';font-weight:700">'
        + esc(a.skipped ? '（未作答）' : (a.userText || '（未答）')) + '</span></span>'
        + '<span>正确答案：<span class="cora">' + esc(corText) + '</span></span></div>';
      var det = el('details', 'qa explanation-panel');
      var revIsAI = !!(a.q.isAI || a.q.source === 'ai');
      var gName = (a.q.aiMeta && a.q.aiMeta.catName) || (revIsAI ? 'AI出题'
        : ((E.bank()[S.topicId] && E.bank()[S.topicId].title) || ''));
      det.innerHTML = '<summary>查看解析与考点</summary>' + U.explanationHTML(a.q, { correctText: corText, myText: a.userText, myOk: a.ok, grammar: gName });
      card.appendChild(det);
      appendAIExplain(card, a.q);
      rev.appendChild(card);
    });
    v.appendChild(rev);
    $$('[data-rev]', revHead).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        $$('[data-rev]', revHead).forEach(function (x) { x.classList.toggle('on', x === b); });
        rev.classList.toggle('only-wrong', b.dataset.rev === 'wrong');
      });
    });

    // 5 句话复习 + 考场判断（核心专题）
    if (topicFull && (topicFull.review5 || topicFull.examFlow)) {
      var sum = el('details', 'panel');
      sum.style.marginTop = '12px';
      sum.innerHTML = '<summary>专题总结 · 5 句话复习<span class="arr">▶</span></summary><div class="inner">';
      if (topicFull.review5) {
        sum.lastChild.innerHTML += '<div class="sec-title" style="margin-top:4px">今天只需要记住</div>';
        topicFull.review5.forEach(function (ln) { sum.lastChild.innerHTML += '<p style="font-size:14px">' + esc(ln) + '</p>'; });
      }
      if (topicFull.examFlow) {
        sum.lastChild.innerHTML += '<div class="sec-title">考场判断顺序</div><ol class="ex-flow">';
        topicFull.examFlow.forEach(function (s) { sum.lastChild.innerHTML += '<li>' + esc(s) + '</li>'; });
        sum.lastChild.innerHTML += '</ol>';
      }
      sum.lastChild.innerHTML += '</div>';
      v.appendChild(sum);
    }

    // 综合挑战知识点分析
    if (S.kind === 'mixed') {
      var byTag = {};
      S.answers.forEach(function (a) {
        if (!a) return;
        byTag[a.q.tag] = byTag[a.q.tag] || { c: 0, t: 0 };
        byTag[a.q.tag].t++;
        if (a.ok) byTag[a.q.tag].c++;
      });
      var tb = el('div', 'glass', '');
      tb.style.marginTop = '12px';
      tb.style.padding = '12px 16px';
      var rows = '<table class="mini-table"><tr><th>时态考点</th><th>答对</th><th>正答率</th></tr>';
      Object.keys(byTag).forEach(function (k) {
        var it = byTag[k];
        rows += '<tr><td>' + esc(k) + '</td><td>' + it.c + '/' + it.t + '</td><td>' + pct(it.c / it.t) + '</td></tr>';
      });
      rows += '</table>';
      tb.innerHTML = '<div class="sec-title" style="margin-top:0">综合挑战 · 知识点分析</div>' + rows;
      v.appendChild(tb);
    }

    // AI 题知识点分析（按 knowledgePoint 汇总，含错题回溯入口）
    if (S.kind === 'ai') {
      var aiBy = {};
      S.answers.forEach(function (a) {
        if (!a) return;
        var kp = (a.q.aiMeta && a.q.aiMeta.knowledgePoint) || a.q.tag || '未分类';
        aiBy[kp] = aiBy[kp] || { c: 0, t: 0 };
        aiBy[kp].t++;
        if (a.ok) aiBy[kp].c++;
      });
      var ab = el('div', 'glass', '');
      ab.style.marginTop = '12px';
      ab.style.padding = '12px 16px';
      var rows2 = '<table class="mini-table"><tr><th>知识点</th><th>答对</th><th>正答率</th></tr>';
      Object.keys(aiBy).forEach(function (k) {
        var it = aiBy[k];
        rows2 += '<tr><td>' + esc(k) + '</td><td>' + it.c + '/' + it.t + '</td><td>' + pct(it.c / it.t) + '</td></tr>';
      });
      rows2 += '</table>';
      ab.innerHTML = '<div class="sec-title" style="margin-top:0">AI 题 · 知识点分析（已计入大专题能力）</div>' + rows2
        + '<p class="faint small" style="margin-top:6px">做错的空已进入错题本并标记来源“AI训练”；可在错题本与能力总览中追踪。</p>';
      v.appendChild(ab);
    }

    // 真题语篇：本篇考点分布（让每篇做完都能回顾“这 10 空考了什么”）
    if (S.kind === 'paper' && S._paperId) {
      var paperObj = E.paperById(S._paperId);
      var pb = E.paperBreakdown(paperObj);
      var pbCard = el('div', 'glass', '');
      pbCard.style.marginTop = '12px';
      pbCard.style.padding = '14px 16px';
      var pbRows = '<table class="mini-table"><tr><th>大类</th><th>空数</th><th>本篇考到的细点</th></tr>';
      pb.forEach(function (c) {
        pbRows += '<tr><td>' + esc(c.name) + '</td><td>' + c.count + '</td><td>' + esc(c.points.join('；')) + '</td></tr>';
      });
      pbRows += '</table>';
      pbCard.innerHTML = '<div class="sec-title" style="margin-top:0">本篇考点分布（' + (paperObj ? paperObj.blanks.length : 0) + ' 空）</div>'
        + pbRows
        + '<p class="faint small" style="margin-top:6px">同一篇里同一大类出现多次是正常的（真卷也是这么配的）；'
        + '真正要记住的是每空的“判断依据”，不是把答案背下来。</p>';
      v.appendChild(pbCard);
    }

    // 底部
    var foot = el('div', 'btn-row');
    foot.style.marginTop = '14px';
    var tidNow = S.topicId, modeNow = S.mode, kindNow = S.kind;
    var againTxt = kindNow === 'review' ? '再复习一轮' : kindNow === 'custom' ? '再做一遍' : '再练一轮';
    var again = el('button', 'btn', againTxt);
    again.addEventListener('click', function () {
      if (kindNow === 'core') startCore(tidNow, modeNow);
      else if (kindNow === 'challenge') startChallenge(tidNow);
      else if (kindNow === 'retrain') startRetrain(tidNow, Object.keys(m.errByTag)[0] || null);
      else if (kindNow === 'wrongretrain') startWrongRetrain(tidNow);
      else if (kindNow === 'paper') {
        if (S._paperId) startPaper(S._paperId, { timed: !!S.limitSec }); else E.ui.go('papers', true);
      }
      else if (kindNow === 'ai') {
        // 用同一组 AI 题重做；无缓存则回到 AI 页
        if (S._aiQuestions && S._aiQuestions.length) {
          E.quiz.startAI(S._aiQuestions, S._aiMeta || { mode: S.mode });
        } else if (E.aiUI && E.aiUI.resumeTraining) {
          E.aiUI.resumeTraining(S.mode);
        } else { E.ui.go('ai', true); }
      }
      else if (kindNow === 'review') startReview();
      else if (kindNow === 'custom') startCustom({ timed: !!S.limitSec });
      else startMixed(modeNow);
    });
    var backLabel = kindNow === 'paper' ? '返回真题语篇'
      : kindNow === 'review' ? '返回错题本'
      : kindNow === 'custom' ? '返回我的专卷' : '返回列表';
    var backRoute = kindNow === 'paper' ? 'papers'
      : kindNow === 'review' ? 'wrong'
      : kindNow === 'custom' ? 'custom' : 'topics';
    var back = el('button', 'btn ghost', backLabel);
    back.addEventListener('click', function () { E.ui.go(backRoute, true); });
    var home = el('button', 'btn ghost', '首页');
    home.addEventListener('click', function () { E.ui.go('home', true); });
    foot.appendChild(again);
    // 核心整轮结束后：始终提供"再练5题(新题)"（需求§24）
    if (kindNow === 'core' && S.topicId !== 'challenge') {
      var r5 = el('button', 'btn warn', '再练 5 题 · 新句子');
      r5.addEventListener('click', function () {
        startRetrain(S.topicId, Object.keys(m.errByTag)[0] || null);
      });
      foot.appendChild(r5);
    }
    foot.appendChild(back); foot.appendChild(home);
    v.appendChild(foot);

    $$('[data-chal]', v).forEach(function (b) {
      b.addEventListener('click', function () { startChallenge(S.topicId); });
    });
    $$('[data-retrain]', v).forEach(function (b) {
      b.addEventListener('click', function () {
        var tag = Object.keys(m.errByTag)[0] || '';
        startRetrain(S.topicId, tag);
      });
    });
    $$('[data-topic]', v).forEach(function (b) {
      b.addEventListener('click', function () { E.ui.go('topic/' + b.dataset.topic, true); });
    });
    $$('[data-repaper]', v).forEach(function (b) {
      b.addEventListener('click', function () { if (S._paperId) startPaper(S._paperId); });
    });
    $$('[data-goto]', v).forEach(function (b) {
      b.addEventListener('click', function () { E.ui.go(b.dataset.goto, true); });
    });
    $$('[data-print-result]', v).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!E.print || !E.print.result) { U.toast('当前版本不支持打印', 'bad'); return; }
        E.print.result({
          title: S.title, kind: S.kind, modeLabel: S.modeLabel,
          date: E.util.todayStr(), correct: m.correct, total: m.total,
          seconds: m.seconds, unanswered: m.unanswered || 0,
          answers: S.answers.map(function (a) {
            return a ? { q: a.q, userText: a.userText, ok: a.ok, skipped: a.skipped } : null;
          })
        });
      });
    });
    v.scrollIntoView({ block: 'start' });
  }

  /* ---------- 退出 ---------- */
  function askExit() {
    if (!S || S._finished) return;
    var session = S;
    var kind = S.kind;
    var wasTimed = !!S.limitSec;
    // 先停表再弹确认框：避免用户还在犹豫时倒计时到点自动交卷（会重复落库）
    clearTimer();
    U.confirmBox('退出本轮练习', '已答题目会计入统计，但整轮成绩不计入专题。确定退出？', '退出', true).then(function (ok) {
      if (S !== session || session._finished) return;
      if (!ok) { if (wasTimed && S && !S._finished) startTimer(); return; }
      // 整篇卷面模式（AI 题 / 真题语篇 / 专卷）：退出前把已作答的空落库（与交卷同一逻辑）
      if (isSheetKind(kind) && S._sheetMode && S.questions) {
        syncSheetAnswers();
        S.questions.forEach(function (q, i) {
          if (S.answers[i]) commitStats(q, S.answers[i], S.answers[i].sec || 0);
        });
      }
      clearTimer();
      clearDraft();
      S = null;
      E.ui.quizActive = false;
      if (kind === 'ai') E.ui.go('ai', true);
      else if (kind === 'paper') E.ui.go('papers', true);
      else if (kind === 'review') E.ui.go('wrong', true);
      else if (kind === 'custom') E.ui.go('custom', true);
      else E.ui.go('topics', true);
    });
  }

  /* ---------- 综合挑战入口 ---------- */
  function mixedGate() {
    var v = appView();
    if (!v) return;
    var ch = E.bank().challenge;
    if (!ch) return;
    var locked = !(E.ui.allCoreFinished && E.ui.allCoreFinished());
    v.innerHTML = '';
    var card = el('div', 'glass', '');
    card.style.padding = '20px';
    card.innerHTML = '<div class="page-title">综合挑战 · 20 题</div>'
      + '<div class="page-sub">20 题大综合：前 10 选择、后 10 输入；七大时态混合，不提示考点，检验真实判断力。'
      + '（单专题的「加练 · 高难 5 题」在专题页，是另一回事。）</div>'
      + (locked ? '<div class="fb bad" style="margin-top:16px">需先完成全部 ' + E.availableTopicIds().length + ' 个专题（每个至少一整轮）</div>' : '')
      + '<div class="mode-grid" style="margin-top:16px">'
      + '<div class="mode-card glass" data-m="normal"><h4>普通模式</h4><p>每题即时反馈，边做边学。</p></div>'
      + '<div class="mode-card glass" data-m="blind"><h4>盲做模式（模拟考试）</h4><p>20 题一口气做完，再统一看成绩与解析。</p></div>'
      + '</div>';
    v.appendChild(card);
    $$('[data-m]', card).forEach(function (c) {
      if (locked) c.style.opacity = '0.45';
      c.addEventListener('click', function () { if (!locked) startMixed(c.dataset.m); });
    });
  }

  E.quiz = {
    resetActiveSession: function(){clearTimer();S=null;E.ui.quizActive=false;},
    resumeDraft: resumeDraft, showResumeBanner: showResumeBanner, readDraft: readDraft,
    startCore: startCore, startChallenge: startChallenge, startRetrain: startRetrain,
    startWrongRetrain: startWrongRetrain, startMixed: startMixed, mixedGate: mixedGate,
    startAI: startAI, startPaper: startPaper, askExit: askExit,
    startReview: startReview, startCustom: startCustom, explain: explainQuestion,
    isActive: function () { return !!S; }
  };
})();
