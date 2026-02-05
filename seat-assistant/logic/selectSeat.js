// seat/selectSeat.js
// Minimal helper to highlight + "select" a seat element on the page.
// Works with the mockVenue.html seats (SVG elements with class="seat").
//
// Exports:
// - clearSelectedSeat()
// - highlightSeat(seatEl)
// - selectSeat(seatOrEl)  // accepts a Seat object with .el, or an Element
// - selectSeatById(seatId) // uses Seat id convention: `${section}-${row}-${seat}`
// - getSelectedSeatEl()

const SELECTED_CLASS = "seat-selected";
let lastSelectedEl = null;

/**
 * Remove highlight from previously selected seat.
 */
export function clearSelectedSeat() {
  if (lastSelectedEl) {
    lastSelectedEl.classList.remove(SELECTED_CLASS);
    lastSelectedEl.removeAttribute("aria-selected");
  }
  lastSelectedEl = null;
}

/**
 * Highlight a seat element as selected.
 * @param {Element} seatEl
 */
export function highlightSeat(seatEl) {
  if (!seatEl) return;

  // Clear previous
  clearSelectedSeat();

  // Apply new
  seatEl.classList.add(SELECTED_CLASS);
  seatEl.setAttribute("aria-selected", "true");
  lastSelectedEl = seatEl;

  // Ensure it is focusable for keyboard/screen reader (optional but nice)
  // SVG elements might not be focusable by default.
  if (!seatEl.hasAttribute("tabindex")) seatEl.setAttribute("tabindex", "0");
  try {
    seatEl.focus?.();
  } catch (_) {
    // ignore
  }
}

/**
 * Attempt to click the seat element to mimic real ticketing behavior.
 * Some sites attach click handlers for selection; our mockVenue.html does too.
 * @param {Element} seatEl
 */
function safeClick(seatEl) {
  try {
    seatEl.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
    );
  } catch (_) {
    // Fallback to native click if available
    try {
      seatEl.click?.();
    } catch (_) {
      // ignore
    }
  }
}

/**
 * Select a seat given either a Seat object (with .el) or the Element itself.
 * @param {{el?: Element} | Element} seatOrEl
 */
export function selectSeat(seatOrEl) {
  const seatEl = seatOrEl?.el ? seatOrEl.el : seatOrEl;
  if (!seatEl) return false;

  // Don't select sold seats if the attribute exists
  const status = seatEl.getAttribute?.("data-status");
  if (status && status !== "available") return false;

  highlightSeat(seatEl);
  safeClick(seatEl);
  return true;
}

/**
 * Select a seat by its id convention: `${section}-${row}-${seat}`
 * Looks for .seat elements matching data-section/data-row/data-seat.
 * @param {string} seatId
 */
export function selectSeatById(seatId) {
  if (!seatId || typeof seatId !== "string") return false;

  const parts = seatId.split("-");
  if (parts.length < 3) return false;

  const [section, row, seat] = parts;

  const seatEl = document.querySelector(
    `.seat[data-section="${CSS.escape(section)}"][data-row="${CSS.escape(
      row
    )}"][data-seat="${CSS.escape(seat)}"]`
  );

  if (!seatEl) return false;
  return selectSeat(seatEl);
}

/**
 * Get the currently highlighted seat element (if any).
 */
export function getSelectedSeatEl() {
  return lastSelectedEl;
}
