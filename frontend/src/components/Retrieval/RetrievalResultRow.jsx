import * as S from './Retrieval.styles';
import BoxBadge from './BoxBadge';
import RetrievalExpandedPanel from './RetrievalExpandedPanel';

function shouldSkipRowToggle(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, [data-thumb-surface="true"]'));
}

export default function RetrievalResultRow({
  item,
  isExpanded = false,
  onToggle,
  onPreviewImage,
}) {
  if (!item) return null;
  const panelId = `retrieval-row-panel-${item.id}`;

  const handleToggle = () => {
    if (typeof onToggle === 'function') {
      onToggle(item.id);
    }
  };

  const handleSummaryClick = (event) => {
    if (shouldSkipRowToggle(event.target)) return;
    handleToggle();
  };

  const handleSummaryKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (shouldSkipRowToggle(event.target)) return;
    event.preventDefault();
    handleToggle();
  };

  const imageUrl = String(item?.imageUrl || '').trim();
  const previewImageUrl = String(item?.previewImageUrl || imageUrl).trim();
  const locationLabel = String(item?.locationLabel || '').trim();
  const hasImage = Boolean(imageUrl);

  const handleThumbClick = (event) => {
    event.stopPropagation();
    if (!hasImage) return;
    if (typeof onPreviewImage === 'function') {
      onPreviewImage({ src: previewImageUrl, name: item.name });
    }
  };

  return (
    <S.ResultCard>
      <S.SummaryButton
        onClick={handleSummaryClick}
        onKeyDown={handleSummaryKeyDown}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} box context for ${item.name}`}
        role="button"
        tabIndex={0}
        $expanded={isExpanded}
      >
        <S.SummaryTop>
          <S.RowMain>
            {hasImage ? (
              <S.ThumbPreviewButton
                type="button"
                onClick={handleThumbClick}
                aria-label={`Preview image for ${item.name}`}
                data-thumb-surface="true"
              >
                <S.ThumbImage src={imageUrl} alt={`${item.name} thumbnail`} loading="lazy" />
              </S.ThumbPreviewButton>
            ) : (
              <S.ThumbFrame data-thumb-surface="true">
                <S.ThumbPlaceholder>No Image</S.ThumbPlaceholder>
              </S.ThumbFrame>
            )}

            <S.BadgeStack>
              <S.ItemLineSlot>
                {item.itemHref ? (
                  <S.ItemLineLink
                    to={item.itemHref}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {item.name}
                  </S.ItemLineLink>
                ) : (
                  <S.ItemLine>{item.name}</S.ItemLine>
                )}
              </S.ItemLineSlot>

              <S.CompactMetaLine>
                <BoxBadge boxNumber={item.boxNumber} boxName={item.boxName} compact />
                {locationLabel ? (
                  <S.CompactLocation title={locationLabel}>{locationLabel}</S.CompactLocation>
                ) : null}
              </S.CompactMetaLine>
            </S.BadgeStack>
          </S.RowMain>

          <S.ExpandControl $expanded={isExpanded} aria-hidden="true">
            <S.ExpandCaret aria-hidden="true">{isExpanded ? '▾' : '▸'}</S.ExpandCaret>
          </S.ExpandControl>
        </S.SummaryTop>
      </S.SummaryButton>

      {isExpanded ? <RetrievalExpandedPanel item={item} panelId={panelId} /> : null}
    </S.ResultCard>
  );
}
