import { useEffect, useState } from 'react';
import { detectMobileCameraCapture } from '../util/mobileCameraCapture';

export default function useMobileCameraCapture(enabled = true) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setAvailable(false);
      return undefined;
    }
    let active = true;
    let request = 0;
    const refresh = async () => {
      const currentRequest = ++request;
      setAvailable(false);
      const next = await detectMobileCameraCapture();
      if (active && currentRequest === request) setAvailable(next);
    };
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    const mediaDevices = navigator.mediaDevices;
    refresh();
    mediaDevices?.addEventListener?.('devicechange', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      mediaDevices?.removeEventListener?.('devicechange', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled]);

  return enabled && available;
}
