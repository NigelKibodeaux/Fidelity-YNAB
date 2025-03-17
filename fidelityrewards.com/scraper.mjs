import fs from 'node:fs/promises'
import { chromium } from 'playwright-chromium'

/**
 * Downloads the CSV file from the Fidelity Rewards website using a headless browser.
 *
 * @returns {Promise<string>} The CSV file as a string.
 */
export async function downloadCsvWithHeadlessBrowser() {
    if (!process.env.FIDELITY_USERNAME || !process.env.FIDELITY_PASSWORD) {
        throw new Error('Please provide FIDELITY_USERNAME and FIDELITY_PASSWORD environment variables')
    }

    // Launch browser
    console.log('Launching browser')
    const context = await chromium.launchPersistentContext('./user_data', { headless: true })
    const pages = context.pages()
    const page = pages[0]

    // Log in
    console.log('Navigating to login page')
    await page.goto('https://login.fidelityrewards.com')
    console.log('Page loaded')

    // Wait for the inputs or a login link
    await Promise.race([page.locator('a[href*="login.do"]').waitFor(), page.locator('input[name=Username]').waitFor()])

    // If there is a login link, click it and wait for the page to load
    if (await page.$('a[href*="login.do"]')) {
        console.log('Login link found. Clicking...')
        await page.click('a[href*="login.do"]')
        console.log('Waiting for new page to load')
        await page.waitForLoadState('load')
    }

    // Fill in login info
    console.log('Filling in auth info')
    await page.fill('input[name=Username]', process.env.FIDELITY_USERNAME)
    await page.fill('input[name=Password]', process.env.FIDELITY_PASSWORD)
    await page.click('button[type=submit]')
    console.log('Submitted login')

    // Download CSV
    console.log('Waiting for download button')
    await page.click('#transaction-download-button')
    // await page.waitForSelector('#transactionsDownloadOptions', { state: 'visible' })
    await page.click('#transactionsDownloadOptionsDownload')
    console.log('Download button clicked')

    // Wait for download to complete
    console.log('Waiting for download to complete')
    const download = await page.waitForEvent('download')
    await download.saveAs('./transactions.csv')

    // Close browser
    await context.close()

    return fs.readFile('./transactions.csv', 'utf-8')
}
