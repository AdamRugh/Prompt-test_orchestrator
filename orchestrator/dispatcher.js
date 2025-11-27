// orchestrator/dispatcher.js
const uiEngine = require('./engines/uiEngine');
const apiEngine = require('./engines/apiEngine');
// const dbEngine = require('./engines/dbEngine');
const actions = require('./engines/actions.json'); // load recipes

function detectScenario(prompt) {
  for (const key of Object.keys(actions)) {
    if (prompt.toLowerCase().includes(key.toLowerCase())) {
      return key;
    }
  }
  return null;
}

async function handlePrompt(prompt) {
  // UI prompts (URLs or "UI" keyword)
  if (prompt.includes('UI') || prompt.match(/https?:\/\/\S+/)) {
    const scenario = detectScenario(prompt);

    if (scenario) {
      // Run recipe from actions.json
      return await uiEngine.runRecipe(prompt, actions[scenario]);
    } else {
      // Fallback: dynamic handlers
      if (prompt.toLowerCase().includes('checkbox')) {
        return await uiEngine.handleCheckboxes(prompt);
      }
      // Add more dynamic handlers here (e.g. handleForms, handleLogin)
      return { engine: 'ui', status: 'skipped', prompt, output: 'No recipe or dynamic handler found' };
    }
  }

  // API prompts
  if (prompt.includes('API')) {
    return await apiEngine.run(prompt);
  }

  // DB prompts
  if (prompt.includes('DB')) {
    return await dbEngine.run(prompt);
  }

  // Unknown
  return { engine: 'unknown', status: 'skipped', prompt, output: 'No matching engine' };
}

module.exports = { handlePrompt };