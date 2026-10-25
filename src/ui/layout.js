export function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function markerIcon() {
  return `<svg class="marker" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5 28 16 16 28.5 4 16Z"/></svg>`;
}

function gearIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"></path></svg>`;
}

function closeIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>`;
}

function navIcon(name) {
  if (name === "home") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5V20H4Z"></path></svg>`;
  }
  if (name === "trail") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 12 12 20.5 5 12Z"></path></svg>`;
  }
  if (name === "review") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v12H6Z"></path><path d="M9 10h6M9 14h4"></path></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"></circle><path d="M12 8.5v4l2.2 1.5"></path></svg>`;
}

export function pips(box) {
  const filled = Math.max(0, Math.min(4, box || 0));
  const marks = [1, 2, 3, 4]
    .map((level) => `<i class="${level <= filled ? "on" : ""}"></i>`)
    .join("");
  return `<span class="pips" aria-label="Memory strength ${filled} of 4">${marks}</span>`;
}

export function disclaimer() {
  return `<p class="disclaimer">Study aid only. Not medical advice or a certification.</p>`;
}

function tab(href, id, label, active, extra = "") {
  const current = active === id ? ` aria-current="page"` : "";
  return `<a href="${href}"${current}>${navIcon(id)}${esc(label)}${extra}</a>`;
}

export function frame({
  mode,
  title,
  streakLabel,
  streakCount,
  active,
  reviewCount,
  main,
  dock = "",
}) {
  const reviewExtra =
    reviewCount > 0 ? `<span class="tab-count">${reviewCount}</span>` : "";
  const header =
    mode === "lesson"
      ? `<header class="top top-lesson">
          <a class="icon-btn" href="#/" aria-label="Close and save progress">${closeIcon()}</a>
          <div class="lesson-heading">
            <p class="eyebrow">${esc(title.eyebrow || "")}</p>
            <h1>${esc(title.heading)}</h1>
          </div>
          <span class="step-count">${esc(title.step || "")}</span>
        </header>`
      : `<header class="top">
          <h1 class="brand"><a href="#/">MedOnMt WFA</a></h1>
          <div class="top-actions">
            <p class="streak" aria-label="${esc(streakLabel)}">${markerIcon()}<span>${esc(streakCount)}</span></p>
            <a class="icon-btn" href="#/settings" aria-label="Settings">${gearIcon()}</a>
          </div>
        </header>`;

  const nav =
    mode === "lesson"
      ? ""
      : `<nav class="tabbar" aria-label="Primary">
          ${tab("#/", "home", "Home", active)}
          ${tab("#/path", "trail", "Trail", active)}
          ${tab("#/review", "review", "Review", active, reviewExtra)}
          ${tab("#/skills", "skills", "Skills", active)}
        </nav>`;

  return `<div class="frame" data-screen="${esc(active || "lesson")}">
    ${header}
    <main class="main">${main}</main>
    ${dock}
    ${nav}
  </div>`;
}

export function bar(current, total) {
  const safeTotal = total > 0 ? total : 1;
  const width = Math.max(0, Math.min(100, Math.round((current / safeTotal) * 100)));
  return `<div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="${safeTotal}" aria-valuenow="${current}"><span style="width:${width}%"></span></div>`;
}
