// voice.js

//Voice capture functions; start/stopListening
let recognition;

export function startListening(onText) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    console.log("Recognition started");
  };

  recognition.onspeechstart = () => {
    console.log("Speech detected");
  };

  recognition.onspeechend = () => {
    console.log("Speech ended");
  };

  recognition.onresult = (e) => {
    console.log("Raw result:", e);
    const text = e.results[0][0].transcript.trim().toLowerCase();
    onText(text);
  };

  recognition.onerror = (e) => {
    console.error("Recognition error", e);
  };

  recognition.onend = () => {
    console.log("Recognition ended");
  };

  recognition.start();
}


export function stopListening() {
  if (recognition) recognition.stop();
}

// helper function to normalize weights safely
function normalize(w) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum === 0) return w;

  Object.keys(w).forEach(k => w[k] /= sum);
  return w;
}

// Interpreter

let lastCommandText = null;
let lastCommandTime = 0;

export function interpret(text, prefState) {
  text = text.toLowerCase();

  const now = Date.now();

  if (text === lastCommandText && now - lastCommandTime < 1500) {
    return { announcement: "Command already applied" };
  }

  lastCommandText = text;
  lastCommandTime = now;

  if (!text || text.length < 4) {
  return { announcement: "Listening…" };

}
  // ---------- 1. OPTION SELECTION ----------
  if (text.includes("option")) {
    if (text.includes("one"))
      return select(1);
    if (text.includes("two"))
      return select(2);
    if (text.includes("three"))
      return select(3);
  }

  // ---------- 2. PREFERENCE MODIFICATION ----------
  let w = { ...prefState };
  let changed = false;

if (text.includes("closer") || text.includes("close")) {
    w.distance += 0.2;
    changed = true;
  }

  if (text.includes("center") || text.includes("central")) {
    w.centrality += 0.2;
    changed = true;
  }

  if (text.includes("aisle")) {
    w.aisle += 0.2;
    changed = true;
  }

  if (text.includes("cheap") || text.includes("under")) {
    w.price += 0.2;
    changed = true;
  }

  if (text.includes("obstruct")) {
    w.avoidObstructed += 0.3;
    changed = true;
  }

  if (changed) {
    return {
      weights: normalize(w),
      announcement: "Preferences updated"
    };
  }

  // ---------- 3. FALLBACK ----------
  return {
    announcement: "Sorry, I didn’t understand that"
  };
}

// Option selection helper
function select(index) {
  return {
    command: { type: "select", index },
    announcement: `Selecting option ${index}`
  };
}

