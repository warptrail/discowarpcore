import React from 'react';
import styled from 'styled-components';
import * as S from '../styles/ItemDetails.styles';
import useIsMobile from '../hooks/useIsMobile';

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
  statusLabel,
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
  const isMobile = useIsMobile(768);
  const tagList = Array.isArray(tags) ? tags : [];
  const tagsRow = (
    <DetailRow
      label="Tags"
      value={
        tagList.length ? (
          <S.TagList>
            {tagList.map((tag, idx) => (
              <S.TagChip key={`${tag}-${idx}`}>{tag}</S.TagChip>
            ))}
          </S.TagList>
        ) : (
          <S.MutedValue>—</S.MutedValue>
        )
      }
      stretch
    />
  );
  const descriptionNotesSection = (
    <DetailSection title="Description / Notes" tone="lilac" wide>
      <DetailRow label="Description" value={description || '—'} stretch />
      <DetailRow label="Notes" value={notes || '—'} stretch />
    </DetailSection>
  );

  return (
    <S.SectionGrid>
      <DetailSection title="Identity / Summary" tone="teal">
        {!isMobile && <DetailRow label="Item" value={itemName || '—'} />}
        {thumbnailUrl ? (
          <DetailRow
            label="Image"
            value={
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
                <OverviewImageHint>
                  {canOpenImageLightbox ? 'Click to expand' : 'Preview'}
                </OverviewImageHint>
              </OverviewImageButton>
            }
            stretch
          />
        ) : null}
        {!isMobile && <DetailRow label="Status" value={statusLabel || '—'} />}
        {!isMobile && <DetailRow label="Quantity" value={quantity ?? '—'} />}
        <DetailRow label="Category" value={categoryLabel || '—'} />
        {isMobile && tagsRow}
        {!isMobile && <DetailRow label="Primary Box" value={primaryBox || '—'} />}
        <DetailRow label="Location" value={location || '—'} />
        <DetailRow label="Box Group" value={boxGroup || '—'} />
        <DetailRow
          label="Breadcrumb"
          value={<BreadcrumbTrail breadcrumb={breadcrumbTrail} />}
          stretch
        />
        {!isMobile && tagsRow}
      </DetailSection>

      {isMobile && descriptionNotesSection}

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

      {!isMobile && descriptionNotesSection}

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
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.03);
`;

const OverviewImageButton = styled.button`
  display: grid;
  gap: 0.38rem;
  width: min(132px, 100%);
  padding: 0.42rem;
  border-radius: 14px;
  border: 1px solid rgba(142, 208, 175, 0.32);
  background: linear-gradient(180deg, rgba(18, 34, 29, 0.98) 0%, rgba(11, 21, 18, 0.98) 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  text-align: left;
  cursor: ${({ $interactive }) => ($interactive ? 'zoom-in' : 'default')};
  transition: border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;

  &:disabled {
    opacity: 1;
  }

  &:hover {
    border-color: ${({ $interactive }) => ($interactive ? 'rgba(132, 222, 180, 0.58)' : 'rgba(142, 208, 175, 0.32)')};
    transform: ${({ $interactive }) => ($interactive ? 'translateY(-1px)' : 'none')};
    box-shadow: ${({ $interactive }) => ($interactive ? '0 10px 24px rgba(0, 0, 0, 0.24)' : 'inset 0 0 0 1px rgba(255, 255, 255, 0.03)')};
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(132, 222, 180, 0.74);
    box-shadow: 0 0 0 2px rgba(78, 199, 123, 0.24);
  }
`;

const OverviewImageHint = styled.span`
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(183, 214, 194, 0.82);
`;
