// ================== WELLNESS ==================
import { state, saveState } from "../core/state.js";
import { getTodayDateString } from "../core/utils.js";
import { calculateTodayPoints } from "../features/settings.js";

export function renderWellness(container) {
  const today = getTodayDateString();
  const todaySleep = state.sleepLog.find((s) => s.date === today);
  const meals = state.nutritionLog.filter((m) => m.date === today);

  const renderStars = (rating) => {
    if (typeof rating !== "number" || isNaN(rating)) return "☆☆☆☆☆";
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
  };

  // ========== بخش آب ==========
  let waterHtml = "";
  const mode = state.waterMode || "cups";
  const goal =
    mode === "cups" ? state.waterGoalCups || 8 : state.waterGoalBottles || 2;
  const icon =
    mode === "cups"
      ? state.waterUnitIconCup || "🥛"
      : state.waterUnitIconBottle || "🍾";
  const intake = Array.isArray(state.waterIntake) ? state.waterIntake : [];
  const unitName = mode === "cups" ? "لیوان" : "بطری";
  const mlPerUnit = mode === "cups" ? 250 : 1000;

  // اطمینان از هم‌طول بودن intake با goal
  while (intake.length < goal) intake.push(0);
  if (intake.length > goal) intake.splice(goal);

  const totalMl = intake.reduce((sum, val) => sum + (val / 4) * mlPerUnit, 0);
  const liters = totalMl / 1000;
  const displayTotal =
    liters >= 1
      ? `${liters.toFixed(2)} لیتر`
      : `${Math.round(totalMl)} میلی‌لیتر`;

  waterHtml += `<div class="card fade-in">
    <h2>💧 آب (${unitName})</h2>
    <p style="text-align:center; margin-bottom:8px;">${displayTotal}</p>
    <div class="habit-scroll" style="max-height:300px; overflow-y:auto; padding:8px; background:var(--surface2); border-radius:12px;">
      <div style="display:flex; flex-direction:column; gap:8px;">`;

  for (let i = 0; i < goal; i++) {
    const val = intake[i] || 0;
    const pct = val * 25;
    const fillColor = pct > 0 ? "var(--info)" : "transparent";
    waterHtml += `
      <div style="display:flex; align-items:center; gap:12px; padding:8px; background:var(--surface3); border-radius:10px; cursor:pointer;" onclick="setWater(${i})">
        <div style="position:relative; width:48px; height:48px; border-radius:50%; background:${fillColor}; display:flex; align-items:center; justify-content:center; border:2px solid var(--border); flex-shrink:0;">
          <span style="font-size:1.5rem;">${icon}</span>
          ${pct > 0 ? `<span style="position:absolute; bottom:-2px; right:-2px; background:var(--bg); border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; font-size:0.6rem; font-weight:bold; color:var(--text);">${pct}%</span>` : ""}
        </div>
        <span style="flex:1; text-align:right;">${unitName} ${i + 1}</span>
      </div>`;
  }

  waterHtml += `</div></div></div>`;

  // ========== بخش خواب ==========
  const sleepStarsHtml = todaySleep
    ? `<div class="star-rating">${renderStars(todaySleep.quality)}</div>`
    : '<span style="color:var(--text3);">ثبت نشده</span>';

  // ========== بخش وعده‌ها ==========
  const mealsHtml = meals.length
    ? meals
        .map(
          (m) =>
            `<div class="meal-item"><span>${m.meal === "صبحانه" ? "🥐" : m.meal === "ناهار" ? "🍛" : m.meal === "شام" ? "🍲" : "🍎"}</span><span>${m.meal}:</span><span style="color:var(--text2);">${m.notes || "بدون توضیح"}</span></div>`,
        )
        .join("")
    : '<p style="color:var(--text3);">امروز وعده‌ای ثبت نشده</p>';

  // ========== مونتاژ نهایی ==========
  container.innerHTML = `<div class="grid2">
    ${waterHtml}
    <div class="card fade-in">
      <h2>🌙 خواب</h2>
      <input id="sleepHours" type="number" placeholder="ساعت" min="0" max="24" step="0.5" value="${todaySleep?.hours || ""}">
      <select id="sleepQuality" style="margin-top:8px;">
        <option value="">کیفیت</option>
        ${[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => `<option value="${v}" ${todaySleep?.quality === v ? "selected" : ""}>${v}</option>`).join("")}
      </select>
      <button class="primary" onclick="logSleep()">ثبت</button>
      ${todaySleep ? `<div style="margin-top:8px;">${sleepStarsHtml}</div>` : ""}
    </div>
    <div class="card fade-in" style="grid-column:span 2;">
      <h2>🍽️ وعده‌ها</h2>
      <div style="display:flex;gap:8px;margin:12px 0;">
        <select id="mealType"><option>صبحانه</option><option>ناهار</option><option>شام</option><option>میان‌وعده</option></select>
        <input id="mealNotes" placeholder="توضیح">
        <button class="primary" onclick="logMeal()">+ ثبت</button>
      </div>
      <div>${mealsHtml}</div>
    </div>
  </div>`;
}

// ---------- WATER ----------
window.setWater = async function (index) {
  const mode = state.waterMode || "cups";
  if (!Array.isArray(state.waterIntake)) state.waterIntake = [];
  if (index >= state.waterIntake.length) return;
  if (mode === "cups") {
    state.waterIntake[index] = state.waterIntake[index] === 4 ? 0 : 4;
  } else {
    state.waterIntake[index] = (state.waterIntake[index] + 1) % 5;
  }
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};

// ---------- SLEEP ----------
window.logSleep = async function () {
  const hoursInput = document.getElementById("sleepHours");
  const qualitySelect = document.getElementById("sleepQuality");
  const hours = parseFloat(hoursInput?.value);
  const quality = parseFloat(qualitySelect?.value);
  if (isNaN(hours) || isNaN(quality)) return;
  if (hours < 0 || hours > 24) {
    alert("ساعت خواب باید بین ۰ تا ۲۴ باشد.");
    return;
  }
  const today = getTodayDateString();
  const idx = state.sleepLog.findIndex((s) => s.date === today);
  const entry = { date: today, hours, quality };
  if (idx >= 0) state.sleepLog[idx] = entry;
  else state.sleepLog.push(entry);
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};

// ---------- MEALS ----------
window.logMeal = async function () {
  const meal = document.getElementById("mealType")?.value;
  const notes = document.getElementById("mealNotes")?.value?.trim();
  if (!meal) return;
  state.nutritionLog.push({
    date: getTodayDateString(),
    meal,
    notes: notes || "",
  });
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};
