import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {serveStatic} from '../src/static.js';
import {handler} from '../src/lambda.js';

test('serves HTML, SPA fallback, typed assets and binary bytes without traversal', async () => {
  const root = await mkdtemp(join(fileURLToPath(new URL('./', import.meta.url)), '.static-'));
  try {
    await mkdir(join(root, 'assets'));
    await writeFile(join(root, 'index.html'), '<main>FlowProof</main>');
    await writeFile(join(root, 'assets/app.js'), 'console.log("FlowProof")');
    const binary = Buffer.from([0, 128, 255, 42]);
    await writeFile(join(root, 'assets/icon.png'), binary);
    for (const path of ['/', '/receipt/abc']) {
      const response = await serveStatic(path, root);
      assert.equal(response.statusCode, 200);
      assert.match(response.headers['Content-Type'], /text\/html/);
      assert.equal(Buffer.from(response.body, 'base64').toString(), '<main>FlowProof</main>');
    }
    assert.match((await serveStatic('/assets/app.js', root)).headers['Content-Type'], /javascript/);
    const response = await serveStatic('/assets/icon.png', root);
    assert.deepEqual(Buffer.from(response.body, 'base64'), binary);
    assert.equal(response.isBase64Encoded, true);
    assert.equal((await serveStatic('/assets/missing.js', root)).statusCode, 404);
    assert.equal((await serveStatic('/%2e%2e/package.json', root)).statusCode, 400);
    assert.equal((await serveStatic('/%FF', root)).statusCode, 400);
    assert.equal((await serveStatic('/%00', root)).statusCode, 400);
  } finally {await rm(root, {recursive: true, force: true});}
});
test('Lambda API routes keep JSON responses instead of SPA fallback', async () => {
  const response = await handler({requestContext: {http: {method: 'GET'}}, rawPath: '/api/health'});
  assert.equal(JSON.parse(response.body).status, 'ok');
  const missing = await handler({requestContext: {http: {method: 'GET'}}, rawPath: '/api/no-such-route'});
  assert.equal(missing.statusCode, 404);
  assert.equal(JSON.parse(missing.body).error, 'Route not found.');
});
