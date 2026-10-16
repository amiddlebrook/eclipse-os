interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}
type CfRequest = Request & { cf?: { colo?: string } };
const VERSION = '2.0.0';
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'DENY'
  }
});
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);
    const colo = (request as CfRequest).cf?.colo ?? null;
    if (url.pathname === '/api/health') {
      return json({
        status: 'operational',
        service: 'eclipse-os',
        version: VERSION,
        colo,
        observedAt: new Date().toISOString()
      });
    }
    if (url.pathname === '/api/diagnostics') {
      return json({
        service: 'eclipse-os',
        version: VERSION,
        colo,
        checks: {
          runtime: true,
          securityHeaders: true
        },
        observedAt: new Date().toISOString()
      });
    }
    return json({ error: 'not_found' }, 404);
  }
};
