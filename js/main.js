// ================== MAIN ORCHESTRATOR v7.2 ==================
import {
  state,
  saveState,
  loadState,
  resetAllData,
} from "./modules/core/state.js";
import {
  getTodayDateString,
  formatFaDate,
  THEME_COLORS,
  applyFont,
} from "./modules/core/utils.js";

import { renderDashboard } from "./modules/features/dashboard.js";
import { renderPlanner } from "./modules/features/planner.js";
import { renderHabits } from "./modules/features/habits.js";
import { renderFocus } from "./modules/features/focus.js";
import { renderWellness } from "./modules/features/wellness.js";
import { renderExercise } from "./modules/features/exercise.js";
import { renderNotepad } from "./modules/features/notepad.js";
import { renderGoals } from "./modules/features/goals.js";
import { renderJournal } from "./modules/features/journal.js";
import {
  openSettingsModal,
  closeSettingsModal,
  changeTheme,
  toggleTheme,
  applyBackground,
  calculateTodayPoints,
} from "./modules/features/settings.js";

let currentView = "dashboard";

function updateTopBar() {
  document.getElementById("todayDate").textContent = formatFaDate(new Date());
  document.getElementById("moodBadge").textContent = state.currentMood;
  if (state.dailyTasks.length > 0) {
    const totalSub = state.dailyTasks.reduce(
      (acc, t) => acc + t.subtasks.length,
      0,
    );
    const doneSub = state.dailyTasks.reduce(
      (acc, t) => acc + t.subtasks.filter((s) => s.done).length,
      0,
    );
    const percent = totalSub ? Math.round((doneSub / totalSub) * 100) : 0;
    document.getElementById("overallProgress").textContent =
      `📊 ${percent}% امروز`;
  } else {
    document.getElementById("overallProgress").textContent = "📋 بدون وظیفه";
  }
  const levelEl = document.getElementById("levelBadge");
  if (levelEl) levelEl.textContent = `⭐ سطح ${state.userLevel}`;
  const pointsEl = document.getElementById("pointsBadge");
  if (pointsEl) pointsEl.textContent = `💰 ${state.totalPoints} امتیاز`;
}

function navigateTo(view) {
  if (window.pomodoroTimer) {
    clearInterval(window.pomodoroTimer);
    window.pomodoroTimer = null;
    window.pomodoroRunning = false;
  }
  currentView = view;
  render();
}

async function render() {
  const content = document.getElementById("content");
  if (!content) return;
  content.innerHTML = "";

  switch (currentView) {
    case "dashboard":
      await renderDashboard(content);
      break;
    case "planner":
      await renderPlanner(content);
      break;
    case "habits":
      await renderHabits(content);
      break;
    case "focus":
      await renderFocus(content);
      break;
    case "wellness":
      await renderWellness(content);
      break;
    case "exercise":
      await renderExercise(content);
      break;
    case "notepad":
      await renderNotepad(content);
      break;
    case "goals":
      await renderGoals(content);
      break;
    case "journal":
      await renderJournal(content);
      break;
  }

  document.querySelectorAll(".nav-item").forEach((el) => {
    el.onclick = () => {
      const view = el.dataset.view;
      if (view) navigateTo(view);
    };
    el.classList.toggle("active", el.dataset.view === currentView);
  });
}

window.render = render;
window.navigateTo = navigateTo;
window.updateTopBar = updateTopBar;

async function init() {
  await loadState();
  const today = getTodayDateString();
  if (state.lastReset !== today) {
    state.habits.forEach((h) => (h.doneToday = false));
    const goal =
      state.waterMode === "cups" ? state.waterGoalCups : state.waterGoalBottles;
    state.waterIntake = Array(goal).fill(0);
    state.dailyTasks = state.dailyTasks.filter((task) => task.persistent);
    state.lastReset = today;
  }

  if (THEME_COLORS[state.theme]) {
    document.documentElement.style.setProperty(
      "--accent",
      THEME_COLORS[state.theme].main,
    );
    document.documentElement.style.setProperty(
      "--pink",
      THEME_COLORS[state.theme].light,
    );
  }

  applyBackground();
  applyFont(state.selectedFont || "Vazirmatn");

  await saveState();
  updateTopBar();
  await calculateTodayPoints();
  await render();
}

init();
