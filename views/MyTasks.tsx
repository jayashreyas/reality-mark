import React from 'react';
import { Task, Deal, User } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { CheckSquare, ArrowRight, User as UserIcon } from 'lucide-react';
import { dataService } from '../services/dataService';

interface MyTasksProps {
  tasks: Task[];
  deals: Deal[];
  user: User;
  teamMembers: User[];
  onRefreshData: () => void;
  onOpenDeal: (id: string) => void;
}

export const MyTasks: React.FC<MyTasksProps> = ({ tasks, deals, user, teamMembers, onRefreshData, onOpenDeal }) => {
  const myTasks = tasks.filter(t => t.assignedToName === user.displayName);

  const handleStatusChange = async (task: Task, status: string) => {
    await dataService.updateTask({ ...task, status: status as any });
    onRefreshData();
  };

  const handleAssigneeChange = async (task: Task, assignee: string) => {
    await dataService.updateTask({ ...task, assignedToName: assignee });
    onRefreshData();
  };

  const statusColors: Record<string, string> = {
    'To Do': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Waiting': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800 line-through opacity-70'
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
       <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CheckSquare size={32} className="text-indigo-600" />
          My Tasks
        </h2>
        <p className="text-gray-500 mt-1">Everything assigned to you.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myTasks.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">No tasks assigned to you.</p>}
        {myTasks.map(task => {
          const deal = deals.find(d => d.id === task.dealId);
          return (
            <Card key={task.id} className="relative flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {task.priority}
                  </span>
                  <div className="text-xs text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                </div>
                <h3 className={`font-semibold text-gray-900 mb-2 ${task.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
                <p 
                  className="text-sm text-indigo-600 mb-4 cursor-pointer hover:underline flex items-center gap-1"
                  onClick={() => deal && onOpenDeal(deal.id)}
                >
                  <ArrowRight size={12} /> {deal?.address || 'Unknown Deal'}
                </p>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-2">
                    <UserIcon size={14} className="text-gray-400" />
                    <select
                        className="text-xs w-full bg-transparent border-none p-0 text-gray-600 focus:ring-0 cursor-pointer"
                        value={task.assignedToName}
                        onChange={(e) => handleAssigneeChange(task, e.target.value)}
                        title="Transfer task"
                    >
                        {teamMembers.map(u => <option key={u.id} value={u.displayName}>{u.displayName}</option>)}
                    </select>
                </div>
                <select 
                  className={`w-full text-sm p-2 rounded border-none focus:ring-0 cursor-pointer font-medium ${statusColors[task.status]}`}
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value)}
                >
                  <option>To Do</option>
                  <option>In Progress</option>
                  <option>Waiting</option>
                  <option>Completed</option>
                </select>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};