import React from 'react';
import * as S from './BoxEditForm.styles';

export default function BoxFormActions({
  onCancel,
  busy,
  canSave,
  onDestroy,
  destroyBusy = false,
  compact = false,
}) {
  const isBusy = busy || destroyBusy;

  return (
    <S.Actions $compact={compact}>
      {typeof onDestroy === 'function' ? (
        <S.DangerGhost
          type="button"
          onClick={onDestroy}
          disabled={isBusy}
          $compact={compact}
        >
          {destroyBusy ? 'Destroying…' : 'Destroy Box'}
        </S.DangerGhost>
      ) : null}
      <S.Ghost type="button" onClick={onCancel} disabled={isBusy} $compact={compact}>
        Cancel
      </S.Ghost>
      <S.Primary type="submit" disabled={!canSave || isBusy} $compact={compact}>
        {busy ? 'Saving…' : 'Save changes'}
      </S.Primary>
    </S.Actions>
  );
}
