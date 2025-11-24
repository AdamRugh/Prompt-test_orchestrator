const { saveBaseline } = require('./db');

function seed() {
  // Existing stubbed baselines
  saveBaseline('Hello, test prompt', 'Replayed prompt: Hello, test prompt');
  saveBaseline('Login to app', 'Replayed prompt: Login to app');
  saveBaseline('Ensure run exists', 'Replayed prompt: Ensure run exists');

  // 🔑 UI demo baseline
  saveBaseline(
    'Run UI login test',
    '✅ Edge launched, navigated to example.com, title was: Example Domain'
  );

  console.log('✅ Baselines seeded successfully');
}

seed();