const { Builder } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');

async function run(prompt) {
  let driver;
  try {
    const service = new edge.ServiceBuilder('C:\\tools\\msedgedriver.exe'); // your path

    driver = new Builder()
      .forBrowser('MicrosoftEdge')
      .setEdgeService(service)
      .build();

    await driver.get('https://example.com');
    const title = await driver.getTitle();

    return {
      engine: 'selenium',
      status: 'success',
      prompt,
      output: `✅ Edge launched, navigated to example.com, title was: ${title}`
    };
  } catch (err) {
    return { engine: 'selenium', status: 'error', prompt, output: err.message };
  } finally {
    if (driver) await driver.quit();
  }
}

module.exports = { run };