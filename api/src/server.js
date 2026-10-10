import { createServer } from 'node:http';
import { route, corsHeaders, isJsonContentType } from './app.js';

export const server = createServer(async (req, res) => {
  const headers = corsHeaders(req.headers.origin);
  const send = (status, body) => {res.writeHead(status, headers); res.end(body === null ? '' : JSON.stringify(body));};
  if (req.method === 'OPTIONS') return send(204, null);
  if (req.method === 'POST' && !isJsonContentType(req.headers['content-type'])) return send(415, {error: 'Use Content-Type: application/json.'});
  try {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk.toString();
      if (Buffer.byteLength(raw) > 16384) return send(413, {error: 'Request exceeds 16 KB.'});
    }
    let body;
    try {body = raw ? JSON.parse(raw) : undefined;} catch {return send(400, {error: 'Request must contain valid JSON.'});}
    const response = await route(req.method, new URL(req.url, 'http://localhost').pathname, body);
    send(response.statusCode, response.body);
  } catch (error) {
    console.error('Request failed:', error.message);
    send(503, {error: 'The receipt could not be saved. Try again.'});
  }
});
server.listen(Number(process.env.PORT || 8787), '127.0.0.1', () => console.log(`FlowProof API running at http://127.0.0.1:${server.address().port}`));
