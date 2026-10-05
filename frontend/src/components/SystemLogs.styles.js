import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { MOBILE_BREAKPOINT } from '../styles/tokens';
import { controlStyles, panelStyles } from '../styles/primitives';

const C = {
  bg: 'var(--dw-background)',
  panel: 'var(--dw-surface)',
  line: 'var(--dw-border-soft)',
  lineStrong: 'var(--dw-border)',
  text: 'var(--dw-text)',
  dim: 'var(--dw-text-muted)',
  teal: 'var(--dw-teal)',
  lilac: 'var(--dw-violet)',
  amber: 'var(--dw-amber)',
  red: 'var(--dw-coral)',
};

const focus = css`
  &:focus-visible {
    outline: 1px solid ${C.lilac};
    outline-offset: 3px;
  }
`;

export const PageShell = styled.section`
  font-family: var(--dw-font-ui);
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  color: ${C.text};
`;

export const IntroPanel = styled.section`
  ${panelStyles};
  border-left: 4px solid var(--dw-amber);
  padding: 0.75rem;
`;

export const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const HeadingGroup = styled.div`
  display: grid;
  gap: 0.12rem;
  min-width: 0;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  align-items: center;
`;

export const TitlePip = styled.span`
  width: 8px;
  height: 22px;
  flex: 0 0 auto;
  border-radius: var(--dw-radius-sm);
  background: var(--dw-amber);
`;

export const Title = styled.h2`
  margin: 0;
  color: ${C.text};
  font-size: clamp(0.95rem, 2vw, 1.08rem);
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  font-size: clamp(1.1rem, 2.2vw, 1.35rem);
`;

export const Subtitle = styled.p`
  margin: 0 0 0 2rem;
  color: ${C.dim};
  font-size: 0.75rem;
  line-height: 1.35;
  margin-left: 0;
  margin-top: 0.3rem;
  color: var(--dw-text-secondary);
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
  @media (max-width: 640px) { justify-content: flex-start; gap: 0.4rem; }
`;

export const CountReadout = styled.span`
  color: ${C.teal};
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--dw-text-secondary);
`;

const terminalButton = css`
  ${controlStyles};
`;

export const ExportButton = styled.button`${terminalButton}`;

export const ExportError = styled.div`
  margin-top: 0.35rem;
  color: ${C.red};
  font-size: 0.75rem;
`;

export const StreamNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.1rem;
  overflow-x: auto;
  border-bottom: 1px solid ${C.line};
  padding: 0.2rem 0.1rem 0.42rem;
  flex-wrap: wrap;
  gap: 0.4rem;
  border-bottom: 0;
  padding: 0;
`;

export const StreamButton = styled.button`
  ${controlStyles};
  flex: 0 0 auto;
  border-left: 3px solid ${({ $active }) => $active ? C.amber : C.lineStrong};
  color: ${({ $active }) => $active ? C.amber : C.text};
  background: ${({ $active }) => $active ? 'var(--dw-surface-raised)' : C.panel};
`;

export const StatePanel = styled.section`
  border: 1px solid ${C.line};
  border-radius: 0;
  background: ${C.panel};
  padding: 0.72rem;
  color: ${({ $tone }) => ($tone === 'error' ? C.red : $tone === 'muted' ? C.dim : C.text)};
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border-radius: var(--dw-radius);
  flex-wrap: wrap;
`;

export const RetryButton = styled.button`${terminalButton}`;

export const FeedPanel = styled.section`
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${C.lineStrong};
  border-radius: 0;
  background: ${C.bg};
  border-color: var(--dw-border-soft);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
`;

export const TerminalHeader = styled.div`
  display: grid;
  grid-template-columns: 12.5rem 10rem minmax(0, 1fr);
  gap: 0.7rem;
  border-bottom: 1px solid ${C.lineStrong};
  background: var(--dw-surface);
  padding: 0.34rem 0.62rem;
  color: ${C.dim};
  font-size: 0.75rem;
  letter-spacing: 0;

  @media (max-width: 760px) { display: none; }
  color: var(--dw-text-secondary);
  font-family: var(--dw-font-data);
  font-size: 0.68rem;
`;

export const FeedList = styled.div`display: grid;`;

export const EntryRow = styled.article`
  display: grid;
  grid-template-columns: 12.5rem 10rem minmax(0, 1fr);
  gap: 0.7rem;
  min-width: 0;
  padding: 0.42rem 0.62rem;
  border-bottom: 1px solid ${C.line};
  background: ${C.bg};
  font-size: 0.75rem;
  line-height: 1.32;

  &:hover { background: var(--dw-surface); }
  &:last-child { border-bottom: 0; }

  @media (prefers-reduced-motion: no-preference) {
    transition: background 180ms ease;
  }

  @media (max-width: 760px) {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.18rem 0.6rem;
    padding: 0.52rem 0.55rem;
  }
  background: var(--dw-surface);
  padding-block: 0.65rem;
  font-size: 0.82rem;
  line-height: 1.45;
  @media (max-width: 360px) { grid-template-columns: minmax(0, 1fr); }
`;

export const Timestamp = styled.time`
  color: ${C.dim};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  font-size: 0.75rem;
`;

export const EventCode = styled.span`
  color: ${C.lilac};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 760px) { text-align: right; }
  font-family: var(--dw-font-data);
  font-size: 0.7rem;
  @media (max-width: 360px) { text-align: left; }
`;

export const EntryPrimary = styled.div`
  min-width: 0;
  color: ${C.text};

  @media (max-width: 760px) { grid-column: 1 / -1; }
`;

export const TreeGlyph = styled.span`
  margin-right: 0.42rem;
  color: ${C.teal};
`;

const summary = css`
  color: ${C.text};
  font-weight: 650;
  overflow-wrap: anywhere;
`;

export const EntrySummaryLink = styled(Link)`
  ${summary};
  ${focus};
  text-decoration: none;
  border-bottom: 1px dotted ${C.lineStrong};
  &:hover { color: ${C.teal}; }
`;

export const EntrySummaryText = styled.span`${summary};`;

export const SecondaryText = styled.div`
  margin: 0.14rem 0 0 1.6rem;
  color: ${C.dim};
  font-size: 0.75rem;
  overflow-wrap: anywhere;
  margin-left: 0;
  color: var(--dw-text-secondary);
`;

export const DispositionMeta = styled.div`
  display: flex;
  gap: 0.3rem 0.9rem;
  flex-wrap: wrap;
  margin: 0.18rem 0 0 1.6rem;
  color: ${C.amber};
  font-size: 0.75rem;

  span { overflow-wrap: anywhere; }
  margin-left: 0;
`;

export const FeedFooter = styled.div`
  min-height: 48px;
  border-top: 1px solid ${C.lineStrong};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
`;

export const LoadMoreButton = styled.button`
  ${terminalButton};
  border-left: 0;
  color: ${C.teal};
`;

export const EndState = styled.div`
  color: ${C.dim};
  font-size: 0.75rem;
  letter-spacing: 0;
  text-transform: none;
`;
