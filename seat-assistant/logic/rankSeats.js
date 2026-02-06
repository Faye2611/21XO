const DEFAULT_WEIGHTS = {
  distance: 0.25,
  centrality: 0.2,
  aisle: 0.2,
  price: 0.2,
  avoidObstructed: 0.15,
};

function getDefaultStage() {
  return { x: 500, y: 65 };
}

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

function minMax(nums) {
  let min = Infinity;
  let max = -Infinity;
  for (const n of nums) {
    if (!Number.isFinite(n)) continue;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (min === Infinity || max === -Infinity) return { min: 0, max: 1 };
  if (min === max) return { min, max: min + 1 }; 
  return { min, max };
}

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function rankSeats(seats, weights, stage) {
  const W = normalizeWeights(weights);
  const S = stage && Number.isFinite(stage.x) && Number.isFinite(stage.y) ? stage : getDefaultStage();

  const xs = seats.map((s) => s.x);
  const ys = seats.map((s) => s.y);
  const prices = seats.map((s) => s.price);

  const { min: minX, max: maxX } = minMax(xs);
  const { min: minY, max: maxY } = minMax(ys);
  const { min: minP, max: maxP } = minMax(prices);

  const centerX = (minX + maxX) / 2;

  const dists = seats.map((s) => Math.hypot(s.x - S.x, s.y - S.y));
  const { min: minD, max: maxD } = minMax(dists);

  const ranked = seats.map((seat, idx) => {
    const tags = Array.isArray(seat.tags) ? seat.tags : [];
    const dist = dists[idx];

    const distScore = clamp01(1 - (dist - minD) / (maxD - minD));
    const dx = Math.abs(seat.x - centerX);
    const maxDx = Math.max(Math.abs(minX - centerX), Math.abs(maxX - centerX)) || 1;
    const centralityScore = clamp01(1 - dx / maxDx);
    const aisleScore = tags.includes("aisle") ? 1 : 0;
    const p = Number.isFinite(seat.price) ? seat.price : maxP;
    const priceScore = clamp01(1 - (p - minP) / (maxP - minP));
    const obstructedOk = tags.includes("obstructed") ? 0 : 1;

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

  ranked.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    const ak = `${a.section}|${a.row}|${a.seat}`;
    const bk = `${b.section}|${b.row}|${b.seat}`;
    return ak.localeCompare(bk);
  });

  return ranked;
}

function topNSeats(seats, weights, stage, n = 3) {
  return rankSeats(seats, weights, stage).slice(0, n);
}

window.DEFAULT_WEIGHTS = DEFAULT_WEIGHTS;
window.getDefaultStage = getDefaultStage;
window.rankSeats = rankSeats;
window.topNSeats = topNSeats;