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
    --gap: 2px;
  }
`;

export const Row = styled.div`
  position: relative;
  z-index: 2;
  display: block;

  padding: 0.56rem 0.85rem 0.62rem;
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
    padding: 0.42rem 0.52rem 0.48rem;
  }
`;

export const RowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  min-width: 0;
  border-radius: 10px;
  padding: 0.44rem 0.56rem;
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
    gap: 0.45rem;
    padding: 0.36rem 0.42rem;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const RowActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  flex-shrink: 0;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    width: 100%;
    justify-content: space-between;
  }
`;

export const QuickView = styled.div`
  display: grid;
  gap: 0.28rem;
  min-width: 0;
  overflow: hidden;
  margin-top: ${({ $collapsed }) => ($collapsed ? '0' : '0.44rem')};
  max-height: ${({ $collapsed }) => ($collapsed ? '0' : '360px')};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  transform: translateY(${({ $collapsed }) => ($collapsed ? '-8px' : '0')});
  transition:
    max-height 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
    margin-top 220ms ease,
    opacity 220ms ease,
    transform 220ms ease;
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.22rem;
    margin-top: ${({ $collapsed }) => ($collapsed ? '0' : '0.3rem')};
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
    padding: 0.58rem;
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
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.96rem;
    line-height: 1.2;
  }
`;

export const TitleLink = styled(Link)`
  color: #e7ecf3;
  font-size: clamp(1.02rem, 1.85vw, 1.15rem);
  font-weight: 760;
  letter-spacing: 0.015em;
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-decoration: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.96rem;
    line-height: 1.2;
  }

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(76, 198, 193, 0.86);
    text-underline-offset: 2px;
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
  }
`;

export const Description = styled.div`
  font-size: 0.9rem;
  color: rgba(231, 236, 243, 0.8);
  line-height: 1.35;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    line-height: 1.28;
  }
`;

export const Qty = styled.span`
  display: inline-flex;
  align-items: center;
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
