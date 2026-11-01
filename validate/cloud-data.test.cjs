'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function app(initial) {
  const store = new Map(Object.entries(initial || {}));
  const context = vm.createContext({ Date, JSON, console, localStorage: {
    getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)
  }});
  context.window = context;
  ['core.js', 'cloud-data.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', f), 'utf8'), context));
  return { E: context.EGL, store };
}
const plain = v => JSON.parse(JSON.stringify(v));
test('legacy local data migrates without removing original storage or importing local-only keys', () => {
  const old = { version: 1, global: { answered: 12, correct: 8 }, wrongBook: [] };
  const { E, store } = app({ EGL_LAB_DATA_v1: JSON.stringify(old), EGL_AI_KEY_v1: 'synthetic-private-key', EGL_AI_KEYS_v2: '{"provider":"synthetic-multi-key"}', EGL_QUIZ_DRAFT_v1: '{"draft":"local-only"}' });
  const out = E.cloudData.read();
  assert.equal(out.version, 3); assert.equal(out.global.answered, 12);
  assert.equal(store.get('EGL_LAB_DATA_v1'), JSON.stringify(old));
  assert.ok(!JSON.stringify(out).includes('synthetic')); assert.ok(!JSON.stringify(out).includes('local-only'));
});
test('deep explicit whitelist drops arbitrary private fields in imported data', () => {
  const { E } = app();
  E.data.password = 'synthetic-root'; E.data.global.apiKey = 'synthetic-global';
  E.data.topics.tense01 = { attempts: 1, correct: 0, secret: 'synthetic-topic' };
  E.data.wrongBook.push({ qid: 'test', notes: '学习笔记', token: 'synthetic-wrong', snapshot: { question: 'Synthetic ___', accepted: ['answer'], apiKey: 'synthetic-question', explanation: { why: '原因', password: 'synthetic-explanation' } } });
  E.data.custom = { id: 'test-paper', items: [{ question: '___', accepted: ['yes'], apiKey: 'synthetic-custom' }], apiKey: 'synthetic-paper', dist: { verb: 1 } };
  const out = plain(E.cloudData.read());
  assert.ok(!JSON.stringify(out).includes('synthetic-'));
  assert.equal(out.wrongBook[0].notes, '学习笔记');
  assert.equal(out.wrongBook[0].snapshot.explanation.why, '原因');
  assert.equal(out.custom.items[0].accepted[0], 'yes');
});
test('cloud apply preserves device keys and local-only data', () => {
  const { E, store } = app({ EGL_AI_KEY_v1: 'synthetic-key', EGL_AI_POOL_v1: '[]', EGL_QUIZ_DRAFT_v1: '{"draft":1}' });
  const next = E.emptyData(); next.global.answered = 21; next.global.correct = 17;
  E.cloudData.apply(next);
  assert.equal(E.data.global.answered, 21);
  assert.equal(store.get('EGL_AI_KEY_v1'), 'synthetic-key');
  assert.equal(store.get('EGL_AI_POOL_v1'), '[]');
  assert.equal(store.get('EGL_QUIZ_DRAFT_v1'), '{"draft":1}');
});
test('cloud roundtrip preserves counts, wrong notes, custom and review schedule without accumulating', () => {
  const { E } = app();
  E.data.global = { answered: 30, correct: 22 }; E.data.goal = 18;
  E.data.wrongBook = [{ qid: 'test', topicId: 'tense01', times: 3, notes: '时态', stage: 2, dueAt: 123456, mastered: false, snapshot: null }];
  E.data.custom = { id: 'paper', ts: 1, date: '2026-01-01', items: [{ type: 'input', question: '___', accepted: ['went'] }], dist: { verb: 1 } };
  const payload = E.cloudData.read(); E.cloudData.apply(payload); E.cloudData.apply(payload);
  assert.equal(E.data.global.answered, 30); assert.equal(E.data.wrongBook[0].times, 3);
  assert.equal(E.data.wrongBook[0].dueAt, 123456); assert.equal(E.data.wrongBook[0].notes, '时态');
  assert.equal(E.data.custom.items[0].accepted[0], 'went');
});
test('preferences and partial historic statistics are not mistaken for an empty browser', () => {
  const { E } = app(); assert.equal(E.cloudData.empty(E.cloudData.read()), true);
  E.data.goal = 20; assert.equal(E.cloudData.empty(E.cloudData.read()), false);
  E.data.goal = 12; E.data.daily['2026-01-01'] = { answered: 1, correct: 1 };
  assert.equal(E.cloudData.empty(E.cloudData.read()), false);
});
test('cloud rejects malformed root and unsupported versions', () => {
  const { E } = app(); [null, [], {}, { version: 99, global: {} }].forEach(x => assert.throws(() => E.cloudData.project(x)));
});
