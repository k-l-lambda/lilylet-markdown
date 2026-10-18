import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('publish build dependencies resolve to registry packages, not local workspace links', () => {
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages['node_modules/@k-l-lambda/lilylet'].version, pkg.devDependencies['@k-l-lambda/lilylet']);
  for (const [name, info] of Object.entries(lock.packages)) {
    assert.ok(!info.link, `Local link in lockfile: ${name}`);
    if (info.resolved) assert.match(info.resolved, /^https:\/\//, `Non-registry resolution: ${name}`);
  }
});
