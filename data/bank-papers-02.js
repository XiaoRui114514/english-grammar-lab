/* ============================================================
 * data/bank-papers-02.js — 上海真题语篇 03-04（整篇 10 空 · 真卷口径）
 * ============================================================ */
(function () {
  'use strict';
  var P = window.__EGL_PAPERS__ = window.__EGL_PAPERS__ || [];

  P.push({
    id: 'paper03',
    no: '03',
    title: 'The Northern Lights',
    source: '2022 · 上海高考',
    level: '高三',
    genre: '说明文',
    words: 294,
    topic: '极光：命名、颜色、观测与成因',
    readGuide: '说明文，按“是什么—什么颜色—在哪看—什么时候看”推进。时态以现在完成时（have been...）和一般现在时为主，第三段有一个倒装句要注意。',
    passage: 'How much do you know about the northern lights, or the aurora borealis? They offer a magical display that fascinates ______ sees it. The name “aurora borealis” came respectively ______ the Roman goddess of the dawn, Aurora, and the Greek name for wind of the north, Boreas. For thousands of years, the northern lights have been the source of awe (敬畏). ______ people really understood what causes them, the lights had been thought to be a sign of war or destruction.\n\nThe colors most often ______ (associate) with the northern lights are pink, green, yellow, blue, and occasionally orange and white. These lights, ______ (appear) as a static (静止的) band of light, or sometimes as a curtain of constantly flowing colors, are a big attraction.\n\nThe best sites ______ you can see the northern lights are Alaska and northern Canada. But visiting these vast, open areas ______ (not be) always easy. Norway, Sweden and Finland also offer excellent observation sites. During periods of particularly strong solar activities, the lights are often seen as far south as the top of Scotland and even northern England. Only on rare occasions ______ the lights be seen farther south.\n\nThe northern lights are always present, but it is recommended that visitors go there in winter, due to lower levels of light pollution and the clear air. September, October, March and April are some of the best months ______ (view) the northern lights. The lights ______ (know) to be brighter and more active for up to two days after sunspot activity is at its highest.',
    blanks: [
      {
        answer: 'whoever', accepted: ['whoever'], given: '', isGiven: false,
        catId: 'nominal', point: '宾语从句 · whoever 作从句主语',
        wrongType: 'CLAUSE_ERROR', difficulty: 3,
        sense: '它们呈现出一种迷人的景象，让每一个看到它的人都为之着迷。',
        clue: 'fascinates ______ sees it：fascinate 后面需要一个宾语，而这个宾语同时又是 sees 的主语，是“人”。',
        why: '先看结构：fascinates 缺宾语，空处要引导一个宾语从句，同时这个引导词还要在从句里作 sees 的主语。再看语义：句意是“让任何看到它的人着迷”，指人不确定，用 whoever（= anyone who）。',
        others: '①who：who 只能引导定语从句，前面要有先行词（someone who...），本句 fascinates 后面没有先行词；②whom：whom 在从句里只能作宾语，而这里缺的是主语；③whatever：whatever 指物，不能作 sees 的主语（物不会“看”）。',
        tip: '缺宾语 + 从句缺主语 + 指人 → whoever；指物 → whatever。'
      },
      {
        answer: 'from', accepted: ['from'], given: '', isGiven: false,
        catId: 'prep', point: '介词 come from（源自）',
        wrongType: 'PREPOSITION_ERROR', difficulty: 2,
        sense: '“aurora borealis”这个名字分别来自罗马神话中的黎明女神 Aurora，以及希腊语中表示北风的词 Boreas。',
        clue: '空前的 came 与空后的 the Roman goddess ... and the Greek name ... 构成“来自（某来源）”的搭配；respectively 提示后面跟两个来源。',
        why: '先看动词：come 在这里表示“来源”，固定搭配是 come from（来自）。再看句子：came respectively ______ the Roman goddess ... and the Greek name ...，后面是两个来源，正好是 from 的宾语。',
        others: '①of：come of 表示“由……产生/出身于”，且不与 respectively 连用表示来源；②to：come to 是“到达”，语义不通；③out：come out 是“出版、出现”，后面不能直接接来源。',
        tip: 'come from + 来源；be named after + 名字来源（命名）。'
      },
      {
        answer: 'Before', accepted: ['before'], given: '', isGiven: false,
        catId: 'adverbial', point: '时间状语从句 + 过去完成时的呼应',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 4,
        sense: '在人们真正弄明白极光的成因之前，它一直被认为是战争或毁灭的征兆。',
        clue: '主句用的是 had been thought（过去完成时），它需要一个“过去的过去”的参照点，也就是“人们弄明白”这件事发生的时刻。',
        why: '先看时态：主句 had been thought 是过去完成时，表示“在某个过去时间点之前就已经如此”，那么从句就要提供这个过去时间点。再看语义：人们“理解成因”是后来的事，在那之前极光被当作凶兆，所以用 Before。句首首字母大写。',
        others: '①After：逻辑反了，成了“理解之后才被当成凶兆”；②Since：since 引导的从句一般用一般过去时、主句用现在完成时，与 had been thought 不匹配；③While：while 表“当……时”或对比，不能表达“在……之前”。',
        tip: '看到 had done，先找“过去的过去”的参照点；before + 从句最常见。'
      },
      {
        answer: 'associated', accepted: ['associated'], given: 'associate', isGiven: true,
        catId: 'nonfinite', point: '过去分词短语作后置定语（be associated with）',
        wrongType: 'VOICE_ERROR', difficulty: 3,
        sense: '最常与极光联系在一起的颜色是粉色、绿色、黄色、蓝色，偶尔还有橙色和白色。',
        clue: 'The colors most often ______ (associate) with the northern lights are ...：主语是 The colors，谓语是 are，空处只能是修饰 colors 的定语；颜色与 associate 是被动关系（“被联系”）。',
        why: '第一步数谓语：句子的谓语是 are，所以空处不是谓语。第二步看关系：colors 是“被人们与极光联系起来”的对象，用过去分词 associated，相当于 which are most often associated with。第三步看副词：most often 插在非谓语前，正好说明这一被动动作经常发生。',
        others: '①associating：现在分词表主动，“颜色去联系极光”讲不通；②to associate：不定式作定语表将来或目的，这里是习惯性描述；③are associated：再放一个谓语，主句会变成两个谓语却无连词。',
        tip: 'be associated with（与……相关）；名词 + most often + done + 介词 = 过去分词定语。'
      },
      {
        answer: 'appearing', accepted: ['appearing'], given: 'appear', isGiven: true,
        catId: 'nonfinite', point: '现在分词作后置定语（表主动/状态）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '这些光，看起来是一条静止的光带，有时又像一幅不断流动的彩色帷幕，极具吸引力。',
        clue: 'These lights, ______ (appear) as a static band of light, ..., are a big attraction. 主语 These lights 与谓语 are 之间是两个逗号隔开的插入成分，空处只能是非谓语；光“呈现为”某种形态是主动的。',
        why: '先看结构：句子的主谓是 These lights ... are a big attraction，中间用逗号隔开的部分是补充说明，属于非限制性定语或状语，只能用非谓语。再看关系：appear as（呈现为）是光自己呈现，主动，用现在分词 appearing。',
        others: '①appeared：过去分词表被动，光不是“被呈现”；②to appear：不定式一般表将来或目的，这里是客观描述；③appearance：名词不能带 as 构成这个结构。',
        tip: '逗号隔开、删掉后句子仍完整 → 非谓语；主动用 doing，被动用 done。'
      },
      {
        answer: 'where', accepted: ['where'], given: '', isGiven: false,
        catId: 'attrib', point: '定语从句 · 关系副词 where',
        wrongType: 'CLAUSE_ERROR', difficulty: 3,
        sense: '能看极光的最佳地点是阿拉斯加和加拿大北部。',
        clue: '先行词 The best sites 表地点，从句 you can see the northern lights 主谓宾齐全，缺的是地点状语。',
        why: '先找先行词：sites（地点）。再看从句：you 是主语，can see 是谓语，the northern lights 是宾语，成分完整，说明关系词只能作地点状语，用关系副词 where（= at which）。',
        others: '①which：which 要在从句里作主语或宾语，本从句已有宾语 the northern lights；②that：同理，that 不能作状语，也不能跟在表地点的先行词后充当 where；③when：先行词不是时间，语义不符。',
        tip: '先行词是地点 + 从句不缺主宾 → where（= in/at which）。'
      },
      {
        answer: 'is not', accepted: ['is not', 'isn’t'], given: 'not be', isGiven: true,
        catId: 'verb', point: '动名词作主语时的主谓一致',
        wrongType: 'SUBJECT_VERB_AGREEMENT', difficulty: 4,
        sense: '但去这些广阔空旷的地方并不总是那么容易。',
        clue: '主语是动名词短语 visiting these vast, open areas（“去这些地方”这件事），谓语要用单数；括号给的是 not be，需要补出 be 的单数和否定形式。',
        why: '第一步找主语：visiting these vast, open areas 是动名词短语作主语，表示一件事，谓语用单数 is。第二步加否定：be 动词的否定直接在后加 not，即 is not（isn’t）。第三步看时态：全段讲一般情况，用现在时。',
        others: '①are not：动名词短语作主语看作单数，用 are 会主谓不一致；②do not be：be 动词的否定不需要助动词 do；③not be：缺少主语对应的 be 形式，句子没有谓语。',
        tip: '动名词/不定式/从句作主语 → 谓语用单数；be 动词否定直接加 not。'
      },
      {
        answer: 'can', accepted: ['can'], given: '', isGiven: false,
        catId: 'extra', point: 'Only + 状语置于句首的部分倒装',
        wrongType: 'VERB_FORM_ERROR', difficulty: 5,
        sense: '只有在极少数情况下，人们才能在更靠南的地方看到极光。',
        clue: 'Only on rare occasions 位于句首，后面 ______ the lights be seen 是“情态动词 + 主语 + 动词原形”的倒装语序，说明空处必须是情态动词。',
        why: '先看语序：正常语序是 The lights ______ be seen only on rare occasions，现在 Only 状语提前，句子部分倒装，变成“情态动词/助动词 + 主语 + 其余”。be seen 已经是“be + done”，前面只能再放一个情态动词。再看语义：“能够被看到”用 can。',
        others: '①are：are the lights be seen 语序和形式都不对；②do：do the lights be seen 语法错误，do 后面接原形，不接 be seen；③will：will the lights be seen 也构成倒装，但语义是“将会被看到”，与“偶尔能看到”不符。',
        tip: 'Only + 状语在句首 → 部分倒装：Only then did I realize... / Only on rare occasions can...'
      },
      {
        answer: 'to view', accepted: ['to view'], given: 'view', isGiven: true,
        catId: 'nonfinite', point: '不定式作后置定语（the best months to do）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 2,
        sense: '九月、十月、三月和四月是观赏极光的最佳月份。',
        clue: 'some of the best months ______ (view) the northern lights：months 后面接的不是谓语，而是说明“用来做什么”的定语。',
        why: '先看结构：主句谓语是 are，空处只能是非谓语。再看语义：the best months to view the northern lights 表示“观赏极光的最佳月份”，不定式作定语，修饰被序数词/最高级限定的名词（the best months）时最常用。',
        others: '①viewing：动名词作定语多表用途或正在进行，the best months viewing 不成立；②viewed：过去分词表被动，月份不会“被观赏”；③view：原形不能直接作定语。',
        tip: 'the first / the best / the only + 名词 + to do（用不定式作定语）。'
      },
      {
        answer: 'are known', accepted: ['are known'], given: 'know', isGiven: true,
        catId: 'verb', point: '一般现在时的被动语态（be known to be）',
        wrongType: 'VOICE_ERROR', difficulty: 3,
        sense: '据知，在太阳黑子活动达到高峰后的两天里，极光会更明亮、更活跃。',
        clue: '主语 The lights 与 know 是被动关系（“人们知道极光……”），后面的 to be brighter and more active 是 be known to be 结构。',
        why: '第一步看语态：极光是“被人们所知”的对象，用被动。第二步看时态：全段陈述客观事实，用一般现在时，所以 are known。第三步看搭配：be known to be + adj. 表示“据知是……”，与后面的 to be brighter 正好吻合。主语 The lights 是复数，be 用 are。',
        others: '①know：主动形式，“极光知道”讲不通；②is known：主语 The lights 是复数，主谓不一致；③have been known：现在完成时强调“到现在为止一直”，本句只是陈述一般规律，与后面的 are always present 重复。',
        tip: 'be known to be / be known as / be known for 三个搭配要分清：to be 是“据知是”，as 是“作为”，for 是“因……而闻名”。'
      }
    ]
  });

  P.push({
    id: 'paper04',
    no: '04',
    title: 'Young Enterprise',
    source: '2023 · 上海高考',
    level: '高三',
    genre: '说明文',
    words: 288,
    topic: '青年创业组织：参与者、导师与赞助者',
    readGuide: '说明文，介绍一个教年轻人做生意的组织。全文以一般现在时为主，第二段插叙早期历史时用过去时。注意 though 引导的让步、who 引导的非限制性定语从句。',
    passage: 'Young Enterprise is an organization that makes serious efforts to teach all types of young people the general principles about running a business.\n\n______ (originate) in the United States of America, the idea of Young Enterprise was introduced into Britain by a successful banker. ______ developed very slowly in its early years, the organization grew rapidly later. Young Enterprise is now backed by industry and commerce, so that today the young throughout the United Kingdom can participate in.\n\nA participant in Young Enterprise is known as Achiever. Young Enterprise primarily meets the needs of young people, ______ are still at school, giving them an understanding of industry and the opportunities it offers them in the future. But it is usually possible ______ (include) young people in the same age group who have left school but have not yet started to work.\n\nAn advisor is a practicing business executive with an expert knowledge of his own field who volunteers to help a young enterprise company during its trading year. ______ counts for advisers is an ability to get along with young people and to put across the subject. As the name ______ (imply), Advisors are there to advise: they do not run the business.\n\nNormally three advisors — one on accountancy, one on production, and one on marketing — ______ (be) available to each company. Young Enterprise makes ______ a rule that the advisors must come from a variety of business occupations.\n\nA Sponsor, ______ (reward) by the success of the enterprise of its achievers, is an organization which participates in Young Enterprise, and ______ its own expense, provides facilities, accommodation, advice and encouragement.',
    blanks: [
      {
        answer: 'Originating', accepted: ['originating'], given: 'originate', isGiven: true,
        catId: 'nonfinite', point: '现在分词作状语（主动关系）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '这个源自美国的想法，由一位成功的银行家引入英国。',
        clue: '空在句首、逗号之后，句子已有谓语 was introduced；主语 the idea of Young Enterprise 与 originate 是主动关系（想法“源自”某地）。',
        why: '先数谓语：主句谓语是 was introduced，句首的逗号结构只能是非谓语状语。再看关系：the idea 自己 originate in the USA（源自美国），是主动关系，用现在分词 originating。句首首字母大写。',
        others: '①Originated：过去分词表被动，“想法被起源”讲不通；②To originate：不定式作状语多表目的，“为了源自美国”语义不通；③origin 是名词/原形，不能作句首状语。',
        tip: '句首逗号结构先看主语与动词是主动还是被动：主动用 doing，被动用 done。'
      },
      {
        answer: 'Though', accepted: ['though', 'although', 'while'], given: '', isGiven: false,
        catId: 'adverbial', point: '让步状语从句连词',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 3,
        sense: '尽管这个组织早期发展得非常缓慢，但后来迅速壮大起来。',
        clue: '前半句 developed very slowly 与后半句 grew rapidly later 意思相反；主句前没有 but，说明让步关系要在从句连词里体现。',
        why: '先判断逻辑：发展慢与后来迅速壮大是让步（“虽然……但是……”）。再看结构：空后是完整的主谓 developed very slowly in its early years，需要引导让步状语从句的连词，though / although 都可以；while 在此也能表示“虽然”，故一并接受。句首首字母大写。',
        others: '①But：but 是并列连词，不能引导位于句首的从句还保留后面主句（Though..., the organization grew 才是标准结构）；②Because：因果讲反了，发展慢不是迅速壮大的原因；③However：however 是副词，不能直接引导从句作连词。',
        tip: '中文“虽然……但是……”在英语里只能留一个：Though + 从句，主句不再加 but。'
      },
      {
        answer: 'who', accepted: ['who'], given: '', isGiven: false,
        catId: 'attrib', point: '非限制性定语从句 · 关系代词 who 作主语',
        wrongType: 'CLAUSE_ERROR', difficulty: 2,
        sense: '青年创业主要面向年轻人，也就是还在上学的人，让他们了解产业以及产业将来能提供的就业机会。',
        clue: '先行词 young people 指人，逗号后面 are still at school 缺主语。',
        why: '先找先行词：young people（人）。再看从句：______ are still at school 缺主语，需要关系代词 who（指人、作主语）。逗号说明是非限制性定语从句，此时不能用 that。',
        others: '①that：非限制性定语从句（逗号后）不能用 that；②which：which 指物，先行词是人；③whom：whom 只能在从句里作宾语，这里缺主语。',
        tip: '逗号 + 指人 + 从句缺主语 → who；逗号后永远不用 that。'
      },
      {
        answer: 'to include', accepted: ['to include'], given: 'include', isGiven: true,
        catId: 'nonfinite', point: 'it is possible to do sth 句式',
        wrongType: 'VERB_FORM_ERROR', difficulty: 2,
        sense: '但通常也可以把同一年龄段里已经离校、还没开始工作的年轻人纳入进来。',
        clue: 'it is usually possible ______ (include)：it 是形式主语，真正的主语是后面的不定式。',
        why: '先看句式：It is + adj. + to do sth 是英语里最常用的形式主语句式，it 占位，真正的主语用不定式。再看语义：“也有可能包括……”，用 to include。后面的 young people ... who have left school 是 include 的宾语。',
        others: '①including：It is possible including 不是英语句式；②included：过去分词不能作这个句式的主语；③include：原形不能直接放在形容词后作主语。',
        tip: 'It is + adj. + to do sth（形式主语句）；It is no use doing sth 才用动名词。'
      },
      {
        answer: 'What', accepted: ['what'], given: '', isGiven: false,
        catId: 'nominal', point: '主语从句 · what 作从句主语',
        wrongType: 'CLAUSE_ERROR', difficulty: 3,
        sense: '对导师来说，最重要的是能与年轻人相处并把主题讲清楚的能力。',
        clue: '空在句首、后面 counts for advisers 缺主语，句子的谓语是 is，说明前面整个是一个主语从句。',
        why: '先看结构：句子已有谓语 is（an ability to get along...），空处引导主语从句，且从句 counts for advisers 缺主语，只能用 what（= the thing that）。再看语义：“对导师而言重要的是……”，指事物，不用 who。',
        others: '①That：that 引导主语从句时从句必须完整，counts for advisers 缺主语，不成立；②Which：which 要有选择范围才用；③It：it 没有连接作用，会变成两个独立句子。',
        tip: '句首 + 后面谓语缺主语 → What；从句完整 → That。'
      },
      {
        answer: 'implies', accepted: ['implies'], given: 'imply', isGiven: true,
        catId: 'verb', point: '一般现在时第三人称单数',
        wrongType: 'SUBJECT_VERB_AGREEMENT', difficulty: 2,
        sense: '正如这个名字所暗示的，导师的职责是提供建议，他们并不经营这家企业。',
        clue: '主语 the name 是第三人称单数；As the name ______ 是“正如……所表明的”这一固定说法，讲的是普遍事实。',
        why: '第一步看主语：the name 是单数第三人称。第二步看时态：as 从句陈述一般事实（名字的含义是固定的），用一般现在时。第三步加 -s：imply 以辅音字母 + y 结尾，变三单要改 y 为 i 再加 -es，即 implies。',
        others: '①imply：三单主语后动词必须加 -s；②implied：过去式表示过去发生，与“名字现在暗示”的事实不符；③implying：现在分词不能单独作谓语。',
        tip: '辅音字母 + y 结尾的动词，三单变 y 为 i 加 es：imply → implies。'
      },
      {
        answer: 'are', accepted: ['are'], given: 'be', isGiven: true,
        catId: 'verb', point: '主谓一致（插入语后的真正主语）',
        wrongType: 'SUBJECT_VERB_AGREEMENT', difficulty: 4,
        sense: '通常每家公司会有三位导师——一位负责会计，一位负责生产，一位负责营销。',
        clue: '两个破折号中间是补充说明，真正的句子主干是 Normally three advisors ______ available to each company，主语 three advisors 是复数。',
        why: '第一步找主语：跳过破折号里的插入成分，主语是 three advisors（复数）。第二步看时态：陈述通常情况，用一般现在时。第三步定形式：复数主语配 are，构成 are available to each company。',
        others: '①is：主语是 three advisors，复数，用 is 会主谓不一致；②were：过去时与全段一般现在时的说明语气不符；③being：非谓语不能作谓语。',
        tip: '主谓一致先“去掉插入语”：破折号、逗号、括号里的成分都不影响主语的数。'
      },
      {
        answer: 'it', accepted: ['it'], given: '', isGiven: false,
        catId: 'pronoun', point: '形式宾语 it（make it a rule that...）',
        wrongType: 'PRONOUN_ERROR', difficulty: 4,
        sense: '青年创业组织规定，导师必须来自不同的商业领域。',
        clue: 'makes ______ a rule that the advisors must come from a variety of business occupations：真正的宾语是后面的 that 从句，位置太长，所以先用一个形式宾语占位。',
        why: '先看结构：make + 宾语 + 宾补（make sb/sth + n./adj.）。本句真正的宾语是 that the advisors must come from a variety of business occupations，太长，按英语习惯后置，前面用形式宾语 it 占位，构成 make it a rule that...。再看 it 不能换成其它代词：它只是结构占位，没有实际指代。',
        others: '①that：that 不能作形式宾语，且后面已经有一个 that 从句；②this：this 作形式宾语不是英语习惯用法；③them：形式宾语固定用 it，与后面从句的单复数无关。',
        tip: 'make / find / think / consider + it + 宾补 + that 从句（it 是形式宾语）。'
      },
      {
        answer: 'rewarded', accepted: ['rewarded'], given: 'reward', isGiven: true,
        catId: 'nonfinite', point: '过去分词短语作后置定语',
        wrongType: 'VOICE_ERROR', difficulty: 3,
        sense: '赞助方是这样一种组织：它从学员企业的成功中获得回报，参与青年创业项目，并自费提供场地、食宿、建议和鼓励。',
        clue: 'A Sponsor, ______ (reward) by the success of the enterprise of its achievers, is an organization...：主语 A Sponsor 后的逗号结构只能是定语，赞助方与 reward 是被动关系（“获得回报”= be rewarded by）。',
        why: '第一步数谓语：主句谓语是 is，空处不是谓语。第二步看关系：A Sponsor 是“被（学员的成功）回报”的一方，用过去分词 rewarded，相当于 who is rewarded by。第三步注意搭配：be rewarded by/with 是固定被动搭配。',
        others: '①rewarding：现在分词表主动，“赞助方去回报别人”与原意相反；②to reward：不定式作定语表将来或目的，这里是解释性质；③rewards：再放一个谓语，与后面的 is 冲突。',
        tip: 'sb be rewarded by/with sth（某人因……得到回报）；名词后的逗号结构用非谓语。'
      },
      {
        answer: 'at', accepted: ['at'], given: '', isGiven: false,
        catId: 'prep', point: '固定搭配 at one’s own expense',
        wrongType: 'PREPOSITION_ERROR', difficulty: 3,
        sense: '……并且自费提供场地、食宿、建议和鼓励。',
        clue: 'and ______ its own expense, provides facilities...：expense 前需要一个介词，与 its own 构成“自费”的固定短语。',
        why: '先看搭配：at one’s own expense 是固定短语，意为“自费、自己承担费用”，其中 at 表示“以……方式/代价”。再看结构：and 连接两个谓语（participates in 与 provides），中间插入 at its own expense 作状语，语义是“自掏腰包提供……”。',
        others: '①in：in one’s expense 不是英语搭配；②on：on expense 也不成立（on expenses 指报销）；③with：with its own expense 表示“带着费用”，语义不清。',
        tip: 'at one’s own expense（自费）；at the expense of（以……为代价）。'
      }
    ]
  });
})();
