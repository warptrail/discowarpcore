const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(value, maximum));

// Keep the field workspace inside its owning item panel and the visible keyboard viewport.
export function getRetrievalFieldPopoverBounds({ anchor, panel, viewport, height }) {
  const leftEdge = Math.max(panel.left, viewport.left) + 12;
  const rightEdge = Math.min(panel.right, viewport.right) - 12;
  const topEdge = Math.max(panel.top, viewport.top) + 12;
  const bottomEdge = Math.min(panel.bottom, viewport.bottom) - 12;
  const width = Math.min(420, Math.max(0, rightEdge - leftEdge));
  const maxHeight = Math.min(560, Math.max(0, bottomEdge - topEdge));
  const popupHeight = Math.min(height, maxHeight);
  const mobile = viewport.right - viewport.left <= 600;
  const below = bottomEdge - anchor.bottom - 8;
  const above = anchor.top - topEdge - 8;
  const preferredTop = mobile ? bottomEdge - popupHeight
    : below >= popupHeight || below >= above ? anchor.bottom + 8 : anchor.top - popupHeight - 8;

  return {
    width, maxHeight,
    left: mobile ? leftEdge : clamp(anchor.left, leftEdge, rightEdge - width),
    top: clamp(preferredTop, topEdge, bottomEdge - popupHeight),
  };
}
