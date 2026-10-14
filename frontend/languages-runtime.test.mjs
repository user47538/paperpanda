import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDefaultLanguagesState, LANGUAGE_VOCABULARY_COUNTS, normalizeLanguageAnswer, resolveVocabularyAdvance } from "./languages-runtime.js";
import { LANGUAGE_CONTENT } from "./languages-content.js";

test("typed language matching keeps accents significant but normalizes apostrophes", () => {
  assert.equal(normalizeLanguageAnswer("  J’AI  "), "j'ai");
  assert.notEqual(normalizeLanguageAnswer("etre"), normalizeLanguageAnswer("être"));
});

test("frontend language defaults expose six independent section tracks", () => {
  const languages = createDefaultLanguagesState();
  assert.equal(Object.keys(languages.profiles.fr.sections).length, 6);
  assert.equal(languages.profiles.fr.sections.watch.lessonsToNext, 8);
  assert.equal(languages.profiles.fr.sections.vocab.lessonsToNext, 496);
  assert.equal(languages.profiles.es.sections.vocab.lessonsToNext, 454);
  assert.equal(languages.profiles.es.placementDone, false);
});

test("MindDory vocabulary assets match every declared CEFR count with unique terms", () => {
  for (const [lang, levels] of Object.entries(LANGUAGE_VOCABULARY_COUNTS)) {
    for (const [level, expectedCount] of Object.entries(levels)) {
      const payload = JSON.parse(readFileSync(new URL(`./public/language-vocabulary/${lang}/${level.toLowerCase()}.json`, import.meta.url), "utf8"));
      assert.equal(payload.entries.length, expectedCount, `${lang} ${level} count`);
      assert.equal(new Set(payload.entries.map(([word]) => word)).size, expectedCount, `${lang} ${level} unique terms`);
    }
  }
});

test("starter conjugation content omits the nonexistent standard pouvoir imperative", () => {
  const pouvoir = LANGUAGE_CONTENT.fr.verbs.find((verb) => verb.inf === "pouvoir");
  assert.ok(pouvoir);
  assert.equal(pouvoir.tenses.some((tense) => tense.id === "imperative"), false);
  assert.equal(LANGUAGE_CONTENT.es.verbs.length, 7);
});

test("vocabulary sessions advance once, review missed words once, and then complete", () => {
  assert.deepEqual(resolveVocabularyAdvance({ wordIndex: 2, targetCount: 6, reviewMode: false, incorrectCount: 1 }), {
    phase: "advance",
    wordIndex: 3
  });
  assert.deepEqual(resolveVocabularyAdvance({ wordIndex: 5, targetCount: 6, reviewMode: false, incorrectCount: 2 }), {
    phase: "review",
    wordIndex: 0
  });
  assert.deepEqual(resolveVocabularyAdvance({ wordIndex: 1, targetCount: 2, reviewMode: true, incorrectCount: 2 }), {
    phase: "complete",
    wordIndex: 1
  });
  assert.equal(resolveVocabularyAdvance({ wordIndex: 5, targetCount: 6, reviewMode: false, incorrectCount: 0 }).phase, "complete");
});
