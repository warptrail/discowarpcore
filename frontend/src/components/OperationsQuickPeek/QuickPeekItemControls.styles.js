import styled, { css } from 'styled-components';

// One segmented surface, matching the shared inventory sort/filter controls.
export const Toolbar = styled.div`
  position: relative; display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
  min-width: 0; max-width: 100%; padding: 2px; gap: 2px;
  border: 1px solid var(--dw-border); border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  ${({ $header }) => $header && css`
    width: 100%; box-sizing: border-box; flex-wrap: nowrap;
    box-shadow: inset 0 1px 0 rgba(230, 237, 243, .05);
  `}
  ${({ $embedded }) => $embedded && css`
    flex-wrap: nowrap; flex: 0 0 auto; max-width: none;
    padding: 0; border: 0; border-radius: 0; background: transparent;
  `}
`;

export const Divider = styled.span`
  flex: 0 0 auto; width: 1px; height: 18px; margin: 0 1px;
  background: var(--dw-border);
`;

export const Button = styled.button`
  display: grid; place-items: center; flex: 0 0 auto;
  min-width: 44px; height: 44px; padding: 0 6px;
  border: 0; border-radius: 2px; background: transparent;
  color: var(--dw-text-secondary); font: 400 .75rem/1 var(--dw-font-ui);
  cursor: pointer; touch-action: manipulation;
  &[data-quick-peek-drag-handle] { touch-action: none; }
  transition: color 160ms ease, background 160ms ease;
  svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  &[aria-expanded='true'], &[aria-pressed='true'] { color: var(--dw-cyan); background: rgba(113, 210, 255, .12); }
  &[data-control='deck'][aria-pressed='true'] { color: var(--dw-coral); background: rgba(255, 141, 142, .12); }
  &[data-control='notes'] { color: var(--box-primary, var(--dw-text-secondary)); }
  &[data-control='notes'][aria-expanded='true'] { color: var(--box-primary, var(--dw-cyan)); background: rgba(var(--box-primary-rgb, 113, 210, 255), .18); box-shadow: inset 0 0 0 1px var(--box-primary), 0 0 10px rgba(var(--box-primary-rgb, 113, 210, 255), .3); }
  &:hover:not(:disabled) { color: var(--dw-cyan); background: rgba(113, 210, 255, .08); }
  &&:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  &:disabled { opacity: .38; cursor: not-allowed; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

export const FullItemButton = styled(Button)`
  ${({ $embedded }) => $embedded && css`
    @media (max-width: 360px) { display: none; }
  `}
`;

export const CompactFullItemButton = styled(Button)`
  display: none;
  @media (max-width: 360px) { display: flex; gap: 8px; width: 100%; }
`;

export const PlacementPopover = styled.div`
  position: absolute; z-index: 20; top: calc(100% + 6px); left: 50%;
  width: min(340px, calc(100vw - 24px)); overflow: auto; overscroll-behavior: contain;
  box-sizing: border-box;
  padding: 10px; border: 1px solid var(--box-primary, var(--dw-border)); border-radius: 12px 12px 10px 10px;
  background: #101923; box-shadow: 0 10px 24px rgba(0, 0, 0, .45), 0 0 12px rgba(var(--box-primary-rgb, 113, 210, 255), .12);
  transform: translateX(-50%); scrollbar-width: thin;
`;

export const SettingsRail = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px; padding: 2px; min-width: 0;
  border: 1px solid var(--dw-border); border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
`;

export const ReportOptions = styled.div`
  display: flex; flex-wrap: wrap; gap: 2px; min-width: 0;
`;

export const ActivityRail = styled(SettingsRail)`
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 4px;
`;
