import styled, { css } from 'styled-components';
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
  if (tone === 'unsure') return LCARS.root;
  return LCARS.textDim;
};

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

export const PlayerStat = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.58rem;
  margin-top: 0.1rem;
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
  color: ${LCARS.textDim};
  font-size: 0.78rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
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

  @media (max-width: 820px) {
    grid-template-columns: 64px minmax(0, 1fr);
    align-items: start;
  }
`;

export const ThumbFrame = styled.div`
  width: 64px;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(127, 215, 255, 0.22);
  background: rgba(7, 12, 18, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${LCARS.textMuted};
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

export const VoteComparison = styled.div`
  display: grid;
  gap: 0.3rem;

  @media (max-width: 820px) {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const PlayerVote = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
  border: 1px solid ${({ $tone }) => `${decisionTone($tone)}55`};
  border-radius: 6px;
  background: ${({ $tone }) => `${decisionTone($tone)}12`};
  padding: 0.36rem 0.44rem;

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
  color: ${LCARS.root};
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const QueueProgressButton = styled.button`
  border: 0;
  border-bottom: 1px dotted ${LCARS.root};
  padding: 0;
  color: ${LCARS.root};
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
  background: ${LCARS.teal};
  box-shadow: 0 0 10px rgba(76, 198, 193, 0.55);
  transition: width 220ms ease;
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
    if (['toss', 'donate', 'sell'].includes($commitDirection)) {
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.34rem;
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
  display: grid;
  gap: 0.62rem;
`;

export const ProgressStatGrid = styled.div`
  ${panelBase};
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  overflow: hidden;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const ProgressStat = styled.div`
  display: grid;
  gap: 0.18rem;
  padding: 0.62rem;
  border-right: 1px solid ${({ $tone }) => `${decisionTone($tone)}66`};
  border-bottom: 2px solid ${({ $tone }) => decisionTone($tone)};

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

export const DashboardPanel = styled.section`
  ${panelBase};
  padding: 0.7rem;
  border-color: rgba(var(--declutter-accent-rgb), 0.28);
`;

export const PanelHeading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.58rem;
  color: ${LCARS.root};
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
  gap: 0.44rem;
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

export const PartnerProgressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;
`;

export const PartnerProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 0.48rem;
  border: 1px solid ${({ $player }) => (
    $player === 'laserfox' ? 'rgba(181, 100, 255, 0.48)' : 'rgba(0, 236, 225, 0.48)'
  )};
  border-radius: 7px;
  padding: 0.5rem;

  > span {
    font-size: 1.45rem;
  }

  > div {
    display: grid;
  }

  strong {
    color: ${({ $player }) => ($player === 'laserfox' ? '#d8a6ff' : '#73fff4')};
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  small {
    color: ${LCARS.textDim};
  }
`;

export const WorkflowGrid = styled.div`
  display: grid;
  gap: 0.8rem;
`;

export const WorkflowCard = styled.article`
  display: grid;
  gap: 0.7rem;
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
  align-items: center;
  gap: 0.65rem;
  margin: 0 0 0.45rem;
  color: ${({ theme }) => theme?.declutterAccent || '#73fff4'};
  font-size: 0.82rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;

  > span:last-child {
    justify-self: end;
    font-variant-numeric: tabular-nums;
  }
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
