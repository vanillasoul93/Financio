import NavBar from './scenes/global/NavBar'

import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './scenes/dashboard/DashboardView'
import Subscriptions from './scenes/subscriptions/SubscriptionsView'
import History from './scenes/history/HistoryView'
import Bills from './scenes/bills/BillView'
import GoalsView from './scenes/goals/GoalsView'
import CreditCards from './scenes/creditcard/CreditCardView'
import Settings from './scenes/settings/SettingsView'
import Exit from './scenes/exit/ExitView'
import PayBills from './scenes/paybills/PayBillView'
import Expenses from './scenes/expenses/ExpensesView'
import Accounts from './scenes/accounts/AccountsView'
import './layouts/App.css'

import { ColorModeContext, useMode } from './theme'
import { CssBaseline, ThemeProvider } from '@mui/material'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  const [theme, colorMode] = useMode()

  return (
    <>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="app">
                <NavBar />
                <main className="content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/subscriptions" element={<Subscriptions />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/creditcards" element={<CreditCards />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/goals" element={<GoalsView />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/payBills" element={<PayBills />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/exit" element={<Exit />} />
                  </Routes>
                </main>
              </div>
            </LocalizationProvider>
          </Router>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </>
  )
}

export default App
