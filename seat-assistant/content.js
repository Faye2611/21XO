const isDemoFolder = window.location.pathname.includes("/demo/");
const SCRIPT_BASE = isDemoFolder
  ? window.location.origin + window.location.pathname.replace(/\/demo\/.*$/, "")
  : window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "");

const paths = {
  logic: `${SCRIPT_BASE}/logic`,
  voice: `${SCRIPT_BASE}/voice`,
  panel: `${SCRIPT_BASE}/extension/assistantPanel.html`,
};

window.currentWeights = {
  distance: 0.25,
  centrality: 0.2,
  aisle: 0.2,
  price: 0.2,
  avoidObstructed: 0.15,
};
window.allSeats = [];
window.lastRecommendations = [];

function loadScript(path) {
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = path;
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

let speechQueue = [];
let isSpeaking = false;

function speak(text) {
  if (!window.speechSynthesis) return;

  speechQueue.push(text);

  if (!isSpeaking) {
    processSpeechQueue();
  }
}

function processSpeechQueue() {
  if (speechQueue.length === 0) {
    isSpeaking = false;
    return;
  }

  isSpeaking = true;
  const text = speechQueue.shift();
  const msg = new SpeechSynthesisUtterance(text);

  msg.onend = () => {
    processSpeechQueue();
  };

  msg.onerror = () => {
    processSpeechQueue();
  };

  window.speechSynthesis.speak(msg);
}

function updateUI(text) {
  const status = document.getElementById("assistant-status");
  const transcript = document.getElementById("transcript");
  if (status) status.textContent = text;
  if (transcript) {
    const line = document.createElement("div");
    line.className = "transcript-line assistant";
    line.textContent = `Assistant: ${text}`;
    transcript.appendChild(line);
    transcript.scrollTop = transcript.scrollHeight;
  }
}

function announce(text) {
  updateUI(text);
  const voiceToggle = document.getElementById("voice-toggle");
  if (!voiceToggle || voiceToggle.checked) {
    speak(text);
  }
}

function forceAnnounce(text) {
  updateUI(text);

  if (!window.speechSynthesis) return;

  speechQueue = [];
  window.speechSynthesis.cancel();
  isSpeaking = false;

  speak(text);
}

function injectStyles() {
  if (document.getElementById("assistant-css")) return;
  const style = document.createElement("style");
  style.id = "assistant-css";

  // Define font paths using your existing SCRIPT_BASE
  const fontRegular = `${SCRIPT_BASE}/font/OpenDyslexic-Regular.otf`;
  const fontBold = `${SCRIPT_BASE}/font/OpenDyslexic-Bold.otf`;

  style.textContent = `
    /* 0. Font Declarations */
    @font-face {
      font-family: "OpenDyslexic";
      src: url("${fontRegular}") format("opentype");
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: "OpenDyslexic";
      src: url("${fontBold}") format("opentype");
      font-weight: 700;
      font-style: normal;
    }

    /* 1. Base Panel Styling */
    #seat-assistant {
      position: fixed !important; 
      top: 0; right: 0; 
      width: 400px; height: 100vh;
      background: #111827 !important; /* --panel */
      color: #e5e7eb !important;     /* --text */
      border-left: 2px solid #334155;
      padding: 20px; 
      z-index: 1000000; 
      font-family: "OpenDyslexic", system-ui, sans-serif !important;
      box-shadow: -5px 0 20px rgba(0,0,0,0.5); 
      display: none; 
      overflow-y: hidden;
      box-sizing: border-box;
      line-height: 1.6;
    }
    #seat-assistant.active { display: block !important; }

    /* Force font on all children */
    #seat-assistant * {
      font-family: "OpenDyslexic", system-ui, sans-serif !important;
    }

    /* 2. Button Styling */
    #seat-assistant button {
      width: 100%; 
      margin: 8px 0; 
      padding: 14px; 
      background: #1f2933; 
      color: #e5e7eb; 
      border: 1px solid #334155; 
      border-radius: 8px;
      cursor: pointer; 
      font-family: inherit; 
      font-size: 14px;
      box-sizing: border-box;
      transition: background 0.2s;
    }
    #seat-assistant button:hover { background: #2d3748; }

    /* 3. The Requested White "Start Listening" Button */
    #listen-btn {
      background: #ffffff !important;
      color: #020617 !important;
      font-weight: 700 !important;
      border: 2px solid #d1d5db !important;
    }
    #listen-btn:hover {
      background: #f3f4f6 !important;
    }

    /* 4. Primary Accent Buttons (Recommend/Scan) */
    #seat-assistant button.primary {
      background: #e3f7f7 !important; /* --accent */
      color: #020617 !important;
      font-weight: 700;
      border: none;
    }

    /* 5. Transcript & Status */
    .status { margin: 10px 0; color: #facc15; font-weight: bold; font-size: 14px; }
    #transcript { 
      background: #020617; 
      border: 1px solid #334155; 
      height: 80px; 
      overflow-y: auto; 
      padding: 10px; 
      margin: 10px 0; 
      border-radius: 8px; 
      font-size: 13px; 
    }
    .transcript-line.user { color: #a5f3fc; }
    .transcript-line.assistant { color: #e5e7eb; }

    /* 6. Results List */
    .result { 
      background: #1f2937; 
      border: 1px solid #4b5563; 
      padding: 12px; 
      margin: 8px 0; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 13px;
    }
    .result:hover { border-color: #e3f7f7; }

    /* 7. The Yellow Seat Selection (SVG Map) */
    .seat-selected {
      fill: #facc15 !important;
      stroke: #ffffff !important;
      stroke-width: 3px !important;
      paint-order: stroke;
    }

    /* 8. High Contrast Mode Override */
    #seat-assistant.high-contrast { 
      background-color: #000000 !important; 
      color: #ffffff !important; 
      border-left: 3px solid #ffffff !important;
    }
    
    #seat-assistant.high-contrast button {
      background: #ffffff !important;
      color: #000000 !important;
      border: 2px solid #000000 !important;
      font-weight: bold !important;
    }

    #seat-assistant.high-contrast .result {
      background: #000000 !important;
      border: 2px solid #ffffff !important;
      color: #ffffff !important;
    }

    #seat-assistant.high-contrast #transcript {
      background: #000000 !important;
      border: 1px solid #ffffff !important;
    }
  `;
  document.head.appendChild(style);
}

function wirePanel() {
  window.allSeats = window.extractSeats ? window.extractSeats() : [];
  setTimeout(() => {
    announce(`Scan complete. Found ${window.allSeats.length} available seats.`);
  }, 1500); // delay function call by 1500ms

  document.getElementById("recommend-btn").onclick = handleRecommend;

  document.getElementById("listen-btn").onclick = () => {
    if (window.startListening) {
      announce("Listening for your preferences...");

      setTimeout(() => {
        window.startListening();
      }, 800); // delay function call by 0.8ms
    }
  };

  document.getElementById("high-contrast-toggle").onchange = (e) => {
    const isEnabled = e.target.checked;
    document
      .getElementById("seat-assistant")
      .classList.toggle("high-contrast", isEnabled);
    announce(
      isEnabled
        ? "High contrast mode enabled."
        : "High contrast mode disabled.",
    );
  };

  document.getElementById("voice-toggle").onchange = (e) => {
    const isEnabled = e.target.checked;
    if (isEnabled) announce("Voice guidance enabled.");
    else forceAnnounce("Voice guidance disabled.");
  };
}

function handleRecommend() {
  if (!window.rankSeats) return announce("Ranking logic not loaded.");
  const stage = window.getStageAnchor
    ? window.getStageAnchor()
    : { x: 500, y: 65 };
  const top = window.topNSeats(
    window.allSeats,
    window.currentWeights,
    stage,
    3,
  );

  window.lastRecommendations = top;

  const list = document.querySelector(".results");
  if (list) {
    list.innerHTML = top.length
      ? top
          .map(
            (s, i) => `
      <div class="result" role="option" tabindex="0" aria-label="Option ${i + 1}: Section ${s.section}, Row ${s.row}, Seat ${s.seat}, $${s.price}" onclick="window.selectSeatById('${s.id}')">
        Option ${i + 1}: Sec ${s.section}, Row ${s.row}, Seat ${s.seat} ($${s.price})
      </div>
    `,
          )
          .join("")
      : '<div class="result" role="option" tabindex="0" aria-label="No results found">No results found.</div>';
    // announce recommendations and each option for screen-reader / voice feedback
    announce("Recommendations updated.");
    // announce each option sequentially with small delay so speech doesn't overlap
    top.forEach((s, i) => {
      setTimeout(
        () => {
          announce(
            `Option ${i + 1}: Section ${s.section}, Row ${s.row}, Seat ${s.seat}, ${s.price} dollars`,
          );
        },
        6500 * (i + 1),
      );
    });
  }
}

async function init() {
  const btn = document.createElement("button");
  btn.id = "seat-launcher";
  btn.innerText = "Voice Assistant";
  btn.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); 
    z-index: 2000000; padding: 18px 45px; background: #6366f1; color: white; 
    border: none; border-radius: 50px; cursor: pointer; font-weight: bold; 
    font-size: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    transition: transform 0.2s, background 0.2s;
  `;

  btn.onmouseover = () =>
    (btn.style.transform = "translateX(-50%) scale(1.05)");
  btn.onmouseout = () => (btn.style.transform = "translateX(-50%) scale(1)");

  btn.onclick = async () => {
    await injectPanel();
    const panel = document.getElementById("seat-assistant");
    if (panel.classList.toggle("active")) announce("Seat assistant activated.");
  };
  document.body.appendChild(btn);

  await Promise.all([
    loadScript(`${paths.logic}/extractSeats.js`),
    loadScript(`${paths.logic}/rankSeats.js`),
    loadScript(`${paths.logic}/selectSeat.js`),
    loadScript(`${paths.voice}/voice.js`),
  ]);
}

async function injectPanel() {
  if (document.getElementById("seat-assistant")) return;
  injectStyles();
  try {
    const res = await fetch(paths.panel);
    const html = await res.text();
    const div = document.createElement("div");
    div.id = "seat-assistant";
    div.innerHTML = html;
    document.body.appendChild(div);
    wirePanel();
  } catch (e) {
    console.error(e);
  }
}

window.onVoiceResult = (res) => {
  if (res.assistantText) announce(res.assistantText);

  if (res.weights) {
    window.currentWeights = res.weights;
    handleRecommend();
  }

  if (res.command && res.command.type === "select") {
    const index = res.command.index - 1;
    const seat =
      window.lastRecommendations && window.lastRecommendations[index];

    if (seat && window.selectSeatById) {
      window.selectSeatById(seat.id);
      // announce programmatic selection
      announce(`Option ${index + 1} selected`);
    }
  }
};

init();
