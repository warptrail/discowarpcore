export function getTagBubblePlacement(anchor, bubbleHeight, viewport) {
  const margin = 12, gap = 6;
  const width = Math.min(280, viewport.width - margin * 2);
  const below = Math.max(0, viewport.height - anchor.bottom - margin - gap);
  const above = Math.max(0, anchor.top - margin - gap);
  const side = bubbleHeight <= below || below >= above ? 'below' : 'above';
  const maxHeight = Math.min(340, Math.max(1, side === 'below' ? below : above));
  const height = Math.min(bubbleHeight, maxHeight);
  return {
    width, maxHeight,
    left: Math.max(margin, Math.min(anchor.right - width, viewport.width - width - margin)),
    top: side === 'below' ? anchor.bottom + gap : Math.max(margin, anchor.top - gap - height),
  };
}
