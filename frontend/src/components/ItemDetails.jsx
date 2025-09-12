// src/components/ItemDetails.jsx
import React from 'react';
import * as S from '../styles/ItemDetails.styles'; // optional

export default function ItemDetails({ item, isOpen, isOpening, isClosing }) {
  if (!item) return null;

  return (
    <S.DetailsCard
      data-open={isOpen ? 'true' : 'false'}
      data-opening={isOpening ? 'true' : 'false'}
      data-closing={isClosing ? 'true' : 'false'}
    >
      <S.Wrapper>
        <S.Header>
          <S.Thumb src={item.imagePath || '/img/filler.png'} alt={item.name} />
          <div>
            <S.Title>{item.name}</S.Title>
            {!!item.quantity && item.quantity !== 1 && (
              <S.Micro>Quantity: {item.quantity}</S.Micro>
            )}
          </div>
        </S.Header>

        {item.notes && <S.Notes>{item.notes}</S.Notes>}

        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <S.Tags>
            {item.tags.map((t) => (
              <S.Tag key={t}>{t}</S.Tag>
            ))}
          </S.Tags>
        )}

        <S.MetaRow>
          {item.createdAt && (
            <S.Micro>
              Added {new Date(item.createdAt).toLocaleDateString()}
            </S.Micro>
          )}
          {item.updatedAt && (
            <S.Micro>
              · Updated {new Date(item.updatedAt).toLocaleDateString()}
            </S.Micro>
          )}
        </S.MetaRow>
      </S.Wrapper>
    </S.DetailsCard>
  );
}
