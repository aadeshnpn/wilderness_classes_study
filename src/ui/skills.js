import { cardIds } from "../data/cards.js";
import { AWLS, partnerDrill, videoNotes } from "../data/skills.js";
import { dueCardIds, effectiveStreak, toggleSkill } from "../logic/model.js";
import { disclaimer, esc, frame } from "./layout.js";

export function skillsScreen(ctx) {
  const streak = effectiveStreak(ctx.state, ctx.today);
  const due = dueCardIds(ctx.state, ctx.today, cardIds);
  const checks = partnerDrill
    .map((item) => {
      const on = Boolean(ctx.state.skillsChecks[item.id]);
      return `<li>
        <label class="check">
          <input type="checkbox" data-action="toggle-skill" data-item="${esc(item.id)}" ${on ? "checked" : ""} />
          <span>${esc(item.label)}</span>
        </label>
      </li>`;
    })
    .join("");
  const videos = videoNotes.map((note) => `<li>${esc(note)}</li>`).join("");

  const main = `
    <p class="eyebrow">Hands on</p>
    <h2 class="page-title">Partner skills</h2>
    <p class="lede">Optional. These drills never gate a lesson or the checkpoint. Check them when you have a person and a floor.</p>
    <ul class="checklist">${checks}</ul>
    <section class="panel">
      <h3>Videos on the AWLS page</h3>
      <ul class="plain">${videos}</ul>
      <a class="btn secondary" href="${AWLS.videos}" target="_blank" rel="noopener noreferrer">Open practical-skills videos</a>
    </section>
    <section class="panel">
      <h3>Check yourself outside the app</h3>
      <a class="btn secondary" href="${AWLS.practice}" target="_blank" rel="noopener noreferrer">WFA practice exams</a>
      <a class="btn ghost" href="${AWLS.textbook}" target="_blank" rel="noopener noreferrer">WFA textbook (PDF)</a>
      <a class="btn ghost" href="${AWLS.podcasts}" target="_blank" rel="noopener noreferrer">AWLS podcasts</a>
    </section>
    ${disclaimer()}
  `;

  return {
    title: "Skills",
    html: frame({
      mode: "app",
      streakLabel: streak > 0 ? `Streak, ${streak} days` : "No streak yet",
      streakCount: String(streak),
      active: "skills",
      reviewCount: due.length,
      main,
    }),
    actions: {
      "toggle-skill": (target) => {
        const itemId = target.dataset.item;
        if (!itemId) return;
        ctx.update((state) => toggleSkill(state, itemId));
      },
    },
  };
}
