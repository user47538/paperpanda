import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDefaultLanguagesState, languageAnswerSimilarity, LANGUAGE_CURRICULUM_UNITS_PER_LEVEL, LANGUAGE_VOCABULARY_COUNTS, normalizeLanguageAnswer, resolveVocabularyAdvance } from "./languages-runtime.js";
import { LANGUAGE_CONTENT } from "./languages-content.js";
import { getCurriculumOverview, getCurriculumUnit } from "./languages-curriculum.js";

test("typed language matching keeps accents significant but normalizes apostrophes", () => {
  assert.equal(normalizeLanguageAnswer("  J’AI  "), "j'ai");
  assert.notEqual(normalizeLanguageAnswer("etre"), normalizeLanguageAnswer("être"));
});

test("frontend language defaults expose six independent section tracks", () => {
  const languages = createDefaultLanguagesState();
  assert.equal(Object.keys(languages.profiles.fr.sections).length, 6);
  assert.equal(languages.profiles.fr.sections.watch.lessonsToNext, LANGUAGE_CURRICULUM_UNITS_PER_LEVEL);
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

test("placement contains two original checks at every A1–B1 band for all six skills", () => {
  for (const lang of ["fr", "es"]) {
    const placement = LANGUAGE_CONTENT[lang].placement;
    assert.equal(placement.length, 36, `${lang} question count`);
    assert.equal(new Set(placement.map((question) => question.id)).size, 36, `${lang} unique IDs`);
    for (const section of ["vocab", "grammar", "verbs", "speak", "listen", "watch"]) {
      const sectionQuestions = placement.filter((question) => question.section === section);
      assert.equal(sectionQuestions.length, 6, `${lang} ${section} count`);
      for (const level of [0, 1, 2]) {
        assert.equal(sectionQuestions.filter((question) => question.level === level).length, 2, `${lang} ${section} level ${level}`);
      }
    }
  }
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

test("French and Spanish expose 24 detailed units at every published level", () => {
  for (const lang of ["fr", "es"]) {
    for (const level of ["A1", "A2", "B1"]) {
      const units = getCurriculumOverview(lang, level);
      assert.equal(units.length, LANGUAGE_CURRICULUM_UNITS_PER_LEVEL);
      assert.equal(new Set(units.map((unit) => unit.id)).size, LANGUAGE_CURRICULUM_UNITS_PER_LEVEL);
      units.forEach((unit) => {
        assert.equal(unit.dialogue.length, 6);
        assert.equal(unit.grammar.checks.length, 3);
        assert.equal(unit.listening.acts.length, 5);
        assert.equal(unit.words.length, 3);
      });
    }
  }
});

test("curriculum advances in difficulty while keeping the same thematic sequence", () => {
  const a1 = getCurriculumUnit("fr", "A1", 16);
  const b1 = getCurriculumUnit("fr", "B1", 16);
  assert.equal(a1.title, "À la librairie");
  assert.equal(b1.title, a1.title);
  assert.notEqual(b1.objective, a1.objective);
  assert.notEqual(b1.grammar.topic, a1.grammar.topic);
});

test("written listening answers receive partial-credit similarity instead of presence credit", () => {
  assert.equal(languageAnswerSimilarity("Oui, bien sûr.", "Oui, bien sûr."), 1);
  assert.ok(languageAnswerSimilarity("Oui bien sûr", "Oui, bien sûr.") >= 0.9);
  assert.ok(languageAnswerSimilarity("I have no idea", "Oui, bien sûr.") < 0.6);
});
