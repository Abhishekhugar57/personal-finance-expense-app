import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Landmark,
  Target,
  PiggyBank,
  FileText,
  Repeat,
  Bell,
  User,
} from "lucide-react";

const navItems = [
  { name: "Home", path: "/dashboard", icon: LayoutDashboard },
  { name: "Txns", path: "/transactions", icon: ArrowLeftRight },
  { name: "Accounts", path: "/accounts", icon: Wallet },
  { name: "Loans", path: "/loans", icon: Landmark },
  { name: "More", path: "/profile", icon: User },
];

const BottomNav = () => (
  <nav
    className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom border-t border-[var(--app-border)] bg-[var(--app-surface)]/95 backdrop-blur-lg"
    aria-label="Mobile navigation"
  >
    <ul className="flex items-stretch justify-around px-1 pt-1 pb-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.path} className="flex-1">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl text-[10px] font-semibold transition-colors min-h-[56px]",
                  isActive
                    ? "text-[var(--app-primary)]"
                    : "text-[var(--app-text-muted)]",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "flex items-center justify-center h-8 w-8 rounded-xl transition-colors",
                      isActive ? "bg-[var(--app-primary)]/10" : "",
                    ].join(" ")}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  {item.name}
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  </nav>
);

export const sidebarNavItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
  { name: "Accounts", path: "/accounts", icon: Wallet },
  { name: "Loans", path: "/loans", icon: Landmark },
  { name: "Budgets", path: "/budgets", icon: PiggyBank },
  { name: "Goals", path: "/goals", icon: Target },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Recurring", path: "/recurring", icon: Repeat },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Profile", path: "/profile", icon: User },
];

export default BottomNav;
