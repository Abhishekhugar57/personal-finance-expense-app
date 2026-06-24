import { Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import React, { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Body from "./components/Body";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { SkeletonDashboard } from "./components/ui/Skeleton";

const Login = lazy(() => import("./components/Login"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Transactions = lazy(() => import("./components/Transactions"));
const AddTransaction = lazy(() => import("./components/AddTransaction"));
const Accounts = lazy(() => import("./components/Accounts"));
const AddAccount = lazy(() => import("./components/AddAccount"));
const Loans = lazy(() => import("./components/Loans"));
const Profile = lazy(() => import("./components/Profile"));
const Budgets = lazy(() => import("./components/Budgets"));
const Goals = lazy(() => import("./components/Goals"));
const Reports = lazy(() => import("./components/Reports"));
const Recurring = lazy(() => import("./components/Recurring"));
const Notifications = lazy(() => import("./components/Notifications"));

const PageLoader = () => <SkeletonDashboard />;

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "var(--app-surface)",
                  color: "var(--app-text)",
                  border: "1px solid var(--app-border)",
                  borderRadius: "12px",
                },
              }}
            />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Body />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="transactions/new" element={<AddTransaction />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="accounts/new" element={<AddAccount />} />
                  <Route path="loans" element={<Loans />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="goals" element={<Goals />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="recurring" element={<Recurring />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
