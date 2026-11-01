/* English adapter: AI keys/config/pool/explanations and unfinished drafts are
 * never in the cloud payload. Local snapshots isolate drafts between accounts. */
(function () {
  'use strict';
  function init() {
    var E = window.EGL;
    if (!E || !E.cloudData || !window.LearningCloud) return;
    E.cloudLocalSaved = function () { window.dispatchEvent(new CustomEvent('egl:local-extras-saved')); };
    var localOnly = ['EGL_AI_POOL_v1', 'EGL_AI_EXPLAIN_v1', 'EGL_QUIZ_DRAFT_v1', 'EGL_AI_LAST_v1'];
    window.eglCloud = window.LearningCloud.start({
      app: 'english', label: '英语语法填空', mount: document.querySelector('.nav'),
      getData: E.cloudData.read,
      setData: E.cloudData.apply,
      defaults: function () { return E.cloudData.project(E.emptyData()); },
      isEmpty: E.cloudData.empty,
      subscribe: function (fn) {
        window.addEventListener('egl:data-saved', fn);
        window.addEventListener('egl:local-extras-saved', function () { fn({ localOnly: true }); });
      },
      localExtras: {
        read: function () {
          var out = {};
          localOnly.forEach(function (k) { out[k] = localStorage.getItem(k); });
          try { out.sessionLast = sessionStorage.getItem('EGL_AI_LAST_v1'); } catch (e) {}
          return out;
        },
        apply: function (v) {
          if (E.ai && E.ai.cancelActive) E.ai.cancelActive();
          localOnly.forEach(function (k) {
            if (v && typeof v[k] === 'string') localStorage.setItem(k, v[k]); else localStorage.removeItem(k);
          });
          try { if (v && typeof v.sessionLast === 'string') sessionStorage.setItem('EGL_AI_LAST_v1', v.sessionLast); else sessionStorage.removeItem('EGL_AI_LAST_v1'); } catch (e) {}
          if (E.quiz && E.quiz.resetActiveSession) E.quiz.resetActiveSession();
          if (E.ui && E.ui.render) E.ui.render();
        }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
