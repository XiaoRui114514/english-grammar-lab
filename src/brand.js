/* ============================================================
 * brand.js — 作者品牌 · 版权保护层（署名 / 水印 / 授权协议 / 自愈守护）
 * ------------------------------------------------------------
 * 1) 可见水印：全页纹理层、题卡纹理、卡片角标、右下角印章、页脚署名
 * 2) 隐形指纹：零宽字符编码，随文本复制而传播，可在控制台反查来源
 * 3) 版权与使用授权（免责声明）：首次访问自动提示，之后页脚/印章随时打开
 * 4) 自愈守护：水印节点被删除、改名、隐藏都会被自动重建（含样式）
 * 5) 启动校验：品牌层被整体摘除 → E.brand.ok() 为假 → boot.js 拒绝启动
 *
 * 说明：作者身份以编码数组存放、运行时解码，源码中不出现明文署名；
 *       水印样式由 styles.css 的品牌区块在构建时注入本模块（单一来源）。
 *       本模块先于 core.js 加载，仅依赖 window/document；无 DOM 环境
 *       （Node 校验脚本）下所有浏览器能力均做特性探测，可安全加载。
 * ============================================================ */
(function () {
  'use strict';
  var W = window;
  W.EGL = W.EGL || {};
  var E = W.EGL;

  /* ================= 1) 作者身份（编码存放，运行时解码） ================= */
  var _K = 0x2f;
  var _P = [
    84, 13, 65, 13, 21, 13, 103, 70, 92, 64, 65, 13, 3, 13, 75, 86, 13, 21, 13,
    119, 125, 90, 70, 70, 70, 70, 70, 70, 13, 3, 13, 87, 71, 92, 13, 21, 13,
    87, 70, 78, 64, 93, 90, 70, 78, 78, 78, 26, 29, 31, 13, 3, 13, 91, 78, 72,
    13, 21, 13, 103, 70, 92, 64, 65, 15, 21017, 20339, 13, 3, 13, 67, 78, 77,
    13, 21, 13, 106, 65, 72, 67, 70, 92, 71, 15, 104, 93, 78, 66, 66, 78, 93,
    15, 99, 78, 77, 13, 3, 13, 89, 13, 21, 30, 3, 13, 76, 68, 13, 21, 30, 25,
    24, 22, 29, 82
  ];
  var _ID;

  function raw() {
    var s = '', i;
    for (i = 0; i < _P.length; i++) s += String.fromCharCode(_P[i] ^ _K);
    return s;
  }

  function ident() {
    if (_ID !== undefined) return _ID;
    _ID = null;
    try {
      var o = JSON.parse(raw());
      var seed = o.n + '|' + o.dy + '|' + o.xhs + '|' + o.v, h = 0, i;
      for (i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 99991;
      if (h === o.ck && o.n && o.dy && o.xhs) _ID = o;
    } catch (e) { _ID = null; }
    return _ID;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ================= 2) 隐形指纹（零宽字符，6 bit/字符） ================= */
  var AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789|-';
  var Z0 = '\u200b', Z1 = '\u200d', ZS = '\u2060';
  var _SIG;

  function sig() {
    if (_SIG !== undefined) return _SIG;
    _SIG = '';
    var id = ident();
    if (!id) return _SIG;
    var txt = id.n + '|' + id.dy + '|' + id.xhs, bits = '', i, j, k;
    for (i = 0; i < txt.length; i++) {
      k = AL.indexOf(txt.charAt(i));
      if (k < 0) k = 0;
      for (j = 5; j >= 0; j--) bits += ((k >> j) & 1) ? Z1 : Z0;
    }
    _SIG = ZS + bits + ZS;
    return _SIG;
  }

  // 给任意文本打上隐形指纹（幂等；答案/题干语义不受影响，零宽字符不参与判分）
  function mark(s) {
    if (typeof s !== 'string' || !s) return s;
    var g = sig();
    if (!g || s.indexOf(g) >= 0) return s;
    return s + g;
  }

  // 反查：从任意（被复制/被二次分发的）文本中还原作者指纹
  function inspect(s) {
    if (typeof s !== 'string' || !s) return null;
    var bits = '', i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c === 0x200b) bits += '0';
      else if (c === 0x200d) bits += '1';
    }
    var out = '', j, k;
    for (i = 0; i + 6 <= bits.length; i += 6) {
      k = 0;
      for (j = 0; j < 6; j++) k = (k << 1) | (bits.charCodeAt(i + j) - 48);
      out += AL.charAt(k);
    }
    return out.length >= 8 ? out : null;
  }

  // 题库 / 方法课文本批量打指纹：复制走的文本自带作者信息
  function markBank(bank) {
    bank = bank || W.__GRAMMAR_LAB__;
    if (!bank || typeof bank !== 'object') return 0;
    var n = 0;
    Object.keys(bank).forEach(function (k) {
      var t = bank[k];
      if (!t || typeof t !== 'object') return;
      ['questions', 'pool'].forEach(function (field) {
        var list = t[field];
        if (!list || !list.length) return;
        for (var i = 0; i < list.length; i++) {
          var q = list[i];
          if (!q || typeof q.question !== 'string') continue;
          var m = mark(q.question);
          if (m !== q.question) { q.question = m; n++; }
        }
      });
      if (typeof t.passage === 'string') t.passage = mark(t.passage);
    });
    return n;
  }

  /* ================= 3) 可见水印 ================= */
  var SEAL = 'eglSeal', FOOT = 'eglFooter', STYLE = 'eglBrandStyle';
  // 产品署名（品牌名统一在 brand.js 维护：页面标题 / 页脚 / 授权弹窗共用）
  var SUB = '初高中语法填空学习系统';
  var REGION = '推荐上海地区使用';
  // 构建时由 styles.css 的品牌区块替换（单一来源，删掉 CSS 也不影响运行时水印）
  var CSS = "/*__BRAND_CSS__*/";
  // 版本号：构建时由 build.js 用 package.json 的 version 替换（单一来源，
  // 发新版只需改 package.json）；未构建直接打开源码时不显示这一行。
  var VER = '__EGL_VER__';
  if (VER.charAt(0) === '_') VER = '';
  var TILE_VAR = '--egl-tile';
  var _guardTimer = null;

  function doc() { return W.document || null; }
  function body() { var d = doc(); return d && d.body ? d.body : null; }
  function head() {
    var d = doc();
    return d ? (d.head || (d.getElementsByTagName ? d.getElementsByTagName('head')[0] : null)) : null;
  }
  function byId(id) {
    var d = doc();
    if (!d || !d.getElementById) return null;
    var el = d.getElementById(id);
    if (!el) return null;
    // 只认自己造的水印节点：被顶替/改名的一律当不存在，重建
    if (el.getAttribute && el.getAttribute('data-egl-ref') !== id) return null;
    return el;
  }
  function make(tag, id, cls) {
    var el = doc().createElement(tag);
    el.id = id;
    el.className = cls;
    if (el.setAttribute) el.setAttribute('data-egl-ref', id);
    return el;
  }
  function drop(id) {
    var el = doc() && doc().getElementById ? doc().getElementById(id) : null;
    if (el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
  }

  // 水印底纹（内联 SVG：署名 + 两个平台账号，斜向平铺）
  function tileURL() {
    var id = ident();
    if (!id) return '';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="350">'
      + '<g transform="rotate(-24 280 175)" font-family="Segoe UI,Arial,Helvetica,sans-serif"'
      + ' fill="#ffffff" fill-opacity="0.042">'
      + '<text x="26" y="146" font-size="38" font-weight="700" letter-spacing="4">' + id.tag + '</text>'
      + '<text x="28" y="186" font-size="14" letter-spacing="2">' + id.lab + '</text>'
      + '<text x="28" y="214" font-size="14" letter-spacing="1.5">\u6296\u97f3 '
      + id.dy + '  \uff5c  \u5c0f\u7ea2\u4e66 ' + id.xhs + '</text>'
      + '</g></svg>';
    return 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
  }

  function applyVars() {
    var d = doc();
    if (!d || !d.documentElement || !d.documentElement.style || !d.documentElement.style.setProperty) return;
    d.documentElement.style.setProperty(TILE_VAR, tileURL());
  }

  function injectCSS() {
    var h = head();
    if (!h || !doc().createElement) return;
    var st = byId(STYLE);
    var id = ident();
    var css = id ? CSS.split('__EGL_NM__').join(id.n) : '';
    var text = '/* 品牌水印（运行时注入 · 删除后自动重建） */\n' + css;
    if (!st) {
      st = make('style', STYLE, 'egl-brand-style');
      h.appendChild(st);
    }
    if (st.textContent !== text) st.textContent = text;
  }

  function renderSeal() {
    var el = byId(SEAL), id = ident();
    if (!el || !id) return;
    // 先是一枚小胶囊；悬停 / 聚焦 / 点击后在原地展开署名卡片（不用弹窗）
    if (!el.getAttribute || el.getAttribute('data-egl-face') !== id.n) {
      el.innerHTML = '<span class="egl-seal-face">\u00a9 ' + esc(id.n) + ' \u00b7 \u539f\u521b</span>'
        + '<span class="egl-seal-panel">'
        + '<span class="egl-seal-name">' + esc(id.tag) + '</span>'
        + '<span class="egl-seal-row"><i>\u6296\u97f3</i><b>' + esc(id.dy) + '</b></span>'
        + '<span class="egl-seal-row"><i>\u5c0f\u7ea2\u4e66</i><b>' + esc(id.xhs) + '</b></span>'
        + '</span>';
      if (el.setAttribute) el.setAttribute('data-egl-face', id.n);
    }
    if (el.setAttribute) {
      el.setAttribute('title', id.tag + '\u3000\u6296\u97f3 ' + id.dy + '\u3000\u5c0f\u7ea2\u4e66 ' + id.xhs);
      el.setAttribute('aria-label', '\u4f5c\u8005\u7f72\u540d\uff1a' + id.tag + '\uff0c\u6296\u97f3 ' + id.dy + '\uff0c\u5c0f\u7ea2\u4e66 ' + id.xhs);
    }
  }

  // 胶囊展开 / 收起（触摸端点击切换；点空白处收起）
  var _outsideBound = false;
  function bindOutside() {
    var d = doc();
    if (_outsideBound || !d || !d.addEventListener) return;
    _outsideBound = true;
    d.addEventListener('click', function (e) {
      var el = byId(SEAL);
      if (!el || !el.classList || !el.classList.contains('on')) return;
      var t = e.target;
      if (t === el || (el.contains && el.contains(t))) return;
      el.classList.remove('on');
    }, true);
  }

  function footHTML() {
    var id = ident();
    if (!id) return '';
    return '<div class="egl-foot-main" data-egl-main="1">' + esc(id.lab) + ' \u00b7 ' + SUB + '\uff08' + REGION + '\uff09</div>'
      + '<div class="egl-foot-brand">\u00a9 2026 ' + esc(id.tag) + '\u3000\u00b7\u3000\u6296\u97f3 ' + esc(id.dy)
      + '\u3000\u00b7\u3000\u5c0f\u7ea2\u4e66 ' + esc(id.xhs)
      + '\u3000\u00b7\u3000\u539f\u521b\u4f5c\u54c1\uff0c\u4ec5\u4f9b\u4e2a\u4eba\u514d\u8d39\u5b66\u4e60' + sig() + '</div>'
      + '<div class="egl-foot-links">'
      + '<button class="egl-link" type="button" id="eglLicBtn">\ud83d\udcdc \u7248\u6743\u4e0e\u4f7f\u7528\u6388\u6743</button>'
      + '<span class="egl-tip">\u7981\u6b62\u5546\u7528</span>'
      + '</div>'
      + (VER ? '<div class="egl-foot-ver">' + esc(VER) + '</div>' : '');
  }

  function bindFoot(el) {
    if (!el || !el.querySelector) return;
    var btn = el.querySelector('#eglLicBtn');
    if (btn && btn.addEventListener) btn.addEventListener('click', function () { showLicense(); });
  }

  // 首页 hero 里的品牌小标签（随视图重渲染自动补回）
  function ensureChip() {
    var d = doc();
    if (!d || !d.querySelector) return;
    var hero = d.querySelector('.hero');
    if (!hero || !hero.appendChild || !hero.querySelector) return;
    if (hero.querySelector('[data-egl-chip]')) return;
    var id = ident();
    if (!id) return;
    var chip = make('div', 'eglChip', 'egl-chip');
    if (chip.removeAttribute) chip.removeAttribute('id');
    if (chip.setAttribute) chip.setAttribute('data-egl-chip', '1');
    chip.innerHTML = '\u2726 ' + esc(id.tag) + ' \u00b7 \u6296\u97f3 ' + esc(id.dy) + ' \u00b7 \u5c0f\u7ea2\u4e66 ' + esc(id.xhs);
    hero.appendChild(chip);
  }

  function ensureNodes() {
    var b = body();
    if (!b || !doc().createElement) return;

    if (!byId(SEAL)) {
      drop(SEAL);
      var seal = make('button', SEAL, 'egl-seal');
      seal.type = 'button';
      if (seal.addEventListener) {
        seal.addEventListener('click', function (e) {
          if (e && e.stopPropagation) e.stopPropagation();
          if (seal.classList && seal.classList.toggle) seal.classList.toggle('on');
        });
      }
      b.appendChild(seal);
    }
    renderSeal();
    bindOutside();

    var foot = byId(FOOT);
    if (!foot) {
      drop(FOOT);
      foot = make('footer', FOOT, 'egl-foot');
      b.appendChild(foot);
    }
    if (!foot.querySelector || !foot.querySelector('[data-egl-main]')) {
      foot.innerHTML = footHTML();
    }
    bindFoot(foot);
  }

  // 反隐藏：删除 style/class、opacity:0、display:none、尺寸归零等一律复位
  function harden() {
    var d = doc();
    var el = byId(SEAL);
    if (el && el.style && el.style.setProperty) {
      var s = el.style;
      s.setProperty('display', 'block', 'important');
      s.setProperty('visibility', 'visible', 'important');
      s.setProperty('filter', 'none', 'important');
      s.setProperty('clip-path', 'none', 'important');
      s.setProperty('z-index', '46', 'important');
      if (typeof s.removeProperty === 'function') s.removeProperty('content');
      // 展开面板本身也要在（被删除 / 被隐藏都会让署名看不全）
      if (el.querySelector && !el.querySelector('.egl-seal-panel')) {
        if (el.removeAttribute) el.removeAttribute('data-egl-face');
        renderSeal();
      }
      var pn = el.querySelector ? el.querySelector('.egl-seal-panel') : null;
      if (pn && pn.style && pn.style.setProperty) {
        pn.style.setProperty('visibility', 'visible', 'important');
        if (pn.style.setProperty) pn.style.setProperty('display', 'block', 'important');
      }
      if (d && d.defaultView && d.defaultView.getComputedStyle) {
        var cs = d.defaultView.getComputedStyle(el);
        if (cs && (cs.display === 'none' || cs.visibility === 'hidden' ||
            cs.opacity === '0' || cs.transform === 'scale(0)')) {
          s.setProperty('display', 'block', 'important');
          s.setProperty('visibility', 'visible', 'important');
          s.setProperty('opacity', '0.88', 'important');
          s.setProperty('transform', 'none', 'important');
        }
      }
    }
    avoidOverlap();
  }

  // 署名印章压到按钮/输入框时自动让位：降到很淡且不拦截点击（避免挡住答题按钮）
  function avoidOverlap() {
    var d = doc(), el = byId(SEAL);
    if (!el || !el.style || !el.style.setProperty) return;
    // 展开态（鼠标悬停 / 键盘聚焦 / 触摸点击）不去打扰
    var open = false;
    try {
      open = !!(el.classList && el.classList.contains('on')) ||
        !!(el.matches && el.matches(':hover, :focus-visible'));
    } catch (e) { open = false; }
    if (open) {
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('pointer-events', 'auto', 'important');
      return;
    }
    if (!d || !d.elementFromPoint || !el.getBoundingClientRect) {
      el.style.setProperty('opacity', '0.88', 'important');
      el.style.setProperty('pointer-events', 'auto', 'important');
      return;
    }
    var r = el.getBoundingClientRect();
    if (!r || !r.width || !r.height) return;
    // 探测时先让自己不吃指针（探测完按结果恢复：压住按钮时彻底让位，避免抢走点击）
    el.style.setProperty('pointer-events', 'none', 'important');
    // 多点采样：印章可能只压住按钮的一角（居中点落在卡片上也要能发现）
    var pts = [[0.5, 0.5], [0.08, 0.5], [0.92, 0.5], [0.5, 0.18], [0.5, 0.82]];
    var busy = false, k, i;
    for (k = 0; k < pts.length && !busy; k++) {
      var node = d.elementFromPoint(r.left + r.width * pts[k][0], r.top + r.height * pts[k][1]);
      for (i = 0; node && i < 4; i++) {
        var tag = node.tagName ? String(node.tagName).toUpperCase() : '';
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'A' || tag === 'TEXTAREA' || tag === 'SELECT') { busy = true; break; }
        if (node.classList && node.classList.contains && node.classList.contains('btn')) { busy = true; break; }
        node = node.parentNode;
      }
    }
    el.style.setProperty('opacity', busy ? '0.32' : '0.88', 'important');
    // 压住按钮/输入框时连点击也让出去：署名入口还有页脚「版权与使用授权」兜底
    el.style.setProperty('pointer-events', busy ? 'none' : 'auto', 'important');
  }

  function guardOnce() {
    _guardTimer = null;
    if (!body() || !ident()) return;
    try { applyVars(); } catch (e) {}
    try { injectCSS(); } catch (e) {}
    try { ensureNodes(); } catch (e) {}
    try { ensureChip(); } catch (e) {}
    try { harden(); } catch (e) {}
  }

  function guardSoon() {
    if (_guardTimer) return;
    if (typeof W.setTimeout !== 'function') { guardOnce(); return; }
    _guardTimer = W.setTimeout(guardOnce, 180);
  }

  function startGuard() {
    var b = body();
    if (!b) return;
    guardOnce();
    if (typeof W.MutationObserver === 'function') {
      try {
        new W.MutationObserver(guardSoon).observe(b, {
          childList: true, subtree: true, attributes: true,
          attributeFilter: ['style', 'class', 'hidden', 'id']
        });
      } catch (e) {}
    }
    if (typeof W.setInterval === 'function') W.setInterval(guardOnce, 2000);
    if (W.addEventListener) W.addEventListener('scroll', guardSoon, { passive: true });
    if (W.addEventListener) W.addEventListener('pageshow', guardSoon);
    var d = doc();
    if (d && d.addEventListener) d.addEventListener('visibilitychange', guardSoon);
  }

  /* ================= 4) 版权与使用授权（免责声明） ================= */
  var NOTICE_KEY = 'EGL_BRAND_NOTICE_v1';

  function licenseHTML() {
    var id = ident() || { n: '', dy: '', xhs: '', lab: '' };
    return '<h3>\ud83d\udcdc \u7248\u6743\u4e0e\u4f7f\u7528\u6388\u6743</h3>'
      + '<p class="small faint" style="margin:2px 0 10px">' + esc(id.lab)
      + ' \u00b7 ' + SUB + '\uff08' + REGION + '\uff09</p>'
      + '<div class="egl-lic">'
      + '<p><b>\u4f5c\u8005\uff1a</b>' + esc(id.tag) + '\u3000\u00b7\u3000\u6296\u97f3 ' + esc(id.dy)
      + '\u3000\u00b7\u3000\u5c0f\u7ea2\u4e66 ' + esc(id.xhs) + '</p>'
      + '<p><b>\u2705 \u5141\u8bb8\uff1a</b>\u4e2a\u4eba\u514d\u8d39\u81ea\u5b66\u4f7f\u7528\uff1b\u539f\u6837\u5b8c\u6574\u5206\u4eab\u672c\u6587\u4ef6\uff08\u5fc5\u987b\u4fdd\u7559\u7f72\u540d\u3001\u6c34\u5370\u4e0e\u672c\u6388\u6743\u8bf4\u660e\uff09\u3002</p>'
      + '<p><b>\u26d4 \u7981\u6b62\uff1a</b>\u4efb\u4f55\u5546\u4e1a\u7528\u9014\u2014\u2014\u57f9\u8bad\u673a\u6784 / \u8865\u8bfe\u73ed\u6388\u8bfe\u3001\u4ed8\u8d39\u8bfe\u7a0b\u4e0e\u8bb2\u4e49\u3001\u4ed8\u8d39\u793e\u7fa4\u5f15\u6d41\u3001\u4e8c\u6b21\u552e\u5356\uff1b\u4e5f\u7981\u6b62\u5220\u9664\u6216\u7be1\u6539\u7f72\u540d\u3001\u6c34\u5370\u540e\u518d\u5206\u53d1\u3002</p>'
      + '<p><b>\u270d\ufe0f \u8f6c\u8f7d\uff1a</b>\u8bf7\u4fdd\u7559\u672c\u9875\u7f72\u540d\u4e0e\u6c34\u5370\uff1b\u8bb2\u4e49\u3001\u7b14\u8bb0\u3001\u8bfe\u4ef6\u4e2d\u5f15\u7528\u9898\u76ee\u6216\u89e3\u9898\u65b9\u6cd5\u65f6\uff0c\u8bf7\u6ce8\u660e\u51fa\u5904\u4e3a\u4f5c\u8005\u8d26\u53f7\u3002</p>'
      + '<p><b>\u26a0\ufe0f \u514d\u8d23\uff1a</b>\u672c\u5de5\u5177\u4ec5\u4f5c\u5b66\u4e60\u8f85\u52a9\uff0c\u5185\u5bb9\u4e0e\u7b54\u6848\u4ec5\u4f9b\u53c2\u8003\uff0c\u4e0d\u6784\u6210\u63d0\u5206\u6216\u8003\u8bd5\u627f\u8bfa\uff1bAI \u5185\u5bb9\u7531\u7b2c\u4e09\u65b9\u6a21\u578b\u751f\u6210\uff0c\u8bf7\u81ea\u884c\u7504\u522b\uff1b\u4f7f\u7528\u672c\u5de5\u5177\u4ea7\u751f\u7684\u4efb\u4f55\u540e\u679c\u7531\u4f7f\u7528\u8005\u81ea\u884c\u627f\u62c5\u3002</p>'
      + '<p class="faint small">\u9898\u5e93\u3001\u8bb2\u4e49\u4e0e\u65b9\u6cd5\u8bfe\u6587\u5b57\u4e3a\u4f5c\u8005\u539f\u521b\u6574\u7406\uff0c\u53d7\u300a\u8457\u4f5c\u6743\u6cd5\u300b\u4fdd\u62a4\u3002'
      + '\u9700\u6388\u6743\u5408\u4f5c\u6216\u53d1\u73b0\u4fb5\u6743\uff0c\u8bf7\u901a\u8fc7\u4e0a\u8ff0\u8d26\u53f7\u8054\u7cfb\u4f5c\u8005\u3002</p>'
      + '</div>'
      + '<div class="btn-row" style="margin-top:14px">'
      + '<button class="btn" type="button" data-egl-ok="1">\u6211\u5df2\u77e5\u6653</button>'
      + '<button class="btn ghost" type="button" data-egl-copy="1">\u590d\u5236\u6388\u6743\u8bf4\u660e</button>'
      + '</div>';
  }

  function licenseText() {
    var id = ident() || { n: '', dy: '', xhs: '', lab: '' };
    return id.lab + '\uff08' + SUB + ' \u00b7 ' + REGION + '\uff09\n'
      + '\u4f5c\u8005\uff1a' + id.tag + '\u3000\u6296\u97f3\uff1a' + id.dy + '\u3000\u5c0f\u7ea2\u4e66\uff1a' + id.xhs + '\n'
      + '\u672c\u4f5c\u54c1\u4ec5\u4f9b\u4e2a\u4eba\u514d\u8d39\u81ea\u5b66\u4f7f\u7528\uff0c\u7981\u6b62\u4efb\u4f55\u5546\u4e1a\u7528\u9014\uff08\u542b\u57f9\u8bad\u673a\u6784\u3001\u8865\u8bfe\u73ed\u3001\u4ed8\u8d39\u8bfe\u7a0b\u4e0e\u8bb2\u4e49\u3001\u4ed8\u8d39\u793e\u7fa4\u3001\u4e8c\u6b21\u552e\u5356\uff09\uff0c'
      + '\u4e5f\u7981\u6b62\u5220\u9664\u6216\u7be1\u6539\u7f72\u540d\u4e0e\u6c34\u5370\u540e\u518d\u5206\u53d1\uff1b\u8f6c\u8f7d\u8bf7\u4fdd\u7559\u7f72\u540d\u5e76\u6ce8\u660e\u51fa\u5904\u3002\n'
      + '\u514d\u8d23\uff1a\u672c\u5de5\u5177\u4ec5\u4f5c\u5b66\u4e60\u8f85\u52a9\uff0c\u4e0d\u6784\u6210\u63d0\u5206\u6216\u8003\u8bd5\u627f\u8bfa\uff1bAI \u5185\u5bb9\u8bf7\u81ea\u884c\u7504\u522b\uff0c\u4f7f\u7528\u540e\u679c\u7531\u4f7f\u7528\u8005\u81ea\u884c\u627f\u62c5\u3002\n'
      + sig();
  }

  function copyText(t) {
    try {
      if (W.navigator && W.navigator.clipboard && W.navigator.clipboard.writeText) {
        W.navigator.clipboard.writeText(t);
        return true;
      }
    } catch (e) {}
    try {
      var ta = doc().createElement('textarea');
      ta.value = t;
      if (ta.style) ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      b().appendChild(ta);
      ta.select();
      var ok = doc().execCommand && doc().execCommand('copy');
      b().removeChild(ta);
      return !!ok;
    } catch (e2) { return false; }
  }

  function showLicense() {
    var d = doc();
    if (!d || !d.createElement || !body()) return null;
    var old = d.getElementById ? d.getElementById('eglLicense') : null;
    if (old && old.parentNode && old.parentNode.removeChild) old.parentNode.removeChild(old);
    var ov = d.createElement('div');
    ov.id = 'eglLicense';
    ov.className = 'overlay';
    if (ov.setAttribute) ov.setAttribute('data-egl-ref', 'eglLicense');
    ov.innerHTML = '<div class="sheet glass">' + licenseHTML() + '</div>';
    function close() { if (ov.parentNode && ov.parentNode.removeChild) ov.parentNode.removeChild(ov); }
    if (ov.addEventListener) {
      ov.addEventListener('click', function (e) {
        var t = e.target || {};
        if (t === ov) { close(); return; }
        var a = t.getAttribute ? t.getAttribute('data-egl-ok') : null;
        if (a) { close(); return; }
        if (t.getAttribute && t.getAttribute('data-egl-copy')) {
          if (copyText(licenseText())) t.textContent = '\u2705 \u5df2\u590d\u5236';
        }
      });
    }
    body().appendChild(ov);
    return ov;
  }

  // 首次访问自动提示一次（作者署名与授权告知）
  function firstVisit() {
    var seen = null;
    try { seen = W.localStorage ? W.localStorage.getItem(NOTICE_KEY) : null; } catch (e) {}
    if (seen) return;
    try { if (W.localStorage) W.localStorage.setItem(NOTICE_KEY, '1'); } catch (e2) {}
    if (typeof W.setTimeout !== 'function') return;
    W.setTimeout(function () { try { showLicense(); } catch (e3) {} }, 700);
  }

  /* ================= 5) 对外 API ================= */
  function install() {
    if (!ident()) return false;
    try { applyVars(); } catch (e) {}
    try { injectCSS(); } catch (e) {}
    try { ensureNodes(); } catch (e) {}
    try { ensureChip(); } catch (e) {}
    try { startGuard(); } catch (e) {}
    try { firstVisit(); } catch (e) {}
    return true;
  }

  function stamp() {
    var id = ident();
    if (!id) return null;
    return { tool: id.lab, author: id.n, tag: id.tag, douyin: id.dy, xhs: id.xhs, sig: sig() };
  }

  E.brand = {
    version: 1,
    ok: function () { return !!ident(); },
    install: install,
    guard: guardOnce,
    mark: mark,
    inspect: inspect,
    markBank: markBank,
    identity: function () {
      var id = ident();
      return id ? { name: id.n, tag: id.tag, douyin: id.dy, xhs: id.xhs, lab: id.lab } : null;
    },
    stamp: stamp,
    showLicense: showLicense,
    licenseText: licenseText
  };

  // 数据无 DOM 时（Node 校验）也能用：仅登记 API
  if (!ident()) {
    try { console.warn('[brand] \u4f5c\u8005\u54c1\u724c\u6a21\u5757\u6821\u9a8c\u5f02\u5e38'); } catch (e) {}
  }
})();
