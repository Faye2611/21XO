/**
 * @typedef {Object} Seat
 * @property {string} id
 * @property {string} section
 * @property {string} row
 * @property {string} seat
 * @property {number} price
 * @property {number} x
 * @property {number} y
 * @property {string[]} tags
 * @property {Element} el
 */

const DEFAULT_STAGE = { x: 500, y: 65 };

function getStageAnchor() {
  const rect = document.getElementById("stage-box");
  if (rect && typeof rect.getBBox === "function") {
    try {
      const b = rect.getBBox();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    } catch (_) {}
  }

  const stageText = document.getElementById("stage");
  if (stageText) {
    const x = Number(stageText.getAttribute("x"));
    const y = Number(stageText.getAttribute("y"));
    if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  }

  return { ...DEFAULT_STAGE };
}

function getSeatXY(el) {
  const cx = Number(el.getAttribute?.("cx"));
  const cy = Number(el.getAttribute?.("cy"));
  if (Number.isFinite(cx) && Number.isFinite(cy)) return { x: cx, y: cy };

  const xAttr = Number(el.getAttribute?.("x"));
  const yAttr = Number(el.getAttribute?.("y"));
  if (Number.isFinite(xAttr) && Number.isFinite(yAttr)) {
    const w = Number(el.getAttribute?.("width"));
    const h = Number(el.getAttribute?.("height"));
    if (Number.isFinite(w) && Number.isFinite(h)) {
      return { x: xAttr + w / 2, y: yAttr + h / 2 };
    }
    return { x: xAttr, y: yAttr };
  }

  if (typeof el.getBBox === "function") {
    try {
      const b = el.getBBox();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    } catch (_) {}
  }

  if (typeof el.getBoundingClientRect === "function") {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  return { x: 0, y: 0 };
}

function parseTags(tagsStr) {
  if (!tagsStr) return [];
  return tagsStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function extractSeats() {
  const nodes = document.querySelectorAll('.seat[data-status="available"]');
  const seats = [];

  nodes.forEach((el) => {
    const section = (el.getAttribute("data-section") || "").trim();
    const row = (el.getAttribute("data-row") || "").trim();
    const seat = (el.getAttribute("data-seat") || "").trim();
    const priceRaw = (el.getAttribute("data-price") || "").trim();
    const tagsRaw = el.getAttribute("data-tags");

    if (!section || !row || !seat) return;

    const price = Number(priceRaw);
    const { x, y } = getSeatXY(el);
    const tags = parseTags(tagsRaw);
    const id = `${section}-${row}-${seat}`;

    seats.push({
      id,
      section,
      row,
      seat,
      price: Number.isFinite(price) ? price : NaN,
      x,
      y,
      tags,
      el,
    });
  });

  return seats;
}

window.extractSeats = extractSeats;
window.getStageAnchor = getStageAnchor;
window.DEFAULT_STAGE = DEFAULT_STAGE;
