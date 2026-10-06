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

  /* ---------- Prompt 规则文本（稳定部分，动态部分在 buildPrompt 拼接） ---------- */
  function shanghaiRulesText() {
    return [
      '一、命题总则（上海命题风格 · 初高中通用）',
      '1. 语篇必须完整、连贯、有明确主题（说明文/科普/议论文/叙事均可），语言地道自然；禁止把互不相关的句子拼成“文章”。',
      '2. 语篇题每篇约 10 空，按上海卷实际配比：有提示词约 4 空 + 无提示词约 6 空，整套练习保持这个比例（纯单句模式不受此条限制）。',
      '3. 难度来自语法结构与上下文逻辑，词汇限定在初高中课标范围：禁止生僻词、超纲词和陌生文化背景；禁止“时间词直给答案”的送分题，时态语态必须由上下文推断。',
      '二、考点规则（上海专属，务必严格遵守）',
      '4. 有提示词只有两种任务：①括号给动词——谓语（时态/语态/主谓一致，上海高频：一般过去、现在完成、过去完成、被动 be done）或非谓语（to do 目的/将来、doing 主动/伴随、done 被动/完成）；②括号给形容词/副词——只考比较级（有 than 等比较信号）或最高级（the / in,of + 范围）。',
      '5. 禁止出全国卷式词性转换题：不给 care 让学生写 careful/carefully，不给名词派生形容词，不给形容词变副词、加否定前缀或名词后缀，也不考名词单复数变形。有提示词的答案必须还是同一个词：动词只做语法变形，形副只变比较等级（原词性不变）。',
      '6. 无提示词只考 5 类：连词（并列连词 and/but/or/so；定语从句 who/which/that/whose/where；名词性从句 what/that/whether；状语从句 when/if/because/though 等）、介词（固定搭配与语义）、冠词（a/an/the/零冠词）、代词（it/they/that/those，含 it 形式主语/形式宾语）、情态动词与助动词（can/may/must/should；do/does/did）。每个无提示词空只能填 1 个单词。',
      '7. 答案唯一：每个空有且只有一个正确答案，禁止“填 A 填 B 都说得通”的两可题；what 的从句必须缺成分、that 的从句必须完整，if/whether、which/where 等同理。',
      '8. 非谓语必须真实需要判断：先看分句有没有谓语，再判断主动/被动与动作先后，禁止为覆盖 having done、to have done 等形式强行塞入。',
      '9. 考点贴合上海高频坑：抽象地点先行词 case/situation/point/scene/occasion 后从句不缺主宾时用 where；逗号隔开的非限制性定语从句与介词后面不用 that；固定搭配注意 look forward to + doing 这类“to 是介词”的搭配。另外，however 只以 however + adj/adv + 主语 + 谓语 的让步结构自然出现，禁止硬凑。',
      '10. 同一篇内考点要分散：相邻两空不考同一知识点，同一知识点全篇最多出现 2 次。',
      '三、解析规则',
      '11. 每个空都要给出学生能看懂的中文解析，讲清三点：①为什么是这个答案（语法依据+语境线索）；②为什么不是其它形式（对比易错项）；③做题时如何一步步判断（数谓语定谓语/非谓语、看从句缺不缺成分、联系上下文）。解析要具体，禁止“固定搭配”“语感如此”之类空话。',
      '四、输出格式规则（违反会导致程序无法读取）',
      '12. 只输出一个 JSON 对象：不要 Markdown、不要 ```json 代码块、不要任何解释、注释或前后说明，响应必须以 { 开头、以 } 结尾。',
      '13. 正文中的每个空都用 4 个下划线 ____ 标出，____ 的个数必须与 blanks 数组长度完全一致；正文里绝对不能出现答案词，答案只写在 blanks 里。',
      '14. 字段名与取值严格按下方 JSON 模板，不新增、不删减字段；字符串内不要出现未转义的引号，不要写尾逗号。'
    ].join('\n');
  }

  /* ---------- 专题分布动态描述 ---------- */
  function topicDistRule(topicId, catName) {
    if (!topicId || topicId === 'all') {
      return '训练范围：全部大专题。按上海卷实际重要程度分布：谓语动词（时态/语态/主谓一致）、非谓语动词、从句连接词（定语/名词性/状语从句）、介词、冠词、代词、并列逻辑、形副比较等级；语篇按“有提示词 4 空 + 无提示词 6 空”配比，不要机械均分，也不要出词性转换题。';
    }
    return '训练范围：以「' + catName + '」为大专题重点——该大专题下的不同知识点要占全部空数的一半以上，其余空用其它大专题作自然铺垫，保持句子/语篇自然连贯；同一形式不可连续重复。';
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
    lines.push('你是一位熟悉上海地区英语考试（初高中通用）命题风格的英语教研员，请命制一套可直接给学生练习的语法填空题，并严格按 JSON 输出。');
    lines.push('');
    lines.push('【本次命题配置】');
    lines.push('- 训练专题：' + catName);
    lines.push('- 题目结构：' + (structure === 'sentence' ? '纯单句题（无语篇）' : structure === 'passage' ? '纯语篇题（无单句）' : '单句题 + 语篇题'));
    lines.push('- 语篇数量：' + (structure === 'sentence' ? '0 篇' : papersN + ' 篇（每篇不超过 10 空；满 10 空的语篇按“4 空有提示词 + 6 空无提示词”）'));
    lines.push('- 总空数：' + targetCount + '（整套练习的空数之和）');
    lines.push('');
    lines.push(topicDistRule(cfg.topicId, catName));
    lines.push('');
    lines.push(shanghaiRulesText());
    lines.push('');
    lines.push('五、单句题规则（structure 含“单句”时必出）：每个单句都是独立完整的句子，句中给出一个提示词并要求学生按语境改成正确形式——动词（如 take / learn / tell / get / come / go / make / spend / leave / fail / feel / have 等）改成时态/语态/主谓一致/非谓语（to do/doing/done）形式；形容词/副词（如 hard / careful / interesting 等）改成比较级或最高级。禁止词性转换题。每句 1 个空（个别可 2 个空）；必须有明确语境线索（如 these days / at that time / by then / since / than / of all 等）且答案唯一。单句正文只写 ____ 空标，不写括号原词；原词只放 givenWord 字段。');
    if (structure === 'mixed') {
      lines.push('');
      lines.push('六、结构分配：单句部分与语篇部分都要有；单句空数约占总空数一半（每句 1-2 空），语篇 1~2 篇（每篇 5~10 空）。');
    }
    lines.push('');
    lines.push('输出前自检（在心里过一遍，不要写出来）：空数是否为 ' + targetCount + '；____ 的个数是否与 blanks 数量一致；有提示词是否只有“动词/形副比较等级”两种情况、有没有混进词性转换；无提示词是否都落在连词/介词/冠词/代词/情态·助动词 5 类内、每空是否只有 1 个单词；答案是否唯一；有没有 what/that 两可；非谓语是否真的需要判断；时态是否靠上下文；文章是否连贯；考点是否过度重复；解析是否三点齐全。');
    if (cfg.qtype === 'input') {
      lines.push('');
      lines.push('七、输出题型：填空输入题（无选项）。每个空只给 answer 与 givenWord，不输出 options 字段。');
    } else {
      lines.push('');
      lines.push('七、输出题型：点选选择题（n 选 1，学生只点不打字），这是本组最关键的要求：');
      lines.push('  1. 每个空除 answer 外必须输出 options：选项个数由该考点自然能给出的合理干扰项决定，4~6 个（最少 3 个）；');
      lines.push('  2. options 中恰好 1 个与 answer 完全一致（忽略首尾空格与大小写），即正确项；');
      lines.push('  3. 其余选项必须是针对该考点的典型错误：错误时态/语态/非谓语形式/主谓不一致、比较级最高级混用、错误连接词、错误介词、冠词多漏误、代词误用、易混逻辑词等；');
      lines.push('  4. 干扰项禁止与正确答案或彼此重复，禁止明显荒谬，禁止出现“两个都能说通”的选项；');
      lines.push('  5. 选项文本只写答案形式本身，不加任何解释。');
      lines.push('  空对象示例（本例 5 选 1）：{"answer":"has been built","options":["has been built","has built","was built","is building","has been building"],"givenWord":"build","isGivenWord":true,"type":"tense","knowledgePoint":"现在完成时被动语态","category":"谓语动词","explanation":"主语 building 与 build 是被动关系；by 2025 说明动作到说话时已完成，所以用现在完成时的被动 has been built。has built 是主动、was built 是过去、is building 是进行，都与语境不符。判断步骤：先看主语与语态，再看时间关系，最后确定时态语态的组合形式。","difficulty":2}');
    }
    lines.push('');
    lines.push('八、输出 JSON 模板（严格按此结构，字段一个不少、一个不多）：');
    var schema = {};
    if (structure !== 'sentence') {
      schema.papers = [
        {
          title: '语篇标题',
          passage: '完整语篇，需要填空处用 ____（下划线×4）标记',
          blanks: [
            {
              answer: '答案',
              options: (cfg.qtype === 'input') ? undefined : ['正确答案', '干扰项1', '干扰项2', '干扰项3', '干扰项4', '干扰项5'],
              givenWord: '有提示词时给原词，无提示词时为 null',
              isGivenWord: true,
              type: 'nonfinite|tense|clause|prep|article|pronoun|conjunction|degree|other',
              knowledgePoint: '具体知识点，如 having done',
              category: '谓语动词|非谓语动词|形容词/副词比较等级|定语从句|名词性从句|状语从句|介词|冠词|代词|并列与逻辑|其他/拓展',
              explanation: '面向初高中学生的中文解析：为什么是这个答案/为什么不是别的形式/怎么从句子结构和上下文判断',
              difficulty: 1
            }
          ]
        }
      ];
    }
    if (structure !== 'passage') {
      schema.sentences = [
        {
          sentence: '完整单句，需要填空处用 ____（下划线×4）标记',
          blanks: [
            {
              answer: '答案',
              options: (cfg.qtype === 'input') ? undefined : ['正确答案', '干扰项1', '干扰项2', '干扰项3', '干扰项4'],
              givenWord: '高频动词原形，如 take / learn / tell / get',
              isGivenWord: true,
              type: 'tense|passive|nonfinite|agreement|degree',
              knowledgePoint: '具体知识点，如 一般过去时 / 现在进行时 / 现在完成时被动',
              category: '谓语动词|非谓语动词|形容词/副词比较等级',
              explanation: '面向初高中学生的中文解析：为什么是这个答案/为什么不是别的形式/怎么从时间状语或语境判断',
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

  function requestFetch(url, options, timeoutMs, providerName) {
    var ctrl = null;
    if (typeof AbortController !== 'undefined') ctrl = new AbortController();
    var timer = null;
    if (ctrl) timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 90000);
    var opts = {};
    for (var k in options) if (options.hasOwnProperty(k)) opts[k] = options[k];
    opts.signal = ctrl ? ctrl.signal : undefined;
    return fetch(url, opts).then(function (resp) {
      if (timer) clearTimeout(timer);
      return resp;
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      if (err && err.code) throw err;
      if (err && err.name === 'AbortError') throw { code: 'TIMEOUT', msg: '请求超时，请检查网络或换一个模型商后重试。' };
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
    var body = {
      model: modelId,
      messages: [
        { role: 'system', content: '你是英语语法填空命题引擎（上海命题风格 · 初高中通用）。只输出严格合法的 json 对象：不要解释文字、不要 Markdown、不要代码围栏。' },
        { role: 'user', content: promptText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      stream: false
    };
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
      }, 90000, provider.shortName).then(function (resp) {
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
    return attempt().then(function (json) {
      var txt = readChatContent(json);
      if (!txt) throw { code: 'EMPTY', msg: 'AI 返回内容为空，请重试。' };
      return txt;
    }).catch(function (err) {
      if (err && err.code) throw err;
      throw { code: 'NET', msg: provider.shortName + ' 请求失败，请检查网络与 Base URL 后重试。' };
    });
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
        out.push({
          n: bi + 1,
          answer: ansLower,
          answerRaw: ansRaw,
          options: normalizeOptions(b.options, ansRaw, ansLower),
          givenWord: isG ? String(b.givenWord != null ? b.givenWord : '') : '',
          isGivenWord: isG,
          type: b.type || 'other',
          knowledgePoint: b.knowledgePoint || '',
          category: b.category || catName,
          explanation: b.explanation || '（本题缺解析）',
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
    var wantChoice = cfg.qtype !== 'input';
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
            keyPoint: b.knowledgePoint ? '考点：' + b.knowledgePoint : '考点：' + (b.category || '语法'),
            clue: (kind === 'sentence'
              ? '本题为单句题《' + ctx.title + '》，注意句中的时间状语/语境线索。'
              : '本题来自语篇《' + p.title + '》第' + (b.n || idx) + '空；判断请结合前后文与所在句结构。'),
            chain: (kind === 'sentence' ? '读全句找线索 → 判断该动词时态/语态/形式 → ' : '读语篇 → 看所在句结构 → ')
              + (b.knowledgePoint || '判断该空作用') + ' → ' + (b.answerRaw || b.answer),
            why: b.explanation || '（AI 未提供解析）',
            whyOthers: hasOpts
              ? '其它选项是该考点常见易错干扰项：或时态/语态/词形不对，或不符合句子成分/上下文逻辑；用排除法逐条对照主干再定。'
              : '（AI 生成题无固定选项；易错点是填入其它语法形式，详见上方解析。）',
            commonError: '上海卷此考点常见错误：只背规则不看语境；做题时请先找时间状语/语境线索，再定时态语态。',
            memory: '',
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
          q.accepted = [b.answerRaw || b.answer];
          q.answerText = b.answerRaw || b.answer;
          q._fallbackInput = wantChoice;
        }
        qs.push(q);
      });
    });
    if (qs.length) qs.fallbackCount = fallbackCount;
    return qs;
  }

  /* ---------- 配置面板默认值 ---------- */
  function defaultConfig() {
    return {
      topicId: 'all',
      count: 10, customCount: 15,
      apiKey: getKey(PROVIDERS[0].id), rememberKey: !!getKey(PROVIDERS[0].id),
      providerId: PROVIDERS[0].id,
      baseUrl: PROVIDERS[0].baseUrl,
      modelId: PROVIDERS[0].defaultModel || '',
      qtype: 'choice', structure: 'mixed'
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
    callDeepSeek: callChat,
    extractJSON: extractJSON,
    validateAndNormalize: validateAndNormalize,
    papersToQuestions: papersToQuestions
  };
})();
