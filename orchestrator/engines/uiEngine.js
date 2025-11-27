const { Builder, By } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const actions = require('./actions.json');

// Import element handlers
const checkboxes = require('../selectors/checkboxes');
const textboxes = require('../selectors/textboxes');
const radios = require('../selectors/radioButtons');
const dropdowns = require('../selectors/dropdowns');

function extractUrl(prompt) {
  const match = prompt.match(/https?:\/\/\S+/);
  return match ? match[0] : null;
}

function detectScenario(prompt) {
  for (const key of Object.keys(actions)) {
    if (prompt.toLowerCase().includes(key.toLowerCase())) return key;
  }
  return null;
}

// 🔑 Helper: build driver
function buildDriver() {
  const service = new edge.ServiceBuilder('C:\\tools\\msedgedriver.exe'); // adjust path
  return new Builder().forBrowser('MicrosoftEdge').setEdgeService(service).build();
}

// Default run
async function run(prompt) {
  let driver;
  try {
    const url = extractUrl(prompt);
    if (!url) return { engine: 'selenium', status: 'error', prompt, output: 'No URL found in prompt' };

    driver = buildDriver();
    await driver.get(url);

    const scenario = detectScenario(prompt);
    if (!scenario) {
      const title = await driver.getTitle();
      return { engine: 'selenium', status: 'success', prompt, output: `Page loaded. Title: ${title}` };
    }

    return await runRecipe(driver, prompt, actions[scenario]);
  } catch (err) {
    console.error("run error:", err);
    return { engine: 'selenium', status: 'error', prompt, output: err.message || 'Unknown error in run' };
  } finally {
    if (driver) await driver.quit();
  }
}

// Run a recipe
async function runRecipe(driver, prompt, recipe) {
  try {
    let lastOutput = '';
    for (const step of recipe) {
      switch (step.action) {
        case 'type':
          await driver.findElement(By.css(step.selector)).sendKeys(step.value);
          break;
        case 'click':
          await driver.findElement(By.css(step.selector)).click();
          break;
        case 'read':
          lastOutput = await driver.findElement(By.css(step.selector)).getText();
          break;
      }
      await driver.sleep(500);
    }
    return { engine: 'selenium', status: 'success', prompt, output: `Recipe executed. Output: ${lastOutput}` };
  } catch (err) {
    console.error("runRecipe error:", err);
    return { engine: 'selenium', status: 'error', prompt, output: err.message || 'Unknown error in recipe' };
  }
}

// Unified dispatcher
async function handlePrompt(prompt, value = '') {
  let driver;
  try {
    const url = extractUrl(prompt);
    if (!url) {
      return { engine: 'selenium', status: 'error', prompt, output: 'No URL found in prompt' };
    }

    driver = buildDriver();
    await driver.get(url);

    const lowerPrompt = prompt.toLowerCase();
    let result;

    console.log("handlePrompt: received prompt =", prompt);

    if (lowerPrompt.includes("check") || lowerPrompt.includes("tick")) {
      console.log("Routing to checkbox handler");
      result = await checkboxes.handle(driver, prompt);
    } else if (lowerPrompt.includes("enter") || lowerPrompt.includes("type")) {
      console.log("Routing to textbox handler");
      const success = await textboxes.enterTextByLabel(driver, prompt, value);
      result = success ? 'Textbox input complete' : 'Textbox not found';
    } else if (lowerPrompt.includes("radio") || lowerPrompt.includes("choose")) {
      console.log("Routing to radio handler");
      const success = await radios.selectRadioByLabel(driver, prompt);
      result = success ? 'Radio selection complete' : 'Radio not found';
    } else if (lowerPrompt.includes("dropdown") || lowerPrompt.includes("option")) {
      console.log("Routing to dropdown handler");
      result = await dropdowns.handle(driver, prompt, value);
    } else {
      result = 'No matching handler found';
    }

    // ✅ Ensure result is always a string
    if (!result) result = 'Handler returned no output';

    return { engine: 'selenium', status: 'success', prompt, output: result };
  } catch (err) {
    console.error("handlePrompt error:", err);
    return { engine: 'selenium', status: 'error', prompt, output: err.message || 'Unknown error in handlePrompt' };
  } finally {
    if (driver) await driver.quit();
  }
}

module.exports = { run, runRecipe, handlePrompt };