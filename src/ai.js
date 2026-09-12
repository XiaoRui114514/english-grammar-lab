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
    { ui: 'DeepSeek V4 Flash（默认·快）', id: 'deepseek-flash', note: '对应 deepseek-flash' },
    { ui: 'DeepSeek V4 Pro（强推理·更慢更贵）', id: 'deepseek-v4-pro', note: '对应 deepseek-v4-pro' }
  ];
  // 推理等级：低=Flash（快）、高=V4 Pro（强推理），与 UI 的两个选择一一对应
  var REASON = { low: 'deepseek-flash', medium: 'deepseek-flash', high: 'deepseek-v4-pro' };

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
    ['topicId', 'count', 'customCount', 'reasoning', 'qtype', 'structure', 'mode'].forEach(function (k) {
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
      '2. 语篇题每篇约 10 空：有提示词约 4-5 空（动词变形/词性转换等），无提示词约 5-6 空（介词/连词/冠词/代词/从句连接词等），整套练习保持接近这一比例（纯单句模式不受此条限制）。',
      '3. 难度来自语法结构与上下文逻辑，词汇限定在初高中课标范围：禁止生僻词、超纲词和陌生文化背景；禁止“时间词直给答案”的送分题，时态语态必须由上下文推断。',
      '二、考点规则',
      '4. 有提示词：时态、语态、主谓一致、非谓语（to do/doing/done/完成式/被动式）、词性转换（adj↔adv、名词单复数与派生、比较级最高级、否定前缀等）。',
      '5. 无提示词：三大从句连接词（定语/名词性/状语从句）、what 与 that、介词、冠词、代词、并列与逻辑衔接词（and/but/or/so/however 等）。',
      '6. 答案唯一：每个空有且只有一个正确答案，禁止“填 A 填 B 都说得通”的两可题；what 的从句必须缺成分、that 的从句必须完整，if/whether、which/where 等同理。',
      '7. 非谓语必须真实需要判断：先看分句有没有谓语，再判断主动/被动与动作先后，禁止为覆盖 having done、to have done 等形式强行塞入。',
      '8. however 只以 however + adj/adv + 主语 + 谓语 的让步结构自然出现，禁止硬凑。',
      '9. 同一篇内考点要分散：相邻两空不考同一知识点，同一知识点全篇最多出现 2 次。',
      '三、解析规则',
      '10. 每个空都要给出学生能看懂的中文解析，讲清三点：①为什么是这个答案（语法依据+语境线索）；②为什么不是其它形式（对比易错项）；③做题时如何一步步判断（找句子主干、看从句成分、联系上下文）。解析要具体，禁止“固定搭配”“语感如此”之类空话。',
      '四、输出格式规则（违反会导致程序无法读取）',
      '11. 只输出一个 JSON 对象：不要 Markdown、不要 ```json 代码块、不要任何解释、注释或前后说明，响应必须以 { 开头、以 } 结尾。',
      '12. 正文中的每个空都用 4 个下划线 ____ 标出，____ 的个数必须与 blanks 数组长度完全一致；正文里绝对不能出现答案词，答案只写在 blanks 里。',
      '13. 字段名与取值严格按下方 JSON 模板，不新增、不删减字段；字符串内不要出现未转义的引号，不要写尾逗号。'
    ].join('\n');
  }

  /* ---------- 专题分布动态描述 ---------- */
  function topicDistRule(topicId, catName) {
    if (!topicId || topicId === 'all') {
      return '训练范围：全部大专题。按上海卷实际重要程度分布：谓语动词（时态/语态/主谓一致）、非谓语动词、三大从句（尤其名词性从句 what/that）、词性转换为主体，介词/冠词/代词/并列逻辑穿插出现；不要 10 空机械均分。';
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
    lines.push('- 语篇数量：' + (structure === 'sentence' ? '0 篇' : papersN + ' 篇（每篇不超过 10 空）'));
    lines.push('- 总空数：' + targetCount + '（整套练习的空数之和）');
    lines.push('');
    lines.push(topicDistRule(cfg.topicId, catName));
    lines.push('');
    lines.push(shanghaiRulesText());
    lines.push('');
    lines.push('五、单句题规则（structure 含“单句”时必出）：每个单句都是独立完整的句子，句中给出一个高频动词原形（如 take / learn / tell / get / come / go / make / spend / leave / fail / feel / have 等），要求学生按句中的时间状语与语境改成正确形式——一般现在时、一般过去时、现在/过去进行时、现在/过去完成时、一般将来时、被动语态、非谓语（to do/doing/done）、词性转换等，覆盖时态/语态/主谓一致/非谓语；每句 1 个空（个别可 2 个空）；必须有明确语境线索（如 these days / at that time / by then / since / tomorrow 等）且答案唯一。单句正文只写 ____ 空标，不写括号原词；原词只放 givenWord 字段。');
    if (structure === 'mixed') {
      lines.push('');
      lines.push('六、结构分配：单句部分与语篇部分都要有；单句空数约占总空数一半（每句 1-2 空），语篇 1~2 篇（每篇 5~10 空）。');
    }
    lines.push('');
    lines.push('输出前自检（在心里过一遍，不要写出来）：空数是否为 ' + targetCount + '；____ 的个数是否与 blanks 数量一致；答案是否唯一；有没有 what/that 两可；非谓语是否真的需要判断；时态是否靠上下文；文章是否连贯；考点是否过度重复；解析是否三点齐全。');
    if (cfg.qtype === 'input') {
      lines.push('');
      lines.push('七、输出题型：填空输入题（无选项）。每个空只给 answer 与 givenWord，不输出 options 字段。');
    } else {
      lines.push('');
      lines.push('七、输出题型：点选选择题（n 选 1，学生只点不打字），这是本组最关键的要求：');
      lines.push('  1. 每个空除 answer 外必须输出 options：选项个数由该考点自然能给出的合理干扰项决定，4~6 个（最少 3 个）；');
      lines.push('  2. options 中恰好 1 个与 answer 完全一致（忽略首尾空格与大小写），即正确项；');
      lines.push('  3. 其余选项必须是针对该考点的典型错误：错误时态/语态/非谓语形式/词形变化/单复数、错误连接词、错误介词、冠词多漏误、代词误用、易混逻辑词等；');
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
              type: 'nonfinite|tense|wordform|clause|prep|article|pronoun|conjunction|other',
              knowledgePoint: '具体知识点，如 having done',
              category: '谓语动词|非谓语动词|词性转换|定语从句|名词性从句|状语从句|介词|冠词|代词|并列与逻辑|其他/拓展',
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
              type: 'tense|passive|nonfinite|wordform|agreement',
              knowledgePoint: '具体知识点，如 一般过去时 / 现在进行时 / 现在完成时被动',
              category: '谓语动词|非谓语动词|词性转换',
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

  /* ---------- DeepSeek 调用（唯一入口） ---------- */
  function callDeepSeek(promptText, cfg) {
    var key = cfg.apiKey || getKey();
    if (!key) return Promise.reject({ code: 'NO_KEY', msg: '请先输入 DeepSeek API Key。' });
    var modelId = modelIdOf(cfg);
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
