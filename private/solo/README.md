# Brainrot Resistance Score

A single-page habit scoring app for resisting short-form and social media drift. It uses only HTML, CSS, and vanilla JavaScript, with all data stored in `localStorage`.

## Run Locally

Open `index.html` in any modern browser.

No build step, backend, framework, or dependency install is required.

## Android Chrome Offline Use

Host the folder on GitHub Pages, open it once in Android Chrome while online, then use Chrome's "Add to Home screen" option. The service worker caches the app shell for offline use after the first load.

## Data

The app stores entries, custom activities, and weekly boss battle state in browser `localStorage` under `brainrotResistanceScore.v1`. Use the Settings tab to export or import a JSON backup.

## Google Sheets Sync

Create a Google Apps Script web app that accepts `POST` requests and appends rows to a sheet. In the app's System tab, save the Web App URL and sync secret. These credentials are stored only in your browser `localStorage`, not in the repository.
