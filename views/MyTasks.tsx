
import React, { useState } from 'react';
import { Task, Deal, User, TaskPriority, TaskStatus } from '../types';
import { Card, Button, Modal, InputGroup } from '../components/Shared';
import { CheckSquare, Search, Plus, Download, Edit2, Trash2 } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Normal');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignee, setFormAssignee] = useState(user.displayName);
  const [formStatus, setFormStatus] = useState<TaskStatus>('To Do');
  const [formDealId, setFormDealId] = useState('');

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.assignedToName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormTitle(task.title);
      setFormPriority(task.priority);
      setFormDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
      setFormAssignee(task.assignedToName);
      setFormStatus(task.status);
      setFormDealId(task.dealId || '');
    } else {
      setEditingTask(null);
      setFormTitle('');
      setFormPriority('Normal');
      setFormDueDate(new Date().toISOString().split('T')[0]);
      setFormAssignee(user.displayName);
      setFormStatus('To Do');
      setFormDealId('');
    }
    setIsModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!formTitle) return;

    if (editingTask) {
      await dataService.updateTask({
        ...editingTask,
        title: formTitle,
        priority: formPriority,
        dueDate: new Date(formDueDate).toISOString(),
        assignedToName: formAssignee,
        status: formStatus,
        dealId: formDealId || undefined
      });
    } else {
      await dataService.createTask({
        title: formTitle,
        priority: formPriority,
        dueDate: new Date(formDueDate).toISOString(),
        assignedToName: formAssignee,
        status: formStatus,
        dealId: formDealId || undefined
      });
    }
    setIsModalOpen(false);
    onRefreshData();
  };

  const handleDeleteTask = async () => {
    if (editingTask && window.confirm('Are you sure you want to delete this task?')) {
      await dataService.deleteTask(editingTask.id);
      setIsModalOpen(false);
      onRefreshData();
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    await dataService.updateTask({ ...task, status: newStatus });
    onRefreshData();
  };

  const handleExport = () => {
    const headers = "Title,Status,Priority,Due Date,Assigned To,Deal";
    const rows = filteredTasks.map(t => {
      const deal = deals.find(d => d.id === t.dealId);
      return `"${t.title}",${t.status},${t.priority},${new Date(t.dueDate).toLocaleDateString()},"${t.assignedToName}","${deal ? deal.address : ''}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "tasks_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityDot = (priority: string) => {
     switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Normal': return 'bg-blue-500';
      case 'Low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <Card className="flex-1 flex flex-col shadow-sm border border-gray-200" noPadding>
        {/* Header & Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white rounded-t-xl">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Tasks & To-Dos</h2>
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{filteredTasks.length} records</span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-gray-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Download size={16} /> Export
                </button>

                 <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Plus size={16} /> New Task
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 bg-white">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider w-24">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Task</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Priority</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Due Date</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Assigned</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                     <input 
                        type="checkbox" 
                        checked={task.status === 'Completed'} 
                        onChange={() => handleToggleStatus(task)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                     />
                  </td>
                  <td className={`px-6 py-4 font-medium text-gray-900 ${task.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`}></span>
                         <span className={`${task.priority === 'High' ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{task.priority}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                      {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                      {task.assignedToName}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(task)}>
                            <Edit2 size={16} />
                        </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No tasks found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Task Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Edit Task' : 'Task Details'}>
         <div className="space-y-4">
            <InputGroup label="Task Description">
               <input 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Call Alice about inspection"
               />
            </InputGroup>

            <div className="grid grid-cols-2 gap-4">
               <InputGroup label="Priority">
                  <select 
                     className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                     value={formPriority}
                     onChange={e => setFormPriority(e.target.value as TaskPriority)}
                  >
                     <option value="High">High</option>
                     <option value="Normal">Normal</option>
                     <option value="Low">Low</option>
                  </select>
               </InputGroup>
               <InputGroup label="Due Date">
                  <input 
                     type="date"
                     className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                     value={formDueDate}
                     onChange={e => setFormDueDate(e.target.value)}
                  />
               </InputGroup>
            </div>

            <InputGroup label="Assigned To">
               <select 
                  className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  value={formAssignee}
                  onChange={e => setFormAssignee(e.target.value)}
               >
                  {teamMembers.map(m => (
                     <option key={m.id} value={m.displayName}>{m.displayName}</option>
                  ))}
                  <option value="Unassigned">Unassigned</option>
                  <option value="General Team">General Team</option>
               </select>
            </InputGroup>
            
            <InputGroup label="Related Deal (Optional)">
               <select 
                  className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  value={formDealId}
                  onChange={e => setFormDealId(e.target.value)}
               >
                  <option value="">None</option>
                  {deals.map(d => (
                     <option key={d.id} value={d.id}>{d.address}</option>
                  ))}
               </select>
            </InputGroup>

            <div className="pt-2 flex gap-3">
               {editingTask && (
                  <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDeleteTask}>Delete</Button>
               )}
               <Button className="w-full flex-1" onClick={handleSaveTask}>
                  {editingTask ? 'Update Task' : 'Save Task'}
               </Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
