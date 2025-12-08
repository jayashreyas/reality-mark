import React from 'react';
import { Deal, Task, User, AppState } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { ArrowRight, Briefcase, CheckCircle, Clock } from 'lucide-react';

interface DashboardProps {
  deals: Deal[];
  tasks: Task[];
  user: User;
  onNavigate: (view: AppState['view']) => void;
  onOpenDeal: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ deals, tasks, user, onNavigate, onOpenDeal }) => {
  const activeDeals = deals.filter(d => ['Lead', 'Active', 'Under Contract'].includes(d.status));
  const myTasks = tasks
    .filter(t => t.assignedToName === user.displayName && t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5); // Show top 5
  
  const closedCount = deals.filter(d => d.status === 'Closed').length;

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card className="flex items-center p-6">
      <div className={`p-4 rounded-full ${color} text-white mr-4`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium uppercase">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );

  return (
    <div className="p-8 overflow-y-auto h-full space-y-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.displayName.split(' ')[0]} 👋</h2>
        <p className="text-gray-500 mt-2">Here's what's happening in your real estate pipeline today.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <StatCard 
          title="Closed Deals" 
          value={closedCount} 
          icon={<CheckCircle size={24} />} 
          color="bg-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Deals Widget */}
        <div className="space-y-4">
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
                    <th className="px-6 py-3">Client</th>
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
                      <td className="px-6 py-4 font-medium text-gray-900">{deal.address}</td>
                      <td className="px-6 py-4 text-gray-600">{deal.clientName}</td>
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
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No active deals found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

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
                <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                  You're all caught up! 🎉
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
