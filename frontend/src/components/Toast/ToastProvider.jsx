import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContext } from './ToastContext';

export function ToastProvider({ children }) {
  const location = useLocation();
  const [toast, setToast] = useState(null);
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
    } = config;

    setToast({
      title,
      message,
      variant,
      actions,
      content,
      onClose,
      sticky,
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
  }, [location.pathname, hideToast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}
