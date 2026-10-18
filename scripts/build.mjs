import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {copyFile, readFile} from 'node:fs/promises';

const require = createRequire(import.meta.url);
const core = dirname(require.resolve('@k-l-lambda/lilylet'));
// The pinned build dependency has no public core-only entry. Resolve its two
// implementation modules at build time; consumers never load private subpaths
// or the broad entry point (which imports the optional Lotus decoder).
const coreOnly = {
  name: 'lilylet-core-only',
  setup(builder) {
    // Upstream's generated grammar installs a non-configurable global. Keep
    // each bundle's parser local so require() and import() can coexist safely.
    builder.onLoad({filter: /[/\\]lilylet[/\\]grammar\.jison\.js$/}, async ({path}) => {
      let contents = await readFile(path, 'utf8');
      const start = 'Object.defineProperty(globalThis, "__lilyletGrammar__", { value: ';
      const end = '})(), writable: false, configurable: false });';
      if (!contents.includes(start) || !contents.includes(end)) throw new Error('Unexpected pinned Lilylet grammar format');
      contents = contents.replace(start, 'const localGrammar = ').replace(end, '})();')
        .replaceAll('globalThis["__lilyletGrammar__"]', 'localGrammar');
      return {contents, loader: 'js', resolveDir: dirname(path)};
    });
    builder.onResolve({filter: /^@k-l-lambda\/lilylet$/}, () => ({path: 'core', namespace: 'lilylet-core'}));
    builder.onLoad({filter: /.*/, namespace: 'lilylet-core'}, () => ({
      contents: `export {parseCode} from ${JSON.stringify(join(core, 'lilylet/parser.js'))}; export * as meiEncoder from ${JSON.stringify(join(core, 'lilylet/meiEncoder.js'))};`,
      loader: 'js', resolveDir: core,
    }));
  },
};
for (const format of ['esm', 'cjs']) {
  await build({
    entryPoints: ['src/index.ts'], outfile: format === 'esm' ? 'lib/index.js' : 'lib/index.cjs',
    bundle: true, format, platform: 'neutral', target: 'es2020',
    external: ['verovio/wasm', 'verovio/esm'], plugins: [coreOnly],
    footer: format === 'cjs' ? {js: 'module.exports = Object.assign(module.exports.default, module.exports);'} : undefined,
  });
}
await copyFile('src/index.d.cts', 'lib/index.d.cts');
