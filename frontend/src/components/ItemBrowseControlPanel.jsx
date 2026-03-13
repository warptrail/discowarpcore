import React from 'react';
import * as S from '../styles/ItemBrowseControlPanel.styles';

export default function ItemBrowseControlPanel({
  idPrefix = 'item-browse',
  title = '',
  searchValue = '',
  searchPlaceholder = 'Search items...',
  searchAriaLabel = 'Search items',
  onSearchChange,
  sortValue = '',
  sortOptions = [],
  sortAriaLabel = 'Sort items',
  onSortChange,
  statusText = '',
}) {
  const safeSortOptions = Array.isArray(sortOptions) ? sortOptions : [];
  const searchInputId = `${idPrefix}-search`;
  const sortSelectId = `${idPrefix}-sort`;

  return (
    <S.PanelShell>
      {title ? (
        <S.TitleRow>
          <S.TitlePip aria-hidden="true" />
          <S.Title>{title}</S.Title>
        </S.TitleRow>
      ) : null}

      <S.ControlsRow>
        <S.ControlGroup $tone="#7FD7FF">
          <S.ControlLabel htmlFor={searchInputId}>Search</S.ControlLabel>
          <S.SearchInput
            id={searchInputId}
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
          />
        </S.ControlGroup>

        <S.ControlGroup $tone="#E8B15C">
          <S.ControlLabel htmlFor={sortSelectId}>Sort</S.ControlLabel>
          <S.SortSelect
            id={sortSelectId}
            value={sortValue}
            onChange={(e) => onSortChange?.(e.target.value)}
            aria-label={sortAriaLabel}
          >
            {safeSortOptions.map((opt) => (
              <option key={String(opt?.value)} value={String(opt?.value ?? '')}>
                {String(opt?.label ?? opt?.value ?? '')}
              </option>
            ))}
          </S.SortSelect>
        </S.ControlGroup>

        {statusText ? <S.Status aria-live="polite">{statusText}</S.Status> : null}
      </S.ControlsRow>
    </S.PanelShell>
  );
}
