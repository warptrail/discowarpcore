import { useCallback, useEffect, useRef, useState } from 'react';

export const ITEM_FLASH_MS = 1000;
export const ITEM_FLASH_VARIANTS = ['blue', 'yellow', 'red'];
const FLASH_VARIANT_SET = new Set(ITEM_FLASH_VARIANTS);

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

  const triggerItemFlash = useCallback((itemId, color = 'blue', ms = ITEM_FLASH_MS) => {
    if (!itemId) return;

    const variant = FLASH_VARIANT_SET.has(color) ? color : 'blue';
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
          [itemId]: { ...prev[itemId], flash: variant },
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
        triggerItemFlash(itemId);
        stopPulse(itemId);
        setOpenItemId(null);
      } else {
        if (openItemId) {
          triggerItemFlash(openItemId);
          stopPulse(openItemId);
        }
        triggerItemFlash(itemId);
        startPulse(itemId);
        setOpenItemId(itemId);
      }
    },
    [openItemId, triggerItemFlash, startPulse, stopPulse],
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
    triggerFlash: triggerItemFlash,
    triggerItemFlash,
    handleOpen,
    handleFlash,
  };
}
