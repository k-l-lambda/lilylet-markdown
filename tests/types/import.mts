import MarkdownIt from 'markdown-it';
import plugin, {prerender, type LilyletPluginOptions} from '@k-l-lambda/lilylet-markdown';
const options: LilyletPluginOptions = {includeSource: true};
const md = new MarkdownIt().use(plugin, options);
void prerender(md, '```lyl\nc1\n```');
