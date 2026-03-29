import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import transactionRoutes from './routes/finance/transactions.js'
import categoryRoutes    from './routes/finance/categories.js'
import recurringRoutes   from './routes/finance/recurring.js'
import cpfRoutes         from './routes/finance/cpf.js'
import budgetRoutes      from './routes/finance/budgets.js'

dotenv.config()

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/finance', transactionRoutes)
app.use('/api/finance', categoryRoutes)
app.use('/api/finance', recurringRoutes)
app.use('/api/finance', cpfRoutes)
app.use('/api/finance', budgetRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
