import { inputStyles, controlStyles } from '../../styles/primitives';
import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

const LCARS = {
  panel: 'var(--dw-surface)',
  panelSoft: 'var(--dw-surface-raised)',
  inset: 'var(--dw-background)',
  line: 'rgba(230, 237, 243, 0.14)',
  text: 'var(--dw-text)',
  textDim: 'var(--dw-text-secondary)',
  teal: 'var(--dw-teal)',
  amber: 'var(--dw-amber)',
  lilac: 'var(--dw-violet)',
  coral: 'var(--dw-coral)',
};

export const Card = styled.form`
  position: relative;
  display: grid;
  gap: ${({ $compact }) => ($compact ? '8px' : '12px')};
  background: ${({ $flat }) => ($flat ? 'transparent' : LCARS.panel)};
  border: ${({ $flat }) => ($flat ? '0' : '1px solid rgba(230, 237, 243, 0.12)')};
  border-radius: ${({ $flat }) => ($flat ? '0' : '12px')};
  padding: ${({ $compact, $flat }) => ($flat ? '2px 0 0' : ($compact ? '10px' : '13px'))};
  min-width: 0;
  max-width: 100%;
  box-shadow: none;
  isolation: isolate;

  & > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: ${({ $compact }) => ($compact ? '7px' : '8px')};
    gap: ${({ $compact }) => ($compact ? '7px' : '8px')};

  }

  /* The edit sheet is a focused mobile utility, not a second dashboard. */
  @media (max-width: 600px) {
    gap: 6px;
    padding: 4px;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;

    &::before {
      display: none;
    }
  }
`;

export const ConsoleHeader = styled.div`
  display: grid;
  gap: 3px;
  margin-bottom: 1px;
`;

export const ConsoleKicker = styled.span`
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0.01em;
  text-transform: none;
  color: ${LCARS.textDim};
`;

export const ConsoleTitle = styled.h4`
  margin: 0;
  color: ${LCARS.text};
  font-size: 14px;
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const ConsoleHint = styled.p`
  margin: 0;
  color: rgba(214, 226, 241, 0.62);
  font-size: 12px;
  line-height: 1.38;
`;

export const ConsoleGrid = styled.div`
  display: grid;
  gap: 10px;
`;

export const ConsoleMain = styled.div`
  display: grid;
  gap: 10px;
  min-width: 0;
`;

export const ConsoleSide = styled.div`
  display: grid;
  gap: 10px;
  min-width: 0;
`;

export const SectionCard = styled.section`
  min-width: 0;
  border: 0;
  border-top: 1px solid var(--dw-border-soft);
  border-radius: 0;
  padding: 10px 0 0;
  background: transparent;
  box-shadow: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: var(--dw-radius-sm);
    padding: 7px;
  }

  @media (max-width: 600px) {
    border: 0;
    border-radius: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 7px;

  @media (max-width: 600px) {
    gap: 2px;
    margin: 4px 0 3px;
  }
`;

export const SectionLabel = styled.span`
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0.01em;
  text-transform: none;
  color: rgba(214, 226, 241, 0.66);
  display: none;

  @media (max-width: 600px) {
    font-size: 12px;
  }
`;

export const SectionTitle = styled.h5`
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.01em;
  text-transform: none;
  color: ${LCARS.text};
`;

export const SectionHint = styled.span`
  font-size: 12px;
  color: rgba(214, 226, 241, 0.62);
  display: none;

  @media (max-width: 600px) {
    display: none;
  }
`;

export const SectionBody = styled.div`
  display: grid;
  gap: 9px;
  min-width: 0;

  @media (max-width: 600px) {
    gap: 6px;
  }
`;

export const MediaFrame = styled.div`
  display: grid;
  gap: 8px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-background);
  padding: 8px;
`;

export const MediaStatusStack = styled.div`
  display: grid;
  gap: 5px;
`;

export const Row = styled.div`
  display: grid;
  gap: ${({ $compact }) => ($compact ? '8px' : '10px')};
  grid-template-columns: 1fr;
  @media (min-width: 640px) {
    grid-template-columns: ${({ $cols2, $compact, $identity }) =>
      $cols2
        ? ($compact && $identity ? '132px minmax(0, 1fr)' : '1fr 1fr')
        : '1fr'};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: ${({ $compact }) => ($compact ? '6px' : '8px')};
  }
`;

export const IdentityCompactGrid = styled.div`
  display: grid;
  gap: 8px;
  align-items: start;
  grid-template-columns: 132px minmax(0, 1fr);

  & > :last-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 390px) {
    grid-template-columns: 1fr;

    & > :last-child {
      grid-column: auto;
    }
  }
`;

export const CompactContextGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 7px;
  min-width: 0;
  padding-top: 7px;
  border-top: 1px solid var(--dw-border);

  @media (min-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const CompactMediaRegion = styled.div`
  min-width: 0;
  padding-top: 7px;
  border-top: 1px solid var(--dw-border);
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) => ($compact ? '2px' : '0')};
  min-width: 0;
  grid-column: ${({ $full }) => ($full ? '1 / -1' : 'auto')};
`;

export const Label = styled.label`
  font-size: 12px;
  font-weight: 740;
  letter-spacing: 0.01em;
  text-transform: none;
  color: ${LCARS.textDim};
  margin-bottom: ${({ $compact }) => ($compact ? '4px' : '6px')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    margin-bottom: ${({ $compact }) => ($compact ? '3px' : '4px')};
  }

  @media (max-width: 600px) {
    font-size: 12px;
    margin-bottom: 2px;
  }
`;

export const Input = styled.input`
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: ${LCARS.inset};
  color: #c9d8eb;
  font-size: ${({ $compact }) => ($compact ? '13px' : '14px')};
  min-height: ${({ $compact }) => ($compact ? '36px' : MOBILE_CONTROL_MIN_HEIGHT)};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow: none;
  }

  ${({ $invalid }) =>
    $invalid &&
    css`
      border-color: #ff4d4f;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    padding: 8px 10px;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  }

  ${inputStyles}
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: ${LCARS.inset};
  color: #c9d8eb;
  font-size: ${({ $compact }) => ($compact ? '13px' : '14px')};
  min-height: ${({ $compact }) => ($compact ? '88px' : '110px')};
  line-height: 1.45;
  resize: vertical;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  white-space: pre-wrap;

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    padding: 8px 10px;
    min-height: ${({ $compact }) => ($compact ? '80px' : '96px')};
  }

  @media (max-width: 600px) {
    min-height: ${({ $compact }) => ($compact ? '68px' : '76px')};
    padding: 7px 9px;
  }

  ${inputStyles}
  min-height: 88px;
  resize: vertical;
`;

export const Select = styled.select`
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: ${LCARS.inset};
  color: #c9d8eb;
  font-size: ${({ $compact }) => ($compact ? '13px' : '14px')};
  min-height: ${({ $compact }) => ($compact ? '36px' : MOBILE_CONTROL_MIN_HEIGHT)};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    padding: 8px 10px;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  }

  ${inputStyles}
`;

export const LocationSection = styled.div`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  padding: ${({ $compact }) => ($compact ? '6px' : '8px')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: ${({ $compact }) => ($compact ? '5px' : '6px')};
    border-radius: var(--dw-radius-sm);
  }
`;

export const LocationShell = styled.div`
  position: relative;
`;

export const LocationStructureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-top: 8px;

  & > :first-child, & > :last-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;

    & > :first-child, & > :last-child {
      grid-column: auto;
    }
  }
`;

export const LocationSubform = styled.section`
  display: grid;
  gap: 7px;
  padding: 9px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
`;

export const LocationSubformHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const LocationSubformTitle = styled.span`
  color: rgba(214, 226, 241, 0.66);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const LocationLevelField = styled.label`
  display: grid;
  gap: 4px;
  min-width: 0;
  color: ${LCARS.textDim};
  font-size: 12px;
  font-weight: 740;
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const LocationAction = styled.button`
  flex: 1;
  margin: 0;
  min-height: 34px;
  padding: 7px 10px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: #c9f5ef;
  font: 740 11px/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  cursor: pointer;

  &:hover:enabled,
  &:focus-visible {
    border-color: #4cc6c1;
    background: var(--dw-surface-raised);
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  ${controlStyles}
`;

export const LocationActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $iconOnly }) => ($iconOnly ? 'flex-end' : 'flex-start')};
  gap: 6px;
  margin-top: 7px;
`;

export const LocationClear = styled.button`
  width: 34px;
  min-width: 34px;
  min-height: 34px;
  padding: 0;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: transparent;
  color: rgba(214, 226, 241, 0.52);
  font: 700 17px/1 var(--dw-font-ui);
  cursor: pointer;

  &:hover:enabled,
  &:focus-visible {
    border-color: rgba(240, 138, 123, 0.54);
    background: var(--dw-surface-raised);
    color: #f6b3aa;
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  ${controlStyles}
  flex: 0 0 auto;
  width: auto;
  justify-self: start;
`;

export const LocationInput = styled.input`
  width: 100%;
  min-height: ${({ $compact }) => ($compact ? '36px' : '40px')};
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '9px 12px')};
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-background);
  color: #c9d8eb;
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: #4cc6c1;
    box-shadow: none;
    background: var(--dw-background);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding: 8px 10px;
    font-size: ${MOBILE_FONT_SM};
  }

  ${inputStyles}
`;

export const LocationDropdown = styled.ul`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 5;
  list-style: none;
  margin: 0;
  padding: 6px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-background);
  box-shadow: none;
  max-height: 240px;
  overflow: auto;

  ${({ $portal }) =>
    $portal &&
    css`
      right: auto;
      z-index: 10000;
      max-height: none;
    `}
`;

export const LocationOption = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(76, 198, 193, 0.55)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(76, 198, 193, 0.15)' : 'transparent')};
  color: ${({ $muted }) => ($muted ? 'rgba(214, 226, 241, 0.68)' : '#e6edf4')};
  cursor: pointer;

  &:hover {
    border-color: rgba(76, 198, 193, 0.45);
    background: var(--dw-surface-raised);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 7px 8px;
  }
`;

export const LocationOptionName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LocationOptionMeta = styled.span`
  font-size: 12px;
  color: rgba(214, 226, 241, 0.68);
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 12px;
  }
`;

export const CreateBadge = styled.span`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 2px 8px;
  font-size: 12px;
  color: #dce4ff;
  background: var(--dw-surface-raised);
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 12px;
    padding: 2px 6px;
  }
`;

export const statusColor = ($status) =>
  $status === 'inProgress'
    ? '#ffd400'
    : $status === 'valid'
      ? '#4ec77b'
      : $status === 'invalid'
        ? '#ff4d4f'
        : '#2f2f2f';

const shortIdBorderColor = ($status, $palette) => {
  if ($status === 'inProgress' || $status === 'invalid') return statusColor($status);
  return $palette || statusColor($status);
};

const shortIdFocusRing = ($status, $paletteRgb) => {
  if ($status === 'inProgress') return 'rgba(255,212,0,0.30)';
  if ($status === 'invalid') return 'rgba(255,77,79,0.30)';
  if ($paletteRgb) return `rgba(${$paletteRgb},0.24)`;
  return $status === 'valid' ? 'rgba(78,199,123,0.30)' : 'rgba(180,180,180,0.15)';
};

export const ShortIdInput = styled.input`
  font-family: var(--dw-font-ui);
  text-align: center;
  width: ${({ $compact }) => ($compact ? '4em' : '4.5em')};
  margin: 0 auto;
  padding: ${({ $compact }) => ($compact ? '8px 8px' : '10px 12px')};
  border-radius: var(--dw-radius-sm);
  border: 2px solid ${({ $status, $palette }) => shortIdBorderColor($status, $palette)};
  background: var(--dw-background);
  color: #cfe0ff;
  font-size: ${({ $compact }) => ($compact ? '16px' : '18px')};
  letter-spacing: 2px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${({ $status, $palette }) => shortIdBorderColor($status, $palette)};
    box-shadow: 0 0 0 2px
      ${({ $status, $paletteRgb }) => shortIdFocusRing($status, $paletteRgb)};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 4em;
    padding: 8px 8px;
    font-size: 16px;
  }

  ${inputStyles}
  font-family: var(--dw-font-data);

  border-color: ${({ $status }) => $status === 'invalid' ? 'var(--dw-coral)' : $status === 'inProgress' ? 'var(--dw-amber)' : $status === 'valid' ? 'var(--dw-teal)' : 'var(--dw-border)'};
  padding-inline: 0.4rem;
`;

export const Hint = styled.div`
  margin-top: ${({ $compact }) => ($compact ? '4px' : '6px')};
  font-size: 12px;
  color: ${({ $error, $success }) =>
    $error ? '#ffbdbd' : $success ? '#9BE2B5' : '#bdbdbd'};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const TagWrap = styled.div`
  padding: ${({ $compact }) => ($compact ? '6px' : '8px')};
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-background);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 6px;
  }
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ $compact }) => ($compact ? '5px' : '6px')};
`;

export const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ $compact }) => ($compact ? '5px' : '6px')};
  padding: ${({ $compact }) => ($compact ? '4px 7px' : '6px 8px')};
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  border: 1px solid var(--dw-border);
  font-family: var(--dw-font-ui);
  font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};
  color: #98c2ff;
`;

export const RemoveX = styled.button`
  border: none;
  background: transparent;
  color: #87aeea;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  &:hover {
    color: #ff8080;
  }

  ${controlStyles}
  color: var(--dw-coral);

  min-width: 32px;
  min-height: 32px;
  padding: 0.2rem;
`;

export const TagAdder = styled.input`
  padding: ${({ $compact }) => ($compact ? '5px 8px' : '6px 8px')};
  min-width: 140px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-background);
  color: #c9d8eb;
  font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};

  &:focus {
    outline: none;
    border-color: #4d96ff;
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-width: 0;
    font-size: ${MOBILE_FONT_SM};
  }

  ${inputStyles}
`;

export const FileStub = styled.div`
  padding: ${({ $compact }) => ($compact ? '8px' : '12px')};
  border-radius: var(--dw-radius-sm);
  border: 1px dashed #2a2a2a;
  background: var(--dw-background);
  color: #bdbdbd;
  font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 10px;
  }
`;

export const ImagePreview = styled.img`
  display: block;
  width: ${({ $compact }) => ($compact ? '96px' : 'min(220px, 100%)')};
  height: ${({ $compact }) => ($compact ? '96px' : 'auto')};
  max-height: ${({ $compact }) => ($compact ? '96px' : '170px')};
  object-fit: cover;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-background);
  margin-bottom: ${({ $compact }) => ($compact ? '0' : '8px')};
`;

export const Actions = styled.div`
  display: flex;
  gap: ${({ $compact }) => ($compact ? '6px' : '8px')};
  justify-content: ${({ $alignStart }) => ($alignStart ? 'flex-start' : 'flex-end')};
  flex-wrap: ${({ $wrap }) => ($wrap ? 'wrap' : 'nowrap')};
  margin-top: ${({ $compact }) => ($compact ? '8px' : '12px')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    flex-direction: column;
    margin-top: 8px;
  }
`;

export const FormActionDock = styled.div`
  position: sticky;
  bottom: -1px;
  z-index: 6;
  display: flex;
  gap: ${({ $compact }) => ($compact ? '6px' : '8px')};
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  margin-top: ${({ $compact }) => ($compact ? '8px' : '10px')};
  padding: ${({ $compact }) => ($compact ? '8px 0' : '12px 0 10px')};
  border-top: 1px solid var(--dw-border);
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    position: sticky;
    bottom: -1px;
    justify-content: stretch;
    margin-top: 6px;
    padding: 8px 0 max(8px, env(safe-area-inset-bottom));
    background: var(--dw-surface);
  }
`;

export const AutoSaveStatus = styled.div`
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--dw-border);
  color: ${({ $status }) => {
    if ($status === 'error') return 'var(--dw-coral)';
    if ($status === 'saved') return 'var(--dw-teal)';
    return 'var(--dw-text-muted)';
  }};
  font: 650 10px/1.2 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-align: right;
`;

export const Ghost = styled.button`
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  width: auto;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:hover {
    border-color: var(--dw-cyan);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }

  ${controlStyles}
  color: var(--dw-violet);
`;

export const Primary = styled.button`
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  width: auto;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-teal);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  font-weight: 700;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:hover {
    border-color: var(--dw-cyan);
    background: var(--dw-surface-raised);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }

  ${controlStyles}
  color: var(--dw-cyan);
  border-color: var(--dw-cyan);
`;

export const DangerGhost = styled(Ghost)`
  border-color: rgba(201, 103, 103, 0.68);
  background: var(--dw-surface-raised);
  color: var(--dw-coral);

  &:hover {
    border-color: rgba(232, 129, 129, 0.92);
  }
`;

export const ImageCompactGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(92px, 104px) minmax(0, 1fr);
  gap: 8px;
  align-items: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

export const ImageActionStack = styled.div`
  display: grid;
  gap: 5px;
  align-content: start;
  min-width: 0;
`;

export const CompactPhotoActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

export const CompactPhotoButton = styled(Ghost)`
  min-height: 34px;
  padding: 6px 10px;
  font-size: 12px;
  align-self: start;
`;
