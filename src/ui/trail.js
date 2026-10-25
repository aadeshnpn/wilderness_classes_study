import { cardIds, chapters, lessonIds, upcomingChapters } from "../data/catalog.js";
import { dueCardIds, effectiveStreak, lessonPhase } from "../logic/model.js";
import { disclaimer, esc, frame, markerIcon } from "./layout.js";

function stageSection(ctx, chapter) {
  const ids = chapter.lessons.map((lesson) => lesson.id);
  const done = ids.filter((id) => ctx.state.lessons[id]?.status === "complete").length;
  const checkpoint = chapter.lessons.find((lesson) => lesson.checkpoint);
  const clear = Boolean(checkpoint && ctx.state.lessons[checkpoint.id]?.status === "complete");
  const nodes = chapter.lessons
    .map((lesson) => {
      const phase = lessonPhase(ctx.state, lesson.id, lessonIds);
      const record = ctx.state.lessons[lesson.id];
      const cleared = lesson.checkpoint && record?.status === "complete";
      const score =
        lesson.checkpoint && record?.lastScore != null
          ? `${record.lastScore}/${record.lastTotal}${cleared ? " · clear" : ""}`
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

  return `
    <section class="stage">
      <h2 class="stage-title">${chapter.number} · ${esc(chapter.title)}</h2>
      <p class="lede">${done} of ${ids.length} lessons${clear ? " · checkpoint clear" : ""}.</p>
      <div class="trail-list">${nodes}</div>
    </section>`;
}

export function trailScreen(ctx) {
  const streak = effectiveStreak(ctx.state, ctx.today);
  const due = dueCardIds(ctx.state, ctx.today, cardIds);
  const later = upcomingChapters()
    .map(([number, title]) => `<li><span>${number}</span> ${esc(title)} <em>Soon</em></li>`)
    .join("");
  const stages = chapters.map((chapter) => stageSection(ctx, chapter)).join("");
  const laterBlock = later
    ? `<section class="later">
        <h3>Later on the trail</h3>
        <p>These chapters stay closed until they are on the trail.</p>
        <ul>${later}</ul>
      </section>`
    : "";

  const main = `
    <p class="eyebrow">Wilderness First Aid</p>
    <h2 class="page-title">The trail</h2>
    <p class="lede">Finish a chapter checkpoint and the next chapter opens.</p>
    ${stages}
    ${laterBlock}
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
