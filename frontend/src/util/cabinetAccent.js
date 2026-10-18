const COLORS = ['#89e3c2', '#93ccff', '#c6afff', '#f4afc3', '#f4d08a', '#89dce3', '#b3bfff'];
export function cabinetAccent(key = 'A') {
  const color = COLORS[Math.max(0, key.charCodeAt(0) - 65) % COLORS.length];
  const rgb = color.match(/[\da-f]{2}/gi).map(part => parseInt(part, 16)).join(', ');
  return { '--branch-color': color, '--branch-rgb': rgb };
}
