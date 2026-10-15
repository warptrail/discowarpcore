const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(value, maximum));

// Fixed menus stay anchored to the field without affecting table/column layout.
export function getSelectMenuBounds(anchor, viewport, layoutHeight) {
  const inset = 8;
  const gap = 6;
  const leftEdge = viewport.left + inset;
  const rightEdge = viewport.left + viewport.width - inset;
  const topEdge = viewport.top + inset;
  const bottomEdge = viewport.top + viewport.height - inset;
  const width = Math.min(anchor.width, Math.max(0, rightEdge - leftEdge));
  const belowTop = clamp(anchor.bottom + gap, topEdge, bottomEdge);
  const aboveBottom = clamp(anchor.top - gap, topEdge, bottomEdge);
  const below = Math.max(0, bottomEdge - belowTop);
  const above = Math.max(0, aboveBottom - topEdge);
  const openAbove = below < 160 && above > below;
  return {
    left: clamp(anchor.left, leftEdge, rightEdge - width),
    right: 'auto',
    width,
    maxHeight: Math.min(280, openAbove ? above : below),
    ...(openAbove
      ? { top: 'auto', bottom: layoutHeight - aboveBottom }
      : { top: belowTop, bottom: 'auto' }),
  };
}
