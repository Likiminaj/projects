import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import BottomNav       from './components/BottomNav.jsx'
import FinanceLayout   from './pages/finance/FinanceLayout.jsx'
import FinanceOverview from './pages/finance/FinanceOverview.jsx'
import FinancialReview from './pages/finance/FinancialReview.jsx'
import CPF             from './pages/finance/CPF.jsx'
import Ledger          from './pages/finance/Ledger.jsx'
import RecurringIncome from './pages/finance/RecurringIncome.jsx'
import Birthdays       from './pages/finance/Birthdays.jsx'
import PaybackQueue    from './pages/finance/PaybackQueue.jsx'
import Tasks           from './pages/tasks/Tasks.jsx'
import HabitsPage      from './pages/habits/HabitsPage.jsx'

function RootLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Full-screen flows — no bottom nav */}
      <Route path="/finance/review" element={<FinancialReview />} />

      {/* Main app — with bottom nav */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<Navigate to="/finance" replace />} />
        <Route path="/finance" element={<FinanceLayout />}>
          <Route index element={<FinanceOverview />} />
          <Route path="ledger"    element={<Ledger />} />
          <Route path="recurring" element={<RecurringIncome />} />
          <Route path="birthdays" element={<Birthdays />} />
          <Route path="cpf"       element={<CPF />} />
          <Route path="payback"   element={<PaybackQueue />} />
        </Route>
        <Route path="/tasks"  element={<Tasks />} />
        <Route path="/habits" element={<HabitsPage />} />
      </Route>
    </Routes>
  )
}
