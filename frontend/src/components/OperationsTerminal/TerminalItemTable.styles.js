import styled from 'styled-components';

const toneRgb = 'var(--box-primary-rgb, 127, 215, 255)';
const secondaryRgb = 'var(--box-secondary-rgb, 103, 217, 211)';

export const Panel = styled.section`
  min-width: 0;
  margin: 0 0.62rem 0.52rem;
  border: 1px solid rgba(${toneRgb}, 0.38);
  border-top: 0;
  border-radius: 0 0 9px 9px;
  background:
    linear-gradient(120deg, rgba(${toneRgb}, 0.1), transparent 48%),
    rgba(5, 11, 15, 0.97);
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
  background: rgba(7, 15, 20, 0.96);
`;

export const PanelHeading = styled.h3`
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin: 0;
  color: rgba(230, 237, 243, 0.92);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;

  code {
    color: rgba(${toneRgb}, 0.78);
    font: inherit;
  }
`;

export const IconLink = styled.a`
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  color: rgba(${toneRgb}, 0.86);
  border: 0;
  border-radius: 5px;
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  transition: color 140ms ease, background 140ms ease;

  &:hover,
  &:focus-visible {
    color: #f4fbff;
    background: rgba(${toneRgb}, 0.12);
    outline: 1px solid rgba(${toneRgb}, 0.55);
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
  color: rgba(230, 237, 243, 0.48);
  background: rgba(7, 14, 19, 0.98);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;

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
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) minmax(92px, 0.42fr) 48px;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 46px;
  padding: 0.34rem 0.68rem;
  border: 0;
  color: rgba(230, 237, 243, 0.9);
  background: ${({ 'aria-expanded': expanded }) =>
    expanded ? `rgba(${toneRgb}, 0.12)` : 'transparent'};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(${toneRgb}, 0.09);
  }

  &:focus-visible {
    outline: 1px solid rgba(${toneRgb}, 0.74);
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
  background: #050a0e;
`;

export const MicroThumbnailFallback = styled.span`
  width: 30px;
  height: 30px;
  border: 1px solid rgba(${toneRgb}, 0.22);
  border-radius: 4px;
  background:
    linear-gradient(135deg, transparent 46%, rgba(${toneRgb}, 0.16) 47%, rgba(${toneRgb}, 0.16) 53%, transparent 54%),
    #050a0e;
`;

export const ItemIdentity = styled.span`
  display: grid;
  min-width: 0;
  gap: 0.1rem;
`;

export const ItemName = styled.span`
  overflow: hidden;
  color: rgba(230, 237, 243, 0.94);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.76rem;
  font-weight: 720;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const ItemCategory = styled.span`
  overflow: hidden;
  color: rgba(230, 237, 243, 0.58);
  font-size: 0.66rem;
  white-space: nowrap;
  text-overflow: ellipsis;

  @media (max-width: 560px) { display: none; }
`;

export const MobileCategory = styled.span`
  display: none;
  overflow: hidden;
  color: rgba(230, 237, 243, 0.5);
  font-size: 0.61rem;
  white-space: nowrap;
  text-overflow: ellipsis;

  @media (max-width: 560px) { display: block; }
`;

export const ItemQuantity = styled.span`
  color: rgba(${toneRgb}, 0.88);
  font-size: 0.68rem;
  font-weight: 850;
  text-align: right;
`;

export const PreviewPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(84px, 0.26fr) minmax(0, 1fr);
  gap: 0.72rem;
  padding: 0.62rem 0.68rem 0.72rem 3.18rem;
  background:
    linear-gradient(100deg, rgba(${secondaryRgb}, 0.1), transparent 52%),
    rgba(9, 17, 23, 0.96);
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
  background: #04090d;
`;

export const PreviewImageFallback = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgba(${toneRgb}, 0.24);
  border-radius: 5px;
  color: rgba(230, 237, 243, 0.42);
  background: #04090d;
  font-size: 0.58rem;
  letter-spacing: 0.12em;
`;

export const PreviewContent = styled.div`
  display: grid;
  align-content: start;
  gap: 0.44rem;
  min-width: 0;
`;

export const PreviewIdentity = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  align-items: start;
  gap: 0.35rem;
`;

export const PreviewName = styled.h4`
  margin: 0;
  color: rgba(230, 237, 243, 0.96);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.86rem;
  line-height: 1.22;
`;

export const PreviewMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem 0.6rem;
  margin-top: 0.16rem;
  color: rgba(230, 237, 243, 0.54);
  font-size: 0.62rem;

  code { color: rgba(${toneRgb}, 0.9); font: inherit; font-weight: 820; }
`;

export const PreviewDetails = styled.div`
  display: grid;
  gap: 0.38rem;
`;

export const ClampedText = styled.p`
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: rgba(230, 237, 243, 0.7);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.68rem;
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
  color: rgba(${toneRgb}, 0.7);
  font-size: 0.56rem;
  font-weight: 820;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const PreviewTags = styled.div`
  display: -webkit-box;
  overflow: hidden;
  color: rgba(${secondaryRgb}, 0.78);
  font-size: 0.61rem;
  line-height: 1.55;
  word-spacing: 0.32rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  span { margin-right: 0.38rem; }
`;

export const PreviewEmpty = styled.p`
  margin: 0;
  color: rgba(230, 237, 243, 0.48);
  font-size: 0.66rem;
`;

export const EmptyState = styled.p`
  margin: 0;
  padding: 0.82rem 0.68rem;
  color: rgba(230, 237, 243, 0.56);
  font-size: 0.7rem;
`;
