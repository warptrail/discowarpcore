import styled, { keyframes } from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

export const Composer = styled.section`
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 0.4rem 0 1.1rem;
`;

export const ItemTitle = styled.h1`
  margin: 0;
  color: var(--box-neon, #f0fffc);
  font-size: clamp(1.55rem, 5vw, 2rem);
  font-weight: 850;
  letter-spacing: -0.035em;
  line-height: 1;
  text-shadow: 0 0 18px rgba(var(--box-primary-rgb, 85, 212, 196), 0.18);

  &::after {
    color: var(--box-secondary, #a78bfa);
    content: ' /';
    font-size: 0.55em;
    letter-spacing: 0;
    vertical-align: 0.18em;
  }
`;

export const DestinationRail = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  min-height: 48px;
  border-bottom: 1px solid rgba(var(--box-primary-rgb, 114, 180, 177), 0.28);
  padding: 0 0 0.7rem;
`;

export const DestinationKicker = styled.div`
  color: rgba(var(--box-secondary-rgb, 127, 166, 167), 0.74);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;

export const DestinationLabel = styled.div`
  color: var(--box-neon, #ecf7f5);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

export const DestinationMeta = styled.span`
  color: rgba(var(--box-primary-rgb, 135, 198, 189), 0.88);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8em;
  font-weight: 600;
`;

export const QuietButton = styled.button`
  min-height: 44px;
  border: 0;
  background: transparent;
  color: rgba(var(--box-primary-rgb, 143, 213, 204), 0.9);
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0.3rem 0.1rem;
  text-decoration: underline;
  text-underline-offset: 0.2rem;

  &:focus-visible {
    outline: 2px solid var(--box-neon, rgba(173, 142, 255, 0.92));
    outline-offset: 3px;
  }

  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const Form = styled.form`
  display: grid;
  gap: 0.9rem;
`;

export const PhotoStage = styled.div`
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 0.85rem;
  align-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 92px minmax(0, 1fr);
  }
`;

export const PhotoButton = styled.button`
  width: 104px;
  height: 104px;
  border: 1px dashed rgba(130, 200, 193, 0.52);
  border-radius: 8px;
  background: rgba(12, 22, 27, 0.72);
  color: #b5ddd8;
  cursor: pointer;
  display: grid;
  place-items: center;
  gap: 0.22rem;
  padding: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) { width: 92px; height: 92px; }

  &:hover:not(:disabled) { border-color: #82d6cb; background: rgba(17, 38, 42, 0.86); }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: 3px; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const PhotoGlyph = styled.span`
  font-size: 1.35rem;
  line-height: 1;
`;

export const PhotoButtonLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 800;
`;

export const PhotoPreview = styled.img`
  width: 104px;
  height: 104px;
  border-radius: 8px;
  border: 1px solid rgba(130, 200, 193, 0.52);
  background: #0c171c;
  object-fit: cover;

  @media (max-width: ${MOBILE_BREAKPOINT}) { width: 92px; height: 92px; }
`;

export const PhotoCopy = styled.div`
  display: grid;
  gap: 0.42rem;
  align-content: center;
`;

export const PhotoTitle = styled.div`
  color: #e7f4f2;
  font-size: 0.92rem;
  font-weight: 700;
`;

export const PhotoHint = styled.div`
  color: #8daaaa;
  font-size: 0.76rem;
  line-height: 1.35;
`;

export const SourceActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

export const Field = styled.div`
  display: grid;
  gap: 0.34rem;
  min-width: 0;
`;

export const Label = styled.label`
  color: rgba(var(--box-secondary-rgb, 155, 184, 183), 0.78);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const Input = styled.input`
  width: 100%;
  min-height: 50px;
  border: 1px solid rgba(123, 159, 173, 0.5);
  border-radius: 7px;
  background: rgba(7, 13, 18, 0.9);
  color: #eff9f7;
  font-size: 1rem;
  padding: 0 0.72rem;

  &:focus { border-color: rgba(var(--box-primary-rgb, 134, 213, 203), 0.92); box-shadow: 0 0 0 2px rgba(var(--box-primary-rgb, 104, 207, 193), 0.16); outline: none; }
  &:disabled { opacity: 0.58; cursor: not-allowed; }
`;

export const QuantityRow = styled.div`
  display: grid;
  gap: 0.34rem;
`;

export const ProgressDisclosure = styled.section`
  border-top: 1px solid rgba(var(--box-primary-rgb, 114, 180, 177), 0.26);
`;

export const ProgressToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 42px;
  border: 0;
  background: transparent;
  color: rgba(var(--box-secondary-rgb, 169, 199, 198), 0.82);
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.28rem 0;
  text-align: left;
  text-transform: uppercase;

  span:last-child { color: var(--box-neon, #82d8ce); font-size: 0.88rem; }
  em { color: #6d9592; font-style: normal; font-weight: 650; }
  &:hover { color: #e9fbf8; }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: -2px; }
`;

export const ProgressContent = styled.div`
  padding: 0.12rem 0 0.62rem;
`;

export const QuantityControl = styled.div`
  display: grid;
  grid-template-columns: 46px 64px 46px;
  align-items: stretch;
  width: fit-content;
  border: 1px solid rgba(var(--box-primary-rgb, 104, 196, 184), 0.48);
  border-radius: 7px;
  background: rgba(8, 19, 24, 0.9);
  box-shadow: inset 0 1px 0 rgba(185, 247, 238, 0.07);
`;

export const QuantityButton = styled.button`
  min-height: 46px;
  border: 0;
  background: transparent;
  color: rgba(var(--box-primary-rgb, 154, 216, 208), 0.9);
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: 700;

  &:hover:not(:disabled) { background: rgba(var(--box-primary-rgb, 65, 176, 164), 0.14); color: var(--box-neon, #e8fffb); }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: -2px; }
  &:disabled { color: rgba(154, 216, 208, 0.35); cursor: not-allowed; }
`;

export const QuantityValue = styled.input`
  width: 100%;
  border: 0;
  border-inline: 1px solid rgba(var(--box-primary-rgb, 104, 196, 184), 0.38);
  background: rgba(12, 29, 34, 0.88);
  color: #f1fffc;
  font: 800 1rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-align: center;
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button { appearance: none; margin: 0; }
  &:focus { outline: 2px solid rgba(173, 142, 255, 0.82); outline-offset: -2px; }
`;

export const QuickDetails = styled.div`
  display: grid;
  gap: 0.65rem;
`;

export const QuickDetailsTitle = styled.div`
  color: rgba(var(--box-neon-rgb, 185, 212, 209), 0.82);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  span { color: #759895; font-weight: 600; }
`;

export const TagComposer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  min-height: 46px;
  border: 1px solid rgba(123, 159, 173, 0.5);
  border-radius: 7px;
  background: rgba(7, 13, 18, 0.9);
  padding: 0.22rem 0.4rem;

  &:focus-within { border-color: #86d5cb; box-shadow: 0 0 0 2px rgba(104, 207, 193, 0.16); }
`;

export const TagDraftInput = styled.input`
  flex: 1 1 108px;
  min-width: 108px;
  min-height: 36px;
  border: 0;
  background: transparent;
  color: #eff9f7;
  font: inherit;
  outline: 0;
  padding: 0 0.28rem;
`;

export const TagStageButton = styled.button`
  min-height: 36px;
  border: 0;
  border-left: 1px solid rgba(104, 196, 184, 0.36);
  background: transparent;
  color: rgba(var(--box-primary-rgb, 143, 213, 204), 0.9);
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  padding: 0 0.54rem;
  text-transform: uppercase;

  &:hover:not(:disabled) { color: var(--box-neon, #e8fffb); background: rgba(var(--box-primary-rgb, 65, 176, 164), 0.13); }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: -2px; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const warpCorePulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(var(--box-primary-rgb, 76, 220, 201), 0), inset 0 1px 0 rgba(var(--box-neon-rgb, 225, 255, 251), 0.15); transform: translateY(0); }
  50% { box-shadow: 0 0 24px rgba(var(--box-primary-rgb, 75, 229, 205), 0.3), 0 0 7px rgba(var(--box-secondary-rgb, 173, 142, 255), 0.26), inset 0 1px 0 rgba(var(--box-neon-rgb, 225, 255, 251), 0.28); transform: translateY(-1px); }
`;

export const PrimaryButton = styled.button`
  width: 100%;
  min-height: 52px;
  border: 1px solid rgba(var(--box-primary-rgb, 122, 219, 204), 0.78);
  border-radius: 7px;
  background: radial-gradient(circle at 50% 15%, rgba(var(--box-primary-rgb, 70, 190, 175), 0.68), rgba(var(--box-secondary-rgb, 26, 89, 84), 0.2) 52%, rgba(14, 54, 52, 0.98));
  color: var(--box-neon, #edfffb);
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 850;
  letter-spacing: 0.055em;
  text-transform: uppercase;

  &:not(:disabled) { animation: ${warpCorePulse} 2.8s ease-in-out infinite; }
  &:hover:not(:disabled) { background: radial-gradient(circle at 50% 15%, rgba(var(--box-primary-rgb, 90, 221, 200), 0.75), rgba(var(--box-secondary-rgb, 31, 113, 106), 0.26) 52%, rgba(15, 67, 63, 0.98)); }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: 3px; }
  &:disabled { opacity: 0.52; cursor: not-allowed; }

  @media (prefers-reduced-motion: reduce) { &:not(:disabled) { animation: none; } }
`;

export const InlineMessage = styled.div`
  color: ${({ $error }) => ($error ? '#ffc5c5' : '#9de1d8')};
  font-size: 0.8rem;
  line-height: 1.4;
`;

export const SuccessArea = styled.section`
  display: grid;
  gap: 0.8rem;
  border-top: 1px solid rgba(114, 180, 177, 0.28);
  padding-top: 1rem;
`;

export const SuccessHeading = styled.h2`
  color: #e8f9f6;
  font-size: 1.1rem;
  margin: 0;
`;

export const SuccessCopy = styled.p`
  color: #99b8b5;
  font-size: 0.82rem;
  line-height: 1.4;
  margin: -0.5rem 0 0;
`;

export const DetailList = styled.div`
  border-top: 1px solid rgba(114, 180, 177, 0.2);
`;

export const DetailRow = styled.div`
  border-bottom: 1px solid rgba(114, 180, 177, 0.2);
  padding: 0.16rem 0;
`;

export const DetailToggle = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: #dcefed;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  justify-content: space-between;
  min-height: 48px;
  padding: 0;
  text-align: left;
  width: 100%;

  span { color: #8ecfc7; font-size: 0.78rem; font-weight: 700; }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: 2px; }
`;

export const DetailEditor = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.15rem 0 0.78rem;
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 84px;
  border: 1px solid rgba(123, 159, 173, 0.5);
  border-radius: 7px;
  background: rgba(7, 13, 18, 0.9);
  color: #eff9f7;
  font: inherit;
  line-height: 1.4;
  padding: 0.62rem 0.72rem;
  resize: vertical;
  &:focus { border-color: #86d5cb; box-shadow: 0 0 0 2px rgba(104, 207, 193, 0.16); outline: none; }
`;

export const Select = styled.select`
  width: 100%;
  min-height: 48px;
  border: 1px solid rgba(123, 159, 173, 0.5);
  border-radius: 7px;
  background: rgba(7, 13, 18, 0.9);
  color: #eff9f7;
  font: inherit;
  padding: 0 0.6rem;
  &:focus { border-color: #86d5cb; box-shadow: 0 0 0 2px rgba(104, 207, 193, 0.16); outline: none; }
`;

export const EditorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

export const SaveButton = styled.button`
  min-height: 44px;
  border: 1px solid rgba(122, 219, 204, 0.7);
  border-radius: 6px;
  background: rgba(25, 79, 73, 0.9);
  color: #e9fffb;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0 0.82rem;
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
`;

export const TagChip = styled.button`
  min-height: 40px;
  border: 1px solid rgba(126, 192, 184, 0.45);
  border-radius: 4px;
  background: rgba(19, 48, 48, 0.84);
  color: #cbece7;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  padding: 0 0.56rem;
`;
