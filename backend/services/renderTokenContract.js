const fs = require('fs');
const path = require('path');

const RENDER_TOKEN_MANIFEST_PATH = path.resolve(
  __dirname,
  '../../renderTokenKeys.generated.js'
);

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeTokenList(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const next = [];

  for (const raw of values) {
    const value = toTrimmed(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    next.push(value);
  }

  return next;
}

function parseGeneratedRenderTokenManifest(sourceText) {
  const source = String(sourceText || '');
  const match = source.match(
    /export\s+const\s+RENDER_TOKEN_KEYS\s*=\s*(\{[\s\S]*?\})\s*;/
  );
  if (!match) {
    throw new Error(
      `Unable to parse RENDER_TOKEN_KEYS from ${RENDER_TOKEN_MANIFEST_PATH}`
    );
  }

  const parsed = JSON.parse(match[1]);
  return {
    backgrounds: normalizeTokenList(parsed?.backgrounds),
    glows: normalizeTokenList(parsed?.glows),
  };
}

function loadRenderTokenManifest() {
  const source = fs.readFileSync(RENDER_TOKEN_MANIFEST_PATH, 'utf8');
  return parseGeneratedRenderTokenManifest(source);
}

function pickDefaultToken(tokens, preferred) {
  const preferredToken = toTrimmed(preferred);
  if (preferredToken && tokens.includes(preferredToken)) return preferredToken;
  return tokens[0] || '';
}

const RENDER_TOKEN_KEYS = Object.freeze(loadRenderTokenManifest());
const DEFAULT_RENDER_TOKENS = Object.freeze({
  mode: 'explicit',
  background: pickDefaultToken(RENDER_TOKEN_KEYS.backgrounds, 'midnight'),
  glow: pickDefaultToken(RENDER_TOKEN_KEYS.glows, 'arc'),
});
const RENDER_TOKEN_MODES = Object.freeze(['explicit', 'random']);

function normalizeRenderTokenMode(value, fallback = 'explicit') {
  const normalized = toTrimmed(value).toLowerCase();
  if (RENDER_TOKEN_MODES.includes(normalized)) return normalized;
  return fallback;
}

function getTokenInputShape(input) {
  const source = input && typeof input === 'object' && input.renderTokens &&
    typeof input.renderTokens === 'object'
    ? input.renderTokens
    : input;

  const background = toTrimmed(source?.background);
  const glow = toTrimmed(source?.glow);
  const mode = normalizeRenderTokenMode(source?.mode, 'explicit');

  return {
    mode,
    background,
    glow,
    hasAnyValue: Boolean(mode === 'random' || background || glow),
  };
}

function toReadableTokenValue(value) {
  const normalized = toTrimmed(value);
  return normalized || '(empty)';
}

function resolveRenderTokens(rawTokens, fallbackTokens = DEFAULT_RENDER_TOKENS) {
  const raw = getTokenInputShape(rawTokens);
  const fallback = getTokenInputShape(fallbackTokens);

  return {
    mode: raw.mode || fallback.mode || DEFAULT_RENDER_TOKENS.mode,
    background: raw.background || fallback.background || DEFAULT_RENDER_TOKENS.background,
    glow: raw.glow || fallback.glow || DEFAULT_RENDER_TOKENS.glow,
  };
}

function validateRenderTokens(rawTokens, {
  fallbackTokens = DEFAULT_RENDER_TOKENS,
} = {}) {
  const resolved = resolveRenderTokens(rawTokens, fallbackTokens);
  const errors = [];

  if (!RENDER_TOKEN_MODES.includes(resolved.mode)) {
    errors.push(`Invalid render token mode: ${toReadableTokenValue(resolved.mode)}`);
  }

  if (resolved.mode === 'explicit' && !RENDER_TOKEN_KEYS.backgrounds.includes(resolved.background)) {
    errors.push(`Invalid background token: ${toReadableTokenValue(resolved.background)}`);
  }

  if (resolved.mode === 'explicit' && !RENDER_TOKEN_KEYS.glows.includes(resolved.glow)) {
    errors.push(`Invalid glow token: ${toReadableTokenValue(resolved.glow)}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    renderTokens: resolved,
    hasAnyProvidedValue: getTokenInputShape(rawTokens).hasAnyValue,
  };
}

module.exports = {
  RENDER_TOKEN_MANIFEST_PATH,
  RENDER_TOKEN_KEYS,
  RENDER_TOKEN_MODES,
  DEFAULT_RENDER_TOKENS,
  resolveRenderTokens,
  validateRenderTokens,
  normalizeRenderTokenMode,
};
