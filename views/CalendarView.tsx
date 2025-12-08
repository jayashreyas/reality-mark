
import React, { useState, useEffect } from 'react';
import { Task, Deal, CalendarEvent, GoogleCalendarStatus, User, TaskPriority, TaskStatus } from '../types';
import { Card, Button, Modal, InputGroup } from '../components/Shared';
import { Calendar as CalendarIcon, Check, X, CalendarSearch, Edit2, Plus, Trash2, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { dataService } from '../services/dataService';

interface CalendarViewProps {
  tasks: Task[];
  deals: Deal[];
  teamMembers: User[];
  onRefreshData: () => void;
  onOpenDeal: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, deals, teamMembers, onRefreshData, onOpenDeal }) => {
  // View State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  // --- Date Logic ---

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  const getGridDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of week (0-6)
    const startDayOfWeek = firstDay.getDay(); 
    
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Calculate padding days from prev month
    const prevMonthDays = new Date(year, month, 0).getDate();
    const paddingStart = Array.from({ length: startDayOfWeek }, (_, i) => {
        const d = new Date(year, month - 1, prevMonthDays - i);
        return d;
    }).reverse();

    // Current month days
    const currentDays = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

    // Calculate padding days for next month to fill 6 rows (42 days)
    const totalDaysSoFar = paddingStart.length + currentDays.length;
    const paddingEnd = Array.from({ length: 42 - totalDaysSoFar }, (_, i) => new Date(year, month + 1, i + 1));

    return [...paddingStart, ...currentDays, ...paddingEnd];
  };

  const displayedDates = viewMode === 'list' ? getDaysInMonth(currentDate) : getGridDates(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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
    setFormDealId(deals.length > 0 ? deals[0].id : '');
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

  // --- Render Helpers ---

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
           <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <CalendarIcon size={32} className="text-indigo-600" />
                Calendar
            </h2>
            <p className="text-gray-500 mt-1">Manage tasks and events.</p>
           </div>
           
           {/* Navigation */}
           <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1 ml-4">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={20}/></button>
              <span className="px-4 font-semibold text-gray-800 min-w-[140px] text-center">{monthName}</span>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={20}/></button>
           </div>
           <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <List size={16} /> List
             </button>
             <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <LayoutGrid size={16} /> Grid
             </button>
          </div>

          {/* Google Sync */}
          {googleStatus === 'disconnected' && (
             <Button variant="outline" size="sm" onClick={handleConnectGoogle} icon={<CalendarSearch size={16} />}>
               Sync Google
             </Button>
          )}
          {googleStatus === 'connecting' && (
             <Button variant="outline" size="sm" disabled icon={<CalendarSearch size={16} className="animate-pulse" />}>
               Syncing...
             </Button>
          )}
          {googleStatus === 'connected' && (
             <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium border border-green-200">
               <Check size={14} /> Synced
             </span>
          )}
        </div>
      </header>

      {/* Calendar Content */}
      <div className="flex-1 overflow-y-auto pr-2">
        
        {/* LIST VIEW */}
        {viewMode === 'list' && (
            <div className="space-y-6">
                {displayedDates.map((date) => {
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
                        title="Add Task"
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
        )}

        {/* GRID VIEW */}
        {viewMode === 'grid' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                            {day}
                        </div>
                    ))}
                </div>
                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
                    {displayedDates.map((date, idx) => {
                        const dayTasks = getTasksForDate(date);
                        const dayEvents = getGoogleEventsForDate(date);
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                        const isToday = new Date().toDateString() === date.toDateString();
                        
                        return (
                            <div 
                                key={idx} 
                                className={`min-h-[120px] bg-white p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50 group/cell ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                                onClick={() => openCreateModal(date)}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {date.getDate()}
                                    </span>
                                    <button className="opacity-0 group-hover/cell:opacity-100 text-indigo-600"><Plus size={14} /></button>
                                </div>
                                
                                <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar">
                                    {dayEvents.map(e => (
                                        <div key={e.id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded truncate border border-blue-100 font-medium">
                                            {e.title}
                                        </div>
                                    ))}
                                    {dayTasks.map(t => (
                                        <div 
                                            key={t.id} 
                                            onClick={(e) => { e.stopPropagation(); openEditModal(t); }}
                                            className={`text-[10px] px-1.5 py-0.5 rounded truncate border cursor-pointer ${
                                                t.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}
                                        >
                                            {t.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

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
