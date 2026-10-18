const { AsyncLocalStorage } = require('node:async_hooks');
const context = new AsyncLocalStorage();
let tail = Promise.resolve();

// Serialize structure and placement changes in this API process. Reentrant for item creation.
async function withBoxMutationLock(action) {
  if (context.getStore()) return action();
  const previous = tail;
  let release;
  tail = new Promise((resolve) => { release = resolve; });
  await previous;
  try { return await context.run(true, action); }
  finally { release(); }
}
module.exports = { withBoxMutationLock };
