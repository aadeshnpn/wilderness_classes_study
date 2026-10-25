import { freshState, hydrate, STORAGE_KEY } from "./model.js";

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    return hydrate(JSON.parse(raw));
  } catch {
    return freshState();
  }
}

export function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode and full storage still let the session run in memory.
  }
}

export function readImport(text) {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.version !== 1) {
    throw new Error("This file is not a MedOnMt WFA progress export.");
  }
  return hydrate(parsed);
}
