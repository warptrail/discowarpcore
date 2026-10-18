// Stable visual variation for compact thumbnails and gradient-based item media.
export function getItemPlaceholderGradientStyle(item) {
  const identity = String(item?._id || item?.id || item?.name || item?.label || 'item');
  let seed = 2166136261;
  for (const character of identity) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  return {
    '--peek-gradient-angle': `${seed % 360}deg`,
    '--peek-gradient-origin': `${15 + (seed % 70)}% ${15 + ((seed >>> 8) % 70)}%`,
    '--peek-gradient-secondary-origin': `${15 + ((seed >>> 16) % 70)}% ${15 + ((seed >>> 24) % 70)}%`,
  };
}
