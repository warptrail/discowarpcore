import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from './tokens';

const LCARS = {
  bg: '#0c0f11',
  panel: '#14181b',
  panelAlt: '#1a1f24',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  line: 'rgba(255,255,255,0.08)',
};

const panelBase = css`
  border: 1px solid ${LCARS.line};
  border-radius: 12px;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.25),
    0 8px 22px rgba(0, 0, 0, 0.22);
`;

export const PanelShell = styled.section`
  ${panelBase};
  display: grid;
  gap: 0.5rem;
  padding: 0.5rem 0.56rem;
  margin-bottom: 0.6rem;
  background:
    linear-gradient(95deg, rgba(127, 215, 255, 0.11) 0%, transparent 40%),
    ${LCARS.panel};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.34rem;
    padding: 0.34rem 0.4rem;
    margin-bottom: 0.42rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2), 0 4px 10px rgba(0, 0, 0, 0.18);
  }
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.52rem;
  padding: 0 0.18rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.38rem;
    padding: 0 0.06rem;
  }
`;

export const TitlePip = styled.span`
  width: 8px;
  height: 24px;
  border-radius: 8px;
  background: #4cc6c1;
  box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.2) inset;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 6px;
    height: 18px;
    border-radius: 6px;
  }
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 0.96rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e6edf3;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.82rem;
    letter-spacing: 0.06em;
  }
`;

export const ControlsRow = styled.div`
  display: grid;
  grid-template-columns: minmax(210px, 1fr) minmax(160px, 220px) auto;
  gap: 0.5rem;
  align-items: end;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.36rem;
  }
`;

export const ControlGroup = styled.label`
  ${panelBase};
  display: grid;
  gap: 0.22rem;
  padding: 0.34rem 0.5rem 0.42rem;
  background:
    linear-gradient(
      94deg,
      ${({ $tone = '#7FD7FF' }) => `${$tone}20`} 0%,
      transparent 60%
    ),
    ${LCARS.panel};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.16rem;
    padding: 0.26rem 0.34rem 0.3rem;
    border-radius: 9px;
  }
`;

export const ControlLabel = styled.span`
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${LCARS.textDim};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.08em;
  }
`;

const controlField = css`
  width: 100%;
  border: 1px solid ${LCARS.line};
  border-radius: 9px;
  background: ${LCARS.bg};
  color: ${LCARS.text};
  min-height: 32px;
  padding: 0.42rem 0.6rem;
  font-size: 0.85rem;
  outline: none;
  transition:
    border-color 130ms ease,
    box-shadow 130ms ease,
    background 130ms ease;

  &:focus {
    border-color: rgba(127, 215, 255, 0.7);
    box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.18);
    background: ${LCARS.panelAlt};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 34px;
    padding: 0.34rem 0.46rem;
    font-size: ${MOBILE_FONT_SM};
    border-radius: 8px;
  }
`;

export const SearchInput = styled.input`
  ${controlField};
`;

export const SortSelect = styled.select`
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
`;

export const Status = styled.div`
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${LCARS.line};
  border-radius: 999px;
  padding: 0.38rem 0.7rem;
  font-size: 0.76rem;
  letter-spacing: 0.05em;
  color: #7fd7ff;
  background: rgba(12, 15, 17, 0.7);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: flex-start;
    min-height: 30px;
    padding: 0.28rem 0.5rem;
    font-size: ${MOBILE_FONT_XS};
  }
`;
