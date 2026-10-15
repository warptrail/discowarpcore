const assert = require('node:assert/strict');

module.exports = async function checkNestedBranches({ page, go, delay, checks, outputPath }) {
  const layout = () => page.evaluate(() => [...document.querySelectorAll('[data-has-field-actions]')]
    .map(card => { const r = card.getBoundingClientRect(); return { top: r.top + scrollY, left: r.left, width: r.width, height: r.height }; }));
  for (const width of [1100, 1247, 1366, 1920, 2560, 3440]) {
    await go('/operations', width, 954);
    const before = await layout();
    await page.click('#operations-box-001 [data-nested-box-toggle]');
    await delay();
    await page.waitForSelector('[data-tree-inspector]');
    assert.deepEqual(await layout(), before, 'opening containment moved inventory cards');
    const geometry = await page.evaluate(() => {
      const panel = document.querySelector('[data-tree-inspector]').getBoundingClientRect();
      const header = document.querySelector('[data-app-header]').getBoundingClientRect();
      return { width: panel.width, contained: panel.right <= innerWidth && panel.bottom <= innerHeight - 15,
        belowHeader: panel.top >= header.bottom + 12, overflow: document.documentElement.scrollWidth > innerWidth,
        noOverlay: !document.querySelector('[data-branch-overlay]'),
        uniformImages: [...document.querySelectorAll('[data-operations-card-media]')].every(slot => Math.abs(slot.firstElementChild.getBoundingClientRect().width - 80) < 1) };
    });
    assert.equal(geometry.width, 384);
    assert(geometry.contained && geometry.belowHeader && geometry.noOverlay && geometry.uniformImages && !geometry.overflow);
    checks.push({ state: 'containment-inspector', width, ...geometry });
  }
  await go('/operations', 1247, 954);
  await page.click('#operations-box-001 [data-nested-box-toggle]'); await delay();
  for (const id of ['201', '211', '212', '213']) {
    await page.click(`[aria-label="Expand nested boxes in ${id}"]`); await delay();
  }
  assert(await page.$('[aria-label^="Inspect box 214,"]'), 'deep descendant missing');
  await page.click('#operations-box-003 [data-nested-box-toggle]'); await delay();
  await page.click('[role="tab"][id^="inspector-branch-"]'); await delay();
  assert(await page.$('[aria-label^="Inspect box 214,"]'), 'branch switch lost expansion');
  await page.click('[aria-label^="Inspect box 201,"]'); await delay();
  assert(await page.$('#operations-box-quick-peek'), 'tree child did not open Quick Peek');
  assert(await page.$eval('[data-tree-inspector]', panel => panel.hasAttribute('inert')), 'covered tree remains interactive');
  await page.click('[aria-label="Close box inspector"]'); await delay(); await delay();
  assert(await page.$('[aria-label^="Inspect box 214,"]'), 'closing contents lost tree state');
  await page.click('[aria-label="Edit fields for box 201"]'); await delay();
  await page.click('[aria-label="Edit box 201 notes"]'); await delay();
  assert(await page.$('[role="dialog"][aria-label="Edit box 201 notes"]'), 'child field edit unavailable');
  await page.keyboard.press('Escape'); await delay();
  assert(await page.$('#operations-box-quick-peek'), 'field Escape closed contents');
  await page.click('[aria-label="Close box inspector"]'); await delay(); await delay();
  await page.click('[aria-label="Close nested box tree"]'); await delay();
  assert.equal(await page.$('[data-tree-inspector]'), null);
  assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-nested-box-toggle')), true);
  await page.click('#operations-box-001 [data-nested-box-toggle]'); await delay();
  await page.screenshot({ path: outputPath('nested-tree-inspector.png') });
  await page.keyboard.press('Escape'); await delay();
  assert.equal(await page.$('[data-tree-inspector]'), null);
};
