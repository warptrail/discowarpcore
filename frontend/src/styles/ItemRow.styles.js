import styled, { keyframes, css } from 'styled-components';

const ROW_BG = '#111'; // dark surface fill
const hueDial = keyframes`
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }
`;

export const flashColors = {
  blue: 'rgba(0, 255, 200, 0.8)',
  yellow: 'rgba(255, 220, 50, 0.85)',
  red: 'rgba(255, 80, 80, 0.9)',
};

// 🔥 Flash animation: big glow in/out
const flashGlow = (colorName) => {
  const color = flashColors[colorName] || flashColors.blue;
  return keyframes`
    0%, 100% {
      box-shadow: 0 0 0px ${color};
      filter: brightness(1);
    }
    35% {
      box-shadow: 0 0 1em ${color}, 0 0 2em ${color};
      filter: brightness(1.6);
    }
  `;
};

/* Outer wrapper: paints the gradient border */
export const Wrapper = styled.div`
  --r: 10px; /* corner radius */
  --gap: 3px; /* border thickness */
  --ring-speed: 8s;

  position: relative;
  border-radius: var(--r);
  overflow: hidden;
  isolation: isolate;
  /* Avoid animation fighting with transitions */
  transition: none;
  will-change: box-shadow;

  /* 🌈 gradient frame */
  background: linear-gradient(135deg, #355070, #6d597a);
  /* opacity: 0.4; */

  /* 🌈 active state: bright + animated */
  ${({ $open, $pulsing }) =>
    ($open || $pulsing) &&
    css`
      background: linear-gradient(135deg, #1cd3ff, #20ff9d);
      opacity: 1;
      animation: ${hueDial} var(--ring-speed) linear infinite;
    `}

  /* ⚡ flashing state = extreme glow */
${({ $flashing, $flashColor }) =>
    $flashing &&
    css`
      animation: ${flashGlow($flashColor)} 1s linear;
    `}

  &::after {
    content: '';
    position: absolute;
    inset: var(--gap);
    border-radius: calc(var(--r) - var(--gap));
    background: ${ROW_BG};
    z-index: 0;
  }
`;

/* Main clickable row */
export const Row = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  padding: 0.75rem 1rem;
  background: transparent; /* surface is handled by Wrapper::after */
  border-radius: ${({ $open }) =>
    $open
      ? 'calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap)) 0 0'
      : 'calc(var(--r) - var(--gap))'};
  cursor: pointer;
  transition: background 240ms ease;

  &:active {
    background: rgba(255, 255, 255, 0.05);
  }
`;

/* Expanding details panel */
export const Collapse = styled.div`
  position: relative;
  z-index: 1;
  overflow: hidden;

  margin: 0 var(--gap) var(--gap);
  background: ${ROW_BG};
  border-radius: 0 0 calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap));

  height: ${({ $height }) => $height}px; /* 👈 now styled prop */
  transition: height ${({ $collapseDurMs }) => $collapseDurMs}ms
      cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity ${({ $collapseDurMs }) => $collapseDurMs}ms ease,
    transform ${({ $collapseDurMs }) => $collapseDurMs}ms ease;

  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: translateY(${({ $open }) => ($open ? '0' : '-6px')});
`;

/* Content inside collapse */
export const DetailsCard = styled.div`
  position: relative;
  z-index: 1;
  padding: 1rem;
  border-radius: 0 0 calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap));
  background: #181818;
`;

/* Text + Layout Elements */
export const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const Title = styled.div`
  font-weight: 600;
`;

export const Breadcrumb = styled.div`
  font-size: 0.8rem;
  color: #888;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`;

export const Tag = styled.span`
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  background: #222;
`;

export const Notes = styled.div`
  font-size: 0.85rem;
  color: #aaa;
`;

export const Qty = styled.span`
  font-size: 0.9rem;
  font-weight: bold;
  color: #aaa;
`;
