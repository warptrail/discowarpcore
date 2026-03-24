import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import * as S from '../styles/ItemDetails.styles';
import { fetchItemDetails, createAborter } from '../api/itemDetails';
import { formatItemCategory, normalizeItemCategory } from '../util/itemCategories';
import {
  formatKeepPriorityLabel,
  keepPriorityTone,
} from '../util/keepPriority';
import { getItemOwnershipContext } from '../util/itemOwnership';
import OperationsItemOverview from './OperationsItemOverview';

function fmtDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function fmtUsdFromCents(valueCents) {
  if (!Number.isFinite(valueCents)) return '—';
  return usdFormatter.format(valueCents / 100);
}

function fmtUsdValue(value, valueCents) {
  if (Number.isFinite(value)) return usdFormatter.format(value);
  return fmtUsdFromCents(valueCents);
}

function formatBoxSummary(label, boxId) {
  const safeLabel = String(label || '').trim();
  const safeBoxId = String(boxId || '').trim();
  if (!safeLabel && !safeBoxId) return '—';
  if (safeLabel && safeBoxId) return `${safeLabel} (${safeBoxId})`;
  if (safeLabel) return safeLabel;
  return `Box ${safeBoxId}`;
}

function formatDispositionLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function normalizeExternalLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => ({
      label: String(link?.label || '').trim(),
      url: String(link?.url || '').trim(),
    }))
    .filter((link) => link.label && link.url);
}

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

export default function ItemDetails({
  itemId,
  itemData: providedItemData = null,
  enableImageLightbox = false,
  variant = 'full',
}) {
  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasProvidedData =
    !!providedItemData && typeof providedItemData === 'object';
  const providedHasContainmentSnapshot =
    hasProvidedData &&
    ('box' in providedItemData || Array.isArray(providedItemData?.breadcrumb));
  const shouldFetch = !!itemId && (!hasProvidedData || !providedHasContainmentSnapshot);

  useEffect(() => {
    if (!shouldFetch) {
      setItemData(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    if (!itemId) {
      setItemData(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const { signal, cancel } = createAborter();
    setItemData(null);
    setLoading(!hasProvidedData);
    setError(null);

    fetchItemDetails(itemId, { signal })
      .then((data) => setItemData(data))
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          if (!hasProvidedData) {
            setError(err?.message || 'Failed to load item details');
          } else {
            console.warn('[ItemDetails] hydration fetch failed:', err);
          }
        }
      })
      .finally(() => setLoading(false));

    return () => cancel();
  }, [hasProvidedData, itemId, shouldFetch]);

  const resolvedItemData = itemData ?? providedItemData;

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  if (loading) {
    return (
      <S.Skeleton>
        <div />
        <div />
        <div />
      </S.Skeleton>
    );
  }

  if (error) return <S.ErrorMsg role="alert">{error}</S.ErrorMsg>;
  if (!resolvedItemData) return null;

  const {
    description,
    notes,
    links,
    location,
    dateAcquired,
    dateLastUsed,
    usageHistory,
    valueCents,
    value,
    avgUseIntervalDays,
    quantity,
    tags,
    imagePath,
    orphanedAt,
    item_status,
    disposition,
    disposition_at,
    disposition_notes,
    keepPriority,
    primaryOwnerName,
    condition,
    category,
    isConsumable,
    lastCheckedAt,
    acquisitionType,
    purchasePriceCents,
    lastMaintainedAt,
    maintenanceIntervalDays,
    maintenanceNotes,
    box: apiBox,
    breadcrumb,
    depth,
    topBox,
  } = resolvedItemData;

  const resolvedImageUrl =
    resolvedItemData?.image?.display?.url ||
    resolvedItemData?.image?.thumb?.url ||
    resolvedItemData?.image?.original?.url ||
    resolvedItemData?.image?.url ||
    imagePath ||
    '';
  const isOperationsOverview = variant === 'operationsOverview';
  const canOpenLightbox =
    !isOperationsOverview && enableImageLightbox && Boolean(resolvedImageUrl);

  const tagList = Array.isArray(tags) ? tags : [];
  const usageDates = Array.isArray(usageHistory) ? usageHistory : [];
  const categoryLabel = formatItemCategory(normalizeItemCategory(category));
  const externalLinks = normalizeExternalLinks(links);
  const ownership = getItemOwnershipContext(resolvedItemData);
  const resolvedBox = ownership.box || apiBox || null;
  const resolvedBoxId = ownership.boxId || resolvedBox?.box_id || '';
  const resolvedBoxLabel = ownership.boxLabel || resolvedBox?.label || '';
  const breadcrumbTrail =
    Array.isArray(breadcrumb) && breadcrumb.length
      ? breadcrumb
      : ownership.isBoxed && (resolvedBoxId || resolvedBoxLabel)
      ? [
          {
            _id: resolvedBox?._id || ownership.boxMongoId || `box-${resolvedBoxId || 'unknown'}`,
            box_id: resolvedBoxId || '—',
            label: resolvedBoxLabel || 'Box',
          },
        ]
      : [];
  const isOrphaned = ownership.isOrphaned;
  const isGone = String(item_status || '').toLowerCase() === 'gone';
  const statusLabel = isGone ? 'No Longer Have' : isOrphaned ? 'Orphaned' : 'Assigned';
  const primaryBox = formatBoxSummary(resolvedBoxLabel, resolvedBoxId);
  const topBoxSummary = topBox
    ? formatBoxSummary(topBox?.label, topBox?.box_id)
    : '—';
  const keepPriorityLabel = formatKeepPriorityLabel(keepPriority);
  const keepPriorityToneValue = keepPriorityTone(keepPriority);
  const keepPriorityHeaderLabel = (keepPriorityLabel || 'Unspecified').toUpperCase();
  const valueLabel = fmtUsdValue(value, valueCents);
  const purchasePriceLabel = fmtUsdFromCents(purchasePriceCents);

  return (
    <S.Panel
      $lightboxOpen={lightboxOpen}
      $priorityTone={keepPriorityToneValue}
    >
      <S.HeaderBand>
        <S.TitleBlock>
          <S.HeaderMeta $compact>
            <S.StatePill $tone={isGone || isOrphaned ? 'coral' : 'teal'}>
              {statusLabel}
            </S.StatePill>
            {quantity != null && <S.MetaTag>qty {quantity}</S.MetaTag>}
            {resolvedBoxId ? <S.MetaTag>box {resolvedBoxId}</S.MetaTag> : null}
            <S.KeepPriorityPill $tone={keepPriorityToneValue}>
              {keepPriorityHeaderLabel}
            </S.KeepPriorityPill>
          </S.HeaderMeta>
        </S.TitleBlock>
      </S.HeaderBand>

      {!isOperationsOverview && resolvedImageUrl ? (
        <S.FeaturedImageWrap
          $interactive={canOpenLightbox}
          role={canOpenLightbox ? 'button' : undefined}
          tabIndex={canOpenLightbox ? 0 : undefined}
          onClick={canOpenLightbox ? () => setLightboxOpen(true) : undefined}
          onKeyDown={
            canOpenLightbox
              ? (event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  setLightboxOpen(true);
                }
              : undefined
          }
          aria-label={
            canOpenLightbox
              ? `Open full-size image for ${resolvedItemData?.name || 'item'}`
              : undefined
          }
        >
          <S.FeaturedImage
            src={resolvedImageUrl}
            alt={`${resolvedItemData?.name || 'Item'} image`}
          />
        </S.FeaturedImageWrap>
      ) : null}

      {isOperationsOverview ? (
        <OperationsItemOverview
          itemName={resolvedItemData?.name}
          thumbnailUrl={resolvedImageUrl}
          quantity={quantity}
          statusLabel={statusLabel}
          categoryLabel={categoryLabel}
          tags={tagList}
          primaryBox={primaryBox}
          location={location}
          breadcrumbTrail={breadcrumbTrail}
          keepPriorityLabel={keepPriorityLabel}
          keepPriorityTone={keepPriorityToneValue}
          primaryOwnerName={primaryOwnerName}
          condition={condition}
          isConsumable={isConsumable}
          valueLabel={valueLabel}
          purchasePriceLabel={purchasePriceLabel}
          description={description}
          notes={notes}
          externalLinks={externalLinks}
        />
      ) : (
        <S.SectionGrid>
          <DetailSection title="Identity / Summary" tone="teal">
            <DetailRow label="Status" value={statusLabel} />
            <DetailRow label="Inventory Status" value={isGone ? 'gone' : 'active'} />
            <DetailRow label="Primary Box" value={primaryBox} />
            <DetailRow label="Category" value={categoryLabel} />
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
          </DetailSection>

          <DetailSection title="Inventory / Value" tone="amber">
            <DetailRow label="Quantity" value={quantity ?? '—'} />
            <DetailRow label="Value" value={valueLabel} />
            <DetailRow label="Purchase Price" value={purchasePriceLabel} />
          </DetailSection>

          <DetailSection title="Description / Notes" tone="lilac" wide>
            <DetailRow label="Description" value={description || '—'} stretch />
            <DetailRow label="Notes" value={notes || '—'} stretch />
          </DetailSection>

          <DetailSection title="External Links" tone="lilac" wide>
            <DetailRow
              label="References"
              value={<ExternalLinksList links={externalLinks} />}
              stretch
            />
          </DetailSection>

          <DetailSection title="Lifecycle" tone="teal" wide>
            <DetailRow label="Date Acquired" value={fmtDate(dateAcquired)} />
            <DetailRow label="Last Used" value={fmtDate(dateLastUsed)} />
            <DetailRow label="Last Checked" value={fmtDate(lastCheckedAt)} />
            <DetailRow label="Disposition" value={formatDispositionLabel(disposition)} />
            <DetailRow label="Disposition At" value={fmtDate(disposition_at)} />
            <DetailRow label="Disposition Notes" value={disposition_notes || '—'} stretch />
            <DetailRow
              label="Usage History"
              value={
                usageDates.length ? (
                  <S.UsageList>
                    {usageDates.map((dateValue, index) => (
                      <S.UsageItem key={`${dateValue}-${index}`}>
                        {fmtDate(dateValue)}
                      </S.UsageItem>
                    ))}
                  </S.UsageList>
                ) : (
                  <S.MutedValue>—</S.MutedValue>
                )
              }
              stretch
            />
            <DetailRow label="Avg Interval (days)" value={avgUseIntervalDays ?? '—'} />
            <DetailRow label="Orphaned At" value={fmtDate(orphanedAt)} />
          </DetailSection>

          <DetailSection title="Ownership / Retention" tone="amber" wide>
            <DetailRow
              label="Keep Priority"
              value={
                keepPriorityLabel ? (
                  <S.KeepPriorityBadge
                    $tone={keepPriorityToneValue}
                  >
                    {keepPriorityLabel}
                  </S.KeepPriorityBadge>
                ) : (
                  '—'
                )
              }
            />
            <DetailRow label="Primary Owner" value={primaryOwnerName || '—'} />
            <DetailRow label="Condition" value={condition || '—'} />
            <DetailRow
              label="Consumable"
              value={isConsumable ? 'Yes' : 'No'}
            />
            <DetailRow label="Acquisition Type" value={acquisitionType || '—'} />
          </DetailSection>

          <DetailSection title="Maintenance" tone="teal" wide>
            <DetailRow
              label="Last Maintained"
              value={fmtDate(lastMaintainedAt)}
            />
            <DetailRow
              label="Interval (days)"
              value={maintenanceIntervalDays ?? '—'}
            />
            <DetailRow
              label="Maintenance Notes"
              value={maintenanceNotes || '—'}
              stretch
            />
          </DetailSection>

          <DetailSection title="Placement / Hierarchy" tone="coral" wide>
            <DetailRow label="Location" value={location || '—'} stretch />
            <DetailRow label="Box" value={primaryBox} stretch />
            <DetailRow label="Box Description" value={resolvedBox?.description || '—'} stretch />
            <DetailRow label="Depth" value={depth ?? '—'} />
            <DetailRow label="Top Box" value={topBoxSummary} stretch />
            <DetailRow
              label="Breadcrumb"
              value={<BreadcrumbTrail breadcrumb={breadcrumbTrail} />}
              stretch
            />
          </DetailSection>

          <DetailSection title="Media Metadata" tone="lilac" wide>
            <DetailRow label="Image Path" value={imagePath || '—'} stretch />
          </DetailSection>

        </S.SectionGrid>
      )}

      {canOpenLightbox && lightboxOpen ? (
        <S.LightboxOverlay
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Image preview for ${resolvedItemData?.name || 'item'}`}
        >
          <S.LightboxFrame onClick={(event) => event.stopPropagation()}>
            <S.LightboxCloseButton
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close image preview"
            >
              ×
            </S.LightboxCloseButton>
            <S.LightboxImage
              src={resolvedImageUrl}
              alt={`${resolvedItemData?.name || 'Item'} image enlarged`}
            />
          </S.LightboxFrame>
        </S.LightboxOverlay>
      ) : null}

    </S.Panel>
  );
}
