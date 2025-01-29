    // const express = require('express');
    // const fetch = require('node-fetch'); // Ensure you have node-fetch installed: npm install node-fetch

    // const app = express();
    // const PORT = 3000;

    // // Example route for scraping
    // app.get('/scrape', async (req, res) => {
    //     try {
    //         // Get the query parameter from the request
    //         const query = req.query.data || "bitcoin"; // Default to "bitcoin"

    //         // Target URL with the query
    //         const url = `https://www.coingecko.com/en/search_v2?query=${encodeURIComponent(query)}&vs_currency=usd`;

    //         // Headers for the request
    //         const headers = {
    //             "baggage": "sentry-environment=production,sentry-public_key=b9d74d9f9f5ffb2451d8883fe57f25c7,sentry-trace_id=76f7da4df16a431d9acbc4b045225a59,sentry-sample_rate=0.1,sentry-sampled=false",
    //             "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    //             "sec-ch-ua-mobile": "?1",
    //             "sec-ch-ua-platform": "\"Android\"",
    //             "sentry-trace": "76f7da4df16a431d9acbc4b045225a59-bc959e5bae284bc7-0",
    //             "Referer": "https://www.coingecko.com/",
    //             "Referrer-Policy": "strict-origin-when-cross-origin"
    //         };

    //         // Make the request to CoinGecko
    //         const response = await fetch(url, { headers, method: "GET" });

    //         if (!response.ok) {
    //             throw new Error(`Failed to fetch data. Status: ${response.status}`);
    //         }

    //         // Parse the response
    //         const data = await response.text(); // CoinGecko may return HTML, so use .text() instead of .json()

    //         // Send the response data
    //         res.send(data);
    //     } catch (error) {
    //         console.error("Error during scraping:", error.message);

    //         res.status(500).json({
    //             success: false,
    //             message: "An error occurred while scraping.",
    //             error: error.message,
    //         });
    //     }
    // });

    // // Start the server
    // app.listen(PORT, () => {
    //     console.log(`Server is running on http://localhost:${PORT}`);
    // });


    const express = require("express");
    const fetch = (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args)); // Dynamic import for node-fetch
    
    const app = express();
    const PORT = 3000;
    
    // Example route for scraping
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
          // Return the matched symbol
          res.json({
            success: true,
            symbol: matchedCoin.symbol,
          });
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
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
    