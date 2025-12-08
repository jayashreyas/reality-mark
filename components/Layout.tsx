import React from 'react';
import { Home, Briefcase, CheckSquare, Calendar, User as UserIcon, LogOut } from 'lucide-react';
import { User, AppState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: AppState['view'];
  onNavigate: (view: AppState['view']) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'deals', label: 'All Deals', icon: <Briefcase size={20} /> },
    { id: 'mytasks', label: 'My Tasks', icon: <CheckSquare size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg text-white">
              <Home size={20} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Reality Mark</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                currentView === item.id || (item.id === 'deals' && currentView === 'deal-room')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              {user.initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500">View Profile</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
};
