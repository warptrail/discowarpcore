import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

const LCARS = {
  bg: '#090d13',
  panel: '#101821',
  panelAlt: '#162330',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  line: 'rgba(104, 154, 186, 0.34)',
  teal: '#4CC6C1',
  lilac: '#A7B6FF',
  amber: '#E8B15C',
  lime: '#9BE564',
  root: '#7FD7FF',
};

const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;

const panelBase = css`
  border: 1px solid ${LCARS.line};
  border-radius: 14px;
  box-shadow:
    inset 0 0 0 1px rgba(127, 215, 255, 0.08),
    0 12px 30px rgba(2, 9, 16, 0.55),
    0 0 16px rgba(76, 198, 193, 0.08);
`;

export const HeaderShell = styled.section`
  ${panelBase};
  display: grid;
  gap: 0.74rem;
  padding: 0.88rem 0.92rem 0.94rem;
  border-color: ${toneAlpha(LCARS.root, '60')};
  background:
    radial-gradient(circle at 95% 10%, ${toneAlpha(LCARS.root, '24')} 0%, transparent 42%),
    linear-gradient(180deg, #0f1822 0%, #0b121a 100%);
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

export const TitlePip = styled.span`
  width: 9px;
  height: 26px;
  border-radius: 8px;
  background: ${LCARS.teal};
  box-shadow: 0 0 0 2px ${toneAlpha(LCARS.teal, '2f')} inset;
`;

export const Title = styled.h2`
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(1.02rem, 2.3vw, 1.22rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  color: ${toneAlpha(LCARS.text, 'f2')};
`;

export const TelemetryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  color: ${LCARS.textDim};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.8rem;
  letter-spacing: 0.045em;
`;

export const TelemetryValue = styled.span`
  color: ${({ $tone }) =>
    $tone === 'boxes'
      ? toneAlpha(LCARS.root, 'ee')
      : $tone === 'items'
        ? toneAlpha(LCARS.amber, 'ee')
        : toneAlpha(LCARS.lilac, 'ee')};
`;

export const Sep = styled.span`
  color: ${toneAlpha(LCARS.textDim, '9f')};
`;

export const SearchSortRow = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 5fr) minmax(0, 4fr) minmax(0, 3fr);
  gap: 0.55rem;

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const FilterRow = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));
  gap: 0.55rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const UtilityRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 30px;
  margin-top: -0.08rem;
`;

export const OrphanToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, '9e') : toneAlpha(LCARS.root, '6e')};
  border-radius: 9px;
  min-height: 28px;
  padding: 0 0.72rem;
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ $active }) => ($active ? '#d9fffa' : '#d7e4f1')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(23, 63, 59, 0.92), rgba(15, 43, 40, 0.95))'
      : 'linear-gradient(180deg, rgba(11, 22, 34, 0.92), rgba(8, 17, 28, 0.95))'};
  box-shadow: inset 0 0 0 1px
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, '28') : toneAlpha(LCARS.root, '1d')};
  cursor: pointer;
  transition:
    border-color 140ms ease,
    color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease,
    transform 90ms ease;

  &:hover {
    border-color: ${({ $active }) =>
      $active ? toneAlpha(LCARS.lime, '88') : toneAlpha(LCARS.root, '9a')};
    color: ${({ $active }) => ($active ? '#edffd5' : '#eef5fc')};
    box-shadow:
      inset 0 0 0 1px
        ${({ $active }) =>
          $active ? toneAlpha(LCARS.lime, '2d') : toneAlpha(LCARS.root, '28')},
      0 0 12px
        ${({ $active }) =>
          $active ? toneAlpha(LCARS.lime, '1e') : toneAlpha(LCARS.root, '1b')};
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const ControlGroup = styled.label`
  ${panelBase};
  display: grid;
  min-width: 0;
  gap: 0.28rem;
  padding: 0.44rem 0.56rem 0.5rem;
  border-color: ${({ $tone = LCARS.root }) => toneAlpha($tone, '66')};
  box-shadow:
    inset 0 0 0 1px ${({ $tone = LCARS.root }) => toneAlpha($tone, '20')},
    0 10px 24px rgba(2, 9, 16, 0.52),
    0 0 14px ${({ $tone = LCARS.root }) => toneAlpha($tone, '18')};
  background:
    linear-gradient(
      94deg,
      ${({ $tone = LCARS.root }) => toneAlpha($tone, '1d')} 0%,
      transparent 58%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 70%),
    ${LCARS.panel};
`;

export const ControlLabel = styled.span`
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${toneAlpha(LCARS.root, 'cc')};
`;

const controlField = css`
  width: 100%;
  min-width: 0;
  max-width: 100%;
  border: 1px solid rgba(108, 156, 188, 0.5);
  border-radius: 9px;
  background: linear-gradient(180deg, rgba(6, 12, 19, 0.98), rgba(8, 15, 23, 0.98));
  color: ${toneAlpha(LCARS.text, 'f3')};
  min-height: 34px;
  padding: 0.46rem 0.62rem;
  font-size: 0.86rem;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(125, 185, 220, 0.08);
  transition:
    border-color 130ms ease,
    box-shadow 130ms ease,
    background 130ms ease;

  &:focus {
    border-color: ${toneAlpha(LCARS.root, 'd0')};
    box-shadow:
      0 0 0 2px ${toneAlpha(LCARS.root, '2f')},
      0 0 14px ${toneAlpha(LCARS.root, '30')};
    background: ${LCARS.panelAlt};
  }
`;

export const SearchInput = styled.input`
  ${controlField};
`;

export const LocatorWrap = styled.div`
  position: relative;
`;

export const LocatorDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.34rem);
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  gap: 0.2rem;
  padding: 0.36rem;
  border-radius: 11px;
  border: 1px solid ${toneAlpha(LCARS.lime, '7a')};
  background: linear-gradient(180deg, rgba(9, 16, 24, 0.99), rgba(8, 14, 20, 0.99));
  box-shadow:
    0 18px 30px rgba(2, 9, 16, 0.7),
    0 0 0 1px ${toneAlpha(LCARS.lime, '1f')} inset;
  max-height: min(280px, 46vh);
  overflow-y: auto;
`;

export const LocatorOption = styled.button`
  width: 100%;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.lime, '8f') : toneAlpha(LCARS.root, '6e')};
  border-radius: 9px;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(88, 132, 44, 0.24), rgba(57, 91, 27, 0.2))'
      : 'linear-gradient(180deg, rgba(15, 30, 45, 0.94), rgba(9, 18, 29, 0.96))'};
  color: ${toneAlpha(LCARS.text, 'f0')};
  display: grid;
  gap: 0.12rem;
  text-align: left;
  padding: 0.44rem 0.52rem;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    background 120ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.lime, '92')};
    background: linear-gradient(
      180deg,
      rgba(106, 157, 54, 0.24),
      rgba(65, 102, 34, 0.22)
    );
    box-shadow:
      0 0 0 1px ${toneAlpha(LCARS.lime, '2f')} inset,
      0 0 14px ${toneAlpha(LCARS.lime, '24')};
  }
`;

export const LocatorOptionMain = styled.span`
  font-size: 0.8rem;
  font-weight: 760;
  letter-spacing: 0.02em;
  color: ${toneAlpha(LCARS.text, 'ec')};
`;

export const LocatorOptionMeta = styled.span`
  font-size: 0.7rem;
  color: ${toneAlpha(LCARS.textDim, 'd0')};
`;

export const LocatorEmpty = styled.div`
  padding: 0.48rem 0.52rem;
  border-radius: 9px;
  border: 1px dashed ${toneAlpha(LCARS.line, 'cc')};
  color: ${toneAlpha(LCARS.textDim, 'd0')};
  font-size: 0.76rem;
`;

export const LocatorInspector = styled.section`
  margin-top: 0;
  border: 1px solid ${toneAlpha(LCARS.lime, '72')};
  border-radius: 11px;
  background:
    linear-gradient(
      100deg,
      ${toneAlpha(LCARS.lime, '17')} 0%,
      transparent 52%
    ),
    linear-gradient(180deg, rgba(8, 16, 23, 0.98), rgba(8, 14, 21, 0.98));
  box-shadow:
    inset 0 0 0 1px ${toneAlpha(LCARS.lime, '1f')},
    0 12px 22px rgba(2, 9, 16, 0.6);
  overflow: hidden;
`;

export const LocatorInspectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.46rem 0.55rem;
  border-bottom: 1px solid ${toneAlpha(LCARS.line, 'cc')};
`;

export const LocatorInspectorTitle = styled.div`
  min-width: 0;
`;

export const LocatorInspectorTitleLink = styled(Link)`
  color: ${toneAlpha(LCARS.lime, 'ef')};
  font-size: 0.8rem;
  font-weight: 780;
  letter-spacing: 0.02em;
  text-decoration: none;

  &:hover {
    color: ${toneAlpha(LCARS.text, 'f2')};
    text-decoration: underline;
  }
`;

export const LocatorInspectorClear = styled.button`
  border: 1px solid ${toneAlpha(LCARS.root, '72')};
  border-radius: 8px;
  min-height: 24px;
  padding: 0.16rem 0.42rem;
  font-size: 0.66rem;
  font-weight: 740;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${toneAlpha(LCARS.root, 'd8')};
  background: linear-gradient(180deg, rgba(11, 25, 37, 0.95), rgba(8, 17, 27, 0.95));
  box-shadow: inset 0 0 0 1px ${toneAlpha(LCARS.root, '22')};
  cursor: pointer;

  &:hover {
    border-color: ${toneAlpha(LCARS.lime, '7a')};
    color: ${toneAlpha(LCARS.lime, 'e8')};
    box-shadow:
      inset 0 0 0 1px ${toneAlpha(LCARS.lime, '26')},
      0 0 12px ${toneAlpha(LCARS.lime, '28')};
  }
`;

export const LocatorBreadcrumb = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
  align-items: center;
  padding: 0.32rem 0.55rem 0.4rem;
  border-bottom: 1px dashed ${toneAlpha(LCARS.line, 'b8')};
  font-size: 0.7rem;
`;

export const LocatorBreadcrumbLink = styled(Link)`
  color: ${toneAlpha(LCARS.textDim, 'dd')};
  text-decoration: none;

  &:hover {
    color: ${toneAlpha(LCARS.text, 'ef')};
    text-decoration: underline;
  }
`;

export const LocatorBreadcrumbCurrent = styled.span`
  color: ${toneAlpha(LCARS.lime, 'e8')};
  font-weight: 720;
`;

export const LocatorBreadcrumbSep = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'a0')};
`;

export const LocatorInspectorBody = styled.div`
  display: grid;
  gap: 0.3rem;
  padding: 0.5rem 0.55rem 0.55rem;
  max-height: min(320px, 42vh);
  overflow-y: auto;
`;

export const LocatorSection = styled.section`
  display: grid;
  gap: 0.26rem;
`;

export const LocatorSectionTitle = styled.h4`
  margin: 0;
  font-size: 0.64rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${toneAlpha(LCARS.textDim, 'd3')};
`;

export const LocatorList = styled.div`
  display: grid;
  gap: 0.2rem;
`;

export const LocatorRow = styled.div`
  border: 1px solid
    ${({ $kind = 'item' }) =>
      $kind === 'box'
        ? toneAlpha(LCARS.root, '68')
        : toneAlpha(LCARS.lime, '65')};
  border-radius: 8px;
  background: ${({ $kind = 'item' }) =>
    $kind === 'box'
      ? 'linear-gradient(180deg, rgba(16, 33, 48, 0.92), rgba(10, 19, 27, 0.92))'
      : 'linear-gradient(180deg, rgba(15, 30, 17, 0.92), rgba(10, 19, 12, 0.92))'};
`;

export const LocatorRowLink = styled(Link)`
  display: grid;
  gap: 0.1rem;
  text-decoration: none;
  padding: 0.34rem 0.45rem;
`;

export const LocatorRowTitle = styled.span`
  color: ${toneAlpha(LCARS.text, 'ef')};
  font-size: 0.78rem;
  font-weight: 710;
  line-height: 1.2;
`;

export const LocatorRowMeta = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'cd')};
  font-size: 0.67rem;
  line-height: 1.2;
`;

export const LocatorEmptyBlock = styled.div`
  border: 1px dashed ${toneAlpha(LCARS.line, 'c6')};
  border-radius: 8px;
  color: ${toneAlpha(LCARS.textDim, 'd2')};
  font-size: 0.74rem;
  padding: 0.38rem 0.45rem;
`;

export const LocatorStatusText = styled.div`
  color: ${toneAlpha(LCARS.textDim, 'dc')};
  font-size: 0.74rem;
  padding: 0.24rem 0.1rem;
`;

export const LocatorNotes = styled.div`
  border: 1px solid ${toneAlpha(LCARS.line, 'cc')};
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(12, 25, 34, 0.94), rgba(8, 18, 24, 0.94));
  color: ${toneAlpha(LCARS.text, 'e8')};
  font-size: 0.73rem;
  line-height: 1.45;
  padding: 0.36rem 0.45rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: min(120px, 24vh);
  overflow-y: auto;
`;

export const Select = styled.select`
  ${controlField};
  appearance: none;
  background-image:
    linear-gradient(
      45deg,
      transparent 50%,
      ${toneAlpha(LCARS.textDim, 'cc')} 50%
    ),
    linear-gradient(
      135deg,
      ${toneAlpha(LCARS.textDim, 'cc')} 50%,
      transparent 50%
    );
  background-position:
    calc(100% - 16px) calc(50% - 2px),
    calc(100% - 11px) calc(50% - 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 1.8rem;
`;

export const QuickActionsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  min-width: 0;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const QuickActionButton = styled.button`
  min-width: 0;
  min-height: 40px;
  border-radius: 11px;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, 'cf') : toneAlpha(LCARS.root, '6b')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(15, 53, 58, 0.95), rgba(10, 41, 47, 0.95))'
      : 'linear-gradient(180deg, rgba(14, 30, 44, 0.96), rgba(10, 22, 34, 0.96))'};
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, 'f2') : toneAlpha(LCARS.root, 'da')};
  font-size: 0.78rem;
  font-weight: 780;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    background 130ms ease,
    transform 130ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.teal, 'aa')};
    box-shadow: 0 0 12px ${toneAlpha(LCARS.teal, '2e')};
    transform: translateY(-1px);
  }
`;

export const QuickActionPanel = styled.div`
  ${panelBase};
  padding: 0.58rem;
  border-color: ${toneAlpha(LCARS.root, '58')};
  background:
    radial-gradient(circle at 95% 8%, ${toneAlpha(LCARS.lilac, '22')} 0%, transparent 44%),
    linear-gradient(180deg, #0f1822 0%, #0a121a 100%);
  min-width: 0;
`;
