import { useCallback, useEffect, useRef, useState } from 'react';

const FLASH_MS = 1000;

export default function useItemEffects() {
  const [openItemId, setOpenItemId] = useState(null);
  const [pulsing, setPulsing] = useState([]);
  const [effectsById, setEffectsById] = useState({});
  const accent = 'blue';
  const collapseDurMs = 300;

  const flashTimersRef = useRef({});

  const startPulse = useCallback((itemId) => {
    setPulsing((prev) => [...new Set([...prev, itemId])]);
  }, []);

  const stopPulse = useCallback((itemId) => {
    setPulsing((prev) => prev.filter((id) => id !== itemId));
  }, []);

  const triggerFlash = useCallback((itemId, color = 'blue', ms = FLASH_MS) => {
    if (flashTimersRef.current[itemId]) {
      clearTimeout(flashTimersRef.current[itemId]);
      delete flashTimersRef.current[itemId];
    }

    setEffectsById((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], flash: null },
    }));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEffectsById((prev) => ({
          ...prev,
          [itemId]: { ...prev[itemId], flash: color },
        }));

        const t = setTimeout(() => {
          setEffectsById((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], flash: null },
          }));
          delete flashTimersRef.current[itemId];
        }, ms);

        flashTimersRef.current[itemId] = t;
      });
    });
  }, []);

  const handleOpen = useCallback(
    (itemId) => {
      if (openItemId === itemId) {
        triggerFlash(itemId);
        stopPulse(itemId);
        setOpenItemId(null);
      } else {
        if (openItemId) {
          triggerFlash(openItemId);
          stopPulse(openItemId);
        }
        triggerFlash(itemId);
        startPulse(itemId);
        setOpenItemId(itemId);
      }
    },
    [openItemId, triggerFlash, startPulse, stopPulse],
  );

  const handleFlash = useCallback((id, effect) => {
    setEffectsById((prev) => ({ ...prev, [id]: effect }));
  }, []);

  useEffect(() => {
    return () => {
      Object.values(flashTimersRef.current).forEach(clearTimeout);
      flashTimersRef.current = {};
    };
  }, []);

  return {
    openItemId,
    pulsing,
    effectsById,
    accent,
    collapseDurMs,
    setOpenItemId,
    startPulse,
    stopPulse,
    triggerFlash,
    handleOpen,
    handleFlash,
  };
}
