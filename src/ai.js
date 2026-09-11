/* ============================================================
 * src/ai.js — AI 出题子系统（DeepSeek）
 * 职责分区：
 *   A. 配置与 API Key 管理（本地安全提示）
 *   B. 动态 Prompt 生成（buildPrompt）
 *   C. DeepSeek API 调用（唯一请求入口）
 *   D. JSON 容错与 schema 校验
 *   E. AI 题目 → 现有题库结构 转换器（语篇+逐空）
 * 规则：AI 只出题数据，不生成页面代码；失败不破坏原题库。
 * ============================================================ */
(function () {
  'use strict';
  var E = window.EGL, U = E.u;
  var $ = U.$, $$ = U.$$, el = U.el, esc = U.esc;

  var API_URL = 'https://api.deepseek.com/chat/completions';
  // UI 显示名与真实 API model id 映射（避免硬编码不存在的 id）
  var MODELS = [
    { ui: 'DeepSeek V4 Flash（默认·快）', id: 'deepseek-chat', note: '对应 deepseek-chat' },
    { ui: 'DeepSeek Reasoner（强推理·更慢更贵）', id: 'deepseek-reasoner', note: '对应 deepseek-reasoner' }
  ];
  // 推理等级：本 API 无独立 reasoning 参数，用模型选择映射；不发送不存在的参数
  var REASON = { low: 'deepseek-chat', medium: 'deepseek-chat', high: 'deepseek-reasoner' };

  // 真实 model id：优先用 UI 显式选择的模型，其次按推理等级映射（不发送不存在的参数）
  function modelIdOf(cfg) {
    var want = cfg && cfg.modelUi;
    for (var i = 0; i < MODELS.length; i++) if (MODELS[i].ui === want) return MODELS[i].id;
    return REASON[cfg && cfg.reasoning] || REASON.low;
  }

  var KEY_LS = 'EGL_AI_KEY_v1';
  var LAST_SESSION_LS = 'EGL_AI_LAST_v1'; // 结果缓存：sessionStorage 优先

  function getKey() {
    try { return localStorage.getItem(KEY_LS) || ''; } catch (e) { return ''; }
  }
  function saveKey(k, remember) {
    try {
      if (remember && k) localStorage.setItem(KEY_LS, k);
      else localStorage.removeItem(KEY_LS);
    } catch (e) {}
  }
  function clearKey() { try { localStorage.removeItem(KEY_LS); } catch (e) {} }

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
    ['gradeKey', 'gradeName', 'stage', 'topicId', 'count', 'customCount', 'reasoning', 'qtype', 'structure', 'mode'].forEach(function (k) {
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
      gradeName: meta && meta.gradeName ? meta.gradeName : (cfg.gradeName || ''),
      topicLabel: meta && meta.title ? meta.title : '',
      count: (papers || []).reduce(function (s, p) { return s + (p.blanks ? p.blanks.length : 0); }, 0),
      papersCount: (papers || []).length,
      cfg: sanitizeCfg(cfg),
      meta: { title: (meta && meta.title) || 'AI 出题', gradeName: (meta && meta.gradeName) || (cfg.gradeName || '') },
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
      '一、语法填空命题规则（上海命题风格 · 初高中通用）：',
      '1. 每篇语篇约 10 空；约 4-5 空为有提示词（多为动词变形/词性转换），约 5-6 空为无提示词（介/连/冠/代/从句连接词等）。',
      '2. 全部空必须嵌入自然、连贯、有主题的完整语篇（说明文/议论文/科普/叙事）。禁止孤立单句堆题。',
      '3. 难度主要来自语法结构与上下文语境，禁止用生僻词/超纲词/怪文化背景制造难度。',
      '4. 禁止时间词直给答案式题目；时态题要靠语境判断，不机械用 yesterday/since/already。',
      '二、有提示词规则：主要考时态/语态/主谓一致/非谓语/词性转换。若是非谓语，必须符合真实句法（分句是否已有谓语、主动被动、先后完成），禁止为覆盖 having done/to have done 等强行塞入。',
      '三、无提示词规则：主要考定语从句/名词性从句/状语从句连接词、介词、冠词、代词、并列连词、whether/that/what/however 等。',
      '四、what vs that：若答案 what，其从句必须缺成分；若答案 that，从句必须完整；不许出两可题。',
      '五、however：仅以 however+adj/adv+主语+谓语 的让步结构出现，且语境自然；不许硬凑。',
      '六、答案必须唯一；每个空都必须给出学生能看懂的中文解析（为什么是这个形式、为什么不是别的、句子主干/从句成分如何判断）。',
      '七、输出必须为严格合法 JSON（不要 Markdown、不要 ``` 围栏、不要前后说明文字）。'
    ].join('\n');
  }

  /* ---------- 年级/专题动态描述 ---------- */
  function gradeRule(gradeKey) {
    var map = {
      g1: '高一（初高中过渡+基础建立）：句子主干明显，从句数量少，词汇为高中基础词。有提示词以基础时态（一般现在/过去/将来/进行/现在完成）、基础被动、主谓一致、to do/doing/done、adj↔adv、名词单复数为重点；无提示词以基础定语从句(which/who/where/when)、简单状语从句、简单名词性从句、基础介词/冠词/代词/并列连词为限。高频易错：现在完成vs一般过去、adj/adv、a/an、基础从句连接词。',
      g2: '高二（真正高中综合）：句子变长、允许从句与结构嵌套。有提示词加入过去完成、时态语态综合、上下文时态、having done/to have done/being done/to be done、非谓语作定语状语、比较级最高级、否定前缀；无提示词加入三大从句综合、what/that、however让步、介词语义、抽象名词具体化等。重点训练拆句子主干。',
      g3: '高三（完全综合冲刺，对标春考/秋考/一模/二模）：全时态全语态、隐蔽主谓一致、全套非谓语含完成被动式、复杂词性转换；无提示词做三大从句深度综合、从句嵌套、what/that/whose/where、复杂介词、抽象名词具体化、代词指代、并列逻辑。即使单句看懂也不一定做对，必须结合全文逻辑。'
    };
    return map[gradeKey] || map.g1;
  }

  function topicDistRule(topicId, gradeKey) {
    if (!topicId || topicId === 'all') {
      var weights = gradeKey === 'g3'
        ? '谓语动词/非谓语/从句/词性/虚词都要有，但按高考实际占比安排：非谓语、谓语时态语态、三大从句(尤其名词性从句 what/that)、词性转换是主体；介词、冠词、代词、连词穿插。不要 10 空机械均分。'
        : gradeKey === 'g2'
          ? '以谓语时态语态综合、非谓语、三大从句、词性转换为主体，介词/冠词/代词/连词穿插，what/that 与 however 可适量出现。'
          : '以时态、基础非谓语、简单词性转换、基础从句与虚词为主体，按上海实际重要程度分配，不要机械均分。';
      return '训练范围：全部（自动按上海实际重要程度 + 年级难度合理分布）。' + weights;
    }
    return '训练范围：主要围绕「' + topicId + '」这一专题出题；同一语篇内该专题考点应有多个知识点分布，并结合谓语/从句等作自然背景，保持语篇自然；不可 10 空全是同一形式。';
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
    var finalCount = targetCount;
    var structure = cfg.structure || 'mixed';
    var lines = [];
    lines.push('你是一名熟悉上海地区英语考试命题特点的英语教师和语法填空命题者（初高中通用）。');
    lines.push('');
    lines.push('任务：根据以下配置生成符合上海命题风格的语法填空题（难度按所选年级调节）：');
    lines.push('- 年级：' + (cfg.gradeName || '高一'));
    lines.push('- 专题：' + catName);
    lines.push('- 结构：' + (structure === 'sentence' ? '纯单句题（无语篇）' : structure === 'passage' ? '纯语篇题（无单句）' : '单句题 + 语篇题（推荐，仿上海高一作业：几个句子 + 一篇文章）'));
    lines.push('- 语篇数量：' + (structure === 'sentence' ? '0 篇' : papersN + ' 篇（本批共约 ' + finalCount + ' 空，每篇不超过 10 空）'));
    lines.push('- 总空数：' + finalCount);
    lines.push('');
    lines.push(topicDistRule(cfg.topicId, cfg.gradeKey));
    lines.push('');
    lines.push('年级难度要求：' + gradeRule(cfg.gradeKey));
    lines.push('');
    lines.push(shanghaiRulesText());
    lines.push('');
    lines.push('九、单句题规则（structure 含“单句”时必出）：每个单句是独立的完整句子，句中给出一个高频动词（如 take / learn / tell / get / come / go / make / spend / leave / fail / feel / have 等），要求学生根据该句的时间状语/语境把该词改成正确形式——一般现在时、一般过去时、现在/过去进行时、现在/过去完成时、一般将来时、被动语态、非谓语(to do/doing/done)、词性转换等，覆盖时态/语态/主谓一致/非谓语；每句 1 个空（个别可 2 个空）；必须有明确语境线索（如 these days / at that time / by then / since / tomorrow / look! 等）且答案唯一。单句正文只写 ____ 空标，不要写括号原词；原词只放 givenWord 字段，违者仅保留一份。');
    if (structure !== 'sentence') {
      lines.push('');
      lines.push('十、结构分配（structure=mixed 时）：单句部分与语篇部分都要有；单句空数约占总空数一半（每句 1-2 空），语篇 1~2 篇（每篇约 5-10 空）。');
    }
    lines.push('自检要求（输出前在心里过一遍）：答案唯一；无 what/that 两可；非谓语真需要判断；时态靠上下文；however 只按让步结构且自然；文章自然连贯有主题；难度与年级匹配；10 空分布接近 4-5 有提示词 + 5-6 无提示词；同一考点不过度重复。');
    lines.push('');
    lines.push('【关键】正文 passage 里每一个空必须用 ____（恰好 4 个下划线）标出，下划线数量必须与 blanks 数量一致；禁止把答案词写进正文——正文里只出现下划线，答案只能写在 blanks.answer / options 里。');
    if (cfg.qtype === 'input') {
      lines.push('');
      lines.push('八、输出题型：填空输入题（无选项）。每个空只给 answer 与 givenWord，不输出 options 字段。');
    } else {
      lines.push('');
      lines.push('八、输出题型：选择题（点选，n 选 1；学生不做任何打字）。这是本组最关键的要求：');
      lines.push('  1. 每个空除 answer 外，必须再输出 options：选项个数由你按该考点自然能给出几个“合理干扰项”自行决定——4~6 个均可（不必固定 6 个，3 个也可但尽量 ≥4）；');
      lines.push('  2. options 中恰好 1 个与 answer 完全一致（比较时 trim 掉首尾空格且忽略大小写），即正确项；');
      lines.push('  3. 其余选项必须是“真实常见、看似合理”的干扰项——针对该考点的典型错误（错误时态/语态/非谓语形式/词形/单复数、错误连接词、介词、冠词多漏误、代词误用、易混逻辑词等）；');
      lines.push('  4. 干扰项禁止与正确答案或彼此重复，禁止明显荒谬，禁止出现“两个都能说通”的选项；');
      lines.push('  5. 选项文本只写答案形式本身（不加解释）。');
      lines.push('  空对象示例（本空给 5 个选项，即 5 选 1）：{"answer":"has been built","options":["has been built","has built","was built","is building","has been building"],"givenWord":"build","isGivenWord":true,"type":"tense","knowledgePoint":"现在完成时被动语态","category":"谓语动词","explanation":"主语是 building，与 build 是被动关系；by 2025 提示到说话时已完成，故用现在完成时被动 has been built。","difficulty":2}');
    }
    lines.push('');
    lines.push('输出 JSON 结构（严格按此，不要输出任何其它文字）：');
    var schema = { grade: '高一' };
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
              type: 'nonfinite|tense|wordform|clause|prep|article|pronoun|conjunction|other',
              knowledgePoint: '具体知识点，如 having done',
              category: '谓语动词|非谓语动词|词性转换|定语从句|名词性从句|状语从句|介词|冠词|代词|并列与逻辑|其他/拓展',
              explanation: '面向高一学生、能看懂的中文解析：为什么是这个形式/为什么不是别的形式/怎么从句子结构和上下文判断',
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
              type: 'tense|passive|nonfinite|wordform|agreement',
              knowledgePoint: '具体知识点，如 一般过去时 / 现在进行时 / 现在完成时被动',
              category: '谓语动词|非谓语动词|词性转换',
              explanation: '面向高一学生、能看懂的中文解析：为什么是这个形式/为什么不是别的形式/怎么从时间状语或语境判断',
              difficulty: 1
            }
          ]
        }
      ];
    }
    lines.push(JSON.stringify(schema, null, 2));
    return lines.join('\n');
  }

  /* ---------- DeepSeek 调用（唯一入口） ---------- */
  function callDeepSeek(promptText, cfg) {
    var key = cfg.apiKey || getKey();
    if (!key) return Promise.reject({ code: 'NO_KEY', msg: '请先输入 DeepSeek API Key。' });
    var modelId = modelIdOf(cfg);
    var body = {
      model: modelId,
      messages: [
        { role: 'system', content: '你是英语语法填空命题引擎（上海命题风格 · 初高中通用）。只输出严格合法的 JSON，不要输出任何解释文字、Markdown 或代码围栏。' },
        { role: 'user', content: promptText }
      ],
      temperature: 0.7,
      stream: false
    };
    var ctrl = null;
    if (typeof AbortController !== 'undefined') { ctrl = new AbortController(); }
    var timeoutMs = 90000;
    var timer = null;
    if (ctrl) timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);
    return fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (resp) {
      if (timer) clearTimeout(timer);
      if (!resp.ok) {
        if (resp.status === 401) throw { code: 'BAD_KEY', msg: 'DeepSeek API Key 无效，请检查后重试。' };
        if (resp.status === 429) throw { code: 'RATE', msg: '请求太频繁或余额不足，稍后再试。' };
        throw { code: 'HTTP_' + resp.status, msg: 'API 返回错误（' + resp.status + '），请重试。' };
      }
      return resp.json();
    }).then(function (json) {
      var txt = '';
      try {
        txt = json.choices && json.choices[0] && (json.choices[0].message.content || '');
      } catch (e) { txt = ''; }
      if (!txt) throw { code: 'EMPTY', msg: 'AI 返回内容为空，请重试。' };
      return txt;
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      if (err && err.code) throw err;
      if (err && err.name === 'AbortError') throw { code: 'TIMEOUT', msg: '请求超时，请重试。' };
      throw { code: 'NET', msg: '网络请求失败，请检查网络连接后重试。' };
    });
  }

  /* ---------- JSON 容错提取 ---------- */
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
          id: 'ai_' + (cfg.gradeKey || 'g1') + '_' + genId + '_' + kind.slice(0, 1) + pi + '_b' + (b.n || idx),
          source: 'ai',
          isAI: true,
          aiMeta: {
            gradeKey: cfg.gradeKey, gradeName: cfg.gradeName,
            stage: cfg.stage, topicId: cfg.topicId === 'all' ? 'all' : (cfg.topicId || 'all'),
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
      gradeKey: 'g1', gradeName: '高一',
      stage: '1', topicId: 'all',
      count: 10, customCount: 15,
      apiKey: getKey(), rememberKey: !!getKey(),
      reasoning: 'low', modelUi: MODELS[0].ui,
      qtype: 'choice', structure: 'mixed'
    };
  }

  window.EGL = window.EGL || {};
  EGL.ai = {
    MODELS: MODELS,
    API_URL: API_URL,
    defaultConfig: defaultConfig,
    getKey: getKey, saveKey: saveKey, clearKey: clearKey,
    cacheSession: cacheSession, readCachedSession: readCachedSession, clearCachedSession: clearCachedSession,
    getPool: getPool, pushToPool: pushToPool, removeFromPool: removeFromPool, clearPool: clearPool,
    buildPrompt: buildPrompt,
    callDeepSeek: callDeepSeek,
    extractJSON: extractJSON,
    validateAndNormalize: validateAndNormalize,
    papersToQuestions: papersToQuestions
  };
})();
