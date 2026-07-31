import styled, { css } from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const mono =
  "'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export const Dossier = styled.div`
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  color: #e7ecf3;
  background:
    radial-gradient(circle at 12% 0%, rgba(76, 198, 193, 0.055), transparent 34%),
    linear-gradient(180deg, rgba(15, 21, 30, 0.98), rgba(9, 14, 21, 0.99));

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 8px;
    gap: 8px;
  }
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
