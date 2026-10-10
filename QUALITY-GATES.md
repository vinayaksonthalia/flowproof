# FlowProof release gates

This is the working checklist for the hackathon build. A check means it was actually tested; it is not a prediction of judging results.

## 1. Experiment integrity

- [x] Fixed-volume control produces zero when the same output is collected at different speeds.
- [x] Completed-task result preserves a negative outcome when the changed habit uses more water.
- [x] Missing completion, mismatched item count and spillage prevent an accepted comparison.
- [x] One pair is labeled self-reported; no annual or household savings extrapolation.
- [x] Guided timer and marked-vessel tally work end to end and are shown on the receipt in a local browser test.
- [ ] Real filmed pair of comparable physical trials is recorded and checked by the team.

## 2. Experience

- [x] Responsive setup, measurement and receipt routes work locally.
- [x] Fixed target is generated from the declared vessel capacity.
- [x] Saved receipt visibly shows finish line and trial quality checks.
- [ ] A first-time tester completes both trials using only FlowProof and a marked container.
- [ ] Instrument and transitions communicate the A/B relationship without implying certified measurement.
- [x] The 320 px mobile layout was visually checked through setup and measurement.
- [ ] Keyboard-only and reduced-motion passes are checked after final changes.

## 3. Engineering and security

- [x] Frontend production build and current API test suite pass.
- [x] SAM template validates and builds locally.
- [x] Receipt reads enforce seven-day expiry; writes copy only named fields.
- [x] Content-Type and request size checks reject malformed writes.
- [x] Recorder arithmetic contract and 18 API tests pass after integration.
- [ ] Production bundle is rebuilt from final source and extraction checked.
- [ ] AWS deployment, DynamoDB persistence and public HTTPS receipt retrieval are tested.

## 4. Submission

- [ ] Three-minute video uses actual readings and shows the AWS endpoint.
- [ ] Teammate independently checks the raw measurement footage and numbers.
- [ ] Submission description, repository link and video are final and consistent.
