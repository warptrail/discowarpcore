const { randomBytes, randomUUID } = require('crypto');

function createMediaId() {
  if (typeof randomUUID === 'function') {
    return `med_${randomUUID().replace(/-/g, '')}`;
  }
  return `med_${randomBytes(16).toString('hex')}`;
}

module.exports = {
  createMediaId,
};
