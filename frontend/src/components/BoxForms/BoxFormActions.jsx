import React from 'react';
import * as S from './BoxEditForm.styles';

export default function BoxFormActions({ onCancel, busy, canSave }) {
  return (
    <S.Actions>
      <S.Ghost type="button" onClick={onCancel} disabled={busy}>
        Cancel
      </S.Ghost>
      <S.Primary type="submit" disabled={!canSave}>
        {busy ? 'Saving…' : 'Save changes'}
      </S.Primary>
    </S.Actions>
  );
}
