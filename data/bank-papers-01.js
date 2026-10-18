/* ============================================================
 * data/bank-papers-01.js — 上海真题语篇 01-02（整篇 10 空 · 真卷口径）
 * 注册到 window.__EGL_PAPERS__（与 tenseNN 单句题库分开存放，互不影响）
 * 字段：id/no/title/source/level/genre/words/topic/passage/blanks[]
 * 每个 blank：answer/accepted/given/isGiven/catId/point/sense/clue/why/others/tip
 * 解析写法照上海区教研室答案详解：句意 → 考查点 → 线索 → 判断 → 其它形式为何不行 → 记忆
 * ============================================================ */
(function () {
  'use strict';
  var P = window.__EGL_PAPERS__ = window.__EGL_PAPERS__ || [];

  P.push({
    id: 'paper01',
    no: '01',
    title: 'A Quilt with a History',
    source: '2024 · 上海春考',
    level: '高三',
    genre: '记叙文',
    words: 292,
    topic: '家庭记忆与代际传承',
    readGuide: '先通读一遍：作者先从姑妈的旧被子写起，再写自己讲给孙女听，最后落回“教与学让祖孙更近”。时态主线是过去，最后一段转现在。',
    passage: 'While visiting my husband’s relatives years ago, I admired his Aunt Doris’ collection of handstitched (手工缝纫的) quilts. ______ stood out from the rest was a particularly beautiful one. Auntie explained that every piece of this quilt ______ (cut) from her favorite clothes and represented an important moment in her life. “This is from a blouse I wore to the very first picture show I ever saw,” she said. Her stories went on. When it was time ______ (leave), she presented me with her valued quilt.\n\nI began retelling this story to my 12-year-old granddaughter, ______ I had some worries. Maybe children ______ (raise) in the 21st century wouldn’t be interested in an old lady’s talking about an old quilt, but I wanted to pass along this piece of family history. To my surprise, my granddaughter loved it after I explained why old clothes were used to make quilts. This opened the door to ______ (describe) how mothers passed along their knowledge of cooking, gardening and sewing to ensure that their daughters were well-armed to face life’s demands. In turn, my granddaughter explained how modern mothers pass on knowledge of computers, college and financial planning to ensure their daughters’ success.\n\nSurprised by how much my granddaughter had to teach me, I thought of the days ______ multiple generations of families lived under one roof. Sharing knowledge and history ______ have been a daily occurrence at that time.\n\nMultigenerational homes may be rarer now, but we can use new ways to promote the love that grandparents and grandchildren have always shared. As long as we continue to teach and learn from each other, we can build closeness ______ we may be generations and thousands of miles apart. It can be anything—computers, cooking, gardening, maybe even a young lady’s story told in a quilt—that brings you far ______ (close) to those you love.',
    blanks: [
      {
        answer: 'What', accepted: ['what'], given: '', isGiven: false,
        catId: 'nominal', point: '主语从句 · 连接代词 what 作主语',
        wrongType: 'CLAUSE_ERROR', difficulty: 2,
        sense: '在那批手工缝制的被子里，最惹眼的是一床特别漂亮的。',
        clue: '空在句首、后面没有名词可修饰，且 ___ stood out from the rest 缺主语；再往下看 was a particularly beautiful one，说明整个“什么东西”作主语。',
        why: '先看结构：句子已有谓语 was，那么它前面的部分必须是一个主语从句，而主语从句本身缺主语（stood out 前什么都没有），所以只能用既能引导从句、又能在从句里当主语的 what。再看语义：指“那些被子里最出众的那一床（东西）”，不是“哪一个人才”，所以不用 who。',
        others: '①That：that 引导主语从句时从句必须完整，stood out from the rest 缺主语，不成立；②Which：which 需要上文已经给出选择范围（of the three 之类）才用；③It：it 没有连接作用，两句会各自独立，语法不通。',
        tip: '句首一空 + 后面从句缺主语 → What；从句完整才轮到 That。'
      },
      {
        answer: 'was cut', accepted: ['was cut'], given: 'cut', isGiven: true,
        catId: 'verb', point: '一般过去时的被动语态（主谓一致）',
        wrongType: 'VOICE_ERROR', difficulty: 2,
        sense: '姑妈解释说，这床被子上的每一块布都是从她最喜爱的衣服上剪下来的，都代表着她人生中的某个重要时刻。',
        clue: '主语是 every piece（每一块），与 cut 是被动关系——布“被剪”；同句并列的 represented 是一般过去时，说明整句讲的是过去的事。',
        why: '第一步看语态：布不会自己剪，every piece of this quilt 和 cut 之间是被动，所以必须用 be + done。第二步看时态：并列谓语 represented 是过去式，且姑妈解释的是她过去做的事，所以 be 用 was。第三步看主谓一致：every piece 是单数，be 用 was 而不是 were。',
        others: '①cut / cuts：主动形式，布不能“剪”，语态错；②were cut：主语 every piece 是单数，主谓不一致；③had been cut：过去完成时要有“过去之前”的参照点，本句只叙述当时的做法，没有这个时间层次。',
        tip: 'every + 单数名词作主语 → 谓语单数；物作主语 + 动词是“施加动作” → 被动。'
      },
      {
        answer: 'to leave', accepted: ['to leave'], given: 'leave', isGiven: true,
        catId: 'nonfinite', point: 'it is time to do sth 句式',
        wrongType: 'VERB_FORM_ERROR', difficulty: 1,
        sense: '该告辞的时候，她把那床珍爱的被子送给了我。',
        clue: 'When it was time ______ (leave) 是一个固定句式：it 是形式主语，真正的内容在后面的不定式。',
        why: '先数谓语：When 从句里已有谓语 was，说明空处不能再放谓语动词，只能填非谓语。再看句式：It is/was time to do sth 表示“该做某事了”，此处用不定式 to leave 作真正的主语（it 只是占位）。',
        others: '①leaving：It is time doing 不是英语句式；It is time for doing 才用动名词，且后面不直接接 leave；②left：过去分词不能作这个句式的主语；③leaving 前加 our 才成立（It is time for leaving），与括号给的词不符。',
        tip: 'It is time to do sth（该做某事了）；It is time for sth/doing（……的时候了）。'
      },
      {
        answer: 'though', accepted: ['though', 'although'], given: '', isGiven: false,
        catId: 'adverbial', point: '让步状语从句连词',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 3,
        sense: '我开始把这个故事讲给十二岁的孙女听，尽管我心里有些担心。',
        clue: '主句是“我开始讲这个故事”，后面“我有些担心”与“讲”形成让步关系；再看下一句 Maybe children ... wouldn’t be interested，正是在说担心什么。',
        why: '先判断逻辑：讲故事与“有担心”不是因果也不是转折并列（不是 but 那种对等），而是“虽然担心，还是讲了”的让步。再看位置：空在逗号之后、从句之前，需要能引导让步状语从句的连词，though / although 都可以。',
        others: '①but：but 连接两个并列分句，前面 I began retelling this story to my 12-year-old granddaughter 是完整主句，but 后面再跟从句会缺主句结构；②because：逻辑反了，担心不是讲故事的原因；③unless / if：条件关系，与“虽然”的语义不符。',
        tip: '“虽然担心，还是做了”→ though / although 引导让步从句，不能和 but 同现。'
      },
      {
        answer: 'raised', accepted: ['raised'], given: 'raise', isGiven: true,
        catId: 'nonfinite', point: '过去分词作后置定语',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '也许在二十一世纪长大的孩子，对老太太讲一床旧被子不会感兴趣。',
        clue: 'children ______ (raise) in the 21st century：children 后面已经有谓语 wouldn’t be interested，空处只能是非谓语；孩子与 raise 是“被抚养”的被动关系。',
        why: '第一步数谓语：从句谓语是 wouldn’t be interested，空处不能再是谓语。第二步定关系：children 是被抚养的，所以要用过去分词 raised 作后置定语，相当于 who were raised in the 21st century。第三步排除：raising 表主动，会把“孩子抚养别人”这个意思塞进来。',
        others: '①raising：现在分词表主动，孩子不会去抚养别人；②to raise：不定式作定语多表将来的动作，此处是已经发生的事实；③were raised：再放一个谓语，与 wouldn’t be interested 冲突，句子会没有连词连接。',
        tip: '名词 + 一个空 + 后面还有谓语 → 非谓语；被动的用 done，主动的用 doing。'
      },
      {
        answer: 'describing', accepted: ['describing'], given: 'describe', isGiven: true,
        catId: 'nonfinite', point: '介词 to 后面接动名词（the door to doing）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 4,
        sense: '这打开了一扇门，让我能讲述母亲们如何把烹饪、园艺和缝纫的知识传给女儿。',
        clue: 'This opened the door to ______ (describe)：to 前面是名词 door，to 在这里是介词（“通向……的门”），不是不定式符号。',
        why: '先看 to 的性质：如果 to 后面接原形，to 必须是不定式符号，而不定式不能作介词的宾语；这里是 the door to...（通往……的门），to 是介词，介词后接名词或动名词，所以用 describing。这类“to 是介词”的搭配还有 look forward to doing、be used to doing。',
        others: '①describe：把 to 当不定式符号，但 the door to describe 讲不通（门不能“去描述”）；②described：过去分词表被动，而“讲述”这个动作是作者主动做的；③to describe：多一个 to，结构与前面的 to 重复。',
        tip: '名词 + to + doing 是固定搭配（the key to solving、the door to doing），这里的 to 是介词。'
      },
      {
        answer: 'when', accepted: ['when'], given: '', isGiven: false,
        catId: 'attrib', point: '定语从句 · 关系副词 when 作时间状语',
        wrongType: 'CLAUSE_ERROR', difficulty: 3,
        sense: '被孙女教了这么多，我想起了几代同堂的那些日子。',
        clue: '先行词是 the days（表时间），从句 multiple generations of families lived under one roof 主谓宾齐全，缺的是时间状语。',
        why: '先找先行词：the days 是表示时间的名词。再看从句：multiple generations of families 是主语，lived 是谓语，under one roof 是地点状语，句子成分已完整，说明关系词不能在从句里当主语或宾语，只能作时间状语，用关系副词 when（= in which）。',
        others: '①which：which 在从句里要充当主语或宾语，而本从句已经不缺成分；②that：同样要求从句缺成分，且非正式用法中 that 也不能替代表时间的 when；③where：where 指地点，the days 是时间不是地点。',
        tip: '先行词是时间名词 + 从句不缺主宾 → 用 when（= in/on which）。'
      },
      {
        answer: 'must', accepted: ['must'], given: '', isGiven: false,
        catId: 'extra', point: '情态动词 + have done 表对过去的肯定推测',
        wrongType: 'VERB_FORM_ERROR', difficulty: 4,
        sense: '分享知识与历史，在那个时候一定是天天都在发生的事。',
        clue: '空后是 have been（完成式），空后还有 at that time 指向过去；整句是对过去情况的肯定判断。',
        why: '先看结构：______ have been a daily occurrence 说明空处必须是情态动词或助动词，和 have been 一起构成谓语。再看语义：作者在推测过去的事实（“一定天天如此”），肯定推测用 must have done；at that time 把时间锁定在过去，所以不是 must be。',
        others: '①should：should have done 表示“本该做而没做”，是虚拟责备，与“一定如此”相反；②can：can have done 只用于疑问句和否定句，肯定句不用；③would：would have done 是虚拟条件句里的结果，本句没有虚拟条件。',
        tip: 'must have done＝对过去的肯定推测；can’t have done＝对过去的否定推测。'
      },
      {
        answer: 'even if', accepted: ['even if', 'even though', 'although', 'though'], given: '', isGiven: false,
        catId: 'adverbial', point: '让步状语从句（even if / even though）',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 4,
        sense: '只要我们继续互相教、互相学，即使相隔几代、相距千里，也能建立亲密感。',
        clue: '主句 we can build closeness 是正面结果，从句 we may be generations and thousands of miles apart 是不利条件；“即使……也……”正是让步关系。',
        why: '先判断逻辑：距离与代沟本来会阻碍亲密，但主句说仍能建立亲密，两者是让步。再看语气：这里含有“即使（可能）相距千里”的假设意味，even if 最贴切；如果把它当作已知事实，even though 也成立，故两个都接受。',
        others: '①because：因果讲反了，相隔千里不是“建立亲密”的原因；②so that：表目的或结果，与让步语义不符；③unless：条件“除非”，会变成“除非相隔千里才能亲密”，语义荒谬。',
        tip: '“即使……也……”→ even if / even though；让步从句后面主句不再加 but。'
      },
      {
        answer: 'closer', accepted: ['closer'], given: 'close', isGiven: true,
        catId: 'transform', point: '形容词比较级（far + 比较级）',
        wrongType: 'WORD_FORM_ERROR', difficulty: 2,
        sense: '它可以是任何东西——电脑、烹饪、园艺，甚至一床被子里讲出的年轻姑娘的故事——把你拉得离所爱的人更近。',
        clue: '空前的 far 修饰比较级（far closer），空后的 to those you love 是比较对象；整句在说“比原来更近”。',
        why: '第一步看修饰语：far 只能修饰比较级（far better / far closer），不能修饰原级。第二步看语义：brings you far ______ to those you love 表达“让你与所爱的人更亲近”，是两者相比更近，用比较级 closer。第三步看拼写：close 变比较级直接加 -r。',
        others: '①close：原级不能与 far 连用（far close 不成立）；②closest：最高级要 the + 范围，本句没有“在……之中”的比较范围；③more close：close 是单音节词，比较级加 -er，不用 more。',
        tip: 'far / much / even / a lot + 比较级；看到 far 就先想比较级。'
      }
    ]
  });

  P.push({
    id: 'paper02',
    no: '02',
    title: 'Noise — A Mixed Blessing',
    source: '2025 · 上海一模',
    level: '高三',
    genre: '议论文',
    words: 306,
    topic: '体育与观众噪声的双面作用',
    readGuide: '这是一篇“先肯定、再转折、最后分情况”的议论文。第一段讲主场噪声的积极作用，第二段转折：噪声真正影响的是裁判，第三段再分项目讨论。注意 however、But 这些信号。',
    passage: 'Convenient it might be, but attending a game virtually couldn’t possibly be as exciting as being at a real game, surely? And what about the effect on ______ well the players perform in the game? Don’t the fans have a responsibility to turn up and encourage their team? Sporting teams always prefer to play in their home stadium, where 70-80% of the crowd ______ (consist) of their own fans. There is plenty of evidence to show that the home team does have an advantage ______ the visiting team. On average, teams playing in their home stadium win about 53% of the time. There are certain football stadiums which seem ______ (design) to take advantage of the noise fans make, using the shape of the stadium to make the noise as loud as possible. This then makes it very difficult for the visiting team to do well.\n\nSome teams now train using recordings of the other team’s fans ______ they can learn to take no notice of whatever their opponents might be shouting. However, there is some evidence to suggest that those ______ (impact) are not the players, but the referees (裁判), or match officials, who have to take decisions about whether to allow goals. Shouting from the crowd can affect their decisions, and make them ______ (likely) to favour the visiting team.\n\nBut is the noise of their supporters always a positive thing for players or athletes? Not necessarily. In general, crowds seem to improve performance for team sports and sports ______ (involve) strength or the ability to keep going, such as running or cycling. However, sports which require a lot of concentration ______ (not benefit) from the excitement caused by the screaming crowd. These kinds of athletes need calm and quiet to do well, and noise from the crowd might cause ______ to take unnecessary risks and make a mistake.',
    blanks: [
      {
        answer: 'how', accepted: ['how'], given: '', isGiven: false,
        catId: 'nominal', point: '宾语从句 · 连接副词 how 修饰 well',
        wrongType: 'CLAUSE_ERROR', difficulty: 2,
        sense: '那它对球员在场上的表现到底有多好，会有什么影响呢？',
        clue: '介词 on 后面是宾语从句 ______ well the players perform，well 是副词，需要一个能修饰副词的连接词。',
        why: '先看结构：介词 on 后接宾语从句，从句 the players perform 主谓齐全，前面却有副词 well，说明缺的是修饰 well 的程度副词。表示“多么好、表现得多好”用 how well，how 引导宾语从句并在从句中作状语。',
        others: '①that：that 引导的从句必须完整，不能在 well 前再插一个词；②what：what 要在从句里作主语或宾语，而这里主语 the players、谓语 perform 都在；③however：however 引导让步状语从句，语义是“无论多么”，与本句“有多大影响”不符。',
        tip: 'how + adj./adv. + 主谓 = “多么……”，常放在介词后作宾语从句。'
      },
      {
        answer: 'consists', accepted: ['consists'], given: 'consist', isGiven: true,
        catId: 'verb', point: '主谓一致（百分数 + of + 名词）',
        wrongType: 'SUBJECT_VERB_AGREEMENT', difficulty: 4,
        sense: '运动队总是更喜欢在主场作战，那里 70% 到 80% 的观众都是自己的球迷。',
        clue: 'where 从句的主语是 70-80% of the crowd；crowd 是集合名词、在这里作单数看，且 consist of 没有被动形式。',
        why: '第一步找主语：70-80% of the crowd。百分数作主语时，谓语与 of 后面的名词一致；crowd 表示“人群”整体，作单数，所以谓语用 consists。第二步看搭配：consist of 是主动形式，不能用 be consisted of。第三步看时态：全段用一般现在时陈述普遍情况，用 consists。',
        others: '①consist：主语是单数第三人称，动词必须加 -s；②are consisted：consist of 是不及物动词短语，没有被动语态；③consisting：这里需要谓语，现在分词不能单独作谓语。',
        tip: '百分数/分数 + of + 名词，谓语跟着 of 后面的名词走；consist of 永远主动。'
      },
      {
        answer: 'over', accepted: ['over'], given: '', isGiven: false,
        catId: 'prep', point: '固定搭配 have an advantage over',
        wrongType: 'PREPOSITION_ERROR', difficulty: 3,
        sense: '有大量证据表明，主队确实比客队占优势。',
        clue: '空前的 an advantage 与空后的 the visiting team 构成“对……的优势”这一固定搭配。',
        why: '先看搭配：advantage 与不同介词组合意思不同——have an advantage over sb 表示“比某人占优势”，take advantage of 表示“利用”。本句是“主队对客队有优势”，比较双方用 over。再看语境：后面讲主场胜率约 53%，正是在说这种优势。',
        others: '①of：an advantage of 后接的是“优点、好处”的具体内容，不是比较对象；②to：没有 have an advantage to sb 这个搭配；③than：than 用于比较级后面，advantage 本身不是比较级。',
        tip: 'have an advantage over sb（比某人占优势）/ take advantage of sth（利用某事）。'
      },
      {
        answer: 'designed', accepted: ['designed'], given: 'design', isGiven: true,
        catId: 'nonfinite', point: 'seem + 过去分词（be designed to do 的省略）',
        wrongType: 'VOICE_ERROR', difficulty: 3,
        sense: '有些足球场似乎就是被专门设计来放大球迷制造的噪声的，它们利用球场的形状把声音弄得尽可能响。',
        clue: 'which seem ______ (design) to take advantage of the noise：先行词 stadiums 与 design 是被动关系（球场“被设计”），to take advantage of 说明设计的目的。',
        why: '先数谓语：定语从句已有谓语 seem，空处只能是非谓语。再看语态：球场是被设计的，所以用过去分词 designed，构成 seem designed to do（= seem to be designed to do）。后面 using the shape of the stadium 是现在分词作状语，进一步印证前面说的是设计特征。',
        others: '①designing：现在分词表主动，球场不会去设计别人；②to design：seem to design 会变成“球场似乎设计了……”，主语与动作关系错；③design：原形不能作 seem 的表语。',
        tip: 'seem / appear / look + done 表示“看起来是被……的”，被动含义靠过去分词。'
      },
      {
        answer: 'so that', accepted: ['so that'], given: '', isGiven: false,
        catId: 'adverbial', point: '目的状语从句 so that',
        wrongType: 'CONJUNCTION_ERROR', difficulty: 3,
        sense: '现在有些球队用对手球迷的录音来训练，好让球员学会对那些喊声置之不理。',
        clue: '前半句是“用录音训练”，后半句 they can learn to take no notice 是训练想达到的目的；两个空连写说明这里是两个词组成的一个连词。',
        why: '先判断逻辑：train using recordings 与 learn to take no notice 是“做法—目的”关系，不是因果（because）也不是结果（so...that 结构中间要有形容词）。再看结构：______ ______ they can learn 后面是完整的主谓，前面需要引导目的状语从句的连词，so that 正好两个词。',
        others: '①such that：such that 前面要有 such + 名词，本句没有；②so as：so as 后面接不定式（so as to do），不能接从句；③in order：要写成 in order that 才引导从句，且只空一格时写不下。',
        tip: 'so that + 从句（目的/结果）；so as to / in order to + 动词原形。'
      },
      {
        answer: 'impacted', accepted: ['impacted'], given: 'impact', isGiven: true,
        catId: 'nonfinite', point: '过去分词作后置定语（those impacted）',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '然而有证据表明，受到影响的人不是球员，而是裁判，也就是那些必须判定进球是否有效的比赛官员。',
        clue: 'those ______ (impact) 后面紧跟 are not the players，说明空处不能是谓语；those 与 impact 是被动关系（“被影响的人”）。',
        why: '第一步看结构：从句谓语是 are，those 后面只能放修饰语，用过去分词 impacted 作后置定语（= those who are impacted）。第二步看语态：人是“被影响”的，所以用 -ed 形式。第三步看搭配：impact 作动词时及物，被动含义用过去分词最自然。',
        others: '①impacting：现在分词表主动，“影响别人的人”与原意相反；②to impact：不定式作定语多指将来，且与 those 搭配不自然；③are impacted：再出现一个谓语，与后面的 are not the players 冲突。',
        tip: 'those + done = those who are done（被……的人）；those + doing = 主动做……的人。'
      },
      {
        answer: 'more likely', accepted: ['more likely'], given: 'likely', isGiven: true,
        catId: 'transform', point: '形容词比较级（make sb more likely to do）',
        wrongType: 'WORD_FORM_ERROR', difficulty: 2,
        sense: '看台上的喊声会影响他们的判罚，使他们更可能做出对客队有利的决定。',
        clue: '前文说噪声会影响裁判的决定，这里与“不受影响时”相比，是程度上的“更容易”，且 likely 是多音节词。',
        why: '第一步看结构：make them ______ to favour 是 make + 宾语 + 宾补，宾补要用形容词。第二步看语义：噪声让裁判“更倾向于”帮客队，含比较意味，所以用比较级。第三步看形式：likely 是多音节形容词，比较级用 more likely，不加 -er。',
        others: '①likely：原级只表示“可能的”，体现不出噪声带来的程度变化；②most likely：最高级需要 the 和比较范围，本句没有“在……中最”；③likelier：likely 虽有人用 likelier，但标准书面语用 more likely。',
        tip: 'make + 宾语 + adj.（宾补）；多音节形容词比较级用 more，最高级用 the most。'
      },
      {
        answer: 'involving', accepted: ['involving'], given: 'involve', isGiven: true,
        catId: 'nonfinite', point: '现在分词作后置定语',
        wrongType: 'VERB_FORM_ERROR', difficulty: 3,
        sense: '总的来说，观众似乎能提升团队项目和需要力量或耐力的项目（比如跑步、骑行）的表现。',
        clue: 'sports ______ (involve) strength or the ability to keep going：sports 后面是定语位置，且运动与 involve 是主动关系（运动“包含、需要”力量）。',
        why: '先看结构：主句谓语是 seem to improve，空处只能是修饰 sports 的定语。再看关系：sports 主动 involve strength（需要力量），用现在分词 involving 作后置定语。后面 such as running or cycling 是对“需要力量或耐力”的举例，语义吻合。',
        others: '①involved：过去分词表被动，“被包含的运动”讲不通；②to involve：不定式作定语通常表将来或目的，这里是一般性说明；③involves：再放一个谓语，与主句谓语冲突。',
        tip: '主动关系用 doing 作定语，被动关系用 done；先判断名词与动词谁主动。'
      },
      {
        answer: 'don’t benefit', accepted: ['don’t benefit', 'do not benefit'], given: 'not benefit', isGiven: true,
        catId: 'verb', point: '一般现在时的否定（主谓一致）',
        wrongType: 'SUBJECT_VERB_AGREEMENT', difficulty: 3,
        sense: '然而，需要高度专注的运动并不能从观众尖叫带来的兴奋中获益。',
        clue: '主语是 sports which require a lot of concentration，中心词 sports 是复数；括号给的是 not benefit，说明要自己补出助动词构成否定。',
        why: '第一步定谓语：主句需要一个谓语，benefit 是实义动词，否定要借助 do/does/did。第二步看主语：sports 是复数，所以用 don’t（do not）。第三步看时态：全段是一般现在时讲普遍规律，因此 don’t benefit。',
        others: '①doesn’t benefit：主语 sports 是复数，助动词用 does 会造成主谓不一致；②not benefit：英语里实义动词不能直接加 not，必须借助助动词；③aren’t benefit：benefit 是实义动词，不是形容词，不能与 be 连用。',
        tip: '实义动词的否定 = do/does/did + not + 动词原形；先看主语单复数再选助动词。'
      },
      {
        answer: 'them', accepted: ['them'], given: '', isGiven: false,
        catId: 'pronoun', point: '人称代词宾格（指代前文的 athletes）',
        wrongType: 'PRONOUN_ERROR', difficulty: 2,
        sense: '这类运动员需要安静的环境才能发挥好，而观众的噪声可能让他们去冒不必要的风险、犯下错误。',
        clue: 'cause ______ to take unnecessary risks：cause sb to do sth 里的 sb 指前一句的 These kinds of athletes。',
        why: '先看结构：cause + 宾语 + to do，空处必须是宾语，用宾格。再找指代：上一句 These kinds of athletes need calm and quiet，说明这里指的是“这些运动员”，复数，用 them。',
        others: '①they：主格不能作 cause 的宾语；②their：物主代词后面要接名词，而这里后面是 to take，不是名词；③themselves：反身代词表示“他们自己对自己”，本句是噪声让他们冒险，不是自己对自己。',
        tip: 'cause sb to do sth；动词后的宾语用宾格，先找它指代的是哪个人/物。'
      }
    ]
  });
})();
