// orchestrator/dispatcher.js
const uiEngine = require('./engines/uiEngine');
const apiEngine = require('./engines/apiEngine');
const dbEngine = require('./engines/dbEngine');

async function handlePrompt(prompt) {
  if (prompt.includes('UI')) {
    return await uiEngine.run(prompt);   // call real Selenium demo
  } else if (prompt.includes('API')) {
    return await apiEngine.run(prompt);  // still stubbed for now
  } else if (prompt.includes('DB')) {
    return await dbEngine.run(prompt);   // still stubbed for now
  }
  return { engine: 'unknown', status: 'skipped', output: 'No matching engine' };
}

module.exports = { handlePrompt };