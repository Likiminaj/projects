import { Routes, Route, Navigate } from 'react-router-dom'
import FinanceLayout    from './pages/finance/FinanceLayout.jsx'
import FinanceOverview  from './pages/finance/FinanceOverview.jsx'
import FinancialReview  from './pages/finance/FinancialReview.jsx'
import CPF              from './pages/finance/CPF.jsx'
import Ledger           from './pages/finance/Ledger.jsx'
import RecurringIncome  from './pages/finance/RecurringIncome.jsx'
import Birthdays        from './pages/finance/Birthdays.jsx'
import PaybackQueue     from './pages/finance/PaybackQueue.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/finance" replace />} />
      {/* Review is a focused full-screen flow — no tab bar */}
      <Route path="/finance/review" element={<FinancialReview />} />
      <Route path="/finance" element={<FinanceLayout />}>
        <Route index element={<FinanceOverview />} />
        <Route path="ledger"     element={<Ledger />} />
        <Route path="recurring"  element={<RecurringIncome />} />
        <Route path="birthdays"  element={<Birthdays />} />
        <Route path="cpf"        element={<CPF />} />
        <Route path="payback"    element={<PaybackQueue />} />
      </Route>
    </Routes>
  )
}
