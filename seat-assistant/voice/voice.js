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

  recognition = new SpeechRecognition();
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
    let finalText = "";
    let confidence = 1;

    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      if (result.isFinal) {
        finalText += result[0].transcript;
        confidence = result[0].confidence ?? 1;
      }
    }

    if (!finalText.trim()) return;

    console.log("Final transcript:", finalText, "confidence:", confidence);

    if (confidence < 0.6) {
      onText("__LOW_CONFIDENCE__");
      return;
    }

    onText(finalText.trim().toLowerCase());
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

// text normalization function
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/nearer|nearest|close by/g, "closer")
    .replace(/cheap|cheaper|less expensive/g, "under")
    .replace(/walkway|side seat/g, "aisle")
    .replace(/blocked view|blocked/g, "obstructed")
    .replace(/\s+/g, " ")
    .trim();
}

// Intent definitions for sentence-level understanding
const INTENTS = [
  {
    key: "distance",
    phrases: ["closer", "near", "front", "close to stage"],
    weight: 0.2
  },
  {
    key: "centrality",
    phrases: ["center", "central", "middle"],
    weight: 0.2
  },
  {
    key: "aisle",
    phrases: ["aisle", "side seat", "easy access"],
    weight: 0.2
  },
  {
    key: "price",
    phrases: ["cheap", "under", "not too expensive", "affordable"],
    weight: 0.2
  },
  {
    key: "avoidObstructed",
    phrases: ["no obstruction", "clear view", "avoid obstructed", "unblocked"],
    weight: 0.3
  }
];

// soft negation
function isNegated(text, phrase) {
  const idx = text.indexOf(phrase);
  if (idx === -1) return false;

  const window = text.slice(Math.max(0, idx - 12), idx);
  return /\bnot\b|\bno\b|\bavoid\b/.test(window);
}

// considering word intensity
function intensityMultiplier(text) {
  if (text.includes("very")) return 1.5;
  if (text.includes("slightly") || text.includes("a bit")) return 0.7;
  if (text.includes("not too")) return 0.5;
  return 1;
}


// Interpreter

let lastCommandText = null;
let lastCommandTime = 0;

export function interpret(text, prefState) {
  if (text === "__LOW_CONFIDENCE__") {
    return { announcement: "I didn’t quite catch that. Please repeat." };
  }

  text = normalizeText(text);

  const now = Date.now();

  if (now - lastCommandTime < 1200) {
    return { announcement: "Okay." };
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

  // ---------- 2. SENTENCE-LEVEL PREFERENCE MODIFICATION ----------
  let w = { ...prefState };
  let changed = false;
  const factor = intensityMultiplier(text);

  for (const intent of INTENTS) {
    for (const phrase of intent.phrases) {
      if (text.includes(phrase)) {
        const delta = intent.weight * factor;

        if (isNegated(text, phrase)) {
          w[intent.key] -= delta * 0.5; // soft negation
        } else {
          w[intent.key] += delta;
        }

        changed = true;
        break; // avoid double-counting same intent
      }
    }
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

