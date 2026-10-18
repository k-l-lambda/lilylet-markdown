# lilylet-markdown

A [markdown-it](https://github.com/markdown-it/markdown-it) plugin for rendering [Lilylet](https://github.com/k-l-lambda/lilylet) music notation in Markdown.

## Features

- Render Lilylet notation in fenced code blocks
- Server-side SVG rendering with Verovio
- Client-side rendering support (placeholder mode)
- Supports `lilylet` and `lyl` language aliases

## Installation

```bash
npm install @k-l-lambda/lilylet-markdown
```

## Usage

### CommonJS / Hexo

`require()` returns the plugin function directly; no `.default` adapter is needed:

```javascript
const MarkdownIt = require('markdown-it');
const lilylet = require('@k-l-lambda/lilylet-markdown');
const md = new MarkdownIt().use(lilylet);
// Named helpers also live on the function:
const { prerender, initVerovio } = lilylet;
```

ES modules continue to use the default plugin and named helper exports:

```javascript
import lilylet, { prerender, initVerovio } from '@k-l-lambda/lilylet-markdown';
```

For Hexo's `hexo-renderer-markdown-it`, register the package directly:

```yaml
markdown:
  plugins:
    - '@k-l-lambda/lilylet-markdown'
```

Hexo must also pass Lilylet fences through its earlier syntax-highlighting
stage. The plugin supplies markup, not a browser player: client-side engraving
and audio playback still need a runtime.

Both module formats contain the Lilylet parser and MEI encoder. Consumers do
not load Lilylet's broad entry point, Lotus, or its unrelated decoder dependencies.
Verovio is imported only when `initVerovio()` is called. ESM and CommonJS may
coexist in one process without sharing a global parser registration.

### Basic Usage (Placeholder Mode)

Synchronous `md.render()` outputs placeholders containing the Lilylet source.
Call `await prerender(md, content)` first to embed MEI without a Verovio toolkit:

```javascript
import MarkdownIt from 'markdown-it';
import lilyletPlugin, { prerender } from '@k-l-lambda/lilylet-markdown';

const md = new MarkdownIt();
md.use(lilyletPlugin);

const content = `
# My Score

\`\`\`lilylet
\\key c \\major
\\time 4/4
c'4 d' e' f' | g'1
\`\`\`
`;
await prerender(md, content);
const result = md.render(content);
```

Output:
```html
<h1>My Score</h1>
<div class="lilylet-container" data-lilylet data-source="..." data-mei="..."></div>
```

### Server-side SVG Rendering

For server-side rendering, initialize Verovio and pass it to the plugin:

```javascript
import MarkdownIt from 'markdown-it';
import lilyletPlugin, { initVerovio, prerender } from '@k-l-lambda/lilylet-markdown';

async function render(content) {
  // Initialize Verovio
  const verovioToolkit = await initVerovio();

  // Create markdown-it instance with plugin
  const md = new MarkdownIt();
  md.use(lilyletPlugin, { verovioToolkit });

  // Pre-render all lilylet blocks (async)
  await prerender(md, content, { verovioToolkit });

  // Render markdown (sync)
  return md.render(content);
}
```

### Options

```typescript
interface LilyletPluginOptions {
  // Initialized Verovio toolkit instance
  verovioToolkit?: VerovioToolkit;

  // Verovio rendering options
  verovioOptions?: {
    scale?: number;        // Default: 40
    pageWidth?: number;    // Default: 2000
    adjustPageHeight?: boolean;  // Default: true
  };

  // Language aliases that trigger rendering
  langAliases?: string[];  // Default: ['lilylet', 'lyl']

  // CSS class for container
  containerClass?: string; // Default: 'lilylet-container'

  // CSS class for errors
  errorClass?: string;     // Default: 'lilylet-error'

  // Include source in data attribute
  includeSource?: boolean; // Default: true
}
```

## Markdown Syntax

Use fenced code blocks with `lilylet` or `lyl` language identifier:

~~~markdown
```lilylet
\key g \major
\time 3/4
d'4 g' b' | d''2.
```
~~~

Or using the short alias:

~~~markdown
```lyl
c'4 d' e' f' | g'1
```
~~~

For a playable score, use `lyl.play` or `lilylet.play` as the fence language.
The plugin adds `data-playable`; your client runtime implements the controls
and audio. This attribute is retained after pre-rendering as well.

## Development

```bash
npm ci
npm test
npm pack
```

The build emits ESM, CommonJS, and corresponding TypeScript declarations into
`lib/`. `prepack` builds these files before packing or publishing. The parser
and encoder are bundled from a pinned Lilylet build dependency; the generated
grammar is scoped locally to avoid collisions between entry points. No absolute
build-machine paths are required by the distributed package.

## Client-side Rendering

For client-side rendering, use the embedded MEI data:

```javascript
import createVerovioModule from 'verovio/wasm';

document.querySelectorAll('[data-lilylet]').forEach(async (container) => {
  const mei = container.dataset.mei;
  if (!mei) return;

  const verovio = await createVerovioModule();
  const toolkit = new verovio.toolkit();
  toolkit.loadData(mei);
  container.innerHTML = toolkit.renderToSVG(1);
});
```

## Similar Projects

- [remark-abcjs](https://github.com/breqdev/remark-abcjs) - Remark plugin for ABC notation
- [markdown-it-mermaid](https://github.com/tylingsoft/markdown-it-mermaid) - Mermaid diagrams in markdown

## License

ISC
