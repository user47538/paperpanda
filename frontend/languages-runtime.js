import { LANGUAGE_CONTENT } from "./languages-content.js";
import { getCurriculumUnit } from "./languages-curriculum.js";

export const LANGUAGE_LEVELS = [
  { name: "A1", label: "Beginner" },
  { name: "A2", label: "Elementary" },
  { name: "B1", label: "Intermediate" },
  { name: "B2", label: "Upper intermediate" },
  { name: "C1", label: "Advanced" },
  { name: "C2", label: "Mastery" }
];

export const LANGUAGE_VOCABULARY_COUNTS = {
  fr: { A1: 496, A2: 1303, B1: 1713, B2: 2039, C1: 3259, C2: 398 },
  es: { A1: 454, A2: 1318, B1: 1725, B2: 2104, C1: 2601, C2: 292 }
};

export const LANGUAGE_CURRICULUM_UNITS_PER_LEVEL = 24;
export const LANGUAGE_CURRICULUM_MAX_LEVEL = 2;
export const LANGUAGE_LESSON_MASTERY = 0.85;
export const LANGUAGE_CURRICULUM_VERSION = 1;

const SECTIONS = [
  { id: "vocab", label: "Vocabulary", icon: "🧺", tone: "peach" },
  { id: "grammar", label: "Grammar", icon: "🧩", tone: "lilac" },
  { id: "verbs", label: "Verbs & conjugation", icon: "🔁", tone: "yellow" },
  { id: "speak", label: "Speaking", icon: "🎙", tone: "mint" },
  { id: "listen", label: "Listening", icon: "🎧", tone: "rose" },
  { id: "watch", label: "Watch Peppa", icon: "📺", tone: "sky" }
];

const PANDA_REWARDS = [
  ["happy", "/panda-emojis-2ndedition/panda-happy-256.png"],
  ["smart", "/panda-emojis-2ndedition/panda-smart-256.png"],
  ["cowboy", "/panda-emojis/panda-cowboy-256.png"],
  ["hearts", "/panda-emojis/panda-hearts-256.png"],
  ["paint", "/panda-emojis/panda-paint-256.png"],
  ["confused", "/panda-emojis/panda-confused-256.png"],
  ["crying", "/panda-emojis-2ndedition/panda-crying-256.png"],
  ["sick", "/panda-emojis-2ndedition/panda-sick-256.png"]
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalizeLanguageAnswer(value) {
  return String(value || "").trim().toLocaleLowerCase().replaceAll("’", "'").replace(/\s+/g, " ");
}

export function languageAnswerSimilarity(answer, model) {
  const cleanAnswer = normalizeLanguageAnswer(answer).replace(/[^a-zà-ÿñ' ]/g, "");
  const cleanModel = normalizeLanguageAnswer(model).replace(/[^a-zà-ÿñ' ]/g, "");
  if (!cleanAnswer || !cleanModel) return 0;
  if (cleanAnswer === cleanModel) return 1;
  const answerWords = new Set(cleanAnswer.split(" ").filter(Boolean));
  const modelWords = new Set(cleanModel.split(" ").filter(Boolean));
  const shared = [...modelWords].filter((word) => answerWords.has(word)).length;
  return shared / Math.max(1, modelWords.size);
}

export function resolveVocabularyAdvance({ wordIndex, targetCount, reviewMode, incorrectCount }) {
  if (wordIndex < Math.max(0, targetCount - 1)) {
    return { phase: "advance", wordIndex: wordIndex + 1 };
  }
  if (!reviewMode && incorrectCount > 0) {
    return { phase: "review", wordIndex: 0 };
  }
  return { phase: "complete", wordIndex };
}

function isPlausibleTargetLanguage(value, lang) {
  const words = normalizeLanguageAnswer(value).match(/[a-zà-ÿñ']+/g) || [];
  if (words.length < 3) return false;
  const markers = lang === "fr"
    ? ["je", "j'", "me", "m'", "appelle", "ai", "suis", "et", "le", "la", "un", "une", "tu", "que", "aime", "faire", "jouer", "au", "avec", "mes", "amis"]
    : ["me", "llamo", "tengo", "soy", "y", "el", "la", "un", "una", "qué", "que", "te", "gusta", "hacer", "mi", "jugar", "al", "con", "mis", "amigos"];
  const englishMarkers = new Set(["and", "my", "friends", "play", "with", "like", "name", "years", "old", "the", "to"]);
  const normalized = normalizeLanguageAnswer(value);
  const markerHits = markers.filter((marker) => words.includes(marker) || (marker.endsWith("'") && normalized.includes(marker))).length;
  const englishHits = words.filter((word) => englishMarkers.has(word)).length;
  return markerHits >= 2 && englishHits <= Math.max(1, Math.floor(words.length / 4));
}

function createDefaultSection(id) {
  return { level: 0, lessonsDone: 0, lessonsToNext: LANGUAGE_CURRICULUM_UNITS_PER_LEVEL };
}

function createDefaultVocabularyProgress() {
  return Object.fromEntries(LANGUAGE_LEVELS.map(({ name }) => [name, { introduced: [], mastered: [], review: [] }]));
}

function createDefaultProfile(lang = "fr") {
  const sections = Object.fromEntries(SECTION_IDS.map((id) => [id, createDefaultSection(id)]));
  sections.vocab.lessonsToNext = LANGUAGE_VOCABULARY_COUNTS[lang].A1;
  return {
    curriculumVersion: LANGUAGE_CURRICULUM_VERSION,
    placementDone: false,
    placementAt: "",
    sections,
    vocab: { thousandLearned: [], topics: [], review: [], source: "minddory", levelProgress: createDefaultVocabularyProgress() },
    verbsMastered: {},
    peppaWatched: [],
    completedLessons: {}
  };
}

export function createDefaultLanguagesState() {
  return {
    version: 4,
    active: "",
    profiles: { fr: createDefaultProfile("fr"), es: createDefaultProfile("es") },
    rewards: { pandas: [], streakDays: 0, lastActiveDate: "" }
  };
}

function levelBadge(levelIndex, dark = false) {
  const level = LANGUAGE_LEVELS[Math.max(0, Math.min(LANGUAGE_LEVELS.length - 1, Number(levelIndex || 0)))] || LANGUAGE_LEVELS[0];
  return `<span class="lang-level-badge${dark ? " lang-level-badge--dark" : ""}"><strong>${level.name}</strong><span>· ${level.label}</span></span>`;
}

function rewardStrip(languages) {
  const earned = new Set(languages.rewards?.pandas || []);
  return `<div class="lang-rewards"><span class="lang-streak">🔥 ${Number(languages.rewards?.streakDays || 0)}-day streak</span><span class="lang-pandas">${PANDA_REWARDS.map(([id, src]) => `<img src="${src}" alt="${escapeHtml(id)} panda" class="${earned.has(id) ? "is-earned" : "is-locked"}" />`).join("")}</span><span>${earned.size} of ${PANDA_REWARDS.length} pandas</span></div>`;
}

function localActivityDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isHigherLevel(levelIndex) {
  return Number(levelIndex || 0) >= 2;
}

function getPrimaryTextForScreen(ui, content) {
  if (ui.screen === "grammar") return content.grammar[Math.min(ui.grammarIndex, content.grammar.length - 1)]?.rule || "Grammar practice";
  if (ui.screen === "verbs") {
    const verb = content.verbs[ui.verbIndex] || content.verbs[0];
    const tense = verb?.tenses[ui.tenseIndex] || verb?.tenses[0];
    return [verb?.inf, tense?.name, ...(tense?.rows || []).map(([pronoun, form]) => `${pronoun} ${form}`)].filter(Boolean).join(". ");
  }
  if (ui.screen === "vocab") return ui.vocabTarget?.word || "Vocabulary practice";
  if (ui.screen === "speaking") return content.speaking.phrase;
  if (ui.screen === "listening") return content.listening.lines.map((line) => line[1]).join(" ");
  if (ui.screen === "peppa") return content.episodeQs[ui.peppaQuestion]?.q || content.episode.title;
  return `${content.name} language practice`;
}

export function createLanguagesRuntime({ root, apiGet, apiPost, loadVocabulary, playAiSpeech, stopAiSpeech, getStudentName, onExit, onStateChange }) {
  let languages = createDefaultLanguagesState();
  let recognition = null;
  const ui = {
    screen: "pick",
    status: "",
    busy: false,
    placementQueue: [],
    placementIndex: 0,
    placementAnswers: [],
    placementDraft: "",
    placementPicked: null,
    placementResultFresh: false,
    vocabWord: 0,
    vocabPicked: "",
    vocabChecked: false,
    vocabTyped: "",
    vocabTarget: null,
    vocabIncorrect: [],
    vocabSessionTargets: [],
    vocabReviewTargets: [],
    vocabReviewIncorrect: [],
    vocabReviewMode: false,
    vocabSessionComplete: false,
    vocabFirstPassCorrect: 0,
    vocabAnswerCorrect: null,
    vocabBank: [],
    vocabBankLevel: "",
    vocabLoading: false,
    vocabSaving: false,
    vocabSessionResults: {},
    vocabLevelledUp: false,
    grammarIndex: 0,
    grammarPicked: null,
    grammarStep: 0,
    grammarAnswers: {},
    grammarChecked: false,
    grammarComplete: false,
    grammarMistakes: [],
    verbIndex: 0,
    tenseIndex: 0,
    verbTapAnswers: {},
    verbWriteAnswers: {},
    verbChecked: false,
    verbStep: 0,
    verbComplete: false,
    speakingMode: "daily",
    speakingDraft: "",
    speakingTurns: [],
    speakingStep: 0,
    speakingComplete: false,
    speakingAttempts: 0,
    recording: false,
    listenTab: 0,
    listenActivity: 0,
    listenScript: false,
    listenAnswers: {},
    listenRevealed: {},
    peppaStage: "watch",
    peppaQuestion: 0,
    peppaAnswers: [],
    peppaPicked: null,
    peppaChecked: false,
    captionsOn: false,
    askOpen: false,
    askDraft: "",
    askRequested: false,
    askResult: null,
    listenRoleplayDone: false,
    listenComplete: false,
    listenScore: null,
    completedUnitBySection: {}
  };

  function activeLang() {
    return languages.active || "fr";
  }

  function content() {
    return LANGUAGE_CONTENT[activeLang()];
  }

  function profile() {
    return languages.profiles?.[activeLang()] || createDefaultProfile(activeLang());
  }

  function curriculumUnit(sectionId) {
    const progress = profile().sections[sectionId];
    const levelIndex = Math.min(LANGUAGE_CURRICULUM_MAX_LEVEL, Number(progress?.level || 0));
    const level = LANGUAGE_LEVELS[levelIndex]?.name || "A1";
    const unitIndex = Math.min(LANGUAGE_CURRICULUM_UNITS_PER_LEVEL - 1, Number(progress?.lessonsDone || 0));
    return getCurriculumUnit(activeLang(), level, unitIndex);
  }

  function curriculumLessonId(sectionId, unit = curriculumUnit(sectionId)) {
    return `${activeLang()}:${sectionId}:${unit.id}`;
  }

  function isPublishedProgrammeComplete(sectionId) {
    const progress = profile().sections[sectionId];
    return sectionId !== "vocab" && progress.level >= LANGUAGE_CURRICULUM_MAX_LEVEL && progress.lessonsDone >= LANGUAGE_CURRICULUM_UNITS_PER_LEVEL;
  }

  function resetTrackLesson(sectionId) {
    setStatus("");
    delete ui.completedUnitBySection[sectionId];
    if (sectionId === "grammar") Object.assign(ui, { grammarStep: 0, grammarAnswers: {}, grammarPicked: null, grammarChecked: false, grammarComplete: false, grammarMistakes: [] });
    if (sectionId === "verbs") Object.assign(ui, { verbStep: 0, verbTapAnswers: {}, verbWriteAnswers: {}, verbChecked: false, verbComplete: false });
    if (sectionId === "speak") Object.assign(ui, { speakingStep: 0, speakingDraft: "", speakingTurns: [], speakingComplete: false, speakingAttempts: 0 });
    if (sectionId === "listen") Object.assign(ui, { listenTab: 0, listenActivity: 0, listenScript: false, listenAnswers: {}, listenRevealed: {}, listenRoleplayDone: false, listenComplete: false, listenScore: null, speakingDraft: "" });
    if (sectionId === "watch") Object.assign(ui, { peppaStage: "watch", peppaQuestion: 0, peppaAnswers: [], peppaPicked: null, peppaChecked: false });
  }

  function mergeLanguages(next) {
    if (next && typeof next === "object") {
      languages = next;
      onStateChange?.(languages);
    }
  }

  function setStatus(message) {
    ui.status = String(message || "");
  }

  function buildPlacementQueue() {
    const questions = content().placement;
    ui.placementQueue = SECTION_IDS.flatMap((sectionId) => questions.filter((question) => question.section === sectionId));
    ui.placementIndex = 0;
    ui.placementAnswers = [];
    ui.placementDraft = "";
    ui.placementPicked = null;
  }

  function resetLessonUi() {
    ui.status = "";
    ui.vocabPicked = "";
    ui.vocabChecked = false;
    ui.grammarPicked = null;
    ui.verbTapAnswers = {};
    ui.verbWriteAnswers = {};
    ui.verbChecked = false;
    ui.askOpen = false;
    ui.askRequested = false;
    ui.askResult = null;
  }

  function resetLanguageTransientUi() {
    resetLessonUi();
    Object.assign(ui, {
      placementQueue: [],
      placementIndex: 0,
      placementAnswers: [],
      placementDraft: "",
      placementPicked: null,
      placementResultFresh: false,
      vocabWord: 0,
      vocabTyped: "",
      vocabTarget: null,
      vocabIncorrect: [],
      vocabSessionTargets: [],
      vocabReviewTargets: [],
      vocabReviewIncorrect: [],
      vocabReviewMode: false,
      vocabSessionComplete: false,
      vocabFirstPassCorrect: 0,
      vocabAnswerCorrect: null,
      vocabBank: [],
      vocabBankLevel: "",
      vocabLoading: false,
      vocabSaving: false,
      vocabSessionResults: {},
      vocabLevelledUp: false,
      grammarIndex: 0,
      grammarStep: 0,
      grammarAnswers: {},
      grammarChecked: false,
      grammarComplete: false,
      grammarMistakes: [],
      verbIndex: 0,
      tenseIndex: 0,
      verbStep: 0,
      verbComplete: false,
      speakingMode: "daily",
      speakingDraft: "",
      speakingTurns: [],
      speakingStep: 0,
      speakingComplete: false,
      speakingAttempts: 0,
      listenTab: 0,
      listenActivity: 0,
      listenScript: false,
      listenAnswers: {},
      listenRevealed: {},
      listenRoleplayDone: false,
      listenComplete: false,
      listenScore: null,
      completedUnitBySection: {},
      peppaStage: "watch",
      peppaQuestion: 0,
      peppaAnswers: [],
      peppaPicked: null,
      peppaChecked: false,
      captionsOn: false,
      askDraft: ""
    });
  }

  function chooseStartScreen() {
    if (!languages.active) return "pick";
    return profile().placementDone ? "home" : "placement";
  }

  async function load() {
    try {
      const payload = await apiGet("/api/languages");
      mergeLanguages(payload?.languages);
    } catch (error) {
      setStatus("Language progress could not be refreshed. Your current session can still continue.");
    }
    ui.screen = chooseStartScreen();
    if (ui.screen === "placement") buildPlacementQueue();
    render();
  }

  function setData(next) {
    mergeLanguages(next || createDefaultLanguagesState());
  }

  async function chooseLanguage(lang, { begin = false } = {}) {
    if (!LANGUAGE_CONTENT[lang] || ui.busy) return;
    stopAiSpeech?.();
    ui.busy = true;
    languages.active = lang;
    render();
    try {
      const payload = await apiPost("/api/languages/active", { lang });
      mergeLanguages(payload?.languages);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The language choice could not be saved.");
    } finally {
      ui.busy = false;
    }
    resetLanguageTransientUi();
    ui.screen = languages.profiles?.[lang]?.placementDone ? "home" : begin ? "placement" : "pick";
    if (ui.screen === "placement") buildPlacementQueue();
    render();
  }

  async function resetLevels() {
    if (ui.busy) return;
    const confirmed = window.confirm("Reset French and Spanish levels and retake the starting quiz? Unit completions and vocabulary mastery will restart. Language rewards, streak and chosen topics will stay saved.");
    if (!confirmed) return;
    stopAiSpeech?.();
    ui.busy = true;
    setStatus("Resetting language levels…");
    render();
    try {
      const payload = await apiPost("/api/languages/reset-levels", {});
      mergeLanguages(payload?.languages);
      resetLanguageTransientUi();
      ui.screen = chooseStartScreen();
      if (ui.screen === "placement") buildPlacementQueue();
      setStatus("Your language levels are reset. Start the level check when you are ready.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Language levels could not be reset.");
    } finally {
      ui.busy = false;
      render();
    }
  }

  async function speak(text, rate = 0.9) {
    const cleanText = String(text || "").trim();
    if (!cleanText) return;
    if (typeof playAiSpeech !== "function") {
      setStatus("The AI voice service is not configured.");
      render();
      return;
    }
    setStatus("Panda is preparing the AI voice…");
    render();
    try {
      await playAiSpeech({
        text: cleanText,
        language: activeLang() === "fr" ? "french" : "spanish",
        pace: rate < 0.85 ? "slow" : "normal"
      });
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The AI voice could not play just now.");
    }
    render();
  }

  function startRecognition(onText) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus("Voice input is not available in this browser. You can type your answer instead.");
      render();
      return;
    }
    recognition?.abort?.();
    recognition = new Recognition();
    recognition.lang = content().locale;
    recognition.interimResults = false;
    recognition.continuous = false;
    ui.recording = true;
    setStatus("Listening…");
    recognition.onresult = (event) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || "").trim();
      if (transcript) onText(transcript);
    };
    recognition.onerror = () => setStatus("I could not hear that clearly. Try again or type your answer.");
    recognition.onend = () => {
      ui.recording = false;
      render();
    };
    recognition.start();
    render();
  }

  async function postProgress(section, lessonId, extra = {}) {
    try {
      const payload = await apiPost("/api/languages/progress", {
        lang: activeLang(), section, lessonId, activityDate: localActivityDate(), ...extra
      });
      mergeLanguages(payload?.languages);
      if (payload?.levelledUp) setStatus(`Level up! ${LANGUAGE_LEVELS[profile().sections[section].level].name} is now open.`);
      else if (payload?.pandaAwarded) setStatus("A new panda joined your reward collection!");
      else if (payload?.masteryMet === false) setStatus("This attempt is saved for review. Reach 85% to complete the unit.");
      else setStatus("Progress saved.");
      return payload;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Progress could not be saved.");
      return null;
    }
  }

  function renderTopbar(backLabel = "") {
    return `<header class="lang-topbar"><div class="lang-brand"><img src="/paperpanda-logo.svg" alt="" /><strong>PaperPanda</strong></div>${backLabel ? `<button type="button" class="lang-back" data-lang-action="home">← ${escapeHtml(backLabel)}</button>` : `<button type="button" class="lang-back" data-lang-action="exit">← Subjects</button>`}<div class="lang-switch" role="group" aria-label="Choose a language">${Object.values(LANGUAGE_CONTENT).map((item) => `<button type="button" data-lang-switch="${item.id}" class="${activeLang() === item.id ? "is-active" : ""}">${item.flag} ${item.name}</button>`).join("")}</div><span class="lang-avatar">${escapeHtml((getStudentName?.() || "M").slice(0, 1).toUpperCase())}</span></header>`;
  }

  function renderDock(listenLabel = "Listen", listenText = "") {
    return `<div class="lang-dock"><div class="lang-dock__bar"><button type="button" class="lang-btn lang-btn--coral" data-lang-speak="${escapeHtml(listenText)}">▶ ${escapeHtml(listenLabel)}</button><button type="button" class="lang-btn lang-btn--ghost-dark" data-lang-action="ask-toggle">🎙 Ask Panda</button></div>${ui.askOpen ? `<form class="lang-ask" data-lang-ask-form><input name="question" value="${escapeHtml(ui.askDraft)}" placeholder="Ask Panda about this lesson…" /><button class="lang-btn" type="submit">Ask</button></form>` : ""}${ui.askResult ? `<div class="lang-ask-result"><strong>Panda</strong><span>${escapeHtml(ui.askResult.reply)}</span>${ui.askResult.gloss ? `<small>${escapeHtml(ui.askResult.gloss)}</small>` : ""}</div>` : ""}</div>`;
  }

  function renderProgrammeComplete(sectionLabel) {
    return `<div class="lang-shell">${renderTopbar(sectionLabel)}<main class="lang-center"><section class="lang-card lang-session-complete"><span class="lang-vocab-hero">🏆</span><p class="eyebrow">A1–B1 programme complete</p><h1>You completed all 72 ${escapeHtml(sectionLabel.toLowerCase())} units.</h1><p>Your B1 practice remains available for revision. The B2–C2 curriculum will open when those full programmes are published.</p><div class="lang-row"><button type="button" class="lang-btn lang-btn--primary" data-lang-action="home">Language home →</button></div></section></main></div>`;
  }

  function renderPick() {
    root.innerHTML = `<div class="lang-shell">${renderTopbar()}<main class="lang-center"><div class="lang-intro"><p class="eyebrow">New subject · Languages</p><h1>Which language are you learning?</h1><p>You can switch or add the other one later.</p><div class="lang-pick-grid">${Object.values(LANGUAGE_CONTENT).map((item) => `<button type="button" class="lang-pick-card ${languages.active === item.id ? "is-selected" : ""}" data-lang-pick="${item.id}"><span>${item.flag}</span><strong>${item.name}</strong><small>${item.native} · “${item.hello}”</small></button>`).join("")}</div><button type="button" class="lang-btn lang-btn--primary" data-lang-action="begin" ${languages.active ? "" : "disabled"}>Start the level check →</button><p class="lang-note">About 12–15 minutes · 36 questions across all six skills. It is not a test you can fail — it tells Panda where each course should start.</p></div></main></div>`;
  }

  function renderPlacementQuestion(question) {
    if (question.kind === "vocab") {
      return `<div class="lang-picture-options">${question.options.map(([emoji, gloss], index) => `<button type="button" data-placement-option="${index}" class="${ui.placementPicked === index ? "is-selected" : ""}"><span>${emoji}</span><small>${escapeHtml(gloss)}</small></button>`).join("")}</div>`;
    }
    if (["listen", "grammar", "verbs", "read"].includes(question.kind)) {
      return `${question.audio ? `<button type="button" class="lang-hear" data-lang-speak="${escapeHtml(question.audio)}">▶ Hear it</button>` : ""}${question.passage ? `<div class="lang-reading-passage">${escapeHtml(question.passage)}</div><p>${escapeHtml(question.question)}</p>` : ""}<div class="lang-choice-grid">${question.options.map((option, index) => `<button type="button" data-placement-option="${index}" class="${ui.placementPicked === index ? "is-selected" : ""}">${escapeHtml(Array.isArray(option) ? option[1] : option)}</button>`).join("")}</div>`;
    }
    return `<div class="lang-speaking-prompt"><strong>${escapeHtml(question.phrase)}</strong><span>${escapeHtml(question.meaning)}</span><button type="button" class="lang-mic ${ui.recording ? "is-recording" : ""}" data-lang-action="placement-mic">🎙</button><div class="lang-wave ${ui.recording ? "is-on" : ""}">${"<i></i>".repeat(18)}</div><input class="lang-input" data-placement-draft value="${escapeHtml(ui.placementDraft)}" placeholder="Or type what you said" /></div>`;
  }

  function renderPlacement() {
    if (!ui.placementQueue.length) buildPlacementQueue();
    const question = ui.placementQueue[ui.placementIndex];
    const sectionQuestions = ui.placementQueue.filter((candidate) => candidate.section === question.section);
    const sectionPosition = sectionQuestions.findIndex((candidate) => candidate.id === question.id) + 1;
    const sectionLabel = SECTIONS.find((section) => section.id === question.section)?.label || question.section;
    const levelLabel = LANGUAGE_LEVELS[question.level]?.name || "A1";
    const progress = Math.round(((ui.placementIndex + 1) / Math.max(1, ui.placementQueue.length)) * 100);
    root.innerHTML = `<div class="lang-shell">${renderTopbar()}<main class="lang-center"><section class="lang-placement"><div class="lang-placement__meta"><span>Level check · ${content().name}</span><strong>${ui.placementIndex + 1} of ${ui.placementQueue.length}</strong></div><div class="lang-segmented-progress"><span style="width:${progress}%"></span></div><div class="lang-placement__skill"><p class="lang-section-kicker">${escapeHtml(sectionLabel)} · ${escapeHtml(levelLabel)}</p><span>Question ${sectionPosition} of ${sectionQuestions.length} in this skill</span></div><h2>${escapeHtml(question.prompt)}</h2>${renderPlacementQuestion(question)}<div class="lang-placement__actions"><button type="button" class="lang-btn lang-btn--secondary" data-lang-action="placement-back" ${ui.placementIndex === 0 ? "disabled" : ""}>← Back</button><button type="button" class="lang-link" data-lang-action="placement-skip">I don’t know yet — skip</button><button type="button" class="lang-btn lang-btn--primary" data-lang-action="placement-next">${ui.placementIndex === ui.placementQueue.length - 1 ? "See my levels →" : "Next →"}</button></div></section></main>${renderDock("Read question", question.prompt)}</div>`;
  }

  function backPlacement() {
    if (ui.placementIndex <= 0) return;
    const previous = ui.placementAnswers.pop();
    ui.placementIndex -= 1;
    const question = ui.placementQueue[ui.placementIndex];
    ui.placementDraft = question.kind === "speak" ? String(previous?.response || "") : "";
    ui.placementPicked = question.kind === "speak" || previous?.skipped ? null : Number(previous?.selection);
    setStatus("");
    render();
  }

  async function advancePlacement(skipped = false) {
    const question = ui.placementQueue[ui.placementIndex];
    const value = question.kind === "speak" ? ui.placementDraft : ui.placementPicked;
    if (!skipped && (value === null || value === "")) {
      setStatus("Choose, say or type an answer before continuing.");
      render();
      return;
    }
    const correct = skipped ? false : question.kind === "speak"
      ? isPlausibleTargetLanguage(value, activeLang())
      : Number(value) === Number(question.answer);
    ui.placementAnswers.push({ id: question.id, section: question.section, level: question.level, skipped, correct, selection: question.kind === "speak" ? null : value, response: question.kind === "speak" ? String(value || "") : "" });
    if (ui.placementIndex < ui.placementQueue.length - 1) {
      ui.placementIndex += 1;
      ui.placementPicked = null;
      ui.placementDraft = "";
      setStatus("");
      render();
      return;
    }
    ui.busy = true;
    render();
    try {
      const payload = await apiPost("/api/languages/placement", { lang: activeLang(), answers: ui.placementAnswers });
      mergeLanguages(payload?.languages);
      ui.placementResultFresh = true;
      ui.screen = "result";
      setStatus(payload?.pandaAwarded ? "You earned your first panda!" : "Your levels are ready.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Placement could not be saved.");
    } finally {
      ui.busy = false;
      render();
    }
  }

  function renderResult() {
    root.innerHTML = `<div class="lang-shell">${renderTopbar()}<main class="lang-center lang-center--wide"><section class="lang-result"><p class="eyebrow">Level check done</p><h1>Nice work, ${escapeHtml(getStudentName?.() || "learner")}! Here’s where you’ll start.</h1><p>Each section has its own level, so you can be ahead in one and still learning in another.</p><div class="lang-result-grid">${SECTIONS.map((section) => { const progress = profile().sections[section.id]; return `<article class="lang-result-card lang-tone--${section.tone}"><span>${section.icon}</span><strong>${section.label}</strong>${levelBadge(progress.level)}<div class="lang-level-steps">${LANGUAGE_LEVELS.map((_, index) => `<i class="${index <= progress.level ? "is-on" : ""}"></i>`).join("")}</div></article>`; }).join("")}</div><div class="lang-result__footer"><button type="button" class="lang-btn lang-btn--primary" data-lang-action="home">Start learning →</button><span>🐼 ${escapeHtml(ui.status || "Your first reward is ready")}</span></div></section></main></div>`;
  }

  function renderHome() {
    const firstName = (getStudentName?.() || "learner").split(/\s+/)[0];
    root.innerHTML = `<div class="lang-shell">${renderTopbar()}<main class="lang-home"><header class="lang-home__header"><div><p class="eyebrow">${content().flag} ${content().name}</p><h1>${content().hello} ${escapeHtml(firstName)}!</h1><p>Pick a section. Each one moves up at its own pace.</p></div>${rewardStrip(languages)}</header><button type="button" class="lang-resume" data-lang-open="watch"><span>📺</span><span><small>Pick up where you left off</small><strong>Peppa · ${escapeHtml(content().episode.title)}</strong></span><b>→</b></button><section class="lang-section-grid">${SECTIONS.map((section) => {
      const progress = profile().sections[section.id];
      const next = LANGUAGE_LEVELS[Math.min(LANGUAGE_CURRICULUM_MAX_LEVEL, progress.level + 1)].name;
      const levelName = LANGUAGE_LEVELS[progress.level].name;
      const vocabularyProgress = profile().vocab.levelProgress?.[levelName];
      const detail = section.id === "vocab"
        ? `${vocabularyProgress?.mastered?.length || 0}/${LANGUAGE_VOCABULARY_COUNTS[activeLang()][levelName]} words mastered`
        : isPublishedProgrammeComplete(section.id) ? "B1 programme complete" : `${progress.lessonsDone}/${progress.lessonsToNext} units to ${progress.level >= LANGUAGE_CURRICULUM_MAX_LEVEL ? "complete B1" : next}`;
      const percent = section.id === "vocab"
        ? Math.round(((vocabularyProgress?.mastered?.length || 0) / LANGUAGE_VOCABULARY_COUNTS[activeLang()][levelName]) * 100)
        : Math.round((progress.lessonsDone / progress.lessonsToNext) * 100);
      return `<button type="button" class="lang-section-card lang-tone--${section.tone}" data-lang-open="${section.id}"><span class="lang-section-card__icon">${section.icon}</span><strong>${section.label}</strong>${levelBadge(progress.level)}<small>${detail}</small><i><b style="width:${percent}%"></b></i></button>`;
    }).join("")}</section><section class="lang-reset-levels"><div><strong>Need a fresh starting point?</strong><span>Reset both language pathways and retake the level check. Rewards, streak and chosen topics stay saved.</span></div><button type="button" class="lang-btn lang-btn--secondary" data-lang-action="reset-levels">Reset levels and retake quiz</button></section></main></div>`;
  }

  function vocabTargetKey(target) {
    return String(target?.index ?? "");
  }

  function currentVocabularyLevelName() {
    return LANGUAGE_LEVELS[profile().sections.vocab.level]?.name || "A1";
  }

  function getVocabularyProgress(level = currentVocabularyLevelName()) {
    return profile().vocab.levelProgress?.[level] || { introduced: [], mastered: [], review: [] };
  }

  function makeVocabularyTarget(index) {
    const entry = ui.vocabBank[index];
    return entry ? { index, word: entry[0], example: entry[1] || "", mode: "curriculum" } : null;
  }

  function selectVocabularySessionTargets() {
    const progress = getVocabularyProgress(ui.vocabBankLevel);
    const introduced = new Set(progress.introduced || []);
    const mastered = new Set(progress.mastered || []);
    const selected = [];
    const add = (index) => {
      if (Number.isInteger(index) && ui.vocabBank[index] && !selected.includes(index) && selected.length < 10) selected.push(index);
    };
    (progress.review || []).slice(0, 3).forEach(add);
    ui.vocabBank.forEach((_, index) => { if (!introduced.has(index)) add(index); });
    (progress.review || []).forEach(add);
    (progress.introduced || []).forEach((index) => { if (!mastered.has(index)) add(index); });
    const practiceOffset = (progress.introduced?.length || 0) % Math.max(1, ui.vocabBank.length);
    for (let step = 0; step < ui.vocabBank.length && selected.length < 10; step += 1) add((practiceOffset + step) % ui.vocabBank.length);
    return selected.map(makeVocabularyTarget).filter(Boolean);
  }

  async function ensureVocabularyBank({ restart = false } = {}) {
    const level = currentVocabularyLevelName();
    if (!restart && ui.vocabBankLevel === level && ui.vocabBank.length) return;
    if (typeof loadVocabulary !== "function") {
      setStatus("The vocabulary curriculum could not be loaded.");
      return;
    }
    ui.vocabLoading = true;
    ui.vocabBank = [];
    ui.vocabBankLevel = level;
    render();
    try {
      const payload = await loadVocabulary(activeLang(), level);
      const expectedCount = LANGUAGE_VOCABULARY_COUNTS[activeLang()][level];
      if (!Array.isArray(payload?.entries) || payload.entries.length !== expectedCount) {
        throw new Error(`Expected ${expectedCount} ${level} words but received ${payload?.entries?.length || 0}.`);
      }
      ui.vocabBank = payload.entries;
      startVocabSession();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The vocabulary curriculum could not be loaded.");
    } finally {
      ui.vocabLoading = false;
      render();
    }
  }

  function getVocabSessionTargets() {
    return ui.vocabReviewMode ? ui.vocabReviewTargets : ui.vocabSessionTargets;
  }

  function getVocabTarget() {
    const targets = getVocabSessionTargets();
    return targets[ui.vocabWord] || targets[0] || null;
  }

  function resetVocabAnswer() {
    ui.vocabPicked = "";
    ui.vocabTyped = "";
    ui.vocabChecked = false;
    ui.vocabAnswerCorrect = null;
  }

  function startVocabSession() {
    ui.vocabWord = 0;
    ui.vocabIncorrect = [];
    ui.vocabSessionTargets = selectVocabularySessionTargets();
    ui.vocabReviewTargets = [];
    ui.vocabReviewIncorrect = [];
    ui.vocabReviewMode = false;
    ui.vocabSessionComplete = false;
    ui.vocabFirstPassCorrect = 0;
    ui.vocabSessionResults = {};
    ui.vocabLevelledUp = false;
    resetVocabAnswer();
    setStatus("");
  }

  function rememberIncorrectVocab(target) {
    if (!target) return;
    const list = ui.vocabReviewMode ? ui.vocabReviewIncorrect : ui.vocabIncorrect;
    const key = vocabTargetKey(target);
    if (!list.some((item) => vocabTargetKey(item) === key)) list.push(target);
  }

  function recordVocabularyAnswer(correct) {
    if (!ui.vocabTarget) return;
    if (!ui.vocabReviewMode) {
      ui.vocabSessionResults[ui.vocabTarget.index] = Boolean(correct);
      if (correct) ui.vocabFirstPassCorrect += 1;
      else rememberIncorrectVocab(ui.vocabTarget);
      return;
    }
    if (!correct) rememberIncorrectVocab(ui.vocabTarget);
  }

  function advanceVocabSession() {
    const targets = getVocabSessionTargets();
    if (!ui.vocabChecked) {
      rememberIncorrectVocab(ui.vocabTarget);
      if (!ui.vocabReviewMode && ui.vocabTarget) ui.vocabSessionResults[ui.vocabTarget.index] = false;
    }
    const next = resolveVocabularyAdvance({
      wordIndex: ui.vocabWord,
      targetCount: targets.length,
      reviewMode: ui.vocabReviewMode,
      incorrectCount: ui.vocabIncorrect.length
    });
    if (next.phase === "advance") {
      ui.vocabWord = next.wordIndex;
      resetVocabAnswer();
      setStatus("");
      return;
    }
    if (next.phase === "review") {
      ui.vocabReviewTargets = [...ui.vocabIncorrect];
      ui.vocabReviewIncorrect = [];
      ui.vocabReviewMode = true;
      ui.vocabWord = next.wordIndex;
      resetVocabAnswer();
      setStatus(`Review time: ${ui.vocabReviewTargets.length} word${ui.vocabReviewTargets.length === 1 ? "" : "s"} to try again.`);
      return;
    }
    ui.vocabSessionComplete = true;
    setStatus("");
  }

  async function saveVocabularySession() {
    if (ui.vocabSaving || !Object.keys(ui.vocabSessionResults).length) return;
    ui.vocabSaving = true;
    render();
    try {
      const payload = await apiPost("/api/languages/vocab/session", {
        lang: activeLang(),
        level: ui.vocabBankLevel,
        activityDate: localActivityDate(),
        results: Object.entries(ui.vocabSessionResults).map(([index, correct]) => ({ index: Number(index), correct }))
      });
      mergeLanguages(payload?.languages);
      ui.vocabLevelledUp = Boolean(payload?.levelledUp);
      if (payload?.pandaAwarded) setStatus("A new panda joined your reward collection!");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Vocabulary progress could not be saved.");
    } finally {
      ui.vocabSaving = false;
      render();
    }
  }

  function vocabularyCloze(target) {
    const example = String(target?.example || "");
    const word = String(target?.word || "");
    const index = example.toLocaleLowerCase().indexOf(word.toLocaleLowerCase());
    return index >= 0 ? `${example.slice(0, index)}_____ ${example.slice(index + word.length)}`.replace(/_____\s+([,.!?;:])/g, "_____$1") : "";
  }

  function vocabularyOptions(target) {
    const indices = [target.index];
    const offsets = [17, 43, 89, 131, 211];
    offsets.forEach((offset) => {
      const index = (target.index + offset) % ui.vocabBank.length;
      if (!indices.includes(index) && ui.vocabBank[index]?.[0] !== target.word && indices.length < 4) indices.push(index);
    });
    const answerPosition = ui.vocabWord % indices.length;
    const answerIndex = indices.shift();
    indices.splice(answerPosition, 0, answerIndex);
    return indices.map((index) => ui.vocabBank[index][0]);
  }

  function renderVocab() {
    const currentProfile = profile();
    const higher = isHigherLevel(LANGUAGE_LEVELS.findIndex(({ name }) => name === ui.vocabBankLevel));
    if (ui.vocabLoading) {
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Vocabulary")}<main class="lang-center"><section class="lang-card"><p class="eyebrow">${escapeHtml(ui.vocabBankLevel)} vocabulary</p><h1>Loading your word bank…</h1><p>Preparing the next ten words.</p></section></main></div>`;
      return;
    }
    const baseTargets = ui.vocabSessionTargets;
    if (ui.vocabSessionComplete) {
      const reviewed = ui.vocabReviewTargets.length;
      const remaining = ui.vocabReviewIncorrect.length;
      const savedProgress = getVocabularyProgress(ui.vocabBankLevel);
      const total = LANGUAGE_VOCABULARY_COUNTS[activeLang()][ui.vocabBankLevel];
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Vocabulary")}<main class="lang-center"><section class="lang-card lang-vocab-complete"><span class="lang-vocab-hero">${remaining ? "📝" : "🎉"}</span><p class="eyebrow">${ui.vocabBankLevel} session complete</p><h1>${ui.vocabFirstPassCorrect}/${baseTargets.length} correct first time</h1><p>${ui.vocabSaving ? "Saving your mastery progress…" : ui.vocabLevelledUp ? `Excellent — ${currentVocabularyLevelName()} vocabulary is now unlocked.` : `${savedProgress.mastered.length}/${total} ${ui.vocabBankLevel} words mastered.`}</p><p>${reviewed ? `You reviewed ${reviewed} missed word${reviewed === 1 ? "" : "s"}.` : "You completed every word in this set."}${remaining ? ` ${remaining} will return in a later session.` : reviewed ? " Great recovery." : " Great work."}</p><div class="lang-row"><button type="button" class="lang-btn lang-btn--secondary" data-lang-action="home" ${ui.vocabSaving ? "disabled" : ""}>Language home</button><button type="button" class="lang-btn lang-btn--primary" data-lang-action="vocab-restart" ${ui.vocabSaving ? "disabled" : ""}>Start another session</button></div></section></main></div>`;
      return;
    }
    const target = getVocabTarget();
    if (!target) {
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Vocabulary")}<main class="lang-center"><section class="lang-card"><h1>Vocabulary is unavailable</h1><p>${escapeHtml(ui.status || "This level’s word bank could not be loaded.")}</p><button type="button" class="lang-btn" data-lang-action="vocab-reload">Try again</button></section></main></div>`;
      return;
    }
    ui.vocabTarget = target;
    const sessionTargets = getVocabSessionTargets();
    const nextLabel = ui.vocabWord < sessionTargets.length - 1 ? "Next word →" : !ui.vocabReviewMode && ui.vocabIncorrect.length ? "Review missed words →" : "Finish session →";
    const sessionLabel = ui.vocabReviewMode ? `Review ${ui.vocabWord + 1} of ${sessionTargets.length}` : `Word ${ui.vocabWord + 1} of ${sessionTargets.length}`;
    const levelProgress = getVocabularyProgress(ui.vocabBankLevel);
    const total = LANGUAGE_VOCABULARY_COUNTS[activeLang()][ui.vocabBankLevel];
    const accuracy = Math.round((levelProgress.mastered.length / total) * 100);
    const cloze = vocabularyCloze(target);
    const prompt = cloze ? `<p class="lang-vocab-context">${escapeHtml(cloze)}</p>` : `<button type="button" class="lang-hear" data-lang-speak="${escapeHtml(target.word)}">▶ Play the word</button>`;
    const rail = `<aside class="lang-lesson-rail"><p class="eyebrow">${ui.vocabBankLevel} word bank</p><strong class="lang-big-number">${levelProgress.mastered.length}</strong><small>of ${total} mastered · ${accuracy}%</small><p><strong>${levelProgress.introduced.length}</strong> introduced</p><p><strong>${levelProgress.review.length}</strong> due for review</p><small>Promotion requires every word introduced and over 95% mastered.</small><a href="https://minddory.com/${activeLang() === "fr" ? "french" : "spanish"}-vocabulary-list/${ui.vocabBankLevel.toLowerCase()}" target="_blank" rel="noreferrer">Source: MindDory ↗</a></aside>`;
    const exercise = higher
      ? `<div class="lang-vocab-prompt"><p class="eyebrow">${sessionLabel}</p><h2>${cloze ? "Type the missing word or phrase" : "Type the word you hear"}</h2>${prompt}<input class="lang-input" data-vocab-typed value="${escapeHtml(ui.vocabTyped)}" placeholder="Type in ${content().native}" ${ui.vocabChecked ? "disabled" : ""} /><button type="button" class="lang-mic ${ui.recording ? "is-recording" : ""}" data-lang-action="vocab-mic" ${ui.vocabChecked ? "disabled" : ""}>🎙</button><div class="lang-row"><button type="button" class="lang-link" data-lang-action="vocab-show" ${ui.vocabChecked ? "disabled" : ""}>I don’t know — mark for review</button><button type="button" class="lang-btn" data-lang-action="vocab-check" ${ui.vocabChecked ? "disabled" : ""}>Check</button></div>${ui.vocabChecked ? `<div class="lang-feedback ${ui.vocabAnswerCorrect ? "is-correct" : "is-wrong"}"><strong>${ui.vocabAnswerCorrect ? "Correct" : "Not quite"} · ${escapeHtml(target.word)}</strong>${target.example ? `<small>${escapeHtml(target.example)}</small>` : ""}</div>` : ""}<button type="button" class="lang-btn lang-btn--primary" data-lang-action="vocab-next" ${ui.vocabChecked ? "" : "disabled"}>${nextLabel}</button></div>`
      : `<div class="lang-vocab-prompt"><p class="eyebrow">${sessionLabel}</p><h2>${cloze ? "Choose the missing word or phrase" : "Listen and choose the word"}</h2>${prompt}<div class="lang-choice-grid">${vocabularyOptions(target).map((word) => `<button type="button" data-vocab-answer="${escapeHtml(word)}" class="${ui.vocabPicked === word ? (word === target.word ? "is-correct" : "is-wrong") : ""}" ${ui.vocabChecked ? "disabled" : ""}>${escapeHtml(word)}</button>`).join("")}</div>${ui.vocabChecked ? `<div class="lang-feedback ${ui.vocabAnswerCorrect ? "is-correct" : "is-wrong"}"><strong>${ui.vocabAnswerCorrect ? "Correct" : `Not quite · the answer is ${escapeHtml(target.word)}`}</strong>${target.example ? `<small>${escapeHtml(target.example)}</small>` : ""}</div>` : `<button type="button" class="lang-link" data-lang-action="vocab-show">I don’t know — mark for review</button>`}<button type="button" class="lang-btn lang-btn--primary" data-lang-action="vocab-next" ${ui.vocabChecked ? "" : "disabled"}>${nextLabel}</button></div>`;
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Vocabulary")}<main class="lang-lesson"><div class="lang-lesson__heading">${levelBadge(currentProfile.sections.vocab.level)}<h1>Vocabulary</h1></div><div class="lang-split">${rail}<section class="lang-card">${exercise}</section></div></main>${renderDock("Hear the word", target.word)}</div>`;
  }

  function renderGrammar() {
    if (isPublishedProgrammeComplete("grammar") && !ui.grammarComplete) {
      root.innerHTML = renderProgrammeComplete("Grammar");
      return;
    }
    const progress = profile().sections.grammar;
    const unit = ui.grammarComplete ? ui.completedUnitBySection.grammar || curriculumUnit("grammar") : curriculumUnit("grammar");
    const lesson = unit.grammar;
    const labels = ["Learn", "Notice", "Practise", "Review"];
    if (ui.grammarComplete) {
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Grammar")}<main class="lang-center"><section class="lang-card lang-session-complete"><span class="lang-vocab-hero">🎉</span><p class="eyebrow">${unit.level} unit ${unit.number} complete</p><h1>${escapeHtml(unit.title)}</h1><p>You mastered ${escapeHtml(lesson.topic)} and corrected every practice item.</p><div class="lang-row"><button class="lang-btn lang-btn--secondary" data-lang-action="home">Language home</button><button class="lang-btn lang-btn--primary" data-lang-action="grammar-next-unit">Continue to the next unit →</button></div></section></main></div>`;
      return;
    }
    let body = "";
    if (ui.grammarStep === 0) {
      body = `<p class="eyebrow">Concept</p><h1>${escapeHtml(lesson.topic)}</h1><p class="lang-rule">${escapeHtml(lesson.rule)}</p><div class="lang-context-card"><strong>${escapeHtml(unit.title)}</strong><span>${escapeHtml(unit.objective)}</span><small>Situation: ${escapeHtml(unit.situation)}</small></div>`;
    } else if (ui.grammarStep === 1) {
      body = `<p class="eyebrow">Notice the pattern</p><h1>${escapeHtml(lesson.topic)} in context</h1><div class="lang-example-grid">${lesson.examples.map((example) => `<article><strong>${escapeHtml(example)}</strong><button data-lang-speak="${escapeHtml(example)}">▶ Hear it</button></article>`).join("")}</div><div class="lang-dialogue">${unit.dialogue.slice(1, 4).map(([speaker, line]) => `<p><strong>${escapeHtml(speaker)}</strong><span>${escapeHtml(line)}</span><button data-lang-speak="${escapeHtml(line)}">▶</button></p>`).join("")}</div>`;
    } else {
      const wrong = new Set(ui.grammarMistakes);
      body = `<p class="eyebrow">${ui.grammarStep === 2 ? "Guided practice" : "Review your answers"}</p><h1>${escapeHtml(unit.title)}</h1><p>Complete all three. Incorrect answers stay in review until you correct them.</p><div class="lang-grammar-questions">${lesson.checks.map((check, questionIndex) => `<article class="lang-quick-check"><strong>${questionIndex + 1}. ${escapeHtml(check.prompt)}</strong><div class="lang-choice-grid">${check.options.map((option, optionIndex) => { const picked = ui.grammarAnswers[questionIndex] === optionIndex; const marked = ui.grammarChecked && picked; return `<button type="button" data-grammar-choice="${questionIndex}:${optionIndex}" class="${marked ? optionIndex === check.answer ? "is-correct" : "is-wrong" : picked ? "is-selected" : ""}">${escapeHtml(option)}</button>`; }).join("")}</div>${ui.grammarChecked && wrong.has(questionIndex) ? `<small class="lang-error-note">Review the rule and choose again.</small>` : ""}</article>`).join("")}</div>`;
    }
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Grammar")}<main class="lang-center"><section class="lang-card lang-grammar-card"><div class="lang-row lang-row--between">${levelBadge(progress.level)}<span>Unit ${unit.number} of ${progress.lessonsToNext}</span></div><div class="lang-step-labels">${labels.map((label, index) => `<span class="${index === ui.grammarStep ? "is-active" : index < ui.grammarStep ? "is-done" : ""}">${index + 1}. ${label}</span>`).join("")}</div>${body}<div class="lang-row lang-row--between"><button class="lang-btn lang-btn--secondary" data-lang-action="grammar-back" ${ui.grammarStep === 0 ? "disabled" : ""}>← Back</button>${ui.grammarStep < 2 ? `<button class="lang-btn lang-btn--primary" data-lang-action="grammar-forward">Next →</button>` : `<button class="lang-btn lang-btn--primary" data-lang-action="grammar-check">${ui.grammarChecked && ui.grammarMistakes.length ? "Check corrections" : "Check all answers"}</button>`}</div></section></main>${renderDock("Hear the rule", lesson.rule)}</div>`;
  }

  function verbLessonForUnit(unit = curriculumUnit("verbs")) {
    const verbIndex = (unit.number - 1) % content().verbs.length;
    const verb = content().verbs[verbIndex] || content().verbs[0];
    const preferred = unit.level === "A1" ? ["present"] : unit.level === "A2" ? ["past", "imperfect", "imperative"] : ["future", "conditional", "past"];
    const preferredId = preferred[Math.floor((unit.number - 1) / content().verbs.length) % preferred.length];
    const tense = verb.tenses.find((item) => item.id === preferredId) || verb.tenses.find((item) => item.id === "present") || verb.tenses[0];
    return { unit, verb, tense };
  }

  function renderVerbs() {
    if (isPublishedProgrammeComplete("verbs") && !ui.verbComplete) {
      root.innerHTML = renderProgrammeComplete("Verbs & conjugation");
      return;
    }
    const unit = ui.verbComplete ? ui.completedUnitBySection.verbs || curriculumUnit("verbs") : curriculumUnit("verbs");
    const { verb, tense } = verbLessonForUnit(unit);
    const writeMode = isHigherLevel(profile().sections.verbs.level);
    const distractor = content().verbs[unit.number % content().verbs.length]?.tenses.find((item) => item.id === tense.id)?.rows?.[0]?.[1] || "";
    const bank = [...tense.blank.map((index) => tense.rows[index][1]), distractor];
    const rows = tense.rows.map(([pronoun, form], index) => {
      if (writeMode) {
        const value = ui.verbWriteAnswers[index] || "";
        const right = ui.verbChecked && normalizeLanguageAnswer(value) === normalizeLanguageAnswer(form);
        return `<div class="lang-verb-row"><span>${escapeHtml(pronoun)}</span><input class="lang-input ${ui.verbChecked ? right ? "is-correct" : "is-wrong" : ""}" data-verb-write="${index}" value="${escapeHtml(value)}" aria-label="${escapeHtml(pronoun)}" />${ui.verbChecked && !right ? `<small>${escapeHtml(form)}</small>` : ""}</div>`;
      }
      const blank = tense.blank.includes(index);
      return `<div class="lang-verb-row"><span>${escapeHtml(pronoun)}</span><strong class="${blank ? "is-gap" : ""}">${blank ? escapeHtml(ui.verbTapAnswers[index] || "___") : escapeHtml(form)}</strong></div>`;
    }).join("");
    const score = tense.rows.filter(([_, form], index) => normalizeLanguageAnswer(ui.verbWriteAnswers[index]) === normalizeLanguageAnswer(form)).length;
    if (ui.verbComplete) {
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Verbs & conjugation")}<main class="lang-center"><section class="lang-card lang-session-complete"><span class="lang-vocab-hero">🔁</span><p class="eyebrow">${unit.level} unit ${unit.number} complete</p><h1>${escapeHtml(verb.inf)} · ${escapeHtml(tense.name)}</h1><p>You completed the full pattern and can now use it in the “${escapeHtml(unit.title)}” situation.</p><div class="lang-row"><button class="lang-btn lang-btn--secondary" data-lang-action="home">Language home</button><button class="lang-btn lang-btn--primary" data-lang-action="verbs-next-unit">Continue to the next unit →</button></div></section></main></div>`;
      return;
    }
    const practice = writeMode
      ? `<div class="lang-verb-table">${rows}</div><button type="button" class="lang-btn lang-btn--primary" data-lang-action="verbs-check">Check every form</button>${ui.verbChecked ? `<strong class="lang-score">${score}/${tense.rows.length}</strong>` : ""}`
      : `<div class="lang-verb-table">${rows}</div><div class="lang-word-bank">${bank.map((form) => `<button type="button" data-verb-bank="${escapeHtml(form)}">${escapeHtml(form)}</button>`).join("")}</div><button type="button" class="lang-btn lang-btn--primary" data-lang-action="verbs-finish">Check the gaps</button>`;
    const lessonBody = ui.verbStep === 0
      ? `<p class="eyebrow">Learn the pattern</p><h1>${escapeHtml(verb.inf)}</h1><p>${escapeHtml(verb.en)} · ${escapeHtml(tense.name)}</p><p class="lang-rule">${escapeHtml(tense.use)}</p><div class="lang-verb-table">${tense.rows.map(([pronoun, form]) => `<div class="lang-verb-row"><span>${escapeHtml(pronoun)}</span><strong>${escapeHtml(form)}</strong><button data-lang-speak="${escapeHtml(`${pronoun} ${form}`)}">▶</button></div>`).join("")}</div>`
      : `<p class="eyebrow">Guided practice · ${escapeHtml(unit.title)}</p><h1>${writeMode ? "Write every form" : "Complete the highlighted forms"}</h1><p>${escapeHtml(unit.objective)}</p>${practice}`;
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Verbs & conjugation")}<main class="lang-center"><section class="lang-card lang-verb-card"><div class="lang-row lang-row--between">${levelBadge(profile().sections.verbs.level)}<span>Unit ${unit.number} of 24</span></div><div class="lang-step-labels"><span class="${ui.verbStep === 0 ? "is-active" : "is-done"}">1. Learn</span><span class="${ui.verbStep === 1 ? "is-active" : ""}">2. Practise</span><span>3. Complete</span></div>${lessonBody}<div class="lang-row lang-row--between"><button class="lang-btn lang-btn--secondary" data-lang-action="verbs-back" ${ui.verbStep === 0 ? "disabled" : ""}>← Back</button>${ui.verbStep === 0 ? `<button class="lang-btn lang-btn--primary" data-lang-action="verbs-forward">Next: practise →</button>` : ""}</div></section></main>${renderDock("Hear all forms", tense.rows.map(([pronoun, form]) => `${pronoun} ${form}`).join(". "))}</div>`;
  }

  function renderSpeaking() {
    if (isPublishedProgrammeComplete("speak") && !ui.speakingComplete) {
      root.innerHTML = renderProgrammeComplete("Speaking");
      return;
    }
    const unit = ui.speakingComplete ? ui.completedUnitBySection.speak || curriculumUnit("speak") : curriculumUnit("speak");
    if (ui.speakingComplete) {
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Speaking")}<main class="lang-center"><section class="lang-card lang-session-complete"><span class="lang-vocab-hero">🎙</span><p class="eyebrow">${unit.level} unit ${unit.number} complete</p><h1>${escapeHtml(unit.title)}</h1><p>You rehearsed the model, responded in your own words and completed the Panda role-play.</p><div class="lang-row"><button class="lang-btn lang-btn--secondary" data-lang-action="home">Language home</button><button class="lang-btn lang-btn--primary" data-lang-action="speaking-next-unit">Continue to the next unit →</button></div></section></main></div>`;
      return;
    }
    const steps = ["Model", "Rehearse", "Role-play", "Complete"];
    let body = "";
    if (ui.speakingStep === 0) {
      body = `<p class="eyebrow">Listen and notice</p><h1>${escapeHtml(unit.title)}</h1><p>${escapeHtml(unit.objective)}</p><div class="lang-dialogue">${unit.dialogue.map(([speaker, line]) => `<p><strong>${escapeHtml(speaker)}</strong><span>${escapeHtml(line)}</span><button data-lang-speak="${escapeHtml(line)}">▶</button></p>`).join("")}</div><div class="lang-info-list">${unit.words.map((word) => `<p><button data-lang-speak="${escapeHtml(word)}">▶</button><strong>${escapeHtml(word)}</strong></p>`).join("")}</div>`;
    } else if (ui.speakingStep === 1) {
      body = `<div class="lang-speaking-daily"><p class="eyebrow">Guided response</p><h1>${escapeHtml(unit.modelQuestion)}</h1><p>Model: ${escapeHtml(unit.modelReply)}</p><button class="lang-hear" data-lang-speak="${escapeHtml(unit.modelReply)}">▶ Hear the model</button><textarea class="lang-input" data-speaking-draft placeholder="Say or type your own response">${escapeHtml(ui.speakingDraft)}</textarea><div class="lang-row"><button type="button" class="lang-mic lang-mic--large ${ui.recording ? "is-recording" : ""}" data-lang-action="speaking-mic">🎙</button><button type="button" class="lang-btn lang-btn--primary" data-lang-action="speaking-send">Check my response →</button></div></div>`;
    } else {
      body = `<div class="lang-chat"><p class="eyebrow">Independent role-play</p><h1>${escapeHtml(unit.speakingPrompt)}</h1><div class="lang-chat__turns">${ui.speakingTurns.map((turn) => `<div class="lang-chat-line lang-chat-line--${turn.role}"><strong>${turn.role === "tutor" ? "Panda" : "You"}</strong><span>${escapeHtml(turn.text)}</span>${turn.gloss ? `<small>${escapeHtml(turn.gloss)}</small>` : ""}</div>`).join("")}</div><textarea class="lang-input" data-speaking-draft placeholder="Continue the conversation in ${content().native}">${escapeHtml(ui.speakingDraft)}</textarea><div class="lang-row"><button type="button" class="lang-mic ${ui.recording ? "is-recording" : ""}" data-lang-action="speaking-mic">🎙</button><button type="button" class="lang-btn" data-lang-action="speaking-send">Send to Panda</button>${ui.speakingAttempts >= 2 ? `<button type="button" class="lang-btn lang-btn--primary" data-lang-action="speaking-complete">Complete unit →</button>` : ""}</div><small>${Math.min(ui.speakingAttempts, 2)}/2 guided turns completed</small></div>`;
    }
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Speaking")}<main class="lang-center"><section class="lang-card lang-speaking-card"><div class="lang-row lang-row--between">${levelBadge(profile().sections.speak.level)}<span>Unit ${unit.number} of 24</span></div><div class="lang-step-labels">${steps.map((step, index) => `<span class="${index === ui.speakingStep ? "is-active" : index < ui.speakingStep ? "is-done" : ""}">${index + 1}. ${step}</span>`).join("")}</div>${body}<div class="lang-row lang-row--between"><button class="lang-btn lang-btn--secondary" data-lang-action="speaking-back" ${ui.speakingStep === 0 ? "disabled" : ""}>← Back</button>${ui.speakingStep === 0 ? `<button class="lang-btn lang-btn--primary" data-lang-action="speaking-forward">Next: rehearse →</button>` : ""}</div></section></main>${renderDock("Hear the model", unit.modelReply)}</div>`;
  }

  async function submitSpeaking({ recordProgress = true, saveConversation = true } = {}) {
    const draft = String(ui.speakingDraft || "").trim();
    if (!draft) {
      setStatus("Say or type a reply first.");
      render();
      return false;
    }
    const fromDock = ui.askRequested;
    const history = (fromDock || !saveConversation ? [{ role: "learner", text: draft }] : [...ui.speakingTurns, { role: "learner", text: draft }]).slice(-6);
    ui.busy = true;
    setStatus("Panda is thinking…");
    render();
    try {
      const payload = await apiPost("/api/languages/tutor", {
        language: activeLang() === "fr" ? "french" : "spanish",
        level: LANGUAGE_LEVELS[profile().sections.speak.level].name,
        mode: fromDock ? "chat" : ui.speakingMode,
        history
      });
      if (fromDock) ui.askResult = { reply: payload.reply, gloss: payload.gloss || "" };
      else if (saveConversation) ui.speakingTurns = [...history, { role: "tutor", text: payload.reply, gloss: payload.gloss || payload.feedback }].slice(-12);
      ui.speakingDraft = "";
      setStatus(payload.feedback || "Keep going!");
      if (recordProgress && !fromDock) await postProgress("speak", `${activeLang()}:speak:${ui.speakingMode}:${localActivityDate()}`, { correct: 1, total: 1 });
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Panda could not answer just now.");
      return false;
    } finally {
      ui.askRequested = false;
      ui.busy = false;
      render();
    }
  }

  function renderListeningTab(unit) {
    if (ui.listenTab === 0) {
      return ui.listenScript
        ? `<div class="lang-dialogue">${unit.lines.map(([speaker, line]) => `<p><strong>${escapeHtml(speaker)}</strong><span>${escapeHtml(line)}</span><button data-lang-speak="${escapeHtml(line)}">▶</button></p>`).join("")}</div>`
        : `<div class="lang-script-gate"><span>🎧</span><strong>Listen first, without reading</strong><p>Play the dialogue once or twice, then open the script if you need it.</p><button type="button" class="lang-btn" data-lang-action="listen-script">Show the script</button></div>`;
    }
    const rows = [unit.grammar, unit.vocab, unit.phrases][ui.listenTab - 1] || [];
    return `<div class="lang-info-list">${rows.map(([text, gloss]) => `<p><button data-lang-speak="${escapeHtml(text)}">▶</button><strong>${escapeHtml(text)}</strong><span>${escapeHtml(gloss)}</span></p>`).join("")}</div>`;
  }

  function renderListeningActivity(unit) {
    const activity = unit.acts[ui.listenActivity];
    const key = `a${ui.listenActivity}`;
    if (activity.kind === "tf") {
      const [trueLabel, falseLabel] = activeLang() === "fr" ? ["Vrai", "Faux"] : ["Verdadero", "Falso"];
      return activity.items.map(([statement, answer], index) => `<div class="lang-activity-row"><span><b>${index + 1}</b>${escapeHtml(statement)}</span><div><button data-listen-choice="${key}:${index}:true" class="${ui.listenAnswers[`${key}:${index}`] === true ? (answer ? "is-correct" : "is-wrong") : ""}">${trueLabel}</button><button data-listen-choice="${key}:${index}:false" class="${ui.listenAnswers[`${key}:${index}`] === false ? (!answer ? "is-correct" : "is-wrong") : ""}">${falseLabel}</button></div></div>`).join("");
    }
    if (activity.kind === "choose") {
      return activity.items.map(([prompt, options, answer], index) => `<div class="lang-activity-row"><span><b>${index + 1}</b>${escapeHtml(prompt)}</span><div>${options.map((option, optionIndex) => `<button data-listen-choice="${key}:${index}:${optionIndex}" class="${ui.listenAnswers[`${key}:${index}`] === optionIndex ? (optionIndex === answer ? "is-correct" : "is-wrong") : ""}">${escapeHtml(option)}</button>`).join("")}</div></div>`).join("");
    }
    if (activity.kind === "sequence") {
      const picked = Array.isArray(ui.listenAnswers[key]) ? ui.listenAnswers[key] : [];
      return activity.items[0].map((line, index) => { const order = picked.indexOf(index); return `<button type="button" class="lang-sequence-choice ${order >= 0 ? "is-selected" : ""}" data-listen-sequence="${key}:${index}">${order >= 0 ? `<b>${order + 1}</b>` : ""}<span>${escapeHtml(line)}</span></button>`; }).join("");
    }
    if (["transform", "respond"].includes(activity.kind)) {
      return activity.items.map(([prompt, model], index) => `<div class="lang-written-activity"><strong>${index + 1}. ${escapeHtml(prompt)}</strong><input class="lang-input" data-listen-input="${key}:${index}" value="${escapeHtml(ui.listenAnswers[`${key}:${index}`] || "")}" /><button type="button" class="lang-link" data-listen-reveal="${key}:${index}">Show an answer</button>${ui.listenRevealed[`${key}:${index}`] ? `<small>${escapeHtml(model)}</small>` : ""}</div>`).join("");
    }
    return `<div class="lang-roleplay"><img src="/paperpanda-logo.svg" alt="Panda" /><p>${escapeHtml(activity.starter)}</p><button type="button" class="lang-mic lang-mic--large ${ui.recording ? "is-recording" : ""}" data-lang-action="listen-roleplay">🎙</button><textarea class="lang-input" data-speaking-draft placeholder="Or type your reply">${escapeHtml(ui.speakingDraft)}</textarea></div>`;
  }

  function listeningActivityResult(unit, activityIndex) {
    const activity = unit.acts[activityIndex];
    const key = `a${activityIndex}`;
    if (["tf", "choose"].includes(activity.kind)) {
      const answered = activity.items.every((_, index) => Object.hasOwn(ui.listenAnswers, `${key}:${index}`));
      const correct = activity.items.filter(([, , answer], index) => {
        const expected = activity.kind === "tf" ? activity.items[index][1] : answer;
        return ui.listenAnswers[`${key}:${index}`] === expected;
      }).length;
      return { complete: answered, correct, total: activity.items.length };
    }
    if (activity.kind === "sequence") {
      const picked = Array.isArray(ui.listenAnswers[key]) ? ui.listenAnswers[key] : [];
      const complete = picked.length === activity.items[0].length;
      const correct = complete && picked.every((value, index) => value === index) ? activity.items[0].length : 0;
      return { complete, correct, total: activity.items[0].length };
    }
    if (["transform", "respond"].includes(activity.kind)) {
      const complete = activity.items.every((_, index) => String(ui.listenAnswers[`${key}:${index}`] || "").trim().length >= 2);
      const correct = activity.items.filter(([, model], index) => languageAnswerSimilarity(ui.listenAnswers[`${key}:${index}`], model) >= 0.6).length;
      return { complete, correct, total: activity.items.length };
    }
    const complete = ui.listenRoleplayDone || String(ui.speakingDraft || "").trim().length >= 3;
    return { complete, correct: complete ? 1 : 0, total: 1 };
  }

  function renderListening() {
    if (isPublishedProgrammeComplete("listen") && !ui.listenComplete) {
      root.innerHTML = renderProgrammeComplete("Listening");
      return;
    }
    const curriculum = ui.listenComplete ? ui.completedUnitBySection.listen || curriculumUnit("listen") : curriculumUnit("listen");
    const unit = curriculum.listening;
    if (ui.listenComplete) {
      const score = ui.listenScore || { correct: 0, total: 0 };
      const percent = Math.round((score.correct / Math.max(1, score.total)) * 100);
      const passed = percent >= Math.round(LANGUAGE_LESSON_MASTERY * 100);
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Listening")}<main class="lang-center"><section class="lang-card lang-session-complete"><span class="lang-vocab-hero">${passed ? "🎧" : "📝"}</span><p class="eyebrow">${curriculum.level} listening review</p><h1>${score.correct}/${score.total} · ${percent}%</h1><p>${passed ? `Unit ${curriculum.number} is complete. You listened for meaning, detail and natural responses.` : "Reach 85% to complete this unit. Return to the highlighted activities, correct them, then finish again."}</p><div class="lang-row"><button class="lang-btn lang-btn--secondary" data-lang-action="home">Language home</button><button class="lang-btn ${passed ? "lang-btn--primary" : ""}" data-lang-action="listen-review">${passed ? "Continue to the next unit →" : "Review my answers →"}</button></div></section></main></div>`;
      return;
    }
    const activity = unit.acts[ui.listenActivity];
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Listening")}<main class="lang-lesson"><div class="lang-lesson__heading">${levelBadge(profile().sections.listen.level)}<h1>Unit ${curriculum.number} of 24 · ${escapeHtml(curriculum.title)}</h1></div><div class="lang-listening-grid"><section class="lang-card lang-listening-source"><p class="eyebrow">Listening · ${escapeHtml(unit.topic)}</p><h1>${escapeHtml(unit.title)}</h1><div class="lang-audio-player"><button data-lang-speak="${escapeHtml(unit.lines.map((line) => line[1]).join(" "))}">▶</button><span>0:00 / ${escapeHtml(unit.duration)}</span><button data-lang-speak-slow="${escapeHtml(unit.lines.map((line) => line[1]).join(" "))}">0.75×</button></div><div class="lang-info-tabs">${unit.tabs.map((tab, index) => `<button data-listen-tab="${index}" class="${ui.listenTab === index ? "is-active" : ""}">${escapeHtml(tab)}</button>`).join("")}</div>${renderListeningTab(unit)}</section><section class="lang-card lang-listening-activities"><p class="eyebrow">${activeLang() === "fr" ? "Activités" : "Actividades"}</p><div class="lang-stepper">${unit.acts.map((_, index) => `<button data-listen-activity="${index}" class="${ui.listenActivity === index ? "is-active" : listeningActivityResult(unit, index).complete ? "is-done" : ""}">${index + 1}</button>`).join("")}</div><h2>${ui.listenActivity + 1} · ${escapeHtml(activity.title)}</h2><p>${escapeHtml(activity.instruction)}</p><div class="lang-activity-body">${renderListeningActivity(unit)}</div><div class="lang-row lang-row--between"><button class="lang-btn lang-btn--secondary" data-lang-action="listen-back" ${ui.listenActivity === 0 ? "disabled" : ""}>← Back</button><button class="lang-btn lang-btn--primary" data-lang-action="listen-next">${ui.listenActivity === unit.acts.length - 1 ? "Finish and see results →" : "Next activity →"}</button></div></section></div></main>${renderDock("Read instructions", activity.instruction)}</div>`;
  }

  function renderPeppa() {
    if (isPublishedProgrammeComplete("watch") && ui.peppaStage !== "reward") {
      root.innerHTML = renderProgrammeComplete("Watch & understand");
      return;
    }
    const episode = content().episode;
    const unit = ui.peppaStage === "reward" ? ui.completedUnitBySection.watch || curriculumUnit("watch") : curriculumUnit("watch");
    if (ui.peppaStage === "reward") {
      const score = ui.peppaAnswers.filter((answer, index) => answer === content().episodeQs[index].answer).length;
      const passed = score / content().episodeQs.length >= LANGUAGE_LESSON_MASTERY;
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Watch & understand")}<main class="lang-center"><section class="lang-card lang-peppa-reward"><img src="/panda-emojis-2ndedition/${passed ? "panda-happy" : "panda-smart"}-256.png" alt="Panda" /><p class="eyebrow">${passed ? "Episode lesson complete" : "Review the episode"}</p><h1>${score}/5 — ${passed ? (activeLang() === "fr" ? "très bien" : "muy bien") : "keep going"}!</h1><p>${passed ? `Unit ${unit.number} progress is saved.` : "Correct the missed questions to reach the 85% mastery mark."}</p><div class="lang-row"><button class="lang-btn lang-btn--secondary" data-lang-action="peppa-again">Watch again</button><button class="lang-btn lang-btn--primary" data-lang-action="peppa-review">${passed ? "Continue to the next unit →" : "Redo missed questions →"}</button></div></section></main></div>`;
      return;
    }
    if (ui.peppaStage === "quiz") {
      const question = content().episodeQs[ui.peppaQuestion];
      const right = ui.peppaPicked === question.answer;
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Watch & understand")}<main class="lang-center"><section class="lang-card lang-peppa-quiz"><div class="lang-row lang-row--between">${levelBadge(profile().sections.watch.level)}<span>Unit ${unit.number} of 24</span></div><div class="lang-segmented-progress"><span style="width:${((ui.peppaQuestion + 1) / content().episodeQs.length) * 100}%"></span></div><span class="lang-mode-pill">Question ${ui.peppaQuestion + 1} of ${content().episodeQs.length} · ${escapeHtml(question.type)}</span><h1>${escapeHtml(question.q)}</h1><p>${escapeHtml(question.en)}</p><div class="lang-choice-grid">${question.options.map((option, index) => `<button data-peppa-answer="${index}" class="${ui.peppaPicked === index ? ui.peppaChecked ? index === question.answer ? "is-correct" : "is-wrong" : "is-selected" : ""}" ${ui.peppaChecked ? "disabled" : ""}>${escapeHtml(option)}</button>`).join("")}</div>${ui.peppaChecked ? `<div class="lang-feedback ${right ? "is-correct" : "is-wrong"}"><strong>${right ? "Correct" : `Not quite · ${escapeHtml(question.options[question.answer])}`}</strong></div>` : ""}<div class="lang-row lang-row--between"><button class="lang-btn lang-btn--secondary" data-lang-action="peppa-back" ${ui.peppaQuestion === 0 ? "disabled" : ""}>← Back</button><button class="lang-mic" data-lang-action="peppa-mic" ${ui.peppaChecked ? "disabled" : ""}>🎙</button><button class="lang-btn lang-btn--primary" data-lang-action="peppa-next">${!ui.peppaChecked ? "Check answer" : ui.peppaQuestion === content().episodeQs.length - 1 ? "Finish and see results →" : "Next question →"}</button></div></section></main>${renderDock("Read question", question.q)}</div>`;
      return;
    }
    const officialUrl = `https://www.youtube.com/watch?v=${episode.channelVideoId}`;
    const posterUrl = `https://i.ytimg.com/vi/${episode.videoId}/hqdefault.jpg`;
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Watch & understand")}<main class="lang-lesson"><section class="lang-card lang-peppa-watch"><div class="lang-row lang-row--between"><div><p class="eyebrow">${escapeHtml(episode.season)} · ${escapeHtml(episode.length)} · Unit ${unit.number} of 24</p><h1>${escapeHtml(episode.title)} <small>· ${escapeHtml(episode.en)}</small></h1></div>${levelBadge(profile().sections.watch.level)}</div><div class="lang-context-card"><strong>Watch for meaning and detail</strong><span>Notice who does what, the order of events and the exact expressions used. You will answer before seeing corrections.</span><small>Mastery target: 85%</small></div><a class="lang-video lang-video-link" href="${officialUrl}" target="_blank" rel="noreferrer" aria-label="Play ${escapeHtml(episode.title)} on the official YouTube channel"><img src="${posterUrl}" alt="${escapeHtml(episode.title)} official video thumbnail"><span><b>▶</b> Play on the official YouTube channel</span></a><p class="lang-note">Watch the first five minutes, then return for the detailed quiz. The approved channel opens on YouTube because it disables in-app playback.</p><button type="button" class="lang-btn lang-btn--primary" data-lang-action="peppa-quiz">I’ve watched it — start the questions →</button></section></main>${renderDock("Hear the title", episode.title)}</div>`;
  }

  function renderAsk() {
    const question = String(ui.askDraft || "").trim();
    if (!question) return;
    ui.speakingDraft = question;
    ui.askOpen = false;
    ui.askDraft = "";
    ui.askRequested = true;
    void submitSpeaking();
  }

  function render() {
    if (!root) return;
    root.dataset.screen = ui.screen;
    if (ui.screen === "pick") renderPick();
    else if (ui.screen === "placement") renderPlacement();
    else if (ui.screen === "result") renderResult();
    else if (ui.screen === "home") renderHome();
    else if (ui.screen === "vocab") renderVocab();
    else if (ui.screen === "grammar") renderGrammar();
    else if (ui.screen === "verbs") renderVerbs();
    else if (ui.screen === "speaking") renderSpeaking();
    else if (ui.screen === "listening") renderListening();
    else if (ui.screen === "peppa") renderPeppa();
    else renderHome();
    if (ui.status && !root.querySelector(".lang-feedback")) {
      root.insertAdjacentHTML("beforeend", `<div class="lang-toast">${escapeHtml(ui.status)}</div>`);
    }
  }

  async function handleClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.langSwitch) {
      await chooseLanguage(target.dataset.langSwitch, { begin: true });
      return;
    }
    if (target.dataset.langPick) {
      languages.active = target.dataset.langPick;
      setStatus("");
      render();
      return;
    }
    if (target.dataset.langSpeak !== undefined) {
      speak(target.dataset.langSpeak || getPrimaryTextForScreen(ui, content()));
      return;
    }
    if (target.dataset.langSpeakSlow !== undefined) {
      speak(target.dataset.langSpeakSlow, 0.75);
      return;
    }
    if (target.dataset.langOpen) {
      stopAiSpeech?.();
      ui.screen = { watch: "peppa", speak: "speaking", listen: "listening" }[target.dataset.langOpen] || target.dataset.langOpen;
      resetLessonUi();
      resetTrackLesson(target.dataset.langOpen);
      if (target.dataset.langOpen === "vocab") {
        if (ui.vocabBankLevel === currentVocabularyLevelName() && ui.vocabBank.length) startVocabSession();
        else await ensureVocabularyBank();
      }
      render();
      return;
    }
    if (target.dataset.placementOption !== undefined) {
      ui.placementPicked = Number(target.dataset.placementOption);
      render();
      return;
    }
    if (target.dataset.vocabAnswer) {
      if (ui.vocabChecked) return;
      ui.vocabPicked = target.dataset.vocabAnswer;
      const right = normalizeLanguageAnswer(ui.vocabPicked) === normalizeLanguageAnswer(ui.vocabTarget.word);
      ui.vocabChecked = true;
      ui.vocabAnswerCorrect = right;
      recordVocabularyAnswer(right);
      render();
      return;
    }
    if (target.dataset.grammarChoice !== undefined) {
      const [questionIndex, optionIndex] = target.dataset.grammarChoice.split(":").map(Number);
      ui.grammarAnswers[questionIndex] = optionIndex;
      ui.grammarChecked = false;
      ui.grammarMistakes = ui.grammarMistakes.filter((index) => index !== questionIndex);
      render();
      return;
    }
    if (target.dataset.tenseSelect !== undefined) {
      ui.tenseIndex = Number(target.dataset.tenseSelect);
      ui.verbTapAnswers = {};
      ui.verbWriteAnswers = {};
      ui.verbChecked = false;
      render();
      return;
    }
    if (target.dataset.verbBank) {
      const { tense } = verbLessonForUnit();
      const gap = tense.blank.find((index) => !ui.verbTapAnswers[index]);
      if (gap !== undefined) ui.verbTapAnswers[gap] = target.dataset.verbBank;
      render();
      return;
    }
    if (target.dataset.speakingMode) {
      ui.speakingMode = target.dataset.speakingMode;
      setStatus("");
      render();
      return;
    }
    if (target.dataset.listenTab !== undefined) { ui.listenTab = Number(target.dataset.listenTab); render(); return; }
    if (target.dataset.listenActivity !== undefined) { ui.listenActivity = Number(target.dataset.listenActivity); render(); return; }
    if (target.dataset.listenChoice) {
      const [activityKey, itemIndex, rawValue] = target.dataset.listenChoice.split(":");
      ui.listenAnswers[`${activityKey}:${itemIndex}`] = rawValue === "true" ? true : rawValue === "false" ? false : Number(rawValue);
      render();
      return;
    }
    if (target.dataset.listenSequence) {
      const [activityKey, rawIndex] = target.dataset.listenSequence.split(":");
      const itemIndex = Number(rawIndex);
      const picked = Array.isArray(ui.listenAnswers[activityKey]) ? [...ui.listenAnswers[activityKey]] : [];
      const existing = picked.indexOf(itemIndex);
      if (existing >= 0) picked.splice(existing, 1);
      else picked.push(itemIndex);
      ui.listenAnswers[activityKey] = picked;
      render(); return;
    }
    if (target.dataset.listenReveal) { ui.listenRevealed[target.dataset.listenReveal] = true; render(); return; }
    if (target.dataset.peppaAnswer !== undefined) { if (!ui.peppaChecked) ui.peppaPicked = Number(target.dataset.peppaAnswer); render(); return; }

    const action = target.dataset.langAction;
    if (!action) return;
    if (action === "exit") { stopAiSpeech?.(); onExit?.(); return; }
    if (action === "begin") { await chooseLanguage(languages.active || "fr", { begin: true }); return; }
    if (action === "home") { stopAiSpeech?.(); ui.screen = "home"; resetLessonUi(); render(); return; }
    if (action === "reset-levels") { await resetLevels(); return; }
    if (action === "placement-next") { await advancePlacement(false); return; }
    if (action === "placement-skip") { await advancePlacement(true); return; }
    if (action === "placement-back") { backPlacement(); return; }
    if (action === "placement-mic") { startRecognition((text) => { ui.placementDraft = text; setStatus(`I heard: “${text}”`); render(); }); return; }
    if (action === "vocab-next") {
      advanceVocabSession();
      render();
      if (ui.vocabSessionComplete) await saveVocabularySession();
      return;
    }
    if (action === "vocab-restart") {
      if (ui.vocabBankLevel !== currentVocabularyLevelName()) await ensureVocabularyBank({ restart: true });
      else { startVocabSession(); render(); }
      return;
    }
    if (action === "vocab-reload") { await ensureVocabularyBank({ restart: true }); return; }
    if (action === "vocab-mic") { startRecognition((text) => { ui.vocabTyped = text; ui.vocabChecked = false; ui.vocabAnswerCorrect = null; render(); }); return; }
    if (action === "vocab-show") {
      if (ui.vocabChecked) return;
      ui.vocabTyped = ui.vocabTarget.word;
      ui.vocabChecked = true;
      ui.vocabAnswerCorrect = false;
      recordVocabularyAnswer(false);
      render();
      return;
    }
    if (action === "vocab-check") {
      if (ui.vocabChecked) return;
      ui.vocabChecked = true;
      const correct = normalizeLanguageAnswer(ui.vocabTyped) === normalizeLanguageAnswer(ui.vocabTarget.word);
      ui.vocabAnswerCorrect = correct;
      recordVocabularyAnswer(correct);
      render();
      return;
    }
    if (action === "grammar-back") { ui.grammarStep = Math.max(0, ui.grammarStep - 1); render(); return; }
    if (action === "grammar-forward") { ui.grammarStep = Math.min(2, ui.grammarStep + 1); render(); return; }
    if (action === "grammar-check") {
      const unit = curriculumUnit("grammar");
      if (unit.grammar.checks.some((_, index) => !Object.hasOwn(ui.grammarAnswers, index))) {
        setStatus("Answer all three questions before checking."); render(); return;
      }
      ui.grammarChecked = true;
      ui.grammarMistakes = unit.grammar.checks.map((check, index) => ui.grammarAnswers[index] === check.answer ? -1 : index).filter((index) => index >= 0);
      ui.grammarStep = 3;
      if (ui.grammarMistakes.length) {
        setStatus(`${ui.grammarMistakes.length} answer${ui.grammarMistakes.length === 1 ? " needs" : "s need"} another look.`);
      } else {
        ui.completedUnitBySection.grammar = unit;
        const payload = await postProgress("grammar", curriculumLessonId("grammar", unit), { correct: 3, total: 3 });
        ui.grammarComplete = Boolean(payload?.masteryMet);
      }
      render(); return;
    }
    if (action === "grammar-next-unit") { resetTrackLesson("grammar"); render(); return; }
    if (action === "verbs-check") {
      ui.verbChecked = true;
      const { unit, verb, tense } = verbLessonForUnit();
      const score = tense.rows.filter(([_, form], index) => normalizeLanguageAnswer(ui.verbWriteAnswers[index]) === normalizeLanguageAnswer(form)).length;
      if (score === tense.rows.length) {
        ui.completedUnitBySection.verbs = unit;
        const payload = await postProgress("verbs", curriculumLessonId("verbs", unit), { correct: score, total: tense.rows.length, verbKey: `${verb.inf}|${tense.name}` });
        ui.verbComplete = Boolean(payload?.masteryMet);
      } else setStatus("Review the highlighted corrections, then check every form again.");
      render(); return;
    }
    if (action === "verbs-finish") {
      const { unit, verb, tense } = verbLessonForUnit();
      const correct = tense.blank.filter((index) => normalizeLanguageAnswer(ui.verbTapAnswers[index]) === normalizeLanguageAnswer(tense.rows[index][1])).length;
      if (correct === tense.blank.length) {
        ui.completedUnitBySection.verbs = unit;
        const payload = await postProgress("verbs", curriculumLessonId("verbs", unit), { correct, total: tense.blank.length, verbKey: `${verb.inf}|${tense.name}` });
        ui.verbComplete = Boolean(payload?.masteryMet);
      }
      else setStatus("Check each highlighted form and try again.");
      render(); return;
    }
    if (action === "verbs-back") { ui.verbStep = Math.max(0, ui.verbStep - 1); render(); return; }
    if (action === "verbs-forward") { ui.verbStep = 1; render(); return; }
    if (action === "verbs-next-unit") { resetTrackLesson("verbs"); render(); return; }
    if (action === "speaking-mic") {
      startRecognition((text) => {
        ui.speakingDraft = text;
        setStatus(`I heard: “${text}”`);
        render();
      });
      return;
    }
    if (action === "speaking-send") {
      const sent = await submitSpeaking({ recordProgress: false, saveConversation: true });
      if (sent) {
        ui.speakingAttempts += 1;
        ui.speakingStep = 2;
        render();
      }
      return;
    }
    if (action === "speaking-back") { ui.speakingStep = Math.max(0, ui.speakingStep - 1); render(); return; }
    if (action === "speaking-forward") { ui.speakingStep = 1; render(); return; }
    if (action === "speaking-complete") {
      if (ui.speakingAttempts < 2) { setStatus("Complete two guided turns with Panda first."); render(); return; }
      const unit = curriculumUnit("speak");
      ui.completedUnitBySection.speak = unit;
      const payload = await postProgress("speak", curriculumLessonId("speak", unit), { correct: 2, total: 2 });
      ui.speakingComplete = Boolean(payload?.masteryMet);
      ui.speakingStep = 3;
      render(); return;
    }
    if (action === "speaking-next-unit") { resetTrackLesson("speak"); render(); return; }
    if (action === "listen-script") { ui.listenScript = true; render(); return; }
    if (action === "listen-back") { ui.listenActivity = Math.max(0, ui.listenActivity - 1); render(); return; }
    if (action === "listen-next") {
      const curriculum = curriculumUnit("listen");
      const unit = curriculum.listening;
      const currentResult = listeningActivityResult(unit, ui.listenActivity);
      if (!currentResult.complete) {
        setStatus("Complete each answer in this activity before continuing.");
        render(); return;
      }
      if (ui.listenActivity < unit.acts.length - 1) {
        ui.listenActivity += 1;
      } else {
        const results = unit.acts.map((_, index) => listeningActivityResult(unit, index));
        if (!results.every((result) => result.complete)) {
          setStatus("Complete all five activities before finishing the lesson.");
          render(); return;
        }
        if (!ui.listenRoleplayDone && String(ui.speakingDraft || "").trim()) {
          const previousMode = ui.speakingMode;
          ui.speakingMode = "roleplay";
          await submitSpeaking({ recordProgress: false, saveConversation: false });
          ui.speakingMode = previousMode;
          ui.listenRoleplayDone = true;
        }
        const totals = results.reduce((summary, result) => ({ correct: summary.correct + result.correct, total: summary.total + result.total }), { correct: 0, total: 0 });
        ui.listenScore = totals;
        ui.listenComplete = true;
        if (totals.correct / Math.max(1, totals.total) >= LANGUAGE_LESSON_MASTERY) {
          ui.completedUnitBySection.listen = curriculum;
          await postProgress("listen", curriculumLessonId("listen", curriculum), totals);
        }
      }
      render(); return;
    }
    if (action === "listen-review") {
      if ((ui.listenScore?.correct || 0) / Math.max(1, ui.listenScore?.total || 0) >= LANGUAGE_LESSON_MASTERY) resetTrackLesson("listen");
      else {
        const unit = curriculumUnit("listen").listening;
        const firstMissed = unit.acts.findIndex((_, index) => { const result = listeningActivityResult(unit, index); return result.correct < result.total; });
        ui.listenComplete = false;
        ui.listenActivity = Math.max(0, firstMissed);
        setStatus("Correct the missed activity, then continue to the results again.");
      }
      render(); return;
    }
    if (action === "listen-roleplay") {
      startRecognition((text) => {
        ui.speakingDraft = text;
        const previousMode = ui.speakingMode;
        ui.speakingMode = "roleplay";
        void submitSpeaking({ recordProgress: false, saveConversation: false }).then(() => {
          ui.speakingMode = previousMode;
          ui.listenRoleplayDone = true;
          render();
        });
      });
      return;
    }
    if (action === "captions") { if (content().episode.captionsAvailable) ui.captionsOn = !ui.captionsOn; render(); return; }
    if (action === "peppa-quiz") { ui.peppaStage = "quiz"; ui.peppaQuestion = 0; ui.peppaAnswers = []; ui.peppaPicked = null; ui.peppaChecked = false; render(); return; }
    if (action === "peppa-mic") { startRecognition((text) => { const question = content().episodeQs[ui.peppaQuestion]; ui.peppaPicked = question.options.findIndex((option) => normalizeLanguageAnswer(text).includes(normalizeLanguageAnswer(option))); render(); }); return; }
    if (action === "peppa-next") {
      if (ui.peppaPicked === null) { setStatus("Choose or say an answer first."); render(); return; }
      if (!ui.peppaChecked) { ui.peppaChecked = true; ui.peppaAnswers[ui.peppaQuestion] = ui.peppaPicked; render(); return; }
      ui.peppaAnswers[ui.peppaQuestion] = ui.peppaPicked;
      if (ui.peppaQuestion < content().episodeQs.length - 1) { ui.peppaQuestion += 1; ui.peppaPicked = ui.peppaAnswers[ui.peppaQuestion] ?? null; ui.peppaChecked = false; render(); return; }
      const score = ui.peppaAnswers.filter((answer, index) => answer === content().episodeQs[index].answer).length;
      const unit = curriculumUnit("watch");
      if (score / content().episodeQs.length >= LANGUAGE_LESSON_MASTERY) {
        ui.completedUnitBySection.watch = unit;
        await postProgress("watch", curriculumLessonId("watch", unit), { correct: score, total: content().episodeQs.length, peppaId: content().episode.id });
      }
      ui.peppaStage = "reward"; render(); return;
    }
    if (action === "peppa-back") { ui.peppaQuestion = Math.max(0, ui.peppaQuestion - 1); ui.peppaPicked = ui.peppaAnswers[ui.peppaQuestion] ?? null; ui.peppaChecked = ui.peppaPicked !== null; render(); return; }
    if (action === "peppa-review") {
      const passed = ui.peppaAnswers.filter((answer, index) => answer === content().episodeQs[index].answer).length / content().episodeQs.length >= LANGUAGE_LESSON_MASTERY;
      if (passed) resetTrackLesson("watch");
      else {
        ui.peppaStage = "quiz";
        ui.peppaQuestion = content().episodeQs.findIndex((question, index) => ui.peppaAnswers[index] !== question.answer);
        ui.peppaPicked = null;
        ui.peppaChecked = false;
      }
      render(); return;
    }
    if (action === "peppa-again") { ui.peppaStage = "watch"; ui.peppaQuestion = 0; ui.peppaAnswers = []; ui.peppaPicked = null; ui.peppaChecked = false; render(); return; }
    if (action === "ask-toggle") { ui.askOpen = !ui.askOpen; render(); return; }
  }

  function handleInput(event) {
    const target = event.target;
    if (target.matches("[data-placement-draft]")) ui.placementDraft = target.value;
    if (target.matches("[data-vocab-typed]")) ui.vocabTyped = target.value;
    if (target.matches("[data-speaking-draft]")) ui.speakingDraft = target.value;
    if (target.matches("[data-verb-write]")) ui.verbWriteAnswers[target.dataset.verbWrite] = target.value;
    if (target.matches("[data-listen-input]")) ui.listenAnswers[target.dataset.listenInput] = target.value;
    if (target.name === "question") ui.askDraft = target.value;
  }

  function handleChange(event) {
    if (event.target.matches("[data-verb-select]")) {
      ui.verbIndex = Number(event.target.value);
      ui.tenseIndex = 0;
      ui.verbTapAnswers = {};
      ui.verbWriteAnswers = {};
      ui.verbChecked = false;
      render();
    }
  }

  function handleSubmit(event) {
    if (event.target.matches("[data-lang-ask-form]")) {
      event.preventDefault();
      renderAsk();
    }
  }

  root?.addEventListener("click", (event) => void handleClick(event));
  root?.addEventListener("input", handleInput);
  root?.addEventListener("change", handleChange);
  root?.addEventListener("submit", handleSubmit);

  return { load, render, setData, getData: () => languages, open: () => { ui.screen = chooseStartScreen(); if (ui.screen === "placement") buildPlacementQueue(); render(); } };
}
