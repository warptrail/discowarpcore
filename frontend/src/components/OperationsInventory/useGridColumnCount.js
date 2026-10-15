import { useLayoutEffect, useState } from 'react';

export default function useGridColumnCount(gridRef) {
  const [columns, setColumns] = useState(1);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const measure = () => {
      const template = getComputedStyle(grid).gridTemplateColumns;
      setColumns(template && template !== 'none' ? template.trim().split(/\s+/).length : 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [gridRef]);
  return columns;
}
