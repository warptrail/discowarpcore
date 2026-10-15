const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));
const React = frontendRequire('react');
const { renderToStaticMarkup } = frontendRequire('react-dom/server');
const esbuild = frontendRequire('esbuild');

async function loadToggle() {
  const { outputFiles } = await esbuild.build({
    entryPoints: [path.join(frontend, 'src/components/ViewModeToggle.jsx')],
    bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
    external: ['react', 'react-router-dom', 'styled-components'], logLevel: 'silent',
  });
  const module = { exports: {} };
  const requireDependency = (id) => id === 'styled-components'
    ? Object.assign(frontendRequire(id).default, frontendRequire(id)) : frontendRequire(id);
  new Function('require', 'module', 'exports', outputFiles[0].text)(requireDependency, module, module.exports);
  return module.exports.default;
}

test('shared Cards/Terminal icons expose the active mode and accessible titles', async () => {
  const Toggle = await loadToggle();
  for (const mode of ['cards', 'terminal']) {
    const html = renderToStaticMarkup(React.createElement(Toggle, {
      mode, ariaLabel: 'Retrieval results view mode',
    }));
    assert.ok(html.includes('role="group" aria-label="Retrieval results view mode"'));
    assert.equal((html.match(/<button /g) || []).length, 2);
    assert.equal((html.match(/<svg /g) || []).length, 2);
    for (const [value, label] of [['cards', 'Cards view'], ['terminal', 'Terminal view']]) {
      assert.ok(html.includes(`aria-label="${label}" title="${label}" aria-pressed="${mode === value}"`));
    }
    assert.ok(!html.includes('VIEW') && !html.includes('ASCII'));
  }
});
