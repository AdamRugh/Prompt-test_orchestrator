const { By, until } = require('selenium-webdriver');
const helpers = require('./generic');

module.exports = {
  // Handle native <select> dropdowns
  async getNativeDropdowns(driver) {
    const dropdowns = await driver.findElements(By.css("select"));
    console.log("Discovered native <select> dropdowns:", dropdowns.length);
    return dropdowns;
  },

  async selectOptionByLabel(driver, labelText, value, timeout = 5000) {
    const dropdowns = await this.getNativeDropdowns(driver);
    for (const dropdown of dropdowns) {
      try {
        const parent = await dropdown.findElement(By.xpath(".."));
        const text = await parent.getText();
        console.log("Native dropdown parent label:", text);

        if (text && text.toLowerCase().includes(labelText.toLowerCase())) {
          await helpers.scrollIntoView(driver, dropdown);
          await driver.wait(until.elementIsVisible(dropdown), timeout);
          await driver.wait(until.elementIsEnabled(dropdown), timeout);

          const options = await dropdown.findElements(By.css("option"));
          console.log("Discovered native dropdown options:", await Promise.all(options.map(o => o.getText())));

          for (const option of options) {
            const optText = await option.getText();
            if (optText.toLowerCase().includes(value.toLowerCase())) {
              await option.click();
              console.log(`Selected native dropdown option: ${optText}`);
              return true;
            }
          }
        }
      } catch (err) {
        console.warn("Native dropdown discovery failed:", err.message);
      }
    }
    console.log("No native dropdown matched label:", labelText);
    return false;
  },

  // Handle custom dropdowns (div/ul based)
  async selectCustomDropdown(driver, labelText, value, timeout = 5000) {
    try {
      const triggers = await driver.findElements(By.xpath(
        `//div[contains(@class,'dropdown') or contains(@role,'listbox')]`
      ));
      console.log("Discovered custom dropdown triggers:", triggers.length);

      for (const trigger of triggers) {
        const text = await trigger.getText();
        console.log("Custom dropdown trigger label:", text);

        if (text && text.toLowerCase().includes(labelText.toLowerCase())) {
          await helpers.scrollIntoView(driver, trigger);
          await driver.wait(until.elementIsVisible(trigger), timeout);
          await trigger.click();
          await driver.sleep(300);

          const options = await driver.findElements(By.xpath(
            "//li | //div[contains(@class,'option')]"
          ));
          console.log("Discovered custom dropdown options:", await Promise.all(options.map(o => o.getText())));

          for (const option of options) {
            const optText = await option.getText();
            if (optText && optText.toLowerCase().includes(value.toLowerCase())) {
              await helpers.scrollIntoView(driver, option);
              await driver.wait(until.elementIsVisible(option), timeout);
              await option.click();
              console.log(`Selected custom dropdown option: ${optText}`);
              return true;
            }
          }
        }
      }
    } catch (err) {
      console.warn("Custom dropdown discovery failed:", err.message);
    }
    console.log("No custom dropdown matched label:", labelText);
    return false;
  },

  // Unified handler: try native first, then custom
  async handle(driver, prompt, value) {
    const lowerPrompt = prompt.toLowerCase();

    console.log("Dropdown handler received prompt:", prompt, "value:", value);

    const nativeSuccess = await this.selectOptionByLabel(driver, lowerPrompt, value);
    if (nativeSuccess) return 'Dropdown selection complete (native)';

    const customSuccess = await this.selectCustomDropdown(driver, lowerPrompt, value);
    if (customSuccess) return 'Dropdown selection complete (custom)';

    return 'Dropdown not found';
  }
};