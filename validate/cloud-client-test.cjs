// Synthetic learning records only. Real shared client + mocked same-origin API.
// Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH when using a system Chromium.
const { chromium } = require("@playwright/test");
const fs = require("fs"),
  assert = require("assert/strict");
const engine = fs.readFileSync(
  require("path").join(__dirname, "../src/cloud-sync.js"),
  "utf8",
);
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    headless: true,
    args: ["--no-sandbox"],
  });
  const cloud = new Map();
  const testPassword = "  Synthetic MixedCase Password9!  ";
  const newPassword = "Abc123";
  let requestDelay = 0,
    onPut;
  const pageErrors = [];
  async function device(seed = { count: 0 }, withExtras = false) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("pageerror", (e) => pageErrors.push(e.message));
    let active = null;
    await page.route("**/*", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      if (url.pathname === "/audit")
        return route.fulfill({
          contentType: "text/html; charset=utf-8",
          body:
            '<html><head></head><body><nav id="mount"></nav><script>' +
            engine +
            '</script><script>window.study=JSON.parse(localStorage.getItem("audit-study")||' +
            JSON.stringify(JSON.stringify(seed)) +
            ');window.rawExtras={};window.engine=LearningCloud.start({app:"english",label:"测试",mount:document.getElementById("mount"),getData:()=>study,setData:d=>{study=d;localStorage.setItem("audit-study",JSON.stringify(d))},defaults:()=>({count:0}),isEmpty:d=>d.count===0,subscribe:fn=>{window.saved=()=>{localStorage.setItem("audit-study",JSON.stringify(study));fn()}}' +
            (withExtras ? ',localExtras:{read:()=>rawExtras,apply:x=>{rawExtras=x||{}}}' : '') +
            '});</script></body></html>',
        });
      if (!url.pathname.startsWith("/api/"))
        return route.fulfill({ status: 404, body: "" });
      let out,
        status = 200;
      if (url.pathname === "/api/auth/me") out = { user: active };
      else if (
        ["/api/auth/login", "/api/auth/register", "/api/auth/recover"].includes(
          url.pathname,
        )
      ) {
        const data = req.postDataJSON();
        active = { id: data.username, username: data.username };
        if (url.pathname === "/api/auth/login") {
          assert.equal(data.password, testPassword, "login password preserves case and whitespace");
          out = { user: active };
        }
        else {
          assert.equal(data.password, newPassword, "new password accepts six letters/digits");
          out = {
            user: active,
            recoveryCode: "c".repeat(48),
          };
        }
      } else if (url.pathname === "/api/auth/logout") {
        active = null;
        out = { ok: true };
      } else if (!active || req.headers()["x-account-id"] !== active.id) {
        status = 401;
        out = { error: "unauthenticated" };
      } else {
        const old = cloud.get(active.id) || { revision: 0, data: null };
        if (req.method() === "GET") out = old;
        else {
          const data = req.postDataJSON();
          if (old.revision !== data.baseRevision) {
            status = 409;
            out = { ...old, error: "conflict" };
          } else {
            out = { revision: old.revision + 1, data: data.data };
            cloud.set(active.id, out);
          }
        }
      }
      if (req.method() === "PUT" && onPut) {
        const resolve = onPut;
        onPut = null;
        resolve();
      }
      if (requestDelay) await new Promise((r) => setTimeout(r, requestDelay));
      return route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(out),
      });
    });
    await page.goto("http://127.0.0.1:5174/audit");
    return page;
  }
  async function login(page, user) {
    await page
      .getByRole("button", { name: "账号 · 云同步", exact: true })
      .click();
    await page.getByLabel("用户名", { exact: true }).fill(user);
    await page.getByLabel("密码", { exact: true }).fill(testPassword);
    await page.locator("form button[type=submit]").click();
    await page.waitForFunction(() => engine.getState().user !== null);
  }
  async function backupIsolation() {
    const p = await device({count: 0}, true);
    const prefix = 'learning-cloud-english-v1-backup-';
    await p.evaluate((prefix) => {
      const record = (owner, canary, extra = {}) => ({
        owner, local: {data: {count: 0, canary}}, cloud: null, ...extra,
      });
      localStorage.setItem(prefix + 'anon', JSON.stringify(record(null, 'ANONYMOUS_ONLY')));
      localStorage.setItem(prefix + 'alpha', JSON.stringify(record('backup_alpha', 'ALPHA_ONLY')));
      localStorage.setItem(prefix + 'beta', JSON.stringify(record('backup_beta', 'BETA_ONLY')));
      localStorage.setItem(prefix + 'quarantine', JSON.stringify(record('backup_beta', 'QUARANTINED_OLD_ALPHA', {quarantined: true})));
      localStorage.setItem(prefix + 'legacy', JSON.stringify({local: {data: {count: 0, canary: 'UNTAGGED_LEGACY'}}}));
      localStorage.setItem(prefix + 'malformed', '{synthetic-malformed');
      window.auditDownloads = [];
      const create = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        blob.text().then(text => window.auditDownloads.push(JSON.parse(text)));
        return create.call(URL, blob);
      };
    }, prefix);
    let downloads = 0;
    async function exported(owner, allowed, forbidden) {
      await p.getByRole('button', {name: '下载同步备份', exact: true}).click();
      downloads++;
      await p.waitForFunction(n => auditDownloads.length === n, downloads);
      const out = await p.evaluate(() => auditDownloads[auditDownloads.length - 1]);
      assert(out.backups.some(b => b.local?.data?.canary === allowed), 'own backup remains downloadable');
      assert(out.backups.every(b => Object.hasOwn(b, 'owner') && b.owner === owner && !b.quarantined), 'every exported backup belongs to the active owner');
      const text = JSON.stringify(out);
      forbidden.forEach(canary => assert.equal(text.includes(canary), false, 'other-owner or ambiguous backup excluded: ' + canary));
    }
    await p.getByRole('button', {name: '账号 · 云同步', exact: true}).click();
    await exported(null, 'ANONYMOUS_ONLY', ['ALPHA_ONLY', 'BETA_ONLY', 'QUARANTINED_OLD_ALPHA', 'UNTAGGED_LEGACY']);
    await p.getByRole('button', {name: '关闭', exact: true}).click();
    await login(p, 'backup_alpha');
    await p.waitForFunction(() => document.querySelector('.learning-cloud-state').textContent === '已同步');
    await exported('backup_alpha', 'ALPHA_ONLY', ['ANONYMOUS_ONLY', 'BETA_ONLY', 'QUARANTINED_OLD_ALPHA', 'UNTAGGED_LEGACY']);
    await p.getByRole('button', {name: '退出账号', exact: true}).click();
    await p.waitForFunction(() => engine.getState().user === null);
    await p.getByLabel('用户名', {exact: true}).fill('backup_beta');
    await p.getByLabel('密码', {exact: true}).fill(testPassword);
    await p.locator('form button[type=submit]').click();
    await p.waitForFunction(() => engine.getState().user?.id === 'backup_beta');
    await p.waitForFunction(() => document.querySelector('.learning-cloud-state').textContent === '已同步');
    await p.evaluate(() => { study.canary = 'RAW_STALE_ALPHA_CURRENT'; rawExtras = {canary: 'RAW_STALE_ALPHA_EXTRAS'}; });
    await exported('backup_beta', 'BETA_ONLY', ['ANONYMOUS_ONLY', 'ALPHA_ONLY', 'QUARANTINED_OLD_ALPHA', 'UNTAGGED_LEGACY', 'RAW_STALE_ALPHA_CURRENT', 'RAW_STALE_ALPHA_EXTRAS']);
    await p.evaluate(() => { delete study.canary; rawExtras = {}; });
    await p.getByRole('button', {name: '退出账号', exact: true}).click();
    await p.waitForFunction(() => engine.getState().user === null);
    await exported(null, 'ANONYMOUS_ONLY', ['ALPHA_ONLY', 'BETA_ONLY', 'QUARANTINED_OLD_ALPHA', 'UNTAGGED_LEGACY']);
    assert.equal(await p.evaluate(prefix => localStorage.getItem(prefix + 'legacy') !== null && localStorage.getItem(prefix + 'malformed') !== null && localStorage.getItem(prefix + 'quarantine') !== null, prefix), true, 'excluded historical backups are preserved locally');
    await p.context().close();
    console.log('Chromium backup export isolation PASSED: anonymous, account A and account B receive only their own backups; legacy, malformed and quarantined backups remain stored and are excluded.');
  }
  if (process.argv.includes('--backup-only')) {
    await backupIsolation();
    assert.deepEqual(pageErrors, [], 'no uncaught browser exceptions');
    await browser.close();
    return;
  }
  const a = await device({ count: 4 });
  await login(a, "alice");
  await a.waitForFunction(() => !!engine.getState().conflict);
  assert.equal(cloud.has("alice"), false, "first login never silently uploads");
  await a
    .getByRole("button", { name: "使用本机记录（上传）", exact: true })
    .click();
  await a.waitForFunction(() => !engine.getState().conflict);
  assert.equal(cloud.get("alice").data.count, 4);
  const b = await device();
  await login(b, "alice");
  await b.waitForFunction(() => study.count === 4);
  await b.evaluate(() => {
    study.count = 5;
    saved();
  });
  await b.waitForTimeout(2200);
  assert.equal(cloud.get("alice").data.count, 5);
  await a.evaluate(() => {
    study.count = 6;
    saved();
  });
  await a.waitForTimeout(2200);
  assert.equal(await a.evaluate(() => !!engine.getState().conflict), true);
  assert.equal(
    cloud.get("alice").data.count,
    5,
    "stale device never overwrites newer revision",
  );
  await a
    .getByRole("button", { name: "使用云端记录（下载）", exact: true })
    .click();
  await a.waitForFunction(() => study.count === 5);
  await a.context().setOffline(true);
  await a.evaluate(() => {
    study.count = 7;
    saved();
  });
  await a.waitForTimeout(2200);
  assert.equal(cloud.get("alice").data.count, 5);
  await a.context().setOffline(false);
  await a.evaluate(() => dispatchEvent(new Event("online")));
  await a.waitForFunction(() => document.body.innerText.includes("已同步"));
  assert.equal(
    cloud.get("alice").data.count,
    7,
    "offline saved record uploads after online",
  );
  requestDelay = 800;
  const putStarted = new Promise((resolve) => {
    onPut = resolve;
  });
  await a.evaluate(() => {
    study.count = 8;
    saved();
  });
  await Promise.race([
    putStarted,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("PUT did not begin during mutation regression")),
        8000,
      ),
    ),
  ]);
  await a.evaluate(() => {
    study.count = 9;
    saved();
  });
  for (let n = 0; n < 50 && cloud.get("alice").data.count !== 9; n++)
    await a.waitForTimeout(200);
  requestDelay = 0;
  assert.equal(
    cloud.get("alice").data.count,
    9,
    "edit during PUT is retained and retried",
  );
  await a.waitForFunction(
    () =>
      document.querySelector(".learning-cloud-state").textContent === "已同步",
  );
  await a.getByRole("button", { name: "退出账号", exact: true }).click();
  await a.waitForFunction(() => engine.getState().user === null);
  assert.equal(
    await a.evaluate(() => study.count),
    4,
    "logout restores original anonymous copy",
  );
  await a.getByLabel("用户名", { exact: true }).fill("bob");
  await a.getByLabel("密码", { exact: true }).fill(testPassword);
  await a.locator("form button[type=submit]").click();
  await a.waitForFunction(() => engine.getState().user?.id === "bob");
  assert.equal(
    await a.evaluate(() => study.count),
    4,
    "bob receives only explicitly offered anonymous copy, not alice count7",
  );
  assert.equal(
    cloud.has("bob"),
    false,
    "new user never silently inherits upload",
  );
  await a.evaluate(() =>
    localStorage.setItem("audit-study", JSON.stringify({ count: 99 })),
  );
  await a.reload();
  await a.waitForFunction(() => engine.getState().user?.id === "bob");
  assert.equal(
    await a.evaluate(() => study.count),
    4,
    "stale tab raw write never relabeled to bob",
  );
  assert.equal(cloud.has("bob"), false);
  await a.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
  await a.reload();
  await a.waitForTimeout(200);
  await login(a, "delta");
  assert.equal(
    await a.evaluate(() => study.count),
    0,
    "expired old-owner session cannot migrate its records into a new account",
  );
  assert.equal(cloud.has("delta"), false);
  const c = await device({ count: 12 });
  await c.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k.includes("-backup-"))
        throw new DOMException("Quota", "QuotaExceededError");
      return original.call(this, k, v);
    };
  });
  await c.getByRole("button", { name: "账号 · 云同步", exact: true }).click();
  await c.getByLabel("用户名", { exact: true }).fill("charlie");
  await c.getByLabel("密码", { exact: true }).fill(testPassword);
  await c.locator("form button[type=submit]").click();
  await c.waitForTimeout(500);
  assert.equal(
    await c.evaluate(() => study.count),
    12,
    "quota failure retains old record",
  );
  assert.equal(cloud.has("charlie"), false, "quota failure never uploads");
  const d = await device();
  await d.getByRole("button", { name: "账号 · 云同步", exact: true }).click();
  assert.equal(await d.locator('.learning-cloud-entry').innerText(), '', 'header contains only an icon');
  assert.equal(await d.locator('.learning-cloud-entry svg').count(), 1);
  assert.equal(await d.locator('.learning-cloud-entry .learning-cloud-state').count(), 0);
  await d.getByRole('tab', {name: '注册', exact: true}).click();
  await d.getByLabel("用户名", { exact: true }).fill("echo");
  assert.equal(
    await d.getByLabel("密码", { exact: true }).isVisible(),
    true,
  );
  for (const [value, valid] of [['abc12',false], ['abcdef',true], ['123456',true], ['ab@123',false]]) {
    await d.getByLabel('密码', {exact:true}).fill(value);
    assert.equal(await d.locator('form').evaluate(f => f.checkValidity()), valid, 'new password rule: ' + value);
  }
  await d.getByLabel('密码', {exact:true}).fill(newPassword);
  await d.getByRole('button', {name:'显示密码',exact:true}).click();
  assert.equal(await d.getByLabel('密码',{exact:true}).getAttribute('type'),'text');
  await d.getByRole('button', {name:'隐藏密码',exact:true}).click();
  assert.equal(await d.getByLabel('密码',{exact:true}).getAttribute('type'),'password');
  await d.locator("form button[type=submit]").click();
  await d.waitForFunction(() => engine.getState().user?.id === "echo");
  assert.ok((await d.locator("dialog").innerText()).includes("c".repeat(48)));
  const stored = await d.evaluate(() =>
    JSON.stringify(
      Object.keys(localStorage).map((k) => localStorage.getItem(k)),
    ),
  );
  assert.equal(
    stored.includes(newPassword),
    false,
    "password never persisted",
  );
  assert.equal(
    stored.includes("c".repeat(48)),
    false,
    "recovery code never persisted",
  );
  await d
    .getByRole("button", { name: "我已保存恢复码", exact: true })
    .click();
  await d.waitForFunction(
    () =>
      document.querySelector(".learning-cloud-state").textContent === "已同步",
  );
  await d.getByRole("button", { name: "退出账号", exact: true }).click();
  await d.waitForFunction(() => engine.getState().user === null);
  await d.getByRole("button", {name: "忘记密码？", exact: true}).click();
  await d.getByLabel("用户名", { exact: true }).fill("echo");
  await d.getByLabel("恢复码", { exact: true }).fill("c".repeat(48));
  assert.equal(
    await d.getByLabel("密码", { exact: true }).isVisible(),
    true,
  );
  await d.getByLabel("密码", { exact: true }).fill(newPassword);
  await d.locator("form button[type=submit]").click();
  await d.waitForFunction(() => engine.getState().user?.id === "echo");
  await d
    .getByRole("button", { name: "我已保存恢复码", exact: true })
    .click();
  await backupIsolation();
  assert.deepEqual(pageErrors, [], "no uncaught browser exceptions");
  console.log(
    "Chromium client regression PASSED: first-login choice, two devices, conflict, offline retry, account isolation, stale-tab canonical restore, in-flight mutation, backup quota fail-closed. Mock API; real shared engine.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
