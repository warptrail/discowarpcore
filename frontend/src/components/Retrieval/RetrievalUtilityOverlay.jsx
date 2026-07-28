import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import RetrievalPage from './RetrievalPage';
import * as S from './RetrievalUtilityOverlay.styles';

export default function RetrievalUtilityOverlay({
  isOpen,
  onRequestOpen,
  onRequestClose,
}) {
  const [hasStarted, setHasStarted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setHasStarted(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const focusSearch = window.setTimeout(() => {
      document.getElementById('retrieval-console-search')?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onRequestClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusSearch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onRequestClose]);

  if (!hasStarted || typeof document === 'undefined') return null;

  return createPortal(
    <S.Backdrop
      $open={isOpen}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onRequestClose?.();
      }}
    >
      <S.UtilityPanel
        $open={isOpen}
        role="region"
        aria-label="Item finder results"
      >
        <S.PanelHint>Use the Header console to search and refine. Tap outside this panel to collapse it.</S.PanelHint>
        <RetrievalPage
          onToggleResults={isOpen ? onRequestClose : onRequestOpen}
          resultsVisible={isOpen}
        />
      </S.UtilityPanel>
    </S.Backdrop>,
    document.body,
  );
}
