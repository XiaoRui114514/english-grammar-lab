const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

test('草稿跨刷新恢复、最终答案判分和完整备份',async t=>{
 const html=fs.readFileSync(path.join(__dirname,'../English-Grammar-Lab.html'));
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
 t.after(async()=>{await browser.close();await new Promise(r=>server.close(r));});
 const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(()=>{let qs=EGL.paperToQuestions(EGL.paperById('paper01')).slice(0,2);EGL.quiz.startAI(qs,{title:'恢复回归'});});
 const values=await page.evaluate(()=>EGL.quiz.readDraft().session.questions.map(q=>q.accepted[0]));
 await page.locator('.sq-card input[type=text]').nth(0).fill('unfinished answer');
 await page.reload();await page.getByText('继续上次练习',{exact:true}).click();
 assert.equal(await page.locator('.sq-card input[type=text]').nth(0).inputValue(),'unfinished answer');
 await page.locator('.sq-card input[type=text]').nth(0).fill(values[0]);
 await page.locator('.sq-card input[type=text]').nth(1).fill(values[1]);
 await page.locator('#sheetSubmit').click();
 assert.equal(await page.evaluate(()=>EGL.data.global.correct),2);
 assert.equal(await page.evaluate(()=>EGL.quiz.readDraft()),null);
 const checks=await page.evaluate(()=>{
  localStorage.setItem('EGL_AI_POOL_v1','[]');localStorage.setItem('EGL_UI_PREFS_v1','{"font":"large"}');
  localStorage.setItem('EGL_AI_CFG_v1','{"providerId":"custom","apiKey":"do-not-export"}');
  const backup=EGL.exportData();localStorage.removeItem('EGL_AI_POOL_v1');
  const restored=EGL.importData(backup);
  localStorage.setItem('EGL_STRICT_ANSWER_v1','true');
  const strict=EGL.util.checkInputAnswer('cannot',["can not"]);
  localStorage.setItem('EGL_STRICT_ANSWER_v1','false');
  const loose=EGL.util.checkInputAnswer('cannot',["can not"]);
  return {restored,pool:localStorage.getItem('EGL_AI_POOL_v1'),leaked:backup.includes('do-not-export'),strict,loose};
 });
 assert.deepEqual(checks,{restored:true,pool:'[]',leaked:false,strict:false,loose:true});
 assert.deepEqual(errors,[]);
});
