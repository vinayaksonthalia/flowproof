# FlowProof: three-minute demo plan

Use actual measurements and clips recorded during the hackathon. Replace `X` and `Y` below only after checking the raw footage and jug markings. The app's receipts are self-reported records, not independent verification.

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:20 | A tap, basin, jug, and two comparable items. | “A slower tap sounds like a water-saving tip. But if you fill the same bottle, the volume cannot change. We built FlowProof to test the actual litres used to finish one task.” |
| 0:20–0:45 | The fixed-volume control clips: same marked fill line, different fill times. Enter the two readings. | “First, our control: same one-litre target, different flow. FlowProof reports zero litres saved. This prevents a misleading flow-rate claim.” |
| 0:45–1:20 | Define one completed task and one changed habit in FlowProof. Show the finish line, item count, vessel size and spillage checks. | “For the useful test, we compare the same completed task. We change only one habit: turn the tap off while scrubbing.” |
| 1:20–1:55 | Short uncut excerpts from baseline and intervention recording, including final jug reading and finished items. | “We caught all tap water in the basin. The baseline was X litres; the changed-habit trial was Y litres. Here are the readings and the completed items.” |
| 1:55–2:25 | Enter X and Y, submit, show result vessel animation and receipt. If trial failed, show rejection and rerun. | “FlowProof checks completion, item counts, fixed-volume logic, and water lost outside collection. In this pair it observed X minus Y litres. This is one observation, not a household projection.” |
| 2:25–2:45 | Open saved HTTPS receipt link in a fresh browser tab. Show timestamp, values, finish line and self-report disclaimer. | “The link gives someone else the measurements, comparison checks, and limitations for seven days.” |
| 2:45–3:00 | Brief architecture card or AWS console, then landing page. | “API Gateway receives the request, Lambda validates the comparison and serves the app, and DynamoDB holds the short-lived receipt. The point is a decision based on measured work, with uncertainty visible.” |

## Recording checklist

- Keep the raw clips. Film the jug marking and completed task clearly enough for a judge to check.
- Use different but comparable items only if you can defend the same amount of work; identical or matched items are stronger.
- If either trial spills or misses the finish line, show the rejection and repeat the physical test.
- Capture the *deployed AWS URL* in the final video. A localhost screen does not establish AWS deployment.
- Avoid saying that the app verifies footage, measures water automatically, proves causation, or predicts annual savings.
- Mask home addresses, people's faces, or any private detail in the shared receipt and clips.

