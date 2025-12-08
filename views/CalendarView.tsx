
import React, { useState, useEffect } from 'react';
import { Task, Deal, CalendarEvent, GoogleCalendarStatus, User, TaskPriority, TaskStatus } from '../types';
import { Card, Button, Modal, InputGroup } from '../components/Shared';
import { Calendar as CalendarIcon, Check, X, CalendarSearch, Edit2, Plus, Trash2 } from 'lucide-react';
import { dataService } from '../services/dataService';

interface CalendarViewProps {
  tasks: Task[];
  deals: Deal[];
  teamMembers: User[];
  onRefreshData: () => void;
  onOpenDeal: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, deals, teamMembers, onRefreshData, onOpenDeal }) => {
  // Google Calendar State
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatus>('disconnected');
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);

  // Task Edit/Add State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDealId, setFormDealId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formAssignee, setFormAssignee] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Normal');
  const [formStatus, setFormStatus] = useState<TaskStatus>('To Do');

  const handleConnectGoogle = async () => {
    setGoogleStatus('connecting');
    // Simulate auth flow
    setTimeout(async () => {
      const events = await dataService.getGoogleEvents();
      setGoogleEvents(events);
      setGoogleStatus('connected');
    }, 1500);
  };

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

  const getGoogleEventsForDate = (date: Date) => {
    return googleEvents.filter(e => {
      const startDate = new Date(e.start);
      return startDate.getDate() === date.getDate() &&
             startDate.getMonth() === date.getMonth() &&
             startDate.getFullYear() === date.getFullYear();
    });
  };

  // --- Modal Handlers ---

  const openCreateModal = (date: Date) => {
    setModalMode('create');
    setEditingTask(null);
    setFormTitle('');
    // Default to first deal if available
    setFormDealId(deals.length > 0 ? deals[0].id : '');
    // Format date as YYYY-MM-DD
    setFormDate(date.toISOString().split('T')[0]);
    setFormAssignee(teamMembers[0]?.displayName || 'Unassigned');
    setFormPriority('Normal');
    setFormStatus('To Do');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setModalMode('edit');
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDealId(task.dealId);
    setFormDate(new Date(task.dueDate).toISOString().split('T')[0]);
    setFormAssignee(task.assignedToName);
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setIsModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!formTitle || !formDealId) return;

    // Construct Date object ensuring time is preserved or set to end of day if desired.
    // For simplicity, we use the date selected at current time or noon.
    const dueDateObj = new Date(formDate);
    dueDateObj.setHours(12, 0, 0, 0);

    if (modalMode === 'create') {
      await dataService.createTask({
        dealId: formDealId,
        title: formTitle,
        assignedToName: formAssignee,
        priority: formPriority,
        status: formStatus,
        dueDate: dueDateObj.toISOString()
      });
    } else if (modalMode === 'edit' && editingTask) {
      await dataService.updateTask({
        ...editingTask,
        dealId: formDealId,
        title: formTitle,
        assignedToName: formAssignee,
        priority: formPriority,
        status: formStatus,
        dueDate: dueDateObj.toISOString()
      });
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  const handleDeleteTask = async () => {
    if (editingTask && window.confirm('Delete this task?')) {
      await dataService.deleteTask(editingTask.id);
      setIsModalOpen(false);
      onRefreshData();
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon size={32} className="text-indigo-600" />
            Upcoming Schedule
          </h2>
          <p className="text-gray-500 mt-1">Next 14 days of activity.</p>
        </div>

        {/* Google Calendar Connect Button */}
        <div>
          {googleStatus === 'disconnected' && (
             <Button variant="outline" onClick={handleConnectGoogle} icon={<CalendarSearch size={16} />}>
               Sync Google Calendar
             </Button>
          )}
          {googleStatus === 'connecting' && (
             <Button variant="outline" disabled icon={<CalendarSearch size={16} className="animate-pulse" />}>
               Connecting...
             </Button>
          )}
          {googleStatus === 'connected' && (
             <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200">
               <Check size={16} /> Google Calendar Synced
             </span>
          )}
        </div>
      </header>

      <div className="space-y-6">
        {dates.map((date) => {
          const dayTasks = getTasksForDate(date);
          const dayGoogleEvents = getGoogleEventsForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
            <div key={date.toISOString()} className="flex gap-6 group/date">
              <div className="w-24 flex-shrink-0 text-center pt-2">
                <div className={`text-sm font-bold uppercase ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-2xl font-light ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>
                <button 
                  onClick={() => openCreateModal(date)}
                  className="mt-2 text-indigo-600 opacity-0 group-hover/date:opacity-100 hover:bg-indigo-50 p-1 rounded transition-all"
                  title="Add Task to this date"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="flex-1 space-y-3 pb-6 border-b border-gray-100 min-h-[80px]">
                {/* Google Events */}
                {dayGoogleEvents.map(event => (
                  <div key={event.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                     <div>
                        <h4 className="font-semibold text-blue-900 text-sm">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-xs text-blue-600">
                             {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                           <span className="text-[10px] uppercase font-bold text-blue-400 border border-blue-200 px-1 rounded">Google</span>
                        </div>
                     </div>
                  </div>
                ))}

                {/* App Tasks */}
                {dayTasks.map(task => {
                  const deal = deals.find(d => d.id === task.dealId);
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => deal && onOpenDeal(deal.id)}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group relative"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {deal?.address || 'Unknown Deal'}
                          </span>
                          <span className="text-xs text-gray-400">• Assigned to {task.assignedToName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {task.priority === 'High' && (
                           <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase">High</span>
                         )}
                         <button 
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                            title="Edit Task"
                          >
                            <Edit2 size={16} />
                          </button>
                      </div>
                    </div>
                  );
                })}
                
                {dayTasks.length === 0 && dayGoogleEvents.length === 0 && (
                   <div className="text-gray-300 text-sm py-2 italic">No tasks scheduled</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Task Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalMode === 'create' ? 'Add Task' : 'Edit Task'}
      >
        <div className="space-y-4">
          <InputGroup label="Task Title">
            <input 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="e.g. Call Client"
            />
          </InputGroup>

          <InputGroup label="Associated Deal">
            <select 
              className="w-full border border-gray-300 rounded-md p-2 bg-white"
              value={formDealId}
              onChange={e => setFormDealId(e.target.value)}
              disabled={deals.length === 0}
            >
              {deals.map(d => (
                <option key={d.id} value={d.id}>{d.address} - {d.clientName}</option>
              ))}
              {deals.length === 0 && <option value="">No deals available</option>}
            </select>
          </InputGroup>

          <div className="grid grid-cols-2 gap-4">
             <InputGroup label="Due Date">
                <input 
                  type="date"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                />
              </InputGroup>
              <InputGroup label="Assignee">
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  value={formAssignee}
                  onChange={e => setFormAssignee(e.target.value)}
                >
                  {teamMembers.map(u => (
                    <option key={u.id} value={u.displayName}>{u.displayName}</option>
                  ))}
                </select>
              </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Priority">
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  value={formPriority}
                  onChange={e => setFormPriority(e.target.value as TaskPriority)}
                >
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </InputGroup>
              <InputGroup label="Status">
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as TaskStatus)}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Completed">Completed</option>
                </select>
              </InputGroup>
          </div>

          <div className="pt-2 flex gap-3">
            {modalMode === 'edit' && (
              <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDeleteTask}>
                Delete
              </Button>
            )}
            <Button className="w-full flex-1" onClick={handleSaveTask}>
              {modalMode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
