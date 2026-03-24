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
  quantity,
  statusLabel,
  categoryLabel,
  tags = [],
  primaryBox,
  location,
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
            label="Thumbnail"
            value={
              <OverviewThumb src={thumbnailUrl} alt={`${itemName || 'Item'} thumbnail`} />
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
  width: 72px;
  height: 72px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  object-fit: cover;
  background: rgba(255, 255, 255, 0.03);
`;
