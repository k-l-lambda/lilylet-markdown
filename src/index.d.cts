import type MarkdownIt from 'markdown-it';
import type * as API from './index.js' with { 'resolution-mode': 'import' };
declare function plugin(md: MarkdownIt, options?: API.LilyletPluginOptions): void;
declare namespace plugin {
  type LilyletPluginOptions = API.LilyletPluginOptions;
  type VerovioToolkit = API.VerovioToolkit;
  const lilyletPlugin: typeof plugin;
  function prerender(md: MarkdownIt, content: string, options?: LilyletPluginOptions): Promise<void>;
  const initVerovio: typeof API.initVerovio;
}
export = plugin;
