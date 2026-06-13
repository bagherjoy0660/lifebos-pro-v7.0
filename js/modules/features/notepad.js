// ================== NOTEPAD ==================
import { state, saveState } from "../core/state.js";

// ---------- MODAL ----------
function showNotepadModal(existingNote = null) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay.style.zIndex = "300";

    const isEdit = !!existingNote;
    const titleValue = existingNote?.title || "";
    const contentValue = existingNote?.content || "";
    const imageSrc = existingNote?.image || "";

    overlay.innerHTML = `
      <div class="settings-modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2>${isEdit ? "✏️ ویرایش یادداشت" : "📝 یادداشت جدید"}</h2>
          <button class="close-btn" id="closeNoteModal">✕</button>
        </div>
        <div class="modal-body">
          <input type="text" id="noteTitle" placeholder="عنوان یادداشت" value="${titleValue.replace(/"/g, "&quot;")}" style="margin-bottom:12px;">
          <textarea id="noteContent" placeholder="متن یادداشت را اینجا بنویسید..." style="min-height:120px; margin-bottom:12px;">${contentValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
          <div style="margin-bottom:8px;">
            <label class="upload-btn" style="display:inline-block; cursor:pointer;">
              📷 ${imageSrc ? "تغییر تصویر" : "افزودن تصویر"}
              <input type="file" id="noteImageInput" accept="image/*" style="display:none;">
            </label>
            ${imageSrc ? '<button class="small danger" id="removeImageBtn" style="margin-left:8px;">🗑️ حذف تصویر</button>' : ""}
          </div>
          <div id="noteImagePreview" style="margin-top:8px;">
            ${imageSrc ? `<img src="${imageSrc}" style="max-width:100%; max-height:150px; border-radius:8px;">` : ""}
          </div>
          <div style="display:flex; gap:8px; margin-top:16px;">
            <button class="primary" id="saveNoteBtn" style="flex:1;">💾 ذخیره</button>
            <button id="cancelNoteBtn" style="flex:1;">لغو</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => {
      overlay.remove();
      resolve(null);
    };

    overlay.querySelector("#closeNoteModal").onclick = closeModal;
    overlay.querySelector("#cancelNoteBtn").onclick = closeModal;

    let selectedImageData = existingNote?.image || null;

    const imageInput = overlay.querySelector("#noteImageInput");
    imageInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        selectedImageData = ev.target.result;
        const preview = overlay.querySelector("#noteImagePreview");
        preview.innerHTML = `<img src="${selectedImageData}" style="max-width:100%; max-height:150px; border-radius:8px;">`;
        if (!overlay.querySelector("#removeImageBtn")) {
          const removeBtn = document.createElement("button");
          removeBtn.className = "small danger";
          removeBtn.id = "removeImageBtn";
          removeBtn.style.marginLeft = "8px";
          removeBtn.textContent = "🗑️ حذف تصویر";
          removeBtn.onclick = () => {
            selectedImageData = null;
            preview.innerHTML = "";
            removeBtn.remove();
            imageInput.value = "";
          };
          imageInput.parentElement.after(removeBtn);
        }
      };
      reader.readAsDataURL(file);
    };

    const removeBtn = overlay.querySelector("#removeImageBtn");
    if (removeBtn) {
      removeBtn.onclick = () => {
        selectedImageData = null;
        overlay.querySelector("#noteImagePreview").innerHTML = "";
        removeBtn.remove();
        imageInput.value = "";
      };
    }

    overlay.querySelector("#saveNoteBtn").onclick = () => {
      const title = overlay.querySelector("#noteTitle").value.trim();
      if (!title) {
        alert("عنوان نمی‌تواند خالی باشد.");
        return;
      }
      const content = overlay.querySelector("#noteContent").value.trim();
      resolve({ title, content, image: selectedImageData });
      overlay.remove();
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
  });
}

// ---------- RENDER ----------
export function renderNotepad(container) {
  let html = `<div class="card fade-in"><div style="display:flex;justify-content:space-between;"><h2>📝 یادداشت‌ها</h2><button class="primary" onclick="addNote()">+ جدید</button></div><div style="margin-top:20px;">`;
  if (state.notesList.length === 0) {
    html +=
      '<p style="color:var(--text3); text-align:center;">هنوز یادداشتی نداری.</p>';
  } else {
    state.notesList.forEach((note) => {
      html += `<div class="card" style="margin-bottom:16px; background:var(--surface2);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${note.title}</strong>
          <small style="color:var(--text3);">${note.date}</small>
        </div>
        <p style="margin-top:8px; white-space:pre-wrap;">${note.content}</p>
        ${note.image ? `<img src="${note.image}" class="note-image" style="max-width:100%; max-height:200px; border-radius:8px; margin-top:8px;" alt="تصویر یادداشت">` : ""}
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="small" onclick="editNote(${note.id})">✏️ ویرایش</button>
          <button class="small danger" onclick="deleteNote(${note.id})">🗑️ حذف</button>
        </div>
      </div>`;
    });
  }
  html += `</div></div>`;
  container.innerHTML = html;
}

// ---------- GLOBAL HANDLERS ----------
window.addNote = async function () {
  const result = await showNotepadModal();
  if (!result) return;
  state.notesList.push({
    id: Date.now(),
    title: result.title,
    content: result.content,
    image: result.image,
    date: new Date().toLocaleDateString("fa-IR"),
  });
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.editNote = async function (id) {
  const note = state.notesList.find((n) => n.id === id);
  if (!note) return;
  const result = await showNotepadModal(note);
  if (!result) return;
  note.title = result.title;
  note.content = result.content;
  note.image = result.image;
  await saveState();
  if (typeof window.render === "function") await window.render();
};

window.deleteNote = async function (id) {
  if (!confirm("حذف این یادداشت؟")) return;
  state.notesList = state.notesList.filter((n) => n.id !== id);
  await saveState();
  if (typeof window.render === "function") await window.render();
};
