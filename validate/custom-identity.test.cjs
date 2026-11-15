'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
function app() {
  const store = new Map();
  const sb = { console, Date, Math, JSON, localStorage: {
    getItem: k => store.get(k) || null,
    setItem: (k,v) => store.set(k,String(v)), removeItem: k => store.delete(k)
  }};
  sb.window=sb; vm.createContext(sb);
  const data=['roadmap.js','curriculum.js','method-course.js',...fs.readdirSync(path.join(root,'data')).filter(f=>/^bank-.*\.js$/.test(f)).sort()];
  for (const file of [...data.map(f=>'data/'+f),'src/core.js','src/cloud-data.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sb,{filename:file});
  return sb.EGL;
}
const plain = x => JSON.parse(JSON.stringify(x));
function mistake(E,q) { return E.addWrong({ source:'custom',qid:q.id,topicId:'custom:test',question:q.question,myAnswer:'wrong',correctAnswer:q.answerText,snapshot:E.snapshotQuestion(q) }); }

test('distinct custom mistakes keep original identities through backup and review',()=>{
  const E=app(), qs=E.customToQuestions(E.buildCustomPaper());
  assert.equal(qs.length,10); assert.equal(new Set(qs.map(q=>q.id)).size,10);
  assert.ok(qs.every(q=>typeof q.id==='string' && q.id));
  mistake(E,qs[0]); mistake(E,qs[1]);
  const before=qs.map(q=>q.id), backup=E.exportData();
  E.resetData(); assert.equal(E.importData(backup),true);
  assert.deepEqual(plain(E.customToQuestions().map(q=>q.id)),plain(before));
  assert.equal(E.data.wrongBook.length,2);
  for(const w of E.data.wrongBook) assert.equal(E.resolveWrongQuestion(w).id,w.qid);
  E.reviewWrong(qs[0].id,true,'answer');
  assert.equal(E.data.wrongBook.find(w=>w.qid===qs[0].id).stage,1); assert.equal(E.data.wrongBook.find(w=>w.qid===qs[1].id).stage,0);
});

test('legacy identity repair is stable across ordering, backups and repeated cloud apply',()=>{
  const E=app(), old=plain(E.buildCustomPaper());
  old.items.forEach(q=>delete q.id);
  const data=E.emptyData(); data.custom=old;
  data.wrongBook=[{id:'wb_undefined',source:'custom',times:3,notes:'keep my note',stage:2,dueAt:123456,mastered:false,snapshot:plain(old.items[0])}];
  assert.equal(E.importData(JSON.stringify(data)),true);
  const qs=E.customToQuestions(), ids=plain(qs.map(q=>q.id));
  assert.equal(new Set(ids).size,ids.length);
  const w=E.data.wrongBook[0]; assert.equal(w.qid,ids[0]); assert.equal(w.id,'wb_'+ids[0]);
  assert.equal(w.times,3); assert.equal(w.notes,'keep my note'); assert.equal(w.stage,2); assert.equal(w.dueAt,123456);
  assert.equal(E.resolveWrongQuestion(w).id,w.qid);
  const backup=E.exportData(); E.resetData(); assert.equal(E.importData(backup),true);
  assert.deepEqual(plain(E.customToQuestions().map(q=>q.id)),ids);
  const reordered={items:plain(old.items).reverse()};
  assert.deepEqual(plain(E.customToQuestions(reordered).map(q=>q.id)),ids.slice().reverse());
  const cloud=E.cloudData.read(); E.cloudData.apply(cloud); E.cloudData.apply(cloud);
  assert.deepEqual(plain(E.customToQuestions().map(q=>q.id)),ids);
  assert.equal(E.data.wrongBook[0].notes,'keep my note');
  assert.equal(E.data.wrongBook.length,1); // already-lost questions are not fabricated
});

test('existing identifiers are retained and old identical items deduplicate consistently',()=>{
  const E=app(); const q=plain(E.buildCustomPaper().items[0]); q.id='existing-question-id';
  assert.equal(E.customToQuestions({items:[q]})[0].id,'existing-question-id');
  delete q.id; const copy=plain(q);
  const ids=E.customToQuestions({items:[q,copy]}).map(x=>x.id);
  assert.equal(ids[0],ids[1]);
  mistake(E,E.customToQuestions({items:[q]})[0]); mistake(E,E.customToQuestions({items:[copy]})[0]);
  assert.equal(E.data.wrongBook.length,1); assert.equal(E.data.wrongBook[0].times,2);
});
