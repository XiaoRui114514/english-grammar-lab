/* ============================================================
 * ui-views.js — 页面视图：首页 / 专题列表 / 专题页 / 错题本 / 薄弱点 / 学习记录
 * ============================================================ */
(function () {
  'use strict';
  var E = window.EGL, U = E.u;
  var $ = U.$, $$ = U.$$, el = U.el, esc = U.esc, pct = U.pct;

  var WRONG_TYPE_ZH = {
    TIME_SIGNAL_ERROR: '时间标志误判', CONTEXT_ERROR: '上下文判断错误', TENSE_CONFUSION: '时态混淆',
    VOICE_ERROR: '语态错误', SUBJECT_VERB_AGREEMENT: '主谓一致错误', VERB_FORM_ERROR: '动词形式错误',
    SPELLING_ERROR: '拼写错误', WORD_FORM_ERROR: '词形/词性错误', PREPOSITION_ERROR: '介词错误',
    ARTICLE_ERROR: '冠词错误', PRONOUN_ERROR: '代词错误', CONJUNCTION_ERROR: '连词错误',
    CLAUSE_ERROR: '从句错误', COLLOCATION_ERROR: '固定搭配错误'
  };
  function wtZh(c) { return WRONG_TYPE_ZH[c] || c || ''; }

  function metaById(tid) { return E.metaOfTopic(tid); }
  function topicName(tid) {
    if (String(tid).indexOf('ai:') === 0) {
      var catId = String(tid).slice(3);
      var cat = (window.__EGL_CURRICULUM__ && window.__EGL_CURRICULUM__.category)
        ? window.__EGL_CURRICULUM__.category(catId) : null;
      return (cat ? cat.name : catId) + '（AI）';
    }
    var m = metaById(tid);
    return m ? (m.no + ' ' + m.title) : tid;
  }

  /* ============ 顶栏视图容器 ============ */
  var app; // { view, wrap }
  function setApp(a) { app = a; }

  /* ============ 首页 ============ */
  function home() {
    var st = E.overallStats();
    var d = E.data;
    var v = app.view;
    v.innerHTML = '';

    var dateW = new Date();
    var weekday = ['日', '一', '二', '三', '四', '五', '六'][dateW.getDay()];
    var dateStr = (dateW.getMonth() + 1) + '月' + dateW.getDate() + '日 周' + weekday;

    var hero = U.el('div', 'glass hero');
    hero.innerHTML = '<span class="date">' + dateStr + '</span>'
      + '<h1><span class="en">English Grammar Lab</span><br>初高中语法填空学习系统</h1>'
      + '<div class="hero-tags"><span class="hot">初高中通用</span><span>推荐上海地区使用</span>'
      + '<span>时态 · 从句 · 虚词 · 词性转换</span></div>'
      + '<p>先懂方法 → 学专题 → 做句子级基础 → 练 10 空语篇 → 错题复盘 → AI 按薄弱点巩固</p>';
    v.appendChild(hero);

    // 今日学习 + 进度
    var todayN = Math.min(st.todayAnswered, 12);
    var g = U.el('div', 'grid cards2', ''); g.style.marginTop = '14px';
    g.innerHTML =
      '<div class="glass stat-card"><div class="k">📅 今日学习</div><div class="v">' + todayN + ' <small>/ 12 题</small></div>'
      + U.progressBar(todayN / 12) + '</div>'
      + '<div class="glass stat-card"><div class="k">🗺 学习进度（第一阶段先行 12 专题）</div><div class="v">' + st.finished + ' <small>/ ' + st.available + ' 专题</small></div>'
      + U.progressBar(st.available ? st.finished / st.available : 0) + '</div>';
    v.appendChild(g);

    var g2 = U.el('div', 'grid cards3', ''); g2.style.marginTop = '14px';
    g2.innerHTML =
      '<div class="glass stat-card"><div class="k">已完成专题</div><div class="v">' + st.finished + ' <small>/ 12</small></div><div class="faint small">全课程规划共 ' + st.totalPlan + ' 个专题</div></div>'
      + '<div class="glass stat-card"><div class="k">累计题目</div><div class="v">' + st.answered + ' <small>题</small></div><div class="faint small">答对 ' + st.correct + ' 题</div></div>'
      + '<div class="glass stat-card"><div class="k">总正确率</div><div class="v" style="color:' + (st.pct === null ? '' : st.pct >= 0.8 ? 'var(--ok)' : st.pct >= 0.6 ? 'var(--warn)' : 'var(--bad)') + '">' + (st.pct === null ? '—' : pct(st.pct)) + '</div>'
      + '<div class="faint small">答错会进错题本，别怕</div></div>';
    v.appendChild(g2);

    // 快捷入口
    var chalDone = E.isChallengeAvailable() && allCoreFinished();
    var qa = U.el('div', 'quick-actions');
    qa.innerHTML = '<button class="btn" data-nav="go-learn"><b>▶️</b>继续学习</button>'
      + '<button class="btn" data-nav="topics"><b>🗂</b>专题学习</button>'
      + '<button class="btn" data-nav="ai"><b>🤖</b>AI 出题</button>'
      + '<button class="btn" data-nav="method"><b>🧭</b>解题方法课</button>'
      + '<button class="btn" data-nav="wrong"><b>📕</b>错题本 <span class="faint">(' + d.wrongBook.length + ')</span></button>'
      + '<button class="btn" data-nav="weak"><b>🎯</b>我的薄弱点</button>'
      + '<button class="btn" data-nav="records"><b>📊</b>学习记录</button>'
      + (chalDone ? '<button class="btn" data-nav="challenge"><b>🧪</b>时态综合挑战</button>' : '');
    v.appendChild(qa);

    // AI 训练可继续提示
    if (E.aiUI && E.aiUI.resumeIfAny()) {
      var resume = U.el('div', 'glass rec-card');
      resume.style.marginTop = '14px';
      resume.innerHTML = '<b>🤖 有一组 AI 训练可继续 / 重做</b>'
        + '<div class="btn-row" style="margin-top:8px"><button class="btn sm" data-airesume="normal">继续普通模式</button>'
        + '<button class="btn sm ghost" data-airesume="blind">继续盲做模式</button></div>';
      v.appendChild(resume);
    }

    // 我的语法填空能力总览（按大专题）
    var cats = E.categoryStats();
    var hasAny = cats.some(function (c) { return c.attempts > 0; });
    if (cats.length && hasAny) {
      var secC = U.el('div', 'sec-title', '我的语法填空能力 <span class="faint" style="font-weight:500">（大专题正确率，含题库 + AI）</span>');
      v.appendChild(secC);
      var cc = U.el('div', 'glass', '');
      cc.style.padding = '8px 16px';
      cats.forEach(function (c) {
        if (c.attempts <= 0) return;
        var row = U.el('div', 'bar-row');
        var color = c.pct >= 0.8 ? 'var(--ok)' : c.pct >= 0.6 ? 'var(--warn)' : 'var(--bad)';
        row.innerHTML = '<span class="nm">' + (c.icon || '📌') + ' ' + esc(c.name) + '</span>'
          + '<div class="tr">' + U.progressBar(c.pct, c.pct < 0.6 ? 'bad' : '') + '</div>'
          + '<span class="pct" style="color:' + color + '">' + pct(c.pct) + '</span>'
          + '<span class="faint small">' + c.correct + '/' + c.attempts + '</span>';
        cc.appendChild(row);
      });
      v.appendChild(cc);
    }

    // 今日推荐
    var rec = E.recommendNext();
    if (rec) {
      var sec = U.el('div', 'sec-title', '今日推荐');
      v.appendChild(sec);
      var rc = U.el('div', 'glass reason-card');
      if (rec.type === 'topic') {
        var rm = metaById(rec.topicId);
        rc.innerHTML = '<span class="badge blue">🎯 ' + esc(topicName(rec.topicId)) + '</span>'
          + '<div class="big">' + (rm && rm.icon ? rm.icon : '📘') + ' ' + esc(rm ? rm.title : '') + '</div>'
          + '<div class="why">' + esc(rec.reason) + '</div>'
          + '<div class="btn-row" style="margin-top:12px"><button class="btn sm" data-nav="topic" data-tid="' + rec.topicId + '">开始学习</button>'
          + '<button class="btn sm ghost" data-nav="ai">🤖 让 AI 出题巩固</button></div>';
      } else {
        rc.innerHTML = '<span class="badge amber">🧪 时态综合挑战</span><div class="big">挑战一下综合能力</div>'
          + '<div class="why">' + esc(rec.reason) + '</div>'
          + '<div class="btn-row" style="margin-top:12px"><button class="btn sm" data-nav="challenge">去挑战</button></div>';
      }
      v.appendChild(rc);
    }

    // 我的易错点（雷区）
    var risks = topWeakTags(6);
    if (risks.length) {
      var sec2 = U.el('div', 'sec-title', '我的英语语法雷区 <span class="faint" style="font-weight:500">（先补最弱的）</span>');
      v.appendChild(sec2);
      var card = U.el('div', 'glass');
      card.style.padding = '6px 16px';
      risks.forEach(function (r) {
        var row = U.el('div', 'risk-row');
        var color = r.pct >= 0.8 ? 'var(--ok)' : r.pct >= 0.6 ? 'var(--warn)' : 'var(--bad)';
        row.innerHTML = '<span>' + esc(topicName(r.topicId)) + '</span>'
          + '<span class="faint small">· ' + esc(r.tag) + '</span>'
          + '<span class="pct" style="color:' + color + '">' + (r.pct === null ? '—' : pct(r.pct)) + '</span>'
          + '<div class="pbar pbar-mini" style="width:70px"><i style="width:' + (r.pct * 100 || 0) + '%;background:' + color + '"></i></div>';
        card.appendChild(row);
      });
      v.appendChild(card);
      var more = U.el('div', 'center', '');
      more.style.marginTop = '10px';
      more.innerHTML = '<button class="btn ghost sm" data-nav="weak">查看全部薄弱点分析 →</button>';
      v.appendChild(more);
    }

    // 综合挑战解锁提示
    if (chalDone) {
      var chal = U.el('div', 'glass rec-card');
      chal.style.marginTop = '14px';
      chal.innerHTML = '<b>🧪 时态综合挑战已解锁</b> <span class="faint small">20 题大综合 · 七大时态混合</span>'
        + '<div class="btn-row" style="margin-top:10px"><button class="btn sm" data-nav="challenge">开始 20 题综合挑战</button></div>';
      v.appendChild(chal);
    } else if (E.isChallengeAvailable()) {
      var chalLock = U.el('div', 'glass rec-card');
      chalLock.style.marginTop = '14px';
      var doneN = 0;
      E.availableTopicIds().forEach(function (tid) {
        var s = E.topicStat(tid);
        if (s.finished && s.attempts >= 12) doneN++;
      });
      chalLock.innerHTML = '<b>🔒 时态综合挑战（未解锁）</b>'
        + '<div class="why">完成全部 12 个专题后自动解锁。当前已完成 ' + doneN + ' / 12。</div>'
        + '<div class="pbar" style="margin-top:10px"><i style="width:' + (doneN / 12 * 100) + '%"></i></div>';
      v.appendChild(chalLock);
    }
    bindNav(v);
  }

  function topWeakTags(n) {
    var list = E.tagList().filter(function (t) { return t.attempts >= 2; });
    list.sort(function (a, b) { return (a.pct === null ? 1 : a.pct) - (b.pct === null ? 1 : b.pct); });
    return list.slice(0, n);
  }
  function allCoreFinished() {
    var tids = E.availableTopicIds();
    if (tids.length < 12) return false;
    return tids.every(function (tid) {
      var s = E.topicStat(tid);
      return s.finished && s.attempts >= 12;
    });
  }

  /* ============ 专题列表（按 大专题 × 年级 组织） ============ */
  function topics() {
    var v = app.view;
    v.innerHTML = '';
    var cur = window.__EGL_CURRICULUM__;
    var grade = loadGrade();
    v.appendChild(U.el('div', '', '<div class="page-title"><span class="ico">🗂️</span>专题学习 · 语法填空</div>'
      + '<div class="page-sub">先选年级（高一优先展示基础），再按大专题学习；尚未内置题库的大专题可用「AI 出题」生成练习。</div>'));

    // 年级切换
    var gt = U.el('div', 'grade-tabs', '');
    (cur.grades || []).forEach(function (g) {
      var b = U.el('button', 'gt' + (g.key === grade ? ' on' : ''), (g.key === 'g1' ? '🎒 ' : g.key === 'g2' ? '📘 ' : '🎓 ') + g.grade);
      b.dataset.g = g.key;
      gt.appendChild(b);
    });
    v.appendChild(gt);
    $$('.gt', gt).forEach(function (b) {
      b.addEventListener('click', function () {
        saveGrade(b.dataset.g);
        topics();
      });
    });

    var gd = cur.gradeDef(grade);
    if (gd) {
      var info = U.el('div', 'glass', '');
      info.style.padding = '10px 16px';
      info.style.marginBottom = '12px';
      info.innerHTML = '<b>' + esc(gd.grade) + '</b> · <span class="muted">' + esc(gd.desc) + '</span>'
        + '<div class="small faint" style="margin-top:4px">阶段：' + esc(gd.stages.map(function (s) { return s.name; }).join(' → ')) + '</div>';
      v.appendChild(info);
    }

    // 顶部：解题方法课 + AI 出题 快捷入口
    var topRow = U.el('div', 'grid cards2', '');
    topRow.style.marginBottom = '14px';
    topRow.innerHTML = '<button class="mode-card glass" data-nav="method"><div class="ic">🧭</div><h4>解题方法课</h4><p>先学语法填空 5 步做法与高频陷阱（上海题型），再开练。</p></button>'
      + '<button class="mode-card glass" data-nav="ai"><div class="ic">🤖</div><h4>AI 出题</h4><p>按年级/专题/题数生成完整语篇，做完自动判分与错题入库。</p></button>';
    v.appendChild(topRow);

    // 大专题卡片
    (cur.categories || []).forEach(function (cat) {
      // 该大专题在当前年级阶段下的内置可用专题
      var list = availableOfCat(cat.id, grade);
      var card = U.el('div', 'glass cat-card');
      card.style.setProperty('--c', cat.color || 'var(--accent)');
      var acc = 0, tried = 0;
      list.forEach(function (t) {
        var a = E.topicAccuracy(t.tid);
        if (a !== null) { acc += a; tried++; }
      });
      var pctShow = tried ? '<span class="pct" style="color:' + (acc / tried >= 0.8 ? 'var(--ok)' : acc / tried >= 0.6 ? 'var(--warn)' : 'var(--bad)') + '">' + pct(acc / tried) + '</span>' : '';
      var head = '<h4>' + (cat.icon || '📌') + ' ' + esc(cat.name) + pctShow + '</h4>'
        + '<div class="desc">' + esc(cat.desc) + '</div>';
      card.innerHTML = head;
      // 内置可练（目前 tense 系列归属谓语动词）
      if (list.length) {
        var rows = U.el('div', '', '');
        list.forEach(function (t) {
          var st2 = E.topicStatus(t.tid);
          var stText = st2 === 'master' ? '🟢' : st2 === 'learning' ? '🟡' : st2 === 'weak' ? '🔴' : '⚪';
          var acc2 = E.topicAccuracy(t.tid);
          var r = U.el('div', 'topic-row');
          r.dataset.tid = t.tid;
          r.innerHTML = '<span class="no">' + t.no + '</span><span class="tt">' + esc(t.title) + '</span>'
            + (acc2 === null ? '' : '<span class="sub">' + pct(acc2) + '</span>')
            + '<span class="st">' + stText + '</span>';
          rows.appendChild(r);
        });
        card.appendChild(rows);
      }
      // 规划/AI 占位行
      var extra = U.el('div', 'topic-row');
      extra.innerHTML = '<span class="no">✦</span><span class="tt faint">该大专题其余子考点</span>'
        + '<button class="btn sm ghost" data-ai-cat="' + cat.id + '" style="margin-left:auto">🤖 AI 生成练习</button>';
      card.appendChild(extra);
      v.appendChild(card);
    });
    // 综合挑战
    if (E.isChallengeAvailable()) {
      var locked = !allCoreFinished();
      var cc = U.el('div', 'glass phase-card');
      cc.innerHTML = '<div class="phase-head"><h3>🧪 额外挑战</h3><span>句子级大综合</span></div>';
      var cr = U.el('div', 'topic-row');
      cr.innerHTML = '<span class="no">CH</span><span class="tt">时态综合挑战（20题 · 句子级）</span>'
        + (locked ? '<span class="st">🔒 完成全部 12 个谓语动词专题后解锁</span>'
                   : '<span class="st">✅ 已解锁</span>');
      if (!locked) {
        cr.style.cursor = 'pointer';
        cr.addEventListener('click', function () { E.ui.go('challenge'); });
      }
      cc.appendChild(cr);
      v.appendChild(cc);
    }
    $$('.topic-row[data-tid]', v).forEach(function (row) {
      row.addEventListener('click', function () { E.ui.go('topic/' + row.dataset.tid); });
    });
    $$('[data-ai-cat]', v).forEach(function (b) {
      b.addEventListener('click', function () {
        var gkey = grade;
        E.aiUI && E.aiUI.gotoConfig(gkey, b.dataset['aiCat']);
      });
    });
    bindNav(v);
  }

  function loadGrade() {
    try { var g = localStorage.getItem('EGL_GRADE'); if (g) return g; } catch (e) {}
    return 'g1'; // 高一默认
  }
  function saveGrade(g) { try { localStorage.setItem('EGL_GRADE', g); } catch (e) {} }

  // 该大专题下：当前有真实题库且属于本年级使用的专题
  function availableOfCat(catId, gradeKey) {
    var out = [];
    E.availableTopicIds().forEach(function (tid) {
      var no = tid.replace('tense', '');
      var cur = window.__EGL_CURRICULUM__;
      var e = cur && cur.catOf ? cur.catOf(no) : null;
      if (!e || e.cat !== catId) return;
      var grades = e.grades || [];
      if (gradeKey && grades.indexOf(gradeKey) < 0) return; // 未列入该年级 → 不放行
      out.push({ tid: tid, no: no, title: (E.metaOfTopic(tid) || {}).title || tid });
    });
    out.sort(function (a, b) { return a.no.localeCompare(b.no); });
    return out;
  }

  /* ============ 专题页（含模式选择） ============ */
  function topicPage(tid) {
    var v = app.view;
    var meta = metaById(tid);
    if (!meta) { v.innerHTML = '<div class="empty"><span class="e">🤔</span>专题未找到</div>'; return; }
    var topic = E.bank()[tid] || {};
    var st = E.topicStatus(tid);
    var acc = E.topicAccuracy(tid);
    var s = E.topicStat(tid);
    var unlockedChal = E.isChallengeUnlocked(tid);
    var wrongCount = E.data.wrongBook.filter(function (w) { return w.topicId === tid; }).length;

    v.innerHTML = '';
    var back = U.el('div', '', '<button class="btn ghost sm" data-nav="topics">← 返回专题列表</button>');
    v.appendChild(back);

    var head = U.el('div', 'glass', '');
    head.style.marginTop = '10px';
    head.style.padding = '16px 18px';
    var icon = topic.icon || meta.icon || '📘';
    head.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<span style="font-size:34px">' + esc(icon) + '</span>'
      + '<div><div class="page-title" style="font-size:20px">专题 ' + esc(meta.no) + '｜' + esc(meta.title) + '</div>'
      + '<div class="page-sub">第一阶段 · 谓语动词与时态</div></div>'
      + '<div style="margin-left:auto">' + U.statusBadge(st) + '</div></div>'
      + '<div class="grid cards4" style="margin-top:14px">'
      + '<div class="stat-card" style="padding:8px"><div class="k">正确率</div><div class="v" style="font-size:19px">' + (acc === null ? '未开始' : pct(acc)) + '</div></div>'
      + '<div class="stat-card" style="padding:8px"><div class="k">累计答题</div><div class="v" style="font-size:19px">' + s.attempts + '</div></div>'
      + '<div class="stat-card" style="padding:8px"><div class="k">最佳一轮</div><div class="v" style="font-size:19px">' + (s.bestRunPct ? pct(s.bestRunPct) : '—') + '</div></div>'
      + '<div class="stat-card" style="padding:8px"><div class="k">错题数</div><div class="v" style="font-size:19px">' + wrongCount + '</div></div>'
      + '</div>';
    v.appendChild(head);

    // 模式选择
    var modeBox = U.el('div', 'glass', '');
    modeBox.style.marginTop = '14px';
    modeBox.style.padding = '18px';
    var modeHtml = '<div class="sec-title" style="margin-top:0">开始练习</div>'
      + '<div class="mode-grid">'
      + '<div class="mode-card glass" data-mode="normal"><div class="ic">📖</div><h4>普通模式</h4><p>每题答完立刻看对错与解析，适合学习新知识。</p></div>'
      + '<div class="mode-card glass" data-mode="blind"><div class="ic">🎭</div><h4>盲做模式</h4><p>一口气做完 12 题再看答案，模拟真实考试。</p></div>'
      + '</div>';
    if (unlockedChal) {
      modeHtml += '<div class="btn-row" style="margin-top:12px"><button class="btn warn sm" data-chal="1">🎯 挑战模式（5 题 · 全输入 · 已解锁）</button></div>';
    } else if (s.finished) {
      modeHtml += '<div class="btn-row" style="margin-top:12px"><button class="btn sm" disabled>🎯 挑战模式：正确率 ≥90% 后解锁</button></div>';
    }
    if (wrongCount > 0) {
      modeHtml += '<div class="btn-row" style="margin-top:10px"><button class="btn ghost sm" data-retrain="1">♻️ 再练 5 题（针对薄弱点，新题）</button>'
        + '<button class="btn ghost sm" data-wrongretrain="1">📕 错题回炉 5 题</button></div>';
    }
    modeBox.innerHTML = modeHtml;
    v.appendChild(modeBox);

    // 知识卡
    var kcSec = U.el('div', 'sec-title', '知识卡 · 先看懂，再做');
    v.appendChild(kcSec);
    var kcWrap = U.el('div', '');
    kcWrap.innerHTML = U.knowledgeCardHTML(Object.assign({}, meta, topic));
    v.appendChild(kcWrap);

    $$('.mode-card', modeBox).forEach(function (c) {
      c.addEventListener('click', function () {
        startCore(tid, c.dataset.mode);
      });
    });
    $$('button[data-chal]', modeBox).forEach(function (b) {
      b.addEventListener('click', function () { startChallenge(tid); });
    });
    $$('button[data-retrain]', modeBox).forEach(function (b) {
      b.addEventListener('click', function () { startRetrain(tid); });
    });
    $$('button[data-wrongretrain]', modeBox).forEach(function (b) {
      b.addEventListener('click', function () { startWrongRetrain(tid); });
    });
    bindNav(v);
  }

  /* ============ 错题本 ============ */
  function wrongBook() {
    var v = app.view;
    var wb = E.data.wrongBook;
    v.innerHTML = '';
    v.appendChild(U.el('div', '', '<div class="page-title"><span class="ico">📕</span>错题本</div>'
      + '<div class="page-sub">共 ' + wb.length + ' 条 · 同一题再错会累加错误次数</div>'));

    if (!wb.length) {
      v.appendChild(U.el('div', 'glass empty', '<span class="e">🎉</span>还没有错题<br><span class="faint small">做错的题会自动收进来，加油！</span>'));
      return;
    }
    var box = U.el('div', '');
    wb.forEach(function (w) {
      var isAI = w.source === 'ai';
      var q = isAI ? null : E.findQuestion(w.topicId, w.qid); // AI 题已存快照，不入库
      var card = U.el('div', 'glass wb-item');
      var meta = isAI ? null : metaById(w.topicId);
      var icon = isAI ? '🤖' : (meta && meta.icon ? meta.icon : '📘');
      card.innerHTML = '<div class="head">'
        + (isAI ? '<span class="badge gray">🤖 AI训练</span> ' : '')
        + '<span class="badge gray">' + icon + ' ' + esc(w.topicTitle || (isAI ? 'AI出题' : topicName(w.topicId))) + '</span>'
        + (w.kp ? '<span class="badge blue">' + esc(w.kp) + '</span>' : (w.tag ? '<span class="badge blue">' + esc(w.tag) + '</span>' : ''))
        + (w.grade ? '<span class="badge amber">' + esc(w.grade) + '</span>' : '')
        + '<span class="badge red">' + wtZh(w.wrongType) + '</span>'
        + '<span class="badge amber">错 ' + w.times + ' 次</span>'
        + '<span class="badge gray">' + w.lastDate + '</span>'
        + '<button class="btn ghost sm" style="margin-left:auto;padding:4px 10px" data-del="' + esc(w.qid) + '">删除</button>'
        + '</div>'
        + '<div class="q">' + esc(w.question) + '</div>'
        + '<div class="wb-meta"><span>我的答案：<span class="mya">' + esc(w.myAnswer === undefined || w.myAnswer === null || w.myAnswer === '' ? '（未作答）' : w.myAnswer) + '</span></span>'
        + '<span>正确答案：<span class="cora">' + esc(w.correctAnswer) + '</span></span></div>';
      if (isAI && w.explText) {
        var dAI = U.el('details', 'qa explanation-panel');
        dAI.style.marginTop = '10px';
        var pseudo = {
          type: 'input', tag: w.kp || w.tag || '',
          answerText: w.correctAnswer,
          explanation: {
            answer: w.correctAnswer,
            keyPoint: (w.kp ? '考点：' + w.kp : '考点：AI 语法题') + (w.grade ? '（' + w.grade + '）' : ''),
            clue: '',
            trap: '',
            chain: '',
            why: w.explText,
            whyOthers: '',
            commonError: 'AI 生成题，重做可到「AI 出题」按薄弱点再生成。',
            memory: '',
            cue: '',
            examMind: ''
          }
        };
        dAI.innerHTML = '<summary>📖 查看解析与考点</summary>'
          + U.explanationHTML(pseudo, { correctText: w.correctAnswer, myText: w.myAnswer, myOk: false, grammar: (w.kp || 'AI题') });
        card.appendChild(dAI);
      } else if (q) {
        var det = U.el('details', 'qa explanation-panel');
        det.style.marginTop = '10px';
        var corText = q.type === 'choice' ? (q.options[q.answerIndex]) : (q.answerText || (q.accepted && q.accepted[0]));
        det.innerHTML = '<summary>📖 查看解析与考点</summary>'
          + U.explanationHTML(q, { correctText: corText, myText: w.myAnswer, myOk: false, grammar: (meta && meta.title) || '' });
        card.appendChild(det);
      }
      box.appendChild(card);
    });
    v.appendChild(box);

    var foot = U.el('div', 'btn-row', '');
    foot.style.marginTop = '8px';
    foot.innerHTML = '<button class="btn ghost" data-clear="1">🗑 清空错题本</button>'
      + '<button class="btn ghost" data-nav="weak">去练薄弱点</button>';
    v.appendChild(foot);

    $$('[data-del]', v).forEach(function (b) {
      b.addEventListener('click', function () {
        E.removeWrong(b.dataset.del);
        wrongBook();
        U.toast('已删除', 'ok');
      });
    });
    $('[data-clear]', v).addEventListener('click', function () {
      U.confirmBox('清空错题本', '确定要删除全部错题吗？此操作不可恢复。', '清空', true).then(function (ok) {
        if (ok) { E.clearWrong(); wrongBook(); }
      });
    });
    bindNav(v);
  }

  /* ============ 薄弱点 ============ */
  function weak() {
    var v = app.view;
    v.innerHTML = '';
    v.appendChild(U.el('div', '', '<div class="page-title"><span class="ico">🎯</span>我的薄弱点分析</div>'
      + '<div class="page-sub">正确率越低越靠前 · 连续答错会亮红灯，直接针对性训练</div>'));

    // 专题级
    var weakT = E.weakTopics().filter(function (t) { return t.pct < 0.9; });
    if (weakT.length) {
      v.appendChild(U.el('div', 'sec-title', '专题正确率（由低到高）'));
      var c1 = U.el('div', 'glass', '');
      c1.style.padding = '10px 16px';
      weakT.forEach(function (t) {
        var row = U.el('div', 'bar-row');
        row.innerHTML = '<span class="nm">' + (t.meta && t.meta.icon ? t.meta.icon : '📘') + ' ' + esc(t.meta ? t.meta.title : t.id) + '</span>'
          + '<div class="tr">' + U.progressBar(t.pct, t.pct < 0.6 ? 'bad' : '') + '</div>'
          + '<span class="pct" style="color:' + (t.pct < 0.6 ? 'var(--bad)' : t.pct < 0.8 ? 'var(--warn)' : 'var(--ok)') + '">' + pct(t.pct) + '</span>';
        c1.appendChild(row);
      });
      v.appendChild(c1);
    }

    // tag 级
    var tags = E.tagList().filter(function (t) { return t.attempts >= 2; });
    tags.sort(function (a, b) { return (a.pct === null ? 1 : a.pct) - (b.pct === null ? 1 : b.pct); });
    if (tags.length) {
      v.appendChild(U.el('div', 'sec-title', '易错知识点（雷区细看）'));
      var c2 = U.el('div', 'glass', '');
      c2.style.padding = '10px 16px';
      tags.forEach(function (t) {
        var row = U.el('div', 'risk-row');
        var red = t.streakWrong >= 3;
        var color = t.pct === null ? 'var(--ink-faint)' : t.pct >= 0.8 ? 'var(--ok)' : t.pct >= 0.6 ? 'var(--warn)' : 'var(--bad)';
        row.innerHTML = '<span>' + esc(topicName(t.topicId)) + '</span>'
          + '<span class="faint small">· ' + esc(t.tag) + (red ? ' <b style="color:var(--bad)">连续错' + t.streakWrong + '次</b>' : '') + '</span>'
          + '<span class="pct" style="color:' + color + '">' + (t.pct === null ? '—' : pct(t.pct)) + '</span>'
          + '<button class="btn sm ghost" data-train="1" data-tid="' + t.topicId + '" data-tag="' + esc(t.tag) + '">针对性 5 题</button>';
        c2.appendChild(row);
      });
      v.appendChild(c2);
      $$('[data-train]', c2).forEach(function (b) {
        b.addEventListener('click', function () {
          startRetrain(b.dataset.tid, b.dataset.tag);
        });
      });
    }

    // 错误类型分布
    var errKeys = Object.keys(E.data.errorTypes);
    if (errKeys.length) {
      v.appendChild(U.el('div', 'sec-title', '错误类型分布'));
      var c3 = U.el('div', 'glass', '');
      c3.style.padding = '10px 16px';
      var total = 0;
      errKeys.forEach(function (k) { total += E.data.errorTypes[k]; });
      errKeys.forEach(function (k) {
        var n = E.data.errorTypes[k];
        var row = U.el('div', 'bar-row');
        row.innerHTML = '<span class="nm">' + esc(wtZh(k)) + '</span>'
          + '<div class="tr">' + U.progressBar(n / total, n / total > 0.35 ? 'bad' : '') + '</div>'
          + '<span class="pct">' + n + '</span>';
        c3.appendChild(row);
      });
      v.appendChild(c3);
    }

    if (!tags.length && !weakT.length && !errKeys.length) {
      v.appendChild(U.el('div', 'glass empty', '<span class="e">💪</span>还没有足够数据<br><span class="faint small">做完几个专题后，这里会告诉你哪里最需要补</span>'));
    }
    bindNav(v);
  }

  /* ============ 学习记录 ============ */
  function records() {
    var v = app.view;
    v.innerHTML = '';
    v.appendChild(U.el('div', '', '<div class="page-title"><span class="ico">📊</span>学习记录</div>'
      + '<div class="page-sub">每轮练习都会记录在这里</div>'));

    var sessions = E.data.sessions.slice().reverse();
    if (sessions.length) {
      var c = U.el('div', '', '');
      sessions.slice(0, 60).forEach(function (s) {
        var isAI = s.mode === 'ai' || s.topicId === 'ai';
        var meta = isAI ? null : metaById(s.topicId);
        var modeZh = { normal: '普通模式', blind: '盲做模式', retrain: '再练5题', challenge: '挑战模式', wrongretrain: '错题回炉', mixed: '综合挑战', ai: '🤖 AI训练' }[s.mode] || s.mode;
        var nameTxt = isAI ? (s.label || 'AI 出题训练') : topicName(s.topicId);
        var it = U.el('div', 'glass hist-item');
        var grade = U.gradeOf(s.correct, s.total);
        it.innerHTML = '<span class="d">' + s.date + '</span>'
          + '<span class="t">' + (isAI ? '🤖' : (meta && meta.icon ? meta.icon : '📘')) + ' ' + esc(nameTxt) + ' <span class="badge gray">' + esc(modeZh) + '</span></span>'
          + '<span class="s" style="color:' + grade.color + '">' + s.correct + '/' + s.total + '</span>'
          + '<span class="faint small" style="width:64px;text-align:right">' + U.fmtTime(s.seconds) + '</span>';
        c.appendChild(it);
      });
      v.appendChild(c);
    } else {
      v.appendChild(U.el('div', 'glass empty', '<span class="e">🗒️</span>还没有学习记录<br><span class="faint small">开始第一个专题吧</span>'));
    }

    // 数据管理
    v.appendChild(U.el('div', 'sec-title', '数据管理（localStorage）'));
    var mg = U.el('div', 'glass', '');
    mg.style.padding = '14px 16px';
    mg.innerHTML = '<div class="small faint" style="margin-bottom:10px">学习数据保存在本机浏览器 localStorage，换浏览器/清缓存会丢。建议定期导出备份。</div>'
      + '<div class="btn-row">'
      + '<button class="btn ghost sm" data-exp="1">⬇ 导出备份（JSON）</button>'
      + '<button class="btn ghost sm" data-imp="1">⬆ 导入备份</button>'
      + '<button class="btn ghost sm" data-reset="1" style="color:var(--bad)">重置全部数据</button>'
      + '</div>'
      + '<input type="file" accept="application/json,.json" style="display:none">';
    v.appendChild(mg);

    $('[data-exp]', mg).addEventListener('click', function () {
      var blob = new Blob([E.exportData()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'EGL-备份-' + E.util.todayStr() + '.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      U.toast('已导出备份', 'ok');
    });
    $('[data-imp]', mg).addEventListener('click', function () {
      var inp = $('input[type=file]', mg);
      inp.click();
      inp.onchange = function () {
        var f = inp.files[0];
        if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          if (E.importData(rd.result)) { U.toast('导入成功', 'ok'); E.ui.render(); }
          else U.toast('导入失败：文件格式不对', 'bad');
        };
        rd.readAsText(f);
      };
    });
    $('[data-reset]', mg).addEventListener('click', function () {
      U.confirmBox('重置全部数据', '将清空所有学习记录、错题本、成绩。确定？', '重置', true).then(function (ok) {
        if (ok) { E.resetData(); U.toast('已重置', 'ok'); E.ui.render(); }
      });
    });
    bindNav(v);
  }

  /* ---------- quiz 入口（在 ui-quiz.js 实现） ---------- */
  function startCore(tid, mode) {
    E.quiz && E.quiz.startCore(tid, mode);
  }
  function startChallenge(tid) {
    E.quiz && E.quiz.startChallenge(tid);
  }
  function startRetrain(tid, tag) {
    E.quiz && E.quiz.startRetrain(tid, tag);
  }
  function startWrongRetrain(tid) {
    E.quiz && E.quiz.startWrongRetrain(tid);
  }
  function startMixed() {
    E.quiz && E.quiz.startMixed();
  }

  /* ---------- 通用导航 ---------- */
  function bindNav(root) {
    $$('[data-nav]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var nav = b.dataset.nav;
        if (E.ui.quizActive) { E.quiz.askExit(); return; }
        if (nav === 'go-learn') {
          var tid0 = E.nextUnstarted();
          if (tid0) E.ui.go('topic/' + tid0);
          else E.ui.go('topics');
          return;
        }
        if (nav === 'topic') {
          var tid = b.dataset.tid || firstUnstartedTid();
          if (tid) E.ui.go('topic/' + tid);
          return;
        }
        if (nav === 'challenge') {
          if (!(E.ui.allCoreFinished && E.ui.allCoreFinished())) {
            U.toast('需先完成全部 12 个专题（每题一轮）', 'bad');
            return;
          }
          E.ui.go('challenge');
          return;
        }
        E.ui.go(nav);
      });
    });
    $$('[data-airesume]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (E.aiUI) E.aiUI.resumeTraining(b.dataset.airesume);
      });
    });
  }
  function firstUnstartedTid() { return E.nextUnstarted() || (E.availableTopicIds()[0] || null); }

  /* ============ 解题方法课 ============ */
  function methodPage() {
    var v = app.view;
    v.innerHTML = '';
    var m = window.__EGL_METHOD_COURSE__;
    if (!m) { v.innerHTML = '<div class="empty"><span class="e">🧭</span>方法课内容缺失</div>'; return; }
    v.appendChild(U.el('div', '', '<div class="page-title"><span class="ico">🧭</span>' + esc(m.title) + '</div>'
      + '<div class="page-sub">' + esc(m.intro) + '</div>'));
    var heroC = U.el('div', 'glass kcard', '');
    heroC.style.padding = '18px';
    heroC.innerHTML = '<div class="sec-title" style="margin-top:0">做题总流程</div>';
    var flow = U.el('ol', 'ex-flow');
    m.steps.forEach(function (s) {
      var li = U.el('li', '', '<b>' + s.no + '. ' + esc(s.title) + '</b>');
      flow.appendChild(li);
    });
    heroC.appendChild(flow);
    v.appendChild(heroC);

    m.steps.forEach(function (s) {
      var card = U.el('div', 'glass', '');
      card.style.padding = '18px';
      card.style.marginTop = '14px';
      var h = '<div class="sec-title" style="margin-top:0">' + s.no + '. ' + esc(s.title) + '</div>'
        + '<div class="kblock"><div class="lb">这一步的目标</div><p>' + esc(s.goal) + '</p></div>'
        + '<div class="kblock"><div class="lb">为什么重要</div><p>' + esc(s.why) + '</p></div>'
        + '<div class="kblock"><div class="lb">怎么做</div><ul>';
      (s.do || []).forEach(function (d) { h += '<li>' + esc(d) + '</li>'; });
      h += '</ul></div>';
      if (s.example) h += '<div class="kblock"><div class="lb">示例</div><p class="hl">' + esc(s.example) + '</p></div>';
      if (s.example2) h += '<div class="kblock"><p class="hl">' + esc(s.example2) + '</p></div>';
      if (s.check) {
        h += '<div class="kblock"><div class="lb">检查清单</div><ol>';
        s.check.forEach(function (c) { h += '<li>' + esc(c) + '</li>'; });
        h += '</ol></div>';
      }
      h += '</div>';
      card.innerHTML = h;
      v.appendChild(card);
    });

    // 五大高频陷阱
    var trapSec = U.el('div', 'sec-title', '上海卷五大高频陷阱（做题前必看）');
    v.appendChild(trapSec);
    var tc = U.el('div', 'glass', '');
    tc.style.padding = '12px 16px';
    (m.fiveTrapTips || []).forEach(function (t) {
      var row = U.el('div', 'kblock', '');
      row.innerHTML = '<div class="lb">⚠️ ' + esc(t.name) + '</div><p>' + esc(t.text) + '</p>';
      tc.appendChild(row);
    });
    v.appendChild(tc);

    var act = U.el('div', 'btn-row', '');
    act.style.marginTop = '16px';
    act.innerHTML = '<button class="btn" data-nav="topics">🗂 去选专题练习</button>'
      + '<button class="btn ok" data-nav="ai">🤖 让 AI 生成一篇练手</button>';
    v.appendChild(act);
    bindNav(v);
  }

  E.ui = E.ui || {};
  E.ui.setApp = setApp;
  E.ui.home = home;
  E.ui.topics = topics;
  E.ui.topicPage = topicPage;
  E.ui.wrongBook = wrongBook;
  E.ui.weak = weak;
  E.ui.records = records;
  E.ui.startCore = startCore;
  E.ui.startChallenge = startChallenge;
  E.ui.startRetrain = startRetrain;
  E.ui.startWrongRetrain = startWrongRetrain;
  E.ui.startMixed = startMixed;
  E.ui.bindNav = bindNav;
  E.ui.wtZh = wtZh;
  E.ui.topicName = topicName;
  E.ui.allCoreFinished = allCoreFinished;
  E.ui.topWeakTags = topWeakTags;
  E.ui.methodPage = methodPage;
})();
