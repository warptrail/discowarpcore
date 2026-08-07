import styled, { keyframes } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from './tokens';

const LCARS = {
  inset: '#0b1018',
  text: '#e6edf4',
  teal: '#4cc6c1',
};

const disabledStyles = `
  opacity: 0.52;
  cursor: not-allowed;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  max-width: 100%;
`;

export const Fieldset = styled.fieldset`
  border: 0;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.72rem;

  &:disabled {
    opacity: 0.66;
    pointer-events: none;
  }

  @media (max-width: 599px) { gap: 0.6rem; }
`;

export const CarouselShell = styled.section`
  display: grid;
  gap: 0.72rem;
  min-width: 0;
`;

export const CarouselCap = styled.header`
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  min-height: 52px;
  padding: 0.36rem 0 0.5rem;
  border-bottom: 1px solid rgba(169, 187, 207, 0.16);
  background: rgba(9, 13, 19, 0.94);
  backdrop-filter: blur(12px);
`;

export const CarouselTitle = styled.h3`
  display: grid;
  gap: 0.16rem;
  min-width: 0;
  margin: 0;
  color: #e7f3f8;
  font-size: 0.92rem;
  font-weight: 720;
  line-height: 1.12;
  letter-spacing: -0.01em;
`;

export const CarouselDirty = styled.span`
  color: ${({ $dirty }) => ($dirty ? '#e7c17d' : 'rgba(214, 226, 241, 0.46)')};
  font: 700 0.55rem/1.1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const CarouselControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  flex: 0 0 auto;
`;

export const CarouselArrow = styled.button`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: rgba(218, 232, 240, 0.76);
  background: transparent;
  font-size: 1.38rem;
  line-height: 1;
  cursor: pointer;
  transition: color 180ms ease, background 180ms ease;

  &:hover:not(:disabled) { color: #effcff; background: rgba(76, 198, 193, 0.08); }
  &:focus-visible { outline: 2px solid rgba(76, 198, 193, 0.68); outline-offset: -3px; }
  &:disabled { opacity: 0.28; cursor: default; }
`;

export const CarouselDots = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.24rem;

  @media (max-width: 380px) { display: none; }
`;

export const CarouselDot = styled.button`
  width: ${({ $active }) => ($active ? '12px' : '5px')};
  height: 5px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? 'rgba(105, 211, 202, 0.78)' : 'rgba(201, 221, 232, 0.22)')};
  cursor: pointer;
  transition: width 160ms ease, background 160ms ease;

  &:focus-visible { outline: 1px solid #e7f3f8; outline-offset: 2px; }
`;

export const CarouselTrack = styled.div`
  display: block;
  min-width: 0;
`;

const sectionEnter = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const CarouselSlide = styled.section`
  min-width: 0;
  animation: ${sectionEnter} 220ms cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const ClusterCard = styled.section`
  display: grid;
  gap: 0.62rem;
  min-width: 0;
  padding: 0.1rem 0 0.4rem;
`;

export const ClusterBody = styled.div`
  display: grid;
  gap: 0.82rem;
  min-width: 0;
`;

export const Field = styled.div`
  display: grid;
  gap: 0.34rem;
  min-width: 0;
  padding: 0;
`;

export const Label = styled.label`
  color: rgba(213, 222, 234, 0.68);
  font: 720 0.65rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const FieldHint = styled.span`
  color: rgba(214, 226, 241, 0.64);
  font-size: 0.72rem;
  line-height: 1.35;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const fieldControlStyles = `
  width: 100%;
  border-radius: 7px;
  border: 1px solid rgba(134, 154, 177, 0.34);
  background: rgba(7, 11, 17, 0.92);
  color: ${LCARS.text};
  font-size: 0.96rem;
  font-weight: 540;
  line-height: 1.35;
  padding: 0.62rem 0.68rem;
  min-height: 44px;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;

  &::placeholder {
    color: rgba(214, 226, 241, 0.44);
  }

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.16);
    background: #0c121b;
  }

  @media (max-width: 599px) { font-size: 0.92rem; padding: 0.58rem 0.62rem; }
`;

export const Input = styled.input`
  ${fieldControlStyles}
`;

export const TextArea = styled.textarea`
  ${fieldControlStyles}
  min-height: 5.4rem;
  resize: vertical;

  @media (max-width: 599px) { min-height: 5.2rem; }
`;

export const Select = styled.select`
  ${fieldControlStyles}
`;

export const InlineGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.82rem;

  @media (max-width: 599px) {
    grid-template-columns: 1fr;
    gap: 0.82rem;
  }
`;

export const ReadOnlyValue = styled.div`
  min-height: 44px;
  border-radius: 7px;
  border: 1px solid rgba(122, 142, 167, 0.26);
  background: rgba(12, 18, 27, 0.58);
  color: ${LCARS.text};
  font-size: 0.92rem;
  font-weight: 560;
  line-height: 1.3;
  padding: 0.58rem 0.72rem;
  display: flex;
  align-items: center;

`;

export const LinkRows = styled.div`
  display: grid;
  gap: 0.52rem;
`;

export const LinkRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr) auto;
  gap: 0.42rem;
  align-items: end;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.36rem;
  }
`;

export const HistoryRows = styled.div`
  display: grid;
  gap: 0.42rem;
`;

export const HistoryRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.34rem;
  }
`;

export const LinkRemoveButton = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 8px;
  border: 1px solid rgba(240, 138, 123, 0.58);
  background: rgba(78, 28, 28, 0.78);
  color: #ffd6d1;
  font-size: 0.75rem;
  font-weight: 680;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.34rem 0.62rem;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease;

  &:hover:enabled {
    border-color: rgba(240, 138, 123, 0.84);
    background: rgba(95, 35, 35, 0.88);
  }

  &:disabled {
    ${disabledStyles}
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 36px;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const HistoryRemoveButton = styled(LinkRemoveButton)`
  margin: 0;
`;

export const AddInlineButton = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  align-self: start;
  border-radius: 8px;
  border: 1px solid rgba(76, 198, 193, 0.52);
  background: rgba(24, 66, 63, 0.58);
  color: #d6fffc;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.38rem 0.7rem;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease;

  &:hover:enabled {
    border-color: rgba(76, 198, 193, 0.82);
    background: rgba(34, 88, 84, 0.66);
  }

  &:disabled {
    ${disabledStyles}
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 36px;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const HistoryAddButton = styled(AddInlineButton)`
  margin-top: 0.1rem;
`;

export const CheckboxRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: ${LCARS.text};
  cursor: pointer;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: ${LCARS.teal};
`;

const actionButtonBase = `
  min-width: 6.2rem;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 999px;
  padding: 0.52rem 1.05rem;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;

  &:active:enabled {
    transform: translateY(1px);
  }

  &:disabled {
    ${disabledStyles}
  }
`;

export const FileInput = styled.input`
  ${fieldControlStyles}
  padding: 0.36rem 0.46rem;

  &::file-selector-button {
    border: 1px solid rgba(76, 198, 193, 0.56);
    background: rgba(76, 198, 193, 0.16);
    color: #d9fffb;
    border-radius: 6px;
    padding: 0.24rem 0.56rem;
    margin-right: 0.5rem;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 620;
  }
`;

export const ImagePreview = styled.img`
  display: block;
  width: min(240px, 100%);
  max-height: 180px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(140, 160, 179, 0.3);
  background: ${LCARS.inset};
`;

export const InlineActions = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

export const LifecycleSection = styled.section`
  display: grid;
  gap: 0.52rem;
  padding: 0.58rem 0.62rem;
  border: 1px solid rgba(76, 198, 193, 0.28);
  border-radius: 7px;
  background:
    linear-gradient(180deg, rgba(76, 198, 193, 0.055), transparent 44%),
    rgba(7, 14, 21, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.46rem;
    padding: 0.52rem 0.5rem;
    border-radius: 6px;
  }
`;

export const LifecycleHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
  min-width: 0;
`;

export const LifecycleHeader = styled.h3`
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  margin: 0;
  color: #e7f3f8;
  font: 780 0.72rem/1.1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const LifecycleEyebrow = styled.span`
  color: var(--item-accent, ${LCARS.teal});
  font: 800 0.5rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.14em;
`;

export const LifecycleStatusChip = styled.span`
  flex: 0 0 auto;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.42rem;
  border: 1px solid ${({ $gone }) => ($gone ? 'rgba(240, 138, 123, 0.58)' : 'rgba(100, 214, 167, 0.56)')};
  border-radius: 4px;
  color: ${({ $gone }) => ($gone ? '#ffd0c8' : '#c9ffe6')};
  background: ${({ $gone }) => ($gone ? 'rgba(114, 42, 40, 0.24)' : 'rgba(29, 101, 67, 0.25)')};
  font: 820 0.54rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 28px;
  }
`;

export const LifecycleMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.42rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.32rem;
  }
`;

export const LifecycleMetaRow = styled.div`
  display: grid;
  gap: 0.16rem;
  min-width: 0;
  padding: 0.34rem 0.4rem;
  border-left: 1px solid rgba(127, 215, 255, 0.24);
  background: rgba(255, 255, 255, 0.025);
  align-items: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: minmax(74px, 0.32fr) minmax(0, 1fr);
    gap: 0.42rem;
    align-items: baseline;
  }
`;

export const LifecycleMetaLabel = styled.span`
  color: rgba(168, 206, 232, 0.66);
  font: 760 0.52rem/1.15 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const LifecycleMetaValue = styled.span`
  min-width: 0;
  color: #e6edf4;
  font-size: 0.72rem;
  line-height: 1.3;
  word-break: break-word;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const SmallActionButton = styled.button`
  ${actionButtonBase}
  min-width: 0;
  min-height: 40px;
  padding: 0.42rem 0.7rem;
  font: 820 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  border-radius: 5px;
  border: 1px solid ${({ $tone }) =>
    $tone === 'danger' ? 'rgba(240, 138, 123, 0.62)' : 'rgba(167, 182, 255, 0.58)'};
  color: ${({ $tone }) => ($tone === 'danger' ? '#ffd8d3' : '#e3e7ff')};
  background: ${({ $tone }) =>
    $tone === 'danger' ? 'rgba(114, 42, 40, 0.34)' : 'rgba(62, 68, 111, 0.34)'};

  &:hover:enabled {
    border-color: ${({ $tone }) =>
      $tone === 'danger' ? 'rgba(240, 138, 123, 0.82)' : 'rgba(167, 182, 255, 0.82)'};
    background: ${({ $tone }) =>
      $tone === 'danger' ? 'rgba(145, 51, 48, 0.45)' : 'rgba(76, 82, 136, 0.45)'};
    box-shadow: 0 0 12px ${({ $tone }) =>
      $tone === 'danger' ? 'rgba(240, 138, 123, 0.16)' : 'rgba(167, 182, 255, 0.16)'};
  }
`;

export const StatusText = styled.span`
  color: ${({ $tone }) =>
    $tone === 'error'
      ? '#ffb3b3'
      : $tone === 'success'
        ? '#b9f4cd'
        : 'rgba(214, 226, 241, 0.75)'};
  font-size: 0.76rem;
`;
