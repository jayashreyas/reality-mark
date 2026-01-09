
import React, { useState, useEffect } from 'react';
import { Listing, Task, User, AppState, Reminder, Offer } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { ArrowRight, Briefcase, Clock, Plus, DollarSign, Sparkles } from 'lucide-react';
import { dataService } from '../services/dataService';
import { getDailyBriefing } from '../services/geminiService';

interface DashboardProps {
  listings: Listing[];
  tasks: Task[];
  user: User;
  onNavigate: (view: AppState['view']) => void;
  onOpenListing: (id: string) => void;
  offers: Offer[];
  onCreateListing: () => void;
  onRefreshData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  listings, tasks, user, onNavigate, onOpenListing, offers, onCreateListing, onRefreshData 
}) => {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBriefing();
  }, [listings.length, offers.length]);

  const loadBriefing = async () => {
    setIsLoading(true);
    try {
      const b = await getDailyBriefing({ listings, tasks, offers, contacts: [], teamMembers: [], user, deals: [] } as any);
      setBriefing(b);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const activeListings = listings.filter(l => l.status === 'Active' || l.status === 'Coming Soon');

  return (
    <div className="p-8 overflow-y-auto h-full space-y-8 bg-slate-50">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Morning, {user.displayName?.split(' ')[0]}</h2>
          <p className="text-slate-500 mt-2 font-medium">Your pipelines are active with {activeListings.length} listings and {offers.length} offers.</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" icon={<Sparkles size={18} className="text-purple-600" />} onClick={loadBriefing} className="rounded-xl font-bold">Refresh Briefing</Button>
            <Button onClick={onCreateListing} icon={<Plus size={18} />} className="rounded-xl font-black shadow-lg shadow-indigo-100">New Listing</Button>
        </div>
      </header>

      {briefing && (
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white shadow-sm">
            <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600"><Sparkles size={20} /></div>
                <div>
                    <h3 className="text-xs font-black text-purple-900 uppercase tracking-widest mb-2">Nexus Intelligence</h3>
                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">{briefing}</div>
                </div>
            </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center p-6 border-b-4 border-b-blue-500">
          <div className="p-4 rounded-2xl bg-blue-500 text-white mr-4 shadow-lg"><Briefcase size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Listings</p>
            <p className="text-3xl font-black text-slate-900">{activeListings.length}</p>
          </div>
        </Card>
        <Card className="flex items-center p-6 border-b-4 border-b-emerald-500">
          <div className="p-4 rounded-2xl bg-emerald-500 text-white mr-4 shadow-lg"><DollarSign size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Offers</p>
            <p className="text-3xl font-black text-slate-900">{offers.filter(o => o.status === 'Submitted').length}</p>
          </div>
        </Card>
        <Card className="flex items-center p-6 border-b-4 border-b-amber-500">
          <div className="p-4 rounded-2xl bg-amber-500 text-white mr-4 shadow-lg"><Clock size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgent Tasks</p>
            <p className="text-3xl font-black text-slate-900">{tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Current Listing Pipeline</h3>
          <Card noPadding className="rounded-3xl overflow-hidden border-none shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr><th className="px-6 py-4">Property</th><th className="px-6 py-4 text-right">Stage</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {listings.slice(0, 5).map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onOpenListing(l.id)}>
                    <td className="px-6 py-5 font-bold text-slate-800">{l.address}</td>
                    <td className="px-6 py-5 text-right"><Badge color="blue">{l.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Buyer Offer Progress</h3>
          <Card noPadding className="rounded-3xl overflow-hidden border-none shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr><th className="px-6 py-4">Buyer</th><th className="px-6 py-4 text-right">Offer</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {offers.slice(0, 5).map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5 font-bold text-slate-800">{o.buyer_name}</td>
                    <td className="px-6 py-5 text-right font-black text-indigo-600">${o.offer_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
};
