import styled, { css, keyframes } from 'styled-components';
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
  position: relative;
  display: grid;
  gap: 0.56rem;
  min-width: 0;
  margin-bottom: 0.5rem;
`;

const finderCollapse = keyframes`
  from {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }

  to {
    opacity: 0;
    transform: translate(calc(-50% + 38vw), -5.4rem) scale(0.2);
  }
`;

export const FloatingFinder = styled.div`
  position: fixed;
  top: 10.9rem;
  left: 50%;
  z-index: 500;
  width: min(720px, calc(100vw - 1rem));
  max-height: calc(100vh - 11.4rem);
  overflow: auto;
  pointer-events: none;
  transform: translateX(-50%);
  transform-origin: 92% 0%;
  animation: ${({ $collapsing }) => ($collapsing ? css`${finderCollapse} 180ms cubic-bezier(0.4, 0, 1, 1) forwards` : 'none')};

  @media (max-width: 560px) {
    top: 10.9rem;
    width: calc(100vw - 0.8rem);
    max-height: calc(100vh - 11.4rem);
  }
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;

  @media (max-width: 560px) {
    order: 1;
  }
`;

export const MinimizedBar = styled.div`
  display: flex;
  align-items: center;
  min-height: 28px;
`;

export const MinimizedChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-height: 28px;
  max-width: 100%;
  border: 1px solid ${toneAlpha(LCARS.teal, '72')};
  border-radius: 8px;
  padding: 0.18rem 0.48rem 0.18rem 0.34rem;
  color: ${toneAlpha(LCARS.text, 'e8')};
  background:
    linear-gradient(180deg, rgba(17, 48, 58, 0.92), rgba(8, 27, 35, 0.96)),
    ${LCARS.bg};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.66rem;
  font-weight: 820;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${toneAlpha(LCARS.root, 'd0')};
    color: ${toneAlpha(LCARS.root, 'ff')};
    box-shadow: 0 0 14px ${toneAlpha(LCARS.root, '22')};
  }
`;

export const MinimizedIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid ${toneAlpha(LCARS.root, '80')};
  border-radius: 5px;
  color: ${toneAlpha(LCARS.root, 'f2')};
  background: rgba(9, 24, 38, 0.92);
  font-size: 0.86rem;
  line-height: 1;
`;

export const MinimizedCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  color: ${LCARS.bg};
  background: ${LCARS.amber};
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0;
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
  position: absolute;
  top: 0.72rem;
  right: 0.16rem;
  display: grid;
  justify-items: end;
  gap: 0.1rem;
  color: ${LCARS.textDim};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(0.96rem, 2.45vw, 1.42rem);
  font-weight: 900;
  letter-spacing: 0.06em;
  opacity: 0.28;
  pointer-events: none;
  white-space: nowrap;
  text-transform: uppercase;
  text-shadow: 0 0 16px rgba(127, 215, 255, 0.22);

  @media (max-width: 560px) {
    position: static;
    order: 3;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    justify-items: start;
    gap: 0.16rem 0.34rem;
    max-width: 100%;
    margin-top: -0.18rem;
    padding-left: 0.12rem;
    font-size: 0.68rem;
    opacity: 0.72;
    overflow: visible;
    text-shadow: 0 0 10px rgba(127, 215, 255, 0.18);
  }
`;

export const TelemetryLine = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.28rem;
  min-width: 0;

  @media (max-width: 560px) {
    gap: 0.22rem;
  }
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
  color: ${toneAlpha(LCARS.textDim, 'b8')};
`;

export const SearchSortRow = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns:
    minmax(280px, 2.2fr)
    minmax(200px, 1.35fr)
    minmax(126px, 0.72fr)
    minmax(126px, 0.72fr);
  gap: 0.55rem;

  @media (max-width: 880px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const FilterRow = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.55rem;

  @media (max-width: 820px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const UtilityRow = styled.div`
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.55rem;
  min-height: 30px;
  margin-top: -0.08rem;

  @media (max-width: 560px) {
    order: 2;
    align-items: flex-start;
    flex-direction: row;
  }
`;

export const ViewModeToggle = styled.div`
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, auto));
  gap: 0;
  padding: 0.16rem;
  border: 1px solid ${toneAlpha(LCARS.root, '64')};
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(4, 8, 13, 0.98), rgba(10, 18, 28, 0.98)),
    ${LCARS.bg};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -8px 18px rgba(0, 0, 0, 0.36),
    0 0 16px ${toneAlpha(LCARS.root, '12')};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 3px auto 3px 3px;
    width: calc(50% - 3px);
    border-radius: 999px;
    background:
      linear-gradient(180deg, rgba(42, 117, 146, 0.82), rgba(12, 45, 66, 0.92)),
      radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.18), transparent 34%);
    box-shadow:
      inset 0 0 0 1px ${toneAlpha(LCARS.root, '72')},
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      0 0 18px ${toneAlpha(LCARS.root, '28')};
    transform: translateX(${({ $mode }) => ($mode === 'terminal' ? '100%' : '0')});
    transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 4.65rem);
    padding: 0.1rem;
    border-color: ${toneAlpha(LCARS.root, '46')};
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.035),
      inset 0 -5px 12px rgba(0, 0, 0, 0.28),
      0 0 10px ${toneAlpha(LCARS.root, '0c')};

    &::before {
      inset: 2px auto 2px 2px;
      width: calc(50% - 2px);
      opacity: 0.72;
      box-shadow:
        inset 0 0 0 1px ${toneAlpha(LCARS.root, '58')},
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 0 10px ${toneAlpha(LCARS.root, '1c')};
    }
  }
`;

export const ViewModeButton = styled.button`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 84px;
  border: 0;
  border-radius: 999px;
  padding: 0 0.58rem;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.text, 'ff') : 'rgba(230, 237, 243, 0.58)'};
  background: transparent;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: ${({ $active }) =>
    $active ? '0 0 9px rgba(127, 215, 255, 0.28)' : 'none'};
  cursor: pointer;
  transition:
    color 140ms ease,
    text-shadow 140ms ease,
    transform 120ms ease;

  &:hover {
    color: ${toneAlpha(LCARS.text, 'f2')};
    transform: translateY(-1px);
  }

  @media (max-width: 560px) {
    min-width: 0;
    min-height: 40px;
    padding-inline: 0.38rem;
    font-size: 0.6rem;
    letter-spacing: 0.065em;
  }
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

export const FilterToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 32px;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, 'aa') : toneAlpha(LCARS.root, '72')};
  border-radius: 9px;
  padding: 0 0.78rem;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, 'f2') : toneAlpha(LCARS.root, 'e2')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(18, 58, 62, 0.92), rgba(10, 36, 42, 0.96))'
      : 'linear-gradient(180deg, rgba(11, 24, 37, 0.94), rgba(8, 17, 28, 0.96))'};
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    color 130ms ease,
    background 130ms ease,
    transform 90ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.teal, 'c2')};
    color: ${toneAlpha(LCARS.text, 'f4')};
    box-shadow: 0 0 14px ${toneAlpha(LCARS.teal, '24')};
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const FilterCount = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.22rem;
  border-radius: 999px;
  color: ${LCARS.bg};
  background: ${LCARS.lime};
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0;
`;

export const FilterPanel = styled.div`
  display: grid;
  gap: 0.62rem;
  min-width: 0;
  padding: 0.7rem;
  border: 1px solid ${toneAlpha(LCARS.teal, '55')};
  border-radius: 12px;
  background:
    linear-gradient(100deg, ${toneAlpha(LCARS.teal, '12')} 0%, transparent 52%),
    linear-gradient(180deg, rgba(10, 20, 29, 0.96), rgba(8, 15, 23, 0.98));
  box-shadow:
    inset 0 0 0 1px ${toneAlpha(LCARS.teal, '13')},
    0 12px 24px rgba(2, 9, 16, 0.46);
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
  transition:
    opacity 140ms ease,
    visibility 0s linear ${({ $hidden }) => ($hidden ? '140ms' : '0s')};
`;

export const FinderModeRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.34rem;
`;

export const FinderModeButton = styled.button`
  min-height: 38px;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.root, 'ac') : toneAlpha(LCARS.root, '42')};
  border-radius: 9px;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.root, 'f4') : '#b8cad8'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(21, 62, 86, 0.9), rgba(10, 34, 52, 0.94))'
      : 'rgba(7, 17, 27, 0.72)'};
  font-size: 0.66rem;
  font-weight: 820;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  text-shadow: 0 0 6px rgba(127, 215, 255, 0.12);

  &:hover {
    border-color: ${toneAlpha(LCARS.root, '9e')};
    color: ${toneAlpha(LCARS.text, 'f2')};
  }
`;

export const AdvancedFiltersToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  width: 100%;
  min-height: 42px;
  padding: 0.5rem 0.62rem;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, '9a') : toneAlpha(LCARS.root, '55')};
  border-radius: 10px;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, 'f0') : toneAlpha(LCARS.root, 'd4')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(100deg, rgba(18, 57, 59, 0.68), rgba(9, 24, 31, 0.9))'
      : 'linear-gradient(100deg, rgba(14, 31, 45, 0.8), rgba(8, 17, 27, 0.92))'};
  font-size: 0.7rem;
  font-weight: 780;
  letter-spacing: 0.07em;
  text-align: left;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 130ms ease, background 130ms ease, color 130ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.teal, 'b8')};
    color: ${toneAlpha(LCARS.text, 'f2')};
  }
`;

export const AdvancedFiltersIcon = styled.span`
  display: inline-grid;
  place-items: center;
  width: 1.28rem;
  height: 1.28rem;
  border: 1px solid ${toneAlpha(LCARS.teal, '68')};
  border-radius: 6px;
  color: ${toneAlpha(LCARS.teal, 'ec')};
  font-size: 1rem;
  line-height: 1;
`;

export const AdvancedFilters = styled.div`
  display: grid;
  gap: 0.62rem;
  min-width: 0;
  padding-top: 0.08rem;
`;

export const SortControlRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: stretch;
`;

export const SortDirectionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  min-width: 38px;
  min-height: 34px;
  align-self: end;
  border: 1px solid
    ${({ $descending }) =>
      $descending ? toneAlpha(LCARS.amber, 'b4') : toneAlpha(LCARS.root, '9a')};
  border-radius: 9px;
  color: ${({ $descending }) =>
    $descending ? toneAlpha(LCARS.amber, 'f4') : toneAlpha(LCARS.root, 'ec')};
  background: ${({ $descending }) =>
    $descending
      ? 'linear-gradient(180deg, rgba(61, 43, 16, 0.96), rgba(31, 22, 8, 0.98))'
      : 'linear-gradient(180deg, rgba(13, 31, 47, 0.96), rgba(8, 19, 29, 0.98))'};
  box-shadow:
    inset 0 0 0 1px
      ${({ $descending }) =>
        $descending ? toneAlpha(LCARS.amber, '20') : toneAlpha(LCARS.root, '18')},
    0 0 14px
      ${({ $descending }) =>
        $descending ? toneAlpha(LCARS.amber, '16') : toneAlpha(LCARS.root, '14')};
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    color 130ms ease,
    background 130ms ease,
    box-shadow 130ms ease,
    transform 90ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${({ $descending }) =>
      $descending ? toneAlpha(LCARS.amber, 'e0') : toneAlpha(LCARS.root, 'd0')};
    color: ${toneAlpha(LCARS.text, 'f2')};
    box-shadow:
      0 0 0 2px
        ${({ $descending }) =>
          $descending ? toneAlpha(LCARS.amber, '24') : toneAlpha(LCARS.root, '2f')},
      0 0 14px
        ${({ $descending }) =>
          $descending ? toneAlpha(LCARS.amber, '2e') : toneAlpha(LCARS.root, '30')};
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

  ${({ $active, $tone = LCARS.root }) =>
    $active &&
    css`
      border-color: ${toneAlpha($tone, 'c8')};
      box-shadow:
        inset 0 0 0 1px ${toneAlpha($tone, '42')},
        0 10px 24px rgba(2, 9, 16, 0.52),
        0 0 18px ${toneAlpha($tone, '32')};
      background:
        linear-gradient(94deg, ${toneAlpha($tone, '32')} 0%, transparent 62%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 70%),
        ${LCARS.panel};
    `}
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

export const BoxLocatorScope = styled.div`
  min-width: 0;
  min-height: 56px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 34px;
  align-items: end;
  gap: 0.52rem;
  padding: 0.42rem 0.48rem;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.lime, 'a8') : toneAlpha(LCARS.line, '82')};
  border-radius: 9px;
  background:
    linear-gradient(
      92deg,
      ${({ $active }) =>
        $active ? toneAlpha(LCARS.lime, '20') : toneAlpha(LCARS.root, '10')},
      transparent 58%
    ),
    ${LCARS.panel};
  box-shadow: ${({ $active }) =>
    $active
      ? `inset 0 0 0 1px ${toneAlpha(LCARS.lime, '24')}, 0 0 16px ${toneAlpha(LCARS.lime, '18')}`
      : `inset 0 0 0 1px ${toneAlpha(LCARS.root, '16')}`};

  @media (max-width: 560px) {
    grid-template-columns: auto minmax(0, 1fr) 34px;
    min-height: 52px;
  }
`;

export const BoxLocatorInputGroup = styled.label`
  display: grid;
  gap: 0.22rem;
`;

export const BoxLocatorInput = styled.input`
  ${controlField};
  width: 4.7rem;
  min-height: 32px;
  padding: 0.34rem 0.46rem;
  text-align: center;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 1.02rem;
  font-weight: 760;
  letter-spacing: 0.18em;
  font-variant-numeric: tabular-nums;
`;

export const BoxLocatorReadout = styled.div`
  align-self: stretch;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.08rem;
  padding: 0.1rem 0 0.22rem;
  color: ${toneAlpha(LCARS.text, 'dc')};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  overflow: hidden;

  span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: ${toneAlpha(LCARS.textDim, 'b0')};
    font-size: 0.56rem;
    letter-spacing: 0.08em;
  }
`;

export const BoxLocatorClear = styled.button`
  align-self: end;
  width: 34px;
  min-width: 34px;
  height: 34px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: ${toneAlpha(LCARS.textDim, 'c4')};
  font-size: 1.05rem;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${toneAlpha(LCARS.lime, 'f0')};
    background: ${toneAlpha(LCARS.lime, '15')};
    outline: 1px solid ${toneAlpha(LCARS.lime, '70')};
  }
`;

export const LocatorWrap = styled.div`
  position: relative;
`;

export const LocatorDropdown = styled.div`
  position: fixed;
  z-index: 640;
  display: grid;
  gap: 0.2rem;
  padding: 0.36rem;
  border-radius: 11px;
  border: 1px solid ${toneAlpha(LCARS.lime, '7a')};
  background: linear-gradient(180deg, rgba(9, 16, 24, 0.99), rgba(8, 14, 20, 0.99));
  box-shadow:
    0 18px 30px rgba(2, 9, 16, 0.7),
    0 0 0 1px ${toneAlpha(LCARS.lime, '1f')} inset;
  overflow-y: auto;
  overscroll-behavior: contain;
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

export const ControlHint = styled.span`
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.lime, 'ed') : toneAlpha(LCARS.textDim, 'cf')};
  font-size: 0.68rem;
  font-weight: ${({ $active }) => ($active ? 760 : 650)};
  letter-spacing: 0.03em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
