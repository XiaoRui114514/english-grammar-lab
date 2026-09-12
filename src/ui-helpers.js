/* ============================================================
 * ui-helpers.js — DOM 工具 / 渲染组件（无状态纯函数）
 * ============================================================ */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined && html !== null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // 把带 \n 的文本转成 <br>
  function lines(s) { return esc(s).replace(/\n/g, '<br>'); }

  /* ---------- 数值显示 ---------- */
  function pct(x) { return Math.round(x * 100) + '%'; }
  function fmtTime(sec) {
    sec = Math.round(sec || 0);
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + '分' + (s < 10 ? '0' : '') + s + '秒';
  }

  /* ---------- 等级映射 ----------
   * 12题制：12=S 11=A+ 10=A 9=B+ 8=B 6-7=C ≤5=D
   * 其它题量按比例折算到 12 题制 */
  function gradeOf(correct, total) {
    if (!total) return { g: '—', color: '#8b93b5' };
    var x = Math.round((correct / total) * 12);
    if (x >= 12) return { g: 'S', color: '#ffd54f' };
    if (x === 11) return { g: 'A+', color: '#9be15d' };
    if (x === 10) return { g: 'A', color: '#3ecf8e' };
    if (x === 9) return { g: 'B+', color: '#5b8cff' };
    if (x === 8) return { g: 'B', color: '#5b8cff' };
    if (x >= 6) return { g: 'C', color: '#ffb84d' };
    return { g: 'D', color: '#ff5d7a' };
  }

  /* ---------- 状态图标 ---------- */
  function statusBadge(st) {
    if (st === 'master') return '<span class="badge green">🟢 已掌握</span>';
    if (st === 'learning') return '<span class="badge blue">🟡 学习中</span>';
    if (st === 'weak') return '<span class="badge red">🔴 薄弱</span>';
    return '<span class="badge gray">⚪ 未开始</span>';
  }

  /* ---------- 题目文本渲染（把 ______ 变成醒目的空） ---------- */
  // opts.hideInlineHint：输入框已另显提示词字卡时，题干里不再追加 (hint)
  // 空位本身不放下划线字符，只画一条虚线（否则字符与边框会叠成两层线）
  function renderSentence(q, opts) {
    opts = opts || {};
    var s = String(q.question || '');
    var hasBlank = s.indexOf('______') >= 0;
    var h = esc(s);
    var blankHtml = '<span class="blank"></span>';
    if (hasBlank) {
      h = h.replace('______', blankHtml);
    }
    // 高亮 hint 位置（在空之后追加）——仅在需要内联提示时
    if (!opts.hideInlineHint && q.type === 'input' && q.hint) {
      var hintText = String(q.hint).replace(/\s*\/\s*/g, ' / ');
      // 若题干已自带 (hint) 则不重复
      if (s.indexOf('(' + q.hint + ')') < 0) {
        h = h.replace(blankHtml, blankHtml + ' <span class="hint-p">(' + esc(hintText) + ')</span>');
      }
    }
    return '<span class="qtext">' + h + '</span>';
  }

  // AI 语篇面板：整篇展示，所有空为编号下划线，当前空高亮（不显示答案）
  function passagePanelHTML(aiCtx) {
    if (!aiCtx || !aiCtx.passage) return '';
    var curN = aiCtx.blankN || 1;
    var parts = String(aiCtx.passage).split(/_{4,}/);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      out.push(esc(parts[i]).replace(/\n/g, '<br>'));
      if (i < parts.length - 1) {
        var n = i + 1;
        out.push('<span class="passage-blank' + (n === curN ? ' cur' : '') + '">(' + n + ')<i class="pb-u"></i></span>');
      }
    }
    var meta = '<div class="passage-title">📄 ' + esc(aiCtx.title || '语篇')
      + ' <span class="faint">· 语篇 ' + (aiCtx.paperIndex + 1) + '/' + aiCtx.paperCount
      + ' · 共 ' + aiCtx.total + ' 空 · 当前第 ' + curN + ' 空</span></div>';
    return '<div class="passage-panel">' + meta + '<div class="passage-body">' + out.join('') + '</div></div>';
  }

  /* ---------- 解析渲染（全部在 <details> 内） ---------- */
  function explanationHTML(q, ctx) {
    var ex = q.explanation || {};
    ctx = ctx || {};
    var b = [];
    b.push('<div class="explain">');

    // 考点标签（如需复盘）：考点：时态 / 细分子点
    if (ctx.grammar) {
      b.push('<div class="ex-mod" style="margin-top:0">'
        + '<span class="badge badge-grammar">考点：' + esc(ctx.grammar) + '</span>'
        + (q.tag ? ' <span class="badge blue">' + esc(q.tag) + '</span>' : '')
        + '</div>');
    }

    // 正确答案展示
    var corText = ctx.correctText || ex.answer || q.answerText || '';
    b.push('<div class="ex-mod"><span class="lb2" style="color:var(--ok)">✅ 正确答案：</span>');
    b.push('<span class="ans-chip">' + esc(corText) + '</span>');
    if (ctx.myText !== undefined && ctx.myText !== null && ctx.myText !== '') {
      b.push(' <span style="font-size:13px;color:var(--ink-dim)">我的答案：<b style="color:'
        + (ctx.myOk ? 'var(--ok)' : 'var(--bad)') + '">' + esc(ctx.myText) + '</b></span>');
    }
    b.push('</div>');

    if (ex.keyPoint) b.push('<div class="ex-mod"><span class="lb2">📌 考查知识点</span><div>' + lines(ex.keyPoint) + '</div></div>');
    if (ex.clue) b.push('<div class="ex-mod"><span class="lb2">🔎 本题关键线索</span><div>' + lines(ex.clue) + '</div></div>');
    if (ex.trap) b.push('<div class="ex-mod"><span class="lb2">⚠️ 不要被什么骗了</span><div>' + lines(ex.trap) + '</div></div>');
    if (ex.chain) b.push('<div class="ex-mod"><span class="lb2">🧗 判断链（一步一步想）</span><div class="chain">' + chainHTML(ex.chain) + '</div></div>');
    if (ex.why) b.push('<div class="ex-mod"><span class="lb2">💡 为什么是这个答案</span><div>' + lines(ex.why) + '</div></div>');
    if (ex.whyOthers) {
      b.push('<div class="ex-mod"><span class="lb2">❓ 为什么其他答案不合适</span>');
      b.push('<ul class="why-others">');
      String(ex.whyOthers).split(/\n+/).forEach(function (li) {
        var t = String(li).trim();
        if (!t) return;
        // 开头 A. / B. 之类加粗
        b.push('<li>' + t.replace(/^([A-F][.、．:：])\s*/, '<b>$1</b> ') + '</li>');
      });
      b.push('</ul></div>');
    }
    if (ex.commonError) b.push('<div class="ex-mod"><span class="lb2">🚨 容易犯的错误</span><div>' + lines(ex.commonError) + '</div></div>');
    if (ex.memory) b.push('<div class="ex-mod"><span class="lb2">🧠 一句话记忆</span><div>' + lines(ex.memory) + '</div></div>');
    if (ex.examMind) b.push('<div class="ex-mod"><span class="lb2">🏁 如果你在考试现场</span><div>' + lines(ex.examMind) + '</div></div>');
    if (ex.cue) b.push('<div class="ex-mod"><span class="lb2">🧠 以后看到什么，就想到什么？</span><div class="chain">' + chainHTML(ex.cue) + '</div></div>');

    b.push('</div>');
    return b.join('');
  }

  // 把 “A ↓ B ↓ C” 或含 → 的文本渲染成步骤
  function chainHTML(s) {
    var parts = String(s).split(/↓|→|=>|⇒/);
    var out = [];
    parts.forEach(function (p, i) {
      var t = String(p).trim();
      if (!t) return;
      out.push('<span class="step">' + esc(t) + '</span>');
      if (i < parts.length - 1) out.push('<span class="arr">↓</span>');
    });
    return out.join('');
  }

  /* ---------- 知识卡渲染 ---------- */
  function knowledgeCardHTML(topic) {
    var kc = topic.knowledgeCard || {};
    var b = [];
    b.push('<div class="kcard glass">');
    b.push('<h2>' + (topic.icon || '📘') + ' ' + esc(topic.no) + ' ' + esc(topic.title) + '</h2>');
    if (kc.oneLine) b.push('<div class="kblock"><div class="lb">一句话理解</div><p>' + lines(kc.oneLine) + '</p></div>');
    if (kc.structure) b.push('<div class="kblock"><div class="lb">基本结构</div><p>' + lines(kc.structure) + '</p></div>');
    if (kc.glossary && kc.glossary.length) {
      b.push('<div class="kblock"><div class="lb">先弄懂这些词（不装懂）</div>');
      kc.glossary.forEach(function (g) {
        b.push('<div class="gloss"><b>' + esc(g.term) + '</b>：' + lines(g.note) + '</div>');
      });
      b.push('</div>');
    }
    if (kc.scenes && kc.scenes.length) {
      b.push('<div class="kblock"><div class="lb">常见场景 / 标志</div><ul>');
      kc.scenes.forEach(function (s) { b.push('<li>' + lines(s) + '</li>'); });
      b.push('</ul></div>');
    }
    if (kc.examples && kc.examples.length) {
      b.push('<div class="kblock"><div class="lb">例句（先看对的样子）</div><ul>');
      kc.examples.forEach(function (s) { b.push('<li>' + esc(s) + '</li>'); });
      b.push('</ul></div>');
    }
    if (kc.commonMistake) b.push('<div class="kblock"><div class="lb">最容易错</div><p>' + lines(kc.commonMistake) + '</p></div>');
    if (kc.judgment) b.push('<div class="kblock"><div class="lb">判断方法</div><p>' + lines(kc.judgment) + '</p></div>');
    if (kc.memory) b.push('<div class="kblock"><div class="mem-line">' + lines(kc.memory) + '</div></div>');
    if (topic.examFlow && topic.examFlow.length) {
      b.push('<div class="kblock"><div class="lb">考场判断流程</div><ol class="ex-flow">');
      topic.examFlow.forEach(function (s) { b.push('<li>' + lines(s) + '</li>'); });
      b.push('</ol></div>');
    }
    b.push('</div>');
    return b.join('');
  }

  /* ---------- 进度条 ---------- */
  function progressBar(p, cls) {
    p = Math.max(0, Math.min(1, p));
    var c = cls || (p >= 0.9 ? 'ok' : p >= 0.6 ? '' : 'warn');
    return '<div class="pbar ' + (cls || '') + '"><i style="width:' + (p * 100) + '%"></i></div>';
  }

  /* ---------- Modal / Confirm / Toast ---------- */
  function modal(html, onClose) {
    var ov = el('div', 'overlay');
    ov.innerHTML = '<div class="sheet glass">' + html + '</div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    function close() { ov.remove(); if (onClose) onClose(); }
    ov.close = close;
    document.body.appendChild(ov);
    return ov;
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(function (res) {
      var ov = modal('<h3>' + esc(title) + '</h3><p class="muted" style="margin:8px 0 16px">' + esc(text) + '</p>'
        + '<div class="btn-row"><button class="btn ghost" data-act="no">取消</button>'
        + '<button class="btn ' + (danger ? 'danger' : 'ok') + '" data-act="yes">' + esc(okLabel || '确定') + '</button></div>');
      // 注意：不能用 $(this)——this 是元素不是选择器，会抛 SyntaxError。
      var yes = $('[data-act=yes]', ov);
      var no = $('[data-act=no]', ov);
      if (yes) yes.addEventListener('click', function () { res(true); ov.close(); });
      if (no) no.addEventListener('click', function () { res(false); ov.close(); });
    });
  }
  function toast(msg, type) {
    var t = el('div', 'fb ' + (type === 'ok' ? 'ok' : type === 'bad' ? 'bad' : ''),
      '<span class="big">' + (type === 'ok' ? '✅' : type === 'bad' ? '❌' : '📌') + '</span>' + esc(msg));
    t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:26px;z-index:99;box-shadow:var(--shadow)';
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2200);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ---------- 右上角"已自动保存"提示（节流：短时间内多次保存只更新一次） ---------- */
  var _saveTimer = null;
  var _saveEl = null;
  function raf(fn) { if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fn); else fn(); }
  function savedNotice() {
    if (!document || !document.body) return;
    if (!_saveEl) {
      _saveEl = el('div', 'save-notice',
        '<span style="display:inline-flex;align-items:center;gap:6px">💾 <b>已自动保存</b></span>');
      _saveEl.style.cssText = 'position:fixed;top:12px;right:14px;z-index:120;opacity:0;'
        + 'transform:translateY(-6px);transition:opacity .25s var(--ease),transform .25s var(--ease);';
      document.body.appendChild(_saveEl);
    }
    if (_saveTimer) clearTimeout(_saveTimer);
    raf(function () {
      _saveEl.style.opacity = '1';
      _saveEl.style.transform = 'translateY(0)';
    });
    _saveTimer = setTimeout(function () {
      _saveEl.style.opacity = '0';
      _saveEl.style.transform = 'translateY(-6px)';
    }, 1400);
  }

  window.EGL = window.EGL || {};
  EGL.u = {
    $: $, $$: $$, el: el, esc: esc, lines: lines, pct: pct, fmtTime: fmtTime,
    gradeOf: gradeOf, statusBadge: statusBadge, renderSentence: renderSentence,
    explanationHTML: explanationHTML, chainHTML: chainHTML, knowledgeCardHTML: knowledgeCardHTML,
    passagePanelHTML: passagePanelHTML,
    progressBar: progressBar, modal: modal, confirmBox: confirmBox, toast: toast,
    savedNotice: savedNotice
  };
})();
