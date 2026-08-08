import { useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const tickerIn = keyframes`
  from { opacity: 0; filter: blur(3px); transform: translateY(2px); }
  to { opacity: 1; filter: blur(0); transform: translateY(0); }
`;

const Ticker = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  color: rgba(194, 246, 234, 0.92);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.88em;
  font-weight: 750;
  letter-spacing: 0.018em;
  text-overflow: ellipsis;
  white-space: nowrap;
  animation: ${tickerIn} 280ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

function count(value) {
  return (Number(value) || 0).toLocaleString();
}

function buildTickerLines(data) {
  if (!data || data.loading) return ['Indexing the All Items catalog…'];

  const lines = [
    `${count(data.total)} records in full inventory history`,
    `${count(data.active)} active · ${count(data.gone)} no longer have`,
    `${count(data.boxed)} boxed · ${count(data.orphaned)} items adrift`,
  ];

  if (data.totalQuantity > data.total) {
    lines.push(`${count(data.totalQuantity)} individual things across all records`);
  }
  if (data.categoryCount || data.locationCount) {
    lines.push(`${count(data.categoryCount)} categories · ${count(data.locationCount)} locations`);
  }
  if (data.tagCount) lines.push(`${count(data.tagCount)} tag assignments keeping things findable`);
  if (data.imageCount) lines.push(`${count(data.imageCount)} records have a photo`);
  if (data.consumableCount) lines.push(`${count(data.consumableCount)} consumables tracked`);

  return lines;
}

export default function AllItemsHeaderTicker({ data, intervalMs = 3800 }) {
  const lines = useMemo(() => buildTickerLines(data), [data]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setActiveIndex(0), [lines]);

  useEffect(() => {
    if (lines.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % lines.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, lines.length]);

  const text = lines[activeIndex] || 'All Items standing by';

  return (
    <Ticker key={`${activeIndex}-${text}`} aria-label={lines.join('. ')}>
      {text}
    </Ticker>
  );
}
