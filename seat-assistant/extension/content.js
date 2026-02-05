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
  `;

  document.body.appendChild(panel);

  document.getElementById("scanBtn").onclick = () => {
    const seats = window.extractSeats
      ? window.extractSeats()
      : [];
    document.getElementById("status").innerText =
      "Found " + seats.length + " seats";
  };
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
