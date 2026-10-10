import { route, corsHeaders, isJsonContentType } from './app.js';
import {serveStatic} from './static.js';

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const headers = corsHeaders(event.headers?.origin || event.headers?.Origin);
  const respond = (statusCode, body) => ({statusCode, headers, body: body === null ? '' : JSON.stringify(body)});
  if (method === 'OPTIONS') return respond(204, null);
  if (method === 'POST' && !isJsonContentType(event.headers?.['content-type'] || event.headers?.['Content-Type'])) return respond(415, {error: 'Use Content-Type: application/json.'});
  try {
    const path = event.rawPath || event.path || '/';
    if (method === 'GET' && path !== '/api' && !path.startsWith('/api/')) return await serveStatic(path);
    let raw = event.body || '';
    if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
    if (Buffer.byteLength(raw) > 16384) return respond(413, {error: 'Request exceeds 16 KB.'});
    let body;
    try {body = raw ? JSON.parse(raw) : undefined;} catch {return respond(400, {error: 'Request must contain valid JSON.'});}
    const response = await route(method, path, body);
    return respond(response.statusCode, response.body);
  } catch (error) {
    console.error('Request failed:', error.message);
    return respond(503, {error: 'The receipt could not be saved. Try again.'});
  }
}
