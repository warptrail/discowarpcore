import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContext } from './ToastContext';

export function ToastProvider({ children }) {
  const location = useLocation();
  const routeToastHandoff = location.state?.toastHandoff ?? null;
  const [toast, setToast] = useState(null);
  const [activeRetrievalItem, setActiveRetrievalItem] = useState(null);
  const [intakeDraftName, setIntakeDraftName] = useState('');
  const [intakeContext, setIntakeContext] = useState(null);
  const dismissTimerRef = useRef(null);

  const clearTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const hideToast = useCallback((toastId = null) => {
    if (!toastId) {
      clearTimer();
      setToast(null);
      return;
    }

    setToast((current) => {
      if (toastId && current?.id !== toastId) return current;
      clearTimer();
      return null;
    });
  }, []);

  const showToast = useCallback((config) => {
    clearTimer();

    const {
      id,
      title,
      message,
      variant = 'info',
      actions = [],
      content = null,
      titleDetails = null,
      titleAlign = 'start',
      titleSize = 'default',
      presentation = 'default',
      themeStyle = null,
      onClose,
      dismissible = true,
      sticky = false,
      timeoutMs = 4500,
      loading = false,
    } = config;

    setToast({
      id,
      title,
      message,
      variant,
      actions,
      content,
      titleDetails,
      titleAlign,
      titleSize,
      presentation,
      themeStyle,
      onClose,
      dismissible,
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
    if (routeToastHandoff) {
      showToast(routeToastHandoff);
    }
    if (!String(location.pathname || '').startsWith('/retrieval')) {
      setActiveRetrievalItem(null);
    }
    if (!String(location.pathname || '').startsWith('/intake')) {
      setIntakeDraftName('');
      setIntakeContext(null);
    }
  }, [location.pathname, routeToastHandoff, hideToast, showToast]);

  return (
    <ToastContext.Provider
      value={{
        toast,
        showToast,
        hideToast,
        activeRetrievalItem,
        setActiveRetrievalItem,
        intakeDraftName,
        setIntakeDraftName,
        intakeContext,
        setIntakeContext,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}
