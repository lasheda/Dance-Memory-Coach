// --- Estado ---
let lists = [];            // {id, name, steps:[{name, tiempos}]}
let usedSteps = [];
let running = false;
let ttsVolume = 1;
let unsavedChanges = false;

// --- Utilidades ---
const genId = () => (crypto.randomUUID ? crypto.randomUUID() : ('id-' + Date.now() + '-' + Math.random().toString(36).slice(2)));

const $ = (sel) => document.querySelector(sel);
const listNameInput = $("#listNameInput");
const addListBtn = $("#addListBtn");
const listSelect = $("#listSelect");
const nameInput = $("#nameInput");
const timeInput = $("#timeInput");
const addStepBtn = $("#addStepBtn");
const stepsList = $("#stepsList");
const startBtn = $("#startBtn");
const stopBtn = $("#stopBtn");
const resetBtn = $("#resetBtn");
const saveBtn = $("#saveBtn");
const exportBtn = $("#exportBtn");
const importFile = $("#importFile");
const currentStep = $("#currentStep");
const speedInput = $("#speedInput");
const speedRange = $("#speedRange");
const modeSelect = $("#modeSelect");
const volumeRange = $("#volumeRange");
const toastEl = $("#toast");

const showToast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(()=>toastEl.classList.remove("show"), 1800);
};

// --- Persistencia ---
function saveState() {
  try {
    localStorage.setItem("dmc_lists", JSON.stringify(lists));
    const listId = listSelect.value || "";
    localStorage.setItem("dmc_lastListId", listId);
    unsavedChanges = false;
    showToast("✅ Cambios guardados");
  } catch (e) {
    console.error("Error guardando:", e);
  }
}

function markDirty() {
  unsavedChanges = true;
  // Guardado de seguridad inmediato (autosave) para no perder datos en móviles
  try {
    localStorage.setItem("dmc_lists", JSON.stringify(lists));
    if (listSelect.value) localStorage.setItem("dmc_lastListId", listSelect.value);
  } catch(e){}
}

function loadState() {
  try {
    const savedLists = localStorage.getItem("dmc_lists");
    if (savedLists) {
      lists = JSON.parse(savedLists);
    }
    renderLists();
    const lastId = localStorage.getItem("dmc_lastListId");
    if (lastId) {
      const exists = lists.find(l => String(l.id) === String(lastId));
      if (exists) {
        listSelect.value = String(lastId);
        renderSteps();
        return;
      }
    }
    // Si no hay lastId o no existe, seleccionar primera lista si la hay
    if (lists.length > 0) {
      listSelect.value = String(lists[0].id);
      renderSteps();
    }
  } catch (e) {
    console.error("Error cargando:", e);
  }
}

// Guardar/confirmar al salir
window.addEventListener("beforeunload", (e) => {
  if (unsavedChanges) {
    saveState(); // guardado preventivo
    e.preventDefault();
    e.returnValue = "¿Quieres guardar los cambios efectuados en la última lista?";
    return e.returnValue;
  }
});
// En móviles, pagehide es más fiable
window.addEventListener("pagehide", () => {
  if (unsavedChanges) saveState();
});

// --- Listas ---
addListBtn.addEventListener("click", () => {
  const name = (listNameInput.value || "").trim();
  if (!name) return alert("Pon un nombre de lista");
  const id = genId();
  lists.push({ id, name, steps: [] });
  listNameInput.value = "";
  renderLists();
  listSelect.value = String(id);
  renderSteps();
  markDirty();
});

function renderLists() {
  listSelect.innerHTML = "";
  lists.forEach((list) => {
    const opt = document.createElement("option");
    opt.value = String(list.id);
    opt.textContent = list.name;
    listSelect.appendChild(opt);
  });
}

listSelect.addEventListener("change", () => {
  renderSteps();
  markDirty();
});

// --- Pasos ---
addStepBtn.addEventListener("click", () => {
  if (!listSelect.value) return alert("Primero crea/selecciona una lista");
  const stepName = (nameInput.value || "").trim();
  const tiempos = parseInt(timeInput.value);
  if (!stepName || isNaN(tiempos) || tiempos <= 0) return alert("Completa nombre y tiempos (>0)");

  const list = lists.find(l => String(l.id) === String(listSelect.value));
  list.steps.push({ name: stepName, tiempos });
  nameInput.value = "";
  timeInput.value = "";
  renderSteps();
  markDirty();
});

function renderSteps() {
  stepsList.innerHTML = "";
  if (!listSelect.value) return;
  const list = lists.find(l => String(l.id) === String(listSelect.value));
  (list.steps || []).forEach((step, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${step.name} <small style="color:#bbb">(${step.tiempos} tiempos)</small></span>`;

    const controls = document.createElement("span");
    controls.className = "step-controls";

    const upBtn = document.createElement("button");
    upBtn.textContent = "⬆";
    upBtn.className = "step-btn";
    upBtn.title = "Subir";
    upBtn.addEventListener("click", () => {
      if (i>0){ [list.steps[i-1], list.steps[i]] = [list.steps[i], list.steps[i-1]]; renderSteps(); markDirty(); }
    });

    const downBtn = document.createElement("button");
    downBtn.textContent = "⬇";
    downBtn.className = "step-btn";
    downBtn.title = "Bajar";
    downBtn.addEventListener("click", () => {
      if (i<list.steps.length-1){ [list.steps[i+1], list.steps[i]] = [list.steps[i], list.steps[i+1]]; renderSteps(); markDirty(); }
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏";
    editBtn.className = "step-btn";
    editBtn.title = "Editar";
    editBtn.addEventListener("click", () => {
      const newName = prompt("Nuevo nombre:", step.name);
      if (newName === null) return;
      const newT = prompt("Nuevos tiempos:", step.tiempos);
      if (newT === null) return;
      const newTiempos = parseInt(newT);
      if ((newName || "").trim() && !isNaN(newTiempos) && newTiempos>0) {
        list.steps[i] = { name: newName.trim(), tiempos: newTiempos };
        renderSteps(); markDirty();
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.className = "step-btn";
    deleteBtn.title = "Borrar";
    deleteBtn.addEventListener("click", () => {
      list.steps.splice(i,1);
      renderSteps(); markDirty();
    });

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);
    li.appendChild(controls);
    stepsList.appendChild(li);
  });
}

// --- Guardar / Importar / Exportar ---
saveBtn.addEventListener("click", saveState);

exportBtn.addEventListener("click", () => {
  let csv = "Lista,Nombre,Tiempos\n";
  lists.forEach(list => {
    (list.steps||[]).forEach(step => {
      // Escapar comas con comillas si fuera necesario
      const listName = list.name.includes(",") ? `"${list.name}"` : list.name;
      const stepName = step.name.includes(",") ? `"${step.name}"` : step.name;
      csv += `${listName},${stepName},${step.tiempos}\n`;
    });
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "listas.csv"; a.click();
  URL.revokeObjectURL(url);
});

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const lines = text.replace(/\\r/g,'').trim().split("\\n");
    // Reiniciar listas
    lists = [];
    const map = new Map(); // nombreLista -> {id, name, steps}
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      // CSV sencillo (no comillas anidadas)
      const parts = line.split(",");
      const listName = (parts[0]||"").replace(/^"|"$/g,"");
      const stepName = (parts[1]||"").replace(/^"|"$/g,"");
      const tiempos = parseInt((parts[2]||"").trim());
      if (!listName) continue;
      if (!map.has(listName)) {
        map.set(listName, { id: genId(), name: listName, steps: [] });
      }
      if (stepName && !isNaN(tiempos)) {
        map.get(listName).steps.push({ name: stepName, tiempos });
      }
    }
    lists = Array.from(map.values());
    renderLists();
    // Seleccionar la primera lista importada
    if (lists.length>0){
      listSelect.value = String(lists[0].id);
      renderSteps();
    }
    markDirty();
    showToast("📥 Listas importadas");
  };
  reader.readAsText(file);
});

// --- Randomizer + Voz ---
function sayText(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.volume = ttsVolume; // 0..1 (no puede superar el volumen del sistema)
    speechSynthesis.cancel(); // evita solaparse
    speechSynthesis.speak(utterance);
  }
}

function clampSpeed(val){
  let n = parseFloat(val);
  if (isNaN(n) || n <= 0) n = 0.01; // evitar 0 => división por cero
  if (n > 10) n = 10;
  return parseFloat(n.toFixed(2));
}

// sincronía slider/number
speedRange.addEventListener("input", () => {
  const v = clampSpeed(speedRange.value);
  speedInput.value = v.toFixed(2);
});
speedInput.addEventListener("input", () => {
  const v = clampSpeed(speedInput.value);
  speedInput.value = v.toFixed(2);
  speedRange.value = v;
});

volumeRange.addEventListener("input", (e) => {
  const v = parseFloat(e.target.value);
  ttsVolume = isNaN(v)?1:Math.max(0, Math.min(1, v));
});

async function startRandomizer() {
  if (!listSelect.value) return alert("Selecciona una lista");
  const list = lists.find(l => String(l.id) === String(listSelect.value));
  if (!list || list.steps.length === 0) return alert("La lista está vacía");

  const mode = modeSelect.value;
  if ((mode === "normal" || mode === "loop") && usedSteps.length === 0) {
    usedSteps = [...list.steps];
  }

  running = true;
  while (running) {
    let step;
    if (mode === "normal" || mode === "loop") {
      if (usedSteps.length === 0) {
        if (mode === "loop") {
          usedSteps = [...list.steps];
        } else {
          currentStep.textContent = "✅ Lista completada";
          break;
        }
      }
      const idx = Math.floor(Math.random() * usedSteps.length);
      step = usedSteps.splice(idx, 1)[0];
    } else { // total random
      const idx = Math.floor(Math.random() * list.steps.length);
      step = list.steps[idx];
    }

    const speed = clampSpeed(speedInput.value);
    const durationSec = step.tiempos / speed; // p.ej. 8 tiempos, 0.5x => 16s
    currentStep.textContent = step.name;
    sayText(step.name);
    await new Promise(res => setTimeout(res, durationSec * 1000));
  }
  running = false;
}

function stopRandomizer(){
  running = false;
  currentStep.textContent = "⏸ Pausado";
}

function resetRandomizer(){
  usedSteps = [];
  currentStep.textContent = "🔄 Reset";
}

// --- Eventos control ---
startBtn.addEventListener("click", () => { if (!running) startRandomizer(); });
stopBtn.addEventListener("click", stopRandomizer);
resetBtn.addEventListener("click", resetRandomizer);

// --- Restaurar al cargar ---
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  // Inicializar velocidades al valor guardado si existiera
  const v = clampSpeed(speedInput.value);
  speedInput.value = v.toFixed(2);
  speedRange.value = v;
});

// --- Orientación ---
// Permitir libre orientación; si el navegador lo soporta, desbloquea
if (screen.orientation && screen.orientation.unlock) {
  try { screen.orientation.unlock(); } catch(e){}
}
window.addEventListener("orientationchange", () => {
  // Aquí podríamos reacomodar UI si hace falta; CSS ya gestiona landscape
});
