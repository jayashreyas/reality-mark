import React from 'react';
import { Task, Deal } from '../types';
import { Card } from '../components/Shared';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  deals: Deal[];
  onOpenDeal: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, deals, onOpenDeal }) => {
  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate.getDate() === date.getDate() &&
             dueDate.getMonth() === date.getMonth() &&
             dueDate.getFullYear() === date.getFullYear() &&
             t.status !== 'Completed';
    });
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CalendarIcon size={32} className="text-indigo-600" />
          Upcoming Schedule
        </h2>
        <p className="text-gray-500 mt-1">Next 14 days of activity.</p>
      </header>

      <div className="space-y-6">
        {dates.map((date) => {
          const dayTasks = getTasksForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();
          
          if (dayTasks.length === 0) return null;

          return (
            <div key={date.toISOString()} className="flex gap-6">
              <div className="w-24 flex-shrink-0 text-center pt-2">
                <div className={`text-sm font-bold uppercase ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-2xl font-light ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>
              </div>
              
              <div className="flex-1 space-y-3 pb-6 border-b border-gray-100">
                {dayTasks.map(task => {
                  const deal = deals.find(d => d.id === task.dealId);
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => deal && onOpenDeal(deal.id)}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {deal?.address}
                          </span>
                          <span className="text-xs text-gray-400">• Assigned to {task.assignedToName}</span>
                        </div>
                      </div>
                      {task.priority === 'High' && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase">High</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {tasks.filter(t => t.status !== 'Completed').length === 0 && (
           <div className="text-center py-12 text-gray-400">No upcoming tasks scheduled.</div>
        )}
      </div>
    </div>
  );
};
