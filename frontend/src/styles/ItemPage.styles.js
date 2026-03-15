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
  justify-content: space-between;
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

export const ModeToggle = styled.button`
  border: 1px solid ${LCARS.teal}78;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(76, 198, 193, 0.22), rgba(76, 198, 193, 0.12));
  color: ${LCARS.text};
  padding: 0.34rem 0.74rem;
  min-height: 34px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, transform 120ms ease;

  &:hover {
    border-color: ${LCARS.teal};
    background: linear-gradient(180deg, rgba(76, 198, 193, 0.32), rgba(76, 198, 193, 0.16));
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 32px;
    padding: 0.28rem 0.62rem;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.04em;
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

export const ContainerCard = styled.section`
  display: grid;
  gap: 0.62rem;
  padding: 0.76rem 0.84rem;
  border: 1px solid ${LCARS.line};
  border-radius: 10px;
  background: ${LCARS.panel};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.5rem;
    padding: 0.56rem 0.6rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const ContainerTitle = styled.h3`
  margin: 0;
  color: ${LCARS.text};
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.05em;
  }
`;

export const ContainerBody = styled.div`
  display: grid;
  gap: 0.4rem;
`;

export const ContainerRow = styled.div`
  display: grid;
  grid-template-columns: minmax(96px, 120px) minmax(0, 1fr);
  gap: 0.56rem;
  align-items: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
`;

export const ContainerLabel = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.74rem;
  font-weight: 680;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const ContainerValue = styled.div`
  color: ${LCARS.textDim};
  font-size: 0.88rem;
  min-width: 0;
`;

export const ContainerLink = styled(Link)`
  color: ${LCARS.teal};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const ContainerMuted = styled.span`
  color: ${LCARS.textMuted};
`;

export const ContainerActions = styled.div`
  display: flex;
  gap: 0.48rem;
  flex-wrap: wrap;
`;

export const ContainerButton = styled.button`
  border: 1px solid ${LCARS.teal}80;
  border-radius: 8px;
  background: rgba(76, 198, 193, 0.15);
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
    border-color: ${LCARS.teal};
    background: rgba(76, 198, 193, 0.24);
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
