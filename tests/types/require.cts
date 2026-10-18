import MarkdownIt = require('markdown-it');
import plugin = require('@k-l-lambda/lilylet-markdown');
const options: plugin.LilyletPluginOptions = {includeSource: true};
const md = new MarkdownIt().use(plugin, options);
void plugin.prerender(md, '```lyl\nc1\n```');
void plugin.initVerovio;
