import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

const LCARS = {
  bg: '#0b0f13',
  panel: '#14191e',
  panelAlt: '#10161c',
  line: 'rgba(255,255,255,0.1)',
  lineStrong: 'rgba(127,215,255,0.28)',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  textMuted: 'rgba(230,237,243,0.54)',
  root: '#7fd7ff',
  teal: '#4cc6c1',
  amber: '#e8b15c',
  coral: '#f08a7b',
  lilac: '#a7b6ff',
  green: '#64bc97',
};

const decisionTone = (tone = 'pending') => {
  if (tone === 'keep') return LCARS.green;
  if (tone === 'toss') return LCARS.coral;
  if (tone === 'donate') return LCARS.lilac;
  if (tone === 'sell') return LCARS.amber;
  if (tone === 'gift') return '#ff79c6';
  if (tone === 'unsure') return LCARS.root;
  return LCARS.textDim;
};

const sheetReveal = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.992); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const panelBase = css`
  border: 1px solid ${LCARS.line};
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.01)),
    ${LCARS.panel};
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.02),
    0 8px 24px rgba(0, 0, 0, 0.24);
`;

const controlField = css`
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  background: rgba(9, 14, 20, 0.96);
  color: ${LCARS.text};
  min-height: 34px;
  padding: 0.42rem 0.52rem;
  font-size: 0.82rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  outline: none;

  &:focus {
    border-color: rgba(127, 215, 255, 0.74);
    box-shadow: 0 0 0 1px rgba(127, 215, 255, 0.34);
  }
`;

export const PageShell = styled.section`
  display: grid;
  gap: 0.88rem;
  color: ${LCARS.text};
`;

export const DeclutterSurface = styled(PageShell)`
  --declutter-accent: ${({ $player }) => ($player === 'laserfox' ? '#b875ff' : '#38c9ff')};
  --declutter-accent-rgb: ${({ $player }) => ($player === 'laserfox' ? '184, 117, 255' : '56, 201, 255')};
  min-height: 100%;
  padding: 0.58rem;
  border: 1px solid rgba(var(--declutter-accent-rgb), 0.28);
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 0%, rgba(var(--declutter-accent-rgb), 0.13), transparent 42%),
    linear-gradient(180deg, rgba(var(--declutter-accent-rgb), 0.045), rgba(8, 12, 17, 0.12));
  box-shadow: inset 0 0 34px rgba(var(--declutter-accent-rgb), 0.035);
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.38rem;
    border-radius: 9px;
  }
`;

export const PlayerDock = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.15rem 0 0.05rem;
`;

export const PageHeader = styled.header`
  ${panelBase};
  display: grid;
  gap: 0.54rem;
  padding: 0.88rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.66rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const HeaderTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: start;
  gap: 0.66rem;
`;

export const Eyebrow = styled.div`
  color: ${LCARS.root};
  font-size: 0.66rem;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const Title = styled.h1`
  margin: 0.12rem 0 0;
  font-size: clamp(1.22rem, 2.4vw, 1.76rem);
  line-height: 1.06;
  letter-spacing: 0;
`;

export const HeaderMeta = styled.div`
  color: ${LCARS.textDim};
  font-size: 0.86rem;
  line-height: 1.4;
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    justify-content: stretch;
  }
`;

export const PlayerPicker = styled.div`
  display: grid;
  width: min(100%, 430px);
`;

export const PlayerChoices = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.28rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const PlayerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.24rem;
  min-height: 44px;
  border: 1px solid ${({ $active, $player }) => {
    if (!$active) return 'rgba(102, 167, 212, 0.34)';
    return $player === 'laserfox' ? 'rgba(184, 117, 255, 0.95)' : 'rgba(56, 201, 255, 0.95)';
  }};
  border-radius: 7px;
  background: ${({ $active, $player }) => {
    if (!$active) return 'rgba(14, 24, 34, 0.82)';
    return $player === 'laserfox'
      ? 'linear-gradient(135deg, rgba(70, 31, 90, 0.96), rgba(30, 18, 47, 0.96))'
      : 'linear-gradient(135deg, rgba(12, 75, 77, 0.96), rgba(10, 38, 48, 0.96))';
  }};
  color: ${LCARS.text};
  padding: 0.34rem 0.5rem;
  cursor: pointer;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
  }
`;

export const PlayerIcon = styled.span`
  font-size: 1.35rem;
  line-height: 1;
`;

export const PlayerIdentity = styled.span`
  display: grid;
  min-width: 70px;
  text-align: left;
`;

export const PlayerName = styled.span`
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const PlayerNotification = styled.span`
  display: inline-grid;
  min-width: 1.28rem;
  height: 1.28rem;
  place-items: center;
  padding: 0 0.26rem;
  border: 1px solid ${({ $player }) => (
    $player === 'laserfox' ? 'rgba(216, 166, 255, 0.78)' : 'rgba(115, 255, 244, 0.78)'
  )};
  border-radius: 4px;
  background: ${({ $player }) => (
    $player === 'laserfox' ? 'rgba(184, 117, 255, 0.18)' : 'rgba(76, 198, 193, 0.18)'
  )};
  color: ${({ $player }) => ($player === 'laserfox' ? '#e3c5ff' : '#a5fff7')};
  font-size: 0.62rem;
  font-weight: 850;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 0 8px ${({ $player }) => (
    $player === 'laserfox' ? 'rgba(184, 117, 255, 0.22)' : 'rgba(76, 198, 193, 0.22)'
  )};
`;

export const OnlineDot = styled.span`
  width: 7px;
  height: 7px;
  margin-left: auto;
  border-radius: 50%;
  background: ${({ $player }) => ($player === 'laserfox' ? '#b875ff' : LCARS.teal)};
  box-shadow: ${({ $player }) =>
    $player === 'laserfox' ? '0 0 8px rgba(184, 117, 255, 0.82)' : '0 0 8px rgba(76, 198, 193, 0.8)'};
`;

export const Button = styled.button`
  min-height: 34px;
  border-radius: 4px;
  border: 1px solid
    ${({ $tone = 'default' }) =>
      $tone === 'primary'
        ? 'rgba(100, 188, 151, 0.82)'
        : $tone === 'danger'
          ? 'rgba(240, 138, 123, 0.76)'
          : $tone === 'warning'
            ? 'rgba(232, 177, 92, 0.72)'
            : 'rgba(102, 167, 212, 0.56)'};
  background:
    ${({ $tone = 'default' }) =>
      $tone === 'primary'
        ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96), rgba(16, 51, 42, 0.96))'
        : $tone === 'danger'
          ? 'linear-gradient(180deg, rgba(78, 30, 31, 0.96), rgba(48, 20, 24, 0.96))'
          : $tone === 'warning'
            ? 'linear-gradient(180deg, rgba(84, 55, 14, 0.96), rgba(57, 39, 13, 0.96))'
            : 'rgba(14, 24, 34, 0.95)'};
  color: ${({ $tone = 'default' }) => ($tone === 'default' ? '#cfefff' : '#e8fff5')};
  font-size: 0.68rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.085em;
  padding: 0 0.66rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  cursor: pointer;

  &:disabled {
    opacity: 0.54;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.52);
    outline-offset: 1px;
  }
`;

export const LinkButton = styled(Link)`
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  border: 1px solid rgba(102, 167, 212, 0.56);
  background: rgba(14, 24, 34, 0.95);
  color: #cfefff;
  font-size: 0.68rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.085em;
  padding: 0 0.66rem;
  text-decoration: none;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const FormPanel = styled.form`
  ${panelBase};
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.4fr) auto;
  gap: 0.52rem;
  align-items: end;
  padding: 0.78rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

export const FieldLabel = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.62rem;
  font-weight: 820;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const Input = styled.input`
  ${controlField};
`;

export const Textarea = styled.textarea`
  ${controlField};
  min-height: 68px;
  resize: vertical;
`;

export const Select = styled.select`
  ${controlField};
`;

export const StatusPanel = styled.div`
  ${panelBase};
  padding: 0.78rem;
  color: ${LCARS.textDim};
  font-size: 0.86rem;
  border-color: rgba(var(--declutter-accent-rgb), 0.28);
`;

export const ErrorState = styled(StatusPanel)`
  border-color: rgba(240, 138, 123, 0.48);
  color: #ffd3cf;
`;

export const SessionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.78rem;
`;

export const SessionCard = styled.article`
  ${panelBase};
  display: grid;
  gap: 0.62rem;
  padding: 0.78rem;
  border-left: 4px solid
    ${({ $status }) => ($status === 'archived' ? LCARS.textMuted : LCARS.teal)};
`;

export const SessionCardTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: start;
`;

export const SessionName = styled.h2`
  margin: 0;
  color: ${LCARS.text};
  font-size: 1rem;
  line-height: 1.2;
`;

export const SessionDescription = styled.p`
  margin: 0;
  color: ${LCARS.textDim};
  font-size: 0.82rem;
  line-height: 1.4;
`;

export const CountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.34rem;

  @media (max-width: 420px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const CountCell = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 0.34rem 0.42rem;
  background: rgba(5, 10, 16, 0.34);
`;

export const CountValue = styled.div`
  color: ${({ $tone = 'pending' }) => decisionTone($tone)};
  font-size: 0.98rem;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
`;

export const CountLabel = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  justify-content: flex-end;
`;

export const ModeBar = styled.div`
  ${panelBase};
  display: flex;
  flex-wrap: wrap;
  gap: 0.48rem;
  justify-content: space-between;
  align-items: center;
  padding: 0.62rem 0.72rem;
  border-color: rgba(var(--declutter-accent-rgb), 0.36);
`;

export const ModeGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem;
  align-items: center;
`;

export const ModeButton = styled(Button)`
  border-color: ${({ $active }) =>
    $active ? 'rgba(var(--declutter-accent-rgb), 0.92)' : 'rgba(102, 167, 212, 0.42)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(var(--declutter-accent-rgb), 0.25), rgba(var(--declutter-accent-rgb), 0.1))'
      : 'rgba(14, 24, 34, 0.82)'};
`;

export const ModeCount = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.3rem;
  height: 1.3rem;
  margin-left: 0.22rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
  font-variant-numeric: tabular-nums;
`;

export const ProgressText = styled.div`
  display: flex;
  align-items: center;
  gap: 0.38rem;
  color: ${({ $health }) => {
    if ($health === 'healthy') return '#72d7a8';
    if ($health === 'error') return '#ff8f86';
    return LCARS.textDim;
  }};
  font-size: 0.78rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;

  &::before {
    display: ${({ $health }) => ($health ? 'block' : 'none')};
    width: 0.48rem;
    height: 0.48rem;
    flex: 0 0 auto;
    border-radius: 50%;
    background: ${({ $health }) => ($health === 'error' ? '#ff6f66' : '#64d49d')};
    box-shadow: ${({ $health }) => (
      $health === 'error'
        ? '0 0 8px rgba(255, 111, 102, 0.68)'
        : '0 0 8px rgba(100, 212, 157, 0.58)'
    )};
    content: '';
  }
`;

export const DecisionPill = styled.span`
  display: inline-flex;
  align-items: center;
  width: max-content;
  border-radius: 999px;
  border: 1px solid ${({ $tone = 'pending' }) => `${decisionTone($tone)}80`};
  background: ${({ $tone = 'pending' }) => `${decisionTone($tone)}22`};
  color: ${({ $tone = 'pending' }) => decisionTone($tone)};
  padding: 0.16rem 0.5rem;
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const QueueGrid = styled.div`
  display: grid;
  gap: 0.58rem;
`;

export const QueueItem = styled.article`
  ${panelBase};
  display: grid;
  grid-template-columns: 72px minmax(0, 1.3fr) minmax(160px, 0.9fr) auto;
  gap: 0.64rem;
  align-items: center;
  padding: 0.62rem;
  border-color: rgba(var(--declutter-accent-rgb), 0.26);

  ${({ $compact }) => $compact && css`
    grid-template-columns: 34px minmax(0, 1fr) minmax(132px, auto) auto;
    gap: 0.34rem;
    padding: 0.28rem 0.34rem;
    min-height: 42px;
    align-items: center;

    > div:nth-child(2) {
      min-width: 0;
      overflow: hidden;
      font-size: 0.74rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `}

  ${({ $cardView }) => $cardView && css`
    grid-template-columns: 54px minmax(0, 1fr) minmax(142px, 0.78fr);
    gap: 0.48rem;
    min-height: 88px;
    padding: 0.46rem;
    align-items: center;

    > div:nth-child(2) {
      display: grid;
      align-content: center;
      min-width: 0;
    }
  `}

  @media (max-width: 820px) {
    grid-template-columns: ${({ $compact }) => (
      $compact ? '32px minmax(0, 1fr) minmax(126px, auto)' : '64px minmax(0, 1fr)'
    )};
    align-items: start;
  }
`;

export const ThumbFrame = styled.div`
  width: ${({ $compact, $cardView }) => ($compact ? '30px' : $cardView ? '54px' : '64px')};
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(127, 215, 255, 0.22);
  background: rgba(7, 12, 18, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${LCARS.textMuted};

  ${({ $cardView }) => $cardView && css`
    height: 54px;
    align-self: center;
  `}
`;

export const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const ItemNameLink = styled(Link)`
  color: ${LCARS.text};
  font-weight: 780;
  text-decoration: none;
  line-height: 1.2;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

export const ItemName = styled.div`
  color: ${LCARS.text};
  font-weight: 780;
  line-height: 1.2;
`;

export const ItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem 0.52rem;
  margin-top: 0.26rem;
  color: ${LCARS.textDim};
  font-size: 0.78rem;
`;

export const CandidateMetaGrid = styled.div`
  display: ${({ $compact }) => ($compact ? 'none' : 'grid')};
  grid-template-columns: repeat(3, minmax(0, max-content));
  gap: 0.32rem 0.72rem;
  margin-top: 0.42rem;

  @media (max-width: 820px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.28rem;
  }

  ${({ $cardView }) => $cardView && css`
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.72fr) minmax(0, 0.78fr);
    gap: 0.2rem 0.38rem;
    margin-top: 0.28rem;

    @media (max-width: 480px) {
      grid-template-columns: 1fr 1fr;
    }
  `}
`;

export const CandidateMetaGroup = styled.div`
  display: grid;
  gap: 0.14rem;
  min-width: 0;

`;

export const CandidateMetaLabel = styled.span`
  color: rgba(156, 191, 205, 0.5);
  font: 780 0.5rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const CandidateMetaValue = styled.span`
  min-width: 0;
  color: ${({ $tone }) => (
    $tone === 'location' ? '#f0c77b' : $tone === 'gone' ? '#f08a7b' : LCARS.textDim
  )};
  font-size: 0.72rem;
  line-height: 1.25;
  overflow-wrap: anywhere;

  ${({ $cardView }) => $cardView && css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;

export const CandidateBoxLink = styled(Link)`
  display: inline-flex;
  align-items: baseline;
  gap: 0.34rem;
  min-width: 0;
  width: fit-content;
  color: #cceeed;
  font-size: 0.72rem;
  line-height: 1.2;
  text-decoration: none;

  ${({ $cardView }) => $cardView && css`
    width: 100%;
    gap: 0.18rem;
    overflow: hidden;
    white-space: nowrap;

    > span:last-child {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `}

  &:hover,
  &:focus-visible {
    color: #ffffff;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

export const CandidateBoxId = styled.span`
  color: var(--declutter-accent, ${LCARS.root});
  font: 820 0.68rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

export const CandidateWorkflow = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  padding-top: 0.52rem;
  border-top: 1px solid rgba(var(--declutter-accent-rgb), 0.14);
`;

export const HistoryWorkflowPanel = styled.section`
  display: grid;
  gap: 0.42rem;
  min-width: 0;
`;

export const HistoryWorkflowHeader = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;

  > span {
    color: var(--declutter-accent, ${LCARS.root});
    font: 850 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Liberation Mono', 'Courier New', monospace;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  small {
    color: ${LCARS.textMuted};
    font-size: 0.66rem;
  }

  @media (max-width: 560px) {
    display: grid;
    gap: 0.18rem;
  }
`;

export const HistoryWorkflowCommands = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 0.52fr);
  gap: 0.36rem;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const historyWorkflowButton = css`
  min-height: 36px;
  border-radius: 3px;
  padding: 0.32rem 0.56rem;
  font: 820 0.6rem/1.15 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.065em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`;

export const HistoryStageButton = styled.button`
  ${historyWorkflowButton};
  border: 1px solid rgba(108, 223, 197, 0.68);
  color: #cffff3;
  background: rgba(28, 101, 85, 0.22);

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: #72e4c9;
    background: rgba(28, 101, 85, 0.34);
    box-shadow: 0 0 12px rgba(108, 223, 197, 0.18);
  }
`;

export const HistoryCompleteToggle = styled.button`
  ${historyWorkflowButton};
  border: 1px solid rgba(240, 138, 123, 0.7);
  color: #ffe1da;
  background: rgba(94, 35, 41, 0.34);

  &:hover:not(:disabled),
  &:focus-visible,
  &[aria-expanded='true'] {
    outline: none;
    border-color: #f08a7b;
    background: rgba(116, 35, 41, 0.5);
  }
`;

export const HistoryWorkflowNotice = styled.div`
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 0.32rem 0.5rem;
  border-left: 2px solid ${({ $tone }) => ($tone === 'staged' ? '#72e4c9' : 'rgba(240, 199, 123, 0.62)')};
  color: ${({ $tone }) => ($tone === 'staged' ? '#cffff3' : '#e8cf9f')};
  background: ${({ $tone }) => ($tone === 'staged' ? 'rgba(28, 101, 85, 0.15)' : 'rgba(113, 82, 32, 0.12)')};
  font-size: 0.7rem;
  line-height: 1.3;
`;

export const HistoryVerificationPanel = styled.div`
  padding: 0.58rem;
  border: 1px solid rgba(240, 138, 123, 0.36);
  border-radius: 3px;
  background: rgba(28, 11, 15, 0.72);
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.26rem;
  margin-top: 0.34rem;
`;

export const TagChip = styled.span`
  border-radius: 999px;
  border: 1px solid rgba(76, 198, 193, 0.4);
  background: rgba(76, 198, 193, 0.13);
  color: #c9f2ee;
  padding: 0.12rem 0.42rem;
  font-size: 0.68rem;
`;

export const QueueContext = styled.div`
  display: grid;
  gap: 0.18rem;
  color: ${LCARS.textDim};
  font-size: 0.78rem;
  line-height: 1.3;

  @media (max-width: 820px) {
    grid-column: 2;
  }
`;

export const QueueActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem;
  justify-content: flex-end;

  @media (max-width: 820px) {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
`;

export const SystemCollectionButton = styled.button`
  ${panelBase};
  display: grid;
  gap: 0.7rem;
  width: 100%;
  margin-top: 0.2rem;
  padding: 0.85rem;
  border-color: rgba(240, 138, 123, 0.62);
  color: ${LCARS.text};
  background:
    linear-gradient(120deg, rgba(240, 138, 123, 0.14), rgba(8, 14, 20, 0.9) 52%),
    ${LCARS.panel};
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${LCARS.coral};
    box-shadow: 0 0 22px rgba(240, 138, 123, 0.15);
  }

  &:focus-visible {
    outline: 2px solid ${LCARS.coral};
    outline-offset: 2px;
  }
`;

export const SystemCollectionTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

export const SystemCollectionTitle = styled.strong`
  display: block;
  margin: 0.1rem 0 0.2rem;
  color: #ffd2cc;
  font-size: clamp(1rem, 3vw, 1.3rem);
  letter-spacing: 0.025em;
`;

export const SystemCollectionTotal = styled.span`
  display: grid;
  place-items: center;
  min-width: 2.4rem;
  min-height: 2.4rem;
  border: 1px solid ${LCARS.coral};
  border-radius: 7px;
  color: ${LCARS.coral};
  background: rgba(240, 138, 123, 0.12);
  font: 700 1rem/1 ui-monospace, monospace;
`;

export const SystemCollectionRoutes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.42rem;
    border: 1px solid rgba(240, 138, 123, 0.28);
    border-radius: 5px;
    color: ${LCARS.textDim};
    background: rgba(6, 12, 18, 0.5);
    font-size: 0.72rem;
  }

  i { font-style: normal; }
  strong { color: ${LCARS.text}; }
`;

export const SystemCollectionOpen = styled.span`
  justify-self: end;
  color: ${LCARS.coral};
  font: 700 0.68rem/1 ui-monospace, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const ActionConsole = styled.section`
  ${panelBase};
  overflow: hidden;
  border-radius: 6px;
  border-color: rgba(240, 138, 123, 0.5);
`;

export const ActionConsoleHeading = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
  background: linear-gradient(100deg, rgba(240, 138, 123, 0.15), transparent 70%);

  h2 {
    margin: 0.08rem 0 0.2rem;
    color: #ffd2cc;
    font-size: 1.15rem;
  }

  > strong {
    min-width: 2.25rem;
    padding: 0.45rem;
    border: 1px solid ${LCARS.coral};
    border-radius: 3px;
    color: ${LCARS.coral};
    text-align: center;
    font-family: ui-monospace, monospace;
  }
`;

export const ActionTableHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(150px, 1.3fr) minmax(88px, 0.6fr) minmax(150px, 1fr) minmax(180px, 1.2fr) minmax(170px, 1fr);
  gap: 0.55rem;
  padding: 0.48rem 0.7rem;
  border-top: 1px solid ${LCARS.line};
  border-bottom: 1px solid ${LCARS.line};
  color: ${LCARS.textMuted};
  background: rgba(4, 9, 14, 0.55);
  font: 700 0.62rem/1 ui-monospace, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: 820px) { display: none; }
`;

export const ActionTable = styled.div`
  display: grid;
`;

export const ActionTableRow = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.42rem 0.7rem;
  padding: 0.78rem;
  border-bottom: 1px solid ${LCARS.line};
  background: rgba(8, 13, 18, 0.22);

  &:last-child { border-bottom: 0; }

  @media (max-width: 820px) {
    gap: 0.42rem 0.58rem;
    padding: 0.68rem;
  }
`;

export const ActionItemCell = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;

  small { color: ${LCARS.textMuted}; font-size: 0.65rem; }

  @media (max-width: 820px) { grid-column: 1; }
`;

export const ActionPlanCell = styled.div`
  grid-column: 2;
  grid-row: 1;
`;

export const ActionRouteChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  width: max-content;
  padding: 0.12rem 0.42rem;
  border: 1px solid ${({ $tone = 'pending' }) => `${decisionTone($tone)}80`};
  border-radius: 3px;
  color: ${({ $tone = 'pending' }) => decisionTone($tone)};
  background: ${({ $tone = 'pending' }) => `${decisionTone($tone)}16`};
  font: 850 0.6rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const ActionLocationCell = styled.div`
  grid-column: 1 / -1;
  color: ${LCARS.textDim};
  font-size: 0.75rem;
  line-height: 1.35;

  &::before { content: 'Currently: '; color: ${LCARS.root}; }
`;

export const ActionPrimaryCell = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  align-items: stretch;
  gap: 0.42rem;
  margin-top: 0.22rem;
`;

export const ActionCompleteButton = styled.button`
  min-height: 46px;
  min-width: 0;
  border: 1px solid rgba(255, 107, 98, 0.88);
  border-radius: 3px;
  padding: 0 1rem;
  color: #ffe6e2;
  background: rgba(91, 29, 34, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
  font: 900 0.76rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;

  &:hover:not(:disabled),
  &:focus-visible {
    border-color: #ff8a80;
    background: rgba(116, 35, 41, 0.98);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.07),
      0 0 0 2px rgba(240, 138, 123, 0.15);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 187, 178, 0.78);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ActionOptionsToggle = styled.button`
  min-width: 42px;
  min-height: 46px;
  border: 1px solid rgba(127, 215, 255, 0.34);
  border-radius: 3px;
  color: rgba(214, 232, 239, 0.7);
  background: rgba(7, 13, 19, 0.86);
  font: 800 0.68rem/1 ui-monospace, monospace;
  letter-spacing: 0.08em;
  cursor: pointer;

  &:hover:not(:disabled),
  &[aria-expanded='true'],
  &:focus-visible {
    color: #e8fbff;
    border-color: rgba(76, 198, 193, 0.72);
    background: rgba(25, 57, 62, 0.46);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.72);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ActionOptionsPanel = styled.div`
  grid-column: 1 / -1;
  display: grid;
  gap: 0.62rem;
  padding: 0.68rem;
  border: 1px solid rgba(127, 215, 255, 0.2);
  border-radius: 4px;
  background: rgba(6, 11, 16, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
`;

export const ActionOptionsHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.7rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  > span {
    color: #d8edf2;
    font: 850 0.66rem/1 ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  > small {
    color: ${LCARS.textMuted};
    font-size: 0.66rem;
    text-align: right;
  }
`;

export const ActionOptionsFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.48rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

export const ActionOptionsField = styled.div`
  display: grid;
  gap: 0.28rem;
  min-width: 0;

  > span {
    color: ${LCARS.textMuted};
    font: 750 0.59rem/1 ui-monospace, monospace;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
`;

export const ActionOptionsApply = styled.button`
  min-height: 40px;
  border: 1px solid rgba(76, 198, 193, 0.45);
  border-radius: 3px;
  color: #d8fffb;
  background: rgba(22, 69, 68, 0.46);
  font: 850 0.65rem/1 ui-monospace, monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgba(76, 198, 193, 0.72);
    outline-offset: 2px;
  }
`;

export const ActionOptionsSecondary = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;
  padding-top: 0.58rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

export const ActionSecondaryButton = styled.button`
  min-height: 40px;
  border: 1px solid rgba(102, 167, 212, 0.42);
  border-radius: 3px;
  color: #cfefff;
  background: rgba(10, 19, 27, 0.94);
  font: 820 0.62rem/1 ui-monospace, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    border-color: rgba(167, 182, 255, 0.7);
    color: #f0f3ff;
  }

  &:focus-visible {
    outline: 2px solid rgba(167, 182, 255, 0.62);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ActionTodoCell = styled.div`
  display: grid;
  gap: 0.3rem;

  select {
    min-width: 0;
    padding: 0.35rem;
    border: 1px solid ${LCARS.lineStrong};
    border-radius: 5px;
    color: ${LCARS.text};
    background: #09111a;
  }

  @media (max-width: 820px) {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const ActionCommandsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;

  @media (max-width: 820px) { grid-column: 1 / -1; }
`;

export const VoteComparison = styled.div`
  display: grid;
  gap: 0.3rem;

  ${({ $compact }) => $compact && css`
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.2rem;
  `}

  ${({ $cardView }) => $cardView && css`
    align-content: center;
    gap: 0.24rem;
  `}

  @media (max-width: 820px) {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    ${({ $compact }) => $compact && css`
      grid-column: 3;
      align-self: center;
    `}
  }
`;

export const FinalFate = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.46rem;
  border: 1px solid ${({ $tone }) => `${decisionTone($tone)}dd`};
  border-radius: 6px;
  padding: 0.4rem 0.46rem;
  color: ${({ $tone }) => decisionTone($tone)};
  background: ${({ $tone }) => `${decisionTone($tone)}20`};
  box-shadow:
    0 0 0 1px ${({ $tone }) => `${decisionTone($tone)}44`},
    0 0 18px ${({ $tone }) => `${decisionTone($tone)}66`},
    inset 0 0 18px ${({ $tone }) => `${decisionTone($tone)}1f`};

  ${({ $compact }) => $compact && css`
    gap: 0.2rem;
    min-height: 18px;
    padding: 0.1rem 0.24rem;
    border-radius: 4px;

    && > span {
      font-size: 0.68rem;
    }

    && small {
      display: none;
    }

    && strong {
      font-size: 0.52rem;
      line-height: 1;
    }
  `}

  ${({ $cardView }) => $cardView && css`
    padding: 0.28rem 0.34rem;

    > span {
      font-size: 0.92rem;
    }
  `}

  > span {
    font-size: 1.2rem;
  }

  > div {
    display: grid;
  }

  small {
    color: ${LCARS.textMuted};
    font: 750 0.5rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    color: inherit;
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  @media (max-width: 820px) {
    grid-column: 1 / -1;
  }
`;

export const PlayerVote = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
  position: relative;
  border: 1px solid ${({ $tone, $winner }) => `${decisionTone($tone)}${$winner ? 'dd' : '55'}`};
  border-radius: 6px;
  background: ${({ $tone }) => `${decisionTone($tone)}12`};
  color: ${({ $tone }) => decisionTone($tone)};
  padding: 0.36rem 0.44rem;
  box-shadow: ${({ $tone, $winner }) => ($winner
    ? `0 0 0 1px ${decisionTone($tone)}44, 0 0 16px ${decisionTone($tone)}55, inset 0 0 16px ${decisionTone($tone)}18`
    : 'none')};

  ${({ $compact }) => $compact && css`
    min-height: 20px;
    gap: 0.18rem;
    padding: 0.12rem 0.24rem;
    border-radius: 4px;

    && > span {
      font-size: 0.7rem;
    }

    strong,
    ${RouteWinnerFlag} {
      display: none;
    }

    && small {
      overflow: hidden;
      font-size: 0.52rem;
      line-height: 1;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `}

  ${({ $cardView }) => $cardView && css`
    min-height: 34px;
    gap: 0.3rem;
    padding: 0.24rem 0.34rem;
    border-radius: 5px;

    > span {
      font-size: 0.9rem;
    }

    strong {
      font-size: 0.54rem;
    }

    small {
      font-size: 0.62rem;
    }
  `}

  > span {
    font-size: 1.12rem;
  }

  > div {
    display: grid;
    min-width: 0;
  }

  strong {
    color: ${LCARS.text};
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  small {
    color: ${({ $tone }) => decisionTone($tone)};
    font-size: 0.68rem;
  }
`;

export const RouteWinnerFlag = styled.em`
  margin-left: auto;
  align-self: start;
  padding: 0.12rem 0.24rem;
  border-left: 1px solid currentColor;
  color: inherit;
  font: 850 0.46rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.8;
`;

export const QueueProgress = styled.div`
  ${panelBase};
  display: grid;
  gap: 0.34rem;
  padding: 0.54rem 0.68rem;
  border-color: rgba(var(--declutter-accent-rgb), 0.32);
`;

export const QueueProgressTop = styled.div`
  display: flex;
  justify-content: space-between;
  color: var(--declutter-accent, ${LCARS.root});
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const QueueProgressButton = styled.button`
  border: 0;
  border-bottom: 1px dotted var(--declutter-accent, ${LCARS.root});
  padding: 0;
  color: var(--declutter-accent, ${LCARS.root});
  background: transparent;
  font: inherit;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${LCARS.text};
  }
`;

export const QueueOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: start center;
  padding: 7.5rem 1rem 1rem;
  background: rgba(3, 7, 11, 0.62);
`;

export const QueuePopover = styled.div`
  width: min(430px, 100%);
  max-height: min(62vh, 520px);
  overflow: auto;
  border: 1px solid rgba(127, 215, 255, 0.58);
  border-radius: 8px;
  background: ${LCARS.panelAlt};
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.58), 0 0 24px rgba(76, 198, 193, 0.12);
`;

export const QueuePopoverHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.7rem 0.75rem 0.58rem;
  border-bottom: 1px solid ${LCARS.line};
`;

export const QueuePopoverTitle = styled.strong`
  display: block;
  margin-top: 0.18rem;
  color: ${LCARS.text};
  font-size: 0.96rem;
`;

export const IconButton = styled.button`
  width: 30px;
  height: 30px;
  border: 1px solid ${LCARS.lineStrong};
  border-radius: 5px;
  color: ${LCARS.root};
  background: rgba(12, 22, 30, 0.9);
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
`;

export const QueueLinkList = styled.div`
  display: grid;
`;

export const QueueLink = styled(Link)`
  display: grid;
  gap: 0.12rem;
  padding: 0.56rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  color: ${LCARS.text};
  text-decoration: none;

  &:last-child {
    border-bottom: 0;
  }

  &:hover,
  &:focus-visible {
    background: rgba(127, 215, 255, 0.1);
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.78rem;
  }

  small {
    overflow: hidden;
    color: ${LCARS.textMuted};
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.64rem;
  }
`;

export const QueueTrack = styled.div`
  height: 6px;
  overflow: hidden;
  border-radius: 99px;
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0,
    rgba(255, 255, 255, 0.1) 18px,
    transparent 18px,
    transparent 22px
  );
`;

export const QueueFill = styled.div`
  width: ${({ $percent = 0 }) => `${Math.max(0, Math.min(100, $percent))}%`};
  height: 100%;
  border-radius: inherit;
  background: var(--declutter-accent, ${LCARS.teal});
  box-shadow: 0 0 10px rgba(var(--declutter-accent-rgb), 0.55);
  transition: width 220ms ease;
`;

export const QueueScoreboard = styled.div`
  display: grid;
  gap: 0.32rem;
`;

export const QueuePlayerRow = styled.div`
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  align-items: start;
  gap: 0.42rem;
`;

export const QueuePlayerLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 7px;
  color: ${({ $player }) => ($player === 'laserfox' ? '#c184ff' : '#52d5ff')};
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1;
  text-transform: uppercase;

  > span {
    font-size: 0.72rem;
  }
`;

export const QueueSegments = styled.div`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 20 }) => $columns}, minmax(3px, 1fr));
  gap: 3px;
`;

export const QueueSegment = styled.span`
  display: block;
  height: 7px;
  border-radius: 1px;
  background: ${({ $decided, $player }) => {
    if (!$decided) return 'rgba(230, 237, 243, 0.16)';
    return $player === 'laserfox' ? '#b875ff' : '#38c9ff';
  }};
  box-shadow: ${({ $decided, $player }) => {
    if (!$decided) return 'none';
    return $player === 'laserfox'
      ? '0 0 7px rgba(184, 117, 255, 0.58)'
      : '0 0 7px rgba(56, 201, 255, 0.58)';
  }};
  transition: background 160ms ease, box-shadow 160ms ease;
`;

export const ReviewShell = styled.section`
  ${panelBase};
  display: grid;
  gap: 0.78rem;
  padding: 0.78rem;
  border-color: rgba(var(--declutter-accent-rgb), 0.3);
`;

export const ReviewCard = styled.article`
  display: grid;
  grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.1fr);
  gap: 0.9rem;
  align-items: stretch;
  transform: ${({ $commitDirection = '' }) => {
    if ($commitDirection === 'keep') return 'translateX(122vw) rotate(16deg)';
    if (['toss', 'donate', 'sell', 'gift'].includes($commitDirection)) {
      return 'translateX(-122vw) rotate(-16deg)';
    }
    if ($commitDirection) return 'translateY(24px) scale(0.96)';
    return 'translateX(0) rotate(0)';
  }};
  opacity: ${({ $commitDirection = '' }) => ($commitDirection ? 0 : 1)};
  transition: ${({ $commitDirection = '' }) =>
    $commitDirection
      ? 'transform 340ms cubic-bezier(0.22, 0.8, 0.25, 1), opacity 300ms ease-out'
      : 'transform 160ms ease'};

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

export const ReviewImageFrame = styled.div`
  min-height: 320px;
  border-radius: 8px;
  border: 1px solid rgba(127, 215, 255, 0.24);
  background: #081018;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${LCARS.textMuted};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 200px;
    height: 200px;
  }
`;

export const ReviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
`;

export const ReviewBody = styled.div`
  display: grid;
  gap: 0.68rem;
  align-content: start;
`;

export const ReviewTitleRow = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: start;
`;

export const ReviewTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.12rem, 2.2vw, 1.54rem);
  line-height: 1.1;
`;

export const ItemLocationLine = styled.div`
  margin-top: 0.26rem;
  color: ${LCARS.textDim};
  font-size: 0.74rem;
  line-height: 1.35;
`;

export const FactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.44rem;

`;

export const Fact = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 0.38rem 0.46rem;
  background: rgba(5, 10, 16, 0.32);
`;

export const FactLabel = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const FactValue = styled.div`
  color: ${LCARS.text};
  font-size: 0.82rem;
  line-height: 1.3;
  margin-top: 0.1rem;
`;

export const PrimaryDecisionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.34rem;
`;

export const SecondaryDecisionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.34rem;

  @media (max-width: 620px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const DecisionButton = styled(Button)`
  min-height: ${({ $primary }) => ($primary ? '54px' : '42px')};
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.34rem;
  color: ${({ $tone }) => decisionTone($tone)};
  border-color: ${({ $tone }) => `${decisionTone($tone)}88`};
  background:
    linear-gradient(180deg, ${({ $tone }) => `${decisionTone($tone)}24`}, rgba(10, 18, 26, 0.9));
  box-shadow: ${({ $primary, $tone }) => (
    $primary ? `inset 0 0 14px ${decisionTone($tone)}12` : 'none'
  )};

  > span {
    font-size: ${({ $primary }) => ($primary ? '1.1rem' : '0.9rem')};
  }
`;

export const UtilityRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  justify-content: space-between;
  align-items: center;
`;

export const QueueHeading = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.48rem;
  color: ${LCARS.root};
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  strong {
    color: ${LCARS.textDim};
    font-size: 0.68rem;
    letter-spacing: 0;
    text-transform: none;
  }
`;

export const PartnerWaiting = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.54rem;
  border: 1px solid rgba(181, 100, 255, 0.62);
  border-radius: 7px;
  background: linear-gradient(90deg, rgba(62, 24, 82, 0.72), rgba(21, 15, 34, 0.8));
  padding: 0.5rem 0.62rem;

  > div {
    display: grid;
    gap: 0.1rem;
  }

  strong {
    color: #d8a6ff;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  span {
    color: ${LCARS.textDim};
    font-size: 0.72rem;
  }
`;

export const PartnerWaitingIcon = styled.span`
  font-size: 1.35rem !important;
`;

export const PrivacyBadge = styled.span`
  color: #d8a6ff !important;
  font-size: 1rem !important;
`;

export const DecisionPrompt = styled.div`
  color: ${LCARS.text};
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const NoteDisclosure = styled.details`
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.42rem;

  summary {
    color: ${LCARS.textMuted};
    font-size: 0.7rem;
    cursor: pointer;
    user-select: none;
  }

  &[open] summary {
    margin-bottom: 0.42rem;
  }
`;

export const PlaceholderNote = styled.div`
  color: ${LCARS.textMuted};
  font-size: ${MOBILE_FONT_SM};
  line-height: 1.4;
  border-left: 3px solid rgba(232, 177, 92, 0.72);
  padding: 0.2rem 0 0.2rem 0.56rem;
`;

export const NotesBlock = styled.label`
  display: grid;
  gap: 0.22rem;
`;

export const SmallText = styled.div`
  color: ${LCARS.textMuted};
  font-size: ${MOBILE_FONT_XS};
  line-height: 1.35;
`;

export const ProgressDashboard = styled.section`
  ${panelBase};
  display: grid;
  gap: 0;
  overflow: hidden;
  border-color: rgba(var(--declutter-accent-rgb), 0.26);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(28, 104, 112, 0.08), transparent 36%),
    rgba(9, 14, 21, 0.9);
`;

export const ProgressHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 46px;
  padding: 0.52rem 0.72rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  > div {
    display: flex;
    align-items: baseline;
    gap: 0.42rem;
    min-width: 0;
  }

  span {
    color: var(--declutter-accent, ${LCARS.root});
    font: 820 0.66rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  small {
    color: ${LCARS.textMuted};
    font-size: 0.68rem;
    white-space: nowrap;
  }
`;

export const ProgressLedgerLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
  min-height: 32px;
  color: rgba(184, 229, 235, 0.74);
  font: 760 0.6rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.055em;
  text-decoration: none;
  text-transform: uppercase;

  span {
    color: var(--declutter-accent, ${LCARS.root});
    font-size: 0.82rem;
  }

  &:hover,
  &:focus-visible {
    color: #f2feff;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:focus-visible {
    outline: 1px solid rgba(var(--declutter-accent-rgb), 0.64);
    outline-offset: 3px;
  }
`;

export const ProgressStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  padding: 0.12rem 0.28rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const ProgressStat = styled.div`
  display: grid;
  gap: 0.18rem;
  padding: 0.46rem 0.54rem;
  border-right: 1px solid rgba(255, 255, 255, 0.07);

  span {
    color: ${({ $tone }) => decisionTone($tone)};
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    color: ${LCARS.text};
    font-size: 1.28rem;
    font-variant-numeric: tabular-nums;
  }
`;

export const ProgressStatLink = styled(Link)`
  display: grid;
  gap: 0.18rem;
  min-height: 52px;
  padding: 0.46rem 0.54rem;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  color: inherit;
  text-decoration: none;

  span {
    color: ${({ $tone }) => decisionTone($tone)};
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    color: ${LCARS.text};
    font-size: 1.28rem;
    font-variant-numeric: tabular-nums;
  }

  &:hover,
  &:focus-visible {
    background: ${({ $tone }) => `${decisionTone($tone)}0c`};
  }

  &:focus-visible { outline: 1px solid ${({ $tone }) => `${decisionTone($tone)}99`}; outline-offset: -2px; }
`;

export const DashboardPanel = styled.section`
  padding: 0.66rem 0.72rem;
  border-top: 1px solid rgba(255, 255, 255, 0.075);
`;

export const PanelHeading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.38rem;
  color: var(--declutter-accent, ${LCARS.root});
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  small {
    color: ${LCARS.textMuted};
    font-size: 0.64rem;
    letter-spacing: 0;
    text-transform: none;
  }
`;

export const DecisionSummary = styled.div`
  display: grid;
  gap: 0.2rem;
`;

export const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: 92px minmax(60px, 1fr) 34px 34px;
  align-items: center;
  gap: 0.42rem;
  color: ${LCARS.text};
  font-size: 0.72rem;

  > strong,
  > small {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  > small {
    color: ${LCARS.textMuted};
  }
`;

export const SummaryLink = styled(Link)`
  display: grid;
  grid-template-columns: 92px minmax(60px, 1fr) 34px 34px;
  align-items: center;
  gap: 0.42rem;
  min-height: 26px;
  padding: 0.1rem 0.2rem;
  border-radius: 4px;
  color: ${LCARS.text};
  font-size: 0.72rem;
  text-decoration: none;

  > strong,
  > small {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  > small {
    color: ${LCARS.textMuted};
  }

  &:hover,
  &:focus-visible {
    background: rgba(255, 255, 255, 0.045);
  }

  &:focus-visible { outline: 1px solid rgba(var(--declutter-accent-rgb), 0.62); }
`;

export const ProgressLedger = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }
`;

export const ProgressLedgerColumn = styled.section`
  min-width: 0;
  padding-right: ${({ $tone }) => ($tone === 'keep' ? '0.75rem' : '0')};
  border-right: ${({ $tone }) => ($tone === 'keep' ? '1px solid rgba(255, 255, 255, 0.08)' : '0')};

  > h3 {
    margin: 0 0 0.2rem;
    color: ${({ $tone }) => ($tone === 'toss' ? '#f08a7b' : '#64bc97')};
    font: 820 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0 0 0.45rem;
    border-right: 0;
    border-bottom: ${({ $tone }) => ($tone === 'keep' ? '1px solid rgba(255, 255, 255, 0.08)' : '0')};
  }
`;

export const DepartureToastContent = styled.div`
  display: grid;
  gap: 0.28rem;
`;

export const DepartureToastBreadcrumb = styled.small`
  color: rgba(255, 240, 210, 0.78);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
`;

export const DepartureToastLink = styled(Link)`
  color: #ffe8b0;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 2px;
`;

export const HistoryLedger = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.62rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

export const HistoryHeader = styled.header`
  display: grid;
  gap: 0.5rem;

  ${PanelHeading} {
    margin-bottom: 0;
  }
`;

export const HistoryBackLink = styled(Link)`
  width: fit-content;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(var(--declutter-accent-rgb), 0.58);
  border-radius: 5px;
  padding: 0 0.68rem;
  background: rgba(var(--declutter-accent-rgb), 0.1);
  color: var(--declutter-accent);
  font: 850 0.68rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;

  &:hover,
  &:focus-visible {
    background: rgba(var(--declutter-accent-rgb), 0.2);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--declutter-accent-rgb), 0.48);
    outline-offset: 2px;
  }
`;

export const HistoryLedgerColumn = styled.section`
  border: 1px solid ${({ $tone }) => ($tone === 'toss' ? 'rgba(240, 138, 123, 0.34)' : 'rgba(100, 188, 151, 0.34)')};
  border-radius: 7px;
  padding: 0.55rem;

  > h3 {
    margin: 0 0 0.45rem;
    color: ${({ $tone }) => ($tone === 'toss' ? '#f08a7b' : '#64bc97')};
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
`;

export const HistoryLedgerItem = styled.div`
  display: grid;
  gap: 0.15rem;
  padding: 0.38rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  small { color: ${LCARS.textMuted}; }
`;

export const HistoryLedgerLink = styled(Link)`
  color: ${LCARS.text};
  font-weight: 760;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

export const HistoryFilters = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  margin-bottom: 0.7rem;
`;

export const HistoryRouteFilters = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.34rem;
  margin-top: -0.34rem;

  > span:first-child {
    margin-right: 0.12rem;
    color: ${LCARS.textMuted};
    font: 800 0.56rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;

export const HistoryRouteLink = styled(Link)`
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  border: 1px solid ${({ $active, $tone }) => (
    $active ? `${decisionTone($tone)}cc` : 'rgba(255, 255, 255, 0.14)'
  )};
  border-radius: 5px;
  padding: 0 0.48rem;
  color: ${({ $active, $tone }) => ($active ? decisionTone($tone) : LCARS.textDim)};
  background: ${({ $active, $tone }) => (
    $active ? `${decisionTone($tone)}1f` : 'rgba(255, 255, 255, 0.025)'
  )};
  box-shadow: ${({ $active, $tone }) => (
    $active ? `0 0 10px ${decisionTone($tone)}33` : 'none'
  )};
  font: 800 0.6rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-decoration: none;
  text-transform: uppercase;
`;

export const HistoryViewBar = styled.div`
  ${panelBase};
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.46rem 0.54rem;
  border-color: rgba(var(--declutter-accent-rgb), 0.28);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr auto;
  }
`;

export const HistoryViewLabel = styled.span`
  color: ${LCARS.textMuted};
  font: 800 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: none;
  }
`;

export const HistoryViewChoices = styled.div`
  display: flex;
  gap: 0.32rem;
`;

export const HistoryViewButton = styled.button`
  min-height: 32px;
  border: 1px solid ${({ $active }) => (
    $active ? 'rgba(var(--declutter-accent-rgb), 0.76)' : 'rgba(255, 255, 255, 0.16)'
  )};
  border-radius: 5px;
  padding: 0 0.52rem;
  color: ${({ $active }) => ($active ? 'var(--declutter-accent)' : LCARS.textDim)};
  background: ${({ $active }) => (
    $active ? 'rgba(var(--declutter-accent-rgb), 0.18)' : 'rgba(255, 255, 255, 0.035)'
  )};
  font: 800 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid rgba(var(--declutter-accent-rgb), 0.48);
    outline-offset: 1px;
  }
`;

export const HistoryPageSummary = styled.span`
  color: ${LCARS.textMuted};
  font: 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
`;

export const HistoryPagination = styled.nav`
  ${panelBase};
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.52rem;
  padding: 0.48rem;
  border-color: rgba(var(--declutter-accent-rgb), 0.28);

  > span {
    color: ${LCARS.textMuted};
    font: 0.62rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    text-align: center;
  }
`;

export const HistoryPageLink = styled(Link)`
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(var(--declutter-accent-rgb), 0.46);
  border-radius: 5px;
  padding: 0 0.54rem;
  color: var(--declutter-accent);
  background: rgba(var(--declutter-accent-rgb), 0.1);
  font: 850 0.6rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.04em;
  text-decoration: none;
  text-transform: uppercase;
  opacity: ${({ $disabled }) => ($disabled ? 0.34 : 1)};
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
`;

export const HistoryFilterLink = styled(Link)`
  border: 1px solid ${({ $active }) => ($active ? 'rgba(var(--declutter-accent-rgb), 0.76)' : 'rgba(255, 255, 255, 0.16)')};
  border-radius: 5px;
  padding: 0.34rem 0.54rem;
  color: ${({ $active }) => ($active ? 'var(--declutter-accent)' : LCARS.textDim)};
  background: ${({ $active }) => ($active ? 'rgba(var(--declutter-accent-rgb), 0.18)' : 'rgba(255, 255, 255, 0.035)')};
  font-size: 0.68rem;
  text-decoration: none;
`;

export const SummaryLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.32rem;
  color: ${({ $tone }) => decisionTone($tone)};
`;

export const SummaryTrack = styled.div`
  height: 6px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.08);
`;

export const SummaryFill = styled.div`
  width: ${({ $percent = 0 }) => `${Math.max(0, Math.min(100, $percent))}%`};
  height: 100%;
  background: ${({ $tone }) => decisionTone($tone)};
  box-shadow: 0 0 7px ${({ $tone }) => `${decisionTone($tone)}88`};
`;

export const PartnerStatsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border: 1px solid ${LCARS.line};
  border-radius: 7px;
  color: ${LCARS.text};
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;

  th,
  td {
    padding: 0.48rem 0.56rem;
    border-bottom: 1px solid ${LCARS.line};
  }

  thead th {
    background: rgba(255, 255, 255, 0.035);
    font-size: 0.64rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  th:first-child {
    color: ${LCARS.textDim};
    text-align: left;
    font-weight: 650;
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }
`;

export const PartnerStatsPlayerHeading = styled.th`
  width: 28%;
  border-left: 1px solid ${({ $player }) => (
    $player === 'laserfox' ? 'rgba(184, 117, 255, 0.34)' : 'rgba(56, 201, 255, 0.34)'
  )};
  color: ${({ $player }) => ($player === 'laserfox' ? '#d8a6ff' : '#73ddff')};
  text-align: center;
`;

export const PartnerStatsValue = styled.td`
  border-left: 1px solid ${({ $player }) => (
    $player === 'laserfox' ? 'rgba(184, 117, 255, 0.22)' : 'rgba(56, 201, 255, 0.22)'
  )};
  background: ${({ $player }) => (
    $player === 'laserfox' ? 'rgba(184, 117, 255, 0.045)' : 'rgba(56, 201, 255, 0.045)'
  )};
  color: ${({ $player }) => ($player === 'laserfox' ? '#d8a6ff' : '#73ddff')};
  text-align: center;
  font-weight: 850;
`;

export const WorkflowGrid = styled.div`
  display: grid;
  gap: 0.8rem;
  min-width: 0;
`;

export const WorkflowCard = styled.article`
  display: grid;
  gap: 0.7rem;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme?.declutterAccent || 'rgba(106, 223, 255, 0.45)'};
  border-radius: 9px;
  padding: 0.85rem;
  background: rgba(5, 12, 18, 0.72);
`;

export const WorkflowCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

export const WorkflowVotes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.8rem;
  color: ${LCARS.textMuted};
  font-size: 0.75rem;
  text-transform: capitalize;
`;

export const Countdown = styled.strong`
  color: #ffd36a;
  font-family: monospace;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
`;

export const WorkflowLaneTitle = styled.h2`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(1.5rem, auto);
  grid-template-areas: 'title reset count';
  align-items: center;
  gap: 0.65rem;
  margin: 0 0 0.45rem;
  color: ${({ theme }) => theme?.declutterAccent || '#73fff4'};
  font-size: 0.82rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;

  > span:first-child {
    grid-area: title;
  }

  > span:last-of-type {
    grid-area: count;
    justify-self: end;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  > button {
    grid-area: reset;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: minmax(0, 1fr) minmax(1.5rem, auto);
    grid-template-areas:
      'title count'
      'reset reset';
    min-width: 0;

    > button {
      justify-self: stretch;
      width: 100%;
      max-width: none;
      min-width: 0;
    }
  }
`;

export const DiscussionScrim = styled.div`
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(2, 5, 9, 0.78);
  backdrop-filter: blur(7px);

  @media (max-width: 520px) { padding: 0; }
`;

export const DiscussionSheet = styled.section`
  width: min(620px, 100%);
  max-height: min(820px, calc(100dvh - 2rem));
  overflow: auto;
  border: 1px solid rgba(139, 226, 218, 0.38);
  border-radius: 8px;
  background:
    linear-gradient(115deg, rgba(71, 205, 193, 0.055), transparent 38%, rgba(172, 112, 238, 0.06)),
    #0a0e14;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.055), 0 24px 70px rgba(0, 0, 0, 0.62);
  animation: ${sheetReveal} 220ms ease-out;

  @media (max-width: 520px) {
    width: 100%;
    height: 100dvh;
    max-height: none;
    border-radius: 0;
  }

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const DiscussionHeader = styled.header`
  position: sticky;
  z-index: 2;
  top: 0;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 0.62rem;
  align-items: center;
  min-height: 74px;
  padding: 0.68rem 0.8rem 0.68rem 0.35rem;
  border-bottom: 1px solid rgba(139, 226, 218, 0.18);
  background: rgba(8, 12, 18, 0.97);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.035);
`;

export const DiscussionClose = styled.button`
  width: 40px;
  height: 40px;
  border: 0;
  padding: 0;
  color: #a8e9e3;
  background: transparent;
  font: 300 1.65rem/1 sans-serif;
  cursor: pointer;

  &:focus-visible { outline: 2px solid #73fff4; outline-offset: -4px; }
`;

export const DiscussionKicker = styled.div`
  color: #84dcd5;
  font: 800 0.58rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;

export const DiscussionTitle = styled.h2`
  margin: 0.18rem 0 0;
  color: ${LCARS.text};
  font-size: 1.14rem;
  line-height: 1.15;
`;

export const DiscussionContext = styled.div`
  margin-top: 0.2rem;
  color: ${LCARS.textMuted};
  font: 0.67rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
`;

export const DiscussionBody = styled.div`
  display: grid;
  gap: 0.8rem;
  padding: 0.8rem;
`;

export const DiscussionItemRail = styled.div`
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 0.65rem;
  align-items: stretch;
`;

export const DiscussionThumb = styled.div`
  width: 76px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(115, 255, 244, 0.22);
  border-radius: 5px;
  color: ${LCARS.textMuted};
  background: #060b10;
  font-size: 0.62rem;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const DiscussionVotes = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;
`;

export const DiscussionVote = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
  border: 1px solid ${({ $tone }) => `${decisionTone($tone)}55`};
  padding: 0.48rem;
  color: ${({ $tone }) => decisionTone($tone)};
  background: ${({ $tone }) => `${decisionTone($tone)}0d`};

  > span { font-size: 1.12rem; }
  > div { display: grid; min-width: 0; }
  small { color: ${LCARS.textMuted}; font: 750 0.52rem/1.2 ui-monospace, monospace; text-transform: uppercase; }
  strong { overflow: hidden; font-size: 0.76rem; text-overflow: ellipsis; text-transform: uppercase; }
`;

export const DiscussionRecommendation = styled.div`
  display: grid;
  gap: 0.18rem;
  border-left: 2px solid ${({ $hasRecommendation }) => ($hasRecommendation ? '#72dcc8' : '#b58ae8')};
  padding: 0.54rem 0.65rem;
  background: rgba(255, 255, 255, 0.025);

  small { color: ${LCARS.textMuted}; font: 800 0.54rem/1.2 ui-monospace, monospace; text-transform: uppercase; }
  strong { color: ${({ $hasRecommendation }) => ($hasRecommendation ? '#91ead8' : '#d5b6f5')}; }
  span { color: ${LCARS.textDim}; font-size: 0.72rem; line-height: 1.35; }
`;

export const DiscussionSectionLabel = styled.div`
  color: ${LCARS.textDim};
  font: 820 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;

export const DiscussionChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;
`;

export const DiscussionChoice = styled.button`
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid ${({ $tone, $selected }) => `${decisionTone($tone)}${$selected ? 'cc' : '44'}`};
  border-radius: 5px;
  padding: 0.48rem 0.55rem;
  color: ${({ $tone }) => decisionTone($tone)};
  background: ${({ $tone, $selected }) => `${decisionTone($tone)}${$selected ? '20' : '08'}`};
  box-shadow: ${({ $tone, $selected }) => ($selected ? `inset 0 0 18px ${decisionTone($tone)}18` : 'none')};
  text-align: left;
  cursor: pointer;

  > span { font-size: 1rem; }
  > div { display: grid; gap: 0.1rem; }
  strong { font-size: 0.72rem; text-transform: uppercase; }
  small { color: ${LCARS.textMuted}; font-size: 0.62rem; line-height: 1.25; }
  &:focus-visible { outline: 2px solid ${({ $tone }) => decisionTone($tone)}; outline-offset: 2px; }
`;

export const DiscussionNotes = styled.label`
  display: grid;
  gap: 0.32rem;
  color: ${LCARS.textDim};
  font: 760 0.62rem/1.2 ui-monospace, monospace;
  text-transform: uppercase;

  small { color: ${LCARS.textMuted}; font-weight: 500; }
  textarea {
    min-height: 66px;
    resize: vertical;
    border: 1px solid rgba(115, 255, 244, 0.2);
    border-radius: 4px;
    padding: 0.56rem;
    color: ${LCARS.text};
    background: #070c12;
    font: inherit;
    font-size: 0.78rem;
    line-height: 1.35;
  }
  textarea:focus { outline: 2px solid rgba(115, 255, 244, 0.54); outline-offset: 1px; }
`;

export const DiscussionCommit = styled.button`
  min-height: 46px;
  border: 1px solid ${({ $tone }) => `${decisionTone($tone)}bb`};
  border-radius: 5px;
  color: ${({ $tone }) => decisionTone($tone)};
  background: ${({ $tone }) => `${decisionTone($tone)}20`};
  font: 850 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  &:disabled { cursor: not-allowed; opacity: 0.42; }
`;

export const DiscussionError = styled.div`
  display: grid;
  gap: 0.2rem;
  border: 1px solid rgba(240, 138, 123, 0.62);
  border-left-width: 3px;
  border-radius: 4px;
  padding: 0.58rem 0.64rem;
  color: #ffc0b7;
  background: rgba(240, 138, 123, 0.09);

  strong {
    font: 850 0.64rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  span {
    color: ${LCARS.textDim};
    font-size: 0.72rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
`;

export const DiscussionReopen = styled.button`
  min-height: 40px;
  border: 0;
  color: ${LCARS.textMuted};
  background: transparent;
  font: 760 0.62rem/1 ui-monospace, monospace;
  text-decoration: underline;
  text-underline-offset: 0.22rem;
  cursor: pointer;
`;

export const ActionControls = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;

  select {
    min-height: 38px;
    border: 1px solid rgba(130, 210, 255, 0.36);
    border-radius: 5px;
    padding: 0 0.55rem;
    color: ${LCARS.text};
    background: #09131b;
  }
`;

export const HoldButton = styled.button`
  position: relative;
  overflow: hidden;
  min-height: 62px;
  border: 1px solid #ff5b53;
  border-radius: 7px;
  color: #fff;
  background:
    linear-gradient(90deg, rgba(255, 35, 25, 0.85) 0 0) left / ${({ $holding }) => ($holding ? '100%' : '0%')} 100% no-repeat,
    rgba(100, 10, 10, 0.42);
  font-weight: 900;
  letter-spacing: 0.08em;
  transition: background-size 1200ms linear;
  touch-action: none;
`;

export const CompactHoldButton = styled.button`
  justify-self: center;
  box-sizing: border-box;
  width: 188px;
  max-width: min(44vw, 188px);
  min-height: 34px;
  border: 1px solid #ff9b78;
  border-radius: 5px;
  padding: 0.42rem 0.7rem;
  color: ${({ $holding }) => ($holding ? '#fff' : '#ffd0c1')};
  background:
    linear-gradient(90deg, rgba(201, 61, 42, 0.92) 0 0) left /
      ${({ $holding }) => ($holding ? '100%' : '0%')} 100% no-repeat,
    rgba(91, 31, 27, 0.28);
  font: inherit;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  transition:
    background-size ${({ $holding, $holdMs }) => ($holding ? `${$holdMs}ms` : '100ms')} linear,
    color 120ms ease;
  touch-action: none;
  user-select: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;
