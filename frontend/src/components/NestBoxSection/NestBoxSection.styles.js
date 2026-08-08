import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

export const NestPanel = styled.div`
  background:
    linear-gradient(105deg, rgba(var(--box-primary-rgb, 127, 215, 255), 0.1), transparent 42%),
    #0b1118;
  border-radius: 8px;
  border: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.42);
  box-shadow: inset 0 1px 0 rgba(var(--box-neon-rgb, 127, 215, 255), 0.2);
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
  border-bottom: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.24);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
`;

export const Title = styled.h4`
  margin: 0;
  font-size: 15px;
  color: #e8f2f6;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    line-height: 1.3;
  }
`;

export const Note = styled.div`
  font-size: 12px;
  color: rgba(211, 232, 241, 0.68);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const ContextCard = styled.div`
  background: rgba(7, 14, 22, 0.58);
  border: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.28);
  border-left: 3px solid var(--box-neon, #7fd7ff);
  border-radius: 6px;
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
  font-weight: 800;
  font-size: 15px;
  color: #eaeaea;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: 3px;
  font-weight: 800;
  font-size: 12px;
  background: rgba(var(--box-primary-rgb, 127, 215, 255), 0.12);
  border: 1px solid rgba(var(--box-neon-rgb, 127, 215, 255), 0.42);
  color: var(--box-neon, #c9f4ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.04em;

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
  color: rgba(255, 255, 255, 0.35);
`;

export const SubLabel = styled.div`
  margin-top: 10px;
  font-size: 12px;
  font-weight: 800;
  color: var(--box-neon, #c9f4ff);
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const Hint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);

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
  appearance: none;
  border: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.34);
  background: rgba(var(--box-primary-rgb, 127, 215, 255), 0.07);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:hover {
    border-color: var(--box-neon, #c9f4ff);
    background: rgba(var(--box-primary-rgb, 127, 215, 255), 0.14);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 34px;
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
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 5px;
  border: 1px solid
    ${({ $disabled, $selected }) =>
      $selected
        ? 'var(--box-neon, #7fd7ff)'
        : $disabled
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(var(--box-primary-rgb, 127, 215, 255), 0.34)'};
  background:
    linear-gradient(100deg, rgba(var(--box-primary-rgb, 127, 215, 255), ${({ $selected }) => ($selected ? '0.2' : '0.08')}), transparent 70%),
    rgba(8, 15, 23, 0.72);
  color: #eaeaea;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.08s ease;

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? 'rgba(255, 255, 255, 0.12)' : 'var(--box-neon, #7fd7ff)')};
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
  color: var(--box-neon, #b7d3df);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.03em;

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
  border-radius: 999px;
  background: ${({ $level }) =>
    `rgba(78, 199, 123, ${Math.min(0.15 + $level * 0.12, 0.9)})`};
`;

export const GhostBtn = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #2f2f2f;
  background: #141414;
  color: #eaeaea;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:hover {
    border-color: #4ec77b;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 34px;
    padding: 6px 9px;
    font-size: ${MOBILE_FONT_XS};
  }
`;
