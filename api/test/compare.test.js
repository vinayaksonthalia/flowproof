import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareExperiment} from '../src/compare.js';
import {route} from '../src/app.js';
import {handler} from '../src/lambda.js';
import {saveReceipt, getReceipt, RETENTION_SECONDS} from '../src/store.js';

function experiment(overrides = {}) {
  return {experimentType: 'completed_task', task: {name: 'Wash one dish', unitsCount: 1, completionCriterion: 'Visibly clean, same residue and soap', vesselLitres: 1}, baseline: {litres: 4.2, durationSeconds: 60, spillage: false, completed: true, unitsCompleted: 1}, intervention: {litres: 1.8, durationSeconds: 70, spillage: false, completed: true, unitsCompleted: 1}, interventionName: 'Turn off tap while scrubbing', ...overrides};
}
test('compares total water and preserves a negative result', () => {
  assert.equal(compareExperiment(experiment()).observedDifferenceLitres, 2.4);
  const input = experiment();
  input.intervention.litres = 5;
  assert.equal(compareExperiment(input).observedDifferenceLitres, -0.8);
});
test('fixed-output negative control returns zero despite different durations', () => {
  const input = experiment({experimentType: 'fixed_volume', baseline: {litres: 1, durationSeconds: 5, spillage: false}, intervention: {litres: 1, durationSeconds: 20, spillage: false}});
  const output = compareExperiment(input);
  assert.equal(output.status, 'accepted');
  assert.equal(output.observedDifferenceLitres, 0);
});

test('zero vessel tally cannot support a positive measured volume within rounding tolerance', () => {
  const input = experiment();
  input.baseline.litres = 0.004;
  input.baseline.capture = {method: 'vessel_tally', fullVessels: 0, remainderLitres: 0};
  const comparison = compareExperiment(input);
  assert.equal(comparison.status, 'rejected');
  assert.ok(comparison.reasons.some(reason => reason.includes('vessel tally')));
});

test('receipt keeps valid timer provenance and rejects invented duration sources', async () => {
  const input = experiment();
  input.baseline.durationSource = 'timer';
  input.intervention.durationSource = 'manual';
  const response = await route('POST', '/api/compare', input);
  const saved = await route('GET', `/api/receipts/${response.body.receiptId}`);
  assert.equal(saved.body.experiment.baseline.durationSource, 'timer');
  assert.equal(saved.body.experiment.intervention.durationSource, 'manual');
  input.intervention.durationSource = 'imagined';
  assert.equal(compareExperiment(input).status, 'rejected');
});
test('results use 0.1 L display precision and explain tiny differences', () => {
  const input = experiment(); input.baseline.litres = 4.23456;
  assert.equal(compareExperiment(input).observedDifferenceLitres, 2.4);
  input.baseline.litres = 1.82;
  const output = compareExperiment(input);
  assert.equal(output.observedDifferenceLitres, 0);
  assert.match(output.reasons[0], /smaller than/);
  input.baseline.litres = 1.78;
  assert.equal(Object.is(compareExperiment(input).observedDifferenceLitres, -0), false);
});
test('receipts expire after seven days even before asynchronous database deletion', async () => {
  const input = experiment();
  const receipt = await saveReceipt(input, compareExperiment(input));
  assert.ok(Math.abs(receipt.expiresAt - Math.floor(Date.now() / 1000) - RETENTION_SECONDS) <= 1);
  receipt.expiresAt = Math.floor(Date.now() / 1000) - 1;
  assert.equal(await getReceipt(receipt.receiptId), null);
});
test('a smaller final fill is uncertain and never a saving', () => {
  const input = experiment({experimentType: 'fixed_volume', baseline: {litres: 1, durationSeconds: 5, spillage: false}, intervention: {litres: 0.8, durationSeconds: 4, spillage: false}});
  assert.equal(compareExperiment(input).status, 'uncertain');
  assert.equal(compareExperiment(input).observedDifferenceLitres, null);
});
test('fixed target includes the declared number of vessels', () => {
  const input = experiment({experimentType: 'fixed_volume', baseline: {litres: 2, durationSeconds: 5, spillage: false}, intervention: {litres: 2, durationSeconds: 8, spillage: false}});
  input.task.unitsCount = 2;
  assert.equal(compareExperiment(input).observedDifferenceLitres, 0);
});
test('missing fields, strings, non-finite values, spillage and invalid standards reject', () => {
  for (const value of [null, {}, []]) assert.equal(compareExperiment(value).status, 'rejected');
  for (const value of [0, -1, Infinity, NaN, '4.2']) {
    const input = experiment(); input.baseline.litres = value;
    assert.equal(compareExperiment(input).status, 'rejected');
  }
  for (const value of [undefined, true, 'false']) {
    const input = experiment(); input.intervention.spillage = value;
    assert.equal(compareExperiment(input).status, 'rejected');
  }
  const input = experiment(); input.task.completionCriterion = ' ';
  assert.equal(compareExperiment(input).status, 'rejected');
});
test('accepted receipt retains raw input, self-reporting and scope', async () => {
  const input = experiment();
  const response = await route('POST', '/api/compare', input);
  assert.equal(response.statusCode, 200);
  assert.match(response.body.receiptId, /^[0-9a-f-]{36}$/);
  const saved = await route('GET', `/api/receipts/${response.body.receiptId}`);
  assert.deepEqual(saved.body.experiment, input);
  assert.equal(saved.body.measurementSource, 'self_reported');
  assert.equal(saved.body.claimScope, 'single_pair_observation');
  assert.equal(Object.hasOwn(response.body, 'annualSavings'), false);
});
test('rejected trials create no receipt', async () => {
  const input = experiment(); input.baseline.spillage = true;
  const response = await route('POST', '/api/compare', input);
  assert.equal(response.body.receiptId, null);
  assert.equal(response.body.observedDifferenceLitres, null);
});
test('completed routines require both completed standards and matching item counts', () => {
  for (const name of ['baseline', 'intervention']) {
    for (const completed of [false, undefined, 'true']) {
      const input = experiment(); input[name].completed = completed;
      assert.equal(compareExperiment(input).status, 'rejected');
    }
    for (const units of [undefined, 0, 2, 1.5, '1']) {
      const input = experiment(); input[name].unitsCompleted = units;
      assert.equal(compareExperiment(input).status, 'rejected');
    }
  }
});
test('receipt strips private extra fields at every request level', async () => {
  const input = experiment(); input.privateEmail = 'secret@example.com'; input.task.privateAddress = 'secret'; input.baseline.privateEmail = 'secret@example.com'; input.intervention.notes = {privateAddress: 'secret'};
  const response = await route('POST', '/api/compare', input);
  const saved = await route('GET', `/api/receipts/${response.body.receiptId}`);
  assert.equal(JSON.stringify(saved.body).includes('secret'), false);
  assert.deepEqual(saved.body.experiment, experiment());
});
test('vessel tally accepts measured arithmetic, zero fills/remainder and keeps negative result', () => {
  const input = experiment();
  input.baseline.capture = {method: 'vessel_tally', fullVessels: 4, remainderLitres: 0.2};
  input.intervention.capture = {method: 'vessel_tally', fullVessels: 1, remainderLitres: 0.8};
  assert.equal(compareExperiment(input).observedDifferenceLitres, 2.4);
  input.baseline.litres = 0.2;
  input.baseline.capture.fullVessels = 0;
  input.intervention.litres = 2;
  input.intervention.capture = {method: 'vessel_tally', fullVessels: 2, remainderLitres: 0};
  assert.equal(compareExperiment(input).observedDifferenceLitres, -1.8);
  assert.equal(compareExperiment(input).status, 'accepted');
});
test('tampered totals reject; tally serialization tolerance permits 0.005 L', () => {
  const input = experiment();
  input.baseline.capture = {method: 'vessel_tally', fullVessels: 4, remainderLitres: 0.2};
  input.baseline.litres = 4.205;
  assert.equal(compareExperiment(input).status, 'accepted');
  input.baseline.litres = 4.206;
  assert.equal(compareExperiment(input).status, 'rejected');
  input.baseline.litres = 4.1;
  assert.equal(compareExperiment(input).observedDifferenceLitres, null);
});
test('malformed tally fields and capture methods reject', () => {
  for (const capture of [null, [], 'manual', {}, {method: 'camera'}, ...[-1, 1.2, '4', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, undefined].map(fullVessels => ({method: 'vessel_tally', fullVessels, remainderLitres: 0.2})), ...[-0.1, 1, '0.2', NaN, Infinity, undefined].map(remainderLitres => ({method: 'vessel_tally', fullVessels: 4, remainderLitres}))]) {
    const input = experiment(); input.baseline.capture = capture;
    assert.equal(compareExperiment(input).status, 'rejected', JSON.stringify(capture));
  }
});
test('explicit manual and omitted legacy capture work; capture receipt is whitelisted', async () => {
  assert.equal(compareExperiment(experiment()).status, 'accepted');
  const input = experiment();
  input.baseline.capture = {method: 'vessel_tally', fullVessels: 4, remainderLitres: 0.2, privateEmail: 'secret'};
  input.intervention.capture = {method: 'manual', fullVessels: 'ignored', privateAddress: 'secret'};
  const response = await route('POST', '/api/compare', input);
  const saved = await route('GET', `/api/receipts/${response.body.receiptId}`);
  assert.deepEqual(saved.body.experiment.baseline.capture, {method: 'vessel_tally', fullVessels: 4, remainderLitres: 0.2});
  assert.deepEqual(saved.body.experiment.intervention.capture, {method: 'manual'});
  assert.equal(JSON.stringify(saved.body).includes('secret'), false);
  assert.ok(saved.body.expiresAt > Math.floor(Date.now() / 1000));
});
test('Lambda handles API Gateway JSON, invalid JSON and oversized bodies', async () => {
  const event = {requestContext: {http: {method: 'POST'}}, headers: {'content-type': 'application/json; charset=utf-8'}, rawPath: '/api/compare', body: JSON.stringify(experiment())};
  const response = await handler(event);
  assert.equal(JSON.parse(response.body).observedDifferenceLitres, 2.4);
  assert.equal((await handler({...event, body: '{'})).statusCode, 400);
  assert.equal((await handler({...event, body: 'x'.repeat(16385)})).statusCode, 413);
  assert.equal((await handler({...event, headers: {}})).statusCode, 415);
  assert.equal((await handler({...event, headers: {'content-type': 'text/plain'}})).statusCode, 415);
});
