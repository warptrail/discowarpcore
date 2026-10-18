import { useLayoutEffect, useRef, useState } from 'react';

// Measure the laid-out grid so each wrapped row joins the same root spine.
export default function useCompartmentConnectors(compartments) {
  const branchesRef = useRef(null);
  const [connections, setConnections] = useState({ trunk: '', stems: [] });
  useLayoutEffect(() => {
    const grid = branchesRef.current;
    if (!grid) return;
    const cards = [...grid.querySelectorAll('[data-compartment-branch]')];
    const measure = () => {
      const rows = new Map();
      const stems = cards.map((card) => {
        const x = card.offsetLeft + 26;
        const y = card.offsetTop;
        const busY = y - 12;
        rows.set(busY, Math.max(rows.get(busY) || 0, x));
        return { key: card.dataset.compartmentBranch, color: card.style.getPropertyValue('--branch-color'), path: `M ${x} ${busY} V ${y + 1}` };
      });
      const paddingTop = parseFloat(getComputedStyle(grid.parentElement).paddingTop);
      const busRows = [...rows.entries()].sort(([left], [right]) => left - right);
      const trunk = busRows.length
        ? `M 4.5 ${-paddingTop - 1} V ${busRows.at(-1)[0]} ${busRows.map(([y, x]) => `M 4.5 ${y} H ${x}`).join(' ')}`
        : '';
      const next = { trunk, stems };
      setConnections((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [compartments]);
  return { branchesRef, connections };
}
