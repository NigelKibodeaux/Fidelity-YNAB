import ynab from 'ynab'
import { parse } from 'csv-parse/sync'

/**
 * Parses a CSV text into an array of YNAB transactions.
 * https://api.ynab.com/v1#/Transactions/createTransaction
 *
 * @param {string} csv_text
 * @returns {Array<YnabTransaction>}
 */
export function parseCsvIntoYnabTransactionArray(csv_text, account_id) {
    const records = parse(csv_text, {
        columns: true,
        skip_empty_lines: true,
    })

    const transactions = []
    for (const record of records) {
        const memo_id = record.Memo.split(';')[0]
        let import_id = memo_id

        // If it fits the standard format, put the location info in the memo
        let memo
        let payee_name = record.Name
        if (record.Name.length === 39) {
            payee_name = record.Name.slice(0, 23).trim()
            memo = record.Name.slice(23).trim()
        }

        // Handle payments in Euros
        if (/ - [0-9]+\.\d\d\d\d EURO$/.test(record.Name)) {
            payee_name = record.Name.split(' - ')[0]
            memo = record.Name.split(' - ')[1]
        }

        // Payments have no transaction ID, create one
        if (Number.isNaN(Number(memo_id)) && Number(record.Amount) > 0) {
            import_id = `payment_${record.Date}_${record.Amount}`
            memo = 'Payment to Fidelity'
        }

        transactions.push({
            account_id,
            cleared: ynab.TransactionClearedStatus.Cleared,
            approved: false,
            date: record.Date,
            amount: Math.round(Number(record.Amount) * 1000),
            memo,
            import_id,
            payee_name,
        })
    }

    return transactions
}
// const fs = await import('fs')
// const csv_text = fs.readFileSync('./Credit Card - 1480_02-03-2020_03-09-2025.csv', 'utf-8')
// const parsed = parseCsvIntoYnabTransactionArray(csv_text, 'test')
// console.table(parsed.map((t) => ({ payee_name: t.payee_name, memo: t.memo, ...t })))
