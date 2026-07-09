import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, PlusCircle, User, LogOut, Activity } from 'lucide-react';
import { clearStoredToken } from '../api';

interface LayoutProps {
  children: ReactNode;
  user: { full_name: string; email: string } | null;
  onLogoutClick: () => void;
}

export default function Layout({ children, user, onLogoutClick }: LayoutProps) {
  const navigate = useNavigate();

  const navigationItems = [
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Biomarkers', path: '/biomarkers', icon: TrendingUp },
    { name: 'Add Entry', path: '/add-entry', icon: PlusCircle },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans" id="app-layout-root">
      {/* Sidebar for Desktop */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white"
        id="desktop-sidebar"
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">Blood Tracker</h1>
            <span className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">Clinical Dashboard</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-4 py-6" aria-label="Main Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 border-l-4 border-teal-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                id={`sidebar-link-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer / Logout */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          {user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onLogoutClick}
            className="flex w-full min-h-[44px] items-center gap-3 rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            id="sidebar-logout-btn"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-screen pb-16 md:pb-0" id="main-content-wrapper">
        {/* Top bar on Desktop / Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Blood Tracker</h1>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-slate-500">Welcome back</h2>
            <p className="text-base font-bold text-slate-900">{user?.full_name || 'Guest User'}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs bg-teal-50 text-teal-800 border border-teal-100 rounded-full px-2.5 py-1 font-semibold">
              Real-time API Connection
            </span>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8" id="page-main-container">
          <div className="mx-auto max-w-5xl w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Reports / Biomarkers / Add Entry / Profile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-slate-200 bg-white md:hidden shadow-lg safe-bottom"
        aria-label="Mobile Navigation"
        id="mobile-bottom-nav"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                  isActive
                    ? 'text-teal-800 border-t-2 border-teal-700 bg-teal-50/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
              id={`mobile-link-${item.name.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="h-5.5 w-5.5" />
              <span className="text-[10px] font-bold tracking-tight">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
