//Voice capture + preference interpretation for Seat Assistant

// --------------------------
// Speech Recognition Setup
// --------------------------

let recognition;
const LOW_CONFIDENCE_TOKEN = "__LOW_CONFIDENCE__"; // used to flag low-confidence transcripts

// Starts the browser's speech recognition and calls onText(transcript)
export function startListening(onText) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false; // only final results
  recognition.continuous = false; // stop after single phrase

  recognition.onresult = (e) => {
    let finalText = "";
    let confidence = 1;

    // Collect all final results
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      if (result.isFinal) {
        finalText += result[0].transcript;
        confidence = result[0].confidence ?? 1;
      }
    }

    if (!finalText.trim()) return;

    // Low-confidence detection
    if (confidence < 0.6) {
      onText(LOW_CONFIDENCE_TOKEN);
      return;
    }

    onText(finalText.trim().toLowerCase());
  };

  recognition.start();
}

// Stops ongoing speech recognition
export function stopListening() {
  recognition?.stop();
}

// --------------------------
// Utilities
// --------------------------

// Ensures that sum of weights equals 1
function normalizeWeights(w) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum === 0) return w;

  Object.keys(w).forEach(k => (w[k] /= sum));
  return w;
}

/**
 * Standardize various phrasings to known keywords
 * e.g. “cheap” -> “under”, “side seat” -> “aisle”
 */

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

// --------------------------
// Intent Definitions
// --------------------------

// Each intent represents a type of preference user can express
// weight = relative importance for scoring seats
const INTENTS = [
  { key: "distance", phrases: ["closer", "near", "front", "close to stage"], weight: 0.2 },
  { key: "centrality", phrases: ["center", "central", "middle"], weight: 0.2 },
  { key: "aisle", phrases: ["aisle", "side seat", "easy access"], weight: 0.2 },
  { key: "price", phrases: ["cheap", "under", "affordable"], weight: 0.2 },
  { key: "avoidObstructed", phrases: ["clear view", "avoid obstructed", "unblocked"], weight: 0.3 }
];


/**
 * Detect if user negates an intent (soft negation)
 * e.g. “not too close” -> reduce distance weight
 */
function isNegated(text, phrase) {
  const idx = text.indexOf(phrase);
  if (idx === -1) return false;

  const window = text.slice(Math.max(0, idx - 12), idx);
  return /\bnot\b|\bno\b|\bavoid\b/.test(window);
}

// Adjusts delta based on intensity words: very / slightly / not too
function intensityMultiplier(text) {
  if (text.includes("very")) return 1.5;
  if (text.includes("slightly") || text.includes("a bit")) return 0.7;
  if (text.includes("not too")) return 0.5;
  return 1;
}

/**
 * Determine if assistant should ask a follow-up question
 * - vague input: “good”, “best”
 * - conflicting priorities: distance vs price
 * - too many intents at once
 */
function needsClarification(text, matched) {
  if (/better|best|good|nice|ideal/.test(text)) return true;
  if (matched.includes("price") && matched.includes("distance")) return true;
  if (matched.length >= 3) return true;
  return false;
}

// --------------------------
// Interpreter
// --------------------------

let lastCommandTime = 0;

/**
 * Main function that converts speech text into:
 * - updated weights (for seat ranking)
 * - optional selection command
 * - assistantText to announce
 */
export function interpret(text, prefState) {
  if (text === LOW_CONFIDENCE_TOKEN) {
    return { assistantText: "I didn’t quite catch that. Please repeat." };
  }

  text = normalizeText(text);

  // simple debounce (ignore repeats within 1.2s)
  const now = Date.now();
  if (now - lastCommandTime < 1200) {
    return { assistantText: "Okay." };
  }
  lastCommandTime = now;

  if (!text || text.length < 4) {
    return { assistantText: "Listening." };
  }

  // ---- 1. Hard commands: option selection ----
  const optionMatch = text.match(/option (one|two|three)/);
  if (optionMatch) {
    const index = { one: 1, two: 2, three: 3 }[optionMatch[1]];
    return select(index);
  }

  // ---- 2. Intent extraction ----
  const factor = intensityMultiplier(text);
  const updated = { ...prefState };
  const matchedIntents = [];

  for (const intent of INTENTS) {
    for (const phrase of intent.phrases) {
      if (text.includes(phrase)) {
        const delta = intent.weight * factor;
        updated[intent.key] += isNegated(text, phrase)
          ? -delta * 0.5
          : delta;

        matchedIntents.push(intent.key);
        break; // prevent double-counting same intent
      }
    }
  }

  // ---- 3. Clarification ----
  if (matchedIntents.length && needsClarification(text, matchedIntents)) {
    return {
      assistantText:
        "I heard a few preferences. What matters more — price or being closer to the stage?"
    };
  }

  // ---- 4. Apply updated weights (preference) ----
  if (matchedIntents.length) {
    return {
      weights: normalizeWeights(updated),
      assistantText: "Got it. Preferences updated."
    };
  }

  // ---- 5. Fallback response ----
  return {
    assistantText:
      "Sorry, I didn’t understand that. You can say things like under one twenty, aisle, or option two."
  };
}

// --------------------------
// Option selection helper
// --------------------------
function select(index) {
  return {
    command: { type: "select", index },
    assistantText: `Selecting option ${index}.`
  };
}

