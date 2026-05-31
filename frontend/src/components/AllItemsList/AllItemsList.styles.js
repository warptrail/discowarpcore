import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

const TABLE_STACK_BREAKPOINT = '900px';

const LCARS = {
  bg: '#0c0f11',
  panel: '#14181b',
  panelAlt: '#1a1f24',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.13)',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  textMuted: 'rgba(230,237,243,0.56)',
  root: '#7fd7ff',
  teal: '#4cc6c1',
  amber: '#e8b15c',
  coral: '#f08a7b',
  lilac: '#a7b6ff',
  decommissioned: '#e56f67',
};

const toneColor = (tone) => {
  if (tone === 'rootSoft') return '#9fe4ff';
  if (tone === 'rootDeep') return '#53b8ea';
  if (tone === 'tealSoft') return '#7cddd8';
  if (tone === 'tealDeep') return '#2fa6a4';
  if (tone === 'amberSoft') return '#f0c980';
  if (tone === 'amberDeep') return '#bd8a3f';
  if (tone === 'coralSoft') return '#f3a297';
  if (tone === 'coralDeep') return '#cb6d61';
  if (tone === 'lilacSoft') return '#c0cbff';
  if (tone === 'lilacDeep') return '#8297f0';
  if (tone === 'coral') return LCARS.coral;
  if (tone === 'amber') return LCARS.amber;
  if (tone === 'lilac') return LCARS.lilac;
  if (tone === 'teal') return LCARS.teal;
  if (tone === 'low') return '#ef9d47';
  if (tone === 'medium') return '#e8c75f';
  if (tone === 'high') return '#62cd88';
  if (tone === 'essential') return '#a58dff';
  if (tone === 'decommissioned') return LCARS.decommissioned;
  return LCARS.textDim;
};

const batchToneAccent = (tone) => {
  return toneColor(tone === 'muted' ? 'textDim' : tone);
};

const withAlpha = (hex, alpha = 'ff') => {
  const raw = String(hex || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return `${raw}${alpha}`;
  return 'rgba(127, 215, 255, 0.24)';
};

const panelBase = css`
  border: 1px solid ${LCARS.line};
  border-radius: 14px;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.25),
    0 8px 24px rgba(0, 0, 0, 0.24);
`;

const controlField = css`
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  background: rgba(9, 14, 20, 0.96);
  color: ${LCARS.text};
  min-height: 30px;
  padding: 0.32rem 0.48rem;
  font-size: 0.78rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: 0.02em;
  outline: none;
  transition:
    border-color 130ms ease,
    box-shadow 130ms ease,
    background 130ms ease;

  &:focus {
    border-color: rgba(127, 215, 255, 0.76);
    box-shadow: 0 0 0 1px rgba(127, 215, 255, 0.34);
    background: rgba(12, 20, 28, 0.98);
  }
`;

export const PageShell = styled.section`
  display: grid;
  gap: 0.78rem;
  color: ${LCARS.text};
`;

export const HeaderPanel = styled.header`
  ${panelBase};
  display: grid;
  gap: 0.42rem;
  padding: 0.66rem 0.72rem 0.72rem;
  border-radius: 10px;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.02),
    0 1px 0 rgba(0, 0, 0, 0.36),
    0 6px 16px rgba(0, 0, 0, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.01) 24%, transparent 62%),
    linear-gradient(180deg, #10151a 0%, #0d1216 100%);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.34rem;
    padding: 0.5rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.44rem;
`;

export const TitlePip = styled.span`
  width: 7px;
  height: 20px;
  border-radius: 2px;
  background: ${LCARS.teal};
  box-shadow: 0 0 0 1px rgba(76, 198, 193, 0.36) inset;
`;

export const Title = styled.h2`
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(0.94rem, 2vw, 1.06rem);
  font-weight: 900;
  letter-spacing: 0.11em;
  color: rgba(230, 237, 243, 0.96);
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
    letter-spacing: 0.065em;
  }
`;

export const TelemetryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.28rem;
  padding: 0.26rem 0.02rem 0.3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.055em;
  color: ${LCARS.textDim};
`;

export const TelemetryValue = styled.span`
  color: ${({ $tone = 'text' }) =>
    $tone === 'total'
      ? LCARS.root
      : $tone === 'active'
        ? LCARS.teal
        : $tone === 'gone'
          ? LCARS.coral
          : $tone === 'orphaned'
            ? LCARS.amber
            : LCARS.textDim};
`;

export const Sep = styled.span`
  color: rgba(230, 237, 243, 0.35);
`;

export const ControlsRow = styled.div`
  display: grid;
  grid-template-columns:
    minmax(210px, 1.6fr)
    minmax(170px, 1fr)
    minmax(170px, 1fr)
    minmax(170px, 1fr)
    minmax(150px, 0.9fr);
  gap: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)),
    rgba(12, 17, 23, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

export const ControlsToggleRow = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 0.08rem 0 0;
`;

export const BulkRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  justify-content: space-between;
  gap: 0.4rem;
  padding: 0.42rem 0.02rem 0.04rem;
  border-top: 1px solid rgba(127, 215, 255, 0.26);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const BulkMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.28rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  color: ${LCARS.textDim};
`;

export const BulkPill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 3px;
  padding: 0.12rem 0.38rem;
  border: 1px solid
    ${({ $tone = 'default' }) =>
      $tone === 'active'
        ? 'rgba(76, 198, 193, 0.52)'
        : $tone === 'selected'
          ? 'rgba(127, 215, 255, 0.58)'
          : 'rgba(232, 177, 92, 0.46)'};
  background:
    ${({ $tone = 'default' }) =>
      $tone === 'active'
        ? 'rgba(76, 198, 193, 0.14)'
        : $tone === 'selected'
          ? 'rgba(127, 215, 255, 0.18)'
          : 'rgba(232, 177, 92, 0.16)'};
  color:
    ${({ $tone = 'default' }) =>
      $tone === 'active'
        ? '#bfe8e3'
        : $tone === 'selected'
          ? '#d6f2ff'
          : '#f5d49d'};
  text-transform: uppercase;
  font-size: 0.64rem;
  font-weight: 760;
  letter-spacing: 0.08em;
`;

export const BulkActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem;
  align-items: center;
`;

export const ToolbarButton = styled.button`
  min-height: 29px;
  border-radius: 4px;
  border: 1px solid
    ${({ $tone = 'default' }) =>
      $tone === 'primary'
        ? 'rgba(100, 188, 151, 0.82)'
        : $tone === 'ghost'
          ? 'rgba(102, 167, 212, 0.46)'
        : $tone === 'warning'
          ? 'rgba(201, 163, 97, 0.7)'
          : 'rgba(102, 167, 212, 0.75)'};
  background:
    ${({ $tone = 'default' }) =>
      $tone === 'primary'
        ? 'linear-gradient(180deg, rgba(20, 67, 54, 0.98) 0%, rgba(14, 44, 37, 0.98) 100%)'
        : $tone === 'ghost'
          ? 'rgba(14, 24, 34, 0.95)'
        : $tone === 'warning'
          ? 'linear-gradient(180deg, rgba(84, 55, 14, 0.96) 0%, rgba(57, 39, 13, 0.96) 100%)'
          : 'linear-gradient(180deg, rgba(26, 60, 83, 0.96) 0%, rgba(17, 43, 62, 0.96) 100%)'};
  color: ${({ $tone = 'default' }) => ($tone === 'ghost' ? '#cfefff' : '#e8fff5')};
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.085em;
  padding: 0 0.52rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;

  &:hover {
    border-color: rgba(127, 215, 255, 0.72);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.5);
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

export const HeaderModeButton = styled(ToolbarButton)`
  margin-left: auto;

  & + & {
    margin-left: 0;
  }
`;

export const ControlsToggleButton = styled(ToolbarButton)`
  min-height: 27px;
`;

export const ControlGroup = styled.label`
  display: grid;
  align-content: start;
  gap: 0.18rem;
  padding: 0.36rem 0.48rem 0.42rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 0;
  overflow: hidden;
  background:
    linear-gradient(
      96deg,
      ${({ $tone = LCARS.root }) => `${$tone}16`} 0%,
      transparent 36%
    ),
    rgba(0, 0, 0, 0);

  &:last-child {
    border-right: 0;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.32rem 0.38rem 0.38rem;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    &:last-child {
      border-bottom: 0;
    }
    gap: 0.18rem;
  }
`;

export const ControlLabel = styled.span`
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: rgba(230, 237, 243, 0.64);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.08em;
  }
`;

export const Select = styled.select`
  ${controlField};
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, ${LCARS.textDim} 50%),
    linear-gradient(135deg, ${LCARS.textDim} 50%, transparent 50%);
  background-position:
    calc(100% - 16px) calc(50% - 2px),
    calc(100% - 11px) calc(50% - 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 1.8rem;
  border-color: rgba(255, 255, 255, 0.18);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 31px;
    font-size: ${MOBILE_FONT_SM};
    padding: 0.28rem 1.6rem 0.28rem 0.44rem;
  }
`;

export const SearchInput = styled.input`
  ${controlField};

  &::placeholder {
    color: rgba(230, 237, 243, 0.42);
  }
`;

export const ContentPanel = styled.section`
  ${panelBase};
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 40%),
    ${LCARS.panel};
  overflow: hidden;
`;

export const BatchSelectionPanel = styled.section`
  ${panelBase};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
  padding: 0.72rem 0.88rem;
  background:
    radial-gradient(circle at 8% 20%, rgba(127, 215, 255, 0.12) 0%, transparent 34%),
    linear-gradient(180deg, rgba(19, 25, 30, 0.96) 0%, rgba(14, 19, 24, 0.98) 100%);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.58rem 0.62rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const BatchSelectionSummary = styled.div`
  display: grid;
  gap: 0.18rem;
`;

export const BatchSelectionTitle = styled.h3`
  margin: 0;
  font-size: 0.78rem;
  font-weight: 860;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${LCARS.root};
`;

export const BatchSelectionText = styled.div`
  color: ${LCARS.textDim};
  font-size: 0.8rem;
  line-height: 1.35;
`;

export const BatchSelectionActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.44rem;
  align-items: center;
`;

export const ItemSelectionControls = styled.div`
  flex: 1 1 520px;
  display: grid;
  gap: 0.5rem;
`;

export const SelectionControlCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 760px) {
    justify-content: flex-start;
  }
`;

export const SelectionBatchCluster = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 0.38rem;
  align-items: end;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

export const SelectionSelectLabel = styled.label`
  display: grid;
  gap: 0.18rem;
  min-width: 0;

  > span {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(230, 237, 243, 0.64);
  }
`;

export const SelectionDestinationCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 760px) {
    justify-content: flex-start;
  }
`;

export const SelectionDestinationText = styled.div`
  min-width: min(100%, 220px);
  color: ${LCARS.textDim};
  font-size: 0.78rem;
  line-height: 1.35;

  strong {
    color: ${LCARS.text};
    font-weight: 780;
  }
`;

export const SelectionBoxPicker = styled.div`
  max-height: min(520px, 68vh);
  overflow: auto;
  padding: 0.42rem;
  border: 1px solid rgba(127, 215, 255, 0.18);
  border-radius: 8px;
  background: rgba(8, 13, 19, 0.72);
`;

export const SelectionDeclutterPanel = styled.div`
  display: grid;
  gap: 0.5rem;
  padding: 0.56rem;
  border: 1px solid rgba(167, 182, 255, 0.24);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(167, 182, 255, 0.12), transparent 44%),
    rgba(8, 13, 19, 0.62);
`;

export const SelectionDeclutterHeader = styled.div`
  display: grid;
  gap: 0.16rem;
`;

export const SelectionDeclutterTitle = styled.h4`
  margin: 0;
  color: ${LCARS.lilac};
  font-size: 0.72rem;
  font-weight: 860;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const SelectionDeclutterText = styled.div`
  color: ${LCARS.textDim};
  font-size: 0.78rem;
  line-height: 1.35;
`;

export const SelectionDeclutterError = styled.div`
  color: #ffd3cf;
  font-size: 0.76rem;
  line-height: 1.35;
`;

export const BatchActionButton = styled.button`
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid
    ${({ $tone = 'primary' }) =>
      $tone === 'ghost'
        ? 'rgba(102, 167, 212, 0.46)'
        : 'rgba(100, 188, 151, 0.82)'};
  background:
    ${({ $tone = 'primary' }) =>
      $tone === 'ghost'
        ? 'rgba(15, 24, 33, 0.94)'
        : 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'};
  color: ${({ $tone = 'primary' }) => ($tone === 'ghost' ? '#cfefff' : '#e8fff5')};
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 0.76rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

export const DesktopWrap = styled.div`
  display: block;

  @media (max-width: ${TABLE_STACK_BREAKPOINT}) {
    display: none;
  }
`;

export const MobileWrap = styled.div`
  display: none;

  @media (max-width: ${TABLE_STACK_BREAKPOINT}) {
    display: block;
  }
`;

export const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const BatchSectionsDesktop = styled.div`
  display: grid;
  gap: 0.88rem;
  padding: 0.88rem;
`;

export const BatchTableSection = styled.section`
  ${panelBase};
  overflow: hidden;
  border-color: ${({ $tone = 'root' }) => `${batchToneAccent($tone)}46`};
  box-shadow:
    inset 3px 0 0 ${({ $tone = 'root' }) => batchToneAccent($tone)},
    ${({ $selected, $tone = 'root' }) =>
      $selected
        ? `0 0 0 1px ${batchToneAccent($tone)}55, 0 8px 24px rgba(0, 0, 0, 0.24)`
        : '0 1px 0 rgba(0, 0, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.24)'};
  background:
    linear-gradient(90deg, ${({ $tone = 'root' }) => `${batchToneAccent($tone)}12`} 0%, transparent 28%),
    ${LCARS.panel};
`;

export const BatchGroupHeader = styled.div`
  display: grid;
  gap: 0.4rem;
  padding: 0.76rem 0.86rem 0.72rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0));
`;

export const BatchGroupTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.42rem;
`;

export const BatchGroupTitle = styled.h3`
  margin: 0;
  font-size: 0.84rem;
  font-weight: 860;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${LCARS.text};
`;

export const BatchGroupCount = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.14rem 0.46rem;
  border: 1px solid rgba(127, 215, 255, 0.28);
  background: rgba(127, 215, 255, 0.1);
  color: ${LCARS.textDim};
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const BatchGroupMeta = styled.div`
  display: grid;
  gap: 0.16rem;
`;

export const BatchGroupMetaLine = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.74rem;
  line-height: 1.3;
`;

export const BatchGroupActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem;
  align-items: center;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${LCARS.text};
  min-width: 900px;
`;

export const TH = styled.th`
  text-align: left;
  padding: 0.66rem 0.7rem;
  font-size: 0.68rem;
  font-weight: 820;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${LCARS.textDim};
  border-bottom: 1px solid ${LCARS.lineStrong};
  white-space: nowrap;
`;

export const RowHeaderTH = styled(TH)`
  padding: 0.52rem 0.72rem;
`;

export const SelectionTH = styled(TH)`
  width: 56px;
  text-align: center;
`;

export const TR = styled.tr`
  cursor: ${({ $interactive = true }) => ($interactive ? 'pointer' : 'default')};
  transition:
    background 120ms ease,
    box-shadow 120ms ease;
  background:
    ${({ $selected, $batchFocused, $batchTone, $accentActive, $accentColor }) =>
      $selected
        ? 'rgba(76, 198, 193, 0.12)'
        : $accentActive && $accentColor
          ? `linear-gradient(90deg, ${withAlpha($accentColor, '10')} 0%, transparent 26%)`
        : $batchFocused && $batchTone
          ? `linear-gradient(90deg, ${batchToneAccent($batchTone)}20 0%, rgba(12, 15, 17, 0) 38%)`
          : 'transparent'};
  box-shadow:
    ${({ $selected, $batchFocused, $batchTone }) =>
      $selected
        ? 'inset 0 0 0 1px rgba(100, 188, 151, 0.38)'
        : $batchFocused && $batchTone
          ? `inset 0 1px 0 ${batchToneAccent($batchTone)}22`
          : 'none'};

  &:hover {
    background:
      ${({ $selected, $batchFocused, $batchTone }) =>
        $selected
          ? 'rgba(76, 198, 193, 0.16)'
          : $batchFocused && $batchTone
            ? `linear-gradient(90deg, ${batchToneAccent($batchTone)}2b 0%, rgba(127, 215, 255, 0.05) 44%)`
            : 'rgba(127, 215, 255, 0.08)'};
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.56);
    outline-offset: -2px;
  }
`;

export const SelectionTD = styled.td`
  width: 56px;
  text-align: center;
  vertical-align: middle;
  padding: 0.66rem 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

export const SelectionCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: #69c39f;
`;

export const TD = styled.td`
  padding: 0.66rem 0.7rem;
  vertical-align: top;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: ${({ $muted }) => ($muted ? LCARS.textDim : LCARS.text)};

  &:first-child {
    box-shadow:
      ${({ $accentActive, $accentColor, $batchFocused, $batchTone }) =>
        $accentActive && $accentColor
          ? `inset 2px 0 0 ${withAlpha($accentColor, 'cf')}`
          : $batchFocused && $batchTone
            ? `inset 3px 0 0 ${batchToneAccent($batchTone)}`
            : 'none'};
  }
`;

export const OperatorRowGrid = styled.div`
  display: grid;
  grid-template-columns:
    minmax(72px, 84px)
    minmax(190px, 2.3fr)
    minmax(54px, 0.58fr)
    minmax(180px, 1.4fr)
    minmax(180px, 1.35fr)
    minmax(180px, 1.45fr);
  align-items: center;
  gap: 0.54rem;
  min-width: 980px;
`;

export const OperatorHeaderCell = styled.div`
  font-size: 0.63rem;
  font-weight: 780;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${LCARS.textDim};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const OperatorThumbCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.32rem;
`;

export const ThumbPlaceholder = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid rgba(127, 215, 255, 0.2);
  background: rgba(11, 18, 24, 0.92);
  color: ${LCARS.textMuted};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const OperatorItemCell = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.18rem;
`;

export const OperatorItemNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
`;

export const CompactMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 0.62rem;
  row-gap: 0.12rem;
`;

export const OperatorQtyCell = styled.div`
  font-size: 0.82rem;
  font-weight: 760;
  color: ${LCARS.text};
  font-variant-numeric: tabular-nums;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const OperatorMetaCell = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.14rem;
`;

export const CompactMetaEntry = styled.div`
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 0.32rem;
`;

export const CompactLabel = styled.span`
  flex: 0 0 auto;
  color: ${LCARS.textMuted};
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const CompactValue = styled.span`
  min-width: 0;
  color: ${({ $accent, $accentColor }) => ($accent && $accentColor ? withAlpha($accentColor, 'f0') : LCARS.text)};
  font-size: 0.76rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CompactSubValue = styled.span`
  min-width: 0;
  color: ${LCARS.textMuted};
  font-size: 0.72rem;
  line-height: 1.24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CompactLink = styled(Link)`
  min-width: 0;
  color: ${({ $accent, $accentColor }) => ($accent && $accentColor ? withAlpha($accentColor, 'f0') : LCARS.root)};
  font-size: 0.76rem;
  line-height: 1.3;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.88);
    text-underline-offset: 2px;
  }
`;

export const CompactActionButton = styled.button`
  min-width: 0;
  border: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  color: ${({ $accent, $accentColor }) => ($accent && $accentColor ? withAlpha($accentColor, 'f0') : LCARS.root)};
  font-size: 0.76rem;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.88);
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.5);
    outline-offset: 1px;
    border-radius: 3px;
  }
`;

export const ItemCellLayout = styled.div`
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: start;
  gap: 0.56rem;
  min-width: 0;
`;

export const ItemSelectionToggle = styled.button`
  width: 24px;
  height: 24px;
  margin-top: 0.08rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $selected, $accentActive, $accentColor }) =>
      $accentActive && $accentColor
        ? withAlpha($accentColor, $selected ? 'd0' : '88')
        : $selected
          ? 'rgba(100, 188, 151, 0.82)'
          : 'rgba(102, 167, 212, 0.52)'};
  background:
    ${({ $selected, $accentActive, $accentColor }) =>
      $accentActive && $accentColor && !$selected
        ? `linear-gradient(180deg, ${withAlpha($accentColor, '1a')} 0%, rgba(10, 18, 26, 0.9) 100%)`
        : $selected
          ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
          : 'rgba(10, 18, 26, 0.9)'};
  color: #e8fff5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    border-color 120ms ease,
    background 120ms ease;

  &:hover {
    border-color: ${({ $selected }) =>
      $selected ? 'rgba(100, 188, 151, 0.92)' : 'rgba(127, 215, 255, 0.72)'};
    box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.12);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.52);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.48;
    box-shadow: none;
  }

  &:disabled:hover {
    border-color: rgba(102, 167, 212, 0.52);
    box-shadow: none;
  }
`;

export const ItemThumbFrame = styled.div`
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid
    ${({ $accentActive, $accentColor }) =>
      $accentActive && $accentColor ? withAlpha($accentColor, '64') : 'rgba(127, 215, 255, 0.2)'};
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(8, 13, 19, 0.9);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
`;

export const ItemThumbButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
  border-radius: 8px;

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.56);
    outline-offset: 2px;
  }
`;

export const ItemThumbImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`;

export const ItemCellBody = styled.div`
  min-width: 0;
`;

export const NameLink = styled(Link)`
  color: ${LCARS.text};
  font-size: 0.95rem;
  font-weight: 720;
  text-decoration: none;
  line-height: 1.15;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.9);
    text-underline-offset: 2px;
  }
`;

export const NameText = styled.span`
  color: ${LCARS.text};
  font-size: 0.95rem;
  font-weight: 720;
  line-height: 1.15;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NameRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  min-width: 0;
`;

export const ItemOpenButton = styled.button`
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  margin-top: -0.08rem;
  border-radius: 999px;
  border: 1px solid rgba(127, 215, 255, 0.42);
  background: rgba(14, 24, 35, 0.94);
  color: #cfefff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;

  &:hover {
    border-color: rgba(127, 215, 255, 0.74);
    box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.12);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.52);
    outline-offset: 1px;
  }
`;

export const NameMeta = styled.div`
  margin-top: 0.18rem;
  font-size: 0.72rem;
  color: ${LCARS.textMuted};
  line-height: 1.2;
`;

export const MetaBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.24rem;
`;

export const KeepPriorityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.12rem 0.48rem;
  border: 1px solid ${({ $tone }) => `${toneColor($tone)}88`};
  background: ${({ $tone }) => `${toneColor($tone)}2a`};
  color: ${({ $tone }) => toneColor($tone)};
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const SourceBatchBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.12rem 0.48rem;
  border: 1px solid ${({ $archived }) => ($archived ? 'rgba(232, 177, 92, 0.52)' : 'rgba(127, 215, 255, 0.52)')};
  background: ${({ $archived }) => ($archived ? 'rgba(232, 177, 92, 0.16)' : 'rgba(127, 215, 255, 0.16)')};
  color: ${({ $archived }) => ($archived ? '#f5d49d' : '#cfefff')};
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const SourceBatchLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.12rem 0.48rem;
  border: 1px solid ${({ $archived }) => ($archived ? 'rgba(232, 177, 92, 0.52)' : 'rgba(127, 215, 255, 0.52)')};
  background: ${({ $archived }) => ($archived ? 'rgba(232, 177, 92, 0.16)' : 'rgba(127, 215, 255, 0.16)')};
  color: ${({ $archived }) => ($archived ? '#f5d49d' : '#cfefff')};
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-underline-offset: 2px;
  }
`;

export const BatchFocusChip = styled.button`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.12rem 0.48rem;
  border: 1px solid ${({ $archived }) => ($archived ? 'rgba(232, 177, 92, 0.52)' : 'rgba(127, 215, 255, 0.52)')};
  background: ${({ $archived }) => ($archived ? 'rgba(232, 177, 92, 0.16)' : 'rgba(127, 215, 255, 0.16)')};
  color: ${({ $archived }) => ($archived ? '#f5d49d' : '#cfefff')};
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    background 120ms ease,
    transform 120ms ease;

  &:hover {
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-underline-offset: 2px;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.5);
    outline-offset: 1px;
  }
`;

export const BatchCellStack = styled.div`
  display: grid;
  gap: 0.14rem;
`;

export const BatchInlineActions = styled.div`
  margin-top: 0.24rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`;

export const BatchSelectButton = styled.button`
  min-height: 28px;
  border-radius: 999px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'rgba(100, 188, 151, 0.82)' : 'rgba(102, 167, 212, 0.56)'};
  background:
    ${({ $selected }) =>
      $selected
        ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
        : 'rgba(13, 24, 34, 0.92)'};
  color: ${({ $selected }) => ($selected ? '#e8fff5' : '#cfefff')};
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 0.62rem;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;

  &:hover {
    box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.12);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.48;
    box-shadow: none;
  }

  &:disabled:hover {
    box-shadow: none;
  }
`;

export const QtyPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2ch;
  color: ${LCARS.text};
  font-size: 0.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

export const Category = styled.div`
  font-size: 0.85rem;
  color: ${LCARS.text};
`;

export const Subtle = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.75rem;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.32rem;
`;

export const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.16rem 0.48rem;
  border: 1px solid rgba(76, 198, 193, 0.42);
  background: rgba(76, 198, 193, 0.16);
  color: #c9f2ee;
  font-size: 0.71rem;
  line-height: 1;
`;

export const OverflowTag = styled(TagChip)`
  border-color: rgba(167, 182, 255, 0.42);
  background: rgba(167, 182, 255, 0.16);
  color: #e2e8ff;
`;

export const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
`;

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.17rem 0.52rem;
  border: 1px solid ${({ $tone }) => `${toneColor($tone)}70`};
  background: ${({ $tone }) => `${toneColor($tone)}20`};
  color: ${({ $tone }) => toneColor($tone)};
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const LifecycleText = styled.div`
  margin-top: 0.32rem;
  font-size: 0.76rem;
  color: ${LCARS.textDim};
`;

export const NotesPreview = styled.div`
  margin-top: 0.3rem;
  font-size: 0.75rem;
  line-height: 1.33;
  color: rgba(230, 237, 243, 0.8);
  max-width: 29ch;
`;

export const NotesFlag = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.1rem 0.42rem;
  border: 1px solid rgba(232, 177, 92, 0.46);
  background: rgba(232, 177, 92, 0.16);
  color: #f8d7a0;
  font-size: 0.66rem;
  font-weight: 720;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const BoxLink = styled(Link)`
  color: ${LCARS.root};
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 660;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.88);
    text-underline-offset: 2px;
  }
`;

export const BoxLabel = styled.span`
  color: ${LCARS.text};
  font-size: 0.86rem;
`;

export const ContextLine = styled.div`
  margin-top: 0.25rem;
  color: ${LCARS.textMuted};
  font-size: 0.74rem;
  line-height: 1.3;
`;

export const EmptyState = styled.div`
  padding: 1rem;
  color: ${LCARS.textDim};
  font-size: 0.9rem;
`;

export const ErrorState = styled.div`
  ${panelBase};
  padding: 0.82rem 0.9rem;
  color: #ffd6d2;
  border-color: rgba(240, 138, 123, 0.35);
  background: rgba(94, 35, 41, 0.32);
`;

export const MobileList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.48rem;
`;

export const BatchSectionsMobile = styled.div`
  display: grid;
  gap: 0.72rem;
  padding: 0.62rem;
`;

export const MobileBatchSection = styled.section`
  ${panelBase};
  overflow: hidden;
  border-color: ${({ $tone = 'root' }) => `${batchToneAccent($tone)}46`};
  box-shadow:
    inset 3px 0 0 ${({ $tone = 'root' }) => batchToneAccent($tone)},
    ${({ $selected, $tone = 'root' }) =>
      $selected
        ? `0 0 0 1px ${batchToneAccent($tone)}55, 0 8px 24px rgba(0, 0, 0, 0.24)`
        : '0 1px 0 rgba(0, 0, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.24)'};
  background:
    linear-gradient(90deg, ${({ $tone = 'root' }) => `${batchToneAccent($tone)}14`} 0%, transparent 44%),
    ${LCARS.panel};
`;

export const MobileBatchSectionHeader = styled.div`
  display: grid;
  gap: 0.34rem;
  padding: 0.62rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0));
`;

export const MobileCard = styled.li`
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background:
    ${({ $selected, $batchFocused, $batchTone, $unavailable }) =>
      $selected
        ? 'rgba(76, 198, 193, 0.1)'
        : $unavailable
          ? 'linear-gradient(180deg, rgba(80, 48, 52, 0.42) 0%, rgba(42, 35, 39, 0.5) 100%)'
        : $batchFocused && $batchTone
          ? `linear-gradient(90deg, ${batchToneAccent($batchTone)}22 0%, transparent 54%)`
          : 'transparent'};
  box-shadow:
    ${({ $selected, $batchFocused, $batchTone, $accentActive, $accentColor, $unavailable }) =>
      $selected
        ? 'inset 0 0 0 1px rgba(100, 188, 151, 0.34)'
        : $unavailable
          ? 'inset 2px 0 0 rgba(171, 109, 116, 0.82)'
        : $accentActive && $accentColor
          ? `inset 2px 0 0 ${withAlpha($accentColor, 'b8')}`
        : $batchFocused && $batchTone
          ? `inset 3px 0 0 ${batchToneAccent($batchTone)}`
          : 'none'};

  &:last-child {
    border-bottom: none;
  }
`;

export const MobileCardSurface = styled.div`
  width: 100%;
  margin: 0;
  padding: 0.56rem 0.62rem 0.6rem;
  display: grid;
  gap: 0.38rem;
  background: transparent;
  color: ${({ $unavailable }) => ($unavailable ? 'rgba(230, 237, 243, 0.8)' : 'inherit')};
  text-align: left;
  cursor: ${({ $interactive = true }) => ($interactive ? 'pointer' : 'default')};

  &:hover {
    background: ${({ $selected }) =>
      $selected ? 'rgba(76, 198, 193, 0.12)' : 'rgba(127, 215, 255, 0.09)'};
  }

  ${({ $unavailable }) =>
    $unavailable
      ? `
    opacity: 0.82;
  `
      : ''}

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.56);
    outline-offset: -2px;
  }

  &[aria-disabled='true'] {
    cursor: default;
    opacity: 0.88;
  }

  &[aria-disabled='true']:hover {
    background: transparent;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.5rem;
  }
`;

export const MobileTop = styled.div`
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.35rem;
`;

export const MobileSelectionToggle = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid
    ${({ $selected, $accentActive, $accentColor, disabled }) =>
      disabled
        ? 'rgba(171, 109, 116, 0.58)'
      :
      $accentActive && $accentColor
        ? withAlpha($accentColor, $selected ? 'd0' : '88')
        : $selected
          ? 'rgba(100, 188, 151, 0.82)'
          : 'rgba(102, 167, 212, 0.6)'};
  background:
    ${({ $selected, $accentActive, $accentColor, disabled }) =>
      disabled
        ? 'linear-gradient(180deg, rgba(73, 47, 51, 0.96) 0%, rgba(49, 37, 40, 0.96) 100%)'
      :
      $accentActive && $accentColor && !$selected
        ? `linear-gradient(180deg, ${withAlpha($accentColor, '1a')} 0%, rgba(15, 28, 40, 0.9) 100%)`
        : $selected
          ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
          : 'rgba(15, 28, 40, 0.9)'};
  color: ${({ $selected, disabled }) => (disabled ? 'rgba(241, 215, 218, 0.86)' : $selected ? '#e8fff5' : '#cfefff')};
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;

  &:hover {
    box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.12);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.52);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.48;
    box-shadow: none;
  }

  &:disabled:hover {
    box-shadow: none;
  }
`;

export const MobileNameBlock = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.1rem;
`;

export const MobileNameLink = styled(Link)`
  color: ${LCARS.text};
  font-size: 0.92rem;
  font-weight: 720;
  text-decoration: none;
  line-height: 1.25;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.9);
    text-underline-offset: 2px;
  }
`;

export const MobileNameText = styled.span`
  color: ${LCARS.text};
  font-size: 0.92rem;
  font-weight: 720;
  line-height: 1.25;
  overflow-wrap: anywhere;
`;

export const MobileThumbFrame = styled.div`
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid
    ${({ $accentActive, $accentColor }) =>
      $accentActive && $accentColor ? withAlpha($accentColor, '72') : 'rgba(127, 215, 255, 0.22)'};
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(8, 13, 19, 0.9);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
`;

export const MobileThumbButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
  border-radius: 8px;

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.56);
    outline-offset: 2px;
  }
`;

export const MobileThumbImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`;

export const MobileThumbPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${LCARS.textMuted};
  font-size: 0.72rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const MobileQty = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 2ch;
  color: ${LCARS.text};
  font-size: 0.88rem;
  font-weight: 720;
  font-variant-numeric: tabular-nums;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const MobileFacts = styled.div`
  display: grid;
  gap: 0.24rem;
`;

export const MobileBatchBlock = styled.div`
  display: grid;
  gap: 0.22rem;
  padding: 0.44rem 0.52rem;
  border-radius: 10px;
  border: 1px solid ${({ $tone }) => `${batchToneAccent($tone)}52`};
  background: ${({ $tone }) => `${batchToneAccent($tone)}14`};
`;

export const MobileBatchLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.42rem;
`;

export const MobileBatchLabel = styled.div`
  color: ${LCARS.text};
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.3;
`;

export const MobileLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem;
  align-items: center;
  color: ${LCARS.textDim};
  font-size: ${MOBILE_FONT_SM};
`;

export const MobileMetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.26rem;
  min-width: 0;
  color: ${LCARS.textDim};
  font-size: ${MOBILE_FONT_SM};
  line-height: 1.28;
`;

export const MobileMetaLabel = styled.span`
  flex: 0 0 auto;
  color: ${LCARS.textMuted};
  font-size: 0.66rem;
  letter-spacing: 0.05em;
  text-transform: lowercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const MobileMetaValue = styled.span`
  min-width: 0;
  color: ${({ $accent, $accentColor }) => ($accent && $accentColor ? withAlpha($accentColor, 'f0') : LCARS.textDim)};
  font-size: 0.76rem;
  line-height: 1.28;
  overflow-wrap: anywhere;
`;

export const MobileMetaSubValue = styled.span`
  min-width: 0;
  color: ${LCARS.textMuted};
  font-size: 0.72rem;
  line-height: 1.24;
  overflow-wrap: anywhere;
`;

export const MobileMetaLink = styled(Link)`
  min-width: 0;
  color: ${({ $accent, $accentColor }) => ($accent && $accentColor ? withAlpha($accentColor, 'f0') : LCARS.root)};
  font-size: 0.76rem;
  line-height: 1.28;
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.88);
    text-underline-offset: 2px;
  }
`;

export const MobileMetaAction = styled.button`
  min-width: 0;
  border: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  color: ${({ $accent, $accentColor }) => ($accent && $accentColor ? withAlpha($accentColor, 'f0') : LCARS.root)};
  font-size: 0.76rem;
  line-height: 1.28;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.88);
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.5);
    outline-offset: 1px;
    border-radius: 3px;
  }
`;

export const MobileNotes = styled.div`
  color: rgba(230, 237, 243, 0.82);
  font-size: ${MOBILE_FONT_SM};
  line-height: 1.35;
`;
