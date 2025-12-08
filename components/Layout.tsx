
import React from 'react';
import { Home, Briefcase, CheckSquare, Calendar, Users, Shield, MessageSquare, LogOut, Contact as ContactIcon } from 'lucide-react';
import { User, AppState } from '../types';
import { dataService } from '../services/dataService';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: AppState['view'];
  onNavigate: (view: AppState['view']) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onNavigate, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'deals', label: 'All Deals', icon: <Briefcase size={20} /> },
    { id: 'contacts', label: 'Contacts', icon: <ContactIcon size={20} /> },
    { id: 'mytasks', label: 'My Tasks', icon: <CheckSquare size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={20} /> },
  ];

  if (user.role === 'admin') {
    navItems.push({ id: 'team', label: 'Team', icon: <Users size={20} /> });
  }

  const handleLogout = () => {
    dataService.logout();
    onLogout();
  };

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

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div 
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${currentView === 'profile' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            onClick={() => onNavigate('profile')}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              {user.initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                {user.role === 'admin' && <Shield size={12} className="text-yellow-400" />}
              </div>
              <p className="text-xs text-slate-500">View Profile</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
};
