import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

const RETRIEVAL = {
  bg: '#0d1116',
  panel: '#141a21',
  panelAlt: '#1b2430',
  row: '#121922',
  rowHover: '#1a2330',
  border: 'rgba(127, 215, 255, 0.18)',
  borderStrong: 'rgba(127, 215, 255, 0.36)',
  text: '#e8eef4',
  textDim: 'rgba(232, 238, 244, 0.78)',
  textMuted: 'rgba(232, 238, 244, 0.55)',
  cyan: '#77d5ff',
  teal: '#4cc6c1',
  mint: '#67efc8',
  amber: '#e8b15c',
  decommissioned: '#e56f67',
};

const keepPriorityToneColor = (tone) => {
  if (tone === 'decommissioned') return RETRIEVAL.decommissioned;
  if (tone === 'low') return '#ef9d47';
  if (tone === 'medium') return '#e8c75f';
  if (tone === 'high') return '#62cd88';
  if (tone === 'essential') return '#a58dff';
  if (tone === 'teal') return '#62cd88';
  if (tone === 'lilac') return '#a58dff';
  if (tone === 'amber') return '#e8c75f';
  return RETRIEVAL.textDim;
};

const expandedActionTone = (tone) => {
  if (tone === 'used') {
    return {
      border: 'rgba(111, 196, 255, 0.52)',
      background: 'rgba(111, 196, 255, 0.2)',
      color: '#e0f4ff',
      hover: 'rgba(111, 196, 255, 0.3)',
    };
  }
  if (tone === 'checked') {
    return {
      border: 'rgba(156, 160, 255, 0.52)',
      background: 'rgba(156, 160, 255, 0.2)',
      color: '#ecebff',
      hover: 'rgba(156, 160, 255, 0.3)',
    };
  }
  if (tone === 'consumed') {
    return {
      border: 'rgba(100, 220, 181, 0.52)',
      background: 'rgba(100, 220, 181, 0.2)',
      color: '#dffcf4',
      hover: 'rgba(100, 220, 181, 0.3)',
    };
  }
  return {
    border: 'rgba(111, 226, 173, 0.52)',
    background: 'rgba(111, 226, 173, 0.2)',
    color: '#e8fff3',
    hover: 'rgba(111, 226, 173, 0.3)',
  };
};

const panelChrome = css`
  border: 1px solid ${RETRIEVAL.border};
  border-radius: 14px;
  background:
    radial-gradient(circle at 92% 9%, rgba(76, 198, 193, 0.1), transparent 42%),
    linear-gradient(180deg, ${RETRIEVAL.panelAlt} 0%, ${RETRIEVAL.panel} 100%);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.24),
    0 14px 28px rgba(0, 0, 0, 0.28);
`;

const controlField = css`
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid ${RETRIEVAL.borderStrong};
  background: ${RETRIEVAL.bg};
  color: ${RETRIEVAL.text};
  padding: 0.5rem 0.65rem;
  outline: none;
  font-size: 0.88rem;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;

  &:focus {
    border-color: rgba(119, 213, 255, 0.8);
    box-shadow: 0 0 0 2px rgba(119, 213, 255, 0.24);
    background: ${RETRIEVAL.panelAlt};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
    border-radius: 9px;
  }
`;

export const PageShell = styled.section`
  display: grid;
  gap: 0.72rem;
  color: ${RETRIEVAL.text};
`;

export const ControlsPanel = styled.section`
  ${panelChrome};
  display: grid;
  gap: 0.56rem;
  padding: 0.68rem;
  position: relative;
  z-index: 6;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    position: sticky;
    top: 0.35rem;
    padding: 0.54rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    gap: 0.52rem;
    backdrop-filter: blur(12px);
  }
`;

export const StickyConsoleBeacon = styled.div`
  display: grid;
  gap: 0;
  min-width: 0;
  border-radius: 12px;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(17, 24, 33, 0.98), rgba(11, 17, 24, 0.96))'
      : 'transparent'};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 11px;
  }
`;

export const ModeToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

export const ModeToggleGroup = styled.div`
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.22rem;
  padding: 0.2rem;
  border-radius: 12px;
  border: 1px solid rgba(127, 215, 255, 0.28);
  background: rgba(10, 16, 24, 0.62);
`;

export const ModeToggleButton = styled.button`
  min-height: 34px;
  padding: 0.22rem 0.76rem;
  border-radius: 9px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(119, 213, 255, 0.58)' : 'rgba(255, 255, 255, 0.16)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(119, 213, 255, 0.26), rgba(119, 213, 255, 0.14))'
      : 'rgba(255, 255, 255, 0.06)'};
  color: ${({ $active }) => ($active ? '#e8f7ff' : RETRIEVAL.textDim)};
  font-size: 0.76rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease;

  &:hover {
    border-color: ${({ $active }) =>
      $active ? 'rgba(119, 213, 255, 0.72)' : 'rgba(119, 213, 255, 0.46)'};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
    padding: 0.2rem 0.6rem;
  }
`;

export const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
`;

export const ActiveBeaconPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.78rem;
  align-items: start;
  padding: 0.14rem 0.18rem;
  border: 1px solid rgba(127, 215, 255, 0.16);
  border-radius: 12px;
  background:
    radial-gradient(circle at 94% 10%, rgba(103, 239, 200, 0.12), transparent 40%),
    linear-gradient(180deg, rgba(15, 23, 33, 0.95), rgba(10, 16, 23, 0.95));

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.58rem;
    padding: 0.16rem 0.18rem;
    border-radius: 11px;
  }
`;

export const ActiveBeaconMain = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

export const ActiveBeaconKicker = styled.span`
  color: rgba(165, 218, 198, 0.76);
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

export const ActiveBeaconTitleRow = styled.div`
  display: grid;
  gap: 0.34rem;
  align-items: center;

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) {
    grid-template-columns: minmax(0, 1fr) auto;
  }
`;

export const ActiveBeaconName = styled.h3`
  margin: 0;
  min-width: 0;
  color: #eef6fd;
  font-size: clamp(1.02rem, 2.4vw, 1.18rem);
  font-weight: 800;
  line-height: 1.16;
  letter-spacing: 0.01em;
`;

export const ActiveBeaconLocator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  max-width: 100%;
  min-height: 2rem;
  padding: 0.28rem 0.62rem;
  border-radius: 11px;
  border: 1px solid
    ${({ $orphaned }) =>
      $orphaned ? 'rgba(229, 111, 103, 0.48)' : 'rgba(119, 213, 255, 0.42)'};
  background: ${({ $orphaned }) =>
    $orphaned
      ? 'linear-gradient(180deg, rgba(87, 21, 21, 0.72), rgba(49, 14, 14, 0.8))'
      : 'linear-gradient(180deg, rgba(16, 51, 71, 0.6), rgba(11, 29, 42, 0.84))'};
  color: ${({ $orphaned }) => ($orphaned ? '#ff9e97' : '#bcecff')};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(1rem, 2.8vw, 1.18rem);
  font-weight: 860;
  letter-spacing: 0.08em;
  line-height: 1;
  text-shadow: ${({ $orphaned }) =>
    $orphaned
      ? '0 0 8px rgba(229, 111, 103, 0.24)'
      : '0 0 10px rgba(119, 213, 255, 0.22)'};
`;

export const ActiveBeaconMetaRow = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.34rem;
  min-width: 0;
`;

export const ActiveBeaconMetaLabel = styled.span`
  color: rgba(232, 238, 244, 0.54);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const ActiveBeaconMetaValue = styled.span`
  color: rgba(215, 255, 242, 0.94);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.3;
`;

export const ActiveBeaconSubline = styled.p`
  margin: 0;
  color: rgba(232, 238, 244, 0.66);
  font-size: 0.73rem;
  line-height: 1.32;
  overflow-wrap: anywhere;
`;

export const ActiveBeaconControls = styled.div`
  display: grid;
  gap: 0.34rem;
  justify-items: end;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-content: start;
  }
`;

export const ActiveBeaconCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(119, 213, 255, 0.35);
  background: rgba(119, 213, 255, 0.16);
  color: ${RETRIEVAL.cyan};
  padding: 0.22rem 0.52rem;
  min-width: 2.5rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.79rem;
  font-variant-numeric: tabular-nums;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    padding: 0.22rem 0.46rem;
  }
`;

export const ActiveBeaconDismiss = styled.button`
  min-height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: ${RETRIEVAL.textDim};
  padding: 0.18rem 0.56rem;
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const HeadingGroup = styled.div`
  display: grid;
  gap: 0.2rem;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.52rem;
`;

export const TitlePip = styled.span`
  width: 9px;
  height: 26px;
  border-radius: 8px;
  background: ${RETRIEVAL.mint};
  box-shadow: 0 0 0 2px rgba(103, 239, 200, 0.2) inset;
`;

export const Title = styled.h2`
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(1rem, 2.2vw, 1.14rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 800;
  color: rgba(232, 238, 244, 0.95);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
    letter-spacing: 0.06em;
  }
`;

export const Subtitle = styled.p`
  margin: 0;
  font-size: 0.77rem;
  color: ${RETRIEVAL.textMuted};
  letter-spacing: 0.035em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(119, 213, 255, 0.35);
  background: rgba(119, 213, 255, 0.16);
  color: ${RETRIEVAL.cyan};
  padding: 0.3rem 0.6rem;
  min-width: 2.8rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.79rem;
  font-variant-numeric: tabular-nums;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    padding: 0.24rem 0.5rem;
  }
`;

export const SearchWrap = styled.label`
  display: grid;
  gap: 0.24rem;
`;

export const SearchLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 760;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${RETRIEVAL.textDim};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const SearchInput = styled.input`
  ${controlField};
  min-height: 44px;
  font-size: 0.92rem;
  border-radius: 12px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 48px;
    font-size: 0.94rem;
    border-radius: 11px;
  }
`;

export const SearchHint = styled.p`
  margin: 0;
  color: rgba(232, 238, 244, 0.48);
  font-size: 0.7rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const DesktopSearchWrap = styled.div`
  @media (max-width: 760px) {
    display: none;
  }
`;

export const MobileSearchTrigger = styled.button`
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 0.62rem);
  transform: translateX(-50%);
  z-index: 50;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  border: 1px solid rgba(127, 215, 255, 0.58);
  background:
    radial-gradient(circle at 30% 25%, rgba(127, 215, 255, 0.26), transparent 54%),
    rgba(10, 16, 24, 0.92);
  color: #dff3ff;
  font-size: 1.06rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(127, 215, 255, 0.15);
  cursor: pointer;

  @media (min-width: 761px) {
    display: none;
  }
`;

export const MobileSearchPanel = styled.div`
  position: fixed;
  left: 0.58rem;
  right: 0.58rem;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 4.1rem);
  z-index: 51;
  display: grid;
  gap: 0.42rem;
  border-radius: 12px;
  border: 1px solid rgba(127, 215, 255, 0.3);
  background:
    linear-gradient(180deg, rgba(18, 27, 39, 0.96), rgba(11, 18, 27, 0.96)),
    rgba(9, 16, 24, 0.95);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.44);
  padding: 0.54rem;

  @media (min-width: 761px) {
    display: none;
  }
`;

export const MobileSearchHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.48rem;
`;

export const MobileSearchTitle = styled.span`
  color: rgba(232, 238, 244, 0.76);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const MobileSearchClose = styled.button`
  border: 1px solid rgba(127, 215, 255, 0.34);
  border-radius: 8px;
  background: rgba(127, 215, 255, 0.14);
  color: #d5ecff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  min-height: 30px;
  padding: 0.16rem 0.5rem;
  cursor: pointer;
`;

export const RefineHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.46rem;
`;

export const RefineToggle = styled.button`
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(127, 215, 255, 0.36);
  background: rgba(127, 215, 255, 0.14);
  color: #d9efff;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.2rem 0.62rem;
  cursor: pointer;

  &:hover {
    background: rgba(127, 215, 255, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const RefineCount = styled.span`
  color: rgba(232, 238, 244, 0.56);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
`;

export const RefinePanel = styled.div`
  display: grid;
  gap: 0.52rem;
  border: 1px solid rgba(127, 215, 255, 0.16);
  border-radius: 12px;
  background: rgba(10, 16, 24, 0.56);
  padding: 0.48rem;
`;

export const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.52rem;

  @media (max-width: 1320px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const BoxFilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.52rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const FilterControl = styled.div`
  display: grid;
  gap: 0.24rem;
  border: 1px solid rgba(127, 215, 255, 0.17);
  border-radius: 11px;
  padding: 0.42rem;
  background: rgba(12, 18, 26, 0.65);
`;

export const FilterLabel = styled.span`
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${RETRIEVAL.textDim};
`;

export const FilterRow = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: stretch;
`;

export const FilterComboboxShell = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

export const FilterComboboxInput = styled.input`
  ${controlField};
  min-height: 36px;
  padding-right: 2rem;
  font-size: 0.84rem;
  border-color: ${({ $variant }) =>
    $variant === 'sort' ? 'rgba(111, 196, 255, 0.52)' : RETRIEVAL.borderStrong};
  background: ${({ $variant }) =>
    $variant === 'sort'
      ? 'linear-gradient(180deg, rgba(16, 44, 68, 0.78), rgba(12, 27, 43, 0.86))'
      : RETRIEVAL.bg};

  &:focus {
    border-color: ${({ $variant }) =>
      $variant === 'sort' ? 'rgba(143, 214, 255, 0.84)' : 'rgba(119, 213, 255, 0.8)'};
    box-shadow: ${({ $variant }) =>
      $variant === 'sort'
        ? '0 0 0 2px rgba(111, 196, 255, 0.34)'
        : '0 0 0 2px rgba(119, 213, 255, 0.24)'};
    background: ${({ $variant }) =>
      $variant === 'sort'
        ? 'linear-gradient(180deg, rgba(20, 55, 84, 0.84), rgba(13, 31, 49, 0.9))'
        : RETRIEVAL.panelAlt};
  }
`;

export const FilterComboboxCaret = styled.span`
  position: absolute;
  right: 0.68rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: ${({ $variant }) =>
    $variant === 'sort' ? 'rgba(168, 221, 255, 0.94)' : RETRIEVAL.textMuted};
  font-size: 0.8rem;
`;

export const FilterComboboxDropdown = styled.ul`
  position: fixed;
  z-index: 2200;
  list-style: none;
  margin: 0;
  padding: 0.32rem;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'sort' ? 'rgba(111, 196, 255, 0.54)' : RETRIEVAL.borderStrong};
  border-radius: 10px;
  background:
    ${({ $variant }) =>
      $variant === 'sort'
        ? 'linear-gradient(180deg, rgba(15, 35, 53, 0.98), rgba(10, 24, 37, 0.99))'
        : 'linear-gradient(180deg, rgba(17, 24, 34, 0.96), rgba(12, 18, 26, 0.98))'},
    ${({ $variant }) => ($variant === 'sort' ? '#0d1622' : RETRIEVAL.bg)};
  box-shadow:
    ${({ $variant }) =>
      $variant === 'sort'
        ? '0 14px 30px rgba(0, 0, 0, 0.48)'
        : '0 12px 24px rgba(0, 0, 0, 0.42)'},
    0 0 0 1px rgba(10, 16, 24, 0.38) inset;
  max-height: 320px;
  overflow: auto;
`;

export const FilterComboboxOption = styled.li`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 34px;
  padding: 0.44rem 0.58rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: ${({ $selected, $active, $variant }) =>
    $selected
      ? $variant === 'sort'
        ? 'rgba(111, 196, 255, 0.24)'
        : 'rgba(76, 198, 193, 0.24)'
      : $active
        ? $variant === 'sort'
          ? 'rgba(111, 196, 255, 0.16)'
          : 'rgba(119, 213, 255, 0.14)'
        : 'transparent'};
  border-color: ${({ $selected, $active, $variant }) =>
    $selected
      ? $variant === 'sort'
        ? 'rgba(111, 196, 255, 0.54)'
        : 'rgba(76, 198, 193, 0.48)'
      : $active
        ? $variant === 'sort'
          ? 'rgba(111, 196, 255, 0.42)'
          : 'rgba(119, 213, 255, 0.35)'
        : 'transparent'};
  color: ${({ $selected }) => ($selected ? '#e5fffb' : RETRIEVAL.text)};
  cursor: pointer;
  transition: background 100ms ease, border-color 100ms ease;

  &:hover {
    background: ${({ $selected, $variant }) =>
      $selected
        ? $variant === 'sort'
          ? 'rgba(111, 196, 255, 0.3)'
          : 'rgba(76, 198, 193, 0.28)'
        : $variant === 'sort'
          ? 'rgba(111, 196, 255, 0.2)'
          : 'rgba(119, 213, 255, 0.16)'};
    border-color: ${({ $selected, $variant }) =>
      $selected
        ? $variant === 'sort'
          ? 'rgba(111, 196, 255, 0.62)'
          : 'rgba(76, 198, 193, 0.54)'
        : $variant === 'sort'
          ? 'rgba(111, 196, 255, 0.5)'
          : 'rgba(119, 213, 255, 0.42)'};
  }
`;

export const FilterComboboxOptionLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
`;

export const FilterComboboxEmptyState = styled.li`
  padding: 0.56rem 0.58rem;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.76rem;
  text-align: left;
`;

export const AddFilterButton = styled.button`
  min-width: 68px;
  border: 1px solid rgba(103, 239, 200, 0.38);
  border-radius: 10px;
  background: rgba(103, 239, 200, 0.14);
  color: #d8fff2;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  padding: 0 0.65rem;
  transition: background 120ms ease;

  &:hover:not(:disabled) {
    background: rgba(103, 239, 200, 0.22);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 74px;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const SortSelect = styled.select`
  ${controlField};
  min-height: 36px;
  font-size: 0.82rem;
  cursor: pointer;
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, rgba(214, 231, 247, 0.85) 50%),
    linear-gradient(135deg, rgba(214, 231, 247, 0.85) 50%, transparent 50%);
  background-position:
    calc(100% - 16px) calc(50% - 2px),
    calc(100% - 10px) calc(50% - 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  padding-right: 2rem;
`;

export const ActiveChipsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.32rem;
`;

export const ActiveChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  border-radius: 999px;
  border: 1px solid rgba(76, 198, 193, 0.42);
  background: rgba(76, 198, 193, 0.14);
  color: #d8f8f5;
  font-size: 0.71rem;
  padding: 0.18rem 0.42rem 0.18rem 0.52rem;
`;

export const ActiveChipLabel = styled.span`
  line-height: 1;
`;

export const ActiveChipRemove = styled.button`
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.86rem;
  line-height: 1;
  padding: 0;
`;

export const ClearFiltersButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.05);
  color: ${RETRIEVAL.textDim};
  border-radius: 999px;
  font-size: 0.71rem;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
`;

export const ResultsPanel = styled.section`
  ${panelChrome};
  overflow: hidden;
`;

export const ResultsHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.45rem;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 14, 20, 0.45);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.5rem 0.54rem;
  }
`;

export const ResultsCount = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.75rem;
  color: ${RETRIEVAL.textDim};
  letter-spacing: 0.04em;
`;

export const ResultsList = styled.div`
  display: grid;
  gap: 0;
`;

export const BoxCentricLayout = styled.div`
  display: grid;
  gap: 0.6rem;
  padding: 0.64rem 0.68rem 0.68rem;

  @media (min-width: 980px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 1fr);
    align-items: start;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.52rem 0.54rem 0.56rem;
    gap: 0.5rem;
  }
`;

export const BoxMapPanel = styled.section`
  border-radius: 11px;
  border: 1px solid rgba(127, 215, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(15, 22, 30, 0.86), rgba(11, 18, 26, 0.84)),
    rgba(10, 16, 24, 0.8);
  display: grid;
  gap: 0.42rem;
  padding: 0.5rem;
`;

export const BoxGroup = styled.section`
  display: grid;
  gap: 0.24rem;
`;

export const BoxGroupLabel = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.67rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const BoxList = styled.div`
  display: grid;
  gap: 0.22rem;
`;

export const BoxListItem = styled.div`
  display: grid;
  gap: 0.22rem;
`;

export const BoxListRow = styled.button`
  width: 100%;
  border: 1px solid
    ${({ $active, $boxColorRgb }) =>
      $active
        ? `rgba(${$boxColorRgb || '119, 213, 255'}, 0.56)`
        : `rgba(${$boxColorRgb || '160, 170, 190'}, 0.26)`};
  border-radius: 10px;
  background: ${({ $active, $boxColorRgb }) =>
    $active
      ? `linear-gradient(
          180deg,
          rgba(${$boxColorRgb || '119, 213, 255'}, 0.2),
          rgba(${$boxColorRgb || '119, 213, 255'}, 0.11)
        )`
      : `linear-gradient(
          180deg,
          rgba(${$boxColorRgb || '160, 170, 190'}, 0.1),
          rgba(${$boxColorRgb || '160, 170, 190'}, 0.05)
        )`};
  color: ${RETRIEVAL.text};
  text-align: left;
  padding: 0.34rem 0.42rem;
  display: grid;
  gap: 0.18rem;
  cursor: pointer;
  box-shadow: ${({ $boxColorRgb }) =>
    `inset 0 1px 0 rgba(${$boxColorRgb || '160, 170, 190'}, 0.12)`};
  transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;

  &:hover {
    border-color: ${({ $boxColorRgb }) =>
      `rgba(${$boxColorRgb || '119, 213, 255'}, 0.44)`};
    background: ${({ $boxColorRgb }) =>
      `linear-gradient(
        180deg,
        rgba(${$boxColorRgb || '119, 213, 255'}, 0.16),
        rgba(${$boxColorRgb || '119, 213, 255'}, 0.09)
      )`};
    box-shadow:
      ${({ $boxColorRgb }) =>
        `inset 0 1px 0 rgba(${$boxColorRgb || '119, 213, 255'}, 0.16)`},
      ${({ $boxColorRgb }) =>
        `0 0 0 1px rgba(${$boxColorRgb || '119, 213, 255'}, 0.16)`};
  }
`;

export const MobileInlineInspectPanel = styled.section`
  border-radius: 10px;
  border: 1px solid rgba(127, 215, 255, 0.24);
  background:
    radial-gradient(circle at 94% 8%, rgba(76, 198, 193, 0.1), transparent 42%),
    linear-gradient(180deg, rgba(16, 24, 35, 0.9), rgba(11, 18, 27, 0.92));
  display: grid;
  gap: 0.28rem;
  padding: 0.4rem 0.44rem;

  @media (min-width: 980px) {
    display: none;
  }
`;

export const BoxRowMain = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 0.32rem;
`;

export const BoxRowId = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  color: ${({ $boxNeonRgb }) => `rgba(${$boxNeonRgb || '119, 213, 255'}, 0.98)`};
  font-size: 0.8rem;
  font-weight: 780;
  letter-spacing: 0.05em;
  white-space: nowrap;
  text-shadow: ${({ $boxNeonRgb }) => `0 0 6px rgba(${$boxNeonRgb || '119, 213, 255'}, 0.28)`};
`;

export const BoxRowLabel = styled.span`
  min-width: 0;
  color: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '235, 243, 251'}, 0.94)`};
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const BoxRowSubline = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '207, 224, 238'}, 0.32)`};
  background:
    linear-gradient(
      135deg,
      ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '207, 224, 238'}, 0.18)`},
      ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '207, 224, 238'}, 0.1)`}
    ),
    rgba(11, 17, 24, 0.48);
  color: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '207, 224, 238'}, 0.92)`};
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1;
  padding: 0.14rem 0.36rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const BoxRowMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  font-size: 0.67rem;
  color: ${RETRIEVAL.textMuted};
`;

export const BoxMetaPill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '127, 215, 255'}, 0.26)`};
  background: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '127, 215, 255'}, 0.1)`};
  color: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '190, 205, 218'}, 0.94)`};
  line-height: 1;
  padding: 0.14rem 0.4rem;
`;

export const BoxInspectPanel = styled.section`
  border-radius: 11px;
  border: 1px solid rgba(127, 215, 255, 0.22);
  background:
    radial-gradient(circle at 94% 8%, rgba(76, 198, 193, 0.12), transparent 42%),
    linear-gradient(180deg, rgba(18, 26, 37, 0.9), rgba(12, 19, 28, 0.92));
  display: grid;
  gap: 0.3rem;
  padding: 0.48rem 0.56rem;
`;

export const BoxInspectHeader = styled.div`
  display: grid;
  gap: 0.12rem;
`;

export const BoxInspectTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.25;
  font-weight: 760;
  color: #eaf3fc;
`;

export const BoxInspectTitleLink = styled(Link)`
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(119, 213, 255, 0.84);
    text-underline-offset: 2px;
  }
`;

export const BoxInspectSubtitle = styled.p`
  margin: 0;
  font-size: 0.72rem;
  color: ${RETRIEVAL.textMuted};
`;

export const BoxInspectPath = styled.p`
  margin: 0;
  font-size: 0.7rem;
  color: rgba(232, 238, 244, 0.64);
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

export const BoxInspectNotes = styled.section`
  display: grid;
  gap: 0.14rem;
  border: 1px solid rgba(119, 213, 255, 0.22);
  border-radius: 8px;
  background: rgba(8, 20, 31, 0.5);
  padding: 0.32rem 0.4rem;
`;

export const BoxInspectNotesLabel = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textDim};
  font-size: 0.65rem;
  font-weight: 740;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const BoxInspectNotesText = styled.p`
  margin: 0;
  color: #def0ff;
  font-size: 0.72rem;
  line-height: 1.42;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 7.2em;
  overflow-y: auto;
`;

export const BoxInspectSection = styled.section`
  display: grid;
  gap: 0.2rem;
`;

export const BoxInspectSectionTitle = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textDim};
  font-size: 0.69rem;
  font-weight: 740;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const BoxInspectList = styled.div`
  display: grid;
  gap: 0.2rem;
`;

export const BoxInspectRow = styled.div`
  display: grid;
  gap: 0.1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.26rem 0.34rem;
`;

export const BoxInspectRowLink = styled(Link)`
  color: #e4f2ff;
  font-size: 0.77rem;
  font-weight: 680;
  text-decoration: none;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(119, 213, 255, 0.84);
    text-underline-offset: 2px;
  }
`;

export const BoxInspectRowMeta = styled.span`
  color: ${RETRIEVAL.textMuted};
  font-size: 0.66rem;
`;

export const ResultsFooter = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.6rem 0.7rem 0.74rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 14, 20, 0.34);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.5rem 0.54rem 0.62rem;
  }
`;

export const LoadMoreButton = styled.button`
  min-height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(119, 213, 255, 0.42);
  background: rgba(119, 213, 255, 0.16);
  color: #dff3ff;
  padding: 0.28rem 0.78rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 120ms ease;

  &:hover:not(:disabled) {
    background: rgba(119, 213, 255, 0.24);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const ResultsEndState = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.74rem;
`;

export const ResultCard = styled.article`
  border: 1px solid rgba(127, 215, 255, 0.16);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(16, 24, 35, 0.94), rgba(12, 20, 30, 0.92)),
    ${RETRIEVAL.row};
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
  overflow: hidden;
  transition: border-color 140ms ease, box-shadow 160ms ease;
  border-color: ${({ $expanded }) =>
    $expanded ? 'rgba(127, 215, 255, 0.28)' : 'rgba(127, 215, 255, 0.16)'};
  box-shadow: ${({ $expanded }) =>
    $expanded
      ? '0 10px 26px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(127, 215, 255, 0.12)'
      : '0 6px 18px rgba(0, 0, 0, 0.22)'};
`;

export const SummaryButton = styled.div`
  width: 100%;
  background: ${({ $expanded }) =>
    $expanded
      ? `linear-gradient(180deg, rgba(26, 37, 52, 0.84), rgba(19, 29, 43, 0.74))`
      : 'linear-gradient(180deg, rgba(15, 24, 35, 0.42), rgba(12, 20, 30, 0.2))'};
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: ${({ $expanded }) => ($expanded ? '0.42rem 0.56rem' : '0.56rem')};
  display: grid;
  gap: 0.2rem;
  transition: background 140ms ease;

  &:hover {
    background: ${({ $expanded }) =>
      $expanded
        ? `linear-gradient(180deg, rgba(30, 44, 61, 0.9), rgba(22, 34, 49, 0.8))`
        : 'linear-gradient(180deg, rgba(25, 37, 52, 0.58), rgba(16, 27, 40, 0.34))'};
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.6);
    outline-offset: -2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: ${({ $expanded }) => ($expanded ? '0.42rem 0.52rem' : '0.58rem 0.52rem')};
  }
`;

export const SummaryTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.34rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: flex-start;
    gap: 0.24rem;
  }
`;

export const RowMain = styled.div`
  display: grid;
  grid-template-columns: ${({ $expanded }) =>
    $expanded ? '12px minmax(0, 1fr)' : '60px minmax(0, 1fr)'};
  align-items: ${({ $expanded }) => ($expanded ? 'center' : 'start')};
  gap: 0.62rem;
  min-width: 0;
  flex: 1 1 auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: ${({ $expanded }) =>
      $expanded ? '10px minmax(0, 1fr)' : '56px minmax(0, 1fr)'};
    gap: 0.52rem;
  }
`;

export const ExpandedRowMarker = styled.span`
  width: 100%;
  min-height: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(103, 239, 200, 0.82), rgba(76, 198, 193, 0.4));
  box-shadow: 0 0 0 1px rgba(103, 239, 200, 0.18);
`;

const thumbFrameBase = css`
  width: 60px;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(8, 13, 19, 0.9);
  display: grid;
  place-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 56px;
    border-radius: 10px;
  }
`;

export const ThumbFrame = styled.div`
  ${thumbFrameBase};
`;

export const ThumbPreviewButton = styled.button`
  ${thumbFrameBase};
  border-color: rgba(127, 215, 255, 0.32);
  cursor: zoom-in;
  padding: 0;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    border-color: rgba(127, 215, 255, 0.52);
    box-shadow: 0 0 0 1px rgba(127, 215, 255, 0.2);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.65);
    outline-offset: 1px;
  }
`;

export const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const ThumbPlaceholder = styled.span`
  color: rgba(232, 238, 244, 0.45);
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
`;

export const BadgeStack = styled.div`
  display: grid;
  gap: ${({ $expanded }) => ($expanded ? '0' : '0.2rem')};
  min-width: 0;
`;

export const CompactMetaLine = styled.div`
  display: none;
`;

export const CompactSecondaryMetaLine = styled.div`
  display: none;
`;

export const ExpandControl = styled.span`
  appearance: none;
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
  min-height: 30px;
  border-radius: 10px;
  border: 1px solid
    ${({ $expanded }) =>
      $expanded ? 'rgba(119, 213, 255, 0.58)' : 'rgba(255, 255, 255, 0.2)'};
  background: ${({ $expanded }) =>
    $expanded ? 'rgba(119, 213, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'};
  color: ${({ $expanded }) => ($expanded ? '#d6f0ff' : RETRIEVAL.textDim)};
  padding: 0.2rem 0.42rem;
  flex: 0 0 auto;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover {
    background: ${({ $expanded }) =>
      $expanded ? 'rgba(119, 213, 255, 0.24)' : 'rgba(255, 255, 255, 0.11)'};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 28px;
    padding: 0.18rem 0.36rem;
  }
`;

export const ExpandCaret = styled.span`
  font-size: 0.86rem;
  line-height: 1;
`;

export const CardOpenHint = styled.span`
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(228, 237, 248, 0.74);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: none;
  }
`;

export const ItemLineSlot = styled.span`
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
  }
`;

export const ItemLine = styled.span`
  display: inline-block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  color: #ebf4ff;
  font-size: 1rem;
  font-weight: 780;
  letter-spacing: 0.01em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.98rem;
  }
`;

export const ItemLineLink = styled(Link)`
  display: inline-block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  color: #ebf4ff;
  font-size: 1rem;
  font-weight: 780;
  letter-spacing: 0.01em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.98rem;
  }

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(119, 213, 255, 0.75);
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.65);
    outline-offset: 1px;
    border-radius: 4px;
  }
`;

export const LocatorPathLine = styled.p`
  margin: 0;
  color: rgba(214, 248, 255, 0.95);
  font-size: 0.82rem;
  line-height: 1.35;
  letter-spacing: 0.01em;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.8rem;
  }
`;

export const LocatorMetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.5rem;
  min-width: 0;
`;

export const LocatorMetaText = styled.span`
  color: rgba(214, 226, 241, 0.65);
  font-size: 0.7rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
`;

export const CollapsedPlacementTable = styled.div`
  display: grid;
  gap: 0.16rem;
  min-width: 0;
`;

export const CollapsedPlacementRow = styled.div`
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  column-gap: 0.4rem;
  min-width: 0;
`;

export const CollapsedPlacementLabel = styled.span`
  color: rgba(214, 226, 241, 0.58);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.15;
`;

export const CollapsedPlacementValue = styled.span`
  min-width: 0;
  ${({ $stack }) =>
    $stack
      ? css`
          display: flex;
          width: 100%;
        `
      : ''}
`;

export const CollapsedBoxValueChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: ${({ $orphaned }) => ($orphaned ? 'center' : 'flex-start')};
  max-width: 100%;
  min-height: 1.3rem;
  border-radius: 8px;
  padding: 0.2rem 0.58rem;
  border: 1px solid
    ${({ $orphaned, $boxNeonRgb }) =>
      $orphaned ? 'rgba(214, 194, 122, 0.94)' : `rgba(${$boxNeonRgb}, 0.44)`};
  background: ${({ $orphaned, $boxColorRgb }) =>
    $orphaned ? '#d7c27a' : `rgba(${$boxColorRgb}, 0.2)`};
  color: ${({ $orphaned, $boxMutedRgb }) =>
    $orphaned ? '#0d1116' : `rgba(${$boxMutedRgb}, 0.96)`};
  font-size: 0.72rem;
  font-weight: 760;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CollapsedLocationValue = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: ${({ $unknown }) => ($unknown ? 'center' : 'flex-start')};
  width: fit-content;
  min-height: 1.3rem;
  border-radius: 8px;
  padding: 0.2rem 0.58rem;
  border: 1px solid
    ${({ $unknown }) =>
      $unknown ? 'rgba(127, 215, 219, 0.62)' : 'rgba(214, 226, 241, 0.28)'};
  background: ${({ $unknown }) =>
    $unknown ? 'rgba(127, 207, 213, 0.6)' : 'rgba(214, 226, 241, 0.1)'};
  max-width: 100%;
  color: ${({ $unknown }) => ($unknown ? '#0d1116' : 'rgba(228, 236, 245, 0.9)')};
  font-size: 0.72rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  font-weight: 760;
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const BoxAnchorLine = styled.div`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  border-radius: 999px;
  border: 1px solid rgba(119, 213, 255, 0.34);
  background: rgba(119, 213, 255, 0.11);
  padding: 0.14rem 0.42rem;
  gap: 0.3rem;
`;

export const BoxAnchorId = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  color: #b9ecff;
  font-weight: 860;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  line-height: 1;
`;

export const BoxAnchorDivider = styled.span`
  width: 1px;
  height: 0.7rem;
  background: rgba(185, 236, 255, 0.44);
  flex: 0 0 auto;
`;

export const BoxAnchorSnippet = styled.span`
  color: rgba(214, 231, 244, 0.86);
  font-size: 0.7rem;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const UnresolvedHint = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgba(232, 177, 92, 0.48);
  background: rgba(232, 177, 92, 0.16);
  color: #f4cf99;
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  line-height: 1;
  padding: 0.17rem 0.46rem;
`;

export const MetaBlock = styled.div`
  display: grid;
  gap: 0.18rem;
`;

export const MetaLabel = styled.span`
  color: ${RETRIEVAL.textMuted};
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.1;
`;

export const CategoryValue = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 8px;
  border: 1px solid rgba(154, 173, 255, 0.34);
  background: rgba(121, 141, 232, 0.16);
  color: #dde4ff;
  font-size: 0.74rem;
  padding: 0.14rem 0.44rem;
`;

export const KeepPriorityChip = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid ${({ $tone }) => `${keepPriorityToneColor($tone)}7a`};
  background: ${({ $tone }) => `${keepPriorityToneColor($tone)}2b`};
  color: ${({ $tone }) => keepPriorityToneColor($tone)};
  font-size: 0.68rem;
  font-weight: 780;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
  padding: 0.16rem 0.46rem;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
`;

export const ItemTagChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(127, 215, 255, 0.24);
  background: rgba(127, 215, 255, 0.11);
  color: #d1e8f8;
  font-size: 0.68rem;
  line-height: 1;
  padding: 0.14rem 0.4rem;
`;

export const PathLine = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.68rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

const itemPillBase = css`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: none;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(119, 213, 255, 0.44);
  background:
    linear-gradient(96deg, rgba(119, 213, 255, 0.22) 0%, rgba(119, 213, 255, 0.1) 75%),
    rgba(9, 18, 26, 0.84);
  color: #eff8ff;
  padding: 0.46rem 0.78rem;
  font-size: 1.08rem;
  font-weight: 780;
  letter-spacing: 0.01em;
  line-height: 1.2;
  word-break: break-word;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.98rem;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding: 0.32rem 0.64rem;
    border-radius: 11px;
  }
`;

export const ItemPill = styled.span`
  ${itemPillBase};
`;

export const ItemPillLink = styled(Link)`
  ${itemPillBase};
  text-decoration: none;
  transition:
    border-color 120ms ease,
    background 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    border-color: rgba(119, 213, 255, 0.62);
    background:
      linear-gradient(
        96deg,
        rgba(119, 213, 255, 0.28) 0%,
        rgba(119, 213, 255, 0.14) 62%
      ),
      rgba(9, 18, 26, 0.9);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.65);
    outline-offset: 1px;
  }
`;

const linkButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(119, 213, 255, 0.35);
  background: rgba(119, 213, 255, 0.14);
  color: #d4efff;
  text-decoration: none;
  padding: 0.3rem 0.62rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const LocationWrap = styled.div`
  display: grid;
  gap: 0.18rem;
`;

export const LocationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(103, 239, 200, 0.46);
  background: rgba(103, 239, 200, 0.17);
  color: #d7fff2;
  padding: ${({ $compact }) => ($compact ? '0.18rem 0.5rem' : '0.28rem 0.7rem')};
  font-size: ${({ $compact }) => ($compact ? '0.72rem' : '0.82rem')};
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.2;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${({ $compact }) => ($compact ? MOBILE_FONT_XS : MOBILE_FONT_SM)};
  }
`;

export const LocationPath = styled.p`
  margin: 0;
  font-size: 0.7rem;
  color: ${RETRIEVAL.textMuted};
`;

export const CompactLocation = styled(ItemTagChip)`
  display: inline-flex;
  align-items: center;
  flex: 0 1 auto;
  max-width: clamp(74px, 10vw, 124px);
  min-height: 24px;
  min-width: 0;
  border-radius: 10px;
  border-color: ${({ $boxMutedRgb }) =>
    `rgba(${$boxMutedRgb || '152, 160, 176'}, 0.42)`};
  background:
    linear-gradient(
      135deg,
      ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '152, 160, 176'}, 0.2)`},
      ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '152, 160, 176'}, 0.12)`}
    ),
    rgba(10, 16, 24, 0.64);
  color: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '216, 222, 232'}, 1)`};
  font-size: 0.66rem;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
  line-height: 1;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.22);
  padding: 0.28rem 0.48rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    ${({ $hideOnMobile }) => ($hideOnMobile ? 'display: none;' : '')}
    flex: 0 1 42%;
    min-height: 23px;
    padding: 0.24rem 0.44rem;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const CompactContextChip = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  border-radius: 8px;
  border: 1px solid
    ${({ $tone, $boxMutedRgb }) =>
      $tone === 'group'
        ? `rgba(${$boxMutedRgb || '167, 182, 255'}, 0.34)`
        : `rgba(${$boxMutedRgb || '120, 226, 198'}, 0.34)`};
  background:
    linear-gradient(
      135deg,
      ${({ $tone, $boxMutedRgb }) =>
        $tone === 'group'
          ? `rgba(${$boxMutedRgb || '167, 182, 255'}, 0.2)`
          : `rgba(${$boxMutedRgb || '120, 226, 198'}, 0.2)`},
      ${({ $tone, $boxMutedRgb }) =>
        $tone === 'group'
          ? `rgba(${$boxMutedRgb || '167, 182, 255'}, 0.1)`
          : `rgba(${$boxMutedRgb || '120, 226, 198'}, 0.1)`}
    ),
    rgba(10, 16, 24, 0.58);
  color: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '214, 226, 241'}, 0.92)`};
  font-size: ${MOBILE_FONT_XS};
  font-weight: 680;
  letter-spacing: 0.03em;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.18rem 0.42rem;

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) {
    display: none;
  }
`;

export const BoxBadge = styled.span`
  display: inline-grid;
  align-items: center;
  grid-template-columns: ${({ $compact }) =>
    $compact ? '5.4ch minmax(0, 1fr)' : '5.9ch minmax(0, 1fr)'};
  gap: 0;
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  max-width: none;
  border-radius: 10px;
  border: 1px solid
    ${({ $boxColorRgb }) => `rgba(${$boxColorRgb || '244, 196, 48'}, 0.4)`};
  background:
    linear-gradient(
      135deg,
      ${({ $boxColorRgb }) => `rgba(${$boxColorRgb || '244, 196, 48'}, 0.18)`},
      ${({ $boxColorRgb }) => `rgba(${$boxColorRgb || '244, 196, 48'}, 0.08)`}
    ),
    rgba(22, 17, 10, 0.7);
  box-shadow:
    ${({ $boxColorRgb }) => `0 0 0 1px rgba(${$boxColorRgb || '244, 196, 48'}, 0.15)`},
    ${({ $boxColorRgb }) => `0 0 8px rgba(${$boxColorRgb || '244, 196, 48'}, 0.2)`};
  padding: ${({ $compact }) => ($compact ? '0.2rem 0.42rem' : '0.24rem 0.5rem')};
  line-height: 1.2;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: none;
  }
`;

export const BoxIdCell = styled.span`
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
`;

export const BoxId = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  color: ${({ $boxNeonRgb }) => `rgba(${$boxNeonRgb || '255, 244, 218'}, 0.98)`};
  font-size: ${({ $compact }) => ($compact ? '0.92rem' : '0.82rem')};
  font-weight: 800;
  letter-spacing: 0.06em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  text-align: left;
  text-shadow: ${({ $boxNeonRgb }) => `0 0 6px rgba(${$boxNeonRgb || '255, 244, 218'}, 0.32)`};
`;

export const BoxName = styled.span`
  color: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '246, 230, 201'}, 0.88)`};
  font-size: ${({ $compact }) => ($compact ? '0.7rem' : '0.74rem')};
  font-weight: 580;
  letter-spacing: 0.02em;
  border-left: 1px solid
    ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '246, 230, 201'}, 0.34)`};
  padding-left: ${({ $compact }) => ($compact ? '0.32rem' : '0.36rem')};
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ExpandedPanel = styled.section`
  margin: 0;
  border-top: 1px solid rgba(127, 215, 255, 0.12);
  background: linear-gradient(180deg, rgba(11, 19, 28, 0.86), rgba(9, 16, 24, 0.8));
  padding: 0.5rem 0.56rem 0.56rem;
  display: grid;
  gap: 0.38rem;
  align-items: start;

  @media (min-width: 980px) {
    grid-template-columns: minmax(0, 1.25fr) minmax(340px, 1fr);
    column-gap: 0.62rem;
    row-gap: 0.48rem;
    align-items: stretch;
  }

  @media (min-width: 980px) {
    ${({ $hasPrimaryPanel }) =>
      !$hasPrimaryPanel
        ? `
      & > :only-child {
        grid-column: 1 / -1;
      }
    `
        : ''}
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.46rem 0.5rem 0.52rem;
  }
`;

export const ExpandedItemPanel = styled.section`
  border-radius: 10px;
  border: 1px solid rgba(119, 213, 255, 0.16);
  background: rgba(10, 18, 27, 0.68);
  padding: 0.42rem 0.46rem;
  display: grid;
  gap: 0.28rem;
  align-content: start;
`;

export const ExpandedItemBody = styled.div`
  display: grid;
  gap: 0.34rem;
  align-content: start;
`;

export const ExpandedMediaColumn = styled.div`
  display: grid;
  align-content: start;
  justify-items: center;
`;

export const ExpandedMediaButton = styled.button`
  width: min(100%, 280px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.65);
    outline-offset: 2px;
    border-radius: 13px;
  }
`;

export const ExpandedMediaFrame = styled.div`
  width: min(100%, 280px);
  border-radius: 11px;
  border: 1px solid rgba(119, 213, 255, 0.3);
  background:
    linear-gradient(160deg, rgba(18, 30, 42, 0.9), rgba(10, 18, 27, 0.86)),
    rgba(9, 16, 24, 0.82);
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 0 0 1px rgba(119, 213, 255, 0.08);
  aspect-ratio: 1 / 1;
`;

export const ExpandedMediaImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const ExpandedMediaPlaceholder = styled.span`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(180, 202, 222, 0.74);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
`;

export const ExpandedTextColumn = styled.div`
  display: grid;
  gap: 0.32rem;
  align-content: start;
  min-width: 0;
`;

export const ExpandedBoxIdentity = styled.div`
  display: grid;
  gap: 0.08rem;
  border: 1px solid rgba(119, 213, 255, 0.2);
  border-radius: 9px;
  background: rgba(11, 19, 28, 0.72);
  padding: 0.3rem 0.4rem;
`;

export const ExpandedBoxId = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.9rem;
  font-weight: 860;
  color: #b9ecff;
  letter-spacing: 0.05em;
  line-height: 1.1;
`;

export const ExpandedBoxName = styled.p`
  margin: 0;
  color: rgba(218, 231, 244, 0.88);
  font-size: 0.78rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

export const ExpandedBoxIdentityStatus = styled.span`
  color: #f4cf99;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const ExpandedBoxLocator = styled.div`
  display: grid;
  gap: 0.16rem;
  border: 1px solid rgba(119, 213, 255, 0.28);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(20, 39, 54, 0.82), rgba(10, 22, 32, 0.86)),
    rgba(10, 18, 27, 0.8);
  padding: 0.42rem 0.48rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
`;

export const ExpandedBoxLocatorLabel = styled.p`
  margin: 0;
  color: rgba(169, 234, 212, 0.88);
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const ExpandedBoxLocatorLink = styled(Link)`
  color: #dff7ff;
  font-size: 0.92rem;
  font-weight: 820;
  line-height: 1.28;
  text-decoration: underline;
  text-decoration-color: rgba(119, 213, 255, 0.62);
  text-underline-offset: 3px;
  overflow-wrap: anywhere;

  &:hover {
    color: #ffffff;
    text-decoration-color: rgba(103, 239, 200, 0.82);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.72);
    outline-offset: 3px;
    border-radius: 6px;
  }
`;

export const ExpandedBoxLocatorText = styled.p`
  margin: 0;
  color: #dff7ff;
  font-size: 0.92rem;
  font-weight: 760;
  line-height: 1.28;
  overflow-wrap: anywhere;
`;

export const ExpandedBoxPanel = styled.section`
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(8, 14, 20, 0.96), rgba(6, 11, 17, 0.95)),
    rgba(7, 12, 18, 0.92);
  padding: 0.42rem 0.46rem 0.46rem;
  display: grid;
  gap: 0.38rem;
  align-content: start;

  @media (min-width: 980px) {
    height: 100%;
    grid-template-rows: auto auto auto minmax(0, 1fr);
  }
`;

export const ExpandedActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.34rem;
`;

export const ExpandedActionButton = styled.button`
  border: 1px solid ${({ $tone }) => expandedActionTone($tone).border};
  background: ${({ $tone }) => expandedActionTone($tone).background};
  color: ${({ $tone }) => expandedActionTone($tone).color};
  border-radius: 8px;
  min-height: 31px;
  padding: 0.24rem 0.58rem;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover:not(:disabled) {
    background: ${({ $tone }) => expandedActionTone($tone).hover};
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const ExpandedActionLink = styled(Link)`
  ${linkButton};
  min-height: 31px;
  font-size: 0.72rem;
  text-transform: uppercase;
`;

export const ExpandedMetadataGrid = styled.div`
  display: grid;
  gap: 0.34rem;

  @media (min-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 0.44rem;
    align-items: stretch;
  }
`;

export const ExpandedMetaCard = styled.div`
  display: grid;
  gap: 0.18rem;
  border: 1px solid rgba(127, 215, 255, 0.16);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(16, 24, 34, 0.82), rgba(11, 18, 26, 0.8)),
    rgba(10, 16, 24, 0.72);
  padding: 0.32rem 0.38rem;

  @media (min-width: 980px) {
    ${({ $fullWidth }) => ($fullWidth ? 'grid-column: 1 / -1;' : '')}
  }
`;

export const ExpandedMetaList = styled.div`
  display: grid;
  gap: 0.28rem;
`;

export const ExpandedMetaRow = styled.div`
  display: grid;
  gap: 0.1rem;
  border: 1px solid rgba(127, 215, 255, 0.14);
  border-radius: 8px;
  background: rgba(10, 16, 24, 0.64);
  padding: 0.32rem 0.4rem;
`;

export const ExpandedMetaLabel = styled.p`
  margin: 0;
  color: rgba(169, 234, 212, 0.84);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const ExpandedMetaValue = styled.p`
  margin: 0;
  color: ${({ $tone }) => ($tone ? keepPriorityToneColor($tone) : 'rgba(222, 242, 255, 0.94)')};
  font-size: 0.78rem;
  font-weight: 620;
  letter-spacing: 0.01em;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

export const ExpandedContextValue = styled.p`
  margin: 0;
  color: rgba(215, 255, 242, 0.9);
  font-size: 0.74rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

export const ExpandedPanelTitle = styled.p`
  margin: 0;
  color: #c9f6e8;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const ExpandedDetailBlock = styled.div`
  display: grid;
  gap: 0.18rem;

  @media (min-width: 980px) {
    ${({ $fullWidth }) => ($fullWidth ? 'grid-column: 1 / -1;' : '')}
  }
`;

export const ExpandedDetailLabel = styled.p`
  margin: 0;
  color: #a9ead4;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: underline;
  text-decoration-color: rgba(169, 234, 212, 0.78);
  text-underline-offset: 2px;
`;

export const ExpandedDetailText = styled.p`
  margin: 0;
  color: #d7f8ec;
  font-size: 0.76rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

export const ExpandedNotesBlock = styled(ExpandedDetailBlock)`
  border: 1px solid rgba(119, 213, 255, 0.18);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(11, 18, 27, 0.86), rgba(9, 15, 23, 0.88)),
    rgba(8, 13, 20, 0.82);
  padding: 0.34rem 0.4rem;
`;

export const ExpandedNotesText = styled(ExpandedDetailText)`
  min-height: 2.6em;
  max-height: clamp(5.6rem, 15vh, 8.8rem);
  overflow: auto;
  padding-right: 0.12rem;
`;

export const ExpandedNotesEmpty = styled(ExpandedDetailText)`
  color: rgba(176, 196, 214, 0.8);
  font-style: italic;
`;

export const ExpandedPathText = styled(ExpandedDetailText)`
  color: rgba(215, 248, 236, 0.72);
  font-size: 0.72rem;
`;

export const ExpandedBoxLink = styled(Link)`
  ${linkButton};
  justify-self: start;
`;

export const ExpandedMuted = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.72rem;
`;

export const SiblingSection = styled.div`
  display: grid;
  gap: 0.26rem;
`;

export const SiblingLabel = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.72rem;
`;

export const SiblingChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
`;

export const SiblingChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(127, 215, 255, 0.3);
  background: rgba(127, 215, 255, 0.14);
  color: #d6efff;
  font-size: 0.68rem;
  line-height: 1;
  padding: 0.16rem 0.42rem;
`;

export const SiblingOverflow = styled(SiblingChip)`
  border-color: rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.08);
  color: ${RETRIEVAL.textDim};
`;

export const LoadingState = styled.div`
  padding: 0.92rem;
  color: ${RETRIEVAL.textDim};
  font-size: 0.82rem;
`;

export const ErrorState = styled.div`
  padding: 0.78rem;
  border-radius: 12px;
  border: 1px solid rgba(240, 138, 123, 0.44);
  background: rgba(240, 138, 123, 0.14);
  color: #ffd5ce;
  font-size: 0.82rem;
`;

export const EmptyState = styled.div`
  padding: 0.92rem;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.82rem;
`;

export const LightboxBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: rgba(3, 7, 12, 0.84);
  display: grid;
  place-items: center;
  padding: clamp(0.8rem, 2vw, 1.5rem);
`;

export const LightboxPanel = styled.div`
  position: relative;
  z-index: 2147483647;
  max-width: 95vw;
  max-height: 93vh;
  display: grid;
  gap: 0.36rem;
  justify-items: center;
`;

export const LightboxImage = styled.img`
  max-width: min(95vw, 1280px);
  max-height: 88vh;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.55);
  background: rgba(5, 10, 16, 0.96);
`;

export const LightboxCloseButton = styled.button`
  position: absolute;
  top: -0.2rem;
  right: -0.2rem;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  background: rgba(8, 16, 24, 0.9);
  color: #e7f3ff;
  font-size: 1.22rem;
  line-height: 1;
  cursor: pointer;
`;

export const LightboxCaption = styled.p`
  margin: 0;
  color: rgba(232, 238, 244, 0.86);
  font-size: 0.79rem;
  letter-spacing: 0.02em;
  text-align: center;
`;
