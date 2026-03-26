import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

const LCARS = {
  panel: '#11161f',
  panelSoft: '#171f2c',
  inset: '#0b1018',
  line: 'rgba(130, 168, 196, 0.34)',
  text: '#e6edf4',
  textDim: 'rgba(214, 226, 241, 0.78)',
  teal: '#4cc6c1',
  amber: '#e8b15c',
  lilac: '#a7b6ff',
  coral: '#f08a7b',
};

export const Card = styled.form`
  position: relative;
  display: grid;
  gap: ${({ $compact }) => ($compact ? '8px' : '12px')};
  background:
    radial-gradient(circle at 92% 8%, rgba(127, 215, 255, 0.14), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 36%),
    ${LCARS.panel};
  border: 1px solid ${LCARS.line};
  border-radius: 12px;
  padding: ${({ $compact }) => ($compact ? '10px' : '13px')};
  min-width: 0;
  max-width: 100%;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 12px 24px rgba(0, 0, 0, 0.24);
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    left: 0.72rem;
    right: 0.72rem;
    top: 0.52rem;
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${LCARS.coral} 0 14%,
      transparent 14% 18%,
      ${LCARS.teal} 18% 55%,
      transparent 55% 60%,
      ${LCARS.amber} 60% 80%,
      transparent 80% 84%,
      ${LCARS.lilac} 84% 100%
    );
    opacity: ${({ $compact }) => ($compact ? 0 : 0.56)};
    pointer-events: none;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: ${({ $compact }) => ($compact ? '7px' : '8px')};
    gap: ${({ $compact }) => ($compact ? '7px' : '8px')};

    &::before {
      left: 0.54rem;
      right: 0.54rem;
      top: 0.4rem;
      height: 3px;
      opacity: ${({ $compact }) => ($compact ? 0 : 0.42)};
    }
  }
`;

export const ConsoleHeader = styled.div`
  display: grid;
  gap: 3px;
  margin-bottom: 1px;
`;

export const ConsoleKicker = styled.span`
  font-size: 11px;
  font-weight: 760;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${LCARS.textDim};
`;

export const ConsoleTitle = styled.h4`
  margin: 0;
  color: ${LCARS.text};
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
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

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1.35fr) minmax(250px, 0.95fr);
    align-items: start;
  }
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
  border: 1px solid
    ${({ $tone = 'teal' }) =>
      $tone === 'amber'
        ? 'rgba(232, 177, 92, 0.36)'
        : $tone === 'lilac'
          ? 'rgba(167, 182, 255, 0.36)'
          : 'rgba(76, 198, 193, 0.36)'};
  border-radius: 11px;
  padding: 9px;
  background:
    linear-gradient(
      110deg,
      ${({ $tone = 'teal' }) =>
          $tone === 'amber'
            ? 'rgba(232, 177, 92, 0.1)'
            : $tone === 'lilac'
              ? 'rgba(167, 182, 255, 0.12)'
              : 'rgba(76, 198, 193, 0.1)'}
        0%,
      transparent 52%
    ),
    ${LCARS.panelSoft};
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 9px;
    padding: 7px;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 7px;
`;

export const SectionLabel = styled.span`
  font-size: 10px;
  font-weight: 760;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(214, 226, 241, 0.66);
`;

export const SectionTitle = styled.h5`
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${LCARS.text};
`;

export const SectionHint = styled.span`
  font-size: 10px;
  color: rgba(214, 226, 241, 0.62);
`;

export const SectionBody = styled.div`
  display: grid;
  gap: 9px;
  min-width: 0;
`;

export const MediaFrame = styled.div`
  display: grid;
  gap: 8px;
  border: 1px solid rgba(130, 168, 196, 0.24);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(11, 16, 24, 0.92), rgba(10, 15, 22, 0.9));
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
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) => ($compact ? '2px' : '0')};
  min-width: 0;
`;

export const Label = styled.label`
  font-size: 11px;
  font-weight: 740;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${LCARS.textDim};
  margin-bottom: ${({ $compact }) => ($compact ? '4px' : '6px')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    margin-bottom: ${({ $compact }) => ($compact ? '3px' : '4px')};
  }
`;

export const Input = styled.input`
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  border-radius: 8px;
  border: 1px solid rgba(122, 142, 167, 0.44);
  background: ${LCARS.inset};
  color: ${LCARS.text};
  font-size: ${({ $compact }) => ($compact ? '13px' : '14px')};
  min-height: ${({ $compact }) => ($compact ? '36px' : MOBILE_CONTROL_MIN_HEIGHT)};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.2);
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
    min-height: 36px;
  }
`;

export const Select = styled.select`
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  border-radius: 8px;
  border: 1px solid rgba(122, 142, 167, 0.44);
  background: ${LCARS.inset};
  color: ${LCARS.text};
  font-size: ${({ $compact }) => ($compact ? '13px' : '14px')};
  min-height: ${({ $compact }) => ($compact ? '36px' : MOBILE_CONTROL_MIN_HEIGHT)};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${LCARS.teal};
    box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    padding: 8px 10px;
    min-height: 36px;
  }
`;

export const LocationSection = styled.div`
  border: 1px solid rgba(130, 168, 196, 0.28);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 34%),
    #171e2a;
  padding: ${({ $compact }) => ($compact ? '6px' : '8px')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: ${({ $compact }) => ($compact ? '5px' : '6px')};
    border-radius: 9px;
  }
`;

export const LocationShell = styled.div`
  position: relative;
`;

export const LocationInput = styled.input`
  width: 100%;
  min-height: ${({ $compact }) => ($compact ? '36px' : '40px')};
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '9px 12px')};
  border-radius: 8px;
  border: 1px solid rgba(122, 142, 167, 0.45);
  background: #0b1018;
  color: #e6edf4;
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: #4cc6c1;
    box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.2);
    background: #0c121b;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 36px;
    padding: 8px 10px;
    font-size: ${MOBILE_FONT_SM};
  }
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
  border-radius: 8px;
  border: 1px solid rgba(122, 142, 167, 0.45);
  background: #0b1018;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.38);
  max-height: 240px;
  overflow: auto;
`;

export const LocationOption = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(76, 198, 193, 0.55)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(76, 198, 193, 0.15)' : 'transparent')};
  color: ${({ $muted }) => ($muted ? 'rgba(214, 226, 241, 0.68)' : '#e6edf4')};
  cursor: pointer;

  &:hover {
    border-color: rgba(76, 198, 193, 0.45);
    background: rgba(76, 198, 193, 0.18);
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
  font-size: 11px;
  color: rgba(214, 226, 241, 0.68);
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 10px;
  }
`;

export const CreateBadge = styled.span`
  border: 1px solid rgba(167, 182, 255, 0.52);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  color: #dce4ff;
  background: rgba(167, 182, 255, 0.16);
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 10px;
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

export const ShortIdInput = styled.input`
  font-family: monospace;
  text-align: center;
  width: ${({ $compact }) => ($compact ? '4em' : '4.5em')};
  margin: 0 auto;
  padding: ${({ $compact }) => ($compact ? '8px 8px' : '10px 12px')};
  border-radius: 8px;
  border: 2px solid ${({ $status }) => statusColor($status)};
  background: #101010;
  color: #eaeaea;
  font-size: ${({ $compact }) => ($compact ? '16px' : '18px')};
  letter-spacing: 2px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${({ $status }) => statusColor($status)};
    box-shadow: 0 0 0 2px
      ${({ $status }) =>
        $status === 'inProgress'
          ? 'rgba(255,212,0,0.30)'
          : $status === 'valid'
            ? 'rgba(78,199,123,0.30)'
            : $status === 'invalid'
              ? 'rgba(255,77,79,0.30)'
        : 'rgba(180,180,180,0.15)'};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 4em;
    padding: 8px 8px;
    font-size: 16px;
  }
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
  border-radius: 8px;
  border: 1px dashed #2f2f2f;
  background: #101010;

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
  border-radius: 999px;
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};
  color: #eaeaea;
`;

export const RemoveX = styled.button`
  border: none;
  background: transparent;
  color: #bdbdbd;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  &:hover {
    color: #ff8080;
  }
`;

export const TagAdder = styled.input`
  padding: ${({ $compact }) => ($compact ? '5px 8px' : '6px 8px')};
  min-width: 140px;
  border-radius: 999px;
  border: 1px dashed #2a2a2a;
  background: #0f0f0f;
  color: #eaeaea;
  font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};

  &:focus {
    outline: none;
    border-color: #4ec77b;
    box-shadow: 0 0 0 2px rgba(78, 199, 123, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-width: 0;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const FileStub = styled.div`
  padding: ${({ $compact }) => ($compact ? '8px' : '12px')};
  border-radius: 8px;
  border: 1px dashed #2a2a2a;
  background: #101010;
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
  border-radius: 10px;
  border: 1px solid #2f2f2f;
  background: #0f0f0f;
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
  bottom: 0;
  z-index: 3;
  display: flex;
  gap: ${({ $compact }) => ($compact ? '6px' : '8px')};
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  margin-top: ${({ $compact }) => ($compact ? '8px' : '10px')};
  padding-top: ${({ $compact }) => ($compact ? '8px' : '10px')};
  background: linear-gradient(
    180deg,
    rgba(17, 22, 31, 0),
    rgba(17, 22, 31, 0.94) 44%,
    rgba(17, 22, 31, 0.99)
  );

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    position: static;
    justify-content: stretch;
    margin-top: 6px;
    padding-top: 6px;
    background: none;
  }
`;

export const Ghost = styled.button`
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  width: auto;
  border-radius: 8px;
  border: 1px solid #2f2f2f;
  background: #141414;
  color: #eaeaea;
  cursor: pointer;
  min-height: ${({ $compact }) => ($compact ? '36px' : MOBILE_CONTROL_MIN_HEIGHT)};

  &:hover {
    border-color: #4ec77b;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-height: 36px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Primary = styled.button`
  padding: ${({ $compact }) => ($compact ? '8px 10px' : '10px 12px')};
  width: auto;
  border-radius: 8px;
  border: 1px solid #2a3e30;
  background: #1b2a1f;
  color: #d9f2e6;
  font-weight: 700;
  cursor: pointer;
  min-height: ${({ $compact }) => ($compact ? '36px' : MOBILE_CONTROL_MIN_HEIGHT)};

  &:hover {
    border-color: #4ec77b;
    box-shadow: 0 0 0 2px rgba(78, 199, 123, 0.15) inset;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-height: 36px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const DangerGhost = styled(Ghost)`
  border-color: rgba(201, 103, 103, 0.68);
  background: rgba(57, 20, 20, 0.92);
  color: #ffd9d9;

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
