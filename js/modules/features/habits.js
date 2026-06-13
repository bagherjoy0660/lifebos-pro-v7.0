// ================== HABITS ==================
import { state, saveState } from "../core/state.js";
import { calculateTodayPoints } from "../features/settings.js"; // ← جدید

export function renderHabits(container) {
  let html = `<div class="card fade-in"><h2>✅ عادت‌های روزانه</h2><button class="primary" style="margin:12px 0;" onclick="addHabit()">+ عادت جدید</button>`;
  state.habits.forEach((h) => {
    html += `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface2);border-radius:12px;margin-bottom:8px;">
      <span>${h.icon}</span>
      <span style="flex:1;">${h.name}</span>
      <span class="badge" style="background:${h.doneToday ? "var(--success)" : "var(--surface3)"};cursor:pointer;" onclick="toggleHabit(${h.id})">${h.doneToday ? "✓ انجام شد" : "انجام نشده"}</span>
      <span>🔥${h.streak}</span>
      <button class="small danger" onclick="deleteHabit(${h.id})">🗑️</button>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

window.addHabit = async function () {
  const name = prompt("نام عادت:");
  if (!name) return;
  const icon = prompt("آیکون:", "•");
  const id = Math.max(0, ...state.habits.map((h) => h.id), 0) + 1;
  state.habits.push({ id, name, streak: 0, doneToday: false, icon });
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.toggleHabit = async function (id) {
  const h = state.habits.find((x) => x.id === id);
  if (!h) return;
  h.doneToday = !h.doneToday;
  h.streak = h.doneToday ? h.streak + 1 : Math.max(0, h.streak - 1);
  await saveState();
  await calculateTodayPoints(); // ← جدید
  if (typeof window.render === "function") await window.render();
};

window.deleteHabit = async function (id) {
  state.habits = state.habits.filter((h) => h.id !== id);
  await saveState();
  if (typeof window.render === "function") await window.render();
};
