import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import { ProfileCompleteProvider } from './profileComplete'
import { Shell } from './Shell'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Statement } from './pages/Statement'
import { Market } from './pages/Market'
import { Transfer } from './pages/Transfer'
import { Security } from './pages/Security'
import { Manifesto } from './pages/Manifesto'
import { AdminUsers } from './pages/AdminUsers'
import { InvoicesSend } from './pages/InvoicesSend'
import { InvoicesReceive } from './pages/InvoicesReceive'
import { Account } from './pages/Account'
import { MercadoPagoReturnHandler } from './components/MercadoPagoReturnHandler'
import { ConfirmRegistration } from './pages/ConfirmRegistration'
import { ProfileIncompleteOverlay } from './components/ProfileIncompleteOverlay'
import { useAuth } from './auth'
import { useProfileComplete } from './profileComplete'

import { VoucherCard } from './pages/VoucherCard'
import { VoucherView } from './pages/VoucherView'

import { PayInvoice } from './pages/PayInvoice'

function ProfileRequiredRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const { isComplete } = useProfileComplete()
  if (!auth.isAdmin && !isComplete) return <ProfileIncompleteOverlay />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/manifesto" element={<Manifesto />} />
        <Route path="/security" element={<Security />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm-registration" element={<ConfirmRegistration />} />
        <Route path="/mercadopago/return" element={<MercadoPagoReturnHandler />} />
        <Route path="/pay" element={<PayInvoice />} />
        <Route path="/voucher/view/:code" element={<VoucherView />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="statement" element={<Statement />} />
          <Route path="market" element={<Market />} />
          <Route path="account" element={<Account />} />
          <Route
            path="transfer"
            element={
              <ProfileRequiredRoute>
                <Transfer />
              </ProfileRequiredRoute>
            }
          />
          <Route
            path="voucher"
            element={
              <ProfileRequiredRoute>
                <VoucherCard />
              </ProfileRequiredRoute>
            }
          />
          <Route
            path="invoices/send"
            element={
              <ProfileRequiredRoute>
                <InvoicesSend />
              </ProfileRequiredRoute>
            }
          />
          <Route
            path="invoices/receive"
            element={
              <ProfileRequiredRoute>
                <InvoicesReceive />
              </ProfileRequiredRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileCompleteProvider>
        <AppRoutes />
      </ProfileCompleteProvider>
    </AuthProvider>
  )
}
