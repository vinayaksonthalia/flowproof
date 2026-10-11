# Deploy FlowProof from AWS CloudShell

Upload `flowproof-cloudshell.zip` to CloudShell and deploy one stack. The resulting URL serves the app, API and receipts on the same origin. This guide was checked against the current [CloudShell tools](https://docs.aws.amazon.com/cloudshell/latest/userguide/vm-specs.html) and [SAM deployment documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-deploy.html). **Current Deployment Status:** The stack is **LIVE** and verified in AWS `ap-south-1` (Mumbai).
- **Live Endpoint:** `https://4uoe20os9f.execute-api.ap-south-1.amazonaws.com`
- **DynamoDB Table:** `flowproof-ReceiptsTable-1VCD4W16SRAFG` (Active, PAY_PER_REQUEST, 7-day TTL)
- **Health Check:** `curl https://4uoe20os9f.execute-api.ap-south-1.amazonaws.com/api/health` -> `{"status":"ok","storage":"dynamodb"}`

1. Sign in to your AWS account, select **Asia Pacific (Mumbai), ap-south-1**, and open **CloudShell** from the console toolbar. CloudShell uses your signed-in AWS identity. The identity must be allowed to create CloudFormation, Lambda, HTTP API Gateway, DynamoDB, IAM roles and SAM's S3 deployment artifacts.
2. In CloudShell choose **Actions → Upload file** and select `flowproof-cloudshell.zip`.
3. Paste these commands in order:

```bash
unzip flowproof-cloudshell.zip
cd flowproof
aws --version
sam --version
node --version
```

SAM's native Node 22 build needs a Node 22 executable. If `node --version` does not start with `v22.`, install a project tool runtime:

```bash
npm install --prefix "$HOME/.flowproof-tools" node@22
export PATH="$HOME/.flowproof-tools/node_modules/node/bin:$PATH"
node --version
```

Build the frontend and copy it into the Lambda package:

```bash
cd web
npm ci
npm run build
cd ../api
npm ci
npm run prepare:web
sam validate --lint --region ap-south-1
sam build
sam deploy --guided --stack-name flowproof --region ap-south-1
```

For the guided prompts, leave **FrontendOrigin** blank, confirm the change set, allow IAM role creation, and permit the unauthenticated HTTP endpoint when SAM asks. Keep rollback enabled. Saving the configuration is optional. These commands create billable resources. The template throttles requests to an aggregate target of 5/second with burst 10 and expires receipts after seven days; these are not a hard spending cap. No access keys need to be pasted into the app or uploaded ZIP.

If `sam build` reports a Node runtime mismatch, rerun the Node 22 setup above in the current shell. If `AccessDenied` occurs, the AWS identity needs the named service permissions; changing the app code cannot fix that. If deployment fails, inspect the failed resource in the CloudFormation `flowproof` stack's Events tab before retrying.

After deployment, run these checks. The supplied measurements are **synthetic smoke data**, not the team's measured environmental result:

```bash
FLOWPROOF_URL=$(aws cloudformation describe-stacks --stack-name flowproof --region ap-south-1 --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)
printf '%s\n' "$FLOWPROOF_URL"
curl --fail --silent --show-error "$FLOWPROOF_URL/api/health" | jq -e '.status == "ok" and .storage == "dynamodb"'
curl --fail --silent --show-error "$FLOWPROOF_URL/" -o /tmp/flowproof-index.html
rg 'id="root"' /tmp/flowproof-index.html
```

If `rg` is unavailable in CloudShell, use `grep 'id="root"' /tmp/flowproof-index.html`. Open the printed HTTPS URL in your browser. Confirm the app loads with styling, submit a comparable pair, and open its receipt. In the browser's Network panel, both the page and `/api/compare` should use the printed origin.

Check API comparison and receipt retrieval:

```bash
cat > /tmp/flowproof-trial.json <<'JSON'
{
  "experimentType": "completed_task",
  "task": {"name": "Synthetic smoke test", "unitsCount": 1, "completionCriterion": "Same completed item in both smoke trials", "vesselLitres": 1},
  "baseline": {"litres": 4.2, "durationSeconds": 60, "spillage": false, "completed": true, "unitsCompleted": 1},
  "intervention": {"litres": 1.8, "durationSeconds": 70, "spillage": false, "completed": true, "unitsCompleted": 1},
  "interventionName": "Synthetic tap-off test"
}
JSON
curl --fail --silent --show-error -H 'Content-Type: application/json' --data-binary @/tmp/flowproof-trial.json "$FLOWPROOF_URL/api/compare" -o /tmp/flowproof-result.json
jq -e '.status == "accepted" and .observedDifferenceLitres == 2.4 and (.receiptId | type == "string")' /tmp/flowproof-result.json
FLOWPROOF_RECEIPT=$(jq -r '.receiptId' /tmp/flowproof-result.json)
curl --fail --silent --show-error "$FLOWPROOF_URL/api/receipts/$FLOWPROOF_RECEIPT" | jq -e '.measurementSource == "self_reported" and .claimScope == "single_pair_observation" and .experiment.baseline.completed == true and (.expiresAt | type == "number")'
```

Verify the fixed-volume control:

```bash
jq '.experimentType="fixed_volume" | .baseline.litres=1 | .intervention.litres=1 | .baseline.durationSeconds=5 | .intervention.durationSeconds=20' /tmp/flowproof-trial.json > /tmp/flowproof-control.json
curl --fail --silent --show-error -H 'Content-Type: application/json' --data-binary @/tmp/flowproof-control.json "$FLOWPROOF_URL/api/compare" | jq -e '.status == "accepted" and .observedDifferenceLitres == 0'
```

For an update, upload a fresh source ZIP, rebuild the frontend, run `npm run prepare:web`, then `sam build` and `sam deploy`. The DynamoDB table remains in the stack. Keep the deployed URL for the hackathon demo. When you intend to remove the deployment and its receipt data, run `sam delete --stack-name flowproof --region ap-south-1` and review its prompts.
