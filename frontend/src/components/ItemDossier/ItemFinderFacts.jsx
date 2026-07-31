import React from 'react';
import * as S from './ItemDossier.styles';

function hasValue(value) {
  const text = String(value ?? '').trim();
  return Boolean(text && text !== '—');
}

export default function ItemFinderFacts({
  location,
  boxId,
  boxLabel,
  description,
  categoryLabel,
  tags = [],
}) {
  const tagList = Array.isArray(tags)
    ? tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : [];
  const showLocation = hasValue(location);
  const showBox = hasValue(boxId) || hasValue(boxLabel);
  const showDescription = hasValue(description);
  const showCategory = hasValue(categoryLabel);

  return (
    <S.FinderFacts aria-label="Finder facts">
      {showLocation || showBox ? (
        <S.FactPair>
          {showLocation ? (
            <S.Fact>
              <S.Label>Location</S.Label>
              <S.FactValue>{location}</S.FactValue>
            </S.Fact>
          ) : null}

          {showBox ? (
            <S.Fact>
              <S.Label>Box</S.Label>
              <S.FactValue>
                {hasValue(boxId) ? <S.BoxId>#{boxId}</S.BoxId> : null}
                {hasValue(boxLabel) ? boxLabel : null}
              </S.FactValue>
            </S.Fact>
          ) : null}
        </S.FactPair>
      ) : null}

      {showDescription ? <S.Description>{description}</S.Description> : null}

      {showCategory || tagList.length ? (
        <S.MetaLine aria-label="Item metadata">
          {showCategory ? <S.Category>{categoryLabel}</S.Category> : null}
          {tagList.map((tag) => (
            <S.MetaItem key={tag}>{tag}</S.MetaItem>
          ))}
        </S.MetaLine>
      ) : null}
    </S.FinderFacts>
  );
}

