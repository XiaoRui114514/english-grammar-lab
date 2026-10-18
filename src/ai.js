/* ============================================================
 * src/ai.js — AI 出题子系统（多模型商 · OpenAI 兼容协议）
 * 职责分区：
 *   A. 模型商 / Base URL / API Key / 模型选择（本机保存）
 *   B. 动态 Prompt 生成（buildPrompt）
 *   C. OpenAI 兼容协议调用（/chat/completions + /models）
 *   D. JSON 容错与 schema 校验
 *   E. AI 题目 → 现有题库结构 转换器（语篇+逐空）
 * 规则：AI 只出题数据，不生成页面代码；失败不破坏原题库。
 * ============================================================ */
(function () {
  'use strict';
  var E = window.EGL, U = E.u;
  var $ = U.$, $$ = U.$$, el = U.el, esc = U.esc;

  // 所有预设都走 OpenAI 兼容协议：GET /models 取列表，POST /chat/completions 生成。
  var PROVIDERS = [
    { id: 'deepseek', name: 'DeepSeek（默认）', shortName: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat',
      keyLabel: 'DeepSeek API Key', keyPlaceholder: 'sk-…',
      keyUrl: 'https://platform.deepseek.com/api_keys',
      note: '官方接口。' },
    { id: 'teamorouter', name: 'TeamoRouter（OpenAI 兼容）', shortName: 'TeamoRouter',
      baseUrl: 'https://api.teamorouter.cn/v1', defaultModel: 'deepseek-v4-flash',
      keyLabel: 'TeamoRouter API Key', keyPlaceholder: 'sk-teamo-…',
      keyUrl: '', reasoningEffort: 'low',
      note: '已内置低推理加速；deepseek-v4-flash 长文生成可能需要 1–2 分钟。' },
    { id: 'openai', name: 'OpenAI', shortName: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1', defaultModel: '',
      keyLabel: 'OpenAI API Key', keyPlaceholder: 'sk-…',
      keyUrl: 'https://platform.openai.com/api-keys',
      note: '需模型商允许浏览器跨域请求。' },
    { id: 'dashscope', name: '通义千问（阿里云百炼）', shortName: '通义千问',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: '',
      keyLabel: 'DashScope API Key', keyPlaceholder: 'sk-…',
      keyUrl: 'https://bailian.console.aliyun.com/',
      note: '使用百炼的 OpenAI 兼容地址。' },
    { id: 'siliconflow', name: '硅基流动 SiliconFlow', shortName: '硅基流动',
      baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: '',
      keyLabel: 'SiliconFlow API Key', keyPlaceholder: 'sk-…',
      keyUrl: 'https://cloud.siliconflow.cn/account/ak',
      note: '聚合多家开源模型。' },
    { id: 'moonshot', name: '月之暗面 Kimi', shortName: 'Kimi',
      baseUrl: 'https://api.moonshot.cn/v1', defaultModel: '',
      keyLabel: 'Moonshot API Key', keyPlaceholder: 'sk-…',
      keyUrl: 'https://platform.moonshot.cn/console/api-keys',
      note: 'Kimi 官方接口。' },
    { id: 'zhipu', name: '智谱 AI（BigModel）', shortName: '智谱 AI',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: '',
      keyLabel: '智谱 API Key', keyPlaceholder: '…',
      keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      note: 'BigModel OpenAI 兼容接口。' },
    { id: 'openrouter', name: 'OpenRouter', shortName: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1', defaultModel: '',
      keyLabel: 'OpenRouter API Key', keyPlaceholder: 'sk-or-…',
      keyUrl: 'https://openrouter.ai/settings/keys',
      note: '一个 Key 可调用多家模型。' },
    { id: 'custom', name: '自定义（OpenAI 兼容）', shortName: '自定义',
      baseUrl: '', defaultModel: '',
      keyLabel: 'API Key', keyPlaceholder: '输入模型商提供的 Key',
      keyUrl: '',
      note: '填写任意兼容 OpenAI 协议的 Base URL，例如公司网关、本地代理或其他模型商。' }
  ];

  function providerById(id) {
    var want = id || PROVIDERS[0].id;
    for (var i = 0; i < PROVIDERS.length; i++) if (PROVIDERS[i].id === want) return PROVIDERS[i];
    return null;
  }
  function providerIdOf(cfg) {
    var p = providerById(cfg && cfg.providerId);
    return p ? p.id : PROVIDERS[0].id;
  }
  function stripTrailingSlashes(u) {
    var b = String(u || '').trim();
    while (b && b.charAt(b.length - 1) === '/') b = b.slice(0, -1);
    return b;
  }
  function hasEnd(b, suffix) {
    return b.length >= suffix.length && b.slice(-suffix.length).toLowerCase() === suffix.toLowerCase();
  }
  function removeEnd(b, suffix) {
    return hasEnd(b, suffix) ? b.slice(0, b.length - suffix.length) : b;
  }
  function cleanBaseUrl(u) { return stripTrailingSlashes(u); }
  function baseUrlOf(cfg) {
    var p = providerById(providerIdOf(cfg));
    var raw = (cfg && cfg.baseUrl) || (p && p.baseUrl) || '';
    return cleanBaseUrl(raw);
  }
  function modelsUrlOf(cfg) {
    var b = baseUrlOf(cfg);
    if (!b) return '';
    if (hasEnd(b, '/models')) return b;
    b = stripTrailingSlashes(removeEnd(b, '/chat/completions'));
    return b + '/models';
  }
  function chatUrlOf(cfg) {
    var b = baseUrlOf(cfg);
    if (!b) return '';
    if (hasEnd(b, '/chat/completions')) return b;
    if (hasEnd(b, '/models')) b = removeEnd(b, '/models');
    b = stripTrailingSlashes(b);
    return b + '/chat/completions';
  }
  var API_URL = chatUrlOf({ providerId: PROVIDERS[0].id }); // 兼容旧调用方
  // 真实 model id：优先用户选择的模型；旧版本配置按模型标签兼容迁移；DeepSeek 默认 deepseek-chat。
  function modelIdOf(cfg) {
    var want = cfg && cfg.modelId;
    if (want && String(want).trim()) return String(want).trim();
    var old = String((cfg && cfg.modelUi) || '').toLowerCase();
    if (old.indexOf('pro') >= 0 || old.indexOf('v4-pro') >= 0) return 'deepseek-v4-pro';
    if (old.indexOf('flash') >= 0 || old.indexOf('v4-flash') >= 0) return 'deepseek-flash';
    var p = providerById(providerIdOf(cfg));
    return (p && p.defaultModel) || '';
  }

  var KEY_LS = 'EGL_AI_KEY_v1';       // 旧版 DeepSeek Key：继续兼容
  var KEYS_LS = 'EGL_AI_KEYS_v2';     // 多模型商：{ providerId: key }
  var LAST_SESSION_LS = 'EGL_AI_LAST_v1'; // 结果缓存：sessionStorage 优先
  var _activeCtrl = null;             // 当前进行中的请求控制器（支持“停止生成”）

  function readKeyMap() {
    try {
      var raw = localStorage.getItem(KEYS_LS);
      var o = raw ? JSON.parse(raw) : null;
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function writeKeyMap(o) {
    try { localStorage.setItem(KEYS_LS, JSON.stringify(o || {})); } catch (e) {}
  }
  function getKey(providerId) {
    var pid = (providerId && providerById(providerId)) ? providerId : PROVIDERS[0].id;
    var map = readKeyMap();
    if (map[pid]) return String(map[pid]);
    if (pid === PROVIDERS[0].id) {
      try { return localStorage.getItem(KEY_LS) || ''; } catch (e) { return ''; }
    }
    return '';
  }
  function saveKey(k, remember, providerId) {
    var pid = (providerId && providerById(providerId)) ? providerId : PROVIDERS[0].id;
    var val = String(k || '');
    var map = readKeyMap();
    if (remember && val) map[pid] = val;
    else delete map[pid];
    writeKeyMap(map);
    if (pid === PROVIDERS[0].id) {
      try {
        if (remember && val) localStorage.setItem(KEY_LS, val);
        else localStorage.removeItem(KEY_LS);
      } catch (e) {}
    }
  }
  function clearKey(providerId) { saveKey('', false, providerId); }

  function cacheSession(obj) {
    try { sessionStorage.setItem(LAST_SESSION_LS, JSON.stringify(obj)); } catch (e) {}
  }
  function readCachedSession() {
    try { var r = sessionStorage.getItem(LAST_SESSION_LS); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function clearCachedSession() { try { sessionStorage.removeItem(LAST_SESSION_LS); } catch (e) {} }

  /* ---------- AI 生成记录池（持久保存，未做完也可继续；可删除/清空） ---------- */
  var POOL_LS = 'EGL_AI_POOL_v1';
  var POOL_MAX = 20;               // 最多保留条数
  var POOL_BYTES = 1200000;        // 单文件总容量上限约 1.2MB（留出 localStorage 余量）
  function poolKey() { return POOL_LS; }
  function getPool() {
    try {
      var r = localStorage.getItem(POOL_LS);
      if (!r) return [];
      var a = JSON.parse(r);
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  // 精简存档：去掉 cfg 里的 apiKey，避免把密钥写入本地记录
  function sanitizeCfg(cfg) {
    var c = {};
    if (!cfg) return c;
    ['topicId', 'count', 'customCount', 'qtype', 'structure', 'mode', 'providerId', 'baseUrl', 'modelId'].forEach(function (k) {
      if (cfg[k] !== undefined) c[k] = cfg[k];
    });
    return c;
  }
  // 生成完成即入池（不管是否做完）
  function pushToPool(papers, questions, cfg, meta) {
    var list = getPool();
    var entry = {
      id: 'ai_' + nowId(),
      ts: nowTs(),
      date: todayStr(),
      topicLabel: meta && meta.title ? meta.title : '',
      count: (papers || []).reduce(function (s, p) { return s + (p.blanks ? p.blanks.length : 0); }, 0),
      papersCount: (papers || []).length,
      cfg: sanitizeCfg(cfg),
      meta: { title: (meta && meta.title) || 'AI 出题' },
      papers: papers,       // 语篇原文（保留 blanks，便于以后转存题库/重排）
      questions: questions  // 已转换的题目，可直接进入做题
    };
    list.unshift(entry);
    // 容量裁剪：先按数量，再按字节
    if (list.length > POOL_MAX) list.length = POOL_MAX;
    var ok = false;
    try {
      var raw = JSON.stringify(list);
      while (raw.length > POOL_BYTES && list.length > 1) {
        list.pop();
        raw = JSON.stringify(list);
      }
      localStorage.setItem(POOL_LS, raw);
      ok = true;
    } catch (e) { ok = false; }
    return ok ? entry : null;
  }
  function removeFromPool(id) {
    var list = getPool().filter(function (e) { return e.id !== id; });
    try { localStorage.setItem(POOL_LS, JSON.stringify(list)); } catch (e) {}
    return list;
  }
  function clearPool() { try { localStorage.removeItem(POOL_LS); } catch (e) {} }
  var _idSeq = 0;
  function nowId() {
    _idSeq = (_idSeq + 1) % 100000;
    return String(Date.now()) + '_' + _idSeq;
  }
  function nowTs() { return Date.now(); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- Prompt 规则文本（稳定部分，动态部分在 buildPrompt 拼接） ----------
   * 口径来源：上海春考/高考与各区一模二模「语法填空 Section A」真卷，以及
   * 浦东新区多校联考高一期中的答案详解写法（考查点 → 句意 → 依据 → 故填 → 其它形式为何不行）。
   * 真卷事实：一篇 10 空、250-330 词、有提示词 4-6 空 + 无提示词 4-6 空、首句不设空。 */
  function shanghaiRulesText() {
    return [
      '一、语篇规格（照上海真卷的写法，不要写成全国卷的样子）',
      '1. 每篇 10 空、250-330 词、4-6 段，必须给英文标题（真实标题风格，不要写“语篇一”）。',
      '2. 首句（或首段第一句）不设空，先交代话题与基调；最后一空不要落在全篇最后一个词上；两个空之间至少隔 12 个词，同一段最多 3 空。',
      '3. 体裁轮换：说明文（科普/文化/环保/科技）、记叙文（一段个人经历 + 感悟）、议论文（观点 + 例证 + 让步）。不要整篇空洞说教。',
      '4. 话题贴近上海卷取材：传统文化与文博、人工智能与科技、环境与城市生活、青少年成长与心理、校园与社团、体育、饮食健康、艺术与审美、跨文化交流。',
      '5. 语言要地道、有细节：具体数字、人名地名、直接引语、对比或转折；可以用中文括注解释生词（如 resilience（韧性）），但不要靠生词制造难度。',
      '6. 有提示词的空在正文里紧邻写成 “______ (hold)”，无提示词的空只写 “______”，不要再加别的标记。',
      '二、空位配比与考点（上海卷 = 有提示词 + 无提示词两部分）',
      '7. 每篇 10 空 = 有提示词 4-6 空 + 无提示词 4-6 空（成套练习按 5+5 取平均）；不要整篇都有提示词，也不要整篇都没有。',
      '8. 有提示词只有两类任务：①括号给动词——谓语（时态/语态/主谓一致；上海高频：一般过去、过去进行、现在完成、过去完成、过去将来、被动 be done、情态 + have done）或非谓语（to do / doing / done 作主语、宾语、定语、状语、补语，含 make/get + 宾语 + 补足、介词后 doing、be likely to be done）；②括号给形容词/副词——只考比较级或最高级（more likely、the most valuable、far closer、so + adj. + that 结构里的形容词）。',
      '9. 有提示词的答案必须是“原词 + 语法变形”，允许带助动词/be 构成时态语态（was cut / would be / has been studied / are being made），但禁止词性转换：不给名词让学生写形容词、不给形容词让学生写副词、不加否定前缀、不改名词单复数。',
      '10. 无提示词只考下面 6 类，每空 1 个单词；固定搭配可以 2 个词，但全篇最多 2 空（so that / as long as / even though / instead of / rather than / no matter how / so far as）。',
      '   ①从句与连词：what / that / whether / who / whom / which / whose / where / when / why / although / though / while / before / after / since / unless / so that / even if / as long as',
      '   ②介词（含固定搭配）：an advantage over / at one’s own expense / under the guidance of / for fear of / in bad shape / come from',
      '   ③冠词：a / an / the / 零冠词（in bad shape、at that time、take charge of）',
      '   ④代词：it（形式主语/形式宾语）、them、those、one、someone、this / that',
      '   ⑤情态动词与助动词：must have done、can not have done、can / could / would / should、do / does / did 表强调或否定',
      '   ⑥连接副词：however / instead / therefore / besides（作插入语或句首状语时）',
      '11. 上海高频坑要照顾到（全篇至少出现 4 个，并在解析里点明）：①逗号后的非限制性定语从句不用 that；②介词 + which（for which / in which）；③to 是介词的搭配（the door to doing、look forward to doing、be used to doing）；④形式宾语 it（make it a rule that…）；⑤what 从句缺成分 vs that 从句完整；⑥one of the most + adj. + 名词复数；⑦must / can not + have done 表推测；⑧Only + 状语置于句首引起部分倒装；⑨a number of / the number of 的主谓一致；⑩分数或百分数 + of + 名词作主语时的主谓一致。',
      '12. 答案唯一：每个空只有一个标准答案。英语里确实还有自然可接受说法的（could / would、定冠词的两种合理写法等），写进 accepted 数组，并在解析里说明“也接受……”，绝不允许两个完全等价的答案同时算对。',
      '13. 干扰项必须是学生真会犯的错：时态误配、主谓不一致、该被动却用主动、非谓语形式选错、比较级最高级混用、连接词逻辑错、介词搭配错、冠词多漏、代词数格错。禁止荒谬选项，禁止两个都能说通的选项。',
      '14. 同一篇里考点要分散：相邻两空不考同一知识点，同一知识点全篇最多 2 次；不要连续两空都考非谓语或都考时态。',
      '三、解析规格（照上海区教研室答案详解写，学生要能自学）',
      '15. 每个空必须写全 6 项，缺一不可：',
      '   sense：整句中文翻译（通顺、贴近原文语气，不要逐字硬译）',
      '   rule：考查点（一句话，如“非限制性定语从句·关系代词作主语”“现在完成时的被动语态”）',
      '   clue：本题关键线索——引用原句里的词或结构，并说明它为什么能定答案',
      '   why：判断过程 2-4 句，按“先看句子成分/主谓 → 再看时间或逻辑 → 最后定形式”的顺序讲，不要只给结论',
      '   others：其它常见错误形式逐个说明为什么不行（用 ①②③ 分条，每条讲清错在哪）',
      '   tip：一句话记忆或考场口诀（要能背、能迁移，不要写“注意语境”这类空话）',
      '16. 解析里必须出现原文中的具体词句（引用 3-10 个词），禁止只写“根据上下文可知”“固定搭配”而不说清是哪个线索、哪个搭配。',
      '17. 面向初高中学生的口吻：术语第一次出现要顺带解释（如“过去分词 done 表被动或完成”），不要用“显而易见”“众所周知”。',
      '四、输出格式（违反会导致程序读不出来）',
      '18. 只输出一个 JSON 对象：不要 Markdown、不要 json 代码块、不要任何解释文字或注释，响应必须以 { 开头、以 } 结尾。',
      '19. 正文中每个空都用 6 个下划线 ______ 标出，个数必须与 blanks 数组长度完全一致；正文里绝对不能出现答案词，答案只写在 blanks 里。',
      '20. 字段名与取值严格按下方 JSON 模板，不新增、不删减字段；字符串里不要出现未转义的双引号，不要写尾逗号。'
    ].join('\n');
  }

  /* ---------- 专题分布动态描述 ---------- */
  function topicDistRule(topicId, catName) {
    if (!topicId || topicId === 'all') {
      return '训练范围：全部大专题。按上海真卷的重要程度分布（以一篇 10 空为基准）：谓语动词（时态/语态/主谓一致）2 空、非谓语动词 2 空、从句连接词（定语/名词性/状语从句）2 空、形副比较等级 1 空、介词 1 空、冠词或代词 1 空、情态动词或助动词 1 空；语篇按“有提示词 5 空 + 无提示词 5 空”配比，不要机械均分，也不要出词性转换题。';
    }
    return '训练范围：以「' + catName + '」为大专题重点——该大专题下的不同知识点要占全部空数的一半以上，其余空用其它大专题作自然铺垫，保持语篇/句子自然连贯；同一形式不可连续重复，同一知识点全篇最多 2 次。';
  }

  /* ---------- buildPrompt：动态组装（§四十三） ---------- */
  function buildPrompt(cfg) {
    var cur = window.__EGL_CURRICULUM__;
    var catName = '全部';
    if (cfg.topicId && cfg.topicId !== 'all') {
      var c = cur && cur.category ? cur.category(cfg.topicId) : null;
      catName = c ? c.name : cfg.topicId;
    }
    var targetCount = Math.max(1, cfg.count || 10);
    var papersN = Math.max(1, Math.ceil(targetCount / 10));
    var structure = cfg.structure || 'mixed';
    var lines = [];
    lines.push('你是一位熟悉上海地区英语考试命题风格的资深教研员（上海春考/高考与各区一模二模「语法填空」的命题口径）。请命制一套可直接给学生练习的语法填空题，并严格按 JSON 输出。');
    lines.push('');
    lines.push('【本次命题配置】');
    lines.push('- 训练专题：' + catName);
    lines.push('- 题目结构：' + (structure === 'sentence' ? '纯单句题（无语篇）' : structure === 'passage' ? '纯语篇题（无单句）' : '单句题 + 语篇题'));
    lines.push('- 语篇数量：' + (structure === 'sentence' ? '0 篇' : papersN + ' 篇（每篇 10 空，250-330 词；按“有提示词 5 空 + 无提示词 5 空”配比）'));
    lines.push('- 总空数：' + targetCount + '（整套练习的空数之和）');
    // 按薄弱点命题（D 组功能）：把学生最近错得多的考点写进“必考清单”
    if (cfg.weakTags && cfg.weakTags.length) {
      lines.push('');
      lines.push('【按我的薄弱点命题：以下考点必须尽量覆盖（至少覆盖 4 个）】');
      lines.push(cfg.weakTags.map(function (t, i) { return (i + 1) + '. ' + t; }).join('；'));
      lines.push('这些来自学生最近的错题统计。仍然要保证语篇自然连贯，不许为了塞考点写出病句；同一考点全篇最多 2 次。');
    }
    lines.push('');
    lines.push('【命题蓝图：先在心里排好，再动笔写】');
    lines.push('1. 语篇：先定体裁与话题（多篇之间不重复），再定 10 个空的考点，最后成文；不要边写边凑考点。');
    lines.push('2. 一篇 10 空的参考排布（可微调，但两类提示词都要有）：谓语动词 2 空（时态 1、语态或主谓一致 1）＋非谓语动词 2 空（doing/done 作定语或状语 1、to do 1）＋形副比较等级 1 空＋从句连接词 2 空（定语从句 1、名词性从句或状语从句 1）＋介词 1 空＋冠词或代词 1 空＋情态动词或助动词 1 空。');
    lines.push('3. 单句：每句只考 1 个点；句子要有信息量（≥15 词），时间或逻辑线索藏在句内（these days / by then / since / than / of all / only when 等），不要靠一个时间词直接泄题。');
    lines.push('');
    lines.push(topicDistRule(cfg.topicId, catName));
    lines.push('');
    lines.push(shanghaiRulesText());
    lines.push('');
    lines.push('五、单句题规则（structure 含“单句”时必出）：每个单句都是独立完整的句子，句中给出一个提示词并要求学生按语境改成正确形式——动词（take / learn / tell / get / come / go / make / spend / leave / fail / feel / hold / base / inspire 等）改成时态、语态、主谓一致或非谓语（to do / doing / done）；形容词、副词（hard / careful / interesting / valuable / likely / close 等）改成比较级或最高级。禁止词性转换题。每句 1 个空；必须有明确语境线索且答案唯一。单句正文只写 ______ 空标，不写括号原词；原词只放 givenWord 字段。');
    if (structure === 'mixed') {
      lines.push('');
      lines.push('六、结构分配：单句部分与语篇部分都要有；单句空数约占总空数一半（每句 1 空），语篇 1-2 篇（每篇 5-10 空）。');
    }
    lines.push('');
    lines.push('输出前自检（在心里过一遍，不要写出来）：空数是否为 ' + targetCount + '；______ 的个数是否与 blanks 数量一致；每篇语篇是否 10 空且首句不设空；有提示词是否只有“动词/形副比较等级”两种情况、有没有混进词性转换；无提示词是否都落在 6 类内、每空是否 1 个词（固定搭配是否不超过 2 空）；答案是否唯一、有没有 what/that、could/would 这类两可；非谓语是否真的需要判断；时态是否靠上下文而不是靠时间词；语篇是否连贯、是不是拼凑；考点是否过度重复；解析 6 项（sense/rule/clue/why/others/tip）是否写全、有没有引用原文线索。');
    if (cfg.qtype === 'input') {
      lines.push('');
      lines.push('七、输出题型：填空输入题（无选项）。每个空给 answer、accepted、givenWord 与 6 项解析，不输出 options 字段。accepted 要写全学生可能写出的正确变体（缩写、两种时态写法、定冠词的两种合理写法），不能把错误形式写进去。');
    } else {
      lines.push('');
      lines.push('七、输出题型：点选选择题（n 选 1，学生只点不打字），这是本组最关键的要求：');
      lines.push('  1. 每个空除 answer 外必须输出 options：选项个数按该考点自然能给出的合理干扰项决定，4-6 个（最少 3 个）；');
      lines.push('  2. options 中恰好 1 个与 answer 完全一致（忽略首尾空格与大小写），即正确项；');
      lines.push('  3. 其余选项必须是针对该考点的典型错误：错误时态/语态/非谓语形式/主谓不一致、比较级最高级混用、错误连接词、错误介词、冠词多漏误、代词误用、易混逻辑词等；');
      lines.push('  4. 干扰项禁止与正确答案或彼此重复，禁止明显荒谬，禁止出现“两个都能说通”的选项；');
      lines.push('  5. 选项文本只写答案形式本身，不加任何解释。');
      lines.push('  空对象示例（本例 5 选 1）：{"answer":"has been built","accepted":["has been built"],"options":["has been built","has built","was built","is building","has been building"],"givenWord":"build","isGivenWord":true,"type":"tense","knowledgePoint":"现在完成时的被动语态","category":"谓语动词","sense":"到 2025 年，这座城市已经建起了三座新图书馆。","rule":"现在完成时的被动语态","clue":"句中的 by 2025 说明动作到那时已经完成，主语 the city 与 build 是被动关系","why":"先看主语与动词的关系：图书馆是被建的，所以必须用被动；再看时间：by 2025 表示“到那时为止”，是现在完成时的典型标志；两者相加就是 has been built。","others":"①has built 是主动，图书馆不会自己建；②was built 只说明过去某时建成，与 by 2025 的“到那时已完成”不符；③is building 是主动进行，主语不对；④has been building 是主动的完成进行，语态错。","tip":"by + 将来时间 → 现在完成；主语是“被做”的对象 → 被动，两个条件同时出现就是 has been done。","difficulty":2}');
    }
    lines.push('');
    lines.push('八、输出 JSON 模板（严格按此结构，字段一个不少、一个不多）：');
    var schema = {};
    if (structure !== 'sentence') {
      schema.papers = [
        {
          title: '语篇英文标题',
          passage: '完整语篇（250-330 词、4-6 段），需要填空处用 ______ 标记，有提示词写成 ______ (hold)',
          blanks: [
            {
              answer: '标准答案',
              accepted: (cfg.qtype === 'input') ? ['标准答案', '可接受的另一种正确写法（没有就只放标准答案）'] : undefined,
              options: (cfg.qtype === 'input') ? undefined : ['正确答案', '干扰项1', '干扰项2', '干扰项3', '干扰项4'],
              givenWord: '有提示词时给原词，无提示词时为 null',
              isGivenWord: true,
              type: 'tense|passive|agreement|nonfinite|degree|attributive|nominal|adverbial|prep|article|pronoun|conjunction|modal|other',
              category: '谓语动词|非谓语动词|形容词/副词比较等级|定语从句|名词性从句|状语从句|介词|冠词|代词|并列与逻辑|其他/拓展',
              knowledgePoint: '具体知识点，如 现在完成时的被动语态 / 介词 + which / make it a rule that',
              sense: '整句中文翻译',
              rule: '考查点一句话',
              clue: '关键线索（引用原文词句并说明为什么能定答案）',
              why: '判断过程 2-4 句（先成分/主谓，再时间或逻辑，最后定形式）',
              others: '其它错误形式为什么不行（①②③ 分条）',
              tip: '一句话记忆/考场口诀',
              difficulty: 1
            }
          ]
        }
      ];
    }
    if (structure !== 'passage') {
      schema.sentences = [
        {
          sentence: '完整单句，需要填空处用 ______ 标记',
          blanks: [
            {
              answer: '标准答案',
              accepted: (cfg.qtype === 'input') ? ['标准答案'] : undefined,
              options: (cfg.qtype === 'input') ? undefined : ['正确答案', '干扰项1', '干扰项2', '干扰项3'],
              givenWord: '高频动词原形或形容词/副词，如 hold / base / likely / valuable',
              isGivenWord: true,
              type: 'tense|passive|agreement|nonfinite|degree',
              knowledgePoint: '具体知识点，如 一般过去时 / 现在进行时 / 现在完成时被动 / the most valuable',
              category: '谓语动词|非谓语动词|形容词/副词比较等级',
              sense: '整句中文翻译',
              rule: '考查点一句话',
              clue: '关键线索（引用原句词句）',
              why: '判断过程 2-4 句',
              others: '其它错误形式为什么不行（①② 分条）',
              tip: '一句话记忆',
              difficulty: 1
            }
          ]
        }
      ];
    }
    lines.push(JSON.stringify(schema, null, 2));
    return lines.join('\n');
  }

  /* ---------- OpenAI 兼容协议调用（唯一请求入口） ---------- */
  function apiError(resp, providerName, forModels) {
    var name = providerName || '模型商';
    if (resp.status === 401 || resp.status === 403) {
      return { code: 'BAD_KEY', msg: name + ' API Key 无效或没有权限，请检查后重试。' };
    }
    if (resp.status === 429) {
      return { code: 'RATE', msg: name + ' 请求太频繁或余额不足，稍后再试。' };
    }
    if (forModels && (resp.status === 400 || resp.status === 404 || resp.status === 405)) {
      return { code: 'NO_MODELS', msg: name + ' 没有提供可用的模型列表接口。可以手动输入模型 ID，再开始生成。' };
    }
    return { code: 'HTTP_' + resp.status, msg: name + ' API 返回错误（' + resp.status + '），请重试。' };
  }

  function requestFetch(url, options, timeoutMs, providerName, externalSignal) {
    var ctrl = null;
    if (typeof AbortController !== 'undefined') ctrl = new AbortController();
    var timer = null;
    var onExternalAbort = null;
    if (ctrl) timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 90000);
    if (ctrl && externalSignal) {
      onExternalAbort = function () { try { ctrl.abort(); } catch (e) {} };
      if (externalSignal.aborted) onExternalAbort();
      else if (externalSignal.addEventListener) externalSignal.addEventListener('abort', onExternalAbort);
    }
    function done() {
      if (timer) clearTimeout(timer);
      if (ctrl && externalSignal && onExternalAbort && externalSignal.removeEventListener) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
    var opts = {};
    for (var k in options) if (options.hasOwnProperty(k)) opts[k] = options[k];
    opts.signal = ctrl ? ctrl.signal : undefined;
    return fetch(url, opts).then(function (resp) {
      done();
      return resp;
    }).catch(function (err) {
      done();
      if (err && err.code) throw err;
      if (err && err.name === 'AbortError') {
        if (externalSignal && externalSignal.aborted) throw { code: 'ABORT', msg: '已停止生成。' };
        throw { code: 'TIMEOUT', msg: '请求超时，请检查网络或换一个模型商后重试。' };
      }
      throw { code: 'NET', msg: (providerName || '模型商') + ' 网络请求失败。请检查网络、Base URL 和浏览器跨域（CORS）限制后重试。' };
    });
  }

  function readChatContent(json) {
    var txt = '';
    try {
      var msg = json && json.choices && json.choices[0] && json.choices[0].message;
      var c = msg && msg.content;
      if (Array.isArray(c)) {
        txt = c.map(function (part) {
          if (typeof part === 'string') return part;
          return (part && (part.text || part.content)) || '';
        }).join('');
      } else {
        txt = c || (json && json.output_text) || '';
      }
    } catch (e) { txt = ''; }
    return String(txt || '');
  }

  function extractModelIds(json) {
    var arr = [];
    if (Array.isArray(json)) arr = json;
    else if (json && Array.isArray(json.data)) arr = json.data;
    else if (json && Array.isArray(json.models)) arr = json.models;
    else if (json && json.data && Array.isArray(json.data.models)) arr = json.data.models;
    var out = [], seen = {};
    arr.forEach(function (x) {
      var id = (typeof x === 'string') ? x : (x && (x.id || x.model || x.name));
      id = String(id || '').trim();
      if (id && !seen[id]) { seen[id] = 1; out.push(id); }
    });
    out.sort(function (a, b) { return a.localeCompare(b); });
    return out;
  }

  function callChat(promptText, cfg) {
    cfg = cfg || {};
    var provider = providerById(providerIdOf(cfg)) || PROVIDERS[0];
    var key = cfg.apiKey || getKey(provider.id);
    if (!key) return Promise.reject({ code: 'NO_KEY', msg: '请先输入 ' + provider.shortName + ' API Key。' });
    var url = chatUrlOf(cfg);
    if (!url) return Promise.reject({ code: 'NO_BASE', msg: '请先填写 API 地址（Base URL）。' });
    var modelId = modelIdOf(cfg);
    if (!modelId) return Promise.reject({ code: 'NO_MODEL', msg: '请先获取模型列表并选择模型，或手动输入模型 ID。' });
    var extCtrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    _activeCtrl = extCtrl;
    var body = {
      model: modelId,
      messages: [
        { role: 'system', content: cfg.systemPrompt || '你是上海春考/高考语法填空 Section A 的命题引擎（初高中通用）：按真卷规格出一篇 10 空、250-330 词的语篇，有提示词与无提示词各半，解析照市教研室答案详解写（句意/考查点/线索/判断/其它形式/记忆六项）。只输出严格合法的 json 对象：不要解释文字、不要 Markdown、不要代码围栏。' },
        { role: 'user', content: promptText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      stream: false
    };
    if (provider.reasoningEffort) body.reasoning_effort = provider.reasoningEffort;
    var withJsonMode = true;
    function attempt() {
      if (!withJsonMode) delete body.response_format;
      return requestFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify(body)
      }, 180000, provider.shortName, extCtrl ? extCtrl.signal : null).then(function (resp) {
        if (resp.ok) {
          return resp.json().catch(function () { return null; });
        }
        // 部分 OpenAI 兼容网关不支持 response_format：400 时自动去掉它重试一次。
        if (resp.status === 400 && withJsonMode) {
          withJsonMode = false;
          return attempt();
        }
        throw apiError(resp, provider.shortName, false);
      });
    }
    function release() { if (_activeCtrl === extCtrl) _activeCtrl = null; }
    return attempt().then(function (json) {
      release();
      var txt = readChatContent(json);
      if (!txt) throw { code: 'EMPTY', msg: 'AI 返回内容为空，请重试。' };
      return txt;
    }).catch(function (err) {
      release();
      if (err && err.code) throw err;
      throw { code: 'NET', msg: provider.shortName + ' 请求失败，请检查网络与 Base URL 后重试。' };
    });
  }

  /* 停止正在进行的生成请求（返回是否真的取消了） */
  function cancelActive() {
    if (!_activeCtrl) return false;
    try { _activeCtrl.abort(); } catch (e) {}
    _activeCtrl = null;
    return true;
  }

  // GET /models：返回模型 ID 数组；列表接口不可用时允许 UI 手动输入。
  function fetchModels(cfg) {
    cfg = cfg || {};
    var provider = providerById(providerIdOf(cfg)) || PROVIDERS[0];
    var key = cfg.apiKey || getKey(provider.id);
    if (!key) return Promise.reject({ code: 'NO_KEY', msg: '请先输入 ' + provider.shortName + ' API Key。' });
    var url = modelsUrlOf(cfg);
    if (!url) return Promise.reject({ code: 'NO_BASE', msg: '请先填写 API 地址（Base URL）。' });
    return requestFetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + key
      }
    }, 30000, provider.shortName).then(function (resp) {
      if (!resp.ok) throw apiError(resp, provider.shortName, true);
      return resp.json().catch(function () { return null; });
    }).then(function (json) {
      var list = extractModelIds(json);
      if (!list.length) throw { code: 'NO_MODELS', msg: '没有解析到模型 ID。可以手动输入模型 ID，再开始生成。' };
      return list;
    });
  }


  function extractJSON(text) {
    var t = String(text || '').trim();
    // 去掉 ```json ... ``` 围栏
    var fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) t = fence[1].trim();
    // 尝试直接解析
    try { return JSON.parse(t); } catch (e1) {}
    // 提取第一个 { ... } 或 [ ... ] 平衡块
    var start = t.indexOf('{');
    var arrStart = t.indexOf('[');
    if (arrStart >= 0 && (start < 0 || arrStart < start)) start = arrStart;
    if (start < 0) throw { code: 'JSON', msg: 'AI 返回的 JSON 解析失败，请重试。' };
    var depth = 0, inStr = false, escCh = false, end = -1;
    for (var i = start; i < t.length; i++) {
      var ch = t[i];
      if (inStr) {
        if (escCh) escCh = false;
        else if (ch === '\\') escCh = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end < 0) throw { code: 'JSON', msg: 'AI 返回内容不完整，请重试。' };
    try { return JSON.parse(t.slice(start, end + 1)); } catch (e2) { throw { code: 'JSON', msg: 'AI 返回的 JSON 解析失败，请重试。' }; }
  }

  /* ---------- schema 校验 + 规范化（§四十八） ---------- */
  function validateAndNormalize(raw, cfg) {
    var countWant = cfg.count || 10;
    if (!raw || typeof raw !== 'object') throw { code: 'SCHEMA', msg: 'AI 返回的数据格式异常，请重试。' };
    var catName = '其他/拓展';
    var cur = window.__EGL_CURRICULUM__;
    if (cfg.topicId && cfg.topicId !== 'all') {
      var c = cur && cur.category ? cur.category(cfg.topicId) : null;
      catName = c ? c.name : cfg.topicId;
    }
    function normBlanks(list) {
      var out = [];
      (list || []).forEach(function (b, bi) {
        if (!b || !b.answer) return;
        var isG = !!b.isGivenWord || (b.givenWord != null && String(b.givenWord) !== '' && b.givenWord !== 'null');
        var ansRaw = String(b.answer).trim();
        var ansLower = ansRaw.toLowerCase();
        // accepted：AI 给的“也接受”变体（去重、去空、不含答案本身重复）
        var acc = [];
        if (Array.isArray(b.accepted)) {
          b.accepted.forEach(function (a) {
            var s = String(a == null ? '' : a).trim();
            if (!s) return;
            if (s.toLowerCase() === ansLower) return;
            if (acc.indexOf(s) < 0) acc.push(s);
          });
        }
        out.push({
          n: bi + 1,
          answer: ansLower,
          answerRaw: ansRaw,
          accepted: acc,
          options: normalizeOptions(b.options, ansRaw, ansLower),
          givenWord: isG ? String(b.givenWord != null ? b.givenWord : '') : '',
          isGivenWord: isG,
          type: b.type || 'other',
          knowledgePoint: b.knowledgePoint || '',
          category: b.category || catName,
          // 解析六要素（新版）：sense / rule / clue / why / others / tip
          sense: b.sense || '',
          rule: b.rule || '',
          clue: b.clue || '',
          why: b.why || '',
          others: b.others || '',
          tip: b.tip || '',
          explanation: b.explanation || b.why || '',
          difficulty: (b.difficulty >= 1 && b.difficulty <= 5) ? b.difficulty : 1
        });
      });
      return out;
    }
    var sections = [];
    var total = 0;
    // 单句部分（先出，仿作业：句子在前）
    if (raw.sentences && Array.isArray(raw.sentences) && raw.sentences.length) {
      raw.sentences.forEach(function (s, si) {
        if (!s || !s.sentence || !Array.isArray(s.blanks) || !s.blanks.length) return;
        var blanks = normBlanks(s.blanks);
        if (!blanks.length) return;
        var passage = markPassage(String(s.sentence || ''), blanks);
        sections.push({ kind: 'sentence', title: s.title || ('单句 ' + (si + 1)), passage: passage, blanks: blanks });
        total += blanks.length;
      });
    }
    // 语篇部分
    var papers = raw.papers || (Array.isArray(raw) ? raw : null);
    if (papers && papers.length) {
      papers.forEach(function (p, pi) {
        if (!p || !p.passage || !Array.isArray(p.blanks) || !p.blanks.length) return;
        var blanks = normBlanks(p.blanks);
        if (!blanks.length) return;
        // 若 AI 把答案写进了正文（无下划线），按 blanks 顺序重建空位
        var passage = markPassage(String(p.passage || ''), blanks);
        sections.push({ kind: 'passage', title: p.title || ('语篇 ' + (pi + 1)), passage: passage, blanks: blanks });
        total += blanks.length;
      });
    }
    if (!sections.length) throw { code: 'SCHEMA', msg: 'AI 生成结果缺少有效题目，请重试。' };
    if (total < Math.min(countWant, 5)) throw { code: 'COUNT', msg: 'AI 生成的题目数量不足（' + total + '），请重试。' };
    return sections;
  }

  // 兜底：AI 正文没写空标时，按 blank 顺序把答案词原位替换成 ______，重建带空位的全文
  function markPassage(passage, blanks) {
    if (/_{4,}/.test(passage)) return passage; // 已有空标则不动
    var s = String(passage);
    var pos = 0;
    blanks.forEach(function (b) {
      var ans = String(b.answerRaw || b.answer || '').trim();
      if (!ans) return;
      var esc = ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 优先整词匹配（避免答案嵌在其它词里，如 strengthen 在 strengthened 里）
      var re = new RegExp('\\b' + esc + '\\b', 'i');
      var m = re.exec(s.slice(pos));
      var st = m ? pos + m.index : -1;
      if (st < 0) { re.lastIndex = 0; var m2 = re.exec(s); st = m2 ? m2.index : -1; }
      if (st < 0) return;
      s = s.slice(0, st) + '______' + s.slice(st + ans.length);
      pos = st + 6;
    });
    return s;
  }

  // options 规范化：去重(忽略大小写与首尾空格)，保证正确项在内，最多保留 6 项
  function normalizeOptions(list, ansRaw, ansLower) {
    if (!Array.isArray(list) || !list.length) return null;
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length && out.length < 8; i++) {
      var s = String(list[i] == null ? '' : list[i]).trim();
      if (!s) continue;
      var low = s.toLowerCase();
      if (seen[low]) continue;
      seen[low] = true;
      out.push(s);
    }
    var has = out.some(function (o) { return o.toLowerCase() === ansLower; });
    if (!has) out.unshift(ansRaw);
    // 超过 6 个时裁到 6 个，并保证正确项一定保留
    if (out.length > 6) {
      var ansIdx = -1;
      for (var j = 0; j < out.length; j++) if (out[j].toLowerCase() === ansLower) { ansIdx = j; break; }
      var keep = out.slice(0, 6);
      if (ansIdx >= 6) keep[5] = out[ansIdx];
      out = keep;
    }
    return out;
  }

  /* ---------- AI 题 → 现有题目结构 转换器 ----------
   * 每个空 → 一条 input 题（保留语篇上下文 ctx，供做题界面顶部展示整篇）
   * 复用现有做题/判分/解析/错题 schema（type:'input' + accepted + answerText + explanation）
   */
  // 从整篇 passage 截取“第 n 个空所在句”的上下文片段：只取该空所在的句子，
  // 避免把文章后半段/其它空的句子卷进来；其它空保留为下划线。
  function excerptAround(passage, blankN) {
    var text = String(passage || '');
    var re = /_{4,}/g, m, marks = [];
    while ((m = re.exec(text))) marks.push({ i: m.index, len: m[0].length });
    if (!marks.length) return '(语篇第' + blankN + '空) ______';
    var nth = marks[blankN - 1] || marks[marks.length - 1];
    // 句首：向前找到上一个句末标点（. ? !），否则从全文开头
    var start = 0;
    for (var k = nth.i - 1; k >= 0; k--) {
      var ch = text[k];
      if (ch === '.' || ch === '!' || ch === '?') { start = k + 1; while (start < text.length && (text[start] === ' ' || text[start] === '\n')) start++; break; }
    }
    // 句尾：向后到下一个句末标点（含标点）
    var end = nth.i + nth.len;
    for (var j = nth.i + nth.len; j < text.length; j++) {
      var c2 = text[j];
      if (c2 === '.' || c2 === '!' || c2 === '?') { end = j + 1; break; }
    }
    var s = text.slice(start, end);
    // 当前空统一替换成 6 下划线（相对位置由全局偏移换算）
    var rel = nth.i - start;
    if (rel >= 0 && rel + nth.len <= s.length && /_{4,}/.test(s.slice(rel, rel + nth.len))) {
      s = s.slice(0, rel) + '______' + s.slice(rel + nth.len);
    }
    return s.replace(/\s+/g, ' ').trim() || ('(语篇第' + blankN + '空) ______');
  }

  function papersToQuestions(sections, cfg) {
    var qs = [];
    var idx = 0;
    // 每次生成一个唯一 genId：避免不同批次/不同内容生成出相同 qid（错题本按 qid 去重会误合并）
    var genId = cfg.genId || nowId();
    var wantChoice = cfg.qtype === 'choice';
    var fallbackCount = 0;
    var cur = window.__EGL_CURRICULUM__;
    function catIdOfName(name) {
      if (!cur || !cur.categories) return 'verb';
      var key = String(name || '').trim();
      for (var i = 0; i < cur.categories.length; i++) {
        if (cur.categories[i].name === key || cur.categories[i].id === key) return cur.categories[i].id;
      }
      return 'verb';
    }
    (sections || []).forEach(function (p, pi) {
      var kind = p.kind === 'sentence' ? 'sentence' : 'passage';
      (p.blanks || []).forEach(function (b) {
        idx++;
        var isG = b.isGivenWord;
        var catName = b.category || '其他/拓展';
        var ctx = {
          kind: kind,
          isSentence: kind === 'sentence',
          paperIndex: pi, paperCount: (sections || []).length,
          title: p.title || (kind === 'sentence' ? ('单句 ' + (pi + 1)) : ('语篇 ' + (pi + 1))),
          passage: p.passage, total: (p.blanks || []).length,
          blankN: b.n, given: isG ? b.givenWord : ''
        };
        var excerpt = excerptAround(p.passage, b.n);
        // 选择题：空后面带提示词时把词放进题干（如 ______ (build)）
        var stem = excerpt;
        var hasOpts = wantChoice && Array.isArray(b.options) && b.options.length >= 2;
        if (hasOpts && isG && b.givenWord) {
          // 若句子/语篇里 AI 已内联了该原词（如 ______ (play)），则不再重复追加，避免“双份提示词”
          var gwParen = '(' + b.givenWord + ')';
          if (String(stem).toLowerCase().indexOf(gwParen.toLowerCase()) < 0) {
            stem = stem.replace('______', '______ ' + gwParen);
          }
        }
        // 解析：优先用新版六要素（句意/考查点/线索/判断/其它形式/记忆）
        var exWhy = '';
        if (b.sense) exWhy += '句意：' + b.sense;
        if (b.why) exWhy += (exWhy ? '\n' : '') + '判断：' + b.why;
        if (!exWhy) exWhy = b.explanation || '（AI 未提供解析）';
        var exOthers = b.others || (hasOpts
          ? '其它选项是该考点的典型干扰项：要么时态/语态/词形不对，要么与句子成分或上下文逻辑不符。'
          : '易错点是填成其它语法形式：把每个错形代回原句，看主谓、时态、成分哪一条先不成立。');
        var q = {
          id: 'ai_' + genId + '_' + kind.slice(0, 1) + pi + '_b' + (b.n || idx),
          source: 'ai',
          isAI: true,
          aiMeta: {
            topicId: cfg.topicId === 'all' ? 'all' : (cfg.topicId || 'all'),
            catName: catName, catId: catIdOfName(catName),
            knowledgePoint: b.knowledgePoint || '', type: b.type || ''
          },
          aiCtx: ctx,
          difficulty: b.difficulty || 1,
          question: stem,
          tag: b.knowledgePoint || (b.category || ''),
          wrongType: 'CONTEXT_ERROR',
          explanation: {
            answer: b.answerRaw || b.answer,
            keyPoint: b.rule ? '考查点：' + b.rule
              : (b.knowledgePoint ? '考查点：' + b.knowledgePoint : '考查点：' + (b.category || '语法')),
            clue: b.clue || (kind === 'sentence'
              ? '单句题《' + ctx.title + '》：线索在句内，先找时间状语或逻辑标志，再定形式。'
              : '语篇《' + p.title + '》第 ' + (b.n || idx) + ' 空：先看所在句缺什么成分，再联系上句逻辑。'),
            chain: (kind === 'sentence' ? '读全句找线索 → ' : '读语篇 → 看所在句结构 → ')
              + (b.rule || b.knowledgePoint || '判断该空作用') + ' → ' + (b.answerRaw || b.answer),
            why: exWhy,
            whyOthers: exOthers,
            commonError: '',
            memory: b.tip || '',
            cue: '',
            examMind: ''
          }
        };
        if (hasOpts) {
          // n 选 1：正确项必须在 options 中（normalizeOptions 已保证）
          var ansLow = String(b.answer || '').toLowerCase();
          var ansIdx = -1;
          for (var oi = 0; oi < b.options.length; oi++) {
            if (String(b.options[oi]).toLowerCase() === ansLow) { ansIdx = oi; break; }
          }
          if (ansIdx < 0) ansIdx = 0;
          q.type = 'choice';
          q.options = b.options.slice();
          q.answerIndex = ansIdx;
          q.answerText = b.options[ansIdx];
          q.accepted = [b.options[ansIdx]];
          q.hint = '';
        } else {
          // 兜底：AI 没给选项 → 仍按填空呈现，并在完成页提示
          if (wantChoice) fallbackCount++;
          q.type = 'input';
          q.hint = isG ? String(b.givenWord) : '';
          // accepted 带上 AI 声明的“也接受”变体，避免学生写出合法变体被判错
          q.accepted = [b.answerRaw || b.answer].concat(b.accepted || []);
          q.answerText = b.answerRaw || b.answer;
          q._fallbackInput = wantChoice;
        }
        qs.push(q);
      });
    });
    if (qs.length) qs.fallbackCount = fallbackCount;
    return qs;
  }

  /* ---------- AI 讲解：把已有解析换成更简单的话（按 qid 缓存，避免重复花钱） ---------- */
  var EXPLAIN_LS = 'EGL_AI_EXPLAIN_v1';
  var CFG_LS = 'EGL_AI_CFG_v1';
  function readExplainAll() {
    try {
      var raw = localStorage.getItem(EXPLAIN_LS);
      var o = raw ? JSON.parse(raw) : null;
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function writeExplainAll(o) {
    try { localStorage.setItem(EXPLAIN_LS, JSON.stringify(o || {})); } catch (e) {}
  }
  function getExplainCache(qid) {
    var all = readExplainAll();
    return all[qid] ? all[qid].data : null;
  }
  function setExplainCache(qid, data) {
    if (!qid) return;
    var all = readExplainAll();
    all[qid] = { ts: nowTs(), data: data };
    var keys = Object.keys(all);
    if (keys.length > 200) {
      keys.sort(function (a, b) { return (all[a].ts || 0) - (all[b].ts || 0); });
      keys.slice(0, keys.length - 200).forEach(function (k) { delete all[k]; });
    }
    writeExplainAll(all);
  }
  function clearExplainCache() { try { localStorage.removeItem(EXPLAIN_LS); } catch (e) {} }
  /* 读取当前 AI 配置（含 Key），供“AI 讲解”等轻量功能直接调用 */
  function quickCfg() {
    var d = defaultConfig();
    try {
      var raw = localStorage.getItem(CFG_LS);
      var saved = raw ? JSON.parse(raw) : null;
      if (saved && typeof saved === 'object') {
        for (var k in saved) if (saved.hasOwnProperty(k)) d[k] = saved[k];
      }
    } catch (e) {}
    var p = providerById(providerIdOf(d)) || PROVIDERS[0];
    d.providerId = p.id;
    if (!d.baseUrl) d.baseUrl = p.baseUrl;
    if (!d.modelId) d.modelId = p.defaultModel || '';
    // Key 优先取 AI 页内存里的临时 Key（用户可能没勾“记住”），再退回本机保存的 Key
    var tmpKey = '';
    try {
      if (window.EGL && window.EGL.aiUI && window.EGL.aiUI.getKeyCache) tmpKey = window.EGL.aiUI.getKeyCache(p.id) || '';
    } catch (e) { tmpKey = ''; }
    d.apiKey = tmpKey || getKey(p.id);
    return d;
  }
  function explainQuestion(q, cfg) {
    cfg = cfg || quickCfg();
    if (!cfg.apiKey) return Promise.reject({ code: 'NO_KEY', msg: '请先在「AI 出题」页填 API Key。' });
    if (!cfg.modelId) return Promise.reject({ code: 'NO_MODEL', msg: '请先在「AI 出题」页选择模型。' });
    q = q || {};
    var ex = q.explanation || {};
    var ans = q.type === 'choice' ? (q.options && q.options[q.answerIndex]) : (q.answerText || (q.accepted && q.accepted[0]));
    var prompt = [
      '学生做错了一道语法填空题（面向初高中）。请用更简单的中文把这道题讲明白，不要堆语法术语；术语第一次出现要顺手解释。',
      '只输出 JSON 对象，不要 Markdown、不要代码围栏，字段如下：',
      '{"simple":"两句话以内讲清为什么填这个（最多 60 字）","pitfall":"最容易和什么混淆，一句话","examples":["同类例句 1（英文，可带中文括注）","同类例句 2"],"tip":"一句能背下来的口诀"}',
      '',
      '【题目】' + String(q.question || ''),
      '【提示词】' + String(q.hint || '无'),
      '【正确答案】' + String(ans || ''),
      '【现有解析】' + String(ex.why || ex.keyPoint || '（无）'),
      '【学生易错】' + String(ex.whyOthers || ex.commonError || '（无）')
    ].join('\n');
    var cfg2 = {};
    for (var k in cfg) cfg2[k] = cfg[k];
    cfg2.systemPrompt = '你是高中英语老师，专门把语法填空的解析讲成初中生也能听懂的话。只输出严格合法的 JSON，不要任何解释文字。';
    return callChat(prompt, cfg2).then(function (text) {
      var raw = null;
      try { raw = extractJSON(text); } catch (e) { raw = null; }
      var o = raw || {};
      var simple = String(o.simple || o.oneLine || o.summary || o.why || '').trim();
      var examples = Array.isArray(o.examples) ? o.examples.slice(0, 3).map(function (x) { return String(x); }) : [];
      var pitfall = String(o.pitfall || o.trap || o.confusion || '').trim();
      var tip = String(o.tip || o.memory || '').trim();
      if (!simple && !examples.length) throw { code: 'EMPTY', msg: 'AI 没有返回可用内容，请重试。' };
      return { simple: simple, examples: examples, pitfall: pitfall, tip: tip };
    });
  }

  /* ---------- 导出为题库文件（bank-papers-NN.js 规范，可直接放进 data/） ---------- */
  var CAT_IDS = ['verb', 'nonfinite', 'transform', 'attrib', 'nominal', 'adverbial', 'prep', 'article', 'pronoun', 'coord', 'extra'];
  function catIdOfName(name) {
    var cur = window.__EGL_CURRICULUM__;
    var key = String(name || '').trim();
    if (cur && cur.categories) {
      for (var i = 0; i < cur.categories.length; i++) {
        if (cur.categories[i].name === key || cur.categories[i].id === key) return cur.categories[i].id;
      }
    }
    return CAT_IDS.indexOf(key) >= 0 ? key : 'extra';
  }
  function bankWords(text) {
    var m = String(text || '').replace(/\([^)]*\)/g, ' ').replace(/_{4,}/g, ' ')
      .match(/[A-Za-z][A-Za-z'’-]*/g);
    return m ? m.length : 0;
  }
  function indentJs(s) {
    return String(s).split('\n').map(function (l) { return '  ' + l; }).join('\n');
  }
  /* 把 AI 生成记录转成合法的 bank-papers 文件文本；结构不过关就返回 errors，不导出 */
  function buildBankFile(entry) {
    entry = entry || {};
    var errors = [], warnings = [], papersOut = [];
    var sections = entry.papers || [];
    var stamp = todayStr().replace(/-/g, '');
    var base = 'ai' + String(entry.ts || nowTs()) + stamp;
    sections.forEach(function (sec, si) {
      var label = '第 ' + (si + 1) + ' 组';
      if (!sec || sec.kind !== 'passage') {
        warnings.push(label + '是单句题，题库只收整篇语篇，已跳过');
        return;
      }
      var blanks = sec.blanks || [];
      var marks = (String(sec.passage || '').match(/______/g) || []).length;
      if (blanks.length !== 10) errors.push(label + '：空数 ' + blanks.length + '，题库要求 10 空');
      if (marks !== blanks.length) errors.push(label + '：正文空位 ' + marks + ' 个，与空数 ' + blanks.length + ' 不一致');
      var givenN = 0;
      blanks.forEach(function (b, bi) {
        var q = label + ' 第 ' + (bi + 1) + ' 空';
        if (!b || !b.answer) { errors.push(q + '：缺 answer'); return; }
        var ans = String(b.answerRaw || b.answer || '');
        if (!b.accepted || !b.accepted.length) warnings.push(q + '：accepted 不足，导出时只写标准答案');
        if (b.isGivenWord) {
          givenN++;
          if (!b.givenWord) errors.push(q + '：标了有提示词但缺 givenWord');
          else {
            var g = String(b.givenWord).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (!new RegExp('_{4,}\\s*\\(\\s*' + g + '\\s*\\)', 'i').test(String(sec.passage || ''))) {
              errors.push(q + '：正文里找不到紧跟空位的提示词（' + b.givenWord + '）');
            }
          }
        }
        if (ans.length >= 6 || ans.indexOf(' ') >= 0) {
          var re = new RegExp('\\b' + ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
          if (re.test(String(sec.passage || '').replace(/\([^)]*\)/g, ' '))) {
            errors.push(q + '：答案「' + ans + '」出现在了正文里');
          }
        }
        ['sense', 'clue', 'why', 'others', 'tip'].forEach(function (f) {
          if (!b[f] || !String(b[f]).trim()) warnings.push(q + '：解析缺 ' + f + '，导出后需要人工补');
        });
      });
      if (givenN < 4 || givenN > 6) warnings.push(label + '：有提示词 ' + givenN + ' 空（真卷 4-6 空）');
      if (bankWords(sec.passage) < 180) warnings.push(label + '：语篇 ' + bankWords(sec.passage) + ' 词，真卷一般 250-330 词');
      if (errors.length) return;
      var pid = 'paper' + base + (si + 1);
      var blanksOut = blanks.map(function (b, bi) {
        var ansRaw = String(b.answerRaw || b.answer || '');
        var acc = [ansRaw];
        (b.accepted || []).forEach(function (a) {
          var s = String(a || '').trim();
          if (s && !acc.some(function (x) { return x.toLowerCase() === s.toLowerCase(); })) acc.push(s);
        });
        return {
          n: bi + 1,
          answer: ansRaw,
          accepted: acc,
          given: b.givenWord || '',
          isGiven: !!b.isGivenWord,
          catId: catIdOfName(b.category),
          point: b.knowledgePoint || b.rule || b.category || '',
          wrongType: 'CONTEXT_ERROR',
          difficulty: (b.difficulty >= 1 && b.difficulty <= 5) ? b.difficulty : 3,
          sense: b.sense || '',
          clue: b.clue || '',
          why: b.why || '',
          others: b.others || '',
          tip: b.tip || ''
        };
      });
      papersOut.push({
        id: pid,
        no: 'AI' + (papersOut.length + 1),
        title: sec.title || ('AI 语篇 ' + (si + 1)),
        source: 'AI 生成 · ' + (entry.date || todayStr()) + ' · ' + ((entry.cfg && entry.cfg.modelId) || 'AI') + '（发布前需人工复核）',
        level: '高三',
        genre: '说明文',
        words: bankWords(sec.passage),
        topic: sec.title || '',
        readGuide: '先通读一遍：看每空所在句的主语、时间或逻辑线索，再逐空判断；不要只盯着空所在的词。',
        passage: sec.passage,
        blanks: blanksOut
      });
    });
    if (!papersOut.length && !errors.length) errors.push('没有可导出的整篇语篇（单句题不能直接入库）');
    if (errors.length) return { ok: false, errors: errors, warnings: warnings, js: '', filename: '' };
    var header = '/* ============================================================\n'
      + ' * data/bank-papers-ai-' + stamp + '.js — AI 生成的上海语法填空语篇\n'
      + ' * 生成时间：' + new Date().toLocaleString() + '　·　模型：' + String((entry.cfg && entry.cfg.modelId) || 'AI') + '\n'
      + ' * 说明：导出前已校验空数 / 提示词位置 / 答案泄漏 / 解析字段；\n'
      + ' *       正式发布前仍请人工核对语言地道性与答案唯一性，并按需补全解析。\n'
      + ' * ============================================================ */\n';
    var parts = papersOut.map(function (p) {
      var lines = JSON.stringify(p, null, 2).split('\n');
      var body = lines.map(function (l, i) { return i === 0 ? l : '  ' + l; }).join('\n');
      return '  P.push(' + body + ');';
    });
    var js = header + '(function () {\n  "use strict";\n  var P = window.__EGL_PAPERS__ = window.__EGL_PAPERS__ || [];\n\n'
      + parts.join('\n\n') + '\n})();\n';
    return {
      ok: true, js: js, errors: [], warnings: warnings,
      filename: 'bank-papers-ai-' + stamp + '.js',
      count: papersOut.length
    };
  }

  /* ---------- 配置面板默认值 ---------- */
  function defaultConfig() {
    return {
      topicId: 'all',
      count: 10, customCount: 15,
      apiKey: getKey('teamorouter'), rememberKey: !!getKey('teamorouter'),
      providerId: 'teamorouter',
      baseUrl: (providerById('teamorouter') || PROVIDERS[0]).baseUrl,
      modelId: (providerById('teamorouter') || PROVIDERS[0]).defaultModel || '',
      // 上海真卷是纯填空、没有选项：默认按填空生成，点选只作为“不方便打字”时的备选
      qtype: 'input', structure: 'mixed', focus: 'all'
    };
  }

  window.EGL = window.EGL || {};
  EGL.ai = {
    // 旧版兼容：保留固定模型列表；新界面统一通过 /models 动态获取。
    MODELS: [
      { ui: 'deepseek-chat', id: 'deepseek-chat', note: 'DeepSeek 对话模型别名' },
      { ui: 'deepseek-reasoner', id: 'deepseek-reasoner', note: 'DeepSeek 推理模型别名' }
    ],
    PROVIDERS: PROVIDERS,
    API_URL: API_URL,
    providerById: providerById,
    providerIdOf: providerIdOf,
    baseUrlOf: baseUrlOf,
    modelsUrlOf: modelsUrlOf,
    chatUrlOf: chatUrlOf,
    modelIdOf: modelIdOf,
    defaultConfig: defaultConfig,
    getKey: getKey, saveKey: saveKey, clearKey: clearKey,
    cacheSession: cacheSession, readCachedSession: readCachedSession, clearCachedSession: clearCachedSession,
    getPool: getPool, pushToPool: pushToPool, removeFromPool: removeFromPool, clearPool: clearPool,
    buildPrompt: buildPrompt,
    fetchModels: fetchModels,
    callChat: callChat,
    cancelActive: cancelActive,
    callDeepSeek: callChat,
    extractJSON: extractJSON,
    validateAndNormalize: validateAndNormalize,
    papersToQuestions: papersToQuestions,
    quickCfg: quickCfg,
    explainQuestion: explainQuestion,
    getExplainCache: getExplainCache,
    setExplainCache: setExplainCache,
    clearExplainCache: clearExplainCache,
    buildBankFile: buildBankFile,
    catIdOfName: catIdOfName
  };
})();
