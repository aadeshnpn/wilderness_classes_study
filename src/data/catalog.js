import { cards as chapterOneCards } from "./cards.js";
import { laterChapters, lessons as chapterOneLessons } from "./lessons.js";

const extraModules = import.meta.glob("./chapters/*.js", { eager: true });

const chapterOne = {
  number: 1,
  title: "Patient Assessment",
  lessons: chapterOneLessons,
  cards: chapterOneCards,
  partnerChecks: [],
};

function moduleChapter(mod) {
  const chapter = mod?.chapter;
  if (!chapter || !Array.isArray(chapter.lessons) || !Array.isArray(chapter.cards)) return null;
  return chapter;
}

export const chapters = [chapterOne, ...Object.values(extraModules).map(moduleChapter).filter(Boolean)].sort(
  (a, b) => a.number - b.number,
);

export const lessons = chapters.flatMap((chapter) => chapter.lessons);
export const lessonIds = lessons.map((lesson) => lesson.id);
export const cards = chapters.flatMap((chapter) => chapter.cards);
export const cardIds = cards.map((card) => card.id);

const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const cardById = new Map(cards.map((card) => [card.id, card]));

export function getLesson(id) {
  return lessonById.get(id) ?? null;
}

export function getCard(id) {
  return cardById.get(id) ?? null;
}

export function chapterOf(lessonId) {
  return chapters.find((chapter) => chapter.lessons.some((lesson) => lesson.id === lessonId)) ?? null;
}

export function upcomingChapters() {
  const present = new Set(chapters.map((chapter) => chapter.number));
  return laterChapters.filter(([number]) => !present.has(number));
}

export function addedPartnerChecks() {
  return chapters.flatMap((chapter) =>
    (chapter.partnerChecks || []).map((item) => ({
      id: item.id,
      label: `${chapter.title}: ${item.label}`,
    })),
  );
}
