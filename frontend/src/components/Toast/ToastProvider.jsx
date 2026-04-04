import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContext } from './ToastContext';

export function ToastProvider({ children }) {
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const [activeRetrievalItem, setActiveRetrievalItem] = useState(null);
  const dismissTimerRef = useRef(null);

  const clearTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const hideToast = useCallback(() => {
    clearTimer();
    setToast(null);
  }, []);

  const showToast = useCallback((config) => {
    clearTimer();

    const {
      title,
      message,
      variant = 'info',
      actions = [],
      content = null,
      onClose,
      sticky = false,
      timeoutMs = 4500,
      loading = false,
    } = config;

    setToast({
      title,
      message,
      variant,
      actions,
      content,
      onClose,
      sticky,
      loading,
    });

    if (!sticky) {
      dismissTimerRef.current = setTimeout(() => {
        setToast(null);
        dismissTimerRef.current = null;
      }, timeoutMs);
    }
  }, []);

  useEffect(() => {
    // Clear route-scoped console/toast state on path navigation.
    hideToast();
    if (!String(location.pathname || '').startsWith('/retrieval')) {
      setActiveRetrievalItem(null);
    }
  }, [location.pathname, hideToast]);

  return (
    <ToastContext.Provider
      value={{
        toast,
        showToast,
        hideToast,
        activeRetrievalItem,
        setActiveRetrievalItem,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}
