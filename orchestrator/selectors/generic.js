const { until } = require('selenium-webdriver');

module.exports = {
  // Scroll element into view
  async scrollIntoView(driver, element) {
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", element);
  },

  // Scroll, wait until visible, then click
  async scrollAndClick(driver, element, timeout = 5000) {
    await this.scrollIntoView(driver, element);
    try {
      await driver.wait(until.elementIsVisible(element), timeout);
      await driver.wait(until.elementIsEnabled(element), timeout);
      await element.click();
    } catch (err) {
      throw new Error(`Failed to click element: ${err.message}`);
    }
  },

  // Scroll, wait until visible, then type text
  async scrollAndType(driver, element, text, timeout = 5000) {
    await this.scrollIntoView(driver, element);
    try {
      await driver.wait(until.elementIsVisible(element), timeout);
      await driver.wait(until.elementIsEnabled(element), timeout);
      await element.clear();
      await element.sendKeys(text);
    } catch (err) {
      throw new Error(`Failed to type into element: ${err.message}`);
    }
  }
};