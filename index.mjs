import ynab from 'ynab'
import { downloadCsvWithHeadlessBrowser } from './fidelityrewards.com/scraper.mjs'
import { parseCsvIntoYnabTransactionArray } from './fidelityrewards.com/csv_parser.mjs'

// Read secrets from .env
const api_token = process.env.YNAB_API_TOKEN
const budget_id = process.env.BUDGET_ID
const account_id = process.env.FIDELITY_ACCOUNT_ID

if (!api_token || !budget_id || !account_id) {
    throw new Error('Missing environment variables')
}

// Download transactions from Fidelity Rewards
const transactions_csv = await downloadCsvWithHeadlessBrowser()
// const transactions_csv = (await import('fs')).readFileSync('./transactions.csv', 'utf-8')

// Parse CSV into YNAB transactions
let ynab_transactions = parseCsvIntoYnabTransactionArray(transactions_csv, account_id)

// Filter out transactions that are before the start date
if (process.env.START_DATE) {
    const start_date = new Date(process.env.START_DATE)
    ynab_transactions = ynab_transactions.filter((transaction) => new Date(transaction.date) >= start_date)
}

const transactions = ynab_transactions
console.log('--- Transactions ---')
console.log(transactions)

// Create transactions in YNAB
const ynabAPI = new ynab.API(api_token)
const result = await ynabAPI.transactions.createTransactions(budget_id, { transactions })
console.log('--- Result ---')
console.dir(result, { depth: null })
console.log('--- Stats ---')
console.log(`Created: ${result.data.transactions.length}`)
console.log(`Duplicate: ${result.data.duplicate_import_ids.length}`)
