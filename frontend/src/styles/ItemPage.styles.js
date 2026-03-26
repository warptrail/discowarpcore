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
  padding-bottom: ${({ $reserveBottomDock }) =>
    $reserveBottomDock
      ? 'calc(5.8rem + env(safe-area-inset-bottom))'
      : '0.2rem'};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.58rem;
    padding: 0.05rem 0;
    padding-bottom: ${({ $reserveBottomDock }) =>
      $reserveBottomDock
        ? 'calc(6.1rem + env(safe-area-inset-bottom))'
        : '0.05rem'};
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

export const StickyActionBar = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 55;
  padding-bottom: max(0.52rem, env(safe-area-inset-bottom));
  pointer-events: none;
  display: flex;
  justify-content: center;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-bottom: max(0.4rem, env(safe-area-inset-bottom));
  }
`;

export const StickyActionInner = styled.div`
  width: min(960px, calc(100vw - 4rem));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.56rem;
  pointer-events: auto;
  border: 1px solid rgba(130, 168, 196, 0.44);
  border-radius: 12px;
  padding: 0.52rem 0.62rem;
  background:
    linear-gradient(180deg, rgba(27, 33, 43, 0.96), rgba(20, 25, 32, 0.96)),
    ${LCARS.panel};
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.42),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: calc(100vw - (var(--mobile-gap) * 2));
    padding: 0.42rem;
    gap: 0.44rem;
    border-radius: 10px;
  }
`;

export const StickyActionMeta = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.04em;
  }
`;

export const StickyPrimaryButton = styled.button`
  border: 1px solid ${LCARS.teal}86;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(76, 198, 193, 0.3), rgba(76, 198, 193, 0.18));
  color: ${LCARS.text};
  min-height: 38px;
  padding: 0.36rem 1.05rem;
  font-size: 0.78rem;
  font-weight: 720;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, transform 120ms ease;

  &:hover {
    border-color: ${LCARS.teal};
    background: linear-gradient(180deg, rgba(76, 198, 193, 0.38), rgba(76, 198, 193, 0.24));
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 36px;
    padding: 0.3rem 0.86rem;
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

export const ContainerCard = styled.section`
  position: relative;
  display: grid;
  gap: 0.7rem;
  padding: 0.76rem 0.84rem;
  border: 1px solid ${LCARS.line};
  border-radius: 12px;
  background:
    radial-gradient(circle at 92% 10%, rgba(76, 198, 193, 0.09) 0%, transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.012), transparent 40%),
    ${LCARS.panel};
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.26),
    0 8px 22px rgba(0, 0, 0, 0.22);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0.84rem;
    right: 0.84rem;
    top: 0.52rem;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(240, 138, 123, 0.62) 0 14%,
      transparent 14% 19%,
      rgba(76, 198, 193, 0.78) 19% 72%,
      transparent 72% 78%,
      rgba(167, 182, 255, 0.65) 78% 100%
    );
    opacity: 0.45;
    pointer-events: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.5rem;
    padding: 0.56rem 0.6rem;
    border-radius: ${MOBILE_PANEL_RADIUS};

    &::before {
      left: 0.6rem;
      right: 0.6rem;
      top: 0.4rem;
      height: 2px;
      opacity: 0.38;
    }
  }
`;

export const ContainerTitle = styled.h3`
  margin: 0;
  color: ${LCARS.text};
  font-size: 0.88rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.06em;
  }
`;

export const ContainerBody = styled.div`
  display: grid;
  gap: 0;
  padding: 0.48rem 0.56rem 0.44rem;
  border: 1px solid ${LCARS.line};
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.022), rgba(255, 255, 255, 0.006));

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.34rem 0.38rem;
    border-radius: 8px;
  }
`;

export const ContainerRow = styled.div`
  display: grid;
  grid-template-columns: minmax(112px, 146px) minmax(0, 1fr);
  gap: 0.56rem;
  align-items: start;
  padding: 0.42rem 0.18rem 0.4rem;
  border-radius: 8px;

  ${({ $prominent }) =>
    $prominent
      ? `
    background: linear-gradient(90deg, rgba(76, 198, 193, 0.12), rgba(76, 198, 193, 0.02));
    box-shadow: inset 0 0 0 1px rgba(76, 198, 193, 0.2);
  `
      : ''}

  &:not(:first-child) {
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.18rem;
    padding: 0.32rem 0.06rem 0.3rem;
  }
`;

export const ContainerLabel = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const ContainerValue = styled.div`
  color: ${LCARS.textDim};
  font-size: 0.88rem;
  line-height: 1.34;
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
  padding-top: 0.08rem;
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

export const ContainerBoxValueGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.44rem;
`;

export const ContainerPrimaryValue = styled.span`
  color: ${LCARS.text};
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.24;
  overflow-wrap: anywhere;
`;

export const ContainerPrimaryLink = styled(Link)`
  color: #97e5df;
  text-decoration: none;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.24;
  overflow-wrap: anywhere;
  transition: color 120ms ease, text-decoration-color 120ms ease;

  &:hover {
    color: #c6f8f4;
    text-decoration: underline;
    text-decoration-color: rgba(198, 248, 244, 0.72);
    text-underline-offset: 2px;
  }
`;

export const ContainerChipLink = styled(Link)`
  text-decoration: none;
`;

export const ContainerBoxIdChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  border-radius: 999px;
  border: 1px solid ${LCARS.teal}70;
  background: ${LCARS.teal}1f;
  color: #c5f4f1;
  padding: 0.14rem 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.7rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
`;

export const ContainerSecondaryValue = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.8rem;
  font-weight: 560;
  line-height: 1.28;
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
