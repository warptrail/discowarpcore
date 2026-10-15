import RetrievalInspector from './RetrievalInspector';
import * as S from './Retrieval.styles';
import RetrievalResultRow from './RetrievalResultRow';

export default function RetrievalResultsList({
  items = [],
  activeExpandedId = '',
  activeDetailResource,
  activeSectionKey,
  onToggleRow,
  onSectionChange,
  onPreviewImage,
  onLifecycleAction,
  onItemUpdated,
  onBoxUpdated,
  query,
  getItemNavigationState,
  loading = false,
  presentation = 'cards',
}) {
  const selectedItem = items.find((item) => item.id === activeExpandedId);

  if (loading) {
    return <S.LoadingState>Loading retrieval results…</S.LoadingState>;
  }

  if (!items.length) {
    return <S.EmptyState>No items match the current search/filter.</S.EmptyState>;
  }

  return (
    <>
    <S.ResultsList $compact={presentation === 'ascii'} $smallCards={presentation === 'compact'}>
      {items.map((item) => (
        <RetrievalResultRow
          key={item.id}
          item={item}
          isExpanded={activeExpandedId === item.id}
          onToggle={onToggleRow}
          onPreviewImage={onPreviewImage}
          compact={presentation === 'ascii'}
          smallCard={presentation === 'compact'}
        />
      ))}
    </S.ResultsList>
    {selectedItem ? <RetrievalInspector
      item={selectedItem}
      panelId={`retrieval-row-panel-${selectedItem.id}`}
      detailResource={activeDetailResource}
      activeSectionKey={activeSectionKey}
      onSectionChange={onSectionChange}
      onPreviewImage={onPreviewImage}
      onLifecycleAction={onLifecycleAction}
      onItemUpdated={onItemUpdated}
      onBoxUpdated={onBoxUpdated}
      query={query}
      itemNavigationState={getItemNavigationState?.(selectedItem.id)}
      onClose={() => {
        onToggleRow?.(selectedItem.id);
        requestAnimationFrame(() => document.getElementById(`retrieval-result-${selectedItem.id}`)?.querySelector('[aria-expanded]')?.focus());
      }}
    /> : null}
    </>
  );
}
