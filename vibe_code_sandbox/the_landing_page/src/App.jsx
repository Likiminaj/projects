import { Routes, Route, Navigate } from 'react-router-dom'
import FinanceLayout   from './pages/finance/FinanceLayout.jsx'
import CPF             from './pages/finance/CPF.jsx'
import Ledger          from './pages/finance/Ledger.jsx'
import RecurringIncome from './pages/finance/RecurringIncome.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/finance/ledger" replace />} />
      <Route path="/finance" element={<FinanceLayout />}>
        <Route path="cpf"       element={<CPF />} />
        <Route path="ledger"    element={<Ledger />} />
        <Route path="recurring" element={<RecurringIncome />} />
      </Route>
    </Routes>
  )
}
