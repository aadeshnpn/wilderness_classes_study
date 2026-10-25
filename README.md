# MedOnMt WFA

A calm, phone-first study trail for Wilderness First Aid. This version is Chapter 1, Patient Assessment: six short lessons, card review, and a checkpoint. It is a study aid, not medical advice and not a certification.

The app name on the home screen is **MedOnMt WFA**. The later public host is `wfa.medonmt.org`, with the site files living in the document root `/wfa.medonmt.org`. Nothing here deploys that host for you.

## Run locally

```bash
npm install
npm test
npm run dev
```

`npm run dev` serves the app at `http://127.0.0.1:5173`. Progress is stored in this browser under `localStorage` key `wfa-progress-v1`. There is no account.

## What gets published

```bash
npm run build
```

The static site is the **contents** of `dist/` (`index.html`, `assets/`, `favicon.svg`). Copy those files into the document root `/wfa.medonmt.org` so `index.html` sits at the root of that folder. Do not nest a `dist` directory inside the docroot.

Routes use the URL hash (`#/path`, `#/lesson/wfa-01-a`), so a plain Apache or Reclaim host does not need rewrite rules. The build uses relative asset paths and can be copied as-is.

## What’s in this version

- Home, with one-tap Continue, a daily goal (default **2 lessons**, about 15 minutes), and a streak that advances when you finish one lesson
- Trail stage **1 · Patient Assessment** (`wfa-01-a` through `wfa-01-f`). Chapters 2–20 are listed as coming later
- Lessons mix a short explanation, retrieval cards, multiple choice, ordering, and one trail scenario
- A wrong answer shows the reason immediately. There are no hearts and nothing locks you out
- Chapter checkpoint clears at 70%. You can retry
- Leitner review for the 16 Chapter 1 cards (hard tomorrow, OK in 3 days, easy in 7, then 14)
- Optional partner checklist and links to AWLS videos, practice exams, and the textbook. They never gate a lesson
- One streak pause per week, covering a single missed day, plus a quiet welcome back
- Settings to change the goal (1, 2, or 4 lessons), export or import progress, or clear it
- Google Analytics tag `G-NXEKH95XD4` on the page, with a page view for each screen

## Out of scope

Chapters 2–20, accounts, push notifications, and deploying to the host.
