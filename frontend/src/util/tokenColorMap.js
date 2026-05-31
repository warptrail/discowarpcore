const NEUTRAL_TOKEN_COLOR = '#526a86';

let tokenColorMap = new Map();
let tokenFallbackColorMap = new Map();
let didWarnAboutMissingCsv = false;
const warnedMissingTokens = new Set();

function normalizeTokenKey(value) {
  return String(value || '').trim().toLowerCase();
}

function makeColorMapKey(category, token) {
  const normalizedCategory = normalizeTokenKey(category);
  const normalizedToken = normalizeTokenKey(token);
  return normalizedCategory ? `${normalizedCategory}:${normalizedToken}` : normalizedToken;
}

function normalizeHex(value) {
  const normalized = String(value || '').trim();
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
    return '';
  }

  if (normalized.length === 4) {
    return `#${normalized.slice(1).split('').map((char) => `${char}${char}`).join('')}`.toLowerCase();
  }

  return normalized.toLowerCase();
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

export function loadTokenColorMap(csvText) {
  const text = String(csvText || '').trim();
  if (!text) {
    tokenColorMap = new Map();
    tokenFallbackColorMap = new Map();
    return tokenColorMap;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    tokenColorMap = new Map();
    tokenFallbackColorMap = new Map();
    return tokenColorMap;
  }

  const headers = parseCsvLine(lines[0]).map((header) => normalizeTokenKey(header));
  const categoryColumnIndex = headers.findIndex((header) => header === 'category' || header === 'type');
  const tokenColumnIndex = headers.findIndex((header) => header === 'token' || header === 'name');
  const hexColumnIndex = headers.findIndex((header) => header === 'hex');
  const hex2ColumnIndex = headers.findIndex((header) => header === 'hex2' || header === 'end');

  if (tokenColumnIndex < 0 || hexColumnIndex < 0) {
    tokenColorMap = new Map();
    tokenFallbackColorMap = new Map();
    return tokenColorMap;
  }

  const nextMap = new Map();
  const nextFallbackMap = new Map();

  for (let index = 1; index < lines.length; index += 1) {
    const columns = parseCsvLine(lines[index]);
    const category = categoryColumnIndex >= 0 ? normalizeTokenKey(columns[categoryColumnIndex]) : '';
    const token = normalizeTokenKey(columns[tokenColumnIndex]);
    const hex = normalizeHex(columns[hexColumnIndex]);
    const hex2 = hex2ColumnIndex >= 0 ? normalizeHex(columns[hex2ColumnIndex]) : '';
    if (!token || !hex) continue;
    const colors = [hex, hex2].filter(Boolean);
    nextMap.set(makeColorMapKey(category, token), {
      category,
      token,
      colors,
      hex,
    });
    if (!nextFallbackMap.has(token)) {
      nextFallbackMap.set(token, {
        category,
        token,
        colors,
        hex,
      });
    }
  }

  tokenColorMap = nextMap;
  tokenFallbackColorMap = nextFallbackMap;
  return tokenColorMap;
}

function getTokenColorEntry(token, category = '') {
  const normalizedToken = normalizeTokenKey(token);
  if (!normalizedToken) return null;

  const categoryColor = tokenColorMap.get(makeColorMapKey(category, normalizedToken));
  if (categoryColor) return categoryColor;

  const fallbackColor = tokenFallbackColorMap.get(normalizedToken);
  if (fallbackColor) return fallbackColor;

  if (import.meta.env.DEV && !warnedMissingTokens.has(normalizedToken)) {
    warnedMissingTokens.add(normalizedToken);
    console.warn(`[tokenColorMap] Missing color mapping for token "${normalizedToken}"`);
  }

  return null;
}

export function getTokenColor(token, category = '') {
  return getTokenColorEntry(token, category)?.hex || NEUTRAL_TOKEN_COLOR;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function getTokenContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#eef8ff';

  const luminance = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
  return luminance >= 160 ? '#08131b' : '#f3fbff';
}

export function getTokenSurfaceColors(token, category = '') {
  const colorEntry = getTokenColorEntry(token, category);
  const hex = colorEntry?.hex || NEUTRAL_TOKEN_COLOR;
  const colors = Array.isArray(colorEntry?.colors) && colorEntry.colors.length
    ? colorEntry.colors
    : [hex];
  const rgb = hexToRgb(hex);
  const startRgb = hexToRgb(colors[0]);
  const endRgb = hexToRgb(colors[colors.length - 1] || colors[0]);

  if (!rgb || !startRgb || !endRgb) {
    return {
      hex: NEUTRAL_TOKEN_COLOR,
      textColor: '#f3fbff',
      borderColor: 'rgba(82, 106, 134, 0.72)',
      gradientStart: 'rgba(82, 106, 134, 0.96)',
      gradientEnd: 'rgba(21, 29, 41, 0.96)',
    };
  }

  return {
    hex,
    textColor: getTokenContrastColor(hex),
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.72)`,
    gradientStart: `rgba(${startRgb.r}, ${startRgb.g}, ${startRgb.b}, 0.96)`,
    gradientEnd: `rgba(${endRgb.r}, ${endRgb.g}, ${endRgb.b}, 0.96)`,
  };
}

export function ensureTokenColorMapLoaded(csvText) {
  if (!tokenColorMap.size && csvText) {
    loadTokenColorMap(csvText);
  } else if (!tokenColorMap.size && import.meta.env.DEV && !didWarnAboutMissingCsv) {
    didWarnAboutMissingCsv = true;
    console.warn('[tokenColorMap] Token color CSV was empty; using neutral fallback colors.');
  }

  return tokenColorMap;
}
