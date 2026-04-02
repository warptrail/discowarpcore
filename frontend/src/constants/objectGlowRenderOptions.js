export const OBJECT_GLOW_BACKGROUND_MODES = Object.freeze([
  { id: 'preset', label: 'Preset Background' },
  { id: 'random-approved', label: 'Random Approved Background' },
]);

export const OBJECT_GLOW_GLOW_VARIANTS = Object.freeze([
  { id: 'standard', label: 'Standard' },
  { id: 'soft-halo', label: 'Soft Halo' },
  { id: 'neon-pop', label: 'Neon Pop' },
  { id: 'high-contrast', label: 'High Contrast' },
]);

export const OBJECT_GLOW_BACKGROUND_PRESETS = Object.freeze([
  { id: 'midnight-teal', label: 'Midnight Teal' },
  { id: 'violet-haze', label: 'Violet Haze' },
  { id: 'ember-gold', label: 'Ember Gold' },
  { id: 'reactor-blue', label: 'Reactor Blue' },
  { id: 'magenta-nebula', label: 'Magenta Nebula' },
]);

export const OBJECT_GLOW_BACKGROUND_MODE_IDS = Object.freeze(
  OBJECT_GLOW_BACKGROUND_MODES.map((entry) => entry.id)
);
export const OBJECT_GLOW_GLOW_VARIANT_IDS = Object.freeze(
  OBJECT_GLOW_GLOW_VARIANTS.map((entry) => entry.id)
);
export const OBJECT_GLOW_BACKGROUND_PRESET_IDS = Object.freeze(
  OBJECT_GLOW_BACKGROUND_PRESETS.map((entry) => entry.id)
);

export const OBJECT_GLOW_DEFAULT_RENDER_REQUEST = Object.freeze({
  backgroundMode: 'preset',
  backgroundPresetId: 'midnight-teal',
  glowVariant: 'standard',
});

export const OBJECT_GLOW_DEFAULT_RENDER_RESOLVED = Object.freeze({
  backgroundPresetId: 'midnight-teal',
  glowVariant: 'standard',
  outputFormat: 'webp',
});
