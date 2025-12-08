import React, { useState, useEffect, useRef } from 'react';
import { Deal, Task, Update, User, TaskStatus } from '../types';
import { Card, Badge, Button, Modal, InputGroup } from '../components/Shared';
import { ArrowLeft, MoreHorizontal, Plus, Send, Phone, Mail, FileText, Sparkles, AlertCircle, User as UserIcon } from 'lucide-react';
import { dataService } from '../services/dataService';
import { generateListingDescription, summarizeDealActivity } from '../services/geminiService';

interface DealRoomProps {
  deal: Deal;
  user: User;
  teamMembers: User[];
  tasks: Task[];
  updates: Update[];
  onBack: () => void;
  onRefreshData: () => void;
}

export const DealRoom: React.FC<DealRoomProps> = ({ deal, user, teamMembers, tasks, updates, onBack, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'activity'>('kanban');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  
  // Kanban State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(user.displayName);

  // Activity State
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [newUpdateTag, setNewUpdateTag] = useState<'Note' | 'Call' | 'Email'>('Note');
  const [aiSummary, setAiSummary] = useState<{summary: string, nextSteps: string[]} | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listing Generator State
  const [genFeatures, setGenFeatures] = useState('');
  const [genTone, setGenTone] = useState('Professional');
  const [generatedListing, setGeneratedListing] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (activeTab === 'activity' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [updates, activeTab]);

  // --- Actions ---

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await dataService.createTask({
      dealId: deal.id,
      title: newTaskTitle,
      assignedToName: newTaskAssignee,
      priority: 'Normal',
      status: 'To Do',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString() // +2 days
    });
    setNewTaskTitle('');
    onRefreshData();
  };

  const handleTaskStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await dataService.updateTask({ ...task, status: newStatus });
    onRefreshData();
  };

  const handleTaskAssigneeChange = async (task: Task, newAssignee: string) => {
    await dataService.updateTask({ ...task, assignedToName: newAssignee });
    onRefreshData();
  };

  const handlePostUpdate = async () => {
    if (!newUpdateContent.trim()) return;
    await dataService.addUpdate({
      dealId: deal.id,
      content: newUpdateContent,
      tag: newUpdateTag,
      userId: user.id,
      userName: user.displayName,
    });
    setNewUpdateContent('');
    onRefreshData();
  };

  const handleAiSummary = async () => {
    setIsSummarizing(true);
    const result = await summarizeDealActivity(updates);
    setAiSummary(result);
    setIsSummarizing(false);
  };

  const handleGenerateListing = async () => {
    setIsGenerating(true);
    try {
      const result = await generateListingDescription(deal.address, deal.type, genFeatures, genTone);
      setGeneratedListing(result);
    } catch (e) {
      setGeneratedListing("Error generating listing. Please check API Key.");
    }
    setIsGenerating(false);
  };

  // --- Renderers ---

  const renderKanban = () => {
    const columns: TaskStatus[] = ['To Do', 'In Progress', 'Waiting', 'Completed'];
    return (
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-[1000px] p-1">
          {columns.map(status => {
            const colTasks = tasks.filter(t => t.status === status);
            return (
              <div key={status} className="flex-1 bg-gray-100 rounded-xl flex flex-col max-h-full">
                <div className="p-3 border-b border-gray-200 font-semibold text-gray-700 flex justify-between items-center">
                  {status}
                  <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">{colTasks.length}</span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                  {status === 'To Do' && (
                    <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                      <input 
                        className="w-full text-sm outline-none mb-2"
                        placeholder="+ Add task..."
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      />
                      <div className="flex gap-2 mb-2">
                         <select 
                            className="text-xs bg-gray-50 border border-gray-200 rounded p-1 text-gray-600 flex-1"
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                          >
                            {teamMembers.map(u => <option key={u.id} value={u.displayName}>{u.displayName}</option>)}
                          </select>
                      </div>
                      {newTaskTitle && <Button size="sm" onClick={handleAddTask} className="w-full">Add</Button>}
                    </div>
                  )}
                  {colTasks.map(task => (
                    <div key={task.id} className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-medium text-gray-900 ${task.status === 'Completed' ? 'line-through' : ''}`}>{task.title}</span>
                        {task.priority === 'High' && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5" title="High Priority" />}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                      
                      {/* Assignee & Status */}
                      <div className="flex items-center gap-2 mb-3">
                         <UserIcon size={12} className="text-gray-400 flex-shrink-0" />
                         <select
                            className="text-xs bg-transparent border-none p-0 text-gray-600 focus:ring-0 cursor-pointer w-full truncate"
                            value={task.assignedToName}
                            onChange={(e) => handleTaskAssigneeChange(task, e.target.value)}
                          >
                            {teamMembers.map(u => <option key={u.id} value={u.displayName}>{u.displayName}</option>)}
                          </select>
                      </div>

                      <select 
                        className="w-full text-xs border border-gray-200 rounded p-1 bg-gray-50 text-gray-700"
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task, e.target.value as TaskStatus)}
                      >
                        {columns.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderActivity = () => {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header with AI */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Updates Stream</h3>
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Sparkles size={14} className={isSummarizing ? "animate-pulse text-purple-600" : "text-purple-600"} />}
            onClick={handleAiSummary}
            disabled={isSummarizing}
          >
            {isSummarizing ? 'Analyzing...' : 'Analyze & Catch Up'}
          </Button>
        </div>

        {/* AI Summary Box */}
        {aiSummary && (
          <div className="bg-purple-50 p-4 border-b border-purple-100 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-bold text-purple-900 mb-1 flex items-center gap-2">
              <Sparkles size={14} /> AI Summary
            </h4>
            <p className="text-sm text-purple-800 mb-3 leading-relaxed">{aiSummary.summary}</p>
            <div className="bg-white/60 rounded-lg p-2">
              <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-1">Suggested Next Steps</p>
              <ul className="list-disc list-inside text-sm text-purple-800 space-y-1">
                {aiSummary.nextSteps.map((step, i) => <li key={i}>{step}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {updates.length === 0 && <p className="text-center text-gray-400 py-10">No updates yet. Post something!</p>}
          {updates.map(update => {
            const isMe = update.userId === user.id;
            return (
              <div key={update.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${isMe ? 'bg-indigo-50 text-indigo-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                  <div className="flex items-center gap-2 mb-1 text-xs opacity-70 font-medium">
                    {update.tag === 'Call' && <Phone size={12} />}
                    {update.tag === 'Email' && <Mail size={12} />}
                    {update.tag === 'Note' && <FileText size={12} />}
                    <span>{update.tag}</span>
                    <span>•</span>
                    <span>{update.userName}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                  <p className="text-[10px] mt-2 text-right opacity-50">{new Date(update.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2 mb-2">
            {(['Note', 'Call', 'Email'] as const).map(tag => (
              <button
                key={tag}
                onClick={() => setNewUpdateTag(tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${newUpdateTag === tag ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
              placeholder="Log a note, call, or update..."
              value={newUpdateContent}
              onChange={e => setNewUpdateContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostUpdate(); }}}
            />
            <Button className="h-20" onClick={handlePostUpdate}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{deal.address}</h2>
              <Badge color={deal.status === 'Active' ? 'blue' : 'gray'}>{deal.status}</Badge>
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
              <span className="font-medium text-gray-700">{deal.clientName}</span>
              <span>•</span>
              <span>{deal.type}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><UserIcon size={12} /> {deal.primaryAgentName}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Sparkles size={16} />} onClick={() => setIsListingModalOpen(true)}>
            Generate Listing
          </Button>
          <Button variant="outline" size="sm" icon={<MoreHorizontal size={16} />}>
            Actions
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 flex-shrink-0">
          <button 
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'kanban' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('kanban')}
          >
            Tasks & Timeline
          </button>
          <button 
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity & Updates
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'kanban' ? renderKanban() : renderActivity()}
        </div>
      </div>

      {/* Listing Generator Modal */}
      <Modal isOpen={isListingModalOpen} onClose={() => setIsListingModalOpen(false)} title="AI Listing Generator">
        <div className="space-y-4">
          {!generatedListing ? (
            <>
              <InputGroup label="Key Features">
                <textarea 
                  className="w-full border border-gray-300 rounded-md p-2 h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Renovated kitchen, hardwood floors, large backyard..."
                  value={genFeatures}
                  onChange={e => setGenFeatures(e.target.value)}
                />
              </InputGroup>
              <InputGroup label="Tone">
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={genTone}
                  onChange={e => setGenTone(e.target.value)}
                >
                  <option>Professional</option>
                  <option>Luxury</option>
                  <option>Warm & Cozy</option>
                  <option>Urgent</option>
                </select>
              </InputGroup>
              <Button className="w-full" onClick={handleGenerateListing} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Description'}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 max-h-[300px] overflow-y-auto text-sm whitespace-pre-line">
                {generatedListing}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setGeneratedListing('')}>Try Again</Button>
                <Button className="flex-1" onClick={() => {
                  navigator.clipboard.writeText(generatedListing);
                  setIsListingModalOpen(false);
                  setGeneratedListing('');
                }}>Copy & Close</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};