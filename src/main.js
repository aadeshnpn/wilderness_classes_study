import "./style.css";
import { todayKey } from "./logic/dates.js";
import { clearLessonOverlay, clearOverlays, withToday } from "./logic/model.js";
import { loadProgress, saveProgress } from "./logic/storage.js";
import { homeScreen } from "./ui/home.js";
import { lessonScreen, noteLessonRoute } from "./ui/lesson.js";
import { noteReviewRoute, reviewScreen } from "./ui/review.js";
import { settingsScreen } from "./ui/settings.js";
import { skillsScreen } from "./ui/skills.js";
import { trailScreen } from "./ui/trail.js";

const app = document.querySelector("#app");
const screens = {
  home: homeScreen,
  path: trailScreen,
  review: reviewScreen,
  skills: skillsScreen,
  settings: settingsScreen,
  lesson: lessonScreen,
};

let state = loadProgress();
let actions = {};
let lastTrack = "";
let activeLessonId = null;
let clickLock = false;

function parseRoute() {
  const raw = (location.hash || "").replace(/^#/, "").replace(/^\//, "");
  const parts = raw.split("/").filter(Boolean);
  const name = parts[0] || "home";
  const known = new Set(["home", "path", "review", "skills", "settings", "lesson"]);
  if (!known.has(name)) return { name: "home", id: "" };
  return { name, id: parts[1] || "" };
}

function track(route) {
  const pagePath = route.id ? `/${route.name}/${route.id}` : `/${route.name}`;
  if (pagePath === lastTrack) return;
  lastTrack = pagePath;
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_path: pagePath,
      page_location: window.location.href,
    });
  }
}

function draw() {
  const route = parseRoute();
  const today = todayKey();
  state = withToday(state, today);
  if (route.name !== "lesson") {
    state = clearOverlays(state);
    activeLessonId = null;
  } else if (activeLessonId && activeLessonId !== route.id) {
    state = clearLessonOverlay(state, activeLessonId);
    activeLessonId = route.id;
  } else {
    activeLessonId = route.id;
  }
  saveProgress(state);
  noteLessonRoute(route);
  noteReviewRoute(route);

  const ctx = {
    state,
    today,
    route,
    update(change) {
      state = change(state);
      saveProgress(state);
      draw();
    },
    replace(next) {
      state = next;
      saveProgress(state);
      draw();
    },
    redraw() {
      draw();
    },
  };

  const view = screens[route.name](ctx);
  app.innerHTML = view.html;
  actions = view.actions || {};
  document.title = view.title ? `${view.title} · MedOnMt WFA` : "MedOnMt WFA";
  track(route);
}

app.addEventListener("click", (event) => {
  if (clickLock) return;
  const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
  if (!target || !app.contains(target) || target.matches("input")) return;
  const action = actions[target.dataset.action];
  if (!action) return;
  clickLock = true;
  action(target, event);
  window.requestAnimationFrame(() => {
    clickLock = false;
  });
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.id === "import-file") {
    const importer = actions["import-file"];
    if (importer) importer(target);
    return;
  }
  const name = target.dataset.action;
  if (name && actions[name]) actions[name](target, event);
});

window.addEventListener("hashchange", () => {
  lastTrack = "";
  draw();
});

draw();
