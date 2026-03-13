import styled, { css } from 'styled-components';

const LCARS = {
  bg: '#0c0f11',
  panel: '#14181b',
  panelAlt: '#1a1f24',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  line: 'rgba(255,255,255,0.08)',
  teal: '#4CC6C1',
  lilac: '#A7B6FF',
  amber: '#E8B15C',
  root: '#7FD7FF',
};

const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;

const panelBase = css`
  border: 1px solid ${LCARS.line};
  border-radius: 14px;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.25),
    0 8px 24px rgba(0, 0, 0, 0.24);
`;

export const HeaderShell = styled.section`
  ${panelBase};
  display: grid;
  gap: 0.74rem;
  padding: 0.88rem 0.92rem 0.94rem;
  background:
    radial-gradient(circle at 95% 8%, ${toneAlpha(LCARS.root, '1e')} 0%, transparent 42%),
    linear-gradient(180deg, #12171b 0%, #0f1317 100%);
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  color: ${LCARS.textDim};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.8rem;
  letter-spacing: 0.045em;
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
  color: ${toneAlpha(LCARS.textDim, '9f')};
`;

export const ControlsRow = styled.div`
  display: grid;
  grid-template-columns:
    minmax(220px, 1fr)
    minmax(130px, 170px)
    minmax(130px, 170px)
    minmax(150px, 220px);
  gap: 0.55rem;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

export const ControlGroup = styled.label`
  ${panelBase};
  display: grid;
  gap: 0.28rem;
  padding: 0.44rem 0.56rem 0.5rem;
  background:
    linear-gradient(
      94deg,
      ${({ $tone = LCARS.root }) => toneAlpha($tone, '16')} 0%,
      transparent 62%
    ),
    ${LCARS.panel};
`;

export const ControlLabel = styled.span`
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${LCARS.textDim};
`;

const controlField = css`
  width: 100%;
  border: 1px solid ${toneAlpha(LCARS.line, 'cc')};
  border-radius: 9px;
  background: ${LCARS.bg};
  color: ${LCARS.text};
  min-height: 34px;
  padding: 0.46rem 0.62rem;
  font-size: 0.86rem;
  outline: none;
  transition:
    border-color 130ms ease,
    box-shadow 130ms ease,
    background 130ms ease;

  &:focus {
    border-color: ${toneAlpha(LCARS.root, 'b6')};
    box-shadow: 0 0 0 2px ${toneAlpha(LCARS.root, '26')};
    background: ${LCARS.panelAlt};
  }
`;

export const SearchInput = styled.input`
  ${controlField};
`;

export const Select = styled.select`
  ${controlField};
  appearance: none;
  background-image:
    linear-gradient(
      45deg,
      transparent 50%,
      ${toneAlpha(LCARS.textDim, 'cc')} 50%
    ),
    linear-gradient(
      135deg,
      ${toneAlpha(LCARS.textDim, 'cc')} 50%,
      transparent 50%
    );
  background-position:
    calc(100% - 16px) calc(50% - 2px),
    calc(100% - 11px) calc(50% - 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 1.8rem;
`;
