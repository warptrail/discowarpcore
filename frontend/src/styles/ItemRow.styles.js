import styled, { keyframes, css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
  MOBILE_PANEL_RADIUS,
} from './tokens';

const ROW_BG = '#111';

const hueDial = keyframes`
  from {
    filter: hue-rotate(0deg);
  }
  to {
    filter: hue-rotate(360deg);
  }
`;

export const flashColors = {
  blue: 'rgba(0, 255, 200, 0.8)',
  yellow: 'rgba(255, 220, 50, 0.85)',
  red: 'rgba(255, 80, 80, 0.9)',
};

const flashGlow = (colorName) => {
  const color = flashColors[colorName] || flashColors.blue;
  return keyframes`
    0%, 100% {
      box-shadow: 0 0 0 ${color};
    }
    35% {
      box-shadow: 0 0 1.1em ${color}, 0 0 2em ${color};
    }
  `;
};

export const Wrapper = styled.div`
  --r: 10px;
  --gap: 3px;
  --ring-speed: 16s;

  position: relative;
  border-radius: var(--r);
  overflow: hidden;
  isolation: isolate;
  transition: none;
  will-change: box-shadow, filter;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: inherit;
    pointer-events: none;
  }

  &::before {
    inset: 0;
    z-index: 0;
    opacity: 0.84;
    background: linear-gradient(135deg, #355070, #6d597a);
  }

  ${({ $open, $pulsing }) =>
    ($open || $pulsing) &&
    css`
      &::before {
        opacity: 0.96;
        background: #1cd3ff;
        animation: ${hueDial} var(--ring-speed) linear infinite;
      }
    `}

  ${({ $flashing, $flashColor }) =>
    $flashing &&
    css`
      animation: ${flashGlow($flashColor)} 1s linear;
    `}

  &::after {
    inset: var(--gap);
    z-index: 1;
    border-radius: calc(var(--r) - var(--gap));
    background: ${ROW_BG};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    --r: ${MOBILE_PANEL_RADIUS};
    --gap: 1px;
  }

  @media (max-width: 420px) {
    --r: 9px;
  }
`;

export const Row = styled.div`
  position: relative;
  z-index: 2;
  display: block;

  padding: 0.42rem 0.78rem 0.32rem;
  background: transparent;
  border-radius: ${({ $open }) =>
    $open
      ? 'calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap)) 0 0'
      : 'calc(var(--r) - var(--gap))'};
  cursor: pointer;
  transition: background 240ms ease;

  &:active {
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.32rem 0.34rem 0.38rem;
  }

  @media (max-width: 420px) {
    padding: 0.28rem 0.3rem 0.32rem;
  }
`;

export const RowHeader = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.46rem;
  min-width: 0;
  border-radius: 10px;
  padding: 0.34rem 0.5rem;
  border: 1px solid
    ${({ $open }) =>
      $open ? 'rgba(76, 198, 193, 0.38)' : 'rgba(255, 255, 255, 0.08)'};
  background: ${({ $open }) =>
    $open
      ? 'linear-gradient(90deg, rgba(76, 198, 193, 0.14), rgba(167, 182, 255, 0.1))'
      : 'rgba(255, 255, 255, 0.03)'};
  box-shadow: ${({ $open }) =>
    $open ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' : 'none'};
  transition: border-color 220ms ease, background 220ms ease, box-shadow 220ms ease;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: minmax(0, 1fr);
    padding: 0.28rem 0.34rem;
    border-radius: 9px;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    gap: 0;
    padding: 0.24rem 0.3rem;
  }

  @media (max-width: 420px) {
    padding: 0.22rem 0.26rem;
  }
`;

export const RowMain = styled.div`
  display: grid;
  grid-template-columns: ${({ $showThumb }) =>
    $showThumb ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)'};
  align-items: start;
  gap: 0.54rem;
  min-width: 0;
  flex: 1;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: ${({ $showThumb }) =>
      $showThumb ? '46px minmax(0, 1fr)' : 'minmax(0, 1fr)'};
    gap: 0.42rem;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    grid-template-columns: ${({ $showThumb }) =>
      $showThumb ? '40px minmax(0, 1fr)' : 'minmax(0, 1fr)'};
    gap: 0.34rem;
  }
`;

export const RowThumb = styled.div`
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  align-self: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 46px;
    height: 46px;
    border-radius: 8px;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    width: 40px;
    height: 40px;
    border-radius: 7px;
  }
`;

export const RowThumbImage = styled.img`
  width: 52px;
  height: 52px;
  display: block;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 46px;
    height: 46px;
    border-radius: 8px;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    width: 40px;
    height: 40px;
    border-radius: 7px;
  }
`;

export const RowThumbPlaceholder = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.045),
      rgba(255, 255, 255, 0.015)
    ),
    rgba(255, 255, 255, 0.025);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 46px;
    height: 46px;
    border-radius: 8px;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    width: 40px;
    height: 40px;
    border-radius: 7px;
  }
`;

export const TitleGroup = styled.div`
  display: grid;
  gap: 0.26rem;
  align-content: start;
  min-height: 28px;
  min-width: 0;
  padding-top: 0.02rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.2rem;
    min-height: 20px;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    gap: 0.14rem;
  }
`;

export const RowActions = styled.div`
  display: inline-flex;
  align-items: center;
  align-self: start;
  justify-content: flex-end;
  gap: 0.22rem;
  flex-shrink: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: auto;
    justify-content: flex-end;
    gap: 0.2rem;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    width: auto;
    justify-content: flex-end;
  }
`;

export const RowActionCluster = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  flex-wrap: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.16rem;
  }
`;

export const QuickView = styled.div`
  min-width: 0;
  overflow: hidden;
  margin-top: ${({ $collapsed }) => ($collapsed ? '0' : '0.3rem')};
  max-height: ${({ $collapsed }) => ($collapsed ? '0' : '80px')};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  transform: translateY(${({ $collapsed }) => ($collapsed ? '-8px' : '0')});
  transition:
    max-height 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
    margin-top 220ms ease,
    opacity 220ms ease,
    transform 220ms ease;
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: ${({ $collapsed }) => ($collapsed ? '0' : '0.3rem')};
    max-height: ${({ $collapsed }) => ($collapsed ? '0' : '26px')};
  }
`;

export const QuickMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.34rem;
  height: 100%;
  min-width: 0;
  overflow: hidden;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.28rem;
  }
`;

export const QuickDesktopStack = styled.div`
  display: grid;
  gap: 0.24rem;
  min-width: 0;
`;

export const QuickTagLane = styled.div`
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.22rem;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: 62%;
    gap: 0.2rem;
  }
`;

export const QuickTag = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 640;
  letter-spacing: 0.02em;
  line-height: 1;
  padding: 0.13rem 0.38rem;
  border-radius: 999px;
  border: 1px solid rgba(76, 198, 193, 0.48);
  color: #d7f5f2;
  background: rgba(76, 198, 193, 0.13);
  white-space: nowrap;
  flex: 0 0 auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.12rem 0.3rem;
  }
`;

export const QuickTagOverflow = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.03em;
  padding: 0.12rem 0.34rem;
  border-radius: 999px;
  border: 1px solid rgba(167, 182, 255, 0.52);
  background: rgba(167, 182, 255, 0.14);
  color: #dbe2ff;
  white-space: nowrap;
  flex: 0 0 auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.1rem 0.24rem;
  }
`;

export const QuickSummaryDescription = styled.div`
  min-width: 0;
  font-size: 0.82rem;
  color: rgba(231, 236, 243, 0.7);
  line-height: 1.18;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  white-space: normal;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    line-height: 1.16;
    -webkit-line-clamp: 1;
  }
`;

export const QuickSummaryFallback = styled.div`
  min-width: 0;
  font-size: 0.78rem;
  line-height: 1.2;
  color: rgba(231, 236, 243, 0.45);
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const RowChevron = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  align-self: center;
  color: rgba(231, 236, 243, 0.66);
  font-size: 0.76rem;
  line-height: 1;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform 200ms ease, color 160ms ease;
  user-select: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: none;
  }
`;

export const Collapse = styled.div`
  position: relative;
  z-index: 2;
  overflow: hidden;

  margin: 0 var(--gap) var(--gap);
  background: ${ROW_BG};
  border-radius: 0 0 calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap));

  height: ${({ $height }) => $height}px;
  transition: height ${({ $collapseDurMs }) => $collapseDurMs}ms
      cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity ${({ $collapseDurMs }) => $collapseDurMs}ms ease,
    transform ${({ $collapseDurMs }) => $collapseDurMs}ms ease;

  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: translateY(${({ $open }) => ($open ? '0' : '-6px')});
`;

export const DetailsCard = styled.div`
  position: relative;
  z-index: 2;
  padding: 1rem;
  border-radius: 0 0 calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap));
  background: #181818;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.46rem;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    padding: 0.38rem;
  }
`;

export const ExpandedActionStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 0.62rem;
  padding-bottom: 0.54rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0.44rem;
    padding-bottom: 0.36rem;
  }
`;

export const ExpandedActionCluster = styled.div`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.34rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
  }
`;

export const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  min-width: 0;
`;

export const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const Title = styled.div`
  color: #e7ecf3;
  font-size: clamp(1.02rem, 1.85vw, 1.15rem);
  font-weight: 760;
  letter-spacing: 0.015em;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
    line-height: 1.18;

    ${({ $mobileCollapsed }) =>
      $mobileCollapsed &&
      css`
        width: 100%;
        max-width: 100%;
      `}
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    font-size: 0.84rem;
  }
`;

export const ItemNameChip = styled(Link)`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  justify-self: start;
  width: fit-content;
  max-width: 100%;
  padding: 0.14rem 0.46rem;
  border-radius: 999px;
  border: 1px solid rgba(76, 198, 193, 0.42);
  background: rgba(76, 198, 193, 0.1);
  color: #e7ecf3;
  font-size: clamp(1.02rem, 1.85vw, 1.15rem);
  font-weight: 760;
  letter-spacing: 0.015em;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
  cursor: pointer;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
    line-height: 1.18;
    padding: 0.1rem 0.28rem;
    letter-spacing: 0.012em;

    ${({ $mobileCollapsed }) =>
      $mobileCollapsed &&
      css`
        display: inline-flex;
        align-items: center;
        justify-self: stretch;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        flex: 1 1 auto;
        border-radius: 8px;
        padding: 0.12rem 0.38rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `}
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    font-size: 0.84rem;
    line-height: 1.16;
    padding: 0.08rem 0.24rem;
    border-color: rgba(76, 198, 193, 0.34);
    background: rgba(76, 198, 193, 0.08);

    ${({ $mobileCollapsed }) =>
      $mobileCollapsed &&
      css`
        border-radius: 7px;
        padding: 0.1rem 0.3rem;
      `}
  }

  &:hover {
    border-color: rgba(76, 198, 193, 0.82);
    background: rgba(76, 198, 193, 0.16);
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(76, 198, 193, 0.9);
    box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.24);
  }
`;

export const Breadcrumb = styled.div`
  color: rgba(231, 236, 243, 0.74);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.05em;
    line-height: 1.12;
  }
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
`;

export const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 620;
  letter-spacing: 0.02em;
  padding: 0.18rem 0.48rem;
  border-radius: 999px;
  border: 1px solid rgba(76, 198, 193, 0.48);
  color: #d7f5f2;
  background: rgba(76, 198, 193, 0.13);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.12rem 0.34rem;
    line-height: 1.1;
  }
`;

export const Description = styled.div`
  font-size: 0.9rem;
  color: rgba(231, 236, 243, 0.8);
  line-height: 1.35;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    line-height: 1.22;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    font-size: 0.78rem;
    line-height: 1.18;
  }
`;

export const Qty = styled.span`
  display: inline-flex;
  align-items: center;
  justify-self: start;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgba(167, 182, 255, 0.48);
  background: rgba(167, 182, 255, 0.12);
  color: #d7defd;
  font-size: 0.7rem;
  font-weight: 740;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.15rem 0.36rem;
  }
`;

export const FlatBoxContextLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
  }
`;

export const FlatBoxIdPill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(167, 182, 255, 0.58);
  background: rgba(167, 182, 255, 0.14);
  color: #dce2ff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.14rem 0.42rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.12rem 0.3rem;
    letter-spacing: 0.05em;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    padding: 0.1rem 0.26rem;
  }
`;

export const FlatBoxStatePill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(240, 138, 123, 0.7);
  background: rgba(240, 138, 123, 0.15);
  color: #ffc8c0;
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  padding: 0.14rem 0.46rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.12rem 0.34rem;
    letter-spacing: 0.07em;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    padding: 0.1rem 0.28rem;
  }
`;

export const QuickActionButton = styled.button`
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'move'
        ? 'rgba(232, 177, 92, 0.74)'
        : $tone === 'consumed'
          ? 'rgba(242, 98, 98, 0.76)'
          : $tone === 'maintained'
            ? 'rgba(84, 208, 151, 0.72)'
            : $tone === 'checked'
              ? 'rgba(160, 151, 255, 0.72)'
              : 'rgba(76, 198, 193, 0.72)'};
  background: ${({ $tone, $active }) =>
    $tone === 'move'
      ? $active
        ? 'linear-gradient(180deg, rgba(100, 68, 23, 0.95), rgba(76, 51, 18, 0.94))'
        : 'linear-gradient(180deg, rgba(73, 53, 22, 0.94), rgba(58, 42, 17, 0.92))'
      : $tone === 'consumed'
        ? 'linear-gradient(180deg, rgba(92, 29, 29, 0.94), rgba(67, 22, 22, 0.92))'
        : $tone === 'maintained'
          ? 'linear-gradient(180deg, rgba(25, 71, 50, 0.92), rgba(19, 56, 40, 0.9))'
          : $tone === 'checked'
            ? 'linear-gradient(180deg, rgba(45, 43, 93, 0.92), rgba(34, 33, 70, 0.9))'
            : 'linear-gradient(180deg, rgba(31, 72, 88, 0.92), rgba(24, 56, 69, 0.9))'};
  color: #eff7ff;
  border-radius: 8px;
  padding: 0.24rem 0.52rem;
  font-size: 0.66rem;
  font-weight: 730;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  transition: filter 120ms ease, box-shadow 120ms ease, border-color 120ms ease;

  &:hover {
    filter: brightness(1.08);
    box-shadow: 0 0 10px
      ${({ $tone }) =>
        $tone === 'consumed'
          ? 'rgba(242, 98, 98, 0.26)'
          : $tone === 'move'
            ? 'rgba(232, 177, 92, 0.24)'
            : 'rgba(127, 215, 255, 0.18)'};
  }

  ${({ $tone, $active }) =>
    $tone === 'move' &&
    $active &&
    css`
      border-color: rgba(245, 194, 103, 0.86);
      box-shadow: 0 0 0 1px rgba(232, 177, 92, 0.25);
    `}

  &:active {
    transform: translateY(1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${({ $compactMobile }) => ($compactMobile ? '25px' : '32px')};
    font-size: ${({ $compactMobile }) => ($compactMobile ? '0.56rem' : '0.64rem')};
    letter-spacing: ${({ $compactMobile }) => ($compactMobile ? '0.03em' : '0.04em')};
    padding: ${({ $compactMobile }) => ($compactMobile ? '0.06rem 0.18rem' : '0.16rem 0.34rem')};
    border-radius: ${({ $compactMobile }) => ($compactMobile ? '6px' : '7px')};
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    min-height: ${({ $compactMobile }) => ($compactMobile ? '23px' : '30px')};
    font-size: ${({ $compactMobile }) => ($compactMobile ? '0.54rem' : '0.62rem')};
    padding: ${({ $compactMobile }) => ($compactMobile ? '0.05rem 0.16rem' : '0.15rem 0.3rem')};
    border-radius: ${({ $compactMobile }) => ($compactMobile ? '5px' : '7px')};
  }
`;

export const MoveWorkspace = styled.section`
  border-radius: 10px;
  border: 1px solid #355943;
  background: #131a15;
  padding: 0.78rem;
  box-shadow: 0 0 0 1px rgba(78, 199, 123, 0.14);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: 0.56rem;
    box-shadow: 0 0 0 1px rgba(78, 199, 123, 0.09);
  }
`;

export const MoveWorkspaceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.56rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-wrap: wrap;
    margin-bottom: 0.42rem;
  }
`;

export const MoveWorkspaceTitle = styled.h4`
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  color: #d8ece0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const MoveWorkspaceClose = styled.button`
  border: 1px solid #3d3d3d;
  background: #202020;
  color: #ddd;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.78rem;
  cursor: pointer;
  min-height: 34px;

  &:hover:enabled {
    background: #2a2a2a;
    border-color: #565656;
  }

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.2rem 0.44rem;
  }
`;

export const EditButton = styled.button`
  border: 1px solid rgba(240, 138, 123, 0.62);
  background: linear-gradient(180deg, #2f364d, #262c3f);
  color: #f1f4fb;
  border-radius: 8px;
  padding: 0.26rem 0.62rem;
  font-size: 0.7rem;
  font-weight: 720;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;

  &:hover {
    border-color: rgba(76, 198, 193, 0.84);
    background: linear-gradient(180deg, #354261, #2b3552);
    box-shadow: 0 0 12px rgba(76, 198, 193, 0.2);
  }

  &:active {
    transform: translateY(1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 34px;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.05em;
    padding: 0.2rem 0.44rem;
  }
`;
