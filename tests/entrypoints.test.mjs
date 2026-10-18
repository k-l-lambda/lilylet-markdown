import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import MarkdownIt from 'markdown-it';
import esmPlugin, * as api from '@k-l-lambda/lilylet-markdown';
const require = createRequire(import.meta.url);
const cjsPlugin = require('@k-l-lambda/lilylet-markdown');
const source = '\\time 4/4 c4 d e f |';
const block = (lang = 'lyl') => '```' + lang + '\n' + source + '\n```';

for (const [name, plugin, helpers] of [['ESM', esmPlugin, api], ['CommonJS', cjsPlugin, cjsPlugin]]) {
  test(`${name}: directly usable by Markdown-it; normal code unchanged`, () => {
    assert.equal(typeof plugin, 'function');
    const md = new MarkdownIt().use(plugin);
    for (const lang of ['lyl', 'lilylet', 'lyl.play', 'lilylet.play']) {
      const html = md.render(block(lang));
      assert.match(html, /data-lilylet-pending/);
      assert.equal(html.includes('data-playable'), lang.endsWith('.play'));
    }
    const js = '```js\nconsole.log(1)\n```';
    assert.equal(md.render(js), new MarkdownIt().render(js));
  });
  test(`${name}: MEI prerender preserves playable and plain cache entries`, async () => {
    const md = new MarkdownIt().use(plugin);
    const input = block() + '\n\n' + block('lyl.play');
    await helpers.prerender(md, input);
    const html = md.render(input);
    assert.equal((html.match(/data-mei=/g) || []).length, 2);
    assert.equal((html.match(/data-playable/g) || []).length, 1);
    assert.doesNotMatch(html, /data-lilylet-pending|data-lilylet-error/);
    assert.match(html, /&lt;mei /);
  });
  test(`${name}: rendering errors are escaped`, async () => {
    const md = new MarkdownIt().use(plugin);
    const html = await md.lilylet.prerenderCode('<script>alert(1)</script>');
    assert.match(html, /data-lilylet-error/);
    assert.doesNotMatch(html, /<script>/);
  });
}

test('CJS named helpers and default remain available without loading heavy dependencies', () => {
  assert.equal(cjsPlugin.default, cjsPlugin);
  assert.equal(cjsPlugin.lilyletPlugin, cjsPlugin);
  assert.equal(typeof cjsPlugin.prerender, 'function');
  assert.equal(typeof cjsPlugin.initVerovio, 'function');
  assert.ok(!Object.keys(require.cache).some(path => /node_modules\/(?:verovio|@k-l-lambda\/(?:lotus|lilylet|music-widgets))\//.test(path)));
});

test('real Verovio renders through both helpers, including repeated initialization', {timeout: 30000}, async () => {
  for (const helpers of [api, cjsPlugin]) {
    const toolkit = await helpers.initVerovio();
    try {
      const md = new MarkdownIt().use(helpers.lilyletPlugin, {verovioToolkit: toolkit});
      await helpers.prerender(md, block('lyl.play'));
      const html = md.render(block('lyl.play'));
      assert.match(html, /<svg/);
      assert.match(html, /data-playable/);
      assert.doesNotMatch(html, /data-lilylet-error|data-lilylet-pending/);
    } finally {toolkit.destroy();}
  }
});
