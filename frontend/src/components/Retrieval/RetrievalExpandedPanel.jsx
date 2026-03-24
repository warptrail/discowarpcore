import * as S from './Retrieval.styles';
import SiblingItemsChips from './SiblingItemsChips';
import {
  formatKeepPriorityLabel,
  keepPriorityTone,
  normalizeKeepPriority,
} from '../../util/keepPriority';

export default function RetrievalExpandedPanel({ item, panelId }) {
  if (!item) return null;

  const description = String(item?.description || '').trim();
  const notes = String(item?.notes || '').trim();
  const categoryLabel = String(item?.categoryLabel || '').trim();
  const tags = Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [];
  const pathLine = String(item?.locationPath || '').trim();
  const locationLabel = String(item?.locationLabel || '').trim();
  const keepPriority = normalizeKeepPriority(item?.keepPriority);
  const keepPriorityLabel = formatKeepPriorityLabel(
    item?.keepPriorityLabel || keepPriority,
  );
  const keepPriorityToneValue = keepPriorityTone(keepPriority);
  const hasPrimaryDetails = Boolean(description || notes || pathLine);
  const hasMetadata = Boolean(categoryLabel || keepPriorityLabel || tags.length || locationLabel);
  const hasSiblings = Array.isArray(item.siblingItems) && item.siblingItems.length > 0;
  const hasContext = Boolean(hasMetadata || hasSiblings || item?.boxHref);

  return (
    <S.ExpandedPanel
      id={panelId}
      role="region"
      aria-label={`Retrieval details for ${item.name}`}
      $hasPrimaryPanel={hasPrimaryDetails}
    >
      {hasPrimaryDetails ? (
        <S.ExpandedItemPanel>
          <S.ExpandedPanelTitle>Item details</S.ExpandedPanelTitle>

          {description ? (
            <S.ExpandedDetailBlock>
              <S.ExpandedDetailLabel>Description</S.ExpandedDetailLabel>
              <S.ExpandedDetailText>{description}</S.ExpandedDetailText>
            </S.ExpandedDetailBlock>
          ) : null}

          {notes ? (
            <S.ExpandedDetailBlock>
              <S.ExpandedDetailLabel>Notes</S.ExpandedDetailLabel>
              <S.ExpandedDetailText>{notes}</S.ExpandedDetailText>
            </S.ExpandedDetailBlock>
          ) : null}

          {pathLine ? (
            <S.ExpandedDetailBlock>
              <S.ExpandedDetailLabel>Path</S.ExpandedDetailLabel>
              <S.ExpandedPathText>{pathLine}</S.ExpandedPathText>
            </S.ExpandedDetailBlock>
          ) : null}
        </S.ExpandedItemPanel>
      ) : null}

      {hasContext ? (
        <S.ExpandedBoxPanel>
          <S.ExpandedPanelTitle>Related context</S.ExpandedPanelTitle>

          {hasMetadata ? (
            <S.ExpandedMetadataGrid>
              {categoryLabel ? (
                <S.ExpandedMetaCard>
                  <S.ExpandedDetailLabel>Category</S.ExpandedDetailLabel>
                  <S.CategoryValue>{categoryLabel}</S.CategoryValue>
                </S.ExpandedMetaCard>
              ) : null}

              {keepPriorityLabel ? (
                <S.ExpandedMetaCard>
                  <S.ExpandedDetailLabel>Keep Priority</S.ExpandedDetailLabel>
                  <S.KeepPriorityChip $tone={keepPriorityToneValue}>
                    {keepPriorityLabel}
                  </S.KeepPriorityChip>
                </S.ExpandedMetaCard>
              ) : null}

              {locationLabel ? (
                <S.ExpandedMetaCard>
                  <S.ExpandedDetailLabel>Location</S.ExpandedDetailLabel>
                  <S.ExpandedContextValue>{locationLabel}</S.ExpandedContextValue>
                </S.ExpandedMetaCard>
              ) : null}

              {tags.length ? (
                <S.ExpandedMetaCard $fullWidth>
                  <S.ExpandedDetailLabel>Tags</S.ExpandedDetailLabel>
                  <S.TagRow>
                    {tags.map((tag) => (
                      <S.ItemTagChip key={`${item.id}-${tag}`}>{tag}</S.ItemTagChip>
                    ))}
                  </S.TagRow>
                </S.ExpandedMetaCard>
              ) : null}
            </S.ExpandedMetadataGrid>
          ) : null}

          {hasSiblings ? (
            <SiblingItemsChips siblingItems={item.siblingItems} limit={8} />
          ) : (
            <S.SiblingSection>
              <S.SiblingLabel>Other items in this box:</S.SiblingLabel>
              <S.ExpandedMuted>No other tracked items in this box.</S.ExpandedMuted>
            </S.SiblingSection>
          )}

          {item.boxHref ? (
            <S.ExpandedBoxLink to={item.boxHref}>Open box page</S.ExpandedBoxLink>
          ) : (
            <S.ExpandedMuted>Box page unavailable for this item.</S.ExpandedMuted>
          )}
        </S.ExpandedBoxPanel>
      ) : null}
    </S.ExpandedPanel>
  );
}
