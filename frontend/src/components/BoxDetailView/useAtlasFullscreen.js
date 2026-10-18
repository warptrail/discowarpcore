import { useLayoutEffect, useRef, useState } from 'react';
import useDialogFocus from '../../hooks/useDialogFocus';

// A native dialog promotes the existing DOM into the top layer; map and editor never remount.
export default function useAtlasFullscreen() {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  const exit = () => setFullscreen(false);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (fullscreen && !dialog.matches(':modal')) {
      dialog.close();
      dialog.showModal();
    } else if (!fullscreen && dialog.matches(':modal')) {
      dialog.close();
      dialog.show();
      requestAnimationFrame(() => returnFocusRef.current?.focus({ preventScroll: true }));
    }
  }, [fullscreen]);
  useDialogFocus(dialogRef, exit, fullscreen);
  const toggle = (event) => {
    if (!fullscreen) returnFocusRef.current = event.currentTarget;
    setFullscreen((value) => !value);
  };
  const onCancel = (event) => {
    event.preventDefault();
    exit();
  };
  return { dialogRef, fullscreen, toggle, onCancel };
}
