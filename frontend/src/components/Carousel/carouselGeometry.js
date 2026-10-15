export function wrapCarouselOffset(offset, period) {
  if (period <= 0) return offset;
  return period + ((offset - period) % period + period) % period;
}

export function getCarouselTarget({ start, offset, itemWidth, viewportWidth, centered = false }) {
  return start + offset - (centered ? (viewportWidth - itemWidth) / 2 : 0);
}

export function getLoopedNavigationTarget({ target, currentTarget, scrollOffset, period, step, direction }) {
  if (period <= 0) return target;
  const currentCopy = currentTarget + Math.round((scrollOffset - currentTarget) / period) * period;
  const expected = currentCopy + direction * step;
  return target + Math.round((expected - target) / period) * period;
}
