/** Local calendar helpers. Streaks follow the learner's day, not UTC. */

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key, amount) {
  const date = parseKey(key);
  date.setDate(date.getDate() + amount);
  return todayKey(date);
}

export function daysBetween(fromKey, toKey) {
  const from = parseKey(fromKey);
  const to = parseKey(toKey);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/** ISO week key, used to allow one streak pause per week. */
export function isoWeekKey(key) {
  const date = parseKey(key);
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const weekYear = thursday.getFullYear();
  const weekOne = new Date(weekYear, 0, 4);
  const week =
    1 +
    Math.round(
      ((thursday.getTime() - weekOne.getTime()) / 86400000 -
        3 +
        ((weekOne.getDay() + 6) % 7)) /
        7,
    );
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}
