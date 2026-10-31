/** Same-origin API bridge; LEARNING_SYNC is a Cloudflare Service Binding. */
export async function onRequest({ request, env }) {
  const unavailable = () => new Response(JSON.stringify({ error: 'cloud_unavailable' }), {
    status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
  if (!env.LEARNING_SYNC) return unavailable();
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  // Overwrite client-supplied forwarding metadata at the trusted boundary.
  headers.set('X-Learning-Origin', url.origin);
  headers.delete('X-Forwarded-For');
  const upstream = new Request(request, { headers });
  try {
    const result = await env.LEARNING_SYNC.fetch(upstream);
    const response = new Response(result.body, result);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.delete('Access-Control-Allow-Origin');
    return response;
  } catch {
    return unavailable();
  }
}
