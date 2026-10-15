import test from 'node:test';
import assert from 'node:assert/strict';
import { detectMobileCameraCapture, isSupportedMobileCameraDevice } from '../frontend/src/util/mobileCameraCapture.js';

const captureDocument = { createElement: () => ({ capture: '', type: '' }) };
const camera = { kind: 'videoinput' };
const phone = (userAgent, extra = {}) => ({ userAgent, maxTouchPoints: 5,
  mediaDevices: { enumerateDevices: async () => [camera] }, ...extra });

test('iPhone, Android, iPad and desktop-identity iPad enable capture with a confirmed camera', async () => {
  for (const device of [phone('Mozilla/5.0 (iPhone)'), phone('Mozilla/5.0 (Linux; Android 16)'),
    phone('Mozilla/5.0 (iPad)'), phone('Mozilla/5.0 (Macintosh)', { platform: 'MacIntel' })]) {
    assert.equal(await detectMobileCameraCapture(device, captureDocument), true, device.userAgent);
  }
});

test('desktop browsers stay disabled even with touch support and a webcam', async () => {
  let probes = 0;
  for (const device of [phone('Mozilla/5.0 (Windows NT 10.0)', { platform: 'Win32' }),
    phone('Mozilla/5.0 (Macintosh)', { platform: 'MacIntel', maxTouchPoints: 0 }),
    phone('Mozilla/5.0 (X11; Linux x86_64)'), phone('Unrecognized touch device'),
    phone('Mozilla/5.0 (Android TV)'), phone('Mozilla/5.0 (Android Automotive)')]) {
    device.mediaDevices.enumerateDevices = async () => { probes += 1; return [camera]; };
    assert.equal(await detectMobileCameraCapture(device, captureDocument), false);
  }
  assert.equal(probes, 0, 'Desktop cameras are never probed');
});

test('unknown devices and mobile identities without touch or native capture stay disabled', async () => {
  assert.equal(isSupportedMobileCameraDevice(), false);
  assert.equal(isSupportedMobileCameraDevice({ userAgent: 'iPhone', maxTouchPoints: 0 }), false);
  assert.equal(await detectMobileCameraCapture(phone('iPhone'), { createElement: () => ({}) }), false);
  assert.equal(await detectMobileCameraCapture(phone('iPhone'), null), false);
});

test('HTTP or unavailable hardware discovery remains disabled without requesting camera access', async () => {
  assert.equal(await detectMobileCameraCapture(phone('iPhone', { mediaDevices: undefined }), captureDocument), false);
  assert.equal(await detectMobileCameraCapture(phone('Android', { mediaDevices: {} }), captureDocument), false);
  let permissionRequests = 0;
  const device = phone('iPhone', { mediaDevices: {
    enumerateDevices: async () => [{ kind: 'audioinput' }],
    getUserMedia: () => { permissionRequests += 1; },
  } });
  assert.equal(await detectMobileCameraCapture(device, captureDocument), false);
  device.mediaDevices.enumerateDevices = async () => [];
  assert.equal(await detectMobileCameraCapture(device, captureDocument), false);
  device.mediaDevices.enumerateDevices = async () => { throw new Error('Unavailable'); };
  assert.equal(await detectMobileCameraCapture(device, captureDocument), false);
  assert.equal(permissionRequests, 0);
});
