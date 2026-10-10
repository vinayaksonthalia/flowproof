import { compareExperiment } from './compare.js';
import { saveReceipt, getReceipt } from './store.js';

export async function route(method, path, body) {
  if (method === 'GET' && path === '/api/health') return {statusCode: 200, body: {status: 'ok', storage: process.env.RECEIPTS_TABLE ? 'dynamodb' : 'memory'}};
  if (method === 'POST' && path === '/api/compare') {
    const comparison = compareExperiment(body);
    if (comparison.status !== 'accepted') return {statusCode: 200, body: comparison};
    const receipt = await saveReceipt(body, comparison);
    return {statusCode: 200, body: receipt.comparison};
  }
  const receiptMatch = path.match(/^\/api\/receipts\/([0-9a-f-]{36})$/i);
  if (method === 'GET' && receiptMatch) {
    const receipt = await getReceipt(receiptMatch[1]);
    return receipt ? {statusCode: 200, body: receipt} : {statusCode: 404, body: {error: 'Receipt not found.'}};
  }
  return {statusCode: 404, body: {error: 'Route not found.'}};
}

export function corsHeaders(origin) {
  const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',').map(value => value.trim());
  return {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin', ...(allowed.includes(origin) ? {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'} : {})};
}

export function isJsonContentType(value) {
  return typeof value === 'string' && value.split(';')[0].trim().toLowerCase() === 'application/json';
}
