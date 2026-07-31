import { getMutedVariant, getNeonVariant } from '../styles/tokens.js';

const BOX_SHORT_ID_PATTERN = /^\d{3}$/;
const ITEM_HARMONIC_OFFSETS = [
  0,
  28,
  -28,
  180,
  150,
  -150,
  60,
  -60,
  120,
  -120,
  210,
  -210,
];

export const BOX_THEME_PRESETS = [
  { key: 'ice', name: 'Ice', primary: '#7FD7FF', secondary: '#67D9D3' },
  { key: 'sky', name: 'Sky', primary: '#50AAFF', secondary: '#A7B6FF' },
  { key: 'amber', name: 'Amber', primary: '#E8B15C', secondary: '#F08A7B' },
  { key: 'orange', name: 'Orange', primary: '#FF9F1C', secondary: '#F4C430' },
  { key: 'teal', name: 'Teal', primary: '#4CC6C1', secondary: '#67EFC8' },
  { key: 'aqua', name: 'Aqua', primary: '#00D2D3', secondary: '#7BED9F' },
  { key: 'lilac', name: 'Lilac', primary: '#A7B6FF', secondary: '#E056FD' },
  { key: 'violet', name: 'Violet', primary: '#8D7CFF', secondary: '#7FD7FF' },
  { key: 'coral', name: 'Coral', primary: '#F08A7B', secondary: '#FFB8B8' },
  { key: 'red', name: 'Red', primary: '#FF6B6B', secondary: '#E8B15C' },
  { key: 'lime', name: 'Lime', primary: '#9BE564', secondary: '#67EFC8' },
  { key: 'green', name: 'Green', primary: '#C7F464', secondary: '#2ECC71' },
  { key: 'blue', name: 'Blue', primary: '#4D96FF', secondary: '#A29BFE' },
  { key: 'indigo', name: 'Indigo', primary: '#6C5CE7', secondary: '#00C2FF' },
  { key: 'magenta', name: 'Magenta', primary: '#E056FD', secondary: '#F78FB3' },
  { key: 'pink', name: 'Pink', primary: '#F78FB3', secondary: '#A7B6FF' },
  { key: 'cyan', name: 'Cyan', primary: '#00C2FF', secondary: '#00D2D3' },
  { key: 'marine', name: 'Marine', primary: '#67D9D3', secondary: '#4D96FF' },
  { key: 'gold', name: 'Gold', primary: '#F4C430', secondary: '#9BE564' },
  { key: 'solar', name: 'Solar', primary: '#FFD93D', secondary: '#4CC6C1' },
];

const NEUTRAL_PRESETS = {
  system: {
    key: 'system',
    name: 'System',
    primary: '#7D8996',
    secondary: '#A9B4BF',
  },
  orphaned: {
    key: 'orphaned',
    name: 'Orphaned',
    primary: '#8A8175',
    secondary: '#B0A694',
  },
};

export function hexToRgbString(hex) {
  const safe = String(hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(safe)) return '138, 129, 117';

  const parsed = Number.parseInt(safe, 16);
  return `${(parsed >> 16) & 255}, ${(parsed >> 8) & 255}, ${parsed & 255}`;
}

function parseHex(hex) {
  const [r, g, b] = hexToRgbString(hex).split(',').map(Number);
  return { r, g, b };
}

function toHex({ r, g, b }) {
  const channel = (value) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function mixColors(left, right, amount) {
  const a = parseHex(left);
  const b = parseHex(right);
  return toHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

function hexToHsl(hex) {
  const { r, g, b } = parseHex(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    if (max === green) hue = 60 * ((blue - red) / delta + 2);
    if (max === blue) hue = 60 * ((red - green) / delta + 4);
  }

  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return {
    h: (hue + 360) % 360,
    s: saturation * 100,
    l: lightness * 100,
  };
}

function hslToHex({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = Math.max(0, Math.min(100, s)) / 100;
  const lightness = Math.max(0, Math.min(100, l)) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const section = hue / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const offset = lightness - chroma / 2;
  const channels =
    section < 1
      ? [chroma, x, 0]
      : section < 2
        ? [x, chroma, 0]
        : section < 3
          ? [0, chroma, x]
          : section < 4
            ? [0, x, chroma]
            : section < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];

  return toHex({
    r: (channels[0] + offset) * 255,
    g: (channels[1] + offset) * 255,
    b: (channels[2] + offset) * 255,
  });
}

function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex);
  const channels = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function ensureDarkSurfaceContrast(hsl, minimumRatio = 4.5) {
  const darkLuminance = relativeLuminance('#111111');
  let lightness = hsl.l;
  let color = hslToHex({ ...hsl, l: lightness });

  while (
    (relativeLuminance(color) + 0.05) / (darkLuminance + 0.05) < minimumRatio &&
    lightness < 80
  ) {
    lightness += 2;
    color = hslToHex({ ...hsl, l: lightness });
  }

  return color;
}

function getPaletteIndex(itemId, parentKey) {
  const normalizedId = String(itemId || '').trim();
  const trailingHex = normalizedId.match(/[0-9a-fA-F]{6,}$/)?.[0]?.slice(-8);
  if (trailingHex) {
    return Number.parseInt(trailingHex, 16) % ITEM_HARMONIC_OFFSETS.length;
  }
  return stableHash(`palette:${parentKey}:${normalizedId}`) % ITEM_HARMONIC_OFFSETS.length;
}

function getHarmonicItemAccent(parent, itemId) {
  const paletteIndex = getPaletteIndex(itemId, parent.shortId || parent.key);
  const primaryHsl = hexToHsl(parent.primary);
  const secondaryHsl = hexToHsl(parent.secondary);
  const offset = ITEM_HARMONIC_OFFSETS[paletteIndex];
  const phaseNudge = (parent.phase - 1.5) * 3;
  const baseHue =
    paletteIndex === 1
      ? secondaryHsl.h
      : primaryHsl.h + offset + phaseNudge;
  const saturation = Math.max(
    58,
    Math.min(82, primaryHsl.s * 0.64 + 30 + (paletteIndex % 3) * 3),
  );
  const lightness = 64 + (paletteIndex % 4) * 2;
  const accent = ensureDarkSurfaceContrast({
    h: baseHue,
    s: saturation,
    l: lightness,
  });
  const secondaryAccent = hslToHex({
    h: baseHue + (paletteIndex % 2 ? -24 : 24),
    s: Math.max(48, saturation - 12),
    l: Math.max(58, lightness - 5),
  });

  return {
    paletteIndex,
    harmony:
      paletteIndex <= 2
        ? 'analogous'
        : paletteIndex === 3
          ? 'complementary'
          : paletteIndex <= 5
            ? 'split-complementary'
            : 'triadic',
    accent,
    secondaryAccent,
  };
}

function stableHash(value) {
  let hash = 2166136261;
  const source = String(value || '');
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getSiblingVariant(itemId, parentKey) {
  const normalizedId = String(itemId || '').trim();
  const trailingHex = normalizedId.match(/[0-9a-fA-F]{6,}$/)?.[0]?.slice(-8);
  if (trailingHex) {
    return Number.parseInt(trailingHex, 16) % 5;
  }
  return stableHash(`${parentKey}:${normalizedId}`) % 5;
}

function buildTheme(preset, metadata) {
  const neon = getNeonVariant(preset.primary);
  const muted = getMutedVariant(preset.primary);

  return Object.freeze({
    ...metadata,
    key: preset.key,
    name: preset.name,
    primary: preset.primary,
    secondary: preset.secondary,
    neon,
    muted,
    primaryRgb: hexToRgbString(preset.primary),
    secondaryRgb: hexToRgbString(preset.secondary),
    neonRgb: hexToRgbString(neon),
    mutedRgb: hexToRgbString(muted),
    // Compatibility aliases while older consumers migrate to the shared vocabulary.
    base: preset.primary,
    baseRgb: hexToRgbString(preset.primary),
  });
}

export function getBoxTheme(shortId, options = {}) {
  const normalized = String(shortId ?? '').trim();
  const neutralKind =
    options.kind === 'system' || options.kind === 'orphaned'
      ? options.kind
      : BOX_SHORT_ID_PATTERN.test(normalized)
        ? null
        : 'orphaned';

  if (neutralKind) {
    return buildTheme(NEUTRAL_PRESETS[neutralKind], {
      shortId: null,
      family: null,
      variant: null,
      phase: 0,
      isNeutral: true,
      neutralKind,
    });
  }

  const family = Number(normalized[0]);
  const middle = Number(normalized[1]);
  const final = Number(normalized[2]);
  const variant = (middle * 3 + final) % 2;
  const phase = (middle * 7 + final * 11) % 4;
  const preset = BOX_THEME_PRESETS[family * 2 + variant];

  return buildTheme(preset, {
    shortId: normalized,
    family,
    variant,
    phase,
    isNeutral: false,
    neutralKind: null,
  });
}

export function getItemTheme(
  shortId,
  itemId,
  { selected = false, varied = false } = {},
) {
  const parent = getBoxTheme(shortId);
  const siblingVariant = getSiblingVariant(itemId, parent.shortId || parent.key);
  const harmonic = varied ? getHarmonicItemAccent(parent, itemId) : null;

  if (harmonic) {
    const accent = selected
      ? mixColors(harmonic.accent, '#FFFFFF', 0.14)
      : harmonic.accent;
    return {
      ...parent,
      parent,
      selected,
      siblingVariant,
      ...harmonic,
      accent,
      accentRgb: hexToRgbString(accent),
      secondaryAccentRgb: hexToRgbString(harmonic.secondaryAccent),
    };
  }

  if (!selected || parent.isNeutral) {
    return {
      ...parent,
      parent,
      selected: false,
      siblingVariant,
      accent: parent.muted,
      accentRgb: parent.mutedRgb,
    };
  }

  const variantMixes = [
    [parent.primary, parent.secondary, 0.18],
    [parent.primary, parent.secondary, 0.38],
    [parent.secondary, parent.primary, 0.22],
    [parent.secondary, '#FFFFFF', 0.12],
    [parent.primary, '#FFFFFF', 0.2],
  ];
  const [left, right, amount] = variantMixes[siblingVariant];
  const accent = mixColors(left, right, amount);

  return {
    ...parent,
    parent,
    selected: true,
    siblingVariant,
    accent,
    accentRgb: hexToRgbString(accent),
  };
}

export function getItemThemeCssVars(theme) {
  const safeTheme = theme || getItemTheme(null, null, { varied: true });
  const secondaryAccent = safeTheme.secondaryAccent || safeTheme.secondary;
  return {
    '--item-accent': safeTheme.accent,
    '--item-accent-rgb': safeTheme.accentRgb,
    '--item-secondary': secondaryAccent,
    '--item-secondary-rgb':
      safeTheme.secondaryAccentRgb || hexToRgbString(secondaryAccent),
    '--item-palette-index': String(safeTheme.paletteIndex ?? safeTheme.siblingVariant ?? 0),
  };
}

export function getBoxThemeCssVars(theme) {
  const safeTheme = theme || getBoxTheme(null);
  const phase = safeTheme.phase ?? 0;
  const washAngles = ['90deg', '104deg', '76deg', '118deg'];
  const glowAlphas = ['0.12', '0.16', '0.1', '0.14'];
  return {
    '--box-primary': safeTheme.primary,
    '--box-secondary': safeTheme.secondary,
    '--box-neon': safeTheme.neon,
    '--box-muted': safeTheme.muted,
    '--box-primary-rgb': safeTheme.primaryRgb,
    '--box-secondary-rgb': safeTheme.secondaryRgb,
    '--box-neon-rgb': safeTheme.neonRgb,
    '--box-muted-rgb': safeTheme.mutedRgb,
    '--box-phase': String(phase),
    '--box-wash-angle': washAngles[phase],
    '--box-glow-alpha': glowAlphas[phase],
  };
}
