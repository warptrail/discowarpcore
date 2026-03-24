import * as S from './Retrieval.styles';

export default function RetrievalSearchBar({
  id = 'retrieval-search',
  value,
  onChange,
  label = 'Search Inventory',
  placeholder = 'Search by item, notes, tags, category, box, or location',
  hint = 'Broad match across name, description, notes, tags, category, box, and location.',
}) {
  return (
    <S.SearchWrap>
      <S.SearchLabel>{label}</S.SearchLabel>
      <S.SearchInput
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <S.SearchHint>{hint}</S.SearchHint>
    </S.SearchWrap>
  );
}
