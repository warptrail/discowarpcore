import OperationsConsoleControls from './OperationsConsoleControls';
import * as S from './OperationsControlConsole.styles';

// Keep the decorative palette stable for the page's lifetime, including count updates.
const railGradients = [32, 190, 254, 160].map((baseHue) => {
  const hue = baseHue + Math.random() * 12 - 6;
  return `linear-gradient(90deg, hsl(${hue} 65% 64%), hsl(${hue + 28} 65% 68%))`;
});

export default function OperationsControlConsole({
  totalBoxes, totalItems, orphanedCount,
  viewMode, onViewModeChange, quickPanel, onToggleBox, onToggleItem, children,
}) {
  const metrics = [
    { count: totalBoxes, label: totalBoxes === 1 ? 'Box' : 'Boxes', tone: 'cyan' },
    { count: totalItems, label: totalItems === 1 ? 'Item' : 'Items', tone: 'amber' },
    { count: orphanedCount, label: orphanedCount === 1 ? 'Item adrift' : 'Items adrift', tone: 'violet' },
  ];

  return <S.Console role="group" aria-label="Operations control console">
    <OperationsConsoleControls
      viewMode={viewMode} onViewModeChange={onViewModeChange} quickPanel={quickPanel}
      onToggleBox={onToggleBox} onToggleItem={onToggleItem}
    />
    <S.Summary aria-label="Inventory totals" aria-live="polite">
      {metrics.map(({ count, label, tone }) => <S.Metric key={tone} $tone={tone}>
        <dt>{label}</dt><dd>{count}</dd>
      </S.Metric>)}
    </S.Summary>
    {children}
    <S.SpectrumRail aria-hidden="true">
      {railGradients.map((gradient, index) => <S.SpectrumSegment key={index} $gradient={gradient} />)}
    </S.SpectrumRail>
  </S.Console>;
}
