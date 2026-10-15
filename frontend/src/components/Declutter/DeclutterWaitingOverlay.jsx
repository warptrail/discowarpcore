import { useRef } from 'react';
import { Link } from 'react-router-dom';

import * as S from './Declutter.styles';
import * as W from './DeclutterWaitingOverlay.styles';
import useDialogFocus from '../../hooks/useDialogFocus';
import {
  getItemBoxLabel,
  getItemCategoryLabel,
  getItemId,
  getItemLocationLabel,
  getItemName,
  getSessionItemItem,
} from './declutterUtils';

export default function DeclutterWaitingOverlay({ candidates = [], onRequestClose }) {
  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, onRequestClose);

  return (
    <W.Backdrop role="presentation" onMouseDown={onRequestClose}>
      <W.Dialog ref={dialogRef} tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="declutter-waiting-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <S.QueuePopoverHeader>
          <div>
            <S.Eyebrow id="declutter-waiting-title">Your queue</S.Eyebrow>
            <S.QueuePopoverTitle>{candidates.length} waiting</S.QueuePopoverTitle>
          </div>
          <S.IconButton type="button" aria-label="Close waiting list" onClick={onRequestClose}>×</S.IconButton>
        </S.QueuePopoverHeader>
        <S.QueueLinkList>
          {candidates.map((candidate) => {
            const item = getSessionItemItem(candidate);
            const itemId = getItemId(item) || String(candidate?.itemId || '');
            const location = getItemLocationLabel(item);
            const context = [getItemBoxLabel(item), location, getItemCategoryLabel(item)]
              .filter(Boolean)
              .join(' • ');
            return (
              <S.QueueLink
                key={String(candidate?.id || itemId)}
                to={`/items/${encodeURIComponent(itemId)}`}
                onClick={onRequestClose}
              >
                <strong>{getItemName(item)}</strong>
                <small>{context}</small>
              </S.QueueLink>
            );
          })}
        </S.QueueLinkList>
      </W.Dialog>
    </W.Backdrop>
  );
}
