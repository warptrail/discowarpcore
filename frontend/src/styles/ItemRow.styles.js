import styled, { keyframes, css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
  MOBILE_PANEL_RADIUS,
} from './tokens';

const ROW_BG = '#111';

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

const capSweep = keyframes`
  0%, 100% {
    transform: translate3d(-18%, 0, 0);
    opacity: 0.18;
  }
  50% {
    transform: translate3d(18%, 0, 0);
    opacity: 0.42;
  }
`;

const capPulse = keyframes`
  0%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  50% {
    transform: translateY(-2px);
    opacity: 0.95;
  }
`;

export const Wrapper = styled.div`
  --r: 10px;
  --gap: 3px;
  --ring-speed: 16s;

  position: relative;
  scroll-margin-top: 112px;
  border-radius: var(--r);
  overflow: hidden;
  isolation: isolate;
  transition: none;

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
    opacity: 0.68;
    background: linear-gradient(
      118deg,
      var(--item-accent, #7fd7ff),
      var(--item-secondary, #67d9d3)
    );
  }

  ${({ $open, $pulsing }) =>
    ($open || $pulsing) &&
    css`
      &::before {
        opacity: 0.94;
        background: linear-gradient(
          118deg,
          var(--item-accent, #7fd7ff),
          var(--item-secondary, #67d9d3)
        );
        box-shadow: 0 0 16px rgba(var(--item-accent-rgb, 127, 215, 255), 0.2);
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
    background:
      linear-gradient(
        100deg,
        rgba(var(--item-accent-rgb, 127, 215, 255), 0.055),
        transparent 42%
      ),
      ${ROW_BG};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    --r: ${MOBILE_PANEL_RADIUS};
    --gap: 1px;
  }

  @media (max-width: 420px) {
    --r: 9px;
  }
`;

export const RowShell = styled.div`
  position: relative;
  z-index: 2;
`;

export const Row = styled.button`
  position: relative;
  display: block;
  width: 100%;
  padding: 0.42rem 0.78rem 0.32rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  border-radius: ${({ $open }) =>
    $open
      ? 'calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap)) 0 0'
      : 'calc(var(--r) - var(--gap))'};
  cursor: pointer;
  transition: background 280ms cubic-bezier(0.22, 1, 0.36, 1);

  ${({ $open }) =>
    $open &&
    css`
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: 5px;
        background: linear-gradient(
          180deg,
          var(--item-accent, #7fd7ff),
          var(--item-secondary, #67d9d3)
        );
        opacity: 0.88;
        pointer-events: none;
      }

      &::after {
        content: '';
        position: absolute;
        inset: auto 8% 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(var(--item-accent-rgb, 127, 215, 255), 0.72),
          rgba(var(--item-secondary-rgb, 103, 217, 211), 0.38),
          transparent
        );
        animation: ${capSweep} 4.8s ease-in-out infinite;
        pointer-events: none;
      }
    `}

  &:active {
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.32rem 0.34rem 0.38rem;
  }

  @media (max-width: 420px) {
    padding: 0.28rem 0.3rem 0.32rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::after {
      animation: none;
    }
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
      $open
        ? 'rgba(var(--item-accent-rgb, 76, 198, 193), 0.5)'
        : 'rgba(var(--item-accent-rgb, 255, 255, 255), 0.18)'};
  background: ${({ $open }) =>
    $open
      ? 'linear-gradient(90deg, rgba(var(--item-accent-rgb, 76, 198, 193), 0.14), rgba(var(--item-secondary-rgb, 167, 182, 255), 0.08))'
      : 'linear-gradient(90deg, rgba(var(--item-accent-rgb, 255, 255, 255), 0.06), rgba(255, 255, 255, 0.025) 38%)'};
  box-shadow: ${({ $open }) =>
    $open ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' : 'none'};
  transition: border-color 220ms ease, background 220ms ease, box-shadow 220ms ease;

  ${Row}:hover &,
  ${Row}:focus-visible & {
    border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.62);
    background: linear-gradient(
      90deg,
      rgba(var(--item-accent-rgb, 127, 215, 255), 0.14),
      rgba(var(--item-secondary-rgb, 167, 182, 255), 0.06) 58%,
      rgba(255, 255, 255, 0.025)
    );
    box-shadow:
      0 0 0 1px rgba(var(--item-accent-rgb, 127, 215, 255), 0.16),
      0 0 14px rgba(var(--item-accent-rgb, 127, 215, 255), 0.24),
      inset 0 0 12px rgba(var(--item-accent-rgb, 127, 215, 255), 0.08);
  }

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

  ${({ $open }) =>
    $open &&
    css`
      border: 0;
      border-radius: 0;
      min-height: 46px;
      align-items: center;
      padding: 0.34rem
        ${({ $hasItemLink }) => ($hasItemLink ? '2.85rem' : '0.32rem')}
        0.42rem 0.5rem;
      background: linear-gradient(
        90deg,
        rgba(var(--item-accent-rgb, 76, 198, 193), 0.18),
        rgba(var(--item-secondary-rgb, 167, 182, 255), 0.06) 58%,
        transparent 92%
      );
      box-shadow: none;

      @media (max-width: ${MOBILE_BREAKPOINT}) {
        border-radius: 0;
        min-height: 44px;
        padding: 0.3rem
          ${({ $hasItemLink }) => ($hasItemLink ? '2.6rem' : '0.22rem')}
          0.36rem 0.46rem;
      }

      @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
        border-radius: 0;
        padding: 0.28rem 0.18rem 0.34rem 0.42rem;
      }
    `}
`;

export const ItemHomeLink = styled.a`
  position: absolute;
  z-index: 4;
  top: 50%;
  right: 0.7rem;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.34);
  border-radius: 5px;
  background: rgba(5, 10, 17, 0.72);
  color: rgba(231, 236, 243, 0.68);
  font-family: ${"'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace"};
  font-size: 0.8rem;
  line-height: 1;
  text-decoration: none;
  transform: translateY(-50%);
  transition:
    color 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;

  &:hover,
  &:focus-visible {
    outline: none;
    color: #ffffff;
    border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.78);
    background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.13);
    box-shadow: 0 0 12px rgba(var(--item-accent-rgb, 127, 215, 255), 0.14);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    right: 0.48rem;
    width: 25px;
    height: 25px;
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
  box-shadow: 0 0 0 1px rgba(var(--item-accent-rgb, 255, 255, 255), 0.32);

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
  border: 1px solid rgba(var(--item-accent-rgb, 255, 255, 255), 0.42);
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
  border: 1px solid rgba(var(--item-accent-rgb, 255, 255, 255), 0.32);
  background: linear-gradient(
      135deg,
      rgba(var(--item-accent-rgb, 255, 255, 255), 0.1),
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

export const RowDeckState = styled.span`
  width: fit-content;
  color: rgba(219, 224, 255, 0.72);
  font-family: ${"'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace"};
  font-size: 0.55rem;
  font-weight: 720;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
`;

export const RowDestructionState = styled.span`
  width: fit-content;
  color: #ffd36a;
  font-family: ${"'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace"};
  font-size: 0.55rem;
  font-weight: 760;
  letter-spacing: 0.07em;
  line-height: 1.2;
  text-transform: uppercase;
`;

export const RowCapCommand = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: center;
  gap: 0.48rem;
  padding-right: 0.2rem;
  color: rgba(231, 236, 243, 0.5);
  font-family: ${"'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace"};
  font-size: 0.56rem;
  font-weight: 720;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    > span {
      display: none;
    }
  }
`;

export const RowCapSignal = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 14px;

  i {
    display: block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--item-accent, #7fd7ff);
    box-shadow: 0 0 6px rgba(var(--item-accent-rgb, 127, 215, 255), 0.5);
    animation: ${capPulse} 1.8s ease-in-out infinite;
  }

  i:nth-child(2) {
    background: var(--item-secondary, #67d9d3);
    animation-delay: -1.2s;
  }

  i:nth-child(3) {
    animation-delay: -0.6s;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
    i {
      animation: none;
    }
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
  border: 1px solid rgba(var(--item-accent-rgb, 76, 198, 193), 0.48);
  color: #d7f5f2;
  background: rgba(var(--item-accent-rgb, 76, 198, 193), 0.13);
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
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};

  margin: 0 var(--gap) ${({ $open }) => ($open ? 'var(--gap)' : '0')};
  background:
    linear-gradient(
      110deg,
      rgba(var(--item-accent-rgb, 127, 215, 255), 0.06),
      transparent 36%
    ),
    ${ROW_BG};
  border-radius: 0 0 calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap));

  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: translate3d(0, ${({ $open }) => ($open ? '0' : '-8px')}, 0);
  transition:
    grid-template-rows ${({ $collapseDurMs }) => $collapseDurMs}ms
      cubic-bezier(0.22, 1, 0.36, 1),
    margin-bottom ${({ $collapseDurMs }) => $collapseDurMs}ms
      cubic-bezier(0.22, 1, 0.36, 1),
    opacity 300ms ease,
    transform ${({ $collapseDurMs }) => $collapseDurMs}ms
      cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear
      ${({ $open, $collapseDurMs }) => ($open ? '0ms' : `${$collapseDurMs}ms`)};

  > div {
    min-height: 0;
    overflow: hidden;
    transform-origin: top center;
    transform: translate3d(0, ${({ $open }) => ($open ? '0' : '-12px')}, 0);
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    transition: transform ${({ $collapseDurMs }) => $collapseDurMs}ms
        cubic-bezier(0.22, 1, 0.36, 1),
      opacity 280ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    > div {
      transition: none;
    }
  }
`;

export const DetailsCard = styled.div`
  position: relative;
  z-index: 2;
  padding: 1rem;
  border-radius: 0 0 calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap));
  background:
    linear-gradient(
      112deg,
      rgba(var(--item-accent-rgb, 127, 215, 255), 0.08),
      rgba(var(--item-secondary-rgb, 103, 217, 211), 0.035) 48%,
      transparent
    ),
    #181818;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.46rem;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    padding: 0.38rem;
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

  ${({ $expanded }) =>
    $expanded &&
    css`
      color: rgba(231, 236, 243, 0.68);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.035em;
      line-height: 1.15;
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
    line-height: 1.18;

    ${({ $expanded }) =>
      $expanded &&
      css`
        font-size: 0.78rem;
        line-height: 1.15;
      `}

    ${({ $mobileCollapsed }) =>
      $mobileCollapsed &&
      css`
        width: 100%;
        max-width: 100%;
      `}
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    font-size: 0.84rem;

    ${({ $expanded }) =>
      $expanded &&
      css`
        font-size: 0.74rem;
        line-height: 1.12;
      `}
  }
`;

export const QuantitySubtext = styled.span`
  display: block;
  justify-self: start;
  max-width: 100%;
  color: rgba(231, 236, 243, 0.5);
  font-size: 0.64rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.04em;
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

export const EditWorkspace = styled.section`
  border-radius: 10px;
  border: 1px solid rgba(76, 198, 193, 0.42);
  background: #11161f;
  padding: 0.78rem;
  box-shadow: 0 0 0 1px rgba(76, 198, 193, 0.12);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: 0.56rem;
    box-shadow: 0 0 0 1px rgba(76, 198, 193, 0.08);
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
