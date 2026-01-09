
import React, { useState, useEffect } from 'react';
import { Deal, Task, User, AppState, Reminder, Offer, CrmData } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { ArrowRight, Briefcase, Clock, Bell, Plus, Trash2, DollarSign, Sparkles, Upload } from 'lucide-react';
import { dataService } from '../services/dataService';
import { getDailyBriefing } from '../services/geminiService';
import { SmartImportModal } from '../components/SmartImportModal';

interface DashboardProps {
  deals: Deal[];
  tasks: Task[];
  user: User;
  onNavigate: (view: AppState['view']) => void;
  onOpenDeal: (id: string) => void;
  offers: Offer[];
  onCreateDeal: () => void;
  onRefreshData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  deals, tasks, user, onNavigate, onOpenDeal, offers, onCreateDeal, onRefreshData 
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const activeDeals = deals.filter(d => ['Lead', 'Active', 'Under Contract', 'Pending'].includes(d.status));
  const myTasks = tasks
    .filter(t => t.assignedToName === user.displayName && t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5); 
  
  useEffect(() => {
    dataService.getReminders(user.id).then(setReminders);
    loadBriefing();
  }, [user.id, deals.length]);

  const loadBriefing = async () => {
    if (deals.length === 0) return;
    setIsBriefingLoading(true);
    try {
      const contacts = await dataService.getContacts();
      const briefingText = await getDailyBriefing({
        deals,
        tasks,
        offers,
        contacts,
        teamMembers: [],
        user
      });
      setBriefing(briefingText);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.trim()) return;
    const r = await dataService.addReminder(user.id, newReminder);
    setReminders([...reminders, r]);
    setNewReminder('');
  };

  const handleToggleReminder = async (id: string) => {
    await dataService.toggleReminder(id);
    setReminders(reminders.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
  };

  const handleDeleteReminder = async (id: string) => {
    await dataService.deleteReminder(id);
    setReminders(reminders.filter(r => r.id !== id));
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card className="flex items-center p-6 border-b-4" style={{ borderColor: color.replace('bg-', '') }}>
      <div className={`p-4 rounded-xl ${color} text-white mr-4 shadow-lg`}>{icon}</div>
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </Card>
  );

  return (
    <div className="p-8 overflow-y-auto h-full space-y-8 bg-gray-50">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back, {user.displayName?.split(' ')[0] || 'Agent'}</h2>
          <p className="text-gray-500 mt-2 font-medium">Pipeline visibility is high today.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" icon={<Upload size={18}/>} onClick={() => setIsImportModalOpen(true)} className="rounded-xl font-bold">Import</Button>
            <Button variant="outline" icon={<Sparkles size={18} className="text-purple-600" />} onClick={loadBriefing} disabled={isBriefingLoading} className="rounded-xl font-bold">
                {isBriefingLoading ? 'Syncing...' : 'Insights'}
            </Button>
            <Button onClick={onCreateDeal} icon={<Plus size={18} />} className="rounded-xl font-bold shadow-lg shadow-indigo-100">New Transaction</Button>
        </div>
      </header>

      {briefing && (
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white overflow-hidden group shadow-sm">
            <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600 flex-shrink-0">
                    <Sparkles size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-black text-purple-900 uppercase tracking-widest mb-2">Nexus Daily Intelligence</h3>
                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line prose-sm prose-indigo font-medium">
                        {briefing}
                    </div>
                </div>
            </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Deals" value={activeDeals.length} icon={<Briefcase size={24} />} color="bg-blue-500" />
        <StatCard title="Active Offers" value={offers.filter(o => o.status === 'Pending').length} icon={<DollarSign size={24} />} color="bg-emerald-500" />
        <StatCard title="Open Tasks" value={tasks.filter(t => t.assignedToName === user.displayName && t.status !== 'Completed').length} icon={<Clock size={24} />} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Current Pipeline</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('deals')}>Manage All</Button>
          </div>
          <Card noPadding className="h-full border-none shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-400 uppercase bg-white border-b tracking-widest font-black">
                  <tr>
                    <th className="px-6 py-4">Property Address</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {activeDeals.slice(0, 5).map(deal => (
                    <tr key={deal.id} onClick={() => onOpenDeal(deal.id)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-800">
                        {deal.address}
                        <div className="text-[10px] text-gray-400 uppercase font-black mt-0.5 tracking-tighter">{deal.client_name}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <Badge color={deal.status === 'Closed' ? 'purple' : 'blue'}>{deal.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {activeDeals.length === 0 && (
                    <tr><td colSpan={2} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-xs">No active records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">My Tasks</h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('mytasks')}>All</Button>
            </div>
            <div className="space-y-3">
              {myTasks.map(task => {
                const deal = deals.find(d => d.id === task.dealId);
                return (
                  <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center p-4 rounded-2xl border-gray-200">
                    <div onClick={() => task.dealId && onOpenDeal(task.dealId)}>
                      <div className="flex items-center gap-2 mb-1">
                        {task.priority === 'High' && <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm" />}
                        <span className="font-bold text-slate-800">{task.title}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{deal?.address || 'General Task'}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Reminders</h3>
            </div>
            <Card className="p-4 space-y-3 rounded-2xl">
               <div className="flex gap-2">
                 <input className="flex-1 text-sm border-2 border-gray-100 rounded-xl px-3 py-2 focus:border-indigo-500 outline-none" placeholder="Quick thought..." value={newReminder} onChange={(e) => setNewReminder(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddReminder()}/>
                 <Button size="sm" onClick={handleAddReminder} className="rounded-xl"><Plus size={16} /></Button>
               </div>
               <div className="space-y-2">
                 {reminders.map(r => (
                   <div key={r.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <input type="checkbox" checked={r.isCompleted} onChange={() => handleToggleReminder(r.id)} className="rounded-md border-2 text-indigo-600 h-4 w-4 cursor-pointer"/>
                        <span className={`text-sm font-bold text-slate-700 ${r.isCompleted ? 'line-through text-gray-300' : ''}`}>{r.content}</span>
                      </div>
                   </div>
                 ))}
               </div>
            </Card>
          </div>
        </div>
      </div>

      <SmartImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => onRefreshData()} />
    </div>
  );
};
