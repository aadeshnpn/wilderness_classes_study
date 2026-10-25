import assert from "node:assert/strict";
import test from "node:test";
import { chapter } from "../src/data/chapters/02-vital-signs.js";

test("chapter 2 is vital signs, four lessons, six cards", () => {
  assert.equal(chapter.number, 2);
  assert.equal(chapter.title, "Vital Signs");
  assert.deepEqual(
    chapter.lessons.map((lesson) => lesson.id),
    ["wfa-02-a", "wfa-02-b", "wfa-02-c", "wfa-02-d"],
  );
  assert.deepEqual(
    chapter.cards.map((card) => card.id),
    ["WFA-02-01", "WFA-02-02", "WFA-02-03", "WFA-02-04", "WFA-02-05", "WFA-02-06"],
  );
  for (const lesson of chapter.lessons) {
    assert.ok(lesson.minutes >= 5 && lesson.minutes <= 8, lesson.id);
  }
});

test("chapter 2 practices every card and scores eight checkpoint items", () => {
  const seen = new Set();
  const cardIds = new Set(chapter.cards.map((card) => card.id));
  for (const lesson of chapter.lessons) {
    assert.ok(lesson.steps.length >= 6, lesson.id);
    for (const step of lesson.steps) {
      if (step.cardId) {
        assert.ok(cardIds.has(step.cardId), `${step.id} ${step.cardId}`);
        seen.add(step.cardId);
      }
      if (step.type === "quiz" || step.type === "scenario") {
        assert.ok(step.choices.some((choice) => choice.id === step.answer), step.id);
        assert.ok(step.why && step.remember, step.id);
      }
      if (step.type === "order") {
        assert.deepEqual(
          [...step.answer].sort(),
          step.items.map((item) => item.id).sort(),
          step.id,
        );
      }
      if (step.type === "skills") assert.equal(step.scored, undefined);
    }
  }
  for (const id of cardIds) assert.ok(seen.has(id), `missing practice for ${id}`);
  const checkpoint = chapter.lessons.find((lesson) => lesson.checkpoint);
  assert.equal(checkpoint.id, "wfa-02-d");
  assert.equal(checkpoint.steps.filter((step) => step.scored).length, 8);
  assert.equal(
    checkpoint.steps.some((step) => step.type === "skills"),
    false,
  );
});
