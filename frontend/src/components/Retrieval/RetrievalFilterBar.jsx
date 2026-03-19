import * as S from './Retrieval.styles';

function renderOptions(options) {
  const safeOptions = Array.isArray(options) ? options : [];

  return safeOptions.map((option) => (
    <option key={option.key} value={option.key}>
      {option.label}
    </option>
  ));
}

export default function RetrievalFilterBar({
  categoryOptions = [],
  tagOptions = [],
  locationOptions = [],
  ownerOptions = [],
  selectedCategory = '',
  selectedTag = '',
  selectedLocation = '',
  selectedOwner = '',
  onCategoryChange,
  onTagChange,
  onLocationChange,
  onOwnerChange,
  onAddCategory,
  onAddTag,
  onAddLocation,
  onAddOwner,
}) {
  return (
    <S.FilterGrid>
      <S.FilterControl>
        <S.FilterLabel>Category</S.FilterLabel>
        <S.FilterRow>
          <S.FilterSelect
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">Select category…</option>
            {renderOptions(categoryOptions)}
          </S.FilterSelect>
          <S.AddFilterButton
            type="button"
            onClick={onAddCategory}
            disabled={!selectedCategory}
          >
            Add
          </S.AddFilterButton>
        </S.FilterRow>
      </S.FilterControl>

      <S.FilterControl>
        <S.FilterLabel>Tag</S.FilterLabel>
        <S.FilterRow>
          <S.FilterSelect
            value={selectedTag}
            onChange={(event) => onTagChange(event.target.value)}
          >
            <option value="">Select tag…</option>
            {renderOptions(tagOptions)}
          </S.FilterSelect>
          <S.AddFilterButton
            type="button"
            onClick={onAddTag}
            disabled={!selectedTag}
          >
            Add
          </S.AddFilterButton>
        </S.FilterRow>
      </S.FilterControl>

      <S.FilterControl>
        <S.FilterLabel>Location</S.FilterLabel>
        <S.FilterRow>
          <S.FilterSelect
            value={selectedLocation}
            onChange={(event) => onLocationChange(event.target.value)}
          >
            <option value="">Select location…</option>
            {renderOptions(locationOptions)}
          </S.FilterSelect>
          <S.AddFilterButton
            type="button"
            onClick={onAddLocation}
            disabled={!selectedLocation}
          >
            Add
          </S.AddFilterButton>
        </S.FilterRow>
      </S.FilterControl>

      <S.FilterControl>
        <S.FilterLabel>Primary Owner</S.FilterLabel>
        <S.FilterRow>
          <S.FilterSelect
            value={selectedOwner}
            onChange={(event) => onOwnerChange(event.target.value)}
          >
            <option value="">Select owner…</option>
            {renderOptions(ownerOptions)}
          </S.FilterSelect>
          <S.AddFilterButton
            type="button"
            onClick={onAddOwner}
            disabled={!selectedOwner}
          >
            Add
          </S.AddFilterButton>
        </S.FilterRow>
      </S.FilterControl>
    </S.FilterGrid>
  );
}
