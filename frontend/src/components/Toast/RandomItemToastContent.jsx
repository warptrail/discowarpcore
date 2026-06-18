import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { formatItemCategory } from '../../util/itemCategories';
import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';

const Wrap = styled.div`
  display: grid;
  grid-template-columns: minmax(136px, 188px) minmax(0, 1fr);
  gap: clamp(0.7rem, 1.6vw, 1rem);
  align-items: stretch;
  min-width: 0;
  width: 100%;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ThumbButton = styled.button`
  position: relative;
  width: 100%;
  max-width: 188px;
  min-width: 0;
  aspect-ratio: 1;
  border: 1px solid rgba(116, 218, 255, 0.38);
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(26, 67, 97, 0.86), rgba(11, 24, 38, 0.96)),
    #102633;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 10px 26px rgba(0, 0, 0, 0.28),
    0 0 24px rgba(48, 196, 255, 0.12);
  cursor: pointer;
  flex: 0 0 auto;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-left: 12px solid rgba(255, 184, 77, 0.76);
    pointer-events: none;
  }

  &::after {
    content: 'ZOOM';
    position: absolute;
    right: 0.45rem;
    bottom: 0.38rem;
    padding: 0.12rem 0.32rem;
    border-radius: 999px;
    background: rgba(3, 8, 13, 0.78);
    color: rgba(197, 242, 255, 0.94);
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
    font-size: 0.52rem;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(122, 226, 255, 0.84);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.12),
      0 12px 30px rgba(0, 0, 0, 0.32),
      0 0 30px rgba(48, 196, 255, 0.26);
  }

  &:focus-visible {
    outline: 2px solid rgba(125, 226, 255, 0.72);
    outline-offset: 3px;
  }

  @media (max-width: 720px) {
    width: min(100%, 188px);
    justify-self: start;
  }
`;

const Thumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(1.08) contrast(1.04);
`;

const NoThumb = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding-left: 12px;
  color: rgba(200, 238, 255, 0.82);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: center;
`;

const BoxHeaderBase = `
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
  min-height: 34px;
  width: fit-content;
  max-width: 100%;
  padding: 0.28rem 0.75rem 0.28rem 0.48rem;
  border-radius: 999px;
  border: 1px solid rgba(112, 228, 255, 0.28);
  background:
    linear-gradient(90deg, rgba(43, 89, 128, 0.58), rgba(7, 21, 34, 0.56)),
    rgba(7, 21, 34, 0.56);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 1px 8px rgba(0, 0, 0, 0.24);
  overflow: hidden;
`;

const BoxHeaderLink = styled(Link)`
  ${BoxHeaderBase}
  text-decoration: none;

  &:hover {
    border-color: rgba(127, 255, 184, 0.55);
    box-shadow:
      inset 0 0 0 1px rgba(127, 255, 184, 0.1),
      0 0 18px rgba(58, 255, 155, 0.12);
  }

  &:focus-visible {
    outline: 2px solid rgba(125, 226, 255, 0.72);
    outline-offset: 2px;
  }
`;

const BoxHeaderFallback = styled.div`
  ${BoxHeaderBase}
`;

const BoxShortId = styled.span`
  color: #55ff98;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 0 10px rgba(68, 255, 150, 0.3);
`;

const BoxLabel = styled.span`
  min-width: 0;
  color: #7bd8ff;
  font-size: 0.92rem;
  font-weight: 720;
  letter-spacing: 0;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DataDeck = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.62rem;
  align-content: center;
  padding: clamp(0.62rem, 1.4vw, 0.82rem);
  border-radius: 8px;
  border: 1px solid rgba(118, 211, 255, 0.28);
  background:
    linear-gradient(90deg, rgba(46, 108, 151, 0.5) 0 8px, transparent 8px),
    radial-gradient(circle at 95% 12%, rgba(74, 214, 255, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(11, 33, 52, 0.76), rgba(7, 17, 29, 0.9));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 10px 24px rgba(0, 0, 0, 0.2);
`;

const CommandBar = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const CommandNav = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.36rem;
  min-width: 0;
  padding: 0.18rem;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(13, 33, 52, 0.72), rgba(8, 18, 31, 0.84)),
    rgba(8, 18, 31, 0.8);
  border: 1px solid rgba(134, 226, 255, 0.18);

  @media (max-width: 780px) {
    justify-content: flex-start;
    width: fit-content;
    max-width: 100%;
    flex-wrap: wrap;
    border-radius: 8px;
  }
`;

const CommandButton = styled.button`
  min-height: 32px;
  max-width: 100%;
  padding: 0.26rem 0.68rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $primary }) =>
      $primary ? 'rgba(247, 251, 255, 0.9)' : 'rgba(154, 231, 255, 0.48)'};
  background: ${({ $primary }) =>
    $primary
      ? 'linear-gradient(135deg, rgba(247, 251, 255, 0.98), rgba(208, 238, 255, 0.95))'
      : 'rgba(8, 26, 42, 0.82)'};
  color: ${({ $primary }) => ($primary ? '#07111b' : 'rgba(235, 249, 255, 0.94)')};
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 5px 12px rgba(0, 0, 0, 0.18);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 780;
  line-height: 1.1;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: rgba(255, 205, 111, 0.82);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.12),
      0 6px 14px rgba(0, 0, 0, 0.24),
      0 0 16px rgba(94, 212, 255, 0.16);
  }

  &:focus-visible {
    outline: 2px solid rgba(125, 226, 255, 0.72);
    outline-offset: 2px;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const StatCell = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.44rem;
  min-height: 34px;
  padding: 0.24rem 0.55rem 0.24rem 0.28rem;
  border-radius: 999px 6px 6px 999px;
  background: rgba(7, 18, 30, 0.62);
  border: 1px solid rgba(143, 225, 255, 0.18);
`;

const StatLabel = styled.span`
  min-width: 4.25rem;
  padding: 0.28rem 0.48rem;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'amber'
      ? 'rgba(255, 180, 74, 0.92)'
      : $tone === 'rose'
        ? 'rgba(255, 128, 141, 0.88)'
        : 'rgba(85, 207, 255, 0.82)'};
  color: #06101a;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  line-height: 1;
  text-align: center;
`;

const StatValue = styled.span`
  min-width: 0;
  color: #effbff;
  font-size: 0.9rem;
  font-weight: 760;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TagsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const TagPill = styled.span`
  max-width: min(180px, 100%);
  padding: 0.2rem 0.48rem;
  border-radius: 999px;
  background: rgba(111, 221, 255, 0.14);
  border: 1px solid rgba(142, 230, 255, 0.26);
  color: rgba(224, 248, 255, 0.92);
  font-size: 0.72rem;
  font-weight: 720;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LongFieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const LongField = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.5rem;
  padding: 0.54rem 0.64rem;
  border-radius: 6px;
  background:
    linear-gradient(90deg, rgba(255, 128, 141, 0.56) 0 7px, transparent 7px),
    rgba(3, 10, 18, 0.44);
  border: 1px solid rgba(143, 225, 255, 0.14);

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const LongLabel = styled.span`
  color: rgba(255, 206, 132, 0.92);
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  line-height: 1.25;
`;

const LongValue = styled.span`
  min-width: 0;
  color: rgba(237, 248, 255, 0.88);
  font-size: 0.8rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

function formatQuantity(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '1';
  return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(2);
}

function getFallbackText(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}

function getBoxParts(item, fallbackLabel) {
  const shortId = String(item?.box?.box_id || '').trim();
  const label = String(item?.box?.label || '').trim();
  if (!shortId) {
    return {
      href: '',
      shortId: 'ORPHANED',
      label: fallbackLabel,
    };
  }
  return {
    href: `/boxes/${encodeURIComponent(shortId)}`,
    shortId: `#${shortId}`,
    label: label || 'Box',
  };
}

export default function RandomItemToastContent({
  boxIdLabel,
  imageUrl,
  item,
  itemName,
  onOpenItem,
  onRandomAgain,
  thumbUrl,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const previewUrl = String(imageUrl || thumbUrl || '').trim();
  const tags = Array.isArray(item?.tags)
    ? item.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : [];
  const categoryLabel = formatItemCategory(item?.category);
  const description = getFallbackText(item?.description, 'No description logged');
  const notes = getFallbackText(item?.notes, 'No notes logged');
  const imageLabel = getFallbackText(itemName, 'selected item');
  const boxParts = getBoxParts(item, boxIdLabel);

  return (
    <>
      <Wrap>
        <ThumbButton
          type="button"
          onClick={() => previewUrl && setLightboxOpen(true)}
          disabled={!previewUrl}
          aria-label={previewUrl ? `Open image preview for ${imageLabel}` : 'No image available'}
        >
          {thumbUrl ? (
            <Thumb
              src={thumbUrl}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <NoThumb>NO IMAGE</NoThumb>
          )}
        </ThumbButton>

        <DataDeck>
          <CommandBar>
            {boxParts.href ? (
              <BoxHeaderLink to={boxParts.href}>
                <BoxShortId>{boxParts.shortId}</BoxShortId>
                <BoxLabel>{boxParts.label}</BoxLabel>
              </BoxHeaderLink>
            ) : (
              <BoxHeaderFallback>
                <BoxShortId>{boxParts.shortId}</BoxShortId>
                <BoxLabel>{boxParts.label}</BoxLabel>
              </BoxHeaderFallback>
            )}
            <CommandNav aria-label="Random item actions">
              <CommandButton
                type="button"
                $primary
                onClick={onOpenItem}
              >
                Open Item
              </CommandButton>
              <CommandButton
                type="button"
                onClick={onRandomAgain}
              >
                Another Random
              </CommandButton>
            </CommandNav>
          </CommandBar>

          <StatGrid>
            <StatCell>
              <StatLabel>QTY</StatLabel>
              <StatValue title={formatQuantity(item?.quantity)}>
                {formatQuantity(item?.quantity)}
              </StatValue>
            </StatCell>
            <StatCell>
              <StatLabel $tone="amber">CAT</StatLabel>
              <StatValue title={categoryLabel}>{categoryLabel}</StatValue>
            </StatCell>
          </StatGrid>

          <TagsRow aria-label="Tags">
            <StatLabel $tone="rose">TAGS</StatLabel>
            {tags.length > 0 ? (
              tags.map((tag) => (
                <TagPill key={tag} title={tag}>
                  {tag}
                </TagPill>
              ))
            ) : (
              <TagPill>untagged</TagPill>
            )}
          </TagsRow>

          <LongFieldGrid>
            <LongField>
              <LongLabel>DESCRIPTION</LongLabel>
              <LongValue>{description}</LongValue>
            </LongField>
            <LongField>
              <LongLabel>NOTES</LongLabel>
              <LongValue>{notes}</LongValue>
            </LongField>
          </LongFieldGrid>
        </DataDeck>
      </Wrap>

      <RetrievalImageLightbox
        isOpen={lightboxOpen && Boolean(previewUrl)}
        imageSrc={previewUrl}
        itemName={imageLabel}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
