import CompactTagRow from '../Tags/CompactTagRow';
import MissingStatus from '../MissingItems/MissingStatus';
import { lazy, Suspense } from 'react';
import { getSearchTerms } from '../../util/searchHighlight';
import FinderItemPhoto from './FinderItemPhoto';
import FinderItemPlacement from './FinderItemPlacement';
import SearchHighlight from '../SearchHighlight';
import { getAnswerMatchFields } from './answerMatchFields';
import * as S from './FinderItemFocus.styles';

const FinderItemNotes = lazy(() => import('./FinderItemNotes'));

export default function FinderItemDetails({ answer, query, view = 'location', showTitle = true,
  titleId = 'finder-focus-title', imageUrl, onPreviewImage, renderAttribute = (_key, value) => value }) {
  const { item } = answer;
  const terms = getSearchTerms(query);
  const highlight = (value) => <SearchHighlight text={String(value)} terms={terms} />;
  const hiddenBoxMatches = getAnswerMatchFields(answer, query).filter(({ label }) => label.startsWith('Box '));
  return <>
    {showTitle ? <S.ItemTitle id={titleId}>{highlight(answer.name)}</S.ItemTitle> : null}
    <MissingStatus item={item} home /><S.BasicFacts>
      {item.category ? <span>{renderAttribute('category', highlight(item.category))}</span> : null}
      {item.quantity != null ? <span>{renderAttribute('quantity', <>Quantity {item.quantity}</>)}</span> : null}
    </S.BasicFacts>
    <S.BoxIdentity><strong>{answer.unboxed ? 'Items Adrift' : `#${answer.boxId || '—'}`}</strong><span>{highlight(answer.boxLabel || (answer.unboxed ? '' : 'Box name not recorded'))}</span></S.BoxIdentity>
    {view === 'location' ? <S.DetailGrid>
      <FinderItemPhoto key={answer.id} item={item} name={answer.name} imageUrl={imageUrl} onPreviewImage={onPreviewImage} />
      <FinderItemPlacement answer={answer} query={query} renderAttribute={renderAttribute} />
    </S.DetailGrid> : view === 'tags' ? <S.Metadata aria-label="Item tags">
      <h3>Tags</h3>{Array.isArray(item.tags) && item.tags.length ? <CompactTagRow tags={item.tags} name={item.name} boxId={answer.boxId || ''} /> : <p>No tags recorded.</p>}
    </S.Metadata> : view === 'notes' ? <Suspense fallback={<S.RecordedNote role="status">Loading notes…</S.RecordedNote>}>
      <FinderItemNotes key={answer.id} notes={item.notes} query={query} />
    </Suspense> : <S.Metadata aria-label="Item details">
        <h3>Description</h3><p>{highlight(item.description || 'No description recorded.')}</p>
        {item.category ? <><h3>Category</h3><p>{highlight(item.category)}</p></> : null}
        {item.primaryOwnerName ? <><h3>Owner</h3><p>{highlight(item.primaryOwnerName)}</p></> : null}
        {item.quantity != null ? <><h3>Quantity</h3><p>{item.quantity}</p></> : null}
        {item.keepPriority ? <><h3>Keep priority</h3><p>{highlight(item.keepPriority)}</p></> : null}
        {item.location ? <><h3>Recorded item location</h3><p>{highlight(item.location)}</p></> : null}
        {hiddenBoxMatches.map(({ label, value }) => <div key={label}><h3>{label} · keyword match</h3><p>{highlight(value)}</p></div>)}
      </S.Metadata>}
  </>;
}
