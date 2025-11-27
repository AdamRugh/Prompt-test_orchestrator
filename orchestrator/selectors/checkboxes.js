const { By, until } = require('selenium-webdriver');
const helpers = require('./generic');

module.exports = {
  // Expand collapsed nodes until target label is visible
  async expandUntilVisible(driver, targetLabel) {
    let attempts = 0;
    while (attempts < 5) {
      const titles = await driver.findElements(By.css("span.rct-title"));
      for (const title of titles) {
        const text = (await title.getText()).toLowerCase();
        if (text.includes(targetLabel.toLowerCase())) {
          console.log(`Target "${targetLabel}" is visible`);
          return true;
        }
      }

      // Expand any collapsed nodes
      const collapsedButtons = await driver.findElements(By.css("button.rct-collapse"));
      let expandedAny = false;
      for (const btn of collapsedButtons) {
        const icon = await btn.findElement(By.css("svg"));
        const iconClass = await icon.getAttribute("class");
        if (iconClass.includes("expand-close")) { // collapsed state
          await helpers.scrollIntoView(driver, btn);
          await driver.wait(until.elementIsVisible(btn), 3000);
          await btn.click();
          console.log("Expanded a collapsed node");
          await driver.sleep(500);
          expandedAny = true;
        }
      }

      if (!expandedAny) break; // nothing left to expand
      attempts++;
    }
    return false;
  },

  // Build a map of checkbox labels -> visible elements
  async getCheckboxMap(driver) {
    const map = {};
    const titles = await driver.findElements(By.css("span.rct-title"));
    console.log("Discovered titles:", titles.length);

    for (const title of titles) {
      try {
        const text = await title.getText();
        if (text) {
          const checkboxSpan = await title.findElement(By.xpath("../span[@class='rct-checkbox']"));
          map[text.toLowerCase()] = checkboxSpan;
        }
      } catch (err) {
        console.warn("Checkbox title discovery failed:", err.message);
      }
    }

    console.log("Discovered checkbox labels:", Object.keys(map));
    return map;
  },

  // Handle checkbox interactions based on prompt
  async handle(driver, prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Split prompt into multiple requested labels
    const requestedLabels = lowerPrompt.split(/\s+and\s+|\s*,\s*/).map(l => l.trim()).filter(Boolean);

    let checkboxMap = await this.getCheckboxMap(driver);

    let clickedLabels = [];
    for (const req of requestedLabels) {
      // Expand until requested label is visible
      const visible = await this.expandUntilVisible(driver, req);
      if (!visible) {
        console.log(`Target "${req}" not found`);
        continue;
      }

      // Rebuild map after expansion
      checkboxMap = await this.getCheckboxMap(driver);

      // Click target
      for (const [label, checkboxSpan] of Object.entries(checkboxMap)) {
        if (label.includes(req)) {
          console.log(`Clicking checkbox for label: ${label}`);
          await helpers.scrollIntoView(driver, checkboxSpan);
          await driver.wait(until.elementIsVisible(checkboxSpan), 3000);

          // ✅ Check if already selected
          const icon = await checkboxSpan.findElement(By.css("svg"));
          const iconClass = await icon.getAttribute("class");
          if (!iconClass.includes("rct-icon-check")) {
            await checkboxSpan.click();
            console.log(`Checkbox "${label}" selected`);
          } else {
            console.log(`Checkbox "${label}" already selected`);
          }

          await driver.sleep(300);
          clickedLabels.push(label);
        }
      }
    }

    // Fallback: click all if nothing matched
    if (clickedLabels.length === 0) {
      console.log("No specific label matched, clicking all checkboxes");
      for (const [label, checkboxSpan] of Object.entries(checkboxMap)) {
        await helpers.scrollIntoView(driver, checkboxSpan);
        await driver.wait(until.elementIsVisible(checkboxSpan), 3000);

        const icon = await checkboxSpan.findElement(By.css("svg"));
        const iconClass = await icon.getAttribute("class");
        if (!iconClass.includes("rct-icon-check")) {
          await checkboxSpan.click();
          console.log(`Checkbox "${label}" selected`);
        } else {
          console.log(`Checkbox "${label}" already selected`);
        }

        await driver.sleep(300);
      }
    }

    return 'Checkbox handling complete';
  }
};