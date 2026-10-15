const assert = require('node:assert/strict');
module.exports = async function checkCardFields({ page, go, delay, checks, outputPath }) {
  const fields = ['number', 'name', 'location', 'tags', 'description', 'notes', 'photo'];
  const clickField = async (field, id = '001') => {
    await page.click(`[aria-label="Edit box ${id} ${field}"]`);
    await delay();
    await page.waitForSelector(`[role="dialog"][aria-label="Edit box ${id} ${field}"]`);
  };
  for (const width of [1100, 1366, 1714, 1920, 2560, 3440]) {
    await go('/operations', width);
    const result = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-has-field-actions]')];
      return { overflow: document.documentElement.scrollWidth > innerWidth,
        good: cards.every((card) => {
          const rect = card.getBoundingClientRect();
          const buttons = [...card.querySelectorAll('button[aria-label^="Edit box "]')];
          return rect.height === 160 && buttons.length === 7 && buttons.every((button) => {
            const b = button.getBoundingClientRect();
            return b.height === 40 && b.top >= rect.top && b.bottom <= rect.bottom && b.left >= rect.left && b.right <= rect.right;
          });
        }) };
    });
    assert(result.good, `field row changes geometry at ${width}`);
    assert(!result.overflow, `field row overflows at ${width}`);
    checks.push({ state: 'card-fields', width, ...result });
  }
  // Regression: selecting a box near the end of a scrolled page used to grow
  // the sticky dock from its displaced top and push its title under the header.
  for (const [width, height] of [[1374, 1093], [1100, 700], [1920, 885]]) {
    await go('/operations?peek=050#operations-box-050', width, height);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await delay(); await delay();
    const assertClearance = async () => {
      const result = await page.evaluate(() => {
        const header = document.querySelector('[data-app-header]').getBoundingClientRect();
        const dock = document.getElementById('operations-box-quick-peek').getBoundingClientRect();
        return { top: dock.top, bottom: dock.bottom, headerBottom: header.bottom, height: innerHeight };
      });
      assert(result.top >= result.headerBottom + 12, `dock under header at ${width}: ${JSON.stringify(result)}`);
      assert(result.bottom <= result.height - 8, `dock clipped at ${width}: ${JSON.stringify(result)}`);
      checks.push({ state: 'dock-scroll-clearance', width, ...result });
    };
    await assertClearance();
    await page.$eval('[data-app-header]', el => { el.style.paddingBottom = '90px'; });
    await delay(); await delay();
    await assertClearance();
    await page.$eval('[data-app-header]', el => { el.style.paddingBottom = ''; });
    await delay();
  }
  await go('/operations', 1920);
  for (const field of fields) {
    await clickField(field);
    const g = await page.$('[role="dialog"][aria-modal="true"]');
    assert(await g.evaluate(el => el.getBoundingClientRect().width <= 384), 'field editor escapes dock');
    if (field === 'name') {
      const input = await page.$('[aria-label="Box name"]');
      assert.equal(await input.evaluate(el => el.value), 'Top Drawer');
      await input.type(' draft');
      for (const width of [1100, 700, 390, 1920]) {
        await page.setViewport({ width, height: 1080 });
        await delay();
        assert.equal(await page.$eval('[aria-label="Box name"]', el => el.value), 'Top Drawer draft', `box draft lost at ${width}`);
      }
      await page.keyboard.press('Tab');
      assert(await page.$('[role="dialog"][aria-label="Edit box 001 name"]'), 'Tab saved a box field');
    }
    if (field === 'location') {
      await page.select('[role="dialog"] select', '000000000000000000000800');
      await delay();
      assert.equal(await page.$eval('[role="dialog"] input', el => el.value), 'Kitchen');
      await page.select('[role="dialog"] select', '');
      await delay();
      assert.equal(await page.$eval('[role="dialog"] input', el => el.value), '', 'unassign retains old room');
    }
    if (field === 'number') {
      await page.$eval('[aria-label="Box number"]', el => el.select());
      await page.type('[aria-label="Box number"]', '9');
      await delay();
      assert(await page.$eval('[role="dialog"] button[type="submit"]', el => el.disabled), 'invalid box number may save');
    }
    if (field === 'tags') assert.equal(await page.$eval('[aria-label="Box tags"]', el => el.value), 'fixture, household, long-category-tag');
    await page.keyboard.press('Escape');
    await delay();
    assert(!(await page.$('[role="dialog"][aria-modal="true"]')), `${field} did not close`);
    assert(await page.$('#operations-box-quick-peek'), `${field} Escape closed inspector`);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), `Edit box 001 ${field}`, `${field} focus restoration`);
    checks.push({ state: 'field-editor', field });
  }
  await page.click('[aria-label="Close box inspector"]');
  await delay();
  await page.click('#operations-box-001 [data-nested-box-toggle]');
  await delay();
  await page.click('[aria-label="Edit fields for box 201"]');
  await clickField('notes', '201');
  assert(await page.$('[data-tree-inspector]'), 'child edit closed tree');
  await page.keyboard.press('Escape'); await delay();
  assert(await page.$('[data-tree-inspector]'), 'field Escape closed tree');
  assert(await page.$('#operations-box-quick-peek'), 'child editor closed dock');
  await go('/operations', 1920);
  await page.screenshot({ path: outputPath('operations-card-field-shortcuts.png') });
  await clickField('name');
  await page.screenshot({ path: outputPath('operations-box-field-editor.png') });
  await page.keyboard.press('Escape');
  for (const width of [320, 390, 700]) {
    await go('/operations', width, 844);
    assert(!(await page.$('[data-has-field-actions]')), `desktop shortcuts appear at ${width}`);
    checks.push({ state: 'mobile-card-fields-unchanged', width });
  }
};
