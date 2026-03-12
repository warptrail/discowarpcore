import { useEffect, useMemo, useState } from 'react';
import { checkBoxIdAvailability } from '../api/boxes';

export default function useShortIdAvailability({
  shortId,
  initialShortId = '',
  debounceMs = 200,
}) {
  const [shortIdAvail, setShortIdAvail] = useState(true);
  const [shortIdChecking, setShortIdChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);

  const normalizedInitial = String(initialShortId ?? '');
  const shortIdValid = /^\d{3}$/.test(shortId || '');
  const inProgress = shortId.length > 0 && shortId.length < 3;
  const unchanged = shortId === normalizedInitial;

  useEffect(() => {
    if (unchanged && normalizedInitial) {
      setShortIdAvail(true);
      setShortIdChecking(false);
      setCheckError(null);
      return;
    }

    if (!shortIdValid) {
      setShortIdChecking(false);
      setShortIdAvail(false);
      setCheckError(null);
      return;
    }

    let alive = true;
    setShortIdChecking(true);
    setCheckError(null);

    const timer = setTimeout(async () => {
      try {
        const available = await checkBoxIdAvailability(shortId);
        if (alive) {
          setShortIdAvail(available);
          setCheckError(null);
        }
      } catch {
        if (alive) {
          setShortIdAvail(false);
          setCheckError('Could not verify');
        }
      } finally {
        if (alive) setShortIdChecking(false);
      }
    }, debounceMs);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [debounceMs, normalizedInitial, shortId, shortIdValid, unchanged]);

  const isValid = useMemo(
    () => (unchanged && shortIdValid) || (shortIdValid && shortIdAvail),
    [unchanged, shortIdValid, shortIdAvail],
  );

  const isInvalid = shortId.length === 3 && !shortIdChecking && !isValid;

  return {
    inProgress,
    unchanged,
    shortIdValid,
    shortIdAvail,
    shortIdChecking,
    checkError,
    isValid,
    isInvalid,
  };
}
