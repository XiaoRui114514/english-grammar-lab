/* ============================================================
 * data/bank-papers-03.js — 上海真题语篇 05-06（整篇 10 空 · 真卷口径）
 * 05 = 2021 上海高考；06 = 浦东新区多校联考 25-26 学年高一期中（解析写法取该卷）
 * ============================================================ */
(function () {
  'use strict';
  var P = window.__EGL_PAPERS__ = window.__EGL_PAPERS__ || [];

  P.push({
    id: 'paper05',
    no: '05',
    title: 'Being in a Band Is Cool',
    source: '2021 · 上海高考',
    level: '高三',
    genre: '说明文（指南）',
    words: 296,
    topic: '校园音乐社团：组乐队的实用指南',
    readGuide: '指南类文章，分小标题给建议。语气是“你”对着读者说，注意祈使句和 you 的泛指用法；第一段有对过去的假设（would feel）。',
    passage: 'When you were younger, you would feel it a waste of time taking piano lessons. Carrying a flute (长笛) from class to class just for a half-hour lesson ______ not have seemed meaningful. But as you grow up, you realize that being in a band is pretty cool. Yet, ______ talented you are, it’s still not easy to organize a band. Good news! Here’s a quick guide to help you.\n\n√ Find your members\nYou’ll need a drummer, a guitarist and a singer. Any other instrument is a bonus. This is where the flute finds its place. If you can make ______ (play) the flute cool, you deserve all the fame and fortune in the world!\n\n√ Organize a band practice\nIf you have a band member ______ a set of drums and parents who are hard of hearing, you can practice at home for free. Otherwise, you’ll need to find a local studio, for ______ you have to pay a handsome amount of money. ______ (divide) the cost equally, including the cost of hiring any equipment for the drummer. You rock together, and you roll together!\n\n√ Be productive\nIf you’re paying for a studio, the last thing you want is to spend it chatting with each other, so meet half an hour in advance to get all the chatting ______ (finish).\n\n√ Agree on songs, and learn them!\nEach band member should choose a song for the whole band ______ (learn). This will allow you to find out ______ music works for your group.\n\n√ Start writing\nOnce you know your type of music, start writing! You can do this individually or as a band but the most important thing is to respect other people’s songs. It’s very rare to find ______ that isn’t shy about sharing their first few pieces of writing, so be nice!',
    blanks: [
      {
        answer: 'must', accepted: ['must'], given: '', isGiven: false,
        catId: 'extra', point: '情态动词 + have done（对过去的推测）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 4,
        sense: '为了半小时的课，把长笛从一间教室背到另一间教室，在当时看来肯定没什么意义。',
        clue: '空后是 not have seemed（完成式），且整段在讲“你小时候”的事；语义是“（在当时看来）一定显得没意义”。',
        why: '先看结构：______ not have seemed meaningful 需要一个情态动词与 have seemed 构成谓语。再看语义：作者在回看小时候的感受，做的是对过去情况的肯定推测，用 must have done；否定词 not 属于后面的谓语部分（must not have seemed = “一定显得不……”）。',
        others: '①should：should not have done 表示“本不该做却做了”，是对行为的责备，与本句“显得没意义”不同；②can：can not have done 表示“不可能做过”，语气是否定推测，与句意相反；③would：would not have done 是虚拟条件句的结果，本句没有虚拟条件。',
        tip: 'must have done（一定做过）/ can’t have done（不可能做过）——都用来推测过去。'
      },
      {
        answer: 'however', accepted: ['however'], given: '', isGiven: false,
        catId: 'adverbial', point: 'however + adj. + 主谓（让步状语从句）',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 4,
        sense: '然而，不管你多有天赋，组建一支乐队仍然不容易。',
        clue: '空后紧跟形容词 talented，然后是 you are；这是 however + adj./adv. + 主语 + 谓语的让步结构。',
        why: '先看结构：______ talented you are 中 talented 是形容词，前面需要能修饰形容词并引导让步从句的词，however 正好构成“无论多么……”；同时主句 it’s still not easy 有 still 呼应让步。再看语义：“不管你多有天赋，组乐队都不容易”。',
        others: '①whatever：whatever 后面接名词或从句，不能直接修饰形容词 talented；②no matter：要写成 no matter how talented you are 才成立，单空填不下；③but：but 是并列连词，不能引导这个从句。',
        tip: 'however + adj./adv. + 主谓 = no matter how + adj./adv. + 主谓（无论多么……）。'
      },
      {
        answer: 'playing', accepted: ['playing'], given: 'play', isGiven: true,
        catId: 'nonfinite', point: '动名词作 make 的宾语',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '如果你能把吹长笛这件事弄得很酷，那全世界的名声和财富你都配得上！',
        clue: 'make ______ (play) the flute cool：make 后面是“宾语 + 宾补 cool”，宾语是“吹长笛”这件事，需要用名词性成分。',
        why: '先看结构：make + 宾语 + 形容词（宾补）。这里宾语不是 the flute（长笛本身不会“酷”），而是“吹长笛”这件事，所以用动名词 playing the flute 作宾语。再看语义：把“吹长笛”这件事变得酷，才通顺。',
        others: '①play：动词原形不能作 make 的宾语（除非是 make sb do sth 的使役结构，但那样后面不能接形容词 cool）；②to play：不定式作宾语多表目的或将来，且 make to do 不是英语结构；③played：过去分词表被动，“被吹的长笛”与 cool 搭配语义不对。',
        tip: 'make + 动名词 + adj.（把做某事变得……）；make sb do sth 是另一套结构，别混。'
      },
      {
        answer: 'with', accepted: ['with'], given: '', isGiven: false,
        catId: 'prep', point: '介词 with 表“拥有/带有”',
        wrongType: 'PREPOSITION_ERROR', difficulty: 2,
        sense: '如果你有个会打鼓的成员，而且他父母听力还不太好，那你就可以免费在家练习。',
        clue: 'a band member ______ a set of drums and parents who are hard of hearing：空后是两样“拥有”的东西，用 with 短语作后置定语。',
        why: '先看结构：a band member 后面接两个并列的名词短语（a set of drums、parents who...），需要一个介词把它们挂在 member 上。再看语义：“有个成员，他有套鼓，还有听力不好的父母”，with 表示“拥有、带有”，最贴切。',
        others: '①of：a member of a set of drums 会变成“一套鼓的成员”，语义荒谬；②for：for 表示目的或对象，不能表示“拥有”；③has：has 是谓语动词，前面已有 If you have a band member，再出现谓语会造成结构混乱。',
        tip: 'with + 名词 作后置定语，表示“带有、拥有”（a house with a garden）。'
      },
      {
        answer: 'which', accepted: ['which'], given: '', isGiven: false,
        catId: 'attrib', point: '“介词 + 关系代词 which”引导非限制性定语从句',
        wrongType: 'CLAUSE_ERROR', difficulty: 4,
        sense: '否则你就得找个本地录音棚，而租录音棚是要花一大笔钱的。',
        clue: 'for ______ you have to pay a handsome amount of money：介词 for 提到了关系代词前面，先行词是 a local studio（物）。',
        why: '先找先行词：a local studio（物）。再看结构：pay for sth 的介词 for 被提到了从句前面，形成“介词 + 关系代词”，指物只能用 which。逗号说明是非限制性定语从句，不能用 that。',
        others: '①that：介词后面不能用 that，且非限制性定语从句也不用 that；②where：where 相当于 in/at which，不能与 for 搭配成 for where；③what：what 不能引导定语从句。',
        tip: '介词 + which（指物）/ 介词 + whom（指人）；介词后绝不用 that。'
      },
      {
        answer: 'Divide', accepted: ['divide'], given: 'divide', isGiven: true,
        catId: 'verb', point: '祈使句（动词原形开头）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 2,
        sense: '把费用平均分摊，包括为鼓手租用设备的费用。',
        clue: '这是一个独立的句子，前面没有主语，后面是 the cost equally，属于给读者的建议。',
        why: '先看句子成分：没有主语，句子以动词开头，是祈使句，用动词原形 Divide。再看上下文：这一段都在给建议（meet half an hour in advance、you rock together），语气是指示性的，用祈使句最自然。句首首字母大写。',
        others: '①Dividing：动名词不能单独构成祈使句，句子会缺谓语；②To divide：不定式通常表目的，作祈使句不成立；③Divided：过去分词表被动，“被分摊”与建议语气不符。',
        tip: '祈使句 = 动词原形开头（Please... / Don’t...），没有主语。'
      },
      {
        answer: 'finished', accepted: ['finished'], given: 'finish', isGiven: true,
        catId: 'nonfinite', point: 'get sth done（过去分词作宾补）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '所以提前半小时到，把该聊的天都聊完。',
        clue: 'get all the chatting ______ (finish)：get + 宾语 + 宾补，chatting 与 finish 是被动关系（聊天“被聊完”）。',
        why: '先看结构：get + 宾语 + 宾语补足语，宾补可以用形容词、过去分词或不定式。再看关系：all the chatting 是“被完成”的对象，所以用过去分词 finished，构成 get sth done（把某事做完）。',
        others: '①finishing：现在分词表主动，聊天不会“去完成”别的东西；②to finish：get sth to do 表示“让某物去做”，语义不通；③finish：原形不能作宾补。',
        tip: 'get sth done = have sth done（把某事做完/让别人做完），宾语与补足语是被动关系。'
      },
      {
        answer: 'to learn', accepted: ['to learn'], given: 'learn', isGiven: true,
        catId: 'nonfinite', point: '不定式作后置定语（for sb to do）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '每位成员都应该为整个乐队挑一首歌来学。',
        clue: 'a song for the whole band ______ (learn)：for the whole band 是不定式的逻辑主语，说明“让整个乐队去学”。',
        why: '先看结构：choose a song for the whole band ______，song 后面需要定语。再看语义：“一首供整个乐队去学的歌”，用不定式 to learn，其逻辑主语由 for the whole band 引出（for sb to do）。',
        others: '①learning：现在分词作定语表主动进行，a song learning 不成立；②learned：过去分词表被动，“被学的歌”虽然能讲通，但 for the whole band 的逻辑主语关系就断了；③learn：原形不能直接作定语。',
        tip: 'for sb to do sth 作定语/状语：a song for us to learn（一首供我们学的歌）。'
      },
      {
        answer: 'what', accepted: ['what'], given: '', isGiven: false,
        catId: 'nominal', point: '宾语从句 · what 作主语',
        wrongType: 'CLAUSE_ERROR', difficulty: 3,
        sense: '这能让你弄清楚什么样的音乐适合你们乐队。',
        clue: 'find out ______ music works for your group：find out 后接宾语从句，从句 music works for your group 缺主语。',
        why: '先看结构：find out 是及物动词，后面接宾语从句；从句 ______ music works for your group 中 music 是主语、works 是谓语，缺的是修饰 music 的“什么”，即 what music（什么样的音乐）。再看 which 与 what：which 要有明确的选择范围（which of these two），本句没有。',
        others: '①that：that 引导宾语从句时从句必须完整，这里 music 前缺修饰语；②which：需要有给定的选择范围；③how：how music works 会变成“音乐如何运作”，与“适合你们乐队”的语义不符。',
        tip: 'what + 名词 = “什么样的……”（what music / what kind of music）；which 要有范围。'
      },
      {
        answer: 'someone', accepted: ['someone', 'somebody'], given: '', isGiven: false,
        catId: 'pronoun', point: '不定代词 someone 作宾语',
        wrongType: 'PRONOUN_ERROR', difficulty: 2,
        sense: '很少能遇到一个不介意分享自己头几篇作品的人，所以对人客气点！',
        clue: 'find ______ that isn’t shy about sharing their first few pieces of writing：that 从句修饰前面的名词，指“某个人”，且是否定语境里的“很难找到”。',
        why: '先看结构：find 后面接宾语，宾语后面跟 that 定语从句（that isn’t shy about...），说明宾语必须是“人”。再看语义：“很难找到不害羞地分享作品的人”，泛指某个人，用 someone / somebody。',
        others: '①anyone：在 rare to find 这种语境里 anyone 也可表示“任何人”，但本句强调“能找到某个人”这件事很少，some- 更贴切；②something：something 指物，与 that isn’t shy（人才能害羞）矛盾；③everyone：everyone 与 very rare to find 语义冲突。',
        tip: '肯定句里“某个人”用 someone/somebody；否定和疑问句里多用 anyone/anybody。'
      }
    ]
  });

  P.push({
    id: 'paper06',
    no: '06',
    title: 'My Unforgettable Semester in Florence',
    source: '25-26 学年 · 浦东新区多校联考高一期中',
    level: '高一',
    genre: '记叙文',
    words: 285,
    topic: '在佛罗伦萨交换的一个学期',
    readGuide: '回忆性记叙文，通篇过去时。第一段交代“去之前就知道会很特别”，中间写课程与城市，最后一段回到现在（will carry）。注意 which 引导的非限制性定语从句和动名词作主语。',
    passage: 'Before I arrived in Florence, I knew that my time at the university ______ (be) special. The way of learning, which was very different from ______ I knew back home, gave students more freedom, and I soon learned that I would take oral exams for my literature classes ______ a written test. ______ these talks were challenging, they helped me improve my Italian more than I had expected.\n\nThe whole city became our classroom. Some of our classes ______ (hold) inside the famous Uffizi Gallery. ______ (walk) past the long lines of tourists every day felt like having a special key to the city. The beauty of the art ______ surrounded us in those old buildings was felt by every student in our program. It was one of ______ (valuable) experiences of my entire time abroad.\n\nAfter class, my friends and I loved to explore. We would find little cafes in narrow streets and taste amazing Italian food. In the evenings, we often ______ (climb) up to Piazzale Michelangelo. From there, we ______ see all the red roofs, the river flowing through the city, and the great dome of the cathedral. We spent many hours there talking and watching the breathtaking sunset.\n\nMy time in Florence, which taught me so much more than just books, was an adventure that I will carry in my heart forever.',
    blanks: [
      {
        answer: 'would be', accepted: ['would be'], given: 'be', isGiven: true,
        catId: 'verb', point: '过去将来时（过去的将来）',
        wrongType: 'TENSE_CONFUSION', difficulty: 3,
        sense: '在我到达佛罗伦萨之前，我就知道我在这所大学的时光会很特别。',
        clue: '主句谓语 arrived 是一般过去时，宾语从句 I knew 也是过去；而“很特别”是相对于 knew 而言的将来。',
        why: '第一步定时间基准：整件事发生在过去（Before I arrived）。第二步看从句：my time at the university ______ special 是 knew 的宾语从句，表示“从过去看将来”，要用过去将来时 would be。第三步看搭配：be special 的 be 不能丢，所以是 would be 两个词。',
        others: '①was：一般过去时只说明“当时很特别”，体现不出“事先预知将来”的时间层次；②will be：现在时的将来，与全句过去的时间基准矛盾；③had been：过去完成时表示“到达之前就已经特别”，与 knew 的预知语义不符。',
        tip: '过去时刻“看将来” → would do；主句过去时，宾语从句的将来要用过去将来时。'
      },
      {
        answer: 'what', accepted: ['what'], given: '', isGiven: false,
        catId: 'nominal', point: '宾语从句 · what 作 knew 的宾语',
        wrongType: 'CLAUSE_ERROR', difficulty: 2,
        sense: '这里的学法和我在国内所熟悉的大不相同，给了学生更多自由。',
        clue: 'different from ______ I knew back home：介词 from 后面是宾语从句，从句 I knew 缺宾语。',
        why: '先看结构：from 是介词，后面接宾语从句；从句 I knew back home 中 I 是主语、knew 是谓语，缺宾语，所以用既能引导从句又能作宾语的 what（= the thing that）。再看语义：“我在国内所知道的那种学法”，指事物。',
        others: '①that：that 引导的从句必须完整，I knew 后面缺宾语；②which：which 要有选择范围；③it：it 不能引导从句，句子会缺连接。',
        tip: '介词/动词后 + 从句缺宾语 → what；从句完整 → that。'
      },
      {
        answer: 'instead of', accepted: ['instead of'], given: '', isGiven: false,
        catId: 'prep', point: '介词短语 instead of（而不是）',
        wrongType: 'PREPOSITION_ERROR', difficulty: 3,
        sense: '我很快得知，我的文学课要参加口试，而不是笔试。',
        clue: 'oral exams for my literature classes ______ a written test：空前后是两个对立的事物（口试 / 笔试）。',
        why: '先看逻辑：口试与笔试是替代关系（“是口试而不是笔试”）。再看结构：空后是名词短语 a written test，需要介词短语；instead of 由两个词组成，正好填满这个空，表示“而不是”。',
        others: '①instead：instead 是副词，后面不能直接接名词（要写成 instead of a written test 或用逗号隔开）；②rather：rather than 也可以，但空只有一个，只能写 instead of；③because of：因果关系，与“而是”的替代语义不符。',
        tip: 'instead of + 名词/doing（而不是）；instead 单独用时是副词，前后要有逗号。'
      },
      {
        answer: 'Although', accepted: ['although', 'though', 'while'], given: '', isGiven: false,
        catId: 'adverbial', point: '让步状语从句连词',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 3,
        sense: '虽然这些谈话很有挑战性，但它们帮助我把意大利语提高得比预想的更多。',
        clue: '前半句 these talks were challenging（有挑战）与后半句 helped me improve（有帮助）形成让步；主句前没有 but。',
        why: '先判断逻辑：谈话难，但仍有帮助，是“虽然……但是……”。再看结构：空后是完整的主谓 these talks were challenging，需要引导让步状语从句的连词，although / though 都可以；while 在书面语里也可表“虽然”，一并接受。句首首字母大写。',
        others: '①But：but 是并列连词，前面缺少可并列的分句（句首就是空）；②Because：因果讲反了，有挑战不是“有帮助”的原因；③However：however 是副词，不能引导从句。',
        tip: '句首一个空 + 两个相反的意思 → Although / Though + 从句，主句不再加 but。'
      },
      {
        answer: 'were held', accepted: ['were held'], given: 'hold', isGiven: true,
        catId: 'verb', point: '一般过去时的被动语态（主谓一致）',
        wrongType: 'VOICE_ERROR', difficulty: 3,
        sense: '我们的一些课就在著名的乌菲齐美术馆里上。',
        clue: '主语 Some of our classes 与 hold 是被动关系（课程“被举办”）；全文叙述过去的事。',
        why: '第一步看语态：课程是被安排、被举办的，所以用被动 be + done。第二步看时态：这一段回忆过去（became、gave），用一般过去时。第三步看主谓一致：Some of our classes 是复数，be 用 were，所以是 were held。',
        others: '①held：主动形式，“课程举办”会缺宾语，语态错；②was held：主语 Some of our classes 是复数；③have been held：现在完成时与这一段的过去叙事不符。',
        tip: 'Some of + 复数名词 → 谓语复数；物作主语 + 动作是“被施加” → 被动。'
      },
      {
        answer: 'Walking', accepted: ['walking'], given: 'walk', isGiven: true,
        catId: 'nonfinite', point: '动名词作主语',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '每天走过排着长队的游客，感觉就像拥有了一把打开这座城市的特殊钥匙。',
        clue: '______ (walk) past the long lines of tourists every day felt like...：句子的谓语是 felt，空处需要一个能作主语的名词性成分。',
        why: '先数谓语：主句谓语是 felt like，空处不能是谓语。再看结构：句首缺主语，用动名词 Walking 作主语，表示“每天走过游客长队这件事”。第三步看主谓一致：动名词短语作主语，谓语用单数 felt，正好吻合。',
        others: '①Walk：祈使句会让后面变成两个谓语；②To walk：不定式作主语通常表示具体的一次或将来的动作，此处是日常反复的事；③Walked：过去分词不能作主语。',
        tip: '句首缺主语、讲“一件事” → 动名词 doing（谓语用单数）。'
      },
      {
        answer: 'that', accepted: ['that', 'which'], given: '', isGiven: false,
        catId: 'attrib', point: '定语从句 · 关系代词作主语（指物）',
        wrongType: 'CLAUSE_ERROR', difficulty: 3,
        sense: '那些古老建筑里环绕着我们的艺术之美，我们项目里的每位学生都感受到了。',
        clue: '先行词是 The beauty of the art（物），从句 ______ surrounded us in those old buildings 缺主语。',
        why: '先找先行词：The beauty of the art，指物。再看从句：______ surrounded us 缺主语，用关系代词 that 或 which（指物、作主语）。注意这里没有逗号，是限制性定语从句，that 也可以用。',
        others: '①what：what 不能引导定语从句（前面已有先行词）；②who：先行词是物不是人；③where：本句缺主语，而 where 只能作地点状语。',
        tip: '先行词是物 + 从句缺主语 → that / which 都行；有逗号时只能用 which。'
      },
      {
        answer: 'the most valuable', accepted: ['the most valuable'], given: 'valuable', isGiven: true,
        catId: 'transform', point: '形容词最高级（one of the most + adj. + 复数）',
        wrongType: 'WORD_FORM_ERROR', difficulty: 3,
        sense: '那是我在国外期间最有价值的经历之一。',
        clue: 'one of ______ (valuable) experiences of my entire time abroad：这是 one of the + 最高级 + 名词复数 的固定结构，of my entire time abroad 给出了比较范围。',
        why: '第一步看结构：one of + 形容词最高级 + 名词复数，表示“最……的之一”。第二步看范围：of my entire time abroad 明确了比较范围，必须用最高级。第三步看形式：valuable 是多音节形容词，最高级是 the most valuable，不能丢 the。',
        others: '①valuable：原级不能用于 one of the ... 结构；②more valuable：比较级用于两者比较，而这里范围是“整个留学期间”，是三者以上；③most valuable：最高级前要有 the，且 experiences 前需要限定。',
        tip: 'one of the + 最高级 + 名词复数（……之一）；多音节形容词最高级 = the most + adj.。'
      },
      {
        answer: 'climbed', accepted: ['climbed'], given: 'climb', isGiven: true,
        catId: 'verb', point: '一般过去时（描述过去反复发生的动作）',
        wrongType: 'TENSE_CONFUSION', difficulty: 2,
        sense: '晚上我们常常爬到米开朗基罗广场上去。',
        clue: '时间状语 In the evenings + often，且整段是回忆（We would find、We spent），叙述过去的习惯。',
        why: '第一步定时间：全段在回忆过去（would find、spent many hours）。第二步看状语：In the evenings、often 说的是过去反复做的事，英语里用一般过去时即可（也可用 would climb，但括号给的是 climb，需要自己变过去式）。第三步变形式：climb 加 -ed。',
        others: '①climb：原形不能作谓语，且与过去语境不符；②have climbed：现在完成时强调与现在的联系，本段只是回忆；③were climbing：过去进行时强调“某时正在爬”，与 often 的反复语义不符。',
        tip: '过去反复的习惯：一般过去时 + often / every evening；此时不用现在时。'
      },
      {
        answer: 'could', accepted: ['could', 'would'], given: '', isGiven: false,
        catId: 'extra', point: '情态动词 could 表过去的能力',
        wrongType: 'VERB_FORM_ERROR', difficulty: 4,
        sense: '从那里，我们能看到所有红色的屋顶、穿城而过的河流，还有大教堂巨大的圆顶。',
        clue: '前后句都是一般过去时（climbed、spent），空后是动词原形 see，说明空处是情态动词。',
        why: '先看结构：______ see all the red roofs 中 see 是原形，前面只能是情态动词或助动词。再看语义与时间：作者在回忆“当时从那里能看见什么”，表示过去的能力，用 could；从上下文看，这里也可理解为“（当时）会看到”，故 would 也接受（原卷答案给 could/would）。',
        others: '①can：现在时的能力，与回忆的过去语境不符；②will：将来，时间错；③are able to：be able to 需要变成 were able to，与空前只有一个空、空后是 see 的结构不符。',
        tip: '过去的能力用 could；但表示“经过努力终于做到”要用 was/were able to。'
      }
    ]
  });
})();
