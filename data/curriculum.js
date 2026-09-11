/* ============================================================
 * data/curriculum.js — 语法填空 · 大专题课程体系（上海命题风格，初高中通用）
 * 结构：大专题(BIG TOPIC) → 知识点/子专题 → 年级×阶段×难度
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
    { id: 'transform',  no: 'C3', name: '词性转换',      icon: '🔧', color: '#f39c12',
      desc: 'adj↔adv、比较最高级、名词单复数/后缀、否定前缀。看空格修饰谁、做什么成分。',
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
      desc: '固定搭配 + 语义选择。高一以固定搭配为主，越往后越靠上下文逻辑。',
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

  /* ---------- 年级 × 阶段 ----------
   * 每阶段下挂知识点（subTopics）。知识点可能是：已建 bank 的专题 / AI 可生成 / 规划中。
   * lock:true = 该知识点暂未内置题库（可由 AI 出题 或 后续阶段补齐）。
   */
  var GRADES = [
    {
      grade: '高一', key: 'g1', desc: '初高中过渡 + 基础建立',
      stages: [
        { stage: 1, name: '基础建立', desc: '基础时态·被动·主谓一致·to do/doing/done·词性·基础从句虚词',
          topics: [
            { key: 'verb_tense_basic', name: '时态基础（现在/过去/将来/进行/完成）', topicId: 'tense', available: true, note: '内置：01–07 等句子级基础训练' },
            { key: 'verb_passive_basic', name: '基础被动语态', topicId: '', available: false, note: '规划：13–18' },
            { key: 'verb_agreement', name: '主谓一致', topicId: '', available: false, note: '规划：49' },
            { key: 'nonfinite_basic', name: '非谓语入门：to do / doing / done', topicId: '', available: false, note: '规划：19–25' },
            { key: 'transform_basic', name: '基础词性：adj↔adv·名词单复数', topicId: '', available: false, note: '规划：27–32' },
            { key: 'clause_basic', name: '基础从句与虚词（which/who/when/冠词/介词/代词/并列）', topicId: '', available: false, note: '规划：33–48 基础层' }
          ] },
        { stage: 2, name: '核心结构', desc: '完成时深化·语境时态·非谓语与三大从句·what/that',
          topics: [
            { key: 'verb_tense_core', name: '语境时态与完成时', topicId: '', available: false, note: 'AI 可生成' },
            { key: 'nonfinite_core', name: '非谓语深入（having done / being done / to be done）', topicId: '', available: false, note: 'AI 可生成' },
            { key: 'clause_core', name: '三大从句与 what/that', topicId: '', available: false, note: 'AI 可生成' },
            { key: 'prep_semantic', name: '介词语义选择', topicId: '', available: false, note: 'AI 可生成' }
          ] },
        { stage: 3, name: '综合提升', desc: '长难句·从句嵌套·综合篇章',
          topics: [
            { key: 'g1_passage', name: '高一综合语篇 10 空', topicId: '', available: false, note: 'AI 可生成' }
          ] }
      ] },
    {
      grade: '高二', key: 'g2', desc: '真正进入高中语法综合训练',
      stages: [
        { stage: 1, name: '基础巩固（复习高一）', desc: '查漏补缺',
          topics: [{ key: 'g2_r1', name: '高一内容复习巩固', topicId: '', available: false, note: 'AI 可按薄弱点出题' }] },
        { stage: 2, name: '综合训练', desc: '说明文/科普/议论文，长句从句',
          topics: [
            { key: 'g2_verb', name: '谓语：时态语态综合 / 上下文时态', topicId: '', available: false, note: 'AI 可生成' },
            { key: 'g2_nonfinite', name: '非谓语：作定语/状语/宾语 + 完成被动式', topicId: '', available: false, note: 'AI 可生成' },
            { key: 'g2_clause', name: '三大从句综合 / what vs that / however 让步', topicId: '', available: false, note: 'AI 可生成' },
            { key: 'g2_word', name: '词性：比较级最高级·否定前缀', topicId: '', available: false, note: 'AI 可生成' }
          ] },
        { stage: 3, name: '高二综合语篇', desc: '10 空综合篇章',
          topics: [{ key: 'g2_passage', name: '高二综合语篇 10 空', topicId: '', available: false, note: 'AI 可生成' }] }
      ] },
    {
      grade: '高三', key: 'g3', desc: '完全综合训练（春考/秋考/一模/二模方向）',
      stages: [
        { stage: 1, name: '综合冲刺', desc: '全时态·复杂非谓语·从句嵌套·易混辨析',
          topics: [
            { key: 'g3_complex', name: '长难句与隐蔽考点综合', topicId: '', available: false, note: 'AI 可生成' },
            { key: 'g3_passage', name: '模考风格 10 空语篇', topicId: '', available: false, note: 'AI 可生成（可复用 20 题综合挑战做句子级热身）' }
          ] }
      ] }
  ];

  /* ---------- 现有 bank 专题 → 大专题 归类映射 ----------
   * 用于：能力总览（把题目正确率聚合到大专题）、AI 建议、错题归类。
   * 目前有真实题库的是 tense01–12 与 challenge；13–60 尚无内容，但按目标大专题预归类，
   * 后续建设题库时按此挂载。
   */
  var EXISTING = [
    /* tense01–12：谓语动词(时态)。高一阶段1可全部使用；阶段2复用为完成时/语境深化 */
    { no: '01', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '02', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '03', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '04', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '05', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '06', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '07', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '08', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '09', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '10', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '11', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '12', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '13', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '14', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '15', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '16', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '17', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '18', cat: 'verb', grades: ['g1', 'g2'] },
    { no: '19', cat: 'nonfinite', grades: ['g1', 'g2'] },
    { no: '20', cat: 'nonfinite', grades: ['g1', 'g2'] },
    { no: '21', cat: 'nonfinite', grades: ['g1', 'g2'] },
    { no: '22', cat: 'nonfinite', grades: ['g1', 'g2'] },
    { no: '23', cat: 'nonfinite', grades: ['g1', 'g2'] },
    { no: '24', cat: 'nonfinite', grades: ['g1', 'g2'] },
    { no: '25', cat: 'nonfinite', grades: ['g1', 'g2'] },
    { no: '26', cat: 'nonfinite', grades: ['g1', 'g2'] },
    { no: '27', cat: 'transform', grades: ['g1'] },
    { no: '28', cat: 'transform', grades: ['g1'] },
    { no: '29', cat: 'transform', grades: ['g1'] },
    { no: '30', cat: 'transform', grades: ['g1'] },
    { no: '31', cat: 'transform', grades: ['g1'] },
    { no: '32', cat: 'transform', grades: ['g1'] },
    { no: '33', cat: 'article', grades: ['g1'] },
    { no: '34', cat: 'article', grades: ['g1'] },
    { no: '35', cat: 'prep', grades: ['g1'] },
    { no: '36', cat: 'prep', grades: ['g1'] },
    { no: '37', cat: 'pronoun', grades: ['g1'] },
    { no: '38', cat: 'extra', grades: ['g2'] },
    { no: '39', cat: 'extra', grades: ['g1'] },
    { no: '40', cat: 'coord', grades: ['g1'] },
    { no: '41', cat: 'adverbial', grades: ['g1'] },
    { no: '42', cat: 'attrib', grades: ['g1'] },
    { no: '43', cat: 'nominal', grades: ['g1'] },
    { no: '44', cat: 'nominal', grades: ['g2'] },
    { no: '45', cat: 'nominal', grades: ['g2'] },
    { no: '46', cat: 'nominal', grades: ['g2'] },
    { no: '47', cat: 'nominal', grades: ['g2'] },
    { no: '48', cat: 'adverbial', grades: ['g2'] },
    { no: '49', cat: 'verb', grades: ['g2'] },
    { no: '50', cat: 'extra', grades: ['g2'] },
    { no: '51', cat: 'extra', grades: ['g2'] },
    { no: '52', cat: 'extra', grades: ['g2'] },
    { no: '53', cat: 'extra', grades: ['g2'] },
    { no: '54', cat: 'prep', grades: ['g2'] },
    { no: '55', cat: 'extra', grades: ['g2'] },
    { no: '56', cat: 'extra', grades: ['g2'] },
    { no: '57', cat: 'extra', grades: ['g2'] },
    { no: '58', cat: 'extra', grades: ['g2'] },
    { no: '59', cat: 'extra', grades: ['g3'] },
    { no: '60', cat: 'extra', grades: ['g3'] }
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
  function gradeDef(key) {
    for (var i = 0; i < GRADES.length; i++) if (GRADES[i].key === key) return GRADES[i];
    return null;
  }

  window.__EGL_CURRICULUM__ = {
    categories: CATEGORIES,
    grades: GRADES,
    existing: EXISTING,
    catOf: catOf,
    category: category,
    catByTopicNo: catByTopicNo,
    gradeDef: gradeDef
  };
})();
