# FlowProof

FlowProof helps someone compare the **total water used to complete the same task** before and after changing one habit. A fixed-volume control shows that filling the same container more slowly changes time, not litres. The result is a short-lived, shareable receipt with raw entries, comparison checks, and limitations.

This is a self-reported experiment, not an automatic meter or proof of long-term savings. An accepted comparison requires the same declared task size and finish line, completed trials, and no reported water loss outside collection. If the changed habit uses more water, the signed negative result remains visible.

## Run locally

Node.js 22 or newer is required.

```sh
cd api
npm ci
npm run dev
```

In a second terminal:

```sh
cd web
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. The Vite development server proxies `/api` to the local API on port 8787.

## Verify

```sh
cd web && npm run build
cd ../api && npm test && npm run prepare:web && sam validate --lint && sam build
```

The AWS version serves the built frontend and JSON API from one HTTPS origin through API Gateway and Lambda, with seven-day DynamoDB receipts. See [DEPLOY-AWS.md](DEPLOY-AWS.md) for CloudShell deployment and verification, [DEMO-PROTOCOL.md](DEMO-PROTOCOL.md) for a real measurement, and [DEMO-VIDEO.md](DEMO-VIDEO.md) for the three-minute presentation.

## Core decisions

- The primary number is `baseline total litres − changed-habit total litres`, rounded to 0.1 L for display; raw entries remain on the receipt.
- A comparison is rejected when required completion or item counts do not match, or when a trial reports spillage. A mismatched fixed-volume target is marked uncertain.
- The fixed-volume control should report 0 L when both readings equal the same declared fill target, regardless of duration.
- Receipts are readable by anyone with their unguessable link and expire after seven days. Do not enter personal details.
- The app does not calculate daily, yearly, financial, or household-wide savings from one pair of trials.

