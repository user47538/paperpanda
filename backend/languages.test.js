import test from "node:test";
import assert from "node:assert/strict";
import {
  applyLanguageProgress,
  applyPlacementResult,
  applyVocabularySession,
  createDefaultLanguagesState,
  LANGUAGE_CURRICULUM_UNITS_PER_LEVEL,
  LANGUAGE_VOCABULARY_COUNTS,
  normalizeLanguagesState,
  setLanguageTopics
} from "./languages.js";

test("language defaults create independent French and Spanish section progress", () => {
  const languages = createDefaultLanguagesState();
  languages.profiles.fr.sections.vocab.lessonsDone = 3;
  assert.equal(languages.profiles.es.sections.vocab.lessonsDone, 0);
  assert.equal(languages.profiles.fr.sections.watch.lessonsToNext, LANGUAGE_CURRICULUM_UNITS_PER_LEVEL);
  assert.equal(languages.profiles.fr.sections.vocab.lessonsToNext, 496);
  assert.equal(languages.profiles.es.sections.vocab.lessonsToNext, 454);
});

function placementAnswers(section, correctness, responses = []) {
  return correctness.map((correct, index) => ({
    id: `fr-${section}-${["a1-1", "a1-2", "a2-1", "a2-2", "b1-1", "b1-2"][index]}`,
    section,
    level: Math.floor(index / 2),
    correct,
    response: responses[index] || ""
  }));
}

const validFrenchSpeaking = [
  "Je m'appelle Amy.",
  "J'habite à Sydney.",
  "J'aime jouer au tennis.",
  "Hier, je suis allée au parc.",
  "À mon avis, ils sont utiles parce que je révise mieux.",
  "Excusez-moi, mon repas est froid; pourriez-vous le remplacer, s'il vous plaît ?"
];

test("placement requires evidence across bands, scores skills independently and awards the first panda", () => {
  const answers = ["vocab", "grammar", "listen", "watch"].flatMap((section) => placementAnswers(section, [true, true, true, false, true, false]));
  answers.push(...placementAnswers("verbs", [true, true, true, false, false, false]));
  answers.push(...placementAnswers("speak", [true, true, true, true, true, true], validFrenchSpeaking));
  const result = applyPlacementResult(createDefaultLanguagesState(), "fr", answers);
  assert.equal(result.languages.profiles.fr.placementDone, true);
  assert.equal(result.languages.profiles.es.placementDone, false);
  assert.equal(result.levels.vocab, 2);
  assert.equal(result.languages.profiles.fr.sections.vocab.lessonsToNext, LANGUAGE_VOCABULARY_COUNTS.fr.B1);
  assert.equal(result.levels.verbs, 1);
  assert.equal(result.levels.speak, 2);
  assert.equal(result.pandaAwarded, "happy");
});

test("one lucky difficult answer cannot place a learner above A1", () => {
  const result = applyPlacementResult(createDefaultLanguagesState(), "fr", placementAnswers("grammar", [false, false, false, false, true, false]));
  assert.equal(result.levels.grammar, 0);
});

test("placement rejects non-target-language speaking and checks the requested language feature", () => {
  const result = applyPlacementResult(createDefaultLanguagesState(), "fr", placementAnswers(
    "speak",
    [true, true, true, true, true, true],
    Array(6).fill("this is only an English answer")
  ));
  assert.equal(result.levels.speak, 0);

  const incompleteFeature = [...validFrenchSpeaking];
  incompleteFeature[4] = "Les devoirs sont utiles tous les jours pour les élèves.";
  incompleteFeature[5] = "Mon repas est froid et je ne suis pas contente du tout.";
  const featureResult = applyPlacementResult(createDefaultLanguagesState(), "fr", placementAnswers("speak", [true, true, true, true, true, true], incompleteFeature));
  assert.equal(featureResult.levels.speak, 1);
});

test("progress is idempotent and levels up after 24 mastered units", () => {
  let languages = createDefaultLanguagesState();
  let result = applyLanguageProgress(languages, { lang: "fr", section: "grammar", lessonId: "g-1", correct: 9, total: 10, activityDate: "2026-10-14" });
  languages = result.languages;
  result = applyLanguageProgress(languages, { lang: "fr", section: "grammar", lessonId: "g-1", correct: 9, total: 10, activityDate: "2026-10-14" });
  assert.equal(result.alreadyCompleted, true);
  assert.equal(result.languages.profiles.fr.sections.grammar.lessonsDone, 1);
  for (let unit = 2; unit <= LANGUAGE_CURRICULUM_UNITS_PER_LEVEL; unit += 1) {
    result = applyLanguageProgress(result.languages, { lang: "fr", section: "grammar", lessonId: `g-${unit}`, correct: 9, total: 10, activityDate: "2026-10-15" });
  }
  assert.equal(result.levelledUp, true);
  assert.equal(result.languages.profiles.fr.sections.grammar.level, 1);
  assert.equal(result.languages.profiles.fr.sections.grammar.lessonsDone, 0);
});

test("a lesson below 85 percent is review practice and cannot advance", () => {
  const result = applyLanguageProgress(createDefaultLanguagesState(), {
    lang: "es", section: "listen", lessonId: "es-listen-a1-01", correct: 8, total: 10
  });
  assert.equal(result.masteryMet, false);
  assert.equal(result.languages.profiles.es.sections.listen.lessonsDone, 0);
  assert.equal(result.languages.profiles.es.completedLessons["es-listen-a1-01"], undefined);
});

test("completed B1 curriculum stays at B1 until the later programme is published", () => {
  let languages = createDefaultLanguagesState();
  languages.profiles.fr.sections.speak.level = 2;
  languages.profiles.fr.sections.speak.lessonsDone = LANGUAGE_CURRICULUM_UNITS_PER_LEVEL - 1;
  const result = applyLanguageProgress(languages, {
    lang: "fr", section: "speak", lessonId: "fr-speak-b1-24", correct: 6, total: 6
  });
  assert.equal(result.levelledUp, false);
  assert.equal(result.languages.profiles.fr.sections.speak.level, 2);
  assert.equal(result.languages.profiles.fr.sections.speak.lessonsDone, LANGUAGE_CURRICULUM_UNITS_PER_LEVEL);
});

test("review-only activity is saved without advancing lesson progress", () => {
  const initial = createDefaultLanguagesState();
  const result = applyLanguageProgress(initial, {
    lang: "fr",
    section: "vocab",
    lessonId: "fr:vocab-review:bonjour",
    complete: false,
    activityDate: "2026-10-14"
  });
  assert.equal(result.languages.profiles.fr.sections.vocab.lessonsDone, 0);
  assert.equal(result.languages.profiles.fr.completedLessons["fr:vocab-review:bonjour"], undefined);
  assert.equal(result.languages.rewards.streakDays, 0);
});

test("generic progress cannot promote the vocabulary track", () => {
  const initial = createDefaultLanguagesState();
  initial.profiles.fr.sections.vocab.lessonsDone = 495;
  const result = applyLanguageProgress(initial, {
    lang: "fr",
    section: "vocab",
    lessonId: "legacy-vocab-word",
    complete: true
  });
  assert.equal(result.languages.profiles.fr.sections.vocab.level, 0);
  assert.equal(result.levelledUp, false);
});

test("vocabulary promotes only after every word is introduced and mastery exceeds 95 percent", () => {
  const initial = createDefaultLanguagesState();
  const total = LANGUAGE_VOCABULARY_COUNTS.fr.A1;
  initial.profiles.fr.vocab.levelProgress.A1.introduced = Array.from({ length: total - 1 }, (_, index) => index);
  initial.profiles.fr.vocab.levelProgress.A1.mastered = Array.from({ length: 471 }, (_, index) => index);

  const result = applyVocabularySession(initial, {
    lang: "fr",
    level: "A1",
    results: [{ index: total - 1, correct: true }],
    activityDate: "2026-10-14"
  });
  assert.equal(result.progress.introduced, total);
  assert.equal(result.progress.mastered, 472);
  assert.ok(result.progress.accuracy > 0.95);
  assert.equal(result.levelledUp, true);
  assert.equal(result.languages.profiles.fr.sections.vocab.level, 1);
  assert.equal(result.languages.profiles.fr.sections.vocab.lessonsToNext, LANGUAGE_VOCABULARY_COUNTS.fr.A2);
});

test("vocabulary stays at the current level below the mastery threshold and requeues mistakes", () => {
  const initial = createDefaultLanguagesState();
  const total = LANGUAGE_VOCABULARY_COUNTS.fr.A1;
  initial.profiles.fr.vocab.levelProgress.A1.introduced = Array.from({ length: total }, (_, index) => index);
  initial.profiles.fr.vocab.levelProgress.A1.mastered = Array.from({ length: 471 }, (_, index) => index);

  const result = applyVocabularySession(initial, {
    lang: "fr",
    level: "A1",
    results: [{ index: 0, correct: false }]
  });
  assert.equal(result.levelledUp, false);
  assert.equal(result.languages.profiles.fr.sections.vocab.level, 0);
  assert.equal(result.progress.mastered, 470);
  assert.deepEqual(result.languages.profiles.fr.vocab.levelProgress.A1.review, [0]);
});

test("normalization keeps vocabulary through C2 but caps published lesson tracks at B1", () => {
  const languages = createDefaultLanguagesState();
  languages.profiles.es.sections.listen.level = 99;
  languages.profiles.es.sections.vocab.level = 99;
  const normalized = normalizeLanguagesState(languages);
  assert.equal(normalized.profiles.es.sections.listen.level, 2);
  assert.equal(normalized.profiles.es.sections.vocab.level, 5);
  const withTopics = setLanguageTopics(normalized, "es", ["Música", "Viajes", "Música"]);
  assert.deepEqual(withTopics.profiles.es.vocab.topics, ["Música", "Viajes"]);
  assert.equal(withTopics.profiles.es.sections.listen.level, 2);
});

test("legacy lesson counters restart at unit one for the new comprehensive curriculum", () => {
  const legacy = createDefaultLanguagesState();
  delete legacy.profiles.fr.curriculumVersion;
  legacy.profiles.fr.sections.grammar.lessonsDone = 10;
  legacy.profiles.fr.sections.listen.lessonsDone = 7;
  legacy.profiles.fr.sections.vocab.lessonsDone = 200;
  legacy.profiles.fr.vocab.levelProgress.A1.introduced = Array.from({ length: 200 }, (_, index) => index);
  legacy.profiles.fr.vocab.levelProgress.A1.mastered = Array.from({ length: 190 }, (_, index) => index);
  const migrated = normalizeLanguagesState(legacy);
  assert.equal(migrated.profiles.fr.sections.grammar.lessonsDone, 0);
  assert.equal(migrated.profiles.fr.sections.listen.lessonsDone, 0);
  assert.equal(migrated.profiles.fr.sections.vocab.lessonsDone, 190);
  assert.equal(migrated.profiles.fr.curriculumVersion, 1);
});
