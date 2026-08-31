import { GP_ACTIVITIES_PER_SESSION, GP_SESSIONS } from "./grammar-content.js";
import { createGrammarProgram } from "./grammar-runtime.js";

const accountsStorageKey = "studylift-accounts";
const sessionStorageKey = "studylift-session";
const authTokenStorageKey = "paperpanda-session-token";
const subjectsStorageKey = "paperpanda-subjects-by-account";
const settingsStorageKey = "studylift-settings";
const uiVersionStorageKey = "paperpanda-ui-version";
const currentUiVersion = "2026-08-18-grammar-reset-and-signout";
const grammarResetVersion = 3;
const grammarCurrentSnapshotVersion = 1;
const grammarStateMigrationVersion = 1;
const grammarDebugStorageKey = "paperpanda-debug-grammar";
const previewDatabaseName = "paperpanda-assets";
const previewStoreName = "document-previews";
const settingsAssetStoreName = "settings-assets";
const subjectsSnapshotStoreName = "subjects-snapshots";
const authRequestTimeoutMs = 15_000;
const subjectSnapshotRestoreTimeoutMs = 1_500;
const GOOGLE_DOCS_SCOPE = "https://www.googleapis.com/auth/documents";
const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-client";
const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const STANDALONE_ASK_CHANNEL_NAME = "paperpanda-standalone-ask";

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

  return "https://paperpanda.onrender.com";
}

const API_BASE_URL = resolveDefaultApiBaseUrl();
const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
let pdfjsLibPromise = null;
let jsZipPromise = null;
let currentAudioPlayback = null;
let currentAudioObjectUrl = "";
let currentAudioBufferSource = null;
let aiSpeechPlaybackContext = null;
let aiSpeechPlaybackPrimed = false;
let previewDatabasePromise = null;
let indexedDbSubjectsSaveQueuedSnapshot = null;
let indexedDbSubjectsSaveInFlight = false;
let indexedDbSubjectsSaveSequence = 0;
let indexedDbSubjectsCommittedSequence = 0;
let indexedDbSubjectsFailedSequence = 0;
let indexedDbSubjectsLastError = null;
let indexedDbSubjectsSaveWaiters = [];
let latestIndexedDbSubjectsPersistSequence = 0;
let subjectLocalStorageWriteModeByAccount = {};
let currentListenSessionId = 0;
let currentAudioContext = "";
let currentSpeechRecognition = null;
let remoteSubjectsSaveQueuedSnapshot = null;
let remoteSubjectsSaveInFlight = false;
let remoteSubjectsSaveSequence = 0;
let remoteSubjectsCommittedSequence = 0;
let remoteSubjectsFailedSequence = 0;
let remoteSubjectsLastError = null;
let remoteSubjectsSaveWaiters = [];
let remoteSettingsSaveQueuedSnapshot = null;
let remoteSettingsSaveInFlight = false;
let googleIdentityClientPromise = null;
let standaloneAskChannel = null;
let currentAudioPlaybackMode = "";
let currentAudioPlaybackResumeWaiters = [];
const askPageImageCache = new Map();
const aiSpeechPlaybackRate = 0.75;
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
    name: "Practice",
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
    id: "geography",
    name: "Geography",
    focus: "map skills, places, environments, and explaining change",
    summary: "Keep fieldwork notes, case studies, and map activities together before each task.",
    practice: [
      {
        title: "Map skills",
        tag: "Atlas work",
        description: "Read scale, direction, and coordinates, then explain what the map shows."
      },
      {
        title: "Case study snapshot",
        tag: "Explanation",
        description: "Summarise one environment or place and explain one challenge it faces."
      }
    ],
    documents: [
      {
        id: "geography-doc-1",
        title: "Water in the world notes",
        type: "Class notes",
        added: "15 May",
        content:
          "Use maps, graphs, and place examples to explain how people use water and how environments change over time."
      }
    ],
    assessments: [
      seededAssessment("1", "Map Skills Test", "Term 1 Week 4", "Term 1 Week 8", "25%"),
      seededAssessment("2", "Place and Liveability Case Study", "Term 2 Week 2", "Term 2 Week 7", "25%"),
      seededAssessment("3", "Environmental Change Report", "Term 3 Week 3", "Term 3 Week 8", "25%"),
      seededAssessment("4", "Yearly Examination", "Term 4 Week 2", "Term 4 Week 5", "25%")
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
  spelling: ["Practice", "Spelling", "Spelling Stables"],
  science: ["Science"],
  history: ["History"],
  geography: ["Geography", "Geo"],
  music: ["Music"],
  pdhpe: ["PDHPE", "PDHPE/PE", "PE", "Personal Development Health and Physical Education"],
  wellbeing: ["Wellbeing", "Well Being"],
  "design-tech": ["Design & Technology", "Design and Technology", "Design Technology", "D&T", "Design Tech"],
  art: ["Art", "Visual Arts"]
};

const FOCUS_AREAS = [
  { id: "reader", icon: "📖", label: "Read", blurb: "Read & listen" },
  { id: "homework", icon: "✎", label: "Homework", blurb: "Tasks to do" },
  { id: "spelling", icon: "Aa", label: "Practice", blurb: "Targeted spelling practice" },
  { id: "grammar", icon: "✦", label: "Grammar", blurb: "Session-based grammar practice" },
  { id: "writing", icon: "✍", label: "Writing", blurb: "Build a story" },
  { id: "watch", icon: "▶", label: "Watch", blurb: "Class videos" },
  { id: "assessments", icon: "🎯", label: "Assessments", blurb: "Tests & due dates" }
];

const WRITING_STUDIO_SECTION_COUNT = 6;
const WRITING_STUDIO_TAB_LABEL = "Writing Studio";
const WRITING_STUDIO_STYLE_VARIANTS = [
  {
    id: "watercolour",
    label: "Watercolour storybook",
    description: "Soft painted washes, warm light, and gentle dreamy scenery.",
    promptLead: "Use a delicate watercolor picture-book style with soft painted washes, glowing warm light, airy edges, and poetic scenery."
  },
  {
    id: "paper-cut",
    label: "Paper-cut collage",
    description: "Layered torn paper, bold flat shapes, and handmade collage texture.",
    promptLead: "Use a handcrafted cut-paper collage style with layered torn paper, flat graphic shapes, visible paper grain, and playful handmade texture."
  },
  {
    id: "ink-print",
    label: "Vintage ink print",
    description: "Limited colours, bold ink lines, and a classic old-book print feel.",
    promptLead: "Use a vintage ink-and-print illustration style with bold etched linework, limited colour blocks, textured paper, and a classic old-book feel."
  },
  {
    id: "stop-motion",
    label: "Miniature stop-motion",
    description: "Felt-and-clay diorama look with tactile props and cinematic lighting.",
    promptLead: "Make it look like a miniature stop-motion story set with felt-and-clay characters, tactile handmade props, shallow depth of field, and cinematic lighting."
  }
];
const WRITING_STUDIO_TYPOS = {
  aksed: "asked",
  befor: "before",
  becuase: "because",
  freind: "friend",
  recieve: "receive",
  seperate: "separate",
  untill: "until",
  wierd: "weird",
  thier: "their"
};
const WRITING_STUDIO_SECTION_HINTS = [
  "Show what your character notices first.",
  "Add a small problem or surprise.",
  "Reveal something hidden or unexpected.",
  "Show the choice your character has to make.",
  "Build toward the biggest moment.",
  "End with a strong final image."
];

const SPELLING_STAGE_ORDER = ["diagnostic", "looks-right", "word-families", "tense-transfer", "repeat-check"];
const SPELLING_MIDDLE_STAGE_IDS = ["looks-right", "word-families", "tense-transfer"];
const SPELLING_FLASHCARD_EXPOSURE_COUNT = 2;
const SPELLING_FLASHCARDS_VERSION = 5;
const SPELLING_TENSE_TRANSFER_VERSION = 5;
const SPELLING_CHALLENGE_VERSION = 2;
const SPELLING_RESET_VERSION = 2;
const SPELLING_STAGE_LABELS = {
  diagnostic: "Stage 1",
  "looks-right": "Stage 2",
  "word-families": "Stage 3",
  "tense-transfer": "Stage 4",
  "repeat-check": "Stage 5"
};
const SPELLING_FOCUS_LABELS = {
  "over-articulation": "Over-articulation and hidden sounds",
  "word-family": "Word families and pattern transfer",
  mnemonic: "Mnemonic-worthy spellings",
  "look-right": "Visual checking: does it look right?"
};
const SPELLING_UNIT_SEED = {
  id: "spelling-progression",
  title: "Practice Property",
  intro:
    "Run a five-stage practice session built from the words that still need attention, then earn ribbons and grow your horse property.",
  diagnosticTargetCount: 10,
  followUpWordCount: 10,
  reviewDays: ["Day 1", "Day 3", "Day 7", "Day 14", "Day 30"]
};
const SPELLING_SESSION_NEW_WORD_COUNT = 4;
const SPELLING_SESSION_REVIEW_WORD_COUNT = 6;
const SPELLING_CUMULATIVE_REVIEW_FREQUENCY = 5;
const SPELLING_SESSION_REVIEW_INTERVALS = [1, 2, 4, 7, 10];
const SPELLING_HOME_TABS = ["session", "property", "progress", "stable", "paddock"];
const SPELLING_PADDOCK_HORSES = [
  { id: "arabian", label: "Arabian", name: "Dusty", age: 7, image: "/horses/Arabian.png" },
  { id: "quarter-horse", label: "Quarter Horse", name: "Willow", age: 8, image: "/horses/Quarter Horse.png" },
  { id: "thoroughbred", label: "Thoroughbred", name: "Comet", age: 6, image: "/horses/Thoroughbred.png" },
  { id: "australian-stock-horse", label: "Australian Stock Horse", name: "Maple", age: 9, image: "/horses/Australian Stock Horse.png" },
  { id: "clydesdale", label: "Clydesdale", name: "Bracken", age: 10, image: "/horses/Clydesdale.png" },
  { id: "fresian", label: "Fresian", name: "Skye", age: 8, image: "/horses/Fresian.png" },
  { id: "andalusian", label: "Andalusian", name: "Juniper", age: 7, image: "/horses/Andalusian.png" },
  { id: "morgan-horse", label: "Morgan Horse", name: "Scout", age: 11, image: "/horses/Morgan House.png" },
  { id: "appaloosa", label: "Appaloosa", name: "Poppy", age: 5, image: "/horses/Appaloosa.png" },
  { id: "paint-horse", label: "Paint Horse", name: "Ember", age: 6, image: "/horses/Paint Horse.png" },
  { id: "welsh-pony", label: "Welsh Pony", name: "Tilly", age: 9, image: "/horses/Welsh Pony.png" },
  { id: "connemara-pony", label: "Connemara Pony", name: "Mabel", age: 8, image: "/horses/Connemara Pony.png" },
  { id: "shetland-pony", label: "Shetland Pony", name: "Honey", age: 12, image: "/horses/Shetland Pony.png" },
  { id: "gypsy-vanner", label: "Gypsy Vanner", name: "Rowan", age: 7, image: "/horses/Gypsy Vanner.png" },
  { id: "percheron", label: "Percheron", name: "Fern", age: 9, image: "/horses/Percheron.png" },
  { id: "haflinger", label: "Haflinger", name: "Clover", age: 6, image: "/horses/Haflinger.png" },
  { id: "tennessee-walking-horse", label: "Tennessee Walking Horse", name: "Marley", age: 8, image: "/horses/Tennessee Walking Horse .png" },
  { id: "akhal-teke", label: "Akhal-Teke", name: "Flint", age: 7, image: "/horses/Akhal-Teke.png" },
  { id: "mustang", label: "Mustang", name: "Storm", age: 5, image: "/horses/Mustang.png" },
  { id: "irish-sport-horse", label: "Irish Sport Horse", name: "Jasper", age: 9, image: "/horses/Irish Sport Horse.png" }
];
const SPELLING_PADDOCK_HORSE_SIZE_STEPS = [0.8, 1, 1.2, 1.4];
const SPELLING_PADDOCK_HORSE_DEFAULT_SCALE = SPELLING_PADDOCK_HORSE_SIZE_STEPS[1];
const SPELLING_PADDOCK_HORSE_BASE_WIDTH = 150;
const SPELLING_PADDOCK_HORSE_BASE_HEIGHT = 132;
const SPELLING_PADDOCK_FRONT_FENCE_POINTS = [
  { x: 0.34, y: 0.53 },
  { x: 0.46, y: 0.57 },
  { x: 0.57, y: 0.56 },
  { x: 0.72, y: 0.55 },
  { x: 1, y: 0.56 }
];
const SPELLING_PADDOCK_HORSE_ID_ALIASES = Object.fromEntries(
  SPELLING_PADDOCK_HORSES.flatMap((horse) => {
    const aliases = new Set([
      String(horse.id || "").trim().toLowerCase(),
      String(horse.label || "").trim().toLowerCase(),
      String(horse.label || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    ]);
    return [...aliases].filter(Boolean).map((alias) => [alias, horse.id]);
  })
);
const SPELLING_PADDOCK_HORSE_BY_ID = Object.fromEntries(
  SPELLING_PADDOCK_HORSES.map((horse) => [horse.id, horse])
);
const SPELLING_HORSE_RANKS = ["Foal", "Pony", "School Horse", "Show Horse", "Champion"];
const SPELLING_TENSE_IDS = ["past", "present", "future"];
const SPELLING_CHALLENGE_MODE_ORDER = ["looks-right", "dictation", "root-word", "missing-letter"];
const RP_STORAGE_KEY = "paperpanda:property:v1";
const RP_MANDATORY_REWARDS = [
  { id: "arena-stage", label: "The arena", description: "Surface laid, hedging, mirrors", badge: "Stage 1", worldStage: 1 },
  { id: "stables-stage", label: "The stables", description: "Six stalls, aisle, feed room", badge: "Stage 2", worldStage: 2 },
  { id: "paddocks-stage", label: "Paddocks & fences", description: "Pasture seeded, post-and-rail up", badge: "Stage 3", worldStage: 3 },
  { id: "driveway-stage", label: "The driveway", description: "Gravel drive and front gate", badge: "Stage 4", worldStage: 4 },
  { id: "round-pen-stage", label: "The round pen", description: "A training yard for groundwork", badge: "Stage 5", worldStage: 5 },
  { id: "back-trail-stage", label: "Back paddock trail", description: "A riding track through the back blocks", badge: "Stage 6", worldStage: 6 }
];
const RP_OPTIONAL_REWARDS = [
  { id: "saddles", track: "tack", label: "Saddles", description: "A saddle for every horse in the stable" },
  { id: "bridles", track: "tack", label: "Bridles", description: "Bridles and reins on the tack room hooks" },
  { id: "saddle-pads", track: "tack", label: "Saddle pads", description: "Numnahs stacked on the pad rack" },
  { id: "girths", track: "tack", label: "Girths", description: "Girths hung beside the saddles" },
  { id: "riders", track: "property", label: "Riders", description: "Riders you can put up on any horse" },
  { id: "horse-float", track: "property", label: "Horse float", description: "Two-horse float parked by the shed" },
  { id: "horse-wash-bay", track: "property", label: "Horse wash bay", description: "Tiled bay with warm water and a hose" },
  { id: "arena-lights", track: "arena", label: "Arena lights", description: "Four towers — ride after dark" },
  { id: "arena-roof", track: "arena", label: "Arena roof", description: "Covered arena, ride in any weather" }
];
const RP_REPEATABLE_REWARD_IDS = new Set(["saddles", "bridles", "saddle-pads", "girths"]);
const RP_OPTIONAL_REWARD_TRACKS = {
  tack: ["saddles", "bridles", "saddle-pads", "girths"],
  property: ["riders", "horse-float", "horse-wash-bay"],
  arena: ["arena-lights", "arena-roof"]
};
const RP_REWARD_BY_ID = Object.fromEntries(
  [...RP_MANDATORY_REWARDS, ...RP_OPTIONAL_REWARDS].map((reward) => [reward.id, reward])
);
const RP_TACK_REWARD_BY_CATEGORY = {
  saddle: "saddles",
  bridle: "bridles",
  pad: "saddle-pads",
  girth: "girths"
};
const RP_STAGES = [
  ["/property/horse-property-stage1-base.png", "Before any renovations", "The property starts fully unrenovated: muddy yards, rusted sheds, broken rails, and no riding facilities restored yet."],
  ["/property/horse-property-stage2-arena.jpeg", "Stage 1 - the arena", "The arena surface is in, the hedging is planted, and the first tidy training space has been rebuilt."],
  ["/property/horse-property-stage3-stables.jpeg", "Stage 2 - the stables", "The stable block is restored with clean stalls, a working aisle, and the yard cleared back."],
  ["/property/horse-property-stage4-paddocks.jpeg", "Stage 3 - paddocks & fences", "The paddocks are greener, fencing is repaired, and the property is starting to function again."],
  ["/property/horse-property-stage5-driveway.jpeg", "Stage 4 - the driveway", "The front approach is shaped into a proper drive and the entrance begins to feel established."],
  ["/property/horse-property-stage6-round-pen.jpeg", "Stage 5 - the round pen", "The entry is finished, the grounds are landscaped, and the round pen is added beside the arena."],
  ["/property/horse-property-stage7-back-trail.jpeg", "Stage 6 - back paddock trail", "The full property is finished, with the back trail open and riders moving through the far paddocks."]
];
const RP_TACK = [
  { k: "saddle", label: "Saddle", x: 38.8, y: 40.3, w: 21.5, h: 23.5, rotate: -2 },
  { k: "bridle", label: "Bridle", x: 28.8, y: 64.5, w: 15.4, h: 26.2, rotate: -2 },
  { k: "girth", label: "Girth", x: 52.2, y: 47.6, w: 12.6, h: 8.6, rotate: 2 },
  { k: "pad", label: "Saddle pad", x: 84.1, y: 38.6, w: 15.2, h: 12.8, rotate: 10 }
];
const RP_ZONES = [
  { n: "the round pen", x1: 3, x2: 19, y1: 24, y2: 38, minStage: 5 },
  { n: "the back paddock", x1: 17, x2: 45, y1: 16, y2: 42 },
  { n: "the arena", x1: 8, x2: 43, y1: 39, y2: 74 },
  { n: "the laneway", x1: 28, x2: 47, y1: 34, y2: 54 },
  { n: "the stable yard", x1: 46, x2: 73, y1: 36, y2: 58 },
  { n: "the back trail paddock", x1: 70, x2: 98, y1: 16, y2: 45, minStage: 6 },
  { n: "the right paddock", x1: 78, x2: 99, y1: 43, y2: 95 },
  { n: "the front drive", x1: 33, x2: 67, y1: 56, y2: 98 },
  { n: "the front lawn", x1: 1, x2: 19, y1: 48, y2: 98 }
];
const RP_HOTSPOTS = [
  { view: "stable", label: "STABLES", x: 57.5, y: 31, color: "rgba(110,90,134,.9)" },
  { view: "tack", label: "TACK ROOM", x: 79, y: 44, color: "rgba(94,125,99,.92)" }
];
const RP_ASSETS = {
  tackRoom: "/property/tack-room-empty.jpeg",
  saddle: "/property/saddle-reward.jpeg",
  arena: "/property/arena-empty.jpeg",
  horseFloat: "/property/horse-float.jpeg",
  horseWashBay: "/property/horse-wash-bay.jpeg"
};
const RP_VARIANT_SHEETS = {
  rider: {
    src: "/property/riders-sheet.jpeg",
    width: 3090,
    height: 1344,
    items: [
      { id: "sarah", label: "Sarah", x: 30, y: 90, w: 520, h: 980 },
      { id: "aisha", label: "Aisha", x: 580, y: 120, w: 520, h: 940 },
      { id: "chloe", label: "Chloe", x: 1180, y: 150, w: 460, h: 920 },
      { id: "max", label: "Max", x: 1790, y: 115, w: 470, h: 960 },
      { id: "leo", label: "Leo", x: 2390, y: 105, w: 560, h: 960 }
    ]
  },
  pad: {
    src: "/property/pads-sheet.jpeg",
    width: 3090,
    height: 1344,
    items: [
      { id: "midnight-blue", label: "Midnight Blue", x: 20, y: 120, w: 720, h: 390 },
      { id: "emerald-green", label: "Emerald Green", x: 770, y: 120, w: 720, h: 390 },
      { id: "bordeaux-red", label: "Bordeaux Red", x: 1520, y: 120, w: 720, h: 390 },
      { id: "rose-gold", label: "Rose Gold", x: 2270, y: 120, w: 720, h: 390 },
      { id: "champagne-gold", label: "Champagne Gold", x: 20, y: 760, w: 720, h: 390 },
      { id: "silver-grey", label: "Silver Grey", x: 770, y: 760, w: 720, h: 390 },
      { id: "black-pad", label: "Black", x: 1520, y: 760, w: 720, h: 390 },
      { id: "dark-teal", label: "Dark Teal", x: 2270, y: 760, w: 720, h: 390 }
    ]
  },
  girth: {
    src: "/property/girths-sheet.jpeg",
    width: 3090,
    height: 1344,
    items: [
      { id: "black-girth", label: "Black girth", x: 80, y: 360, w: 1320, h: 430 },
      { id: "brown-girth", label: "Brown girth", x: 1680, y: 340, w: 1320, h: 430 }
    ]
  },
  bridle: {
    src: "/property/bridles-sheet.jpeg",
    width: 3090,
    height: 1344,
    items: [
      { id: "brown-bridle", label: "Brown bridle", x: 180, y: 90, w: 980, h: 920 },
      { id: "black-bridle", label: "Black bridle", x: 1680, y: 90, w: 980, h: 920 }
    ]
  }
};
const RP_JUMP_SHEET = {
  src: "/property/jumps-sheet.jpeg",
  width: 3090,
  height: 1344,
  items: [
    { id: "vertical-jump", label: "Vertical jump", x: 20, y: 240, w: 500, h: 560, arenaWidth: 13 },
    { id: "spread-oxer", label: "Spread oxer", x: 520, y: 240, w: 620, h: 560, arenaWidth: 17 },
    { id: "water-jump", label: "Water jump", x: 1080, y: 250, w: 690, h: 560, arenaWidth: 19 },
    { id: "rustic-plank", label: "Rustic plank", x: 1790, y: 250, w: 620, h: 540, arenaWidth: 17 },
    { id: "hay-bale", label: "Hay bale", x: 2440, y: 250, w: 620, h: 540, arenaWidth: 17 }
  ]
};
const RP_TACK_VARIANT_KEYS = ["pad", "bridle", "girth"];
const RP_GRAMMAR_PROGRESS_RESET_VERSION = 3;
const RP_REWARD_PROGRESS_RESET_VERSION = 3;
const SPELLING_TENSE_PROMPTS = {
  believe: {
    past: "They believed the strongest explanation straight away.",
    present: "They believe the strongest explanation straight away.",
    future: "They will believe the strongest explanation straight away."
  },
  describe: {
    past: "They described the image with precise detail.",
    present: "They describe the image with precise detail.",
    future: "They will describe the image with precise detail."
  },
  decide: {
    past: "They decided which example proved the point best.",
    present: "They decide which example proves the point best.",
    future: "They will decide which example proves the point best."
  },
  imagine: {
    past: "They imagined a stronger ending for the story.",
    present: "They imagine a stronger ending for the story.",
    future: "They will imagine a stronger ending for the story."
  },
  measure: {
    past: "They measured the fabric before cutting it.",
    present: "They measure the fabric before cutting it.",
    future: "They will measure the fabric before cutting it."
  },
  notice: {
    past: "They noticed the spelling pattern quickly.",
    present: "They notice the spelling pattern quickly.",
    future: "They will notice the spelling pattern quickly."
  },
  remember: {
    past: "They remembered the rule during the test.",
    present: "They remember the rule during the test.",
    future: "They will remember the rule during the test."
  },
  appear: {
    past: "They appeared on stage with calm confidence.",
    present: "They appear on stage with calm confidence.",
    future: "They will appear on stage with calm confidence."
  },
  separate: {
    past: "They separated the facts from the opinions.",
    present: "They separate the facts from the opinions.",
    future: "They will separate the facts from the opinions."
  },
  achieve: {
    past: "They achieved their goal through steady practice.",
    present: "They achieve their goal through steady practice.",
    future: "They will achieve their goal through steady practice."
  },
  compare: {
    past: "They compared the two paragraphs carefully.",
    present: "They compare the two paragraphs carefully.",
    future: "They will compare the two paragraphs carefully."
  },
  complete: {
    past: "They completed the task before lunch.",
    present: "They complete the task before lunch.",
    future: "They will complete the task before lunch."
  },
  consider: {
    past: "They considered every option before answering.",
    present: "They consider every option before answering.",
    future: "They will consider every option before answering."
  },
  continue: {
    past: "They continued the draft after the break.",
    present: "They continue the draft after the break.",
    future: "They will continue the draft after the break."
  },
  discover: {
    past: "They discovered a better piece of evidence.",
    present: "They discover a better piece of evidence.",
    future: "They will discover a better piece of evidence."
  },
  improve: {
    past: "They improved the paragraph with one clear change.",
    present: "They improve the paragraph with one clear change.",
    future: "They will improve the paragraph with one clear change."
  },
  include: {
    past: "They included a quote in the response.",
    present: "They include a quote in the response.",
    future: "They will include a quote in the response."
  },
  observe: {
    past: "They observed the pattern in the results.",
    present: "They observe the pattern in the results.",
    future: "They will observe the pattern in the results."
  },
  prepare: {
    past: "They prepared the notes for the lesson.",
    present: "They prepare the notes for the lesson.",
    future: "They will prepare the notes for the lesson."
  },
  deliver: {
    past: "They delivered the speech with confidence.",
    present: "They deliver the speech with confidence.",
    future: "They will deliver the speech with confidence."
  }
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
  },
  compare: {
    id: "compare",
    word: "compare",
    articulation: "com-pare",
    lookRightChoiceCorrect: "com-pare",
    lookRightChoiceWrong: "com-pair",
    focuses: ["word-family", "look-right"],
    familyWords: ["comparison", "comparable", "compares"],
    familySentences: [
      "The comparison between the two texts was clear.",
      "The examples were comparable because they used the same structure.",
      "She compares each paragraph before choosing the best one."
    ],
    familyNote: "The compare base stays visible as the ending changes.",
    lookRightWrong: "compair",
    lookRightNote: "The /pare/ ending is spelled are here, not air.",
    flashcardBreak: "com | pare",
    tense: {
      present: "compare",
      past: "compared",
      future: "will compare",
      options: ["compare", "compared", "will compare", "compair", "will compared", "comparison"]
    }
  },
  complete: {
    id: "complete",
    word: "complete",
    articulation: "com-plete",
    lookRightChoiceCorrect: "com-plete",
    lookRightChoiceWrong: "com-pleet",
    focuses: ["look-right", "word-family"],
    familyWords: ["completion", "completely", "completed"],
    familySentences: [
      "The completion of the draft took the whole lesson.",
      "The instructions were completely clear after the example.",
      "She completed the final paragraph before the bell."
    ],
    familyNote: "Keep the complete base visible before the ending changes.",
    lookRightWrong: "compleet",
    lookRightNote: "The long e sound is not written with double e in this pattern.",
    flashcardBreak: "com | plete",
    tense: {
      present: "complete",
      past: "completed",
      future: "will complete",
      options: ["complete", "completed", "will complete", "compleet", "will completed", "completion"]
    }
  },
  consider: {
    id: "consider",
    word: "consider",
    articulation: "con-sid-er",
    lookRightChoiceCorrect: "con-sid-er",
    lookRightChoiceWrong: "con-sid-a",
    focuses: ["word-family", "look-right"],
    familyWords: ["consideration", "considered", "considering"],
    familySentences: [
      "Careful consideration improved the final answer.",
      "She considered each quote before selecting the strongest one.",
      "He is considering a better way to explain the idea."
    ],
    familyNote: "The consider base remains visible across the family.",
    lookRightWrong: "consida",
    lookRightNote: "The ending still uses er, even when the last sound is soft.",
    flashcardBreak: "con | sid | er",
    tense: {
      present: "consider",
      past: "considered",
      future: "will consider",
      options: ["consider", "considered", "will consider", "consida", "will considered", "consideration"]
    }
  },
  continue: {
    id: "continue",
    word: "continue",
    articulation: "con-tin-ue",
    lookRightChoiceCorrect: "con-tin-ue",
    lookRightChoiceWrong: "con-tin-ew",
    focuses: ["over-articulation", "word-family"],
    familyWords: ["continued", "continuing", "continuation"],
    familySentences: [
      "She continued writing after the short break.",
      "He is continuing the explanation with a better example.",
      "The continuation of the story felt more confident."
    ],
    familyNote: "Over-articulating con-tin-ue keeps the final ue visible.",
    lookRightWrong: "continew",
    lookRightNote: "The final sound is written ue, not ew, in this word family.",
    flashcardBreak: "con | tin | ue",
    tense: {
      present: "continue",
      past: "continued",
      future: "will continue",
      options: ["continue", "continued", "will continue", "continew", "will continued", "continuation"]
    }
  },
  discover: {
    id: "discover",
    word: "discover",
    articulation: "dis-cov-er",
    lookRightChoiceCorrect: "dis-cov-er",
    lookRightChoiceWrong: "dis-cuv-a",
    focuses: ["word-family", "look-right"],
    familyWords: ["discovery", "discovered", "discovering"],
    familySentences: [
      "The discovery changed the whole discussion.",
      "She discovered a better quote in the final paragraph.",
      "He is discovering how the pattern repeats."
    ],
    familyNote: "The discover base stays stable as the word changes.",
    lookRightWrong: "discuva",
    lookRightNote: "The ending still uses er, and the middle vowel stays o in the base.",
    flashcardBreak: "dis | cov | er",
    tense: {
      present: "discover",
      past: "discovered",
      future: "will discover",
      options: ["discover", "discovered", "will discover", "discuva", "will discovered", "discovery"]
    }
  },
  improve: {
    id: "improve",
    word: "improve",
    articulation: "im-prove",
    lookRightChoiceCorrect: "im-prove",
    lookRightChoiceWrong: "im-proov",
    focuses: ["look-right", "word-family"],
    familyWords: ["improvement", "improved", "improving"],
    familySentences: [
      "The improvement was obvious in the second draft.",
      "She improved the sentence by adding evidence.",
      "He is improving his spelling through daily practice."
    ],
    familyNote: "The improve base carries forward into each family word.",
    lookRightWrong: "improov",
    lookRightNote: "The long oo sound is not written with double o here.",
    flashcardBreak: "im | prove",
    tense: {
      present: "improve",
      past: "improved",
      future: "will improve",
      options: ["improve", "improved", "will improve", "improov", "will improved", "improvement"]
    }
  },
  include: {
    id: "include",
    word: "include",
    articulation: "in-clude",
    lookRightChoiceCorrect: "in-clude",
    lookRightChoiceWrong: "in-clewd",
    focuses: ["look-right", "word-family"],
    familyWords: ["inclusion", "included", "including"],
    familySentences: [
      "The inclusion of one detail made the answer stronger.",
      "She included a quotation to support the point.",
      "He is including more precise vocabulary this time."
    ],
    familyNote: "The include base remains visible before each new ending.",
    lookRightWrong: "inclewd",
    lookRightNote: "The final sound is written ude, not ewd, in this family.",
    flashcardBreak: "in | clude",
    tense: {
      present: "include",
      past: "included",
      future: "will include",
      options: ["include", "included", "will include", "inclewd", "will included", "inclusion"]
    }
  },
  observe: {
    id: "observe",
    word: "observe",
    articulation: "ob-serve",
    lookRightChoiceCorrect: "ob-serve",
    lookRightChoiceWrong: "ub-serve",
    focuses: ["word-family", "look-right"],
    familyWords: ["observation", "observed", "observing"],
    familySentences: [
      "Her observation about the poem was precise.",
      "He observed the pattern before the class discussion.",
      "She is observing how the writer repeats that idea."
    ],
    familyNote: "The observe base stays visible through the family.",
    lookRightWrong: "ubserve",
    lookRightNote: "The word begins with ob, not ub, even though the first vowel is unstressed.",
    flashcardBreak: "ob | serve",
    tense: {
      present: "observe",
      past: "observed",
      future: "will observe",
      options: ["observe", "observed", "will observe", "ubserve", "will observed", "observation"]
    }
  },
  prepare: {
    id: "prepare",
    word: "prepare",
    articulation: "pre-pare",
    lookRightChoiceCorrect: "pre-pare",
    lookRightChoiceWrong: "pre-pair",
    focuses: ["word-family", "look-right"],
    familyWords: ["preparation", "prepared", "preparing"],
    familySentences: [
      "Good preparation made the speech more confident.",
      "She prepared her answer before sharing it.",
      "He is preparing a stronger opening sentence."
    ],
    familyNote: "The prepare base stays settled as the word changes.",
    lookRightWrong: "prepair",
    lookRightNote: "The /pare/ sound is written are in this family.",
    flashcardBreak: "pre | pare",
    tense: {
      present: "prepare",
      past: "prepared",
      future: "will prepare",
      options: ["prepare", "prepared", "will prepare", "prepair", "will prepared", "preparation"]
    }
  },
  deliver: {
    id: "deliver",
    word: "deliver",
    articulation: "de-liv-er",
    lookRightChoiceCorrect: "de-liv-er",
    lookRightChoiceWrong: "de-liv-a",
    focuses: ["word-family", "look-right"],
    familyWords: ["delivery", "delivered", "delivering"],
    familySentences: [
      "The delivery of the speech was calm and clear.",
      "She delivered the point with strong evidence.",
      "He is delivering a more confident response now."
    ],
    familyNote: "The deliver base remains visible across the family.",
    lookRightWrong: "deliva",
    lookRightNote: "The ending still uses er, not a, even when the sound is weak.",
    flashcardBreak: "de | liv | er",
    tense: {
      present: "deliver",
      past: "delivered",
      future: "will deliver",
      options: ["deliver", "delivered", "will deliver", "deliva", "will delivered", "delivery"]
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
  { id: "decide", word: "decide", yearLevel: "7", sentence: "Decide which example is strongest.", focuses: ["word-family", "look-right"], articulation: "de-cide", interventionId: "decide" },
  { id: "compare", word: "compare", yearLevel: "5", sentence: "Compare the two characters in one sentence.", focuses: ["word-family", "look-right"], articulation: "com-pare", interventionId: "compare" },
  { id: "complete", word: "complete", yearLevel: "5", sentence: "Complete the final line before you stop.", focuses: ["look-right", "word-family"], articulation: "com-plete", interventionId: "complete" },
  { id: "continue", word: "continue", yearLevel: "5", sentence: "Continue writing after the planner is checked.", focuses: ["over-articulation", "word-family"], articulation: "con-tin-ue", interventionId: "continue" },
  { id: "discover", word: "discover", yearLevel: "5", sentence: "Discover a better detail in the next paragraph.", focuses: ["word-family", "look-right"], articulation: "dis-cov-er", interventionId: "discover" },
  { id: "include", word: "include", yearLevel: "5", sentence: "Include one quote in your answer.", focuses: ["look-right", "word-family"], articulation: "in-clude", interventionId: "include" },
  { id: "consider", word: "consider", yearLevel: "7", sentence: "Consider how the evidence supports the claim.", focuses: ["word-family", "look-right"], articulation: "con-sid-er", interventionId: "consider" },
  { id: "deliver", word: "deliver", yearLevel: "7", sentence: "Deliver the speech with a steady pace.", focuses: ["word-family", "look-right"], articulation: "de-liv-er", interventionId: "deliver" },
  { id: "improve", word: "improve", yearLevel: "7", sentence: "Improve the topic sentence with precise language.", focuses: ["look-right", "word-family"], articulation: "im-prove", interventionId: "improve" },
  { id: "observe", word: "observe", yearLevel: "7", sentence: "Observe how the motif returns in the final scene.", focuses: ["word-family", "look-right"], articulation: "ob-serve", interventionId: "observe" },
  { id: "prepare", word: "prepare", yearLevel: "7", sentence: "Prepare your response before the discussion begins.", focuses: ["word-family", "look-right"], articulation: "pre-pare", interventionId: "prepare" }
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
  authViewOpen: true,
  selectedSubjectId: subjectSeed[0].id,
  activeSubjectTab: "reader",
  focusArea: null,
  focusAskOpen: false,
  subjectWorkspaceExpanded: false,
  subjectWorkspaceExpandedSubjectId: "",
  subjectWorkspaceReturnLandingSubjectId: "",
  subjectLandingOpenDocumentId: "",
  subjectLandingView: "simple",
  subjectLandingPieceIndex: 0,
  subjectLandingSubjectMenuOpen: false,
  subjectLandingAskOpen: false,
  subjectLandingAskDraft: "",
  subjectLandingAskStatus: "",
  subjectLandingAskAnswer: "",
  subjectLandingAskLastQuestion: "",
  selectedDocumentId: null,
  currentDocumentPageIndexes: {},
  activeReaderSegmentIndex: -1,
  activeReaderSectionId: "",
  askDocumentId: null,
  askStatusSubjectId: "",
  askStatus: "",
  askLatestSubjectId: "",
  askLatestQuestion: "",
  askLatestAnswer: "",
  listeningDocumentId: null,
  selectedDocumentIds: [],
  googleDocsAccessToken: "",
  googleDocsTokenExpiresAt: 0,
  askMicActive: false,
  askResponseSpeaking: false,
  askResponsePaused: false,
  spellingAudioStatus: {
    context: "",
    tone: "",
    message: ""
  },
  expandedDocumentGroups: {},
  attachmentModalOpen: false,
  activeAttachmentTarget: null,
  expandedAttachmentGroups: {},
  editAssessmentModalOpen: false,
  activeEditAssessment: null,
  watchExpanded: false,
  documentsExpanded: false,
  documentsRevisionExpanded: false,
  subjectLandingAssessmentExpanded: true,
  subjectLandingClassNotesExpanded: true,
  subjectLandingRevisionExpanded: false,
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
const currentSpellingSessionKey = createId();

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
  navCalendarButton: document.getElementById("nav-calendar-button"),
  navSettingsButton: document.getElementById("nav-settings-button"),
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
  subjectLandingView: document.getElementById("subject-landing-view"),
  subjectsWorkspaceMain: document.getElementById("subjects-workspace-main"),
  subjectsWorkspaceDock: document.getElementById("subjects-workspace-dock"),
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
  upcomingModalEyebrow: document.getElementById("upcoming-modal-eyebrow"),
  upcomingModalTitle: document.getElementById("upcoming-modal-title"),
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
  tabCountGrammar: document.getElementById("tab-count-grammar"),
  tabCountWriting: document.getElementById("tab-count-writing"),
  tabCountWatch: document.getElementById("tab-count-watch"),
  tabCountAssessments: document.getElementById("tab-count-assessments"),
  readingViewerMeta: document.getElementById("reading-viewer-meta"),
  viewerPanelReader: document.getElementById("viewer-panel-reader"),
  viewerPanelHomework: document.getElementById("viewer-panel-homework"),
  viewerPanelSpelling: document.getElementById("viewer-panel-spelling"),
  viewerPanelGrammar: document.getElementById("viewer-panel-grammar"),
  viewerPanelWriting: document.getElementById("viewer-panel-writing"),
  viewerPanelWatch: document.getElementById("viewer-panel-watch"),
  watchAddLinkButton: document.getElementById("watch-add-link-button"),
  viewerPanelAssessments: document.getElementById("viewer-panel-assessments"),
  grammarSection: document.getElementById("grammar-section"),
  writingSection: document.getElementById("writing-section"),
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
  askRewindButton: document.getElementById("ask-rewind-button"),
  askMicButton: document.getElementById("ask-mic-button"),
  askListenButton: document.getElementById("ask-listen-button"),
  askPauseButton: document.getElementById("ask-pause-button"),
  askForwardButton: document.getElementById("ask-forward-button"),
  askStopButton: document.getElementById("ask-stop-button"),
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
    grammar: createDefaultGrammarState(subject.id),
    spelling: createDefaultSpellingState(subject.id, subject.name),
    writing: createDefaultWritingState(subject.id)
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
    grammar: createDefaultGrammarState(subject.id),
    spelling: createDefaultSpellingState(subject.id, subject.name),
    writing: createDefaultWritingState(subject.id)
  }));
}

function isSpellingSubjectRecord(subjectId = "", subjectName = "") {
  const normalizedSubjectId = String(subjectId || "").trim().toLowerCase();
  if (normalizedSubjectId === "spelling") {
    return true;
  }

  const normalizedSubjectName = String(subjectName || "").trim().toLowerCase();
  if (!normalizedSubjectName) {
    return false;
  }

  return (subjectAliasMap.spelling || []).some((alias) => alias.trim().toLowerCase() === normalizedSubjectName);
}

function findSeedSubjectByAlias(value = "") {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  return subjectTemplateSeed.find((seededSubject) => {
    if (seededSubject.id.trim().toLowerCase() === normalizedValue) {
      return true;
    }
    if (seededSubject.name.trim().toLowerCase() === normalizedValue) {
      return true;
    }
    return (subjectAliasMap[seededSubject.id] || []).some((alias) => alias.trim().toLowerCase() === normalizedValue);
  }) || null;
}

function resolveSubjectSeedEntry(subject, index) {
  const explicitId = String(subject?.id || "").trim();
  if (explicitId) {
    const seededById = findSeedSubjectByAlias(explicitId);
    if (seededById) {
      return seededById;
    }
  }

  const subjectName = String(subject?.name || "").trim();
  if (subjectName) {
    const seededByName = findSeedSubjectByAlias(subjectName);
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

function getPracticeSubject() {
  return state.subjects.find((subject) => isSpellingSubjectRecord(subject.id, subject.name)) || null;
}

function getWritingSubject() {
  return getPracticeSubject();
}

function resolveWorkspaceSubjectForTab(tab = "", fallbackSubject = getSelectedSubject()) {
  if (tab === "spelling" || tab === "grammar") {
    return getPracticeSubject() || fallbackSubject || null;
  }
  if (tab === "writing") {
    return getWritingSubject() || fallbackSubject || null;
  }
  return fallbackSubject || null;
}

function getWorkspaceSubjectForTab(tab = state.activeSubjectTab, fallbackSubject = getSelectedSubject()) {
  return resolveWorkspaceSubjectForTab(tab, fallbackSubject) || fallbackSubject || null;
}

function syncSelectedSubjectForWorkspaceTab(tab = state.activeSubjectTab) {
  if (state.currentView !== "subjects") {
    return getSelectedSubject();
  }

  if (!["spelling", "grammar", "writing"].includes(String(tab || ""))) {
    return getSelectedSubject();
  }

  const currentSubject = getSelectedSubject();
  const targetSubject = getWorkspaceSubjectForTab(tab, currentSubject);
  if (targetSubject && state.selectedSubjectId !== targetSubject.id) {
    state.selectedSubjectId = targetSubject.id;
  }

  return targetSubject || currentSubject || null;
}

function selectSubjectForSubjectsView(subjectId, { returnToHome = false } = {}) {
  const subject = state.subjects.find((item) => item.id === subjectId);
  if (!subject) {
    return;
  }

  state.selectedSubjectId = subject.id;
  state.activeSubjectTab = getPreferredSubjectTab(subject);
  resetSubjectWorkspaceView();
  state.focusArea = null;
  state.focusAskOpen = false;
  state.selectedDocumentIds = [];
  state.expandedDocumentGroups = {};
  state.watchExpanded = false;
  state.documentsExpanded = false;
  state.taskAskResponse = "";
  state.taskAskStatus = "";
  state.currentView = returnToHome ? "home" : "subjects";
  render();
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
  return getReaderDocuments(subject).filter((documentRecord) => !documentRecord?.flags?.assessment);
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

function isRevisionArchivedDocument(documentRecord) {
  return Boolean(documentRecord?.revisionArchived);
}

function getAllReaderDocuments(subject) {
  return getSortedDocuments(subject).filter((documentRecord) => !isHomeworkDocument(documentRecord));
}

function getReaderDocuments(subject) {
  return getAllReaderDocuments(subject).filter((documentRecord) => !isRevisionArchivedDocument(documentRecord));
}

function getRevisionReaderDocuments(subject) {
  return getAllReaderDocuments(subject).filter((documentRecord) => isRevisionArchivedDocument(documentRecord));
}

function isRevisionSectionExpanded(subject) {
  const activeDocuments = getReaderDocuments(subject || { documents: [] });
  const revisionDocuments = getRevisionReaderDocuments(subject || { documents: [] });
  return state.documentsRevisionExpanded || (!activeDocuments.length && revisionDocuments.length > 0);
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
  return getReaderDocuments(subject);
}

function hasCurrentDocumentStudyPlan(documentRecord) {
  const storedSections = Array.isArray(documentRecord?.studySections)
    ? documentRecord.studySections.map(normaliseStudySection).filter((section) => section.sectionText)
    : [];
  return (
    Number(documentRecord?.studyPlanVersion || 0) >= STUDY_PLAN_VERSION &&
    storedSections.length > 0 &&
    ["ready", "fallback"].includes(String(documentRecord?.studyPlanStatus || ""))
  );
}

function getSelectedDocument() {
  const subject = getSelectedSubject();
  return getAllReaderDocuments(subject || { documents: [] }).find((doc) => doc.id === state.selectedDocumentId) || null;
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
  if (documentRecord.studyPlanStatus === "loading") {
    return;
  }
  if (!force && hasCurrentDocumentStudyPlan(documentRecord)) {
    return;
  }

  documentRecord.studyPlanStatus = "loading";
  renderReader();

  try {
    await hydrateDocumentPreviewImages(documentRecord);
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
    documentRecord.studyPlanVersion = STUDY_PLAN_VERSION;
  } catch (error) {
    console.error("Document study plan failed.", error);
    const fallbackPlan = buildFallbackStudyPlan(documentRecord);
    documentRecord.studyOverview = fallbackPlan.overview;
    documentRecord.importantTerms = fallbackPlan.importantTerms;
    documentRecord.studySections = fallbackPlan.sections;
    documentRecord.endQuiz = fallbackPlan.quiz;
    documentRecord.studyPlanStatus = "fallback";
    documentRecord.studyPlanVersion = STUDY_PLAN_VERSION;
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
  return getAllReaderDocuments(subject || { documents: [] }).find((doc) => doc.id === state.askDocumentId) || null;
}

function getActiveAskDocument(surface = getActiveAskSurface()) {
  const subject = getSelectedSubject();
  if (surface?.kind === "landing") {
    return getSubjectLandingOpenDocument(subject);
  }
  return getAskDocument() || getSelectedDocument();
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
  const activeSurface = getActiveAskSurface();
  activeSurface?.input?.focus();
  activeSurface?.input?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function getDockAskSurface() {
  return {
    kind: "dock",
    input: elements.askInput,
    rewindButton: elements.askRewindButton,
    micButton: elements.askMicButton,
    listenButton: elements.askListenButton,
    pauseButton: elements.askPauseButton,
    forwardButton: elements.askForwardButton,
    stopButton: elements.askStopButton,
    context: elements.askContext,
    response: elements.askResponse
  };
}

function getSubjectLandingAskSurface() {
  if (!state.subjectLandingAskOpen || !elements.subjectLandingView || elements.subjectLandingView.classList.contains("hidden")) {
    return null;
  }

  const popup = elements.subjectLandingView.querySelector("[data-subject-landing-ask-popup]");
  if (!popup) {
    return null;
  }

  return {
    kind: "landing",
    input: popup.querySelector("[data-subject-landing-ask-input]"),
    rewindButton: popup.querySelector("[data-subject-landing-ask-rewind]"),
    micButton: popup.querySelector("[data-subject-landing-ask-mic]"),
    listenButton: popup.querySelector("[data-subject-landing-ask-listen]"),
    pauseButton: popup.querySelector("[data-subject-landing-ask-pause]"),
    forwardButton: popup.querySelector("[data-subject-landing-ask-forward]"),
    stopButton: popup.querySelector("[data-subject-landing-ask-stop]"),
    context: popup.querySelector("[data-subject-landing-ask-context]"),
    response: popup.querySelector("[data-subject-landing-ask-response]")
  };
}

function getAskSurfaces() {
  return [getDockAskSurface(), getSubjectLandingAskSurface()].filter(Boolean);
}

function getActiveAskSurface() {
  return getSubjectLandingAskSurface() || getDockAskSurface();
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
  const subject = resolveWorkspaceSubjectForTab(tab);
  if (subject) {
    state.selectedSubjectId = subject.id;
  }
  const availableTabs = getAvailableSubjectTabs(subject);
  const nextTab = availableTabs.includes(tab) ? tab : availableTabs[0] || "reader";
  state.currentView = "subjects";
  state.activeSubjectTab = nextTab;
  resetSubjectWorkspaceView();
  state.focusAskOpen = false;
  state.focusArea = null;
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
  return getDocumentGroupsFromDocuments(getAllReaderDocuments(subject || { documents: [] }));
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

function setDocumentRevisionArchivedState(subject, documentIds, revisionArchived) {
  const targetIds = new Set((documentIds || []).filter(Boolean));
  if (!subject || !targetIds.size) {
    return;
  }

  (subject.documents || []).forEach((documentRecord) => {
    if (!targetIds.has(documentRecord.id) || isHomeworkDocument(documentRecord)) {
      return;
    }
    documentRecord.revisionArchived = Boolean(revisionArchived);
  });

  const allReaderDocuments = getAllReaderDocuments(subject);
  if (!allReaderDocuments.some((documentRecord) => documentRecord.id === state.selectedDocumentId)) {
    state.selectedDocumentId = getReaderDocuments(subject)[0]?.id || getRevisionReaderDocuments(subject)[0]?.id || null;
  }
  if (!allReaderDocuments.some((documentRecord) => documentRecord.id === state.askDocumentId)) {
    state.askDocumentId = getReaderDocuments(subject)[0]?.id || getRevisionReaderDocuments(subject)[0]?.id || null;
  }

  persistSubjects();
}

function getSelectedDocumentIndex() {
  const documents = getAllReaderDocuments(getSelectedSubject() || { documents: [] });
  return documents.findIndex((documentRecord) => documentRecord.id === state.selectedDocumentId);
}

function getDocumentPages(documentRecord) {
  return Array.isArray(documentRecord?.pages)
    ? documentRecord.pages
        .filter((page) => page && (page.imageUrl || page.text || page.pageNumber))
        .map((page, index) => ({
          ...page,
          pageNumber: Number(page?.pageNumber || index + 1) || index + 1,
          askImageUrl: page?.askImageUrl || page?.imageUrl || null,
          questionBlocks: Array.isArray(page?.questionBlocks)
            ? page.questionBlocks.map(normaliseQuestionBlock).filter((block) => block.questionNumber && block.text)
            : buildWorksheetQuestionBlocksFromText(String(page?.text || ""), Number(page?.pageNumber || index + 1) || index + 1),
          imageUrl:
            page?.imageUrl ||
            (index === 0 && documentRecord?.previewImageUrl ? documentRecord.previewImageUrl : null)
        }))
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

function getRecommendedStudySectionCount(pageCount) {
  const totalPages = Math.max(1, Number(pageCount || 0) || 1);
  if (totalPages <= 1) {
    return 1;
  }
  if (totalPages <= 4) {
    return totalPages;
  }
  if (totalPages <= 12) {
    return Math.ceil(totalPages / 2);
  }
  if (totalPages <= 36) {
    return Math.ceil(totalPages / 3);
  }
  return Math.min(18, Math.ceil(totalPages / 4));
}

function getRecommendedStudySectionCountForDocument(documentRecord) {
  const pageTotal = Array.isArray(documentRecord?.pages) && documentRecord.pages.length
    ? documentRecord.pages.length
    : Math.max(1, Math.ceil(String(documentRecord?.content || "").trim().length / 1800));
  return getRecommendedStudySectionCount(pageTotal);
}

function selectAdjacentDocument(direction) {
  const documents = getAllReaderDocuments(getSelectedSubject() || { documents: [] });
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

function getSubjectLandingTone(type = "") {
  const normalizedType = String(type || "").trim().toLowerCase();
  if (normalizedType.includes("assessment")) {
    return "peach";
  }
  if (normalizedType.includes("homework")) {
    return "yellow";
  }
  if (normalizedType.includes("video")) {
    return "mint";
  }
  return "lilac";
}

function getSubjectLandingResourceBundles(subject) {
  return getDocumentGroupsFromDocuments(getReaderDocuments(subject || { documents: [] }));
}

function getSubjectLandingRevisionBundles(subject) {
  return getDocumentGroupsFromDocuments(getRevisionReaderDocuments(subject || { documents: [] }));
}

function isSubjectLandingAssessmentBundle(bundle) {
  const normalizedType = String(bundle?.type || "").trim().toLowerCase();
  if (normalizedType.includes("assessment") || normalizedType.includes("rubric")) {
    return true;
  }

  return Array.isArray(bundle?.documents) && bundle.documents.some((documentRecord) => {
    const documentType = String(documentRecord?.type || "").trim().toLowerCase();
    return Boolean(documentRecord?.flags?.assessment) || documentType.includes("assessment") || documentType.includes("rubric");
  });
}

function getSubjectLandingFolderMarkup({
  title,
  itemCount,
  expanded,
  toggleId,
  bodyMarkup = "",
  emptyTitle,
  emptyBody
}) {
  const countLabel = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  return `
    <section class="subject-landing-folder">
      <button
        type="button"
        class="documents-folder-toggle subject-landing-folder__toggle"
        data-subject-landing-folder-toggle="${escapeHtml(toggleId)}"
        aria-expanded="${expanded ? "true" : "false"}"
      >
        <span class="subject-landing-folder__heading">
          <span class="subject-landing-folder__icon" aria-hidden="true">${expanded ? "📂" : "📁"}</span>
          <span class="subject-landing-folder__title-wrap">
            <strong>${escapeHtml(title)}</strong>
            <span class="subject-landing-folder__hint">Open folder</span>
          </span>
        </span>
        <span class="subject-landing-folder__meta">
          <span>${escapeHtml(countLabel)}</span>
          <span class="subject-landing-folder__caret" aria-hidden="true">${expanded ? "▾" : "▸"}</span>
        </span>
      </button>
      ${expanded
        ? `
          <div class="subject-landing-folder__list">
            ${itemCount
              ? bodyMarkup
              : `
                <article class="subject-landing__empty subject-landing__empty--folder">
                  <strong>${escapeHtml(emptyTitle)}</strong>
                  <span>${escapeHtml(emptyBody)}</span>
                </article>
              `}
          </div>
        `
        : ""}
    </section>
  `;
}

function getSubjectLandingResourceRowMarkup(bundle, { revisionArchived = false } = {}) {
  const primaryDocument = getBundlePrimaryDocument(bundle);
  const tone = getSubjectLandingTone(bundle?.type);
  const bundleId = bundle?.id || primaryDocument?.id || "";
  const pageCount = getBundlePageCount(bundle);
  return `
    <article class="subject-landing-row subject-landing-row--resource${revisionArchived ? " subject-landing-row--revision" : ""}">
      <button
        type="button"
        class="subject-landing-row__main"
        data-subject-landing-open-document="${escapeHtml(bundleId)}"
      >
        <span class="subject-landing-row__cover subject-landing-row__cover--${escapeHtml(tone)}">
          ${primaryDocument?.previewImageUrl
            ? `<img src="${escapeHtml(primaryDocument.previewImageUrl)}" alt="${escapeHtml(bundle.title)}" />`
            : `
              <span class="subject-landing-row__sheet">
                <span class="subject-landing-row__sheet-bar"></span>
                <span class="subject-landing-row__sheet-line subject-landing-row__sheet-line--dark"></span>
                <span class="subject-landing-row__sheet-line"></span>
                <span class="subject-landing-row__sheet-line subject-landing-row__sheet-line--short"></span>
              </span>
            `}
        </span>
        <span class="subject-landing-row__copy">
          <strong>${escapeHtml(bundle.title)}</strong>
          <span>${escapeHtml(`${bundle.type || "Notes"} · ${bundle.added || "Recently added"}${pageCount ? ` · ${pageCount} pages` : ""}`)}</span>
        </span>
      </button>
      <div class="subject-landing-row__actions">
        <button
          type="button"
          class="subject-landing-row__revision-button"
          data-subject-landing-toggle-revision="${escapeHtml(bundleId)}"
        >
          ${revisionArchived ? "Remove from revision" : "Add to revision"}
        </button>
        <button
          type="button"
          class="subject-landing-row__delete-button"
          data-subject-landing-delete-document="${escapeHtml(bundleId)}"
        >
          Delete
        </button>
        <button
          type="button"
          class="subject-landing-row__open-button"
          data-subject-landing-open-document="${escapeHtml(bundleId)}"
        >
          Open →
        </button>
      </div>
    </article>
  `;
}

function getSubjectLandingOpenDocument(subject) {
  if (!subject || !state.subjectLandingOpenDocumentId) {
    return null;
  }
  return (Array.isArray(subject.documents) ? subject.documents : []).find((documentRecord) => {
    const bundleId = documentRecord.uploadGroupId || documentRecord.id;
    return documentRecord.id === state.subjectLandingOpenDocumentId || bundleId === state.subjectLandingOpenDocumentId;
  }) || null;
}

function buildSubjectLandingSectionBullets(section) {
  if (Array.isArray(section?.bullets) && section.bullets.length) {
    return section.bullets.slice(0, 3);
  }

  return buildCoreStudyBullets(
    String(section?.sectionText || ""),
    Array.isArray(section?.importantTerms) ? section.importantTerms : [],
    3
  );
}

function buildSubjectLandingBeats(section, bullets) {
  const labels = (section?.importantTerms?.length ? section.importantTerms : bullets)
    .slice(0, 3)
    .map((item) => String(item || "").replace(/[.!?]+$/, "").trim())
    .filter(Boolean);
  const icons = ["📘", "✏️", "💬"];
  return (labels.length ? labels : ["Read closely", "Keep the details", "Explain it simply"]).map((label, index) => ({
    icon: icons[index % icons.length],
    label
  }));
}

function getSubjectLandingSimplifiedPieces(documentRecord) {
  return getDocumentSections(documentRecord).map((section, index, sections) => {
    const bullets = buildSubjectLandingSectionBullets(section);
    const beats = buildSubjectLandingBeats(section, bullets);
    const hasPageRange = section?.pageStart || section?.pageEnd;
    const pageLabel = hasPageRange
      ? section.pageStart === section.pageEnd
        ? `Page ${section.pageStart}`
        : `Pages ${section.pageStart}-${section.pageEnd}`
      : `Piece ${index + 1}`;
    return {
      id: section.id || `piece-${index + 1}`,
      title: section.title || `Section ${index + 1}`,
      summary: String(
        section.summary || buildCoreStudySummary(section.sectionText || "", section.importantTerms || [])
      ).trim(),
      bullets,
      beats,
      badge: `Piece ${index + 1} of ${sections.length} · ${pageLabel}`
    };
  });
}

function buildSubjectLandingPieceListenText(documentRecord, piece) {
  return [
    documentRecord?.title || "",
    piece?.title || "",
    piece?.summary || "",
    ...(Array.isArray(piece?.bullets) ? piece.bullets : [])
  ]
    .filter(Boolean)
    .join(". ");
}

function sanitiseInlineJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function getStandaloneDocumentStylesMarkup() {
  return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join("\n");
}

function getSubjectLandingStandalonePayload(subject, documentRecord, initialView = "simple") {
  const pieces = getSubjectLandingSimplifiedPieces(documentRecord);
  const pages = getDocumentPages(documentRecord).map((page, index) => ({
    pageNumber: Number(page?.pageNumber || index + 1) || index + 1,
    imageUrl: page?.imageUrl || "",
    text: getDocumentPageText(page)
  }));

  return {
    subjectId: subject?.id || "",
    subjectName: subject?.name || "Subject",
    subjectIconMarkup: getSubjectTileCodeMarkup(subject),
    yearLabel: `Year ${state.studentGrade}`,
    documentId: documentRecord?.id || "",
    documentTitle: documentRecord?.title || "Document",
    pieces,
    pages,
    initialPieceIndex: Math.max(0, Math.min(state.subjectLandingPieceIndex, Math.max(0, pieces.length - 1))),
    initialPageIndex: Math.max(0, Math.min(getCurrentDocumentPageIndex(documentRecord), Math.max(0, pages.length - 1))),
    initialView: initialView === "original" ? "original" : "simple"
  };
}

function buildStandaloneDocumentPageHtml(payload, stylesMarkup = "") {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(payload.documentTitle)} · PaperPanda</title>
    ${stylesMarkup}
  </head>
  <body class="standalone-document-page">
    <main id="standalone-document-root"></main>
    <script>
      const payload = ${sanitiseInlineJson(payload)};
      const state = {
        view: payload.initialView || "simple",
        pieceIndex: Number(payload.initialPieceIndex || 0) || 0,
        pageIndex: Number(payload.initialPageIndex || 0) || 0
      };

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function askInApp() {
        const askPayload = {
          subjectId: payload.subjectId || "",
          documentId: payload.documentId || "",
          view: state.view,
          pieceIndex: state.pieceIndex,
          pageIndex: state.pageIndex
        };
        if (window.opener && typeof window.opener.__paperpandaOpenStandaloneAsk === "function") {
          const opened = window.opener.__paperpandaOpenStandaloneAsk(askPayload);
          if (opened) {
            window.opener.focus();
            window.close();
            return;
          }
        }
        if (typeof BroadcastChannel === "function") {
          const channel = new BroadcastChannel(${JSON.stringify(STANDALONE_ASK_CHANNEL_NAME)});
          channel.postMessage(askPayload);
          channel.close();
          window.close();
          return;
        }
        window.alert("Open this document in the main PaperPanda window to use Ask Panda.");
      }

      function renderStandalone() {
        const host = document.getElementById("standalone-document-root");
        const pieces = Array.isArray(payload.pieces) ? payload.pieces : [];
        const pages = Array.isArray(payload.pages) ? payload.pages : [];
        const pieceIndex = Math.max(0, Math.min(state.pieceIndex, Math.max(0, pieces.length - 1)));
        const pageIndex = Math.max(0, Math.min(state.pageIndex, Math.max(0, pages.length - 1)));
        const currentPiece = pieces[pieceIndex] || {
          title: "Overview",
          summary: "PaperPanda is preparing the document summary.",
          bullets: [],
          beats: [],
          badge: "Piece 1 of 1"
        };
        const currentPage = pages[pageIndex] || null;

        host.innerHTML = \`
          <section class="subject-landing subject-landing--open subject-landing--standalone">
            <div class="subject-landing__bar">
              <div class="subject-landing__bar-copy subject-landing__bar-copy--menu">
                <span class="subject-landing__subject-pill subject-landing__subject-pill--static">
                  <span class="subject-landing__subject-icon">\${payload.subjectIconMarkup || ""}</span>
                  <span>\${escapeHtml(payload.subjectName || "Subject")}</span>
                </span>
                <span class="subject-landing__year">\${escapeHtml(payload.yearLabel || "")}</span>
              </div>
              <div class="subject-landing__bar-actions">
                <button type="button" class="ghost-button subject-landing__nav-button" data-standalone-close="true">Close</button>
              </div>
            </div>
            <div class="subject-landing__document-head">
              <div class="subject-landing__document-copy">
                <div>
                  <h2>\${escapeHtml(payload.documentTitle || "Document")}</h2>
                  <p>\${escapeHtml(\`\${Math.max(1, pages.length || 1)} pages · simplified into \${Math.max(1, pieces.length || 1)} bite-size pieces\`)}</p>
                </div>
              </div>
              <div class="subject-landing__switch" role="tablist" aria-label="Document view">
                <button type="button" class="\${state.view === "simple" ? "is-active" : ""}" data-standalone-view="simple">Simplified</button>
                <button type="button" class="\${state.view === "original" ? "is-active" : ""}" data-standalone-view="original">Original doc</button>
              </div>
            </div>
            \${state.view === "simple"
              ? \`
                <div class="subject-landing__progress-dots">
                  \${pieces.map((_, index) => \`<span class="subject-landing__progress-dot\${index === pieceIndex ? " is-active" : index < pieceIndex ? " is-done" : ""}"></span>\`).join("")}
                </div>
                <div class="subject-landing__summary-layout">
                  <button type="button" class="subject-landing__arrow" data-standalone-piece-move="-1" \${pieceIndex <= 0 ? "disabled" : ""}>←</button>
                  <article class="subject-landing__summary-card">
                    <span class="subject-landing__summary-pill">\${escapeHtml(currentPiece.badge || "")}</span>
                    <h3>\${escapeHtml(currentPiece.title || "")}</h3>
                    <p>\${escapeHtml(currentPiece.summary || "")}</p>
                    <ul>
                      \${(Array.isArray(currentPiece.bullets) ? currentPiece.bullets : []).map((bullet) => \`<li>\${escapeHtml(bullet)}</li>\`).join("")}
                    </ul>
                    <section class="subject-landing__explainer">
                      <div class="subject-landing__explainer-beats">
                        \${(Array.isArray(currentPiece.beats) ? currentPiece.beats : []).map((beat) => \`
                          <article class="subject-landing__explainer-beat subject-landing__explainer-beat--visible">
                            <span class="subject-landing__explainer-icon">\${escapeHtml(beat.icon || "📘")}</span>
                            <strong>\${escapeHtml(beat.label || "")}</strong>
                          </article>
                        \`).join("")}
                      </div>
                    </section>
                  </article>
                  <button type="button" class="subject-landing__arrow" data-standalone-piece-move="1" \${pieceIndex >= pieces.length - 1 ? "disabled" : ""}>→</button>
                </div>
              \`
              : \`
                <div class="subject-landing__original-wrap">
                  <button type="button" class="subject-landing__arrow" data-standalone-page-move="-1" \${pageIndex <= 0 ? "disabled" : ""}>←</button>
                  <article class="subject-landing__summary-card subject-landing__summary-card--original subject-landing__summary-card--page">
                    <span class="subject-landing__summary-pill">\${escapeHtml(currentPage ? \`Page \${currentPage.pageNumber} of \${Math.max(1, pages.length)}\` : "Original document")}</span>
                    <div class="subject-landing__reader-stage">
                      \${currentPage?.imageUrl
                        ? \`
                          <figure class="subject-landing__page-preview subject-landing__page-preview--reader">
                            <img src="\${escapeHtml(currentPage.imageUrl)}" alt="\${escapeHtml(\`\${payload.documentTitle} page \${currentPage.pageNumber}\`)}" class="subject-landing__page-image subject-landing__page-image--reader" />
                          </figure>
                        \`
                        : \`
                          <div class="subject-landing__page-fallback">
                            <h3>\${escapeHtml(currentPage ? \`Page \${currentPage.pageNumber}\` : "Original document")}</h3>
                            <p>\${escapeHtml((currentPage && currentPage.text) || "No page preview is available for this document yet.")}</p>
                          </div>
                        \`}
                    </div>
                    \${pages.length > 1
                      ? \`
                        <div class="subject-landing__mobile-page-nav">
                          <button type="button" class="subject-landing__mobile-page-button" data-standalone-page-move="-1" \${pageIndex <= 0 ? "disabled" : ""}>Previous page</button>
                          <span class="subject-landing__mobile-page-label">\${escapeHtml(currentPage ? \`Page \${currentPage.pageNumber} of \${Math.max(1, pages.length)}\` : \`Page \${pageIndex + 1} of \${Math.max(1, pages.length)}\`)}</span>
                          <button type="button" class="subject-landing__mobile-page-button" data-standalone-page-move="1" \${!pages.length || pageIndex >= pages.length - 1 ? "disabled" : ""}>Next page</button>
                        </div>
                      \`
                      : ""}
                  </article>
                  <button type="button" class="subject-landing__arrow" data-standalone-page-move="1" \${!pages.length || pageIndex >= pages.length - 1 ? "disabled" : ""}>→</button>
                </div>
              \`}
            <div class="subject-landing__dock">
              <div class="subject-landing__dock-inner">
                <span class="subject-landing__dock-label">\${state.view === "original" ? "Original doc" : "This piece"}</span>
                <button type="button" class="subject-landing__dock-ask" data-standalone-ask="true">Ask Panda in app</button>
              </div>
            </div>
          </section>
        \`;

        host.querySelectorAll("[data-standalone-view]").forEach((button) => {
          button.addEventListener("click", () => {
            state.view = button.dataset.standaloneView || "simple";
            renderStandalone();
          });
        });
        host.querySelectorAll("[data-standalone-piece-move]").forEach((button) => {
          button.addEventListener("click", () => {
            state.pieceIndex += Number(button.dataset.standalonePieceMove || 0) || 0;
            renderStandalone();
          });
        });
        host.querySelectorAll("[data-standalone-page-move]").forEach((button) => {
          button.addEventListener("click", () => {
            state.pageIndex += Number(button.dataset.standalonePageMove || 0) || 0;
            renderStandalone();
          });
        });
        host.querySelector("[data-standalone-ask]")?.addEventListener("click", askInApp);
        host.querySelector("[data-standalone-close]")?.addEventListener("click", () => window.close());
      }

      renderStandalone();
    </script>
  </body>
</html>`;
}

function openSubjectLandingStandalonePage(subject, documentRecord, initialView = "simple") {
  if (!subject || !documentRecord) {
    return;
  }

  const popup = window.open("", "_blank");
  if (!popup) {
    return;
  }

  popup.document.open();
  popup.document.write(
    buildStandaloneDocumentPageHtml(
      getSubjectLandingStandalonePayload(subject, documentRecord, initialView),
      getStandaloneDocumentStylesMarkup()
    )
  );
  popup.document.close();
}

function openSubjectLandingDocument(subject, documentId) {
  const documentRecord = (Array.isArray(subject?.documents) ? subject.documents : []).find((candidate) => {
    const bundleId = candidate.uploadGroupId || candidate.id;
    return candidate.id === documentId || bundleId === documentId;
  });
  if (!documentRecord) {
    return;
  }
  state.subjectLandingOpenDocumentId = documentRecord.id;
  state.subjectLandingView = "simple";
  state.subjectLandingPieceIndex = Math.max(0, getResumeDocumentSectionIndex(documentRecord));
  state.subjectLandingSubjectMenuOpen = false;
  resetSubjectLandingAskState();
  state.selectedDocumentId = documentRecord.id;
  state.askDocumentId = documentRecord.id;
  render();
  if (subject && isWholeStudyDocument(documentRecord)) {
    void ensureDocumentStudyPlan(documentRecord, subject).then(() => render()).catch(() => render());
  }
}

function initStandaloneAskBridge() {
  if (standaloneAskChannel || typeof BroadcastChannel !== "function") {
    return;
  }

  standaloneAskChannel = new BroadcastChannel(STANDALONE_ASK_CHANNEL_NAME);
  standaloneAskChannel.onmessage = (event) => {
    const payload = event?.data && typeof event.data === "object" ? event.data : {};
    const opened = window.__paperpandaOpenStandaloneAsk?.(payload);
    if (opened && typeof window.focus === "function") {
      window.focus();
    }
  };
}

window.__paperpandaOpenStandaloneAsk = function __paperpandaOpenStandaloneAsk({
  subjectId = "",
  documentId = "",
  view = "simple",
  pieceIndex = 0,
  pageIndex = 0
} = {}) {
  const subject = getSubjectById(subjectId);
  if (!subject || !documentId) {
    return false;
  }

  selectSubjectForSubjectsView(subject.id);
  openSubjectLandingDocument(subject, documentId);
  state.subjectLandingView = view === "original" ? "original" : "simple";
  state.subjectLandingPieceIndex = Math.max(0, Number(pieceIndex) || 0);
  const documentRecord = getSubjectLandingOpenDocument(subject);
  if (!documentRecord) {
    render();
    return false;
  }
  setCurrentDocumentPageIndex(documentRecord, Math.max(0, Number(pageIndex) || 0));
  state.askDocumentId = documentRecord.id;
  state.subjectLandingAskOpen = true;
  state.subjectLandingAskDraft = "";
  state.subjectLandingAskStatus = state.subjectLandingAskStatus || "Ask Panda about the current document here.";
  render();
  requestAnimationFrame(() => {
    renderAskContext();
    focusAskComposer();
  });
  return true;
};

function renderSubjectLanding() {
  const host = elements.subjectLandingView;
  const workspaceMain = elements.subjectsWorkspaceMain;
  const workspaceDock = elements.subjectsWorkspaceDock;
  const subject = getSelectedSubject();
  const showLanding = shouldShowSubjectLanding(subject);

  if (workspaceMain) {
    workspaceMain.classList.toggle("hidden", showLanding);
  }
  if (workspaceDock) {
    workspaceDock.classList.toggle("hidden", showLanding);
  }
  if (!host) {
    return;
  }

  host.classList.toggle("hidden", !showLanding);
  if (!showLanding || !subject) {
    host.innerHTML = "";
    return;
  }

  const resourceBundles = getSubjectLandingResourceBundles(subject);
  const revisionResourceBundles = getSubjectLandingRevisionBundles(subject);
  const assessmentResourceBundles = resourceBundles.filter((bundle) => isSubjectLandingAssessmentBundle(bundle));
  const classNoteResourceBundles = resourceBundles.filter((bundle) => !isSubjectLandingAssessmentBundle(bundle));
  const landingResourceBundleMap = new Map([...resourceBundles, ...revisionResourceBundles].map((bundle) => [bundle.id, bundle]));
  const openDocument = getSubjectLandingOpenDocument(subject);

  if (!openDocument && subject.id === "spelling") {
    const spellingCount = getSpellingPendingActivityCount(subject);
    const grammarCount = getSubjectGrammarPendingSessionCount(subject);
    const writingCount = getSubjectWritingPendingSectionCount(subject);

    host.innerHTML = `
      <section class="subject-landing">
        <div class="subject-landing__bar">
          <div class="subject-landing__bar-copy subject-landing__bar-copy--menu">
            <button type="button" class="subject-landing__subject-pill" data-subject-landing-subject-toggle="true" aria-expanded="${state.subjectLandingSubjectMenuOpen ? "true" : "false"}">
              <span class="subject-landing__subject-icon">${getSubjectTileCodeMarkup(subject)}</span>
              <span>${escapeHtml(subject.name)}</span>
              <span class="subject-landing__subject-caret" aria-hidden="true">▾</span>
            </button>
            ${state.subjectLandingSubjectMenuOpen
              ? `
                <div class="subject-landing__subject-menu" data-subject-landing-subject-menu>
                  ${state.subjects.map((item) => `
                    <button
                      type="button"
                      class="subject-landing__subject-option${item.id === subject.id ? " is-active" : ""}"
                      data-subject-landing-subject-id="${escapeHtml(item.id)}"
                    >
                      <span class="subject-landing__subject-option-icon">${getSubjectTileCodeMarkup(item)}</span>
                      <span>${escapeHtml(item.name)}</span>
                    </button>
                  `).join("")}
                </div>
              `
              : ""}
            <span class="subject-landing__year">${escapeHtml(`Year ${state.studentGrade}`)}</span>
          </div>
          <div class="subject-landing__bar-actions">
            <button type="button" class="ghost-button subject-landing__nav-button" data-subject-landing-all-areas="true">← All areas</button>
            <button type="button" class="primary-button primary-button--dark subject-landing__nav-button" data-subject-landing-upload="true">+ Upload</button>
          </div>
        </div>
        <div class="subject-landing__content">
          <button type="button" class="ghost-button subject-landing__resource-back" data-subject-landing-all-areas="true">← All areas</button>
          <div class="subject-landing__heading">
            <p class="eyebrow">${escapeHtml(`${subject.name.toUpperCase()} · YEAR ${state.studentGrade}`)}</p>
            <h2>Choose Practice, Grammar or Writing</h2>
            <p>Pick the literacy space you want to open next.</p>
          </div>
          <div class="subject-landing__list">
            <button type="button" class="subject-landing-row" data-subject-landing-open-area="spelling">
              <span class="subject-landing-row__cover subject-landing-row__cover--yellow">
                <span class="subject-landing-row__sheet">
                  <span class="subject-landing-row__sheet-bar"></span>
                  <span class="subject-landing-row__sheet-line subject-landing-row__sheet-line--dark"></span>
                  <span class="subject-landing-row__sheet-line"></span>
                  <span class="subject-landing-row__sheet-line subject-landing-row__sheet-line--short"></span>
                </span>
              </span>
              <span class="subject-landing-row__copy">
                <strong>Spelling</strong>
                <span>${escapeHtml(`${spellingCount} stage${spellingCount === 1 ? "" : "s"} left · spelling stables and pattern practice`)}</span>
              </span>
              <span class="subject-landing-row__action">Open →</span>
            </button>
            <button type="button" class="subject-landing-row" data-subject-landing-open-area="grammar">
              <span class="subject-landing-row__cover subject-landing-row__cover--mint">
                <span class="subject-landing-row__sheet">
                  <span class="subject-landing-row__sheet-bar"></span>
                  <span class="subject-landing-row__sheet-line subject-landing-row__sheet-line--dark"></span>
                  <span class="subject-landing-row__sheet-line"></span>
                  <span class="subject-landing-row__sheet-line subject-landing-row__sheet-line--short"></span>
                </span>
              </span>
              <span class="subject-landing-row__copy">
                <strong>Grammar</strong>
                <span>${escapeHtml(grammarCount
                  ? "Next activity ready · sentence practice and review"
                  : "All current activities complete · sentence practice and review")}</span>
              </span>
              <span class="subject-landing-row__action">Open →</span>
            </button>
            <button type="button" class="subject-landing-row" data-subject-landing-open-area="writing">
              <span class="subject-landing-row__cover subject-landing-row__cover--lilac">
                <span class="subject-landing-row__sheet">
                  <span class="subject-landing-row__sheet-bar"></span>
                  <span class="subject-landing-row__sheet-line subject-landing-row__sheet-line--dark"></span>
                  <span class="subject-landing-row__sheet-line"></span>
                  <span class="subject-landing-row__sheet-line subject-landing-row__sheet-line--short"></span>
                </span>
              </span>
              <span class="subject-landing-row__copy">
                <strong>Writing</strong>
                <span>${escapeHtml(`${writingCount} section${writingCount === 1 ? "" : "s"} left · story builder and picture-book flow`)}</span>
              </span>
              <span class="subject-landing-row__action">Open →</span>
            </button>
          </div>
        </div>
      </section>
    `;
  } else if (!openDocument) {
    host.innerHTML = `
      <section class="subject-landing">
        <div class="subject-landing__bar">
          <div class="subject-landing__bar-copy subject-landing__bar-copy--menu">
            <button type="button" class="subject-landing__subject-pill" data-subject-landing-subject-toggle="true" aria-expanded="${state.subjectLandingSubjectMenuOpen ? "true" : "false"}">
              <span class="subject-landing__subject-icon">${getSubjectTileCodeMarkup(subject)}</span>
              <span>${escapeHtml(subject.name)}</span>
              <span class="subject-landing__subject-caret" aria-hidden="true">▾</span>
            </button>
            ${state.subjectLandingSubjectMenuOpen
              ? `
                <div class="subject-landing__subject-menu" data-subject-landing-subject-menu>
                  ${state.subjects.map((item) => `
                    <button
                      type="button"
                      class="subject-landing__subject-option${item.id === subject.id ? " is-active" : ""}"
                      data-subject-landing-subject-id="${escapeHtml(item.id)}"
                    >
                      <span class="subject-landing__subject-option-icon">${getSubjectTileCodeMarkup(item)}</span>
                      <span>${escapeHtml(item.name)}</span>
                    </button>
                  `).join("")}
                </div>
              `
              : ""}
            <span class="subject-landing__year">${escapeHtml(`Year ${state.studentGrade}`)}</span>
          </div>
          <div class="subject-landing__bar-actions">
            <button type="button" class="ghost-button subject-landing__nav-button" data-subject-landing-all-areas="true">← All areas</button>
            <button type="button" class="primary-button primary-button--dark subject-landing__nav-button" data-subject-landing-upload="true">+ Upload</button>
          </div>
        </div>
        <div class="subject-landing__content">
          <div class="subject-landing__heading">
            <p class="eyebrow">${escapeHtml(`${subject.name.toUpperCase()} · YEAR ${state.studentGrade}`)}</p>
            <h2>Pick something to open</h2>
            <p>Open a folder below to browse assessment resources, class notes, or revision files for this subject.</p>
          </div>
          <div class="subject-landing__list">
            ${getSubjectLandingFolderMarkup({
              title: "Assessment resources",
              itemCount: assessmentResourceBundles.length,
              expanded: state.subjectLandingAssessmentExpanded,
              toggleId: "assessment",
              bodyMarkup: assessmentResourceBundles.map((bundle) => getSubjectLandingResourceRowMarkup(bundle)).join(""),
              emptyTitle: "No assessment resources yet",
              emptyBody: "Upload an assessment notification, rubric, or marking guide and it will appear in this folder."
            })}
            ${getSubjectLandingFolderMarkup({
              title: "Class notes",
              itemCount: classNoteResourceBundles.length,
              expanded: state.subjectLandingClassNotesExpanded,
              toggleId: "class-notes",
              bodyMarkup: classNoteResourceBundles.map((bundle) => getSubjectLandingResourceRowMarkup(bundle)).join(""),
              emptyTitle: "No class notes yet",
              emptyBody: "Upload class notes, worksheets, or lesson files and they will appear in this folder."
            })}
            ${getSubjectLandingFolderMarkup({
              title: "Revision folder",
              itemCount: revisionResourceBundles.length,
              expanded: state.subjectLandingRevisionExpanded,
              toggleId: "revision",
              bodyMarkup: revisionResourceBundles.map((bundle) => getSubjectLandingResourceRowMarkup(bundle, { revisionArchived: true })).join(""),
              emptyTitle: "Nothing in revision yet",
              emptyBody: "Move older resources into revision so they stay separate from current-term files."
            })}
          </div>
        </div>
      </section>
    `;
  } else {
    const simplifiedPieces = getSubjectLandingSimplifiedPieces(openDocument);
    const pieceIndex = Math.max(0, Math.min(state.subjectLandingPieceIndex, Math.max(0, simplifiedPieces.length - 1)));
    const currentPiece = simplifiedPieces[pieceIndex] || simplifiedPieces[0] || {
      title: "Overview",
      summary: "PaperPanda is preparing the document summary.",
      bullets: [],
      beats: [],
      badge: "Piece 1 of 1"
    };
    const beatsDuration = `${Math.max(1, currentPiece.beats.length) * 1.8}s`;
    const pageList = getDocumentPages(openDocument);
    const currentPageIndex = getCurrentDocumentPageIndex(openDocument);
    const currentPage = pageList[currentPageIndex] || null;
    const currentPageText = currentPage ? getDocumentPageText(currentPage) : String(openDocument.content || "").trim();
    const totalPageCount = Array.isArray(openDocument.pages) && openDocument.pages.length
      ? openDocument.pages.length
      : Math.max(1, getBundlePageCount({ documents: [openDocument] }));
    const landingAskDocument = getAskDocument() || openDocument;
    const landingAskContext = landingAskDocument
      ? `Asking about: ${landingAskDocument.title}`
      : "No document selected for Ask yet.";
    const landingAskResponse = state.subjectLandingAskStatus || getAskIdleStatus({ kind: "landing" });

    host.innerHTML = `
      <section class="subject-landing subject-landing--open${state.subjectLandingAskOpen ? " subject-landing--ask-open" : ""}">
        <div class="subject-landing__bar">
          <div class="subject-landing__bar-copy subject-landing__bar-copy--menu">
            <button type="button" class="subject-landing__subject-pill" data-subject-landing-subject-toggle="true" aria-expanded="${state.subjectLandingSubjectMenuOpen ? "true" : "false"}">
              <span class="subject-landing__subject-icon">${getSubjectTileCodeMarkup(subject)}</span>
              <span>${escapeHtml(subject.name)}</span>
              <span class="subject-landing__subject-caret" aria-hidden="true">▾</span>
            </button>
            ${state.subjectLandingSubjectMenuOpen
              ? `
                <div class="subject-landing__subject-menu" data-subject-landing-subject-menu>
                  ${state.subjects.map((item) => `
                    <button
                      type="button"
                      class="subject-landing__subject-option${item.id === subject.id ? " is-active" : ""}"
                      data-subject-landing-subject-id="${escapeHtml(item.id)}"
                    >
                      <span class="subject-landing__subject-option-icon">${getSubjectTileCodeMarkup(item)}</span>
                      <span>${escapeHtml(item.name)}</span>
                    </button>
                  `).join("")}
                </div>
              `
              : ""}
            <span class="subject-landing__year">${escapeHtml(`Year ${state.studentGrade}`)}</span>
          </div>
          <div class="subject-landing__bar-actions">
            <button type="button" class="ghost-button subject-landing__nav-button" data-subject-landing-all-areas="true">← All areas</button>
            <button type="button" class="primary-button primary-button--dark subject-landing__nav-button" data-subject-landing-upload="true">+ Upload</button>
          </div>
        </div>
        <div class="subject-landing__document-head">
          <div class="subject-landing__document-copy">
            <button type="button" class="ghost-button subject-landing__resource-back" data-subject-landing-back="true">← Resources</button>
            <div>
              <h2>${escapeHtml(openDocument.title)}</h2>
              <p>${escapeHtml(`${totalPageCount} pages · simplified into ${Math.max(1, simplifiedPieces.length)} bite-size pieces`)}</p>
            </div>
          </div>
          <div class="subject-landing__switch" role="tablist" aria-label="Document view">
            <button type="button" class="${state.subjectLandingView === "simple" ? "is-active" : ""}" data-subject-landing-view="simple">Simplified</button>
            <button type="button" class="${state.subjectLandingView === "original" ? "is-active" : ""}" data-subject-landing-view="original">Original doc</button>
          </div>
        </div>
        ${state.subjectLandingView === "simple"
          ? `
            <div class="subject-landing__progress-dots">
              ${simplifiedPieces.map((_, index) => `<span class="subject-landing__progress-dot${index === pieceIndex ? " is-active" : index < pieceIndex ? " is-done" : ""}"></span>`).join("")}
            </div>
            <div class="subject-landing__summary-layout">
              <button type="button" class="subject-landing__arrow" data-subject-landing-piece-move="-1" ${pieceIndex <= 0 ? "disabled" : ""}>←</button>
              <article class="subject-landing__summary-card">
                <span class="subject-landing__summary-pill">${escapeHtml(currentPiece.badge)}</span>
                <h3>${escapeHtml(currentPiece.title)}</h3>
                <p>${escapeHtml(currentPiece.summary)}</p>
                <ul>
                  ${currentPiece.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
                </ul>
                <section class="subject-landing__explainer" style="--subject-landing-duration:${escapeHtml(beatsDuration)};">
                  <div class="subject-landing__explainer-track">
                    <span class="subject-landing__explainer-fill"></span>
                  </div>
                  <div class="subject-landing__explainer-beats">
                    ${currentPiece.beats.map((beat, index) => `
                      <article class="subject-landing__explainer-beat" style="--subject-landing-delay:${escapeHtml(`${index * 1.8}s`)};">
                        <span class="subject-landing__explainer-icon">${escapeHtml(beat.icon)}</span>
                        <strong>${escapeHtml(beat.label)}</strong>
                      </article>
                    `).join("")}
                  </div>
                </section>
              </article>
              <button type="button" class="subject-landing__arrow" data-subject-landing-piece-move="1" ${pieceIndex >= simplifiedPieces.length - 1 ? "disabled" : ""}>→</button>
            </div>
            <div class="subject-landing__dock">
              <div class="subject-landing__dock-inner">
                <span class="subject-landing__dock-label">This piece</span>
                <button type="button" class="subject-landing__dock-listen" data-subject-landing-listen-piece="true">▶ Listen</button>
                <button type="button" class="subject-landing__dock-ask" data-subject-landing-ask="true">Ask Panda</button>
              </div>
            </div>
            ${state.subjectLandingAskOpen
              ? `
                <aside class="subject-landing-ask-popup" data-subject-landing-ask-popup>
                  <button type="button" class="subject-landing-ask-popup__close" data-subject-landing-ask-close aria-label="Close Ask Panda">×</button>
                  <p class="subject-landing-ask-popup__eyebrow">Support</p>
                  <div class="subject-landing-ask-popup__header">
                    <img src="/paperpanda-logo.svg" alt="PaperPanda" class="subject-landing-ask-popup__avatar" />
                    <div class="subject-landing-ask-popup__copy">
                      <h3>Ask Panda</h3>
                      <p>Ask about the current subject or what you're reading.</p>
                    </div>
                  </div>
                  <button type="button" class="subject-landing-ask-popup__mic" data-subject-landing-ask-mic>
                    ${state.askMicActive ? "Stop microphone" : "Use microphone"}
                  </button>
                  <div class="subject-landing-ask-popup__wave" aria-hidden="true">
                    <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <div class="subject-landing-ask-popup__context" data-subject-landing-ask-context>${escapeHtml(landingAskContext)}</div>
                  <div class="subject-landing-ask-popup__response" data-subject-landing-ask-response>${escapeHtml(landingAskResponse)}</div>
                  <textarea
                    class="subject-landing-ask-popup__input"
                    data-subject-landing-ask-input
                    rows="5"
                    placeholder="${escapeHtml(getSubjectLandingAskPlaceholder(openDocument))}"
                  >${escapeHtml(state.subjectLandingAskDraft)}</textarea>
                  <div class="subject-landing-ask-popup__actions">
                    <button type="button" class="subject-landing-ask-popup__submit" data-subject-landing-ask-submit>Read response</button>
                    <button type="button" class="subject-landing-ask-popup__listen" data-subject-landing-ask-listen ${state.askResponseSpeaking && !state.askResponsePaused ? "disabled" : ""}>Listen to response</button>
                    <div class="subject-landing-ask-popup__transport" role="group" aria-label="Response playback controls">
                      <button type="button" class="subject-landing-ask-popup__control" data-subject-landing-ask-rewind aria-label="Rewind 10 seconds" title="Rewind 10 seconds" ${currentAudioContext === "ask" && canSeekCurrentAskPlayback() ? "" : "disabled"}>⏪</button>
                      <button type="button" class="subject-landing-ask-popup__control" data-subject-landing-ask-pause aria-label="${escapeHtml(state.askResponsePaused ? "Resume response" : "Pause response")}" title="${escapeHtml(state.askResponsePaused ? "Resume response" : "Pause response")}" ${state.askResponseSpeaking ? "" : "disabled"}>${state.askResponsePaused ? "▶" : "⏸"}</button>
                      <button type="button" class="subject-landing-ask-popup__control" data-subject-landing-ask-forward aria-label="Fast-forward 10 seconds" title="Fast-forward 10 seconds" ${currentAudioContext === "ask" && canSeekCurrentAskPlayback() ? "" : "disabled"}>⏩</button>
                      <button type="button" class="subject-landing-ask-popup__control" data-subject-landing-ask-stop aria-label="Stop response" title="Stop response" ${state.askResponseSpeaking ? "" : "disabled"}>⏹</button>
                    </div>
                  </div>
                </aside>
              `
              : ""}
          `
          : `
            <div class="subject-landing__original-wrap">
              <button type="button" class="subject-landing__arrow" data-subject-landing-page-move="-1" ${currentPageIndex <= 0 ? "disabled" : ""}>←</button>
              <article class="subject-landing__summary-card subject-landing__summary-card--original subject-landing__summary-card--page">
                <span class="subject-landing__summary-pill">${escapeHtml(currentPage ? `Page ${currentPage.pageNumber || currentPageIndex + 1} of ${Math.max(1, pageList.length)}` : "Original document")}</span>
                <div class="subject-landing__reader-stage">
                  ${currentPage?.imageUrl
                    ? `
                      <figure class="subject-landing__page-preview subject-landing__page-preview--reader">
                        <img src="${escapeHtml(currentPage.imageUrl)}" alt="${escapeHtml(`${openDocument.title} page ${currentPage.pageNumber || currentPageIndex + 1}`)}" class="subject-landing__page-image subject-landing__page-image--reader" />
                      </figure>
                    `
                    : `
                      <div class="subject-landing__page-fallback">
                        <h3>${escapeHtml(currentPage ? `Page ${currentPage.pageNumber || currentPageIndex + 1}` : "Original document")}</h3>
                        <p>${escapeHtml(currentPageText || "No page preview is available for this document yet.")}</p>
                      </div>
                    `}
                </div>
                ${pageList.length > 1
                  ? `
                    <div class="subject-landing__mobile-page-nav">
                      <button type="button" class="subject-landing__mobile-page-button" data-subject-landing-page-move="-1" ${currentPageIndex <= 0 ? "disabled" : ""}>Previous page</button>
                      <span class="subject-landing__mobile-page-label">${escapeHtml(currentPage ? `Page ${currentPage.pageNumber || currentPageIndex + 1} of ${Math.max(1, pageList.length)}` : `Page ${currentPageIndex + 1} of ${Math.max(1, pageList.length)}`)}</span>
                      <button type="button" class="subject-landing__mobile-page-button" data-subject-landing-page-move="1" ${!pageList.length || currentPageIndex >= pageList.length - 1 ? "disabled" : ""}>Next page</button>
                    </div>
                  `
                  : ""}
              </article>
              <button type="button" class="subject-landing__arrow" data-subject-landing-page-move="1" ${!pageList.length || currentPageIndex >= pageList.length - 1 ? "disabled" : ""}>→</button>
            </div>
            <div class="subject-landing__dock">
              <div class="subject-landing__dock-inner">
                <span class="subject-landing__dock-label">Original doc</span>
                <button type="button" class="subject-landing__dock-listen" data-subject-landing-listen-full="true">▶ Listen</button>
                <button type="button" class="subject-landing__dock-ask" data-subject-landing-ask="true">Ask Panda</button>
              </div>
            </div>
            ${state.subjectLandingAskOpen
              ? `
                <aside class="subject-landing-ask-popup" data-subject-landing-ask-popup>
                  <button type="button" class="subject-landing-ask-popup__close" data-subject-landing-ask-close aria-label="Close Ask Panda">×</button>
                  <p class="subject-landing-ask-popup__eyebrow">Support</p>
                  <div class="subject-landing-ask-popup__header">
                    <img src="/paperpanda-logo.svg" alt="PaperPanda" class="subject-landing-ask-popup__avatar" />
                    <div class="subject-landing-ask-popup__copy">
                      <h3>Ask Panda</h3>
                      <p>Ask about the current subject or what you're reading.</p>
                    </div>
                  </div>
                  <button type="button" class="subject-landing-ask-popup__mic" data-subject-landing-ask-mic>
                    ${state.askMicActive ? "Stop microphone" : "Use microphone"}
                  </button>
                  <div class="subject-landing-ask-popup__wave" aria-hidden="true">
                    <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <div class="subject-landing-ask-popup__context" data-subject-landing-ask-context>${escapeHtml(landingAskContext)}</div>
                  <div class="subject-landing-ask-popup__response" data-subject-landing-ask-response>${escapeHtml(landingAskResponse)}</div>
                  <textarea
                    class="subject-landing-ask-popup__input"
                    data-subject-landing-ask-input
                    rows="5"
                    placeholder="${escapeHtml(getSubjectLandingAskPlaceholder(openDocument))}"
                  >${escapeHtml(state.subjectLandingAskDraft)}</textarea>
                  <div class="subject-landing-ask-popup__actions">
                    <button type="button" class="subject-landing-ask-popup__submit" data-subject-landing-ask-submit>Read response</button>
                    <button type="button" class="subject-landing-ask-popup__listen" data-subject-landing-ask-listen ${state.askResponseSpeaking && !state.askResponsePaused ? "disabled" : ""}>Listen to response</button>
                    <div class="subject-landing-ask-popup__transport" role="group" aria-label="Response playback controls">
                      <button type="button" class="subject-landing-ask-popup__control" data-subject-landing-ask-rewind aria-label="Rewind 10 seconds" title="Rewind 10 seconds" ${currentAudioContext === "ask" && canSeekCurrentAskPlayback() ? "" : "disabled"}>⏪</button>
                      <button type="button" class="subject-landing-ask-popup__control" data-subject-landing-ask-pause aria-label="${escapeHtml(state.askResponsePaused ? "Resume response" : "Pause response")}" title="${escapeHtml(state.askResponsePaused ? "Resume response" : "Pause response")}" ${state.askResponseSpeaking ? "" : "disabled"}>${state.askResponsePaused ? "▶" : "⏸"}</button>
                      <button type="button" class="subject-landing-ask-popup__control" data-subject-landing-ask-forward aria-label="Fast-forward 10 seconds" title="Fast-forward 10 seconds" ${currentAudioContext === "ask" && canSeekCurrentAskPlayback() ? "" : "disabled"}>⏩</button>
                      <button type="button" class="subject-landing-ask-popup__control" data-subject-landing-ask-stop aria-label="Stop response" title="Stop response" ${state.askResponseSpeaking ? "" : "disabled"}>⏹</button>
                    </div>
                  </div>
                </aside>
              `
              : ""}
          `}
      </section>
    `;
  }

  host.querySelectorAll("[data-subject-landing-all-areas]").forEach((button) => {
    button.addEventListener("click", () => {
      selectSubjectForSubjectsView(subject.id, { returnToHome: true });
    });
  });
  host.querySelector("[data-subject-landing-subject-toggle]")?.addEventListener("click", () => {
    state.subjectLandingSubjectMenuOpen = !state.subjectLandingSubjectMenuOpen;
    render();
  });
  host.querySelectorAll("[data-subject-landing-subject-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextSubjectId = String(button.dataset.subjectLandingSubjectId || "");
      if (!nextSubjectId) {
        return;
      }
      selectSubjectForSubjectsView(nextSubjectId);
    });
  });
  host.querySelector("[data-subject-landing-upload]")?.addEventListener("click", openUploadModal);
  host.querySelectorAll("[data-subject-landing-open-area]").forEach((button) => {
    button.addEventListener("click", () => {
      const area = String(button.dataset.subjectLandingOpenArea || "");
      if (area === "writing") {
        openSubjectLandingArea(subject.id, "writing");
        return;
      }
      if (area === "grammar") {
        openSubjectLandingArea(subject.id, "grammar");
        return;
      }
      if (area === "spelling") {
        openSubjectLandingArea(subject.id, "spelling");
      }
    });
  });
  host.querySelectorAll("[data-subject-landing-open-document]").forEach((button) => {
    button.addEventListener("click", () => {
      const documentId = String(button.dataset.subjectLandingOpenDocument || "");
      if (documentId) {
        openSubjectLandingDocument(subject, documentId);
      }
    });
  });
  host.querySelectorAll("[data-subject-landing-toggle-revision]").forEach((button) => {
    button.addEventListener("click", () => {
      const bundleId = String(button.dataset.subjectLandingToggleRevision || "");
      const bundle = landingResourceBundleMap.get(bundleId);
      if (!bundle) {
        return;
      }
      setDocumentRevisionArchivedState(
        subject,
        bundle.documents.map((documentRecord) => documentRecord.id),
        !bundle.documents.every((documentRecord) => Boolean(documentRecord.revisionArchived))
      );
      render();
    });
  });
  host.querySelectorAll("[data-subject-landing-delete-document]").forEach((button) => {
    button.addEventListener("click", () => {
      const bundleId = String(button.dataset.subjectLandingDeleteDocument || "");
      const bundle = landingResourceBundleMap.get(bundleId);
      if (!bundle) {
        return;
      }
      const confirmed = window.confirm(`Delete "${bundle.title}"?`);
      if (!confirmed) {
        return;
      }
      deleteDocuments(bundle.documents.map((documentRecord) => documentRecord.id));
    });
  });
  host.querySelectorAll("[data-subject-landing-folder-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const folderId = String(button.dataset.subjectLandingFolderToggle || "");
      if (folderId === "assessment") {
        state.subjectLandingAssessmentExpanded = !state.subjectLandingAssessmentExpanded;
      } else if (folderId === "class-notes") {
        state.subjectLandingClassNotesExpanded = !state.subjectLandingClassNotesExpanded;
      } else if (folderId === "revision") {
        state.subjectLandingRevisionExpanded = !state.subjectLandingRevisionExpanded;
      }
      render();
    });
  });
  host.querySelector("[data-subject-landing-back]")?.addEventListener("click", () => {
    state.subjectLandingOpenDocumentId = "";
    state.subjectLandingView = "simple";
    state.subjectLandingPieceIndex = 0;
    state.subjectLandingSubjectMenuOpen = false;
    closeSubjectLandingAsk();
    render();
  });
  host.querySelectorAll("[data-subject-landing-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.subjectLandingView = String(button.dataset.subjectLandingView || "simple");
      render();
    });
  });
  host.querySelectorAll("[data-subject-landing-piece-move]").forEach((button) => {
    button.addEventListener("click", () => {
      state.subjectLandingPieceIndex += Number(button.dataset.subjectLandingPieceMove || 0) || 0;
      render();
    });
  });
  host.querySelectorAll("[data-subject-landing-page-move]").forEach((button) => {
    button.addEventListener("click", () => {
      const documentRecord = getSubjectLandingOpenDocument(subject);
      if (!documentRecord) {
        return;
      }
      setCurrentDocumentPageIndex(documentRecord, getCurrentDocumentPageIndex(documentRecord) + (Number(button.dataset.subjectLandingPageMove || 0) || 0));
      render();
    });
  });
  host.querySelector("[data-subject-landing-listen-piece]")?.addEventListener("click", () => {
    const documentRecord = getSubjectLandingOpenDocument(subject);
    if (!documentRecord) {
      return;
    }
    const pieces = getSubjectLandingSimplifiedPieces(documentRecord);
    const piece = pieces[Math.max(0, Math.min(state.subjectLandingPieceIndex, Math.max(0, pieces.length - 1)))] || null;
    if (!piece) {
      return;
    }
    void speakTextWithOpenAi(buildSubjectLandingPieceListenText(documentRecord, piece), {
      context: `subject-landing:piece:${documentRecord.id}:${piece.id}`,
      statusMessages: {
        preparing: "Preparing summary audio...",
        playing: "Reading this piece...",
        error: "Summary audio failed."
      }
    }).catch((error) => {
      console.error("Subject landing piece audio failed.", error);
    });
  });
  host.querySelector("[data-subject-landing-listen-full]")?.addEventListener("click", () => {
    const documentRecord = getSubjectLandingOpenDocument(subject);
    if (!documentRecord) {
      return;
    }
    speakDocument(documentRecord);
  });
  host.querySelectorAll("[data-subject-landing-ask]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const documentRecord = getSubjectLandingOpenDocument(subject);
      if (!documentRecord) {
        return;
      }
      const pieces = getSubjectLandingSimplifiedPieces(documentRecord);
      const piece = pieces[Math.max(0, Math.min(state.subjectLandingPieceIndex, Math.max(0, pieces.length - 1)))] || null;
      const currentPageIndex = getCurrentDocumentPageIndex(documentRecord);
      const currentPage = getDocumentPages(documentRecord)[currentPageIndex] || null;
      const pageNumber = Number(currentPage?.pageNumber || currentPageIndex + 1) || 1;
      openSubjectLandingAsk(documentRecord, {
        pageNumber,
        pieceTitle: piece?.title || ""
      });
    });
  });
  host.querySelectorAll("[data-subject-landing-ask-close]").forEach((button) => {
    button.addEventListener("click", () => {
      closeSubjectLandingAsk();
      render();
    });
  });
  host.querySelectorAll("[data-subject-landing-ask-submit]").forEach((button) => {
    button.addEventListener("click", () => {
      void handleAsk({ autoPlayResponse: true });
    });
  });
  host.querySelector("[data-subject-landing-ask-input]")?.addEventListener("input", (event) => {
    state.subjectLandingAskDraft = event.target.value;
  });
  host.querySelector("[data-subject-landing-ask-input]")?.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleAsk();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeSubjectLandingAsk();
      render();
    }
  });
  host.querySelector("[data-subject-landing-ask-mic]")?.addEventListener("click", handleAskMicToggle);
  host.querySelector("[data-subject-landing-ask-rewind]")?.addEventListener("click", handleAskRewind);
  host.querySelector("[data-subject-landing-ask-listen]")?.addEventListener("click", handleAskListen);
  host.querySelector("[data-subject-landing-ask-pause]")?.addEventListener("click", handleAskPauseToggle);
  host.querySelector("[data-subject-landing-ask-forward]")?.addEventListener("click", handleAskFastForward);
  host.querySelector("[data-subject-landing-ask-stop]")?.addEventListener("click", handleAskStop);
}

function renderSubjectTabs() {
  const subject = getWorkspaceSubjectForTab(state.activeSubjectTab, getSelectedSubject()) || getSelectedSubject();
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
    grammar: getSubjectGrammarPendingSessionCount(subject),
    writing: getSubjectWritingPendingSectionCount(subject),
    watch: getSubjectWatchItems(subject).length,
    assessments: Array.isArray(subject.assessments) ? subject.assessments.filter((assessment) => !assessment.completed).length : 0
  };

  elements.tabCountReader.textContent = String(counts.reader);
  elements.tabCountHomework.textContent = String(counts.homework);
  elements.tabCountSpelling.textContent = String(counts.spelling);
  elements.tabCountGrammar.textContent = String(counts.grammar);
  elements.tabCountWriting.textContent = String(counts.writing);
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
  elements.viewerPanelGrammar.classList.toggle("hidden", state.activeSubjectTab !== "grammar");
  elements.viewerPanelWriting.classList.toggle("hidden", state.activeSubjectTab !== "writing");
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

  const writingSubject = subject.id === "spelling" ? subject : null;

  const readerBundle = getAllDocumentBundles(subject).find((bundle) => !bundle.reviewed) || getAllDocumentBundles(subject)[0] || null;
  const homeworkBundle = getSubjectHomeworkBundles(subject)[0] || null;
  const watchItem = getSubjectWatchItems(subject)[0] || null;
  const nextEntry = getNextSubjectAssessmentEntry(subject);
  const counts = {
    reader: getAllDocumentBundles(subject).length,
    homework: getSubjectHomeworkBundles(subject).length,
    spelling: getSpellingPendingActivityCount(subject),
    writing: writingSubject ? getSubjectWritingPendingSectionCount(writingSubject) : 0,
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
          meta: "Open the Practice subject from the subject list to train this lesson.",
          action: "Aa Open spelling"
        },
    writing: writingSubject
      ? {
          title: WRITING_STUDIO_TAB_LABEL,
          meta: `${getSubjectWritingPendingSectionCount(writingSubject)} section${getSubjectWritingPendingSectionCount(writingSubject) === 1 ? "" : "s"} left · picture-book flow`,
          action: "✍ Open writing"
        }
      : {
          title: "Writing Studio lives in Practice",
          meta: "Open the Practice subject to build a story section, choose a picture, and preview the book.",
          action: "✍ Open writing"
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
    .filter((area) => {
      if (area.id === "writing" && subject.id === "spelling") {
        return true;
      }
      return getAvailableSubjectTabs(subject).includes(area.id);
    })
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
    selectSubjectForSubjectsView(event.target.value);
  });

  host.querySelectorAll("[data-focus-area]").forEach((card) => {
    const drillIn = () => {
      const nextArea = card.dataset.focusArea;
      if (!nextArea) {
        return;
      }
      openFocusLaunchpadArea(subject, nextArea);
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
        openFocusLaunchpadArea(subject, "spelling");
        return;
      }
      if (area === "grammar") {
        openFocusLaunchpadArea(subject, "grammar");
        return;
      }
      if (area === "writing") {
        openFocusLaunchpadArea(subject, "writing");
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

function shouldShowSpellingLaunchpad(subject = getSelectedSubject()) {
  return false;
}

function openSubjectLandingArea(subjectId, area) {
  if (!subjectId || !area) {
    return;
  }

  state.subjectWorkspaceReturnLandingSubjectId = subjectId;
  const currentSubject = state.subjects.find((subject) => subject.id === subjectId) || null;
  const targetSubject = resolveWorkspaceSubjectForTab(area, currentSubject);
  state.selectedSubjectId = targetSubject?.id || subjectId;
  expandSubjectWorkspace(area);
}

function openFocusLaunchpadArea(subject, area) {
  if (!subject || !area) {
    return;
  }

  const targetSubject = resolveWorkspaceSubjectForTab(area, subject);
  state.selectedSubjectId = targetSubject?.id || subject.id;
  expandSubjectWorkspace(area);
}

function shouldUseHomeFocusUi() {
  return state.currentView === "home";
}

function isExpandedPracticeWorkspaceTab(tab = "", subject = getSelectedSubject()) {
  if (state.currentView !== "subjects" || !state.subjectWorkspaceExpanded) {
    return false;
  }

  if (String(state.activeSubjectTab || "") !== String(tab || "")) {
    return false;
  }

  const workspaceSubject = getWorkspaceSubjectForTab(tab, subject) || subject;
  return Boolean(workspaceSubject && isSpellingSubjectRecord(workspaceSubject.id, workspaceSubject.name));
}

function shouldUseSpellingFocusUi(subject = getSelectedSubject()) {
  return Boolean(subject && isExpandedPracticeWorkspaceTab("spelling", subject));
}

function shouldUseGrammarFocusUi(subject = getSelectedSubject()) {
  return Boolean(subject && isExpandedPracticeWorkspaceTab("grammar", subject));
}

function shouldUseWritingFocusUi(subject = getSelectedSubject()) {
  return Boolean(subject && isExpandedPracticeWorkspaceTab("writing", subject));
}

function renderFocusHomeCard() {
  const host = elements.focusHomeNextCard;
  if (!host) {
    return;
  }

  const show = shouldUseHomeFocusUi();
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
        <button type="button" class="ghost-button" id="focus-home-next-calendar-button">Calendar</button>
      </div>
    </article>
  `;

  host.querySelector("#focus-home-next-open-button")?.addEventListener("click", () => {
    openAssessmentTaskFromEntry(nextEntry);
  });
  host.querySelector("#focus-home-next-read-button")?.addEventListener("click", () => {
    speakAssessmentEntry(nextEntry, { context: `focus:home-assessment:${nextEntry.assessment.id}` });
  });
  host.querySelector("#focus-home-next-calendar-button")?.addEventListener("click", openUpcomingModal);
}

function renderFocusAskFab() {
  const shouldShow = !state.focusAskOpen && (shouldUseHomeFocusUi() || shouldUseSpellingFocusUi());
  elements.focusAskFab?.classList.toggle("hidden", !shouldShow);
  if (elements.focusAskLabel) {
    elements.focusAskLabel.textContent = shouldUseSpellingFocusUi() ? "Hold to talk" : "Ask Panda";
  }
}

function renderFocusMode() {
  const subject = getSelectedSubject();
  const spellingLaunchpad = shouldShowSpellingLaunchpad(subject);
  const spellingFocus = shouldUseSpellingFocusUi(subject);
  const grammarFocus = shouldUseGrammarFocusUi(subject);
  const writingFocus = shouldUseWritingFocusUi(subject);
  const askOpen = spellingFocus && state.focusAskOpen;
  const drilledIn = (spellingFocus && !askOpen) || grammarFocus || writingFocus;
  const showWorkspaceBack = Boolean(
    state.currentView === "subjects" &&
    state.subjectWorkspaceExpanded &&
    (state.subjectWorkspaceReturnLandingSubjectId || spellingFocus || grammarFocus || writingFocus)
  );

  elements.subjectsView?.classList.toggle("focus-launchpad-open", spellingLaunchpad);
  elements.subjectsView?.classList.toggle("focus-drilled", drilledIn);
  elements.subjectsView?.classList.toggle("focus-reader-drilled", false);
  elements.subjectsView?.classList.toggle("focus-ask-open", askOpen);
  elements.subjectFocusLaunchpad?.classList.toggle("hidden", !spellingLaunchpad);
  elements.focusBackButton?.classList.toggle("hidden", !showWorkspaceBack);

  renderFocusHomeCard();
  renderFocusAskFab();

  if (elements.subjectFocusLaunchpad) {
    if (spellingLaunchpad) {
      renderSubjectFocusLaunchpad();
    } else {
      elements.subjectFocusLaunchpad.innerHTML = "";
    }
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
  const subject = getWorkspaceSubjectForTab(state.activeSubjectTab, getSelectedSubject()) || getSelectedSubject();
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
      : `<div class="empty-state empty-state--compact">Open the Practice subject to train this lesson.</div>`;
    return;
  }

  if (state.activeSubjectTab === "grammar") {
    const grammar = getSubjectGrammarState(subject);
    const hasCurrentActivity = Number(grammar.current?.n || 0) > grammar.done;
    elements.dockContextTitle.textContent = "Grammar";
    elements.dockContextBody.innerHTML = subject.id === "spelling"
      ? `<article class="dock-tile dock-tile--mint"><div class="dock-tile__copy"><strong>${escapeHtml(hasCurrentActivity ? "Continue grammar" : "Grammar ready")}</strong><span>${escapeHtml(hasCurrentActivity ? "Your place is saved and the current activity is ready to continue." : "Open Grammar to start the next activity in the cycle.")}</span></div></article>`
      : `<div class="empty-state empty-state--compact">Open the Practice subject to continue the grammar sessions.</div>`;
    return;
  }

  if (state.activeSubjectTab === "writing") {
    const writing = getSubjectWritingState(subject);
    elements.dockContextTitle.textContent = "Writing Studio";
    elements.dockContextBody.innerHTML = subject.id === "spelling"
      ? `<article class="dock-tile dock-tile--lilac"><div class="dock-tile__copy"><strong>${escapeHtml(`${getWritingCompletedSectionCount(writing)}/${WRITING_STUDIO_SECTION_COUNT} sections complete`)}</strong><span>${escapeHtml(writing.coachMessage || "The next story section is ready.")}</span></div></article>`
      : `<div class="empty-state empty-state--compact">Open the Practice subject to continue the story studio.</div>`;
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
  const noteBundles = selectedSubject ? getDocumentGroupsFromDocuments(getAllReaderDocuments(selectedSubject)) : [];
  elements.revisionNotesSelect.innerHTML = noteBundles
    .map((bundle) => {
      const primaryDocument = getBundlePrimaryDocument(bundle);
      const revisionLabel = isRevisionArchivedDocument(primaryDocument) ? " · Revision" : "";
      return `<option value="${bundle.id}" ${state.revisionSelectedNoteIds.includes(bundle.id) ? "selected" : ""}>${escapeHtml(`${bundle.title}${revisionLabel}`)}</option>`;
    })
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
  const allBundles = subject ? getDocumentGroupsFromDocuments(getAllReaderDocuments(subject)) : [];
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
  openAssessmentCalendar("upcoming");
}

function openAssessmentCalendar(mode = "upcoming") {
  state.upcomingModalOpen = true;
  state.upcomingModalMode = mode === "all" ? "all" : "upcoming";
  elements.upcomingModal.classList.remove("hidden");
  elements.upcomingModal.setAttribute("aria-hidden", "false");
  renderUpcomingModal();
}

function closeUpcomingModal() {
  state.upcomingModalOpen = false;
  elements.upcomingModal.classList.add("hidden");
  elements.upcomingModal.setAttribute("aria-hidden", "true");
  syncTopbarNavigationState();
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
      const request = window.indexedDB.open(previewDatabaseName, 3);
      request.onerror = () => reject(request.error || new Error("Preview storage could not be opened."));
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(previewStoreName)) {
          database.createObjectStore(previewStoreName, { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains(settingsAssetStoreName)) {
          database.createObjectStore(settingsAssetStoreName, { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains(subjectsSnapshotStoreName)) {
          database.createObjectStore(subjectsSnapshotStoreName, { keyPath: "accountKey" });
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

async function putSubjectsSnapshotRecord(accountKey, subjects) {
  const database = await openPreviewDatabase();
  if (!database || !accountKey) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(subjectsSnapshotStoreName, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Subject snapshot could not be saved."));
    transaction.objectStore(subjectsSnapshotStoreName).put({
      accountKey,
      subjects,
      updatedAt: new Date().toISOString()
    });
  });
}

async function getSubjectsSnapshotRecord(accountKey) {
  const database = await openPreviewDatabase();
  if (!database || !accountKey) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(subjectsSnapshotStoreName, "readonly");
    const request = transaction.objectStore(subjectsSnapshotStoreName).get(accountKey);
    request.onsuccess = () => resolve(Array.isArray(request.result?.subjects) ? request.result.subjects : null);
    request.onerror = () => reject(request.error || new Error("Subject snapshot could not be loaded."));
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

async function hydrateDocumentPreviewImages(documentRecord) {
  if (!documentRecord?.id) {
    return false;
  }

  let hydratedAnyPreview = false;

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
    if (documentRecord.previewImageUrl && Array.isArray(documentRecord.pages) && documentRecord.pages.length) {
      const firstPage = documentRecord.pages[0];
      if (firstPage && !firstPage.imageUrl) {
        firstPage.imageUrl = documentRecord.previewImageUrl;
        hydratedAnyPreview = true;
      }
    }
  } catch (error) {
    console.error(`Preview image failed to load for ${documentRecord.id}.`, error);
  }

  return hydratedAnyPreview;
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
    hydratedAnyPreview = (await hydrateDocumentPreviewImages(documentRecord)) || hydratedAnyPreview;
  }

  if (hydratedAnyPreview) {
    render();
  }
}

function createPersistableDocument(documentRecord) {
  return {
    ...documentRecord,
    revisionArchived: Boolean(documentRecord.revisionArchived),
    pages: Array.isArray(documentRecord.pages)
      ? documentRecord.pages.map((page) => ({
          pageNumber: Number(page?.pageNumber || 0),
          text: String(page?.text || "").trim(),
          questionBlocks: Array.isArray(page?.questionBlocks)
            ? page.questionBlocks.map(normaliseQuestionBlock).filter((block) => block.questionNumber && block.text)
            : []
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
    revisionArchived: Boolean(documentRecord.revisionArchived),
    flags: { ...(documentRecord.flags || {}) },
    pageNumber: documentRecord.pageNumber || null,
    pages: Array.isArray(documentRecord.pages)
      ? documentRecord.pages.slice(0, 10).map((page) => ({
          pageNumber: Number(page?.pageNumber || 0),
          text: String(page?.text || "").slice(0, 1200),
          questionBlocks: Array.isArray(page?.questionBlocks)
            ? page.questionBlocks
                .slice(0, 6)
                .map(normaliseQuestionBlock)
                .filter((block) => block.questionNumber && block.text)
                .map((block) => ({
                  ...block,
                  text: String(block.text || "").slice(0, 800)
                }))
            : []
        }))
      : [],
    studyOverview: String(documentRecord.studyOverview || "").slice(0, 1200),
    studyPlanStatus: documentRecord.studyPlanStatus || "idle",
    studyPlanVersion: Math.max(0, Number(documentRecord.studyPlanVersion || 0) || 0),
    studySections: Array.isArray(documentRecord.studySections)
      ? documentRecord.studySections.slice(0, 8).map((section, index) => ({
          id: String(section?.id || `section-${index + 1}`),
          title: String(section?.title || "").slice(0, 120),
          summary: String(section?.summary || "").slice(0, 400),
          sectionText: String(section?.sectionText || "").slice(0, 2000),
          pageStart: Number(section?.pageStart || 0) || null,
          pageEnd: Number(section?.pageEnd || 0) || null,
          bullets: Array.isArray(section?.bullets) ? section.bullets.slice(0, 4) : [],
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

function createPersistableGrammarState(grammar, subjectId = "", { includeCurrent = true } = {}) {
  const normalized = normaliseGrammarState(grammar, subjectId);
  return {
    ...normalized,
    current: includeCurrent ? normalized.current : null,
    pendingResult: null
  };
}

function createCompletedRemoteGrammarState(grammar, subjectId = "") {
  const normalized = normaliseGrammarState(grammar, subjectId);
  return {
    ...createDefaultGrammarState(subjectId),
    resetVersion: grammarResetVersion,
    enabled: subjectId === "spelling",
    done: normalized.done,
    results: normalized.results,
    current: null,
    pendingResult: null,
    localRevision: normalized.completedRevision,
    completedRevision: normalized.completedRevision,
    updatedAt: normalized.completedAt || normalized.updatedAt || "",
    completedAt: normalized.completedAt || normalized.updatedAt || ""
  };
}

function createPersistableSubjects(subjects, { compactDocuments = false, includeGrammarCurrent = true } = {}) {
  const documentMapper = compactDocuments ? createQuotaFallbackDocument : createPersistableDocument;
  return subjects.map((subject) => ({
    ...subject,
    documents: Array.isArray(subject.documents)
      ? subject.documents.map(documentMapper)
      : [],
    grammar: createPersistableGrammarState(subject.grammar, subject.id, { includeCurrent: includeGrammarCurrent })
  }));
}

function createQuotaFallbackSubjects(subjects) {
  return subjects.map((subject) => ({
    ...subject,
    askHistory: Array.isArray(subject.askHistory) ? subject.askHistory.slice(-5) : [],
    documents: Array.isArray(subject.documents)
      ? subject.documents.map(createQuotaFallbackDocument)
      : [],
    grammar: createPersistableGrammarState(subject.grammar, subject.id)
  }));
}

function createMinimalStoredSubjects(subjects) {
  return subjects
    .map((subject) => ({
      id: String(subject?.id || "").trim(),
      name: String(subject?.name || "").trim(),
      hiddenWatchUrls: Array.isArray(subject?.hiddenWatchUrls) ? subject.hiddenWatchUrls.filter(Boolean).slice(0, 50) : [],
      grammar: createCompletedRemoteGrammarState(subject?.grammar, subject?.id || "")
    }))
    .filter((subject) => subject.id || subject.name);
}

function createRemoteSyncSubjects(subjects) {
  return subjects.map((subject) => ({
    ...subject,
    documents: Array.isArray(subject.documents)
      ? subject.documents.map(createPersistableDocument)
      : [],
    grammar: createCompletedRemoteGrammarState(subject.grammar, subject.id)
  }));
}

function createRemoteSyncFallbackSubjects(subjects) {
  return subjects.map((subject) => ({
    ...subject,
    documents: Array.isArray(subject.documents)
      ? subject.documents.map(createQuotaFallbackDocument)
      : [],
    grammar: createCompletedRemoteGrammarState(subject.grammar, subject.id),
    askHistory: Array.isArray(subject.askHistory) ? subject.askHistory.slice(-5) : []
  }));
}

function queueIndexedDbSubjectsPersist(accountKey, subjectsSnapshot) {
  if (!accountKey || !Array.isArray(subjectsSnapshot)) {
    return 0;
  }

  const sequence = indexedDbSubjectsSaveSequence + 1;
  indexedDbSubjectsSaveSequence = sequence;
  indexedDbSubjectsSaveQueuedSnapshot = {
    sequence,
    accountKey,
    subjects: subjectsSnapshot
  };
  if (indexedDbSubjectsSaveInFlight) {
    return sequence;
  }

  indexedDbSubjectsSaveInFlight = true;
  void (async () => {
    while (indexedDbSubjectsSaveQueuedSnapshot) {
      const snapshot = indexedDbSubjectsSaveQueuedSnapshot;
      indexedDbSubjectsSaveQueuedSnapshot = null;
      try {
        await putSubjectsSnapshotRecord(snapshot.accountKey, snapshot.subjects);
        indexedDbSubjectsCommittedSequence = Math.max(indexedDbSubjectsCommittedSequence, snapshot.sequence);
        if (indexedDbSubjectsCommittedSequence >= indexedDbSubjectsFailedSequence) {
          indexedDbSubjectsLastError = null;
        }
      } catch (error) {
        indexedDbSubjectsFailedSequence = Math.max(indexedDbSubjectsFailedSequence, snapshot.sequence);
        indexedDbSubjectsLastError = error instanceof Error ? error : new Error("IndexedDB subject snapshot sync failed.");
        console.error("IndexedDB subject snapshot sync failed.", error);
      }
      updateIndexedDbSubjectsSaveWaiters();
    }

    indexedDbSubjectsSaveInFlight = false;
    updateIndexedDbSubjectsSaveWaiters();
  })();

  return sequence;
}

function updateIndexedDbSubjectsSaveWaiters() {
  const hasPendingSync = indexedDbSubjectsSaveInFlight || Boolean(indexedDbSubjectsSaveQueuedSnapshot);
  indexedDbSubjectsSaveWaiters = indexedDbSubjectsSaveWaiters.filter((waiter) => {
    if (waiter.sequence <= indexedDbSubjectsCommittedSequence) {
      waiter.resolve();
      return false;
    }

    if (!hasPendingSync && waiter.sequence <= indexedDbSubjectsFailedSequence) {
      waiter.reject(indexedDbSubjectsLastError || new Error("Subject snapshot could not be saved locally."));
      return false;
    }

    return true;
  });
}

function waitForIndexedDbSubjectsPersist(sequence = indexedDbSubjectsSaveSequence) {
  if (!sequence || sequence <= indexedDbSubjectsCommittedSequence) {
    return Promise.resolve();
  }

  const hasPendingSync = indexedDbSubjectsSaveInFlight || Boolean(indexedDbSubjectsSaveQueuedSnapshot);
  if (!hasPendingSync && sequence <= indexedDbSubjectsFailedSequence) {
    return Promise.reject(indexedDbSubjectsLastError || new Error("Subject snapshot could not be saved locally."));
  }

  return new Promise((resolve, reject) => {
    indexedDbSubjectsSaveWaiters.push({ sequence, resolve, reject });
  });
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

function saveStoredSubjectsMapForAccount(storedSubjectsMap, accountKey, subjects) {
  const nextMap = storedSubjectsMap && typeof storedSubjectsMap === "object" ? { ...storedSubjectsMap } : {};
  const fullSubjects = createPersistableSubjects(subjects);
  const fallbackSubjects = createQuotaFallbackSubjects(subjects);
  const minimalSubjects = createMinimalStoredSubjects(subjects);
  const modeOrder = ["full", "fallback", "minimal", "pruned-fallback", "pruned-minimal"];
  const preferredMode = subjectLocalStorageWriteModeByAccount[accountKey];
  const preferredModeIndex = modeOrder.indexOf(preferredMode);
  const attemptModes = preferredModeIndex > 0 ? modeOrder.slice(preferredModeIndex) : modeOrder;
  let lastError = null;

  for (const mode of attemptModes) {
    try {
      if (mode === "full") {
        nextMap[accountKey] = fullSubjects;
        saveStoredSubjectsMap(nextMap);
      } else if (mode === "fallback") {
        nextMap[accountKey] = fallbackSubjects;
        saveStoredSubjectsMap(nextMap);
      } else if (mode === "minimal") {
        nextMap[accountKey] = minimalSubjects;
        saveStoredSubjectsMap(nextMap);
      } else if (mode === "pruned-fallback") {
        saveStoredSubjectsMap({
          [accountKey]: fallbackSubjects
        });
      } else if (mode === "pruned-minimal") {
        saveStoredSubjectsMap({
          [accountKey]: minimalSubjects
        });
      }
      subjectLocalStorageWriteModeByAccount[accountKey] = mode;
      return mode;
    } catch (error) {
      lastError = error;
    }
  }

  console.error("Subject store quota fallback failed.", lastError);
  return "failed";
}

function hydrateStoredSubject(subject, index) {
  const subjectSeedEntry = resolveSubjectSeedEntry(subject, index);
  const resolvedSubjectId = String(
    findSeedSubjectByAlias(subject?.id || "")?.id ||
    findSeedSubjectByAlias(subject?.name || "")?.id ||
    subject?.id ||
    subjectSeedEntry?.id ||
    ""
  );
  return {
    ...structuredClone(subjectSeedEntry || {}),
    ...subject,
    id: resolvedSubjectId,
    name: String(subjectSeedEntry?.name || subject?.name || "").trim(),
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
    grammar: normaliseGrammarState(subject.grammar, resolvedSubjectId),
    spelling: normaliseSpellingState(subject.spelling, resolvedSubjectId, subject.name),
    writing: normaliseWritingState(subject.writing, resolvedSubjectId),
    practice: Array.isArray(subject.practice)
      ? subject.practice
      : structuredClone(subjectSeedEntry?.practice || [])
  };
}

function getLatestCollectionTimestamp(items, fieldNames = ["addedAt", "savedAt", "completedAt", "dueDate"]) {
  return (Array.isArray(items) ? items : []).reduce((latest, item) => {
    const rawValue = fieldNames.map((fieldName) => String(item?.[fieldName] || "").trim()).find(Boolean);
    if (!rawValue) {
      return latest;
    }
    const timestamp = new Date(rawValue).getTime();
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, 0);
}

function getSubjectSnapshotPriority(subject) {
  const documents = Array.isArray(subject?.documents) ? subject.documents : [];
  const assessments = Array.isArray(subject?.assessments) ? subject.assessments : [];
  const watchItems = Array.isArray(subject?.watch) ? subject.watch : [];
  const savedTests = Array.isArray(subject?.savedRevisionTests) ? subject.savedRevisionTests : [];

  return {
    documents: documents.length,
    pages: documents.reduce((total, documentRecord) => total + (Array.isArray(documentRecord?.pages) ? documentRecord.pages.length : 0), 0),
    assessments: assessments.length,
    watchItems: watchItems.length,
    savedTests: savedTests.length,
    studySections: documents.reduce((total, documentRecord) => total + (Array.isArray(documentRecord?.studySections) ? documentRecord.studySections.length : 0), 0),
    latestActivity: Math.max(
      getLatestCollectionTimestamp(documents, ["addedAt"]),
      getLatestCollectionTimestamp(assessments, ["dueDate"]),
      getLatestCollectionTimestamp(watchItems, ["addedAt"]),
      getLatestCollectionTimestamp(savedTests, ["savedAt"])
    )
  };
}

function compareSubjectSnapshotPriority(leftSubject, rightSubject) {
  const left = getSubjectSnapshotPriority(leftSubject);
  const right = getSubjectSnapshotPriority(rightSubject);
  const fields = ["documents", "pages", "assessments", "watchItems", "savedTests", "studySections", "latestActivity"];
  for (const field of fields) {
    if (left[field] !== right[field]) {
      return left[field] - right[field];
    }
  }
  return 0;
}

function mergeSubjectCollection(preferredItems, fallbackItems, getKey, choosePreferred) {
  const mergedMap = new Map();
  [...(Array.isArray(fallbackItems) ? fallbackItems : []), ...(Array.isArray(preferredItems) ? preferredItems : [])].forEach((item, index) => {
    const key = getKey(item, index);
    if (!key) {
      return;
    }
    const currentItem = mergedMap.get(key);
    mergedMap.set(key, currentItem ? choosePreferred(currentItem, item) : item);
  });
  return [...mergedMap.values()];
}

function getDocumentMergeKey(documentRecord, index) {
  const id = String(documentRecord?.id || "").trim();
  if (id) {
    return `id:${id}`;
  }
  const title = String(documentRecord?.title || "").trim().toLowerCase();
  if (title) {
    return `title:${title}`;
  }
  return `index:${index}`;
}

function choosePreferredDocumentRecord(currentRecord, candidateRecord) {
  const currentPages = Array.isArray(currentRecord?.pages) ? currentRecord.pages.length : 0;
  const candidatePages = Array.isArray(candidateRecord?.pages) ? candidateRecord.pages.length : 0;
  if (candidatePages !== currentPages) {
    return candidatePages > currentPages ? candidateRecord : currentRecord;
  }

  const currentSections = Array.isArray(currentRecord?.studySections) ? currentRecord.studySections.length : 0;
  const candidateSections = Array.isArray(candidateRecord?.studySections) ? candidateRecord.studySections.length : 0;
  if (candidateSections !== currentSections) {
    return candidateSections > currentSections ? candidateRecord : currentRecord;
  }

  const currentContentLength = String(currentRecord?.content || "").length;
  const candidateContentLength = String(candidateRecord?.content || "").length;
  if (candidateContentLength !== currentContentLength) {
    return candidateContentLength > currentContentLength ? candidateRecord : currentRecord;
  }

  const currentTimestamp = new Date(String(currentRecord?.addedAt || "")).getTime() || 0;
  const candidateTimestamp = new Date(String(candidateRecord?.addedAt || "")).getTime() || 0;
  return candidateTimestamp >= currentTimestamp ? candidateRecord : currentRecord;
}

function mergeDocumentsForSubject(preferredSubject, fallbackSubject) {
  return mergeSubjectCollection(
    preferredSubject?.documents,
    fallbackSubject?.documents,
    getDocumentMergeKey,
    choosePreferredDocumentRecord
  );
}

function mergeAssessmentsForSubject(preferredSubject, fallbackSubject) {
  return mergeSubjectCollection(
    preferredSubject?.assessments,
    fallbackSubject?.assessments,
    (assessment, index) => {
      const id = String(assessment?.id || "").trim();
      if (id) {
        return `id:${id}`;
      }
      const title = String(assessment?.title || assessment?.componentTask || "").trim().toLowerCase();
      return title ? `title:${title}` : `index:${index}`;
    },
    (currentAssessment, candidateAssessment) => {
      const currentLinks = Array.isArray(currentAssessment?.linkedDocumentIds) ? currentAssessment.linkedDocumentIds.length : 0;
      const candidateLinks = Array.isArray(candidateAssessment?.linkedDocumentIds) ? candidateAssessment.linkedDocumentIds.length : 0;
      if (candidateLinks !== currentLinks) {
        return candidateLinks > currentLinks ? candidateAssessment : currentAssessment;
      }
      return String(candidateAssessment?.workNotes || "").length >= String(currentAssessment?.workNotes || "").length
        ? candidateAssessment
        : currentAssessment;
    }
  );
}

function mergeWatchItemsForSubject(preferredSubject, fallbackSubject) {
  return mergeSubjectCollection(
    preferredSubject?.watch,
    fallbackSubject?.watch,
    (watchItem, index) => {
      const id = String(watchItem?.id || "").trim();
      if (id) {
        return `id:${id}`;
      }
      const url = normaliseWatchUrl(watchItem?.url);
      return url ? `url:${url}` : `index:${index}`;
    },
    (currentWatchItem, candidateWatchItem) =>
      String(candidateWatchItem?.title || "").length >= String(currentWatchItem?.title || "").length
        ? candidateWatchItem
        : currentWatchItem
  );
}

function mergeSavedRevisionTestsForSubject(preferredSubject, fallbackSubject) {
  return mergeSubjectCollection(
    preferredSubject?.savedRevisionTests,
    fallbackSubject?.savedRevisionTests,
    (savedTest, index) => {
      const id = String(savedTest?.id || "").trim();
      if (id) {
        return `id:${id}`;
      }
      const title = String(savedTest?.title || "").trim().toLowerCase();
      const savedAt = String(savedTest?.savedAt || "").trim();
      return title || savedAt ? `saved:${title}:${savedAt}` : `index:${index}`;
    },
    (currentSavedTest, candidateSavedTest) =>
      String(candidateSavedTest?.savedAt || "") >= String(currentSavedTest?.savedAt || "")
        ? candidateSavedTest
        : currentSavedTest
  );
}

function mergeGrammarSkills(primarySkills, secondarySkills) {
  const merged = {};
  const keys = new Set([
    ...Object.keys(primarySkills && typeof primarySkills === "object" ? primarySkills : {}),
    ...Object.keys(secondarySkills && typeof secondarySkills === "object" ? secondarySkills : {})
  ]);
  keys.forEach((skillKey) => {
    const primary = primarySkills?.[skillKey] || {};
    const secondary = secondarySkills?.[skillKey] || {};
    merged[skillKey] = {
      right: Math.max(0, Number(primary.right || 0) || 0, Number(secondary.right || 0) || 0),
      wrong: Math.max(0, Number(primary.wrong || 0) || 0, Number(secondary.wrong || 0) || 0),
      lastSession: Math.max(0, Number(primary.lastSession || 0) || 0, Number(secondary.lastSession || 0) || 0)
    };
  });
  return merged;
}

function mergeGrammarResults(primaryResults, secondaryResults) {
  const merged = new Map();
  [...(Array.isArray(primaryResults) ? primaryResults : []), ...(Array.isArray(secondaryResults) ? secondaryResults : [])].forEach((entry) => {
    const activityNumber = Math.max(1, Number(entry?.n || 0) || 1);
    const current = merged.get(activityNumber);
    if (!current) {
      merged.set(activityNumber, entry);
      return;
    }
    const currentTime = new Date(String(current?.at || "")).getTime() || 0;
    const nextTime = new Date(String(entry?.at || "")).getTime() || 0;
    if (nextTime >= currentTime) {
      merged.set(activityNumber, entry);
    }
  });
  return [...merged.values()].sort((left, right) => Number(left?.n || 0) - Number(right?.n || 0));
}

function getLatestGrammarResultTimestamp(results = []) {
  return (Array.isArray(results) ? results : []).reduce((latest, entry) => {
    const candidate = new Date(String(entry?.at || "")).getTime() || 0;
    return Math.max(latest, candidate);
  }, 0);
}

function getLatestGrammarTimestamp(...values) {
  return values.reduce((latest, value) => {
    const candidate = String(value || "");
    if (!candidate) {
      return latest;
    }
    return (new Date(candidate).getTime() || 0) >= (new Date(latest).getTime() || 0) ? candidate : latest;
  }, "");
}

function getGrammarCompletionPriority(grammar) {
  return {
    completedRevision: Math.max(0, Number(grammar?.completedRevision || 0) || 0),
    completedAt: new Date(String(grammar?.completedAt || "")).getTime() || 0,
    done: Math.max(0, Number(grammar?.done || 0) || 0),
    latestResultAt: getLatestGrammarResultTimestamp(grammar?.results),
    resultCount: Array.isArray(grammar?.results) ? grammar.results.length : 0
  };
}

function compareGrammarCompletionPriority(leftGrammar, rightGrammar) {
  const left = getGrammarCompletionPriority(leftGrammar);
  const right = getGrammarCompletionPriority(rightGrammar);
  const shouldUseRevision = left.completedRevision > 0 || right.completedRevision > 0;
  const fields = shouldUseRevision
    ? ["completedRevision", "completedAt", "done", "latestResultAt", "resultCount"]
    : ["done", "latestResultAt", "resultCount"];
  for (const field of fields) {
    if (left[field] !== right[field]) {
      return left[field] - right[field];
    }
  }
  return 0;
}

function isGrammarLocalStateCompatible(grammar, completedGrammar) {
  const grammarRevision = Math.max(0, Number(grammar?.completedRevision || 0) || 0);
  const completedRevision = Math.max(0, Number(completedGrammar?.completedRevision || 0) || 0);
  if (grammarRevision > 0 || completedRevision > 0) {
    return grammarRevision === completedRevision && Number(grammar?.done || 0) === Number(completedGrammar?.done || 0);
  }
  return Number(grammar?.done || 0) === Number(completedGrammar?.done || 0);
}

function chooseMergedGrammarCurrent(grammarCandidates, mergedDone) {
  const candidates = (Array.isArray(grammarCandidates) ? grammarCandidates : [])
    .map((grammar) => {
      const current = grammar?.current && typeof grammar.current === "object" && !Array.isArray(grammar.current)
        ? grammar.current
        : null;
      if (!current) {
        return null;
      }
      const activityNumber = Math.max(0, Number(current.n || 0) || 0);
      if (!activityNumber || activityNumber <= mergedDone) {
        return null;
      }
      const localRevision = Math.max(0, Number(grammar?.localRevision || 0) || 0);
      const updatedAt = new Date(String(current.updatedAt || grammar?.updatedAt || "")).getTime() || 0;
      return { current, activityNumber, updatedAt, localRevision };
    })
    .filter(Boolean)
    .sort((left, right) => right.localRevision - left.localRevision || right.updatedAt - left.updatedAt || right.activityNumber - left.activityNumber);

  return candidates[0]?.current || null;
}

function mergeGrammarStates(primaryGrammar, secondaryGrammar, subjectId = "") {
  const primary = normaliseGrammarState(primaryGrammar, subjectId);
  const secondary = normaliseGrammarState(secondaryGrammar, subjectId);
  const completedSource = compareGrammarCompletionPriority(primary, secondary) >= 0 ? primary : secondary;
  const compatibleLocalSources = [primary, secondary].filter((grammar) => isGrammarLocalStateCompatible(grammar, completedSource));
  const mergedCurrent = chooseMergedGrammarCurrent(compatibleLocalSources, completedSource.done);
  const mergedAudioHeard = [...new Set(
    compatibleLocalSources.flatMap((grammar) => Array.isArray(grammar?.audioHeard) ? grammar.audioHeard : [])
  )];
  const mergedSkills = compatibleLocalSources.reduce(
    (acc, grammar) => mergeGrammarSkills(acc, grammar?.skills),
    {}
  );
  const mergedPendingResult = compatibleLocalSources.reduce((max, grammar) => {
    const pending = Math.max(0, Number(grammar?.pendingResult || 0) || 0);
    return pending > max ? pending : max;
  }, 0);
  const mergedLocalRevision = compatibleLocalSources.reduce((max, grammar) => {
    return Math.max(max, Math.max(0, Number(grammar?.localRevision || 0) || 0));
  }, 0);
  const mergedUpdatedAt = getLatestGrammarTimestamp(
    ...compatibleLocalSources.map((grammar) => grammar?.updatedAt),
    mergedCurrent?.updatedAt,
    completedSource.completedAt
  );
  const mergedState = normaliseGrammarState({
    ...completedSource,
    enabled: primary.enabled || secondary.enabled,
    done: completedSource.done,
    audioHeard: mergedAudioHeard,
    skills: mergedSkills,
    results: completedSource.results,
    pendingResult: mergedPendingResult > 0 ? Math.min(completedSource.done, mergedPendingResult) : null,
    current: mergedCurrent,
    localRevision: Math.max(mergedLocalRevision, Number(completedSource.localRevision || 0) || 0),
    completedRevision: Math.max(0, Number(completedSource.completedRevision || 0) || 0),
    updatedAt: mergedUpdatedAt,
    completedAt: String(completedSource.completedAt || "")
  }, subjectId);

  logGrammarDebug("grammar-merge", {
    subjectId,
    primary: getGrammarStateSummary(primary, subjectId),
    secondary: getGrammarStateSummary(secondary, subjectId),
    merged: getGrammarStateSummary(mergedState, subjectId),
    completedSource: completedSource === primary ? "primary" : "secondary",
    compatibleLocalSources: compatibleLocalSources.map((grammar) => grammar === primary ? "primary" : "secondary")
  });

  return mergedState;
}

function hasMeaningfulGrammarProgress(grammar) {
  const normalized = normaliseGrammarState(grammar, "spelling");
  return Boolean(
    normalized.done > 0 ||
    normalized.current ||
    normalized.pendingResult ||
    normalized.results.length ||
    Object.keys(normalized.skills).length ||
    normalized.audioHeard.length
  );
}

function getGrammarStateSummary(grammar, subjectId = "spelling") {
  const normalized = normaliseGrammarState(grammar, subjectId);
  return {
    done: normalized.done,
    current: Number(normalized.current?.n || 0) || 0,
    pendingResult: Number(normalized.pendingResult || 0) || 0,
    results: normalized.results.length,
    skills: Object.keys(normalized.skills).length,
    audioHeard: normalized.audioHeard.length,
    localRevision: normalized.localRevision,
    completedRevision: normalized.completedRevision,
    updatedAt: normalized.updatedAt,
    completedAt: normalized.completedAt
  };
}

function isGrammarDebugEnabled() {
  try {
    return window.localStorage.getItem(grammarDebugStorageKey) === "1" || window.__PAPERPANDA_DEBUG_GRAMMAR__ === true;
  } catch (error) {
    return Boolean(window.__PAPERPANDA_DEBUG_GRAMMAR__);
  }
}

function logGrammarDebug(event, payload = {}) {
  if (!isGrammarDebugEnabled()) {
    return;
  }
  const entry = {
    at: new Date().toISOString(),
    event,
    payload
  };
  try {
    const history = Array.isArray(window.__PAPERPANDA_GRAMMAR_DEBUG_LOG__)
      ? window.__PAPERPANDA_GRAMMAR_DEBUG_LOG__
      : [];
    window.__PAPERPANDA_GRAMMAR_DEBUG_LOG__ = [...history.slice(-199), entry];
  } catch (error) {
    // Ignore debug history failures.
  }
  console.info("[grammar-debug]", entry);
}

function isGrammarRecoveryCandidateBetter(candidateGrammar, baselineGrammar) {
  const completionCompare = compareGrammarCompletionPriority(candidateGrammar, baselineGrammar);
  if (completionCompare !== 0) {
    return completionCompare > 0;
  }
  const candidateCurrent = Math.max(0, Number(candidateGrammar?.current?.n || 0) || 0);
  const baselineCurrent = Math.max(0, Number(baselineGrammar?.current?.n || 0) || 0);
  if (candidateCurrent !== baselineCurrent) {
    return candidateCurrent > baselineCurrent;
  }
  const candidateLocalRevision = Math.max(0, Number(candidateGrammar?.localRevision || 0) || 0);
  const baselineLocalRevision = Math.max(0, Number(baselineGrammar?.localRevision || 0) || 0);
  if (candidateLocalRevision !== baselineLocalRevision) {
    return candidateLocalRevision > baselineLocalRevision;
  }
  const candidateSkillCount = Object.keys(candidateGrammar?.skills || {}).length;
  const baselineSkillCount = Object.keys(baselineGrammar?.skills || {}).length;
  if (candidateSkillCount !== baselineSkillCount) {
    return candidateSkillCount > baselineSkillCount;
  }
  const candidateAudioCount = Array.isArray(candidateGrammar?.audioHeard) ? candidateGrammar.audioHeard.length : 0;
  const baselineAudioCount = Array.isArray(baselineGrammar?.audioHeard) ? baselineGrammar.audioHeard.length : 0;
  if (candidateAudioCount !== baselineAudioCount) {
    return candidateAudioCount > baselineAudioCount;
  }
  const candidateUpdatedAt = new Date(String(candidateGrammar?.updatedAt || "")).getTime() || 0;
  const baselineUpdatedAt = new Date(String(baselineGrammar?.updatedAt || "")).getTime() || 0;
  return candidateUpdatedAt > baselineUpdatedAt;
}

function recoverResolvedSubjectsForGrammar(subjects = []) {
  if (!Array.isArray(subjects) || !subjects.length) {
    return subjects;
  }

  const practiceSubject = subjects.find((subject) => isSpellingSubjectRecord(subject?.id, subject?.name));
  if (!practiceSubject) {
    return subjects;
  }

  const rawMigrationVersion = Math.max(0, Number(practiceSubject?.grammar?.migrationVersion || 0) || 0);
  const baseGrammar = normaliseGrammarState(practiceSubject.grammar, practiceSubject.id);
  let recoveredGrammar = baseGrammar;
  const legacyCandidates = subjects.filter((subject) =>
    subject &&
    subject !== practiceSubject &&
    hasMeaningfulGrammarProgress(subject.grammar)
  );

  if (rawMigrationVersion < grammarStateMigrationVersion) {
    legacyCandidates.forEach((legacySubject) => {
      const mergedCandidate = mergeGrammarStates(
        recoveredGrammar,
        normaliseGrammarState(legacySubject.grammar, practiceSubject.id),
        practiceSubject.id
      );
      if (isGrammarRecoveryCandidateBetter(mergedCandidate, recoveredGrammar)) {
        recoveredGrammar = mergedCandidate;
      }
    });
  }

  const finalGrammar = normaliseGrammarState({
    ...recoveredGrammar,
    migrationVersion: grammarStateMigrationVersion
  }, practiceSubject.id);

  if (
    rawMigrationVersion < grammarStateMigrationVersion ||
    isGrammarRecoveryCandidateBetter(finalGrammar, baseGrammar)
  ) {
    practiceSubject.grammar = finalGrammar;
    logGrammarDebug("grammar-recovery-applied", {
      subjectId: practiceSubject.id,
      from: getGrammarStateSummary(baseGrammar, practiceSubject.id),
      to: getGrammarStateSummary(finalGrammar, practiceSubject.id),
      mergedLegacySubjects: legacyCandidates.map((subject) => subject.id)
    });
  }

  return subjects;
}

function mergeStoredSubjectSnapshots(primarySubject, secondarySubject, index) {
  if (!primarySubject) {
    return hydrateStoredSubject(secondarySubject, index);
  }
  if (!secondarySubject) {
    return hydrateStoredSubject(primarySubject, index);
  }

  const preferredSubject = compareSubjectSnapshotPriority(primarySubject, secondarySubject) >= 0
    ? primarySubject
    : secondarySubject;
  const fallbackSubject = preferredSubject === primarySubject ? secondarySubject : primarySubject;

  return hydrateStoredSubject({
    ...fallbackSubject,
    ...preferredSubject,
    documents: mergeDocumentsForSubject(preferredSubject, fallbackSubject),
    assessments: mergeAssessmentsForSubject(preferredSubject, fallbackSubject),
    watch: mergeWatchItemsForSubject(preferredSubject, fallbackSubject),
    savedRevisionTests: mergeSavedRevisionTestsForSubject(preferredSubject, fallbackSubject),
    hiddenWatchUrls: [...new Set([...(fallbackSubject.hiddenWatchUrls || []), ...(preferredSubject.hiddenWatchUrls || [])])],
    grammar: mergeGrammarStates(preferredSubject?.grammar, fallbackSubject?.grammar, preferredSubject?.id || fallbackSubject?.id || "")
  }, index);
}

function mergeSubjectSources(primarySubjects, secondarySubjects) {
  if (!Array.isArray(primarySubjects) && !Array.isArray(secondarySubjects)) {
    return null;
  }

  const primaryMap = new Map();
  const secondaryMap = new Map();
  const orderedIds = [];

  const addSubjectsToMap = (subjects, targetMap) => {
    (Array.isArray(subjects) ? subjects : []).forEach((subject, index) => {
      const hydratedSubject = hydrateStoredSubject(subject, index);
      if (!hydratedSubject.id) {
        return;
      }
      targetMap.set(hydratedSubject.id, hydratedSubject);
      if (!orderedIds.includes(hydratedSubject.id)) {
        orderedIds.push(hydratedSubject.id);
      }
    });
  };

  addSubjectsToMap(primarySubjects, primaryMap);
  addSubjectsToMap(secondarySubjects, secondaryMap);

  return orderedIds.map((subjectId, index) =>
    mergeStoredSubjectSnapshots(primaryMap.get(subjectId), secondaryMap.get(subjectId), index)
  );
}

function mergeAvailableSubjectSources(...sources) {
  return sources.reduce((mergedSubjects, source) => {
    if (!Array.isArray(source)) {
      return mergedSubjects;
    }
    if (!Array.isArray(mergedSubjects)) {
      return source;
    }
    return mergeSubjectSources(mergedSubjects, source);
  }, null);
}

function createDefaultWritingSections() {
  return Array.from({ length: WRITING_STUDIO_SECTION_COUNT }, (_, index) => ({
    id: `section-${index + 1}`,
    number: index + 1,
    text: "",
    hint: WRITING_STUDIO_SECTION_HINTS[index] || WRITING_STUDIO_SECTION_HINTS[WRITING_STUDIO_SECTION_HINTS.length - 1],
    illustrationOptions: [],
    selectedIllustrationId: "",
    completed: false
  }));
}

function createDefaultWritingState(subjectId = "") {
  const enabled = subjectId === "spelling";
  return {
    enabled,
    view: "begin",
    storyTitle: "",
    openingAnswers: {
      who: "",
      where: "",
      want: ""
    },
    currentSectionIndex: 0,
    bookPreviewIndex: 0,
    returnToBookAfterIllustration: false,
    illustrationStyle: null,
    imageFeedback: "",
    coachMessage: enabled ? "Answer the three quick questions to begin your story." : "",
    activeSuggestion: null,
    isGeneratingIllustrations: false,
    illustrationError: "",
    sections: createDefaultWritingSections()
  };
}

function createDefaultGrammarState(subjectId = "") {
  const enabled = subjectId === "spelling";
  return {
    resetVersion: grammarResetVersion,
    migrationVersion: grammarStateMigrationVersion,
    enabled,
    done: 0,
    audioHeard: [],
    skills: {},
    results: [],
    current: null,
    pendingResult: null,
    localRevision: 0,
    completedRevision: 0,
    updatedAt: "",
    completedAt: ""
  };
}

function normaliseGrammarState(grammar, subjectId = "") {
  const base = createDefaultGrammarState(subjectId);
  const next = grammar && typeof grammar === "object" && !Array.isArray(grammar) ? grammar : {};
  const resetVersion = Math.max(0, Number(next.resetVersion || 0) || 0);
  if (resetVersion !== grammarResetVersion) {
    return base;
  }
  const skills = next.skills && typeof next.skills === "object" && !Array.isArray(next.skills) ? next.skills : {};
  const current = next.current && typeof next.current === "object" && !Array.isArray(next.current) ? next.current : null;
  const currentVersion = Math.max(0, Number(current?.version || 0) || 0);
  const pendingResult = Math.max(0, Number(next.pendingResult || 0) || 0);
  const migrationVersion = Math.max(0, Number(next.migrationVersion || 0) || 0);
  const localRevision = Math.max(0, Number(next.localRevision || 0) || 0);
  const completedRevision = Math.max(0, Number(next.completedRevision || 0) || 0);
  const normaliseResultDetails = (details) => {
    const source = details && typeof details === "object" && !Array.isArray(details) ? details : {};
    const propertyUpgrade = source.propertyUpgrade && typeof source.propertyUpgrade === "object" && !Array.isArray(source.propertyUpgrade)
      ? {
          earned: Boolean(source.propertyUpgrade.earned),
          heading: String(source.propertyUpgrade.heading || ""),
          statusNote: String(source.propertyUpgrade.statusNote || ""),
          stageIndex: Math.max(0, Number(source.propertyUpgrade.stageIndex || 0) || 0),
          stageNumber: Math.max(0, Number(source.propertyUpgrade.stageNumber || 0) || 0),
          image: String(source.propertyUpgrade.image || ""),
          title: String(source.propertyUpgrade.title || ""),
          label: String(source.propertyUpgrade.label || ""),
          description: String(source.propertyUpgrade.description || "")
        }
      : null;
    return {
      roundScores: Array.isArray(source.roundScores)
        ? source.roundScores.map((score) => Math.max(0, Number(score || 0) || 0))
        : [],
      missed: Array.isArray(source.missed)
        ? [...new Set(source.missed.map((value) => String(value || "").trim()).filter(Boolean))]
        : [],
      replayEvidence: String(source.replayEvidence || ""),
      propertyUpgrade
    };
  };
  const normalisedSkills = Object.fromEntries(
    Object.entries(skills).map(([skillKey, tally]) => [
      String(skillKey || ""),
      {
        right: Math.max(0, Number(tally?.right || 0) || 0),
        wrong: Math.max(0, Number(tally?.wrong || 0) || 0),
        lastSession: Math.max(0, Number(tally?.lastSession || 0) || 0)
      }
    ]).filter(([skillKey]) => skillKey)
  );
  const normalisedResults = Array.isArray(next.results)
    ? next.results
        .map((entry) => ({
          n: Math.max(1, Number(entry?.n || 0) || 1),
          score: Math.max(0, Number(entry?.score || 0) || 0),
          total: Math.max(0, Number(entry?.total || 0) || 0),
          at: String(entry?.at || ""),
          details: normaliseResultDetails(entry?.details)
        }))
        .filter((entry) => entry.n && entry.total >= 0)
    : [];
  const latestCompletedResult = normalisedResults.reduce((max, entry) => Math.max(max, Number(entry?.n || 0) || 0), 0);
  const normalisedDone = Math.max(0, Math.max(Number(next.done || 0) || 0, latestCompletedResult));
  const normalisedCurrent = current && currentVersion === grammarCurrentSnapshotVersion && Number.isFinite(Number(current.n))
    ? {
        version: grammarCurrentSnapshotVersion,
        n: Math.max(1, Number(current.n || 0) || 1),
        title: String(current.title || ""),
        act: String(current.act || ""),
        content: String(current.content || ""),
        view: ["intro", "activity"].includes(String(current.view || "")) ? String(current.view) : "activity",
        lessonKey: String(current.lessonKey || ""),
        updatedAt: String(current.updatedAt || ""),
        activity: current.activity && typeof current.activity === "object" ? current.activity : null,
        game: current.game && typeof current.game === "object" ? current.game : null
      }
    : null;
  const derivedCompletedAt = String(
    next.completedAt ||
    normalisedResults.reduce((latest, entry) => {
      const candidate = String(entry?.at || "");
      return (new Date(candidate).getTime() || 0) >= (new Date(latest).getTime() || 0) ? candidate : latest;
    }, "")
  );
  const derivedUpdatedAt = String(next.updatedAt || normalisedCurrent?.updatedAt || derivedCompletedAt || "");
  const derivedCompletedRevision = completedRevision > 0
    ? completedRevision
    : normalisedDone > 0 || normalisedResults.length
      ? Math.max(1, normalisedDone)
      : 0;
  const hasLocalGrammarState = Boolean(
    normalisedCurrent ||
    Object.keys(normalisedSkills).length ||
    (Array.isArray(next.audioHeard) && next.audioHeard.length) ||
    pendingResult > 0
  );
  const derivedLocalRevision = localRevision > 0
    ? localRevision
    : Math.max(derivedCompletedRevision, hasLocalGrammarState ? derivedCompletedRevision + 1 : derivedCompletedRevision);
  return {
    ...base,
    ...next,
    resetVersion: grammarResetVersion,
    migrationVersion: Math.max(grammarStateMigrationVersion, migrationVersion),
    enabled: subjectId === "spelling",
    done: normalisedDone,
    audioHeard: Array.isArray(next.audioHeard)
      ? [...new Set(next.audioHeard.map((value) => String(value || "")).filter(Boolean))]
      : [],
    skills: normalisedSkills,
    results: normalisedResults,
    pendingResult: pendingResult > 0
      ? Math.max(1, pendingResult)
      : null,
    current: normalisedCurrent && normalisedCurrent.n > normalisedDone ? normalisedCurrent : null,
    localRevision: derivedLocalRevision,
    completedRevision: derivedCompletedRevision,
    updatedAt: derivedUpdatedAt,
    completedAt: derivedCompletedAt
  };
}

function normaliseWritingState(writing, subjectId = "") {
  const base = createDefaultWritingState(subjectId);
  const next = writing && typeof writing === "object" && !Array.isArray(writing) ? writing : {};
  const openingAnswers = next.openingAnswers && typeof next.openingAnswers === "object" ? next.openingAnswers : {};
  const sections = Array.isArray(next.sections) ? next.sections : [];
  const illustrationStyle = next.illustrationStyle && typeof next.illustrationStyle === "object"
    ? {
        styleId: String(next.illustrationStyle.styleId || ""),
        label: String(next.illustrationStyle.label || ""),
        brief: String(next.illustrationStyle.brief || ""),
        prompt: String(next.illustrationStyle.prompt || ""),
        imageUrl: String(next.illustrationStyle.imageUrl || ""),
        sourceSectionId: String(next.illustrationStyle.sourceSectionId || "")
      }
    : null;
  return {
    ...base,
    ...next,
    enabled: subjectId === "spelling",
    view: ["begin", "write", "illustrate", "book"].includes(String(next.view || "")) ? String(next.view) : base.view,
    storyTitle: String(next.storyTitle || ""),
    openingAnswers: {
      who: String(openingAnswers.who || ""),
      where: String(openingAnswers.where || ""),
      want: String(openingAnswers.want || "")
    },
    currentSectionIndex: Math.max(0, Math.min(WRITING_STUDIO_SECTION_COUNT - 1, Number(next.currentSectionIndex || 0) || 0)),
    bookPreviewIndex: Math.max(0, Math.min(WRITING_STUDIO_SECTION_COUNT - 1, Number(next.bookPreviewIndex || 0) || 0)),
    returnToBookAfterIllustration: Boolean(next.returnToBookAfterIllustration),
    illustrationStyle: illustrationStyle && illustrationStyle.label && illustrationStyle.brief ? illustrationStyle : null,
    imageFeedback: String(next.imageFeedback || "").trim().slice(0, 280),
    coachMessage: String(next.coachMessage || base.coachMessage || ""),
    isGeneratingIllustrations: Boolean(next.isGeneratingIllustrations),
    illustrationError: String(next.illustrationError || ""),
    activeSuggestion: next.activeSuggestion && typeof next.activeSuggestion === "object"
      ? {
          sectionId: String(next.activeSuggestion.sectionId || ""),
          wrong: String(next.activeSuggestion.wrong || ""),
          correct: String(next.activeSuggestion.correct || ""),
          message: String(next.activeSuggestion.message || "")
        }
      : null,
    sections: createDefaultWritingSections().map((section, index) => {
      const incoming = sections[index] && typeof sections[index] === "object" ? sections[index] : {};
      const illustrationOptions = Array.isArray(incoming.illustrationOptions)
        ? incoming.illustrationOptions
            .map((option, optionIndex) => ({
              id: String(option?.id || `${section.id}-option-${optionIndex + 1}`),
              prompt: String(option?.prompt || ""),
              imageUrl: String(option?.imageUrl || ""),
              label: String(option?.label || ""),
              description: String(option?.description || ""),
              styleId: String(option?.styleId || ""),
              styleLabel: String(option?.styleLabel || ""),
              styleBrief: String(option?.styleBrief || "")
            }))
            .filter((option) => option.prompt)
        : [];
      return {
        ...section,
        ...incoming,
        id: section.id,
        number: section.number,
        text: String(incoming.text || ""),
        hint: String(incoming.hint || section.hint),
        illustrationOptions,
        selectedIllustrationId: illustrationOptions.some((option) => option.id === String(incoming.selectedIllustrationId || ""))
          ? String(incoming.selectedIllustrationId || "")
          : "",
        completed: Boolean(incoming.completed)
      };
    })
  };
}

function createDefaultSpellingState(subjectId = "", subjectName = "") {
  const enabled = isSpellingSubjectRecord(subjectId, subjectName);
  return {
    resetVersion: SPELLING_RESET_VERSION,
    enabled,
    activeUnitId: SPELLING_UNIT_SEED.id,
    coachMessage: enabled
      ? "This spelling session is ready with 4 new words and 6 review or mixed words."
      : "",
    preferences: {
      font: "lexend",
      spacing: "wide",
      tint: "cream"
    },
    focusSummary: [],
    attemptPoolOffset: 0,
    followUpWordIds: buildSpellingAttemptWordIds(),
    currentSessionKind: "standard",
    diagnostic: {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    },
    looksRight: {
      answers: {},
      currentWordId: "",
      awaitingAdvanceWordId: "",
      feedbackKind: "",
      feedbackMessage: "",
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
    repeatCheck: {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    },
    homeTab: "property",
    selectedStageId: "",
    celebrationStageId: "",
    sessionCompletionReady: false,
    currentAttemptId: createId(),
    sessionPreparedKey: "",
    completedAttempts: [],
    challenge: {
      version: SPELLING_CHALLENGE_VERSION,
      active: false,
      weekKey: "",
      currentIndex: 0,
      items: [],
      checked: false,
      completed: false,
      inputValue: "",
      lastCompletedWeekKey: ""
    },
    paddockHorses: [],
    paddockState: {},
    lastUnlockedHorseId: "",
    lastOverallScorePercent: 0
  };
}

function normaliseSpellingState(spelling, subjectId = "", subjectName = "") {
  const base = createDefaultSpellingState(subjectId, subjectName);
  const next = spelling && typeof spelling === "object" && !Array.isArray(spelling) ? spelling : {};
  const resetVersion = Math.max(0, Number(next.resetVersion || 0) || 0);
  if (resetVersion !== SPELLING_RESET_VERSION) {
    return {
      ...base,
      preferences: {
        ...base.preferences,
        ...(next.preferences && typeof next.preferences === "object" ? next.preferences : {})
      }
    };
  }
  const diagnostic = next.diagnostic && typeof next.diagnostic === "object" ? next.diagnostic : {};
  const looksRight = next.looksRight && typeof next.looksRight === "object" ? next.looksRight : {};
  const flashcards = next.flashcards && typeof next.flashcards === "object" ? next.flashcards : {};
  const tenseTransfer = next.tenseTransfer && typeof next.tenseTransfer === "object" ? next.tenseTransfer : {};
  const repeatCheck = next.repeatCheck && typeof next.repeatCheck === "object" ? next.repeatCheck : {};
  const challenge = next.challenge && typeof next.challenge === "object" ? next.challenge : {};
  const isCurrentFlashcardsVersion = Number(flashcards.version || 0) === SPELLING_FLASHCARDS_VERSION;
  const isCurrentTenseTransferVersion = Number(tenseTransfer.version || 0) === SPELLING_TENSE_TRANSFER_VERSION;
  const isCurrentChallengeVersion = Number(challenge.version || 0) === SPELLING_CHALLENGE_VERSION;
  const followUpWordIds = Array.isArray(next.followUpWordIds)
    ? next.followUpWordIds
        .map((value) => String(value || ""))
        .filter((value) => SPELLING_INTERVENTION_LIBRARY[value])
        .slice(0, SPELLING_UNIT_SEED.followUpWordCount)
    : [];

  const normalisedHomeTabRaw = String(next.homeTab || "");
  const normalisedHomeTab = normalisedHomeTabRaw === "paddock" || normalisedHomeTabRaw === "stable"
    ? "property"
    : normalisedHomeTabRaw === "review"
      ? "progress"
      : normalisedHomeTabRaw;
  const normalisedPaddockHorses = normaliseSpellingPaddockHorseIds(next.paddockHorses || []);
  const normalisedPaddockStateEntries = next.paddockState && typeof next.paddockState === "object" && !Array.isArray(next.paddockState)
    ? Object.entries(next.paddockState)
        .map(([horseId, entry], index) => {
          const normalisedHorseId = normaliseSpellingPaddockHorseId(horseId);
          if (!normalisedHorseId) {
            return null;
          }
          return [
            normalisedHorseId,
            {
              stallId: String(entry?.stallId || `s${index + 1}`),
              roaming: Boolean(entry?.roaming),
              left: Math.max(0, Number(entry?.left || 24) || 24),
              top: Math.max(0, Number(entry?.top || 24) || 24),
              scale: normaliseSpellingPaddockHorseScale(entry?.scale)
            }
          ];
        })
        .filter(Boolean)
    : [];

  return {
    ...base,
    ...next,
    resetVersion: SPELLING_RESET_VERSION,
    enabled: isSpellingSubjectRecord(subjectId, subjectName),
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
    attemptPoolOffset: 0,
    followUpWordIds: followUpWordIds.length ? followUpWordIds : buildSpellingAttemptWordIds(),
    diagnostic: {
      ...base.diagnostic,
      ...diagnostic,
      currentIndex: Math.min(
        SPELLING_UNIT_SEED.diagnosticTargetCount,
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
      currentWordId: String(looksRight.currentWordId || ""),
      awaitingAdvanceWordId: String(looksRight.awaitingAdvanceWordId || ""),
      feedbackKind: ["correct", "incorrect"].includes(String(looksRight.feedbackKind || "")) ? String(looksRight.feedbackKind) : "",
      feedbackMessage: String(looksRight.feedbackMessage || ""),
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
                exposureIndex: Math.max(0, Math.min(getSpellingFlashcardExposureLimit(wordId), Number(entry?.exposureIndex || 0) || 0)),
                isShowingSentence: Boolean(entry?.isShowingSentence),
                typedValue: String(entry?.typedValue || ""),
                checked: Boolean(entry?.checked),
                completed: Boolean(entry?.completed),
                awaitingAdvance: Boolean(entry?.awaitingAdvance),
                feedbackKind: ["correct", "incorrect"].includes(String(entry?.feedbackKind || "")) ? String(entry.feedbackKind) : "",
                feedbackMessage: String(entry?.feedbackMessage || "")
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
                selectedTense: ["past", "present", "future"].includes(String(entry?.selectedTense || "")) ? String(entry.selectedTense) : "",
                checked: Boolean(entry?.checked),
                completed: Boolean(entry?.completed),
                awaitingAdvance: Boolean(entry?.awaitingAdvance),
                feedbackKind: ["correct", "incorrect"].includes(String(entry?.feedbackKind || "")) ? String(entry.feedbackKind) : "",
                feedbackMessage: String(entry?.feedbackMessage || ""),
                lastCheckedAt: String(entry?.lastCheckedAt || "")
              }
            ])
          )
        : {},
      currentWordId: isCurrentTenseTransferVersion ? String(tenseTransfer.currentWordId || "") : "",
      completed: isCurrentTenseTransferVersion ? Boolean(tenseTransfer.completed) : false
    },
    repeatCheck: {
      ...base.repeatCheck,
      ...repeatCheck,
      currentIndex: Math.min(
        SPELLING_UNIT_SEED.diagnosticTargetCount,
        Math.max(0, Number(repeatCheck.currentIndex || 0))
      ),
      currentInput: String(repeatCheck.currentInput || ""),
      responses: repeatCheck.responses && typeof repeatCheck.responses === "object" && !Array.isArray(repeatCheck.responses)
        ? Object.fromEntries(
            Object.entries(repeatCheck.responses).map(([wordId, entry]) => [
              wordId,
              {
                attempt: String(entry?.attempt || ""),
                correct: Boolean(entry?.correct)
              }
            ])
          )
        : {},
      completed: Boolean(repeatCheck.completed)
    },
    homeTab: SPELLING_HOME_TABS.includes(normalisedHomeTab) ? normalisedHomeTab : "property",
    selectedStageId: SPELLING_STAGE_ORDER.includes(String(next.selectedStageId || "")) ? String(next.selectedStageId || "") : "",
    celebrationStageId: SPELLING_STAGE_ORDER.includes(String(next.celebrationStageId || "")) ? String(next.celebrationStageId || "") : "",
    sessionCompletionReady: Boolean(next.sessionCompletionReady),
    currentAttemptId: String(next.currentAttemptId || base.currentAttemptId || createId()),
    sessionPreparedKey: String(next.sessionPreparedKey || ""),
    currentSessionKind: ["standard", "cumulative-review"].includes(String(next.currentSessionKind || ""))
      ? String(next.currentSessionKind || "")
      : "standard",
    completedAttempts: Array.isArray(next.completedAttempts)
      ? next.completedAttempts
          .map((entry) => ({
            attemptId: String(entry?.attemptId || ""),
            instanceNumber: Math.max(1, Number(entry?.instanceNumber || 0) || 0),
            sessionKind: ["standard", "cumulative-review"].includes(String(entry?.sessionKind || ""))
              ? String(entry?.sessionKind || "")
              : "standard",
            weekKey: String(entry?.weekKey || ""),
            completedAt: String(entry?.completedAt || ""),
            stageOneCorrect: Math.max(0, Number(entry?.stageOneCorrect || 0) || 0),
            stageFiveCorrect: Math.max(0, Number(entry?.stageFiveCorrect || 0) || 0),
            overallScorePercent: Math.max(0, Math.min(100, Number(entry?.overallScorePercent || 0) || 0)),
            wordIds: Array.isArray(entry?.wordIds)
              ? entry.wordIds.map((value) => String(value || "")).filter((value) => SPELLING_INTERVENTION_LIBRARY[value]).slice(0, SPELLING_UNIT_SEED.followUpWordCount)
              : [],
            wordResults: Array.isArray(entry?.wordResults)
              ? entry.wordResults
                  .map((result) => ({
                    wordId: String(result?.wordId || ""),
                    word: String(result?.word || ""),
                    stageOneAttempt: String(result?.stageOneAttempt || ""),
                    stageOneAccuracy: Math.max(0, Math.min(100, Number(result?.stageOneAccuracy || 0) || 0)),
                    stageFiveAttempt: String(result?.stageFiveAttempt || ""),
                    stageFiveAccuracy: Math.max(0, Math.min(100, Number(result?.stageFiveAccuracy || 0) || 0))
                  }))
                  .filter((result) => result.wordId && result.word)
              : []
          }))
          .filter((entry) => entry.attemptId && entry.weekKey && entry.wordIds.length)
      : [],
    challenge: {
      ...base.challenge,
      ...(isCurrentChallengeVersion ? challenge : {}),
      version: SPELLING_CHALLENGE_VERSION,
      active: isCurrentChallengeVersion ? Boolean(challenge.active) : false,
      weekKey: isCurrentChallengeVersion ? String(challenge.weekKey || "") : "",
      currentIndex: isCurrentChallengeVersion ? Math.max(0, Number(challenge.currentIndex || 0)) : 0,
      items: isCurrentChallengeVersion && Array.isArray(challenge.items)
        ? challenge.items
            .map((item, index) => ({
              id: String(item?.id || `challenge-item-${index + 1}`),
              mode: SPELLING_CHALLENGE_MODE_ORDER.includes(String(item?.mode || "")) ? String(item.mode) : SPELLING_CHALLENGE_MODE_ORDER[index % SPELLING_CHALLENGE_MODE_ORDER.length],
              wordId: String(item?.wordId || ""),
              familyWord: String(item?.familyWord || ""),
              missingIndex: Math.max(0, Number(item?.missingIndex || 0))
            }))
            .filter((item) => SPELLING_INTERVENTION_LIBRARY[item.wordId])
        : [],
      checked: isCurrentChallengeVersion ? Boolean(challenge.checked) : false,
      completed: isCurrentChallengeVersion ? Boolean(challenge.completed) : false,
      inputValue: isCurrentChallengeVersion ? String(challenge.inputValue || "") : "",
      lastCompletedWeekKey: isCurrentChallengeVersion ? String(challenge.lastCompletedWeekKey || "") : ""
    },
    paddockHorses: normalisedPaddockHorses,
    paddockState: Object.fromEntries(normalisedPaddockStateEntries),
    lastUnlockedHorseId: normaliseSpellingPaddockHorseId(next.lastUnlockedHorseId || ""),
    lastOverallScorePercent: Math.max(0, Math.min(100, Number(next.lastOverallScorePercent || 0) || 0))
  };
}

function getSubjectSpellingState(subject) {
  if (!subject) {
    return createDefaultSpellingState("");
  }
  subject.spelling = normaliseSpellingState(subject.spelling, subject.id, subject.name);
  reconcileSpellingPaddockHorses(subject.spelling);
  return subject.spelling;
}

function hasMeaningfulWritingProgress(writing) {
  const openingAnswers = writing?.openingAnswers && typeof writing.openingAnswers === "object" ? writing.openingAnswers : {};
  const sections = Array.isArray(writing?.sections) ? writing.sections : [];
  return Boolean(
    String(writing?.storyTitle || "").trim()
    || String(openingAnswers.who || "").trim()
    || String(openingAnswers.where || "").trim()
    || String(openingAnswers.want || "").trim()
    || String(writing?.illustrationStyle?.label || "").trim()
    || sections.some((section) =>
      String(section?.text || "").trim()
      || Boolean(section?.completed)
      || String(section?.selectedIllustrationId || "").trim()
      || (Array.isArray(section?.illustrationOptions) && section.illustrationOptions.some((option) => String(option?.imageUrl || "").trim()))
    )
  );
}

function getSubjectWritingState(subject) {
  if (!subject) {
    return createDefaultWritingState("");
  }
  subject.writing = normaliseWritingState(subject.writing, subject.id);
  if (subject.id === "spelling" && !hasMeaningfulWritingProgress(subject.writing)) {
    const legacyEnglish = state.subjects.find((item) => item.id === "english");
    if (legacyEnglish?.writing) {
      const migrated = normaliseWritingState(legacyEnglish.writing, "spelling");
      if (hasMeaningfulWritingProgress(migrated)) {
        subject.writing = migrated;
      }
    }
  }
  return subject.writing;
}

function getSubjectGrammarState(subject) {
  if (!subject) {
    return createDefaultGrammarState("");
  }
  subject.grammar = normaliseGrammarState(subject.grammar, subject.id);
  if (subject.id === "spelling" && Array.isArray(state.subjects) && state.subjects.length) {
    recoverResolvedSubjectsForGrammar(state.subjects);
    subject.grammar = normaliseGrammarState(subject.grammar, subject.id);
  }
  return subject.grammar;
}

function getSubjectGrammarPendingSessionCount(subject) {
  const grammar = getSubjectGrammarState(subject);
  return grammar.enabled && GP_SESSIONS.length ? 1 : 0;
}

function getCompletedGrammarRewardSessions(doneCount = 0) {
  return Math.floor(Math.max(0, Number(doneCount || 0) || 0) / GP_ACTIVITIES_PER_SESSION);
}

function normalizeSpellingAttempt(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function calculateSpellingWordAccuracy(expectedWord, attemptWord) {
  const expected = normalizeSpellingAttempt(expectedWord);
  const attempt = normalizeSpellingAttempt(attemptWord);
  if (!expected) {
    return 0;
  }
  let correctLetters = 0;
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] === attempt[index]) {
      correctLetters += 1;
    }
  }
  return Math.round((correctLetters / expected.length) * 100);
}

function getSpellingStageCompletionMap(subject) {
  const spelling = getSubjectSpellingState(subject);
  return {
    diagnostic: Boolean(spelling.diagnostic.completed),
    "looks-right": Boolean(spelling.looksRight.completed),
    "word-families": Boolean(spelling.flashcards.completed),
    "tense-transfer": Boolean(spelling.tenseTransfer.completed),
    "repeat-check": Boolean(spelling.repeatCheck.completed)
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

function isSpellingAttemptComplete(subject) {
  return SPELLING_STAGE_ORDER.every((stageId) => getSpellingStageCompletionMap(subject)[stageId]);
}

function getSpellingMasteryRatio(subject) {
  const total = getSpellingTotalActivityCount(subject);
  return total ? getSpellingCompletedActivityCount(subject) / total : 0;
}

function getSpellingStageScoreSummary(spelling) {
  const diagnosticWords = getSpellingAttemptWords(spelling);
  const followUpWords = getSpellingFollowUpWords(spelling);
  const flashcardWords = getSpellingFlashcardWords(spelling);

  const diagnosticCorrect = diagnosticWords.filter((wordEntry) => spelling.diagnostic.responses[wordEntry.id]?.correct).length;
  const looksRightCorrect = followUpWords.filter((entry) => spelling.looksRight.answers[entry.id] === entry.word).length;
  const flashcardCorrect = flashcardWords.filter((entry) => ensureSpellingFlashcardCard(spelling, entry.id).feedbackKind === "correct").length;
  const tenseCorrect = followUpWords.filter((entry) => ensureSpellingTenseAnswer(spelling, entry.id).feedbackKind === "correct").length;
  const repeatCorrect = diagnosticWords.filter((wordEntry) => spelling.repeatCheck.responses[wordEntry.id]?.correct).length;

  return {
    diagnostic: {
      label: "Stage 1",
      correct: diagnosticCorrect,
      total: diagnosticWords.length
    },
    "looks-right": {
      label: "Stage 2",
      correct: looksRightCorrect,
      total: followUpWords.length
    },
    "word-families": {
      label: "Stage 3",
      correct: flashcardCorrect,
      total: flashcardWords.length
    },
    "tense-transfer": {
      label: "Stage 4",
      correct: tenseCorrect,
      total: followUpWords.length
    },
    "repeat-check": {
      label: "Stage 5",
      correct: repeatCorrect,
      total: diagnosticWords.length
    }
  };
}

function getSpellingStageScorePercent(spelling, stageId) {
  const summary = getSpellingStageScoreSummary(spelling)[stageId];
  if (!summary || !summary.total) {
    return 0;
  }
  return Math.round((summary.correct / summary.total) * 100);
}

function getSpellingOverallScorePercent(spelling) {
  const summaries = Object.values(getSpellingStageScoreSummary(spelling));
  const totalCorrect = summaries.reduce((sum, stage) => sum + stage.correct, 0);
  const totalItems = summaries.reduce((sum, stage) => sum + stage.total, 0);
  return totalItems ? Math.round((totalCorrect / totalItems) * 100) : 0;
}

function unlockSpellingPaddockHorse(spelling) {
  spelling.paddockHorses = normaliseSpellingPaddockHorseIds(spelling.paddockHorses || []);
  const earnedHorseCount = Array.isArray(spelling.paddockHorses) ? spelling.paddockHorses.length : 0;
  const nextHorse = SPELLING_PADDOCK_HORSES[earnedHorseCount];
  if (!nextHorse) {
    return "";
  }
  spelling.paddockHorses = [...(spelling.paddockHorses || []), nextHorse.id];
  ensureSpellingPaddockState(spelling);
  spelling.lastUnlockedHorseId = nextHorse.id;
  return nextHorse.id;
}

function getSpellingPaddockHorseMeta(horseId = "") {
  return SPELLING_PADDOCK_HORSE_BY_ID[String(horseId || "")] || null;
}

function normaliseSpellingPaddockHorseId(horseId = "") {
  const rawHorseId = String(horseId || "").trim().toLowerCase();
  if (!rawHorseId) {
    return "";
  }
  return SPELLING_PADDOCK_HORSE_ID_ALIASES[rawHorseId] || "";
}

function normaliseSpellingPaddockHorseIds(horseIds = []) {
  const seenHorseIds = new Set();
  return (Array.isArray(horseIds) ? horseIds : [])
    .map((horseId) => normaliseSpellingPaddockHorseId(horseId))
    .filter((horseId) => {
      if (!horseId || seenHorseIds.has(horseId)) {
        return false;
      }
      seenHorseIds.add(horseId);
      return true;
    })
    .slice(0, SPELLING_PADDOCK_HORSES.length);
}

function getSpellingVisibleHorseCount(spelling) {
  return getSpellingOwnedHorseMeta(spelling).length;
}

function getSpellingHorseRankLabel(horseCount = 0) {
  if (horseCount <= 0) {
    return SPELLING_HORSE_RANKS[0];
  }
  const rankIndex = Math.min(
    SPELLING_HORSE_RANKS.length - 1,
    Math.floor((Math.max(0, horseCount - 1)) / 4)
  );
  return SPELLING_HORSE_RANKS[rankIndex];
}

function normaliseSpellingPaddockHorseScale(scale = SPELLING_PADDOCK_HORSE_DEFAULT_SCALE) {
  const minScale = SPELLING_PADDOCK_HORSE_SIZE_STEPS[0];
  const maxScale = SPELLING_PADDOCK_HORSE_SIZE_STEPS[SPELLING_PADDOCK_HORSE_SIZE_STEPS.length - 1];
  const numericScale = Number(scale);
  if (!Number.isFinite(numericScale)) {
    return SPELLING_PADDOCK_HORSE_DEFAULT_SCALE;
  }
  return Math.max(minScale, Math.min(maxScale, Math.round(numericScale * 100) / 100));
}

function getSpellingPaddockHorseSizeStepIndex(scale = SPELLING_PADDOCK_HORSE_DEFAULT_SCALE) {
  const normalisedScale = normaliseSpellingPaddockHorseScale(scale);
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  SPELLING_PADDOCK_HORSE_SIZE_STEPS.forEach((step, index) => {
    const distance = Math.abs(step - normalisedScale);
    if (distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });
  return nearestIndex;
}

function getSpellingPaddockHorseDimensions(entry) {
  const scale = normaliseSpellingPaddockHorseScale(entry?.scale);
  return {
    scale,
    width: Math.round(SPELLING_PADDOCK_HORSE_BASE_WIDTH * scale),
    height: Math.round(SPELLING_PADDOCK_HORSE_BASE_HEIGHT * scale)
  };
}

function interpolateSpellingPaddockFenceRatio(xRatio = 0) {
  const points = SPELLING_PADDOCK_FRONT_FENCE_POINTS;
  if (xRatio <= points[0].x) {
    return points[0].y;
  }
  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1];
    const nextPoint = points[index];
    if (xRatio <= nextPoint.x) {
      const segmentWidth = Math.max(0.0001, nextPoint.x - previousPoint.x);
      const segmentProgress = (xRatio - previousPoint.x) / segmentWidth;
      return previousPoint.y + (nextPoint.y - previousPoint.y) * segmentProgress;
    }
  }
  return points[points.length - 1].y;
}

function getSpellingPaddockHorseFenceDepth(entry, stageWidth, stageHeight) {
  const safeStageWidth = Math.max(1, Number(stageWidth || 0) || 0);
  const safeStageHeight = Math.max(1, Number(stageHeight || 0) || 0);
  const { width, height } = getSpellingPaddockHorseDimensions(entry);
  const hoofX = Number(entry?.left || 0) + width * 0.5;
  const hoofY = Number(entry?.top || 0) + height * 0.88;
  const xRatio = Math.max(0, Math.min(1, hoofX / safeStageWidth));
  if (xRatio < SPELLING_PADDOCK_FRONT_FENCE_POINTS[0].x) {
    return "front";
  }
  const fenceY = interpolateSpellingPaddockFenceRatio(xRatio) * safeStageHeight;
  const depthPadding = Math.max(12, safeStageHeight * 0.02);
  return hoofY <= fenceY + depthPadding ? "behind-fence" : "front";
}

function getSpellingPaddockHorseZIndex(entry, stageWidth, stageHeight) {
  const depth = getSpellingPaddockHorseFenceDepth(entry, stageWidth, stageHeight);
  const topValue = Math.max(0, Math.round(Number(entry?.top || 0) || 0));
  if (depth === "behind-fence") {
    return 4 + Math.min(4, Math.round(topValue / 80));
  }
  return 10 + Math.min(8, Math.round(topValue / 48));
}

function buildDefaultSpellingPaddockEntry(index = 0) {
  return {
    stallId: `s${index + 1}`,
    roaming: false,
    left: 28 + (index % 4) * 34,
    top: 140 + Math.floor(index / 4) * 18,
    scale: SPELLING_PADDOCK_HORSE_DEFAULT_SCALE
  };
}

function ensureSpellingPaddockState(spelling) {
  spelling.paddockHorses = normaliseSpellingPaddockHorseIds(spelling.paddockHorses || []);
  if (!spelling.paddockState || typeof spelling.paddockState !== "object" || Array.isArray(spelling.paddockState)) {
    spelling.paddockState = {};
  }
  const nextPaddockState = {};
  (spelling.paddockHorses || []).forEach((horseId, index) => {
    const normalizedHorseId = String(horseId || "");
    if (!normalizedHorseId) {
      return;
    }
    const existingEntry = spelling.paddockState[normalizedHorseId];
    nextPaddockState[normalizedHorseId] = {
      ...buildDefaultSpellingPaddockEntry(index),
      ...(existingEntry && typeof existingEntry === "object" ? existingEntry : {}),
      stallId: String(existingEntry?.stallId || `s${index + 1}`)
    };
  });
  spelling.paddockState = nextPaddockState;
  return spelling.paddockState;
}

function reconcileSpellingPaddockHorses(spelling) {
  const completedAttemptCount = Math.min(
    SPELLING_PADDOCK_HORSES.length,
    Array.isArray(spelling?.completedAttempts) ? spelling.completedAttempts.length : 0
  );
  const earnedHorseIds = SPELLING_PADDOCK_HORSES.slice(0, completedAttemptCount).map((horse) => horse.id);
  const ownedHorseIds = normaliseSpellingPaddockHorseIds(spelling?.paddockHorses || []);
  spelling.paddockHorses = ownedHorseIds.length < earnedHorseIds.length ? earnedHorseIds : ownedHorseIds;
  ensureSpellingPaddockState(spelling);
  if (!getSpellingPaddockHorseMeta(spelling.lastUnlockedHorseId || "") && spelling.paddockHorses.length) {
    spelling.lastUnlockedHorseId = spelling.paddockHorses[spelling.paddockHorses.length - 1];
  }
  return spelling.paddockHorses;
}

function clampSpellingPaddockEntry(entry, stageWidth, stageHeight, horseWidth = 0, horseHeight = 0) {
  const dimensions = getSpellingPaddockHorseDimensions(entry);
  const safeHorseWidth = Math.max(64, horseWidth || dimensions.width);
  const safeHorseHeight = Math.max(80, horseHeight || dimensions.height);
  const safeStageWidth = Math.max(safeHorseWidth + 24, Number(stageWidth || 0) || 0);
  const safeStageHeight = Math.max(safeHorseHeight + 96, Number(stageHeight || 0) || 0);
  return {
    ...entry,
    scale: dimensions.scale,
    left: Math.max(8, Math.min(Math.round(Number(entry?.left || 0) || 0), safeStageWidth - safeHorseWidth - 8)),
    top: Math.max(76, Math.min(Math.round(Number(entry?.top || 0) || 0), safeStageHeight - safeHorseHeight - 8))
  };
}

function getSpellingOwnedHorseMeta(spelling) {
  ensureSpellingPaddockState(spelling);
  return (spelling.paddockHorses || [])
    .map((horseId, index) => {
      const meta = getSpellingPaddockHorseMeta(horseId);
      if (!meta) {
        return null;
      }
      const stateEntry = spelling.paddockState[horseId] || buildDefaultSpellingPaddockEntry(index);
      return {
        ...meta,
        number: index + 1,
        rank: getSpellingHorseRankLabel(index + 1),
        state: stateEntry
      };
    })
    .filter(Boolean);
}

function getSpellingStageId(subject) {
  const completionMap = getSpellingStageCompletionMap(subject);
  if (!completionMap.diagnostic) {
    return "diagnostic";
  }
  const firstMiddleIncomplete = SPELLING_MIDDLE_STAGE_IDS.find((stageId) => !completionMap[stageId]);
  if (firstMiddleIncomplete) {
    return firstMiddleIncomplete;
  }
  if (!completionMap["repeat-check"]) {
    return "repeat-check";
  }
  return "repeat-check";
}

function getSpellingNextStageAfterCelebration(subject, celebrationStageId = "") {
  const normalizedStageId = String(celebrationStageId || "");
  const completionMap = getSpellingStageCompletionMap(subject);
  if (normalizedStageId === "diagnostic") {
    return SPELLING_MIDDLE_STAGE_IDS.find((stageId) => !completionMap[stageId]) || SPELLING_MIDDLE_STAGE_IDS[0] || "repeat-check";
  }
  if (SPELLING_MIDDLE_STAGE_IDS.includes(normalizedStageId)) {
    return SPELLING_MIDDLE_STAGE_IDS.find((stageId) => !completionMap[stageId]) || "repeat-check";
  }
  return "repeat-check";
}

function getSpellingStageActionLabel(stageId) {
  return SPELLING_STAGE_LABELS[String(stageId || "")] || "next stage";
}

function canOpenSpellingStage(subject, stageId) {
  const normalizedStageId = String(stageId || "");
  if (!SPELLING_STAGE_ORDER.includes(normalizedStageId)) {
    return false;
  }
  const completionMap = getSpellingStageCompletionMap(subject);
  if (normalizedStageId === "diagnostic") {
    return true;
  }
  if (SPELLING_MIDDLE_STAGE_IDS.includes(normalizedStageId)) {
    return completionMap.diagnostic;
  }
  if (normalizedStageId === "repeat-check") {
    return completionMap.diagnostic && SPELLING_MIDDLE_STAGE_IDS.every((candidateStageId) => completionMap[candidateStageId]);
  }
  return false;
}

function getSpellingDiagnosticWordCount(spelling) {
  return getSpellingAttemptWords(spelling).length || SPELLING_UNIT_SEED.diagnosticTargetCount;
}

function shuffleSpellingWordIds(wordIds = []) {
  const shuffled = [...wordIds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function getSpellingSessionAttemptNumber(completedAttempts = []) {
  return Math.max(1, (Array.isArray(completedAttempts) ? completedAttempts.length : 0) + 1);
}

function getSpellingSessionKind(attemptNumber = 1) {
  return attemptNumber > 0 && attemptNumber % SPELLING_CUMULATIVE_REVIEW_FREQUENCY === 0
    ? "cumulative-review"
    : "standard";
}

function getSpellingWordFocuses(wordId = "") {
  const interventionEntry = SPELLING_INTERVENTION_LIBRARY[String(wordId || "")];
  const diagnosticEntry = SPELLING_DIAGNOSTIC_WORDS.find((entry) => entry.interventionId === wordId);
  const focusIds = Array.isArray(interventionEntry?.focuses) && interventionEntry.focuses.length
    ? interventionEntry.focuses
    : Array.isArray(diagnosticEntry?.focuses)
      ? diagnosticEntry.focuses
      : [];
  return focusIds.map((focusId) => String(focusId || "")).filter(Boolean);
}

function getSpellingWordPrimaryFocus(wordId = "") {
  return getSpellingWordFocuses(wordId)[0] || "mixed";
}

function buildSpellingReviewLedger(completedAttempts = []) {
  const ledger = Object.fromEntries(
    SPELLING_DEFAULT_FOLLOW_UP_WORD_IDS.map((wordId) => [
      wordId,
      {
        wordId,
        introducedAttemptNumber: 0,
        lastSeenAttemptNumber: 0,
        nextDueAttemptNumber: 1,
        timesScheduled: 0,
        timesIncorrect: 0,
        consecutiveSuccessfulSessions: 0,
        masteryStep: 0,
        lastStageOneAccuracy: 0,
        lastStageFiveAccuracy: 0,
        recentAttemptNumbers: []
      }
    ])
  );

  (Array.isArray(completedAttempts) ? completedAttempts : [])
    .slice()
    .sort((left, right) => (left.instanceNumber || 0) - (right.instanceNumber || 0))
    .forEach((attempt, attemptIndex) => {
      const attemptNumber = Math.max(1, Number(attempt?.instanceNumber || attemptIndex + 1) || attemptIndex + 1);
      const wordResultsById = new Map(
        (Array.isArray(attempt?.wordResults) ? attempt.wordResults : [])
          .map((result) => [String(result?.wordId || ""), result])
          .filter(([wordId]) => Boolean(wordId))
      );

      (Array.isArray(attempt?.wordIds) ? attempt.wordIds : []).forEach((wordId) => {
        const normalizedWordId = String(wordId || "");
        const entry = ledger[normalizedWordId];
        if (!entry) {
          return;
        }
        const result = wordResultsById.get(normalizedWordId);
        const stageFiveAccuracy = Math.max(0, Math.min(100, Number(result?.stageFiveAccuracy || 0) || 0));
        const stageOneAccuracy = Math.max(0, Math.min(100, Number(result?.stageOneAccuracy || 0) || 0));
        if (!entry.introducedAttemptNumber) {
          entry.introducedAttemptNumber = attemptNumber;
        }
        entry.timesScheduled += 1;
        entry.lastSeenAttemptNumber = attemptNumber;
        entry.lastStageOneAccuracy = stageOneAccuracy;
        entry.lastStageFiveAccuracy = stageFiveAccuracy;
        entry.recentAttemptNumbers = [...entry.recentAttemptNumbers, attemptNumber].slice(-4);
        if (stageFiveAccuracy >= 100) {
          entry.consecutiveSuccessfulSessions += 1;
          entry.masteryStep = Math.min(
            SPELLING_SESSION_REVIEW_INTERVALS.length - 1,
            Math.max(0, entry.consecutiveSuccessfulSessions - 1)
          );
          entry.nextDueAttemptNumber = attemptNumber + SPELLING_SESSION_REVIEW_INTERVALS[entry.masteryStep];
        } else {
          entry.consecutiveSuccessfulSessions = 0;
          entry.masteryStep = 0;
          entry.timesIncorrect += 1;
          entry.nextDueAttemptNumber = attemptNumber + SPELLING_SESSION_REVIEW_INTERVALS[0];
        }
      });
    });

  return ledger;
}

function buildSpellingPreferredFocuses(wordIds = []) {
  const focusCounts = new Map();
  (Array.isArray(wordIds) ? wordIds : []).forEach((wordId) => {
    getSpellingWordFocuses(wordId).forEach((focusId) => {
      focusCounts.set(focusId, (focusCounts.get(focusId) || 0) + 1);
    });
  });
  return [...focusCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([focusId]) => focusId);
}

function orderSpellingWordIdsByGrouping(wordIds = [], preferredFocuses = [], currentWordIds = []) {
  const currentSet = new Set(
    (Array.isArray(currentWordIds) ? currentWordIds : [])
      .map((wordId) => String(wordId || ""))
      .filter(Boolean)
  );
  const buckets = new Map();
  (Array.isArray(wordIds) ? wordIds : []).forEach((wordId) => {
    const normalizedWordId = String(wordId || "");
    if (!normalizedWordId || !SPELLING_INTERVENTION_LIBRARY[normalizedWordId]) {
      return;
    }
    const focusId = getSpellingWordPrimaryFocus(normalizedWordId);
    if (!buckets.has(focusId)) {
      buckets.set(focusId, []);
    }
    buckets.get(focusId).push(normalizedWordId);
  });
  const focusOrder = [
    ...preferredFocuses,
    ...[...buckets.keys()].filter((focusId) => !preferredFocuses.includes(focusId)).sort((left, right) => {
      const leftCount = (buckets.get(left) || []).length;
      const rightCount = (buckets.get(right) || []).length;
      return rightCount - leftCount || left.localeCompare(right);
    })
  ];
  const ordered = [];
  focusOrder.forEach((focusId) => {
    const bucket = (buckets.get(focusId) || []).slice().sort((left, right) => {
      const leftPenalty = currentSet.has(left) ? 1 : 0;
      const rightPenalty = currentSet.has(right) ? 1 : 0;
      if (leftPenalty !== rightPenalty) {
        return leftPenalty - rightPenalty;
      }
      return left.localeCompare(right);
    });
    while (bucket.length) {
      ordered.push(...bucket.splice(0, 2));
    }
  });
  return ordered;
}

function pickSpellingWordIdsByPriority(candidateWordIds = [], targetCount = 0) {
  return [...new Set((Array.isArray(candidateWordIds) ? candidateWordIds : []).filter(Boolean))].slice(0, Math.max(0, targetCount));
}

function compareSpellingDueReviewPriority(leftWordId, rightWordId, ledger, upcomingAttemptNumber, currentWordIds = []) {
  const currentSet = new Set((Array.isArray(currentWordIds) ? currentWordIds : []).map((wordId) => String(wordId || "")));
  const leftEntry = ledger[leftWordId];
  const rightEntry = ledger[rightWordId];
  const leftOverdue = Math.max(0, upcomingAttemptNumber - Math.max(1, Number(leftEntry?.nextDueAttemptNumber || upcomingAttemptNumber)));
  const rightOverdue = Math.max(0, upcomingAttemptNumber - Math.max(1, Number(rightEntry?.nextDueAttemptNumber || upcomingAttemptNumber)));
  if (leftOverdue !== rightOverdue) {
    return rightOverdue - leftOverdue;
  }
  const leftAccuracy = Math.max(0, Math.min(100, Number(leftEntry?.lastStageFiveAccuracy || 0) || 0));
  const rightAccuracy = Math.max(0, Math.min(100, Number(rightEntry?.lastStageFiveAccuracy || 0) || 0));
  if (leftAccuracy !== rightAccuracy) {
    return leftAccuracy - rightAccuracy;
  }
  const leftIncorrect = Math.max(0, Number(leftEntry?.timesIncorrect || 0) || 0);
  const rightIncorrect = Math.max(0, Number(rightEntry?.timesIncorrect || 0) || 0);
  if (leftIncorrect !== rightIncorrect) {
    return rightIncorrect - leftIncorrect;
  }
  const leftCurrentPenalty = currentSet.has(leftWordId) ? 1 : 0;
  const rightCurrentPenalty = currentSet.has(rightWordId) ? 1 : 0;
  if (leftCurrentPenalty !== rightCurrentPenalty) {
    return leftCurrentPenalty - rightCurrentPenalty;
  }
  const leftLastSeen = Math.max(0, Number(leftEntry?.lastSeenAttemptNumber || 0) || 0);
  const rightLastSeen = Math.max(0, Number(rightEntry?.lastSeenAttemptNumber || 0) || 0);
  if (leftLastSeen !== rightLastSeen) {
    return leftLastSeen - rightLastSeen;
  }
  return leftWordId.localeCompare(rightWordId);
}

function compareSpellingMixedReviewPriority(leftWordId, rightWordId, ledger, upcomingAttemptNumber, currentWordIds = []) {
  const currentSet = new Set((Array.isArray(currentWordIds) ? currentWordIds : []).map((wordId) => String(wordId || "")));
  const leftEntry = ledger[leftWordId];
  const rightEntry = ledger[rightWordId];
  const leftRecent = (leftEntry?.recentAttemptNumbers || []).some((attemptNumber) => attemptNumber >= upcomingAttemptNumber - 4) ? 1 : 0;
  const rightRecent = (rightEntry?.recentAttemptNumbers || []).some((attemptNumber) => attemptNumber >= upcomingAttemptNumber - 4) ? 1 : 0;
  if (leftRecent !== rightRecent) {
    return rightRecent - leftRecent;
  }
  const leftAccuracy = Math.max(0, Math.min(100, Number(leftEntry?.lastStageFiveAccuracy || 0) || 0));
  const rightAccuracy = Math.max(0, Math.min(100, Number(rightEntry?.lastStageFiveAccuracy || 0) || 0));
  if (leftAccuracy !== rightAccuracy) {
    return leftAccuracy - rightAccuracy;
  }
  const leftIncorrect = Math.max(0, Number(leftEntry?.timesIncorrect || 0) || 0);
  const rightIncorrect = Math.max(0, Number(rightEntry?.timesIncorrect || 0) || 0);
  if (leftIncorrect !== rightIncorrect) {
    return rightIncorrect - leftIncorrect;
  }
  const leftCurrentPenalty = currentSet.has(leftWordId) ? 1 : 0;
  const rightCurrentPenalty = currentSet.has(rightWordId) ? 1 : 0;
  if (leftCurrentPenalty !== rightCurrentPenalty) {
    return leftCurrentPenalty - rightCurrentPenalty;
  }
  const leftDueGap = Math.abs(upcomingAttemptNumber - Math.max(1, Number(leftEntry?.nextDueAttemptNumber || upcomingAttemptNumber)));
  const rightDueGap = Math.abs(upcomingAttemptNumber - Math.max(1, Number(rightEntry?.nextDueAttemptNumber || upcomingAttemptNumber)));
  if (leftDueGap !== rightDueGap) {
    return leftDueGap - rightDueGap;
  }
  return leftWordId.localeCompare(rightWordId);
}

function buildSpellingAttemptWordIds(completedAttempts = [], currentWordIds = []) {
  const wordIds = [...SPELLING_DEFAULT_FOLLOW_UP_WORD_IDS];
  if (!wordIds.length) {
    return [];
  }

  const upcomingAttemptNumber = getSpellingSessionAttemptNumber(completedAttempts);
  const sessionKind = getSpellingSessionKind(upcomingAttemptNumber);
  const ledger = buildSpellingReviewLedger(completedAttempts);
  const introducedWordIds = wordIds.filter((wordId) => Number(ledger[wordId]?.introducedAttemptNumber || 0) > 0);
  const newWordIds = wordIds.filter((wordId) => !introducedWordIds.includes(wordId));
  const dueReviewWordIds = introducedWordIds
    .filter((wordId) => Number(ledger[wordId]?.nextDueAttemptNumber || upcomingAttemptNumber) <= upcomingAttemptNumber)
    .sort((left, right) => compareSpellingDueReviewPriority(left, right, ledger, upcomingAttemptNumber, currentWordIds));
  const mixedReviewWordIds = introducedWordIds
    .filter((wordId) => !dueReviewWordIds.includes(wordId))
    .sort((left, right) => compareSpellingMixedReviewPriority(left, right, ledger, upcomingAttemptNumber, currentWordIds));

  const reviewTarget = sessionKind === "cumulative-review"
    ? SPELLING_UNIT_SEED.followUpWordCount
    : SPELLING_SESSION_REVIEW_WORD_COUNT;
  const newTarget = sessionKind === "cumulative-review" ? 0 : SPELLING_SESSION_NEW_WORD_COUNT;

  const reviewSelection = pickSpellingWordIdsByPriority(
    [...dueReviewWordIds, ...mixedReviewWordIds],
    reviewTarget
  );
  const preferredFocuses = buildSpellingPreferredFocuses(reviewSelection.length ? reviewSelection : dueReviewWordIds.slice(0, 6));
  const orderedNewWordIds = orderSpellingWordIdsByGrouping(newWordIds, preferredFocuses, currentWordIds);
  const newSelection = orderedNewWordIds.slice(0, newTarget);

  const selectedWordIds = [...reviewSelection, ...newSelection];
  const remainingWordIds = [
    ...mixedReviewWordIds.filter((wordId) => !selectedWordIds.includes(wordId)),
    ...dueReviewWordIds.filter((wordId) => !selectedWordIds.includes(wordId)),
    ...orderedNewWordIds.filter((wordId) => !selectedWordIds.includes(wordId))
  ];
  const filledWordIds = [...selectedWordIds, ...remainingWordIds].slice(0, SPELLING_UNIT_SEED.followUpWordCount);
  return orderSpellingWordIdsByGrouping(
    filledWordIds,
    buildSpellingPreferredFocuses(filledWordIds.length ? filledWordIds : preferredFocuses),
    currentWordIds
  ).slice(0, SPELLING_UNIT_SEED.followUpWordCount);
}

function assignRandomSpellingAttemptWordIds(spelling, currentWordIds = []) {
  spelling.attemptPoolOffset = 0;
  spelling.currentSessionKind = getSpellingSessionKind(getSpellingSessionAttemptNumber(spelling.completedAttempts || []));
  spelling.followUpWordIds = buildSpellingAttemptWordIds(spelling.completedAttempts || [], currentWordIds);
}

function getSpellingAttemptWords(spelling) {
  const attemptWordIds = Array.isArray(spelling.followUpWordIds) && spelling.followUpWordIds.length
    ? spelling.followUpWordIds
    : buildSpellingAttemptWordIds();
  return attemptWordIds
    .map((wordId) =>
      SPELLING_DIAGNOSTIC_WORDS.find((entry) => entry.interventionId === wordId || normalizeSpellingAttempt(entry.word) === normalizeSpellingAttempt(wordId))
        || SPELLING_DIAGNOSTIC_WORDS.find((entry) => entry.interventionId === wordId)
    )
    .filter(Boolean)
    .slice(0, SPELLING_UNIT_SEED.diagnosticTargetCount);
}

function buildSpellingChallengeItemsFromAttempts(completedAttempts = []) {
  return completedAttempts
    .slice(-4)
    .flatMap((attempt, attemptIndex) =>
      (attempt.wordIds || []).map((wordId, wordIndex) => {
        const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
        if (!entry) {
          return null;
        }
        const mode = SPELLING_CHALLENGE_MODE_ORDER[(attemptIndex * SPELLING_UNIT_SEED.followUpWordCount + wordIndex) % SPELLING_CHALLENGE_MODE_ORDER.length];
        const familyWord = entry.familyWords[wordIndex % Math.max(1, entry.familyWords.length)] || entry.word;
        const missingIndex = Math.max(1, Math.min(entry.word.length - 2, (attemptIndex + wordIndex) % Math.max(2, entry.word.length - 1)));
        return {
          id: `${attempt.attemptId}:${wordId}:${wordIndex}`,
          mode,
          wordId,
          familyWord,
          missingIndex
        };
      })
    )
    .filter(Boolean);
}

function resetSpellingProgressForNewAttempt(spelling) {
  assignRandomSpellingAttemptWordIds(spelling, spelling.followUpWordIds);
  spelling.focusSummary = [];
  spelling.diagnostic = {
    currentIndex: 0,
    currentInput: "",
    responses: {},
    completed: false
  };
  spelling.looksRight = {
    answers: {},
    currentWordId: "",
    awaitingAdvanceWordId: "",
    feedbackKind: "",
    feedbackMessage: "",
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
  spelling.repeatCheck = {
    currentIndex: 0,
    currentInput: "",
    responses: {},
    completed: false
  };
  spelling.homeTab = "property";
  spelling.selectedStageId = "";
  spelling.celebrationStageId = "";
  spelling.sessionCompletionReady = false;
  spelling.currentAttemptId = createId();
  spelling.challenge.active = false;
  spelling.challenge.version = SPELLING_CHALLENGE_VERSION;
  spelling.challenge.currentIndex = 0;
  spelling.challenge.items = [];
  spelling.challenge.checked = false;
  spelling.challenge.completed = false;
  spelling.challenge.inputValue = "";
  spelling.lastUnlockedHorseId = "";
  spelling.coachMessage = spelling.currentSessionKind === "cumulative-review"
    ? "Cumulative review session ready. This round revisits earlier spellings in a mixed check before new words continue."
    : "This spelling session is ready with 4 new words and 6 review or mixed words.";
}

function getWeeklyCompletedSpellingAttempts(spelling, weekKey = currentWeekKey()) {
  return (spelling.completedAttempts || []).filter((entry) => entry.weekKey === weekKey);
}

function ensureSpellingSessionState(subject) {
  const spelling = getSubjectSpellingState(subject);
  if (!spelling.enabled) {
    return;
  }

  const attemptComplete = isSpellingAttemptComplete(subject);

  // Migrate older completed sessions into the final summary state so the
  // session can always be closed from Stage 5, even if the legacy flag was missed.
  if (attemptComplete && spelling.repeatCheck.completed && spelling.homeTab === "session" && !spelling.celebrationStageId) {
    spelling.selectedStageId = "repeat-check";
    spelling.sessionCompletionReady = true;
  }

  if (spelling.sessionPreparedKey === currentSpellingSessionKey) {
    return;
  }

  spelling.sessionPreparedKey = currentSpellingSessionKey;
  const weekKey = currentWeekKey();
  const weeklyAttempts = getWeeklyCompletedSpellingAttempts(spelling, weekKey);

  if (weeklyAttempts.length >= SPELLING_CUMULATIVE_REVIEW_FREQUENCY && spelling.challenge.lastCompletedWeekKey !== weekKey) {
    spelling.challenge = {
      version: SPELLING_CHALLENGE_VERSION,
      active: true,
      weekKey,
      currentIndex: 0,
      items: buildSpellingChallengeItemsFromAttempts(weeklyAttempts),
      checked: false,
      completed: false,
      inputValue: "",
      lastCompletedWeekKey: spelling.challenge.lastCompletedWeekKey || ""
    };
  } else if (attemptComplete && weeklyAttempts.length < SPELLING_CUMULATIVE_REVIEW_FREQUENCY) {
    spelling.coachMessage = spelling.coachMessage || "This spelling set is complete. Start the next set from the stable when you are ready.";
  }
}

function getSpellingVisibleStageId(subject) {
  const spelling = getSubjectSpellingState(subject);
  const selectedStageId = String(spelling.selectedStageId || "");
  if (selectedStageId && canOpenSpellingStage(subject, selectedStageId)) {
    return selectedStageId;
  }
  return getSpellingStageId(subject);
}

function activateSpellingSession(subject) {
  const spelling = getSubjectSpellingState(subject);
  spelling.homeTab = "session";

  if (spelling.sessionCompletionReady && spelling.repeatCheck.completed) {
    spelling.selectedStageId = "repeat-check";
    return;
  }

  if (SPELLING_STAGE_ORDER.includes(String(spelling.celebrationStageId || ""))) {
    spelling.selectedStageId = String(spelling.celebrationStageId || "diagnostic");
    return;
  }

  const visibleStageId = getSpellingVisibleStageId(subject);
  const fallbackStageId = getSpellingStageId(subject);
  spelling.selectedStageId = canOpenSpellingStage(subject, visibleStageId)
    ? visibleStageId
    : canOpenSpellingStage(subject, fallbackStageId)
      ? fallbackStageId
      : "diagnostic";
}

function setSpellingHomeTab(subject, tabId) {
  const spelling = getSubjectSpellingState(subject);
  const normalizedTabId = String(tabId || "") === "paddock" || String(tabId || "") === "stable"
    ? "property"
    : String(tabId || "") === "review"
      ? "progress"
      : String(tabId || "");
  if (!["session", "property", "progress"].includes(normalizedTabId)) {
    return;
  }
  if (normalizedTabId === "session") {
    activateSpellingSession(subject);
    return;
  }
  if (
    spelling.homeTab === normalizedTabId &&
    !spelling.celebrationStageId &&
    !spelling.sessionCompletionReady
  ) {
    return;
  }
  spelling.homeTab = normalizedTabId;
}

function setSpellingSelectedStage(subject, stageId) {
  const normalizedStageId = String(stageId || "");
  if (!canOpenSpellingStage(subject, normalizedStageId)) {
    return;
  }
  const spelling = getSubjectSpellingState(subject);
  if (
    spelling.homeTab === "session" &&
    spelling.selectedStageId === normalizedStageId &&
    !spelling.celebrationStageId
  ) {
    return;
  }
  const nextSpelling = getSubjectSpellingState(subject);
  nextSpelling.homeTab = "session";
  nextSpelling.selectedStageId = normalizedStageId;
  nextSpelling.celebrationStageId = "";
  nextSpelling.sessionCompletionReady = false;
}

function getActiveSpellingSubject() {
  const subject = getSelectedSubject();
  if (!subject || state.activeSubjectTab !== "spelling") {
    return null;
  }
  return subject;
}

function getSpellingNavigationAction(eventOrTarget) {
  let target = null;
  if (eventOrTarget && typeof eventOrTarget.composedPath === "function") {
    target = eventOrTarget.composedPath().find((node) => node instanceof Element) || null;
  } else {
    const rawTarget = eventOrTarget instanceof Event ? eventOrTarget.target : eventOrTarget;
    target = rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement || null;
  }
  if (!target) {
    return null;
  }

  const homeTabButton = target.closest("[data-spelling-home-tab]");
  if (homeTabButton?.dataset.spellingHomeTab) {
    return {
      type: "home-tab",
      button: homeTabButton,
      value: homeTabButton.dataset.spellingHomeTab
    };
  }

  const beginSessionButton = target.closest("[data-spelling-begin-session]");
  if (beginSessionButton) {
    return {
      type: "begin-session",
      button: beginSessionButton,
      value: "session"
    };
  }

  const openStageButton = target.closest("[data-spelling-open-stage]");
  if (openStageButton?.dataset.spellingOpenStage) {
    return {
      type: "open-stage",
      button: openStageButton,
      value: openStageButton.dataset.spellingOpenStage
    };
  }

  return null;
}

function applySpellingNavigationAction(subject, action) {
  if (!subject || !action) {
    return false;
  }

  if (action.type === "home-tab") {
    setSpellingHomeTab(subject, action.value);
    return true;
  }

  if (action.type === "begin-session") {
    activateSpellingSession(subject);
    return true;
  }

  if (action.type === "open-stage") {
    setSpellingSelectedStage(subject, action.value);
    return true;
  }

  return false;
}

function bindSpellingNavigationInteractions(subject, host) {
  const root = host?.querySelector(".ss-root");
  if (!root) {
    return;
  }
  if (root.dataset.spellingNavigationReady === subject.id) {
    return;
  }

  root.querySelectorAll("[data-spelling-home-tab]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setSpellingHomeTab(subject, button.dataset.spellingHomeTab);
      persistSubjects({ skipRemoteSync: true });
      render();
    });
  });

  root.querySelectorAll("[data-spelling-begin-session]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      activateSpellingSession(subject);
      persistSubjects({ skipRemoteSync: true });
      render();
    });
  });

  root.querySelectorAll("[data-spelling-open-stage]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setSpellingSelectedStage(subject, button.dataset.spellingOpenStage);
      persistSubjects({ skipRemoteSync: true });
      render();
    });
  });

  root.dataset.spellingNavigationReady = subject.id;
}

function celebrateSpellingStage(subject, stageId, coachMessage) {
  const spelling = getSubjectSpellingState(subject);
  spelling.homeTab = "session";
  spelling.selectedStageId = stageId;
  spelling.celebrationStageId = stageId;
  spelling.sessionCompletionReady = false;
  if (coachMessage) {
    spelling.coachMessage = coachMessage;
  }
  persistSubjects();
}

function continueSpellingStage(subject) {
  const spelling = getSubjectSpellingState(subject);
  const celebrationStageId = String(spelling.celebrationStageId || "");
  const completionMap = getSpellingStageCompletionMap(subject);
  if (celebrationStageId === "repeat-check" && SPELLING_STAGE_ORDER.every((stageId) => completionMap[stageId])) {
    const nextSpelling = getSubjectSpellingState(subject);
    nextSpelling.homeTab = "session";
    nextSpelling.celebrationStageId = "";
    nextSpelling.selectedStageId = "repeat-check";
    nextSpelling.sessionCompletionReady = true;
    persistSubjects();
    return;
  }
  let nextStageId = getSpellingNextStageAfterCelebration(subject, celebrationStageId);
  if (celebrationStageId === "repeat-check" && !SPELLING_STAGE_ORDER.every((stageId) => completionMap[stageId])) {
    nextStageId = getSpellingStageId(subject);
  }
  const nextSpelling = getSubjectSpellingState(subject);
  nextSpelling.homeTab = "session";
  nextSpelling.celebrationStageId = "";
  nextSpelling.sessionCompletionReady = false;
  nextSpelling.selectedStageId = nextStageId;
  persistSubjects();
}

function continueSpellingStageToTarget(subject, targetStageId = "") {
  const normalizedTarget = String(targetStageId || "");
  if (!normalizedTarget) {
    continueSpellingStage(subject);
    return;
  }
  if (normalizedTarget === "repeat-check" || canOpenSpellingStage(subject, normalizedTarget)) {
    const spelling = getSubjectSpellingState(subject);
    spelling.homeTab = "session";
    spelling.celebrationStageId = "";
    spelling.sessionCompletionReady = false;
    spelling.selectedStageId = normalizedTarget;
    persistSubjects();
    return;
  }
  continueSpellingStage(subject);
}

function finishSpellingSession(subject) {
  const spelling = getSubjectSpellingState(subject);
  spelling.homeTab = "property";
  spelling.selectedStageId = "repeat-check";
  spelling.celebrationStageId = "";
  spelling.sessionCompletionReady = isSpellingAttemptComplete(subject);
  persistSubjects();
}

function sendSpellingHorseToPaddock(subject, horseId, stageElement) {
  const spelling = getSubjectSpellingState(subject);
  ensureSpellingPaddockState(spelling);
  const horseState = spelling.paddockState[horseId];
  if (!horseState) {
    return;
  }
  const stageWidth = Math.max(320, Math.round(stageElement?.clientWidth || 520));
  const stageHeight = Math.max(220, Math.round(stageElement?.clientHeight || 320));
  const { width, height } = getSpellingPaddockHorseDimensions(horseState);
  horseState.roaming = true;
  horseState.left = Math.max(16, Math.min(stageWidth - width - 16, Math.round(stageWidth * (0.18 + Math.random() * 0.5))));
  horseState.top = Math.max(92, Math.min(stageHeight - height - 16, Math.round(stageHeight * (0.44 + Math.random() * 0.24))));
  persistSubjects();
  render();
}

function returnSpellingHorseToStall(subject, horseId) {
  const spelling = getSubjectSpellingState(subject);
  ensureSpellingPaddockState(spelling);
  const horseState = spelling.paddockState[horseId];
  if (!horseState) {
    return;
  }
  horseState.roaming = false;
  persistSubjects();
  render();
}

function returnAllSpellingHorsesToStalls(subject) {
  const spelling = getSubjectSpellingState(subject);
  ensureSpellingPaddockState(spelling);
  let didUpdate = false;
  Object.values(spelling.paddockState || {}).forEach((entry) => {
    if (!entry?.roaming) {
      return;
    }
    entry.roaming = false;
    didUpdate = true;
  });
  if (!didUpdate) {
    return;
  }
  persistSubjects();
  render();
}

function clampSpellingPaddockRoamingPositions(subject, stageElement) {
  if (!subject || !stageElement) {
    return false;
  }

  const spelling = getSubjectSpellingState(subject);
  ensureSpellingPaddockState(spelling);
  const stageWidth = Math.round(stageElement.clientWidth || stageElement.offsetWidth || 0);
  const stageHeight = Math.round(stageElement.clientHeight || stageElement.offsetHeight || 0);
  let didUpdate = false;

  Object.entries(spelling.paddockState || {}).forEach(([horseId, entry]) => {
    if (!entry?.roaming || !SPELLING_PADDOCK_HORSE_BY_ID[horseId]) {
      return;
    }

    const clampedEntry = clampSpellingPaddockEntry(entry, stageWidth, stageHeight);
    if (clampedEntry.left !== entry.left || clampedEntry.top !== entry.top) {
      spelling.paddockState[horseId] = clampedEntry;
      didUpdate = true;
    }
  });

  return didUpdate;
}

function applySpellingRoamingHorseStyle(horseElement, horseState, stageElement = null) {
  if (!horseElement || !horseState) {
    return;
  }
  const { width } = getSpellingPaddockHorseDimensions(horseState);
  const stageWidth = Math.round(stageElement?.clientWidth || stageElement?.offsetWidth || horseElement.parentElement?.clientWidth || 0);
  const stageHeight = Math.round(stageElement?.clientHeight || stageElement?.offsetHeight || horseElement.parentElement?.clientHeight || 0);
  const depth = getSpellingPaddockHorseFenceDepth(horseState, stageWidth, stageHeight);
  horseElement.style.left = `${horseState.left}px`;
  horseElement.style.top = `${horseState.top}px`;
  horseElement.style.width = `${width}px`;
  horseElement.style.zIndex = String(getSpellingPaddockHorseZIndex(horseState, stageWidth, stageHeight));
  horseElement.dataset.paddockDepth = depth;
}

function setupSpellingPaddockInteractions(subject, host) {
  if (!host) {
    return;
  }
  if (typeof host._spellingPaddockCleanup === "function") {
    host._spellingPaddockCleanup();
  }

  const stage = host.querySelector("[data-spelling-paddock-stage]");
  if (!stage) {
    return;
  }

  let horseNote = null;
  let horseNoteId = "";

  const closeHorseNote = () => {
    if (horseNote?.isConnected) {
      horseNote.remove();
    }
    horseNote = null;
    horseNoteId = "";
  };

  const positionHorseNote = (horseId) => {
    if (!horseNote || !horseId) {
      return;
    }
    const safeHorseId = typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(horseId) : horseId;
    const horseElement = stage.querySelector(`[data-spelling-horse="${safeHorseId}"][data-spelling-horse-mode="roaming"]`);
    if (!horseElement) {
      closeHorseNote();
      return;
    }
    const stageRect = stage.getBoundingClientRect();
    const horseRect = horseElement.getBoundingClientRect();
    const noteWidth = horseNote.offsetWidth || 220;
    const noteHeight = horseNote.offsetHeight || 180;
    const horseCenterX = (horseRect.left - stageRect.left) + horseRect.width / 2;
    const horseCenterY = (horseRect.top - stageRect.top) + horseRect.height / 2;
    let horizontalSide = horseCenterX > stageRect.width * 0.58 ? "left" : "right";
    let verticalSide = horseCenterY > stageRect.height * 0.55 ? "above" : "below";
    let nextLeft = horizontalSide === "left"
      ? horseRect.left - stageRect.left - noteWidth - 14
      : horseRect.right - stageRect.left + 14;
    let nextTop = verticalSide === "above"
      ? horseRect.top - stageRect.top - noteHeight - 10
      : horseRect.top - stageRect.top + Math.min(32, horseRect.height * 0.22);

    if (nextLeft < 14) {
      horizontalSide = "right";
      nextLeft = horseRect.right - stageRect.left + 14;
    }
    if (nextLeft + noteWidth > stageRect.width - 14) {
      horizontalSide = "left";
      nextLeft = horseRect.left - stageRect.left - noteWidth - 14;
    }
    if (nextTop < 18) {
      verticalSide = "below";
      nextTop = horseRect.top - stageRect.top + Math.min(32, horseRect.height * 0.22);
    }
    if (nextTop + noteHeight > stageRect.height - 14) {
      verticalSide = "above";
      nextTop = horseRect.top - stageRect.top - noteHeight - 10;
    }

    nextLeft = Math.max(14, Math.min(nextLeft, stageRect.width - noteWidth - 14));
    nextTop = Math.max(18, Math.min(nextTop, stageRect.height - noteHeight - 14));
    horseNote.dataset.horizontalSide = horizontalSide;
    horseNote.dataset.verticalSide = verticalSide;
    horseNote.style.left = `${Math.round(nextLeft)}px`;
    horseNote.style.top = `${Math.round(nextTop)}px`;
  };

  const renderHorseNote = (horseId) => {
    const spelling = getSubjectSpellingState(subject);
    const horseMeta = getSpellingOwnedHorseMeta(spelling).find((horse) => horse.id === horseId);
    if (!horseMeta || !horseMeta.state.roaming) {
      closeHorseNote();
      return;
    }
    const sizeIndex = getSpellingPaddockHorseSizeStepIndex(horseMeta.state.scale);
    if (!horseNote) {
      horseNote = document.createElement("aside");
      horseNote.className = "ss-horse-note";
      stage.appendChild(horseNote);
    }
    horseNoteId = horseId;
    horseNote.innerHTML = `
      <button type="button" class="ss-horse-note__close" aria-label="Close horse sign" data-spelling-horse-note-close="true">x</button>
      <div class="ss-horse-note__head">
        <div class="ss-horse-note__thumb">
          <img src="${escapeHtml(horseMeta.image)}" alt="${escapeHtml(horseMeta.name)}" />
        </div>
        <div class="ss-horse-note__identity">
          <span>Type</span>
          <strong>${escapeHtml(horseMeta.label)}</strong>
        </div>
      </div>
      <dl class="ss-horse-note__facts">
        <div><dt>Name</dt><dd>${escapeHtml(horseMeta.name)}</dd></div>
        <div><dt>Age</dt><dd>${escapeHtml(`${horseMeta.age} years`)}</dd></div>
      </dl>
      <div class="ss-horse-note__actions">
        <span>Size</span>
        <div class="ss-horse-note__buttons">
          <button type="button" class="ss-horse-note__size-button" data-spelling-horse-resize="${escapeHtml(horseId)}" data-spelling-horse-resize-direction="-1" ${sizeIndex <= 0 ? "disabled" : ""}>-</button>
          <button type="button" class="ss-horse-note__size-button" data-spelling-horse-resize="${escapeHtml(horseId)}" data-spelling-horse-resize-direction="1" ${sizeIndex >= SPELLING_PADDOCK_HORSE_SIZE_STEPS.length - 1 ? "disabled" : ""}>+</button>
        </div>
      </div>
    `;
    horseNote.querySelector("[data-spelling-horse-note-close]")?.addEventListener("click", () => {
      closeHorseNote();
    });
    horseNote.querySelectorAll("[data-spelling-horse-resize]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetHorseId = button.dataset.spellingHorseResize || "";
        const direction = Number(button.dataset.spellingHorseResizeDirection || 0);
        if (!targetHorseId || !direction) {
          return;
        }
        const nextSpelling = getSubjectSpellingState(subject);
        ensureSpellingPaddockState(nextSpelling);
        const horseState = nextSpelling.paddockState[targetHorseId];
        if (!horseState) {
          return;
        }
        const currentSizeIndex = getSpellingPaddockHorseSizeStepIndex(horseState.scale);
        const nextSizeIndex = Math.max(0, Math.min(SPELLING_PADDOCK_HORSE_SIZE_STEPS.length - 1, currentSizeIndex + direction));
        if (nextSizeIndex === currentSizeIndex) {
          return;
        }
        horseState.scale = SPELLING_PADDOCK_HORSE_SIZE_STEPS[nextSizeIndex];
        nextSpelling.paddockState[targetHorseId] = clampSpellingPaddockEntry(
          horseState,
          stage.clientWidth,
          stage.clientHeight
        );
        const safeTargetHorseId = typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(targetHorseId) : targetHorseId;
        const horseElement = stage.querySelector(`[data-spelling-horse="${safeTargetHorseId}"][data-spelling-horse-mode="roaming"]`);
        if (horseElement) {
          applySpellingRoamingHorseStyle(horseElement, nextSpelling.paddockState[targetHorseId], stage);
        }
        persistSubjects({ skipRemoteSync: true });
        renderHorseNote(targetHorseId);
        positionHorseNote(targetHorseId);
      });
    });
    positionHorseNote(horseId);
  };

  const syncRoamingHorsePositions = () => {
    const spelling = getSubjectSpellingState(subject);
    const didClamp = clampSpellingPaddockRoamingPositions(subject, stage);
    if (didClamp) {
      persistSubjects({ skipRemoteSync: true });
    }
    host.querySelectorAll('[data-spelling-horse-mode="roaming"]').forEach((horseElement) => {
      const horseId = horseElement.dataset.spellingHorse || "";
      const horseState = spelling.paddockState?.[horseId];
      if (!horseState) {
        return;
      }
      applySpellingRoamingHorseStyle(horseElement, horseState, stage);
    });
    if (horseNoteId) {
      positionHorseNote(horseNoteId);
    }
  };

  syncRoamingHorsePositions();

  let drag = null;

  const handlePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }
    const horse = event.target.closest("[data-spelling-horse]");
    if (!horse) {
      return;
    }
    closeHorseNote();
    event.preventDefault();
    const horseId = horse.dataset.spellingHorse || "";
    const mode = horse.dataset.spellingHorseMode || "stall";
    if (!horseId) {
      return;
    }
    if (mode === "stall") {
      drag = {
        horseId,
        stage,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        send: true
      };
      return;
    }
    const rect = horse.getBoundingClientRect();
    drag = {
      horseId,
      horse,
      stage,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      roam: true,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top
    };
    try {
      horse.setPointerCapture(event.pointerId);
    } catch (error) {
      // Ignore environments without pointer capture support.
    }
  };

  const handlePointerMove = (event) => {
    if (!drag) {
      return;
    }
    if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 4) {
      drag.moved = true;
    }
    if (!drag.roam || !drag.horse) {
      return;
    }
    const stageRect = drag.stage.getBoundingClientRect();
    let nextLeft = event.clientX - stageRect.left - drag.dx;
    let nextTop = event.clientY - stageRect.top - drag.dy;
    nextLeft = Math.max(8, Math.min(nextLeft, stageRect.width - drag.horse.offsetWidth - 8));
    nextTop = Math.max(76, Math.min(nextTop, stageRect.height - drag.horse.offsetHeight - 8));
    drag.horse.style.left = `${nextLeft}px`;
    drag.horse.style.top = `${nextTop}px`;
    if (drag.roam) {
      const spelling = getSubjectSpellingState(subject);
      const horseState = spelling.paddockState?.[drag.horseId];
      if (horseState) {
        drag.horse.style.zIndex = String(
          getSpellingPaddockHorseZIndex(
            { ...horseState, left: nextLeft, top: nextTop },
            stageRect.width,
            stageRect.height
          )
        );
        drag.horse.dataset.paddockDepth = getSpellingPaddockHorseFenceDepth(
          { ...horseState, left: nextLeft, top: nextTop },
          stageRect.width,
          stageRect.height
        );
      }
    }
  };

  const handlePointerUp = () => {
    if (!drag) {
      return;
    }
    if (drag.send) {
      if (!drag.moved) {
        sendSpellingHorseToPaddock(subject, drag.horseId, drag.stage);
      }
      drag = null;
      return;
    }
    if (!drag.moved) {
      returnSpellingHorseToStall(subject, drag.horseId);
      drag = null;
      return;
    }
    const spelling = getSubjectSpellingState(subject);
    ensureSpellingPaddockState(spelling);
    const horseState = spelling.paddockState[drag.horseId];
    if (horseState && drag.horse) {
      horseState.roaming = true;
      horseState.left = Math.max(0, Math.round(parseFloat(drag.horse.style.left) || horseState.left || 0));
      horseState.top = Math.max(0, Math.round(parseFloat(drag.horse.style.top) || horseState.top || 0));
      persistSubjects({ skipRemoteSync: true });
      if (horseNoteId === drag.horseId) {
        positionHorseNote(drag.horseId);
      }
    }
    drag = null;
  };

  const handleContextMenu = (event) => {
    const horse = event.target.closest('[data-spelling-horse-mode="roaming"]');
    if (!horse || !stage.contains(horse)) {
      return;
    }
    event.preventDefault();
    const horseId = horse.dataset.spellingHorse || "";
    if (!horseId) {
      return;
    }
    renderHorseNote(horseId);
  };

  const handleHostClick = (event) => {
    if (!horseNote) {
      return;
    }
    if (horseNote.contains(event.target)) {
      return;
    }
    if (event.target.closest('[data-spelling-horse-mode="roaming"]')) {
      return;
    }
    closeHorseNote();
  };

  host.addEventListener("pointerdown", handlePointerDown);
  host.addEventListener("click", handleHostClick);
  host.addEventListener("contextmenu", handleContextMenu);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("resize", syncRoamingHorsePositions);
  host.querySelector("[data-spelling-return-all-stalls]")?.addEventListener("click", () => {
    closeHorseNote();
    returnAllSpellingHorsesToStalls(subject);
  });
  host._spellingPaddockCleanup = () => {
    closeHorseNote();
    host.removeEventListener("pointerdown", handlePointerDown);
    host.removeEventListener("click", handleHostClick);
    host.removeEventListener("contextmenu", handleContextMenu);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("resize", syncRoamingHorsePositions);
  };
}

function getSpellingCelebrationCopy(subject, stageId) {
  if (stageId === "diagnostic") {
    const nextStageId = getSpellingNextStageAfterCelebration(subject, stageId);
    return {
      eyebrow: "Ribbon earned",
      title: "Stage 1 complete",
      body: "The spelling profile is ready. Continue to the next spelling activity so the follow-up words can be narrowed to the patterns that still need attention.",
      action: `Continue to ${getSpellingStageActionLabel(nextStageId)}`,
      nextStageId
    };
  }
  if (stageId === "looks-right") {
    const nextStageId = getSpellingNextStageAfterCelebration(subject, stageId);
    return {
      eyebrow: "Ribbon earned",
      title: "Stage 2 complete",
      body: "The words that still look unstable have been identified. Continue to the next stage to rehearse them one at a time through word-family sentences.",
      action: `Continue to ${getSpellingStageActionLabel(nextStageId)}`,
      nextStageId
    };
  }
  if (stageId === "word-families") {
    const nextStageId = getSpellingNextStageAfterCelebration(subject, stageId);
    return {
      eyebrow: "Ribbon earned",
      title: "Stage 3 complete",
      body: "Those family clues held. Continue to the next spelling activity to check how the word changes across tense.",
      action: `Continue to ${getSpellingStageActionLabel(nextStageId)}`,
      nextStageId
    };
  }
  if (stageId === "tense-transfer") {
    const nextStageId = getSpellingNextStageAfterCelebration(subject, stageId);
    return {
      eyebrow: "Ribbon earned",
      title: "Stage 4 complete",
      body: nextStageId === "repeat-check"
        ? "The tense check is complete. Continue to the final spelling check so you can compare the first dictation with what changed after the lesson."
        : "The tense check is complete. Continue to the next open spelling activity before the final check unlocks.",
      action: `Continue to ${getSpellingStageActionLabel(nextStageId)}`,
      nextStageId
    };
  }
  return {
    eyebrow: "Final ribbon",
    title: "Stage 5 complete",
    body: "All five stages are complete. Continue to review the session summary, compare the two dictation checks, and then reset for the next spelling round.",
    action: "Continue",
    nextStageId: "repeat-check"
  };
}

function getSpellingStageLabel(subject) {
  const stageId = getSpellingStageId(subject);
  return SPELLING_STAGE_LABELS[stageId] || SPELLING_STAGE_LABELS.diagnostic;
}

function getSpellingDiagnosticCurrentWord(spelling) {
  return getSpellingAttemptWords(spelling)[spelling.diagnostic.currentIndex] || null;
}

function getSpellingDiagnosticCorrectCount(spelling) {
  return getSpellingAttemptWords(spelling).filter((wordEntry) => spelling.diagnostic.responses[wordEntry.id]?.correct).length;
}

function getSpellingRepeatCurrentWord(spelling) {
  return getSpellingAttemptWords(spelling)[spelling.repeatCheck.currentIndex] || null;
}

function getSpellingRepeatCorrectCount(spelling) {
  return getSpellingAttemptWords(spelling).filter((wordEntry) => spelling.repeatCheck.responses[wordEntry.id]?.correct).length;
}

function buildSpellingFocusSummaryFromResponses(responses, spelling = null) {
  const counts = new Map();
  const diagnosticWords = spelling ? getSpellingAttemptWords(spelling) : SPELLING_DIAGNOSTIC_WORDS;
  diagnosticWords.forEach((wordEntry) => {
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
    : buildSpellingFocusSummaryFromResponses(spelling.diagnostic.responses, spelling);
  return focusSummary.slice(0, limit);
}

function buildSpellingFollowUpWordIdsFromResponses(responses, spelling = null) {
  const diagnosticWords = spelling ? getSpellingAttemptWords(spelling) : SPELLING_DIAGNOSTIC_WORDS;
  const missedWordIds = diagnosticWords
    .filter((wordEntry) => responses[wordEntry.id] && !responses[wordEntry.id].correct)
    .map((wordEntry) => String(wordEntry.interventionId || ""))
    .filter(Boolean);
  const fallbackWordIds = diagnosticWords
    .map((wordEntry) => String(wordEntry.interventionId || ""))
    .filter(Boolean);
  const followUpWordIds = missedWordIds.length ? missedWordIds : fallbackWordIds;
  return followUpWordIds.slice(0, SPELLING_UNIT_SEED.followUpWordCount);
}

function ensureSpellingFollowUpWordIds(spelling) {
  if (!spelling.followUpWordIds.length) {
    spelling.followUpWordIds = buildSpellingFollowUpWordIdsFromResponses(spelling.diagnostic.responses, spelling);
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
      completed: false,
      awaitingAdvance: false,
      feedbackKind: "",
      feedbackMessage: ""
    };
  }
  const card = spelling.flashcards.cards[wordId];
  if (typeof card.exposureIndex !== "number" || Number.isNaN(card.exposureIndex)) {
    card.exposureIndex = 0;
  }
  if (typeof card.isShowingSentence !== "boolean") {
    card.isShowingSentence = false;
  }
  if (typeof card.typedValue !== "string") {
    card.typedValue = "";
  }
  return card;
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
      selectedTense: "",
      checked: false,
      completed: false,
      awaitingAdvance: false,
      feedbackKind: "",
      feedbackMessage: "",
      lastCheckedAt: ""
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

function buildSpellingSessionDotRow(total, currentIndex, completedCount = 0) {
  return Array.from({ length: Math.max(0, total) }, (_, index) => {
    const isComplete = index < completedCount;
    const isCurrent = index === currentIndex;
    return `<span class="ss-dot${isComplete ? " is-complete" : ""}${isCurrent ? " is-current" : ""}"></span>`;
  }).join("");
}

function getSpellingFlashcardExposureLimit(wordId = "") {
  const entry = SPELLING_INTERVENTION_LIBRARY[String(wordId || "")];
  if (!entry) {
    return SPELLING_FLASHCARD_EXPOSURE_COUNT;
  }
  const availableSentenceCount = Array.isArray(entry.familySentences) ? entry.familySentences.length : 0;
  const availableFamilyWordCount = Array.isArray(entry.familyWords) ? entry.familyWords.length : 0;
  return Math.max(1, Math.min(SPELLING_FLASHCARD_EXPOSURE_COUNT, availableSentenceCount, availableFamilyWordCount));
}

function getSpellingTensePrompt(spelling, entry) {
  const promptSet = SPELLING_TENSE_PROMPTS[entry?.id] || {};
  const promptSeed = String(`${spelling?.currentAttemptId || "attempt"}:${entry?.id || ""}`);
  const promptIndex = promptSeed.split("").reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0) % SPELLING_TENSE_IDS.length;
  const tenseId = SPELLING_TENSE_IDS[promptIndex] || "present";
  const wordForm = entry?.tense?.[tenseId] || entry?.word || "";
  const sentence = String(promptSet[tenseId] || `They ${wordForm} it carefully.`).trim();
  return {
    tenseId,
    sentence,
    wordForm
  };
}

function getSpellingLooksRightCurrentWord(spelling) {
  const followUpWords = getSpellingFollowUpWords(spelling);
  if (spelling.looksRight.currentWordId) {
    const activeWord = followUpWords.find((entry) => entry.id === spelling.looksRight.currentWordId);
    if (activeWord && !spelling.looksRight.completed) {
      return activeWord;
    }
  }
  const nextWord = followUpWords.find((entry) => !spelling.looksRight.answers[entry.id]) || followUpWords[0] || null;
  spelling.looksRight.currentWordId = nextWord?.id || "";
  return nextWord;
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
  spelling.focusSummary = buildSpellingFocusSummaryFromResponses(spelling.diagnostic.responses, spelling);
  spelling.followUpWordIds = buildSpellingFollowUpWordIdsFromResponses(spelling.diagnostic.responses, spelling);
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
  spelling.repeatCheck = {
    currentIndex: 0,
    currentInput: "",
    responses: {},
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

function finaliseSpellingRepeatCheck(subject) {
  const spelling = getSubjectSpellingState(subject);
  spelling.repeatCheck.completed = true;
  const initialScore = getSpellingDiagnosticCorrectCount(spelling);
  const repeatScore = getSpellingRepeatCorrectCount(spelling);
  const overallScorePercent = getSpellingOverallScorePercent(spelling);
  const attemptAlreadyRecorded = (spelling.completedAttempts || []).some((entry) => entry.attemptId === spelling.currentAttemptId);
  spelling.lastOverallScorePercent = overallScorePercent;
  const unlockedHorse = attemptAlreadyRecorded ? "" : unlockSpellingPaddockHorse(spelling);
  const unlockedHorseMeta = getSpellingPaddockHorseMeta(unlockedHorse);
  if (unlockedHorseMeta) {
    RewardProperty.addHorse(unlockedHorseMeta.id, unlockedHorseMeta.name, unlockedHorseMeta.label);
  }
  recordCompletedSpellingAttempt(subject);
  if (RewardProperty.syncPracticeState) {
    RewardProperty.syncPracticeState(subject);
  }
  const completionMessage = unlockedHorse
    ? `Final spelling check complete. You moved from ${initialScore}/${SPELLING_UNIT_SEED.diagnosticTargetCount} to ${repeatScore}/${SPELLING_UNIT_SEED.diagnosticTargetCount}. ${unlockedHorseMeta?.name || "A new horse"} has been added to your property.`
    : `Final spelling check complete. You moved from ${initialScore}/${SPELLING_UNIT_SEED.diagnosticTargetCount} to ${repeatScore}/${SPELLING_UNIT_SEED.diagnosticTargetCount}.`;
  spelling.homeTab = "session";
  spelling.selectedStageId = "repeat-check";
  spelling.celebrationStageId = "";
  spelling.sessionCompletionReady = true;
  spelling.coachMessage = completionMessage;
  spelling.lastUnlockedHorseId = unlockedHorse || spelling.lastUnlockedHorseId;
  persistSubjects();
}

function recordCompletedSpellingAttempt(subject) {
  const spelling = getSubjectSpellingState(subject);
  if ((spelling.completedAttempts || []).some((entry) => entry.attemptId === spelling.currentAttemptId)) {
    return;
  }
  const attemptWords = getSpellingAttemptWords(spelling);
  const stageOneCorrect = getSpellingDiagnosticCorrectCount(spelling);
  const stageFiveCorrect = getSpellingRepeatCorrectCount(spelling);
  const overallScorePercent = getSpellingOverallScorePercent(spelling);
  spelling.completedAttempts = [
    ...(spelling.completedAttempts || []),
    {
      attemptId: spelling.currentAttemptId,
      instanceNumber: (spelling.completedAttempts || []).length + 1,
      sessionKind: spelling.currentSessionKind || getSpellingSessionKind(getSpellingSessionAttemptNumber(spelling.completedAttempts || [])),
      weekKey: currentWeekKey(),
      completedAt: new Date().toISOString(),
      stageOneCorrect,
      stageFiveCorrect,
      overallScorePercent,
      wordIds: [...spelling.followUpWordIds].slice(0, SPELLING_UNIT_SEED.followUpWordCount),
      wordResults: attemptWords.map((wordEntry) => {
        const stageOneAttempt = String(spelling.diagnostic.responses[wordEntry.id]?.attempt || "");
        const stageFiveAttempt = String(spelling.repeatCheck.responses[wordEntry.id]?.attempt || "");
        return {
          wordId: wordEntry.id,
          word: wordEntry.word,
          stageOneAttempt,
          stageOneAccuracy: calculateSpellingWordAccuracy(wordEntry.word, stageOneAttempt),
          stageFiveAttempt,
          stageFiveAccuracy: calculateSpellingWordAccuracy(wordEntry.word, stageFiveAttempt)
        };
      })
    }
  ];
}

function resetSpellingActivity(subject, activityId) {
  const spelling = getSubjectSpellingState(subject);
  if (activityId === "diagnostic") {
    assignRandomSpellingAttemptWordIds(spelling, spelling.followUpWordIds);
    spelling.diagnostic = {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    };
    spelling.looksRight = {
      answers: {},
      currentWordId: "",
      awaitingAdvanceWordId: "",
      feedbackKind: "",
      feedbackMessage: "",
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
    spelling.repeatCheck = {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    };
    spelling.focusSummary = [];
    spelling.currentAttemptId = createId();
    spelling.challenge.active = false;
    spelling.challenge.currentIndex = 0;
    spelling.challenge.items = [];
    spelling.challenge.checked = false;
    spelling.challenge.completed = false;
    spelling.challenge.inputValue = "";
    spelling.currentSessionKind = getSpellingSessionKind(getSpellingSessionAttemptNumber(spelling.completedAttempts || []));
    spelling.coachMessage = spelling.currentSessionKind === "cumulative-review"
      ? "Cumulative review session reset. This round revisits earlier words in a mixed review."
      : "Session reset. This round mixes 4 new words with 6 review or mixed words.";
  } else if (activityId === "looks-right") {
    spelling.looksRight = {
      answers: {},
      currentWordId: "",
      awaitingAdvanceWordId: "",
      feedbackKind: "",
      feedbackMessage: "",
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
    spelling.repeatCheck = {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    };
    spelling.coachMessage = "Choose the spelling that looks right, then use the rule note before moving on.";
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
    spelling.repeatCheck = {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    };
    spelling.coachMessage = "Tap the key word, listen to the family sentences, then write the root from memory.";
  } else if (activityId === "tense-transfer") {
    spelling.tenseTransfer = {
      version: SPELLING_TENSE_TRANSFER_VERSION,
      answers: {},
      currentWordId: "",
      completed: false
    };
    spelling.repeatCheck = {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    };
    spelling.coachMessage = "Read the sentence, choose the tense, and help the horse reach the stable.";
  } else if (activityId === "repeat-check") {
    spelling.repeatCheck = {
      currentIndex: 0,
      currentInput: "",
      responses: {},
      completed: false
    };
    spelling.coachMessage = "Listen again to the same ten words and compare them with the first spelling check.";
  } else {
    subject.spelling = createDefaultSpellingState(subject.id, subject.name);
  }
  spelling.homeTab = activityId === "diagnostic" ? "property" : "session";
  spelling.selectedStageId = "";
  spelling.celebrationStageId = "";
  spelling.sessionCompletionReady = false;
  persistSubjects();
}

function getSpellingAudioContext(mode, wordEntry, variant = "word") {
  return `spelling:${String(mode || "diagnostic")}:${String(wordEntry?.id || "")}:${String(variant || "word")}`;
}

function setSpellingAudioStatus(context, tone, message, { skipRender = false } = {}) {
  state.spellingAudioStatus = {
    context: String(context || ""),
    tone: String(tone || ""),
    message: String(message || "")
  };
  if (!skipRender) {
    render();
  }
}

function clearSpellingAudioStatus(context = "", { skipRender = false } = {}) {
  const requestedContext = String(context || "");
  const activeContext = String(state.spellingAudioStatus?.context || "");
  if (requestedContext && requestedContext !== activeContext) {
    return;
  }
  if (!activeContext && !String(state.spellingAudioStatus?.message || "")) {
    return;
  }
  state.spellingAudioStatus = {
    context: "",
    tone: "",
    message: ""
  };
  if (!skipRender) {
    render();
  }
}

function buildSpellingAudioStatusMarkup(mode, wordEntry) {
  if (!wordEntry) {
    return "";
  }
  const activeContext = String(state.spellingAudioStatus?.context || "");
  const message = String(state.spellingAudioStatus?.message || "").trim();
  if (!message || !activeContext.startsWith(`spelling:${String(mode || "diagnostic")}:${wordEntry.id}:`)) {
    return "";
  }
  const tone = String(state.spellingAudioStatus?.tone || "");
  const toneClass = tone === "error" ? " is-incorrect" : tone ? " is-active" : "";
  return `
    <div class="ss-status-note ss-status-note--feedback${toneClass}">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function speakSpellingWordAudio(wordEntry, { mode = "diagnostic" } = {}) {
  if (!wordEntry) {
    return;
  }
  const audioContext = getSpellingAudioContext(mode, wordEntry, "word");
  if (currentAudioContext === audioContext) {
    stopListening();
    clearSpellingAudioStatus(audioContext, { skipRender: true });
  }

  const cueWord = String(wordEntry.word || "").trim();
  const articulationCue = String(wordEntry.articulation || "").trim();
  const cueText = articulationCue
    ? `${cueWord}. ${cueWord}. Now spell it in chunks: ${articulationCue}.`
    : `${cueWord}. ${cueWord}.`;

  setSpellingAudioStatus(audioContext, "pending", "Preparing AI voice...", { skipRender: true });
  void speakTextWithOpenAi(cueText, {
    context: audioContext,
    statusMessages: {
      preparing: "Preparing spelling audio...",
      playing: "Reading spelling word and chunks...",
      error: "Spelling audio failed."
    },
    chunksOverride: [cueText],
    onStatusChange: (tone, message) => {
      setSpellingAudioStatus(audioContext, tone, message);
    }
  })
    .then(() => {
      clearSpellingAudioStatus(audioContext);
    })
    .catch((error) => {
      console.error("Spelling audio failed.", error);
      setSpellingAudioStatus(
        audioContext,
        "error",
        error instanceof Error ? error.message : "Spelling audio failed."
      );
    });
}

function speakSpellingDiagnosticWord(wordEntry) {
  speakSpellingWordAudio(wordEntry, { mode: "diagnostic" });
}

function speakSpellingDiagnosticSentence(wordEntry, { mode = "diagnostic" } = {}) {
  if (!wordEntry) {
    return;
  }
  const audioContext = getSpellingAudioContext(mode, wordEntry, "sentence");
  if (currentAudioContext === audioContext) {
    stopListening();
    clearSpellingAudioStatus(audioContext, { skipRender: true });
  }

  const sentenceText = wordEntry.sentence || `Use ${wordEntry.word} in a sentence.`;
  setSpellingAudioStatus(audioContext, "pending", "Preparing AI voice...", { skipRender: true });
  void speakTextWithOpenAi(sentenceText, {
    context: audioContext,
    statusMessages: {
      preparing: "Preparing sentence audio...",
      playing: "Reading sentence...",
      error: "Sentence audio failed."
    },
    chunksOverride: [sentenceText],
    onStatusChange: (tone, message) => {
      setSpellingAudioStatus(audioContext, tone, message);
    }
  })
    .then(() => {
      clearSpellingAudioStatus(audioContext);
    })
    .catch((error) => {
      console.error("Spelling sentence audio failed.", error);
      setSpellingAudioStatus(
        audioContext,
        "error",
        error instanceof Error ? error.message : "Sentence audio failed."
      );
    });
}

function speakSpellingRepeatWord(wordEntry) {
  speakSpellingWordAudio(wordEntry, { mode: "repeat-check" });
}

function speakSpellingRepeatSentence(wordEntry) {
  speakSpellingDiagnosticSentence(wordEntry, { mode: "repeat-check" });
}

function submitSpellingDiagnosticWord(subject, attemptOverride = null) {
  const spelling = getSubjectSpellingState(subject);
  const wordEntry = getSpellingDiagnosticCurrentWord(spelling);
  const diagnosticWordCount = getSpellingDiagnosticWordCount(spelling);
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

  if (spelling.diagnostic.currentIndex >= diagnosticWordCount) {
    finaliseSpellingDiagnostic(subject);
  } else {
    const nextWord = getSpellingDiagnosticCurrentWord(spelling);
    spelling.coachMessage = nextWord
      ? `Saved. Word ${spelling.diagnostic.currentIndex + 1} of ${diagnosticWordCount} is ready.`
      : spelling.coachMessage;
  }

  persistSubjects();
}

function submitSpellingRepeatWord(subject, attemptOverride = null) {
  const spelling = getSubjectSpellingState(subject);
  const wordEntry = getSpellingRepeatCurrentWord(spelling);
  const diagnosticWordCount = getSpellingDiagnosticWordCount(spelling);
  if (!wordEntry) {
    return;
  }
  const attempt = String(
    attemptOverride !== null && attemptOverride !== undefined
      ? attemptOverride
      : spelling.repeatCheck.currentInput || ""
  ).trim();
  if (!attempt) {
    spelling.coachMessage = "Type the word before moving to the next item.";
    persistSubjects();
    return;
  }
  spelling.repeatCheck.responses[wordEntry.id] = {
    attempt,
    correct: normalizeSpellingAttempt(attempt) === normalizeSpellingAttempt(wordEntry.word)
  };
  spelling.repeatCheck.currentInput = "";
  spelling.repeatCheck.currentIndex += 1;

  if (spelling.repeatCheck.currentIndex >= diagnosticWordCount) {
    finaliseSpellingRepeatCheck(subject);
  } else {
    const nextWord = getSpellingRepeatCurrentWord(spelling);
    spelling.coachMessage = nextWord
      ? `Saved. Word ${spelling.repeatCheck.currentIndex + 1} of ${diagnosticWordCount} is ready.`
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
  const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
  if (!entry) {
    return;
  }
  spelling.looksRight.answers[wordId] = value;
  spelling.looksRight.checked = false;
  spelling.looksRight.completed = false;
  spelling.looksRight.currentWordId = wordId;
  spelling.looksRight.awaitingAdvanceWordId = wordId;
  spelling.looksRight.feedbackKind = value === entry.word ? "correct" : "incorrect";
  spelling.looksRight.feedbackMessage = value === entry.word
    ? `${entry.word} is the settled spelling in this word family.`
    : `The correct spelling is ${entry.word}.`;
  spelling.coachMessage = value === entry.word
    ? `Correct. ${entry.lookRightNote || entry.familyNote || ""}`.trim()
    : `Incorrect. ${entry.lookRightNote || `Look back at how ${entry.word} is built.`}`.trim();
  persistSubjects();
}

function advanceSpellingLooksRightWord(subject) {
  const spelling = getSubjectSpellingState(subject);
  const currentWordId = String(spelling.looksRight.awaitingAdvanceWordId || spelling.looksRight.currentWordId || "");
  if (!currentWordId) {
    return;
  }
  const followUpWords = getSpellingFollowUpWords(spelling);
  const allAnswered = followUpWords.every((entry) => Boolean(spelling.looksRight.answers[entry.id]));
  spelling.looksRight.awaitingAdvanceWordId = "";
  spelling.looksRight.feedbackKind = "";
  spelling.looksRight.feedbackMessage = "";
  spelling.looksRight.currentWordId = "";
  if (allAnswered) {
    checkSpellingLooksRight(subject);
    return;
  }
  const nextWord = getSpellingLooksRightCurrentWord(spelling);
  const answeredCount = followUpWords.filter((entry) => Boolean(spelling.looksRight.answers[entry.id])).length;
  spelling.coachMessage = nextWord
    ? `Sentence ${Math.min(answeredCount + 1, followUpWords.length)} of ${followUpWords.length} is ready.`
    : spelling.coachMessage;
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

function buildSpellingMismatchExplanation(expectedWord, typedValue) {
  const expected = normalizeSpellingAttempt(expectedWord);
  const attempt = normalizeSpellingAttempt(typedValue);
  if (!attempt) {
    return "No letters were entered yet.";
  }

  const mismatchIndex = [...expected].findIndex((character, index) => attempt[index] !== character);
  if (mismatchIndex === -1) {
    if (attempt.length < expected.length) {
      return `The ending is incomplete. The missing finish is ${expectedWord.slice(attempt.length)}.`;
    }
    if (attempt.length > expected.length) {
      return `Extra letters were added after ${expectedWord}.`;
    }
    return "The spelling matches.";
  }

  const expectedLetter = expected[mismatchIndex] || "";
  const actualLetter = attempt[mismatchIndex] || "nothing";
  return `The mismatch starts at letter ${mismatchIndex + 1}: expected ${expectedLetter} but got ${actualLetter}.`;
}

function buildSpellingRecallFeedback(entry, typedValue, isCorrect) {
  if (isCorrect) {
    return `Correct. ${entry.familyNote}`;
  }
  return `Incorrect. You typed ${typedValue || "nothing"}. The correct spelling is ${entry.word}. ${buildSpellingMismatchExplanation(entry.word, typedValue)} ${entry.familyNote}`;
}

function getSpellingWordFamilyReferenceMarkup(entry) {
  return `
    <div class="spelling-family-reference">
      <div class="spelling-family-reference__chips">
        ${[entry.word, ...(entry.familyWords || [])]
          .map((word, index) => `<span class="spelling-skill${index === 0 ? " is-strong" : ""}">${escapeHtml(word)}</span>`)
          .join("")}
      </div>
    </div>
  `;
}

function buildSpellingSyntheticDistractor(entry) {
  const baseWrong = String(entry?.lookRightWrong || "").trim();
  const baseWord = String(entry?.word || "").trim();
  if (!baseWrong || !baseWord) {
    return baseWrong || baseWord;
  }
  if (baseWrong.endsWith("e")) {
    return baseWrong.slice(0, -1);
  }
  if (baseWord.endsWith("e")) {
    return `${baseWrong}e`;
  }
  return `${baseWrong}${baseWrong.at(-1) || ""}`;
}

function buildSpellingLooksRightOptions(spelling, entry) {
  const diagnosticEntry = SPELLING_DIAGNOSTIC_WORDS.find((wordEntry) => wordEntry.interventionId === entry.id);
  const diagnosticAttempt = String(spelling.diagnostic.responses[diagnosticEntry?.id || ""]?.attempt || "").trim();
  const options = [
    {
      value: entry.word,
      displayWord: entry.lookRightChoiceCorrect || entry.articulation || entry.word
    },
    {
      value: entry.lookRightWrong,
      displayWord: entry.lookRightChoiceWrong || entry.lookRightWrong
    },
    diagnosticAttempt && normalizeSpellingAttempt(diagnosticAttempt) !== normalizeSpellingAttempt(entry.word)
      ? {
          value: diagnosticAttempt,
          displayWord: diagnosticAttempt
        }
      : {
          value: buildSpellingSyntheticDistractor(entry),
          displayWord: buildSpellingSyntheticDistractor(entry)
        }
  ]
    .filter((option) => option.value)
    .filter((option, index, array) => array.findIndex((candidate) => normalizeSpellingAttempt(candidate.value) === normalizeSpellingAttempt(option.value)) === index);

  while (options.length < 3) {
    const fallbackValue = `${entry.lookRightWrong}${options.length}`;
    options.push({
      value: fallbackValue,
      displayWord: fallbackValue
    });
  }

  const seededRank = (value) =>
    String(`${spelling.currentAttemptId || "attempt"}:${entry.id}:${value}`)
      .split("")
      .reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0);

  return options
    .slice(0, 3)
    .sort((left, right) => {
      const difference = (seededRank(left.value) % 101) - (seededRank(right.value) % 101);
      return difference || left.value.localeCompare(right.value);
    });
}

function buildSpellingPaddockMarkup(spelling) {
  const ownedHorses = getSpellingOwnedHorseMeta(spelling);
  const stalls = ownedHorses.length ? ownedHorses : [];
  const stallCount = Math.max(6, stalls.length || 0);
  const roamingCount = ownedHorses.filter((horse) => horse.state.roaming).length;
  const stallMarkup = Array.from({ length: stallCount }, (_, index) => {
    const horse = stalls[index] || null;
    const stateEntry = horse?.state || buildDefaultSpellingPaddockEntry(index);
    const isRoaming = Boolean(horse && stateEntry.roaming);
    return `
      <div class="ss-stall${isRoaming ? " is-empty" : ""}" data-spelling-stall="${escapeHtml(`s${index + 1}`)}">
        <div class="ss-stall-cell">
          <div class="ss-stall-inner">
            ${horse && !isRoaming ? `<img class="ss-horse ss-horse--stall" src="${escapeHtml(horse.image)}" alt="${escapeHtml(horse.name)}" data-spelling-horse="${escapeHtml(horse.id)}" data-spelling-horse-mode="stall" />` : ""}
          </div>
          <div class="ss-stall-bars"></div>
          <div class="ss-stall-door"><span class="ss-stall-plate">No. ${index + 1}</span></div>
          <div class="ss-stall-empty">Out roaming</div>
        </div>
      </div>
    `;
  }).join("");
  const roamingMarkup = ownedHorses
    .filter((horse) => horse.state.roaming)
    .map((horse) => `
      <img
        class="ss-horse ss-horse--roaming"
        src="${escapeHtml(horse.image)}"
        alt="${escapeHtml(horse.name)}"
        data-spelling-horse="${escapeHtml(horse.id)}"
        data-spelling-horse-mode="roaming"
        data-paddock-depth="${escapeHtml(getSpellingPaddockHorseFenceDepth(horse.state, 520, 404))}"
        style="left:${escapeHtml(String(horse.state.left))}px;top:${escapeHtml(String(horse.state.top))}px;width:${escapeHtml(String(getSpellingPaddockHorseDimensions(horse.state).width))}px;z-index:${escapeHtml(String(getSpellingPaddockHorseZIndex(horse.state, 520, 404)))};"
      />
    `)
    .join("");

  return `
    <section class="ss-stable-card ss-stable-card--full">
      <div class="ss-paddock-frame pf-frame" data-spelling-paddock-frame="true">
        <div class="ss-paddock-stage" data-spelling-paddock-stage="true">
          <div class="ss-paddock-callout">Tap a horse from the stalls to bring it into the paddock, drag it anywhere, then right-click it for details and size</div>
          ${roamingMarkup}
          <div class="ss-paddock-fence" aria-hidden="true"></div>
        </div>
        <div class="ss-stalls-panel">
        <div class="ss-stalls-head">
          <h4>The stalls</h4>
          <span>${escapeHtml(roamingCount ? `${roamingCount} roaming in the paddock · tap a horse to bring it back` : "Every earned horse appears below · tap a horse to send it out · tap it again in the paddock to bring it back")}</span>
        </div>
        ${roamingCount ? '<div class="spelling-stage-actions spelling-stage-actions--compact"><button type="button" class="ghost-button ghost-button--small" data-spelling-return-all-stalls="true">Return all to stalls</button></div>' : ""}
          <div class="ss-stall-grid-wrap">
            <div class="ss-stall-grid">${stallMarkup}</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildRewardPropertyMarkup() {
  const devActions = import.meta.env.DEV ? `
    <div class="rp-acts">
      <button class="rp-btn rp-btn-moss" data-rp="session">+ Practice session complete</button>
      <button class="rp-btn rp-btn-plum" data-rp="renovate">+ Grammar session complete</button>
      <button class="rp-btn rp-btn-ghost" data-rp="reset">Reset</button>
    </div>
  ` : "";
  return `
    <section class="rp-root" id="rp">
      <header class="rp-head">
        <div>
          <div class="rp-eyebrow">PaperPanda · shared reward world</div>
          <h2 class="rp-title">Your horse property</h2>
          <p class="rp-sub">Grammar and Practice sessions rebuild the property stage by stage. Practice sessions also add horses and unlock later reward choices. Move between the paddocks, the stables, and the tack room.</p>
        </div>
        ${devActions}
      </header>

      <nav class="rp-tabs">
        <button class="rp-tab is-on" data-rp-view="property">Property</button>
        <button class="rp-tab" data-rp-view="stable">Stables</button>
        <button class="rp-tab" data-rp-view="tack">Tack room</button>
        <button class="rp-tab" data-rp-view="arena">Arena setup</button>
      </nav>

      <div class="rp-cols">
        <div class="rp-main">
          <div class="rp-stage" data-rp-panel="property">
            <div class="rp-world">
              <div class="rp-bg"></div>
              <div class="rp-occluder"></div>
            </div>
            <div class="rp-hud"><span class="rp-hud-stage"></span><i></i><span class="rp-hud-count"></span></div>
            <div class="rp-zoom">
              <button class="rp-zbtn" data-rp="zoom-out" aria-label="Zoom out">-</button>
              <div class="rp-zval">100%</div>
              <button class="rp-zbtn" data-rp="zoom-in" aria-label="Zoom in">+</button>
            </div>
          </div>

          <div class="rp-aisle" data-rp-panel="stable" hidden>
            <div class="rp-aisle-head">
              <div>
                <div class="rp-eyebrow rp-eyebrow-wood">Inside the stable</div>
                <div class="rp-aisle-title">Stables · <span class="rp-inside">0 horses</span> inside</div>
              </div>
              <div class="rp-aisle-hint">Tap a stall to select a horse</div>
            </div>
            <div class="rp-stalls"></div>
          </div>

          <div class="rp-tackwrap" data-rp-panel="tack" hidden>
            <div class="rp-tackhint"></div>
            <div class="rp-tackroom"></div>
            <div class="rp-tackchoices"></div>
          </div>

          <div class="rp-arenawrap" data-rp-panel="arena" hidden>
            <div class="rp-arenahint">Add a jump, then drag it anywhere inside the arena.</div>
            <div class="rp-arena-stage">
              <div class="rp-arena-canvas"></div>
            </div>
            <div class="rp-arena-actions">
              <div class="rp-arena-library"></div>
              <button class="rp-btn rp-btn-ghost" data-rp="remove-jump">Remove selected jump</button>
            </div>
          </div>

          <div class="rp-foot"></div>
        </div>

        <aside class="rp-rail">
          <div class="rp-card">
            <h3 class="rp-card-t">Renovation</h3>
            <p class="rp-card-p rp-stage-note"></p>
            <div class="rp-pips"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          </div>

          <div class="rp-card rp-sel" hidden>
            <div class="rp-sel-head">
              <div class="rp-sel-thumb"></div>
              <div>
                <div class="rp-sel-name"></div>
                <div class="rp-sel-breed"></div>
                <div class="rp-sel-where"></div>
              </div>
            </div>
            <div class="rp-label">Tack setup</div>
            <div class="rp-tackrows"></div>
            <div class="rp-choice-summary"></div>
            <button class="rp-btn rp-btn-dark rp-wide" data-rp="stable-toggle">Send back to the stable</button>
            <button class="rp-btn rp-btn-ghost rp-wide" data-rp="deselect">Close</button>
          </div>

          <div class="rp-card rp-empty">
            <h3 class="rp-card-t">No horse selected</h3>
            <p class="rp-card-p">Tap a horse on the property or a stall in the aisle to tack it up.</p>
          </div>

          <div class="rp-card">
            <h3 class="rp-card-t">Your horses</h3>
            <div class="rp-chips"></div>
          </div>
        </aside>
      </div>
    </section>
  `;
}

const RewardProperty = (function () {
  const RP_GRAMMAR_SESSION_VERSION = 2;
  const START_SPOTS = [[80, 60], [86, 68], [90, 58], [78, 72], [20, 62], [32, 66], [55, 50], [64, 52]];
  let root = null;
  let S = null;
  let currentPracticeSubject = null;
  let view = "property";
  let sel = null;
  let activeTackCategory = "saddle";
  let selectedArenaJumpId = "";
  let zoom = 1;
  let px = 0;
  let py = 0;
  let drag = null;
  let pan = null;

  function getDerivedStage(sessionCount = 0) {
    return Math.max(0, Math.min(RP_STAGES.length - 1, Math.max(0, Number(sessionCount || 0) || 0)));
  }

  function getEffectiveRenovationSessionCount(grammarSessions = S?.grammarSessions || 0, practiceSessions = S?.sessions || 0) {
    return Math.max(0, Math.max(Number(grammarSessions || 0) || 0, Number(practiceSessions || 0) || 0));
  }

  function syncVisibleStage() {
    const nextStage = getDerivedStage(getEffectiveRenovationSessionCount());
    S.stage = nextStage;
    return nextStage;
  }

  function getStageSummary(stageIndex = 0) {
    const safeStageIndex = Math.max(0, Math.min(RP_STAGES.length - 1, Number(stageIndex || 0) || 0));
    const stage = RP_STAGES[safeStageIndex] || RP_STAGES[0] || ["", "", ""];
    return {
      stageIndex: safeStageIndex,
      stageNumber: safeStageIndex + 1,
      image: String(stage[0] || ""),
      title: String(stage[1] || ""),
      label: String(stage[1] || "").replace(/^Stage\s+\d+\s*-\s*/i, "").trim(),
      description: String(stage[2] || "")
    };
  }

  function getGrammarUpgradeSummary(previousGrammarSessions = 0, nextGrammarSessions = previousGrammarSessions) {
    const practiceSessions = S?.sessions || 0;
    const previousStageIndex = getDerivedStage(getEffectiveRenovationSessionCount(previousGrammarSessions, practiceSessions));
    const nextStageIndex = getDerivedStage(getEffectiveRenovationSessionCount(nextGrammarSessions, practiceSessions));
    const earned = nextStageIndex > previousStageIndex;
    const nextOptionalAllowance = Math.max(0, Math.max(Number(nextGrammarSessions || 0) || 0, Number(practiceSessions || 0) || 0) - RP_MANDATORY_REWARDS.length);
    const pendingChoiceCount = Math.max(0, nextOptionalAllowance - getClaimedRewardIds().length);
    const summary = getStageSummary(nextStageIndex);
    return {
      earned,
      heading: earned ? "Renovation unlocked" : pendingChoiceCount > 0 ? "Reward choice ready" : "Property progress synced",
      statusNote: earned
        ? `${summary.title} is now visible on the property.`
        : pendingChoiceCount > 0
          ? "This grammar session is complete. The property is already fully rebuilt, and a reward choice is now waiting."
          : "This grammar session is complete. The property is already showing the highest unlocked renovation stage.",
      ...summary
    };
  }

  function defaultState() {
    return {
      stage: 0,
      owned: 2,
      sessions: 0,
      claimedRewardIds: [],
      lastClaimedRewardId: "",
      rewardProgressResetVersion: RP_REWARD_PROGRESS_RESET_VERSION,
      rewardProgressNeedsBaseline: false,
      rewardBaselineCompletedAttempts: 0,
      rewardBaselineHorseCount: 0,
      grammarSessions: 0,
      grammarSessionVersion: RP_GRAMMAR_SESSION_VERSION,
      grammarProgressResetVersion: RP_GRAMMAR_PROGRESS_RESET_VERSION,
      horses: [],
      arenaJumps: []
    };
  }

  function clampZone(x, y) {
    const activeZones = RP_ZONES.filter((zone) => Number(zone.minStage || 0) <= Number(S?.stage || 0));
    const zones = activeZones.length ? activeZones : RP_ZONES;
    for (const zone of zones) {
      if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
        return { x, y, zone: zone.n };
      }
    }
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const zone of zones) {
      const cx = Math.max(zone.x1, Math.min(zone.x2, x));
      const cy = Math.max(zone.y1, Math.min(zone.y2, y));
      const distance = ((cx - x) ** 2) + ((cy - y) ** 2);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { x: cx, y: cy, zone: zone.n };
      }
    }
    return best || { x: 84, y: 64, zone: "the right paddock" };
  }

  function getHorseSource(slug = "") {
    const horseMeta = getSpellingPaddockHorseMeta(slug);
    return horseMeta?.image || "";
  }

  function getVariantSheet(category = "") {
    return RP_VARIANT_SHEETS[String(category || "")] || null;
  }

  function getVariantItems(category = "") {
    return getVariantSheet(category)?.items || [];
  }

  function getVariantLabel(category = "", variantId = "") {
    return getVariantItems(category).find((item) => item.id === variantId)?.label || "";
  }

  function getHorseChoiceKey(category = "") {
    return `${String(category || "")}Choice`;
  }

  function getHorseVariant(horse, category = "") {
    if (!horse) {
      return null;
    }
    return getVariantItems(category).find((item) => item.id === horse[getHorseChoiceKey(category)]) || null;
  }

  function getHorseTackLabels(horse) {
    if (!horse) {
      return [];
    }
    return RP_TACK
      .filter((item) => Boolean(horse[item.k]))
      .map((item) => getHorseVariant(horse, item.k)?.label || item.label);
  }

  function getClaimedRewardIds() {
    ensureLoaded();
    return Array.isArray(S.claimedRewardIds)
      ? S.claimedRewardIds.map((value) => String(value || "")).filter((value) => RP_REWARD_BY_ID[value])
      : [];
  }

  function getRewardBaselineCompletedAttempts() {
    ensureLoaded();
    return Math.max(0, Number(S.rewardBaselineCompletedAttempts || 0) || 0);
  }

  function getRewardBaselineHorseCount() {
    ensureLoaded();
    return Math.max(0, Number(S.rewardBaselineHorseCount || 0) || 0);
  }

  function getClaimedRewardSet() {
    return new Set(getClaimedRewardIds());
  }

  function isRepeatableReward(rewardId = "") {
    return RP_REPEATABLE_REWARD_IDS.has(String(rewardId || ""));
  }

  function getRewardClaimCount(rewardId = "") {
    const normalizedRewardId = String(rewardId || "");
    return getClaimedRewardIds().filter((claimedRewardId) => claimedRewardId === normalizedRewardId).length;
  }

  function getMandatoryStageCount() {
    ensureLoaded();
    return Math.max(0, Math.min(RP_MANDATORY_REWARDS.length, getEffectiveRenovationSessionCount()));
  }

  function getOptionalRewardAllowance() {
    ensureLoaded();
    return Math.max(0, getEffectiveRenovationSessionCount() - RP_MANDATORY_REWARDS.length);
  }

  function getPendingRewardChoiceCount() {
    return Math.max(0, getOptionalRewardAllowance() - getClaimedRewardIds().length);
  }

  function getTrackRewardChoices(track = "") {
    return (RP_OPTIONAL_REWARD_TRACKS[String(track || "")] || [])
      .map((rewardId) => RP_REWARD_BY_ID[rewardId])
      .filter((reward) => reward && (isRepeatableReward(reward.id) || !hasClaimedReward(reward.id)));
  }

  function getUpcomingRewardChoices() {
    return ["tack", "property", "arena"]
      .flatMap((track) => getTrackRewardChoices(track));
  }

  function getAvailableRewardChoices() {
    if (getPendingRewardChoiceCount() <= 0) {
      return [];
    }
    return getUpcomingRewardChoices();
  }

  function hasClaimedReward(rewardId = "") {
    return getClaimedRewardSet().has(String(rewardId || ""));
  }

  function getTackInventoryCount(category = "") {
    const rewardId = RP_TACK_REWARD_BY_CATEGORY[String(category || "")];
    return rewardId ? getRewardClaimCount(rewardId) : 0;
  }

  function getTackInventorySummary(category = "") {
    const total = getTackInventoryCount(category);
    const fitted = S?.horses?.filter((horse) => Boolean(horse?.[category])).length || 0;
    const spare = Math.max(0, total - fitted);
    return { total, fitted, spare };
  }

  function canFitTack(horse, category = "") {
    if (!horse || !isTackUnlocked(category)) {
      return false;
    }
    if (horse[category]) {
      return true;
    }
    return getTackInventorySummary(category).spare > 0;
  }

  function ownedTack() {
    return RP_TACK.filter((item) => isTackUnlocked(item.k)).length;
  }

  function ownedJumpCount() {
    const arenaRewardCount = ["arena-lights", "arena-roof"].filter((rewardId) => hasClaimedReward(rewardId)).length;
    if (arenaRewardCount <= 0) {
      return 0;
    }
    if (arenaRewardCount === 1) {
      return Math.min(2, RP_JUMP_SHEET.items.length);
    }
    return RP_JUMP_SHEET.items.length;
  }

  function isTackUnlocked(category = "") {
    return getTackInventoryCount(category) > 0;
  }

  function isJumpUnlocked(type = "") {
    const jumpIndex = RP_JUMP_SHEET.items.findIndex((item) => item.id === type);
    return jumpIndex >= 0 && jumpIndex < ownedJumpCount();
  }

  function getTackDisplayVariant(category = "", horse = null) {
    const selectedVariantId = horse?.[getHorseChoiceKey(category)] || "";
    return getVariantItems(category).find((item) => item.id === selectedVariantId) || getVariantItems(category)[0] || null;
  }

  function getRewardMilestoneMessage() {
    const mandatoryCompleted = getMandatoryStageCount();
    if (mandatoryCompleted < RP_MANDATORY_REWARDS.length) {
      const nextStage = RP_MANDATORY_REWARDS[mandatoryCompleted];
      const remaining = RP_MANDATORY_REWARDS.length - mandatoryCompleted;
      return remaining === RP_MANDATORY_REWARDS.length
        ? `The property starts unrenovated. The first completed grammar or Practice session unlocks ${nextStage.label.toLowerCase()}.`
        : `The next completed grammar or Practice session unlocks ${nextStage.label.toLowerCase()} as ${nextStage.badge.toLowerCase()}.`;
    }
    const pendingChoices = getPendingRewardChoiceCount();
    if (pendingChoices > 0) {
      return pendingChoices === 1
        ? "A reward choice is waiting. Pick one reward. Tack items can be chosen again any time to outfit more horses."
        : `${pendingChoices} reward choices are waiting. Pick one reward each time you complete a session, and keep adding tack as your horse team grows.`;
    }
    const upcomingChoices = getUpcomingRewardChoices();
    if (!upcomingChoices.length) {
      return "The current reward ladder is fully claimed. Keep completing sessions to build skill and collect horses.";
    }
    return "The next completed grammar or Practice session will unlock another reward choice. Tack items can be chosen again, and any unclaimed property or arena upgrades stay available.";
  }

  function getRewardClaimMessage(rewardId = "") {
    const reward = RP_REWARD_BY_ID[String(rewardId || "")];
    if (!reward) {
      return "Reward claimed.";
    }
    if (reward.track === "tack") {
      const count = getRewardClaimCount(reward.id);
      return count === 1
        ? `${reward.label} are now available in the tack room.`
        : `${reward.label} have been added again. Collected so far: ${count}.`;
    }
    if (reward.track === "arena") {
      return `${reward.label} have been added to the reward ladder.`;
    }
    if (reward.id === "riders") {
      return "The rider team is now waiting beside the paddock.";
    }
    if (reward.id === "horse-float") {
      return "The horse float is now parked beside the shed.";
    }
    if (reward.id === "horse-wash-bay") {
      return "The horse wash bay is now built beside the stables.";
    }
    return `${reward.label} has been added to the property reward ladder.`;
  }

  function getRewardLadderSnapshot() {
    const claimed = getClaimedRewardSet();
    const mandatoryCompleted = getMandatoryStageCount();
    const entries = [
      ...RP_MANDATORY_REWARDS.map((reward, index) => ({
        ...reward,
        locked: index >= mandatoryCompleted,
        statusLabel: reward.badge
      })),
      ...RP_OPTIONAL_REWARDS.map((reward) => ({
        ...reward,
        locked: isRepeatableReward(reward.id) ? getRewardClaimCount(reward.id) <= 0 : !claimed.has(reward.id),
        statusLabel: isRepeatableReward(reward.id)
          ? `${getRewardClaimCount(reward.id)} collected`
          : claimed.has(reward.id) ? "Unlocked" : "Locked"
      }))
    ];
    return {
      sessionCount: getEffectiveRenovationSessionCount(),
      mandatoryCompleted,
      pendingChoiceCount: getPendingRewardChoiceCount(),
      availableChoices: getAvailableRewardChoices(),
      upcomingChoices: getUpcomingRewardChoices(),
      entries
    };
  }

  function claimReward(rewardId = "") {
    ensureLoaded();
    const availableChoices = getAvailableRewardChoices();
    const reward = availableChoices.find((entry) => entry.id === String(rewardId || ""));
    if (!reward) {
      return null;
    }
    const nextClaimedIds = [...getClaimedRewardIds(), reward.id];
    S.claimedRewardIds = nextClaimedIds;
    S.lastClaimedRewardId = reward.id;
    save();
    if (root?.isConnected) {
      render();
    }
    return {
      reward,
      message: getRewardClaimMessage(reward.id)
    };
  }

  function getWorldRewardProps() {
    const props = [];
    if (hasClaimedReward("horse-wash-bay")) {
      props.push({
        id: "horse-wash-bay",
        kind: "image",
        src: RP_ASSETS.horseWashBay,
        label: "Horse wash bay",
        x: 84.2,
        y: 61.8,
        width: 15.8,
        tilt: -1.5
      });
    }
    if (hasClaimedReward("horse-float")) {
      props.push({
        id: "horse-float",
        kind: "image",
        src: RP_ASSETS.horseFloat,
        label: "Horse float",
        x: 90.5,
        y: 76.4,
        width: 17.2,
        tilt: -1.5
      });
    }
    if (hasClaimedReward("riders")) {
      const riderSheet = getVariantSheet("rider");
      const riderPlacements = [
        { riderId: "sarah", x: 73.8, y: 72.8, width: 3.8 },
        { riderId: "aisha", x: 77.2, y: 72.6, width: 4.1 },
        { riderId: "chloe", x: 80.8, y: 72.7, width: 3.7 },
        { riderId: "max", x: 84.2, y: 72.5, width: 3.7 },
        { riderId: "leo", x: 87.6, y: 72.6, width: 4 }
      ];
      riderPlacements.forEach((placement) => {
        const rider = riderSheet?.items?.find((entry) => entry.id === placement.riderId);
        if (!rider || !riderSheet) {
          return;
        }
        props.push({
          id: `rider-${placement.riderId}`,
          kind: "sprite",
          sheet: riderSheet,
          item: rider,
          label: rider.label,
          x: placement.x,
          y: placement.y,
          width: placement.width
        });
      });
    }
    return props;
  }

  function buildRackArtMarkup(category = "", horse = null) {
    if (category === "saddle") {
      return `<span class="rp-rack-art rp-rack-art--image"><img src="${escapeHtml(RP_ASSETS.saddle)}" alt="Saddle reward" loading="lazy" /></span>`;
    }
    const variant = getTackDisplayVariant(category, horse);
    const sheet = getVariantSheet(category);
    if (!variant || !sheet) {
      return "";
    }
    return buildSpriteCropMarkup(sheet, variant, variant.label, "rp-sprite-crop rp-sprite-crop--rack");
  }

  function normaliseArenaJump(rawJump, index = 0) {
    const fallback = RP_JUMP_SHEET.items.find((item) => item.id === rawJump?.type) || RP_JUMP_SHEET.items[index % RP_JUMP_SHEET.items.length] || RP_JUMP_SHEET.items[0];
    return {
      id: String(rawJump?.id || `arena-jump-${index + 1}`),
      type: fallback.id,
      x: Math.max(8, Math.min(92, Number(rawJump?.x ?? 50) || 50)),
      y: Math.max(20, Math.min(90, Number(rawJump?.y ?? 62) || 62)),
      scale: Math.max(0.8, Math.min(1.35, Number(rawJump?.scale ?? 1) || 1))
    };
  }

  function normaliseHorse(rawHorse, index = 0) {
    const fallbackMeta = getSpellingPaddockHorseMeta(rawHorse?.slug || rawHorse?.id || "");
    const spot = START_SPOTS[index % START_SPOTS.length];
    const clamped = clampZone(
      Number(rawHorse?.x ?? spot[0]) || spot[0],
      Number(rawHorse?.y ?? spot[1]) || spot[1]
    );
    const horse = {
      id: String(rawHorse?.id || `rp-horse-${index + 1}`),
      slug: String(rawHorse?.slug || fallbackMeta?.id || ""),
      name: String(rawHorse?.name || fallbackMeta?.name || `Horse ${index + 1}`),
      breed: String(rawHorse?.breed || fallbackMeta?.label || "Horse"),
      src: String(rawHorse?.src || getHorseSource(rawHorse?.slug || rawHorse?.id || fallbackMeta?.id || "")),
      x: clamped.x,
      y: clamped.y,
      zone: clamped.zone,
      stabled: Boolean(rawHorse?.stabled)
    };
    RP_TACK.forEach((item) => {
      horse[item.k] = Boolean(rawHorse?.[item.k]);
    });
    RP_TACK_VARIANT_KEYS.forEach((category) => {
      const choiceKey = getHorseChoiceKey(category);
      const availableIds = new Set(getVariantItems(category).map((item) => item.id));
      const rawChoice = String(rawHorse?.[choiceKey] || "");
      horse[choiceKey] = availableIds.has(rawChoice) ? rawChoice : "";
      if (horse[category] && !horse[choiceKey] && getVariantItems(category).length) {
        horse[choiceKey] = getVariantItems(category)[0].id;
      }
    });
    return horse;
  }

  function load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(RP_STORAGE_KEY) || "null");
    } catch (error) {
      saved = null;
    }
    const base = saved && typeof saved === "object" ? saved : defaultState();
    const grammarSessionVersion = Math.max(0, Number(base.grammarSessionVersion || 0) || 0);
    const grammarProgressResetVersion = Math.max(0, Number(base.grammarProgressResetVersion || 0) || 0);
    const shouldResetGrammarProgress = grammarProgressResetVersion !== RP_GRAMMAR_PROGRESS_RESET_VERSION;
    const rewardProgressResetVersion = Math.max(0, Number(base.rewardProgressResetVersion || 0) || 0);
    const shouldResetRewardProgress = rewardProgressResetVersion !== RP_REWARD_PROGRESS_RESET_VERSION;
    const rawGrammarSessions = shouldResetGrammarProgress
      ? 0
      : Math.max(0, Number(base.grammarSessions || 0) || 0);
    const grammarSessions = shouldResetGrammarProgress
      ? 0
      : grammarSessionVersion >= RP_GRAMMAR_SESSION_VERSION
        ? rawGrammarSessions
        : getCompletedGrammarRewardSessions(rawGrammarSessions);
    const claimedRewardIds = Array.isArray(base.claimedRewardIds)
      ? base.claimedRewardIds.map((value) => String(value || "")).filter((value) => RP_REWARD_BY_ID[value])
      : [];
    const savedSessions = Math.max(0, Number(base.sessions || 0) || 0);
    S = {
      stage: shouldResetGrammarProgress
        ? 0
        : getDerivedStage(getEffectiveRenovationSessionCount(grammarSessions, savedSessions)),
      owned: Math.max(2, Math.min(RP_TACK.length, Number(base.owned || 2) || 2)),
      sessions: savedSessions,
      claimedRewardIds,
      lastClaimedRewardId: claimedRewardIds.includes(String(base.lastClaimedRewardId || ""))
        ? String(base.lastClaimedRewardId || "")
        : "",
      rewardProgressResetVersion: RP_REWARD_PROGRESS_RESET_VERSION,
      rewardProgressNeedsBaseline: shouldResetRewardProgress,
      rewardBaselineCompletedAttempts: Math.max(0, Number(base.rewardBaselineCompletedAttempts || 0) || 0),
      rewardBaselineHorseCount: Math.max(0, Number(base.rewardBaselineHorseCount || 0) || 0),
      grammarSessions,
      grammarSessionVersion: RP_GRAMMAR_SESSION_VERSION,
      grammarProgressResetVersion: RP_GRAMMAR_PROGRESS_RESET_VERSION,
      horses: Array.isArray(base.horses) ? base.horses.map((horse, index) => normaliseHorse(horse, index)) : [],
      arenaJumps: Array.isArray(base.arenaJumps) ? base.arenaJumps.map((jump, index) => normaliseArenaJump(jump, index)) : []
    };
  }

  function ensureLoaded() {
    if (!S) {
      load();
    }
  }

  function save() {
    ensureLoaded();
    try {
      localStorage.setItem(RP_STORAGE_KEY, JSON.stringify(S));
    } catch (error) {
      // Ignore storage write failures.
    }
  }

  function setGrammarSessions(doneCount = 0) {
    ensureLoaded();
    const nextGrammarSessions = Math.max(0, Number(doneCount || 0) || 0);
    const changed = nextGrammarSessions !== S.grammarSessions;
    const previousStage = S.stage;
    S.grammarSessions = nextGrammarSessions;
    S.grammarSessionVersion = RP_GRAMMAR_SESSION_VERSION;
    syncVisibleStage();
    if (changed || S.stage !== previousStage) {
      save();
      if (root?.isConnected) {
        render();
      }
    }
  }

  function byId(id) {
    ensureLoaded();
    return S.horses.find((horse) => horse.id === id) || null;
  }

  function nextHorsePosition(index = 0) {
    const spot = START_SPOTS[index % START_SPOTS.length];
    return clampZone(spot[0] + (Math.random() * 4 - 2), spot[1] + (Math.random() * 3 - 1.5));
  }

  function getJumpMeta(type = "") {
    return RP_JUMP_SHEET.items.find((item) => item.id === type) || RP_JUMP_SHEET.items[0] || null;
  }

  function arenaJumpById(jumpId = "") {
    ensureLoaded();
    return S.arenaJumps.find((jump) => jump.id === jumpId) || null;
  }

  function buildHorse(slug, name, breed) {
    const horseMeta = getSpellingPaddockHorseMeta(slug) || null;
    const position = nextHorsePosition(S.horses.length);
    const horse = {
      id: `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      slug: String(slug || horseMeta?.id || ""),
      name: String(name || horseMeta?.name || "Horse"),
      breed: String(breed || horseMeta?.label || "Horse"),
      src: String(horseMeta?.image || getHorseSource(slug)),
      x: position.x,
      y: position.y,
      zone: position.zone,
      stabled: false
    };
    RP_TACK.forEach((item) => {
      horse[item.k] = false;
    });
    RP_TACK_VARIANT_KEYS.forEach((category) => {
      horse[getHorseChoiceKey(category)] = "";
    });
    return horse;
  }

  function ensureHorse(slug, name, breed) {
    ensureLoaded();
    const existingHorse = S.horses.find((horse) => horse.slug === slug);
    if (existingHorse) {
      if (!existingHorse.src) {
        existingHorse.src = getHorseSource(slug);
      }
      return { horse: existingHorse, added: false };
    }
    const nextHorse = buildHorse(slug, name, breed);
    S.horses.push(nextHorse);
    return { horse: nextHorse, added: true };
  }

  function nextRosterHorse() {
    ensureLoaded();
    return SPELLING_PADDOCK_HORSES.find((horse) => !S.horses.some((ownedHorse) => ownedHorse.slug === horse.id)) || SPELLING_PADDOCK_HORSES[0];
  }

  function syncPracticeState(subject) {
    ensureLoaded();
    if (!subject) {
      return;
    }
    currentPracticeSubject = subject;
    const spelling = getSubjectSpellingState(subject);
    const completedAttempts = Array.isArray(spelling.completedAttempts) ? spelling.completedAttempts.length : 0;
    const ownedHorseMeta = getSpellingOwnedHorseMeta(spelling);
    const shouldResetRewardProgress = Boolean(S.rewardProgressNeedsBaseline);
    let changed = false;
    if (shouldResetRewardProgress) {
      S.rewardProgressResetVersion = RP_REWARD_PROGRESS_RESET_VERSION;
      S.rewardProgressNeedsBaseline = false;
      S.rewardBaselineCompletedAttempts = 0;
      S.rewardBaselineHorseCount = 0;
      changed = true;
    }
    if (S.rewardBaselineCompletedAttempts || S.rewardBaselineHorseCount) {
      S.rewardBaselineCompletedAttempts = 0;
      S.rewardBaselineHorseCount = 0;
      changed = true;
    }
    ownedHorseMeta.forEach((horseMeta) => {
      const result = ensureHorse(horseMeta.id, horseMeta.name, horseMeta.label);
      changed = changed || result.added;
    });
    const rewardCompletedCount = completedAttempts;
    if (rewardCompletedCount !== S.sessions) {
      S.sessions = rewardCompletedCount;
      changed = true;
    }
    const derivedStage = getDerivedStage(getEffectiveRenovationSessionCount(S.grammarSessions, rewardCompletedCount));
    if (derivedStage !== S.stage) {
      S.stage = derivedStage;
      changed = true;
    }
    if (changed) {
      save();
    }
  }

  function addHorse(slug, name, breed) {
    ensureLoaded();
    const result = ensureHorse(slug, name, breed);
    if (result.added) {
      sel = result.horse.id;
      save();
    } else if (S.horses.length) {
      sel = result.horse.id;
    }
    render();
    return result.horse;
  }

  function renovate() {
    ensureLoaded();
    const nextStage = Math.min(RP_STAGES.length - 1, S.stage + 1);
    if (nextStage !== S.stage) {
      S.stage = nextStage;
      save();
    }
    render();
  }

  function reset(options = {}) {
    const preservePracticeBaseline = options.preservePracticeBaseline !== false;
    S = {
      ...defaultState(),
      rewardProgressNeedsBaseline: preservePracticeBaseline
    };
    sel = null;
    view = "property";
    activeTackCategory = "saddle";
    selectedArenaJumpId = "";
    zoom = 1;
    px = 0;
    py = 0;
    if (preservePracticeBaseline && currentPracticeSubject) {
      syncPracticeState(currentPracticeSubject);
    } else {
      save();
    }
    render();
  }

  function limit() {
    return (zoom - 1) * 50;
  }

  function clampPan() {
    const panLimit = limit();
    px = Math.max(-panLimit, Math.min(panLimit, px));
    py = Math.max(-panLimit, Math.min(panLimit, py));
  }

  function buildSpriteCropMarkup(sheet, item, label, className = "rp-sprite-crop") {
    if (!sheet || !item) {
      return "";
    }
    return `
      <span
        class="${className}"
        style="--sheet-width:${sheet.width}px;--sheet-height:${sheet.height}px;--sprite-x:${item.x}px;--sprite-y:${item.y}px;--sprite-width:${item.w}px;--sprite-height:${item.h}px;"
      >
        <img src="${escapeHtml(sheet.src)}" alt="${escapeHtml(label || item.label || "")}" loading="lazy" />
      </span>
    `;
  }

  function addArenaJump(type = "") {
    const jumpMeta = getJumpMeta(type);
    if (!jumpMeta || !isJumpUnlocked(type)) {
      return;
    }
    const existingJump = S.arenaJumps.find((jump) => jump.type === type);
    if (existingJump) {
      selectedArenaJumpId = existingJump.id;
      view = "arena";
      render();
      return;
    }
    const nextJump = normaliseArenaJump({
      id: `arena-jump-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      type: jumpMeta.id,
      x: 52,
      y: 62,
      scale: 1
    }, S.arenaJumps.length);
    S.arenaJumps.push(nextJump);
    selectedArenaJumpId = nextJump.id;
    view = "arena";
    save();
    render();
  }

  function removeSelectedArenaJump() {
    if (!selectedArenaJumpId) {
      return;
    }
    const nextArenaJumps = S.arenaJumps.filter((jump) => jump.id !== selectedArenaJumpId);
    if (nextArenaJumps.length === S.arenaJumps.length) {
      return;
    }
    S.arenaJumps = nextArenaJumps;
    selectedArenaJumpId = "";
    save();
    render();
  }

  function toggleTack(category = "") {
    const horse = sel ? byId(sel) : null;
    if (!horse || !isTackUnlocked(category)) {
      return;
    }
    if (!horse[category] && !canFitTack(horse, category)) {
      return;
    }
    if (getVariantSheet(category)) {
      activeTackCategory = category;
      view = "tack";
      render();
      return;
    }
    horse[category] = !horse[category];
    save();
    render();
  }

  function applyVariant(category = "", variantId = "") {
    const horse = sel ? byId(sel) : null;
    if (!horse || !isTackUnlocked(category)) {
      return;
    }
    if (!horse[category] && !canFitTack(horse, category)) {
      return;
    }
    const variant = getVariantItems(category).find((item) => item.id === variantId);
    if (!variant) {
      return;
    }
    const choiceKey = getHorseChoiceKey(category);
    if (horse[category] && horse[choiceKey] === variantId) {
      horse[category] = false;
      horse[choiceKey] = "";
    } else {
      horse[category] = true;
      horse[choiceKey] = variantId;
    }
    activeTackCategory = category;
    save();
    render();
  }

  function clearVariant(category = "") {
    const horse = sel ? byId(sel) : null;
    if (!horse || !isTackUnlocked(category)) {
      return;
    }
    horse[category] = false;
    horse[getHorseChoiceKey(category)] = "";
    save();
    render();
  }

  function render() {
    if (!root || !root.isConnected) {
      return;
    }
    ensureLoaded();
    const stage = RP_STAGES[Math.min(S.stage, RP_STAGES.length - 1)];
    const selectedHorse = sel ? byId(sel) : null;
    const query = (selector) => root.querySelector(selector);

    root.querySelectorAll("[data-rp-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.rpPanel !== view;
    });
    root.querySelectorAll(".rp-tab").forEach((tab) => {
      tab.classList.toggle("is-on", tab.dataset.rpView === view);
    });

    query(".rp-world").style.transform = `scale(${zoom}) translate(${px}%,${py}%)`;
    query(".rp-bg").style.backgroundImage = `url('${stage[0]}')`;
    query(".rp-occluder").style.backgroundImage = `url('${stage[0]}')`;
    query(".rp-hud-stage").textContent = stage[1];
    query(".rp-hud-count").textContent = `${S.horses.length} horse${S.horses.length === 1 ? "" : "s"}`;
    query(".rp-zval").textContent = `${Math.round(zoom * 100)}%`;
    query(".rp-stage-note").textContent = stage[2];
    root.querySelectorAll(".rp-pips i").forEach((pip, index) => {
      pip.classList.toggle("is-on", index < S.stage);
    });

    const world = query(".rp-world");
    world.querySelectorAll(".rp-horse,.rp-hotspot,.rp-world-prop").forEach((node) => node.remove());
    const occluder = query(".rp-occluder");
    getWorldRewardProps().forEach((prop) => {
      const propElement = document.createElement("div");
      propElement.className = `rp-world-prop rp-world-prop--${prop.kind}`;
      propElement.style.cssText = `left:${prop.x}%;top:${prop.y}%;width:${prop.width}%;z-index:${8 + Math.round(prop.y)};--prop-tilt:${prop.tilt || 0}deg;`;
      propElement.setAttribute("aria-hidden", "true");
      propElement.innerHTML = prop.kind === "sprite"
        ? buildSpriteCropMarkup(prop.sheet, prop.item, prop.label, "rp-sprite-crop rp-sprite-crop--world")
        : `<img src="${escapeHtml(prop.src)}" alt="${escapeHtml(prop.label || "")}" loading="lazy" />`;
      world.insertBefore(propElement, occluder);
    });
    S.horses.filter((horse) => !horse.stabled).forEach((horse) => {
      const depth = 0.55 + (((horse.y - 44) / 48) * 0.8);
      const tags = RP_TACK.filter((item) => horse[item.k]).map((item) => item.label);
      const horseElement = document.createElement("div");
      horseElement.className = "rp-horse";
      horseElement.dataset.id = horse.id;
      horseElement.style.cssText = `left:${horse.x}%;top:${horse.y}%;width:${(6.4 * depth).toFixed(2)}%;z-index:${10 + Math.round(horse.y)}`;
      horseElement.innerHTML = `<div class="rp-sprite" style="background-image:url('${horse.src}')"></div>${tags.length ? `<div class="rp-badge">${escapeHtml(tags.join(" · "))}</div>` : ""}${horse.id === sel ? '<div class="rp-ring"></div>' : ""}`;
      world.insertBefore(horseElement, occluder);
    });

    RP_HOTSPOTS.forEach((hotspot) => {
      const hotspotButton = document.createElement("button");
      hotspotButton.className = "rp-hotspot";
      hotspotButton.dataset.rpView = hotspot.view;
      hotspotButton.style.cssText = `left:${hotspot.x}%;top:${hotspot.y}%`;
      hotspotButton.innerHTML = `<span class="rp-dot" style="background:${hotspot.color}"></span><span class="rp-tag">${hotspot.label}</span>`;
      world.appendChild(hotspotButton);
    });

    const inside = S.horses.filter((horse) => horse.stabled);
    query(".rp-inside").textContent = `${inside.length} horse${inside.length === 1 ? "" : "s"}`;
    const totalStalls = Math.max(6, Math.ceil((inside.length + 1) / 4) * 4);
    let stallsMarkup = "";
    for (let index = 0; index < totalStalls; index += 1) {
      const horse = inside[index];
      stallsMarkup += `<div class="rp-stall${horse ? (horse.id === sel ? " is-on" : "") : " is-empty"}" data-id="${horse ? escapeHtml(horse.id) : ""}">${horse ? `<div class="rp-stall-horse" style="background-image:url('${horse.src}')"></div>` : ""}<div class="rp-rails"></div><div class="rp-rail-top"></div><div class="rp-rail-bot"></div><div class="rp-door"></div><div class="rp-plaque">${escapeHtml(horse ? horse.name : `No. ${index + 1}`)}</div></div>`;
    }
    query(".rp-stalls").innerHTML = stallsMarkup;

    query(".rp-tackhint").textContent = selectedHorse
      ? `Fitting tack to ${selectedHorse.name}. Keep collecting tack rewards after the final renovation so every horse can be outfitted.`
      : getRewardMilestoneMessage();
    query(".rp-tackroom").style.backgroundImage = `url('${RP_ASSETS.tackRoom}')`;
    query(".rp-tackroom").innerHTML = RP_TACK.map((item) => {
      const unlocked = isTackUnlocked(item.k);
      const active = selectedHorse ? Boolean(selectedHorse[item.k]) : false;
      const variantLabel = getTackDisplayVariant(item.k, selectedHorse)?.label || "";
      const inventory = getTackInventorySummary(item.k);
      const lockedLabel = "Choose on reward ladder";
      const readyLabel = `${inventory.total} collected${inventory.fitted ? ` · ${inventory.fitted} fitted` : ""}${inventory.spare ? ` · ${inventory.spare} spare` : ""}`;
      return `
        <button
          type="button"
          class="rp-rack${active ? " is-on" : ""}${activeTackCategory === item.k ? " is-focus" : ""}${unlocked ? "" : " is-locked"}"
          data-k="${escapeHtml(item.k)}"
          style="--rack-x:${item.x}%;--rack-y:${item.y}%;--rack-width:${item.w}%;--rack-height:${item.h}%;--rack-rotate:${item.rotate}deg;"
          aria-label="${escapeHtml(item.label)}"
        >
          <span class="rp-rack-hit"></span>
          ${unlocked ? buildRackArtMarkup(item.k, selectedHorse) : ""}
          <span class="rp-rack-meta">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(unlocked ? (active && variantLabel ? `${variantLabel} · ${readyLabel}` : active ? `Fitted · ${readyLabel}` : readyLabel) : lockedLabel)}</span>
          </span>
        </button>
      `;
    }).join("");
    const tackVariants = getVariantItems(activeTackCategory);
    const activeTackItemLabel = RP_TACK.find((item) => item.k === activeTackCategory)?.label || "This tack";
    const activeTackInventory = getTackInventorySummary(activeTackCategory);
    const noSpareActiveTack = Boolean(
      selectedHorse
      && !selectedHorse[activeTackCategory]
      && isTackUnlocked(activeTackCategory)
      && !canFitTack(selectedHorse, activeTackCategory)
    );
    query(".rp-tackchoices").innerHTML = !selectedHorse
        ? `<div class="rp-choice-empty">Select a horse to open the tack tray.</div>`
        : !isTackUnlocked(activeTackCategory)
          ? `<div class="rp-choice-empty">${escapeHtml(`${activeTackItemLabel} is still locked on the reward ladder.`)}</div>`
          : noSpareActiveTack
            ? `<div class="rp-choice-empty">${escapeHtml(`${activeTackItemLabel} is already fitted to ${activeTackInventory.fitted} horse${activeTackInventory.fitted === 1 ? "" : "s"}. Clear one or choose this reward again to fit ${selectedHorse.name}.`)}</div>`
          : tackVariants.length
        ? `
          <div class="rp-choice-head">
            <strong>${escapeHtml(activeTackItemLabel)}</strong>
            <span>Choose one style for this horse.</span>
          </div>
          <div class="rp-choice-grid">
            ${tackVariants.map((variant) => `
              <button type="button" class="rp-choice-card${selectedHorse[activeTackCategory] && selectedHorse[getHorseChoiceKey(activeTackCategory)] === variant.id ? " is-on" : ""}" data-rp-variant-category="${escapeHtml(activeTackCategory)}" data-rp-variant-id="${escapeHtml(variant.id)}">
                ${buildSpriteCropMarkup(getVariantSheet(activeTackCategory), variant, variant.label, "rp-sprite-crop rp-sprite-crop--card")}
                <span>${escapeHtml(variant.label)}</span>
              </button>
            `).join("")}
          </div>
          <button type="button" class="rp-btn rp-btn-ghost rp-choice-clear" data-rp-variant-clear="${escapeHtml(activeTackCategory)}">Clear ${escapeHtml(activeTackItemLabel)}</button>
        `
        : `<div class="rp-choice-empty">${escapeHtml(activeTackCategory === "saddle" ? "The saddle reward is live. Use the saddle row on the right to fit or remove it from the selected horse." : "Choose a rack to open the tack tray.")}</div>`;

    query(".rp-arena-stage").style.backgroundImage = `url('${RP_ASSETS.arena}')`;
    query(".rp-arena-canvas").innerHTML = S.arenaJumps.map((jump) => {
      const jumpMeta = getJumpMeta(jump.type);
      if (!jumpMeta) {
        return "";
      }
      return `
        <button
          type="button"
          class="rp-arena-jump${jump.id === selectedArenaJumpId ? " is-on" : ""}"
          data-rp-arena-jump="${escapeHtml(jump.id)}"
          style="left:${jump.x}%;top:${jump.y}%;width:${(jumpMeta.arenaWidth * jump.scale).toFixed(2)}%;"
          aria-label="${escapeHtml(jumpMeta.label)}"
        >
          ${buildSpriteCropMarkup(RP_JUMP_SHEET, jumpMeta, jumpMeta.label, "rp-sprite-crop rp-sprite-crop--jump")}
        </button>
      `;
    }).join("");
    query(".rp-arenahint").textContent = ownedJumpCount()
        ? `${ownedJumpCount()} jump reward${ownedJumpCount() === 1 ? "" : "s"} unlocked. Add each jump once, then drag it anywhere in the arena.`
        : getRewardMilestoneMessage();
    query(".rp-arena-library").innerHTML = RP_JUMP_SHEET.items.map((jumpMeta, index) => {
      const unlocked = index < ownedJumpCount();
      const added = S.arenaJumps.some((jump) => jump.type === jumpMeta.id);
      return `
        <button type="button" class="rp-jumplib${unlocked ? "" : " is-locked"}${added ? " is-added" : ""}" ${unlocked ? `data-rp-jump-type="${escapeHtml(jumpMeta.id)}"` : ""}>
          ${buildSpriteCropMarkup(RP_JUMP_SHEET, jumpMeta, jumpMeta.label, "rp-sprite-crop rp-sprite-crop--library")}
          <span>${escapeHtml(jumpMeta.label)}</span>
          <small>${escapeHtml(unlocked ? (added ? "Already in arena" : "Add to arena") : `Reward ${index + 1}`)}</small>
        </button>
      `;
    }).join("");
    const removeButton = query("[data-rp='remove-jump']");
    if (removeButton) {
      removeButton.disabled = !selectedArenaJumpId;
    }

    query(".rp-sel").hidden = !selectedHorse;
    query(".rp-empty").hidden = Boolean(selectedHorse);
    if (selectedHorse) {
      query(".rp-sel-thumb").style.backgroundImage = `url('${selectedHorse.src}')`;
      query(".rp-sel-name").textContent = selectedHorse.name;
      query(".rp-sel-breed").textContent = selectedHorse.breed;
      query(".rp-sel-where").textContent = selectedHorse.stabled ? "In the stables" : `Out in ${selectedHorse.zone || "the paddock"}`;
      query("[data-rp='stable-toggle']").textContent = selectedHorse.stabled ? "Bring out to the property" : "Send to the stables";
      query(".rp-tackrows").innerHTML = RP_TACK.map((item) => {
        const unlocked = isTackUnlocked(item.k);
        const active = Boolean(selectedHorse[item.k]);
        const variantLabel = getVariantLabel(item.k, selectedHorse[getHorseChoiceKey(item.k)] || "");
        const inventory = getTackInventorySummary(item.k);
        const statusLabel = !unlocked
          ? "Locked"
          : active && variantLabel
            ? `${variantLabel} · ${inventory.total} collected`
            : active
              ? `Fitted · ${inventory.total} collected`
              : inventory.spare
                ? `${inventory.spare} spare`
                : "All fitted";
        return `<button class="rp-row${active ? " is-on" : ""}${activeTackCategory === item.k ? " is-focus" : ""}${unlocked ? "" : " is-locked"}" data-k="${escapeHtml(item.k)}"><span>${escapeHtml(item.label)}</span><span class="rp-tag2">${escapeHtml(statusLabel)}</span></button>`;
      }).join("");
      query(".rp-choice-summary").innerHTML = getHorseTackLabels(selectedHorse).length
        ? `<div class="rp-pill-row">${getHorseTackLabels(selectedHorse).map((label) => `<span class="rp-pill">${escapeHtml(label)}</span>`).join("")}</div>`
        : `<div class="rp-choice-empty rp-choice-empty--inline">No tack fitted yet.</div>`;
    }

    query(".rp-chips").innerHTML = S.horses.map((horse) => `<button class="rp-chip${horse.id === sel ? " is-on" : ""}" data-id="${escapeHtml(horse.id)}">${escapeHtml(horse.name)}</button>`).join("");
    query(".rp-foot").textContent = view === "property"
      ? "Drag a horse to move it. Drop it below the front wall to stand behind the fence. Chosen property rewards now appear out in the paddock scene."
      : view === "stable"
        ? "Horses sent back from the property stand in their stall with their plaque below."
        : view === "tack"
          ? "Claim tack rewards again as needed, then use the tack room to fit that collected gear to a selected horse."
          : "Arena rewards unlock jump access here. Add unlocked jumps once, then drag them around the arena to build the course.";
  }

  function bind() {
    if (!root || root.dataset.rpBound === "true") {
      return;
    }
    root.dataset.rpBound = "true";
    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-rp-view],[data-rp],.rp-rack,.rp-row,.rp-chip,.rp-stall,[data-rp-variant-id],[data-rp-variant-clear],[data-rp-jump-type],[data-rp-arena-jump]");
      if (!target || !root.contains(target)) {
        return;
      }
      if (target.dataset.rpView) {
        view = target.dataset.rpView;
        render();
        return;
      }
      if (target.dataset.rpVariantId) {
        applyVariant(target.dataset.rpVariantCategory || "", target.dataset.rpVariantId || "");
        return;
      }
      if (target.dataset.rpVariantClear) {
        clearVariant(target.dataset.rpVariantClear || "");
        return;
      }
      if (target.dataset.rpJumpType) {
        addArenaJump(target.dataset.rpJumpType || "");
        return;
      }
      if (target.dataset.rpArenaJump) {
        selectedArenaJumpId = target.dataset.rpArenaJump || "";
        render();
        return;
      }
      if (target.classList.contains("rp-rack") || target.classList.contains("rp-row")) {
        toggleTack(target.dataset.k || "");
        return;
      }
      if (target.classList.contains("rp-chip")) {
        sel = target.dataset.id || null;
        render();
        return;
      }
      if (target.classList.contains("rp-stall")) {
        if (target.dataset.id) {
          sel = target.dataset.id;
          render();
        }
        return;
      }

      const action = target.dataset.rp;
      if (action === "renovate") {
        renovate();
        return;
      }
      if (action === "reset") {
        reset();
        return;
      }
      if (action === "remove-jump") {
        removeSelectedArenaJump();
        return;
      }
      if (action === "deselect") {
        sel = null;
        render();
        return;
      }
      if (action === "zoom-in") {
        zoom = Math.min(3.2, zoom + 0.35);
        clampPan();
        render();
        return;
      }
      if (action === "zoom-out") {
        zoom = Math.max(1, zoom - 0.35);
        clampPan();
        render();
        return;
      }
      if (action === "stable-toggle") {
        const horse = byId(sel);
        if (!horse) {
          return;
        }
        horse.stabled = !horse.stabled;
        if (!horse.stabled) {
          const position = clampZone(84, 64);
          horse.x = position.x;
          horse.y = position.y;
          horse.zone = position.zone;
        }
        save();
        render();
        return;
      }
      if (action === "session") {
        const nextHorse = nextRosterHorse();
        addHorse(nextHorse.id, nextHorse.name, nextHorse.label);
      }
    });

    const stage = root.querySelector(".rp-stage");
    stage?.addEventListener("wheel", (event) => {
      event.preventDefault();
      zoom = Math.max(1, Math.min(3.2, zoom - (event.deltaY * 0.0016)));
      clampPan();
      render();
    }, { passive: false });

    stage?.addEventListener("pointerdown", (event) => {
      const horse = event.target.closest(".rp-horse");
      let shouldCapture = false;
      if (horse) {
        drag = { kind: "horse", id: horse.dataset.id || "" };
        sel = horse.dataset.id || null;
        render();
        shouldCapture = true;
      } else if (!event.target.closest(".rp-hotspot,.rp-zoom,.rp-hud")) {
        pan = { x: event.clientX, y: event.clientY };
        shouldCapture = true;
      }
      if (shouldCapture) {
        try {
          stage.setPointerCapture(event.pointerId);
        } catch (error) {
          // Ignore pointer capture failures.
        }
      }
    });

    stage?.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      if (drag?.kind === "horse") {
        const cx = (((event.clientX - rect.left) / rect.width) - 0.5) / zoom + 0.5 - (px / 100);
        const cy = (((event.clientY - rect.top) / rect.height) - 0.5) / zoom + 0.5 - (py / 100);
        const clamped = clampZone(cx * 100, cy * 100);
        const horse = byId(drag.id);
        if (horse) {
          horse.x = clamped.x;
          horse.y = clamped.y;
          horse.zone = clamped.zone;
          horse.stabled = false;
          render();
        }
      } else if (pan) {
        px += (((event.clientX - pan.x) / rect.width) * 100) / zoom;
        py += (((event.clientY - pan.y) / rect.height) * 100) / zoom;
        pan = { x: event.clientX, y: event.clientY };
        clampPan();
        render();
      }
    });

    const arenaStage = root.querySelector(".rp-arena-stage");
    arenaStage?.addEventListener("pointerdown", (event) => {
      const jump = event.target.closest("[data-rp-arena-jump]");
      if (!jump) {
        selectedArenaJumpId = "";
        render();
        return;
      }
      drag = { kind: "jump", id: jump.dataset.rpArenaJump || "" };
      selectedArenaJumpId = jump.dataset.rpArenaJump || "";
      render();
      try {
        arenaStage.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore pointer capture failures.
      }
    });

    arenaStage?.addEventListener("pointermove", (event) => {
      if (drag?.kind !== "jump") {
        return;
      }
      const rect = arenaStage.getBoundingClientRect();
      const nextX = ((event.clientX - rect.left) / rect.width) * 100;
      const nextY = ((event.clientY - rect.top) / rect.height) * 100;
      const arenaJump = arenaJumpById(drag.id);
      if (!arenaJump) {
        return;
      }
      arenaJump.x = Math.max(8, Math.min(92, nextX));
      arenaJump.y = Math.max(24, Math.min(90, nextY));
      render();
    });

    const endPointer = () => {
      if (drag) {
        save();
      }
      drag = null;
      pan = null;
    };
    stage?.addEventListener("pointerup", endPointer);
    stage?.addEventListener("pointercancel", endPointer);
    stage?.addEventListener("pointerleave", endPointer);
    arenaStage?.addEventListener("pointerup", endPointer);
    arenaStage?.addEventListener("pointercancel", endPointer);
    arenaStage?.addEventListener("pointerleave", endPointer);
  }

  function mount(element, options = {}) {
    root = element;
    ensureLoaded();
    if (options.practiceSubject || options.subject) {
      syncPracticeState(options.practiceSubject || options.subject);
    }
    if (Number.isFinite(Number(options.grammarSessions))) {
      const nextGrammarSessions = Math.max(0, Number(options.grammarSessions || 0) || 0);
      S.grammarSessions = nextGrammarSessions;
      S.grammarSessionVersion = RP_GRAMMAR_SESSION_VERSION;
      syncVisibleStage();
    }
    bind();
    render();
  }

  return {
    mount,
    addHorse,
    claimReward,
    getGrammarUpgradeSummary,
    getRewardLadderSnapshot,
    renovate,
    reset,
    setGrammarSessions,
    syncPracticeState,
    get state() {
      ensureLoaded();
      return S;
    }
  };
})();

function mountRewardProperty(subject, host) {
  const root = host?.querySelector("#rp");
  if (!root) {
    return;
  }
  const practiceSubject = state.subjects.find((item) => item.id === "spelling") || subject;
  const grammarSubject = state.subjects.find((item) => item.id === "spelling") || subject;
  const grammarRewardSessions = getCompletedGrammarRewardSessions(getSubjectGrammarState(grammarSubject).done);
  if (RewardProperty.setGrammarSessions) {
    RewardProperty.setGrammarSessions(grammarRewardSessions);
  }
  if (RewardProperty.syncPracticeState) {
    RewardProperty.syncPracticeState(practiceSubject);
  }
  RewardProperty.mount(root, {
    subject: practiceSubject,
    practiceSubject,
    grammarSessions: grammarRewardSessions
  });
}

const GrammarProgram = createGrammarProgram({
  escapeHtml,
  persistSubjects,
  persistSubjectsDurably,
  getSubjectGrammarState,
  buildRewardPropertyMarkup,
  mountRewardProperty,
  RewardProperty,
  playGrammarPassageAudio,
  stopSharedAudioPlayback: stopListening
});

function buildSpellingRewardLadderMarkup(snapshot) {
  if (!snapshot) {
    return "";
  }
  return `
    <article class="ss-reward-ladder">
      <div class="ss-reward-ladder__head">
        <p class="eyebrow">Reward ladder</p>
        <p class="ss-reward-ladder__copy">The six renovation stages fill in as grammar or Practice sessions are completed. After the property is fully rebuilt, each new Practice session unlocks one reward choice. Tack can be chosen again for more horses, while riders, the horse float, the wash bay, and arena upgrades stay available until claimed.</p>
      </div>
      <div class="ss-reward-ladder__list">
        ${snapshot.entries.map((reward, index) => `
          <article class="ss-reward-ladder__row${reward.locked ? " is-locked" : ""}">
            <div class="ss-reward-ladder__marker">${escapeHtml(index < RP_MANDATORY_REWARDS.length ? String(index + 1) : "?")}</div>
            <div class="ss-reward-ladder__body">
              <strong>${escapeHtml(reward.label)}</strong>
              <span>${escapeHtml(reward.description)}</span>
            </div>
            <span class="ss-reward-ladder__status">${escapeHtml(reward.statusLabel)}</span>
          </article>
        `).join("")}
      </div>
    </article>
  `;
}

function buildSpellingRewardChoiceMarkup(snapshot) {
  if (!snapshot) {
    return "";
  }
  const mandatoryRemaining = Math.max(0, RP_MANDATORY_REWARDS.length - snapshot.mandatoryCompleted);
  if (mandatoryRemaining > 0) {
    const nextReward = RP_MANDATORY_REWARDS[snapshot.mandatoryCompleted];
    return `
      <article class="ss-reward-choice">
        <p class="eyebrow">Next renovation</p>
        <h5>${escapeHtml(nextReward?.label || "Next stage")}</h5>
        <p>${escapeHtml(nextReward?.description || "Keep completing sessions to rebuild the property.")}</p>
      </article>
    `;
  }
  if (snapshot.pendingChoiceCount > 0 && snapshot.availableChoices.length) {
    return `
      <article class="ss-reward-choice">
        <p class="eyebrow">Reward choice</p>
        <h5>${escapeHtml(snapshot.pendingChoiceCount > 1 ? `${snapshot.pendingChoiceCount} choices waiting` : "Choose your next reward")}</h5>
        <p>Choose one reward from the choices below. Tack items can be chosen again so there is enough gear for more horses.</p>
        <div class="ss-reward-choice__grid">
          ${snapshot.availableChoices.map((reward) => `
            <button type="button" class="ss-reward-choice__card" data-spelling-claim-reward="${escapeHtml(reward.id)}">
              <span class="ss-reward-choice__track">${escapeHtml(reward.track)}</span>
              <strong>${escapeHtml(reward.label)}</strong>
              <span>${escapeHtml(reward.description)}</span>
            </button>
          `).join("")}
        </div>
      </article>
    `;
  }
  if (snapshot.upcomingChoices.length) {
    return `
      <article class="ss-reward-choice">
        <p class="eyebrow">Next reward choice</p>
        <h5>Another choice unlocks next Practice session</h5>
        <p>The next completed Practice session will unlock one more choice. Tack items can be chosen again, and any unclaimed property or arena rewards will still be waiting.</p>
        <div class="ss-reward-choice__grid">
          ${snapshot.upcomingChoices.map((reward) => `
            <article class="ss-reward-choice__card is-static">
              <span class="ss-reward-choice__track">${escapeHtml(reward.track)}</span>
              <strong>${escapeHtml(reward.label)}</strong>
              <span>${escapeHtml(reward.description)}</span>
            </article>
          `).join("")}
        </div>
      </article>
    `;
  }
  return `
    <article class="ss-reward-choice">
      <p class="eyebrow">Reward choice</p>
      <h5>All current rewards claimed</h5>
      <p>Keep completing sessions to build skill and collect more horses. The current reward ladder is fully chosen.</p>
    </article>
  `;
}

function buildSpellingSurfaceTabs(activeTab) {
  const tabs = [
    { id: "session", label: "Session" },
    { id: "property", label: "Property" },
    { id: "progress", label: "Progress" }
  ];

  return `
    <div class="ss-surface-tabs" role="tablist" aria-label="Practice views">
      ${tabs
        .map(
          (tab) => `
            <button
              type="button"
              class="ss-surface-tab${tab.id === activeTab ? " is-active" : ""}"
              data-spelling-home-tab="${tab.id}"
            >
              ${escapeHtml(tab.label)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function buildSpellingSessionProgressCard(
  subject,
  spelling,
  currentStageId = getSpellingStageId(subject),
  subtitle = "Earn 5 ribbons to win a horse."
) {
  const completionMap = getSpellingStageCompletionMap(subject);
  return `
    <section class="ss-side-card">
      <p class="eyebrow">Set progress</p>
      <h4>${escapeHtml(subtitle)}</h4>
      <div class="ss-progress-list">
        ${SPELLING_STAGE_ORDER
          .map((stageId, index) => {
            const isComplete = completionMap[stageId];
            const isCurrent = !isComplete && currentStageId === stageId;
            const isOpenable = canOpenSpellingStage(subject, stageId);
            const status = isCurrent ? "In progress" : isOpenable ? "Ready" : "Locked";
            return `
              <button
                type="button"
                class="ss-progress-row${isComplete ? " is-complete" : isCurrent ? " is-current" : ""}"
                data-spelling-open-stage="${escapeHtml(stageId)}"
                ${isOpenable ? "" : "disabled"}
              >
                <span class="ss-progress-token">${isComplete ? "✓" : index + 1}</span>
                <div class="ss-progress-copy">
                  <strong>${escapeHtml(SPELLING_STAGE_LABELS[stageId])}</strong>
                  ${isComplete ? '<span class="ss-progress-ribbon" aria-label="Ribbon earned"><span class="ss-progress-ribbon__straps"></span><span class="ss-progress-ribbon__medal"></span></span>' : `<span>${escapeHtml(status)}</span>`}
                </div>
              </button>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function buildSpellingStableMiniCard(spelling) {
  const owned = getSpellingOwnedHorseMeta(spelling);
  return `
    <section class="ss-side-card">
      <div class="ss-side-card__head">
        <h4>Your stable</h4>
        <span>${escapeHtml(`${owned.length} / ${SPELLING_PADDOCK_HORSES.length}`)}</span>
      </div>
      <div class="ss-stable-mini-scroll">
        <div class="ss-stable-mini-grid">
          ${owned.length
            ? owned
                .map(
                  (horse) => `
                    <article class="ss-stable-mini-card">
                      <div class="ss-stable-mini-art">
                        <img src="${escapeHtml(horse.image)}" alt="${escapeHtml(horse.label)}" />
                      </div>
                      <strong>${escapeHtml(horse.label)}</strong>
                    </article>
                  `
                )
                .join("")
            : '<p class="ss-stage-copy">Finish a full set to add your first horse.</p>'}
        </div>
      </div>
    </section>
  `;
}

function buildSpellingInstanceOverviewCard(spelling) {
  const overview = getSpellingInstanceOverview(spelling);
  return `
    <section class="ss-side-card">
      <p class="eyebrow">Instance overview</p>
      <h4>Completed five-stage runs</h4>
      <div class="ss-focus-row">
        <article class="ss-focus-card">
          <strong>${escapeHtml(String(overview.instanceCount))}</strong>
          <span>instances logged</span>
        </article>
        <article class="ss-focus-card">
          <strong>${escapeHtml(String(overview.uniqueWordCount))}</strong>
          <span>unique words covered</span>
        </article>
        <article class="ss-focus-card">
          <strong>${escapeHtml(`${overview.averageStageFiveAccuracy}%`)}</strong>
          <span>average stage 5 accuracy</span>
        </article>
      </div>
    </section>
  `;
}

function buildSpellingOneRibbonCard() {
  return `
    <section class="ss-side-card ss-side-card--accent">
      <p class="eyebrow">Two stages to go</p>
      <h4>Finish tenses, then the final spelling check, to win a new horse for your property.</h4>
    </section>
  `;
}

function buildSpellingStageSidebar(subject, spelling, stageId) {
  if (stageId === "diagnostic") {
    return `
      ${buildSpellingSessionProgressCard(subject, spelling, stageId)}
      ${buildSpellingStableMiniCard(spelling)}
    `;
  }

  if (stageId === "looks-right") {
    return `
      ${buildSpellingSessionProgressCard(subject, spelling, stageId)}
      ${buildSpellingReviewBacklogCard(spelling)}
    `;
  }

  if (stageId === "word-families") {
    return `
      ${buildSpellingSessionProgressCard(subject, spelling, stageId)}
      ${buildSpellingOneRibbonCard()}
    `;
  }

  if (stageId === "tense-transfer") {
    return `
      ${buildSpellingSessionProgressCard(subject, spelling, stageId, "One final check — then a new horse.")}
      ${buildSpellingHorsePreviewCard(spelling)}
    `;
  }

  return `
    ${buildSpellingSessionProgressCard(subject, spelling, stageId, "Last ribbon — then a new horse.")}
    ${buildSpellingHorsePreviewCard(spelling)}
  `;
}

function buildSpellingReviewBacklogCard(spelling) {
  const words = (getSpellingFollowUpWords(spelling).length ? getSpellingFollowUpWords(spelling) : getSpellingAttemptWords(spelling)).slice(0, 3);
  return `
    <section class="ss-side-card">
      <p class="eyebrow">Review backlog</p>
      <h4>Words coming back soon</h4>
      <div class="ss-backlog-list">
        ${words
          .map((entry, index) => `
            <article class="ss-backlog-row">
              <strong>${escapeHtml(entry.word)}</strong>
              <span>${escapeHtml(index === 0 ? "due now" : SPELLING_UNIT_SEED.reviewDays[Math.min(index, SPELLING_UNIT_SEED.reviewDays.length - 1)])}</span>
            </article>
          `)
          .join("")}
      </div>
    </section>
  `;
}

function buildSpellingHorsePreviewCard(spelling) {
  const nextHorse = SPELLING_PADDOCK_HORSES[getSpellingVisibleHorseCount(spelling)] || null;
  if (!nextHorse) {
    return `
      <section class="ss-side-card">
        <p class="eyebrow">Stable full</p>
        <h4>All horses unlocked</h4>
        <p class="ss-stage-copy">Keep finishing sessions to strengthen review, even though the stable is already complete.</p>
      </section>
    `;
  }

  return `
    <section class="ss-side-card ss-side-card--horse-preview">
      <div class="ss-horse-preview">
        <img src="${escapeHtml(nextHorse.image)}" alt="${escapeHtml(nextHorse.name)}" />
      </div>
      <strong>${escapeHtml(`${nextHorse.name} is waiting`)}</strong>
      <span>${escapeHtml(`Earn the 5th ribbon to add this ${nextHorse.label} to your property.`)}</span>
    </section>
  `;
}

function buildSpellingHomeOverview(subject, spelling) {
  const currentStageId = getSpellingStageId(subject);
  const currentStageLabel = SPELLING_STAGE_LABELS[currentStageId] || "Diagnostic";
  const attemptComplete = isSpellingAttemptComplete(subject);
  const isFreshSession = !attemptComplete && !spelling.diagnostic.completed && !Object.keys(spelling.diagnostic.responses || {}).length;
  const ownedHorseCount = getSpellingVisibleHorseCount(spelling);
  const latestHorseMeta = getSpellingPaddockHorseMeta(spelling.lastUnlockedHorseId || spelling.paddockHorses[spelling.paddockHorses.length - 1]);
  return `
    <section class="ss-home-stack">
      <article class="ss-stage-panel">
        <div class="ss-stage-panel__head">
          <div>
            <p class="eyebrow">Practice Property</p>
            <h4>${escapeHtml(attemptComplete ? "Set complete" : isFreshSession ? "Ready to begin a new set" : `Continue with ${currentStageLabel}`)}</h4>
          </div>
          <span class="ss-stage-badge">${escapeHtml(`${ownedHorseCount} / ${SPELLING_PADDOCK_HORSES.length} horses`)}</span>
        </div>
        <p class="ss-stage-copy">${escapeHtml(attemptComplete ? `All five stages are complete.${latestHorseMeta ? ` ${latestHorseMeta.name} is now on your property.` : ""} Review the finished set or start a fresh one when you are ready.` : SPELLING_UNIT_SEED.intro)}</p>
        <div class="ss-stage-actions">
          <button type="button" class="primary-button primary-button--dark" data-spelling-begin-session="true">${escapeHtml(attemptComplete ? "Review completed set" : isFreshSession ? "Start spelling session" : `Continue to ${currentStageLabel}`)}</button>
          ${attemptComplete ? '<button type="button" class="ghost-button ghost-button--small" data-spelling-reset-unit="true">Start next set</button>' : ""}
        </div>
      </article>
      ${buildSpellingSessionProgressCard(subject, spelling, currentStageId)}
    </section>
  `;
}

function buildSpellingStableHome(subject, spelling) {
  return `
    <div class="ss-home-panel ss-home-panel--stable">
      <div class="ss-main">
        ${buildRewardPropertyMarkup()}
      </div>
    </div>
  `;
}

function buildSpellingProgressHome(subject, spelling) {
  const instanceRows = getSpellingCompletedInstanceRows(spelling);
  const overview = getSpellingInstanceOverview(spelling);
  const wordProgressRows = getSpellingWordProgressRows(spelling);
  return `
    <div class="ss-home-panel">
      <div class="ss-main">
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head">
            <div>
              <p class="eyebrow">Progress</p>
              <h4>Completed spelling instances</h4>
            </div>
            <span class="ss-stage-badge">${escapeHtml(`${overview.instanceCount} logged`)}</span>
          </div>
          <p class="ss-stage-copy">
            ${escapeHtml(
              instanceRows.length
                ? "Each instance is one full five-stage spelling run. Review each completed set and every word checked in that run."
                : "Finish one full five-stage spelling instance to start the progress log."
            )}
          </p>
          <div class="ss-instance-list">
            ${instanceRows.length
              ? instanceRows
                  .map((instanceRow) => `
                    <article class="ss-instance-card">
                      <div class="ss-instance-card__head">
                        <div>
                          <strong>${escapeHtml(`Instance ${instanceRow.instanceNumber}`)}</strong>
                          <span>${escapeHtml(instanceRow.completedLabel)}</span>
                        </div>
                        <span class="ss-stage-badge">${escapeHtml(`${instanceRow.overallScorePercent}% overall`)}</span>
                      </div>
                      <p class="ss-stage-copy">${escapeHtml(`10 words · Stage 1: ${instanceRow.stageOneCorrect}/10 · Stage 5: ${instanceRow.stageFiveCorrect}/10 · Avg change: ${instanceRow.improvement > 0 ? "+" : ""}${instanceRow.improvement}%`)}</p>
                      <div class="ss-review-list">
                        ${instanceRow.wordResults
                          .map((result) => {
                            const improvement = result.stageFiveAccuracy - result.stageOneAccuracy;
                            const ratingClass = result.stageFiveAccuracy >= 80 ? "is-correct" : result.stageFiveAccuracy >= 50 ? "" : "is-incorrect";
                            return `
                              <article class="ss-review-row ${ratingClass}">
                                <div>
                                  <strong>${escapeHtml(result.word)}</strong>
                                  <span>${escapeHtml(`Stage 1: ${result.stageOneAccuracy}% · Stage 5: ${result.stageFiveAccuracy}% · Change: ${improvement > 0 ? "+" : ""}${improvement}%`)}</span>
                                  <span>${escapeHtml(`Stage 1 attempt: ${result.stageOneAttempt || "No answer"} · Stage 5 attempt: ${result.stageFiveAttempt || "No answer"}`)}</span>
                                </div>
                                <span class="ss-review-mark">${escapeHtml(`${result.stageFiveAccuracy}%`)}</span>
                              </article>
                            `;
                          })
                          .join("")}
                      </div>
                    </article>
                  `)
                  .join("")
              : '<p class="ss-stage-copy">No completed instances yet.</p>'}
          </div>
        </article>
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head">
            <div>
              <p class="eyebrow">Word accuracy</p>
              <h4>All words used across completed instances</h4>
            </div>
            <span class="ss-stage-badge">${escapeHtml(`${overview.loggedWordCount} logged words`)}</span>
          </div>
          <div class="ss-review-list">
            ${wordProgressRows.length
              ? wordProgressRows
                  .map((row) => `
                    <article class="ss-review-row ${escapeHtml(row.ratingClass)}">
                      <div>
                        <strong>${escapeHtml(row.word)}</strong>
                        <span>${escapeHtml(`${row.attempts} instance${row.attempts === 1 ? "" : "s"} · Stage 5 accuracy: ${row.stageFiveAccuracy}% · Change: ${row.improvement > 0 ? "+" : ""}${row.improvement}%`)}</span>
                        <span>${escapeHtml(`Latest stage 1: ${row.stageOneAttempt} · Latest stage 5: ${row.stageFiveAttempt}`)}</span>
                      </div>
                      <span class="ss-review-mark">${escapeHtml(row.rating)}</span>
                    </article>
                  `)
                  .join("")
              : '<p class="ss-stage-copy">Complete stage 5 to start building per-word progress history.</p>'}
          </div>
        </article>
      </div>
      <aside class="ss-side">
        ${buildSpellingInstanceOverviewCard(spelling)}
        ${buildSpellingHorsePreviewCard(spelling)}
      </aside>
    </div>
  `;
}

function playSpellingFlashcardSentence(subject, entry, card) {
  const exposureLimit = getSpellingFlashcardExposureLimit(entry.id);
  const sentenceIndex = Math.min(card.exposureIndex, exposureLimit - 1, (entry.familySentences || []).length - 1);
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
      freshCard.exposureIndex = Math.min(exposureLimit, freshCard.exposureIndex + 1);
      freshSpelling.coachMessage = freshCard.exposureIndex >= exposureLimit
        ? `Now type ${entry.word} from memory.`
        : `Sentence ${freshCard.exposureIndex + 1} of ${exposureLimit} is ready for ${entry.word}.`;
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
  if (card.completed || card.isShowingSentence || card.exposureIndex >= getSpellingFlashcardExposureLimit(wordId)) {
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
  card.completed = false;
  card.awaitingAdvance = false;
  const isCorrect = normalizeSpellingAttempt(typedValue) === normalizeSpellingAttempt(entry.word);
  card.feedbackKind = isCorrect ? "correct" : "incorrect";
  card.feedbackMessage = buildSpellingRecallFeedback(entry, typedValue, isCorrect);
  card.awaitingAdvance = true;
  spelling.coachMessage = isCorrect
    ? `${entry.word} is correct. Review the feedback, then continue.`
    : `Review the correction for ${entry.word}, then continue to the next word.`;
  persistSubjects();
}

function advanceSpellingFlashcardWord(subject, wordId) {
  const spelling = getSubjectSpellingState(subject);
  const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
  if (!entry) {
    return;
  }
  const card = ensureSpellingFlashcardCard(spelling, wordId);
  if (!card.awaitingAdvance) {
    return;
  }
  card.completed = true;
  card.awaitingAdvance = false;
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

function checkSpellingTenseTransfer(subject, wordId) {
  const spelling = getSubjectSpellingState(subject);
  const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
  if (!entry) {
    return;
  }
  const answer = ensureSpellingTenseAnswer(spelling, wordId);
  answer.checked = true;
  answer.completed = false;
  answer.awaitingAdvance = false;
  answer.lastCheckedAt = new Date().toISOString();
  const prompt = getSpellingTensePrompt(spelling, entry);

  if (!answer.selectedTense) {
    answer.feedbackKind = "incorrect";
    answer.feedbackMessage = "Choose past, present, or future before checking.";
    spelling.coachMessage = "Choose the tense before checking this word.";
    persistSubjects();
    return;
  }

  const isCorrect = answer.selectedTense === prompt.tenseId;
  answer.feedbackKind = isCorrect ? "correct" : "incorrect";
  answer.feedbackMessage = isCorrect
    ? `Correct. ${prompt.wordForm} is ${prompt.tenseId} tense in this sentence.`
    : `Incorrect. ${prompt.wordForm} is ${prompt.tenseId} tense in this sentence, not ${answer.selectedTense}.`;
  answer.awaitingAdvance = true;
  spelling.coachMessage = isCorrect
    ? `${entry.word} is correct. The horse moves one step closer to the stable.`
    : `Review the correction for ${entry.word}, then continue to the next word.`;
  persistSubjects();
}

function selectSpellingTenseOption(subject, wordId, optionValue) {
  const spelling = getSubjectSpellingState(subject);
  if (!SPELLING_INTERVENTION_LIBRARY[wordId]) {
    return;
  }
  const normalizedValue = String(optionValue || "").trim();
  if (!SPELLING_TENSE_IDS.includes(normalizedValue)) {
    return;
  }
  const answer = ensureSpellingTenseAnswer(spelling, wordId);
  answer.selectedTense = normalizedValue;
  answer.checked = false;
  answer.awaitingAdvance = false;
  answer.feedbackKind = "";
  answer.feedbackMessage = "";
  spelling.coachMessage = `${normalizedValue} selected. Check the sentence when you are ready.`;
  persistSubjects();
}

function advanceSpellingTenseTransfer(subject, wordId) {
  const spelling = getSubjectSpellingState(subject);
  const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
  if (!entry) {
    return;
  }
  const answer = ensureSpellingTenseAnswer(spelling, wordId);
  if (!answer.awaitingAdvance) {
    return;
  }
  answer.completed = true;
  answer.awaitingAdvance = false;
  const followUpWords = getSpellingFollowUpWords(spelling);
  const nextWord = followUpWords.find((item) => !ensureSpellingTenseAnswer(spelling, item.id).completed);
  spelling.tenseTransfer.currentWordId = nextWord?.id || "";
  spelling.tenseTransfer.completed = isSpellingTenseTransferComplete(spelling);
  if (spelling.tenseTransfer.completed) {
    celebrateSpellingStage(
      subject,
      "tense-transfer",
      "Stage 4 complete. The final spelling check is ready so you can compare the two dictation rounds."
    );
    return;
  }
  spelling.coachMessage = `${entry.word} is secure. The next tense word is ready.`;
  persistSubjects();
}

function getSpellingChallengeCurrentItem(spelling) {
  return spelling.challenge.items[spelling.challenge.currentIndex] || null;
}

function getSpellingChallengeItemEntry(item) {
  return item ? SPELLING_INTERVENTION_LIBRARY[item.wordId] || null : null;
}

function getSpellingChallengeLooksRightOptions(entry) {
  const sentence = getSpellingLooksRightSentence(entry);
  return [
    {
      value: entry.word,
      markup: buildSpellingLooksRightChoiceSentence(sentence, entry.word, entry.lookRightChoiceCorrect || entry.articulation)
    },
    {
      value: entry.lookRightWrong,
      markup: buildSpellingLooksRightChoiceSentence(sentence, entry.word, entry.lookRightChoiceWrong || entry.lookRightWrong)
    }
  ];
}

function buildSpellingChallengeMissingLetterPrompt(entry, missingIndex) {
  const index = Math.max(0, Math.min(entry.word.length - 1, missingIndex));
  return `${escapeHtml(entry.word.slice(0, index))}<span class="spelling-inline-target">_</span>${escapeHtml(entry.word.slice(index + 1))}`;
}

function speakSpellingChallengeWord(item, entry) {
  if (!item || !entry) {
    return;
  }
  void speakTextWithOpenAi(`Spell the word ${entry.word}. ${getSpellingLooksRightSentence(entry)}`, {
    context: `spelling:challenge:${item.id}`,
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
      console.error("Spelling challenge audio failed.", error);
      render();
    });
}

function advanceSpellingChallenge(spelling, successMessage) {
  spelling.challenge.currentIndex += 1;
  spelling.challenge.checked = false;
  spelling.challenge.inputValue = "";
  if (spelling.challenge.currentIndex >= spelling.challenge.items.length) {
    spelling.challenge.completed = true;
    spelling.challenge.active = false;
    spelling.challenge.lastCompletedWeekKey = spelling.challenge.weekKey;
    spelling.coachMessage = "Weekly spelling challenge complete.";
    return;
  }
  spelling.coachMessage = successMessage;
}

function submitSpellingChallengeInput(subject) {
  const spelling = getSubjectSpellingState(subject);
  const item = getSpellingChallengeCurrentItem(spelling);
  const entry = getSpellingChallengeItemEntry(item);
  if (!item || !entry) {
    return;
  }
  const typedValue = String(spelling.challenge.inputValue || "").trim();
  spelling.challenge.checked = true;
  if (!typedValue) {
    spelling.coachMessage = "Type an answer before continuing.";
    persistSubjects();
    return;
  }

  let isCorrect = false;
  if (item.mode === "dictation") {
    isCorrect = normalizeSpellingAttempt(typedValue) === normalizeSpellingAttempt(entry.word);
  } else if (item.mode === "root-word") {
    isCorrect = normalizeSpellingAttempt(typedValue) === normalizeSpellingAttempt(entry.word);
  } else if (item.mode === "missing-letter") {
    isCorrect = typedValue.trim().toLowerCase() === entry.word[item.missingIndex].toLowerCase();
  }

  if (!isCorrect) {
    spelling.coachMessage = `Retry ${entry.word}.`;
    persistSubjects();
    return;
  }

  advanceSpellingChallenge(spelling, `${entry.word} is correct. Next challenge word ready.`);
  persistSubjects();
}

function selectSpellingChallengeLooksRight(subject, value) {
  const spelling = getSubjectSpellingState(subject);
  const item = getSpellingChallengeCurrentItem(spelling);
  const entry = getSpellingChallengeItemEntry(item);
  if (!item || !entry) {
    return;
  }
  spelling.challenge.checked = true;
  if (value !== entry.word) {
    spelling.coachMessage = `Look again at ${entry.word}.`;
    persistSubjects();
    return;
  }
  advanceSpellingChallenge(spelling, `${entry.word} is correct. Next challenge word ready.`);
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

    return recoverResolvedSubjectsForGrammar(
      mergeLegacyGroupedDocuments(
        removeLegacySeededDocuments(
          removeLegacySeededAssessments([...resolvedSubjects, ...extraSubjects])
        )
      )
    );
  }

  return recoverResolvedSubjectsForGrammar(createInitialSubjectsForAccount(account));
}

function getStoredSubjectsForAccount(account) {
  const accountKey = normaliseAccountKey(account?.email);
  if (!accountKey) {
    return createBaseSubjects();
  }

  const storedSubjectsMap = loadStoredSubjectsMap();
  return buildResolvedSubjectsFromStore(account, storedSubjectsMap[accountKey]);
}

function getFastMergedStoredSubjectsForAccount(account, primarySubjects = null) {
  const accountKey = normaliseAccountKey(account?.email);
  const storedSubjectsMap = loadStoredSubjectsMap();
  return mergeAvailableSubjectSources(primarySubjects, storedSubjectsMap[accountKey]);
}

async function getMergedStoredSubjectsForAccount(account, primarySubjects = null) {
  const accountKey = normaliseAccountKey(account?.email);
  const storedSubjectsMap = loadStoredSubjectsMap();
  const subjectSnapshotTimeout = Symbol("subjectSnapshotTimeout");
  const indexedDbSubjects = accountKey
    ? await Promise.race([
        getSubjectsSnapshotRecord(accountKey).catch((error) => {
          console.error("IndexedDB subject snapshot could not be restored.", error);
          return null;
        }),
        new Promise((resolve) => {
          window.setTimeout(() => resolve(subjectSnapshotTimeout), subjectSnapshotRestoreTimeoutMs);
        })
      ])
    : null;

  if (indexedDbSubjects === subjectSnapshotTimeout) {
    console.warn("IndexedDB subject snapshot restore timed out. Falling back to local storage and server subjects.");
    const mergedSubjects = mergeAvailableSubjectSources(null, storedSubjectsMap[accountKey], primarySubjects);
    logGrammarDebug("grammar-restore-sources", {
      accountKey,
      mode: "timeout-local-storage-plus-primary",
      indexedDbTimedOut: true,
      primary: Array.isArray(primarySubjects),
      localStorage: Array.isArray(storedSubjectsMap[accountKey]),
      grammar: getGrammarStateSummary(
        (mergedSubjects || []).find((subject) => isSpellingSubjectRecord(subject?.id, subject?.name))?.grammar,
        "spelling"
      )
    });
    return mergedSubjects;
  }

  const mergedSubjects = mergeAvailableSubjectSources(indexedDbSubjects, storedSubjectsMap[accountKey], primarySubjects);
  logGrammarDebug("grammar-restore-sources", {
    accountKey,
    mode: "indexeddb-local-storage-primary",
    indexedDbTimedOut: false,
    indexedDb: Array.isArray(indexedDbSubjects),
    primary: Array.isArray(primarySubjects),
    localStorage: Array.isArray(storedSubjectsMap[accountKey]),
    grammar: getGrammarStateSummary(
      (mergedSubjects || []).find((subject) => isSpellingSubjectRecord(subject?.id, subject?.name))?.grammar,
      "spelling"
    )
  });
  return mergedSubjects;
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
  try {
    return await requestApi("/api/auth/register", {
      name,
      email,
      password,
      grade,
      subjects: createPersistableSubjects(subjects),
      settings
    }, false, {
      timeoutMs: authRequestTimeoutMs,
      timeoutMessage: "Account creation took too long. Please try again."
    });
  } catch (error) {
    const payloadTooLarge =
      error instanceof Error &&
      (error.status === 413 || /too large|payload|entity too large|request entity/i.test(error.message || ""));
    if (payloadTooLarge) {
      const nextError = new Error(
        "Your uploaded documents are too large to sync to the shared account in one request right now. They remain saved on this device."
      );
      nextError.status = 413;
      throw nextError;
    }
    throw error;
  }
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

function createRemoteSubjectsSyncError(error) {
  const payloadTooLarge =
    error instanceof Error &&
    (error.status === 413 || /too large|payload|entity too large|request entity/i.test(error.message || ""));
  if (payloadTooLarge) {
    const nextError = new Error(
      "PaperPanda saved these documents on this device, but the shared account copy is still too large to sync in one request right now."
    );
    nextError.status = 413;
    return nextError;
  }

  if (error instanceof Error && String(error.message || "").trim()) {
    return error;
  }

  return new Error("PaperPanda could not sync these documents to the shared account just now.");
}

function isRemoteSubjectsPayloadTooLarge(error) {
  return Boolean(
    error instanceof Error &&
    (error.status === 413 || /too large|payload|entity too large|request entity/i.test(error.message || ""))
  );
}

function updateRemoteSubjectsSaveWaiters() {
  const hasPendingSync = remoteSubjectsSaveInFlight || Boolean(remoteSubjectsSaveQueuedSnapshot);
  remoteSubjectsSaveWaiters = remoteSubjectsSaveWaiters.filter((waiter) => {
    if (waiter.sequence <= remoteSubjectsCommittedSequence) {
      waiter.resolve();
      return false;
    }

    if (!hasPendingSync && waiter.sequence <= remoteSubjectsFailedSequence) {
      waiter.reject(remoteSubjectsLastError || new Error("PaperPanda could not sync these documents to the shared account."));
      return false;
    }

    return true;
  });
}

function waitForRemoteSubjectsPersist(sequence = remoteSubjectsSaveSequence) {
  if (!state.authToken || !sequence || sequence <= remoteSubjectsCommittedSequence) {
    return Promise.resolve();
  }

  const hasPendingSync = remoteSubjectsSaveInFlight || Boolean(remoteSubjectsSaveQueuedSnapshot);
  if (!hasPendingSync && sequence <= remoteSubjectsFailedSequence) {
    return Promise.reject(remoteSubjectsLastError || new Error("PaperPanda could not sync these documents to the shared account."));
  }

  return new Promise((resolve, reject) => {
    remoteSubjectsSaveWaiters.push({ sequence, resolve, reject });
  });
}

function queueRemoteSubjectsPersist(subjectsSnapshot, fallbackSubjectsSnapshot = null) {
  if (!state.authToken) {
    return 0;
  }

  const sequence = remoteSubjectsSaveSequence + 1;
  remoteSubjectsSaveSequence = sequence;
  remoteSubjectsSaveQueuedSnapshot = {
    sequence,
    subjects: subjectsSnapshot,
    fallbackSubjects: fallbackSubjectsSnapshot
  };
  if (remoteSubjectsSaveInFlight) {
    return sequence;
  }

  remoteSubjectsSaveInFlight = true;
  void (async () => {
    while (remoteSubjectsSaveQueuedSnapshot) {
      const snapshot = remoteSubjectsSaveQueuedSnapshot;
      remoteSubjectsSaveQueuedSnapshot = null;
      try {
        await requestApi(
          "/api/account/subjects",
          { subjects: snapshot.subjects },
          false,
          {
            headers: {
              ...buildAuthHeaders()
            },
            method: "PUT"
          }
        );
        remoteSubjectsCommittedSequence = Math.max(remoteSubjectsCommittedSequence, snapshot.sequence);
        if (remoteSubjectsCommittedSequence >= remoteSubjectsFailedSequence) {
          remoteSubjectsLastError = null;
        }
        if (elements?.uploadStatus && elements.uploadStatus.textContent === "PaperPanda saved a lighter shared-account copy so your latest learning progress still syncs across devices.") {
          elements.uploadStatus.textContent = "";
        }
      } catch (error) {
        if (isRemoteSubjectsPayloadTooLarge(error) && Array.isArray(snapshot.fallbackSubjects)) {
          try {
            await requestApi(
              "/api/account/subjects",
              { subjects: snapshot.fallbackSubjects },
              false,
              {
                headers: {
                  ...buildAuthHeaders()
                },
                method: "PUT"
              }
            );
            remoteSubjectsCommittedSequence = Math.max(remoteSubjectsCommittedSequence, snapshot.sequence);
            if (remoteSubjectsCommittedSequence >= remoteSubjectsFailedSequence) {
              remoteSubjectsLastError = null;
            }
            if (elements?.uploadStatus) {
              elements.uploadStatus.textContent =
                "PaperPanda saved a lighter shared-account copy so your latest learning progress still syncs across devices.";
            }
          } catch (fallbackError) {
            remoteSubjectsFailedSequence = Math.max(remoteSubjectsFailedSequence, snapshot.sequence);
            remoteSubjectsLastError = createRemoteSubjectsSyncError(fallbackError);
            console.error("Remote subject sync failed.", remoteSubjectsLastError);
            if (elements?.uploadStatus) {
              elements.uploadStatus.textContent = remoteSubjectsLastError.message;
            }
          }
        } else {
          remoteSubjectsFailedSequence = Math.max(remoteSubjectsFailedSequence, snapshot.sequence);
          remoteSubjectsLastError = createRemoteSubjectsSyncError(error);
          console.error("Remote subject sync failed.", remoteSubjectsLastError);
          if (elements?.uploadStatus) {
            elements.uploadStatus.textContent = remoteSubjectsLastError.message;
          }
        }
      }
      updateRemoteSubjectsSaveWaiters();
    }

    remoteSubjectsSaveInFlight = false;
    updateRemoteSubjectsSaveWaiters();
  })();

  return sequence;
}

function persistSubjects({ skipRemoteSync = false } = {}) {
  if (!state.currentUserEmail) {
    return 0;
  }

  const accountKey = normaliseAccountKey(state.currentUserEmail);
  const storedSubjectsMap = loadStoredSubjectsMap();
  const persistableSubjects = createPersistableSubjects(state.subjects);
  const remoteSyncSubjects = createRemoteSyncSubjects(state.subjects);
  const remoteFallbackSubjects = createRemoteSyncFallbackSubjects(state.subjects);
  const indexedDbSequence = queueIndexedDbSubjectsPersist(accountKey, persistableSubjects);
  latestIndexedDbSubjectsPersistSequence = indexedDbSequence;
  const persistResult = saveStoredSubjectsMapForAccount(storedSubjectsMap, accountKey, state.subjects);
  if (persistResult === "fallback" && elements?.uploadStatus) {
    elements.uploadStatus.textContent =
      "PaperPanda kept a lighter browser backup, but the full document copy is still saved on this device.";
  } else if (persistResult === "minimal" && elements?.uploadStatus) {
    elements.uploadStatus.textContent =
      "Browser storage is tight, so PaperPanda switched to a progress-only browser backup. The full on-device copy is still saved in the document cache.";
  } else if (persistResult === "pruned-fallback" && elements?.uploadStatus) {
    elements.uploadStatus.textContent =
      "This device cleared older browser backups to free space. Your current account still has a full on-device copy.";
  } else if (persistResult === "pruned-minimal" && elements?.uploadStatus) {
    elements.uploadStatus.textContent =
      "This device cleared older browser backups and kept only a progress-only backup for this account. The full on-device copy is still saved in the document cache.";
  } else if (persistResult === "failed" && elements?.uploadStatus) {
    elements.uploadStatus.textContent =
      "Browser storage is full. PaperPanda could not refresh the lightweight browser backup, but the on-device document cache was still updated.";
  }

  if (!skipRemoteSync) {
    const sequence = queueRemoteSubjectsPersist(remoteSyncSubjects, remoteFallbackSubjects);
    syncPreviewPersistence();
    return sequence;
  }

  syncPreviewPersistence();
  return 0;
}

async function persistSubjectsDurably({ skipRemoteSync = false } = {}) {
  const remoteSequence = persistSubjects({ skipRemoteSync });
  const indexedDbSequence = latestIndexedDbSubjectsPersistSequence;
  await waitForIndexedDbSubjectsPersist(indexedDbSequence);
  if (!skipRemoteSync) {
    await waitForRemoteSubjectsPersist(remoteSequence);
  }
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

function normaliseWorksheetQuestionNumber(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^QUESTION\s*/i, "")
    .replace(/^Q\s*/i, "")
    .replace(/\s+/g, "");
  if (!/^\d{1,3}[A-Z]?$/.test(raw)) {
    return "";
  }
  return `Q${raw}`;
}

function normaliseQuestionBlock(block, index = 0) {
  return {
    questionNumber: normaliseWorksheetQuestionNumber(block?.questionNumber || block?.id || ""),
    pageNumber: Math.max(1, Number(block?.pageNumber || 0) || 0),
    text: String(block?.text || "").trim(),
    order: Math.max(0, Number(block?.order || index) || index)
  };
}

function normaliseDocument(documentRecord) {
  return {
    ...documentRecord,
    workNotes: documentRecord.workNotes || "",
    externalWorkspace: normaliseExternalWorkspace(documentRecord.externalWorkspace),
    revisionArchived: Boolean(documentRecord.revisionArchived),
    reviewed: Boolean(documentRecord.reviewed),
    reviewMode: documentRecord.reviewMode || "",
    pages: Array.isArray(documentRecord.pages)
      ? documentRecord.pages.map((page) => ({
          pageNumber: Number(page?.pageNumber || 0),
          text: String(page?.text || "").trim(),
          imageUrl: page?.imageUrl || null,
          askImageUrl: page?.askImageUrl || page?.imageUrl || null,
          questionBlocks: Array.isArray(page?.questionBlocks)
            ? page.questionBlocks.map(normaliseQuestionBlock).filter((block) => block.questionNumber && block.text)
            : []
        }))
      : [],
    studyOverview: String(documentRecord.studyOverview || "").trim(),
    studyPlanStatus: String(documentRecord.studyPlanStatus || "idle"),
    studyPlanVersion: Math.max(0, Number(documentRecord.studyPlanVersion || 0) || 0),
    readabilityWarning: String(documentRecord.readabilityWarning || "").trim(),
    ocrAttempted: Boolean(documentRecord.ocrAttempted),
    ocrUsed: Boolean(documentRecord.ocrUsed),
    ocrError: String(documentRecord.ocrError || "").trim(),
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
  const mergedSubjectsSource = mergeSubjectSources(subjectsOverride, storedSubjectsMap[accountKey]);
  const resolvedSubjects = buildResolvedSubjectsFromStore(
    account,
    mergedSubjectsSource || subjectsOverride || storedSubjectsMap[accountKey]
  );
  state.subjects = resolvedSubjects;

  if (!state.subjects.some((subject) => subject.id === state.selectedSubjectId)) {
    state.selectedSubjectId = state.subjects[0]?.id || "";
  }
  normalizeManualWatchItemsAcrossSubjects();
  const selectedSubject = state.subjects.find((subject) => subject.id === state.selectedSubjectId);
  const firstDocumentId =
    getReaderDocuments(selectedSubject || { documents: [] })[0]?.id ||
    getRevisionReaderDocuments(selectedSubject || { documents: [] })[0]?.id ||
    null;
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
        },
        timeoutMs: authRequestTimeoutMs,
        timeoutMessage: "Session restore took too long. Sign in again."
      });
      state.authToken = savedToken;
      const mergedSubjects = await getMergedStoredSubjectsForAccount(session.account, session.subjects);
      logGrammarDebug("grammar-session-restore", {
        accountKey: normaliseAccountKey(session.account?.email),
        grammar: getGrammarStateSummary(
          (mergedSubjects || []).find((subject) => isSpellingSubjectRecord(subject?.id, subject?.name))?.grammar,
          "spelling"
        )
      });
      applyAuthenticatedAccount(session.account, {
        token: savedToken,
        subjects: mergedSubjects,
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
    const durableLegacySubjects = await getMergedStoredSubjectsForAccount(account, getStoredSubjectsForAccount(account));
    let payload;
    try {
      payload = await registerCloudAccountWithFallback({
        name: account.name,
        email: account.email,
        password: account.password,
        grade: normaliseGrade(account.grade),
        subjects: durableLegacySubjects || getStoredSubjectsForAccount(account),
        settings: buildCloudAccountSettingsPayload()
      });
    } catch (registerError) {
      if (!(registerError instanceof Error) || registerError.status !== 409) {
        throw registerError;
      }
      payload = await requestApi("/api/auth/signin", {
        email: account.email,
        password: account.password
      }, false, {
        timeoutMs: authRequestTimeoutMs,
        timeoutMessage: "Sign-in took too long. Please try again."
      });
    }

    state.authToken = payload.token || "";
    applyAuthenticatedAccount(payload.account, {
      token: payload.token || "",
      subjects: durableLegacySubjects || getStoredSubjectsForAccount(account),
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
  const savedUiVersion = window.localStorage.getItem(uiVersionStorageKey);
  const didUpgradeUi = savedUiVersion !== currentUiVersion;
  if (!raw) {
    if (didUpgradeUi) {
      clearSession();
    }
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

  if (didUpgradeUi) {
    clearSession();
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

function openDashboard(nextView = "home") {
  setAuthPending(false);
  state.authViewOpen = false;
  state.focusAskOpen = false;
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
  state.authViewOpen = true;
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

function getAllRevisionDocumentBundles(subject) {
  return getDocumentGroupsFromDocuments(getRevisionReaderDocuments(subject));
}

function getSelectableDocumentsForTable(subject) {
  return [
    ...getReaderDocuments(subject || { documents: [] }),
    ...(isRevisionSectionExpanded(subject) ? getRevisionReaderDocuments(subject || { documents: [] }) : [])
  ];
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
  state.focusArea = null;
  openTaskView({ kind: "assessment", id: entry.assessment.id });
}

function openHomeworkTaskForSubject(subject, bundle) {
  if (!subject || !bundle) {
    return;
  }
  state.selectedSubjectId = subject.id;
  state.activeSubjectTab = "homework";
  state.focusArea = null;
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
  const subject = getSelectedSubject();
  const spellingFocus = shouldUseSpellingFocusUi(subject);

  if (spellingFocus && state.focusAskOpen) {
    closeFocusAskPopup({ stopMic: true });
    return;
  }

  if (spellingFocus) {
    state.focusAskOpen = true;
    render();
    requestAnimationFrame(() => {
      focusAskComposer();
      startAskMicrophone();
    });
    return;
  }

  if (state.currentView !== "subjects") {
    state.currentView = "subjects";
    state.activeSubjectTab = state.activeSubjectTab || "reader";
    resetSubjectWorkspaceView();
    state.focusAskOpen = false;
    state.focusArea = null;
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
    elements.homeAskPrompt.textContent = nextEntry
      ? `Good morning. Want help choosing a subject or getting ready for ${nextEntry.assessment.componentTask || nextEntry.assessment.title}?`
      : "Good morning. Want help choosing a subject or getting started with your notes?";
  }

  renderUpcomingModal();
}

function renderCurrentView() {
  if (state.currentView !== "subjects") {
    state.focusAskOpen = false;
  }
  elements.appBrandTag.textContent = "";
  elements.welcomeHeading.textContent = "";
  elements.landingPanel.classList.toggle("hidden", !state.authViewOpen);
  elements.appShell.classList.toggle(
    "hidden",
    state.authViewOpen || state.currentView === "task" || state.currentView === "revision"
  );
  elements.homeView.classList.toggle("hidden", state.currentView !== "home");
  elements.settingsView.classList.toggle("hidden", state.currentView !== "settings");
  elements.subjectsView.classList.toggle("hidden", state.currentView !== "subjects");
  elements.taskView.classList.toggle("hidden", state.currentView !== "task");
  elements.revisionView.classList.toggle("hidden", state.currentView !== "revision");
  syncTopbarNavigationState();
}

function syncTopbarNavigationState() {
  elements.navHomeButton.classList.toggle("is-active", state.currentView === "home");
  elements.navSubjectsButton.classList.toggle("is-active", state.currentView === "subjects");
  elements.navCalendarButton?.classList.toggle("is-active", state.upcomingModalOpen && state.upcomingModalMode === "all");
  elements.navSettingsButton.classList.toggle("is-active", state.currentView === "settings");
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
  const rawTimeoutMs = Number(options.timeoutMs);
  const timeoutMs = Number.isFinite(rawTimeoutMs) && rawTimeoutMs > 0 ? Math.max(1_000, rawTimeoutMs) : 0;
  const abortController = timeoutMs ? new AbortController() : null;
  const timeoutHandle = abortController ? setTimeout(() => abortController.abort(), timeoutMs) : null;
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...(options.headers || {})
      },
      signal: abortController?.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(options.timeoutMessage || "The request timed out.");
    }
    throw error instanceof Error ? error : new Error("The request failed.");
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }

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
  const rawTimeoutMs = Number(options.timeoutMs);
  const timeoutMs = Number.isFinite(rawTimeoutMs) && rawTimeoutMs > 0 ? Math.max(1_000, rawTimeoutMs) : 0;
  const abortController = timeoutMs ? new AbortController() : null;
  const timeoutHandle = abortController ? setTimeout(() => abortController.abort(), timeoutMs) : null;
  let response;
  try {
    response = await window.fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || "POST",
      headers,
      body: JSON.stringify(payload),
      signal: abortController?.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(options.timeoutMessage || "The request timed out.");
    }
    throw error instanceof Error ? error : new Error("Backend request failed.");
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
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

async function requestApiFormData(endpoint, formData, options = {}) {
  const rawTimeoutMs = Number(options.timeoutMs);
  const timeoutMs = Number.isFinite(rawTimeoutMs) && rawTimeoutMs > 0 ? Math.max(1_000, rawTimeoutMs) : 0;
  const abortController = timeoutMs ? new AbortController() : null;
  const timeoutHandle = abortController ? setTimeout(() => abortController.abort(), timeoutMs) : null;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || "POST",
      body: formData,
      signal: abortController?.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(options.timeoutMessage || "The request timed out.");
    }
    throw error instanceof Error ? error : new Error("Request failed.");
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }

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
  const pageExcerpts = Array.isArray(documentRecord?.pages)
    ? documentRecord.pages
        .map((page, index) => ({
          pageNumber: Number(page?.pageNumber || index + 1) || index + 1,
          text: getDocumentPageText(page)
        }))
        .filter((page) => page.text)
        .reduce((result, page) => {
          const usedChars = result.reduce((total, entry) => total + entry.text.length + 24, 0);
          if (result.length >= 90 || usedChars >= 24000) {
            return result;
          }
          const remainingChars = 24000 - usedChars;
          if (remainingChars < 160) {
            return result;
          }
          const clippedText = clipText(page.text, Math.min(320, remainingChars - 24));
          if (!clippedText) {
            return result;
          }
          result.push({
            pageNumber: page.pageNumber,
            text: clippedText
          });
          return result;
        }, [])
    : [];
  const pageVisuals = await buildDocumentVisionPages(documentRecord, {
    maxPages: 6,
    maxTextPerPage: 220
  });

  return requestApi("/api/document/study-plan", {
    subjectName: subject.name,
    title: documentRecord.title,
    type: documentRecord.type,
    pageCount: Array.isArray(documentRecord.pages) ? documentRecord.pages.length : 0,
    content: clipText(documentRecord.content || "", pageExcerpts.length ? 5000 : 24000),
    pageExcerpts,
    pageVisuals
  });
}

async function requestAskAnswer(question, subject, document) {
  const recentHistory = getTodayAskHistory(subject)
    .slice(-4)
    .map((entry) => ({ question: entry.question, answer: entry.answer }));
  const nextAssessment = getNextSubjectAssessment(subject);
  const pageVisualOptions = document?.pageVisualOptions && typeof document.pageVisualOptions === "object"
    ? document.pageVisualOptions
    : {};
  const pageVisuals = document
    ? await buildDocumentVisionPages(document, {
        maxPages: 2,
        maxTextPerPage: 120,
        ...pageVisualOptions
      })
    : [];
  const contentLimit = pageVisuals.length ? 1200 : 3200;
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
          content: clipText(document.content || "Preview text is not available for this document.", contentLimit),
          pageVisuals
        }
      : null
  });

  const answer = responsePayload?.answer?.trim();
  if (!answer) {
    throw new Error("The backend returned an empty answer.");
  }

  return answer;
}

function getLandingAskContextLabel(documentRecord) {
  if (!documentRecord) {
    return "No document selected for Ask yet.";
  }

  if (state.subjectLandingView === "original") {
    const currentPageIndex = getCurrentDocumentPageIndex(documentRecord);
    const currentPage = getDocumentPages(documentRecord)[currentPageIndex] || null;
    const pageNumber = Number(currentPage?.pageNumber || currentPageIndex + 1) || 1;
    return `Asking about: ${documentRecord.title} · page ${pageNumber}`;
  }

  const pieces = getSubjectLandingSimplifiedPieces(documentRecord);
  const pieceIndex = Math.max(0, Math.min(state.subjectLandingPieceIndex, Math.max(0, pieces.length - 1)));
  const currentPiece = pieces[pieceIndex] || null;
  return currentPiece?.title
    ? `Asking about: ${documentRecord.title} · ${currentPiece.title}`
    : `Asking about: ${documentRecord.title}`;
}

function getSubjectLandingAskPlaceholder(documentRecord) {
  if (!documentRecord) {
    return "Ask Panda about this document here.";
  }

  if (state.subjectLandingView === "original") {
    const pages = getDocumentPages(documentRecord);
    const currentPageIndex = getCurrentDocumentPageIndex(documentRecord);
    const currentPage = pages[currentPageIndex] || null;
    const pageNumber = Number(currentPage?.pageNumber || currentPageIndex + 1) || 1;
    return `Example: Can you explain page ${pageNumber} in simpler language?`;
  }

  const pieces = getSubjectLandingSimplifiedPieces(documentRecord);
  const pieceIndex = Math.max(0, Math.min(state.subjectLandingPieceIndex, Math.max(0, pieces.length - 1)));
  const currentPiece = pieces[pieceIndex] || null;
  return currentPiece?.title
    ? `Example: Can you explain "${currentPiece.title}" in simpler language?`
    : "Example: Can you explain this section in simpler language?";
}

function getLandingAskRequestDocument(documentRecord) {
  if (!documentRecord) {
    return null;
  }

  if (state.subjectLandingView === "original") {
    const pages = getDocumentPages(documentRecord);
    const currentPageIndex = getCurrentDocumentPageIndex(documentRecord);
    const currentPage = pages[currentPageIndex] || null;
    const pageNumber = Number(currentPage?.pageNumber || currentPageIndex + 1) || 1;
    const pageText = getDocumentPageText(currentPage);
    return {
      ...documentRecord,
      content: [
        `Focus page: ${pageNumber}`,
        pageText
          ? `Current page text:\n${clipText(pageText, 1200)}`
          : "Current page text is limited. Use the supplied page image for the exact worksheet content.",
        documentRecord.studyOverview ? `Document overview:\n${clipText(documentRecord.studyOverview, 600)}` : ""
      ].filter(Boolean).join("\n\n"),
      pageVisualOptions: {
        maxPages: 1,
        maxTextPerPage: 120,
        prioritizedPageNumbers: [pageNumber]
      }
    };
  }

  const pieces = getSubjectLandingSimplifiedPieces(documentRecord);
  const pieceIndex = Math.max(0, Math.min(state.subjectLandingPieceIndex, Math.max(0, pieces.length - 1)));
  const currentPiece = pieces[pieceIndex] || null;
  const section = getDocumentSections(documentRecord)[pieceIndex] || getSelectedDocumentSection(documentRecord) || null;
  const prioritizedPageNumbers = [];
  if (section?.pageStart && section?.pageEnd) {
    for (let pageNumber = section.pageStart; pageNumber <= section.pageEnd; pageNumber += 1) {
      prioritizedPageNumbers.push(pageNumber);
    }
  }

  return {
    ...documentRecord,
    content: [
      currentPiece?.badge ? `Focus: ${currentPiece.badge}` : "",
      currentPiece?.title ? `Section title: ${currentPiece.title}` : "",
      currentPiece?.summary ? `Simplified summary:\n${currentPiece.summary}` : "",
      Array.isArray(currentPiece?.bullets) && currentPiece.bullets.length
        ? `Key points:\n${currentPiece.bullets.map((bullet) => `- ${bullet}`).join("\n")}`
        : "",
      section?.sectionText ? `Source detail:\n${clipText(section.sectionText, 1200)}` : ""
    ].filter(Boolean).join("\n\n"),
    pageVisualOptions: prioritizedPageNumbers.length
      ? {
          maxPages: 2,
          maxTextPerPage: 120,
          prioritizedPageNumbers
        }
      : {
          maxPages: 2,
          maxTextPerPage: 120
        }
  };
}

function getLatestAskAnswer() {
  const selectedSubject = getSelectedSubject();
  if (state.askLatestAnswer && selectedSubject?.id === state.askLatestSubjectId) {
    return String(state.askLatestAnswer).trim();
  }
  const history = selectedSubject ? getTodayAskHistory(selectedSubject) : [];
  return history.length ? String(history[history.length - 1].answer || "").trim() : "";
}

function getSubjectLandingAskVisibleAnswer() {
  return String(state.subjectLandingAskAnswer || "").trim();
}

function getAskIdleStatus(surface = getActiveAskSurface()) {
  return surface?.kind === "landing"
    ? "Write a question, then choose Listen to response."
    : "Write a question, then choose Listen to response.";
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded."));
    image.src = url;
  });
}

function storeAskPageImageCacheEntry(cacheKey, value) {
  if (!cacheKey || !value) {
    return;
  }
  if (askPageImageCache.size >= 24) {
    const oldestKey = askPageImageCache.keys().next().value;
    if (oldestKey) {
      askPageImageCache.delete(oldestKey);
    }
  }
  askPageImageCache.set(cacheKey, value);
}

async function compressDocumentPageImage(imageUrl, { maxWidth = 960, quality = 0.72 } = {}) {
  const source = String(imageUrl || "").trim();
  if (!source || !/^data:image\//i.test(source)) {
    return source;
  }
  const cacheKey = `${maxWidth}:${quality}:${source}`;
  const cachedImage = askPageImageCache.get(cacheKey);
  if (cachedImage) {
    return cachedImage;
  }

  const image = await loadImageFromUrl(source);
  const scale = Math.min(1, maxWidth / Math.max(1, image.naturalWidth || image.width || maxWidth));
  const targetWidth = Math.max(1, Math.round((image.naturalWidth || image.width || maxWidth) * scale));
  const targetHeight = Math.max(1, Math.round((image.naturalHeight || image.height || maxWidth) * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return source;
  }
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const compressedImage = canvas.toDataURL("image/jpeg", quality);
  storeAskPageImageCacheEntry(cacheKey, compressedImage);
  return compressedImage;
}

function isImageDocumentFile(file) {
  const lowerName = String(file?.name || "").toLowerCase();
  const mimeType = String(file?.type || "").toLowerCase();
  return mimeType.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lowerName);
}

async function buildImageDocumentData(file) {
  const sourceImageUrl = await readFileAsDataUrl(file);
  let imageUrl = sourceImageUrl;
  try {
    imageUrl = await compressDocumentPageImage(sourceImageUrl, { maxWidth: 1600, quality: 0.88 });
  } catch (error) {
    imageUrl = sourceImageUrl;
  }

  return {
    fullText: "Image-based document. Use the page image for the exact worksheet content.",
    pages: [
      {
        pageNumber: 1,
        text: "",
        imageUrl,
        askImageUrl: imageUrl,
        questionBlocks: [],
        startIndex: 0,
        endIndex: 0
      }
    ],
    ocrAttempted: false,
    ocrUsed: false,
    ocrError: ""
  };
}

async function buildDocumentVisionPages(documentRecord, {
  maxPages = 4,
  maxTextPerPage = 220,
  sparseThreshold = 140,
  prioritizedPageNumbers = []
} = {}) {
  await hydrateDocumentPreviewImages(documentRecord);
  const pages = getDocumentPages(documentRecord);
  if (!pages.length) {
    return [];
  }

  const candidatePages = pages
    .map((page, index) => ({
      pageNumber: Number(page?.pageNumber || index + 1) || index + 1,
      text: clipText(getDocumentPageText(page), maxTextPerPage),
      imageUrl: String(page?.imageUrl || "").trim(),
      askImageUrl: String(page?.askImageUrl || page?.imageUrl || "").trim(),
      isSparse: shouldUseBackendOcrForPdfPage(page) || getMeaningfulPdfText(page?.text).length < sparseThreshold
    }));

  const prioritizedSet = new Set(
    (Array.isArray(prioritizedPageNumbers) ? prioritizedPageNumbers : [])
      .map((pageNumber) => Number(pageNumber) || 0)
      .filter((pageNumber) => pageNumber > 0)
  );
  const prioritizedPages = candidatePages.filter((page) => prioritizedSet.has(page.pageNumber) && (page.askImageUrl || page.imageUrl));
  const sparsePages = candidatePages.filter((page) => (page.askImageUrl || page.imageUrl) && page.isSparse);
  const fallbackPages =
    !sparsePages.length && getMeaningfulPdfText(documentRecord?.content).length < 220
      ? candidatePages.filter((page) => page.askImageUrl || page.imageUrl)
      : [];
  const selectedPages = [...prioritizedPages];
  const fillPages = sparsePages.length ? sparsePages : fallbackPages;
  fillPages.forEach((page) => {
    if (selectedPages.length >= maxPages) {
      return;
    }
    if (selectedPages.some((candidate) => candidate.pageNumber === page.pageNumber)) {
      return;
    }
    selectedPages.push(page);
  });

  const visuals = [];
  for (const page of selectedPages) {
    let imageUrl = page.askImageUrl || page.imageUrl;
    if (!page.isSparse || !page.askImageUrl) {
      try {
        imageUrl = await compressDocumentPageImage(
          page.askImageUrl || page.imageUrl,
          page.isSparse ? { maxWidth: 1400, quality: 0.84 } : { maxWidth: 960, quality: 0.72 }
        );
      } catch (error) {
        imageUrl = page.askImageUrl || page.imageUrl;
      }
    }
    visuals.push({
      pageNumber: page.pageNumber,
      text: page.text,
      imageUrl,
      askImageUrl: page.askImageUrl || imageUrl,
      questionBlocks: Array.isArray(page.questionBlocks)
        ? page.questionBlocks.map(normaliseQuestionBlock).filter((block) => block.questionNumber && block.text)
        : []
    });
  }

  return visuals;
}

function getAskReadyStatus() {
  return "Panda's response is ready. Choose Listen to response to replay it.";
}

function getAskConfirmTranscriptStatus() {
  return "Check the transcript, then choose Listen to response.";
}

function getStoredAskAnswer(surface = getActiveAskSurface()) {
  return surface?.kind === "landing"
    ? getSubjectLandingAskVisibleAnswer()
    : getLatestAskAnswer();
}

function getLastAskedQuestion(surface = getActiveAskSurface()) {
  const selectedSubject = getSelectedSubject();
  return surface?.kind === "landing"
    ? String(state.subjectLandingAskLastQuestion || "").trim()
    : selectedSubject?.id === state.askLatestSubjectId
      ? String(state.askLatestQuestion || "").trim()
      : "";
}

function setAskSurfaceStatus(surface, message) {
  const nextMessage = String(message || "").trim() || getAskIdleStatus(surface);
  if (surface?.response) {
    surface.response.textContent = nextMessage;
  }
  if (surface?.kind === "landing") {
    state.subjectLandingAskStatus = nextMessage;
    return;
  }
  state.askStatusSubjectId = getSelectedSubject()?.id || "";
  state.askStatus = nextMessage;
}

function storeAskAnswerForSurface(surface, question, answer) {
  const trimmedQuestion = String(question || "").trim();
  const trimmedAnswer = String(answer || "").trim();
  if (surface?.kind === "landing") {
    state.subjectLandingAskLastQuestion = trimmedQuestion;
    state.subjectLandingAskAnswer = trimmedAnswer;
    state.subjectLandingAskStatus = getAskReadyStatus();
    return;
  }
  state.askLatestSubjectId = getSelectedSubject()?.id || "";
  state.askLatestQuestion = trimmedQuestion;
  state.askLatestAnswer = trimmedAnswer;
  state.askStatusSubjectId = state.askLatestSubjectId;
  state.askStatus = getAskReadyStatus();
}

function canReplayStoredAskAnswer(surface, question) {
  const trimmedQuestion = String(question || "").trim();
  const storedAnswer = getStoredAskAnswer(surface);
  if (!storedAnswer) {
    return false;
  }
  if (!trimmedQuestion) {
    return true;
  }
  return trimmedQuestion === getLastAskedQuestion(surface);
}

function isAskPlaybackTextPlayable(value) {
  const text = String(value || "").trim();
  if (!text) {
    return false;
  }

  const normalised = text.toLowerCase();
  if (
    normalised === "ask panda about the current document here." ||
    normalised === "ask a question about the selected subject or document." ||
    normalised === "ask a question first so there is an ai response to play back." ||
    normalised === "write a question first so the ai can focus on what you need help with." ||
    normalised === "write a question first so panda knows what to answer." ||
    normalised === "thinking..." ||
    normalised === "listening for your question..." ||
    normalised === "check the transcript, then choose listen to response." ||
    normalised === "preparing panda's answer..." ||
    normalised === "playing panda's answer..." ||
    normalised === "panda's response is ready. choose listen to response to replay it."
  ) {
    return false;
  }

  return !normalised.startsWith("ask ai failed:") && !normalised.startsWith("listen failed:");
}

function getAskPlaybackText(surface = getActiveAskSurface()) {
  const surfaceText = surface?.kind === "landing"
    ? getSubjectLandingAskVisibleAnswer() || surface?.response?.textContent || ""
    : getLatestAskAnswer() || surface?.response?.textContent || "";
  if (isAskPlaybackTextPlayable(surfaceText)) {
    return String(surfaceText).trim();
  }

  const fallbackText = getStoredAskAnswer(surface);
  return isAskPlaybackTextPlayable(fallbackText) ? String(fallbackText).trim() : "";
}

function resetSubjectLandingAskState() {
  state.subjectLandingAskOpen = false;
  state.subjectLandingAskDraft = "";
  state.subjectLandingAskStatus = "";
  state.subjectLandingAskAnswer = "";
  state.subjectLandingAskLastQuestion = "";
}

function closeSubjectLandingAsk({ stopAudio = true } = {}) {
  if (state.askMicActive) {
    stopAskMicrophone({ preserveStatus: false });
  }
  if (stopAudio && state.askResponseSpeaking) {
    stopListening();
  }
  resetSubjectLandingAskState();
}

function openDockAskForDocument(documentRecord) {
  if (!documentRecord) {
    return;
  }

  state.selectedDocumentId = documentRecord.id;
  state.askDocumentId = documentRecord.id;
  elements.askInput.value = "";
  render();
  renderAskContext();
  elements.askResponse.textContent = "Ask a question about the selected document.";
  focusAskComposer();
}

function openAskForDocument(documentRecord, { preferOriginalView = false } = {}) {
  if (!documentRecord) {
    return;
  }

  const subject = getSelectedSubject();
  const shouldUseLandingAsk = Boolean(
    subject &&
    state.currentView === "subjects" &&
    isWholeStudyDocument(documentRecord)
  );

  if (!shouldUseLandingAsk) {
    openDockAskForDocument(documentRecord);
    return;
  }

  state.subjectWorkspaceExpanded = false;
  state.subjectWorkspaceExpandedSubjectId = "";
  openSubjectLandingDocument(subject, documentRecord.id);
  state.subjectLandingView = preferOriginalView && getDocumentPages(documentRecord).length ? "original" : "simple";
  const landingDocument = getSubjectLandingOpenDocument(subject) || documentRecord;
  const pieces = getSubjectLandingSimplifiedPieces(landingDocument);
  const pieceIndex = Math.max(0, Math.min(state.subjectLandingPieceIndex, Math.max(0, pieces.length - 1)));
  const piece = pieces[pieceIndex] || null;
  const currentPageIndex = getCurrentDocumentPageIndex(landingDocument);
  const currentPage = getDocumentPages(landingDocument)[currentPageIndex] || null;
  const pageNumber = Number(currentPage?.pageNumber || currentPageIndex + 1) || 1;
  openSubjectLandingAsk(landingDocument, {
    pageNumber,
    pieceTitle: piece?.title || ""
  });
}

function openSubjectLandingAsk(documentRecord, { pageNumber = 1, pieceTitle = "" } = {}) {
  if (!documentRecord) {
    return;
  }

  state.askDocumentId = documentRecord.id;
  state.subjectLandingAskOpen = true;
  if (!String(state.subjectLandingAskDraft || "").trim()) {
    state.subjectLandingAskDraft = "";
  }
  state.subjectLandingAskStatus = state.subjectLandingAskStatus || "Ask Panda about the current document here.";
  render();
  requestAnimationFrame(() => {
    renderAskContext();
    focusAskComposer();
  });
}

function renderAskVoiceControls() {
  const canSeekAskResponse = currentAudioContext === "ask" && canSeekCurrentAskPlayback();
  getAskSurfaces().forEach((surface) => {
    if (surface.micButton) {
      surface.micButton.textContent = state.askMicActive ? "Stop microphone" : "Use microphone";
    }
    if (surface.listenButton) {
      surface.listenButton.textContent = "Listen to response";
      surface.listenButton.disabled = state.askResponseSpeaking && !state.askResponsePaused;
    }
    if (surface.pauseButton) {
      surface.pauseButton.textContent = state.askResponsePaused ? "▶" : "⏸";
      surface.pauseButton.setAttribute("aria-label", state.askResponsePaused ? "Resume response" : "Pause response");
      surface.pauseButton.setAttribute("title", state.askResponsePaused ? "Resume response" : "Pause response");
      surface.pauseButton.disabled = !state.askResponseSpeaking;
    }
    if (surface.rewindButton) {
      surface.rewindButton.disabled = !canSeekAskResponse;
    }
    if (surface.forwardButton) {
      surface.forwardButton.disabled = !canSeekAskResponse;
    }
    if (surface.stopButton) {
      surface.stopButton.disabled = !state.askResponseSpeaking;
    }
  });
}

function resolveCurrentAudioPlaybackResumeWaiters() {
  if (!currentAudioPlaybackResumeWaiters.length) {
    return;
  }

  const waiters = currentAudioPlaybackResumeWaiters;
  currentAudioPlaybackResumeWaiters = [];
  waiters.forEach((resolve) => resolve());
}

async function waitForCurrentAudioPlaybackResume(listenSessionId) {
  while (currentListenSessionId === listenSessionId && state.askResponsePaused) {
    await new Promise((resolve) => {
      currentAudioPlaybackResumeWaiters.push(resolve);
    });
  }
}

function hasResumableAudioElementPlayback() {
  return Boolean(
    currentAudioPlayback &&
    currentAudioPlayback.getAttribute("src") &&
    !currentAudioPlayback.ended &&
    currentAudioPlayback.currentTime > 0
  );
}

function canSeekCurrentAskPlayback() {
  return Boolean(
    currentAudioPlaybackMode === "audio-element" &&
    currentAudioPlayback &&
    currentAudioPlayback.getAttribute("src") &&
    Number.isFinite(currentAudioPlayback.currentTime)
  );
}

function seekCurrentAskPlayback(deltaSeconds) {
  if (!canSeekCurrentAskPlayback()) {
    return false;
  }

  const duration = Number.isFinite(currentAudioPlayback.duration) ? currentAudioPlayback.duration : null;
  const nextTime = Math.max(0, currentAudioPlayback.currentTime + deltaSeconds);
  currentAudioPlayback.currentTime = duration === null
    ? nextTime
    : Math.min(Math.max(0, duration), nextTime);
  return true;
}

async function pauseListening() {
  if (!currentAudioContext || !state.askResponseSpeaking || state.askResponsePaused) {
    return;
  }

  if (currentAudioPlaybackMode === "audio-context") {
    const audioContext = getAiSpeechPlaybackContext();
    if (audioContext?.state === "running") {
      await audioContext.suspend();
    }
  } else if (currentAudioPlayback && !currentAudioPlayback.paused) {
    currentAudioPlayback.pause();
  }

  state.askResponsePaused = true;
  renderAskVoiceControls();
}

async function resumeListening() {
  if (!currentAudioContext || !state.askResponseSpeaking || !state.askResponsePaused) {
    return;
  }

  if (currentAudioPlaybackMode === "audio-context") {
    const audioContext = getAiSpeechPlaybackContext();
    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }
  } else if (hasResumableAudioElementPlayback()) {
    await currentAudioPlayback.play();
  }

  state.askResponsePaused = false;
  renderAskVoiceControls();
  resolveCurrentAudioPlaybackResumeWaiters();
}

function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function stopAskMicrophone({ preserveStatus = false } = {}) {
  const activeSurface = getActiveAskSurface();
  if (currentSpeechRecognition) {
    currentSpeechRecognition.onresult = null;
    currentSpeechRecognition.onerror = null;
    currentSpeechRecognition.onend = null;
    currentSpeechRecognition.stop();
    currentSpeechRecognition = null;
  }
  state.askMicActive = false;
  if (!preserveStatus && activeSurface?.response?.textContent === "Listening for your question...") {
    setAskSurfaceStatus(activeSurface, getStoredAskAnswer(activeSurface) ? getAskReadyStatus() : getAskIdleStatus(activeSurface));
  }
  renderAskVoiceControls();
}

function startAskMicrophone() {
  const activeSurface = getActiveAskSurface();
  const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();
  if (!SpeechRecognitionConstructor) {
    setAskSurfaceStatus(activeSurface, "Microphone input is not available in this browser.");
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
  setAskSurfaceStatus(activeSurface, "Listening for your question...");
  renderAskVoiceControls();

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results || [])
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();
    if (activeSurface?.input) {
      activeSurface.input.value = transcript;
    }
    if (activeSurface?.kind === "landing") {
      state.subjectLandingAskDraft = transcript;
    }
    if (event.results?.[event.results.length - 1]?.isFinal && transcript) {
      setAskSurfaceStatus(activeSurface, getAskConfirmTranscriptStatus());
      stopAskMicrophone({ preserveStatus: true });
    }
  };

  recognition.onerror = (event) => {
    state.askMicActive = false;
    currentSpeechRecognition = null;
    const message = event?.error === "not-allowed"
      ? "Microphone permission was denied."
      : "Voice input failed. Try again or type your question.";
    setAskSurfaceStatus(activeSurface, message);
    renderAskVoiceControls();
  };

  recognition.onend = () => {
    currentSpeechRecognition = null;
    state.askMicActive = false;
    renderAskVoiceControls();
  };

  recognition.start();
}

async function speakTextWithOpenAi(text, { context = "document", documentId = null, statusMessages = {}, onChunkStart = null, onFinished = null, chunksOverride = null, onStatusChange = null, statusElement = null } = {}) {
  stopListening();
  const textToRead = normaliseSpeechText(text);
  if (!textToRead) {
    throw new Error("There is no readable text available yet.");
  }

  const listenSessionId = Date.now();
  currentListenSessionId = listenSessionId;
  currentAudioContext = context === "document" && documentId ? `document:${documentId}` : context;
  currentAudioPlaybackMode = "";
  state.listeningDocumentId = context === "document" ? documentId : null;
  state.askResponseSpeaking = context === "ask";
  state.askResponsePaused = false;
  renderDocuments();
  renderAskVoiceControls();
  if (statusElement) {
    statusElement.textContent = statusMessages.preparing || "Preparing audio...";
  } else if (elements.askResponse) {
    elements.askResponse.textContent = statusMessages.preparing || "Preparing audio...";
  }
  if (typeof onStatusChange === "function") {
    onStatusChange("pending", statusMessages.preparing || "Preparing audio...");
  }
  await ensureAiSpeechPlaybackReady();

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
    await waitForCurrentAudioPlaybackResume(listenSessionId);
    if (currentListenSessionId !== listenSessionId) {
      return;
    }

    if (typeof onChunkStart === "function") {
      onChunkStart(chunks[chunkIndex], chunkIndex);
    }

    await playSpeechChunk(chunks[chunkIndex], {
      listenSessionId,
      statusMessages,
      onStatusChange,
      statusElement
    });
  }

  if (typeof onFinished === "function") {
    onFinished();
  }
  stopListening();
  renderDocuments();
}

function getAiSpeechPlaybackContext() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (typeof AudioContextConstructor !== "function") {
    return null;
  }
  if (!aiSpeechPlaybackContext) {
    aiSpeechPlaybackContext = new AudioContextConstructor();
  }
  return aiSpeechPlaybackContext;
}

async function ensureAiSpeechPlaybackReady() {
  const audioContext = getAiSpeechPlaybackContext();
  if (!audioContext) {
    await primeAiSpeechPlaybackElement();
    return;
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  await primeAiSpeechPlaybackElement();
}

function ensureAiSpeechPlaybackElement() {
  if (currentAudioPlayback && currentAudioPlayback instanceof HTMLAudioElement) {
    return currentAudioPlayback;
  }

  const playbackElement = document.createElement("audio");
  playbackElement.preload = "auto";
  playbackElement.playsInline = true;
  playbackElement.setAttribute("aria-hidden", "true");
  playbackElement.style.position = "fixed";
  playbackElement.style.width = "0";
  playbackElement.style.height = "0";
  playbackElement.style.opacity = "0";
  playbackElement.style.pointerEvents = "none";
  playbackElement.style.inset = "auto";
  document.body.appendChild(playbackElement);
  currentAudioPlayback = playbackElement;
  return playbackElement;
}

async function primeAiSpeechPlaybackElement() {
  if (aiSpeechPlaybackPrimed) {
    return;
  }

  const playbackElement = ensureAiSpeechPlaybackElement();
  playbackElement.muted = true;
  playbackElement.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  try {
    await playbackElement.play();
  } catch (error) {
    console.warn("AI audio priming was blocked.", error);
  }
  playbackElement.pause();
  playbackElement.currentTime = 0;
  playbackElement.removeAttribute("src");
  playbackElement.load();
  playbackElement.muted = false;
  aiSpeechPlaybackPrimed = true;
}

async function playSpeechBlobThroughAudioElement(speechBlob, { statusMessages = {}, onStatusChange = null, statusElement = null } = {}) {
  const playbackElement = ensureAiSpeechPlaybackElement();
  if (currentAudioObjectUrl) {
    URL.revokeObjectURL(currentAudioObjectUrl);
  }
  currentAudioObjectUrl = URL.createObjectURL(speechBlob);
  playbackElement.pause();
  playbackElement.onended = null;
  playbackElement.onerror = null;
  playbackElement.src = currentAudioObjectUrl;
  playbackElement.defaultPlaybackRate = aiSpeechPlaybackRate;
  playbackElement.playbackRate = aiSpeechPlaybackRate;
  currentAudioPlaybackMode = "audio-element";
  playbackElement.load();

  await new Promise((resolve, reject) => {
    const handleReady = () => {
      playbackElement.removeEventListener("canplay", handleReady);
      playbackElement.removeEventListener("error", handleError);
      resolve();
    };
    const handleError = () => {
      playbackElement.removeEventListener("canplay", handleReady);
      playbackElement.removeEventListener("error", handleError);
      reject(new Error(statusMessages.error || "AI voice playback failed."));
    };

    if (playbackElement.readyState >= 2) {
      resolve();
      return;
    }

    playbackElement.addEventListener("canplay", handleReady, { once: true });
    playbackElement.addEventListener("error", handleError, { once: true });
  });

  await playbackElement.play();
  if (statusElement) {
    statusElement.textContent = statusMessages.playing || "Reading...";
  } else if (elements.askResponse) {
    elements.askResponse.textContent = statusMessages.playing || "Reading...";
  }
  if (typeof onStatusChange === "function") {
    onStatusChange("playing", statusMessages.playing || "Reading...");
  }

  await new Promise((resolve, reject) => {
    playbackElement.onended = () => resolve();
    playbackElement.onerror = () => reject(new Error(statusMessages.error || "AI voice playback failed."));
  });
}

async function playSpeechChunk(chunkText, { listenSessionId, statusMessages = {}, onStatusChange = null, statusElement = null } = {}) {
  await waitForCurrentAudioPlaybackResume(listenSessionId);
  if (currentListenSessionId !== listenSessionId) {
    return;
  }

  const speechBlob = await requestApi("/api/speak", { text: chunkText }, true);

  if (currentListenSessionId !== listenSessionId) {
    return;
  }

  await waitForCurrentAudioPlaybackResume(listenSessionId);
  if (currentListenSessionId !== listenSessionId) {
    return;
  }

  try {
    await playSpeechBlobThroughAudioElement(speechBlob, { statusMessages, onStatusChange, statusElement });
    return;
  } catch (error) {
    console.warn("DOM audio playback failed, retrying with AudioContext.", error);
  }

  const audioContext = getAiSpeechPlaybackContext();
  if (!audioContext) {
    throw new Error(statusMessages.error || "AI voice playback failed.");
  }

  const speechData = await speechBlob.arrayBuffer();
  if (currentListenSessionId !== listenSessionId) {
    return;
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const decodedBuffer = await audioContext.decodeAudioData(speechData.slice(0));
  if (currentListenSessionId !== listenSessionId) {
    return;
  }

  await new Promise((resolve, reject) => {
    const source = audioContext.createBufferSource();
    currentAudioBufferSource = source;
    currentAudioPlaybackMode = "audio-context";
    source.buffer = decodedBuffer;
    source.playbackRate.value = aiSpeechPlaybackRate;
    source.connect(audioContext.destination);
    source.onended = () => {
      if (currentAudioBufferSource === source) {
        currentAudioBufferSource = null;
      }
      resolve();
    };

    try {
      if (statusElement) {
        statusElement.textContent = statusMessages.playing || "Reading...";
      } else if (elements.askResponse) {
        elements.askResponse.textContent = statusMessages.playing || "Reading...";
      }
      if (typeof onStatusChange === "function") {
        onStatusChange("playing", statusMessages.playing || "Reading...");
      }
      source.start(0);
    } catch (error) {
      if (currentAudioBufferSource === source) {
        currentAudioBufferSource = null;
      }
      reject(error);
    }
  });
}

function currentDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function currentWeekKey(date = new Date()) {
  const weekDate = new Date(date);
  const day = weekDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekDate.setHours(0, 0, 0, 0);
  weekDate.setDate(weekDate.getDate() + mondayOffset);
  return `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, "0")}-${String(weekDate.getDate()).padStart(2, "0")}`;
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
    grammar: getSubjectGrammarPendingSessionCount(subject),
    writing: getSubjectWritingPendingSectionCount(subject),
    watch: getSubjectWatchLinks(subject).length,
    assessments: getActiveSubjectAssessments(subject).length
  };
}

function getAvailableSubjectTabs(subject) {
  return subject?.id === "spelling"
    ? ["spelling", "grammar", "writing"]
    : subject?.id === "english"
      ? ["reader", "homework", "watch", "assessments"]
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

function shouldShowSubjectLanding(subject = getSelectedSubject()) {
  return Boolean(
    subject &&
    state.currentView === "subjects" &&
    (!state.subjectWorkspaceExpanded || state.subjectWorkspaceExpandedSubjectId !== subject.id)
  );
}

function resetSubjectWorkspaceView() {
  state.subjectWorkspaceExpanded = false;
  state.subjectWorkspaceExpandedSubjectId = "";
  state.subjectWorkspaceReturnLandingSubjectId = "";
  state.subjectLandingOpenDocumentId = "";
  state.subjectLandingView = "simple";
  state.subjectLandingPieceIndex = 0;
  state.subjectLandingSubjectMenuOpen = false;
  closeSubjectLandingAsk();
}

function expandSubjectWorkspace(tab = null) {
  const subject = getSelectedSubject();
  const availableTabs = getAvailableSubjectTabs(subject);
  if (tab && availableTabs.includes(tab)) {
    state.activeSubjectTab = tab;
  }
  state.subjectWorkspaceExpanded = true;
  state.subjectWorkspaceExpandedSubjectId = subject?.id || "";
  state.focusAskOpen = false;
  state.focusArea = null;
  render();
}

function getHomeFocusSubjectStatus(subject) {
  const unreadCount = getAllDocumentBundles(subject).filter((bundle) => !bundle.reviewed).length;
  const remainingHomeworkCount = getSubjectHomeworkBundles(subject).filter(
    (bundle) => getTextCompletionRatio(bundle.workNotes, 350) < 1
  ).length;
  const activeAssessmentCount = getActiveSubjectAssessments(subject).length;
  const spellingPendingCount = getSpellingPendingActivityCount(subject);
  const grammarPendingCount = getSubjectGrammarPendingSessionCount(subject);
  const writingPendingCount = getSubjectWritingPendingSectionCount(subject);
  const waitingCount = unreadCount + remainingHomeworkCount + activeAssessmentCount + spellingPendingCount + grammarPendingCount + writingPendingCount;
  const summary = subject?.id === "spelling" && grammarPendingCount && waitingCount === grammarPendingCount
    ? "Grammar ready"
    : subject?.id === "spelling" && writingPendingCount && waitingCount === writingPendingCount
      ? "Writing ready"
    : spellingPendingCount && waitingCount === spellingPendingCount
      ? `${spellingPendingCount} spelling ${spellingPendingCount === 1 ? "stage" : "stages"}`
      : grammarPendingCount
        ? `${waitingCount} to do · grammar ready`
        : writingPendingCount
          ? `${waitingCount} to do · writing ready`
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
  const grammarPending = getSubjectGrammarPendingSessionCount(subject);
  const writingPending = getSubjectWritingPendingSectionCount(subject);
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
          : ""
        : "ready in the Practice subject when you want focused pattern practice."
    };
  }

  if (tab === "grammar") {
    return {
      big: "Grammar",
      rest: grammarPending
        ? "Your next activity is ready to go."
        : "Grammar will be ready here when the subject is enabled."
    };
  }

  if (tab === "writing") {
    const writing = getSubjectWritingState(subject);
    const currentSection = getWritingCurrentSection(writing);
    const focusLabel = writing.view === "book"
      ? "book preview"
      : currentSection
        ? `section ${currentSection.number}`
        : "your story";
    return {
      big: `${writingPending} ${writingPending === 1 ? "section" : "sections"}`,
      rest: writingPending
        ? `left in ${WRITING_STUDIO_TAB_LABEL} — current focus: ${focusLabel}.`
        : "complete in Writing Studio — your picture book is ready to revisit."
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
  const practiceThings = state.subjects.reduce(
    (total, subject) =>
      total
      + getSpellingPendingActivityCount(subject)
      + getSubjectGrammarPendingSessionCount(subject)
      + getSubjectWritingPendingSectionCount(subject),
    0
  );
  const totalThings = unreadDocumentMetrics.unread + homeworkMetrics.remaining + assessmentMetrics.upcoming + practiceThings;
  const nextEntry = getNextAssessmentEntry();
  const daysUntil = nextEntry?.dueDateObject ? getDaysUntilDate(nextEntry.dueDateObject) : 0;

  elements.homeHeroDate.textContent = formatHeroDate();
  if (shouldUseHomeFocusUi()) {
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
      selectSubjectForSubjectsView(subject.id, { returnToHome: false });
    });
  });
}

function renderDocumentBulkActions(subject) {
  const documentIds = getSelectableDocumentsForTable(subject).map((documentRecord) => documentRecord.id);
  state.selectedDocumentIds = state.selectedDocumentIds.filter((documentId) => documentIds.includes(documentId));
  const allSelected = Boolean(documentIds.length) && state.selectedDocumentIds.length === documentIds.length;
  elements.documentsSelectAllButton.disabled = !documentIds.length;
  elements.documentsDeleteSelectedButton.disabled = !state.selectedDocumentIds.length;
  elements.documentsSelectAllButton.textContent = allSelected ? "Clear selection" : "Select all";
}

function renderAskContext() {
  const subject = getSelectedSubject();
  const askDocument = getAskDocument();
  if (elements.askContext) {
    elements.askContext.textContent = askDocument
      ? `Asking about: ${askDocument.title}`
      : "No document selected for Ask yet.";
  }
  if (elements.askResponse) {
    const dockStatus = subject && state.askStatusSubjectId === subject.id ? state.askStatus : "";
    elements.askResponse.textContent = dockStatus || (subject ? getAskIdleStatus(getDockAskSurface()) : "Pick a subject to start Ask Panda.");
  }
  const landingSurface = getSubjectLandingAskSurface();
  if (landingSurface?.context) {
    landingSurface.context.textContent = getLandingAskContextLabel(getSubjectLandingOpenDocument(subject));
  }
  if (landingSurface?.response) {
    const landingResponse = state.subjectLandingAskStatus || getAskIdleStatus(landingSurface);
    landingSurface.response.textContent = landingResponse;
  }
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
  const documentCount = getAllReaderDocuments(getSelectedSubject() || { documents: [] }).length || 0;
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

function renderDocumentGroupRows(group, { reviewedSection = false, revisionSection = false } = {}) {
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
        <tr class="${document.id === state.selectedDocumentId ? "is-selected" : ""}${state.selectedDocumentIds.includes(document.id) ? " is-bulk-selected" : ""}${reviewedSection ? " documents-row--reviewed" : ""}${revisionSection ? " documents-row--revision" : ""}">
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
            <label class="document-review-toggle document-review-toggle--revision">
              <input
                type="checkbox"
                data-document-revision-id="${document.id}"
                ${document.revisionArchived ? "checked" : ""}
              />
              <span>${document.revisionArchived ? "In revision" : "Add to revision"}</span>
            </label>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="table-action" data-action="read" data-document-id="${document.id}">Read</button>
              <button type="button" class="table-action" data-action="listen" data-document-id="${document.id}">
                ${state.listeningDocumentId === document.id ? "Stop" : "Listen"}
              </button>
              <button type="button" class="table-action" data-action="ask" data-document-id="${document.id}">Ask</button>
              <button type="button" class="table-action" data-action="revision" data-document-id="${document.id}">
                ${document.revisionArchived ? "Remove from revision" : "Add to revision"}
              </button>
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

  const sortedDocuments = getReaderDocuments(subject);
  const revisionDocuments = getRevisionReaderDocuments(subject);
  const allReaderDocuments = [...sortedDocuments, ...revisionDocuments];
  const revisionSectionExpanded = isRevisionSectionExpanded(subject);

  if (!allReaderDocuments.length) {
    elements.documentsBody.innerHTML = `
      <tr>
        <td colspan="7">
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
  const revisionGroups = getDocumentGroupsFromDocuments(revisionDocuments);
  const unreadGroups = getDocumentGroupsFromDocuments(unreadDocuments);
  const reviewedGroups = getDocumentGroupsFromDocuments(reviewedDocuments);

  if (!allReaderDocuments.find((doc) => doc.id === state.selectedDocumentId)) {
    state.selectedDocumentId = sortedDocuments[0]?.id || revisionDocuments[0]?.id || null;
  }

  if (!allReaderDocuments.find((doc) => doc.id === state.askDocumentId)) {
    state.askDocumentId = sortedDocuments[0]?.id || revisionDocuments[0]?.id || null;
  }

  const visibleUnreadGroups = state.documentsExpanded ? unreadGroups : unreadGroups.slice(0, 6);
  const combinedGroupMap = new Map(
    [...visibleUnreadGroups, ...reviewedGroups, ...(revisionSectionExpanded ? revisionGroups : [])]
      .map((group) => [group.id, group])
  );
  const rowsMarkup = [
    `
      <tr class="documents-section-row">
        <td colspan="7">Newly uploaded</td>
      </tr>
    `,
    visibleUnreadGroups.length
      ? visibleUnreadGroups.map((group) => renderDocumentGroupRows(group)).join("")
      : `
        <tr class="documents-empty-row">
          <td colspan="7"><div class="empty-state">No new documents waiting to be read.</div></td>
        </tr>
      `,
    reviewedGroups.length
      ? `
        <tr class="documents-section-row documents-section-row--reviewed">
          <td colspan="7">Read / listened</td>
        </tr>
        ${reviewedGroups.map((group) => renderDocumentGroupRows(group, { reviewedSection: true })).join("")}
      `
      : "",
    revisionGroups.length
      ? `
        <tr class="documents-section-row documents-section-row--revision">
          <td colspan="7">
            <button type="button" class="documents-folder-toggle" data-documents-revision-toggle="true" aria-expanded="${revisionSectionExpanded ? "true" : "false"}">
              <span>Revision</span>
              <span>${escapeHtml(`${revisionGroups.length} item${revisionGroups.length === 1 ? "" : "s"}`)}</span>
            </button>
          </td>
        </tr>
        ${revisionSectionExpanded
          ? revisionGroups.map((group) => renderDocumentGroupRows(group, { revisionSection: true })).join("")
          : ""}
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

  elements.documentsBody.querySelectorAll("[data-document-revision-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const documentRecord = subject.documents.find((doc) => doc.id === checkbox.dataset.documentRevisionId);
      if (!documentRecord) {
        return;
      }
      setDocumentRevisionArchivedState(subject, [documentRecord.id], checkbox.checked);
      renderDocuments();
      renderReader();
      renderSubjectsHero();
      renderDockContext();
    });
  });

  elements.documentsBody.querySelector("[data-documents-revision-toggle]")?.addEventListener("click", () => {
    state.documentsRevisionExpanded = !state.documentsRevisionExpanded;
    renderDocuments();
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
        openAskForDocument(documentRecord);
      }

      if (button.dataset.action === "revision") {
        setDocumentRevisionArchivedState(subject, [documentRecord.id], !documentRecord.revisionArchived);
        renderDocuments();
        renderReader();
        renderSubjectsHero();
        renderDockContext();
        return;
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
  const readabilityWarning = getDocumentReadabilityWarning(selectedDocument);
  const readabilityWarningMarkup = readabilityWarning
    ? `
      <div class="empty-state empty-state--compact">
        ${escapeHtml(readabilityWarning)}
      </div>
    `
    : "";

  if (selectedDocument.flags?.homework) {
    elements.readerContent.innerHTML = `
      ${reviewToggleMarkup}
      ${readabilityWarningMarkup}
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
    if (subject && !hasCurrentDocumentStudyPlan(selectedDocument)) {
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
      ${readabilityWarningMarkup}
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
    ${readabilityWarningMarkup}
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

function playGrammarPassageAudio(paragraphs = [], { context = "grammar:passage", onParagraphStart = null, onFinished = null, onError = null, onStatusChange = null } = {}) {
  const cleanedParagraphs = (Array.isArray(paragraphs) ? paragraphs : [])
    .map((paragraph) => normaliseSpeechText(paragraph))
    .filter(Boolean);
  if (!cleanedParagraphs.length) {
    return Promise.reject(new Error("There is no readable text available for this passage yet."));
  }

  return speakTextWithOpenAi(cleanedParagraphs.join("\n\n"), {
    context,
    statusMessages: {
      preparing: "Preparing passage audio...",
      playing: "Reading passage...",
      error: "AI voice playback failed for this passage."
    },
    chunksOverride: cleanedParagraphs,
    onChunkStart: (_chunk, chunkIndex) => {
      if (typeof onParagraphStart === "function") {
        onParagraphStart(chunkIndex);
      }
    },
    onFinished,
    onStatusChange
  }).catch((error) => {
    if (typeof onError === "function") {
      onError(error);
    }
    throw error;
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
        openAskForDocument(selectedDocument, {
          preferOriginalView: Boolean(getDocumentPages(selectedDocument).length)
        });
      }
    });
  });
}

function stopListening() {
  currentListenSessionId += 1;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudioBufferSource) {
    currentAudioBufferSource.onended = null;
    currentAudioBufferSource.disconnect();
    try {
      currentAudioBufferSource.stop(0);
    } catch (error) {
      console.debug("Audio buffer source was already stopped.", error);
    }
    currentAudioBufferSource = null;
  }
  if (currentAudioPlayback) {
    currentAudioPlayback.onended = null;
    currentAudioPlayback.onerror = null;
    currentAudioPlayback.pause();
    currentAudioPlayback.removeAttribute("src");
    currentAudioPlayback.load();
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
  if (state.askResponsePaused) {
    state.askResponsePaused = false;
  }
  if (state.activeReaderSegmentIndex !== -1 || state.activeReaderSectionId) {
    state.activeReaderSegmentIndex = -1;
    state.activeReaderSectionId = "";
  }
  currentAudioContext = "";
  currentAudioPlaybackMode = "";
  resolveCurrentAudioPlaybackResumeWaiters();
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
  const nextPageIndexes = { ...(state.currentDocumentPageIndexes || {}) };
  uniqueDocumentIds.forEach((documentId) => {
    delete nextPageIndexes[documentId];
  });
  const shouldResetSubjectLanding = documentRecordsToDelete.some((documentRecord) => {
    const bundleId = documentRecord.uploadGroupId || documentRecord.id;
    return state.subjectLandingOpenDocumentId === documentRecord.id || state.subjectLandingOpenDocumentId === bundleId;
  });

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
    state.selectedDocumentId = getReaderDocuments(subject)[0]?.id || getRevisionReaderDocuments(subject)[0]?.id || null;
  }
  if (uniqueDocumentIds.includes(state.askDocumentId)) {
    state.askDocumentId = getReaderDocuments(subject)[0]?.id || getRevisionReaderDocuments(subject)[0]?.id || null;
  }
  state.currentDocumentPageIndexes = nextPageIndexes;
  if (shouldResetSubjectLanding) {
    state.subjectLandingOpenDocumentId = "";
    state.subjectLandingView = "simple";
    state.subjectLandingPieceIndex = 0;
    state.subjectLandingSubjectMenuOpen = false;
    closeSubjectLandingAsk();
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
  if (elements.upcomingModalEyebrow) {
    elements.upcomingModalEyebrow.textContent = isAllYearMode ? "Full year" : "Next 14 days";
  }
  if (elements.upcomingModalTitle) {
    elements.upcomingModalTitle.textContent = isAllYearMode ? "Assessment calendar" : "Upcoming assessments";
  }
  elements.upcomingModalSummary.textContent = isAllYearMode
    ? `This is the full year assessment list across all subjects. Completed assessments remain visible here.`
    : upcomingEntries.length
      ? `Assessments due by ${formatAssessmentDate(fortnightEnd)}.`
      : `No assessments fall in the next fortnight ending ${formatAssessmentDate(fortnightEnd)}.`;
  elements.toggleUpcomingModeButton.textContent = isAllYearMode
    ? "Back to next fortnight"
    : "View all assessments for the year";
  syncTopbarNavigationState();

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

function buildWritingStoryTitle(openingAnswers = {}) {
  const who = String(openingAnswers.who || "").trim();
  const where = String(openingAnswers.where || "").trim().toLowerCase();
  if (where.includes("lighthouse")) {
    return "The Lighthouse Door";
  }
  if (who) {
    return `${who.split(/\s+/).filter(Boolean)[0]} and the Hidden Path`;
  }
  return "My Picture Book";
}

function buildWritingOpeningSentence(openingAnswers = {}) {
  const who = String(openingAnswers.who || "").trim();
  const where = String(openingAnswers.where || "").trim();
  const want = String(openingAnswers.want || "").trim();
  return `${who || "Someone"} stood in ${where || "a strange place"}, hoping to ${want || "discover something important"}.`;
}

function getWritingCompletedSectionCount(writing) {
  return (writing.sections || []).filter((section) => section.completed).length;
}

function getSubjectWritingPendingSectionCount(subject) {
  const writing = getSubjectWritingState(subject);
  if (!writing.enabled) {
    return 0;
  }
  return Math.max(0, WRITING_STUDIO_SECTION_COUNT - getWritingCompletedSectionCount(writing));
}

function getWritingCurrentSection(writing) {
  return writing.sections[writing.currentSectionIndex] || writing.sections[0] || null;
}

function getWritingCompletedSections(writing) {
  return (writing.sections || []).filter((section) => section.completed && String(section.text || "").trim());
}

function getWritingSectionIllustrationOptions(section) {
  return Array.isArray(section?.illustrationOptions) ? section.illustrationOptions : [];
}

function getWritingSectionSelectedIllustration(section) {
  const options = getWritingSectionIllustrationOptions(section);
  return options.find((option) => option.id === String(section?.selectedIllustrationId || "")) || options[0] || null;
}

function syncWritingBookPreviewToSection(writing, sectionId = "") {
  const completedSections = getWritingCompletedSections(writing);
  const nextPreviewIndex = completedSections.findIndex((section) => section.id === sectionId);
  writing.bookPreviewIndex = Math.max(0, nextPreviewIndex >= 0 ? nextPreviewIndex : Number(writing.bookPreviewIndex || 0));
  return completedSections;
}

function buildWritingSectionSuggestion(writing, sectionIndex) {
  const currentSection = writing.sections[sectionIndex];
  const previousSection = sectionIndex > 0 ? writing.sections[sectionIndex - 1] : null;
  const who = String(writing.openingAnswers.who || "your character").trim();
  if (sectionIndex === 0) {
    return `Start by showing ${who} in the setting and hint at what they want.`;
  }
  const excerpt = String(previousSection?.text || "").trim();
  const lastSentence = excerpt.split(/(?<=[.!?])\s+/).filter(Boolean).slice(-1)[0] || excerpt;
  return lastSentence
    ? `Use what happened before, then add the next step. For example: ${clipText(lastSentence, 90)}`
    : currentSection?.hint || WRITING_STUDIO_SECTION_HINTS[sectionIndex] || WRITING_STUDIO_SECTION_HINTS[0];
}

function buildWritingIllustrationOption(section, option) {
  return {
    id: `${section.id}-illustration-${option.styleId || option.label}-${Math.abs(option.prompt.split("").reduce((total, character) => total + character.charCodeAt(0), 0))}`,
    prompt: option.prompt,
    imageUrl: "",
    label: option.label,
    description: option.description,
    styleId: option.styleId || "",
    styleLabel: option.styleLabel || option.label,
    styleBrief: option.styleBrief || option.description
  };
}

function getExpectedWritingIllustrationCount(writing, sectionIndex) {
  if (sectionIndex === 0) {
    return WRITING_STUDIO_STYLE_VARIANTS.length;
  }
  return writing.illustrationStyle?.label && writing.illustrationStyle?.brief ? 2 : WRITING_STUDIO_STYLE_VARIANTS.length;
}

function hasCurrentWritingStyleVariantSet(options) {
  if (!Array.isArray(options) || options.length !== WRITING_STUDIO_STYLE_VARIANTS.length) {
    return false;
  }
  const optionStyleIds = new Set(options.map((option) => String(option?.styleId || "")));
  return WRITING_STUDIO_STYLE_VARIANTS.every((style) => optionStyleIds.has(style.id));
}

function shouldRefreshWritingIllustrationOptions(writing, sectionIndex, section) {
  const options = Array.isArray(section?.illustrationOptions) ? section.illustrationOptions : [];
  if (!options.length) {
    return true;
  }
  if (options.length !== getExpectedWritingIllustrationCount(writing, sectionIndex)) {
    return true;
  }
  if (sectionIndex === 0 && !hasCurrentWritingStyleVariantSet(options)) {
    return true;
  }
  return false;
}

function hasCompleteWritingIllustrationImages(writing, sectionIndex, section) {
  if (shouldRefreshWritingIllustrationOptions(writing, sectionIndex, section)) {
    return false;
  }
  const options = Array.isArray(section?.illustrationOptions) ? section.illustrationOptions : [];
  return options.every((option) => String(option?.imageUrl || "").trim());
}

function buildWritingIllustrationStyleSelection(section, option) {
  if (!option) {
    return null;
  }
  return {
    styleId: String(option.styleId || ""),
    label: String(option.styleLabel || option.label || "").trim(),
    brief: String(option.styleBrief || option.description || "").trim(),
    prompt: String(option.prompt || "").trim(),
    imageUrl: String(option.imageUrl || "").trim(),
    sourceSectionId: String(section?.id || "")
  };
}

function buildWritingIllustrationOptions(writing, sectionIndex) {
  const section = writing.sections[sectionIndex];
  const baseText = String(section?.text || "").trim() || buildWritingSectionSuggestion(writing, sectionIndex);
  const focusWord = String(writing.openingAnswers.who || "the character").trim();
  const sceneSummary = clipText(baseText.toLowerCase(), 72);
  const feedbackDirection = String(writing.imageFeedback || "").trim()
    ? `Required visual brief from the student: ${clipText(writing.imageFeedback, 180)}.`
    : "";

  if (sectionIndex === 0) {
    return WRITING_STUDIO_STYLE_VARIANTS.map((style) =>
      buildWritingIllustrationOption(section, {
        label: style.label,
        description: style.description,
        styleId: style.id,
        styleLabel: style.label,
        styleBrief: style.description,
        prompt: `${style.promptLead} ${feedbackDirection} Make the composition and materials unmistakably different from the other style options. Show ${focusWord} as ${sceneSummary}`
      })
    );
  }

  const lockedStyle = writing.illustrationStyle;
  if (lockedStyle?.label && lockedStyle?.brief) {
    return [
      {
        label: `${lockedStyle.label} · wide scene`,
        description: "Keep the same book style with a wider view of the setting.",
        styleId: lockedStyle.styleId,
        styleLabel: lockedStyle.label,
        styleBrief: lockedStyle.brief,
        prompt: `Keep the exact established ${lockedStyle.label.toLowerCase()} picture-book look. ${lockedStyle.brief} ${feedbackDirection} Show a wide scene of ${focusWord} as ${sceneSummary}`
      },
      {
        label: `${lockedStyle.label} · character focus`,
        description: "Keep the same book style with a closer character moment.",
        styleId: lockedStyle.styleId,
        styleLabel: lockedStyle.label,
        styleBrief: lockedStyle.brief,
        prompt: `Keep the exact established ${lockedStyle.label.toLowerCase()} picture-book look. ${lockedStyle.brief} ${feedbackDirection} Show a close character-focused moment of ${focusWord} as ${sceneSummary}`
      }
    ].map((option) => buildWritingIllustrationOption(section, option));
  }

  return WRITING_STUDIO_STYLE_VARIANTS.map((style) =>
    buildWritingIllustrationOption(section, {
      label: style.label,
      description: style.description,
      styleId: style.id,
      styleLabel: style.label,
      styleBrief: style.description,
      prompt: `${style.promptLead} ${feedbackDirection} Show ${focusWord} as ${sceneSummary}`
    })
  );
}

function ensureWritingIllustrationOptions(writing, sectionIndex, { force = false } = {}) {
  const section = writing.sections[sectionIndex];
  if (!section) {
    return [];
  }
  if (
    !force
    && Array.isArray(section.illustrationOptions)
    && section.illustrationOptions.length
    && !shouldRefreshWritingIllustrationOptions(writing, sectionIndex, section)
  ) {
    if (!section.illustrationOptions.some((option) => option.id === section.selectedIllustrationId)) {
      section.selectedIllustrationId = section.illustrationOptions[0]?.id || "";
    }
    return section.illustrationOptions;
  }
  section.illustrationOptions = buildWritingIllustrationOptions(writing, sectionIndex);
  if (!section.illustrationOptions.some((option) => option.id === section.selectedIllustrationId)) {
    section.selectedIllustrationId = section.illustrationOptions[0]?.id || "";
  }
  return section.illustrationOptions;
}

function hasWritingIllustrationImages(section) {
  return Array.isArray(section?.illustrationOptions) && section.illustrationOptions.some((option) => String(option?.imageUrl || "").trim());
}

function getWritingSuggestionForText(text) {
  const source = String(text || "");
  for (const [wrong, correct] of Object.entries(WRITING_STUDIO_TYPOS)) {
    const match = source.match(new RegExp(`\\b${escapeRegex(wrong)}\\b`, "i"));
    if (match && match.index !== undefined) {
      return { wrong: match[0], correct, message: `Did you mean “${correct}”?` };
    }
  }
  const grammarMatch = source.match(/\ba ([aeiou][a-z]*)/i);
  if (grammarMatch) {
    return { wrong: grammarMatch[0], correct: `an ${grammarMatch[1]}`, message: `This should be “an ${grammarMatch[1]}”.` };
  }
  return null;
}

function updateWritingSuggestionState(writing, section) {
  if (!section) {
    writing.activeSuggestion = null;
    return;
  }
  const suggestion = getWritingSuggestionForText(section.text);
  writing.activeSuggestion = suggestion ? { sectionId: section.id, ...suggestion } : null;
}

function updateWritingOpeningAnswer(subject, field, value) {
  const writing = getSubjectWritingState(subject);
  if (!["who", "where", "want"].includes(String(field || ""))) {
    return;
  }
  writing.openingAnswers[field] = String(value || "");
  persistSubjects({ skipRemoteSync: true });
}

function updateWritingImageFeedback(subject, value) {
  const writing = getSubjectWritingState(subject);
  writing.imageFeedback = String(value || "").trimStart().slice(0, 280);
  persistSubjects({ skipRemoteSync: true });
}

function startWritingStory(subject) {
  const writing = getSubjectWritingState(subject);
  const who = String(writing.openingAnswers.who || "").trim();
  const where = String(writing.openingAnswers.where || "").trim();
  const want = String(writing.openingAnswers.want || "").trim();
  if (!who || !where || !want) {
    writing.coachMessage = "Answer all three story questions before you start writing.";
    persistSubjects();
    return;
  }
  writing.storyTitle = buildWritingStoryTitle(writing.openingAnswers);
  writing.currentSectionIndex = 0;
  writing.bookPreviewIndex = 0;
  writing.returnToBookAfterIllustration = false;
  writing.illustrationStyle = null;
  writing.view = "write";
  writing.illustrationError = "";
  writing.isGeneratingIllustrations = false;
  const firstSection = writing.sections[0];
  firstSection.text = firstSection.text || buildWritingOpeningSentence(writing.openingAnswers);
  updateWritingSuggestionState(writing, firstSection);
  writing.coachMessage = "Your opening line is ready. Shape it into the first section, then continue to illustration.";
  persistSubjects();
}

function updateWritingSectionText(subject, value) {
  const writing = getSubjectWritingState(subject);
  const section = getWritingCurrentSection(writing);
  if (!section) {
    return;
  }
  section.text = String(value || "");
  updateWritingSuggestionState(writing, section);
  persistSubjects({ skipRemoteSync: true });
}

function applyWritingSuggestion(subject) {
  const writing = getSubjectWritingState(subject);
  const section = getWritingCurrentSection(writing);
  const suggestion = writing.activeSuggestion;
  if (!section || !suggestion || suggestion.sectionId !== section.id) {
    return;
  }
  section.text = String(section.text || "").replace(suggestion.wrong, suggestion.correct);
  updateWritingSuggestionState(writing, section);
  writing.coachMessage = `${suggestion.correct} has been applied.`;
  persistSubjects();
}

function dismissWritingSuggestion(subject) {
  const writing = getSubjectWritingState(subject);
  writing.activeSuggestion = null;
  persistSubjects({ skipRemoteSync: true });
}

function openWritingSection(subject, sectionIndex, view = "write", { returnToBook = false, preserveReturnToBook = false } = {}) {
  const writing = getSubjectWritingState(subject);
  const nextIndex = Math.max(0, Math.min(WRITING_STUDIO_SECTION_COUNT - 1, Number(sectionIndex || 0) || 0));
  writing.currentSectionIndex = nextIndex;
  if (view === "book") {
    writing.bookPreviewIndex = nextIndex;
    writing.view = "book";
    writing.returnToBookAfterIllustration = false;
  } else if (view === "illustrate") {
    writing.view = "illustrate";
    writing.returnToBookAfterIllustration = preserveReturnToBook ? Boolean(writing.returnToBookAfterIllustration) : Boolean(returnToBook);
  } else {
    writing.view = "write";
    writing.returnToBookAfterIllustration = preserveReturnToBook ? Boolean(writing.returnToBookAfterIllustration) : Boolean(returnToBook);
    updateWritingSuggestionState(writing, getWritingCurrentSection(writing));
  }
  writing.illustrationError = "";
  persistSubjects({ skipRemoteSync: true });
}

function moveWritingSection(subject, direction, view = "write") {
  const writing = getSubjectWritingState(subject);
  const nextIndex = Math.max(
    0,
    Math.min(WRITING_STUDIO_SECTION_COUNT - 1, Number(writing.currentSectionIndex || 0) + Number(direction || 0))
  );
  openWritingSection(subject, nextIndex, view, { preserveReturnToBook: true });
}

function returnWritingToBook(subject) {
  const writing = getSubjectWritingState(subject);
  const currentSection = getWritingCurrentSection(writing);
  syncWritingBookPreviewToSection(writing, currentSection?.id || "");
  writing.view = "book";
  writing.returnToBookAfterIllustration = false;
  persistSubjects({ skipRemoteSync: true });
}

async function loadWritingIllustrations(subject, { force = false } = {}) {
  const writing = getSubjectWritingState(subject);
  const section = getWritingCurrentSection(writing);
  if (!section || !String(section.text || "").trim()) {
    writing.illustrationError = "Write this section before generating illustrations.";
    persistSubjects();
    return [];
  }
  const baseOptions = ensureWritingIllustrationOptions(writing, writing.currentSectionIndex, { force });
  if (!force && hasCompleteWritingIllustrationImages(writing, writing.currentSectionIndex, section)) {
    return section.illustrationOptions;
  }
  writing.isGeneratingIllustrations = true;
  writing.illustrationError = "";
  writing.view = "illustrate";
  writing.coachMessage = "Generating illustration options for this section...";
  persistSubjects({ skipRemoteSync: true });

  const previousSection = writing.currentSectionIndex > 0 ? writing.sections[writing.currentSectionIndex - 1] : null;
  try {
    const payload = await requestApi("/api/writing/illustrations", {
      storyTitle: writing.storyTitle,
      sectionNumber: section.number,
      sectionText: section.text,
      openingAnswers: writing.openingAnswers,
      imageFeedback: writing.imageFeedback,
      previousSectionText: previousSection?.text || "",
      prompts: baseOptions.map((option) => option.prompt),
      styleGuide: writing.illustrationStyle && writing.currentSectionIndex > 0
        ? {
            label: writing.illustrationStyle.label,
            brief: writing.illustrationStyle.brief,
            prompt: writing.illustrationStyle.prompt
          }
        : null
    }, false, {
      timeoutMs: 70_000,
      timeoutMessage: "Illustration generation took too long. Try again."
    });
    const generatedOptions = Array.isArray(payload?.options) ? payload.options : [];
    section.illustrationOptions = baseOptions.map((option, index) => ({
      ...option,
      imageUrl: String(generatedOptions[index]?.imageUrl || "")
    }));
    const generatedCount = section.illustrationOptions.filter((option) => String(option.imageUrl || "").trim()).length;
    if (!section.illustrationOptions.some((option) => option.id === section.selectedIllustrationId)) {
      section.selectedIllustrationId = section.illustrationOptions[0]?.id || "";
    }
    if (generatedCount) {
      writing.illustrationError = payload?.partialFailure ? String(payload.error || "Some illustration options could not be generated.") : "";
      writing.coachMessage = generatedCount === section.illustrationOptions.length
        ? (writing.currentSectionIndex === 0
          ? "Choose the look you want for the whole book."
          : "Pick the picture that matches your section best.")
        : "Some pictures are ready. You can choose one now or try generating again.";
    } else {
      writing.illustrationError = String(payload?.error || "Illustrations could not be generated.");
      writing.coachMessage = "Illustration generation failed. Try again in a moment.";
    }
  } catch (error) {
    writing.illustrationError = error instanceof Error ? error.message : "Illustrations could not be generated.";
    writing.coachMessage = "Illustration generation failed. Try again in a moment.";
  } finally {
    writing.isGeneratingIllustrations = false;
    persistSubjects();
  }

  return section.illustrationOptions;
}

async function continueWritingToIllustration(subject) {
  const writing = getSubjectWritingState(subject);
  const section = getWritingCurrentSection(writing);
  if (!section || !String(section.text || "").trim()) {
    writing.coachMessage = "Write today’s section before choosing an illustration.";
    persistSubjects();
    return;
  }
  writing.view = "illustrate";
  persistSubjects({ skipRemoteSync: true });
  await loadWritingIllustrations(subject, { force: !hasCompleteWritingIllustrationImages(writing, writing.currentSectionIndex, section) });
}

async function rerollWritingIllustrations(subject) {
  await loadWritingIllustrations(subject, { force: true });
}

function selectWritingIllustration(subject, illustrationId) {
  const writing = getSubjectWritingState(subject);
  const section = getWritingCurrentSection(writing);
  if (!section) {
    return;
  }
  section.selectedIllustrationId = String(illustrationId || "");
  persistSubjects({ skipRemoteSync: true });
}

function acceptWritingIllustration(subject) {
  const writing = getSubjectWritingState(subject);
  const section = getWritingCurrentSection(writing);
  if (!section) {
    return;
  }
  ensureWritingIllustrationOptions(writing, writing.currentSectionIndex);
  if (!section.selectedIllustrationId) {
    section.selectedIllustrationId = getWritingSectionIllustrationOptions(section)[0]?.id || "";
  }
  const selectedOption = getWritingSectionSelectedIllustration(section);
  if ((section.number === 1 || !writing.illustrationStyle) && selectedOption) {
    writing.illustrationStyle = buildWritingIllustrationStyleSelection(section, selectedOption);
  }
  const wasCompleted = Boolean(section.completed);
  section.completed = true;
  if (wasCompleted && writing.returnToBookAfterIllustration) {
    syncWritingBookPreviewToSection(writing, section.id);
    writing.view = "book";
    writing.returnToBookAfterIllustration = false;
    writing.coachMessage = `Section ${section.number} has been updated in your book.`;
  } else if (wasCompleted) {
    writing.view = "write";
    writing.returnToBookAfterIllustration = false;
    updateWritingSuggestionState(writing, section);
    writing.coachMessage = `Section ${section.number} has been updated.`;
  } else if (writing.currentSectionIndex >= WRITING_STUDIO_SECTION_COUNT - 1) {
    syncWritingBookPreviewToSection(writing, section.id);
    writing.view = "book";
    writing.returnToBookAfterIllustration = false;
    writing.coachMessage = "Your picture book is ready to preview and save as a PDF.";
  } else {
    writing.currentSectionIndex += 1;
    writing.view = "write";
    writing.returnToBookAfterIllustration = false;
    updateWritingSuggestionState(writing, getWritingCurrentSection(writing));
    writing.coachMessage = writing.illustrationStyle?.label
      ? `Section ${writing.currentSectionIndex + 1} is ready. Keep building the story in your ${writing.illustrationStyle.label.toLowerCase()} look.`
      : `Section ${writing.currentSectionIndex + 1} is ready. Build on what happened before.`;
  }
  persistSubjects();
}

function getSpellingWordProgressRows(spelling) {
  const aggregateByWordId = new Map();
  const appendWordResult = (result) => {
    const wordId = String(result?.wordId || "");
    const word = String(result?.word || "");
    if (!wordId || !word) {
      return;
    }
    if (!aggregateByWordId.has(wordId)) {
      aggregateByWordId.set(wordId, {
        word,
        attempts: 0,
        stageOneAttempt: "No answer",
        stageFiveAttempt: "Not rechecked",
        stageOneAccuracies: [],
        stageFiveAccuracies: [],
        improvements: []
      });
    }
    const entry = aggregateByWordId.get(wordId);
    entry.attempts += 1;
    entry.stageOneAttempt = String(result.stageOneAttempt || entry.stageOneAttempt || "No answer");
    entry.stageFiveAttempt = String(result.stageFiveAttempt || entry.stageFiveAttempt || "Not rechecked");
    entry.stageOneAccuracies.push(Math.max(0, Math.min(100, Number(result.stageOneAccuracy || 0) || 0)));
    entry.stageFiveAccuracies.push(Math.max(0, Math.min(100, Number(result.stageFiveAccuracy || 0) || 0)));
    entry.improvements.push(
      Math.max(0, Math.min(100, Number(result.stageFiveAccuracy || 0) || 0)) -
        Math.max(0, Math.min(100, Number(result.stageOneAccuracy || 0) || 0))
    );
  };

  (spelling.completedAttempts || []).forEach((attempt) => {
    (attempt.wordResults || []).forEach(appendWordResult);
  });

  return Array.from(aggregateByWordId.values())
    .map((entry) => {
      const stageFiveAccuracy = entry.stageFiveAccuracies.length
        ? Math.round(entry.stageFiveAccuracies.reduce((sum, value) => sum + value, 0) / entry.stageFiveAccuracies.length)
        : 0;
      const stageOneAccuracy = entry.stageOneAccuracies.length
        ? Math.round(entry.stageOneAccuracies.reduce((sum, value) => sum + value, 0) / entry.stageOneAccuracies.length)
        : 0;
      const improvement = entry.improvements.length
        ? Math.round(entry.improvements.reduce((sum, value) => sum + value, 0) / entry.improvements.length)
        : 0;
      return {
        word: entry.word,
        attempts: entry.attempts,
        stageOneAttempt: entry.stageOneAttempt,
        stageFiveAttempt: entry.stageFiveAttempt,
        stageOneAccuracy,
        stageFiveAccuracy,
        improvement,
        rating: `${stageFiveAccuracy}%`,
        ratingClass: stageFiveAccuracy >= 80 ? "is-correct" : stageFiveAccuracy >= 50 ? "" : "is-incorrect"
      };
    })
    .sort((left, right) => left.word.localeCompare(right.word));
}

function getSpellingCompletedInstanceRows(spelling) {
  return (spelling.completedAttempts || [])
    .map((attempt, index) => {
      const completedAt = String(attempt?.completedAt || "");
      const completedAtDate = completedAt ? new Date(completedAt) : null;
      const wordResults = Array.isArray(attempt.wordResults)
        ? attempt.wordResults
            .map((result) => ({
              wordId: String(result?.wordId || ""),
              word: String(result?.word || ""),
              stageOneAttempt: String(result?.stageOneAttempt || "No answer"),
              stageFiveAttempt: String(result?.stageFiveAttempt || "No answer"),
              stageOneAccuracy: Math.max(0, Math.min(100, Number(result?.stageOneAccuracy || 0) || 0)),
              stageFiveAccuracy: Math.max(0, Math.min(100, Number(result?.stageFiveAccuracy || 0) || 0))
            }))
            .filter((result) => result.wordId && result.word)
        : [];
      const stageOneAverage = wordResults.length
        ? Math.round(wordResults.reduce((sum, result) => sum + result.stageOneAccuracy, 0) / wordResults.length)
        : 0;
      const stageFiveAverage = wordResults.length
        ? Math.round(wordResults.reduce((sum, result) => sum + result.stageFiveAccuracy, 0) / wordResults.length)
        : 0;
      const derivedStageOneCorrect = wordResults.filter((result) => result.stageOneAccuracy === 100).length;
      const derivedStageFiveCorrect = wordResults.filter((result) => result.stageFiveAccuracy === 100).length;
      return {
        attemptId: String(attempt?.attemptId || ""),
        instanceNumber: Math.max(1, Number(attempt?.instanceNumber || index + 1) || index + 1),
        completedAt,
        completedLabel: completedAtDate && !Number.isNaN(completedAtDate.getTime())
          ? new Intl.DateTimeFormat("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric"
            }).format(completedAtDate)
          : "Saved instance",
        wordResults,
        stageOneCorrect: Math.max(0, Number(attempt?.stageOneCorrect || derivedStageOneCorrect) || 0),
        stageFiveCorrect: Math.max(0, Number(attempt?.stageFiveCorrect || derivedStageFiveCorrect) || 0),
        overallScorePercent: Math.max(0, Math.min(100, Number(attempt?.overallScorePercent || stageFiveAverage) || 0)),
        stageOneAverage,
        stageFiveAverage,
        improvement: stageFiveAverage - stageOneAverage
      };
    })
    .filter((instanceRow) => instanceRow.wordResults.length)
    .sort((left, right) => {
      const leftTime = new Date(left.completedAt || 0).getTime();
      const rightTime = new Date(right.completedAt || 0).getTime();
      return rightTime - leftTime || right.instanceNumber - left.instanceNumber;
    });
}

function getSpellingInstanceOverview(spelling) {
  const instanceRows = getSpellingCompletedInstanceRows(spelling);
  const uniqueWordIds = new Set();
  let loggedWordCount = 0;
  let totalStageFiveAccuracy = 0;
  instanceRows.forEach((instanceRow) => {
    instanceRow.wordResults.forEach((result) => {
      uniqueWordIds.add(result.wordId);
      loggedWordCount += 1;
      totalStageFiveAccuracy += result.stageFiveAccuracy;
    });
  });
  return {
    instanceCount: instanceRows.length,
    uniqueWordCount: uniqueWordIds.size,
    loggedWordCount,
    averageStageFiveAccuracy: loggedWordCount ? Math.round(totalStageFiveAccuracy / loggedWordCount) : 0
  };
}

function moveWritingBookPage(subject, direction) {
  const writing = getSubjectWritingState(subject);
  const completedSections = getWritingCompletedSections(writing);
  const maxIndex = Math.max(0, completedSections.length - 1);
  writing.bookPreviewIndex = Math.max(0, Math.min(maxIndex, Number(writing.bookPreviewIndex || 0) + Number(direction || 0)));
  persistSubjects({ skipRemoteSync: true });
}

function editWritingBookPage(subject) {
  const writing = getSubjectWritingState(subject);
  const completedSections = getWritingCompletedSections(writing);
  const previewSection = completedSections[writing.bookPreviewIndex] || completedSections[0] || null;
  if (!previewSection) {
    return;
  }
  const sectionIndex = writing.sections.findIndex((section) => section.id === previewSection.id);
  openWritingSection(subject, sectionIndex, "write", { returnToBook: true });
}

async function changeWritingBookIllustration(subject) {
  const writing = getSubjectWritingState(subject);
  const completedSections = getWritingCompletedSections(writing);
  const previewSection = completedSections[writing.bookPreviewIndex] || completedSections[0] || null;
  if (!previewSection) {
    return;
  }
  const sectionIndex = writing.sections.findIndex((section) => section.id === previewSection.id);
  openWritingSection(subject, sectionIndex, "illustrate", { returnToBook: true });
  await loadWritingIllustrations(subject, { force: !hasCompleteWritingIllustrationImages(writing, sectionIndex, previewSection) });
}

function speakWritingSection(subject) {
  const writing = getSubjectWritingState(subject);
  const section = getWritingCurrentSection(writing);
  if (!section) {
    return;
  }
  const readText = String(section.text || buildWritingSectionSuggestion(writing, writing.currentSectionIndex) || "").trim();
  if (!readText) {
    return;
  }
  void speakTextWithOpenAi(readText, {
    context: `writing:section:${section.id}`,
    statusMessages: {
      preparing: "Preparing writing audio...",
      playing: "Reading the story section...",
      error: "Writing audio failed."
    }
  }).catch((error) => {
    console.error("Writing section audio failed.", error);
  });
}

function saveWritingBookAsPdf(subject) {
  const writing = getSubjectWritingState(subject);
  const completedSections = getWritingCompletedSections(writing);
  if (!completedSections.length) {
    writing.coachMessage = "Complete at least one illustrated section before saving the book as a PDF.";
    persistSubjects({ skipRemoteSync: true });
    return;
  }
  const previewWindow = window.open("", "_blank", "width=1100,height=900");
  if (!previewWindow) {
    writing.coachMessage = "Allow pop-ups to save the picture book as a PDF.";
    persistSubjects();
    return;
  }
  const pagesMarkup = completedSections
    .map((section, index) => {
      const selectedOption = getWritingSectionSelectedIllustration(section);
      const pageText = escapeHtml(section.text || "").replace(/\n/g, "<br />");
      return `
        <section class="book-page">
          <div class="book-page__art">${selectedOption?.imageUrl ? `<img class="book-page__image" src="${escapeHtml(selectedOption.imageUrl)}" alt="${escapeHtml(selectedOption.prompt || `Illustration for page ${index + 1}`)}" />` : `<div class="book-page__placeholder">${escapeHtml(selectedOption?.prompt || `Illustration for page ${index + 1}`)}</div>`}</div>
          <div class="book-page__text"><p class="book-page__number">Page ${index + 1} of ${completedSections.length}</p><div class="book-page__body">${pageText}</div></div>
        </section>
      `;
    })
    .join("");
  previewWindow.document.open();
  previewWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(writing.storyTitle || WRITING_STUDIO_TAB_LABEL)}</title><style>body{font-family:Lexend,system-ui,sans-serif;margin:0;padding:32px;background:#efeaf2;color:#2e2a33}.book-toolbar{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:12px;align-items:center;padding:0 0 24px;background:#efeaf2}.book-toolbar__actions{display:flex;gap:12px;flex-wrap:wrap}.book-toolbar button{border:0;border-radius:999px;padding:12px 18px;font:700 14px Lexend,system-ui,sans-serif;cursor:pointer}.book-toolbar__print{background:#2e2a33;color:#fff}.book-toolbar__close{background:#fff;color:#2e2a33;border:1px solid #d9d3df}h1{margin:0;font-size:32px}.book-stack{display:grid;gap:24px}.book-page{display:flex;min-height:520px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 18px 36px rgba(34,28,40,.12);page-break-after:always}.book-page__art,.book-page__text{width:50%}.book-page__art{border-right:1px dashed #d9d3df;background:#f5f2f7;padding:24px;display:flex}.book-page__image{width:100%;height:100%;object-fit:cover;border-radius:18px}.book-page__placeholder{flex:1;border:2px dashed #cfc6d7;border-radius:18px;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#645d6c;line-height:1.5}.book-page__text{padding:32px 36px;font-size:24px;line-height:1.7}.book-page__body{white-space:normal}.book-page__number{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#645d6c;margin:0 0 18px}@media print{body{background:#fff;padding:0}.book-toolbar{display:none}.book-stack{gap:0}.book-page{box-shadow:none;margin:0;border-radius:0;break-after:page}}</style></head><body><div class="book-toolbar"><h1>${escapeHtml(writing.storyTitle || WRITING_STUDIO_TAB_LABEL)}</h1><div class="book-toolbar__actions"><button type="button" class="book-toolbar__print" onclick="window.print()">Print / Save PDF</button><button type="button" class="book-toolbar__close" onclick="window.close()">Close</button></div></div><div class="book-stack">${pagesMarkup}</div></body></html>`);
  previewWindow.document.close();
  previewWindow.focus();
  writing.coachMessage = "Book preview opened. Use Print / Save PDF in the new window.";
  persistSubjects({ skipRemoteSync: true });
}

function renderWriting() {
  const host = elements.writingSection;
  const subject = getWorkspaceSubjectForTab("writing", getSelectedSubject()) || getSelectedSubject();
  if (!host || !subject) {
    return;
  }
  const writing = getSubjectWritingState(subject);
  if (!writing.enabled) {
    host.innerHTML = `<section class="ws-shell"><article class="ws-card"><p class="eyebrow">Writing Studio</p><h3>Open the Practice subject to build your story</h3><p class="ws-copy">Writing Studio now lives inside Practice so each section, picture choice, and book page stays with that workspace.</p></article></section>`;
    return;
  }

  const currentSection = getWritingCurrentSection(writing);
  const completedCount = getWritingCompletedSectionCount(writing);
  const activeSectionLabel = currentSection ? `Section ${currentSection.number}` : "Picture book";
  const sectionProgressMarkup = `
    <section class="writing-stream__progress">
      ${writing.sections.map((section, index) => `
        <button
          type="button"
          class="writing-stream__progress-chip${index === writing.currentSectionIndex ? " is-current" : ""}${section.completed ? " is-complete" : ""}"
          data-writing-open-section="${index}"
          data-writing-open-view="write"
        >
          <strong>${escapeHtml(`Section ${section.number}`)}</strong>
          <span>${escapeHtml(section.completed ? "Edit" : index === writing.currentSectionIndex ? "Today" : "Later")}</span>
        </button>
      `).join("")}
    </section>
  `;
  const summaryMarkup = `
    <section class="writing-stream__summary">
      <article class="writing-stream__summary-card">
        <div class="writing-stream__summary-copy">
          <p class="eyebrow">Writing</p>
          <h3>${escapeHtml(writing.storyTitle || WRITING_STUDIO_TAB_LABEL)}</h3>
          <p>${escapeHtml(`${completedCount} of ${WRITING_STUDIO_SECTION_COUNT} sections ready. Current focus: ${activeSectionLabel}.`)}</p>
        </div>
        <div class="writing-stream__summary-meta">
          <span class="subject-pill">${escapeHtml(`${completedCount}/${WRITING_STUDIO_SECTION_COUNT} complete`)}</span>
          <span class="subject-pill">${escapeHtml(writing.view === "illustrate" ? "Illustration mode" : writing.view === "book" ? "Book preview" : "Writing mode")}</span>
          <button type="button" class="ghost-button ghost-button--mint" data-writing-save-pdf="true">Save as PDF</button>
        </div>
      </article>
      ${sectionProgressMarkup}
    </section>
  `;

  let bodyMarkup = "";
  if (writing.view === "begin") {
    bodyMarkup = `
      <article class="ws-card ws-card--main writing-stream__card">
        <p class="eyebrow">Let’s start your story</p>
        <p class="ws-copy">Answer three quick questions and PaperPanda will turn them into your opening line.</p>
        <label class="ws-field"><span>Who is your story about?</span><input type="text" id="writing-answer-who" value="${escapeHtml(writing.openingAnswers.who)}" placeholder="A quiet young fox named Sol" /></label>
        <label class="ws-field"><span>Where does it happen?</span><input type="text" id="writing-answer-where" value="${escapeHtml(writing.openingAnswers.where)}" placeholder="An old lighthouse by the sea" /></label>
        <label class="ws-field"><span>What do they want?</span><input type="text" id="writing-answer-want" value="${escapeHtml(writing.openingAnswers.want)}" placeholder="To find the light that went out" /></label>
        <label class="ws-field ws-field--feedback"><span>Tell Gemini what picture you want</span><textarea id="writing-image-feedback" class="ws-editor ws-editor--feedback" placeholder="e.g. Show a chestnut horse in a warm stable at sunset, with soft storybook colours.">${escapeHtml(writing.imageFeedback)}</textarea></label>
        <p class="ws-feedback-note">Gemini will use this when it creates the first illustration options and carry that direction through the rest of the book.</p>
        <div class="ws-actions"><button type="button" class="primary-button primary-button--dark" data-writing-start="true">Start writing →</button></div>
      </article>
      <article class="writing-stream__note">
        <p class="eyebrow">How it works</p>
        <h4>A section at a time, then one picture for that section, then it becomes your book.</h4>
      </article>
    `;
  } else if (writing.view === "write" && currentSection) {
    const previousSection = writing.currentSectionIndex > 0 ? writing.sections[writing.currentSectionIndex - 1] : null;
    const suggestion = writing.activeSuggestion && writing.activeSuggestion.sectionId === currentSection.id ? writing.activeSuggestion : null;
    const imageDirectionMarkup = currentSection.number === 1
      ? `<label class="ws-field ws-field--feedback"><span>Tell Gemini what picture you want</span><textarea id="writing-image-feedback" class="ws-editor ws-editor--feedback" placeholder="e.g. Show a chestnut horse in a warm stable at sunset, with soft storybook colours.">${escapeHtml(writing.imageFeedback)}</textarea></label><p class="ws-feedback-note">Gemini will use this when it creates the first illustration options and carry that direction through the rest of the book.</p>`
      : "";
    bodyMarkup = `<article class="ws-card ws-card--main writing-stream__card"><div class="ws-card__head"><p class="eyebrow">Write today’s section</p><span class="ws-pill">${escapeHtml(`Section ${currentSection.number}`)}</span></div>${previousSection ? `<div class="ws-label">So far</div><div class="ws-quote">“${escapeHtml(previousSection.text)}”</div>` : ""}<div class="ws-hint"><span>?</span><p>${escapeHtml(buildWritingSectionSuggestion(writing, writing.currentSectionIndex))}</p></div>${imageDirectionMarkup}<div class="ws-editor-head"><span>Your turn</span><div class="ws-editor-head__actions"><button type="button" class="ghost-button ghost-button--light" data-writing-read-aloud="true">Read aloud</button>${String(currentSection.text || "").trim() ? `<button type="button" class="ghost-button ghost-button--light" data-writing-open-section="${currentSection.number - 1}" data-writing-open-view="illustrate">Change illustration</button>` : ""}</div></div><div class="ws-editor-wrap"><textarea id="writing-section-editor" class="ws-editor" placeholder="Write today’s part of the story...">${escapeHtml(currentSection.text)}</textarea>${suggestion ? `<div class="ws-suggestion-pop"><div>${escapeHtml(suggestion.message)}</div><div class="ws-suggestion-pop__actions"><button type="button" class="ws-suggestion-pop__fix" data-writing-apply-suggestion="true">Yes, fix it</button><button type="button" class="ws-suggestion-pop__keep" data-writing-dismiss-suggestion="true">Keep mine</button></div></div>` : ""}</div><div class="ws-actions ws-actions--spread">${writing.returnToBookAfterIllustration ? `<button type="button" class="ghost-button ghost-button--light" data-writing-back-book="true">← Back to book</button>` : writing.currentSectionIndex > 0 ? `<button type="button" class="ghost-button ghost-button--light" data-writing-move-section="-1" data-writing-move-view="write">← Previous section</button>` : `<span></span>`}<button type="button" class="primary-button primary-button--dark" data-writing-continue-illustration="true">Continue to illustration →</button>${!writing.returnToBookAfterIllustration && writing.currentSectionIndex < WRITING_STUDIO_SECTION_COUNT - 1 ? `<button type="button" class="ghost-button ghost-button--light" data-writing-move-section="1" data-writing-move-view="write">Next section →</button>` : `<span></span>`}</div></article>`;
  } else if (writing.view === "illustrate" && currentSection) {
    const options = ensureWritingIllustrationOptions(writing, writing.currentSectionIndex);
    const isChoosingBookStyle = writing.currentSectionIndex === 0;
    const rerollLabel = isChoosingBookStyle ? "↻ Try 4 new looks" : "↻ Try 2 new pictures";
    const styleNote = !isChoosingBookStyle && writing.illustrationStyle?.label
      ? `<div class="ws-style-note"><strong>${escapeHtml(writing.illustrationStyle.label)}</strong><span>${escapeHtml(writing.illustrationStyle.brief)}</span></div>`
      : "";
    const feedbackMarkup = isChoosingBookStyle
      ? `<label class="ws-field ws-field--feedback"><span>Feedback for the illustration style</span><textarea id="writing-image-feedback" class="ws-editor ws-editor--feedback" placeholder="e.g. make the horse look gentler, use warmer colours, or show more of the stable setting.">${escapeHtml(writing.imageFeedback)}</textarea></label><p class="ws-feedback-note">This guides rerolls for section 1 and the illustrations created for the rest of the book.</p>`
      : writing.imageFeedback
        ? `<div class="ws-style-note"><strong>Saved image direction</strong><span>${escapeHtml(writing.imageFeedback)}</span></div>`
        : "";
    bodyMarkup = `<article class="ws-card ws-card--main writing-stream__card"><div class="ws-card__head"><div><p class="eyebrow">Choose an illustration</p><p class="ws-copy">${escapeHtml(isChoosingBookStyle ? "Pick the visual style for the whole book. Later sections will follow this look." : "Pick the picture that matches your section best.")}</p></div><span class="ws-pill">${escapeHtml(`Section ${currentSection.number}`)}</span></div>${styleNote}${feedbackMarkup}${writing.illustrationError ? `<div class="ws-error-note">${escapeHtml(writing.illustrationError)}</div>` : ""}<div class="ws-illustration-grid">${options.map((option) => `<button type="button" class="ws-illustration-card${option.id === currentSection.selectedIllustrationId ? " is-selected" : ""}" data-writing-select-illustration="${escapeHtml(option.id)}" ${option.imageUrl ? "" : "disabled"}>${option.imageUrl ? `<img class="ws-illustration-card__image" src="${escapeHtml(option.imageUrl)}" alt="${escapeHtml(option.label || option.prompt)}" />` : `<div class="ws-illustration-card__placeholder">${writing.isGeneratingIllustrations ? "Generating..." : "No image yet"}</div>`}<strong>${escapeHtml(option.label || option.prompt)}</strong>${option.description ? `<span>${escapeHtml(option.description)}</span>` : ""}</button>`).join("")}</div><div class="ws-actions ws-actions--spread">${writing.returnToBookAfterIllustration ? `<button type="button" class="ghost-button ghost-button--light" data-writing-back-book="true">← Back to book</button>` : writing.currentSectionIndex > 0 ? `<button type="button" class="ghost-button ghost-button--light" data-writing-move-section="-1" data-writing-move-view="write">← Previous section</button>` : `<button type="button" class="ghost-button ghost-button--light" data-writing-open-section="${currentSection.number - 1}" data-writing-open-view="write">← Back to writing</button>`}<button type="button" class="ghost-button ghost-button--light" data-writing-reroll-illustrations="true" ${writing.isGeneratingIllustrations ? "disabled" : ""}>${escapeHtml(rerollLabel)}</button><button type="button" class="primary-button primary-button--dark" data-writing-use-illustration="true" ${writing.isGeneratingIllustrations ? "disabled" : ""}>Use this picture →</button>${!writing.returnToBookAfterIllustration && writing.currentSectionIndex < WRITING_STUDIO_SECTION_COUNT - 1 ? `<button type="button" class="ghost-button ghost-button--light" data-writing-move-section="1" data-writing-move-view="write">Next section →</button>` : `<span></span>`}</div></article>`;
  } else {
    const completedSections = getWritingCompletedSections(writing);
    const previewSection = completedSections[writing.bookPreviewIndex] || completedSections[0] || writing.sections[0];
    const selectedOption = getWritingSectionSelectedIllustration(previewSection);
    bodyMarkup = `<article class="ws-card ws-card--main writing-stream__card"><div class="ws-card__head"><div><p class="eyebrow">Finished · your book</p><h3>${escapeHtml(writing.storyTitle || WRITING_STUDIO_TAB_LABEL)}</h3></div><button type="button" class="ghost-button ghost-button--mint" data-writing-save-pdf="true">Save as PDF</button></div><div class="ws-book-spread"><div class="ws-book-spread__art">${selectedOption?.imageUrl ? `<img class="ws-book-spread__image" src="${escapeHtml(selectedOption.imageUrl)}" alt="${escapeHtml(selectedOption.prompt || `Illustration for page ${previewSection?.number || 1}`)}" />` : `<div class="ws-book-spread__placeholder">${escapeHtml(selectedOption?.prompt || `Illustration for page ${previewSection?.number || 1}`)}</div>`}</div><div class="ws-book-spread__text"><p class="eyebrow">${escapeHtml(`Page ${previewSection?.number || 1} of ${Math.max(1, completedSections.length)}`)}</p><div>${escapeHtml(previewSection?.text || "")}</div></div></div><div class="ws-actions ws-actions--spread"><button type="button" class="ghost-button ghost-button--light" data-writing-book-edit="true">Edit this section</button><button type="button" class="ghost-button ghost-button--light" data-writing-book-change-illustration="true">Change picture</button></div><div class="ws-book-nav"><button type="button" class="ghost-button ghost-button--light ws-book-nav__button" data-writing-book-move="-1" ${writing.bookPreviewIndex <= 0 ? "disabled" : ""}>‹</button><div class="ws-book-dots">${completedSections.map((_, index) => `<span class="ws-book-dot${index === writing.bookPreviewIndex ? " is-active" : ""}"></span>`).join("")}</div><button type="button" class="primary-button primary-button--dark ws-book-nav__button" data-writing-book-move="1" ${writing.bookPreviewIndex >= completedSections.length - 1 ? "disabled" : ""}>›</button></div></article>`;
  }

  host.innerHTML = `<section class="writing-stream">${summaryMarkup}<div class="writing-stream__body">${bodyMarkup}</div></section>`;
  host.querySelector("#writing-answer-who")?.addEventListener("input", (event) => updateWritingOpeningAnswer(subject, "who", event.target.value));
  host.querySelector("#writing-answer-where")?.addEventListener("input", (event) => updateWritingOpeningAnswer(subject, "where", event.target.value));
  host.querySelector("#writing-answer-want")?.addEventListener("input", (event) => updateWritingOpeningAnswer(subject, "want", event.target.value));
  host.querySelector("#writing-image-feedback")?.addEventListener("input", (event) => updateWritingImageFeedback(subject, event.target.value));
  host.querySelector("[data-writing-start]")?.addEventListener("click", () => { startWritingStory(subject); render(); });
  host.querySelector("#writing-section-editor")?.addEventListener("input", (event) => {
    const writingState = getSubjectWritingState(subject);
    const previousSuggestionKey = writingState.activeSuggestion ? `${writingState.activeSuggestion.sectionId}:${writingState.activeSuggestion.wrong}:${writingState.activeSuggestion.correct}` : "";
    updateWritingSectionText(subject, event.target.value);
    const nextWritingState = getSubjectWritingState(subject);
    const nextSuggestionKey = nextWritingState.activeSuggestion ? `${nextWritingState.activeSuggestion.sectionId}:${nextWritingState.activeSuggestion.wrong}:${nextWritingState.activeSuggestion.correct}` : "";
    if (previousSuggestionKey !== nextSuggestionKey) {
      render();
    }
  });
  host.querySelector("[data-writing-read-aloud]")?.addEventListener("click", () => speakWritingSection(subject));
  host.querySelector("[data-writing-apply-suggestion]")?.addEventListener("click", () => { applyWritingSuggestion(subject); render(); });
  host.querySelector("[data-writing-dismiss-suggestion]")?.addEventListener("click", () => { dismissWritingSuggestion(subject); render(); });
  host.querySelector("[data-writing-continue-illustration]")?.addEventListener("click", async () => {
    render();
    await continueWritingToIllustration(subject);
    render();
  });
  host.querySelector("[data-writing-reroll-illustrations]")?.addEventListener("click", async () => {
    render();
    await rerollWritingIllustrations(subject);
    render();
  });
  host.querySelectorAll("[data-writing-select-illustration]").forEach((button) => {
    button.addEventListener("click", () => {
      selectWritingIllustration(subject, button.dataset.writingSelectIllustration);
      render();
    });
  });
  host.querySelector("[data-writing-use-illustration]")?.addEventListener("click", () => { acceptWritingIllustration(subject); render(); });
  host.querySelector("[data-writing-back-book]")?.addEventListener("click", () => { returnWritingToBook(subject); render(); });
  host.querySelectorAll("[data-writing-save-pdf]").forEach((button) => {
    button.addEventListener("click", () => saveWritingBookAsPdf(subject));
  });
  host.querySelector("[data-writing-book-edit]")?.addEventListener("click", () => { editWritingBookPage(subject); render(); });
  host.querySelector("[data-writing-book-change-illustration]")?.addEventListener("click", async () => {
    render();
    await changeWritingBookIllustration(subject);
    render();
  });
  host.querySelectorAll("[data-writing-open-section]").forEach((button) => {
    button.addEventListener("click", async () => {
      const sectionIndex = Number(button.dataset.writingOpenSection || 0);
      const nextView = String(button.dataset.writingOpenView || "write");
      openWritingSection(subject, sectionIndex, nextView);
      if (nextView === "illustrate") {
        render();
        const nextWritingState = getSubjectWritingState(subject);
        const nextSection = getWritingCurrentSection(nextWritingState);
        await loadWritingIllustrations(subject, {
          force: !hasCompleteWritingIllustrationImages(nextWritingState, nextWritingState.currentSectionIndex, nextSection)
        });
      }
      render();
    });
  });
  host.querySelectorAll("[data-writing-move-section]").forEach((button) => {
    button.addEventListener("click", () => {
      moveWritingSection(subject, Number(button.dataset.writingMoveSection || 0), String(button.dataset.writingMoveView || "write"));
      render();
    });
  });
  host.querySelectorAll("[data-writing-book-move]").forEach((button) => {
    button.addEventListener("click", () => {
      moveWritingBookPage(subject, Number(button.dataset.writingBookMove || 0));
      render();
    });
  });
}

function renderGrammar() {
  const host = elements.grammarSection;
  const subject = getWorkspaceSubjectForTab("grammar", getSelectedSubject()) || getSelectedSubject();
  if (!host || !subject) {
    return;
  }

  const grammar = getSubjectGrammarState(subject);
  if (!grammar.enabled) {
    host.innerHTML = `
      <section class="gp-shell-empty">
        <article class="gp-empty-card">
          <p class="eyebrow">Grammar</p>
          <h3>Open the Practice subject to work through grammar sessions</h3>
          <p>The grammar program now sits inside Practice so its session flow and property rewards stay together.</p>
        </article>
      </section>
    `;
    return;
  }

  GrammarProgram.mount(host, { subject });
}

function renderSpelling() {
  const host = elements.spellingSection;
  const subject = getWorkspaceSubjectForTab("spelling", getSelectedSubject()) || getSelectedSubject();
  if (!host || !subject) {
    return;
  }

  const spelling = getSubjectSpellingState(subject);
  ensureSpellingSessionState(subject);
  if (!spelling.enabled) {
    host.innerHTML = `
      <section class="spelling-shell spelling-shell--empty">
        <article class="spelling-empty-card">
          <p class="eyebrow">Practice Property</p>
          <h3>Open the Practice subject to train this lesson</h3>
          <p>The horse property lives inside the Practice subject so each completed session and reward stays with that workspace.</p>
        </article>
      </section>
    `;
    return;
  }

  const completedCount = getSpellingCompletedActivityCount(subject);
  const totalCount = getSpellingTotalActivityCount(subject);
  const masteryPercent = Math.round(getSpellingMasteryRatio(subject) * 100);
  const attemptComplete = isSpellingAttemptComplete(subject);
  const currentStageId = getSpellingStageId(subject);
  const stageId = getSpellingVisibleStageId(subject);
  const stageIndex = SPELLING_STAGE_ORDER.indexOf(stageId);
  const unlockedStageIndex = Math.min(completedCount, SPELLING_STAGE_ORDER.length - 1);
  let homeTab = String(spelling.homeTab || "property");
  if (homeTab === "review") {
    homeTab = "progress";
  }
  if (homeTab === "stable" || homeTab === "paddock") {
    homeTab = "property";
  }
  const isSessionView = homeTab === "session";
  const showingCelebration = isSessionView && spelling.celebrationStageId === stageId;
  const diagnosticWord = getSpellingDiagnosticCurrentWord(spelling);
  const focusSummary = getSpellingTopFocuses(spelling, 3);
  const followUpWords = getSpellingFollowUpWords(spelling);
  const attemptWords = getSpellingAttemptWords(spelling);
  const stageScoreSummary = getSpellingStageScoreSummary(spelling);
  const overallScorePercent = getSpellingOverallScorePercent(spelling);
  const ownedHorseMeta = getSpellingOwnedHorseMeta(spelling);
  const visibleHomeTab = homeTab;
  const showSessionCompletionSummary = isSessionView
    && !showingCelebration
    && spelling.repeatCheck.completed
    && (spelling.sessionCompletionReady || attemptComplete);

  if (spelling.challenge.active || (spelling.challenge.completed && spelling.challenge.lastCompletedWeekKey === currentWeekKey())) {
    const currentChallengeItem = getSpellingChallengeCurrentItem(spelling);
    const currentChallengeEntry = getSpellingChallengeItemEntry(currentChallengeItem);
    const challengeProgress = `${Math.min(spelling.challenge.currentIndex + 1, spelling.challenge.items.length)} of ${spelling.challenge.items.length}`;
    host.innerHTML = spelling.challenge.completed
      ? `
        <section class="spelling-shell" data-spelling-font="${escapeHtml(spelling.preferences.font)}" data-spelling-spacing="${escapeHtml(spelling.preferences.spacing)}" data-spelling-tint="${escapeHtml(spelling.preferences.tint)}">
          <article class="spelling-stage-card spelling-stage-card--single spelling-stage-card--celebration">
            <p class="eyebrow">Weekly challenge complete</p>
            <div class="spelling-ribbon-badge">40 words checked</div>
            <h4>Challenge finished</h4>
            <p>The mixed weekly challenge is complete. A new challenge will appear after five more completed spelling attempts in the current week.</p>
          </article>
        </section>
      `
      : `
        <section class="spelling-shell" data-spelling-font="${escapeHtml(spelling.preferences.font)}" data-spelling-spacing="${escapeHtml(spelling.preferences.spacing)}" data-spelling-tint="${escapeHtml(spelling.preferences.tint)}">
          <article class="spelling-stage-card spelling-stage-card--single">
            <div class="spelling-card__header">
              <div>
                <p class="eyebrow">Weekly spelling challenge</p>
                <h4>40-word mixed check</h4>
              </div>
              <span class="spelling-card__status">Challenge live</span>
            </div>
            <p>These 40 prompts come from the last four completed 10-word spelling attempts this week.</p>
            <div class="spelling-stage-meta spelling-stage-meta--single">
              <span>Question ${escapeHtml(challengeProgress)}</span>
              <span>${escapeHtml(currentChallengeItem ? currentChallengeItem.mode.replace("-", " ") : "Ready")}</span>
            </div>
            ${currentChallengeItem && currentChallengeEntry ? `
              <article class="spelling-tense-card spelling-tense-card--single">
                ${
                  currentChallengeItem.mode === "looks-right"
                    ? `
                      <p class="spelling-comparison-card__prompt">Which sentence looks right?</p>
                      <div class="spelling-choice-row spelling-choice-row--stacked">
                        ${getSpellingChallengeLooksRightOptions(currentChallengeEntry).map((option) => `
                          <button type="button" class="spelling-choice spelling-choice--sentence spelling-choice--sentence-large" data-spelling-challenge-looks-right="${escapeHtml(option.value)}">
                            <span>${option.markup}</span>
                          </button>
                        `).join("")}
                      </div>
                    `
                    : currentChallengeItem.mode === "dictation"
                      ? `
                        <div class="spelling-audio-panel">
                          <button type="button" class="primary-button primary-button--dark" data-spelling-challenge-play="true">Play word</button>
                          <p>Listen to the AI voice, then type the full spelling.</p>
                        </div>
                        <input class="reader-editor spelling-inline-input spelling-inline-input--centered" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" value="${escapeHtml(spelling.challenge.inputValue || "")}" placeholder="Type the word you hear" data-spelling-challenge-input="true" />
                        <div class="spelling-stage-actions spelling-stage-actions--compact">
                          <button type="button" class="primary-button primary-button--dark" data-spelling-challenge-submit="true">Check answer</button>
                        </div>
                      `
                      : currentChallengeItem.mode === "root-word"
                        ? `
                          <p class="spelling-comparison-card__prompt">What is the root word?</p>
                          <div class="spelling-family-sentence-card">
                            <p><span class="spelling-inline-target">${escapeHtml(currentChallengeItem.familyWord)}</span></p>
                          </div>
                          <input class="reader-editor spelling-inline-input spelling-inline-input--centered" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" value="${escapeHtml(spelling.challenge.inputValue || "")}" placeholder="Type the root word" data-spelling-challenge-input="true" />
                          <div class="spelling-stage-actions spelling-stage-actions--compact">
                            <button type="button" class="primary-button primary-button--dark" data-spelling-challenge-submit="true">Check answer</button>
                          </div>
                        `
                        : `
                          <p class="spelling-comparison-card__prompt">Type the missing letter</p>
                          <div class="spelling-family-sentence-card">
                            <p>${buildSpellingChallengeMissingLetterPrompt(currentChallengeEntry, currentChallengeItem.missingIndex)}</p>
                          </div>
                          <input class="reader-editor spelling-inline-input spelling-inline-input--centered" type="text" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false" value="${escapeHtml(spelling.challenge.inputValue || "")}" placeholder="Type the missing letter" data-spelling-challenge-input="true" />
                          <div class="spelling-stage-actions spelling-stage-actions--compact">
                            <button type="button" class="primary-button primary-button--dark" data-spelling-challenge-submit="true">Check answer</button>
                          </div>
                        `
                }
              </article>
            ` : ""}
          </article>
        </section>
      `;

    if (!spelling.challenge.completed) {
      host.querySelector("[data-spelling-challenge-play]")?.addEventListener("click", () => {
        speakSpellingChallengeWord(currentChallengeItem, currentChallengeEntry);
      });
      host.querySelector("[data-spelling-challenge-input]")?.addEventListener("input", (event) => {
        spelling.challenge.inputValue = event.target.value;
        spelling.challenge.checked = false;
        persistSubjects();
      });
      host.querySelector("[data-spelling-challenge-input]")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          spelling.challenge.inputValue = event.currentTarget.value;
          submitSpellingChallengeInput(subject);
          render();
        }
      });
      host.querySelector("[data-spelling-challenge-submit]")?.addEventListener("click", () => {
        const input = host.querySelector("[data-spelling-challenge-input]");
        spelling.challenge.inputValue = input?.value || spelling.challenge.inputValue;
        submitSpellingChallengeInput(subject);
        render();
      });
      host.querySelectorAll("[data-spelling-challenge-looks-right]").forEach((button) => {
        button.addEventListener("click", () => {
          selectSpellingChallengeLooksRight(subject, button.dataset.spellingChallengeLooksRight);
          render();
        });
      });
    }
    return;
  }

  if (!isSessionView) {
    const homeBody = homeTab === "progress"
      ? buildSpellingProgressHome(subject, spelling)
      : buildSpellingStableHome(subject, spelling);

    host.innerHTML = `
      <section class="ss-root spelling-shell" data-spelling-font="${escapeHtml(spelling.preferences.font)}" data-spelling-spacing="${escapeHtml(spelling.preferences.spacing)}" data-spelling-tint="${escapeHtml(spelling.preferences.tint)}">
        ${buildSpellingSurfaceTabs(visibleHomeTab)}

        ${homeBody}
      </section>
    `;

    bindSpellingNavigationInteractions(subject, host);
    mountRewardProperty(subject, host);
    return;
  }

  if (stageId === "diagnostic" && !spelling.diagnostic.completed && !showingCelebration) {
    host.innerHTML = `
      <section class="ss-root spelling-shell" data-spelling-font="${escapeHtml(spelling.preferences.font)}" data-spelling-spacing="${escapeHtml(spelling.preferences.spacing)}" data-spelling-tint="${escapeHtml(spelling.preferences.tint)}">
        ${buildSpellingSurfaceTabs("session")}
        <div class="ss-layout">
          <div class="ss-main">
            <article class="ss-stage-panel ss-stage-panel--diagnostic">
              <div class="ss-stage-panel__head ss-stage-panel__head--compact">
                <p class="eyebrow">Spell what you hear</p>
                <span class="ss-stage-counter">${escapeHtml(`Word ${Math.min(spelling.diagnostic.currentIndex + 1, attemptWords.length)} of ${attemptWords.length}`)}</span>
              </div>
              <div class="spelling-diagnostic-dots spelling-diagnostic-dots--large" aria-label="Diagnostic progress">
                ${attemptWords
                  .map((_, index) => `
                    <span class="spelling-diagnostic-dot${index < spelling.diagnostic.currentIndex ? " is-complete" : ""}${index === spelling.diagnostic.currentIndex ? " is-current" : ""}"></span>
                  `)
                  .join("")}
              </div>
              <div class="ss-audio-actions">
                <button type="button" class="primary-button primary-button--dark" data-spelling-play-diagnostic="true">Hear the word</button>
                <button type="button" class="ghost-button ghost-button--light" data-spelling-play-diagnostic-sentence="true">Hear it in a sentence</button>
              </div>
              ${buildSpellingAudioStatusMarkup("diagnostic", getSpellingDiagnosticCurrentWord(spelling))}
              <label class="spelling-input-label" for="spelling-diagnostic-input">Type your spelling</label>
              <input
                id="spelling-diagnostic-input"
                class="reader-editor spelling-inline-input spelling-inline-input--hero"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                value="${escapeHtml(spelling.diagnostic.currentInput)}"
                placeholder="Type the spelling"
              />
              <div class="ss-status-note ss-status-note--soft">
                <span class="ss-status-dot"></span>
                <p>No marking yet — spell all ten, then we look at them together.</p>
              </div>
              <div class="spelling-stage-actions spelling-stage-actions--footer">
                <button type="button" class="primary-button primary-button--dark" data-spelling-submit-diagnostic="true">
                  ${spelling.diagnostic.currentIndex >= attemptWords.length - 1 ? "Finish stage" : "Next word"}
                </button>
              </div>
            </article>
        </div>
          <aside class="ss-side">
            ${buildSpellingStageSidebar(subject, spelling, stageId)}
          </aside>
        </div>
      </section>
    `;

    bindSpellingNavigationInteractions(subject, host);

    host.querySelector("[data-spelling-play-diagnostic]")?.addEventListener("click", () => {
      const input = host.querySelector("#spelling-diagnostic-input");
      spelling.diagnostic.currentInput = input?.value || spelling.diagnostic.currentInput;
      persistSubjects({ skipRemoteSync: true });
      speakSpellingDiagnosticWord(getSpellingDiagnosticCurrentWord(getSubjectSpellingState(subject)));
    });
    host.querySelector("[data-spelling-play-diagnostic-sentence]")?.addEventListener("click", () => {
      const input = host.querySelector("#spelling-diagnostic-input");
      spelling.diagnostic.currentInput = input?.value || spelling.diagnostic.currentInput;
      persistSubjects({ skipRemoteSync: true });
      speakSpellingDiagnosticSentence(getSpellingDiagnosticCurrentWord(getSubjectSpellingState(subject)));
    });
    host.querySelector("#spelling-diagnostic-input")?.addEventListener("input", (event) => {
      spelling.diagnostic.currentInput = event.target.value;
      persistSubjects({ skipRemoteSync: true });
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
    const celebrationCopy = getSpellingCelebrationCopy(subject, stageId);
    stageBody = stageId === "diagnostic"
      ? `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head">
            <div>
              <p class="eyebrow">${escapeHtml(celebrationCopy.eyebrow)}</p>
              <h4>${escapeHtml(celebrationCopy.title)}</h4>
            </div>
            <span class="ss-stage-badge is-complete">Ribbon unlocked</span>
          </div>
          <p class="ss-stage-copy">${escapeHtml(celebrationCopy.body)}</p>
          <div class="ss-stage-progress">
            <span>${escapeHtml(`${getSpellingDiagnosticCorrectCount(spelling)} of ${attemptWords.length} correct`)}</span>
            <span>${escapeHtml(`${getSpellingStageScorePercent(spelling, "diagnostic")}% score`)}</span>
          </div>
          <div class="ss-review-list">
            ${attemptWords
              .map((wordEntry) => {
                const response = spelling.diagnostic.responses[wordEntry.id] || {};
                const attempt = String(response.attempt || "");
                const isCorrect = Boolean(response.correct);
                return `
                  <article class="ss-review-row${isCorrect ? " is-correct" : " is-incorrect"}">
                    <div>
                      <strong>${escapeHtml(wordEntry.word)}</strong>
                      <span>${escapeHtml(attempt || "No answer typed")}</span>
                    </div>
                    <span class="ss-review-mark" aria-label="${isCorrect ? "Correct" : "Incorrect"}">${isCorrect ? "✓" : "✕"}</span>
                  </article>
                `;
              })
              .join("")}
          </div>
          <div class="spelling-stage-actions spelling-stage-actions--centered">
            <button type="button" class="primary-button primary-button--dark" data-spelling-continue-stage="${escapeHtml(celebrationCopy.nextStageId || "")}">${escapeHtml(celebrationCopy.action)}</button>
          </div>
        </article>
      `
      : `
        <article class="ss-stage-panel">
          <p class="eyebrow">${escapeHtml(celebrationCopy.eyebrow)}</p>
          <div class="spelling-ribbon-badge">Ribbon unlocked</div>
          <h4>${escapeHtml(celebrationCopy.title)}</h4>
          <p class="ss-stage-copy">${escapeHtml(celebrationCopy.body)}</p>
          <div class="spelling-stage-actions spelling-stage-actions--centered">
            <button type="button" class="primary-button primary-button--dark" data-spelling-continue-stage="${escapeHtml(celebrationCopy.nextStageId || "")}">${escapeHtml(celebrationCopy.action)}</button>
          </div>
        </article>
      `;
  } else if (stageId === "diagnostic") {
    stageBody = `
      <article class="ss-stage-panel">
        <div class="ss-stage-panel__head">
          <div>
            <p class="eyebrow">Complete</p>
            <h4>Stage 1 review</h4>
          </div>
          <span class="ss-stage-badge is-complete">Ribbon earned</span>
        </div>
        <p class="ss-stage-copy">The spelling challenge is complete. Review the words before moving back through earlier stages.</p>
        <div class="ss-stage-progress">
          <span>${escapeHtml(`${getSpellingDiagnosticCorrectCount(spelling)} of ${attemptWords.length} correct`)}</span>
          <span>${escapeHtml(`${getSpellingStageScorePercent(spelling, "diagnostic")}% score`)}</span>
          <span>${escapeHtml(`${focusSummary.length} focus area${focusSummary.length === 1 ? "" : "s"} identified`)}</span>
        </div>
        <div class="ss-review-list">
          ${focusSummary.map((entry) => `
            <article class="ss-review-row">
              <div>
                <strong>${escapeHtml(SPELLING_FOCUS_LABELS[entry.id] || entry.id)}</strong>
                <span>${escapeHtml(`${entry.count} miss${entry.count === 1 ? "" : "es"}`)}</span>
              </div>
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
    const currentLookOptions = currentLookWord ? buildSpellingLooksRightOptions(spelling, currentLookWord) : [];
    const currentLookIndex = currentLookWord ? Math.max(0, followUpWords.findIndex((entry) => entry.id === currentLookWord.id)) : 0;
    stageBody = spelling.looksRight.completed
      ? `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head">
            <div>
              <p class="eyebrow">Complete</p>
              <h4>Stage 2 review</h4>
            </div>
            <span class="ss-stage-badge is-complete">Ribbon earned</span>
          </div>
          <p class="ss-stage-copy">You have finished the sentence check for this session.</p>
          <div class="ss-stage-progress">
            <span>${escapeHtml(`${stageScoreSummary["looks-right"].correct}/${stageScoreSummary["looks-right"].total} correct`)}</span>
            <span>${escapeHtml(`${getSpellingStageScorePercent(spelling, "looks-right")}% score`)}</span>
          </div>
          <div class="ss-review-list">
            ${followUpWords.map((entry) => `
              <article class="ss-review-row${spelling.looksRight.answers[entry.id] === entry.word ? " is-correct" : " is-incorrect"}">
                <div>
                  <strong>${escapeHtml(entry.word)}</strong>
                  <span>${escapeHtml(spelling.looksRight.answers[entry.id] || "No answer saved")}</span>
                </div>
                <span class="ss-review-mark">${spelling.looksRight.answers[entry.id] === entry.word ? "✓" : "✕"}</span>
              </article>
            `).join("")}
          </div>
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="looks-right">Reset stage</button>
          </div>
        </article>
      `
      : `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head ss-stage-panel__head--compact">
            <p class="eyebrow">Which one looks right?</p>
            <span class="ss-stage-counter">${escapeHtml(`Word ${Math.min(answeredLookCount + 1, followUpWords.length)} of ${followUpWords.length}`)}</span>
          </div>
          <div class="ss-stage-progress">
            <div class="ss-dot-row" aria-label="Stage 2 progress">
              ${buildSpellingSessionDotRow(followUpWords.length, currentLookIndex, answeredLookCount)}
            </div>
          </div>
          ${currentLookWord ? `
            <section class="ss-looks-card">
              <p class="ss-stage-copy ss-stage-copy--lead">You heard <strong>${escapeHtml(currentLookWord.articulation || currentLookWord.word)}</strong>. Trust your eye — which spelling looks familiar?</p>
              <button type="button" class="ghost-button ghost-button--light ss-hear-again-button" data-spelling-play-looks-right="${currentLookWord.id}">Hear it again</button>
              <div class="ss-choice-grid">
                ${currentLookOptions
                  .map(
                    (option) => `
                      <button
                        type="button"
                        class="ss-choice-card ss-choice-card--compact${spelling.looksRight.awaitingAdvanceWordId === currentLookWord.id && option.value === spelling.looksRight.answers[currentLookWord.id] ? " is-selected" : ""}"
                        data-spelling-looks-right-word="${currentLookWord.id}"
                        data-spelling-looks-right-value="${escapeHtml(option.value)}"
                        ${spelling.looksRight.awaitingAdvanceWordId ? "disabled" : ""}
                      >
                        <span>${buildSpellingLooksRightChoiceSentence(
                          getSpellingLooksRightSentence(currentLookWord),
                          currentLookWord.word,
                          option.displayWord
                        )}</span>
                      </button>
                    `
                  )
                  .join("")}
              </div>
              ${spelling.looksRight.awaitingAdvanceWordId === currentLookWord.id ? `
                <div class="ss-status-note ss-status-note--feedback${spelling.looksRight.feedbackKind === "correct" ? " is-correct" : " is-incorrect"}">
                  <p>${escapeHtml(currentLookWord.lookRightNote || currentLookWord.familyNote || spelling.looksRight.feedbackMessage || "")}</p>
                </div>
                <div class="spelling-stage-actions spelling-stage-actions--footer">
                  <button type="button" class="primary-button primary-button--dark" data-spelling-looks-right-advance="${currentLookWord.id}">${escapeHtml(followUpWords.every((entry) => Boolean(spelling.looksRight.answers[entry.id])) ? "Finish stage" : "Next word")}</button>
                </div>
              ` : ""}
            </section>
          ` : ""}
        </article>
      `;
  } else if (stageId === "word-families") {
    const flashcardWords = getSpellingFlashcardWords(spelling);
    const currentFlashcardWord = getSpellingFlashcardCurrentWord(spelling);
    const currentFlashcardCard = currentFlashcardWord ? ensureSpellingFlashcardCard(spelling, currentFlashcardWord.id) : null;
    const flashcardExposureLimit = currentFlashcardWord ? getSpellingFlashcardExposureLimit(currentFlashcardWord.id) : SPELLING_FLASHCARD_EXPOSURE_COUNT;
    const currentFlashcardSentenceIndex = currentFlashcardCard
      ? Math.max(0, Math.min(currentFlashcardCard.exposureIndex, flashcardExposureLimit - 1, (currentFlashcardWord?.familySentences || []).length - 1))
      : 0;
    const currentFlashcardSentence = currentFlashcardWord?.familySentences?.[currentFlashcardSentenceIndex] || "";
    const currentFlashcardSentenceWord = currentFlashcardWord?.familyWords?.[currentFlashcardSentenceIndex] || "";
    const completedFlashcardCount = flashcardWords.filter((entry) => ensureSpellingFlashcardCard(spelling, entry.id).completed).length;
    const currentFlashcardIndex = currentFlashcardWord ? Math.max(0, flashcardWords.findIndex((entry) => entry.id === currentFlashcardWord.id)) : 0;
    stageBody = spelling.flashcards.completed
      ? `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head">
            <div>
              <p class="eyebrow">Complete</p>
              <h4>Stage 3 review</h4>
            </div>
            <span class="ss-stage-badge is-complete">Ribbon earned</span>
          </div>
          <p class="ss-stage-copy">You have finished the word-family sentence loop for this session.</p>
          <div class="ss-stage-progress">
            <span>${escapeHtml(`${stageScoreSummary["word-families"].correct}/${stageScoreSummary["word-families"].total} correct`)}</span>
            <span>${escapeHtml(`${getSpellingStageScorePercent(spelling, "word-families")}% score`)}</span>
          </div>
          <div class="ss-review-list">
            ${flashcardWords.map((entry) => `
              <article class="ss-review-row is-correct">
                <div>
                  <strong>${escapeHtml(entry.word)}</strong>
                  <span>${escapeHtml((entry.familyWords || []).join(" · "))}</span>
                </div>
                <span class="ss-review-mark">✓</span>
              </article>
            `).join("")}
          </div>
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="word-families">Reset stage</button>
          </div>
        </article>
      `
      : `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head ss-stage-panel__head--compact">
            <p class="eyebrow">Tap the root</p>
            <span class="ss-stage-counter">${escapeHtml(`Word ${completedFlashcardCount + 1} of ${flashcardWords.length}`)}</span>
          </div>
          ${currentFlashcardWord ? `
            <div class="ss-stage-progress">
              <div class="ss-dot-row" aria-label="Stage 3 progress">
                ${buildSpellingSessionDotRow(flashcardWords.length, currentFlashcardIndex, completedFlashcardCount)}
              </div>
            </div>
            <section class="ss-family-panel${currentFlashcardCard?.checked ? (currentFlashcardCard?.feedbackKind === "correct" ? " is-correct" : " is-incorrect") : ""}">
              ${currentFlashcardCard?.exposureIndex < flashcardExposureLimit ? `
                <div class="ss-family-stage-grid">
                  <div class="ss-family-keyword-panel">
                    <button
                      type="button"
                      class="ss-keyword-button"
                      data-spelling-flashcard-reveal="${currentFlashcardWord.id}"
                      ${currentFlashcardCard?.isShowingSentence ? "disabled" : ""}
                    >
                      ${escapeHtml(currentFlashcardWord.word)}
                      <span class="ss-keyword-pill">tap</span>
                    </button>
                  </div>
                  <div class="ss-family-sentence-card${currentFlashcardCard?.isShowingSentence ? " is-active" : ""}">
                    <p class="ss-family-sentence-label">Family word ${escapeHtml(String(Math.min((currentFlashcardCard?.exposureIndex || 0) + 1, flashcardExposureLimit)))} of ${escapeHtml(String(flashcardExposureLimit))} · ${escapeHtml((currentFlashcardSentenceWord || "").toUpperCase())}</p>
                    <p>${currentFlashcardCard?.isShowingSentence ? buildSpellingFamilySentenceMarkup(currentFlashcardSentence, currentFlashcardSentenceWord) : "tap the root word"}</p>
                  </div>
                </div>
                <div class="ss-family-strip">
                  ${(currentFlashcardWord.familyWords || []).map((word) => `<span>${escapeHtml(word)} ✓</span>`).join("")}
                </div>
              ` : `
                <div class="ss-family-recall">
                  <p class="ss-family-recall__prompt">Now type the root they share</p>
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
                  ${currentFlashcardCard?.checked ? `<div class="ss-status-note ss-status-note--feedback${currentFlashcardCard?.feedbackKind === "correct" ? " is-correct" : " is-incorrect"}"><p>${escapeHtml(currentFlashcardCard?.feedbackMessage || "")}</p></div>` : ""}
                  <div class="spelling-stage-actions spelling-stage-actions--footer">
                    ${currentFlashcardCard?.awaitingAdvance
                      ? `<button type="button" class="primary-button primary-button--dark" data-spelling-flashcard-advance="${currentFlashcardWord.id}">${escapeHtml(spelling.flashcards.completed ? "Finish stage" : "Next word")}</button>`
                      : `<button type="button" class="primary-button primary-button--dark" data-spelling-flashcard-submit="${currentFlashcardWord.id}">Check word</button>`}
                  </div>
                </div>
              `}
            </section>
          ` : ""}
        </article>
      `;
  } else if (stageId === "tense-transfer") {
    const currentFamilyWord = getSpellingTenseCurrentWord(spelling);
    const currentFamilyAnswer = currentFamilyWord ? ensureSpellingTenseAnswer(spelling, currentFamilyWord.id) : null;
    const completedTenseCount = followUpWords.filter((entry) => ensureSpellingTenseAnswer(spelling, entry.id).completed).length;
    const displayTenseProgress = Math.min(
      followUpWords.length,
      completedTenseCount + (currentFamilyAnswer?.awaitingAdvance ? 1 : 0)
    );
    const horseProgressIndex = Math.min(displayTenseProgress, Math.max(0, SPELLING_UNIT_SEED.followUpWordCount - 1));
    const horseProgressRatio = SPELLING_UNIT_SEED.followUpWordCount > 1
      ? horseProgressIndex / (SPELLING_UNIT_SEED.followUpWordCount - 1)
      : 0;
    const incorrectTenseCount = followUpWords.filter((entry) => ensureSpellingTenseAnswer(spelling, entry.id).feedbackKind === "incorrect").length;
    const hayRemaining = Math.max(0, SPELLING_UNIT_SEED.followUpWordCount - incorrectTenseCount);
    const currentTenseIndex = currentFamilyWord ? Math.max(0, followUpWords.findIndex((entry) => entry.id === currentFamilyWord.id)) : 0;
    const currentTensePrompt = currentFamilyWord ? getSpellingTensePrompt(spelling, currentFamilyWord) : null;
    const raceHorseMeta = SPELLING_PADDOCK_HORSES[getSpellingVisibleHorseCount(spelling)] || getSpellingOwnedHorseMeta(spelling)[0] || SPELLING_PADDOCK_HORSES[0];
    stageBody = spelling.tenseTransfer.completed
      ? `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head">
            <div>
              <p class="eyebrow">Complete</p>
              <h4>Stage 4 review</h4>
            </div>
            <span class="ss-stage-badge is-complete">Ribbon earned</span>
          </div>
          <p class="ss-stage-copy">The tense sort is complete for this session.</p>
          <div class="ss-stage-progress">
            <span>${escapeHtml(`${stageScoreSummary["tense-transfer"].correct}/${stageScoreSummary["tense-transfer"].total} correct`)}</span>
            <span>${escapeHtml(`${getSpellingStageScorePercent(spelling, "tense-transfer")}% score`)}</span>
          </div>
          <div class="ss-review-list">
            ${followUpWords.map((entry) => `
              <article class="ss-review-row${ensureSpellingTenseAnswer(spelling, entry.id).feedbackKind === "correct" ? " is-correct" : " is-incorrect"}">
                <div>
                  <strong>${escapeHtml(entry.word)}</strong>
                  <span>${escapeHtml(`${entry.tense?.past || ""} · ${entry.tense?.present || ""} · ${entry.tense?.future || ""}`)}</span>
                </div>
                <span class="ss-review-mark">${ensureSpellingTenseAnswer(spelling, entry.id).feedbackKind === "correct" ? "✓" : "✕"}</span>
              </article>
            `).join("")}
          </div>
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="tense-transfer">Reset stage</button>
          </div>
        </article>
      `
      : `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head ss-stage-panel__head--compact">
            <p class="eyebrow">Choose the tense</p>
            <span class="ss-stage-counter">${escapeHtml(`Word ${completedTenseCount + 1} of ${followUpWords.length}`)}</span>
          </div>
          ${currentFamilyWord && currentTensePrompt ? `
            <section class="ss-tense-race${currentFamilyAnswer?.checked ? (currentFamilyAnswer?.feedbackKind === "correct" ? " is-correct" : " is-incorrect") : ""}">
              <div class="ss-tense-race__scene">
                <div class="ss-tense-race__track" aria-label="Horse progress to the stable">
                  ${Array.from({ length: SPELLING_UNIT_SEED.followUpWordCount }, (_, index) => `
                    <span class="ss-tense-race__tile${index < displayTenseProgress ? " is-complete" : ""}${index === Math.min(displayTenseProgress, SPELLING_UNIT_SEED.followUpWordCount - 1) ? " is-current" : ""}"></span>
                  `).join("")}
                  <img class="ss-tense-race__horse" src="${escapeHtml(raceHorseMeta.image)}" alt="${escapeHtml(raceHorseMeta.label)}" style="--horse-progress-ratio:${escapeHtml(String(horseProgressRatio))};" />
                  <div class="ss-tense-race__stable">
                    <img src="/horses/Stables.png" alt="Stable" />
                    <div class="ss-tense-race__hay" aria-label="${escapeHtml(`${hayRemaining} hay bag${hayRemaining === 1 ? "" : "s"} left`)}">
                      ${Array.from({ length: SPELLING_UNIT_SEED.followUpWordCount }, (_, index) => `<span class="ss-tense-race__hay-bale${index < hayRemaining ? "" : " is-gone"}"></span>`).join("")}
                    </div>
                  </div>
                </div>
              </div>
              <div class="ss-stage-progress">
                <div class="ss-dot-row" aria-label="Stage 4 progress">
                  ${buildSpellingSessionDotRow(followUpWords.length, currentTenseIndex, completedTenseCount)}
                </div>
              </div>
              <div class="ss-tense-question">
                <p class="ss-tense-question__sentence">${buildSpellingFamilySentenceMarkup(currentTensePrompt.sentence, currentTensePrompt.wordForm)}</p>
                <p class="ss-family-recall__prompt">Is the highlighted word past, present, or future?</p>
              </div>
              <div class="ss-tense-choice-grid">
                ${SPELLING_TENSE_IDS.map((tenseId) => `
                  <button
                    type="button"
                    class="ss-tense-choice${currentFamilyAnswer?.selectedTense === tenseId ? " is-selected" : ""}"
                    data-spelling-tense-option="${escapeHtml(tenseId)}"
                    data-spelling-tense-word="${currentFamilyWord.id}"
                    ${currentFamilyAnswer?.awaitingAdvance ? "disabled" : ""}
                  >
                    ${escapeHtml(tenseId.charAt(0).toUpperCase() + tenseId.slice(1))}
                  </button>
                `).join("")}
              </div>
              ${currentFamilyAnswer?.checked ? `<div class="ss-status-note ss-status-note--feedback${currentFamilyAnswer?.feedbackKind === "correct" ? " is-correct" : " is-incorrect"}"><p>${escapeHtml(currentFamilyAnswer?.feedbackMessage || "")}</p></div>` : ""}
              <div class="spelling-stage-actions spelling-stage-actions--footer">
                ${currentFamilyAnswer?.awaitingAdvance
                  ? `<button type="button" class="primary-button primary-button--dark" data-spelling-tense-advance="${currentFamilyWord.id}">${escapeHtml(spelling.tenseTransfer.completed ? "Finish the set" : "Next word")}</button>`
                  : `<button type="button" class="primary-button primary-button--dark" data-spelling-tense-submit="${currentFamilyWord.id}">Check answer</button>`}
              </div>
            </section>
          ` : ""}
        </article>
      `;
  } else {
    const earnedHorseMeta = getSpellingPaddockHorseMeta(spelling.lastUnlockedHorseId || spelling.paddockHorses[spelling.paddockHorses.length - 1]);
    const repeatWord = getSpellingRepeatCurrentWord(spelling);
    const repeatCompletedCount = Object.keys(spelling.repeatCheck.responses || {}).length;
    const rewardLadderSnapshot = RewardProperty.getRewardLadderSnapshot ? RewardProperty.getRewardLadderSnapshot() : null;
    stageBody = showSessionCompletionSummary
      ? `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head">
            <div>
              <p class="eyebrow">Session complete</p>
              <h4>Session reward summary</h4>
            </div>
            <span class="ss-stage-badge is-complete">${escapeHtml(rewardLadderSnapshot?.pendingChoiceCount ? "Reward ready" : "Session finished")}</span>
          </div>
          <p class="ss-stage-copy">${escapeHtml(`Overall score: ${overallScorePercent}%. You moved from ${getSpellingDiagnosticCorrectCount(spelling)}/${attemptWords.length} in stage 1 to ${getSpellingRepeatCorrectCount(spelling)}/${attemptWords.length} in stage 5.${earnedHorseMeta ? ` ${earnedHorseMeta.label || "A new horse"} earned for your stables.` : ""}`)}</p>
          ${earnedHorseMeta ? `
            <article class="ss-earned-horse-card">
              <img class="spelling-horse-card__image" src="${escapeHtml(earnedHorseMeta.image)}" alt="${escapeHtml(earnedHorseMeta.name)}" />
              <div class="spelling-horse-card__copy">
                <strong>${escapeHtml(`${earnedHorseMeta.name} · ${earnedHorseMeta.label}`)}</strong>
                <span>${escapeHtml(getSpellingHorseRankLabel(getSpellingVisibleHorseCount(spelling)))}</span>
              </div>
            </article>
          ` : ""}
          <div class="ss-review-list">
            ${Object.entries(stageScoreSummary)
              .map(([stageKey, stageScore]) => `
                <article class="ss-review-row${getSpellingStageScorePercent(spelling, stageKey) >= 50 ? " is-correct" : " is-incorrect"}">
                  <div>
                    <strong>${escapeHtml(stageScore.label)}</strong>
                    <span>${escapeHtml(`${stageScore.correct}/${stageScore.total} · ${getSpellingStageScorePercent(spelling, stageKey)}%`)}</span>
                  </div>
                  <span class="ss-review-mark">${getSpellingStageScorePercent(spelling, stageKey) >= 50 ? "✓" : "✕"}</span>
                </article>
              `)
              .join("")}
          </div>
          <div class="spelling-review-card__days">
            ${SPELLING_UNIT_SEED.reviewDays.map((dayLabel) => `<span class="is-done">${escapeHtml(dayLabel)}</span>`).join("")}
          </div>
          ${buildSpellingRewardChoiceMarkup(rewardLadderSnapshot)}
          ${buildSpellingRewardLadderMarkup(rewardLadderSnapshot)}
          <div class="spelling-stage-actions spelling-stage-actions--centered">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-unit="true">Begin another session</button>
            <button type="button" class="primary-button primary-button--dark" data-spelling-finish-session="true">Visit the stables</button>
          </div>
        </article>
      `
      : spelling.repeatCheck.completed
      ? `
        <article class="ss-stage-panel">
          <div class="ss-stage-panel__head">
            <div>
              <p class="eyebrow">Complete</p>
              <h4>Stage 5 review</h4>
            </div>
            <span class="ss-stage-badge is-complete">Ribbon earned</span>
          </div>
          <p class="ss-stage-copy">${escapeHtml(`The final spelling check is complete. You moved from ${getSpellingDiagnosticCorrectCount(spelling)}/${attemptWords.length} to ${getSpellingRepeatCorrectCount(spelling)}/${attemptWords.length}.`)}</p>
          <div class="ss-stage-progress">
            <span>${escapeHtml(`${stageScoreSummary["repeat-check"].correct}/${stageScoreSummary["repeat-check"].total} correct`)}</span>
            <span>${escapeHtml(`${getSpellingStageScorePercent(spelling, "repeat-check")}% score`)}</span>
          </div>
          <div class="ss-review-list">
            ${attemptWords.map((wordEntry) => {
              const diagnosticResponse = spelling.diagnostic.responses[wordEntry.id] || {};
              const repeatResponse = spelling.repeatCheck.responses[wordEntry.id] || {};
              const repeatCorrect = Boolean(repeatResponse.correct);
              return `
                <article class="ss-review-row${repeatCorrect ? " is-correct" : " is-incorrect"}">
                  <div>
                    <strong>${escapeHtml(wordEntry.word)}</strong>
                    <span>${escapeHtml(`Stage 1: ${diagnosticResponse.attempt || "No answer"} · Stage 5: ${repeatResponse.attempt || "No answer"}`)}</span>
                  </div>
                  <span class="ss-review-mark">${repeatCorrect ? "✓" : "✕"}</span>
                </article>
              `;
            }).join("")}
          </div>
          <div class="spelling-stage-actions">
            <button type="button" class="ghost-button ghost-button--small" data-spelling-reset-activity="repeat-check">Reset stage</button>
          </div>
        </article>
      `
      : `
        <article class="ss-stage-panel ss-stage-panel--diagnostic">
          <div class="ss-stage-panel__head ss-stage-panel__head--compact">
            <p class="eyebrow">Final check</p>
            <span class="ss-stage-counter">${escapeHtml(`Word ${Math.min(spelling.repeatCheck.currentIndex + 1, attemptWords.length)} of ${attemptWords.length}`)}</span>
          </div>
          <div class="spelling-diagnostic-dots spelling-diagnostic-dots--large" aria-label="Final spelling check progress">
            ${attemptWords
              .map((_, index) => `
                <span class="spelling-diagnostic-dot${index < spelling.repeatCheck.currentIndex ? " is-complete" : ""}${index === spelling.repeatCheck.currentIndex ? " is-current" : ""}"></span>
              `)
              .join("")}
          </div>
          <div class="ss-audio-actions">
            <button type="button" class="primary-button primary-button--dark" data-spelling-play-repeat="true">Hear the word</button>
            <button type="button" class="ghost-button ghost-button--light" data-spelling-play-repeat-sentence="true">Hear it in a sentence</button>
          </div>
          ${buildSpellingAudioStatusMarkup("repeat-check", repeatWord)}
          <label class="spelling-input-label" for="spelling-repeat-input">Type your spelling</label>
          <input
            id="spelling-repeat-input"
            class="reader-editor spelling-inline-input spelling-inline-input--hero"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            value="${escapeHtml(spelling.repeatCheck.currentInput)}"
            placeholder="Type the spelling"
          />
          <div class="ss-status-note ss-status-note--soft">
            <span class="ss-status-dot"></span>
            <p>Repeat the same ten words so we can compare this round with the first check.</p>
          </div>
          <div class="spelling-stage-actions spelling-stage-actions--footer">
            <button type="button" class="primary-button primary-button--dark" data-spelling-submit-repeat="true">
              ${repeatCompletedCount >= attemptWords.length - 1 ? "Finish stage" : "Next word"}
            </button>
          </div>
        </article>
      `;
  }

  host.innerHTML = `
    <section class="ss-root spelling-shell" data-spelling-font="${escapeHtml(spelling.preferences.font)}" data-spelling-spacing="${escapeHtml(spelling.preferences.spacing)}" data-spelling-tint="${escapeHtml(spelling.preferences.tint)}">
      ${buildSpellingSurfaceTabs("session")}

      <div class="ss-layout">
        <div class="ss-main">
          ${stageBody}
        </div>

        <aside class="ss-side">
          ${buildSpellingStageSidebar(subject, spelling, stageId)}
        </aside>
      </div>
    </section>
  `;

  setupSpellingPaddockInteractions(subject, host);
  bindSpellingNavigationInteractions(subject, host);

  host.querySelector("[data-spelling-reset-unit]")?.addEventListener("click", () => {
    const spelling = getSubjectSpellingState(subject);
    resetSpellingProgressForNewAttempt(spelling);
    spelling.homeTab = "session";
    spelling.sessionPreparedKey = currentSpellingSessionKey;
    persistSubjects();
    render();
  });

  host.querySelector("[data-spelling-continue-stage]")?.addEventListener("click", () => {
    continueSpellingStageToTarget(subject, host.querySelector("[data-spelling-continue-stage]")?.dataset.spellingContinueStage || "");
    render();
  });

  host.querySelector("[data-spelling-finish-session]")?.addEventListener("click", () => {
    finishSpellingSession(subject);
    render();
  });

  host.querySelectorAll("[data-spelling-claim-reward]").forEach((button) => {
    button.addEventListener("click", () => {
      const claimResult = RewardProperty.claimReward ? RewardProperty.claimReward(button.dataset.spellingClaimReward || "") : null;
      if (claimResult?.message) {
        const nextSpelling = getSubjectSpellingState(subject);
        nextSpelling.coachMessage = claimResult.message;
        persistSubjects({ skipRemoteSync: true });
      }
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
      if (spelling.looksRight.awaitingAdvanceWordId) {
        return;
      }
      selectSpellingLooksRightAnswer(subject, button.dataset.spellingLooksRightWord, button.dataset.spellingLooksRightValue);
      render();
    });
  });

  host.querySelectorAll("[data-spelling-play-looks-right]").forEach((button) => {
    button.addEventListener("click", () => {
      const wordId = button.dataset.spellingPlayLooksRight || "";
      const entry = SPELLING_INTERVENTION_LIBRARY[wordId];
      if (!entry) {
        return;
      }
      void speakTextWithOpenAi(`You heard ${entry.word}. ${entry.sentence || ""}`, {
        context: `spelling:looks-right:${entry.id}`,
        statusMessages: {
          preparing: "Preparing spelling audio...",
          playing: "Reading spelling cue...",
          error: "Spelling audio failed."
        }
      }).catch((error) => {
        console.error("Looks-right spelling audio failed.", error);
      });
    });
  });

  host.querySelectorAll("[data-spelling-looks-right-advance]").forEach((button) => {
    button.addEventListener("click", () => {
      advanceSpellingLooksRightWord(subject);
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
      card.awaitingAdvance = false;
      card.feedbackKind = "";
      card.feedbackMessage = "";
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

  host.querySelectorAll("[data-spelling-flashcard-advance]").forEach((button) => {
    button.addEventListener("click", () => {
      advanceSpellingFlashcardWord(subject, button.dataset.spellingFlashcardAdvance);
      render();
    });
  });

  host.querySelectorAll("[data-spelling-tense-option]").forEach((button) => {
    button.addEventListener("click", () => {
      selectSpellingTenseOption(subject, button.dataset.spellingTenseWord, button.dataset.spellingTenseOption);
      render();
    });
  });

  host.querySelectorAll("[data-spelling-tense-submit]").forEach((button) => {
    button.addEventListener("click", () => {
      checkSpellingTenseTransfer(subject, button.dataset.spellingTenseSubmit);
      render();
    });
  });

  host.querySelectorAll("[data-spelling-tense-advance]").forEach((button) => {
    button.addEventListener("click", () => {
      advanceSpellingTenseTransfer(subject, button.dataset.spellingTenseAdvance);
      render();
    });
  });

  host.querySelector("[data-spelling-play-repeat]")?.addEventListener("click", () => {
    const input = host.querySelector("#spelling-repeat-input");
    spelling.repeatCheck.currentInput = input?.value || spelling.repeatCheck.currentInput;
    persistSubjects({ skipRemoteSync: true });
    speakSpellingRepeatWord(getSpellingRepeatCurrentWord(getSubjectSpellingState(subject)));
  });

  host.querySelector("[data-spelling-play-repeat-sentence]")?.addEventListener("click", () => {
    const input = host.querySelector("#spelling-repeat-input");
    spelling.repeatCheck.currentInput = input?.value || spelling.repeatCheck.currentInput;
    persistSubjects({ skipRemoteSync: true });
    speakSpellingRepeatSentence(getSpellingRepeatCurrentWord(getSubjectSpellingState(subject)));
  });

  host.querySelector("#spelling-repeat-input")?.addEventListener("input", (event) => {
    spelling.repeatCheck.currentInput = event.target.value;
    persistSubjects({ skipRemoteSync: true });
  });

  host.querySelector("#spelling-repeat-input")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSpellingRepeatWord(subject, event.currentTarget.value);
      render();
      if (!getSubjectSpellingState(subject).repeatCheck.completed) {
        speakSpellingRepeatWord(getSpellingRepeatCurrentWord(getSubjectSpellingState(subject)));
      }
    }
  });

  host.querySelector("#spelling-repeat-input")?.addEventListener("blur", () => {
    persistSubjects();
  });

  host.querySelector("[data-spelling-submit-repeat]")?.addEventListener("click", () => {
    submitSpellingRepeatWord(subject, host.querySelector("#spelling-repeat-input")?.value || "");
    render();
    if (!getSubjectSpellingState(subject).repeatCheck.completed) {
      speakSpellingRepeatWord(getSpellingRepeatCurrentWord(getSubjectSpellingState(subject)));
    }
  });
}

function renderPractice() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  const homeworkBundles = getSubjectHomeworkBundles(subject);
  const grammarSpotlightMarkup = buildPracticeGrammarSpotlight(subject);
  if (!homeworkBundles.length) {
    elements.practiceList.innerHTML = grammarSpotlightMarkup
      ? `
        ${grammarSpotlightMarkup}
        <div class="empty-state empty-state--compact">No homework items for this subject yet.</div>
      `
      : `<div class="empty-state">No homework items for this subject yet.</div>`;
    if (elements.subjectHomeworkUpcomingList) {
      elements.subjectHomeworkUpcomingList.innerHTML = `<div class="empty-state empty-state--compact">Nothing else is queued for this week.</div>`;
    }
    elements.practiceList.querySelectorAll("[data-open-practice-grammar]").forEach((button) => {
      button.addEventListener("click", () => {
        expandSubjectWorkspace("grammar");
      });
    });
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
    ${grammarSpotlightMarkup}
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
  elements.practiceList.querySelectorAll("[data-open-practice-grammar]").forEach((button) => {
    button.addEventListener("click", () => {
      expandSubjectWorkspace("grammar");
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

function buildPracticeGrammarSpotlight(subject) {
  if (subject?.id !== "spelling") {
    return "";
  }

  const grammar = getSubjectGrammarState(subject);
  if (!grammar.enabled) {
    return "";
  }

  const hasCurrentActivity = Number(grammar.current?.n || 0) > grammar.done;
  const statusLabel = hasCurrentActivity ? "Continue" : "Ready";
  const actionLabel = hasCurrentActivity ? "Continue activity" : "Start activity";
  const summaryCopy = hasCurrentActivity
    ? "Your place is saved, so the current grammar activity can open straight away."
    : "Open Grammar and the next activity in the cycle will be ready to go immediately.";

  return `
    <article class="homework-focus-card homework-focus-card--grammar">
      <div class="homework-focus-card__header">
        <div>
          <p class="eyebrow">Grammar · session program</p>
          <h3>${escapeHtml(hasCurrentActivity ? "Grammar is ready to continue" : "Grammar is ready")}</h3>
        </div>
        <span class="homework-focus-card__due">${escapeHtml(statusLabel)}</span>
      </div>
      <div class="homework-focus-card__panda-row">
        <div>
          <strong>Open the full grammar workspace</strong>
          <span>${escapeHtml(summaryCopy)}</span>
        </div>
        <button type="button" class="task-inline-link" data-open-practice-grammar="true">Go to grammar</button>
      </div>
      <div class="homework-focus-card__actions">
        <button type="button" class="primary-button primary-button--dark" data-open-practice-grammar="true">${escapeHtml(actionLabel)}</button>
      </div>
    </article>
  `;
}

function playAskResponseForSurface(activeSurface, answerToPlay) {
  speakTextWithOpenAi(answerToPlay, {
    context: "ask",
    statusElement: activeSurface?.response || null,
    statusMessages: {
      preparing: "Preparing Panda's answer...",
      playing: "Playing Panda's answer...",
      error: "AI voice playback failed for this answer."
    },
    onStatusChange: (_status, message) => {
      setAskSurfaceStatus(activeSurface, message);
    },
    onFinished: () => {
      setAskSurfaceStatus(activeSurface, getAskReadyStatus());
      renderAskContext();
    }
  }).catch((error) => {
    console.error("OpenAI speech failed.", error);
    stopListening();
    const message = error instanceof Error ? `Listen failed: ${error.message}` : "Listen failed.";
    setAskSurfaceStatus(activeSurface, message);
  });
}

async function handleAsk({ autoPlayResponse = false } = {}) {
  const subject = getSelectedSubject();
  const activeSurface = getActiveAskSurface();
  if (!subject) {
    return;
  }
  const question = activeSurface?.input?.value.trim() || "";
  const document = activeSurface?.kind === "landing"
    ? getLandingAskRequestDocument(getSubjectLandingOpenDocument(subject))
    : getActiveAskDocument(activeSurface);
  if (!question) {
    setAskSurfaceStatus(activeSurface, "Write a question first so the AI can focus on what you need help with.");
    return;
  }

  setAskSurfaceStatus(activeSurface, "Thinking...");

  let answer = "";
  try {
    answer = await requestAskAnswer(question, subject, document);
  } catch (error) {
    const message = error instanceof Error ? `Ask AI failed: ${error.message}` : "Ask AI failed.";
    setAskSurfaceStatus(activeSurface, message);
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
  setAskSurfaceStatus(activeSurface, answer);
  if (activeSurface?.input) {
    activeSurface.input.value = "";
  }
  if (activeSurface?.kind === "landing") {
    state.subjectLandingAskDraft = "";
    state.subjectLandingAskAnswer = answer;
    state.subjectLandingAskLastQuestion = question;
  } else {
    state.askLatestSubjectId = subject.id;
    state.askStatusSubjectId = subject.id;
    state.askLatestQuestion = question;
    state.askLatestAnswer = answer;
  }
  renderAskContext();
  if (autoPlayResponse) {
    playAskResponseForSurface(activeSurface, answer);
  }
}

function handleAskMicToggle() {
  if (state.askMicActive) {
    stopAskMicrophone();
    return;
  }
  startAskMicrophone();
}

function handleAskListen() {
  const activeSurface = getActiveAskSurface();
  if (state.askResponseSpeaking && !state.askResponsePaused) {
    return;
  }

  const subject = getSelectedSubject();
  const question = activeSurface?.input?.value.trim() || "";
  const document = activeSurface?.kind === "landing"
    ? getLandingAskRequestDocument(getSubjectLandingOpenDocument(subject))
    : getActiveAskDocument(activeSurface);

  if (canReplayStoredAskAnswer(activeSurface, question)) {
    const answerToPlay = getAskPlaybackText(activeSurface);
    if (answerToPlay) {
      playAskResponseForSurface(activeSurface, answerToPlay);
      return;
    }
  }

  if (!subject) {
    return;
  }

  if (!question) {
    setAskSurfaceStatus(activeSurface, "Write a question first so Panda knows what to answer.");
    renderAskVoiceControls();
    return;
  }

  setAskSurfaceStatus(activeSurface, "Thinking...");
  requestAskAnswer(question, subject, document)
    .then((answer) => {
      subject.askHistory = Array.isArray(subject.askHistory) ? subject.askHistory : [];
      subject.askHistory.push({
        id: createId(),
        dateKey: currentDateKey(),
        question,
        answer
      });
      persistSubjects();
      storeAskAnswerForSurface(activeSurface, question, answer);
      playAskResponseForSurface(activeSurface, answer);
    })
    .catch((error) => {
      const message = error instanceof Error ? `Ask AI failed: ${error.message}` : "Ask AI failed.";
      setAskSurfaceStatus(activeSurface, message);
    });
}

function handleAskPauseToggle() {
  const activeSurface = getActiveAskSurface();
  if (!state.askResponseSpeaking) {
    return;
  }

  if (state.askResponsePaused) {
    void resumeListening()
      .then(() => {
        setAskSurfaceStatus(activeSurface, "Playing Panda's answer...");
      })
      .catch((error) => {
        const message = error instanceof Error ? `Listen failed: ${error.message}` : "Listen failed.";
        setAskSurfaceStatus(activeSurface, message);
      });
    return;
  }

  void pauseListening()
    .then(() => {
      setAskSurfaceStatus(activeSurface, "Paused. Choose Resume to continue.");
    })
    .catch((error) => {
      const message = error instanceof Error ? `Listen failed: ${error.message}` : "Listen failed.";
      setAskSurfaceStatus(activeSurface, message);
    });
}

function handleAskStop() {
  const activeSurface = getActiveAskSurface();
  stopListening();
  setAskSurfaceStatus(
    activeSurface,
    getStoredAskAnswer(activeSurface) ? getAskReadyStatus() : getAskIdleStatus(activeSurface)
  );
}

function handleAskRewind() {
  if (currentAudioContext !== "ask") {
    return;
  }
  if (seekCurrentAskPlayback(-10)) {
    renderAskVoiceControls();
  }
}

function handleAskFastForward() {
  if (currentAudioContext !== "ask") {
    return;
  }
  if (seekCurrentAskPlayback(10)) {
    renderAskVoiceControls();
  }
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

const STUDY_PLAN_VERSION = 4;

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
    revisionArchived: false,
    reviewed: false,
    reviewMode: "",
    pages: [],
    studyOverview: "",
    studyPlanStatus: "idle",
    studyPlanVersion: 0,
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
    bullets: Array.isArray(section?.bullets)
      ? section.bullets.map((bullet) => String(bullet || "").trim()).filter(Boolean).slice(0, 4)
      : [],
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

function extractStudySentences(value) {
  return String(value || "")
    .split(/[\n•]+/)
    .flatMap((chunk) => String(chunk || "").split(/(?<=[.!?])\s+/))
    .map((sentence) => normaliseWhitespace(sentence))
    .filter(Boolean)
    .filter((sentence) => !/^page\s+\d+\b/i.test(sentence));
}

function scoreStudySentence(sentence, importantTerms = []) {
  const lowerSentence = String(sentence || "").toLowerCase();
  const termHits = importantTerms.reduce((count, term) => {
    const lowerTerm = String(term || "").trim().toLowerCase();
    return lowerTerm && lowerSentence.includes(lowerTerm) ? count + 1 : count;
  }, 0);
  const cueHits = (lowerSentence.match(/\b(is|means|shows|explains|because|therefore|causes|includes|uses|forms|affects|results|theme|evidence|process|formula|definition|function|purpose|structure)\b/g) || []).length;
  const numberHits = (lowerSentence.match(/\b\d+(?:\.\d+)?\b/g) || []).length;
  const lengthScore = Math.min(4, Math.max(0, Math.round(lowerSentence.length / 40)));
  return termHits * 4 + cueHits * 2 + numberHits + lengthScore;
}

function buildCoreStudySummary(value, importantTerms = [], maxLength = 220) {
  const sentences = extractStudySentences(value)
    .filter((sentence) => sentence.length >= 28)
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreStudySentence(sentence, importantTerms)
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);

  if (!sentences.length) {
    return summariseSectionText(value, maxLength);
  }

  const chosen = sentences
    .slice(0, 2)
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.sentence.replace(/[.!?]+$/, "").trim());
  const combined = normaliseWhitespace(chosen.join(". "));
  if (!combined) {
    return summariseSectionText(value, maxLength);
  }
  if (combined.length <= maxLength) {
    return combined;
  }
  return summariseSectionText(combined, maxLength);
}

function buildCoreStudyBullets(value, importantTerms = [], limit = 3) {
  const rankedSentences = extractStudySentences(value)
    .map((sentence, index) => ({
      sentence: sentence.replace(/[.!?]+$/, "").trim(),
      index,
      score: scoreStudySentence(sentence, importantTerms)
    }))
    .filter((entry) => entry.sentence.length >= 18)
    .sort((left, right) => right.score - left.score || left.index - right.index);

  const chosen = [];
  rankedSentences.forEach((entry) => {
    if (chosen.length >= limit) {
      return;
    }
    if (chosen.some((candidate) => candidate.toLowerCase() === entry.sentence.toLowerCase())) {
      return;
    }
    chosen.push(entry.sentence);
  });

  if (chosen.length) {
    return chosen;
  }

  if (importantTerms.length) {
    return importantTerms.slice(0, limit).map((term) => `Focus on ${term}`);
  }

  return ["Read the main idea closely", "Pull out the strongest detail", "Keep the key terms in mind"];
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
  const targetSectionCount = getRecommendedStudySectionCountForDocument(documentRecord);
  const rawSections = usablePages.length
    ? (() => {
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
    : (() => {
        const textBlocks = String(documentRecord.content || "")
          .split(/\n{2,}/)
          .map((block) => normaliseWhitespace(block))
          .filter((block) => block.length >= 60);
        if (!textBlocks.length) {
          return [{ title: "Overview", summary: summariseSectionText(sourceText), sectionText: sourceText, pageStart: null, pageEnd: null }];
        }
        const chunkSize = Math.max(1, Math.ceil(textBlocks.length / Math.min(targetSectionCount, textBlocks.length)));
        return Array.from({ length: Math.ceil(textBlocks.length / chunkSize) }, (_, index) => {
          const group = textBlocks.slice(index * chunkSize, (index + 1) * chunkSize);
          const sectionText = group.join("\n\n");
          return {
            title: `Section ${index + 1}`,
            summary: summariseSectionText(sectionText),
            sectionText,
            pageStart: null,
            pageEnd: null
          };
        }).filter((section) => section.sectionText);
      })();

  const usableSections = rawSections
    .map((section, index) => {
      const sectionText = section.sectionText || sourceText;
      const importantTerms = extractImportantTermsFromText(sectionText).slice(0, 8);
      return normaliseStudySection({
        id: `section-${index + 1}`,
        title: section.title,
        summary: buildCoreStudySummary(section.summary || sectionText, importantTerms),
        sectionText,
        pageStart: section.pageStart,
        pageEnd: section.pageEnd,
        bullets: buildCoreStudyBullets(sectionText, importantTerms, 3),
        importantTerms
      }, index);
    })
    .filter((section) => section.sectionText);

  const sections = usableSections.length
    ? usableSections
    : [normaliseStudySection({
        id: "section-1",
        title: "Overview",
        summary: buildCoreStudySummary(sourceText),
        sectionText: sourceText || "No readable text is available for this document yet.",
        bullets: buildCoreStudyBullets(sourceText, [], 3),
        importantTerms: []
      }, 0)];

  const allImportantTerms = extractImportantTermsFromText(sourceText).slice(0, 20);
  const quizTerms = allImportantTerms.slice(0, 4);
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
    overview: buildCoreStudySummary(sourceText, allImportantTerms.slice(0, 8), 260),
    importantTerms: allImportantTerms,
    sections,
    quiz
  };
}

function getDocumentReadabilityWarning(documentRecord) {
  const storedWarning = String(documentRecord?.readabilityWarning || "").trim();
  if (storedWarning) {
    return storedWarning;
  }

  if (!documentRecord?.ocrAttempted || documentRecord?.ocrUsed) {
    return !getMeaningfulPdfText(documentRecord?.content).length && Array.isArray(documentRecord?.pages) && documentRecord.pages.length
      ? "PaperPanda could not find enough readable text in this document. Upload a searchable PDF with selectable text or a cleaner export."
      : "";
  }

  const errorDetail = String(documentRecord.ocrError || "").trim();
  return [
    "This PDF appears to be image-only, so PaperPanda could not extract readable text directly.",
    errorDetail
      ? `OCR could not finish: ${errorDetail}`
      : "OCR could not finish for this file.",
    "To make it read properly, run the backend with a working OpenAI key or upload a searchable PDF with selectable text."
  ].join(" ");
}

function createWholeStudyDocumentRecord(fileName, flags, originalFile, extracted = {}) {
  const sanitizedName = fileName.replace(/\.[^.]+$/, "");
  const pages = Array.isArray(extracted?.pages)
    ? extracted.pages.map((page) => ({
        pageNumber: Number(page?.pageNumber || 0),
        text: String(page?.text || "").trim(),
        imageUrl: page?.imageUrl || null,
        askImageUrl: page?.askImageUrl || page?.imageUrl || null,
        questionBlocks: Array.isArray(page?.questionBlocks)
          ? page.questionBlocks.map(normaliseQuestionBlock).filter((block) => block.questionNumber && block.text)
          : []
      }))
    : [];
  const firstPagePreview = pages.find((page) => page.imageUrl)?.imageUrl || null;
  const fullText = String(extracted?.fullText || "").trim();
  const ocrAttempted = Boolean(extracted?.ocrAttempted);
  const ocrUsed = Boolean(extracted?.ocrUsed);
  const ocrError = String(extracted?.ocrError || "").trim();
  const readabilityWarning =
    !fullText && ocrAttempted && !ocrUsed
      ? [
          "This PDF appears to be image-only, and PaperPanda could not complete OCR for it.",
          ocrError ? `OCR error: ${ocrError}` : "",
          "Start the backend with a working OPENAI_API_KEY or upload a searchable PDF with selectable text."
        ].filter(Boolean).join(" ")
      : "";
  const record = createDocumentWithFlags(
    {
      title: sanitizedName,
      type: flags.classNotes ? "Class Notes" : flags.assessment ? "Assessment" : flags.homework ? "Homework" : "Document",
      content: fullText
    },
    flags
  );
  record.originalFile = originalFile;
  record.previewImageUrl = firstPagePreview;
  record.pages = pages;
  record.readabilityWarning = readabilityWarning;
  record.ocrAttempted = ocrAttempted;
  record.ocrUsed = ocrUsed;
  record.ocrError = ocrError;
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

function splitWorksheetTextIntoLines(text) {
  return String(text || "")
    .replace(/^Page\s+\d+\s*/i, "")
    .split(/\n+/)
    .map((line) => String(line || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function getWorksheetQuestionLineMatch(line) {
  const source = String(line || "").trim();
  if (!source) {
    return null;
  }

  const patterns = [
    /^(?:question|q)\s*([0-9]{1,3}[a-z]?)\b[\s:.)-]*(.*)$/i,
    /^([0-9]{1,3}[a-z]?)\s*[\])}.:-]\s*(.+)$/i,
    /^([0-9]{1,3}[a-z]?)\s+(?=[A-Z(])(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match) {
      continue;
    }
    const questionNumber = normaliseWorksheetQuestionNumber(match[1]);
    if (!questionNumber) {
      continue;
    }
    return {
      questionNumber,
      remainder: String(match[2] || "").trim()
    };
  }

  return null;
}

function buildWorksheetQuestionBlocksFromText(text, pageNumber = 0) {
  const lines = splitWorksheetTextIntoLines(text);
  const blocks = [];
  let currentBlock = null;

  lines.forEach((line) => {
    const questionLine = getWorksheetQuestionLineMatch(line);
    if (questionLine) {
      if (currentBlock?.textLines?.length) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        questionNumber: questionLine.questionNumber,
        pageNumber: Math.max(1, Number(pageNumber || 0) || 0),
        order: blocks.length,
        textLines: [line]
      };
      return;
    }

    if (currentBlock) {
      currentBlock.textLines.push(line);
    }
  });

  if (currentBlock?.textLines?.length) {
    blocks.push(currentBlock);
  }

  return blocks
    .map((block) => normaliseQuestionBlock({
      questionNumber: block.questionNumber,
      pageNumber: block.pageNumber,
      order: block.order,
      text: block.textLines.join("\n").trim()
    }))
    .filter((block) => block.questionNumber && block.text);
}

function getPdfTextSignal(text) {
  const meaningfulText = getMeaningfulPdfText(text);
  const words = meaningfulText ? meaningfulText.split(/\s+/).filter(Boolean) : [];
  const alphaChars = (meaningfulText.match(/[A-Za-z]/g) || []).length;
  const digitChars = (meaningfulText.match(/\d/g) || []).length;
  const mathsSymbolChars = (meaningfulText.match(/[=+\-*/^%<>()[\]{}|\\_~×÷±√∑∫∞≈≠≤≥πθ∆]/g) || []).length;
  const longWords = words.filter((word) => /[A-Za-z]{3,}/.test(word)).length;
  return {
    meaningfulText,
    length: meaningfulText.length,
    alphaChars,
    digitChars,
    mathsSymbolChars,
    wordCount: words.length,
    longWordCount: longWords
  };
}

function shouldUseBackendOcrForPdfPage(page) {
  const signal = getPdfTextSignal(page?.text);
  const symbolHeavyLowContext =
    signal.length >= 80 &&
    signal.longWordCount < 6 &&
    signal.alphaChars < 36 &&
    signal.digitChars + signal.mathsSymbolChars >= 18;
  return (
    signal.length < 80 ||
    signal.longWordCount < 8 ||
    (signal.alphaChars < 28 && signal.wordCount < 18) ||
    (signal.alphaChars < 48 && signal.length < 180) ||
    symbolHeavyLowContext
  );
}

function shouldUseBackendPdfOcr(pdfData) {
  const pages = Array.isArray(pdfData?.pages) ? pdfData.pages : [];
  if (!pages.length) {
    return false;
  }

  const sparsePages = pages.filter((page) => shouldUseBackendOcrForPdfPage(page)).length;
  return (
    sparsePages > 0 &&
    (
      sparsePages === pages.length ||
      sparsePages >= Math.ceil(pages.length / 2) ||
      getPdfTextSignal(pdfData.fullText).length < pages.length * 60
    )
  );
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
  const formData = new FormData();
  formData.append("file", file, file.name);
  try {
    return await requestApiFormData("/api/upload/pdf", formData, {
      timeoutMs: 240_000,
      timeoutMessage: "PDF processing took too long. Try a smaller file or let the backend finish downloading its OCR model, then upload again."
    });
  } catch (backendError) {
    console.warn("Backend PDF processing failed; using browser-extracted PDF content instead.", backendError);
  }

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
    const blockText = pageText ? `Page ${pageNumber}\n${pageText}` : "";

    if (pageText) {
      pages.push({
        pageNumber,
        text: blockText,
        imageUrl,
        askImageUrl: imageUrl,
        questionBlocks: buildWorksheetQuestionBlocksFromText(pageText, pageNumber),
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
        askImageUrl: imageUrl,
        questionBlocks: [],
        startIndex: currentIndex,
        endIndex: currentIndex
      });
    }
  }

  return {
    fullText,
    pages,
    ocrAttempted: true,
    ocrUsed: false,
    ocrError: "Backend PDF processing failed; browser text extraction was used instead."
  };
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
  if (isImageDocumentFile(file)) {
    return "image";
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

  if (isImageDocumentFile(file)) {
    const imageData = await buildImageDocumentData(file);
    const records = [createWholeStudyDocumentRecord(file.name, flags, originalFile, imageData)];
    return {
      records
    };
  }

  if (lowerName.endsWith(".docx")) {
    const content = await extractDocxText(file);
    const records = [
      createWholeStudyDocumentRecord(file.name, flags, originalFile, {
        fullText: String(content || "").trim(),
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
        fullText: String(content || "").trim(),
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
  let uploadSavedLocally = false;
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
      state.focusArea = null;
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
    state.focusArea = null;
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

    const remoteSubjectsSequence = persistSubjects();
    uploadSavedLocally = true;
    if (state.authToken && remoteSubjectsSequence) {
      elements.uploadStatus.textContent = "Saving uploaded documents to your account...";
      await waitForRemoteSubjectsPersist(remoteSubjectsSequence);
    }
    if (flags.homework) {
      state.selectedSubjectId = subject.id;
      state.currentView = "subjects";
      state.activeSubjectTab = "homework";
      state.focusArea = null;
    } else if (flags.assessment) {
      state.selectedSubjectId = subject.id;
      state.currentView = "subjects";
      state.activeSubjectTab = "assessments";
      state.focusArea = null;
    } else if (flags.classNotes) {
      state.selectedSubjectId = subject.id;
      state.currentView = "subjects";
      state.activeSubjectTab = "reader";
      state.focusArea = null;
    }
    state.selectedDocumentId = getReaderDocuments(subject)[0]?.id || getRevisionReaderDocuments(subject)[0]?.id || null;
    elements.documentUpload.value = "";
    clearUploadOptions();
    render();
    processedUploads
      .flatMap(({ records }) => records)
      .filter((record) => isWholeStudyDocument(record))
      .forEach((record) => {
        void ensureDocumentStudyPlan(record, subject);
      });
    elements.uploadStatus.textContent = `${files.length} document${files.length === 1 ? "" : "s"} uploaded and saved.`;
    closeUploadModal();
  } catch (error) {
    elements.uploadStatus.textContent = uploadSavedLocally
      ? (error instanceof Error ? error.message : "Upload saved on this device, but the shared account copy could not be updated.")
      : (error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed.");
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
        delete storedSubjectsMap[currentKey];
        saveStoredSubjectsMapForAccount(storedSubjectsMap, nextKey, state.subjects);
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
  syncSelectedSubjectForWorkspaceTab();
  renderOverview();
  renderHomeHero();
  renderRevisionPanel();
  renderSubjectList();
  renderSubjectsHero();
  renderSubjectHeader();
  renderSubjectTabs();
  renderSubjectLanding();
  renderFocusMode();
  renderPendingUpload();
  renderDocuments();
  renderAskContext();
  renderSavedRevisionTests();
  renderAssessments();
  renderGrammar();
  renderWriting();
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
        }, false, {
          timeoutMs: authRequestTimeoutMs,
          timeoutMessage: "Sign-in took too long. Please try again."
        });
        elements.signInStatus.textContent = "Loading your study space...";
        state.authToken = payload.token || "";
        const mergedSubjects = await getMergedStoredSubjectsForAccount(payload.account, payload.subjects);
        applyAuthenticatedAccount(payload.account, {
          token: payload.token || "",
          subjects: mergedSubjects,
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
            const legacySubjects = await getMergedStoredSubjectsForAccount(
              existingLegacyAccount,
              getStoredSubjectsForAccount(existingLegacyAccount)
            );
            const payload = await registerCloudAccountWithFallback({
              name: existingLegacyAccount.name,
              email: existingLegacyAccount.email,
              password,
              grade: normaliseGrade(existingLegacyAccount.grade),
              subjects: legacySubjects || getStoredSubjectsForAccount(existingLegacyAccount),
              settings: buildCloudAccountSettingsPayload()
            });
            elements.signInStatus.textContent = "Loading your study space...";
            state.authToken = payload.token || "";
            applyAuthenticatedAccount(payload.account, {
              token: payload.token || "",
              subjects: legacySubjects || getStoredSubjectsForAccount(existingLegacyAccount),
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
      ? await getMergedStoredSubjectsForAccount(existingLegacyAccount, getStoredSubjectsForAccount(existingLegacyAccount))
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
      subjects: desiredSubjects || createInitialSubjectsForAccount({
        email: studentEmail,
        grade: studentGrade,
        name: studentName
      }),
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

elements.askRewindButton?.addEventListener("click", handleAskRewind);
elements.askMicButton?.addEventListener("click", handleAskMicToggle);
elements.askListenButton?.addEventListener("click", handleAskListen);
elements.askPauseButton?.addEventListener("click", handleAskPauseToggle);
elements.askForwardButton?.addEventListener("click", handleAskFastForward);
elements.askStopButton?.addEventListener("click", handleAskStop);
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
elements.focusAskButton?.addEventListener("click", handleFocusAskLaunch);
elements.focusAskAvatarButton?.addEventListener("click", handleFocusAskLaunch);
elements.navHomeButton.addEventListener("click", () => {
  state.currentView = "home";
  state.focusAskOpen = false;
  render();
});
elements.navSubjectsButton.addEventListener("click", () => {
  state.currentView = "subjects";
  resetSubjectWorkspaceView();
  state.focusAskOpen = false;
  state.focusArea = null;
  render();
});
elements.navCalendarButton?.addEventListener("click", () => {
  openAssessmentCalendar("all");
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
  resetSubjectWorkspaceView();
  state.focusAskOpen = false;
  state.focusArea = null;
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
  state.currentView = "subjects";
  resetSubjectWorkspaceView();
  state.focusAskOpen = false;
  state.focusArea = null;
  render();
});
elements.homeAskQuizButton?.addEventListener("click", () => {
  openSubjectsWorkspace("reader");
  elements.askInput.value = "Quiz me on the notes I read recently and focus on the most important ideas.";
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
    state.focusArea = null;
    render();
  });
});
elements.focusBackButton?.addEventListener("click", () => {
  state.focusAskOpen = false;
  state.focusArea = null;
  if (state.subjectWorkspaceReturnLandingSubjectId) {
    state.selectedSubjectId = state.subjectWorkspaceReturnLandingSubjectId;
  }
  resetSubjectWorkspaceView();
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
    state.focusArea = null;
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
  const visibleDocuments = getSelectableDocumentsForTable(subject || { documents: [] });
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
initStandaloneAskBridge();
render();
