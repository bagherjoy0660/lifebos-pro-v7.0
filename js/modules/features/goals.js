// ================== GOALS ==================
import { state, saveState } from "../core/state.js";
import {
  getImportanceColor,
  getImportanceLabel,
  showImportancePicker,
} from "../core/utils.js";
import { calculateTodayPoints } from "../features/settings.js";

export function renderGoals(container) {
  let html = `<div class="card fade-in"><h2>🎯 اهداف</h2><button class="primary" onclick="addGoal()">+ هدف جدید</button>`;
  state.goals.forEach((goal) => {
    const t = goal.subtasks.length,
      d = goal.subtasks.filter((s) => s.done).length,
      pct = t ? Math.round((d / t) * 100) : 0;
    html += `
    <div class="card importance-${goal.importance}" style="margin-bottom:20px;background:var(--surface2);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge" style="background:${getImportanceColor(goal.importance)};color:#fff;">${getImportanceLabel(goal.importance)}</span>
          <strong>${goal.title}</strong>
        </div>
        <div style="display:flex; gap:8px;">
          <span class="badge">${pct}%</span>
          <button class="small" onclick="editGoal(${goal.id})">✏️</button>
          <button class="small danger" onclick="deleteGoal(${goal.id})">🗑️</button>
        </div>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div>${goal.subtasks
        .map(
          (sub) => `
        <div class="subtask-item" style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border);">
          <input type="checkbox" ${sub.done ? "checked" : ""} onchange="toggleGoalSubtask(${goal.id},${sub.id})" style="width:20px;height:20px;accent-color:var(--accent); flex-shrink:0;">
          <span style="flex:1; text-align:right;">${sub.text}</span>
          <span class="badge" style="background:${getImportanceColor(sub.importance)};color:#fff;">${getImportanceLabel(sub.importance)}</span>
        </div>
      `,
        )
        .join("")}</div>
      <button class="small" style="margin-top:10px; width:100%;" onclick="addGoalSubtask(${goal.id})">+ زیرهدف</button>
    </div>`;
  });
  container.innerHTML = html;
}

window.addGoal = async function () {
  const t = prompt("هدف:");
  if (!t) return;
  const imp = await showImportancePicker();
  if (imp === null) return;
  state.goals.push({ id: Date.now(), title: t, importance: imp, subtasks: [] });
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.editGoal = async function (id) {
  const g = state.goals.find((x) => x.id === id);
  if (!g) return;
  const t = prompt("عنوان:", g.title);
  if (t) g.title = t;
  const imp = await showImportancePicker(g.importance);
  if (imp) g.importance = imp;
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.deleteGoal = async function (id) {
  state.goals = state.goals.filter((g) => g.id !== id);
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.addGoalSubtask = async function (gid) {
  const text = prompt("زیرهدف:");
  if (!text) return;
  const imp = await showImportancePicker("normal");
  if (imp === null) return;
  const goal = state.goals.find((g) => g.id === gid);
  if (!goal) return;
  goal.subtasks.push({ id: Date.now(), text, importance: imp, done: false });
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};

window.toggleGoalSubtask = async function (gid, sid) {
  const goal = state.goals.find((g) => g.id === gid);
  const sub = goal?.subtasks.find((s) => s.id === sid);
  if (!sub) return;
  sub.done = !sub.done;
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};
