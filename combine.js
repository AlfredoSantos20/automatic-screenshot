const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args)); // Dynamic import for node-fetch
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

// Endpoint to scrape the coin symbol
app.get("/scrape", async (req, res) => {
  try {
    // Get the query parameter from the request
    const query = req.query.query || "bitcoin"; // Default to "bitcoin"

    // Target URL with the query
    const url = `https://www.coingecko.com/en/search_v2?query=${encodeURIComponent(query)}&vs_currency=usd`;

    // Headers for the request
    const headers = {
      baggage:
        "sentry-environment=production,sentry-public_key=b9d74d9f9f5ffb2451d8883fe57f25c7,sentry-trace_id=76f7da4df16a431d9acbc4b045225a59,sentry-sample_rate=0.1,sentry-sampled=false",
      "sec-ch-ua":
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sentry-trace":
        "76f7da4df16a431d9acbc4b045225a59-bc959e5bae284bc7-0",
      Referer: "https://www.coingecko.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    // Make the request to CoinGecko
    const response = await fetch(url, { headers, method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }

    // Parse the response (JSON)
    const jsonResponse = await response.json();

    // Look for the symbol in the `coins` array
    const coins = jsonResponse.coins || [];
    const matchedCoin = coins.find(
      (coin) => coin.name.toLowerCase() === query.toLowerCase()
    );

    if (matchedCoin) {
      // Call the /capture-chart endpoint with the matched symbol
      const symbol = matchedCoin.symbol;
      res.redirect(`/capture-chart?coin=${symbol}`); // Redirect to capture-chart
    } else {
      // Handle cases where no match is found
      res.status(200).json({
        success: false,
        message: `No matching symbol found for query: ${query}`,
      });
    }
  } catch (error) {
    console.error("Error during scraping:", error.message);

    res.status(500).json({
      success: false,
      message: "An error occurred while scraping.",
      error: error.message,
    });
  }
});

// Endpoint to capture the trading chart
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

    await delay(40000);
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
