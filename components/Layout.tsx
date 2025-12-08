
import React, { useState, useEffect, useRef } from 'react';
import { Home, Briefcase, CheckSquare, Calendar, Users, Shield, MessageSquare, LogOut, Contact as ContactIcon, DollarSign, Search, Bell, X, ArrowRight, Sparkles } from 'lucide-react';
import { User, AppState, Notification, Deal, Contact, Offer } from '../types';
import { dataService } from '../services/dataService';
import { queryCRM } from '../services/geminiService';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: AppState['view'];
  onNavigate: (view: AppState['view']) => void;
  onLogout: () => void;
  // We can pass handleOpenDeal via context or props, but for now we might trigger it via prop if needed
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onNavigate, onLogout }) => {
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ deals: Deal[], contacts: Contact[], offers: Offer[] } | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // AI Search State
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load notifications
    dataService.getNotifications(user.id).then(setNotifications);

    // Click outside handler for notifications
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user.id]);

  useEffect(() => {
    if (isAIMode) return; // Don't run standard search in AI mode

    // Debounced search
    const timer = setTimeout(async () => {
      if (searchQuery.length > 1) {
        const results = await dataService.globalSearch(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isAIMode]);

  const handleAiQuery = async () => {
      if (!searchQuery.trim() || isAiLoading) return;
      setIsAiLoading(true);
      setAiResponse(null);
      setIsSearchFocused(true); // Keep dropdown open
      
      try {
          const crmData = await dataService.getCRMDataSnapshot();
          const response = await queryCRM(searchQuery, crmData);
          setAiResponse(response);
      } catch (e) {
          setAiResponse("Sorry, I couldn't process that request.");
      } finally {
          setIsAiLoading(false);
      }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'deals', label: 'All Deals', icon: <Briefcase size={20} /> },
    { id: 'offers', label: 'Offers', icon: <DollarSign size={20} /> },
    { id: 'contacts', label: 'Contacts', icon: <ContactIcon size={20} /> },
    { id: 'mytasks', label: 'Tasks', icon: <CheckSquare size={20} /> }, // Renamed from My Tasks
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

  const handleMarkRead = async (id: string) => {
    await dataService.markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearNotifications = async () => {
    await dataService.clearNotifications(user.id);
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all z-20">
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
                currentView === item.id
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

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm relative">
            {/* Global Search / AI Bar */}
            <div className={`flex-1 max-w-xl relative transition-all duration-300 ${isAIMode ? 'max-w-2xl' : ''}`}>
                <div className={`relative flex items-center border rounded-lg overflow-hidden transition-colors ${isAIMode ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-200'}`}>
                    <div className={`pl-3 pr-2 py-2.5 ${isAIMode ? 'text-purple-600' : 'text-gray-400'}`}>
                        {isAIMode ? <Sparkles size={18} className="animate-pulse" /> : <Search size={18} />}
                    </div>
                    
                    <input 
                        className={`w-full py-2 bg-white text-sm text-gray-900 focus:outline-none placeholder-gray-400`}
                        placeholder={isAIMode ? "Ask Nexus AI (e.g. 'What deals are closing this week?')" : "Search Deals, Contacts, Offers..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (isAIMode) handleAiQuery();
                            }
                        }}
                    />

                    {/* AI Toggle Button */}
                    <button 
                        onClick={() => {
                            setIsAIMode(!isAIMode);
                            setSearchQuery('');
                            setSearchResults(null);
                            setAiResponse(null);
                        }}
                        className={`px-3 py-1 mr-1 rounded text-xs font-bold transition-colors ${isAIMode ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        title={isAIMode ? "Switch to Search" : "Switch to AI Mode"}
                    >
                        {isAIMode ? "AI ON" : "AI OFF"}
                    </button>

                    {searchQuery && (
                         <button 
                            className="px-2 text-gray-400 hover:text-gray-600"
                            onClick={() => { setSearchQuery(''); setSearchResults(null); setAiResponse(null); }}
                         >
                            <X size={16} />
                         </button>
                    )}
                </div>

                {/* Dropdown Results */}
                {isSearchFocused && (searchQuery.length > 1 || aiResponse || isAiLoading) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50">
                        {/* AI LOADING */}
                        {isAIMode && isAiLoading && (
                             <div className="p-6 text-center text-purple-600">
                                 <Sparkles size={24} className="mx-auto mb-2 animate-spin" />
                                 <p className="text-sm font-medium">Thinking...</p>
                             </div>
                        )}

                        {/* AI RESPONSE */}
                        {isAIMode && aiResponse && (
                            <div className="p-4">
                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Sparkles size={12}/> Nexus AI Answer
                                </h4>
                                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    {aiResponse}
                                </div>
                            </div>
                        )}

                        {/* STANDARD SEARCH RESULTS */}
                        {!isAIMode && searchResults && (
                            <>
                                {searchResults.deals.length === 0 && searchResults.contacts.length === 0 && searchResults.offers.length === 0 && (
                                    <div className="p-4 text-center text-gray-500 text-sm">No results found.</div>
                                )}
                                
                                {searchResults.deals.length > 0 && (
                                    <div className="py-2">
                                        <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Deals</h4>
                                        {searchResults.deals.map(d => (
                                            <div key={d.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('deals')}>
                                                <div className="font-medium text-gray-800 text-sm">{d.address}</div>
                                                <div className="text-xs text-gray-500">{d.clientName} • {d.status}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {searchResults.contacts.length > 0 && (
                                    <div className="py-2 border-t border-gray-100">
                                        <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contacts</h4>
                                        {searchResults.contacts.map(c => (
                                            <div key={c.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('contacts')}>
                                                <div className="font-medium text-gray-800 text-sm">{c.name}</div>
                                                <div className="text-xs text-gray-500">{c.type} • {c.email}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {searchResults.offers.length > 0 && (
                                    <div className="py-2 border-t border-gray-100">
                                        <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Offers</h4>
                                        {searchResults.offers.map(o => (
                                            <div key={o.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('offers')}>
                                                <div className="font-medium text-gray-800 text-sm">{o.clientName}</div>
                                                <div className="text-xs text-gray-500">${o.amount.toLocaleString()} on {o.propertyAddress}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        
                         {/* Dismiss Overlay */}
                         <div 
                            className="fixed inset-0 z-[-1]" 
                            onClick={() => setIsSearchFocused(false)} 
                            style={{ display: isSearchFocused ? 'block' : 'none' }}
                         ></div>
                    </div>
                )}
            </div>

            {/* Notification & User Actions */}
            <div className="flex items-center gap-4 ml-6" ref={notifRef}>
                <div className="relative">
                    <button 
                        className={`p-2 rounded-full transition-colors relative ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 z-50">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-700 text-sm">Notifications</h3>
                                {notifications.length > 0 && (
                                    <button onClick={handleClearNotifications} className="text-xs text-indigo-600 hover:underline">Clear all</button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                        No new notifications.
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => handleMarkRead(notif.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'info' ? 'bg-blue-400' : notif.type === 'success' ? 'bg-green-400' : notif.type === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                                                <div>
                                                    <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notif.title}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                
                <div className="flex items-center gap-2">
                   <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                   </div>
                   <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {user.initials}
                   </div>
                </div>
            </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-hidden relative">
           {children}
        </main>
      </div>
    </div>
  );
};
