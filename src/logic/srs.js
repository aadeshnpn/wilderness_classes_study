import { addDays } from "./dates.js";

/**
 * Leitner boxes for Chapter 1 cards.
 * Hard → box 1, due tomorrow.
 * OK → box 2, due in 3 days.
 * Easy → box 3 (7 days). Easy again graduates to box 4 (14 days).
 */

const INTERVAL_DAYS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
};

export function applyGrade(previous, grade, today) {
  const priorBox = previous?.box ?? 0;
  let box;
  if (grade === "hard") {
    box = 1;
  } else if (grade === "ok") {
    box = 2;
  } else if (grade === "easy") {
    box = priorBox >= 3 ? 4 : 3;
  } else {
    throw new Error(`Unknown grade: ${String(grade)}`);
  }

  return {
    box,
    due: addDays(today, INTERVAL_DAYS[box]),
    lapses: (previous?.lapses ?? 0) + (grade === "hard" ? 1 : 0),
    reviews: (previous?.reviews ?? 0) + 1,
    lastGrade: grade,
  };
}

export function isDue(cardState, today) {
  if (!cardState?.due) return false;
  return cardState.due <= today;
}
