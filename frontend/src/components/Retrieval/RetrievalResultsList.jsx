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
  getItemNavigationState,
  loading = false,
  presentation = 'cards',
}) {
  if (loading) {
    return <S.LoadingState>Loading retrieval results…</S.LoadingState>;
  }

  if (!items.length) {
    return <S.EmptyState>No items match the current search/filter.</S.EmptyState>;
  }

  return (
    <S.ResultsList $compact={presentation === 'ascii'}>
      {items.map((item) => (
        <RetrievalResultRow
          key={item.id}
          item={item}
          isExpanded={activeExpandedId === item.id}
          detailResource={activeExpandedId === item.id ? activeDetailResource : null}
          activeSectionKey={activeExpandedId === item.id ? activeSectionKey : undefined}
          onToggle={onToggleRow}
          onSectionChange={onSectionChange}
          onPreviewImage={onPreviewImage}
          onLifecycleAction={onLifecycleAction}
          itemNavigationState={
            typeof getItemNavigationState === 'function'
              ? getItemNavigationState(item.id)
              : undefined
          }
          compact={presentation === 'ascii'}
        />
      ))}
    </S.ResultsList>
  );
}
