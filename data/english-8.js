/*
  English – Grade 8 – Term 1
  Source: English comprehensive notes (Basics + Units 1–4) – vocabulary lists and grammar lessons.
*/
(function () {
  const { Q, M, C } = window.QB;
  const L0 = window.QB.L('u0'), L1 = window.QB.L('u1'), L2 = window.QB.L('u2'), L3 = window.QB.L('u3'), L4 = window.QB.L('u4');

  const units = [
    {
      id: 'u0',
      name: 'Basics – الأساسيات',
      lessons: [
        L0('l1', 'Helping Verbs', 'الأفعال المساعدة', [
          Q('Grammar', 'She ___ a student.', 'is', 'are', 'am', 'be'),
          Q('Grammar', 'They ___ playing in the garden now.', 'are', 'is', 'am', 'was'),
          Q('Grammar', 'I ___ tired yesterday.', 'was', 'were', 'am', 'is'),
          Q('Grammar', 'We ___ at the museum last Friday.', 'were', 'was', 'is', 'am'),
          Q('Grammar', 'He ___ have a car.', "doesn't", "don't", "isn't", "aren't"),
          Q('Grammar', 'They ___ finished their homework.', 'have', 'has', 'is', 'does'),
          Q('Grammar', 'She ___ visited Kuwait Towers.', 'has', 'have', 'are', 'do'),
          Q('Grammar', 'You ___ wear a seatbelt. It is the law.', 'must', 'can', 'may', 'would')
        ]),
        L0('l2', 'Question Formation', 'تكوين السؤال', [
          Q('Grammar', 'Choose the correct question: "She lives in Salmiya."', 'Where does she live?', 'Where she lives?', 'Where do she live?', 'Where is she live?'),
          Q('Grammar', 'Choose the correct question: "They are playing football."', 'What are they playing?', 'What they are playing?', 'What do they playing?', 'What does they play?'),
          Q('Grammar', 'Choose the correct question: "He went to school by bus."', 'How did he go to school?', 'How he went to school?', 'How does he went to school?', 'How did he went to school?'),
          Q('Grammar', '___ is your favourite subject? – Science.', 'What', 'Where', 'When', 'Who'),
          Q('Grammar', '___ is your birthday? – In May.', 'When', 'Where', 'Who', 'Why'),
          Q('Grammar', '___ is your teacher? – Mr. Ahmad.', 'Who', 'What', 'Where', 'How'),
          Q('Grammar', '___ are you late? – Because the bus was late.', 'Why', 'When', 'Who', 'Which'),
          Q('Grammar', '___ books do you have? – Five.', 'How many', 'How much', 'How old', 'How long')
        ]),
        L0('l3', 'Negative Making', 'النفي', [
          Q('Grammar', 'Make it negative: "I like coffee."', "I don't like coffee.", "I doesn't like coffee.", 'I not like coffee.', "I didn't liked coffee."),
          Q('Grammar', 'Make it negative: "She plays tennis."', "She doesn't play tennis.", "She don't play tennis.", "She doesn't plays tennis.", 'She not plays tennis.'),
          Q('Grammar', 'Make it negative: "They went to the park."', "They didn't go to the park.", "They didn't went to the park.", "They don't went to the park.", 'They not went to the park.'),
          Q('Grammar', 'Make it negative: "He is reading."', "He isn't reading.", "He doesn't reading.", "He don't reading.", "He aren't reading."),
          Q('Grammar', 'Make it negative: "We have finished."', "We haven't finished.", "We don't have finished.", "We hasn't finished.", "We didn't finished."),
          Q('Grammar', 'Make it negative: "You can swim."', "You can't swim.", "You don't can swim.", "You doesn't can swim.", 'You not can swim.')
        ]),
        L0('l4', 'Basic Tenses', 'الأزمنة الأساسية', [
          Q('Grammar', 'My father ___ to work every day.', 'drives', 'drive', 'is driving', 'drove'),
          Q('Grammar', 'Look! The children ___ in the garden.', 'are playing', 'play', 'plays', 'played'),
          Q('Grammar', 'We ___ the Scientific Centre last week.', 'visited', 'visit', 'are visiting', 'visits'),
          Q('Grammar', 'I ___ my homework tomorrow.', 'will do', 'did', 'do', 'have done'),
          C('Grammar', 'Match each time expression with its tense:', ['Present Simple', 'Present Continuous', 'Past Simple'], [['every day', 0], ['usually', 0], ['now', 1], ['at the moment', 1], ['yesterday', 2], ['last year', 2]]),
          Q('Grammar', 'The past of "go" is:', 'went', 'goed', 'gone', 'going'),
          Q('Grammar', 'The past of "buy" is:', 'bought', 'buyed', 'brought', 'buys')
        ])
      ]
    },
    {
      id: 'u1',
      name: 'Unit One: Kuwait Then and Now',
      lessons: [
        L1('l1', 'Vocabulary', 'Living the Change', [
          Q('Vocabulary', 'A famous building or place that is easy to recognise is a ___.', 'landmark', 'museum', 'tutorial', 'digital'),
          Q('Vocabulary', 'A place where you can see old and important objects is a ___.', 'museum', 'landmark', 'market', 'tutorial'),
          Q('Vocabulary', 'The meaning of "nowadays" is:', 'هذه الأيام', 'سابقاً', 'تقريباً', 'حديثاً'),
          Q('Vocabulary', 'The meaning of "previously" is:', 'سابقاً – فيما مضى', 'هذه الأيام', 'فوري', 'حديثاً'),
          Q('Vocabulary', 'The meaning of "convenient" is:', 'ملائم', 'رائع', 'غني', 'رقمي'),
          Q('Vocabulary', 'Smart apps help us ___ with our friends easily.', 'communicate', 'locate', 'receive', 'become'),
          Q('Vocabulary', 'Online shops can ___ food to your home.', 'deliver', 'communicate', 'become', 'locate'),
          Q('Vocabulary', 'The Avenues mall is ___ in Al Rai area.', 'located', 'delivered', 'provided', 'received'),
          Q('Vocabulary', 'Kuwait is a ___ country with oil.', 'rich', 'digital', 'instant', 'social'),
          Q('Vocabulary', 'I am ___ of reading stories.', 'fond', 'proud', 'rich', 'convenient'),
          Q('Vocabulary', 'The meaning of "instant" is:', 'فوري', 'ملائم', 'مميز', 'تقريباً'),
          C('Vocabulary', 'Classify the words:', ['noun', 'verb', 'adjective', 'adverb'], [['museum', 0], ['tutorial', 0], ['deliver', 1], ['communicate', 1], ['digital', 2], ['wonderful', 2], ['recently', 3], ['almost', 3]])
        ]),
        L1('l2', 'Grammar 1: Present Simple', 'المضارع البسيط', [
          Q('Grammar', 'She ___ her grandmother every Friday.', 'visits', 'visit', 'visiting', 'is visit'),
          Q('Grammar', 'My brothers ___ football after school.', 'play', 'plays', 'playing', 'is playing'),
          Q('Grammar', 'The sun ___ in the east.', 'rises', 'rise', 'is rise', 'rising'),
          Q('Grammar', 'He ___ watch TV at night.', "doesn't", "don't", "isn't", "aren't"),
          Q('Grammar', '___ you use smart apps?', 'Do', 'Does', 'Are', 'Is'),
          Q('Grammar', '___ your father work in a bank?', 'Does', 'Do', 'Is', 'Are'),
          Q('Grammar', 'We use the present simple for:', 'habits, routines and facts', 'actions happening now', 'finished past actions', 'future plans only'),
          Q('Grammar', 'Which word is a sign of the present simple?', 'always', 'now', 'yesterday', 'at the moment'),
          Q('Grammar', 'The correct form: "My sister ___ (study) English."', 'studies', 'studys', 'study', 'studying')
        ]),
        L1('l3', 'Grammar 2: Present Continuous', 'المضارع المستمر', [
          Q('Grammar', 'Be quiet! The baby ___.', 'is sleeping', 'sleeps', 'sleep', 'are sleeping'),
          Q('Grammar', 'They ___ a new mall at the moment.', 'are building', 'build', 'builds', 'is building'),
          Q('Grammar', 'I ___ to music now.', 'am listening', 'listen', 'is listening', 'are listen'),
          Q('Grammar', 'She ___ watching TV right now. She is studying.', "isn't", "doesn't", "don't", "aren't"),
          Q('Grammar', '___ they playing football now?', 'Are', 'Is', 'Do', 'Does'),
          Q('Grammar', 'We use the present continuous for:', 'actions happening now', 'daily habits', 'facts', 'finished actions'),
          Q('Grammar', 'The -ing form of "swim" is:', 'swimming', 'swiming', 'swimeing', 'swimmming'),
          Q('Grammar', 'The -ing form of "write" is:', 'writing', 'writeing', 'writting', 'writeng'),
          Q('Grammar', 'Choose the correct sentence:', 'Look! It is raining.', 'Look! It rains.', 'Look! It rain.', 'Look! It raining.')
        ])
      ]
    },
    {
      id: 'u2',
      name: 'Unit Two: Innovation and Creation',
      lessons: [
        L2('l1', 'Vocabulary', 'Innovation and Creation', [
          Q('Vocabulary', 'A person who invents new things is an ___.', 'inventor', 'invention', 'organisation', 'surgeon'),
          Q('Vocabulary', 'A doctor who does operations is a ___.', 'surgeon', 'inventor', 'junior', 'brochure'),
          Q('Vocabulary', 'Money given to a student to study is a ___.', 'scholarship', 'competition', 'brochure', 'fair'),
          Q('Vocabulary', 'The meaning of "determination" is:', 'إصرار – عزيمة', 'اختراع', 'نجاح', 'شرف'),
          Q('Vocabulary', 'The meaning of "achievement" is:', 'إنجاز', 'منظمة', 'مسابقة', 'معرض'),
          Q('Vocabulary', 'He is very ___. He can draw, sing and play music.', 'talented', 'junior', 'proud', 'fair'),
          Q('Vocabulary', 'Students showed their projects at the science ___.', 'fair', 'surgeon', 'tool', 'honour'),
          Q('Vocabulary', 'Scientists ___ new ways to treat diseases.', 'develop', 'contribute', 'honour', 'proud'),
          Q('Vocabulary', 'I am ___ of my brother because he won the competition.', 'proud', 'talented', 'junior', 'greatly'),
          Q('Vocabulary', 'The meaning of "worldwide" is:', 'حول العالم', 'بإبداع', 'بطريقة رائعة', 'بنجاح'),
          C('Vocabulary', 'Match the word with its meaning:', ['يخترع', 'يساهم', 'يحسّن', 'أداة'], [['invent', 0], ['contribute', 1], ['improve', 2], ['tool', 3]])
        ]),
        L2('l2', 'Grammar 1: Present Perfect', 'المضارع التام', [
          Q('Grammar', 'She ___ just finished her project.', 'has', 'have', 'is', 'did'),
          Q('Grammar', 'They ___ already visited the Scientific Centre.', 'have', 'has', 'are', 'was'),
          Q('Grammar', 'I have ___ a new app.', 'invented', 'invent', 'invents', 'inventing'),
          Q('Grammar', 'Have you ever ___ a robot?', 'seen', 'saw', 'see', 'seeing'),
          Q('Grammar', 'He hasn\'t finished his homework ___.', 'yet', 'already', 'just', 'ever'),
          Q('Grammar', 'We have lived in Kuwait ___ ten years.', 'for', 'since', 'ago', 'yet'),
          Q('Grammar', 'She has worked here ___ 2020.', 'since', 'for', 'ago', 'already'),
          Q('Grammar', 'The past participle of "write" is:', 'written', 'wrote', 'writed', 'writing'),
          Q('Grammar', 'The present perfect form is:', 'have / has + past participle (V3)', 'was / were + V-ing', 'did + V1', 'will + V1')
        ]),
        L2('l3', 'Grammar 2: Question Tag (Past Simple)', 'السؤال الذيلي', [
          Q('Grammar', 'He invented a new tool, ___?', "didn't he", 'did he', "doesn't he", "wasn't he"),
          Q('Grammar', 'They didn\'t win the competition, ___?', 'did they', "didn't they", 'do they', 'were they'),
          Q('Grammar', 'She visited the fair, ___?', "didn't she", 'did she', "doesn't she", "wasn't she"),
          Q('Grammar', 'You were at the museum, ___?', "weren't you", 'were you', "didn't you", "wasn't you"),
          Q('Grammar', 'It was a great invention, ___?', "wasn't it", 'was it', "didn't it", "isn't it"),
          Q('Grammar', 'The rule of question tags: a positive sentence takes a ___ tag.', 'negative', 'positive', 'future', 'present')
        ])
      ]
    },
    {
      id: 'u3',
      name: 'Unit Three: Healthy Inside, Healthy Outside',
      lessons: [
        L3('l1', 'Vocabulary', 'Healthy Inside, Healthy Outside', [
          Q('Vocabulary', 'Fast food that is not healthy is called ___.', 'junk food', 'wholegrain', 'memory', 'device'),
          Q('Vocabulary', 'Brown bread is made from ___.', 'wholegrain', 'junk food', 'device', 'infographic'),
          Q('Vocabulary', 'The meaning of "stressed" is:', 'مضغوط', 'نشيط', 'بدني', 'خطير'),
          Q('Vocabulary', 'The meaning of "physical" is:', 'بدني', 'منتظم', 'كاف', 'جهاز'),
          Q('Vocabulary', 'Sleep well because it helps your ___.', 'memory', 'device', 'junk food', 'record'),
          Q('Vocabulary', 'Too much screen time can ___ your sleep.', 'affect', 'encourage', 'track', 'chat'),
          Q('Vocabulary', 'Teachers ___ students to eat healthy food.', 'encourage', 'affect', 'chat', 'engage'),
          Q('Vocabulary', 'I use an app to ___ my steps every day.', 'track', 'chat', 'affect', 'face'),
          Q('Vocabulary', 'Drink water ___ of fizzy drinks.', 'instead', 'enough', 'actually', 'frequently'),
          Q('Vocabulary', 'A picture with information and charts is an ___.', 'infographic', 'expert', 'device', 'memory'),
          Q('Vocabulary', 'The meaning of "regular" is:', 'منتظم – معتاد', 'خطير', 'نشيط', 'بالفعل')
        ]),
        L3('l2', 'Grammar 1: Comparatives and Superlatives', 'المقارنة والتفضيل', [
          Q('Grammar', 'An apple is ___ than a burger.', 'healthier', 'healthiest', 'more healthy than', 'the healthiest'),
          Q('Grammar', 'Water is the ___ drink.', 'best', 'better', 'good', 'goodest'),
          Q('Grammar', 'Junk food is ___ than vegetables.', 'worse', 'worst', 'bad', 'badder'),
          Q('Grammar', 'This exercise is ___ than that one.', 'more difficult', 'difficulter', 'most difficult', 'the more difficult'),
          Q('Grammar', 'Ahmad is the ___ student in the class.', 'tallest', 'taller', 'tall', 'most tall'),
          Q('Grammar', 'Kuwait Towers is one of the most ___ landmarks in Kuwait.', 'famous', 'famouser', 'famousest', 'fame'),
          Q('Grammar', 'The comparative of "big" is:', 'bigger', 'biger', 'more big', 'biggest'),
          Q('Grammar', 'The superlative of "happy" is:', 'the happiest', 'the happyest', 'the most happy', 'happier'),
          Q('Grammar', 'Sleeping early is ___ for you than staying up late.', 'better', 'best', 'good', 'well')
        ]),
        L3('l3', 'Grammar 2: Order of Adjectives', 'ترتيب الصفات', [
          Q('Grammar', 'Choose the correct order:', 'a beautiful small red bag', 'a red small beautiful bag', 'a small red beautiful bag', 'a red beautiful small bag'),
          Q('Grammar', 'Choose the correct order:', 'a big old wooden table', 'a wooden old big table', 'an old wooden big table', 'a wooden big old table'),
          Q('Grammar', 'Choose the correct order:', 'a lovely new Kuwaiti dress', 'a Kuwaiti new lovely dress', 'a new Kuwaiti lovely dress', 'a Kuwaiti lovely new dress'),
          Q('Grammar', 'The usual order of adjectives is:', 'opinion – size – age – colour – origin – material', 'colour – size – opinion – age', 'material – opinion – size – colour', 'origin – colour – size – opinion'),
          C('Grammar', 'Classify the adjectives:', ['opinion', 'size', 'colour', 'material'], [['delicious', 0], ['beautiful', 0], ['small', 1], ['huge', 1], ['green', 2], ['blue', 2], ['plastic', 3], ['cotton', 3]])
        ])
      ]
    },
    {
      id: 'u4',
      name: 'Unit Four: Careers and Future Jobs',
      lessons: [
        L4('l1', 'Vocabulary', 'Careers and Future Jobs', [
          Q('Vocabulary', 'A person who writes computer programs is a ___.', 'programmer', 'designer', 'retired', 'mission'),
          Q('Vocabulary', 'A job that you do for a long time is a ___.', 'career', 'planet', 'machine', 'discovery'),
          Q('Vocabulary', 'The meaning of "patience" is:', 'الصبر', 'فرصة', 'مهمة', 'اكتشاف'),
          Q('Vocabulary', 'The meaning of "opportunity" is:', 'فرصة', 'مهنة', 'الصبر', 'كوكب'),
          Q('Vocabulary', 'A person who stopped working because of age is ___.', 'retired', 'programmer', 'designer', 'wildlife'),
          Q('Vocabulary', 'Kuwait plans to ___ a satellite into space.', 'launch', 'appear', 'face', 'require'),
          Q('Vocabulary', 'This job ___ a lot of patience.', 'requires', 'launches', 'appears', 'designs'),
          Q('Vocabulary', 'Scientists study the ___ of Mars.', 'planet', 'career', 'patience', 'mission'),
          Q('Vocabulary', 'Rangers ___ wildlife in the rainforest.', 'protect', 'launch', 'appear', 'require'),
          Q('Vocabulary', 'The meaning of "rapidly" is:', 'بسرعة', 'بطريقة مريحة', 'بكثرة', 'بطريقة لا تصدق'),
          Q('Vocabulary', 'The study and making of robots is called ___.', 'robotics', 'wildlife', 'discovery', 'career')
        ]),
        L4('l2', 'Grammar 1: Past Continuous (when / while / as)', 'الماضي المستمر', [
          Q('Grammar', 'I ___ football when you called me.', 'was playing', 'were playing', 'played', 'am playing'),
          Q('Grammar', 'They ___ TV when the lights went out.', 'were watching', 'was watching', 'watched', 'are watching'),
          Q('Grammar', 'While she ___ , her phone rang.', 'was cooking', 'cooked', 'cooks', 'were cooking'),
          Q('Grammar', 'He was reading ___ his sister was drawing.', 'while', 'when', 'so', 'because'),
          Q('Grammar', 'We were walking home ___ it started to rain.', 'when', 'while', 'as long', 'since'),
          Q('Grammar', 'She ___ sleeping when I arrived.', "wasn't", "weren't", "didn't", "isn't"),
          Q('Grammar', 'The past continuous form is:', 'was / were + V-ing', 'have / has + V3', 'did + V1', 'am / is / are + V-ing'),
          Q('Grammar', 'Choose the correct sentence:', 'As I was walking to school, I saw my friend.', 'As I walked was to school, I saw my friend.', 'As I am walking to school, I saw my friend.', 'As I were walking to school, I saw my friend.')
        ]),
        L4('l3', 'Grammar 2: Passive Voice', 'المبني للمجهول', [
          Q('Grammar', 'Passive: "People speak Arabic in Kuwait."', 'Arabic is spoken in Kuwait.', 'Arabic spoken in Kuwait.', 'Arabic was speak in Kuwait.', 'Arabic is speaking in Kuwait.'),
          Q('Grammar', 'Passive: "The engineer designed the building."', 'The building was designed by the engineer.', 'The building is designed by the engineer.', 'The building designed by the engineer.', 'The building was design by the engineer.'),
          Q('Grammar', 'Passive: "They make cars in this factory."', 'Cars are made in this factory.', 'Cars is made in this factory.', 'Cars were make in this factory.', 'Cars made in this factory.'),
          Q('Grammar', 'The satellite ___ into space last year.', 'was launched', 'is launched', 'launched', 'were launched'),
          Q('Grammar', 'These robots ___ by students every year.', 'are built', 'is built', 'built', 'was built'),
          Q('Grammar', 'The passive voice form is:', 'be (am / is / are / was / were) + past participle (V3)', 'have + V3', 'was / were + V-ing', 'will + V1'),
          Q('Grammar', 'The telephone ___ by Alexander Graham Bell.', 'was invented', 'invented', 'is inventing', 'were invented')
        ])
      ]
    }
  ];

  window.SUBJECTS = window.SUBJECTS || [];
  window.SUBJECTS.push({ id: 'english8', name: 'اللغة الإنجليزية', icon: '🔤', color: '#db2777', grade: 'الصف الثامن', units });
})();
