import assert from "node:assert/strict";
import test from "node:test";
import { chapter } from "../src/data/chapters/03-wound-management.js";

test("chapter 3 is wound management, six lessons, twelve cards", () => {
  assert.equal(chapter.number, 3);
  assert.equal(chapter.title, "Wound Management");
  assert.deepEqual(
    chapter.lessons.map((lesson) => lesson.id),
    ["wfa-03-a", "wfa-03-b", "wfa-03-c", "wfa-03-d", "wfa-03-e", "wfa-03-f"],
  );
  assert.deepEqual(
    chapter.cards.map((card) => card.id),
    [
      "WFA-03-01",
      "WFA-03-02",
      "WFA-03-03",
      "WFA-03-04",
      "WFA-03-05",
      "WFA-03-06",
      "WFA-03-07",
      "WFA-03-08",
      "WFA-03-09",
      "WFA-03-10",
      "WFA-03-11",
      "WFA-03-12",
    ],
  );
  for (const lesson of chapter.lessons) {
    assert.ok(lesson.minutes >= 5 && lesson.minutes <= 8, lesson.id);
  }
});

test("chapter 3 practices every card and scores eight checkpoint items", () => {
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
  assert.equal(checkpoint.id, "wfa-03-f");
  assert.equal(checkpoint.steps.filter((step) => step.scored).length, 8);
  assert.equal(
    checkpoint.steps.some((step) => step.type === "skills"),
    false,
  );
});
