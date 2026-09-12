/* ============================================================
 * data/method-course.js — 语法填空 · 解题方法课（上海命题风格，初高中通用）
 * 上海卷 10 空 = 约 4 空有提示词 + 6 空无提示词：
 *   · 有提示词只有两种任务：动词（谓语/非谓语）、形容词/副词（比较级/最高级），不考词性转换；
 *   · 无提示词只有 5 类：连词 / 介词 / 冠词 / 代词 / 情态·助动词，每空 1 个单词。
 * 这是"自学课程"模块：先把做题顺序学明白，再进专题练。
 * ============================================================ */
(function () {
  'use strict';

  var COURSE = {
    id: 'method',
    title: '上海语法填空 · 解题方法课',
    icon: '🧭',
    intro: '上海卷固定 10 空：约 4 空有提示词（括号给词）+ 6 空无提示词（纯空格）。先记住两条铁律——有提示词只考动词变形与形副比较等级，不考词性转换；无提示词跑不出"连词 / 介词 / 冠词 / 代词 / 情态·助动词"这 5 类，且每空只填 1 个单词。下面 5 步就是固定做题顺序。',

    /* 上海卷结构速览（页面顶部卡片） */
    facts: [
      { k: '10 空结构', v: '约 4 空有提示词（括号给词）+ 6 空无提示词（纯空格），模考与真题都按这个配比出。' },
      { k: '有提示词（两类任务）', v: '① 括号给动词 → 谓语（时态/语态/主谓一致）或非谓语（to do / doing / done）；② 括号给形容词/副词 → 只考比较级、最高级，原词性不变。' },
      { k: '不考什么（重要）', v: '上海语法填空不考词性转换：不会给 care 让你写 carefully，也不考名词化、否定前缀、名词单复数变形。拿全国卷思路做上海题，第一步就会跑偏。' },
      { k: '无提示词（5 类）', v: '候选池固定为：连词、介词、冠词、代词、情态动词/助动词。排查优先级：连词 > 介词 > 冠词 > 代词 > 情态，每空只填 1 个单词。' }
    ],

    steps: [
      {
        no: 1, title: '先通读，数谓语（邪修地基）',
        goal: '30 秒通读全文：搞清文章讲什么、时间背景在哪，并数清每个分句的谓语动词。',
        why: '上海卷不靠 yesterday/since 直给答案，时态基调要从上下文推；而"这句话有几个谓语"直接决定后面所有判断：谓语出现 2 个以上就要考虑连词，本句已有谓语的空就只能填非谓语。谓语数错，后面全错。',
        do: [
          '扫一眼首段和结尾：主题是什么、讲的是谁、发生在什么时间。',
          '逐句圈谓语：动词带时态变形（is / was / has done / will do…）才是谓语；to do / doing / done 都不算谓语。',
          '圈时间线索：now / then / later / at that time / by 2005 / so far…，先定全文时态基调。',
          '长难句用"剥壳法"：两个逗号中间的插入语先划掉，剩下的主干立刻清楚。'
        ],
        example: '剥壳演示：The book, which was written in 1998, ______ (sell) well. 划掉插入语后只剩 The book ______ well：主语 book、本句缺谓语，再判时态与语态。',
        tip: '一句口诀：动词带时态变形 = 谓语；to do / doing / done = 非谓语。'
      },
      {
        no: 2, title: '括号给动词：先问"本句有没有谓语"',
        goal: '拿到括号动词，第一问不是时态，而是：这个分句已经有谓语了吗？',
        why: '这是上海有提示词的最高频考点。先判断"谓语 or 非谓语"，再想具体形式；顺序反了，形式几乎一定错。',
        do: [
          '本句没有谓语 → 填谓语：定时态（看全文基调与时态线索）+ 定语态（主动还是被动）+ 主谓一致。',
          '上海高频谓语：一般过去、现在完成、过去完成、被动 be done。',
          '本句已有谓语、又没有 and/but 等并列连词 → 填非谓语：to do（目的、将来）、doing（主动、伴随）、done（被动、完成）。',
          '逗号后面选非谓语：主动用 doing、被动用 done；表目的优先 to do。'
        ],
        example: 'The problem ______ (solve) at yesterday\u2019s meeting drew wide attention. 句中已有谓语 drew → 空处只能填非谓语；problem 与 solve 是被动关系 → solved（过去分词作后置定语）。',
        example2: 'Look! The bridge ______ (build) by the workers now. 本句还没有谓语 → 现在进行时的被动 → is being built（被动语态别忘了变 be）。'
      },
      {
        no: 3, title: '括号给形容词/副词：只考比较级、最高级',
        goal: '形/副提示词只有一个任务：判断填比较级还是最高级。',
        why: '这是上海卷最容易踩坑的地方：有提示词不考词性转换。不会给 care 让你写 carefully，也不会让你加后缀变名词。拿到形/副，只看有没有比较信号，不要自己发明变形。',
        do: [
          '看到 than → 比较级：-er / more + 原级。',
          '看到 the、in/of + 范围 → 最高级：the -est / the most + 原级。',
          '没有比较信号 → 用原词（考点只是句意理解，不要硬变形）。',
          '不规则变化直接背：good/well→better→best；bad/badly→worse→worst；many/much→more→most；little→less→least；far→farther/further→farthest/furthest。'
        ],
        example: 'Of all the students in our class, she works ______ (hard). → hardest。of + 范围 → 最高级；修饰动词用的是副词，但词性不变，还是 hard。',
        example2: 'This book is much ______ (interesting) than that one. → more interesting。than → 比较级；much 修饰比较级。'
      },
      {
        no: 4, title: '无提示词：连词优先，再按 5 类排查',
        goal: '把 6 个纯空格逐一锁定进"连词 / 介词 / 冠词 / 代词 / 情态·助动词"这 5 类。',
        why: '上海纯空格不会跑出这 5 类，而且每空只填 1 个单词。邪修顺序：连词 > 介词 > 冠词 > 代词 > 情态——先把最高频的连词排除掉，再往下试。',
        do: [
          '数这句话的谓语：出现 2 个及以上谓语（或空后跟的是一个从句）→ 优先填连词。',
          '只有 1 个谓语、主干完整 → 看空格后面：+ 名词/动名词 → 优先试介词；+ 可数名词单数 → 试冠词；+ 动词原形 → 情态动词/助动词。',
          '句子缺主语/宾语、指代上文名词 → 代词（it 常作形式主语、形式宾语）。',
          '一类排除不掉再看下一类，不要跳步乱猜。'
        ],
        example: '缺成分：______ we need most is practice. → what（主语从句里缺 need 的宾语）。',
        example2: '成分完整：The news ______ he won the prize excited us. → that（同位语从句不缺成分，只起连接作用）。'
      },
      {
        no: 5, title: '填完通读，按清单复查',
        goal: '填完全部 10 空，用下面的清单快速复查，把低级失分拦下来。',
        why: '上海卷的坑很集中：忘了被动、忘了三单、逗号后用了 that、纯空格填了两个单词……复查一遍就能把这些分捡回来。',
        do: [
          '把全文再顺读一遍：语义通不通、逻辑顺不顺（并列/转折/因果）。',
          '回头确认重点判断：谓语还是非谓语？主动还是被动？'
        ],
        check: [
          '无提示词空：每空是不是只有 1 个单词？',
          '有提示词空：答案还是同一个词（只是变形），没有换词性、换单词？',
          '主谓一致：三单加 s、be 动词形式对吗？',
          '被动语态：动作承受者做主语时，be + done 写全了吗？',
          '非谓语：to do / doing / done 选对了吗（主动还是被动）？',
          '从句：缺成分用 what/who/which，成分完整用 that/whether？逗号隔开、介词后面有没有误用 that？',
          '抽象地点先行词 case/situation/point/scene/occasion：从句不缺主宾时填 where 了吗？',
          '固定搭配：介词对吗（如 look forward to + doing）？',
          '全文时态基调一致吗？'
        ],
        tip: '检查完每空只填 1 个单词，这道题才算做完。'
      }
    ],

    /* 无提示词候选池（按邪修优先级排序） */
    pool: [
      {
        prio: '优先级 1', name: '连词（最高频）',
        when: '一句话出现 2 个及以上谓语，必须有连词把分句连起来；或者空格后面跟着的是一个从句。',
        how: [
          '并列连词：and / but / or / so——连接地位平等的两个句子或成分。',
          '定语从句：先行词是人、从句缺主语/宾语 → who / that（缺宾语也可用 whom）；先行词是物、从句缺主语/宾语 → which / that；先行词表"……的"、后面接名词 → whose。',
          '定语从句不缺主宾、缺状语，且先行词是抽象地点 case / situation / point / scene / occasion → 填 where（上海高频坑）。',
          '名词性从句：从句缺主语/宾语（指物）→ what；从句语义完整 → that（无含义，只连接）；"是否" → whether（主语从句、介词后面不用 if）。',
          '状语从句：when / if / because / while / though 等，看逻辑（时间、条件、原因、让步）。',
          '禁忌：介词后面、逗号隔开的非限制性定语从句，绝对不能用 that。'
        ],
        example: 'This is a case ______ the rule does not work. 从句 the rule does not work 不缺主宾 → 填 where。'
      },
      {
        prio: '优先级 2', name: '介词（第二高频）',
        when: '句子主谓完整、不缺主干成分，空格后面是名词或动名词（doing）。',
        how: [
          '固定搭配优先：rely on / lead to / be responsible for / look forward to + doing…',
          '语义介词：时间 in / on / at；方式 by；所属 of；伴随 with。'
        ],
        example: 'I am looking forward to ______ (hear) from you. → hearing（to 是介词，后面接 doing，不是 to do）。'
      },
      {
        prio: '优先级 3', name: '冠词 a / an / the',
        when: '空格后面是可数名词单数。',
        how: [
          '泛指、第一次出现：辅音音素前用 a，元音音素前用 an（看音素不看字母：an hour / a university）。',
          '特指：上文提过、独一无二、有后置短语限定 → the。',
          '不可数名词、复数名词泛指时不加冠词。'
        ],
        example: 'She is ______ honest girl. → an（honest 的 h 不发音，以元音音素开头）。'
      },
      {
        prio: '优先级 4', name: '代词 it / they / that / those',
        when: '句子缺主语或宾语，并且这个成分指代上文的某个名词。',
        how: [
          '指代上文单数事物 → it；复数 → they / them。',
          'it 的高频特殊用法：形式主语 it is important to do…；形式宾语 find it + adj. + to do；强调句 it is … that …。'
        ],
        example: 'I find ______ hard to finish the work on time. → it（形式宾语，真正的宾语是 to finish the work on time）。'
      },
      {
        prio: '优先级 5（低频）', name: '情态动词 / 助动词',
        when: '空格后面是动词原形，句子主干已经完整。',
        how: [
          '情态动词：can / may / must / should，看语气是能力、许可、推测还是义务。',
          '助动词：do / does / did，用于倒装和强调。'
        ],
        example: 'Not until then ______ he realize his mistake. → did（倒装，助动词提前）。'
      }
    ],

    /* 快速排查流程（一句话版） */
    quickFlow: [
      '拿到无提示词空，先数这句话有几个谓语。',
      '2 个及以上谓语（或空后是一个从句）→ 先按连词处理：并列连词 / 定语从句 / 名词性从句 / 状语从句。',
      '只有 1 个谓语、主干完整 → 看空格后面：名词、动名词 → 先试介词；可数名词单数 → 试冠词。',
      '空格后是动词原形 → 情态动词 / 助动词。',
      '句子缺主语/宾语、指代上文 → 代词。',
      '还是拿不准 → 按 连词 > 介词 > 冠词 > 代词 > 情态 逐个代入，读一遍语义通不通，填完再统一复查。'
    ],

    trapTitle: '上海卷高频坑（做题前必看）',
    fiveTrapTips: [
      { id: 'no-wordform', name: '拿全国卷思路做上海题（最大误区）', text: '看到形容词就想变副词？上海语法填空有提示词不考词性转换：给 care 不会让你写 carefully。有提示词只有两种任务——动词（谓语/非谓语）、形副（比较级/最高级）。' },
      { id: 'verb-vs-nonfinite', name: '谓语 vs 非谓语', text: '先数谓语：分句已有谓语、又没有并列连词，空处再填谓语就是病句。给词空的第一问永远是"这里要不要谓语"。' },
      { id: 'insertion', name: '插入语用剥壳法', text: '两个逗号中间的内容往往是插入语，直接划掉再看主干，长难句立刻变简单。' },
      { id: 'abstract-where', name: '抽象地点先行词用 where', text: 'case / situation / point / scene / occasion 这类抽象地点先行词，从句不缺主语宾语、缺的是状语 → 填 where，不是 which。' },
      { id: 'no-that-after-comma', name: '逗号后不能用 that', text: '逗号隔开的非限制性定语从句、以及介词后面，绝对不能用 that。' },
      { id: 'passive', name: '忘记被动语态', text: '主语是动作的承受者，就必须用被动：be + done。别只改动词，忘了 be 的形式要随时态一起变。' },
      { id: 'collocation', name: '固定搭配里的介词', text: 'look forward to 的 to 是介词，后面接 doing 不是 to do；介词搭配错一个，就是丢一分。' },
      { id: 'what-vs-that', name: 'what vs that', text: 'what = 从句里缺成分；that = 从句完整、只起连接。把空后的从句还原读一遍就能分辨。' },
      { id: 'a-vs-an', name: 'a / an', text: '看音素不是看字母：an hour（h 不发音），a university（发 /juː/）。' }
    ]
  };

  window.__EGL_METHOD_COURSE__ = COURSE;
})();
