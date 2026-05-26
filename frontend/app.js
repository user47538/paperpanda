import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
window.__pdfjsLib = pdfjsLib;
window.__pdfjsLibPromise = Promise.resolve(pdfjsLib);
window.__pdfjsLibError = "";
window.dispatchEvent(new Event("studylift:pdf-ready"));

const accountsStorageKey = "studylift-accounts";
const sessionStorageKey = "studylift-session";
const subjectsStorageKey = "paperpanda-subjects-by-account";
const settingsStorageKey = "studylift-settings";
const uiVersionStorageKey = "paperpanda-ui-version";
const currentUiVersion = "2026-05-26-homework-whole-file";
const previewDatabaseName = "paperpanda-assets";
const previewStoreName = "document-previews";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
let pdfjsLibPromise = null;
let currentAudioPlayback = null;
let currentAudioObjectUrl = "";
let previewDatabasePromise = null;
const defaultGrade = "7";

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
        title: "Spelling",
        tag: "Word study",
        description: "Review spelling patterns and use each word in a sentence."
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
  askHistory: []
}));

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
  science: ["Science"],
  history: ["History"],
  music: ["Music"],
  pdhpe: ["PDHPE", "PDHPE/PE", "PE", "Personal Development Health and Physical Education"],
  wellbeing: ["Wellbeing", "Well Being"],
  "design-tech": ["Design & Technology", "Design and Technology", "Design Technology", "D&T", "Design Tech"],
  art: ["Art", "Visual Arts"]
};

const state = {
  studentName: "",
  currentUserEmail: "",
  studentGrade: defaultGrade,
  authMode: "create",
  selectedSubjectId: subjectSeed[0].id,
  selectedDocumentId: null,
  askDocumentId: null,
  listeningDocumentId: null,
  selectedDocumentIds: [],
  expandedDocumentGroups: {},
  attachmentModalOpen: false,
  activeAttachmentAssessment: null,
  expandedAttachmentGroups: {},
  editAssessmentModalOpen: false,
  activeEditAssessment: null,
  watchExpanded: false,
  documentsExpanded: false,
  currentView: "home",
  activeTask: null,
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
    headingColor: "#111111"
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
  welcomeHeading: document.getElementById("welcome-heading"),
  navHomeButton: document.getElementById("nav-home-button"),
  navSubjectsButton: document.getElementById("nav-subjects-button"),
  navSettingsButton: document.getElementById("nav-settings-button"),
  homeView: document.getElementById("home-view"),
  settingsView: document.getElementById("settings-view"),
  subjectsView: document.getElementById("subjects-view"),
  taskView: document.getElementById("task-view"),
  revisionView: document.getElementById("revision-view"),
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
  askContext: document.getElementById("ask-context"),
  askResponse: document.getElementById("ask-response"),
  savedTestsList: document.getElementById("saved-tests-list"),
  readerCard: document.getElementById("reader-card"),
  readerTitle: document.getElementById("reader-title"),
  readerContent: document.getElementById("reader-content"),
  readerPreviousButton: document.getElementById("reader-previous-button"),
  readerListenButton: document.getElementById("reader-listen-button"),
  readerAskButton: document.getElementById("reader-ask-button"),
  readerNextButton: document.getElementById("reader-next-button"),
  assessmentList: document.getElementById("assessment-list"),
  practiceList: document.getElementById("practice-list"),
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
    askHistory: [],
    savedRevisionTests: []
  }));
}

function createInitialSubjectsForAccount(account) {
  return createBaseSubjects().map((subject) => ({
    ...subject,
    documents: [],
    assessments: [],
    watch: [],
    askHistory: [],
    savedRevisionTests: []
  }));
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

function getSelectedSubject() {
  return state.subjects.find((subject) => subject.id === state.selectedSubjectId);
}

function getSelectedDocument() {
  const subject = getSelectedSubject();
  return subject?.documents.find((doc) => doc.id === state.selectedDocumentId) || null;
}

function getAskDocument() {
  const subject = getSelectedSubject();
  return subject?.documents.find((doc) => doc.id === state.askDocumentId) || null;
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
          grade: normaliseGrade(account?.grade)
        }))
      : [];
  } catch (error) {
    console.error("Accounts could not be restored.", error);
    return [];
  }
}

function saveAccounts(accounts) {
  window.localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
}

function persistSession(email) {
  window.localStorage.setItem(sessionStorageKey, email);
}

function clearSession() {
  window.localStorage.removeItem(sessionStorageKey);
}

function findAccountByEmail(email) {
  return loadAccounts().find((account) => account.email.toLowerCase() === email.toLowerCase()) || null;
}

function syncSignInMode() {
  const isCreateMode = state.authMode === "create";
  elements.signInEyebrow.textContent = isCreateMode ? "Student account" : "Student sign in";
  elements.signInTitle.textContent = isCreateMode ? "Create your account" : "Sign in to PaperPanda";
  elements.studentNameWrap.classList.toggle("hidden", !isCreateMode);
  elements.studentGradeWrap.classList.toggle("hidden", !isCreateMode);
  elements.studentPasswordConfirmWrap.classList.toggle("hidden", !isCreateMode);
  elements.openDashboardButton.textContent = isCreateMode ? "Create account" : "Sign in";
  elements.signInModeCreateButton.classList.toggle("signin-mode-button--active", isCreateMode);
  elements.signInModeLoginButton.classList.toggle("signin-mode-button--active", !isCreateMode);
  elements.signInNote.textContent = isCreateMode
    ? "Create an account first, then sign in with your school email and password."
    : "Use the school email and password you created for this portal.";
}

function hydrateSettingsView() {
  const account = findAccountByEmail(state.currentUserEmail);
  if (!account) {
    return;
  }

  elements.settingsNameInput.value = account.name || "";
  elements.settingsEmailInput.value = account.email || "";
  elements.settingsGradeSelect.value = normaliseGrade(account.grade);
  elements.settingsCurrentPasswordInput.value = "";
  elements.settingsNewPasswordInput.value = "";
  elements.settingsConfirmPasswordInput.value = "";
  elements.settingsStatus.textContent = "";
}

function openPreviewDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  if (!previewDatabasePromise) {
    previewDatabasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(previewDatabaseName, 1);
      request.onerror = () => reject(request.error || new Error("Preview storage could not be opened."));
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(previewStoreName)) {
          database.createObjectStore(previewStoreName, { keyPath: "id" });
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

async function deletePreviewRecords(documentIds) {
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
    });
  });
}

function syncPreviewPersistence() {
  const previewEntries = state.subjects.flatMap((subject) =>
    (subject.documents || [])
      .filter((documentRecord) => documentRecord.previewImageUrl)
      .map((documentRecord) => ({
        id: documentRecord.id,
        previewImageUrl: documentRecord.previewImageUrl
      }))
  );

  if (!previewEntries.length) {
    return;
  }

  Promise.all(previewEntries.map((entry) => putPreviewRecord(entry.id, entry.previewImageUrl))).catch((error) => {
    console.error("Preview images could not be synced.", error);
  });
}

async function hydratePreviewImages() {
  const documentsMissingPreview = state.subjects.flatMap((subject) =>
    (subject.documents || []).filter((documentRecord) => !documentRecord.previewImageUrl)
  );

  if (!documentsMissingPreview.length) {
    return;
  }

  let hydratedAnyPreview = false;

  for (const documentRecord of documentsMissingPreview) {
    try {
      const previewRecord = await getPreviewRecord(documentRecord.id);
      if (previewRecord?.previewImageUrl) {
        documentRecord.previewImageUrl = previewRecord.previewImageUrl;
        hydratedAnyPreview = true;
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
  return {
    ...structuredClone(subjectTemplateSeed[index] || {}),
    ...subject,
    documents: Array.isArray(subject.documents) ? subject.documents.map(normaliseDocument) : [],
    assessments: Array.isArray(subject.assessments) ? subject.assessments.map(normaliseAssessment) : [],
    watch: Array.isArray(subject.watch) ? subject.watch : [],
    askHistory: Array.isArray(subject.askHistory) ? subject.askHistory : [],
    savedRevisionTests: Array.isArray(subject.savedRevisionTests)
      ? subject.savedRevisionTests.map(normaliseSavedRevisionTest)
      : [],
    practice: Array.isArray(subject.practice)
      ? subject.practice
      : structuredClone(subjectTemplateSeed[index]?.practice || [])
  };
}

function persistSubjects() {
  if (!state.currentUserEmail) {
    return;
  }

  const accountKey = normaliseAccountKey(state.currentUserEmail);
  const storedSubjectsMap = loadStoredSubjectsMap();
  const persistableSubjects = createPersistableSubjects(state.subjects);

  try {
    storedSubjectsMap[accountKey] = persistableSubjects;
    saveStoredSubjectsMap(storedSubjectsMap);
  } catch (error) {
    storedSubjectsMap[accountKey] = createQuotaFallbackSubjects(state.subjects);
    saveStoredSubjectsMap(storedSubjectsMap);
    if (elements?.uploadStatus) {
      elements.uploadStatus.textContent =
        "Large document previews will stay available in this session, but only a lighter saved version will persist after refresh.";
    }
  }

  syncPreviewPersistence();
}

function persistSettings() {
  window.localStorage.setItem(
    settingsStorageKey,
    JSON.stringify({
      termStarts: state.termStarts,
      termEnds: state.termEnds,
      homeBackground: state.settings.homeBackground,
      subjectsBackground: state.settings.subjectsBackground,
      headingColor: state.settings.headingColor
    })
  );
}

function normaliseAssessment(assessment) {
  return {
    ...assessment,
    linkedDocumentIds: Array.isArray(assessment.linkedDocumentIds) ? assessment.linkedDocumentIds : [],
    completed: Boolean(assessment.completed),
    workNotes: assessment.workNotes || ""
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
    reviewed: Boolean(documentRecord.reviewed),
    reviewMode: documentRecord.reviewMode || "",
    flags: {
      classNotes: Boolean(documentRecord.flags?.classNotes || documentRecord.flags?.termOverview),
      assessment: Boolean(documentRecord.flags?.assessment),
      homework: Boolean(documentRecord.flags?.homework)
    }
  };
}

function restoreSubjects() {
  state.subjects = createBaseSubjects();
}

function restoreSubjectsForAccount(account) {
  const accountKey = normaliseAccountKey(account?.email);
  if (!accountKey) {
    state.subjects = createBaseSubjects();
    return;
  }

  const storedSubjectsMap = loadStoredSubjectsMap();
  const storedSubjects = storedSubjectsMap[accountKey];
  if (Array.isArray(storedSubjects)) {
    state.subjects = removeLegacySeededDocuments(
      removeLegacySeededAssessments(storedSubjects.map(hydrateStoredSubject))
    );
    storedSubjectsMap[accountKey] = createPersistableSubjects(state.subjects);
    saveStoredSubjectsMap(storedSubjectsMap);
  } else {
    state.subjects = createInitialSubjectsForAccount(account);
    storedSubjectsMap[accountKey] = createPersistableSubjects(state.subjects);
    saveStoredSubjectsMap(storedSubjectsMap);
  }

  if (!state.subjects.some((subject) => subject.id === state.selectedSubjectId)) {
    state.selectedSubjectId = state.subjects[0]?.id || "";
  }
  const selectedSubject = state.subjects.find((subject) => subject.id === state.selectedSubjectId);
  const firstDocumentId = getSortedDocuments(selectedSubject || { documents: [] })[0]?.id || null;
  state.selectedDocumentId = firstDocumentId;
  state.askDocumentId = firstDocumentId;
  state.selectedDocumentIds = [];
  state.expandedDocumentGroups = {};
  state.watchExpanded = false;
  state.documentsExpanded = false;

  syncAutoWatchForAllSubjects();
  persistSubjects();
  hydratePreviewImages();
}

function restoreSessionUser() {
  const savedEmail = window.localStorage.getItem(sessionStorageKey);
  if (!savedEmail) {
    return;
  }

  const account = findAccountByEmail(savedEmail);
  if (!account) {
    clearSession();
    return;
  }

  state.currentUserEmail = account.email;
  state.studentName = account.name;
  state.studentGrade = normaliseGrade(account.grade);
  restoreSubjectsForAccount(account);
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
      homeBackground: parsed.homeBackground || "",
      subjectsBackground: parsed.subjectsBackground || "",
      headingColor: parsed.headingColor || "#111111"
    };
  } catch (error) {
    console.error("Failed to restore settings.", error);
  }

  if (window.localStorage.getItem(uiVersionStorageKey) !== currentUiVersion) {
    window.localStorage.setItem(uiVersionStorageKey, currentUiVersion);
  }
}

function applyBackgrounds() {
  elements.homeView.style.backgroundImage = state.settings.homeBackground
    ? `url("${state.settings.homeBackground}")`
    : "";
  elements.subjectsView.style.backgroundImage = state.settings.subjectsBackground
    ? `url("${state.settings.subjectsBackground}")`
    : "";
  elements.homeView.style.backgroundColor = "#ffffff";
  elements.subjectsView.style.backgroundColor = "#ffffff";
  document.documentElement.style.setProperty("--custom-heading-color", state.settings.headingColor || "#111111");
  if (elements.headingColourInput) {
    elements.headingColourInput.value = state.settings.headingColor || "#111111";
  }
}

function renderAiConnectionState() {
  if (elements.aiConnectionStatus) {
    elements.aiConnectionStatus.textContent =
      `AI answers and natural voice are provided by the backend service at ${API_BASE_URL}.`;
  }
}

function openDashboard(nextView = "home") {
  elements.landingPanel.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  elements.welcomeHeading.textContent = `Welcome back, ${state.studentName}`;
  hydrateSettingsView();
  state.currentView = nextView;
  render();
  void loadRevisionCatalogue();
}

function showLanding() {
  stopListening();
  closeUpcomingModal();
  closeUploadModal();
  closeAttachNotesModal();
  closeEditAssessmentModal();

  elements.appShell.classList.add("hidden");
  elements.taskView.classList.add("hidden");
  elements.revisionView.classList.add("hidden");
  elements.landingPanel.classList.remove("hidden");
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
  return getDocumentBundlesByFilter(subject, () => true);
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

function renderOverview() {
  const unreadDocumentMetrics = getUnreadDocumentMetrics();
  const homeworkMetrics = getHomeworkMetrics();
  const assessmentMetrics = getAssessmentProgressMetrics();
  const upcomingEntries = getUpcomingAssessmentEntries();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextEntry =
    getAssessmentEntries().find((entry) => entry.dueDateObject && entry.dueDateObject >= today) ||
    getAssessmentEntries().find((entry) => entry.dueDateObject);

  elements.documentsToReadCount.textContent = String(unreadDocumentMetrics.unread);
  elements.documentsToReadSummary.textContent = unreadDocumentMetrics.total
    ? `${unreadDocumentMetrics.total - unreadDocumentMetrics.unread} of ${unreadDocumentMetrics.total} whole documents have been marked read or listened to.`
    : "No documents have been uploaded yet.";
  setProgressBar(elements.documentsToReadProgress, unreadDocumentMetrics.progress);

  elements.homeworkToCompleteCount.textContent = String(homeworkMetrics.remaining);
  elements.homeworkToCompleteSummary.textContent = homeworkMetrics.total
    ? `${homeworkMetrics.total - homeworkMetrics.remaining} of ${homeworkMetrics.total} homework items have enough writing started.`
    : "No homework items are waiting right now.";
  setProgressBar(elements.homeworkToCompleteProgress, homeworkMetrics.progress);

  elements.assessmentsUpcomingCount.textContent = String(assessmentMetrics.upcoming);
  elements.assessmentsUpcomingSummary.textContent = assessmentMetrics.active
    ? `${assessmentMetrics.active} active assessments are being tracked across the account.`
    : "No active assessments are being tracked right now.";
  setProgressBar(elements.assessmentsUpcomingProgress, assessmentMetrics.progress);

  elements.upcomingAssessmentCount.textContent = `${upcomingEntries.length} due in the next fortnight`;
  elements.upcomingAssessmentSummary.textContent = upcomingEntries.length
    ? `Select to open a summary of the ${upcomingEntries.length} assessment${upcomingEntries.length === 1 ? "" : "s"} due in the next 14 days.`
    : "Select to check the next 14 days. Nothing is due in that window right now.";
  elements.upcomingNextDue.textContent = nextEntry
    ? `Next due: ${nextEntry.subject.name} · ${formatAssessmentDueLabel(nextEntry.assessment.dueDate)}`
    : "No due dates available yet";

  renderUpcomingModal();
}

function renderCurrentView() {
  elements.appShell.classList.toggle("hidden", state.currentView === "task" || state.currentView === "revision");
  elements.homeView.classList.toggle("hidden", state.currentView !== "home");
  elements.settingsView.classList.toggle("hidden", state.currentView !== "settings");
  elements.subjectsView.classList.toggle("hidden", state.currentView !== "subjects");
  elements.taskView.classList.toggle("hidden", state.currentView !== "task");
  elements.revisionView.classList.toggle("hidden", state.currentView !== "revision");
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

async function requestApiGet(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
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
    throw new Error(message);
  }

  return response.json();
}

async function requestApi(endpoint, payload, expectBlob = false) {
  let response;
  try {
    response = await window.fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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
    throw new Error(message);
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
    throw new Error(parsedPayload?.error || responseText || "Request failed.");
  }

  return parsedPayload || {};
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

function currentDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getTodayAskHistory(subject) {
  return (subject.askHistory || []).filter((entry) => entry.dateKey === currentDateKey());
}

function renderSubjectList() {
  elements.uploadSubjectSelect.innerHTML = state.subjects
    .map((subject) => `<option value="${subject.id}">${escapeHtml(subject.name)}</option>`)
    .join("");
  elements.uploadSubjectSelect.value = state.selectedSubjectId;
  renderUploadAssessmentTaskOptions();

  elements.subjectList.innerHTML = state.subjects
    .map(
      (subject) => `
        <button
          type="button"
          class="subject-tile${subject.id === state.selectedSubjectId ? " subject-tile--active" : ""}"
          data-subject-id="${subject.id}"
        >
          <span class="subject-tile__title">${escapeHtml(subject.name)}</span>
        </button>
      `
    )
    .join("");

  elements.subjectList.querySelectorAll("[data-subject-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const subject = state.subjects.find((item) => item.id === button.dataset.subjectId);
      if (!subject) {
        return;
      }

      state.selectedSubjectId = subject.id;
      state.selectedDocumentIds = [];
      state.expandedDocumentGroups = {};
      state.watchExpanded = false;
      state.documentsExpanded = false;
      state.selectedDocumentId = getSortedDocuments(subject)[0]?.id || null;
      state.askDocumentId = getSortedDocuments(subject)[0]?.id || null;
      elements.askInput.value = "";
      render();
    });
  });
}

function renderSubjectHeader() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  elements.subjectHeader.innerHTML = `
    <div class="subject-header__title">
      <p class="eyebrow">Current subject</p>
      <h3>${escapeHtml(subject.name)}</h3>
    </div>
    <div class="subject-header__actions">
      <div class="subject-header__nav">
        <button type="button" class="subject-nav-button" data-subject-section="documents-section">Documents</button>
        <button type="button" class="subject-nav-button" data-subject-section="reader-section">Read</button>
        <button type="button" class="subject-nav-button" data-subject-section="homework-section">Homework</button>
        <button type="button" class="subject-nav-button" data-subject-section="assessments-section">Assessments</button>
        <button type="button" class="subject-nav-button" data-subject-section="watch-section">Watch</button>
      </div>
      <button type="button" class="ghost-button" id="subject-upload-button">Upload</button>
    </div>
  `;
  document.getElementById("subject-upload-button")?.addEventListener("click", openUploadModal);
  elements.subjectHeader.querySelectorAll("[data-subject-section]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.subjectSection;
      const target = targetId ? document.getElementById(targetId) : null;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderPendingUpload() {
  if (!state.pendingFiles.length) {
    elements.pendingUpload.innerHTML = "";
    return;
  }

  elements.pendingUpload.innerHTML = `
    <p class="pending-upload__label">Selected:</p>
    <ul class="pending-upload__list">
      ${state.pendingFiles.map((file) => `<li>${escapeHtml(file.name)}</li>`).join("")}
    </ul>
  `;
}

function getRevisionSubjectEntry() {
  return state.revisionCatalogue.find((entry) => entry.subjectId === state.revisionSelectedSubjectId) || null;
}

function getDocumentsForRevisionEntry(entry) {
  if (!entry) {
    return [];
  }

  const matchingSubject =
    state.subjects.find((subject) => subject.id === entry.subjectId) ||
    state.subjects.find((subject) => subject.name.toLowerCase() === String(entry.subjectName || "").toLowerCase());

  return matchingSubject ? getAllDocumentBundles(matchingSubject) : [];
}

function getRevisionQuestionId(question, fallbackIndex = 0) {
  return String(question?.id || `q${question?.number || fallbackIndex + 1}`);
}

function getRevisionSections() {
  return Array.isArray(state.generatedRevisionTest?.sections) ? state.generatedRevisionTest.sections : [];
}

function getFlattenedRevisionQuestions() {
  return getRevisionSections().flatMap((section, sectionIndex) =>
    (Array.isArray(section?.questions) ? section.questions : []).map((question, questionIndex) => ({
      ...question,
      sectionTitle: section?.title || "",
      sectionType: section?.sectionType || "",
      id: getRevisionQuestionId(question, sectionIndex * 20 + questionIndex)
    }))
  );
}

function openRevisionTestView() {
  state.currentView = "revision";
  renderCurrentView();
  renderRevisionTestView();
  window.requestAnimationFrame(() => {
    elements.revisionView.scrollIntoView({ block: "start", inline: "nearest" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

function buildRevisionQuestionInput(question) {
  const questionId = getRevisionQuestionId(question);
  const savedResponse = state.revisionResponses[questionId] || "";
  const questionType = String(question.type || "").toLowerCase();
  const isLocked = Boolean(state.revisionSubmission) || state.revisionViewMode === "saved";
  if (questionType === "multiple-choice") {
    return `
      <div class="revision-test-question-options revision-test-question-options--interactive">
        ${(Array.isArray(question.options) ? question.options : [])
          .map(
            (option, optionIndex) => `
              <label class="revision-option">
                <input
                  type="radio"
                  name="${escapeHtml(questionId)}"
                  value="${escapeHtml(option)}"
                  data-revision-question-id="${escapeHtml(questionId)}"
                  ${savedResponse === option ? "checked" : ""}
                  ${isLocked ? "disabled" : ""}
                />
                <span>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <textarea
      class="reader-editor revision-response-editor ${questionType === "extended-response" ? "revision-response-editor--extended" : ""}"
      data-revision-question-id="${escapeHtml(questionId)}"
      placeholder="${questionType === "extended-response" ? "Write your full response here..." : "Write a short response here..."}"
      ${isLocked ? "disabled" : ""}
    >${escapeHtml(savedResponse)}</textarea>
  `;
}

function renderRevisionSubmissionFeedback() {
  const submission = state.revisionSubmission;
  if (!submission) {
    elements.revisionFeedback.classList.add("hidden");
    elements.revisionFeedback.innerHTML = "";
    return;
  }

  const feedbackById = new Map(
    (Array.isArray(submission.questionFeedback) ? submission.questionFeedback : []).map((item) => [String(item.id || ""), item])
  );

  elements.revisionFeedback.classList.remove("hidden");
  elements.revisionFeedback.innerHTML = `
    <div class="revision-feedback__summary">
      <p class="eyebrow">Feedback</p>
      <h3>${escapeHtml(`Score ${submission.totalScore || 0} / ${submission.totalAvailable || 0}`)}</h3>
      <p>${escapeHtml(submission.overallFeedback || "Your test has been marked.")}</p>
    </div>
    <div class="revision-feedback__list">
      ${getFlattenedRevisionQuestions()
        .map((question) => {
          const questionId = getRevisionQuestionId(question);
          const feedback = feedbackById.get(questionId);
          if (!feedback) {
            return "";
          }
          return `
            <article class="revision-feedback__item">
              <div class="revision-feedback__item-header">
                <strong>Q${escapeHtml(question.number || "")}</strong>
                <span class="revision-test-question-type">${escapeHtml(`${feedback.score || 0} / ${feedback.marks || 0}`)}</span>
              </div>
              <p>${escapeHtml(feedback.feedback || "")}</p>
              ${
                String(feedback.type || "").toLowerCase() === "multiple-choice"
                  ? `<p class="revision-summary"><strong>You selected:</strong> ${escapeHtml(feedback.studentAnswer || "No option selected")}</p>
                     <p class="revision-summary"><strong>Correct answer:</strong> ${escapeHtml(feedback.correctOption || "No answer recorded")}</p>`
                  : ""
              }
              ${feedback.answerGuide ? `<p class="revision-summary"><strong>What a strong answer should include:</strong> ${escapeHtml(feedback.answerGuide)}</p>` : ""}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function syncRevisionSelection() {
  if (!state.revisionCatalogue.length) {
    state.revisionSelectedSubjectId = "";
    state.revisionSelectedTopic = "";
    state.revisionSelectedNoteIds = [];
    return;
  }

  if (!state.revisionCatalogue.some((entry) => entry.subjectId === state.revisionSelectedSubjectId)) {
    state.revisionSelectedSubjectId = state.revisionCatalogue[0].subjectId;
  }

  const selectedEntry = getRevisionSubjectEntry();
  const topics = Array.isArray(selectedEntry?.topics) ? selectedEntry.topics : [];
  if (!topics.includes(state.revisionSelectedTopic)) {
    state.revisionSelectedTopic = topics[0] || "";
  }
  if (!selectedEntry?.allowsTextInput) {
    state.revisionTextTitle = "";
  }

  const availableNoteIds = new Set(getDocumentsForRevisionEntry(selectedEntry).map((documentRecord) => documentRecord.id));
  state.revisionSelectedNoteIds = state.revisionSelectedNoteIds.filter((documentId) => availableNoteIds.has(documentId));
}

async function loadRevisionCatalogue(force = false) {
  const grade = normaliseGrade(state.studentGrade);
  if (!grade) {
    return;
  }

  if (!force && state.revisionCatalogueLoadedGrade === grade && state.revisionCatalogue.length) {
    renderRevisionPanel();
    return;
  }

  elements.revisionStatus.textContent = "Loading revision resources...";

  try {
    const payload = await requestApiGet(`/api/revision/catalogue?grade=${encodeURIComponent(grade)}`);
    state.revisionCatalogue = Array.isArray(payload?.entries) ? payload.entries : [];
    state.revisionCatalogueLoadedGrade = grade;
    state.generatedRevisionTest = null;
    state.revisionResponses = {};
    state.revisionSubmission = null;
    state.revisionViewMode = "draft";
    state.activeSavedRevisionTestId = "";
    syncRevisionSelection();
    renderRevisionPanel();
    elements.revisionStatus.textContent = state.revisionCatalogue.length
      ? ""
      : "No revision subjects are available for this grade yet.";
  } catch (error) {
    state.revisionCatalogue = [];
    state.revisionCatalogueLoadedGrade = "";
    renderRevisionPanel();
    elements.revisionStatus.textContent =
      error instanceof Error ? `Revision resources failed to load: ${error.message}` : "Revision resources failed to load.";
  }
}

function renderRevisionTestView() {
  const test = state.generatedRevisionTest;
  if (!test) {
    elements.revisionViewTitle.textContent = "Revision test";
    elements.revisionTestHeading.textContent = "Generated test";
    elements.revisionTestMeta.innerHTML = `<p class="revision-summary">Create a test from the home page to work on it here.</p>`;
    elements.revisionTestContent.innerHTML = "Create a test from the home page to work on it here.";
    elements.submitRevisionTestButton.disabled = true;
    elements.saveRevisionTestButton.disabled = true;
    elements.revisionTestStatus.textContent = "";
    renderRevisionSubmissionFeedback();
    return;
  }

  elements.revisionViewTitle.textContent = test.title || `${test.subjectName || "Revision"} test`;
  elements.revisionTestHeading.textContent = test.title || `${test.subjectName || "Revision"} test`;
  elements.revisionTestMeta.innerHTML = `
    <p class="revision-summary">${escapeHtml(test.instructions || "")}</p>
    <p class="revision-test-meta">${escapeHtml(`${test.grade || ""} ${test.subjectName || ""} · ${test.estimatedMinutes || 0} mins`)}</p>
  `;
  elements.revisionTestContent.innerHTML = `
    <div class="revision-test-section-list">
      ${getRevisionSections()
        .map(
          (section, sectionIndex) => `
            <section class="revision-test-section">
              <p class="eyebrow">${escapeHtml(section.sectionType || "section")}</p>
              <h4>${escapeHtml(section.title || `Section ${sectionIndex + 1}`)}</h4>
              ${section.stimulusTitle ? `<p><strong>${escapeHtml(section.stimulusTitle)}</strong></p>` : ""}
              ${section.stimulusText ? `<p class="revision-summary">${escapeHtml(section.stimulusText)}</p>` : ""}
              <div class="revision-test-question-list">
                ${(Array.isArray(section.questions) ? section.questions : [])
                  .map(
                    (question, questionIndex) => `
                      <article class="revision-test-question">
                        <div class="revision-test-question__header">
                          <p><strong>Q${escapeHtml(question.number || questionIndex + 1)}.</strong> ${escapeHtml(question.prompt || "")}</p>
                          <span class="revision-test-question-type">${escapeHtml(
                            `${question.type || "question"} · ${question.marks || 0} marks · ${question.skill || ""}`
                          )}</span>
                        </div>
                        ${buildRevisionQuestionInput(question)}
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;
  elements.submitRevisionTestButton.disabled = Boolean(state.revisionSubmission) || state.revisionViewMode === "saved";
  elements.saveRevisionTestButton.disabled = !state.revisionSubmission || state.revisionViewMode === "saved";
  elements.revisionTestStatus.textContent = state.revisionSubmission
    ? state.revisionViewMode === "saved"
      ? "Saved test loaded."
      : "Submitted. Review your feedback below."
    : "";
  elements.revisionTestContent.querySelectorAll("[data-revision-question-id]").forEach((field) => {
    const questionId = field.dataset.revisionQuestionId;
    const eventName = field.matches("input[type='radio']") ? "change" : "input";
    field.addEventListener(eventName, () => {
      if (!questionId) {
        return;
      }
    state.revisionResponses[questionId] = field.value;
    });
  });
  renderRevisionSubmissionFeedback();
}

function renderRevisionPanel() {
  syncRevisionSelection();

  elements.revisionGradeCopy.textContent = `PaperPanda is using ${formatGradeLabel(
    state.studentGrade
  )} curriculum guidance to build this revision test.`;

  elements.revisionSubjectSelect.innerHTML = state.revisionCatalogue.length
    ? state.revisionCatalogue
        .map(
          (entry) =>
            `<option value="${entry.subjectId}"${entry.subjectId === state.revisionSelectedSubjectId ? " selected" : ""}>${escapeHtml(entry.subjectName)}</option>`
        )
        .join("")
    : `<option value="">No subjects available</option>`;

  const selectedEntry = getRevisionSubjectEntry();
  const topics = Array.isArray(selectedEntry?.topics) ? selectedEntry.topics : [];
  elements.revisionTopicWrap.classList.toggle("hidden", !topics.length);
  elements.revisionTopicSelect.innerHTML = topics.length
    ? topics
        .map(
          (topic) =>
            `<option value="${escapeHtml(topic)}"${topic === state.revisionSelectedTopic ? " selected" : ""}>${escapeHtml(topic)}</option>`
        )
        .join("")
    : `<option value="">No set topics</option>`;

  elements.revisionTextWrap.classList.toggle("hidden", !selectedEntry?.allowsTextInput);
  elements.revisionTextInput.value = state.revisionTextTitle;

  const revisionDocuments = getDocumentsForRevisionEntry(selectedEntry);
  elements.revisionNotesSelect.innerHTML = revisionDocuments.length
    ? revisionDocuments
        .map(
          (documentRecord) =>
            `<option value="${documentRecord.id}"${state.revisionSelectedNoteIds.includes(documentRecord.id) ? " selected" : ""}>${escapeHtml(documentRecord.title)}</option>`
        )
        .join("")
    : `<option value="">No notes uploaded for this subject yet</option>`;
  elements.revisionNotesSelect.disabled = !revisionDocuments.length;

  if (!selectedEntry) {
    elements.revisionSummary.textContent = "Select a subject to load the curriculum overview and tested skills.";
    elements.revisionSkills.innerHTML = "";
    return;
  }

  elements.revisionSummary.innerHTML = `
    <p><strong>${escapeHtml(selectedEntry.subjectName)}</strong></p>
    <p>${escapeHtml(selectedEntry.curriculumOverview || "")}</p>
  `;
  elements.revisionSkills.innerHTML = (selectedEntry.skillsTested || [])
    .map((skill) => `<span class="revision-skill-chip">${escapeHtml(skill)}</span>`)
    .join("");
}

async function handleCreateRevisionTest() {
  const selectedEntry = getRevisionSubjectEntry();
  if (!selectedEntry) {
    elements.revisionStatus.textContent = "Select a subject first.";
    return;
  }

  state.revisionSelectedNoteIds = [...elements.revisionNotesSelect.selectedOptions].map((option) => option.value).filter(Boolean);
  state.revisionTextTitle = elements.revisionTextInput.value.trim();
  const selectedNotes = getDocumentsForRevisionEntry(selectedEntry)
    .filter((documentRecord) => state.revisionSelectedNoteIds.includes(documentRecord.id))
    .map((documentRecord) => ({
      title: documentRecord.title,
      content: `${documentRecord.content || ""}\n\n${documentRecord.workNotes || ""}`.trim()
    }));

  elements.createRevisionTestButton.disabled = true;
  elements.revisionStatus.textContent = "Building revision test...";

  try {
    const payload = await requestApi("/api/revision/generate-test", {
      grade: normaliseGrade(state.studentGrade),
      subjectId: selectedEntry.subjectId,
      topic: state.revisionSelectedTopic,
      textTitle: state.revisionTextTitle,
      notes: selectedNotes
    });
    state.generatedRevisionTest = payload?.test || null;
    state.revisionResponses = {};
    state.revisionSubmission = null;
    state.revisionViewMode = "draft";
    state.activeSavedRevisionTestId = "";
    elements.revisionStatus.textContent = "Revision test created.";
    renderRevisionTestView();
    openRevisionTestView();
  } catch (error) {
    elements.revisionStatus.textContent =
      error instanceof Error ? `Revision test failed: ${error.message}` : "Revision test failed.";
  } finally {
    elements.createRevisionTestButton.disabled = false;
  }
}

async function handleSubmitRevisionTest() {
  if (!state.generatedRevisionTest) {
    elements.revisionTestStatus.textContent = "Create a test first.";
    return;
  }

  const missingResponses = getFlattenedRevisionQuestions().filter((question) => !String(state.revisionResponses[question.id] || "").trim());
  if (missingResponses.length) {
    elements.revisionTestStatus.textContent = `Finish all questions before submitting. ${missingResponses.length} response${missingResponses.length === 1 ? "" : "s"} still need an answer.`;
    return;
  }

  elements.submitRevisionTestButton.disabled = true;
  elements.revisionTestStatus.textContent = "Submitting test for feedback...";
  try {
    const payload = await requestApi("/api/revision/submit-test", {
      test: state.generatedRevisionTest,
      responses: state.revisionResponses
    });
    state.revisionSubmission = payload;
    elements.revisionTestStatus.textContent = "Submitted. Review your feedback below.";
    renderRevisionSubmissionFeedback();
  } catch (error) {
    elements.revisionTestStatus.textContent =
      error instanceof Error ? `Revision test submission failed: ${error.message}` : "Revision test submission failed.";
  } finally {
    elements.submitRevisionTestButton.disabled = false;
  }
}

function renderUploadAssessmentTaskOptions() {
  const subject = getUploadSubject();
  const assessments = Array.isArray(subject?.assessments) ? subject.assessments : [];
  const options = [
    `<option value="">Create new assessment from uploaded document</option>`,
    ...assessments.map(
      (assessment) =>
        `<option value="${assessment.id}">${escapeHtml(
          `${assessment.taskNumber || "Task"} - ${assessment.componentTask || assessment.title}`
        )}</option>`
    )
  ];

  elements.uploadAssessmentTaskSelect.innerHTML = options.join("");
}

function getDocumentSortValue(documentRecord) {
  if (documentRecord.addedAt) {
    const timestamp = new Date(documentRecord.addedAt).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  const fallbackTimestamp = Date.parse(`${documentRecord.added || ""} ${new Date().getFullYear()}`);
  return Number.isNaN(fallbackTimestamp) ? 0 : fallbackTimestamp;
}

function getDocumentPageNumber(documentRecord) {
  if (Number.isFinite(documentRecord.pageNumber)) {
    return documentRecord.pageNumber;
  }
  const match = documentRecord.title?.match(/page\s+(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function getDocumentGroupId(documentRecord) {
  return documentRecord.uploadGroupId || documentRecord.id;
}

function getBaseDocumentTitle(documentRecord) {
  return String(documentRecord?.title || "").replace(/\s*-\s*Page\s+\d+$/i, "").trim();
}

function getSortedGroupDocuments(documents) {
  return [...documents].sort((left, right) => {
    const leftPage = getDocumentPageNumber(left);
    const rightPage = getDocumentPageNumber(right);
    if (leftPage !== null && rightPage !== null && leftPage !== rightPage) {
      return leftPage - rightPage;
    }
    return left.title.localeCompare(right.title, undefined, { numeric: true });
  });
}

function buildDocumentBundleFromDocuments(documents) {
  const sortedDocuments = getSortedGroupDocuments(documents);
  const firstDocument = sortedDocuments[0];
  if (!firstDocument) {
    return null;
  }

  return {
    id: getDocumentGroupId(firstDocument),
    title: getBaseDocumentTitle(firstDocument) || firstDocument.title,
    type: firstDocument.type,
    added: firstDocument.added,
    addedAt: firstDocument.addedAt,
    previewImageUrl: firstDocument.previewImageUrl || null,
    originalFile: firstDocument.originalFile || null,
    flags: { ...(firstDocument.flags || {}) },
    documents: sortedDocuments,
    content: sortedDocuments
      .map((documentRecord) => String(documentRecord.content || "").trim())
      .filter(Boolean)
      .join("\n\n"),
    workNotes: sortedDocuments.find((documentRecord) => documentRecord.workNotes)?.workNotes || "",
    reviewed: sortedDocuments.every((documentRecord) => documentRecord.reviewed)
  };
}

function getDocumentBundlesByFilter(subject, predicate) {
  return getDocumentGroupsFromDocuments(subject.documents.filter(predicate))
    .map((group) => buildDocumentBundleFromDocuments(group.documents))
    .filter(Boolean)
    .sort((left, right) => getDocumentSortValue(right) - getDocumentSortValue(left));
}

function getHomeworkBundles(subject) {
  return getDocumentBundlesByFilter(subject, (documentRecord) => documentRecord.flags?.homework);
}

function getLinkedDocumentBundles(subject, linkedDocumentIds) {
  const linkedIdSet = new Set(linkedDocumentIds || []);
  return getDocumentBundlesByFilter(subject, (documentRecord) => linkedIdSet.has(documentRecord.id));
}

function findHomeworkBundle(subject, bundleId) {
  return getHomeworkBundles(subject).find((bundle) => bundle.id === bundleId) || null;
}

function setDocumentReviewedState(subject, documentIds, reviewed) {
  const idSet = new Set(documentIds);
  subject.documents.forEach((documentRecord) => {
    if (!idSet.has(documentRecord.id)) {
      return;
    }
    documentRecord.reviewed = reviewed;
    documentRecord.reviewMode = reviewed ? "manual" : "";
  });
}

function getYoutubeReferencesFromText(text, fallbackTitle) {
  const rawText = String(text || "");
  const urlMatches = [...rawText.matchAll(/https?:\/\/(?:www\.)?(?:youtube\.com\/[^\s<>"']+|youtu\.be\/[^\s<>"']+)/gi)];
  if (!urlMatches.length) {
    return [];
  }

  return urlMatches.map((match, index) => {
    const url = match[0].replace(/[),.;]+$/, "");
    const lineStart = rawText.lastIndexOf("\n", match.index) + 1;
    const nextBreak = rawText.indexOf("\n", match.index);
    const lineEnd = nextBreak === -1 ? rawText.length : nextBreak;
    const sourceLine = rawText.slice(lineStart, lineEnd).replace(url, "").trim();
    const title = sourceLine || `${fallbackTitle} · Video ${index + 1}`;
    return { url, title };
  });
}

function syncAutoWatchForSubject(subject) {
  const manualWatchItems = Array.isArray(subject.watch)
    ? subject.watch.filter((item) => item.source !== "auto-document")
    : [];
  const manualUrls = new Set(manualWatchItems.map((item) => String(item.url || "").trim().toLowerCase()));
  const existingAutoByUrl = new Map(
    (Array.isArray(subject.watch) ? subject.watch : [])
      .filter((item) => item.source === "auto-document")
      .map((item) => [String(item.url || "").trim().toLowerCase(), item])
  );

  const autoWatchItems = [];
  const seenAutoUrls = new Set();
  subject.documents.forEach((documentRecord) => {
    const sourceTitle = getBaseDocumentTitle(documentRecord) || documentRecord.title;
    const references = getYoutubeReferencesFromText(documentRecord.content, sourceTitle);
    references.forEach((reference) => {
      const normalisedUrl = reference.url.toLowerCase();
      if (!normalisedUrl || manualUrls.has(normalisedUrl) || seenAutoUrls.has(normalisedUrl)) {
        return;
      }
      const existingAutoItem = existingAutoByUrl.get(normalisedUrl);
      autoWatchItems.push({
        id: existingAutoItem?.id || createId(),
        title: existingAutoItem?.title || reference.title,
        url: reference.url,
        addedAt: existingAutoItem?.addedAt || documentRecord.addedAt || new Date().toISOString(),
        source: "auto-document",
        sourceDocumentId: documentRecord.id,
        sourceBundleId: getDocumentGroupId(documentRecord),
        sourceDocumentTitle: sourceTitle,
        sourceSubjectId: subject.id
      });
      seenAutoUrls.add(normalisedUrl);
    });
  });

  subject.watch = [...autoWatchItems, ...manualWatchItems].sort(
    (left, right) => new Date(right.addedAt || 0).getTime() - new Date(left.addedAt || 0).getTime()
  );
}

function syncAutoWatchForAllSubjects() {
  state.subjects.forEach((subject) => {
    syncAutoWatchForSubject(subject);
  });
}

function getSortedDocuments(subject) {
  return [...subject.documents].sort((left, right) => {
    const leftGroupId = getDocumentGroupId(left);
    const rightGroupId = getDocumentGroupId(right);
    if (leftGroupId === rightGroupId) {
      const leftPage = getDocumentPageNumber(left);
      const rightPage = getDocumentPageNumber(right);
      if (leftPage !== null && rightPage !== null && leftPage !== rightPage) {
        return leftPage - rightPage;
      }
      return left.title.localeCompare(right.title, undefined, { numeric: true });
    }
    return getDocumentSortValue(right) - getDocumentSortValue(left);
  });
}

function getDocumentGroupsFromDocuments(documents) {
  const grouped = new Map();
  [...documents].forEach((documentRecord) => {
    const groupId = getDocumentGroupId(documentRecord);
    const existing = grouped.get(groupId);
    if (existing) {
      existing.documents.push(documentRecord);
      return;
    }
    grouped.set(groupId, {
      id: groupId,
      added: documentRecord.added,
      documents: [documentRecord],
      isPageGroup: Boolean(documentRecord.uploadGroupId)
    });
  });

  return [...grouped.values()].map((group) => ({
    ...group,
    documents: group.documents.sort((left, right) => {
      const leftPage = getDocumentPageNumber(left);
      const rightPage = getDocumentPageNumber(right);
      if (leftPage !== null && rightPage !== null && leftPage !== rightPage) {
        return leftPage - rightPage;
      }
      return left.title.localeCompare(right.title, undefined, { numeric: true });
    })
  }));
}

function getDocumentGroups(subject) {
  return getDocumentGroupsFromDocuments(getSortedDocuments(subject));
}

function getSelectedDocumentIndex() {
  const subject = getSelectedSubject();
  const selectedDocument = getSelectedDocument();
  if (!subject || !selectedDocument) {
    return -1;
  }
  return getSortedDocuments(subject).findIndex((documentRecord) => documentRecord.id === selectedDocument.id);
}

function selectAdjacentDocument(direction) {
  const subject = getSelectedSubject();
  const selectedIndex = getSelectedDocumentIndex();
  if (!subject || selectedIndex === -1) {
    return;
  }
  const sortedDocuments = getSortedDocuments(subject);
  const nextDocument = sortedDocuments[selectedIndex + direction];
  if (!nextDocument) {
    return;
  }
  state.selectedDocumentId = nextDocument.id;
  renderDocuments();
  scrollReaderIntoView();
}

function renderDocumentBulkActions(subject) {
  const documentIds = subject.documents.map((documentRecord) => documentRecord.id);
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

function renderReaderToolbar() {
  const selectedDocument = getSelectedDocument();
  const selectedIndex = getSelectedDocumentIndex();
  const documentCount = getSelectedSubject()?.documents.length || 0;
  const hasDocument = Boolean(selectedDocument);

  elements.readerPreviousButton.disabled = !hasDocument || selectedIndex <= 0;
  elements.readerListenButton.disabled = !hasDocument;
  elements.readerAskButton.disabled = !hasDocument;
  elements.readerNextButton.disabled = !hasDocument || selectedIndex === -1 || selectedIndex >= documentCount - 1;
  elements.readerListenButton.textContent =
    selectedDocument && state.listeningDocumentId === selectedDocument.id ? "Stop" : "Listen";
}

function renderDocumentGroupRows(group, { reviewedSection = false } = {}) {
  const isExpanded = Boolean(state.expandedDocumentGroups[group.id]);
  const visibleDocuments =
    group.isPageGroup && !isExpanded ? [group.documents[0]] : group.documents;
  const dateCellMarkup = group.isPageGroup
    ? `
      <button type="button" class="documents-date-button" data-document-group-toggle="${group.id}">
        <strong>${escapeHtml(group.added)}</strong>
        <span>${isExpanded ? "Hide pages" : `${group.documents.length} pages`}</span>
      </button>
    `
    : `<span class="documents-date-button"><strong>${escapeHtml(group.added)}</strong></span>`;

  return visibleDocuments
    .map(
      (document, index) => `
        <tr class="${document.id === state.selectedDocumentId ? "is-selected" : ""}${state.selectedDocumentIds.includes(document.id) ? " is-bulk-selected" : ""}${reviewedSection ? " documents-row--reviewed" : ""}">
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

  if (!subject.documents.length) {
    elements.documentsBody.innerHTML = `
      <tr>
        <td colspan="5">
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
    renderReaderToolbar();
    return;
  }

  const sortedDocuments = getSortedDocuments(subject);
  const unreadDocuments = sortedDocuments.filter((document) => !document.reviewed);
  const reviewedDocuments = sortedDocuments.filter((document) => document.reviewed);
  const groupedDocuments = getDocumentGroups(subject);
  const unreadGroups = getDocumentGroupsFromDocuments(unreadDocuments);
  const reviewedGroups = getDocumentGroupsFromDocuments(reviewedDocuments);

  if (!sortedDocuments.find((doc) => doc.id === state.selectedDocumentId)) {
    state.selectedDocumentId = sortedDocuments[0].id;
  }

  if (!sortedDocuments.find((doc) => doc.id === state.askDocumentId)) {
    state.askDocumentId = sortedDocuments[0].id;
  }

  const visibleUnreadGroups = state.documentsExpanded ? unreadGroups : unreadGroups.slice(0, 6);
  const rowsMarkup = [
    `
      <tr class="documents-section-row">
        <td colspan="5">Newly uploaded</td>
      </tr>
    `,
    visibleUnreadGroups.length
      ? visibleUnreadGroups.map((group) => renderDocumentGroupRows(group)).join("")
      : `
        <tr class="documents-empty-row">
          <td colspan="5"><div class="empty-state">No new documents waiting to be read.</div></td>
        </tr>
      `,
    reviewedGroups.length
      ? `
        <tr class="documents-section-row documents-section-row--reviewed">
          <td colspan="5">Read / listened</td>
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
}

function renderWatchList() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  elements.watchStatus.textContent = "";
  const watchItems = Array.isArray(subject.watch) ? subject.watch : [];
  if (!watchItems.length) {
    elements.watchList.innerHTML = `<div class="empty-state">No WATCH items for this subject yet.</div>`;
    elements.watchToggleButton.classList.add("hidden");
    return;
  }

  const visibleItems = state.watchExpanded ? watchItems : watchItems.slice(0, 3);

  elements.watchList.innerHTML = visibleItems
    .map(
      (item) => `
        <article class="practice-item">
          <div class="activity-row">
            <span class="activity-tag">${item.source === "auto-document" ? "Auto watch" : "Watch"}</span>
          </div>
          <h4>${escapeHtml(item.title)}</h4>
          <p class="practice-copy">${escapeHtml(item.url)}</p>
          ${
            item.sourceDocumentTitle
              ? `<p class="practice-copy practice-copy--source">Detected from ${escapeHtml(item.sourceDocumentTitle)}</p>`
              : ""
          }
          <div class="table-actions">
            <button type="button" class="table-action" data-watch-action="open" data-watch-id="${item.id}">Open</button>
            <button type="button" class="table-action table-action--danger" data-watch-action="delete" data-watch-id="${item.id}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");

  const hasExtraWatchItems = watchItems.length > 3;
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
        subject.watch = watchItems.filter((entry) => entry.id !== item.id);
        persistSubjects();
        render();
      }
    });
  });
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
    renderReaderToolbar();
    return;
  }

  elements.readerTitle.textContent = selectedDocument.title;
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
  const reviewToggleMarkup = `
    <label class="document-review-toggle document-review-toggle--reader">
      <input type="checkbox" id="reader-reviewed-toggle" ${selectedDocument.reviewed ? "checked" : ""} />
      <span>${selectedDocument.reviewed ? "Read / listened" : "Mark as read / listened"}</span>
    </label>
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
      selectedDocument.workNotes = editor.value;
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
    renderReaderToolbar();
    return;
  }

  elements.readerContent.innerHTML = `
    ${reviewToggleMarkup}
    ${previewImageMarkup}
    <div class="reader-content__text">${escapeHtml(readableContent).replaceAll("\n", "<br />")}</div>
    ${openOriginalMarkup}
  `;
  document.getElementById("reader-reviewed-toggle")?.addEventListener("change", (event) => {
    const subject = getSelectedSubject();
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
  renderReaderToolbar();
}

function speakDocument(document) {
  stopListening();
  const textToRead = normaliseSpeechText(
    document.content || `${document.title}. Preview text is not available for this file yet.`
  );
  if (!textToRead) {
    elements.askResponse.textContent = "There is no readable text available for this document yet.";
    return;
  }

  const speakWithOpenAi = async () => {
    state.listeningDocumentId = document.id;
    renderDocuments();

    const speechBlob = await requestApi(
      "/api/speak",
      {
        text: clipText(textToRead, 3500)
      },
      true
    );

    currentAudioObjectUrl = URL.createObjectURL(speechBlob);
    currentAudioPlayback = new Audio(currentAudioObjectUrl);
    currentAudioPlayback.onended = () => {
      stopListening();
      renderDocuments();
    };
    currentAudioPlayback.onerror = () => {
      stopListening();
      elements.askResponse.textContent = "AI voice playback failed for this document.";
    };
    await currentAudioPlayback.play();
  };

  speakWithOpenAi().catch((error) => {
    console.error("OpenAI speech failed.", error);
    stopListening();
    elements.askResponse.textContent =
      error instanceof Error ? `Listen failed: ${error.message}` : "Listen failed.";
    renderDocuments();
  });
}

function stopListening() {
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

function deleteDocuments(documentIds) {
  const subject = getSelectedSubject();
  const uniqueDocumentIds = [...new Set(documentIds)];
  if (!subject || !uniqueDocumentIds.length) {
    return;
  }

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
    state.selectedDocumentId = getSortedDocuments(subject)[0]?.id || null;
  }
  if (uniqueDocumentIds.includes(state.askDocumentId)) {
    state.askDocumentId = getSortedDocuments(subject)[0]?.id || null;
  }
  syncAutoWatchForSubject(subject);
  persistSubjects();
  deletePreviewRecords(uniqueDocumentIds).catch((error) => {
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
        openAttachNotesModal(subject.id, assessmentId);
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

function openAttachNotesModal(subjectId, assessmentId) {
  state.activeAttachmentAssessment = { subjectId, assessmentId };
  state.attachmentModalOpen = true;
  elements.attachNotesModal.classList.remove("hidden");
  elements.attachNotesModal.setAttribute("aria-hidden", "false");
  renderAttachNotesModal();
}

function closeAttachNotesModal() {
  state.attachmentModalOpen = false;
  state.activeAttachmentAssessment = null;
  state.expandedAttachmentGroups = {};
  elements.attachNotesModal.classList.add("hidden");
  elements.attachNotesModal.setAttribute("aria-hidden", "true");
}

function renderAttachNotesModal() {
  const context = state.activeAttachmentAssessment;
  if (!context) {
    elements.attachNotesList.innerHTML = `<div class="empty-state">Select an assessment first.</div>`;
    return;
  }

  const subject = state.subjects.find((item) => item.id === context.subjectId);
  const assessment = subject?.assessments.find((item) => item.id === context.assessmentId);
  if (!subject || !assessment) {
    elements.attachNotesList.innerHTML = `<div class="empty-state">This assessment is no longer available.</div>`;
    return;
  }

  elements.attachNotesSummary.textContent = `${assessment.componentTask || assessment.title} · ${assessment.linkedDocumentIds.length} page${assessment.linkedDocumentIds.length === 1 ? "" : "s"} attached`;

  if (!subject.documents.length) {
    elements.attachNotesList.innerHTML = `<div class="empty-state">Upload documents to this subject before attaching notes.</div>`;
    return;
  }

  const groups = getDocumentGroups(subject);
  elements.attachNotesList.innerHTML = groups
    .map((group) => {
      const isExpanded = Boolean(state.expandedAttachmentGroups[group.id]);
      const visibleDocuments = group.isPageGroup && !isExpanded ? [group.documents[0]] : group.documents;
      return `
        <section class="attach-notes-group">
          <button type="button" class="attach-notes-group__toggle" data-attach-group-toggle="${group.id}">
            <strong>${escapeHtml(group.added)}</strong>
            <span>${group.isPageGroup ? `${group.documents.length} pages` : `${group.documents.length} file${group.documents.length === 1 ? "" : "s"}`} · ${isExpanded ? "Hide" : "Show all"}</span>
          </button>
          <div class="attach-notes-pages">
            ${visibleDocuments
              .map(
                (documentRecord) => `
                  <article class="attach-notes-page">
                    ${
                      documentRecord.previewImageUrl
                        ? `<img class="attach-notes-page__preview" src="${escapeHtml(documentRecord.previewImageUrl)}" alt="${escapeHtml(documentRecord.title)} preview" />`
                        : `<div class="empty-state">No preview available</div>`
                    }
                    <div class="attach-notes-page__body">
                      <label class="attach-notes-page__select">
                        <input type="checkbox" data-attach-document-id="${documentRecord.id}" ${assessment.linkedDocumentIds.includes(documentRecord.id) ? "checked" : ""} />
                        <span>${escapeHtml(documentRecord.title)}</span>
                      </label>
                      <div class="attach-notes-page__meta">
                        ${escapeHtml(documentRecord.type)}${documentRecord.pageNumber ? ` · Page ${documentRecord.pageNumber}` : ""}
                      </div>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");

  elements.attachNotesList.querySelectorAll("[data-attach-group-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupId = button.dataset.attachGroupToggle;
      if (!groupId) {
        return;
      }
      state.expandedAttachmentGroups[groupId] = !state.expandedAttachmentGroups[groupId];
      renderAttachNotesModal();
    });
  });

  elements.attachNotesList.querySelectorAll("[data-attach-document-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const documentId = event.target.dataset.attachDocumentId;
      if (!documentId) {
        return;
      }
      if (event.target.checked) {
        if (!assessment.linkedDocumentIds.includes(documentId)) {
          assessment.linkedDocumentIds.push(documentId);
        }
      } else {
        assessment.linkedDocumentIds = assessment.linkedDocumentIds.filter((id) => id !== documentId);
      }
      persistSubjects();
      renderAssessments();
      renderUpcomingModal();
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
  elements.taskWorkStatus.textContent = "";
  renderTaskView();
  renderCurrentView();
  window.requestAnimationFrame(() => {
    elements.taskView.scrollIntoView({ block: "start", inline: "nearest" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

function renderTaskView() {
  const subject = getSelectedSubject();
  const activeTask = state.activeTask;
  if (!subject || !activeTask) {
    return;
  }

  if (activeTask.kind === "assessment") {
    const assessment = subject.assessments.find((item) => item.id === activeTask.id);
    if (!assessment) {
      return;
    }
    const linkedDocumentBundles = getLinkedDocumentBundles(subject, assessment.linkedDocumentIds);
    const linkedPageCount = assessment.linkedDocumentIds.length;
    elements.taskViewTitle.textContent = assessment.componentTask || assessment.title;
    elements.taskSourceTitle.textContent = assessment.componentTask || assessment.title;
    elements.taskSourceContent.innerHTML = `
      <article class="assessment-item assessment-item--current task-assessment-card">
        <div class="assessment-item__header">
          <div class="assessment-item__title-group">
            <span class="assessment-date">Due ${escapeHtml(formatAssessmentDueLabel(assessment.dueDate))}</span>
            <h4>${escapeHtml(assessment.componentTask || assessment.title)}</h4>
            <span class="document-chip assessment-item__subject">${escapeHtml(subject.name)}</span>
          </div>
          <span class="assessment-item__task">Task ${escapeHtml(assessment.taskNumber || "Uploaded")}</span>
        </div>
        <div class="assessment-grid">
          <div class="assessment-fact">
            <strong>Due date</strong>
            <span>${escapeHtml(formatAssessmentDueLabel(assessment.dueDate))}</span>
          </div>
          <div class="assessment-fact">
            <strong>Distribution</strong>
            <span>${escapeHtml(formatAssessmentDueLabel(assessment.distributionDate || "TBC"))}</span>
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
        <div class="task-assessment-card__summary">${escapeHtml(assessment.description || `${assessment.componentTask || assessment.title}.`)}</div>
        <div class="task-relevant-notes">
          <p class="eyebrow task-relevant-notes__heading">Relevant Notes</p>
          <div class="task-relevant-notes__list">
            ${
              linkedDocumentBundles.length
                ? linkedDocumentBundles
                    .map(
                      (documentBundle) => `
                        <button type="button" class="ghost-button task-note-chip" data-task-document-id="${documentBundle.id}">
                          ${escapeHtml(documentBundle.title)}
                        </button>
                      `
                    )
                    .join("")
                : '<span class="document-empty">No supporting documents linked yet.</span>'
            }
          </div>
          ${linkedDocumentBundles.length ? `<div class="task-assessment-card__summary">${linkedPageCount} page${linkedPageCount === 1 ? "" : "s"} linked across ${linkedDocumentBundles.length} document${linkedDocumentBundles.length === 1 ? "" : "s"}.</div>` : ""}
        </div>
      </article>
    `;
    elements.taskSourceContent.querySelectorAll("[data-task-document-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const documentBundle = linkedDocumentBundles.find((document) => document.id === button.dataset.taskDocumentId);
        if (documentBundle) {
          openDocumentPopup(documentBundle);
        }
      });
    });
    elements.taskWorkEditor.value = assessment.workNotes || "";
    return;
  }

  if (activeTask.kind === "homework") {
    const homeworkBundle = findHomeworkBundle(subject, activeTask.id);
    if (!homeworkBundle) {
      return;
    }
    elements.taskViewTitle.textContent = homeworkBundle.title;
    elements.taskSourceTitle.textContent = homeworkBundle.title;
    elements.taskSourceContent.innerHTML = `
      ${homeworkBundle.documents
        .map((documentItem) =>
          documentItem.previewImageUrl
            ? `<img class="reader-preview-image" src="${escapeHtml(documentItem.previewImageUrl)}" alt="${escapeHtml(documentItem.title)} preview" />`
            : ""
        )
        .join("")}
      <div class="reader-content__text">${escapeHtml(homeworkBundle.content || "").replaceAll("\n", "<br />")}</div>
    `;
    elements.taskWorkEditor.value = homeworkBundle.workNotes || "";
  }
}

function saveTaskWorkspace() {
  const subject = getSelectedSubject();
  const activeTask = state.activeTask;
  if (!subject || !activeTask) {
    return;
  }

  if (activeTask.kind === "assessment") {
    const assessment = subject.assessments.find((item) => item.id === activeTask.id);
    if (!assessment) {
      return;
    }
    assessment.workNotes = elements.taskWorkEditor.value;
  }

  if (activeTask.kind === "homework") {
    const homeworkBundle = findHomeworkBundle(subject, activeTask.id);
    if (!homeworkBundle) {
      return;
    }
    homeworkBundle.documents.forEach((documentItem) => {
      documentItem.workNotes = elements.taskWorkEditor.value;
    });
  }

  persistSubjects();
  elements.taskWorkStatus.textContent = "Saved.";
}

function saveTaskWorkspaceToFiles() {
  const subject = getSelectedSubject();
  const activeTask = state.activeTask;
  if (!subject || !activeTask) {
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

  const exportContent = elements.taskWorkEditor.value || "";
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
    return;
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
        <div class="practice-copy">${assessment.linkedDocumentIds.length} note page${assessment.linkedDocumentIds.length === 1 ? "" : "s"} attached.</div>
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

function renderPractice() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  const homeworkBundles = getHomeworkBundles(subject);
  if (!homeworkBundles.length) {
    elements.practiceList.innerHTML = `<div class="empty-state">No homework items for this subject yet.</div>`;
    return;
  }

  elements.practiceList.innerHTML = homeworkBundles
    .map(
      (documentBundle) => `
        <article class="practice-item">
          <div class="activity-row">
            <span class="activity-tag">Homework</span>
          </div>
          <h4><button type="button" class="assessment-link-button" data-open-homework="${documentBundle.id}">${escapeHtml(documentBundle.title)}</button></h4>
          <p class="practice-copy">Open this homework item to work from the full document while keeping page-by-page reading in Documents.</p>
        </article>
      `
    )
    .join("");

  elements.practiceList.querySelectorAll("[data-open-homework]").forEach((button) => {
    button.addEventListener("click", () => {
      openTaskView({ kind: "homework", id: button.dataset.openHomework });
    });
  });
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
  elements.askInput.value = "";
  elements.askButton.disabled = false;
  renderAskContext();
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
    flags: {
      classNotes: false,
      assessment: false,
      homework: false
    }
  };
}

function normaliseWhitespace(value) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
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

  return {
    fullText,
    pages
  };
}

async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    if (window.__pdfjsLib) {
      pdfjsLibPromise = Promise.resolve(window.__pdfjsLib);
    } else if (window.__pdfjsLibPromise) {
      pdfjsLibPromise = window.__pdfjsLibPromise;
    } else if (window.__pdfjsLibError) {
      throw new Error(window.__pdfjsLibError);
    } else {
      pdfjsLibPromise = new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          reject(new Error("PDF tools did not load in this browser."));
        }, 6000);

        window.addEventListener(
          "studylift:pdf-ready",
          () => {
            window.clearTimeout(timeout);
            if (window.__pdfjsLib) {
              resolve(window.__pdfjsLib);
              return;
            }
            reject(new Error(window.__pdfjsLibError || "PDF tools did not load in this browser."));
          },
          { once: true }
        );
      }).catch((error) => {
        pdfjsLibPromise = null;
        throw error;
      });
    }
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

async function extractDocxText(file) {
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
    const records = flags.classNotes
      ? splitClassNotesByDate(file.name, text, flags, originalFile)
      : [createDocumentWithFlags({
            title: file.name.replace(/\.[^.]+$/, ""),
            type: flags.homework ? "Homework" : flags.assessment ? "Assessment" : "Document",
            content: text.trim()
          }, flags)];
    records.forEach((record) => {
      record.originalFile = originalFile;
    });
    return {
      records
    };
  }

  if (lowerName.endsWith(".pdf")) {
    const pdfData = await extractPdfData(file);
    const records = flags.homework
      ? [createWholePdfRecord(file.name, flags, originalFile, pdfData)]
      : createPdfPageRecords(file.name, flags, originalFile, pdfData.pages);
    return {
      records
    };
  }

  if (lowerName.endsWith(".docx")) {
    const content = await extractDocxText(file);
    const records = flags.classNotes
      ? splitClassNotesByDate(file.name, content || "No readable text was detected in this document.", flags, originalFile)
      : [createDocumentWithFlags({
          title: file.name.replace(/\.[^.]+$/, ""),
          type: flags.homework ? "Homework" : flags.assessment ? "Assessment" : "DOCX",
          content: content || "No readable text was detected in this document."
        }, flags)];
    records.forEach((record) => {
      record.originalFile = originalFile;
    });
    return {
      records
    };
  }

  if (lowerName.endsWith(".pptx")) {
    const content = await extractPptxText(file);
    const records = flags.classNotes
      ? splitClassNotesByDate(file.name, content || "No readable text was detected in this presentation.", flags, originalFile)
      : [createDocumentWithFlags({
          title: file.name.replace(/\.[^.]+$/, ""),
          type: flags.homework ? "Homework" : flags.assessment ? "Assessment" : "PPTX",
          content: content || "No readable text was detected in this presentation."
        }, flags)];
    records.forEach((record) => {
      record.originalFile = originalFile;
    });
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
    const watchUrl = elements.uploadWatchUrl.value.trim();
    const watchTitle = elements.uploadWatchTitle.value.trim();
    if (!watchUrl) {
      elements.uploadStatus.textContent = "Add a YouTube link for WATCH.";
      return;
    }
    const finalTitle = watchTitle || watchUrl;
    if ((subject.watch || []).some((item) => item.title.toLowerCase() === finalTitle.toLowerCase())) {
      elements.uploadStatus.textContent = "A WATCH item with that name already exists in this subject.";
      return;
    }
    subject.watch = Array.isArray(subject.watch) ? subject.watch : [];
    subject.watch.unshift({ id: createId(), title: finalTitle, url: watchUrl, addedAt: new Date().toISOString() });
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
    state.selectedDocumentId = getSortedDocuments(subject)[0]?.id || null;
    elements.documentUpload.value = "";
    clearUploadOptions();
    render();
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
    if (elements.backgroundHomeCheckbox.checked) {
      state.settings.homeBackground = imageDataUrl;
    }
    if (elements.backgroundSubjectsCheckbox.checked) {
      state.settings.subjectsBackground = imageDataUrl;
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

  if (elements.backgroundHomeCheckbox.checked) {
    state.settings.homeBackground = "";
  }
  if (elements.backgroundSubjectsCheckbox.checked) {
    state.settings.subjectsBackground = "";
  }

  persistSettings();
  applyBackgrounds();
  renderCurrentView();
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

function saveAccountSettings() {
  const currentAccount = findAccountByEmail(state.currentUserEmail);
  if (!currentAccount) {
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

  const accounts = loadAccounts();
  const emailTaken = accounts.some(
    (account) => account.email.toLowerCase() === nextEmail && account.email.toLowerCase() !== currentAccount.email.toLowerCase()
  );
  if (emailTaken) {
    elements.settingsStatus.textContent = "That email is already in use.";
    return;
  }

  const updatedAccounts = accounts.map((account) =>
    account.email.toLowerCase() === currentAccount.email.toLowerCase()
      ? { ...account, name: nextName, email: nextEmail, grade: nextGrade }
      : account
  );
  if (nextEmail !== currentAccount.email.toLowerCase()) {
    const storedSubjectsMap = loadStoredSubjectsMap();
    const currentKey = normaliseAccountKey(currentAccount.email);
    const nextKey = normaliseAccountKey(nextEmail);
    if (storedSubjectsMap[currentKey]) {
      storedSubjectsMap[nextKey] = storedSubjectsMap[currentKey];
      delete storedSubjectsMap[currentKey];
      saveStoredSubjectsMap(storedSubjectsMap);
    }
  }
  saveAccounts(updatedAccounts);
  state.studentName = nextName;
  state.currentUserEmail = nextEmail;
  state.studentGrade = nextGrade;
  persistSession(nextEmail);
  elements.welcomeHeading.textContent = `Welcome back, ${state.studentName}`;
  elements.settingsStatus.textContent = "Account saved.";
  state.generatedRevisionTest = null;
  state.revisionResponses = {};
  state.revisionSubmission = null;
  state.revisionViewMode = "draft";
  state.activeSavedRevisionTestId = "";
  void loadRevisionCatalogue(true);
}

function savePasswordSettings() {
  const currentAccount = findAccountByEmail(state.currentUserEmail);
  if (!currentAccount) {
    elements.settingsStatus.textContent = "Account could not be found.";
    return;
  }

  const currentPassword = elements.settingsCurrentPasswordInput.value;
  const newPassword = elements.settingsNewPasswordInput.value;
  const confirmPassword = elements.settingsConfirmPasswordInput.value;

  if (currentPassword !== currentAccount.password) {
    elements.settingsStatus.textContent = "Current password is incorrect.";
    return;
  }

  if (!newPassword) {
    elements.settingsStatus.textContent = "Enter a new password.";
    return;
  }

  if (newPassword !== confirmPassword) {
    elements.settingsStatus.textContent = "New passwords do not match.";
    return;
  }

  const updatedAccounts = loadAccounts().map((account) =>
    account.email.toLowerCase() === currentAccount.email.toLowerCase()
      ? { ...account, password: newPassword }
      : account
  );
  saveAccounts(updatedAccounts);
  elements.settingsCurrentPasswordInput.value = "";
  elements.settingsNewPasswordInput.value = "";
  elements.settingsConfirmPasswordInput.value = "";
  elements.settingsStatus.textContent = "Password updated.";
}

function render() {
  applyBackgrounds();
  renderAiConnectionState();
  renderCurrentView();
  renderOverview();
  renderRevisionPanel();
  renderSubjectList();
  renderSubjectHeader();
  renderPendingUpload();
  renderDocuments();
  renderAskContext();
  renderSavedRevisionTests();
  renderAssessments();
  renderPractice();
  renderWatchList();
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

function handleDashboardOpen() {
  const studentName = elements.studentNameInput.value.trim();
  const studentGrade = normaliseGrade(elements.studentGradeSelect.value);
  const studentEmail = elements.studentEmailInput.value.trim().toLowerCase();
  const password = elements.studentPasswordInput.value;
  const confirmPassword = elements.studentPasswordConfirmInput.value;

  elements.signInStatus.textContent = "";

  if (!studentEmail || !password) {
    elements.signInStatus.textContent = "Enter your school email and password.";
    return;
  }

  if (state.authMode === "create") {
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
    if (findAccountByEmail(studentEmail)) {
      elements.signInStatus.textContent = "That email already has an account. Sign in instead.";
      return;
    }

    const accounts = loadAccounts();
    accounts.push({
      name: studentName,
      email: studentEmail,
      password,
      grade: studentGrade
    });
    saveAccounts(accounts);
    state.studentName = studentName;
    state.currentUserEmail = studentEmail;
    state.studentGrade = studentGrade;
    persistSession(studentEmail);
    restoreSubjectsForAccount({ name: studentName, email: studentEmail, grade: studentGrade });
    openDashboard("home");
    return;
  }

  const account = findAccountByEmail(studentEmail);
  if (!account || account.password !== password) {
    elements.signInStatus.textContent = "That email or password is incorrect.";
    return;
  }

  state.studentName = account.name;
  state.currentUserEmail = account.email;
  state.studentGrade = normaliseGrade(account.grade);
  persistSession(account.email);
  restoreSubjectsForAccount(account);
  openDashboard("home");
}

elements.askButton.addEventListener("click", handleAsk);
elements.signInModeCreateButton.addEventListener("click", () => {
  state.authMode = "create";
  elements.signInStatus.textContent = "";
  syncSignInMode();
});
elements.signInModeLoginButton.addEventListener("click", () => {
  state.authMode = "signin";
  elements.signInStatus.textContent = "";
  syncSignInMode();
});
elements.readerPreviousButton.addEventListener("click", () => {
  selectAdjacentDocument(-1);
});
elements.readerListenButton.addEventListener("click", () => {
  const selectedDocument = getSelectedDocument();
  if (!selectedDocument) {
    return;
  }
  toggleListen(selectedDocument);
});
elements.readerAskButton.addEventListener("click", () => {
  const selectedDocument = getSelectedDocument();
  if (!selectedDocument) {
    return;
  }
  state.askDocumentId = selectedDocument.id;
  elements.askInput.value = "";
  renderAskContext();
  elements.askResponse.textContent = "Ask a question about the selected document.";
  focusAskComposer();
});
elements.readerNextButton.addEventListener("click", () => {
  selectAdjacentDocument(1);
});
elements.openDashboardButton.addEventListener("click", handleDashboardOpen);
elements.removeBackgroundButton.addEventListener("click", handleRemoveBackground);
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
elements.navHomeButton.addEventListener("click", () => {
  state.currentView = "home";
  render();
});
elements.navSubjectsButton.addEventListener("click", () => {
  state.currentView = "subjects";
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
  render();
});
elements.openUploadModalButton?.addEventListener("click", openUploadModal);
elements.openUploadModalSecondary.addEventListener("click", openUploadModal);
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
elements.savePasswordSettingsButton.addEventListener("click", savePasswordSettings);
elements.closeTaskViewButton.addEventListener("click", () => {
  state.currentView = "subjects";
  render();
});
elements.closeRevisionViewButton.addEventListener("click", () => {
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
  if (!subject?.documents.length) {
    return;
  }
  const allDocumentIds = subject.documents.map((documentRecord) => documentRecord.id);
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
  deleteDocuments(state.selectedDocumentIds);
});
elements.watchToggleButton.addEventListener("click", () => {
  state.watchExpanded = !state.watchExpanded;
  renderWatchList();
});
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
  clearSession();
  state.studentName = "";
  state.currentUserEmail = "";
  state.subjects = createBaseSubjects();
  showLanding();
});
document.addEventListener("keydown", (event) => {
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
restoreSubjects();
restoreSessionUser();
render();
