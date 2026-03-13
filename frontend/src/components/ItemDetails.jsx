import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import * as S from '../styles/ItemDetails.styles';
import { fetchItemDetails, createAborter } from '../api/itemDetails';

function fmtDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
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

export default function ItemDetails({ itemId, triggerFlash }) {
  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const { signal, cancel } = createAborter();
    setLoading(true);
    setError(null);

    fetchItemDetails(itemId, { signal })
      .then((data) => setItemData(data))
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Failed to load item details');
        }
      })
      .finally(() => setLoading(false));

    return () => cancel();
  }, [itemId]);

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
  if (!itemData) return null;

  const {
    description,
    notes,
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
    keepPriority,
    primaryOwnerName,
    condition,
    isConsumable,
    minimumDesiredQuantity,
    lastCheckedAt,
    acquisitionType,
    purchasePriceCents,
    lastMaintainedAt,
    maintenanceIntervalDays,
    maintenanceNotes,
    box,
    breadcrumb,
    depth,
    topBox,
  } = itemData;

  const tagList = Array.isArray(tags) ? tags : [];
  const usageDates = Array.isArray(usageHistory) ? usageHistory : [];

  const isOrphaned = !box;
  const statusLabel = isOrphaned ? 'Orphaned' : 'Assigned';
  const primaryBox = box ? `${box.label} (${box.box_id})` : '—';
  const topBoxSummary = topBox ? `${topBox?.label || '—'} (${topBox?.box_id || '—'})` : '—';

  return (
    <S.Panel>
      <S.HeaderBand>
        <S.TitleBlock>
          <S.HeaderMeta $compact>
            <S.StatePill $tone={isOrphaned ? 'coral' : 'teal'}>
              {statusLabel}
            </S.StatePill>
            {quantity != null && <S.MetaTag>qty {quantity}</S.MetaTag>}
            {box?.box_id && <S.MetaTag>box {box.box_id}</S.MetaTag>}
          </S.HeaderMeta>
        </S.TitleBlock>
      </S.HeaderBand>

      <S.SectionGrid>
        <DetailSection title="Identity / Summary" tone="teal">
          <DetailRow label="Status" value={statusLabel} />
          <DetailRow label="Primary Box" value={primaryBox} />
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
          <DetailRow label="Value ($)" value={value ?? '—'} />
          <DetailRow label="Value (cents)" value={valueCents ?? '—'} />
          <DetailRow label="Purchase Price (cents)" value={purchasePriceCents ?? '—'} />
        </DetailSection>

        <DetailSection title="Description / Notes" tone="lilac" wide>
          <DetailRow label="Description" value={description || '—'} stretch />
          <DetailRow label="Notes" value={notes || '—'} stretch />
        </DetailSection>

        <DetailSection title="Lifecycle" tone="teal" wide>
          <DetailRow label="Date Acquired" value={fmtDate(dateAcquired)} />
          <DetailRow label="Last Used" value={fmtDate(dateLastUsed)} />
          <DetailRow label="Last Checked" value={fmtDate(lastCheckedAt)} />
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
          <DetailRow label="Keep Priority" value={keepPriority || '—'} />
          <DetailRow label="Primary Owner" value={primaryOwnerName || '—'} />
          <DetailRow label="Condition" value={condition || '—'} />
          <DetailRow
            label="Consumable"
            value={isConsumable ? 'Yes' : 'No'}
          />
          <DetailRow
            label="Min Desired Qty"
            value={minimumDesiredQuantity ?? '—'}
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
          <DetailRow label="Box Description" value={box?.description || '—'} stretch />
          <DetailRow label="Depth" value={depth ?? '—'} />
          <DetailRow label="Top Box" value={topBoxSummary} stretch />
          <DetailRow
            label="Breadcrumb"
            value={<BreadcrumbTrail breadcrumb={breadcrumb} />}
            stretch
          />
        </DetailSection>

        <DetailSection title="Media Metadata" tone="lilac" wide>
          <DetailRow label="Image Path" value={imagePath || '—'} stretch />
        </DetailSection>
      </S.SectionGrid>

      <S.UtilityDock>
        <S.UtilityTitle>Debug</S.UtilityTitle>
        <S.TestButtons>
          <S.FlashButton
            type="button"
            $tone="yellow"
            onClick={() => triggerFlash?.(itemId, 'yellow')}
          >
            Yellow Flash
          </S.FlashButton>
          <S.FlashButton
            type="button"
            $tone="red"
            onClick={() => triggerFlash?.(itemId, 'red')}
          >
            Red Flash
          </S.FlashButton>
        </S.TestButtons>
      </S.UtilityDock>
    </S.Panel>
  );
}
