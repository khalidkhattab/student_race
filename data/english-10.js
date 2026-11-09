/*
  English – Grade 10 – Course 1 (2026–2027)
  Source: English notes (UULA platform) – units and lessons from the table of contents.
*/
(function () {
  const { Q, M, C } = window.QB;
  const L0 = window.QB.L('e10u0'), L1 = window.QB.L('e10u1'), L2 = window.QB.L('e10u2'), L3 = window.QB.L('e10u3'), L4 = window.QB.L('e10u4');

  const units = [
    {
      id: 'u0', name: 'Basics',
      lessons: [
        L0('l1', 'Helping Verbs, Questions and Negatives', 'Basics', [
          Q('Grammar', 'She ___ a student.', 'is', 'are', 'am', 'be'),
          Q('Grammar', '___ they play football every Friday?', 'Do', 'Does', 'Are', 'Is'),
          Q('Grammar', 'Make it negative: He likes fish.', "He doesn't like fish.", "He don't like fish.", "He doesn't likes fish.", "He isn't like fish."),
          Q('Grammar', 'Ask about the word in brackets: She lives in (Salmiya).', 'Where does she live?', 'Where she lives?', 'What does she live?', 'Where do she live?'),
          Q('Grammar', 'We ___ finished our homework.', 'have', 'has', 'is', 'does'),
          Q('Grammar', 'The verb "be" in the past with "I":', 'was', 'were', 'been', 'am')
        ])
      ]
    },
    {
      id: 'u1', name: 'Module 1 – Unit 1: The Science of Nutrition',
      lessons: [
        L1('l1', 'Vocabulary', 'Unit 1 Vocabulary', [
          Q('Vocabulary', 'Food that is good for your health and growth is ___.', 'nutritious', 'tempting', 'affordable', 'notable'),
          Q('Vocabulary', 'A medical condition caused by not eating enough healthy food:', 'malnutrition', 'inflammation', 'involvement', 'organisation'),
          Q('Vocabulary', 'A price that people can pay easily is ___.', 'affordable', 'filling', 'wholesome', 'personalised'),
          Q('Vocabulary', 'A diet designed for one person\'s needs is ___.', 'personalised', 'sustainable', 'notable', 'filling'),
          Q('Vocabulary', 'Food that makes you feel full is ___.', 'filling', 'tempting', 'decisive', 'flowing'),
          Q('Vocabulary', 'Something that can continue without harming the environment is ___.', 'sustainable', 'unnecessary', 'enormous', 'antique'),
          Q('Vocabulary', 'To encourage something to grow or become active:', 'stimulate', 'assign', 'process', 'pledge'),
          Q('Vocabulary', 'A serious promise:', 'pledge', 'evidence', 'contract', 'record')
        ]),
        L1('l2', 'Grammar 1: Present Simple and Adverbs of Frequency', 'Present Simple', [
          Q('Grammar', 'My brother ___ breakfast at 7 o\'clock every day.', 'eats', 'eat', 'is eating', 'eaten'),
          Q('Grammar', 'Choose the correct order:', 'She always drinks water after exercise.', 'She drinks always water after exercise.', 'Always she drinks water after exercise.', 'She drinks water always after exercise.'),
          Q('Grammar', 'Choose the correct order with "be":', 'He is never late.', 'He never is late.', 'Never he is late.', 'He is late never.'),
          Q('Grammar', 'Water ___ at 100°C.', 'boils', 'boil', 'is boiling', 'boiled'),
          C('Grammar', 'Order the adverbs of frequency from most to least:', ['100%', '≈ 50%', '0%'], [['always', 0], ['sometimes', 1], ['never', 2]]),
          Q('Grammar', 'Kuwaitis ___ eat fast food. (= not often)', 'seldom', 'always', 'usually', 'often')
        ]),
        L1('l3', 'Grammar 2: Present Continuous', 'Present Continuous', [
          Q('Grammar', 'Look! The children ___ in the garden now.', 'are playing', 'play', 'plays', 'played'),
          Q('Grammar', 'I ___ for my exam this week.', 'am studying', 'study', 'studies', 'studied'),
          Q('Grammar', 'Which verb is NOT usually used in the continuous form?', 'know', 'eat', 'run', 'cook'),
          Q('Grammar', 'She ___ (not / watch) TV at the moment.', "isn't watching", "doesn't watch", "aren't watching", "not watching")
        ]),
        L1('l4', 'Grammar 3: Order of Adjectives', 'Order of Adjectives', [
          Q('Grammar', 'Choose the correct order:', 'a lovely small red apple', 'a red small lovely apple', 'a small lovely red apple', 'a lovely red small apple'),
          Q('Grammar', 'Choose the correct order:', 'a big old wooden table', 'a wooden old big table', 'an old big wooden table', 'a big wooden old table'),
          Q('Grammar', 'In the order of adjectives, "opinion" comes ___ "size".', 'before', 'after', 'instead of', 'at the end, after')
        ])
      ]
    },
    {
      id: 'u2', name: 'Module 1 – Unit 2: Choices and Change',
      lessons: [
        L2('l1', 'Vocabulary', 'Unit 2 Vocabulary', [
          Q('Vocabulary', 'Not new; used before by someone else:', 'second-hand', 'antique', 'ideal', 'decisive'),
          Q('Vocabulary', 'Another possible choice:', 'alternative', 'combination', 'ambition', 'evidence'),
          Q('Vocabulary', 'To break down naturally (like food waste):', 'decompose', 'stimulate', 'illustrate', 'assign'),
          Q('Vocabulary', 'Very big:', 'enormous', 'narrow', 'rare', 'hidden'),
          Q('Vocabulary', 'Not needed:', 'unnecessary', 'ideal', 'notable', 'filling'),
          Q('Vocabulary', 'Having a strong wish to be successful:', 'ambitious', 'decisive', 'flowing', 'second-hand'),
          Q('Vocabulary', 'Shagaya Park in Kuwait produces ___ energy from the sun and wind.', 'renewable', 'nuclear', 'second-hand', 'antique')
        ]),
        L2('l2', 'Grammar 1: Present Perfect Simple', 'Present Perfect', [
          Q('Grammar', 'They ___ already ___ the project.', 'have / finished', 'has / finished', 'have / finish', 'are / finished'),
          Q('Grammar', 'She has lived in Kuwait ___ 2015.', 'since', 'for', 'ago', 'yet'),
          Q('Grammar', 'We have known each other ___ ten years.', 'for', 'since', 'ago', 'already'),
          Q('Grammar', 'Have you finished your homework ___?', 'yet', 'already', 'since', 'ago'),
          Q('Grammar', 'I ___ never ___ to Japan.', 'have / been', 'has / been', 'have / go', 'am / been')
        ]),
        L2('l3', 'Grammar 2: First Conditional and Modal Verbs', 'First Conditional', [
          Q('Grammar', 'If we recycle more, we ___ less waste.', 'will produce', 'produced', 'would produce', 'produces'),
          Q('Grammar', 'If it ___ tomorrow, we will stay at home.', 'rains', 'will rain', 'rained', 'raining'),
          Q('Grammar', 'You ___ turn off the lights when you leave the room. (advice)', 'should', 'mustn\'t', 'can\'t', 'might not'),
          Q('Grammar', 'Students ___ use mobile phones during the exam. (prohibition)', "mustn't", "don't have to", 'should', 'can'),
          Q('Grammar', 'The first conditional talks about:', 'a real or possible situation in the future', 'an imaginary present situation', 'a past regret', 'a general fact only')
        ])
      ]
    },
    {
      id: 'u3', name: 'Module 2 – Unit 3: Exploring Heritage',
      lessons: [
        L3('l1', 'Vocabulary', 'Unit 3 Vocabulary', [
          Q('Vocabulary', 'Facts or signs that show something is true:', 'evidence', 'ceremony', 'passage', 'identity'),
          Q('Vocabulary', 'To record something in writing or photos:', 'document', 'decompose', 'stimulate', 'assign'),
          Q('Vocabulary', 'A formal event such as a wedding or graduation:', 'ceremony', 'conference', 'contract', 'bridge'),
          Q('Vocabulary', 'A large formal meeting for discussion:', 'conference', 'ceremony', 'passage', 'director'),
          Q('Vocabulary', 'Who you are; the qualities that make a person or nation different:', 'identity', 'creativity', 'translation', 'evidence'),
          Q('Vocabulary', 'Showing deep understanding:', 'insightful', 'mechanical', 'decorative', 'narrow'),
          Q('Vocabulary', 'Not wide:', 'narrow', 'enormous', 'classic', 'automatic')
        ]),
        L3('l2', 'Grammar 1: Non-Defining Relative Clauses', 'Relative Clauses', [
          Q('Grammar', 'Kuwait Towers, ___ were opened in 1979, are a famous landmark.', 'which', 'who', 'that', 'whose'),
          Q('Grammar', 'My grandfather, ___ was a pearl diver, told us many stories.', 'who', 'which', 'that', 'where'),
          Q('Grammar', 'Failaka, ___ ancient Greek ruins were found, is a Kuwaiti island.', 'where', 'which', 'who', 'that'),
          Q('Grammar', 'In non-defining relative clauses we cannot use:', 'that', 'which', 'who', 'whose'),
          Q('Grammar', 'Non-defining relative clauses are separated by:', 'commas', 'full stops', 'question marks', 'nothing')
        ]),
        L3('l3', 'Grammar 2: Past Simple and Past Continuous (when / while / as)', 'Past Continuous', [
          Q('Grammar', 'I ___ dinner when the phone rang.', 'was cooking', 'cooked', 'am cooking', 'cook'),
          Q('Grammar', 'While she ___ , she saw an old friend.', 'was shopping', 'shopped', 'shops', 'is shopping'),
          Q('Grammar', 'When the teacher came in, the students ___ quiet.', 'became', 'were becoming', 'become', 'becomes'),
          Q('Grammar', 'We usually use ___ with the longer action in the past continuous.', 'while', 'when only', 'ago', 'since')
        ])
      ]
    },
    {
      id: 'u4', name: 'Module 2 – Unit 4: Citizenship',
      lessons: [
        L4('l1', 'Vocabulary', 'Unit 4 Vocabulary', [
          Q('Vocabulary', 'To work for free to help others:', 'volunteer', 'symbolise', 'respect', 'educate'),
          Q('Vocabulary', 'A written legal agreement:', 'contract', 'freedom', 'character', 'transformation'),
          Q('Vocabulary', 'Relating to everyone in the world:', 'universal', 'informal', 'rare', 'formal'),
          Q('Vocabulary', 'A complete change:', 'transformation', 'record', 'freedom', 'ceremony'),
          Q('Vocabulary', 'To represent an idea:', 'symbolise', 'volunteer', 'document', 'assign'),
          Q('Vocabulary', 'Very quickly:', 'rapidly', 'patiently', 'continuously', 'culturally')
        ]),
        L4('l2', 'Grammar 1: Reported Speech', 'Reported Speech', [
          Q('Grammar', '"I am tired," she said. → She said that she ___ tired.', 'was', 'is', 'were', 'has been'),
          Q('Grammar', '"We will help," they said. → They said that they ___ help.', 'would', 'will', 'can', 'shall'),
          Q('Grammar', '"I can swim," he said. → He said that he ___ swim.', 'could', 'can', 'may', 'will'),
          Q('Grammar', 'In reported speech "today" usually changes to:', 'that day', 'yesterday', 'tomorrow', 'now'),
          Q('Grammar', '"Where do you live?" he asked. → He asked me where ___.', 'I lived', 'did I live', 'do I live', 'I live')
        ]),
        L4('l3', 'Grammar 2: Future Forms', 'Future Forms', [
          Q('Grammar', 'Look at those dark clouds! It ___ rain.', 'is going to', 'will', 'is raining', 'rains'),
          Q('Grammar', 'The plane ___ at 6:00 tomorrow morning. (timetable)', 'leaves', 'is leaving now', 'left', 'leave'),
          Q('Grammar', 'I think Kuwait ___ the match. (prediction / opinion)', 'will win', 'is winning', 'wins', 'won'),
          Q('Grammar', 'We ___ our grandparents this weekend. (fixed arrangement)', 'are visiting', 'visit', 'visited', 'will visited')
        ]),
        L4('l4', 'Grammar 3: Countable and Uncountable Nouns', 'Countable / Uncountable', [
          C('Grammar', 'Classify the nouns:', ['Countable', 'Uncountable'], [['apple', 0], ['book', 0], ['water', 1], ['information', 1], ['advice', 1], ['chair', 0]]),
          Q('Grammar', 'How ___ sugar do you need?', 'much', 'many', 'few', 'a few'),
          Q('Grammar', 'There are ___ students in the library.', 'a few', 'a little', 'much', 'little'),
          Q('Grammar', 'Can you give me some ___?', 'advice', 'advices', 'an advice', 'many advice')
        ])
      ]
    }
  ];

  window.SUBJECTS = window.SUBJECTS || [];
  window.SUBJECTS.push({ id: 'english10', name: 'اللغة الإنجليزية', icon: '🔤', color: '#4f46e5', grade: 'الصف العاشر', units });
})();
