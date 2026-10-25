import { cardIds } from "../data/cards.js";
import {
  GOAL_CHOICES,
  dueCardIds,
  effectiveStreak,
  freshState,
  goalMinutes,
  setDailyGoal,
  useStreakPause,
  welcomeInfo,
} from "../logic/model.js";
import { readImport } from "../logic/storage.js";
import { disclaimer, esc, frame } from "./layout.js";

let note = "";

export function settingsScreen(ctx) {
  const streak = effectiveStreak(ctx.state, ctx.today);
  const due = dueCardIds(ctx.state, ctx.today, cardIds);
  const welcome = welcomeInfo(ctx.state, ctx.today);
  const goal = ctx.state.settings.dailyGoal;
  const goals = GOAL_CHOICES.map((choice) => {
    const pressed = choice === goal ? "true" : "false";
    return `<button type="button" class="segment" data-action="set-goal" data-goal="${choice}" aria-pressed="${pressed}">${choice} · ~${goalMinutes(choice)} min</button>`;
  }).join("");

  let pauseCopy = "One pause each week covers a single missed day. Finish a lesson the next day and the streak holds.";
  let pauseButton = "";
  if (welcome.kind === "paused") {
    pauseCopy = "Pause covers yesterday. One lesson today keeps the streak.";
  } else if (welcome.canPause) {
    pauseCopy = "Yesterday is open. You can use this week's pause.";
    pauseButton = `<button type="button" class="btn secondary" data-action="use-pause">Use streak pause</button>`;
  } else if (welcome.kind === "back" && welcome.pauseUsed) {
    pauseCopy = "This week's pause is already used. The streak starts again with your next lesson.";
  } else if (welcome.kind === "back") {
    pauseCopy = "More than one day has passed. A pause cannot cover that, so it stays unused.";
  }

  const main = `
    <p class="eyebrow">On this phone</p>
    <h2 class="page-title">Settings</h2>
    <section class="panel">
      <h3>Daily goal</h3>
      <p>The streak is separate. One finished lesson keeps the day. The goal is how much you meant to do.</p>
      <div class="segments" role="group" aria-label="Daily goal">${goals}</div>
    </section>
    <section class="panel">
      <h3>Streak pause</h3>
      <p>${esc(pauseCopy)}</p>
      ${pauseButton}
    </section>
    <section class="panel">
      <h3>Progress file</h3>
      <p>Stored in this browser under <span class="mono">wfa-progress-v1</span>. No account.</p>
      <button type="button" class="btn secondary" data-action="export-progress">Export JSON</button>
      <button type="button" class="btn ghost" data-action="pick-import">Import JSON</button>
      <input id="import-file" type="file" accept="application/json,.json" hidden />
      <button type="button" class="btn ghost danger" data-action="reset-progress">Clear progress</button>
      ${note ? `<p class="fine" role="status">${esc(note)}</p>` : ""}
    </section>
    ${disclaimer()}
  `;

  return {
    title: "Settings",
    html: frame({
      mode: "app",
      streakLabel: streak > 0 ? `Streak, ${streak} days` : "No streak yet",
      streakCount: String(streak),
      active: "settings",
      reviewCount: due.length,
      main,
    }),
    actions: {
      "set-goal": (target) => {
        const nextGoal = Number(target.dataset.goal);
        ctx.update((state) => setDailyGoal(state, nextGoal));
      },
      "use-pause": () => {
        const result = useStreakPause(ctx.state, ctx.today);
        note = result.ok ? "Pause saved for yesterday." : note;
        ctx.update(() => result.state);
      },
      "export-progress": () => {
        const blob = new Blob([JSON.stringify(ctx.state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "medonmt-wfa-progress.json";
        link.click();
        URL.revokeObjectURL(url);
        note = "Export downloaded.";
        ctx.redraw();
      },
      "pick-import": () => {
        document.getElementById("import-file")?.click();
      },
      "import-file": async (target) => {
        const file = target.files?.[0];
        target.value = "";
        if (!file) return;
        try {
          const text = await file.text();
          const next = readImport(text);
          note = "Progress imported on this phone.";
          ctx.replace(next);
        } catch {
          note = "That file could not be read. Export a fresh copy from this app.";
          ctx.redraw();
        }
      },
      "reset-progress": () => {
        const sure = window.confirm("Clear study progress on this phone?");
        if (!sure) return;
        note = "Progress cleared.";
        ctx.replace(freshState());
      },
    },
  };
}
