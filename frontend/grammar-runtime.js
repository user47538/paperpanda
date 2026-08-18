import {
  GP_ACTIVITIES_PER_SESSION,
  GP_BINARY,
  GP_BUILD,
  GP_FIX,
  GP_JOIN,
  GP_LESSON_INTROS,
  GP_MC,
  GP_PASSAGES,
  GP_REVIEW,
  GP_REWRITE,
  GP_SELECT,
  GP_SESSIONS,
  GP_SKILLS,
  GP_TENSE,
  GP_TERMS
} from "./grammar-content.js";

export function createGrammarProgram({
  escapeHtml,
  persistSubjects,
  getSubjectGrammarState,
  buildRewardPropertyMarkup,
  mountRewardProperty,
  RewardProperty
}) {
  return (function () {
    const GAME_SPAWN_MS = [1250, 1050, 900];
    const GAME_DURATION_MS = [7200, 5800, 4600];
    let root = null;
    let subject = null;
    let G = null;
    let tab = "hub";
    let sessionIndex = -1;
    let sessionConfig = null;
    let lessonKey = "";
    let view = "hub";
    let activity = null;
    let audio = { playing: false, done: false, prog: 0 };
    let audioTimer = null;
    let audioFallbackTimer = null;
    let game = null;
    let gameSpawnTimer = null;
    let gameFrame = 0;
    let gameFlashTimer = null;

    function refreshState() {
      G = getSubjectGrammarState(subject);
      return G;
    }

    function saveState(options = {}) {
      if (!subject) {
        return;
      }
      subject.grammar = G;
      persistSubjects(options.skipRemoteSync ? { skipRemoteSync: true } : undefined);
      if (RewardProperty.setGrammarSessions) {
        RewardProperty.setGrammarSessions(getCompletedSessionCount());
      }
    }

    function stopSpeech() {
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (error) {
        // Ignore speech cancellation issues.
      }
    }

    function stopAudio() {
      clearInterval(audioTimer);
      clearTimeout(audioFallbackTimer);
      audioTimer = null;
      audioFallbackTimer = null;
      audio.playing = false;
      stopSpeech();
    }

    function stopGame() {
      clearInterval(gameSpawnTimer);
      cancelAnimationFrame(gameFrame);
      clearTimeout(gameFlashTimer);
      gameSpawnTimer = null;
      gameFrame = 0;
      gameFlashTimer = null;
      game = null;
    }

    function stopAll() {
      stopAudio();
      stopGame();
    }

    function getSessionConfig(index = sessionIndex) {
      return GP_SESSIONS[index] || null;
    }

    function hasHeard(termKey = "") {
      return G.audioHeard.includes(termKey);
    }

    function markHeard(termKey = "") {
      if (!termKey || hasHeard(termKey)) {
        return;
      }
      G.audioHeard.push(termKey);
      saveState({ skipRemoteSync: true });
    }

    function tallySkill(skillKey = "", isRight = false) {
      if (!skillKey) {
        return;
      }
      const tally = G.skills[skillKey] || { right: 0, wrong: 0, lastSession: 0 };
      tally[isRight ? "right" : "wrong"] += 1;
      tally.lastSession = sessionConfig?.n || tally.lastSession;
      G.skills[skillKey] = tally;
      saveState({ skipRemoteSync: true });
    }

    function skillBand(skillKey = "") {
      const def = GP_SKILLS.find((entry) => entry.k === skillKey);
      if (!def || def.from > G.done) {
        return "untaught";
      }
      const tally = G.skills[skillKey];
      if (!tally || tally.right + tally.wrong < 3) {
        return "developing";
      }
      const ratio = tally.right / Math.max(1, tally.right + tally.wrong);
      return ratio >= 0.85 ? "strong" : ratio >= 0.6 ? "developing" : "practice";
    }

    function getSkillPercent(skillKey = "") {
      const tally = G.skills[skillKey];
      if (!tally || !tally.right + tally.wrong) {
        return 0;
      }
      return Math.round((tally.right / Math.max(1, tally.right + tally.wrong)) * 100);
    }

    function getTaughtSkillCounts() {
      return GP_SKILLS.filter((skill) => skill.from <= G.done).reduce((acc, skill) => {
        const band = skillBand(skill.k);
        if (band === "strong") acc.strong += 1;
        if (band === "developing") acc.developing += 1;
        if (band === "practice") acc.practice += 1;
        return acc;
      }, { strong: 0, developing: 0, practice: 0 });
    }

    function getSessionGroupCount() {
      return Math.ceil(GP_SESSIONS.length / GP_ACTIVITIES_PER_SESSION);
    }

    function getCompletedSessionCount(doneCount = G?.done || 0) {
      const safeDoneCount = Math.max(0, Math.min(GP_SESSIONS.length, Number(doneCount || 0) || 0));
      return Math.floor(safeDoneCount / GP_ACTIVITIES_PER_SESSION);
    }

    function getSessionNumberForActivity(activityNumber = 1) {
      const safeActivity = Math.max(1, Math.min(GP_SESSIONS.length, Number(activityNumber || 1) || 1));
      return Math.floor((safeActivity - 1) / GP_ACTIVITIES_PER_SESSION) + 1;
    }

    function getSessionSize(sessionNumber = 1) {
      const safeSession = Math.max(1, Math.min(getSessionGroupCount(), Number(sessionNumber || 1) || 1));
      const startActivity = ((safeSession - 1) * GP_ACTIVITIES_PER_SESSION) + 1;
      return Math.max(0, Math.min(GP_ACTIVITIES_PER_SESSION, GP_SESSIONS.length - startActivity + 1));
    }

    function getSessionMeta(activityNumber = sessionConfig?.n || 1) {
      if (!GP_SESSIONS.length) {
        return null;
      }
      const safeActivity = Math.max(1, Math.min(GP_SESSIONS.length, Number(activityNumber || 1) || 1));
      const sessionNumber = getSessionNumberForActivity(safeActivity);
      const startActivity = ((sessionNumber - 1) * GP_ACTIVITIES_PER_SESSION) + 1;
      const size = getSessionSize(sessionNumber);
      return {
        sessionNumber,
        activityNumber: safeActivity,
        startActivity,
        size,
        endActivity: startActivity + size - 1
      };
    }

    function getReadySessionMeta() {
      const readySession = getReadySessionConfig();
      if (readySession?.n) {
        return getSessionMeta(readySession.n);
      }
      if (GP_SESSIONS.length) {
        return getSessionMeta(GP_SESSIONS.length);
      }
      return null;
    }

    function getActivityIndexInSession(activityNumber = sessionConfig?.n || 1) {
      const meta = getSessionMeta(activityNumber);
      return meta ? (meta.activityNumber - meta.startActivity) + 1 : 1;
    }

    function getCompletedActivitiesInSession(sessionNumber = 1, doneCount = G?.done || 0) {
      const safeSession = Math.max(1, Math.min(getSessionGroupCount(), Number(sessionNumber || 1) || 1));
      const startActivity = ((safeSession - 1) * GP_ACTIVITIES_PER_SESSION) + 1;
      const size = getSessionSize(safeSession);
      const safeDoneCount = Math.max(0, Math.min(GP_SESSIONS.length, Number(doneCount || 0) || 0));
      return Math.max(0, Math.min(size, safeDoneCount - startActivity + 1));
    }

    function isSessionBoundaryActivity(activityNumber = sessionConfig?.n || 0) {
      const safeActivity = Math.max(0, Math.min(GP_SESSIONS.length, Number(activityNumber || 0) || 0));
      return safeActivity > 0 && (safeActivity === GP_SESSIONS.length || safeActivity % GP_ACTIVITIES_PER_SESSION === 0);
    }

    function didCompleteGroupedSession(activityNumber = sessionConfig?.n || 0) {
      return isSessionBoundaryActivity(activityNumber) && G.done >= Number(activityNumber || 0);
    }

    function getRewardCopy() {
      if (G.done >= GP_SESSIONS.length) {
        return "The current grammar program is complete.";
      }
      const readyMeta = getReadySessionMeta();
      if (!readyMeta) {
        return "The current grammar program is complete.";
      }
      const remainingActivities = Math.max(0, readyMeta.size - getCompletedActivitiesInSession(readyMeta.sessionNumber));
      if (remainingActivities <= 0) {
        return "This session upgrade is ready in Property.";
      }
      return remainingActivities === 1
        ? "Finish 1 more activity in this session to unlock the next property upgrade."
        : `Finish ${remainingActivities} more activities in this session to unlock the next property upgrade.`;
    }

    function getReadySessionIndex() {
      const currentNumber = Number(G.current?.n || 0);
      if (currentNumber > G.done) {
        const currentIndex = GP_SESSIONS.findIndex((cfg) => cfg.n === currentNumber);
        if (currentIndex >= 0) {
          return currentIndex;
        }
      }
      if (G.done < GP_SESSIONS.length) {
        return G.done;
      }
      return GP_SESSIONS.length ? GP_SESSIONS.length - 1 : -1;
    }

    function getReadySessionConfig() {
      const index = getReadySessionIndex();
      return index >= 0 ? GP_SESSIONS[index] || null : null;
    }

    function clonePlainData(value) {
      if (value === null || value === undefined) {
        return null;
      }
      try {
        if (typeof structuredClone === "function") {
          return structuredClone(value);
        }
      } catch (error) {
        // Fall back to JSON cloning for plain activity snapshots.
      }
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (error) {
        return null;
      }
    }

    function persistCurrentProgress() {
      if (!sessionConfig) {
        return;
      }
      const nextCurrent = {
        n: sessionConfig.n,
        title: sessionConfig.title,
        act: sessionConfig.act,
        content: sessionConfig.content,
        view,
        lessonKey,
        updatedAt: new Date().toISOString(),
        activity: null,
        game: null
      };
      if (view === "activity" && activity && sessionConfig.act !== "game") {
        nextCurrent.activity = clonePlainData(activity);
      }
      if (sessionConfig.act === "game" && game) {
        nextCurrent.game = {
          round: game.round,
          score: game.score,
          wrong: game.wrong,
          roundScores: [...game.roundScores],
          missed: [...new Set(game.missed)]
        };
      }
      G.current = nextCurrent;
      saveState({ skipRemoteSync: true });
    }

    function clearCurrentProgress() {
      if (!G.current) {
        return;
      }
      G.current = null;
      saveState({ skipRemoteSync: true });
    }

    function getSkillAttempts(skillKey = "") {
      const tally = G.skills[skillKey];
      return tally ? tally.right + tally.wrong : 0;
    }

    function getWeaknessScore(skillKey = "", taughtLimit = Math.max(G.done, sessionConfig?.n || 0)) {
      const def = GP_SKILLS.find((entry) => entry.k === skillKey);
      if (!def || def.from > taughtLimit) {
        return 0;
      }
      const tally = G.skills[skillKey];
      if (!tally) {
        return 0.45;
      }
      const attempts = tally.right + tally.wrong;
      if (!attempts) {
        return 0.45;
      }
      if (attempts < 3) {
        return 0.4;
      }
      const accuracy = tally.right / attempts;
      return (1 - accuracy) + Math.min(0.25, tally.wrong * 0.03);
    }

    function selectWeightedItems(pool = [], count = pool.length) {
      const taughtLimit = Math.max(G.done, sessionConfig?.n || 0);
      return [...pool]
        .map((item, index) => {
          const skills = Array.isArray(item.skills)
            ? item.skills.filter(Boolean)
            : [item.skill].filter(Boolean);
          const weight = skills.length
            ? Math.max(...skills.map((skillKey) => getWeaknessScore(skillKey, taughtLimit)))
            : 0;
          const attempts = skills.reduce((total, skillKey) => total + getSkillAttempts(skillKey), 0);
          return { item, index, weight, attempts };
        })
        .sort((left, right) => right.weight - left.weight || left.attempts - right.attempts || left.index - right.index)
        .slice(0, count)
        .map(({ item }) => item);
    }

    function normaliseText(value = "") {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[.?!,'"]/g, "")
        .replace(/\s+/g, " ");
    }

    function usesWrittenOnlyIntro(cfg = sessionConfig) {
      return cfg?.act === "pick";
    }

    function getSessionIntroKey(cfg = sessionConfig) {
      if (!cfg) {
        return "";
      }
      if (usesWrittenOnlyIntro(cfg)) {
        return cfg.content;
      }
      if (cfg.act === "game" && !hasHeard(cfg.content)) {
        return cfg.content;
      }
      const introMap = { 9: "compare", 14: "purpose" };
      const key = introMap[cfg.n];
      return key && !hasHeard(key) ? key : "";
    }

    function getLessonDefinition(key = lessonKey) {
      return GP_TERMS[key] || GP_LESSON_INTROS[key] || null;
    }

    function getMcItems(cfg = sessionConfig) {
      if (!cfg) {
        return [];
      }
      if (cfg.content === "mixed1") {
        return selectWeightedItems(GP_MC.mixedPool, 10);
      }
      return GP_MC[cfg.content] || [];
    }

    function getPassageQuestions(cfg = sessionConfig) {
      const questions = GP_PASSAGES[cfg?.content]?.questions || [];
      if (cfg?.content === "passage4") {
        return selectWeightedItems(questions, 7);
      }
      if (cfg?.content === "passage5") {
        return selectWeightedItems(questions, 10);
      }
      return questions;
    }

    function getJoinItems(cfg = sessionConfig) {
      return selectWeightedItems(GP_JOIN[cfg?.content] || [], 8);
    }

    function getReviewItems(cfg = sessionConfig) {
      return selectWeightedItems(GP_REVIEW[cfg?.content]?.items || [], 6);
    }

    function getRewriteTotal(items = []) {
      return items.length;
    }

    function getBuildTotal(items = []) {
      return items.reduce((total, item) => total + (item.groups?.length || 0), 0);
    }

    function getIntroStartLabel() {
      if (sessionConfig?.act === "game") {
        return "Start round 1";
      }
      if (sessionConfig?.act === "pick") {
        return "Start sentence 1";
      }
      if (sessionConfig?.act === "comp") {
        return "Start questions";
      }
      return "Start activity";
    }

    function getIntroListenCopy() {
      if (sessionConfig?.act === "game") {
        return "You need to hear this once before the game.";
      }
      if (sessionConfig?.act === "pick") {
        return "You need to hear this once before the word selection rounds.";
      }
      if (sessionConfig?.act === "comp") {
        return "You need to hear this once before the questions.";
      }
      return "You need to hear this once before the activity.";
    }

    function openSession(index) {
      const cfg = getSessionConfig(index);
      if (!cfg) {
        return;
      }
      const savedCurrent = G.current && Number(G.current.n || 0) === cfg.n ? G.current : null;
      stopAll();
      sessionIndex = index;
      sessionConfig = cfg;
      lessonKey = savedCurrent?.lessonKey || getSessionIntroKey(cfg);
      activity = null;
      audio = {
        playing: false,
        done: !lessonKey,
        prog: lessonKey ? 0 : 100
      };
      if (usesWrittenOnlyIntro(cfg) && lessonKey) {
        audio.done = true;
        audio.prog = 100;
      }
      if (savedCurrent?.activity && cfg.act !== "game") {
        activity = clonePlainData(savedCurrent.activity);
        if (cfg.act === "pick" && !Array.isArray(activity?.items)) {
          activity = initActivity();
        }
        audio.done = true;
        audio.prog = 100;
        view = "activity";
        paint();
        return;
      }
      view = lessonKey ? "intro" : "activity";
      persistCurrentProgress();
      if (lessonKey) {
        paint();
        return;
      }
      startActivity();
    }

    function openReadySession() {
      const readyIndex = getReadySessionIndex();
      if (readyIndex >= 0) {
        openSession(readyIndex);
      }
    }

    function speakInstruction(text = "", onDone = () => {}) {
      const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
      const durationMs = Math.max(3000, Math.round((words / 2.4) * 1000));
      let finished = false;
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        stopAudio();
        onDone();
      };

      audio.prog = 0;
      audio.playing = true;
      clearInterval(audioTimer);
      audioTimer = setInterval(() => {
        audio.prog = Math.min(100, audio.prog + (100 / Math.max(1, durationMs / 100)));
        updateIntroAudioUi();
        if (audio.prog >= 100 && !audioFallbackTimer) {
          finish();
        }
      }, 100);

      try {
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.85;
          utterance.onend = finish;
          utterance.onerror = finish;
          stopSpeech();
          window.speechSynthesis.speak(utterance);
        } else {
          audioFallbackTimer = setTimeout(finish, durationMs);
        }
      } catch (error) {
        audioFallbackTimer = setTimeout(finish, durationMs);
      }
    }

    function playTeachAudio() {
      if (!sessionConfig || audio.playing) {
        return;
      }
      const lesson = getLessonDefinition();
      if (!lesson) {
        audio.done = true;
        startActivity();
        return;
      }
      const heardKey = lessonKey;
      speakInstruction(lesson.audioText, () => {
        audio.done = true;
        audio.prog = 100;
        markHeard(heardKey);
        lessonKey = "";
        persistCurrentProgress();
        paint();
      });
      updateIntroAudioUi();
    }

    function buildSentenceChecks(text = "") {
      const trimmed = String(text || "").trim();
      const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
      const firstChar = trimmed.charAt(0);
      const verbMatch = /\b(is|are|was|were|has|have|ride|rides|rode|walk|walks|walked|run|runs|ran|jump|jumps|jumped|feed|feeds|fed|stand|stands|stood|graze|grazes|grazed|live|lives|lived|open|opens|opened|clean|cleans|cleaned|brush|brushes|brushed|trot|trots|trotted|lead|leads|led)\b/i.test(trimmed);
      return [
        { label: "12 words or more", ok: words.length >= 12 },
        { label: "Starts with a capital letter", ok: Boolean(firstChar) && /[A-Z]/.test(firstChar) },
        { label: "Ends with . ! or ?", ok: /[.!?]$/.test(trimmed) },
        { label: "Has a naming word (subject)", ok: words.length >= 3 },
        { label: "Has an action word (verb)", ok: verbMatch }
      ];
    }

    function initActivity() {
      if (!sessionConfig) {
        return null;
      }
      if (sessionConfig.act === "mc") {
        return { items: getMcItems(), i: 0, picked: null, attempts: 0, right: 0, feedback: "" };
      }
      if (sessionConfig.act === "tense") {
        return { items: GP_TENSE[sessionConfig.content] || [], i: 0, picked: null, attempts: 0, right: 0, feedback: "" };
      }
      if (sessionConfig.act === "pick") {
        return { items: GP_TERMS[sessionConfig.content]?.items || [], i: 0, picked: null, attempts: 0, right: 0, feedback: "" };
      }
      if (sessionConfig.act === "fix") {
        const data = GP_FIX[sessionConfig.content] || {};
        const items = Array.isArray(data.items) && data.items.length
          ? data.items
          : data.tokens
            ? [{ tokens: data.tokens }]
            : [];
        return { items, i: 0, filled: {}, chip: "", right: 0, feedback: "" };
      }
      if (sessionConfig.act === "write") {
        return { text: "", submitted: false };
      }
      if (sessionConfig.act === "comp") {
        return { items: getPassageQuestions(), i: 0, picked: null, attempts: 0, right: 0, reading: -1, playing: false, feedback: "", replayIndex: -1 };
      }
      if (sessionConfig.act === "binary") {
        return { items: GP_BINARY[sessionConfig.content] || [], i: 0, picked: null, attempts: 0, right: 0, feedback: "" };
      }
      if (sessionConfig.act === "rewrite") {
        return { items: GP_REWRITE[sessionConfig.content] || [], i: 0, text: "", attempts: 0, right: 0, feedback: "", checked: false };
      }
      if (sessionConfig.act === "join") {
        return { items: getJoinItems(), i: 0, picked: null, attempts: 0, right: 0, feedback: "" };
      }
      if (sessionConfig.act === "select") {
        return { items: GP_SELECT[sessionConfig.content] || [], i: 0, subjectPick: null, verbPick: null, attempts: 0, right: 0, feedback: "", checked: false };
      }
      if (sessionConfig.act === "build") {
        return { items: GP_BUILD[sessionConfig.content] || [], i: 0, choices: {}, right: 0, feedback: "", checked: false };
      }
      if (sessionConfig.act === "mixed") {
        return { items: getReviewItems(), i: 0, picked: null, attempts: 0, right: 0, feedback: "" };
      }
      return {};
    }

    function startActivity() {
      if (!sessionConfig || (view === "intro" && !audio.done)) {
        return;
      }
      view = "activity";
      activity = initActivity();
      if (sessionConfig.act === "game") {
        beginGame(0);
        return;
      }
      persistCurrentProgress();
      paint();
    }

    function finishSession(score = 0, total = 0, details = {}) {
      if (!sessionConfig) {
        return;
      }
      const previousDone = G.done;
      const previousCompletedSessions = getCompletedSessionCount(previousDone);
      const nextDone = Math.max(G.done, sessionConfig.n);
      const nextCompletedSessions = getCompletedSessionCount(nextDone);
      const nextDetails = { ...details };
      if (isSessionBoundaryActivity(sessionConfig.n) && nextCompletedSessions > previousCompletedSessions && RewardProperty.getGrammarUpgradeSummary) {
        nextDetails.propertyUpgrade = RewardProperty.getGrammarUpgradeSummary(previousCompletedSessions, nextCompletedSessions);
      }
      G.done = nextDone;
      G.current = null;
      G.results = [
        ...G.results.filter((entry) => Number(entry.n || 0) !== sessionConfig.n),
        { n: sessionConfig.n, score, total, at: new Date().toISOString(), details: nextDetails }
      ].sort((a, b) => a.n - b.n);
      saveState();
      view = "results";
      stopAll();
      paint();
    }

    function beginGame(roundIndex = 0) {
      stopGame();
      const rounds = GP_TERMS[sessionConfig.content]?.rounds || [];
      const prior = game || { score: 0, wrong: 0, missed: [], roundScores: [] };
      game = {
        round: roundIndex,
        words: [],
        spawnIndex: 0,
        nextId: 1,
        score: prior.score,
        wrong: prior.wrong,
        missed: prior.missed,
        roundScores: prior.roundScores,
        paused: false,
        flash: "",
        missedWord: "",
        rounds,
        wordNodes: new Map()
      };
      paint();
      startGameLoops();
      persistCurrentProgress();
    }

    function getCurrentRoundList() {
      return game?.rounds?.[game.round] || [];
    }

    function spawnGameWord() {
      if (!game || game.paused) {
        return;
      }
      const roundList = getCurrentRoundList();
      if (game.spawnIndex >= roundList.length) {
        return;
      }
      const [text, target] = roundList[game.spawnIndex];
      game.words.push({
        id: game.nextId,
        text,
        target: Boolean(target),
        lane: 8 + (game.spawnIndex % 4) * 22 + Math.random() * 4,
        createdAt: performance.now(),
        duration: GAME_DURATION_MS[game.round]
      });
      game.nextId += 1;
      game.spawnIndex += 1;
      syncGameWords();
      updateGameUi();
    }

    function updateGameWordPositions(now = performance.now()) {
      if (!game || !root?.isConnected) {
        return;
      }
      const play = root.querySelector(".gp-play");
      if (!play) {
        return;
      }
      const nextWords = [];
      game.words.forEach((word) => {
        const progress = Math.min(1, (now - word.createdAt) / word.duration);
        const node = game.wordNodes.get(word.id);
        if (node) {
          node.style.left = `${word.lane}%`;
          node.style.bottom = `${-12 + progress * 112}%`;
        }
        if (progress >= 1) {
          if (word.target) {
            pauseForMiss(word);
          } else if (node) {
            node.remove();
            game.wordNodes.delete(word.id);
          }
        } else {
          nextWords.push(word);
        }
      });
      if (game) {
        game.words = nextWords;
      }
      if (!game) {
        return;
      }
      if (!game.paused && !game.words.length && game.spawnIndex >= getCurrentRoundList().length) {
        endGameRound();
        return;
      }
      gameFrame = requestAnimationFrame(updateGameWordPositions);
    }

    function startGameLoops() {
      if (!game) {
        return;
      }
      spawnGameWord();
      gameSpawnTimer = setInterval(() => {
        if (!game || game.paused) {
          return;
        }
        if (game.spawnIndex >= getCurrentRoundList().length) {
          clearInterval(gameSpawnTimer);
          gameSpawnTimer = null;
          return;
        }
        spawnGameWord();
      }, GAME_SPAWN_MS[game.round]);
      gameFrame = requestAnimationFrame(updateGameWordPositions);
    }

    function syncGameWords() {
      if (!game || !root?.isConnected) {
        return;
      }
      const play = root.querySelector(".gp-play");
      if (!play) {
        return;
      }
      game.words.forEach((word) => {
        if (game.wordNodes.has(word.id)) {
          return;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gp-word";
        button.dataset.gpWord = String(word.id);
        button.textContent = word.text;
        play.appendChild(button);
        game.wordNodes.set(word.id, button);
      });
    }

    function setGameFlash(text = "") {
      if (!game) {
        return;
      }
      game.flash = text;
      updateGameUi();
      clearTimeout(gameFlashTimer);
      if (text) {
        gameFlashTimer = setTimeout(() => {
          if (!game) {
            return;
          }
          game.flash = "";
          updateGameUi();
        }, 1400);
      }
    }

    function tapGameWord(wordId) {
      if (!game) {
        return;
      }
      const word = game.words.find((entry) => entry.id === wordId);
      if (!word) {
        return;
      }
      game.words = game.words.filter((entry) => entry.id !== wordId);
      const node = game.wordNodes.get(wordId);
      if (node) {
        node.remove();
        game.wordNodes.delete(wordId);
      }
      if (word.target) {
        game.score += 1;
        tallySkill(`${sessionConfig.content}s`, true);
        setGameFlash(`Yes — ${word.text}`);
      } else {
        game.wrong += 1;
        tallySkill(`${sessionConfig.content}s`, false);
        setGameFlash(`${word.text} is not one — keep looking`);
      }
      persistCurrentProgress();
      updateGameUi();
      if (!game.paused && !game.words.length && game.spawnIndex >= getCurrentRoundList().length) {
        endGameRound();
      }
    }

    function pauseForMiss(word) {
      if (!game || game.paused) {
        return;
      }
      clearInterval(gameSpawnTimer);
      gameSpawnTimer = null;
      game.paused = true;
      game.missedWord = word.text;
      game.missed.push(word.text);
      tallySkill(`${sessionConfig.content}s`, false);
      const node = game.wordNodes.get(word.id);
      if (node) {
        node.remove();
        game.wordNodes.delete(word.id);
      }
      persistCurrentProgress();
      updateGameUi();
    }

    function keepGameGoing() {
      if (!game) {
        return;
      }
      game.paused = false;
      game.missedWord = "";
      persistCurrentProgress();
      updateGameUi();
      startGameLoops();
    }

    function endGameRound() {
      if (!game) {
        return;
      }
      const priorScore = game.roundScores.reduce((total, score) => total + score, 0);
      game.roundScores.push(game.score - priorScore);
      if (game.round < 2) {
        beginGame(game.round + 1);
        return;
      }
      const totalTargets = GP_TERMS[sessionConfig.content].rounds
        .reduce((sum, round) => sum + round.filter((item) => item[1]).length, 0);
      finishSession(game.score, totalTargets, {
        roundScores: [...game.roundScores],
        missed: [...new Set(game.missed)]
      });
    }

    function getRetryHint(item, skillKey = "", act = "") {
      if (act === "pick") {
        return "Read the whole sentence and choose the one word that matches the term.";
      }
      if (act === "tense" || skillKey === "tense") {
        return "Look closely at the verb form and any time clue in the sentence.";
      }
      if (act === "binary") {
        return "Ask whether the line gives one complete idea.";
      }
      if (act === "join") {
        return "Choose the word that links the two ideas most clearly.";
      }
      switch (skillKey) {
        case "capitals":
          return "Check the first word and any word that should be a name or I.";
        case "end-punctuation":
          return "Read it aloud and decide how the sentence should end.";
        case "sv-agreement":
          return "Match the verb to one subject or more than one subject.";
        case "fragments":
          return "Ask whether this is a full sentence or only part of one.";
        case "apostrophes":
          return "Look for a word that should show belonging.";
        case "commas":
          return "Check whether the opening part needs a pause before the main idea.";
        case "construction":
          return "Read it again and look for the missing action word.";
        case "compare":
          return "Find one way the two ideas are alike or different.";
        case "purpose":
          return "Think about what the writer wants the reader to understand.";
        default:
          return "Look closely at the sentence before choosing again.";
      }
    }

    function getReplayParagraphIndex(evidence = "") {
      const match = String(evidence || "").match(/paragraph\s+(\d+)/i);
      if (!match) {
        return -1;
      }
      return Math.max(0, Number(match[1]) - 1);
    }

    function getCurrentActivityItem() {
      return activity?.items?.[activity.i] || null;
    }

    function canAdvanceChoice(act = sessionConfig?.act, item = getCurrentActivityItem()) {
      if (!item || !activity) {
        return false;
      }
      if (act === "mc" || act === "tense") {
        return activity.picked === item.a;
      }
      if (act === "pick" || act === "comp" || act === "binary" || act === "join" || act === "mixed") {
        return activity.picked === item.a || activity.attempts > 1;
      }
      return activity.picked === item.a;
    }

    function shouldRevealChoiceAnswer(act = sessionConfig?.act, item = getCurrentActivityItem()) {
      if (!item || !activity) {
        return false;
      }
      if (activity.picked === item.a) {
        return true;
      }
      return activity.attempts > 1 && (act === "pick" || act === "comp" || act === "binary" || act === "join" || act === "mixed");
    }

    function answerCurrentOption(index) {
      if (!sessionConfig || !activity) {
        return;
      }
      const item = getCurrentActivityItem();
      if (!item || activity.picked === item.a) {
        return;
      }
      const act = sessionConfig.act;
      const skillKey = act === "tense" ? "tense" : act === "pick" ? `${sessionConfig.content}s` : item.skill;
      const isRight = index === item.a;
      tallySkill(skillKey, isRight);
      activity.picked = index;
      if (isRight) {
        activity.right += 1;
        activity.feedback = item.why || "That is right.";
        if (act === "comp") {
          activity.replayIndex = getReplayParagraphIndex(item.ev);
        }
        persistCurrentProgress();
        paint();
        return;
      }
      activity.attempts += 1;
      if (act === "comp") {
        activity.replayIndex = getReplayParagraphIndex(item.ev);
        activity.feedback = activity.attempts === 1
          ? `Look again at ${item.ev}.`
          : `${item.why} Look in ${item.ev}.`;
      } else {
        activity.feedback = activity.attempts === 1
          ? getRetryHint(item, skillKey, act)
          : item.why || "Check the sentence again.";
      }
      persistCurrentProgress();
      paint();
    }

    function nextItem() {
      if (!sessionConfig || !activity) {
        return;
      }
      const items = activity.items || [];
      if (activity.i >= items.length - 1) {
        if (sessionConfig.act === "build") {
          finishSession(activity.right, getBuildTotal(items));
          return;
        }
        if (sessionConfig.act === "rewrite") {
          finishSession(activity.right, getRewriteTotal(items));
          return;
        }
        finishSession(activity.right, items.length);
        return;
      }
      activity.i += 1;
      activity.picked = null;
      activity.attempts = 0;
      activity.feedback = "";
      activity.checked = false;
      activity.replayIndex = -1;
      activity.text = "";
      activity.subjectPick = null;
      activity.verbPick = null;
      activity.choices = {};
      persistCurrentProgress();
      paint();
    }

    function getFixData() {
      const data = GP_FIX[sessionConfig?.content] || {};
      const items = Array.isArray(data.items) && data.items.length
        ? data.items
        : data.tokens
          ? [{ tokens: data.tokens }]
          : [];
      return { ...data, items };
    }

    function getCurrentFixItem() {
      return activity?.items?.[activity.i] || null;
    }

    function getFixItemSlotTotal(item = getCurrentFixItem()) {
      return (item?.tokens || []).filter((entry) => entry.slot).length;
    }

    function isCurrentFixItemComplete() {
      const item = getCurrentFixItem();
      if (!item) {
        return false;
      }
      return Object.keys(activity?.filled || {}).length >= getFixItemSlotTotal(item);
    }

    function chooseFixChip(chipKey = "") {
      if (!activity) {
        return;
      }
      activity.chip = activity.chip === chipKey ? "" : chipKey;
      activity.feedback = "";
      persistCurrentProgress();
      paint();
    }

    function tapFixSlot(slotKey = "") {
      if (!activity || !slotKey || activity.filled[slotKey]) {
        return;
      }
      const data = getFixData();
      const item = getCurrentFixItem();
      const token = item?.tokens?.find((entry) => entry.slot === slotKey);
      if (!token) {
        return;
      }
      if (!activity.chip) {
        activity.feedback = "Choose a mark first.";
        paint();
        return;
      }
      if (activity.chip === token.need) {
        activity.filled[slotKey] = activity.chip;
        activity.right += 1;
        activity.feedback = isCurrentFixItemComplete()
          ? activity.i >= activity.items.length - 1
            ? "Sentence fixed. Finish the session when you are ready."
            : "Sentence fixed. Move to the next one when you are ready."
          : "That is right.";
        const skill = data.chips.find((chip) => chip.k === activity.chip)?.skill || "";
        tallySkill(skill, true);
        activity.chip = "";
      } else {
        activity.feedback = "Not that mark here — look at what the sentence needs.";
        const skill = data.chips.find((chip) => chip.k === activity.chip)?.skill || "";
        tallySkill(skill, false);
      }
      persistCurrentProgress();
      paint();
    }

    function finishFix() {
      if (!activity || !isCurrentFixItemComplete()) {
        return;
      }
      if (activity.i < activity.items.length - 1) {
        activity.i += 1;
        activity.filled = {};
        activity.chip = "";
        activity.feedback = "";
        persistCurrentProgress();
        paint();
        return;
      }
      const total = activity.items.reduce((sum, item) => sum + getFixItemSlotTotal(item), 0);
      finishSession(activity.right, total, { sentences: activity.items.length });
    }

    function submitWrite() {
      if (!activity) {
        return;
      }
      if (!activity.submitted) {
        activity.submitted = true;
        persistCurrentProgress();
        paint();
        return;
      }
      const checks = buildSentenceChecks(activity.text);
      const score = checks.filter((check) => check.ok).length;
      checks.forEach((check) => tallySkill("construction", check.ok));
      finishSession(score, checks.length);
    }

    function submitRewrite() {
      if (!activity) {
        return;
      }
      if (activity.checked || activity.attempts > 1) {
        nextItem();
        return;
      }
      const item = getCurrentActivityItem();
      const answer = normaliseText(activity.text);
      if (!answer) {
        activity.feedback = "Write the sentence in the new tense first.";
        paint();
        return;
      }
      const acceptable = item.answers.some((candidate) => normaliseText(candidate) === answer);
      if (acceptable) {
        activity.right += 1;
        activity.checked = true;
        activity.feedback = item.why;
        tallySkill("tense", true);
      } else {
        activity.attempts += 1;
        tallySkill("tense", false);
        activity.feedback = activity.attempts === 1 ? item.hint : `${item.why} A full answer is: ${item.answers[0]}`;
      }
      persistCurrentProgress();
      paint();
    }

    function pickSelectToken(index) {
      if (!activity || activity.checked) {
        return;
      }
      if (activity.subjectPick === null) {
        activity.subjectPick = index;
      } else {
        activity.verbPick = activity.verbPick === index ? null : index;
      }
      activity.feedback = "";
      persistCurrentProgress();
      paint();
    }

    function submitSelect() {
      if (!activity) {
        return;
      }
      if (activity.checked || activity.attempts > 1) {
        nextItem();
        return;
      }
      const item = getCurrentActivityItem();
      if (activity.subjectPick === null || activity.verbPick === null) {
        activity.feedback = "Tap one subject word and one verb word.";
        paint();
        return;
      }
      const isRight = activity.subjectPick === item.subject && activity.verbPick === item.verb;
      tallySkill("subject-verb", isRight);
      if (isRight) {
        activity.right += 1;
        activity.checked = true;
        activity.feedback = item.why;
      } else {
        activity.attempts += 1;
        activity.feedback = activity.attempts === 1
          ? "The subject is who or what the sentence is about. The verb is the action or state."
          : item.why;
      }
      persistCurrentProgress();
      paint();
    }

    function chooseBuildOption(groupIndex, optionIndex) {
      if (!activity || activity.checked) {
        return;
      }
      activity.choices = { ...activity.choices, [groupIndex]: optionIndex };
      activity.feedback = "";
      persistCurrentProgress();
      paint();
    }

    function buildSentencePreview(item, choices = {}) {
      return item.template.replace(/\{\{(\d+)\}\}/g, (match, groupIndex) => {
        const optIndex = choices[groupIndex];
        const option = item.groups?.[groupIndex]?.opts?.[optIndex];
        return option || "_____";
      });
    }

    function submitBuild() {
      if (!activity) {
        return;
      }
      if (activity.checked) {
        nextItem();
        return;
      }
      const item = getCurrentActivityItem();
      const allChosen = item.groups.every((group, index) => Number.isInteger(activity.choices[index]));
      if (!allChosen) {
        activity.feedback = "Choose one option in each row before checking.";
        paint();
        return;
      }
      let correctCount = 0;
      item.groups.forEach((group, index) => {
        const isCorrect = activity.choices[index] === group.a;
        tallySkill("sentence-expansion", isCorrect);
        if (isCorrect) {
          correctCount += 1;
        }
      });
      activity.right += correctCount;
      activity.checked = true;
      activity.feedback = correctCount === item.groups.length
        ? item.why
        : `${item.why} Read the stronger sentence aloud and listen for which details make the most sense.`;
      persistCurrentProgress();
      paint();
    }

    function playPassageParagraphs(indices = []) {
      if (!activity || sessionConfig?.act !== "comp") {
        return;
      }
      const passage = GP_PASSAGES[sessionConfig.content];
      if (!passage) {
        return;
      }
      if (activity.playing) {
        stopSpeech();
        activity.playing = false;
        activity.reading = -1;
        paint();
        return;
      }
      const queue = indices
        .map((index) => Number(index))
        .filter((index) => Number.isInteger(index) && index >= 0 && index < passage.paragraphs.length);
      if (!queue.length) {
        return;
      }
      activity.playing = true;
      activity.reading = queue[0];
      paint();
      try {
        stopSpeech();
        queue.forEach((paragraphIndex, queueIndex) => {
          const paragraph = passage.paragraphs[paragraphIndex];
          const utterance = new SpeechSynthesisUtterance(paragraph);
          utterance.rate = 0.85;
          utterance.onstart = () => {
            activity.reading = paragraphIndex;
            renderPassageHighlight();
          };
          utterance.onend = () => {
            if (queueIndex === queue.length - 1) {
              activity.playing = false;
              activity.reading = -1;
              renderPassageHighlight();
            }
          };
          window.speechSynthesis.speak(utterance);
        });
      } catch (error) {
        activity.playing = false;
        activity.reading = -1;
        paint();
      }
    }

    function readPassage() {
      const passage = GP_PASSAGES[sessionConfig?.content];
      if (!passage) {
        return;
      }
      playPassageParagraphs(passage.paragraphs.map((_, index) => index));
    }

    function renderPassageHighlight() {
      if (!root?.isConnected || sessionConfig?.act !== "comp") {
        return;
      }
      root.querySelectorAll(".gp-passage p").forEach((paragraph, index) => {
        paragraph.classList.toggle("is-reading", index === activity.reading);
      });
    }

    function updateIntroAudioUi() {
      if (!root?.isConnected || view !== "intro") {
        return;
      }
      const fill = root.querySelector(".gp-audio .gp-bar-fill");
      const button = root.querySelector(".gp-audio-btn");
      const note = root.querySelector(".gp-gate-note");
      const card = root.querySelector(".gp-audio");
      const start = root.querySelector("[data-gp='start']");
      if (fill) {
        fill.style.width = `${audio.prog}%`;
      }
      if (button) {
        button.textContent = audio.playing ? "…" : "▶";
      }
      if (card) {
        card.classList.toggle("is-heard", audio.done);
      }
      if (start) {
        start.disabled = !audio.done;
      }
      if (note) {
        note.textContent = usesWrittenOnlyIntro()
          ? "Read the reminder above, then begin the five sentence checks."
          : audio.done
            ? (sessionConfig?.act === "game"
              ? "Three rounds: easy, standard, challenge."
              : "The explanation is complete. You can begin now.")
            : "START unlocks when the explanation finishes.";
      }
    }

    function updateGameUi() {
      if (!root?.isConnected || sessionConfig?.act !== "game" || view !== "activity" || !game) {
        return;
      }
      const roundBadge = root.querySelector(".gp-session-pill");
      const flash = root.querySelector(".gp-flash");
      const score = root.querySelector("[data-gp-game-score]");
      const wrong = root.querySelector("[data-gp-game-wrong]");
      const overlay = root.querySelector(".gp-miss");
      if (roundBadge) {
        roundBadge.textContent = `Round ${game.round + 1} of 3`;
      }
      if (flash) {
        flash.hidden = !game.flash;
        flash.textContent = game.flash;
      }
      if (score) {
        score.textContent = String(game.score);
      }
      if (wrong) {
        wrong.textContent = String(game.wrong);
      }
      if (overlay) {
        overlay.hidden = !game.paused;
        overlay.innerHTML = game.paused ? `
          <div class="gp-eyebrow">Missed target</div>
          <div class="gp-miss-word">${escapeHtml(game.missedWord)}</div>
          <p class="gp-meta">${escapeHtml(`${game.missedWord} was one of the ${GP_TERMS[sessionConfig.content].instruction.toLowerCase()}.`)}</p>
          <button type="button" class="gp-cta gp-cta-plum" data-gp="keep-going">Keep going</button>
        ` : "";
      }
    }

    function buildProgressChips() {
      const meta = getSessionMeta();
      if (!meta) {
        return "";
      }
      return `<span class="gp-session-meta">${escapeHtml(`Session ${meta.sessionNumber} · activity ${getActivityIndexInSession(meta.activityNumber)} of ${meta.size}`)}</span>`;
    }

    function buildHubView() {
      const hasReadySession = Number(G.current?.n || 0) > G.done || G.done < GP_SESSIONS.length;
      const readySession = getReadySessionConfig();
      const readyMeta = readySession ? getSessionMeta(readySession.n) : null;
      const hasCurrentActivity = Number(G.current?.n || 0) > G.done && readySession?.n === Number(G.current?.n || 0);
      const isComplete = !hasReadySession;
      const sessionProgress = readyMeta ? getCompletedActivitiesInSession(readyMeta.sessionNumber) : 0;
      const sessionProgressPercent = readyMeta
        ? Math.round((sessionProgress / Math.max(1, readyMeta.size)) * 100)
        : 100;
      const title = hasCurrentActivity
        ? `Session ${readyMeta?.sessionNumber || 1} is ready to continue`
        : isComplete
          ? "All current grammar activities are complete"
          : `Session ${readyMeta?.sessionNumber || 1} is ready`;
      const copy = hasCurrentActivity
        ? `Your place is saved. Activity ${getActivityIndexInSession(readySession?.n || 1)} is ready to continue.`
        : isComplete
          ? "You can revisit the latest activity, open Property, or check Progress."
          : readySession
            ? `${readySession.title} opens first. Finish all ${readyMeta?.size || GP_ACTIVITIES_PER_SESSION} activities in this session to unlock the next property upgrade.`
            : "Open the next activity and the program will move forward automatically when you finish.";
      const buttonLabel = hasCurrentActivity
        ? "Continue activity"
        : isComplete
          ? "Review latest activity"
          : "Start activity";
      return `
        <div class="gp-view" data-gp-view="hub">
          <header class="gp-head">
            <div>
              <div class="gp-eyebrow-soft">English · Year 7</div>
              <div class="gp-h1">Grammar</div>
            </div>
          </header>
          <div class="gp-card gp-progress">
            <div class="gp-eyebrow">Session</div>
            <div class="gp-strong">${escapeHtml(title)}</div>
            <div class="gp-meta">${escapeHtml(copy)}</div>
            <div class="gp-bar"><div class="gp-bar-fill" style="width:${sessionProgressPercent}%"></div></div>
            <div class="gp-next-reward gp-meta">${escapeHtml(getRewardCopy())}</div>
            ${readySession && hasReadySession ? `<button type="button" class="gp-cta gp-cta-plum" data-gp="open-ready">${escapeHtml(buttonLabel)}</button>` : ""}
          </div>
        </div>
      `;
    }

    function buildIntroView() {
      const lesson = getLessonDefinition();
      const sessionMeta = getSessionMeta();
      const writtenOnly = usesWrittenOnlyIntro();
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">Grammar</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">Session ${escapeHtml(String(sessionMeta?.sessionNumber || 1))}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card gp-intro">
              <div class="gp-eyebrow">${escapeHtml(`Session ${sessionMeta?.sessionNumber || 1} · activity ${getActivityIndexInSession()} of ${sessionMeta?.size || GP_ACTIVITIES_PER_SESSION}`)}</div>
              <h2 class="gp-term">${escapeHtml(lesson.term)}</h2>
              <p class="gp-def">${escapeHtml(lesson.definition)}</p>
              <div class="gp-examples">
                ${lesson.examples.map((example) => `<div class="gp-example">${escapeHtml(example)}</div>`).join("")}
              </div>
              ${writtenOnly
                ? ""
                : `<div class="gp-audio${audio.done ? " is-heard" : ""}">
                    <button type="button" class="gp-audio-btn" data-gp="play-audio">${audio.playing ? "…" : "▶"}</button>
                    <div>
                      <div class="gp-strong">Listen to the explanation</div>
                      <div class="gp-meta">${escapeHtml(getIntroListenCopy())}</div>
                    </div>
                    <div class="gp-bar"><div class="gp-bar-fill" style="width:${audio.prog}%"></div></div>
                  </div>`}
              <button type="button" class="gp-cta" data-gp="start" ${audio.done ? "" : "disabled"}>${escapeHtml(getIntroStartLabel())}</button>
              <div class="gp-gate-note">${writtenOnly
                ? "Read the reminder above, then begin the five sentence checks."
                : audio.done
                  ? (sessionConfig.act === "game" ? "Three rounds: easy, standard, challenge." : "The explanation is complete. You can begin now.")
                  : "START unlocks when the explanation finishes."}</div>
            </div>
          </div>
        </div>
      `;
    }

    function buildGameView() {
      const term = GP_TERMS[sessionConfig.content];
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(sessionConfig.title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">Round ${escapeHtml(String((game?.round || 0) + 1))} of 3</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <div class="gp-row-baseline">
                <div class="gp-strong">${escapeHtml(term.instruction)}</div>
                <button type="button" class="gp-pill-btn gp-pill-btn--mini" data-gp="play-audio">Remind me</button>
              </div>
              <div class="gp-meta">Correct: <strong data-gp-game-score>${escapeHtml(String(game?.score || 0))}</strong> · Missed taps: <strong data-gp-game-wrong>${escapeHtml(String(game?.wrong || 0))}</strong></div>
              <div class="gp-play">
                <div class="gp-miss" hidden></div>
                <div class="gp-flash" hidden></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function buildPickView() {
      const term = GP_TERMS[sessionConfig.content];
      const item = getCurrentActivityItem();
      const canAdvance = canAdvanceChoice("pick", item);
      const revealCorrect = shouldRevealChoiceAnswer("pick", item);
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(sessionConfig.title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">${escapeHtml(`Sentence ${activity.i + 1} of ${(activity.items || []).length}`)}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <div class="gp-row-baseline">
                <div class="gp-strong">${escapeHtml(term.instruction)}</div>
                <div class="gp-meta">Tap the one word in the sentence that matches the term.</div>
              </div>
              <div class="gp-token-grid">
                ${(item?.words || []).map((word, index) => {
                  const isChosen = activity.picked === index;
                  const isRight = revealCorrect && index === item.a;
                  const isWrong = activity.picked === index && index !== item.a;
                  return `<button type="button" class="gp-token-btn${isChosen ? " is-on" : ""}${isRight ? " is-right" : ""}${isWrong ? " is-wrong" : ""}" data-gp-opt="${index}">${escapeHtml(word)}</button>`;
                }).join("")}
              </div>
              ${activity.feedback ? `<div class="gp-fb${activity.picked === item?.a ? " is-ok" : " is-hint"}">${escapeHtml(activity.feedback)}</div>` : ""}
              ${canAdvance ? `<button type="button" class="gp-cta gp-cta-plum" data-gp="next">${escapeHtml(activity.i >= (activity.items || []).length - 1 ? "Finish session" : "Next sentence")}</button>` : ""}
            </div>
          </div>
        </div>
      `;
    }

    function buildOptionsMarkup(item, optionSet, actOverride = sessionConfig?.act, ariaLabel = "options") {
      const revealCorrect = shouldRevealChoiceAnswer(actOverride, item);
      return `
        <div class="gp-options" aria-label="${escapeHtml(ariaLabel)}">
          ${optionSet.map((option, index) => {
            const isRight = revealCorrect && index === item.a;
            const isWrong = activity.picked === index && index !== item.a;
            return `
              <button type="button" class="gp-opt${isRight ? " is-right" : ""}${isWrong ? " is-wrong" : ""}" data-gp-opt="${index}">
                <span>${escapeHtml(option)}</span>
                <i class="gp-mark">${isRight ? "✓" : isWrong ? "✕" : ""}</i>
              </button>
            `;
          }).join("")}
        </div>
      `;
    }

    function buildChoiceView({ title, item, optionSet, prompt, actType = sessionConfig?.act, counterLabel = "Question", canAdvance = false }) {
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">${escapeHtml(`${counterLabel} ${activity.i + 1}`)}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              ${prompt ? `<p class="gp-meta">${escapeHtml(prompt)}</p>` : ""}
              <p class="gp-def">${escapeHtml(item.s || item.q || item.prompt || item.sentence || "")}</p>
              ${buildOptionsMarkup(item, optionSet, actType, `${title} answers`)}
              ${activity.feedback ? `<div class="gp-fb${activity.picked === item.a ? " is-ok" : " is-hint"}">${escapeHtml(activity.feedback)}</div>` : ""}
              ${canAdvance ? `<button type="button" class="gp-cta gp-cta-plum" data-gp="next">Next</button>` : ""}
            </div>
          </div>
        </div>
      `;
    }

    function buildFixTokens(tokens, filled) {
      return tokens.map((token, index) => {
        if (!token.slot) {
          const next = tokens[index + 1];
          const needsTightEnd = next?.slot && (next.need === "end" || next.need === "comma");
          return `${escapeHtml(token.t)}${needsTightEnd ? "" : " "}`;
        }
        const fill = filled[token.slot] || "";
        if (token.need === "cap") {
          return `<span class="gp-slot${fill ? " is-filled" : ""}" data-gp-slot="${escapeHtml(token.slot)}">${escapeHtml(fill ? token.t.charAt(0).toUpperCase() + token.t.slice(1) : token.t)}</span> `;
        }
        if (token.need === "apos") {
          return `<span class="gp-slot${fill ? " is-filled" : ""}" data-gp-slot="${escapeHtml(token.slot)}">${escapeHtml(fill ? token.c || token.t : token.t)}</span> `;
        }
        return `<span class="gp-slot${fill ? " is-filled" : ""}" data-gp-slot="${escapeHtml(token.slot)}">${escapeHtml(fill === "comma" ? "," : fill === "end" ? "." : "＋")}</span>${token.need === "comma" ? " " : ""}`;
      }).join("");
    }

    function buildFixView() {
      const data = getFixData();
      const item = getCurrentFixItem();
      const totalSlots = getFixItemSlotTotal(item);
      const currentProgress = Object.keys(activity.filled).length;
      const totalSentences = activity.items.length;
      const isComplete = isCurrentFixItemComplete();
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(sessionConfig.title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">${escapeHtml(`Sentence ${activity.i + 1} of ${totalSentences}`)}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <div class="gp-row-baseline">
                <div class="gp-strong">Fix this sentence before moving on.</div>
                <div class="gp-meta">${escapeHtml(`${currentProgress}/${totalSlots} corrections placed`)}</div>
              </div>
              <div class="gp-para">${buildFixTokens(item?.tokens || [], activity.filled)}</div>
              <div class="gp-chip-row">
                ${data.chips.map((chip) => `<button type="button" class="gp-chip-btn${activity.chip === chip.k ? " is-on" : ""}" data-gp-chip="${escapeHtml(chip.k)}">${escapeHtml(chip.label)}</button>`).join("")}
              </div>
              ${activity.feedback ? `<div class="gp-fb${activity.feedback === "That is right." ? " is-ok" : " is-hint"}">${escapeHtml(activity.feedback)}</div>` : ""}
              <button type="button" class="gp-cta gp-cta-plum" data-gp="finish-fix" ${isComplete ? "" : "disabled"}>${escapeHtml(activity.i >= totalSentences - 1 ? "Finish session" : "Next sentence")}</button>
            </div>
          </div>
        </div>
      `;
    }

    function buildComprehensionView() {
      const passage = GP_PASSAGES[sessionConfig.content];
      const question = getCurrentActivityItem();
      const replayButton = activity.replayIndex >= 0
        ? `<button type="button" class="gp-pill-btn gp-pill-btn--mini gp-replay-btn" data-gp="replay-paragraph">Replay ${escapeHtml(`paragraph ${activity.replayIndex + 1}`)}</button>`
        : "";
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(sessionConfig.title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">Question ${escapeHtml(String(activity.i + 1))}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <div class="gp-row-baseline">
                <div>
                  <div class="gp-strong">${escapeHtml(passage.title)}</div>
                  <div class="gp-meta">${escapeHtml(`${passage.textType} · ${passage.sourceNote}`)}</div>
                </div>
                <button type="button" class="gp-pill-btn gp-pill-btn--mini" data-gp="read-passage">${activity.playing ? "Stop" : "Listen"}</button>
              </div>
              <div class="gp-passage">
                ${passage.paragraphs.map((paragraph, index) => `<p${index === activity.reading ? ' class="is-reading"' : ""}>${escapeHtml(paragraph)}</p>`).join("")}
              </div>
              <p class="gp-def">${escapeHtml(question.q)}</p>
              ${buildOptionsMarkup(question, question.opts, "comp", "Comprehension answers")}
              ${activity.feedback ? `<div class="gp-fb${activity.picked === question.a ? " is-ok" : " is-hint"}">${escapeHtml(activity.feedback)}</div>` : ""}
              ${activity.attempts > 0 ? `<div class="gp-inline-actions">${replayButton}</div>` : ""}
              ${canAdvanceChoice("comp", question) ? `<button type="button" class="gp-cta gp-cta-plum" data-gp="next">Next</button>` : ""}
            </div>
          </div>
        </div>
      `;
    }

    function buildWriteView() {
      const checks = activity.submitted ? buildSentenceChecks(activity.text) : [];
      const sessionMeta = getSessionMeta();
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(sessionConfig.title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">${escapeHtml(`Activity ${getActivityIndexInSession()} of ${sessionMeta?.size || GP_ACTIVITIES_PER_SESSION}`)}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <p class="gp-def">Write one complete sentence with at least 12 words. We are checking grammar, not spelling.</p>
              <textarea class="gp-writer" placeholder="Write your sentence here...">${escapeHtml(activity.text)}</textarea>
              ${activity.submitted ? `<div class="gp-checks">${checks.map((check) => `<div class="gp-check${check.ok ? " is-ok" : " is-warm"}"><span>${check.ok ? "✓" : "✕"}</span><span>${escapeHtml(check.label)}</span></div>`).join("")}</div>` : ""}
              <button type="button" class="gp-cta gp-cta-plum" data-gp="submit-write">${activity.submitted ? "Finish session" : "Check my sentence"}</button>
            </div>
          </div>
        </div>
      `;
    }

    function buildBinaryView() {
      const item = getCurrentActivityItem();
      return buildChoiceView({
        title: sessionConfig.title,
        item,
        optionSet: ["Complete sentence", "Fragment"],
        prompt: "Decide whether the line is a full sentence or only part of one.",
        actType: "binary",
        canAdvance: canAdvanceChoice("binary", item)
      });
    }

    function buildRewriteView() {
      const item = getCurrentActivityItem();
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(sessionConfig.title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">Sentence ${escapeHtml(String(activity.i + 1))}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <p class="gp-meta">${escapeHtml(`Rewrite this in the ${item.target.toLowerCase()}.`)}</p>
              <p class="gp-def">${escapeHtml(item.source)}</p>
              <textarea class="gp-writer gp-rewriter" placeholder="Write the new sentence here...">${escapeHtml(activity.text)}</textarea>
              ${activity.feedback ? `<div class="gp-fb${activity.checked ? " is-ok" : " is-hint"}">${escapeHtml(activity.feedback)}</div>` : ""}
              <button type="button" class="gp-cta gp-cta-plum" data-gp="submit-rewrite">${activity.checked || activity.attempts > 1 ? "Next" : "Check my rewrite"}</button>
            </div>
          </div>
        </div>
      `;
    }

    function buildJoinView() {
      const item = getCurrentActivityItem();
      return buildChoiceView({
        title: sessionConfig.title,
        item: { ...item, s: `${item.left} … ${item.right}` },
        optionSet: item.opts,
        prompt: "Choose the best joining word.",
        actType: "join",
        canAdvance: canAdvanceChoice("join", item)
      });
    }

    function buildSelectView() {
      const item = getCurrentActivityItem();
      const reveal = activity.checked || activity.attempts > 1;
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(sessionConfig.title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">Sentence ${escapeHtml(String(activity.i + 1))}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <p class="gp-meta">Tap the subject first, then tap the verb.</p>
              <div class="gp-token-grid">
                ${item.words.map((word, index) => {
                  const isSubjectPick = activity.subjectPick === index;
                  const isVerbPick = activity.verbPick === index;
                  const isCorrect = reveal && (index === item.subject || index === item.verb);
                  const isWrong = reveal && ((isSubjectPick && index !== item.subject) || (isVerbPick && index !== item.verb));
                  return `<button type="button" class="gp-token-btn${isSubjectPick || isVerbPick ? " is-on" : ""}${isCorrect ? " is-right" : ""}${isWrong ? " is-wrong" : ""}" data-gp-select-token="${index}">${escapeHtml(word)}</button>`;
                }).join("")}
              </div>
              ${activity.feedback ? `<div class="gp-fb${activity.checked ? " is-ok" : " is-hint"}">${escapeHtml(activity.feedback)}</div>` : ""}
              <button type="button" class="gp-cta gp-cta-plum" data-gp="submit-select">${activity.checked || activity.attempts > 1 ? "Next" : "Check my choices"}</button>
            </div>
          </div>
        </div>
      `;
    }

    function buildBuildView() {
      const item = getCurrentActivityItem();
      const preview = buildSentencePreview(item, activity.choices);
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(sessionConfig.title)}</div>
            </div>
            <span class="gp-pill gp-pill-plum gp-session-pill">Sentence ${escapeHtml(String(activity.i + 1))}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <p class="gp-meta">Build a stronger sentence by choosing the best details.</p>
              <p class="gp-def">${escapeHtml(item.base)}</p>
              <div class="gp-preview">${escapeHtml(preview)}</div>
              <div class="gp-builder">
                ${item.groups.map((group, groupIndex) => `
                  <div class="gp-builder-group">
                    <div class="gp-strong">${escapeHtml(group.label)}</div>
                    <div class="gp-builder-options">
                      ${group.opts.map((option, optionIndex) => `
                        <button
                          type="button"
                          class="gp-builder-opt${activity.choices[groupIndex] === optionIndex ? " is-on" : ""}${activity.checked && group.a === optionIndex ? " is-right" : ""}${activity.checked && activity.choices[groupIndex] === optionIndex && group.a !== optionIndex ? " is-wrong" : ""}"
                          data-gp-build-option="${groupIndex}:${optionIndex}"
                        >
                          ${escapeHtml(option)}
                        </button>
                      `).join("")}
                    </div>
                  </div>
                `).join("")}
              </div>
              ${activity.feedback ? `<div class="gp-fb${activity.checked ? " is-ok" : " is-hint"}">${escapeHtml(activity.feedback)}</div>` : ""}
              <button type="button" class="gp-cta gp-cta-plum" data-gp="submit-build">${activity.checked ? "Next" : "Check my sentence"}</button>
            </div>
          </div>
        </div>
      `;
    }

    function buildMixedView() {
      const item = getCurrentActivityItem();
      if (item.kind === "binary") {
        return buildChoiceView({
          title: sessionConfig.title,
          item: { ...item, s: item.sentence },
          optionSet: item.opts,
          prompt: item.prompt,
          actType: "mixed",
          canAdvance: canAdvanceChoice("mixed", item)
        });
      }
      return buildChoiceView({
        title: sessionConfig.title,
        item: { ...item, s: item.prompt },
        optionSet: item.opts,
        prompt: "Quick review challenge.",
        actType: "mixed",
        canAdvance: canAdvanceChoice("mixed", item)
      });
    }

    function buildResultsView() {
      const latest = G.results.find((entry) => entry.n === sessionConfig?.n);
      const score = latest?.score || 0;
      const total = latest?.total || 0;
      const sessionMeta = getSessionMeta(sessionConfig?.n || 1);
      const roundScores = Array.isArray(latest?.details?.roundScores) ? latest.details.roundScores : [];
      const missedWords = Array.isArray(latest?.details?.missed) ? latest.details.missed : [];
      const propertyUpgrade = latest?.details?.propertyUpgrade || null;
      const hasNextActivity = G.done < GP_SESSIONS.length;
      const groupedSessionComplete = didCompleteGroupedSession();
      const resultsTitle = groupedSessionComplete
        ? `Session ${sessionMeta?.sessionNumber || ""} complete`
        : "Activity complete";
      const summaryCopy = groupedSessionComplete
        ? propertyUpgrade?.earned
          ? `${sessionConfig?.title || "This activity"} completed this session. ${propertyUpgrade.label || propertyUpgrade.title || "The next stage"} has been added to your property.`
          : `${sessionConfig?.title || "This activity"} completed this session. ${propertyUpgrade?.statusNote || "Your property stays at its current stage."}`
        : `${sessionConfig?.title || "This activity"} is complete. Return to Session and the next activity will open straight away.`;
      return `
        <div class="gp-view" data-gp-view="activity">
          <header class="gp-chrome">
            <div>
              <div class="gp-eyebrow-soft">English</div>
              <div class="gp-h2">${escapeHtml(resultsTitle)}</div>
            </div>
            <span class="gp-pill gp-pill-moss">${escapeHtml(`${score}/${total}`)}</span>
          </header>
          <div class="gp-chips">${buildProgressChips()}</div>
          <div class="gp-stage">
            <div class="gp-card">
              <div class="gp-term">${escapeHtml(String(score))}<span class="gp-term__meta"> / ${escapeHtml(String(total))}</span></div>
              <p class="gp-def">${escapeHtml(summaryCopy)}</p>
              ${groupedSessionComplete && propertyUpgrade
                ? `<article class="gp-upgrade-card">
                    <div class="gp-upgrade-card__image">
                      <img src="${escapeHtml(propertyUpgrade.image || "")}" alt="${escapeHtml(propertyUpgrade.title || "Property upgrade")}" loading="lazy" />
                    </div>
                    <div class="gp-upgrade-card__copy">
                      <div class="gp-label ${propertyUpgrade.earned ? "" : "gp-label-warm"}">${escapeHtml(propertyUpgrade.heading || "Property update")}</div>
                      <div class="gp-strong">${escapeHtml(propertyUpgrade.title || "Property stage")}</div>
                      <p class="gp-meta">${escapeHtml(propertyUpgrade.description || "")}</p>
                      <p class="gp-meta">${escapeHtml(propertyUpgrade.statusNote || "")}</p>
                    </div>
                  </article>`
                : ""}
              ${roundScores.length
                ? `<div class="gp-results-grid">
                    ${roundScores.map((roundScore, index) => `<div class="gp-results-chip">Round ${escapeHtml(String(index + 1))}: ${escapeHtml(String(roundScore))}</div>`).join("")}
                  </div>`
                : ""}
              ${missedWords.length
                ? `<div class="gp-results-note">
                    <div class="gp-label gp-label-warm">Missed words</div>
                    <p class="gp-meta">${escapeHtml(missedWords.join(", "))}</p>
                  </div>`
                : ""}
              <div class="gp-results-actions">
                <button type="button" class="gp-cta gp-cta-plum" data-gp-tab="property">Visit the property</button>
                <button type="button" class="gp-pill-btn" data-gp="back">${escapeHtml(hasNextActivity ? "Back to session" : "Back to grammar")}</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function buildProgressView() {
      const taughtSkills = GP_SKILLS.filter((skill) => skill.from <= G.done);
      const skillBands = getTaughtSkillCounts();
      const reviewSkills = GP_SKILLS.filter((skill) => skillBand(skill.k) === "practice");
      const skillMarkup = (strand) => GP_SKILLS
        .filter((skill) => skill.strand === strand)
        .map((skill) => {
          const band = skillBand(skill.k);
          const untaught = skill.from > G.done;
          const bandLabel = untaught ? "Not yet taught" : band === "strong" ? "Strong" : band === "practice" ? "Needs practice" : "Developing";
          const barColor = untaught ? "var(--line2)" : band === "strong" ? "var(--accent2)" : band === "practice" ? "#B08968" : "var(--accent)";
          return `
            <div class="gp-skill${untaught ? " is-untaught" : ""}">
              <div class="gp-row-baseline">
                <span class="gp-skill-name">${escapeHtml(skill.name)}</span>
                <span class="gp-pill ${untaught ? "" : band === "strong" ? "gp-pill-moss" : band === "practice" ? "gp-pill-warm" : "gp-pill-plum"}">${escapeHtml(bandLabel)}</span>
              </div>
              <div class="gp-bar"><div class="gp-bar-fill" style="width:${untaught ? 0 : getSkillPercent(skill.k)}%;background:${barColor}"></div></div>
              <div class="gp-skill-seen">${escapeHtml(untaught ? `Starts in session ${skill.from}` : `Seen in session ${G.skills[skill.k]?.lastSession || skill.from}`)}</div>
            </div>
          `;
        }).join("");

      return `
        <div class="gp-view" data-gp-view="progress">
          <header class="gp-head">
            <div>
              <div class="gp-eyebrow-soft">English · Year 7</div>
              <div class="gp-h1">Progress</div>
            </div>
          </header>
          <div class="gp-stats">
            <div class="gp-stat"><div class="gp-strong">${escapeHtml(String(G.done))}</div><div class="gp-meta">Activities done</div></div>
            <div class="gp-stat"><div class="gp-strong">${escapeHtml(String(Math.min(getSessionGroupCount(), getCompletedSessionCount())))}</div><div class="gp-meta">Session upgrades earned</div></div>
          </div>
          <div class="gp-bands">
            <div class="gp-band"><div class="gp-strong">${escapeHtml(String(skillBands.strong))}</div><div class="gp-meta">Strong</div></div>
            <div class="gp-band"><div class="gp-strong">${escapeHtml(String(skillBands.developing))}</div><div class="gp-meta">Developing</div></div>
            <div class="gp-band"><div class="gp-strong">${escapeHtml(String(skillBands.practice))}</div><div class="gp-meta">Needs practice</div></div>
          </div>
          <div class="gp-assessed-note gp-meta">${escapeHtml(`${taughtSkills.length} skill${taughtSkills.length === 1 ? "" : "s"} taught so far. Untaught skills stay separate until their session is complete.`)}</div>
          <div class="gp-label">Grammar skills</div>
          <div class="gp-skills" data-strand="grammar">${skillMarkup("grammar")}</div>
          <div class="gp-label">Comprehension skills</div>
          <div class="gp-skills" data-strand="comp">${skillMarkup("comp")}</div>
          <div class="gp-label gp-label-warm">Coming back later</div>
          <p class="gp-meta">Weaker skills reappear inside normal sessions. Nothing is repeated straight away.</p>
          <div class="gp-review">
            ${reviewSkills.length
              ? reviewSkills.map((skill) => `<div class="gp-review-item">${escapeHtml(`${skill.name} will cycle back into later review work.`)}</div>`).join("")
              : `<div class="gp-review-item">${escapeHtml("No skills are currently flagged for extra review.")}</div>`}
          </div>
        </div>
      `;
    }

    function buildPropertyView() {
      return `
        <div class="gp-view" data-gp-view="property">
          ${buildRewardPropertyMarkup ? buildRewardPropertyMarkup() : ""}
        </div>
      `;
    }

    function buildSurfaceTabs() {
      const tabs = [
        { id: "hub", label: "Session" },
        { id: "property", label: "Property" },
        { id: "progress", label: "Progress" }
      ];

      return `
        <div class="ss-surface-tabs" role="tablist" aria-label="Grammar views">
          ${tabs
            .map(
              (entry) => `
                <button
                  type="button"
                  class="ss-surface-tab${tab === entry.id ? " is-active" : ""}"
                  data-gp-tab="${entry.id}"
                >
                  ${escapeHtml(entry.label)}
                </button>
              `
            )
            .join("")}
        </div>
      `;
    }

    function buildShell(contentMarkup) {
      return `
        <section class="gp-root" id="gp">
          ${buildSurfaceTabs()}
          ${contentMarkup}
        </section>
      `;
    }

    function goToSessionSurface() {
      stopAll();
      tab = "hub";
      sessionIndex = -1;
      sessionConfig = null;
      lessonKey = "";
      activity = null;
      const hasReadySession = Number(G.current?.n || 0) > G.done || G.done < GP_SESSIONS.length;
      if (hasReadySession) {
        openReadySession();
        return;
      }
      view = "hub";
      paint();
    }

    function paint() {
      if (!root || !subject) {
        return;
      }
      refreshState();
      if (tab === "property") {
        root.innerHTML = buildShell(buildPropertyView());
        mountRewardProperty(subject, root);
        return;
      }
      if (tab === "progress") {
        root.innerHTML = buildShell(buildProgressView());
        return;
      }
      if (!sessionConfig || view === "hub") {
        root.innerHTML = buildShell(buildHubView());
        return;
      }
      if (view === "intro") {
        root.innerHTML = buildShell(buildIntroView());
        updateIntroAudioUi();
        return;
      }
      if (view === "results") {
        root.innerHTML = buildShell(buildResultsView());
        return;
      }
      if (sessionConfig.act === "game") {
        root.innerHTML = buildShell(buildGameView());
        syncGameWords();
        updateGameUi();
        return;
      }
      if (sessionConfig.act === "pick") {
        root.innerHTML = buildShell(buildPickView());
        return;
      }
      if (sessionConfig.act === "mc") {
        const item = getCurrentActivityItem();
        root.innerHTML = buildShell(buildChoiceView({
          title: sessionConfig.title,
          item,
          optionSet: item.opts,
          actType: "mc",
          canAdvance: canAdvanceChoice("mc", item)
        }));
        return;
      }
      if (sessionConfig.act === "tense") {
        const item = getCurrentActivityItem();
        root.innerHTML = buildShell(buildChoiceView({
          title: sessionConfig.title,
          item,
          optionSet: ["Past", "Present", "Future"],
          actType: "tense",
          canAdvance: canAdvanceChoice("tense", item)
        }));
        return;
      }
      if (sessionConfig.act === "fix") {
        root.innerHTML = buildShell(buildFixView());
        return;
      }
      if (sessionConfig.act === "comp") {
        root.innerHTML = buildShell(buildComprehensionView());
        return;
      }
      if (sessionConfig.act === "write") {
        root.innerHTML = buildShell(buildWriteView());
        return;
      }
      if (sessionConfig.act === "binary") {
        root.innerHTML = buildShell(buildBinaryView());
        return;
      }
      if (sessionConfig.act === "rewrite") {
        root.innerHTML = buildShell(buildRewriteView());
        return;
      }
      if (sessionConfig.act === "join") {
        root.innerHTML = buildShell(buildJoinView());
        return;
      }
      if (sessionConfig.act === "select") {
        root.innerHTML = buildShell(buildSelectView());
        return;
      }
      if (sessionConfig.act === "build") {
        root.innerHTML = buildShell(buildBuildView());
        return;
      }
      if (sessionConfig.act === "mixed") {
        root.innerHTML = buildShell(buildMixedView());
        return;
      }
      root.innerHTML = buildShell(buildHubView());
    }

    function bind() {
      if (!root || root.dataset.grammarBound === "true") {
        return;
      }
      root.dataset.grammarBound = "true";
      root.addEventListener("click", (event) => {
        const target = event.target.closest("[data-gp-tab],[data-gp-open-session],[data-gp],[data-gp-opt],[data-gp-slot],[data-gp-chip],[data-gp-word],[data-gp-select-token],[data-gp-build-option]");
        if (!target || !root.contains(target)) {
          return;
        }
        if (target.dataset.gpTab) {
          if (sessionConfig && view !== "results" && sessionConfig.n > G.done) {
            persistCurrentProgress();
          }
          if (target.dataset.gpTab === "hub") {
            goToSessionSurface();
            return;
          }
          stopAll();
          tab = target.dataset.gpTab;
          view = "hub";
          paint();
          return;
        }
        if (target.dataset.gpOpenSession) {
          openSession(Number(target.dataset.gpOpenSession));
          return;
        }
        if (target.dataset.gpWord) {
          tapGameWord(Number(target.dataset.gpWord));
          return;
        }
        if (target.dataset.gpOpt) {
          answerCurrentOption(Number(target.dataset.gpOpt));
          return;
        }
        if (target.dataset.gpSlot) {
          tapFixSlot(target.dataset.gpSlot);
          return;
        }
        if (target.dataset.gpChip) {
          chooseFixChip(target.dataset.gpChip);
          return;
        }
        if (target.dataset.gpSelectToken) {
          pickSelectToken(Number(target.dataset.gpSelectToken));
          return;
        }
        if (target.dataset.gpBuildOption) {
          const [groupIndex, optionIndex] = target.dataset.gpBuildOption.split(":").map(Number);
          chooseBuildOption(groupIndex, optionIndex);
          return;
        }

        switch (target.dataset.gp) {
          case "open-ready":
            openReadySession();
            return;
          case "play-audio":
            if (view === "intro") {
              playTeachAudio();
              return;
            }
            if (sessionConfig?.act === "comp") {
              readPassage();
              return;
            }
            if (sessionConfig?.act === "game") {
              const term = GP_TERMS[sessionConfig.content];
              if (term) {
                speakInstruction(term.audioText, () => {
                  audio.done = true;
                  audio.prog = 100;
                  markHeard(sessionConfig.content);
                  updateGameUi();
                });
              }
            }
            return;
          case "start":
            startActivity();
            return;
          case "next":
            nextItem();
            return;
          case "keep-going":
            keepGameGoing();
            return;
          case "read-passage":
            readPassage();
            return;
          case "replay-paragraph":
            if (sessionConfig?.act === "comp" && activity?.replayIndex >= 0) {
              playPassageParagraphs([activity.replayIndex]);
            }
            return;
          case "submit-write":
            submitWrite();
            return;
          case "submit-rewrite":
            submitRewrite();
            return;
          case "submit-select":
            submitSelect();
            return;
          case "submit-build":
            submitBuild();
            return;
          case "finish-fix":
            finishFix();
            return;
          case "back":
            if (sessionConfig && view !== "results" && sessionConfig.n > G.done) {
              persistCurrentProgress();
            }
            goToSessionSurface();
            return;
          default:
            return;
        }
      });

      root.addEventListener("input", (event) => {
        const writer = event.target.closest(".gp-writer");
        if (!writer || !activity) {
          return;
        }
        if (sessionConfig?.act === "write") {
          activity.text = writer.value;
          activity.submitted = false;
          persistCurrentProgress();
          return;
        }
        if (sessionConfig?.act === "rewrite") {
          activity.text = writer.value;
          activity.checked = false;
          persistCurrentProgress();
        }
      });
    }

    function mount(element, options = {}) {
      root = element;
      subject = options.subject || subject;
      refreshState();
      if (RewardProperty.setGrammarSessions) {
        RewardProperty.setGrammarSessions(getCompletedSessionCount());
      }
      bind();
      if (tab === "hub") {
        goToSessionSurface();
        return;
      }
      paint();
    }

    return { mount };
  })();
}
