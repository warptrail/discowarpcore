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
`;

export const ModeGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem;
  align-items: center;
`;

export const ModeButton = styled(Button)`
  border-color: ${({ $active }) =>
    $active ? 'rgba(127, 215, 255, 0.88)' : 'rgba(102, 167, 212, 0.42)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(26, 60, 83, 0.96), rgba(17, 43, 62, 0.96))'
      : 'rgba(14, 24, 34, 0.82)'};
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

export const ReviewShell = styled.section`
  ${panelBase};
  display: grid;
  gap: 0.78rem;
  padding: 0.78rem;
`;

export const ReviewCard = styled.article`
  display: grid;
  grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.1fr);
  gap: 0.9rem;
  align-items: stretch;

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
    min-height: 240px;
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

export const FactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.44rem;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
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

export const DecisionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.34rem;

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const DecisionButton = styled(Button)`
  min-height: 42px;
  color: ${({ $tone }) => decisionTone($tone)};
  border-color: ${({ $tone }) => `${decisionTone($tone)}88`};
  background:
    linear-gradient(180deg, ${({ $tone }) => `${decisionTone($tone)}24`}, rgba(10, 18, 26, 0.9));
`;

export const UtilityRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  justify-content: space-between;
  align-items: center;
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
