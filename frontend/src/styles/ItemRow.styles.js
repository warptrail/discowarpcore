import styled, { keyframes, css } from 'styled-components';

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
`;

export const Row = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  padding: 0.75rem 1rem;
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
`;

export const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const Right = styled.div`
  display: flex;
  align-items: flex-start;
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
  font-weight: 700;
  color: #aeb8cc;
  letter-spacing: 0.04em;
  margin-top: 0.28rem;
`;

export const EditButton = styled.button`
  margin-left: 0.4rem;
  padding: 0.37rem 0.82rem 0.34rem;
  border-radius: 12px 12px 8px 8px;
  border: 1px solid rgba(240, 138, 123, 0.64);
  background: linear-gradient(180deg, #2f364d, #262c3f);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(12, 17, 27, 0.55);
  color: #f1f4fb;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.085em;
  text-transform: uppercase;
  transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;

  &:hover {
    border-color: rgba(76, 198, 193, 0.86);
    background: linear-gradient(180deg, #354261, #2b3552);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 12px rgba(76, 198, 193, 0.22);
  }

  &:active {
    transform: translateY(1px);
  }
`;
