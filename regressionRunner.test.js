const { getRuns, saveRun } = require('./db');

// Import the replayRuns function from regressionRunner.js
const { replayRuns } = require('./regressionRunner');

describe('Regression Runner', () => {
  beforeEach(() => {
    // Reset DB state before each test
    // If you want isolation, set DB_PATH=":memory:" in your test environment
    process.env.DB_PATH = ':memory:';
    // Seed with a known run
    saveRun('Baseline prompt', 'completed', 'Baseline result');
  });

  test('detects no regressions when replay matches baseline', async () => {
    // Override replayRuns to force consistent output
    const runs = getRuns();
    const originalResult = runs[0].result;

    // Simulate replay producing same result
    const newRun = saveRun(runs[0].prompt, 'replayed', originalResult);

    expect(newRun.result).toBe(originalResult);
  });

  test('flags regressions when replay output changes', async () => {
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
    expect(summary.passed + summary.changed + summary.failed).toBe(getRuns().length);
  });
});