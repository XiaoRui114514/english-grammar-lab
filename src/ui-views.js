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

    // 报头：刊名与日期一行，标题一句，学习路线一句（不再是卡片 + 标签墙）
    var hero = U.el('div', 'hero');
    hero.innerHTML = '<div class="mast-line"><span class="mast-name">上海初高语法填空</span>'
      + '<span class="date">' + dateStr + '</span></div>'
      + '<h1>初高中英语语法填空学习系统</h1>'
      + '<p>先懂方法 → 学专题 → 做句子级基础 → 练 10 空语篇 → 错题复盘 → AI 按薄弱点巩固</p>'
      + '<div class="hero-tags"><span class="hot">上海命题风格</span><span>初高中通用</span><span>全国其他地区也能用</span>'
      + '<span>10 空 = 5 空给词 + 5 空纯空</span><span>有提示词不考词性转换</span></div>';
    v.appendChild(hero);

    // 今日 / 连续 / 复习 / 进度：一张账目表（左标签、右数字，进度画成一条细线）
    var goal = st.goal || 12;
    var todayN = Math.min(st.todayAnswered, goal);
    var ws = E.wrongStats();
    var led = U.el('div', 'ledger');
    led.innerHTML =
      '<div class="ledger-row"><span class="k">今日学习</span>'
      + '<span class="v">' + todayN + '<small>/ ' + goal + ' 题</small></span>'
      + U.progressBar(todayN / goal) + '</div>'
      + '<div class="ledger-row"><span class="k">连续学习</span>'
      + '<span class="v">' + st.streak.days + '<small>天</small></span>'
      + '<span class="note">' + (st.streak.today ? '今天已打卡，保持住。' : '今天还没开始，做 1 题就算打卡。') + '</span></div>'
      + '<div class="ledger-row"><span class="k">今日复习</span>'
      + '<span class="v"' + (ws.due ? ' style="color:var(--warn)"' : '') + '>' + ws.due + '<small>空到期</small></span>'
      + '<span class="note">未掌握 ' + ws.active + ' 空 · 已掌握 ' + ws.mastered + ' 空（按间隔重复排期）</span></div>'
      + '<div class="ledger-row"><span class="k">学习进度</span>'
      + '<span class="v">' + st.finished + '<small>/ ' + st.available + ' 专题</small></span>'
      + U.progressBar(st.available ? st.finished / st.available : 0) + '</div>'
      + '<div class="ledger-row"><span class="k">真题语篇</span>'
      + '<span class="v">' + st.papersDone + '<small>/ ' + st.papersTotal + ' 篇</small></span>'
      + '<span class="note">每篇 10 空 · 做完按大专题记分</span></div>'
      + '<div class="ledger-row"><span class="k">累计题目</span>'
      + '<span class="v">' + st.answered + '<small>题</small></span>'
      + '<span class="note">答对 ' + st.correct + ' 题 · 总正确率 '
      + (st.pct === null ? '—'
         : '<b style="color:' + (st.pct >= 0.8 ? 'var(--ok)' : st.pct >= 0.6 ? 'var(--warn)' : 'var(--bad)') + '">' + pct(st.pct) + '</b>')
      + '</span></div>';
    v.appendChild(led);

    // 最近 7 天：柱高 = 当天题量，今天描边加重（纯 DOM，无图表库）
    v.appendChild(weekBars(st.week));

    // 今日复习提醒：到期就顶在首页，别让错题躺着
    if (ws.due > 0) {
      var rev = U.el('div', 'glass rec-card');
      rev.style.marginTop = '14px';
      rev.innerHTML = '<b>今天有 ' + ws.due + ' 个空到期该复习了</b>'
        + '<div class="why">这些是之前做错、按 1/2/4/7/15 天排期今天该回炉的题。先过一遍，比刷新题更划算。</div>'
        + '<div class="btn-row" style="margin-top:10px"><button class="btn sm" data-nav="review">开始今日复习（' + ws.due + ' 空）</button>'
        + '<button class="btn sm ghost" data-nav="wrong">去错题本</button></div>';
      v.appendChild(rev);
    }

    // 快捷入口：目录式列表（一行一件事，右侧细箭头）
    var chalDone = E.isChallengeAvailable() && allCoreFinished();
    var paperN = E.availablePaperIds().length;
    var custom = E.getCustomPaper();
    var idx = U.el('nav', 'index-list');
    idx.setAttribute('aria-label', '快捷入口');
    idx.innerHTML =
      (ws.due > 0 ? '<button class="index-row" data-nav="review"><span class="tt">今日复习</span><span class="meta">' + ws.due + ' 空到期</span><span class="ar">→</span></button>' : '')
      + '<button class="index-row" data-nav="go-learn"><span class="tt">继续学习</span><span class="ar">→</span></button>'
      + '<button class="index-row" data-nav="custom"><span class="tt">我的专卷 · 按薄弱点组 10 空</span>'
      + '<span class="meta">' + (custom ? '上次 ' + esc(custom.date) : '还没组过') + '</span><span class="ar">→</span></button>'
      + '<button class="index-row" data-nav="papers"><span class="tt">上海真题语篇 · 整篇 10 空</span><span class="meta">' + paperN + ' 篇</span><span class="ar">→</span></button>'
      + '<button class="index-row" data-nav="topics"><span class="tt">单句专题训练</span><span class="meta">' + st.available + ' 个专题</span><span class="ar">→</span></button>'
      + '<button class="index-row" data-nav="ai"><span class="tt">AI 出题</span><span class="ar">→</span></button>'
      + '<button class="index-row" data-nav="method"><span class="tt">解题方法课</span><span class="ar">→</span></button>'
      + '<button class="index-row" data-nav="wrong"><span class="tt">错题本</span><span class="meta">' + ws.total + ' 题</span><span class="ar">→</span></button>'
      + '<button class="index-row" data-nav="weak"><span class="tt">我的薄弱点</span><span class="ar">→</span></button>'
      + '<button class="index-row" data-nav="records"><span class="tt">学习记录</span><span class="ar">→</span></button>'
      + (chalDone ? '<button class="index-row" data-nav="challenge"><span class="tt">综合挑战</span><span class="meta">20 题</span><span class="ar">→</span></button>' : '');
    v.appendChild(idx);

    // AI 训练可继续提示
    if (E.aiUI && E.aiUI.resumeIfAny()) {
      var resume = U.el('div', 'glass rec-card');
      resume.style.marginTop = '14px';
      resume.innerHTML = '<b>有一组 AI 训练可继续 / 重做</b>'
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
        row.innerHTML = '<span class="nm">' + (c.icon ? c.icon + ' ' : '') + esc(c.name) + '</span>'
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
        rc.innerHTML = '<span class="badge blue">' + esc(topicName(rec.topicId)) + '</span>'
          + '<div class="big">' + (rm && rm.icon ? rm.icon + ' ' : '') + esc(rm ? rm.title : '') + '</div>'
          + '<div class="why">' + esc(rec.reason) + '</div>'
          + '<div class="btn-row" style="margin-top:12px"><button class="btn sm" data-nav="topic" data-tid="' + rec.topicId + '">开始学习</button>'
          + '<button class="btn sm ghost" data-nav="ai">让 AI 出题巩固</button></div>';
      } else {
        rc.innerHTML = '<span class="badge amber">综合挑战</span><div class="big">挑战一下综合能力</div>'
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

    // 综合挑战解锁提示（20 题综合挑战，不是单专题的「加练 5 题」）
    if (chalDone) {
      var chal = U.el('div', 'glass rec-card');
      chal.style.marginTop = '14px';
      chal.innerHTML = '<b>综合挑战已解锁</b> <span class="faint small">20 题大综合 · 七大时态混合</span>'
        + '<div class="btn-row" style="margin-top:10px"><button class="btn sm" data-nav="challenge">开始 20 题综合挑战</button></div>';
      v.appendChild(chal);
    } else if (E.isChallengeAvailable()) {
      var chalLock = U.el('div', 'glass rec-card');
      chalLock.style.marginTop = '14px';
      var doneN = 0, totalN = E.availableTopicIds().length;
      E.availableTopicIds().forEach(function (tid) {
        var s = E.topicStat(tid);
        if (s.finished && s.attempts >= 12) doneN++;
      });
      chalLock.innerHTML = '<b>综合挑战（未解锁）</b>'
        + '<div class="why">完成全部 ' + totalN + ' 个专题（每个至少一整轮）后自动解锁。当前已完成 ' + doneN + ' / ' + totalN + '。</div>'
        + '<div class="pbar" style="margin-top:10px"><i style="width:' + (totalN ? doneN / totalN * 100 : 0) + '%"></i></div>';
      v.appendChild(chalLock);
    }
    bindNav(v);
  }

  /* 最近 7 天小柱图：柱高按“题量 / 本区间最大值”，今天加一圈墨线 */
  function weekBars(series) {
    series = series || [];
    var max = 0;
    series.forEach(function (d) { if (d.answered > max) max = d.answered; });
    var wrap = U.el('div', 'week-wrap');
    var head = '<div class="week-head"><span>最近 7 天</span>'
      + '<span class="faint small">' + (max ? '最多一天 ' + max + ' 题' : '还没有记录') + '</span></div>';
    var cols = series.map(function (d) {
      var h = max ? Math.round(d.answered / max * 100) : 0;
      return '<div class="week-col' + (d.today ? ' today' : '') + '">'
        + '<div class="wc-bar"><i style="height:' + (h || 1) + '%"></i></div>'
        + '<span class="wc-d">' + d.label + '</span>'
        + '<span class="wc-n">' + (d.answered || '') + '</span></div>';
    }).join('');
    wrap.innerHTML = head + '<div class="week-cols">' + cols + '</div>';
    return wrap;
  }

  function topWeakTags(n) {
    var list = E.tagList().filter(function (t) { return t.attempts >= 2; });
    list.sort(function (a, b) { return (a.pct === null ? 1 : a.pct) - (b.pct === null ? 1 : b.pct); });
    return list.slice(0, n);
  }
  function allCoreFinished() {
    var tids = E.availableTopicIds();
    if (!tids.length) return false;
    return tids.every(function (tid) {
      var s = E.topicStat(tid);
      return s.finished && s.attempts >= 12;
    });
  }

  /* ============ 专题列表（按大专题组织，初高中通用） ============ */
  function topics() {
    var v = app.view;
    v.innerHTML = '';
    var cur = window.__EGL_CURRICULUM__;
    v.appendChild(U.el('div', '', '<div class="page-title">专题学习 · 语法填空</div>'
      + '<div class="page-sub">初高中通用：按大专题学习，内置题库直接开练；整篇 10 空的真题语篇在「上海真题语篇」里练。</div>'));

    // 顶部：真题语篇 + 解题方法课 + AI 出题 快捷入口
    var topRow = U.el('div', 'grid cards3', '');
    topRow.style.marginBottom = '14px';
    topRow.innerHTML = '<button class="mode-card glass" data-nav="papers"><h4>上海真题语篇</h4><p>' + E.availablePaperIds().length + ' 篇真卷 · 每篇整篇 10 空一起做，交卷后逐空看解析。</p></button>'
      + '<button class="mode-card glass" data-nav="method"><h4>解题方法课</h4><p>先学上海语法填空的做题顺序（数谓语 → 连词优先 → 5 类排查）与高频坑，再开练。</p></button>'
      + '<button class="mode-card glass" data-nav="ai"><h4>AI 出题</h4><p>按专题/题数生成同规格整篇，做完自动判分与错题入库。</p></button>';
    v.appendChild(topRow);

    // 大专题卡片
    (cur.categories || []).forEach(function (cat) {
      // 该大专题下已内置题库的专题
      var list = availableOfCat(cat.id);
      var card = U.el('div', 'glass cat-card');
      card.style.setProperty('--c', cat.color || 'var(--accent)');
      var acc = 0, tried = 0;
      list.forEach(function (t) {
        var a = E.topicAccuracy(t.tid);
        if (a !== null) { acc += a; tried++; }
      });
      var pctShow = tried ? '<span class="pct" style="color:' + (acc / tried >= 0.8 ? 'var(--ok)' : acc / tried >= 0.6 ? 'var(--warn)' : 'var(--bad)') + '">' + pct(acc / tried) + '</span>' : '';
      var head = '<h4>' + (cat.icon ? cat.icon + ' ' : '') + esc(cat.name) + pctShow + '</h4>'
        + '<div class="desc">' + esc(cat.desc) + '</div>';
      card.innerHTML = head;
      // 内置可练（目前 tense 系列归属谓语动词）
      if (list.length) {
        var rows = U.el('div', '', '');
        list.forEach(function (t) {
          var st2 = E.topicStatus(t.tid);
          var stText = st2 === 'master' ? '<i class="dot master"></i>'
            : st2 === 'learning' ? '<i class="dot learning"></i>'
            : st2 === 'weak' ? '<i class="dot weak"></i>'
            : '<i class="dot none"></i>';
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
        + '<button class="btn sm ghost" data-ai-cat="' + cat.id + '" style="margin-left:auto">AI 生成练习</button>';
      card.appendChild(extra);
      v.appendChild(card);
    });
    // 综合挑战（20 题大综合，别和单专题的「加练 5 题」混了）
    if (E.isChallengeAvailable()) {
      var locked = !allCoreFinished();
      var totalN = E.availableTopicIds().length;
      var cc = U.el('div', 'glass phase-card');
      cc.innerHTML = '<div class="phase-head"><h3>额外挑战</h3><span>句子级大综合</span></div>';
      var cr = U.el('div', 'topic-row');
      cr.innerHTML = '<span class="no">CH</span><span class="tt">综合挑战 · 20 题（句子级）</span>'
        + (locked ? '<span class="st">完成全部 ' + totalN + ' 个谓语动词专题后解锁</span>'
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
        E.aiUI && E.aiUI.gotoConfig(b.dataset['aiCat']);
      });
    });
    bindNav(v);
  }

  // 该大专题下：当前有真实题库的专题（初高中通用，不再按年级过滤）
  function availableOfCat(catId) {
    var out = [];
    E.availableTopicIds().forEach(function (tid) {
      var no = tid.replace('tense', '');
      var cur = window.__EGL_CURRICULUM__;
      var e = cur && cur.catOf ? cur.catOf(no) : null;
      if (!e || e.cat !== catId) return;
      out.push({ tid: tid, no: no, title: (E.metaOfTopic(tid) || {}).title || tid });
    });
    out.sort(function (a, b) { return a.no.localeCompare(b.no); });
    return out;
  }

  /* ============ 上海真题语篇（整篇 10 空） ============ */
  function papersPage() {
    var v = app.view;
    v.innerHTML = '';
    var ids = E.availablePaperIds();
    v.appendChild(U.el('div', '', '<div class="page-title">上海真题语篇 · 整篇 10 空</div>'
      + '<div class="page-sub">历年上海春考/高考与各区一模二模的语法填空（个别空位为唯一答案做了微调）。'
      + '按真卷规格整篇作答：10 个空一起填，交卷后逐空看解析；解析照区教研室答案详解写——考查点 → 句意 → 线索 → 判断 → 其它形式为何不行 → 一句话记忆。</div>'));

    var top = U.el('div', 'grid cards2', '');
    top.style.marginBottom = '14px';
    top.innerHTML = '<button class="mode-card glass" data-nav="topics"><h4>单句专题训练</h4><p>按 12 大专题练句子级填空，先打基础再看语篇。</p></button>'
      + '<button class="mode-card glass" data-nav="ai"><h4>AI 出新题</h4><p>按专题生成同规格的整篇练习，做完自动判分与入库。</p></button>';
    v.appendChild(top);

    if (!ids.length) {
      v.appendChild(U.el('div', 'empty', '还没有载入真题语篇。'));
      bindNav(v);
      return;
    }

    var card = U.el('div', 'glass cat-card');
    card.style.setProperty('--c', 'var(--accent)');
    card.appendChild(U.el('div', '', '<h4>题源列表 <span class="faint small" style="font-weight:500">共 ' + ids.length + ' 篇 · 每篇 10 空</span></h4>'
      + '<div class="desc">点开一篇即可整篇作答；做完会在“我的语法填空能力”里按大专题记分。</div>'));
    var rows = U.el('div', '');
    ids.forEach(function (pid) {
      var p = E.paperById(pid);
      if (!p) return;
      var s = E.paperStat(pid);
      var acc = s.attempts ? s.correct / s.attempts : null;
      var wrongN = E.data.wrongBook.filter(function (w) { return String(w.qid || '').indexOf('paper_' + pid + '_') === 0; }).length;
      var r = U.el('div', 'topic-row');
      r.dataset.pid = pid;
      r.style.alignItems = 'flex-start';
      r.innerHTML = '<span class="no">' + esc(p.no) + '</span>'
        + '<span class="tt" style="flex:1;min-width:0">' + esc(p.title)
        + '<span class="faint small" style="display:block;font-weight:500;margin-top:2px">'
        + esc(p.source || '') + (p.genre ? ' · ' + esc(p.genre) : '') + (p.words ? ' · ' + p.words + ' 词' : '')
        + '</span></span>'
        + '<span class="sub">' + (acc === null ? '未做' : pct(acc)) + '</span>'
        + '<span class="st">' + (wrongN ? '<span class="badge red">错 ' + wrongN + '</span>' : '<i class="dot none"></i>') + '</span>';
      rows.appendChild(r);
    });
    card.appendChild(rows);
    v.appendChild(card);

    // 真题考点频次：8 篇语篇按大专题聚合，一眼看出“哪类考点年年考”
    var freq = E.paperFreq();
    if (freq.length) {
      var fc = U.el('div', 'glass');
      fc.style.marginTop = '14px';
      fc.style.padding = '14px 16px';
      var frows = '<table class="mini-table"><tr><th>大专题</th><th>空数</th><th>篇数</th><th>考过的细点</th></tr>';
      var totalBlanks = 0;
      freq.forEach(function (c) { totalBlanks += c.blanks; });
      freq.forEach(function (c) {
        frows += '<tr><td>' + esc(c.name) + '</td>'
          + '<td>' + c.blanks + '</td>'
          + '<td>' + c.papers + ' / ' + ids.length + '</td>'
          + '<td class="faint small">' + esc(c.points.join('；')) + '</td></tr>';
      });
      frows += '</table>';
      fc.innerHTML = '<div class="sec-title" style="margin-top:0">真题考点频次 <span class="faint" style="font-weight:500">（' + ids.length + ' 篇 · ' + totalBlanks + ' 空）</span></div>'
        + frows
        + '<p class="faint small" style="margin-top:8px">空数多 = 真卷里出现得多，复习优先级就高；0 空或很少的类别（如冠词）不是不考，而是这 8 篇里没抽到，别跳过。</p>';
      v.appendChild(fc);
    }

    v.appendChild(U.el('div', 'glass', '<div class="sec-title" style="margin-top:0">做完一篇怎么用</div>'
      + '<p style="font-size:14px">① 先按“通读一遍 → 判断每个空缺什么 → 再动笔”的顺序做；② 交卷后逐个空看解析，重点看“为什么其他形式不行”；'
      + '③ 做错的空已自动进错题本，可以在错题本里按大专题回炉；④ 想再练同规格的新语篇，用「AI 出题」把专题选到那一类。</p>'));

    $$('.topic-row[data-pid]', v).forEach(function (row) {
      row.addEventListener('click', function () { E.ui.go('paper/' + row.dataset.pid); });
    });
    bindNav(v);
  }

  function paperPage(pid) {
    var v = app.view;
    var p = E.paperById(pid);
    if (!p) { v.innerHTML = '<div class="empty">语篇未找到</div>'; return; }
    var s = E.paperStat(pid);
    var acc = s.attempts ? s.correct / s.attempts : null;
    var wrongN = E.data.wrongBook.filter(function (w) { return String(w.qid || '').indexOf('paper_' + pid + '_') === 0; }).length;
    var parts = E.paperBreakdown(p);

    v.innerHTML = '';
    v.appendChild(U.el('div', '', '<button class="btn ghost sm" data-nav="papers">← 返回真题语篇</button>'));

    var head = U.el('div', 'glass', '');
    head.style.marginTop = '10px';
    head.style.padding = '16px 18px';
    head.innerHTML = '<div class="page-title" style="font-size:20px">' + esc(p.title) + '</div>'
      + '<div class="page-sub">' + esc(p.source || '') + ' · ' + esc(p.level || '') + ' · ' + esc(p.genre || '')
      + (p.words ? ' · ' + p.words + ' 词' : '') + (p.topic ? ' · ' + esc(p.topic) : '') + '</div>'
      + '<div class="grid cards4" style="margin-top:14px">'
      + '<div class="stat-card" style="padding:8px"><div class="k">空数</div><div class="v" style="font-size:19px">' + (p.blanks || []).length + '</div></div>'
      + '<div class="stat-card" style="padding:8px"><div class="k">正确率</div><div class="v" style="font-size:19px">' + (acc === null ? '未做' : pct(acc)) + '</div></div>'
      + '<div class="stat-card" style="padding:8px"><div class="k">累计作答</div><div class="v" style="font-size:19px">' + s.attempts + '</div></div>'
      + '<div class="stat-card" style="padding:8px"><div class="k">错题</div><div class="v" style="font-size:19px">' + wrongN + '</div></div>'
      + '</div>';
    v.appendChild(head);

    if (p.readGuide) {
      v.appendChild(U.el('div', 'glass', '<div class="sec-title" style="margin-top:0">通读提示</div>'
        + '<p style="font-size:14px">' + esc(p.readGuide) + '</p>'
        + '<p class="faint small">先按整篇读一遍再动笔：上海卷的空多数要靠上下文，不看全篇很容易只凭一个词猜。</p>'));
    }

    var mode = U.el('div', 'glass', '');
    mode.style.marginTop = '14px';
    mode.style.padding = '18px';
    mode.innerHTML = '<div class="sec-title" style="margin-top:0">开始整篇作答</div>'
      + '<div class="mode-grid">'
      + '<div class="mode-card glass" data-start="1"><h4>整篇卷面 · 10 空一起填</h4><p>与真卷一致：先通读，再逐空填写，全部答完统一交卷，交卷后逐空看解析。</p></div>'
      + '<div class="mode-card glass" data-start="timed"><h4>限时模拟考 · 10 分钟</h4><p>右上角倒计时，到点自动交卷；没填的空算未作答，先体验真卷的时间压力。</p></div>'
      + '</div>'
      + '<div class="btn-row" style="margin-top:12px">'
      + '<button class="btn ghost sm" data-print="sheet">打印练习卷（带答题线）</button>'
      + '<button class="btn ghost sm" data-print="answers">打印答案与解析</button>'
      + '</div>';
    v.appendChild(mode);

    var kp = U.el('div', 'glass', '');
    kp.style.marginTop = '14px';
    kp.style.padding = '14px 16px';
    var rows = '<table class="mini-table"><tr><th>空</th><th>考点</th><th>大类</th><th>提示词</th></tr>';
    (p.blanks || []).forEach(function (b, i) {
      rows += '<tr><td>' + (i + 1) + '</td><td>' + esc(b.point || '') + '</td><td>' + esc(E.catLabelOf(b.catId))
        + '</td><td>' + (b.isGiven && b.given ? esc(b.given) : '<span class="faint">无</span>') + '</td></tr>';
    });
    rows += '</table>';
    var chips = parts.map(function (c) {
      return '<span class="problem-chip"><b>' + c.count + '</b> 空 · ' + esc(c.name) + '</span>';
    }).join('');
    kp.innerHTML = '<div class="sec-title" style="margin-top:0">考点分布（' + (p.blanks || []).length + ' 空）</div>'
      + '<div style="margin-bottom:10px">' + chips + '</div>' + rows
      + '<p class="faint small" style="margin-top:8px">提示词“无”的空是纯逻辑填空，只填 1 个词（个别固定搭配 2 个词，如 instead of / so that）。</p>';
    v.appendChild(kp);

    $$('[data-start]', mode).forEach(function (b) {
      b.addEventListener('click', function () {
        if (E.quiz && E.quiz.startPaper) E.quiz.startPaper(pid, { timed: b.dataset.start === 'timed' });
      });
    });
    $$('[data-print]', mode).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!E.print) { U.toast('当前版本不支持打印', 'bad'); return; }
        if (b.dataset.print === 'sheet') E.print.paperSheet(pid);
        else E.print.paperAnswers(pid);
      });
    });
    bindNav(v);
  }


  /* ============ 今日复习（间隔重复队列） ============ */
  function reviewPage() {
    var v = app.view;
    v.innerHTML = '';
    var ws = E.wrongStats();
    var queue = E.reviewQueue(12);
    v.appendChild(U.el('div', '', '<div class="page-title">今日复习</div>'
      + '<div class="page-sub">按 1 / 2 / 4 / 7 / 15 天排期：今天到期 ' + ws.due + ' 空 · 未掌握 ' + ws.active + ' 空 · 已掌握 ' + ws.mastered + ' 空</div>'));

    if (!ws.active) {
      v.appendChild(U.el('div', 'glass empty', '错题本里没有未掌握的题<br><span class="faint small">做错题会自动进来，到日子了首页会提醒你</span>'));
      var b0 = U.el('div', 'btn-row');
      b0.innerHTML = '<button class="btn ghost" data-nav="topics">去练新题</button>';
      v.appendChild(b0);
      bindNav(v);
      return;
    }
    if (!queue.length) {
      v.appendChild(U.el('div', 'glass empty', '今天没有到期的空<br><span class="faint small">按计划复习比一直刷新题更有效，明天再来</span>'));
      var b1 = U.el('div', 'btn-row');
      b1.innerHTML = '<button class="btn ghost" data-nav="wrong">看看错题本</button>'
        + '<button class="btn ghost" data-nav="custom">组一套专卷</button>';
      v.appendChild(b1);
      bindNav(v);
      return;
    }

    v.appendChild(U.el('div', 'glass', '<div class="sec-title" style="margin-top:0">本轮 ' + queue.length + ' 空</div>'
      + '<p class="small faint">答对 → 复习间隔往后推一档；再错 → 回到第一档、今天再到期。第 5 次答对标为“已掌握”。</p>'));
    var list = U.el('div', '');
    queue.forEach(function (q, i) {
      var card = U.el('div', 'glass review-item');
      var cat = (q.aiMeta && q.aiMeta.catName) || E.catLabelOf((q.aiMeta && q.aiMeta.catId) || '');
      card.innerHTML = '<div class="head"><span class="badge gray">' + (i + 1) + '</span>'
        + '<span class="badge blue">' + esc(cat) + '</span>'
        + (q.tag ? '<span class="badge gray">' + esc(q.tag) + '</span>' : '')
        + '</div><div class="q">' + esc(q.question) + '</div>';
      list.appendChild(card);
    });
    v.appendChild(list);

    var act = U.el('div', 'btn-row');
    act.style.marginTop = '12px';
    act.innerHTML = '<button class="btn" data-review-start="1">开始复习（' + queue.length + ' 空）</button>'
      + '<button class="btn ghost" data-nav="wrong">去错题本筛选</button>';
    v.appendChild(act);
    $$('[data-review-start]', act).forEach(function (b) {
      b.addEventListener('click', function () { if (E.quiz && E.quiz.startReview) E.quiz.startReview(); });
    });
    bindNav(v);
  }

  /* ============ 我的专卷（按薄弱点组 10 空） ============ */
  function customPage() {
    var v = app.view;
    v.innerHTML = '';
    var cust = E.getCustomPaper();
    v.appendChild(U.el('div', '', '<div class="page-title">我的专卷</div>'
      + '<div class="page-sub">按薄弱点抽 10 题：先取未掌握错题，再按最弱的大专题取真题语篇空，最后用题库扩展题补满。每次组卷都会保存，可重做。</div>'));

    if (!cust || !cust.items || !cust.items.length) {
      v.appendChild(U.el('div', 'glass empty', '还没有组过卷<br><span class="faint small">点下面按钮，按你现在的薄弱点组一套 10 空</span>'));
      var e0 = U.el('div', 'btn-row');
      e0.innerHTML = '<button class="btn" data-custom-build="1">按薄弱点组一套（10 空）</button>';
      v.appendChild(e0);
      var eb = $('[data-custom-build]', e0);
      if (eb) eb.addEventListener('click', function () { E.buildCustomPaper(); customPage(); U.toast('已生成专卷', 'ok'); });
      bindNav(v);
      return;
    }

    var head = U.el('div', 'glass');
    head.style.padding = '16px 18px';
    var distHtml = Object.keys(cust.dist || {}).map(function (cid) {
      return '<span class="problem-chip" style="background:var(--accent-soft);border-color:var(--accent-soft);color:var(--hl)">'
        + '<b>' + cust.dist[cid] + '</b> 空 · ' + esc(E.catLabelOf(cid)) + '</span>';
    }).join('');
    head.innerHTML = '<div class="page-title" style="font-size:19px">' + esc(cust.date) + ' 的专卷</div>'
      + '<div class="page-sub">' + cust.items.length + ' 空 · 组卷时间 ' + new Date(cust.ts).toLocaleString() + '</div>'
      + '<div style="margin-top:10px">' + (distHtml || '<span class="faint small">暂无分布</span>') + '</div>';
    v.appendChild(head);

    var mode = U.el('div', 'glass');
    mode.style.marginTop = '14px';
    mode.style.padding = '18px';
    mode.innerHTML = '<div class="sec-title" style="margin-top:0">开始做这套卷</div>'
      + '<div class="mode-grid">'
      + '<div class="mode-card glass" data-custom-start="normal"><h4>普通作答</h4><p>10 个空一次填完，交卷后逐空看解析。</p></div>'
      + '<div class="mode-card glass" data-custom-start="timed"><h4>限时 10 分钟</h4><p>倒计时结束自动交卷，模拟真卷时间压力。</p></div>'
      + '</div>'
      + '<div class="btn-row" style="margin-top:12px">'
      + '<button class="btn ghost sm" data-custom-build="1">重新组卷</button>'
      + '<button class="btn ghost sm" data-custom-print="1">打印这套卷</button>'
      + '<button class="btn ghost sm" data-custom-clear="1" style="color:var(--bad)">删除这套卷</button>'
      + '</div>';
    v.appendChild(mode);

    var prev = U.el('div', 'glass');
    prev.style.marginTop = '14px';
    prev.style.padding = '14px 16px';
    var rows = '<table class="mini-table"><tr><th>#</th><th>考点</th><th>提示词</th><th>题干</th></tr>';
    cust.items.forEach(function (it, i) {
      rows += '<tr><td>' + (i + 1) + '</td><td>' + esc(it.catName || E.catLabelOf(it.catId)) + '</td>'
        + '<td>' + (it.hint ? esc(it.hint) : '<span class="faint">无</span>') + '</td>'
        + '<td class="small">' + esc(String(it.question || '').slice(0, 90)) + (String(it.question || '').length > 90 ? '…' : '') + '</td></tr>';
    });
    rows += '</table>';
    prev.innerHTML = '<div class="sec-title" style="margin-top:0">题目预览</div>' + rows;
    v.appendChild(prev);

    $$('[data-custom-start]', mode).forEach(function (b) {
      b.addEventListener('click', function () {
        if (E.quiz && E.quiz.startCustom) E.quiz.startCustom({ timed: b.dataset.customStart === 'timed' });
      });
    });
    $$('[data-custom-build]', v).forEach(function (b) {
      b.addEventListener('click', function () {
        E.buildCustomPaper();
        customPage();
        U.toast('已按当前薄弱点重新组卷', 'ok');
      });
    });
    var pb = $('[data-custom-print]', mode);
    if (pb) pb.addEventListener('click', function () {
      if (!E.print) { U.toast('当前版本不支持打印', 'bad'); return; }
      E.print.custom(cust);
    });
    var cb = $('[data-custom-clear]', mode);
    if (cb) cb.addEventListener('click', function () {
      U.confirmBox('删除这套专卷', '只删除这份组卷记录，不影响错题与统计。确定？', '删除', true).then(function (ok) {
        if (ok) { E.clearCustomPaper(); customPage(); U.toast('已删除', 'ok'); }
      });
    });
    bindNav(v);
  }


  /* ============ 专题页（含模式选择） ============ */
  function topicPage(tid) {
    var v = app.view;
    var meta = metaById(tid);
    if (!meta) { v.innerHTML = '<div class="empty">专题未找到</div>'; return; }
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
    head.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
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
      + '<div class="mode-card glass" data-mode="normal"><h4>普通模式</h4><p>每题答完立刻看对错与解析，适合学习新知识。</p></div>'
      + '<div class="mode-card glass" data-mode="blind"><h4>盲做模式</h4><p>一口气做完 12 题再看答案，模拟真实考试。</p></div>'
      + '</div>';
    if (unlockedChal) {
      modeHtml += '<div class="btn-row" style="margin-top:12px"><button class="btn warn sm" data-chal="1">加练 · 高难 5 题（已解锁）</button></div>';
    } else if (s.finished) {
      modeHtml += '<div class="btn-row" style="margin-top:12px"><button class="btn sm" disabled>加练 · 高难 5 题：正确率 ≥90% 后解锁</button></div>';
    }
    if (wrongCount > 0) {
      modeHtml += '<div class="btn-row" style="margin-top:10px"><button class="btn ghost sm" data-retrain="1">再练 5 题（针对薄弱点，新题）</button>'
      + '<button class="btn ghost sm" data-wrongretrain="1">错题回炉 5 题</button></div>';
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

  /* ============ 错题本（筛选 / 复习进度 / 笔记 / 打印） ============ */
  var WB_FILTER = { cat: 'all', src: 'all', state: 'all', sort: 'recent', show: 30 };
  function dueLabel(w) {
    if (w.mastered) return '已掌握';
    if (!w.dueAt) return '待排期';
    var today = E.util.startOfDay(Date.now());
    var dd = E.util.startOfDay(w.dueAt);
    var diff = Math.round((dd - today) / 86400000);
    if (diff <= 0) return '今天到期';
    return diff + ' 天后复习';
  }
  function wrongBook() {
    var v = app.view;
    var all = E.data.wrongBook;
    var ws = E.wrongStats();
    v.innerHTML = '';
    v.appendChild(U.el('div', '', '<div class="page-title">错题本</div>'
      + '<div class="page-sub">共 ' + ws.total + ' 条 · 未掌握 ' + ws.active + ' · 今天到期 ' + ws.due
      + ' · 同一题再错会累加次数并把复习打回第一阶</div>'));

    if (!all.length) {
      v.appendChild(U.el('div', 'glass empty', '还没有错题<br><span class="faint small">做错的题会自动收进来，加油！</span>'));
      return;
    }

    // 顶部动作
    var top = U.el('div', 'btn-row');
    top.style.marginBottom = '10px';
    top.innerHTML = '<button class="btn sm" data-nav="review"' + (ws.due ? '' : ' disabled') + '>今日复习' + (ws.due ? '（' + ws.due + '）' : '') + '</button>'
      + '<button class="btn ghost sm" data-wbprint="1">打印当前筛选结果</button>';
    v.appendChild(top);

    // 筛选条
    var catIds = {}, srcIds = {};
    all.forEach(function (w) {
      catIds[w.catId || 'extra'] = 1;
      srcIds[w.source || 'bank'] = 1;
    });
    var catOpts = '<option value="all">全部大专题</option>' + Object.keys(catIds).map(function (cid) {
      return '<option value="' + esc(cid) + '"' + (WB_FILTER.cat === cid ? ' selected' : '') + '>' + esc(E.catLabelOf(cid)) + '</option>';
    }).join('');
    var srcNames = { bank: '内置题库', paper: '真题语篇', ai: 'AI 训练', review: '复习', custom: '专卷' };
    var srcOpts = '<option value="all">全部来源</option>' + Object.keys(srcIds).map(function (s) {
      return '<option value="' + esc(s) + '"' + (WB_FILTER.src === s ? ' selected' : '') + '>' + esc(srcNames[s] || s) + '</option>';
    }).join('');
    var stateOpts = '<option value="all">全部状态</option>'
      + '<option value="active"' + (WB_FILTER.state === 'active' ? ' selected' : '') + '>未掌握</option>'
      + '<option value="due"' + (WB_FILTER.state === 'due' ? ' selected' : '') + '>今天到期</option>'
      + '<option value="mastered"' + (WB_FILTER.state === 'mastered' ? ' selected' : '') + '>已掌握</option>';
    var sortOpts = '<option value="recent"' + (WB_FILTER.sort === 'recent' ? ' selected' : '') + '>按最近出错</option>'
      + '<option value="times"' + (WB_FILTER.sort === 'times' ? ' selected' : '') + '>按错误次数</option>'
      + '<option value="due"' + (WB_FILTER.sort === 'due' ? ' selected' : '') + '>按复习到期</option>';
    var bar = U.el('div', 'filter-bar');
    bar.innerHTML = '<label>大专题<select data-wb="cat">' + catOpts + '</select></label>'
      + '<label>来源<select data-wb="src">' + srcOpts + '</select></label>'
      + '<label>状态<select data-wb="state">' + stateOpts + '</select></label>'
      + '<label>排序<select data-wb="sort">' + sortOpts + '</select></label>';
    v.appendChild(bar);

    // 过滤 + 排序
    var list = all.filter(function (w) {
      if (WB_FILTER.cat !== 'all' && (w.catId || 'extra') !== WB_FILTER.cat) return false;
      if (WB_FILTER.src !== 'all' && (w.source || 'bank') !== WB_FILTER.src) return false;
      if (WB_FILTER.state === 'active' && w.mastered) return false;
      if (WB_FILTER.state === 'mastered' && !w.mastered) return false;
      if (WB_FILTER.state === 'due' && (w.mastered || !w.dueAt || w.dueAt > Date.now())) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (WB_FILTER.sort === 'times') return (b.times || 1) - (a.times || 1);
      if (WB_FILTER.sort === 'due') return (a.dueAt || 0) - (b.dueAt || 0);
      return (b.lastAt || 0) - (a.lastAt || 0);
    });

    if (!list.length) {
      v.appendChild(U.el('div', 'glass empty', '当前筛选下没有错题<br><span class="faint small">换一个筛选条件试试</span>'));
      bindNav(v);
      return;
    }

    var box = U.el('div', '');
    list.slice(0, WB_FILTER.show).forEach(function (w) {
      var isAI = w.source === 'ai';
      var isPaper = w.source === 'paper';
      var isCustom = w.source === 'custom' || w.source === 'review';
      var isRich = isAI || isPaper || isCustom;
      var q = isRich ? null : E.findQuestion(w.topicId, w.qid);
      var card = U.el('div', 'glass wb-item' + (w.mastered ? ' mastered' : ''));
      var meta = isRich ? null : metaById(w.topicId);
      var icon = isRich ? '' : (meta && meta.icon ? meta.icon : '');
      var redoable = !!E.resolveWrongQuestion(w);
      card.innerHTML = '<div class="head">'
        + (isAI ? '<span class="badge gray">AI 训练</span> ' : '')
        + (isPaper ? '<span class="badge gray">真题语篇</span> ' : '')
        + (isCustom ? '<span class="badge gray">复习/专卷</span> ' : '')
        + '<span class="badge gray">' + (icon ? icon + ' ' : '') + esc(w.topicTitle || (w.kp || '错题')) + '</span>'
        + (w.kp ? '<span class="badge blue">' + esc(w.kp) + '</span>' : (w.tag ? '<span class="badge blue">' + esc(w.tag) + '</span>' : ''))
        + '<span class="badge red">' + wtZh(w.wrongType) + '</span>'
        + '<span class="badge amber">错 ' + w.times + ' 次</span>'
        + '<span class="badge ' + (w.mastered ? 'green' : (w.dueAt && w.dueAt <= Date.now() ? 'blue' : 'gray')) + '">' + esc(dueLabel(w)) + '</span>'
        + '<span class="badge gray">' + w.lastDate + '</span>'
        + '<span style="margin-left:auto;display:flex;gap:6px">'
        + '<button class="btn ghost sm" style="padding:4px 10px" data-redo="' + esc(w.qid) + '"' + (redoable ? '' : ' disabled') + '>重做这题</button>'
        + '<button class="btn ghost sm" style="padding:4px 10px" data-del="' + esc(w.qid) + '">删除</button>'
        + '</span>'
        + '</div>'
        + '<div class="q">' + esc(w.question) + '</div>'
        + '<div class="wb-meta"><span>我的答案：<span class="mya">' + esc(w.myAnswer === undefined || w.myAnswer === null || w.myAnswer === '' ? '（未作答）' : w.myAnswer) + '</span></span>'
        + '<span>正确答案：<span class="cora">' + esc(w.correctAnswer) + '</span></span>'
        + (w.mastered ? '<span class="faint">连续答对 5 次，已掌握（仍可重做）</span>' : '')
        + '</div>'
        + '<label class="wb-note-wrap"><span class="lb">我为什么错</span>'
        + '<textarea class="wb-note" rows="1" data-note="' + esc(w.qid) + '" placeholder="一句话写下当时的想法，复习时先看这句">' + esc(w.notes || '') + '</textarea></label>';

      if (isRich && w.explText) {
        var dAI = U.el('details', 'qa explanation-panel');
        dAI.style.marginTop = '10px';
        var pseudo = {
          type: 'input', tag: w.kp || w.tag || '',
          answerText: w.correctAnswer,
          explanation: {
            answer: w.correctAnswer,
            keyPoint: (w.kp ? '考点：' + w.kp : '考点：AI 语法题'),
            clue: '', trap: '', chain: '',
            why: w.explText,
            whyOthers: '',
            commonError: isPaper
              ? '真题语篇的错题：回「上海真题语篇」把整篇再做一遍，比单看这一空更有效。'
              : 'AI 生成题，重做可到「AI 出题」按薄弱点再生成。',
            memory: '', cue: '', examMind: ''
          }
        };
        dAI.innerHTML = '<summary>查看解析与考点</summary>'
          + U.explanationHTML(pseudo, { correctText: w.correctAnswer, myText: w.myAnswer, myOk: false, grammar: (w.kp || 'AI题') });
        card.appendChild(dAI);
      } else if (q) {
        var det = U.el('details', 'qa explanation-panel');
        det.style.marginTop = '10px';
        var corText = q.type === 'choice' ? (q.options[q.answerIndex]) : (q.answerText || (q.accepted && q.accepted[0]));
        det.innerHTML = '<summary>查看解析与考点</summary>'
          + U.explanationHTML(q, { correctText: corText, myText: w.myAnswer, myOk: false, grammar: (meta && meta.title) || '' });
        card.appendChild(det);
      }
      // AI 讲解：错题本里也能一键换成“更简单的话”
      if (E.quiz && E.quiz.explain) {
        var explainQ = q || (typeof pseudo !== 'undefined' ? pseudo : null);
        if (explainQ) {
          var exRow = U.el('div', 'ai-explain-row');
          var exBtn = U.el('button', 'btn ghost sm', '让 AI 用更简单的话讲这道题');
          exBtn.type = 'button';
          exRow.appendChild(exBtn);
          card.appendChild(exRow);
          exBtn.addEventListener('click', function () { E.quiz.explain(explainQ); });
        }
      }
      box.appendChild(card);
    });
    v.appendChild(box);

    if (list.length > WB_FILTER.show) {
      var moreRow = U.el('div', 'btn-row');
      moreRow.style.marginTop = '8px';
      moreRow.innerHTML = '<button class="btn ghost" data-wbmore="1">显示更多（还有 ' + (list.length - WB_FILTER.show) + ' 条）</button>';
      v.appendChild(moreRow);
      var moreBtn = $('[data-wbmore]', v);
      if (moreBtn) moreBtn.addEventListener('click', function () { WB_FILTER.show += 30; wrongBook(); });
    }

    var foot = U.el('div', 'btn-row', '');
    foot.style.marginTop = '10px';
    foot.innerHTML = '<button class="btn ghost" data-clear="1">清空错题本</button>'
      + '<button class="btn ghost" data-nav="weak">去练薄弱点</button>';
    v.appendChild(foot);

    $$('[data-wb]', bar).forEach(function (sel) {
      sel.addEventListener('change', function () {
        WB_FILTER[sel.dataset.wb] = sel.value;
        WB_FILTER.show = 30;
        wrongBook();
      });
    });
    $$('[data-del]', v).forEach(function (b) {
      b.addEventListener('click', function () {
        E.removeWrong(b.dataset.del);
        wrongBook();
        U.toast('已删除', 'ok');
      });
    });
    $$('[data-redo]', v).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        if (E.quiz && E.quiz.startReview) E.quiz.startReview([b.dataset.redo]);
      });
    });
    // 错题笔记：输入停 400ms 再存，避免每敲一个字就写 localStorage
    var noteTimers = {};
    $$('[data-note]', v).forEach(function (ta) {
      ta.addEventListener('input', function () {
        var qid = ta.dataset.note;
        if (noteTimers[qid]) clearTimeout(noteTimers[qid]);
        noteTimers[qid] = setTimeout(function () { E.setWrongNote(qid, ta.value); }, 400);
      });
    });
    var printBtn = $('[data-wbprint]', v);
    if (printBtn) printBtn.addEventListener('click', function () {
      if (!E.print) { U.toast('当前版本不支持打印', 'bad'); return; }
      E.print.wrongList(list, '错题单');
    });
    var clearBtn = $('[data-clear]', v);
    if (clearBtn) clearBtn.addEventListener('click', function () {
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
    v.appendChild(U.el('div', '', '<div class="page-title">我的薄弱点分析</div>'
      + '<div class="page-sub">先看答题画像，再看专题与雷区：正确率越低越靠前，直接针对性训练</div>'));

    // 答题画像：选择 vs 输入、难度分层、平均每题耗时
    var pf = E.profileStats();
    if (pf.totalAttempts > 0) {
      v.appendChild(U.el('div', 'sec-title', '答题画像 <span class="faint" style="font-weight:500">（累计作答）</span>'));
      var pc = U.el('div', 'glass');
      pc.style.padding = '12px 16px';
      var typeRow = '<div class="profile-row"><span class="lb">选择题</span>'
        + U.progressBar(pf.choice.pct === null ? 0 : pf.choice.pct, pf.choice.pct !== null && pf.choice.pct < 0.6 ? 'bad' : '')
        + '<span class="v">' + (pf.choice.pct === null ? '—' : pct(pf.choice.pct)) + '</span>'
        + '<span class="faint small">' + pf.choice.correct + '/' + pf.choice.attempts + '</span></div>'
        + '<div class="profile-row"><span class="lb">填空输入</span>'
        + U.progressBar(pf.input.pct === null ? 0 : pf.input.pct, pf.input.pct !== null && pf.input.pct < 0.6 ? 'bad' : '')
        + '<span class="v">' + (pf.input.pct === null ? '—' : pct(pf.input.pct)) + '</span>'
        + '<span class="faint small">' + pf.input.correct + '/' + pf.input.attempts + '</span></div>'
        + '<div class="profile-row"><span class="lb">平均每题</span>'
        + '<span class="v" style="margin-left:0">' + (pf.avgSeconds === null ? '—' : Math.round(pf.avgSeconds) + ' 秒') + '</span>'
        + '<span class="faint small">' + (pf.input.pct !== null && pf.choice.pct !== null && pf.input.pct + 0.15 < pf.choice.pct
            ? '输入比选择低不少：做题时多动手写，别只看选项眼熟' : '选择题与输入题差距不大，基础还算稳') + '</span></div>';
      var diffRows = '<table class="mini-table" style="margin-top:8px"><tr><th>难度</th><th>作答</th><th>正确率</th></tr>';
      var hasDiff = false;
      pf.byDiff.forEach(function (d) {
        if (!d.attempts) return;
        hasDiff = true;
        diffRows += '<tr><td>' + d.difficulty + ' / 5</td><td>' + d.correct + ' / ' + d.attempts + '</td>'
          + '<td>' + pct(d.pct) + '</td></tr>';
      });
      diffRows += '</table>';
      pc.innerHTML = typeRow + (hasDiff ? diffRows : '');
      v.appendChild(pc);
    }

    // 专题级
    var weakT = E.weakTopics().filter(function (t) { return t.pct < 0.9; });
    if (weakT.length) {
      v.appendChild(U.el('div', 'sec-title', '专题正确率（由低到高）'));
      var c1 = U.el('div', 'glass', '');
      c1.style.padding = '10px 16px';
      weakT.forEach(function (t) {
        var row = U.el('div', 'bar-row');
        row.innerHTML = '<span class="nm">' + (t.meta && t.meta.icon ? t.meta.icon + ' ' : '') + esc(t.meta ? t.meta.title : t.id) + '</span>'
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
      v.appendChild(U.el('div', 'glass empty', '还没有足够数据<br><span class="faint small">做完几个专题后，这里会告诉你哪里最需要补</span>'));
    }
    bindNav(v);
  }

  /* ============ 学习记录 ============ */
  function records() {
    var v = app.view;
    v.innerHTML = '';
    var stR = E.overallStats();
    v.appendChild(U.el('div', '', '<div class="page-title">学习记录</div>'
      + '<div class="page-sub">连续学习 ' + stR.streak.days + ' 天 · 累计 ' + stR.answered + ' 题 · 每轮练习都会记录在这里</div>'));
    v.appendChild(weekBars(stR.week));

    var sessions = E.data.sessions.slice().reverse();
    if (sessions.length) {
      var c = U.el('div', '', '');
      sessions.slice(0, 60).forEach(function (s) {
        var isAI = s.mode === 'ai' || s.topicId === 'ai';
        var meta = isAI ? null : metaById(s.topicId);
        var modeZh = {
          normal: '普通模式', blind: '盲做模式', retrain: '再练 5 题', challenge: '加练 5 题',
          wrongretrain: '错题回炉', mixed: '综合挑战', ai: 'AI 训练', review: '今日复习',
          custom: '我的专卷', paper: '真题语篇'
        }[s.mode] || s.mode;
        var nameTxt = isAI ? (s.label || 'AI 出题训练') : topicName(s.topicId);
        var it = U.el('div', 'glass hist-item');
        var grade = U.gradeOf(s.correct, s.total);
        it.innerHTML = '<span class="d">' + s.date + '</span>'
          + '<span class="t">' + (meta && meta.icon ? meta.icon + ' ' : '') + esc(nameTxt) + ' <span class="badge gray">' + esc(modeZh) + '</span></span>'
          + '<span class="s" style="color:' + grade.color + '">' + s.correct + '/' + s.total + '</span>'
          + '<span class="faint small" style="width:64px;text-align:right">' + U.fmtTime(s.seconds) + '</span>';
        c.appendChild(it);
      });
      v.appendChild(c);
    } else {
      v.appendChild(U.el('div', 'glass empty', '还没有学习记录<br><span class="faint small">开始第一个专题吧</span>'));
    }

    // 数据管理
    v.appendChild(U.el('div', 'sec-title', '数据管理（localStorage）'));
    var prefsBk = prefsGet();
    var lastBk = prefsBk.lastBackupAt || 0;
    var needBackup = E.data.global.answered > 0 && (!lastBk || (Date.now() - lastBk) > 7 * 86400000);
    var mg = U.el('div', 'glass', '');
    mg.style.padding = '14px 16px';
    mg.innerHTML = (needBackup
        ? '<div class="backup-note"><b>该备份了</b>　'
          + (lastBk ? '上次导出是 ' + E.util.dayKey(lastBk) + '，已经超过 7 天。' : '你还没有导出过备份。')
          + '换浏览器或清缓存会丢数据。</div>'
        : '')
      + '<div class="small faint" style="margin-bottom:10px">学习数据保存在本机浏览器 localStorage，换浏览器/清缓存会丢。'
      + (lastBk ? '上次导出：' + E.util.dayKey(lastBk) + '。' : '建议每周导出一次备份。') + '</div>'
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
      var p = prefsGet();
      p.lastBackupAt = Date.now();
      prefsSet(p);
      U.toast('已导出备份', 'ok');
      records();
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
            U.toast('需先完成全部 ' + E.availableTopicIds().length + ' 个专题（每个一整轮）', 'bad');
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
    if (!m) { v.innerHTML = '<div class="empty">方法课内容缺失</div>'; return; }
    v.appendChild(U.el('div', '', '<div class="page-title">' + esc(m.title) + '</div>'
      + '<div class="page-sub">' + esc(m.intro) + '</div>'));
    // 上海卷 10 空结构速览
    if (m.facts && m.facts.length) {
      var fc = U.el('div', 'glass', '');
      fc.style.padding = '14px 18px';
      fc.style.marginTop = '14px';
      fc.innerHTML = '<div class="sec-title" style="margin-top:0">上海卷 10 空速览</div>';
      m.facts.forEach(function (f) {
        var row = U.el('div', 'kblock', '');
        row.innerHTML = '<div class="lb">' + esc(f.k) + '</div><p>' + esc(f.v) + '</p>';
        fc.appendChild(row);
      });
      v.appendChild(fc);
    }
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

    // 无提示词候选池（连词 > 介词 > 冠词 > 代词 > 情态）
    if (m.pool && m.pool.length) {
      v.appendChild(U.el('div', 'sec-title', '无提示词候选池：只有 5 类（按排查优先级排序）'));
      m.pool.forEach(function (p) {
        var pc = U.el('div', 'glass', '');
        pc.style.padding = '16px 18px';
        pc.style.marginTop = '10px';
        var ph = '<div class="sec-title" style="margin-top:0">' + esc(p.prio) + ' · ' + esc(p.name) + '</div>'
          + '<div class="kblock"><div class="lb">什么时候选它</div><p>' + esc(p.when) + '</p></div>';
        if (p.how && p.how.length) {
          ph += '<div class="kblock"><div class="lb">怎么做</div><ul>';
          p.how.forEach(function (x) { ph += '<li>' + esc(x) + '</li>'; });
          ph += '</ul></div>';
        }
        if (p.example) ph += '<div class="kblock"><div class="lb">示例</div><p class="hl">' + esc(p.example) + '</p></div>';
        pc.innerHTML = ph;
        v.appendChild(pc);
      });
    }

    // 快速排查流程（一句话版）
    if (m.quickFlow && m.quickFlow.length) {
      v.appendChild(U.el('div', 'sec-title', '拿不准？快速排查流程（一句话版）'));
      var qc = U.el('div', 'glass', '');
      qc.style.padding = '16px 18px';
      var qflow = U.el('ol', 'ex-flow');
      m.quickFlow.forEach(function (s) {
        qflow.appendChild(U.el('li', '', '<b>' + esc(s) + '</b>'));
      });
      qc.appendChild(qflow);
      v.appendChild(qc);
    }

    // 高频坑（最高频陷阱排前面）
    var trapSec = U.el('div', 'sec-title', m.trapTitle || '上海卷高频陷阱（做题前必看）');
    v.appendChild(trapSec);
    var tc = U.el('div', 'glass', '');
    tc.style.padding = '12px 16px';
    (m.fiveTrapTips || []).forEach(function (t) {
      var row = U.el('div', 'kblock', '');
      row.innerHTML = '<div class="lb">' + esc(t.name) + '</div><p>' + esc(t.text) + '</p>';
      tc.appendChild(row);
    });
    v.appendChild(tc);

    var act = U.el('div', 'btn-row', '');
    act.style.marginTop = '16px';
    act.innerHTML = '<button class="btn" data-nav="topics">去选专题练习</button>'
      + '<button class="btn ok" data-nav="ai">让 AI 生成一篇练手</button>';
    v.appendChild(act);
    bindNav(v);
  }

  /* ============ 关于（作者 / 联系方式 / 项目介绍） ============ */
  function aboutPage() {
    var v = app.view;
    v.innerHTML = '';
    var id = (E.brand && E.brand.identity) ? E.brand.identity() : null;
    var name = id ? id.name : 'Hison';
    var dy = id ? id.douyin : '';
    var xhs = id ? id.xhs : '';

    v.appendChild(U.el('div', '', '<div class="page-title">关于</div>'
      + '<div class="page-sub">谁做的、怎么联系、为什么有这个站</div>'));

    // 作者 + 联系方式
    var who = U.el('div', 'glass', '');
    who.style.padding = '16px 18px';
    var wh = '<div class="sec-title" style="margin-top:0">关于作者</div>'
      + '<div class="kblock"><div class="lb">' + esc(name) + '</div>'
      + '<p>上海的高一学生。语法填空一直是我的弱项，练的时候又找不到顺手的方式，'
      + '所以自己边学边写了这个工具，给同学和需要的人免费用。</p></div>'
      + '<div class="sec-title">联系我</div>'
      + '<div class="about-links">';
    if (dy) {
      wh += '<div class="about-link"><span class="lb">抖音</span>'
        + '<a href="https://v.douyin.com/e5QisJORWpc/" target="_blank" rel="noopener">' + esc(dy) + '</a></div>';
    }
    if (xhs) {
      wh += '<div class="about-link"><span class="lb">小红书</span>'
        + '<a href="https://xhslink.cn/o/AcNQAbM9pNE" target="_blank" rel="noopener">' + esc(xhs) + '</a></div>';
    }
    wh += '<div class="about-link"><span class="lb">GitHub</span>'
      + '<a href="https://github.com/XiaoRui114514/english-grammar-lab" target="_blank" rel="noopener">english-grammar-lab</a></div>'
      + '</div>'
      + '<div class="small faint" style="margin-top:10px">做题遇到问题、发现答案或解析有错、想提建议，都可以从上面任意一个渠道找我。</div>';
    who.innerHTML = wh;
    v.appendChild(who);

    // 项目介绍
    var intro = U.el('div', 'glass', '');
    intro.style.padding = '16px 18px';
    intro.style.marginTop = '14px';
    intro.innerHTML = '<div class="sec-title" style="margin-top:0">关于这个项目</div>'
      + '<div class="kblock"><div class="lb">它是什么</div>'
      + '<p>一个英语语法填空练习工具，打开网页就能用，不用注册、不用装软件，做过的记录和错题都留在你自己的浏览器里。</p></div>'
      + '<div class="kblock"><div class="lb">为什么做</div>'
      + '<p>市面上的练习要么散在各处、要么不能离线用。这个页面把考点、方法、练习和错题整理到了一起，'
      + '内容按上海卷的命题习惯编排，初高中都能用，其他地区也通用。</p></div>'
      + '<div class="kblock"><div class="lb">现在有什么</div>'
      + '<p>谓语动词·时态部分：12 个专题、每个专题 12 道核心题加 6 道扩展题，另有 20 道综合挑战；'
      + '上海真题语篇 8 篇（每篇整篇 10 空）；其余大专题还在陆续更新，也可以先用 AI 出题按专题生成练习。'
      + '复习侧有按 1/2/4/7/15 天排期的「今日复习」、可按大专题筛选的错题本、按薄弱点组的「我的专卷」，'
      + '以及练习卷 / 答案页 / 错题单 / 成绩单的打印。'
      + '题库和解析是作者整理的，其中一部分借助 AI 生成后经过人工筛选、修改和校对。</p></div>'
      + '<div class="kblock"><div class="lb">使用方式</div>'
      + '<p>个人免费自学使用，不用于商业用途。转发请保留署名、水印和版权说明，完整条款见页面右下角印章和页脚里的「版权与使用授权」。</p></div>'
      + '<div class="kblock"><div class="lb">源码与更新</div>'
      + '<p>源码在 GitHub 上，答案或解析有误、功能建议、想一起改，欢迎提 Issue 或 PR。'
      + '觉得有用的话，转给同样在练语法填空的同学就好。</p></div>';
    v.appendChild(intro);

    var act = U.el('div', 'btn-row', '');
    act.style.marginTop = '16px';
    act.innerHTML = '<button class="btn" data-nav="home">返回首页</button>';
    v.appendChild(act);
    bindNav(v);
  }

  /* ============ 设置（背景 / 字号 / 每日目标 / API Key / 数据入口） ============ */
  var LS_PREFS = 'EGL_UI_PREFS_v1';
  var LS_AI_CFG = 'EGL_AI_CFG_v1';
  var BG_PRESETS = [
    { id: 'plain', name: '纸白', sw: 'sw-plain', note: '默认' },
    { id: 'cream', name: '米黄', sw: 'sw-cream', note: '偏暖，长时间看更柔和' },
    { id: 'slate', name: '灰青', sw: 'sw-slate', note: '偏冷，素净' },
    { id: 'dark',  name: '墨夜', sw: 'sw-dark',  note: '夜间深色，字色自动反转' }
  ];
  var FONT_PRESETS = [
    { id: 'std', name: '标准', note: '默认字号' },
    { id: 'lg',  name: '大',   note: '正文与语篇放大一档，久看不累' },
    { id: 'xl',  name: '特大', note: '手机上最清楚，信息密度降低' }
  ];
  var GOAL_CHOICES = [5, 10, 12, 20];

  function prefsGet() {
    try {
      var raw = localStorage.getItem(LS_PREFS);
      var o = raw ? JSON.parse(raw) : null;
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function prefsSet(o) {
    try { localStorage.setItem(LS_PREFS, JSON.stringify(o || {})); } catch (e) {}
  }
  // 切背景：写 html[data-bg]，同步浏览器地址栏配色（theme-color）
  function applyBg(id) {
    var el = document.documentElement;
    if (!el) return;
    if (id && id !== 'plain') el.setAttribute('data-bg', id);
    else if (el.removeAttribute) el.removeAttribute('data-bg');
    try {
      var meta = document.querySelector('meta[name=theme-color]');
      var bg = window.getComputedStyle ? window.getComputedStyle(el).backgroundColor : '';
      if (meta && bg && meta.setAttribute) meta.setAttribute('content', bg);
    } catch (e) {}
  }
  function applySavedBg() {
    var p = prefsGet();
    applyBg(p.bg || 'plain');
  }
  // 字号档位：写 html[data-font]，只放大正文/语篇/解析（见 styles.css）
  function applyFont(id) {
    var el = document.documentElement;
    if (!el) return;
    if (id && id !== 'std') el.setAttribute('data-font', id);
    else if (el.removeAttribute) el.removeAttribute('data-font');
  }
  function applySavedFont() {
    applyFont(prefsGet().font || 'std');
  }
  function readAiCfg() {
    try {
      var raw = localStorage.getItem(LS_AI_CFG);
      var o = raw ? JSON.parse(raw) : null;
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  // 与「AI 出题」页共用同一份配置；Key 按模型商分开保存。
  function currentAiProvider() {
    var cfg = readAiCfg();
    if (E.ai && E.ai.providerById) return E.ai.providerById(cfg.providerId) || E.ai.PROVIDERS[0];
    return { id: 'deepseek', name: 'DeepSeek（默认）', shortName: 'DeepSeek', keyPlaceholder: 'sk-…', keyUrl: 'https://platform.deepseek.com/api_keys' };
  }
  function writeAiKey(val, remember) {
    var cfg = readAiCfg();
    var provider = currentAiProvider();
    cfg.providerId = provider.id;
    cfg.rememberKey = !!remember;
    if (cfg.apiKey !== undefined) delete cfg.apiKey; // Key 只按模型商存入 EGL_AI_KEYS_v2
    try { localStorage.setItem(LS_AI_CFG, JSON.stringify(cfg)); } catch (e) {}
    try { if (E.ai && E.ai.saveKey) E.ai.saveKey(val, !!remember, provider.id); } catch (e2) {}
    if (E.aiUI && E.aiUI.setKeyCache) E.aiUI.setKeyCache(val, provider.id);
  }
  function currentAiKey() {
    var provider = currentAiProvider();
    if (E.aiUI && E.aiUI.getKeyCache) {
      var c = E.aiUI.getKeyCache(provider.id);
      if (c) return c;
    }
    if (E.ai && E.ai.getKey) {
      try { var k = E.ai.getKey(provider.id); if (k) return k; } catch (e) {}
    }
    return '';
  }

  function settingsPage() {
    var v = app.view;
    v.innerHTML = '';
    v.appendChild(U.el('div', '', '<div class="page-title">设置</div>'
      + '<div class="page-sub">所有设置只保存在本机浏览器，不上传、不联网。</div>'));

    // —— 外观 ——
    v.appendChild(U.el('div', 'sec-title', '外观'));
    var prefs = prefsGet();
    var curBg = prefs.bg || 'plain';
    var curFont = prefs.font || 'std';
    var cur = BG_PRESETS.filter(function (p) { return p.id === curBg; })[0] || BG_PRESETS[0];
    var look = U.el('div', 'glass', '');
    look.style.padding = '14px 16px';
    look.innerHTML = '<div class="form-row"><label>背景</label>'
      + '<div class="seg">'
      + BG_PRESETS.map(function (p) {
          return '<button type="button" data-bg="' + p.id + '" class="' + (p.id === curBg ? 'on' : '') + '">'
            + '<i class="sw ' + p.sw + '"></i>' + p.name + '</button>';
        }).join('')
      + '</div>'
      + '<div class="form-hint" data-bgnote="1">' + cur.note + '　·　纯色底，不画格子。</div>'
      + '</div>'
      + '<div class="form-row" style="margin-top:12px"><label>字号</label>'
      + '<div class="seg">'
      + FONT_PRESETS.map(function (f) {
          return '<button type="button" data-font="' + f.id + '" class="' + (f.id === curFont ? 'on' : '') + '">' + f.name + '</button>';
        }).join('')
      + '</div>'
      + '<div class="form-hint" data-fontnote="1">'
      + (FONT_PRESETS.filter(function (f) { return f.id === curFont; })[0] || FONT_PRESETS[0]).note
      + '　·　只放大正文、语篇与解析，导航不动。</div>'
      + '</div>';
    v.appendChild(look);

    $$('[data-bg]', look).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.bg;
        var p = prefsGet();
        p.bg = id;
        prefsSet(p);
        applyBg(id);
        $$('[data-bg]', look).forEach(function (x) { x.classList.toggle('on', x.dataset.bg === id); });
        var hit = BG_PRESETS.filter(function (x) { return x.id === id; })[0];
        var note = $('[data-bgnote]', look);
        if (note && hit) note.textContent = hit.note + '　·　纯色底，不画格子。';
      });
    });
    $$('[data-font]', look).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.font;
        var p = prefsGet();
        p.font = id;
        prefsSet(p);
        applyFont(id);
        $$('[data-font]', look).forEach(function (x) { x.classList.toggle('on', x.dataset.font === id); });
        var hit = FONT_PRESETS.filter(function (x) { return x.id === id; })[0];
        var note = $('[data-fontnote]', look);
        if (note && hit) note.textContent = hit.note + '　·　只放大正文、语篇与解析，导航不动。';
      });
    });

    // —— 学习 ——
    v.appendChild(U.el('div', 'sec-title', '学习'));
    var goalNow = E.dailyGoal();
    var study = U.el('div', 'glass', '');
    study.style.padding = '14px 16px';
    study.innerHTML = '<div class="form-row"><label>每日目标</label>'
      + '<div class="seg">'
      + GOAL_CHOICES.map(function (n) {
          return '<button type="button" data-goal="' + n + '" class="' + (n === goalNow ? 'on' : '') + '">' + n + ' 题</button>';
        }).join('')
      + '</div>'
      + '<div class="form-hint">首页「今日学习」按这个算目标线；只影响目标进度，不影响任何统计口径。</div></div>';
    v.appendChild(study);
    $$('[data-goal]', study).forEach(function (b) {
      b.addEventListener('click', function () {
        var n = E.setGoal(parseInt(b.dataset.goal, 10));
        $$('[data-goal]', study).forEach(function (x) { x.classList.toggle('on', parseInt(x.dataset.goal, 10) === n); });
        U.toast('每日目标已设为 ' + n + ' 题', 'ok');
      });
    });

    // —— AI 出题 ——
    v.appendChild(U.el('div', 'sec-title', 'AI 出题'));
    var aiCfg = readAiCfg();
    var aiProvider = currentAiProvider();
    var box = U.el('div', 'glass', '');
    box.style.padding = '14px 16px';
    box.innerHTML = '<div class="form-row"><label for="setKey">AI API Key（' + esc(aiProvider.shortName) + '）</label>'
      + '<input type="password" id="setKey" data-set="key" autocomplete="off" spellcheck="false" placeholder="' + esc(aiProvider.keyPlaceholder || 'sk-…') + '" value="' + esc(currentAiKey()) + '">'
      + '<div class="form-hint">切换模型商请到「AI 出题」页；这里管理当前模型商的 Key。Key 只写在本机浏览器，两边同步。</div></div>'
      + '<label class="ck-row"><input type="checkbox" data-set="remember"' + (aiCfg.rememberKey ? ' checked' : '') + '>记住 Key（取消勾选则只在本次会话临时使用）</label>'
      + '<div class="btn-row" style="margin-top:12px">'
      + '<button type="button" class="btn sm" data-set="save">保存</button>'
      + '<button type="button" class="btn ghost sm" data-set="show">显示 Key</button>'
      + '<button type="button" class="btn ghost sm" data-set="clear">清除</button>'
      + '</div>';
    v.appendChild(box);

    var keyEl = $('[data-set=key]', box);
    var remEl = $('[data-set=remember]', box);
    $('[data-set=save]', box).addEventListener('click', function () {
      var val = (keyEl.value || '').trim();
      writeAiKey(val, !!(remEl && remEl.checked));
      U.toast(val ? '已保存 API Key' : '已清空 API Key', val ? 'ok' : '');
    });
    $('[data-set=clear]', box).addEventListener('click', function () {
      keyEl.value = '';
      if (remEl) remEl.checked = false;
      writeAiKey('', false);
      U.toast('已清除本机保存的 API Key', '');
    });
    $('[data-set=show]', box).addEventListener('click', function () {
      var on = keyEl.type === 'text';
      keyEl.type = on ? 'password' : 'text';
      this.textContent = on ? '显示 Key' : '隐藏 Key';
    });

    // —— 数据与关于 ——
    v.appendChild(U.el('div', 'sec-title', '数据与关于'));
    var dm = U.el('div', 'glass', '');
    dm.style.padding = '14px 16px';
    var prefsD = prefsGet();
    var lastBkD = prefsD.lastBackupAt || 0;
    dm.innerHTML = '<div class="small faint">专题进度、错题本（含复习排期与笔记）、学习记录都保存在本机 localStorage，换浏览器或清缓存会丢。'
      + '导出备份 / 导入 / 重置都在「学习记录」页。'
      + (lastBkD ? '上次导出备份：' + E.util.dayKey(lastBkD) + '。' : '你还没有导出过备份。') + '</div>'
      + '<div class="btn-row" style="margin-top:10px">'
      + '<button class="btn ghost sm" data-nav="records">去学习记录页管理数据</button>'
      + '<button class="btn ghost sm" data-nav="about">关于本工具</button>'
      + '</div>';
    v.appendChild(dm);

    bindNav(v);
  }

  E.ui = E.ui || {};
  E.ui.setApp = setApp;
  E.ui.home = home;
  E.ui.topics = topics;
  E.ui.topicPage = topicPage;
  E.ui.papersPage = papersPage;
  E.ui.paperPage = paperPage;
  E.ui.reviewPage = reviewPage;
  E.ui.customPage = customPage;
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
  E.ui.weekBars = weekBars;
  E.ui.dueLabel = dueLabel;
  E.ui.methodPage = methodPage;
  E.ui.aboutPage = aboutPage;
  E.ui.settingsPage = settingsPage;
  E.ui.applyBg = applyBg;
  E.ui.applyFont = applyFont;
  E.ui.applySavedBg = applySavedBg;
  E.ui.applySavedFont = applySavedFont;
  E.ui.prefsGet = prefsGet;
})();
