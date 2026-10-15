export function isSupportedMobileCameraDevice(navigatorTarget) {
  if (!navigatorTarget || Number(navigatorTarget.maxTouchPoints || 0) < 1) return false;
  const userAgent = String(navigatorTarget.userAgent || '');
  if (/Android[\s_-]*TV|SmartTV|SMART-TV|HbbTV|CrOS|Automotive/i.test(userAgent)) return false;
  return /iPhone|iPad|Android/i.test(userAgent) || (
    navigatorTarget.platform === 'MacIntel' && navigatorTarget.maxTouchPoints > 1
  );
}

// Inspect capability without requesting permission or opening a camera stream.
// Unknown hardware stays disabled, including browsers without device discovery.
export async function detectMobileCameraCapture(
  navigatorTarget = globalThis.navigator,
  documentTarget = globalThis.document,
) {
  if (!isSupportedMobileCameraDevice(navigatorTarget) || !documentTarget?.createElement) return false;
  const input = documentTarget.createElement('input');
  input.type = 'file';
  if (!('capture' in input)) return false;
  const mediaDevices = navigatorTarget.mediaDevices;
  if (typeof mediaDevices?.enumerateDevices !== 'function') return false;
  try {
    const devices = await mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === 'videoinput');
  } catch {
    return false;
  }
}
