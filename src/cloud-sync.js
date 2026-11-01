/* Shared, same-origin account/sync client. No tokens or credentials are stored by
 * this module. Revision checks and local backups deliberately replace merging. */
(function (root) {
  'use strict';
  function start(a) {
    if (!document.head || !root.addEventListener || !root.fetch) return;
    var key = 'learning-cloud-' + a.app + '-v1', backupPrefix = key + '-backup-';
    var meta, user = null, blocked = false, applying = false, busy = false, timer, generation = 0, conflict = null, recoveryCode = '';
    var dialog, statusNode, errorNode, accountButton, controls, migration, recoveryNode, recoveryCodeNode;
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
    function backup(local, remote) {
      // Throw on quota/storage errors before any destructive replacement.
      localStorage.setItem(backupPrefix + Date.now() + '-' + Math.random().toString(36).slice(2), serial({ savedAt: new Date().toISOString(), local: local, cloud: remote || null }));
    }
    function apply(s, reason) {
      applying = true;
      try { a.setData(clone(s.data), { reason: reason || 'replace' }); if (a.localExtras) a.localExtras.apply(s.extras || null); }
      finally { applying = false; }
    }
    function status(s) { statusNode.textContent = s; }
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
      user = nextUser; accountButton.textContent = nextUser.username + ' · 账号';
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
      accountButton.textContent = '账号 · 云同步'; controls.hidden = true; migration.hidden = true;
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
      var all = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i); if (k.indexOf(backupPrefix) === 0) all.push(JSON.parse(localStorage.getItem(k)));
      }
      var url = URL.createObjectURL(new Blob([serial({ application: a.app, backups: all, current: snapshot() })], { type: 'application/json' }));
      var link = document.createElement('a'); link.href = url; link.download = a.app + '-cloud-backups.json'; link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
    function el(tag, text, parent) { var n = document.createElement(tag); if (text) n.textContent = text; if (parent) parent.appendChild(n); return n; }
    function action(parent, text, handler) {
      var b = el('button', text, parent); b.type = 'button';
      b.addEventListener('click', function () { Promise.resolve().then(handler).catch(fail); }); return b;
    }
    function ui() {
      var style = el('style', '.learning-cloud-dialog{max-width:520px;width:calc(100% - 32px);border:1px solid #cbd5e1;border-radius:16px;padding:24px;color:#233047;background:#fff;box-sizing:border-box}.learning-cloud-dialog::backdrop{background:#18243780}.learning-cloud-dialog p{line-height:1.7;font-size:14px}.learning-cloud-dialog button,.learning-cloud-dialog input,.learning-cloud-dialog select{font:inherit;margin:6px 4px 6px 0;padding:9px;border:1px solid #cbd5e1;border-radius:8px}.learning-cloud-dialog input{width:100%;box-sizing:border-box}.learning-cloud-dialog [hidden]{display:none!important}.learning-cloud-error{color:#a33131;white-space:pre-wrap}.learning-cloud-state{font-size:12px;white-space:nowrap}.learning-cloud-entry{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}.learning-cloud-dialog code{overflow-wrap:anywhere;display:block;padding:10px;background:#f1f5f9}');
      document.head.appendChild(style);
      var host = el('span', '', a.mount || document.body); host.className = 'learning-cloud-entry';
      accountButton = action(host, '账号 · 云同步', function () { dialog.showModal(); }); accountButton.className = 'nav-btn btn btn-sm';
      statusNode = el('span', '本机学习', host); statusNode.className = 'learning-cloud-state'; statusNode.setAttribute('aria-live', 'polite');
      dialog = el('dialog', '', document.body); dialog.className = 'learning-cloud-dialog';
      el('h2', a.label + ' · 共用账号', dialog);
      el('p', '古诗文与英语使用同一用户名和密码；无需登录也可继续本机学习。', dialog);
      var form = el('form', '', dialog); form.id = 'learning-cloud-form-' + a.app;
      var mode = el('select', '', form); mode.setAttribute('aria-label', '账号操作');
      [['login','登录'],['register','注册'],['recover','恢复账号']].forEach(function (x) { var o = el('option', x[1], mode); o.value = x[0]; });
      var name = el('input', '', form); name.placeholder = '用户名：3–32 位字母、数字、_ 或 -'; name.autocomplete = 'username'; name.required = true; name.pattern = '[A-Za-z0-9_-]{3,32}'; name.setAttribute('aria-label','用户名');
      var password = el('input', '', form); password.type = 'password'; password.placeholder = '密码：10–128 个字符'; password.minLength = 10; password.maxLength = 128; password.autocomplete = 'current-password'; password.required = true; password.setAttribute('aria-label','密码');
      var recovery = el('input', '', form); recovery.placeholder = '恢复码'; recovery.autocomplete = 'off'; recovery.hidden = true; recovery.setAttribute('aria-label','恢复码');
      mode.addEventListener('change', function () { password.value = ''; recovery.value = ''; recovery.hidden = mode.value !== 'recover'; recovery.required = mode.value === 'recover'; password.autocomplete = mode.value === 'login' ? 'current-password' : 'new-password'; password.placeholder = mode.value === 'recover' ? '新密码：10–128 个字符' : '密码：10–128 个字符'; });
      var submit = el('button', '继续', form); submit.type = 'submit';
      el('p', '请使用独立密码并保存恢复码。不使用邮箱，无法通过邮件找回密码；密码和恢复码同时丢失后无法恢复账号。', form);
      form.addEventListener('submit', function (ev) {
        ev.preventDefault(); if (busy || submit.disabled) return;
        submit.disabled = true; errorNode.textContent = '';
        Promise.resolve().then(function () {
          assertOwner(); saveOwned();
          var payload = { username: name.value.trim(), password: password.value };
          if (mode.value === 'recover') payload.recoveryCode = recovery.value.trim();
          return api('auth/' + mode.value, 'POST', payload);
        }).then(async function (out) {
          password.value = ''; recovery.value = '';
          if (out.recoveryCode) {
            recoveryCode = out.recoveryCode; recoveryNode.hidden = false;
            recoveryCodeNode.textContent = out.recoveryCode;
          }
          blocked = false; await enter(out.user);
        }).catch(fail).finally(function () { submit.disabled = false; });
      });
      recoveryNode = el('section', '', dialog); recoveryNode.hidden = true;
      el('p', '恢复码只显示一次，请立即保存。用恢复码设置新密码后会生成新的恢复码。', recoveryNode);
      el('p', '恢复码（忘记密码时使用）', recoveryNode); recoveryCodeNode = el('code', '', recoveryNode);
      action(recoveryNode, '下载恢复码', function () {
        var text = '用户名：' + name.value.trim() + '\n恢复码：' + recoveryCodeNode.textContent + '\n请保存在安全位置，不要上传至 GitHub 或发送给他人。\n';
        var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
        var link = document.createElement('a'); link.href = url; link.download = 'learning-account-recovery-private.txt'; link.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      });
      action(recoveryNode, '我已保存恢复码', function () { recoveryCode = ''; recoveryNode.hidden = true; recoveryCodeNode.textContent = ''; });
      controls = el('div', '', dialog); controls.hidden = true;
      action(controls, '立即同步', function () { return reconcile(false); }); action(controls, '退出账号', logout);
      migration = el('section', '', dialog); migration.hidden = true; el('p', '', migration);
      action(migration, '使用本机记录（上传）', chooseLocal).dataset.choice = 'local';
      action(migration, '使用云端记录（下载）', chooseCloud).dataset.choice = 'cloud';
      action(migration, '下载本机学习记录', function () { downloadData(a.getData(), 'local'); });
      action(migration, '下载云端学习记录', function () { if (conflict) downloadData(conflict.data, 'cloud'); });
      el('p', '关闭此窗口可继续学习；作出选择前暂停自动同步。下载的单份学习记录可通过原数据导入功能恢复。', migration);
      action(dialog, '下载同步备份', downloadBackups);
      action(dialog, '关闭', function () { if (recoveryCode) throw new Error('请先确认已保存恢复码'); dialog.close(); });
      dialog.addEventListener('cancel', function (ev) { if (recoveryCode) ev.preventDefault(); });
      errorNode = el('p', '', dialog); errorNode.className = 'learning-cloud-error'; errorNode.setAttribute('role', 'alert');
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
        backup(snapshot(), { ownerSnapshot: canonical });
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
