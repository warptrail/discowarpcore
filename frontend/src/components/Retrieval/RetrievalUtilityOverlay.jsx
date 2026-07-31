import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import RetrievalPage from './RetrievalPage';
import * as S from './RetrievalUtilityOverlay.styles';
import {
  RETRIEVAL_FINDER_CLOSE_EVENT,
  RETRIEVAL_FINDER_OPEN_EVENT,
} from '../../constants/inventoryFinderEvents';

export default function RetrievalUtilityOverlay({
  isOpen,
  onRequestOpen,
  onRequestClose,
}) {
  const [hasStarted, setHasStarted] = useState(isOpen);
  const transitionLockRef = useRef(false);

  const claimTransition = useCallback(() => {
    if (transitionLockRef.current) return false;
    transitionLockRef.current = true;
    window.setTimeout(() => {
      transitionLockRef.current = false;
    }, 320);
    return true;
  }, []);

  const handleRequestOpen = useCallback(() => {
    if (!claimTransition()) return;
    window.dispatchEvent(new CustomEvent(RETRIEVAL_FINDER_OPEN_EVENT));
    onRequestOpen?.();
  }, [claimTransition, onRequestOpen]);

  const handleRequestClose = useCallback(() => {
    if (!claimTransition()) return;
    window.dispatchEvent(new CustomEvent(RETRIEVAL_FINDER_CLOSE_EVENT));
    onRequestClose?.();
  }, [claimTransition, onRequestClose]);

  useEffect(() => {
    if (isOpen) setHasStarted(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    window.dispatchEvent(new CustomEvent(RETRIEVAL_FINDER_OPEN_EVENT));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const focusSearch = window.setTimeout(() => {
      document.getElementById('retrieval-console-search')?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleRequestClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusSearch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleRequestClose, isOpen]);

  if (!hasStarted || typeof document === 'undefined') return null;

  return createPortal(
    <S.Backdrop
      $open={isOpen}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleRequestClose();
      }}
    >
      <S.UtilityPanel
        $open={isOpen}
        role="region"
        aria-label="Item finder results"
      >
        <S.PanelHint>Use the Header console to search and refine. Tap outside this panel to collapse it.</S.PanelHint>
        <RetrievalPage
          onToggleResults={isOpen ? handleRequestClose : handleRequestOpen}
          resultsVisible={isOpen}
        />
      </S.UtilityPanel>
    </S.Backdrop>,
    document.body,
  );
}
