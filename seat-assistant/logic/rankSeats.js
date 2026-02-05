// seat/rankSeats.js
// Deterministic seat ranking for the mockVenue (or any page using the same Seat shape).
// Exports:
// - DEFAULT_WEIGHTS
// - getDefaultStage() helper
// - rankSeats(seats, weights, stage)
//
// Notes:
// - We normalize sub-scores into [0..1] so weights behave predictably.
// - "price" is treated as "prefer cheaper" (higher score for lower price).
// - "avoidObstructed" penalizes seats tagged "obstructed".
// - "aisle" gives bonus for seats tagged "aisle".
// - "distance" prefers seats closer to stage anchor.
// - "centrality" prefers seats closer to horizontal center of seat map.

export const DEFAULT_WEIGHTS = {
  distance: 0.25,
  centrality: 0.2,
  aisle: 0.2,
  price: 0.2,
  avoidObstructed: 0.15,
};

// Handy if you want a fallback stage anchor.
export function getDefaultStage() {
  return { x: 500, y: 65 };
}

/**
 * Normalize weights so they sum to 1 (safe if caller sends arbitrary numbers)
 * @param {Record<string, number>} w
 */
function normalizeWeights(w) {
  const keys = ["distance", "centrality", "aisle", "price", "avoidObstructed"];
  const raw = {};
  let sum = 0;

  for (const k of keys) {
    const v = Number(w?.[k]);
    const vv = Number.isFinite(v) && v > 0 ? v : 0;
    raw[k] = vv;
    sum += vv;
  }

  if (sum <= 0) return { ...DEFAULT_WEIGHTS };

  const out = {};
  for (const k of keys) out[k] = raw[k] / sum;
  return out;
}

/**
 * Compute min/max for numeric arrays safely.
 * @param {number[]} nums
 */
function minMax(nums) {
  let min = Infinity;
  let max = -Infinity;
  for (const n of nums) {
    if (!Number.isFinite(n)) continue;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (min === Infinity || max === -Infinity) return { min: 0, max: 1 };
  if (min === max) return { min, max: min + 1 }; // avoid divide by zero
  return { min, max };
}

/**
 * Clamp to [0..1]
 * @param {number} x
 */
function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * Rank seats best-first.
 *
 * @param {Array<{
 *  id: string,
 *  section: string,
 *  row: string,
 *  seat: string,
 *  price: number,
 *  x: number,
 *  y: number,
 *  tags: string[]
 * }>} seats
 * @param {{distance:number, centrality:number, aisle:number, price:number, avoidObstructed:number}} weights
 * @param {{x:number,y:number}} stage
 * @returns {Array<{
 *  id:string, section:string, row:string, seat:string, price:number, x:number, y:number, tags:string[],
 *  _score:number, _why: Record<string, number>
 * }>}
 */
export function rankSeats(seats, weights, stage) {
  const W = normalizeWeights(weights);
  const S = stage && Number.isFinite(stage.x) && Number.isFinite(stage.y) ? stage : getDefaultStage();

  // Compute ranges for normalization
  const xs = seats.map((s) => s.x);
  const ys = seats.map((s) => s.y);
  const prices = seats.map((s) => s.price);

  const { min: minX, max: maxX } = minMax(xs);
  const { min: minY, max: maxY } = minMax(ys);
  const { min: minP, max: maxP } = minMax(prices);

  // Define a map "center" (horizontal) for centrality scoring
  const centerX = (minX + maxX) / 2;

  // Precompute max distance to stage for normalization
  const dists = seats.map((s) => Math.hypot(s.x - S.x, s.y - S.y));
  const { min: minD, max: maxD } = minMax(dists);

  const ranked = seats.map((seat, idx) => {
    const tags = Array.isArray(seat.tags) ? seat.tags : [];
    const dist = dists[idx];

    // 1) Distance score: closer to stage is better
    // Normalize so minD -> 1, maxD -> 0
    const distScore = clamp01(1 - (dist - minD) / (maxD - minD));

    // 2) Centrality score: closer to centerX is better
    const dx = Math.abs(seat.x - centerX);
    const maxDx = Math.max(Math.abs(minX - centerX), Math.abs(maxX - centerX)) || 1;
    const centralityScore = clamp01(1 - dx / maxDx);

    // 3) Aisle score: tagged aisle -> 1 else 0
    const aisleScore = tags.includes("aisle") ? 1 : 0;

    // 4) Price score: cheaper is better
    // Normalize so minP -> 1, maxP -> 0
    const p = Number.isFinite(seat.price) ? seat.price : maxP;
    const priceScore = clamp01(1 - (p - minP) / (maxP - minP));

    // 5) Obstructed penalty: if obstructed, score is 0 else 1
    // (avoidObstructed weight increases impact)
    const obstructedOk = tags.includes("obstructed") ? 0 : 1;

    // Weighted sum
    const score =
      W.distance * distScore +
      W.centrality * centralityScore +
      W.aisle * aisleScore +
      W.price * priceScore +
      W.avoidObstructed * obstructedOk;

    return {
      ...seat,
      _score: score,
      _why: {
        distScore,
        centralityScore,
        aisleScore,
        priceScore,
        obstructedOk,
      },
    };
  });

  // Sort best-first, deterministic tie-breaker: score desc, then section/row/seat
  ranked.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;

    // tie-breaker for stable ordering
    const ak = `${a.section}|${a.row}|${a.seat}`;
    const bk = `${b.section}|${b.row}|${b.seat}`;
    return ak.localeCompare(bk);
  });

  return ranked;
}

/**
 * Convenience helper if you want just the top N without extra slicing everywhere.
 * @param {any[]} seats
 * @param {any} weights
 * @param {{x:number,y:number}} stage
 * @param {number} n
 */
export function topNSeats(seats, weights, stage, n = 3) {
  return rankSeats(seats, weights, stage).slice(0, n);
}
