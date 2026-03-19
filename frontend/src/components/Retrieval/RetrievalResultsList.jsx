import * as S from './Retrieval.styles';
import RetrievalResultRow from './RetrievalResultRow';

export default function RetrievalResultsList({
  items = [],
  expandedIds = new Set(),
  onToggleRow,
  onPreviewImage,
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
          isExpanded={expandedIds.has(item.id)}
          onToggle={onToggleRow}
          onPreviewImage={onPreviewImage}
        />
      ))}
    </S.ResultsList>
  );
}
