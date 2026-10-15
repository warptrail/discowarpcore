// Fixture-only browser QA. Every API read is mocked, including reconciling Declutter GET.
// Every inventory write is blocked. Run against an already running local frontend.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const path = require('node:path');
const os = require('node:os');
const root = process.env.DWC_QA_URL || 'http://localhost:7611';
const outputDirectory = process.env.DWC_QA_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'dwc-desktop-qa-'));
fs.mkdirSync(outputDirectory, {
  recursive: true
});
const outputPath = name => path.join(outputDirectory, name);
const oid = n => String(n).padStart(24, '0');
const item = (n, boxId = '001') => ({
  _id: oid(1000 + n),
  id: oid(1000 + n),
  name: n === 0 ? 'Blue test towel' : `Fixture item ${n}`,
  quantity: 1,
  category: 'household',
  tags: ['fixture'],
  notes: 'Fixture note',
  boxId: oid(Number(boxId)),
  box: {
    _id: oid(Number(boxId)),
    box_id: boxId,
    label: `Box ${boxId}`,
    location: 'Kitchen · Pantry · Top Shelf'
  },
  boxNumber: boxId,
  placementLabel: boxId,
  boxName: `Box ${boxId}`,
  locationLabel: 'Kitchen · Pantry · Top Shelf',
  item_status: 'active',
  createdAt: '2026-10-01T12:00:00Z'
});
const names = ['Top Drawer', 'Other Drawers', 'Front Porch Box - 30 Qt.', 'Extra Coffee', 'Very long fixture inventory name for checking wrapping and preserving useful placement metadata'];
const boxes = Array.from({
  length: 51
}, (_, i) => {
  const box_id = String(i + 1).padStart(3, '0');
  return {
    _id: oid(i + 1),
    box_id,
    label: names[i % names.length],
    name: names[i % names.length],
    location: i % 3 ? 'Kitchen · Pantry · Top Shelf' : '',
    tags: ['fixture', 'household', 'long-category-tag'],
    notes: 'Box fixture notes',
    items: Array.from({
      length: 5
    }, (_, n) => item(i * 5 + n, box_id)),
    childBoxes: []
  };
});
function nestedBox(shortId, label, children = []) {
  return { ...boxes[10], _id: oid(9000 + Number(shortId)), box_id: shortId, label,
    items: [{ ...item(Number(shortId), shortId), name: label + ' item' }], childBoxes: children };
}
boxes[0].childBoxes = [
  nestedBox('201', 'Nested teal fixture', [
    nestedBox('211', 'Deep violet branch', [
      nestedBox('212', 'Deeper branch', [
        nestedBox('213', 'Deepest branch', [nestedBox('214', 'Hierarchy target')]),
      ]),
    ]),
  ]),
  nestedBox('202', 'Sibling child'),
];
boxes[2].childBoxes = [nestedBox('303', 'Nested second parent')];
boxes[5].childBoxes = [nestedBox('501', 'Nested separate row')];
const items = Array.from({
  length: 25
}, (_, i) => item(i));
const locations = [{
  _id: oid(800),
  room: 'Kitchen',
  vicinity: 'Pantry',
  specifics: 'Top Shelf',
  exactSpot: 'Left corner'
}];
const candidate = {
  id: oid(700),
  itemId: items[0]._id,
  item: items[0],
  needsMyVote: true,
  votes: {
    discofish: {
      decision: 'pending'
    },
    laserfox: {
      decision: 'pending'
    }
  }
};
const fixturePhoto = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#1b2c40"/><text x="120" y="210" fill="#7fd7ff" font-size="32">Fixture photo</text></svg>');
boxes[1].image = {
  thumb: {
    url: 'data:image/png;base64,invalid'
  },
  display: {
    url: fixturePhoto
  }
};
const discussion = items.slice(1, 5).map((item, i) => ({
  ...candidate,
  id: oid(710 + i),
  item,
  needsMyVote: false,
  deckState: 'discussion',
  votes: {
    discofish: {
      decision: 'keep'
    },
    laserfox: {
      decision: 'donate'
    }
  }
}));
const actions = items.slice(5, 9).map((item, i) => ({
  ...candidate,
  id: oid(720 + i),
  item,
  needsMyVote: false,
  deckState: 'action',
  stagingRoute: 'donate'
}));
const seen = new Set(),
  blocked = [],
  errors = [],
  checks = [];
function response(url) {
  const path = url.pathname;
  if (path === '/api/boxes/tree') return {
    items: boxes,
    total: 51,
    totalPages: 1
  };
  if (path.startsWith('/api/boxes/') && (path.endsWith('/tree') || path.includes('/by-short-id/'))) return {
    box: boxes[0],
    data: boxes[0]
  };
  if (path === '/api/items/orphaned') return {
    items: [{
      ...item(600),
      boxId: null,
      box: null,
      name: 'Adrift test item'
    }]
  };
  if (path === '/api/locations') return {
    locations
  };
  if (path === '/api/retrieval/items') return {
    items,
    total: 25,
    limit: 25,
    offset: 0,
    hasMore: false,
    filters: {},
    sortOptions: []
  };
  if (path === '/api/retrieval/boxes') return {
    boxes: boxes.map(b => ({
      ...b,
      id: b._id,
      boxId: b.box_id,
      boxLabel: b.label,
      locationLabel: b.location,
      directItemCount: 5,
      childBoxCount: b.childBoxes.length
    })),
    total: 51,
    limit: 100,
    hasMore: false,
    filters: {}
  };
  if (path === '/api/items') return {
    items,
    total: 25,
    hasMore: false,
    counts: {
      total: 25,
      active: 25,
      orphaned: 1
    },
    facets: {}
  };
  if (path.startsWith('/api/items/')) return {
    ok: true,
    data: items.find(x => path.includes(x._id)) || items[0]
  };
  if (path === '/api/declutter-deck') return {
    counts: {
      active: 2,
      discussion: 4,
      action: 4
    },
    activeCandidates: [candidate, {
      ...candidate,
      id: oid(701),
      item: items[9],
      needsMyVote: false
    }],
    discussionCandidates: discussion,
    resolvedCandidates: [],
    actionCandidates: actions
  };
  if (path.includes('batch')) return {
    items: [],
    batches: []
  };
  if (path.includes('logs')) return {
    items: [],
    logs: [],
    total: 0
  };
  return {};
}
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push({
      route: page.url(),
      error: e.message
    }));
    await page.setRequestInterception(true);
    page.on('request', async req => {
      const u = new URL(req.url());
      if (u.pathname.startsWith('/api/')) {
        seen.add(`${req.method()} ${u.pathname}`);
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
          blocked.push(`${req.method()} ${u.pathname}`);
          return req.respond({
            status: 403,
            contentType: 'application/json',
            headers: {
              'access-control-allow-origin': '*'
            },
            body: '{"error":"QA blocks writes"}'
          });
        }
        return req.respond({
          status: 200,
          contentType: 'application/json',
          headers: {
            'access-control-allow-origin': '*'
          },
          body: JSON.stringify(response(u))
        });
      }
      if (u.origin !== root && !u.protocol.startsWith('data')) return req.abort();
      return req.continue();
    });
    const delay = () => new Promise(r => setTimeout(r, 350));
    const go = async (path, w = 1920, h = 1080) => {
      await page.setViewport({
        width: w,
        height: h
      });
      await page.goto(root + path, {
        waitUntil: 'networkidle0'
      });
      await delay();
    };
    const geometry = () => page.evaluate(() => {
      const first = document.getElementById('operations-box-001');
      const grid = first?.parentElement;
      const nav = document.querySelector('[aria-label="Desktop primary navigation"]');
      const rect = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height
        };
      };
      return {
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
        grid: rect(grid),
        columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
        rail: rect(nav),
        header: rect(document.querySelector('[data-app-header]')),
        dock: rect(document.getElementById('operations-box-quick-peek')),
        childrenVisible: Boolean(document.getElementById('operations-box-201')),
        bodyFixed: getComputedStyle(document.body).position === 'fixed'
      };
    });
    await require('./operationsInspectorMotionChecks.cjs')({ page, go, delay, checks });
    if (process.env.DWC_QA_MOTION_ONLY === '1') {
      assert.equal(blocked.length, 0, 'unexpected attempted write');
      assert.equal(errors.length, 0, JSON.stringify(errors));
      fs.writeFileSync(outputPath('results.json'), JSON.stringify({ checks, blocked, errors }, null, 2));
      console.log(JSON.stringify({ layoutChecks: checks.length, blocked, errors, outputDirectory }, null, 2));
      return;
    }
    await require('./operationsCardFieldsChecks.cjs')({ page, go, delay, checks, outputPath });
    await require('./operationsNestedTraysChecks.cjs')({ page, go, delay, geometry, checks, outputPath, itemId: items[0]._id });
    if (process.env.DWC_QA_TRAYS_ONLY === '1') {
      assert.equal(blocked.length, 0, 'unexpected attempted write');
      assert.equal(errors.length, 0, JSON.stringify(errors));
      fs.writeFileSync(outputPath('results.json'), JSON.stringify({ checks, apiRequests: [...seen], blocked, errors }, null, 2));
      console.log(JSON.stringify({ layoutChecks: checks.length, blocked, errors, outputDirectory }, null, 2));
      return;
    }
    for (const [w, closed, open] of [[1100, 1, 1], [1366, 2, 2], [1920, 4, 4], [2560, 6, 6], [3440, 9, 9]]) {
      await go('/operations', w);
      let g = await geometry();
      assert.equal(g.overflow, false, `overflow at ${w}`);
      assert.equal(g.columns, closed, `closed columns at ${w}`);
      assert.equal(g.rail.width, 176);
      assert.equal(g.childrenVisible, false);
      checks.push({
        state: 'closed',
        ...g
      });
      await page.click('#operations-box-001 [data-operations-box-preview-trigger]');
      await delay();
      g = await geometry();
      assert.equal(g.overflow, false);
      assert.equal(g.columns, open, `open columns at ${w}`);
      assert.equal(g.dock.width, 384);
      assert(g.dock.y + g.dock.height <= 1081, 'dock extends below viewport');
      assert.equal(g.bodyFixed, false);
      checks.push({
        state: 'open',
        ...g
      });
      await page.click('[data-app-header]');
      await delay();
      assert(await page.$('#operations-box-quick-peek'), 'outside click dismissed dock');
      await page.keyboard.press('Escape');
      await delay();
      assert.equal(await page.$('#operations-box-quick-peek'), null, 'Escape failed to close');
    }
    await go('/operations', 1920);
    await page.click('#operations-box-001 [data-operations-box-preview-trigger]');
    await delay();
    await page.screenshot({
      path: outputPath('operations-desktop.png'),
      fullPage: false
    });
    const search = await page.$('input[aria-label="Search inventory"]');
    await search.click();
    await search.type('Blue test towel');
    await delay();
    assert(await page.$('#operations-box-quick-peek'), 'finder focus dismissed dock');
    await go('/operations?peek=001&item=' + items[0]._id, 1920);
    await page.waitForSelector('#operations-box-quick-peek');
    await page.setViewport({
      width: 390,
      height: 844
    });
    await delay();
    assert.equal((await geometry()).rail.width, 0);
    assert(page.url().includes('peek=001'));
    assert(page.url().includes('item='));
    assert(await page.$('#operations-box-quick-peek'));
    await page.setViewport({
      width: 1920,
      height: 1080
    });
    await delay();
    assert.equal((await geometry()).dock.width, 384);
    await page.click('[aria-label="Close box inspector"]');
    await delay();
    assert.equal(await page.$('#operations-box-quick-peek'), null);
    await go('/operations?peek=001', 1920);
    await page.click('[aria-label="Next page"]');
    await delay();
    assert.equal(await page.$('#operations-box-quick-peek'), null, 'pagination did not clean selection');
    assert(!page.url().includes('peek='));
    await go('/operations?q=Nested', 1920);
    assert(await page.$('#operations-box-201'), 'search did not reveal matching child');
    await go('/operations?peek=001&item=' + items[0]._id, 1920);
    await page.waitForSelector('[aria-label="Edit Name"]');
    await page.click('[aria-label="Edit Name"]');
    await page.waitForSelector('[role="dialog"][aria-label="Edit Name"] input');
    await page.type('[role="dialog"][aria-label="Edit Name"] input', ' unsaved draft');
    await page.setViewport({
      width: 390,
      height: 844
    });
    await delay();
    assert.equal(await page.$eval('[role="dialog"][aria-label="Edit Name"] input', el => el.value), 'Blue test towel unsaved draft', 'draft lost going mobile');
    await page.setViewport({
      width: 1920,
      height: 1080
    });
    await delay();
    assert.equal(await page.$eval('[role="dialog"][aria-label="Edit Name"] input', el => el.value), 'Blue test towel unsaved draft', 'draft lost going desktop');
    await page.keyboard.press('Escape');
    await delay();
    assert.equal(await page.$('[role="dialog"][aria-label="Edit Name"]'), null);
    assert(await page.$('#operations-box-quick-peek'), 'nested dialog Escape closed dock');
    await page.click('[aria-label="Open notes for Blue test towel"]');
    await delay();
    await page.keyboard.press('Escape');
    await delay();
    assert(await page.$('#operations-box-quick-peek'), 'note Escape closed dock');
    await go('/operations', 1920);
    await page.click('#operations-box-001 button[aria-expanded]');
    await delay();
    assert(await page.$('#operations-box-201'), 'child expansion failed');
    await page.click('[aria-label="Terminal view"]');
    await delay();
    assert(await page.$('[role="tree"]'), 'terminal tree absent');
    await page.click('[aria-label="Cards view"]');
    await delay();
    await page.click('#operations-box-adrift [data-operations-box-preview-trigger]');
    await delay();
    assert(page.url().includes('peek=adrift'));
    await page.goBack();
    await delay();
    assert.equal(await page.$('#operations-box-quick-peek'), null);
    await page.emulateMediaFeatures([{
      name: 'prefers-reduced-motion',
      value: 'reduce'
    }]);
    await go('/operations?peek=001', 1366, 768);
    assert.equal((await geometry()).overflow, false);
    await page.emulateMediaFeatures([]);
    for (const w of [320, 390, 430, 678, 700, 1099]) {
      await go('/operations', w, 844);
      const g = await geometry();
      assert.equal(g.overflow, false, `mobile overflow ${w}`);
      checks.push({
        state: 'mobile',
        ...g
      });
    }
    await go('/operations', 390, 844);
    await page.screenshot({
      path: outputPath('operations-mobile.png'),
      fullPage: false
    });
    for (const route of ['/retrieval', '/retrieval?mode=boxes', '/intake', '/all-items', '/configuration', '/configuration?tab=json', '/location', '/declutter', '/declutter?mode=discussion', '/declutter?mode=actions', '/declutter?mode=progress', '/boxes/001', '/items/' + items[0]._id]) {
      for (const w of [1100, 1920, 320, 390, 700]) {
        await go(route, w, w === 390 ? 844 : 1080);
        const g = await geometry();
        if (w === 1920 && ['/intake', '/location', '/declutter', '/boxes/001', '/all-items'].includes(route)) await page.screenshot({
          path: outputPath(route.replaceAll('/', '-').slice(1) + '-desktop.png')
        });
        checks.push({
          route,
          ...g
        });
        assert.equal(g.overflow, false, `overflow ${route} at ${w}`);
      }
    }
    await go('/retrieval', 1920);
    const row = await page.$('[id^="retrieval-result-"] [aria-expanded]');
    if (row) {
      await row.click();
      await delay();
      assert(await page.$('[aria-label^="Inspect "]'), 'retrieval inspector absent');
      assert(await row.evaluate(el => el.closest('[id^="retrieval-result-"]').getBoundingClientRect().width < 450), 'selected result spans grid');
      await page.screenshot({
        path: outputPath('retrieval-desktop.png')
      });
      await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent === 'Close inspection').click());
      await delay();
      assert.equal(await page.$('[aria-label^="Inspect "]'), null);
      assert(await row.evaluate(el => document.activeElement === el), 'retrieval focus not restored');
    }
    await go('/retrieval', 1920);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Boxes');
      if (!b) throw new Error('Boxes mode button absent');
      b.click();
    });
    await delay();
    await delay();
    assert(seen.has('GET /api/retrieval/boxes'), 'box retrieval request absent');
    assert((await page.$('button[aria-controls^="retrieval-box-inline"]')) || (await page.$('[aria-label^="Box "]')), 'box fixture rows absent');
    await go('/operations', 1920);
    const trigger = await page.$('#operations-box-001 [data-operations-box-preview-trigger]');
    await trigger.click();
    await delay();
    const controls = await page.evaluate(() => ['Previous box', 'Next box', 'Close box inspector'].map(label => {
      const r = document.querySelector(`[aria-label="${label}"]`).getBoundingClientRect();
      return {
        x: r.x,
        y: r.y
      };
    }));
    assert.equal(controls[0].y, controls[2].y, 'close wraps below navigation');
    await page.click('[aria-label="Close box inspector"]');
    await delay();
    assert(await trigger.evaluate(el => document.activeElement === el), 'Operations close focus not restored');
    await go('/operations', 1920);
    assert(await page.$('#operations-box-002 svg'), 'failed photo did not show fallback');
    await page.click('#operations-box-002 button[aria-label^="View box photo"]');
    await delay();
    await page.click('[aria-label="Open full image for Other Drawers"]');
    await delay();
    assert(await page.$('[role="dialog"][aria-modal="true"]'), 'photo lightbox absent');
    await page.keyboard.press('Escape');
    await delay();
    assert(await page.$('#operations-box-quick-peek'), 'photo dialog Escape closed dock');
    await page.screenshot({
      path: outputPath('operations-photo-desktop.png')
    });
    for (const route of ['/declutter', '/declutter?mode=discussion', '/declutter?mode=actions']) {
      for (const w of [1100, 1920, 320, 700]) {
        await go(route, w, w < 1100 ? 844 : 1080);
        const g = await geometry();
        assert.equal(g.overflow, false, `populated queue overflow ${route} at ${w}`);
        if (route === '/declutter' && w >= 1100) {
          const clear = await page.evaluate(() => {
            const title = [...document.querySelectorAll('h2')].find(el => el.textContent.includes('Waiting on partner'));
            const spans = title.querySelectorAll('span');
            return title.querySelector('button').getBoundingClientRect().top >= spans[1].getBoundingClientRect().bottom;
          });
          assert(clear, 'queue title overlaps reset action');
        }
        checks.push({
          route,
          state: 'populated',
          ...g
        });
        if (w === 1920) await page.screenshot({
          path: outputPath('populated-' + route.replaceAll('/', '-').replace('?mode=', '-').slice(1) + '.png')
        });
      }
    }
    assert.equal(blocked.length, 0, 'unexpected attempted write');
    assert.equal(errors.length, 0, JSON.stringify(errors));
    console.log(JSON.stringify({
      layoutChecks: checks.length,
      desktopColumns: checks.filter(x => x.state === 'closed' || x.state === 'open').map(x => ({
        width: x.width,
        state: x.state,
        columns: x.columns
      })),
      apiRequests: [...seen],
      blocked,
      errors
    }, null, 2));
    console.log('Screenshots and results: ' + outputDirectory);
    fs.writeFileSync(outputPath('results.json'), JSON.stringify({
      checks,
      apiRequests: [...seen],
      blocked,
      errors
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e.stack);
  if (errors.length) console.error(JSON.stringify(errors));
  process.exit(1);
});
