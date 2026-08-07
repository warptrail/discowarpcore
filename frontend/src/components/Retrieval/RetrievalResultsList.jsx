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
  loading = false,
}) {
  if (loading) {
    return <S.LoadingState>Loading retrieval results…</S.LoadingState>;
  }

  if (!items.length) {
    return <S.EmptyState>No items match the current search/filter.</S.EmptyState>;
  }

  return (
    <S.ResultsList>
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
        />
      ))}
    </S.ResultsList>
  );
}
