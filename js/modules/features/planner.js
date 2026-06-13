// ================== PLANNER ==================
import { state, saveState } from "../core/state.js";
import {
  getImportanceColor,
  getImportanceLabel,
  showImportancePicker,
} from "../core/utils.js";
import { calculateTodayPoints } from "../features/settings.js";

export function renderPlanner(container) {
  let html = `<div class="card fade-in"><div style="display:flex; justify-content:space-between;"><h2>📋 برنامه امروز</h2><button class="primary" onclick="addNewTask()">+ افزودن وظیفه</button></div><div>`;

  const dailyTasks = state.dailyTasks.filter((t) => !t.persistent);
  const persistentTasks = state.dailyTasks.filter((t) => t.persistent);

  const renderTask = (task) => {
    const done = task.subtasks.filter((s) => s.done).length;
    const total = task.subtasks.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const isPersistent = task.persistent;
    return `<div class="card fade-in importance-${task.importance || "medium"}" style="margin-bottom:20px; border-radius:16px; ${isPersistent ? "border: 2px dashed var(--info);" : ""}">
      <div style="display:flex; justify-content:space-between;">
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="badge" style="background:${getImportanceColor(task.importance)};color:#fff;">${getImportanceLabel(task.importance)}</span>
          <strong>${task.title}</strong>
          ${isPersistent ? '<span style="color:var(--info);" title="ماندگار">📌</span>' : ""}
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="badge">${pct}%</span>
          <button class="small" onclick="togglePersistent(${task.id})" title="${isPersistent ? "تبدیل به روزانه" : "ماندگار کردن"}">
            ${isPersistent ? "📌" : "📍"}
          </button>
          <button class="small" onclick="editTask(${task.id})">✏️</button>
          <button class="small danger" onclick="deleteTask(${task.id})">🗑️</button>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:12px;"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div>${task.subtasks
        .map(
          (sub) => `
        <div class="subtask-item">
          <input type="checkbox" ${sub.done ? "checked" : ""} onchange="toggleSubtask(${task.id},${sub.id})" style="width:20px;height:20px;accent-color:var(--accent);">
          <span style="flex:1;text-decoration:${sub.done ? "line-through" : ""};">${sub.text}</span>
          <span class="badge" style="background:${getImportanceColor(sub.importance || "normal")};color:#fff;">${getImportanceLabel(sub.importance || "normal")}</span>
        </div>
      `,
        )
        .join("")}</div>
      <button class="small" style="margin-top:10px;" onclick="addSubtask(${task.id})">+ زیروظیفه</button>
    </div>`;
  };

  if (dailyTasks.length > 0) {
    html += '<h3 style="margin:16px 0 8px; color:var(--text2);">📆 امروز</h3>';
    dailyTasks.forEach((task) => {
      html += renderTask(task);
    });
  }

  if (persistentTasks.length > 0) {
    html +=
      '<h3 style="margin:24px 0 8px; color:var(--info);">📌 برنامه‌های ماندگار</h3>';
    persistentTasks.forEach((task) => {
      html += renderTask(task);
    });
  }

  if (dailyTasks.length === 0 && persistentTasks.length === 0) {
    html += "<p>وظیفه‌ای نداری</p>";
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

window.addNewTask = async function () {
  const t = prompt("عنوان:");
  if (!t || !t.trim()) return;
  const imp = await showImportancePicker();
  if (imp === null) return;
  state.dailyTasks.push({
    id: Date.now(),
    title: t.trim(),
    importance: imp,
    subtasks: [],
    persistent: false,
  });
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.togglePersistent = async function (id) {
  const task = state.dailyTasks.find((t) => t.id === id);
  if (!task) return;
  task.persistent = !task.persistent;
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.editTask = async function (id) {
  const task = state.dailyTasks.find((t) => t.id === id);
  if (!task) return;
  const t = prompt("عنوان:", task.title);
  if (t && t.trim()) task.title = t.trim();
  const imp = await showImportancePicker(task.importance);
  if (imp) task.importance = imp;
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.deleteTask = async function (id) {
  if (!confirm("حذف؟")) return;
  state.dailyTasks = state.dailyTasks.filter((t) => t.id !== id);
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.addSubtask = async function (taskId) {
  const text = prompt("زیروظیفه:");
  if (!text) return;
  const imp = await showImportancePicker("normal");
  if (imp === null) return;
  const task = state.dailyTasks.find((t) => t.id === taskId);
  if (!task) return;
  task.subtasks.push({
    id: Date.now(),
    text: text.trim(),
    done: false,
    importance: imp,
  });
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};

window.toggleSubtask = async function (taskId, subId) {
  const task = state.dailyTasks.find((t) => t.id === taskId);
  if (!task) return;
  const sub = task.subtasks.find((s) => s.id === subId);
  if (!sub) return;
  sub.done = !sub.done;
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};
