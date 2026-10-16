import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/worker.ts';

const env = { ASSETS: { fetch: async () => new Response('asset-response', { status: 200 }) } };
const call = (path, options) => worker.fetch(new Request('https://eclipse-os.example' + path, options), env);

test('worker returns real health schema', async () => {
  const response = await call('/api/health');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'operational');
  assert.equal(body.service, 'eclipse-os');
  assert.ok(Number.isFinite(Date.parse(body.observedAt)));
  assert.equal(response.headers.get('cache-control'), 'no-store, private');
});
test('diagnostics returns runtime checks', async () => {
  const response = await call('/api/diagnostics');
  const body = await response.json();
  assert.equal(body.checks.runtime, true);
  assert.equal(body.checks.securityHeaders, true);
});
test('API rejects mutation and unknown paths', async () => {
  assert.equal((await call('/api/health', { method: 'POST' })).status, 405);
  assert.equal((await call('/api/unknown')).status, 404);
});
test('assets are passed through to static asset binding', async () => {
  const response = await call('/');
  assert.equal(await response.text(), 'asset-response');
});
