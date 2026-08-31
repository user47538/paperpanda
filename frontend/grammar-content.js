export const GP_ACTIVITIES_PER_SESSION = 3;

export const GP_SESSIONS = [
  { n: 1, title: "Fix the Paragraph", meta: "Punctuation · drag-and-drop", act: "fix", content: "para1" },
  { n: 2, title: "Find the Nouns", meta: "Nouns · 5 sentence selection", act: "pick", content: "noun" },
  { n: 3, title: "Sort the Sentence", meta: "Noun + verb + adjective · drag-and-drop", act: "sort", content: "parts1" },
  { n: 4, title: "Comprehension 1", meta: "Short story · 6 questions", act: "comp", content: "passage1" },
  { n: 5, title: "Find the Verbs", meta: "Verbs · 5 sentence selection", act: "pick", content: "verb" },
  { n: 6, title: "When Did It Happen?", meta: "Tense · selector", act: "tense", content: "tense1" },
  { n: 7, title: "Write a Sentence", meta: "Construction · writing", act: "write", content: "write1" },
  { n: 8, title: "Find the Adjectives", meta: "Adjectives · 5 sentence selection", act: "pick", content: "adjective" },
  { n: 9, title: "Comprehension 2", meta: "Folktale · 6 questions", act: "comp", content: "passage2" },
  { n: 10, title: "Change the Tense", meta: "Tense · multiple choice", act: "mc", content: "tense2" },
  { n: 11, title: "Fix the Paragraph II", meta: "Punctuation · drag-and-drop", act: "fix", content: "para2" },
  { n: 12, title: "Find the Pronouns", meta: "Pronouns · 5 sentence selection", act: "pick", content: "pronoun" },
  { n: 13, title: "Comprehension 3", meta: "Non-fiction · 6 questions", act: "comp", content: "passage3" },
  { n: 14, title: "Find the Adverbs", meta: "Adverbs · 5 sentence selection", act: "pick", content: "adverb" },
  { n: 15, title: "Write It in Another Tense", meta: "Tense · sentence rewrite", act: "rewrite", content: "rewrite1" },
  { n: 16, title: "Find the Conjunctions", meta: "Conjunctions · 5 sentence selection", act: "pick", content: "conjunction" },
  { n: 17, title: "Join the Sentences", meta: "Compound · drag-and-drop", act: "join", content: "join1" },
  { n: 18, title: "Comprehension 4", meta: "Narrative · 6–8 questions", act: "comp", content: "passage4" },
  { n: 19, title: "Find the Prepositions", meta: "Prepositions · 5 sentence selection", act: "pick", content: "preposition" },
  { n: 20, title: "Who Did What?", meta: "Subject + verb · highlight", act: "select", content: "subverb1" },
  { n: 21, title: "Fix the Sentence II", meta: "Mixed review · 10 questions", act: "mc", content: "mixed1" },
  { n: 22, title: "Make It Better", meta: "Expansion · builder", act: "build", content: "expand1" },
  { n: 23, title: "Comprehension Challenge", meta: "Mixed · 10–12 questions", act: "comp", content: "passage5" },
  { n: 24, title: "Grammar Challenge", meta: "Review · mixed mini-games", act: "mixed", content: "review1" }
];

export const GP_LESSON_INTROS = {
  parts1: {
    term: "Parts of speech",
    definition: "A noun names, a verb shows action or state, and an adjective describes a noun.",
    examples: [
      "The calm rider opened the gate.",
      "Pony is a noun, trotted is a verb, and muddy is an adjective.",
      "Good readers look at the whole sentence before sorting words."
    ],
    audioText: "In this activity you will sort words from a sentence into three groups. Nouns name people, places, things, or ideas. Verbs show actions or states. Adjectives describe nouns. Read the whole sentence first, then drag each target word into the correct column."
  },
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
    audioText: "A noun names a person, a place, a thing or an idea. Rider is a noun. Gate is a noun. Courage is a noun, even though you cannot touch it. In this activity you will select only the nouns.",
    instruction: "Select the noun in each sentence.",
    items: [
      { words: ["The", "rider", "opened", "the", "gate."], a: [1, 4], skill: "nouns", why: "Rider and gate are both naming words in this sentence." },
      { words: ["Her", "saddle", "slipped", "off", "the", "rail."], a: [1, 5], skill: "nouns", why: "Saddle and rail are both nouns in this sentence." },
      { words: ["Courage", "helped", "Mia", "finish", "the", "jump."], a: [0, 2, 5], skill: "nouns", why: "Courage, Mia, and jump are all nouns here." },
      { words: ["The", "stable", "stayed", "cool", "all", "afternoon."], a: [1, 5], skill: "nouns", why: "Stable and afternoon are both nouns in this sentence." },
      { words: ["A", "helmet", "rested", "beside", "the", "bucket."], a: [1, 5], skill: "nouns", why: "Helmet and bucket are both naming words here." }
    ]
  },
  verb: {
    term: "Verb",
    definition: "A verb tells you what someone or something does.",
    examples: ["The pony trots to the gate.", "She lifted the saddle.", "They will ride at dawn."],
    audioText: "A verb tells you what someone or something does. Trots is a verb. Lifted is a verb. Will ride is a verb group. In this activity you will select only the verbs.",
    instruction: "Select the verb in each sentence.",
    items: [
      { words: ["The", "pony", "trots", "toward", "the", "gate."], a: 2, skill: "verbs", why: "Trots is the action word." },
      { words: ["Mia", "lifted", "the", "saddle", "carefully."], a: 1, skill: "verbs", why: "Lifted tells what Mia did." },
      { words: ["They", "will", "ride", "at", "dawn."], a: [1, 2], skill: "verbs", why: "Will ride works together as the verb group in this sentence." },
      { words: ["The", "farrier", "checked", "each", "hoof."], a: 2, skill: "verbs", why: "Checked tells the action." },
      { words: ["Smoke", "waited", "near", "the", "float."], a: 1, skill: "verbs", why: "Waited is the verb." }
    ]
  },
  adjective: {
    term: "Adjective",
    definition: "An adjective describes a noun.",
    examples: ["The grey pony waited by the gate.", "She held the heavy saddle.", "A nervous horse needs a calm rider."],
    audioText: "An adjective describes a noun. Grey tells us about the pony. Heavy tells us about the saddle. Calm tells us about the rider. In this activity you will select only the adjectives.",
    instruction: "Select the adjective in each sentence.",
    items: [
      { words: ["The", "grey", "pony", "waited", "by", "the", "gate."], a: 1, skill: "adjectives", why: "Grey describes the pony." },
      { words: ["She", "held", "the", "heavy", "saddle", "carefully."], a: 3, skill: "adjectives", why: "Heavy describes the saddle." },
      { words: ["A", "nervous", "horse", "waited", "by", "the", "rail."], a: 1, skill: "adjectives", why: "Nervous describes the horse." },
      { words: ["The", "wooden", "fence", "shook", "in", "the", "wind."], a: 1, skill: "adjectives", why: "Wooden describes the fence." },
      { words: ["Her", "striped", "scarf", "slid", "off", "the", "bench."], a: 1, skill: "adjectives", why: "Striped describes the scarf." }
    ]
  },
  pronoun: {
    term: "Pronoun",
    definition: "A pronoun takes the place of a noun.",
    examples: ["Nina brushed Smoke, then she fed him.", "They opened the gate together."],
    audioText: "A pronoun takes the place of a noun. She can stand for Nina. Him can stand for Smoke. They can stand for more than one person. In this activity you will select only the pronouns.",
    instruction: "Select the pronoun in each sentence.",
    items: [
      { words: ["Nina", "brushed", "Smoke,", "then", "she", "fed", "him."], a: [4, 6], skill: "pronouns", why: "She and him are both pronouns in this sentence." },
      { words: ["They", "opened", "the", "gate", "together."], a: 0, skill: "pronouns", why: "They stands in for more than one person." },
      { words: ["The", "saddle", "slipped,", "but", "it", "did", "not", "fall."], a: 4, skill: "pronouns", why: "It stands in for the saddle." },
      { words: ["Luca", "called", "to", "Mia,", "and", "she", "waved", "back."], a: 5, skill: "pronouns", why: "She replaces Mia." },
      { words: ["We", "stacked", "the", "buckets", "near", "the", "door."], a: 0, skill: "pronouns", why: "We is the pronoun naming the group." }
    ]
  },
  adverb: {
    term: "Adverb",
    definition: "An adverb usually tells how, when, or where something happens.",
    examples: ["The pony moved slowly.", "She checked the gate carefully."],
    audioText: "An adverb often tells how, when, or where something happens. Slowly tells how the pony moved. Carefully tells how she checked the gate. In this activity you will select only the adverbs.",
    instruction: "Select the adverb in each sentence.",
    items: [
      { words: ["The", "pony", "moved", "slowly", "through", "the", "yard."], a: 3, skill: "adverbs", why: "Slowly tells how the pony moved." },
      { words: ["She", "checked", "the", "gate", "carefully", "before", "leaving."], a: 4, skill: "adverbs", why: "Carefully tells how she checked." },
      { words: ["Smoke", "waited", "quietly", "by", "the", "float."], a: 2, skill: "adverbs", why: "Quietly tells how Smoke waited." },
      { words: ["The", "rider", "spoke", "softly", "to", "the", "mare."], a: 3, skill: "adverbs", why: "Softly tells how the rider spoke." },
      { words: ["The", "class", "ended", "suddenly", "when", "the", "rain", "started."], a: 3, skill: "adverbs", why: "Suddenly tells when or how it happened." }
    ]
  },
  conjunction: {
    term: "Conjunction",
    definition: "A conjunction joins words or ideas together.",
    examples: ["Nina waited and Smoke watched.", "She was nervous but determined."],
    audioText: "A conjunction joins words or ideas together. And links two ideas. But shows a contrast. Because gives a reason. In this activity you will select only the conjunctions.",
    instruction: "Select the conjunction in each sentence.",
    items: [
      { words: ["Nina", "waited", "and", "Smoke", "watched."], a: 2, skill: "conjunctions", why: "And joins the two ideas." },
      { words: ["She", "was", "nervous", "but", "determined."], a: 3, skill: "conjunctions", why: "But links two contrasting ideas." },
      { words: ["We", "hurried", "inside", "because", "the", "rain", "started."], a: 3, skill: "conjunctions", why: "Because gives the reason." },
      { words: ["Take", "the", "lead", "rope", "or", "the", "halter."], a: 4, skill: "conjunctions", why: "Or joins the two choices." },
      { words: ["The", "pony", "stepped", "forward", "while", "Mia", "held", "the", "gate."], a: 4, skill: "conjunctions", why: "While joins the actions happening together." }
    ]
  },
  preposition: {
    term: "Preposition",
    definition: "A preposition shows position, direction, or time.",
    examples: ["The halter hung on the post.", "Smoke walked through the gate."],
    audioText: "A preposition shows position, direction, or time. On tells us where the halter hung. Through tells us how Smoke moved. In this activity you will select only the prepositions.",
    instruction: "Select the preposition in each sentence.",
    items: [
      { words: ["The", "halter", "hung", "on", "the", "post."], a: 3, skill: "prepositions", why: "On shows where the halter hung." },
      { words: ["Smoke", "walked", "through", "the", "gate."], a: 2, skill: "prepositions", why: "Through shows direction." },
      { words: ["The", "bucket", "sat", "under", "the", "bench."], a: 3, skill: "prepositions", why: "Under shows position." },
      { words: ["We", "waited", "beside", "the", "arena", "rail."], a: 2, skill: "prepositions", why: "Beside shows where we waited." },
      { words: ["The", "ponies", "trotted", "across", "the", "field."], a: 3, skill: "prepositions", why: "Across shows movement and direction." }
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
    { s: "yesterday we clean the stalls.", opts: ["cleaned", ",", "'s"], a: 0, skill: "tense", why: "Yesterday calls for the past tense: cleaned." },
    { s: "The bridle were on the hook.", opts: ["was", ".", "They"], a: 0, skill: "sv-agreement", why: "One bridle needs was." },
    { s: "after the lesson, Maya washed the saddle.", opts: ["After", "'s", "Because"], a: 0, skill: "capitals", why: "The first word should be After." },
    { s: "Because the rain started.", opts: ["we hurried inside.", ",", "They"], a: 0, skill: "fragments", why: "Because the rain started needs a main idea to finish the thought: Because the rain started, we hurried inside." },
    { s: "The foals tail was tangled.", opts: ["and", "foal's", "under"], a: 1, skill: "apostrophes", why: "The tail belongs to the foal: foal's." },
    { s: "We packed the feed, but forgot the buckets.", opts: ["we", "?", "packed"], a: 0, skill: "construction", why: "The second part needs a subject: but we forgot the buckets." },
    { s: "After the ride we washed the saddle.", opts: [",", ".", "'s"], a: 0, skill: "commas", why: "A comma goes after the opening part: After the ride, we washed the saddle." },
    { s: "The rider and the pony was ready.", opts: ["were", "'s", "ready"], a: 0, skill: "sv-agreement", why: "Rider and pony means more than one, so the verb is were." },
    { s: "I found the gloves in the bench and the crop beside the wall.", opts: ["under", "They", ","], a: 0, skill: "prepositions", why: "Under is the correct preposition for the gloves here." },
    { s: "Her saddle is old but comfortable.", opts: ["and", "old", "No error"], a: 2, skill: "conjunctions", why: "But joins two describing ideas correctly, and the sentence is already complete." },
    { s: "The careful rider spoke softly to the mare.", opts: ["No error", "'s", "because"], a: 0, skill: "adverbs", why: "Softly is an adverb and the sentence is correct." },
    { s: "Them brushed the pony before dinner.", opts: ["They", "brush", "will brush"], a: 0, skill: "pronouns", why: "Them should be They here." },
    { s: "The pony waited patiently by the gate.", opts: ["No error", "and", "'s"], a: 0, skill: "adverbs", why: "Patiently is used correctly and the sentence works." },
    { s: "The rider wore a blue helmet and a striped scarf.", opts: ["No error", "under", "because"], a: 0, skill: "adjectives", why: "Blue and striped describe the nouns correctly." },
    { s: "The halter hung behind the stable door.", opts: ["under", "No error", "The"], a: 1, skill: "prepositions", why: "Behind is a clear preposition and the sentence is correct." }
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
  correct1: {
    items: [
      {
        tokens: [
          { t: "where" }, { slot: "question1", need: "none" },
          { t: "did" }, { t: "you" }, { t: "leave" }, { slot: "question2", need: "none" },
          { t: "the" }, { t: "halter" }, { slot: "question3", need: "question" }
        ]
      },
      {
        tokens: [
          { t: "after" }, { t: "the" }, { t: "lesson" }, { slot: "comma1", need: "comma" },
          { t: "we" }, { slot: "comma2", need: "none" }, { t: "brushed" }, { t: "Willow" }, { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "did" }, { t: "you" }, { slot: "question1", need: "none" },
          { t: "pack" }, { t: "the" }, { t: "lead" }, { t: "rope" }, { slot: "question2", need: "question" }
        ]
      },
      {
        tokens: [
          { t: "before" }, { t: "the" }, { t: "jump" }, { slot: "comma1", need: "comma" },
          { t: "the" }, { slot: "comma2", need: "none" }, { t: "pony" }, { t: "snorted" }, { t: "loudly" }, { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "the" }, { t: "tack" }, { slot: "end1", need: "none" },
          { t: "room" }, { t: "door" }, { t: "was" }, { t: "open" }, { slot: "end2", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "when" }, { slot: "comma1", need: "none" },
          { t: "we" }, { t: "arrived" }, { slot: "comma2", need: "comma" },
          { t: "the" }, { t: "farrier" }, { t: "waved" }, { slot: "end1", need: "end" }
        ]
      }
    ],
    chips: [
      { k: "end", label: "Full stop .", skill: "end-punctuation" },
      { k: "comma", label: "Comma ,", skill: "commas" },
      { k: "question", label: "Question mark ?", skill: "end-punctuation" }
    ]
  },
  para1: {
    items: [
      {
        tokens: [
          { t: "my", slot: "cap1", need: "cap" },
          { t: "pony" }, { t: "waits" }, { t: "by" }, { t: "the" }, { t: "gate" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "after", slot: "cap1", need: "cap" },
          { t: "the" }, { t: "lesson" }, { slot: "comma1", need: "comma" },
          { t: "we" }, { t: "brushed" }, { t: "Willow" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "the", slot: "cap1", need: "cap" },
          { t: "rider" }, { t: "borrowed" }, { t: "her" }, { t: "cousins", slot: "apos1", need: "apos", c: "cousin's" }, { t: "saddle" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "when", slot: "cap1", need: "cap" },
          { t: "the" }, { t: "rain" }, { t: "stopped" }, { slot: "comma1", need: "comma" },
          { t: "we" }, { t: "opened" }, { t: "the" }, { t: "stable" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "i", slot: "cap1", need: "cap" },
          { t: "filled" }, { t: "the" }, { t: "buckets" }, { slot: "comma1", need: "comma" },
          { t: "then" }, { t: "I" }, { t: "swept" }, { t: "the" }, { t: "aisle" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "the", slot: "cap1", need: "cap" },
          { t: "riders", slot: "apos1", need: "apos", c: "rider's" }, { t: "helmet" }, { t: "sat" }, { t: "on" }, { t: "the" }, { t: "bench" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "before", slot: "cap1", need: "cap" },
          { t: "the" }, { t: "jump" }, { slot: "comma1", need: "comma" },
          { t: "the" }, { t: "pony" }, { t: "snorted" }, { t: "loudly" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "the", slot: "cap1", need: "cap" },
          { t: "bridles", slot: "apos1", need: "apos", c: "bridle's" }, { t: "straps" }, { t: "were" }, { t: "muddy" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "when", slot: "cap1", need: "cap" },
          { t: "we" }, { t: "arrived" }, { slot: "comma1", need: "comma" },
          { t: "the" }, { t: "farrier" }, { t: "waved" },
          { slot: "end1", need: "end" }
        ]
      },
      {
        tokens: [
          { t: "the", slot: "cap1", need: "cap" },
          { t: "tack" }, { t: "room" }, { t: "door" }, { t: "was" }, { t: "open" },
          { slot: "end1", need: "end" }
        ]
      }
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
      { t: "Friday" }, { t: "Maya" }, { t: "borrowed" }, { t: "her" },
      { t: "cousins", slot: "apos1", need: "apos", c: "cousin's" },
      { t: "saddle" }, { slot: "end1", need: "end" },
      { t: "after", slot: "cap2", need: "cap" }, { t: "the" }, { t: "lesson" }, { slot: "comma1", need: "comma" }, { t: "she" }, { t: "cleaned" }, { t: "it" }, { t: "carefully" },
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

export const GP_SORT = {
  parts1: [
    {
      sentence: ["The", "calm", "rider", "opened", "the", "gate."],
      tokens: [
        { word: "calm", target: "adjective" },
        { word: "rider", target: "noun" },
        { word: "opened", target: "verb" }
      ],
      columns: [
        { key: "noun", label: "Noun" },
        { key: "verb", label: "Verb" },
        { key: "adjective", label: "Adjective" }
      ],
      skills: ["nouns", "verbs", "adjectives"],
      why: "Rider names who the sentence is about, opened is the action, and calm describes the rider."
    },
    {
      sentence: ["A", "muddy", "pony", "trotted", "past", "the", "shed."],
      tokens: [
        { word: "muddy", target: "adjective" },
        { word: "pony", target: "noun" },
        { word: "trotted", target: "verb" }
      ],
      columns: [
        { key: "noun", label: "Noun" },
        { key: "verb", label: "Verb" },
        { key: "adjective", label: "Adjective" }
      ],
      skills: ["nouns", "verbs", "adjectives"],
      why: "Pony is the noun, trotted is the verb, and muddy describes the pony."
    },
    {
      sentence: ["The", "stable", "helper", "carried", "a", "heavy", "bucket."],
      tokens: [
        { word: "helper", target: "noun" },
        { word: "carried", target: "verb" },
        { word: "heavy", target: "adjective" }
      ],
      columns: [
        { key: "noun", label: "Noun" },
        { key: "verb", label: "Verb" },
        { key: "adjective", label: "Adjective" }
      ],
      skills: ["nouns", "verbs", "adjectives"],
      why: "Helper names the person, carried is the action, and heavy describes the bucket."
    },
    {
      sentence: ["Our", "brave", "friend", "guided", "the", "horse", "home."],
      tokens: [
        { word: "brave", target: "adjective" },
        { word: "friend", target: "noun" },
        { word: "guided", target: "verb" }
      ],
      columns: [
        { key: "noun", label: "Noun" },
        { key: "verb", label: "Verb" },
        { key: "adjective", label: "Adjective" }
      ],
      skills: ["nouns", "verbs", "adjectives"],
      why: "Friend is the noun, guided is the verb, and brave describes the friend."
    },
    {
      sentence: ["That", "gentle", "mare", "waited", "near", "the", "fence."],
      tokens: [
        { word: "gentle", target: "adjective" },
        { word: "mare", target: "noun" },
        { word: "waited", target: "verb" }
      ],
      columns: [
        { key: "noun", label: "Noun" },
        { key: "verb", label: "Verb" },
        { key: "adjective", label: "Adjective" }
      ],
      skills: ["nouns", "verbs", "adjectives"],
      why: "Mare names the animal, waited is the verb, and gentle describes the mare."
    }
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
  { k: "adverbs", name: "Adverbs", strand: "grammar", from: 14 },
  { k: "conjunctions", name: "Conjunctions", strand: "grammar", from: 16 },
  { k: "compound", name: "Joining ideas", strand: "grammar", from: 17 },
  { k: "prepositions", name: "Prepositions", strand: "grammar", from: 19 },
  { k: "subject-verb", name: "Subject and verb", strand: "grammar", from: 20 },
  { k: "sentence-expansion", name: "Sentence expansion", strand: "grammar", from: 22 },
  { k: "facts", name: "Facts & details", strand: "comp", from: 4 },
  { k: "sequence", name: "Sequence", strand: "comp", from: 4 },
  { k: "cause", name: "Cause & effect", strand: "comp", from: 4 },
  { k: "vocabulary", name: "Word meaning in context", strand: "comp", from: 4 },
  { k: "inference", name: "Inference", strand: "comp", from: 4 },
  { k: "main-idea", name: "Main idea", strand: "comp", from: 4 },
  { k: "compare", name: "Compare & contrast", strand: "comp", from: 9 },
  { k: "purpose", name: "Author's purpose", strand: "comp", from: 13 }
];

export const GP_CYCLE_VARIANTS = {
  2: {
    terms: {
      noun: {
        term: "Noun",
        definition: "A noun names a person, a place, a thing or an idea.",
        examples: ["The groom carried the bucket.", "Trust helped the pony settle.", "The arena lights switched on."],
        audioText: "A noun names a person, a place, a thing or an idea. In this activity you will select only the nouns.",
        instruction: "Select the noun in each sentence.",
        items: [
          { words: ["The", "farrier", "lifted", "the", "toolbox."], a: [1, 4], skill: "nouns", why: "Farrier and toolbox are both nouns." },
          { words: ["Her", "cousin", "found", "patience", "during", "training."], a: [1, 3, 5], skill: "nouns", why: "Cousin, patience, and training are nouns in this sentence." },
          { words: ["The", "arena", "lights", "glowed", "after", "sunset."], a: [1, 2, 5], skill: "nouns", why: "Arena, lights, and sunset all name things or places." },
          { words: ["A", "map", "showed", "the", "trail", "clearly."], a: [1, 4], skill: "nouns", why: "Map and trail are naming words." },
          { words: ["Storm", "pushed", "dust", "across", "the", "yard."], a: [0, 2, 5], skill: "nouns", why: "Storm, dust, and yard are nouns here." }
        ]
      },
      verb: {
        term: "Verb",
        definition: "A verb tells you what someone or something does.",
        examples: ["The rider waved.", "The dogs barked outside.", "They will polish the bridle."],
        audioText: "A verb tells you what someone or something does. In this activity you will select only the verbs.",
        instruction: "Select the verb in each sentence.",
        items: [
          { words: ["The", "dogs", "barked", "outside", "the", "barn."], a: 2, skill: "verbs", why: "Barked is the action word." },
          { words: ["Ava", "polished", "the", "bridle", "carefully."], a: 1, skill: "verbs", why: "Polished tells what Ava did." },
          { words: ["They", "will", "pack", "before", "sunrise."], a: [1, 2], skill: "verbs", why: "Will pack works together as the verb group." },
          { words: ["The", "gelding", "leaned", "against", "the", "rail."], a: 2, skill: "verbs", why: "Leaned is the verb." },
          { words: ["Our", "coach", "noticed", "the", "change."], a: 2, skill: "verbs", why: "Noticed tells the action." }
        ]
      },
      adjective: {
        term: "Adjective",
        definition: "An adjective describes a noun.",
        examples: ["The bright float arrived.", "She wore a tidy jacket.", "A stubborn pony needs a calm handler."],
        audioText: "An adjective describes a noun. In this activity you will select only the adjectives.",
        instruction: "Select the adjective in each sentence.",
        items: [
          { words: ["The", "bright", "float", "waited", "near", "the", "shed."], a: 1, skill: "adjectives", why: "Bright describes the float." },
          { words: ["She", "wore", "a", "tidy", "jacket", "to", "the", "lesson."], a: 3, skill: "adjectives", why: "Tidy describes the jacket." },
          { words: ["A", "stubborn", "pony", "refused", "the", "bucket."], a: 1, skill: "adjectives", why: "Stubborn describes the pony." },
          { words: ["The", "dusty", "track", "curved", "behind", "the", "trees."], a: 1, skill: "adjectives", why: "Dusty describes the track." },
          { words: ["Her", "silver", "watch", "slid", "onto", "the", "bench."], a: 1, skill: "adjectives", why: "Silver describes the watch." }
        ]
      },
      pronoun: {
        term: "Pronoun",
        definition: "A pronoun takes the place of a noun.",
        examples: ["Noah found the rope and he coiled it.", "We waited by the gate."],
        audioText: "A pronoun takes the place of a noun. In this activity you will select only the pronouns.",
        instruction: "Select the pronoun in each sentence.",
        items: [
          { words: ["Noah", "found", "the", "rope,", "and", "he", "coiled", "it."], a: [5, 7], skill: "pronouns", why: "He and it are pronouns here." },
          { words: ["We", "stood", "near", "the", "wash", "bay."], a: 0, skill: "pronouns", why: "We is the pronoun naming the group." },
          { words: ["The", "mare", "snorted,", "but", "she", "stayed", "still."], a: 4, skill: "pronouns", why: "She stands in for the mare." },
          { words: ["Lena", "showed", "Oscar", "the", "map,", "then", "they", "laughed."], a: 6, skill: "pronouns", why: "They replaces Lena and Oscar together." },
          { words: ["I", "stacked", "the", "cones", "beside", "the", "fence."], a: 0, skill: "pronouns", why: "I is the pronoun." }
        ]
      },
      adverb: {
        term: "Adverb",
        definition: "An adverb usually tells how, when, or where something happens.",
        examples: ["The horse stepped carefully.", "The class ended early."],
        audioText: "An adverb often tells how, when, or where something happens. In this activity you will select only the adverbs.",
        instruction: "Select the adverb in each sentence.",
        items: [
          { words: ["The", "horse", "stepped", "carefully", "over", "the", "pole."], a: 3, skill: "adverbs", why: "Carefully tells how the horse stepped." },
          { words: ["The", "class", "ended", "early", "because", "of", "lightning."], a: 3, skill: "adverbs", why: "Early tells when the class ended." },
          { words: ["Rory", "spoke", "kindly", "to", "the", "nervous", "colt."], a: 2, skill: "adverbs", why: "Kindly tells how Rory spoke." },
          { words: ["The", "gate", "swung", "wide", "in", "the", "wind."], a: 3, skill: "adverbs", why: "Wide tells how the gate swung open." },
          { words: ["The", "students", "lined", "up", "quietly", "outside."], a: 4, skill: "adverbs", why: "Quietly tells how the students lined up." }
        ]
      },
      conjunction: {
        term: "Conjunction",
        definition: "A conjunction joins words or ideas together.",
        examples: ["Mia waited while Leo checked the gate.", "The path was muddy, so we slowed down."],
        audioText: "A conjunction joins words or ideas together. In this activity you will select only the conjunctions.",
        instruction: "Select the conjunction in each sentence.",
        items: [
          { words: ["Mia", "waited", "while", "Leo", "checked", "the", "gate."], a: 2, skill: "conjunctions", why: "While joins the two actions." },
          { words: ["The", "path", "was", "muddy,", "so", "we", "slowed", "down."], a: 4, skill: "conjunctions", why: "So links the cause and the result." },
          { words: ["Take", "the", "raincoat", "and", "the", "helmet."], a: 3, skill: "conjunctions", why: "And joins the two items." },
          { words: ["We", "can", "ride", "now", "or", "wait", "for", "sunset."], a: 4, skill: "conjunctions", why: "Or joins the two choices." },
          { words: ["The", "mare", "relaxed", "because", "the", "handler", "spoke", "softly."], a: 3, skill: "conjunctions", why: "Because gives the reason." }
        ]
      },
      preposition: {
        term: "Preposition",
        definition: "A preposition shows position, direction, or time.",
        examples: ["The whip leaned against the wall.", "We rode along the trail."],
        audioText: "A preposition shows position, direction, or time. In this activity you will select only the prepositions.",
        instruction: "Select the preposition in each sentence.",
        items: [
          { words: ["The", "whip", "leaned", "against", "the", "wall."], a: 3, skill: "prepositions", why: "Against shows position." },
          { words: ["We", "rode", "along", "the", "trail", "at", "sunrise."], a: [2, 5], skill: "prepositions", why: "Along shows direction and at shows time." },
          { words: ["The", "towels", "sat", "inside", "the", "wash", "bay."], a: 3, skill: "prepositions", why: "Inside shows where the towels sat." },
          { words: ["The", "colt", "trotted", "past", "the", "round", "pen."], a: 3, skill: "prepositions", why: "Past shows movement and direction." },
          { words: ["We", "met", "before", "the", "lesson", "started."], a: 2, skill: "prepositions", why: "Before shows time." }
        ]
      }
    },
    mc: {
      correct1: [
        { s: "sophie packed the girth and the pad.", opts: ["Missing capital letter", "Missing question mark", "Missing comma"], a: 0, skill: "capitals", why: "Names begin with capitals: Sophie." },
        { s: "Did the farrier arrive yet", opts: ["Missing apostrophe", "Missing question mark", "Run-on sentence"], a: 1, skill: "end-punctuation", why: "A question ends with a question mark." },
        { s: "The buckets was beside the gate.", opts: ["Subject and verb do not agree", "Missing full stop", "Missing capital letter"], a: 0, skill: "sv-agreement", why: "Buckets is plural, so the verb should be were." },
        { s: "While the lesson was still going.", opts: ["Sentence fragment", "Missing comma", "Missing apostrophe"], a: 0, skill: "fragments", why: "This line leaves the main idea unfinished." },
        { s: "The riders boots were muddy.", opts: ["Missing question mark", "Missing apostrophe", "Missing capital letter"], a: 1, skill: "apostrophes", why: "The boots belong to the rider: rider's." },
        { s: "Before the storm arrived we stacked the poles.", opts: ["Missing comma", "Missing apostrophe", "Missing full stop"], a: 0, skill: "commas", why: "A comma should come after the opening part." },
        { s: "The mare very calm today.", opts: ["Missing verb", "Missing comma", "Missing capital letter"], a: 0, skill: "construction", why: "The sentence needs a verb such as is." },
        { s: "i checked the latch before lunch.", opts: ["Missing apostrophe", "Capital letters missing", "Missing question mark"], a: 1, skill: "capitals", why: "The first word and I both need capitals." },
        { s: "We loaded the float it started to rain.", opts: ["Run-on sentence", "Sentence fragment", "Missing question mark"], a: 0, skill: "fragments", why: "These are two complete ideas joined incorrectly." },
        { s: "The reins belongs to Noah.", opts: ["Missing comma", "Subject and verb do not agree", "Missing capital letter"], a: 1, skill: "sv-agreement", why: "Reins is plural, so the verb should be belong." }
      ],
      tense2: [
        { s: "Change to the past tense: He opens the stable door.", opts: ["He opened the stable door.", "He opening the stable door.", "He will open the stable door."], a: 0, skill: "tense", why: "Opens changes to opened in the past tense." },
        { s: "Change to the future tense: We saddled the pony.", opts: ["We saddle the pony.", "We will saddle the pony.", "We were saddling the pony."], a: 1, skill: "tense", why: "Will saddle shows the future." },
        { s: "Change to the present tense: The foal slept in the shade.", opts: ["The foal sleeps in the shade.", "The foal will sleep in the shade.", "The foal sleeping in the shade."], a: 0, skill: "tense", why: "Slept changes to sleeps in the present tense." },
        { s: "Change to the future tense: Maya tidies the tack room.", opts: ["Maya tidied the tack room.", "Maya will tidy the tack room.", "Maya tidying the tack room."], a: 1, skill: "tense", why: "Will tidy points to the future." },
        { s: "Change to the past tense: They are rinsing the buckets.", opts: ["They rinse the buckets.", "They will rinse the buckets.", "They were rinsing the buckets."], a: 2, skill: "tense", why: "Are rinsing changes to were rinsing in the past." },
        { s: "Change to the present tense: I will carry the poles.", opts: ["I carrying the poles.", "I carry the poles.", "I carried the poles."], a: 1, skill: "tense", why: "Carry is the present form." },
        { s: "Change to the past tense: The riders wait by the yard.", opts: ["The riders will wait by the yard.", "The riders waited by the yard.", "The riders waits by the yard."], a: 1, skill: "tense", why: "Wait changes to waited in the past." },
        { s: "Change to the future tense: Zara checks the girth twice.", opts: ["Zara checked the girth twice.", "Zara is checking the girth twice.", "Zara will check the girth twice."], a: 2, skill: "tense", why: "Will check is the future form." },
        { s: "Change to the present tense: The horse trotted toward the trees.", opts: ["The horse trots toward the trees.", "The horse will trot toward the trees.", "The horse trotting toward the trees."], a: 0, skill: "tense", why: "Trotted changes to trots in the present tense." },
        { s: "Change to the past tense: I am leading the mare.", opts: ["I was leading the mare.", "I lead the mare.", "I will lead the mare."], a: 0, skill: "tense", why: "Am leading changes to was leading in the past." }
      ],
      mixedPool: [
        { s: "tomorrow we brush the ponies before school.", opts: ["will brush", ",", "'s"], a: 0, skill: "tense", why: "Tomorrow calls for the future form: will brush." },
        { s: "The lead rope were under the bench.", opts: ["was", ".", "They"], a: 0, skill: "sv-agreement", why: "One lead rope needs was." },
        { s: "after lunch, Chloe checked the latch.", opts: ["After", "'s", "Because"], a: 0, skill: "capitals", why: "The first word should be After." },
        { s: "When the whistle blew.", opts: ["the riders halted.", ",", "They"], a: 0, skill: "fragments", why: "The opening part needs a main idea: When the whistle blew, the riders halted." },
        { s: "The horses rug was soaked.", opts: ["and", "horse's", "under"], a: 1, skill: "apostrophes", why: "The rug belongs to the horse: horse's." },
        { s: "We packed the buckets, but forgot the towels.", opts: ["we", "?", "packed"], a: 0, skill: "construction", why: "The second part needs a subject: but we forgot the towels." },
        { s: "Before the lesson we checked the tack.", opts: [",", ".", "'s"], a: 0, skill: "commas", why: "A comma belongs after the opening phrase." },
        { s: "The rider and the coach was already inside.", opts: ["were", "'s", "inside"], a: 0, skill: "sv-agreement", why: "Two people need were." },
        { s: "I left the broom in the shed and the towel beside the sink.", opts: ["near", "They", ","], a: 0, skill: "prepositions", why: "Near gives the correct position for the towel here." },
        { s: "Her gloves were dry but dusty.", opts: ["and", "dry", "No error"], a: 2, skill: "conjunctions", why: "But joins the two ideas correctly and the sentence already works." },
        { s: "The confident rider spoke gently to the colt.", opts: ["No error", "'s", "because"], a: 0, skill: "adverbs", why: "Gently is an adverb and the sentence is correct." },
        { s: "Them opened the gate before the class arrived.", opts: ["They", "open", "will open"], a: 0, skill: "pronouns", why: "Them should be They here." },
        { s: "The float rolled slowly up the drive.", opts: ["No error", "and", "'s"], a: 0, skill: "adverbs", why: "Slowly is used correctly and the sentence is complete." },
        { s: "The handler wore a green jacket and a silver badge.", opts: ["No error", "under", "because"], a: 0, skill: "adjectives", why: "Green and silver describe the nouns correctly." },
        { s: "The ladder stood beside the wash bay wall.", opts: ["under", "No error", "The"], a: 1, skill: "prepositions", why: "Beside is the correct preposition and the sentence already works." }
      ]
    },
    fix: {
      para1: {
        items: [
          {
            tokens: [
              { t: "our", slot: "cap1", need: "cap" },
              { t: "coach" }, { t: "waited" }, { t: "near" }, { t: "the" }, { t: "arena" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "after", slot: "cap1", need: "cap" },
              { t: "morning" }, { t: "roll" }, { slot: "comma1", need: "comma" },
              { t: "we" }, { t: "stacked" }, { t: "the" }, { t: "poles" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "the", slot: "cap1", need: "cap" },
              { t: "rider" }, { t: "borrowed" }, { t: "her" }, { t: "friends", slot: "apos1", need: "apos", c: "friend's" }, { t: "helmet" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "when", slot: "cap1", need: "cap" },
              { t: "the" }, { t: "bell" }, { t: "rang" }, { slot: "comma1", need: "comma" },
              { t: "everyone" }, { t: "walked" }, { t: "inside" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "i", slot: "cap1", need: "cap" },
              { t: "rinsed" }, { t: "the" }, { t: "sponges" }, { slot: "comma1", need: "comma" },
              { t: "then" }, { t: "I" }, { t: "hung" }, { t: "them" }, { t: "up" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "the", slot: "cap1", need: "cap" },
              { t: "trainers", slot: "apos1", need: "apos", c: "trainer's" }, { t: "clipboard" }, { t: "sat" }, { t: "on" }, { t: "the" }, { t: "chair" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "before", slot: "cap1", need: "cap" },
              { t: "the" }, { t: "lesson" }, { slot: "comma1", need: "comma" },
              { t: "the" }, { t: "gelding" }, { t: "pawed" }, { t: "the" }, { t: "ground" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "the", slot: "cap1", need: "cap" },
              { t: "ponys", slot: "apos1", need: "apos", c: "pony's" }, { t: "blanket" }, { t: "looked" }, { t: "too" }, { t: "warm" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "while", slot: "cap1", need: "cap" },
              { t: "we" }, { t: "waited" }, { slot: "comma1", need: "comma" },
              { t: "the" }, { t: "wind" }, { t: "shook" }, { t: "the" }, { t: "sign" },
              { slot: "end1", need: "end" }
            ]
          },
          {
            tokens: [
              { t: "the", slot: "cap1", need: "cap" },
              { t: "wash" }, { t: "bay" }, { t: "floor" }, { t: "looked" }, { t: "slippery" },
              { slot: "end1", need: "end" }
            ]
          }
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
          { t: "during", slot: "cap1", need: "cap" },
          { t: "recess" }, { t: "Lena" }, { t: "borrowed" }, { t: "her" },
          { t: "sisters", slot: "apos1", need: "apos", c: "sister's" },
          { t: "gloves" }, { slot: "end1", need: "end" },
          { t: "after", slot: "cap2", need: "cap" }, { t: "the" }, { t: "lesson" }, { slot: "comma1", need: "comma" }, { t: "she" }, { t: "returned" }, { t: "them" }, { t: "carefully" },
          { slot: "end2", need: "end" }
        ],
        chips: [
          { k: "cap", label: "Capital letter", skill: "capitals" },
          { k: "end", label: "Full stop .", skill: "end-punctuation" },
          { k: "comma", label: "Comma ,", skill: "commas" },
          { k: "apos", label: "Apostrophe '", skill: "apostrophes" }
        ]
      }
    },
    tense: {
      tense1: [
        { s: "Last night we scrubbed the wash bay.", a: 0, why: "Last night and scrubbed point to the past." },
        { s: "The pony is nudging the bucket now.", a: 1, why: "Is nudging is happening right now." },
        { s: "Next month we will trail ride again.", a: 2, why: "Will trail ride points to the future." },
        { s: "She checks the latches every afternoon.", a: 1, why: "This happens regularly, so it is present." },
        { s: "The dog slept under the float.", a: 0, why: "Slept is the past form of sleep." },
        { s: "They are going to repaint the rails.", a: 2, why: "Are going to shows a future plan." },
        { s: "I folded the rugs and stacked the towels.", a: 0, why: "Folded and stacked are both past forms." },
        { s: "He stands near the arena gate.", a: 1, why: "Stands describes what is happening now." },
        { s: "We shall practise over the poles tomorrow.", a: 2, why: "Shall practise points to a future event." },
        { s: "The mare waited beside the creek.", a: 0, why: "Waited is the past form of wait." }
      ]
    },
    rewrite: {
      rewrite1: [
        {
          source: "The rider checks the stirrup leather.",
          target: "Past tense",
          answers: ["The rider checked the stirrup leather."],
          hint: "Change checks to its past form.",
          why: "Checks changes to checked in the past tense."
        },
        {
          source: "We washed the bridles.",
          target: "Future tense",
          answers: ["We will wash the bridles."],
          hint: "Add a future helper word before wash.",
          why: "Will wash shows the future."
        },
        {
          source: "She will carry the cones.",
          target: "Present tense",
          answers: ["She carries the cones."],
          hint: "Remove the future helper and use the present form of the verb.",
          why: "Carries is the present tense form."
        },
        {
          source: "The floats line the driveway.",
          target: "Past tense",
          answers: ["The floats lined the driveway."],
          hint: "Turn line into its past form.",
          why: "Line changes to lined."
        },
        {
          source: "I fixed the gate latch.",
          target: "Future tense",
          answers: ["I will fix the gate latch."],
          hint: "Use will with the base verb.",
          why: "Will fix points to the future."
        },
        {
          source: "The class is warming up.",
          target: "Past tense",
          answers: ["The class was warming up."],
          hint: "Keep the action in progress but move it to the past.",
          why: "Is warming changes to was warming."
        }
      ]
    },
    join: {
      join1: [
        { left: "Ella gathered the towels", right: "she wheeled them to the wash bay", opts: ["and", "because", "under"], a: 0, skill: "compound", why: "And joins the two actions clearly." },
        { left: "The gelding backed away", right: "the tarp fluttered above him", opts: ["because", "but", "without"], a: 0, skill: "compound", why: "Because shows the reason." },
        { left: "We can clean the gear", right: "we can sweep the aisle first", opts: ["or", "quietly", "behind"], a: 0, skill: "conjunctions", why: "Or gives a choice." },
        { left: "Sam felt nervous", right: "he answered the question anyway", opts: ["but", "under", "before"], a: 0, skill: "conjunctions", why: "But shows the contrast." },
        { left: "The latch jammed", right: "Noah fetched the oil", opts: ["so", "while", "dusty"], a: 0, skill: "compound", why: "So shows the result." },
        { left: "The mare lowered her head", right: "the rider rubbed her neck", opts: ["while", "onto", "careful"], a: 0, skill: "conjunctions", why: "While links the actions happening at the same time." },
        { left: "The bell rang", right: "the class headed to the yard", opts: ["then", "because", "under"], a: 0, skill: "compound", why: "Then shows what happened next." },
        { left: "You may hose the bay", right: "you must dry the floor after", opts: ["and", "toward", "slowly"], a: 0, skill: "compound", why: "And joins the two instructions." },
        { left: "The rope was tangled", right: "Piper shook it loose", opts: ["so", "beneath", "striped"], a: 0, skill: "compound", why: "So links the problem and the result." },
        { left: "The sky brightened", right: "the riders unpacked again", opts: ["and", "because", "inside"], a: 0, skill: "compound", why: "And joins the two events in sequence." }
      ]
    },
    select: {
      subverb1: [
        { words: ["The", "groom", "lifted", "the", "saddle", "carefully."], subject: 1, verb: 2, why: "Groom is the subject, and lifted is the verb." },
        { words: ["Maple", "waited", "beside", "the", "wash", "bay."], subject: 0, verb: 1, why: "Maple is the subject, and waited is the verb." },
        { words: ["Her", "teacher", "marked", "three", "responses."], subject: 1, verb: 2, why: "Teacher is doing the marking." },
        { words: ["The", "students", "carried", "cones", "across", "the", "arena."], subject: 1, verb: 2, why: "Students is the subject, and carried is the action." },
        { words: ["Noah", "closed", "the", "float", "door."], subject: 0, verb: 1, why: "Noah is the subject and closed is the verb." },
        { words: ["The", "ladder", "rested", "against", "the", "wall."], subject: 1, verb: 2, why: "Ladder is the subject, and rested tells what it did." }
      ]
    },
    sort: {
      parts1: [
        {
          sentence: ["The", "patient", "trainer", "guided", "the", "class."],
          tokens: [
            { word: "patient", target: "adjective" },
            { word: "trainer", target: "noun" },
            { word: "guided", target: "verb" }
          ],
          columns: [
            { key: "noun", label: "Noun" },
            { key: "verb", label: "Verb" },
            { key: "adjective", label: "Adjective" }
          ],
          skills: ["nouns", "verbs", "adjectives"],
          why: "Trainer names the person, guided is the action, and patient describes the trainer."
        },
        {
          sentence: ["A", "restless", "colt", "nudged", "the", "bucket."],
          tokens: [
            { word: "restless", target: "adjective" },
            { word: "colt", target: "noun" },
            { word: "nudged", target: "verb" }
          ],
          columns: [
            { key: "noun", label: "Noun" },
            { key: "verb", label: "Verb" },
            { key: "adjective", label: "Adjective" }
          ],
          skills: ["nouns", "verbs", "adjectives"],
          why: "Colt is the noun, nudged is the verb, and restless describes the colt."
        },
        {
          sentence: ["The", "stable", "captain", "checked", "a", "loose", "strap."],
          tokens: [
            { word: "captain", target: "noun" },
            { word: "checked", target: "verb" },
            { word: "loose", target: "adjective" }
          ],
          columns: [
            { key: "noun", label: "Noun" },
            { key: "verb", label: "Verb" },
            { key: "adjective", label: "Adjective" }
          ],
          skills: ["nouns", "verbs", "adjectives"],
          why: "Captain names the person, checked is the action, and loose describes the strap."
        },
        {
          sentence: ["Our", "cheerful", "friend", "carried", "the", "mail."],
          tokens: [
            { word: "cheerful", target: "adjective" },
            { word: "friend", target: "noun" },
            { word: "carried", target: "verb" }
          ],
          columns: [
            { key: "noun", label: "Noun" },
            { key: "verb", label: "Verb" },
            { key: "adjective", label: "Adjective" }
          ],
          skills: ["nouns", "verbs", "adjectives"],
          why: "Friend is the noun, carried is the verb, and cheerful describes the friend."
        },
        {
          sentence: ["That", "steady", "mare", "waited", "near", "the", "float."],
          tokens: [
            { word: "steady", target: "adjective" },
            { word: "mare", target: "noun" },
            { word: "waited", target: "verb" }
          ],
          columns: [
            { key: "noun", label: "Noun" },
            { key: "verb", label: "Verb" },
            { key: "adjective", label: "Adjective" }
          ],
          skills: ["nouns", "verbs", "adjectives"],
          why: "Mare names the animal, waited is the action, and steady describes the mare."
        }
      ]
    },
    build: {
      expand1: [
        {
          base: "The rider waited.",
          template: "The {{0}} rider waited {{1}}.",
          groups: [
            { label: "Choose a describing word", opts: ["patient", "between", "rinsed"], a: 0 },
            { label: "Choose an extra detail", opts: ["outside the arena", "without helmet", "because"], a: 0 }
          ],
          why: "A stronger sentence adds detail that still makes sense."
        },
        {
          base: "Mila led the horse.",
          template: "Mila {{0}} led the {{1}} horse.",
          groups: [
            { label: "Choose an adverb", opts: ["slowly", "under", "bucket"], a: 0 },
            { label: "Choose an adjective", opts: ["nervous", "through", "jumped"], a: 0 }
          ],
          why: "Slowly tells how Mila led the horse, and nervous describes the horse."
        },
        {
          base: "We walked inside.",
          template: "We walked inside {{0}} {{1}}.",
          groups: [
            { label: "Choose a place phrase", opts: ["through the side gate", "dusty", "and"], a: 0 },
            { label: "Choose a time phrase", opts: ["before the rain", "helmet", "waited"], a: 0 }
          ],
          why: "The extra phrases tell where and when the action happened."
        },
        {
          base: "The coach smiled.",
          template: "The {{0}} coach smiled {{1}}.",
          groups: [
            { label: "Choose an adjective", opts: ["relieved", "onto", "trotted"], a: 0 },
            { label: "Choose an adverb", opts: ["warmly", "bucket", "under"], a: 0 }
          ],
          why: "Relieved describes the coach, and warmly tells how the coach smiled."
        }
      ]
    },
    review: {
      review1: {
        items: [
          { kind: "choice", prompt: "Choose the sentence with the correct pronoun.", opts: ["Them waited by the float.", "They waited by the float.", "They waits by the float."], a: 1, skill: "pronouns", why: "They is the correct subject pronoun here." },
          { kind: "choice", prompt: "Which word is a conjunction?", opts: ["bright", "while", "saddle"], a: 1, skill: "conjunctions", why: "While joins one idea to another." },
          { kind: "choice", prompt: "Pick the sentence in the future tense.", opts: ["We stacked the poles.", "We stack the poles.", "We will stack the poles."], a: 2, skill: "tense", why: "Will stack is the future form." },
          { kind: "binary", prompt: "Is this a complete sentence or a fragment?", sentence: "Because the horse heard thunder.", opts: ["Complete sentence", "Fragment"], a: 1, skill: "fragments", why: "It still needs a main idea to finish the thought." },
          { kind: "choice", prompt: "Which word is a preposition?", opts: ["inside", "gently", "steady"], a: 0, skill: "prepositions", why: "Inside shows position." },
          { kind: "choice", prompt: "Which sentence uses an adjective correctly?", opts: ["The calmly rider waited.", "The patient rider waited.", "The rider patient waited."], a: 1, skill: "adjectives", why: "Patient describes the rider in the right place." },
          { kind: "choice", prompt: "Which sentence is joined well?", opts: ["The rope snapped because we fetched another one.", "The rope snapped, and we fetched another one.", "The rope snapped but we fetched another one."], a: 1, skill: "compound", why: "The two ideas are joined clearly with and." }
        ]
      }
    },
    passages: {
      passage1: {
        title: "The Quiet Horse by the Creek",
        textType: "Short story",
        sourceNote: "Original text written for PaperPanda.",
        paragraphs: [
          "Every afternoon, Aria crossed the short bridge behind the stables to check the far creek paddock. The same chestnut horse stood there each day, always at the edge of the shade, always watching the water before he noticed anyone else.",
          "Unlike the other horses, Copper never hurried to the fence. He waited until Aria stopped, spoke softly, and held out her hand. Then he would walk over in slow steps, lower his head, and sniff her sleeve as if checking whether she could be trusted that day.",
          "One windy Tuesday, a branch crashed into the creek with a sudden splash. The nearby horses jumped sideways, but Copper only lifted his ears and stepped behind Aria. She was surprised. She had thought she was the one helping him feel brave.",
          "After that, Aria understood something new. Trust did not mean the horse stopped feeling unsure. It meant he had started believing she was a safe place to stand when the world changed too quickly."
        ],
        questions: [
          { skill: "facts", q: "What was the chestnut horse called?", opts: ["Shadow", "Copper", "Creek", "Rusty"], a: 1, ev: "paragraph 2", why: "The second paragraph identifies the horse as Copper." },
          { skill: "sequence", q: "What did Copper do before walking to Aria?", opts: ["He ran to the bridge", "He sniffed the water", "He waited while she stopped and spoke softly", "He hid behind a tree"], a: 2, ev: "paragraph 2", why: "Copper waited until Aria stopped and spoke softly." },
          { skill: "cause", q: "Why did the nearby horses jump sideways?", opts: ["Aria waved at them", "A branch crashed into the creek", "Copper neighed loudly", "The gate swung open"], a: 1, ev: "paragraph 3", why: "The splash from the falling branch startled them." },
          { skill: "vocabulary", q: "In paragraph 2, trusted means…", opts: ["believed someone was safe", "moved very fast", "wanted more food", "stood near the fence"], a: 0, ev: "paragraph 2", why: "Copper was checking whether Aria was safe and reliable." },
          { skill: "inference", q: "Why was Aria surprised when Copper stepped behind her?", opts: ["She thought only she was helping him", "She wanted him to leave", "She did not know he liked the creek", "She thought he would run away forever"], a: 0, ev: "paragraph 3", why: "She realised Copper was leaning on her for safety." },
          { skill: "main-idea", q: "What is the story mainly about?", opts: ["Crossing a bridge every day", "Learning that trust can go both ways", "Stopping horses from drinking", "Fixing a broken paddock"], a: 1, ev: "the whole passage", why: "The story builds toward Aria understanding how trust worked between them." }
        ]
      },
      passage2: {
        title: "The Bell on the Hill Track",
        textType: "Folktale",
        sourceNote: "Original folktale written for PaperPanda.",
        paragraphs: [
          "Long ago, the hill track above Red Gum Valley was used by farmers, drovers, and children walking between homes. At the top of the track stood a wide iron bell tied to an old post. People said it should only be rung when the path below was unsafe.",
          "A careful girl named Nessa lived near the bell. Her cousin Bram laughed at the rule and said the valley people worried too much. One foggy morning he rang the bell just to hear the sound roll across the hills. Doors opened all along the track, and people rushed outside expecting trouble.",
          "When they learned Bram had rung it as a joke, no one cheered. The blacksmith told him that warnings only work when people trust them. Bram felt ashamed, but Nessa said feeling sorry was not enough. He would need to prove he understood.",
          "Two weeks later, heavy rain loosened stones above the track. Bram saw them first. This time he rang the bell and kept ringing until everyone below heard it. Because the warning came early, the travellers turned back before the stones slid across the path."
        ],
        questions: [
          { skill: "facts", q: "Where was the iron bell tied?", opts: ["To a fence beside the creek", "To an old post on the hill track", "Inside the blacksmith's shop", "Above Nessa's door"], a: 1, ev: "paragraph 1", why: "The first paragraph says the bell stood tied to an old post." },
          { skill: "sequence", q: "What happened after Bram rang the bell as a joke?", opts: ["The rain started", "People rushed outside expecting danger", "Nessa left the valley", "The bell broke"], a: 1, ev: "paragraph 2", why: "The sound made people rush outside." },
          { skill: "compare", q: "How were Nessa and Bram different at the start?", opts: ["Nessa respected the warning, but Bram mocked it", "Nessa was younger, but Bram was older", "Nessa lived far away, but Bram did not", "Nessa feared bells, but Bram did not"], a: 0, ev: "paragraph 2", why: "Nessa was careful while Bram laughed at the rule." },
          { skill: "vocabulary", q: "In paragraph 3, ashamed means…", opts: ["proud of a good choice", "sorry and embarrassed about a wrong action", "excited for the next day", "confused by a sign"], a: 1, ev: "paragraph 3", why: "Bram felt bad after misusing the bell." },
          { skill: "inference", q: "Why did the warning help in paragraph 4?", opts: ["The bell was louder than before", "People still trusted the signal enough to act", "The rain stopped quickly", "Nessa carried everyone away"], a: 1, ev: "paragraphs 3 and 4", why: "The bell worked because people treated it as a real warning." },
          { skill: "main-idea", q: "What is the main lesson of the folktale?", opts: ["Bells should ring every morning", "A warning matters only when it is used honestly", "Rain always causes landslides", "Cousins should never argue"], a: 1, ev: "the whole passage", why: "The story shows why honesty matters when warning others." }
        ]
      },
      passage3: {
        title: "Why Horses Swish Their Tails",
        textType: "Informational text",
        sourceNote: "Original non-fiction passage written for PaperPanda.",
        paragraphs: [
          "A horse's tail is useful for more than appearance. On warm days, the tail helps brush away flies and other insects. The long hairs move quickly enough to protect the horse's sides, legs, and belly without making the animal stop grazing or walking.",
          "Tail movement can also give people clues. A relaxed swish may simply mean the horse is chasing insects. A sharp, repeated lash can be different. It may show irritation, discomfort, or frustration, especially if the horse is also pinning its ears or tightening its body.",
          "Riders and handlers should look at the whole horse, not just one signal. For example, a horse might swish its tail once during a ride because a fly landed near its flank. That is not the same as a horse lashing its tail again and again while stepping away from the saddle.",
          "Understanding tail movement helps people respond better. Instead of guessing, they can check the environment, the tack, or the horse's body language before deciding what the tail movement means."
        ],
        questions: [
          { skill: "facts", q: "What does a horse use its tail to brush away?", opts: ["Dust clouds", "Insects", "Mud", "Loose hay"], a: 1, ev: "paragraph 1", why: "The passage says the tail brushes away flies and insects." },
          { skill: "cause", q: "Why might a horse lash its tail repeatedly?", opts: ["It is always happy", "It may feel irritated or uncomfortable", "It wants to sleep", "It is trying to jump higher"], a: 1, ev: "paragraph 2", why: "Repeated lashing can show irritation, discomfort, or frustration." },
          { skill: "vocabulary", q: "In paragraph 3, flank means…", opts: ["the horse's side", "the saddle cloth", "the stable wall", "the riding arena"], a: 0, ev: "paragraph 3", why: "The context shows it means the side of the horse's body." },
          { skill: "inference", q: "Why does the writer say to look at the whole horse?", opts: ["One signal can have more than one meaning", "Tails are difficult to see", "Horses dislike being watched", "Riders should ignore insects"], a: 0, ev: "paragraphs 2 and 3", why: "The same tail movement can mean different things in different situations." },
          { skill: "purpose", q: "What is the writer's main purpose in this passage?", opts: ["To tell a funny story", "To explain what tail movement can show", "To sell riding equipment", "To describe one horse race"], a: 1, ev: "the whole passage", why: "The passage explains information about tail movement and how to interpret it." },
          { skill: "main-idea", q: "What is the main idea of the passage?", opts: ["All tail swishes mean anger", "Tail movement can protect horses and give useful clues", "Flies are dangerous for every horse", "Saddles should always be removed"], a: 1, ev: "the whole passage", why: "Each paragraph explains a different reason tail movement matters." }
        ]
      },
      passage4: {
        title: "The Last Gate Before Dusk",
        textType: "Narrative",
        sourceNote: "Original narrative written for PaperPanda.",
        paragraphs: [
          "The class was nearly finished when Mr Dale reminded everyone about the back paddock gate. It had to be checked before dark because the youngest horses had been moved there that afternoon. Most of the riders were already unsaddling, but Ivy volunteered to go with Hamish and make sure it was latched.",
          "At first the job seemed easy. They crossed the yard, passed the wash bay, and followed the fence line until the trees opened into the far paddock. Then they saw the problem. The gate was shut, but a thick vine had twisted through the latch and pulled it half sideways.",
          "Hamish wanted to tug the vine loose quickly, but Ivy stopped him. She noticed that one foal was standing too close behind the gate. Instead, she walked a few steps away, clicked her tongue softly, and waited until the foal followed her toward the feed bin. Only then did Hamish clear the vine and fasten the latch properly.",
          "On the walk back, Hamish admitted he had almost made the job harder by rushing. Ivy shrugged and said she had only remembered what their teacher always repeated: safe riders look at the whole situation first. Behind them, the gate stayed still in the evening wind."
        ],
        questions: [
          { skill: "facts", q: "Who volunteered to check the back paddock gate?", opts: ["Mr Dale and Hamish", "Ivy and Hamish", "The youngest horses", "The farrier and Ivy"], a: 1, ev: "paragraph 1", why: "Ivy volunteered to go with Hamish." },
          { skill: "sequence", q: "What did Ivy do before Hamish cleared the vine?", opts: ["She ran back to the yard", "She opened the feed room", "She moved the foal away from the gate", "She called Mr Dale on the phone"], a: 2, ev: "paragraph 3", why: "She distracted the foal toward the feed bin first." },
          { skill: "cause", q: "Why did Ivy stop Hamish from pulling the vine straight away?", opts: ["She wanted the job to take longer", "A foal was standing too close behind the gate", "The latch was already fixed", "The gate had disappeared"], a: 1, ev: "paragraph 3", why: "The foal's position made it unsafe to rush." },
          { skill: "vocabulary", q: "In paragraph 2, twisted means…", opts: ["wrapped around", "painted over", "dropped below", "locked forever"], a: 0, ev: "paragraph 2", why: "The vine had wrapped itself through the latch." },
          { skill: "inference", q: "What does Hamish's final comment show?", opts: ["He was angry about walking", "He understood why rushing was risky", "He wanted Ivy to do every job", "He disliked the youngest horses"], a: 1, ev: "paragraph 4", why: "He realised he nearly made the situation worse by hurrying." },
          { skill: "main-idea", q: "What is the story mainly about?", opts: ["Learning to look carefully before acting", "Repairing every fence on the property", "Finding a missing horse", "Walking home after dusk"], a: 0, ev: "the whole passage", why: "The whole story builds around careful observation before action." },
          { skill: "compare", q: "How were Ivy and Hamish similar in the story?", opts: ["Both wanted the gate secure", "Both ignored the foal", "Both refused to help", "Both got lost in the trees"], a: 0, ev: "paragraphs 1 to 3", why: "Both wanted to finish the job safely, even if they approached it differently." },
          { skill: "facts", q: "What had twisted through the latch?", opts: ["A rope", "A vine", "A chain", "A towel"], a: 1, ev: "paragraph 2", why: "The second paragraph says a thick vine had twisted through the latch." }
        ]
      },
      passage5: {
        title: "The New Shade Shelter",
        textType: "Challenge passage",
        sourceNote: "Original mixed-skills passage written for PaperPanda.",
        paragraphs: [
          "At the start of summer, the riding school built a new shade shelter beside the warm-up yard. The shelter was simple: four timber posts, a broad roof, and a shallow gravel floor underneath. The staff hoped it would keep riders cooler during breaks and give younger siblings a better place to wait.",
          "Some families loved the idea immediately, but others were unsure. They worried the shelter might block the view of the yard or create noise if children gathered there during lessons. Mr Tran, the school manager, listened to those concerns instead of dismissing them.",
          "During the first week, he tried several small changes. Benches were moved farther back from the fence, and a sign was added asking visitors to keep voices low while classes were running. He also invited parents to stand in different spots so they could compare the old view with the new one.",
          "By the end of the month, most families agreed the shelter had helped more than it had hindered. Riders spent less time standing in direct sun, younger children were less restless, and the yard remained easy to watch. The result did not come from one big argument. It came from testing practical changes and listening carefully to what people noticed."
        ],
        questions: [
          { skill: "facts", q: "What floor surface was under the new shelter?", opts: ["Concrete", "Gravel", "Grass", "Rubber"], a: 1, ev: "paragraph 1", why: "The first paragraph says the floor underneath was gravel." },
          { skill: "cause", q: "Why were some families unsure about the shelter at first?", opts: ["They thought it might block the view or create noise", "They wanted more horses instead", "They disliked summer weather", "They could not find the warm-up yard"], a: 0, ev: "paragraph 2", why: "Their concerns were about view and noise." },
          { skill: "sequence", q: "What did Mr Tran do after hearing families' concerns?", opts: ["He removed the shelter", "He tried small practical changes", "He closed the riding school", "He ignored everyone"], a: 1, ev: "paragraph 3", why: "He responded by testing changes like moving benches and adding a sign." },
          { skill: "vocabulary", q: "In paragraph 4, hindered means…", opts: ["helped completely", "caused trouble or made something harder", "looked attractive", "cost too much money"], a: 1, ev: "paragraph 4", why: "The context contrasts helped with hindered, meaning made things harder." },
          { skill: "inference", q: "Why did Mr Tran invite parents to stand in different spots?", opts: ["He wanted them to leave early", "He wanted them to compare the view fairly", "He wanted the shelter painted", "He needed help building benches"], a: 1, ev: "paragraph 3", why: "He wanted people to judge the change using real comparison." },
          { skill: "main-idea", q: "What is the passage mainly about?", opts: ["Building the largest shelter possible", "Solving a practical problem by listening and adjusting", "Stopping families from watching lessons", "Teaching children to sit quietly"], a: 1, ev: "the whole passage", why: "The passage shows a change being improved through feedback and testing." },
          { skill: "compare", q: "How were the families different at first?", opts: ["Some approved quickly while others had concerns", "All families wanted the shelter removed", "All families refused to use the benches", "No one noticed the shelter"], a: 0, ev: "paragraph 2", why: "The passage says some loved the idea at once while others were unsure." },
          { skill: "purpose", q: "What was the writer's purpose in this passage?", opts: ["To explain how feedback helped improve a new shelter", "To entertain readers with a race story", "To complain about warm weather", "To persuade people to stop lessons"], a: 0, ev: "the whole passage", why: "The passage explains a problem, the response, and the result." },
          { skill: "facts", q: "What was added to help keep the area quieter?", opts: ["A second roof", "A sign asking visitors to keep voices low", "A locked gate", "A new water trough"], a: 1, ev: "paragraph 3", why: "The sign asked visitors to keep voices low." },
          { skill: "cause", q: "Why were younger children less restless by the end of the month?", opts: ["They were sent home early", "They had a better place to wait out of the sun", "They could ride in the yard", "They were told not to move"], a: 1, ev: "paragraphs 1 and 4", why: "The shelter gave them a better waiting place." },
          { skill: "inference", q: "What does paragraph 4 suggest about the final result?", opts: ["It depended on one loud argument", "It came from observing and adjusting over time", "It failed to help anyone", "It only mattered to the manager"], a: 1, ev: "paragraph 4", why: "The writer says the result came from testing changes and listening carefully." },
          { skill: "main-idea", q: "Which sentence best summarises the whole passage?", opts: ["A new shelter raised concerns, staff tested changes, and the final result worked well.", "Families refused to return to the riding school.", "The shelter blocked every lesson and had to be removed.", "Children built the shelter without help."], a: 0, ev: "the whole passage", why: "That option captures the concern, response, and positive outcome." }
        ]
      }
    }
  }
};
