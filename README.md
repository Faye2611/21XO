# SeatSense: Voice-Driven Seat Selection AI

**SeatSense** is an accessibility-first web assistant designed to help users with visual, motor, or cognitive impairments navigate complex seat maps. By combining **Natural Language Processing (NLP)** with **Spatial Ranking Algorithms**, it allows users to find and select tickets using only their voice.

---

## How to Run (Judge's Quick Start)

Because this tool relies on loading local JavaScript modules and templates, it must be served via a local HTTP server to avoid browser security (CORS) restrictions.

### 1. Launch a Local Server
Open your terminal in the `seat-assistant` root folder (e.g. `cd seat-assistant`) and start a server. Use whichever tool you prefer:

* **Option A (Python):** Run `python -m http.server 8000`
* **Option B (VS Code):** Click the **"Go Live"** button (defaults to port 5500)
* **Option C (Node.js):** Run `npx serve`

### 2. Open the Demo
Navigate to the demo page in **Google Chrome**:
* If using Python: `http://localhost:8000/demo/mockVenue.html`
* If using VS Code: `http://127.0.0.1:5500/demo/mockVenue.html`
* If using Node.js: Navigate to the Local or Network URL, click demo/, then click mockVenue.html

### 3. Activate the Assistant
* Click the floating **"Voice Assistant"** pill at the bottom center of the page.
* The **SeatSense** panel (loaded from the `/extension` folder) will slide out from the right.

---

## Testing Protocol

Follow these steps to experience the full integration of voice logic, spatial ranking, and visual feedback:

1.  **Initialize:** Click **"Scan Seats"**. The assistant will parse the SVG map and announce the number of available seats found.
2.  **Set Voice Preferences:** * Click the white **"Start Listening"** button.
    * Say clearly: *"I want a cheap seat."*
    * **Observe:** The assistant confirms your preferences via speech (TTS) and automatically refreshes the recommendation list based on your criteria.
3.  **Voice Selection:**
    * Click **"Start Listening"** again and say: *"Option One"* or *"Option Two."*
    * **Observe:** The assistant will announce "Selecting Option [X]," and the corresponding seat on the SVG map will **turn yellow** and gain focus.

---

## Technical Architecture



* **The Brain (`content.js`):** The central orchestrator. It manages application state, handles the "Bridge" between voice results and UI updates, and injects dynamic styles.
* **Voice Engine (`/voice`):** Contains `voice.js`, which utilizes the Web Speech API to interpret natural language and map subjective phrases (like "cheap" or "close to stage") into numerical weights.
* **Spatial Logic (`/logic`):** A suite of scripts including `extractSeats.js` (DOM parsing), `rankSeats.js` (Multi-criteria ranking), and `selectSeat.js` (SVG manipulation and highlighting).
* **Assistant UI (`/extension`):** Houses `assistantPanel.html`. This folder serves as the UI template repository for the side panel interface.
* **Accessibility Features:** Built-in support for the **OpenDyslexic** font and **High Contrast** modes to assist users with dyslexia and low-vision.

---

## Repository Structure

```text
seat-assistant/
├─ demo/              # Mock SVG Seat Map & HTML environment
├─ logic/             # Core JS: extraction, ranking, and selection logic
├─ voice/             # NLP: Voice interpretation and weight mapping
├─ font/              # OpenDyslexic font files
├─ extension/         # UI Components (assistantPanel.html)
└─ content.js         # The Unified System Orchestrator 