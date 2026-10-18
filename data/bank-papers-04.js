/* ============================================================
 * data/bank-papers-04.js — 上海真题语篇 07-08（整篇 10 空 · 真卷口径）
 * 07 = 2026 届崇明区高三二模；08 = 2026 届宝山区高三二模（个别空位按唯一答案调整）
 * ============================================================ */
(function () {
  'use strict';
  var P = window.__EGL_PAPERS__ = window.__EGL_PAPERS__ || [];

  P.push({
    id: 'paper07',
    no: '07',
    title: 'Dedicated to Dunhuang: A Life Inspired by Ancient Art',
    source: '2026 届 · 崇明区高三二模',
    level: '高三',
    genre: '记叙文（人物特写）',
    words: 300,
    topic: '常书鸿、常沙娜父女与敦煌艺术',
    readGuide: '人物特写，按时间线推进：1943 年父亲下决心 → 1944 年建研究所 → 女儿临摹壁画 → 赴美归来 → 今天合作推广。时态以过去时为主，最后一段转现在。',
    passage: 'Famous Chinese artist Chang Shana, the designer behind the decorative mural (壁画) on the ceiling of the banquet (宴会) hall of Beijing’s Great Hall of the People, and her father Chang Shuhong, who was also a famous artist, have dedicated their lives to preserving and promoting the art of Dunhuang.\n\nHer passion for Dunhuang ______ (inspire) by her father Chang Shuhong, often referred to as the pioneer of introducing Dunhuang art.\n\nIn 1943, her father, then a promising artist who ______ (win) several medals in France, made up his mind to contribute to Dunhuang after reading about the cave art there. It wasn’t long ______ he moved to Dunhuang, a remote county in northwest China’s Gansu Province.\n\n______ (travel) along rough roads for an entire month, in the fall of 1943, the family arrived at the dusty, yet exciting Mogao Caves in Dunhuang. In 1944, Chang Shuhong founded Dunhuang Art Institute, ______ is now known as Dunhuang Academy. He gave up the prospect of furthering his art career, and devoted himself to the protection and study of Dunhuang’s treasures. But this was so hard a task that his wife couldn’t bear the harsh conditions and left him. What’s worse, during the war, the government stopped ______ (fund) the Dunhuang Art Research Institute. Nevertheless, Chang Shana and her father stayed to continue their mission.\n\nChang Shana made copies of the murals ______ the guidance of her father, researchers at the institute and visiting artists. She learned a lot about murals and ______ the styles for the murals had evolved. That experience has greatly influenced her career.\n\nChang Shana later went to the US for further study and when she came back, she turned to industrial art, teaching at Tsinghua University. Chang has completed many key designs ______ (base) on Dunhuang murals, including the ceiling of the Great Hall of the People.\n\nFor Chang, Dunhuang has become an inseparable part of her life. She’s now cooperating with an e-commerce platform to promote the sale of her work ______ (make) sure that the thousand-year-old art lives on.',
    blanks: [
      {
        answer: 'was inspired', accepted: ['was inspired'], given: 'inspire', isGiven: true,
        catId: 'verb', point: '一般过去时的被动语态',
        wrongType: 'VOICE_ERROR', difficulty: 2,
        sense: '她对敦煌的热爱是被父亲常书鸿激发出来的，父亲常被称为介绍敦煌艺术的先驱。',
        clue: '主语 Her passion for Dunhuang 与 inspire 是被动关系（热爱“被激发”）；by her father 直接给出了动作发出者。',
        why: '第一步看语态：Her passion 自己不会“激发”，是被激发，所以用 be + done。第二步看时态：父亲激发她热爱是过去的事（后文 In 1943 展开），用一般过去时。第三步看主谓一致：主语 Her passion 是单数，be 用 was，故填 was inspired。',
        others: '①inspired：主动形式，“热爱激发了父亲”主宾颠倒；②were inspired：主语 Her passion 是单数；③has been inspired：现在完成时强调对现在的影响，与本段讲过去的来历不符。',
        tip: '看到 by + 人，先想被动；主语单复数决定 was 还是 were。'
      },
      {
        answer: 'had won', accepted: ['had won'], given: 'win', isGiven: true,
        catId: 'verb', point: '过去完成时（过去的过去）',
        wrongType: 'TENSE_CONFUSION', difficulty: 4,
        sense: '1943 年，她的父亲当时是一位很有前途的艺术家，此前已在法国赢得过几枚奖章，他读到那里石窟艺术的介绍后，下定决心为敦煌做点事。',
        clue: '主句动词是 made up his mind（1943 年），而“获奖”发生在那之前；then a promising artist who... 是对他当时身份的补充说明。',
        why: '第一步定参照点：In 1943 ... made up his mind 是过去的时间点。第二步看动作先后：获奖在“下决心”之前，属于“过去的过去”，用过去完成时 had won。第三步看形式：win 的过去分词是 won。',
        others: '①won：一般过去时与 made 处于同一时间层，体现不出“在那之前”；②has won：现在完成时以现在为参照，与 1943 年不符；③would win：过去将来时指向之后，时间方向反了。',
        tip: '两个过去动作比先后：先发生的用 had done，后发生的用一般过去时。'
      },
      {
        answer: 'before', accepted: ['before'], given: '', isGiven: false,
        catId: 'adverbial', point: 'It was not long before...（固定句式）',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 3,
        sense: '没过多久，他就搬到了敦煌——中国西北甘肃省一个偏远的县。',
        clue: 'It wasn’t long ______ he moved to Dunhuang：It was not long before... 是固定句式“没过多久就……”。',
        why: '先看句式：It is/was not long before + 从句，表示“没过多久就……”。再看时态呼应：主句 was 是过去时，从句 moved 也是过去时，before 表示“在……之前”，正好表达“下决心”之后不久就搬家。',
        others: '①since：It wasn’t long since 后面要接过去完成时或表示“自从”，与本句结构不符；②until：not... until 表示“直到……才”，需要主句用否定动作，而这里主句是时间长短；③when：It wasn’t long when 不是英语句式。',
        tip: 'It will not be long before... / It was not long before...（没过多久就……）。'
      },
      {
        answer: 'Having travelled', accepted: ['having travelled', 'having traveled'], given: 'travel', isGiven: true,
        catId: 'nonfinite', point: '现在分词完成式作状语（动作先于谓语）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 5,
        sense: '沿着崎岖的道路走了一整个月，1943 年秋天，一家人终于抵达了尘土飞扬却令人兴奋的敦煌莫高窟。',
        clue: '主句谓语是 arrived，空处在句首作状语；travel 发生在 arrived 之前（走了一个月才到），且 the family 与 travel 是主动关系。',
        why: '第一步数谓语：主句已有谓语 arrived，句首空处只能是非谓语状语。第二步看关系：一家人“走”路，主动，用现在分词。第三步看先后：走了一个月发生在“到达”之前，所以用完成式 having travelled，强调先发生。',
        others: '①Travelling：现在分词一般式与主句动作同时，体现不出“走完才到”；②Travelled：过去分词表被动，一家人不是“被走”；③To travel：不定式多表目的或将来，与已经完成的行程不符。',
        tip: '非谓语先判断“主动还是被动”，再判断“先后”：先发生用 having done，被动且先发生用 having been done。'
      },
      {
        answer: 'which', accepted: ['which'], given: '', isGiven: false,
        catId: 'attrib', point: '非限制性定语从句 · which 指代前文机构',
        wrongType: 'CLAUSE_ERROR', difficulty: 2,
        sense: '1944 年，常书鸿创建了敦煌艺术研究所，也就是现在的敦煌研究院。',
        clue: '逗号后 ______ is now known as Dunhuang Academy，先行词是 Dunhuang Art Institute（物、机构），从句缺主语。',
        why: '先找先行词：Dunhuang Art Institute，指物（机构）。再看从句：______ is now known as... 缺主语，用关系代词 which。逗号说明是非限制性定语从句，此时不能用 that。',
        others: '①that：非限制性定语从句（逗号后）不能用 that；②who：who 指人，先行词是机构；③what：what 不能引导定语从句。',
        tip: '逗号 + 指物 + 从句缺主语 → which（绝不用 that）。'
      },
      {
        answer: 'funding', accepted: ['funding'], given: 'fund', isGiven: true,
        catId: 'nonfinite', point: 'stop doing sth（停止做某事）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '更糟的是，战争期间政府停止了对敦煌艺术研究所的资助。',
        clue: 'the government stopped ______ (fund) the Dunhuang Art Research Institute：“停止资助”这件事被中断了。',
        why: '先看搭配：stop doing sth 表示“停止正在做的事”；stop to do sth 表示“停下来去做另一件事”。本句是政府不再资助研究所，资助这件事被停止，用 funding。再看结构：stopped 后需要宾语，动名词正好作宾语。',
        others: '①to fund：stop to fund 会变成“停下来去资助”，语义反了；②fund：原形不能作 stop 的宾语；③funded：过去分词不能作 stop 的宾语（除非是 be funded 被动结构）。',
        tip: 'stop doing（停止做）/ stop to do（停下来去做）/ stop sb from doing（阻止某人做）。'
      },
      {
        answer: 'under', accepted: ['under'], given: '', isGiven: false,
        catId: 'prep', point: '固定搭配 under the guidance of',
        wrongType: 'PREPOSITION_ERROR', difficulty: 3,
        sense: '在父亲、研究所的研究人员和来访艺术家的指导下，常沙娜临摹了许多壁画。',
        clue: 'made copies of the murals ______ the guidance of her father...：guidance 前需要介词，构成“在……指导下”。',
        why: '先看搭配：under the guidance of sb 是固定短语，表示“在某人指导下”，under 表示“在……之下/状态中”。再看结构：空后是 the guidance of her father, researchers... and visiting artists，一串指导者，正好接在 under 后。',
        others: '①with：with the guidance of 不是标准搭配；②by：by the guidance of 也不成立（by 后一般接动作发出者）；③in：in the guidance of 语义变成“在指导之中”，不表示“在某人指导下”。',
        tip: 'under the guidance / leadership / control / pressure of...（在……之下）用 under。'
      },
      {
        answer: 'how', accepted: ['how'], given: '', isGiven: false,
        catId: 'nominal', point: '宾语从句 · how 作方式状语',
        wrongType: 'CLAUSE_ERROR', difficulty: 3,
        sense: '她学到了很多关于壁画的知识，也了解了壁画的风格是如何演变的。',
        clue: 'learned a lot about murals and ______ the styles for the murals had evolved：and 并列两个 learned 的宾语，后一个宾语从句缺“如何”这个方式状语。',
        why: '先看结构：learned 后面接宾语，and 连接两个宾语；从句 the styles for the murals had evolved 主谓齐全，缺的是“怎么演变”的方式状语，用 how。再看语义：了解“风格是如何演变的”，正是 how 的典型用法。',
        others: '①that：that 引导的从句必须完整，但这里需要一个“方式”含义，语义不足；②what：what 要在从句里作主语或宾语，本从句主谓齐全；③which：需有选择范围，语义不符。',
        tip: '从句不缺主宾、只缺“方式/程度” → how；缺“事物” → what。'
      },
      {
        answer: 'based', accepted: ['based'], given: 'base', isGiven: true,
        catId: 'nonfinite', point: '过去分词短语作后置定语（be based on）',
        wrongType: 'VOICE_ERROR', difficulty: 3,
        sense: '常沙娜完成了许多以敦煌壁画为基础的重要设计，其中包括人民大会堂的天花板。',
        clue: 'many key designs ______ (base) on Dunhuang murals, including...：designs 与 base 是被动关系（设计“以……为基础”）。',
        why: '第一步数谓语：主句谓语是 has completed，空处只能是非谓语。第二步看关系：designs 是“以壁画为基础”的被动对象，用过去分词 based，构成 be based on 的定语形式。第三步看位置：based on... 放在名词后作后置定语，相当于 which are based on。',
        others: '①basing：现在分词表主动，“设计去以……为基础”主宾颠倒；②to base：不定式作定语表将来或目的，这里是既成事实；③base：原形不能作定语。',
        tip: 'be based on（以……为基础）；名词 + based on... = 过去分词作后置定语。'
      },
      {
        answer: 'to make', accepted: ['to make'], given: 'make', isGiven: true,
        catId: 'nonfinite', point: '不定式作目的状语',
        wrongType: 'VERB_FORM_ERROR', difficulty: 2,
        sense: '她现在正与一个电商平台合作，推广自己作品的销售，以确保这门千年艺术延续下去。',
        clue: 'to promote the sale of her work ______ (make) sure that...：推广销售是为了“确保这门艺术传承下去”，表目的。',
        why: '先看结构：主句谓语是 is cooperating，空处只能是非谓语。再看逻辑：合作推广作品的目的，是“确保千年艺术延续”，目的用不定式 to make。第三步看搭配：make sure that 是固定搭配，此处 make 用原形。',
        others: '①making：现在分词表伴随或结果，目的性不如不定式明确；②made：过去分词表被动，与主动的“确保”不符；③make：原形不能直接作目的状语。',
        tip: '表目的优先用 to do；make sure that...（确保……）是固定搭配。'
      }
    ]
  });

  P.push({
    id: 'paper08',
    no: '08',
    title: 'Notre-Dame de Paris',
    source: '2026 届 · 宝山区高三二模',
    level: '高三',
    genre: '说明文',
    words: 336,
    topic: '巴黎圣母院：历史、火灾与修复',
    readGuide: '说明文，按“火灾—建造—建筑特色—大革命—小说与修复—2019 大火—修复完成”推进。过去时与现在完成时交替，注意 had stood、has been closed 的时间层次。',
    passage: 'After a disastrous fire, this ancient site is now fully restored.\n\nOn April 15, 2019, the people of Paris, France, were shocked to see the Notre-Dame de Paris Cathedral in flames. The cathedral ______ (stand) for hundreds of years, but the fire nearly destroyed it. Hundreds of firefighters fought to save the building, but the fire still did extensive damage. Since then, the building has been closed for repairs, but this Sunday, it ______ (schedule) to be open to the public once more.\n\nNotre-Dame took nearly two centuries to build, from 1163 to 1345, and even after its completion, new features continued ______ (add). Repairs to the representative cathedral were done with careful accuracy, using methods from ______ original construction in the Middle Ages.\n\nNotre-Dame is an amazing example of Gothic architecture. The builders of Gothic cathedrals thought of their buildings as places where people go to meet with God, so they tried to make the buildings look like heaven. This means the cathedrals all have tall ceilings ______ (support) by columns, with large windows that are made of colored glass. As a result, the buildings are filled with colored light, which is intended to call to mind descriptions of heaven that say it has streets full of gold. Images of cathedrals like Notre-Dame can convey part of their beauty and splendor, ______ they don’t compare with the experience of seeing them in person.\n\nIn the late 18th century, popular resentment (怨恨) against the French upper class exploded into a revolution. The revolutionaries associated the Christian establishment with the king they despised (鄙视), so they ransacked (洗劫) Notre-Dame along with many other churches. Shortly after the revolution, some repairs were made, but the cathedral was still ______ bad shape. The cathedral’s disrepair partly inspired Victor Hugo’s famous novel The Hunchback of Notre-Dame.\n\nThis novel, much of which takes place inside the cathedral, was so popular ______ it inspired a major repair of the cathedral. The architect who planned the repairs took some creative license, adding features rather than ______ (restore) the cathedral to its original appearance. But the result was a beautiful building, which for a time was the most popular tourist attraction in France.\n\nIn 2018 more repair work began, intended to change some deterioration (恶化) that had taken place over time. It was during the repairing project that the fire started. The April 2019 fire destroyed the entire roof and much of the structure’s original frame. But a few important pieces were amazingly spared. The fire forced the government to perform more extensive repairs ______ had been planned, but the work is now complete. Now people can once again visit this architectural wonder and marvel at its beauty, its history and (for some) its spiritual significance.',
    blanks: [
      {
        answer: 'had stood', accepted: ['had stood'], given: 'stand', isGiven: true,
        catId: 'verb', point: '过去完成时（火灾之前的状态）',
        wrongType: 'TENSE_CONFUSION', difficulty: 4,
        sense: '这座大教堂已经矗立了数百年，但这场大火几乎把它毁掉了。',
        clue: '时间点是 2019 年 4 月 15 日的火灾；had stood for hundreds of years 表示“在失火之前已经矗立了数百年”。',
        why: '第一步定参照点：On April 15, 2019 ... the fire nearly destroyed it，火灾是过去的时间点。第二步看时间关系：“矗立数百年”发生在火灾之前，是“过去的过去”，用过去完成时。第三步看形式：stand 的过去分词是 stood，故 had stood。',
        others: '①stood：一般过去时与 destroyed 同层，无法体现“在那之前已经数百年”；②has stood：现在完成时以现在为参照，与 2019 年的火灾叙事不符；③was standing：过去进行时强调“当时正在”，与 for hundreds of years 的持续总量不搭。',
        tip: '过去的某个时间点之前已经完成的动作/状态 → had done。'
      },
      {
        answer: 'is scheduled', accepted: ['is scheduled'], given: 'schedule', isGiven: true,
        catId: 'verb', point: '一般现在时的被动语态（be scheduled to）',
        wrongType: 'VOICE_ERROR', difficulty: 3,
        sense: '此后这座建筑一直关闭维修，但这个星期天，它被安排再次向公众开放。',
        clue: 'this Sunday 指向即将到来的安排；it ______ (schedule) to be open 中 it 与 schedule 是被动关系（“被安排”）。',
        why: '第一步看语态：it（大教堂）是被安排的对象，用被动 be + done。第二步看时态：this Sunday 是将来的安排，但英语里按日程、时刻表安排的将来常用一般现在时（is scheduled to），与前半句 has been closed 的现在完成时衔接自然。第三步看形式：schedule 的过去分词是 scheduled。',
        others: '①schedules：主动形式，教堂不会自己安排；②was scheduled：过去时与 this Sunday 的将来安排矛盾；③has been scheduled：可以表示“已经安排好”，但与 this Sunday 的时间指向不如 is scheduled 直接。',
        tip: 'be scheduled to do（被安排做）；按日程表安排的将来用一般现在时。'
      },
      {
        answer: 'to be added', accepted: ['to be added'], given: 'add', isGiven: true,
        catId: 'nonfinite', point: '不定式的被动式（continue to be done）',
        wrongType: 'VOICE_ERROR', difficulty: 5,
        sense: '巴黎圣母院花了近两个世纪才建成（1163—1345），即使完工之后，新的建筑特征仍在不断被添加。',
        clue: 'new features continued ______ (add)：主语 new features 与 add 是被动关系（特征“被添加”），continue 后接不定式。',
        why: '第一步数谓语：主句谓语是 continued，空处只能是非谓语。第二步看搭配：continue 后接 to do 或 doing，这里用不定式 to add。第三步看语态：new features 是被添加的对象，不定式要用被动式 to be added。',
        others: '①to add：主动形式，“特征去添加别的东西”主宾颠倒；②adding：continue doing 也可以，但 adding 是主动，语态错；③added：过去分词不能作 continue 的宾语。',
        tip: '不定式的被动式 to be done：既表“将来/目的”，又表“被……”。'
      },
      {
        answer: 'its', accepted: ['its', 'the'], given: '', isGiven: false,
        catId: 'pronoun', point: '形容词性物主代词（指代 the cathedral）',
        wrongType: 'PRONOUN_ERROR', difficulty: 2,
        sense: '对这座代表性大教堂的修复做得非常精确，用的是中世纪最初建造时的方法。',
        clue: 'using methods from ______ original construction in the Middle Ages：空处修饰 original construction，construction 属于“这座大教堂”。',
        why: '先看结构：空处作定语修饰名词 original construction，需要形容词性物主代词或冠词。再看指代：前文一直在讲 the representative cathedral，单数事物，它的建造用 its（= the cathedral’s）。',
        others: '①it：it 是主格/宾格，不能作定语修饰名词；②their：前文是单数的大教堂；③itself：反身代词不能直接修饰名词。',
        tip: '名词前的“它的/他们的”用形容词性物主代词 its/their，不能用 it。'
      },
      {
        answer: 'supported', accepted: ['supported'], given: 'support', isGiven: true,
        catId: 'nonfinite', point: '过去分词短语作后置定语',
        wrongType: 'VOICE_ERROR', difficulty: 3,
        sense: '这意味着所有大教堂都有由柱子支撑的高高天花板，以及用彩色玻璃做成的大窗户。',
        clue: 'tall ceilings ______ (support) by columns：ceilings 与 support 是被动关系（天花板“被柱子支撑”），by columns 给出动作发出者。',
        why: '第一步数谓语：主句谓语是 have，空处只能是非谓语。第二步看关系：ceilings 是被支撑的对象，用过去分词 supported 作后置定语（= which are supported by columns）。第三步看标志：by columns 是被动的典型提示。',
        others: '①supporting：现在分词表主动，“天花板去支撑柱子”主宾颠倒；②to support：不定式作定语表将来或目的，这里是客观描述；③supports：再放一个谓语，与 have 冲突。',
        tip: '名词后 + done + by... = 过去分词作定语（被……的）。'
      },
      {
        answer: 'but', accepted: ['but'], given: '', isGiven: false,
        catId: 'coord', point: '并列连词 but（转折）',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 2,
        sense: '像巴黎圣母院这样的图片能传达它们一部分的美与壮丽，但比不上亲眼所见的体验。',
        clue: '前半句 can convey part of their beauty（能传达一部分）与后半句 don’t compare with（比不上）是转折关系。',
        why: '先判断逻辑：图片“能传达一部分美”，但“比不上亲眼所见”，前后是转折。再看结构：两个分句都用逗号隔开、各有谓语（can convey / don’t compare），是并列关系，用并列连词 but。',
        others: '①and：and 表并列递进，与前后相反的意思冲突；②so：so 表结果，“图片能传达美，所以比不上亲眼所见”逻辑不通；③although：although 引导从句，但后面 don’t compare 是完整分句，且句首已有主句，结构不合。',
        tip: '两个完整分句 + 意思相反 → but；从句 + 主句的让步用 although/though。'
      },
      {
        answer: 'in', accepted: ['in'], given: '', isGiven: false,
        catId: 'prep', point: '固定搭配 in bad shape',
        wrongType: 'PREPOSITION_ERROR', difficulty: 3,
        sense: '大革命后做过一些修缮，但大教堂的状况依然很差。',
        clue: 'the cathedral was still ______ bad shape：“状况差”是固定短语 in bad shape，与后面的 disrepair（失修）呼应。',
        why: '先看搭配：in bad shape 表示“状况不佳、破损严重”，in 表示处于某种状态。再看语境：下一句 The cathedral’s disrepair partly inspired... 正是“失修”的进一步说明，语义完全吻合。',
        others: '①on：on bad shape 不是搭配；②at：at bad shape 也不成立；③with：with bad shape 表示“带着坏形状”，语义不通。',
        tip: 'in good/bad shape（状况好/差）；in + 抽象名词常表状态（in danger / in trouble）。'
      },
      {
        answer: 'that', accepted: ['that'], given: '', isGiven: false,
        catId: 'adverbial', point: 'so...that 结果状语从句',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 2,
        sense: '这部小说非常受欢迎，以至于促成了一次大规模的修缮。',
        clue: '前半句是 was so popular，so + 形容词后面要接 that 引导的结果状语从句。',
        why: '先看结构：so popular ______ it inspired a major repair 是 so...that 结构，表示“如此……以至于……”。再看语义：小说太受欢迎，结果是推动了修缮，正是结果关系。',
        others: '①as：so...as 用于比较（as...as），与 so popular 不搭；②because：因果讲反，受欢迎不是“因为”修缮；③which：which 不能接在 so popular 后面引导从句。',
        tip: 'so + adj./adv. + that...（如此……以至于）；such + 名词 + that...。'
      },
      {
        answer: 'restoring', accepted: ['restoring'], given: 'restore', isGiven: true,
        catId: 'nonfinite', point: 'rather than 后接动名词（与前面 doing 对应）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 4,
        sense: '负责修缮的建筑师发挥了一些创作自由，添加新特征，而不是把大教堂恢复成它最初的样子。',
        clue: 'adding features rather than ______ (restore) the cathedral：rather than 前后要对称，前面是 adding features（动名词），后面也用动名词。',
        why: '先看结构：rather than 是并列连词性质，连接两个对等的成分。前面是 adding features，所以后面也用 restoring，保持形式一致。再看语义：“添加新特征，而不是恢复原貌”。',
        others: '①to restore：rather than to do 虽然偶尔出现，但与前面的 adding 不对称；②restore：原形与 adding 不平衡；③restored：过去分词表被动，与主动的“恢复”不符。',
        tip: 'rather than 前后形式要一致：doing rather than doing / to do rather than to do。'
      },
      {
        answer: 'than', accepted: ['than'], given: '', isGiven: false,
        catId: 'prep', point: '比较结构 more...than',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 3,
        sense: '这场大火迫使政府进行了比原计划更广泛的修复，不过现在工程已经完工。',
        clue: 'more extensive repairs ______ had been planned：前面有比较级 more extensive，后面需要一个引出比较对象的词，从句用过去完成时 had been planned。',
        why: '先看结构：more extensive 是比较级，后面必须用 than 引出比较对象。再看从句：______ had been planned 是省略形式（than what had been planned / than those that had been planned），表示“比原计划的（修复）更多”。',
        others: '①that：that 不能引出比较对象；②as：as 用于同级比较（as...as），与 more 不搭；③which：which 引导定语从句，不能承担比较功能。',
        tip: '比较级 + than + 比较对象；than 后面常接省略的从句（than planned / than expected）。'
      }
    ]
  });
})();
