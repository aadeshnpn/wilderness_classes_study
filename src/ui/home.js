import { getLesson, lessonIds } from "../data/lessons.js";
import { cardIds } from "../data/cards.js";
import {
  dueCardIds,
  effectiveStreak,
  goalMinutes,
  nextLessonId,
  welcomeInfo,
  dismissWelcome,
  useStreakPause,
} from "../logic/model.js";
import { bar, disclaimer, esc, frame } from "./layout.js";

function resumeCopy(record, lesson) {
  if (!record) return { label: "Start", detail: lesson.summary };
  if (record.showResult) return { label: "See result", detail: "Your checkpoint result is saved on this phone." };
  const started = (record.stepIndex || 0) > 0 || Object.keys(record.answers || {}).length > 0;
  if (record.status === "in_progress" && started) {
    return { label: "Resume", detail: "Pick up where you left off. Progress stays on this phone." };
  }
  if (lesson.checkpoint && record.lastScore != null && record.status !== "complete") {
    return {
      label: "Try again",
      detail: `Last try ${record.lastScore}/${record.lastTotal}. Nothing is locked.`,
    };
  }
  return { label: "Start", detail: lesson.summary };
}

export function homeScreen(ctx) {
  const streak = effectiveStreak(ctx.state, ctx.today);
  const goal = ctx.state.settings.dailyGoal;
  const done = ctx.state.daily.lessonIds.length;
  const shown = Math.min(done, goal);
  const due = dueCardIds(ctx.state, ctx.today, cardIds);
  const welcome = welcomeInfo(ctx.state, ctx.today);
  const nextId = nextLessonId(ctx.state, lessonIds);
  const next = nextId ? getLesson(nextId) : null;
  const record = nextId ? ctx.state.lessons[nextId] : null;
  const resume = next ? resumeCopy(record, next) : null;
  const stageDone = lessonIds.filter((id) => ctx.state.lessons[id]?.status === "complete").length;

  let banner = "";
  if (welcome.kind === "paused") {
    banner = `<p class="banner">Pause covers yesterday. One lesson today keeps the streak.</p>`;
  } else if (welcome.kind === "back" && ctx.state.welcomeDismissedOn !== ctx.today) {
    const pause = welcome.canPause
      ? `<button type="button" class="btn secondary" data-action="use-pause">Use this week's pause</button>`
      : `<p class="fine">${
          welcome.pauseUsed
            ? "This week's pause is already used. The streak starts again when you finish a lesson."
            : "A pause only covers a single missed day, so it stays unused. The streak starts again when you finish a lesson."
        }</p>`;
    banner = `<section class="banner">
      <p>Welcome back. Pick up wherever you left the trail.</p>
      ${pause}
      <button type="button" class="text-btn" data-action="dismiss-welcome">Got it</button>
    </section>`;
  }

  const reviewCard =
    due.length > 0
      ? `<a class="card card-link ${due.length >= 5 ? "card-offer" : ""}" href="#/review">
          <p class="eyebrow">Due review</p>
          <h2>${due.length} ${due.length === 1 ? "card" : "cards"} · about ${Math.max(2, Math.round(due.length * 0.8))} min</h2>
          <p>${due.length >= 5 ? "These are ready first. A lesson is what keeps the streak." : "A short pass through what is due."}</p>
        </a>`
      : `<p class="quiet-row">No cards due. The review pile is quiet.</p>`;

  const hero = next
    ? `<a class="hero" href="#/lesson/${esc(next.id)}" data-testid="continue">
        <p class="eyebrow">${esc(resume.label)} · ${next.minutes} min</p>
        <h2>${esc(next.title)}</h2>
        <p>${esc(resume.detail)}</p>
        <p class="hero-meta">Patient Assessment · ${stageDone}/6</p>
        <span class="hero-go">${esc(resume.label)}</span>
      </a>`
    : `<section class="hero hero-static">
        <p class="eyebrow">Chapter 1</p>
        <h2>Patient assessment is in your pocket.</h2>
        <p>Replay any lesson from the trail, or run the cards again from Review.</p>
        <a class="hero-go" href="#/path">Open the trail</a>
      </section>`;

  const main = `
    <p class="lede">Patient assessment, one short lesson at a time.</p>
    ${banner}
    <section class="goal" aria-label="Daily goal">
      <div class="goal-row"><span>Daily goal</span><span>${shown}/${goal}${done >= goal ? " · met" : ""} · ~${goalMinutes(goal)} min</span></div>
      ${bar(shown, goal)}
    </section>
    ${due.length >= 5 ? reviewCard : ""}
    ${hero}
    ${due.length >= 5 ? "" : reviewCard}
    <div class="link-row">
      <a href="#/path">Trail</a>
      <a href="#/skills">Partner skills</a>
    </div>
    ${disclaimer()}
  `;

  return {
    title: "Home",
    html: frame({
      mode: "app",
      streakLabel: streak > 0 ? `Streak, ${streak} days` : "No streak yet",
      streakCount: String(streak),
      active: "home",
      reviewCount: due.length,
      main,
    }),
    actions: {
      "dismiss-welcome": () => ctx.update((state) => dismissWelcome(state, ctx.today)),
      "use-pause": () => ctx.update((state) => useStreakPause(state, ctx.today).state),
    },
  };
}
