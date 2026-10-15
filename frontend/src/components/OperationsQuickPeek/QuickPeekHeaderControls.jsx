import * as Controls from './QuickPeekItemControls.styles';

// Navigation and item actions share one rail, but keep their existing controllers.
export default function QuickPeekHeaderControls({
  itemControls, itemFocused, isAdrift, expanded, docked, onReturnToItems,
  onToggleExpanded, onClose, onPointerDown, onPointerUp, onPointerCancel,
  embedded = false,
}) {
  return <Controls.Toolbar $header={!embedded} $embedded={embedded} role="group" aria-label="Quick Peek controls"
    onPointerDown={(event) => event.stopPropagation()}
    onPointerUp={(event) => event.stopPropagation()}
    onPointerCancel={(event) => event.stopPropagation()}>
    {itemFocused && onReturnToItems ? <>
      <Controls.Button type="button" aria-label={isAdrift ? 'Return to unboxed item list' : 'Return to box item list'}
        title="Back to items" onClick={onReturnToItems}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h18" /></svg>
      </Controls.Button>
      <Controls.Divider aria-hidden="true" />
    </> : null}
    {itemControls}
    {itemControls ? <Controls.Divider aria-hidden="true" /> : null}
    {!docked ? <Controls.Button type="button" data-quick-peek-drag-handle
      aria-label={expanded ? 'Collapse box quick peek' : 'Expand box quick peek'}
      aria-expanded={expanded} title={expanded ? 'Collapse panel · drag to resize' : 'Expand panel · drag to resize'}
      onClick={onToggleExpanded}
      onPointerDown={(event) => { event.stopPropagation(); onPointerDown?.(event); }}
      onPointerUp={(event) => { event.stopPropagation(); onPointerUp?.(event); }}
      onPointerCancel={(event) => { event.stopPropagation(); onPointerCancel?.(event); }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={expanded ? 'M4 9h5V4M20 15h-5v5M9 9 3 3m12 12 6 6' : 'M9 3H3v6m12 12h6v-6M3 3l7 7m11 11-7-7'} />
      </svg>
    </Controls.Button> : null}
    <Controls.Button type="button" aria-label={docked ? 'Close box inspector' : 'Close box quick peek'}
      title="Close panel" onClick={onClose}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
    </Controls.Button>
  </Controls.Toolbar>;
}
