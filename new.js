// const express = require("express");
// const puppeteer = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const fs = require("fs");
// const path = require("path");
// const fetch = global.fetch || require("node-fetch");

// // Add Puppeteer stealth plugin
// puppeteer.use(StealthPlugin());

// const app = express();
// const PORT = 3000;

// // Ensure the `savedImages` directory exists
// const imagesFolder = path.join(__dirname, "savedImages");
// if (!fs.existsSync(imagesFolder)) {
//   fs.mkdirSync(imagesFolder);
//   console.log("Created folder: savedImages");
// }

// // Helper function to add a delay
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// // Helper function to increment filenames dynamically
// const getIncrementedFilename = (basePath, baseName, extension) => {
//   let counter = 1;
//   let filename = `${baseName}-${counter}.${extension}`;
//   while (fs.existsSync(path.join(basePath, filename))) {
//     counter++;
//     filename = `${baseName}-${counter}.${extension}`;
//   }
//   return path.join(basePath, filename);
// };

// // Route to fetch and screenshot dynamically
// app.get("/search-and-snapshot", async (req, res) => {
//   const tokenName = req.query.query || "bitcoin"; // Default to "bitcoin"

//   try {
//     console.log(`Fetching search results for token: ${tokenName}...`);

//     // Fetch search results from GeckoTerminal API
//     const response = await fetch(
//       `https://app.geckoterminal.com/api/p1/search?query=${encodeURIComponent(tokenName.replace("$",""))}`,
//       {
//         headers: {
//           accept: "application/json, text/plain, */*",
//           "accept-language": "en-US,en;q=0.9",
//           "sec-fetch-site": "same-site",
//           Referer: "https://www.geckoterminal.com/",
//         },
//         method: "GET",
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to fetch search results. Status: ${response.status}`);
//     }

//     const searchResults = await response.json();
//     console.log("Search Results Response:", JSON.stringify(searchResults, null, 2));

//     const pools = searchResults?.data?.attributes?.pools;
//     if (!pools || pools.length === 0) {
//       throw new Error(`No pools found for token "${tokenName}".`);
//     }

//     // Select the first pool only
//     const firstPool = pools[0];
//     const poolAddress = firstPool?.address;
//     const network = firstPool?.network?.identifier || "unknown-network"; // Use network identifier dynamically

//     if (!poolAddress) {
//       throw new Error("No address found for the first pool of token.");
//     }

//     const fullTokenUrl = `https://www.geckoterminal.com/${network}/pools/${poolAddress}`;
//     console.log(`Navigating to token page: ${fullTokenUrl}`);

//     // Generate incremented file paths
//     const screenshotPath = getIncrementedFilename(
//       imagesFolder,
//       `snapshot-${network}-${poolAddress}`,
//       "png"
//     );
//     const debugPath = getIncrementedFilename(
//       imagesFolder,
//       `snapshot-${network}-${poolAddress}`,
//       "png"
//     );

//     // Launch Puppeteer
//     const browser = await puppeteer.launch({
//       headless: true, // Prevent browser popup by running in headless mode
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//     const page = await browser.newPage();
//     await page.setViewport({ width: 1280, height: 720 });

//     try {
//       // Navigate to the token page
//       await page.goto(fullTokenUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
//       console.log("Token page loaded successfully.");

//       // Wait for the TradingView chart to load
//       const chartSelector = ".tradingview-widget-container";
//       console.log("Waiting for the TradingView chart to load...");

//       await page.waitForSelector(chartSelector, { visible: true, timeout: 20000 });
//       console.log("TradingView chart loaded.");

//       // Take the final screenshot
//       await page.screenshot({ path: screenshotPath });
//       console.log(`Snapshot saved: ${screenshotPath}`);

//       // Send the screenshot as a response
//       res.sendFile(screenshotPath, (err) => {
//         if (err) {
//           console.error("Error sending file:", err);
//           res.status(500).send("Error generating TradingView snapshot.");
//         } else {
//           console.log("Snapshot sent successfully.");
//         }
//       });
//     } catch (e) {
//       console.error("Error during TradingView chart loading. Taking debug screenshot...");
//       await page.screenshot({ path: debugPath });
//       console.error(`Debug screenshot saved: ${debugPath}`);
//       throw new Error("Chart element not found within the timeout period.");
//     } finally {
//       // Close the browser
//       await browser.close();
//     }
//   } catch (error) {
//     console.error("Error during TradingView snapshot scraping:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "An error occurred while capturing the TradingView snapshot.",
//       error: error.message,
//     });
//   }
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });


const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");
const fetch = global.fetch || require("node-fetch");

// Add Puppeteer stealth plugin
puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Ensure the `savedImages` directory exists
const imagesFolder = path.join(__dirname, "savedImages");
if (!fs.existsSync(imagesFolder)) {
  fs.mkdirSync(imagesFolder);
  console.log("Created folder: savedImages");
}

// Helper function to increment filenames dynamically
const getIncrementedFilename = (basePath, baseName, extension) => {
  let counter = 1;
  let filename = `${baseName}-${counter}.${extension}`;
  while (fs.existsSync(path.join(basePath, filename))) {
    counter++;
    filename = `${baseName}-${counter}.${extension}`;
  }
  return path.join(basePath, filename);
};

// Route to fetch and return screenshot image
app.get("/search-and-snapshot", async (req, res) => {
  const tokenName = req.query.query || "bitcoin"; // Default to "bitcoin"

  try {
    console.log(`Fetching search results for token: ${tokenName}...`);

    // Fetch search results from GeckoTerminal API
    const response = await fetch(
      `https://app.geckoterminal.com/api/p1/search?query=${encodeURIComponent(tokenName.replace("$", ""))}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
          "sec-fetch-site": "same-site",
          Referer: "https://www.geckoterminal.com/",
        },
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch search results. Status: ${response.status}`);
    }

    const searchResults = await response.json();
    console.log("Search Results Response:", JSON.stringify(searchResults, null, 2));

    const pools = searchResults?.data?.attributes?.pools;
    if (!pools || pools.length === 0) {
      throw new Error(`No pools found for token "${tokenName}".`);
    }

    // Select the first pool only
    const firstPool = pools[0];
    const poolAddress = firstPool?.address;
    const network = firstPool?.network?.identifier || "unknown-network"; // Use network identifier dynamically

    if (!poolAddress) {
      throw new Error("No address found for the first pool of token.");
    }

    const fullTokenUrl = `https://www.geckoterminal.com/${network}/pools/${poolAddress}`;
    console.log(`Navigating to token page: ${fullTokenUrl}`);

    // Generate incremented file paths
    const screenshotPath = getIncrementedFilename(
      imagesFolder,
      `snapshot-${network}-${poolAddress}`,
      "png"
    );

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true, // Run in headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    try {
      // Navigate to the token page
      await page.goto(fullTokenUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
      console.log("Token page loaded successfully.");

      await delay(20000);
      // Take the screenshot
      await page.screenshot({ path: screenshotPath });
      console.log(`Snapshot saved: ${screenshotPath}`);

      // Send the screenshot as the response
      res.sendFile(screenshotPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).json({
            success: false,
            message: "Failed to send the screenshot image.",
            error: err.message,
          });
        } else {
          console.log("Snapshot sent successfully.");
        }
      });
    } catch (e) {
      console.error("Error during page navigation or screenshot:", e.message);
      throw new Error("Failed to capture the screenshot.");
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error during snapshot generation:", error.message);

    res.status(500).json({
      success: false,
      message: "An error occurred while capturing the snapshot.",
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
