import test from "node:test";
import assert from "node:assert/strict";
import {
  applyLanguageProgress,
  applyPlacementResult,
  applyVocabularySession,
  createDefaultLanguagesState,
  LANGUAGE_VOCABULARY_COUNTS,
  normalizeLanguagesState,
  setLanguageTopics
} from "./languages.js";

test("language defaults create independent French and Spanish section progress", () => {
  const languages = createDefaultLanguagesState();
  languages.profiles.fr.sections.vocab.lessonsDone = 3;
  assert.equal(languages.profiles.es.sections.vocab.lessonsDone, 0);
  assert.equal(languages.profiles.fr.sections.watch.lessonsToNext, 8);
  assert.equal(languages.profiles.fr.sections.vocab.lessonsToNext, 496);
  assert.equal(languages.profiles.es.sections.vocab.lessonsToNext, 454);
});

test("placement scores every section independently and awards the first panda", () => {
  const answers = ["vocab", "grammar", "verbs", "speak", "listen", "watch"].flatMap((section) => [
    { section, level: 0, correct: true },
    { section, level: 2, correct: section !== "verbs" }
  ]);
  const result = applyPlacementResult(createDefaultLanguagesState(), "fr", answers);
  assert.equal(result.languages.profiles.fr.placementDone, true);
  assert.equal(result.languages.profiles.es.placementDone, false);
  assert.equal(result.levels.vocab, 3);
  assert.equal(result.languages.profiles.fr.sections.vocab.lessonsToNext, LANGUAGE_VOCABULARY_COUNTS.fr.B2);
  assert.equal(result.levels.verbs, 0);
  assert.equal(result.pandaAwarded, "happy");
});

test("placement rejects non-target-language speaking text", () => {
  const result = applyPlacementResult(createDefaultLanguagesState(), "fr", [
    { section: "speak", level: 1, correct: true, response: "this is only an English answer" }
  ]);
  assert.equal(result.levels.speak, 0);

  const accepted = applyPlacementResult(createDefaultLanguagesState(), "es", [
    { section: "speak", level: 1, correct: true, response: "Me gusta jugar al fútbol" }
  ]);
  assert.ok(accepted.levels.speak >= 1);

  const conciseFrench = applyPlacementResult(createDefaultLanguagesState(), "fr", [
    { section: "speak", level: 1, correct: true, response: "Jouer au football avec mes amis" }
  ]);
  assert.ok(conciseFrench.levels.speak >= 1);

  const markerMixedWithEnglish = applyPlacementResult(createDefaultLanguagesState(), "es", [
    { section: "speak", level: 1, correct: true, response: "me and my friends play football" }
  ]);
  assert.equal(markerMixedWithEnglish.levels.speak, 0);
});

test("progress is idempotent and levels up at the saved threshold", () => {
  let languages = createDefaultLanguagesState();
  languages.profiles.fr.sections.grammar.lessonsToNext = 2;
  let result = applyLanguageProgress(languages, { lang: "fr", section: "grammar", lessonId: "g-1", correct: 1, total: 1, activityDate: "2026-10-14" });
  languages = result.languages;
  result = applyLanguageProgress(languages, { lang: "fr", section: "grammar", lessonId: "g-1", correct: 1, total: 1, activityDate: "2026-10-14" });
  assert.equal(result.alreadyCompleted, true);
  assert.equal(result.languages.profiles.fr.sections.grammar.lessonsDone, 1);
  result = applyLanguageProgress(result.languages, { lang: "fr", section: "grammar", lessonId: "g-2", correct: 1, total: 1, activityDate: "2026-10-15" });
  assert.equal(result.levelledUp, true);
  assert.equal(result.languages.profiles.fr.sections.grammar.level, 1);
  assert.equal(result.languages.profiles.fr.sections.grammar.lessonsDone, 0);
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

test("normalization caps levels at C2 and topic updates preserve other progress", () => {
  const languages = createDefaultLanguagesState();
  languages.profiles.es.sections.listen.level = 99;
  const normalized = normalizeLanguagesState(languages);
  assert.equal(normalized.profiles.es.sections.listen.level, 5);
  const withTopics = setLanguageTopics(normalized, "es", ["Música", "Viajes", "Música"]);
  assert.deepEqual(withTopics.profiles.es.vocab.topics, ["Música", "Viajes"]);
  assert.equal(withTopics.profiles.es.sections.listen.level, 5);
});
