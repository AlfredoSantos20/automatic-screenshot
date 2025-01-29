const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Route to scrape and capture TradingView graph
app.get('/scrape-screenshot', async (req, res) => {
    const tokenName = req.query.token; // Default token name
    const baseUrl = 'https://www.geckoterminal.com/'; // GeckoTerminal base URL

    try {
        // Launch Puppeteer
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        // Navigate to GeckoTerminal
        await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 120000 });

        // Search for the token
        const searchInputSelector = 'input[placeholder="Search network, dex or tokens"]';
        await page.waitForSelector(searchInputSelector, { timeout: 60000 });
        await page.type(searchInputSelector, tokenName, { delay: 100 });

        // Wait for results to populate
        const resultSelector = '.result-item'; // Ensure this matches the token list item
        await page.waitForSelector(resultSelector, { timeout: 60000 });

        // Click the appropriate token row
        const tokenRow = await page.evaluateHandle((tokenName) => {
            const rows = Array.from(document.querySelectorAll('.result-item'));
            return rows.find((row) => row.textContent.toLowerCase().includes(tokenName.toLowerCase()));
        }, tokenName);

        if (!tokenRow) {
            throw new Error(`Token "${tokenName}" not found in search results.`);
        }
        await tokenRow.asElement().click();

        // Wait for chart page to load
        const chartSelector = '.tradingview-widget-container'; // Ensure this matches the graph container
        await page.waitForSelector(chartSelector, { timeout: 60000 });

        // Capture the TradingView chart
        const screenshotPath = `screenshot-${tokenName}-graph.png`; // Save with token name
        const chartElement = await page.$(chartSelector);

        if (!chartElement) {
            throw new Error('TradingView graph not found.');
        }

        await chartElement.screenshot({ path: screenshotPath });

        // Close the browser
        await browser.close();

        // Send the screenshot as a response
        res.sendFile(screenshotPath, { root: '.' }, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error generating screenshot.');
            } else {
                // Delete the screenshot after sending
                fs.unlink(screenshotPath, () => {});
            }
        });
    } catch (error) {
        console.error('Error taking screenshot:', error);

        // Close the browser in case of error
        await browser?.close();

        // Respond with error details
        res.status(500).json({
            success: false,
            message: 'An error occurred while taking the screenshot.',
            error: error.message,
        });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

