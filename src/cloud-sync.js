/* Shared, same-origin account/sync client. No tokens or credentials are stored by
 * this module. Revision checks and local backups deliberately replace merging. */
(function (root) {
  'use strict';
  function start(a) {
    if (!document.head || !root.addEventListener || !root.fetch) return;
    var key = 'learning-cloud-' + a.app + '-v1', backupPrefix = key + '-backup-';
    var meta, user = null, blocked = false, applying = false, busy = false, timer, generation = 0, conflict = null, recoveryCode = '';
    var dialog, statusNode, errorNode, accountButton, controls, migration, recoveryNode, recoveryCodeNode;
    var accountNameNode, rootSessionPanel, rootTitle, rootSubtitle, rootSetMode;
    function clone(v) { return JSON.parse(JSON.stringify(v)); }
    function serial(v) { return JSON.stringify(v); }
    function extras() { return a.localExtras ? a.localExtras.read() : null; }
    function snapshot() { return { data: clone(a.getData()), extras: extras() }; }
    function readMeta() {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : { owner: null, accounts: {}, anonymous: null };
    }
    function writeMeta() { localStorage.setItem(key, serial(meta)); }
    function assertOwner() {
      if (readMeta().owner !== meta.owner) { blocked = true; throw new Error('另一标签页已切换账号，请刷新页面后继续同步'); }
      if (blocked) throw new Error('请刷新页面以重新确认账号');
    }
    function saveOwned() {
      assertOwner();
      var s = snapshot();
      if (meta.owner) {
        var old = meta.accounts[meta.owner] || {};
        s.revision = old.revision; s.base = old.base;
        meta.accounts[meta.owner] = s;
      } else meta.anonymous = s;
      writeMeta();
    }
    function backup(local, remote, quarantined) {
      // Throw on quota/storage errors before any destructive replacement.
      localStorage.setItem(backupPrefix + Date.now() + '-' + Math.random().toString(36).slice(2), serial({ owner: meta.owner, quarantined: quarantined === true, savedAt: new Date().toISOString(), local: local, cloud: remote || null }));
    }
    function apply(s, reason) {
      applying = true;
      try { a.setData(clone(s.data), { reason: reason || 'replace' }); if (a.localExtras) a.localExtras.apply(s.extras || null); }
      finally { applying = false; }
    }
    function status(s) { statusNode.textContent = s; rootSessionPanel.dataset.state = s; rootSessionPanel.hidden = !user && s === '本机学习'; }
    function fail(e) {
      status(navigator.onLine === false ? '离线使用' : '同步失败');
      errorNode.textContent = e.message || String(e);
    }
    async function api(path, method, body, id) {
      var headers = { 'Content-Type': 'application/json' };
      if (id) headers['X-Account-ID'] = id;
      var res = await fetch('/api/' + path, { method: method || 'GET', credentials: 'same-origin', headers: headers, cache: 'no-store', body: body === undefined ? undefined : serial(body) });
      var out;
      try { out = await res.json(); } catch (e) { throw new Error('账号服务尚未配置或暂时不可用，本地学习可继续'); }
      if (!res.ok) {
        var err = new Error(out.message || (res.status === 409 ? '云端记录已改变' : '账号服务请求失败'));
        err.status = res.status; err.payload = out; throw err;
      }
      return out;
    }
    function currentAccount() { return user && meta.owner === user.id ? meta.accounts[user.id] : null; }
    function bindRevision(remote, base) {
      var item = currentAccount();
      item.revision = remote.revision; item.base = serial(base);
      item.data = clone(a.getData()); item.extras = extras(); writeMeta();
    }
    function showConflict(remote) {
      backup(snapshot(), remote);
      conflict = remote;
      status('数据冲突');
      migration.hidden = false;
      migration.querySelector('p').textContent = remote.data ? '本机与云端记录需要选择。双方已在本机备份；不会叠加次数或正确率。选择前可下载备份。' : '云端尚无记录。本机记录已备份，可上传到此账号，或继续仅在本机使用。';
      migration.querySelector('[data-choice="cloud"]').hidden = !remote.data;
      dialog.showModal();
    }
    async function reconcile(first) {
      if (!user || blocked || busy || conflict) return;
      if (navigator.onLine === false) { status('离线使用'); return; }
      busy = true; var g = generation, id = user.id;
      status('正在同步'); errorNode.textContent = '';
      try {
        assertOwner();
        var startData = serial(a.getData());
        var remote = await api('sync/' + a.app, 'GET', undefined, id);
        if (g !== generation || !user || user.id !== id) return;
        assertOwner();
        var local = clone(a.getData()), acc = currentAccount(), localRaw = serial(local);
        if (first && localRaw !== startData) { showConflict(remote); return; }
        if (remote.data && serial(remote.data) === localRaw) { bindRevision(remote, local); status('已同步'); return; }
        if (typeof acc.revision === 'number' && remote.revision === acc.revision && !first) {
          if (acc.base === localRaw) { status('已同步'); return; }
          var uploaded = await api('sync/' + a.app, 'PUT', { baseRevision: remote.revision, data: local }, id);
          if (g !== generation) return;
          assertOwner(); bindRevision(uploaded, local); status('已同步');
          if (serial(a.getData()) !== localRaw) schedule();
        } else if (acc.base && acc.base === localRaw && remote.data) {
          backup(snapshot(), remote); apply({ data: remote.data, extras: extras() }); bindRevision(remote, a.getData()); status('已同步');
        } else if (a.isEmpty(local) && remote.data) {
          backup(snapshot(), remote); apply({ data: remote.data, extras: extras() }); bindRevision(remote, a.getData()); status('已同步');
        } else if (a.isEmpty(local) && !remote.data) {
          bindRevision(remote, local); status('已同步');
        } else showConflict(remote);
      } catch (e) {
        if (g !== generation) return;
        if (e.status === 409 && e.payload && e.payload.error === 'conflict') {
          try { showConflict(e.payload); } catch (err) { fail(err); }
        } else {
          if (e.status === 401 || (e.payload && e.payload.error === 'account_changed')) {
            blocked = true; errorNode.textContent = '账号会话已变化，请刷新或重新登录';
          }
          fail(e);
        }
      } finally { busy = false; }
    }
    function schedule() {
      clearTimeout(timer);
      if (user && !conflict && !blocked) timer = setTimeout(function () { reconcile(false); }, 1800);
    }
    async function enter(nextUser) {
      generation++; conflict = null; migration.hidden = true; clearTimeout(timer);
      assertOwner(); saveOwned();
      var before = snapshot(), previousOwner = meta.owner;
      var target = meta.accounts[nextUser.id];
      if (!target) target = previousOwner === null ? snapshot() : { data: a.defaults(), extras: null };
      backup(before, null);
      meta.owner = nextUser.id; meta.accounts[nextUser.id] = clone(target); writeMeta();
      try { if (previousOwner !== nextUser.id) apply(target); } catch (e) { meta.owner = previousOwner; writeMeta(); apply(before); throw e; }
      user = nextUser; updateAccountButton(); rootSessionPanel.hidden = false; rootTitle.textContent = '学习账号'; rootSubtitle.textContent = '古诗文与英语的学习记录，随时接续';
      controls.hidden = false; document.getElementById('learning-cloud-form-' + a.app).hidden = true;
      // A known local revision can safely resume even across a page reload.
      await reconcile(typeof target.revision !== 'number');
    }
    async function logout() {
      if (recoveryCode) throw new Error('请先确认已保存恢复码');
      if (busy) throw new Error('请等待当前同步完成');
      assertOwner(); saveOwned(); backup(snapshot(), null);
      await api('auth/logout', 'POST', {});
      generation++; user = null; conflict = null; clearTimeout(timer);
      var anon = meta.anonymous || { data: a.defaults(), extras: null };
      meta.owner = null; writeMeta(); apply(anon);
      rootSetMode('login'); updateAccountButton(); rootSessionPanel.hidden = true; rootTitle.textContent = '欢迎回来'; rootSubtitle.textContent = '登录后，在不同设备继续学习'; controls.hidden = true; migration.hidden = true;
      document.getElementById('learning-cloud-form-' + a.app).hidden = false;
      status('本机学习');
    }
    async function chooseCloud() {
      if (!conflict || !user || busy) return;
      busy = true;
      try {
      assertOwner(); backup(snapshot(), conflict);
      // Re-fetch before replacing: a newer remote copy must receive a new choice.
      var selected = conflict, g = generation, selectedLocal = serial(a.getData());
      var latest = await api('sync/' + a.app, 'GET', undefined, user.id);
      if (g !== generation) return;
      assertOwner();
      if (latest.revision !== selected.revision || serial(a.getData()) !== selectedLocal) { showConflict(latest); return; }
      backup(snapshot(), latest); apply({ data: latest.data, extras: extras() });
      bindRevision(latest, a.getData()); conflict = null; migration.hidden = true; status('已同步');
      } finally { busy = false; }
    }
    async function chooseLocal() {
      if (!conflict || !user || busy) return;
      busy = true; var g = generation;
      try {
        assertOwner(); var local = clone(a.getData()); backup(snapshot(), conflict);
        var remote = await api('sync/' + a.app, 'PUT', { baseRevision: conflict.revision, data: local }, user.id);
        if (g !== generation) return;
        assertOwner(); bindRevision(remote, local); conflict = null; migration.hidden = true; status('已同步');
        if (serial(a.getData()) !== serial(local)) schedule();
      } catch (e) {
        if (e.status === 409 && e.payload.error === 'conflict') showConflict(e.payload); else throw e;
      } finally { busy = false; }
    }
    function downloadData(data, side) {
      if (!data) return;
      var url = URL.createObjectURL(new Blob([serial(data)], { type: 'application/json' }));
      var link = document.createElement('a'); link.href = url; link.download = a.app + '-' + side + '-study.json'; link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
    function downloadBackups() {
      assertOwner();
      var all = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf(backupPrefix) !== 0) continue;
        var record;
        try { record = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
        // Legacy and quarantined records stay intact, but their owner is uncertain.
        if (record && Object.prototype.hasOwnProperty.call(record, 'owner') && record.owner === meta.owner && record.quarantined !== true) all.push(record);
      }
      var current = meta.owner ? meta.accounts[meta.owner] : meta.anonymous;
      if (meta.owner && !current) throw new Error('账号备份归属无法确认，请刷新后重试');
      current = current ? clone(current) : snapshot();
      var url = URL.createObjectURL(new Blob([serial({ application: a.app, backups: all, current: current })], { type: 'application/json' }));
      var link = document.createElement('a'); link.href = url; link.download = a.app + '-cloud-backups.json'; link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
    function el(tag, text, parent) { var n = document.createElement(tag); if (text) n.textContent = text; if (parent) parent.appendChild(n); return n; }
    function action(parent, text, handler) {
      var b = el('button', text, parent); b.type = 'button';
      b.addEventListener('click', function () { Promise.resolve().then(handler).catch(fail); }); return b;
    }
    function accountIcon() {
      return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.25"/><circle cx="12" cy="9" r="3"/><path d="M5.6 18.4c1-3.1 3.2-4.6 6.4-4.6s5.4 1.5 6.4 4.6"/></svg>';
    }
    function updateAccountButton() {
      accountButton.title = user ? user.username + ' · 账号' : '登录 / 注册';
      accountButton.setAttribute('aria-label', user ? user.username + ' · 账号' : '账号 · 云同步');
      accountButton.classList.toggle('is-signed-in', !!user);
      if (accountNameNode) accountNameNode.textContent = user ? user.username : '尚未登录';
    }
    function ui() {
      var style = el('style', `
.learning-cloud-dialog{--lc-accent:var(--color-accent,var(--accent,#2f4f9e));--lc-surface:var(--color-paper,var(--panel,#fff));--lc-text:var(--color-ink,var(--ink,#263040));--lc-muted:var(--color-ink-2,var(--ink-dim,#667085));--lc-border:var(--color-rule,var(--stroke,#d8dee8));--lc-soft:var(--color-paper-2,var(--bg2,#f3f4f6));color:var(--lc-text);background:var(--lc-surface);font-family:var(--font-body,system-ui,sans-serif);width:min(440px,calc(100% - 32px));max-width:440px;max-height:calc(100dvh - 32px);margin:auto;padding:28px;border:1px solid var(--lc-border);border-radius:18px;box-sizing:border-box;box-shadow:0 24px 80px #11182730;overflow-y:auto;overscroll-behavior:contain;text-align:left}
.learning-cloud-dialog::backdrop{background:#141a275c;backdrop-filter:blur(3px)}
.learning-cloud-dialog [hidden]{display:none!important}.learning-cloud-dialog *{box-sizing:border-box}
.learning-cloud-entry{display:inline-flex;flex:0 0 auto;align-items:center;vertical-align:middle}
.learning-cloud-entry .learning-cloud-account{display:inline-flex;align-items:center;justify-content:center;flex:0 0 40px;width:40px;height:40px;min-height:40px;padding:0;margin:0;border:0!important;border-radius:50%;background:transparent!important;color:inherit;box-shadow:none!important;cursor:pointer;transition:color .15s,opacity .15s}
.learning-cloud-entry .learning-cloud-account:hover{color:var(--color-accent,var(--accent,#2f4f9e));opacity:.8}.learning-cloud-entry .learning-cloud-account.is-signed-in{color:var(--color-accent,var(--accent,#2f4f9e))}
.learning-cloud-entry svg{display:block;flex:none}.learning-cloud-dialog button{font:inherit;cursor:pointer}
.learning-cloud-dialog button:focus-visible,.learning-cloud-account:focus-visible{outline:2px solid var(--color-accent,var(--accent,#2f4f9e));outline-offset:3px}
.learning-cloud-heading{display:flex;align-items:center;gap:12px;padding-right:28px;margin-bottom:22px}
.learning-cloud-mark{display:flex;align-items:center;justify-content:center;width:44px;height:44px;flex:none;border-radius:14px;color:var(--lc-accent);background:var(--lc-soft)}
.learning-cloud-heading h2{font:600 22px/1.35 var(--font-body,system-ui,sans-serif);letter-spacing:-.03em;margin:0 0 4px}
.learning-cloud-dialog p{font-size:13px;line-height:1.65;margin:0;color:var(--lc-muted)}
.learning-cloud-dialog .learning-cloud-close{position:absolute;right:16px;top:18px;display:grid;place-items:center;width:32px;height:32px;padding:0;margin:0;border:0;border-radius:50%;background:transparent;color:var(--lc-muted)}
.learning-cloud-close:hover{background:var(--lc-soft)}
.learning-cloud-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin-bottom:22px;border-radius:10px;background:var(--lc-soft)}
.learning-cloud-dialog .learning-cloud-tab{min-height:38px;border:0;padding:7px 12px;margin:0;background:transparent;color:var(--lc-muted);border-radius:7px;font-size:14px}
.learning-cloud-tab[aria-selected=true]{background:var(--lc-surface);color:var(--lc-text);font-weight:600;box-shadow:0 1px 4px #11182712}
.learning-cloud-field{display:block;margin-bottom:17px}.learning-cloud-label{display:block;font-size:13px;font-weight:600;margin-bottom:8px}
.learning-cloud-dialog input{display:block;width:100%;height:46px;min-width:0;padding:11px 13px;margin:0;border:1px solid var(--lc-border);border-radius:9px;color:var(--lc-text);background:var(--lc-surface);font:400 16px/1.4 var(--font-body,system-ui,sans-serif);outline:none}
.learning-cloud-dialog input::placeholder{color:var(--lc-muted);opacity:.7}.learning-cloud-dialog input:focus{border-color:var(--lc-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--lc-accent) 12%,transparent)}
.learning-cloud-field small{display:block;margin-top:6px;font-size:12px;line-height:1.5;color:var(--lc-muted)}
.learning-cloud-password{display:block;position:relative}.learning-cloud-password input{padding-right:46px}
.learning-cloud-dialog .learning-cloud-eye{position:absolute;right:4px;top:4px;display:grid;place-items:center;width:38px;height:38px;padding:0;margin:0;border:0;border-radius:6px;background:transparent;color:var(--lc-muted)}
.learning-cloud-eye:hover{color:var(--lc-accent);background:var(--lc-soft)}
.learning-cloud-form-links{display:flex;justify-content:flex-end;margin:-4px 0 18px}
.learning-cloud-dialog .learning-cloud-link{border:0;padding:2px 0;margin:0;background:transparent;color:var(--lc-accent);font-size:13px;min-height:28px}
.learning-cloud-dialog .learning-cloud-primary{display:flex;align-items:center;justify-content:center;width:100%;min-height:46px;padding:11px 16px;margin:0;border:1px solid var(--lc-accent);border-radius:9px;background:var(--lc-accent);color:var(--color-accent-ink,var(--on-accent,#fff));font-weight:600;font-size:15px}
.learning-cloud-primary:hover{filter:brightness(.95)}.learning-cloud-dialog button:disabled{opacity:.55;cursor:wait}
.learning-cloud-note{margin-top:15px!important;font-size:12px!important;text-align:center}
.learning-cloud-dialog .learning-cloud-error{color:var(--color-bad,var(--bad,#b23a2c));white-space:pre-wrap;font-size:13px;margin-bottom:16px}
.learning-cloud-error:empty{display:none}
.learning-cloud-session{display:flex;align-items:center;gap:10px;padding:13px 14px;margin:0 0 20px;border:1px solid var(--lc-border);border-radius:10px;background:var(--lc-soft)}
.learning-cloud-session::before{content:'';width:7px;height:7px;flex:none;border-radius:50%;background:var(--lc-muted)}
.learning-cloud-session[data-state='已同步']::before{background:var(--color-ok,var(--ok,#1d6a4c))}
.learning-cloud-session[data-state='数据冲突']::before,.learning-cloud-session[data-state='同步失败']::before{background:var(--color-bad,var(--bad,#b23a2c))}
.learning-cloud-account-name{font-size:14px;font-weight:600;overflow-wrap:anywhere}.learning-cloud-state{font-size:12px!important;margin-top:2px!important}
.learning-cloud-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.learning-cloud-dialog .learning-cloud-secondary{padding:9px 12px;min-height:40px;margin:0;border:1px solid var(--lc-border);border-radius:8px;background:transparent;color:var(--lc-text);font-size:13px}
.learning-cloud-secondary:hover{background:var(--lc-soft)}
.learning-cloud-panel{border:1px solid var(--lc-border);border-radius:12px;padding:16px;margin-top:16px}
.learning-cloud-panel p+p{margin-top:8px}.learning-cloud-dialog code{display:block;overflow-wrap:anywhere;user-select:all;font:13px/1.7 var(--font-mono,monospace);padding:12px;margin:10px 0;background:var(--lc-soft);border-radius:8px;color:var(--lc-text)}
.learning-cloud-footer{display:flex;justify-content:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--lc-border)}
@media(max-width:480px){.learning-cloud-dialog{padding:24px 20px;border-radius:16px}.learning-cloud-heading h2{font-size:21px}.learning-cloud-heading{gap:10px}.learning-cloud-mark{width:40px;height:40px}.learning-cloud-dialog .learning-cloud-close{right:12px;top:14px}}
@media(prefers-reduced-motion:reduce){.learning-cloud-account{transition:none!important}}
`);
      document.head.appendChild(style);
      var host = el('span', '', a.mount || document.body); host.className = 'learning-cloud-entry';
      accountButton = action(host, '', function () { dialog.showModal(); });
      accountButton.className = 'learning-cloud-account'; accountButton.innerHTML = accountIcon();
      accountButton.setAttribute('aria-haspopup', 'dialog');
      dialog = el('dialog', '', document.body); dialog.className = 'learning-cloud-dialog';
      dialog.setAttribute('aria-labelledby', 'learning-cloud-title-' + a.app);
      function closeDialog() { if (recoveryCode) throw new Error('请先确认已保存恢复码'); dialog.close(); }
      var close = action(dialog, '', closeDialog); close.className = 'learning-cloud-close'; close.setAttribute('aria-label', '关闭');
      close.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>';
      var heading = el('div', '', dialog); heading.className = 'learning-cloud-heading';
      var mark = el('span', '', heading); mark.className = 'learning-cloud-mark'; mark.innerHTML = accountIcon();
      var headingText = el('div', '', heading);
      var title = el('h2', '欢迎回来', headingText); title.id = 'learning-cloud-title-' + a.app;
      var subtitle = el('p', '登录后，在不同设备继续学习', headingText);
      var sessionPanel = el('div', '', dialog); sessionPanel.className = 'learning-cloud-session'; sessionPanel.hidden = true;
      var sessionText = el('div', '', sessionPanel);
      accountNameNode = el('div', '尚未登录', sessionText); accountNameNode.className = 'learning-cloud-account-name';
      statusNode = el('p', '本机学习', sessionText); statusNode.className = 'learning-cloud-state'; statusNode.setAttribute('aria-live', 'polite');
      errorNode = el('p', '', dialog); errorNode.className = 'learning-cloud-error'; errorNode.setAttribute('role', 'alert');
      var form = el('form', '', dialog); form.id = 'learning-cloud-form-' + a.app;
      var mode = { value: 'login' };
      var tabs = el('div', '', form); tabs.className = 'learning-cloud-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', '登录或注册');
      var loginTab = action(tabs, '登录', function () { setMode('login'); });
      var registerTab = action(tabs, '注册', function () { setMode('register'); });
      [loginTab, registerTab].forEach(function (tab) { tab.className = 'learning-cloud-tab'; tab.setAttribute('role', 'tab'); });
      function field(labelText, parent) {
        var wrap = el('label', '', parent); wrap.className = 'learning-cloud-field';
        el('span', labelText, wrap).className = 'learning-cloud-label'; return wrap;
      }
      var nameField = field('用户名', form);
      var name = el('input', '', nameField); name.name = 'username'; name.placeholder = '输入用户名'; name.autocomplete = 'username'; name.required = true; name.pattern = '[A-Za-z0-9_-]{3,32}'; name.maxLength = 32; name.setAttribute('aria-label', '用户名');
      var nameHint = el('small', '3–32 位字母、数字、下划线或短横线', nameField); nameHint.hidden = true;
      var passwordField = field('密码', form);
      var passwordWrap = el('span', '', passwordField); passwordWrap.className = 'learning-cloud-password';
      var password = el('input', '', passwordWrap); password.name = 'password'; password.type = 'password'; password.placeholder = '输入密码'; password.minLength = 6; password.maxLength = 128; password.required = true; password.setAttribute('aria-label', '密码');
      var showPassword = action(passwordWrap, '', function () {
        var visible = password.type === 'password'; password.type = visible ? 'text' : 'password';
        showPassword.setAttribute('aria-label', visible ? '隐藏密码' : '显示密码'); showPassword.setAttribute('aria-pressed', String(visible));
      });
      showPassword.className = 'learning-cloud-eye'; showPassword.setAttribute('aria-label', '显示密码'); showPassword.setAttribute('aria-pressed', 'false');
      showPassword.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
      var passwordHint = el('small', '至少 6 位字母或数字，无需同时包含两种', passwordField); passwordHint.hidden = true;
      var recoveryField = field('恢复码', form); recoveryField.hidden = true;
      var recovery = el('input', '', recoveryField); recovery.placeholder = '输入注册时保存的恢复码'; recovery.autocomplete = 'off'; recovery.setAttribute('aria-label', '恢复码');
      var formLinks = el('div', '', form); formLinks.className = 'learning-cloud-form-links';
      var recoverLink = action(formLinks, '忘记密码？', function () { setMode(mode.value === 'recover' ? 'login' : 'recover'); }); recoverLink.className = 'learning-cloud-link';
      var submit = el('button', '登录', form); submit.type = 'submit'; submit.className = 'learning-cloud-primary';
      var note = el('p', '古诗文与英语共用账号；不登录也可继续学习。', form); note.className = 'learning-cloud-note';
      function submitLabel() { return mode.value === 'register' ? '注册并同步' : mode.value === 'recover' ? '重置密码' : '登录'; }
      function setMode(next) {
        if (submit.disabled) return;
        mode.value = next; password.value = ''; password.type = 'password'; recovery.value = ''; errorNode.textContent = '';
        showPassword.setAttribute('aria-label', '显示密码'); showPassword.setAttribute('aria-pressed', 'false');
        var isLogin = next === 'login', isRegister = next === 'register';
        loginTab.setAttribute('aria-selected', String(isLogin)); registerTab.setAttribute('aria-selected', String(isRegister));
        loginTab.tabIndex = isRegister ? -1 : 0; registerTab.tabIndex = isRegister ? 0 : -1;
        recoveryField.hidden = next !== 'recover'; recovery.required = next === 'recover'; nameHint.hidden = !isRegister; passwordHint.hidden = isLogin;
        password.autocomplete = isLogin ? 'current-password' : 'new-password';
        if (isLogin) { password.removeAttribute('pattern'); password.placeholder = '输入密码'; }
        else { password.pattern = '[A-Za-z0-9]{6,128}'; password.placeholder = next === 'recover' ? '设置新密码，至少 6 位字母或数字' : '至少 6 位字母或数字'; }
        recoverLink.textContent = next === 'recover' ? '返回登录' : '忘记密码？'; formLinks.hidden = isRegister;
        title.textContent = isRegister ? '创建学习账号' : next === 'recover' ? '重置密码' : '欢迎回来';
        subtitle.textContent = next === 'recover' ? '使用恢复码，找回你的学习记录' : isRegister ? '一个账号，古诗文与英语都能用' : '登录后，在不同设备继续学习';
        note.textContent = isLogin ? '古诗文与英语共用账号；不登录也可继续学习。' : '不使用邮箱找回，请妥善保存恢复码。';
        submit.textContent = submitLabel();
      }
      tabs.addEventListener('keydown', function (event) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); if (submit.disabled) return;
        var register = event.key === 'End' || (event.key !== 'Home' && mode.value !== 'register');
        setMode(register ? 'register' : 'login'); (register ? registerTab : loginTab).focus();
      });
      setMode('login');
      form.addEventListener('submit', function (ev) {
        ev.preventDefault(); if (busy || submit.disabled) return;
        submit.disabled = true; submit.textContent = mode.value === 'register' ? '正在注册…' : mode.value === 'recover' ? '正在重置…' : '正在登录…'; errorNode.textContent = '';
        Promise.resolve().then(function () {
          assertOwner(); saveOwned();
          var payload = { username: name.value.trim(), password: password.value };
          if (mode.value === 'recover') payload.recoveryCode = recovery.value.trim();
          return api('auth/' + mode.value, 'POST', payload);
        }).then(async function (out) {
          password.value = ''; password.type = 'password'; recovery.value = '';
          showPassword.setAttribute('aria-label', '显示密码'); showPassword.setAttribute('aria-pressed', 'false');
          if (out.recoveryCode) { recoveryCode = out.recoveryCode; recoveryNode.hidden = false; recoveryCodeNode.textContent = out.recoveryCode; }
          blocked = false; await enter(out.user);
        }).catch(function (e) { errorNode.textContent = e.message || String(e); }).finally(function () { submit.disabled = false; submit.textContent = submitLabel(); });
      });
      recoveryNode = el('section', '', dialog); recoveryNode.className = 'learning-cloud-panel'; recoveryNode.hidden = true;
      el('p', '请保存你的恢复码', recoveryNode).style.fontWeight = '600';
      el('p', '仅显示一次。忘记密码时可用它设置新密码，请与密码分开保管。', recoveryNode);
      recoveryCodeNode = el('code', '', recoveryNode);
      var recoveryActions = el('div', '', recoveryNode); recoveryActions.className = 'learning-cloud-actions';
      action(recoveryActions, '下载恢复码', function () {
        var text = '用户名：' + name.value.trim() + '\n恢复码：' + recoveryCodeNode.textContent + '\n请保存在安全位置，不要上传至 GitHub 或发送给他人。\n';
        var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
        var link = document.createElement('a'); link.href = url; link.download = 'learning-account-recovery-private.txt'; link.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }).className = 'learning-cloud-secondary';
      action(recoveryActions, '我已保存恢复码', function () { recoveryCode = ''; recoveryNode.hidden = true; recoveryCodeNode.textContent = ''; }).className = 'learning-cloud-secondary';
      controls = el('div', '', dialog); controls.hidden = true; controls.className = 'learning-cloud-actions';
      action(controls, '立即同步', function () { return reconcile(false); }).className = 'learning-cloud-secondary';
      action(controls, '退出账号', logout).className = 'learning-cloud-secondary';
      migration = el('section', '', dialog); migration.className = 'learning-cloud-panel'; migration.hidden = true; el('p', '', migration);
      var choices = el('div', '', migration); choices.className = 'learning-cloud-actions';
      action(choices, '使用本机记录（上传）', chooseLocal).dataset.choice = 'local';
      action(choices, '使用云端记录（下载）', chooseCloud).dataset.choice = 'cloud';
      action(choices, '下载本机学习记录', function () { downloadData(a.getData(), 'local'); });
      action(choices, '下载云端学习记录', function () { if (conflict) downloadData(conflict.data, 'cloud'); });
      Array.from(choices.children).forEach(function (button) { button.className = 'learning-cloud-secondary'; });
      el('p', '双方已备份。作出选择前暂停自动同步，关闭窗口可继续学习。', migration);
      var footer = el('div', '', dialog); footer.className = 'learning-cloud-footer';
      action(footer, '下载同步备份', downloadBackups).className = 'learning-cloud-link';
      dialog.addEventListener('cancel', function (ev) { if (recoveryCode) ev.preventDefault(); });
      // Keep status inside the account panel; the page header contains only the icon.
      rootSessionPanel = sessionPanel; rootTitle = title; rootSubtitle = subtitle; rootSetMode = setMode;
      updateAccountButton();
    }
    ui();
    try { meta = readMeta(); if (!meta.accounts || typeof meta.accounts !== 'object') throw new Error('同步元数据无法读取，请先导出本机记录'); }
    catch (e) { blocked = true; fail(e); return; }
    // The main storage key is shared by old tabs. Restore the owner-bound
    // snapshot before reading the cookie; an old tab must never relabel its
    // stale in-memory records as the account now active in another tab.
    try {
      var canonical = meta.owner ? meta.accounts[meta.owner] : null;
      if (canonical && (serial(canonical.data) !== serial(a.getData()) || serial(canonical.extras || null) !== serial(extras() || null))) {
        backup(snapshot(), { ownerSnapshot: canonical }, true);
        apply(canonical, 'startup');
        errorNode.textContent = '检测到其他标签页或旧版本写入，已备份并恢复此账号最近保存的记录。';
      }
    } catch (e) { blocked = true; fail(e); return; }
    a.subscribe(function (event) {
      if (applying || blocked) return;
      try { saveOwned(); if (!user) status('本机学习'); if (!event || !event.localOnly) schedule(); } catch (e) { fail(e); }
    });
    root.addEventListener('beforeunload', function (event) {
      if (recoveryCode) { event.preventDefault(); event.returnValue = ''; }
    });
    root.addEventListener('online', function () { reconcile(false); });
    root.addEventListener('offline', function () { status('离线使用'); });
    root.addEventListener('storage', function (ev) {
      if (ev.key === key) {
        blocked = true; generation++; clearTimeout(timer); status('同步暂停'); errorNode.textContent = '其他标签页修改了学习数据或账号，请刷新后继续同步';
      }
    });
    root.addEventListener('focus', function () { if (!blocked) reconcile(false); });
    if (location.protocol !== 'http:' && location.protocol !== 'https:') { status('本机学习'); return; }
    api('auth/me').then(async function (out) {
      if (out.user) await enter(out.user);
      else if (meta.owner) {
        // An expired cookie cannot relabel an account's offline records as anonymous.
        status('会话已过期 · 本机保存');
      }
    }).catch(fail);
    return { sync: function () { return reconcile(false); }, getState: function () { return { owner: meta.owner, user: user, blocked: blocked, conflict: conflict }; } };
  }
  root.LearningCloud = { start: start };
})(window);
