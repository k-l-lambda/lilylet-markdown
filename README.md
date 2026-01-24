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

### Basic Usage (Placeholder Mode)

When no Verovio toolkit is provided, the plugin outputs placeholders with embedded MEI data for client-side rendering:

```javascript
import MarkdownIt from 'markdown-it';
import lilyletPlugin from '@k-l-lambda/lilylet-markdown';

const md = new MarkdownIt();
md.use(lilyletPlugin);

const result = md.render(`
# My Score

\`\`\`lilylet
\\key c \\major
\\time 4/4
c'4 d' e' f' | g'1
\`\`\`
`);
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
