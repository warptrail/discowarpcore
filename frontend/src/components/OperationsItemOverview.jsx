import React from 'react';
import styled from 'styled-components';
import * as S from '../styles/ItemDetails.styles';

function DetailRow({ label, value, stretch = false }) {
  return (
    <S.DetailRow $stretch={stretch}>
      <S.RowLabel>{label}</S.RowLabel>
      <S.RowValue>{value}</S.RowValue>
    </S.DetailRow>
  );
}

function DetailSection({ title, tone = 'teal', wide = false, children }) {
  return (
    <S.SectionCard $tone={tone} $wide={wide}>
      <S.SectionTitle>{title}</S.SectionTitle>
      <S.SectionBody>{children}</S.SectionBody>
    </S.SectionCard>
  );
}

function OverviewFact({ label, children, full = false }) {
  return (
    <OverviewFactCard $full={full}>
      <OverviewFactLabel>{label}</OverviewFactLabel>
      <OverviewFactValue>{children}</OverviewFactValue>
    </OverviewFactCard>
  );
}

function BreadcrumbTrail({ breadcrumb = [] }) {
  if (!breadcrumb.length) return <S.MutedValue>—</S.MutedValue>;

  return (
    <S.BreadcrumbList aria-label="Box breadcrumb">
      {breadcrumb.map((node, index) => (
        <S.BreadcrumbNode key={node?._id || `${node?.box_id || 'box'}-${index}`}>
          <S.BreadcrumbId>{node?.box_id || '—'}</S.BreadcrumbId>
          <S.BreadcrumbLabel>{node?.label || 'Box'}</S.BreadcrumbLabel>
          {index < breadcrumb.length - 1 && <S.BreadcrumbSep>›</S.BreadcrumbSep>}
        </S.BreadcrumbNode>
      ))}
    </S.BreadcrumbList>
  );
}

function ExternalLinksList({ links = [] }) {
  if (!links.length) return <S.MutedValue>—</S.MutedValue>;

  return (
    <S.ExternalLinkList>
      {links.map((link, index) => (
        <S.ExternalLinkAnchor
          key={`${link.url}-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label}
        </S.ExternalLinkAnchor>
      ))}
    </S.ExternalLinkList>
  );
}

export default function OperationsItemOverview({
  itemName,
  thumbnailUrl,
  canOpenImageLightbox = false,
  onOpenImageLightbox,
  quantity,
  categoryLabel,
  tags = [],
  primaryBox,
  location,
  boxGroup,
  breadcrumbTrail = [],
  keepPriorityLabel,
  keepPriorityTone = 'muted',
  primaryOwnerName,
  condition,
  isConsumable,
  valueLabel,
  purchasePriceLabel,
  description,
  notes,
  externalLinks = [],
}) {
  const tagList = Array.isArray(tags) ? tags : [];
  const boxGroupLabel = String(boxGroup || '').trim();
  const hasBoxGroup = boxGroupLabel && boxGroupLabel !== '—';

  return (
    <S.SectionGrid>
      <DetailSection title="Identity / Summary" tone="teal" wide>
        <OverviewHero $hasImage={Boolean(thumbnailUrl)}>
          {thumbnailUrl ? (
            <OverviewHeroStage>
              <OverviewImageButton
                type="button"
                onClick={canOpenImageLightbox ? onOpenImageLightbox : undefined}
                disabled={!canOpenImageLightbox}
                $interactive={canOpenImageLightbox}
                aria-label={
                  canOpenImageLightbox
                    ? `Open full-size image for ${itemName || 'item'}`
                    : undefined
                }
              >
                <OverviewThumb src={thumbnailUrl} alt={`${itemName || 'Item'} thumbnail`} />
                <OverviewImageHint $interactive={canOpenImageLightbox}>
                  {canOpenImageLightbox ? 'Click to expand' : 'Preview'}
                </OverviewImageHint>
              </OverviewImageButton>
            </OverviewHeroStage>
          ) : null}

          <OverviewHeroContext>
            <OverviewHeroHeading>
              <OverviewTitleLine>
                {quantity != null ? (
                  <OverviewQuantityPill aria-label={`Quantity ${quantity}`}>
                    <span>QTY</span>
                    <strong>{quantity}</strong>
                  </OverviewQuantityPill>
                ) : null}
                <OverviewItemName>{itemName || 'Unnamed item'}</OverviewItemName>
              </OverviewTitleLine>
            </OverviewHeroHeading>

            <OverviewFactsGrid>
              <OverviewFact label="Location">{location || '—'}</OverviewFact>
              <OverviewFact label="Primary box">{primaryBox || '—'}</OverviewFact>
              {hasBoxGroup ? (
                <OverviewFact label="Box group">{boxGroupLabel}</OverviewFact>
              ) : null}
              <OverviewFact label="Description / Notes" full>
                <OverviewNarrative>
                  <OverviewNarrativePart>
                    <OverviewNarrativeLabel>Description</OverviewNarrativeLabel>
                    <span>{description || '—'}</span>
                  </OverviewNarrativePart>
                  <OverviewNarrativePart>
                    <OverviewNarrativeLabel>Notes</OverviewNarrativeLabel>
                    <span>{notes || '—'}</span>
                  </OverviewNarrativePart>
                </OverviewNarrative>
              </OverviewFact>
              <OverviewFact label="Tags" full>
                {tagList.length ? (
                  <S.TagList>
                    {tagList.map((tag, idx) => (
                      <S.TagChip key={`${tag}-${idx}`}>{tag}</S.TagChip>
                    ))}
                  </S.TagList>
                ) : (
                  <S.MutedValue>—</S.MutedValue>
                )}
              </OverviewFact>
              <OverviewFact label="Category" full>{categoryLabel || '—'}</OverviewFact>
              <OverviewFact label="Breadcrumb" full>
                <BreadcrumbTrail breadcrumb={breadcrumbTrail} />
              </OverviewFact>
            </OverviewFactsGrid>
          </OverviewHeroContext>
        </OverviewHero>
      </DetailSection>

      <DetailSection title="Inventory / Value" tone="amber">
        <DetailRow
          label="Keep Priority"
          value={
            keepPriorityLabel ? (
              <S.KeepPriorityBadge $tone={keepPriorityTone}>
                {keepPriorityLabel}
              </S.KeepPriorityBadge>
            ) : (
              '—'
            )
          }
        />
        <DetailRow label="Primary Owner" value={primaryOwnerName || '—'} />
        <DetailRow label="Condition" value={condition || '—'} />
        <DetailRow label="Consumable" value={isConsumable ? 'Yes' : 'No'} />
        <DetailRow label="Value" value={valueLabel || '—'} />
        <DetailRow label="Purchase Price" value={purchasePriceLabel || '—'} />
      </DetailSection>

      <DetailSection title="External Links" tone="lilac" wide>
        <DetailRow
          label="References"
          value={<ExternalLinksList links={externalLinks} />}
          stretch
        />
      </DetailSection>
    </S.SectionGrid>
  );
}

const OverviewThumb = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  min-height: 206px;
  object-fit: contain;
  object-position: center;
  background:
    radial-gradient(circle at 50% 42%, rgba(167, 182, 255, 0.14), transparent 62%),
    rgba(7, 13, 21, 0.94);
`;

const OverviewHero = styled.div`
  display: grid;
  gap: 0.72rem;
  min-width: 0;

  @media (min-width: 600px) {
    grid-template-columns: ${({ $hasImage }) =>
      $hasImage ? 'minmax(190px, 0.82fr) minmax(0, 1.18fr)' : 'minmax(0, 1fr)'};
    align-items: stretch;
  }
`;

const OverviewHeroStage = styled.div`
  min-width: 0;
`;

const OverviewHeroContext = styled.div`
  display: grid;
  gap: 0.64rem;
  min-width: 0;
  align-content: start;
`;

const OverviewHeroHeading = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.54rem;
  min-width: 0;
  padding-bottom: 0.56rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 480px) {
    justify-content: center;
    text-align: center;
  }
`;

const OverviewTitleLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;

  @media (max-width: 480px) {
    position: relative;
    justify-content: center;
  }
`;

const OverviewItemName = styled.h5`
  margin: 0;
  min-width: 0;
  color: #eef7ff;
  font-size: clamp(0.98rem, 0.84rem + 0.52vw, 1.22rem);
  font-weight: 780;
  letter-spacing: 0.015em;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const OverviewQuantityPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  flex: 0 0 auto;
  min-height: 27px;
  padding: 0.18rem 0.38rem;
  border: 1px solid rgba(167, 182, 255, 0.66);
  border-radius: 7px;
  background: linear-gradient(180deg, rgba(167, 182, 255, 0.18), rgba(167, 182, 255, 0.08));
  color: #e0e5ff;
  font-weight: 780;
  letter-spacing: 0.07em;
  line-height: 1;
  text-transform: uppercase;

  span {
    font-size: 0.54rem;
  }

  strong {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.76rem;
    letter-spacing: 0;
  }

  @media (max-width: 480px) {
    position: absolute;
    top: 50%;
    right: calc(100% + 0.42rem);
    transform: translateY(-50%);
  }
`;

const OverviewFactsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;
  min-width: 0;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const OverviewFactCard = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.44rem 0.48rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.026), rgba(6, 12, 20, 0.15));

  ${({ $full }) =>
    $full && `grid-column: 1 / -1;`}

  @media (max-width: 480px) {
    grid-column: auto;
  }
`;

const OverviewFactLabel = styled.span`
  color: rgba(231, 236, 243, 0.56);
  font-size: 0.59rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
`;

const OverviewFactValue = styled.div`
  min-width: 0;
  color: #e7ecf3;
  font-size: 0.76rem;
  font-weight: 580;
  line-height: 1.3;
  overflow-wrap: anywhere;
`;

const OverviewNarrative = styled.div`
  display: grid;
  gap: 0.48rem;
`;

const OverviewNarrativePart = styled.div`
  display: grid;
  gap: 0.14rem;

  &:not(:first-child) {
    padding-top: 0.46rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const OverviewNarrativeLabel = styled.span`
  color: rgba(231, 236, 243, 0.56);
  font-size: 0.58rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const OverviewImageButton = styled.button`
  position: relative;
  display: grid;
  width: 100%;
  min-height: 100%;
  padding: 0.42rem;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(76, 198, 193, 0.44);
  background:
    linear-gradient(135deg, rgba(76, 198, 193, 0.12), rgba(167, 182, 255, 0.08) 56%, transparent),
    rgba(11, 19, 29, 0.98);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.045),
    0 12px 28px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(76, 198, 193, 0.08);
  text-align: left;
  cursor: ${({ $interactive }) => ($interactive ? 'zoom-in' : 'default')};
  transition: border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;

  &:disabled {
    opacity: 1;
  }

  &:hover {
    border-color: ${({ $interactive }) => ($interactive ? 'rgba(106, 226, 218, 0.82)' : 'rgba(76, 198, 193, 0.44)')};
    transform: ${({ $interactive }) => ($interactive ? 'translateY(-1px)' : 'none')};
    box-shadow: ${({ $interactive }) =>
      $interactive
        ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 14px 30px rgba(0, 0, 0, 0.28), 0 0 26px rgba(76, 198, 193, 0.18)'
        : 'inset 0 0 0 1px rgba(255, 255, 255, 0.045), 0 12px 28px rgba(0, 0, 0, 0.2)'};
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(132, 222, 180, 0.74);
    box-shadow: 0 0 0 2px rgba(78, 199, 123, 0.24);
  }
`;

const OverviewImageHint = styled.span`
  position: absolute;
  right: 0.72rem;
  bottom: 0.72rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  padding: 0.16rem 0.44rem;
  border: 1px solid ${({ $interactive }) =>
    $interactive ? 'rgba(167, 182, 255, 0.62)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 999px;
  background: rgba(8, 13, 22, 0.84);
  font-size: 0.68rem;
  font-weight: 720;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ $interactive }) =>
    $interactive ? 'rgba(225, 230, 255, 0.94)' : 'rgba(183, 214, 194, 0.82)'};
`;
