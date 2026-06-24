import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import { Outlet } from "react-router-dom";
import React, { useMemo, useState } from "react";
import { Menu, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const pageTitles = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  accounts: "Accounts",
  loans: "Loans",
  budgets: "Budgets",
  goals: "Goals",
  reports: "Reports",
  recurring: "Recurring",
  notifications: "Notifications",
  profile: "Profile",
};

const Body = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const title = useMemo(() => {
    const segment = location.pathname.split("/").filter(Boolean)[0] || "dashboard";
    return pageTitles[segment] || "FinTrack";
  }, [location.pathname]);

  const showFab =
    location.pathname.includes("/transactions") &&
    !location.pathname.includes("/new");

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)] overflow-x-hidden">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div
        className={[
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          collapsed ? "md:ml-[72px]" : "md:ml-64",
        ].join(" ")}
      >
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-[var(--app-surface)]/95 backdrop-blur-lg border-b border-[var(--app-border)] px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center rounded-xl p-2.5 text-[var(--app-text)] hover:bg-[var(--app-surface-elevated)] transition"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base font-bold text-[var(--app-text)]">{title}</h1>
          <NotificationBell />
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between bg-[var(--app-surface)]/95 backdrop-blur-lg border-b border-[var(--app-border)] px-6 py-3">
          <h1 className="text-lg font-bold text-[var(--app-text)]">{title}</h1>
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6 pb-24 md:pb-6 min-w-0">
          <Outlet />
        </main>
      </div>

      <BottomNav />

      {showFab ? (
        <button
          type="button"
          onClick={() => navigate("/transactions/new")}
          className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-2xl bg-[var(--app-primary)] text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition"
          aria-label="Add transaction"
        >
          <Plus size={24} />
        </button>
      ) : null}
    </div>
  );
};

export default Body;
