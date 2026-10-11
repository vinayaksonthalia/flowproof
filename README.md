# FlowProof

> **Verified Water Measurement Workbench & Auditable Trial Ledger**  
> *Built for WeMakeDevs × AWS Environmental Hacks — Track 02: Heat & Water*

**Live Deployment (AWS ap-south-1):** [https://4uoe20os9f.execute-api.ap-south-1.amazonaws.com](https://4uoe20os9f.execute-api.ap-south-1.amazonaws.com)  
**Live API Health Check:** `curl https://4uoe20os9f.execute-api.ap-south-1.amazonaws.com/api/health`

---

## What is FlowProof?

FlowProof helps households, schools, and communities measure the **exact water volume required to complete the same task** before and after changing one habit.

Most water conservation advice relies on speculative averages (e.g., *"saving 20,000 litres per year"*). FlowProof replaces speculation with empirical evidence:
- It guides each trial with a timer and a calibrated vessel fill tally.
- It calculates total litres and validates volume arithmetic server-side.
- A **fixed-volume negative control** demonstrates that filling the same container more slowly changes duration, not litres.
- The outcome is an immutable, cryptographically verifiable, 7-day shareable receipt with raw entries, capture method provenance, and honest boundaries.

## Architecture & AWS Engine

FlowProof is built as a single-origin serverless architecture deployed in **AWS Asia Pacific (Mumbai) `ap-south-1`**:

```
[ Browser / Client ]
         │ HTTPS
         ▼
[ Amazon API Gateway v2 ] (HTTP API · Rate Limiting 5 req/s · Burst 10)
         │
         ▼
[ AWS Lambda (Node.js 22) ] (Single-origin handler: Vite SPA assets + Invariant Validation)
         │
         ▼
[ Amazon DynamoDB ] (On-Demand ephemeral receipt storage · Native 7-day TTL auto-purge)
```

- **Zero LLM Hallucination**: No generative models in the calculation path. Every subtraction (`baseline - changed_habit`) and vessel tally (`fills * vessel + remainder`) is strictly deterministic and verified against floating-point tolerances (±0.005 L).
- **Privacy by Design**: DynamoDB items carry an automated 7-day Time-to-Live (`ttl`) timestamp, automatically purging self-reported data without residual footprint.
- **Zero Idle Cost**: Runs entirely within the AWS Free Tier with on-demand scaling.

## Features

- **Benchmark Protocols**: 1-click presets for common household routines:
  - `01 Dishes (Delhi Tap-off)`: 4 plates under running tap vs soaping with tap closed.
  - `02 Teeth Brushing (Tumbler)`: Running tap vs 250ml tumbler rinse.
  - `03 1L Bottle (Negative Control)`: Fast vs slow flow into a 1L vessel (verifies 0.0 L difference).
- **Vessel Tally & Timer**: Built-in stopwatch with marked vessel increment counters.
- **In-App AWS Engine Telemetry**: Real-time stack inspection modal for evaluators and judges.
- **Auditable Receipt Ledger**: Shareable link (e.g., `/receipt/uuid`) displaying raw parameters, timing provenance, and validity gates.
- **CSV Data Export**: One-click download of structured experimental trial data for environmental researchers and students.
- **Urban Basin Context**: Translates saved litres into local 16L standard municipal bucket equivalents.

## Run Locally

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

## Test & Verify

```sh
# Run API test suite (20 automated integration & unit tests)
npm --prefix api test

# Build production web application
npm --prefix web run build

# Package static assets into Lambda bundle
npm --prefix api run prepare:web

# Validate AWS SAM infrastructure
sam validate --lint --template-file api/template.yaml
```

## Project Documentation & Hackathon Resources

| Document | Purpose & Contents |
| :--- | :--- |
| **[DEMO-VIDEO.md](DEMO-VIDEO.md)** | Full 3-minute video walkthrough and presentation script for hackathon judges. |
| **[DEMO-PROTOCOL.md](DEMO-PROTOCOL.md)** | Step-by-step physical measurement protocol for household routines and negative controls. |
| **[DEPLOY-AWS.md](DEPLOY-AWS.md)** | Live AWS infrastructure specifications, SAM deployment steps, and live verification commands. |
| **[QUALITY-GATES.md](QUALITY-GATES.md)** | Quality gates, deterministic invariants, zero-LLM boundaries, and automated test matrix. |

## Core Decisions & Invariants

- **The Primary Formula**: `baseline total litres − changed-habit total litres`, formatted to 0.1 L for display while retaining exact inputs on the receipt.
- **Negative Control**: Flow reduction changes flow rate and duration, not total volume when target volume is fixed. The engine enforces 0.0 L difference.
- **Strict Validation Gates**: Comparisons are rejected if required completion standards do not match, if item counts differ, or if spillage occurred.
- **No Extrapolations**: The app refuses to project annual financial or municipal savings from a single trial, preserving scientific honesty.

## License

MIT
