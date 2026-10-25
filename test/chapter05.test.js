import assert from "node:assert/strict";
import test from "node:test";
import { chapter } from "../src/data/chapters/05-airway-breathing.js";

test("chapter 5 is airway and breathing, four lessons, seven cards", () => {
  assert.equal(chapter.number, 5);
  assert.equal(chapter.title, "Airway and Breathing");
  assert.deepEqual(
    chapter.lessons.map((lesson) => lesson.id),
    ["wfa-05-a", "wfa-05-b", "wfa-05-c", "wfa-05-d"],
  );
  assert.deepEqual(
    chapter.cards.map((card) => card.id),
    ["WFA-05-01", "WFA-05-02", "WFA-05-03", "WFA-05-04", "WFA-05-05", "WFA-05-06", "WFA-05-07"],
  );
  for (const lesson of chapter.lessons) {
    assert.ok(lesson.minutes >= 5 && lesson.minutes <= 8, lesson.id);
  }
});

test("chapter 5 practices every card and scores eight checkpoint items", () => {
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
  assert.equal(checkpoint.id, "wfa-05-d");
  assert.equal(checkpoint.steps.filter((step) => step.scored).length, 8);
  assert.equal(
    checkpoint.steps.some((step) => step.type === "skills"),
    false,
  );
});
