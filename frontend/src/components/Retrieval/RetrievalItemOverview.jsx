import MissingStatus from '../MissingItems/MissingStatus';
import TagLinks from '../TagLinks';
import FinderItemPlacement from '../InventoryQuickAnswer/FinderItemPlacement';
import * as Finder from '../InventoryQuickAnswer/FinderItemFocus.styles';
import RetrievalEditableField from './RetrievalEditableField';
import { useRetrievalItemEditing } from './RetrievalItemEditingContext';
import SearchHighlight from '../SearchHighlight';
import { getSearchTerms } from '../../util/searchHighlight';
import * as S from './RetrievalItemPanel.styles';
import * as O from './RetrievalOverview.styles';

export default function RetrievalItemOverview({ item, model, query, onPreviewImage, detailResource }) {
  const editing = useRetrievalItemEditing();
  const { answer } = model;
  const terms = getSearchTerms(query);
  const highlight = (text) => <SearchHighlight text={String(text)} terms={terms} />;
  return <>
    <O.Identity aria-label="Item identity">
      <O.Name aria-label={answer.name}><RetrievalEditableField fieldKey="name" variant="prose">{highlight(answer.name)}</RetrievalEditableField></O.Name>
      <MissingStatus item={answer.item} home /><O.Facts>
        {answer.item.category ? <RetrievalEditableField fieldKey="category" variant="compact">{highlight(answer.item.category)}</RetrievalEditableField> : null}
        {answer.item.category && answer.item.quantity != null ? <O.FactSeparator aria-hidden="true">·</O.FactSeparator> : null}
        {answer.item.quantity != null ? <RetrievalEditableField fieldKey="quantity" variant="compact">Quantity {answer.item.quantity}</RetrievalEditableField> : null}
      </O.Facts>
      <RetrievalEditableField fieldKey="description" variant="prose"><O.Description>{highlight(model.description || 'No description recorded.')}</O.Description></RetrievalEditableField>
      <TagLinks tags={model.tags} />
      {editing?.canEdit('tags') ? <RetrievalEditableField fieldKey="tags" variant="action">{model.tags.length ? 'Edit tags' : 'Add tags'}</RetrievalEditableField> : null}
    </O.Identity>
    <O.Grid>
      <O.Photo key={answer.id} item={answer.item} name={answer.name}
        imageUrl={item.previewImageUrl || item.imageUrl} onPreviewImage={onPreviewImage}
        emptyContent={<O.EmptyPhoto>
          <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="5" y="5" width="54" height="50" rx="4" />
            <circle cx="42" cy="20" r="4" /><path d="M6 45 22 27l13 15 7-8 16 18" /></svg>
          <span>No item photo recorded</span>
        </O.EmptyPhoto>} />
      <O.Placement>
        <Finder.BoxIdentity><strong>{answer.unboxed ? 'Items Adrift' : `#${answer.boxId || '—'}`}</strong>
          <span>{highlight(answer.boxLabel || (answer.unboxed ? '' : 'Box name not recorded'))}</span>
        </Finder.BoxIdentity>
        {detailResource?.status === 'loading' && !detailResource.data ? <S.Hint>Loading location details…</S.Hint>
          : detailResource?.status === 'error' && !detailResource.data ? <S.Hint>Location details unavailable.</S.Hint>
            : <FinderItemPlacement answer={answer} query={query} compact
              renderAttribute={(key, value) => <RetrievalEditableField fieldKey={key} variant="compact">{value}</RetrievalEditableField>} />}
      </O.Placement>
    </O.Grid>
    {detailResource?.status === 'loading' ? <Finder.RecordedNote role="status">Loading full item details…</Finder.RecordedNote> : null}
    {detailResource?.status === 'error' ? <S.Status role="alert">Full details unavailable. <S.Button type="button" onClick={detailResource.retry}>Retry</S.Button></S.Status> : null}
  </>;
}
