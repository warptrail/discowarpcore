import { useMemo } from 'react';
import { getInventoryObjectShape } from '../util/inventoryObjectShape';

const colors = {
  front: 'var(--box-primary, #71d2ff)',
  side: 'var(--box-secondary, #a7b6ff)',
  top: 'var(--box-primary, #71d2ff)',
};

export default function InventoryObjectShape({ item }) {
  const faces = useMemo(() => getInventoryObjectShape(item), [item]);
  return <svg viewBox="0 0 120 110" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true" focusable="false" data-inventory-object>
    <ellipse cx="60" cy="99" rx="30" ry="3" fill="#000" opacity=".3" />
    {faces.map((face, index) => <polygon key={index} points={face.points}
      fill={colors[face.shade]} fillOpacity={face.opacity}
      stroke="var(--box-primary, #71d2ff)" strokeWidth="1" strokeLinejoin="round" />)}
  </svg>;
}
