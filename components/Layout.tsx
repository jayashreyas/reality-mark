
import React, { useState } from 'react';
import { 
  Home, Briefcase, DollarSign, MessageSquare, CheckSquare, 
  Calendar, Contact as ContactIcon, LogOut, Search, Bell, Sparkles, X, FileUp
} from 'lucide-react';
import { User, AppState } from '../types';
import { AIChatDrawer } from './AIChatDrawer';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: AppState['view'];
  onNavigate: (view: AppState['view']) => void;
  onLogout: () => void;
  onOpenImport: () => void; // New prop for global access
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onNavigate, onLogout, onOpenImport }) => {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'listings', label: 'Listing Pipeline', icon: <Briefcase size={20} /> },
    { id: 'offers', label: 'Offer Pipeline', icon: <DollarSign size={20} /> },
    { id: 'contacts', label: 'Contacts', icon: <ContactIcon size={20} /> },
    { id: 'mytasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 z-20 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg text-white">
            <Briefcase size={20} />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Reality Mark</h1>
        </div>

        <div className="px-4 py-6">
          <button 
            onClick={onOpenImport}
            className="w-full group flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm mb-4"
          >
            <div className="bg-indigo-500/20 group-hover:bg-white/20 p-1.5 rounded-lg transition-colors">
              <FileUp size={18} />
            </div>
            <span className="font-black text-xs uppercase tracking-widest">Universal Import</span>
          </button>
        </div>

        <nav className="flex-1 p-4 pt-0 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black border-2 border-slate-700 shadow-lg">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">Agent Portal</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-xs text-slate-500 hover:text-rose-400 transition-colors font-bold uppercase tracking-tighter">
            <LogOut size={14} /> Exit System
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              placeholder="Search pipelines, contacts, or tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAiDrawerOpen(true)}
              className="p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center gap-2 px-5 border border-indigo-100 shadow-sm active:scale-95"
            >
              <Sparkles size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Ask Nexus AI</span>
            </button>
            <button className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>

      <AIChatDrawer isOpen={isAiDrawerOpen} onClose={() => setIsAiDrawerOpen(false)} />
    </div>
  );
};
