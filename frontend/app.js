const accountsStorageKey = "studylift-accounts";
const sessionStorageKey = "studylift-session";
const authTokenStorageKey = "paperpanda-session-token";
const subjectsStorageKey = "paperpanda-subjects-by-account";
const settingsStorageKey = "studylift-settings";
const uiVersionStorageKey = "paperpanda-ui-version";
const currentUiVersion = "2026-06-25-spelling-ui-refresh";
const previewDatabaseName = "paperpanda-assets";
const previewStoreName = "document-previews";
const settingsAssetStoreName = "settings-assets";
const FOCUS_MODE_STORAGE_KEY = "paperpanda.focusMode";
const GOOGLE_DOCS_SCOPE = "https://www.googleapis.com/auth/documents";
const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-client";
const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";

function resolveDefaultApiBaseUrl() {
  const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  const { protocol, hostname } = window.location;
  if (protocol === "file:") {
    return "http://localhost:3001";
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:3001`;
  }

  return "";
}

const API_BASE_URL = resolveDefaultApiBaseUrl();
const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
let pdfjsLibPromise = null;
let jsZipPromise = null;
let currentAudioPlayback = null;
let currentAudioObjectUrl = "";
let previewDatabasePromise = null;
let currentListenSessionId = 0;
let currentAudioContext = "";
let currentSpeechRecognition = null;
let remoteSubjectsSaveQueuedSnapshot = null;
let remoteSubjectsSaveInFlight = false;
let remoteSettingsSaveQueuedSnapshot = null;
let remoteSettingsSaveInFlight = false;
let googleIdentityClientPromise = null;
const defaultGrade = "7";
const defaultPageBackgroundColor = "#FBF7F0";
const documentQuizPassPoints = 10;
const pandaEmojiChoices = [
  { id: "angry", label: "Angry", src: "/panda-emojis/panda-angry-256.png" },
  { id: "confused", label: "Confused", src: "/panda-emojis/panda-confused-256.png" },
  { id: "cowboy", label: "Cowboy", src: "/panda-emojis/panda-cowboy-256.png" },
  { id: "explode", label: "Explode", src: "/panda-emojis/panda-explode-256.png" },
  { id: "hearts", label: "Hearts", src: "/panda-emojis/panda-hearts-256.png" },
  { id: "paint", label: "Paint", src: "/panda-emojis/panda-paint-256.png" },
  { id: "party", label: "Party", src: "/panda-emojis/panda-party-256.png" },
  { id: "shades", label: "Shades", src: "/panda-emojis/panda-shades-256.png" },
  { id: "spew", label: "Spew", src: "/panda-emojis/panda-spew-256.png" },
  { id: "yawn", label: "Yawn", src: "/panda-emojis/panda-yawn-256.png" },
  { id: "happy", label: "Happy", src: "/panda-emojis-2ndedition/panda-happy-256.png" },
  { id: "smart", label: "Smart", src: "/panda-emojis-2ndedition/panda-smart-256.png" },
  { id: "sick", label: "Sick", src: "/panda-emojis-2ndedition/panda-sick-256.png" },
  { id: "crying", label: "Crying", src: "/panda-emojis-2ndedition/panda-crying-256.png" },
  { id: "dead", label: "Dead", src: "/panda-emojis-2ndedition/panda-dead-256.png" },
  { id: "swear", label: "Swear", src: "/panda-emojis-2ndedition/panda-swear-256.png" }
];

const subjectSeed = [
  {
    id: "maths",
    name: "Maths and Numeracy",
    focus: "number strategies, problem solving, and clear working",
    summary: "Keep formulas, worked examples, and revision sheets together before quizzes.",
    practice: [
      {
        title: "Number fluency",
        tag: "Warm-up",
        description: "Complete 10 short problems and explain each working step aloud."
      },
      {
        title: "Fraction check-in",
        tag: "Core skill",
        description: "Convert between fractions, decimals, and percentages using one method each."
      },
      {
        title: "Reasoning challenge",
        tag: "Stretch",
        description: "Write one sentence explaining why your answer is correct."
      }
    ],
    documents: [
      {
        id: "maths-doc-1",
        title: "Integers revision sheet",
        type: "Worksheet",
        added: "20 May",
        content:
          "Topic: Integers\n\n1. Add and subtract negative numbers carefully.\n2. Show your number line jumps.\n3. Check whether your answer should be larger or smaller than the first number."
      },
      {
        id: "maths-doc-2",
        title: "Algebra Week 1",
        type: "Class notes",
        added: "18 May",
        content:
          "Week 1\nUse letters to represent unknown values.\nSubstitute carefully.\nUnderline the operation before solving.\n\nExample:\nIf x = 4, then 3x + 2 = 14."
      }
    ],
    assessments: [
      seededAssessment("1", "Assignment", "Term 1 Week 8", "Term 1 Week 10", "20%"),
      seededAssessment("2", "Semester Test", "Term 2 Week 5", "Term 2 Week 7", "30%"),
      seededAssessment("3", "Term Test", "Term 3 Week 7", "Term 3 Week 9", "20%"),
      seededAssessment("4", "Yearly Examination", "Term 4 Week 3", "Term 4 Weeks 5/6", "30%")
    ]
  },
  {
    id: "english",
    name: "English",
    focus: "reading, writing, vocabulary, and structured responses",
    summary: "Use linked documents to keep rubrics, drafts, and teacher feedback beside each task.",
    practice: [
      {
        title: "Vocabulary",
        tag: "Word study",
        description: "Unpack unfamiliar words, meanings, and examples before using them in writing."
      },
      {
        title: "Writing",
        tag: "Drafting",
        description: "Write one clear paragraph with a topic sentence, evidence, and explanation."
      },
      {
        title: "Grammar",
        tag: "Editing",
        description: "Fix punctuation, verb tense, and sentence boundaries in a short passage."
      }
    ],
    documents: [
      {
        id: "english-doc-1",
        title: "Narrative writing Week 1",
        type: "Class notes",
        added: "19 May",
        content:
          "Week 1\nFocus on building character voice.\nDescribe actions and choices instead of listing traits.\nAdd one line of dialogue that reveals emotion."
      },
      {
        id: "english-doc-2",
        title: "Narrative writing Week 2",
        type: "Class notes",
        added: "19 May",
        content:
          "Week 2\nUse paragraph breaks when the setting or speaker changes.\nBuild tension with shorter sentences near the problem.\nCheck that the ending links back to the conflict."
      },
      {
        id: "english-doc-3",
        title: "Persuasive speech rubric",
        type: "Rubric",
        added: "17 May",
        content:
          "Criteria:\n- clear position\n- three strong reasons\n- evidence or examples\n- persuasive language\n- strong conclusion"
      }
    ],
    assessments: [
      seededAssessment("1", "Novel Study - In Class Essay", "Term 1 Week 6", "Term 1 Week 8", "20%"),
      seededAssessment("2", "Shakespearean performance and written reflection - Group", "Term 2 Week 3", "Term 2 Week 7", "20%"),
      seededAssessment("4", "Book Work", "Ongoing", "Term 1 and Term 2", "10%"),
      seededAssessment("5", "Poetry - composition and reflection - In class reflection", "Term 3 Week 1", "Term 3 Week 8", "20%"),
      seededAssessment("6", "Yearly Examination - Mythology critical paragraph and short answers", "Term 4 Week 1", "Term 4 Weeks 5/6", "20%"),
      seededAssessment("6", "Book Work", "Ongoing", "Term 3 and Term 4", "10%")
    ]
  },
  {
    id: "spelling",
    name: "Spelling",
    focus: "structured literacy, spelling patterns, morphology, and sentence transfer",
    summary: "Build spelling through sound chunks, word families, and short daily pattern practice.",
    practice: [
      {
        title: "Chunk building",
        tag: "Foal",
        description: "Build target words with sound chunks before typing them from memory."
      },
      {
        title: "Word families",
        tag: "School Horse",
        description: "Keep the root spelling stable as suffixes and endings are added."
      },
      {
        title: "Sentence transfer",
        tag: "Champion",
        description: "Use the target spelling pattern in a real sentence so it sticks."
      }
    ],
    documents: [],
    assessments: []
  },
  {
    id: "science",
    name: "Science",
    focus: "experiments, observations, and explanation using evidence",
    summary: "Keep experiment notes linked to reports so practical work is easy to revisit.",
    practice: [
      {
        title: "Lab vocabulary",
        tag: "Recall",
        description: "Match scientific terms with their definitions and use them in a conclusion."
      },
      {
        title: "Hypothesis builder",
        tag: "Planning",
        description: "Write an if-then-because hypothesis for one class experiment."
      }
    ],
    documents: [
      {
        id: "science-doc-1",
        title: "Cells overview",
        type: "Reading",
        added: "16 May",
        content:
          "Plant cells and animal cells share a nucleus, cytoplasm, and cell membrane. Plant cells also have a cell wall and chloroplasts."
      }
    ],
    assessments: [
      seededAssessment("1", "Skills Test", "Term 1 Week 6", "Term 1 Week 9", "25%"),
      seededAssessment("2", "Depth Study - Forces", "Term 2 Week 1", "Term 2 Week 6", "25%"),
      seededAssessment("3", "Classification - Zoo Enclosure", "Term 3 Week 1", "Term 3 Week 5", "25%"),
      seededAssessment("4", "Yearly Examination", "Term 4 Week 1", "Term 4 Week 5", "25%")
    ]
  },
  {
    id: "history",
    name: "History",
    focus: "chronology, source analysis, and cause and effect",
    summary: "Store source sheets beside each assessment so evidence is easy to locate.",
    practice: [
      {
        title: "Source reading",
        tag: "Analysis",
        description: "Identify who created the source, when, and why it may be useful."
      },
      {
        title: "Timeline drill",
        tag: "Chronology",
        description: "Place five events in the correct order and explain one turning point."
      }
    ],
    documents: [
      {
        id: "history-doc-1",
        title: "Ancient Egypt source pack",
        type: "Source pack",
        added: "15 May",
        content:
          "Look for clues about daily life, leadership, and belief systems. Use evidence from images and written sources in each response."
      }
    ],
    assessments: [
      seededAssessment("1", "Site Study", "Term 1 Week 3 or Term 3 Week 3", "Term 1 Week 9 or Term 3 Week 6", "50%"),
      seededAssessment("2", "Ancient Egypt - Source Skills and Yearly Examination", "Term 2 Week 1 or Term 4 Week 4", "Term 2 Week 8 or Term 4 Weeks 5/6", "50%")
    ]
  },
  {
    id: "music",
    name: "Music",
    focus: "listening, performing, notation, and reflection",
    summary: "Keep listening guides and rehearsal notes together before practical tasks.",
    practice: [
      {
        title: "Rhythm practice",
        tag: "Performance",
        description: "Clap and count a short rhythm, then perform it with steady timing."
      },
      {
        title: "Listening journal",
        tag: "Reflection",
        description: "Describe tempo, dynamics, and mood in one song."
      }
    ],
    documents: [],
    assessments: [
      seededAssessment("1", "Performance Task - Guitar or Keyboard", "Term 1 Week 2", "Term 1 Week 10", "20%"),
      seededAssessment("2", "Listening Analysis", "Term 2 Week 1", "Term 2 Week 6", "30%"),
      seededAssessment("3", "Performance Task - Guitar or Keyboard", "Term 2 Week 7", "Term 3 Week 9", "30%"),
      seededAssessment("4", "Ensemble / Composition", "Term 3 Week 3", "Term 4 Week 6", "20%")
    ]
  },
  {
    id: "pdhpe",
    name: "PDHPE",
    focus: "health, movement, teamwork, and informed decision making",
    summary: "Use uploaded notes to prepare for practical reflections and health tasks.",
    practice: [
      {
        title: "Fitness log",
        tag: "Tracking",
        description: "Record one session and reflect on effort, recovery, and goals."
      },
      {
        title: "Health scenario",
        tag: "Decision making",
        description: "Explain a safe and respectful choice in a short scenario."
      }
    ],
    documents: [],
    assessments: [
      seededAssessment("1", "In Class Task (Theory)", "Term 1 Week 3", "Term 1 Weeks 7 & 8", "25%"),
      seededAssessment("2", "Soccer (Practical)", "Term 1 Week 2", "Term 2 Week 6", "25%"),
      seededAssessment("3", "Cricket (Practical)", "Term 3 Week 2", "Term 3 Week 7", "25%"),
      seededAssessment("4", "Yearly Examination (Theory)", "Term 4 Week 1", "Term 4 Weeks 5 & 6", "25%")
    ]
  },
  {
    id: "wellbeing",
    name: "Wellbeing",
    focus: "organisation, self-management, and positive study habits",
    summary: "Use this space for planner pages, routines, and reflection notes.",
    practice: [
      {
        title: "Study planner",
        tag: "Organisation",
        description: "Break one large task into three smaller steps with dates."
      },
      {
        title: "Reflection check-in",
        tag: "Mindset",
        description: "Write what is going well and one support strategy for this week."
      }
    ],
    documents: [],
    assessments: []
  },
  {
    id: "design-tech",
    name: "Design & Technology",
    focus: "design process, materials, and documenting ideas clearly",
    summary: "Attach sketches, criteria sheets, and teacher feedback to each project task.",
    practice: [
      {
        title: "Design brief review",
        tag: "Planning",
        description: "Highlight the task goal, audience, and constraints before designing."
      },
      {
        title: "Materials match",
        tag: "Knowledge",
        description: "Choose one suitable material and justify why it fits the task."
      }
    ],
    documents: [],
    assessments: [
      seededAssessment("1", "Textiles and Digital or Design and Technology and Engineering Portfolio", "Term 1 Week 4", "Term 2 Week 4", "25%"),
      seededAssessment("2", "Textiles and Digital or Design and Technology and Engineering Practical", "Term 1 Week 4", "Term 2 Week 6", "25%"),
      seededAssessment("3", "Textiles and Digital or Design and Technology and Engineering Portfolio", "Term 3 Week 4", "Term 4 Week 4", "25%"),
      seededAssessment("4", "Textiles and Digital or Design and Technology and Engineering Practical", "Term 3 Week 4", "Term 4 Week 6", "25%")
    ]
  },
  {
    id: "art",
    name: "Art",
    focus: "visual ideas, technique, and explaining artistic choices",
    summary: "Keep inspiration boards, process notes, and criteria linked to your artworks.",
    practice: [
      {
        title: "Visual analysis",
        tag: "Looking closely",
        description: "Describe line, colour, and mood in one artwork using art terms."
      },
      {
        title: "Technique check",
        tag: "Making",
        description: "List the materials used and what effect each one creates."
      }
    ],
    documents: [],
    assessments: [
      seededAssessment("1", "Artmaking + VAPD", "Term 1 Week 2", "Term 1 Week 10", "35%"),
      seededAssessment("2", "Historical and Critical", "Term 2 Week 1", "Term 2 Week 4", "15%"),
      seededAssessment("3", "Historical and Critical", "Term 3 Week 2", "Term 3 Week 10", "15%"),
      seededAssessment("4", "Artmaking + VAPD", "Term 3 Week 2", "Term 4 Week 5", "35%")
    ]
  }
];

const subjectTemplateSeed = subjectSeed.map(({ documents, assessments, watch, askHistory, ...subject }) => ({
  ...subject,
  documents: [],
  assessments: [],
  watch: [],
  hiddenWatchUrls: [],
  askHistory: []
}));

const defaultSubjectIconMap = Object.fromEntries(
  subjectSeed.map((subject, index) => [subject.id, pandaEmojiChoices[index % pandaEmojiChoices.length].id])
);

function normalizePageBackgroundColor(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return defaultPageBackgroundColor;
  }

  if (
    normalized === "#fff" ||
    normalized === "#ffffff" ||
    normalized === "white" ||
    normalized === "rgb(255,255,255)" ||
    normalized === "rgb(255, 255, 255)" ||
    normalized === "rgba(255,255,255,1)" ||
    normalized === "rgba(255, 255, 255, 1)"
  ) {
    return defaultPageBackgroundColor;
  }

  return value;
}

function getWarmSurfaceColor() {
  return normalizePageBackgroundColor(defaultPageBackgroundColor);
}

const legacyAssessmentTemplateKeysBySubject = Object.fromEntries(
  subjectSeed.map((subject) => [
    subject.id,
    new Set(
      structuredClone(subject.assessments || []).map((assessment) =>
        [String(assessment.taskNumber || "").trim().toLowerCase(), String(assessment.componentTask || assessment.title || "").trim().toLowerCase()].join("::")
      )
    )
  ])
);

const legacyDocumentTemplateKeysBySubject = Object.fromEntries(
  subjectSeed.map((subject) => [
    subject.id,
    new Set(
      structuredClone(subject.documents || []).map((documentRecord) =>
        String(documentRecord.title || "").trim().toLowerCase()
      )
    )
  ])
);

const subjectAliasMap = {
  maths: ["Maths and Numeracy", "Maths", "Mathematics", "Numeracy"],
  english: ["English"],
  spelling: ["Spelling", "Spelling Stables"],
  science: ["Science"],
  history: ["History"],
  music: ["Music"],
  pdhpe: ["PDHPE", "PDHPE/PE", "PE", "Personal Development Health and Physical Education"],
  wellbeing: ["Wellbeing", "Well Being"],
  "design-tech": ["Design & Technology", "Design and Technology", "Design Technology", "D&T", "Design Tech"],
  art: ["Art", "Visual Arts"]
};

const FOCUS_AREAS = [
  { id: "reader", icon: "📖", label: "Read", blurb: "Read & listen" },
  { id: "homework", icon: "✎", label: "Homework", blurb: "Tasks to do" },
  { id: "spelling", icon: "Aa", label: "Spelling", blurb: "Targeted spelling practice" },
  { id: "watch", icon: "▶", label: "Watch", blurb: "Class videos" },
  { id: "assessments", icon: "🎯", label: "Assessments", blurb: "Tests & due dates" }
];

const SPELLING_STAGE_ORDER = ["diagnostic", "looks-right", "word-families", "tense-transfer"];
const SPELLING_FLASHCARDS_VERSION = 2;
const SPELLING_TENSE_TRANSFER_VERSION = 2;
const SPELLING_STAGE_LABELS = {
  diagnostic: "Diagnostic",
  "looks-right": "Looks Right",
  "word-families": "Word Families",
  "tense-transfer": "Family Recall"
};
const SPELLING_FOCUS_LABELS = {
  "over-articulation": "Over-articulation and hidden sounds",
  "word-family": "Word families and pattern transfer",
  mnemonic: "Mnemonic-worthy spellings",
  "look-right": "Visual checking: does it look right?"
};
const SPELLING_UNIT_SEED = {
  id: "spelling-progression",
  title: "Spelling Progression",
  intro:
    "Start with a spoken diagnostic, then move into visual checking, word families, and tense transfer built from the words the student actually missed.",
  diagnosticTargetCount: 20,
  followUpWordCount: 10,
  reviewDays: ["Day 1", "Day 3", "Day 7", "Day 14", "Day 30"]
};
const SPELLING_INTERVENTION_LIBRARY = {
  believe: {
    id: "believe",
    word: "believe",
    articulation: "be-lieve",
    lookRightChoiceCorrect: "be-lieve",
    lookRightChoiceWrong: "be-leive",
    focuses: ["look-right", "word-family"],
    familyWords: ["belief", "believable", "disbelieve"],
    familySentences: [
      "Her belief in the team never faded.",
      "The plan sounded believable after the evidence was explained.",
      "It is easy to disbelieve a claim without proof."
    ],
    familyNote: "Keep the base believe visible as the word changes.",
    lookRightWrong: "beleive",
    lookRightNote: "The vowel order drifts in the common error.",
    flashcardBreak: "be | lieve",
    tense: {
      present: "believe",
      past: "believed",
      future: "will believe",
      options: ["believe", "believed", "will believe", "beleive", "will believed", "belief"]
    }
  },
  describe: {
    id: "describe",
    word: "describe",
    articulation: "de-scribe",
    lookRightChoiceCorrect: "de-scribe",
    lookRightChoiceWrong: "de-sribe",
    focuses: ["word-family", "look-right"],
    familyWords: ["description", "descriptive", "describes"],
    familySentences: [
      "The description of the storm was vivid and precise.",
      "One descriptive phrase changed the whole paragraph.",
      "He describes the image in one sharp sentence."
    ],
    familyNote: "The scribe base stays visible in every family member.",
    lookRightWrong: "desribe",
    lookRightNote: "The missing c weakens the visual pattern straight away.",
    flashcardBreak: "de | scribe",
    tense: {
      present: "describe",
      past: "described",
      future: "will describe",
      options: ["describe", "described", "will describe", "desribe", "will described", "description"]
    }
  },
  decide: {
    id: "decide",
    word: "decide",
    articulation: "de-cide",
    lookRightChoiceCorrect: "de-cide",
    lookRightChoiceWrong: "de-side",
    focuses: ["word-family", "look-right"],
    familyWords: ["decision", "decisive", "deciding"],
    familySentences: [
      "Her decision was based on the strongest evidence.",
      "A decisive response can still be calm and measured.",
      "He is deciding which example proves the point best."
    ],
    familyNote: "The word family keeps the deci base even when the ending changes.",
    lookRightWrong: "deside",
    lookRightNote: "The soft c sound is still spelled with c, not s.",
    flashcardBreak: "de | cide",
    tense: {
      present: "decide",
      past: "decided",
      future: "will decide",
      options: ["decide", "decided", "will decide", "deside", "will decided", "decision"]
    }
  },
  imagine: {
    id: "imagine",
    word: "imagine",
    articulation: "im-a-gine",
    lookRightChoiceCorrect: "im-a-gine",
    lookRightChoiceWrong: "im-a-jin",
    focuses: ["over-articulation", "word-family"],
    familyWords: ["imagination", "imaginative", "imaginary"],
    familySentences: [
      "Her imagination made the opening paragraph stronger.",
      "The most imaginative detail came in the final line.",
      "The creature was imaginary but felt believable."
    ],
    familyNote: "Stretching im-ag-ine helps the vowel pattern stay visible.",
    lookRightWrong: "imajin",
    lookRightNote: "The final e and middle g are both easy to drop when it is only sounded out loosely.",
    flashcardBreak: "im | ag | ine",
    tense: {
      present: "imagine",
      past: "imagined",
      future: "will imagine",
      options: ["imagine", "imagined", "will imagine", "imajin", "will imagined", "imagination"]
    }
  },
  measure: {
    id: "measure",
    word: "measure",
    articulation: "mea-sure",
    lookRightChoiceCorrect: "mea-sure",
    lookRightChoiceWrong: "me-sure",
    focuses: ["look-right", "word-family"],
    familyWords: ["measurement", "measurable", "measures"],
    familySentences: [
      "The measurement needed to be checked twice.",
      "A measurable change appeared in the final results.",
      "She measures the fabric before cutting it."
    ],
    familyNote: "The mea start helps link measure with measurement and measurable.",
    lookRightWrong: "mesure",
    lookRightNote: "The common error loses the vowel pattern after m.",
    flashcardBreak: "mea | sure",
    tense: {
      present: "measure",
      past: "measured",
      future: "will measure",
      options: ["measure", "measured", "will measure", "mesure", "will measured", "measurement"]
    }
  },
  notice: {
    id: "notice",
    word: "notice",
    articulation: "no-tice",
    lookRightChoiceCorrect: "no-tice",
    lookRightChoiceWrong: "no-tise",
    focuses: ["look-right", "word-family"],
    familyWords: ["noticed", "noticing", "noticeable"],
    familySentences: [
      "He noticed the pattern before anyone else.",
      "She kept noticing the same spelling mistake.",
      "The improvement was noticeable in the next draft."
    ],
    familyNote: "The notice base remains stable before each new ending.",
    lookRightWrong: "notise",
    lookRightNote: "The /s/ sound is still spelled c here because of the visual family pattern.",
    flashcardBreak: "no | tice",
    tense: {
      present: "notice",
      past: "noticed",
      future: "will notice",
      options: ["notice", "noticed", "will notice", "notise", "will noticed", "noticeable"]
    }
  },
  remember: {
    id: "remember",
    word: "remember",
    articulation: "re-mem-ber",
    lookRightChoiceCorrect: "re-mem-ber",
    lookRightChoiceWrong: "re-mber",
    focuses: ["mnemonic", "word-family"],
    familyWords: ["remembers", "remembered", "remembering"],
    familySentences: [
      "She remembers the rule when she writes the paragraph.",
      "He remembered the example during the test.",
      "Remembering the base word made the spelling easier."
    ],
    familyNote: "The middle mem chunk stays fixed through every change.",
    lookRightWrong: "rember",
    lookRightNote: "The missing mem chunk breaks the pattern the eye expects.",
    flashcardBreak: "re | mem | ber",
    tense: {
      present: "remember",
      past: "remembered",
      future: "will remember",
      options: ["remember", "remembered", "will remember", "rember", "will remembered", "remembering"]
    }
  },
  appear: {
    id: "appear",
    word: "appear",
    articulation: "ap-pear",
    lookRightChoiceCorrect: "ap-pear",
    lookRightChoiceWrong: "a-pear",
    focuses: ["look-right", "word-family"],
    familyWords: ["appearance", "appearing", "disappear"],
    familySentences: [
      "The sudden appearance of the symbol mattered in the poem.",
      "The theme kept appearing across the chapter.",
      "The final clue seemed to disappear from the page."
    ],
    familyNote: "The double p stays visible across the family.",
    lookRightWrong: "apear",
    lookRightNote: "One missing p makes the word stop looking settled.",
    flashcardBreak: "ap | pear",
    tense: {
      present: "appear",
      past: "appeared",
      future: "will appear",
      options: ["appear", "appeared", "will appear", "apear", "will appeared", "appearance"]
    }
  },
  separate: {
    id: "separate",
    word: "separate",
    articulation: "sep-a-rate",
    lookRightChoiceCorrect: "sep-a-rate",
    lookRightChoiceWrong: "sep-e-rate",
    focuses: ["over-articulation", "mnemonic"],
    familyWords: ["separation", "separately", "separator"],
    familySentences: [
      "The separation between fact and opinion must stay clear.",
      "Each sentence should be checked separately.",
      "A visual separator made the notes easier to scan."
    ],
    familyNote: "Slow sep-a-rate makes the middle a audible again.",
    lookRightWrong: "seperate",
    lookRightNote: "The common error swaps the middle vowel because the word is not articulated clearly enough.",
    flashcardBreak: "sep | a | rate",
    tense: {
      present: "separate",
      past: "separated",
      future: "will separate",
      options: ["separate", "separated", "will separate", "seperate", "will separated", "separation"]
    }
  },
  achieve: {
    id: "achieve",
    word: "achieve",
    articulation: "a-chieve",
    lookRightChoiceCorrect: "a-chieve",
    lookRightChoiceWrong: "a-cheive",
    focuses: ["look-right", "word-family"],
    familyWords: ["achievement", "achievable", "achieves"],
    familySentences: [
      "Finishing the project was a real achievement.",
      "The target felt achievable after more practice.",
      "She achieves stronger results when she plans first."
    ],
    familyNote: "Keep the chieve pattern stable as the endings change.",
    lookRightWrong: "acheive",
    lookRightNote: "The common error flips the vowel order.",
    flashcardBreak: "a | chieve",
    tense: {
      present: "achieve",
      past: "achieved",
      future: "will achieve",
      options: ["achieve", "achieved", "will achieve", "acheive", "will achieved", "achievement"]
    }
  }
};
const SPELLING_DEFAULT_FOLLOW_UP_WORD_IDS = Object.keys(SPELLING_INTERVENTION_LIBRARY);
const SPELLING_DIAGNOSTIC_WORDS = [
  { id: "friend", word: "friend", yearLevel: "5", sentence: "A good friend tells the truth.", focuses: ["look-right"], articulation: "fri-end" },
  { id: "because", word: "because", yearLevel: "5", sentence: "We stayed inside because it was raining.", focuses: ["mnemonic"], articulation: "be-cause" },
  { id: "beautiful", word: "beautiful", yearLevel: "5", sentence: "The garden looked beautiful in the morning light.", focuses: ["mnemonic", "look-right"], articulation: "beau-ti-ful" },
  { id: "answer", word: "answer", yearLevel: "5", sentence: "Write the answer in a full sentence.", focuses: ["over-articulation"], articulation: "ans-wer" },
  { id: "which", word: "which", yearLevel: "5", sentence: "Which question will you answer first?", focuses: ["word-family"], articulation: "which" },
  { id: "measure", word: "measure", yearLevel: "5", sentence: "Measure the line with a ruler.", focuses: ["look-right", "word-family"], articulation: "mea-sure", interventionId: "measure" },
  { id: "believe", word: "believe", yearLevel: "5", sentence: "I believe you can solve it.", focuses: ["look-right", "word-family"], articulation: "be-lieve", interventionId: "believe" },
  { id: "imagine", word: "imagine", yearLevel: "5", sentence: "Imagine the scene before you start writing.", focuses: ["over-articulation", "word-family"], articulation: "im-ag-ine", interventionId: "imagine" },
  { id: "notice", word: "notice", yearLevel: "5", sentence: "Notice how the title hints at the theme.", focuses: ["look-right", "word-family"], articulation: "no-tice", interventionId: "notice" },
  { id: "remember", word: "remember", yearLevel: "5", sentence: "Remember to justify your answer.", focuses: ["mnemonic", "word-family"], articulation: "re-mem-ber", interventionId: "remember" },
  { id: "regular", word: "regular", yearLevel: "5", sentence: "Regular practice improves spelling.", focuses: ["over-articulation"], articulation: "reg-u-lar" },
  { id: "library", word: "library", yearLevel: "5", sentence: "The library is open before school.", focuses: ["over-articulation"], articulation: "li-brar-y" },
  { id: "wednesday", word: "Wednesday", yearLevel: "7", sentence: "The assignment is due on Wednesday.", focuses: ["over-articulation"], articulation: "Wed-nes-day" },
  { id: "island", word: "island", yearLevel: "7", sentence: "The map showed a small island offshore.", focuses: ["over-articulation", "look-right"], articulation: "iS-land" },
  { id: "necessary", word: "necessary", yearLevel: "7", sentence: "Bring the necessary equipment to science.", focuses: ["mnemonic", "look-right"], articulation: "ne-ces-sar-y" },
  { id: "embarrass", word: "embarrass", yearLevel: "7", sentence: "Mistakes should not embarrass you.", focuses: ["mnemonic", "look-right"], articulation: "em-bar-rass" },
  { id: "accommodate", word: "accommodate", yearLevel: "7", sentence: "The room can accommodate the whole class.", focuses: ["mnemonic", "look-right"], articulation: "ac-com-mo-date" },
  { id: "rhythm", word: "rhythm", yearLevel: "7", sentence: "The drummer kept a steady rhythm.", focuses: ["look-right", "mnemonic"], articulation: "rhyth-m" },
  { id: "conscience", word: "conscience", yearLevel: "7", sentence: "His conscience told him to be honest.", focuses: ["look-right"], articulation: "con-science" },
  { id: "environment", word: "environment", yearLevel: "7", sentence: "The environment changes over time.", focuses: ["over-articulation"], articulation: "en-vi-ron-ment" },
  { id: "government", word: "government", yearLevel: "7", sentence: "The government announced a new policy.", focuses: ["over-articulation"], articulation: "gov-ern-ment" },
  { id: "separate", word: "separate", yearLevel: "7", sentence: "Separate the evidence from the opinion.", focuses: ["over-articulation", "mnemonic"], articulation: "sep-a-rate", interventionId: "separate" },
  { id: "achieve", word: "achieve", yearLevel: "7", sentence: "You can achieve better results with revision.", focuses: ["look-right", "word-family"], articulation: "a-chieve", interventionId: "achieve" },
  { id: "appear", word: "appear", yearLevel: "7", sentence: "The theme will appear again in the final chapter.", focuses: ["look-right", "word-family"], articulation: "ap-pear", interventionId: "appear" },
  { id: "describe", word: "describe", yearLevel: "7", sentence: "Describe the effect of the image in one sentence.", focuses: ["word-family", "look-right"], articulation: "de-scribe", interventionId: "describe" },
  { id: "decide", word: "decide", yearLevel: "7", sentence: "Decide which example is strongest.", focuses: ["word-family", "look-right"], articulation: "de-cide", interventionId: "decide" }
];
const SPELLING_DIAGNOSTIC_WORDS_BY_ID = Object.fromEntries(
  SPELLING_DIAGNOSTIC_WORDS.map((entry) => [entry.id, entry])
);

const TASK_WORKSPACE_PROVIDERS = [
  {
    id: "google-docs",
    label: "Google Docs",
    shortLabel: "Docs",
    createLabel: "Create in Google Docs",
    createUrl: "https://docs.new"
  },
  {
    id: "google-sheets",
    label: "Google Sheets",
    shortLabel: "Sheets",
    createLabel: "Create in Google Sheets",
    createUrl: "https://sheets.new"
  },
  {
    id: "google-slides",
    label: "Google Slides",
    shortLabel: "Slides",
    createLabel: "Create in Google Slides",
    createUrl: "https://slides.new"
  },
  {
    id: "canva",
    label: "Canva",
    shortLabel: "Canva",
    createLabel: "Create in Canva",
    createUrl: "https://www.canva.com/create/"
  }
];

const state = {
  studentName: "",
  currentUserEmail: "",
  studentGrade: defaultGrade,
  authToken: "",
  currentUserId: "",
  currentUserPoints: 0,
  authMode: "signin",
  authPending: false,
  selectedSubjectId: subjectSeed[0].id,
  activeSubjectTab: "reader",
  focusMode: window.localStorage.getItem(FOCUS_MODE_STORAGE_KEY) === "on",
  focusArea: null,
  focusAskOpen: false,
  selectedDocumentId: null,
  currentDocumentPageIndexes: {},
  activeReaderSegmentIndex: -1,
  activeReaderSectionId: "",
  askDocumentId: null,
  listeningDocumentId: null,
  selectedDocumentIds: [],
  googleDocsAccessToken: "",
  googleDocsTokenExpiresAt: 0,
  askMicActive: false,
  askResponseSpeaking: false,
  expandedDocumentGroups: {},
  attachmentModalOpen: false,
  activeAttachmentTarget: null,
  expandedAttachmentGroups: {},
  editAssessmentModalOpen: false,
  activeEditAssessment: null,
  watchExpanded: false,
  documentsExpanded: false,
  currentView: "home",
  activeTask: null,
  taskAskResponse: "",
  taskAskStatus: "",
  revisionCatalogue: [],
  revisionCatalogueLoadedGrade: "",
  revisionSelectedSubjectId: "",
  revisionSelectedTopic: "",
  revisionTextTitle: "",
  revisionSelectedNoteIds: [],
  generatedRevisionTest: null,
  revisionResponses: {},
  revisionSubmission: null,
  revisionViewMode: "draft",
  activeSavedRevisionTestId: "",
  revisionReturnContext: null,
  generatingDocumentRevisionId: "",
  upcomingModalOpen: false,
  upcomingModalMode: "upcoming",
  pendingFiles: [],
  termStarts: {
    1: "2026-01-28",
    2: "2026-04-22",
    3: "2026-07-14",
    4: "2026-10-06"
  },
  termEnds: {
    1: "2026-04-17",
    2: "2026-07-03",
    3: "2026-09-25",
    4: "2026-12-11"
  },
  settings: {
    homeBackground: "",
    subjectsBackground: "",
    homeBackgroundAssetId: "",
    subjectsBackgroundAssetId: "",
    homeBackgroundColor: defaultPageBackgroundColor,
    subjectsBackgroundColor: defaultPageBackgroundColor,
    headingColor: "#111111",
    subjectIcons: { ...defaultSubjectIconMap }
  },
  subjects: createBaseSubjects()
};

const elements = {
  landingPanel: document.getElementById("landing-panel"),
  appShell: document.getElementById("app-shell"),
  signInForm: document.getElementById("signin-form"),
  signInEyebrow: document.getElementById("signin-eyebrow"),
  signInTitle: document.getElementById("signin-title"),
  signInModeCreateButton: document.getElementById("signin-mode-create-button"),
  signInModeLoginButton: document.getElementById("signin-mode-login-button"),
  openDashboardButton: document.getElementById("open-dashboard-button"),
  studentNameWrap: document.getElementById("student-name-wrap"),
  studentGradeWrap: document.getElementById("student-grade-wrap"),
  studentNameInput: document.getElementById("student-name"),
  studentGradeSelect: document.getElementById("student-grade"),
  studentEmailInput: document.getElementById("student-email"),
  studentPasswordInput: document.getElementById("student-password"),
  studentPasswordConfirmWrap: document.getElementById("student-password-confirm-wrap"),
  studentPasswordConfirmInput: document.getElementById("student-password-confirm"),
  signInNote: document.getElementById("signin-note"),
  signInStatus: document.getElementById("signin-status"),
  appBrandTag: document.getElementById("app-brand-tag"),
  welcomeHeading: document.getElementById("welcome-heading"),
  navHomeButton: document.getElementById("nav-home-button"),
  navSubjectsButton: document.getElementById("nav-subjects-button"),
  navSettingsButton: document.getElementById("nav-settings-button"),
  focusModeToggle: document.getElementById("focus-mode-toggle"),
  homeView: document.getElementById("home-view"),
  focusHomeNextCard: document.getElementById("focus-home-next-card"),
  focusHomeSubjectHeading: document.getElementById("focus-home-subject-heading"),
  focusHomeSubjectSummary: document.getElementById("focus-home-subject-summary"),
  homeHeroDate: document.getElementById("home-hero-date"),
  homeHeroTitle: document.getElementById("home-hero-title"),
  homeHeroSubtitle: document.getElementById("home-hero-subtitle"),
  homeSubjectGrid: document.getElementById("home-subject-grid"),
  homeCurrentDocTitle: document.getElementById("home-current-doc-title"),
  homeCurrentDocMeta: document.getElementById("home-current-doc-meta"),
  homeCurrentDocProgress: document.getElementById("home-current-doc-progress"),
  homeCurrentDocProgressLabel: document.getElementById("home-current-doc-progress-label"),
  homeCurrentDocVisual: document.getElementById("home-current-doc-visual"),
  homeCurrentDocDuration: document.getElementById("home-current-doc-duration"),
  homeListenCurrentButton: document.getElementById("home-listen-current-button"),
  homeOpenCurrentButton: document.getElementById("home-open-current-button"),
  homeHomeworkList: document.getElementById("home-homework-list"),
  homeHomeworkCountPill: document.getElementById("home-homework-count-pill"),
  homeAskMicButton: document.getElementById("home-ask-mic-button"),
  homeAskPrompt: document.getElementById("home-ask-prompt"),
  homeAskReadButton: document.getElementById("home-ask-read-button"),
  homeAskQuizButton: document.getElementById("home-ask-quiz-button"),
  homeNextUpCount: document.getElementById("home-next-up-count"),
  homeNextUpTitle: document.getElementById("home-next-up-title"),
  homeNextUpMeta: document.getElementById("home-next-up-meta"),
  homeWatchPicksList: document.getElementById("home-watch-picks-list"),
  openUpcomingFromHeroButton: document.getElementById("open-upcoming-from-hero-button"),
  settingsView: document.getElementById("settings-view"),
  subjectsView: document.getElementById("subjects-view"),
  subjectsHeroDate: document.getElementById("subjects-hero-date"),
  subjectsHeroTitle: document.getElementById("subjects-hero-title"),
  subjectsHeroSubtitle: document.getElementById("subjects-hero-subtitle"),
  subjectHeroUploadButton: document.getElementById("subject-hero-upload-button"),
  taskView: document.getElementById("task-view"),
  revisionView: document.getElementById("revision-view"),
  focusAskFab: document.getElementById("focus-ask-fab"),
  focusAskButton: document.getElementById("focus-ask-button"),
  focusAskAvatarButton: document.getElementById("focus-ask-avatar-button"),
  focusAskLabel: document.getElementById("focus-ask-label"),
  documentsToReadCount: document.getElementById("documents-to-read-count"),
  documentsToReadSummary: document.getElementById("documents-to-read-summary"),
  documentsToReadProgress: document.getElementById("documents-to-read-progress"),
  homeworkToCompleteCount: document.getElementById("homework-to-complete-count"),
  homeworkToCompleteSummary: document.getElementById("homework-to-complete-summary"),
  homeworkToCompleteProgress: document.getElementById("homework-to-complete-progress"),
  assessmentsUpcomingCount: document.getElementById("assessments-upcoming-count"),
  assessmentsUpcomingSummary: document.getElementById("assessments-upcoming-summary"),
  assessmentsUpcomingProgress: document.getElementById("assessments-upcoming-progress"),
  backgroundUpload: document.getElementById("background-upload"),
  changeBackgroundButton: document.getElementById("change-background-button"),
  removeBackgroundButton: document.getElementById("remove-background-button"),
  backgroundHomeCheckbox: document.getElementById("background-home-checkbox"),
  backgroundSubjectsCheckbox: document.getElementById("background-subjects-checkbox"),
  backgroundColourInput: document.getElementById("background-colour-input"),
  clearBackgroundColourButton: document.getElementById("clear-background-colour-button"),
  headingColourInput: document.getElementById("heading-colour-input"),
  clearHeadingColourButton: document.getElementById("clear-heading-colour-button"),
  enterSubjectsButton: document.getElementById("enter-subjects-button"),
  openUploadModalButton: document.getElementById("open-upload-modal-button"),
  openUploadModalSecondary: document.getElementById("open-upload-modal-secondary"),
  revisionGradeCopy: document.getElementById("revision-grade-copy"),
  revisionSubjectSelect: document.getElementById("revision-subject-select"),
  revisionTopicWrap: document.getElementById("revision-topic-wrap"),
  revisionTopicSelect: document.getElementById("revision-topic-select"),
  revisionTextWrap: document.getElementById("revision-text-wrap"),
  revisionTextInput: document.getElementById("revision-text-input"),
  revisionNotesSelect: document.getElementById("revision-notes-select"),
  createRevisionTestButton: document.getElementById("create-revision-test-button"),
  revisionStatus: document.getElementById("revision-status"),
  revisionSummary: document.getElementById("revision-summary"),
  revisionSkills: document.getElementById("revision-skills"),
  signoutButton: document.getElementById("signout-button"),
  upcomingAssessmentsButton: document.getElementById("upcoming-assessments-button"),
  upcomingAssessmentCount: document.getElementById("upcoming-assessment-count"),
  upcomingAssessmentSummary: document.getElementById("upcoming-assessment-summary"),
  upcomingNextDue: document.getElementById("upcoming-next-due"),
  subjectList: document.getElementById("subject-list"),
  subjectHeader: document.getElementById("subject-header"),
  subjectFocusLaunchpad: document.getElementById("subject-focus-launchpad"),
  subjectTabs: document.getElementById("subject-tabs"),
  focusBackButton: document.getElementById("focus-back-button"),
  tabCountReader: document.getElementById("tab-count-reader"),
  tabCountHomework: document.getElementById("tab-count-homework"),
  tabCountSpelling: document.getElementById("tab-count-spelling"),
  tabCountWatch: document.getElementById("tab-count-watch"),
  tabCountAssessments: document.getElementById("tab-count-assessments"),
  readingViewerMeta: document.getElementById("reading-viewer-meta"),
  viewerPanelReader: document.getElementById("viewer-panel-reader"),
  viewerPanelHomework: document.getElementById("viewer-panel-homework"),
  viewerPanelSpelling: document.getElementById("viewer-panel-spelling"),
  viewerPanelWatch: document.getElementById("viewer-panel-watch"),
  watchAddLinkButton: document.getElementById("watch-add-link-button"),
  viewerPanelAssessments: document.getElementById("viewer-panel-assessments"),
  documentsBody: document.getElementById("documents-body"),
  documentsToggleButton: document.getElementById("documents-toggle-button"),
  documentsSelectAllButton: document.getElementById("documents-select-all-button"),
  documentsDeleteSelectedButton: document.getElementById("documents-delete-selected-button"),
  documentUpload: document.getElementById("document-upload"),
  uploadPanel: document.getElementById("upload-panel"),
  pendingUpload: document.getElementById("pending-upload"),
  uploadSubjectSelect: document.getElementById("upload-subject-select"),
  uploadClassNotes: document.getElementById("upload-class-notes"),
  uploadAssessment: document.getElementById("upload-assessment"),
  uploadHomework: document.getElementById("upload-homework"),
  uploadWatch: document.getElementById("upload-watch"),
  uploadDueDateWrap: document.getElementById("upload-due-date-wrap"),
  uploadDueDate: document.getElementById("upload-due-date"),
  uploadAssessmentTaskWrap: document.getElementById("upload-assessment-task-wrap"),
  uploadAssessmentTaskSelect: document.getElementById("upload-assessment-task-select"),
  uploadWatchUrlWrap: document.getElementById("upload-watch-url-wrap"),
  uploadWatchUrl: document.getElementById("upload-watch-url"),
  uploadWatchTitleWrap: document.getElementById("upload-watch-title-wrap"),
  uploadWatchTitle: document.getElementById("upload-watch-title"),
  assessmentScheduleUpload: document.getElementById("assessment-schedule-upload"),
  uploadAssessmentScheduleButton: document.getElementById("upload-assessment-schedule-button"),
  processUploadButton: document.getElementById("process-upload-button"),
  clearUploadButton: document.getElementById("clear-upload-button"),
  uploadStatus: document.getElementById("upload-status"),
  aiConnectionStatus: document.getElementById("ai-connection-status"),
  askInput: document.getElementById("ask-input"),
  askButton: document.getElementById("ask-button"),
  askMicButton: document.getElementById("ask-mic-button"),
  askListenButton: document.getElementById("ask-listen-button"),
  askContext: document.getElementById("ask-context"),
  askResponse: document.getElementById("ask-response"),
  savedTestsList: document.getElementById("saved-tests-list"),
  dockContextTitle: document.getElementById("dock-context-title"),
  dockContextBody: document.getElementById("dock-context-body"),
  readerCard: document.getElementById("reader-card"),
  readerTitle: document.getElementById("reader-title"),
  readerContent: document.getElementById("reader-content"),
  assessmentList: document.getElementById("assessment-list"),
  practiceList: document.getElementById("practice-list"),
  spellingSection: document.getElementById("spelling-section"),
  subjectHomeworkUpcomingCount: document.getElementById("subject-homework-upcoming-count"),
  subjectHomeworkUpcomingList: document.getElementById("subject-homework-upcoming-list"),
  subjectRevisionGradePill: document.getElementById("subject-revision-grade-pill"),
  subjectNextAssessmentDays: document.getElementById("subject-next-assessment-days"),
  subjectNextAssessmentTitle: document.getElementById("subject-next-assessment-title"),
  subjectNextAssessmentMeta: document.getElementById("subject-next-assessment-meta"),
  watchList: document.getElementById("watch-list"),
  watchToggleButton: document.getElementById("watch-toggle-button"),
  watchRescanButton: document.getElementById("watch-rescan-button"),
  watchStatus: document.getElementById("watch-status"),
  upcomingModal: document.getElementById("upcoming-modal"),
  closeUpcomingScrim: document.getElementById("close-upcoming-scrim"),
  closeUpcomingButton: document.getElementById("close-upcoming-button"),
  upcomingModalSummary: document.getElementById("upcoming-modal-summary"),
  upcomingModalList: document.getElementById("upcoming-modal-list"),
  setTermDatesButton: document.getElementById("set-term-dates-button"),
  toggleUpcomingModeButton: document.getElementById("toggle-upcoming-mode-button"),
  uploadModal: document.getElementById("upload-modal"),
  closeUploadScrim: document.getElementById("close-upload-scrim"),
  closeUploadButton: document.getElementById("close-upload-button"),
  attachNotesModal: document.getElementById("attach-notes-modal"),
  closeAttachNotesScrim: document.getElementById("close-attach-notes-scrim"),
  closeAttachNotesButton: document.getElementById("close-attach-notes-button"),
  attachNotesSummary: document.getElementById("attach-notes-summary"),
  attachNotesList: document.getElementById("attach-notes-list"),
  editAssessmentModal: document.getElementById("edit-assessment-modal"),
  closeEditAssessmentScrim: document.getElementById("close-edit-assessment-scrim"),
  closeEditAssessmentButton: document.getElementById("close-edit-assessment-button"),
  editAssessmentName: document.getElementById("edit-assessment-name"),
  editAssessmentTaskNumber: document.getElementById("edit-assessment-task-number"),
  editAssessmentWeighting: document.getElementById("edit-assessment-weighting"),
  editAssessmentDistributionDate: document.getElementById("edit-assessment-distribution-date"),
  editAssessmentDueDate: document.getElementById("edit-assessment-due-date"),
  saveEditAssessmentButton: document.getElementById("save-edit-assessment-button"),
  cancelEditAssessmentButton: document.getElementById("cancel-edit-assessment-button"),
  editAssessmentStatus: document.getElementById("edit-assessment-status"),
  settingsNameInput: document.getElementById("settings-name"),
  settingsEmailInput: document.getElementById("settings-email"),
  settingsGradeSelect: document.getElementById("settings-grade"),
  settingsCurrentPasswordInput: document.getElementById("settings-current-password"),
  settingsNewPasswordInput: document.getElementById("settings-new-password"),
  settingsConfirmPasswordInput: document.getElementById("settings-confirm-password"),
  settingsSubjectIcons: document.getElementById("settings-subject-icons"),
  saveSubjectIconsButton: document.getElementById("save-subject-icons-button"),
  saveAccountSettingsButton: document.getElementById("save-account-settings-button"),
  savePasswordSettingsButton: document.getElementById("save-password-settings-button"),
  settingsStatus: document.getElementById("settings-status"),
  taskViewTitle: document.getElementById("task-view-title"),
  taskSourceTitle: document.getElementById("task-source-title"),
  taskSourceContent: document.getElementById("task-source-content"),
  taskWorkEditor: document.getElementById("task-work-editor"),
  taskWorkStatus: document.getElementById("task-work-status"),
  saveTaskWorkButton: document.getElementById("save-task-work-button"),
  saveTaskFilesButton: document.getElementById("save-task-files-button"),
  closeTaskViewButton: document.getElementById("close-task-view-button"),
  revisionViewTitle: document.getElementById("revision-view-title"),
  revisionTestHeading: document.getElementById("revision-test-heading"),
  revisionTestMeta: document.getElementById("revision-test-meta"),
  revisionTestContent: document.getElementById("revision-test-content"),
  submitRevisionTestButton: document.getElementById("submit-revision-test-button"),
  saveRevisionTestButton: document.getElementById("save-revision-test-button"),
  revisionTestStatus: document.getElementById("revision-test-status"),
  revisionFeedback: document.getElementById("revision-feedback"),
  closeRevisionViewButton: document.getElementById("close-revision-view-button")
};

function normaliseAccountKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normaliseGrade(value) {
  const grade = String(value || defaultGrade).trim();
  return ["7", "8", "9", "10", "11", "12"].includes(grade) ? grade : defaultGrade;
}

function formatGradeLabel(grade) {
  return grade === "12" ? "HSC / Year 12" : `Year ${normaliseGrade(grade)}`;
}

function buildAssessmentTemplateKey(assessment) {
  return [
    String(assessment.taskNumber || "").trim().toLowerCase(),
    String(assessment.componentTask || assessment.title || "").trim().toLowerCase()
  ].join("::");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findSubjectIdFromText(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const lowerText = text.toLowerCase();
  for (const [subjectId, aliases] of Object.entries(subjectAliasMap)) {
    if (aliases.some((alias) => lowerText.includes(alias.toLowerCase()))) {
      return subjectId;
    }
  }

  return "";
}

function stripSubjectAliasFromText(value, subjectId) {
  const aliases = subjectAliasMap[subjectId] || [];
  let nextValue = String(value || "");
  aliases.forEach((alias) => {
    nextValue = nextValue.replace(new RegExp(`\\b${escapeRegex(alias)}\\b`, "ig"), " ");
  });
  return nextValue.replace(/\s{2,}/g, " ").trim();
}

function createBaseSubjects() {
  return structuredClone(subjectTemplateSeed).map((subject) => ({
    ...subject,
    documents: [],
    assessments: [],
    watch: [],
    hiddenWatchUrls: [],
    askHistory: [],
    savedRevisionTests: [],
    spelling: createDefaultSpellingState(subject.id)
  }));
}

function createInitialSubjectsForAccount(account) {
  return createBaseSubjects().map((subject) => ({
    ...subject,
    documents: [],
    assessments: [],
    watch: [],
    hiddenWatchUrls: [],
    askHistory: [],
    savedRevisionTests: [],
    spelling: createDefaultSpellingState(subject.id)
  }));
}

function resolveSubjectSeedEntry(subject, index) {
  const explicitId = String(subject?.id || "").trim();
  if (explicitId) {
    const seededById = subjectTemplateSeed.find((seededSubject) => seededSubject.id === explicitId);
    if (seededById) {
      return seededById;
    }
  }

  const subjectName = String(subject?.name || "").trim().toLowerCase();
  if (subjectName) {
    const seededByName = subjectTemplateSeed.find(
      (seededSubject) => seededSubject.name.trim().toLowerCase() === subjectName
    );
    if (seededByName) {
      return seededByName;
    }
  }

  return subjectTemplateSeed[index] || null;
}

function buildScheduleMergedAssessments(parsedAssessments = [], existingAssessments = []) {
  const existingByKey = new Map(
    existingAssessments.map((assessment) => [buildAssessmentTemplateKey(assessment), assessment])
  );
  const parsedKeys = new Set(parsedAssessments.map(buildAssessmentTemplateKey));

  const uploadedScheduleAssessments = parsedAssessments.map((assessment) => {
    const existingAssessment = existingByKey.get(buildAssessmentTemplateKey(assessment));
    return {
      ...assessment,
      id: existingAssessment?.id || createId(),
      linkedDocumentIds: Array.isArray(existingAssessment?.linkedDocumentIds)
        ? [...existingAssessment.linkedDocumentIds]
        : [],
      completed: Boolean(existingAssessment?.completed),
      workNotes: existingAssessment?.workNotes || "",
      source: "schedule-upload"
    };
  });

  const customAssessments = existingAssessments.filter((assessment) => {
    const isUploadedSchedule = assessment.source === "schedule-upload";
    if (isUploadedSchedule) {
      return false;
    }

    if (!assessment.source && parsedKeys.has(buildAssessmentTemplateKey(assessment))) {
      return false;
    }

    return true;
  });

  return [...uploadedScheduleAssessments, ...customAssessments];
}

function removeLegacySeededAssessments(subjects) {
  return subjects.map((subject) => ({
    ...subject,
    assessments: (subject.assessments || []).filter((assessment) => {
      if (assessment.source) {
        return true;
      }
      return !legacyAssessmentTemplateKeysBySubject[subject.id]?.has(buildAssessmentTemplateKey(assessment));
    })
  }));
}

function removeLegacySeededDocuments(subjects) {
  return subjects.map((subject) => ({
    ...subject,
    documents: (subject.documents || []).filter((documentRecord) => {
      const isLegacySeededTitle = legacyDocumentTemplateKeysBySubject[subject.id]?.has(
        String(documentRecord.title || "").trim().toLowerCase()
      );
      const hasImportedState =
        Boolean(documentRecord.originalFile) ||
        Boolean(documentRecord.previewImageUrl) ||
        Boolean(documentRecord.uploadGroupId) ||
        Boolean(documentRecord.pageNumber) ||
        Boolean(documentRecord.addedAt) ||
        Boolean(documentRecord.workNotes);

      if (hasImportedState) {
        return true;
      }

      return !isLegacySeededTitle;
    })
  }));
}

function mergeLegacyGroupedDocuments(subjects) {
  return subjects.map((subject) => {
    const documents = Array.isArray(subject.documents) ? subject.documents : [];
    const grouped = new Map();

    documents.forEach((documentRecord) => {
      const groupId = documentRecord.uploadGroupId || documentRecord.id;
      if (!grouped.has(groupId)) {
        grouped.set(groupId, []);
      }
      grouped.get(groupId).push(documentRecord);
    });

    const mergedDocuments = [...grouped.values()].map((groupDocuments) => {
      if (
        groupDocuments.length === 1 &&
        (!groupDocuments[0].uploadGroupId || !Number(groupDocuments[0].pageNumber || 0))
      ) {
        return groupDocuments[0];
      }

      const bundle = buildDocumentBundle(groupDocuments);
      const primaryDocument = bundle?.documents?.[0];
      if (!bundle || !primaryDocument) {
        return groupDocuments[0];
      }

      const mergedRecord = normaliseDocument({
        ...primaryDocument,
        id: primaryDocument.uploadGroupId || primaryDocument.id,
        title: bundle.title,
        content: bundle.content,
        pages: bundle.documents.map((documentItem) => ({
          pageNumber: Number(documentItem.pageNumber || 0),
          text: String(documentItem.content || "").trim(),
          imageUrl: documentItem.previewImageUrl || null
        })),
        previewImageUrl: bundle.previewImageUrl || primaryDocument.previewImageUrl || null,
        uploadGroupId: null,
        pageNumber: null
      });

      return mergedRecord;
    });

    const mergedIdMap = new Map();
    mergedDocuments.forEach((documentRecord) => {
      if (Array.isArray(documentRecord.pages) && documentRecord.pages.length) {
        grouped.get(documentRecord.id)?.forEach((legacyPageRecord) => {
          mergedIdMap.set(legacyPageRecord.id, documentRecord.id);
        });
      } else {
        mergedIdMap.set(documentRecord.id, documentRecord.id);
      }
    });

    return {
      ...subject,
      documents: mergedDocuments,
      assessments: (subject.assessments || []).map((assessment) => ({
        ...assessment,
        linkedDocumentIds: Array.isArray(assessment.linkedDocumentIds)
          ? [...new Set(assessment.linkedDocumentIds.map((documentId) => mergedIdMap.get(documentId) || documentId))]
          : []
      }))
    };
  });
}

function getSelectedSubject() {
  return state.subjects.find((subject) => subject.id === state.selectedSubjectId);
}

function getSubjectHiddenWatchUrls(subject) {
  return new Set(
    Array.isArray(subject?.hiddenWatchUrls)
      ? subject.hiddenWatchUrls.map((url) => normaliseWatchUrl(url)).filter(Boolean)
      : []
  );
}

function normaliseWatchUrl(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(rawValue);
    const host = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const videoId = parsedUrl.pathname.replace(/^\/+/, "").trim();
      return videoId ? `https://youtu.be/${videoId}` : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsedUrl.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    parsedUrl.hash = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch (error) {
    return rawValue.replace(/\/$/, "");
  }
}

function isSupportedWatchUrl(value) {
  const normalisedUrl = normaliseWatchUrl(value);
  return /^https?:\/\/(?:www\.)?(?:youtube\.com|m\.youtube\.com|youtu\.be)\//i.test(normalisedUrl);
}

function getManualSubjectWatchItems(subject) {
  const subjectId = subject?.id || "";
  return Array.isArray(subject?.watch)
    ? subject.watch
        .filter((item) => item?.url && (item.source || "manual") === "manual" && item.subjectId === subjectId)
        .map((item) => ({
          ...item,
          url: normaliseWatchUrl(item.url) || String(item.url || "").trim()
        }))
    : [];
}

function getWatchSourceDocuments(subject) {
  return getVisibleSubjectDocuments(subject).filter((documentRecord) => !documentRecord?.flags?.assessment);
}

function getAutoSubjectWatchItems(subject, { suppressManualUrls = true } = {}) {
  if (!subject) {
    return [];
  }
  const hiddenUrls = getSubjectHiddenWatchUrls(subject);
  const manualUrls = new Set(getManualSubjectWatchItems(subject).map((item) => normaliseWatchUrl(item.url)));
  return getDocumentGroupsFromDocuments(getWatchSourceDocuments(subject))
    .flatMap((bundle) =>
      extractYouTubeLinks(bundle.content).map((url) => {
        const normalisedUrl = normaliseWatchUrl(url);
        return {
          id: `watch-${bundle.id}-${normalisedUrl || url}`,
          title: `${bundle.title} video`,
          url: normalisedUrl || url,
          source: "auto-document",
          sourceDocumentTitle: bundle.title,
          subjectId: subject.id,
          addedAt: getBundlePrimaryDocument(bundle)?.addedAt || bundle.addedAt || new Date().toISOString()
        };
      })
    )
    .filter((item) => item.url)
    .filter((item) => !hiddenUrls.has(item.url) && (!suppressManualUrls || !manualUrls.has(item.url)));
}

function findSubjectWatchItemByUrl(subject, url) {
  const normalisedUrl = normaliseWatchUrl(url);
  if (!subject || !normalisedUrl) {
    return null;
  }

  return getSubjectWatchItems(subject).find((item) => normaliseWatchUrl(item.url) === normalisedUrl) || null;
}

function subjectHasAutoWatchUrl(subject, url) {
  const normalisedUrl = normaliseWatchUrl(url);
  if (!subject || !normalisedUrl) {
    return false;
  }

  return getAutoSubjectWatchItems(subject, { suppressManualUrls: false }).some(
    (item) => normaliseWatchUrl(item.url) === normalisedUrl
  );
}

function getSubjectWatchItems(subject) {
  return [...getManualSubjectWatchItems(subject), ...getAutoSubjectWatchItems(subject)].sort(
    (left, right) => new Date(right.addedAt || 0).getTime() - new Date(left.addedAt || 0).getTime()
  );
}

function isHomeworkDocument(documentRecord) {
  return Boolean(documentRecord?.flags?.homework || String(documentRecord?.type || "").toLowerCase() === "homework");
}

function getReaderDocuments(subject) {
  return getVisibleSubjectDocuments(subject);
}

function getSubjectHomeworkBundles(subject) {
  return getHomeworkBundles(subject);
}

function getSubjectWatchLinks(subject) {
  return getSubjectWatchItems(subject);
}

function getActiveSubjectAssessments(subject) {
  return (Array.isArray(subject?.assessments) ? subject.assessments : []).filter((assessment) => !assessment.completed);
}

function getVisibleSubjectDocuments(subject) {
  return getSortedDocuments(subject).filter((documentRecord) => !isHomeworkDocument(documentRecord));
}

function getSelectedDocument() {
  const subject = getSelectedSubject();
  return getVisibleSubjectDocuments(subject || { documents: [] }).find((doc) => doc.id === state.selectedDocumentId) || null;
}

function isWholeStudyDocument(documentRecord) {
  return Boolean(
    documentRecord &&
      !documentRecord.flags?.homework &&
      !documentRecord.flags?.watch &&
      (Array.isArray(documentRecord.pages) || documentRecord.flags?.classNotes || documentRecord.flags?.assessment || documentRecord.type)
  );
}

function shouldRegroupLegacyStudySections(documentRecord, storedSections) {
  const pageCount = Array.isArray(documentRecord?.pages) ? documentRecord.pages.length : 0;
  if (!pageCount || storedSections.length !== pageCount) {
    return false;
  }

  return storedSections.every(
    (section) =>
      /^page\s+\d+$/i.test(String(section.title || "").trim()) &&
      !String(section.summary || "").trim()
  );
}

function getDocumentSections(documentRecord) {
  const storedSections = Array.isArray(documentRecord?.studySections)
    ? documentRecord.studySections.map(normaliseStudySection).filter((section) => section.sectionText)
    : [];
  if (storedSections.length) {
    if (shouldRegroupLegacyStudySections(documentRecord, storedSections)) {
      const regroupedSections = buildFallbackStudyPlan(documentRecord).sections;
      documentRecord.studySections = regroupedSections;
      documentRecord.currentSectionIndex = Math.min(
        Number(documentRecord.currentSectionIndex || 0) || 0,
        Math.max(0, regroupedSections.length - 1)
      );
      persistSubjects();
      return regroupedSections;
    }
    return storedSections;
  }
  return buildFallbackStudyPlan(documentRecord).sections;
}

function getDocumentProgressRatio(documentRecord) {
  const sections = getDocumentSections(documentRecord);
  if (!sections.length) {
    return documentRecord?.reviewed ? 1 : 0;
  }
  const completedIds = new Set(Array.isArray(documentRecord?.completedSectionIds) ? documentRecord.completedSectionIds : []);
  return sections.filter((section) => completedIds.has(section.id)).length / sections.length;
}

function getCurrentDocumentSectionIndex(documentRecord) {
  const sections = getDocumentSections(documentRecord);
  if (!sections.length) {
    return 0;
  }
  return Math.max(0, Math.min(sections.length - 1, Number(documentRecord?.currentSectionIndex || 0) || 0));
}

function getSelectedDocumentSection(documentRecord) {
  const sections = getDocumentSections(documentRecord);
  const pageBoundSectionIndex = findSectionIndexForPage(documentRecord, getCurrentDocumentPageIndex(documentRecord));
  return sections[pageBoundSectionIndex >= 0 ? pageBoundSectionIndex : getCurrentDocumentSectionIndex(documentRecord)] || null;
}

function getResumeDocumentSectionIndex(documentRecord) {
  const sections = getDocumentSections(documentRecord);
  const completedIds = new Set(Array.isArray(documentRecord?.completedSectionIds) ? documentRecord.completedSectionIds : []);
  const firstIncompleteIndex = sections.findIndex((section) => !completedIds.has(section.id));
  return firstIncompleteIndex === -1 ? getCurrentDocumentSectionIndex(documentRecord) : firstIncompleteIndex;
}

function setCurrentDocumentSection(documentRecord, nextIndex) {
  const sections = getDocumentSections(documentRecord);
  if (!sections.length) {
    return;
  }
  documentRecord.currentSectionIndex = Math.max(0, Math.min(sections.length - 1, Number(nextIndex || 0) || 0));
  persistSubjects();
}

function markDocumentSectionComplete(documentRecord, sectionId, completed = true) {
  const nextIds = new Set(Array.isArray(documentRecord.completedSectionIds) ? documentRecord.completedSectionIds : []);
  if (completed) {
    nextIds.add(sectionId);
  } else {
    nextIds.delete(sectionId);
  }
  documentRecord.completedSectionIds = [...nextIds];
  documentRecord.reviewed = getDocumentProgressRatio(documentRecord) >= 1;
  persistSubjects();
}

function findSectionIndexForPage(documentRecord, pageIndex) {
  const sections = getDocumentSections(documentRecord);
  const pages = getDocumentPages(documentRecord);
  const page = pages[pageIndex];
  const pageNumber = Number(page?.pageNumber || pageIndex + 1) || pageIndex + 1;
  return sections.findIndex((section) => {
    if (!section?.pageStart || !section?.pageEnd) {
      return false;
    }
    return pageNumber >= section.pageStart && pageNumber <= section.pageEnd;
  });
}

async function ensureDocumentStudyPlan(documentRecord, subject, { force = false } = {}) {
  if (!documentRecord || !subject || !isWholeStudyDocument(documentRecord)) {
    return;
  }
  if (!force && documentRecord.studyPlanStatus === "ready" && getDocumentSections(documentRecord).length) {
    return;
  }
  if (documentRecord.studyPlanStatus === "loading") {
    return;
  }

  documentRecord.studyPlanStatus = "loading";
  renderReader();

  try {
    const payload = await requestDocumentStudyPlan(documentRecord, subject);
    documentRecord.studyOverview = String(payload?.overview || "").trim();
    documentRecord.importantTerms = Array.isArray(payload?.importantTerms)
      ? payload.importantTerms.map((term) => String(term || "").trim()).filter(Boolean)
      : [];
    documentRecord.studySections = Array.isArray(payload?.sections)
      ? payload.sections.map(normaliseStudySection).filter((section) => section.sectionText)
      : [];
    documentRecord.endQuiz = normaliseStudyQuiz(payload?.quiz);
    documentRecord.studyPlanStatus = documentRecord.studySections.length ? "ready" : "error";
    if (!documentRecord.studySections.length) {
      const fallbackPlan = buildFallbackStudyPlan(documentRecord);
      documentRecord.studyOverview = fallbackPlan.overview;
      documentRecord.importantTerms = fallbackPlan.importantTerms;
      documentRecord.studySections = fallbackPlan.sections;
      documentRecord.studyPlanStatus = "fallback";
    }
  } catch (error) {
    console.error("Document study plan failed.", error);
    const fallbackPlan = buildFallbackStudyPlan(documentRecord);
    documentRecord.studyOverview = fallbackPlan.overview;
    documentRecord.importantTerms = fallbackPlan.importantTerms;
    documentRecord.studySections = fallbackPlan.sections;
    documentRecord.endQuiz = fallbackPlan.quiz;
    documentRecord.studyPlanStatus = "fallback";
  }

  persistSubjects();
  renderReader();
  renderOverview();
}

function awardDocumentQuizPointsIfNeeded(documentRecord) {
  if (!documentRecord?.quizSubmission?.passed || documentRecord.pointsAwarded || !state.currentUserEmail) {
    return;
  }

  if (state.authToken) {
    void requestApi(
      "/api/account/points/award",
      { points: documentQuizPassPoints },
      false,
      {
        headers: {
          ...buildAuthHeaders()
        }
      }
    )
      .then((payload) => {
        state.currentUserPoints = Math.max(0, Number(payload?.account?.points || state.currentUserPoints) || 0);
      })
      .catch((error) => {
        console.error("Point award failed.", error);
      });
  } else {
    const accounts = loadAccounts();
    const accountIndex = accounts.findIndex((account) => normaliseAccountKey(account.email) === normaliseAccountKey(state.currentUserEmail));
    if (accountIndex === -1) {
      return;
    }
    accounts[accountIndex].points = Math.max(0, Number(accounts[accountIndex].points || 0) || 0) + documentQuizPassPoints;
    saveAccounts(accounts);
    state.currentUserPoints = accounts[accountIndex].points;
  }
  documentRecord.pointsAwarded = true;
}

function getAskDocument() {
  const subject = getSelectedSubject();
  return getVisibleSubjectDocuments(subject || { documents: [] }).find((doc) => doc.id === state.askDocumentId) || null;
}

function getUploadSubject() {
  return state.subjects.find((subject) => subject.id === elements.uploadSubjectSelect.value) || null;
}

function getSelectedUploadAssessmentId() {
  return elements.uploadAssessmentTaskSelect.value || "";
}

function scrollReaderIntoView() {
  elements.readerCard?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusAskComposer() {
  elements.askInput.focus();
  elements.askInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeFocusAskPopup({ stopMic = false } = {}) {
  if (!state.focusAskOpen) {
    return;
  }
  state.focusAskOpen = false;
  if (stopMic) {
    stopAskMicrophone();
  }
  render();
}

function openSubjectsWorkspace(tab = "reader") {
  const subject = getSelectedSubject();
  const availableTabs = getAvailableSubjectTabs(subject);
  const nextTab = availableTabs.includes(tab) ? tab : availableTabs[0] || "reader";
  state.currentView = "subjects";
  state.activeSubjectTab = nextTab;
  state.focusAskOpen = false;
  state.focusArea = state.focusMode ? nextTab : null;
  render();
}

function focusBundleInReader(bundle) {
  const firstDocument = bundle?.documents?.[0];
  if (!firstDocument) {
    return;
  }
  state.selectedDocumentId = firstDocument.id;
  state.askDocumentId = firstDocument.id;
  openSubjectsWorkspace("reader");
}

const youTubeUrlPattern = /https?:\/\/(?:www\.)?(?:youtube\.com\/[^\s<>"']+|youtu\.be\/[^\s<>"']+)/gi;

function getSortedDocuments(subject) {
  return [...(Array.isArray(subject?.documents) ? subject.documents : [])].sort((left, right) => {
    const leftTime = left?.addedAt ? new Date(left.addedAt).getTime() : 0;
    const rightTime = right?.addedAt ? new Date(right.addedAt).getTime() : 0;
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    const leftPage = Number(left?.pageNumber || 0);
    const rightPage = Number(right?.pageNumber || 0);
    if (left?.uploadGroupId && left.uploadGroupId === right?.uploadGroupId && leftPage !== rightPage) {
      return leftPage - rightPage;
    }

    return String(left?.title || "").localeCompare(String(right?.title || ""));
  });
}

function getBaseDocumentTitle(bundleOrDocument) {
  const rawTitle = String(bundleOrDocument?.title || bundleOrDocument?.documents?.[0]?.title || "").trim();
  return rawTitle.replace(/\s*-\s*Page\s+\d+$/i, "").trim();
}

function getDocumentSortValue(item) {
  const addedTime = item?.addedAt ? new Date(item.addedAt).getTime() : 0;
  const pageNumber = Number(item?.pageNumber || item?.documents?.[0]?.pageNumber || 0);
  return addedTime * 1000 + pageNumber;
}

function buildDocumentBundle(documents) {
  const sortedDocuments = [...documents].sort((left, right) => {
    const leftPage = Number(left?.pageNumber || 0);
    const rightPage = Number(right?.pageNumber || 0);
    if (leftPage !== rightPage) {
      return leftPage - rightPage;
    }
    return String(left?.title || "").localeCompare(String(right?.title || ""));
  });
  const primaryDocument = sortedDocuments[0] || null;
  if (!primaryDocument) {
    return null;
  }

  return {
    id: primaryDocument.uploadGroupId || primaryDocument.id,
    title: getBaseDocumentTitle(primaryDocument) || primaryDocument.title,
    type: primaryDocument.type || "Document",
    added: primaryDocument.added || "",
    addedAt: primaryDocument.addedAt || "",
    reviewed: sortedDocuments.every((documentRecord) => Boolean(documentRecord.reviewed)),
    documents: sortedDocuments,
    content: sortedDocuments.map((documentRecord) => documentRecord.content || "").filter(Boolean).join("\n\n"),
    previewImageUrl: primaryDocument.previewImageUrl || null,
    isPageGroup: sortedDocuments.length > 1 && sortedDocuments.some((documentRecord) => Number(documentRecord.pageNumber)),
    flags: { ...(primaryDocument.flags || {}) },
    workNotes: String(primaryDocument.workNotes || "")
  };
}

function getDocumentGroupsFromDocuments(documents) {
  const groupedDocuments = new Map();
  getSortedDocuments({ documents }).forEach((documentRecord) => {
    const groupId = documentRecord.uploadGroupId || documentRecord.id;
    if (!groupedDocuments.has(groupId)) {
      groupedDocuments.set(groupId, []);
    }
    groupedDocuments.get(groupId).push(documentRecord);
  });

  return [...groupedDocuments.values()]
    .map(buildDocumentBundle)
    .filter(Boolean)
    .sort((left, right) => getDocumentSortValue(right) - getDocumentSortValue(left));
}

function getDocumentGroups(subject) {
  return getDocumentGroupsFromDocuments(getVisibleSubjectDocuments(subject || { documents: [] }));
}

function getDocumentBundlesByFilter(subject, predicate) {
  const filteredDocuments = getSortedDocuments(subject).filter((documentRecord) => predicate(documentRecord));
  return getDocumentGroupsFromDocuments(filteredDocuments);
}

function getHomeworkBundles(subject) {
  return getDocumentBundlesByFilter(subject, (documentRecord) => isHomeworkDocument(documentRecord));
}

function getLinkedDocumentBundles(subject, linkedDocumentIds = []) {
  const linkedIdSet = new Set((Array.isArray(linkedDocumentIds) ? linkedDocumentIds : []).filter(Boolean));
  if (!linkedIdSet.size) {
    return [];
  }
  return getDocumentGroupsFromDocuments(Array.isArray(subject?.documents) ? subject.documents : []).filter((bundle) =>
    bundle.documents.some((documentRecord) => linkedIdSet.has(documentRecord.id))
  );
}

function findHomeworkBundle(subject, bundleId) {
  return getHomeworkBundles(subject).find((bundle) => bundle.id === bundleId) || null;
}

function getBundlePrimaryDocument(bundle) {
  return bundle?.documents?.[0] || null;
}

function getBundlePageCount(bundle) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  if (Array.isArray(primaryDocument?.pages) && primaryDocument.pages.length) {
    return primaryDocument.pages.length;
  }
  return bundle?.documents?.length || 0;
}

function getBundleWorkNotes(bundle) {
  return String(getBundlePrimaryDocument(bundle)?.workNotes || "");
}

function setBundleWorkNotes(bundle, value) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  if (primaryDocument) {
    primaryDocument.workNotes = String(value || "");
  }
}

function getBundleStoredLinkedDocumentIds(bundle) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  return Array.isArray(primaryDocument?.linkedDocumentIds) ? primaryDocument.linkedDocumentIds.filter(Boolean) : [];
}

function setBundleStoredLinkedDocumentIds(bundle, linkedDocumentIds) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  if (primaryDocument) {
    primaryDocument.linkedDocumentIds = [...new Set((linkedDocumentIds || []).filter(Boolean))];
  }
}

function getBundleStoredStepState(bundle) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  return Array.isArray(primaryDocument?.stepState) ? primaryDocument.stepState.map(Boolean) : [];
}

function setBundleStoredStepState(bundle, nextState) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  if (primaryDocument) {
    primaryDocument.stepState = Array.isArray(nextState) ? nextState.map(Boolean) : [];
  }
}

function getBundleStoredTaskSteps(bundle) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  return Array.isArray(primaryDocument?.taskSteps) ? primaryDocument.taskSteps.map((step) => String(step || "").trim()).filter(Boolean) : [];
}

function setBundleStoredTaskSteps(bundle, taskSteps) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  if (primaryDocument) {
    primaryDocument.taskSteps = Array.isArray(taskSteps) ? taskSteps.map((step) => String(step || "").trim()).filter(Boolean) : [];
  }
}

function getAssessmentStoredStageState(assessment) {
  return Array.isArray(assessment?.stageState)
    ? assessment.stageState.map((stageItems) => (Array.isArray(stageItems) ? stageItems.map(Boolean) : []))
    : [];
}

function setAssessmentStoredStageState(assessment, nextState) {
  assessment.stageState = Array.isArray(nextState)
    ? nextState.map((stageItems) => (Array.isArray(stageItems) ? stageItems.map(Boolean) : []))
    : [];
}

function getTaskWorkspaceProvider(providerId) {
  return TASK_WORKSPACE_PROVIDERS.find((provider) => provider.id === providerId) || null;
}

function normaliseExternalWorkspace(workspace) {
  if (!workspace || typeof workspace !== "object") {
    return null;
  }
  const provider = getTaskWorkspaceProvider(workspace.provider);
  if (!provider) {
    return null;
  }
  return {
    provider: provider.id,
    url: String(workspace.url || "").trim(),
    documentId: String(workspace.documentId || "").trim(),
    documentTitle: String(workspace.documentTitle || "").trim(),
    updatedAt: workspace.updatedAt || ""
  };
}

function getAssessmentExternalWorkspace(assessment) {
  return normaliseExternalWorkspace(assessment?.externalWorkspace);
}

function setAssessmentExternalWorkspace(assessment, workspace) {
  if (!assessment) {
    return;
  }
  assessment.externalWorkspace = normaliseExternalWorkspace(workspace);
}

function getHomeworkExternalWorkspace(bundle) {
  return normaliseExternalWorkspace(getBundlePrimaryDocument(bundle)?.externalWorkspace);
}

function setHomeworkExternalWorkspace(bundle, workspace) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  if (!primaryDocument) {
    return;
  }
  primaryDocument.externalWorkspace = normaliseExternalWorkspace(workspace);
}

function isWorkspaceUrlValidForProvider(url, providerId) {
  const provider = getTaskWorkspaceProvider(providerId);
  if (!provider || !url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();
    if (provider.id === "google-docs") {
      return hostname === "docs.google.com" && pathname.includes("/document/");
    }
    if (provider.id === "google-sheets") {
      return hostname === "docs.google.com" && pathname.includes("/spreadsheets/");
    }
    if (provider.id === "google-slides") {
      return hostname === "docs.google.com" && pathname.includes("/presentation/");
    }
    if (provider.id === "canva") {
      return hostname.endsWith("canva.com");
    }
  } catch (error) {
    return false;
  }

  return false;
}

function extractGoogleDocIdFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.toLowerCase() !== "docs.google.com") {
      return "";
    }
    const match = parsedUrl.pathname.match(/\/document\/d\/([^/]+)/i);
    return match ? String(match[1] || "").trim() : "";
  } catch (error) {
    return "";
  }
}

function buildGoogleDocUrl(documentId) {
  const cleanId = String(documentId || "").trim();
  return cleanId ? `https://docs.google.com/document/d/${cleanId}/edit` : "";
}

function isGoogleDocsWorkspace(workspace) {
  return workspace?.provider === "google-docs";
}

function isConnectedGoogleDocsWorkspace(workspace) {
  return isGoogleDocsWorkspace(workspace) && Boolean(String(workspace?.documentId || "").trim());
}

function loadExternalScriptOnce(scriptId, sourceUrl) {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Browser environment required."));
  }

  const existingScript = document.getElementById(scriptId);
  if (existingScript?.dataset.loaded === "true") {
    return Promise.resolve();
  }

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load external script.")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = sourceUrl;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener("error", () => reject(new Error("Failed to load external script.")), { once: true });
    document.head.appendChild(script);
  });
}

async function loadGoogleIdentityClient() {
  if (!googleIdentityClientPromise) {
    googleIdentityClientPromise = loadExternalScriptOnce(GOOGLE_IDENTITY_SCRIPT_ID, GOOGLE_IDENTITY_SCRIPT_URL).then(() => {
      if (!window.google?.accounts?.oauth2) {
        throw new Error("Google Identity Services did not load.");
      }
      return window.google.accounts.oauth2;
    });
  }
  return googleIdentityClientPromise;
}

async function ensureGoogleDocsAccessToken() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Docs is not configured yet. Add VITE_GOOGLE_CLIENT_ID to the frontend environment.");
  }

  if (state.googleDocsAccessToken && state.googleDocsTokenExpiresAt > Date.now() + 30_000) {
    return state.googleDocsAccessToken;
  }

  const oauthClient = await loadGoogleIdentityClient();
  return new Promise((resolve, reject) => {
    const tokenClient = oauthClient.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_DOCS_SCOPE,
      callback: (response) => {
        if (!response || response.error) {
          reject(new Error(response?.error_description || response?.error || "Google sign-in was cancelled."));
          return;
        }
        state.googleDocsAccessToken = String(response.access_token || "").trim();
        state.googleDocsTokenExpiresAt = Date.now() + Math.max(0, Number(response.expires_in || 3600) - 60) * 1000;
        resolve(state.googleDocsAccessToken);
      },
      error_callback: () => {
        reject(new Error("Google sign-in failed."));
      }
    });

    tokenClient.requestAccessToken({
      prompt: state.googleDocsAccessToken ? "" : "consent"
    });
  });
}

async function requestGoogleDocsApi(path, options = {}) {
  const accessToken = await ensureGoogleDocsAccessToken();
  const response = await fetch(`https://docs.googleapis.com/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let message = "Google Docs request failed.";
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error?.message || message;
    } catch (error) {
      const fallback = await response.text();
      if (fallback) {
        message = fallback;
      }
    }
    throw new Error(message);
  }

  return response.json();
}

function extractGoogleDocTextFromElements(elements = []) {
  return elements
    .map((element) => {
      if (element?.paragraph?.elements) {
        return element.paragraph.elements
          .map((paragraphElement) => paragraphElement?.textRun?.content || "")
          .join("");
      }
      if (element?.table?.tableRows) {
        return element.table.tableRows
          .map((row) =>
            (row?.tableCells || [])
              .map((cell) => extractGoogleDocTextFromElements(cell?.content || []))
              .join("\t")
          )
          .join("\n");
      }
      if (element?.tableOfContents?.content) {
        return extractGoogleDocTextFromElements(element.tableOfContents.content);
      }
      return "";
    })
    .join("");
}

function extractGoogleDocPlainText(documentPayload) {
  return extractGoogleDocTextFromElements(documentPayload?.body?.content || [])
    .replace(/\u000b/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

async function fetchGoogleDocSnapshot(documentId) {
  const cleanId = String(documentId || "").trim();
  if (!cleanId) {
    throw new Error("Google Doc ID is missing.");
  }
  const payload = await requestGoogleDocsApi(`documents/${encodeURIComponent(cleanId)}`);
  return {
    documentId: cleanId,
    title: String(payload?.title || "").trim(),
    url: buildGoogleDocUrl(cleanId),
    text: extractGoogleDocPlainText(payload),
    payload
  };
}

function getGoogleDocBodyEndIndex(documentPayload) {
  const content = Array.isArray(documentPayload?.body?.content) ? documentPayload.body.content : [];
  const lastBlock = content[content.length - 1];
  return Number(lastBlock?.endIndex || 1);
}

async function saveGoogleDocSnapshot(documentId, nextText) {
  const snapshot = await fetchGoogleDocSnapshot(documentId);
  const endIndex = getGoogleDocBodyEndIndex(snapshot.payload);
  const requests = [];

  if (endIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex: endIndex - 1
        }
      }
    });
  }

  if (String(nextText || "")) {
    requests.push({
      insertText: {
        location: { index: 1 },
        text: String(nextText || "")
      }
    });
  }

  if (requests.length) {
    await requestGoogleDocsApi(`documents/${encodeURIComponent(snapshot.documentId)}:batchUpdate`, {
      method: "POST",
      body: { requests }
    });
  }

  return {
    documentId: snapshot.documentId,
    title: snapshot.title,
    url: snapshot.url,
    text: String(nextText || "")
  };
}

async function createGoogleDocSnapshot(title, initialText = "") {
  const payload = await requestGoogleDocsApi("documents", {
    method: "POST",
    body: {
      title: String(title || "PaperPanda task").trim() || "PaperPanda task"
    }
  });

  const documentId = String(payload?.documentId || "").trim();
  if (!documentId) {
    throw new Error("Google Docs did not return a document ID.");
  }

  if (String(initialText || "").trim()) {
    await saveGoogleDocSnapshot(documentId, initialText);
  }

  return {
    documentId,
    title: String(payload?.title || title || "PaperPanda task").trim(),
    url: buildGoogleDocUrl(documentId),
    text: String(initialText || "")
  };
}

function setDocumentReviewedState(subject, documentIds, reviewed) {
  const targetIds = new Set((documentIds || []).filter(Boolean));
  if (!subject || !targetIds.size) {
    return;
  }
  (subject.documents || []).forEach((documentRecord) => {
    if (!targetIds.has(documentRecord.id)) {
      return;
    }
    documentRecord.reviewed = Boolean(reviewed);
    documentRecord.reviewMode = reviewed ? "manual" : "";
    if (isWholeStudyDocument(documentRecord)) {
      const sections = getDocumentSections(documentRecord);
      if (reviewed) {
        documentRecord.completedSectionIds = sections.map((section) => section.id);
      }
    }
  });
  persistSubjects();
}

function getSelectedDocumentIndex() {
  const documents = getVisibleSubjectDocuments(getSelectedSubject() || { documents: [] });
  return documents.findIndex((documentRecord) => documentRecord.id === state.selectedDocumentId);
}

function getDocumentPages(documentRecord) {
  return Array.isArray(documentRecord?.pages)
    ? documentRecord.pages.filter((page) => page?.imageUrl)
    : [];
}

function getCurrentDocumentPageIndex(documentRecord) {
  if (!documentRecord?.id) {
    return 0;
  }
  const pages = getDocumentPages(documentRecord);
  if (!pages.length) {
    return 0;
  }
  const savedIndex = Number(state.currentDocumentPageIndexes?.[documentRecord.id] || 0) || 0;
  return Math.min(Math.max(savedIndex, 0), pages.length - 1);
}

function setCurrentDocumentPageIndex(documentRecord, nextIndex) {
  if (!documentRecord?.id) {
    return;
  }
  const pages = getDocumentPages(documentRecord);
  if (!pages.length) {
    return;
  }
  state.currentDocumentPageIndexes = {
    ...state.currentDocumentPageIndexes,
    [documentRecord.id]: Math.min(Math.max(Number(nextIndex) || 0, 0), pages.length - 1)
  };
}

function getDocumentPageText(page) {
  return String(page?.text || "").replace(/^Page\s+\d+\s*/i, "").trim();
}

function selectAdjacentDocument(direction) {
  const documents = getVisibleSubjectDocuments(getSelectedSubject() || { documents: [] });
  if (!documents.length) {
    return;
  }
  const currentIndex = getSelectedDocumentIndex();
  const nextIndex = Math.max(0, Math.min(documents.length - 1, (currentIndex === -1 ? 0 : currentIndex) + direction));
  const nextDocument = documents[nextIndex];
  if (!nextDocument) {
    return;
  }
  state.selectedDocumentId = nextDocument.id;
  state.askDocumentId = nextDocument.id;
  renderDocuments();
  renderAskContext();
}

function extractYouTubeLinks(text) {
  const matches = String(text || "").match(youTubeUrlPattern) || [];
  return [...new Set(matches.map((value) => value.trim()))];
}

function syncAutoWatchForSubject(subject) {
  if (!subject) {
    return;
  }

  const seenUrls = new Set();
  subject.watch = getManualSubjectWatchItems(subject).filter((item) => {
    if (!item?.url || seenUrls.has(item.url)) {
      return false;
    }
    seenUrls.add(item.url);
    return true;
  });
  subject.hiddenWatchUrls = Array.from(getSubjectHiddenWatchUrls(subject));
}

function syncAutoWatchForAllSubjects() {
  state.subjects.forEach((subject) => syncAutoWatchForSubject(subject));
}

function removeManualWatchDuplicatesFromOtherSubjects(targetSubjectId, url, itemId) {
  const normalisedUrl = normaliseWatchUrl(url);
  state.subjects.forEach((subject) => {
    if (subject.id === targetSubjectId) {
      return;
    }
    subject.watch = (Array.isArray(subject.watch) ? subject.watch : []).filter((item) => {
      if (item.id === itemId) {
        return false;
      }
      return normaliseWatchUrl(item.url) !== normalisedUrl;
    });
  });
}

function renderSubjectHeader() {
  if (!elements.subjectHeader) {
    return;
  }
  elements.subjectHeader.innerHTML = "";
}

function renderSubjectTabs() {
  const subject = getSelectedSubject();
  if (!subject || !elements.subjectTabs) {
    return;
  }
  const availableTabs = getAvailableSubjectTabs(subject);
  if (!availableTabs.includes(state.activeSubjectTab)) {
    state.activeSubjectTab = availableTabs[0] || "reader";
  }

  const counts = {
    reader: getAllDocumentBundles(subject).length,
    homework: getHomeworkBundles(subject).length,
    spelling: getSpellingPendingActivityCount(subject),
    watch: getSubjectWatchItems(subject).length,
    assessments: Array.isArray(subject.assessments) ? subject.assessments.filter((assessment) => !assessment.completed).length : 0
  };

  elements.tabCountReader.textContent = String(counts.reader);
  elements.tabCountHomework.textContent = String(counts.homework);
  elements.tabCountSpelling.textContent = String(counts.spelling);
  elements.tabCountWatch.textContent = String(counts.watch);
  elements.tabCountAssessments.textContent = String(counts.assessments);
  elements.subjectTabs.querySelectorAll("[data-viewer-tab]").forEach((button) => {
    button.classList.toggle("hidden", !availableTabs.includes(button.dataset.viewerTab));
    button.classList.toggle("is-active", button.dataset.viewerTab === state.activeSubjectTab);
  });
  elements.readingViewerMeta.textContent = `${subject.name} · Year ${state.studentGrade}`;
  elements.viewerPanelReader.classList.toggle("hidden", state.activeSubjectTab !== "reader");
  elements.viewerPanelHomework.classList.toggle("hidden", state.activeSubjectTab !== "homework");
  elements.viewerPanelSpelling.classList.toggle("hidden", state.activeSubjectTab !== "spelling");
  elements.viewerPanelWatch.classList.toggle("hidden", state.activeSubjectTab !== "watch");
  elements.viewerPanelAssessments.classList.toggle("hidden", state.activeSubjectTab !== "assessments");
}

function renderSubjectFocusLaunchpad() {
  const host = elements.subjectFocusLaunchpad;
  if (!host) {
    return;
  }

  const subject = getSelectedSubject();
  if (!subject) {
    host.innerHTML = "";
    return;
  }

  const readerBundle = getAllDocumentBundles(subject).find((bundle) => !bundle.reviewed) || getAllDocumentBundles(subject)[0] || null;
  const homeworkBundle = getSubjectHomeworkBundles(subject)[0] || null;
  const watchItem = getSubjectWatchItems(subject)[0] || null;
  const nextEntry = getNextSubjectAssessmentEntry(subject);
  const counts = {
    reader: getAllDocumentBundles(subject).length,
    homework: getSubjectHomeworkBundles(subject).length,
    spelling: getSpellingPendingActivityCount(subject),
    watch: getSubjectWatchItems(subject).length,
    assessments: getActiveSubjectAssessments(subject).length
  };
  const readerPageCount = readerBundle ? getBundlePageCount(readerBundle) : 0;
  const readerProgress = readerBundle ? Math.round(getHomeDocumentProgress(readerBundle) * 100) : 0;
  const focusPreview = {
    reader: readerBundle
      ? {
          title: readerBundle.title,
          meta: `${readerBundle.type || "Class notes"} · ${readerPageCount} ${readerPageCount === 1 ? "page" : "pages"} · ${readerProgress}% read`,
          action: currentAudioContext === `document:${readerBundle.documents[0]?.id}` ? "■ Stop reading" : "▶ Listen from here"
        }
      : {
          title: "No reading is loaded yet",
          meta: "Upload class notes to start reading here.",
          action: "📖 Open reader"
        },
    homework: homeworkBundle
      ? {
          title: homeworkBundle.title,
          meta: `${getBundlePageCount(homeworkBundle)} ${getBundlePageCount(homeworkBundle) === 1 ? "page" : "pages"} · ${getBundleWorkNotes(homeworkBundle) ? "writing started" : "needs a draft"}`,
          action: "↯ Break into steps"
        }
      : {
          title: "No homework in this subject yet",
          meta: "Homework tasks will appear here when they are uploaded.",
          action: "✎ Open homework"
        },
    spelling: subject.id === "spelling"
      ? {
          title: SPELLING_UNIT_SEED.title,
          meta: `${getSpellingPendingActivityCount(subject)} stage${getSpellingPendingActivityCount(subject) === 1 ? "" : "s"} left · ${Math.round(getSpellingMasteryRatio(subject) * 100)}% complete`,
          action: "Aa Open spelling"
        }
      : {
          title: "Spelling lives in its own subject",
          meta: "Open the Spelling subject from the subject list to train this lesson.",
          action: "Aa Open spelling"
        },
    watch: watchItem
      ? {
          title: watchItem.title,
          meta: watchItem.source === "manual"
            ? "Saved watch link"
            : watchItem.sourceDocumentTitle
              ? `${watchItem.sourceDocumentTitle} · linked from your notes`
              : "Linked from your notes",
          action: "▶ Play video"
        }
      : {
          title: "No class videos linked yet",
          meta: "Watch links from notes or manual uploads appear here.",
          action: "▶ Open watch"
        },
    assessments: nextEntry
      ? {
          title: nextEntry.assessment.componentTask || nextEntry.assessment.title,
          meta: `Due ${formatAssessmentDueLabel(nextEntry.assessment.dueDate)} · worth ${nextEntry.assessment.weighting || "Assessment"}`,
          action: "🎯 See the steps"
        }
      : {
          title: "No active assessment yet",
          meta: "Assessment tasks and due dates will appear here.",
          action: "🎯 Open assessments"
        }
  };

  const subjectOptions = state.subjects
    .map((item) => `<option value="${item.id}"${item.id === subject.id ? " selected" : ""}>${escapeHtml(item.name)}</option>`)
    .join("");

  const cards = FOCUS_AREAS
    .filter((area) => getAvailableSubjectTabs(subject).includes(area.id))
    .map((area) => {
    const preview = focusPreview[area.id];
    return `
      <article class="focus-card focus-card--${area.id}" data-focus-area="${area.id}" tabindex="0" role="button">
        <div class="focus-card__header">
          <div class="focus-card__icon">${area.icon}</div>
          <div class="focus-card__text">
            <span class="focus-card__label">${escapeHtml(area.label)}</span>
            <span class="focus-card__blurb">${escapeHtml(area.blurb)}</span>
          </div>
          <span class="focus-card__count">${counts[area.id] || 0}</span>
        </div>
        <div class="focus-card__preview">
          <div class="focus-card__preview-copy">
            <strong>${escapeHtml(preview.title)}</strong>
            <span>${escapeHtml(preview.meta)}</span>
          </div>
          <button type="button" class="focus-card__action" data-focus-preview-action="${area.id}">
            ${escapeHtml(preview.action)}
          </button>
        </div>
      </article>
    `;
  }).join("");

  const countdownMarkup = nextEntry
    ? `
      <button type="button" class="focus-countdown" id="focus-subject-next-button">
        <span class="focus-countdown__num">${getDaysUntilDate(nextEntry.dueDateObject)}</span>
        <span class="focus-countdown__unit">${getDaysUntilDate(nextEntry.dueDateObject) === 1 ? "day" : "days"}</span>
        <span class="focus-countdown__copy">
          <span class="eyebrow">Next thing due</span>
          <strong>${escapeHtml(nextEntry.assessment.componentTask || nextEntry.assessment.title)}</strong>
        </span>
        <span class="focus-countdown__arrow">→</span>
      </button>
    `
    : "";

  host.innerHTML = `
    <div class="focus-launchpad__top">
      <div class="focus-launchpad__controls">
        <label class="focus-subject-picker">
          <span class="focus-subject-picker__icon">${getSubjectTileCodeMarkup(subject)}</span>
          <select id="focus-subject-select" aria-label="Choose subject">${subjectOptions}</select>
          <span class="focus-subject-picker__caret">⌄</span>
        </label>
        <span class="focus-launchpad__hint">Tap to switch subject</span>
      </div>
      ${countdownMarkup}
    </div>
    <div class="focus-launchpad__grid">${cards}</div>
  `;

  host.querySelector("#focus-subject-select")?.addEventListener("change", (event) => {
    state.selectedSubjectId = event.target.value;
    state.focusArea = null;
    render();
  });

  host.querySelectorAll("[data-focus-area]").forEach((card) => {
    const drillIn = () => {
      const nextArea = card.dataset.focusArea;
      if (!nextArea) {
        return;
      }
      state.activeSubjectTab = nextArea;
      state.focusArea = nextArea;
      render();
    };
    card.addEventListener("click", drillIn);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        drillIn();
      }
    });
  });

  host.querySelectorAll("[data-focus-preview-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const area = button.dataset.focusPreviewAction;
      if (area === "reader") {
        const firstDocument = readerBundle?.documents?.[0];
        if (firstDocument) {
          state.selectedDocumentId = firstDocument.id;
          state.askDocumentId = firstDocument.id;
          speakDocument(firstDocument);
          return;
        }
        openSubjectsWorkspace("reader");
        return;
      }
      if (area === "homework") {
        if (homeworkBundle) {
          openHomeworkTaskForSubject(subject, homeworkBundle);
          return;
        }
        openSubjectsWorkspace("homework");
        return;
      }
      if (area === "spelling") {
        openSubjectsWorkspace("spelling");
        return;
      }
      if (area === "watch") {
        if (watchItem?.url) {
          window.open(watchItem.url, "_blank", "noopener");
          return;
        }
        openSubjectsWorkspace("watch");
        return;
      }
      if (area === "assessments") {
        if (nextEntry) {
          openAssessmentTaskFromEntry(nextEntry);
          return;
        }
        openSubjectsWorkspace("assessments");
      }
    });
  });

  host.querySelector("#focus-subject-next-button")?.addEventListener("click", () => {
    openAssessmentTaskFromEntry(nextEntry);
  });
}

function renderFocusHomeCard() {
  const host = elements.focusHomeNextCard;
  if (!host) {
    return;
  }

  const show = state.focusMode && state.currentView === "home";
  host.classList.toggle("hidden", !show);
  elements.focusHomeSubjectHeading?.classList.toggle("hidden", !show);
  if (!show) {
    host.innerHTML = "";
    return;
  }

  if (elements.focusHomeSubjectSummary) {
    const subjectCount = state.subjects.length;
    elements.focusHomeSubjectSummary.textContent = `${subjectCount} subject${subjectCount === 1 ? "" : "s"} · a dot means something's waiting`;
  }

  const nextEntry = getNextAssessmentEntry();
  if (!nextEntry) {
    host.innerHTML = `
      <article class="focus-home-next-card__surface">
        <div class="focus-home-next-card__count focus-home-next-card__count--empty">
          <strong>0</strong>
          <span>days to go</span>
        </div>
        <div class="focus-home-next-card__copy">
          <p class="eyebrow">Next thing due</p>
          <h3>No upcoming assessment yet</h3>
          <p>Upload an assessment task or open the calendar to review due dates.</p>
        </div>
        <div class="focus-home-next-card__actions">
          <button type="button" class="primary-button primary-button--dark" id="focus-home-next-calendar-button">Open calendar</button>
        </div>
      </article>
    `;
    host.querySelector("#focus-home-next-calendar-button")?.addEventListener("click", openUpcomingModal);
    return;
  }

  host.innerHTML = `
    <article class="focus-home-next-card__surface">
      <div class="focus-home-next-card__count">
        <strong>${getDaysUntilDate(nextEntry.dueDateObject)}</strong>
        <span>${getDaysUntilDate(nextEntry.dueDateObject) === 1 ? "day to go" : "days to go"}</span>
      </div>
      <div class="focus-home-next-card__copy">
        <p class="eyebrow">Next thing due</p>
        <h3>${escapeHtml(nextEntry.assessment.componentTask || nextEntry.assessment.title)}</h3>
        <p>${escapeHtml(`${nextEntry.subject.name} · due ${formatAssessmentDueLabel(nextEntry.assessment.dueDate)} · worth ${nextEntry.assessment.weighting || "Assessment"}`)}</p>
      </div>
      <div class="focus-home-next-card__actions">
        <button type="button" class="primary-button primary-button--dark" id="focus-home-next-open-button">🎯 See the steps</button>
        <button type="button" class="ghost-button" id="focus-home-next-read-button">▶ Read it to me</button>
      </div>
    </article>
  `;

  host.querySelector("#focus-home-next-open-button")?.addEventListener("click", () => {
    openAssessmentTaskFromEntry(nextEntry);
  });
  host.querySelector("#focus-home-next-read-button")?.addEventListener("click", () => {
    speakAssessmentEntry(nextEntry, { context: `focus:home-assessment:${nextEntry.assessment.id}` });
  });
}

function renderFocusAskFab() {
  const shouldShow = state.focusMode && (state.currentView === "home" || state.currentView === "subjects") && !state.focusAskOpen;
  elements.focusAskFab?.classList.toggle("hidden", !shouldShow);
  if (elements.focusAskLabel) {
    elements.focusAskLabel.textContent = state.currentView === "subjects" ? "Hold to talk" : "Ask Panda";
  }
}

function renderFocusMode() {
  const askOpen = state.focusMode && state.currentView === "subjects" && state.focusAskOpen;
  const showLaunchpad = state.focusMode && state.currentView === "subjects" && !state.focusArea && !askOpen;
  const drilledIn = state.focusMode && state.currentView === "subjects" && Boolean(state.focusArea) && !askOpen;
  const readerDrilled = drilledIn && state.focusArea === "reader";

  elements.subjectsView?.classList.toggle("focus-launchpad-open", showLaunchpad);
  elements.subjectsView?.classList.toggle("focus-drilled", drilledIn);
  elements.subjectsView?.classList.toggle("focus-reader-drilled", readerDrilled);
  elements.subjectsView?.classList.toggle("focus-ask-open", askOpen);
  elements.subjectFocusLaunchpad?.classList.toggle("hidden", !showLaunchpad);
  elements.focusBackButton?.classList.toggle("hidden", !drilledIn);

  renderFocusHomeCard();
  renderFocusAskFab();

  if (showLaunchpad) {
    renderSubjectFocusLaunchpad();
    return;
  }

  if (elements.subjectFocusLaunchpad) {
    elements.subjectFocusLaunchpad.innerHTML = "";
  }
}

function renderPendingUpload() {
  if (!elements.pendingUpload) {
    return;
  }
  if (!state.pendingFiles.length) {
    elements.pendingUpload.innerHTML = "";
    return;
  }
  elements.pendingUpload.innerHTML = `
    <div class="pending-upload__summary">Selected:</div>
    <ul>${state.pendingFiles.map((file) => `<li>${escapeHtml(file.name)}</li>`).join("")}</ul>
  `;
}

function renderUploadAssessmentTaskOptions() {
  const subject = getUploadSubject();
  const isAssessment = getSelectedUploadType() === "assessment";
  elements.uploadAssessmentTaskWrap.classList.toggle("upload-field--hidden", !isAssessment);
  elements.uploadDueDateWrap.classList.toggle("upload-field--hidden", !isAssessment);
  elements.uploadWatchUrlWrap.classList.toggle("upload-field--hidden", getSelectedUploadType() !== "watch");
  elements.uploadWatchTitleWrap.classList.toggle("upload-field--hidden", getSelectedUploadType() !== "watch");

  if (!subject || !isAssessment) {
    elements.uploadAssessmentTaskSelect.innerHTML = `<option value="">Create new assessment</option>`;
    return;
  }

  const options = [`<option value="">Create new assessment</option>`]
    .concat(
      (subject.assessments || []).map(
        (assessment) => `<option value="${assessment.id}">${escapeHtml(assessment.componentTask || assessment.title)}</option>`
      )
    )
    .join("");
  elements.uploadAssessmentTaskSelect.innerHTML = options;
}

function renderDockContext() {
  const subject = getSelectedSubject();
  if (!elements.dockContextTitle || !elements.dockContextBody || !subject) {
    return;
  }

  if (state.activeSubjectTab === "reader") {
    const selectedDocument = getSelectedDocument();
    elements.dockContextTitle.textContent = "Linked here from notes";
    elements.dockContextBody.innerHTML = selectedDocument
      ? `<article class="dock-tile dock-tile--bg dock-tile--active"><div class="dock-tile__copy"><strong>${escapeHtml(selectedDocument.title)}</strong><span>${escapeHtml(selectedDocument.type)}</span></div></article>`
      : `<div class="empty-state empty-state--compact">Select a document to read it here.</div>`;
    return;
  }

  if (state.activeSubjectTab === "watch") {
    const watchItems = getSubjectWatchLinks(subject);
    elements.dockContextTitle.textContent = "Watch";
    elements.dockContextBody.innerHTML = `<article class="dock-tile dock-tile--mint"><div class="dock-tile__copy"><strong>${escapeHtml(`${watchItems.length} subject-specific link${watchItems.length === 1 ? "" : "s"}`)}</strong><span>Watch links stay in the main Watch panel so they do not mix with Reader, Homework, or Assessments.</span></div></article>`;
    return;
  }

  if (state.activeSubjectTab === "homework") {
    const homeworkCount = getSubjectHomeworkBundles(subject).length;
    elements.dockContextTitle.textContent = "Homework";
    elements.dockContextBody.innerHTML = `<article class="dock-tile dock-tile--peach"><div class="dock-tile__copy"><strong>${escapeHtml(`${homeworkCount} homework item${homeworkCount === 1 ? "" : "s"} in ${subject.name}`)}</strong><span>Homework stays in the main Homework panel so it does not appear as separate context content.</span></div></article>`;
    return;
  }

  if (state.activeSubjectTab === "spelling") {
    const spelling = getSubjectSpellingState(subject);
    elements.dockContextTitle.textContent = "Spelling focus";
    elements.dockContextBody.innerHTML = subject.id === "spelling"
      ? `
        <article class="dock-tile dock-tile--yellow">
          <div class="dock-tile__copy">
            <strong>${escapeHtml(`${getSpellingCompletedActivityCount(subject)}/${getSpellingTotalActivityCount(subject)} stages complete`)}</strong>
            <span>${escapeHtml(spelling.coachMessage || "The next spelling stage is ready.")}</span>
          </div>
        </article>
      `
      : `<div class="empty-state empty-state--compact">Open the Spelling subject to train this lesson.</div>`;
    return;
  }

  if (state.activeSubjectTab === "assessments") {
    const assessmentCount = getActiveSubjectAssessments(subject).length;
    elements.dockContextTitle.textContent = "Assessment focus";
    elements.dockContextBody.innerHTML = `<article class="dock-tile dock-tile--lilac"><div class="dock-tile__copy"><strong>${escapeHtml(`${assessmentCount} active assessment${assessmentCount === 1 ? "" : "s"}`)}</strong><span>Assessments stay in the main Assessments panel so each subject tab remains separate.</span></div></article>`;
    return;
  }

  elements.dockContextTitle.textContent = "Current focus";
  elements.dockContextBody.innerHTML = `<div class="empty-state empty-state--compact">Choose a tab to keep working in this subject.</div>`;
}

async function loadRevisionCatalogue(force = false) {
  if (!state.studentGrade) {
    return [];
  }
  if (!force && state.revisionCatalogueLoadedGrade === state.studentGrade && state.revisionCatalogue.length) {
    return state.revisionCatalogue;
  }

  try {
    const payload = await requestApiGet(`/api/revision/catalogue?grade=${encodeURIComponent(state.studentGrade)}`);
    state.revisionCatalogue = Array.isArray(payload?.catalogue)
      ? payload.catalogue
      : Array.isArray(payload?.entries)
        ? payload.entries
        : [];
  } catch (error) {
    state.revisionCatalogue = state.subjects.map((subject) => ({
      grade: state.studentGrade,
      subjectId: subject.id,
      subjectName: subject.name,
      overview: subject.summary || "",
      testedSkills: [],
      topics: []
    }));
  }

  state.revisionCatalogueLoadedGrade = state.studentGrade;
  if (!state.revisionSelectedSubjectId) {
    state.revisionSelectedSubjectId = state.selectedSubjectId;
  }
  return state.revisionCatalogue;
}

function getRevisionSubjectEntry() {
  const subjectId = state.revisionSelectedSubjectId || state.selectedSubjectId;
  const catalogueEntry = (state.revisionCatalogue || []).find((entry) => entry.subjectId === subjectId);
  if (catalogueEntry) {
    return catalogueEntry;
  }
  const subject = state.subjects.find((item) => item.id === subjectId);
  return subject
    ? {
        grade: state.studentGrade,
        subjectId: subject.id,
        subjectName: subject.name,
        overview: subject.summary || "",
        testedSkills: [],
        topics: []
      }
    : null;
}

function renderRevisionPanel() {
  if (!elements.revisionSubjectSelect || !elements.revisionTopicSelect) {
    return;
  }

  const entries = state.revisionCatalogue.length
    ? state.revisionCatalogue
    : state.subjects.map((subject) => ({
        subjectId: subject.id,
        subjectName: subject.name,
        overview: subject.summary || "",
        testedSkills: [],
        topics: []
      }));

  if (!state.revisionSelectedSubjectId) {
    state.revisionSelectedSubjectId = state.selectedSubjectId;
  }

  elements.revisionSubjectSelect.innerHTML = entries
    .map(
      (entry) => `<option value="${entry.subjectId}" ${entry.subjectId === state.revisionSelectedSubjectId ? "selected" : ""}>${escapeHtml(entry.subjectName)}</option>`
    )
    .join("");

  const selectedEntry = getRevisionSubjectEntry();
  const topics = Array.isArray(selectedEntry?.topics) ? selectedEntry.topics : [];
  elements.revisionTopicSelect.innerHTML = [`<option value="">Any focus</option>`]
    .concat(topics.map((topic) => `<option value="${escapeHtml(String(topic))}" ${topic === state.revisionSelectedTopic ? "selected" : ""}>${escapeHtml(String(topic))}</option>`))
    .join("");
  elements.revisionTopicWrap.classList.toggle("hidden", !topics.length);

  const selectedSubject = state.subjects.find((subject) => subject.id === state.revisionSelectedSubjectId) || getSelectedSubject();
  const noteBundles = selectedSubject ? getAllDocumentBundles(selectedSubject) : [];
  elements.revisionNotesSelect.innerHTML = noteBundles
    .map((bundle) => `<option value="${bundle.id}" ${state.revisionSelectedNoteIds.includes(bundle.id) ? "selected" : ""}>${escapeHtml(bundle.title)}</option>`)
    .join("");

  const isEnglish = selectedEntry?.subjectId === "english";
  elements.revisionTextWrap.classList.toggle("hidden", !isEnglish);
  elements.subjectRevisionGradePill.textContent = `Year ${state.studentGrade}`;
  elements.revisionSummary.textContent = selectedEntry?.overview || "Select a subject to load the curriculum overview and tested skills.";
  elements.revisionSkills.innerHTML = (selectedEntry?.testedSkills || [])
    .slice(0, 6)
    .map((skill) => `<span class="document-chip">${escapeHtml(skill)}</span>`)
    .join("");
}

function getSelectedRevisionNoteBundles(subject = state.subjects.find((item) => item.id === state.revisionSelectedSubjectId)) {
  const allBundles = subject ? getAllDocumentBundles(subject) : [];
  return allBundles.filter((bundle) => state.revisionSelectedNoteIds.includes(bundle.id));
}

async function generateRevisionTest({
  subjectId,
  topic = "",
  textTitle = "",
  noteBundles = []
} = {}) {
  const selectedEntry =
    state.revisionCatalogue.find((entry) => entry.subjectId === subjectId) ||
    state.subjects.find((subject) => subject.id === subjectId);
  if (!selectedEntry) {
    throw new Error("Select a subject first.");
  }

  state.revisionSelectedSubjectId = subjectId;
  state.revisionSelectedTopic = topic;
  state.revisionTextTitle = textTitle;
  state.revisionSelectedNoteIds = noteBundles.map((bundle) => bundle.id);
  state.generatedRevisionTest = null;
  state.revisionResponses = {};
  state.revisionSubmission = null;
  state.revisionViewMode = "draft";
  state.activeSavedRevisionTestId = "";
  state.revisionReturnContext = {
    view: "home"
  };

  const payload = await requestApi("/api/revision/generate-test", {
    grade: state.studentGrade,
    subjectId,
    topic,
    textTitle,
    notes: noteBundles.map((bundle) => ({
      title: bundle.title,
      content: clipText(bundle.content || "")
    }))
  });

  if (!payload?.test) {
    throw new Error("Panda could not generate a practice test yet.");
  }

  state.generatedRevisionTest = payload.test;
  state.revisionResponses = {};
  state.revisionSubmission = null;
  state.revisionViewMode = "draft";
  state.activeSavedRevisionTestId = "";
  openRevisionTestView();
}

async function generateDocumentRevisionTest(documentRecord, subject) {
  if (!documentRecord || !subject) {
    throw new Error("Select a document first.");
  }

  state.generatedRevisionTest = null;
  state.revisionResponses = {};
  state.revisionSubmission = null;
  state.revisionViewMode = "draft";
  state.activeSavedRevisionTestId = "";
  state.revisionReturnContext = {
    view: "subjects",
    subjectId: subject.id,
    documentId: documentRecord.id,
    activeSubjectTab: "reader"
  };

  const payload = await requestApi("/api/document/revision-test", {
    grade: state.studentGrade,
    subjectId: subject.id,
    subjectName: subject.name,
    title: documentRecord.title,
    pageCount: getDocumentPages(documentRecord).length,
    content: clipText(documentRecord.content || "", 18000)
  });

  if (!payload?.test) {
    throw new Error("Panda could not generate a revision test for this document yet.");
  }

  state.generatedRevisionTest = payload.test;
  state.revisionResponses = {};
  state.revisionSubmission = null;
  state.revisionViewMode = "draft";
  state.activeSavedRevisionTestId = "";
  openRevisionTestView();
}

function openRevisionTestView() {
  state.generatingDocumentRevisionId = "";
  state.currentView = "revision";
  render();
}

function renderRevisionTestView() {
  if (!elements.revisionTestHeading || !elements.revisionTestContent) {
    return;
  }

  const test = state.generatedRevisionTest;
  if (!test) {
    elements.revisionTestHeading.textContent = "Generated test";
    elements.revisionTestMeta.innerHTML = "";
    elements.revisionTestContent.innerHTML = "Create a test from the home page to work on it here.";
    elements.revisionFeedback.classList.add("hidden");
    elements.revisionFeedback.innerHTML = "";
    return;
  }

  const feedbackById = new Map(
    Array.isArray(state.revisionSubmission?.questionFeedback)
      ? state.revisionSubmission.questionFeedback.map((feedback) => [String(feedback.id || ""), feedback])
      : []
  );

  elements.revisionViewTitle.textContent = test.title || "Revision test";
  elements.revisionTestHeading.textContent = test.title || "Generated test";
  elements.closeRevisionViewButton.textContent = state.revisionReturnContext?.view === "subjects" ? "Back to document" : "Back to home";
  const revisionScoreMarkup = state.revisionSubmission
    ? `<div class="revision-test-meta-score">${escapeHtml(`${state.revisionSubmission.totalScore || 0}/${state.revisionSubmission.totalAvailable || 0}`)}</div>`
    : "";
  elements.revisionTestMeta.innerHTML = `
    <div class="document-chip">${escapeHtml(test.subjectName || "")}</div>
    <div class="document-chip">${escapeHtml(test.grade || `Year ${state.studentGrade}`)}</div>
    <div class="document-chip">${escapeHtml(test.focus || "Revision focus")}</div>
    ${revisionScoreMarkup}
  `;

  elements.revisionTestContent.innerHTML = (Array.isArray(test.sections) ? test.sections : [])
    .map(
      (section) => `
        <section class="revision-section">
          <h4>${escapeHtml(section.title || "Section")}</h4>
          ${section.stimulusText ? `<div class="revision-stimulus">${escapeHtml(section.stimulusText)}</div>` : ""}
          ${(section.questions || [])
            .map((question) => {
              const questionId = String(question.id || "");
              const responseValue = state.revisionResponses[questionId] || "";
              const feedback = feedbackById.get(questionId);
              const type = String(question.type || "");
              const inputMarkup = type === "multiple-choice"
                ? `
                  <div class="revision-options">
                    ${(question.options || [])
                      .map(
                        (option) => `
                          <label class="revision-option">
                            <input type="radio" name="${questionId}" value="${escapeHtml(option)}" ${responseValue === option ? "checked" : ""} data-revision-question="${questionId}" />
                            <span>${escapeHtml(option)}</span>
                          </label>
                        `
                      )
                      .join("")}
                  </div>
                `
                : `<textarea class="reader-editor revision-answer-editor" data-revision-question="${questionId}" placeholder="Write your answer here...">${escapeHtml(responseValue)}</textarea>`;
              const feedbackMarkup = feedback
                ? `
                  <div class="revision-question__feedback">
                    <div class="revision-question__score-wrap">
                      <div class="revision-question__score${(feedback?.score || 0) < (feedback?.marks || question.marks || 0) ? " revision-question__score--incorrect" : ""}">
                        ${escapeHtml(`${feedback.score || 0}/${feedback.marks || question.marks || 0}`)}
                      </div>
                    </div>
                    <p class="revision-question__feedback-copy">${escapeHtml(feedback.feedback || "")}</p>
                    <div class="revision-question__answers">
                      ${
                        feedback.correctOption
                          ? `<p class="revision-question__answer revision-question__answer--correct"><strong>Correct answer:</strong><span>${escapeHtml(feedback.correctOption)}</span></p>`
                          : ""
                      }
                      ${
                        feedback.studentAnswer
                          ? `<p class="revision-question__answer revision-question__answer--student"><strong>Your answer:</strong><span>${escapeHtml(feedback.studentAnswer)}</span></p>`
                          : ""
                      }
                    </div>
                  </div>
                `
                : "";
              return `
                <article class="revision-question">
                  <div class="revision-question__meta">${escapeHtml(type)} · ${escapeHtml(String(question.marks || 0))} marks · ${escapeHtml(question.skill || "")}</div>
                  <h5>${escapeHtml(`Q${question.number || ""}. ${question.prompt || ""}`)}</h5>
                  ${inputMarkup}
                  ${feedbackMarkup}
                </article>
              `;
            })
            .join("")}
        </section>
      `
    )
    .join("");

  elements.revisionTestContent.querySelectorAll("[data-revision-question]").forEach((input) => {
    const update = () => {
      const questionId = input.dataset.revisionQuestion;
      if (!questionId) {
        return;
      }
      if (input.type === "radio") {
        if (input.checked) {
          state.revisionResponses[questionId] = input.value;
        }
        return;
      }
      state.revisionResponses[questionId] = input.value;
    };
    input.addEventListener(input.type === "radio" ? "change" : "input", update);
  });

  if (state.revisionSubmission) {
    elements.revisionFeedback.classList.remove("hidden");
    elements.revisionFeedback.innerHTML = `
      <div class="revision-feedback__summary">
        <p class="revision-feedback__summary-copy">${escapeHtml(state.revisionSubmission.overallFeedback || "")}</p>
      </div>
    `;
  } else {
    elements.revisionFeedback.classList.add("hidden");
    elements.revisionFeedback.innerHTML = "";
  }
}

async function handleCreateRevisionTest() {
  const selectedEntry = getRevisionSubjectEntry();
  if (!selectedEntry) {
    elements.revisionStatus.textContent = "Select a subject first.";
    return;
  }

  const subject = state.subjects.find((item) => item.id === selectedEntry.subjectId);
  const noteBundles = getSelectedRevisionNoteBundles(subject);
  elements.revisionStatus.textContent = "Generating revision test...";
  try {
    await generateRevisionTest({
      subjectId: selectedEntry.subjectId,
      topic: state.revisionSelectedTopic,
      textTitle: state.revisionTextTitle,
      noteBundles
    });
    elements.revisionStatus.textContent = "";
  } catch (error) {
    elements.revisionStatus.textContent = error instanceof Error ? error.message : "Revision test generation failed.";
    elements.revisionTestStatus.textContent = elements.revisionStatus.textContent;
  }
}

async function handleSubmitRevisionTest() {
  if (!state.generatedRevisionTest) {
    elements.revisionTestStatus.textContent = "Create a test first.";
    return;
  }
  elements.revisionTestStatus.textContent = "Submitting test for feedback...";
  try {
    const payload = await requestApi("/api/revision/submit-test", {
      test: state.generatedRevisionTest,
      responses: state.revisionResponses
    });
    state.revisionSubmission = payload;
    elements.revisionTestStatus.textContent = "Feedback ready.";
    renderRevisionTestView();
  } catch (error) {
    elements.revisionTestStatus.textContent = error instanceof Error ? error.message : "Revision test submission failed.";
  }
}

function seededAssessment(taskNumber, componentTask, distributionDate, dueDate, weighting) {
  return {
    id: createId(),
    title: componentTask,
    taskNumber,
    componentTask,
    distributionDate,
    dueDate,
    weighting,
    description: `${componentTask}.`,
    linkedDocumentIds: [],
    completed: false
  };
}

function parseAssessmentDate(value) {
  if (!value) {
    return null;
  }

  const isoDateMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const parsedIsoDate = new Date(`${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}T00:00:00`);
    return Number.isNaN(parsedIsoDate.getTime()) ? null : parsedIsoDate;
  }

  const manualDateMatch = value.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})(?:\s+(\d{4}))?$/);
  if (manualDateMatch) {
    const parsed = new Date(`${manualDateMatch[1]} ${manualDateMatch[2]} ${manualDateMatch[3] || "2026"}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const termWeekMatch = value.match(/Term\s*(\d)\s*Week(?:s)?\s*(\d{1,2})/i);
  if (!termWeekMatch) {
    return null;
  }

  const [, termNumberText, weekNumberText] = termWeekMatch;
  const termStart = state.termStarts[Number(termNumberText)];
  if (!termStart) {
    return null;
  }

  const date = new Date(`${termStart}T00:00:00`);
  date.setDate(date.getDate() + (Number(weekNumberText) - 1) * 7);
  return date;
}

function getAssessmentSortTimestamp(assessment) {
  const parsedDate = parseAssessmentDate(assessment.dueDate);
  return parsedDate ? parsedDate.getTime() : Number.POSITIVE_INFINITY;
}

function getAssessmentEntries() {
  return state.subjects
    .flatMap((subject) =>
      subject.assessments.map((assessment) => ({
        subject,
        assessment,
        dueDateObject: parseAssessmentDate(assessment.dueDate)
      }))
    )
    .sort((left, right) => {
      const leftTime = left.dueDateObject ? left.dueDateObject.getTime() : Number.POSITIVE_INFINITY;
      const rightTime = right.dueDateObject ? right.dueDateObject.getTime() : Number.POSITIVE_INFINITY;
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      const leftTask = Number.parseInt(left.assessment.taskNumber, 10);
      const rightTask = Number.parseInt(right.assessment.taskNumber, 10);
      if (!Number.isNaN(leftTask) && !Number.isNaN(rightTask) && leftTask !== rightTask) {
        return leftTask - rightTask;
      }

      return left.subject.name.localeCompare(right.subject.name);
    });
}

function getUpcomingAssessmentEntries() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fortnightEnd = new Date(today);
  fortnightEnd.setDate(fortnightEnd.getDate() + 14);

  return getAssessmentEntries().filter(({ assessment, dueDateObject }) => {
    if (assessment.completed) {
      return false;
    }

    if (!dueDateObject) {
      return false;
    }

    return dueDateObject >= today && dueDateObject <= fortnightEnd;
  });
}

function getNextSubjectAssessment(subject) {
  return [...subject.assessments]
    .filter((assessment) => !assessment.completed)
    .sort((left, right) => getAssessmentSortTimestamp(left) - getAssessmentSortTimestamp(right))[0] || null;
}

function getDaysUntilDate(dateObject) {
  if (!dateObject) {
    return 0;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((dateObject.getTime() - today.getTime()) / 86400000));
}

function getNextAssessmentEntry() {
  const entries = getAssessmentEntries().filter(({ assessment }) => !assessment.completed);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return entries.find((entry) => entry.dueDateObject && entry.dueDateObject >= today) || entries.find((entry) => entry.dueDateObject) || null;
}

function getNextSubjectAssessmentEntry(subject) {
  const assessment = subject ? getNextSubjectAssessment(subject) : null;
  if (!subject || !assessment) {
    return null;
  }
  return {
    subject,
    assessment,
    dueDateObject: parseAssessmentDate(assessment.dueDate)
  };
}

function formatAssessmentDate(value) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(value);
  }

  const parsedDate = parseAssessmentDate(value);
  if (!parsedDate) {
    return value || "TBC";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
}

function formatAssessmentDueLabel(value) {
  const originalValue = value || "TBC";
  const parsedDate = parseAssessmentDate(value);
  if (!parsedDate) {
    return originalValue;
  }

  if (!/term\s*\d/i.test(originalValue)) {
    return formatAssessmentDate(parsedDate);
  }

  return `${originalValue} · ${formatAssessmentDate(parsedDate)}`;
}

function buildTaskExportName(subjectName, title) {
  const baseName = `${subjectName} ${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${baseName || "study-task"}.txt`;
}

function openUpcomingModal() {
  state.upcomingModalOpen = true;
  state.upcomingModalMode = "upcoming";
  elements.upcomingModal.classList.remove("hidden");
  elements.upcomingModal.setAttribute("aria-hidden", "false");
  renderUpcomingModal();
}

function closeUpcomingModal() {
  state.upcomingModalOpen = false;
  elements.upcomingModal.classList.add("hidden");
  elements.upcomingModal.setAttribute("aria-hidden", "true");
}

function loadAccounts() {
  const raw = window.localStorage.getItem(accountsStorageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
        ? parsed.map((account) => ({
          ...account,
          name: String(account?.name || "").trim(),
          email: normaliseAccountKey(account?.email),
          password: String(account?.password || ""),
          grade: normaliseGrade(account?.grade),
          points: Math.max(0, Number(account?.points || 0) || 0)
        })).filter((account) => account.email)
      : [];
  } catch (error) {
    console.error("Accounts could not be restored.", error);
    return [];
  }
}

function saveAccounts(accounts) {
  window.localStorage.setItem(
    accountsStorageKey,
    JSON.stringify(
      accounts.map((account) => ({
        ...account,
        name: String(account?.name || "").trim(),
        email: normaliseAccountKey(account?.email),
        password: String(account?.password || ""),
        grade: normaliseGrade(account?.grade),
        points: Math.max(0, Number(account?.points || 0) || 0)
      }))
    )
  );
}

function persistSession(email, token = "") {
  window.localStorage.setItem(sessionStorageKey, email);
  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token);
  } else {
    window.localStorage.removeItem(authTokenStorageKey);
  }
}

function clearSession() {
  window.localStorage.removeItem(sessionStorageKey);
  window.localStorage.removeItem(authTokenStorageKey);
}

function findLegacyAccountByEmail(email) {
  const normalisedEmail = normaliseAccountKey(email);
  if (!normalisedEmail) {
    return null;
  }
  return loadAccounts().find((account) => normaliseAccountKey(account.email) === normalisedEmail) || null;
}

function getStoredSessionToken() {
  return String(window.localStorage.getItem(authTokenStorageKey) || "").trim();
}

function syncSignInMode() {
  const isCreateMode = state.authMode === "create";
  elements.signInEyebrow.textContent = isCreateMode ? "Student account" : "Student sign in";
  elements.signInTitle.textContent = isCreateMode ? "Create your account" : "Sign in to PaperPanda";
  elements.studentNameWrap.classList.toggle("hidden", !isCreateMode);
  elements.studentGradeWrap.classList.toggle("hidden", !isCreateMode);
  elements.studentPasswordConfirmWrap.classList.toggle("hidden", !isCreateMode);
  elements.openDashboardButton.textContent = state.authPending
    ? isCreateMode
      ? "Creating account..."
      : "Signing in..."
    : isCreateMode
      ? "Create account"
      : "Sign in";
  elements.signInModeCreateButton.classList.toggle("signin-mode-button--active", isCreateMode);
  elements.signInModeLoginButton.classList.toggle("signin-mode-button--active", !isCreateMode);
  elements.openDashboardButton.classList.toggle("is-loading", state.authPending);
  elements.openDashboardButton.disabled = state.authPending;
  elements.openDashboardButton.setAttribute("aria-busy", state.authPending ? "true" : "false");
  [elements.signInModeCreateButton, elements.signInModeLoginButton].forEach((button) => {
    button.disabled = state.authPending;
  });
  elements.signInForm?.querySelectorAll("input, select").forEach((field) => {
    field.disabled = state.authPending;
  });
  elements.signInForm?.classList.toggle("signin-card--busy", state.authPending);
  elements.signInNote.textContent = isCreateMode
    ? "Create an account first, then sign in with your school email and password."
    : "Use the school email and password you created for this portal.";
}

function setAuthPending(isPending, statusText = "") {
  state.authPending = Boolean(isPending);
  syncSignInMode();
  if (statusText || !state.authPending) {
    elements.signInStatus.textContent = statusText;
  }
}

function flushUiFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function hydrateSettingsView() {
  if (!state.currentUserEmail) {
    return;
  }

  elements.settingsNameInput.value = state.studentName || "";
  elements.settingsEmailInput.value = state.currentUserEmail || "";
  elements.settingsGradeSelect.value = normaliseGrade(state.studentGrade);
  elements.settingsCurrentPasswordInput.value = "";
  elements.settingsNewPasswordInput.value = "";
  elements.settingsConfirmPasswordInput.value = "";
  elements.settingsStatus.textContent = "";
  renderSubjectIconSettings();
}

function renderSubjectIconSettings() {
  if (!elements.settingsSubjectIcons) {
    return;
  }

  elements.settingsSubjectIcons.innerHTML = state.subjects
    .map((subject) => {
      const currentChoice = getSubjectIconChoice(subject.id);
      return `
        <label class="subject-icon-setting">
          <span class="subject-icon-setting__subject">${escapeHtml(subject.name)}</span>
          <span class="subject-icon-setting__controls">
            <span class="subject-icon-setting__preview">
              ${currentChoice ? `<img src="${escapeHtml(currentChoice.src)}" alt="${escapeHtml(currentChoice.label)}" class="subject-icon-setting__preview-image" />` : `<span>${escapeHtml(getSubjectShortCode(subject.name))}</span>`}
            </span>
            <select class="upload-select subject-icon-setting__select" data-subject-icon-select="${subject.id}">
              ${pandaEmojiChoices
                .map(
                  (choice) =>
                    `<option value="${choice.id}" ${choice.id === currentChoice?.id ? "selected" : ""}>${escapeHtml(choice.label)}</option>`
                )
                .join("")}
            </select>
          </span>
        </label>
      `;
    })
    .join("");

  elements.settingsSubjectIcons.querySelectorAll("[data-subject-icon-select]").forEach((select) => {
    select.addEventListener("change", () => {
      const subjectId = select.dataset.subjectIconSelect;
      const choice = pandaEmojiChoices.find((item) => item.id === select.value) || pandaEmojiChoices[0];
      if (!subjectId || !choice) {
        return;
      }
      state.settings.subjectIcons = {
        ...state.settings.subjectIcons,
        [subjectId]: choice.id
      };
      renderSubjectIconSettings();
    });
  });
}

function saveSubjectIconSettings() {
  persistSettings();
  elements.settingsStatus.textContent = "Subject pandas saved.";
  render();
}

function openPreviewDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  if (!previewDatabasePromise) {
    previewDatabasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(previewDatabaseName, 2);
      request.onerror = () => reject(request.error || new Error("Preview storage could not be opened."));
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(previewStoreName)) {
          database.createObjectStore(previewStoreName, { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains(settingsAssetStoreName)) {
          database.createObjectStore(settingsAssetStoreName, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
    }).catch((error) => {
      console.error("Preview database failed to open.", error);
      previewDatabasePromise = null;
      return null;
    });
  }

  return previewDatabasePromise;
}

async function putSettingsAssetRecord(assetId, dataUrl) {
  const database = await openPreviewDatabase();
  if (!database || !assetId || !dataUrl) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(settingsAssetStoreName, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Background asset could not be saved."));
    transaction.objectStore(settingsAssetStoreName).put({ id: assetId, dataUrl });
  });
}

async function getSettingsAssetRecord(assetId) {
  const database = await openPreviewDatabase();
  if (!database || !assetId) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(settingsAssetStoreName, "readonly");
    const request = transaction.objectStore(settingsAssetStoreName).get(assetId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Background asset could not be loaded."));
  });
}

async function deleteSettingsAssetRecords(assetIds) {
  const database = await openPreviewDatabase();
  if (!database || !assetIds.length) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(settingsAssetStoreName, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Background assets could not be removed."));
    const store = transaction.objectStore(settingsAssetStoreName);
    assetIds.forEach((assetId) => {
      if (assetId) {
        store.delete(assetId);
      }
    });
  });
}

async function putPreviewRecord(documentId, previewImageUrl) {
  const database = await openPreviewDatabase();
  if (!database || !previewImageUrl) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(previewStoreName, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Preview image could not be saved."));
    transaction.objectStore(previewStoreName).put({ id: documentId, previewImageUrl });
  });
}

function createPagePreviewRecordId(documentId, pageNumber) {
  return `${documentId}::page-${Number(pageNumber || 0)}`;
}

async function getPreviewRecord(documentId) {
  const database = await openPreviewDatabase();
  if (!database) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(previewStoreName, "readonly");
    const request = transaction.objectStore(previewStoreName).get(documentId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Preview image could not be loaded."));
  });
}

async function deletePreviewRecords(documentIds, documentRecords = []) {
  const database = await openPreviewDatabase();
  if (!database || !documentIds.length) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(previewStoreName, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Preview images could not be removed."));
    const store = transaction.objectStore(previewStoreName);
    documentIds.forEach((documentId) => {
      store.delete(documentId);
      documentRecords
        .filter((documentRecord) => documentRecord.id === documentId)
        .forEach((documentRecord) => {
          (documentRecord.pages || []).forEach((page) => {
            if (page?.pageNumber) {
              store.delete(createPagePreviewRecordId(documentId, page.pageNumber));
            }
          });
      });
    });
  });
}

function syncPreviewPersistence() {
  const previewEntries = state.subjects.flatMap((subject) =>
    (subject.documents || []).flatMap((documentRecord) => {
      const entries = [];
      if (documentRecord.previewImageUrl) {
        entries.push({
          id: documentRecord.id,
          previewImageUrl: documentRecord.previewImageUrl
        });
      }
      (documentRecord.pages || []).forEach((page) => {
        if (page?.imageUrl) {
          entries.push({
            id: createPagePreviewRecordId(documentRecord.id, page.pageNumber),
            previewImageUrl: page.imageUrl
          });
        }
      });
      return entries;
    })
  );

  if (!previewEntries.length) {
    return;
  }

  Promise.all(previewEntries.map((entry) => putPreviewRecord(entry.id, entry.previewImageUrl))).catch((error) => {
    console.error("Preview images could not be synced.", error);
  });
}

async function hydratePreviewImages() {
  const documentsNeedingPreviewHydration = state.subjects.flatMap((subject) =>
    (subject.documents || []).filter(
      (documentRecord) =>
        !documentRecord.previewImageUrl ||
        (documentRecord.pages || []).some((page) => !page?.imageUrl)
    )
  );

  if (!documentsNeedingPreviewHydration.length) {
    return;
  }

  let hydratedAnyPreview = false;

  for (const documentRecord of documentsNeedingPreviewHydration) {
    try {
      if (!documentRecord.previewImageUrl) {
        const previewRecord = await getPreviewRecord(documentRecord.id);
        if (previewRecord?.previewImageUrl) {
          documentRecord.previewImageUrl = previewRecord.previewImageUrl;
          hydratedAnyPreview = true;
        }
      }
      for (const page of documentRecord.pages || []) {
        if (page?.imageUrl || !page?.pageNumber) {
          continue;
        }
        const pagePreviewRecord = await getPreviewRecord(createPagePreviewRecordId(documentRecord.id, page.pageNumber));
        if (pagePreviewRecord?.previewImageUrl) {
          page.imageUrl = pagePreviewRecord.previewImageUrl;
          hydratedAnyPreview = true;
        }
      }
    } catch (error) {
      console.error(`Preview image failed to load for ${documentRecord.id}.`, error);
    }
  }

  if (hydratedAnyPreview) {
    render();
  }
}

function createPersistableDocument(documentRecord) {
  return {
    ...documentRecord,
    pages: Array.isArray(documentRecord.pages)
      ? documentRecord.pages.map((page) => ({
          pageNumber: Number(page?.pageNumber || 0),
          text: String(page?.text || "").trim()
        }))
      : [],
    previewImageUrl: null,
    originalFile: documentRecord.originalFile
      ? {
          name: documentRecord.originalFile.name || "",
          mimeType: documentRecord.originalFile.mimeType || "",
          kind: documentRecord.originalFile.kind || ""
        }
      : null
  };
}

function createQuotaFallbackDocument(documentRecord) {
  return {
    id: documentRecord.id,
    title: documentRecord.title,
    type: documentRecord.type,
    added: documentRecord.added,
    addedAt: documentRecord.addedAt,
    content: typeof documentRecord.content === "string" ? documentRecord.content.slice(0, 4000) : "",
    workNotes: typeof documentRecord.workNotes === "string" ? documentRecord.workNotes.slice(0, 4000) : "",
    flags: { ...(documentRecord.flags || {}) },
    pageNumber: documentRecord.pageNumber || null,
    pages: Array.isArray(documentRecord.pages)
      ? documentRecord.pages.slice(0, 10).map((page) => ({
          pageNumber: Number(page?.pageNumber || 0),
          text: String(page?.text || "").slice(0, 1200)
        }))
      : [],
    studyOverview: String(documentRecord.studyOverview || "").slice(0, 1200),
    studyPlanStatus: documentRecord.studyPlanStatus || "idle",
    studySections: Array.isArray(documentRecord.studySections)
      ? documentRecord.studySections.slice(0, 8).map((section, index) => ({
          id: String(section?.id || `section-${index + 1}`),
          title: String(section?.title || "").slice(0, 120),
          summary: String(section?.summary || "").slice(0, 400),
          sectionText: String(section?.sectionText || "").slice(0, 2000),
          pageStart: Number(section?.pageStart || 0) || null,
          pageEnd: Number(section?.pageEnd || 0) || null,
          importantTerms: Array.isArray(section?.importantTerms) ? section.importantTerms.slice(0, 8) : []
        }))
      : [],
    completedSectionIds: Array.isArray(documentRecord.completedSectionIds) ? documentRecord.completedSectionIds.slice(0, 20) : [],
    currentSectionIndex: Number(documentRecord.currentSectionIndex || 0),
    importantTerms: Array.isArray(documentRecord.importantTerms) ? documentRecord.importantTerms.slice(0, 20) : [],
    endQuiz: documentRecord.endQuiz || null,
    quizSubmission: documentRecord.quizSubmission || null,
    pointsAwarded: Boolean(documentRecord.pointsAwarded),
    originalFile: null,
    previewImageUrl: null
  };
}

function createPersistableSubjects(subjects) {
  return subjects.map((subject) => ({
    ...subject,
    documents: Array.isArray(subject.documents)
      ? subject.documents.map(createPersistableDocument)
      : []
  }));
}

function createQuotaFallbackSubjects(subjects) {
  return subjects.map((subject) => ({
    ...subject,
    askHistory: Array.isArray(subject.askHistory) ? subject.askHistory.slice(-5) : [],
    documents: Array.isArray(subject.documents)
      ? subject.documents.map(createQuotaFallbackDocument)
      : []
  }));
}

function loadStoredSubjectsMap() {
  const raw = window.localStorage.getItem(subjectsStorageKey);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.error("Subject store could not be restored.", error);
    return {};
  }
}

function saveStoredSubjectsMap(subjectsByAccount) {
  window.localStorage.setItem(subjectsStorageKey, JSON.stringify(subjectsByAccount));
}

function hydrateStoredSubject(subject, index) {
  const subjectSeedEntry = resolveSubjectSeedEntry(subject, index);
  const resolvedSubjectId = String(subject?.id || subjectSeedEntry?.id || "");
  return {
    ...structuredClone(subjectSeedEntry || {}),
    ...subject,
    documents: Array.isArray(subject.documents) ? subject.documents.map(normaliseDocument) : [],
    assessments: Array.isArray(subject.assessments) ? subject.assessments.map(normaliseAssessment) : [],
    watch: Array.isArray(subject.watch)
      ? subject.watch
          .filter((item) => item?.url)
          .flatMap((item) => {
            const source = item.source || "manual";
            if (source !== "manual") {
              return [];
            }
            return [{ ...item, subjectId: item.subjectId || resolvedSubjectId, source: "manual" }];
          })
      : [],
    hiddenWatchUrls: Array.isArray(subject.hiddenWatchUrls) ? subject.hiddenWatchUrls.filter(Boolean) : [],
    askHistory: Array.isArray(subject.askHistory) ? subject.askHistory : [],
    savedRevisionTests: Array.isArray(subject.savedRevisionTests)
      ? subject.savedRevisionTests.map(normaliseSavedRevisionTest)
      : [],
    spelling: normaliseSpellingState(subject.spelling, resolvedSubjectId),
    practice: Array.isArray(subject.practice)
      ? subject.practice
      : structuredClone(subjectSeedEntry?.practice || [])
  };
}

function createDefaultSpellingState(subjectId = "") {
  const enabled = subjectId === "spelling";
  return {
    enabled,
    activeUnitId: SPELLING_UNIT_SEED.id,
    coachMessage: enabled
      ? "Start with the spoken diagnostic so the follow-up work is built from real errors."
      : "",
    preferences: {
      font: "lexend",
      spacing: "wide",
      tint: "cream"
    },
    focusSummary: [],
    followUpWordIds: [],
    diagnostic: {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    },
    looksRight: {
      answers: {},
      checked: false,
      completed: false
    },
    flashcards: {
      version: SPELLING_FLASHCARDS_VERSION,
      cards: {},
      currentWordId: "",
      completed: false
    },
    tenseTransfer: {
      version: SPELLING_TENSE_TRANSFER_VERSION,
      answers: {},
      currentWordId: "",
      completed: false
    },
    selectedStageId: "",
    celebrationStageId: ""
  };
}

function normaliseSpellingState(spelling, subjectId = "") {
  const base = createDefaultSpellingState(subjectId);
  const next = spelling && typeof spelling === "object" && !Array.isArray(spelling) ? spelling : {};
  const diagnostic = next.diagnostic && typeof next.diagnostic === "object" ? next.diagnostic : {};
  const looksRight = next.looksRight && typeof next.looksRight === "object" ? next.looksRight : {};
  const flashcards = next.flashcards && typeof next.flashcards === "object" ? next.flashcards : {};
  const tenseTransfer = next.tenseTransfer && typeof next.tenseTransfer === "object" ? next.tenseTransfer : {};
  const isCurrentFlashcardsVersion = Number(flashcards.version || 0) === SPELLING_FLASHCARDS_VERSION;
  const isCurrentTenseTransferVersion = Number(tenseTransfer.version || 0) === SPELLING_TENSE_TRANSFER_VERSION;

  return {
    ...base,
    ...next,
    enabled: subjectId === "spelling",
    activeUnitId: next.activeUnitId || base.activeUnitId,
    coachMessage: String(next.coachMessage || base.coachMessage || ""),
    preferences: {
      ...base.preferences,
      ...(next.preferences && typeof next.preferences === "object" ? next.preferences : {})
    },
    focusSummary: Array.isArray(next.focusSummary)
      ? next.focusSummary
          .map((entry) => ({
            id: String(entry?.id || ""),
            count: Number(entry?.count || 0)
          }))
          .filter((entry) => entry.id && SPELLING_FOCUS_LABELS[entry.id] && entry.count > 0)
      : [],
    followUpWordIds: Array.isArray(next.followUpWordIds)
      ? next.followUpWordIds
          .map((value) => String(value || ""))
          .filter((value) => SPELLING_INTERVENTION_LIBRARY[value])
          .slice(0, SPELLING_UNIT_SEED.followUpWordCount)
      : [],
    diagnostic: {
      ...base.diagnostic,
      ...diagnostic,
      currentIndex: Math.min(
        SPELLING_DIAGNOSTIC_WORDS.length,
        Math.max(0, Number(diagnostic.currentIndex || 0))
      ),
      currentInput: String(diagnostic.currentInput || ""),
      responses: diagnostic.responses && typeof diagnostic.responses === "object" && !Array.isArray(diagnostic.responses)
        ? Object.fromEntries(
            Object.entries(diagnostic.responses).map(([wordId, entry]) => [
              wordId,
              {
                attempt: String(entry?.attempt || ""),
                correct: Boolean(entry?.correct)
              }
            ])
          )
        : {},
      completed: Boolean(diagnostic.completed)
    },
    looksRight: {
      ...base.looksRight,
      ...looksRight,
      answers: looksRight.answers && typeof looksRight.answers === "object" && !Array.isArray(looksRight.answers)
        ? Object.fromEntries(
            Object.entries(looksRight.answers).map(([wordId, value]) => [wordId, String(value || "")])
          )
        : {},
      checked: Boolean(looksRight.checked),
      completed: Boolean(looksRight.completed)
    },
    flashcards: {
      ...base.flashcards,
      ...(isCurrentFlashcardsVersion ? flashcards : {}),
      version: SPELLING_FLASHCARDS_VERSION,
      cards: isCurrentFlashcardsVersion && flashcards.cards && typeof flashcards.cards === "object" && !Array.isArray(flashcards.cards)
        ? Object.fromEntries(
            Object.entries(flashcards.cards).map(([wordId, entry]) => [
              wordId,
              {
                exposureIndex: Math.max(0, Math.min(3, Number(entry?.exposureIndex || 0))),
                isShowingSentence: Boolean(entry?.isShowingSentence),
                typedValue: String(entry?.typedValue || ""),
                checked: Boolean(entry?.checked),
                completed: Boolean(entry?.completed)
              }
            ])
          )
        : {},
      currentWordId: isCurrentFlashcardsVersion ? String(flashcards.currentWordId || "") : "",
      completed: isCurrentFlashcardsVersion ? Boolean(flashcards.completed) : false
    },
    tenseTransfer: {
      ...base.tenseTransfer,
      ...(isCurrentTenseTransferVersion ? tenseTransfer : {}),
      version: SPELLING_TENSE_TRANSFER_VERSION,
      answers: isCurrentTenseTransferVersion && tenseTransfer.answers && typeof tenseTransfer.answers === "object" && !Array.isArray(tenseTransfer.answers)
        ? Object.fromEntries(
            Object.entries(tenseTransfer.answers).map(([wordId, entry]) => [
              wordId,
              {
                exposureIndex: Math.max(0, Math.min(3, Number(entry?.exposureIndex || 0))),
                isShowingSentence: Boolean(entry?.isShowingSentence),
                typedValue: String(entry?.typedValue || ""),
                checked: Boolean(entry?.checked),
                completed: Boolean(entry?.completed)
              }
            ])
          )
        : {},
      currentWordId: isCurrentTenseTransferVersion ? String(tenseTransfer.currentWordId || "") : "",
      completed: isCurrentTenseTransferVersion ? Boolean(tenseTransfer.completed) : false
    },
    selectedStageId: SPELLING_STAGE_ORDER.includes(String(next.selectedStageId || "")) ? String(next.selectedStageId || "") : "",
    celebrationStageId: SPELLING_STAGE_ORDER.includes(String(next.celebrationStageId || "")) ? String(next.celebrationStageId || "") : ""
  };
}

function getSubjectSpellingState(subject) {
  if (!subject) {
    return createDefaultSpellingState("");
  }
  subject.spelling = normaliseSpellingState(subject.spelling, subject.id);
  return subject.spelling;
}

function normalizeSpellingAttempt(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function getSpellingStageCompletionMap(subject) {
  const spelling = getSubjectSpellingState(subject);
  return {
    diagnostic: Boolean(spelling.diagnostic.completed),
    "looks-right": Boolean(spelling.looksRight.completed),
    "word-families": Boolean(spelling.flashcards.completed),
    "tense-transfer": Boolean(spelling.tenseTransfer.completed)
  };
}

function getSpellingTotalActivityCount(subject) {
  return getSubjectSpellingState(subject).enabled ? SPELLING_STAGE_ORDER.length : 0;
}

function getSpellingCompletedActivityCount(subject) {
  const completionMap = getSpellingStageCompletionMap(subject);
  if (!getSubjectSpellingState(subject).enabled) {
    return 0;
  }
  return Object.values(completionMap).filter(Boolean).length;
}

function getSpellingPendingActivityCount(subject) {
  const total = getSpellingTotalActivityCount(subject);
  return Math.max(0, total - getSpellingCompletedActivityCount(subject));
}

function getSpellingMasteryRatio(subject) {
  const total = getSpellingTotalActivityCount(subject);
  return total ? getSpellingCompletedActivityCount(subject) / total : 0;
}

function getSpellingStageId(subject) {
  const completionMap = getSpellingStageCompletionMap(subject);
  return SPELLING_STAGE_ORDER.find((stageId) => !completionMap[stageId]) || SPELLING_STAGE_ORDER[SPELLING_STAGE_ORDER.length - 1];
}

function getSpellingVisibleStageId(subject) {
  const spelling = getSubjectSpellingState(subject);
  const unlockedStageIndex = Math.min(getSpellingCompletedActivityCount(subject), SPELLING_STAGE_ORDER.length - 1);
  const selectedStageId = String(spelling.selectedStageId || "");
  const selectedStageIndex = SPELLING_STAGE_ORDER.indexOf(selectedStageId);
  if (selectedStageIndex >= 0 && selectedStageIndex <= unlockedStageIndex) {
    return selectedStageId;
  }
  return getSpellingStageId(subject);
}

function setSpellingSelectedStage(subject, stageId) {
  const spelling = getSubjectSpellingState(subject);
  if (!SPELLING_STAGE_ORDER.includes(stageId)) {
    return;
  }
  const unlockedStageIndex = Math.min(getSpellingCompletedActivityCount(subject), SPELLING_STAGE_ORDER.length - 1);
  const nextStageIndex = SPELLING_STAGE_ORDER.indexOf(stageId);
  if (nextStageIndex > unlockedStageIndex) {
    return;
  }
  spelling.selectedStageId = stageId;
  spelling.celebrationStageId = "";
  persistSubjects();
}

function celebrateSpellingStage(subject, stageId, coachMessage) {
  const spelling = getSubjectSpellingState(subject);
  spelling.selectedStageId = stageId;
  spelling.celebrationStageId = stageId;
  if (coachMessage) {
    spelling.coachMessage = coachMessage;
  }
  persistSubjects();
}

function continueSpellingStage(subject) {
  const spelling = getSubjectSpellingState(subject);
  const celebrationStageId = String(spelling.celebrationStageId || "");
  const celebrationStageIndex = SPELLING_STAGE_ORDER.indexOf(celebrationStageId);
  const nextStageId =
    celebrationStageIndex >= 0 && celebrationStageIndex < SPELLING_STAGE_ORDER.length - 1
      ? SPELLING_STAGE_ORDER[celebrationStageIndex + 1]
      : SPELLING_STAGE_ORDER[SPELLING_STAGE_ORDER.length - 1];
  spelling.celebrationStageId = "";
  spelling.selectedStageId = nextStageId;
  persistSubjects();
}

function getSpellingCelebrationCopy(stageId) {
  if (stageId === "diagnostic") {
    return {
      eyebrow: "Ribbon earned",
      title: "Diagnostic complete",
      body: "The spelling profile is ready. Continue to the sentence check so the follow-up words can be narrowed to the patterns that still look uncertain.",
      action: "Continue to stage 2"
    };
  }
  if (stageId === "looks-right") {
    return {
      eyebrow: "Ribbon earned",
      title: "Sentence check complete",
      body: "The words that still look unstable have been identified. Continue to the next stage to rehearse them one at a time through word-family sentences.",
      action: "Continue to stage 3"
    };
  }
  if (stageId === "word-families") {
    return {
      eyebrow: "Ribbon earned",
      title: "Word family stage complete",
      body: "Those family clues held. Continue to the final stage for another sentence-based recall pass before the program closes.",
      action: "Continue to stage 4"
    };
  }
  return {
    eyebrow: "Final ribbon",
    title: "Program complete",
    body: "All four stages are complete. You can now review earlier stages and keep these words in spaced practice.",
    action: "Finish"
  };
}

function getSpellingStageLabel(subject) {
  const stageId = getSpellingStageId(subject);
  return SPELLING_STAGE_LABELS[stageId] || SPELLING_STAGE_LABELS.diagnostic;
}

function getSpellingDiagnosticCurrentWord(spelling) {
  return SPELLING_DIAGNOSTIC_WORDS[spelling.diagnostic.currentIndex] || null;
}

function getSpellingDiagnosticCorrectCount(spelling) {
  return Object.values(spelling.diagnostic.responses).filter((entry) => entry?.correct).length;
}

function buildSpellingFocusSummaryFromResponses(responses) {
  const counts = new Map();
  SPELLING_DIAGNOSTIC_WORDS.forEach((wordEntry) => {
    const response = responses[wordEntry.id];
    if (!response || response.correct) {
      return;
    }
    (wordEntry.focuses || []).forEach((focusId) => {
      counts.set(focusId, (counts.get(focusId) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([id, count]) => ({ id, count }));
}

function getSpellingTopFocuses(spelling, limit = 3) {
  const focusSummary = spelling.focusSummary.length
    ? spelling.focusSummary
    : buildSpellingFocusSummaryFromResponses(spelling.diagnostic.responses);
  return focusSummary.slice(0, limit);
}

function buildSpellingFollowUpWordIdsFromResponses(responses) {
  const followUpWordIds = [];
  SPELLING_DIAGNOSTIC_WORDS.forEach((wordEntry) => {
    if (!wordEntry.interventionId) {
      return;
    }
    const response = responses[wordEntry.id];
    if (response && !response.correct && !followUpWordIds.includes(wordEntry.interventionId)) {
      followUpWordIds.push(wordEntry.interventionId);
    }
  });
  SPELLING_DEFAULT_FOLLOW_UP_WORD_IDS.forEach((wordId) => {
    if (!followUpWordIds.includes(wordId)) {
      followUpWordIds.push(wordId);
    }
  });
  return followUpWordIds.slice(0, SPELLING_UNIT_SEED.followUpWordCount);
}

function ensureSpellingFollowUpWordIds(spelling) {
  if (!spelling.followUpWordIds.length) {
    spelling.followUpWordIds = buildSpellingFollowUpWordIdsFromResponses(spelling.diagnostic.responses);
  }
  return spelling.followUpWordIds;
}

function getSpellingFollowUpWords(spelling) {
  return ensureSpellingFollowUpWordIds(spelling)
    .map((wordId) => SPELLING_INTERVENTION_LIBRARY[wordId])
    .filter(Boolean);
}

function getSpellingFlashcardWords(spelling) {
  const followUpWords = getSpellingFollowUpWords(spelling);
  const missedLooksRightIds = followUpWords
    .filter((entry) => spelling.looksRight.answers[entry.id] !== entry.word)
    .map((entry) => entry.id);
  const stableIds = followUpWords
    .filter((entry) => spelling.looksRight.answers[entry.id] === entry.word)
    .map((entry) => entry.id);
  return [...missedLooksRightIds, ...stableIds]
    .map((wordId) => SPELLING_INTERVENTION_LIBRARY[wordId])
    .filter(Boolean);
}

function ensureSpellingFlashcardCard(spelling, wordId) {
  if (!spelling.flashcards.cards[wordId]) {
    spelling.flashcards.cards[wordId] = {
      exposureIndex: 0,
      isShowingSentence: false,
      typedValue: "",
      checked: false,
      completed: false
    };
  }
  return spelling.flashcards.cards[wordId];
}

function getSpellingFlashcardCurrentWord(spelling) {
  const flashcardWords = getSpellingFlashcardWords(spelling);
  if (!flashcardWords.length) {
    return null;
  }

  if (spelling.flashcards.currentWordId) {
    const activeWord = flashcardWords.find((entry) => entry.id === spelling.flashcards.currentWordId);
    if (activeWord && !ensureSpellingFlashcardCard(spelling, activeWord.id).completed) {
      return activeWord;
    }
  }

  const nextWord = flashcardWords.find((entry) => !ensureSpellingFlashcardCard(spelling, entry.id).completed) || null;
  spelling.flashcards.currentWordId = nextWord?.id || "";
  return nextWord;
}

function ensureSpellingTenseAnswer(spelling, wordId) {
  if (!spelling.tenseTransfer.answers[wordId]) {
    spelling.tenseTransfer.answers[wordId] = {
      exposureIndex: 0,
      isShowingSentence: false,
      typedValue: "",
      checked: false,
      completed: false
    };
  }
  return spelling.tenseTransfer.answers[wordId];
}

function isSpellingLooksRightComplete(spelling) {
  const followUpWords = getSpellingFollowUpWords(spelling);
  return Boolean(followUpWords.length) && followUpWords.every((entry) => Boolean(spelling.looksRight.answers[entry.id]));
}

function getSpellingLooksRightSentence(entry) {
  const diagnosticMatch = SPELLING_DIAGNOSTIC_WORDS.find(
    (wordEntry) => wordEntry.interventionId === entry.id || normalizeSpellingAttempt(wordEntry.word) === normalizeSpellingAttempt(entry.word)
  );
  return diagnosticMatch?.sentence || `Use ${entry.word} in a sentence with precision.`;
}

function buildSpellingLooksRightChoiceSentence(sentence, originalWord, replacementWord) {
  const wordPattern = new RegExp(`\\b${escapeRegex(originalWord)}\\b`, "i");
  const match = sentence.match(wordPattern);
  if (match && match.index !== undefined) {
    const before = sentence.slice(0, match.index);
    const after = sentence.slice(match.index + match[0].length);
    return `${escapeHtml(before)}<span class="spelling-inline-target">${escapeHtml(replacementWord)}</span>${escapeHtml(after)}`;
  }
  return `${escapeHtml(sentence)} <span class="spelling-inline-target">(${escapeHtml(replacementWord)})</span>`;
}

function getSpellingLooksRightCurrentWord(spelling) {
  const followUpWords = getSpellingFollowUpWords(spelling);
  return followUpWords.find((entry) => !spelling.looksRight.answers[entry.id]) || followUpWords[0] || null;
}

function shouldSpellingLooksRightShowCorrectFirst(wordId) {
  const hash = String(wordId || "").split("").reduce((total, character) => total + character.charCodeAt(0), 0);
  return hash % 2 === 0;
}

function getSpellingTenseCurrentWord(spelling) {
  const followUpWords = getSpellingFollowUpWords(spelling);
  if (!followUpWords.length) {
    return null;
  }

  if (spelling.tenseTransfer.currentWordId) {
    const activeWord = followUpWords.find((entry) => entry.id === spelling.tenseTransfer.currentWordId);
    if (activeWord && !ensureSpellingTenseAnswer(spelling, activeWord.id).completed) {
      return activeWord;
    }
  }

  const nextWord = followUpWords.find((entry) => !ensureSpellingTenseAnswer(spelling, entry.id).completed) || null;
  spelling.tenseTransfer.currentWordId = nextWord?.id || "";
  return nextWord;
}

function isSpellingFlashcardsComplete(spelling) {
  const flashcardWords = getSpellingFlashcardWords(spelling);
  return Boolean(flashcardWords.length) && flashcardWords.every((entry) => ensureSpellingFlashcardCard(spelling, entry.id).completed);
}

function isSpellingTenseTransferComplete(spelling) {
  const followUpWords = getSpellingFollowUpWords(spelling);
  return Boolean(followUpWords.length) && followUpWords.every((entry) => ensureSpellingTenseAnswer(spelling, entry.id).completed);
}

function finaliseSpellingDiagnostic(subject) {
  const spelling = getSubjectSpellingState(subject);
  spelling.diagnostic.completed = true;
  spelling.focusSummary = buildSpellingFocusSummaryFromResponses(spelling.diagnostic.responses);
  spelling.followUpWordIds = buildSpellingFollowUpWordIdsFromResponses(spelling.diagnostic.responses);
  spelling.looksRight.checked = false;
  spelling.looksRight.completed = false;
  spelling.flashcards = {
    version: SPELLING_FLASHCARDS_VERSION,
    cards: {},
    currentWordId: "",
    completed: false
  };
  spelling.tenseTransfer = {
    version: SPELLING_TENSE_TRANSFER_VERSION,
    answers: {},
    currentWordId: "",
    completed: false
  };
  const topFocuses = getSpellingTopFocuses(spelling, 2).map((entry) => SPELLING_FOCUS_LABELS[entry.id] || entry.id);
  celebrateSpellingStage(
    subject,
    "diagnostic",
    topFocuses.length
      ? `Diagnostic complete. The strongest follow-up needs are ${topFocuses.join(" and ").toLowerCase()}.`
      : "Diagnostic complete. The follow-up stages are ready."
  );
}

function resetSpellingActivity(subject, activityId) {
  const spelling = getSubjectSpellingState(subject);
  if (activityId === "diagnostic") {
    spelling.diagnostic = {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    };
    spelling.looksRight = {
      answers: {},
      checked: false,
      completed: false
    };
    spelling.flashcards = {
      version: SPELLING_FLASHCARDS_VERSION,
      cards: {},
      currentWordId: "",
      completed: false
    };
    spelling.tenseTransfer = {
      version: SPELLING_TENSE_TRANSFER_VERSION,
      answers: {},
      currentWordId: "",
      completed: false
    };
    spelling.focusSummary = [];
    spelling.followUpWordIds = [];
    spelling.coachMessage = "Start with the spoken diagnostic so the follow-up work is built from real errors.";
  } else if (activityId === "looks-right") {
    spelling.looksRight = {
      answers: {},
      checked: false,
      completed: false
    };
    spelling.flashcards = {
      version: SPELLING_FLASHCARDS_VERSION,
      cards: {},
      currentWordId: "",
      completed: false
    };
    spelling.tenseTransfer = {
      version: SPELLING_TENSE_TRANSFER_VERSION,
      answers: {},
      currentWordId: "",
      completed: false
    };
    spelling.coachMessage = "Use the visual check to decide which spelling pattern looks settled on the page.";
  } else if (activityId === "word-families") {
    spelling.flashcards = {
      version: SPELLING_FLASHCARDS_VERSION,
      cards: {},
      currentWordId: "",
      completed: false
    };
    spelling.tenseTransfer = {
      version: SPELLING_TENSE_TRANSFER_VERSION,
      answers: {},
      currentWordId: "",
      completed: false
    };
    spelling.coachMessage = "Reveal the word map, hide it, then write the word from memory.";
  } else if (activityId === "tense-transfer") {
    spelling.tenseTransfer = {
      version: SPELLING_TENSE_TRANSFER_VERSION,
      answers: {},
      currentWordId: "",
      completed: false
    };
    spelling.coachMessage = "Open each word to hear three family sentences, then type the key word from memory.";
  } else {
    subject.spelling = createDefaultSpellingState(subject.id);
  }
  spelling.selectedStageId = "";
  spelling.celebrationStageId = "";
  persistSubjects();
}

function speakSpellingDiagnosticWord(wordEntry) {
  if (!wordEntry) {
    return;
  }
  const audioContext = `spelling:diagnostic:${wordEntry.id}`;
  if (currentAudioContext === audioContext) {
    stopListening();
    render();
    return;
  }

  void speakTextWithOpenAi(`Spell the word ${wordEntry.word}. ${wordEntry.sentence}`, {
    context: audioContext,
    statusMessages: {
      preparing: "Preparing spelling audio...",
      playing: "Reading spelling word...",
      error: "Spelling audio failed."
    }
  })
    .then(() => {
      render();
    })
    .catch((error) => {
      console.error("Spelling audio failed.", error);
      render();
    });
}

function submitSpellingDiagnosticWord(subject, attemptOverride = null) {
  const spelling = getSubjectSpellingState(subject);
  const wordEntry = getSpellingDiagnosticCurrentWord(spelling);
  if (!wordEntry) {
    return;
  }
  const attempt = String(
    attemptOverride !== null && attemptOverride !== undefined
      ? attemptOverride
      : spelling.diagnostic.currentInput || ""
  ).trim();
  if (!attempt) {
    spelling.coachMessage = "Type the word before moving to the next item.";
    persistSubjects();
    return;
  }
  spelling.diagnostic.responses[wordEntry.id] = {
    attempt,
    correct: normalizeSpellingAttempt(attempt) === normalizeSpellingAttempt(wordEntry.word)
  };
  spelling.diagnostic.currentInput = "";
  spelling.diagnostic.currentIndex += 1;

  if (spelling.diagnostic.currentIndex >= SPELLING_DIAGNOSTIC_WORDS.length) {
    finaliseSpellingDiagnostic(subject);
  } else {
    const nextWord = getSpellingDiagnosticCurrentWord(spelling);
    spelling.coachMessage = nextWord
      ? `Saved. Word ${spelling.diagnostic.currentIndex + 1} of ${SPELLING_DIAGNOSTIC_WORDS.length} is ready.`
      : spelling.coachMessage;
  }

  persistSubjects();
}

function checkSpellingLooksRight(subject) {
  const spelling = getSubjectSpellingState(subject);
  const followUpWords = getSpellingFollowUpWords(spelling);
  spelling.looksRight.checked = true;
  spelling.looksRight.completed = isSpellingLooksRightComplete(spelling);
  const incorrectWords = followUpWords.filter((entry) => spelling.looksRight.answers[entry.id] !== entry.word);
  const unansweredWords = followUpWords.filter((entry) => !spelling.looksRight.answers[entry.id]);
  if (spelling.looksRight.completed) {
    celebrateSpellingStage(
      subject,
      "looks-right",
      incorrectWords.length
        ? `Visual check complete. Stage 3 will start with ${incorrectWords[0].word} because it still needs stabilising.`
        : "Visual check complete. You are ready to stabilise the same words across their families."
    );
    return;
  }
  spelling.coachMessage = incorrectWords.length
    ? `Recheck ${incorrectWords[0].word}. Ask whether the spelling looks settled before you submit again.`
    : unansweredWords.length
      ? "Choose an answer for each sentence before checking this stage."
      : "Visual check complete. Continue to the next stage.";
  persistSubjects();
}

function selectSpellingLooksRightAnswer(subject, wordId, value) {
  const spelling = getSubjectSpellingState(subject);
  const followUpWords = getSpellingFollowUpWords(spelling);
  spelling.looksRight.answers[wordId] = value;
  spelling.looksRight.checked = false;
  spelling.looksRight.completed = false;

  if (followUpWords.every((entry) => Boolean(spelling.looksRight.answers[entry.id]))) {
    checkSpellingLooksRight(subject);
    return;
  }

  const answeredCount = followUpWords.filter((entry) => Boolean(spelling.looksRight.answers[entry.id])).length;
  spelling.coachMessage = `Answer saved. Sentence ${Math.min(answeredCount + 1, followUpWords.length)} of ${followUpWords.length} is ready.`;
  persistSubjects();
}

function buildSpellingFamilySentenceMarkup(sentence, highlightWord) {
  const wordPattern = new RegExp(`\\b${escapeRegex(highlightWord)}\\b`, "i");
  const match = sentence.match(wordPattern);
  if (!match || match.index === undefined) {
    return escapeHtml(sentence);
  }
  const before = sentence.slice(0, match.index);
  const after = sentence.slice(match.index + match[0].length);
  return `${escapeHtml(before)}<span class="spelling-inline-target">${escapeHtml(match[0])}</span>${escapeHtml(after)}`;
}

function playSpellingFlashcardSentence(subject, entry, card) {
  const sentenceIndex = Math.min(card.exposureIndex, (entry.familySentences || []).length - 1);
  const familyWord = entry.familyWords[sentenceIndex];
  const sentence = entry.familySentences[sentenceIndex];
  if (!sentence || !familyWord) {
    return;
  }

  card.isShowingSentence = true;
  persistSubjects();
  render();

  void speakTextWithOpenAi(sentence, {
    context: `spelling:flashcard:${entry.id}:${sentenceIndex}`,
    statusMessages: {
      preparing: "Preparing spelling sentence...",
      playing: "Reading family sentence...",
      error: "Spelling sentence audio failed."
    },
    onFinished: () => {
      const freshSpelling = getSubjectSpellingState(subject);
      const freshCard = ensureSpellingFlashcardCard(freshSpelling, entry.id);
      freshCard.isShowingSentence = false;
      freshCard.exposureIndex = Math.min(3, freshCard.exposureIndex + 1);
      freshSpelling.coachMessage = freshCard.exposureIndex >= 3
        ? `Now type ${entry.word} from memory.`
        : `Sentence ${freshCard.exposureIndex + 1} of 3 is ready for ${entry.word}.`;
      persistSubjects();
      render();
    }
  })
    .then(() => {
      render();
    })
    .catch((error) => {
      console.error("Spelling flashcard sentence failed.", error);
      const freshSpelling = getSubjectSpellingState(subject);
      const freshCard = ensureSpellingFlashcardCard(freshSpelling, entry.id);
      freshCard.isShowingSentence = false;
      persistSubjects();
      render();
    });
}

function revealSpellingFlashcardSentence(subject, wordId) {
  const spelling = getSubjectSpellingState(subject);
  const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
  if (!entry) {
    return;
  }
  const card = ensureSpellingFlashcardCard(spelling, wordId);
  if (card.completed || card.isShowingSentence || card.exposureIndex >= 3) {
    return;
  }
  spelling.flashcards.currentWordId = wordId;
  playSpellingFlashcardSentence(subject, entry, card);
}

function submitSpellingFlashcardRecall(subject, wordId, typedValueOverride = null) {
  const spelling = getSubjectSpellingState(subject);
  const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
  if (!entry) {
    return;
  }
  const card = ensureSpellingFlashcardCard(spelling, wordId);
  const typedValue = String(
    typedValueOverride !== null && typedValueOverride !== undefined ? typedValueOverride : card.typedValue || ""
  ).trim();
  card.checked = true;
  card.typedValue = typedValue;
  card.completed = normalizeSpellingAttempt(typedValue) === normalizeSpellingAttempt(entry.word);
  if (!card.completed) {
    spelling.coachMessage = `Retry ${entry.word}. Use the family sentences to rebuild the spelling pattern.`;
    persistSubjects();
    return;
  }

  const flashcardWords = getSpellingFlashcardWords(spelling);
  const nextWord = flashcardWords.find((item) => !ensureSpellingFlashcardCard(spelling, item.id).completed);
  spelling.flashcards.currentWordId = nextWord?.id || "";
  spelling.flashcards.completed = isSpellingFlashcardsComplete(spelling);
  if (spelling.flashcards.completed) {
    celebrateSpellingStage(subject, "word-families", "Stage 3 complete. The word-family sentence loop is secure.");
    return;
  }
  spelling.coachMessage = `${entry.word} is secure. The next keyword is ready.`;
  persistSubjects();
}

function playSpellingFamilySentence(subject, entry, answer) {
  const sentenceIndex = Math.min(answer.exposureIndex, (entry.familySentences || []).length - 1);
  const familyWord = entry.familyWords[sentenceIndex];
  const sentence = entry.familySentences[sentenceIndex];
  if (!sentence || !familyWord) {
    return;
  }

  answer.isShowingSentence = true;
  persistSubjects();
  render();

  void speakTextWithOpenAi(sentence, {
    context: `spelling:family:${entry.id}:${sentenceIndex}`,
    statusMessages: {
      preparing: "Preparing spelling sentence...",
      playing: "Reading family sentence...",
      error: "Spelling sentence audio failed."
    },
    onFinished: () => {
      const freshSpelling = getSubjectSpellingState(subject);
      const freshAnswer = ensureSpellingTenseAnswer(freshSpelling, entry.id);
      freshAnswer.isShowingSentence = false;
      freshAnswer.exposureIndex = Math.min(3, freshAnswer.exposureIndex + 1);
      freshSpelling.coachMessage = freshAnswer.exposureIndex >= 3
        ? `Now type ${entry.word} from memory.`
        : `Sentence ${freshAnswer.exposureIndex + 1} of 3 is ready for ${entry.word}.`;
      persistSubjects();
      render();
    }
  })
    .then(() => {
      render();
    })
    .catch((error) => {
      console.error("Spelling family sentence failed.", error);
      const freshSpelling = getSubjectSpellingState(subject);
      const freshAnswer = ensureSpellingTenseAnswer(freshSpelling, entry.id);
      freshAnswer.isShowingSentence = false;
      persistSubjects();
      render();
    });
}

function revealSpellingFamilySentence(subject, wordId) {
  const spelling = getSubjectSpellingState(subject);
  const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
  if (!entry) {
    return;
  }
  const answer = ensureSpellingTenseAnswer(spelling, wordId);
  if (answer.completed || answer.isShowingSentence || answer.exposureIndex >= 3) {
    return;
  }
  spelling.tenseTransfer.currentWordId = wordId;
  playSpellingFamilySentence(subject, entry, answer);
}

function submitSpellingFamilyRecall(subject, wordId, typedValueOverride = null) {
  const spelling = getSubjectSpellingState(subject);
  const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
  if (!entry) {
    return;
  }
  const answer = ensureSpellingTenseAnswer(spelling, wordId);
  const typedValue = String(
    typedValueOverride !== null && typedValueOverride !== undefined ? typedValueOverride : answer.typedValue || ""
  ).trim();
  answer.checked = true;
  answer.typedValue = typedValue;
  answer.completed = normalizeSpellingAttempt(typedValue) === normalizeSpellingAttempt(entry.word);
  if (!answer.completed) {
    spelling.coachMessage = `Retry ${entry.word}. Use the family sentences to rebuild the spelling pattern.`;
    persistSubjects();
    return;
  }

  const followUpWords = getSpellingFollowUpWords(spelling);
  const nextWord = followUpWords.find((item) => !ensureSpellingTenseAnswer(spelling, item.id).completed);
  spelling.tenseTransfer.currentWordId = nextWord?.id || "";
  spelling.tenseTransfer.completed = isSpellingTenseTransferComplete(spelling);
  if (spelling.tenseTransfer.completed) {
    celebrateSpellingStage(subject, "tense-transfer", "Final stage complete. The family sentences held and the key words were recalled from memory.");
    return;
  }
  spelling.coachMessage = `${entry.word} is secure. The next keyword is ready.`;
  persistSubjects();
}

function normalizeManualWatchItemsAcrossSubjects() {
  const latestManualByUrl = new Map();

  state.subjects.forEach((subject) => {
    const subjectId = subject.id;
    subject.watch = (Array.isArray(subject.watch) ? subject.watch : [])
      .filter((item) => item?.url)
      .filter((item) => (item.source || "manual") === "manual")
      .map((item) => ({ ...item, source: "manual", subjectId: item.subjectId || subjectId }));

    subject.watch.forEach((item) => {
      const existing = latestManualByUrl.get(item.url);
      const itemTime = new Date(item.addedAt || 0).getTime();
      const existingTime = existing ? new Date(existing.addedAt || 0).getTime() : -1;
      if (!existing || itemTime >= existingTime) {
        latestManualByUrl.set(item.url, { ...item, subjectId });
      }
    });
  });

  state.subjects.forEach((subject) => {
    subject.watch = (Array.isArray(subject.watch) ? subject.watch : []).filter((item) => {
      const winner = latestManualByUrl.get(item.url);
      return Boolean(winner && winner.id === item.id && winner.subjectId === subject.id);
    });
  });
}

function buildResolvedSubjectsFromStore(account, storedSubjects) {
  if (Array.isArray(storedSubjects)) {
    const storedSubjectsById = new Map();
    const extraSubjects = [];

    storedSubjects.forEach((subject, index) => {
      const hydratedSubject = hydrateStoredSubject(subject, index);
      if (!hydratedSubject.id) {
        return;
      }

      const isSeededSubject = subjectTemplateSeed.some((seededSubject) => seededSubject.id === hydratedSubject.id);
      if (isSeededSubject) {
        storedSubjectsById.set(hydratedSubject.id, hydratedSubject);
        return;
      }

      extraSubjects.push(hydratedSubject);
    });

    const resolvedSubjects = subjectTemplateSeed.map((seededSubject, index) =>
      storedSubjectsById.get(seededSubject.id) || hydrateStoredSubject({ id: seededSubject.id }, index)
    );

    return mergeLegacyGroupedDocuments(
      removeLegacySeededDocuments(
        removeLegacySeededAssessments([...resolvedSubjects, ...extraSubjects])
      )
    );
  }

  return createInitialSubjectsForAccount(account);
}

function getStoredSubjectsForAccount(account) {
  const accountKey = normaliseAccountKey(account?.email);
  if (!accountKey) {
    return createBaseSubjects();
  }

  const storedSubjectsMap = loadStoredSubjectsMap();
  return buildResolvedSubjectsFromStore(account, storedSubjectsMap[accountKey]);
}

function createCloudSyncFallbackSubjects(subjects) {
  return createQuotaFallbackSubjects(subjects);
}

function buildCloudAccountSettingsPayload() {
  return {
    termStarts: { ...state.termStarts },
    termEnds: { ...state.termEnds },
    homeBackgroundColor: normalizePageBackgroundColor(state.settings.homeBackgroundColor),
    subjectsBackgroundColor: normalizePageBackgroundColor(state.settings.subjectsBackgroundColor),
    headingColor: state.settings.headingColor || "#111111",
    subjectIcons: { ...(state.settings.subjectIcons || {}) }
  };
}

function applyCloudAccountSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return;
  }

  state.termStarts = {
    ...state.termStarts,
    ...(settings.termStarts && typeof settings.termStarts === "object" ? settings.termStarts : {})
  };
  state.termEnds = {
    ...state.termEnds,
    ...(settings.termEnds && typeof settings.termEnds === "object" ? settings.termEnds : {})
  };
  state.settings = {
    ...state.settings,
    homeBackgroundColor: normalizePageBackgroundColor(settings.homeBackgroundColor ?? state.settings.homeBackgroundColor),
    subjectsBackgroundColor: normalizePageBackgroundColor(
      settings.subjectsBackgroundColor ?? state.settings.subjectsBackgroundColor
    ),
    headingColor: String(settings.headingColor || state.settings.headingColor || "#111111"),
    subjectIcons: {
      ...defaultSubjectIconMap,
      ...state.settings.subjectIcons,
      ...(settings.subjectIcons && typeof settings.subjectIcons === "object" ? settings.subjectIcons : {})
    }
  };
}

async function registerCloudAccountWithFallback({ name, email, password, grade, subjects, settings }) {
  const subjectCandidates = [
    createPersistableSubjects(subjects),
    createCloudSyncFallbackSubjects(subjects),
    createInitialSubjectsForAccount({ name, email, grade })
  ];

  let lastError = null;
  for (const candidateSubjects of subjectCandidates) {
    try {
      return await requestApi("/api/auth/register", {
        name,
        email,
        password,
        grade,
        subjects: candidateSubjects,
        settings
      });
    } catch (error) {
      lastError = error;
      const shouldRetryWithSmallerPayload =
        error instanceof Error &&
        (error.status === 413 ||
          /too large|payload|entity too large|request entity/i.test(error.message || ""));
      if (!shouldRetryWithSmallerPayload) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Account creation failed.");
}

function queueRemoteSettingsPersist(settingsSnapshot) {
  if (!state.authToken) {
    return;
  }

  remoteSettingsSaveQueuedSnapshot = settingsSnapshot;
  if (remoteSettingsSaveInFlight) {
    return;
  }

  remoteSettingsSaveInFlight = true;
  void (async () => {
    while (remoteSettingsSaveQueuedSnapshot) {
      const snapshot = remoteSettingsSaveQueuedSnapshot;
      remoteSettingsSaveQueuedSnapshot = null;
      try {
        await requestApi(
          "/api/account/settings",
          { settings: snapshot },
          false,
          {
            headers: {
              ...buildAuthHeaders()
            },
            method: "PUT"
          }
        );
      } catch (error) {
        console.error("Remote settings sync failed.", error);
      }
    }

    remoteSettingsSaveInFlight = false;
  })();
}

function queueRemoteSubjectsPersist(subjectsSnapshot) {
  if (!state.authToken) {
    return;
  }

  remoteSubjectsSaveQueuedSnapshot = subjectsSnapshot;
  if (remoteSubjectsSaveInFlight) {
    return;
  }

  remoteSubjectsSaveInFlight = true;
  void (async () => {
    while (remoteSubjectsSaveQueuedSnapshot) {
      const snapshot = remoteSubjectsSaveQueuedSnapshot;
      remoteSubjectsSaveQueuedSnapshot = null;
      try {
        try {
          await requestApi(
            "/api/account/subjects",
            { subjects: snapshot },
            false,
            {
              headers: {
                ...buildAuthHeaders()
              },
              method: "PUT"
            }
          );
        } catch (primaryError) {
          const shouldRetryWithFallback =
            primaryError instanceof Error &&
            (primaryError.status === 413 ||
              /too large|payload|entity too large|request entity/i.test(primaryError.message || ""));
          if (!shouldRetryWithFallback) {
            throw primaryError;
          }

          await requestApi(
            "/api/account/subjects",
            { subjects: createCloudSyncFallbackSubjects(state.subjects) },
            false,
            {
              headers: {
                ...buildAuthHeaders()
              },
              method: "PUT"
            }
          );
          if (elements?.uploadStatus) {
            elements.uploadStatus.textContent =
              "Your account was synced with a lighter cloud copy so it can still open across devices.";
          }
        }
      } catch (error) {
        console.error("Remote subject sync failed.", error);
        if (elements?.uploadStatus) {
          elements.uploadStatus.textContent =
            "Your changes were saved on this device, but PaperPanda could not sync them to the shared account just now.";
        }
      }
    }

    remoteSubjectsSaveInFlight = false;
  })();
}

function persistSubjects({ skipRemoteSync = false } = {}) {
  if (!state.currentUserEmail) {
    return;
  }

  const accountKey = normaliseAccountKey(state.currentUserEmail);
  const storedSubjectsMap = loadStoredSubjectsMap();
  const persistableSubjects = createPersistableSubjects(state.subjects);

  try {
    storedSubjectsMap[accountKey] = persistableSubjects;
    saveStoredSubjectsMap(storedSubjectsMap);
  } catch (primaryError) {
    try {
      storedSubjectsMap[accountKey] = createQuotaFallbackSubjects(state.subjects);
      saveStoredSubjectsMap(storedSubjectsMap);
      if (elements?.uploadStatus) {
        elements.uploadStatus.textContent =
          "Large document previews will stay available in this session, but only a lighter saved version will persist after refresh.";
      }
    } catch (fallbackError) {
      console.error("Subject store quota fallback failed.", fallbackError);
      if (elements?.uploadStatus) {
        elements.uploadStatus.textContent =
          "Browser storage is full. Your latest changes will stay available until refresh, but they could not be saved persistently.";
      }
    }
  }

  if (!skipRemoteSync) {
    queueRemoteSubjectsPersist(persistableSubjects);
  }

  syncPreviewPersistence();
}

function persistSettings({ skipRemoteSync = false } = {}) {
  state.settings.homeBackgroundColor = normalizePageBackgroundColor(state.settings.homeBackgroundColor);
  state.settings.subjectsBackgroundColor = normalizePageBackgroundColor(state.settings.subjectsBackgroundColor);
  const settingsPayload = buildCloudAccountSettingsPayload();
  window.localStorage.setItem(
    settingsStorageKey,
    JSON.stringify({
      termStarts: settingsPayload.termStarts,
      termEnds: settingsPayload.termEnds,
      homeBackgroundAssetId: state.settings.homeBackgroundAssetId,
      subjectsBackgroundAssetId: state.settings.subjectsBackgroundAssetId,
      homeBackgroundColor: settingsPayload.homeBackgroundColor,
      subjectsBackgroundColor: settingsPayload.subjectsBackgroundColor,
      headingColor: settingsPayload.headingColor,
      subjectIcons: settingsPayload.subjectIcons
    })
  );

  if (!skipRemoteSync) {
    queueRemoteSettingsPersist(settingsPayload);
  }
}

function normaliseAssessment(assessment) {
  return {
    ...assessment,
    linkedDocumentIds: Array.isArray(assessment.linkedDocumentIds) ? assessment.linkedDocumentIds : [],
    completed: Boolean(assessment.completed),
    workNotes: assessment.workNotes || "",
    externalWorkspace: normaliseExternalWorkspace(assessment.externalWorkspace)
  };
}

function normaliseSavedRevisionTest(testRecord) {
  return {
    id: testRecord?.id || createId(),
    savedAt: testRecord?.savedAt || new Date().toISOString(),
    title: testRecord?.title || "Saved revision test",
    subjectId: testRecord?.subjectId || "",
    test: testRecord?.test || null,
    responses: testRecord?.responses && typeof testRecord.responses === "object" ? testRecord.responses : {},
    submission: testRecord?.submission || null
  };
}

function normaliseDocument(documentRecord) {
  return {
    ...documentRecord,
    workNotes: documentRecord.workNotes || "",
    externalWorkspace: normaliseExternalWorkspace(documentRecord.externalWorkspace),
    reviewed: Boolean(documentRecord.reviewed),
    reviewMode: documentRecord.reviewMode || "",
    pages: Array.isArray(documentRecord.pages)
      ? documentRecord.pages.map((page) => ({
          pageNumber: Number(page?.pageNumber || 0),
          text: String(page?.text || "").trim(),
          imageUrl: page?.imageUrl || null
        }))
      : [],
    studyOverview: String(documentRecord.studyOverview || "").trim(),
    studyPlanStatus: String(documentRecord.studyPlanStatus || "idle"),
    studySections: Array.isArray(documentRecord.studySections)
      ? documentRecord.studySections.map(normaliseStudySection).filter((section) => section.sectionText)
      : [],
    completedSectionIds: Array.isArray(documentRecord.completedSectionIds)
      ? documentRecord.completedSectionIds.map((sectionId) => String(sectionId || "")).filter(Boolean)
      : [],
    currentSectionIndex: Math.max(0, Number(documentRecord.currentSectionIndex || 0) || 0),
    importantTerms: Array.isArray(documentRecord.importantTerms)
      ? documentRecord.importantTerms.map((term) => String(term || "").trim()).filter(Boolean)
      : [],
    endQuiz: normaliseStudyQuiz(documentRecord.endQuiz),
    quizSubmission: documentRecord.quizSubmission && typeof documentRecord.quizSubmission === "object"
      ? {
          answers: documentRecord.quizSubmission.answers && typeof documentRecord.quizSubmission.answers === "object"
            ? documentRecord.quizSubmission.answers
            : {},
          score: Number(documentRecord.quizSubmission.score || 0) || 0,
          total: Number(documentRecord.quizSubmission.total || 0) || 0,
          passed: Boolean(documentRecord.quizSubmission.passed),
          completedAt: documentRecord.quizSubmission.completedAt || ""
        }
      : null,
    pointsAwarded: Boolean(documentRecord.pointsAwarded),
    flags: {
      classNotes: Boolean(documentRecord.flags?.classNotes || documentRecord.flags?.termOverview),
      assessment: Boolean(documentRecord.flags?.assessment || String(documentRecord.type || "").toLowerCase() === "assessment"),
      homework: Boolean(documentRecord.flags?.homework || String(documentRecord.type || "").toLowerCase() === "homework")
    }
  };
}

function restoreSubjects() {
  state.subjects = createBaseSubjects();
}

function restoreSubjectsForAccount(account, subjectsOverride = null, { skipRemoteSync = false } = {}) {
  const accountKey = normaliseAccountKey(account?.email);
  if (!accountKey) {
    state.subjects = createBaseSubjects();
    return;
  }

  const storedSubjectsMap = loadStoredSubjectsMap();
  const resolvedSubjects = buildResolvedSubjectsFromStore(account, subjectsOverride ?? storedSubjectsMap[accountKey]);
  state.subjects = resolvedSubjects;
  storedSubjectsMap[accountKey] = createPersistableSubjects(state.subjects);
  saveStoredSubjectsMap(storedSubjectsMap);

  if (!state.subjects.some((subject) => subject.id === state.selectedSubjectId)) {
    state.selectedSubjectId = state.subjects[0]?.id || "";
  }
  normalizeManualWatchItemsAcrossSubjects();
  const selectedSubject = state.subjects.find((subject) => subject.id === state.selectedSubjectId);
  const firstDocumentId = getVisibleSubjectDocuments(selectedSubject || { documents: [] })[0]?.id || null;
  state.selectedDocumentId = firstDocumentId;
  state.askDocumentId = firstDocumentId;
  state.selectedDocumentIds = [];
  state.expandedDocumentGroups = {};
  state.watchExpanded = false;
  state.documentsExpanded = false;

  syncAutoWatchForAllSubjects();
  persistSubjects({ skipRemoteSync });
  hydratePreviewImages();
}

function applyAuthenticatedAccount(account, { token = "", subjects = null, settings = null, skipRemoteSync = false } = {}) {
  state.studentName = String(account?.name || "").trim();
  state.currentUserEmail = normaliseAccountKey(account?.email);
  state.studentGrade = normaliseGrade(account?.grade);
  state.currentUserId = String(account?.id || "");
  state.currentUserPoints = Math.max(0, Number(account?.points || 0) || 0);
  state.authToken = token || state.authToken;
  applyCloudAccountSettings(settings);
  persistSession(state.currentUserEmail, state.authToken);
  restoreSubjectsForAccount(account, subjects, { skipRemoteSync });
  persistSettings({ skipRemoteSync });
}

async function restoreSessionUser() {
  const savedToken = getStoredSessionToken();
  if (savedToken) {
    try {
      const session = await requestApiGet("/api/auth/session", {
        headers: {
          Authorization: `Bearer ${savedToken}`
        }
      });
      state.authToken = savedToken;
      applyAuthenticatedAccount(session.account, {
        token: savedToken,
        subjects: session.subjects,
        settings: session.settings,
        skipRemoteSync: true
      });
      openDashboard("home");
      return;
    } catch (error) {
      console.error("Session restore failed.", error);
      clearSession();
      state.authToken = "";
    }
  }

  const savedEmail = window.localStorage.getItem(sessionStorageKey);
  if (!savedEmail) {
    return;
  }

  const account = findLegacyAccountByEmail(savedEmail);
  if (!account) {
    clearSession();
    return;
  }

  try {
    let payload;
    try {
      payload = await registerCloudAccountWithFallback({
        name: account.name,
        email: account.email,
        password: account.password,
        grade: normaliseGrade(account.grade),
        subjects: getStoredSubjectsForAccount(account),
        settings: buildCloudAccountSettingsPayload()
      });
    } catch (registerError) {
      if (!(registerError instanceof Error) || registerError.status !== 409) {
        throw registerError;
      }
      payload = await requestApi("/api/auth/signin", {
        email: account.email,
        password: account.password
      });
    }

    state.authToken = payload.token || "";
    applyAuthenticatedAccount(payload.account, {
      token: payload.token || "",
      subjects: getStoredSubjectsForAccount(account),
      settings: payload.settings,
      skipRemoteSync: false
    });
    openDashboard("home");
    return;
  } catch (error) {
    console.error("Legacy account migration failed.", error);
  }

  state.studentName = account.name;
  state.currentUserEmail = account.email;
  state.studentGrade = normaliseGrade(account.grade);
  state.currentUserPoints = Math.max(0, Number(account.points || 0) || 0);
  state.authToken = "";
  restoreSubjectsForAccount(account, getStoredSubjectsForAccount(account), { skipRemoteSync: true });
  openDashboard("home");
}

function restoreSettings() {
  const raw = window.localStorage.getItem(settingsStorageKey);
  if (!raw) {
    window.localStorage.setItem(uiVersionStorageKey, currentUiVersion);
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.termStarts = {
      ...state.termStarts,
      ...(parsed.termStarts || {})
    };
    state.termEnds = {
      ...state.termEnds,
      ...(parsed.termEnds || {})
    };
    state.settings = {
      ...state.settings,
      homeBackground: String(parsed.homeBackground || ""),
      subjectsBackground: String(parsed.subjectsBackground || ""),
      homeBackgroundAssetId: String(parsed.homeBackgroundAssetId || (parsed.homeBackground ? "home-background" : "")),
      subjectsBackgroundAssetId: String(parsed.subjectsBackgroundAssetId || (parsed.subjectsBackground ? "subjects-background" : "")),
      homeBackgroundColor: normalizePageBackgroundColor(parsed.homeBackgroundColor),
      subjectsBackgroundColor: normalizePageBackgroundColor(parsed.subjectsBackgroundColor),
      headingColor: parsed.headingColor || "#111111",
      subjectIcons: {
        ...defaultSubjectIconMap,
        ...(parsed.subjectIcons && typeof parsed.subjectIcons === "object" ? parsed.subjectIcons : {})
      }
    };
    state.settings.homeBackgroundColor = normalizePageBackgroundColor(state.settings.homeBackgroundColor);
    state.settings.subjectsBackgroundColor = normalizePageBackgroundColor(state.settings.subjectsBackgroundColor);
  } catch (error) {
    console.error("Failed to restore settings.", error);
  }

  if (window.localStorage.getItem(uiVersionStorageKey) !== currentUiVersion) {
    window.localStorage.setItem(uiVersionStorageKey, currentUiVersion);
  }
}

async function migrateLegacyBackgroundAssets() {
  const tasks = [];
  if (state.settings.homeBackground && state.settings.homeBackground.startsWith("data:") && state.settings.homeBackgroundAssetId) {
    tasks.push(putSettingsAssetRecord(state.settings.homeBackgroundAssetId, state.settings.homeBackground));
  }
  if (
    state.settings.subjectsBackground &&
    state.settings.subjectsBackground.startsWith("data:") &&
    state.settings.subjectsBackgroundAssetId
  ) {
    tasks.push(putSettingsAssetRecord(state.settings.subjectsBackgroundAssetId, state.settings.subjectsBackground));
  }

  if (!tasks.length) {
    return;
  }

  try {
    await Promise.all(tasks);
    persistSettings();
  } catch (error) {
    console.error("Legacy background assets could not be migrated.", error);
  }
}

async function hydrateBackgroundAssets() {
  let didHydrate = false;
  if (!state.settings.homeBackground && state.settings.homeBackgroundAssetId) {
    try {
      const asset = await getSettingsAssetRecord(state.settings.homeBackgroundAssetId);
      if (asset?.dataUrl) {
        state.settings.homeBackground = asset.dataUrl;
        didHydrate = true;
      }
    } catch (error) {
      console.error("Home background asset could not be restored.", error);
    }
  }

  if (!state.settings.subjectsBackground && state.settings.subjectsBackgroundAssetId) {
    try {
      const asset = await getSettingsAssetRecord(state.settings.subjectsBackgroundAssetId);
      if (asset?.dataUrl) {
        state.settings.subjectsBackground = asset.dataUrl;
        didHydrate = true;
      }
    } catch (error) {
      console.error("Subjects background asset could not be restored.", error);
    }
  }

  if (didHydrate) {
    applyBackgrounds();
    renderCurrentView();
  }
}

function applyBackgrounds() {
  state.settings.homeBackgroundColor = normalizePageBackgroundColor(state.settings.homeBackgroundColor);
  state.settings.subjectsBackgroundColor = normalizePageBackgroundColor(state.settings.subjectsBackgroundColor);
  const homeSurfaceColor = state.settings.homeBackgroundColor || getWarmSurfaceColor();
  const subjectsSurfaceColor = state.settings.subjectsBackgroundColor || getWarmSurfaceColor();
  elements.homeView.style.backgroundImage = state.settings.homeBackground
    ? `url("${state.settings.homeBackground}")`
    : "";
  elements.subjectsView.style.backgroundImage = state.settings.subjectsBackground
    ? `url("${state.settings.subjectsBackground}")`
    : "";
  elements.homeView.style.backgroundColor = homeSurfaceColor;
  elements.subjectsView.style.backgroundColor = subjectsSurfaceColor;
  elements.homeView.style.backgroundRepeat = state.settings.homeBackground ? "repeat" : "no-repeat";
  elements.subjectsView.style.backgroundRepeat = state.settings.subjectsBackground ? "repeat" : "no-repeat";
  elements.homeView.style.backgroundSize = state.settings.homeBackground ? "auto" : "";
  elements.subjectsView.style.backgroundSize = state.settings.subjectsBackground ? "auto" : "";
  elements.homeView.style.backgroundPosition = "top left";
  elements.subjectsView.style.backgroundPosition = "top left";
  document.body.style.backgroundColor = homeSurfaceColor;
  document.documentElement.style.backgroundColor = homeSurfaceColor;
  document.querySelector(".page-shell")?.style.setProperty("background-color", homeSurfaceColor);
  elements.appShell?.style.setProperty("background-color", state.currentView === "subjects" ? subjectsSurfaceColor : homeSurfaceColor);
  elements.revisionView?.style.setProperty("background-color", subjectsSurfaceColor);
  elements.taskView?.style.setProperty("background-color", "rgba(26, 23, 38, 0.42)");
  document.documentElement.style.setProperty("--custom-heading-color", state.settings.headingColor || "#111111");
  document.documentElement.style.setProperty("--app-home-surface", homeSurfaceColor);
  document.documentElement.style.setProperty("--app-subjects-surface", subjectsSurfaceColor);
  if (elements.headingColourInput) {
    elements.headingColourInput.value = state.settings.headingColor || "#111111";
  }
  if (elements.backgroundColourInput) {
    const targetColor = elements.backgroundHomeCheckbox.checked
      ? state.settings.homeBackgroundColor
      : state.settings.subjectsBackgroundColor;
    elements.backgroundColourInput.value = targetColor;
  }
}

function renderAiConnectionState() {
  if (elements.aiConnectionStatus) {
    elements.aiConnectionStatus.textContent = "";
    elements.aiConnectionStatus.classList.add("hidden");
  }
}

function setFocusMode(on) {
  state.focusMode = Boolean(on);
  state.focusArea = null;
  state.focusAskOpen = false;
  window.localStorage.setItem(FOCUS_MODE_STORAGE_KEY, state.focusMode ? "on" : "off");
  render();
}

function openDashboard(nextView = "home") {
  setAuthPending(false);
  elements.landingPanel.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  elements.welcomeHeading.textContent = "";
  hydrateSettingsView();
  resetRevisionState();
  state.currentView = nextView;
  render();
  void loadRevisionCatalogue();
}

function resetRevisionState() {
  state.generatedRevisionTest = null;
  state.revisionResponses = {};
  state.revisionSubmission = null;
  state.revisionViewMode = "draft";
  state.activeSavedRevisionTestId = "";
  state.revisionReturnContext = null;
  state.generatingDocumentRevisionId = "";
  if (elements.revisionTestStatus) {
    elements.revisionTestStatus.textContent = "";
  }
  if (elements.revisionFeedback) {
    elements.revisionFeedback.classList.add("hidden");
    elements.revisionFeedback.innerHTML = "";
  }
}

function showLanding() {
  setAuthPending(false);
  stopListening();
  stopAskMicrophone({ preserveStatus: true });
  closeUpcomingModal();
  closeUploadModal();
  closeAttachNotesModal();
  closeEditAssessmentModal();

  elements.appShell.classList.add("hidden");
  elements.taskView.classList.add("hidden");
  elements.revisionView.classList.add("hidden");
  elements.landingPanel.classList.remove("hidden");
  resetRevisionState();
  state.selectedDocumentId = null;
  state.currentView = "home";
  elements.studentPasswordInput.value = "";
  elements.studentPasswordConfirmInput.value = "";
  elements.signInStatus.textContent = "";
  syncSignInMode();
  elements.askResponse.textContent =
    "Ask a question about the selected subject or document.";
  elements.readerTitle.textContent = "Document reader";
  elements.readerContent.textContent = "Choose a document from the table to read it here.";
  resetUploadStatus();
}

function clampProgressRatio(value) {
  return Math.max(0, Math.min(1, value || 0));
}

function getTextCompletionRatio(value, targetLength = 400) {
  const textLength = String(value || "").trim().length;
  return clampProgressRatio(textLength / targetLength);
}

function setProgressBar(element, ratio) {
  if (!element) {
    return;
  }
  element.style.width = `${Math.round(clampProgressRatio(ratio) * 100)}%`;
}

function getAllHomeworkBundles() {
  return state.subjects.flatMap((subject) =>
    getHomeworkBundles(subject).map((bundle) => ({ subject, bundle }))
  );
}

function getAllDocumentBundles(subject) {
  return getDocumentGroupsFromDocuments(getReaderDocuments(subject));
}

function getUnreadDocumentMetrics() {
  const allDocumentBundles = state.subjects.flatMap((subject) => getAllDocumentBundles(subject));
  const unreadDocumentBundles = allDocumentBundles.filter((documentBundle) => !documentBundle.reviewed);
  return {
    total: allDocumentBundles.length,
    unread: unreadDocumentBundles.length,
    progress: allDocumentBundles.length
      ? (allDocumentBundles.length - unreadDocumentBundles.length) / allDocumentBundles.length
      : 0
  };
}

function getHomeworkMetrics() {
  const bundles = getAllHomeworkBundles();
  const incompleteBundles = bundles.filter(({ bundle }) => getTextCompletionRatio(bundle.workNotes, 350) < 1);
  const averageProgress = bundles.length
    ? bundles.reduce((total, { bundle }) => total + getTextCompletionRatio(bundle.workNotes, 350), 0) / bundles.length
    : 0;

  return {
    total: bundles.length,
    remaining: incompleteBundles.length,
    progress: averageProgress
  };
}

function getAssessmentProgressMetrics() {
  const activeAssessments = getAssessmentEntries().filter(({ assessment }) => !assessment.completed);
  const averageProgress = activeAssessments.length
    ? activeAssessments.reduce((total, { assessment }) => total + getTextCompletionRatio(assessment.workNotes, 600), 0) /
      activeAssessments.length
    : 0;

  return {
    active: activeAssessments.length,
    upcoming: getUpcomingAssessmentEntries().length,
    progress: averageProgress
  };
}

function getHomeContinueReadingBundle() {
  const subject = getSelectedSubject();
  if (!subject) {
    return null;
  }
  const bundles = getAllDocumentBundles(subject);
  return bundles.find((bundle) => !bundle.reviewed) || bundles[0] || null;
}

function getHomeDocumentProgress(bundle) {
  if (!bundle) {
    return 0;
  }
  const primaryDocument = getBundlePrimaryDocument(bundle);
  if (primaryDocument && isWholeStudyDocument(primaryDocument)) {
    return getDocumentProgressRatio(primaryDocument);
  }
  const totalPages = bundle.documents.length || 1;
  const reviewedPages = bundle.documents.filter((documentRecord) => documentRecord.reviewed).length;
  return reviewedPages / totalPages;
}

function isBundleListening(bundle) {
  if (!bundle) {
    return false;
  }
  return bundle.documents.some((documentRecord) => currentAudioContext === `document:${documentRecord.id}`);
}

function getHomeWatchEntries(limit = 2) {
  return state.subjects
    .flatMap((subject) =>
      getSubjectWatchItems(subject).map((item) => ({
        subject,
        item
      }))
    )
    .sort((left, right) => new Date(right.item.addedAt || 0).getTime() - new Date(left.item.addedAt || 0).getTime())
    .slice(0, limit);
}

function getHomeHomeworkEntries(limit = 3) {
  return getAllHomeworkBundles()
    .sort((left, right) => {
      const leftProgress = getTextCompletionRatio(left.bundle.workNotes, 350);
      const rightProgress = getTextCompletionRatio(right.bundle.workNotes, 350);
      if (leftProgress !== rightProgress) {
        return leftProgress - rightProgress;
      }
      return getDocumentSortValue(right.bundle) - getDocumentSortValue(left.bundle);
    })
    .slice(0, limit);
}

function buildHomeHomeworkCardMarkup({ subject, bundle }, index) {
  const progressRatio = getTextCompletionRatio(bundle.workNotes, 350);
  const dueTag = progressRatio >= 1 ? "Done" : index === 0 ? "Current" : "Queued";
  const chips = [
    bundle.documents[0]?.type || "Class notes",
    getBundlePageCount(bundle) > 1 ? `${getBundlePageCount(bundle)} pages` : bundle.documents[0]?.pageNumber ? "1 page" : bundle.documents[0]?.type || "Note",
    getBundleWorkNotes(bundle) ? "Writing started" : "Needs a draft"
  ];

  return `
    <button type="button" class="homework-spotlight-card homework-spotlight-card--${["peach", "yellow", "lilac"][index % 3]}" data-open-homework-card="${bundle.id}">
      <div class="homework-spotlight-card__top">
        <span class="homework-spotlight-card__eyebrow">${escapeHtml(`${getSubjectShortCode(subject.name)} · HW`)}</span>
        <span class="homework-spotlight-card__due">${escapeHtml(dueTag)}</span>
      </div>
      <h4>${escapeHtml(bundle.title)}</h4>
      <div class="homework-spotlight-card__chips">
        ${chips.map((chip) => `<span class="homework-spotlight-card__chip">${escapeHtml(chip)}</span>`).join("")}
      </div>
      <div class="homework-spotlight-card__progress">
        <span>${escapeHtml(progressRatio >= 1 ? "Ready to submit" : "In progress")}</span>
      </div>
    </button>
  `;
}

function buildAssessmentReadAloudText(subject, assessment) {
  return [
    `${assessment.componentTask || assessment.title}.`,
    subject ? `${subject.name}.` : "",
    assessment.weighting ? `Worth ${assessment.weighting}.` : "",
    assessment.dueDate ? `Due ${formatAssessmentDueLabel(assessment.dueDate)}.` : "",
    assessment.description || ""
  ]
    .filter(Boolean)
    .join(" ");
}

function openAssessmentTaskFromEntry(entry) {
  if (!entry?.assessment || !entry?.subject) {
    return;
  }
  state.selectedSubjectId = entry.subject.id;
  state.activeSubjectTab = "assessments";
  state.focusArea = state.focusMode ? "assessments" : null;
  openTaskView({ kind: "assessment", id: entry.assessment.id });
}

function openHomeworkTaskForSubject(subject, bundle) {
  if (!subject || !bundle) {
    return;
  }
  state.selectedSubjectId = subject.id;
  state.activeSubjectTab = "homework";
  state.focusArea = state.focusMode ? "homework" : null;
  openTaskView({ kind: "homework", id: bundle.id });
}

function speakAssessmentEntry(entry, { context = null } = {}) {
  if (!entry?.assessment || !entry?.subject) {
    return;
  }
  const audioContext = context || `task:assessment:${entry.assessment.id}`;
  if (currentAudioContext === audioContext) {
    stopListening();
    render();
    return;
  }
  void speakTextWithOpenAi(buildAssessmentReadAloudText(entry.subject, entry.assessment), {
    context: audioContext,
    statusMessages: {
      preparing: "Preparing assessment audio...",
      playing: "Reading assessment...",
      error: "Assessment audio failed."
    }
  })
    .then(() => {
      render();
    })
    .catch((error) => {
      console.error("Assessment audio failed.", error);
      render();
    });
}

function handleFocusAskLaunch() {
  if (state.currentView === "subjects" && state.focusMode && state.focusAskOpen) {
    closeFocusAskPopup({ stopMic: true });
    return;
  }

  if (state.currentView !== "subjects" || state.focusMode) {
    state.currentView = "subjects";
    state.activeSubjectTab = state.activeSubjectTab || "reader";
    state.focusArea = null;
    state.focusAskOpen = true;
    render();
    requestAnimationFrame(() => {
      focusAskComposer();
      startAskMicrophone();
    });
    return;
  }

  focusAskComposer();
  startAskMicrophone();
}

function renderOverview() {
  const unreadDocumentMetrics = getUnreadDocumentMetrics();
  const homeworkMetrics = getHomeworkMetrics();
  const assessmentMetrics = getAssessmentProgressMetrics();
  const upcomingEntries = getUpcomingAssessmentEntries();
  const nextEntry = getNextAssessmentEntry();

  if (elements.documentsToReadCount) {
    elements.documentsToReadCount.textContent = String(unreadDocumentMetrics.unread);
  }
  if (elements.documentsToReadSummary) {
    elements.documentsToReadSummary.textContent = unreadDocumentMetrics.total
      ? `${unreadDocumentMetrics.total - unreadDocumentMetrics.unread} of ${unreadDocumentMetrics.total} whole documents have been marked read or listened to.`
      : "No documents have been uploaded yet.";
  }
  setProgressBar(elements.documentsToReadProgress, unreadDocumentMetrics.progress);

  if (elements.homeworkToCompleteCount) {
    elements.homeworkToCompleteCount.textContent = String(homeworkMetrics.remaining);
  }
  if (elements.homeworkToCompleteSummary) {
    elements.homeworkToCompleteSummary.textContent = homeworkMetrics.total
      ? `${homeworkMetrics.total - homeworkMetrics.remaining} of ${homeworkMetrics.total} homework items have enough writing started.`
      : "No homework items are waiting right now.";
  }
  setProgressBar(elements.homeworkToCompleteProgress, homeworkMetrics.progress);

  if (elements.assessmentsUpcomingCount) {
    elements.assessmentsUpcomingCount.textContent = String(assessmentMetrics.upcoming);
  }
  if (elements.assessmentsUpcomingSummary) {
    elements.assessmentsUpcomingSummary.textContent = assessmentMetrics.active
      ? `${assessmentMetrics.active} active assessments are being tracked across the account.`
      : "No active assessments are being tracked right now.";
  }
  setProgressBar(elements.assessmentsUpcomingProgress, assessmentMetrics.progress);

  if (elements.upcomingAssessmentCount) {
    elements.upcomingAssessmentCount.textContent = `${upcomingEntries.length} due in the next fortnight`;
  }
  if (elements.upcomingAssessmentSummary) {
    elements.upcomingAssessmentSummary.textContent = upcomingEntries.length
      ? `Select to open a summary of the ${upcomingEntries.length} assessment${upcomingEntries.length === 1 ? "" : "s"} due in the next 14 days.`
      : "Select to check the next 14 days. Nothing is due in that window right now.";
  }
  if (elements.upcomingNextDue) {
    elements.upcomingNextDue.textContent = nextEntry ? "Open task" : "Open calendar";
  }

  const continueBundle = getHomeContinueReadingBundle();
  const continueProgress = getHomeDocumentProgress(continueBundle);
  if (elements.homeCurrentDocTitle) {
    elements.homeCurrentDocTitle.textContent = continueBundle ? continueBundle.title : "Choose a subject to continue reading.";
  }
  if (elements.homeCurrentDocMeta) {
    elements.homeCurrentDocMeta.textContent = continueBundle
      ? `${getSelectedSubject()?.name || "Subject"} · ${continueBundle.type || "Class notes"} · ${getBundlePageCount(continueBundle)} ${getBundlePageCount(continueBundle) === 1 ? "page" : "pages"}`
      : "Upload class notes and they will appear here.";
  }
  setProgressBar(elements.homeCurrentDocProgress, continueProgress);
  if (elements.homeCurrentDocProgressLabel) {
    elements.homeCurrentDocProgressLabel.textContent = continueBundle ? `${Math.round(continueProgress * 100)}% read` : "0% read";
  }
  const durationLabel = continueBundle
    ? `${Math.max(1, Math.ceil(String(continueBundle.content || "").split(/\s+/).filter(Boolean).length / 140))}:00 listen`
    : "Ready to listen";
  const isContinueBundleListening = isBundleListening(continueBundle);
  if (elements.homeListenCurrentButton) {
    elements.homeListenCurrentButton.textContent = isContinueBundleListening ? "Stop listening" : "Listen from here";
  }
  if (elements.homeCurrentDocVisual) {
    elements.homeCurrentDocVisual.innerHTML = continueBundle?.previewImageUrl
      ? `
        <button type="button" class="home-continue-card__art home-continue-card__art--image" id="home-current-doc-visual-toggle">
          <img src="${escapeHtml(continueBundle.previewImageUrl)}" alt="${escapeHtml(continueBundle.title)} preview" />
          <span class="home-continue-card__pause">${isContinueBundleListening ? "❚❚" : "▶"}</span>
          <span class="home-continue-card__time">${escapeHtml(durationLabel)}</span>
        </button>
      `
      : `
        <button type="button" class="home-continue-card__art" id="home-current-doc-visual-toggle">
          <span class="home-continue-card__pause">${isContinueBundleListening ? "❚❚" : "▶"}</span>
          <span class="home-continue-card__time">${escapeHtml(durationLabel)}</span>
        </button>
      `;
  }

  const homeHomeworkEntries = getHomeHomeworkEntries();
  if (elements.homeHomeworkCountPill) {
    elements.homeHomeworkCountPill.textContent = `${homeworkMetrics.remaining} left`;
  }
  if (elements.homeHomeworkList) {
    elements.homeHomeworkList.innerHTML = homeHomeworkEntries.length
      ? homeHomeworkEntries.map((entry, index) => buildHomeHomeworkCardMarkup(entry, index)).join("")
      : `<div class="empty-state">No homework is waiting right now.</div>`;
    elements.homeHomeworkList.querySelectorAll("[data-open-homework-card]").forEach((button) => {
      button.addEventListener("click", () => {
        openTaskView({ kind: "homework", id: button.dataset.openHomeworkCard });
      });
    });
  }

  if (elements.homeNextUpCount) {
    const daysUntil = nextEntry?.dueDateObject ? getDaysUntilDate(nextEntry.dueDateObject) : 0;
    elements.homeNextUpCount.textContent = String(daysUntil);
  }
  if (elements.homeNextUpTitle) {
    elements.homeNextUpTitle.textContent = nextEntry ? nextEntry.assessment.componentTask || nextEntry.assessment.title : "No upcoming assessment yet";
  }
  if (elements.homeNextUpMeta) {
    elements.homeNextUpMeta.textContent = nextEntry
      ? `${nextEntry.subject.name} · ${nextEntry.assessment.weighting || "Assessment"} · ${formatAssessmentDueLabel(nextEntry.assessment.dueDate)}`
      : "Open the calendar to review due dates.";
  }

  if (elements.homeWatchPicksList) {
    const watchEntries = getHomeWatchEntries(2);
    elements.homeWatchPicksList.innerHTML = watchEntries.length
      ? watchEntries
          .map(
            ({ subject, item }) => `
              <button type="button" class="home-watch-row" data-home-watch-open="${escapeHtml(item.url)}">
                <span class="home-watch-row__thumb">${item.source === "auto-document" ? "🧬" : "🎬"}</span>
                <span class="home-watch-row__copy">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(`${subject.name} · ${item.sourceDocumentTitle || "Linked from notes"}`)}</span>
                </span>
              </button>
            `
          )
          .join("")
      : `<div class="empty-state empty-state--compact">No watch links have been added yet.</div>`;
    elements.homeWatchPicksList.querySelectorAll("[data-home-watch-open]").forEach((button) => {
      button.addEventListener("click", () => {
        window.open(button.dataset.homeWatchOpen, "_blank", "noopener");
      });
    });
  }

  if (elements.homeAskPrompt) {
    elements.homeAskPrompt.textContent = continueBundle
      ? `Good morning. Want me to start with ${continueBundle.title} or your homework?`
      : "Good morning. Upload some notes and I can help you read or simplify them.";
  }

  renderUpcomingModal();
}

function renderCurrentView() {
  elements.appBrandTag.textContent = "";
  elements.welcomeHeading.textContent = "";
  elements.appShell.classList.toggle("hidden", state.currentView === "task" || state.currentView === "revision");
  elements.appShell.classList.toggle("focus-mode", state.focusMode);
  elements.homeView.classList.toggle("hidden", state.currentView !== "home");
  elements.settingsView.classList.toggle("hidden", state.currentView !== "settings");
  elements.subjectsView.classList.toggle("hidden", state.currentView !== "subjects");
  elements.taskView.classList.toggle("hidden", state.currentView !== "task");
  elements.revisionView.classList.toggle("hidden", state.currentView !== "revision");
  elements.navHomeButton.classList.toggle("is-active", state.currentView === "home");
  elements.navSubjectsButton.classList.toggle("is-active", state.currentView === "subjects");
  elements.navSettingsButton.classList.toggle("is-active", state.currentView === "settings");
  if (elements.focusModeToggle) {
    elements.focusModeToggle.classList.toggle("is-on", state.focusMode);
    elements.focusModeToggle.setAttribute("aria-pressed", String(state.focusMode));
  }
}

function clipText(value, maxLength = 9000) {
  if (!value) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}\n\n[Document excerpt shortened for this answer.]`;
}

function normaliseSpeechText(value) {
  return String(value || "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSpeechTextIntoChunks(text, maxLength = 1100) {
  const cleanedText = String(text || "").trim();
  if (!cleanedText) {
    return [];
  }

  const chunks = [];
  let cursor = 0;
  while (cursor < cleanedText.length) {
    let sliceEnd = Math.min(cleanedText.length, cursor + maxLength);
    if (sliceEnd < cleanedText.length) {
      const breakpoint = Math.max(
        cleanedText.lastIndexOf(". ", sliceEnd),
        cleanedText.lastIndexOf("? ", sliceEnd),
        cleanedText.lastIndexOf("! ", sliceEnd),
        cleanedText.lastIndexOf(", ", sliceEnd)
      );
      if (breakpoint > cursor + Math.floor(maxLength * 0.45)) {
        sliceEnd = breakpoint + 1;
      }
    }
    const chunk = cleanedText.slice(cursor, sliceEnd).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    cursor = sliceEnd;
  }

  return chunks;
}

function buildReaderSpeechSegments(sectionText) {
  const chunks = splitSpeechTextIntoChunks(normaliseSpeechText(sectionText), 320);
  return chunks.length ? chunks : [normaliseSpeechText(sectionText)].filter(Boolean);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightImportantTerms(htmlText, terms = []) {
  return terms.reduce((markup, term) => {
    const safeTerm = String(term || "").trim();
    if (!safeTerm) {
      return markup;
    }
    const regex = new RegExp(`\\b(${escapeRegExp(safeTerm)})\\b`, "gi");
    return markup.replace(regex, `<mark class="reader-important-term">$1</mark>`);
  }, htmlText);
}

function buildReaderTextMarkup(sectionText, importantTerms = []) {
  const segments = buildReaderSpeechSegments(sectionText);
  return segments
    .map((segment, index) => {
      const active = state.activeReaderSegmentIndex === index;
      const escapedSegment = escapeHtml(segment).replaceAll("\n", "<br />");
      const highlighted = highlightImportantTerms(escapedSegment, importantTerms);
      return `<span class="reader-text-segment${active ? " is-active" : ""}" data-reader-segment="${index}">${highlighted}</span>`;
    })
    .join(" ");
}

async function requestApiGet(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    let message = "The request failed.";
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error || message;
    } catch (error) {
      const fallbackText = await response.text();
      if (fallbackText) {
        message = fallbackText;
      }
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function buildAuthHeaders() {
  return state.authToken
    ? {
        Authorization: `Bearer ${state.authToken}`
      }
    : {};
}

async function requestApi(endpoint, payload, expectBlob = false, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  let response;
  try {
    response = await window.fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || "POST",
      headers,
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error("Backend request failed.");
  }

  if (!response.ok) {
    let message = "Backend request failed.";
    const responseText = await response.text();
    if (responseText) {
      try {
        const errorPayload = JSON.parse(responseText);
        message = errorPayload?.error || errorPayload?.message || message;
      } catch (error) {
        message = responseText;
      }
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return expectBlob ? response.blob() : response.json();
}

async function requestApiFormData(endpoint, formData) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData
  });

  const responseText = await response.text();
  let parsedPayload = null;
  if (responseText) {
    try {
      parsedPayload = JSON.parse(responseText);
    } catch (error) {
      parsedPayload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(parsedPayload?.error || responseText || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return parsedPayload || {};
}

async function requestDocumentStudyPlan(documentRecord, subject) {
  return requestApi("/api/document/study-plan", {
    subjectName: subject.name,
    title: documentRecord.title,
    type: documentRecord.type,
    pageCount: Array.isArray(documentRecord.pages) ? documentRecord.pages.length : 0,
    content: clipText(documentRecord.content || "", 18000)
  });
}

async function requestAskAnswer(question, subject, document) {
  const recentHistory = getTodayAskHistory(subject)
    .slice(-4)
    .map((entry) => ({ question: entry.question, answer: entry.answer }));
  const nextAssessment = getNextSubjectAssessment(subject);
  const responsePayload = await requestApi("/api/ask", {
    subjectName: subject.name,
    question,
    recentHistory,
    nextAssessment: nextAssessment
      ? {
          title: nextAssessment.componentTask || nextAssessment.title,
          due: formatAssessmentDueLabel(nextAssessment.dueDate)
        }
      : null,
    document: document
      ? {
          title: document.title,
          type: document.type,
          content: clipText(document.content || "Preview text is not available for this document.")
        }
      : null
  });

  const answer = responsePayload?.answer?.trim();
  if (!answer) {
    throw new Error("The backend returned an empty answer.");
  }

  return answer;
}

function getLatestAskAnswer() {
  const subject = getSelectedSubject();
  const history = subject ? getTodayAskHistory(subject) : [];
  return history.length ? String(history[history.length - 1].answer || "").trim() : "";
}

function renderAskVoiceControls() {
  if (elements.askMicButton) {
    elements.askMicButton.textContent = state.askMicActive ? "Stop microphone" : "Use microphone";
  }
  if (elements.askListenButton) {
    elements.askListenButton.textContent = state.askResponseSpeaking ? "Stop" : "Listen";
    elements.askListenButton.disabled = !state.askResponseSpeaking && !getLatestAskAnswer();
  }
}

function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function stopAskMicrophone({ preserveStatus = false } = {}) {
  if (currentSpeechRecognition) {
    currentSpeechRecognition.onresult = null;
    currentSpeechRecognition.onerror = null;
    currentSpeechRecognition.onend = null;
    currentSpeechRecognition.stop();
    currentSpeechRecognition = null;
  }
  state.askMicActive = false;
  if (!preserveStatus && elements.askResponse.textContent === "Listening for your question...") {
    elements.askResponse.textContent = getLatestAskAnswer() || "Ask a question about the selected subject or document.";
  }
  renderAskVoiceControls();
}

function startAskMicrophone() {
  const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();
  if (!SpeechRecognitionConstructor) {
    elements.askResponse.textContent = "Microphone input is not available in this browser.";
    renderAskVoiceControls();
    return;
  }

  stopAskMicrophone({ preserveStatus: true });
  const recognition = new SpeechRecognitionConstructor();
  currentSpeechRecognition = recognition;
  recognition.lang = "en-AU";
  recognition.interimResults = true;
  recognition.continuous = false;
  state.askMicActive = true;
  elements.askResponse.textContent = "Listening for your question...";
  renderAskVoiceControls();

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results || [])
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();
    elements.askInput.value = transcript;
    if (event.results?.[event.results.length - 1]?.isFinal && transcript) {
      elements.askResponse.textContent = "Question captured. Asking Panda...";
      stopAskMicrophone({ preserveStatus: true });
      void handleAsk();
    }
  };

  recognition.onerror = (event) => {
    state.askMicActive = false;
    currentSpeechRecognition = null;
    elements.askResponse.textContent =
      event?.error === "not-allowed"
        ? "Microphone permission was denied."
        : "Voice input failed. Try again or type your question.";
    renderAskVoiceControls();
  };

  recognition.onend = () => {
    currentSpeechRecognition = null;
    state.askMicActive = false;
    renderAskVoiceControls();
  };

  recognition.start();
}

async function speakTextWithOpenAi(text, { context = "document", documentId = null, statusMessages = {}, onChunkStart = null, onFinished = null, chunksOverride = null } = {}) {
  stopListening();
  const textToRead = normaliseSpeechText(text);
  if (!textToRead) {
    throw new Error("There is no readable text available yet.");
  }

  const listenSessionId = Date.now();
  currentListenSessionId = listenSessionId;
  currentAudioContext = context === "document" && documentId ? `document:${documentId}` : context;
  state.listeningDocumentId = context === "document" ? documentId : null;
  state.askResponseSpeaking = context === "ask";
  renderDocuments();
  renderAskVoiceControls();
  elements.askResponse.textContent = statusMessages.preparing || "Preparing audio...";

  const chunks = Array.isArray(chunksOverride) && chunksOverride.length
    ? chunksOverride.map((chunk) => normaliseSpeechText(chunk)).filter(Boolean)
    : splitSpeechTextIntoChunks(clipText(textToRead, 3500), 1100);
  if (!chunks.length) {
    throw new Error("There is no readable text available yet.");
  }

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    if (currentListenSessionId !== listenSessionId) {
      return;
    }

    if (typeof onChunkStart === "function") {
      onChunkStart(chunks[chunkIndex], chunkIndex);
    }

    const speechBlob = await requestApi("/api/speak", { text: chunks[chunkIndex] }, true);

    if (currentListenSessionId !== listenSessionId) {
      return;
    }

    if (currentAudioObjectUrl) {
      URL.revokeObjectURL(currentAudioObjectUrl);
    }
    currentAudioObjectUrl = URL.createObjectURL(speechBlob);
    currentAudioPlayback = new Audio(currentAudioObjectUrl);
    currentAudioPlayback.onerror = () => {
      stopListening();
      elements.askResponse.textContent = statusMessages.error || "AI voice playback failed.";
    };
    await currentAudioPlayback.play();
    elements.askResponse.textContent = statusMessages.playing || "Reading...";

    await new Promise((resolve, reject) => {
      if (!currentAudioPlayback) {
        resolve();
        return;
      }
      currentAudioPlayback.onended = () => resolve();
      currentAudioPlayback.onerror = () => reject(new Error(statusMessages.error || "AI voice playback failed."));
    });
  }

  if (typeof onFinished === "function") {
    onFinished();
  }
  stopListening();
  renderDocuments();
}

function currentDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatHeroDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date).replace(",", " ·");
}

function getSubjectShortCode(subjectName) {
  const words = String(subjectName || "")
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) {
    return "PP";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function getSubjectIconChoice(subjectId) {
  const iconId = state.settings.subjectIcons?.[subjectId];
  return pandaEmojiChoices.find((choice) => choice.id === iconId) || null;
}

function getSubjectTileCodeMarkup(subject) {
  const iconChoice = getSubjectIconChoice(subject.id);
  if (iconChoice) {
    return `<img src="${escapeHtml(iconChoice.src)}" alt="${escapeHtml(`${subject.name} panda`)}" class="subject-tile__emoji" />`;
  }
  return escapeHtml(getSubjectShortCode(subject.name));
}

function getSubjectTileOutlineColor(subject, paletteIndex) {
  if (subject.id === "maths" || subject.id === "wellbeing") {
    return "#1B1825";
  }

  return {
    dark: "#1B1825",
    lilac: "#DAD0FA",
    peach: "#F9D8BE",
    yellow: "#FFE79E",
    sky: "#C8E2F6",
    mint: "#CDEEDB"
  }[["dark", "lilac", "peach", "yellow", "sky", "mint"][paletteIndex % 6]] || "#DAD0FA";
}

function getSubjectTileCodeBackground(subject, paletteIndex) {
  if (subject.id === "maths" || subject.id === "wellbeing") {
    return "#1B1825";
  }

  return {
    dark: "#FFFFFF",
    lilac: "#DAD0FA",
    peach: "#F9D8BE",
    yellow: "#FFE79E",
    sky: "#C8E2F6",
    mint: "#CDEEDB"
  }[["dark", "lilac", "peach", "yellow", "sky", "mint"][paletteIndex % 6]] || "#DAD0FA";
}

function getSubjectTabCounts(subject) {
  return {
    reader: getReaderDocuments(subject).length,
    homework: getSubjectHomeworkBundles(subject).length,
    spelling: getSpellingPendingActivityCount(subject),
    watch: getSubjectWatchLinks(subject).length,
    assessments: getActiveSubjectAssessments(subject).length
  };
}

function getAvailableSubjectTabs(subject) {
  return subject?.id === "spelling"
    ? ["spelling"]
    : ["reader", "homework", "watch", "assessments"];
}

function getPreferredSubjectTab(subject) {
  const counts = getSubjectTabCounts(subject);
  if (
    subject?.id === "spelling" &&
    counts.spelling &&
    !counts.reader &&
    !counts.homework &&
    !counts.watch &&
    !counts.assessments
  ) {
    return "spelling";
  }

  return getAvailableSubjectTabs(subject)[0] || "reader";
}

function getHomeFocusSubjectStatus(subject) {
  const unreadCount = getAllDocumentBundles(subject).filter((bundle) => !bundle.reviewed).length;
  const remainingHomeworkCount = getSubjectHomeworkBundles(subject).filter(
    (bundle) => getTextCompletionRatio(bundle.workNotes, 350) < 1
  ).length;
  const activeAssessmentCount = getActiveSubjectAssessments(subject).length;
  const spellingPendingCount = getSpellingPendingActivityCount(subject);
  const waitingCount = unreadCount + remainingHomeworkCount + activeAssessmentCount + spellingPendingCount;
  const summary = spellingPendingCount && waitingCount === spellingPendingCount
    ? `${spellingPendingCount} spelling ${spellingPendingCount === 1 ? "stage" : "stages"}`
    : spellingPendingCount
      ? `${waitingCount} to do · ${spellingPendingCount} spelling stage${spellingPendingCount === 1 ? "" : "s"}`
      : waitingCount
        ? `${waitingCount} to do`
        : "Nothing due";

  return {
    waitingCount,
    hasWaiting: waitingCount > 0,
    summary
  };
}

function getSubjectHeroCopy(subject, tab) {
  const visibleDocuments = getReaderDocuments(subject);
  const selectedDocument = getSelectedDocument();
  const nextAssessment = getNextSubjectAssessment(subject);
  const homeworkBundles = getSubjectHomeworkBundles(subject);
  const spellingPending = getSpellingPendingActivityCount(subject);
  const watchCount = getSubjectWatchLinks(subject).length;
  const activeAssessments = getActiveSubjectAssessments(subject);

  if (tab === "reader") {
    const pageCount = selectedDocument
      ? Array.isArray(selectedDocument.pages) && selectedDocument.pages.length
        ? selectedDocument.pages.length
        : selectedDocument?.uploadGroupId
          ? subject.documents.filter((documentRecord) => documentRecord.uploadGroupId === selectedDocument.uploadGroupId).length
          : selectedDocument?.pageNumber
            ? 1
            : 1
      : visibleDocuments.length;
    return {
      big: `${pageCount || visibleDocuments.length || 0} ${pageCount === 1 ? "page" : "pages"}`,
      rest: selectedDocument ? `to finish in ${selectedDocument.title}.` : "ready to read in this subject."
    };
  }

  if (tab === "homework") {
    return {
      big: `${homeworkBundles.length} ${homeworkBundles.length === 1 ? "thing" : "things"}`,
      rest: homeworkBundles.length
        ? "today — Panda can break the first one into steps."
        : "today — no homework is waiting in this subject."
    };
  }

  if (tab === "spelling") {
    const stageId = getSpellingStageId(subject);
    return {
      big: `${spellingPending} ${spellingPending === 1 ? "stage" : "stages"}`,
      rest: subject.id === "spelling"
        ? spellingPending
          ? `left in ${SPELLING_UNIT_SEED.title} — current focus: ${SPELLING_STAGE_LABELS[stageId].toLowerCase()}.`
          : `cleared in ${SPELLING_UNIT_SEED.title} — ready for spaced review.`
        : "ready in the Spelling subject when you want focused pattern practice."
    };
  }

  if (tab === "watch") {
    return {
      big: `${watchCount} ${watchCount === 1 ? "video" : "videos"}`,
      rest: watchCount
        ? "linked from your class notes this week."
        : "linked from your class notes so far."
    };
  }

  if (nextAssessment?.dueDateObject) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daysUntil = Math.max(0, Math.ceil((nextAssessment.dueDateObject.getTime() - now.getTime()) / 86400000));
    return {
      big: `${daysUntil} ${daysUntil === 1 ? "day" : "days"}`,
      rest: `until ${nextAssessment.componentTask || nextAssessment.title}.`
    };
  }

  return {
    big: `${activeAssessments.length} ${activeAssessments.length === 1 ? "assessment" : "assessments"}`,
    rest: activeAssessments.length ? "active in this subject right now." : "active in this subject right now."
  };
}

function createDockTileMarkup({ title, meta = "", tint = "bg", emoji = "", tag = "", active = false } = {}) {
  return `
    <div class="dock-tile dock-tile--${escapeHtml(tint)}${active ? " dock-tile--active" : ""}">
      ${emoji ? `<span class="dock-tile__emoji">${escapeHtml(emoji)}</span>` : ""}
      <div class="dock-tile__copy">
        <strong>${escapeHtml(title)}</strong>
        ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
      </div>
      ${tag ? `<span class="dock-tile__tag">${escapeHtml(tag)}</span>` : ""}
    </div>
  `;
}

function getTodayAskHistory(subject) {
  return (subject.askHistory || []).filter((entry) => entry.dateKey === currentDateKey());
}

function renderHomeHero() {
  const unreadDocumentMetrics = getUnreadDocumentMetrics();
  const homeworkMetrics = getHomeworkMetrics();
  const assessmentMetrics = getAssessmentProgressMetrics();
  const spellingThings = state.subjects.reduce((total, subject) => total + getSpellingPendingActivityCount(subject), 0);
  const totalThings = unreadDocumentMetrics.unread + homeworkMetrics.remaining + assessmentMetrics.upcoming + spellingThings;
  const nextEntry = getNextAssessmentEntry();
  const daysUntil = nextEntry?.dueDateObject ? getDaysUntilDate(nextEntry.dueDateObject) : 0;

  elements.homeHeroDate.textContent = formatHeroDate();
  if (state.focusMode && state.currentView === "home") {
    elements.homeHeroTitle.innerHTML = `Hey ${escapeHtml(state.studentName || "there")}. <span>👋</span>`;
    elements.homeHeroSubtitle.textContent = "Here's what's due next. Then pick a subject to jump in.";
    return;
  }

  elements.homeHeroTitle.innerHTML = `Hey ${escapeHtml(state.studentName || "there")}. <span>${totalThings} things</span>`;
  elements.homeHeroSubtitle.textContent = nextEntry
    ? `today — and ${daysUntil} ${daysUntil === 1 ? "day" : "days"} until ${nextEntry.assessment.componentTask || nextEntry.assessment.title}.`
    : "today — your study space is ready for the next upload.";
}

function renderSubjectsHero() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  if (state.focusMode && state.currentView === "subjects" && !state.focusArea) {
    elements.subjectsHeroDate.textContent = formatHeroDate();
    elements.subjectsHeroTitle.innerHTML = `Hey ${escapeHtml(state.studentName || "there")}. <span>👋</span>`;
    elements.subjectsHeroSubtitle.textContent = "Pick one card to start. Everything else can wait.";
    return;
  }

  const heroCopy = getSubjectHeroCopy(subject, state.activeSubjectTab);
  elements.subjectsHeroDate.textContent = formatHeroDate();
  elements.subjectsHeroTitle.innerHTML = `Hey ${escapeHtml(state.studentName || "there")}. <span>${escapeHtml(heroCopy.big)}</span>`;
  elements.subjectsHeroSubtitle.textContent = heroCopy.rest;
}

function renderSubjectList() {
  elements.uploadSubjectSelect.innerHTML = state.subjects
    .map((subject) => `<option value="${subject.id}">${escapeHtml(subject.name)}</option>`)
    .join("");
  elements.uploadSubjectSelect.value = state.selectedSubjectId;
  renderUploadAssessmentTaskOptions();

  const palette = ["dark", "lilac", "peach", "yellow", "sky", "mint"];
  const homeSubjectTileMarkup = state.subjects
    .map((subject, index) => {
      const focusStatus = getHomeFocusSubjectStatus(subject);
      const counts = getSubjectTabCounts(subject);
      if (state.focusMode) {
        return `
          <button
            type="button"
            class="focus-home-subject-card${subject.id === state.selectedSubjectId ? " focus-home-subject-card--active" : ""}"
            data-subject-id="${subject.id}"
            style="--focus-subject-code-bg:${escapeHtml(getSubjectTileCodeBackground(subject, index))}; --focus-subject-dot:${escapeHtml(getSubjectTileOutlineColor(subject, index))}"
          >
            <span class="focus-home-subject-card__code">${escapeHtml(getSubjectShortCode(subject.name))}</span>
            <span class="focus-home-subject-card__copy">
              <strong>${escapeHtml(subject.name)}</strong>
              <span class="focus-home-subject-card__pill${focusStatus.hasWaiting ? " focus-home-subject-card__pill--active" : ""}">
                ${escapeHtml(focusStatus.summary)}
              </span>
            </span>
            ${focusStatus.hasWaiting ? '<span class="focus-home-subject-card__dot" aria-hidden="true"></span>' : ""}
          </button>
        `;
      }
      return `
        <button
          type="button"
          class="subject-tile subject-tile--home${subject.id === state.selectedSubjectId ? " subject-tile--home-active" : ""}"
          data-subject-id="${subject.id}"
          style="--subject-outline:${escapeHtml(getSubjectTileOutlineColor(subject, index))}; --subject-code-bg:${escapeHtml(getSubjectTileCodeBackground(subject, index))}"
        >
          <span class="subject-tile__code">${getSubjectTileCodeMarkup(subject)}</span>
          <span class="subject-tile__title">${escapeHtml(subject.name)}</span>
          <span class="subject-tile__meta">
            ${counts.spelling ? `<span class="subject-tile__feature-chip">Aa ${escapeHtml(`${counts.spelling} stages`)}</span>` : ""}
            <span>${escapeHtml(`${counts.reader} notes`)}</span>
            <span>${escapeHtml(`${counts.homework} HW`)}</span>
          </span>
        </button>
      `;
    })
    .join("");

  const subjectRowTileMarkup = state.subjects
    .map((subject, index) => `
      <button
        type="button"
        class="subject-tile subject-tile--${palette[index % palette.length]}${subject.id === state.selectedSubjectId ? " subject-tile--active subject-tile--row-active" : ""}"
        data-subject-id="${subject.id}"
        style="--subject-outline:${escapeHtml(getSubjectTileOutlineColor(subject, index))}"
      >
        <span class="subject-tile__code">${getSubjectTileCodeMarkup(subject)}</span>
        <span class="subject-tile__title">${escapeHtml(subject.name)}</span>
        ${getSubjectTabCounts(subject).spelling ? `<span class="subject-tile__mini-chip">Aa Spelling</span>` : ""}
      </button>
    `)
    .join("");

  if (elements.subjectList) {
    elements.subjectList.innerHTML = subjectRowTileMarkup;
  }
  if (elements.homeSubjectGrid) {
    elements.homeSubjectGrid.innerHTML = homeSubjectTileMarkup;
  }

  document.querySelectorAll("[data-subject-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const subject = state.subjects.find((item) => item.id === button.dataset.subjectId);
      if (!subject) {
        return;
      }

      state.selectedSubjectId = subject.id;
      state.activeSubjectTab = getPreferredSubjectTab(subject);
      state.focusArea = null;
      state.selectedDocumentIds = [];
      state.expandedDocumentGroups = {};
      state.watchExpanded = false;
      state.documentsExpanded = false;
      state.taskAskResponse = "";
      state.taskAskStatus = "";
      state.currentView = button.closest("#home-view") ? "subjects" : state.currentView;
      render();
    });
  });
}

function renderDocumentBulkActions(subject) {
  const documentIds = getVisibleSubjectDocuments(subject).map((documentRecord) => documentRecord.id);
  state.selectedDocumentIds = state.selectedDocumentIds.filter((documentId) => documentIds.includes(documentId));
  const allSelected = Boolean(documentIds.length) && state.selectedDocumentIds.length === documentIds.length;
  elements.documentsSelectAllButton.disabled = !documentIds.length;
  elements.documentsDeleteSelectedButton.disabled = !state.selectedDocumentIds.length;
  elements.documentsSelectAllButton.textContent = allSelected ? "Clear selection" : "Select all";
}

function renderAskContext() {
  const subject = getSelectedSubject();
  const askDocument = getAskDocument();
  const history = subject ? getTodayAskHistory(subject) : [];
  const historyMarkup = history.length
    ? history
        .map(
          (entry) =>
            `Q: ${entry.question}\nA: ${entry.answer}`
        )
        .join("\n\n")
    : "";
  elements.askContext.textContent = askDocument
    ? `Asking about: ${askDocument.title}`
    : "No document selected for Ask yet.";
  elements.askResponse.textContent =
    historyMarkup || "Ask a question about the selected subject or document.";
  renderAskVoiceControls();
}

function renderSavedRevisionTests() {
  const subject = getSelectedSubject();
  const savedTests = Array.isArray(subject?.savedRevisionTests) ? [...subject.savedRevisionTests] : [];
  if (!savedTests.length) {
    elements.savedTestsList.innerHTML = `<div class="empty-state empty-state--compact">No saved tests for this subject yet.</div>`;
    return;
  }

  savedTests.sort((left, right) => new Date(right.savedAt || 0).getTime() - new Date(left.savedAt || 0).getTime());
  elements.savedTestsList.innerHTML = savedTests
    .map(
      (savedTest) => `
        <button type="button" class="saved-test-button" data-open-saved-test="${savedTest.id}">
          <span class="saved-test-button__title">${escapeHtml(savedTest.title)}</span>
          <span class="saved-test-button__meta">${escapeHtml(formatDate(savedTest.savedAt))}</span>
        </button>
      `
    )
    .join("");

  elements.savedTestsList.querySelectorAll("[data-open-saved-test]").forEach((button) => {
    button.addEventListener("click", () => {
      openSavedRevisionTest(button.dataset.openSavedTest);
    });
  });
}

function saveCurrentRevisionTest() {
  const selectedEntry = getRevisionSubjectEntry();
  if (!selectedEntry) {
    elements.revisionTestStatus.textContent = "Select a revision subject first.";
    return;
  }

  if (!state.generatedRevisionTest || !state.revisionSubmission) {
    elements.revisionTestStatus.textContent = "Submit the test before saving it.";
    return;
  }

  const subject =
    state.subjects.find((item) => item.id === selectedEntry.subjectId) ||
    state.subjects.find((item) => item.name.toLowerCase() === String(selectedEntry.subjectName || "").toLowerCase());
  if (!subject) {
    elements.revisionTestStatus.textContent = "The subject for this test could not be found.";
    return;
  }

  subject.savedRevisionTests = Array.isArray(subject.savedRevisionTests) ? subject.savedRevisionTests : [];
  const savedTest = normaliseSavedRevisionTest({
    id: createId(),
    savedAt: new Date().toISOString(),
    title: state.generatedRevisionTest.title || `${selectedEntry.subjectName} revision test`,
    subjectId: selectedEntry.subjectId,
    test: structuredClone(state.generatedRevisionTest),
    responses: structuredClone(state.revisionResponses),
    submission: structuredClone(state.revisionSubmission)
  });
  subject.savedRevisionTests.unshift(savedTest);
  state.activeSavedRevisionTestId = savedTest.id;
  state.revisionViewMode = "saved";
  persistSubjects();
  renderSavedRevisionTests();
  renderRevisionTestView();
  elements.revisionTestStatus.textContent = "Test saved to this subject.";
}

function openSavedRevisionTest(savedTestId) {
  const subject = getSelectedSubject();
  const savedTest = Array.isArray(subject?.savedRevisionTests)
    ? subject.savedRevisionTests.find((item) => item.id === savedTestId)
    : null;
  if (!savedTest) {
    return;
  }

  state.revisionSelectedSubjectId = subject.id;
  state.generatedRevisionTest = structuredClone(savedTest.test);
  state.revisionResponses = structuredClone(savedTest.responses || {});
  state.revisionSubmission = structuredClone(savedTest.submission || null);
  state.revisionViewMode = "saved";
  state.activeSavedRevisionTestId = savedTest.id;
  openRevisionTestView();
}

function getReaderToolbarMarkup() {
  const selectedDocument = getSelectedDocument();
  const selectedIndex = getSelectedDocumentIndex();
  const documentCount = getVisibleSubjectDocuments(getSelectedSubject() || { documents: [] }).length || 0;
  const hasDocument = Boolean(selectedDocument);
  const pageCount = getDocumentPages(selectedDocument).length;
  const pageIndex = getCurrentDocumentPageIndex(selectedDocument);
  const usesPageNavigation = Boolean(selectedDocument && isWholeStudyDocument(selectedDocument) && pageCount > 1);

  return `
    <div class="reader-toolbar reader-toolbar--inline">
      <button type="button" class="table-action" data-reader-action="previous" aria-label="Previous page" ${!hasDocument || (usesPageNavigation ? pageIndex <= 0 : selectedIndex <= 0) ? "disabled" : ""}>←</button>
      <button type="button" class="table-action" data-reader-action="listen" ${!hasDocument ? "disabled" : ""}>
        ${selectedDocument && state.listeningDocumentId === selectedDocument.id ? "Stop" : "Listen"}
      </button>
      <button type="button" class="table-action" data-reader-action="ask" ${!hasDocument ? "disabled" : ""}>Ask</button>
      <button type="button" class="table-action" data-reader-action="next" aria-label="Next page" ${!hasDocument || (usesPageNavigation ? pageIndex >= pageCount - 1 : selectedIndex === -1 || selectedIndex >= documentCount - 1) ? "disabled" : ""}>→</button>
    </div>
  `;
}

function renderDocumentGroupRows(group, { reviewedSection = false } = {}) {
  const isExpanded = Boolean(state.expandedDocumentGroups[group.id]);
  const visibleDocuments =
    group.isPageGroup && !isExpanded ? [group.documents[0]] : group.documents;
  const groupDocumentIds = group.documents.map((documentRecord) => documentRecord.id);
  const groupSelected = groupDocumentIds.every((documentId) => state.selectedDocumentIds.includes(documentId));
  const dateCellMarkup = group.isPageGroup
    ? `
      <button type="button" class="documents-date-button" data-document-group-toggle="${group.id}">
        <strong>${escapeHtml(group.added)}</strong>
        <span>${isExpanded ? "Hide pages" : `${getBundlePageCount(group)} pages`}</span>
      </button>
    `
    : `<span class="documents-date-button"><strong>${escapeHtml(group.added)}</strong></span>`;

  return visibleDocuments
    .map(
      (document, index) => `
        <tr class="${document.id === state.selectedDocumentId ? "is-selected" : ""}${state.selectedDocumentIds.includes(document.id) ? " is-bulk-selected" : ""}${reviewedSection ? " documents-row--reviewed" : ""}">
          ${
            index === 0
              ? `<td rowspan="${visibleDocuments.length}">
                  <label class="document-select-toggle">
                    <input
                      type="checkbox"
                      data-document-select-group="${group.id}"
                      ${groupSelected ? "checked" : ""}
                    />
                    <span>Select</span>
                  </label>
                </td>`
              : ""
          }
          ${
            index === 0
              ? `<td rowspan="${visibleDocuments.length}">${dateCellMarkup}</td>`
              : ""
          }
          <td>
            <button type="button" class="documents-title-button" data-document-title-id="${document.id}">
              <strong>${escapeHtml(document.title)}</strong>
            </button>
          </td>
          <td>${escapeHtml(document.type)}</td>
          <td>
            <label class="document-review-toggle">
              <input
                type="checkbox"
                data-document-reviewed-id="${document.id}"
                ${document.reviewed ? "checked" : ""}
              />
              <span>${document.reviewed ? "Read / listened" : "Mark done"}</span>
            </label>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="table-action" data-action="read" data-document-id="${document.id}">Read</button>
              <button type="button" class="table-action" data-action="listen" data-document-id="${document.id}">
                ${state.listeningDocumentId === document.id ? "Stop" : "Listen"}
              </button>
              <button type="button" class="table-action" data-action="ask" data-document-id="${document.id}">Ask</button>
              <button type="button" class="table-action table-action--danger" data-action="delete" data-document-id="${document.id}">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderDocuments() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  const sortedDocuments = getVisibleSubjectDocuments(subject);

  if (!sortedDocuments.length) {
    elements.documentsBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            No documents uploaded for this subject yet. Add worksheets, rubrics, or weekly notes.
          </div>
        </td>
      </tr>
    `;
    elements.readerTitle.textContent = "Document reader";
    elements.readerContent.textContent = "Upload or select a document to read it here.";
    elements.documentsToggleButton.classList.add("hidden");
    renderDocumentBulkActions(subject);
    renderSubjectsHero();
    renderDockContext();
    return;
  }

  const unreadDocuments = sortedDocuments.filter((document) => !document.reviewed);
  const reviewedDocuments = sortedDocuments.filter((document) => document.reviewed);
  const unreadGroups = getDocumentGroupsFromDocuments(unreadDocuments);
  const reviewedGroups = getDocumentGroupsFromDocuments(reviewedDocuments);

  if (!sortedDocuments.find((doc) => doc.id === state.selectedDocumentId)) {
    state.selectedDocumentId = sortedDocuments[0].id;
  }

  if (!sortedDocuments.find((doc) => doc.id === state.askDocumentId)) {
    state.askDocumentId = sortedDocuments[0].id;
  }

  const visibleUnreadGroups = state.documentsExpanded ? unreadGroups : unreadGroups.slice(0, 6);
  const combinedGroupMap = new Map([...visibleUnreadGroups, ...reviewedGroups].map((group) => [group.id, group]));
  const rowsMarkup = [
    `
      <tr class="documents-section-row">
        <td colspan="6">Newly uploaded</td>
      </tr>
    `,
    visibleUnreadGroups.length
      ? visibleUnreadGroups.map((group) => renderDocumentGroupRows(group)).join("")
      : `
        <tr class="documents-empty-row">
          <td colspan="6"><div class="empty-state">No new documents waiting to be read.</div></td>
        </tr>
      `,
    reviewedGroups.length
      ? `
        <tr class="documents-section-row documents-section-row--reviewed">
          <td colspan="6">Read / listened</td>
        </tr>
        ${reviewedGroups.map((group) => renderDocumentGroupRows(group, { reviewedSection: true })).join("")}
      `
      : ""
  ].join("");

  elements.documentsBody.innerHTML = rowsMarkup;

  elements.documentsBody.querySelectorAll("[data-document-group-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupId = button.dataset.documentGroupToggle;
      if (!groupId) {
        return;
      }
      state.expandedDocumentGroups[groupId] = !state.expandedDocumentGroups[groupId];
      renderDocuments();
    });
  });

  elements.documentsBody.querySelectorAll("[data-document-title-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const documentRecord = subject.documents.find((doc) => doc.id === button.dataset.documentTitleId);
      if (!documentRecord) {
        return;
      }
      state.selectedDocumentId = documentRecord.id;
      renderDocuments();
      scrollReaderIntoView();
    });
  });

  elements.documentsBody.querySelectorAll("[data-document-select-group]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const groupId = checkbox.dataset.documentSelectGroup;
      if (!groupId) {
        return;
      }
      const group = combinedGroupMap.get(groupId);
      if (!group) {
        return;
      }
      const groupIds = group.documents.map((documentRecord) => documentRecord.id);
      if (checkbox.checked) {
        state.selectedDocumentIds = [...new Set([...state.selectedDocumentIds, ...groupIds])];
      } else {
        const groupIdSet = new Set(groupIds);
        state.selectedDocumentIds = state.selectedDocumentIds.filter((documentId) => !groupIdSet.has(documentId));
      }
      renderDocuments();
    });
  });

  elements.documentsBody.querySelectorAll("[data-document-reviewed-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const documentRecord = subject.documents.find((doc) => doc.id === checkbox.dataset.documentReviewedId);
      if (!documentRecord) {
        return;
      }
      documentRecord.reviewed = checkbox.checked;
      documentRecord.reviewMode = checkbox.checked ? "manual" : "";
      persistSubjects();
      renderDocuments();
    });
  });

  elements.documentsBody.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const documentRecord = subject.documents.find((doc) => doc.id === button.dataset.documentId);
      if (!documentRecord) {
        return;
      }

      state.selectedDocumentId = documentRecord.id;

      if (button.dataset.action === "read") {
        renderDocuments();
        scrollReaderIntoView();
      }

      if (button.dataset.action === "listen") {
        renderDocuments();
        toggleListen(documentRecord);
      }

      if (button.dataset.action === "ask") {
        state.askDocumentId = documentRecord.id;
        elements.askInput.value = "";
        renderDocuments();
        renderAskContext();
        elements.askResponse.textContent = "Ask a question about the selected document.";
        focusAskComposer();
      }

      if (button.dataset.action === "delete") {
        deleteDocument(documentRecord.id);
        return;
      }
    });
  });

  const hasExtraDocuments = unreadGroups.length > 6;
  elements.documentsToggleButton.classList.toggle("hidden", !hasExtraDocuments);
  if (hasExtraDocuments) {
    elements.documentsToggleButton.textContent = state.documentsExpanded ? "Show recent documents" : "Show all new documents";
  }

  renderDocumentBulkActions(subject);
  renderReader();
  renderSubjectsHero();
  renderDockContext();
}

function renderWatchList() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  elements.watchStatus.textContent = "";
  const watchItems = getSubjectWatchLinks(subject);
  if (!watchItems.length) {
    elements.watchList.innerHTML = `
      <div class="empty-state">
        No WATCH items for this subject yet.
      </div>
    `;
    elements.watchToggleButton.classList.add("hidden");
    renderDockContext();
    return;
  }

  const visibleItems = state.watchExpanded ? watchItems : watchItems.slice(0, 6);

  elements.watchList.innerHTML = visibleItems
    .map(
      (item) => `
        <article class="watch-row-card">
          <button type="button" class="home-watch-row watch-row-card__open" data-watch-action="open" data-watch-id="${item.id}">
            <span class="home-watch-row__thumb">${item.source === "auto-document" ? "🧬" : "🎬"}</span>
            <span class="home-watch-row__copy">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.sourceDocumentTitle || item.url)}</span>
            </span>
          </button>
          <div class="table-actions watch-row-card__actions">
            <button type="button" class="table-action" data-watch-action="open" data-watch-id="${item.id}">Open</button>
            <button type="button" class="table-action table-action--danger" data-watch-action="delete" data-watch-id="${item.id}">
              ${item.source === "auto-document" ? "Hide" : "Delete"}
            </button>
          </div>
        </article>
      `
    )
    .join("");

  const hasExtraWatchItems = watchItems.length > 6;
  elements.watchToggleButton.classList.toggle("hidden", !hasExtraWatchItems);
  if (hasExtraWatchItems) {
    elements.watchToggleButton.textContent = state.watchExpanded ? "Show less" : "Load more";
  }

  elements.watchList.querySelectorAll("[data-watch-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = watchItems.find((entry) => entry.id === button.dataset.watchId);
      if (!item) {
        return;
      }

      if (button.dataset.watchAction === "open") {
        window.open(item.url, "_blank", "noopener");
      }

      if (button.dataset.watchAction === "delete") {
        if (item.source === "auto-document") {
          const hiddenUrls = getSubjectHiddenWatchUrls(subject);
          hiddenUrls.add(normaliseWatchUrl(item.url) || item.url);
          subject.hiddenWatchUrls = [...hiddenUrls];
        } else {
          const normalisedUrl = normaliseWatchUrl(item.url);
          subject.watch = (Array.isArray(subject.watch) ? subject.watch : []).filter((entry) => entry.id !== item.id);
          if (subjectHasAutoWatchUrl(subject, normalisedUrl)) {
            const hiddenUrls = getSubjectHiddenWatchUrls(subject);
            hiddenUrls.add(normalisedUrl);
            subject.hiddenWatchUrls = [...hiddenUrls];
          }
        }
        persistSubjects();
        render();
      }
    });
  });

  renderDockContext();
}

function handleWatchRescan() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  syncAutoWatchForSubject(subject);
  persistSubjects();
  renderWatchList();
  elements.watchStatus.textContent = "YouTube links rescanned for this subject.";
}

function renderReader() {
  const selectedDocument = getSelectedDocument();
  if (!selectedDocument) {
    elements.readerTitle.textContent = "Document reader";
    elements.readerContent.textContent = "Choose a document from the table to read it here.";
    return;
  }

  elements.readerTitle.textContent = selectedDocument.title;
  const subject = getSelectedSubject();
  const readableContent = selectedDocument.content
    ? selectedDocument.content
    : "This file has been uploaded, but preview text is not available yet. The document can still be attached to assessments.";
  const openOriginalMarkup = selectedDocument.originalFile?.objectUrl
    ? `
      <div class="reader-actions">
        <button type="button" class="ghost-button" id="open-original-button">Open original file</button>
      </div>
    `
    : "";
  const previewImageMarkup = selectedDocument.previewImageUrl
    ? `
      <div class="reader-preview">
        <img class="reader-preview-image" src="${escapeHtml(selectedDocument.previewImageUrl)}" alt="${escapeHtml(selectedDocument.title)} preview" />
      </div>
    `
    : "";
  const pageList = getDocumentPages(selectedDocument);
  const currentPageIndex = getCurrentDocumentPageIndex(selectedDocument);
  const currentPage = pageList[currentPageIndex] || null;
  const pagePreviewStackMarkup =
    isWholeStudyDocument(selectedDocument) && Array.isArray(selectedDocument.pages)
      ? (() => {
          const pages = pageList;
          const pageIndex = currentPageIndex;
          const activePage = currentPage;
          if (!activePage) {
            return "";
          }
          return `
            <figure class="reader-preview reader-preview--page">
              <img class="reader-preview-image" src="${escapeHtml(activePage.imageUrl)}" alt="${escapeHtml(`${selectedDocument.title} page ${activePage.pageNumber || pageIndex + 1}`)} preview" />
              ${
                pages.length > 1
                  ? `<figcaption class="reader-preview-caption">Page ${escapeHtml(String(activePage.pageNumber || pageIndex + 1))} of ${escapeHtml(String(pages.length))}</figcaption>`
                  : ""
              }
            </figure>
          `;
        })()
      : "";
  const reviewToggleMarkup = `
    <div class="reader-controls-row">
      <label class="document-review-toggle document-review-toggle--reader">
        <input type="checkbox" id="reader-reviewed-toggle" ${selectedDocument.reviewed ? "checked" : ""} />
        <span>${selectedDocument.reviewed ? "Read / listened" : "Mark as read / listened"}</span>
      </label>
      ${getReaderToolbarMarkup()}
    </div>
  `;

  if (selectedDocument.flags?.homework) {
    elements.readerContent.innerHTML = `
      ${reviewToggleMarkup}
      ${previewImageMarkup}
      <textarea class="reader-editor" id="reader-editor">${escapeHtml(readableContent)}</textarea>
      <div class="reader-actions">
        <button type="button" class="primary-button" id="save-homework-button">Save homework edits</button>
      </div>
      ${openOriginalMarkup}
    `;

    const editor = document.getElementById("reader-editor");
    const saveButton = document.getElementById("save-homework-button");
    const openOriginalButton = document.getElementById("open-original-button");
    const reviewToggle = document.getElementById("reader-reviewed-toggle");
    saveButton.addEventListener("click", () => {
      selectedDocument.content = editor.value;
      syncAutoWatchForSubject(getSelectedSubject());
      persistSubjects();
      elements.uploadStatus.textContent = "Homework edits saved.";
      renderDocuments();
      renderReader();
    });
    reviewToggle?.addEventListener("change", () => {
      const subject = getSelectedSubject();
      if (!subject) {
        return;
      }
      setDocumentReviewedState(subject, [selectedDocument.id], reviewToggle.checked);
      persistSubjects();
      renderDocuments();
      renderReader();
    });
    if (openOriginalButton && selectedDocument.originalFile?.objectUrl) {
      openOriginalButton.addEventListener("click", () => {
        window.open(selectedDocument.originalFile.objectUrl, "_blank", "noopener");
      });
    }
    attachReaderActionHandlers();
    return;
  }

  if (isWholeStudyDocument(selectedDocument)) {
    if (selectedDocument.studyPlanStatus === "idle" && subject) {
      void ensureDocumentStudyPlan(selectedDocument, subject);
    }

    const sections = getDocumentSections(selectedDocument);
    const pageBoundSectionIndex = pageList.length ? findSectionIndexForPage(selectedDocument, currentPageIndex) : -1;
    const currentSectionIndex =
      pageBoundSectionIndex >= 0 ? pageBoundSectionIndex : getCurrentDocumentSectionIndex(selectedDocument);
    const currentSection = sections[currentSectionIndex] || null;
    const completedIds = new Set(Array.isArray(selectedDocument.completedSectionIds) ? selectedDocument.completedSectionIds : []);
    const importantTerms = [...new Set([...(selectedDocument.importantTerms || []), ...(currentSection?.importantTerms || [])])];
    const progressRatio = getDocumentProgressRatio(selectedDocument);
    const pageButtonsMarkup = pageList
      .map(
        (page, index) => `
          <button
            type="button"
            class="document-chip${index === currentPageIndex ? " document-chip--active" : ""}"
            data-reader-page-index="${index}"
          >
            ${escapeHtml(`Page ${String(page.pageNumber || index + 1)}`)}
          </button>
        `
      )
      .join("");
    const sectionButtonsMarkup = sections
      .map(
        (section, index) => `
          <button
            type="button"
            class="document-chip${index === currentSectionIndex ? " document-chip--active" : ""}${completedIds.has(section.id) ? " document-chip--done" : ""}"
            data-reader-section-index="${index}"
          >
            ${escapeHtml(section.title)}
          </button>
        `
      )
      .join("");
    const documentPagesMarkup =
      pagePreviewStackMarkup
        ? `
          <section class="reader-pages-card">
            <div class="reader-preview-stack">${pagePreviewStackMarkup}</div>
          </section>
        `
        : "";
    const currentPageText = getDocumentPageText(currentPage);

    elements.readerContent.innerHTML = `
      ${reviewToggleMarkup}
      <div class="reader-document-progress">
        <div class="progress-meter progress-meter--wide">
          <span class="progress-meter__bar" style="width:${Math.round(progressRatio * 100)}%"></span>
        </div>
        <span class="helper-text">${sections.length ? `${completedIds.size} of ${sections.length} sections completed` : "Preparing sections..."}</span>
        <button type="button" class="ghost-button ghost-button--small" id="reader-resume-button" ${!sections.length ? "disabled" : ""}>Resume</button>
        <button type="button" class="ghost-button ghost-button--small" id="reader-complete-section-button" ${!currentSection ? "disabled" : ""}>${currentSection && completedIds.has(currentSection.id) ? "Undo section" : "Complete section"}</button>
      </div>
      <div class="reader-section-strip">${pageButtonsMarkup || `<span class="helper-text">${selectedDocument.studyPlanStatus === "loading" ? "Preparing document pages..." : "Preparing document pages..."}</span>`}</div>
      ${documentPagesMarkup || previewImageMarkup}
      ${
        currentPageText
          ? `
            <section class="reader-study-card">
              <div class="section-heading section-heading--stacked section-heading--compact">
                <div>
                  <p class="eyebrow">Current page</p>
                  <h3>${escapeHtml(`Page ${String(currentPage?.pageNumber || currentPageIndex + 1)}`)}</h3>
                </div>
              </div>
              <div class="reader-content__text reader-content__text--study">${buildReaderTextMarkup(currentPageText, importantTerms)}</div>
            </section>
          `
          : ""
      }
      ${
        currentSection
          ? `
            <section class="reader-study-card">
              <div class="section-heading section-heading--stacked section-heading--compact">
                <div>
                  <p class="eyebrow">Study section</p>
                  <h3>${escapeHtml(currentSection.title)}</h3>
                </div>
              </div>
              ${currentSection.summary ? `<p class="helper-text">${escapeHtml(currentSection.summary)}</p>` : ""}
              <div class="reader-section-strip reader-section-strip--study">${sectionButtonsMarkup}</div>
            </section>
          `
          : `<div class="empty-state">PaperPanda is organising this document into study sections.</div>`
      }
      <div class="reader-actions">
        <button type="button" class="ghost-button" id="open-original-button">Open original file</button>
        <button
          type="button"
          class="primary-button"
          id="open-document-revision-button"
          ${state.generatingDocumentRevisionId === selectedDocument.id ? "disabled" : ""}
        >
          ${state.generatingDocumentRevisionId === selectedDocument.id ? "Producing..." : "Revision test"}
        </button>
      </div>
    `;

    document.getElementById("reader-reviewed-toggle")?.addEventListener("change", (event) => {
      if (!subject) {
        return;
      }
      setDocumentReviewedState(subject, [selectedDocument.id], event.target.checked);
      renderDocuments();
      renderReader();
      renderOverview();
    });
    document.getElementById("reader-resume-button")?.addEventListener("click", () => {
      const resumeIndex = getResumeDocumentSectionIndex(selectedDocument);
      setCurrentDocumentSection(selectedDocument, resumeIndex);
      const resumeSection = sections[resumeIndex];
      if (pageList.length && resumeSection?.pageStart) {
        const nextPageIndex = Math.max(0, pageList.findIndex((page) => Number(page?.pageNumber || 0) === resumeSection.pageStart));
        setCurrentDocumentPageIndex(selectedDocument, nextPageIndex);
      }
      renderReader();
    });
    document.getElementById("reader-complete-section-button")?.addEventListener("click", () => {
      if (!currentSection) {
        return;
      }
      markDocumentSectionComplete(selectedDocument, currentSection.id, !completedIds.has(currentSection.id));
      renderReader();
      renderDocuments();
      renderOverview();
    });
    elements.readerContent.querySelectorAll("[data-reader-page-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const pageIndex = Number(button.dataset.readerPageIndex || 0);
        setCurrentDocumentPageIndex(selectedDocument, pageIndex);
        const matchingSectionIndex = findSectionIndexForPage(selectedDocument, pageIndex);
        if (matchingSectionIndex >= 0) {
          setCurrentDocumentSection(selectedDocument, matchingSectionIndex);
        }
        renderReader();
        requestAnimationFrame(() => {
          elements.readerContent.querySelector(".reader-preview--page")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      });
    });
    elements.readerContent.querySelectorAll("[data-reader-section-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const sectionIndex = Number(button.dataset.readerSectionIndex || 0);
        const nextSection = sections[sectionIndex];
        setCurrentDocumentSection(selectedDocument, sectionIndex);
        if (nextSection?.pageStart) {
          const nextPageIndex = Math.max(0, pageList.findIndex((page) => Number(page?.pageNumber || 0) === nextSection.pageStart));
          setCurrentDocumentPageIndex(selectedDocument, nextPageIndex);
        }
        renderReader();
      });
    });
    document.getElementById("open-document-revision-button")?.addEventListener("click", async () => {
      if (!subject) {
        return;
      }
      state.generatingDocumentRevisionId = selectedDocument.id;
      renderReader();
      try {
        await generateDocumentRevisionTest(selectedDocument, subject);
      } catch (error) {
        state.generatingDocumentRevisionId = "";
        renderReader();
        elements.uploadStatus.textContent = error instanceof Error ? error.message : "Revision test generation failed.";
      }
    });
    const openOriginalButton = document.getElementById("open-original-button");
    if (openOriginalButton && selectedDocument.originalFile?.objectUrl) {
      openOriginalButton.addEventListener("click", () => {
        window.open(selectedDocument.originalFile.objectUrl, "_blank", "noopener");
      });
    }
    attachReaderActionHandlers();
    return;
  }

  elements.readerContent.innerHTML = `
    ${reviewToggleMarkup}
    ${previewImageMarkup}
    <div class="reader-content__text">${escapeHtml(readableContent).replaceAll("\n", "<br />")}</div>
    ${openOriginalMarkup}
  `;
  document.getElementById("reader-reviewed-toggle")?.addEventListener("change", (event) => {
    if (!subject) {
      return;
    }
    setDocumentReviewedState(subject, [selectedDocument.id], event.target.checked);
    persistSubjects();
    renderDocuments();
    renderReader();
  });
  const openOriginalButton = document.getElementById("open-original-button");
  if (openOriginalButton && selectedDocument.originalFile?.objectUrl) {
    openOriginalButton.addEventListener("click", () => {
      window.open(selectedDocument.originalFile.objectUrl, "_blank", "noopener");
    });
  }
  attachReaderActionHandlers();
}

function speakDocument(document) {
  const selectedSection = isWholeStudyDocument(document) ? getSelectedDocumentSection(document) : null;
  const currentPage = isWholeStudyDocument(document) ? getDocumentPages(document)[getCurrentDocumentPageIndex(document)] || null : null;
  const pageText = getDocumentPageText(currentPage);
  const sectionText = selectedSection?.sectionText || "";
  const prefersPageText = Boolean(isWholeStudyDocument(document) && currentPage);
  const textToRead = normaliseSpeechText(
    prefersPageText
      ? pageText || `${document.title}. Readable text is not available for this page yet.`
      : sectionText || document.content || `${document.title}. Preview text is not available for this file yet.`
  );
  if (!textToRead) {
    elements.askResponse.textContent = "There is no readable text available for this document yet.";
    return;
  }

  const readerSegments = buildReaderSpeechSegments(prefersPageText ? pageText : sectionText);

  speakTextWithOpenAi(textToRead, {
    context: "document",
    documentId: document.id,
    statusMessages: {
      preparing: "Preparing audio...",
      playing: "Reading document...",
      error: "AI voice playback failed for this document."
    },
    chunksOverride: readerSegments.length ? readerSegments : null,
    onChunkStart: (_chunk, chunkIndex) => {
      if (selectedSection || currentPage) {
        state.activeReaderSectionId = selectedSection?.id || "";
        state.activeReaderSegmentIndex = Math.min(chunkIndex, Math.max(0, readerSegments.length - 1));
        renderReader();
      }
    },
    onFinished: () => {
      if (selectedSection) {
        state.activeReaderSegmentIndex = -1;
        state.activeReaderSectionId = "";
        markDocumentSectionComplete(document, selectedSection.id, true);
        renderReader();
        renderOverview();
      }
    }
  }).catch((error) => {
    console.error("OpenAI speech failed.", error);
    stopListening();
    elements.askResponse.textContent =
      error instanceof Error ? `Listen failed: ${error.message}` : "Listen failed.";
    renderDocuments();
  });
}

function attachReaderActionHandlers() {
  elements.readerContent.querySelectorAll("[data-reader-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.readerAction;
      const selectedDocument = getSelectedDocument();
      if (!selectedDocument && action !== "previous" && action !== "next") {
        return;
      }
      const usesPageNavigation = Boolean(selectedDocument && isWholeStudyDocument(selectedDocument) && getDocumentPages(selectedDocument).length > 1);

      if (action === "previous") {
        if (usesPageNavigation && selectedDocument) {
          const nextPageIndex = getCurrentDocumentPageIndex(selectedDocument) - 1;
          setCurrentDocumentPageIndex(selectedDocument, nextPageIndex);
          const matchingSectionIndex = findSectionIndexForPage(selectedDocument, nextPageIndex);
          if (matchingSectionIndex >= 0) {
            setCurrentDocumentSection(selectedDocument, matchingSectionIndex);
          }
          renderReader();
        } else {
          selectAdjacentDocument(-1);
        }
        return;
      }

      if (action === "next") {
        if (usesPageNavigation && selectedDocument) {
          const nextPageIndex = getCurrentDocumentPageIndex(selectedDocument) + 1;
          setCurrentDocumentPageIndex(selectedDocument, nextPageIndex);
          const matchingSectionIndex = findSectionIndexForPage(selectedDocument, nextPageIndex);
          if (matchingSectionIndex >= 0) {
            setCurrentDocumentSection(selectedDocument, matchingSectionIndex);
          }
          renderReader();
        } else {
          selectAdjacentDocument(1);
        }
        return;
      }

      if (action === "listen" && selectedDocument) {
        toggleListen(selectedDocument);
        return;
      }

      if (action === "ask" && selectedDocument) {
        state.askDocumentId = selectedDocument.id;
        elements.askInput.value = "";
        renderAskContext();
        elements.askResponse.textContent = "Ask a question about the selected document.";
        focusAskComposer();
      }
    });
  });
}

function stopListening() {
  currentListenSessionId += 1;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudioPlayback) {
    currentAudioPlayback.onended = null;
    currentAudioPlayback.onerror = null;
    currentAudioPlayback.pause();
    currentAudioPlayback.src = "";
    currentAudioPlayback = null;
  }
  if (currentAudioObjectUrl) {
    URL.revokeObjectURL(currentAudioObjectUrl);
    currentAudioObjectUrl = "";
  }
  if (state.listeningDocumentId) {
    state.listeningDocumentId = null;
  }
  if (state.askResponseSpeaking) {
    state.askResponseSpeaking = false;
  }
  if (state.activeReaderSegmentIndex !== -1 || state.activeReaderSectionId) {
    state.activeReaderSegmentIndex = -1;
    state.activeReaderSectionId = "";
  }
  currentAudioContext = "";
  renderAskVoiceControls();
}

function toggleListen(documentRecord) {
  if (state.listeningDocumentId === documentRecord.id) {
    stopListening();
    renderDocuments();
    return;
  }

  speakDocument(documentRecord);
}

function deleteDocument(documentId) {
  const subject = getSelectedSubject();
  const documentRecord = subject?.documents.find((document) => document.id === documentId);
  if (!documentRecord) {
    return;
  }

  const confirmed = window.confirm(`Delete "${documentRecord.title}"?`);
  if (!confirmed) {
    return;
  }

  deleteDocuments([documentId]);
}

function deleteHomeworkBundle(bundleId) {
  const subject = getSelectedSubject();
  const bundle = getSubjectHomeworkBundles(subject).find((entry) => entry.id === bundleId);
  if (!bundle) {
    return;
  }

  const confirmed = window.confirm(`Delete homework "${bundle.title}"?`);
  if (!confirmed) {
    return;
  }

  deleteDocuments(bundle.documents.map((documentRecord) => documentRecord.id));
}

function deleteDocuments(documentIds) {
  const subject = getSelectedSubject();
  const uniqueDocumentIds = [...new Set(documentIds)];
  if (!subject || !uniqueDocumentIds.length) {
    return;
  }
  const documentRecordsToDelete = subject.documents.filter((documentRecord) => uniqueDocumentIds.includes(documentRecord.id));

  if (uniqueDocumentIds.includes(state.listeningDocumentId)) {
    stopListening();
  }

  subject.documents = subject.documents.filter((doc) => !uniqueDocumentIds.includes(doc.id));
  subject.assessments.forEach((assessment) => {
    assessment.linkedDocumentIds = assessment.linkedDocumentIds.filter((id) => !uniqueDocumentIds.includes(id));
  });
  subject.assessments = subject.assessments.filter((assessment) => assessment.linkedDocumentIds.length || !assessment.autoCreated);
  state.selectedDocumentIds = state.selectedDocumentIds.filter((documentId) => !uniqueDocumentIds.includes(documentId));
  if (uniqueDocumentIds.includes(state.selectedDocumentId)) {
    state.selectedDocumentId = getVisibleSubjectDocuments(subject)[0]?.id || null;
  }
  if (uniqueDocumentIds.includes(state.askDocumentId)) {
    state.askDocumentId = getVisibleSubjectDocuments(subject)[0]?.id || null;
  }
  syncAutoWatchForSubject(subject);
  persistSubjects();
  deletePreviewRecords(uniqueDocumentIds, documentRecordsToDelete).catch((error) => {
    console.error("Preview images could not be removed.", error);
  });
  render();
}

function getAssessmentActionsMarkup(assessmentId, isCompleted) {
  return `
    <div class="assessment-actions">
      <button type="button" class="assessment-action" data-assessment-action="attach" data-assessment-id="${assessmentId}">Attach notes</button>
      <button type="button" class="assessment-action" data-assessment-action="edit" data-assessment-id="${assessmentId}">Edit</button>
      <button type="button" class="assessment-action assessment-action--danger" data-assessment-action="delete" data-assessment-id="${assessmentId}">Delete</button>
      ${
        isCompleted
          ? ""
          : `<button type="button" class="assessment-action assessment-complete" data-assessment-action="complete" data-assessment-id="${assessmentId}">Complete</button>`
      }
    </div>
  `;
}

function attachAssessmentActionHandlers(container, subject) {
  container.querySelectorAll("[data-assessment-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const assessmentId = button.dataset.assessmentId;
      if (!assessmentId) {
        return;
      }

      if (button.dataset.assessmentAction === "attach") {
        openAttachNotesModal({ kind: "assessment", subjectId: subject.id, assessmentId });
      }

      if (button.dataset.assessmentAction === "edit") {
        editAssessment(subject.id, assessmentId);
      }

      if (button.dataset.assessmentAction === "delete") {
        deleteAssessment(subject.id, assessmentId);
      }

      if (button.dataset.assessmentAction === "complete") {
        completeAssessment(subject.id, assessmentId);
      }
    });
  });
}

function openAttachNotesModal(target) {
  state.activeAttachmentTarget = target;
  state.attachmentModalOpen = true;
  elements.attachNotesModal.classList.remove("hidden");
  elements.attachNotesModal.setAttribute("aria-hidden", "false");
  renderAttachNotesModal();
}

function closeAttachNotesModal() {
  state.attachmentModalOpen = false;
  state.activeAttachmentTarget = null;
  state.expandedAttachmentGroups = {};
  elements.attachNotesModal.classList.add("hidden");
  elements.attachNotesModal.setAttribute("aria-hidden", "true");
}

function renderAttachNotesModal() {
  const context = state.activeAttachmentTarget;
  if (!context) {
    elements.attachNotesList.innerHTML = `<div class="empty-state">Select a task first.</div>`;
    return;
  }

  const subject = state.subjects.find((item) => item.id === context.subjectId);
  if (!subject) {
    elements.attachNotesList.innerHTML = `<div class="empty-state">This task is no longer available.</div>`;
    return;
  }

  let attachedDocumentIds = [];
  let summaryLabel = "";
  let excludedGroupId = "";

  if (context.kind === "assessment") {
    const assessment = subject.assessments.find((item) => item.id === context.assessmentId);
    if (!assessment) {
      elements.attachNotesList.innerHTML = `<div class="empty-state">This assessment is no longer available.</div>`;
      return;
    }
    attachedDocumentIds = assessment.linkedDocumentIds || [];
    const bundleCount = getLinkedDocumentBundles(subject, attachedDocumentIds).length;
    summaryLabel = `${assessment.componentTask || assessment.title} · ${bundleCount} document${bundleCount === 1 ? "" : "s"} attached`;
  } else if (context.kind === "homework") {
    const homeworkBundle = findHomeworkBundle(subject, context.bundleId);
    if (!homeworkBundle) {
      elements.attachNotesList.innerHTML = `<div class="empty-state">This homework task is no longer available.</div>`;
      return;
    }
    attachedDocumentIds = getBundleStoredLinkedDocumentIds(homeworkBundle);
    const bundleCount = getLinkedDocumentBundles(subject, attachedDocumentIds).filter((bundle) => bundle.id !== homeworkBundle.id).length;
    summaryLabel = `${homeworkBundle.title} · ${bundleCount} document${bundleCount === 1 ? "" : "s"} attached`;
    excludedGroupId = homeworkBundle.id;
  } else {
    elements.attachNotesList.innerHTML = `<div class="empty-state">This task type is not supported yet.</div>`;
    return;
  }

  elements.attachNotesSummary.textContent = summaryLabel;

  if (!subject.documents.length) {
    elements.attachNotesList.innerHTML = `<div class="empty-state">Upload documents to this subject before attaching notes.</div>`;
    return;
  }

  const groups = getDocumentGroups(subject).filter((group) => group.id !== excludedGroupId);
  if (!groups.length) {
    elements.attachNotesList.innerHTML = `<div class="empty-state">No other documents are available to attach yet.</div>`;
    return;
  }
  elements.attachNotesList.innerHTML = groups
    .map((group) => {
      const groupDocumentIds = group.documents.map((documentRecord) => documentRecord.id);
      const isSelected = groupDocumentIds.every((documentId) => attachedDocumentIds.includes(documentId));
      const previewDocument = group.documents[0];
      return `
        <section class="attach-notes-group">
          <article class="attach-notes-page">
            ${
              previewDocument?.previewImageUrl
                ? `<img class="attach-notes-page__preview" src="${escapeHtml(previewDocument.previewImageUrl)}" alt="${escapeHtml(previewDocument.title)} preview" />`
                : `<div class="empty-state">No preview available</div>`
            }
            <div class="attach-notes-page__body">
              <label class="attach-notes-page__select">
                <input type="checkbox" data-attach-group-id="${group.id}" ${isSelected ? "checked" : ""} />
                <span>${escapeHtml(group.title)}</span>
              </label>
              <div class="attach-notes-page__meta">
                ${escapeHtml(group.type)} · ${getBundlePageCount(group)} ${getBundlePageCount(group) === 1 ? "page" : "pages"} · Added ${escapeHtml(group.added)}
              </div>
            </div>
          </article>
        </section>
      `;
    })
    .join("");

  elements.attachNotesList.querySelectorAll("[data-attach-group-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const groupId = event.target.dataset.attachGroupId;
      if (!groupId) {
        return;
      }
      const selectedGroup = groups.find((group) => group.id === groupId);
      if (!selectedGroup) {
        return;
      }
      const selectedGroupIds = selectedGroup.documents.map((documentRecord) => documentRecord.id);
      let nextIds = [...attachedDocumentIds];
      if (event.target.checked) {
        nextIds = [...new Set([...nextIds, ...selectedGroupIds])];
      } else {
        const removeSet = new Set(selectedGroupIds);
        nextIds = nextIds.filter((id) => !removeSet.has(id));
      }

      if (context.kind === "assessment") {
        const assessment = subject.assessments.find((item) => item.id === context.assessmentId);
        if (!assessment) {
          return;
        }
        assessment.linkedDocumentIds = nextIds;
      } else if (context.kind === "homework") {
        const homeworkBundle = findHomeworkBundle(subject, context.bundleId);
        if (!homeworkBundle) {
          return;
        }
        setBundleStoredLinkedDocumentIds(homeworkBundle, nextIds);
      }
      persistSubjects();
      renderAssessments();
      renderPractice();
      renderUpcomingModal();
      if (state.activeTask) {
        renderTaskView();
      }
      renderAttachNotesModal();
    });
  });
}

function attachUpcomingAssessmentHandlers() {
  elements.upcomingModalList.querySelectorAll("[data-upcoming-subject-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const subject = state.subjects.find((item) => item.id === button.dataset.upcomingSubjectId);
      if (!subject) {
        return;
      }

      state.selectedSubjectId = subject.id;

      if (button.dataset.upcomingAction === "open") {
        closeUpcomingModal();
        openTaskView({ kind: "assessment", id: button.dataset.assessmentId });
        return;
      }

      if (button.dataset.upcomingAction === "edit") {
        editAssessment(subject.id, button.dataset.assessmentId);
      }

      if (button.dataset.upcomingAction === "delete") {
        deleteAssessment(subject.id, button.dataset.assessmentId);
      }

      if (button.dataset.upcomingAction === "complete") {
        completeAssessment(subject.id, button.dataset.assessmentId);
      }
    });
  });
}

function openEditAssessmentModal(subjectId, assessmentId) {
  const subject = state.subjects.find((item) => item.id === subjectId);
  const assessment = subject?.assessments.find((item) => item.id === assessmentId);
  if (!subject || !assessment) {
    return;
  }

  state.activeEditAssessment = { subjectId, assessmentId };
  state.editAssessmentModalOpen = true;
  elements.editAssessmentName.value = assessment.componentTask || assessment.title || "";
  elements.editAssessmentTaskNumber.value = assessment.taskNumber || "";
  elements.editAssessmentWeighting.value = assessment.weighting || "";
  elements.editAssessmentDistributionDate.value = assessment.distributionDate || "";
  elements.editAssessmentDueDate.value = assessment.dueDate || "";
  elements.editAssessmentStatus.textContent = "";
  elements.editAssessmentModal.classList.remove("hidden");
  elements.editAssessmentModal.setAttribute("aria-hidden", "false");
}

function closeEditAssessmentModal() {
  state.editAssessmentModalOpen = false;
  state.activeEditAssessment = null;
  elements.editAssessmentModal.classList.add("hidden");
  elements.editAssessmentModal.setAttribute("aria-hidden", "true");
  elements.editAssessmentStatus.textContent = "";
}

function editAssessment(subjectId, assessmentId) {
  openEditAssessmentModal(subjectId, assessmentId);
}

function saveEditedAssessment() {
  const activeEditAssessment = state.activeEditAssessment;
  if (!activeEditAssessment) {
    return;
  }

  const subject = state.subjects.find((item) => item.id === activeEditAssessment.subjectId);
  const assessment = subject?.assessments.find((item) => item.id === activeEditAssessment.assessmentId);
  if (!subject || !assessment) {
    return;
  }

  const updatedTitle = elements.editAssessmentName.value.trim();
  if (!updatedTitle) {
    elements.editAssessmentStatus.textContent = "Enter an assessment name.";
    return;
  }

  assessment.title = updatedTitle;
  assessment.componentTask = updatedTitle;
  assessment.taskNumber = elements.editAssessmentTaskNumber.value.trim();
  assessment.distributionDate = elements.editAssessmentDistributionDate.value.trim();
  assessment.dueDate = elements.editAssessmentDueDate.value.trim();
  assessment.weighting = elements.editAssessmentWeighting.value.trim();
  assessment.description = `${assessment.componentTask || assessment.title}.`;
  persistSubjects();
  closeEditAssessmentModal();
  render();
}

function deleteAssessment(subjectId, assessmentId) {
  const subject = state.subjects.find((item) => item.id === subjectId);
  if (!subject) {
    return;
  }

  const assessment = subject.assessments.find((item) => item.id === assessmentId);
  if (!assessment) {
    return;
  }

  const confirmed = window.confirm(`Delete "${assessment.componentTask || assessment.title}"?`);
  if (!confirmed) {
    return;
  }

  subject.assessments = subject.assessments.filter((item) => item.id !== assessmentId);
  persistSubjects();
  render();
}

function completeAssessment(subjectId, assessmentId) {
  const subject = state.subjects.find((item) => item.id === subjectId);
  const assessment = subject?.assessments.find((item) => item.id === assessmentId);
  if (!subject || !assessment) {
    return;
  }

  assessment.completed = true;
  persistSubjects();
  render();
}

function openDocumentPopup(documentRecord) {
  const popup = window.open("", "_blank", "popup,width=920,height=760");
  if (!popup) {
    window.alert("Allow popups to open the attached document preview.");
    return;
  }

  const groupedDocuments = Array.isArray(documentRecord.documents) ? documentRecord.documents : [documentRecord];
  const previewMarkup = groupedDocuments
    .map((documentItem) =>
      documentItem.previewImageUrl
        ? `<img src="${escapeHtml(documentItem.previewImageUrl)}" alt="${escapeHtml(documentItem.title)} preview" style="max-width:100%;height:auto;border:1px solid #d9d6d2;border-radius:18px;display:block;margin:0 0 20px;" />`
        : ""
    )
    .join("");
  const contentMarkup = documentRecord.content
    ? `<div style="white-space:pre-wrap;line-height:1.6;color:#222;">${escapeHtml(documentRecord.content)}</div>`
    : `<p style="color:#666;line-height:1.6;">Preview text is not available for this file yet.</p>`;
  const originalMarkup = documentRecord.originalFile?.objectUrl
    ? `<p style="margin-top:20px;"><a href="${escapeHtml(documentRecord.originalFile.objectUrl)}" target="_blank" rel="noopener" style="color:#111;">Open original file</a></p>`
    : "";

  popup.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(documentRecord.title)}</title>
      </head>
      <body style="margin:0;background:#fff;color:#111;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <main style="max-width:860px;margin:0 auto;padding:28px;">
          <p style="margin:0 0 8px;color:#6c655d;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;">Attached document</p>
          <h1 style="margin:0 0 22px;font-size:30px;font-weight:400;text-transform:uppercase;letter-spacing:-0.04em;">${escapeHtml(documentRecord.title)}</h1>
          ${previewMarkup}
          ${contentMarkup}
          ${originalMarkup}
        </main>
      </body>
    </html>`);
  popup.document.close();
}

function openTaskView(taskConfig) {
  state.activeTask = taskConfig;
  state.currentView = "task";
  state.taskAskResponse = "";
  state.taskAskStatus = "";
  elements.taskWorkStatus.textContent = "";
  renderTaskView();
  renderCurrentView();
  window.requestAnimationFrame(() => {
    elements.taskView.scrollIntoView({ block: "start", inline: "nearest" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

function getTaskWorkEditor() {
  return document.getElementById("task-work-editor");
}

function getTaskRecord(taskKind, taskId, subject = getSelectedSubject()) {
  if (!subject || !taskKind || !taskId) {
    return null;
  }
  if (taskKind === "assessment") {
    return subject.assessments.find((item) => item.id === taskId) || null;
  }
  if (taskKind === "homework") {
    return findHomeworkBundle(subject, taskId) || null;
  }
  return null;
}

function getTaskWorkspace(taskKind, taskRecord) {
  if (!taskRecord) {
    return null;
  }
  return taskKind === "assessment" ? getAssessmentExternalWorkspace(taskRecord) : getHomeworkExternalWorkspace(taskRecord);
}

function setTaskWorkspace(taskKind, taskRecord, workspace) {
  if (!taskRecord) {
    return;
  }
  if (taskKind === "assessment") {
    setAssessmentExternalWorkspace(taskRecord, workspace);
  } else {
    setHomeworkExternalWorkspace(taskRecord, workspace);
  }
}

function getTaskCachedEditorText(taskKind, taskRecord) {
  if (!taskRecord) {
    return "";
  }
  if (taskKind === "assessment") {
    return String(taskRecord.workNotes || "");
  }
  return String(getBundleWorkNotes(taskRecord) || "");
}

function setTaskCachedEditorText(taskKind, taskRecord, value) {
  if (!taskRecord) {
    return;
  }
  if (taskKind === "assessment") {
    taskRecord.workNotes = String(value || "");
    return;
  }
  setBundleWorkNotes(taskRecord, String(value || ""));
}

function getTaskDisplayTitle(taskKind, taskRecord) {
  if (!taskRecord) {
    return "this task";
  }
  if (taskKind === "assessment") {
    return taskRecord.componentTask || taskRecord.title || "this task";
  }
  return taskRecord.title || "this task";
}

function createTaskWorkspaceMarkup(workspace, taskTitle = "") {
  const selectedProvider = getTaskWorkspaceProvider(workspace?.provider) || null;
  const selectedProviderId = selectedProvider?.id || "";
  const googleDocsConnected = isConnectedGoogleDocsWorkspace(workspace);
  const providerButtons = TASK_WORKSPACE_PROVIDERS
    .map(
      (provider) => `
        <button
          type="button"
          class="task-workspace-provider${provider.id === selectedProviderId ? " task-workspace-provider--active" : ""}"
          data-task-workspace-provider="${provider.id}"
        >
          ${escapeHtml(provider.shortLabel)}
        </button>
      `
    )
    .join("");

  const docsStatusText = !GOOGLE_CLIENT_ID
    ? "Google Docs needs a frontend OAuth client ID before this connected editor can sign in."
    : googleDocsConnected
      ? `Connected to ${workspace.documentTitle || "Google Doc"} for ${taskTitle || "this task"}. The editor below saves back to that document.`
      : "Choose Google Docs to turn the editor below into a connected document.";
  const docsActionsMarkup = `
    <div class="task-workspace-actions">
      <button
        type="button"
        class="primary-button"
        data-google-docs-create
      >
        Create Google Doc
      </button>
      <button type="button" class="ghost-button" data-task-workspace-open ${googleDocsConnected ? "" : "disabled"}>
        Open Google Doc
      </button>
      <button type="button" class="ghost-button" data-google-docs-pull ${googleDocsConnected ? "" : "disabled"}>
        Pull latest
      </button>
    </div>
    <label class="upload-field task-workspace-field">
      <span class="upload-field__label">Google Doc link</span>
      <input
        type="url"
        id="task-workspace-url-input"
        placeholder="Paste a Google Doc share link"
        value="${escapeHtml(workspace?.url || "")}"
      />
    </label>
    <div class="task-workspace-actions">
      <button
        type="button"
        class="primary-button primary-button--dark"
        data-google-docs-connect
      >
        Connect Google Doc
      </button>
      <button type="button" class="ghost-button" data-task-workspace-clear ${workspace ? "" : "disabled"}>Disconnect</button>
    </div>
    <div class="task-workspace-card__status">${escapeHtml(docsStatusText)}</div>
  `;

  const unsupportedProviderMarkup = selectedProvider
    ? `
      <div class="task-workspace-card__status">
        ${escapeHtml(`${selectedProvider.label} will need its own editor surface in this pane. Google Docs is connected first in the current build.`)}
      </div>
    `
    : '<div class="task-workspace-card__status">Choose the app you want to use for this task.</div>';

  return `
    <section class="task-workspace-card">
      <div class="section-heading section-heading--stacked section-heading--compact">
        <div>
          <p class="eyebrow">Connected workspace</p>
          <h3>Choose the editor for this task</h3>
        </div>
      </div>
      <p class="helper-text task-workspace-card__help">Keep the checklist above in PaperPanda and switch the lower pane by provider.</p>
      <div class="task-workspace-provider-row">${providerButtons}</div>
      ${selectedProviderId === "google-docs" ? docsActionsMarkup : unsupportedProviderMarkup}
    </section>
  `;
}

function getDaysUntilText(dateString) {
  const parsed = parseAssessmentDate(dateString);
  if (!parsed) {
    return "Due soon";
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysUntil = Math.max(0, Math.ceil((parsed.getTime() - now.getTime()) / 86400000));
  const weekday = new Intl.DateTimeFormat("en-AU", { weekday: "short" }).format(parsed).toUpperCase();
  return daysUntil === 0 ? `DUE ${weekday} · TODAY` : `DUE ${weekday} · ${daysUntil} ${daysUntil === 1 ? "DAY" : "DAYS"}`;
}

function estimateTaskMinutes(text) {
  const wordCount = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!wordCount) {
    return 15;
  }
  return Math.max(10, Math.min(45, Math.round(wordCount / 20)));
}

function buildHomeworkTaskSteps(homeworkBundle) {
  const baseTitle = getBaseDocumentTitle(homeworkBundle) || homeworkBundle.title;
  const storedSteps = getBundleStoredTaskSteps(homeworkBundle);
  const lines = storedSteps.length
    ? storedSteps
    : [
        `Listen to ${baseTitle} (Panda reads aloud)`,
        "Underline one keyword per section as you go",
        "Write one clear sentence describing each key idea",
        "Check your workbook answer and mark it complete"
      ];
  const stepState = getBundleStoredStepState(homeworkBundle);
  const firstIncompleteIndex = stepState.findIndex((done) => !done);
  const activeIndex = firstIncompleteIndex === -1 ? Math.max(0, lines.length - 1) : firstIncompleteIndex;
  return lines.map((label, index) => ({
    number: index + 1,
    label,
    done: Boolean(stepState[index]),
    active: index === activeIndex
  }));
}

function buildAssessmentTaskStages(assessment, linkedDocumentBundles) {
  const workLength = String(assessment?.workNotes || "").trim().length;
  const linkedTitles = linkedDocumentBundles.slice(0, 2).map((bundle) => bundle.title);
  const revisionEntry = state.revisionCatalogue.find((entry) => entry.subjectId === state.selectedSubjectId);
  const topicHints = Array.isArray(revisionEntry?.topics) ? revisionEntry.topics.slice(0, 3) : [];
  const fallbackDefinitions = buildSpecificAssessmentStages(assessment, linkedTitles, topicHints, workLength);
  const storedStages = Array.isArray(assessment.aiTaskStages)
    ? assessment.aiTaskStages.filter((stage) => stage?.title && Array.isArray(stage.items) && stage.items.length)
    : [];
  const stageDefinitions = storedStages.length
    ? storedStages.map((stage) => ({
        title: stage.title,
        items: stage.items,
        doneCount: 0
      }))
    : fallbackDefinitions;

  const stageState = getAssessmentStoredStageState(assessment);
  const firstIncompleteStageIndex = stageDefinitions.findIndex((stage, stageIndex) => {
    const currentStageState = Array.isArray(stageState[stageIndex]) ? stageState[stageIndex] : [];
    return currentStageState.filter(Boolean).length < stage.items.length;
  });

  return stageDefinitions.map((stage, stageIndex) => {
    const currentStageState = Array.isArray(stageState[stageIndex]) ? stageState[stageIndex] : [];
    const itemState = assessment.completed
      ? Array.from({ length: stage.items.length }, () => true)
      : Array.from({ length: stage.items.length }, (_, itemIndex) => Boolean(currentStageState[itemIndex]));
    const doneCount = itemState.filter(Boolean).length;
    const nextActionIndex = itemState.findIndex((done) => !done);
    return {
      number: stageIndex + 1,
      title: stage.title,
      items: stage.items,
      itemState,
      doneCount,
      nextActionIndex,
      active: stageIndex === (firstIncompleteStageIndex === -1 ? stageDefinitions.length - 1 : firstIncompleteStageIndex)
    };
  });
}

function buildSpecificAssessmentStages(assessment, linkedTitles = [], topicHints = [], workLength = 0) {
  const isLikelyTest = /(?:^|\b)(test|exam|quiz|semester test|topic test)\b/i.test(
    `${assessment.componentTask || ""} ${assessment.title || ""} ${assessment.description || ""}`
  );
  const directiveClues = linkedTitles.filter((title) => /^(Choose|View|Plan|Decide|Review)\b/i.test(String(title || "")));
  const noteTitles = linkedTitles.filter((title) => !directiveClues.includes(title));
  const topicsLabel = topicHints.length
    ? `Review these topics: ${topicHints.join(", ")}`
    : `List the exact topics covered in ${assessment.componentTask || assessment.title}`;
  const firstNote = noteTitles[0] ? `Read ${noteTitles[0]} and highlight the formulas or key points that match the task` : "Read the attached notes and mark the most important ideas";
  const secondNote = noteTitles[1] ? `Use ${noteTitles[1]} for practice questions or worked examples` : "Complete 3 short practice questions that match the task";

  if (!isLikelyTest) {
    return [
      {
        title: "Understand the task",
        items: [
          `Read the assessment sheet for ${assessment.componentTask || assessment.title}`,
          directiveClues[0] || "Highlight the exact product you need to submit and any required sections or components",
          assessment.weighting ? `Note the weighting, due date, and conditions (${assessment.weighting})` : "Note the due date and any submission conditions"
        ],
        doneCount: workLength > 40 ? 2 : workLength > 10 ? 1 : 0
      },
      {
        title: "Plan",
        items: [
          noteTitles[0] ? `Use ${noteTitles[0]} to identify the key ideas, evidence, or examples you need` : "List the key ideas, evidence, or examples you need to include",
          directiveClues[1] || (topicHints.length ? `Plan where these ideas or topics will appear: ${topicHints.slice(0, 4).join(", ")}` : "Plan the required sections in the order you will complete them"),
          "Decide what your final structure or layout will look like before you start drafting"
        ],
        doneCount: noteTitles.length || directiveClues.length ? (workLength > 120 ? 2 : 1) : 0
      },
      {
        title: "Draft",
        items: [
          "Draft each required section one at a time",
          "Check that each section connects back to the task sheet and uses the right style or format",
          directiveClues[2] || "Choose how you will produce the final version and tidy the presentation"
        ],
        doneCount: workLength > 180 ? 1 : 0
      },
      {
        title: "Final check",
        items: [
          directiveClues[3] || "Read through the whole task once more and check that every required part is included",
          "Fix any missing details, spelling, layout, or submission issues before handing it in"
        ],
        doneCount: assessment.completed ? 2 : 0
      }
    ];
  }

  return [
    {
      title: "Preparation",
      items: [
        `Read the task sheet for ${assessment.componentTask || assessment.title}`,
        assessment.weighting ? `Note the weighting and due date (${assessment.weighting})` : "Note the due date and assessment conditions",
        topicsLabel
      ],
      doneCount: workLength > 40 ? 2 : workLength > 10 ? 1 : 0
    },
    {
      title: "Practice",
      items: [
        firstNote,
        secondNote,
        topicHints.length ? `Practise at least one question from: ${topicHints.slice(0, 3).join(", ")}` : "Write down the areas that still feel uncertain"
      ],
      doneCount: linkedTitles.length ? (workLength > 120 ? 2 : 1) : 0
    },
    {
      title: "Test day",
      items: [
        "Pack the equipment you need and check the test conditions",
        "Read every question carefully and underline the key instruction words",
        "Start with the question you feel most confident answering"
      ],
      doneCount: assessment.completed ? 3 : 0
    },
    {
      title: "Review",
      items: [
        assessment.completed
          ? `Review the completed assessment from ${formatAssessmentDueLabel(assessment.dueDate)}`
          : "After the task, check which questions were hardest and note what to revisit"
      ],
      doneCount: assessment.completed ? 1 : 0
    }
  ];
}

function parseChecklistLines(answer, { max = 4 } = {}) {
  return String(answer || "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((line) => line && !/^panda\b/i.test(line) && !/^sure\b/i.test(line))
    .slice(0, max);
}

function splitAssessmentStageItems(value) {
  return String(value || "")
    .split(/\s*(?:;|•|\n|(?:\.\s+(?=[A-Z]))|(?:,\s+(?=(?:review|read|practi|use|list|solve|complete|check|bring|arrive|underline|pack|mark|revise|write|gather|create)\b)))/i)
    .map((item) => item.replace(/^[\s:–-]+|[.]+$/g, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

function parseAssessmentStages(answer) {
  const stageTitleFallbacks = ["Preparation", "Practice", "Test day", "Review"];
  const text = String(answer || "").trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const normalised = Array.isArray(parsed)
        ? parsed
            .map((stage, index) => ({
              title: String(stage?.title || stageTitleFallbacks[index] || "").trim(),
              items: Array.isArray(stage?.items)
                ? stage.items.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4)
                : []
            }))
            .filter((stage) => stage.title && stage.items.length)
        : [];
      if (normalised.length) {
        return normalised.slice(0, 4);
      }
    } catch (error) {
      console.warn("Assessment stages JSON parse failed.", error);
    }
  }

  const cleaned = text
    .replace(/\*\*/g, "")
    .replace(/^sure!?\s*/i, "")
    .trim();
  const firstStageIndex = cleaned.search(/stage\s*1\s*:/i);
  const stageOnlyText = firstStageIndex >= 0 ? cleaned.slice(firstStageIndex) : cleaned;
  const stagePattern = /stage\s*(\d+)\s*:\s*([A-Za-z][A-Za-z ]+?)\s*:\s*([\s\S]*?)(?=(?:\s*stage\s*\d+\s*:)|$)/gi;
  const stages = [];
  let match;

  while ((match = stagePattern.exec(stageOnlyText)) !== null && stages.length < 4) {
    const stageNumber = Number(match[1]);
    const rawTitle = String(match[2] || "").replace(/[*:]+/g, "").trim();
    const title = !rawTitle || /^stage\s*\d+$/i.test(rawTitle)
      ? stageTitleFallbacks[stageNumber - 1] || stageTitleFallbacks[stages.length]
      : rawTitle;
    const body = String(match[3] || "")
      .replace(/^[-:–\s]+/, "")
      .replace(/\*\*/g, "")
      .trim();
    const items = splitAssessmentStageItems(body);
    if (title && items.length) {
      stages.push({ title, items });
    }
  }

  return stages;
}

function hasUsableAssessmentStages(stages) {
  return Array.isArray(stages) && stages.length === 4 && stages.every((stage) => {
    if (!stage?.title || !Array.isArray(stage.items) || !stage.items.length) {
      return false;
    }
    if (/^stage\s*\d+$/i.test(String(stage.title).trim())) {
      return false;
    }
    return stage.items.every((item) => item && !/^sure\b/i.test(String(item).trim()));
  });
}

function toggleHomeworkStep(bundleId, stepIndex) {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }
  const homeworkBundle = findHomeworkBundle(subject, bundleId);
  if (!homeworkBundle) {
    return;
  }
  const steps = buildHomeworkTaskSteps(homeworkBundle);
  const nextState = Array.from({ length: steps.length }, (_, index) => Boolean(getBundleStoredStepState(homeworkBundle)[index]));
  nextState[stepIndex] = !nextState[stepIndex];
  setBundleStoredStepState(homeworkBundle, nextState);
  persistSubjects();
  if (state.activeTask?.kind === "homework" && state.activeTask.id === bundleId) {
    renderTaskView();
  }
  renderPractice();
}

function toggleAssessmentStageItem(assessmentId, stageIndex, itemIndex) {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }
  const assessment = subject.assessments.find((item) => item.id === assessmentId);
  if (!assessment) {
    return;
  }
  const stages = buildAssessmentTaskStages(assessment, getLinkedDocumentBundles(subject, assessment.linkedDocumentIds));
  const nextState = Array.from({ length: stages.length }, (_, sIndex) => {
    const stageItems = stages[sIndex]?.items || [];
    const current = Array.isArray(getAssessmentStoredStageState(assessment)[sIndex]) ? getAssessmentStoredStageState(assessment)[sIndex] : [];
    return Array.from({ length: stageItems.length }, (_, iIndex) => Boolean(current[iIndex]));
  });
  nextState[stageIndex][itemIndex] = !nextState[stageIndex][itemIndex];
  setAssessmentStoredStageState(assessment, nextState);
  persistSubjects();
  renderAssessments();
  renderTaskView();
}

async function openRevisionTestFromTask(config) {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }
  await loadRevisionCatalogue();
  const revisionEntry = state.revisionCatalogue.find((entry) => entry.subjectId === subject.id);
  let noteBundles = [];
  let textTitle = "";
  let topic = "";
  if (config.taskKind === "assessment") {
    const assessment = subject.assessments.find((item) => item.id === config.taskId);
    if (!assessment) {
      return;
    }
    noteBundles = getLinkedDocumentBundles(subject, assessment.linkedDocumentIds);
    textTitle = assessment.componentTask || assessment.title || "";
    topic = revisionEntry?.topics?.find((entry) =>
      textTitle.toLowerCase().includes(String(entry).toLowerCase())
    ) || revisionEntry?.topics?.[0] || textTitle;
  } else {
    const homeworkBundle = findHomeworkBundle(subject, config.taskId);
    if (!homeworkBundle) {
      return;
    }
    const linkedIds = new Set([
      ...getBundleStoredLinkedDocumentIds(homeworkBundle),
      ...homeworkBundle.documents.map((documentRecord) => documentRecord.id)
    ]);
    noteBundles = getAllDocumentBundles(subject).filter((bundle) =>
      bundle.documents.some((documentRecord) => linkedIds.has(documentRecord.id))
    );
    textTitle = homeworkBundle.title || "";
    topic = revisionEntry?.topics?.find((entry) =>
      textTitle.toLowerCase().includes(String(entry).toLowerCase())
    ) || revisionEntry?.topics?.[0] || textTitle;
  }

  await generateRevisionTest({
    subjectId: subject.id,
    topic,
    textTitle,
    noteBundles
  });
}

function extractAssessmentSpecificClues(sourceText, topicHints = []) {
  const text = String(sourceText || "");
  const clues = [];

  const pushClue = (value) => {
    const nextValue = String(value || "").replace(/\s+/g, " ").trim();
    if (nextValue && !clues.includes(nextValue)) {
      clues.push(nextValue);
    }
  };

  if (/\bchoose (?:a|the) play\b/i.test(text)) {
    pushClue("Choose the play you want to focus on");
  }
  if (/\bview (?:a|the) production\b|\bwatch (?:a|the) production\b/i.test(text)) {
    pushClue("View a production of the chosen play and take notes on important moments");
  }

  const sectionTerms = [
    "newspaper title",
    "front page news",
    "additional news report",
    "obituaries",
    "advertisements",
    "editorial",
    "review",
    "headline"
  ].filter((term) => new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i").test(text));
  if (sectionTerms.length) {
    pushClue(`Plan these required sections: ${sectionTerms.join(", ")}`);
  }

  if (/\bdigital\b|\bhard copy\b|\bhandwritten\b/i.test(text)) {
    pushClue("Decide whether the final piece will be digital or hard copy and match the required format");
  }

  if (topicHints.length) {
    pushClue(`Review these topics: ${topicHints.slice(0, 5).join(", ")}`);
  }

  return clues;
}

async function simplifyHomeworkBundle(homeworkBundle, subject) {
  const prompt = [
    "Break this homework into exactly 4 checkbox steps.",
    "Return only 4 lines, one step per line, with no intro or explanation.",
    `Homework title: ${homeworkBundle.title}`,
    clipText(homeworkBundle.content || "", 1800)
  ].filter(Boolean).join("\n\n");
  const answer = await requestAskAnswer(prompt, subject, {
    title: homeworkBundle.title,
    type: "Homework",
    content: [homeworkBundle.content || "", getBundleWorkNotes(homeworkBundle) || ""].filter(Boolean).join("\n\n")
  });
  const nextSteps = parseChecklistLines(answer, { max: 4 });
  if (nextSteps.length) {
    setBundleStoredTaskSteps(homeworkBundle, nextSteps);
    persistSubjects();
  }
  state.taskAskResponse = answer;
  state.taskAskStatus = "";
  renderPractice();
  if (state.activeTask?.kind === "homework" && state.activeTask.id === homeworkBundle.id) {
    renderTaskView();
  } else {
    renderDockContext();
  }
}

async function simplifyAssessmentTask(assessment, subject) {
  const linkedDocumentBundles = getLinkedDocumentBundles(subject, assessment.linkedDocumentIds);
  const revisionEntry = state.revisionCatalogue.find((entry) => entry.subjectId === subject.id);
  const topicHints = Array.isArray(revisionEntry?.topics) ? revisionEntry.topics.slice(0, 6) : [];
  const linkedBundleContent = linkedDocumentBundles
    .slice(0, 3)
    .map((bundle) => `${bundle.title}\n${clipText(bundle.content || "", 2200)}`);
  const sourceText = [
    assessment.description || "",
    `Task: ${assessment.componentTask || assessment.title}`,
    `Subject: ${subject.name}`,
    ...linkedBundleContent
  ].filter(Boolean).join("\n\n");
  const isLikelyTest = /(?:^|\b)(test|exam|quiz|semester test|topic test)\b/i.test(
    `${assessment.componentTask || ""} ${assessment.title || ""} ${assessment.description || ""}`
  );
  const preferredTitles = isLikelyTest
    ? ["Preparation", "Practice", "Test day", "Review"]
    : ["Understand the task", "Plan", "Draft", "Final check"];
  const prompt = [
    "Break this assessment into exactly 4 named stages for a student checklist.",
    `Use these exact stage titles in order: ${preferredTitles.join(", ")}.`,
    "Read the actual assessment notification and attached notes carefully before writing the checklist.",
    "Make the checklist items specific to the actual task, deliverables, format, and subject content, not generic study advice.",
    "If the task is a project or assignment, turn the real required components into steps.",
    "If the task is a test or exam, include the actual topics to review by name where possible.",
    "Return only valid JSON with this exact shape:",
    `[{"title":"${preferredTitles[0]}","items":["item 1","item 2","item 3"]},{"title":"${preferredTitles[1]}","items":["item 1","item 2","item 3"]},{"title":"${preferredTitles[2]}","items":["item 1","item 2"]},{"title":"${preferredTitles[3]}","items":["item 1","item 2"]}]`,
    `Assessment: ${assessment.componentTask || assessment.title}`,
    `Subject: ${subject.name}`,
    `Due: ${formatAssessmentDueLabel(assessment.dueDate)}`,
    topicHints.length ? `Likely topics: ${topicHints.join(", ")}` : "",
    clipText(assessment.description || "", 1600),
    ...linkedBundleContent
  ].filter(Boolean).join("\n\n");
  const answer = await requestAskAnswer(prompt, subject, buildTaskAskDocument(subject, {
    kind: "assessment",
    assessment,
    linkedDocumentBundles
  }));
  const trimmedAnswer = String(answer || "").trim();
  const parsedStages = parseAssessmentStages(trimmedAnswer);
  const clueStages = extractAssessmentSpecificClues(sourceText, topicHints);
  const nextStages = hasUsableAssessmentStages(parsedStages)
    ? parsedStages
    : buildSpecificAssessmentStages(
        assessment,
        [...linkedDocumentBundles.slice(0, 2).map((bundle) => bundle.title), ...clueStages],
        topicHints.slice(0, 4),
        String(assessment?.workNotes || "").trim().length
      ).map((stage) => ({ title: stage.title, items: stage.items }));

  assessment.aiTaskStages = nextStages;
  assessment.stageState = [];
  persistSubjects();
  state.taskAskResponse = nextStages
    .map((stage) => `${stage.title}: ${stage.items.join("; ")}`)
    .join("\n");
  state.taskAskStatus = "";
  renderAssessments();
  renderTaskView();
}

function buildTaskAskDocument(subject, taskContext) {
  if (taskContext.kind === "assessment") {
    return {
      title: taskContext.assessment.componentTask || taskContext.assessment.title,
      type: "Assessment",
      content: [
        taskContext.assessment.description || "",
        `Distribution: ${formatAssessmentDueLabel(taskContext.assessment.distributionDate || "TBC")}`,
        `Due: ${formatAssessmentDueLabel(taskContext.assessment.dueDate)}`,
        `Weighting: ${taskContext.assessment.weighting || "TBC"}`,
        taskContext.assessment.workNotes || "",
        ...taskContext.linkedDocumentBundles.map((bundle) => `${bundle.title}\n${clipText(bundle.content || "", 1200)}`)
      ]
        .filter(Boolean)
        .join("\n\n")
    };
  }

  return {
    title: taskContext.homeworkBundle.title,
    type: "Homework",
    content: [taskContext.homeworkBundle.content || "", getBundleWorkNotes(taskContext.homeworkBundle) || ""].filter(Boolean).join("\n\n")
  };
}

async function handleTaskAsk(question) {
  const subject = getSelectedSubject();
  const activeTask = state.activeTask;
  if (!subject || !activeTask) {
    return;
  }

  let taskContext = null;
  if (activeTask.kind === "assessment") {
    const assessment = subject.assessments.find((item) => item.id === activeTask.id);
    if (!assessment) {
      return;
    }
    taskContext = {
      kind: "assessment",
      assessment,
      linkedDocumentBundles: getLinkedDocumentBundles(subject, assessment.linkedDocumentIds)
    };
  } else {
    const homeworkBundle = findHomeworkBundle(subject, activeTask.id);
    if (!homeworkBundle) {
      return;
    }
    taskContext = {
      kind: "homework",
      homeworkBundle
    };
  }

  state.taskAskStatus = "Thinking...";
  renderTaskView();

  try {
    const answer = await requestAskAnswer(question, subject, buildTaskAskDocument(subject, taskContext));
    state.taskAskResponse = answer;
    state.taskAskStatus = "";
  } catch (error) {
    state.taskAskStatus = error instanceof Error ? `Ask Panda failed: ${error.message}` : "Ask Panda failed.";
  }

  renderTaskView();
}

function bindTaskPopupActions(config) {
  document.querySelectorAll("[data-task-close]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = "subjects";
      render();
    });
  });

  document.querySelectorAll("[data-task-note-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const bundle = config.linkedDocumentBundles?.find((item) => item.id === button.dataset.taskNoteId);
      if (bundle) {
        openDocumentPopup(bundle);
      }
    });
  });

  document.querySelectorAll("[data-task-ask-prompt]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.taskAction;
      const subject = getSelectedSubject();
      if (!subject) {
        return;
      }
      if (action === "simplify-homework") {
        const homeworkBundle = findHomeworkBundle(subject, config.taskId);
        if (!homeworkBundle) {
          return;
        }
        state.taskAskStatus = "Breaking this into steps...";
        renderTaskView();
        try {
          await simplifyHomeworkBundle(homeworkBundle, subject);
        } catch (error) {
          state.taskAskStatus = error instanceof Error ? `Ask Panda failed: ${error.message}` : "Ask Panda failed.";
          renderTaskView();
        }
        return;
      }
      if (action === "simplify-assessment") {
        const assessment = subject.assessments.find((item) => item.id === config.taskId);
        if (!assessment) {
          return;
        }
        state.taskAskStatus = "Breaking this into stages...";
        renderTaskView();
        try {
          await simplifyAssessmentTask(assessment, subject);
        } catch (error) {
          state.taskAskStatus = error instanceof Error ? `Ask Panda failed: ${error.message}` : "Ask Panda failed.";
          renderTaskView();
        }
        return;
      }
      if (action === "generate-practice-test") {
        state.taskAskStatus = "Opening practice test...";
        renderTaskView();
        try {
          await openRevisionTestFromTask(config);
        } catch (error) {
          state.taskAskStatus = error instanceof Error ? `Practice test failed: ${error.message}` : "Practice test failed.";
          renderTaskView();
        }
        return;
      }
      handleTaskAsk(button.dataset.taskAskPrompt || "");
    });
  });

  document.querySelectorAll(".task-note-drop").forEach((button) => {
    button.addEventListener("click", () => {
      if (config.taskKind === "assessment") {
        openAttachNotesModal({ kind: "assessment", subjectId: state.selectedSubjectId, assessmentId: config.taskId });
        return;
      }
      if (config.taskKind === "homework") {
        openAttachNotesModal({ kind: "homework", subjectId: state.selectedSubjectId, bundleId: config.taskId });
      }
    });
  });

  const getTaskWorkspaceRecord = () => {
    return getTaskRecord(config.taskKind, config.taskId);
  };

  const readTaskWorkspace = () => {
    return getTaskWorkspace(config.taskKind, getTaskWorkspaceRecord());
  };

  const writeTaskWorkspace = (workspace) => {
    const record = getTaskWorkspaceRecord();
    if (!record) {
      return;
    }
    setTaskWorkspace(config.taskKind, record, workspace);
    persistSubjects();
    renderTaskView();
  };

  const writeTaskEditorCache = (value) => {
    const record = getTaskWorkspaceRecord();
    if (!record) {
      return;
    }
    setTaskCachedEditorText(config.taskKind, record, value);
    persistSubjects();
  };

  const setTaskStatus = (message) => {
    elements.taskWorkStatus.textContent = message;
  };

  document.querySelectorAll("[data-task-workspace-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      const providerId = button.dataset.taskWorkspaceProvider;
      const provider = getTaskWorkspaceProvider(providerId);
      if (!provider) {
        return;
      }
      const currentWorkspace = readTaskWorkspace();
      writeTaskWorkspace({
        provider: provider.id,
        url: currentWorkspace?.provider === provider.id ? currentWorkspace.url : "",
        documentId: currentWorkspace?.provider === provider.id ? currentWorkspace.documentId : "",
        documentTitle: currentWorkspace?.provider === provider.id ? currentWorkspace.documentTitle : "",
        updatedAt: currentWorkspace?.provider === provider.id ? currentWorkspace.updatedAt : ""
      });
      setTaskStatus(
        provider.id === "google-docs"
          ? "Google Docs selected. Create a doc or connect an existing one."
          : `${provider.label} selected. This provider gets its own editor pane next.`
      );
    });
  });

  document.querySelectorAll("[data-google-docs-create]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const record = getTaskWorkspaceRecord();
        if (!record) {
          return;
        }
        const currentEditorValue = String(getTaskWorkEditor()?.value || getTaskCachedEditorText(config.taskKind, record) || "");
        setTaskStatus("Creating Google Doc...");
        const snapshot = await createGoogleDocSnapshot(getTaskDisplayTitle(config.taskKind, record), currentEditorValue);
        setTaskWorkspace(config.taskKind, record, {
          provider: "google-docs",
          url: snapshot.url,
          documentId: snapshot.documentId,
          documentTitle: snapshot.title,
          updatedAt: new Date().toISOString()
        });
        setTaskCachedEditorText(config.taskKind, record, snapshot.text);
        persistSubjects();
        renderTaskView();
        setTaskStatus(`Created and connected ${snapshot.title || "Google Doc"}.`);
      } catch (error) {
        setTaskStatus(error instanceof Error ? error.message : "Google Doc creation failed.");
      }
    });
  });

  document.querySelectorAll("[data-task-workspace-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const workspace = readTaskWorkspace();
      const targetUrl = workspace?.url || buildGoogleDocUrl(workspace?.documentId);
      if (!targetUrl) {
        setTaskStatus("Connect a Google Doc first.");
        return;
      }
      window.open(targetUrl, "_blank", "noopener");
    });
  });

  document.querySelectorAll("[data-google-docs-connect]").forEach((button) => {
    button.addEventListener("click", async () => {
      const url = String(document.getElementById("task-workspace-url-input")?.value || "").trim();
      if (!url) {
        setTaskStatus("Paste the Google Doc link first.");
        return;
      }
      if (!isWorkspaceUrlValidForProvider(url, "google-docs")) {
        setTaskStatus("That link does not look like a Google Doc.");
        return;
      }
      const documentId = extractGoogleDocIdFromUrl(url);
      if (!documentId) {
        setTaskStatus("Could not read the Google Doc ID from that link.");
        return;
      }
      try {
        setTaskStatus("Connecting Google Doc...");
        const snapshot = await fetchGoogleDocSnapshot(documentId);
        const record = getTaskWorkspaceRecord();
        if (!record) {
          return;
        }
        setTaskWorkspace(config.taskKind, record, {
          provider: "google-docs",
          url: buildGoogleDocUrl(documentId),
          documentId,
          documentTitle: snapshot.title,
          updatedAt: new Date().toISOString()
        });
        setTaskCachedEditorText(config.taskKind, record, snapshot.text);
        persistSubjects();
        renderTaskView();
        setTaskStatus(`Connected ${snapshot.title || "Google Doc"}.`);
      } catch (error) {
        setTaskStatus(error instanceof Error ? error.message : "Google Doc connection failed.");
      }
    });
  });

  document.querySelectorAll("[data-google-docs-pull]").forEach((button) => {
    button.addEventListener("click", async () => {
      const workspace = readTaskWorkspace();
      if (!isConnectedGoogleDocsWorkspace(workspace)) {
        setTaskStatus("Connect a Google Doc first.");
        return;
      }
      try {
        setTaskStatus("Pulling latest from Google Docs...");
        const snapshot = await fetchGoogleDocSnapshot(workspace.documentId);
        writeTaskEditorCache(snapshot.text);
        const editor = getTaskWorkEditor();
        if (editor) {
          editor.value = snapshot.text;
        }
        const record = getTaskWorkspaceRecord();
        if (record) {
          setTaskWorkspace(config.taskKind, record, {
            ...workspace,
            url: snapshot.url,
            documentTitle: snapshot.title,
            updatedAt: new Date().toISOString()
          });
          persistSubjects();
        }
        setTaskStatus(`Pulled latest from ${snapshot.title || "Google Doc"}.`);
      } catch (error) {
        setTaskStatus(error instanceof Error ? error.message : "Could not refresh Google Doc.");
      }
    });
  });

  document.querySelectorAll("[data-task-workspace-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      writeTaskWorkspace(null);
      setTaskStatus("Workspace disconnected.");
    });
  });

  document.querySelectorAll("[data-homework-step-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const bundleId = button.dataset.homeworkStepToggle;
      const stepIndex = Number(button.dataset.homeworkStepIndex);
      if (!bundleId || Number.isNaN(stepIndex)) {
        return;
      }
      toggleHomeworkStep(bundleId, stepIndex);
    });
  });

  document.querySelectorAll("[data-assessment-stage-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const assessmentId = button.dataset.assessmentStageToggle;
      const stageIndex = Number(button.dataset.stageIndex);
      const itemIndex = Number(button.dataset.stageItemIndex);
      if (!assessmentId || Number.isNaN(stageIndex) || Number.isNaN(itemIndex)) {
        return;
      }
      toggleAssessmentStageItem(assessmentId, stageIndex, itemIndex);
    });
  });

  document.getElementById("task-read-aloud-button")?.addEventListener("click", () => {
    const taskAudioContext = `task:${config.taskKind}:${config.taskId}`;
    if (currentAudioContext === taskAudioContext) {
      stopListening();
      renderTaskView();
      return;
    }
    const textToRead = config.readAloudText || config.title;
    speakTextWithOpenAi(textToRead, {
      context: taskAudioContext,
      statusMessages: {
        preparing: "Preparing task audio...",
        playing: "Reading task aloud...",
        error: "Task audio playback failed."
      }
    })
      .then(() => {
        renderTaskView();
      })
      .catch((error) => {
        state.taskAskStatus = error instanceof Error ? `Listen failed: ${error.message}` : "Listen failed.";
        renderTaskView();
      });
    renderTaskView();
  });
}

function renderTaskView() {
  const subject = getSelectedSubject();
  const activeTask = state.activeTask;
  const existingDraft = getTaskWorkEditor()?.value ?? "";
  if (!subject || !activeTask) {
    return;
  }

  if (activeTask.kind === "assessment") {
    const assessment = subject.assessments.find((item) => item.id === activeTask.id);
    if (!assessment) {
      return;
    }
    const linkedDocumentBundles = getLinkedDocumentBundles(subject, assessment.linkedDocumentIds);
    const stageCards = buildAssessmentTaskStages(assessment, linkedDocumentBundles);
    const totalCompleted = stageCards.reduce((sum, stage) => sum + stage.doneCount, 0);
    const totalItems = stageCards.reduce((sum, stage) => sum + stage.items.length, 0);
    const progressRatio = totalItems ? totalCompleted / totalItems : 0;
    const workEditorValue = existingDraft || assessment.workNotes || "";
    const externalWorkspace = getAssessmentExternalWorkspace(assessment);
    const selectedProvider = getTaskWorkspaceProvider(externalWorkspace?.provider);
    const googleDocsConnected = isConnectedGoogleDocsWorkspace(externalWorkspace);
    const unsupportedProviderSelected = Boolean(selectedProvider && selectedProvider.id !== "google-docs");
    const questionPrompt = `Based on ${assessment.componentTask || assessment.title}, generate a short practice question set I can use to prepare.`;
    const studyPlanPrompt = `Suggest a short study plan for ${assessment.componentTask || assessment.title} before ${formatAssessmentDueLabel(assessment.dueDate)}.`;
    const simplifyPrompt = `Simplify this assessment task into plain student-friendly steps: ${assessment.componentTask || assessment.title}. ${assessment.description || ""}`;
    const isReadingTask = currentAudioContext === `task:assessment:${assessment.id}`;
    const pandaVisualMarkup = `
      <div class="task-panda-visual" aria-hidden="true">
        <img src="/paperpanda-logo.svg" alt="" class="task-panda-visual__avatar" />
        <div class="task-panda-visual__wave">
          <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    `;
    elements.saveTaskWorkButton.textContent = googleDocsConnected ? "Save to Google Docs" : "Save draft";
    elements.saveTaskWorkButton.disabled = unsupportedProviderSelected;
    elements.saveTaskFilesButton.disabled = unsupportedProviderSelected;
    elements.closeTaskViewButton.textContent = "Back to subjects";
    elements.taskSourceContent.innerHTML = `
      <article class="task-popup task-popup--assessment">
        <header class="task-popup__hero task-popup__hero--assessment">
          <div class="task-popup__countdown">
            <strong>${escapeHtml(String(Math.max(0, Math.ceil((parseAssessmentDate(assessment.dueDate)?.getTime() - new Date(new Date().setHours(0,0,0,0)).getTime()) / 86400000)) || 0))}</strong>
            <span>DAYS</span>
          </div>
          <div class="task-popup__hero-copy">
            <p class="eyebrow">${escapeHtml(`${subject.name} · Assessment · ${assessment.weighting || "TBC"}`)}</p>
            <h2>${escapeHtml(assessment.componentTask || assessment.title)}</h2>
            <p class="task-popup__hero-meta">Distributed ${escapeHtml(formatAssessmentDueLabel(assessment.distributionDate || "TBC"))} · Due ${escapeHtml(formatAssessmentDueLabel(assessment.dueDate))} · Task ${escapeHtml(assessment.taskNumber || "Uploaded")}</p>
          </div>
          <button type="button" class="task-popup__close" data-task-close aria-label="Close task workspace">×</button>
        </header>
        <div class="task-popup__layout task-popup__layout--assessment">
          <div class="task-popup__main">
            <div class="task-banner task-banner--mint">
              <div class="task-banner__copy">
                <strong>Panda broke the task description into ${stageCards.length} stages.</strong>
                <span>Tick each as you go.</span>
              </div>
              <button type="button" class="ghost-button ghost-button--dark" id="task-read-aloud-button">${isReadingTask ? "Stop" : "Read all"}</button>
            </div>
            <div class="task-stage-list">
              ${stageCards
                .map(
                  (stage, stageIndex) => `
                    <article class="task-stage-card${stage.active ? " task-stage-card--active" : ""}">
                      <div class="task-stage-card__header">
                        <div class="task-stage-card__title">
                          <span class="task-stage-card__number">${stage.number}</span>
                          <h3>${escapeHtml(stage.title)}</h3>
                        </div>
                        <span class="task-stage-card__progress">${stage.doneCount}/${stage.items.length} done</span>
                      </div>
                      <div class="task-stage-card__items">
                        ${stage.items
                          .map(
                            (item, itemIndex) => `
                              <button type="button" class="task-check-row${stage.itemState[itemIndex] ? " task-check-row--done" : ""}${stage.active && itemIndex === stage.nextActionIndex ? " task-check-row--focus" : ""}" data-assessment-stage-toggle="${assessment.id}" data-stage-index="${stageIndex}" data-stage-item-index="${itemIndex}">
                                <span class="task-check-row__box">${stage.itemState[itemIndex] ? "✓" : ""}</span>
                                <span>${escapeHtml(item)}</span>
                              </button>
                            `
                          )
                          .join("")}
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>
            <div class="task-draft-card">
              <div class="section-heading section-heading--stacked section-heading--compact">
                <div>
                  <p class="eyebrow">${googleDocsConnected ? "Connected editor" : "Working draft"}</p>
                  <h3>${googleDocsConnected ? escapeHtml(externalWorkspace.documentTitle || "Google Doc") : unsupportedProviderSelected ? escapeHtml(`${selectedProvider.label} editor`) : "Your response"}</h3>
                </div>
              </div>
              ${createTaskWorkspaceMarkup(externalWorkspace, assessment.componentTask || assessment.title)}
              <textarea id="task-work-editor" class="reader-editor task-popup__editor" placeholder="${escapeHtml(googleDocsConnected ? "Google Doc content appears here." : unsupportedProviderSelected ? `${selectedProvider.label} gets its own editor in this pane.` : "Start drafting your assessment response here...")}" ${unsupportedProviderSelected ? "disabled" : ""}>${escapeHtml(workEditorValue)}</textarea>
            </div>
          </div>
          <aside class="task-popup__side">
            <section class="task-notes-card">
              <div class="section-heading section-heading--stacked section-heading--compact">
                <div>
                  <p class="eyebrow">Attached notes · drop documents</p>
                  <h3>Relevant notes</h3>
                </div>
              </div>
              <div class="task-note-list">
                ${
                  linkedDocumentBundles.length
                    ? linkedDocumentBundles
                        .map(
                          (documentBundle, index) => `
                            <button type="button" class="task-note-row task-note-row--${["peach", "sky", "lilac", "mint"][index % 4]}" data-task-note-id="${documentBundle.id}">
                              <span class="task-note-row__icon">📕</span>
                              <span class="task-note-row__copy">
                                <strong>${escapeHtml(documentBundle.title)}</strong>
                                <span>${escapeHtml(`${getBundlePageCount(documentBundle)} ${getBundlePageCount(documentBundle) === 1 ? "page" : "pages"}`)}</span>
                              </span>
                              <span class="task-note-row__chevron">›</span>
                            </button>
                          `
                        )
                        .join("")
                    : '<div class="empty-state empty-state--compact">No supporting documents linked yet.</div>'
                }
                <button type="button" class="task-note-drop">+ Drop a document</button>
              </div>
            </section>
            <section class="task-panda-card">
              <div class="task-panda-card__header">
                <div>
                  <h3>Ask Panda about this</h3>
                  <p>I’m listening...</p>
                </div>
              </div>
              ${pandaVisualMarkup}
              <div class="task-panda-card__actions">
                <button type="button" class="task-panda-pill" data-task-action="simplify-assessment" data-task-ask-prompt="${escapeHtml(simplifyPrompt)}">Simplify this task</button>
                <button type="button" class="task-panda-pill" data-task-action="generate-practice-test">Generate a practice test</button>
                <button type="button" class="task-panda-pill" data-task-ask-prompt="${escapeHtml(studyPlanPrompt)}">Suggest a study plan</button>
              </div>
              <div class="task-panda-card__response">${escapeHtml(state.taskAskStatus || state.taskAskResponse || "Use Panda to turn the task into smaller actions or revision questions.")}</div>
            </section>
          </aside>
        </div>
        <footer class="task-progress-footer">
          <div class="task-progress-bar"><span style="width:${Math.round(progressRatio * 100)}%"></span></div>
          <span>${escapeHtml(`${totalCompleted} of ${totalItems} stage items complete`)}</span>
        </footer>
      </article>
    `;
    bindTaskPopupActions({
      taskKind: "assessment",
      taskId: assessment.id,
      linkedDocumentBundles,
      readAloudText: [assessment.componentTask || assessment.title, assessment.description || "", workEditorValue].filter(Boolean).join(". ")
    });
    return;
  }

  if (activeTask.kind === "homework") {
    const homeworkBundle = findHomeworkBundle(subject, activeTask.id);
    if (!homeworkBundle) {
      return;
    }
    const steps = buildHomeworkTaskSteps(homeworkBundle);
    const minutes = estimateTaskMinutes(homeworkBundle.content || "");
    const externalWorkspace = getHomeworkExternalWorkspace(homeworkBundle);
    const selectedProvider = getTaskWorkspaceProvider(externalWorkspace?.provider);
    const googleDocsConnected = isConnectedGoogleDocsWorkspace(externalWorkspace);
    const unsupportedProviderSelected = Boolean(selectedProvider && selectedProvider.id !== "google-docs");
    const simplifyPrompt = `Rewrite this homework in simpler words for a student: ${homeworkBundle.title}. ${clipText(homeworkBundle.content || "", 1600)}`;
    const starterPrompt = `Write one strong starter sentence for this homework response: ${homeworkBundle.title}. ${clipText(homeworkBundle.content || "", 1600)}`;
    const quizPrompt = `Quiz me on this homework topic with 3 quick questions: ${homeworkBundle.title}.`;
    const linkedHomeworkNotes = getLinkedDocumentBundles(subject, getBundleStoredLinkedDocumentIds(homeworkBundle)).filter((bundle) => bundle.id !== homeworkBundle.id);
    const isReadingTask = currentAudioContext === `task:homework:${homeworkBundle.id}`;
    const pandaVisualMarkup = `
      <div class="task-panda-visual" aria-hidden="true">
        <img src="/paperpanda-logo.svg" alt="" class="task-panda-visual__avatar" />
        <div class="task-panda-visual__wave">
          <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    `;
    elements.saveTaskWorkButton.textContent = googleDocsConnected ? "Save to Google Docs" : "Save draft";
    elements.saveTaskWorkButton.disabled = unsupportedProviderSelected;
    elements.saveTaskFilesButton.disabled = unsupportedProviderSelected;
    elements.closeTaskViewButton.textContent = "Back to subjects";
    elements.taskSourceContent.innerHTML = `
      <article class="task-popup task-popup--homework">
        <header class="task-popup__hero task-popup__hero--homework">
          <div class="task-popup__hero-icon">✎</div>
          <div class="task-popup__hero-copy">
            <p class="eyebrow">${escapeHtml(`${subject.name} · Homework`)} <span class="task-popup__due-pill">${escapeHtml(getDaysUntilText(homeworkBundle.addedAt || new Date().toISOString()))}</span></p>
            <h2>${escapeHtml(homeworkBundle.title)}</h2>
          </div>
          <button type="button" class="task-popup__close" data-task-close aria-label="Close task workspace">×</button>
        </header>
        <div class="task-popup__layout task-popup__layout--homework">
          <div class="task-popup__main">
            <section class="task-audio-card">
              <button type="button" class="task-audio-card__play" id="task-read-aloud-button">${isReadingTask ? "■" : "▶"}</button>
              <div class="task-audio-card__copy">
                <strong>Read task aloud</strong>
                <span>~${minutes} minutes · Panda voice · 1.0x</span>
              </div>
              <button type="button" class="task-audio-card__action" data-task-action="simplify-homework" data-task-ask-prompt="${escapeHtml(simplifyPrompt)}">Simplify this task</button>
            </section>
            <div class="task-steps-head">
              <div class="task-panda-inline">
                <span class="task-panda-inline__icon">🐼</span>
                <div>
                  <strong>PANDA BROKE THIS INTO ${steps.length} STEPS</strong>
                  <span>Tap any step to mark complete</span>
                </div>
              </div>
              <button type="button" class="task-inline-link" data-task-ask-prompt="${escapeHtml(simplifyPrompt)}">Re-simplify</button>
            </div>
            <div class="task-step-list">
              ${steps
                .map(
                  (step, stepIndex) => `
                    <button type="button" class="task-step-card${step.active ? " task-step-card--active" : ""}${step.done ? " task-step-card--done" : ""}" data-homework-step-toggle="${homeworkBundle.id}" data-homework-step-index="${stepIndex}">
                      <span class="task-step-card__check">${step.done ? "✓" : ""}</span>
                      <span class="task-step-card__label">${escapeHtml(step.label)}</span>
                      ${step.active ? '<span class="task-step-card__tag">YOU&#39;RE HERE</span>' : ""}
                    </button>
                  `
                )
                .join("")}
            </div>
            <section class="task-summary-card">
              <div class="section-heading section-heading--stacked section-heading--compact">
                <div>
                  <p class="eyebrow">${googleDocsConnected ? "Connected editor" : "Your summary so far"}</p>
                  <h3>${googleDocsConnected ? escapeHtml(externalWorkspace.documentTitle || "Google Doc") : unsupportedProviderSelected ? escapeHtml(`${selectedProvider.label} editor`) : "Workbook response"}</h3>
                </div>
              </div>
                  ${createTaskWorkspaceMarkup(externalWorkspace, homeworkBundle.title)}
                  <textarea id="task-work-editor" class="reader-editor task-popup__editor" placeholder="${escapeHtml(googleDocsConnected ? "Google Doc content appears here." : unsupportedProviderSelected ? `${selectedProvider.label} gets its own editor in this pane.` : "Write your homework answer here...")}" ${unsupportedProviderSelected ? "disabled" : ""}>${escapeHtml(existingDraft || getBundleWorkNotes(homeworkBundle) || "")}</textarea>
                </section>
          </div>
          <aside class="task-popup__side">
            <section class="task-notes-card">
              <div class="section-heading section-heading--stacked section-heading--compact">
                <div>
                  <p class="eyebrow">Attached notes</p>
                  <h3>Relevant notes</h3>
                </div>
              </div>
              <div class="task-note-list">
                ${
                  linkedHomeworkNotes.length
                    ? linkedHomeworkNotes
                      .map(
                        (documentItem, index) => `
                      <button type="button" class="task-note-row task-note-row--${["mint", "sky", "lilac", "peach"][index % 4]}" data-task-note-id="${documentItem.id}">
                        <span class="task-note-row__icon">📕</span>
                        <span class="task-note-row__copy">
                          <strong>${escapeHtml(documentItem.title)}</strong>
                          <span>${escapeHtml(documentItem.documents.length === 1 ? "1 page" : `${documentItem.documents.length} pages`)}</span>
                        </span>
                        <span class="task-note-row__chevron">›</span>
                      </button>
                    `
                      )
                      .join("")
                    : '<div class="empty-state empty-state--compact">No supporting notes attached yet.</div>'
                }
                <button type="button" class="task-note-drop">+ Drop a document</button>
              </div>
            </section>
            <section class="task-panda-card task-panda-card--light">
              <div class="task-panda-card__header">
                <div>
                  <h3>Ask Panda</h3>
                  <p>I’m listening...</p>
                </div>
              </div>
              ${pandaVisualMarkup}
              <div class="task-panda-card__actions">
                <button type="button" class="task-panda-pill" data-task-action="simplify-homework" data-task-ask-prompt="${escapeHtml(simplifyPrompt)}">Simplify this task</button>
                <button type="button" class="task-panda-pill" data-task-action="generate-practice-test">Generate a practice test</button>
                <button type="button" class="task-panda-pill" data-task-ask-prompt="${escapeHtml(quizPrompt)}">Quiz me on it</button>
              </div>
              <div class="task-panda-card__response">${escapeHtml(state.taskAskStatus || state.taskAskResponse || "Panda can simplify, quiz, or give you a starter sentence for this task.")}</div>
            </section>
          </aside>
        </div>
      </article>
    `;
    bindTaskPopupActions({
      taskKind: "homework",
      taskId: homeworkBundle.id,
      linkedDocumentBundles: linkedHomeworkNotes,
      readAloudText: [homeworkBundle.title, homeworkBundle.content || "", getBundleWorkNotes(homeworkBundle) || ""].filter(Boolean).join(". ")
    });
  }
}

async function saveTaskWorkspace() {
  const subject = getSelectedSubject();
  const activeTask = state.activeTask;
  const taskWorkEditor = getTaskWorkEditor();
  if (!subject || !activeTask) {
    return;
  }
  if (!taskWorkEditor) {
    return;
  }

  const taskRecord = getTaskRecord(activeTask.kind, activeTask.id, subject);
  if (!taskRecord) {
    return;
  }

  const externalWorkspace = getTaskWorkspace(activeTask.kind, taskRecord);
  const nextValue = taskWorkEditor.value;

  if (isConnectedGoogleDocsWorkspace(externalWorkspace)) {
    try {
      elements.taskWorkStatus.textContent = "Saving to Google Docs...";
      const snapshot = await saveGoogleDocSnapshot(externalWorkspace.documentId, nextValue);
      setTaskWorkspace(activeTask.kind, taskRecord, {
        ...externalWorkspace,
        url: snapshot.url,
        documentTitle: snapshot.title,
        updatedAt: new Date().toISOString()
      });
      setTaskCachedEditorText(activeTask.kind, taskRecord, snapshot.text);
      persistSubjects();
      elements.taskWorkStatus.textContent = `Saved to ${snapshot.title || "Google Doc"}.`;
      renderTaskView();
      elements.taskWorkStatus.textContent = `Saved to ${snapshot.title || "Google Doc"}.`;
    } catch (error) {
      elements.taskWorkStatus.textContent = error instanceof Error ? error.message : "Google Docs save failed.";
    }
    return;
  }

  if (activeTask.kind === "assessment") {
    taskRecord.workNotes = nextValue;
  }

  if (activeTask.kind === "homework") {
    setBundleWorkNotes(taskRecord, nextValue);
  }

  persistSubjects();
  elements.taskWorkStatus.textContent = "Saved.";
}

function saveTaskWorkspaceToFiles() {
  const subject = getSelectedSubject();
  const activeTask = state.activeTask;
  const taskWorkEditor = getTaskWorkEditor();
  if (!subject || !activeTask) {
    return;
  }
  if (!taskWorkEditor) {
    return;
  }

  let title = "task-work";
  if (activeTask.kind === "assessment") {
    const assessment = subject.assessments.find((item) => item.id === activeTask.id);
    title = assessment?.componentTask || assessment?.title || title;
  }
  if (activeTask.kind === "homework") {
    const homeworkBundle = findHomeworkBundle(subject, activeTask.id);
    title = homeworkBundle?.title || title;
  }

  const exportContent = taskWorkEditor.value || "";
  const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = buildTaskExportName(subject.name, title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
  elements.taskWorkStatus.textContent = "Saved to files.";
}

function renderAssessments() {
  const selectedSubject = getSelectedSubject();
  if (!selectedSubject) {
    return;
  }

  elements.assessmentList.innerHTML = "";

  const selectedEntries = selectedSubject.assessments
    .map((assessment) => ({
      subject: selectedSubject,
      assessment,
      dueDateObject: parseAssessmentDate(assessment.dueDate)
    }))
    .sort((left, right) => {
      if (left.assessment.completed !== right.assessment.completed) {
        return Number(left.assessment.completed) - Number(right.assessment.completed);
      }
      const leftTime = left.dueDateObject ? left.dueDateObject.getTime() : Number.POSITIVE_INFINITY;
      const rightTime = right.dueDateObject ? right.dueDateObject.getTime() : Number.POSITIVE_INFINITY;
      return leftTime - rightTime;
    });

  if (!selectedEntries.length) {
    elements.assessmentList.innerHTML = `<div class="empty-state">No assessments for ${escapeHtml(selectedSubject.name)} yet.</div>`;
    if (elements.subjectNextAssessmentDays) {
      elements.subjectNextAssessmentDays.textContent = "0";
    }
    if (elements.subjectNextAssessmentTitle) {
      elements.subjectNextAssessmentTitle.textContent = "No active assessment yet";
    }
    if (elements.subjectNextAssessmentMeta) {
      elements.subjectNextAssessmentMeta.textContent = "Attach notes and track upcoming due dates here.";
    }
    renderSubjectsHero();
    renderDockContext();
    return;
  }

  const nextAssessmentEntry = selectedEntries.find((entry) => !entry.assessment.completed) || selectedEntries[0];
  if (elements.subjectNextAssessmentDays) {
    if (nextAssessmentEntry?.dueDateObject) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      elements.subjectNextAssessmentDays.textContent = String(
        Math.max(0, Math.ceil((nextAssessmentEntry.dueDateObject.getTime() - today.getTime()) / 86400000))
      );
    } else {
      elements.subjectNextAssessmentDays.textContent = "0";
    }
  }
  if (elements.subjectNextAssessmentTitle) {
    elements.subjectNextAssessmentTitle.textContent = nextAssessmentEntry.assessment.componentTask || nextAssessmentEntry.assessment.title;
  }
  if (elements.subjectNextAssessmentMeta) {
    elements.subjectNextAssessmentMeta.textContent = `${selectedSubject.name} · ${nextAssessmentEntry.assessment.weighting || "Assessment"} · ${formatAssessmentDueLabel(nextAssessmentEntry.assessment.dueDate)}`;
  }

  selectedEntries.forEach(({ subject, assessment, dueDateObject }) => {
    const wrapper = document.createElement("article");
    wrapper.className = `assessment-item ${assessment.completed ? "assessment-item--completed assessment-item--compressed" : "assessment-item--current"}`;

    const dueLabel = formatAssessmentDueLabel(assessment.dueDate);
    const distributionText = formatAssessmentDueLabel(assessment.distributionDate || "TBC");
    const weightingText = assessment.weighting || "TBC";

    wrapper.innerHTML = assessment.completed
      ? `
        <div class="assessment-item__header">
          <h4><button type="button" class="assessment-link-button" data-open-assessment="${assessment.id}">${escapeHtml(assessment.componentTask || assessment.title)}</button></h4>
          <div class="assessment-item__meta-row">
            <span class="assessment-item__task">Task ${escapeHtml(assessment.taskNumber || "Uploaded")}</span>
            <span class="document-chip assessment-complete-chip">Complete</span>
          </div>
        </div>
      `
      : `
        <div class="assessment-item__header">
          <div class="assessment-item__title-group">
            <span class="assessment-date">Due ${escapeHtml(dueLabel)}</span>
            <h4><button type="button" class="assessment-link-button" data-open-assessment="${assessment.id}">${escapeHtml(assessment.componentTask || assessment.title)}</button></h4>
            <span class="document-chip assessment-item__subject">${escapeHtml(subject.name)}</span>
          </div>
          <span class="assessment-item__task">Task ${escapeHtml(assessment.taskNumber || "Uploaded")}</span>
        </div>
        <div class="assessment-grid">
          <div class="assessment-fact">
            <strong>Due date</strong>
            <span>${escapeHtml(dueLabel)}</span>
          </div>
          <div class="assessment-fact">
            <strong>Distribution</strong>
            <span>${escapeHtml(distributionText)}</span>
          </div>
          <div class="assessment-fact">
            <strong>Weighting</strong>
            <span>${escapeHtml(weightingText)}</span>
          </div>
          <div class="assessment-fact">
            <strong>Task</strong>
            <span>${escapeHtml(assessment.componentTask || assessment.title)}</span>
          </div>
        </div>
        <div class="practice-copy">${getLinkedDocumentBundles(subject, assessment.linkedDocumentIds).length} attached document${getLinkedDocumentBundles(subject, assessment.linkedDocumentIds).length === 1 ? "" : "s"}.</div>
        ${getAssessmentActionsMarkup(assessment.id, assessment.completed)}
      `;

    const actionsContainer = wrapper.querySelector(".assessment-actions");
    const openAssessmentButton = wrapper.querySelector("[data-open-assessment]");

    if (actionsContainer) {
      attachAssessmentActionHandlers(wrapper, subject);
    }

    openAssessmentButton?.addEventListener("click", () => {
      openTaskView({ kind: "assessment", id: assessment.id });
    });

    elements.assessmentList.appendChild(wrapper);
  });

  renderSubjectsHero();
  renderDockContext();
}

function renderUpcomingModal() {
  const isAllYearMode = state.upcomingModalMode === "all";
  const upcomingEntries = getUpcomingAssessmentEntries();
  const yearEntries = getAssessmentEntries();
  const displayEntries = isAllYearMode ? yearEntries : upcomingEntries;
  const fortnightEnd = new Date();
  fortnightEnd.setDate(fortnightEnd.getDate() + 14);
  elements.upcomingModalSummary.textContent = isAllYearMode
    ? `This is the full year assessment list across all subjects. Completed assessments remain visible here.`
    : upcomingEntries.length
      ? `Assessments due by ${formatAssessmentDate(fortnightEnd)}.`
      : `No assessments fall in the next fortnight ending ${formatAssessmentDate(fortnightEnd)}.`;
  elements.toggleUpcomingModeButton.textContent = isAllYearMode
    ? "Back to next fortnight"
    : "View all assessments for the year";

  if (!displayEntries.length) {
    elements.upcomingModalList.innerHTML = `<div class="empty-state">${
      isAllYearMode ? "No assessments have been added for the year yet." : "No assessments are due in the next 14 days."
    }</div>`;
    return;
  }

  if (isAllYearMode) {
    elements.upcomingModalList.innerHTML = `
      <div class="assessment-ledger">
        <div class="assessment-ledger__header">
          <span>Subject</span>
          <span>Task</span>
          <span>Title</span>
          <span>Distribution</span>
          <span>Due</span>
          <span>Weighting</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        ${displayEntries
          .map(
            ({ subject, assessment }) => `
              <article class="assessment-ledger__row${assessment.completed ? " assessment-ledger__row--completed" : ""}">
                <span class="assessment-ledger__cell">
                  <span class="assessment-ledger__label">Subject</span>
                  ${escapeHtml(subject.name)}
                </span>
                <span class="assessment-ledger__cell">
                  <span class="assessment-ledger__label">Task</span>
                  ${escapeHtml(assessment.taskNumber || "Uploaded")}
                </span>
                <span class="assessment-ledger__cell assessment-ledger__cell--title">
                  <span class="assessment-ledger__label">Title</span>
                  <button
                    type="button"
                    class="assessment-link-button"
                    data-upcoming-action="open"
                    data-upcoming-subject-id="${subject.id}"
                    data-assessment-id="${assessment.id}"
                  >
                    ${escapeHtml(assessment.componentTask || assessment.title)}
                  </button>
                </span>
                <span class="assessment-ledger__cell">
                  <span class="assessment-ledger__label">Distribution</span>
                  ${escapeHtml(formatAssessmentDueLabel(assessment.distributionDate || "TBC"))}
                </span>
                <span class="assessment-ledger__cell">
                  <span class="assessment-ledger__label">Due</span>
                  ${escapeHtml(formatAssessmentDueLabel(assessment.dueDate))}
                </span>
                <span class="assessment-ledger__cell">
                  <span class="assessment-ledger__label">Weighting</span>
                  ${escapeHtml(assessment.weighting || "TBC")}
                </span>
                <span class="assessment-ledger__cell">
                  <span class="assessment-ledger__label">Status</span>
                  ${assessment.completed ? "Completed" : "Active"}
                </span>
                <div class="assessment-ledger__cell assessment-ledger__actions">
                  <span class="assessment-ledger__label">Actions</span>
                  <button
                    type="button"
                    class="assessment-action"
                    data-upcoming-action="edit"
                    data-upcoming-subject-id="${subject.id}"
                    data-assessment-id="${assessment.id}"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="assessment-action assessment-action--danger"
                    data-upcoming-action="delete"
                    data-upcoming-subject-id="${subject.id}"
                    data-assessment-id="${assessment.id}"
                  >
                    Delete
                  </button>
                  ${
                    assessment.completed
                      ? '<span class="document-chip">Completed</span>'
                      : `
                        <button
                          type="button"
                          class="assessment-action assessment-complete"
                          data-upcoming-action="complete"
                          data-upcoming-subject-id="${subject.id}"
                          data-assessment-id="${assessment.id}"
                        >
                          Complete
                        </button>
                      `
                  }
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
    attachUpcomingAssessmentHandlers();
    return;
  }

  elements.upcomingModalList.innerHTML = displayEntries
    .map(
      ({ subject, assessment }) => `
        <article class="assessment-item${assessment.completed ? " assessment-item--completed" : ""}">
          <div class="assessment-item__header">
            <div class="assessment-item__title-group">
              <span class="assessment-date">Due ${escapeHtml(formatAssessmentDueLabel(assessment.dueDate))}</span>
              <h4>
                <button
                  type="button"
                  class="assessment-link-button"
                  data-upcoming-action="open"
                  data-upcoming-subject-id="${subject.id}"
                  data-assessment-id="${assessment.id}"
                >
                  ${escapeHtml(assessment.componentTask || assessment.title)}
                </button>
              </h4>
              <span class="document-chip assessment-item__subject">${escapeHtml(subject.name)}</span>
            </div>
            <span class="assessment-item__task">Task ${escapeHtml(assessment.taskNumber || "Uploaded")}</span>
          </div>
          <div class="assessment-grid">
            <div class="assessment-fact">
              <strong>Distribution</strong>
              <span>${escapeHtml(formatAssessmentDueLabel(assessment.distributionDate || "TBC"))}</span>
            </div>
            <div class="assessment-fact">
              <strong>Due</strong>
              <span>${escapeHtml(formatAssessmentDueLabel(assessment.dueDate))}</span>
            </div>
            <div class="assessment-fact">
              <strong>Weighting</strong>
              <span>${escapeHtml(assessment.weighting || "TBC")}</span>
            </div>
            <div class="assessment-fact">
              <strong>Task</strong>
              <span>${escapeHtml(assessment.componentTask || assessment.title)}</span>
            </div>
          </div>
          ${assessment.completed ? '<div class="assessment-actions"><span class="document-chip">Completed</span></div>' : ""}
        </article>
      `
    )
    .join("");

  attachUpcomingAssessmentHandlers();
}

function renderSpelling() {
  const host = elements.spellingSection;
  const subject = getSelectedSubject();
  if (!host || !subject) {
    return;
  }

  const spelling = getSubjectSpellingState(subject);
  if (!spelling.enabled) {
    host.innerHTML = `
      <section class="spelling-shell spelling-shell--empty">
        <article class="spelling-empty-card">
          <p class="eyebrow">Spelling Stables</p>
          <h3>Open the Spelling subject to train this lesson</h3>
          <p>Spelling Stables now lives as its own subject so the horse-themed spelling practice can be selected directly from the subject list.</p>
        </article>
      </section>
    `;
    return;
  }

  const completedCount = getSpellingCompletedActivityCount(subject);
  const totalCount = getSpellingTotalActivityCount(subject);
  const masteryPercent = Math.round(getSpellingMasteryRatio(subject) * 100);
  const currentStageId = getSpellingStageId(subject);
  const stageId = getSpellingVisibleStageId(subject);
  const stageIndex = SPELLING_STAGE_ORDER.indexOf(stageId);
  const unlockedStageIndex = Math.min(completedCount, SPELLING_STAGE_ORDER.length - 1);
  const showingCelebration = spelling.celebrationStageId === stageId;
  const diagnosticWord = getSpellingDiagnosticCurrentWord(spelling);
  const focusSummary = getSpellingTopFocuses(spelling, 3);
  const followUpWords = getSpellingFollowUpWords(spelling);

  if (stageId === "diagnostic" && !spelling.diagnostic.completed && !showingCelebration) {
    host.innerHTML = `
      <section class="spelling-shell spelling-shell--diagnostic-only" data-spelling-font="${escapeHtml(spelling.preferences.font)}" data-spelling-spacing="${escapeHtml(spelling.preferences.spacing)}" data-spelling-tint="${escapeHtml(spelling.preferences.tint)}">
        <article class="spelling-stage-card spelling-stage-card--diagnostic">
          <p class="eyebrow">Spelling Diagnostic</p>
          <h3>Spoken baseline</h3>
          <p>Listen to each word, type it once, and move on. This stage uses 10 Year 5 words and 10 Year 7 words to map the patterns that need the most work.</p>
          <div class="spelling-stage-meta">
            <span>Word ${escapeHtml(String(Math.min(spelling.diagnostic.currentIndex + 1, SPELLING_DIAGNOSTIC_WORDS.length)))} of ${escapeHtml(String(SPELLING_DIAGNOSTIC_WORDS.length))}</span>
            <span>${escapeHtml(`${getSpellingDiagnosticCorrectCount(spelling)} correct so far`)}</span>
          </div>
          <div class="spelling-audio-panel">
            <button type="button" class="primary-button primary-button--dark" data-spelling-play-diagnostic="true">Play word</button>
            <p>The voice reads the target word in a sentence. Replay it as often as needed before you submit.</p>
          </div>
          <label class="spelling-input-label" for="spelling-diagnostic-input">Type the word you hear</label>
          <input
            id="spelling-diagnostic-input"
            class="reader-editor spelling-inline-input"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            value="${escapeHtml(spelling.diagnostic.currentInput)}"
            placeholder="Type the spelling exactly as you hear it"
          />
          <div class="spelling-stage-actions">
            <button type="button" class="primary-button primary-button--dark" data-spelling-submit-diagnostic="true">
              ${spelling.diagnostic.currentIndex >= SPELLING_DIAGNOSTIC_WORDS.length - 1 ? "Finish diagnostic" : "Submit and next"}
            </button>
          </div>
          <p class="spelling-stage-note">This screen stays minimal on purpose so the diagnostic is the only task in view.</p>
        </article>
      </section>
    `;

    host.querySelector("[data-spelling-play-diagnostic]")?.addEventListener("click", () => {
      speakSpellingDiagnosticWord(diagnosticWord);
    });
    host.querySelector("#spelling-diagnostic-input")?.addEventListener("input", (event) => {
      spelling.diagnostic.currentInput = event.target.value;
    });
    host.querySelector("#spelling-diagnostic-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSpellingDiagnosticWord(subject, event.currentTarget.value);
        render();
        if (!getSubjectSpellingState(subject).diagnostic.completed) {
          speakSpellingDiagnosticWord(getSpellingDiagnosticCurrentWord(getSubjectSpellingState(subject)));
        }
      }
    });
    host.querySelector("#spelling-diagnostic-input")?.addEventListener("blur", () => {
      persistSubjects();
    });
    host.querySelector("[data-spelling-submit-diagnostic]")?.addEventListener("click", () => {
      submitSpellingDiagnosticWord(subject, host.querySelector("#spelling-diagnostic-input")?.value || "");
      render();
      if (!getSubjectSpellingState(subject).diagnostic.completed) {
        speakSpellingDiagnosticWord(getSpellingDiagnosticCurrentWord(getSubjectSpellingState(subject)));
      }
    });
    return;
  }

  let stageBody = "";

  if (showingCelebration) {
    const celebrationCopy = getSpellingCelebrationCopy(stageId);
    stageBody = `
      <article class="spelling-stage-card spelling-stage-card--single spelling-stage-card--celebration">
        <p class="eyebrow">${escapeHtml(celebrationCopy.eyebrow)}</p>
        <div class="spelling-ribbon-badge">Ribbon unlocked</div>
        <h4>${escapeHtml(celebrationCopy.title)}</h4>
        <p>${escapeHtml(celebrationCopy.body)}</p>
        <div class="spelling-stage-actions spelling-stage-actions--centered">
          <button type="button" class="primary-button primary-button--dark" data-spelling-continue-stage="true">${escapeHtml(celebrationCopy.action)}</button>
        </div>
      </article>
    `;
  } else if (stageId === "diagnostic") {
    stageBody = `
      <article class="spelling-stage-card spelling-stage-card--single">
        <div class="spelling-card__header">
          <div>
            <p class="eyebrow">Stage 1</p>
            <h4>Diagnostic review</h4>
          </div>
          <span class="spelling-card__status is-complete">Ribbon earned</span>
        </div>
        <p>The baseline is complete. Review the diagnostic result before moving back through earlier stages.</p>
        <div class="spelling-stage-meta spelling-stage-meta--single">
          <span>${escapeHtml(`${getSpellingDiagnosticCorrectCount(spelling)} of ${SPELLING_DIAGNOSTIC_WORDS.length} correct`)}</span>
          <span>${escapeHtml(`${focusSummary.length} focus area${focusSummary.length === 1 ? "" : "s"} identified`)}</span>
        </div>
        <div class="spelling-review-summary">
          ${focusSummary.map((entry) => `
            <article class="spelling-review-summary__row">
              <strong>${escapeHtml(SPELLING_FOCUS_LABELS[entry.id] || entry.id)}</strong>
              <span>${escapeHtml(`${entry.count} miss${entry.count === 1 ? "" : "es"}`)}</span>
            </article>
          `).join("")}
        </div>
        <div class="spelling-stage-actions">
          <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="diagnostic">Reset stage</button>
        </div>
      </article>
    `;
  } else if (stageId === "looks-right") {
    const currentLookWord = getSpellingLooksRightCurrentWord(spelling);
    const answeredLookCount = followUpWords.filter((entry) => Boolean(spelling.looksRight.answers[entry.id])).length;
    const currentLookOptions = currentLookWord
      ? (() => {
          const options = [
            [
              currentLookWord.word,
              buildSpellingLooksRightChoiceSentence(
                getSpellingLooksRightSentence(currentLookWord),
                currentLookWord.word,
                currentLookWord.lookRightChoiceCorrect || currentLookWord.articulation
              )
            ],
            [
              currentLookWord.lookRightWrong,
              buildSpellingLooksRightChoiceSentence(
                getSpellingLooksRightSentence(currentLookWord),
                currentLookWord.word,
                currentLookWord.lookRightChoiceWrong || currentLookWord.lookRightWrong
              )
            ]
          ];
          return shouldSpellingLooksRightShowCorrectFirst(currentLookWord.id) ? options : [options[1], options[0]];
        })()
      : [];
    stageBody = spelling.looksRight.completed
      ? `
        <article class="spelling-stage-card spelling-stage-card--single">
          <div class="spelling-card__header">
            <div>
              <p class="eyebrow">Stage 2</p>
              <h4>Sentence check review</h4>
            </div>
            <span class="spelling-card__status is-complete">Ribbon earned</span>
          </div>
          <p>These are the sentence choices you worked through in this stage.</p>
          <div class="spelling-review-summary">
            ${followUpWords.map((entry) => `
              <article class="spelling-review-summary__row${spelling.looksRight.answers[entry.id] === entry.word ? " is-correct" : " is-incorrect"}">
                <strong>${escapeHtml(entry.word)}</strong>
                <span>${escapeHtml(spelling.looksRight.answers[entry.id] || "No answer saved")}</span>
              </article>
            `).join("")}
          </div>
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="looks-right">Reset stage</button>
          </div>
        </article>
      `
      : `
        <article class="spelling-stage-card spelling-stage-card--single">
          <div class="spelling-card__header">
            <div>
              <p class="eyebrow">Stage 2</p>
              <h4>Which word looks right?</h4>
            </div>
            <span class="spelling-card__status">Ribbon available</span>
          </div>
          <p>Read the sentence, then click the version that looks right. The target word is written inside each sentence with the sound splits visible.</p>
          <div class="spelling-stage-meta spelling-stage-meta--single">
            <span>Sentence ${escapeHtml(String(Math.min(answeredLookCount + 1, followUpWords.length)))} of ${escapeHtml(String(followUpWords.length))}</span>
            <span>${escapeHtml(`${answeredLookCount} answered`)}</span>
          </div>
          ${currentLookWord ? `
            <article class="spelling-comparison-card spelling-comparison-card--single">
              <div class="spelling-comparison-card__top">
                <strong>Sentence check</strong>
                <span>${escapeHtml((currentLookWord.focuses || []).map((focusId) => SPELLING_FOCUS_LABELS[focusId] || focusId).join(" · "))}</span>
              </div>
              <p class="spelling-comparison-card__prompt">Which sentence looks right?</p>
              <div class="spelling-choice-row spelling-choice-row--stacked">
                ${currentLookOptions
                  .map(
                    ([value, sentenceChoice]) => `
                      <button
                        type="button"
                        class="spelling-choice spelling-choice--sentence spelling-choice--sentence-large"
                        data-spelling-looks-right-word="${currentLookWord.id}"
                        data-spelling-looks-right-value="${value}"
                      >
                        <span>${sentenceChoice}</span>
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </article>
          ` : ""}
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="looks-right">Reset stage</button>
          </div>
        </article>
      `;
  } else if (stageId === "word-families") {
    const flashcardWords = getSpellingFlashcardWords(spelling);
    const currentFlashcardWord = getSpellingFlashcardCurrentWord(spelling);
    const currentFlashcardCard = currentFlashcardWord ? ensureSpellingFlashcardCard(spelling, currentFlashcardWord.id) : null;
    const currentFlashcardSentenceIndex = currentFlashcardCard
      ? Math.max(0, Math.min(currentFlashcardCard.exposureIndex, (currentFlashcardWord?.familySentences || []).length - 1))
      : 0;
    const currentFlashcardSentence = currentFlashcardWord?.familySentences?.[currentFlashcardSentenceIndex] || "";
    const currentFlashcardSentenceWord = currentFlashcardWord?.familyWords?.[currentFlashcardSentenceIndex] || "";
    stageBody = spelling.flashcards.completed
      ? `
        <article class="spelling-stage-card spelling-stage-card--single">
          <div class="spelling-card__header">
            <div>
              <p class="eyebrow">Stage 3</p>
              <h4>Word family review</h4>
            </div>
            <span class="spelling-card__status is-complete">Ribbon earned</span>
          </div>
          <p>These are the key words you completed in the word-family sentence loop.</p>
          <div class="spelling-review-summary">
            ${flashcardWords.map((entry) => `
              <article class="spelling-review-summary__row is-correct">
                <strong>${escapeHtml(entry.word)}</strong>
                <span>3 family sentences heard · key word recalled</span>
              </article>
            `).join("")}
          </div>
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="word-families">Reset stage</button>
          </div>
        </article>
      `
      : `
        <article class="spelling-stage-card spelling-stage-card--single">
          <div class="spelling-card__header">
            <div>
              <p class="eyebrow">Stage 3</p>
              <h4>Word family sentence loop</h4>
            </div>
            <span class="spelling-card__status">Ribbon available</span>
          </div>
          <p>Start with the key word, open one family sentence at a time, then type the key word from memory after the third sentence.</p>
          ${currentFlashcardWord ? `
            <div class="spelling-stage-meta spelling-stage-meta--single">
              <span>Word ${escapeHtml(String(flashcardWords.filter((entry) => ensureSpellingFlashcardCard(spelling, entry.id).completed).length + 1))} of ${escapeHtml(String(flashcardWords.length))}</span>
              <span>${escapeHtml(`${currentFlashcardCard?.exposureIndex || 0} of 3 sentences heard`)}</span>
            </div>
            <article class="spelling-tense-card spelling-tense-card--single${currentFlashcardCard?.checked ? (currentFlashcardCard.completed ? " is-correct" : " is-incorrect") : ""}">
              ${currentFlashcardCard?.exposureIndex < 3 ? `
                ${currentFlashcardCard?.isShowingSentence ? `
                  <div class="spelling-family-sentence-card spelling-family-sentence-card--active">
                    <p class="spelling-family-sentence-label">Sentence ${escapeHtml(String((currentFlashcardCard?.exposureIndex || 0) + 1))} of 3</p>
                    <p>${buildSpellingFamilySentenceMarkup(currentFlashcardSentence, currentFlashcardSentenceWord)}</p>
                  </div>
                ` : `
                  <div class="spelling-family-keyword-panel">
                    <button
                      type="button"
                      class="spelling-keyword-button"
                      data-spelling-flashcard-reveal="${currentFlashcardWord.id}"
                      ${currentFlashcardCard?.isShowingSentence ? "disabled" : ""}
                    >
                      ${escapeHtml(currentFlashcardWord.word)}
                    </button>
                    <p class="spelling-stage-note spelling-stage-note--centered">Click the key word to open the next sentence.</p>
                  </div>
                `}
              ` : `
                <div class="spelling-family-recall">
                  <input
                    class="reader-editor spelling-inline-input spelling-inline-input--centered"
                    type="text"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    value="${escapeHtml(currentFlashcardCard?.typedValue || "")}"
                    placeholder="Type the key word from memory"
                    data-spelling-flashcard-input="${currentFlashcardWord.id}"
                  />
                  <div class="spelling-stage-actions spelling-stage-actions--compact">
                    <button type="button" class="primary-button primary-button--dark" data-spelling-flashcard-submit="${currentFlashcardWord.id}">Check word</button>
                  </div>
                  ${currentFlashcardCard?.checked ? `<p class="spelling-choice-feedback${currentFlashcardCard.completed ? " is-correct" : " is-incorrect"}">${escapeHtml(currentFlashcardCard.completed ? "Correct. The key word held after the sentence clues." : `Retry ${currentFlashcardWord.word}.`)}</p>` : ""}
                </div>
              `}
            </article>
          ` : ""}
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="word-families">Reset stage</button>
          </div>
        </article>
      `;
  } else {
    const currentFamilyWord = getSpellingTenseCurrentWord(spelling);
    const currentFamilyAnswer = currentFamilyWord ? ensureSpellingTenseAnswer(spelling, currentFamilyWord.id) : null;
    const currentFamilySentenceIndex = currentFamilyAnswer
      ? Math.max(0, Math.min(currentFamilyAnswer.exposureIndex, (currentFamilyWord?.familySentences || []).length - 1))
      : 0;
    const currentFamilySentence = currentFamilyWord?.familySentences?.[currentFamilySentenceIndex] || "";
    const currentFamilySentenceWord = currentFamilyWord?.familyWords?.[currentFamilySentenceIndex] || "";
    stageBody = spelling.tenseTransfer.completed
      ? `
        <article class="spelling-stage-card spelling-stage-card--single">
          <div class="spelling-card__header">
            <div>
              <p class="eyebrow">Stage 4</p>
              <h4>Final review</h4>
            </div>
            <span class="spelling-card__status is-complete">Ribbon earned</span>
          </div>
          <p>The final sentence recall stage is complete.</p>
          <div class="spelling-review-summary">
            ${followUpWords.map((entry) => `
              <article class="spelling-review-summary__row is-correct">
                <strong>${escapeHtml(entry.word)}</strong>
                <span>3 family sentences heard · key word recalled</span>
              </article>
            `).join("")}
          </div>
          <article class="spelling-complete-card">
            <p class="eyebrow">Complete</p>
            <h4>All four ribbons earned</h4>
            <p>The diagnostic, visual check, word family work, and family sentence recall are all complete. Keep the same words in review on ${escapeHtml(SPELLING_UNIT_SEED.reviewDays.join(", "))}.</p>
          </article>
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="tense-transfer">Reset stage</button>
          </div>
        </article>
      `
      : `
        <article class="spelling-stage-card spelling-stage-card--single">
          <div class="spelling-card__header">
            <div>
              <p class="eyebrow">Stage 4</p>
              <h4>Family sentence recall</h4>
            </div>
            <span class="spelling-card__status">Final ribbon</span>
          </div>
          <p>Open the keyword, hear three family sentences one at a time, then type the keyword from memory.</p>
          ${currentFamilyWord ? `
            <div class="spelling-stage-meta spelling-stage-meta--single">
              <span>Word ${escapeHtml(String(followUpWords.filter((entry) => ensureSpellingTenseAnswer(spelling, entry.id).completed).length + 1))} of ${escapeHtml(String(followUpWords.length))}</span>
              <span>${escapeHtml(`${currentFamilyAnswer?.exposureIndex || 0} of 3 sentences heard`)}</span>
            </div>
            <article class="spelling-tense-card spelling-tense-card--single${currentFamilyAnswer?.checked ? (currentFamilyAnswer.completed ? " is-correct" : " is-incorrect") : ""}">
              ${currentFamilyAnswer?.exposureIndex < 3 ? `
                ${currentFamilyAnswer?.isShowingSentence ? `
                  <div class="spelling-family-sentence-card spelling-family-sentence-card--active">
                    <p class="spelling-family-sentence-label">Sentence ${escapeHtml(String((currentFamilyAnswer?.exposureIndex || 0) + 1))} of 3</p>
                    <p>${buildSpellingFamilySentenceMarkup(currentFamilySentence, currentFamilySentenceWord)}</p>
                  </div>
                ` : `
                  <div class="spelling-family-keyword-panel">
                    <button
                      type="button"
                      class="spelling-keyword-button"
                      data-spelling-family-reveal="${currentFamilyWord.id}"
                      ${currentFamilyAnswer?.isShowingSentence ? "disabled" : ""}
                    >
                      ${escapeHtml(currentFamilyWord.word)}
                    </button>
                    <p class="spelling-stage-note spelling-stage-note--centered">Click the key word to open the next sentence.</p>
                  </div>
                `}
              ` : `
                <div class="spelling-family-recall">
                  <input
                    class="reader-editor spelling-inline-input spelling-inline-input--centered"
                    type="text"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    value="${escapeHtml(currentFamilyAnswer?.typedValue || "")}"
                    placeholder="Type the key word from memory"
                    data-spelling-family-input="${currentFamilyWord.id}"
                  />
                  <div class="spelling-stage-actions spelling-stage-actions--compact">
                    <button type="button" class="primary-button primary-button--dark" data-spelling-family-submit="${currentFamilyWord.id}">Check word</button>
                  </div>
                  ${currentFamilyAnswer?.checked ? `<p class="spelling-choice-feedback${currentFamilyAnswer.completed ? " is-correct" : " is-incorrect"}">${escapeHtml(currentFamilyAnswer.completed ? "Correct. The key word held after the sentence clues." : `Retry ${currentFamilyWord.word}.`)}</p>` : ""}
                </div>
              `}
            </article>
          ` : ""}
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="tense-transfer">Reset stage</button>
          </div>
        </article>
      `;
  }

  host.innerHTML = `
    <section class="spelling-shell" data-spelling-font="${escapeHtml(spelling.preferences.font)}" data-spelling-spacing="${escapeHtml(spelling.preferences.spacing)}" data-spelling-tint="${escapeHtml(spelling.preferences.tint)}">
      <article class="spelling-stage-header">
        <div>
          <p class="eyebrow">Spelling</p>
          <div class="spelling-hero__title-row">
            <h3>${escapeHtml(SPELLING_UNIT_SEED.title)}</h3>
            <span class="spelling-hero__stage">Stage ${escapeHtml(String(stageIndex + 1))} · ${escapeHtml(SPELLING_STAGE_LABELS[stageId])}</span>
          </div>
          <p>${escapeHtml(SPELLING_UNIT_SEED.intro)}</p>
        </div>
        <div class="spelling-progress-copy spelling-progress-copy--compact">
          <strong>${escapeHtml(`${completedCount}/${totalCount} ribbons earned`)}</strong>
          <span>${escapeHtml(`${masteryPercent}% complete`)}</span>
          <div class="spelling-stage-actions spelling-stage-actions--compact">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-unit="true">Reset all stages</button>
          </div>
        </div>
      </article>

      <section class="spelling-stage-nav">
        <button
          type="button"
          class="ghost-button ghost-button--small"
          data-spelling-open-stage="${stageIndex > 0 ? SPELLING_STAGE_ORDER[stageIndex - 1] : ""}"
          ${stageIndex > 0 ? "" : "disabled"}
        >
          Previous stage
        </button>
        ${stageId !== currentStageId ? `
          <button type="button" class="ghost-button ghost-button--small" data-spelling-open-stage="${currentStageId}">
            Return to current stage
          </button>
        ` : ""}
      </section>

      <section class="spelling-stage-rail" aria-label="Spelling stages">
        ${SPELLING_STAGE_ORDER
          .map(
            (levelId, index) => `
              <button
                type="button"
                class="spelling-stage-pill${index < completedCount ? " is-complete" : ""}${levelId === stageId ? " is-current" : ""}"
                data-spelling-open-stage="${levelId}"
                ${index <= unlockedStageIndex ? "" : "disabled"}
              >
                <span>${index + 1}</span>
                <strong>${escapeHtml(SPELLING_STAGE_LABELS[levelId])}</strong>
              </button>
            `
          )
          .join("")}
      </section>

      ${focusSummary.length ? `
        <section class="spelling-focus-summary">
          ${focusSummary
            .map(
              (entry) => `
                <article class="spelling-focus-card">
                  <strong>${escapeHtml(SPELLING_FOCUS_LABELS[entry.id] || entry.id)}</strong>
                  <span>${escapeHtml(`${entry.count} diagnostic miss${entry.count === 1 ? "" : "es"}`)}</span>
                </article>
              `
            )
            .join("")}
        </section>
      ` : ""}

      <article class="spelling-coach-card">
        <span class="spelling-coach-card__icon">Aa</span>
        <div>
          <strong>Current focus</strong>
          <p>${escapeHtml(spelling.coachMessage)}</p>
        </div>
      </article>

      ${stageBody}

      <section class="spelling-review-strip">
        <article class="spelling-review-card">
          <p class="eyebrow">Review rhythm</p>
          <h4>Spaced practice</h4>
          <div class="spelling-review-card__days">
            ${SPELLING_UNIT_SEED.reviewDays
              .map((dayLabel, index) => `<span class="${index <= completedCount ? "is-done" : index === completedCount + 1 ? "is-next" : ""}">${escapeHtml(dayLabel)}</span>`)
              .join("")}
          </div>
        </article>
        <article class="spelling-review-card spelling-review-card--skills">
          <p class="eyebrow">Target words</p>
          <h4>Words carrying through the sequence</h4>
          <div class="spelling-skill-list">
            ${followUpWords.map((entry) => `<span class="spelling-skill">${escapeHtml(entry.word)}</span>`).join("")}
          </div>
        </article>
      </section>
    </section>
  `;

  host.querySelector("[data-spelling-reset-unit]")?.addEventListener("click", () => {
    subject.spelling = createDefaultSpellingState(subject.id);
    persistSubjects();
    render();
  });

  host.querySelector("[data-spelling-continue-stage]")?.addEventListener("click", () => {
    continueSpellingStage(subject);
    render();
  });

  host.querySelectorAll("[data-spelling-open-stage]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.dataset.spellingOpenStage) {
        return;
      }
      setSpellingSelectedStage(subject, button.dataset.spellingOpenStage);
      render();
    });
  });

  host.querySelectorAll("[data-spelling-reset-activity]").forEach((button) => {
    button.addEventListener("click", () => {
      resetSpellingActivity(subject, button.dataset.spellingResetActivity);
      render();
    });
  });

  host.querySelectorAll("[data-spelling-looks-right-word]").forEach((button) => {
    button.addEventListener("click", () => {
      selectSpellingLooksRightAnswer(subject, button.dataset.spellingLooksRightWord, button.dataset.spellingLooksRightValue);
      render();
    });
  });

  host.querySelectorAll("[data-spelling-flashcard-reveal]").forEach((button) => {
    button.addEventListener("click", () => {
      revealSpellingFlashcardSentence(subject, button.dataset.spellingFlashcardReveal);
    });
  });

  host.querySelectorAll("[data-spelling-flashcard-input]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const card = ensureSpellingFlashcardCard(spelling, input.dataset.spellingFlashcardInput);
      card.typedValue = event.target.value;
      card.checked = false;
      persistSubjects();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSpellingFlashcardRecall(subject, input.dataset.spellingFlashcardInput, event.target.value);
        render();
      }
    });
    input.addEventListener("blur", () => {
      persistSubjects();
    });
  });

  host.querySelectorAll("[data-spelling-flashcard-submit]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = host.querySelector(`[data-spelling-flashcard-input="${button.dataset.spellingFlashcardSubmit}"]`);
      submitSpellingFlashcardRecall(subject, button.dataset.spellingFlashcardSubmit, input?.value || "");
      render();
    });
  });

  host.querySelectorAll("[data-spelling-family-reveal]").forEach((button) => {
    button.addEventListener("click", () => {
      revealSpellingFamilySentence(subject, button.dataset.spellingFamilyReveal);
    });
  });

  host.querySelectorAll("[data-spelling-family-input]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const answer = ensureSpellingTenseAnswer(spelling, input.dataset.spellingFamilyInput);
      answer.typedValue = event.target.value;
      answer.checked = false;
      persistSubjects();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSpellingFamilyRecall(subject, input.dataset.spellingFamilyInput, event.target.value);
        render();
      }
    });
    input.addEventListener("blur", () => {
      persistSubjects();
    });
  });

  host.querySelectorAll("[data-spelling-family-submit]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = host.querySelector(`[data-spelling-family-input="${button.dataset.spellingFamilySubmit}"]`);
      submitSpellingFamilyRecall(subject, button.dataset.spellingFamilySubmit, input?.value || "");
      render();
    });
  });
}

function renderPractice() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  const homeworkBundles = getSubjectHomeworkBundles(subject);
  if (!homeworkBundles.length) {
    elements.practiceList.innerHTML = `<div class="empty-state">No homework items for this subject yet.</div>`;
    if (elements.subjectHomeworkUpcomingList) {
      elements.subjectHomeworkUpcomingList.innerHTML = `<div class="empty-state empty-state--compact">Nothing else is queued for this week.</div>`;
    }
    renderSubjectsHero();
    renderDockContext();
    return;
  }

  const focusBundle = homeworkBundles[0];
  const nextBundles = homeworkBundles.slice(1);
  const focusSteps = buildHomeworkTaskSteps(focusBundle);
  const readPrompt = `Read this homework aloud and help me understand the instructions: ${focusBundle.title}`;
  const simplifyPrompt = `Simplify the homework task and explain it in smaller steps: ${focusBundle.title}\n\n${focusBundle.content || ""}`;
  const focusDocument = focusBundle.documents[0] || null;
  const isReadingHomework = currentAudioContext === `task:homework:${focusBundle.id}`;
  const focusStatusLabel = getBundleWorkNotes(focusBundle) ? "In progress" : "Start here";

  elements.practiceList.innerHTML = `
    <article class="homework-focus-card">
      <div class="homework-focus-card__header">
        <div>
          <p class="eyebrow">Homework · in progress</p>
          <h3>${escapeHtml(focusBundle.title)}</h3>
        </div>
        <span class="homework-focus-card__due">${escapeHtml(focusStatusLabel)}</span>
      </div>
      <div class="homework-focus-card__chips">
        <span class="homework-focus-card__chip">${escapeHtml(`${focusBundle.documents[0]?.type || "Class notes"} · ${focusBundle.documents.length > 1 ? `${focusBundle.documents.length} pp` : "linked note"}`)}</span>
        <span class="homework-focus-card__chip homework-focus-card__chip--mint">~${estimateTaskMinutes(focusBundle.content || getBundleWorkNotes(focusBundle))} min</span>
        <span class="homework-focus-card__chip homework-focus-card__chip--lilac">${escapeHtml(getBundleWorkNotes(focusBundle) ? "Workbook submission" : "Need a first draft")}</span>
      </div>
      <div class="homework-focus-card__panda-row">
        <div>
          <strong>Panda broke this into steps</strong>
          <span>Tap any step to mark complete</span>
        </div>
        <button type="button" class="task-inline-link" data-homework-simplify="${focusBundle.id}">↯ Re-simplify</button>
      </div>
      <div class="homework-focus-card__steps">
        ${focusSteps
          .map(
            (step) => `
              <article class="homework-step${step.active ? " homework-step--active" : ""}${step.done ? " homework-step--done" : ""}">
                <span class="homework-step__check">${step.done ? "✓" : ""}</span>
                <span class="homework-step__label">${escapeHtml(step.label)}</span>
                ${step.active ? '<span class="homework-step__tag">YOU&#39;RE HERE</span>' : ""}
              </article>
            `
          )
          .join("")}
      </div>
      <div class="homework-focus-card__actions">
        <button type="button" class="primary-button primary-button--dark" data-homework-readaloud="${focusBundle.id}">${isReadingHomework ? "■ Stop reading" : "▶ Read task aloud"}</button>
        <button type="button" class="ghost-button ghost-button--peach" data-homework-simplify="${focusBundle.id}">↯ Simplify this task</button>
        <button type="button" class="ghost-button ghost-button--mint" data-open-homework-reader="${focusBundle.id}">📖 Open in Reader</button>
        <button type="button" class="ghost-button ghost-button--danger" data-delete-homework="${focusBundle.id}">Delete homework</button>
      </div>
    </article>
  `;

  if (elements.subjectHomeworkUpcomingCount) {
    elements.subjectHomeworkUpcomingCount.textContent = String(nextBundles.length);
  }
  if (elements.subjectHomeworkUpcomingList) {
    elements.subjectHomeworkUpcomingList.innerHTML = nextBundles.length
      ? nextBundles
          .map(
            (bundle, index) => `
              <article class="task-stack-item task-stack-item--${["yellow", "lilac"][index % 2]}">
                <button type="button" class="task-stack-item__open" data-open-homework="${bundle.id}">
                  <span class="task-stack-item__eyebrow">${escapeHtml(`${getSubjectShortCode(subject.name)} · HW`)}</span>
                  <strong>${escapeHtml(bundle.title)}</strong>
                  <span>${escapeHtml(getBundleWorkNotes(bundle) ? "Writing started" : "Needs a draft")}</span>
                </button>
                <div class="task-stack-item__actions">
                  <button type="button" class="assessment-action" data-open-homework="${bundle.id}">Open</button>
                  <button type="button" class="assessment-action assessment-action--danger" data-delete-homework="${bundle.id}">Delete</button>
                </div>
              </article>
            `
          )
          .join("")
      : `<div class="empty-state empty-state--compact">Nothing else is queued for this week.</div>`;
  }
  if (elements.subjectRevisionGradePill) {
    elements.subjectRevisionGradePill.textContent = formatGradeLabel(state.studentGrade);
  }

  elements.practiceList.querySelectorAll("[data-open-homework]").forEach((button) => {
    button.addEventListener("click", () => {
      openTaskView({ kind: "homework", id: button.dataset.openHomework });
    });
  });
  elements.practiceList.querySelectorAll("[data-homework-readaloud]").forEach((button) => {
    button.addEventListener("click", () => {
      const audioContext = `task:homework:${focusBundle.id}`;
      if (currentAudioContext === audioContext) {
        stopListening();
        renderPractice();
        return;
      }
      speakTextWithOpenAi([focusBundle.title, focusBundle.content || "", getBundleWorkNotes(focusBundle) || ""].filter(Boolean).join(". "), {
        context: audioContext,
        statusMessages: {
          preparing: "Preparing homework audio...",
          playing: "Reading homework...",
          error: "Homework audio failed."
        }
      })
        .then(() => {
          renderPractice();
        })
        .catch((error) => {
          console.error("Homework audio failed.", error);
          renderPractice();
        });
      renderPractice();
    });
  });
  elements.practiceList.querySelectorAll("[data-homework-simplify]").forEach((button) => {
    button.addEventListener("click", async () => {
      const subject = getSelectedSubject();
      if (!focusDocument || !subject) {
        return;
      }
      state.taskAskStatus = "Breaking this into steps...";
      renderPractice();
      try {
        await simplifyHomeworkBundle(focusBundle, subject);
      } catch (error) {
        state.taskAskStatus = error instanceof Error ? `Ask Panda failed: ${error.message}` : "Ask Panda failed.";
      }
      renderPractice();
    });
  });
  elements.practiceList.querySelectorAll("[data-open-homework-reader]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!focusDocument) {
        return;
      }
      state.selectedDocumentId = focusDocument.id;
      state.askDocumentId = focusDocument.id;
      state.activeSubjectTab = "reader";
      render();
    });
  });
  elements.practiceList.querySelectorAll("[data-delete-homework]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteHomeworkBundle(button.dataset.deleteHomework);
    });
  });
  elements.subjectHomeworkUpcomingList?.querySelectorAll("[data-open-homework]").forEach((button) => {
    button.addEventListener("click", () => {
      openTaskView({ kind: "homework", id: button.dataset.openHomework });
    });
  });
  elements.subjectHomeworkUpcomingList?.querySelectorAll("[data-delete-homework]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteHomeworkBundle(button.dataset.deleteHomework);
    });
  });

  renderSubjectsHero();
  renderDockContext();
}

async function handleAsk() {
  const subject = getSelectedSubject();
  const document = getAskDocument() || getSelectedDocument();
  if (!subject) {
    return;
  }

  const question = elements.askInput.value.trim();
  if (!question) {
    elements.askResponse.textContent = "Write a question first so the AI can focus on what you need help with.";
    return;
  }

  elements.askButton.disabled = true;
  elements.askResponse.textContent = "Thinking...";

  let answer = "";
  try {
    answer = await requestAskAnswer(question, subject, document);
  } catch (error) {
    elements.askResponse.textContent =
      error instanceof Error ? `Ask AI failed: ${error.message}` : "Ask AI failed.";
    elements.askButton.disabled = false;
    return;
  }

  subject.askHistory = Array.isArray(subject.askHistory) ? subject.askHistory : [];
  subject.askHistory.push({
    id: createId(),
    dateKey: currentDateKey(),
    question,
    answer
  });
  persistSubjects();
  elements.askResponse.textContent = answer;
  elements.askInput.value = "";
  elements.askButton.disabled = false;
  renderAskContext();
}

function handleAskMicToggle() {
  if (state.askMicActive) {
    stopAskMicrophone();
    return;
  }
  startAskMicrophone();
}

function handleAskListen() {
  if (state.askResponseSpeaking) {
    stopListening();
    return;
  }

  const latestAnswer = getLatestAskAnswer();
  if (!latestAnswer) {
    elements.askResponse.textContent = "Ask a question first so there is an AI response to play back.";
    renderAskVoiceControls();
    return;
  }

  speakTextWithOpenAi(latestAnswer, {
    context: "ask",
    statusMessages: {
      preparing: "Preparing Panda's answer...",
      playing: "Playing Panda's answer...",
      error: "AI voice playback failed for this answer."
    }
  }).catch((error) => {
    console.error("OpenAI speech failed.", error);
    stopListening();
    elements.askResponse.textContent =
      error instanceof Error ? `Listen failed: ${error.message}` : "Listen failed.";
  });
}

function formatDate() {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short"
  }).format(new Date());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `doc-${window.crypto.randomUUID()}`;
  }

  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDocumentRecord({ title, type, content }) {
  return {
    id: createId(),
    title,
    type,
    added: formatDate(),
    addedAt: new Date().toISOString(),
    content,
    uploadGroupId: null,
    originalFile: null,
    previewImageUrl: null,
    reviewed: false,
    reviewMode: "",
    pages: [],
    studyOverview: "",
    studyPlanStatus: "idle",
    studySections: [],
    completedSectionIds: [],
    currentSectionIndex: 0,
    importantTerms: [],
    endQuiz: null,
    quizSubmission: null,
    pointsAwarded: false,
    flags: {
      classNotes: false,
      assessment: false,
      homework: false
    }
  };
}

function normaliseStudySection(section, index) {
  return {
    id: String(section?.id || `section-${index + 1}`).trim(),
    title: String(section?.title || `Section ${index + 1}`).trim(),
    summary: String(section?.summary || "").trim(),
    sectionText: String(section?.sectionText || "").trim(),
    pageStart: Number(section?.pageStart || 0) || null,
    pageEnd: Number(section?.pageEnd || 0) || null,
    importantTerms: Array.isArray(section?.importantTerms)
      ? section.importantTerms.map((term) => String(term || "").trim()).filter(Boolean)
      : []
  };
}

function normaliseStudyQuiz(quiz) {
  if (!quiz || typeof quiz !== "object") {
    return null;
  }

  const questions = Array.isArray(quiz.questions)
    ? quiz.questions
        .map((question, index) => ({
          id: String(question?.id || `quiz-${index + 1}`).trim(),
          prompt: String(question?.prompt || "").trim(),
          options: Array.isArray(question?.options)
            ? question.options.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4)
            : [],
          correctOption: String(question?.correctOption || "").trim(),
          explanation: String(question?.explanation || "").trim()
        }))
        .filter(
          (question) =>
            question.prompt &&
            question.options.length === 4 &&
            question.correctOption &&
            question.options.includes(question.correctOption)
        )
    : [];

  if (!questions.length) {
    return null;
  }

  return {
    title: String(quiz.title || "Quick check").trim(),
    passingScore: Math.max(1, Math.min(questions.length, Number(quiz.passingScore || 3) || 3)),
    questions
  };
}

function summariseSectionText(value, maxLength = 180) {
  const text = normaliseWhitespace(value);
  if (!text) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  const sentence = text.slice(0, maxLength).match(/^(.+?[.!?])(?:\s|$)/);
  if (sentence?.[1]) {
    return sentence[1];
  }
  return `${text.slice(0, maxLength).trim()}…`;
}

function buildFallbackStudyPlan(documentRecord) {
  const sourceText = String(documentRecord.content || "").trim();
  const pages = Array.isArray(documentRecord.pages) ? documentRecord.pages : [];
  const usablePages = pages
    .map((page, index) => ({
      pageNumber: Number(page?.pageNumber || index + 1) || index + 1,
      text: getDocumentPageText(page)
    }))
    .filter((page) => page.text);
  const rawSections = usablePages.length
    ? (() => {
        const targetSectionCount = Math.min(7, Math.max(3, Math.ceil(usablePages.length / 12)));
        const chunkSize = Math.max(1, Math.ceil(usablePages.length / targetSectionCount));
        return Array.from({ length: Math.ceil(usablePages.length / chunkSize) }, (_, index) => {
          const group = usablePages.slice(index * chunkSize, (index + 1) * chunkSize);
          const startPage = group[0]?.pageNumber || 1;
          const endPage = group[group.length - 1]?.pageNumber || startPage;
          const sectionText = group.map((page) => page.text).join("\n\n");
          return {
            title: startPage === endPage ? `Page ${startPage}` : `Pages ${startPage}-${endPage}`,
            summary: summariseSectionText(sectionText),
            sectionText,
            pageStart: startPage,
            pageEnd: endPage
          };
        }).filter((section) => section.sectionText);
      })()
    : [{ title: "Overview", summary: summariseSectionText(sourceText), sectionText: sourceText, pageStart: null, pageEnd: null }];

  const usableSections = rawSections
    .map((section, index) => normaliseStudySection({
      id: `section-${index + 1}`,
      title: section.title,
      summary: section.summary || "",
      sectionText: section.sectionText || sourceText,
      pageStart: section.pageStart,
      pageEnd: section.pageEnd,
      importantTerms: extractImportantTermsFromText(section.sectionText || sourceText).slice(0, 8)
    }, index))
    .filter((section) => section.sectionText);

  const sections = usableSections.length
    ? usableSections
    : [normaliseStudySection({
        id: "section-1",
        title: "Overview",
        summary: "",
        sectionText: sourceText || "No readable text is available for this document yet.",
        importantTerms: []
      }, 0)];

  const quizTerms = extractImportantTermsFromText(sourceText).slice(0, 4);
  const quiz = normaliseStudyQuiz({
    title: `${documentRecord.title} quick check`,
    passingScore: Math.min(3, Math.max(1, quizTerms.length || 3)),
    questions: (quizTerms.length ? quizTerms : ["main idea", "key example", "important term", "summary"]).slice(0, 4).map((term, index) => ({
      id: `quiz-${index + 1}`,
      prompt: `Which option best matches this document term or focus: ${term}?`,
      options: [
        `The part about ${term}`,
        "An unrelated example",
        "A random detail",
        "Something not in the document"
      ],
      correctOption: `The part about ${term}`,
      explanation: `Look back for the section that explains ${term}.`
    }))
  });

  return {
    overview: "",
    importantTerms: extractImportantTermsFromText(sourceText).slice(0, 20),
    sections,
    quiz
  };
}

function createWholeStudyDocumentRecord(fileName, flags, originalFile, extracted = {}) {
  const sanitizedName = fileName.replace(/\.[^.]+$/, "");
  const pages = Array.isArray(extracted?.pages)
    ? extracted.pages.map((page) => ({
        pageNumber: Number(page?.pageNumber || 0),
        text: String(page?.text || "").trim(),
        imageUrl: page?.imageUrl || null
      }))
    : [];
  const firstPagePreview = pages.find((page) => page.imageUrl)?.imageUrl || null;
  const fullText = String(extracted?.fullText || "").trim();
  const record = createDocumentWithFlags(
    {
      title: sanitizedName,
      type: flags.classNotes ? "Class Notes" : flags.assessment ? "Assessment" : flags.homework ? "Homework" : "Document",
      content: fullText || "No readable text was detected in this document."
    },
    flags
  );
  record.originalFile = originalFile;
  record.previewImageUrl = firstPagePreview;
  record.pages = pages;
  return record;
}

function normaliseWhitespace(value) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

function extractImportantTermsFromText(value, limit = 12) {
  const stopWords = new Set([
    "the", "and", "that", "with", "from", "this", "have", "into", "your", "about", "these", "those",
    "their", "there", "which", "while", "will", "were", "been", "when", "where", "what", "because",
    "should", "would", "could", "them", "they", "then", "than", "each", "also", "using", "used",
    "after", "before", "under", "over", "more", "most", "some", "such", "just", "very", "much",
    "into", "onto", "page", "pages", "term", "week"
  ]);
  const counts = new Map();
  String(value || "")
    .toLowerCase()
    .match(/[a-z][a-z0-9-]{3,}/g)
    ?.forEach((term) => {
      if (stopWords.has(term)) {
        return;
      }
      counts.set(term, (counts.get(term) || 0) + 1);
    });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

function xmlToText(xmlText, tagNames) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");
  const chunks = [];

  tagNames.forEach((tagName) => {
    xml.querySelectorAll(tagName).forEach((node) => {
      const text = normaliseWhitespace(node.textContent || "");
      if (text) {
        chunks.push(text);
      }
    });
  });

  return chunks.join("\n");
}

function extractPdfPageText(items) {
  let currentLine = "";
  let previousY = null;
  const lines = [];

  items.forEach((item) => {
    const value = "str" in item ? item.str : "";
    if (!value.trim()) {
      return;
    }

    const currentY = Math.round(item.transform?.[5] || 0);
    if (previousY !== null && Math.abs(currentY - previousY) > 4) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = value;
    } else {
      currentLine = `${currentLine} ${value}`.trim();
    }
    previousY = currentY;
  });

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.join("\n");
}

function getMeaningfulPdfText(text) {
  return String(text || "")
    .replace(/^Page\s+\d+\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldUseBackendPdfOcr(pdfData) {
  const pages = Array.isArray(pdfData?.pages) ? pdfData.pages : [];
  if (!pages.length) {
    return false;
  }

  const sparsePages = pages.filter((page) => getMeaningfulPdfText(page.text).length < 40).length;
  return sparsePages > 0 && (sparsePages === pages.length || getMeaningfulPdfText(pdfData.fullText).length < pages.length * 30);
}

async function renderPdfPageToDataUrl(page) {
  const viewport = page.getViewport({ scale: 1.25 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}

async function extractPdfData(file) {
  const pdfjsLib = await loadPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages = [];
  let fullText = "";
  let currentIndex = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = extractPdfPageText(textContent.items).trim();
    const imageUrl = await renderPdfPageToDataUrl(page);

    if (pageText) {
      const blockText = `Page ${pageNumber}\n${pageText}`;
      pages.push({
        pageNumber,
        text: blockText,
        imageUrl,
        startIndex: currentIndex,
        endIndex: currentIndex + blockText.length
      });
      fullText += `${fullText ? "\n\n" : ""}${blockText}`;
      currentIndex = fullText.length + 2;
    } else {
      pages.push({
        pageNumber,
        text: "",
        imageUrl,
        startIndex: currentIndex,
        endIndex: currentIndex
      });
    }
  }

  const pdfData = {
    fullText,
    pages
  };

  if (shouldUseBackendPdfOcr(pdfData)) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    try {
      return await requestApiFormData("/api/upload/pdf", formData);
    } catch (error) {
      console.warn("Backend OCR PDF processing failed; using browser-extracted PDF content instead.", error);
      return pdfData;
    }
  }

  return pdfData;
}

async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      const [{ default: pdfWorkerUrl }, pdfjsLibModule] = await Promise.all([
        import("pdfjs-dist/legacy/build/pdf.worker.mjs?url"),
        import("pdfjs-dist/legacy/build/pdf.mjs")
      ]);
      pdfjsLibModule.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      return pdfjsLibModule;
    })().catch((error) => {
      pdfjsLibPromise = null;
      throw error;
    });
  }

  try {
    return await pdfjsLibPromise;
  } catch (error) {
    if (window.location.protocol === "file:") {
      throw new Error(
        "PDF tools did not load in this browser from file://. Run the app from a hosted frontend or local web server so PDFs can be processed reliably."
      );
    }
    throw error;
  }
}

async function loadJsZip() {
  if (!jsZipPromise) {
    jsZipPromise = import("jszip")
      .then((module) => module.default || module)
      .catch((error) => {
        jsZipPromise = null;
        throw error;
      });
  }

  return jsZipPromise;
}

async function extractDocxText(file) {
  const JSZip = await loadJsZip();
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xmlFiles = Object.keys(zip.files).filter((name) =>
    /^word\/(document|header\d+|footer\d+)\.xml$/i.test(name)
  );
  const parts = [];

  for (const fileName of xmlFiles) {
    const xml = await zip.files[fileName].async("string");
    const text = xmlToText(xml, ["w\\:t", "t"]);
    if (text) {
      parts.push(text);
    }
  }

  return parts.join("\n\n");
}

async function extractPptxText(file) {
  const JSZip = await loadJsZip();
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  const slides = [];

  for (const slideName of slideNames) {
    const xml = await zip.files[slideName].async("string");
    const text = xmlToText(xml, ["a\\:t", "t"]);
    const slideNumber = slideName.match(/slide(\d+)\.xml/i)?.[1] || "?";
    if (text) {
      slides.push(`Slide ${slideNumber}\n${text}`);
    }
  }

  return slides.join("\n\n");
}

function splitClassNotesByDate(fileName, textContent, flags, originalFile, pageAssets = []) {
  const sanitizedName = fileName.replace(/\.[^.]+$/, "");
  const dateHeadingPattern =
    /\b((Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?)/gi;
  const matches = [...textContent.matchAll(dateHeadingPattern)];
  const resolvePreviewForIndex = (index) =>
    pageAssets.find((asset) => index >= asset.startIndex && index <= asset.endIndex)?.imageUrl || null;

  if (matches.length <= 1) {
    const record = createDocumentRecord({
        title: sanitizedName,
        type: "Class Notes",
        content: textContent.trim()
      });
    record.flags = { ...record.flags, ...flags };
    record.originalFile = originalFile;
    record.previewImageUrl = resolvePreviewForIndex(0);
    return [record];
  }

  const parts = [];

  matches.forEach((match, index) => {
    const heading = match[1].trim();
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : textContent.length;
    const sectionText = textContent.slice(start, end).trim();

    const record = createDocumentRecord({
        title: `${sanitizedName} - ${heading}`,
        type: "Class Notes",
        content: sectionText
      });
    record.flags = { ...record.flags, ...flags };
    record.originalFile = originalFile;
    record.previewImageUrl = resolvePreviewForIndex(start);
    parts.push(record);
  });

  return parts;
}

function buildAssessmentFromUpload(fileName, dueDate, linkedDocumentIds) {
  const title = fileName.replace(/\.[^.]+$/, "");
  return {
    id: createId(),
    title,
    componentTask: title,
    taskNumber: "Uploaded",
    distributionDate: formatDate(),
    dueDate: dueDate || "TBC",
    weighting: "TBC",
    description: "Assessment added from uploaded document.",
    linkedDocumentIds,
    autoCreated: true,
    completed: false
  };
}

function buildUploadFlags() {
  const selectedType = getSelectedUploadType();
  return {
    selectedType,
    classNotes: selectedType === "classNotes",
    assessment: selectedType === "assessment",
    homework: selectedType === "homework",
    watch: selectedType === "watch"
  };
}

function getAssessmentUploadTarget(subject) {
  const selectedAssessmentId = getSelectedUploadAssessmentId();
  if (!selectedAssessmentId) {
    return null;
  }
  return subject.assessments.find((assessment) => assessment.id === selectedAssessmentId) || null;
}

function getSelectedUploadType() {
  if (elements.uploadClassNotes.checked) {
    return "classNotes";
  }
  if (elements.uploadAssessment.checked) {
    return "assessment";
  }
  if (elements.uploadHomework.checked) {
    return "homework";
  }
  if (elements.uploadWatch.checked) {
    return "watch";
  }
  return "";
}

function createDocumentWithFlags(details, flags) {
  const record = createDocumentRecord(details);
  record.flags = { ...record.flags, ...flags };
  return record;
}

function createPdfPageRecords(fileName, flags, originalFile, pages) {
  const sanitizedName = fileName.replace(/\.[^.]+$/, "");
  const uploadGroupId = createId();
  return pages.map((page) => {
    const record = createDocumentWithFlags(
      {
        title: `${sanitizedName} - Page ${page.pageNumber}`,
        type: flags.classNotes
          ? "Class Notes"
          : flags.assessment
            ? "Assessment"
            : flags.homework
              ? "Homework"
              : "PDF Page",
        content: page.text || `Page ${page.pageNumber}`
      },
      flags
    );
    record.originalFile = originalFile;
    record.previewImageUrl = page.imageUrl;
    record.pageNumber = page.pageNumber;
    record.uploadGroupId = uploadGroupId;
    return record;
  });
}

function createWholePdfRecord(fileName, flags, originalFile, pdfData) {
  const sanitizedName = fileName.replace(/\.[^.]+$/, "");
  const firstPagePreview = Array.isArray(pdfData?.pages) ? pdfData.pages.find((page) => page.imageUrl)?.imageUrl || null : null;
  const fullText = String(pdfData?.fullText || "").trim();
  const record = createDocumentWithFlags(
    {
      title: sanitizedName,
      type: flags.homework ? "Homework" : flags.assessment ? "Assessment" : "PDF",
      content: fullText || "No readable text was detected in this PDF."
    },
    flags
  );
  record.originalFile = originalFile;
  record.previewImageUrl = firstPagePreview;
  return record;
}

function buildOriginalFile(file) {
  return {
    name: file.name,
    mimeType: file.type || "",
    objectUrl: URL.createObjectURL(file),
    kind: detectOriginalKind(file)
  };
}

function detectOriginalKind(file) {
  const lowerName = file.name.toLowerCase();
  if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(lowerName)) {
    return "text";
  }
  if (lowerName.endsWith(".pdf")) {
    return "pdf";
  }
  if (lowerName.endsWith(".docx")) {
    return "docx";
  }
  if (lowerName.endsWith(".pptx")) {
    return "pptx";
  }
  return "file";
}

async function readUploadedDocument(file, flags) {
  const lowerName = file.name.toLowerCase();
  const originalFile = buildOriginalFile(file);

  if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(lowerName)) {
    const text = await file.text();
    const records = [
      createWholeStudyDocumentRecord(file.name, flags, originalFile, {
        fullText: text.trim(),
        pages: []
      })
    ];
    return {
      records
    };
  }

  if (lowerName.endsWith(".pdf")) {
    const pdfData = await extractPdfData(file);
    const records = [createWholeStudyDocumentRecord(file.name, flags, originalFile, pdfData)];
    return {
      records
    };
  }

  if (lowerName.endsWith(".docx")) {
    const content = await extractDocxText(file);
    const records = [
      createWholeStudyDocumentRecord(file.name, flags, originalFile, {
        fullText: content || "No readable text was detected in this document.",
        pages: []
      })
    ];
    return {
      records
    };
  }

  if (lowerName.endsWith(".pptx")) {
    const content = await extractPptxText(file);
    const records = [
      createWholeStudyDocumentRecord(file.name, flags, originalFile, {
        fullText: content || "No readable text was detected in this presentation.",
        pages: []
      })
    ];
    return {
      records
    };
  }

  if (/\.(gdoc|gslides)$/i.test(lowerName)) {
    const record = createDocumentWithFlags({
          title: file.name.replace(/\.[^.]+$/, ""),
          type: "Google shortcut",
          content:
            "This file is a Google Drive shortcut, not the document content itself. Export it as PDF, DOCX, or PPTX to read and listen inside the portal."
        }, flags);
    record.originalFile = originalFile;
    return {
      records: [record]
    };
  }

  const record = createDocumentWithFlags({
        title: file.name.replace(/\.[^.]+$/, ""),
        type: file.type || "Uploaded file",
        content:
          "This file type can be stored and attached to assessments, but preview text is not available yet."
      }, flags);
  record.originalFile = originalFile;
  return {
    records: [record]
  };
}

async function handleUpload(event) {
  state.pendingFiles = [...event.target.files];
  elements.uploadStatus.textContent = state.pendingFiles.length
    ? `${state.pendingFiles.length} file${state.pendingFiles.length === 1 ? "" : "s"} selected.`
    : "";
  renderPendingUpload();
}

function normalizeScheduleLine(value) {
  return String(value || "")
    .replace(/^Page\s+\d+\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isAssessmentScheduleNoiseLine(value) {
  const compactValue = String(value || "").trim().toLowerCase();
  if (!compactValue) {
    return true;
  }

  return [
    "assessment schedule",
    "task number",
    "component/task",
    "component task",
    "distribution date",
    "due date",
    "weighting percentage",
    "weighting",
    "year 7",
    "semester 1",
    "semester 2"
  ].includes(compactValue);
}

function parseAssessmentScheduleLine(line, fallbackSubjectId) {
  const normalizedLine = normalizeScheduleLine(line);
  if (!normalizedLine || !/\d{1,3}\s*%/.test(normalizedLine)) {
    return null;
  }

  const subjectId = findSubjectIdFromText(normalizedLine) || fallbackSubjectId;
  if (!subjectId) {
    return null;
  }

  let workingLine = stripSubjectAliasFromText(normalizedLine, subjectId)
    .replace(/\b(?:assessment schedule|task number|component\/task|component task|distribution date|due date|weighting percentage|weighting)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const weightingMatch = workingLine.match(/(\d{1,3}\s*%)\s*$/);
  if (!weightingMatch) {
    return null;
  }

  const weighting = weightingMatch[1].replace(/\s+/g, "");
  workingLine = workingLine.slice(0, weightingMatch.index).trim();

  const dateChunkRegex =
    /(?:Term\s*\d(?:\s*Week(?:s)?\s*[\d/&,\-\s]+)?(?:\s*or\s*Term\s*\d(?:\s*Week(?:s)?\s*[\d/&,\-\s]+)?)*)|(?:Ongoing(?:\s+[A-Za-z0-9/&,\-\s]+)?)|(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+)?\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?/gi;
  const dateMatches = [...workingLine.matchAll(dateChunkRegex)];
  if (dateMatches.length < 2) {
    return null;
  }

  const distributionMatch = dateMatches[dateMatches.length - 2];
  const dueMatch = dateMatches[dateMatches.length - 1];
  const distributionDate = distributionMatch[0].trim().replace(/\s+/g, " ");
  const dueDate = dueMatch[0].trim().replace(/\s+/g, " ");
  const headingText = workingLine.slice(0, distributionMatch.index).replace(/\s{2,}/g, " ").trim();
  if (!headingText) {
    return null;
  }

  let taskNumber = "";
  let componentTask = headingText;
  const taskMatch = headingText.match(/^(?:task\s*)?([A-Za-z]?\d+[A-Za-z]?|[A-Za-z]\d)\s*[-:.,]?\s+(.+)$/i);
  if (taskMatch) {
    taskNumber = taskMatch[1].trim();
    componentTask = taskMatch[2].trim();
  }

  if (!componentTask) {
    return null;
  }

  return {
    subjectId,
    assessment: {
      id: createId(),
      title: componentTask,
      componentTask,
      taskNumber: taskNumber || "TBC",
      distributionDate,
      dueDate,
      weighting,
      description: `${componentTask}.`,
      linkedDocumentIds: [],
      completed: false,
      workNotes: "",
      source: "schedule-upload"
    }
  };
}

async function extractAssessmentScheduleFromPdf(file) {
  const pdfData = await extractPdfData(file);
  const entriesBySubject = {};
  let currentSubjectId = "";
  let rowBuffer = "";

  const flushRowBuffer = () => {
    if (!rowBuffer) {
      return;
    }

    const parsedRow = parseAssessmentScheduleLine(rowBuffer, currentSubjectId);
    if (parsedRow) {
      entriesBySubject[parsedRow.subjectId] = entriesBySubject[parsedRow.subjectId] || [];
      entriesBySubject[parsedRow.subjectId].push(parsedRow.assessment);
      currentSubjectId = parsedRow.subjectId;
    }

    rowBuffer = "";
  };

  pdfData.fullText
    .split(/\n+/)
    .map(normalizeScheduleLine)
    .filter(Boolean)
    .forEach((line) => {
      if (isAssessmentScheduleNoiseLine(line)) {
        return;
      }

      const headingSubjectId = findSubjectIdFromText(line);
      const isLikelySubjectHeading =
        headingSubjectId &&
        !/\d{1,3}\s*%/.test(line) &&
        !/\bterm\s*\d\b/i.test(line) &&
        line.split(/\s+/).length <= 7;

      if (isLikelySubjectHeading) {
        flushRowBuffer();
        currentSubjectId = headingSubjectId;
        return;
      }

      rowBuffer = rowBuffer ? `${rowBuffer} ${line}` : line;
      if (/\d{1,3}\s*%/.test(rowBuffer)) {
        flushRowBuffer();
      }
    });

  flushRowBuffer();

  return entriesBySubject;
}

function normalizeScheduleAssessmentRow(row) {
  return {
    subjectName: String(row?.subjectName || "").trim(),
    taskNumber: String(row?.taskNumber || "").trim(),
    componentTask: String(row?.componentTask || "").trim(),
    distributionDate: String(row?.distributionDate || "").trim(),
    dueDate: String(row?.dueDate || "").trim(),
    weighting: String(row?.weighting || "").trim()
  };
}

async function extractAssessmentScheduleViaBackend(file) {
  const formData = new FormData();
  formData.append("file", file);
  const payload = await requestApiFormData("/api/upload/assessment-schedule", formData);
  const rows = Array.isArray(payload?.assessments) ? payload.assessments.map(normalizeScheduleAssessmentRow) : [];
  const entriesBySubject = {};

  rows.forEach((row) => {
    const subjectId = findSubjectIdFromText(row.subjectName);
    if (!subjectId || !row.componentTask || !row.dueDate || !row.distributionDate || !row.weighting) {
      return;
    }

    entriesBySubject[subjectId] = entriesBySubject[subjectId] || [];
    entriesBySubject[subjectId].push({
      id: createId(),
      title: row.componentTask,
      componentTask: row.componentTask,
      taskNumber: row.taskNumber || "TBC",
      distributionDate: row.distributionDate,
      dueDate: row.dueDate,
      weighting: row.weighting,
      description: `${row.componentTask}.`,
      linkedDocumentIds: [],
      completed: false,
      workNotes: "",
      source: "schedule-upload"
    });
  });

  return entriesBySubject;
}

async function handleAssessmentScheduleUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (!/\.pdf$/i.test(file.name)) {
    elements.uploadStatus.textContent = "Upload the assessment schedule as a PDF.";
    event.target.value = "";
    return;
  }

  elements.uploadStatus.textContent = "Reading assessment schedule PDF...";

  try {
    const entriesBySubject = await extractAssessmentScheduleViaBackend(file);
    const matchedSubjects = Object.keys(entriesBySubject).filter((subjectId) => entriesBySubject[subjectId]?.length);
    const matchedAssessmentCount = matchedSubjects.reduce(
      (total, subjectId) => total + entriesBySubject[subjectId].length,
      0
    );

    if (!matchedAssessmentCount) {
      throw new Error("No assessment rows could be matched. Check that the PDF includes subject, task number, distribution, due date, and weighting columns.");
    }

    state.subjects = state.subjects.map((subject) => {
      const parsedAssessments = entriesBySubject[subject.id];
      if (!parsedAssessments?.length) {
        return subject;
      }

      return {
        ...subject,
        assessments: buildScheduleMergedAssessments(parsedAssessments, subject.assessments || [])
      };
    });

    persistSubjects();
    render();
    elements.uploadStatus.textContent = `Assessment schedule uploaded: ${matchedAssessmentCount} assessments matched across ${matchedSubjects.length} subjects.`;
  } catch (error) {
    elements.uploadStatus.textContent =
      error instanceof Error ? `Assessment schedule upload failed: ${error.message}` : "Assessment schedule upload failed.";
  } finally {
    event.target.value = "";
  }
}

async function processFiles(fileList) {
  const files = [...fileList];
  const subject = getUploadSubject();
  const flags = buildUploadFlags();
  if (!subject) {
    return;
  }

  if (!flags.selectedType) {
    elements.uploadStatus.textContent = "Select one document type first.";
    return;
  }

  if (flags.watch) {
    const watchUrl = normaliseWatchUrl(elements.uploadWatchUrl.value);
    const watchTitle = elements.uploadWatchTitle.value.trim();
    if (!watchUrl || !isSupportedWatchUrl(watchUrl)) {
      elements.uploadStatus.textContent = "Add a valid YouTube link for WATCH.";
      return;
    }
    const existingWatchItem = findSubjectWatchItemByUrl(subject, watchUrl);
    if (existingWatchItem) {
      subject.hiddenWatchUrls = (Array.isArray(subject.hiddenWatchUrls) ? subject.hiddenWatchUrls : []).filter(
        (url) => normaliseWatchUrl(url) !== watchUrl
      );
      state.selectedSubjectId = subject.id;
      state.currentView = "subjects";
      state.activeSubjectTab = "watch";
      state.focusArea = state.focusMode ? "watch" : null;
      persistSubjects();
      render();
      elements.uploadStatus.textContent = "That WATCH link is already in this subject.";
      closeUploadModal();
      return;
    }
    const finalTitle = watchTitle || watchUrl;
    subject.watch = Array.isArray(subject.watch) ? subject.watch : [];
    const watchItem = {
      id: createId(),
      title: finalTitle,
      url: watchUrl,
      addedAt: new Date().toISOString(),
      source: "manual",
      subjectId: subject.id
    };
    subject.watch.unshift(watchItem);
    subject.hiddenWatchUrls = (Array.isArray(subject.hiddenWatchUrls) ? subject.hiddenWatchUrls : []).filter(
      (url) => normaliseWatchUrl(url) !== watchUrl
    );
    removeManualWatchDuplicatesFromOtherSubjects(subject.id, watchUrl, watchItem.id);
    state.selectedSubjectId = subject.id;
    state.currentView = "subjects";
    state.activeSubjectTab = "watch";
    state.focusArea = state.focusMode ? "watch" : null;
    persistSubjects();
    render();
    elements.uploadStatus.textContent = "WATCH item added.";
    clearPendingUpload();
    closeUploadModal();
    return;
  }

  if (!files.length) {
    elements.uploadStatus.textContent = "Choose a file first.";
    return;
  }

  elements.uploadStatus.textContent = "Reading document...";

  try {
    const processedUploads = [];
    for (const file of files) {
      const { records } = await readUploadedDocument(file, flags);
      processedUploads.push({ file, records });
    }

    const existingTitles = new Set(subject.documents.map((document) => document.title.toLowerCase()));
    const batchTitles = new Set();
    for (const { records } of processedUploads) {
      for (const record of records) {
        const lowerTitle = record.title.toLowerCase();
        if (existingTitles.has(lowerTitle) || batchTitles.has(lowerTitle)) {
          throw new Error(`"${record.title}" is already in ${subject.name}.`);
        }
        batchTitles.add(lowerTitle);
      }
    }

    processedUploads.forEach(({ records }) => {
      subject.documents.unshift(...records);
    });
    syncAutoWatchForSubject(subject);

    if (flags.assessment) {
      const selectedAssessment = getAssessmentUploadTarget(subject);
      if (selectedAssessment) {
        const linkedRecordIds = processedUploads.flatMap(({ records }) => records.map((record) => record.id));
        const existingLinkedIds = new Set(selectedAssessment.linkedDocumentIds || []);
        linkedRecordIds.forEach((recordId) => {
          existingLinkedIds.add(recordId);
        });
        selectedAssessment.linkedDocumentIds = [...existingLinkedIds];
      } else {
        processedUploads.forEach(({ file, records }) => {
          subject.assessments.unshift(
            buildAssessmentFromUpload(file.name, formatDueDate(elements.uploadDueDate.value), records.map((record) => record.id))
          );
        });
      }
    }

    persistSubjects();
    if (flags.homework) {
      state.selectedSubjectId = subject.id;
      state.currentView = "subjects";
      state.activeSubjectTab = "homework";
      state.focusArea = state.focusMode ? "homework" : null;
    } else if (flags.assessment) {
      state.selectedSubjectId = subject.id;
      state.currentView = "subjects";
      state.activeSubjectTab = "assessments";
      state.focusArea = state.focusMode ? "assessments" : null;
    } else if (flags.classNotes) {
      state.selectedSubjectId = subject.id;
      state.currentView = "subjects";
      state.activeSubjectTab = "reader";
      state.focusArea = state.focusMode ? "reader" : null;
    }
    state.selectedDocumentId = getVisibleSubjectDocuments(subject)[0]?.id || null;
    elements.documentUpload.value = "";
    clearUploadOptions();
    render();
    processedUploads
      .flatMap(({ records }) => records)
      .filter((record) => isWholeStudyDocument(record))
      .forEach((record) => {
        void ensureDocumentStudyPlan(record, subject);
      });
    elements.uploadStatus.textContent = `${files.length} document${files.length === 1 ? "" : "s"} uploaded.`;
    closeUploadModal();
  } catch (error) {
    elements.uploadStatus.textContent =
      error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed.";
  }
}

function resetUploadStatus() {
  elements.uploadStatus.textContent = "";
}

function clearUploadOptions() {
  elements.uploadClassNotes.checked = false;
  elements.uploadAssessment.checked = false;
  elements.uploadHomework.checked = false;
  elements.uploadWatch.checked = false;
  elements.uploadDueDate.value = "";
  elements.uploadAssessmentTaskSelect.value = "";
  elements.uploadWatchUrl.value = "";
  elements.uploadWatchTitle.value = "";
  syncUploadOptions();
}

function clearPendingUpload() {
  state.pendingFiles = [];
  elements.documentUpload.value = "";
  clearUploadOptions();
  renderPendingUpload();
}

function openWatchUploadModal() {
  openUploadModal();
  elements.uploadWatch.checked = true;
  elements.uploadClassNotes.checked = false;
  elements.uploadAssessment.checked = false;
  elements.uploadHomework.checked = false;
  syncUploadOptions();
  renderUploadAssessmentTaskOptions();
  elements.uploadWatchUrl.focus();
}

function syncUploadOptions() {
  elements.uploadDueDateWrap.classList.toggle("upload-field--hidden", !elements.uploadAssessment.checked);
  elements.uploadAssessmentTaskWrap.classList.toggle("upload-field--hidden", !elements.uploadAssessment.checked);
  const showWatchFields = elements.uploadWatch.checked;
  elements.uploadWatchUrlWrap.classList.toggle("upload-field--hidden", !showWatchFields);
  elements.uploadWatchTitleWrap.classList.toggle("upload-field--hidden", !showWatchFields);
  elements.uploadPanel.classList.toggle("hidden", showWatchFields);
  elements.pendingUpload.classList.toggle("hidden", showWatchFields);
  if (elements.uploadAssessment.checked) {
    renderUploadAssessmentTaskOptions();
  }
}

function handleUploadTypeSelection(selectedElement) {
  [elements.uploadClassNotes, elements.uploadAssessment, elements.uploadHomework, elements.uploadWatch].forEach((checkbox) => {
    if (checkbox !== selectedElement) {
      checkbox.checked = false;
    }
  });
  syncUploadOptions();
}

function openUploadModal() {
  elements.uploadSubjectSelect.value = state.selectedSubjectId;
  renderUploadAssessmentTaskOptions();
  resetUploadStatus();
  clearPendingUpload();
  elements.uploadModal.classList.remove("hidden");
  elements.uploadModal.setAttribute("aria-hidden", "false");
}

function closeUploadModal() {
  elements.uploadModal.classList.add("hidden");
  elements.uploadModal.setAttribute("aria-hidden", "true");
}

async function handleProcessUpload() {
  if (!state.pendingFiles.length && getSelectedUploadType() !== "watch") {
    elements.uploadStatus.textContent = "Choose a file first.";
    return;
  }

  await processFiles(state.pendingFiles);
  if (!elements.uploadModal.classList.contains("hidden")) {
    clearPendingUpload();
  }
}

function formatDueDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short"
  }).format(date);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

async function handleBackgroundUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (!elements.backgroundHomeCheckbox.checked && !elements.backgroundSubjectsCheckbox.checked) {
    window.alert("Select Home and/or Subjects before uploading a background.");
    event.target.value = "";
    return;
  }

  try {
    const imageDataUrl = await readFileAsDataUrl(file);
    const assetWrites = [];
    if (elements.backgroundHomeCheckbox.checked) {
      state.settings.homeBackground = imageDataUrl;
      state.settings.homeBackgroundAssetId = "home-background";
      assetWrites.push(putSettingsAssetRecord("home-background", imageDataUrl));
    }
    if (elements.backgroundSubjectsCheckbox.checked) {
      state.settings.subjectsBackground = imageDataUrl;
      state.settings.subjectsBackgroundAssetId = "subjects-background";
      assetWrites.push(putSettingsAssetRecord("subjects-background", imageDataUrl));
    }
    if (assetWrites.length) {
      await Promise.all(assetWrites);
    }
    persistSettings();
    applyBackgrounds();
    renderCurrentView();
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "The background could not be added.");
  } finally {
    event.target.value = "";
  }
}

function handleRemoveBackground() {
  if (!elements.backgroundHomeCheckbox.checked && !elements.backgroundSubjectsCheckbox.checked) {
    window.alert("Select Home and/or Subjects before removing a background.");
    return;
  }

  const assetIdsToDelete = [];
  if (elements.backgroundHomeCheckbox.checked) {
    state.settings.homeBackground = "";
    assetIdsToDelete.push(state.settings.homeBackgroundAssetId);
    state.settings.homeBackgroundAssetId = "";
  }
  if (elements.backgroundSubjectsCheckbox.checked) {
    state.settings.subjectsBackground = "";
    assetIdsToDelete.push(state.settings.subjectsBackgroundAssetId);
    state.settings.subjectsBackgroundAssetId = "";
  }

  deleteSettingsAssetRecords(assetIdsToDelete.filter(Boolean)).catch((error) => {
    console.error("Background assets could not be deleted.", error);
  });

  persistSettings();
  applyBackgrounds();
  renderCurrentView();
}

function handleBackgroundColourChange(event) {
  const nextColor = event.target.value || "#ffffff";
  if (!elements.backgroundHomeCheckbox.checked && !elements.backgroundSubjectsCheckbox.checked) {
    window.alert("Select Home and/or Subjects before changing the background colour.");
    return;
  }

  if (elements.backgroundHomeCheckbox.checked) {
    state.settings.homeBackgroundColor = nextColor;
  }
  if (elements.backgroundSubjectsCheckbox.checked) {
    state.settings.subjectsBackgroundColor = nextColor;
  }

  persistSettings();
  applyBackgrounds();
}

function resetBackgroundColour() {
  if (!elements.backgroundHomeCheckbox.checked && !elements.backgroundSubjectsCheckbox.checked) {
    window.alert("Select Home and/or Subjects before resetting the background colour.");
    return;
  }

  if (elements.backgroundHomeCheckbox.checked) {
    state.settings.homeBackgroundColor = defaultPageBackgroundColor;
  }
  if (elements.backgroundSubjectsCheckbox.checked) {
    state.settings.subjectsBackgroundColor = defaultPageBackgroundColor;
  }

  persistSettings();
  applyBackgrounds();
}

function handleHeadingColourChange(event) {
  state.settings.headingColor = event.target.value || "#111111";
  persistSettings();
  applyBackgrounds();
}

function resetHeadingColour() {
  state.settings.headingColor = "#111111";
  persistSettings();
  applyBackgrounds();
}

function handleSetTermDates() {
  const updatedStarts = { ...state.termStarts };
  const updatedEnds = { ...state.termEnds };

  for (const termNumber of [1, 2, 3, 4]) {
    const startResponse = window.prompt(
      `Term ${termNumber} start date (YYYY-MM-DD)`,
      updatedStarts[termNumber] || ""
    );
    if (startResponse === null) {
      return;
    }

    const endResponse = window.prompt(
      `Term ${termNumber} finish date (YYYY-MM-DD)`,
      updatedEnds[termNumber] || ""
    );
    if (endResponse === null) {
      return;
    }

    const startTrimmed = startResponse.trim();
    const endTrimmed = endResponse.trim();
    if (!startTrimmed || !endTrimmed) {
      continue;
    }

    const parsedStart = new Date(`${startTrimmed}T00:00:00`);
    const parsedEnd = new Date(`${endTrimmed}T00:00:00`);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      window.alert(`Term ${termNumber} needs valid start and finish dates in YYYY-MM-DD format.`);
      return;
    }

    if (parsedEnd < parsedStart) {
      window.alert(`Term ${termNumber} finish must be after the start date.`);
      return;
    }

    updatedStarts[termNumber] = startTrimmed;
    updatedEnds[termNumber] = endTrimmed;
  }

  state.termStarts = updatedStarts;
  state.termEnds = updatedEnds;
  persistSettings();
  render();
}

function openAssessmentScheduleUpload() {
  elements.assessmentScheduleUpload.value = "";
  elements.assessmentScheduleUpload.click();
}

async function saveAccountSettings() {
  if (!state.currentUserEmail || !state.authToken) {
    elements.settingsStatus.textContent = "Account could not be found.";
    return;
  }

  const nextName = elements.settingsNameInput.value.trim();
  const nextEmail = elements.settingsEmailInput.value.trim().toLowerCase();
  const nextGrade = normaliseGrade(elements.settingsGradeSelect.value);
  if (!nextName || !nextEmail) {
    elements.settingsStatus.textContent = "Enter both a student name and school email.";
    return;
  }

  const currentEmail = state.currentUserEmail;

  try {
    const payload = await requestApi(
      "/api/account",
      {
        name: nextName,
        email: nextEmail,
        grade: nextGrade
      },
      false,
      {
        method: "PATCH",
        headers: {
          ...buildAuthHeaders()
        }
      }
    );
    if (nextEmail !== currentEmail.toLowerCase()) {
      const storedSubjectsMap = loadStoredSubjectsMap();
      const currentKey = normaliseAccountKey(currentEmail);
      const nextKey = normaliseAccountKey(nextEmail);
      if (storedSubjectsMap[currentKey]) {
        storedSubjectsMap[nextKey] = storedSubjectsMap[currentKey];
        delete storedSubjectsMap[currentKey];
        saveStoredSubjectsMap(storedSubjectsMap);
      }
    }
    applyAuthenticatedAccount(payload.account, {
      token: state.authToken,
      subjects: state.subjects,
      skipRemoteSync: true
    });
    elements.welcomeHeading.textContent = "";
    elements.settingsStatus.textContent = "Account saved.";
    state.generatedRevisionTest = null;
    state.revisionResponses = {};
    state.revisionSubmission = null;
    state.revisionViewMode = "draft";
    state.activeSavedRevisionTestId = "";
    void loadRevisionCatalogue(true);
  } catch (error) {
    elements.settingsStatus.textContent = error instanceof Error ? error.message : "Account update failed.";
  }
}

async function savePasswordSettings() {
  if (!state.currentUserEmail || !state.authToken) {
    elements.settingsStatus.textContent = "Account could not be found.";
    return;
  }

  const currentPassword = elements.settingsCurrentPasswordInput.value;
  const newPassword = elements.settingsNewPasswordInput.value;
  const confirmPassword = elements.settingsConfirmPasswordInput.value;

  if (!newPassword) {
    elements.settingsStatus.textContent = "Enter a new password.";
    return;
  }

  if (newPassword !== confirmPassword) {
    elements.settingsStatus.textContent = "New passwords do not match.";
    return;
  }

  try {
    await requestApi(
      "/api/account/password",
      {
        currentPassword,
        newPassword
      },
      false,
      {
        headers: {
          ...buildAuthHeaders()
        }
      }
    );
    elements.settingsCurrentPasswordInput.value = "";
    elements.settingsNewPasswordInput.value = "";
    elements.settingsConfirmPasswordInput.value = "";
    elements.settingsStatus.textContent = "Password updated.";
  } catch (error) {
    elements.settingsStatus.textContent = error instanceof Error ? error.message : "Password update failed.";
  }
}

function render() {
  applyBackgrounds();
  renderAiConnectionState();
  renderCurrentView();
  renderOverview();
  renderHomeHero();
  renderRevisionPanel();
  renderSubjectList();
  renderSubjectsHero();
  renderSubjectHeader();
  renderSubjectTabs();
  renderFocusMode();
  renderPendingUpload();
  renderDocuments();
  renderAskContext();
  renderSavedRevisionTests();
  renderAssessments();
  renderSpelling();
  renderPractice();
  renderWatchList();
  renderDockContext();
  if (state.attachmentModalOpen) {
    renderAttachNotesModal();
  }
  if (state.currentView === "task") {
    renderTaskView();
  }
  if (state.currentView === "revision") {
    renderRevisionTestView();
  }
}

function signInToAccount(account, subjects = null) {
  resetRevisionState();
  state.authToken = "";
  state.currentUserId = "";
  state.currentUserPoints = Math.max(0, Number(account?.points || 0) || 0);
  state.studentName = account.name;
  state.currentUserEmail = account.email;
  state.studentGrade = normaliseGrade(account.grade);
  persistSession(account.email);
  restoreSubjectsForAccount(account, subjects, { skipRemoteSync: true });
  openDashboard("home");
}

function setAuthMode(mode, { clearStatus = true } = {}) {
  state.authMode = mode;
  if (clearStatus) {
    elements.signInStatus.textContent = "";
  }
  syncSignInMode();
}

async function handleDashboardOpen() {
  const studentName = elements.studentNameInput.value.trim();
  const studentGrade = normaliseGrade(elements.studentGradeSelect.value);
  const studentEmail = normaliseAccountKey(elements.studentEmailInput.value);
  const password = String(elements.studentPasswordInput.value || "");
  const confirmPassword = String(elements.studentPasswordConfirmInput.value || "");
  const existingLegacyAccount = findLegacyAccountByEmail(studentEmail);
  const isCreateMode = state.authMode === "create";

  elements.signInStatus.textContent = "";

  if (!studentEmail || !password) {
    elements.signInStatus.textContent = "Enter your school email and password.";
    return;
  }

  if (isCreateMode) {
    if (!studentName) {
      elements.signInStatus.textContent = "Enter a student name.";
      return;
    }
    if (!confirmPassword) {
      elements.signInStatus.textContent = "Confirm the password.";
      return;
    }
    if (password !== confirmPassword) {
      elements.signInStatus.textContent = "Passwords do not match.";
      return;
    }
  }

  setAuthPending(true, isCreateMode ? "Creating your account..." : "Signing you in...");
  await flushUiFrame();

  try {
    if (!isCreateMode) {
      try {
        const payload = await requestApi("/api/auth/signin", {
          email: studentEmail,
          password
        });
        elements.signInStatus.textContent = "Loading your study space...";
        state.authToken = payload.token || "";
        applyAuthenticatedAccount(payload.account, {
          token: payload.token || "",
          subjects: payload.subjects,
          settings: payload.settings,
          skipRemoteSync: true
        });
        openDashboard("home");
        return;
      } catch (error) {
        if (
          error instanceof Error &&
          error.status === 404 &&
          existingLegacyAccount &&
          existingLegacyAccount.password === password
        ) {
          try {
            elements.signInStatus.textContent = "Restoring your saved account...";
            const legacySubjects = getStoredSubjectsForAccount(existingLegacyAccount);
            const payload = await registerCloudAccountWithFallback({
              name: existingLegacyAccount.name,
              email: existingLegacyAccount.email,
              password,
              grade: normaliseGrade(existingLegacyAccount.grade),
              subjects: legacySubjects,
              settings: buildCloudAccountSettingsPayload()
            });
            elements.signInStatus.textContent = "Loading your study space...";
            state.authToken = payload.token || "";
            applyAuthenticatedAccount(payload.account, {
              token: payload.token || "",
              subjects: legacySubjects,
              settings: payload.settings,
              skipRemoteSync: false
            });
            openDashboard("home");
            return;
          } catch (migrationError) {
            elements.signInStatus.textContent =
              migrationError instanceof Error ? migrationError.message : "Account migration failed.";
            return;
          }
        }

        elements.signInStatus.textContent = error instanceof Error ? error.message : "Sign-in failed.";
        return;
      }
    }

    const desiredSubjects = existingLegacyAccount
      ? getStoredSubjectsForAccount(existingLegacyAccount)
      : createInitialSubjectsForAccount({
          email: studentEmail,
          grade: studentGrade,
          name: studentName
        });
    const payload = await registerCloudAccountWithFallback({
      name: studentName,
      email: studentEmail,
      password,
      grade: studentGrade,
      subjects: desiredSubjects,
      settings: buildCloudAccountSettingsPayload()
    });
    elements.signInStatus.textContent = "Loading your study space...";
    state.authToken = payload.token || "";
    applyAuthenticatedAccount(payload.account, {
      token: payload.token || "",
      subjects: desiredSubjects,
      settings: payload.settings,
      skipRemoteSync: false
    });
    openDashboard("home");
  } catch (error) {
    if (error instanceof Error && error.status === 409) {
      setAuthMode("signin", { clearStatus: false });
    }
    elements.signInStatus.textContent = error instanceof Error ? error.message : "Account creation failed.";
  } finally {
    if (!elements.landingPanel.classList.contains("hidden")) {
      setAuthPending(false, elements.signInStatus.textContent);
    } else {
      state.authPending = false;
    }
  }
}

elements.askButton.addEventListener("click", handleAsk);
elements.askMicButton?.addEventListener("click", handleAskMicToggle);
elements.askListenButton?.addEventListener("click", handleAskListen);
elements.signInModeCreateButton.addEventListener("click", () => {
  setAuthMode("create");
});
elements.signInModeLoginButton.addEventListener("click", () => {
  setAuthMode("signin");
});
elements.openDashboardButton.addEventListener("click", handleDashboardOpen);
[elements.studentNameInput, elements.studentEmailInput, elements.studentPasswordInput, elements.studentPasswordConfirmInput]
  .filter(Boolean)
  .forEach((field) => {
    field.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      handleDashboardOpen();
    });
  });
elements.removeBackgroundButton.addEventListener("click", handleRemoveBackground);
elements.backgroundColourInput.addEventListener("input", handleBackgroundColourChange);
elements.clearBackgroundColourButton.addEventListener("click", resetBackgroundColour);
elements.backgroundHomeCheckbox.addEventListener("change", applyBackgrounds);
elements.backgroundSubjectsCheckbox.addEventListener("change", applyBackgrounds);
elements.headingColourInput.addEventListener("input", handleHeadingColourChange);
elements.clearHeadingColourButton.addEventListener("click", resetHeadingColour);
elements.revisionSubjectSelect.addEventListener("change", () => {
  state.revisionSelectedSubjectId = elements.revisionSubjectSelect.value;
  state.generatedRevisionTest = null;
  state.revisionResponses = {};
  state.revisionSubmission = null;
  state.revisionViewMode = "draft";
  state.activeSavedRevisionTestId = "";
  renderRevisionPanel();
});
elements.revisionTopicSelect.addEventListener("change", () => {
  state.revisionSelectedTopic = elements.revisionTopicSelect.value;
  state.generatedRevisionTest = null;
  state.revisionResponses = {};
  state.revisionSubmission = null;
  state.revisionViewMode = "draft";
  state.activeSavedRevisionTestId = "";
  renderRevisionPanel();
});
elements.revisionTextInput.addEventListener("input", () => {
  state.revisionTextTitle = elements.revisionTextInput.value;
});
elements.revisionNotesSelect.addEventListener("change", () => {
  state.revisionSelectedNoteIds = [...elements.revisionNotesSelect.selectedOptions]
    .map((option) => option.value)
    .filter(Boolean);
});
elements.createRevisionTestButton.addEventListener("click", handleCreateRevisionTest);
elements.submitRevisionTestButton.addEventListener("click", handleSubmitRevisionTest);
elements.saveRevisionTestButton.addEventListener("click", saveCurrentRevisionTest);
elements.focusModeToggle?.addEventListener("click", () => {
  setFocusMode(!state.focusMode);
});
elements.focusAskButton?.addEventListener("click", handleFocusAskLaunch);
elements.focusAskAvatarButton?.addEventListener("click", handleFocusAskLaunch);
elements.navHomeButton.addEventListener("click", () => {
  state.currentView = "home";
  state.focusAskOpen = false;
  render();
});
elements.navSubjectsButton.addEventListener("click", () => {
  state.currentView = "subjects";
  state.focusAskOpen = false;
  if (state.focusMode) {
    state.focusArea = null;
  }
  render();
});
elements.navSettingsButton.addEventListener("click", () => {
  hydrateSettingsView();
  state.currentView = "settings";
  render();
});
elements.changeBackgroundButton.addEventListener("click", () => {
  elements.backgroundUpload.click();
});
elements.backgroundUpload.addEventListener("change", handleBackgroundUpload);
elements.enterSubjectsButton.addEventListener("click", () => {
  state.currentView = "subjects";
  state.focusAskOpen = false;
  if (state.focusMode) {
    state.focusArea = null;
  }
  render();
});
elements.openUploadModalButton?.addEventListener("click", openUploadModal);
elements.openUploadModalSecondary.addEventListener("click", openUploadModal);
elements.subjectHeroUploadButton?.addEventListener("click", openUploadModal);
elements.openUpcomingFromHeroButton?.addEventListener("click", openUpcomingModal);
elements.homeListenCurrentButton?.addEventListener("click", () => {
  const bundle = getHomeContinueReadingBundle();
  const firstDocument = bundle?.documents?.[0];
  if (!firstDocument) {
    return;
  }
  if (currentAudioContext === `document:${firstDocument.id}`) {
    stopListening();
    render();
    return;
  }
  state.selectedDocumentId = firstDocument.id;
  state.askDocumentId = firstDocument.id;
  speakDocument(firstDocument);
});
elements.homeCurrentDocVisual?.addEventListener("click", () => {
  const bundle = getHomeContinueReadingBundle();
  const firstDocument = bundle?.documents?.[0];
  if (!firstDocument) {
    return;
  }
  if (currentAudioContext === `document:${firstDocument.id}`) {
    stopListening();
    render();
    return;
  }
  state.selectedDocumentId = firstDocument.id;
  state.askDocumentId = firstDocument.id;
  speakDocument(firstDocument);
});
elements.homeOpenCurrentButton?.addEventListener("click", () => {
  const bundle = getHomeContinueReadingBundle();
  if (!bundle) {
    return;
  }
  focusBundleInReader(bundle);
});
elements.homeAskMicButton?.addEventListener("click", () => {
  openSubjectsWorkspace(state.activeSubjectTab || "reader");
  startAskMicrophone();
});
elements.homeAskReadButton?.addEventListener("click", () => {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }
  const bundle = getHomeworkBundles(subject)[0];
  if (!bundle) {
    openSubjectsWorkspace("homework");
    return;
  }
  const firstDocument = bundle.documents[0];
  if (firstDocument) {
    state.askDocumentId = firstDocument.id;
    state.selectedDocumentId = firstDocument.id;
  }
  openSubjectsWorkspace("homework");
});
elements.homeAskQuizButton?.addEventListener("click", () => {
  openSubjectsWorkspace("homework");
  elements.askInput.value = "Quiz me on the notes I read yesterday and focus on the most important ideas.";
  renderAskContext();
  void handleAsk();
});
elements.subjectTabs?.querySelectorAll("[data-viewer-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextTab = button.dataset.viewerTab;
    if (!nextTab || nextTab === state.activeSubjectTab) {
      return;
    }
    state.activeSubjectTab = nextTab;
    state.focusAskOpen = false;
    if (state.focusMode) {
      state.focusArea = nextTab;
    }
    render();
  });
});
elements.focusBackButton?.addEventListener("click", () => {
  state.focusAskOpen = false;
  state.focusArea = null;
  render();
});
elements.subjectsView?.addEventListener("click", (event) => {
  if (!state.focusAskOpen) {
    return;
  }
  if (event.target.closest(".workspace-dock")) {
    return;
  }
  closeFocusAskPopup({ stopMic: true });
});
elements.upcomingAssessmentsButton.addEventListener("click", openUpcomingModal);
elements.closeUpcomingScrim.addEventListener("click", closeUpcomingModal);
elements.closeUpcomingButton.addEventListener("click", closeUpcomingModal);
elements.setTermDatesButton.addEventListener("click", handleSetTermDates);
elements.closeUploadScrim.addEventListener("click", closeUploadModal);
elements.closeUploadButton.addEventListener("click", closeUploadModal);
elements.closeAttachNotesScrim.addEventListener("click", closeAttachNotesModal);
elements.closeAttachNotesButton.addEventListener("click", closeAttachNotesModal);
elements.closeEditAssessmentScrim.addEventListener("click", closeEditAssessmentModal);
elements.closeEditAssessmentButton.addEventListener("click", closeEditAssessmentModal);
elements.cancelEditAssessmentButton.addEventListener("click", closeEditAssessmentModal);
elements.saveEditAssessmentButton.addEventListener("click", saveEditedAssessment);
elements.saveAccountSettingsButton.addEventListener("click", saveAccountSettings);
elements.saveSubjectIconsButton?.addEventListener("click", saveSubjectIconSettings);
elements.savePasswordSettingsButton.addEventListener("click", savePasswordSettings);
elements.closeTaskViewButton.addEventListener("click", () => {
  state.currentView = "subjects";
  state.focusAskOpen = false;
  render();
});
elements.closeRevisionViewButton.addEventListener("click", () => {
  const returnContext = state.revisionReturnContext;
  if (returnContext?.view === "subjects") {
    state.currentView = "subjects";
    state.selectedSubjectId = returnContext.subjectId || state.selectedSubjectId;
    state.activeSubjectTab = returnContext.activeSubjectTab || "reader";
    state.focusAskOpen = false;
    state.focusArea = state.focusMode ? state.activeSubjectTab : null;
    state.selectedDocumentId = returnContext.documentId || state.selectedDocumentId;
    render();
    requestAnimationFrame(() => {
      elements.readerContent?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return;
  }
  state.currentView = "home";
  render();
});
elements.saveTaskWorkButton.addEventListener("click", saveTaskWorkspace);
elements.saveTaskFilesButton.addEventListener("click", saveTaskWorkspaceToFiles);
elements.toggleUpcomingModeButton.addEventListener("click", () => {
  state.upcomingModalMode = state.upcomingModalMode === "all" ? "upcoming" : "all";
  renderUpcomingModal();
});
elements.signInForm.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleDashboardOpen();
  }
});
elements.documentUpload.addEventListener("change", handleUpload);
elements.uploadSubjectSelect.addEventListener("change", () => {
  renderUploadAssessmentTaskOptions();
});
elements.documentsToggleButton.addEventListener("click", () => {
  state.documentsExpanded = !state.documentsExpanded;
  renderDocuments();
});
elements.documentsSelectAllButton.addEventListener("click", () => {
  const subject = getSelectedSubject();
  const visibleDocuments = getVisibleSubjectDocuments(subject || { documents: [] });
  if (!visibleDocuments.length) {
    return;
  }
  const allDocumentIds = visibleDocuments.map((documentRecord) => documentRecord.id);
  const allSelected = state.selectedDocumentIds.length === allDocumentIds.length;
  state.selectedDocumentIds = allSelected ? [] : allDocumentIds;
  renderDocuments();
});
elements.documentsDeleteSelectedButton.addEventListener("click", () => {
  const subject = getSelectedSubject();
  if (!subject || !state.selectedDocumentIds.length) {
    return;
  }
  const confirmed = window.confirm(`Delete ${state.selectedDocumentIds.length} selected document${state.selectedDocumentIds.length === 1 ? "" : "s"}?`);
  if (!confirmed) {
    return;
  }
  deleteDocuments([...state.selectedDocumentIds]);
});
elements.watchToggleButton.addEventListener("click", () => {
  state.watchExpanded = !state.watchExpanded;
  renderWatchList();
});
elements.watchAddLinkButton?.addEventListener("click", openWatchUploadModal);
elements.watchRescanButton.addEventListener("click", handleWatchRescan);
elements.processUploadButton.addEventListener("click", handleProcessUpload);
elements.clearUploadButton.addEventListener("click", () => {
  clearPendingUpload();
  resetUploadStatus();
});
elements.uploadAssessmentScheduleButton.addEventListener("click", openAssessmentScheduleUpload);
elements.assessmentScheduleUpload.addEventListener("change", handleAssessmentScheduleUpload);
[
  elements.uploadClassNotes,
  elements.uploadAssessment,
  elements.uploadHomework,
  elements.uploadWatch
].forEach((checkbox) => {
  checkbox.addEventListener("change", () => handleUploadTypeSelection(checkbox));
});
elements.uploadPanel.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.uploadPanel.classList.add("upload-panel--dragover");
});
elements.uploadPanel.addEventListener("dragleave", () => {
  elements.uploadPanel.classList.remove("upload-panel--dragover");
});
elements.uploadPanel.addEventListener("drop", async (event) => {
  event.preventDefault();
  elements.uploadPanel.classList.remove("upload-panel--dragover");
  if (event.dataTransfer?.files?.length) {
    state.pendingFiles = [...event.dataTransfer.files];
    elements.uploadStatus.textContent = `${state.pendingFiles.length} file${state.pendingFiles.length === 1 ? "" : "s"} selected. Choose the document type, then submit.`;
    renderPendingUpload();
  }
});
elements.signoutButton.addEventListener("click", () => {
  stopAskMicrophone({ preserveStatus: true });
  if (state.authToken) {
    void requestApi(
      "/api/auth/signout",
      {},
      false,
      {
        headers: {
          ...buildAuthHeaders()
        }
      }
    ).catch((error) => {
      console.error("Sign-out request failed.", error);
    });
  }
  clearSession();
  state.authToken = "";
  state.currentUserId = "";
  state.currentUserPoints = 0;
  state.studentName = "";
  state.currentUserEmail = "";
  state.studentGrade = defaultGrade;
  state.subjects = createBaseSubjects();
  showLanding();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.focusAskOpen) {
    closeFocusAskPopup({ stopMic: true });
  }
  if (event.key === "Escape" && state.upcomingModalOpen) {
    closeUpcomingModal();
  }
  if (event.key === "Escape" && !elements.uploadModal.classList.contains("hidden")) {
    closeUploadModal();
  }
  if (event.key === "Escape" && state.attachmentModalOpen) {
    closeAttachNotesModal();
  }
  if (event.key === "Escape" && state.editAssessmentModalOpen) {
    closeEditAssessmentModal();
  }
});

syncUploadOptions();
syncSignInMode();
restoreSettings();
void migrateLegacyBackgroundAssets();
void hydrateBackgroundAssets();
restoreSubjects();
void restoreSessionUser();
render();
