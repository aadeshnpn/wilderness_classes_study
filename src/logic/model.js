import { addDays, daysBetween, isoWeekKey } from "./dates.js";
import { applyGrade, isDue } from "./srs.js";

export const STORAGE_KEY = "wfa-progress-v1";
export const PASS_RATIO = 0.7;
export const GOAL_CHOICES = [1, 2, 4];

const GOAL_MINUTES = {
  1: 7,
  2: 15,
  4: 30,
};

export function goalMinutes(goal) {
  return GOAL_MINUTES[goal] ?? GOAL_MINUTES[2];
}

export function freshState() {
  return {
    version: 1,
    xp: 0,
    settings: { dailyGoal: 2 },
    streak: {
      count: 0,
      lastLessonDate: null,
      pauseUsedWeek: null,
      pausedDate: null,
    },
    lessons: {},
    daily: { date: null, lessonIds: [], reviewSkipped: false },
    cards: {},
    checkpoint: {
      passed: false,
      lastScore: null,
      lastTotal: null,
      weakIds: [],
    },
    skillsChecks: {},
    welcomeDismissedOn: null,
  };
}

export function hydrate(raw) {
  const base = freshState();
  if (!raw || typeof raw !== "object") return base;
  const goal = GOAL_CHOICES.includes(raw.settings?.dailyGoal) ? raw.settings.dailyGoal : 2;
  return {
    ...base,
    version: 1,
    xp: Number.isFinite(raw.xp) ? raw.xp : 0,
    settings: { dailyGoal: goal },
    streak: {
      ...base.streak,
      ...(raw.streak && typeof raw.streak === "object" ? raw.streak : {}),
    },
    lessons: raw.lessons && typeof raw.lessons === "object" ? raw.lessons : {},
    daily: {
      ...base.daily,
      ...(raw.daily && typeof raw.daily === "object" ? raw.daily : {}),
    },
    cards: raw.cards && typeof raw.cards === "object" ? raw.cards : {},
    checkpoint: {
      ...base.checkpoint,
      ...(raw.checkpoint && typeof raw.checkpoint === "object" ? raw.checkpoint : {}),
    },
    skillsChecks: raw.skillsChecks && typeof raw.skillsChecks === "object" ? raw.skillsChecks : {},
    welcomeDismissedOn: raw.welcomeDismissedOn ?? null,
  };
}

export function withToday(state, today) {
  if (state.daily.date === today) return state;
  return {
    ...state,
    daily: { date: today, lessonIds: [], reviewSkipped: false },
  };
}

function lessonRecord(state, lessonId) {
  return (
    state.lessons[lessonId] ?? {
      status: "available",
      stepIndex: 0,
      answers: {},
      completedOnce: false,
      lastScore: null,
      lastTotal: null,
      passed: false,
      bestScore: null,
      showResult: false,
      showCelebrate: false,
      lastFinish: null,
    }
  );
}

export function isUnlocked(state, lessonId, orderedIds) {
  const index = orderedIds.indexOf(lessonId);
  if (index < 0) return false;
  if (index === 0) return true;
  return state.lessons[orderedIds[index - 1]]?.status === "complete";
}

export function nextLessonId(state, orderedIds) {
  for (const id of orderedIds) {
    if (state.lessons[id]?.status !== "complete") return id;
  }
  return null;
}

export function lessonPhase(state, lessonId, orderedIds) {
  if (!isUnlocked(state, lessonId, orderedIds)) return "locked";
  if (state.lessons[lessonId]?.status === "complete") return "complete";
  return "current";
}

/** A missed day still counts as held when yesterday is covered by the weekly pause. */
export function streakAlive(state, today) {
  const last = state.streak.lastLessonDate;
  if (!last || state.streak.count <= 0) return false;
  if (last === today) return true;
  const yesterday = addDays(today, -1);
  if (last === yesterday) return true;
  return state.streak.pausedDate === yesterday && daysBetween(last, yesterday) === 1;
}

export function effectiveStreak(state, today) {
  return streakAlive(state, today) ? state.streak.count : 0;
}

export function welcomeInfo(state, today) {
  const last = state.streak.lastLessonDate;
  if (!last || last === today) return { kind: "none" };
  const gap = daysBetween(last, today);
  if (gap <= 1) return { kind: "none" };
  const yesterday = addDays(today, -1);
  const pauseHolds = state.streak.pausedDate === yesterday && daysBetween(last, yesterday) === 1;
  if (pauseHolds) return { kind: "paused" };
  const week = isoWeekKey(today);
  return {
    kind: "back",
    gap,
    canPause: gap === 2 && state.streak.pauseUsedWeek !== week,
    pauseUsed: state.streak.pauseUsedWeek === week,
  };
}

export function dismissWelcome(state, today) {
  return { ...state, welcomeDismissedOn: today };
}

export function useStreakPause(state, today) {
  const info = welcomeInfo(state, today);
  if (info.kind === "paused") return { state, ok: false, reason: "already" };
  if (!info.canPause) {
    if (info.kind !== "back") return { state, ok: false, reason: "not-needed" };
    if (info.pauseUsed) return { state, ok: false, reason: "used" };
    return { state, ok: false, reason: "too-long" };
  }
  return {
    state: {
      ...state,
      streak: {
        ...state.streak,
        pausedDate: addDays(today, -1),
        pauseUsedWeek: isoWeekKey(today),
      },
      welcomeDismissedOn: today,
    },
    ok: true,
    reason: "applied",
  };
}

export function dueCardIds(state, today, allIds) {
  return allIds
    .filter((id) => isDue(state.cards[id], today))
    .sort((a, b) => (state.cards[a]?.box ?? 0) - (state.cards[b]?.box ?? 0) || a.localeCompare(b));
}

export function gradeCard(state, cardId, grade, today) {
  if (!cardId) return state;
  return {
    ...state,
    cards: {
      ...state.cards,
      [cardId]: applyGrade(state.cards[cardId], grade, today),
    },
  };
}

/** Quiz misses fall to box 1. A correct answer introduces a new card into the 3-day box. */
export function noteQuizResult(state, cardId, correct, today) {
  if (!cardId) return state;
  if (!correct) return gradeCard(state, cardId, "hard", today);
  const box = state.cards[cardId]?.box ?? 0;
  if (box >= 2) return state;
  return gradeCard(state, cardId, "ok", today);
}

export function saveLessonPosition(state, lessonId, { stepIndex, answers }) {
  const prev = lessonRecord(state, lessonId);
  if (prev.status === "complete") return state;
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        ...prev,
        status: "in_progress",
        stepIndex,
        answers,
        showCelebrate: false,
      },
    },
  };
}

export function scoreAnswers(steps, answers) {
  const scored = steps.filter((step) => step.scored);
  let correct = 0;
  for (const step of scored) {
    if (answers[step.id]?.correct) correct += 1;
  }
  return { correct, total: scored.length };
}

export function passedCheckpoint(correct, total) {
  if (total <= 0) return false;
  return correct / total >= PASS_RATIO;
}

export function bonusCount(steps, answers) {
  return steps.filter((step) => {
    if (step.type !== "quiz" && step.type !== "order" && step.type !== "scenario") return false;
    return Boolean(answers[step.id]?.correct);
  }).length;
}

export function weakCardIds(steps, answers) {
  const ids = [];
  for (const step of steps) {
    if (!step.cardId) continue;
    if (step.type !== "quiz" && step.type !== "order" && step.type !== "scenario") continue;
    if (answers[step.id] && answers[step.id].correct === false) ids.push(step.cardId);
  }
  return [...new Set(ids)];
}

function touchStreak(state, today) {
  const last = state.streak.lastLessonDate;
  if (last === today) {
    return { state, extended: false };
  }
  const keep = streakAlive(state, today);
  const count = !last || !keep ? 1 : state.streak.count + 1;
  return {
    state: {
      ...state,
      streak: { ...state.streak, count, lastLessonDate: today },
    },
    extended: true,
  };
}

export function finishLesson(state, today, { lessonId, steps, answers, checkpoint }) {
  const prev = lessonRecord(state, lessonId);
  const { correct, total } = scoreAnswers(steps, answers);
  const weakIds = weakCardIds(steps, answers);
  const passed = checkpoint ? passedCheckpoint(correct, total) : true;
  const bonus = bonusCount(steps, answers);
  const xpGained = prev.completedOnce ? 4 : 12 + bonus * 2;

  if (checkpoint && !passed) {
    return {
      state: {
        ...state,
        lessons: {
          ...state.lessons,
          [lessonId]: {
            ...prev,
            status: prev.status === "complete" ? "complete" : "in_progress",
            stepIndex: steps.length,
            answers,
            showResult: true,
            showCelebrate: false,
            lastScore: correct,
            lastTotal: total,
            passed: false,
            bestScore: Math.max(prev.bestScore ?? 0, correct),
            lastFinish: {
              xpGained: 0,
              streakExtended: false,
              streakCount: effectiveStreak(state, today),
              goalCount: state.daily.lessonIds.length,
              goalTarget: state.settings.dailyGoal,
              passed: false,
              correct,
              total,
            },
          },
        },
        checkpoint: {
          passed: state.checkpoint.passed,
          lastScore: correct,
          lastTotal: total,
          weakIds,
        },
      },
      passed: false,
      xpGained: 0,
      streakExtended: false,
      streakCount: effectiveStreak(state, today),
      goalCount: state.daily.lessonIds.length,
      goalTarget: state.settings.dailyGoal,
      goalMet: state.daily.lessonIds.length >= state.settings.dailyGoal,
      correct,
      total,
      weakIds,
    };
  }

  let next = withToday(state, today);
  const lessonIds = next.daily.lessonIds.includes(lessonId)
    ? next.daily.lessonIds
    : [...next.daily.lessonIds, lessonId];
  next = { ...next, xp: next.xp + xpGained, daily: { ...next.daily, lessonIds } };
  const streak = touchStreak(next, today);
  next = streak.state;
  const goalCount = next.daily.lessonIds.length;
  const lastFinish = {
    xpGained,
    streakExtended: streak.extended,
    streakCount: next.streak.count,
    goalCount,
    goalTarget: next.settings.dailyGoal,
    passed: true,
    correct,
    total,
  };

  return {
    state: {
      ...next,
      lessons: {
        ...next.lessons,
        [lessonId]: {
          ...prev,
          status: "complete",
          stepIndex: 0,
          answers: {},
          completedOnce: true,
          showResult: Boolean(checkpoint),
          showCelebrate: !checkpoint,
          lastScore: checkpoint ? correct : prev.lastScore,
          lastTotal: checkpoint ? total : prev.lastTotal,
          passed: checkpoint ? true : prev.passed,
          bestScore: checkpoint ? Math.max(prev.bestScore ?? 0, correct) : prev.bestScore,
          lastFinish,
        },
      },
      checkpoint: checkpoint
        ? { passed: true, lastScore: correct, lastTotal: total, weakIds }
        : next.checkpoint,
    },
    passed: true,
    xpGained,
    streakExtended: streak.extended,
    streakCount: next.streak.count,
    goalCount,
    goalTarget: next.settings.dailyGoal,
    goalMet: goalCount >= next.settings.dailyGoal,
    correct,
    total,
    weakIds,
  };
}

function withoutOverlay(record) {
  const resetAttempt = record.showResult && record.status !== "complete";
  return {
    ...record,
    showCelebrate: false,
    showResult: false,
    stepIndex: resetAttempt ? 0 : record.stepIndex,
    answers: resetAttempt ? {} : record.answers,
  };
}

export function clearLessonOverlay(state, lessonId) {
  const prev = state.lessons[lessonId];
  if (!prev?.showCelebrate && !prev?.showResult) return state;
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: withoutOverlay(prev),
    },
  };
}

export function clearOverlays(state) {
  let lessons = state.lessons;
  let changed = false;
  for (const [id, record] of Object.entries(state.lessons)) {
    if (record.showCelebrate || record.showResult) {
      if (!changed) lessons = { ...state.lessons };
      lessons[id] = withoutOverlay(record);
      changed = true;
    }
  }
  return changed ? { ...state, lessons } : state;
}

export function retryCheckpoint(state, lessonId) {
  const prev = lessonRecord(state, lessonId);
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        ...prev,
        status: prev.completedOnce ? "complete" : "in_progress",
        stepIndex: 0,
        answers: {},
        showResult: false,
        showCelebrate: false,
      },
    },
  };
}

export function setDailyGoal(state, goal) {
  if (!GOAL_CHOICES.includes(goal)) return state;
  return { ...state, settings: { ...state.settings, dailyGoal: goal } };
}

export function toggleSkill(state, itemId) {
  return {
    ...state,
    skillsChecks: { ...state.skillsChecks, [itemId]: !state.skillsChecks[itemId] },
  };
}

export function skipReviewToday(state, today) {
  const next = withToday(state, today);
  return { ...next, daily: { ...next.daily, reviewSkipped: true } };
}
