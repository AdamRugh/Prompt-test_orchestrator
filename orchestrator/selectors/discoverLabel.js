// discoverLabel.js
// Generic utility for discovering label text near an element

const { By } = require('selenium-webdriver');

async function discoverLabel(element) {
  let labelText = "";

  try {
    // 1. Try parent text
    const parent = await element.findElement(By.xpath(".."));
    labelText = await parent.getText();

    // 2. If empty, try sibling spans/divs/labels
    if (!labelText) {
      const siblings = await parent.findElements(By.xpath(".//span|.//div|.//label"));
      for (const sib of siblings) {
        const sibText = await sib.getText();
        if (sibText) {
          labelText = sibText;
          break;
        }
      }
    }

    // 3. If still empty, try aria-label or title attributes
    if (!labelText) {
      const aria = await element.getAttribute("aria-label");
      const title = await element.getAttribute("title");
      labelText = aria || title || "";
    }
  } catch (err) {
    console.warn("discoverLabel failed:", err.message);
  }

  return labelText.trim();
}

module.exports = { discoverLabel };