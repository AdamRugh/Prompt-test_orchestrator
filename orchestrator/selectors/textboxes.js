const { By, until } = require('selenium-webdriver');
const helpers = require('./generic');

module.exports = {
  async getTextboxes(driver) {
    const inputs = await driver.findElements(By.css("input[type='text'], textarea"));
    console.log("Discovered textboxes:", inputs.length);
    return inputs;
  },

  async enterTextByLabel(driver, labelText, value, timeout = 5000) {
    const inputs = await this.getTextboxes(driver);
    for (const input of inputs) {
      try {
        // Try parent text
        const parent = await input.findElement(By.xpath(".."));
        let text = await parent.getText();

        // If empty, try sibling spans/divs
        if (!text) {
          const siblings = await parent.findElements(By.xpath(".//span|.//div|.//label"));
          for (const sib of siblings) {
            const sibText = await sib.getText();
            if (sibText) {
              text = sibText;
              break;
            }
          }
        }

        console.log("Textbox discovered label:", text);

        if (text && text.toLowerCase().includes(labelText.toLowerCase())) {
          await helpers.scrollIntoView(driver, input);
          await driver.wait(until.elementIsVisible(input), timeout);
          await driver.wait(until.elementIsEnabled(input), timeout);
          await input.clear();
          await input.sendKeys(value);
          console.log(`Entered text "${value}" into textbox with label "${text}"`);
          return true;
        }
      } catch (err) {
        console.warn("Textbox label discovery failed:", err.message);
      }
    }
    console.log("No textbox matched label:", labelText);
    return false;
  }
};