import React from 'react';
import * as S from '../../styles/EditItemDetailsForm.styles';

export default function EditItemFormActions({
  saving,
  isDirty,
  onRevert,
  onCancel,
}) {
  return (
    <S.Actions>
      {typeof onCancel === 'function' ? (
        <S.RevertButton type="button" onClick={onCancel} disabled={saving}>
          View
        </S.RevertButton>
      ) : null}

      <S.SaveButton type="submit" disabled={!isDirty || saving}>
        {saving ? 'Saving...' : 'Save'}
      </S.SaveButton>

      <S.RevertButton
        type="button"
        onClick={onRevert}
        disabled={!isDirty || saving}
      >
        Revert
      </S.RevertButton>
    </S.Actions>
  );
}
