import assert from "node:assert/strict";
import test from "node:test";
import { cardIds, getCard } from "../src/data/cards.js";
import { getLesson, lessonIds, lessons } from "../src/data/lessons.js";

test("chapter 1 is six lessons in order", () => {
  assert.deepEqual(lessonIds, [
    "wfa-01-a",
    "wfa-01-b",
    "wfa-01-c",
    "wfa-01-d",
    "wfa-01-e",
    "wfa-01-f",
  ]);
  assert.equal(cardIds.length, 16);
  assert.equal(cardIds[0], "WFA-01-01");
  assert.equal(cardIds[15], "WFA-01-16");
});

test("every prompt points at a real card and a real answer", () => {
  const seen = new Set();
  for (const lesson of lessons) {
    assert.ok(lesson.steps.length >= 6, lesson.id);
    for (const step of lesson.steps) {
      if (step.cardId) {
        assert.ok(getCard(step.cardId), `${lesson.id} ${step.id} ${step.cardId}`);
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
      if (step.type === "card") seen.add(step.cardId);
    }
  }
  for (const id of cardIds) assert.ok(seen.has(id), `missing practice for ${id}`);
});

test("checkpoint scores eight items and skills never score", () => {
  const checkpoint = getLesson("wfa-01-f");
  assert.equal(checkpoint.checkpoint, true);
  assert.equal(checkpoint.steps.filter((step) => step.scored).length, 8);
  assert.equal(
    checkpoint.steps.some((step) => step.type === "skills"),
    false,
  );
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (step.type === "skills") assert.equal(step.scored, undefined);
    }
  }
});
