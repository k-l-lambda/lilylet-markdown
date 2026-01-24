/**
 * Test for lilylet-markdown plugin
 */

import MarkdownIt from 'markdown-it';
import lilyletPlugin, { prerender, initVerovio } from '../lib/index.js';

const markdown = `
# Test Document

This is a test of the lilylet markdown plugin.

## Simple Scale

\`\`\`lilylet
\\key c \\major
\\time 4/4

c'4 d' e' f' | g'1
\`\`\`

## Chord Example

\`\`\`lyl
<c' e' g'>2 <d' f' a'>2 | <e' g' b'>1
\`\`\`

## Regular Code Block

\`\`\`javascript
console.log('Hello, world!');
\`\`\`
`;

async function testWithoutVerovio() {
  console.log('=== Test without Verovio (placeholder mode) ===\n');

  const md = new MarkdownIt();
  md.use(lilyletPlugin);

  const result = md.render(markdown);
  console.log(result);

  // Check that lilylet blocks have data-lilylet-pending attribute
  if (result.includes('data-lilylet-pending')) {
    console.log('✓ Placeholder mode working correctly\n');
  } else {
    console.error('✗ Expected data-lilylet-pending attribute\n');
  }
}

async function testWithVerovio() {
  console.log('=== Test with Verovio (SVG rendering) ===\n');

  try {
    const verovioToolkit = await initVerovio();
    console.log('Verovio initialized');

    const md = new MarkdownIt();
    md.use(lilyletPlugin, { verovioToolkit });

    // Pre-render all lilylet blocks
    await prerender(md, markdown, { verovioToolkit });

    const result = md.render(markdown);

    // Check for SVG output
    if (result.includes('<svg')) {
      console.log('✓ SVG rendering working correctly');
      console.log(`  Found ${(result.match(/<svg/g) || []).length} SVG element(s)\n`);
    } else {
      console.error('✗ Expected SVG output\n');
    }

    // Check that regular code blocks still work
    if (result.includes('console.log')) {
      console.log('✓ Regular code blocks preserved\n');
    } else {
      console.error('✗ Regular code blocks broken\n');
    }

    // Output a sample
    console.log('Sample output (first 2000 chars):');
    console.log(result.substring(0, 2000));
    console.log('...\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  await testWithoutVerovio();
  await testWithVerovio();
}

main().catch(console.error);
