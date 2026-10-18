// Read-only checks against the three marked dev fixtures. Does not create or modify inventory.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const origin = 'http://127.0.0.1:7611';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [], writes = [], checks = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (request.url().includes('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`); });
    for (const [width, height] of [[430, 932], [678, 759], [1280, 900], [320, 800], [776, 894]]) {
      await page.setViewport({ width, height });
      await page.goto(`${origin}/boxes/504?compartment=B2`, { waitUntil: 'networkidle0' });
      const section = '[aria-label="Compartments in box 504"]';
      const viewport = '[aria-label="Compartment map for box 504"]';
      await page.waitForSelector(`${viewport} button[aria-pressed="true"]`);
      const geometry = await page.$eval(viewport, (element) => {
        const buttons = [...element.querySelectorAll('button')];
        const selected = element.querySelector('button[aria-pressed="true"]');
        const bounds = element.getBoundingClientRect(), node = selected.getBoundingClientRect();
        const grid = element.querySelector('[aria-label="Cabinet branches"]');
        const trunk = grid.querySelector('[data-root-connector]');
        const stems = [...grid.querySelectorAll('[data-cabinet-connector]')];
        const connected = stems.length === 7 && stems.every((path) => {
          const start = path.getPointAtLength(0);
          const endpoint = path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());
          const card = grid.querySelector(`[data-compartment-branch="${path.dataset.cabinetConnector}"]`).getBoundingClientRect();
          return trunk.isPointInStroke(start) && Math.abs(endpoint.y - card.top - 1) < 1 && endpoint.x > card.left && endpoint.x < card.right;
        });
        return { overflow: document.documentElement.scrollWidth > innerWidth, selected: selected.getAttribute('aria-label'), minTarget: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)), selectedVisible: element.scrollHeight <= element.clientHeight || (node.top >= bounds.top && node.bottom <= bounds.bottom), scrollable: element.scrollHeight > element.clientHeight, connected, trunkWidth: getComputedStyle(trunk).strokeWidth };
      });
      assert.equal(geometry.overflow, false);
      assert.equal(geometry.selected, 'Browse 504B2: Middle shelf');
      assert.ok(geometry.minTarget >= 44);
      assert.equal(geometry.selectedVisible, true);
      assert.equal(geometry.connected, true);
      assert.equal(geometry.trunkWidth, '3px');
      assert.equal(geometry.scrollable, width > 560);
      await page.$eval(section, (element) => element.scrollIntoView());
      await page.screenshot({ path: `/tmp/compartment-atlas-${width}.png` });
      await page.click('[aria-label="Browse 504B: Cabinet B"]');
      await page.waitForFunction(() => new URL(location.href).searchParams.get('compartment') === 'B');
      await page.waitForFunction(() => document.body.innerText.includes('[MOCK] Mug'));
      for (const name of ['Mug', 'Dinner plate', 'Cereal bowl']) assert.ok((await page.$eval('body', (body) => body.innerText)).includes(`[MOCK] ${name}`));
      await page.goBack({ waitUntil: 'networkidle0' });
      assert.equal(new URL(page.url()).searchParams.get('compartment'), 'B2');
      await page.focus('[aria-label="Browse 504G3: Bottom shelf"]');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => new URL(location.href).searchParams.get('compartment') === 'G3');
      await page.waitForFunction(() => document.querySelector('[aria-label="Browse 504G3: Bottom shelf"]')?.getAttribute('aria-pressed') === 'true');
      const expand = '[aria-label="Expand compartments to fullscreen"]';
      await page.$eval(expand, (element) => element.scrollIntoView({ block: 'center' }));
      await page.click(expand);
      await page.waitForSelector('dialog:modal');
      const fullscreen = await page.$eval('dialog:modal', (dialog) => {
        const bounds = dialog.getBoundingClientRect();
        const map = dialog.querySelector('[aria-label="Compartment map for box 504"]');
        return { width: bounds.width, height: bounds.height, viewportWidth: innerWidth, viewportHeight: innerHeight, selected: map.querySelector('button[aria-pressed="true"]').getAttribute('aria-label'), bodyLocked: document.body.style.overflow === 'hidden' };
      });
      assert.ok(Math.abs(fullscreen.width - width) < 2 && Math.abs(fullscreen.height - height) < 2);
      assert.equal(fullscreen.selected, 'Browse 504G3: Bottom shelf');
      assert.equal(fullscreen.bodyLocked, true);
      await page.waitForFunction(() => document.activeElement === document.querySelector('dialog:modal'));
      await page.focus('dialog:modal [aria-label="Browse 504G3: Bottom shelf"]');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Browse all compartments in box 504');
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Browse 504G3: Bottom shelf');
      await page.screenshot({ path: `/tmp/compartment-fullscreen-${width}.png` });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('dialog:modal'));
      await page.waitForFunction(() => document.activeElement.getAttribute('aria-label') === 'Expand compartments to fullscreen');
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
      assert.equal(new URL(page.url()).searchParams.get('compartment'), 'G3');
      checks.push({ width, height, ...geometry, cabinetBrowsing: true, back: true, keyboardSelection: true, fullscreen: true, focusTrap: true, focusRestored: true });
    }
    // Editing remains mounted across selection and resize; no Save is invoked.
    await page.goto(`${origin}/boxes/504?compartment=B2`, { waitUntil: 'networkidle0' });
    await page.$$eval('summary', (elements) => elements.find((element) => element.innerText === 'Name or add compartments and shelves').click());
    const field = '[aria-label="Name for 504B2"]';
    await page.focus(field); await page.keyboard.type(' unsaved draft');
    const draft = await page.$eval(field, (element) => element.value);
    await page.$eval('[aria-label="Compartment map for box 504"]', (element) => element.scrollIntoView({ block: 'start' }));
    await page.click('[aria-label="Browse 504C: Cabinet C"]');
    await page.setViewport({ width: 678, height: 759 });
    assert.equal(await page.$eval(field, (element) => element.value), draft);
    assert.equal(await page.$eval(field, (element) => element.closest('details').open), true);
    await page.$eval('[aria-label="Expand compartments to fullscreen"]', (element) => element.scrollIntoView({ block: 'center' }));
    await page.click('[aria-label="Expand compartments to fullscreen"]');
    await page.waitForSelector('dialog:modal');
    assert.equal(await page.$eval(field, (element) => element.value), draft);
    await page.setViewport({ width: 430, height: 932 });
    await page.click('[aria-label="Exit compartment fullscreen"]');
    await page.waitForFunction(() => !document.querySelector('dialog:modal'));
    assert.equal(await page.$eval(field, (element) => element.value), draft);
    assert.equal(await page.$eval(field, (element) => element.closest('details').open), true);
    const consoleText = await page.$eval('[aria-label="Box hierarchy and inventory metadata"]', (element) => element.innerText.replace(/\s+/g, ' '));
    for (const phrase of ['Level 0', '7 sections', '17 storage spaces', '17 items total', '0 nested boxes']) assert.ok(consoleText.includes(phrase), consoleText);
    assert.ok(!consoleText.includes('[MOCK] Upper'));
    // Long unsaved names are retained, and narrow layouts stay contained.
    await page.focus(field); await page.keyboard.type(' long cabinet / shelf name '.repeat(4));
    await page.setViewport({ width: 320, height: 800 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    assert.ok(await page.$eval('[aria-label="Browse 504C: Cabinet C"]', (element) => getComputedStyle(element).transitionDuration.split(',').every((duration) => parseFloat(duration) <= .001)));
    await page.waitForFunction(() => document.querySelector('[aria-label="Browse 504C: Cabinet C"]')?.getAttribute('aria-pressed') === 'true');
    // Measure rendered text and selected-border contrast, including the composited selected wash.
    const contrast = await page.$eval('[aria-label="Browse 504C: Cabinet C"]', (button) => {
      const rgba = (value) => value.match(/[\d.]+/g).map(Number);
      const composite = (top, bottom) => { const alpha = top[3] ?? 1; return top.slice(0, 3).map((value, i) => value * alpha + bottom[i] * (1 - alpha)); };
      const bg = (element) => { if (!element) return [255, 255, 255]; const color = rgba(getComputedStyle(element).backgroundColor); return composite(color, bg(element.parentElement)); };
      const luminance = (rgb) => rgb.slice(0, 3).map((value) => value / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
      const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
      const texts = [...button.querySelectorAll('strong, span')].filter((element) => element.childElementCount === 0 && element.innerText.trim());
      return { text: texts.map((element) => ({ label: element.innerText, ratio: ratio(rgba(getComputedStyle(element).color), bg(element)) })), border: ratio(composite(rgba(getComputedStyle(button).borderTopColor), bg(button)), bg(button)) };
    });
    for (const entry of contrast.text) assert.ok(entry.ratio >= 4.5, JSON.stringify(entry));
    assert.ok(contrast.border >= 3, JSON.stringify(contrast));
    const identitySizes = await page.evaluate(() => ({
      atlasId: parseFloat(getComputedStyle(document.querySelector('[aria-label="Browse 504C: Cabinet C"] strong').previousElementSibling).fontSize),
      summaryId: parseFloat(getComputedStyle(document.querySelector('[aria-label^="Current box "] > span')).fontSize),
      breadcrumbId: parseFloat(getComputedStyle(document.querySelector('[data-box-console-id]')).fontSize),
    }));
    assert.ok(identitySizes.atlasId >= 16 && identitySizes.summaryId >= 26 && identitySizes.breadcrumbId >= 17);
    // Temporary DOM text exercises wrapping without changing persisted inventory.
    await page.$eval('[aria-label="Browse 504C: Cabinet C"] strong', (element) => { element.textContent = 'A very long cabinet label with unusuallylongunbrokenwords for narrow screens'; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
    console.log(JSON.stringify({ checks, draftsPreserved: true, reducedMotion: true, contrast, identitySizes, longLabels: true, inventoryWrites: writes.length, browserErrors: errors.length }, null, 2));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
