const { By, until } = require('selenium-webdriver');
const helpers = require('./generic');

module.exports = {
  async getRadioButtons(driver) {
    const radios = await driver.findElements(By.css("input[type='radio']"));
    console.log("Discovered radio buttons:", radios.length);
    return radios;
  },

  async selectRadioByLabel(driver, labelText, timeout = 5000) {
    const radios = await this.getRadioButtons(driver);
    for (const radio of radios) {
      try {
        // Try parent text
        const parent = await radio.findElement(By.xpath(".."));
        let text = await parent.getText();

        // If empty, try sibling spans/divs/labels
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

        console.log("Radio discovered label:", text);

        if (text && text.toLowerCase().includes(labelText.toLowerCase())) {
          await helpers.scrollIntoView(driver, radio);
          await driver.wait(until.elementIsVisible(radio), timeout);
          await driver.wait(until.elementIsEnabled(radio), timeout);
          await radio.click();
          console.log(`Selected radio button with label "${text}"`);
          return true;
        }
      } catch (err) {
        console.warn("Radio label discovery failed:", err.message);
      }
    }
    console.log("No radio matched label:", labelText);
    return false;
  }
};