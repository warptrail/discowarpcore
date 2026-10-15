import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LocationConsole from './LocationConsole';

export default function LocationConsolePortal(props) {
  const [mount, setMount] = useState(null);
  useEffect(() => {
    let current;
    const sync = () => {
      const next = document.getElementById('location-console-mount');
      if (next !== current) { current = next; setMount(next); }
    };
    sync();
    // Keep the live controls attached when Header is replaced by hot reload.
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return mount ? createPortal(<LocationConsole {...props} />, mount) : null;
}
