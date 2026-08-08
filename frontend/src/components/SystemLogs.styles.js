import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { MOBILE_BREAKPOINT, MOBILE_CONTROL_MIN_HEIGHT } from '../styles/tokens';

const C = {
  bg: '#080d11',
  panel: '#0b1218',
  line: 'rgba(128, 218, 218, 0.2)',
  lineStrong: 'rgba(128, 218, 218, 0.42)',
  text: '#d7e4e5',
  dim: 'rgba(215, 228, 229, 0.56)',
  teal: '#7de0d5',
  lilac: '#c4b4ef',
  amber: '#e4bd7b',
  red: '#ee9b9b',
};

const mono = css`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
`;

const focus = css`
  &:focus-visible {
    outline: 1px solid ${C.lilac};
    outline-offset: 3px;
  }
`;

export const PageShell = styled.section`
  ${mono};
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  color: ${C.text};
`;

export const IntroPanel = styled.section`
  border: 1px solid ${C.lineStrong};
  border-radius: 4px 4px 0 0;
  background: ${C.bg};
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.025);
  padding: 0.62rem 0.72rem;
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
`;

export const TitlePip = styled.span`
  color: ${C.teal};
  font-size: 0.78rem;
`;

export const Title = styled.h2`
  margin: 0;
  color: ${C.text};
  font-size: clamp(0.95rem, 2vw, 1.08rem);
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
`;

export const Subtitle = styled.p`
  margin: 0 0 0 2rem;
  color: ${C.dim};
  font-size: 0.68rem;
  line-height: 1.35;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
`;

export const CountReadout = styled.span`
  color: ${C.teal};
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
`;

const terminalButton = css`
  ${mono};
  ${focus};
  min-height: 34px;
  border: 0;
  border-left: 1px solid ${C.lineStrong};
  border-radius: 0;
  background: transparent;
  color: ${C.dim};
  padding: 0 0.65rem;
  cursor: pointer;
  font-size: 0.67rem;
  letter-spacing: 0.035em;
  text-transform: uppercase;

  &:hover:not(:disabled) { color: ${C.teal}; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  }
`;

export const ExportButton = styled.button`${terminalButton}`;

export const ExportError = styled.div`
  margin-top: 0.35rem;
  color: ${C.red};
  font-size: 0.7rem;
`;

export const StreamNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.1rem;
  overflow-x: auto;
  border-bottom: 1px solid ${C.line};
  padding: 0.2rem 0.1rem 0.42rem;
`;

export const StreamButton = styled.button`
  ${mono};
  ${focus};
  min-height: 36px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: ${({ $active }) => ($active ? C.teal : C.dim)};
  padding: 0 0.2rem;
  cursor: pointer;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-align: left;
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
`;

export const RetryButton = styled.button`${terminalButton}`;

export const FeedPanel = styled.section`
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${C.lineStrong};
  border-radius: 0;
  background: ${C.bg};
`;

export const TerminalHeader = styled.div`
  display: grid;
  grid-template-columns: 12.5rem 10rem minmax(0, 1fr);
  gap: 0.7rem;
  border-bottom: 1px solid ${C.lineStrong};
  background: #0c151c;
  padding: 0.34rem 0.62rem;
  color: ${C.dim};
  font-size: 0.6rem;
  letter-spacing: 0.08em;

  @media (max-width: 760px) { display: none; }
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
  font-size: 0.7rem;
  line-height: 1.32;

  &:hover { background: #0c151b; }
  &:last-child { border-bottom: 0; }

  @media (prefers-reduced-motion: no-preference) {
    transition: background 180ms ease;
  }

  @media (max-width: 760px) {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.18rem 0.6rem;
    padding: 0.52rem 0.55rem;
  }
`;

export const Timestamp = styled.time`
  color: ${C.dim};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const EventCode = styled.span`
  color: ${C.lilac};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 760px) { text-align: right; }
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
  font-size: 0.66rem;
  overflow-wrap: anywhere;
`;

export const DispositionMeta = styled.div`
  display: flex;
  gap: 0.3rem 0.9rem;
  flex-wrap: wrap;
  margin: 0.18rem 0 0 1.6rem;
  color: ${C.amber};
  font-size: 0.65rem;

  span { overflow-wrap: anywhere; }
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
  font-size: 0.66rem;
  letter-spacing: 0.055em;
  text-transform: uppercase;
`;
