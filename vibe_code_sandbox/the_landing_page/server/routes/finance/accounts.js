import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const DB = () => process.env.NOTION_ACCOUNTS_DB

function inferRole(name = '', type = '') {
  const value = `${name} ${type}`.toLowerCase()
  if (/credit card|card|loan|debt|mortgage|liability/.test(value)) return 'liability'
  return 'asset'
}

function mapAccount(page) {
  const p = page.properties
  const name = p.Name?.title[0]?.plain_text ?? ''
  const type = p.Type?.select?.name ?? ''
  return {
    id:          page.id,
    name,
    balance:     p.Balance?.number               ?? 0,
    type,
    role:        inferRole(name, type),
    creditLimit: p['Credit Limit']?.number       ?? null,
    lastUpdated: p['Last Updated']?.date?.start  ?? null,
  }
}

async function retrieveAccount(accountId) {
  const page = await notion.pages.retrieve({ page_id: accountId })
  return mapAccount(page)
}

// GET /api/finance/accounts
router.get('/accounts', async (req, res) => {
  try {
    if (!DB()) return res.json({ success: true, data: [] })
    const result = await notion.databases.query({
      database_id: DB(),
      sorts: [{ property: 'Name', direction: 'ascending' }],
    })
    res.json({ success: true, data: result.results.map(mapAccount) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/finance/accounts/:id
router.patch('/accounts/:id', async (req, res) => {
  try {
    const { balance } = req.body
    const today = new Date().toISOString().slice(0, 10)
    const updated = await notion.pages.update({
      page_id: req.params.id,
      properties: {
        Balance:        { number: parseFloat(balance) || 0 },
        'Last Updated': { date: { start: today } },
      },
    })
    res.json({ success: true, data: mapAccount(updated) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/accounts/payment
router.post('/accounts/payment', async (req, res) => {
  try {
    const { fromAccountId, liabilityAccountId, amount, date } = req.body
    const paymentAmount = parseFloat(amount)

    if (!fromAccountId || !liabilityAccountId) {
      return res.status(400).json({ success: false, error: 'Select both a source account and a card account.' })
    }
    if (fromAccountId === liabilityAccountId) {
      return res.status(400).json({ success: false, error: 'Source and card account must be different.' })
    }
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Enter a valid payment amount.' })
    }

    const [fromAccount, liabilityAccount] = await Promise.all([
      retrieveAccount(fromAccountId),
      retrieveAccount(liabilityAccountId),
    ])

    if (fromAccount.balance < paymentAmount) {
      return res.status(400).json({ success: false, error: 'Source account does not have enough balance.' })
    }
    if (liabilityAccount.balance < paymentAmount) {
      return res.status(400).json({ success: false, error: 'Payment is larger than the card balance owed.' })
    }

    const updatedDate = date || new Date().toISOString().slice(0, 10)

    const [updatedFrom, updatedLiability] = await Promise.all([
      notion.pages.update({
        page_id: fromAccountId,
        properties: {
          Balance: { number: fromAccount.balance - paymentAmount },
          'Last Updated': { date: { start: updatedDate } },
        },
      }),
      notion.pages.update({
        page_id: liabilityAccountId,
        properties: {
          Balance: { number: liabilityAccount.balance - paymentAmount },
          'Last Updated': { date: { start: updatedDate } },
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        from: mapAccount(updatedFrom),
        liability: mapAccount(updatedLiability),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
