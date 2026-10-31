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
  let requestDelay = 0,
    onPut;
  const pageErrors = [];
  async function device(seed = { count: 0 }) {
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
            ');window.engine=LearningCloud.start({app:"english",label:"测试",mount:document.getElementById("mount"),getData:()=>study,setData:d=>{study=d;localStorage.setItem("audit-study",JSON.stringify(d))},defaults:()=>({count:0}),isEmpty:d=>d.count===0,subscribe:fn=>{window.saved=()=>{localStorage.setItem("audit-study",JSON.stringify(study));fn()}}});</script></body></html>',
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
        if (url.pathname === "/api/auth/login") out = { user: active };
        else {
          assert.equal(
            Object.hasOwn(data, "password"),
            false,
            "registration/recovery never sends custom password",
          );
          out = {
            user: active,
            loginCode: "b".repeat(48),
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
    await page.getByLabel("登录码", { exact: true }).fill("a".repeat(48));
    await page.getByRole("button", { name: "继续", exact: true }).click();
    await page.waitForFunction(() => engine.getState().user !== null);
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
  await putStarted;
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
  await a.getByRole("button", { name: "退出账号", exact: true }).click();
  await a.waitForFunction(() => engine.getState().user === null);
  assert.equal(
    await a.evaluate(() => study.count),
    4,
    "logout restores original anonymous copy",
  );
  await a.getByLabel("用户名", { exact: true }).fill("bob");
  await a.getByLabel("登录码", { exact: true }).fill("a".repeat(48));
  await a.getByRole("button", { name: "继续", exact: true }).click();
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
  await c.getByLabel("登录码", { exact: true }).fill("a".repeat(48));
  await c.getByRole("button", { name: "继续", exact: true }).click();
  await c.waitForTimeout(500);
  assert.equal(
    await c.evaluate(() => study.count),
    12,
    "quota failure retains old record",
  );
  assert.equal(cloud.has("charlie"), false, "quota failure never uploads");
  const d = await device();
  await d.getByRole("button", { name: "账号 · 云同步", exact: true }).click();
  await d.getByLabel("账号操作").selectOption("register");
  await d.getByLabel("用户名", { exact: true }).fill("echo");
  assert.equal(
    await d.getByLabel("登录码", { exact: true }).isVisible(),
    false,
  );
  await d.getByRole("button", { name: "继续", exact: true }).click();
  await d.waitForFunction(() => engine.getState().user?.id === "echo");
  assert.ok((await d.locator("dialog").innerText()).includes("b".repeat(48)));
  assert.ok((await d.locator("dialog").innerText()).includes("c".repeat(48)));
  const stored = await d.evaluate(() =>
    JSON.stringify(
      Object.keys(localStorage).map((k) => localStorage.getItem(k)),
    ),
  );
  assert.equal(
    stored.includes("b".repeat(48)),
    false,
    "login code never persisted",
  );
  assert.equal(
    stored.includes("c".repeat(48)),
    false,
    "recovery code never persisted",
  );
  await d
    .getByRole("button", { name: "我已保存登录码与恢复码", exact: true })
    .click();
  assert.deepEqual(pageErrors, [], "no uncaught browser exceptions");
  console.log(
    "Chromium client regression PASSED: first-login choice, two devices, conflict, offline retry, account isolation, stale-tab canonical restore, in-flight mutation, backup quota fail-closed. Mock API; real shared engine.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
