import { laterChapters, lessonIds, lessons } from "../data/lessons.js";
import { cardIds } from "../data/cards.js";
import { dueCardIds, effectiveStreak, lessonPhase } from "../logic/model.js";
import { disclaimer, esc, frame, markerIcon } from "./layout.js";

export function trailScreen(ctx) {
  const streak = effectiveStreak(ctx.state, ctx.today);
  const due = dueCardIds(ctx.state, ctx.today, cardIds);
  const done = lessonIds.filter((id) => ctx.state.lessons[id]?.status === "complete").length;
  const passed = ctx.state.checkpoint.passed;

  const nodes = lessons
    .map((lesson) => {
      const phase = lessonPhase(ctx.state, lesson.id, lessonIds);
      const record = ctx.state.lessons[lesson.id];
      const score =
        lesson.checkpoint && record?.lastScore != null
          ? `${record.lastScore}/${record.lastTotal}${record.passed || passed ? " · clear" : ""}`
          : "";
      const stateLabel = phase === "complete" ? "Done" : phase === "current" ? "Open" : "Locked";
      const inner = `
        <span class="node-mark">${phase === "complete" ? markerIcon() : esc(lesson.code)}</span>
        <span class="node-copy">
          <span class="node-title">${esc(lesson.title)}</span>
          <span class="node-meta">${lesson.minutes} min · ${esc(stateLabel)}${score ? ` · ${esc(score)}` : ""}</span>
        </span>`;
      if (phase === "locked") {
        return `<div class="node is-locked">${inner}</div>`;
      }
      return `<a class="node is-${phase}" href="#/lesson/${esc(lesson.id)}">${inner}</a>`;
    })
    .join("");

  const later = laterChapters
    .map(
      ([number, title]) =>
        `<li><span>${number}</span> ${esc(title)} <em>Soon</em></li>`,
    )
    .join("");

  const main = `
    <p class="eyebrow">Wilderness First Aid</p>
    <h2 class="page-title">1 · Patient Assessment</h2>
    <p class="lede">${done} of 6 lessons${passed ? " · checkpoint clear" : ""}.</p>
    <div class="trail-list">${nodes}</div>
    <section class="later">
      <h3>Later on the trail</h3>
      <p>Chapters 2–20 stay closed in this version.</p>
      <ul>${later}</ul>
    </section>
    ${disclaimer()}
  `;

  return {
    title: "Trail",
    html: frame({
      mode: "app",
      streakLabel: streak > 0 ? `Streak, ${streak} days` : "No streak yet",
      streakCount: String(streak),
      active: "trail",
      reviewCount: due.length,
      main,
    }),
    actions: {},
  };
}
