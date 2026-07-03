const STORAGE_KEY = "brainrotResistanceScore.v1";
const SYNC_CONFIG_KEY = "brainrotResistanceScore.syncConfig.v1";
const SYNCED_IDS_KEY = "brainrotResistanceScore.syncedEntryIds.v1";
const SUCCESS_THRESHOLD = 25;
const DAILY_TARGET = 25;

const ACTIVITIES = [
  {
    category: "Knowledge",
    items: [
      ["20 pages easy reading", 1],
      ["20 pages technical reading", 3],
      ["20 pages hard technical reading", 5],
      ["Finish research paper with notes", 10],
    ],
  },
  {
    category: "Builder",
    items: [
      ["20 min coding no AI", 5],
      ["1 hour coding no AI", 15],
      ["Solve Leetcode Medium", 8],
      ["Solve Leetcode Hard", 15],
      ["Ship repo feature", 20],
      ["Write design doc", 15],
      ["Read OSS code 30 min", 8],
    ],
  },
  {
    category: "Physical",
    items: [
      ["20 min Zone 2 cardio", 5],
      ["45 min Zone 2 cardio", 10],
      ["VO2 max workout", 15],
      ["Complete rehab session", 10],
      ["Stretching/mobility 15 min", 5],
      ["Recovery walk", 3],
    ],
  },
  {
    category: "Thinking",
    items: [
      ["30 min thinking walk", 5],
      ["20 min meditation", 5],
      ["Journal and plan next day", 3],
      ["Solve hard engineering problem without internet 30 min", 10],
    ],
  },
  {
    category: "Creativity",
    items: [
      ["20 min drawing/music/writing", 5],
      ["Build something for fun", 8],
    ],
  },
  {
    category: "Penalties",
    items: [
      ["Shorts/Reels 15 min", -5],
      ["Shorts/Reels 30 min", -15],
      ["Doomscrolling 1 hour", -25],
      ["Random YouTube without intent", -10],
      ["Social media opened more than 10 times", -10],
      ["Phone in bed", -10],
      ["Gaming more than 2h weekday", -10],
    ],
  },
];

const BOSSES = [
  {
    id: "engineer",
    name: "Engineer Boss",
    reward: 50,
    tasks: ["Read one technical book chapter", "Solve 3 Leetcode Mediums", "Build one side project feature"],
  },
  {
    id: "athlete",
    name: "Athlete Boss",
    reward: 50,
    tasks: ["4 cardio sessions", "3 rehab sessions", "Hit weekly step goal"],
  },
  {
    id: "scholar",
    name: "Scholar Boss",
    reward: 50,
    tasks: ["Read 3 papers", "Write summaries"],
  },
];

const LEVELS = [
  [0, "Brainrot Goblin"],
  [100, "Apprentice"],
  [250, "Builder"],
  [500, "Engineer"],
  [1000, "Senior Engineer"],
  [2000, "Staff Engineer"],
  [5000, "Principal"],
  [10000, "Wizard"],
];

let state = loadState();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function todayKey(date = new Date()) {
  return toDateKey(date);
}

function toDateKey(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function loadState() {
  const fallback = {
    entries: [],
    customActivities: [],
    bosses: { week: getIsoWeekKey(new Date()), state: {} },
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return fallback;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      customActivities: Array.isArray(parsed.customActivities) ? parsed.customActivities : [],
      bosses: parsed.bosses && parsed.bosses.week ? parsed.bosses : fallback.bosses,
    };
  } catch {
    return fallback;
  }
}

// localStorage schema:
// entries: [{ id, date, name, category, points, createdAt }]
// customActivities: [{ id, name, category, points }]
// bosses: { week: "YYYY-Www", state: { [bossId]: { tasks: boolean[], claimed: boolean } } }
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSyncConfig() {
  try {
    const config = JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY));
    return {
      url: config?.url || "",
      secret: config?.secret || "",
    };
  } catch {
    return { url: "", secret: "" };
  }
}

function saveSyncConfig(config) {
  localStorage.setItem(
    SYNC_CONFIG_KEY,
    JSON.stringify({ url: config.url.trim(), secret: config.secret.trim() })
  );
}

function getSyncedIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(SYNCED_IDS_KEY));
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function saveSyncedIds(ids) {
  localStorage.setItem(SYNCED_IDS_KEY, JSON.stringify(Array.from(ids)));
}

function ensureCurrentWeek() {
  const week = getIsoWeekKey(new Date());
  if (!state.bosses || state.bosses.week !== week) {
    state.bosses = { week, state: {} };
    saveState();
  }
}

function getIsoWeekKey(date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getDayEntries(dateKey) {
  return state.entries.filter((entry) => entry.date === dateKey);
}

function summarizeEntries(entries) {
  const points = entries.filter((entry) => entry.points > 0).reduce((sum, entry) => sum + entry.points, 0);
  const penalties = entries.filter((entry) => entry.points < 0).reduce((sum, entry) => sum + Math.abs(entry.points), 0);
  return { points, penalties, net: points - penalties };
}

function getRank(score) {
  if (score >= 60) return "Deep Work Beast";
  if (score >= 40) return "Excellent Day";
  if (score >= 25) return "Good Day";
  if (score >= 15) return "Bare Minimum";
  return "Brainrot Goblin";
}

function getLifetimeXp() {
  return state.entries.filter((entry) => entry.points > 0).reduce((sum, entry) => sum + entry.points, 0);
}

function getLevel(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1] || LEVELS[0];
  for (let index = 0; index < LEVELS.length; index += 1) {
    if (xp >= LEVELS[index][0]) {
      current = LEVELS[index];
      next = LEVELS[index + 1] || LEVELS[index];
    }
  }
  return { current, next };
}

function getDateRange(days) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return toDateKey(date);
  });
}

// Streak scoring is based on final net score per calendar day.
function calculateStreaks() {
  const scoresByDate = getScoresByDate();
  let current = 0;
  const today = todayKey();
  const todayScore = scoresByDate.get(today)?.net || 0;
  const startOffset = todayScore >= SUCCESS_THRESHOLD ? 0 : 1;
  const datesBackward = getDateRange(3660).slice(startOffset);

  if (todayScore >= SUCCESS_THRESHOLD) current = 1;
  for (const date of datesBackward) {
    if (date === today) continue;
    const score = scoresByDate.get(date)?.net || 0;
    if (score >= SUCCESS_THRESHOLD) current += 1;
    else break;
  }

  const sortedDates = Array.from(scoresByDate.keys()).sort();
  let longest = 0;
  let running = 0;
  let previous = null;
  for (const date of sortedDates) {
    const score = scoresByDate.get(date).net;
    const consecutive = previous && daysBetween(previous, date) === 1;
    running = score >= SUCCESS_THRESHOLD ? (consecutive ? running + 1 : 1) : 0;
    longest = Math.max(longest, running);
    previous = date;
  }

  return { current, longest };
}

function daysBetween(a, b) {
  const one = new Date(`${a}T00:00:00`);
  const two = new Date(`${b}T00:00:00`);
  return Math.round((two - one) / 86400000);
}

function getScoresByDate() {
  const map = new Map();
  for (const entry of state.entries) {
    const current = map.get(entry.date) || { points: 0, penalties: 0, net: 0 };
    if (entry.points > 0) current.points += entry.points;
    if (entry.points < 0) current.penalties += Math.abs(entry.points);
    current.net += entry.points;
    map.set(entry.date, current);
  }
  return map;
}

function addEntry(name, category, points) {
  const entry = {
    id: makeId(),
    date: todayKey(),
    name,
    category,
    points,
    createdAt: new Date().toISOString(),
  };
  state.entries.push(entry);
  saveState();
  render();
  flash(points);
  showToast(`${points > 0 ? "+" : ""}${points} ${name}`);
  syncEntries({ silent: true, entries: [entry] });
}

function deleteEntry(id) {
  if (!confirm("Delete this logged entry?")) return;
  state.entries = state.entries.filter((entry) => entry.id !== id);
  saveState();
  render();
}

function render() {
  ensureCurrentWeek();
  renderDashboard();
  renderActivityLogger();
  renderHistory();
  renderBosses();
  renderSyncSettings();
}

function renderDashboard() {
  const date = todayKey();
  const todayEntries = getDayEntries(date);
  const summary = summarizeEntries(todayEntries);
  const streaks = calculateStreaks();
  const xp = getLifetimeXp();
  const level = getLevel(xp);
  const nextTarget = level.next[0];
  const currentTarget = level.current[0];
  const levelPercent = nextTarget === currentTarget ? 100 : ((xp - currentTarget) / (nextTarget - currentTarget)) * 100;

  $("#todayLabel").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  $("#netScore").textContent = summary.net;
  $("#dailyRank").textContent = getRank(summary.net);
  $("#todayPoints").textContent = summary.points;
  $("#todayPenalties").textContent = summary.penalties;
  $("#currentStreak").textContent = streaks.current;
  $("#longestStreak").textContent = streaks.longest;
  $("#lifetimeXp").textContent = `${xp} XP`;
  $("#levelName").textContent = level.current[1];
  $("#dailyProgress").style.width = `${Math.min(100, Math.max(0, (summary.net / DAILY_TARGET) * 100))}%`;
  $("#dailyProgressText").textContent = `${summary.net} / ${DAILY_TARGET}`;
  $("#levelProgress").style.width = `${Math.min(100, Math.max(0, levelPercent))}%`;
  $("#levelProgressText").textContent =
    nextTarget === currentTarget ? `${xp} / max` : `${xp - currentTarget} / ${nextTarget - currentTarget}`;
  $("#levelProgressLabel").textContent =
    nextTarget === currentTarget ? "Maximum level reached" : `Next: ${level.next[1]}`;

  renderEntries(todayEntries);
}

function renderEntries(entries) {
  const host = $("#todayEntries");
  if (!entries.length) {
    host.innerHTML = `<div class="empty-state">No quests cleared today.</div>`;
    return;
  }

  host.innerHTML = entries
    .slice()
    .reverse()
    .map(
      (entry) => `
        <div class="entry-row">
          <div class="entry-info">
            <strong>${escapeHtml(entry.name)}</strong>
            <span class="subtle">${escapeHtml(entry.category)}</span>
            <span class="points ${entry.points >= 0 ? "positive" : "negative"}">${entry.points > 0 ? "+" : ""}${entry.points}</span>
          </div>
          <button class="delete-button" data-delete-entry="${entry.id}" aria-label="Delete entry">x</button>
        </div>
      `
    )
    .join("");
}

function renderActivityLogger() {
  const groups = [...ACTIVITIES];
  const customGroups = groupCustomActivities();
  for (const [category, items] of customGroups.entries()) {
    groups.push({ category: `${category} Custom`, items: items.map((item) => [item.name, item.points]) });
  }

  $("#activityGroups").innerHTML = groups
    .map(
      (group) => `
        <section class="activity-category">
          <h2>${escapeHtml(group.category)}</h2>
          ${group.items
            .map(([name, points]) => {
              const isPenalty = points < 0;
              return `
                <div class="activity-row">
                  <div class="activity-info">
                    <strong>${escapeHtml(name)}</strong>
                    <span class="points ${isPenalty ? "negative" : "positive"}">${points > 0 ? "+" : ""}${points}</span>
                  </div>
                  <button class="${isPenalty ? "ghost-button danger" : "primary-button"}" data-log-name="${escapeHtmlAttr(
                name
              )}" data-log-category="${escapeHtmlAttr(group.category.replace(" Custom", ""))}" data-log-points="${points}">
                    ${isPenalty ? "Record Corruption" : "Accept Quest"}
                  </button>
                </div>
              `;
            })
            .join("")}
        </section>
      `
    )
    .join("");
}

function groupCustomActivities() {
  const groups = new Map();
  for (const item of state.customActivities) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  return groups;
}

function renderHistory() {
  const scores = getScoresByDate();
  const last7 = getDateRange(7);
  const last30 = getDateRange(30);
  const last7Scores = last7.map((date) => scores.get(date)?.net || 0);
  const last30Scores = last30.map((date) => scores.get(date)?.net || 0);
  const allSummaries = Array.from(scores.values());
  const best = allSummaries.length ? Math.max(...allSummaries.map((score) => score.net)) : 0;
  const totalPositive = allSummaries.reduce((sum, score) => sum + score.points, 0);
  const totalPenalties = allSummaries.reduce((sum, score) => sum + score.penalties, 0);

  $("#average7").textContent = average(last7Scores);
  $("#average30").textContent = average(last30Scores);
  $("#bestDay").textContent = best;
  $("#totalsAllTime").textContent = `${totalPositive} / ${totalPenalties}`;
  $("#last7Days").innerHTML = renderHistoryRows(last7, scores);
  $("#last30Days").innerHTML = renderHistoryRows(last30, scores);
}

function renderHistoryRows(dates, scores) {
  const rows = dates
    .map((date) => {
      const score = scores.get(date) || { points: 0, penalties: 0, net: 0 };
      return `
        <div class="history-row">
          <div class="history-info">
            <strong>${formatDate(date)}</strong>
            <span class="subtle">${getRank(score.net)}</span>
          </div>
          <span class="points ${score.net >= SUCCESS_THRESHOLD ? "positive" : "negative"}">${score.net}</span>
        </div>
      `;
    })
    .join("");
  return rows || `<div class="empty-state">No archive records yet.</div>`;
}

function renderBosses() {
  const week = getIsoWeekKey(new Date());
  $("#weekLabel").textContent = `ISO week ${week}`;
  $("#bossList").innerHTML = BOSSES.map((boss) => {
    const bossState = getBossState(boss);
    const complete = bossState.tasks.every(Boolean);
    return `
      <article class="boss-card">
        <div class="boss-title">
          <h2>${boss.name}</h2>
          <span class="points positive">+${boss.reward}</span>
        </div>
        ${boss.tasks
          .map(
            (task, index) => `
              <label class="boss-task ${bossState.tasks[index] ? "is-done" : ""}">
                <input type="checkbox" data-boss-task="${boss.id}" data-task-index="${index}" ${
              bossState.tasks[index] ? "checked" : ""
            } />
                <span>${escapeHtml(task)}</span>
              </label>
            `
          )
          .join("")}
        <button class="primary-button" data-claim-boss="${boss.id}" ${!complete || bossState.claimed ? "disabled" : ""}>
          ${bossState.claimed ? "Reward Claimed" : "Claim Raid Reward"}
        </button>
      </article>
    `;
  }).join("");
}

function renderSyncSettings() {
  const config = loadSyncConfig();
  const syncedIds = getSyncedIds();
  const pending = state.entries.filter((entry) => !syncedIds.has(entry.id)).length;
  const urlInput = $("#syncUrl");
  const secretInput = $("#syncSecret");
  if (!urlInput || document.activeElement === urlInput || document.activeElement === secretInput) return;
  urlInput.value = config.url;
  secretInput.value = config.secret;
  $("#syncStatus").textContent = config.url && config.secret
    ? `${pending} unsynced entr${pending === 1 ? "y" : "ies"}.`
    : "Not configured.";
}

function getBossState(boss) {
  if (!state.bosses.state[boss.id]) {
    state.bosses.state[boss.id] = { tasks: boss.tasks.map(() => false), claimed: false };
  }
  return state.bosses.state[boss.id];
}

function average(values) {
  return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : "0";
}

function formatDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function flash(points) {
  const selector = points >= 0 ? ".positive-flash-target" : ".negative-flash-target";
  const className = points >= 0 ? "flash-positive" : "flash-negative";
  const target = $(selector);
  target.classList.remove(className);
  void target.offsetWidth;
  target.classList.add(className);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value);
}

function bindEvents() {
  $(".tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    $$(".tab").forEach((tab) => tab.classList.toggle("is-active", tab === button));
    $$(".tab-panel").forEach((panel) => panel.classList.toggle("is-active", panel.id === button.dataset.tab));
  });

  document.addEventListener("click", (event) => {
    const logButton = event.target.closest("[data-log-name]");
    if (logButton) {
      addEntry(logButton.dataset.logName, logButton.dataset.logCategory, Number(logButton.dataset.logPoints));
      return;
    }

    const deleteButton = event.target.closest("[data-delete-entry]");
    if (deleteButton) {
      deleteEntry(deleteButton.dataset.deleteEntry);
      return;
    }

    const claimButton = event.target.closest("[data-claim-boss]");
    if (claimButton) {
      claimBoss(claimButton.dataset.claimBoss);
    }
  });

  document.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-boss-task]");
    if (!checkbox) return;
    const boss = BOSSES.find((item) => item.id === checkbox.dataset.bossTask);
    const bossState = getBossState(boss);
    bossState.tasks[Number(checkbox.dataset.taskIndex)] = checkbox.checked;
    saveState();
    render();
  });

  $("#customActivityForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#customName").value.trim();
    const category = $("#customCategory").value.trim();
    const points = Number($("#customPoints").value);
    if (!name || !category || !Number.isFinite(points)) return;
    state.customActivities.push({ id: makeId(), name, category, points });
    saveState();
    event.target.reset();
    $("#customPoints").value = 5;
    render();
    showToast("Custom quest registered");
  });

  $("#resetTodayBtn").addEventListener("click", () => {
    if (!confirm("Reset today only? This deletes all entries logged today.")) return;
    const today = todayKey();
    state.entries = state.entries.filter((entry) => entry.date !== today);
    saveState();
    render();
  });

  $("#exportBtn").addEventListener("click", () => {
    $("#exportOutput").value = JSON.stringify(state, null, 2);
    showToast("Backup JSON exported");
  });

  $("#importInput").addEventListener("change", importBackup);

  $("#clearAllBtn").addEventListener("click", () => {
    if (!confirm("Clear all Brainrot Resistance Score data from this browser?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNCED_IDS_KEY);
    state = loadState();
    render();
  });

  $("#syncSettingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const url = $("#syncUrl").value.trim();
    const secret = $("#syncSecret").value.trim();
    if (!url || !secret) {
      alert("Enter both the Apps Script URL and sync secret.");
      return;
    }
    saveSyncConfig({ url, secret });
    renderSyncSettings();
    showToast("Sync credentials saved");
  });

  $("#syncNowBtn").addEventListener("click", () => {
    syncEntries({ silent: false });
  });

  $("#clearSyncBtn").addEventListener("click", () => {
    if (!confirm("Clear stored Google Sheets sync URL, secret, and synced-entry markers?")) return;
    localStorage.removeItem(SYNC_CONFIG_KEY);
    localStorage.removeItem(SYNCED_IDS_KEY);
    renderSyncSettings();
    showToast("Sync settings cleared");
  });

  window.addEventListener("online", () => syncEntries({ silent: true }));
}

function claimBoss(bossId) {
  const boss = BOSSES.find((item) => item.id === bossId);
  const bossState = getBossState(boss);
  if (bossState.claimed || !bossState.tasks.every(Boolean)) return;
  bossState.claimed = true;
  addEntry(`${boss.name} reward`, "Raid Gates", boss.reward);
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported || !Array.isArray(imported.entries)) throw new Error("Invalid backup");
      if (!confirm("Import this backup and replace current data?")) return;
      state = {
        entries: imported.entries || [],
        customActivities: imported.customActivities || [],
        bosses: imported.bosses || { week: getIsoWeekKey(new Date()), state: {} },
      };
      saveState();
      render();
      showToast("Backup imported");
    } catch {
      alert("Import failed. Choose a valid JSON backup.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

async function syncEntries({ silent = false, entries = null } = {}) {
  const config = loadSyncConfig();
  if (!config.url || !config.secret) {
    if (!silent) alert("Save your Apps Script URL and sync secret first.");
    return;
  }

  if (!navigator.onLine) {
    if (!silent) showToast("Offline. Sync pending.");
    return;
  }

  const syncedIds = getSyncedIds();
  const candidates = entries || state.entries;
  const unsyncedEntries = candidates.filter((entry) => !syncedIds.has(entry.id));
  if (!unsyncedEntries.length) {
    if (!silent) showToast("Nothing to sync");
    renderSyncSettings();
    return;
  }

  try {
    await fetch(config.url, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        secret: config.secret,
        entries: unsyncedEntries,
      }),
    });

    unsyncedEntries.forEach((entry) => syncedIds.add(entry.id));
    saveSyncedIds(syncedIds);
    renderSyncSettings();
    if (!silent) showToast(`Synced ${unsyncedEntries.length} entr${unsyncedEntries.length === 1 ? "y" : "ies"}`);
  } catch {
    if (!silent) showToast("Sync failed");
  }
}

bindEvents();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline support is optional; the app still works without a service worker.
    });
  });
}
