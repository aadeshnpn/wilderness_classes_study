import assert from "node:assert/strict";
import test from "node:test";
import { addDays, daysBetween, isoWeekKey } from "../src/logic/dates.js";
import {
  effectiveStreak,
  finishLesson,
  freshState,
  hydrate,
  isUnlocked,
  nextLessonId,
  noteQuizResult,
  passedCheckpoint,
  useStreakPause,
  welcomeInfo,
  withToday,
} from "../src/logic/model.js";
import { applyGrade, isDue } from "../src/logic/srs.js";

const today = "2026-10-25";

test("dates stay on the local calendar", () => {
  assert.equal(daysBetween("2026-10-23", "2026-10-25"), 2);
  assert.equal(addDays("2026-10-25", 1), "2026-10-26");
  assert.match(isoWeekKey("2026-10-25"), /^\d{4}-W\d{2}$/);
  assert.equal(isoWeekKey("2026-10-19"), isoWeekKey("2026-10-25"));
  assert.notEqual(isoWeekKey("2026-10-18"), isoWeekKey("2026-10-25"));
});

test("leitner intervals", () => {
  const hard = applyGrade(null, "hard", today);
  assert.equal(hard.box, 1);
  assert.equal(hard.due, "2026-10-26");
  assert.equal(isDue(hard, today), false);
  assert.equal(isDue(hard, "2026-10-26"), true);

  const ok = applyGrade(hard, "ok", today);
  assert.equal(ok.box, 2);
  assert.equal(ok.due, addDays(today, 3));

  const easy = applyGrade(null, "easy", today);
  assert.equal(easy.box, 3);
  assert.equal(easy.due, addDays(today, 7));

  const graduated = applyGrade(easy, "easy", today);
  assert.equal(graduated.box, 4);
  assert.equal(graduated.due, addDays(today, 14));

  const stayed = applyGrade(graduated, "easy", today);
  assert.equal(stayed.box, 4);
});

test("a missed quiz is due tomorrow", () => {
  const state = noteQuizResult(freshState(), "WFA-01-03", false, today);
  assert.equal(state.cards["WFA-01-03"].box, 1);
  assert.equal(state.cards["WFA-01-03"].due, "2026-10-26");
});

test("checkpoint line is 70 percent", () => {
  assert.equal(passedCheckpoint(5, 8), false);
  assert.equal(passedCheckpoint(6, 8), true);
  assert.equal(passedCheckpoint(0, 0), false);
});

test("streak grows on consecutive days and resets after a gap", () => {
  const steps = [{ id: "c", type: "concept" }];
  let state = withToday(freshState(), "2026-10-23");
  let result = finishLesson(state, "2026-10-23", {
    lessonId: "wfa-01-a",
    steps,
    answers: {},
    checkpoint: false,
  });
  assert.equal(result.streakCount, 1);
  assert.equal(result.xpGained, 12);

  result = finishLesson(result.state, "2026-10-24", {
    lessonId: "wfa-01-b",
    steps,
    answers: {},
    checkpoint: false,
  });
  assert.equal(result.streakExtended, true);
  assert.equal(result.streakCount, 2);

  result = finishLesson(result.state, "2026-10-24", {
    lessonId: "wfa-01-c",
    steps,
    answers: {},
    checkpoint: false,
  });
  assert.equal(result.streakExtended, false);
  assert.equal(result.streakCount, 2);
  assert.equal(result.state.daily.lessonIds.length, 2);

  const broken = finishLesson(result.state, "2026-10-26", {
    lessonId: "wfa-01-d",
    steps,
    answers: {},
    checkpoint: false,
  });
  assert.equal(broken.streakCount, 1);
  assert.equal(effectiveStreak(result.state, "2026-10-26"), 0);
});

test("one weekly pause covers a single missed day", () => {
  let state = freshState();
  state = {
    ...state,
    streak: { ...state.streak, count: 3, lastLessonDate: "2026-10-23" },
  };
  assert.equal(effectiveStreak(state, today), 0);
  assert.equal(welcomeInfo(state, today).canPause, true);

  const paused = useStreakPause(state, today);
  assert.equal(paused.ok, true);
  assert.equal(paused.state.streak.pausedDate, "2026-10-24");
  assert.equal(effectiveStreak(paused.state, today), 3);

  const again = useStreakPause(paused.state, today);
  assert.equal(again.ok, false);

  const kept = finishLesson(paused.state, today, {
    lessonId: "wfa-01-a",
    steps: [{ id: "c", type: "concept" }],
    answers: {},
    checkpoint: false,
  });
  assert.equal(kept.streakCount, 4);

  const longGap = {
    ...freshState(),
    streak: { count: 5, lastLessonDate: "2026-10-20", pauseUsedWeek: null, pausedDate: null },
  };
  assert.equal(useStreakPause(longGap, today).ok, false);
  assert.equal(welcomeInfo(longGap, today).canPause, false);
});

test("failed checkpoint does not complete the lesson or add a streak", () => {
  const steps = Array.from({ length: 8 }, (_, index) => ({
    id: `q${index}`,
    type: "quiz",
    scored: true,
    cardId: "WFA-01-01",
  }));
  const answers = Object.fromEntries(steps.map((step, index) => [step.id, { correct: index < 5 }]));
  const result = finishLesson(withToday(freshState(), today), today, {
    lessonId: "wfa-01-f",
    steps,
    answers,
    checkpoint: true,
  });
  assert.equal(result.passed, false);
  assert.equal(result.xpGained, 0);
  assert.equal(result.state.lessons["wfa-01-f"].status, "in_progress");
  assert.equal(result.state.streak.count, 0);
  assert.equal(result.state.checkpoint.passed, false);
  assert.ok(result.weakIds.length > 0);
});

test("passing checkpoint clears the stage", () => {
  const steps = Array.from({ length: 8 }, (_, index) => ({
    id: `q${index}`,
    type: "quiz",
    scored: true,
  }));
  const answers = Object.fromEntries(steps.map((step) => [step.id, { correct: true }]));
  const result = finishLesson(withToday(freshState(), today), today, {
    lessonId: "wfa-01-f",
    steps,
    answers,
    checkpoint: true,
  });
  assert.equal(result.passed, true);
  assert.equal(result.state.lessons["wfa-01-f"].status, "complete");
  assert.equal(result.state.checkpoint.passed, true);
  assert.equal(result.xpGained, 12 + 16);
});

test("lessons unlock in order", () => {
  const ids = ["wfa-01-a", "wfa-01-b"];
  const state = freshState();
  assert.equal(isUnlocked(state, "wfa-01-a", ids), true);
  assert.equal(isUnlocked(state, "wfa-01-b", ids), false);
  assert.equal(nextLessonId(state, ids), "wfa-01-a");
  const done = {
    ...state,
    lessons: { "wfa-01-a": { status: "complete" } },
  };
  assert.equal(isUnlocked(done, "wfa-01-b", ids), true);
  assert.equal(nextLessonId(done, ids), "wfa-01-b");
});

test("hydrate keeps the default goal at 2 lessons", () => {
  assert.equal(hydrate({ version: 1, settings: { dailyGoal: 9 } }).settings.dailyGoal, 2);
  assert.equal(freshState().settings.dailyGoal, 2);
});
