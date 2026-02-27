/**
 * Convert a markdown file with lyl code blocks to HTML using lilylet-markdown.
 *
 * Usage: npx tsx scripts/md-to-html.ts <input.md> [output.html]
 */

import fs from "fs";
import path from "path";
import MarkdownIt from "markdown-it";
import lilyletPlugin, { prerender, initVerovio } from "../src/index.js";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath) {
	console.error("Usage: npx tsx scripts/md-to-html.ts <input.md> [output.html]");
	process.exit(1);
}

const absInput = path.resolve(inputPath);
const absOutput = outputPath
	? path.resolve(outputPath)
	: absInput.replace(/\.md$/, ".html");

const content = fs.readFileSync(absInput, "utf8");

const verovioToolkit = await initVerovio();
console.log("Verovio initialized");

const md = new MarkdownIt({ html: true });
md.use(lilyletPlugin, { verovioToolkit });

await prerender(md, content, { verovioToolkit });
console.log("Pre-render complete");

const body = md.render(content);

const title = content.match(/^#\s+(.+)/m)?.[1] || "Lilylet Scores";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { max-width: 960px; margin: 2em auto; font-family: Georgia, serif; color: #333; padding: 0 1em; }
  h1 { border-bottom: 2px solid #333; padding-bottom: 0.3em; }
  h2 { margin-top: 2em; color: #555; }
  img { max-width: 100%; border: 1px solid #ddd; }
  .lilylet-container { margin: 1em 0; }
  .lilylet-container svg { max-width: 100%; height: auto; }
  .lilylet-error { color: red; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ccc; padding: 0.4em 0.8em; text-align: left; }
  th { background: #f5f5f5; }
  code { background: #f0f0f0; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f8f8f8; padding: 1em; border-radius: 4px; overflow-x: auto; }
</style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync(absOutput, html);
console.log(`Written: ${absOutput}`);
