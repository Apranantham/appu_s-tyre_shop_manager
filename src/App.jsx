import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';

import { ProductProvider } from './context/ProductContext';
import { ServiceProvider } from './context/ServiceContext';
import { InvoiceProvider } from './context/InvoiceContext';
import { SettingsProvider } from './context/SettingsContext';
import DashboardPage from './pages/dashboard/DashboardPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ServicePage from './pages/services/ServicePage';
import CustomerHistory from './pages/history/CustomerHistory';
import CustomerProfile from './pages/history/CustomerProfile';
import BillingHistory from './pages/history/BillingHistory';
import BillingPage from './pages/billing/BillingPage';
import SettingsPage from './pages/settings/SettingsPage';
import AdminPanel from './pages/admin/AdminPanel';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <ProductProvider>
            <ServiceProvider>
              <InvoiceProvider>
                <Router>
                  <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected Routes */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="billing" element={<BillingPage />} />
                      <Route path="inventory" element={<InventoryPage />} />
                      <Route path="services" element={<ServicePage />} />
                      <Route path="customers" element={<CustomerHistory />} />
                      <Route path="customers/:id" element={<CustomerProfile />} />
                      <Route path="history" element={<BillingHistory />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="admin" element={<AdminPanel />} />
                    </Route>

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Router>
              </InvoiceProvider>
            </ServiceProvider>
          </ProductProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
