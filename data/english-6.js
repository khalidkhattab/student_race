/*
  English – Grade 6 – Term 1
  Source: English notes (Basics + Units 1–4) – vocabulary lists and grammar lessons.
*/
(function () {
  const { Q, M, C } = window.QB;
  const L0 = window.QB.L('u0'), L1 = window.QB.L('u1'), L2 = window.QB.L('u2'), L3 = window.QB.L('u3'), L4 = window.QB.L('u4');

  const units = [
    {
      id: 'u0', name: 'Basics – الأساسيات',
      lessons: [
        L0('l1', 'Helping Verbs', 'الأفعال المساعدة', [
          Q('Grammar', 'He ___ my brother.', 'is', 'are', 'am', 'were'),
          Q('Grammar', 'We ___ happy today.', 'are', 'is', 'am', 'was'),
          Q('Grammar', 'I ___ at school yesterday.', 'was', 'were', 'am', 'are'),
          Q('Grammar', 'They ___ in the park last week.', 'were', 'was', 'is', 'am'),
          Q('Grammar', 'She ___ like fish.', "doesn't", "don't", "isn't", "aren't"),
          Q('Grammar', '"Was" is used with:', 'I – he – she – it', 'we – you – they', 'all pronouns', 'they only'),
          Q('Grammar', 'I ___ a new bike.', 'have', 'has', 'is', 'does')
        ]),
        L0('l2', 'Question Formation', 'تكوين السؤال', [
          Q('Grammar', 'Choose the correct question: "He plays football."', 'Does he play football?', 'Do he play football?', 'Does he plays football?', 'Is he play football?'),
          Q('Grammar', 'Choose the correct question: "They are at home."', 'Are they at home?', 'Do they at home?', 'Is they at home?', 'Does they at home?'),
          Q('Grammar', 'Choose the correct question: "She visited her aunt."', 'Did she visit her aunt?', 'Did she visited her aunt?', 'Does she visited her aunt?', 'Was she visit her aunt?'),
          Q('Grammar', '___ do you live? – In Jahra.', 'Where', 'When', 'Who', 'What'),
          Q('Grammar', '___ old are you? – I am eleven.', 'How', 'What', 'Who', 'Where'),
          Q('Grammar', '___ is that man? – He is my uncle.', 'Who', 'What', 'Where', 'Why')
        ]),
        L0('l3', 'Negative Making', 'النفي', [
          Q('Grammar', 'Make it negative: "I am tired."', "I'm not tired.", "I don't tired.", "I amn't tired.", 'I no tired.'),
          Q('Grammar', 'Make it negative: "He watches TV."', "He doesn't watch TV.", "He don't watch TV.", "He doesn't watches TV.", "He isn't watch TV."),
          Q('Grammar', 'Make it negative: "We went to the zoo."', "We didn't go to the zoo.", "We didn't went to the zoo.", "We don't went to the zoo.", "We wasn't go to the zoo."),
          Q('Grammar', 'Make it negative: "They were late."', "They weren't late.", "They wasn't late.", "They didn't late.", "They don't late."),
          Q('Grammar', 'Make it negative: "She can swim."', "She can't swim.", "She doesn't can swim.", "She isn't swim.", 'She not can swim.')
        ]),
        L0('l4', 'Basic Tenses', 'الأزمنة الأساسية', [
          Q('Grammar', 'My mother ___ breakfast every morning.', 'makes', 'make', 'is making', 'made'),
          Q('Grammar', 'Look! The cat ___ on the sofa.', 'is sleeping', 'sleeps', 'sleep', 'slept'),
          Q('Grammar', 'We ___ to Failaka Island last summer.', 'went', 'go', 'goes', 'are going'),
          C('Grammar', 'Match each time expression with its tense:', ['Present Simple', 'Present Continuous', 'Past Simple'], [['every day', 0], ['always', 0], ['now', 1], ['at the moment', 1], ['yesterday', 2], ['ago', 2]])
        ])
      ]
    },
    {
      id: 'u1', name: 'Unit 1: Art and Expression',
      lessons: [
        L1('l1', 'Vocabulary', 'Art and Expression', [
          Q('Vocabulary', 'A TV station like "Kuwait TV" is a ___.', 'channel', 'trader', 'craft', 'moment'),
          Q('Vocabulary', 'A film that shows real facts about something is a ___.', 'documentary', 'series', 'channel', 'poetry'),
          Q('Vocabulary', 'A person who buys and sells goods is a ___.', 'trader', 'channel', 'programme', 'gallery'),
          Q('Vocabulary', 'The meaning of "cheerful" is:', 'مبتهج – سعيد', 'رسمي', 'يومي', 'خشبي'),
          Q('Vocabulary', 'The meaning of "craft" is:', 'حرفة – صنعة', 'قناة', 'لحظة', 'بضائع'),
          Q('Vocabulary', 'Artists ___ their feelings through art.', 'express', 'allow', 'support', 'guide'),
          Q('Vocabulary', 'Old boats in Kuwait were ___.', 'wooden', 'daily', 'official', 'international'),
          Q('Vocabulary', 'Writing poems is called ___.', 'poetry', 'broadcasting', 'content', 'value'),
          Q('Vocabulary', 'Things that traders sell are ___.', 'goods', 'moments', 'channels', 'choices'),
          Q('Vocabulary', 'The meaning of "allow" is:', 'يسمح', 'يدعم', 'يعبر', 'يرشد'),
          C('Vocabulary', 'Classify the words:', ['noun', 'verb', 'adjective'], [['channel', 0], ['documentary', 0], ['support', 1], ['express', 1], ['cheerful', 2], ['wooden', 2]])
        ]),
        L1('l2', 'Grammar 1: Past Simple', 'الماضي البسيط', [
          Q('Grammar', 'Yesterday, I ___ my grandfather.', 'visited', 'visit', 'visits', 'visiting'),
          Q('Grammar', 'She ___ a cake last night.', 'made', 'make', 'makes', 'maked'),
          Q('Grammar', 'They ___ watch TV yesterday.', "didn't", "don't", "doesn't", "wasn't"),
          Q('Grammar', '___ you go to the museum last week?', 'Did', 'Do', 'Does', 'Were'),
          Q('Grammar', 'The past of "see" is:', 'saw', 'seed', 'seen', 'sees'),
          Q('Grammar', 'The past of "write" is:', 'wrote', 'writed', 'written', 'writes'),
          Q('Grammar', 'Which word shows the past simple?', 'last year', 'now', 'every day', 'tomorrow'),
          Q('Grammar', 'The past of "study" is:', 'studied', 'studyed', 'studid', 'studies')
        ]),
        L1('l3', 'Grammar 2: Used to / Didn\'t use to', 'العادات في الماضي', [
          Q('Grammar', 'People ___ travel by camels in the past.', 'used to', 'use to', 'using to', 'uses to'),
          Q('Grammar', 'My grandfather ___ have a mobile phone.', "didn't use to", "didn't used to", "don't use to", "not used to"),
          Q('Grammar', '___ you use to play in the street?', 'Did', 'Do', 'Were', 'Are'),
          Q('Grammar', 'We use "used to" to talk about:', 'past habits that are not true now', 'future plans', 'actions happening now', 'daily routines now'),
          Q('Grammar', 'Choose the correct sentence:', 'Kuwaiti people used to dive for pearls.', 'Kuwaiti people use to dive for pearls yesterday.', 'Kuwaiti people used to diving for pearls.', 'Kuwaiti people used dive for pearls.')
        ])
      ]
    },
    {
      id: 'u2', name: 'Unit 2: Landmarks and Tourism',
      lessons: [
        L2('l1', 'Vocabulary', 'Landmarks and Tourism', [
          Q('Vocabulary', 'A trip on a big ship for holiday is a ___.', 'cruise', 'tour', 'gallery', 'design'),
          Q('Vocabulary', 'A place where you can see paintings and photos is a ___.', 'gallery', 'cruise', 'contrast', 'event'),
          Q('Vocabulary', 'The meaning of "stunning" is:', 'مدهش – مذهل', 'ممتع', 'نادر', 'دولي'),
          Q('Vocabulary', 'The meaning of "unique" is:', 'نادر – فريد', 'مدهش', 'دولي', 'سار'),
          Q('Vocabulary', 'The meaning of "recommend" is:', 'ينصح بـ – يوصي بـ', 'يحضر', 'يجذب', 'يرشد'),
          Q('Vocabulary', 'Kuwait Towers ___ many tourists.', 'attract', 'attend', 'recommend', 'guide'),
          Q('Vocabulary', 'We will ___ the book exhibition next week.', 'attend', 'attract', 'guide', 'contrast'),
          Q('Vocabulary', 'A guide will ___ us around the museum.', 'guide', 'attract', 'attend', 'impress'),
          Q('Vocabulary', 'The meaning of "incredible" is:', 'غير معقول – لا يصدق', 'بالتأكيد', 'بشكل خاص', 'سار'),
          Q('Vocabulary', 'The meaning of "pleasant" is:', 'ممتع – سار', 'مدهش', 'فريد', 'دولي')
        ]),
        L2('l2', 'Grammar 1: Enjoy / Prefer / Like', 'التعبير عن التفضيل', [
          Q('Grammar', 'I enjoy ___ to the beach.', 'going', 'go', 'to going', 'goes'),
          Q('Grammar', 'She likes ___ books.', 'reading', 'read', 'reads', 'readed'),
          Q('Grammar', 'I prefer tea ___ coffee.', 'to', 'than', 'from', 'with'),
          Q('Grammar', 'He prefers swimming ___ running.', 'to', 'than', 'of', 'at'),
          Q('Grammar', 'After "enjoy" we use:', 'verb + ing', 'to + verb', 'past verb', 'will + verb'),
          Q('Grammar', 'They ___ visiting new places.', 'enjoy', 'enjoys', 'enjoying', 'are enjoy')
        ]),
        L2('l3', 'Grammar 2: First Conditional', 'الشرط الأول', [
          Q('Grammar', 'If it rains, we ___ at home.', 'will stay', 'stay', 'stayed', 'staying'),
          Q('Grammar', 'If you ___ hard, you will pass.', 'study', 'will study', 'studied', 'studying'),
          Q('Grammar', 'If she visits Kuwait, she ___ the Grand Mosque.', 'will see', 'sees', 'saw', 'seeing'),
          Q('Grammar', 'The first conditional form is:', 'If + present simple, will + verb', 'If + past, would + verb', 'If + will, present', 'If + past, will'),
          Q('Grammar', 'We will go to the park if the weather ___ nice.', 'is', 'will be', 'was', 'be')
        ])
      ]
    },
    {
      id: 'u3', name: 'Unit 3: Our Environment, Our Choice',
      lessons: [
        L3('l1', 'Vocabulary', 'Our Environment', [
          Q('Vocabulary', 'Things we throw away are called ___.', 'waste', 'climate', 'forest', 'campaign'),
          Q('Vocabulary', 'Making the air or water dirty is called ___.', 'pollution', 'routine', 'container', 'campaign'),
          Q('Vocabulary', 'We should ___ plastic bottles to make new things.', 'recycle', 'harm', 'notice', 'impress'),
          Q('Vocabulary', 'We must ___ the use of plastic bags.', 'reduce', 'recycle', 'remind', 'notice'),
          Q('Vocabulary', 'Animals that may disappear forever are ___.', 'endangered', 'crowded', 'creative', 'dirty'),
          Q('Vocabulary', 'The meaning of "harm" is:', 'يؤذي – يضر', 'يقلل', 'يلاحظ', 'يُذكّر'),
          Q('Vocabulary', 'The meaning of "carelessly" is:', 'بإهمال', 'بعناية', 'بلطف', 'بحكمة'),
          Q('Vocabulary', 'A large area full of trees is a ___.', 'forest', 'container', 'campaign', 'routine'),
          Q('Vocabulary', 'The meaning of "crowded" is:', 'مزدحم', 'متسخ', 'مبدع', 'معدني'),
          Q('Vocabulary', 'The students started a ___ to clean the beach.', 'campaign', 'climate', 'pollution', 'metal')
        ]),
        L3('l2', 'Grammar 1: Present Continuous', 'المضارع المستمر', [
          Q('Grammar', 'Look! The children ___ the beach.', 'are cleaning', 'clean', 'cleans', 'is cleaning'),
          Q('Grammar', 'I ___ plastic bottles now.', 'am collecting', 'collect', 'is collecting', 'are collect'),
          Q('Grammar', 'She ___ planting trees at the moment.', 'is', 'are', 'am', 'does'),
          Q('Grammar', '___ they recycling paper now?', 'Are', 'Is', 'Do', 'Does'),
          Q('Grammar', 'The -ing form of "make" is:', 'making', 'makeing', 'makking', 'maked'),
          Q('Grammar', 'The -ing form of "run" is:', 'running', 'runing', 'runeing', 'rans')
        ]),
        L3('l3', 'Grammar 2: Future Simple', 'المستقبل البسيط', [
          Q('Grammar', 'Tomorrow, we ___ trees in the school garden.', 'will plant', 'plant', 'planted', 'planting'),
          Q('Grammar', 'I ___ waste water again.', "won't", "don't will", "willn't", "not will"),
          Q('Grammar', '___ you help me recycle these cans?', 'Will', 'Do', 'Are', 'Did'),
          Q('Grammar', 'The future simple form is:', 'will + verb (base)', 'will + verb + ing', 'will + past verb', 'am / is / are + verb'),
          Q('Grammar', 'Which word shows the future?', 'next week', 'yesterday', 'now', 'every day')
        ])
      ]
    },
    {
      id: 'u4', name: 'Unit 4: What Stories Teach Us',
      lessons: [
        L4('l1', 'Vocabulary', 'What Stories Teach Us', [
          Q('Vocabulary', 'A man who cuts trees is a ___.', 'woodcutter', 'storyteller', 'stranger', 'character'),
          Q('Vocabulary', 'A person who tells stories is a ___.', 'storyteller', 'woodcutter', 'generation', 'reward'),
          Q('Vocabulary', 'A tool used to cut wood is an ___.', 'axe', 'tale', 'expression', 'reward'),
          Q('Vocabulary', 'A person you do not know is a ___.', 'stranger', 'character', 'generation', 'storyteller'),
          Q('Vocabulary', 'The meaning of "honest" is:', 'صادق – أمين', 'قلق', 'عادل', 'بطولي'),
          Q('Vocabulary', 'The meaning of "reward" is:', 'مكافأة – جائزة', 'حكاية', 'موقف', 'شخصية'),
          Q('Vocabulary', 'The meaning of "worried" is:', 'قلق', 'عميق', 'فضي', 'عادل'),
          Q('Vocabulary', 'He listened ___ to his teacher.', 'attentively', 'nervously', 'deep', 'heroic'),
          Q('Vocabulary', 'The axe ___ from his hand into the river.', 'slipped', 'earned', 'admired', 'explained'),
          Q('Vocabulary', 'The meaning of "tale" is:', 'حكاية – قصة', 'جيل', 'تعبير', 'فأس')
        ]),
        L4('l2', 'Grammar 1: Relative Pronouns (which / who / where / when)', 'أسماء الوصل', [
          Q('Grammar', 'The woodcutter is the man ___ lost his axe.', 'who', 'which', 'where', 'when'),
          Q('Grammar', 'This is the axe ___ fell into the river.', 'which', 'who', 'where', 'when'),
          Q('Grammar', 'That is the forest ___ he worked.', 'where', 'who', 'which', 'when'),
          Q('Grammar', 'Friday is the day ___ we visit our grandparents.', 'when', 'where', 'who', 'which'),
          C('Grammar', 'Match each relative pronoun with its use:', ['who', 'which', 'where', 'when'], [['for people', 0], ['for things and animals', 1], ['for places', 2], ['for time', 3]])
        ]),
        L4('l3', 'Grammar 2: Past Continuous (while / when)', 'الماضي المستمر', [
          Q('Grammar', 'He ___ wood when his axe fell.', 'was cutting', 'were cutting', 'cut', 'is cutting'),
          Q('Grammar', 'They ___ playing when it started to rain.', 'were', 'was', 'are', 'did'),
          Q('Grammar', 'While I ___ my homework, my friend called.', 'was doing', 'did', 'were doing', 'do'),
          Q('Grammar', 'She was reading ___ her brother was drawing.', 'while', 'when', 'so', 'but'),
          Q('Grammar', 'The past continuous form is:', 'was / were + verb + ing', 'will + verb', 'did + verb', 'am / is / are + verb + ing')
        ])
      ]
    }
  ];

  window.SUBJECTS = window.SUBJECTS || [];
  window.SUBJECTS.push({ id: 'english6', name: 'اللغة الإنجليزية', icon: '🔤', color: '#db2777', grade: 'الصف السادس', units });
})();
