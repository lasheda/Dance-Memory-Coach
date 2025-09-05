let lists = [];
let usedSteps = [];
let running = false;
let volume = 1.0;

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
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const saveBtn = document.getElementById("saveBtn");
const currentStep = document.getElementById("currentStep");
const speedInput = document.getElementById("speedInput");
const speedRange = document.getElementById("speedRange");
const modeSelect = document.getElementById("modeSelect");
const volumeRange = document.getElementById("volumeRange");

addListBtn.addEventListener("click", () => {
  const name = listNameInput.value.trim();
  if (!name) return alert("Nombre inválido");
  lists.push({ name, steps: [] });
  listNameInput.value = "";
  renderLists();
});

function renderLists() {
  listSelect.innerHTML = "";
  lists.forEach((list, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = list.name;
    listSelect.appendChild(opt);
  });
  renderSteps();
}

listSelect.addEventListener("change", renderSteps);

addStepBtn.addEventListener("click", () => {
  if (listSelect.value === "") return alert("Selecciona una lista");
  const stepName = nameInput.value.trim();
  const tiempos = parseInt(timeInput.value);
  if (!stepName || isNaN(tiempos)) return alert("Datos inválidos");

  const listIndex = parseInt(listSelect.value);
  lists[listIndex].steps.push({ name: stepName, tiempos });
  nameInput.value = "";
  timeInput.value = "";
  renderSteps();
});

function renderSteps() {
  stepsList.innerHTML = "";
  if (listSelect.value === "") return;
  const listIndex = parseInt(listSelect.value);
  const steps = lists[listIndex].steps;

  steps.forEach((step, i) => {
    const li = document.createElement("li");
    li.textContent = `${step.name} (${step.tiempos} tiempos)`;

    const controls = document.createElement("span");
    controls.className = "step-controls";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏";
    editBtn.className = "step-btn";
    editBtn.addEventListener("click", () => {
      const newName = prompt("Nuevo nombre:", step.name);
      const newTiempos = parseInt(prompt("Nuevos tiempos:", step.tiempos));
      if (newName && !isNaN(newTiempos)) {
        lists[listIndex].steps[i] = { name: newName, tiempos: newTiempos };
        renderSteps();
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.className = "step-btn";
    deleteBtn.addEventListener("click", () => {
      lists[listIndex].steps.splice(i, 1);
      renderSteps();
    });

    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);
    li.appendChild(controls);
    stepsList.appendChild(li);
  });
}

startBtn.addEventListener("click", () => {
  if (!running) {
    startRandomizer();
  }
});

stopBtn.addEventListener("click", () => {
  running = false;
  currentStep.textContent = "⏸ Pausado";
});

resetBtn.addEventListener("click", () => {
  running = false;
  usedSteps = [];
  currentStep.textContent = "🔄 Reiniciado";
});

exportBtn.addEventListener("click", () => {
  let csv = "Lista,Nombre,Tiempos\n";
  lists.forEach(list => {
    list.steps.forEach(step => {
      csv += `${list.name},${step.name},${step.tiempos}\n`;
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

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const lines = text.trim().split("\n");
    lists = [];
    lines.slice(1).forEach(line => {
      const [listName, stepName, tiempos] = line.split(",");
      let list = lists.find(l => l.name === listName);
      if (!list) {
        list = { name: listName, steps: [] };
        lists.push(list);
      }
      list.steps.push({ name: stepName, tiempos: parseInt(tiempos) });
    });
    renderLists();
    currentStep.textContent = "📂 Listas importadas";
  };
  reader.readAsText(file);
});

saveBtn.addEventListener("click", () => {
  localStorage.setItem("danceMemoryLists", JSON.stringify(lists));
  localStorage.setItem("lastListIndex", listSelect.value);
  currentStep.textContent = "💾 Guardado en memoria local";
});

window.addEventListener("load", () => {
  const saved = localStorage.getItem("danceMemoryLists");
  const lastIndex = localStorage.getItem("lastListIndex");
  if (saved) {
    lists = JSON.parse(saved);
    renderLists();
    if (lastIndex && listSelect.options[lastIndex]) {
      listSelect.value = lastIndex;
      renderSteps();
    }
  }
});

speedInput.addEventListener("input", () => {
  speedRange.value = speedInput.value;
});
speedRange.addEventListener("input", () => {
  speedInput.value = speedRange.value;
});

volumeRange.addEventListener("input", () => {
  volume = parseFloat(volumeRange.value);
});

async function startRandomizer() {
  if (listSelect.value === "") return alert("Selecciona una lista");
  const listIndex = parseInt(listSelect.value);
  if (lists[listIndex].steps.length === 0) return alert("La lista está vacía");

  const mode = modeSelect.value;
  if (mode === "normal" || mode === "loop") {
    if (usedSteps.length === 0) {
      usedSteps = [...lists[listIndex].steps];
    }
  } else if (mode === "choreo" || mode === "choreoLoop") {
    usedSteps = [...lists[listIndex].steps];
  }

  running = true;
  while (running) {
    let step;
    if (mode === "normal" || mode === "loop") {
      if (usedSteps.length === 0) {
        if (mode === "loop") {
          usedSteps = [...lists[listIndex].steps];
        } else {
          currentStep.textContent = "✅ Lista completada";
          break;
        }
      }
      const stepIndex = Math.floor(Math.random() * usedSteps.length);
      step = usedSteps.splice(stepIndex, 1)[0];
    } else if (mode === "random") {
      const stepIndex = Math.floor(Math.random() * lists[listIndex].steps.length);
      step = lists[listIndex].steps[stepIndex];
    } else if (mode === "choreo" || mode === "choreoLoop") {
      if (usedSteps.length === 0) {
        if (mode === "choreoLoop") {
          usedSteps = [...lists[listIndex].steps];
        } else {
          currentStep.textContent = "✅ Coreografía completada";
          break;
        }
      }
      step = usedSteps.shift();
    }

    const speed = parseFloat(speedInput.value);
    const duration = step.tiempos * (1 / speed);

    currentStep.textContent = step.name;
    sayText(step.name);
    await new Promise(res => setTimeout(res, duration * 1000));
  }
  running = false;
}

function sayText(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.volume = volume;
    speechSynthesis.speak(utterance);
  }
}
