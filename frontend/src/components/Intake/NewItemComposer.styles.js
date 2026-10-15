import { controlStyles } from '../../styles/primitives';
import styled from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';
import { consoleControlStyles, consoleFieldStyles, consoleGlyphStyles, insetStageStyles, hiddenLabelStyles, primaryCommandStyles } from './IntakeConsole.styles';

export const Composer = styled.section`
  display: grid;
  gap: 16px;
  min-width: 0;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 4px 0 8px;
`;

export const WizardIntro = styled.header`
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 4px 0;
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
  color: var(--dw-text);
  font: 600 clamp(1.15rem,3vw,1.4rem)/1.2 var(--dw-font-ui);
  letter-spacing: -.02em;
`;

export const WizardPrompt = styled.p`
  margin: 0;
  color: var(--dw-text-secondary);
  font: 400 .8rem/1.4 var(--dw-font-ui);
`;

export const DestinationRail = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(0,1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 8px 12px;
  border-bottom: 1px solid var(--dw-border);
  border-radius: 2px 12px 0 0;
  background: var(--dw-surface-raised);
`;

export const DestinationIcon = styled.span`
  ${consoleGlyphStyles}
  display: grid;
  place-items: center;
  color: ${({ $inBox }) => $inBox ? 'var(--box-primary)' : 'var(--dw-violet)'};
  svg {
    width: 24px;
    height: 24px;
  }
`;

export const DestinationCopy = styled.div`
  display: grid;
  gap: 0.08rem;
  min-width: 0;
`;

export const DestinationKicker = styled.div`
  color: var(--dw-text-secondary);
  font: 400 .75rem/1.3 var(--dw-font-ui);
`;

export const DestinationStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

export const DestinationLabel = styled.div`
  flex: 1;
  min-width: 0;
  color: var(--dw-text);
  font: 500 1rem/1.3 var(--dw-font-ui);
  overflow-wrap: anywhere;
`;

export const DestinationHint = styled.span`
  color: var(--dw-text-muted);
  font: 400 .75rem/1.4 var(--dw-font-ui);
`;

export const DestinationMeta = styled.span`
  color: var(--box-primary);
  font: 500 .8rem/1.3 var(--dw-font-data);
`;

export const QuietButton = styled.button`
  ${consoleControlStyles}
  font-size: .75rem;
`;

export const Form = styled.form`
  display: grid;
  gap: 12px;
  min-width: 0;
`;

export const PhotoControlPanel = styled.div`
  display: grid;
  gap: 0.45rem;
`;

export const PhotoStage = styled.div`
  display: grid;
  grid-template-columns: ${({ $hasPreview }) => $hasPreview ? '76px minmax(0, 1fr)' : 'minmax(0, 1fr)'};
  gap: 0.55rem;
  align-items: center;
  min-width: 0;
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
  > button { justify-self: start; }
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  input {
    accent-color: #9a7bf1;
    width: 18px;
    height: 18px;
  }
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
  ${consoleFieldStyles}
`;
export const NameField = styled.div`
  ${insetStageStyles}
  ${consoleGlyphStyles}
  color: var(--dw-cyan);
`;
export const NameLabel = styled(Label)`
  ${hiddenLabelStyles}`;
  export const NameInput = styled(Input)` min-height:56px;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 1.05rem;
  font-weight: 500;
  &&:focus,&&:focus-visible {
    outline: none;
    box-shadow: none;
  }
ne;
    box-shadow: none;
  }
`;

export const CompartmentField = styled.div`
  > label {
    color: var(--dw-text-muted);
    font-size: .75rem;
  }
  && select {
    ${consoleFieldStyles}
  }
`;

export const QuantityRow = styled.div`
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
  >label {
    color: var(--dw-text-secondary);
    font: 400 .75rem/1.2 var(--dw-font-ui);
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
  gap: 6px;
  min-width: 0;
`;

export const PhotoEyebrow = styled.span`
  color: var(--dw-text-secondary);
  font: 400 .75rem/1.2 var(--dw-font-ui);
`;

export const PhotoToggle = styled.button`
  ${consoleControlStyles}
  display: grid;
  grid-template-columns: 22px minmax(0,1fr) 16px;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding-inline: 10px;
  border-bottom: 1px solid var(--dw-border);
  border-radius: 0;
  background: var(--dw-background);
  >svg {
    color: var(--dw-cyan);
  }
  >span:last-child {
    color: var(--dw-cyan);
    text-align: center;
  }
`;

export const PhotoActionCopy = styled.span`
  display: grid;
  gap: 0.08rem;
  min-width: 0;
  small {
    overflow: hidden;
    color: var(--dw-text-muted, rgba(230, 237, 243, 0.56));
    font: 400 0.75rem/1.1 var(--dw-font-ui);
    letter-spacing: 0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;
    @media (max-width: 350px) { display: none; }
  }
`;

export const PhotoAction = styled.strong`
  overflow: hidden;
  color: var(--dw-text);
  font: 500 .8rem/1.25 var(--dw-font-ui);
  text-overflow: ellipsis;
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
  border-top: 1px solid var(--dw-border);
  padding: 12px 0;
  background: transparent;
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
  span: last-child {
    color: var(--box-neon, #82d8ce);
    font-size: 0.88rem;
  }
  em {
    color: #6d9592;
    font-style: normal;
    font-weight: 650;
  }
  &:hover {
    color: #e9fbf8;
  }
  &:focus-visible {
    outline: 2px solid rgba(173, 142, 255, 0.92);
    outline-offset: -2px;
  }
  ${controlStyles}
`;

export const ProgressContent = styled.div`
  padding: 0.12rem 0 0.62rem;
`;

export const QuantityControl = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0,1fr) 44px;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  border-bottom: 1px solid var(--dw-border);
  background: var(--dw-background);
`;

export const QuantityButton = styled.button`
  ${consoleControlStyles}
  color: var(--dw-cyan);
  padding: 0;
  font-size: 1.15rem;
  &:disabled {
    color: var(--dw-text-muted);
  }
`;

export const QuantityValue = styled.input`
  ${consoleFieldStyles}
  min-width: 0;
  padding: 0 2px;
  border: 0;
  text-align: center;
  font-family: var(--dw-font-data);
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button,&::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }
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
  span {
    color: #759895;
    font-weight: 600;
  }
`;

export const TagComposer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
  border-bottom: 1px solid var(--dw-border);
  background: var(--dw-background);
  padding: 4px;
  &:focus-within {
    border-color: var(--dw-cyan);
  }
`;

export const TagDraftInput = styled.input`
  ${consoleFieldStyles}
  flex: 1 1 108px;
  width: auto;
  min-width: 0;
  border: 0;
`;

export const TagStageButton = styled.button`
  ${consoleControlStyles}
  color: var(--dw-cyan);
`;

export const PrimaryButton = styled.button`
  ${primaryCommandStyles}
  justify-self: end;
  max-width: 100%;
  font-size: .8rem;
  span {
    overflow-wrap: anywhere;
  }
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
  ${consoleControlStyles}
  width: 100%;
  justify-content: space-between;
  font-size: .85rem;
  text-align: left;
  padding-inline: 0;
  span {
    color: var(--dw-text-secondary);
    font-size: .8rem;
    font-weight: 400;
  }
  > span:first-child {
    min-width: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow-wrap: anywhere;
  }
  > span:last-child {
    flex-shrink: 0;
  }
`;

export const DetailEditor = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.15rem 0 0.78rem;
`;

export const TextArea = styled.textarea`
  ${consoleFieldStyles}
  min-height: 88px;
  max-height: 240px;
  resize: vertical;
  overflow: auto;
`;

export const Select = styled.select`
  ${consoleFieldStyles}
`;

export const EditorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

export const SaveButton = styled.button`
  ${primaryCommandStyles}
  font-size: .8rem;
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
`;

export const TagChip = styled.button`
  ${consoleControlStyles}
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  background: var(--dw-surface-raised);
  color: var(--dw-teal);
  font-size: .75rem;
`;
