/* data/bank-tense-02.js — 专题 02：一般过去时 Past Simple（上海高中语法填空） */
(function () {
  'use strict';
  window.__GRAMMAR_LAB__ = window.__GRAMMAR_LAB__ || {};
  window.__GRAMMAR_LAB__.tense02 = {
    id: 'tense02',
    no: '02',
    title: '一般过去时',
    phase: 1,
    icon: '🕰️',
    color: '#e07b39',
    // —— 知识卡 ——
    knowledgeCard: {
      oneLine: '一句话理解：过去发生的、现在已经结束的动作或状态，谓语动词一律用过去式。',
      structure: '基本结构：主语 + 动词过去式。规则动词加 -ed（stop→stopped，study→studied）；不规则动词必须单独背，如 go→went、take→took、teach→taught、come→came、win→won。否定和疑问要借助 did，后面动词回原形。',
      scenes: ['① yesterday / last night / last week 等明确过去时间词', '② 数字 + ago：如 two days ago', '③ in 1998 等过去年份或时代', '④ 讲故事、写回忆、人物传记的叙述语境', '⑤ 描述过去的状态或过去习惯（used to do）'],
      examples: [
        'Last night I finished my report before ten and went straight to bed. 昨晚我十点前写完报告就睡了。',
        'Grandma told us an interesting story about her childhood in the countryside. 奶奶给我们讲了一个关于她乡下童年的故事。',
        'He used to ride his bike to school, but now he takes the underground. 他过去骑车上学，现在坐地铁。'
      ],
      glossary: [
        { term: '过去式', note: '动词表示"过去发生"的形式：规则动词加 -ed；不规则动词需背，如 go→went、take→took、teach→taught、fall→fell、catch→caught。' },
        { term: 'ago', note: '放在时间数字后表示"……以前"，如 three days ago，只能和一般过去时连用，绝不能和现在完成时连用。' },
        { term: 'used to do', note: '表示"过去常常做某事（现在不做了）"，后接动词原形；注意与 be used to doing（习惯于做某事）区分开。' }
      ],
      commonMistake: '最容易错：① 把不规则动词当规则动词加 -ed，写出 teached / taked / catched；② 看到 ago / yesterday 就盲目用过去，还要先确认动作确实发生在过去并已结束；③ 把"过去某刻正在做"误写成一般过去时。',
      judgment: '先找过去时间（yesterday / last / ago / in 过去年份）或确认是讲故事、回忆、传记语境 → 判断动作只发生在过去、已经结束 → 用一般过去时（V-ed 或不规则过去式）。若强调"当时正在做"→ 过去进行时（那是另一专题）。',
      memory: '🧠 超短记忆：过去已完成 → V-ed / 不规则过去式；看到 ago、yesterday 先问一句"做完了吗？"'
    },
    // —— 每专题 5 句话复习 ——
    review5: [
      '① 一般过去时：过去某时发生、现已结束的动作或状态，谓语用动词过去式。',
      '② yesterday / last… / …ago / in 过去年份是常见"过去信号"，但要先确认动作确实发生在过去并已完成。',
      '③ 叙述过去的一件事、写回忆或传记时，一连串动作通常都用一般过去时。',
      '④ 不规则动词过去式要单独背（take→took，teach→taught，fall→fell），不能直接加 -ed。',
      '⑤ used to do 表示"过去常做、现在不再做"；若强调过去某刻"正在做"，要用过去进行时。'
    ],
    // —— 考场判断顺序 ——
    examFlow: [
      '第一步：找过去时间，或判断是否为过去叙述语境',
      '第二步：该动作是否只发生在过去、已经结束',
      '第三步：是否强调"当时正在做" → 是，改走过去进行时',
      '第四步：是否强调"到过去某时已完成" → 是，改走过去完成时',
      '第五步：都不符合 → 用一般过去时，并检查过去式拼写'
    ],
    // —— 子知识点 ——
    tags: ['过去时间标志', '过去事件叙述', 'used to 过去习惯', '不规则动词形式', '过去时间与语境综合', '一般过去时综合'],
    // —— 推荐理由 ——
    contrast: '本专题训练识别过去信号与叙述语境，用对过去式拼写，并为区分过去进行、过去完成、现在完成打下基础。',
    questions: [

    {
      id: 'tense02q01',
      pos: 1,
      type: 'choice',
      difficulty: 1,
      tag: '过去时间标志',
      wrongType: 'TENSE_CONFUSION',
      question: 'Two hours ago, my cousin in Beijing ______ me a phone call about our summer plan, and we talked until my phone battery died.',
      hint: '',
      options: ['gives', 'give', 'gave', 'was giving', 'has given', 'had given'],
      answerIndex: 2,
      accepted: [],
      answerText: 'gave',
      explanation: {
        answer: 'gave',
        keyPoint: '看到 two hours ago 这类明确的过去时间标志，且动作已结束，用一般过去时。',
        clue: '🔎 本题关键线索：句首的 two hours ago（两小时前）把动作钉死在过去的某个点；后半句 "we talked until my phone battery died" 继续讲过去的经过，说明整件事已经结束。',
        trap: '⚠️ 不要被 has given 骗了：现在完成时强调"对现在的影响"，绝不能和 two hours ago 这种具体过去时间连用。定答案的关键信息就是 ago。',
        chain: 'two hours ago ↓ 明确的过去时间 ↓ 动作已结束、与现在无关 ↓ 一般过去时 ↓ 不规则过去式 gave',
        why: '句首 two hours ago 是典型的过去时间标志，句子描述的是两小时前已经发生的具体事件（表哥打来电话、两人一直聊到手机没电），整个过程在过去结束，因此谓语用一般过去时。give 的过去式是不规则变化 gave，不是 gives，也不是 given。',
        whyOthers: 'A. "gives" 和 B. "give" 是一般现在时，与 two hours ago 矛盾；\nC. "gave" 正确；\nD. "was giving" 过去进行时强调"当时正在打电话"的持续画面，句中缺少这种正在进行的时间框架，与 "we talked until..." 的完成叙述不匹配；\nE. "has given" 现在完成时不能与 ago 连用；\nF. "had given" 过去完成时需要有"更早的过去动作"作参照，句中没有。',
        commonError: '最常见的错误：看到 ago 仍用现在完成时（has given），或者分不清 give-gave-given 三个形式，把过去式错写成 given。',
        memory: '一句话记忆：ago 一出现，动作锁定在过去，谓语用过去式。',
        examMind: '🧠 考试现场：读到 ago / yesterday / last night，第一反应是"一般过去时"，再检查不规则过去式拼写是否正确。',
        cue: '🧠 以后看到 ago → 具体过去时间 → 一般过去时 → 查不规则过去式（give→gave）。'
      }
    },
    {
      id: 'tense02q02',
      pos: 2,
      type: 'choice',
      difficulty: 1,
      tag: '过去事件叙述',
      wrongType: 'TENSE_CONFUSION',
      question: 'When I was five, my grandmother ______ me a red kite on my birthday and taught me how to fly it in the park.',
      hint: '',
      options: ['makes', 'made', 'was making', 'has made', 'had made', 'is making'],
      answerIndex: 1,
      accepted: [],
      answerText: 'made',
      explanation: {
        answer: 'made',
        keyPoint: '回忆童年往事：when I was five 明确指向过去，叙述中两个并列动作都用一般过去时。',
        clue: '🔎 本题关键线索：when I was five（我五岁时）与并列谓语 taught me（教我）——整个场景都是对过去的回忆，且后面用一般过去时 taught，前面空格的时态必须与它一致。',
        trap: '⚠️ 不要被 was making 骗了：做风筝是一个完成的事实，不是"当时正在做"的持续画面；也不要看到五岁就说现在完成。这里最关键的是与 taught 并列、同属一段过去的回忆。',
        chain: 'When I was five ↓ 回忆过去的语境 ↓ and taught 并列 ↓ 两个过去动作用同一时态 ↓ 一般过去时 made',
        why: '句子开头 when I was five 把时间定位在"我五岁时"，随后奶奶做风筝（made）和教我放风筝（taught）是两个先后发生的过去动作，由 and 连接保持时态一致，都用一般过去时。make 的过去式是不规则变化 made。',
        whyOthers: 'A. "makes" 和 F. "is making" 是一般现在时，与童年的回忆矛盾；\nB. "made" 正确；\nC. "was making" 过去进行时强调做风筝时的持续过程，与 and taught 并列后时态不协调，且句中无"另一事件打断"的框架；\nD. "has made" 现在完成时不能用在 when I was five 这种明确结束的过去；\nE. "had made" 过去完成时需要有更早的过去参照点，句中没有。',
        commonError: '常见错误：把 when I was five 错当成现在完成时的线索，或受 and 后 taught 影响仍用进行时，导致两个并列谓语时态不一致。',
        memory: '一句话记忆：回忆里的并列动作，一个用过去，另一个也用过去。',
        examMind: '🧠 考试现场：看到 when I was …、long ago 这类回忆开头，锁定一般过去时，再看并列动词保持时态一致。',
        cue: '🧠 以后看到回忆/传记语境 → 一段过去的叙述 → 并列动作都过去时（make→made）。'
      }
    }
    ,
    {
      id: 'tense02q03',
      pos: 3,
      type: 'choice',
      difficulty: 2,
      tag: '过去时间与语境综合',
      wrongType: 'TENSE_CONFUSION',
      question: 'After the guests left, Aunt Wang ______ the dirty dishes into the kitchen and washed them one by one in hot water.',
      hint: '',
      options: ['carries', 'carried', 'was carrying', 'has carried', 'had carried', 'is carrying'],
      answerIndex: 1,
      accepted: [],
      answerText: 'carried',
      explanation: {
        answer: 'carried',
        keyPoint: '句中没有一个直接的时间副词，要靠叙事逻辑判断：客人离开后阿姨把碗收进厨房再洗，先后两个动作都用一般过去时。',
        clue: '🔎 本题关键线索：After the guests left（客人离开后）与 and washed them（然后把碗洗了）——left、washed 都是一般过去时，空格是同一段过去叙述中的一环，也必须用过去式。',
        trap: '⚠️ 不要因为没有 yesterday 就乱选：本句靠"事件先后 + 前后动词时态一致"来定答案。had carried 看似高级，但过去完成时要求动作发生在"另一个过去动作之前"，此处顺序是离开→收碗→洗碗，没有用完成时的理由。',
        chain: 'After the guests left ↓ 过去的先后事件 ↓ 收碗发生在洗碗之前 ↓ 两动作并列同用过去时 ↓ carried',
        why: '整句话讲的是"客人离开之后阿姨做家务"这段过去的连续事件：先收碗进厨房，再一只只洗干净。left 和 washed 都用一般过去时，由 and 连接的空格动作与它们处于同一时间线，因此也用一般过去时 carried。had carried 只有在收碗比 left 更早时才成立，而逻辑上收碗发生在离开之后。',
        whyOthers: 'A. "carries" 和 F. "is carrying" 是现在时，与整段过去叙述矛盾；\nB. "carried" 正确；\nC. "was carrying" 过去进行时强调"正在收碗"的背景画面，但句中是用 and washed 连接的两件完成的事，没有进行时的语境；\nD. "has carried" 现在完成时不能用于这种已结束的过去叙述；\nE. "had carried" 过去完成时要求收碗早于 left，而逻辑恰恰相反。',
        commonError: '常见错误：看到 and washed 之前不知该用什么时态就选进行时，或者过度使用 had done，忘了过去完成时必须有一个"更早的过去"作参照。',
        memory: '一句话记忆：讲故事时，先后两件事都用过去式，别乱加 had。',
        examMind: '🧠 考试现场：没有时间词时，先看前后动词是什么时态、事件先后是什么顺序，再决定空格用一般过去时。',
        cue: '🧠 以后看到 after… left + and + 过去式动词 → 一般过去叙述 → 空格也填过去式（carry→carried）。'
      }
    },
    {
      id: 'tense02q04',
      pos: 4,
      type: 'choice',
      difficulty: 2,
      tag: '过去事件叙述',
      wrongType: 'TENSE_CONFUSION',
      question: '"Did you watch the football match between Class Four and Class Five last Friday?" "Of course. Our class ______ two goals in the final ten minutes and won the game 4-2."',
      hint: '',
      options: ['scores', 'scored', 'has scored', 'was scoring', 'had scored', 'is scoring'],
      answerIndex: 1,
      accepted: [],
      answerText: 'scored',
      explanation: {
        answer: 'scored',
        keyPoint: '对话中回答方叙述上周五比赛里已发生的具体事件，用一般过去时。',
        clue: '🔎 本题关键线索：问句里的 last Friday（上周五）和答句末尾的 won the game（赢了比赛）——对话整段都在回忆一场已经结束的比赛，答句中两次进球、最终获胜都是过去完成的事实。',
        trap: '⚠️ 问句用 Did you watch… 已经给足信号：这是"过去时间 + 已结束动作"的组合，答案必须是过去式。不要被 has scored 吸引，现在完成时不能和 last Friday 这种明确的过去时间连用。',
        chain: '问句 last Friday ↓ 对话回忆过去 ↓ won the game 一般过去 ↓ 进球与赢球同一场比赛 ↓ scored',
        why: '这是一段关于上周五球赛的对话：问话人以 Did you watch 引出明确的过去时间 last Friday，答话人叙述本班在最后十分钟进了两球并以 4-2 获胜。进两球（scored）和赢得比赛（won）是过去时间线上两件已完成的事，所以空格用一般过去时 scored。',
        whyOthers: 'A. "scores" 和 F. "is scoring" 是现在时，不能叙述上周五的事；\nB. "scored" 正确；\nC. "has scored" 现在完成时不能与 last Friday 连用；\nD. "was scoring" 过去进行时表示"当时正在进球"的持续画面，"进两球"是可数的完成结果，且与并列的 won 不一致；\nE. "had scored" 过去完成时需要比它更早的过去动作作参照，句中没有。',
        commonError: '常见错误：忽略问句中的 last Friday，看到"刚刚发生"就用现在完成时 has scored；或把"当时正在进球"与"进了两球"混为一谈。',
        memory: '一句话记忆：对话里问 last Friday 的事，答话就回到一般过去时。',
        examMind: '🧠 考试现场：对话中出现 Did you…? 或 last night / last week，整段回答都用一般过去时叙述。',
        cue: '🧠 以后看到问句里的 Did + 过去时间词 → 答句叙述过去事实 → 一般过去时（score→scored）。'
      }
    },
    {
      id: 'tense02q05',
      pos: 5,
      type: 'choice',
      difficulty: 3,
      tag: 'used to 过去习惯',
      wrongType: 'VERB_FORM_ERROR',
      question: 'When Grandpa was young, he ______ for a walk along the river after supper every evening, a habit he gave up completely after his leg operation last year.',
      hint: '',
      options: ['use to go', 'uses to go', 'used to go', 'used to going', 'was used to going', 'got used to going'],
      answerIndex: 2,
      accepted: [],
      answerText: 'used to go',
      explanation: {
        answer: 'used to go',
        keyPoint: '描述"过去天天做、现在已不做"的习惯用 used to + 动词原形；本句考点是 used to do 的结构与拼写。',
        clue: '🔎 本题关键线索：every evening（每晚）加 a habit he gave up completely（一个他后来完全放弃的习惯）——反复发生的动作 + 现在已经停止，这正是 used to do 的典型语义。',
        trap: '⚠️ 不要被 was used to going 骗了：那是 be used to doing（习惯于做某事），表示一种"习惯了的静态状态"；而句中强调的是"每天去做、后来放弃"的动作习惯，只能用 used to do。也不要写 use to 或 uses to，used to 是固定结构。',
        chain: 'every evening ↓ 过去的习惯动作 ↓ gave up completely 说明现已停止 ↓ used to do 表过去习惯 ↓ used to go',
        why: '句子包含三个关键信息：when Grandpa was young 说明是过去；every evening 说明动作反复发生；gave up completely after his leg operation 说明这个习惯现在已经停止。三点合起来正是 used to do（过去常常做某事，现在不再做）的完整语义，所以填 used to go。结构上 used to 后接动词原形 go，而不是 going。',
        whyOthers: 'A. "use to go" 拼写错误，used to 是固定形式；\nB. "uses to go" 错误地给 used 加了三单 -s，used to 不需要随人称变化；\nC. "used to go" 正确；\nD. "used to going" 结构错误，used to 后必须接动词原形；\nE. "was used to going" 意为"过去习惯于做某事"，表状态而非习惯动作，与 gave up the habit 的语境不符；\nF. "got used to going" 意为"变得习惯于做某事"，强调从不习惯到习惯的变化过程，与句意不合。',
        commonError: '最常见的两类错：一是拼写写成 use to / uses to；二是把 used to do（过去常做）与 be used to doing（习惯于做）混为一谈。',
        memory: '一句话记忆：used to + 原形 = 过去常做现在不做；was used to + doing 才是"习惯于"。',
        examMind: '🧠 考试现场：看到 every day / every evening 这类反复 + "现在已经不做了"的提示，锁定 used to do，再看后面动词是不是原形。',
        cue: '🧠 以后看到"过去习惯 + 现已停止" → used to + 动词原形，别写 use to，也别接 doing。'
      }
    },
    {
      id: 'tense02q06',
      pos: 6,
      type: 'choice',
      difficulty: 4,
      tag: '一般过去时综合',
      wrongType: 'TENSE_CONFUSION',
      question: 'Last night our basketball team ______ the city final by two points after being behind for most of the game, and the gym exploded with joy.',
      hint: '',
      options: ['wins', 'won', 'has won', 'was winning', 'had won', 'is winning'],
      answerIndex: 1,
      accepted: [],
      answerText: 'won',
      explanation: {
        answer: 'won',
        keyPoint: '综合题：明确过去时间（last night）+ 比赛结果（by two points）+ 后文反应（exploded with joy），多线索共同指向一般过去时。',
        clue: '🔎 本题关键线索：Last night 是时间定位，by two points 表明这是最终比分结果，而 and the gym exploded with joy（体育馆爆发出欢呼）用一般过去时交代了结果带来的反应——三个线索都说明夺冠是过去完成的既定事实。',
        trap: '⚠️ 不要被 was winning 迷惑：那是"当时正领先"的进行中状态，而 by two points 是全场最终比分，是完成的结果；也不要看到"赢了所以现在高兴"就用 has won，句子有 last night 这一明确过去锚点。',
        chain: 'Last night ↓ 明确过去时间 ↓ by two points 是最终结果 ↓ exploded 一般过去呼应 ↓ 过去式 won',
        why: '句首 Last night 明确把事件放在过去；大比分落后大半场却在最后以两分之差赢下决赛，描述的是一个已经结束的比赛结果；后半句 the gym exploded with joy 用一般过去时写出了赢球后现场的反应。整句是"过去事件 + 过去反应"的完整叙述，动词必须用一般过去时。win 的过去式是不规则变化 won。',
        whyOthers: 'A. "wins" 和 F. "is winning" 是现在时，与 last night 矛盾；\nB. "won" 正确；\nC. "has won" 现在完成时不能与 last night 连用，且与并列的 exploded 时态不一致；\nD. "was winning" 表示比赛进行中"正领先"，不能表达 by two points 的最终结果；\nE. "had won" 过去完成时要求夺冠发生在另一个过去动作之前，句中缺少这样的参照。',
        commonError: '常见错误：把"过去赢球 + 现在还在高兴"误判成现在完成时的理由，忽略了 last night 这个硬时间标志。',
        memory: '一句话记忆：last night 的比赛结果已经定格，赢就是 won，别让"现在的情绪"干扰时态。',
        examMind: '🧠 考试现场：时间词 + 结果词（比分/最终）+ 过去的反应，三者齐备就是一般过去时。',
        cue: '🧠 以后看到 last night + 具体结果 → 一般过去时（win→won），警惕 has won 陷阱。'
      }
    }
    ,
    {
      id: 'tense02q07',
      pos: 7,
      type: 'input',
      difficulty: 2,
      tag: '不规则动词形式',
      wrongType: 'VERB_FORM_ERROR',
      question: 'Yesterday our geography teacher ______ us how to read a weather map, and she showed us satellite photos of the typhoon that hit our coast last summer.',
      hint: 'teach',
      accepted: ['taught'],
      answerText: 'taught',
      explanation: {
        answer: 'taught',
        keyPoint: '动词拼写题：yesterday 提示过去，teach 的过去式是不规则形式 taught，不能按规则加 -ed。',
        clue: '🔎 本题关键线索：句首的 Yesterday 与并列动词 showed（展示过卫星照片）——地理老师昨天教读天气图、还展示台风照片，两件事都已完成，主干动词用过去式。',
        trap: '⚠️ 不要按规则动词的思路写 teached：teach 属于不规则动词，过去式是 taught。也不要因为后文 typhoon 就联想其他动词，空格只要求把 teach 变成正确的过去式。',
        chain: 'Yesterday ↓ 明确过去 ↓ and showed 并列过去 ↓ 主干动词同样过去 ↓ teach→taught',
        why: 'Yesterday 把整个场景定位在过去：老师教大家读天气图，还展示了去年夏天袭击沿海的台风卫星照片。教（taught）与展示（showed）是同一堂课上已经完成的并列动作，都用一般过去时。teach 的过去式是不规则变化 taught，需要直接记忆，不能推导出 teached。',
        whyOthers: '易错写成：① "teached"——把不规则动词当成规则动词加 -ed，这是最常见的错误；② "teach"——原形，没有体现过去；③ "has taught"——yesterday 表示已结束的过去，不能用现在完成时。',
        commonError: '大多数学生不是时态判断错，而是不规则动词形式没背熟，把 teach→taught 写成 teached 或 taught 拼错。',
        memory: '一句话记忆：teach-taught-taught，教书的"过去式"和"教过"都不带 -ed。',
        examMind: '🧠 考试现场：先看时间词确认过去，再在脑子里快速过一遍该不规则动词的过去式，别手快加 -ed。',
        cue: '🧠 以后看到 teach 的填空 → 回想 teach-taught-taught → 写 taught，不写 teached。'
      }
    },
    {
      id: 'tense02q08',
      pos: 8,
      type: 'input',
      difficulty: 2,
      tag: '过去事件叙述',
      wrongType: 'SPELLING_ERROR',
      question: 'Last summer, our whole family ______ along the coast of Fujian by car, stopping at almost every fishing village to enjoy the fresh seafood.',
      hint: 'travel',
      accepted: ['travelled', 'traveled'], // 英式 travelled（上海教材）/ 美式 traveled 均可
      answerText: 'travelled',
      explanation: {
        answer: 'travelled',
        keyPoint: '动词拼写题：Last summer 提示过去，travel 加 -ed 构成过去式；拼写时注意英式要双写 l 写成 travelled。',
        clue: '🔎 本题关键线索：Last summer（去年夏天）说明整个自驾行程发生在过去；句中 stopping at almost every fishing village 这个分词短语补充说明行程细节，主干动词要用过去式。',
        trap: '⚠️ 不要被 travel 看似"普通加 -ed"骗了：travelled 在英式英语中要双写末尾的 l（travel→travelled）。也不要因为沿途在吃海鲜就忘记判断时态，决定答案的是 Last summer 加整段过去叙述。',
        chain: 'Last summer ↓ 明确的过去时间 ↓ 全家沿海自驾是已结束的行程 ↓ travel 过去式 ↓ travelled',
        why: 'Last summer 把时间定在过去，全家开车沿福建海岸旅行、在渔村停下来吃海鲜，是去年夏天已经完成的经历，所以主干动词 travel 要变成过去式 travelled（英式双写 l；美式可写 traveled，本库两种拼写都接受）。句子中的分词短语 stopping at… 是附加说明，不影响主干时态。',
        whyOthers: '易错写成：① "travelling"-类错误——把进行时或动名词当作主干谓语，句子就会没有真正的过去式动词；② "travels"——一般现在时，与 Last summer 矛盾；③ "traveled" 属美式拼写，在英式作答时会被判错（本库已放宽接受）。',
        commonError: '拼写最容易错在 l 的双写上：英式 travelled 要双写 l，很多学生写成 travel ed 或只加一个 l。',
        memory: '一句话记忆：travel 加 -ed 前，先想清楚英式要双写 l——travelled。',
        examMind: '🧠 考试现场：确认过去时后用口诀检查拼写：结尾辅音 + 重读闭音节或特殊词要双写（travel→travelled）。',
        cue: '🧠 以后写 travel 的过去式 → 双写 l 加 -ed → travelled（美式 traveled 也接受）。'
      }
    },
    {
      id: 'tense02q09',
      pos: 9,
      type: 'input',
      difficulty: 3,
      tag: '过去时间与语境综合',
      wrongType: 'TENSE_CONFUSION',
      question: 'I waved at my classmate across the street, but she ______ me because her earphones were playing music at full volume.',
      hint: 'not / notice',
      accepted: ['did not notice', 'didn\'t notice'],
      answerText: 'did not notice',
      explanation: {
        answer: 'did not notice',
        keyPoint: '上下文题：没有时间副词，要靠叙事推断——前面 waved 已是过去，后面 she…me 是同一场景中的过去事实，否定式要用 did not + 原形。',
        clue: '🔎 本题关键线索：前半句 I waved（我挥手）是一般过去时，交代了整个场景发生在过去；earphones were playing music（耳机正大声放着音乐）解释了"没注意到"的原因，空格处应填与 waved 同级的过去否定形式。',
        trap: '⚠️ 不要因为没有 yesterday 就犹豫：句中 waved 和 were playing 已经把时间线定在过去。也不要写成 was not noticing，notice 是状态动词，一般不用进行时；has not noticed 则会和过去的 waved 矛盾。',
        chain: 'I waved 过去 ↓ 同一场景 ↓ 原因：耳机太响 ↓ 过去否定 ↓ did not notice',
        why: '句子讲的是发生在过去的瞬间场景：我向街对面的同学挥手，但她因为耳机音量开得太大没有注意到我。waved 用一般过去时把时间定死，后面的动作是同一时刻的过去事实，所以"没有注意到"要用一般过去时的否定式 did not notice（did + not + 动词原形）。',
        whyOthers: '易错写成：① "did not noticed"——did 后面必须跟动词原形 notice，不能再用过去式；② "was not noticing"——notice 表示"注意到"这一瞬间状态，一般不用进行时；③ "has not noticed"——现在完成时强调到现在为止的状态，与过去场景 waved 不协调。',
        commonError: '否定句最常见的错误是 did 之后又用过去式（did not noticed），或是把状态动词 notice 误用成进行时。',
        memory: '一句话记忆：过去否定 = didn\'t + 动词原形，did 之后"原形站岗"。',
        examMind: '🧠 考试现场：看到空格前没有时间词，就去前文找叙述时态；否定句里 did 后面永远接原形。',
        cue: '🧠 以后看到过去叙述中的否定 → didn\'t + 原形（did not notice），杜绝 did not noticed。'
      }
    },
    {
      id: 'tense02q10',
      pos: 10,
      type: 'input',
      difficulty: 4,
      tag: '过去时间与语境综合',
      wrongType: 'TENSE_CONFUSION',
      question: 'At nine last night the electricity suddenly went out. My mother ______ two candles on the table, and we finished our dinner by candlelight.',
      hint: 'light',
      accepted: ['lit', 'lighted'], // light 的过去式 lit / lighted 均为标准形式
      answerText: 'lit',
      explanation: {
        answer: 'lit',
        keyPoint: '语境判断题：停电后母亲点蜡烛是一个瞬间完成的过去动作，用一般过去时；light 的过去式是 lit（lighted 也标准）。',
        clue: '🔎 本题关键线索：第一句 went out（停电）用一般过去时交代了事故，第二句 and we finished our dinner（我们借着烛光吃完了晚饭）说明点蜡烛是停电后立刻完成的动作——两句连起来是一段连贯的过去叙述。',
        trap: '⚠️ 不要被"点蜡烛当时正在进行"的思路带偏：这里没有"另一个动作打断点蜡烛"的框架，停电后点蜡烛是马上完成的小动作，用一般过去时 lit 即可。had lit 则要求点蜡烛发生在停电之前，与语境相反。',
        chain: 'went out 停电 ↓ 过去场景 ↓ 母亲点蜡烛是即时动作 ↓ 与 finished 并列 ↓ lit',
        why: '第一句交代昨晚九点突然停电，用一般过去时 went out；第二句接着写母亲在桌上点起两支蜡烛，一家人借着烛光吃完了晚饭。点蜡烛（lit）是停电后立即发生的、已经结束的动作，与并列的 finished our dinner 时态一致，所以用一般过去时。light 的过去式有两个标准形式 lit 和 lighted，以 lit 更常用。',
        whyOthers: '易错写成：① "was lighting"——进行时表示"正在点"，但句中需要的是一个与 finished 并列的完成动作，且没有被打断的背景框架；② "had lit"——过去完成时要求点蜡烛发生在停电之前，逻辑上不成立；③ "has lit"——整个场景是过去的叙述，不能用现在完成时。',
        commonError: '常见错误：把"过去进行的持续动作"与"过去瞬间完成的动作"混为一谈；另一个易错点是 light 的过去式拼写，记得是 lit。',
        memory: '一句话记忆：停电→点蜡→吃完晚饭，一串过去的动作，light 的过去式是 lit。',
        examMind: '🧠 考试现场：两句话连读判断时间线；瞬时完成的动作用一般过去时，别一看到"正在"的苗头就用进行时。',
        cue: '🧠 以后看到过去场景里的瞬时动作 → 一般过去时；light→lit / lighted。'
      }
    },
    {
      id: 'tense02q11',
      pos: 11,
      type: 'input',
      difficulty: 4,
      tag: '一般过去时综合',
      wrongType: 'TENSE_CONFUSION',
      question: 'Yesterday our class visited the science museum. Most of us ______ to leave when the closing time came, and some even asked the guide to keep it open longer.',
      hint: 'not / want',
      accepted: ['did not want', 'didn\'t want'],
      answerText: 'did not want',
      explanation: {
        answer: 'did not want',
        keyPoint: '两句话的小语篇：第一句 visited 锁定过去，第二句叙述当时的心理与行为，否定过去事实用 did not + 原形。',
        clue: '🔎 本题关键线索：第一句的 Yesterday…visited（昨天参观了）是整个语篇的过去锚点；第二句 came（闭馆时间到了）、asked（请求）都是一般过去时，空格是这段过去叙述里同学们"不想离开"的当时心理。',
        trap: '⚠️ 这是典型的"两句话综合"题：只看第二句容易犹豫，但第一句 Yesterday 已经把整段定成过去。也不要写 haven\'t wanted，want 是状态动词，此处要表达的是昨天那一时刻"不想走"，不是延续到现在的状态。',
        chain: 'Yesterday…visited ↓ 语篇锁定过去 ↓ came / asked 皆过去 ↓ 当时的心理状态 ↓ did not want',
        why: '第一句用 Yesterday 和 visited 交代了"昨天全班参观科技馆"这一过去事件；第二句写闭馆时间到时大多数同学还不想离开，有人甚至请讲解员延长开放时间。第二句里的 came 和 asked 都是一般过去时，说明整段是在叙述昨天的情况，因此"不想离开"用过去否定式 did not want。',
        whyOthers: '易错写成：① "did not wanted"——did 后要接原形 want；② "was not wanting"——want 是状态动词，一般不用进行时；③ "has not wanted"——现在完成时会把时间拉到现在，与 Yesterday 语篇冲突。',
        commonError: '综合语篇题的常见失误是只看空格所在句子、忽略第一句的时间锚点，导致时态摇摆。',
        memory: '一句话记忆：小语篇先找第一句的时间词，后面所有动作跟着它走。',
        examMind: '🧠 考试现场：语篇题先读第一句定基调（Yesterday→过去），再让后续空格与 came / asked 保持一致。',
        cue: '🧠 以后做语篇填空 → 先锁定首句时间 → 否定过去用 didn\'t + 原形。'
      }
    },
    {
      id: 'tense02q12',
      pos: 12,
      type: 'input',
      difficulty: 5,
      tag: '一般过去时综合',
      wrongType: 'VERB_FORM_ERROR',
      question: 'My aunt works as a police officer in our city. Last Tuesday, she ______ two thieves who had stolen a wallet from an old man at the subway station.',
      hint: 'catch',
      accepted: ['caught'],
      answerText: 'caught',
      explanation: {
        answer: 'caught',
        keyPoint: '接近真实作业的综合题：第一句用一般现在时介绍人物身份，Last Tuesday 把事件拉回过去，定语从句 had stolen 交代更早发生的事，主干动词用一般过去时 caught。',
        clue: '🔎 本题关键线索：Last Tuesday（上周二）是主干事件的明确时间；who had stolen a wallet（偷了钱包）用过去完成时表示"偷"发生在"抓"之前——句子用两种过去时态把时间先后排得清清楚楚，主干"抓"是一般过去时。',
        trap: '⚠️ 不要被定语从句里的 had stolen 带偏、以为主干也要用完成时：had stolen 是用来表达"偷钱包在先"的，主干的"抓到小偷"发生在周二当天，用一般过去时 caught 即可。也不要写 catched，catch 是不规则动词。',
        chain: 'Last Tuesday ↓ 主干动作的明确时间 ↓ had stolen 表示偷在前 ↓ 抓在周二完成 ↓ catch→caught',
        why: '第一句介绍阿姨的职业用一般现在时（works），第二句笔锋转到上周二的具体事件：她在地铁站抓住了两个偷走老人钱包的小偷。定语从句 had stolen a wallet 用过去完成时，是为了表明"偷"发生在"抓"之前；主干事件有明确时间 Last Tuesday 且已经结束，所以用一般过去时 caught。catch 的过去式是不规则变化 caught，不是 catched。',
        whyOthers: '易错写成：① "catched"——把不规则动词按规则加 -ed，这是本题最典型的错误；② "has caught"——与 Last Tuesday 这一已结束的过去时间冲突；③ "had caught"——主干没有比 it 更早的过去参照，完成时没有用武之地（抓本身在周二完成）。',
        commonError: '句子同时出现一般现在时、一般过去时、过去完成时三种时态，学生容易在"主干用过去式"上栽跟头，或因 had stolen 在场而误用过去完成。',
        memory: '一句话记忆：catch-caught-caught；从句里 had stolen 只是配角，主干在 Last Tuesday 里用过去式。',
        examMind: '🧠 考试现场：长句先划主干和从句，主干有自己的时间词就用一般过去时；看到 had + 过去分词只说明"更早发生"。',
        cue: '🧠 以后看到 had stolen / had done 之类的从句 → 那是"更早"的信号 → 主干按自己的时间词用一般过去时（catch→caught）。'
      }
    }
    ],
    pool: [
    {
      id: 'tense02p01',
      pos: 1,
      type: 'input',
      difficulty: 5,
      tag: 'used to 过去习惯',
      wrongType: 'VERB_FORM_ERROR',
      question: 'My uncle often says that when he studied at university in the 1980s, he ______ fast food because there were very few fast-food restaurants in Shanghai in those days.',
      hint: 'not / use / eat',
      accepted: ['did not use to eat', 'didn\'t use to eat', 'used not to eat'],
      answerText: 'did not use to eat',
      explanation: {
        answer: 'did not use to eat',
        keyPoint: 'used to 的否定式：表达"过去不习惯/不常做某事"，标准形式是 didn\'t use to do（英式也可用 used not to do），后接动词原形。',
        clue: '🔎 本题关键线索：when he studied at university in the 1980s 把时间锁在 1980 年代；because there were very few fast-food restaurants 解释了原因——那个年代上海几乎没有快餐店，所以他"过去不常吃快餐"。',
        trap: '⚠️ 最大的陷阱是把否定写成 didn\'t used to eat：在 did 之后要用原形 use，构成 didn\'t use to do，这是标准英语（尽管口语里 didn\'t used to 也流行，但考试不认可）。同时注意别和 be used to doing（习惯于）混淆。',
        chain: 'in the 1980s ↓ 过去的时代背景 ↓ 当时快餐店极少 ↓ 过去没有这个习惯 ↓ did not use to eat',
        why: '句子说的是叔叔大学时代（1980 年代）的生活：当时上海几乎没有快餐店，因此他过去并不常吃快餐。这里要表达"过去没有某个习惯"，需要用 used to 的否定式。最常见的写法是 didn\'t use to eat（did 后用原形 use），英式正式文体也可用 used not to eat，因此本题三种都接受；绝不能写 didn\'t used to eat。',
        whyOthers: '易错写成：① "didn\'t used to eat"——did 之后动词必须用原形，used 要还原为 use；② "was not used to eat"——把 be used to doing（习惯于）的结构套错，且后面应是 eating；③ "doesn\'t use to eat"——主语叙述的是过去时代，时态错了。',
        commonError: 'used to 的否定和疑问是难点：学生常把 didn\'t use to 写成 didn\'t used to，或与 be used to doing 结构混淆。',
        memory: '一句话记忆：didn\'t 后面用原形——didn\'t use to eat；used not to 也正确。',
        examMind: '🧠 考试现场：看到"过去不常做某事"→ 否定式首选 didn\'t use to + 原形，写完检查 did 后是否用了原形。',
        cue: '🧠 以后写 used to 的否定 → didn\'t use to do（不是 didn\'t used to）；"习惯于"才用 be used to doing。'
      }
    },
    {
      id: 'tense02p02',
      pos: 2,
      type: 'input',
      difficulty: 4,
      tag: '不规则动词形式',
      wrongType: 'VERB_FORM_ERROR',
      question: 'In the cycling race at our school sports meeting last autumn, my best friend ______ off her bicycle, yet she got back on at once and still finished third.',
      hint: 'fall',
      accepted: ['fell'],
      answerText: 'fell',
      explanation: {
        answer: 'fell',
        keyPoint: '不规则动词拼写：叙述去年秋天运动会上的过去事件，fall 的过去式是 fell，不是 falled。',
        clue: '🔎 本题关键线索：last autumn 和并列动作 got back on、finished third 都交代了这是一段过去的比赛叙述——好友摔下自行车，又爬起来骑完并拿了第三名，主干动词要用过去式。',
        trap: '⚠️ 不要被 got back on / finished 等并列动词带偏成别的时态，也不要按规则动词把 fall 写成 falled：fall-fell-fallen，过去式只有 fell。',
        chain: 'last autumn ↓ 过去比赛叙述 ↓ got back on 一般过去 ↓ 摔车与爬起同一场景 ↓ fall→fell',
        why: '句子叙述去年秋季校运会自行车比赛中的一幕：好朋友摔下自行车（fell off her bicycle），但立刻重新上车骑完全程并获第三名。got back on、finished 都是一般过去时，说明整段是过去叙述，摔车这一瞬间动作同样用过去式 fell。fall 是不规则动词，过去式 fell，过去分词 fallen，绝不能在原形上加 -ed。',
        whyOthers: '易错写成：① "falled"——对不规则动词强行加 -ed，这是头号错误；② "falls"——现在时，与 last autumn 矛盾；③ "has fallen"——现在完成时强调到现在的状态，与已结束的过去比赛叙述不符。',
        commonError: 'fall 的三态 fall-fell-fallen 容易被记混，考试中最常见把过去式错写成 falled。',
        memory: '一句话记忆：fall-fell-fallen，摔跤摔在过去就是 fell，没有 falled。',
        examMind: '🧠 考试现场：叙述过去事件时遇到不规则动词，先在脑中列出三态（fall-fell-fallen），取过去式。',
        cue: '🧠 以后看到 fall 要填过去 → fell；看到 has/had 才轮到 fallen。'
      }
    },
    {
      id: 'tense02p03',
      pos: 3,
      type: 'input',
      difficulty: 3,
      tag: '过去事件叙述',
      wrongType: 'TENSE_CONFUSION',
      question: 'When my father was a college student in the 1990s, he ______ much money on clothes, because he preferred to buy dictionaries and second-hand books for his English study.',
      hint: 'not / spend',
      accepted: ['did not spend', 'didn\'t spend'],
      answerText: 'did not spend',
      explanation: {
        answer: 'did not spend',
        keyPoint: '叙述父亲学生时代的过去事实：in the 1990s 锁定过去，否定过去行为用 did not + 原形。',
        clue: '🔎 本题关键线索：when my father was a college student in the 1990s 是一个完整的过去时间背景；because he preferred to buy dictionaries 给出原因——他更愿意把钱花在买书上，所以"没在衣服上花多少钱"。',
        trap: '⚠️ 不要看到"花了很多年省钱买书"的现在影响就动现在完成时的心思：has not spent 会把时间拉到现在，而整句明确是 1990 年代学生时代的往事。preferred 是一般过去时，前后必须一致。',
        chain: 'in the 1990s ↓ 父亲学生时代 ↓ preferred 一般过去 ↓ 过去的否定事实 ↓ did not spend',
        why: '整句话回忆父亲上世纪九十年代读大学时的情形：他很少在衣服上花钱，因为更喜欢买词典和二手书学英语。时间状语 in the 1990s 和并列原因从句里的 preferred 都用过去时，说明这是已经结束的过去事实，因此"没有花很多钱"用一般过去时的否定式 did not spend。',
        whyOthers: '易错写成：① "did not spent"——did 后必须接原形 spend；② "has not spent"——现在完成时强调与现在的关联，而这里是九十年代的往事；③ "was not spending"——表示"当时没在花钱"的持续状态，与整段叙述不符。',
        commonError: '否定式里 did 后误用过去式（did not spent）是高频错误；另一误区是让"省钱的习惯影响到现在"误导时态。',
        memory: '一句话记忆：in the 1990s 一出现，过去事实 + didn\'t 原形。',
        examMind: '🧠 考试现场：明确年份/时代 + 原因从句用过去时 → 主干用一般过去否定式，did 后回原形。',
        cue: '🧠 以后看到 in the 1990s / in 2010 等 → 过去 → didn\'t spend（did 后原形）。'
      }
    },
    {
      id: 'tense02p04',
      pos: 4,
      type: 'input',
      difficulty: 4,
      tag: '过去时间与语境综合',
      wrongType: 'TENSE_CONFUSION',
      question: 'While the soldiers were marching along the narrow mountain road, a military car suddenly ______ past them and disappeared round the next bend.',
      hint: 'speed',
      accepted: ['sped', 'speeded'], // speed 的过去式 sped / speeded 均为标准形式
      answerText: 'sped',
      explanation: {
        answer: 'sped',
        keyPoint: '区分背景进行时与瞬间动作：while 从句用过去进行时交代"正在行军"的背景，主干里突然发生、随即消失的动作用一般过去时。',
        clue: '🔎 本题关键线索：While the soldiers were marching（士兵们正沿山路行军）是持续背景；suddenly（突然）和 disappeared（消失了）表明军车从身边驶过是一个瞬间完成的动作，主干动词必须用一般过去时。',
        trap: '⚠️ 不要因为主句旁有 were marching 就把空格也填成进行时：while 从句里的过去进行时正是为"突然插入的瞬间动作"做铺垫的，suddenly 就是信号——瞬间动作用一般过去时 sped。',
        chain: 'were marching ↓ 持续背景（过去进行） ↓ suddenly 瞬间动作 ↓ and disappeared 并列 ↓ sped',
        why: 'while 引导的从句用过去进行时 were marching 描绘士兵行军这一持续背景；此时一辆军车突然从他们身边疾驰而过并消失在下一个弯道。suddenly 和并列的 disappeared 都说明"驶过"是瞬间完成的动作，而不是持续的过程，所以用一般过去时。speed 的过去式既可以是 sped 也可以是 speeded，两者都标准，sped 更常用。',
        whyOthers: '易错写成：① "was speeding"——进行时表示"正在疾驰"，与突然消失的瞬间动作矛盾；② "had sped"——过去完成时要求有更早的过去参照，句中没有；③ "speeds"——现在时，与整段过去叙述冲突。',
        commonError: '最典型的错误是"看到从句是过去进行，主句就跟着进行"，忽略了 suddenly 这类瞬间副词对一般过去时的提示。',
        memory: '一句话记忆：while 进行打底，突然一个瞬间动作 → 一般过去时 sped past。',
        examMind: '🧠 考试现场：while + was/were doing 出现时，主干里突然发生的动作用一般过去时。',
        cue: '🧠 以后看到 while…were doing + suddenly → 主干瞬间动作用过去式（speed→sped/speeded）。'
      }
    },
    {
      id: 'tense02p05',
      pos: 5,
      type: 'input',
      difficulty: 4,
      tag: '一般过去时综合',
      wrongType: 'TENSE_CONFUSION',
      question: 'Last week our club held a cooking lesson for beginners. Everyone ______ to make a traditional dish, and we shared all the food together in the dining hall afterwards.',
      hint: 'learn',
      accepted: ['learnt', 'learned'], // learn 的过去式 learnt（英式）/ learned（美式）均为标准形式
      answerText: 'learnt',
      explanation: {
        answer: 'learnt',
        keyPoint: '两句话的过去语篇：Last week 和 held、shared 都用过去时，空格主干动词也用过去式；learn 的过去式是 learnt 或 learned。',
        clue: '🔎 本题关键线索：第一句 Last week…held 锁定上周；第二句 and we shared all the food（随后一起分享了食物）用一般过去时——每个人学会做一道菜、然后分享，是同一段已结束的活动。',
        trap: '⚠️ 不要因为"学会的东西现在还记得"就误用现在完成时 has learnt：语篇明确讲的是上周那次烹饪课里发生的事，held、shared 都是过去时，空格必须跟它们一致。',
        chain: 'Last week…held ↓ 过去活动背景 ↓ and shared 一般过去 ↓ 学会做菜同属该活动 ↓ learnt / learned',
        why: '第一句说上周俱乐部为新手办了一次烹饪课（held）；第二句写每个人当时都学会做一道传统菜，之后在食堂一起分享了所有食物（shared）。两句话都在叙述上周这一过去活动，主干动词 learn 用过去式 learnt（英式）或 learned（美式），本库两种都接受。',
        whyOthers: '易错写成：① "has learnt / has learned"——现在完成时把时间拉到现在，与 Last week 及 held 冲突；② "learns"——现在时；③ "was learning"——进行时表示"正在学"，与已完成的烹饪课叙述不符。',
        commonError: 'learn 的双拼写（learnt / learned）常让学生困惑；更重要的是别被"学到的东西现在还在"误导成现在完成时。',
        memory: '一句话记忆：Last week 的烹饪课已经结束——learned 还是 learnt 都对，时态必须是过去。',
        examMind: '🧠 考试现场：语篇里首句给时间词，后面动作一律跟过去时，learn 的过去式两种拼写都接受。',
        cue: '🧠 以后看到 learn 的过去填空 → learnt（英）/ learned（美），先问一句"是不是过去的课/经历"。'
      }
    },
    {
      id: 'tense02p06',
      pos: 6,
      type: 'input',
      difficulty: 5,
      tag: '过去事件叙述',
      wrongType: 'TENSE_CONFUSION',
      question: 'Our school organised a trip to a farm last month. Everybody jumped out of the bus, but our teacher ______ us to run around until she had checked the area.',
      hint: 'not / allow',
      accepted: ['did not allow', 'didn\'t allow'],
      answerText: 'did not allow',
      explanation: {
        answer: 'did not allow',
        keyPoint: '综合语篇题：三句叙述层层推进，教师"检查完才允许跑动"是过去事件的先后逻辑，主干用过去否定式 did not allow，从句用过去完成时 had checked 表"先检查"。',
        clue: '🔎 本题关键线索：until she had checked the area（直到她检查完场地）——had checked 用过去完成时标明"检查"发生在"允许"之前，主干动作则是过去的事实：老师不让我们乱跑。',
        trap: '⚠️ 句中的 had checked 很容易让人误以为主干也要用完成时，其实恰恰相反：had checked 只说明检查在先，主干要表达"当时不允许"，用 didn\'t allow。也不要把 allow 的过去式与 allow 混拼。',
        chain: 'organised / jumped 过去 ↓ 老师要保证安全 ↓ had checked 先检查 ↓ 检查前不许乱跑 ↓ did not allow',
        why: '语篇叙述上个月学校组织去农场的活动：同学们一下车就兴奋地跳下车，但老师直到确认场地安全后才允许大家跑动。主干"不允许"是过去发生的事实，用一般过去否定式 did not allow；从句 until she had checked the area 用过去完成时，是因为"检查"在"允许"之前完成，两句配合把时间先后讲得清清楚楚。',
        whyOthers: '易错写成：① "did not allowed"——did 后必须用原形 allow；② "had not allowed"——主干没有需要它"更早"的过去参照，反而与 had checked 的时间关系混乱；③ "has not allowed"——整段是上个月的过去叙述，不能用现在完成时。',
        commonError: '语篇中出现两三个过去动作时，学生容易把 had done 用在错误的位置，或忘了 did 后动词回原形。',
        memory: '一句话记忆：had checked 在先 → 主干 did not allow 在后；did 后面永远接原形。',
        examMind: '🧠 考试现场：遇到 until / before 等时间连词，先排出先后顺序：先发生用过去完成，后发生的动作在主干用一般过去时。',
        cue: '🧠 以后看到 had done + until → 主干动作在"之后"发生 → didn\'t + 原形（did not allow）。'
      }
    }
    ]
  };
})();
