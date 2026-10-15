const assert = require('node:assert/strict');
module.exports = async function checkInspectorMotion({ page, go, delay, checks }) {
  for (const width of [1100, 1374, 1920, 2560]) {
    await go('/operations', width, 1093);
    const resting = await page.evaluate(() => {
      const grid = document.getElementById('operations-box-001').parentElement;
      const idle = document.querySelector('[data-operations-inspector-idle]');
      const rect = idle.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, top: rect.top, bottom: rect.bottom, viewportHeight: innerHeight,
        visible: getComputedStyle(idle).visibility,
        cards: [...grid.children].filter(node => node.id.startsWith('operations-box-')).map(node => {
          const r = node.getBoundingClientRect();
          return [node.id, r.left, r.top, r.width, r.height];
        }) };
    });
    assert.equal(resting.visible, 'visible');
    assert.equal(resting.width, 384);
    assert(resting.top > 0 && resting.bottom <= resting.viewportHeight - 23, 'idle guide escapes viewport');
    await page.click('#operations-box-001 [data-operations-box-preview-trigger]');
    await page.waitForSelector('#operations-box-quick-peek');
    const opening = await page.evaluate(async () => {
      await new Promise(resolve => setTimeout(resolve, 90));
      const deck = document.getElementById('operations-box-quick-peek');
      if (!deck) return { missing: true, url: location.href, active: document.activeElement?.outerHTML?.slice(0, 200) };
      const styles = getComputedStyle(deck);
      const grid = document.getElementById('operations-box-001').parentElement;
      const moves = [...grid.children].filter(node => node.id.startsWith('operations-box-'))
        .flatMap(node => [...node.children].flatMap(face => face.getAnimations()));
      return { opacity: Number(styles.opacity), transform: styles.transform,
        dockLeft: parseFloat(styles.left), gridRight: grid.getBoundingClientRect().right,
        cards: [...grid.children].filter(node => node.id.startsWith('operations-box-')).map(node => {
          const r = node.getBoundingClientRect(); return [node.id, r.left, r.top, r.width, r.height];
        }),
        movingCards: moves.filter(animation => animation.playState === 'running').length,
        fixedHeights: [...grid.querySelectorAll('[data-has-field-actions]')].every(card => Math.abs(card.getBoundingClientRect().height - 160) < 0.01),
        overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert(!opening.missing, JSON.stringify(opening));
    assert(opening.opacity > 0 && opening.opacity < 1, 'opening dock snaps into view');
    assert.notEqual(opening.transform, 'none');
    assert.equal(opening.movingCards, 0, 'inspection moves inventory cards');
    assert.deepEqual(opening.cards, resting.cards, 'opening changes grid geometry');
    assert(Math.abs(opening.dockLeft - resting.left) < 1, 'dock misses reserved column');
    assert(opening.dockLeft > opening.gridRight, 'dock is not on the right');
    assert(opening.fixedHeights, 'grid motion changes card dimensions');
    assert(!opening.overflow, 'opening motion creates horizontal overflow');
    checks.push({ state: 'desktop-inspector-open-motion', width, ...opening });
    await delay();
    // Sample immediately and mid-animation rather than after the QA settling delay.
    const sample = await page.evaluate(async () => {
      const deck = document.getElementById('operations-box-quick-peek');
      deck.querySelector('[aria-label="Close box inspector"]').click();
      await new Promise(resolve => requestAnimationFrame(resolve));
      const animation = deck.getAnimations()[0];
      const retained = deck.isConnected && new URL(location.href).searchParams.has('peek');
      await new Promise(resolve => setTimeout(resolve, 100));
      const styles = getComputedStyle(deck);
      return { retained, duration: animation?.effect.getTiming().duration,
        opacity: Number(styles.opacity), transform: styles.transform,
        overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert(sample.retained, 'close removed dock before its exit');
    assert.equal(sample.duration, 260);
    assert(sample.opacity > 0 && sample.opacity < 1, 'dock does not fade during exit');
    assert.notEqual(sample.transform, 'none', 'dock does not slide during exit');
    assert(!sample.overflow, 'exit introduces horizontal overflow');
    await page.waitForSelector('#operations-box-quick-peek', { hidden: true });
    assert(!new URL(page.url()).searchParams.has('peek'), 'close did not clean peek URL');
    assert(await page.$eval('#operations-box-001 [data-operations-box-preview-trigger]', el => el === document.activeElement), 'close lost source focus');
    const closed = await page.evaluate(() => {
      const idle = document.querySelector('[data-operations-inspector-idle]');
      const grid = document.getElementById('operations-box-001').parentElement;
      return { visible: getComputedStyle(idle).visibility, cards: [...grid.children].filter(node => node.id.startsWith('operations-box-')).map(node => {
        const r = node.getBoundingClientRect(); return [node.id, r.left, r.top, r.width, r.height];
      }) };
    });
    assert.equal(closed.visible, 'visible');
    assert.deepEqual(closed.cards, resting.cards, 'closing changes grid geometry');
    checks.push({ state: 'desktop-inspector-close-motion', width, ...sample });
  }
  await go('/operations?peek=001', 1374, 1093);
  const initial = await page.$eval('#operations-box-quick-peek', el => ({ left: parseFloat(getComputedStyle(el).left), columnLeft: el.parentElement.getBoundingClientRect().left }));
  assert(Math.abs(initial.left - initial.columnLeft) < 1 && initial.left > 500, 'URL selection opens on the left');
  checks.push({ state: 'desktop-inspector-initial-url-placement' });
  await go('/operations', 1374, 1093);
  await page.click('#operations-box-001 [data-operations-box-preview-trigger]'); await delay();
  await page.keyboard.press('Escape');
  assert(await page.$('#operations-box-quick-peek'), 'Escape snaps the dock closed');
  await page.waitForSelector('#operations-box-quick-peek', { hidden: true });
  checks.push({ state: 'desktop-inspector-escape-motion' });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.click('#operations-box-001 [data-operations-box-preview-trigger]'); await delay();
  const reduced = await page.evaluate(() => {
    const grid = document.getElementById('operations-box-001').parentElement;
    const faces = [...grid.children].flatMap(node => [...node.children]);
    return getComputedStyle(document.getElementById('operations-box-quick-peek')).animationName === 'none'
      && faces.every(face => face.getAnimations().length === 0);
  });
  assert(reduced, 'reduced motion animates dock or cards');
  await page.click('[aria-label="Close box inspector"]');
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(!(await page.$('#operations-box-quick-peek')), 'reduced motion waits for animation');
  checks.push({ state: 'desktop-inspector-reduced-motion' });
  await page.emulateMediaFeatures([]);
  await go('/operations', 1100, 700);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await delay();
  const idleBounds = await page.$eval('[data-operations-inspector-idle]', el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, headerBottom: document.querySelector('[data-app-header]').getBoundingClientRect().bottom, height: innerHeight };
  });
  assert(idleBounds.top >= idleBounds.headerBottom + 15 && idleBounds.bottom <= idleBounds.height - 23, 'idle panel clips at page bottom');
  checks.push({ state: 'desktop-inspector-idle-scroll-bounds', ...idleBounds });
  for (const width of [320, 390, 700]) {
    await go('/operations', width, 932);
    assert(await page.$eval('[data-operations-inspector-idle]', el => getComputedStyle(el).display === 'none'), 'mobile shows desktop guide');
    checks.push({ state: 'mobile-inspector-idle-hidden', width });
  }
};
