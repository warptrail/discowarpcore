export async function probeReadiness({ contract, port, listenerPresent, fetchImpl = fetch }) {
  const checkedAt = new Date().toISOString();
  if (!listenerPresent) return { ok: false, type: contract.type, checkedAt, message: `Nothing is listening on :${port}.` };
  if (contract.type === 'tcp') return { ok: true, type: 'tcp', checkedAt, message: `TCP listener accepted on :${port}.` };
  const path = String(contract.path || '/').startsWith('/') ? String(contract.path || '/') : `/${contract.path}`;
  try {
    const response = await fetchImpl(`http://127.0.0.1:${port}${path}`, {
      headers: { 'x-tarot-health-check': '1' },
      signal: AbortSignal.timeout(contract.timeoutMs),
    });
    const ok = contract.acceptedStatusCodes?.length ? contract.acceptedStatusCodes.includes(response.status) : response.ok;
    return { ok, type: 'http', status: response.status, checkedAt, message: `HTTP ${response.status} from ${path}.` };
  } catch (error) {
    return { ok: false, type: 'http', checkedAt, message: `${path} did not respond: ${error.message}` };
  }
}
