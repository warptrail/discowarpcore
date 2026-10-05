import styled, { css } from 'styled-components';
import { panelStyles, inputStyles } from './primitives';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from './tokens';

const LCARS = {
  bg: 'var(--dw-background)',
  panel: 'var(--dw-surface)',
  panelAlt: 'var(--dw-surface-raised)',
  text: 'var(--dw-text)',
  textDim: 'var(--dw-text-secondary)',
  line: 'rgba(255,255,255,0.08)',
};

const panelBase = css`${panelStyles}`;

export const PanelShell = styled.section`
  ${panelBase};
  display: grid;
  gap: 0.5rem;
  padding: 0.5rem 0.56rem;
  margin-bottom: 0.6rem;
  background: ${LCARS.panel};
  position: relative;
  top: 0;
  z-index: 40;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.34rem;
    padding: 0.34rem 0.4rem;
    margin-bottom: 0.42rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    box-shadow: none;
    top: 0;
  }
  min-width: 0;
  font-family: var(--dw-font-ui);
  & :is(button, a, input, select, textarea):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
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
  border-radius: var(--dw-radius);
  background: var(--dw-amber);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 6px;
    height: 18px;
    border-radius: var(--dw-radius);
  }
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: normal;
  text-transform: none;
  color: #e6edf3;
  font-family: var(--dw-font-ui);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.82rem;
    letter-spacing: normal;
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
  background: ${LCARS.panelAlt};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.16rem;
    padding: 0.26rem 0.34rem 0.3rem;
    border-radius: var(--dw-radius);
  }
`;

export const ControlLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: normal;
  text-transform: none;
  color: ${LCARS.textDim};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: normal;
  }
`;

const controlField = css`
  ${inputStyles}
  width: 100%;
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
  min-height: var(--dw-control-height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${LCARS.line};
  border-radius: var(--dw-radius);
  padding: 0.38rem 0.7rem;
  font-size: 0.76rem;
  letter-spacing: normal;
  color: #7fd7ff;
  background: var(--dw-surface-raised);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: flex-start;
    min-height: var(--dw-control-height);
    padding: 0.28rem 0.5rem;
    font-size: ${MOBILE_FONT_XS};
  }
`;
