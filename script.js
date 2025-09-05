let lists = {};
let currentList = null;
let currentSteps = [];
let usedSteps = [];
let isPlaying = false;
let timer = null;
let speed = 1.0;
let volume = 1.0;

const synth = window.speechSynthesis;

function renderLists() {
  const select = document.getElementById("listSelect");
  select.innerHTML = "";
  Object.keys(lists).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (name === currentList) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderSteps() {
  const ul = document.getElementById("stepsList");
  ul.innerHTML = "";
  if (!currentList) return;
  lists[currentList].forEach((step, idx) => {
    const li = document.createElement("li");
    li.textContent = step.name + " (" + step.times + ")";
    const ctrls = document.createElement("span");
    ctrls.className = "step-controls";
    ["⬆","⬇","❌"].forEach(symbol => {
      const btn = document.createElement("button");
      btn.textContent = symbol;
      btn.className = "step-btn";
      btn.onclick = () => {
        if (symbol==="⬆" && idx>0) {
          const tmp = lists[currentList][idx-1];
          lists[currentList][idx-1] = lists[currentList][idx];
          lists[currentList][idx] = tmp;
        } else if (symbol==="⬇" && idx<lists[currentList].length-1) {
          const tmp = lists[currentList][idx+1];
          lists[currentList][idx+1] = lists[currentList][idx];
          lists[currentList][idx] = tmp;
        } else if (symbol==="❌") {
          lists[currentList].splice(idx,1);
        }
        renderSteps();
      };
      ctrls.appendChild(btn);
    });
    li.appendChild(ctrls);
    ul.appendChild(li);
  });
}

function say(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.volume = volume;
  synth.speak(utter);
}

function showStep(step) {
  const div = document.getElementById("currentStep");
  div.textContent = step.name;
  say(step.name);
}

function nextStep() {
  if (!isPlaying) return;
  const mode = document.getElementById("modeSelect").value;
  if (mode === "normal") {
    if (currentSteps.length === 0) return stop();
    const step = currentSteps.shift();
    showStep(step);
    timer = setTimeout(nextStep, (step.times/speed)*1000);
  } else if (mode === "loop") {
    if (currentSteps.length === 0) currentSteps = [...usedSteps];
    const step = currentSteps.shift();
    showStep(step);
    timer = setTimeout(nextStep, (step.times/speed)*1000);
  } else if (mode === "random") {
    const steps = lists[currentList];
    const step = steps[Math.floor(Math.random()*steps.length)];
    showStep(step);
    timer = setTimeout(nextStep, (step.times/speed)*1000);
  } else if (mode === "choreo") {
    if (currentSteps.length === 0) return stop();
    const step = currentSteps.shift();
    showStep(step);
    timer = setTimeout(nextStep, (step.times/speed)*1000);
  } else if (mode === "choreoLoop") {
    if (currentSteps.length === 0) currentSteps = [...usedSteps];
    const step = currentSteps.shift();
    showStep(step);
    timer = setTimeout(nextStep, (step.times/speed)*1000);
  }
}

function start() {
  if (!currentList || isPlaying) return;
  isPlaying = true;
  usedSteps = [...lists[currentList]];
  currentSteps = [...lists[currentList]];
  nextStep();
}

function stop() {
  isPlaying = false;
  clearTimeout(timer);
}

function reset() {
  stop();
  document.getElementById("currentStep").textContent = "⏳ Listo";
}

document.getElementById("addListBtn").onclick = () => {
  const name = document.getElementById("listNameInput").value.trim();
  if (!name) return;
  lists[name] = [];
  currentList = name;
  renderLists();
  renderSteps();
};

document.getElementById("listSelect").onchange = (e) => {
  currentList = e.target.value;
  renderSteps();
};

document.getElementById("addStepBtn").onclick = () => {
  if (!currentList) return;
  const n = document.getElementById("nameInput").value.trim();
  const t = parseInt(document.getElementById("timeInput").value);
  if (!n || !t) return;
  lists[currentList].push({name:n, times:t});
  renderSteps();
};

document.getElementById("startBtn").onclick = start;
document.getElementById("stopBtn").onclick = stop;
document.getElementById("resetBtn").onclick = reset;

document.getElementById("speedRange").oninput = e => {
  speed = parseFloat(e.target.value);
  document.getElementById("speedInput").value = speed.toFixed(2);
};
document.getElementById("speedInput").oninput = e => {
  speed = parseFloat(e.target.value);
  document.getElementById("speedRange").value = speed;
};
document.getElementById("volumeRange").oninput = e => {
  volume = parseFloat(e.target.value);
};

document.getElementById("saveBtn").onclick = () => {
  if (!currentList) return;
  localStorage.setItem("lists", JSON.stringify(lists));
  localStorage.setItem("lastList", currentList);
};

// Cargar listas guardadas
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lists");
  if (saved) lists = JSON.parse(saved);
  const last = localStorage.getItem("lastList");
  if (last && lists[last]) currentList = last;
  renderLists();
  renderSteps();
});

// Importar CSV
document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file || !currentList) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const lines = evt.target.result.split(/\r?\n/);
    lists[currentList] = lines.filter(l=>l.trim()).map(line => {
      const [name,times] = line.split(",");
      return {name:name.replace(/"/g,""), times:parseInt(times)};
    });
    renderSteps();
  };
  reader.readAsText(file);
});

// Exportar CSV
document.getElementById("exportBtn").onclick = () => {
  if (!currentList) return;
  const content = lists[currentList].map(s=>`"${s.name}",${s.times}`).join("\n");
  const blob = new Blob([content], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = currentList + ".csv";
  a.click();
  URL.revokeObjectURL(url);
};
