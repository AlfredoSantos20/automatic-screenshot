const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const imagesFolder = path.join(__dirname, "savedImages");
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

// Main endpoint to handle CoinGecko and GeckoTerminal
app.get("/crypto-search", async (req, res) => {
  const query = req.query.query || "bitcoin";

  try {
    console.log(`Searching for: ${query}`);

   
    const geckoUrl = `https://www.coingecko.com/en/search_v2?query=${encodeURIComponent(query)}`;
    const geckoResponse = await fetch(geckoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.coingecko.com/",
        Accept: "application/json, text/plain, */*",
      },
    });

    if (!geckoResponse.ok) {
      throw new Error(`CoinGecko request failed with status: ${geckoResponse.status}`);
    }

    const geckoData = await geckoResponse.json();
    const geckoCoin = geckoData.coins?.find(
      (coin) => coin.name.toLowerCase() === query.toLowerCase()
    );

    if (geckoCoin) {
      const coinSymbol = geckoCoin.symbol;
      console.log(`Found on CoinGecko: ${coinSymbol}`);
      return captureTradingChart(coinSymbol, res);
    } else {
      console.log(`Coin not found on CoinGecko. Searching GeckoTerminal for: ${query}`);
    }

  
    const terminalUrl = `https://app.geckoterminal.com/api/p1/search?query=${encodeURIComponent(
      query
    )}`;
    const terminalResponse = await fetch(terminalUrl, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.geckoterminal.com/",
      },
    });

    if (!terminalResponse.ok) {
      throw new Error(`GeckoTerminal request failed with status: ${terminalResponse.status}`);
    }

    const terminalData = await terminalResponse.json();
    const pools = terminalData?.data?.attributes?.pools || [];

    if (pools.length === 0) {
      return res.status(404).json({ success: false, message: `No pools found for ${query}` });
    }

    const firstPool = pools[0];
    const poolNetwork = firstPool?.network?.identifier || "unknown";
    const poolAddress = firstPool?.address;

    if (poolAddress) {
      console.log(`Navigating to pool on GeckoTerminal: ${poolNetwork}/${poolAddress}`);
      return captureGeckoTerminalChart(poolNetwork, poolAddress, res);
    } else {
      return res.status(404).json({ success: false, message: `No valid pool address for ${query}` });
    }
  } catch (error) {
    console.error("Error in /crypto-search endpoint:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});


const captureTradingChart = async (symbol, res) => {
  const tradingUrl = `https://app.hyperliquid.xyz/trade/${symbol}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    await page.goto(tradingUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await delay(40000);

    const iframeElement = await page.waitForSelector("iframe[id^='tradingview']", {
      timeout: 60000,
    });
    const screenshotPath = getIncrementedFilename(imagesFolder, `chart-${symbol}`, "png");
    await iframeElement.screenshot({ path: screenshotPath });

    console.log(`Trading chart saved: ${screenshotPath}`);
    res.sendFile(screenshotPath);
    await browser.close();
  } catch (error) {
    console.error("Error capturing trading chart:", error.message);
    res.status(500).json({ success: false, message: "Failed to capture trading chart." });
  }
};


const captureGeckoTerminalChart = async (network, address, res) => {
  const terminalUrl = `https://www.geckoterminal.com/${network}/pools/${address}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 900 });

    await page.goto(terminalUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await delay(40000);

    const graphSelector =
      '.flex.flex-grow.flex-col.p-1.md\\:mt-4.md\\:p-0.relative.rounded-b.rounded-t.border.border-line.min-h-\\[12\\.5rem\\].max-h-split-chart.bg-chart';
    await page.waitForSelector(graphSelector, { timeout: 60000 });
    const graphElement = await page.$(graphSelector);

    const screenshotPath = getIncrementedFilename(
      imagesFolder,
      `snapshot-${network}-${address}`,
      "png"
    );
    await graphElement.screenshot({ path: screenshotPath });

    console.log(`GeckoTerminal chart saved: ${screenshotPath}`);
    res.sendFile(screenshotPath);
    await browser.close();
  } catch (error) {
    console.error("Error capturing GeckoTerminal chart:", error.message);
    res.status(500).json({ success: false, message: "Failed to capture GeckoTerminal chart." });
  }
};

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
