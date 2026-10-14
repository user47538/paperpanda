import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultLanguagesState, normalizeLanguageAnswer } from "./languages-runtime.js";
import { LANGUAGE_CONTENT } from "./languages-content.js";

test("typed language matching keeps accents significant but normalizes apostrophes", () => {
  assert.equal(normalizeLanguageAnswer("  J’AI  "), "j'ai");
  assert.notEqual(normalizeLanguageAnswer("etre"), normalizeLanguageAnswer("être"));
});

test("frontend language defaults expose six independent section tracks", () => {
  const languages = createDefaultLanguagesState();
  assert.equal(Object.keys(languages.profiles.fr.sections).length, 6);
  assert.equal(languages.profiles.fr.sections.watch.lessonsToNext, 8);
  assert.equal(languages.profiles.es.placementDone, false);
});

test("starter conjugation content omits the nonexistent standard pouvoir imperative", () => {
  const pouvoir = LANGUAGE_CONTENT.fr.verbs.find((verb) => verb.inf === "pouvoir");
  assert.ok(pouvoir);
  assert.equal(pouvoir.tenses.some((tense) => tense.id === "imperative"), false);
  assert.equal(LANGUAGE_CONTENT.es.verbs.length, 7);
});
