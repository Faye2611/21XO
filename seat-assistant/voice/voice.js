// Voice capture + preference interpretation for Seat Assistant
let recognition;
const LOW_CONFIDENCE_TOKEN = "__LOW_CONFIDENCE__";

window.startListening = function () {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

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

    if (confidence < 0.6) {
      if (window.onVoiceResult) {
        const result = window.interpret("__LOW_CONFIDENCE__", window.currentWeights || {});
        window.onVoiceResult(result);
      }
      return;
    }

    if (window.onVoiceResult) {
      const result = window.interpret(finalText.trim().toLowerCase(), window.currentWeights || {});
      window.onVoiceResult(result);
    }
  };

  recognition.start();
};

window.stopListening = function () {
  recognition?.stop();
};

function normalizeWeights(w) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum === 0) return w;
  const newWeights = { ...w };
  Object.keys(newWeights).forEach(k => (newWeights[k] /= sum));
  return newWeights;
}

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

const INTENTS = [
  { key: "distance", phrases: ["closer", "near", "front", "close to stage"], weight: 0.2 },
  { key: "centrality", phrases: ["center", "central", "middle"], weight: 0.2 },
  { key: "aisle", phrases: ["aisle", "side seat", "easy access"], weight: 0.2 },
  { key: "price", phrases: ["cheap", "under", "affordable"], weight: 0.2 },
  { key: "avoidObstructed", phrases: ["clear view", "avoid obstructed", "unblocked"], weight: 0.3 }
];

function isNegated(text, phrase) {
  const idx = text.indexOf(phrase);
  if (idx === -1) return false;
  const preText = text.slice(Math.max(0, idx - 12), idx);
  return /\bnot\b|\bno\b|\bavoid\b/.test(preText);
}

function intensityMultiplier(text) {
  if (text.includes("very")) return 1.5;
  if (text.includes("slightly") || text.includes("a bit")) return 0.7;
  if (text.includes("not too")) return 0.5;
  return 1;
}

function needsClarification(text, matched) {
  if (/better|best|good|nice|ideal/.test(text)) return true;
  if (matched.includes("price") && matched.includes("distance")) return true;
  if (matched.length >= 3) return true;
  return false;
}

let lastCommandTime = 0;

window.interpret = function (text, prefState) {
  if (text === LOW_CONFIDENCE_TOKEN) {
    return { assistantText: "I didn’t quite catch that. Please repeat." };
  }

  text = normalizeText(text);
  const now = Date.now();
  if (now - lastCommandTime < 1200) return { assistantText: "Okay." };
  lastCommandTime = now;

  if (!text || text.length < 4) return { assistantText: "Listening." };

  const optionMatch = text.match(/option (one|two|three)/);
  if (optionMatch) {
    const index = { one: 1, two: 2, three: 3 }[optionMatch[1]];
    return select(index);
  }

  const factor = intensityMultiplier(text);
  const updated = { ...prefState };
  const matchedIntents = [];

  for (const intent of INTENTS) {
    for (const phrase of intent.phrases) {
      if (text.includes(phrase)) {
        const delta = intent.weight * factor;
        updated[intent.key] = (updated[intent.key] || 0) + (isNegated(text, phrase) ? -delta * 0.5 : delta);
        matchedIntents.push(intent.key);
        break;
      }
    }
  }

  if (matchedIntents.length && needsClarification(text, matchedIntents)) {
    return {
      assistantText: "I heard a few preferences. What matters more — price or being closer to the stage?"
    };
  }

  if (matchedIntents.length) {
    return {
      weights: normalizeWeights(updated),
      //assistantText: "Got it. Recommendations updated."
    };
  }

  return {
    assistantText: "Sorry, I didn’t understand that. You can say things like under one twenty, aisle, or option two."
  };
};

function select(index) {
  return {
    command: { type: "select", index },
    //assistantText: `Selecting option ${index}.`
  };
}