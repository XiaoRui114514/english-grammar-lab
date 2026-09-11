/* ============================================================
 * boot.js — 入口：hash 路由 / 顶栏 / 全局事件
 * 路由：#/home  #/topics  #/topic/tense01  #/wrong  #/weak
 *        #/records  #/challenge
 * ============================================================ */
(function () {
  'use strict';
  var E = window.EGL, U = E.u;
  var $ = U.$, $$ = U.$$;

  var viewEl = null;

  function render() {
    var hash = (location.hash || '#/home').replace(/^#\//, '');
    var parts = hash.split('/');
    var route = parts[0] || 'home';
    if (!E.ui.app) return;
    E.ui.quizActive = false;
    highlightNav(route);
    switch (route) {
      case 'topics': E.ui.topics(); break;
      case 'topic': E.ui.topicPage(parts[1] || ''); break;
      case 'wrong': E.ui.wrongBook(); break;
      case 'weak': E.ui.weak(); break;
      case 'records': E.ui.records(); break;
      case 'challenge': E.quiz.mixedGate(); break;
      case 'ai': (E.aiUI && E.aiUI.aiPage) ? E.aiUI.aiPage() : E.ui.home(); break;
      case 'method': (E.ui && E.ui.methodPage) ? E.ui.methodPage() : E.ui.home(); break;
      default: E.ui.home(); break;
    }
    window.scrollTo(0, 0);
  }

  function highlightNav(route) {
    $$('.nav-btn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.nav === route);
    });
  }

  // 品牌 / 版权层缺失时的拦截页（提示由作者渠道重新获取完整版本）
  function blocked() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '<div class="wrap"><div class="glass" style="padding:34px 26px;text-align:center">'
      + '<h2>⚠️ 版本校验未通过</h2>'
      + '<p style="margin-top:10px;color:var(--ink-dim)">本文件缺少作者署名与版权（水印）模块，无法启动。</p>'
      + '<p class="small faint" style="margin-top:10px">若本文件来自他人转发，可能已被二次修改（去署名 / 去水印 / 去版权说明）。'
      + '请回到作者发布渠道获取完整版本，并保留署名与授权说明。</p></div></div>';
  }

  function go(route) {
    if (location.hash === '#/' + route) { render(); return; }
    location.hash = '#/' + route;
  }

  function onHashChange() {
    if (E.ui.quizActive) return; // 练习中：由练习页自行退出
    render();
  }

  function bindTopbar() {
    $$('.nav-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (E.ui.quizActive) { E.quiz.askExit(); return; }
        var nav = b.dataset.nav;
        if (nav === 'challenge') {
          if (!(E.ui.allCoreFinished && E.ui.allCoreFinished())) {
            U.toast('需先完成全部 12 个专题（每题一轮）', 'bad');
            return;
          }
        }
        go(nav);
      });
    });
    var brand = document.getElementById('brandHome');
    if (brand) brand.addEventListener('click', function () { go('home'); });
  }

  function init() {
    // 署名 / 水印 / 版权层校验：品牌模块被摘除或篡改 → 拒绝启动（详见 src/brand.js）
    if (!(E.brand && E.brand.ok && E.brand.ok())) { blocked(); return; }
    E.brand.install();
    var bankKeys = window.__GRAMMAR_LAB__ ? Object.keys(window.__GRAMMAR_LAB__) : [];
    if (!bankKeys.length) {
      var body = document.getElementById('app');
      body.innerHTML = '<div class="wrap"><div class="glass" style="padding:40px;text-align:center;color:#aab3d0">'
        + '<h2>📭 题库数据未加载</h2><p style="margin-top:10px">请使用完整版本，或运行 build.js 生成单文件 English-Grammar-Lab.html。</p></div></div>';
      return;
    }
    // 题库文本打隐形指纹：被复制、被搬运的题干会带着作者信息走
    if (E.brand.markBank) E.brand.markBank(window.__GRAMMAR_LAB__);
    var app = document.getElementById('app');
    viewEl = document.createElement('div');
    viewEl.className = 'wrap';
    viewEl.id = 'view';
    app.appendChild(viewEl);
    E.ui.app = { view: viewEl };
    if (E.ui.setApp) E.ui.setApp(E.ui.app);
    E.ui.quizActive = false;
    // 任意自动保存 → 右上角“已自动保存”提示（节流，1.4s 后消失）
    if (E.setSaveListener && U.savedNotice) E.setSaveListener(U.savedNotice);
    bindTopbar();
    window.addEventListener('hashchange', onHashChange);
    render();
  }

  E.ui = E.ui || {};
  E.ui.go = go;
  E.ui.app = null;
  E.ui.quizActive = false;
  E.ui.init = init;
  E.ui.render = render;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
