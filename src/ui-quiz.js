/* ============================================================
 * ui-quiz.js — 练习流程引擎（逐题作答/盲做/挑战/再练/综合挑战）
 * ============================================================ */
(function () {
  'use strict';
  var E = window.EGL, U = E.u;
  var $ = U.$, $$ = U.$$, el = U.el, esc = U.esc, pct = U.pct;

  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var S = null; // session

  function appView() { return E.ui && E.ui.app ? E.ui.app.view : null; }

  /* ---------- 启动 ---------- */
  function startCore(tid, mode) {
    var topic = E.bank()[tid];
    if (!topic) return;
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
    S = {
      kind: 'challenge', mode: 'normal', topicId: tid, title: topic.title, icon: topic.icon,
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(),
      modeLabel: '🎯 挑战模式（全输入）'
    };
    E.ui.quizActive = true;
    renderPractice();
  }
  function startRetrain(tid, tag) {
    var topic = E.bank()[tid];
    if (!topic) return;
    var qs = E.pickRetrain(tid, tag || null, 5);
    if (!qs.length) { U.toast('暂无可再练题目', 'bad'); return; }
    S = {
      kind: 'retrain', mode: 'normal', topicId: tid, title: topic.title, icon: topic.icon,
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(),
      modeLabel: '♻️ 再练 5 题' + (tag ? '（' + tag + '）' : '')
    };
    E.ui.quizActive = true;
    renderPractice();
  }
  function startWrongRetrain(tid) {
    var topic = E.bank()[tid];
    if (!topic) return;
    var qs = E.pickWrongRetrain(tid, 5);
    if (!qs.length) { U.toast('该专题还没有可回炉的输入错题', 'bad'); return; }
    S = {
      kind: 'wrongretrain', mode: 'normal', topicId: tid, title: topic.title, icon: topic.icon,
      questions: qs, idx: 0, answers: [], startTs: E.util.nowTs(), modeLabel: '📕 错题回炉 5 题'
    };
    E.ui.quizActive = true;
    renderPractice();
  }
  function startMixed(mode) {
    var ch = E.bank().challenge;
    if (!ch || !ch.questions || !ch.questions.length) return;
    mode = mode || 'normal';
    S = {
      kind: 'mixed', mode: mode, topicId: 'challenge', title: ch.title || '时态综合挑战', icon: ch.icon || '🧪',
      questions: ch.questions.slice(), idx: 0, answers: [], startTs: E.util.nowTs(),
      modeLabel: '🧪 时态综合挑战 · ' + (mode === 'blind' ? '盲做' : '普通')
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
    S = {
      kind: 'ai', mode: mode, topicId: 'ai', title: meta.title || 'AI 出题训练',
      icon: meta.icon || '🤖', subtitle: meta.subtitle || '',
      questions: questions.slice(), idx: 0, answers: [], startTs: E.util.nowTs(),
      modeLabel: '🤖 AI 生成 · ' + (mode === 'blind' ? '盲做' : '普通'),
      _aiQuestions: questions.slice(), _aiMeta: meta
    };
    E.ui.quizActive = true;
    renderPractice();
  }

  /* ---------- 练习主屏 ---------- */
  function renderPractice() {
    var v = appView();
    if (!v || !S) return;
    // AI 语篇题：整篇一次展示、全部空一起作答（用户明确要求，不要一空一空翻）
    if (S.kind === 'ai') { renderSheetAI(); return; }
    v.innerHTML = '';
    var topic = E.bank()[S.topicId];

    var head = el('div', 'learn-head glass');
    head.innerHTML = '<button class="btn ghost sm" data-exit="1">✕</button>'
      + '<span style="font-size:26px">' + (S.icon || '📘') + '</span>'
      + '<div class="tt">' + esc(S.title) + '</div>'
      + '<div class="mode">' + esc(S.modeLabel) + (S.kind === 'core' ? ' · 12题 · 1-6选择/7-12输入' : '') + '</div>'
      + '<span class="pn">' + (S.idx + 1) + ' / ' + S.questions.length + '</span>';    v.appendChild(head);

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
      det.innerHTML = '<summary>📘 知识卡<span class="arr">▶</span></summary><div class="inner">'
        + U.knowledgeCardHTML(topic) + '</div>';
      aside.appendChild(det);
      layout.appendChild(aside);
    }

    var q = S.questions[S.idx];
    var qbox = el('div', 'qbox glass');
    qbox.dataset.qid = q.id;
    var isAI = !!(q.isAI || q.source === 'ai');
    var aiMeta = q.aiMeta || {};
    var grammarName = isAI ? (aiMeta.catName || 'AI出题')
      : ((E.bank()[S.topicId] && E.bank()[S.topicId].title) || '');
    var chip = q.type === 'choice' ? '🔤 点选选择题（点 A/B/C…，不用打字）' : '✍️ 输入题（自己拼写）';
    qbox.appendChild(el('div', 'qno',
      '<span class="badge badge-grammar">考点：' + esc(grammarName) + '</span> '
      + (isAI ? '<span class="badge gray">🤖 AI 题</span> ' : '')
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
      if (i < parts.length - 1) out.push('<span class="passage-blank">(' + (i + 1) + ')______</span>');
    }
    return '<div class="passage-body">' + out.join('') + '</div>';
  }
  function renderSheetAI() {
    var v = appView();
    if (!v || !S) return;
    S._sheetMode = true;
    S._typed = [];
    v.innerHTML = '';

    var head = el('div', 'learn-head glass');
    head.innerHTML = '<button class="btn ghost sm" data-exit="1">✕</button>'
      + '<span style="font-size:26px">' + (S.icon || '🤖') + '</span>'
      + '<div class="tt">' + esc(S.title) + '</div>'
      + '<div class="mode">整篇卷面 · 全部空一起作答，答完统一交卷看解析</div>'
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
          + (q.type === 'choice' ? '' : ' <span class="badge amber">填空输入</span>');
        card.appendChild(h);
        var stem = el('div', 'sq-stem');
        stem.style.cssText = 'font-size:15px;line-height:1.9;margin-top:8px;color:var(--ink-dim)';
        stem.innerHTML = U.renderSentence(q, { hideInlineHint: true });
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
          (function (qidx) {
            inp.addEventListener('input', function () { S._typed[qidx] = inp.value; updateSheetMeta(); });
            inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitSheet(); });
          })(it.i);
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
          out.push('<span class="passage-blank">(' + bi + ')______'
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
          (function (qidx) {
            inp.addEventListener('input', function () { S._typed[qidx] = inp.value; updateSheetMeta(); });
            inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitSheet(); });
          })(it.i);
          sub.appendChild(ai);
        }
        card.appendChild(sub);
      });
      return card;
    }

    function renderPassageBlock(g, gIdx, headIcon, headLabel) {
      var paper = el('div', 'passage-panel sheet-paper sheet-paper-top');
      paper.style.marginTop = (gIdx === 0 ? '12px' : '16px');
      var t = el('div', 'passage-title', headIcon + ' ' + esc(g.ctx.title || (headLabel + ' ' + (gIdx + 1)))
        + ' <span class="faint small" style="font-weight:500">本区固定顶部 · 通读后在下方作答</span>');
      paper.appendChild(t);
      paper.appendChild(el('div', '', sheetPassageHTML(g.ctx)));
      v.appendChild(paper);
      v.appendChild(renderCards(g));
    }

    // 单句：每句一次展示 + 每空一排选项（一句两空 → 第一排第1空、第二排第2空）
    sentGroups.forEach(function (g) { if (g) v.appendChild(renderSentenceCard(g)); });
    // 语篇：文章固定顶部 + 各空卡片
    passGroups.forEach(function (g, gIdx) { if (g) renderPassageBlock(g, gIdx, '📄', '语篇'); });

    var act = el('div', 'btn-row');
    act.style.cssText = 'position:sticky;bottom:12px;margin-top:16px';
    var sub = el('button', 'btn block', '✅ 全部答完，交卷看成绩');
    sub.id = 'sheetSubmit';
    sub.type = 'button';
    sub.addEventListener('click', submitSheet);
    act.appendChild(sub);
    v.appendChild(act);
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
    updateSheetMeta();
  }
  function updateSheetMeta() {
    if (!S) return;
    var answered = S.answers.filter(function (a) { return !!a; }).length;
    var elC = $('#sheetCount', appView());
    if (elC) elC.textContent = answered + ' / ' + S.questions.length;
    var sub = $('#sheetSubmit', appView());
    if (sub) sub.textContent = answered === S.questions.length
      ? '✅ 已全部作答（' + answered + '/' + S.questions.length + '），交卷看成绩'
      : '✅ 已作答 ' + answered + '/' + S.questions.length + '，交卷';
  }
  function submitSheet() {
    if (!S) return;
    // 兜底填空输入：把已输入的文本补成条目
    S.questions.forEach(function (q, i) {
      if (!S.answers[i] && q.type !== 'choice' && S._typed && S._typed[i] && String(S._typed[i]).trim()) {
        var t = String(S._typed[i]).trim();
        S.answers[i] = { qid: q.id, q: q, userText: t, ok: E.util.checkInputAnswer(t, q.accepted), answerIndex: undefined };
      }
    });
    var missingIdx = -1;
    S.questions.forEach(function (q, i) {
      if (!S.answers[i] && missingIdx < 0) missingIdx = i;
    });
    if (missingIdx >= 0) {
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
    // 全部答完 → 统计落库 + 出成绩（成绩页含逐空回顾与解析）
    S.questions.forEach(function (q, i) {
      if (S.answers[i]) commitStats(q, S.answers[i]);
    });
    finish();
  }

  /* 选择题作答区（未答） */
  function renderChoiceInput(qbox, q) {
    var sel = -1;
    var opts = el('div', 'opts');
    q.options.forEach(function (text, i) {
      var b = el('button', 'opt');
      b.type = 'button';
      b.innerHTML = '<span class="L">' + LETTERS[i] + '</span><span>' + esc(text) + '</span>';
      b.addEventListener('click', function () {
        $$('.opt', opts).forEach(function (x, j) { x.classList.toggle('sel', j === i); });
        sel = i;
      });
      opts.appendChild(b);
    });
    qbox.appendChild(opts);

    var act = el('div', 'act-row');
    var sub = el('button', 'btn', S.mode === 'blind' ? (lastQ() ? '交卷' : '下一题 →') : '提交答案');
    sub.type = 'button';
    act.appendChild(sub);
    qbox.appendChild(act);
    sub.addEventListener('click', function () {
      if (sel < 0) { U.toast('请先选择一个答案', 'bad'); return; }
      finishAnswer(q, { answerIndex: sel });
    });
  }

  /* 输入题作答区（未答）——支持“有提示词 / 无提示词(纯逻辑填空)”两种 */
  function renderTextInput(qbox, q) {
    var hasHint = !!(q.hint && String(q.hint).trim());
    // 考点 + 填空类型徽章
    var grammarName = (E.bank()[S.topicId] && E.bank()[S.topicId].title) || '';
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
    row.appendChild(ai);
    if (hasHint) {
      // 提示词字卡：置于输入框右侧
      var hw = el('span', 'hint-word', '(' + esc(String(q.hint).trim()) + ')');
      row.appendChild(hw);
    }
    qbox.appendChild(row);

    var act = el('div', 'act-row');
    var sub = el('button', 'btn', S.mode === 'blind' ? (lastQ() ? '交卷' : '下一题 →') : '提交');
    sub.type = 'button';
    act.appendChild(sub);
    qbox.appendChild(act);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') sub.click(); });
    sub.addEventListener('click', function () {
      var val = inp.value.trim();
      if (!val) { U.toast('先输入你的答案再提交', 'bad'); return; }
      finishAnswer(q, { userText: val });
    });
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
    var entry = { qid: q.id, q: q, userText: userText, ok: ok, answerIndex: answerIndex };
    S.answers[S.idx] = entry;
    commitStats(q, entry);

    if (S.mode === 'blind') {
      if (lastQ()) finish();
      else { S.idx++; renderPractice(); }
    } else {
      // 普通模式：显示反馈 + 解析（默认折叠） + 下一题
      var qbox = appView().querySelector('.qbox');
      // 清理旧的作答控件（输入框 / 提交按钮行），避免残留
      $$('.answer-input', qbox).forEach(function (n) { n.remove(); });
      $$('.act-row', qbox).forEach(function (n) { n.remove(); });
      if (q.type === 'choice') {
        markOptionsRightWrong(qbox, q, answerIndex, ok);
        var fb = el('div', 'fb ' + (ok ? 'ok' : 'bad'));
        fb.innerHTML = ok ? '<span class="big">✅</span>回答正确！' : '<span class="big">❌</span>再想一想…然后看解析记规律';
        qbox.appendChild(fb);
      } else {
        var fb2 = el('div', 'fb ' + (ok ? 'ok' : 'bad'));
        fb2.innerHTML = ok ? '<span class="big">✅</span>回答正确！' : '<span class="big">❌</span>再想一想…然后看解析记规律';
        qbox.appendChild(fb2);
        var ai = el('div', 'answer-input');
        ai.innerHTML = '<input type="text" disabled value="' + esc(userText) + '">';
        qbox.appendChild(ai);
      }
      appendAnalysis(qbox, q, entry);
      var act = el('div', 'act-row');
      var nx = el('button', 'btn ' + (lastQ() ? 'ok' : ''), lastQ() ? '🏁 查看成绩' : '下一题 →');
      nx.type = 'button';
      nx.addEventListener('click', function () {
        if (lastQ()) finish(); else { S.idx++; renderPractice(); }
      });
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
    var grammarName = isAI ? ((q.aiMeta && q.aiMeta.catName) || 'AI出题')
      : ((E.bank()[S.topicId] && E.bank()[S.topicId].title) || '');
    det.innerHTML = '<summary>📖 解析与考点（点击展开）</summary>'
      + U.explanationHTML(q, { correctText: corText, myText: entry.userText, myOk: entry.ok, grammar: grammarName });
    qbox.appendChild(det);
  }

  function lastQ() { return S.idx >= S.questions.length - 1; }

  /* ---------- 单题统计落库（AI 题含来源/年级/阶段/大专题标记） ---------- */
  function commitStats(q, entry) {
    var isAI = !!(q.isAI || q.source === 'ai');
    var meta = q.aiMeta || {};
    // AI 题按所属大专题计入 tag（topicId 形如 ai:verb），用于能力总览
    var tid = isAI ? ('ai:' + (meta.catId || 'verb')) : S.topicId;
    var tag = q.tag || '未分类';
    E.addDaily(entry.ok ? 1 : 0, 1);
    E.addGlobal(entry.ok ? 1 : 0, 1);
    E.recordTag(tid, tag, entry.ok);
    if (!entry.ok) {
      var corText = q.type === 'choice' ? q.options[q.answerIndex] : (q.answerText || (q.accepted && q.accepted[0]));
      var topicTitle = isAI ? ((meta.gradeName || 'AI') + ' · ' + (meta.catName || 'AI出题')) : (E.bank()[S.topicId] ? E.bank()[S.topicId].title : S.title);
      E.addWrong({
        topicId: tid,
        topicTitle: topicTitle,
        qid: q.id,
        question: q.question,
        tag: tag,
        myAnswer: entry.userText,
        correctAnswer: corText,
        wrongType: q.wrongType || 'CONTEXT_ERROR',
        source: isAI ? 'ai' : 'bank',
        grade: meta.gradeName || '',
        stage: meta.stage || '',
        catId: meta.catId || '',
        explText: isAI ? (q.explanation ? q.explanation.why : '') : '',
        kp: meta.knowledgePoint || tag
      });
    }
  }

  /* ---------- 完成一轮 ---------- */
  function finish() {
    var seconds = Math.round((E.util.nowTs() - S.startTs) / 1000);
    var correct = 0, total = S.questions.length;
    S.answers.forEach(function (a) { if (a && a.ok) correct++; });

    var tid = S.topicId;
    if (S.kind === 'core' && (S.mode === 'normal' || S.mode === 'blind')) {
      E.updateTopicStat(tid, correct, total, S.mode);
    }
    var sessLabel = S.kind === 'ai' ? (S.title || 'AI 出题训练') : '';
    E.addSession(tid, kindModeName(), correct, total, seconds, sessLabel);
    E.save();

    var choiceC = 0, choiceT = 0, inputC = 0, inputT = 0;
    var errByTag = {}, errByType = {};
    S.answers.forEach(function (a) {
      if (!a) return;
      if (a.q.type === 'choice') { choiceT++; if (a.ok) choiceC++; }
      else { inputT++; if (a.ok) inputC++; }
      if (!a.ok) {
        var tg = a.q.tag || '未分类';
        errByTag[tg] = (errByTag[tg] || 0) + 1;
        errByType[a.q.wrongType || 'OTHER'] = (errByType[a.q.wrongType || 'OTHER'] || 0) + 1;
      }
    });
    renderResult({
      correct: correct, total: total, seconds: seconds,
      choiceC: choiceC, choiceT: choiceT, inputC: inputC, inputT: inputT,
      errByTag: errByTag, errByType: errByType
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
      + '<div class="sub">正确率 ' + pct(p) + ' · 用时 ' + U.fmtTime(m.seconds) + '</div>';
    v.appendChild(hero);

    var ov = el('div', 'grid cards3');
    ov.style.marginTop = '12px';
    ov.innerHTML =
      '<div class="glass metric"><div class="v">' + m.correct + '/' + m.total + '</div><div class="k">总正确</div></div>'
      + '<div class="glass metric"><div class="v">' + m.choiceC + '/' + m.choiceT + '</div><div class="k">选择题</div></div>'
      + '<div class="glass metric"><div class="v">' + m.inputC + '/' + m.inputT + '</div><div class="k">输入题</div></div>';
    v.appendChild(ov);

    var wrongTotal = m.total - m.correct;

    // 挑战解锁提示
    if (isCore && p >= 0.9) {
      var ul = el('div', 'glass rec-card');
      ul.style.marginTop = '12px';
      ul.innerHTML = '<b>🎯 挑战模式已解锁！</b>'
        + '<div class="why">正确率 ≥90%！挑战 5 道「全输入·15-30词·无提示」题，检验真功夫。</div>'
        + '<div class="btn-row" style="margin-top:10px"><button class="btn warn sm" data-chal="1">开始挑战模式</button></div>';
      v.appendChild(ul);
    }

    // 主要问题
    var tagKeys = Object.keys(m.errByTag);
    if (tagKeys.length) {
      var pr = el('div', 'glass', '');
      pr.style.marginTop = '12px';
      pr.style.padding = '14px 16px';
      var chips = tagKeys.map(function (k) {
        return '<span class="problem-chip"><b>' + m.errByTag[k] + '</b> 题 · ' + esc(k) + '</span>';
      }).join('');
      pr.innerHTML = '<div class="sec-title" style="margin-top:0">你的主要问题</div><div>' + chips + '</div>';
      v.appendChild(pr);

      var topTag = tagKeys[0];
      var sug = el('div', 'glass rec-card');
      sug.style.marginTop = '12px';
      sug.innerHTML = '<div class="sec-title" style="margin-top:0">建议</div>'
        + '<p class="muted small">先回看知识卡 → 再用「再练 5 题」专攻 <b>' + esc(topTag) + '</b>（会生成全新句子，不重复）。</p>'
        + '<div class="btn-row" style="margin-top:10px">'
        + '<button class="btn ok sm" data-retrain="1">♻️ 再练 5 题</button>'
        + '<button class="btn ghost sm" data-topic="' + S.topicId + '">📘 回看知识卡</button></div>';
      v.appendChild(sug);
    }

    // 逐题回顾
    var rev = el('div', '');
    rev.appendChild(el('div', 'sec-title', '逐题回顾（点开看答案与解析）'));
    S.answers.forEach(function (a, i) {
      if (!a) return;
      var card = el('div', 'glass wb-item');
      card.style.borderLeftColor = a.ok ? 'var(--ok)' : 'var(--bad)';
      var head = '<div class="head"><span class="badge ' + (a.ok ? 'green' : 'red') + '">第' + (i + 1) + '题 ' + (a.ok ? '✓ 对' : '✗ 错') + '</span>'
        + (a.q.tag ? '<span class="badge blue">' + esc(a.q.tag) + '</span>' : '')
        + (a.q.type === 'choice' ? '<span class="badge gray">选择</span>' : '<span class="badge gray">输入</span>') + '</div>';
      var corText = a.q.type === 'choice' ? a.q.options[a.q.answerIndex] : (a.q.answerText || (a.q.accepted && a.q.accepted[0]));
      card.innerHTML = head + '<div class="q">' + esc(a.q.question) + '</div>'
        + '<div class="wb-meta"><span>我的答案：<span style="color:' + (a.ok ? 'var(--ok)' : 'var(--bad)') + ';font-weight:700">' + esc(a.userText || '（未答）') + '</span></span>'
        + '<span>正确答案：<span class="cora">' + esc(corText) + '</span></span></div>';
      var det = el('details', 'qa explanation-panel');
      var revIsAI = !!(a.q.isAI || a.q.source === 'ai');
      var gName = revIsAI ? ((a.q.aiMeta && a.q.aiMeta.catName) || 'AI出题')
        : ((E.bank()[S.topicId] && E.bank()[S.topicId].title) || '');
      det.innerHTML = '<summary>📖 查看解析与考点</summary>' + U.explanationHTML(a.q, { correctText: corText, myText: a.userText, myOk: a.ok, grammar: gName });
      card.appendChild(det);
      rev.appendChild(card);
    });
    v.appendChild(rev);

    // 5 句话复习 + 考场判断（核心专题）
    if (topicFull && (topicFull.review5 || topicFull.examFlow)) {
      var sum = el('details', 'panel');
      sum.style.marginTop = '12px';
      sum.innerHTML = '<summary>📌 专题总结 · 5 句话复习<span class="arr">▶</span></summary><div class="inner">';
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
      tb.innerHTML = '<div class="sec-title" style="margin-top:0">🧪 综合挑战 · 知识点分析</div>' + rows;
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
      ab.innerHTML = '<div class="sec-title" style="margin-top:0">🤖 AI 题 · 知识点分析（已计入大专题能力）</div>' + rows2
        + '<p class="faint small" style="margin-top:6px">做错的空已进入错题本并标记来源“AI训练”；可在错题本与能力总览中追踪。</p>';
      v.appendChild(ab);
    }

    // 底部
    var foot = el('div', 'btn-row');
    foot.style.marginTop = '14px';
    var tidNow = S.topicId, modeNow = S.mode, kindNow = S.kind;
    var again = el('button', 'btn', '🔄 再练一轮');
    again.addEventListener('click', function () {
      if (kindNow === 'core') startCore(tidNow, modeNow);
      else if (kindNow === 'challenge') startChallenge(tidNow);
      else if (kindNow === 'retrain') startRetrain(tidNow, Object.keys(m.errByTag)[0] || null);
      else if (kindNow === 'wrongretrain') startWrongRetrain(tidNow);
      else if (kindNow === 'ai') {
        // 用同一组 AI 题重做；无缓存则回到 AI 页
        if (S._aiQuestions && S._aiQuestions.length) {
          E.quiz.startAI(S._aiQuestions, S._aiMeta || { mode: S.mode });
        } else if (E.aiUI && E.aiUI.resumeTraining) {
          E.aiUI.resumeTraining(S.mode);
        } else { E.ui.go('ai'); }
      }
      else startMixed(modeNow);
    });
    var back = el('button', 'btn ghost', '🗂 返回列表');
    back.addEventListener('click', function () { E.ui.go('topics'); });
    var home = el('button', 'btn ghost', '🏠 首页');
    home.addEventListener('click', function () { E.ui.go('home'); });
    foot.appendChild(again);
    // 核心整轮结束后：始终提供"再练5题(新题)"（需求§24）
    if (kindNow === 'core' && S.topicId !== 'challenge') {
      var r5 = el('button', 'btn warn', '♻️ 再练5题 · 新句子');
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
      b.addEventListener('click', function () { E.ui.go('topic/' + b.dataset.topic); });
    });
    v.scrollIntoView({ block: 'start' });
  }

  /* ---------- 退出 ---------- */
  function askExit() {
    if (!S) return;
    var kind = S.kind;
    U.confirmBox('退出本轮练习', '已答题目会计入统计，但整轮成绩不计入专题。确定退出？', '退出', true).then(function (ok) {
      if (!ok) return;
      // 整篇卷面模式：退出前把已作答的空落库（与交卷同一逻辑）
      if (kind === 'ai' && S._sheetMode && S.questions) {
        S.questions.forEach(function (q, i) {
          if (!S.answers[i] && q.type !== 'choice' && S._typed && S._typed[i] && String(S._typed[i]).trim()) {
            var t = String(S._typed[i]).trim();
            S.answers[i] = { qid: q.id, q: q, userText: t, ok: E.util.checkInputAnswer(t, q.accepted), answerIndex: undefined };
          }
        });
        S.questions.forEach(function (q, i) {
          if (S.answers[i]) commitStats(q, S.answers[i]);
        });
      }
      S = null;
      E.ui.quizActive = false;
      if (kind === 'ai') E.ui.go('ai'); else E.ui.go('topics');
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
    card.innerHTML = '<div class="page-title"><span class="ico">🧪</span>时态综合挑战</div>'
      + '<div class="page-sub">20 题大综合：前 10 选择、后 10 输入；七大时态混合，不提示考点，检验真实判断力。</div>'
      + (locked ? '<div class="fb bad" style="margin-top:16px"><span class="big">🔒</span>需先完成全部 12 个专题（每题至少一轮）</div>' : '')
      + '<div class="mode-grid" style="margin-top:16px">'
      + '<div class="mode-card glass" data-m="normal"><div class="ic">📖</div><h4>普通模式</h4><p>每题即时反馈，边做边学。</p></div>'
      + '<div class="mode-card glass" data-m="blind"><div class="ic">🎭</div><h4>盲做模式（模拟考试）</h4><p>20 题一口气做完，再统一看成绩与解析。</p></div>'
      + '</div>';
    v.appendChild(card);
    $$('[data-m]', card).forEach(function (c) {
      if (locked) c.style.opacity = '0.45';
      c.addEventListener('click', function () { if (!locked) startMixed(c.dataset.m); });
    });
  }

  E.quiz = {
    startCore: startCore, startChallenge: startChallenge, startRetrain: startRetrain,
    startWrongRetrain: startWrongRetrain, startMixed: startMixed, mixedGate: mixedGate,
    startAI: startAI, askExit: askExit, isActive: function () { return !!S; }
  };
})();
