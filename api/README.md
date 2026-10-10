# FlowProof API

Node 22+ service. Run `npm install`, then `npm run dev`. The API listens on `http://127.0.0.1:8787`. Run `npm test` for the scientific control, invalid input, receipt and Lambda contract checks.

`POST /api/compare` accepts:

```json
{
  "experimentType": "completed_task",
  "task": {"name": "Wash one dish", "unitsCount": 1, "completionCriterion": "Visibly clean, same residue and soap", "vesselLitres": 1},
  "baseline": {"litres": 4.2, "durationSeconds": 60, "spillage": false, "completed": true, "unitsCompleted": 1},
  "intervention": {"litres": 1.8, "durationSeconds": 70, "spillage": false, "completed": true, "unitsCompleted": 1},
  "interventionName": "Turn off tap while scrubbing"
}
```

Returns `{status, observedDifferenceLitres, reasons, receiptId}`. Application validation uses HTTP 200 with `rejected` or `uncertain`; malformed JSON uses 400 and oversized requests use 413. Persistence failure uses 503, never a success receipt. A completed task returns baseline minus intervention with its sign intact. A fixed-volume control uses `vesselLitres * unitsCount` as its declared final output: equal outputs produce zero regardless of duration; readings outside 0.001 L of that target are uncertain. There is no household, financial, annual or population projection.

POST requests require `Content-Type: application/json` (optional charset is supported); missing or other media types return 415. Completed tasks require each trial to confirm `completed: true` and a positive integer `unitsCompleted` equal to `task.unitsCount`. Fixed-volume controls may omit those fields. Receipt persistence copies only the named schema fields; extra metadata at the experiment, task or trial level is discarded and never returned by receipt reads. Completion remains a person's explicit attestation.

`GET /api/receipts/:receiptId` retrieves an accepted observation, including raw measurements, timestamp and self-reporting limitations. Receipts contain no independently verified measurement. The shared task definition is an attestation that both trials used the same item count and completion standard; the API cannot verify this physical claim. `GET /api/health` reports the storage mode.

Differences are rounded to 0.1 L for display, and raw volumes are retained. This precision does not guarantee measuring accuracy; sub-0.05 L differences produce zero with an explicit small-difference explanation.

Local receipts live in process memory and disappear on restart. Receipts expire after seven days. The read endpoint stops returning them at expiry; DynamoDB TTL removes the stored items asynchronously afterward. Set `RECEIPTS_TABLE` to enable DynamoDB storage through the AWS SDK credential chain. UUID receipt links grant read access to whoever has the URL; avoid entering identifying details. No media is collected by this service.

Set `PORT` to change the local port. Set `ALLOWED_ORIGINS` to a comma-separated list of exact frontend origins (default localhost ports 5173 and 3000, plus 127.0.0.1:5173). The API does not rely on CORS as access control.

The same Lambda serves the packaged frontend at `/`, assets at `/assets/*`, and client routes through an HTML fallback. `/api/*` keeps its JSON API behavior. This produces one HTTPS origin with no cross-origin configuration. Build and copy the frontend before building the Lambda (CloudShell can run these commands after uploading the project):

```sh
cd ../web
npm ci
npm run build
cd ../api
npm ci
npm run prepare:web
```

Deploy the included SAM template after configuring AWS credentials and installing AWS SAM CLI (CloudShell supplies account credentials):

```sh
sam build
sam deploy --guided
```

The template provisions HTTP API Gateway, a Node 22 Lambda and an encrypted DynamoDB table using on-demand billing. The default API stage sets a rate of 5 requests/second and burst of 10 using [SAM DefaultRouteSettings](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-httpapi.html); these are aggregate best-effort throttles rather than a per-user quota or hard spending cap. Open the `ApiUrl` output to use the frontend and API together. Leave `FrontendOrigin` blank for this same-origin deployment; set it only when hosting the frontend separately. The frontend's production API base should be empty so it requests `/api/compare` on its current origin. Deployment creates billable AWS resources; the template has not been deployed by this build. For a public production service, add authentication before accepting personal data.
