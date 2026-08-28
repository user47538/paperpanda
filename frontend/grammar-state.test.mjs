import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const appSource = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");

function extractFunctionSource(name) {
  const signature = `function ${name}(`;
  const start = appSource.indexOf(signature);
  if (start < 0) {
    throw new Error(`Could not find ${name} in app.js`);
  }

  let braceStart = appSource.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < appSource.length; index += 1) {
    const character = appSource[index];
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return appSource.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Could not extract ${name}`);
}

function loadGrammarStateHarness() {
  const context = vm.createContext({
    GP_SESSIONS: Array.from({ length: 24 }, (_, index) => ({ n: index + 1 })),
    grammarResetVersion: 3,
    grammarCurrentSnapshotVersion: 1,
    grammarStateMigrationVersion: 1,
    grammarDebugStorageKey: "paperpanda-debug-grammar",
    window: {
      localStorage: {
        getItem() {
          return null;
        }
      }
    },
    console,
    logGrammarDebug() {},
    isSpellingSubjectRecord(subjectId = "") {
      return String(subjectId || "").trim().toLowerCase() === "spelling";
    }
  });

  const functionNames = [
    "createDefaultGrammarState",
    "normaliseGrammarState",
    "mergeGrammarSkills",
    "mergeGrammarResults",
    "getLatestGrammarResultTimestamp",
    "getLatestGrammarTimestamp",
    "getGrammarCompletionPriority",
    "compareGrammarCompletionPriority",
    "isGrammarLocalStateCompatible",
    "chooseMergedGrammarCurrent",
    "mergeGrammarStates",
    "hasMeaningfulGrammarProgress",
    "getGrammarStateSummary",
    "isGrammarRecoveryCandidateBetter",
    "recoverResolvedSubjectsForGrammar",
    "createCompletedRemoteGrammarState"
  ];

  const source = functionNames.map(extractFunctionSource).join("\n\n");
  vm.runInContext(source, context, { filename: path.resolve("app.js") });
  return context;
}

test("normaliseGrammarState recovers done from completed results", () => {
  const harness = loadGrammarStateHarness();
  const normalized = harness.normaliseGrammarState({
    resetVersion: 3,
    done: 0,
    results: [
      { n: 4, score: 5, total: 6, at: "2026-08-28T09:00:00.000Z", details: {} }
    ]
  }, "spelling");

  assert.equal(normalized.done, 4);
  assert.equal(normalized.completedRevision, 4);
  assert.equal(normalized.completedAt, "2026-08-28T09:00:00.000Z");
});

test("createCompletedRemoteGrammarState keeps only completed grammar progress", () => {
  const harness = loadGrammarStateHarness();
  const remoteState = harness.createCompletedRemoteGrammarState({
    resetVersion: 3,
    done: 5,
    current: {
      version: 1,
      n: 6,
      updatedAt: "2026-08-28T10:00:00.000Z",
      activity: { i: 0 }
    },
    audioHeard: ["noun"],
    skills: {
      nouns: { right: 2, wrong: 1, lastSession: 2 }
    },
    results: [
      { n: 5, score: 4, total: 5, at: "2026-08-28T09:30:00.000Z", details: {} }
    ]
  }, "spelling");

  assert.equal(remoteState.done, 5);
  assert.equal(remoteState.current, null);
  assert.equal(Array.isArray(remoteState.audioHeard), true);
  assert.equal(remoteState.audioHeard.length, 0);
  assert.equal(Object.keys(remoteState.skills).length, 0);
  assert.equal(remoteState.results.length, 1);
  assert.equal(remoteState.completedRevision, 5);
});

test("mergeGrammarStates keeps newer completed baseline and drops incompatible local current", () => {
  const harness = loadGrammarStateHarness();
  const merged = harness.mergeGrammarStates({
    resetVersion: 3,
    done: 3,
    completedRevision: 3,
    localRevision: 4,
    results: [
      { n: 3, score: 4, total: 5, at: "2026-08-28T09:00:00.000Z", details: {} }
    ]
  }, {
    resetVersion: 3,
    done: 1,
    localRevision: 9,
    current: {
      version: 1,
      n: 2,
      updatedAt: "2026-08-28T11:00:00.000Z",
      activity: { i: 1 }
    }
  }, "spelling");

  assert.equal(merged.done, 3);
  assert.equal(merged.current, null);
});

test("mergeGrammarStates keeps compatible local current when completed baseline matches", () => {
  const harness = loadGrammarStateHarness();
  const merged = harness.mergeGrammarStates({
    resetVersion: 3,
    done: 3,
    completedRevision: 3,
    localRevision: 3,
    results: [
      { n: 3, score: 4, total: 5, at: "2026-08-28T09:00:00.000Z", details: {} }
    ]
  }, {
    resetVersion: 3,
    done: 3,
    completedRevision: 3,
    localRevision: 8,
    current: {
      version: 1,
      n: 4,
      updatedAt: "2026-08-28T11:30:00.000Z",
      activity: { i: 0 }
    }
  }, "spelling");

  assert.equal(merged.done, 3);
  assert.equal(merged.current?.n, 4);
});

test("recoverResolvedSubjectsForGrammar promotes stronger legacy grammar state once", () => {
  const harness = loadGrammarStateHarness();
  const subjects = [
    {
      id: "spelling",
      name: "Practice",
      grammar: {
        resetVersion: 3,
        migrationVersion: 0,
        done: 0,
        results: []
      }
    },
    {
      id: "english",
      name: "English",
      grammar: {
        resetVersion: 3,
        done: 6,
        results: [
          { n: 6, score: 5, total: 6, at: "2026-08-28T12:00:00.000Z", details: {} }
        ]
      }
    }
  ];

  harness.recoverResolvedSubjectsForGrammar(subjects);

  assert.equal(subjects[0].grammar.done, 6);
  assert.equal(subjects[0].grammar.migrationVersion, 1);
  assert.equal(subjects[0].grammar.completedRevision, 6);
});
