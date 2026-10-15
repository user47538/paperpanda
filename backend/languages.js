export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const LANGUAGE_SECTION_IDS = ["vocab", "grammar", "verbs", "speak", "listen", "watch"];
export const LANGUAGE_IDS = ["fr", "es"];
export const LANGUAGE_CURRICULUM_UNITS_PER_LEVEL = 24;
export const LANGUAGE_CURRICULUM_MAX_LEVEL = 2;
export const LANGUAGE_LESSON_MASTERY = 0.85;
export const LANGUAGE_CURRICULUM_VERSION = 1;
export const LANGUAGE_VOCABULARY_COUNTS = {
  fr: { A1: 496, A2: 1303, B1: 1713, B2: 2039, C1: 3259, C2: 398 },
  es: { A1: 454, A2: 1318, B1: 1725, B2: 2104, C1: 2601, C2: 292 }
};

const PANDA_REWARDS = ["happy", "smart", "cowboy", "hearts", "paint", "confused", "crying", "sick"];

function clampInteger(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Math.round(Number(value || 0) || 0)));
}

function normalizeStringArray(value, maximum = 500) {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(-maximum)
    : [];
}

function normalizeIndexArray(value, maximum) {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 0 && item < maximum))]
    : [];
}

function createDefaultVocabularyProgress() {
  return Object.fromEntries(LANGUAGE_LEVELS.map((level) => [level, { introduced: [], mastered: [], review: [] }]));
}

function isPlausibleTargetLanguage(value, lang, level = 0, questionId = "") {
  const normalized = String(value || "").trim().toLocaleLowerCase().replaceAll("’", "'");
  const words = normalized.match(/[a-zà-ÿñ']+/g) || [];
  const minimumWords = [3, 4, 7][clampInteger(level, 0, 2)];
  if (words.length < minimumWords) return false;
  const markers = lang === "fr"
    ? ["je", "j'", "me", "m'", "mon", "ma", "mes", "appelle", "habite", "vis", "ai", "suis", "est", "était", "et", "mais", "le", "la", "les", "un", "une", "des", "du", "de", "dans", "à", "au", "avec", "pour", "que", "aime", "adore", "faire", "jouer", "hier", "parce", "car", "avis", "pense", "crois", "voudrais", "pourriez", "excusez", "plaît"]
    : ["me", "mi", "mis", "llamo", "vivo", "tengo", "soy", "está", "estaba", "y", "pero", "el", "la", "los", "las", "un", "una", "de", "en", "al", "con", "para", "que", "qué", "te", "gusta", "encanta", "hacer", "jugar", "ayer", "porque", "opinión", "pienso", "creo", "quisiera", "podría", "disculpe", "favor"];
  const englishMarkers = new Set(["and", "my", "friends", "play", "with", "like", "name", "years", "old", "the", "to", "because", "think", "would", "please", "live", "yesterday", "food", "cold"]);
  const markerHits = markers.filter((marker) => words.includes(marker) || (marker.endsWith("'") && normalized.includes(marker))).length;
  const englishHits = words.filter((word) => englishMarkers.has(word)).length;
  if (markerHits < 2 || englishHits > Math.max(1, Math.floor(words.length / 4))) return false;

  const id = String(questionId || "");
  if (id.includes("speak-a2-1")) {
    return lang === "fr" ? /\b(aime|adore|préfère|jouer|faire)\b/.test(normalized) : /\b(gusta|encanta|prefiero|jugar|hacer)\b/.test(normalized);
  }
  if (id.includes("speak-a2-2")) {
    return lang === "fr" ? /\b(hier|ai|suis|étais|avons|sommes)\b/.test(normalized) : /\b(ayer|fui|hice|estuve|he|hemos)\b/.test(normalized);
  }
  if (id.includes("speak-b1-1")) {
    return lang === "fr" ? /\b(parce|car|avis|pense|crois)\b/.test(normalized) : /\b(porque|opinión|pienso|creo)\b/.test(normalized);
  }
  if (id.includes("speak-b1-2")) {
    return lang === "fr" ? /\b(voudrais|pourriez|excusez|plaît)\b/.test(normalized) : /\b(quisiera|podría|disculpe|favor)\b/.test(normalized);
  }
  return true;
}

function createDefaultSection(sectionId) {
  return {
    level: 0,
    lessonsDone: 0,
    lessonsToNext: LANGUAGE_CURRICULUM_UNITS_PER_LEVEL
  };
}

export function createDefaultLanguageProfile(lang = "fr") {
  const firstVocabularyCount = LANGUAGE_VOCABULARY_COUNTS[lang]?.A1 || 496;
  const sections = Object.fromEntries(LANGUAGE_SECTION_IDS.map((sectionId) => [sectionId, createDefaultSection(sectionId)]));
  sections.vocab.lessonsToNext = firstVocabularyCount;
  return {
    curriculumVersion: LANGUAGE_CURRICULUM_VERSION,
    placementDone: false,
    placementAt: "",
    sections,
    vocab: {
      thousandLearned: [],
      topics: [],
      review: [],
      source: "minddory",
      levelProgress: createDefaultVocabularyProgress()
    },
    verbsMastered: {},
    peppaWatched: [],
    completedLessons: {}
  };
}

export function createDefaultLanguagesState() {
  return {
    version: 4,
    active: "",
    profiles: {
      fr: createDefaultLanguageProfile("fr"),
      es: createDefaultLanguageProfile("es")
    },
    rewards: {
      pandas: [],
      streakDays: 0,
      lastActiveDate: ""
    }
  };
}

function normalizeLanguageProfile(value, lang) {
  const base = createDefaultLanguageProfile(lang);
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const hasCurrentCurriculum = Number(source.curriculumVersion) === LANGUAGE_CURRICULUM_VERSION;
  const vocab = source.vocab && typeof source.vocab === "object" && !Array.isArray(source.vocab) ? source.vocab : {};
  const completedLessons = source.completedLessons && typeof source.completedLessons === "object" && !Array.isArray(source.completedLessons)
    ? Object.fromEntries(
        Object.entries(source.completedLessons)
          .map(([lessonId, completedAt]) => [String(lessonId || "").slice(0, 160), String(completedAt || "").slice(0, 40)])
          .filter(([lessonId]) => lessonId)
          .slice(-600)
      )
    : {};

  const normalizedSections = Object.fromEntries(LANGUAGE_SECTION_IDS.map((sectionId) => {
    const section = source.sections?.[sectionId] || {};
    const level = clampInteger(section.level, 0, sectionId === "vocab" ? LANGUAGE_LEVELS.length - 1 : LANGUAGE_CURRICULUM_MAX_LEVEL);
    const vocabularyCount = LANGUAGE_VOCABULARY_COUNTS[lang]?.[LANGUAGE_LEVELS[level]] || 1;
    const lessonsToNext = sectionId === "vocab"
      ? vocabularyCount
      : LANGUAGE_CURRICULUM_UNITS_PER_LEVEL;
    return [sectionId, {
      level,
      lessonsDone: sectionId === "vocab" || hasCurrentCurriculum ? clampInteger(section.lessonsDone, 0, lessonsToNext) : 0,
      lessonsToNext
    }];
  }));
  const levelProgress = Object.fromEntries(LANGUAGE_LEVELS.map((level) => {
    const total = LANGUAGE_VOCABULARY_COUNTS[lang]?.[level] || 1;
    const progress = vocab.levelProgress?.[level] || {};
    const introduced = normalizeIndexArray(progress.introduced, total);
    const introducedSet = new Set(introduced);
    const mastered = normalizeIndexArray(progress.mastered, total).filter((index) => introducedSet.has(index));
    const masteredSet = new Set(mastered);
    const review = normalizeIndexArray(progress.review, total).filter((index) => introducedSet.has(index) && !masteredSet.has(index));
    return [level, { introduced, mastered, review }];
  }));
  const currentVocabularyLevel = LANGUAGE_LEVELS[normalizedSections.vocab.level];
  normalizedSections.vocab.lessonsDone = levelProgress[currentVocabularyLevel].mastered.length;

  return {
    curriculumVersion: LANGUAGE_CURRICULUM_VERSION,
    placementDone: Boolean(source.placementDone),
    placementAt: String(source.placementAt || "").slice(0, 40),
    sections: normalizedSections,
    vocab: {
      thousandLearned: normalizeStringArray(vocab.thousandLearned, 1200),
      topics: normalizeStringArray(vocab.topics, 24),
      review: normalizeStringArray(vocab.review, 300),
      source: "minddory",
      levelProgress
    },
    verbsMastered: source.verbsMastered && typeof source.verbsMastered === "object" && !Array.isArray(source.verbsMastered)
      ? Object.fromEntries(Object.entries(source.verbsMastered).slice(-300).map(([key, mastered]) => [String(key).slice(0, 180), Boolean(mastered)]))
      : {},
    peppaWatched: normalizeStringArray(source.peppaWatched, 100),
    completedLessons
  };
}

export function normalizeLanguagesState(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const rewards = source.rewards && typeof source.rewards === "object" && !Array.isArray(source.rewards) ? source.rewards : {};
  return {
    version: 4,
    active: LANGUAGE_IDS.includes(String(source.active || "")) ? String(source.active) : "",
    profiles: {
      fr: normalizeLanguageProfile(source.profiles?.fr, "fr"),
      es: normalizeLanguageProfile(source.profiles?.es, "es")
    },
    rewards: {
      pandas: normalizeStringArray(rewards.pandas, PANDA_REWARDS.length).filter((id) => PANDA_REWARDS.includes(id)),
      streakDays: clampInteger(rewards.streakDays, 0, 100000),
      lastActiveDate: /^\d{4}-\d{2}-\d{2}$/.test(String(rewards.lastActiveDate || "")) ? String(rewards.lastActiveDate) : ""
    }
  };
}

export function resetLanguageLevels(value) {
  const current = normalizeLanguagesState(value);
  const reset = createDefaultLanguagesState();
  reset.active = current.active;
  reset.rewards = current.rewards;
  for (const lang of LANGUAGE_IDS) {
    reset.profiles[lang].vocab.topics = current.profiles[lang].vocab.topics;
  }
  return reset;
}

function awardNextPanda(languages) {
  const next = PANDA_REWARDS.find((pandaId) => !languages.rewards.pandas.includes(pandaId));
  if (next) {
    languages.rewards.pandas.push(next);
  }
  return next || "";
}

function dateDifferenceInDays(left, right) {
  const leftTime = Date.parse(`${left}T00:00:00Z`);
  const rightTime = Date.parse(`${right}T00:00:00Z`);
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) {
    return null;
  }
  return Math.round((rightTime - leftTime) / 86_400_000);
}

function updateStreak(languages, activityDate) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(activityDate || ""))
    ? String(activityDate)
    : new Date().toISOString().slice(0, 10);
  const previous = languages.rewards.lastActiveDate;
  if (previous === date) {
    return false;
  }
  const difference = previous ? dateDifferenceInDays(previous, date) : null;
  languages.rewards.streakDays = difference === 1 ? languages.rewards.streakDays + 1 : 1;
  languages.rewards.lastActiveDate = date;
  return languages.rewards.streakDays > 0 && languages.rewards.streakDays % 7 === 0;
}

export function applyPlacementResult(value, lang, answers) {
  const languages = normalizeLanguagesState(value);
  if (!LANGUAGE_IDS.includes(lang)) {
    throw new Error("A supported language is required.");
  }
  const profile = languages.profiles[lang];
  const grouped = Object.fromEntries(LANGUAGE_SECTION_IDS.map((sectionId) => [sectionId, []]));
  const seenIds = new Set();
  (Array.isArray(answers) ? answers : []).slice(0, 72).forEach((answer) => {
    const section = String(answer?.section || "");
    const id = String(answer?.id || "").slice(0, 80);
    if (!grouped[section] || !id || seenIds.has(id)) {
      return;
    }
    seenIds.add(id);
    const skipped = Boolean(answer?.skipped);
    grouped[section].push({
      id,
      skipped,
      correct: !skipped && (section === "speak" ? isPlausibleTargetLanguage(answer?.response, lang, answer?.level, id) : Boolean(answer?.correct)),
      level: clampInteger(answer?.level, 0, LANGUAGE_CURRICULUM_MAX_LEVEL)
    });
  });

  const levels = {};
  LANGUAGE_SECTION_IDS.forEach((sectionId) => {
    const sectionAnswers = grouped[sectionId];
    const correctByLevel = [0, 1, 2].map((levelIndex) => sectionAnswers.filter((answer) => answer.level === levelIndex && answer.correct).length);
    const submittedByLevel = [0, 1, 2].map((levelIndex) => sectionAnswers.filter((answer) => answer.level === levelIndex).length);
    const totalCorrect = correctByLevel.reduce((sum, count) => sum + count, 0);
    let level = 0;
    const completeDiagnostic = submittedByLevel.every((count) => count >= 2);
    const b1Evidence = completeDiagnostic && totalCorrect >= 4 && correctByLevel.every((count) => count >= 1);
    const a2Evidence = submittedByLevel[0] >= 2 && submittedByLevel[1] >= 2
      && correctByLevel[0] >= 1 && correctByLevel[1] >= 1
      && correctByLevel[0] + correctByLevel[1] >= 3;
    if (b1Evidence) level = 2;
    else if (a2Evidence) level = 1;
    profile.sections[sectionId].level = level;
    profile.sections[sectionId].lessonsDone = 0;
    if (sectionId === "vocab") profile.sections[sectionId].lessonsToNext = LANGUAGE_VOCABULARY_COUNTS[lang][LANGUAGE_LEVELS[level]];
    levels[sectionId] = level;
  });
  profile.placementDone = true;
  profile.placementAt = new Date().toISOString();
  const pandaAwarded = awardNextPanda(languages);
  return { languages, levels, pandaAwarded };
}

export function applyLanguageProgress(value, { lang, section, lessonId, correct = 0, total = 0, activityDate = "", complete = true }) {
  const languages = normalizeLanguagesState(value);
  if (!LANGUAGE_IDS.includes(lang) || !LANGUAGE_SECTION_IDS.includes(section)) {
    throw new Error("A supported language and section are required.");
  }
  const cleanLessonId = String(lessonId || "").trim().slice(0, 160);
  if (!cleanLessonId) {
    throw new Error("A lesson ID is required.");
  }
  const profile = languages.profiles[lang];
  const sectionProgress = profile.sections[section];
  const alreadyCompleted = Boolean(profile.completedLessons[cleanLessonId]);
  const cleanCorrect = Math.max(0, Number(correct) || 0);
  const cleanTotal = Math.max(0, Number(total) || 0);
  const accuracy = cleanTotal > 0 ? Math.min(1, cleanCorrect / cleanTotal) : 0;
  const masteryMet = accuracy >= LANGUAGE_LESSON_MASTERY;
  let levelledUp = false;
  let pandaAwarded = "";

  if (section === "vocab") {
    return { languages, alreadyCompleted: true, levelledUp, pandaAwarded };
  }

  if (!alreadyCompleted && complete !== false && masteryMet) {
    profile.completedLessons[cleanLessonId] = new Date().toISOString();
    sectionProgress.lessonsDone += 1;
    if (sectionProgress.lessonsDone >= sectionProgress.lessonsToNext && sectionProgress.level < LANGUAGE_CURRICULUM_MAX_LEVEL) {
      sectionProgress.level += 1;
      sectionProgress.lessonsDone = 0;
      levelledUp = true;
      pandaAwarded = awardNextPanda(languages);
    }
    if (section === "watch" && !pandaAwarded) {
      pandaAwarded = awardNextPanda(languages);
    }
    if (updateStreak(languages, activityDate) && !pandaAwarded) {
      pandaAwarded = awardNextPanda(languages);
    }
  }

  return { languages, alreadyCompleted, levelledUp, pandaAwarded, masteryMet, accuracy };
}

export function applyVocabularySession(value, { lang, level, results, activityDate = "" }) {
  const languages = normalizeLanguagesState(value);
  if (!LANGUAGE_IDS.includes(lang)) {
    throw new Error("A supported language is required.");
  }
  const profile = languages.profiles[lang];
  const currentLevelIndex = profile.sections.vocab.level;
  const currentLevel = LANGUAGE_LEVELS[currentLevelIndex];
  if (String(level || "").toUpperCase() !== currentLevel) {
    throw new Error(`Vocabulary progress must be submitted for the current ${currentLevel} level.`);
  }
  const totalWords = LANGUAGE_VOCABULARY_COUNTS[lang][currentLevel];
  const cleanResults = Array.isArray(results)
    ? [...new Map(results.slice(0, 30).map((result) => {
        const index = Number(result?.index);
        return [index, { index, correct: result?.correct === true }];
      })).values()].filter((result) => Number.isInteger(result.index) && result.index >= 0 && result.index < totalWords)
    : [];
  if (!cleanResults.length) {
    throw new Error("At least one vocabulary result is required.");
  }

  const progress = profile.vocab.levelProgress[currentLevel];
  const introduced = new Set(progress.introduced);
  const mastered = new Set(progress.mastered);
  const review = new Set(progress.review);
  cleanResults.forEach(({ index, correct }) => {
    introduced.add(index);
    if (correct) {
      mastered.add(index);
      review.delete(index);
    } else {
      mastered.delete(index);
      review.add(index);
    }
  });
  progress.introduced = [...introduced].sort((left, right) => left - right);
  progress.mastered = [...mastered].sort((left, right) => left - right);
  progress.review = [...review].sort((left, right) => left - right);
  profile.sections.vocab.lessonsDone = progress.mastered.length;
  profile.sections.vocab.lessonsToNext = totalWords;

  const accuracy = progress.mastered.length / totalWords;
  const levelComplete = progress.introduced.length === totalWords && accuracy > 0.95;
  let levelledUp = false;
  let pandaAwarded = "";
  if (levelComplete && currentLevelIndex < LANGUAGE_LEVELS.length - 1) {
    profile.sections.vocab.level += 1;
    const nextLevel = LANGUAGE_LEVELS[profile.sections.vocab.level];
    profile.sections.vocab.lessonsDone = profile.vocab.levelProgress[nextLevel].mastered.length;
    profile.sections.vocab.lessonsToNext = LANGUAGE_VOCABULARY_COUNTS[lang][nextLevel];
    levelledUp = true;
    pandaAwarded = awardNextPanda(languages);
  }
  if (updateStreak(languages, activityDate) && !pandaAwarded) {
    pandaAwarded = awardNextPanda(languages);
  }

  return {
    languages,
    levelledUp,
    pandaAwarded,
    progress: {
      level: currentLevel,
      introduced: progress.introduced.length,
      mastered: progress.mastered.length,
      review: progress.review.length,
      total: totalWords,
      accuracy
    }
  };
}

export function setLanguageTopics(value, lang, topics) {
  const languages = normalizeLanguagesState(value);
  if (!LANGUAGE_IDS.includes(lang)) {
    throw new Error("A supported language is required.");
  }
  languages.profiles[lang].vocab.topics = normalizeStringArray(topics, 12);
  return languages;
}
