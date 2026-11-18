/*
  English – Grade 11 Science – Course 1 (2026–2027)
  Source: English notes – Module 1 (Units 1–3) and Module 2 (Units 4–6) from the table of contents.
*/
(function () {
  const { Q, M, C } = window.QB;
  const L0 = window.QB.L('e11su0'), L1 = window.QB.L('e11su1'), L2 = window.QB.L('e11su2');

  const units = [
    {
      id: 'u0', name: 'Basics',
      lessons: [
        L0('l1', 'Helping Verbs, Questions and Negatives', 'Basics', [
          Q('Grammar', 'They ___ waiting for the bus when it started to rain.', 'were', 'was', 'are', 'did'),
          Q('Grammar', 'She ___ written three letters today.', 'has', 'have', 'is', 'did'),
          Q('Grammar', 'Make it negative: "Ahmad loves football."', "Ahmad doesn't love football.", "Ahmad don't love football.", "Ahmad doesn't loves football.", "Ahmad not loves football."),
          Q('Grammar', 'Make it negative: "We saw a horror film."', "We didn't see a horror film.", "We didn't saw a horror film.", "We don't saw a horror film.", "We not saw a horror film."),
          Q('Grammar', 'Question about the underlined part: "My mother walks every morning to lose weight." (Why)', 'Why does my mother walk every morning?', 'Why my mother walks every morning?', 'Why do my mother walk every morning?', 'Why did my mother walks every morning?'),
          Q('Grammar', 'Question: "Last night, the band played the famous song." (What)', 'What did the band play last night?', 'What the band played last night?', 'What does the band play last night?', 'What did the band played last night?'),
          Q('Grammar', 'Ask about the time: "Mona has written 2 books since 2010."', 'Since when has Mona written 2 books?', 'Since when did Mona write 2 books?', 'How long Mona has written 2 books?', 'When has Mona written 2 books?'),
          Q('Grammar', 'After modals (can, must, should…), the verb is always in the ___ form.', 'base (infinitive)', '-ing', 'past', 'past participle'),
          C('Grammar', 'Match each tense with its keyword:', ['Present Simple', 'Past Simple', 'Present Continuous', 'Present Perfect'], [['every week', 0], ['yesterday', 1], ['at the moment', 2], ['already', 3]])
        ])
      ]
    },
    {
      id: 'u1', name: 'Module 1: Festivals, Celebrations & Meeting Places',
      lessons: [
        L1('l1', 'Unit 1: Festivals & Occasions', 'Festivals & Occasions', [
          Q('Vocabulary', '"Dazzling" means:', 'very impressive', 'boring', 'dark', 'small'),
          Q('Vocabulary', 'A big, showy event that is over the top is an:', 'extravaganza', 'canopy', 'vendor', 'discipline'),
          Q('Vocabulary', '"Unrivalled" means:', 'having no equal', 'very weak', 'old-fashioned', 'expensive'),
          Q('Vocabulary', 'A person who sells things in the street is a:', 'vendor', 'meteorologist', 'scribe', 'nomad'),
          Q('Vocabulary', '"Commemorate" means to:', 'remember and honour an event', 'forget', 'hire', 'weave'),
          Q('Vocabulary', '"Exuberant" is closest in meaning to:', 'lively and energetic', 'tired', 'sad', 'quiet'),
          Q('Reading', 'Why is Hala February considered a patriotic event?', 'It coincides with the National and Liberation Days of Kuwait.', 'It is held in summer.', 'It is only for tourists.', 'It is organised by schools.'),
          Q('Reading', 'The Qurain Cultural Festival is organised by:', 'the NCCAL', 'the Ministry of Health', 'a shopping mall', 'the football association'),
          Q('Reading', 'Why are festivals beneficial?', 'They celebrate culture and raise national income through tourism.', 'They make prices go up.', 'They close the shops.', 'They are only for children.'),
          Q('Grammar', 'Despite the traffic, we ___ arrive on time.', 'managed to', 'could', 'can', 'are able'),
          Q('Grammar', 'This mobile phone is ___ new.', 'brand', 'very much', 'a lot', 'too'),
          Q('Grammar', 'Choose the intensifier: "My father got ___ angry."', 'extremely', 'brand', 'much', 'many'),
          C('Vocabulary', 'Match each phrasal verb with its meaning:', ['explode / ring', 'continue', 'increase', 'do without'], [['go off', 0], ['go on', 1], ['go up', 2], ['go without', 3]]),
          Q('Vocabulary', 'Prices often ___ in summer. (decrease)', 'go down', 'go up', 'go off', 'go through'),
          Q('Vocabulary', 'My brother has ___ many difficulties in his life. (experienced)', 'gone through', 'gone off', 'gone out', 'gone against')
        ]),
        L1('l2', 'Unit 2: Family Celebrations', 'Family Celebrations', [
          Q('Vocabulary', 'An important event or stage in life is a:', 'milestone', 'silverware', 'clan', 'roundabout'),
          Q('Vocabulary', '"Touching" means:', 'causing strong feelings of sympathy', 'very funny', 'frightening', 'boring'),
          Q('Vocabulary', '"Reminisce" means to:', 'think about the past with pleasure', 'forget the past', 'plan the future', 'argue'),
          Q('Vocabulary', 'A person who moves from place to place with no fixed home is a:', 'nomad', 'vendor', 'scribe', 'diva'),
          Q('Vocabulary', 'A large family group or tribe is a:', 'clan', 'canopy', 'stadium', 'plaza'),
          Q('Grammar', 'By the time we arrived, the film ___.', 'had started', 'has started', 'starts', 'was start'),
          Q('Grammar', 'I ___ my homework before I watched TV.', 'had finished', 'have finished', 'finish', 'was finished'),
          Q('Grammar', 'Choose the correct inversion: "Hardly ___ the house when it started to rain."', 'had I left', 'I had left', 'did I left', 'I left'),
          Q('Grammar', 'No sooner ___ arrived than the meeting began.', 'had she', 'she had', 'has she', 'did she'),
          Q('Grammar', 'The past perfect is used for:', 'an action that happened before another past action', 'a habit in the present', 'a future plan', 'an action happening now'),
          Q('Grammar', 'Scarcely had he sat down ___ the phone rang.', 'when', 'than', 'then', 'that'),
          Q('Reading', 'Which of these is an example of a regular family gathering?', 'a diwaniya or a family visit', 'a football match', 'a business meeting', 'a school exam'),
          Q('Reading', 'Why are regular family gatherings important?', 'to catch up, discuss family issues, share feelings and strengthen relationships', 'to sell things to relatives', 'to avoid talking to each other', 'to plan holidays abroad only'),
          Q('Reading', 'Family celebrations are important because they:', 'show support, strengthen relationships and make events memorable', 'cost a lot of money', 'replace school', 'are only for children'),
          Q('Reading', 'To prepare for a celebration, we should first:', 'pick a suitable time and place and decide on the guests', 'buy a new car', 'cancel all plans', 'invite strangers only'),
          Q('Reading', 'A baby shower is a celebration of:', 'welcoming the baby and the parents to parenthood', 'a graduation', 'a wedding anniversary', 'a birthday'),
          Q('Reading', 'Which gift is suitable for a baby shower?', 'a pram', 'a laptop', 'a car', 'a suit'),
          M('Reading', 'Which of these are examples of celebrations?', ['birthdays', 'weddings', 'graduations'], ['quarrels', 'traffic jams'])
        ]),
        L1('l3', 'Unit 3: Meeting Places', 'Meeting Places', [
          Q('Vocabulary', '"Hospitality" means:', 'welcoming and generous treatment of guests', 'a hospital', 'a quarrel', 'a bill'),
          Q('Vocabulary', 'A spice often added to Arabic coffee is:', 'cardamom', 'cocoa', 'silk', 'espresso'),
          Q('Vocabulary', '"Weary" means:', 'very tired', 'very happy', 'very fast', 'very rich'),
          Q('Vocabulary', 'A public square in a town is a:', 'plaza', 'teapot', 'pill', 'socket'),
          Q('Vocabulary', 'To arrange a new time for a meeting is to:', 'reschedule', 'refill', 'import', 'converse'),
          Q('Vocabulary', 'A drink is also called a:', 'beverage', 'fragrance', 'autograph', 'circumstance'),
          Q('Reading', 'A diwaniya is best described as:', 'a traditional meeting place for men to gather and talk', 'a shopping mall', 'a sports stadium', 'a coffee farm'),
          Q('Grammar', 'If it rains tomorrow, we ___ at home.', 'will stay', 'would stay', 'stayed', 'had stayed'),
          Q('Grammar', 'If I had more time, I ___ more books.', 'would read', 'will read', 'read', 'had read'),
          Q('Grammar', 'If you heat ice, it ___.', 'melts', 'will melted', 'would melt', 'melted'),
          Q('Grammar', 'If she had studied, she ___ the exam.', 'would have passed', 'will pass', 'would pass', 'passed'),
          C('Grammar', 'Match each sentence with its conditional type:', ['Zero', 'First', 'Second', 'Third'], [['If you heat water to 100°C, it boils.', 0], ['If I see him, I will tell him.', 1], ['If I were rich, I would travel.', 2], ['If I had known, I would have helped.', 3]]),
          Q('Reading', 'Why do politicians visit diwaniyas?', 'to talk about their campaigns and programmes', 'to buy coffee beans', 'to play games', 'to sell houses'),
          Q('Reading', 'In the past, who used to go to traditional coffee houses?', 'businessmen, writers and politicians', 'only children', 'only tourists', 'only women'),
          Q('Reading', 'What does coffee represent to Kuwaitis?', 'a symbol of hospitality', 'a medicine', 'a luxury for kings only', 'a sign of anger'),
          Q('Reading', 'Why is tea a popular drink?', 'because it helps people relax', 'because it is very expensive', 'because it is cold', 'because it has no taste'),
          Q('Reading', 'In a Kuwaiti home, the host stops refilling the guest’s coffee cup when the guest:', 'tips the empty cup from side to side', 'puts the cup on the floor', 'asks for water', 'stands up'),
          Q('Reading', 'Kuwaiti coffee gets its distinctive fragrance from:', 'cardamom seeds ground with the beans', 'milk and sugar', 'chocolate', 'lemon'),
          Q('Reading', 'Why has coffee spread quickly throughout the world?', 'people loved its taste and the energy it gives', 'it is free everywhere', 'it grows in every country', 'doctors banned tea')
        ])
      ]
    },
    {
      id: 'u2', name: 'Module 2: Communicating, Writing & On the Phone',
      lessons: [
        L2('l1', 'Unit 4: Communicating', 'Communicating', [
          Q('Vocabulary', '"Empathy" means:', 'the ability to understand and share others’ feelings', 'anger', 'illiteracy', 'distraction'),
          Q('Vocabulary', 'The person you are talking with is your:', 'interlocutor', 'accountant', 'diva', 'usher'),
          Q('Vocabulary', 'Not being able to read or write is:', 'illiteracy', 'capacity', 'assumption', 'adjustment'),
          Q('Vocabulary', '"Meticulously" means:', 'very carefully', 'quickly', 'harshly', 'rarely'),
          Q('Vocabulary', '"Courteous" means:', 'polite', 'rude', 'lazy', 'noisy'),
          Q('Vocabulary', '"Enhance" means to:', 'improve', 'reduce', 'insult', 'block out'),
          Q('Grammar', '___ Ali ___ Omar went to the party; they both stayed home.', 'Neither / nor', 'Either / or', 'Both / and', 'Not only / but also'),
          Q('Grammar', 'She speaks not only English ___ French.', 'but also', 'and also', 'or', 'nor'),
          Q('Grammar', 'You can have ___ tea ___ coffee, not both.', 'either / or', 'neither / nor', 'both / and', 'not only / but'),
          Q('Grammar', 'I saw ___ elephant at the zoo.', 'an', 'a', 'the', 'no article'),
          Q('Grammar', '___ sun rises in the east.', 'The', 'A', 'An', 'No article'),
          Q('Grammar', 'How ___ money do you need?', 'much', 'many', 'few', 'a few'),
          Q('Grammar', 'How ___ books did you read?', 'many', 'much', 'little', 'a little'),
          Q('Grammar', 'There is ___ milk left; we need to buy more.', 'little', 'few', 'many', 'a few'),
          Q('Grammar', 'I stayed at home ___ it was raining.', 'because', 'although', 'unless', 'but'),
          Q('Grammar', '___ he was tired, he finished his work.', 'Although', 'Because', 'So', 'Unless'),
          Q('Reading', 'In the past, people communicated using:', 'pigeons, fire, bottles and letters', 'social media and text messages', 'video calls', 'emails'),
          Q('Reading', 'Compared with the past, communication nowadays is:', 'instant and less expensive', 'slower and more expensive', 'impossible', 'only by letters'),
          Q('Reading', 'Why do people communicate?', 'to share ideas and feelings, pass information, get business done and solve problems', 'only to argue', 'to waste time', 'to avoid others'),
          Q('Reading', 'To communicate effectively, you should:', 'listen carefully, keep eye contact and never interrupt', 'interrupt often and judge quickly', 'look at your watch', 'give too much information'),
          M('Reading', 'Which things hinder communication?', ['assumptions', 'yawning or looking at your watch', 'passive listening', 'being defensive'], ['keeping eye contact', 'listening with empathy']),
          Q('Reading', 'According to the text, a major source of communication problems is:', 'defensiveness', 'empathy', 'eye contact', 'paraphrasing'),
          Q('Reading', 'Being a good and patient listener helps you to:', 'see the world through the eyes of others and increase empathy', 'win every argument', 'talk more than others', 'avoid people'),
          Q('Reading', 'A good listener should be:', 'trustworthy, a secret-keeper and compassionate', 'judgmental and impatient', 'controlling', 'silent and uninterested'),
          Q('Reading', 'The proverb "Listen or your tongue will keep you deaf" means:', 'if you talk too much you will never learn from others', 'talking makes you deaf', 'never speak at all', 'listening is harmful')
        ]),
        L2('l2', 'Unit 5: Writing', 'Writing', [
          Q('Vocabulary', 'The ancient wedge-shaped writing system of Mesopotamia is:', 'cuneiform', 'hieroglyphics', 'ballpoint', 'calligraphy'),
          Q('Vocabulary', 'The ancient Egyptian picture writing is:', 'hieroglyphics', 'cuneiform', 'weblog', 'notepad'),
          Q('Vocabulary', 'A person who copied documents by hand in the past was a:', 'scribe', 'diva', 'nomad', 'vendor'),
          Q('Vocabulary', '"Quotidian" means:', 'daily, ordinary', 'precious', 'ancient', 'financial'),
          Q('Vocabulary', 'Being unable to think of what to write is called:', "writer's block", 'tryout', 'falloff', 'contribution'),
          Q('Vocabulary', '"Inscribe" means to:', 'carve or write words on a surface', 'erase', 'publish', 'dominate'),
          Q('Grammar', 'I ___ this book three times.', 'have read', 'has read', 'had read', 'am reading'),
          Q('Grammar', 'She ___ English for five years and still studies it.', 'has been learning', 'had learned', 'learns', 'learned'),
          Q('Grammar', 'They have lived here ___ 2015.', 'since', 'for', 'ago', 'yet'),
          Q('Grammar', 'He has worked here ___ ten years.', 'for', 'since', 'ago', 'already'),
          Q('Grammar', 'Have you finished your homework ___?', 'yet', 'already', 'since', 'ago'),
          Q('Grammar', 'The Present Perfect Continuous is formed with:', 'have/has been + verb-ing', 'had + V3', 'have/has + V3', 'was/were + verb-ing'),
          Q('Reading', 'Writing is a way of communicating that was developed:', 'by ancient people thousands of years ago', 'in the last century', 'by computers', 'by the Romans only'),
          Q('Reading', 'Pictograms were used because:', 'letters had not yet been invented', 'paper was cheap', 'people could not see well', 'they were faster than letters'),
          Q('Reading', 'How many letters does the Arabic alphabet have?', '28', '26', '24', '30'),
          Q('Reading', 'Arabic is written:', 'from right to left', 'from left to right', 'from top to bottom', 'in circles'),
          Q('Reading', 'The Arabic alphabet is the ___ most widely used alphabet in the world.', 'second', 'first', 'third', 'fifth'),
          Q('Reading', 'People have been using the written form of Arabic since:', 'the 4th century CE', 'the 20th century', 'the 10th century BCE', 'last year'),
          M('Reading', 'The Arabic script is also the basis of:', ['Malay (Jawi)', 'Urdu', 'Turkish (old script)'], ['English', 'Chinese']),
          Q('Reading', 'Writing is more useful than speaking because:', 'you can keep information longer and revise it before sending', 'it is always faster', 'nobody can read it', 'it needs no tools')
        ]),
        L2('l3', 'Unit 6: On the Phone', 'On the Phone', [
          Q('Vocabulary', 'To look through information on the internet is to:', 'browse', 'paste', 'press', 'hike'),
          Q('Vocabulary', 'A list of things to discuss at a meeting is an:', 'agenda', 'usher', 'modem', 'sibling'),
          Q('Vocabulary', '"Beforehand" means:', 'in advance', 'afterwards', 'never', 'lately'),
          Q('Vocabulary', 'A brother or sister is a:', 'sibling', 'clan', 'nomad', 'scribe'),
          Q('Vocabulary', '"Notify" means to:', 'inform', 'forget', 'reclaim', 'customize'),
          Q('Vocabulary', 'An online diary is a:', 'weblog', 'phone book', 'calendar', 'notepad'),
          Q('Grammar', 'She is a doctor, ___?', "isn't she", 'is she', "doesn't she", "wasn't she"),
          Q('Grammar', "They didn't come, ___?", 'did they', "didn't they", 'do they', 'were they'),
          Q('Grammar', 'You can swim, ___?', "can't you", 'can you', "don't you", 'do you'),
          Q('Grammar', 'I am late, ___?', "aren't I", "am not I", "isn't I", 'am I'),
          Q('Grammar', "Let's go to the park, ___?", 'shall we', "don't we", 'will you', "won't we"),
          Q('Grammar', 'Choose the imperative sentence:', 'Close the door, please.', 'She closes the door.', 'Did you close the door?', 'The door is closed.'),
          Q('Grammar', 'The negative imperative of "Touch the wire" is:', "Don't touch the wire.", 'Not touch the wire.', "Doesn't touch the wire.", 'Not to touch the wire.'),
          Q('Reading', 'Phones are important because they help us to:', 'call for help in emergencies and communicate instantly', 'stop meeting people', 'waste money', 'avoid work'),
          M('Reading', 'Which are uses of mobile phones mentioned in the text?', ['scheduling appointments', 'checking emails', 'taking pictures', 'writing notes'], ['cooking food', 'driving cars']),
          Q('Reading', 'A disadvantage of phones is that some games and applications:', 'consume time and money and can make people anti-social', 'make people healthier', 'are always free', 'improve sleep'),
          Q('Reading', 'Before replacing an old phone with a new one, we should:', 'format it, then sell or recycle it', 'throw it in the sea', 'give it away with our data on it', 'break it')
        ])
      ]
    }
  ];

  window.SUBJECTS.push({ id: 'english11s', name: 'اللغة الإنجليزية', icon: '🔤', color: '#4f46e5', grade: 'الصف الحادي عشر علمي', units });
})();
