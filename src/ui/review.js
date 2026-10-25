import { cardIds, getCard } from "../data/cards.js";
import { dueCardIds, effectiveStreak, gradeCard } from "../logic/model.js";
import { disclaimer, esc, frame, pips } from "./layout.js";

let reviewKey = null;
let queue = [];
let index = 0;
let phase = "ask";

export function noteReviewRoute(route) {
  if (route.name !== "review") reviewKey = null;
}

function buildQueue(ctx) {
  const due = dueCardIds(ctx.state, ctx.today, cardIds);
  if (ctx.route.id === "all") return [...cardIds];
  if (ctx.route.id === "weak") {
    const weak = ctx.state.checkpoint.weakIds || [];
    return [...new Set([...weak, ...due])];
  }
  return due;
}

function answerList(lines) {
  return `<ul class="answer">${lines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>`;
}

export function reviewScreen(ctx) {
  if (reviewKey !== ctx.route.id) {
    reviewKey = ctx.route.id;
    queue = buildQueue(ctx);
    index = 0;
    phase = "ask";
  }

  const streak = effectiveStreak(ctx.state, ctx.today);
  const dueCount = dueCardIds(ctx.state, ctx.today, cardIds).length;
  const card = getCard(queue[index]);
  const shell = (main, actions = {}) => ({
    title: "Review",
    html: frame({
      mode: "app",
      streakLabel: streak > 0 ? `Streak, ${streak} days` : "No streak yet",
      streakCount: String(streak),
      active: "review",
      reviewCount: dueCount,
      main,
    }),
    actions,
  });

  if (queue.length === 0) {
    const noun = ctx.route.id === "all" ? "cards" : "due cards";
    return shell(`
      <p class="eyebrow">Review</p>
      <h2 class="page-title">Nothing ${noun === "cards" ? "in this set" : "due"}.</h2>
      <p class="lede">The trail is quiet. You can still walk the Chapter 1 cards on purpose.</p>
      <a class="btn primary" href="#/review/all">Practice Chapter 1 cards</a>
      <a class="btn ghost" href="#/path">Back to the trail</a>
      ${disclaimer()}
    `);
  }

  if (!card || index >= queue.length) {
    return shell(`
      <p class="eyebrow">Review</p>
      <h2 class="page-title">This pass is clear.</h2>
      <p class="lede">Graded cards move to their next day. Come back when they are due, or keep going on the trail.</p>
      <a class="btn primary" href="#/">Home</a>
      <a class="btn ghost" href="#/review/all">Practice all Chapter 1 cards</a>
      ${disclaimer()}
    `);
  }

  const memory = ctx.state.cards[card.id];
  const body =
    phase === "ask"
      ? `<button type="button" class="btn primary" data-action="reveal" data-testid="reveal">Reveal answer</button>`
      : `${answerList(card.answer)}
         <p class="remember">${esc(card.remember)}</p>
         <div class="grades" role="group" aria-label="How hard was that?">
           <button type="button" data-action="grade" data-grade="hard">Hard</button>
           <button type="button" data-action="grade" data-grade="ok">OK</button>
           <button type="button" data-action="grade" data-grade="easy">Easy</button>
         </div>`;

  return shell(
    `
      <p class="eyebrow">Card ${index + 1} of ${queue.length} · Chapter 1</p>
      <div class="card-head">${pips(memory?.box)}${esc(card.title)}</div>
      <h2 class="prompt">${esc(card.prompt)}</h2>
      ${body}
      ${disclaimer()}
    `,
    {
      reveal: () => {
        phase = "answer";
        ctx.redraw();
      },
      grade: (target) => {
        const gradeName = target.dataset.grade;
        if (gradeName !== "hard" && gradeName !== "ok" && gradeName !== "easy") return;
        const cardId = card.id;
        index += 1;
        phase = "ask";
        ctx.update((state) => gradeCard(state, cardId, gradeName, ctx.today));
      },
    },
  );
}
