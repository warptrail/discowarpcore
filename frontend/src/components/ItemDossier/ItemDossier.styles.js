import styled, { css } from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const mono =
  "'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export const Dossier = styled.div`
  min-width: 0;
  padding: 12px;
  color: #e7ecf3;
  background:
    radial-gradient(circle at 12% 0%, rgba(76, 198, 193, 0.055), transparent 34%),
    linear-gradient(180deg, rgba(15, 21, 30, 0.98), rgba(9, 14, 21, 0.99));

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 8px;
  }
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
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 100%;
  height: clamp(520px, calc(100svh - 124px), 820px);
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--item-accent-rgb, 76, 198, 193), 0.34);
  border-radius: 10px;
  background: #080d14;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 18px 46px rgba(0, 0, 0, 0.3);

  @supports (height: 100dvh) {
    height: clamp(520px, calc(100dvh - 124px), 820px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    height: clamp(500px, calc(100svh - 124px), 760px);
    border-radius: 8px;

    @supports (height: 100dvh) {
      height: clamp(500px, calc(100dvh - 124px), 760px);
    }
  }
`;

export const CarouselHeader = styled.header`
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 58px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(231, 236, 243, 0.09);
  background:
    linear-gradient(90deg, rgba(var(--item-accent-rgb, 76, 198, 193), 0.12), transparent 46%),
    rgba(8, 13, 20, 0.96);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 52px;
    padding: 8px 10px;
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
  min-height: 0;
  overflow: hidden;
`;

export const CarouselTrack = styled.div`
  display: flex;
  width: 500%;
  height: 100%;
  transform: translate3d(calc(${({ $activeIndex }) => $activeIndex} * -20%), 0, 0);
  transition: transform 460ms cubic-bezier(0.22, 1, 0.36, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CarouselSlide = styled.article`
  position: relative;
  width: 20%;
  height: 100%;
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

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: linear-gradient(
      180deg,
      rgba(${({ $tone }) => carouselToneColor($tone)}, 0.92),
      rgba(${({ $tone }) => carouselToneColor($tone)}, 0.06)
    );
    pointer-events: none;
  }
`;

export const CarouselSlideScroll = styled.div`
  height: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: rgba(var(--item-accent-rgb, 76, 198, 193), 0.28) transparent;
`;

export const CarouselNavigation = styled.nav`
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 8px;
  min-height: 62px;
  padding: 8px;
  border-top: 1px solid rgba(231, 236, 243, 0.1);
  background: rgba(6, 10, 16, 0.96);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 58px;
    gap: 5px;
    padding: 6px;
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
  gap: 5px;
  min-width: 0;
  min-height: 44px;
  padding: 4px 2px;
  border: 1px solid
    rgba(${({ $tone }) => carouselToneColor($tone)}, ${({ $active }) => ($active ? 0.6 : 0.12)});
  border-radius: 6px;
  background: rgba(
    ${({ $tone }) => carouselToneColor($tone)},
    ${({ $active }) => ($active ? 0.12 : 0.018)}
  );
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
    border-color: rgba(${({ $tone }) => carouselToneColor($tone)}, 0.62);
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
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 24%, rgba(var(--item-accent-rgb, 76, 198, 193), 0.16), transparent 54%),
    #050a11;
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
  gap: 7px;
  min-width: 0;
  padding: 12px;
  border: 1px solid rgba(var(--item-accent-rgb, 76, 198, 193), 0.22);
  border-radius: 9px;
  background: rgba(4, 9, 15, 0.7);
  backdrop-filter: blur(12px);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
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

export const OverviewCategory = styled.span`
  align-self: center;
  padding: 6px 9px;
  border: 1px solid rgba(var(--item-secondary-rgb, 167, 182, 255), 0.34);
  border-radius: 999px;
  background: rgba(var(--item-secondary-rgb, 167, 182, 255), 0.09);
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
  font-size: 0.49rem;
  line-height: 1.3;
`;

export const OverviewCommandDeck = styled.div`
  display: grid;
  align-content: end;
  gap: 8px;
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(231, 236, 243, 0.12);
  border-radius: 9px;
  background: rgba(4, 8, 14, 0.78);
  backdrop-filter: blur(13px);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.28);
`;

export const OverviewCommandHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  gap: 7px;
  color: rgba(231, 236, 243, 0.54);
  font-family: ${mono};
  font-size: 0.5rem;
  text-transform: uppercase;

  > button[role='switch'] {
    min-width: 82px;
    min-height: 34px;
    padding: 4px 8px;
  }
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
  gap: 18px;
  min-height: 100%;
  padding: clamp(18px, 4vw, 34px);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 14px;
    padding: 18px 14px 24px;
  }
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

export const CarouselSlideAction = styled.button`
  justify-self: start;
  min-height: 42px;
  padding: 8px 14px;
  border: 1px solid rgba(197, 167, 255, 0.34);
  border-radius: 7px;
  background: rgba(197, 167, 255, 0.07);
  color: rgba(239, 232, 255, 0.82);
  font-size: 0.7rem;
  font-weight: 740;
  letter-spacing: 0.035em;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: rgba(197, 167, 255, 0.72);
    color: #ffffff;
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

export const ConsumableControl = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 16px;
  border: 1px solid rgba(239, 186, 91, 0.24);
  border-radius: 10px;
  background: rgba(239, 186, 91, 0.055);

  @media (max-width: 430px) {
    grid-template-columns: 1fr;
  }
`;

export const ConsumableCopy = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

export const ConsumableTitle = styled.strong`
  color: rgba(255, 243, 216, 0.92);
  font-size: 0.88rem;
  font-weight: 780;
`;

export const ConsumableHint = styled.span`
  max-width: 58ch;
  color: rgba(231, 236, 243, 0.54);
  font-size: 0.68rem;
  line-height: 1.4;
`;

export const ConsumableSwitch = styled.button`
  position: relative;
  display: grid;
  grid-template-columns: 26px auto;
  align-items: center;
  gap: 8px;
  min-width: 94px;
  min-height: 44px;
  padding: 7px 11px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(126, 224, 173, 0.72)' : 'rgba(231, 236, 243, 0.2)')};
  border-radius: 999px;
  background: ${({ $active }) =>
    $active ? 'rgba(45, 127, 83, 0.24)' : 'rgba(255, 255, 255, 0.035)'};
  color: ${({ $active }) => ($active ? '#c9f8dc' : 'rgba(231, 236, 243, 0.62)')};
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    outline: none;
    border-color: rgba(126, 224, 173, 0.82);
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.54;
    cursor: wait;
  }
`;

export const ConsumableSwitchThumb = styled.span`
  display: block;
  width: 26px;
  height: 16px;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#7ee0ad' : 'rgba(231, 236, 243, 0.25)')};
  box-shadow: inset
    ${({ $active }) => ($active ? '10px' : '-10px')}
    0 0 -5px rgba(7, 13, 19, 0.88);
`;

export const ConsumableSwitchLabel = styled.span`
  font-family: ${mono};
  font-size: 0.6rem;
  font-weight: 740;
  letter-spacing: 0.06em;
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
  gap: 8px;
  min-width: 0;
`;

export const DeclutterButton = styled.button`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 8px 10px 8px 12px;
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
  gap: 3px;
  min-width: 0;
`;

export const DeclutterTitle = styled.strong`
  font-size: 0.86rem;
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
  min-height: 40px;
  padding: 7px 10px;
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
  font-size: 0.72rem;
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
