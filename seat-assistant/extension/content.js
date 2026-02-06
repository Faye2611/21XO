let panelOpen = false;

function injectPanel() {
  if (document.getElementById("seat-assistant")) return;

  const panel = document.createElement("div");
  panel.id = "seat-assistant";
  panel.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 300px;
    height: 200px;
    background: white;
    border: 1px solid black;
    z-index: 999999;
    padding: 10px;
  `;

  panel.innerHTML = `
    <h3>Seat Assistant</h3>
    <div id="status">Ready</div>
    <button id="scanBtn">Scan Seats</button>
    <button id="micBtn">Start Listening</button>
    <div id="transcript"></div>
  `;


  document.body.appendChild(panel);

  document.getElementById("scanBtn").onclick = () => {
    const seats = window.extractSeats
      ? window.extractSeats()
      : [];
    document.getElementById("status").innerText =
      "Found " + seats.length + " seats";
  };

  document.getElementById("micBtn").onclick = startListening;

}



function togglePanel() {
  const panel = document.getElementById("seat-assistant");
  if (panel) {
    panel.remove();
    panelOpen = false;
  } else {
    injectPanel();
    panelOpen = true;
  }
}

document.addEventListener("keydown", e => {
  if (e.altKey && e.key === "s") {
    togglePanel();
  }
});

// TEMP STUB
window.extractSeats = () => [];

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

  btn.onclick = togglePanel;
  document.body.appendChild(btn);
}

injectLauncher();

let recognition;

function startListening() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  document.getElementById("status").innerText = "Listening...";

  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    document.getElementById("transcript").innerText = text;
    document.getElementById("status").innerText = "Heard";
  };
}
