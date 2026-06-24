import React, { useEffect } from "react";
import {
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { sidebarNavItems } from "./BottomNav";
import { useTheme } from "../context/ThemeContext";
import { getInitials } from "../utils/format";

const Sidebar = ({ mobileOpen = false, onClose, collapsed = false, onToggleCollapse }) => {
  const user = useSelector((state) => state.user);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const initials = getInitials(user?.userName);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const quickActions = [
    { label: "Add Txn", path: "/transactions/new", icon: Plus },
    { label: "Add Account", path: "/accounts/new", icon: Wallet },
  ];

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <nav
        className={[
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          "bg-[var(--app-sidebar)] text-[var(--app-sidebar-text)]",
          "border-r border-white/5 shadow-xl transition-all duration-300 ease-out",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        ].join(" ")}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10 min-h-[64px]">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-secondary)] flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-white" />
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold tracking-tight truncate">FinTrack</h2>
              <p className="text-[10px] text-[var(--app-sidebar-muted)]">Personal Finance</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden ml-auto rounded-xl hover:bg-white/10 p-2 transition"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex ml-auto rounded-xl hover:bg-white/10 p-2 transition"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Quick actions */}
        {!collapsed ? (
          <div className="px-3 py-3 flex gap-2">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.path}
                  type="button"
                  onClick={() => { navigate(a.path); onClose?.(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition"
                >
                  <Icon size={14} />
                  {a.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Menu */}
        <ul className="flex-1 mt-1 px-2 overflow-y-auto space-y-0.5">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  title={collapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                      isActive
                        ? "bg-[var(--app-primary)] text-white shadow-lg shadow-indigo-500/20"
                        : "text-[var(--app-sidebar-muted)] hover:bg-white/10 hover:text-white",
                      collapsed ? "justify-center" : "",
                    ].join(" ")
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed ? <span className="truncate">{item.name}</span> : null}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={[
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
              "text-[var(--app-sidebar-muted)] hover:bg-white/10 hover:text-white transition",
              collapsed ? "justify-center" : "",
            ].join(" ")}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed ? <span>{isDark ? "Light Mode" : "Dark Mode"}</span> : null}
          </button>

          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-secondary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.userName || "User"}</p>
                <p className="text-xs text-[var(--app-sidebar-muted)] truncate">{user?.email}</p>
              </div>
            ) : null}
          </NavLink>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
