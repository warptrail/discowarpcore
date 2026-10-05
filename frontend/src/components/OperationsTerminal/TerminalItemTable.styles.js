import styled from 'styled-components';
import { controlStyles, panelStyles } from '../../styles/primitives';

const toneRgb = 'var(--box-primary-rgb, 127, 215, 255)';
const secondaryRgb = 'var(--box-secondary-rgb, 103, 217, 211)';

export const Panel = styled.section`
  ${panelStyles}
  font-family: var(--dw-font-ui);
  min-width: 0;
  margin: 0 0.62rem 0.52rem;
  border: 1px solid rgba(${toneRgb}, 0.38);
  border-top: 0;
  border-radius: 0 0 var(--dw-radius) var(--dw-radius);
  background: var(--dw-surface);
  overflow: hidden;
  animation: terminal-panel-in 200ms cubic-bezier(0.2, 0.72, 0.2, 1);

  @keyframes terminal-panel-in {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const PanelHeader = styled.div`
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  padding: 0.34rem 0.42rem 0.34rem 0.68rem;
  border-bottom: 1px solid rgba(${toneRgb}, 0.28);
  background: var(--dw-surface-raised);
`;

export const PanelHeading = styled.h3`
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin: 0;
  color: var(--dw-text);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;

  code {
    color: rgba(${toneRgb}, 0.78);
    font-family: var(--dw-font-data);
  }
`;

export const IconLink = styled.a`
  ${controlStyles}
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  color: rgba(${toneRgb}, 0.86);
  border: 0;
  border-radius: 5px;
  background: transparent;
  font-family: var(--dw-font-ui);
  font-size: 1.05rem;
  font-weight: 650;
  line-height: 1;
  text-decoration: none;
  transition: color 140ms ease, background 140ms ease;

  &:hover,
  &:focus-visible {
    color: #f4fbff;
    background: rgba(${toneRgb}, 0.12);
    outline: 2px solid var(--dw-cyan);
    outline-offset: -2px;
  }
`;

export const ScrollArea = styled.div`
  max-height: clamp(180px, 38dvh, 360px);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
`;

export const ColumnHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(92px, 0.42fr) 48px;
  gap: 0.5rem;
  padding: 0.28rem 0.68rem 0.26rem 3.2rem;
  border-bottom: 1px solid rgba(${toneRgb}, 0.2);
  color: var(--dw-text-secondary);
  background: var(--dw-surface-raised);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;

  span:last-child { text-align: right; }

  @media (max-width: 560px) {
    display: none;
  }
`;

export const ItemList = styled.div`
  display: grid;
`;

export const ItemEntry = styled.div`
  min-width: 0;
  border-bottom: 1px solid rgba(${toneRgb}, 0.14);

  &:last-child { border-bottom: 0; }
`;

export const ItemButton = styled.button`
  ${controlStyles}
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) minmax(92px, 0.42fr) 48px;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 46px;
  padding: 0.34rem 0.68rem;
  border: 0;
  color: var(--dw-text);
  background: ${({ 'aria-expanded': expanded }) =>
    expanded ? 'var(--dw-surface-raised)' : 'var(--dw-surface)'};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--dw-surface-raised);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: -2px;
  }

  @media (max-width: 560px) {
    grid-template-columns: 30px minmax(0, 1fr) 44px;
    gap: 0.48rem;
    padding-inline: 0.52rem;
  }
`;

export const MicroThumbnail = styled.img`
  width: 30px;
  height: 30px;
  border: 1px solid rgba(${toneRgb}, 0.35);
  border-radius: 4px;
  object-fit: cover;
  background: var(--dw-background);
`;

export const MicroThumbnailFallback = styled.span`
  width: 30px;
  height: 30px;
  border: 1px solid rgba(${toneRgb}, 0.22);
  border-radius: 4px;
  background: var(--dw-surface);
`;

export const ItemIdentity = styled.span`
  display: grid;
  min-width: 0;
  gap: 0.1rem;
`;

export const ItemName = styled.span`
  overflow: hidden;
  color: var(--dw-text);
  font-family: var(--dw-font-ui);
  font-size: 0.76rem;
  font-weight: 650;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const ItemCategory = styled.span`
  overflow: hidden;
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  white-space: nowrap;
  text-overflow: ellipsis;

  @media (max-width: 560px) { display: none; }
`;

export const MobileCategory = styled.span`
  display: none;
  overflow: hidden;
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  white-space: nowrap;
  text-overflow: ellipsis;

  @media (max-width: 560px) { display: block; }
`;

export const ItemQuantity = styled.span`
  color: rgba(${toneRgb}, 0.88);
  font-size: 0.75rem;
  font-weight: 650;
  text-align: right;
`;

export const PreviewPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(84px, 0.26fr) minmax(0, 1fr);
  gap: 0.72rem;
  padding: 0.62rem 0.68rem 0.72rem 3.18rem;
  background: var(--dw-surface);
  animation: terminal-preview-in 180ms ease-out;

  @keyframes terminal-preview-in {
    from { opacity: 0; transform: translateY(-3px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 560px) {
    grid-template-columns: 72px minmax(0, 1fr);
    padding-left: 0.52rem;
  }

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const PreviewMedia = styled.div`
  min-width: 0;
`;

export const PreviewImage = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgba(${toneRgb}, 0.35);
  border-radius: 5px;
  object-fit: cover;
  background: var(--dw-background);
`;

export const PreviewImageFallback = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgba(${toneRgb}, 0.24);
  border-radius: 5px;
  color: var(--dw-text-secondary);
  background: var(--dw-background);
  font-size: 0.75rem;
  letter-spacing: normal;
`;

export const PreviewContent = styled.div`
  display: grid;
  align-content: start;
  gap: 0.44rem;
  min-width: 0;
`;

export const PreviewIdentity = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px;
  align-items: start;
  gap: 0.35rem;
`;

export const PreviewName = styled.h4`
  margin: 0;
  color: var(--dw-text);
  font-family: var(--dw-font-ui);
  font-size: 0.86rem;
  line-height: 1.22;
`;

export const PreviewMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem 0.6rem;
  margin-top: 0.16rem;
  color: var(--dw-text-secondary);
  font-size: 0.75rem;

  code { color: var(--box-primary, var(--dw-cyan)); font-family: var(--dw-font-data); font-weight: 600; }
`;

export const PreviewDetails = styled.div`
  display: grid;
  gap: 0.38rem;
`;

export const ClampedText = styled.p`
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--dw-text-secondary);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
`;

export const PreviewNote = styled.div`
  padding-top: 0.32rem;
  border-top: 1px solid rgba(${toneRgb}, 0.16);
`;

export const MetaLabel = styled.span`
  display: block;
  margin-bottom: 0.12rem;
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
`;

export const PreviewTags = styled.div`
  display: -webkit-box;
  overflow: hidden;
  color: rgba(${secondaryRgb}, 0.78);
  font-size: 0.75rem;
  line-height: 1.55;
  word-spacing: 0.32rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  span { margin-right: 0.38rem; }
`;

export const PreviewEmpty = styled.p`
  margin: 0;
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
`;

export const EmptyState = styled.p`
  margin: 0;
  padding: 0.82rem 0.68rem;
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
`;
