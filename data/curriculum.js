/* ============================================================
 * data/curriculum.js — 语法填空 · 大专题课程体系（上海命题风格，初高中通用）
 * 结构：大专题(BIG TOPIC) → 知识点/子专题
 * 同时提供：现有专题(bank) → 大专题 的归类映射（用于能力总览统计）
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 11 个大专题（§十七 推荐结构） ---------- */
  var CATEGORIES = [
    { id: 'verb',       no: 'C1', name: '谓语动词',      icon: '⏱️', color: '#5b8cff',
      desc: '时态·语态·主谓一致·语境时态。上海填空不给明显时间词时，靠上下文判断时态。',
      core: true },
    { id: 'nonfinite',  no: 'C2', name: '非谓语动词',    icon: '🔗', color: '#7c6bff',
      desc: 'to do / doing / done / 完成式 / 被动式。先找真正的谓语，再判断非谓语。',
      core: true },
    /* 上海卷有提示词不考词性转换：本大专题只收"形容词/副词比较级·最高级"。
       id 仍用 'transform'，兼容历史统计与已保存的 AI 配置；对外名称已改为上海口径。 */
    { id: 'transform',  no: 'C3', name: '形容词/副词比较等级', icon: '📈', color: '#f39c12',
      desc: '只考比较级、最高级：看到 than → 比较级；看到 the / in,of + 范围 → 最高级。上海不考词性转换（adj↔adv、名词派生都不出现）。',
      core: true },
    { id: 'attrib',     no: 'C4', name: '定语从句',      icon: '🧩', color: '#16a085',
      desc: 'who/whom/which/that/whose/where/when/why。核心：从句内部缺不缺成分。',
      core: true },
    { id: 'nominal',    no: 'C5', name: '名词性从句',    icon: '🗂️', color: '#e84393',
      desc: 'what/that/whether/how 等。核心辨析：what+不完整从句 / that+完整从句。',
      core: true },
    { id: 'adverbial',  no: 'C6', name: '状语从句',      icon: '🛣️', color: '#0984e3',
      desc: 'when/if/unless/although/because/so that… 及 however+adj/adv+主谓 让步难点。',
      core: true },
    { id: 'prep',       no: 'C7', name: '介词',          icon: '🧭', color: '#d63031',
      desc: '固定搭配 + 语义选择。起步阶段以固定搭配为主，越往后越靠上下文逻辑。',
      core: true },
    { id: 'article',    no: 'C8', name: '冠词',          icon: '🏷️', color: '#00b894',
      desc: 'a/an/the/零冠词。泛指/特指/首次出现/再次出现/抽象名词具体化；a/an 看发音。',
      core: true },
    { id: 'pronoun',    no: 'C9', name: '代词',          icon: '♻️', color: '#6a89cc',
      desc: '人称/物主/反身/不定代词、one/other/another 系列。重在语篇指代。',
      core: true },
    { id: 'coord',      no: 'C10', name: '并列与逻辑',   icon: '🔀', color: '#e07b39',
      desc: 'and/but/or/so/yet/while。考上下文逻辑：并列/转折/选择/因果。',
      core: true },
    { id: 'extra',      no: 'C11', name: '其他 / 拓展',   icon: '🧰', color: '#8e44ad',
      desc: '情态动词、助动词、倒装、强调、固定搭配等低频点；不挤占高频专题。',
      core: false }
  ];

  /* ---------- 现有 bank 专题 → 大专题 归类映射 ----------
   * 用于：能力总览（把题目正确率聚合到大专题）、AI 建议、错题归类。
   * 目前有真实题库的是 tense01–12 与 challenge；13–60 尚无内容，但按目标大专题预归类，
   * 后续建设题库时按此挂载。
   */
  var EXISTING = [
    /* tense01–12：谓语动词(时态)，初高中通用 */
    { no: '01', cat: 'verb' },
    { no: '02', cat: 'verb' },
    { no: '03', cat: 'verb' },
    { no: '04', cat: 'verb' },
    { no: '05', cat: 'verb' },
    { no: '06', cat: 'verb' },
    { no: '07', cat: 'verb' },
    { no: '08', cat: 'verb' },
    { no: '09', cat: 'verb' },
    { no: '10', cat: 'verb' },
    { no: '11', cat: 'verb' },
    { no: '12', cat: 'verb' },
    { no: '13', cat: 'verb' },
    { no: '14', cat: 'verb' },
    { no: '15', cat: 'verb' },
    { no: '16', cat: 'verb' },
    { no: '17', cat: 'verb' },
    { no: '18', cat: 'verb' },
    { no: '19', cat: 'nonfinite' },
    { no: '20', cat: 'nonfinite' },
    { no: '21', cat: 'nonfinite' },
    { no: '22', cat: 'nonfinite' },
    { no: '23', cat: 'nonfinite' },
    { no: '24', cat: 'nonfinite' },
    { no: '25', cat: 'nonfinite' },
    { no: '26', cat: 'nonfinite' },
    { no: '27', cat: 'transform' },
    { no: '28', cat: 'transform' },
    { no: '29', cat: 'transform' },
    { no: '30', cat: 'transform' },
    { no: '31', cat: 'transform' },
    { no: '32', cat: 'transform' },
    { no: '33', cat: 'article' },
    { no: '34', cat: 'article' },
    { no: '35', cat: 'prep' },
    { no: '36', cat: 'prep' },
    { no: '37', cat: 'pronoun' },
    { no: '38', cat: 'extra' },
    { no: '39', cat: 'extra' },
    { no: '40', cat: 'coord' },
    { no: '41', cat: 'adverbial' },
    { no: '42', cat: 'attrib' },
    { no: '43', cat: 'nominal' },
    { no: '44', cat: 'nominal' },
    { no: '45', cat: 'nominal' },
    { no: '46', cat: 'nominal' },
    { no: '47', cat: 'nominal' },
    { no: '48', cat: 'adverbial' },
    { no: '49', cat: 'verb' },
    { no: '50', cat: 'extra' },
    { no: '51', cat: 'extra' },
    { no: '52', cat: 'extra' },
    { no: '53', cat: 'extra' },
    { no: '54', cat: 'prep' },
    { no: '55', cat: 'extra' },
    { no: '56', cat: 'extra' },
    { no: '57', cat: 'extra' },
    { no: '58', cat: 'extra' },
    { no: '59', cat: 'extra' },
    { no: '60', cat: 'extra' }
  ];

  function catOf(noStr) {
    for (var i = 0; i < EXISTING.length; i++) if (EXISTING[i].no === noStr) return EXISTING[i];
    return null;
  }
  function category(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
    return null;
  }
  function catByTopicNo(noStr) {
    var e = catOf(noStr);
    return e ? e.cat : null;
  }
  window.__EGL_CURRICULUM__ = {
    categories: CATEGORIES,
    existing: EXISTING,
    catOf: catOf,
    category: category,
    catByTopicNo: catByTopicNo
  };
})();
