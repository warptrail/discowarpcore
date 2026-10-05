import { controlStyles, inputStyles } from '../../styles/primitives';
import styled from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

export const Composer = styled.section`
  display: grid;
  gap: 0.82rem;
  min-width: 0;
  padding: 0.55rem 0 1.1rem;
`;

export const WizardIntro = styled.header`
  display: grid;
  gap: 0.25rem;
  min-width: 0;
  padding: 0.12rem 0 0.05rem 0.72rem;
  border-left: 3px solid ${({ $inBox }) => $inBox
    ? 'rgba(var(--box-primary-rgb, 127, 215, 255), 0.8)'
    : '#9b8cff'};

  border-left: 3px solid var(--dw-amber);
  background: var(--dw-surface);
  box-shadow: none;
`;

export const WizardEyebrow = styled.span`
  color: rgba(var(--box-secondary-rgb, 167, 182, 255), 0.86);
  font: 800 0.75rem/1.2 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;

  color: var(--dw-amber);
`;

export const ItemTitle = styled.h1`
  margin: 0;
  color: var(--box-neon, #f0fffc);
  font-size: clamp(1.55rem, 5vw, 2rem);
  font-weight: 850;
  letter-spacing: -0.035em;
  line-height: 1;
  text-shadow: none;

  &::after {
    color: var(--box-secondary, #a78bfa);
    content: ' /';
    font-size: 0.55em;
    letter-spacing: 0;
    vertical-align: 0.18em;
  }
`;

export const WizardTitle = styled.h2`
  margin: 0;
  color: ${({ $inBox }) => $inBox ? 'var(--box-neon, #e8fffb)' : '#d7ceff'};
  font-size: clamp(1.17rem, 4.5vw, 1.62rem);
  font-weight: 820;
  letter-spacing: -0.025em;
  line-height: 1.12;
  text-shadow: 0 0 12px ${({ $inBox }) => $inBox
    ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.16)'
    : 'rgba(155, 140, 255, 0.18)'};
`;

export const WizardPrompt = styled.p`
  margin: 0.16rem 0 0;
  color: #8fd8f4;
  font: 750 0.72rem/1.35 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const DestinationRail = styled.div`
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr);
  gap: 0.65rem;
  align-items: center;
  min-width: 0;
  min-height: 68px;
  padding: 0.65rem 0.72rem;
  border: 1px solid ${({ $inBox }) => $inBox
    ? 'rgba(var(--box-primary-rgb, 127, 215, 255), 0.58)'
    : 'rgba(139, 151, 238, 0.55)'};
  border-left: 4px solid ${({ $inBox }) => $inBox
    ? 'var(--box-primary, #7fd7ff)'
    : '#57cdec'};
  border-radius: 4px 12px 12px 4px;
  background: ${({ $inBox }) => $inBox
    ? 'linear-gradient(100deg, rgba(var(--box-primary-rgb, 127, 215, 255), 0.15), rgba(8, 17, 27, 0.94) 45%)'
    : 'var(--dw-surface-raised)'};
  box-shadow: none;

  @media (max-width: 380px) {
    grid-template-columns: 2rem minmax(0, 1fr);
    gap: 0.42rem;
    padding-inline: 0.5rem;
  }

  border-left: 3px solid var(--dw-amber);
  background: var(--dw-surface);
  box-shadow: none;
`;

export const DestinationIcon = styled.span`
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  color: ${({ $inBox }) => $inBox ? 'var(--box-neon, #7fd7ff)' : '#67dfff'};

  svg { width: 1.9rem; height: 1.9rem; }
`;

export const DestinationCopy = styled.div`
  display: grid;
  gap: 0.08rem;
  min-width: 0;
`;

export const DestinationKicker = styled.div`
  color: rgba(183, 193, 232, 0.82);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;

  color: var(--dw-amber);
`;

export const DestinationStatusRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 0.65rem;
  row-gap: 0.2rem;
  min-width: 0;
`;

export const DestinationLabel = styled.div`
  min-width: 0;
  color: var(--box-neon, #ecf7f5);
  font-size: clamp(0.95rem, 3.8vw, 1.2rem);
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

export const DestinationHint = styled.span`
  color: rgba(189, 211, 225, 0.68);
  font: 600 0.75rem/1.3 var(--dw-font-ui);
  letter-spacing: 0.02em;
`;

export const DestinationMeta = styled.span`
  color: rgba(var(--box-primary-rgb, 135, 198, 189), 0.88);
  font-family: var(--dw-font-ui);
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

  ${({ $destination }) => $destination && `
    min-height: 36px;
    flex: none;
    border: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.46);
    border-radius: 5px;
    background: var(--dw-surface-raised);
    color: var(--box-neon, #ccefff);
    font-size: 0.7rem;
    padding: 0.36rem 0.55rem;
    text-decoration: none;
  `}

  &:focus-visible {
    outline: 2px solid var(--box-neon, rgba(173, 142, 255, 0.92));
    outline-offset: 3px;
  }

  &:disabled { opacity: 0.55; cursor: not-allowed; }

  ${controlStyles}
  color: var(--dw-violet);
`;

export const Form = styled.form`
  display: grid;
  gap: 0.9rem;
`;

export const PhotoControlPanel = styled.div`
  display: grid;
  gap: 0.45rem;
`;

export const PhotoStage = styled.div`
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 0.55rem;
  align-items: center;
  min-width: 0;
`;

export const PhotoButton = styled.button`
  width: 76px;
  height: 76px;
  border: 1px dashed var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: #c2acff;
  cursor: pointer;
  display: grid;
  place-items: center;
  gap: 0.22rem;
  padding: 0.5rem;

  &:hover:not(:disabled) { border-color: #a995ff; background: var(--dw-surface-raised); }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: 3px; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }

  ${controlStyles}
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
  width: 76px;
  height: 76px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: #10142c;
  object-fit: cover;
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
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
  min-width: 0;

  > div > button, > button {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    border: 1px solid var(--dw-border);
    border-radius: var(--dw-radius-sm);
    padding: 0.3rem 0.45rem;
    background: var(--dw-surface-raised);
    color: #c4c4ff;
    font-size: 0.75rem;
    line-height: 1.15;
    text-align: center;
    text-decoration: none;
  }
  > button:last-child:nth-child(3) {
    border-color: rgba(148, 161, 190, 0.34);
    background: var(--dw-surface-raised);
    color: #aab8cf;
  }
  > div > button:hover:not(:disabled), > div > button:focus-visible,
  > button:hover:not(:disabled), > button:focus-visible {
    border-color: #afa0ff;
    color: #f1edff;
  }
`;

export const GlowAddon = styled.div`
  border-top: 1px solid var(--dw-border);
  padding-top: 0.3rem;
  color: #beb8ea;

  > label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    font: 800 0.75rem/1.2 var(--dw-font-ui);
    letter-spacing: 0.01em;
    cursor: pointer;
  }
  input { accent-color: #9a7bf1; width: 18px; height: 18px; }
`;

export const Field = styled.div`
  display: grid;
  gap: 0.34rem;
  min-width: 0;
`;

export const Label = styled.label`
  color: rgba(var(--box-secondary-rgb, 155, 184, 183), 0.78);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const Input = styled.input`
  width: 100%;
  min-height: 46px;
  border: 1px solid var(--dw-border, rgba(230, 237, 243, 0.12));
  border-left: 3px solid var(--dw-teal, #4cc6c1);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: var(--dw-text, #e6edf3);
  font-size: 0.96rem;
  padding: 0 0.72rem;

  &::placeholder {
    color: var(--dw-text-muted, rgba(230, 237, 243, 0.56));
    font-size: 0.94em;
  }

  &:focus { border-color: var(--dw-cyan, #7fd7ff); box-shadow: none; outline: none; }
  &:disabled { opacity: 0.58; cursor: not-allowed; }

  ${inputStyles}
`;

export const QuantityRow = styled.div`
  display: grid;
  align-content: start;
  gap: 0.3rem;
  min-width: 0;
  min-height: 77px;
  border: 1px solid var(--dw-border);
  border-left: 3px solid var(--dw-teal, #4cc6c1);
  border-radius: var(--dw-radius-sm);
  padding: 0.36rem 0 0;
  background: var(--dw-surface);
  box-shadow: none;

  > label {
    padding-inline: 0.46rem;
    color: var(--dw-teal, #4cc6c1);
    font: 800 0.75rem/1.1 var(--dw-font-ui);
    letter-spacing: 0.01em;
  }
`;

export const CaptureRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(140px, 1fr);
  @media (max-width: 360px) { grid-template-columns: minmax(0, 1fr); }
  align-items: start;
  gap: 0.4rem;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.35rem;
  }
`;

export const PhotoModule = styled.section`
  display: grid;
  align-content: start;
  gap: 0.3rem;
  min-width: 0;
  min-height: 77px;
  border: 1px solid var(--dw-border);
  border-left: 3px solid var(--dw-violet, #a7b6ff);
  border-radius: var(--dw-radius-sm);
  padding: 0.36rem 0.42rem 0.4rem;
  background: var(--dw-surface);
  box-shadow: none;


  border-left: 3px solid var(--dw-amber);
  background: var(--dw-surface);
  box-shadow: none;
`;

export const PhotoEyebrow = styled.span`
  color: var(--dw-violet, #a7b6ff);
  font: 800 0.75rem/1.1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;

  color: var(--dw-amber);
`;

export const PhotoToggle = styled.button`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 0.32rem;
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0 0.3rem;
  background: var(--dw-surface-raised);
  color: var(--dw-violet, #a7b6ff);
  text-align: left;
  cursor: pointer;

  > span:last-child { color: var(--dw-violet, #a7b6ff); font-size: 1.2rem; text-align: center; }
  &:hover { border-color: rgba(167, 182, 255, 0.72); }
  &:focus-visible { outline: 2px solid var(--dw-violet, #a7b6ff); outline-offset: 1px; }

  ${controlStyles}
`;

export const PhotoActionCopy = styled.span`
  display: grid;
  gap: 0.08rem;
  min-width: 0;
  small {
    overflow: hidden;
    color: var(--dw-text-muted, rgba(230, 237, 243, 0.56));
    font: 700 0.75rem/1.1 var(--dw-font-ui);
    letter-spacing: 0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;
    @media (max-width: 350px) { display: none; }
  }
`;

export const PhotoAction = styled.strong`
  overflow: hidden;
  color: var(--dw-text, #e6edf3);
  font-size: 0.75rem;
  font-weight: 850;
  letter-spacing: 0.045em;
  text-overflow: ellipsis;
  text-transform: none;
  white-space: nowrap;
`;

export const PhotoMiniPreview = styled.img`
  width: 24px;
  height: 28px;
  border-radius: 3px;
  object-fit: cover;
`;

export const PhotoExpanded = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0.55rem;
  background: var(--dw-surface-raised);
`;

export const ProgressDisclosure = styled.section`
  border-top: 1px solid var(--dw-border);

  ${({ $compact }) => $compact && `
    border-top: 0;
    min-width: 0;
    border: 1px solid rgba(var(--box-primary-rgb, 104, 196, 184), 0.48);
    border-radius: 7px;
    background: var(--dw-surface);
  `}
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
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  padding: 0.28rem 0;
  text-align: left;
  text-transform: none;

  ${({ $compact }) => $compact && `
    min-height: 46px;
    padding: 0.28rem 0.62rem;
    color: rgba(var(--box-primary-rgb, 154, 216, 208), 0.9);
    font-size: 0.62rem;
  `}

  span:last-child { color: var(--box-neon, #82d8ce); font-size: 0.88rem; }
  em { color: #6d9592; font-style: normal; font-weight: 650; }
  &:hover { color: #e9fbf8; }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: -2px; }

  ${controlStyles}
`;

export const ProgressContent = styled.div`
  padding: 0.12rem 0 0.62rem;
`;

export const QuantityControl = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  width: 100%;
  min-width: 0;
  border-top: 1px solid var(--dw-border);
  border-radius: 0 0 7px 5px;
  overflow: hidden;
`;

export const QuantityButton = styled.button`
  min-width: 0;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: var(--dw-cyan, #7fd7ff);
  cursor: pointer;
  font-size: 1.35rem;
  font-weight: 700;

  &:last-child { color: var(--dw-teal, #4cc6c1); }
  &:hover:not(:disabled) { background: var(--dw-surface-raised); color: #e8fffb; }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: -2px; }
  &:disabled { color: rgba(154, 216, 208, 0.35); cursor: not-allowed; }

  ${controlStyles}
`;

export const QuantityValue = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  border-inline: 1px solid rgba(58, 219, 209, 0.44);
  background: var(--dw-surface-raised);
  color: #f1fffc;
  font: 800 1.2rem var(--dw-font-ui);
  text-align: center;
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button { appearance: none; margin: 0; }
  &:focus { outline: 2px solid rgba(173, 142, 255, 0.82); outline-offset: -2px; }

  ${inputStyles}
  font-family: var(--dw-font-data);
  padding-inline: 0.2rem;
`;

export const QuickDetails = styled.div`
  display: grid;
  gap: 0.65rem;
`;

export const QuickDetailsTitle = styled.div`
  color: rgba(var(--box-neon-rgb, 185, 212, 209), 0.82);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;

  span { color: #759895; font-weight: 600; }
`;

export const TagComposer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  min-height: 46px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  padding: 0.22rem 0.4rem;

  &:focus-within { border-color: #86d5cb; box-shadow: none; }
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

  ${inputStyles}
`;

export const TagStageButton = styled.button`
  min-height: 36px;
  border: 0;
  border-left: 1px solid var(--dw-border);
  background: transparent;
  color: rgba(var(--box-primary-rgb, 143, 213, 204), 0.9);
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.01em;
  padding: 0 0.54rem;
  text-transform: none;

  &:hover:not(:disabled) { color: var(--box-neon, #e8fffb); background: var(--dw-surface-raised); }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: -2px; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  ${controlStyles}
`;

export const PrimaryButton = styled.button`
  width: 100%;
  max-width: 24rem;
  justify-self: center;
  min-height: 44px;
  border: 1px solid var(--dw-border);
  border-left: 4px solid #44d7e8;
  border-radius: var(--dw-radius-sm);
  background: #0b1d2a;
  color: #a8f4f1;
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.055em;
  text-transform: none;
  box-shadow: none;

  &:hover:not(:disabled) { background: #123245; border-color: #76ecf0; }
  &:focus-visible { outline: 2px solid rgba(173, 142, 255, 0.92); outline-offset: 3px; }
  &:disabled { opacity: 0.48; cursor: not-allowed; }

  ${controlStyles}
  color: var(--dw-cyan);
  border-color: var(--dw-cyan);
`;

export const InlineMessage = styled.div`
  color: ${({ $error }) => ($error ? '#ffc5c5' : '#9de1d8')};
  font-size: 0.8rem;
  line-height: 1.4;
`;

export const SuccessArea = styled.section`
  display: grid;
  gap: 0.8rem;
  border-top: 1px solid var(--dw-border);
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
  border-top: 1px solid var(--dw-border);
`;

export const DetailRow = styled.div`
  border-bottom: 1px solid var(--dw-border);
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

  ${controlStyles}
`;

export const DetailEditor = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.15rem 0 0.78rem;
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 84px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: #eff9f7;
  font: inherit;
  line-height: 1.4;
  padding: 0.62rem 0.72rem;
  resize: vertical;
  &:focus { border-color: #86d5cb; box-shadow: none; outline: none; }

  ${inputStyles}
  min-height: 88px;
  resize: vertical;
`;

export const Select = styled.select`
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: #eff9f7;
  font: inherit;
  padding: 0 0.6rem;
  &:focus { border-color: #86d5cb; box-shadow: none; outline: none; }

  ${inputStyles}
`;

export const EditorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

export const SaveButton = styled.button`
  min-height: 44px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: #e9fffb;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0 0.82rem;
  &:disabled { opacity: 0.55; cursor: not-allowed; }

  ${controlStyles}
  color: var(--dw-cyan);
  border-color: var(--dw-cyan);
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
`;

export const TagChip = styled.button`
  min-height: 40px;
  border: 1px solid var(--dw-border);
  border-radius: 4px;
  background: var(--dw-surface-raised);
  color: #cbece7;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  padding: 0 0.56rem;

  ${controlStyles}
`;
