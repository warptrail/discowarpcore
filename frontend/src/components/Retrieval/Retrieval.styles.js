import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

const RETRIEVAL_WIDE_BREAKPOINT = '900px';

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

const panelChrome = css`
  border: 1px solid ${RETRIEVAL.border};
  border-radius: 3px 10px 3px 3px;
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.07), transparent 24%),
    linear-gradient(180deg, rgba(20, 26, 33, 0.98), rgba(10, 15, 21, 0.98));
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.24),
    0 10px 24px rgba(0, 0, 0, 0.24);
`;

const controlField = css`
  width: 100%;
  min-height: 38px;
  border-radius: 3px;
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
    border-radius: 3px;
  }
`;

export const PageShell = styled.section`
  display: grid;
  gap: 0.5rem;
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
  border-radius: 2px 7px 2px 2px;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(17, 24, 33, 0.98), rgba(11, 17, 24, 0.96))'
      : 'transparent'};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 2px 6px 2px 2px;
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
  gap: 1px;
  padding: 2px;
  border: 1px solid rgba(127, 215, 255, 0.28);
  border-left: 4px solid rgba(76, 198, 193, 0.74);
  border-radius: 2px 6px 2px 2px;
  background: rgba(4, 9, 15, 0.92);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.62),
    0 1px 0 rgba(255, 255, 255, 0.04);
`;

export const ModeToggleButton = styled.button`
  min-height: 34px;
  padding: 0.2rem 0.78rem;
  border-radius: 1px 4px 1px 1px;
  border: 1px solid transparent;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(90deg, rgba(119, 213, 255, 0.3), rgba(55, 119, 148, 0.12))'
      : 'transparent'};
  box-shadow: ${({ $active }) =>
    $active
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 8px rgba(119, 213, 255, 0.12)'
      : 'none'};
  color: ${({ $active }) => ($active ? '#e8f7ff' : RETRIEVAL.textMuted)};
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 120ms ease, box-shadow 120ms ease, color 120ms ease;

  &:hover {
    color: #e8f7ff;
    background: ${({ $active }) =>
      $active ? 'linear-gradient(180deg, rgba(119, 213, 255, 0.34), rgba(55, 119, 148, 0.24))' : 'rgba(255, 255, 255, 0.06)'};
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.76);
    outline-offset: 1px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    font-size: 0.7rem;
    padding: 0.2rem 0.62rem;
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
  border-radius: 2px 7px 2px 2px;
  background:
    radial-gradient(circle at 94% 10%, rgba(103, 239, 200, 0.12), transparent 40%),
    linear-gradient(180deg, rgba(15, 23, 33, 0.95), rgba(10, 16, 23, 0.95));

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.58rem;
    padding: 0.16rem 0.18rem;
    border-radius: 2px 6px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  gap: 0.16rem;
  min-width: 0;
`;

export const SearchLabel = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const SearchInput = styled.input`
  ${controlField};
  min-height: 40px;
  font-size: 0.92rem;
  border-left: 4px solid rgba(76, 198, 193, 0.66);
  border-radius: 2px 7px 2px 2px;
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.055), transparent 28%),
    ${RETRIEVAL.bg};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    font-size: 0.94rem;
    border-radius: 2px 6px 2px 2px;
  }
`;

export const SearchHint = styled.p`
  margin: 0;
  color: rgba(232, 238, 244, 0.48);
  font-size: 0.7rem;

  @media (max-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    display: none;
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
  border-radius: 2px 8px 2px 2px;
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
  border-radius: 2px 8px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  gap: 0.32rem;
  min-width: 0;
`;

export const RefineToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 32px;
  border: 1px solid rgba(127, 215, 255, 0.2);
  border-radius: 2px 5px 2px 2px;
  background: rgba(9, 17, 25, 0.7);
  color: rgba(217, 239, 255, 0.7);
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.14rem 0.52rem;
  cursor: pointer;

  &::after {
    content: '+';
    color: rgba(103, 212, 202, 0.78);
    font-size: 0.72rem;
    line-height: 1;
  }

  &[aria-expanded='true']::after {
    content: '−';
  }

  &:hover {
    color: rgba(217, 239, 255, 0.9);
    border-color: rgba(127, 215, 255, 0.42);
    background: rgba(119, 213, 255, 0.1);
  }

  &:focus-visible {
    outline: 1px solid rgba(127, 215, 255, 0.62);
    outline-offset: 3px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    font-size: ${MOBILE_FONT_SM};
    padding-inline: 0.58rem;
  }
`;

export const RefineCount = styled.span`
  border-left: 3px solid rgba(76, 198, 193, 0.6);
  color: rgba(232, 238, 244, 0.64);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  padding-left: 0.42rem;
  text-transform: uppercase;
`;

export const RefinePanel = styled.div`
  display: grid;
  gap: 0.52rem;
  border-left: 4px solid rgba(76, 198, 193, 0.54);
  border-top: 1px solid rgba(127, 215, 255, 0.12);
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.08), transparent 30%),
    rgba(10, 16, 24, 0.3);
  padding: 0.48rem 0.5rem 0.48rem 0.62rem;
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
  min-width: 0;
  padding: 0.18rem 0;
  background: transparent;
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
  min-height: 34px;
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    font-size: 16px;
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
  border-radius: 2px 6px 2px 2px;
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
  border-radius: 2px;
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
  border-radius: 5px;
  background: rgba(103, 239, 200, 0.05);
  color: rgba(216, 255, 242, 0.76);
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.05em;
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
    min-height: 44px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const SortDirectionToggle = styled.button`
  min-width: 78px;
  min-height: 36px;
  padding: 0.38rem 0.52rem;
  border: 1px solid rgba(111, 196, 255, 0.52);
  border-radius: 2px 5px 2px 2px;
  color: #dff4ff;
  background: linear-gradient(180deg, rgba(16, 44, 68, 0.78), rgba(12, 27, 43, 0.86));
  font-size: 0.72rem;
  font-weight: 760;
  white-space: nowrap;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: rgba(143, 214, 255, 0.84);
    background: linear-gradient(180deg, rgba(20, 55, 84, 0.84), rgba(13, 31, 49, 0.9));
  }

  &:focus-visible {
    outline: 2px solid rgba(111, 196, 255, 0.66);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.46;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
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
  gap: 0.3rem;
`;

export const ActiveChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 32px;
  border-left-width: 4px;
  border-radius: 2px 5px 2px 2px;
  border: 1px solid rgba(76, 198, 193, 0.42);
  background: rgba(76, 198, 193, 0.14);
  color: #d8f8f5;
  font-size: 0.71rem;
  padding: 0.16rem 0.2rem 0.16rem 0.48rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
  }
`;

export const ActiveChipLabel = styled.span`
  line-height: 1;
`;

export const ActiveChipRemove = styled.button`
  display: inline-grid;
  place-items: center;
  min-width: 28px;
  min-height: 28px;
  border: 1px solid rgba(76, 198, 193, 0.24);
  border-radius: 1px 4px 1px 1px;
  background: rgba(76, 198, 193, 0.08);
  color: inherit;
  cursor: pointer;
  font-size: 0.86rem;
  line-height: 1;
  padding: 0;

  &:hover,
  &:focus-visible {
    border-color: rgba(103, 239, 200, 0.62);
    background: rgba(103, 239, 200, 0.18);
    outline: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 40px;
    min-height: 40px;
  }
`;

export const ClearFiltersButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.05);
  color: ${RETRIEVAL.textDim};
  min-height: 32px;
  border-radius: 2px 5px 2px 2px;
  font-size: 0.71rem;
  padding: 0.15rem 0.5rem;
  cursor: pointer;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    padding-inline: 0.7rem;
  }
`;

export const ResultsPanel = styled.section`
  ${panelChrome};
  overflow: hidden;
`;

export const ResultsHeader = styled.div`
  display: grid;
  gap: 0.38rem;
  padding: 0.44rem 0.62rem;
  border-left: 5px solid rgba(76, 198, 193, 0.72);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 14, 20, 0.45);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.5rem 0.54rem;
  }
`;

export const ExplorerShell = styled.div`
  display: grid;
  gap: 0.32rem;
`;

export const ExplorerOrderTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  min-height: 28px;
  padding: 0.12rem 0.34rem;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(167, 182, 255, 0.7)' : 'rgba(167, 182, 255, 0.32)')};
  border-radius: 2px;
  background: ${({ $active }) => ($active ? 'rgba(167, 182, 255, 0.15)' : 'rgba(10, 15, 22, 0.66)')};
  color: rgba(220, 226, 255, 0.76);
  font: 800 0.56rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.07em;
  cursor: pointer;

  strong { color: #e4e8ff; font: inherit; }
  &:focus-visible { outline: 1px solid rgba(167, 182, 255, 0.9); outline-offset: 2px; }
`;

export const ExplorerFacetRail = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 2px;
`;

export const ExplorerFacetButton = styled.button`
  position: relative;
  min-width: 0;
  height: 34px;
  padding: 0 0.16rem;
  border: 1px solid ${({ $active, $selected }) => ($active || $selected ? 'rgba(119, 213, 255, 0.72)' : 'rgba(127, 215, 255, 0.2)')};
  border-radius: 2px;
  background: ${({ $active, $selected }) => ($active || $selected ? 'rgba(119, 213, 255, 0.14)' : 'rgba(7, 13, 19, 0.72)')};
  color: ${({ $active, $selected }) => ($active || $selected ? '#e1f6ff' : 'rgba(209, 228, 239, 0.62)')};
  font: 850 0.55rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.04em;
  cursor: pointer;

  b {
    position: absolute;
    top: 2px;
    right: 3px;
    min-width: 0.78rem;
    color: #071017;
    background: #82dcff;
    border-radius: 999px;
    font-size: 0.48rem;
    line-height: 0.78rem;
  }

  &:hover { border-color: rgba(119, 213, 255, 0.64); color: #e8f8ff; }
  &:focus-visible { outline: 1px solid rgba(119, 213, 255, 0.9); outline-offset: 2px; }
`;

export const ExplorerTray = styled.section`
  display: grid;
  gap: 0.3rem;
  padding: 0.36rem;
  border: 1px solid rgba(119, 213, 255, 0.3);
  border-left: 3px solid rgba(76, 198, 193, 0.76);
  border-radius: 2px;
  background: rgba(5, 11, 17, 0.78);
`;

export const ExplorerTrayHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const ExplorerTrayTitle = styled.span`
  margin-right: auto;
  color: rgba(216, 237, 247, 0.76);
  font: 800 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const TagOperatorToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  min-height: 28px;
  padding: 0.12rem 0.4rem;
  border: 1px solid ${({ $and }) =>
    $and ? 'rgba(167, 182, 255, 0.72)' : 'rgba(76, 198, 193, 0.58)'};
  border-radius: 2px;
  background: ${({ $and }) =>
    $and ? 'rgba(167, 182, 255, 0.14)' : 'rgba(76, 198, 193, 0.1)'};
  color: rgba(218, 232, 238, 0.66);
  font: 750 0.54rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;

  strong {
    color: ${({ $and }) => ($and ? '#e5e8ff' : '#c8fff2')};
    font-size: 0.64rem;
  }

  &:focus-visible {
    outline: 1px solid rgba(127, 215, 255, 0.84);
    outline-offset: 2px;
  }
`;

export const ExplorerTrayClose = styled.button`
  width: 24px;
  height: 22px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 2px;
  background: transparent;
  color: rgba(232, 238, 244, 0.72);
  cursor: pointer;
`;

export const ExplorerOptionSearch = styled.input`
  width: 100%;
  min-height: 30px;
  padding: 0.16rem 0.4rem;
  border: 1px solid rgba(127, 215, 255, 0.3);
  border-radius: 2px;
  background: rgba(4, 9, 15, 0.9);
  color: ${RETRIEVAL.text};
  font: 0.72rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`;

export const ExplorerOptionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 3px;
  max-height: 116px;
  overflow: auto;
  padding-right: 2px;
`;

export const ExplorerOptionButton = styled.button`
  min-height: 28px;
  max-width: 100%;
  padding: 0.12rem 0.4rem;
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(103, 239, 200, 0.72)' : 'rgba(127, 215, 255, 0.22)')};
  border-radius: 2px;
  background: ${({ $selected }) => ($selected ? 'rgba(103, 239, 200, 0.14)' : 'rgba(12, 20, 29, 0.78)')};
  color: ${({ $selected }) => ($selected ? '#d9fff3' : 'rgba(224, 235, 243, 0.74)')};
  font: 700 0.65rem/1.15 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  cursor: pointer;
  overflow-wrap: anywhere;
`;

export const ExplorerEmptyState = styled.span`
  padding: 0.24rem 0;
  color: rgba(214, 226, 241, 0.54);
  font: 0.66rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`;

export const ExplorerSortGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px;
`;

export const ExplorerSortButtonWrap = styled.span`
  position: relative;
  min-width: 0;
`;

export const ExplorerSortButton = styled.button`
  width: 100%;
  min-height: 30px;
  padding: 0.14rem 0.32rem;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(167, 182, 255, 0.7)' : 'rgba(167, 182, 255, 0.26)')};
  border-radius: 2px;
  background: ${({ $active }) => ($active ? 'rgba(167, 182, 255, 0.14)' : 'rgba(7, 13, 19, 0.72)')};
  color: ${({ $active }) => ($active ? '#e9eaff' : 'rgba(220, 226, 255, 0.7)')};
  font: 800 0.6rem/1.15 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  cursor: pointer;
`;

export const ExplorerTooltip = styled.span`
  position: absolute;
  z-index: 12;
  left: 50%;
  bottom: calc(100% + 5px);
  width: max-content;
  max-width: min(220px, calc(100vw - 2rem));
  padding: 0.26rem 0.34rem;
  border: 1px solid rgba(167, 182, 255, 0.52);
  border-radius: 2px;
  background: rgba(7, 13, 20, 0.98);
  color: #e9eaff;
  font: 700 0.58rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  pointer-events: none;
  transform: translateX(-50%);
`;

export const ResultsHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const ResultsHeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

export const ExplorerViewTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  min-height: 32px;
  padding: 0.18rem 0.42rem;
  border: 1px solid rgba(76, 198, 193, 0.38);
  border-radius: 2px;
  background: ${({ $active }) =>
    $active ? 'rgba(76, 198, 193, 0.14)' : 'rgba(7, 13, 19, 0.72)'};
  color: rgba(220, 238, 240, 0.76);
  font: 750 0.56rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.06em;
  cursor: pointer;

  strong {
    color: #bff8ed;
    font-size: 0.6rem;
  }

  &:focus-visible {
    outline: 1px solid rgba(127, 215, 255, 0.82);
    outline-offset: 2px;
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

export const InlineSortRail = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  min-width: 0;
`;

export const InlineSortButtonWrap = styled.span`
  position: relative;
  display: inline-flex;
`;

export const InlineSortButton = styled.button`
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid ${({ $active }) =>
    $active ? 'rgba(119, 213, 255, 0.7)' : 'rgba(127, 215, 255, 0.2)'};
  border-radius: 2px;
  background: ${({ $active }) =>
    $active ? 'rgba(119, 213, 255, 0.16)' : 'rgba(7, 13, 19, 0.72)'};
  color: ${({ $active }) => ($active ? '#dff5ff' : 'rgba(209, 228, 239, 0.58)')};
  font: 800 0.53rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.035em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease;

  &:hover {
    border-color: rgba(119, 213, 255, 0.62);
    background: rgba(119, 213, 255, 0.1);
    color: #e8f8ff;
  }

  &:focus-visible {
    outline: 1px solid rgba(119, 213, 255, 0.82);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const InlineSortDirectionButton = styled.button`
  width: 52px;
  height: 42px;
  padding: 0;
  border: 1px solid rgba(167, 182, 255, 0.48);
  border-radius: 2px;
  background: rgba(167, 182, 255, 0.1);
  color: #dfe4ff;
  font: 900 1rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: rgba(167, 182, 255, 0.78);
    background: rgba(167, 182, 255, 0.17);
  }

  &:focus-visible {
    outline: 1px solid rgba(167, 182, 255, 0.86);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.42;
  }
`;

export const InlineSortTooltip = styled.span`
  position: absolute;
  z-index: 12;
  top: calc(100% + 6px);
  left: 50%;
  width: max-content;
  max-width: min(220px, calc(100vw - 2rem));
  padding: 0.32rem 0.42rem;
  border: 1px solid rgba(119, 213, 255, 0.48);
  border-radius: 2px;
  background: rgba(7, 13, 20, 0.98);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.32);
  color: #dff5ff;
  font: 700 0.62rem/1.25 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.035em;
  pointer-events: none;
  transform: translateX(-50%);
`;

export const ResultsList = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-flow: row;
  gap: ${({ $compact }) => ($compact ? '0' : '3px')};
  padding: ${({ $compact }) => ($compact ? '3px' : '3px')};

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    grid-template-columns: ${({ $compact }) =>
      $compact ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))'};
    gap: ${({ $compact }) => ($compact ? '0' : '0.62rem')};
    padding: ${({ $compact }) => ($compact ? '3px' : '0.62rem')};
  }
`;

export const AsciiResultButton = styled.button`
  display: grid;
  grid-template-columns: auto minmax(0, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.42rem;
  width: 100%;
  min-height: 40px;
  padding: 0.22rem 0.5rem;
  border: 0;
  border-bottom: 1px solid rgba(127, 215, 255, 0.12);
  border-radius: 0;
  background: ${({ $expanded }) =>
    $expanded ? 'rgba(76, 198, 193, 0.11)' : 'rgba(7, 13, 19, 0.52)'};
  color: #dfeaf1;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(76, 198, 193, 0.08);
  }

  &:focus-visible {
    position: relative;
    z-index: 1;
    outline: 1px solid rgba(127, 215, 255, 0.82);
    outline-offset: -1px;
  }
`;

export const AsciiBranch = styled.span`
  color: var(--box-neon, #7fd7ff);
  font: 800 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre;
`;

export const AsciiItemName = styled.span`
  min-width: 0;
  overflow: hidden;
  color: #edf5f8;
  font: 760 0.76rem/1.1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const AsciiPlacement = styled.span`
  min-width: 0;
  overflow: hidden;
  color: rgba(184, 204, 216, 0.52);
  font: 650 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const AsciiDisclosure = styled.span`
  color: rgba(167, 182, 255, 0.8);
  font: 900 0.78rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
  border-radius: 2px 7px 2px 2px;
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
  border-radius: 2px 6px 2px 2px;
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
  border-radius: 2px 6px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
  border: 1px solid ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '127, 215, 255'}, 0.26)`};
  background: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '127, 215, 255'}, 0.1)`};
  color: ${({ $boxMutedRgb }) => `rgba(${$boxMutedRgb || '190, 205, 218'}, 0.94)`};
  line-height: 1;
  padding: 0.14rem 0.4rem;
`;

export const BoxInspectPanel = styled.section`
  border-radius: 2px 7px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px 5px 2px 2px;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.2rem 0.28rem;
`;

export const BoxInspectItemThumb = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid ${({ $empty }) => ($empty
    ? 'rgba(214, 226, 241, 0.16)'
    : 'rgba(127, 215, 255, 0.34)')};
  border-radius: 2px 4px 2px 2px;
  background: ${({ $empty }) => ($empty
    ? 'rgba(255, 255, 255, 0.025)'
    : 'rgba(5, 12, 19, 0.88)')};
  color: rgba(214, 226, 241, 0.34);
  font: 800 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

export const BoxInspectItemContent = styled.span`
  display: grid;
  gap: 0.08rem;
  min-width: 0;
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
  border-radius: 2px 5px 2px 2px;
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
  position: relative;
  isolation: isolate;
  min-width: 0;
  border: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.24);
  border-radius: 2px 8px 2px 2px;
  background:
    linear-gradient(
      var(--box-wash-angle, 96deg),
      rgba(var(--box-primary-rgb, 127, 215, 255), 0.1),
      transparent 36%
    ),
    linear-gradient(180deg, rgba(14, 21, 29, 0.98), rgba(8, 13, 19, 0.98)),
    ${RETRIEVAL.row};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: border-color 140ms ease, box-shadow 160ms ease;
  border-color: ${({ $expanded }) =>
    $expanded
      ? 'rgba(var(--box-neon-rgb, 127, 215, 255), 0.66)'
      : 'rgba(var(--box-primary-rgb, 127, 215, 255), 0.24)'};
  box-shadow: ${({ $expanded }) =>
    $expanded
      ? '0 10px 24px rgba(0, 0, 0, 0.3), 0 0 16px rgba(var(--box-primary-rgb, 127, 215, 255), 0.14)'
      : '0 4px 12px rgba(0, 0, 0, 0.2)'};

  &::before {
    content: '';
    position: absolute;
    z-index: 2;
    inset: 0 auto 0 0;
    width: 6px;
    background: linear-gradient(
      180deg,
      var(--box-neon, #7fd7ff),
      var(--box-primary, #7fd7ff) 42%,
      var(--box-secondary, #67d9d3)
    );
    box-shadow: 0 0 10px rgba(var(--box-primary-rgb, 127, 215, 255), 0.2);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    z-index: 2;
    top: 0;
    left: 6px;
    width: clamp(76px, 28%, 150px);
    height: 2px;
    background: linear-gradient(
      90deg,
      var(--box-primary, #7fd7ff),
      var(--box-secondary, #67d9d3),
      transparent
    );
    pointer-events: none;
  }

  &:has(> [role='button']:hover) {
    border-color: rgba(var(--box-neon-rgb, 127, 215, 255), 0.54);
    box-shadow:
      0 8px 18px rgba(0, 0, 0, 0.26),
      0 0 12px rgba(var(--box-primary-rgb, 127, 215, 255), 0.12);
  }

  &:has(> [role='button']:focus-visible) {
    border-color: var(--box-neon, #77d5ff);
  }

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    grid-column: ${({ $expanded }) => ($expanded ? '1 / -1' : 'auto')};
  }
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
  padding: ${({ $expanded }) =>
    $expanded ? '0.42rem 0.58rem 0.42rem 0.82rem' : '0.48rem 0.58rem 0.48rem 0.82rem'};
  display: grid;
  gap: 0.2rem;
  transition:
    background 140ms ease,
    transform 90ms ease;

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

  &:active {
    background: linear-gradient(
      180deg,
      rgba(42, 62, 82, 0.86),
      rgba(22, 39, 55, 0.72)
    );
    transform: translateY(1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: ${({ $expanded }) =>
      $expanded ? '0.42rem 0.46rem 0.42rem 0.72rem' : '0.44rem 0.46rem 0.44rem 0.72rem'};
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
    $expanded ? '5px minmax(0, 1fr)' : '52px minmax(0, 1fr)'};
  align-items: ${({ $expanded }) => ($expanded ? 'center' : 'start')};
  gap: 0.62rem;
  min-width: 0;
  flex: 1 1 auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: ${({ $expanded }) =>
      $expanded ? '4px minmax(0, 1fr)' : '50px minmax(0, 1fr)'};
    gap: 0.46rem;
  }
`;

export const ExpandedRowMarker = styled.span`
  width: 100%;
  min-height: 100%;
  border-radius: 1px;
  background: linear-gradient(
    180deg,
    var(--box-neon, #67efc8),
    var(--box-secondary, #4cc6c1)
  );
  box-shadow: 0 0 8px rgba(var(--box-primary-rgb, 103, 239, 200), 0.22);
`;

const thumbFrameBase = css`
  width: 52px;
  aspect-ratio: 1 / 1;
  border-radius: 2px 6px 2px 2px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(8, 13, 19, 0.9);
  display: grid;
  place-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 50px;
    border-radius: 2px 5px 2px 2px;
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
  gap: ${({ $expanded }) => ($expanded ? '0' : '0.16rem')};
  min-width: 0;
`;

export const CompactMetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem 0.44rem;
  color: rgba(188, 211, 226, 0.6);
  font: 700 0.57rem/1.12 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.045em;
  text-transform: uppercase;
`;

export const CompactSecondaryMetaLine = styled.div`
  display: none;
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
  font-size: 0.94rem;
  font-weight: 780;
  letter-spacing: 0.01em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    display: -webkit-box;
    font-size: 0.92rem;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
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
  gap: 0.08rem;
  min-width: 0;
`;

export const CollapsedPlacementRow = styled.div`
  display: grid;
  grid-template-columns: 3.9rem minmax(0, 1fr);
  align-items: center;
  column-gap: 0.28rem;
  min-width: 0;
`;

export const CollapsedPlacementLabel = styled.span`
  display: inline-grid;
  grid-template-columns: 3ch auto;
  align-items: center;
  gap: 0.28rem;
  color: rgba(214, 226, 241, 0.52);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.15;

  &::after {
    content: '//';
    color: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.72);
    letter-spacing: -0.08em;
  }
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

export const CollapsedBoxTelemetry = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
  max-width: 100%;
  min-width: 0;
  min-height: 1.1rem;
  border-left: 2px solid
    ${({ $orphaned }) =>
      $orphaned
        ? 'rgba(176, 166, 148, 0.58)'
        : 'rgba(var(--box-primary-rgb, 127, 215, 255), 0.72)'};
  padding: 0.04rem 0 0.04rem 0.38rem;
  color: ${({ $orphaned }) =>
    $orphaned
      ? 'rgba(205, 198, 188, 0.84)'
      : 'var(--box-muted, rgba(218, 231, 244, 0.9))'};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.66rem;
  font-weight: 760;
  line-height: 1.2;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CollapsedBoxId = styled.span`
  flex: 0 0 auto;
  color: var(--box-neon, #b9ecff);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-shadow: 0 0 7px rgba(var(--box-primary-rgb, 127, 215, 255), 0.24);
`;

export const CollapsedBoxName = styled.span`
  min-width: 0;
  overflow: hidden;
  color: var(--box-muted, rgba(218, 231, 244, 0.86));
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CollapsedLocationValue = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 1.1rem;
  border-left: 2px solid
    ${({ $unknown }) =>
      $unknown
        ? 'rgba(176, 166, 148, 0.52)'
        : 'rgba(var(--box-secondary-rgb, 103, 217, 211), 0.48)'};
  padding: 0.04rem 0 0.04rem 0.38rem;
  max-width: 100%;
  color: ${({ $unknown }) =>
    $unknown ? 'rgba(205, 198, 188, 0.76)' : 'rgba(218, 228, 238, 0.78)'};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.65rem;
  line-height: 1.2;
  letter-spacing: 0.04em;
  font-weight: 680;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 7px 2px 2px;
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
    border-radius: 2px 6px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 5px 2px 2px;
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
  border-radius: 2px 6px 2px 2px;
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
  border-top: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.28);
  background:
    linear-gradient(90deg, rgba(var(--box-primary-rgb, 127, 215, 255), 0.08), transparent 30%),
    linear-gradient(180deg, rgba(11, 19, 28, 0.94), rgba(7, 12, 18, 0.92));
  padding: 0.5rem 0.56rem 0.56rem;
  display: grid;
  gap: 0.46rem;
  align-items: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.46rem 0.5rem 0.52rem;
  }
`;

const expandedDeckArrival = keyframes`
  from {
    opacity: 0.35;
    transform: translateX(9px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const expandedLogOrbit = keyframes`
  from {
    transform: rotate(0deg) scale(0.92);
  }
  to {
    transform: rotate(360deg) scale(0.92);
  }
`;

const expandedLogPulse = keyframes`
  0%, 100% {
    opacity: 0.42;
    transform: scale(0.72);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
`;

export const ExpandedDeckNav = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 3px;
  border-left: 5px solid var(--box-primary, #77d5ff);
  padding-left: 4px;

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    display: none;
  }
`;

export const ExpandedDeckTab = styled.button`
  min-width: 0;
  min-height: 44px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.38rem;
  border: 1px solid
    ${({ $active }) =>
      $active
        ? 'rgba(var(--box-neon-rgb, 185, 236, 255), 0.72)'
        : 'rgba(var(--box-primary-rgb, 119, 213, 255), 0.22)'};
  border-radius: 2px 7px 2px 2px;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(90deg, rgba(var(--box-primary-rgb, 119, 213, 255), 0.28), rgba(var(--box-secondary-rgb, 103, 217, 211), 0.08))'
      : 'rgba(7, 13, 20, 0.82)'};
  color: ${({ $active }) =>
    $active ? 'var(--box-neon, #dff7ff)' : 'rgba(198, 214, 228, 0.66)'};
  padding: 0.34rem 0.46rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.64rem;
  font-weight: 820;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  cursor: pointer;

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    gap: 0.12rem;
    padding: 0.28rem 0.08rem;
    font-size: 0.51rem;
    letter-spacing: 0.035em;
    text-align: center;
  }

  > span {
    color: ${({ $active }) =>
      $active ? 'var(--box-secondary, #67d9d3)' : 'rgba(167, 182, 255, 0.48)'};
    font-size: 0.58rem;
  }

  @media (max-width: 520px) {
    > span {
      font-size: 0.53rem;
    }
  }

  &:hover {
    border-color: rgba(var(--box-primary-rgb, 119, 213, 255), 0.56);
    background: rgba(var(--box-primary-rgb, 119, 213, 255), 0.16);
  }

  &:focus-visible {
    outline: 2px solid var(--box-neon, #b9ecff);
    outline-offset: 2px;
  }
`;

export const ExpandedDeckViewport = styled.div`
  min-width: 0;

  @media (max-width: 899px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    min-height: clamp(420px, 53dvh, 448px);
    overflow: visible;
  }

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    display: grid;
    grid-template-columns: ${({ $hasOverview }) =>
      $hasOverview ? 'minmax(0, 1.28fr) minmax(320px, 0.92fr)' : 'minmax(0, 1fr)'};
    gap: 0.48rem 0.58rem;
    align-items: start;
  }
`;

export const ExpandedDeckSection = styled.section`
  min-width: 0;
  display: grid;
  gap: 0.42rem;
  align-content: start;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.26);
  border-left: 5px solid
    ${({ $section }) =>
      $section === 'commands'
        ? 'var(--box-secondary, #67d9d3)'
        : 'var(--box-primary, #77d5ff)'};
  border-radius: 2px 8px 2px 2px;
  background:
    linear-gradient(
      100deg,
      rgba(var(--box-primary-rgb, 119, 213, 255), 0.08),
      transparent 36%
    ),
    rgba(7, 13, 20, 0.9);
  padding: 0.5rem 0.54rem 0.56rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);

  &[hidden] {
    display: none;
  }

  @media (max-width: 899px) {
    grid-area: 1 / 1;
    min-height: clamp(420px, 53dvh, 448px);
    overflow: visible;
    touch-action: pan-y;
    animation: ${expandedDeckArrival} 180ms ease-out;

    ${({ $section }) =>
      $section === 'log'
        ? `
          grid-template-rows: auto minmax(0, 1fr);
          align-content: stretch;
        `
        : ''}

    &[hidden] {
      display: none;
    }
  }

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    ${({ $section, $hasOverview }) => {
      if (!$hasOverview) return 'grid-column: 1 / -1;';
      if ($section === 'overview') {
        return 'grid-column: 1; grid-row: 1 / span 4; height: 100%;';
      }
      return 'grid-column: 2;';
    }}
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const ExpandedDeckFooter = styled.div`
  display: grid;
  grid-template-columns: minmax(88px, 1fr) auto minmax(88px, 1fr);
  align-items: center;
  gap: 0.36rem;

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    display: none;
  }
`;

export const ExpandedDeckArrow = styled.button`
  min-height: 44px;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.3);
  border-radius: 2px 7px 2px 2px;
  background: rgba(var(--box-primary-rgb, 119, 213, 255), 0.1);
  color: var(--box-muted, #d7e5ef);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:last-child {
    border-color: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.34);
    background: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.11);
  }

  &:hover:not(:disabled),
  &:focus-visible {
    border-color: var(--box-neon, #b9ecff);
    background: rgba(var(--box-primary-rgb, 119, 213, 255), 0.2);
    outline: none;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const ExpandedDeckPosition = styled.span`
  color: var(--box-neon, #b9ecff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.66rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  white-space: nowrap;
`;

export const ExpandedItemPanel = styled.section`
  border-radius: 2px 7px 2px 2px;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.22);
  background:
    linear-gradient(90deg, rgba(var(--box-primary-rgb, 119, 213, 255), 0.06), transparent 34%),
    rgba(10, 18, 27, 0.76);
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
    border-radius: 2px 7px 2px 2px;
  }

  @media (min-width: 560px) {
    width: 100%;
  }
`;

export const ExpandedMediaFrame = styled.div`
  position: relative;
  isolation: isolate;
  width: min(100%, 280px);
  border-radius: 2px 7px 2px 2px;
  border: ${({ $hasImage }) =>
    $hasImage
      ? '0'
      : '1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.42)'};
  background:
    linear-gradient(160deg, rgba(18, 30, 42, 0.9), rgba(10, 18, 27, 0.86)),
    rgba(9, 16, 24, 0.82);
  overflow: hidden;
  box-shadow: ${({ $hasImage }) =>
    $hasImage
      ? 'none'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 0 0 1px rgba(119, 213, 255, 0.08)'};
  aspect-ratio: 1 / 1;

  &::after {
    content: '';
    position: absolute;
    z-index: 0;
    inset: 0;
    display: none;
    pointer-events: none;
    background:
      linear-gradient(rgba(4, 9, 14, 0.18), rgba(4, 9, 14, 0.3)),
      radial-gradient(
        circle at 50% 43%,
        transparent 18%,
        rgba(4, 9, 14, 0.2) 56%,
        rgba(4, 9, 14, 0.68) 100%
      );
  }

  @media (min-width: 560px) {
    width: 100%;
    aspect-ratio: 16 / 9;

    &::after {
      display: ${({ $ambient }) => ($ambient ? 'block' : 'none')};
    }
  }
`;

export const ExpandedMediaBackdrop = styled.img`
  position: absolute;
  z-index: 0;
  inset: -22%;
  width: 144%;
  height: 144%;
  display: none;
  object-fit: cover;
  filter: blur(18px) saturate(1.5) brightness(0.78) contrast(0.9);
  transform: scale(1.28);
  opacity: 0;

  @media (min-width: 560px) {
    display: ${({ $ambient }) => ($ambient ? 'block' : 'none')};
    opacity: ${({ $ambient }) => ($ambient ? '0.9' : '0')};
  }
`;

export const ExpandedMediaImage = styled.img`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: ${({ $ambient }) => ($ambient ? 'contain' : 'cover')};
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

export const ExpandedEmptyTelemetry = styled.p`
  margin: 0;
  border-left: 3px solid rgba(var(--box-muted-rgb, 215, 229, 239), 0.3);
  background: rgba(9, 16, 24, 0.52);
  color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.66);
  padding: 0.28rem 0.38rem;
  font-size: 0.71rem;
  font-style: italic;
  line-height: 1.35;
`;

export const ExpandedLogStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  min-width: 0;
  min-height: 100%;
`;

export const ExpandedLogSection = styled.section`
  display: grid;
  gap: 0.28rem;
  min-width: 0;
`;

export const ExpandedLogSectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem;

  > span {
    color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.54);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.56rem;
    font-weight: 760;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
`;

export const ExpandedLogProvenanceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 3px;
`;

export const ExpandedLogProvenanceCell = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.14rem;
  border: 1px solid rgba(var(--box-secondary-rgb, 103, 217, 211), 0.18);
  border-left: 3px solid rgba(var(--box-secondary-rgb, 103, 217, 211), 0.62);
  border-radius: 2px 5px 2px 2px;
  background: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.06);
  padding: 0.3rem 0.38rem;

  > span {
    color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.56);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.52rem;
    font-weight: 760;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  > strong {
    min-width: 0;
    color: var(--box-neon, #dff7ff);
    font-size: 0.7rem;
    font-weight: 760;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
`;

export const ExpandedLogProvenanceLink = styled(Link)`
  min-width: 0;
  color: var(--box-neon, #dff7ff);
  font-size: 0.7rem;
  font-weight: 760;
  line-height: 1.25;
  text-decoration-color: rgba(var(--box-primary-rgb, 119, 213, 255), 0.52);
  text-underline-offset: 2px;
  overflow-wrap: anywhere;

  &:hover,
  &:focus-visible {
    color: #fff;
    text-decoration-color: var(--box-neon, #dff7ff);
    outline: none;
  }
`;

export const ExpandedLogHistoryRegion = styled.section`
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
`;

export const ExpandedLogTimeline = styled.div`
  display: grid;
  gap: 3px;
  border-left: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.2);
  margin-left: 0.34rem;
  padding-left: 0.72rem;
`;

export const ExpandedLogEvent = styled.article`
  --event-rgb: ${({ $tone }) =>
    $tone === 'used'
      ? 'var(--box-primary-rgb, 119, 213, 255)'
      : $tone === 'checked'
        ? 'var(--box-secondary-rgb, 103, 217, 211)'
        : $tone === 'acquired'
          ? '244, 194, 110'
          : 'var(--box-neon-rgb, 185, 236, 255)'};

  position: relative;
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(var(--event-rgb), 0.18);
  border-left: 4px solid rgba(var(--event-rgb), 0.72);
  border-radius: 2px 6px 2px 2px;
  background:
    linear-gradient(90deg, rgba(var(--event-rgb), 0.1), transparent 62%),
    rgba(7, 14, 21, 0.72);
  padding: 0.34rem 0.4rem;

  &::before {
    content: '';
    position: absolute;
    left: -1.1rem;
    top: 50%;
    width: 7px;
    height: 7px;
    border: 1px solid rgba(var(--event-rgb), 0.9);
    background: rgb(var(--event-rgb));
    box-shadow: 0 0 9px rgba(var(--event-rgb), 0.38);
    transform: translateY(-50%) rotate(45deg);
  }

  > span {
    width: 5px;
    height: 22px;
    background: linear-gradient(180deg, rgba(var(--event-rgb), 0.96), transparent);
  }

  > div {
    min-width: 0;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  strong {
    color: var(--box-neon, #dff7ff);
    font-size: 0.72rem;
    font-weight: 820;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  time {
    color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.64);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.6rem;
    white-space: nowrap;
  }
`;

export const ExpandedLogIdle = styled.div`
  position: relative;
  isolation: isolate;
  flex: 1;
  min-height: ${({ $full }) => ($full ? 'clamp(240px, 31vh, 310px)' : 'clamp(138px, 20vh, 190px)')};
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.24);
  border-left: 5px solid rgba(var(--box-secondary-rgb, 103, 217, 211), 0.62);
  border-radius: 2px 10px 2px 2px;
  background:
    radial-gradient(circle at 50% 50%, rgba(8, 16, 24, 0.52), rgba(4, 9, 15, 0.94) 68%),
    rgba(5, 11, 17, 0.92);

  &::before {
    content: '';
    position: absolute;
    z-index: -2;
    inset: -70%;
    background: conic-gradient(
      from 20deg,
      rgba(var(--box-primary-rgb, 119, 213, 255), 0.04),
      rgba(var(--box-primary-rgb, 119, 213, 255), 0.34),
      rgba(var(--box-secondary-rgb, 103, 217, 211), 0.1),
      rgba(var(--box-neon-rgb, 185, 236, 255), 0.3),
      rgba(var(--box-primary-rgb, 119, 213, 255), 0.04)
    );
    filter: blur(22px) saturate(1.25);
    animation: ${expandedLogOrbit} 24s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 12%;
    background: repeating-radial-gradient(
      circle,
      transparent 0 22px,
      rgba(var(--box-secondary-rgb, 103, 217, 211), 0.055) 23px 24px
    );
    opacity: 0.7;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
      transform: rotate(24deg) scale(0.92);
    }
  }
`;

export const ExpandedLogIdleContent = styled.div`
  max-width: 25rem;
  display: grid;
  justify-items: center;
  gap: 0.34rem;
  padding: 1rem;
  text-align: center;

  > strong {
    color: var(--box-neon, #dff7ff);
    font-size: 0.8rem;
    font-weight: 860;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  > p {
    max-width: 30ch;
    margin: 0;
    color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.72);
    font-size: 0.7rem;
    line-height: 1.42;
  }

  > span {
    color: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.64);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.54rem;
    font-weight: 760;
    letter-spacing: 0.1em;
  }
`;

export const ExpandedLogIdleSignal = styled.div`
  position: relative;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(var(--box-secondary-rgb, 103, 217, 211), 0.52);
  clip-path: polygon(0 0, 72% 0, 100% 28%, 100% 100%, 28% 100%, 0 72%);
  transform: rotate(45deg);
  box-shadow:
    inset 0 0 14px rgba(var(--box-primary-rgb, 119, 213, 255), 0.14),
    0 0 18px rgba(var(--box-secondary-rgb, 103, 217, 211), 0.12);

  > span {
    width: 13px;
    height: 13px;
    border: 2px solid var(--box-neon, #dff7ff);
    background: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.38);
    animation: ${expandedLogPulse} 3.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    > span {
      animation: none;
      opacity: 0.78;
      transform: scale(0.86);
    }
  }
`;

export const ExpandedExternalLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem;

  @media (max-width: 420px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ExpandedExternalLink = styled.a`
  min-width: 0;
  min-height: 44px;
  display: grid;
  align-content: center;
  gap: 0.1rem;
  border: 1px solid rgba(var(--box-secondary-rgb, 103, 217, 211), 0.36);
  border-left: 4px solid var(--box-secondary, #67d9d3);
  border-radius: 2px 7px 2px 2px;
  background: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.08);
  color: var(--box-neon, #dff7ff);
  padding: 0.3rem 0.42rem;
  font-size: 0.7rem;
  font-weight: 740;
  line-height: 1.25;
  text-decoration: none;
  overflow-wrap: anywhere;

  > span {
    color: var(--box-secondary, #67d9d3);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.54rem;
    letter-spacing: 0.08em;
  }

  &:hover,
  &:focus-visible {
    border-color: var(--box-neon, #dff7ff);
    background: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.17);
    outline: none;
  }
`;

export const ExpandedBoxIdentity = styled.div`
  display: grid;
  gap: 0.08rem;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.28);
  border-left: 4px solid var(--box-primary, #77d5ff);
  border-radius: 2px 6px 2px 2px;
  background: rgba(11, 19, 28, 0.72);
  padding: 0.3rem 0.4rem;
`;

export const ExpandedBoxId = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.9rem;
  font-weight: 860;
  color: var(--box-neon, #b9ecff);
  letter-spacing: 0.05em;
  line-height: 1.1;
`;

export const ExpandedBoxName = styled.p`
  margin: 0;
  color: var(--box-muted, rgba(218, 231, 244, 0.88));
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

export const ExpandedBoxPanel = styled.section`
  border-radius: 2px 7px 2px 2px;
  border: 1px solid rgba(var(--box-muted-rgb, 255, 255, 255), 0.24);
  background:
    linear-gradient(180deg, rgba(8, 14, 20, 0.96), rgba(6, 11, 17, 0.95)),
    rgba(7, 12, 18, 0.92);
  padding: 0.42rem 0.46rem 0.46rem;
  display: grid;
  gap: 0.38rem;
  align-content: start;

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    height: 100%;
    grid-template-rows: auto auto auto minmax(0, 1fr);
  }
`;

export const ExpandedActionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.38rem;
`;

export const ExpandedActionButton = styled.button`
  --action-rgb: ${({ $tone }) =>
    $tone === 'checked'
      ? 'var(--box-secondary-rgb, 103, 217, 211)'
      : $tone === 'consumed'
        ? '240, 138, 123'
        : $tone === 'maintained'
          ? 'var(--box-neon-rgb, 185, 236, 255)'
          : 'var(--box-primary-rgb, 119, 213, 255)'};
  --action-color: ${({ $tone }) =>
    $tone === 'checked'
      ? 'var(--box-secondary, #67d9d3)'
      : $tone === 'consumed'
        ? '#f08a7b'
        : $tone === 'maintained'
          ? 'var(--box-neon, #b9ecff)'
          : 'var(--box-primary, #77d5ff)'};

  min-width: 0;
  min-height: 52px;
  display: grid;
  align-content: center;
  gap: 0.18rem;
  border: 1px solid rgba(var(--action-rgb), 0.58);
  border-left: 6px solid var(--action-color);
  border-radius: 2px 9px 2px 2px;
  background:
    linear-gradient(90deg, rgba(var(--action-rgb), 0.22), transparent 82%),
    rgba(8, 15, 23, 0.9);
  color: #eaf5ff;
  padding: 0.38rem 0.58rem;
  text-align: left;
  cursor: pointer;
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 0 100%);
  transition:
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;

  &:hover:not(:disabled) {
    border-color: rgba(var(--action-rgb), 0.88);
    background:
      linear-gradient(90deg, rgba(var(--action-rgb), 0.34), transparent 88%),
      rgba(10, 19, 29, 0.96);
    box-shadow: 0 0 14px rgba(var(--action-rgb), 0.16);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--action-color);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.62;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ExpandedActionLink = styled(Link)`
  min-width: 0;
  min-height: 52px;
  display: grid;
  align-content: center;
  gap: 0.18rem;
  border: 1px solid rgba(var(--box-secondary-rgb, 103, 217, 211), 0.48);
  border-left: 6px solid var(--box-secondary, #67d9d3);
  border-radius: 2px 9px 2px 2px;
  background:
    linear-gradient(
      90deg,
      rgba(var(--box-secondary-rgb, 103, 217, 211), 0.2),
      transparent 82%
    ),
    rgba(8, 15, 23, 0.9);
  color: #eaf5ff;
  padding: 0.38rem 0.58rem;
  text-align: left;
  text-decoration: none;
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 0 100%);
  transition:
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;

  &:hover {
    border-color: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.84);
    background:
      linear-gradient(
        90deg,
        rgba(var(--box-secondary-rgb, 103, 217, 211), 0.32),
        transparent 88%
      ),
      rgba(10, 19, 29, 0.96);
    box-shadow: 0 0 14px rgba(var(--box-secondary-rgb, 103, 217, 211), 0.15);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--box-secondary, #67d9d3);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ExpandedActionCode = styled.span`
  color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.64);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.57rem;
  font-weight: 760;
  letter-spacing: 0.09em;
  line-height: 1;
  text-transform: uppercase;
`;

export const ExpandedActionLabel = styled.span`
  overflow: hidden;
  font-size: 0.76rem;
  font-weight: 860;
  letter-spacing: 0.06em;
  line-height: 1.1;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const ExpandedMetadataGrid = styled.div`
  display: grid;
  gap: 0.34rem;

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 0.44rem;
    align-items: stretch;
  }
`;

export const ExpandedMetaCard = styled.div`
  display: grid;
  gap: 0.18rem;
  border: 1px solid rgba(127, 215, 255, 0.16);
  border-radius: 2px 6px 2px 2px;
  background:
    linear-gradient(180deg, rgba(16, 24, 34, 0.82), rgba(11, 18, 26, 0.8)),
    rgba(10, 16, 24, 0.72);
  padding: 0.32rem 0.38rem;

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
    ${({ $fullWidth }) => ($fullWidth ? 'grid-column: 1 / -1;' : '')}
  }
`;

export const ExpandedMetaRow = styled.div`
  display: grid;
  gap: 0.1rem;
  border: 1px solid rgba(127, 215, 255, 0.14);
  border-radius: 2px 5px 2px 2px;
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

export const ExpandedTagGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.26rem;
`;

export const ExpandedTagLink = styled(Link)`
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.34);
  border-radius: 2px 5px 2px 2px;
  background: rgba(var(--box-primary-rgb, 119, 213, 255), 0.1);
  color: var(--box-neon, #dff7ff);
  padding: 0.22rem 0.48rem;
  font-size: 0.68rem;
  font-weight: 740;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;

  &::before {
    content: '#';
    color: var(--box-secondary, #67d9d3);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.62rem;
    font-weight: 900;
  }

  &:hover {
    border-color: rgba(var(--box-neon-rgb, 185, 236, 255), 0.76);
    background: rgba(var(--box-primary-rgb, 119, 213, 255), 0.2);
    box-shadow: 0 0 10px rgba(var(--box-primary-rgb, 119, 213, 255), 0.12);
  }

  &:focus-visible {
    outline: 2px solid var(--box-neon, #b9ecff);
    outline-offset: 2px;
  }
`;

export const ExpandedDataStack = styled.div`
  display: grid;
  gap: 0.36rem;
  align-content: start;
  min-width: 0;
`;

export const ExpandedDataPager = styled.section`
  display: grid;
  gap: 0.34rem;
  min-width: 0;
`;

export const ExpandedDataPagerHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const ExpandedDataPagerPosition = styled.span`
  color: var(--box-neon, #dff7ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.59rem;
  font-weight: 850;
  letter-spacing: 0.09em;
  white-space: nowrap;
`;

export const ExpandedDataPagerTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2px;

  @media (max-width: 520px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const ExpandedDataPagerTab = styled.button`
  min-width: 0;
  min-height: 36px;
  padding: 0.28rem 0.16rem;
  overflow: hidden;
  border: 1px solid
    ${({ $active }) => ($active
      ? 'rgba(var(--box-neon-rgb, 185, 236, 255), 0.7)'
      : 'rgba(var(--box-primary-rgb, 119, 213, 255), 0.2)')};
  border-radius: 2px 5px 2px 2px;
  background: ${({ $active }) => ($active
    ? 'rgba(var(--box-primary-rgb, 119, 213, 255), 0.2)'
    : 'rgba(7, 13, 20, 0.72)')};
  color: ${({ $active }) => ($active
    ? 'var(--box-neon, #dff7ff)'
    : 'rgba(var(--box-muted-rgb, 215, 229, 239), 0.58)')};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.52rem;
  font-weight: 820;
  letter-spacing: 0.045em;
  text-transform: uppercase;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: var(--box-neon, #b9ecff);
    background: rgba(var(--box-primary-rgb, 119, 213, 255), 0.16);
    outline: none;
  }
`;

export const ExpandedDataPagerBody = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  align-items: stretch;
  gap: 0.28rem;
`;

export const ExpandedDataPagerArrow = styled.button`
  min-height: 44px;
  align-self: center;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.28);
  border-radius: 2px 5px 2px 2px;
  background: rgba(var(--box-primary-rgb, 119, 213, 255), 0.09);
  color: var(--box-neon, #dff7ff);
  font: 850 0.9rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: var(--box-neon, #b9ecff);
    background: rgba(var(--box-primary-rgb, 119, 213, 255), 0.2);
    outline: none;
  }
`;

export const ExpandedDetailSignal = styled.p`
  margin: 0;
  border-left: 4px solid var(--box-secondary, #67d9d3);
  background: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.08);
  color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.76);
  padding: 0.3rem 0.42rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const ExpandedDetailError = styled.div`
  display: grid;
  gap: 0.3rem;
  border: 1px solid rgba(240, 138, 123, 0.48);
  border-left: 4px solid #f08a7b;
  border-radius: 2px 7px 2px 2px;
  background: rgba(240, 138, 123, 0.09);
  color: #ffd7d0;
  padding: 0.34rem 0.42rem;
  font-size: 0.69rem;
  line-height: 1.35;
`;

export const ExpandedDetailRetry = styled.button`
  justify-self: start;
  min-height: 44px;
  border: 1px solid rgba(240, 138, 123, 0.62);
  border-radius: 2px 7px 2px 2px;
  background: rgba(240, 138, 123, 0.12);
  color: #ffe7e2;
  padding: 0.3rem 0.52rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: #ffd7d0;
    background: rgba(240, 138, 123, 0.22);
    outline: none;
  }
`;

export const ExpandedDataTable = styled.table`
  width: 100%;
  border-spacing: 0 3px;
  table-layout: fixed;

  caption {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  th,
  td {
    border-top: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.14);
    border-bottom: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.14);
    background: rgba(9, 16, 24, 0.68);
    padding: 0.32rem 0.4rem;
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  th {
    width: 43%;
    border-left: 4px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.56);
    color: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.86);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.58rem;
    font-weight: 780;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  td {
    border-right: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.14);
    color: rgba(230, 244, 255, 0.92);
    font-size: 0.7rem;
    font-weight: 630;
    line-height: 1.35;
  }

  @media (min-width: 1400px) {
    display: block;

    tbody {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 3px 0.34rem;
    }

    tr {
      display: grid;
      grid-template-columns: minmax(96px, 0.88fr) minmax(0, 1.12fr);
    }

    th,
    td {
      width: auto;
    }
  }
`;

export const ExpandedTelemetryLink = styled(Link)`
  color: var(--box-neon, #dff7ff);
  text-decoration-color: rgba(var(--box-primary-rgb, 119, 213, 255), 0.52);
  text-underline-offset: 2px;

  &:hover,
  &:focus-visible {
    color: #fff;
    text-decoration-color: var(--box-neon, #dff7ff);
    outline: none;
  }
`;

export const ExpandedCommandStack = styled.div`
  display: grid;
  gap: 0.46rem;
  align-content: start;
`;

export const ExpandedLifecycleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.28rem;

  @media (min-width: 520px) and (max-width: 899px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const ExpandedLifecycleCell = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.12rem;
  border: 1px solid rgba(var(--box-secondary-rgb, 103, 217, 211), 0.18);
  border-left: 3px solid rgba(var(--box-secondary-rgb, 103, 217, 211), 0.62);
  border-radius: 2px 5px 2px 2px;
  background: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.06);
  padding: 0.3rem 0.36rem;

  > span {
    color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.6);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.52rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  > strong {
    color: var(--box-neon, #dff7ff);
    font-size: 0.69rem;
    font-weight: 760;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
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

  @media (min-width: ${RETRIEVAL_WIDE_BREAKPOINT}) {
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

export const ExpandedDescriptionBlock = styled(ExpandedDetailBlock)`
  position: relative;
  gap: 0.32rem;
  overflow: hidden;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.2);
  border-left: 4px solid var(--box-primary, #77d5ff);
  border-radius: 2px 8px 2px 2px;
  background:
    radial-gradient(
      circle at 92% 8%,
      rgba(var(--box-secondary-rgb, 103, 217, 211), 0.13),
      transparent 38%
    ),
    linear-gradient(110deg, rgba(var(--box-primary-rgb, 119, 213, 255), 0.09), transparent 58%),
    rgba(8, 15, 23, 0.78);
  padding: 0.46rem 0.54rem 0.5rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 8px 22px rgba(0, 0, 0, 0.12);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0.5rem;
    width: 2.7rem;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--box-secondary, #67d9d3));
    opacity: 0.72;
  }

  ${ExpandedDetailLabel} {
    color: rgba(var(--box-secondary-rgb, 103, 217, 211), 0.9);
    text-decoration: none;
  }
`;

export const ExpandedDescriptionText = styled(ExpandedDetailText)`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: rgba(235, 250, 255, 0.94);
  font-size: 0.78rem;
  font-weight: 540;
  line-height: 1.48;
  text-wrap: pretty;
`;

export const ExpandedNotesBlock = styled(ExpandedDetailBlock)`
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.22);
  border-left: 4px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.64);
  border-radius: 2px 6px 2px 2px;
  background:
    linear-gradient(
      100deg,
      rgba(var(--box-primary-rgb, 119, 213, 255), 0.08),
      transparent 46%
    ),
    linear-gradient(180deg, rgba(11, 18, 27, 0.86), rgba(9, 15, 23, 0.88)),
    rgba(8, 13, 20, 0.82);
  padding: 0.4rem 0.46rem;
`;

export const ExpandedNotesText = styled(ExpandedDetailText)`
  min-height: 0;
  max-height: none;
  overflow: visible;
  white-space: pre-wrap;
`;

export const ExpandedNotesPage = styled.div`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.42rem;
  min-height: 0;
`;

export const ExpandedNotesPageHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;

  > span {
    color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.54);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.54rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;

export const ExpandedNotePreviewButton = styled.button`
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 0.7rem;
  width: 100%;
  min-height: clamp(310px, 42dvh, 370px);
  overflow: hidden;
  padding: clamp(0.86rem, 3vw, 1.18rem);
  color: rgba(235, 245, 252, 0.94);
  text-align: left;
  background:
    repeating-linear-gradient(
      180deg,
      transparent 0 1.78rem,
      rgba(var(--box-primary-rgb, 119, 213, 255), 0.07) 1.78rem calc(1.78rem + 1px)
    ),
    radial-gradient(
      circle at 92% 8%,
      rgba(var(--box-secondary-rgb, 103, 217, 211), 0.13),
      transparent 38%
    ),
    linear-gradient(118deg, rgba(var(--box-primary-rgb, 119, 213, 255), 0.09), transparent 62%),
    rgba(4, 10, 16, 0.72);
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.26);
  border-left: 4px solid var(--box-primary, #77d5ff);
  border-radius: 2px 9px 2px 2px;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.04);
  cursor: zoom-in;

  &::after {
    content: '';
    position: absolute;
    inset: auto 0 2.8rem;
    height: 4.4rem;
    background: linear-gradient(transparent, rgba(4, 10, 16, 0.96));
    pointer-events: none;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(var(--box-neon-rgb, 185, 236, 255), 0.72);
    outline: none;
    box-shadow:
      inset 0 1px rgba(255, 255, 255, 0.06),
      0 0 20px rgba(var(--box-primary-rgb, 119, 213, 255), 0.13);
  }
`;

export const ExpandedNotePreviewText = styled.span`
  display: -webkit-box;
  min-height: 0;
  overflow: hidden;
  color: inherit;
  font-size: clamp(0.84rem, 3.2vw, 0.96rem);
  font-weight: 530;
  line-height: 1.72;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 10;
`;

export const ExpandedNotePreviewAction = styled.span`
  position: relative;
  z-index: 1;
  justify-self: end;
  color: var(--box-neon, #dff7ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
  font-weight: 850;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;

export const ExpandedNoteBlank = styled.div`
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.45rem;
  min-height: clamp(310px, 42dvh, 370px);
  padding: 1rem;
  color: rgba(var(--box-muted-rgb, 215, 229, 239), 0.42);
  text-align: center;
  background:
    repeating-linear-gradient(
      180deg,
      transparent 0 1.78rem,
      rgba(var(--box-primary-rgb, 119, 213, 255), 0.055) 1.78rem calc(1.78rem + 1px)
    ),
    radial-gradient(circle at 50% 50%, rgba(var(--box-primary-rgb, 119, 213, 255), 0.06), transparent 45%),
    rgba(4, 10, 16, 0.55);
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.17);
  border-left: 4px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.46);
  border-radius: 2px 9px 2px 2px;

  > span {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  > small {
    max-width: 24rem;
    font-size: 0.72rem;
    line-height: 1.45;
  }
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
  border-radius: 2px 5px 2px 2px;
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
  ${({ $presentation }) =>
    $presentation === 'phone'
      ? `
    width: min(82vw, 390px);
    max-height: min(72vh, 620px);
  `
      : ''}
`;

export const LightboxImage = styled.img`
  max-width: min(95vw, 1280px);
  max-height: 88vh;
  width: auto;
  height: auto;
  object-fit: contain;
  ${({ $presentation }) =>
    $presentation === 'phone'
      ? `
    max-width: 100%;
    max-height: min(60vh, 520px);
  `
      : ''}
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
  border-radius: 2px 7px 2px 2px;
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
