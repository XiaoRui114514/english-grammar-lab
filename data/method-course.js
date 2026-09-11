/* ============================================================
 * data/method-course.js — 语法填空 · 解题方法课（上海命题风格，初高中通用）
 * 这是"自学课程"模块：不堆术语，先懂怎么做题，再进专题练。
 * ============================================================ */
(function () {
  'use strict';

  var COURSE = {
    id: 'method',
    title: '上海语法填空 · 解题方法课',
    icon: '🧭',
    intro: '做题顺序比单点语法知识更重要。下面 5 步，先读一遍，再去做任何一篇 10 空语篇练习时照做。',
    steps: [
      {
        no: 1, title: '先通读全文（30秒）',
        goal: '先确定：文章讲什么、时间背景在哪、叙述主体是谁、全文时态基调是什么。',
        why: '上海卷经常不靠 yesterday/since/already 直给答案，而是靠整篇的时间线索。不看全文就填，最容易把时态判断错。',
        do: [
          '扫一眼首段和结尾，搞清主题与体裁（故事/说明文/议论文）。',
          '圈出时间线索词（不只有 yesterday，还有 now/then/later/at that time/by 2005…）。',
          '先不看空，把文章能读懂的部分读顺，让"语感基调"先建立。'
        ],
        example: '一篇回忆过去的小故事开头 usually 出现过去时基调；中间出现 today/now 才可能切回现在。',
        tip: '时态基调不是每一句相同，但文章通常有一个主基调。'
      },
      {
        no: 2, title: '遇到"给词空"：先问是不是要谓语',
        goal: '检查这个分句是否已经有谓语。',
        why: '上海填空第一大失分点：该用非谓语的地方填了谓语，或反之。判断顺序：先"谓语 or 非谓语"，再想形式。',
        do: [
          '找这个空所在分句的主语与谓语。',
          '若分句已有一个真正的谓语（含 be 动词/实义动词），这个空一般不能再来一个谓语 → 非谓语（to do/doing/done…）。',
          '若分句还没有谓语 → 考时态/语态/主谓一致。'
        ],
        example: 'The problem ______ (solve) at the meeting yesterday 中分句缺谓语 → was solved（被动+过去）。',
        example2: 'The problem ______ (solve) at yesterday\u2019s meeting drew wide attention 中已有谓语 drew → 空处应填非谓语 solved（过去分词作后置定语）。',
        tip: '一句话里"谓语只能有一个主干"——先数谓语，再决定空怎么填。'
      },
      {
        no: 3, title: '遇到"不给词空"：先问句子完整吗',
        goal: '判断句子/从句缺不缺成分，决定填连接代词还是功能词。',
        why: '无提示词空主要考：从句连接词、介词、冠词、代词、并列连词。最关键是判断"成分缺不缺"。',
        do: [
          '把空前后读成一个分句。',
          '分句缺主语/宾语/表语 → 考虑 what/which/who/whom（连接代词，自己在从句里充当成分）。',
          '分句完整 → 考虑 that/whether/where/when/why/how（连接词，只连接不充当成分），或介词/冠词/代词/连词。'
        ],
        example: '缺成分：___ we need most is practice → what。',
        example2: '不缺成分：The news ___ he won the prize excited us → that。',
        tip: 'what=从句里缺东西；that=从句是完整的。这条几乎每次都能救命。'
      },
      {
        no: 4, title: '分析从句：缺不缺成分定关系词',
        goal: '定语从句：关系代词 vs 关系副词，看从句内部。',
        why: 'where/when/why 常被误用成 which/that，反之亦然。判断不看先行词，看从句里缺什么。',
        do: [
          '找到先行词与从句。',
          '从句缺主语或宾语 → who/whom/which/that/whose。',
          '从句不缺主宾、只缺地点/时间/原因状语 → where/when/why。',
          '特别注意：有些"地点/时间"词后面从句不缺状语，仍要用 that/which（如 the hotel which she stayed at…里 at 在从句中作宾语）。'
        ],
        example: 'This is the lab ___ we did the experiment → where（从句 we did the experiment 完整，缺地点状语）。',
        example2: 'This is the lab ___ was built last year → which/that（从句缺主语）。',
        tip: '别一看到 the place 就填 where——先还原从句看缺不缺成分。'
      },
      {
        no: 5, title: '最后检查 8 项',
        goal: '填完后再快速复查，拦下低级失分。',
        why: '很多 1 分丢在"忘了三单加 s / 忘了被动 / 冠词漏了 the"。',
        check: [
          '时态与上下文基调一致？',
          '语态：动作承受者做主语要被动？',
          '主谓一致：三单加 s？',
          '名词单复数与冠词（a/an/the/零冠词）配了吗？',
          '词性：修饰名词用 adj，修饰动词/整句用 adv？',
          '非谓语：主动/被动、完成/未完成，选对了吗？',
          '介词与固定搭配对吗？',
          '整句逻辑（并列/转折/因果）对吗？'
        ]
      }
    ],
    fiveTrapTips: [
      { id: 'verb-vs-nonfinite', name: '谓语 vs 非谓语', text: '先数谓语：分句已有谓语，空处再填谓语就是病句。给词空第一个问题永远是"这里要不要一个谓语"。' },
      { id: 'what-vs-that', name: 'what vs that', text: 'what=从句里缺成分，that=从句完整。把空后从句还原读一遍就能分辨。' },
      { id: 'context-tense', name: '语境时态', text: '别一看到 yesterday/ago 就机械用一般过去；如果强调"当时正在进行"或"到过去某点前已完成"，要选过去进行/过去完成。' },
      { id: 'however', name: 'however 让步句', text: 'however 后接 adj/adv + 主语 + 谓语，表示"无论多么…"。不是"但是"的 however（那是连词，逗号后独立成句）。' },
      { id: 'a-vs-an', name: 'a / an', text: '看音素不是看字母：an hour（h 不发音），a university（发 /juː/）。' },
      { id: 'adj-vs-adv', name: 'adj vs adv', text: '看它修饰什么：修饰名词→形容词；修饰动词/形容词/副词/整句→副词。表语位置常要形容词。' }
    ]
  };

  window.__EGL_METHOD_COURSE__ = COURSE;
})();
