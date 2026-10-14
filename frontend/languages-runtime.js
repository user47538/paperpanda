import { LANGUAGE_CONTENT } from "./languages-content.js";

export const LANGUAGE_LEVELS = [
  { name: "A1", label: "Beginner" },
  { name: "A2", label: "Elementary" },
  { name: "B1", label: "Intermediate" },
  { name: "B2", label: "Upper intermediate" },
  { name: "C1", label: "Advanced" },
  { name: "C2", label: "Mastery" }
];

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
  return { level: 0, lessonsDone: 0, lessonsToNext: id === "watch" ? 8 : 10 };
}

function createDefaultProfile() {
  return {
    placementDone: false,
    placementAt: "",
    sections: Object.fromEntries(SECTION_IDS.map((id) => [id, createDefaultSection(id)])),
    vocab: { thousandLearned: [], topics: [], review: [] },
    verbsMastered: {},
    peppaWatched: [],
    completedLessons: {}
  };
}

export function createDefaultLanguagesState() {
  return {
    version: 2,
    active: "",
    profiles: { fr: createDefaultProfile(), es: createDefaultProfile() },
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

export function createLanguagesRuntime({ root, apiGet, apiPost, getStudentName, onExit, onStateChange }) {
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
    vocabScene: 0,
    vocabWord: 0,
    vocabPicked: "",
    vocabChecked: false,
    vocabTyped: "",
    vocabTarget: null,
    topicDraft: [],
    grammarIndex: 0,
    grammarPicked: null,
    verbIndex: 0,
    tenseIndex: 0,
    verbTapAnswers: {},
    verbWriteAnswers: {},
    verbChecked: false,
    speakingMode: "daily",
    speakingDraft: "",
    speakingTurns: [],
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
    captionsOn: false,
    askOpen: false,
    askDraft: "",
    askRequested: false,
    askResult: null,
    listenRoleplayDone: false
  };

  function activeLang() {
    return languages.active || "fr";
  }

  function content() {
    return LANGUAGE_CONTENT[activeLang()];
  }

  function profile() {
    return languages.profiles?.[activeLang()] || createDefaultProfile();
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
    ui.placementQueue = SECTION_IDS.map((sectionId) => questions.find((question) => question.section === sectionId)).filter(Boolean);
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
      vocabScene: 0,
      vocabWord: 0,
      vocabTyped: "",
      vocabTarget: null,
      topicDraft: [],
      grammarIndex: 0,
      verbIndex: 0,
      tenseIndex: 0,
      speakingMode: "daily",
      speakingDraft: "",
      speakingTurns: [],
      listenTab: 0,
      listenActivity: 0,
      listenScript: false,
      listenAnswers: {},
      listenRevealed: {},
      listenRoleplayDone: false,
      peppaStage: "watch",
      peppaQuestion: 0,
      peppaAnswers: [],
      peppaPicked: null,
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

  function speak(text, rate = 0.9) {
    const cleanText = String(text || "").trim();
    if (!cleanText || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = content().locale;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
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

  function renderPick() {
    root.innerHTML = `<div class="lang-shell">${renderTopbar()}<main class="lang-center"><div class="lang-intro"><p class="eyebrow">New subject · Languages</p><h1>Which language are you learning?</h1><p>You can switch or add the other one later.</p><div class="lang-pick-grid">${Object.values(LANGUAGE_CONTENT).map((item) => `<button type="button" class="lang-pick-card ${languages.active === item.id ? "is-selected" : ""}" data-lang-pick="${item.id}"><span>${item.flag}</span><strong>${item.name}</strong><small>${item.native} · “${item.hello}”</small></button>`).join("")}</div><button type="button" class="lang-btn lang-btn--primary" data-lang-action="begin" ${languages.active ? "" : "disabled"}>Start the level check →</button><p class="lang-note">About 5 minutes. It is not a test you can fail — it tells Panda where to start.</p></div></main></div>`;
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
    const progress = Math.round((ui.placementIndex / Math.max(1, ui.placementQueue.length)) * 100);
    root.innerHTML = `<div class="lang-shell">${renderTopbar()}<main class="lang-center"><section class="lang-placement"><div class="lang-placement__meta"><span>Level check · ${content().name}</span><strong>${ui.placementIndex + 1} of ${ui.placementQueue.length}</strong></div><div class="lang-segmented-progress"><span style="width:${progress}%"></span></div><p class="lang-section-kicker">${escapeHtml(SECTIONS.find((section) => section.id === question.section)?.label || question.section)}</p><h2>${escapeHtml(question.prompt)}</h2>${renderPlacementQuestion(question)}<div class="lang-placement__actions"><button type="button" class="lang-link" data-lang-action="placement-skip">I don’t know yet — skip</button><button type="button" class="lang-btn" data-lang-action="placement-next">${ui.placementIndex === ui.placementQueue.length - 1 ? "See my levels" : "Next →"}</button></div></section></main>${renderDock("Read question", question.prompt)}</div>`;
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
    ui.placementAnswers.push({ id: question.id, section: question.section, level: question.level, skipped, correct, response: question.kind === "speak" ? String(value || "") : "" });
    if (correct) {
      const harder = content().placement.find((candidate) => candidate.section === question.section && candidate.level > question.level && !ui.placementQueue.some((queued) => queued.id === candidate.id));
      if (harder) ui.placementQueue.splice(ui.placementIndex + 1, 0, harder);
    }
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
    root.innerHTML = `<div class="lang-shell">${renderTopbar()}<main class="lang-home"><header class="lang-home__header"><div><p class="eyebrow">${content().flag} ${content().name}</p><h1>${content().hello} ${escapeHtml(firstName)}!</h1><p>Pick a section. Each one moves up at its own pace.</p></div>${rewardStrip(languages)}</header><button type="button" class="lang-resume" data-lang-open="watch"><span>📺</span><span><small>Pick up where you left off</small><strong>Peppa · ${escapeHtml(content().episode.title)}</strong></span><b>→</b></button><section class="lang-section-grid">${SECTIONS.map((section) => { const progress = profile().sections[section.id]; const next = LANGUAGE_LEVELS[Math.min(LANGUAGE_LEVELS.length - 1, progress.level + 1)].name; return `<button type="button" class="lang-section-card lang-tone--${section.tone}" data-lang-open="${section.id}"><span class="lang-section-card__icon">${section.icon}</span><strong>${section.label}</strong>${levelBadge(progress.level)}<small>${progress.level >= LANGUAGE_LEVELS.length - 1 ? "C2 mastery practice" : `${progress.lessonsDone}/${progress.lessonsToNext} lessons to ${next}`}</small><i><b style="width:${Math.round((progress.lessonsDone / progress.lessonsToNext) * 100)}%"></b></i></button>`; }).join("")}</section></main></div>`;
  }

  function getVocabTarget() {
    const currentProfile = profile();
    if (isHigherLevel(currentProfile.sections.vocab.level)) {
      const entries = currentProfile.vocab.topics.flatMap((topicName) => (content().topics[topicName]?.[1] || []).map((entry) => ({ entry, topicName })));
      const selected = entries[ui.vocabWord % Math.max(1, entries.length)];
      return selected ? { emoji: selected.entry[0], word: selected.entry[1], topic: selected.topicName, mode: "topics" } : null;
    }
    const scene = content().scenes[ui.vocabScene % content().scenes.length];
    const entry = scene[3][ui.vocabWord % scene[3].length];
    return { emoji: entry[0], word: entry[1], gloss: entry[2], topic: scene[2], sceneId: scene[0], options: scene[3], mode: "thousand" };
  }

  function renderTopicPicker() {
    const selected = new Set(ui.topicDraft.length ? ui.topicDraft : profile().vocab.topics);
    return `<section class="lang-card lang-topic-picker"><p class="eyebrow">B1+ · My topics</p><h2>What are you interested in?</h2><p>Choose at least two. Your vocabulary practice will use these themes.</p><div class="lang-topic-grid">${Object.entries(content().topics).map(([name, [emoji]]) => `<button type="button" data-lang-topic="${escapeHtml(name)}" class="${selected.has(name) ? "is-selected" : ""}"><span>${emoji}</span>${escapeHtml(name)}</button>`).join("")}</div><button type="button" class="lang-btn" data-lang-action="topics-save">Save my topics</button></section>`;
  }

  function renderVocab() {
    const currentProfile = profile();
    const higher = isHigherLevel(currentProfile.sections.vocab.level);
    if (higher && !currentProfile.vocab.topics.length) {
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Vocabulary")}<main class="lang-center">${renderTopicPicker()}</main>${renderDock("Read instructions", "Choose topics you enjoy, then name each picture in the target language.")}</div>`;
      return;
    }
    const target = getVocabTarget();
    ui.vocabTarget = target;
    const learned = currentProfile.vocab.thousandLearned.length;
    const beginnerOptions = higher ? [] : (() => {
      const alternatives = target.options.filter((entry) => entry[1] !== target.word).slice(0, 3);
      const answerPosition = ui.vocabWord % 4;
      alternatives.splice(answerPosition, 0, target.options.find((entry) => entry[1] === target.word));
      return alternatives;
    })();
    const rail = higher
      ? `<aside class="lang-lesson-rail"><p class="eyebrow">Your topics</p>${currentProfile.vocab.topics.map((topic) => `<button class="is-active">${content().topics[topic]?.[0] || "✦"} ${escapeHtml(topic)}</button>`).join("")}<button data-lang-action="topics-edit">+ Edit topics</button></aside>`
      : `<aside class="lang-lesson-rail"><p class="eyebrow">First 1,000 words</p><strong class="lang-big-number">${learned}</strong><small>of 1,000 learned</small>${content().scenes.map((scene, index) => `<button data-vocab-scene="${index}" class="${index === ui.vocabScene ? "is-active" : ""}">${scene[1]} ${escapeHtml(scene[2])}<small>${scene[3].filter((entry) => currentProfile.vocab.thousandLearned.includes(entry[1])).length}/${scene[3].length}</small></button>`).join("")}</aside>`;
    const exercise = higher
      ? `<div class="lang-vocab-prompt"><span class="lang-vocab-hero">${target.emoji}</span><h2>Name this picture</h2><input class="lang-input" data-vocab-typed value="${escapeHtml(ui.vocabTyped)}" placeholder="Type the ${content().name} word" /><button type="button" class="lang-mic ${ui.recording ? "is-recording" : ""}" data-lang-action="vocab-mic">🎙</button><div class="lang-row"><button type="button" class="lang-link" data-lang-action="vocab-show">I don’t know — show me</button><button type="button" class="lang-btn" data-lang-action="vocab-check">Check</button></div>${ui.vocabChecked ? `<div class="lang-feedback ${normalizeLanguageAnswer(ui.vocabTyped) === normalizeLanguageAnswer(target.word) ? "is-correct" : "is-wrong"}"><strong>${escapeHtml(target.word)}</strong></div>` : ""}</div>`
      : `<div class="lang-vocab-prompt"><p class="eyebrow">${escapeHtml(target.topic)}</p><h2>Find: ${escapeHtml(target.word)}</h2><button type="button" class="lang-hear" data-lang-speak="${escapeHtml(target.word)}">▶ Hear it</button><div class="lang-picture-options">${beginnerOptions.map((entry) => `<button type="button" data-vocab-answer="${escapeHtml(entry[1])}" class="${ui.vocabPicked === entry[1] ? (entry[1] === target.word ? "is-correct" : "is-wrong") : ""}"><span>${entry[0]}</span></button>`).join("")}</div><button type="button" class="lang-btn" data-lang-action="vocab-next">Next word →</button></div>`;
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Vocabulary")}<main class="lang-lesson"><div class="lang-lesson__heading">${levelBadge(currentProfile.sections.vocab.level)}<h1>Vocabulary</h1></div><div class="lang-split">${rail}<section class="lang-card">${exercise}</section></div></main>${renderDock("Hear the word", target.word)}</div>`;
  }

  function renderGrammar() {
    const currentLevel = profile().sections.grammar.level;
    const eligible = content().grammar.filter((lesson) => LANGUAGE_LEVELS.findIndex((level) => level.name === lesson.level) <= currentLevel);
    const lesson = eligible[ui.grammarIndex % Math.max(1, eligible.length)] || content().grammar[0];
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Grammar")}<main class="lang-center"><section class="lang-card lang-grammar-card"><div class="lang-row lang-row--between">${levelBadge(currentLevel)}<span>Lesson ${profile().sections.grammar.lessonsDone + 1} of ${profile().sections.grammar.lessonsToNext}</span></div><h1>${escapeHtml(lesson.topic)}</h1><p class="lang-rule">${escapeHtml(lesson.rule)}</p><div class="lang-example-grid">${lesson.examples.map(([example, gloss]) => `<article><strong>${escapeHtml(example)}</strong><span>${escapeHtml(gloss)}</span><button data-lang-speak="${escapeHtml(example)}">▶</button></article>`).join("")}</div><div class="lang-quick-check"><p class="eyebrow">Quick check</p><h2>${escapeHtml(lesson.check.noun)} <small>(${escapeHtml(lesson.check.en)})</small></h2><div class="lang-choice-grid">${lesson.check.options.map((option, index) => `<button type="button" data-grammar-answer="${index}" class="${ui.grammarPicked === index ? (index === lesson.check.answer ? "is-correct" : "is-wrong") : ""}">${escapeHtml(option)}</button>`).join("")}</div></div></section></main>${renderDock("Explain it to me", lesson.rule)}</div>`;
  }

  function renderVerbs() {
    const verb = content().verbs[ui.verbIndex] || content().verbs[0];
    const tense = verb.tenses[ui.tenseIndex] || verb.tenses[0];
    const writeMode = isHigherLevel(profile().sections.verbs.level);
    const distractor = content().verbs[(ui.verbIndex + 1) % content().verbs.length]?.tenses[ui.tenseIndex]?.rows?.[0]?.[1] || "";
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
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Verbs & conjugation")}<main class="lang-lesson"><div class="lang-split lang-split--verbs"><aside class="lang-lesson-rail"><p class="eyebrow">Verb</p><select class="lang-select" data-verb-select>${content().verbs.map((item, index) => `<option value="${index}" ${index === ui.verbIndex ? "selected" : ""}>${escapeHtml(item.inf)} · ${escapeHtml(item.en)}</option>`).join("")}</select><p class="eyebrow">Tenses</p>${verb.tenses.map((item, index) => `<button data-tense-select="${index}" class="${index === ui.tenseIndex ? "is-active" : ""}"><span>${escapeHtml(item.name)}</span><small>${escapeHtml(item.en)} · ${item.level}</small></button>`).join("")}</aside><section class="lang-card lang-verb-card"><div class="lang-row lang-row--between"><div><h1>${escapeHtml(verb.inf)}</h1><span>${escapeHtml(verb.en)} · ${escapeHtml(tense.name)}</span></div>${levelBadge(LANGUAGE_LEVELS.findIndex((level) => level.name === tense.level))}</div><span class="lang-mode-pill">${writeMode ? "Write every form" : "Tap the right form"}</span><p>${escapeHtml(tense.use)}${writeMode ? "" : " Practise the highlighted gaps."}</p><div class="lang-verb-table">${rows}</div>${writeMode ? `<button type="button" class="lang-btn" data-lang-action="verbs-check">Check my answers</button>${ui.verbChecked ? `<strong class="lang-score">${score}/${tense.rows.length}</strong>` : ""}` : `<div class="lang-word-bank">${bank.map((form) => `<button type="button" data-verb-bank="${escapeHtml(form)}">${escapeHtml(form)}</button>`).join("")}</div><button type="button" class="lang-btn" data-lang-action="verbs-finish">Finish</button>`}</section></div></main>${renderDock("Hear all forms", tense.rows.map(([pronoun, form]) => `${pronoun} ${form}`).join(". "))}</div>`;
  }

  function renderSpeaking() {
    const speaking = content().speaking;
    const modeTabs = [["daily", "☀️ Daily phrase"], ["chat", "💬 Chat with Panda"], ["picture", "🖼 Describe a picture"]];
    let body = "";
    if (ui.speakingMode === "daily") {
      body = `<div class="lang-speaking-daily"><p class="eyebrow">Today’s phrase</p><h1>${escapeHtml(speaking.phrase)}</h1><p>${escapeHtml(speaking.en)}</p><button class="lang-hear" data-lang-speak="${escapeHtml(speaking.phrase)}">▶ Hear Panda say it</button><button type="button" class="lang-mic lang-mic--large ${ui.recording ? "is-recording" : ""}" data-lang-action="speaking-mic">🎙</button><div class="lang-wave ${ui.recording ? "is-on" : ""}">${"<i></i>".repeat(20)}</div>${ui.status ? `<div class="lang-feedback">${escapeHtml(ui.status)}</div>` : `<small>Tap the mic and say it</small>`}</div>`;
    } else if (ui.speakingMode === "chat") {
      const turns = ui.speakingTurns.length ? ui.speakingTurns : speaking.chat.map(([role, text, gloss]) => ({ role: role === "panda" ? "tutor" : "learner", text, gloss }));
      body = `<div class="lang-chat"><div class="lang-chat__turns">${turns.map((turn) => `<div class="lang-chat-line lang-chat-line--${turn.role}"><strong>${turn.role === "tutor" ? "Panda" : "You"}</strong><span>${escapeHtml(turn.text)}</span>${turn.gloss ? `<small>${escapeHtml(turn.gloss)}</small>` : ""}</div>`).join("")}</div><textarea class="lang-input" data-speaking-draft placeholder="Type your reply…">${escapeHtml(ui.speakingDraft)}</textarea><div class="lang-row"><button type="button" class="lang-mic ${ui.recording ? "is-recording" : ""}" data-lang-action="speaking-mic">🎙</button><button type="button" class="lang-btn" data-lang-action="speaking-send">Send</button></div></div>`;
    } else {
      body = `<div class="lang-picture-speaking"><div class="lang-picture-scene">☀️ <span>🏖️</span> 🐕 👨‍👩‍👧</div><h1>${escapeHtml(speaking.picturePrompt)}</h1><p>${speaking.pictureHints.map((hint) => `<span>${escapeHtml(hint)}</span>`).join("")}</p><textarea class="lang-input" data-speaking-draft placeholder="Say or type 2–3 sentences">${escapeHtml(ui.speakingDraft)}</textarea><button type="button" class="lang-mic lang-mic--large ${ui.recording ? "is-recording" : ""}" data-lang-action="speaking-mic">🎙</button><button type="button" class="lang-btn" data-lang-action="speaking-send">Ask Panda for a tip</button></div>`;
    }
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Speaking")}<main class="lang-center"><section class="lang-card lang-speaking-card"><div class="lang-mode-tabs">${modeTabs.map(([id, label]) => `<button type="button" data-speaking-mode="${id}" class="${ui.speakingMode === id ? "is-active" : ""}">${label}</button>`).join("")}</div>${body}</section></main>${renderDock("Hear the phrase", speaking.phrase)}</div>`;
  }

  async function submitSpeaking({ recordProgress = true, saveConversation = true } = {}) {
    const draft = String(ui.speakingDraft || "").trim();
    if (!draft) {
      setStatus("Say or type a reply first.");
      render();
      return;
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
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Panda could not answer just now.");
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
    if (["transform", "respond"].includes(activity.kind)) {
      const complete = activity.items.every((_, index) => String(ui.listenAnswers[`${key}:${index}`] || "").trim().length >= 2);
      return { complete, correct: complete ? activity.items.length : 0, total: activity.items.length };
    }
    const complete = ui.listenRoleplayDone || String(ui.speakingDraft || "").trim().length >= 3;
    return { complete, correct: complete ? 1 : 0, total: 1 };
  }

  function renderListening() {
    const unit = content().listening;
    const activity = unit.acts[ui.listenActivity];
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Listening")}<main class="lang-lesson"><div class="lang-listening-grid"><section class="lang-card lang-listening-source"><p class="eyebrow">Listening · ${escapeHtml(unit.topic)}</p><h1>${escapeHtml(unit.title)}</h1><div class="lang-audio-player"><button data-lang-speak="${escapeHtml(unit.lines.map((line) => line[1]).join(" "))}">▶</button><span>0:00 / ${escapeHtml(unit.duration)}</span><button data-lang-speak-slow="${escapeHtml(unit.lines.map((line) => line[1]).join(" "))}">0.75×</button></div><div class="lang-info-tabs">${unit.tabs.map((tab, index) => `<button data-listen-tab="${index}" class="${ui.listenTab === index ? "is-active" : ""}">${escapeHtml(tab)}</button>`).join("")}</div>${renderListeningTab(unit)}</section><section class="lang-card lang-listening-activities"><p class="eyebrow">${activeLang() === "fr" ? "Activités" : "Actividades"}</p><div class="lang-stepper">${unit.acts.map((_, index) => `<button data-listen-activity="${index}" class="${ui.listenActivity === index ? "is-active" : index < ui.listenActivity ? "is-done" : ""}">${index + 1}</button>`).join("")}</div><h2>${ui.listenActivity + 1} · ${escapeHtml(activity.title)}</h2><p>${escapeHtml(activity.instruction)}</p><div class="lang-activity-body">${renderListeningActivity(unit)}</div><div class="lang-row lang-row--between"><button class="lang-btn lang-btn--secondary" data-lang-action="listen-back" ${ui.listenActivity === 0 ? "disabled" : ""}>← Back</button><button class="lang-btn" data-lang-action="listen-next">${ui.listenActivity === unit.acts.length - 1 ? "Finish" : "Next activity →"}</button></div></section></div></main>${renderDock("Read instructions", activity.instruction)}</div>`;
  }

  function renderPeppa() {
    const episode = content().episode;
    if (ui.peppaStage === "reward") {
      const score = ui.peppaAnswers.filter((answer, index) => answer === content().episodeQs[index].answer).length;
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Watch Peppa")}<main class="lang-center"><section class="lang-card lang-peppa-reward"><img src="/panda-emojis-2ndedition/panda-happy-256.png" alt="Happy panda" /><p class="eyebrow">Episode complete</p><h1>${score}/5 — ${activeLang() === "fr" ? "très bien" : "muy bien"}!</h1><p>Your Watch Peppa progress is saved.</p><div class="lang-row"><button class="lang-btn" data-lang-action="peppa-again">Watch again</button><button class="lang-btn lang-btn--primary" data-lang-action="home">Language home →</button></div></section></main></div>`;
      return;
    }
    if (ui.peppaStage === "quiz") {
      const question = content().episodeQs[ui.peppaQuestion];
      root.innerHTML = `<div class="lang-shell">${renderTopbar("Watch Peppa")}<main class="lang-center"><section class="lang-card lang-peppa-quiz"><div class="lang-segmented-progress"><span style="width:${((ui.peppaQuestion + 1) / content().episodeQs.length) * 100}%"></span></div><span class="lang-mode-pill">Question ${ui.peppaQuestion + 1} of ${content().episodeQs.length} · ${escapeHtml(question.type)}</span><h1>${escapeHtml(question.q)}</h1><p>${escapeHtml(question.en)}</p>${question.type === "Pick the word you heard" ? `<button class="lang-hear" data-lang-speak="${escapeHtml(question.options[question.answer])}">▶ Play the clip</button>` : ""}<div class="lang-choice-grid">${question.options.map((option, index) => `<button data-peppa-answer="${index}" class="${ui.peppaPicked === index ? "is-selected" : ""}">${escapeHtml(option)}</button>`).join("")}</div><div class="lang-row lang-row--between"><button class="lang-mic" data-lang-action="peppa-mic">🎙</button><button class="lang-btn" data-lang-action="peppa-next">${ui.peppaQuestion === content().episodeQs.length - 1 ? "Finish" : "Next →"}</button></div></section></main>${renderDock("Read question", question.q)}</div>`;
      return;
    }
    const officialUrl = `https://www.youtube.com/watch?v=${episode.channelVideoId}`;
    const posterUrl = `https://i.ytimg.com/vi/${episode.videoId}/hqdefault.jpg`;
    root.innerHTML = `<div class="lang-shell">${renderTopbar("Watch Peppa")}<main class="lang-lesson"><section class="lang-card lang-peppa-watch"><div class="lang-row lang-row--between"><div><p class="eyebrow">${escapeHtml(episode.season)} · ${escapeHtml(episode.length)}</p><h1>${escapeHtml(episode.title)} <small>· ${escapeHtml(episode.en)}</small></h1></div><button type="button" class="lang-caption-toggle ${ui.captionsOn ? "is-on" : ""}" data-lang-action="captions" ${episode.captionsAvailable ? "" : "disabled"}>CC · ${episode.captionsAvailable ? `${content().native} subtitles ${ui.captionsOn ? "on" : "off"}` : "Official captions unavailable"}</button></div><a class="lang-video lang-video-link" href="${officialUrl}" target="_blank" rel="noreferrer" aria-label="Play ${escapeHtml(episode.title)} on the official YouTube channel"><img src="${posterUrl}" alt="${escapeHtml(episode.title)} official video thumbnail"><span><b>▶</b> Play on the official YouTube channel</span></a><p class="lang-note">Watch the first five minutes, then return for the quiz. This approved channel disables in-app playback; the lesson opens YouTube directly so learners do not meet a broken player.</p><button type="button" class="lang-btn lang-btn--primary" data-lang-action="peppa-quiz">I’ve finished — answer 5 questions →</button></section></main>${renderDock("Hear the title", episode.title)}</div>`;
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
      ui.screen = { watch: "peppa", speak: "speaking", listen: "listening" }[target.dataset.langOpen] || target.dataset.langOpen;
      resetLessonUi();
      render();
      return;
    }
    if (target.dataset.placementOption !== undefined) {
      ui.placementPicked = Number(target.dataset.placementOption);
      render();
      return;
    }
    if (target.dataset.vocabScene !== undefined) {
      ui.vocabScene = Number(target.dataset.vocabScene);
      ui.vocabWord = 0;
      render();
      return;
    }
    if (target.dataset.vocabAnswer) {
      ui.vocabPicked = target.dataset.vocabAnswer;
      const right = normalizeLanguageAnswer(ui.vocabPicked) === normalizeLanguageAnswer(ui.vocabTarget.word);
      if (right) await postProgress("vocab", `${activeLang()}:vocab:L${profile().sections.vocab.level}:${ui.vocabTarget.sceneId}:${ui.vocabTarget.word}`, { correct: 1, total: 1, vocabWord: ui.vocabTarget.word });
      else setStatus(`Not yet — ${ui.vocabTarget.word} means ${ui.vocabTarget.gloss}.`);
      render();
      return;
    }
    if (target.dataset.langTopic) {
      const topic = target.dataset.langTopic;
      const selected = new Set(ui.topicDraft.length ? ui.topicDraft : profile().vocab.topics);
      selected.has(topic) ? selected.delete(topic) : selected.add(topic);
      ui.topicDraft = [...selected];
      render();
      return;
    }
    if (target.dataset.grammarAnswer !== undefined) {
      ui.grammarPicked = Number(target.dataset.grammarAnswer);
      const eligible = content().grammar.filter((item) => LANGUAGE_LEVELS.findIndex((level) => level.name === item.level) <= profile().sections.grammar.level);
      const lesson = eligible[ui.grammarIndex % Math.max(1, eligible.length)] || content().grammar[0];
      if (ui.grammarPicked === lesson.check.answer) {
        const lessonNumber = profile().sections.grammar.lessonsDone + 1;
        await postProgress("grammar", `${activeLang()}:grammar:L${profile().sections.grammar.level}:${lessonNumber}:${lesson.topic}`, { correct: 1, total: 1 });
        ui.grammarIndex += 1;
        ui.grammarPicked = null;
      } else setStatus("Not quite. Look back at the examples and try again.");
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
      const verb = content().verbs[ui.verbIndex] || content().verbs[0];
      const tense = verb.tenses[ui.tenseIndex] || verb.tenses[0];
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
    if (target.dataset.listenReveal) { ui.listenRevealed[target.dataset.listenReveal] = true; render(); return; }
    if (target.dataset.peppaAnswer !== undefined) { ui.peppaPicked = Number(target.dataset.peppaAnswer); render(); return; }

    const action = target.dataset.langAction;
    if (!action) return;
    if (action === "exit") { onExit?.(); return; }
    if (action === "begin") { await chooseLanguage(languages.active || "fr", { begin: true }); return; }
    if (action === "home") { ui.screen = "home"; resetLessonUi(); render(); return; }
    if (action === "placement-next") { await advancePlacement(false); return; }
    if (action === "placement-skip") { await advancePlacement(true); return; }
    if (action === "placement-mic") { startRecognition((text) => { ui.placementDraft = text; setStatus(`I heard: “${text}”`); render(); }); return; }
    if (action === "topics-edit") { profile().vocab.topics = []; ui.topicDraft = []; render(); return; }
    if (action === "topics-save") {
      if (ui.topicDraft.length < 2) { setStatus("Choose at least two topics."); render(); return; }
      try { const payload = await apiPost("/api/languages/vocab/topics", { lang: activeLang(), topics: ui.topicDraft }); mergeLanguages(payload?.languages); setStatus("Topics saved."); } catch (error) { setStatus(error.message); }
      render(); return;
    }
    if (action === "vocab-next") { ui.vocabWord += 1; ui.vocabPicked = ""; setStatus(""); render(); return; }
    if (action === "vocab-mic") { startRecognition((text) => { ui.vocabTyped = text; ui.vocabChecked = true; render(); }); return; }
    if (action === "vocab-show") { ui.vocabTyped = ui.vocabTarget.word; ui.vocabChecked = true; await postProgress("vocab", `${activeLang()}:vocab-review:L${profile().sections.vocab.level}:${ui.vocabTarget.word}`, { reviewWord: ui.vocabTarget.word, complete: false }); render(); return; }
    if (action === "vocab-check") {
      ui.vocabChecked = true;
      const correct = normalizeLanguageAnswer(ui.vocabTyped) === normalizeLanguageAnswer(ui.vocabTarget.word);
      const lessonNumber = profile().sections.vocab.lessonsDone + 1;
      await postProgress("vocab", `${activeLang()}:vocab-topic:L${profile().sections.vocab.level}:${lessonNumber}:${ui.vocabTarget.topic}:${ui.vocabTarget.word}`, { correct: correct ? 1 : 0, total: 1, complete: correct, ...(correct ? { vocabWord: ui.vocabTarget.word } : { reviewWord: ui.vocabTarget.word }) });
      if (correct) {
        ui.vocabWord += 1;
        ui.vocabTyped = "";
        ui.vocabChecked = false;
      }
      render(); return;
    }
    if (action === "verbs-check") {
      ui.verbChecked = true;
      const verb = content().verbs[ui.verbIndex] || content().verbs[0]; const tense = verb.tenses[ui.tenseIndex] || verb.tenses[0];
      const score = tense.rows.filter(([_, form], index) => normalizeLanguageAnswer(ui.verbWriteAnswers[index]) === normalizeLanguageAnswer(form)).length;
      if (score === tense.rows.length) await postProgress("verbs", `${activeLang()}:verb:L${profile().sections.verbs.level}:${verb.inf}:${tense.id}`, { correct: score, total: tense.rows.length, verbKey: `${verb.inf}|${tense.name}` });
      render(); return;
    }
    if (action === "verbs-finish") {
      const verb = content().verbs[ui.verbIndex] || content().verbs[0]; const tense = verb.tenses[ui.tenseIndex] || verb.tenses[0];
      const correct = tense.blank.filter((index) => normalizeLanguageAnswer(ui.verbTapAnswers[index]) === normalizeLanguageAnswer(tense.rows[index][1])).length;
      if (correct === tense.blank.length) await postProgress("verbs", `${activeLang()}:verb:L${profile().sections.verbs.level}:${verb.inf}:${tense.id}`, { correct, total: tense.blank.length, verbKey: `${verb.inf}|${tense.name}` });
      else setStatus("Check each highlighted form and try again.");
      render(); return;
    }
    if (action === "speaking-mic") {
      startRecognition((text) => {
        ui.speakingDraft = text;
        if (ui.speakingMode === "daily") {
          void submitSpeaking();
          return;
        }
        setStatus(`I heard: “${text}”`);
        render();
      });
      return;
    }
    if (action === "speaking-send") { await submitSpeaking(); return; }
    if (action === "listen-script") { ui.listenScript = true; render(); return; }
    if (action === "listen-back") { ui.listenActivity = Math.max(0, ui.listenActivity - 1); render(); return; }
    if (action === "listen-next") {
      const unit = content().listening;
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
        const lessonNumber = profile().sections.listen.lessonsDone + 1;
        await postProgress("listen", `${activeLang()}:listen:L${profile().sections.listen.level}:${lessonNumber}:${unit.id}`, totals);
        ui.listenActivity = 0;
        ui.listenAnswers = {};
        ui.listenRevealed = {};
        ui.listenScript = false;
        ui.listenRoleplayDone = false;
        ui.speakingDraft = "";
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
    if (action === "peppa-quiz") { ui.peppaStage = "quiz"; ui.peppaQuestion = 0; ui.peppaAnswers = []; ui.peppaPicked = null; render(); return; }
    if (action === "peppa-mic") { startRecognition((text) => { const question = content().episodeQs[ui.peppaQuestion]; ui.peppaPicked = question.options.findIndex((option) => normalizeLanguageAnswer(text).includes(normalizeLanguageAnswer(option))); render(); }); return; }
    if (action === "peppa-next") {
      if (ui.peppaPicked === null) { setStatus("Choose or say an answer first."); render(); return; }
      ui.peppaAnswers[ui.peppaQuestion] = ui.peppaPicked;
      if (ui.peppaQuestion < content().episodeQs.length - 1) { ui.peppaQuestion += 1; ui.peppaPicked = null; render(); return; }
      const score = ui.peppaAnswers.filter((answer, index) => answer === content().episodeQs[index].answer).length;
      const lessonNumber = profile().sections.watch.lessonsDone + 1;
      await postProgress("watch", `${activeLang()}:watch:L${profile().sections.watch.level}:${lessonNumber}:${content().episode.id}`, { correct: score, total: content().episodeQs.length, peppaId: content().episode.id });
      ui.peppaStage = "reward"; render(); return;
    }
    if (action === "peppa-again") { ui.peppaStage = "watch"; ui.peppaQuestion = 0; ui.peppaAnswers = []; render(); return; }
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
