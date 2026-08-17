export const GP_SESSIONS = [
  { n: 1, title: "Fix the Paragraph", meta: "Punctuation · drag-and-drop", act: "fix", content: "para1" },
  { n: 2, title: "Find the Nouns", meta: "Nouns · floating-word game", act: "game", content: "noun" },
  { n: 3, title: "What's Wrong?", meta: "Correction · 10 questions", act: "mc", content: "correct1" },
  { n: 4, title: "Comprehension 1", meta: "Short story · 6 questions", act: "comp", content: "passage1" },
  { n: 5, title: "Find the Verbs", meta: "Verbs · floating-word game", act: "game", content: "verb" },
  { n: 6, title: "When Did It Happen?", meta: "Tense · selector", act: "tense", content: "tense1" },
  { n: 7, title: "Write a Sentence", meta: "Construction · writing", act: "write", content: "write1" },
  { n: 8, title: "Find the Adjectives", meta: "Adjectives · floating-word", act: "game", content: "adjective" },
  { n: 9, title: "Comprehension 2", meta: "Folktale · 6 questions", act: "comp", content: "passage2" },
  { n: 10, title: "Change the Tense", meta: "Tense · multiple choice", act: "mc", content: "tense2" },
  { n: 11, title: "Fix the Paragraph II", meta: "Punctuation · drag-and-drop", act: "fix", content: "para2" },
  { n: 12, title: "Find the Pronouns", meta: "Pronouns · floating-word", act: "game", content: "pronoun" },
  { n: 13, title: "Sentence or Not?", meta: "Fragments · binary choice", act: "binary", content: "frag1" },
  { n: 14, title: "Comprehension 3", meta: "Non-fiction · 6 questions", act: "comp", content: "passage3" },
  { n: 15, title: "Find the Adverbs", meta: "Adverbs · floating-word", act: "game", content: "adverb" },
  { n: 16, title: "Write It in Another Tense", meta: "Tense · sentence rewrite", act: "rewrite", content: "rewrite1" },
  { n: 17, title: "Find the Conjunctions", meta: "Conjunctions · floating-word", act: "game", content: "conjunction" },
  { n: 18, title: "Join the Sentences", meta: "Compound · drag-and-drop", act: "join", content: "join1" },
  { n: 19, title: "Comprehension 4", meta: "Narrative · 6–8 questions", act: "comp", content: "passage4" },
  { n: 20, title: "Find the Prepositions", meta: "Prepositions · floating-word", act: "game", content: "preposition" },
  { n: 21, title: "Who Did What?", meta: "Subject + verb · highlight", act: "select", content: "subverb1" },
  { n: 22, title: "Fix the Sentence II", meta: "Mixed review · 10 questions", act: "mc", content: "mixed1" },
  { n: 23, title: "Make It Better", meta: "Expansion · builder", act: "build", content: "expand1" },
  { n: 24, title: "Comprehension Challenge", meta: "Mixed · 10–12 questions", act: "comp", content: "passage5" },
  { n: 25, title: "Grammar Challenge", meta: "Review · mixed mini-games", act: "mixed", content: "review1" }
];

export const GP_LESSON_INTROS = {
  compare: {
    term: "Compare and contrast",
    definition: "To compare and contrast is to notice how two things are the same and how they are different.",
    examples: [
      "Smoke is calm, but Willow is lively.",
      "Both ponies enjoy carrots.",
      "One horse waits at the gate, while the other hides behind the shed."
    ],
    audioText: "Compare and contrast means you look for ways things are alike and ways they are different. Both ponies might like carrots, so that is something the same. One pony might be calm while the other is lively, so that is something different. In this session you will use clues from the passage to compare ideas clearly."
  },
  purpose: {
    term: "Author's purpose",
    definition: "Author's purpose means the reason the writer made the text.",
    examples: [
      "A writer may explain how something works.",
      "A writer may tell a story to entertain you.",
      "A writer may persuade you to think or act in a certain way."
    ],
    audioText: "Author's purpose means the reason the writer wrote the text. A writer might want to explain, entertain, or persuade. When you look for the author's purpose, ask yourself what the whole passage is trying to do for the reader."
  }
};

export const GP_TERMS = {
  noun: {
    term: "Noun",
    definition: "A noun names a person, a place, a thing or an idea.",
    examples: ["The rider opened the gate.", "Her saddle sat on the rail.", "Courage helped her try again."],
    audioText: "A noun names a person, a place, a thing or an idea. Rider is a noun. Gate is a noun. Courage is a noun, even though you cannot touch it. In this game you will tap only the nouns.",
    instruction: "Tap the nouns",
    rounds: [
      [["horse", 1], ["quickly", 0], ["saddle", 1], ["jumped", 0], ["barn", 1], ["softly", 0], ["rider", 1], ["field", 1]],
      [["paddock", 1], ["carefully", 0], ["halter", 1], ["green", 0], ["fence", 1], ["trotted", 0], ["groom", 1], ["bucket", 1]],
      [["courage", 1], ["gently", 0], ["freedom", 1], ["brave", 0], ["silence", 1], ["eagerly", 0], ["journey", 1], ["kindness", 1]]
    ]
  },
  verb: {
    term: "Verb",
    definition: "A verb tells you what someone or something does.",
    examples: ["The pony trots to the gate.", "She lifted the saddle.", "They will ride at dawn."],
    audioText: "A verb tells you what someone or something does. Trots is a verb. Lifted is a verb. Will ride is a verb group. In this game you will tap only the verbs.",
    instruction: "Tap the verbs",
    rounds: [
      [["gallops", 1], ["saddle", 0], ["brushed", 1], ["barn", 0], ["jumps", 1], ["quiet", 0], ["feeds", 1], ["climbed", 1]],
      [["arrived", 1], ["paddock", 0], ["whinnied", 1], ["muddy", 0], ["carried", 1], ["gate", 0], ["trotted", 1], ["listened", 1]],
      [["hesitated", 1], ["gentle", 0], ["remembered", 1], ["patient", 0], ["balanced", 1], ["proudly", 0], ["encouraged", 1], ["struggled", 1]]
    ]
  },
  adjective: {
    term: "Adjective",
    definition: "An adjective describes a noun.",
    examples: ["The grey pony waited by the gate.", "She held the heavy saddle.", "A nervous horse needs a calm rider."],
    audioText: "An adjective describes a noun. Grey tells us about the pony. Heavy tells us about the saddle. Calm tells us about the rider. In this game you will tap only the adjectives.",
    instruction: "Tap the adjectives",
    rounds: [
      [["grey", 1], ["galloped", 0], ["heavy", 1], ["saddle", 0], ["nervous", 1], ["carefully", 0], ["calm", 1], ["barn", 0]],
      [["wooden", 1], ["halter", 0], ["muddy", 1], ["trotted", 0], ["striped", 1], ["quietly", 0], ["sleepy", 1], ["paddock", 0]],
      [["patient", 1], ["arrived", 0], ["restless", 1], ["bucket", 0], ["fragile", 1], ["softly", 0], ["curious", 1], ["journey", 0]]
    ]
  },
  pronoun: {
    term: "Pronoun",
    definition: "A pronoun takes the place of a noun.",
    examples: ["Nina brushed Smoke, then she fed him.", "They opened the gate together."],
    audioText: "A pronoun takes the place of a noun. She can stand for Nina. Him can stand for Smoke. They can stand for more than one person. In this game you will tap only the pronouns.",
    instruction: "Tap the pronouns",
    rounds: [
      [["she", 1], ["Nina", 0], ["him", 1], ["horse", 0], ["they", 1], ["gate", 0], ["we", 1], ["bucket", 0]],
      [["it", 1], ["saddle", 0], ["he", 1], ["trotted", 0], ["them", 1], ["paddock", 0], ["you", 1], ["halter", 0]],
      [["someone", 1], ["journey", 0], ["herself", 1], ["carefully", 0], ["nobody", 1], ["barn", 0], ["everything", 1], ["whinnied", 0]]
    ]
  },
  adverb: {
    term: "Adverb",
    definition: "An adverb usually tells how, when, or where something happens.",
    examples: ["The pony moved slowly.", "She checked the gate carefully."],
    audioText: "An adverb often tells how, when, or where something happens. Slowly tells how the pony moved. Carefully tells how she checked the gate. In this game you will tap only the adverbs.",
    instruction: "Tap the adverbs",
    rounds: [
      [["slowly", 1], ["pony", 0], ["carefully", 1], ["saddle", 0], ["quietly", 1], ["gate", 0], ["softly", 1], ["halter", 0]],
      [["bravely", 1], ["trotted", 0], ["suddenly", 1], ["field", 0], ["patiently", 1], ["rider", 0], ["neatly", 1], ["barn", 0]],
      [["gracefully", 1], ["journey", 0], ["steadily", 1], ["bucket", 0], ["anxiously", 1], ["arrived", 0], ["warmly", 1], ["paddock", 0]]
    ]
  },
  conjunction: {
    term: "Conjunction",
    definition: "A conjunction joins words or ideas together.",
    examples: ["Nina waited and Smoke watched.", "She was nervous but determined."],
    audioText: "A conjunction joins words or ideas together. And links two ideas. But shows a contrast. Because gives a reason. In this game you will tap only the conjunctions.",
    instruction: "Tap the conjunctions",
    rounds: [
      [["and", 1], ["bucket", 0], ["but", 1], ["slowly", 0], ["or", 1], ["rider", 0], ["because", 1], ["gate", 0]],
      [["so", 1], ["saddle", 0], ["if", 1], ["quietly", 0], ["while", 1], ["barn", 0], ["unless", 1], ["halter", 0]],
      [["although", 1], ["journey", 0], ["since", 1], ["trotted", 0], ["whereas", 1], ["paddock", 0], ["until", 1], ["carefully", 0]]
    ]
  },
  preposition: {
    term: "Preposition",
    definition: "A preposition shows position, direction, or time.",
    examples: ["The halter hung on the post.", "Smoke walked through the gate."],
    audioText: "A preposition shows position, direction, or time. On tells us where the halter hung. Through tells us how Smoke moved. In this game you will tap only the prepositions.",
    instruction: "Tap the prepositions",
    rounds: [
      [["under", 1], ["galloped", 0], ["behind", 1], ["bucket", 0], ["through", 1], ["carefully", 0], ["beside", 1], ["pony", 0]],
      [["between", 1], ["halter", 0], ["beneath", 1], ["quietly", 0], ["toward", 1], ["field", 0], ["into", 1], ["rider", 0]],
      [["across", 1], ["journey", 0], ["among", 1], ["arrived", 0], ["within", 1], ["saddle", 0], ["onto", 1], ["softly", 0]]
    ]
  }
};

export const GP_MC = {
  correct1: [
    { s: "my brother rides on saturdays.", opts: ["Missing capital letter", "Missing full stop", "Missing question mark"], a: 0, skill: "capitals", why: "Names and the first word of a sentence need a capital: My brother." },
    { s: "Where did you leave the halter", opts: ["Missing comma", "Missing question mark", "Missing capital letter"], a: 1, skill: "end-punctuation", why: "A question ends with a question mark." },
    { s: "The horses is in the paddock.", opts: ["Subject and verb do not agree", "Missing full stop", "Missing apostrophe"], a: 0, skill: "sv-agreement", why: "Horses is plural, so the verb is are." },
    { s: "Because the gate was open.", opts: ["Run-on sentence", "Sentence fragment", "Missing comma"], a: 1, skill: "fragments", why: "This is only part of a sentence. It has no main idea." },
    { s: "The ponys water bucket was empty.", opts: ["Missing apostrophe", "Missing comma", "Missing capital letter"], a: 0, skill: "apostrophes", why: "The bucket belongs to the pony: pony's." },
    { s: "After we finished we cleaned the tack.", opts: ["Missing apostrophe", "Missing comma", "Missing full stop"], a: 1, skill: "commas", why: "A comma goes after the opening part: After we finished, we…" },
    { s: "She a good rider.", opts: ["Missing verb", "Missing capital letter", "Missing question mark"], a: 0, skill: "construction", why: "The sentence needs a verb: She is a good rider." },
    { s: "i fed the horses then i swept the aisle.", opts: ["Missing question mark", "Capital letters missing", "Missing apostrophe"], a: 1, skill: "capitals", why: "The word I is always a capital, and so is the first word." },
    { s: "We rode all morning we were tired.", opts: ["Run-on sentence", "Sentence fragment", "Missing apostrophe"], a: 0, skill: "fragments", why: "Two complete ideas are joined with nothing. Use a full stop or and so." },
    { s: "The saddle belong to Maya.", opts: ["Missing comma", "Subject and verb do not agree", "Missing capital letter"], a: 1, skill: "sv-agreement", why: "One saddle, so the verb is belongs." }
  ],
  tense2: [
    { s: "Change to the past tense: She rides to the arena.", opts: ["She ride to the arena.", "She rode to the arena.", "She will ride to the arena."], a: 1, skill: "tense", why: "Rides changes to rode in the past tense." },
    { s: "Change to the future tense: We cleaned the tack room.", opts: ["We clean the tack room.", "We were cleaning the tack room.", "We will clean the tack room."], a: 2, skill: "tense", why: "Will clean shows the future." },
    { s: "Change to the present tense: The mare waited by the gate.", opts: ["The mare waits by the gate.", "The mare will wait by the gate.", "The mare waiting by the gate."], a: 0, skill: "tense", why: "Waited changes to waits in the present tense." },
    { s: "Change to the future tense: Liam brushes the pony.", opts: ["Liam will brush the pony.", "Liam brushed the pony.", "Liam brushing the pony."], a: 0, skill: "tense", why: "Will brush points forward in time." },
    { s: "Change to the past tense: They are filling the buckets.", opts: ["They were filling the buckets.", "They fill the buckets.", "They will fill the buckets."], a: 0, skill: "tense", why: "Are filling changes to were filling in the past." },
    { s: "Change to the present tense: I will open the stable door.", opts: ["I opening the stable door.", "I open the stable door.", "I opened the stable door."], a: 1, skill: "tense", why: "Open is the present form." },
    { s: "Change to the past tense: The horses wait near the rail.", opts: ["The horses waited near the rail.", "The horses waits near the rail.", "The horses will wait near the rail."], a: 0, skill: "tense", why: "Wait changes to waited in the past." },
    { s: "Change to the future tense: Mia checks the girth.", opts: ["Mia checked the girth.", "Mia is checking the girth.", "Mia will check the girth."], a: 2, skill: "tense", why: "Will check is the future form." },
    { s: "Change to the present tense: The pony trotted across the yard.", opts: ["The pony will trot across the yard.", "The pony trots across the yard.", "The pony trotting across the yard."], a: 1, skill: "tense", why: "Trotted changes to trots in the present tense." },
    { s: "Change to the past tense: I am carrying the saddle.", opts: ["I was carrying the saddle.", "I carry the saddle.", "I will carry the saddle."], a: 0, skill: "tense", why: "Am carrying changes to was carrying in the past." }
  ],
  mixedPool: [
    { s: "yesterday we clean the stalls.", opts: ["Wrong tense", "Missing comma", "Missing apostrophe"], a: 0, skill: "tense", why: "Yesterday calls for the past tense: cleaned." },
    { s: "The bridle were on the hook.", opts: ["Missing capital letter", "Subject and verb do not agree", "Missing full stop"], a: 1, skill: "sv-agreement", why: "One bridle needs was." },
    { s: "after the lesson, Maya washed the saddle.", opts: ["Capital letter missing", "Missing apostrophe", "Sentence fragment"], a: 0, skill: "capitals", why: "The first word should be After." },
    { s: "Because the rain started.", opts: ["Sentence fragment", "Missing comma", "Wrong pronoun"], a: 0, skill: "fragments", why: "This does not finish a full idea." },
    { s: "The foals tail was tangled.", opts: ["Missing conjunction", "Missing apostrophe", "Wrong preposition"], a: 1, skill: "apostrophes", why: "The tail belongs to the foal: foal's." },
    { s: "We packed the feed, but forgot the buckets.", opts: ["Missing subject in the second part", "Missing question mark", "Wrong tense"], a: 0, skill: "construction", why: "The second part needs a subject: but we forgot…" },
    { s: "He opened the gate then he waved us through.", opts: ["Missing comma after then", "Run-on sentence", "Missing capital letter"], a: 1, skill: "fragments", why: "Two complete ideas are joined too loosely." },
    { s: "The rider and the pony was ready.", opts: ["Subject and verb do not agree", "Missing apostrophe", "Missing adjective"], a: 0, skill: "sv-agreement", why: "Rider and pony means more than one, so the verb is were." },
    { s: "I found the gloves under the bench and the crop beside the wall.", opts: ["Wrong pronoun", "Wrong preposition", "Missing comma"], a: 1, skill: "prepositions", why: "Under and beside are the location words in the sentence." },
    { s: "Her saddle is old but comfortable.", opts: ["Missing conjunction", "Missing adjective", "No error"], a: 2, skill: "conjunctions", why: "But joins two describing ideas correctly, and the sentence is already complete." },
    { s: "The careful rider spoke softly to the mare.", opts: ["No error", "Missing apostrophe", "Sentence fragment"], a: 0, skill: "adverbs", why: "Softly is an adverb and the sentence is correct." },
    { s: "Them brushed the pony before dinner.", opts: ["Wrong pronoun", "Wrong tense", "Missing comma"], a: 0, skill: "pronouns", why: "Them should be They here." },
    { s: "The pony waited patiently by the gate.", opts: ["No error", "Missing conjunction", "Missing apostrophe"], a: 0, skill: "adverbs", why: "Patiently is used correctly and the sentence works." },
    { s: "The rider wore a blue helmet and a striped scarf.", opts: ["No error", "Wrong preposition", "Sentence fragment"], a: 0, skill: "adjectives", why: "Blue and striped describe the nouns correctly." },
    { s: "The halter hung behind the stable door.", opts: ["Wrong pronoun", "No error", "Missing capital letter"], a: 1, skill: "prepositions", why: "Behind is a clear preposition and the sentence is correct." }
  ]
};

export const GP_TENSE = {
  tense1: [
    { s: "Yesterday we rode to the creek.", a: 0, why: "Yesterday and rode both point to the past." },
    { s: "The farrier is trimming her hooves.", a: 1, why: "Is trimming is happening right now." },
    { s: "Next week I will ride in the arena.", a: 2, why: "Next week and will ride point forward." },
    { s: "She feeds the ponies every morning.", a: 1, why: "This happens regularly, so it is present." },
    { s: "The float broke down on the highway.", a: 0, why: "Broke is the past form of break — no time words needed." },
    { s: "They are going to build a round yard.", a: 2, why: "Are going to shows something not done yet." },
    { s: "I swept the aisle and filled the buckets.", a: 0, why: "Swept and filled are both past forms." },
    { s: "He waits by the gate for his hay.", a: 1, why: "Waits describes what happens now." },
    { s: "We shall enter the jumping class.", a: 2, why: "Shall enter points to a future event." },
    { s: "The mare stood very still.", a: 0, why: "Stood is the past form of stand." }
  ]
};

export const GP_FIX = {
  para1: {
    tokens: [
      { t: "my", slot: "cap1", need: "cap" },
      { t: "pony" }, { t: "is" }, { t: "called" }, { t: "Willow" },
      { slot: "end1", need: "end" },
      { t: "She" }, { t: "lives" }, { t: "in" }, { t: "the" }, { t: "back" }, { t: "paddock" },
      { slot: "end2", need: "end" },
      { t: "When" }, { t: "I" }, { t: "call" }, { t: "her" },
      { slot: "comma1", need: "comma" },
      { t: "she" }, { t: "walks" }, { t: "to" }, { t: "the" }, { t: "gate" },
      { slot: "end3", need: "end" }
    ],
    chips: [
      { k: "cap", label: "Capital letter", skill: "capitals" },
      { k: "end", label: "Full stop .", skill: "end-punctuation" },
      { k: "comma", label: "Comma ,", skill: "commas" },
      { k: "apos", label: "Apostrophe '", skill: "apostrophes" }
    ]
  },
  para2: {
    tokens: [
      { t: "on", slot: "cap1", need: "cap" },
      { t: "friday" }, { t: "maya" }, { t: "borrowed" }, { t: "her" },
      { t: "cousins", slot: "apos1", need: "apos", c: "cousin's" },
      { t: "saddle" }, { slot: "comma1", need: "comma" },
      { t: "after" }, { t: "the" }, { t: "lesson" }, { t: "she" }, { t: "cleaned" }, { t: "it" }, { t: "carefully" },
      { slot: "end1", need: "end" },
      { t: "the", slot: "cap2", need: "cap" }, { t: "bridles" }, { t: "buckles" }, { t: "were" }, { t: "muddy" },
      { slot: "end2", need: "end" }
    ],
    chips: [
      { k: "cap", label: "Capital letter", skill: "capitals" },
      { k: "end", label: "Full stop .", skill: "end-punctuation" },
      { k: "comma", label: "Comma ,", skill: "commas" },
      { k: "apos", label: "Apostrophe '", skill: "apostrophes" }
    ]
  }
};

export const GP_BINARY = {
  frag1: [
    { s: "The rider tightened the girth before the lesson.", a: 0, skill: "fragments", why: "It has a subject, a verb, and a complete idea." },
    { s: "Because the gate was still open.", a: 1, skill: "fragments", why: "It starts with because and leaves the main idea unfinished." },
    { s: "We carried the buckets to the paddock.", a: 0, skill: "fragments", why: "This is a full sentence." },
    { s: "After brushing the pony's mane.", a: 1, skill: "fragments", why: "This is only the opening part of a sentence." },
    { s: "The farrier checked each hoof carefully.", a: 0, skill: "fragments", why: "It names who did the action and what happened." },
    { s: "While the rain tapped on the roof.", a: 1, skill: "fragments", why: "It needs a main part to finish the thought." },
    { s: "Mia waved when the float arrived.", a: 0, skill: "fragments", why: "The sentence is complete." },
    { s: "Under the saddle rack near the wall.", a: 1, skill: "fragments", why: "This tells where, but not what happened." },
    { s: "The ponies waited quietly for their feed.", a: 0, skill: "fragments", why: "It has a complete idea." },
    { s: "If the latch slips again.", a: 1, skill: "fragments", why: "It starts a condition but does not finish the sentence." }
  ]
};

export const GP_REWRITE = {
  rewrite1: [
    {
      source: "The pony trots across the yard.",
      target: "Past tense",
      answers: ["The pony trotted across the yard."],
      hint: "Change trots to its past form.",
      why: "Trots changes to trotted in the past tense."
    },
    {
      source: "We cleaned the tack room.",
      target: "Future tense",
      answers: ["We will clean the tack room."],
      hint: "Add a future helper word before clean.",
      why: "Will clean shows the future."
    },
    {
      source: "She will open the gate.",
      target: "Present tense",
      answers: ["She opens the gate."],
      hint: "Remove the future helper and use the present form of the verb.",
      why: "Opens is the present tense form."
    },
    {
      source: "The horses wait by the fence.",
      target: "Past tense",
      answers: ["The horses waited by the fence."],
      hint: "Turn wait into its past form.",
      why: "Wait changes to waited."
    },
    {
      source: "I brushed the mare carefully.",
      target: "Future tense",
      answers: ["I will brush the mare carefully."],
      hint: "Use will with the base verb.",
      why: "Will brush points to the future."
    },
    {
      source: "The rider is checking the girth.",
      target: "Past tense",
      answers: ["The rider was checking the girth."],
      hint: "Keep the action in progress but move it to the past.",
      why: "Is checking changes to was checking."
    }
  ]
};

export const GP_JOIN = {
  join1: [
    { left: "Mia filled the buckets", right: "she carried them to the paddock", opts: ["but", "and", "because"], a: 1, skill: "compound", why: "And joins two actions that both happened." },
    { left: "The mare shied away", right: "the tarp snapped in the wind", opts: ["because", "and", "unless"], a: 0, skill: "compound", why: "Because shows the reason." },
    { left: "We can ride in the arena", right: "we can practise in the round yard", opts: ["or", "under", "quietly"], a: 0, skill: "conjunctions", why: "Or gives a choice." },
    { left: "Luca was tired", right: "he still cleaned the tack", opts: ["but", "into", "before"], a: 0, skill: "conjunctions", why: "But shows a contrast." },
    { left: "The gate was stuck", right: "we pushed together", opts: ["so", "between", "softly"], a: 0, skill: "compound", why: "So shows the result." },
    { left: "The pony twitched his ears", right: "the farrier spoke gently", opts: ["while", "onto", "heavy"], a: 0, skill: "conjunctions", why: "While links two actions happening at the same time." },
    { left: "The rain stopped", right: "we headed back to the trail", opts: ["then", "because", "without"], a: 0, skill: "compound", why: "Then shows what happened next." },
    { left: "You may brush the gelding", right: "you must not open the feed room", opts: ["but", "toward", "patiently"], a: 0, skill: "conjunctions", why: "But links the permission with a warning." },
    { left: "The rope was short", right: "Nina fetched a longer one", opts: ["so", "under", "striped"], a: 0, skill: "compound", why: "So shows the result of the short rope." },
    { left: "The sky darkened", right: "the riders packed up early", opts: ["and", "because", "inside"], a: 1, skill: "compound", why: "Because explains why they packed up early." }
  ]
};

export const GP_SELECT = {
  subverb1: [
    { words: ["The", "rider", "checked", "the", "strap", "carefully."], subject: 1, verb: 2, why: "Rider is doing the action, and checked names the action." },
    { words: ["Smoke", "waited", "near", "the", "gate."], subject: 0, verb: 1, why: "Smoke is the subject, and waited is the verb." },
    { words: ["Her", "friend", "carried", "two", "buckets."], subject: 1, verb: 2, why: "Friend is doing the carrying." },
    { words: ["The", "ponies", "trotted", "across", "the", "yard."], subject: 1, verb: 2, why: "Ponies is the subject, and trotted is the action." },
    { words: ["Maya", "opened", "the", "stable", "door."], subject: 0, verb: 1, why: "Maya is the subject and opened is the verb." },
    { words: ["The", "halter", "hung", "behind", "the", "post."], subject: 1, verb: 2, why: "Halter is the thing in the sentence, and hung tells what it did." }
  ]
};

export const GP_BUILD = {
  expand1: [
    {
      base: "The pony waited.",
      template: "The {{0}} pony waited {{1}}.",
      groups: [
        { label: "Choose a describing word", opts: ["small", "between", "washed"], a: 0 },
        { label: "Choose an extra detail", opts: ["quietly by the gate", "without saddle", "because"], a: 0 }
      ],
      why: "A good sentence expansion adds clear detail without breaking the sentence."
    },
    {
      base: "Luca brushed the horse.",
      template: "Luca {{0}} brushed the {{1}} horse.",
      groups: [
        { label: "Choose an adverb", opts: ["carefully", "under", "helmet"], a: 0 },
        { label: "Choose an adjective", opts: ["muddy", "through", "jumped"], a: 0 }
      ],
      why: "Carefully tells how Luca brushed, and muddy describes the horse."
    },
    {
      base: "We walked back.",
      template: "We walked back {{0}} {{1}}.",
      groups: [
        { label: "Choose a place phrase", opts: ["through the yard", "curious", "and"], a: 0 },
        { label: "Choose a time phrase", opts: ["after the lesson", "bucket", "waited"], a: 0 }
      ],
      why: "The extra phrases tell where and when the action happened."
    },
    {
      base: "The farrier spoke.",
      template: "The {{0}} farrier spoke {{1}}.",
      groups: [
        { label: "Choose an adjective", opts: ["patient", "onto", "trotted"], a: 0 },
        { label: "Choose an adverb", opts: ["calmly", "saddle", "under"], a: 0 }
      ],
      why: "Patient describes the farrier, and calmly tells how he spoke."
    }
  ]
};

export const GP_REVIEW = {
  review1: {
    items: [
      { kind: "choice", prompt: "Choose the sentence with the correct pronoun.", opts: ["Them carried the bucket.", "They carried the bucket.", "They carries the bucket."], a: 1, skill: "pronouns", why: "They is the correct subject pronoun here." },
      { kind: "choice", prompt: "Which word is a conjunction?", opts: ["softly", "because", "saddle"], a: 1, skill: "conjunctions", why: "Because joins one idea to another." },
      { kind: "choice", prompt: "Pick the sentence in the future tense.", opts: ["We cleaned the tack room.", "We clean the tack room.", "We will clean the tack room."], a: 2, skill: "tense", why: "Will clean is the future form." },
      { kind: "binary", prompt: "Is this a complete sentence or a fragment?", sentence: "After the horse crossed the creek.", opts: ["Complete sentence", "Fragment"], a: 1, skill: "fragments", why: "It still needs a main idea to finish the thought." },
      { kind: "choice", prompt: "Which word is a preposition?", opts: ["behind", "quietly", "careful"], a: 0, skill: "prepositions", why: "Behind shows position." },
      { kind: "choice", prompt: "Which sentence uses an adjective correctly?", opts: ["The quietly pony waited.", "The grey pony waited.", "The pony grey waited."], a: 1, skill: "adjectives", why: "Grey describes the pony in the right place." },
      { kind: "choice", prompt: "Which sentence is joined well?", opts: ["The gate stuck because we pushed together.", "The gate stuck, and we pushed together.", "The gate stuck but we pushed together."], a: 1, skill: "compound", why: "The two ideas are joined clearly with and." }
    ]
  }
};

export const GP_PASSAGES = {
  passage1: {
    title: "The Gate at the Bottom Paddock",
    textType: "Short story",
    sourceNote: "Original text written for PaperPanda.",
    paragraphs: [
      "Nina had walked past the bottom paddock every day for a month before she noticed the gate. It hung crooked on one hinge, half hidden by long grass, and behind it the ground dropped away toward a line of old fence posts.",
      "The gate mattered because of the grey pony. He was called Smoke, and he had lived alone in the paddock since the last family left. Nobody had ridden him. Nobody had even led him out. When Nina came near, he lifted his head, watched her for a long moment, then went back to eating.",
      "On Saturday she brought carrots. On Sunday she brought a halter and left it hanging on the post so he could smell it. By Wednesday Smoke was waiting at the fence before she arrived. Her grandfather said that was the trick with a nervous horse: you let him decide.",
      "It took two more weeks. Nina fixed the hinge with a spanner and a flat stone, and the gate swung properly for the first time in years. Then she clipped the lead rope on and opened it. Smoke stepped through, stopped, and looked back at the empty paddock as if checking he was allowed to leave. After that he followed her up the track without a single pull on the rope."
    ],
    questions: [
      { skill: "facts", q: "What was the pony's name?", opts: ["Willow", "Smoke", "Nina", "Grey"], a: 1, ev: "paragraph 2", why: "The second paragraph says he was called Smoke." },
      { skill: "sequence", q: "What did Nina bring on Sunday?", opts: ["Carrots", "A halter", "A lead rope", "A spanner"], a: 1, ev: "paragraph 3", why: "Saturday was carrots; Sunday she brought the halter." },
      { skill: "cause", q: "Why did Smoke start waiting at the fence?", opts: ["The gate was fixed", "Nina kept coming with food and the halter", "His paddock had no grass", "Her grandfather led him there"], a: 1, ev: "paragraph 3", why: "He learned to expect her after repeated visits." },
      { skill: "vocabulary", q: "In this story, \"crooked\" describes a gate that is…", opts: ["Newly painted", "Not straight", "Locked shut", "Very heavy"], a: 1, ev: "paragraph 1", why: "It hung on one hinge, so it was not straight." },
      { skill: "inference", q: "What does Smoke looking back suggest?", opts: ["He was still unsure about leaving", "He wanted more carrots", "He disliked Nina", "He was hungry"], a: 0, ev: "paragraph 4", why: "Checking he was allowed to leave shows he was still uncertain." },
      { skill: "main-idea", q: "What is the story mainly about?", opts: ["Fixing a broken gate", "Earning a nervous pony's trust", "Living on a farm", "Learning to ride"], a: 1, ev: "the whole passage", why: "Every event builds toward Smoke trusting Nina." }
    ]
  },
  passage2: {
    title: "The Lantern at Moon Creek",
    textType: "Folktale",
    sourceNote: "Original folktale written for PaperPanda.",
    paragraphs: [
      "Long ago, a sister and brother lived near Moon Creek, where the water was said to remember every promise. Mara was careful and patient. Her younger brother Tavi was bold and always wanted the quickest path.",
      "One dry summer, the creek shrank until smooth stones showed across the middle. An old ferryman warned the children not to cross after sunset, because the hidden holes in the creek bed were hard to see in the dark. He hung a blue lantern in a gum tree so travellers would know where the safe path began.",
      "That evening Tavi decided to fetch water late so he would not have to wait in line the next morning. He laughed at the warning and set off without the lantern. Mara followed with the blue light swinging from her hand. When Tavi stepped into the creek, one foot slid into a deep hole between two rocks.",
      "Mara lifted the lantern high and showed him the line of pale stones that curved back to the bank. Tavi moved slowly from one stone to the next until he was safe again. After that, he was still brave, but he stopped treating wise advice like a joke."
    ],
    questions: [
      { skill: "facts", q: "What colour was the lantern?", opts: ["Red", "Silver", "Blue", "Gold"], a: 2, ev: "paragraph 2", why: "The ferryman hung a blue lantern in the tree." },
      { skill: "sequence", q: "What happened just before Tavi slipped?", opts: ["Mara reached the bank", "He stepped into the creek", "The ferryman shouted", "The sun came up"], a: 1, ev: "paragraph 3", why: "He slipped when he stepped into the creek." },
      { skill: "compare", q: "How were Mara and Tavi different at the start?", opts: ["Mara was patient, but Tavi rushed", "Mara was younger, but Tavi was older", "Mara feared water, but Tavi loved it", "Mara never listened, but Tavi did"], a: 0, ev: "paragraph 1", why: "The first paragraph says Mara was careful and patient while Tavi wanted the quickest path." },
      { skill: "vocabulary", q: "In this story, a traveller is someone who…", opts: ["writes stories", "goes from place to place", "fixes boats", "guards a gate"], a: 1, ev: "paragraph 2", why: "The lantern helped people moving from one place to another." },
      { skill: "inference", q: "Why did Mara follow Tavi with the lantern?", opts: ["She wanted to show off", "She knew the warning mattered", "She wanted to race him", "She was afraid of the dark"], a: 1, ev: "paragraphs 2 and 3", why: "She took the warning seriously and wanted to help him cross safely." },
      { skill: "main-idea", q: "What is the main lesson of the folktale?", opts: ["Lanterns are expensive", "Rivers are always dangerous", "Wise advice can keep you safe", "Older children are always right"], a: 2, ev: "the whole passage", why: "The story shows why listening to wise advice matters." }
    ]
  },
  passage3: {
    title: "Why Horses Flick Their Ears",
    textType: "Informational text",
    sourceNote: "Original non-fiction passage written for PaperPanda.",
    paragraphs: [
      "A horse's ears do much more than sit on top of its head. Each ear can turn on its own, so a horse can listen in two directions at once. This helps the animal notice sounds from the paddock, the stable, or the rider nearby.",
      "People often watch a horse's ears because they show useful clues. Ears pointing forward can mean the horse is interested in something ahead. One ear turned back may show that the horse is still listening to the rider. Flat ears can signal discomfort or anger, so handlers should stop and check what is wrong.",
      "Ear movement also protects horses in busy places. In a loud arena, a horse must sort helpful sounds from confusing ones. If a horse hears a metal gate bang behind it, the ears swing toward the noise before the body turns. This quick response can prevent a startle from becoming a bigger problem.",
      "For riders, the lesson is simple: pay attention. Watching a horse's ears is not just about guessing feelings. It is one way to notice where the horse's attention is and whether it feels calm, worried, or uncomfortable."
    ],
    questions: [
      { skill: "facts", q: "What can each ear do on its own?", opts: ["Change colour", "Turn in a different direction", "Fold under the mane", "Grow longer"], a: 1, ev: "paragraph 1", why: "The first paragraph says each ear can turn on its own." },
      { skill: "cause", q: "Why should handlers stop if a horse's ears are flat?", opts: ["The horse is probably sleepy", "The horse may be uncomfortable or angry", "The horse wants more food", "The horse is hearing birds"], a: 1, ev: "paragraph 2", why: "Flat ears can signal discomfort or anger." },
      { skill: "vocabulary", q: "In paragraph 3, arena means…", opts: ["a riding space", "a feed bucket", "a horse blanket", "a kind of gate"], a: 0, ev: "paragraph 3", why: "The arena is the busy riding area being described." },
      { skill: "inference", q: "Why do the ears move before the horse's body turns?", opts: ["The ears are lighter and react first", "The rider tells them to", "The horse cannot turn around", "The gate always opens slowly"], a: 0, ev: "paragraph 3", why: "The passage suggests the ears react quickly to help the horse notice sounds first." },
      { skill: "purpose", q: "What is the writer's main purpose in this passage?", opts: ["To entertain with a funny story", "To explain how ear movement helps horses", "To persuade readers to buy a horse", "To describe one race event"], a: 1, ev: "the whole passage", why: "The passage explains information about horse ears and why it matters." },
      { skill: "main-idea", q: "What is the main idea of the passage?", opts: ["Horses dislike arenas", "Horses have unusual hair", "Ear movements give useful information", "Metal gates are too loud"], a: 2, ev: "the whole passage", why: "Each paragraph explains how the ears help horses and what riders can learn from them." }
    ]
  },
  passage4: {
    title: "The Storm Lesson",
    textType: "Narrative",
    sourceNote: "Original narrative written for PaperPanda.",
    paragraphs: [
      "The clouds rolled in while the afternoon lesson was still going. Mrs Hart pointed to the dark line above the hills and told everyone to lead the ponies back to the stable before the rain arrived. Most riders moved quickly, but Eli stopped to tighten his stirrup leather because he hated leaving a job half done.",
      "By the time Eli finished, the first drops had started. Ava had already reached the stable with her pony, Pebble, but she saw Eli struggling with a swinging gate and turned back to help. Together they pushed it open, and Eli led his pony through just as the wind snapped across the yard.",
      "Inside, the sound of rain hammered on the roof. Eli looked embarrassed because the hold-up had been his fault. Ava shrugged and said that being careful was good, but timing mattered too. Mrs Hart heard that and smiled. She told the class that safe riders think about both the task and the moment around them.",
      "When the storm passed, the yard smelled fresh and sharp. Eli checked the leather again before the next ride, but this time he did it while everyone else was still mounting up. Ava noticed and gave him a quick nod, and Eli grinned back."
    ],
    questions: [
      { skill: "facts", q: "Who turned back to help Eli?", opts: ["Mrs Hart", "Pebble", "Ava", "The farrier"], a: 2, ev: "paragraph 2", why: "Ava saw Eli struggling and came back." },
      { skill: "sequence", q: "What happened after Eli tightened his stirrup leather?", opts: ["The storm ended", "The first drops started", "Mrs Hart called the farrier", "Ava mounted again"], a: 1, ev: "paragraph 2", why: "The rain began after he finished." },
      { skill: "cause", q: "Why was Eli delayed?", opts: ["He lost the pony", "He wanted to tighten his stirrup leather", "He could not find the stable", "He dropped the gate key"], a: 1, ev: "paragraph 1", why: "He stopped because he wanted the job done properly." },
      { skill: "vocabulary", q: "In paragraph 3, hold-up means…", opts: ["a celebration", "a delay", "a harness strap", "a loud noise"], a: 1, ev: "paragraph 3", why: "The word describes the delay Eli caused." },
      { skill: "inference", q: "Why did Eli grin at the end?", opts: ["He forgot the storm", "He was proud he had learned from the problem", "He wanted another gate to open", "He was laughing at Ava"], a: 1, ev: "paragraph 4", why: "He had changed what he did the next time." },
      { skill: "main-idea", q: "What is the story mainly about?", opts: ["How to repair riding gear", "Learning when to be careful and when to be quick", "Winning a riding lesson", "Avoiding storms forever"], a: 1, ev: "the whole passage", why: "The story shows Eli learning to balance care with timing." },
      { skill: "compare", q: "How were Ava and Eli similar in the story?", opts: ["Both ignored Mrs Hart", "Both wanted to help keep things safe", "Both reached the stable first", "Both hated storms"], a: 1, ev: "paragraphs 1 to 3", why: "Both cared about doing the safe thing, even though they showed it differently." },
      { skill: "facts", q: "What did the yard smell like after the storm?", opts: ["Sweet and dusty", "Fresh and sharp", "Warm and smoky", "Cold and salty"], a: 1, ev: "paragraph 4", why: "The last paragraph says the yard smelled fresh and sharp." }
    ]
  },
  passage5: {
    title: "The New Water Trough",
    textType: "Challenge passage",
    sourceNote: "Original mixed-skills passage written for PaperPanda.",
    paragraphs: [
      "At the start of winter, the agistment centre replaced its old metal water trough with a deeper plastic one. The manager, Mrs Keane, said the change would help in two ways. First, the new trough would not rust. Second, it held more water, so the horses would be less likely to empty it on busy weekends.",
      "Not everyone liked the idea at once. The younger horses stepped back when they saw their reflections on the dark plastic sides. One gelding even snorted and walked the long way around it. Older horses, however, seemed to accept the change after a single drink.",
      "To help the nervous horses, the riders led them to the trough in pairs. A calm horse would walk up first, lower its head, and drink. Then the uncertain horse could copy what it saw. By the third day, the manager noticed fewer sideways looks and more confident steps.",
      "Mrs Keane later wrote a short note for families about the change. She explained why the old trough had to go and described the simple training plan the riders used. Her note was not a complaint and not a story for fun. It was meant to reassure people that the horses were safe and adapting well."
    ],
    questions: [
      { skill: "facts", q: "What material was the new trough made from?", opts: ["Wood", "Plastic", "Stone", "Rubber"], a: 1, ev: "paragraph 1", why: "The new trough was made from plastic." },
      { skill: "cause", q: "Why did the centre replace the old trough?", opts: ["It was too bright", "It made the horses faster", "It rusted and held less water", "It blocked the gate"], a: 2, ev: "paragraph 1", why: "The old trough could rust and held less water." },
      { skill: "sequence", q: "What did riders do first to help nervous horses?", opts: ["Write a family note", "Lead them to the trough in pairs", "Paint the trough", "Move the older horses away"], a: 1, ev: "paragraph 3", why: "The plan began by leading horses in pairs." },
      { skill: "vocabulary", q: "In paragraph 2, accept the change means…", opts: ["ignore the trough", "be willing to use the new trough", "take the trough home", "push the trough over"], a: 1, ev: "paragraph 2", why: "The older horses were willing to drink from it." },
      { skill: "inference", q: "Why did the uncertain horse improve after watching a calm horse?", opts: ["It copied a safe example", "It became thirsty because of the weather", "It forgot the old trough", "It wanted to leave the paddock"], a: 0, ev: "paragraph 3", why: "Watching a calm horse gave it confidence." },
      { skill: "main-idea", q: "What is the passage mainly about?", opts: ["Buying expensive equipment", "Helping horses adjust to a useful change", "Teaching riders to write letters", "Cleaning winter paddocks"], a: 1, ev: "the whole passage", why: "The passage explains a change and how the horses adapted." },
      { skill: "compare", q: "How were the younger horses different from the older horses at first?", opts: ["The younger horses were calmer", "The younger horses were more unsure", "The older horses refused to drink", "The older horses could not see the trough"], a: 1, ev: "paragraph 2", why: "The younger horses stepped back, while the older horses adapted quickly." },
      { skill: "purpose", q: "What was Mrs Keane's purpose in writing the note?", opts: ["To entertain families with a funny story", "To warn families to remove their horses", "To reassure families and explain the change", "To advertise a new stable"], a: 2, ev: "paragraph 4", why: "The note explained the change and reassured families." },
      { skill: "facts", q: "What happened by the third day?", opts: ["The trough was removed", "The riders stopped helping", "There were fewer sideways looks", "The old horses became nervous"], a: 2, ev: "paragraph 3", why: "The manager noticed fewer sideways looks by day three." },
      { skill: "cause", q: "Why did one gelding walk the long way around the trough?", opts: ["He was hungry", "He disliked the riders", "He was unsure of the new object", "He wanted to run"], a: 2, ev: "paragraph 2", why: "He was uneasy about the new dark-sided trough." },
      { skill: "inference", q: "What does paragraph 4 suggest about Mrs Keane as a manager?", opts: ["She avoids sharing information", "She communicates clearly with families", "She dislikes winter work", "She only cares about equipment"], a: 1, ev: "paragraph 4", why: "She explained the change and reassured people." },
      { skill: "main-idea", q: "Which sentence best summarises the whole passage?", opts: ["A centre bought a trough, horses reacted, and staff supported the change well.", "A manager wrote an angry note about families.", "A horse escaped during winter chores.", "Riders refused to help nervous horses."], a: 0, ev: "the whole passage", why: "That option captures the equipment change, the reaction, and the support plan." }
    ]
  }
};

export const GP_SKILLS = [
  { k: "capitals", name: "Capitals & full stops", strand: "grammar", from: 1 },
  { k: "end-punctuation", name: "End punctuation", strand: "grammar", from: 1 },
  { k: "commas", name: "Commas", strand: "grammar", from: 1 },
  { k: "nouns", name: "Nouns", strand: "grammar", from: 2 },
  { k: "apostrophes", name: "Apostrophes", strand: "grammar", from: 3 },
  { k: "sv-agreement", name: "Subject–verb agreement", strand: "grammar", from: 3 },
  { k: "fragments", name: "Fragments & run-ons", strand: "grammar", from: 3 },
  { k: "verbs", name: "Verbs", strand: "grammar", from: 5 },
  { k: "tense", name: "Past / present / future", strand: "grammar", from: 6 },
  { k: "construction", name: "Sentence construction", strand: "grammar", from: 7 },
  { k: "adjectives", name: "Adjectives", strand: "grammar", from: 8 },
  { k: "pronouns", name: "Pronouns", strand: "grammar", from: 12 },
  { k: "adverbs", name: "Adverbs", strand: "grammar", from: 15 },
  { k: "conjunctions", name: "Conjunctions", strand: "grammar", from: 17 },
  { k: "compound", name: "Joining ideas", strand: "grammar", from: 18 },
  { k: "prepositions", name: "Prepositions", strand: "grammar", from: 20 },
  { k: "subject-verb", name: "Subject and verb", strand: "grammar", from: 21 },
  { k: "sentence-expansion", name: "Sentence expansion", strand: "grammar", from: 23 },
  { k: "facts", name: "Facts & details", strand: "comp", from: 4 },
  { k: "sequence", name: "Sequence", strand: "comp", from: 4 },
  { k: "cause", name: "Cause & effect", strand: "comp", from: 4 },
  { k: "vocabulary", name: "Word meaning in context", strand: "comp", from: 4 },
  { k: "inference", name: "Inference", strand: "comp", from: 4 },
  { k: "main-idea", name: "Main idea", strand: "comp", from: 4 },
  { k: "compare", name: "Compare & contrast", strand: "comp", from: 9 },
  { k: "purpose", name: "Author's purpose", strand: "comp", from: 14 }
];
