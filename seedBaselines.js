const { saveBaseline } = require('./db');

function seed() {
  // Define your golden baselines
  saveBaseline('Hello, test prompt', 'Replayed prompt: Hello, test prompt');
  saveBaseline('Login to app', 'Replayed prompt: Login to app');
  saveBaseline('Ensure run exists', 'Replayed prompt: Ensure run exists');

  console.log('✅ Baselines seeded successfully');
}

seed();