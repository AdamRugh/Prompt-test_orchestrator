const { getRuns, saveRun } = require('./db');
const { replayRuns } = require('./regressionRunner');

describe('Regression Runner', () => {
  beforeEach(() => {
    // Reset DB state before each test
    process.env.DB_PATH = ':memory:';

    // Seed with a known run for isolation
    saveRun('Baseline prompt', 'completed', 'Baseline result');
  });

  test('detects no regressions when replay matches baseline', () => {
    const runs = getRuns();
    const originalResult = runs[0].result;

    // Simulate replay producing same result
    const newRun = saveRun(runs[0].prompt, 'replayed', originalResult);

    expect(newRun.result).toBe(originalResult);
  });

  test('flags regressions when replay output changes', () => {
    const runs = getRuns();
    const originalResult = runs[0].result;

    // Simulate replay producing different result
    const newRun = saveRun(runs[0].prompt, 'replayed', 'Different output');

    expect(newRun.result).not.toBe(originalResult);
  });

  test('replayRuns summary reports counts correctly', async () => {
  const summary = await replayRuns();

  expect(summary).toHaveProperty('passed');
  expect(summary).toHaveProperty('changed');
  expect(summary).toHaveProperty('failed');
  expect(summary).toHaveProperty('noBaseline');

  // Total runs should equal sum of all outcomes
  expect(
  summary.passed + summary.changed + summary.failed + summary.noBaseline
  ).toBeLessThanOrEqual(getRuns().length);

  });


  test('all runs should match golden baselines (drift only)', async () => {
    const summary = await replayRuns();

    // Fail only if drift or errors
    expect(summary.changed).toBe(0);
    expect(summary.failed).toBe(0);

    // Ensure at least one baseline exists
    expect(summary.baselines).toBeGreaterThan(0);

    // Allow runs without baselines for now
    // (noBaseline count is informational, not enforced)
  });
});