const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const imagesFolder = path.join(__dirname, "savedImages"); // Save images in "savedImages"
if (!fs.existsSync(imagesFolder)) {
  fs.mkdirSync(imagesFolder);
  console.log("Created folder: savedImages");
}

const getIncrementedFilename = (basePath, baseName, extension) => {
  let counter = 1;
  let filename = `${baseName}-${counter}.${extension}`;
  while (fs.existsSync(path.join(basePath, filename))) {
    counter++;
    filename = `${baseName}-${counter}.${extension}`;
  }
  return path.join(basePath, filename);
};

app.get("/capture-chart", async (req, res) => {
    const { coin } = req.query; // Get the coin query parameter
    if (!coin) {
      // Return null if no token is provided
      return res.status(200).json({ message: "No token provided.", data: null });
    }
  
    const tradingUrl = `https://app.hyperliquid.xyz/trade/${coin}`; // Dynamically include the token
  
    try {
      console.log(`Navigating to: ${tradingUrl}`);
  
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 900 });
  
      // Navigate to the trading page for the specified coin
      await page.goto(tradingUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  
      await delay(20000);
      const iframeElement = await page.waitForSelector("iframe[id^='tradingview']", { timeout: 60000 });
      const frame = await iframeElement.contentFrame();
  
      console.log("Capturing chart screenshot...");
      const screenshotPath = getIncrementedFilename(imagesFolder, `chart-${coin}`, "png");
      await iframeElement.screenshot({ path: screenshotPath });
  
      console.log(`Chart screenshot saved: ${screenshotPath}`);
  
      res.sendFile(screenshotPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).json({ message: "Failed to send the screenshot." });
        } else {
          console.log("Screenshot sent successfully.");
        }
      });
  
      await browser.close();
    } catch (error) {
      console.error("Error capturing chart:", error.message);
      res.status(500).json({ message: "Failed to capture chart.", error: error.message });
    }
  });
  
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// const express = require("express");
// const puppeteer = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const fs = require("fs");
// const path = require("path");

// puppeteer.use(StealthPlugin());

// const app = express();
// const PORT = 3000;
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// const imagesFolder = path.join(__dirname, "savedImages");
// if (!fs.existsSync(imagesFolder)) {
//   fs.mkdirSync(imagesFolder);
//   console.log("Created folder: savedImages");
// }

// const getIncrementedFilename = (basePath, baseName, extension) => {
//   let counter = 1;
//   let filename = `${baseName}-${counter}.${extension}`;
//   while (fs.existsSync(path.join(basePath, filename))) {
//     counter++;
//     filename = `${baseName}-${counter}.${extension}`;
//   }
//   return path.join(basePath, filename);
// };

// app.get("/capture-chart", async (req, res) => {
//   const { coin } = req.query;
//   if (!coin) {
//     return res.status(200).json({ message: "No token provided.", data: null });
//   }

//   const tradingUrl = `https://app.hyperliquid.xyz/trade/${coin}`;

//   try {
//     console.log(`Navigating to: ${tradingUrl}`);

//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//     const page = await browser.newPage();
//     await page.setViewport({ width: 1400, height: 900 });

//     await page.goto(tradingUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

//     console.log("Waiting for iframe to load...");
//     const iframeElement = await page.waitForSelector("iframe[id^='tradingview']", { timeout: 60000 });
//     const frame = await iframeElement.contentFrame();

//     console.log("Selecting indicators RSI and MACD...");

//     // Open the indicators menu
//     const indicatorsButtonSelector = "button[title*='Indicators'], button:has-text('Indicators')";
//     await frame.waitForSelector(indicatorsButtonSelector, { timeout: 10000 });
//     await frame.click(indicatorsButtonSelector);

//     await delay(2000);

//     // Search for RSI indicator
//     const searchInputSelector = "input[placeholder*='Search']";
//     await frame.waitForSelector(searchInputSelector, { timeout: 10000 });
//     await frame.type(searchInputSelector, "RSI", { delay: 100 });
//     await delay(1000);

//     const rsiSelector = "div:has-text('Relative Strength Index')";
//     await frame.waitForSelector(rsiSelector, { timeout: 10000 });
//     await frame.click(rsiSelector);
//     console.log("RSI indicator selected.");

//     await delay(2000);

//     // Search for MACD indicator
//     await frame.click(searchInputSelector);
//     await frame.evaluate(() => (document.querySelector("input[placeholder*='Search']").value = ""));
//     await frame.type(searchInputSelector, "MACD", { delay: 100 });
//     await delay(1000);

//     const macdSelector = "div:has-text('Moving Average Convergence Divergence')";
//     await frame.waitForSelector(macdSelector, { timeout: 10000 });
//     await frame.click(macdSelector);
//     console.log("MACD indicator selected.");

//     await delay(2000);

//     console.log("Capturing chart screenshot...");
//     const screenshotPath = getIncrementedFilename(imagesFolder, `chart-${coin}`, "png");
//     await iframeElement.screenshot({ path: screenshotPath });

//     console.log(`Chart screenshot saved: ${screenshotPath}`);

//     res.sendFile(screenshotPath, (err) => {
//       if (err) {
//         console.error("Error sending file:", err);
//         res.status(500).json({ message: "Failed to send the screenshot." });
//       } else {
//         console.log("Screenshot sent successfully.");
//       }
//     });

//     await browser.close();
//   } catch (error) {
//     console.error("Error capturing chart:", error.message);
//     res.status(500).json({ message: "Failed to capture chart.", error: error.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
