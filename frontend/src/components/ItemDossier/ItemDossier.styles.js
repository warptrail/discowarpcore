import styled, { css } from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const mono =
  "'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export const Dossier = styled.div`
  min-width: 0;
  padding: 0;
  color: #e7ecf3;
  background:
    radial-gradient(circle at 12% 0%, rgba(76, 198, 193, 0.055), transparent 34%),
    linear-gradient(180deg, rgba(15, 21, 30, 0.98), rgba(9, 14, 21, 0.99));

`;

const carouselToneColor = ($tone) => {
  if ($tone === 'lilac') return '197, 167, 255';
  if ($tone === 'coral') return '255, 142, 126';
  if ($tone === 'amber') return '239, 186, 91';
  if ($tone === 'green') return '126, 224, 173';
  return '76, 198, 193';
};

export const Carousel = styled.section`
  display: grid;
  grid-template-rows: auto auto auto;
  width: 100%;
  height: auto;
  min-width: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: #080d14;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045);

  @media (max-width: ${MOBILE_BREAKPOINT}) { width: 100%; }
`;

export const CarouselHeader = styled.header`
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 46px;
  padding: 7px 10px;
  border-bottom: 1px solid rgba(231, 236, 243, 0.09);
  background:
    linear-gradient(90deg, rgba(var(--item-accent-rgb, 76, 198, 193), 0.12), transparent 46%),
    rgba(8, 13, 20, 0.96);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 42px;
    padding: 6px 9px;
  }
`;

export const CarouselHeadingGroup = styled.div`
  display: grid;
  gap: 3px;
  min-width: 0;
`;

export const CarouselEyebrow = styled.span`
  color: rgba(231, 236, 243, 0.42);
  font-family: ${mono};
  font-size: 0.54rem;
  font-weight: 740;
  letter-spacing: 0.15em;
  line-height: 1;
  text-transform: uppercase;
`;

export const CarouselTitle = styled.strong`
  min-width: 0;
  color: #f3f7fb;
  font-size: clamp(0.92rem, 2vw, 1.16rem);
  font-weight: 790;
  line-height: 1.08;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CarouselPosition = styled.span`
  flex-shrink: 0;
  color: rgba(167, 182, 255, 0.68);
  font-family: ${mono};
  font-size: 0.62rem;
  letter-spacing: 0.08em;
`;

export const CarouselHeaderControls = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
`;

export const CarouselViewport = styled.div`
  min-width: 0;
  overflow: visible;
`;

export const CarouselTrack = styled.div`
  display: flex;
  width: 500%;
  height: auto;
  transform: translate3d(calc(${({ $activeIndex }) => $activeIndex} * -20%), 0, 0);
  transition: transform 460ms cubic-bezier(0.22, 1, 0.36, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CarouselSlide = styled.article`
  position: relative;
  width: 20%;
  height: auto;
  min-width: 0;
  overflow: hidden;
  visibility: ${({ $active }) => ($active ? 'visible' : 'hidden')};
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
  background:
    radial-gradient(
      circle at 88% 2%,
      rgba(${({ $tone }) => carouselToneColor($tone)}, 0.14),
      transparent 34%
    ),
    linear-gradient(
      145deg,
      rgba(${({ $tone }) => carouselToneColor($tone)}, 0.065),
      rgba(8, 13, 20, 0.98) 42%
    );

`;

export const CarouselSlideScroll = styled.div`
  height: auto;
  min-width: 0;
  overflow: visible;
`;

export const CarouselNavigation = styled.nav`
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 0;
  min-height: 34px;
  padding: 4px 8px;
  border-top: 1px solid rgba(231, 236, 243, 0.1);
  background: rgba(6, 10, 16, 0.96);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 32px;
    padding: 3px 7px;
  }
`;

export const CarouselArrow = styled.button`
  display: grid;
  place-items: center;
  width: ${({ $compact }) => ($compact ? '34px' : '48px')};
  min-height: ${({ $compact }) => ($compact ? '32px' : '44px')};
  border: 1px solid rgba(var(--item-accent-rgb, 76, 198, 193), 0.28);
  border-radius: 7px;
  background: rgba(var(--item-accent-rgb, 76, 198, 193), 0.06);
  color: rgba(231, 236, 243, 0.84);
  font-family: ${mono};
  font-size: 1.1rem;
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease;

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: rgba(var(--item-accent-rgb, 76, 198, 193), 0.72);
    background: rgba(var(--item-accent-rgb, 76, 198, 193), 0.14);
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.24;
    cursor: default;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: ${({ $compact }) => ($compact ? '32px' : '42px')};
  }

  @media (max-width: 380px) {
    width: ${({ $compact }) => ($compact ? '30px' : '38px')};
  }
`;

export const CarouselTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  min-width: 0;
`;

export const CarouselTab = styled.button`
  display: grid;
  place-items: center;
  align-content: center;
  gap: 3px;
  min-width: 0;
  min-height: 25px;
  padding: 2px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: ${({ $active }) => ($active ? '#ffffff' : 'rgba(231, 236, 243, 0.46)')};
  font-family: ${mono};
  font-size: 0.52rem;
  font-weight: 720;
  letter-spacing: 0.03em;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    background: rgba(${({ $tone }) => carouselToneColor($tone)}, 0.08);
    color: #ffffff;
  }

  @media (max-width: 430px) {
    font-size: 0.46rem;
    letter-spacing: 0;
  }
`;

export const CarouselTabMark = styled.span`
  display: block;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: rgba(${({ $tone }) => carouselToneColor($tone)}, ${({ $active }) => ($active ? 0.92 : 0.34)});
  box-shadow: ${({ $active, $tone }) =>
    $active ? `0 0 8px rgba(${carouselToneColor($tone)}, 0.48)` : 'none'};
`;

export const CarouselOverview = styled.div`
  height: 100%;
  min-height: 100%;
  padding: 0;
`;

export const OverviewPhotoMax = styled.section`
  position: relative;
  isolation: isolate;
  display: grid;
  align-items: end;
  width: 100%;
  min-height: 560px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 24%, rgba(var(--item-accent-rgb, 76, 198, 193), 0.16), transparent 54%),
    #050a11;

  @media (max-width: ${MOBILE_BREAKPOINT}) { min-height: 540px; }
`;

export const OverviewPhotoStage = styled.div`
  position: absolute;
  z-index: 0;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
`;

export const OverviewPhotoBackdrop = styled.img`
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  object-fit: cover;
  opacity: 0.34;
  filter: blur(24px) saturate(1.22) brightness(0.7);
  transform: scale(1.06);
`;

export const OverviewPhoto = styled.img`
  position: absolute;
  inset: 18px 24px 170px;
  width: calc(100% - 48px);
  height: calc(100% - 188px);
  object-fit: contain;
  object-position: center 40%;
  filter: saturate(1.08) contrast(1.04) drop-shadow(0 20px 34px rgba(0, 0, 0, 0.54));

  @media (max-width: 500px) {
    inset: 12px 12px 220px;
    width: calc(100% - 24px);
    height: calc(100% - 232px);
  }
`;

export const OverviewPhotoPlaceholder = styled.div`
  position: absolute;
  z-index: 0;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(231, 236, 243, 0.24);
  font-family: ${mono};
  font-size: 0.68rem;
  letter-spacing: 0.16em;
`;

export const OverviewPhotoScrim = styled.div`
  position: absolute;
  z-index: 1;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(3, 7, 12, 0.32) 0%, transparent 24%, rgba(3, 7, 12, 0.34) 47%, rgba(3, 7, 12, 0.94) 78%, #03070c 100%),
    linear-gradient(90deg, rgba(3, 7, 12, 0.48), transparent 30% 70%, rgba(3, 7, 12, 0.46));
`;

export const OverviewPhotoOpen = styled.button`
  position: absolute;
  z-index: 4;
  top: 12px;
  right: 12px;
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid rgba(var(--item-accent-rgb, 76, 198, 193), 0.4);
  border-radius: 6px;
  background: rgba(4, 9, 15, 0.7);
  backdrop-filter: blur(10px);
  color: rgba(227, 248, 246, 0.82);
  font-family: ${mono};
  font-size: 0.56rem;
  font-weight: 740;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: zoom-in;

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: rgba(var(--item-accent-rgb, 76, 198, 193), 0.8);
    color: #ffffff;
  }
`;

export const OverviewOverlay = styled.div`
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: end;
  gap: 12px;
  width: 100%;
  min-width: 0;
  max-height: 100%;
  padding: 14px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    gap: 9px;
    padding: 10px;
  }
`;

export const OverviewIdentity = styled.div`
  display: grid;
  align-content: end;
  gap: 5px;
  min-width: 0;
  padding: 8px 9px;
  border-left: 2px solid rgba(var(--item-accent-rgb, 76, 198, 193), 0.58);
  background: rgba(4, 9, 15, 0.62);
`;

export const OverviewKicker = styled.span`
  color: rgba(var(--item-accent-rgb, 76, 198, 193), 0.82);
  font-family: ${mono};
  font-size: 0.53rem;
  font-weight: 760;
  letter-spacing: 0.14em;
  line-height: 1;
  text-transform: uppercase;
`;

export const OverviewTitle = styled.h3`
  margin: 0;
  color: #ffffff;
  font-size: clamp(1.28rem, 4vw, 2.2rem);
  font-weight: 830;
  letter-spacing: -0.035em;
  line-height: 0.98;
  text-wrap: balance;
`;

export const OverviewFactRail = styled.div`
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 6px;
`;

export const OverviewFact = styled.span`
  display: grid;
  gap: 2px;
  min-width: 92px;
  padding: 6px 8px;
  border-left: 2px solid rgba(var(--item-accent-rgb, 76, 198, 193), 0.58);
  background: rgba(255, 255, 255, 0.025);

  span {
    color: rgba(231, 236, 243, 0.4);
    font-family: ${mono};
    font-size: 0.47rem;
    font-weight: 720;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  strong {
    min-width: 0;
    color: rgba(245, 248, 252, 0.9);
    font-size: 0.69rem;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
`;

export const OverviewBoxId = styled.b`
  display: inline-block;
  margin-right: 0.34rem;
  color: rgba(var(--item-accent-rgb, 76, 198, 193), 0.96);
  font-family: ${mono};
  font-size: 0.83em;
  font-weight: 800;
  letter-spacing: 0.08em;
`;

export const OverviewBoxLabel = styled.span`
  color: rgba(245, 248, 252, 0.9);
`;

export const OverviewCategory = styled.span`
  align-self: center;
  padding: 0 2px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(226, 231, 255, 0.78);
  font-family: ${mono};
  font-size: 0.5rem;
`;

export const OverviewDescription = styled.p`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: rgba(235, 240, 246, 0.74);
  font-size: 0.68rem;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const OverviewTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  max-height: 34px;
  overflow: hidden;
  color: rgba(var(--item-accent-rgb, 76, 198, 193), 0.74);
  font-family: ${mono};
  font-size: 0.62rem;
  line-height: 1.3;
`;

export const OverviewTagLink = styled.a`
  color: inherit;
  text-decoration: none;
  transition: color 160ms ease, text-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    color: rgba(231, 255, 252, 0.98);
    outline: none;
    text-shadow: 0 0 10px rgba(var(--item-accent-rgb, 76, 198, 193), 0.5);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

export const OverviewCommandDeck = styled.div`
  display: grid;
  align-content: end;
  gap: 4px;
  min-width: 0;
  padding: 7px 0 0;
  border-top: 1px solid rgba(231, 236, 243, 0.12);
`;

export const OverviewCommandHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
`;

export const OverviewCommandLabel = styled.span`
  color: rgba(231, 236, 243, 0.46);
  font-family: ${mono};
  font-size: 0.52rem;
  font-weight: 760;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const OverviewConsumable = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0;
  color: rgba(231, 236, 243, 0.54);
  font-family: ${mono};
  font-size: 0.5rem;
  text-transform: uppercase;

  > button[role='switch'] { min-width: 34px; min-height: 20px; padding: 2px; }
`;

export const OverviewActivityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  min-width: 0;
`;

export const OverviewActivityButton = styled.button`
  display: grid;
  align-content: center;
  gap: 4px;
  min-width: 0;
  min-height: 52px;
  padding: 7px 8px;
  border: 1px solid rgba(126, 224, 173, 0.24);
  border-radius: 6px;
  background: rgba(126, 224, 173, 0.055);
  color: rgba(230, 246, 237, 0.82);
  text-align: left;
  cursor: pointer;

  strong {
    min-width: 0;
    font-size: 0.56rem;
    font-weight: 760;
    line-height: 1.05;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  span {
    min-width: 0;
    overflow: hidden;
    color: rgba(231, 236, 243, 0.38);
    font-family: ${mono};
    font-size: 0.43rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: rgba(126, 224, 173, 0.64);
    background: rgba(126, 224, 173, 0.12);
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.46;
    cursor: wait;
  }
`;

export const CarouselSection = styled.div`
  display: grid;
  align-content: start;
  gap: ${({ $compact }) => ($compact ? '10px' : '18px')};
  min-height: 100%;
  padding: ${({ $compact }) => ($compact ? '12px clamp(14px, 3vw, 24px)' : 'clamp(18px, 4vw, 34px)')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: ${({ $compact }) => ($compact ? '8px' : '14px')};
    padding: ${({ $compact }) => ($compact ? '10px 12px 14px' : '18px 14px 24px')};
  }
`;

export const QuickFacts = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  border-top: 1px solid rgba(231, 236, 243, 0.1);
  border-left: 1px solid rgba(231, 236, 243, 0.1);

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

export const ItemPageReference = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid rgba(231, 236, 243, 0.1);
  background: rgba(255, 255, 255, 0.018);
`;

export const ItemPageReferenceId = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;

  code {
    overflow: hidden;
    color: rgba(185, 221, 255, 0.88);
    font-family: ${mono};
    font-size: 0.62rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const ItemPageReferenceActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const itemPageReferenceAction = css`
  padding: 0;
  border: 0;
  color: rgba(133, 218, 211, 0.88);
  background: transparent;
  font-family: ${mono};
  font-size: 0.58rem;
  font-weight: 720;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    color: #c6fbf5;
    outline: none;
    text-decoration: underline;
  }
`;

export const ItemPageLink = styled.a`
  ${itemPageReferenceAction};
  text-decoration: none;
`;

export const CopyItemLinkButton = styled.button`
  ${itemPageReferenceAction};
  cursor: pointer;
`;

export const QuickFact = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
  min-height: 46px;
  padding: 8px 9px;
  border-right: 1px solid rgba(231, 236, 243, 0.1);
  border-bottom: 1px solid rgba(231, 236, 243, 0.1);
  background: rgba(255, 255, 255, 0.018);
`;

export const QuickFactHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`;

export const QuickFactEditButton = styled.button`
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  color: rgba(133, 218, 211, 0.74);
  background: transparent;
  font-size: 0.76rem;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #c6fbf5;
    outline: none;
    text-shadow: 0 0 8px rgba(133, 218, 211, 0.38);
  }
`;

export const QuickFactValue = styled.dd`
  min-width: 0;
  margin: 0;
  color: rgba(241, 245, 250, 0.82);
  font-size: 0.72rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
`;

export const QuickFactEditor = styled.div`
  display: grid;
  gap: 5px;
`;

const quickFactControl = css`
  width: 100%;
  min-width: 0;
  height: 28px;
  padding: 4px 6px;
  border: 1px solid rgba(133, 218, 211, 0.44);
  border-radius: 3px;
  color: rgba(247, 250, 253, 0.92);
  background: rgba(5, 11, 18, 0.82);
  font: inherit;
  font-size: 0.7rem;

  &:focus-visible {
    outline: 2px solid rgba(133, 218, 211, 0.72);
    outline-offset: 1px;
  }
`;

export const QuickFactInput = styled.input`
  ${quickFactControl};
`;

export const QuickFactEditorActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const quickFactAction = css`
  min-height: 22px;
  padding: 3px 5px;
  border-radius: 3px;
  font-family: ${mono};
  font-size: 0.5rem;
  font-weight: 740;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
`;

export const QuickFactSaveButton = styled.button`
  ${quickFactAction};
  border: 1px solid rgba(133, 218, 211, 0.48);
  color: rgba(206, 250, 244, 0.92);
  background: rgba(28, 94, 90, 0.28);
`;

export const QuickFactCancelButton = styled.button`
  ${quickFactAction};
  border: 1px solid rgba(231, 236, 243, 0.15);
  color: rgba(231, 236, 243, 0.62);
  background: transparent;
`;

export const QuickFactError = styled.span`
  color: rgba(255, 170, 160, 0.94);
  font-size: 0.6rem;
  line-height: 1.25;
`;

export const CarouselSectionIntro = styled.header`
  display: grid;
  gap: 7px;
  max-width: 660px;
`;

export const CarouselSectionKicker = styled.span`
  color: rgba(231, 236, 243, 0.46);
  font-family: ${mono};
  font-size: 0.58rem;
  font-weight: 760;
  letter-spacing: 0.15em;
  line-height: 1;
  text-transform: uppercase;
`;

export const CarouselSectionTitle = styled.h3`
  margin: 0;
  color: #f5f7fb;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 820;
  letter-spacing: -0.035em;
  line-height: 0.98;
`;

export const CarouselSectionCopy = styled.p`
  max-width: 58ch;
  margin: 0;
  color: rgba(231, 236, 243, 0.62);
  font-size: 0.78rem;
  line-height: 1.46;
`;

export const CarouselDetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

export const CarouselDetailField = styled.div`
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
  min-height: 72px;
  padding: 12px 13px;
  border: 1px solid rgba(231, 236, 243, 0.09);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
  grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
`;

export const CarouselDetailLabel = styled.span`
  color: rgba(231, 236, 243, 0.42);
  font-family: ${mono};
  font-size: 0.55rem;
  font-weight: 740;
  letter-spacing: 0.11em;
  line-height: 1;
  text-transform: uppercase;
`;

export const InlineFieldHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const InlineEditButton = styled.button`
  padding: 0;
  border: 0;
  color: rgba(133, 218, 211, 0.86);
  background: transparent;
  font-family: ${mono};
  font-size: 0.59rem;
  font-weight: 720;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #c6fbf5;
    outline: none;
    text-decoration: underline;
  }
`;

export const InlineEditor = styled.div`
  display: grid;
  gap: 8px;
`;

export const InlineTextarea = styled.textarea`
  width: 100%;
  resize: vertical;
  min-height: 78px;
  padding: 9px 10px;
  border: 1px solid rgba(133, 218, 211, 0.38);
  border-radius: 5px;
  color: rgba(247, 250, 253, 0.92);
  background: rgba(5, 11, 18, 0.78);
  font: inherit;
  font-size: 0.8rem;
  line-height: 1.45;

  &:focus-visible {
    outline: 2px solid rgba(133, 218, 211, 0.78);
    outline-offset: 1px;
  }
`;

export const InlineEditorActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const ReferenceRows = styled.div`
  display: grid;
  gap: 7px;
`;

export const ReferenceRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr) auto;
  gap: 6px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr auto;

    input:nth-child(2) {
      grid-column: 1 / -1;
    }
  }
`;

export const ReferenceInput = styled.input`
  min-width: 0;
  min-height: 31px;
  padding: 6px 8px;
  border: 1px solid rgba(133, 218, 211, 0.32);
  border-radius: 4px;
  color: rgba(247, 250, 253, 0.92);
  background: rgba(5, 11, 18, 0.78);
  font: inherit;
  font-size: 0.76rem;

  &:focus-visible {
    outline: 2px solid rgba(133, 218, 211, 0.78);
    outline-offset: 1px;
  }
`;

export const RemoveReferenceButton = styled.button`
  padding: 4px 2px;
  border: 0;
  color: rgba(255, 170, 160, 0.78);
  background: transparent;
  font-family: ${mono};
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: rgba(255, 193, 185, 0.98);
    outline: none;
    text-decoration: underline;
  }
`;

export const AddReferenceButton = styled.button`
  justify-self: start;
  padding: 2px 0;
  border: 0;
  color: rgba(133, 218, 211, 0.9);
  background: transparent;
  font-family: ${mono};
  font-size: 0.62rem;
  font-weight: 720;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #c6fbf5;
    outline: none;
    text-decoration: underline;
  }
`;

const inlineEditorButton = css`
  min-height: 28px;
  padding: 5px 10px;
  border-radius: 4px;
  font-family: ${mono};
  font-size: 0.62rem;
  font-weight: 720;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

export const InlineSaveButton = styled.button`
  ${inlineEditorButton};
  border: 1px solid rgba(133, 218, 211, 0.54);
  color: rgba(214, 255, 250, 0.94);
  background: rgba(28, 94, 90, 0.28);
`;

export const InlineCancelButton = styled.button`
  ${inlineEditorButton};
  border: 1px solid rgba(231, 236, 243, 0.16);
  color: rgba(231, 236, 243, 0.7);
  background: rgba(255, 255, 255, 0.025);
`;

export const InlineEditError = styled.p`
  margin: 0;
  color: rgba(255, 170, 160, 0.94);
  font-size: 0.72rem;
`;

export const CarouselDetailValue = styled.div`
  min-width: 0;
  color: rgba(241, 245, 250, 0.86);
  font-size: 0.78rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

export const CarouselNoteCard = styled.section`
  display: grid;
  gap: 12px;
  min-height: 150px;
  padding: clamp(18px, 4vw, 30px);
  border: 1px solid rgba(197, 167, 255, 0.32);
  border-radius: 10px;
  background:
    radial-gradient(circle at 100% 0%, rgba(197, 167, 255, 0.14), transparent 44%),
    rgba(55, 39, 85, 0.12);
`;

export const CarouselNoteText = styled.div`
  color: rgba(247, 243, 255, 0.9);
  font-size: clamp(1rem, 2.4vw, 1.35rem);
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

export const CarouselNoteOpen = styled.button`
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: zoom-in;

  &:focus-visible {
    outline: 2px solid rgba(197, 167, 255, 0.82);
    outline-offset: 4px;
  }
`;

export const CostHeroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

export const CostHeroCard = styled.section`
  display: grid;
  align-content: space-between;
  gap: 16px;
  min-height: 140px;
  padding: 18px;
  border: 1px solid rgba(239, 186, 91, 0.28);
  border-radius: 10px;
  background:
    radial-gradient(circle at 90% 0%, rgba(239, 186, 91, 0.15), transparent 46%),
    rgba(89, 62, 19, 0.1);
`;

export const CostHeroValue = styled.strong`
  color: rgba(255, 240, 206, 0.92);
  font-family: ${mono};
  font-size: clamp(1.5rem, 5vw, 2.8rem);
  font-weight: 720;
  letter-spacing: -0.045em;
  line-height: 1;
  overflow-wrap: anywhere;
`;

export const ActivityModeButton = styled.button`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 48px;
  padding: 9px 11px;
  border: 1px solid ${({ $active }) => (
    $active ? 'rgba(126, 224, 173, 0.52)' : 'rgba(231, 236, 243, 0.16)'
  )};
  border-radius: 6px;
  color: rgba(235, 241, 247, 0.88);
  background: ${({ $active }) => (
    $active ? 'rgba(36, 85, 66, 0.2)' : 'rgba(255, 255, 255, 0.018)'
  )};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: ${({ $active }) => (
      $active ? 'rgba(126, 224, 173, 0.82)' : 'rgba(133, 218, 211, 0.68)'
    )};
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  &:focus-visible {
    outline: 2px solid rgba(133, 218, 211, 0.74);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.58;
  }
`;

export const ActivityModeCopy = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    color: rgba(245, 248, 251, 0.92);
    font-size: 0.78rem;
    font-weight: 760;
  }

  span {
    color: rgba(231, 236, 243, 0.48);
    font-size: 0.62rem;
    line-height: 1.25;
  }
`;

export const ActivityModeState = styled.span`
  color: ${({ $active }) => ($active ? 'rgba(182, 249, 209, 0.96)' : 'rgba(231, 236, 243, 0.58)')};
  font-family: ${mono};
  font-size: 0.61rem;
  font-weight: 760;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const CarouselActivityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

export const CarouselActivityButton = styled.button`
  position: relative;
  display: grid;
  align-content: space-between;
  gap: 18px;
  min-height: 132px;
  padding: 15px;
  border: 1px solid rgba(126, 224, 173, 0.25);
  border-radius: 9px;
  background:
    linear-gradient(145deg, rgba(126, 224, 173, 0.09), transparent 60%),
    rgba(255, 255, 255, 0.02);
  color: rgba(231, 236, 243, 0.8);
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: rgba(126, 224, 173, 0.66);
    background:
      linear-gradient(145deg, rgba(126, 224, 173, 0.16), transparent 64%),
      rgba(255, 255, 255, 0.025);
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.46;
    cursor: wait;
  }

  @media (max-width: 500px) {
    min-height: 92px;
    gap: 10px;
  }
`;

export const CarouselActivityCommand = styled.strong`
  font-size: 0.92rem;
  font-weight: 790;
`;

export const CarouselActivityTime = styled.span`
  color: rgba(231, 236, 243, 0.46);
  font-family: ${mono};
  font-size: 0.54rem;
  line-height: 1.3;
`;

export const CarouselActivityArrow = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  color: rgba(126, 224, 173, 0.56);
  font-family: ${mono};
  font-size: 0.78rem;
`;

export const DossierTop = styled.div`
  display: grid;
  gap: 12px;
  min-width: 0;

  @media (min-width: 600px) {
    grid-template-columns: ${({ $hasImage }) =>
      $hasImage ? 'minmax(210px, 0.86fr) minmax(0, 1.14fr)' : 'minmax(0, 1fr)'};
    align-items: start;
  }
`;

export const ContextColumn = styled.div`
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 8px;
  }
`;

export const ImageButton = styled.button`
  position: relative;
  display: block;
  width: 100%;
  height: clamp(220px, 38vh, 280px);
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(76, 198, 193, 0.28);
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 42%, rgba(167, 182, 255, 0.1), transparent 62%),
    #07101a;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 12px 28px rgba(0, 0, 0, 0.22);
  cursor: ${({ $interactive }) => ($interactive ? 'zoom-in' : 'default')};
  transition: border-color 200ms ease, box-shadow 200ms ease;

  &:disabled {
    opacity: 1;
  }

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: rgba(96, 218, 208, 0.7);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 12px 30px rgba(0, 0, 0, 0.28),
      0 0 18px rgba(76, 198, 193, 0.12);
  }

  @media (min-width: 600px) {
    height: clamp(260px, 42vh, 360px);
  }
`;

export const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
`;

export const ExpandMark = styled.span`
  position: absolute;
  right: 0;
  bottom: 0;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-top: 1px solid rgba(167, 182, 255, 0.42);
  border-left: 1px solid rgba(167, 182, 255, 0.42);
  border-radius: 6px 0 0;
  background: rgba(6, 11, 19, 0.86);
  color: rgba(220, 226, 255, 0.86);
  font-size: 0.8rem;
  line-height: 1;
`;

export const FinderFacts = styled.section`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

export const FactPair = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(231, 236, 243, 0.09);

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

export const Fact = styled.div`
  display: grid;
  gap: 3px;
  min-width: 0;
`;

export const Label = styled.span`
  color: rgba(231, 236, 243, 0.48);
  font-family: ${mono};
  font-size: 0.56rem;
  font-weight: 720;
  letter-spacing: 0.09em;
  line-height: 1;
  text-transform: uppercase;
`;

export const FactValue = styled.span`
  min-width: 0;
  color: #edf3f8;
  font-size: 0.84rem;
  font-weight: 690;
  line-height: 1.25;
  overflow-wrap: anywhere;
`;

export const BoxId = styled.span`
  margin-right: 5px;
  color: #69d2cc;
  font-family: ${mono};
  font-size: 0.78rem;
  letter-spacing: 0.04em;
`;

export const Description = styled.p`
  margin: 0;
  color: rgba(231, 236, 243, 0.74);
  font-size: 0.8rem;
  line-height: 1.38;
  overflow-wrap: anywhere;
`;

export const MetaLine = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  min-width: 0;
  color: rgba(231, 236, 243, 0.5);
  font-family: ${mono};
  font-size: 0.61rem;
  line-height: 1.35;
`;

export const MetaItem = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;

  &::before {
    content: '#';
    margin-right: 2px;
    color: rgba(76, 198, 193, 0.7);
  }
`;

export const Category = styled.span`
  color: rgba(205, 214, 232, 0.62);
`;

export const DecisionGroup = styled.section`
  display: grid;
  gap: 5px;
  min-width: 0;
`;

export const DeclutterButton = styled.button`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 32px;
  padding: 5px 8px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(211, 218, 255, 0.84)' : 'rgba(167, 182, 255, 0.5)'};
  border-radius: 7px;
  background:
    ${({ $active }) =>
      $active
        ? 'linear-gradient(105deg, rgba(93, 86, 175, 0.74), rgba(53, 50, 111, 0.72))'
        : 'linear-gradient(105deg, rgba(70, 65, 135, 0.5), rgba(34, 36, 76, 0.58))'};
  color: #f5f6ff;
  text-align: left;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active
      ? '0 0 0 1px rgba(167, 182, 255, 0.16), 0 0 18px rgba(133, 121, 224, 0.14)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.045)'};
  transition: border-color 200ms ease, background 200ms ease, box-shadow 200ms ease,
    transform 180ms ease;

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: rgba(220, 225, 255, 0.94);
    box-shadow:
      0 0 0 1px rgba(167, 182, 255, 0.2),
      0 0 20px rgba(133, 121, 224, 0.18);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.56;
    cursor: wait;
  }
`;

export const DeclutterCopy = styled.span`
  display: grid;
  gap: 0;
  min-width: 0;
`;

export const DeclutterTitle = styled.strong`
  font-size: 0.7rem;
  font-weight: 790;
  line-height: 1.05;
`;

export const DeclutterHint = styled.span`
  color: rgba(229, 232, 255, 0.62);
  font-size: 0.66rem;
  line-height: 1.15;
`;

export const DeclutterGlyph = styled.span`
  color: rgba(231, 234, 255, 0.74);
  font-family: ${mono};
  font-size: 0.74rem;
`;

export const SecondaryActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

export const SecondaryButton = styled.button`
  min-height: 34px;
  padding: 5px 9px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'move'
        ? 'rgba(232, 177, 92, 0.38)'
        : 'rgba(231, 236, 243, 0.2)'};
  border-radius: 6px;
  background: ${({ $tone }) =>
    $tone === 'move' ? 'rgba(98, 69, 29, 0.18)' : 'rgba(255, 255, 255, 0.025)'};
  color: ${({ $tone }) =>
    $tone === 'move' ? 'rgba(248, 213, 157, 0.86)' : 'rgba(231, 236, 243, 0.78)'};
  font-size: 0.66rem;
  font-weight: 720;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: border-color 180ms ease, color 180ms ease, background 180ms ease;

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: ${({ $tone }) =>
      $tone === 'move' ? 'rgba(232, 177, 92, 0.72)' : 'rgba(76, 198, 193, 0.56)'};
    color: #ffffff;
  }
`;

export const Disclosure = styled.section`
  min-width: 0;
  border-top: 1px solid rgba(231, 236, 243, 0.09);
`;

export const DisclosureButton = styled.button`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 8px 2px;
  border: 0;
  background: transparent;
  color: rgba(231, 236, 243, 0.7);
  font-size: 0.72rem;
  font-weight: 710;
  letter-spacing: 0.035em;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    color: #ffffff;
  }
`;

export const DisclosureState = styled.span`
  color: rgba(167, 182, 255, 0.58);
  font-family: ${mono};
  font-size: 0.62rem;
`;

export const DisclosureBody = styled.div`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: translate3d(0, ${({ $open }) => ($open ? '0' : '-5px')}, 0);
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition:
    grid-template-rows 300ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear ${({ $open }) => ($open ? '0ms' : '300ms')};

  > div {
    min-height: 0;
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const DetailRows = styled.div`
  display: grid;
  padding-bottom: 8px;
`;

export const DetailRow = styled.div`
  display: grid;
  grid-template-columns: minmax(86px, 0.34fr) minmax(0, 1fr);
  gap: 10px;
  padding: 8px 2px;
  border-top: 1px solid rgba(231, 236, 243, 0.065);

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
    gap: 3px;
  }
`;

export const DetailValue = styled.div`
  min-width: 0;
  color: rgba(231, 236, 243, 0.78);
  font-size: 0.72rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

export const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
`;

export const BreadcrumbNode = styled.span`
  color: rgba(231, 236, 243, 0.72);

  strong {
    margin-right: 4px;
    color: rgba(105, 210, 204, 0.82);
    font-family: ${mono};
    font-weight: 680;
  }
`;

export const ExternalLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const ExternalLink = styled.a`
  color: rgba(133, 218, 211, 0.88);
  text-decoration: none;

  &:hover,
  &:focus-visible {
    outline: none;
    color: #bff5ef;
    text-decoration: underline;
  }
`;

export const ActivityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding-bottom: 8px;

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

export const ActivityButton = styled.button`
  display: grid;
  gap: 4px;
  min-height: 46px;
  padding: 7px 8px;
  border: 1px solid rgba(231, 236, 243, 0.13);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
  color: rgba(231, 236, 243, 0.7);
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: rgba(76, 198, 193, 0.46);
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.48;
    cursor: wait;
  }
`;

export const ActivityTitle = styled.span`
  font-size: 0.67rem;
  font-weight: 720;
`;

export const ActivityTime = styled.span`
  color: rgba(231, 236, 243, 0.4);
  font-family: ${mono};
  font-size: 0.52rem;
  line-height: 1.2;
`;

export const EmptyDetail = styled.span`
  color: rgba(231, 236, 243, 0.4);
  font-size: 0.68rem;
`;

export const UtilityAccent = styled.span`
  ${({ $tone }) =>
    $tone === 'mint' &&
    css`
      color: rgba(126, 224, 173, 0.86);
    `}
`;
