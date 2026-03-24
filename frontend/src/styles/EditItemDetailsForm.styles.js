import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from './tokens';

const LCARS = {
  panel: '#11161f',
  panelSoft: '#171e2a',
  inset: '#0b1018',
  line: 'rgba(130, 168, 196, 0.36)',
  text: '#e6edf4',
  textDim: 'rgba(214, 226, 241, 0.8)',
  teal: '#4cc6c1',
  coral: '#f08a7b',
  amber: '#e8b15c',
  lilac: '#a7b6ff',
};

const disabledStyles = `
  opacity: 0.52;
  cursor: not-allowed;
`;

export const Form = styled.form`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  max-width: 100%;
  padding: 1rem;
  padding-bottom: ${({ $actionDocked }) =>
    $actionDocked ? 'calc(7.2rem + env(safe-area-inset-bottom))' : '1rem'};
  border-radius: 14px;
  border: 1px solid ${LCARS.line};
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 34%),
    ${LCARS.panel};
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 14px 28px rgba(0, 0, 0, 0.24);
  overflow: hidden;
  isolation: isolate;

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  &::before {
    left: 0.9rem;
    right: 0.9rem;
    top: 0.65rem;
    height: 5px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${LCARS.coral} 0 17%,
      transparent 17% 21%,
      ${LCARS.teal} 21% 56%,
      transparent 56% 62%,
      ${LCARS.amber} 62% 82%,
      transparent 82% 86%,
      ${LCARS.lilac} 86% 100%
    );
    opacity: 0.62;
  }

  &::after {
    left: 0;
    top: 1.15rem;
    bottom: 1.15rem;
    width: 8px;
    border-radius: 0 999px 999px 0;
    background: linear-gradient(180deg, ${LCARS.teal}, ${LCARS.lilac} 58%, ${LCARS.coral});
    opacity: 0.48;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.72rem;
    padding: 0.72rem 0.64rem 0.68rem;
    padding-bottom: ${({ $actionDocked }) =>
      $actionDocked ? 'calc(7.8rem + env(safe-area-inset-bottom))' : '0.68rem'};
    border-radius: ${MOBILE_PANEL_RADIUS};
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.02),
      0 7px 14px rgba(0, 0, 0, 0.2);

    &::before {
      left: 0.65rem;
      right: 0.65rem;
      top: 0.46rem;
      height: 3px;
      opacity: 0.42;
    }

    &::after {
      top: 0.72rem;
      bottom: 0.72rem;
      width: 5px;
      opacity: 0.36;
    }
  }
`;

export const Fieldset = styled.fieldset`
  position: relative;
  z-index: 1;
  border: 0;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;

  &:disabled {
    opacity: 0.66;
    pointer-events: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.65rem;
  }
`;

export const Field = styled.div`
  display: grid;
  gap: 0.4rem;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(140, 160, 179, 0.2);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 70%),
    ${LCARS.panelSoft};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.42rem 0.44rem;
    border-radius: 9px;
  }
`;

export const Label = styled.label`
  font-size: 0.74rem;
  font-weight: 700;
  color: ${LCARS.textDim};
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;
  }
`;

export const FieldHint = styled.span`
  color: rgba(214, 226, 241, 0.64);
  font-size: 0.7rem;
  line-height: 1.35;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const fieldControlStyles = `
  width: 100%;
  border-radius: 9px;
  border: 1px solid rgba(122, 142, 167, 0.45);
  background: ${LCARS.inset};
  color: ${LCARS.text};
  font-size: 1.02rem;
  font-weight: 520;
  line-height: 1.35;
  padding: 0.62rem 0.72rem;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;

  &::placeholder {
    color: rgba(214, 226, 241, 0.44);
  }

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow:
      0 0 0 2px rgba(76, 198, 193, 0.25),
      inset 0 0 0 1px rgba(255, 255, 255, 0.03);
    background: #0c121b;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    line-height: 1.3;
    padding: 0.48rem 0.54rem;
    border-radius: 8px;
    min-height: 36px;
  }
`;

export const Input = styled.input`
  ${fieldControlStyles}
`;

export const TextArea = styled.textarea`
  ${fieldControlStyles}
  min-height: 4.6rem;
  resize: vertical;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 4rem;
  }
`;

export const Select = styled.select`
  ${fieldControlStyles}
`;

export const InlineGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
`;

export const ReadOnlyValue = styled.div`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 9px;
  border: 1px solid rgba(122, 142, 167, 0.4);
  background: rgba(12, 18, 27, 0.76);
  color: ${LCARS.text};
  font-size: 0.96rem;
  font-weight: 560;
  line-height: 1.3;
  padding: 0.58rem 0.72rem;
  display: flex;
  align-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 36px;
    border-radius: 8px;
    font-size: ${MOBILE_FONT_SM};
    padding: 0.45rem 0.54rem;
  }
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

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.35rem;

  ${({ $docked }) =>
    $docked
      ? `
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: max(0.62rem, env(safe-area-inset-bottom));
    z-index: 60;
    width: min(960px, calc(100vw - 4rem));
    margin: 0;
    padding: 0.58rem 0.62rem;
    border: 1px solid rgba(140, 160, 179, 0.44);
    border-radius: 13px;
    background:
      linear-gradient(180deg, rgba(23, 30, 42, 0.96), rgba(17, 22, 31, 0.96)),
      ${LCARS.panel};
    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.42),
      inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(8px);
  `
      : ''}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    ${({ $docked }) =>
      $docked
        ? `
      width: calc(100vw - (var(--mobile-gap) * 2));
      bottom: max(0.46rem, env(safe-area-inset-bottom));
      padding: 0.5rem 0.46rem;
      border-radius: 11px;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: stretch;
    `
        : `
    position: sticky;
    bottom: 0;
    z-index: 2;
    flex-wrap: wrap;
    justify-content: stretch;
    margin-top: 0.2rem;
    padding-top: 0.42rem;
    background: linear-gradient(180deg, rgba(17, 22, 31, 0), rgba(17, 22, 31, 0.95) 42%);
    `}
  }
`;

export const UnsavedStatus = styled.span`
  margin-right: auto;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.16rem 0.52rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $dirty }) =>
      $dirty ? 'rgba(240, 138, 123, 0.58)' : 'rgba(167, 182, 255, 0.52)'};
  background: ${({ $dirty }) =>
    $dirty ? 'rgba(240, 138, 123, 0.18)' : 'rgba(167, 182, 255, 0.16)'};
  color: ${({ $dirty }) => ($dirty ? '#ffd7d2' : '#d7defd')};
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    order: 5;
    width: 100%;
    justify-content: center;
    min-height: 32px;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.04em;
  }
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

export const SaveButton = styled.button`
  ${actionButtonBase}
  border: 1px solid #2f8f4d;
  color: #d6ffe4;
  background: linear-gradient(180deg, #2d8f47, #216b36);
  box-shadow: 0 0 0 1px rgba(17, 30, 20, 0.42);
  ${({ $dirty }) =>
    $dirty
      ? `
    box-shadow:
      0 0 0 1px rgba(17, 30, 20, 0.42),
      0 0 20px rgba(51, 163, 83, 0.32);
  `
      : ''}

  &:hover:enabled {
    border-color: #42b765;
    background: linear-gradient(180deg, #35a353, #257840);
    box-shadow:
      0 0 0 1px rgba(21, 35, 26, 0.45),
      0 0 16px rgba(51, 163, 83, 0.28);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1;
    min-width: 0;
    padding: 0.45rem 0.8rem;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const RevertButton = styled.button`
  ${actionButtonBase}
  border: 1px solid rgba(167, 182, 255, 0.58);
  color: #d7defd;
  background: linear-gradient(180deg, #2b3552, #20293f);

  &:hover:enabled {
    border-color: rgba(167, 182, 255, 0.82);
    background: linear-gradient(180deg, #344064, #27314e);
    box-shadow: 0 0 14px rgba(167, 182, 255, 0.22);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1;
    min-width: 0;
    padding: 0.45rem 0.8rem;
    font-size: ${MOBILE_FONT_XS};
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
  gap: 0.58rem;
  padding: 0.62rem 0.68rem;
  border-radius: 10px;
  border: 1px solid rgba(140, 160, 179, 0.26);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 70%),
    ${LCARS.panelSoft};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.44rem;
    padding: 0.5rem 0.52rem;
    border-radius: 9px;
  }
`;

export const LifecycleHeader = styled.h3`
  margin: 0;
  color: ${LCARS.text};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;
  }
`;

export const LifecycleMetaGrid = styled.div`
  display: grid;
  gap: 0.4rem;
`;

export const LifecycleMetaRow = styled.div`
  display: grid;
  grid-template-columns: minmax(90px, 120px) minmax(0, 1fr);
  gap: 0.54rem;
  align-items: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.18rem;
  }
`;

export const LifecycleMetaLabel = styled.span`
  color: rgba(214, 226, 241, 0.72);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.05em;
  }
`;

export const LifecycleMetaValue = styled.span`
  color: ${LCARS.text};
  font-size: 0.84rem;
  line-height: 1.35;
  word-break: break-word;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const SmallActionButton = styled.button`
  ${actionButtonBase}
  min-width: 0;
  padding: 0.42rem 0.78rem;
  font-size: 0.74rem;
  border-radius: 10px;
  border: 1px solid ${({ $tone }) =>
    $tone === 'danger' ? 'rgba(240, 138, 123, 0.58)' : 'rgba(167, 182, 255, 0.58)'};
  color: ${({ $tone }) => ($tone === 'danger' ? '#ffd8d3' : '#d7defd')};
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'linear-gradient(180deg, #5e2b2b, #462121)'
      : 'linear-gradient(180deg, #2b3552, #20293f)'};

  &:hover:enabled {
    border-color: ${({ $tone }) =>
      $tone === 'danger' ? 'rgba(240, 138, 123, 0.82)' : 'rgba(167, 182, 255, 0.82)'};
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
