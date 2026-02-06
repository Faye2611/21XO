const SELECTED_CLASS = "seat-selected";
let lastSelectedEl = null;

function clearSelectedSeat() {
  if (lastSelectedEl) {
    lastSelectedEl.classList.remove(SELECTED_CLASS);
    lastSelectedEl.removeAttribute("aria-selected");
  }
  lastSelectedEl = null;
}

function highlightSeat(seatEl) {
  if (!seatEl) return;

  clearSelectedSeat();

  seatEl.classList.add(SELECTED_CLASS);
  seatEl.setAttribute("aria-selected", "true");
  lastSelectedEl = seatEl;

  if (!seatEl.hasAttribute("tabindex")) seatEl.setAttribute("tabindex", "0");
  try {
    seatEl.focus?.();
  } catch (_) {}
}

function safeClick(seatEl) {
  try {
    seatEl.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
    );
  } catch (_) {
    try {
      seatEl.click?.();
    } catch (_) {}
  }
}

function selectSeat(seatOrEl) {
  const seatEl = seatOrEl?.el ? seatOrEl.el : seatOrEl;
  if (!seatEl) return false;

  const status = seatEl.getAttribute?.("data-status");
  if (status && status !== "available") return false;

  highlightSeat(seatEl);
  safeClick(seatEl);
  return true;
}

function selectSeatById(seatId) {
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

function getSelectedSeatEl() {
  return lastSelectedEl;
}

window.clearSelectedSeat = clearSelectedSeat;
window.highlightSeat = highlightSeat;
window.selectSeat = selectSeat;
window.selectSeatById = selectSeatById;
window.getSelectedSeatEl = getSelectedSeatEl;