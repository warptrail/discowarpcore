// src/components/ItemDetails.jsx
import React from 'react';
import * as S from '../styles/ItemDetails.styles'; // optional

export default function ItemDetails({ item }) {
  if (!item) return null;

  return (
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

      {/* If your backend later includes item.box or item.boxPath, show it here */}
      {/* {item.box && <S.Micro>In: #{item.box.box_id} · {item.box.name}</S.Micro>} */}
    </S.Wrapper>
  );
}
