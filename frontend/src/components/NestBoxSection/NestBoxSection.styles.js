import { controlStyles } from '../../styles/primitives';
import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

export const NestPanel = styled.div`
  background: var(--dw-surface);
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.12);
  margin-top: 0;
  display: none;

  ${({ $open }) =>
    $open &&
    css`
      display: block;
      margin-top: 12px;
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};

    ${({ $open }) =>
      $open &&
      css`
        margin-top: 8px;
      `}
  }
`;

export const SectionInner = styled.div`
  padding: 12px 14px 16px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 8px;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(230, 237, 243, 0.12);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
`;

export const Title = styled.h4`
  margin: 0;
  font-size: 15px;
  color: var(--dw-text);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    line-height: 1.3;
  }
`;

export const Note = styled.div`
  font-size: 12px;
  color: var(--dw-text-secondary);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const ContextCard = styled.div`
  background: var(--dw-surface-raised);
  border: 1px solid rgba(230, 237, 243, 0.1);
  border-left: 3px solid var(--box-neon, var(--dw-cyan));
  border-radius: var(--dw-radius);
  padding: 11px 12px;
  margin-bottom: 12px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: 8px 9px;
    margin-bottom: 8px;
  }
`;

export const ContextTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-weight: 700;
  font-size: 15px;
  color: var(--dw-text);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: var(--dw-radius-sm);
  font-weight: 700;
  font-size: 12px;
  background: var(--dw-surface);
  border: 1px solid rgba(230, 237, 243, 0.14);
  color: var(--dw-text-secondary);
  font-family: var(--dw-font-ui);
  letter-spacing: 0.01em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 2px 8px;
  }
`;

export const Breadcrumb = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    gap: 4px;
  }
`;

export const Crumb = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
`;

export const Sep = styled.span`
  color: var(--dw-text-secondary);
`;

export const SubLabel = styled.div`
  margin-top: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--dw-cyan);
  letter-spacing: 0.01em;
  text-transform: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const Hint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: var(--dw-text-secondary);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    margin-top: 7px;
  }
`;

export const SmallBtn = styled.button`
  ${controlStyles}
  appearance: none;
  border: 1px solid rgba(230, 237, 243, 0.16);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  padding: 8px 10px;
  border-radius: var(--dw-radius);
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:hover {
    border-color: var(--dw-cyan);
    background: var(--dw-surface-raised);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_XS};
    padding: 6px 8px;
  }
`;

export const WarnBtn = styled(SmallBtn)`
  border-color: rgba(232, 177, 92, 0.42);
  background: rgba(232, 177, 92, 0.08);

  &:hover {
    border-color: rgba(255, 212, 0, 0.55);
    background: rgba(255, 212, 0, 0.12);
  }
`;

export const Grid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr;
  @media (min-width: 520px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 760px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

export const BoxBtn = styled.button`
  ${controlStyles}
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--dw-radius);
  border: 1px solid
    ${({ $disabled, $selected }) =>
      $selected
        ? 'var(--dw-cyan)'
        : $disabled
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(230, 237, 243, 0.16)'};
  background: ${({ $selected }) => ($selected ? 'var(--dw-surface-raised)' : 'var(--dw-surface)')};
  color: var(--dw-text);
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.08s ease;

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? 'rgba(255, 255, 255, 0.12)' : 'var(--dw-cyan)')};
  }
  &:active {
    transform: translateY(1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 8px 9px;
  }
`;

export const Meta = styled.div`
  font-size: 12px;
  color: var(--dw-text-muted);
  font-family: var(--dw-font-ui);
  letter-spacing: 0.01em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const DepthStrip = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  height: 6px;
  align-items: center;
`;

export const DepthSeg = styled.div`
  flex: 1 1 0;
  height: 6px;
  border-radius: var(--dw-radius);
  background: ${({ $level }) =>
    `rgba(76, 198, 193, ${Math.min(0.15 + $level * 0.12, 0.9)})`};
`;

export const GhostBtn = styled.button`
  ${controlStyles}
  padding: 8px 12px;
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.16);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:hover {
    border-color: var(--dw-cyan);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding: 6px 9px;
    font-size: ${MOBILE_FONT_XS};
  }
`;
