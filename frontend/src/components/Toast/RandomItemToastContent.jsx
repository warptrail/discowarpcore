import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ToastContext } from './ToastContext';
import useItemDeclutterDeck from '../../hooks/useItemDeclutterDeck';
import { formatItemCategory } from '../../util/itemCategories';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';

const Surface = styled.section`
  display: grid;
  gap: 0.48rem;
  min-width: 0;
  width: 100%;
`;

const ImageFrame = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: clamp(250px, 48vw, 390px);
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 3px;
  background: #080e16;
`;

const ZoomButton = styled.button`
  position: absolute;
  z-index: 2;
  right: 0.7rem;
  top: 0.65rem;
  min-height: 32px;
  padding: 0.16rem 0.28rem;
  border: 0;
  background: rgba(2, 8, 14, 0.76);
  color: rgba(207, 241, 255, 0.92);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  cursor: zoom-in;

  &::after {
    content: 'VIEW IMAGE';
  }

  &:focus-visible { outline: 2px solid #8de8ff; outline-offset: 3px; }
  &:hover { filter: brightness(1.2); }
`;

const Image = styled.img`
  width: 100%; height: 100%; object-fit: cover; display: block;
`;

const ImageShade = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: clamp(1rem, 4vw, 1.5rem);
  text-align: left;
  background:
    linear-gradient(180deg, rgba(3, 8, 14, 0.04) 24%, rgba(3, 8, 14, 0.38) 56%, rgba(3, 8, 14, 0.94) 100%),
    linear-gradient(90deg, rgba(var(--box-primary-rgb, 91, 215, 244), 0.13), transparent 48%);
`;

const Context = styled.div`
  display: grid;
  gap: 0.32rem;
  min-width: 0;
  max-width: min(100%, 36rem);
`;

const BoxLink = styled(Link)`
  width: fit-content;
  max-width: 100%;
  color: rgba(189, 235, 249, 0.86);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover, &:focus-visible { color: #fff; text-decoration: underline; }
`;

const ItemName = styled.h2`
  margin: 0;
  color: #fff;
  font-size: clamp(1.28rem, 4.2vw, 2rem);
  font-weight: 760;
  letter-spacing: -0.025em;
  line-height: 1.18;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.8);
`;

const Summary = styled.p`
  margin: 0;
  color: rgba(223, 240, 246, 0.86);
  font-size: 0.84rem;
  line-height: 1.35;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.8rem;
  color: rgba(202, 234, 244, 0.8);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  span { white-space: nowrap; }
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto auto;
  gap: 1px;
`;

const ActionButton = styled.button`
  min-height: 40px;
  padding: 0.42rem 0.6rem;
  border: 0;
  border-radius: 2px;
  background: ${({ $primary }) => $primary ? 'linear-gradient(135deg, #a7f0ff, #72d3e9)' : 'rgba(124, 184, 205, 0.18)'};
  color: ${({ $primary }) => $primary ? '#06121a' : 'rgba(230, 247, 255, 0.94)'};
  font: inherit; font-size: 0.76rem; font-weight: 800; cursor: pointer;
  &:hover:not(:disabled) { filter: brightness(1.16); }
  &:focus-visible { outline: 2px solid #8de8ff; outline-offset: 2px; }
  &:disabled { cursor: wait; opacity: 0.64; }
  ${({ $close }) => $close && `
    padding: 0;
    font-size: 1rem;
    line-height: 1;
  `}
`;

function quantity(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : '1';
}

function text(value, fallback = '') {
  return String(value || '').trim() || fallback;
}

export default function RandomItemToastContent({
  imageUrl,
  item,
  itemName,
  onCloseRandom,
  onOpenItem,
  onRandomAgain,
  thumbUrl,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const toast = useContext(ToastContext);
  const { declutterPending, inDeclutterDeck, toggleDeclutterDeck } = useItemDeclutterDeck({
    item,
    showToast: toast?.showToast,
    hideToast: toast?.hideToast,
    successTimeoutMs: 3000,
    onSuccessTimeout: onRandomAgain,
  });
  const previewUrl = text(imageUrl || thumbUrl);
  const imageLabel = text(itemName, 'selected item');
  const boxId = text(item?.box?.box_id);
  const boxLabel = text(item?.box?.label, 'Box');
  const description = text(item?.description);
  const meta = [
    `QTY ${quantity(item?.quantity)}`,
    formatItemCategory(item?.category),
    ...(Array.isArray(item?.tags) ? item.tags.map((tag) => text(tag)).filter(Boolean) : []),
  ];
  const themeStyle = getBoxThemeCssVars(getBoxTheme(boxId));

  return <>
    <Surface style={themeStyle}>
      <ImageFrame>
        {previewUrl ? <Image src={thumbUrl || previewUrl} alt="" loading="lazy" decoding="async" /> : null}
        {previewUrl ? <ZoomButton type="button" onClick={() => setLightboxOpen(true)} aria-label={`View image for ${imageLabel}`} /> : null}
        <ImageShade>
          <Context>
            {boxId ? <BoxLink to={`/boxes/${encodeURIComponent(boxId)}`}>#{boxId} · {boxLabel}</BoxLink> : <BoxLink as="span">ADRIFT</BoxLink>}
            <ItemName>{imageLabel}</ItemName>
            {description ? <Summary>{description}</Summary> : null}
            <Meta aria-label="Item summary">{meta.map((entry) => <span key={entry}>{entry}</span>)}</Meta>
          </Context>
        </ImageShade>
      </ImageFrame>
      <Actions aria-label="Random item actions">
        <ActionButton type="button" $close onClick={onCloseRandom} aria-label="Close random selector" title="Close random selector">×</ActionButton>
        <ActionButton type="button" $primary onClick={toggleDeclutterDeck} disabled={declutterPending}>{declutterPending ? 'Updating…' : inDeclutterDeck ? 'Remove from Declutter' : 'Declutter'}</ActionButton>
        <ActionButton type="button" onClick={onOpenItem}>Open</ActionButton>
        <ActionButton type="button" onClick={onRandomAgain}>Another</ActionButton>
      </Actions>
    </Surface>
    <RetrievalImageLightbox isOpen={lightboxOpen && Boolean(previewUrl)} imageSrc={previewUrl} itemName={imageLabel} onClose={() => setLightboxOpen(false)} />
  </>;
}
