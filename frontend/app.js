import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
window.__pdfjsLib = pdfjsLib;
window.__pdfjsLibPromise = Promise.resolve(pdfjsLib);
window.__pdfjsLibError = "";
window.dispatchEvent(new Event("studylift:pdf-ready"));

const storageKey = "studylift-student";
const subjectsStorageKey = "studylift-subjects";
const settingsStorageKey = "studylift-settings";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
let pdfjsLibPromise = null;
let currentAudioPlayback = null;
let currentAudioObjectUrl = "";

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

const state = {
  studentName: "",
  selectedSubjectId: subjectSeed[0].id,
  selectedDocumentId: null,
  askDocumentId: null,
  listeningDocumentId: null,
  selectedDocumentIds: [],
  expandedDocumentGroups: {},
  documentsExpanded: false,
  currentView: "home",
  activeTask: null,
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
    subjectsBackground: ""
  },
  subjects: structuredClone(subjectSeed)
};

const elements = {
  landingPanel: document.getElementById("landing-panel"),
  appShell: document.getElementById("app-shell"),
  signInForm: document.getElementById("signin-form"),
  openDashboardButton: document.getElementById("open-dashboard-button"),
  studentNameInput: document.getElementById("student-name"),
  studentEmailInput: document.getElementById("student-email"),
  welcomeHeading: document.getElementById("welcome-heading"),
  navHomeButton: document.getElementById("nav-home-button"),
  navSubjectsButton: document.getElementById("nav-subjects-button"),
  homeView: document.getElementById("home-view"),
  subjectsView: document.getElementById("subjects-view"),
  taskView: document.getElementById("task-view"),
  backgroundUpload: document.getElementById("background-upload"),
  changeBackgroundButton: document.getElementById("change-background-button"),
  backgroundHomeCheckbox: document.getElementById("background-home-checkbox"),
  backgroundSubjectsCheckbox: document.getElementById("background-subjects-checkbox"),
  enterSubjectsButton: document.getElementById("enter-subjects-button"),
  openUploadModalButton: document.getElementById("open-upload-modal-button"),
  openUploadModalSecondary: document.getElementById("open-upload-modal-secondary"),
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
  uploadWatchUrlWrap: document.getElementById("upload-watch-url-wrap"),
  uploadWatchUrl: document.getElementById("upload-watch-url"),
  uploadWatchTitleWrap: document.getElementById("upload-watch-title-wrap"),
  uploadWatchTitle: document.getElementById("upload-watch-title"),
  processUploadButton: document.getElementById("process-upload-button"),
  clearUploadButton: document.getElementById("clear-upload-button"),
  uploadStatus: document.getElementById("upload-status"),
  aiConnectionStatus: document.getElementById("ai-connection-status"),
  askInput: document.getElementById("ask-input"),
  askButton: document.getElementById("ask-button"),
  askContext: document.getElementById("ask-context"),
  askResponse: document.getElementById("ask-response"),
  readerCard: document.getElementById("reader-card"),
  readerTitle: document.getElementById("reader-title"),
  readerContent: document.getElementById("reader-content"),
  readerReadButton: document.getElementById("reader-read-button"),
  readerListenButton: document.getElementById("reader-listen-button"),
  readerAskButton: document.getElementById("reader-ask-button"),
  readerDeleteButton: document.getElementById("reader-delete-button"),
  assessmentList: document.getElementById("assessment-list"),
  practiceList: document.getElementById("practice-list"),
  watchList: document.getElementById("watch-list"),
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
  taskViewTitle: document.getElementById("task-view-title"),
  taskSourceTitle: document.getElementById("task-source-title"),
  taskSourceContent: document.getElementById("task-source-content"),
  taskWorkEditor: document.getElementById("task-work-editor"),
  taskWorkStatus: document.getElementById("task-work-status"),
  saveTaskWorkButton: document.getElementById("save-task-work-button"),
  closeTaskViewButton: document.getElementById("close-task-view-button")
};

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

  const manualDateMatch = value.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})$/);
  if (manualDateMatch) {
    const parsed = new Date(`${manualDateMatch[1]} ${manualDateMatch[2]} 2026`);
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

function persistStudent(name) {
  window.localStorage.setItem(storageKey, name);
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

function persistSubjects() {
  const persistableSubjects = state.subjects.map((subject) => ({
    ...subject,
    documents: Array.isArray(subject.documents)
      ? subject.documents.map(createPersistableDocument)
      : []
  }));

  try {
    window.localStorage.setItem(subjectsStorageKey, JSON.stringify(persistableSubjects));
  } catch (error) {
    const fallbackSubjects = state.subjects.map((subject) => ({
      ...subject,
      askHistory: Array.isArray(subject.askHistory) ? subject.askHistory.slice(-5) : [],
      documents: Array.isArray(subject.documents)
        ? subject.documents.map(createQuotaFallbackDocument)
        : []
    }));
    window.localStorage.setItem(subjectsStorageKey, JSON.stringify(fallbackSubjects));
    if (elements?.uploadStatus) {
      elements.uploadStatus.textContent =
        "Large document previews will stay available in this session, but only a lighter saved version will persist after refresh.";
    }
  }
}

function persistSettings() {
  window.localStorage.setItem(
    settingsStorageKey,
    JSON.stringify({
      termStarts: state.termStarts,
      termEnds: state.termEnds,
      homeBackground: state.settings.homeBackground,
      subjectsBackground: state.settings.subjectsBackground
    })
  );
}

function clearStudent() {
  window.localStorage.removeItem(storageKey);
}

function normaliseAssessment(assessment) {
  return {
    ...assessment,
    linkedDocumentIds: Array.isArray(assessment.linkedDocumentIds) ? assessment.linkedDocumentIds : [],
    completed: Boolean(assessment.completed),
    workNotes: assessment.workNotes || ""
  };
}

function normaliseDocument(documentRecord) {
  return {
    ...documentRecord,
    workNotes: documentRecord.workNotes || "",
    flags: {
      classNotes: Boolean(documentRecord.flags?.classNotes || documentRecord.flags?.termOverview),
      assessment: Boolean(documentRecord.flags?.assessment),
      homework: Boolean(documentRecord.flags?.homework)
    }
  };
}

function restoreSubjects() {
  const raw = window.localStorage.getItem(subjectsStorageKey);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }

    state.subjects = parsed.map((subject, index) => ({
      ...structuredClone(subjectSeed[index] || {}),
      ...subject,
      documents: Array.isArray(subject.documents) ? subject.documents.map(normaliseDocument) : [],
      assessments: Array.isArray(subject.assessments) ? subject.assessments.map(normaliseAssessment) : [],
      watch: Array.isArray(subject.watch) ? subject.watch : [],
      askHistory: Array.isArray(subject.askHistory) ? subject.askHistory : [],
      practice: Array.isArray(subject.practice) ? subject.practice : structuredClone(subjectSeed[index]?.practice || [])
    }));
  } catch (error) {
    console.error("Failed to restore subjects.", error);
  }
}

function restoreStudent() {
  const savedStudent = window.localStorage.getItem(storageKey);
  if (!savedStudent) {
    return;
  }

  state.studentName = savedStudent;
  openDashboard();
}

function restoreSettings() {
  const raw = window.localStorage.getItem(settingsStorageKey);
  if (!raw) {
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
      subjectsBackground: parsed.subjectsBackground || ""
    };
  } catch (error) {
    console.error("Failed to restore settings.", error);
  }
}

function applyBackgrounds() {
  elements.homeView.style.backgroundImage = state.settings.homeBackground
    ? `url("${state.settings.homeBackground}")`
    : "";
  elements.subjectsView.style.backgroundImage = state.settings.subjectsBackground
    ? `url("${state.settings.subjectsBackground}")`
    : "";
}

function renderAiConnectionState() {
  if (elements.aiConnectionStatus) {
    elements.aiConnectionStatus.textContent =
      `AI answers and natural voice are provided by the backend service at ${API_BASE_URL}.`;
  }
}

function openDashboard() {
  elements.landingPanel.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  elements.welcomeHeading.textContent = `Welcome back, ${state.studentName}`;
  state.currentView = "home";
  render();
}

function showLanding() {
  stopListening();
  closeUpcomingModal();
  closeUploadModal();

  elements.appShell.classList.add("hidden");
  elements.taskView.classList.add("hidden");
  elements.landingPanel.classList.remove("hidden");
  state.selectedDocumentId = null;
  state.currentView = "home";
  elements.askResponse.textContent =
    "Ask a question about the selected subject or document.";
  elements.readerTitle.textContent = "Document reader";
  elements.readerContent.textContent = "Choose a document from the table to read it here.";
  resetUploadStatus();
}

function renderOverview() {
  const upcomingEntries = getUpcomingAssessmentEntries();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextEntry =
    getAssessmentEntries().find((entry) => entry.dueDateObject && entry.dueDateObject >= today) ||
    getAssessmentEntries().find((entry) => entry.dueDateObject);

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
  elements.appShell.classList.toggle("hidden", state.currentView === "task");
  elements.homeView.classList.toggle("hidden", state.currentView !== "home");
  elements.subjectsView.classList.toggle("hidden", state.currentView !== "subjects");
  elements.taskView.classList.toggle("hidden", state.currentView !== "task");
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
    <div class="subject-header__actions">
      <button type="button" class="ghost-button" id="subject-upload-button">Upload</button>
    </div>
    <div class="subject-header__title">
      <p class="eyebrow">Current subject</p>
      <h3>${escapeHtml(subject.name)}</h3>
    </div>
  `;
  document.getElementById("subject-upload-button")?.addEventListener("click", openUploadModal);
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

function getDocumentGroups(subject) {
  const grouped = new Map();
  getSortedDocuments(subject).forEach((documentRecord) => {
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

function renderReaderToolbar() {
  const selectedDocument = getSelectedDocument();
  const hasDocument = Boolean(selectedDocument);

  elements.readerReadButton.disabled = !hasDocument;
  elements.readerListenButton.disabled = !hasDocument;
  elements.readerAskButton.disabled = !hasDocument;
  elements.readerDeleteButton.disabled = !hasDocument;
  elements.readerListenButton.textContent =
    selectedDocument && state.listeningDocumentId === selectedDocument.id ? "Stop" : "Listen";
}

function renderDocuments() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  if (!subject.documents.length) {
    elements.documentsBody.innerHTML = `
      <tr>
        <td colspan="4">
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
  const groupedDocuments = getDocumentGroups(subject);

  if (!sortedDocuments.find((doc) => doc.id === state.selectedDocumentId)) {
    state.selectedDocumentId = sortedDocuments[0].id;
  }

  if (!sortedDocuments.find((doc) => doc.id === state.askDocumentId)) {
    state.askDocumentId = sortedDocuments[0].id;
  }

  const visibleGroups = state.documentsExpanded ? groupedDocuments : groupedDocuments.slice(0, 6);
  const rowsMarkup = visibleGroups
    .map((group) => {
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
            <tr class="${document.id === state.selectedDocumentId ? "is-selected" : ""}${state.selectedDocumentIds.includes(document.id) ? " is-bulk-selected" : ""}">
              ${
                index === 0
                  ? `<td rowspan="${visibleDocuments.length}">${dateCellMarkup}</td>`
                  : ""
              }
              <td><strong>${escapeHtml(document.title)}</strong></td>
              <td>${escapeHtml(document.type)}</td>
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
    })
    .join("");

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
      }
    });
  });

  const hasExtraDocuments = groupedDocuments.length > 6;
  elements.documentsToggleButton.classList.toggle("hidden", !hasExtraDocuments);
  if (hasExtraDocuments) {
    elements.documentsToggleButton.textContent = state.documentsExpanded ? "Show recent documents" : "Show all documents";
  }

  renderDocumentBulkActions(subject);
  renderReader();
}

function renderWatchList() {
  const subject = getSelectedSubject();
  if (!subject) {
    return;
  }

  const watchItems = Array.isArray(subject.watch) ? subject.watch : [];
  if (!watchItems.length) {
    elements.watchList.innerHTML = `<div class="empty-state">No WATCH items for this subject yet.</div>`;
    return;
  }

  elements.watchList.innerHTML = watchItems
    .map(
      (item) => `
        <article class="practice-item">
          <span class="activity-tag">Watch</span>
          <h4>${escapeHtml(item.title)}</h4>
          <p class="practice-copy">${escapeHtml(item.url)}</p>
          <div class="table-actions">
            <button type="button" class="table-action" data-watch-action="open" data-watch-id="${item.id}">Open</button>
            <button type="button" class="table-action table-action--danger" data-watch-action="delete" data-watch-id="${item.id}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");

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
        renderWatchList();
      }
    });
  });
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

  if (selectedDocument.flags?.homework) {
    elements.readerContent.innerHTML = `
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
    saveButton.addEventListener("click", () => {
      selectedDocument.content = editor.value;
      selectedDocument.workNotes = editor.value;
      persistSubjects();
      elements.uploadStatus.textContent = "Homework edits saved.";
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
    ${previewImageMarkup}
    <div class="reader-content__text">${escapeHtml(readableContent).replaceAll("\n", "<br />")}</div>
    ${openOriginalMarkup}
  `;
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
  persistSubjects();
  render();
}

function getAssessmentActionsMarkup(assessmentId, isCompleted) {
  return `
    <div class="assessment-actions">
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

function editAssessment(subjectId, assessmentId) {
  const subject = state.subjects.find((item) => item.id === subjectId);
  const assessment = subject?.assessments.find((item) => item.id === assessmentId);
  if (!subject || !assessment) {
    return;
  }

  const updatedTitle = window.prompt("Assessment name", assessment.componentTask || assessment.title);
  if (updatedTitle === null) {
    return;
  }

  const updatedTaskNumber = window.prompt("Task number", assessment.taskNumber || "");
  if (updatedTaskNumber === null) {
    return;
  }

  const updatedDistributionDate = window.prompt("Distribution date", assessment.distributionDate || "");
  if (updatedDistributionDate === null) {
    return;
  }

  const updatedDueDate = window.prompt("Assessment due date", assessment.dueDate || "");
  if (updatedDueDate === null) {
    return;
  }

  const updatedWeighting = window.prompt("Weighting", assessment.weighting || "");
  if (updatedWeighting === null) {
    return;
  }

  assessment.title = updatedTitle.trim() || assessment.title;
  assessment.componentTask = updatedTitle.trim() || assessment.componentTask || assessment.title;
  assessment.taskNumber = updatedTaskNumber.trim() || assessment.taskNumber;
  assessment.distributionDate = updatedDistributionDate.trim() || assessment.distributionDate;
  assessment.dueDate = updatedDueDate.trim() || assessment.dueDate;
  assessment.weighting = updatedWeighting.trim() || assessment.weighting;
  assessment.description = `${assessment.componentTask || assessment.title}.`;
  persistSubjects();
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

  const previewMarkup = documentRecord.previewImageUrl
    ? `<img src="${escapeHtml(documentRecord.previewImageUrl)}" alt="${escapeHtml(documentRecord.title)} preview" style="max-width:100%;height:auto;border:1px solid #d9d6d2;border-radius:18px;display:block;margin:0 0 20px;" />`
    : "";
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
    const linkedDocuments = subject.documents.filter((document) => assessment.linkedDocumentIds.includes(document.id));
    elements.taskViewTitle.textContent = assessment.componentTask || assessment.title;
    elements.taskSourceTitle.textContent = "Assessment document";
    elements.taskSourceContent.innerHTML = `
      <div class="assessment-grid">
        <div class="assessment-fact">
          <strong>Subject</strong>
          <span>${escapeHtml(subject.name)}</span>
        </div>
        <div class="assessment-fact">
          <strong>Task number</strong>
          <span>${escapeHtml(assessment.taskNumber || "Uploaded")}</span>
        </div>
        <div class="assessment-fact">
          <strong>Distribution</strong>
          <span>${escapeHtml(assessment.distributionDate || "TBC")}</span>
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
          <strong>Component / task</strong>
          <span>${escapeHtml(assessment.componentTask || assessment.title)}</span>
        </div>
      </div>
      <div class="reader-content__text" style="margin-top:18px;">${escapeHtml(assessment.description || `${assessment.componentTask || assessment.title}.`)}</div>
      <div class="reader-actions" style="margin-top:22px;display:flex;flex-wrap:wrap;gap:10px;">
        ${
          linkedDocuments.length
            ? linkedDocuments
                .map(
                  (document) => `
                    <button type="button" class="ghost-button" data-task-document-id="${document.id}">
                      ${escapeHtml(document.title)}
                    </button>
                  `
                )
                .join("")
            : '<span class="document-empty">No supporting documents linked yet.</span>'
        }
      </div>
    `;
    elements.taskSourceContent.querySelectorAll("[data-task-document-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const documentRecord = linkedDocuments.find((document) => document.id === button.dataset.taskDocumentId);
        if (documentRecord) {
          openDocumentPopup(documentRecord);
        }
      });
    });
    elements.taskWorkEditor.value = assessment.workNotes || "";
    return;
  }

  if (activeTask.kind === "homework") {
    const homeworkDocument = subject.documents.find((item) => item.id === activeTask.id);
    if (!homeworkDocument) {
      return;
    }
    elements.taskViewTitle.textContent = homeworkDocument.title;
    elements.taskSourceTitle.textContent = homeworkDocument.title;
    elements.taskSourceContent.innerHTML = `
      ${homeworkDocument.previewImageUrl ? `<img class="reader-preview-image" src="${escapeHtml(homeworkDocument.previewImageUrl)}" alt="${escapeHtml(homeworkDocument.title)} preview" />` : ""}
      <div class="reader-content__text">${escapeHtml(homeworkDocument.content || "").replaceAll("\n", "<br />")}</div>
    `;
    elements.taskWorkEditor.value = homeworkDocument.workNotes || "";
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
    const homeworkDocument = subject.documents.find((item) => item.id === activeTask.id);
    if (!homeworkDocument) {
      return;
    }
    homeworkDocument.workNotes = elements.taskWorkEditor.value;
  }

  persistSubjects();
  elements.taskWorkStatus.textContent = "Saved.";
}

function renderAssessments() {
  const selectedSubject = getSelectedSubject();
  if (!selectedSubject) {
    return;
  }

  elements.assessmentList.innerHTML = "";

  const selectedEntries = selectedSubject.assessments
    .filter((assessment) => !assessment.completed)
    .map((assessment) => ({
      subject: selectedSubject,
      assessment,
      dueDateObject: parseAssessmentDate(assessment.dueDate)
    }))
    .sort((left, right) => {
      const leftTime = left.dueDateObject ? left.dueDateObject.getTime() : Number.POSITIVE_INFINITY;
      const rightTime = right.dueDateObject ? right.dueDateObject.getTime() : Number.POSITIVE_INFINITY;
      return leftTime - rightTime;
    });

  if (!selectedEntries.length) {
    elements.assessmentList.innerHTML = `<div class="empty-state">No active assessments for ${escapeHtml(selectedSubject.name)}.</div>`;
    return;
  }

  selectedEntries.forEach(({ subject, assessment, dueDateObject }) => {
    const wrapper = document.createElement("article");
    wrapper.className = "assessment-item assessment-item--current";

    const linkedDocuments = subject.documents.filter((doc) =>
      assessment.linkedDocumentIds.includes(doc.id)
    );
    const dueLabel = formatAssessmentDueLabel(assessment.dueDate);
    const distributionText = assessment.distributionDate || "TBC";
    const weightingText = assessment.weighting || "TBC";

    wrapper.innerHTML = `
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
      <div class="assessment-links">
        ${
          linkedDocuments.length
            ? linkedDocuments.map((doc) => `<span class="document-chip">${escapeHtml(doc.title)}</span>`).join("")
            : '<span class="document-empty">No linked documents yet.</span>'
        }
      </div>
      ${getAssessmentActionsMarkup(assessment.id, assessment.completed)}
      <div class="attachment-grid"></div>
    `;

    const attachmentGrid = wrapper.querySelector(".attachment-grid");
    const actionsContainer = wrapper.querySelector(".assessment-actions");
    const openAssessmentButton = wrapper.querySelector("[data-open-assessment]");

    if (!subject.documents.length) {
      attachmentGrid.innerHTML = `
        <div class="empty-state">Upload documents to attach them to this assessment.</div>
      `;
    } else {
      subject.documents.forEach((doc) => {
        const option = document.createElement("label");
        option.className = "attachment-option";
        option.innerHTML = `
          <input type="checkbox" ${assessment.linkedDocumentIds.includes(doc.id) ? "checked" : ""} />
          <span>Attach ${escapeHtml(doc.title)}</span>
        `;

        option.querySelector("input").addEventListener("change", (event) => {
          const isChecked = event.target.checked;
          if (isChecked) {
            if (!assessment.linkedDocumentIds.includes(doc.id)) {
              assessment.linkedDocumentIds.push(doc.id);
            }
          } else {
            assessment.linkedDocumentIds = assessment.linkedDocumentIds.filter((id) => id !== doc.id);
          }

          persistSubjects();
          renderAssessments();
          renderUpcomingModal();
        });

        attachmentGrid.appendChild(option);
      });
    }

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
                  ${escapeHtml(assessment.distributionDate || "TBC")}
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
              <span>${escapeHtml(assessment.distributionDate || "TBC")}</span>
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

  const homeworkDocuments = subject.documents.filter((document) => document.flags?.homework);
  if (!homeworkDocuments.length) {
    elements.practiceList.innerHTML = `<div class="empty-state">No homework items for this subject yet.</div>`;
    return;
  }

  elements.practiceList.innerHTML = homeworkDocuments
    .map(
      (document) => `
        <article class="practice-item">
          <div class="activity-row">
            <span class="activity-tag">Homework</span>
          </div>
          <h4><button type="button" class="assessment-link-button" data-open-homework="${document.id}">${escapeHtml(document.title)}</button></h4>
          <p class="practice-copy">Open this homework item in the reader to edit notes or answers.</p>
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
    const records = createPdfPageRecords(file.name, flags, originalFile, pdfData.pages);
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
    for (const file of files) {
      const { records } = await readUploadedDocument(file, flags);
      const duplicateTitle = records.find((record) =>
        subject.documents.some((document) => document.title.toLowerCase() === record.title.toLowerCase())
      );
      if (duplicateTitle) {
        throw new Error(`"${duplicateTitle.title}" is already in ${subject.name}.`);
      }
      subject.documents.unshift(...records);
      if (flags.assessment) {
        subject.assessments.unshift(
          buildAssessmentFromUpload(file.name, formatDueDate(elements.uploadDueDate.value), records.map((record) => record.id))
        );
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
  const showWatchFields = elements.uploadWatch.checked;
  elements.uploadWatchUrlWrap.classList.toggle("upload-field--hidden", !showWatchFields);
  elements.uploadWatchTitleWrap.classList.toggle("upload-field--hidden", !showWatchFields);
  elements.uploadPanel.classList.toggle("hidden", showWatchFields);
  elements.pendingUpload.classList.toggle("hidden", showWatchFields);
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

function render() {
  applyBackgrounds();
  renderAiConnectionState();
  renderCurrentView();
  renderOverview();
  renderSubjectList();
  renderSubjectHeader();
  renderPendingUpload();
  renderDocuments();
  renderAskContext();
  renderAssessments();
  renderPractice();
  renderWatchList();
  if (state.currentView === "task") {
    renderTaskView();
  }
}

function handleDashboardOpen() {
  const studentName = elements.studentNameInput.value.trim();
  const studentEmail = elements.studentEmailInput.value.trim();
  const displayName = studentName || studentEmail || "Student";

  state.studentName = displayName;
  persistStudent(displayName);
  openDashboard();
}

elements.askButton.addEventListener("click", handleAsk);
elements.readerReadButton.addEventListener("click", () => {
  if (!getSelectedDocument()) {
    return;
  }
  renderReader();
  scrollReaderIntoView();
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
elements.readerDeleteButton.addEventListener("click", () => {
  const selectedDocument = getSelectedDocument();
  if (!selectedDocument) {
    return;
  }
  deleteDocument(selectedDocument.id);
});
elements.openDashboardButton.addEventListener("click", handleDashboardOpen);
elements.navHomeButton.addEventListener("click", () => {
  state.currentView = "home";
  render();
});
elements.navSubjectsButton.addEventListener("click", () => {
  state.currentView = "subjects";
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
elements.closeTaskViewButton.addEventListener("click", () => {
  state.currentView = "subjects";
  render();
});
elements.saveTaskWorkButton.addEventListener("click", saveTaskWorkspace);
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
elements.processUploadButton.addEventListener("click", handleProcessUpload);
elements.clearUploadButton.addEventListener("click", () => {
  clearPendingUpload();
  resetUploadStatus();
});
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
  clearStudent();
  state.studentName = "";
  showLanding();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.upcomingModalOpen) {
    closeUpcomingModal();
  }
  if (event.key === "Escape" && !elements.uploadModal.classList.contains("hidden")) {
    closeUploadModal();
  }
});

syncUploadOptions();
restoreSettings();
restoreSubjects();
restoreStudent();
render();
