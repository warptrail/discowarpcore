import { RENDER_TOKEN_KEYS } from '../../../renderTokenKeys.generated.js';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function pickDefaultToken(tokens, preferred) {
  const normalizedPreferred = toTrimmed(preferred);
  if (normalizedPreferred && tokens.includes(normalizedPreferred)) {
    return normalizedPreferred;
  }

  return tokens[0] || '';
}

export function formatTokenLabel(tokenId) {
  const normalized = toTrimmed(tokenId);
  if (!normalized) return '';

  if (normalized === 'lcarsOrange') {
    return 'LCARS Orange';
  }

  return normalized
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function createTokenOptions(tokens) {
  return Object.freeze(
    tokens
      .map((tokenId) => ({
        id: toTrimmed(tokenId),
        label: formatTokenLabel(tokenId),
      }))
      .filter((entry) => entry.id && entry.label)
  );
}

const BACKGROUND_TOKEN_KEYS = Object.freeze(
  Array.isArray(RENDER_TOKEN_KEYS?.backgrounds) ? [...RENDER_TOKEN_KEYS.backgrounds] : []
);
const GLOW_TOKEN_KEYS = Object.freeze(
  Array.isArray(RENDER_TOKEN_KEYS?.glows) ? [...RENDER_TOKEN_KEYS.glows] : []
);
const RENDER_TOKEN_MODES = Object.freeze(['explicit', 'random']);

function normalizeRenderTokenMode(value, fallback = 'explicit') {
  const normalized = toTrimmed(value).toLowerCase();
  if (RENDER_TOKEN_MODES.includes(normalized)) return normalized;
  return fallback;
}

export const RENDER_TOKEN_MODE_OPTIONS = Object.freeze([
  { id: 'explicit', label: 'Explicit Tokens' },
  { id: 'random', label: 'Random Tokens' },
]);

export const DEFAULT_RENDER_TOKENS = Object.freeze({
  mode: 'explicit',
  background: pickDefaultToken(BACKGROUND_TOKEN_KEYS, 'midnight'),
  glow: pickDefaultToken(GLOW_TOKEN_KEYS, 'standard'),
});

export const RENDER_TOKEN_OPTIONS = Object.freeze({
  background: createTokenOptions(BACKGROUND_TOKEN_KEYS),
  glow: createTokenOptions(GLOW_TOKEN_KEYS),
});

function resolveTokenValue(rawValue, allowedTokens, fallbackValue) {
  const normalized = toTrimmed(rawValue);
  if (normalized && allowedTokens.includes(normalized)) {
    return normalized;
  }

  return pickDefaultToken(allowedTokens, fallbackValue);
}

export function normalizeRenderTokens(renderTokens, fallbackTokens = DEFAULT_RENDER_TOKENS) {
  const fallback = fallbackTokens && typeof fallbackTokens === 'object'
    ? fallbackTokens
    : DEFAULT_RENDER_TOKENS;
  const mode = normalizeRenderTokenMode(
    renderTokens?.mode,
    normalizeRenderTokenMode(fallback.mode, DEFAULT_RENDER_TOKENS.mode)
  );

  return {
    mode,
    background: resolveTokenValue(
      renderTokens?.background,
      BACKGROUND_TOKEN_KEYS,
      fallback.background || DEFAULT_RENDER_TOKENS.background
    ),
    glow: resolveTokenValue(
      renderTokens?.glow,
      GLOW_TOKEN_KEYS,
      fallback.glow || DEFAULT_RENDER_TOKENS.glow
    ),
  };
}

export function hasProvidedRenderTokens(renderTokens) {
  if (!renderTokens || typeof renderTokens !== 'object') return false;
  if (normalizeRenderTokenMode(renderTokens.mode, '') === 'random') return true;

  return Boolean(
    toTrimmed(renderTokens.background) ||
    toTrimmed(renderTokens.glow)
  );
}

export function formatRenderTokenSummary(renderTokens) {
  const normalized = normalizeRenderTokens(renderTokens);
  return [
    `Mode: ${normalized.mode === 'random' ? 'Random' : 'Explicit'}`,
    `Background: ${formatTokenLabel(normalized.background)}`,
    `Glow: ${formatTokenLabel(normalized.glow)}`,
  ].join(' | ');
}
