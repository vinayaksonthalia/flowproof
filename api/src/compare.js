const validText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 500;
const positiveNumber = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const result = (status, reasons, difference = null) => ({status, observedDifferenceLitres: difference, reasons, receiptId: null});

/** Pure deterministic comparison. A task describes the standard shared by both trials;
 * completion and collection are self-reported, and are never independently certified. */
export function compareExperiment(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result('rejected', ['Provide an experiment object.']);
  const reasons = [];
  if (!['fixed_volume', 'completed_task'].includes(input.experimentType)) reasons.push('Choose fixed volume or completed task.');
  const task = input.task;
  if (!task || typeof task !== 'object' || Array.isArray(task)) reasons.push('Provide the shared task definition.');
  else {
    if (!validText(task.name)) reasons.push('Provide a task name (up to 500 characters).');
    if (!Number.isSafeInteger(task.unitsCount) || task.unitsCount <= 0) reasons.push('Task item count must be a positive whole number.');
    if (!validText(task.completionCriterion)) reasons.push('Provide the completion standard used in both trials.');
    if (!positiveNumber(task.vesselLitres)) reasons.push('Measuring vessel capacity must be a positive number in litres.');
  }
  if (!validText(input.interventionName)) reasons.push('Describe the tested change (up to 500 characters).');
  for (const name of ['baseline', 'intervention']) {
    const trial = input[name];
    if (!trial || typeof trial !== 'object' || Array.isArray(trial)) { reasons.push(`Provide the ${name} trial.`); continue; }
    if (!positiveNumber(trial.litres)) reasons.push(`${name} water volume must be a positive finite number in litres.`);
    if (!positiveNumber(trial.durationSeconds)) reasons.push(`${name} duration must be a positive finite number in seconds.`);
    if (input.experimentType === 'completed_task') {
      if (trial.completed !== true) reasons.push(`Confirm that ${name} met the shared completion standard.`);
      if (!Number.isSafeInteger(trial.unitsCompleted) || trial.unitsCompleted <= 0) reasons.push(`Provide the completed item count for ${name}.`);
      else if (trial.unitsCompleted !== task?.unitsCount) reasons.push(`${name} completed item count differs from the shared task; repeat the same number of items.`);
    }
    if (typeof trial.spillage !== 'boolean') reasons.push(`State whether water was spilled or missed during ${name}.`);
    else if (trial.spillage) reasons.push(`Water was spilled or missed during ${name}; repeat the trial with complete collection.`);
  }
  if (reasons.length) return result('rejected', reasons);
  if (input.experimentType === 'fixed_volume') {
    const target = task.vesselLitres * task.unitsCount;
    // Capacity is the known fixed output in the control, not a flow-rate estimate.
    // Millilitre tolerance accommodates decimal input without creating a saving claim.
    if (!Number.isFinite(target) || Math.abs(input.baseline.litres - target) > 0.001 || Math.abs(input.intervention.litres - target) > 0.001) {
      return result('uncertain', ['The fixed-volume trials do not both match the declared output volume. Check the target and repeat with the same final fill.']);
    }
    return result('accepted', ['Both trials filled the same fixed output. Changing filling time or flow does not reduce that volume.', 'Volumes and task completion are self-reported.'], 0);
  }
  const rawDifference = input.baseline.litres - input.intervention.litres;
  const difference = Number(rawDifference.toFixed(1));
  const finding = difference > 0 ? 'The intervention used less collected water for this pair of trials.' : difference < 0 ? 'The intervention used more collected water for this pair of trials.' : rawDifference === 0 ? 'The collected water volumes were equal for this pair of trials.' : 'The measured difference is smaller than the displayed 0.1 litre precision; repeat the experiment before drawing a conclusion.';
  return result('accepted', [finding, 'The displayed difference is rounded to 0.1 litre; this is a display precision, not a guarantee of measurement accuracy.', 'This comparison assumes both trials met the shared task and completion standard. These conditions and volumes are self-reported.', 'One pair of trials does not establish typical or long-term savings.'], Object.is(difference, -0) ? 0 : difference);
}

/** Copy only the public experiment schema. Never persist arbitrary request metadata. */
export function canonicalExperiment(input) {
  const trial = value => ({litres: value.litres, durationSeconds: value.durationSeconds, spillage: value.spillage, ...(typeof value.completed === 'boolean' ? {completed: value.completed} : {}), ...(Number.isSafeInteger(value.unitsCompleted) ? {unitsCompleted: value.unitsCompleted} : {})});
  return {experimentType: input.experimentType, task: {name: input.task.name, unitsCount: input.task.unitsCount, completionCriterion: input.task.completionCriterion, vesselLitres: input.task.vesselLitres}, baseline: trial(input.baseline), intervention: trial(input.intervention), interventionName: input.interventionName};
}
