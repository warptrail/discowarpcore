import { useCallback, useRef, useState } from 'react';
import { ToastContext } from './ToastContext';

export function ToastProvider({ children }) {
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
      sticky = false,
      timeoutMs = 4500,
    } = config;

    setToast({
      title,
      message,
      variant,
      actions,
      sticky,
    });

    if (!sticky) {
      dismissTimerRef.current = setTimeout(() => {
        setToast(null);
        dismissTimerRef.current = null;
      }, timeoutMs);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}
