const DEFAULT_API_BASE = 'http://localhost:5002';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeApiBase(apiBase = DEFAULT_API_BASE) {
  const normalized = toTrimmed(apiBase) || DEFAULT_API_BASE;
  return normalized.replace(/\/+$/, '');
}

function isProductionMode(env = process.env) {
  return toTrimmed(env.DISCO_ENV).toLowerCase() === 'production';
}

function isLocalhostApiBase(apiBase) {
  try {
    const url = new URL(normalizeApiBase(apiBase));
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function resolveApiConfig(env = process.env) {
  const discoApiBase = toTrimmed(env.DISCO_API_BASE);
  const legacyApiBase = toTrimmed(env.DWC_API_BASE);
  const productionMode = isProductionMode(env);

  if (productionMode && !discoApiBase) {
    throw new Error('DISCO_ENV=production requires DISCO_API_BASE. Set it to the production backend API URL or SSH tunnel URL.');
  }

  const warnings = [];
  let source = 'development default';
  let rawApiBase = DEFAULT_API_BASE;

  if (discoApiBase) {
    source = 'DISCO_API_BASE';
    rawApiBase = discoApiBase;
  } else if (legacyApiBase) {
    source = 'DWC_API_BASE';
    rawApiBase = legacyApiBase;
    warnings.push('DWC_API_BASE is deprecated for the vision intake TUI. Use DISCO_API_BASE instead.');
  }

  const apiBase = normalizeApiBase(rawApiBase);
  if (isLocalhostApiBase(apiBase)) {
    warnings.push('API target is localhost. In production this should be an SSH tunnel or an intentional local backend.');
  }

  return {
    apiBase,
    source,
    productionMode,
    warnings,
  };
}

async function checkApiHealth(apiBase, { fetchImpl = fetch } = {}) {
  const normalizedApiBase = normalizeApiBase(apiBase);
  const url = `${normalizedApiBase}/api/health`;
  let response;

  try {
    response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  } catch (error) {
    throw new Error(`Backend API health check failed at ${url}: ${error?.message || error}`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok !== true) {
    throw new Error(payload?.error || payload?.message || `Backend API health check failed at ${url}`);
  }

  return payload;
}

function printApiConfig(config, logger = console) {
  logger.log(`API target: ${config.apiBase} (${config.source})`);
  for (const warning of config.warnings || []) {
    logger.warn(`Warning: ${warning}`);
  }
}

module.exports = {
  DEFAULT_API_BASE,
  checkApiHealth,
  isLocalhostApiBase,
  isProductionMode,
  normalizeApiBase,
  printApiConfig,
  resolveApiConfig,
};
