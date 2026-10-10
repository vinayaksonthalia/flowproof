import { randomUUID } from 'node:crypto';
import {canonicalExperiment} from './compare.js';

const receipts = new Map();
export const RETENTION_SECONDS = 7 * 24 * 60 * 60;
let dynamo;
async function database() {
  if (!dynamo) {
    const [{DynamoDBClient}, {DynamoDBDocumentClient}] = await Promise.all([import('@aws-sdk/client-dynamodb'), import('@aws-sdk/lib-dynamodb')]);
    dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }
  return dynamo;
}
export async function saveReceipt(input, comparison) {
  const receiptId = randomUUID();
  const receipt = {receiptId, createdAt: new Date().toISOString(), expiresAt: Math.floor(Date.now() / 1000) + RETENTION_SECONDS, experiment: canonicalExperiment(input), comparison: {...comparison, receiptId}, measurementSource: 'self_reported', claimScope: 'single_pair_observation'};
  if (process.env.RECEIPTS_TABLE) {
    const {PutCommand} = await import('@aws-sdk/lib-dynamodb');
    await (await database()).send(new PutCommand({TableName: process.env.RECEIPTS_TABLE, Item: receipt, ConditionExpression: 'attribute_not_exists(receiptId)'}));
  } else receipts.set(receiptId, receipt);
  return receipt;
}
export async function getReceipt(receiptId) {
  if (process.env.RECEIPTS_TABLE) {
    const {GetCommand} = await import('@aws-sdk/lib-dynamodb');
    const response = await (await database()).send(new GetCommand({TableName: process.env.RECEIPTS_TABLE, Key: {receiptId}}));
    return response.Item && response.Item.expiresAt > Math.floor(Date.now() / 1000) ? {...response.Item, experiment: canonicalExperiment(response.Item.experiment)} : null;
  }
  const receipt = receipts.get(receiptId);
  if (receipt && receipt.expiresAt <= Math.floor(Date.now() / 1000)) {receipts.delete(receiptId); return null;}
  return receipt ? {...receipt, experiment: canonicalExperiment(receipt.experiment)} : null;
}
