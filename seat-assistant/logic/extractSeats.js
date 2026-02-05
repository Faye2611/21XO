// seat/extractSeats.js
// Extracts seats from demo/mockVenue.html (or any page that uses the same conventions)
// Requirements fulfilled:
// - Only includes seats with data-status="available"
// - Returns Seat[] with: id, section, row, seat, price, x, y, tags, el
// - Exposes a stage anchor (x,y) derived from #stage-box or #stage text

/**
 * @typedef {Object} Seat
 * @property {string} id          // `${section}-${row}-${seat}`
 * @property {string} section
 * @property {string} row
 * @property {string} seat
 * @property {number} price
 * @property {number} x           // map coordinate
 * @property {number} y           // map coordinate
 * @property {string[]} tags
 * @property {Element} el         // underlying SVG/DOM element
 */

/** Default stage anchor if we can't find it in the DOM. */
export const DEFAULT_STAGE = { x: 500, y: 65 };

/**
 * Attempt to read the stage anchor from the page.
 * In mockVenue.html, there's #stage-box (rect) and #stage (text).
 * @returns {{x:number,y:number}}
 */
export function getStageAnchor() {
  // Prefer the rect box center
  const rect = document.getElementById("stage-box");
  if (rect && typeof rect.getBBox === "function") {
    try {
      const b = rect.getBBox();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    } catch (_) {
      // fall through
    }
  }

  // Next: stage text position
  const stageText = document.getElementById("stage");
  if (stageText) {
    const x = Number(stageText.getAttribute("x"));
    const y = Number(stageText.getAttribute("y"));
    if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  }

  return { ...DEFAULT_STAGE };
}

/**
 * Extract seat coordinates in a robust way (SVG first, then bounding box fallback).
 * @param {Element} el
 * @returns {{x:number,y:number}}
 */
function getSeatXY(el) {
  // SVG circles: cx/cy
  const cx = Number(el.getAttribute?.("cx"));
  const cy = Number(el.getAttribute?.("cy"));
  if (Number.isFinite(cx) && Number.isFinite(cy)) return { x: cx, y: cy };

  // SVG rects: x/y + half width/height if present
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

  // SVG getBBox fallback
  if (typeof el.getBBox === "function") {
    try {
      const b = el.getBBox();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    } catch (_) {
      // fall through
    }
  }

  // DOM fallback: bounding client rect (screen coords) - less ideal but works
  if (typeof el.getBoundingClientRect === "function") {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  return { x: 0, y: 0 };
}

/**
 * Parse data-tags="aisle,obstructed" into ["aisle","obstructed"]
 * @param {string|null} tagsStr
 * @returns {string[]}
 */
function parseTags(tagsStr) {
  if (!tagsStr) return [];
  return tagsStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Extract all AVAILABLE seats from the current page.
 * Expected seat elements:
 *  - class="seat"
 *  - data-status="available"
 *  - data-section, data-row, data-seat, data-price, data-tags
 *
 * @returns {Seat[]}
 */
export function extractSeats() {
  /** @type {NodeListOf<Element>} */
  const nodes = document.querySelectorAll('.seat[data-status="available"]');

  /** @type {Seat[]} */
  const seats = [];

  nodes.forEach((el) => {
    const section = (el.getAttribute("data-section") || "").trim();
    const row = (el.getAttribute("data-row") || "").trim();
    const seat = (el.getAttribute("data-seat") || "").trim();
    const priceRaw = (el.getAttribute("data-price") || "").trim();
    const tagsRaw = el.getAttribute("data-tags");

    // Basic validation — skip if required fields missing
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
