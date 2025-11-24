const dispatcher = require('./orchestrator/dispatcher');
const persistence = require('./orchestrator/persistence');

describe('Regression Runner', () => {
  beforeEach(() => {
  process.env.DB_PATH = ':memory:';

  const uiId = persistence.savePrompt('Run UI login test');
  persistence.saveResult(uiId, {
    engine: 'selenium',
    status: 'completed',
    output: 'UI test executed'
  });
  persistence.saveBaseline('Run UI login test', 'UI test executed');

  const apiId = persistence.savePrompt('Run API health check');
  persistence.saveResult(apiId, {
    engine: 'node-api',
    status: 'completed',
    output: 'API test executed'
  });
  persistence.saveBaseline('Run API health check', 'API test executed');

  const dbId = persistence.savePrompt('Run DB migration test');
  persistence.saveResult(dbId, {
    engine: 'python-db',
    status: 'completed',
    output: 'DB test executed'
  });
  persistence.saveBaseline('Run DB migration test', 'DB test executed');
});


  test('detects no regressions when replay matches baseline', async () => {
    const runs = persistence.getRuns();
    const run = runs[0];

    const result = await dispatcher.handlePrompt(run.prompt);
    const baseline = persistence.getBaseline(run.prompt);

    expect(baseline).not.toBeNull();
    expect(result.output).toBe(baseline);
  });

  test('flags regressions when replay output changes', () => {
    const runs = persistence.getRuns();
    const run = runs[0];

    // Simulate replay producing different output
    const newId = persistence.savePrompt(run.prompt);
    persistence.saveResult(newId, {
      engine: run.engine,
      status: 'replayed',
      output: 'Different output'
    });

    const newRun = persistence.getRuns().find(r => r.id === newId);
    expect(newRun.output).not.toBe(persistence.getBaseline(run.prompt));
  });

  test('replayRuns summary reports counts correctly', async () => {
    const runs = persistence.getRuns();
    let summary = {
      passed: 0,
      changed: 0,
      failed: 0,
      noBaseline: 0,
      baselines: 0
    };

    for (const run of runs) {
      const result = await dispatcher.handlePrompt(run.prompt);
      const baseline = persistence.getBaseline(run.prompt);

      if (!baseline) {
        summary.noBaseline++;
        continue;
      }

      summary.baselines++;
      if (result.output === baseline) {
        summary.passed++;
      } else {
        summary.changed++;
      }
    }

    expect(summary).toHaveProperty('passed');
    expect(summary).toHaveProperty('changed');
    expect(summary).toHaveProperty('failed');
    expect(summary).toHaveProperty('noBaseline');
    expect(
      summary.passed + summary.changed + summary.failed + summary.noBaseline
    ).toBeLessThanOrEqual(runs.length);
  });

  test('all runs should match golden baselines (drift only)', async () => {
    const runs = persistence.getRuns();
    let summary = { changed: 0, failed: 0, baselines: 0 };

    for (const run of runs) {
      const result = await dispatcher.handlePrompt(run.prompt);
      const baseline = persistence.getBaseline(run.prompt);

      if (baseline) {
        summary.baselines++;
        if (result.output !== baseline) {
          summary.changed++;
        }
      }
    }

    expect(summary.changed).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.baselines).toBeGreaterThan(0);
  });
});