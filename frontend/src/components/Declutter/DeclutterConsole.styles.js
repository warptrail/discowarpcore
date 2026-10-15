import styled from 'styled-components';
import * as S from './Declutter.styles';

// Page-level framing is quiet; the current item's card owns the luminous edge.
export const Surface = styled(S.DeclutterSurface)`
  gap: 16px;
  ${S.ReviewWorkspace} { gap: 16px; }
  ${S.StatusPanel} { padding: 24px; border: 1px solid var(--dw-border-soft);
    border-radius: 12px; background: var(--dw-background); line-height: 1.6; }
  ${S.ModeBar} { background: var(--dw-background); border-color: var(--dw-border-soft);
    border-radius: 12px; box-shadow: none; }
  ${S.QueueItem}, ${S.WorkflowCard} { border-radius: 12px; background: var(--dw-background);
    border-color: var(--dw-border-soft); box-shadow: inset 0 1px 0 rgba(255,255,255,.035); }
  ${S.ItemName}, ${S.ItemNameLink} { font-weight: 750; letter-spacing: -.02em; }
  ${S.WorkflowLaneTitle} { color: var(--dw-text); }
  ${S.SystemCollectionButton} { border-radius: 12px; border-color: var(--dw-border-soft);
    background: var(--dw-background); box-shadow: none; }
  ${S.ActionConsole}, ${S.ProgressDashboard} { border-radius: 14px;
    background: var(--dw-background); border: 1px solid rgba(var(--declutter-accent-rgb),.3);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.06); }
  ${S.ActionConsoleHeading}, ${S.ProgressHeader} { background: transparent; }
  ${S.ActionConsoleHeading} h2 { font-size: clamp(1.3rem,3vw,1.8rem); letter-spacing: -.025em; }
  ${S.DashboardPanel} { background: transparent; border-color: var(--dw-border-soft); box-shadow: none; }
  ${S.ProgressStatLink} { background: var(--dw-surface); border-radius: 10px; box-shadow: none; }
  ${S.DiscussionSheet} { border-radius: 18px 18px 14px 14px; background: var(--dw-background);
    border: 1px solid rgba(var(--box-primary-rgb),.7); box-shadow: 0 0 24px rgba(var(--box-primary-rgb),.16),inset 0 1px 0 rgba(255,255,255,.1); }
  ${S.DiscussionHeader} { background: transparent; border-color: rgba(var(--box-primary-rgb),.2); }
  ${S.DiscussionTitle} { font-weight: 800; letter-spacing: -.025em; }
  ${S.DiscussionClose} { width: 44px; height: 44px; background: transparent; border: 0; }
  ${S.DiscussionThumb}, ${S.DiscussionRecommendation} { border-radius: 10px; background: var(--dw-surface); }
  @media (max-width: 700px) { gap: 12px; }
`;

export const Navigation = styled.div`
  min-width: 0; display: grid; grid-template-columns: minmax(0,1fr);
  align-items: center; gap: 0; padding: 5px 16px 5px 5px;
  border: 1px solid rgba(var(--declutter-accent-rgb),.28); border-radius: 14px;
  background: linear-gradient(110deg,rgba(var(--declutter-accent-rgb),.04),transparent), var(--dw-background);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  @media (max-width: 900px) { grid-template-columns: minmax(0,1fr); gap: 0; padding: 4px;
    > [role='status'] { padding: 8px 10px 5px; border-top: 1px solid var(--dw-border-soft); } }
`;
export const Modes = styled.nav`
  display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); min-width: 0; gap: 2px;
`;
export const Mode = styled.button`
  min-width: 0; min-height: 52px; display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 8px 10px; border: 0; border-radius: 10px; background: transparent;
  color: var(--dw-text-secondary); font: 500 .85rem/1.2 var(--dw-font-ui); cursor: pointer;
  svg { width: 18px; height: 18px; flex-shrink: 0; }
  &[aria-pressed='true'] { color: var(--declutter-accent);
    background: linear-gradient(to top,rgba(var(--declutter-accent-rgb),.13),rgba(var(--declutter-accent-rgb),.02));
    box-shadow: inset 0 -2px 0 var(--declutter-accent); }
  &:hover { color: var(--dw-text); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -3px; }
  @media (max-width: 540px) { flex-direction: column; gap: 4px; padding: 6px 2px;
    font-size: .75rem; min-height: 62px; }
`;
export const ModeLabel = styled.span`display: inline-flex; align-items: center; gap: 6px;`;
export const Count = styled.span`
  color: inherit; font: 500 .75rem/1.2 var(--dw-font-data); font-variant-numeric: tabular-nums;
`;
export const Health = styled(S.ProgressText)`
  font-size: .75rem; max-width: 270px; line-height: 1.4; color: var(--dw-text-muted);
  @media (max-width: 900px) { max-width: none; }
`;

export const Queue = styled(S.QueueProgress)`
  gap: 16px; padding: 16px; border: 1px solid var(--dw-border-soft); border-radius: 12px;
  background: var(--dw-background); box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  ${S.QueueProgressTop} { align-items: center; color: var(--dw-text-secondary); font-size: .85rem; }
  ${S.QueueProgressButton} { display: inline-flex; align-items: center; justify-content: center;
    gap: 5px; min-height: 44px; padding: 0 8px; margin: -10px -8px;
    border: 0; font: 500 .85rem/1.2 var(--dw-font-data); }
  ${S.QueueScoreboard} { gap: 12px; }
  ${S.QueuePlayerRow} { grid-template-columns: minmax(0,1fr); gap: 8px; }
  ${S.QueuePlayerLabel} { min-height: 20px; font-weight: 600; font-size: .8rem;
    color: ${({ $player }) => $player === 'laserfox' ? 'var(--dw-violet)' : 'var(--dw-cyan)'}; }
  ${S.QueueSegments} { gap: 3px; }
  ${S.QueueSegment} { height: 5px; border: 0; }
  @media (max-width: 1099px) { gap: 12px; padding: 12px 16px;
    ${S.QueueScoreboard} { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px; } }
`;
export const PlayerHeading = styled.div`
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
`;
export const PlayerName = styled(S.QueuePlayerLabel)`
  && { color: ${({ $player }) => $player === 'laserfox' ? 'var(--dw-violet)' : 'var(--dw-cyan)'}; }
`;
export const PlayerCount = styled.span`
  color: var(--dw-text-muted); font: 400 .72rem/1.3 var(--dw-font-data); white-space: nowrap;
`;
