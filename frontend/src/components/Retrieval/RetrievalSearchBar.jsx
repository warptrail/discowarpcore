import * as S from './Retrieval.styles';

export default function RetrievalSearchBar({ value, onChange }) {
  return (
    <S.SearchWrap>
      <S.SearchLabel>Search Inventory</S.SearchLabel>
      <S.SearchInput
        id="retrieval-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by item, notes, tags, category, box, or location"
        autoComplete="off"
      />
      <S.SearchHint>
        Broad match across name, description, notes, tags, category, box, and location.
      </S.SearchHint>
    </S.SearchWrap>
  );
}
