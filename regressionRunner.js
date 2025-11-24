const { getRuns, saveRun, getBaselines } = require('./db');
// If you want to hit the live server endpoints later, you can import app here
// const app = require('./server');

async function replayRuns() {
  const runs = getRuns();
  const baselines = getBaselines();
  console.log(`Replaying ${runs.length} saved runs against ${baselines.length} baselines...`);

  let passed = 0;
  let failed = 0;
  let changed = 0;
  let noBaseline = 0;

  for (const run of runs) {
    try {
      // Replace this stub with your orchestrator call
      const replayResult = `Replayed prompt: ${run.prompt}`;

      // Save replay as a new run
      const newRun = saveRun(run.prompt, 'replayed', replayResult);

      // Find baseline for this prompt
      const baseline = baselines.find(b => b.prompt === run.prompt);

      if (baseline) {
        if (newRun.result === baseline.expected_result) {
          console.log(`✅ Run ${run.id} → replayed as ${newRun.id} (matches baseline)`);
          passed++;
        } else {
          console.warn(`⚠️ Run ${run.id} → replayed as ${newRun.id} (drift from baseline)`);
          console.warn(`   Baseline: ${baseline.expected_result}`);
          console.warn(`   Replay:   ${newRun.result}`);
          changed++;
        }
      } else {
        console.warn(`ℹ️ Run ${run.id} → replayed as ${newRun.id} (no baseline defined)`);
        noBaseline++;
      }
    } catch (err) {
      console.error(`❌ Run ${run.id} failed: ${err.message}`);
      failed++;
    }
  }

  // Summary object
  const summary = {
    total: runs.length,
    baselines: baselines.length,
    passed,
    changed,
    failed,
    noBaseline,
  };

  // Summary report
  console.log('\n--- Regression Summary ---');
  console.log(`Total runs: ${summary.total}`);
  console.log(`Baselines: ${summary.baselines}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Changed: ${summary.changed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`No baseline: ${summary.noBaseline}`);

  return summary;
}

// Allow both CLI and Jest usage
if (require.main === module) {
  replayRuns().then(summary => {
    // Exit with non‑zero code if regressions or failures are detected
    if (summary.changed > 0 || summary.failed > 0) {
      process.exitCode = 1;
    }
  });
}

module.exports = { replayRuns };