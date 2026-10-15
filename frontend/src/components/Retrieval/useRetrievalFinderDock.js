import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function useRetrievalFinderDock({ onFinderDetachedChange, desktop = false }) {
  const [consoleMount, setConsoleMount] = useState(null);
  const [searchConsoleMount, setSearchConsoleMount] = useState(null);
  // Move the host, not the React tree, so drafts and disclosures survive docking.
  const [portalTarget] = useState(() => (
    typeof document !== 'undefined' ? document.createElement('div') : null
  ));
  const inlineMeasureRef = useRef(null);
  const searchInlineRef = useRef(null);
  const [searchPortalTarget] = useState(() => (
    typeof document !== 'undefined' ? document.createElement('div') : null
  ));

  useEffect(() => {
    const sync = () => {
      setConsoleMount(document.getElementById('retrieval-console-finder-mount'));
      setSearchConsoleMount(document.getElementById('retrieval-console-search-mount'));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // The open finder stays attached at every viewport and scroll depth.
    onFinderDetachedChange?.(false);
  }, [onFinderDetachedChange]);

  const formIsInConsole = Boolean(consoleMount);
  const searchIsInConsole = Boolean(desktop && searchConsoleMount);
  useLayoutEffect(() => {
    if (!portalTarget) return;
    const host = formIsInConsole && consoleMount ? consoleMount : inlineMeasureRef.current;
    if (host && portalTarget.parentNode !== host) host.appendChild(portalTarget);
  }, [consoleMount, formIsInConsole, portalTarget]);

  useLayoutEffect(() => {
    if (!searchPortalTarget) return;
    const host = searchIsInConsole ? searchConsoleMount : searchInlineRef.current;
    if (!host || searchPortalTarget.parentNode === host) return;
    const focused = searchPortalTarget.contains(document.activeElement) ? document.activeElement : null;
    const selection = focused && typeof focused.selectionStart === 'number'
      ? [focused.selectionStart, focused.selectionEnd, focused.selectionDirection] : null;
    host.appendChild(searchPortalTarget);
    focused?.focus({ preventScroll: true });
    if (selection) focused.setSelectionRange(...selection);
  }, [searchConsoleMount, searchIsInConsole, searchPortalTarget]);

  useEffect(() => () => portalTarget?.remove(), [portalTarget]);
  useEffect(() => () => searchPortalTarget?.remove(), [searchPortalTarget]);

  return { portalTarget, inlineMeasureRef, formIsInConsole, searchPortalTarget, searchInlineRef, searchIsInConsole };
}
