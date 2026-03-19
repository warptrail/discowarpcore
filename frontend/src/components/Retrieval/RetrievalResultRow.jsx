import * as S from './Retrieval.styles';
import LocationBadge from './LocationBadge';
import BoxBadge from './BoxBadge';
import RetrievalExpandedPanel from './RetrievalExpandedPanel';

function shouldSkipRowToggle(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, [data-thumb-surface="true"]'));
}

function getVisibleTags(item, max = 6) {
  const tags = Array.isArray(item?.tags) ? item.tags : [];
  return tags.filter(Boolean).slice(0, max);
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

  const categoryLabel = String(item?.categoryLabel || '').trim();
  const visibleTags = getVisibleTags(item, 6);
  const pathLine = String(item?.locationPath || '').trim();
  const imageUrl = String(item?.imageUrl || '').trim();
  const previewImageUrl = String(item?.previewImageUrl || imageUrl).trim();
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
              {item.itemHref ? (
                <S.ItemPillLink
                  to={item.itemHref}
                  onClick={(event) => event.stopPropagation()}
                >
                  {item.name}
                </S.ItemPillLink>
              ) : (
                <S.ItemPill>{item.name}</S.ItemPill>
              )}

              <LocationBadge label={item.locationLabel} />
              <BoxBadge boxNumber={item.boxNumber} boxName={item.boxName} />

              {categoryLabel ? (
                <S.MetaBlock>
                  <S.MetaLabel>Category</S.MetaLabel>
                  <S.CategoryValue>{categoryLabel}</S.CategoryValue>
                </S.MetaBlock>
              ) : null}

              {visibleTags.length ? (
                <S.MetaBlock>
                  <S.MetaLabel>Tags</S.MetaLabel>
                  <S.TagRow>
                    {visibleTags.map((tag) => (
                      <S.ItemTagChip key={`${item.id}-${tag}`}>{tag}</S.ItemTagChip>
                    ))}
                  </S.TagRow>
                </S.MetaBlock>
              ) : null}

              {pathLine ? <S.PathLine>{pathLine}</S.PathLine> : null}
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
