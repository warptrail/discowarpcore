import * as S from './Retrieval.styles';
import SiblingItemsChips from './SiblingItemsChips';

export default function RetrievalExpandedPanel({ item, panelId }) {
  if (!item) return null;

  const description = String(item?.description || '').trim();
  const notes = String(item?.notes || '').trim();
  const hasItemDetails = Boolean(description || notes);
  const hasSiblings = Array.isArray(item.siblingItems) && item.siblingItems.length > 0;

  return (
    <S.ExpandedPanel
      id={panelId}
      role="region"
      aria-label={`Retrieval details for ${item.name}`}
    >
      {hasItemDetails ? (
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
        </S.ExpandedItemPanel>
      ) : null}

      <S.ExpandedBoxPanel>
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
    </S.ExpandedPanel>
  );
}
