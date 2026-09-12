/* ============================================================
 * ui-ai.js — AI 出题界面 + 生成编排
 * 交互：视图级事件委托（只绑一次，重绘不失效、配置实时读）；
 * 生成：点击后切换独立"出题进度页"，分阶段日志 + 完成/失败结果。
 * ============================================================ */
(function () {
  'use strict';
  var E = window.EGL, U = E.u;
  var $ = U.$, $$ = U.$$, el = U.el, esc = U.esc;

  var LS_CFG = 'EGL_AI_CFG_v1';
  var _curCfg = null;    // 当前配置（重绘后委托回调仍读最新）
  var _lastCfg = null;   // 最近生成配置（重试/再生成复用）
  var _genLive = null;   // 生成期状态 {stopped:false}
  var _keyCache = '';    // 实时 Key 输入缓存（密码框可能被浏览器重绘/接管，不再回查 DOM.value）

  function cur() { return window.__EGL_CURRICULUM__; }
  function categoryList() { return cur() ? cur().categories : []; }
  function loadCfg() {
    var d = E.ai.defaultConfig();
    try {
      var raw = localStorage.getItem(LS_CFG);
      if (raw) {
        var p = JSON.parse(raw);
        for (var k in p) if (p.hasOwnProperty(k)) d[k] = p[k];
      }
    } catch (e) {}
    d.apiKey = E.ai.getKey();
    // 兼容旧版本保存的模型名（旧模型标签 → 新标签，避免下拉框与真实调用不一致）
    if (d.modelUi !== E.ai.MODELS[0].ui && d.modelUi !== E.ai.MODELS[1].ui) {
      d.modelUi = (d.reasoning === 'high') ? E.ai.MODELS[1].ui : E.ai.MODELS[0].ui;
    }
    return d;
  }
  function saveCfg(cfg) {
    var c = { topicId: cfg.topicId, count: cfg.count, customCount: cfg.customCount,
              reasoning: cfg.reasoning, modelUi: cfg.modelUi, qtype: cfg.qtype, structure: cfg.structure };
    try { localStorage.setItem(LS_CFG, JSON.stringify(c)); } catch (e) {}
  }
  function appView() { return E.ui && E.ui.app ? E.ui.app.view : null; }
  function closestOf(node, sel) {
    while (node && node !== document) {
      if (node.matches && node.matches(sel)) return node;
      node = node.parentNode;
    }
    return null;
  }

  /* ================= 页面 ================= */
  function aiPage() {
    var v = appView();
    if (!v) return;
    var cfg = loadCfg();
    _curCfg = cfg;
    // Key 输入缓存与配置同步：本次会话已输入的 Key 优先保留（切换题型/结构重绘不清空）
    if (!_keyCache) _keyCache = (typeof cfg.apiKey === 'string') ? cfg.apiKey : '';
    cfg.apiKey = _keyCache;
    v.innerHTML = '';
    v.appendChild(el('div', '', '<div class="page-title"><span class="ico">🤖</span>AI 出题 · 语法填空</div>'
      + '<div class="page-sub">按“专题 × 题数 × 结构”生成完整练习（初高中通用）；结果进入原做题界面，判分/解析/错题/统计全部通用。</div>'));

    var panel = el('div', 'glass', '');
    panel.style.padding = '18px';
    panel.innerHTML = '<div class="sec-title" style="margin-top:0">生成配置</div>';
    v.appendChild(panel);
    renderForm(panel, cfg);

    var btnRow = el('div', '', '<div class="btn-row" style="margin-top:16px">'
      + '<button type="button" class="btn block" id="aiGo">🤖 开始生成语法填空</button></div>');
    v.appendChild(btnRow);

    ensureBound(v);      // 视图级委托：只绑一次
    renderPool(v);       // AI 出题记录列表
  }

  /* 视图容器挂一次委托；回调里读 _curCfg（每次 aiPage 更新） */
  function ensureBound(v) {
    if (v.__aiBound) return;
    v.__aiBound = true;
    v.addEventListener('click', function (ev) {
      var cfg = _curCfg;
      if (!cfg) return;
      var target = ev.target;
      try {
        var cBtn = closestOf(target, '[data-count]');
        if (cBtn) {
          var cval = cBtn.dataset.count;
          cfg.count = cval === 'custom' ? (cfg.customCount || 15) : parseInt(cval, 10);
          $$('[data-count]', v).forEach(function (x) { x.classList.toggle('on', x.dataset.count === cval); });
          var cinp = $('input[data-f=customCount]', v);
          if (cinp) cinp.style.display = cval === 'custom' ? '' : 'none';
          saveCfg(cfg);
          return;
        }
        var qt = closestOf(target, '[data-qtype]');
        if (qt) {
          var qv = qt.dataset.qtype === 'input' ? 'input' : 'choice';
          if (cfg.qtype === qv) return;
          cfg.qtype = qv;
          saveCfg(cfg);
          aiPage();
          return;
        }
        var stX = closestOf(target, '[data-struct]');
        if (stX) {
          var sv = stX.dataset.struct === 'sentence' ? 'sentence' : stX.dataset.struct === 'passage' ? 'passage' : 'mixed';
          if (cfg.structure === sv) return;
          cfg.structure = sv;
          saveCfg(cfg);
          aiPage();
          return;
        }
        var go = closestOf(target, '#aiGo');
        if (go) {
          // 优先使用输入缓存（最可靠）；其次已存 Key
          var keyVal = (_keyCache && _keyCache.length) ? _keyCache : (cfg.apiKey || '');
          keyVal = keyVal.trim();
          if (!keyVal) { U.toast('请先输入 DeepSeek API Key', 'bad'); return; }
          var cbx2 = $('[data-ai=rememberKey]', v);
          var remember = !!(cbx2 && cbx2.checked);
          cfg.apiKey = keyVal;
          cfg.rememberKey = remember;
          E.ai.saveKey(keyVal, remember);
          saveCfg(cfg);
          _lastCfg = cfg;
          startGeneration(cfg);
          return;
        }
        var pgo = closestOf(target, '[data-pool-go]');
        if (pgo) {
          var pid = pgo.dataset.id;
          var entry = (E.ai.getPool() || []).filter(function (e) { return e.id === pid; })[0];
          if (!entry || !entry.questions || !entry.questions.length) { U.toast('该记录没有可做题，请删除后重新生成', 'bad'); return; }
          var m = entry.meta || {};
          m.mode = pgo.dataset['poolGo'];
          E.quiz.startAI(entry.questions, m);
          return;
        }
        var pdel = closestOf(target, '[data-pool-del]');
        if (pdel) {
          // id 存在 data-pool-del 属性上（dataset.poolDel），不是 dataset.id
          var pid = pdel.dataset.poolDel || pdel.dataset.id;
          if (!pid) { U.toast('删除失败：缺少记录编号', 'bad'); return; }
          var existed = (E.ai.getPool() || []).some(function (e) { return e.id === pid; });
          E.ai.removeFromPool(pid);
          if (U.savedNotice) U.savedNotice();
          aiPage();
          U.toast(existed ? '已删除该组记录' : '该记录已不存在', existed ? 'ok' : 'bad');
          return;
        }
        var pclear = closestOf(target, '[data-pool-clear]');
        if (pclear) {
          U.confirmBox('清空 AI 题目列表', '将删除所有 AI 出题记录（含未做完的）。确定？', '清空', true).then(function (ok) {
            if (!ok) return;
            E.ai.clearPool();
            if (U.savedNotice) U.savedNotice();
            aiPage();
          });
        }
      } catch (err) { /* 交互异常不打断页面（AI 相关错误在生成流程内单独提示） */ }
    });

    v.addEventListener('change', function (ev) {
      var cfg = _curCfg;
      if (!cfg) return;
      var t = ev.target;
      try {
        // 用户正在输入 Key → 实时缓存（不依赖重查询 DOM）
        if (t && t.getAttribute && t.getAttribute('data-ai') === 'keyInput') {
          _keyCache = (t.value && typeof t.value === 'string') ? t.value : '';
          cfg.apiKey = _keyCache;
          return;
        }
        var f = t && t.dataset ? t.dataset.f : null;
        if (f) {
          cfg[f] = t.type === 'checkbox' ? !!t.checked : t.value;
          // 模型与推理等级是「同一设置」的两个视图：保持同步（模型决定真实 model id）
          if (f === 'reasoning') {
            cfg.modelUi = (cfg.reasoning === 'high') ? E.ai.MODELS[1].ui : E.ai.MODELS[0].ui;
            var mSel = $('[data-f=modelUi]', v);
            if (mSel) mSel.value = cfg.modelUi;
          } else if (f === 'modelUi') {
            cfg.reasoning = (cfg.modelUi === E.ai.MODELS[1].ui) ? 'high' : 'low';
            var rSel = $('[data-f=reasoning]', v);
            if (rSel) rSel.value = cfg.reasoning;
          }
          saveCfg(cfg);
          return;
        }
        if (t && t.getAttribute && t.getAttribute('data-ai') === 'rememberKey') {
          cfg.rememberKey = !!t.checked;
          // 用缓存或已存 Key，不再临时查 DOM（避免节点被替换导致 .value 缺失）
          var kkVal = (_keyCache && _keyCache.length) ? _keyCache : (cfg.apiKey || '');
          E.ai.saveKey(kkVal, cfg.rememberKey);
          saveCfg(cfg);
        }
      } catch (err) { /* 同上：设置项异常不打断交互 */ }
    });

    // input 事件（每次击键即触发）：Key 框被浏览器接管/重绘时缓存仍保持最新
    v.addEventListener('input', function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute) return;
      if (t.getAttribute('data-ai') === 'keyInput') {
        _keyCache = (t.value && typeof t.value === 'string') ? t.value : '';
      }
    });
  }

  /* ================= 表单渲染 ================= */
  function renderForm(panel, cfg) {
    var tHtml = '<div class="form-row"><label>专题</label><select data-f="topicId">';
    tHtml += '<option value="all"' + (cfg.topicId === 'all' ? ' selected' : '') + '>全部专题（自动合理分布）</option>';
    categoryList().forEach(function (c) {
      tHtml += '<option value="' + c.id + '"' + (cfg.topicId === c.id ? ' selected' : '') + '>' + c.icon + ' ' + c.name + '</option>';
    });
    tHtml += '</select></div>';

    var counts = [10, 20, 30];
    var nHtml = '<div class="form-row"><label>题目数量（空数）</label><div class="seg">';
    counts.forEach(function (n) {
      var on = cfg.count === n ? 'on' : '';
      nHtml += '<button type="button" data-count="' + n + '" class="' + on + '">' + n + '（' + (n / 10) + '篇）</button>';
    });
    var customOn = cfg.count !== 10 && cfg.count !== 20 && cfg.count !== 30 ? 'on' : '';
    nHtml += '<button type="button" data-count="custom" class="' + customOn + '">自定义</button></div>';
    nHtml += '<input type="number" data-f="customCount" min="5" max="60" step="5" value="' + (cfg.customCount || 15) + '"'
      + ' style="margin-top:8px;' + (customOn ? '' : 'display:none') + '">';
    nHtml += '</div>';

    // 题型：默认点选选择题（不打字）；可切填空输入
    var qtChoice = cfg.qtype !== 'input' ? ' on' : '';
    var qtInput = cfg.qtype === 'input' ? ' on' : '';
    var qtHtml = '<div class="form-row"><label>答题形式（默认点选，不用打字）</label><div class="seg">'
      + '<button type="button" data-qtype="choice" class="' + qtChoice + '">🔤 点选选择题（n 选 1，推荐）</button>'
      + '<button type="button" data-qtype="input" class="' + qtInput + '">✍️ 填空输入（打字）</button>'
      + '</div>'
      + '<div class="form-hint">点选模式：每个空给 3~6 个选项（A/B/C…），由 AI 按考点灵活决定个数；做错同样进错题本+中文解析。</div>'
      + '</div>';

    // 结构：单句 + 语篇（推荐，贴近上海卷考查方式）
    var stC = cfg.structure !== 'sentence' ? ' on' : '';
    var stS = cfg.structure === 'sentence' ? ' on' : '';
    var stP = cfg.structure === 'passage' ? ' on' : '';
    var structHtml = '<div class="form-row"><label>题目结构</label><div class="seg">'
      + '<button type="button" data-struct="mixed" class="' + stC + '">✏️ 单句 + 语篇（推荐）</button>'
      + '<button type="button" data-struct="sentence" class="' + stS + '">🔠 纯单句</button>'
      + '<button type="button" data-struct="passage" class="' + stP + '">📄 纯语篇</button>'
      + '</div>'
      + '<div class="form-hint">「单句」= 每题给一个提示词（动词按语境改成过去时/完成时/被动/非谓语等；形容词、副词改成比较级或最高级）；「语篇」= 整篇连贯文章挖空，满 10 空按“4 空给词 + 6 空纯空”配比。</div>'
      + '</div>';

    var key = _keyCache || cfg.apiKey || '';
    var pwdVal = key ? ('value="' + esc(key) + '"') : '';
    var kHtml = '<div class="form-row"><label>DeepSeek API Key（默认隐藏，仅供本页调用）</label>'
      + '<input type="password" id="aiKey" data-ai="keyInput" autocomplete="off" spellcheck="false" ' + pwdVal
      + ' placeholder="sk-…（在 platform.deepseek.com 获取）">'
      + '<div class="form-hint">Key 仅用于当前页面调用；勾选记住后保存在浏览器本地，请勿在公用电脑勾选。</div>'
      + '<label class="ck-row"><input type="checkbox" data-ai="rememberKey"' + (cfg.rememberKey ? ' checked' : '') + '>'
      + '<span>记住 API Key（默认不记，关闭页面即不保留）</span></label>'
      + '</div>';

    var mHtml = '<div class="form-row"><label>模型</label><select data-f="modelUi">'
      + '<option' + (cfg.modelUi !== E.ai.MODELS[1].ui ? ' selected' : '') + '>' + E.ai.MODELS[0].ui + '</option>'
      + '<option' + (cfg.modelUi === E.ai.MODELS[1].ui ? ' selected' : '') + '>' + E.ai.MODELS[1].ui + '</option></select></div>'
      + '<div class="form-row"><label>推理等级</label><select data-f="reasoning">'
      + '<option value="low"' + (cfg.reasoning !== 'high' ? ' selected' : '') + '>低（默认·省时省钱）</option>'
      + '<option value="high"' + (cfg.reasoning === 'high' ? ' selected' : '') + '>高（更慢，用于难题）</option>'
      + '</select>'
      + '<div class="form-hint">“推理等级”通过模型切换实现（不向 API 发送不存在的参数）。</div></div>';

    panel.innerHTML += tHtml + nHtml + qtHtml + structHtml + kHtml + mHtml;

  }

  /* ================= AI 出题记录列表 ================= */
  function renderPool(v) {
    var pool = E.ai.getPool();
    var box = el('div', '');
    box.style.marginTop = '18px';
    if (!pool.length) {
      box.innerHTML = '<div class="glass" style="padding:14px 16px"><span class="faint small">📭 AI 出题记录会保存在这里（含未做完的），可随时继续或删除。</span></div>';
      v.appendChild(box);
      return;
    }
    box.innerHTML = '<div class="sec-title">🗂 AI 出题题目列表 <span class="faint" style="font-weight:500">（共 ' + pool.length + ' 组 · 自动保存）</span>'
      + '<button type="button" class="btn ghost sm" data-pool-clear="1" style="margin-left:auto">🗑 清空全部</button></div>';
    var listWrap = el('div', '');
    pool.forEach(function (it, idx) {
      var m = it.meta || {};
      // 旧记录标题里可能带“高一/高二/高三”，展示时统一去掉
      var title = String(m.title || it.topicLabel || ('AI 出题 ' + (idx + 1))).replace(/^AI · 高[一二三] · /, 'AI · ');
      var n = it.questions ? it.questions.length : (it.count || 0);
      var row = el('div', 'glass ai-rec-item');
      row.innerHTML = '<span class="t">🤖 ' + esc(title) + '</span>'
        + '<span class="badges">'
        + '<span class="badge gray">' + (it.date || '') + '</span>'
        + '<span class="badge blue">' + n + ' 空</span>'
        + '</span>'
        + '<span style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">'
        + '<button type="button" class="btn sm ghost" data-pool-go="normal" data-id="' + esc(it.id) + '">▶ 普通模式</button>'
        + '<button type="button" class="btn sm ghost" data-pool-go="blind" data-id="' + esc(it.id) + '">🎭 盲做</button>'
        + '<button type="button" class="btn sm danger" data-pool-del="' + esc(it.id) + '" style="box-shadow:none;padding:6px 12px">删除</button>'
        + '</span>';
      listWrap.appendChild(row);
    });
    box.appendChild(listWrap);
    v.appendChild(box);
  }

  /* ================= 生成进度页 ================= */
  function startGeneration(cfg) {
    var v = appView();
    if (!v) return;
    _lastCfg = cfg;
    _genLive = { stopped: false };
    // 切换到独立进度页
    v.innerHTML = '';
    var card = el('div', 'glass', '');
    card.style.padding = '24px';
    card.innerHTML = '<div class="page-title"><span class="ico">🤖</span>AI 出题中</div>'
      + '<div class="page-sub" id="genSummary"></div>'
      + '<div style="margin:18px 0 12px"><div class="pbar" id="genBar"><i style="width:3%"></i></div></div>'
      + '<div id="genLog" style="min-height:130px;font-size:15px;line-height:2"></div>'
      + '<div class="btn-row" style="margin-top:16px">'
      + '<button type="button" class="btn ghost" data-gen="back">← 返回配置</button>'
      + '</div>';
    v.appendChild(card);
    v.addEventListener('click', function genBack(ev) {
      var btn = closestOf(ev.target, '[data-gen=back]');
      if (!btn) return;
      v.removeEventListener('click', genBack);
      if (_genLive) _genLive.stopped = true; // 返回后不再自动跳题
      aiPage();
    });

    var catName = '全部专题';
    if (cfg.topicId && cfg.topicId !== 'all') {
      var c = cur().category ? cur().category(cfg.topicId) : null;
      catName = c ? c.name : cfg.topicId;
    }
    var structBadge = cfg.structure === 'sentence' ? '纯单句' : cfg.structure === 'passage' ? '纯语篇' : '单句+语篇';
    $('#genSummary', v).innerHTML = '<span class="badge blue">' + esc(catName) + '</span> '
      + '<span class="badge gray">' + esc(structBadge) + '</span> '
      + '<span class="badge amber">' + (cfg.count || 10) + ' 空</span> '
      + '<span class="badge green">' + (cfg.qtype === 'input' ? '✍️ 填空输入' : '🔤 点选选择题') + '</span>';
    logLine(v, '🟣 正在分析命题要求…');
    runGeneration(cfg, v);
  }

  function logLine(v, html) {
    var lg = $('#genLog', v);
    if (!lg) return;
    lg.appendChild(el('div', '', html));
    if (lg.scrollTop !== undefined) lg.scrollTop = lg.scrollHeight;
  }
  function setBar(v, pct) {
    var bar = $('#genBar', v);
    if (bar) {
      var i = bar.querySelector('i');
      if (i) i.style.width = pct + '%';
    }
  }
  function stopped() { return !_genLive || _genLive.stopped; }

  function runGeneration(cfg, v) {
    var key = cfg.apiKey || E.ai.getKey();
    if (!key) { U.toast('请先输入 DeepSeek API Key', 'bad'); aiPage(); return; }
    var count = cfg.count || 10;
    var papersNeeded = Math.max(1, Math.ceil(count / 10));
    var allSections = [];
    var idx = 0;

    function nextPaper() {
      if (stopped()) return Promise.resolve(null);
      idx++;
      var n = idx === papersNeeded ? Math.max(1, count - (papersNeeded - 1) * 10) : 10;
      logLine(v, '⏳ 正在生成「单句+语篇」批次 ' + idx + '/' + papersNeeded + '（约 ' + n + ' 空）…');
      var cfg1 = {};
      for (var k in cfg) cfg1[k] = cfg[k];
      cfg1.count = n;
      var prompt = E.ai.buildPrompt(cfg1);
      return E.ai.callDeepSeek(prompt, cfg1).then(function (text) {
        if (stopped()) return null;
        logLine(v, '🟢 第 ' + idx + ' 批生成完成，正在校验…');
        var raw = E.ai.extractJSON(text);
        var sections = E.ai.validateAndNormalize(raw, cfg1);
        sections.forEach(function (s) { allSections.push(s); });
        setBar(v, 15 + Math.round((idx / papersNeeded) * 60));
        return sections.length ? null : Promise.reject({ code: 'EMPTY', msg: 'AI 未返回有效题目' });
      });
    }

    var chain = Promise.resolve();
    for (var i = 0; i < papersNeeded; i++) chain = chain.then(nextPaper);

    chain.then(function () {
      if (stopped()) return;
      var totalBlanks = allSections.reduce(function (s, p) { return s + p.blanks.length; }, 0);
      if (totalBlanks < Math.min(count, 5)) throw { code: 'COUNT', msg: '生成空数不足（' + totalBlanks + '），请重试。' };
      logLine(v, '🟣 正在转换题目结构…');
      var questions = E.ai.papersToQuestions(allSections, cfg);
      if (!questions.length) throw { code: 'SCHEMA', msg: 'AI 题目转换失败，请重试。' };
      setBar(v, 92);
      var catSel = cfg.topicId && cfg.topicId !== 'all'
        ? ' · ' + ((cur().category(cfg.topicId) || {}).name || cfg.topicId) : '';
      var structLabel = cfg.structure === 'sentence' ? '单句' : cfg.structure === 'passage' ? '语篇' : '单句+语篇';
      var meta = {
        mode: 'normal', title: 'AI · 语法填空(' + structLabel + ')' + catSel,
        icon: '🤖'
      };
      E.ai.cacheSession({ questions: questions, meta: meta, cfg: cfg, papers: allSections, totalBlanks: totalBlanks });
      E.ai.pushToPool(allSections, questions, cfg, meta);
      if (U.savedNotice) U.savedNotice();
      setBar(v, 100);
      finishPage(v, true, allSections.length, totalBlanks, questions, meta, null);
    }).catch(function (err) {
      if (stopped()) return;
      setBar(v, 100);
      finishPage(v, false, 0, 0, null, null, (err && err.msg) || '生成失败，请重试。');
    });
  }

  function finishPage(v, ok, papersN, blanksN, questions, meta, errMsg) {
    var lg = $('#genLog', v);
    if (!lg) return;
    if (ok) {
      lg.appendChild(el('div', '', '<div class="fb ok" style="margin-top:8px"><span class="big">✅</span>生成完成：'
        + papersN + ' 组（单句+语篇） · ' + blanksN + ' 空（已自动保存到「AI 出题题目列表」）</div>'));
      if (questions && questions.fallbackCount) {
        lg.appendChild(el('div', '', '<div class="fb bad" style="margin-top:6px">⚠️ ' + questions.fallbackCount
          + ' 空 AI 未给出选项，已按填空输入呈现（其余为点选）。可重试生成一次。</div>'));
      }
    } else {
      lg.appendChild(el('div', '', '<div class="fb bad" style="margin-top:8px"><span class="big">❌</span>' + esc(errMsg || '') + '</div>'));
    }
    var btnRow = el('div', 'btn-row');
    btnRow.style.marginTop = '14px';
    if (ok) {
      var start = el('button', 'btn ok', '📄 打开整篇卷面做题（全文+全部空）');
      start.type = 'button';
      start.addEventListener('click', function () {
        var m = meta || {};
        m.mode = 'normal';
        E.quiz.startAI(questions, m);
      });
      btnRow.appendChild(start);
    }
    var retry = el('button', 'btn', ok ? '再生成一组（同配置）' : '🔄 重试生成');
    retry.type = 'button';
    retry.addEventListener('click', function () {
      if (_lastCfg) startGeneration(_lastCfg);
      else aiPage();
    });
    btnRow.appendChild(retry);
    var toList = el('button', 'btn ghost', '🗂 查看 AI 出题列表');
    toList.type = 'button';
    toList.addEventListener('click', function () { aiPage(); });
    btnRow.appendChild(toList);
    lg.appendChild(btnRow);
    var vv = appView();
    if (vv) vv.scrollIntoView({ block: 'start' });
  }

  /* ================= 对外接口 ================= */
  function resumeIfAny() {
    var pool = E.ai.getPool();
    if (pool && pool.length && pool[0].questions && pool[0].questions.length) {
      return { questions: pool[0].questions, meta: pool[0].meta || {}, _pool: true };
    }
    var cached = E.ai.readCachedSession();
    if (!cached || !cached.questions || !cached.questions.length) return null;
    return cached;
  }
  function resumeTraining(mode) {
    var r = resumeIfAny();
    if (!r) return;
    var m = r.meta || {};
    m.mode = mode || 'normal';
    E.quiz.startAI(r.questions, m);
  }
  function regenerateLast(mode) {
    var cached = E.ai.readCachedSession();
    if (!cached || !cached.cfg) { E.ui.go('ai'); return; }
    E.quiz.startAI(cached.questions, {
      mode: mode || 'normal',
      title: (cached.meta && cached.meta.title) || 'AI 出题训练',
      icon: '🤖'
    });
  }
  function gotoConfig(catId) {
    var cfg = loadCfg();
    if (catId) cfg.topicId = catId;
    saveCfg(cfg);
    E.ui.go('ai');
  }

  E.aiUI = {
    aiPage: aiPage, resumeIfAny: resumeIfAny, resumeTraining: resumeTraining,
    regenerateLast: regenerateLast, gotoConfig: gotoConfig
  };
})();
