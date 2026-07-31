const assert = require('node:assert/strict');
const test = require('node:test');

async function loadColorTheme() {
  return import('../frontend/src/util/inventoryColorTheme.js');
}

test('all three-digit box IDs resolve deterministically within their family', async () => {
  const { BOX_THEME_PRESETS, getBoxTheme } = await loadColorTheme();
  const variantsByFamily = Array.from({ length: 10 }, () => new Set());

  for (let value = 0; value <= 999; value += 1) {
    const shortId = String(value).padStart(3, '0');
    const first = getBoxTheme(shortId);
    const second = getBoxTheme(shortId);

    assert.deepEqual(second, first);
    assert.equal(first.shortId, shortId);
    assert.equal(first.family, Number(shortId[0]));
    assert.equal(first.variant, (Number(shortId[1]) * 3 + Number(shortId[2])) % 2);
    assert.equal(first.phase, (Number(shortId[1]) * 7 + Number(shortId[2]) * 11) % 4);
    assert.ok(first.phase >= 0 && first.phase <= 3);
    assert.equal(first.key, BOX_THEME_PRESETS[first.family * 2 + first.variant].key);
    assert.match(first.primary, /^#[0-9A-F]{6}$/);
    assert.match(first.secondary, /^#[0-9A-F]{6}$/);
    variantsByFamily[first.family].add(first.variant);
  }

  for (const variants of variantsByFamily) {
    assert.deepEqual([...variants].sort(), [0, 1]);
  }
});

test('leading zeroes are identity-bearing and malformed IDs are neutral', async () => {
  const { getBoxTheme } = await loadColorTheme();

  assert.equal(getBoxTheme('001').shortId, '001');
  assert.equal(getBoxTheme('1').key, 'orphaned');
  assert.equal(getBoxTheme(1).key, 'orphaned');
  assert.equal(getBoxTheme('0001').key, 'orphaned');
  assert.equal(getBoxTheme('abc').key, 'orphaned');
  assert.equal(getBoxTheme(null).primary, '#8A8175');
  assert.equal(getBoxTheme('123', { kind: 'system' }).primary, '#7D8996');
});

test('selected item variants are stable, position-independent, and parent constrained', async () => {
  const { getBoxTheme, getItemTheme } = await loadColorTheme();
  const parent = getBoxTheme('113');
  const itemIds = [
    '6a35b8801356bc312a312522',
    '6a35b8801356bc312a312525',
    'item-charlie',
    'item-delta',
    'item-echo',
  ];
  const forward = itemIds.map((itemId) => getItemTheme('113', itemId, { selected: true }));
  const reverse = [...itemIds]
    .reverse()
    .map((itemId) => getItemTheme('113', itemId, { selected: true }))
    .reverse();

  assert.deepEqual(reverse, forward);
  assert.notEqual(forward[0].accent, forward[1].accent);
  assert.ok(new Set(forward.map((theme) => theme.accent)).size > 1);
  assert.ok(forward.every((theme) => theme.parent.key === parent.key));
  assert.ok(forward.every((theme) => theme.family === parent.family));
  assert.equal(getItemTheme('113', 'item-alpha').accent, parent.muted);
});

test('CSS variables expose the complete reusable box contract', async () => {
  const { getBoxTheme, getBoxThemeCssVars } = await loadColorTheme();
  const theme = getBoxTheme('805');
  const variables = getBoxThemeCssVars(theme);

  assert.equal(variables['--box-primary'], theme.primary);
  assert.equal(variables['--box-secondary'], theme.secondary);
  assert.equal(variables['--box-neon-rgb'], theme.neonRgb);
  assert.equal(variables['--box-muted-rgb'], theme.mutedRgb);
  assert.equal(variables['--box-phase'], String(theme.phase));
});

test('box-page item harmonics are stable, varied, and readable on dark surfaces', async () => {
  const {
    getBoxTheme,
    getItemTheme,
    getItemThemeCssVars,
  } = await loadColorTheme();
  const parent = getBoxTheme('122');
  const itemIds = Array.from(
    { length: 12 },
    (_, index) => `6a35b8801356bc312a3125${index.toString(16).padStart(2, '0')}`,
  );
  const themes = itemIds.map((itemId) =>
    getItemTheme('122', itemId, { varied: true }),
  );
  const reordered = [...itemIds]
    .reverse()
    .map((itemId) => getItemTheme('122', itemId, { varied: true }))
    .reverse();

  const luminance = (hex) => {
    const channels = hex
      .slice(1)
      .match(/.{2}/g)
      .map((channel) => Number.parseInt(channel, 16) / 255)
      .map((channel) =>
        channel <= 0.03928
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      );
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const darkSurfaceLuminance = luminance('#111111');

  assert.deepEqual(reordered, themes);
  assert.equal(new Set(themes.map((theme) => theme.paletteIndex)).size, 12);
  assert.ok(new Set(themes.map((theme) => theme.accent)).size >= 10);
  assert.ok(themes.every((theme) => theme.parent.key === parent.key));
  assert.ok(
    themes.every((theme) => {
      const ratio =
        (luminance(theme.accent) + 0.05) / (darkSurfaceLuminance + 0.05);
      return ratio >= 4.5;
    }),
  );

  const variables = getItemThemeCssVars(themes[0]);
  assert.equal(variables['--item-accent'], themes[0].accent);
  assert.equal(variables['--item-secondary'], themes[0].secondaryAccent);
  assert.equal(variables['--item-palette-index'], String(themes[0].paletteIndex));
});
