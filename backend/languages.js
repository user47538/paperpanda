export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const LANGUAGE_SECTION_IDS = ["vocab", "grammar", "verbs", "speak", "listen", "watch"];
export const LANGUAGE_IDS = ["fr", "es"];

const PANDA_REWARDS = ["happy", "smart", "cowboy", "hearts", "paint", "confused", "crying", "sick"];

function clampInteger(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Math.round(Number(value || 0) || 0)));
}

function normalizeStringArray(value, maximum = 500) {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(-maximum)
    : [];
}

function isPlausibleTargetLanguage(value, lang) {
  const normalized = String(value || "").trim().toLocaleLowerCase().replaceAll("’", "'");
  const words = normalized.match(/[a-zà-ÿñ']+/g) || [];
  if (words.length < 3) return false;
  const markers = lang === "fr"
    ? ["je", "j'", "me", "m'", "appelle", "ai", "suis", "et", "le", "la", "un", "une", "tu", "que", "aime", "faire", "jouer", "au", "avec", "mes", "amis"]
    : ["me", "llamo", "tengo", "soy", "y", "el", "la", "un", "una", "qué", "que", "te", "gusta", "hacer", "mi", "jugar", "al", "con", "mis", "amigos"];
  const englishMarkers = new Set(["and", "my", "friends", "play", "with", "like", "name", "years", "old", "the", "to"]);
  const markerHits = markers.filter((marker) => words.includes(marker) || (marker.endsWith("'") && normalized.includes(marker))).length;
  const englishHits = words.filter((word) => englishMarkers.has(word)).length;
  return markerHits >= 2 && englishHits <= Math.max(1, Math.floor(words.length / 4));
}

function createDefaultSection(sectionId) {
  return {
    level: 0,
    lessonsDone: 0,
    lessonsToNext: sectionId === "watch" ? 8 : 10
  };
}

export function createDefaultLanguageProfile() {
  return {
    placementDone: false,
    placementAt: "",
    sections: Object.fromEntries(LANGUAGE_SECTION_IDS.map((sectionId) => [sectionId, createDefaultSection(sectionId)])),
    vocab: {
      thousandLearned: [],
      topics: [],
      review: []
    },
    verbsMastered: {},
    peppaWatched: [],
    completedLessons: {}
  };
}

export function createDefaultLanguagesState() {
  return {
    version: 2,
    active: "",
    profiles: {
      fr: createDefaultLanguageProfile(),
      es: createDefaultLanguageProfile()
    },
    rewards: {
      pandas: [],
      streakDays: 0,
      lastActiveDate: ""
    }
  };
}

function normalizeLanguageProfile(value) {
  const base = createDefaultLanguageProfile();
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const vocab = source.vocab && typeof source.vocab === "object" && !Array.isArray(source.vocab) ? source.vocab : {};
  const completedLessons = source.completedLessons && typeof source.completedLessons === "object" && !Array.isArray(source.completedLessons)
    ? Object.fromEntries(
        Object.entries(source.completedLessons)
          .map(([lessonId, completedAt]) => [String(lessonId || "").slice(0, 160), String(completedAt || "").slice(0, 40)])
          .filter(([lessonId]) => lessonId)
          .slice(-600)
      )
    : {};

  return {
    placementDone: Boolean(source.placementDone),
    placementAt: String(source.placementAt || "").slice(0, 40),
    sections: Object.fromEntries(LANGUAGE_SECTION_IDS.map((sectionId) => {
      const section = source.sections?.[sectionId] || {};
      const lessonsToNext = clampInteger(section.lessonsToNext || base.sections[sectionId].lessonsToNext, 1, 100);
      return [sectionId, {
        level: clampInteger(section.level, 0, LANGUAGE_LEVELS.length - 1),
        lessonsDone: clampInteger(section.lessonsDone, 0, lessonsToNext),
        lessonsToNext
      }];
    })),
    vocab: {
      thousandLearned: normalizeStringArray(vocab.thousandLearned, 1200),
      topics: normalizeStringArray(vocab.topics, 24),
      review: normalizeStringArray(vocab.review, 300)
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
    version: 2,
    active: LANGUAGE_IDS.includes(String(source.active || "")) ? String(source.active) : "",
    profiles: {
      fr: normalizeLanguageProfile(source.profiles?.fr),
      es: normalizeLanguageProfile(source.profiles?.es)
    },
    rewards: {
      pandas: normalizeStringArray(rewards.pandas, PANDA_REWARDS.length).filter((id) => PANDA_REWARDS.includes(id)),
      streakDays: clampInteger(rewards.streakDays, 0, 100000),
      lastActiveDate: /^\d{4}-\d{2}-\d{2}$/.test(String(rewards.lastActiveDate || "")) ? String(rewards.lastActiveDate) : ""
    }
  };
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
  (Array.isArray(answers) ? answers : []).slice(0, 40).forEach((answer) => {
    const section = String(answer?.section || "");
    if (!grouped[section]) {
      return;
    }
    const skipped = Boolean(answer?.skipped);
    grouped[section].push({
      skipped,
      correct: !skipped && (section === "speak" ? isPlausibleTargetLanguage(answer?.response, lang) : Boolean(answer?.correct)),
      level: clampInteger(answer?.level, 0, 3)
    });
  });

  const levels = {};
  LANGUAGE_SECTION_IDS.forEach((sectionId) => {
    const attempted = grouped[sectionId].filter((answer) => !answer.skipped);
    const correct = attempted.filter((answer) => answer.correct);
    const accuracy = attempted.length ? correct.length / attempted.length : 0;
    const hardestCorrect = correct.reduce((highest, answer) => Math.max(highest, answer.level), 0);
    let level = 0;
    if (attempted.length && accuracy >= 0.85) {
      level = Math.min(3, Math.max(1, hardestCorrect + 1));
    } else if (attempted.length && accuracy >= 0.55) {
      level = Math.min(2, hardestCorrect);
    }
    profile.sections[sectionId].level = level;
    profile.sections[sectionId].lessonsDone = 0;
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
  let levelledUp = false;
  let pandaAwarded = "";

  if (!alreadyCompleted && complete !== false) {
    profile.completedLessons[cleanLessonId] = new Date().toISOString();
    sectionProgress.lessonsDone += 1;
    if (sectionProgress.lessonsDone >= sectionProgress.lessonsToNext && sectionProgress.level < LANGUAGE_LEVELS.length - 1) {
      sectionProgress.level += 1;
      sectionProgress.lessonsDone = 0;
      levelledUp = true;
      pandaAwarded = awardNextPanda(languages);
    }
    if (section === "watch" && Number(total) > 0 && Number(correct) / Number(total) >= 0.8 && !pandaAwarded) {
      pandaAwarded = awardNextPanda(languages);
    }
    if (updateStreak(languages, activityDate) && !pandaAwarded) {
      pandaAwarded = awardNextPanda(languages);
    }
  }

  return { languages, alreadyCompleted, levelledUp, pandaAwarded };
}

export function setLanguageTopics(value, lang, topics) {
  const languages = normalizeLanguagesState(value);
  if (!LANGUAGE_IDS.includes(lang)) {
    throw new Error("A supported language is required.");
  }
  languages.profiles[lang].vocab.topics = normalizeStringArray(topics, 12);
  return languages;
}
