import React, { useState, useEffect } from 'react';
import { Deal, Task, User, AppState, Reminder } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { ArrowRight, Briefcase, CheckCircle, Clock, TrendingUp, Bell, Plus, Trash2 } from 'lucide-react';
import { dataService } from '../services/dataService';

interface DashboardProps {
  deals: Deal[];
  tasks: Task[];
  user: User;
  onNavigate: (view: AppState['view']) => void;
  onOpenDeal: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ deals, tasks, user, onNavigate, onOpenDeal }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState('');

  const activeDeals = deals.filter(d => ['Lead', 'Active', 'Under Contract'].includes(d.status));
  const myTasks = tasks
    .filter(t => t.assignedToName === user.displayName && t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5); // Show top 5
  
  useEffect(() => {
    dataService.getReminders(user.id).then(setReminders);
  }, [user.id]);

  const handleAddReminder = async () => {
    if (!newReminder.trim()) return;
    const r = await dataService.addReminder(user.id, newReminder);
    setReminders([...reminders, r]);
    setNewReminder('');
  };

  const handleToggleReminder = async (id: string) => {
    await dataService.toggleReminder(id);
    // Optimistic update
    setReminders(reminders.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
  };

  const handleDeleteReminder = async (id: string) => {
    await dataService.deleteReminder(id);
    setReminders(reminders.filter(r => r.id !== id));
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card className="flex items-center p-6">
      <div className={`p-4 rounded-full ${color} text-white mr-4`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );

  return (
    <div className="p-8 overflow-y-auto h-full space-y-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.displayName.split(' ')[0]} 👋</h2>
        <p className="text-gray-500 mt-2">Here's what's happening in your team today.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Active Deals" 
          value={activeDeals.length} 
          icon={<Briefcase size={24} />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="My Open Tasks" 
          value={tasks.filter(t => t.assignedToName === user.displayName && t.status !== 'Completed').length} 
          icon={<Clock size={24} />} 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Deals Widget */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Active Deals</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('deals')}>View All</Button>
          </div>
          <Card noPadding className="h-full">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Property</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeDeals.slice(0, 5).map(deal => (
                    <tr 
                      key={deal.id} 
                      onClick={() => onOpenDeal(deal.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {deal.address}
                        <div className="text-xs text-gray-500 font-normal">{deal.clientName}</div>
                      </td>
                      <td className="px-6 py-4">
                         <Badge color={
                           deal.status === 'Lead' ? 'yellow' : 
                           deal.status === 'Active' ? 'blue' : 
                           deal.status === 'Under Contract' ? 'purple' : 'gray'
                         }>
                           {deal.status}
                         </Badge>
                      </td>
                    </tr>
                  ))}
                  {activeDeals.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-gray-500">No active deals found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: My Tasks + Reminders */}
        <div className="space-y-8">
          
          {/* My Tasks Widget */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">My Priority Tasks</h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('mytasks')}>View All</Button>
            </div>
            <div className="space-y-3">
              {myTasks.map(task => {
                const deal = deals.find(d => d.id === task.dealId);
                return (
                  <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center p-4">
                    <div onClick={() => onOpenDeal(task.dealId)}>
                      <div className="flex items-center gap-2 mb-1">
                        {task.priority === 'High' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        <span className="font-semibold text-gray-900">{task.title}</span>
                      </div>
                      <p className="text-xs text-gray-500">{deal?.address} • Due {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                    <Button variant="outline" size="sm" icon={<ArrowRight size={14} />} onClick={() => onOpenDeal(task.dealId)}>
                      View
                    </Button>
                  </Card>
                );
              })}
              {myTasks.length === 0 && (
                  <div className="text-center py-6 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                    You're all caught up! 🎉
                  </div>
              )}
            </div>
          </div>

          {/* Quick Reminders Widget */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell size={20} className="text-indigo-600" />
                Quick Reminders
              </h3>
            </div>
            <Card className="p-4 space-y-3">
               <div className="flex gap-2">
                 <input 
                    className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    placeholder="e.g. Call Mom, Buy Milk"
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddReminder()}
                 />
                 <Button size="sm" onClick={handleAddReminder}><Plus size={16} /></Button>
               </div>
               <div className="space-y-2">
                 {reminders.map(r => (
                   <div key={r.id} className="flex justify-between items-center group bg-gray-50 p-2 rounded hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={r.isCompleted}
                          onChange={() => handleToggleReminder(r.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                        <span className={`text-sm text-gray-700 truncate ${r.isCompleted ? 'line-through text-gray-400' : ''}`}>
                          {r.content}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteReminder(r.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                   </div>
                 ))}
                 {reminders.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No personal reminders.</p>}
               </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};