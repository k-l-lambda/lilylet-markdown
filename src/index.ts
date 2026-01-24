/**
 * Lilylet Markdown-it Plugin
 *
 * Renders Lilylet music notation in fenced code blocks.
 *
 * Usage:
 * ```lilylet
 * c'4 d' e' f' | g'1
 * ```
 *
 * Or with alias:
 * ```lyl
 * c'4 d' e' f' | g'1
 * ```
 */

import type MarkdownIt from 'markdown-it';
import type { RenderRule } from 'markdown-it/lib/renderer.mjs';
import { parseCode, meiEncoder } from '@k-l-lambda/lilylet';

/**
 * Verovio toolkit interface
 */
export interface VerovioToolkit {
  loadData(data: string): boolean;
  renderToSVG(page?: number, options?: object): string;
  getLog(): string;
  setOptions?(options: object): void;
}

/**
 * Plugin options
 */
export interface LilyletPluginOptions {
  /**
   * Initialized Verovio toolkit instance.
   * If not provided, MEI output will be wrapped in a data attribute for client-side rendering.
   */
  verovioToolkit?: VerovioToolkit;

  /**
   * Verovio rendering options
   */
  verovioOptions?: {
    scale?: number;
    pageWidth?: number;
    pageHeight?: number;
    adjustPageHeight?: boolean;
    border?: number;
    [key: string]: unknown;
  };

  /**
   * Language aliases that trigger lilylet rendering.
   * Default: ['lilylet', 'lyl']
   */
  langAliases?: string[];

  /**
   * CSS class for the container div.
   * Default: 'lilylet-container'
   */
  containerClass?: string;

  /**
   * CSS class for error display.
   * Default: 'lilylet-error'
   */
  errorClass?: string;

  /**
   * Whether to include the source code as a data attribute.
   * Default: true
   */
  includeSource?: boolean;
}

const DEFAULT_OPTIONS: Required<LilyletPluginOptions> = {
  verovioToolkit: undefined as unknown as VerovioToolkit,
  verovioOptions: {
    scale: 40,
    adjustPageHeight: true,
    pageWidth: 2000,
  },
  langAliases: ['lilylet', 'lyl'],
  containerClass: 'lilylet-container',
  errorClass: 'lilylet-error',
  includeSource: true,
};

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render lilylet code to HTML
 */
async function renderLilylet(
  code: string,
  options: Required<LilyletPluginOptions>
): Promise<string> {
  const { verovioToolkit, verovioOptions, containerClass, errorClass, includeSource } = options;

  try {
    // Parse lilylet code
    const doc = await parseCode(code);

    // Encode to MEI
    const mei = meiEncoder.encode(doc);

    // Build data attributes
    const sourceAttr = includeSource ? ` data-source="${escapeHtml(code)}"` : '';
    const meiAttr = ` data-mei="${escapeHtml(mei)}"`;

    // If no Verovio toolkit, return MEI for client-side rendering
    if (!verovioToolkit) {
      return `<div class="${containerClass}" data-lilylet${sourceAttr}${meiAttr}></div>`;
    }

    // Set Verovio options
    if (verovioToolkit.setOptions) {
      verovioToolkit.setOptions(verovioOptions);
    }

    // Load MEI data
    const loaded = verovioToolkit.loadData(mei);
    if (!loaded) {
      const log = verovioToolkit.getLog();
      throw new Error(`Verovio failed to load MEI: ${log}`);
    }

    // Render to SVG
    const svg = verovioToolkit.renderToSVG(1);

    return `<div class="${containerClass}" data-lilylet${sourceAttr}${meiAttr}>${svg}</div>`;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `<div class="${errorClass}" data-lilylet-error><pre>${escapeHtml(errorMessage)}</pre><pre>${escapeHtml(code)}</pre></div>`;
  }
}

/**
 * Synchronous render (for immediate use, returns placeholder if no toolkit)
 */
function renderLilyletSync(
  code: string,
  options: Required<LilyletPluginOptions>,
  cache: Map<string, string>
): string {
  // Check cache first
  const cached = cache.get(code);
  if (cached !== undefined) {
    return cached;
  }

  const { containerClass, includeSource } = options;
  const sourceAttr = includeSource ? ` data-source="${escapeHtml(code)}"` : '';

  // Return placeholder for async rendering
  return `<div class="${containerClass}" data-lilylet-pending${sourceAttr}><code>${escapeHtml(code)}</code></div>`;
}

/**
 * Create the markdown-it plugin
 */
export function lilyletPlugin(md: MarkdownIt, options: LilyletPluginOptions = {}): void {
  const opts: Required<LilyletPluginOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    verovioOptions: { ...DEFAULT_OPTIONS.verovioOptions, ...options.verovioOptions },
  };

  // Cache for pre-rendered content
  const renderCache = new Map<string, string>();

  // Store original fence renderer
  const originalFence: RenderRule = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  // Override fence renderer
  md.renderer.rules.fence = function(tokens, idx, mdOptions, env, self) {
    const token = tokens[idx];
    const info = token.info.trim().toLowerCase();
    const code = token.content.trim();

    // Check if this is a lilylet block
    if (opts.langAliases.includes(info)) {
      return renderLilyletSync(code, opts, renderCache);
    }

    // Fall back to original renderer
    return originalFence(tokens, idx, mdOptions, env, self);
  };

  // Expose async render method for pre-rendering
  (md as MarkdownIt & { lilylet: { prerenderCode: (code: string) => Promise<string> } }).lilylet = {
    prerenderCode: async function(code: string): Promise<string> {
      const result = await renderLilylet(code, opts);
      renderCache.set(code, result);
      return result;
    }
  };
}

/**
 * Pre-render all lilylet blocks in markdown content.
 * Call this before md.render() for async rendering.
 */
export async function prerender(
  md: MarkdownIt,
  content: string,
  options: LilyletPluginOptions = {}
): Promise<void> {
  const opts: Required<LilyletPluginOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    verovioOptions: { ...DEFAULT_OPTIONS.verovioOptions, ...options.verovioOptions },
  };

  // Parse to find all lilylet blocks
  const tokens = md.parse(content, {});

  for (const token of tokens) {
    if (token.type === 'fence' && opts.langAliases.includes(token.info.trim().toLowerCase())) {
      const code = token.content.trim();
      const lilyletExt = (md as MarkdownIt & { lilylet?: { prerenderCode: (code: string) => Promise<string> } }).lilylet;
      if (lilyletExt) {
        await lilyletExt.prerenderCode(code);
      }
    }
  }
}

/**
 * Initialize Verovio toolkit (helper function)
 */
export async function initVerovio(): Promise<VerovioToolkit> {
  const verovioModule = await import('verovio');
  const verovio = verovioModule.default;
  return new Promise((resolve) => {
    verovio.module.onRuntimeInitialized = () => {
      resolve(new verovio.toolkit() as unknown as VerovioToolkit);
    };
  });
}

// Default export
export default lilyletPlugin;
