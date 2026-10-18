/* ============================================================
 * print.js — 打印 / 存 PDF（练习卷、答案页、错题单、专卷、成绩单）
 * 只生成一份独立的打印用 DOM（#printRoot），屏幕上看不见；
 * 打印样式在 styles.css 的 @media print 里（隐藏应用界面，只留打印稿）。
 * 不引入任何第三方库：存 PDF 用浏览器自带的“打印 → 另存为 PDF”。
 * ============================================================ */
(function () {
  'use strict';
  var E = window.EGL, U = E.u;
  var esc = U.esc;

  function ensureRoot() {
    var root = document.getElementById ? document.getElementById('printRoot') : null;
    if (!root) {
      root = document.createElement('div');
      root.id = 'printRoot';
      if (document.body && document.body.appendChild) document.body.appendChild(root);
    }
    return root;
  }
  function foot() {
    return '<div class="pr-foot">上海初高语法填空 · 打印版　·　个人免费学习使用，禁止商用　·　Hison（抖音 XRuiiiiii / 小红书 xiaoruiuaa520）</div>';
  }
  function open(html) {
    var root = ensureRoot();
    if (!root) return;
    root.innerHTML = '<div class="pr-doc">' + html + foot() + '</div>';
    try {
      if (typeof window.print === 'function') window.print();
      else U.toast('当前环境不支持打印', 'bad');
    } catch (e) {
      U.toast('调用打印失败，可以用浏览器菜单里的「打印」', 'bad');
    }
  }
  /* 语篇正文：把每个空换成带编号的横线；括号提示词保持原样 */
  function passageHTML(passage) {
    var parts = String(passage || '').split(/_{4,}/);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      out.push(esc(parts[i]).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>'));
      if (i < parts.length - 1) out.push('<span class="pr-blank">(' + (i + 1) + ') ____________</span>');
    }
    return '<div class="pr-passage"><p>' + out.join('') + '</p></div>';
  }
  function answerLines(n) {
    var cells = [];
    for (var i = 1; i <= n; i++) {
      cells.push('<div class="pr-line"><b>' + i + '.</b><span></span></div>');
    }
    return '<div class="pr-lines">' + cells.join('') + '</div>';
  }

  /* ---------- 真题语篇：练习卷 ---------- */
  function paperSheet(pid) {
    var p = E.paperById(pid);
    if (!p) { U.toast('没有找到这篇语篇', 'bad'); return; }
    var html = '<div class="pr-head">'
      + '<div class="pr-kicker">上海初高语法填空 · 真题语篇练习卷</div>'
      + '<div class="pr-title">' + esc(p.title || '') + '</div>'
      + '<div class="pr-sub">' + esc(p.source || '') + '　·　' + esc(p.level || '') + '　·　' + esc(p.genre || '')
      + (p.words ? '　·　' + p.words + ' 词' : '') + '　·　共 ' + (p.blanks || []).length + ' 空</div>'
      + '<div class="pr-meta"><span>姓名 ____________</span><span>日期 ____________</span><span>用时 ________</span><span>得分 ________</span></div>'
      + '</div>'
      + '<p class="pr-note">说明：每个空只填一个词（个别固定搭配 2 个词）；括号里是提示词，需要按语境变形。先通读全文再动笔。</p>'
      + passageHTML(p.passage)
      + '<div class="pr-answers"><div class="pr-ans-title">答题区（第 1–' + (p.blanks || []).length + ' 空）</div>'
      + answerLines((p.blanks || []).length) + '</div>';
    open(html);
  }

  /* ---------- 真题语篇：答案与解析 ---------- */
  function paperAnswers(pid) {
    var p = E.paperById(pid);
    if (!p) { U.toast('没有找到这篇语篇', 'bad'); return; }
    var rows = '<table class="pr-table"><thead><tr><th>空</th><th>答案</th><th>考点</th><th>解析</th></tr></thead><tbody>';
    (p.blanks || []).forEach(function (b, i) {
      var ex = [];
      if (b.sense) ex.push('句意：' + b.sense);
      if (b.clue) ex.push('线索：' + b.clue);
      if (b.why) ex.push('判断：' + b.why);
      if (b.others) ex.push('其它形式：' + b.others);
      if (b.tip) ex.push('记忆：' + b.tip);
      rows += '<tr><td class="c">' + (i + 1) + '</td>'
        + '<td class="ans">' + esc(b.answer || '') + (b.isGiven && b.given ? '<br><span class="tiny">(' + esc(b.given) + ')</span>' : '') + '</td>'
        + '<td class="pt">' + esc(b.point || '') + '</td>'
        + '<td class="ex">' + esc(ex.join('\n')).replace(/\n/g, '<br>') + '</td></tr>';
    });
    rows += '</tbody></table>';
    var html = '<div class="pr-head">'
      + '<div class="pr-kicker">上海初高语法填空 · 真题语篇答案页</div>'
      + '<div class="pr-title">' + esc(p.title || '') + '</div>'
      + '<div class="pr-sub">' + esc(p.source || '') + '　·　共 ' + (p.blanks || []).length + ' 空</div>'
      + '</div>' + rows;
    open(html);
  }

  /* ---------- 错题单 ---------- */
  function wrongList(list, title) {
    list = list || [];
    if (!list.length) { U.toast('当前筛选下没有错题', 'bad'); return; }
    var items = list.map(function (w, i) {
      var ex = [];
      if (w.explText) ex.push(w.explText);
      return '<div class="pr-item">'
        + '<div class="pr-item-head"><b>' + (i + 1) + '.</b> '
        + '<span class="badge">' + esc(E.catLabelOf(w.catId)) + '</span> '
        + '<span class="badge">' + esc(w.topicTitle || '') + '</span> '
        + '<span class="badge">错 ' + (w.times || 1) + ' 次</span> '
        + '<span class="badge">' + esc(w.lastDate || '') + '</span></div>'
        + '<div class="pr-q">' + esc(w.question || '') + '</div>'
        + '<div class="pr-ansline">我的答案：<u>' + esc(w.myAnswer || '（未作答）') + '</u>　正确答案：<b>' + esc(w.correctAnswer || '') + '</b></div>'
        + (w.notes ? '<div class="pr-note-inline">我的笔记：' + esc(w.notes) + '</div>' : '')
        + (ex.length ? '<div class="pr-explain">' + esc(ex.join('\n')).replace(/\n/g, '<br>') + '</div>' : '')
        + '</div>';
    }).join('');
    var html = '<div class="pr-head">'
      + '<div class="pr-kicker">上海初高语法填空 · ' + esc(title || '错题单') + '</div>'
      + '<div class="pr-sub">导出日期 ' + esc(E.util.todayStr()) + '　·　共 ' + list.length + ' 条</div>'
      + '</div>' + items;
    open(html);
  }

  /* ---------- 我的专卷 ---------- */
  function custom(cust) {
    cust = cust || E.getCustomPaper();
    if (!cust || !cust.items || !cust.items.length) { U.toast('还没有可打印的专卷', 'bad'); return; }
    var qs = E.customToQuestions(cust);
    var practice = qs.map(function (q, i) {
      var hint = q.hint ? ' <span class="pr-hint">(' + esc(q.hint) + ')</span>' : '';
      return '<div class="pr-item"><div class="pr-q"><b>' + (i + 1) + '.</b> '
        + esc(q.question).replace(/_{4,}/g, '<span class="pr-blank">____________</span>') + hint + '</div></div>';
    }).join('');
    var answers = qs.map(function (q, i) {
      var ans = q.type === 'choice' ? (q.options && q.options[q.answerIndex]) : (q.answerText || (q.accepted && q.accepted[0]));
      return '<div class="pr-ans-row"><b>' + (i + 1) + '.</b> ' + esc(ans || '')
        + (q.aiMeta && q.aiMeta.catName ? '　<span class="tiny">' + esc(q.aiMeta.catName) + '</span>' : '') + '</div>';
    }).join('');
    var html = '<div class="pr-head">'
      + '<div class="pr-kicker">上海初高语法填空 · 我的专卷（按薄弱点组卷）</div>'
      + '<div class="pr-sub">' + esc(cust.date || '') + '　·　共 ' + qs.length + ' 空</div>'
      + '<div class="pr-meta"><span>姓名 ____________</span><span>日期 ____________</span><span>用时 ________</span><span>得分 ________</span></div>'
      + '</div>'
      + '<p class="pr-note">每个空只填一个词；括号里是提示词，需要按语境变形。</p>'
      + practice
      + '<div class="pr-pagebreak"></div>'
      + '<div class="pr-head"><div class="pr-kicker">答案页（做完再看）</div></div>'
      + '<div class="pr-ans-list">' + answers + '</div>';
    open(html);
  }

  /* ---------- 成绩单 ---------- */
  function result(r) {
    r = r || {};
    var p = r.total ? r.correct / r.total : 0;
    var rows = (r.answers || []).map(function (a, i) {
      if (!a) return '';
      var q = a.q || {};
      var cor = q.type === 'choice' ? (q.options && q.options[q.answerIndex]) : (q.answerText || (q.accepted && q.accepted[0]));
      return '<tr><td class="c">' + (i + 1) + '</td>'
        + '<td>' + esc(q.tag || '') + '</td>'
        + '<td>' + (a.skipped ? '<i>未作答</i>' : esc(a.userText || '')) + '</td>'
        + '<td class="ans">' + esc(cor || '') + '</td>'
        + '<td class="' + (a.ok ? 'ok' : 'bad') + '">' + (a.ok ? '对' : '错') + '</td></tr>';
    }).join('');
    var html = '<div class="pr-head">'
      + '<div class="pr-kicker">上海初高语法填空 · 成绩单</div>'
      + '<div class="pr-title">' + esc(r.title || '') + '</div>'
      + '<div class="pr-sub">' + esc(r.date || '') + '　·　' + esc(r.modeLabel || '')
      + '　·　用时 ' + U.fmtTime(r.seconds || 0) + '</div>'
      + '<div class="pr-score">得分 ' + (r.correct || 0) + ' / ' + (r.total || 0)
      + '　·　正确率 ' + Math.round(p * 100) + '%'
      + (r.unanswered ? '　·　未作答 ' + r.unanswered + ' 空' : '') + '</div>'
      + '</div>'
      + '<table class="pr-table"><thead><tr><th>#</th><th>考点</th><th>我的答案</th><th>正确答案</th><th>结果</th></tr></thead><tbody>'
      + rows + '</tbody></table>';
    open(html);
  }

  E.print = {
    open: open,
    paperSheet: paperSheet,
    paperAnswers: paperAnswers,
    wrongList: wrongList,
    custom: custom,
    result: result
  };
})();
