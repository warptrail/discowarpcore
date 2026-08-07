export const RETRY_DELAYS_MS = [1000, 3000];

export function createActionSerializer() {
  let queue = Promise.resolve();
  return (action) => {
    const next = queue.then(action, action);
    queue = next.catch(() => {});
    return next;
  };
}

export function nextRetry(attempts, eligible) {
  if (!eligible || attempts >= RETRY_DELAYS_MS.length) return null;
  return { attempt: attempts + 1, delayMs: RETRY_DELAYS_MS[attempts] };
}
