# SeatSense

A browser-based, voice-driven AI assistant that helps users select optimal seats on ticket booking websites.

## Features
- Voice input for preferences
- Real-time seat scanning
- Intelligent ranking
- Keyboard-accessible UI
- Works as a browser extension

## Repository Structure

seat-assistant/
├─ extension/        # Browser extension code
├─ demo/             # Mock ticket site
├─ logic/            # Seat extraction & ranking
├─ font/             # Fonts import
├─ voice/            # Speech recognition
README.md

## How to Run (No Setup Required)

### Step 1: Load the demo page
Open:
demo/mockVenue.html

### Step 2: Load the browser extension
1. Open Chrome
2. Go to chrome://extensions
3. Enable "Developer Mode"
4. Click "Load unpacked"
5. Select the `extension/` folder

### Step 3: Use the assistant
- Press Alt+S or Voice Assistant button to open panel
- Click "Scan Seats"
- Click "Recommend"
- Or press "Start Listening"

No API keys required.
