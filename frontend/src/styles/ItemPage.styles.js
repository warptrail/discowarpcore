import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from './tokens';

const LCARS = {
  panel: '#141920',
  panelSoft: '#1b212b',
  line: 'rgba(231, 236, 243, 0.11)',
  text: '#e7ecf3',
  textDim: 'rgba(231, 236, 243, 0.72)',
  textMuted: 'rgba(231, 236, 243, 0.56)',
  teal: '#4cc6c1',
  coral: '#f08a7b',
  amber: '#e8b15c',
  green: '#54d097',
  lilac: '#a097ff',
};

export const Page = styled.section`
  display: grid;
  gap: 0.8rem;
  padding: 0.2rem 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.58rem;
    padding: 0.05rem 0;
  }
`;

export const BreadcrumbNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
  padding: 0.66rem 0.8rem;
  border: 1px solid ${LCARS.line};
  border-radius: 10px;
  background: ${LCARS.panelSoft};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.26rem;
    padding: 0.45rem 0.52rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

const crumbBase = `
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
  padding: 0.26rem 0.42rem;
  border-radius: 8px;
  border: 1px solid ${LCARS.line};
  background: rgba(255, 255, 255, 0.02);
  font-size: 0.82rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
    padding: 0.2rem 0.34rem;
    border-radius: 7px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const BreadcrumbLink = styled(Link)`
  ${crumbBase}
  color: ${LCARS.text};
  text-decoration: none;
  transition: border-color 120ms ease, transform 120ms ease;

  &:hover {
    border-color: ${LCARS.teal}66;
    transform: translateY(-1px);
  }
`;

export const BreadcrumbCurrent = styled.span`
  ${crumbBase}
  color: ${LCARS.textDim};
  border-color: ${LCARS.coral}66;
  background: ${LCARS.coral}12;
`;

export const BreadcrumbText = styled.span`
  ${crumbBase}
  color: ${LCARS.textDim};
`;

export const CrumbId = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${LCARS.textDim};
  border: 1px solid ${LCARS.line};
  border-radius: 6px;
  padding: 0.08rem 0.28rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;
    padding: 0.06rem 0.2rem;
    border-radius: 5px;
  }
`;

export const CrumbLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(38vw, 320px);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: min(50vw, 190px);
  }
`;

export const CrumbSep = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.88rem;
  user-select: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const TitleBar = styled.header`
  display: grid;
  gap: 0.25rem;
  padding: 0.18rem 0.06rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.18rem;
    padding: 0.06rem 0.02rem;
  }
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.6rem;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.42rem;
    flex-wrap: wrap;
  }
`;

export const TitleInfo = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

export const Title = styled.h2`
  margin: 0;
  color: ${LCARS.text};
  font-size: clamp(1.14rem, 2vw, 1.36rem);
  line-height: 1.22;
  letter-spacing: 0.02em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 1rem;
    line-height: 1.18;
  }
`;

export const Meta = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.74rem;
  font-weight: 640;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.05em;
  }
`;

export const StateCard = styled.div`
  border: 1px solid ${({ $tone }) => ($tone === 'error' ? '#a84a4a' : LCARS.line)};
  border-radius: 10px;
  padding: 0.86rem 0.92rem;
  color: ${({ $tone }) => ($tone === 'error' ? '#ffc8c8' : LCARS.text)};
  background: ${({ $tone }) =>
    $tone === 'error' ? 'rgba(240, 138, 123, 0.16)' : LCARS.panel};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: 0.62rem 0.68rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const ContainerMuted = styled.span`
  color: ${LCARS.textMuted};
`;

export const ContainerActions = styled.div`
  display: flex;
  gap: 0.48rem;
  flex-wrap: wrap;
  padding-top: 0.08rem;
`;

export const ItemButtonBar = styled.section`
  display: grid;
  gap: 0.42rem;
  padding: 0.46rem 0.56rem;
  border: 1px solid ${LCARS.line};
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.022), rgba(255, 255, 255, 0.006));

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.34rem 0.38rem;
    border-radius: 8px;
    gap: 0.3rem;
  }
`;

export const ContainerTimestampSection = styled.section`
  display: grid;
  gap: 0.34rem;
  padding: 0.34rem 0.42rem 0.28rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.02);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.26rem 0.3rem 0.24rem;
    border-radius: 8px;
    gap: 0.26rem;
  }
`;

export const ContainerTimestampLabel = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.07em;
  }
`;

export const ContainerTimestampActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
`;

export const ContainerButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? `${LCARS.amber}88` : `${LCARS.teal}80`)};
  border-radius: 8px;
  background: ${({ $active }) =>
    $active ? 'rgba(232, 177, 92, 0.18)' : 'rgba(76, 198, 193, 0.15)'};
  color: ${LCARS.text};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.35rem 0.56rem;
  min-height: 34px;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;

  &:hover:enabled {
    border-color: ${({ $active }) => ($active ? LCARS.amber : LCARS.teal)};
    background: ${({ $active }) =>
      $active ? 'rgba(232, 177, 92, 0.28)' : 'rgba(76, 198, 193, 0.24)'};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1 1 160px;
    min-height: 32px;
    font-size: ${MOBILE_FONT_XS};
    padding: 0.26rem 0.46rem;
  }
`;

const timestampToneBorder = (tone) =>
  tone === 'consumed'
    ? 'rgba(242, 98, 98, 0.76)'
    : tone === 'maintained'
      ? 'rgba(84, 208, 151, 0.72)'
      : tone === 'checked'
        ? 'rgba(160, 151, 255, 0.72)'
        : 'rgba(76, 198, 193, 0.72)';

const timestampToneBg = (tone) =>
  tone === 'consumed'
    ? 'linear-gradient(180deg, rgba(92, 29, 29, 0.94), rgba(67, 22, 22, 0.92))'
    : tone === 'maintained'
      ? 'linear-gradient(180deg, rgba(25, 71, 50, 0.92), rgba(19, 56, 40, 0.9))'
      : tone === 'checked'
        ? 'linear-gradient(180deg, rgba(45, 43, 93, 0.92), rgba(34, 33, 70, 0.9))'
        : 'linear-gradient(180deg, rgba(31, 72, 88, 0.92), rgba(24, 56, 69, 0.9))';

const timestampToneGlow = (tone) =>
  tone === 'consumed'
    ? 'rgba(242, 98, 98, 0.26)'
    : tone === 'maintained'
      ? 'rgba(84, 208, 151, 0.24)'
      : tone === 'checked'
        ? 'rgba(160, 151, 255, 0.24)'
        : 'rgba(127, 215, 255, 0.2)';

export const ContainerTimestampButton = styled.button`
  border: 1px solid ${({ $tone }) => timestampToneBorder($tone)};
  background: ${({ $tone }) => timestampToneBg($tone)};
  color: #eff7ff;
  border-radius: 8px;
  padding: 0.24rem 0.52rem;
  min-height: 32px;
  font-size: 0.66rem;
  font-weight: 730;
  letter-spacing: 0.07em;
  line-height: 1;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 120ms ease, border-color 120ms ease, box-shadow 120ms ease;

  &:hover:enabled {
    filter: brightness(1.08);
    box-shadow: 0 0 10px ${({ $tone }) => timestampToneGlow($tone)};
  }

  &:active:enabled {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 30px;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.04em;
    padding: 0.16rem 0.34rem;
    border-radius: 7px;
  }
`;

export const ContainerPickerWrap = styled.div`
  border: 1px solid ${LCARS.line};
  border-radius: 8px;
  padding: 0.3rem 0.42rem 0.42rem;
  background: rgba(255, 255, 255, 0.02);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 7px;
    padding: 0.22rem 0.28rem 0.28rem;
  }
`;

export const ContainerError = styled.div`
  color: #ffc8c8;
  font-size: 0.78rem;
`;
