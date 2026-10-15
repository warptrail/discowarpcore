export function getFinderFocusBounds({ anchorRect, headerBottom = 64, width, height }) {
  const panelWidth = Math.min(960, width - 16, anchorRect?.width || width - 16);
  const left = Math.max(8, Math.min((anchorRect?.left || 0) + ((anchorRect?.width || width) - panelWidth) / 2, width - panelWidth - 8));
  const top = Math.max(8, Math.min(anchorRect?.top ?? headerBottom + 6, height - 216));
  const maxHeight = Math.max(160, height - top - 8);
  return { top, left, width: panelWidth, height: Math.min(640, maxHeight), maxHeight };
}
