import { chapterOf, getCard, getLesson, lessonIds } from "../data/catalog.js";
import { AWLS } from "../data/skills.js";
import {
  finishLesson,
  gradeCard,
  isUnlocked,
  nextLessonId,
  noteQuizResult,
  retryCheckpoint,
  saveLessonPosition,
} from "../logic/model.js";
import { bar, disclaimer, esc, frame, pips } from "./layout.js";

let mountedFor = null;
let session = null;

export function noteLessonRoute(route) {
  if (route.name !== "lesson") mountedFor = null;
}

function assertNever(value) {
  throw new Error(`Unhandled step: ${String(value)}`);
}

function createSession(state, lesson) {
  const record = state.lessons[lesson.id];
  if (record?.showCelebrate) {
    return {
      phase: "celebrate",
      stepIndex: 0,
      answers: {},
      committed: true,
      replaying: false,
      orderSeed: {},
      finish: record.lastFinish,
    };
  }
  if (record?.showResult) {
    return {
      phase: "result",
      stepIndex: lesson.steps.length,
      answers: structuredClone(record.answers || {}),
      committed: true,
      replaying: record.status === "complete",
      orderSeed: {},
      finish: record.lastFinish,
    };
  }
  const replaying = record?.status === "complete";
  let stepIndex = replaying ? 0 : record?.stepIndex || 0;
  if (stepIndex < 0 || stepIndex >= lesson.steps.length) stepIndex = 0;
  return {
    phase: "play",
    stepIndex,
    answers: replaying ? {} : structuredClone(record?.answers || {}),
    committed: false,
    replaying,
    orderSeed: {},
    finish: null,
  };
}

function shuffledItems(step) {
  if (!session.orderSeed[step.id]) {
    const ids = step.items.map((item) => item.id);
    for (let index = ids.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const current = ids[index];
      ids[index] = ids[swap];
      ids[swap] = current;
    }
    session.orderSeed[step.id] = ids;
  }
  return session.orderSeed[step.id].map((id) => step.items.find((item) => item.id === id));
}

function feedback(correct, why, remember) {
  return `<div class="feedback ${correct ? "is-right" : "is-miss"}" role="status">
    <p class="feedback-title">${correct ? "That's right." : "Not quite."}</p>
    <p>${esc(why)}</p>
    ${remember ? `<p class="remember">${esc(remember)}</p>` : ""}
  </div>`;
}

function answerList(lines) {
  return `<ul class="answer">${lines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>`;
}

function choiceButtons(step, record) {
  const show = record?.phase === "feedback";
  return `<div class="choices" role="group">${step.choices
    .map((choice) => {
      let tone = "";
      if (show && choice.id === step.answer) tone = "is-right";
      else if (show && record.choiceId === choice.id) tone = "is-miss";
      return `<button type="button" class="choice ${tone}" data-action="choose" data-choice="${esc(choice.id)}" data-testid="choice" ${show ? "disabled" : ""}>${esc(choice.label)}</button>`;
    })
    .join("")}</div>`;
}

function renderStep(step, state) {
  const record = session.answers[step.id];
  switch (step.type) {
    case "concept":
      return `
        <p class="eyebrow">${esc(step.kicker)}</p>
        <h2 class="prompt">${esc(step.title)}</h2>
        ${step.body.map((paragraph) => `<p class="body">${esc(paragraph)}</p>`).join("")}
        ${step.remember ? `<p class="remember">${esc(step.remember)}</p>` : ""}
      `;
    case "card": {
      const card = getCard(step.cardId);
      if (!card) return `<p>That card is missing.</p>`;
      const memory = state.cards[card.id];
      const revealed = record?.phase === "revealed" || record?.phase === "feedback";
      return `
        <div class="card-head">${pips(memory?.box)}<span>${esc(card.title)}</span></div>
        <h2 class="prompt">${esc(card.prompt)}</h2>
        ${
          revealed
            ? `${answerList(card.answer)}<p class="remember">${esc(card.remember)}</p>
               <div class="grades" role="group" aria-label="How hard was that?">
                 <button type="button" data-action="grade" data-grade="hard">Hard</button>
                 <button type="button" data-action="grade" data-grade="ok">OK</button>
                 <button type="button" data-action="grade" data-grade="easy">Easy</button>
               </div>`
            : `<p class="fine">Answer it in your head, then look.</p>`
        }
      `;
    }
    case "quiz":
    case "scenario":
      return `
        <h2 class="prompt">${esc(step.prompt)}</h2>
        ${choiceButtons(step, record)}
        ${record?.phase === "feedback" ? feedback(record.correct, step.why, step.remember) : ""}
      `;
    case "order": {
      const picks = record?.picks || [];
      const items = shuffledItems(step);
      const remaining = items.filter((item) => !picks.includes(item.id));
      const picked = picks
        .map((id) => step.items.find((item) => item.id === id))
        .filter(Boolean);
      const correctOrder = step.answer
        .map((id) => step.items.find((item) => item.id === id)?.label)
        .filter(Boolean)
        .join(" → ");
      return `
        <h2 class="prompt">${esc(step.prompt)}</h2>
        <ol class="sequence">${
          picked.length
            ? picked
                .map(
                  (item, position) =>
                    `<li><button type="button" data-action="unpick" data-item="${esc(item.id)}" ${record?.phase === "feedback" ? "disabled" : ""}>${position + 1}. ${esc(item.label)}</button></li>`,
                )
                .join("")
            : `<li class="sequence-empty">Tap the pieces in order.</li>`
        }</ol>
        <div class="chips">${remaining
          .map(
            (item) =>
              `<button type="button" class="chip" data-action="pick" data-item="${esc(item.id)}" ${record?.phase === "feedback" ? "disabled" : ""}>${esc(item.label)}</button>`,
          )
          .join("")}</div>
        ${
          record?.phase === "feedback"
            ? feedback(record.correct, record.correct ? step.why : `${step.why} Order: ${correctOrder}.`, step.remember)
            : ""
        }
      `;
    }
    case "skills": {
      const items = step.items
        .map((item) => {
          const on = Boolean(state.skillsChecks[item.id]);
          return `<li><label class="check"><input type="checkbox" data-action="toggle-skill" data-item="${esc(item.id)}" ${on ? "checked" : ""} /><span>${esc(item.label)}</span></label></li>`;
        })
        .join("");
      const links = (step.links || [])
        .map(
          (link) =>
            `<a class="btn ghost" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`,
        )
        .join("");
      return `
        <p class="eyebrow">Optional</p>
        <h2 class="prompt">${esc(step.title)}</h2>
        <p class="body">${esc(step.body)}</p>
        <ul class="checklist">${items}</ul>
        ${links}
      `;
    }
    default:
      return assertNever(step.type);
  }
}

function dockFor(step) {
  if (!step) return "";
  const record = session.answers[step.id];
  switch (step.type) {
    case "concept":
      return `<button type="button" class="btn primary" data-action="continue" data-testid="advance">Got it</button>`;
    case "card":
      if (record?.phase === "revealed" || record?.phase === "feedback") return "";
      return `<button type="button" class="btn primary" data-action="reveal" data-testid="reveal">Reveal answer</button>`;
    case "quiz":
    case "scenario":
      if (record?.phase !== "feedback") return "";
      return `<button type="button" class="btn primary" data-action="continue" data-testid="advance">Continue</button>`;
    case "order": {
      if (record?.phase === "feedback") {
        return `<button type="button" class="btn primary" data-action="continue" data-testid="advance">Continue</button>`;
      }
      const ready = (record?.picks || []).length === step.answer.length;
      return `<button type="button" class="btn primary" data-action="check-order" data-testid="check-order" ${ready ? "" : "disabled"}>Check order</button>`;
    }
    case "skills":
      return `<div class="dock-row">
        <button type="button" class="btn ghost" data-action="continue">Skip for now</button>
        <button type="button" class="btn primary" data-action="continue" data-testid="advance">Continue</button>
      </div>`;
    default:
      return assertNever(step.type);
  }
}

function stemBlock(lesson, step) {
  if (!lesson.stem || step?.type !== "scenario") return "";
  return `<aside class="stem">
    <p class="eyebrow">${esc(lesson.stem.title)}</p>
    ${lesson.stem.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
  </aside>`;
}

function persistPlay(ctx, lesson, state) {
  if (session.replaying || session.phase !== "play") return state;
  return saveLessonPosition(state, lesson.id, {
    stepIndex: session.stepIndex,
    answers: session.answers,
  });
}

function finish(ctx, lesson, state) {
  const result = finishLesson(state, ctx.today, {
    lessonId: lesson.id,
    steps: lesson.steps,
    answers: session.answers,
    checkpoint: Boolean(lesson.checkpoint),
  });
  session.finish = result;
  return result.state;
}

function lessonFrame(lesson, main, dock, stepLabel) {
  return frame({
    mode: "lesson",
    title: { eyebrow: lesson.eyebrow, heading: lesson.title, step: stepLabel },
    active: "lesson",
    reviewCount: 0,
    main,
    dock: dock ? `<div class="dock">${dock}</div>` : "",
  });
}

function endScreen(ctx, lesson) {
  const finishState = session.finish || {};
  const nextId = nextLessonId(ctx.state, lessonIds);
  const next = nextId ? getLesson(nextId) : null;
  const weakIds = finishState.weakIds || ctx.state.checkpoint.weakIds || [];
  const weak = weakIds
    .map((id) => getCard(id)?.title)
    .filter(Boolean)
    .map((title) => `<li>${esc(title)}</li>`)
    .join("");

  if (session.phase === "result") {
    const correct = finishState.correct ?? ctx.state.checkpoint.lastScore ?? 0;
    const total = finishState.total ?? ctx.state.checkpoint.lastTotal ?? 0;
    const passed = Boolean(finishState.passed);
    const links = `
      <p class="fine">Optional practice. The checkpoint does not wait on videos or a partner.</p>
      <a class="btn ghost" href="${AWLS.videos}" target="_blank" rel="noopener noreferrer">Practical-skills videos</a>
      <a class="btn ghost" href="${AWLS.practice}" target="_blank" rel="noopener noreferrer">WFA practice exams</a>
      ${weak ? `<a class="btn ghost" href="#/review/weak">Practice the soft spots</a>` : ""}
    `;
    const main = `
      ${bar(passed ? total : correct, total || 1)}
      <p class="eyebrow">Chapter ${chapterOf(lesson.id)?.number ?? ""} checkpoint</p>
      <h2 class="prompt">${passed ? "Checkpoint clear." : "Not yet."}</h2>
      <p class="score">${correct}/${total}</p>
      <p class="body">${
        passed
          ? "Seventy percent was the line. You can replay it whenever you want."
          : "That is under 70%. Retry when you want. Nothing locks you out."
      }</p>
      ${
        finishState.xpGained
          ? `<p class="reward">+${finishState.xpGained} XP${finishState.streakExtended ? ` · Streak ${finishState.streakCount}` : ""}</p>`
          : ""
      }
      ${weak ? `<section class="panel"><h3>Bring these back</h3><ul class="plain">${weak}</ul><p class="fine">They are due again tomorrow, and you can practice them now.</p></section>` : `<p class="fine">No soft spots from this try.</p>`}
      ${links}
      ${disclaimer()}
    `;
    const dock = passed
      ? `<a class="btn primary" href="#/path">Back to the trail</a>`
      : `<button type="button" class="btn primary" data-action="retry" data-testid="retry">Retry checkpoint</button><a class="btn ghost" href="#/">Home</a>`;
    return {
      title: "Checkpoint",
      html: lessonFrame(lesson, main, dock, ""),
      actions: {
        retry: () => {
          session = {
            phase: "play",
            stepIndex: 0,
            answers: {},
            committed: false,
            replaying: session.replaying,
            orderSeed: {},
            finish: null,
          };
          ctx.update((state) => retryCheckpoint(state, lesson.id));
        },
      },
    };
  }

  const streakLine = finishState.streakExtended
    ? `Streak ${finishState.streakCount}.`
    : finishState.streakCount
      ? `Streak stays ${finishState.streakCount}. You already kept it today.`
      : "Finish a lesson on another day and the streak starts.";
  const goalLine =
    finishState.goalCount >= finishState.goalTarget
      ? "Daily goal is met."
      : `Daily goal ${finishState.goalCount}/${finishState.goalTarget}.`;
  const main = `
    <div class="celebrate">${`<svg class="marker marker-lg" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5 28 16 16 28.5 4 16Z"/></svg>`}
      <p class="eyebrow">Lesson complete</p>
      <h2 class="prompt">${esc(lesson.title)} locked in.</h2>
      <p class="reward">+${finishState.xpGained || 0} XP</p>
      <p>${esc(streakLine)}</p>
      <p>${esc(goalLine)}</p>
      ${
        next
          ? `<p class="fine">Next: ${esc(next.title)} · ${next.minutes} min</p>`
          : `<p class="fine">The open lessons are complete.</p>`
      }
    </div>
    ${disclaimer()}
  `;
  const dock = `${next ? `<a class="btn primary" href="#/lesson/${esc(next.id)}" data-testid="next-lesson">Next lesson</a>` : `<a class="btn primary" href="#/path">Back to the trail</a>`}
    <a class="btn ghost" href="#/">Home</a>`;
  return {
    title: "Lesson complete",
    html: lessonFrame(lesson, main, dock, ""),
    actions: {},
  };
}

export function lessonScreen(ctx) {
  const lesson = getLesson(ctx.route.id);
  if (!lesson) {
    return {
      title: "Lesson",
      html: lessonFrame(
        { eyebrow: "Trail", title: "Missing lesson" },
        `<p class="lede">That lesson is not on the trail.</p><a class="btn primary" href="#/path">Back to the trail</a>`,
        "",
        "",
      ),
      actions: {},
    };
  }
  if (!isUnlocked(ctx.state, lesson.id, lessonIds)) {
    return {
      title: lesson.title,
      html: lessonFrame(
        lesson,
        `<p class="lede">Finish the previous lesson and this one opens. Nothing here is a test of speed.</p><a class="btn primary" href="#/path">Back to the trail</a>${disclaimer()}`,
        "",
        "",
      ),
      actions: {},
    };
  }
  if (mountedFor !== lesson.id) {
    mountedFor = lesson.id;
    session = createSession(ctx.state, lesson);
  }
  if (session.phase === "celebrate" || session.phase === "result") {
    return endScreen(ctx, lesson);
  }

  const step = lesson.steps[session.stepIndex];
  const main = `
    ${bar(session.stepIndex, lesson.steps.length)}
    ${stemBlock(lesson, step)}
    <article class="step">${renderStep(step, ctx.state)}</article>
    ${disclaimer()}
  `;

  return {
    title: lesson.title,
    html: lessonFrame(lesson, main, dockFor(step), `${session.stepIndex + 1}/${lesson.steps.length}`),
    actions: {
      reveal: () => {
        session.answers[step.id] = { ...(session.answers[step.id] || {}), phase: "revealed" };
        ctx.redraw();
      },
      choose: (target) => {
        if (session.answers[step.id]?.phase === "feedback") return;
        const choiceId = target.dataset.choice;
        const correct = choiceId === step.answer;
        session.answers[step.id] = { phase: "feedback", choiceId, correct, srsNoted: true };
        ctx.update((state) => {
          const noted = noteQuizResult(state, step.cardId, correct, ctx.today);
          return persistPlay(ctx, lesson, noted);
        });
      },
      pick: (target) => {
        if (session.answers[step.id]?.phase === "feedback") return;
        const itemId = target.dataset.item;
        const picks = session.answers[step.id]?.picks || [];
        if (!itemId || picks.includes(itemId)) return;
        session.answers[step.id] = { phase: "building", picks: [...picks, itemId] };
        ctx.redraw();
      },
      unpick: (target) => {
        if (session.answers[step.id]?.phase === "feedback") return;
        const itemId = target.dataset.item;
        const picks = (session.answers[step.id]?.picks || []).filter((id) => id !== itemId);
        session.answers[step.id] = { phase: "building", picks };
        ctx.redraw();
      },
      "check-order": () => {
        if (step.type !== "order") return;
        const picks = session.answers[step.id]?.picks || [];
        if (picks.length !== step.answer.length) return;
        const correct = picks.every((id, index) => id === step.answer[index]);
        session.answers[step.id] = { phase: "feedback", picks, correct, srsNoted: true };
        ctx.update((state) => {
          const noted = noteQuizResult(state, step.cardId, correct, ctx.today);
          return persistPlay(ctx, lesson, noted);
        });
      },
      grade: (target) => {
        const gradeName = target.dataset.grade;
        if (gradeName !== "hard" && gradeName !== "ok" && gradeName !== "easy") return;
        if (session.answers[step.id]?.srsNoted) return;
        const correct = gradeName !== "hard";
        session.answers[step.id] = { phase: "feedback", grade: gradeName, correct, srsNoted: true };
        const last = session.stepIndex >= lesson.steps.length - 1;
        if (!last) session.stepIndex += 1;
        if (last) {
          session.committed = true;
          session.phase = lesson.checkpoint ? "result" : "celebrate";
        }
        ctx.update((state) => {
          const graded = gradeCard(state, step.cardId, gradeName, ctx.today);
          if (last) return finish(ctx, lesson, graded);
          return persistPlay(ctx, lesson, graded);
        });
      },
      continue: () => {
        const last = session.stepIndex >= lesson.steps.length - 1;
        if (!last) {
          session.stepIndex += 1;
          if (session.replaying) ctx.redraw();
          else ctx.update((state) => persistPlay(ctx, lesson, state));
          return;
        }
        if (session.committed) return;
        session.committed = true;
        session.phase = lesson.checkpoint ? "result" : "celebrate";
        ctx.update((state) => finish(ctx, lesson, state));
      },
      "toggle-skill": (target) => {
        const itemId = target.dataset.item;
        if (!itemId) return;
        ctx.update((state) => ({
          ...state,
          skillsChecks: { ...state.skillsChecks, [itemId]: Boolean(target.checked) },
        }));
      },
    },
  };
}
