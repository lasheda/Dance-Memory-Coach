let lists = [];
let usedSteps = [];
let running = false;
let lastListIndex = 0;

const listNameInput = document.getElementById("listNameInput");
const addListBtn = document.getElementById("addListBtn");
const listSelect = document.getElementById("listSelect");
const nameInput = document.getElementById("nameInput");
const timeInput = document.getElementById("timeInput");
const addStepBtn = document.getElementById("addStepBtn");
const stepsList = document.getElementById("stepsList");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const currentStep = document.getElementById("currentStep");
const speedInput = document.getElementById("speedInput");
const speedSlider = document.getElementById("speedSlider");
const volumeSlider = document.getElementById("volumeSlider");
const modeSelect = document.getElementById("modeSelect");

addListBtn.addEventListener("click", () => {
  const name = listNameInput.value.trim();
  if (!name) return alert("Nombre inválido");
  lists.push({ name, steps: [] });
  listNameInput.value = "";
  renderLists();
  listSelect.value = String(lists.length - 1);
  saveToLocal();
});

function renderLists() {
  listSelect.innerHTML = "";
  lists.forEach((list, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = list.name;
    listSelect.appendChild(opt);
  });
  if (lists.length) {
    if (listSelect.value === "" || !lists[listSelect.value]) listSelect.value = String(lastListIndex || 0);
  }
  renderSteps();
}

listSelect.addEventListener("change", () => {
  lastListIndex = parseInt(listSelect.value || "0", 10);
  renderSteps();
});

addStepBtn.addEventListener("click", () => {
  if (listSelect.value === "") return alert("Selecciona una lista");
  const stepName = nameInput.value.trim();
  const tiempos = parseInt(timeInput.value, 10);
  if (!stepName || isNaN(tiempos) || tiempos <= 0) return alert("Datos inválidos");

  const listIndex = parseInt(listSelect.value, 10);
  lists[listIndex].steps.push({ name: stepName, tiempos });
  nameInput.value = "";
  timeInput.value = "";
  renderSteps();
});

function renderSteps() {
  stepsList.innerHTML = "";
  if (listSelect.value === "" || !lists.length) return;
  const listIndex = parseInt(listSelect.value, 10);
  const steps = lists[listIndex].steps;

  steps.forEach((step, i) => {
    const li = document.createElement("li");

    const nameWrap = document.createElement("div");
    const nameSpan = document.createElement("span");
    nameSpan.className = "step-name";
    nameSpan.textContent = step.name;
    const timeSpan = document.createElement("span");
    timeSpan.className = "step-time";
    timeSpan.textContent = `(${step.tiempos})`;
    nameWrap.appendChild(nameSpan);
    nameWrap.appendChild(timeSpan);

    const controls = document.createElement("span");
    controls.className = "step-controls";

    const upBtn = document.createElement("button");
    upBtn.textContent = "⬆";
    upBtn.addEventListener("click", () => {
      if (i > 0) {
        [steps[i-1], steps[i]] = [steps[i], steps[i-1]];
        renderSteps();
      }
    });

    const downBtn = document.createElement("button");
    downBtn.textContent = "⬇";
    downBtn.addEventListener("click", () => {
      if (i < steps.length - 1) {
        [steps[i+1], steps[i]] = [steps[i], steps[i+1]];
        renderSteps();
      }
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏";
    editBtn.addEventListener("click", () => {
      const newName = prompt("Nuevo nombre:", step.name);
      const newTiempos = parseInt(prompt("Nuevos tiempos:", step.tiempos), 10);
      if (newName && !isNaN(newTiempos) && newTiempos > 0) {
        lists[listIndex].steps[i] = { name: newName, tiempos: newTiempos };
        renderSteps();
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.addEventListener("click", () => {
      lists[listIndex].steps.splice(i, 1);
      renderSteps();
    });

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(nameWrap);
    li.appendChild(controls);
    stepsList.appendChild(li);
  });
}

saveBtn.addEventListener("click", () => {
  saveToLocal();
  currentStep.textContent = "💾 Cambios guardados";
});

function saveToLocal() {
  localStorage.setItem("dmc_lists", JSON.stringify(lists));
  localStorage.setItem("dmc_last_index", listSelect.value || "0");
}

window.addEventListener("load", () => {
  try {
    const saved = localStorage.getItem("dmc_lists");
    const idx = localStorage.getItem("dmc_last_index");
    if (saved) {
      lists = JSON.parse(saved);
    }
    if (idx !== null) lastListIndex = parseInt(idx, 10) || 0;
    renderLists();
    if (lists.length && listSelect.options[lastListIndex]) {
      listSelect.value = String(lastListIndex);
      renderSteps();
      currentStep.textContent = "📂 Última lista cargada";
    }
  } catch(e) {
    console.error(e);
  }
});

exportBtn.addEventListener("click", () => {
  let csv = "Lista,Nombre,Tiempos\n";
  lists.forEach(list => {
    list.steps.forEach(step => {
      csv += `${escapeCSV(list.name)},${escapeCSV(step.name)},${step.tiempos}\n`;
    });
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "listas.csv";
  a.click();
  URL.revokeObjectURL(url);
});

function escapeCSV(text){
  if (text == null) return "";
  const needsQuotes = /[",\n]/.test(text);
  let t = String(text).replace(/"/g,'""');
  return needsQuotes ? `"${t}"` : t;
}

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    parseCSV(text);
    renderLists();
    currentStep.textContent = "📂 Listas importadas";
  };
  reader.readAsText(file);
  // limpiar para permitir volver a abrir el mismo archivo
  e.target.value = "";
});

function parseCSV(text){
  const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(Boolean);
  const header = lines.shift();
  lists = [];
  lines.forEach(line => {
    const cols = splitCSV(line);
    if (cols.length < 3) return;
    const [listName, stepName, tiemposStr] = cols;
    const tiempos = parseInt(tiemposStr, 10);
    if (!listName) return;
    let list = lists.find(l => l.name === listName);
    if (!list) {
      list = { name: listName, steps: [] };
      lists.push(list);
    }
    if (stepName && !isNaN(tiempos) && tiempos > 0) {
      list.steps.push({ name: stepName, tiempos });
    }
  });
  // seleccionar la primera lista si hay
  lastListIndex = 0;
}

function splitCSV(line){
  const out=[]; let cur=""; let inQ=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if (inQ){
      if (ch === '"'){
        if (line[i+1] === '"'){ cur+='"'; i++; }
        else { inQ=false; }
      } else cur+=ch;
    } else {
      if (ch === ','){ out.push(cur); cur=""; }
      else if (ch === '"'){ inQ=true; }
      else cur+=ch;
    }
  }
  out.push(cur);
  return out;
}

startBtn.addEventListener("click", () => { if (!running) startRandomizer(); });
stopBtn.addEventListener("click", () => { running = false; currentStep.textContent = "⏸ Pausado"; });
resetBtn.addEventListener("click", () => { running = false; usedSteps = []; currentStep.textContent = "🔄 Reset"; });

speedInput.addEventListener("input", () => speedSlider.value = speedInput.value);
speedSlider.addEventListener("input", () => speedInput.value = speedSlider.value);

async function startRandomizer() {
  if (listSelect.value === "" || !lists.length) return alert("Selecciona una lista");
  const listIndex = parseInt(listSelect.value, 10);
  if (!lists[listIndex] || lists[listIndex].steps.length === 0) return alert("La lista está vacía");

  const mode = modeSelect.value;
  if (mode === "normal" || mode === "loop") {
    if (usedSteps.length === 0) usedSteps = [...lists[listIndex].steps];
  } else if (mode === "choreo" || mode === "choreoLoop") {
    usedSteps = usedSteps.length ? usedSteps : [...lists[listIndex].steps];
  }

  running = true;
  while (running) {
    let step;
    if (mode === "normal" || mode === "loop") {
      if (usedSteps.length === 0) {
        if (mode === "loop") usedSteps = [...lists[listIndex].steps];
        else { currentStep.textContent = "✅ Lista completada"; break; }
      }
      const stepIndex = Math.floor(Math.random() * usedSteps.length);
      step = usedSteps.splice(stepIndex, 1)[0];
    } else if (mode === "random") {
      const stepIndex = Math.floor(Math.random() * lists[listIndex].steps.length);
      step = lists[listIndex].steps[stepIndex];
    } else if (mode === "choreo" || mode === "choreoLoop") {
      if (usedSteps.length === 0) {
        if (mode === "choreoLoop") usedSteps = [...lists[listIndex].steps];
        else { currentStep.textContent = "✅ Coreografía completada"; break; }
      }
      step = usedSteps.shift();
    }

    const speed = Math.max(0.01, parseFloat(speedInput.value));
    const duration = step.tiempos / speed; // p.e. 8 tiempos @ 0.5 => 16s ; @ 2.0 => 4s

    currentStep.textContent = step.name;
    sayText(step.name);
    await new Promise(res => setTimeout(res, duration * 1000));
  }
  running = false;
}

function sayText(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-ES";
  utter.rate = 1; // velocidad de habla natural
  utter.volume = parseFloat(volumeSlider.value);
  // Cancelar cualquier cola previa para pronunciar solo el actual
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
