// ================== EXERCISE ==================
import { state, saveState } from "../core/state.js";
import { getTodayDateString } from "../core/utils.js";

export function renderExercise(container) {
  const today = getTodayDateString();
  container.innerHTML = `<div class="card fade-in">
    <h2>🏃 فعالیت</h2>
    <div style="display:flex;gap:8px;">
      <input id="exType" placeholder="نوع">
      <input id="exMins" placeholder="دقیقه">
      <button class="primary" onclick="logExercise()">ثبت</button>
    </div>
    <h3>امروز:</h3>
    ${state.exerciseLog
      .filter((e) => e.date === today)
      .map((e) => `<p>${e.type} - ${e.minutes} دقیقه</p>`)
      .join("")}
  </div>`;
}

window.logExercise = async function () {
  const type = document.getElementById("exType")?.value,
    mins = +document.getElementById("exMins")?.value;
  if (!type || !mins) return;
  state.exerciseLog.push({ date: getTodayDateString(), type, minutes: mins });
  await saveState();
  if (typeof window.render === "function") await window.render();
};
