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
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// // Ensure the `savedImages` directory exists
// const imagesFolder = path.join(__dirname, "savedImages");
// if (!fs.existsSync(imagesFolder)) {
//   fs.mkdirSync(imagesFolder);
//   console.log("Created folder: savedImages");
// }

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

// // Route to fetch and return screenshot image
// app.get("/search-and-snapshot", async (req, res) => {
//   const tokenName = req.query.query; 

//   try {
//     console.log(`Fetching search results for token: ${tokenName}...`);

//     // Fetch search results from GeckoTerminal API
//     const response = await fetch(
//       `https://app.geckoterminal.com/api/p1/search?query=${encodeURIComponent(tokenName.replace("$", ""))}`,
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

//     // Validate if there are no pools for the token
//     if (!pools || pools.length === 0) {
//       console.warn(`No pools found for token "${tokenName}".`);
//       res.status(200).json({       
//         message: `No pools found for token "${tokenName}".`,
//         image: null,
//       });
//       return;
//     }

//     // Select the first pool only
//     const firstPool = pools[0];
//     const poolAddress = firstPool?.address;
//     const network = firstPool?.network?.identifier || "unknown-network"; // Use network identifier dynamically

//     if (!poolAddress) {
//       console.warn("No address found for the first pool of the token.");
//       res.status(200).json({
//         message: `No valid pool address found for token "${tokenName}".`,
//         image: null,
//       });
//       return;
//     }

//     const fullTokenUrl = `https://www.geckoterminal.com/${network}/pools/${poolAddress}`;
//     console.log(`Navigating to token page: ${fullTokenUrl}`);

//     // Generate incremented file paths
//     const screenshotPath = getIncrementedFilename(
//       imagesFolder,
//       `snapshot-${network}-${poolAddress}`,
//       "png"
//     );

//     // Launch Puppeteer
//     const browser = await puppeteer.launch({
//       headless: true, // Run in headless mode
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//     const page = await browser.newPage();
//     await page.setViewport({ width: 1400, height: 900 });

//     try {
     
//       await page.goto(fullTokenUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
//       console.log("Token page loaded successfully.");

//       await delay(20000);
    
//       await page.screenshot({ path: screenshotPath });
//       console.log(`Snapshot saved: ${screenshotPath}`);

     
//       res.sendFile(screenshotPath, (err) => {
//         if (err) {
//           console.error("Error sending file:", err);
//           res.status(500).json({
//             success: false,
//             message: "Failed to send the screenshot image.",
//             error: err.message,
//           });
//         } else {
//           console.log("Snapshot sent successfully.");
//         }
//       });
//     } catch (e) {
//       console.error("Error during page navigation or screenshot:", e.message);
//       throw new Error("Failed to capture the screenshot.");
//     } finally {
//       await browser.close();
//     }
//   } catch (error) {
//     console.error("Error during snapshot generation:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "An error occurred while capturing the snapshot.",
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
  const tokenName = req.query.query;

  try {
    console.log(`Fetching search results for token: ${tokenName}...`);

    // Fetch search results from GeckoTerminal API
    const response = await fetch(
      `https://app.geckoterminal.com/api/p1/search?query=${encodeURIComponent(
        tokenName.replace("$", "")
      )}`,
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
      throw new Error(
        `Failed to fetch search results. Status: ${response.status}`
      );
    }

    const searchResults = await response.json();
    console.log(
      "Search Results Response:",
      JSON.stringify(searchResults, null, 2)
    );

    const pools = searchResults?.data?.attributes?.pools;

    // Validate if there are no pools for the token
    if (!pools || pools.length === 0) {
      console.warn(`No pools found for token "${tokenName}".`);
      res.status(200).json({
        message: `No pools found for token "${tokenName}".`,
        image: null,
      });
      return;
    }

    // Select the first pool only
    const firstPool = pools[0];
    const poolAddress = firstPool?.address;
    const network =
      firstPool?.network?.identifier || "unknown-network"; // Use network identifier dynamically

    if (!poolAddress) {
      console.warn("No address found for the first pool of the token.");
      res.status(200).json({
        message: `No valid pool address found for token "${tokenName}".`,
        image: null,
      });
      return;
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
    await page.setViewport({ width: 1500, height: 900 });

    try {
      // Navigate to the pool page
      await page.goto(fullTokenUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      console.log("Token page loaded successfully.");

      // Wait for the graph container to load
      const graphSelector =
        '.flex.flex-grow.flex-col.p-1.md\\:mt-4.md\\:p-0.relative.rounded-b.rounded-t.border.border-line.min-h-\\[12\\.5rem\\].max-h-split-chart.bg-chart';
      await page.waitForSelector(graphSelector, { timeout: 60000 });
      console.log("Graph container found.");

      // Select the graph container
      const graphElement = await page.$(graphSelector);

      if (!graphElement) {
        throw new Error("Graph element not found on the page.");
      }

      await delay(40000);
      // Take a screenshot of the graph container only
      await graphElement.screenshot({ path: screenshotPath });
      console.log(`Graph-only snapshot saved: ${screenshotPath}`);

      // Send the screenshot as a response
      res.sendFile(screenshotPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(200).json({
            success: false,
            message: "Failed to send the graph-only screenshot image.",
            error: err.message,
          });
        } else {
          console.log("Graph-only snapshot sent successfully.");
        }
      });
    } catch (e) {
      console.error(
        "Error during page navigation or screenshot:",
        e.message
      );
      throw new Error("Failed to capture the graph-only screenshot.");
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
