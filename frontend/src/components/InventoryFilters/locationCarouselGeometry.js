export { wrapCarouselOffset } from '../Carousel/carouselGeometry.js';

const overlap = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

// Captions matter more than glyphs. Stay near center unless moving actually improves visibility.
export function placeCarouselLabel({ width, height, labelWidth, labelHeight, obstacles = [], previous }) {
  const w = Math.min(labelWidth, Math.max(0, width - 8));
  const center = (width - w) / 2;
  const candidates = [];
  const score = (rect) => obstacles.reduce((sum, obstacle) => sum + overlap(rect, obstacle) * (obstacle.weight ?? 1), 0)
    + Math.abs(rect.x - center) * .35;
  for (const y of [1, 4, 8, Math.max(1, (height - labelHeight) / 2)]) {
    for (let x = Math.max(4, center - 80); x <= Math.min(width - w - 4, center + 80); x += 4) {
      const rect = { x, y: Math.min(y, Math.max(0, height - labelHeight)), width: w, height: labelHeight };
      candidates.push({ ...rect, score: score(rect) });
    }
  }
  const best = candidates.sort((a, b) => a.score - b.score)[0] ?? { x: 4, y: 1, width: w, height: labelHeight, score: 0 };
  if (previous && previous.x + w <= width - 4 && score({ ...previous, width: w, height: labelHeight }) <= best.score + 12) {
    return { ...previous, width: w, height: labelHeight };
  }
  return { x: best.x, y: best.y, width: w, height: labelHeight };
}
