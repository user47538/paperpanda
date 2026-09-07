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
  const rewardState = { grammarProgressResetId: "" };
  const context = vm.createContext({
    GP_SESSIONS: Array.from({ length: 24 }, (_, index) => ({ n: index + 1 })),
    grammarResetVersion: 3,
    grammarCurrentSnapshotVersion: 1,
    grammarStateMigrationVersion: 1,
    grammarDebugStorageKey: "paperpanda-debug-grammar",
    oneTimeAccountProgressReset: {
      id: "2026-09-07-amy-grammar-restart",
      email: "amyjwoolley@gmail.com"
    },
    state: {
      currentUserEmail: "",
      subjects: []
    },
    RewardProperty: {
      state: rewardState,
      syncPracticeState() {},
      reset(options = {}) {
        rewardState.grammarProgressResetId = String(options.grammarProgressResetId || "");
      }
    },
    persistCount: 0,
    persistSubjects() {
      context.persistCount += 1;
    },
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
    "normaliseAccountKey",
    "createDefaultGrammarState",
    "normaliseGrammarState",
    "mergeGrammarSkills",
    "mergeGrammarResults",
    "getLatestGrammarResultTimestamp",
    "getLatestGrammarTimestamp",
    "getGrammarCompletionPriority",
    "compareGrammarCompletionPriority",
    "compareGrammarProgressResetPriority",
    "isGrammarLocalStateCompatible",
    "chooseMergedGrammarCurrent",
    "mergeGrammarStates",
    "hasMeaningfulGrammarProgress",
    "getGrammarStateSummary",
    "isGrammarRecoveryCandidateBetter",
    "recoverResolvedSubjectsForGrammar",
    "createCompletedRemoteGrammarState",
    "applyOneTimeAccountProgressReset"
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

test("createCompletedRemoteGrammarState preserves the grammar reset generation", () => {
  const harness = loadGrammarStateHarness();
  const remoteState = harness.createCompletedRemoteGrammarState({
    resetVersion: 3,
    grammarProgressResetId: "2026-09-07-amy-grammar-restart",
    done: 0
  }, "spelling");

  assert.equal(remoteState.grammarProgressResetId, "2026-09-07-amy-grammar-restart");
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

test("mergeGrammarStates keeps a newer reset over stale completed progress", () => {
  const harness = loadGrammarStateHarness();
  const merged = harness.mergeGrammarStates({
    resetVersion: 3,
    grammarProgressResetId: "2026-09-07-amy-grammar-restart",
    done: 0,
    completedRevision: 0,
    results: []
  }, {
    resetVersion: 3,
    done: 14,
    completedRevision: 14,
    results: [
      { n: 14, score: 5, total: 6, at: "2026-09-06T10:00:00.000Z", details: {} }
    ]
  }, "spelling");

  assert.equal(merged.grammarProgressResetId, "2026-09-07-amy-grammar-restart");
  assert.equal(merged.done, 0);
  assert.equal(merged.results.length, 0);
});

test("mergeGrammarStates accepts new progress within the current reset generation", () => {
  const harness = loadGrammarStateHarness();
  const merged = harness.mergeGrammarStates({
    resetVersion: 3,
    grammarProgressResetId: "2026-09-07-amy-grammar-restart",
    done: 3,
    completedRevision: 3,
    results: [
      { n: 3, score: 5, total: 6, at: "2026-09-07T11:00:00.000Z", details: {} }
    ]
  }, {
    resetVersion: 3,
    grammarProgressResetId: "2026-09-07-amy-grammar-restart",
    done: 0,
    completedRevision: 0,
    results: []
  }, "spelling");

  assert.equal(merged.done, 3);
  assert.equal(merged.results.length, 1);
});

test("account reset replaces stale grammar even when the subject stamp already exists", () => {
  const harness = loadGrammarStateHarness();
  harness.state.currentUserEmail = "AMYJWOOLLEY@GMAIL.COM";
  harness.state.subjects = [{
    id: "spelling",
    name: "Practice",
    oneTimeAccountResetIds: ["2026-09-07-amy-grammar-restart"],
    grammar: {
      resetVersion: 3,
      done: 14,
      completedRevision: 14,
      results: []
    }
  }];

  assert.equal(harness.applyOneTimeAccountProgressReset(), true);
  assert.equal(harness.state.subjects[0].grammar.done, 0);
  assert.equal(
    harness.state.subjects[0].grammar.grammarProgressResetId,
    "2026-09-07-amy-grammar-restart"
  );
  assert.equal(harness.RewardProperty.state.grammarProgressResetId, "2026-09-07-amy-grammar-restart");
  assert.equal(harness.persistCount, 1);

  harness.state.subjects[0].grammar.done = 3;
  assert.equal(harness.applyOneTimeAccountProgressReset(), false);
  assert.equal(harness.state.subjects[0].grammar.done, 3);
  assert.equal(harness.persistCount, 1);
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
