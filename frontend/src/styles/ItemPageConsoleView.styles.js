import { controlStyles } from './primitives';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { MOBILE_BREAKPOINT } from './tokens';

const uiFont = 'var(--dw-font-ui)';

const DOMAIN_RGB = {
  amber: '238, 181, 77',
  blue: '88, 178, 255',
  cyan: '72, 224, 229',
  green: '102, 220, 154',
  indigo: '126, 151, 255',
  lilac: '190, 151, 255',
  neutral: '157, 174, 189',
  orange: '244, 143, 78',
  red: '246, 105, 124',
  rose: '237, 118, 183',
  teal: '76, 198, 193',
  violet: '174, 123, 255',
};

const domainRgb = (tone) => DOMAIN_RGB[tone] || DOMAIN_RGB.neutral;

export const WikiHero = styled.section`
  overflow: hidden;
  border: 1px solid rgba(230, 237, 243, 0.12);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
`;

export const WikiImageButton = styled.button`
  ${controlStyles}
  position: relative;
  display: block;
  width: 100%;
  min-height: 190px;
  max-height: 360px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: var(--dw-background);
  cursor: zoom-in;

  &:focus-visible {
    outline: 2px solid var(--item-accent, #7fd7ff);
    outline-offset: -3px;
  }
`;

export const WikiImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 220ms ease, filter 220ms ease;

  ${WikiImageButton}:hover & {
    transform: scale(1.012);
    filter: brightness(1.05);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const WikiImageCaption = styled.span`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.42rem 0.56rem;
  background: var(--dw-surface-raised);
  color: rgba(239, 248, 252, 0.9);
  pointer-events: none;
`;

export const WikiImageKicker = styled.span`
  color: var(--item-accent, #7fd7ff);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const WikiImageAction = styled.span`
  color: var(--dw-text-secondary);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const WikiImagePlaceholder = styled.div`
  display: grid;
  place-content: center;
  gap: 0.45rem;
  min-height: 120px;
  color: var(--dw-text-secondary);
  text-align: center;
`;

export const WikiFactRail = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.2);
  background: var(--dw-surface-raised);
`;

export const WikiFact = styled.div`
  display: grid;
  gap: 0.18rem;
  min-width: 0;
  padding: 0.42rem 0.52rem;
  border-right: 1px solid rgba(214, 226, 241, 0.08);

  &:last-child {
    border-right: 0;
  }
`;

export const WikiFactLabel = styled.span`
  color: var(--dw-text-secondary);
  font: 760 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const WikiFactValue = styled.span`
  overflow: hidden;
  color: rgba(242, 248, 251, 0.9);
  font-size: 0.75rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const WikiHeroCommandRail = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 0.6rem;
  min-height: 34px;
  padding: 0.32rem 0.42rem 0.32rem 0.54rem;
  border-top: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.18);
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }
`;

export const WikiHeroCommandCopy = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem;
  min-width: 0;
  color: var(--dw-text-secondary);
  font: 680 0.75rem/1.3 ${uiFont};
  letter-spacing: 0.01em;

  strong {
    color: var(--item-secondary, #a7b6ff);
    letter-spacing: 0.01em;
  }
`;

export const WikiHeroEditButton = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  padding: 0.28rem 0.58rem;
  border: 1px solid ${({ $active }) =>
    $active
      ? 'var(--item-accent, #7fd7ff)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.52)'};
  border-radius: var(--dw-radius);
  color: ${({ $active }) => ($active ? '#f4fdff' : 'var(--item-accent, #7fd7ff)')};
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.18)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.07)'};
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: var(--item-accent, #7fd7ff);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: auto;
  }
`;

export const MediaEditorPanel = styled.section`
  position: relative;
  display: grid;
  gap: 0.6rem;
  padding: 0.7rem;
  overflow: hidden;
  border: 1px solid rgba(230, 237, 243, 0.14);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--dw-cyan);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.52rem;
  }
`;

export const MediaEditorHeader = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
  padding-left: 0.2rem;
  color: var(--dw-text-secondary);
  font: 720 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;

  strong {
    color: var(--item-accent, #7fd7ff);
    font-size: 0.75rem;
  }
`;

export const ConsoleFrame = styled.section`
  overflow: hidden;
  border: 1px solid rgba(230, 237, 243, 0.12);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  box-shadow: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;

  ${({ $fieldMode }) => $fieldMode && `
    overflow: visible;
    border-color: var(--dw-cyan);
    box-shadow: none;
  `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
`;

export const FieldLocatorStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 38px;
  padding: 0.38rem 0.58rem;
  border-bottom: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.36);
  background: var(--dw-surface-raised);
  color: rgba(225, 237, 244, 0.7);
  font: 700 0.75rem/1.3 ${uiFont};
  letter-spacing: 0.01em;

  strong {
    color: var(--item-accent, #7fd7ff);
    letter-spacing: 0.01em;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.16rem;
    padding: 0.45rem 0.52rem;
  }
`;

export const TableToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.58rem;
  color: rgba(213, 232, 241, 0.7);
  background: var(--dw-surface-raised);
  font: 760 0.75rem/1.3 ${uiFont};
  text-transform: none;
`;

export const EmptyFieldsToggle = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--item-accent, #7fd7ff);
  border-radius: var(--dw-radius-sm);
  color: var(--item-accent, #7fd7ff);
  background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.08);
  font: inherit;
  cursor: pointer;
  &[aria-pressed='true'] { background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.2); }
  &:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
`;

export const ConsoleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: rgba(234, 243, 247, 0.9);

  th { padding: 0.42rem 0.58rem; color: var(--dw-text-secondary); border-bottom: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.34); background: var(--dw-surface-raised); font: 760 0.75rem/1 ${uiFont}; letter-spacing: 0.01em; text-align: left; text-transform: none; }
  th:first-child { width: 18%; } th:nth-child(2) { width: 25%; }
  tr {
    border-bottom: 1px solid rgba(197, 219, 230, 0.06);
    background: transparent;
    transition: background 140ms ease;
  }
  tr:hover { background: var(--dw-surface-raised); }
  tr:last-child { border-bottom: 0; }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: block;
    thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    tr, td { box-sizing: border-box; }
    tr {
      display: grid;
      grid-template-columns: minmax(82px, 0.28fr) minmax(0, 1fr);
      width: 100%;
    }
    td { display: block; width: auto; }
  }
`;

export const DomainGroup = styled.tbody`
  --domain-rgb: ${({ $tone }) => domainRgb($tone)};
  --domain-color: rgb(var(--domain-rgb));
  position: relative;
  z-index: ${({ $active }) => ($active ? 40 : 1)};

  & + & > tr:first-child { border-top: 0; }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: block;
    margin-bottom: 0.46rem;
    overflow: ${({ $active }) => ($active ? 'visible' : 'hidden')};
    border: 1px solid rgba(var(--domain-rgb), 0.2);
    border-radius: var(--dw-radius);
    background: var(--dw-surface);
    box-shadow: inset 3px 0 0 rgba(var(--domain-rgb), 0.72);

    & + & > tr:first-child {
      border-top: 0;
    }
  }
`;

export const DomainCell = styled.td`
  width: 18%;
  padding: 0.4rem 0.58rem;
  color: ${({ $first }) => ($first ? 'var(--domain-color)' : 'transparent')};
  font: 700 0.75rem/1.15 ${uiFont};
  letter-spacing: 0.01em;
  vertical-align: top;
  text-transform: none;



  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: ${({ $first }) => ($first ? 'flex' : 'none')} !important;
    grid-column: 1 / -1;
    align-items: center;
    width: auto;
    min-height: 34px;
    margin: -0.12rem -0.4rem 0.08rem;
    padding: 0.34rem 0.46rem;
    border-bottom: 1px solid rgba(var(--domain-rgb), 0.23);
    background: var(--dw-surface-raised);
    color: var(--domain-color);
    font-size: 0.75rem;
    letter-spacing: 0.01em;
  }
`;

export const AttributeCell = styled.td`
  padding: 0.4rem 0.58rem;
  color: var(--dw-text-secondary);
  font: 720 0.75rem/1.3 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
  vertical-align: top;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-column: 1;
    align-self: center;
    padding: 0.18rem 0.28rem 0.18rem 0;
    color: rgba(var(--domain-rgb), 0.78);
    font-size: 0.75rem;
    line-height: 1.3;
    letter-spacing: 0.01em;
  }
`;

export const ValueCell = styled.td`
  padding: 0.4rem 0.58rem;
  color: rgba(241, 248, 251, 0.9);
  font-size: 0.78rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
  vertical-align: top;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-column: 2;
    align-self: center;
    min-width: 0;
    padding: 0 0 0 0.18rem;
    font-size: 0.75rem;
  }
`;

export const ConsoleRow = styled.tr`
  position: relative;
  opacity: ${({ $dimmed }) => ($dimmed ? 0.36 : 1)};
  background: ${({ $active, $locator }) =>
    $active
      ? 'rgba(var(--domain-rgb), 0.105)'
      : $locator
        ? 'rgba(var(--domain-rgb), 0.025)'
        : 'transparent'};
  transition: opacity 150ms ease, background 150ms ease;

  ${({ $editable, $locator }) => $editable && $locator && `
    box-shadow: inset 4px 0 0 rgba(var(--domain-rgb), 0.56);
  `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.12rem 0.4rem;
    border-bottom-color: rgba(var(--domain-rgb), 0.12);
    background: ${({ $active, $locator }) =>
      $active
        ? 'rgba(var(--domain-rgb), 0.105)'
        : $locator
          ? 'rgba(var(--domain-rgb), 0.025)'
          : 'transparent'};

    ${({ $editable, $locator }) => $editable && $locator && `
      box-shadow: inset 3px 0 0 rgba(var(--domain-rgb), 0.56);
    `}
  }
`;

export const EditableValueButton = styled.button`
  ${controlStyles}
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 44px;
  margin: -0.24rem 0;
  padding: 0.32rem 0.42rem;
  border: 1px solid ${({ $active, $locator }) =>
    $active
      ? 'rgb(var(--domain-rgb))'
      : $locator
        ? 'rgba(var(--domain-rgb), 0.42)'
        : 'transparent'};
  border-radius: var(--dw-radius);
  color: inherit;
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--domain-rgb), 0.12)'
      : 'transparent'};
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;

  &:hover,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: rgba(var(--domain-rgb), 0.72);
    background: rgba(var(--domain-rgb), 0.09);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    margin: -0.06rem 0;
    padding: 0.24rem 0.3rem;
    border-color: ${({ $active, $locator }) =>
      $active
        ? 'rgb(var(--domain-rgb))'
        : $locator
          ? 'rgba(var(--domain-rgb), 0.42)'
          : 'transparent'};
    background: ${({ $active }) =>
      $active ? 'rgba(var(--domain-rgb), 0.1)' : 'transparent'};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const EditableValueCopy = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const NotePreviewRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  margin: -0.24rem 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin: -0.06rem 0;
  }
`;

export const NotePreviewButton = styled.button`
  ${controlStyles}
  display: grid;
  align-items: start;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  min-height: 44px;
  overflow: hidden;
  padding: 0.32rem 0.42rem;
  border: 1px solid transparent;
  border-radius: var(--dw-radius);
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: rgba(var(--domain-rgb), 0.58);
    background: rgba(var(--domain-rgb), 0.08);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.24rem 0.3rem;
  }
`;

export const NotePreview = styled.span`
  display: -webkit-box;
  min-width: 0;
  max-width: 100%;
  max-height: 2.7em;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow-wrap: anywhere;
  line-height: 1.35;
  text-overflow: ellipsis;
`;

export const NoteEditButton = styled.button`
  ${controlStyles}
  align-self: center;
  box-sizing: border-box;
  min-height: 0;
  height: fit-content;
  white-space: nowrap;
  margin-top: 0;
  padding: 0.16rem 0.2rem;
  border: 0;
  border-left: 1px solid var(--domain-color, var(--item-accent, #c9a7ff));
  color: var(--domain-color, var(--item-accent, #c9a7ff));
  background: rgba(var(--domain-rgb), 0.08);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: 1px solid rgba(var(--domain-rgb), 0.72);
    background: rgba(var(--domain-rgb), 0.16);
  }
`;

export const TagValueEditorRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  margin: -0.24rem 0;
  padding: 0.32rem 0.42rem;
  border: 1px solid transparent;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    margin: -0.06rem 0;
    padding: 0.24rem 0.3rem;
  }
`;

export const EditableTagButton = styled.button`
  ${controlStyles}
  align-self: start;
  padding: 0.16rem 0.2rem;
  border: 0;
  border-left: 1px solid var(--domain-color, var(--item-accent, #7fd7ff));
  color: var(--domain-color, var(--item-accent, #7fd7ff));
  background: rgba(var(--domain-rgb), 0.08);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: 1px solid rgba(var(--domain-rgb), 0.72);
    background: rgba(var(--domain-rgb), 0.16);
  }
`;

export const TagLinks = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.12rem 0.44rem;
  min-width: 0;
  color: var(--item-secondary, #a7b6ff);
  font: 700 0.75rem/1.3 ${uiFont};
  letter-spacing: 0.01em;
`;

export const TagLink = styled(Link)`
  color: #82d9d4;
  text-decoration: none;

  &::before { content: '#'; color: rgba(130, 217, 212, 0.52); }

  &:hover,
  &:focus-visible {
    color: #d8fffa;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

export const EditableSignal = styled.span`
  align-self: start;
  padding: 0.16rem 0.2rem;
  border-left: 1px solid var(--domain-color, var(--item-accent, #7fd7ff));
  color: var(--domain-color, var(--item-accent, #7fd7ff));
  background: rgba(var(--domain-rgb), 0.08);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
`;

export const FieldEditorRow = styled.tr`
  position: relative;
  z-index: 50;
  padding: 0 !important;
  border-bottom: 1px solid rgba(var(--domain-rgb), 0.52) !important;
  background: var(--dw-surface-raised);
`;

export const FieldEditorCell = styled.td`
  position: relative;
  z-index: 50;
  overflow: visible;
  width: 100% !important;
  grid-column: 1 / -1;
  padding: 0.48rem !important;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.34rem !important;
  }
`;

export const Empty = styled.span`color: var(--dw-text-secondary);`;
export const ConsoleLink = styled(Link)`color: var(--item-secondary, #a7b6ff); font-weight: 720; text-decoration: none; &:hover, &:focus-visible { color: var(--item-accent, #7fd7ff); text-decoration: underline; text-underline-offset: 2px; }`;
export const ExternalLinksList = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
`;
export const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0.28rem 0.48rem;
  border: 1px solid rgba(var(--domain-rgb), 0.35);
  border-radius: var(--dw-radius);
  color: rgb(var(--domain-rgb));
  background: rgba(var(--domain-rgb), 0.07);
  font-weight: 720;
  text-decoration: none;

  &::after {
    content: '↗';
    margin-left: 0.34rem;
    font: 700 0.75rem/1 ${uiFont};
    opacity: 0.66;
  }

  &:hover,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: rgba(var(--domain-rgb), 0.74);
    color: #f2ffff;
    box-shadow: none;
  }
`;
export const ImageCommand = styled.button`
  ${controlStyles}margin: 0.5rem; min-height: var(--dw-control-height); padding: 0.3rem 0.58rem; border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.56); border-radius: var(--dw-radius-sm); background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.08); color: var(--item-accent, #7fd7ff); font: 760 0.75rem/1 ${uiFont}; letter-spacing: 0.01em; text-transform: none; cursor: pointer; &:hover, &:focus-visible { outline: 2px solid var(--dw-cyan);
    outline-offset: 2px; border-color: var(--item-accent, #7fd7ff); box-shadow: none; }`;

export const HierarchyFrame = styled.section`display: grid; gap: 0.7rem; padding: 0.68rem; border: 1px solid rgba(230, 237, 243, 0.12); border-radius: var(--dw-radius); background: var(--dw-surface);`;
export const HierarchyBranch = styled.section`display: grid; gap: 0; padding-left: 0.8rem; border-left: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.34);`;
export const NodeLabel = styled.div`margin: 0 0 0.2rem -0.45rem; color: var(--item-secondary, #a7b6ff); font: 700 0.75rem/1 ${uiFont}; letter-spacing: 0.01em; text-transform: none;`;
export const HierarchyLine = styled.div`display: grid; grid-template-columns: minmax(92px, 0.35fr) minmax(0, 1fr) auto; gap: 0.5rem; align-items: start; padding: 0.38rem 0.18rem; border-bottom: 1px solid rgba(197, 219, 230, 0.075); &:last-child { border-bottom: 0; } @media (max-width: ${MOBILE_BREAKPOINT}) { grid-template-columns: minmax(84px, 0.32fr) minmax(0, 1fr); gap: 0.42rem; }`;
export const NodeKind = styled.span`color: ${({ $kind }) => ($kind === 'item' ? 'var(--item-accent, #7fd7ff)' : 'var(--box-muted, #a9ebe6)')}; font: 760 0.75rem/1.2 ${uiFont}; letter-spacing: 0.01em; text-transform: none;`;
export const NodeValue = styled.span`color: rgba(242, 248, 251, 0.92); font-size: 0.82rem; overflow-wrap: anywhere;`;
export const NodeMeta = styled.code`color: var(--dw-text-secondary); font-size: 0.75rem; overflow-wrap: anywhere;`;
export const BoxLink = styled(Link)`display: inline-flex; align-items: flex-start; flex-wrap: wrap; gap: 0.38rem; color: rgba(242, 248, 251, 0.92); font-weight: 680; text-decoration: none; &:hover, &:focus-visible { outline: 2px solid var(--dw-cyan);
    outline-offset: 2px; text-decoration: none; } &:hover > span:last-child, &:focus-visible > span:last-child { color: var(--box-neon, #c5f4f1); text-decoration: none; text-shadow: none; } &:focus-visible { box-shadow: 0 0 0 2px rgba(var(--box-primary-rgb, 76, 198, 193), 0.36); }`;
export const BoxShortId = styled.span`display: inline-flex; align-items: baseline; gap: 0.06rem; color: var(--box-primary, #4cc6c1); font: 700 0.75rem/1.2 ${uiFont}; letter-spacing: 0.01em; text-shadow: none;`;
export const BoxShortIdMarker = styled.span`font-size: 0.68em; opacity: 0.58;`;
export const BoxShortIdDigits = styled.span`font-size: 1.22em;`;
export const BoxLabel = styled.span`color: rgba(242, 248, 251, 0.92); line-height: 1.2; transition: color 180ms ease, text-shadow 180ms ease; @media (prefers-reduced-motion: reduce) { transition: none; }`;
