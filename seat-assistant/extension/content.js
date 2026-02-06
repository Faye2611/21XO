// ---------- loader ----------
function loadScript(path) {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL(path);
  s.onload = () => console.log("Loaded", path);
  document.head.appendChild(s);
}

// Load logic
loadScript("logic/extractSeats.js");
loadScript("logic/rankSeats.js");
loadScript("logic/selectSeat.js");

// Load voice
loadScript("voice/speech.js");
loadScript("voice/voice.js");

// ---------- panel ----------
async function injectPanel() {
  if (document.getElementById("seat-assistant")) return;

  const res = await fetch(chrome.runtime.getURL("extension/assistantPanel.html"));
  const html = await res.text();

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  wirePanel();
}

function togglePanel() {
  const panel = document.getElementById("seat-assistant");
  if (!panel) return;
  panel.classList.toggle("active");
}

// ---------- keyboard shortcut ----------
document.addEventListener("keydown", e => {
  if (e.altKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
    injectPanel();
    togglePanel();
  }
});

// ---------- wire panel buttons ----------
function wirePanel() {
  const scanBtn = document.getElementById("scan-btn");
  const micBtn = document.getElementById("listen-btn");
  const recBtn = document.getElementById("recommend-btn");

  scanBtn.onclick = () => {
    const seats = window.extractSeats();
    announce(`Found ${seats.length} seats`);
  };

  micBtn.onclick = () => {
    window.startListening(); // starts voice capture
  };

  recBtn.onclick = () => {
    const seats = window.extractSeats();
    const top = window.rankSeats(seats, window.currentWeights || {});
    renderResults(top);
  };
}

// ---------- helpers ----------
function announce(msg) {
  const status = document.getElementById("assistant-status");
  status.textContent = msg;
  console.log("Assistant:", msg);
}

function renderResults(seats) {
  const resultEls = document.querySelectorAll(".result");
  seats.slice(0, 3).forEach((seat, i) => {
    if (!resultEls[i]) return;
    resultEls[i].textContent =
      `Option ${i + 1} — Section ${seat.section}, Row ${seat.row}, Seat ${seat.seat}`;
  });
}

// ---------- voice callback ----------
window.onVoiceResult = function(res) {
  if (res.command?.type === "select") {
    window.selectSeat(res.command.index); // selectSeat comes from logic/selectSeat.js
  }
  if (res.weights) {
    window.currentWeights = res.weights;
  }
  if (res.assistantText) {
    announce(res.assistantText);
  }
};

// ---------- inject launcher button ----------
function injectLauncher() {
  if (document.getElementById("seat-launcher")) return;

  const btn = document.createElement("button");
  btn.id = "seat-launcher";
  btn.innerText = "Voice Assistant";
  btn.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 10px 16px;
    font-size: 14px;
  `;
  btn.onclick = () => {
    injectPanel();
    togglePanel();
  };
  document.body.appendChild(btn);
}

injectLauncher();
