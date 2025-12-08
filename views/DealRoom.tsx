
import React, { useState, useEffect, useRef } from 'react';
import { Deal, Task, Update, User, TaskStatus, DealDocument } from '../types';
import { Card, Badge, Button, Modal, InputGroup } from '../components/Shared';
import { ArrowLeft, MoreHorizontal, Plus, Send, Phone, Mail, FileText, Sparkles, AlertCircle, User as UserIcon, DollarSign, File, Upload, Download, Table as TableIcon, Presentation, ChevronDown } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'kanban' | 'activity' | 'documents'>('kanban');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  
  // Kanban State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(user.displayName);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Activity State
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [newUpdateTag, setNewUpdateTag] = useState<'Note' | 'Call' | 'Email' | 'WhatsApp'>('Note');
  const [aiSummary, setAiSummary] = useState<{summary: string, nextSteps: string[]} | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listing Generator State
  const [genFeatures, setGenFeatures] = useState('');
  const [genTone, setGenTone] = useState('Professional');
  const [generatedListing, setGeneratedListing] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Financials State
  const [price, setPrice] = useState(deal.price);
  const [commission, setCommission] = useState(deal.commissionRate);

  // Documents State
  const [isGoogleFileModalOpen, setIsGoogleFileModalOpen] = useState(false);
  const [googleFileType, setGoogleFileType] = useState<'google-doc' | 'google-sheet' | 'google-slide'>('google-doc');
  const [googleFileName, setGoogleFileName] = useState('');
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);


  useEffect(() => {
    if (activeTab === 'activity' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [updates, activeTab]);

  // --- Actions ---

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);
    await dataService.createTask({
      dealId: deal.id,
      title: newTaskTitle,
      assignedToName: newTaskAssignee,
      priority: 'Normal',
      status: 'To Do',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString() // +2 days
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
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

  const handleFinancialUpdate = async () => {
    await dataService.updateDeal({ ...deal, price, commissionRate: commission });
    onRefreshData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await dataService.addDocument(deal.id, e.target.files[0]);
      onRefreshData();
    }
  };

  const handleCreateGoogleFile = async () => {
     if (!googleFileName.trim()) return;
     await dataService.createGoogleFile(deal.id, googleFileName, googleFileType);
     setIsGoogleFileModalOpen(false);
     setGoogleFileName('');
     onRefreshData();
  };

  const openGoogleFileModal = (type: 'google-doc' | 'google-sheet' | 'google-slide') => {
      setGoogleFileType(type);
      setGoogleFileName('');
      setIsCreateDropdownOpen(false);
      setIsGoogleFileModalOpen(true);
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
                    <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm ring-1 ring-transparent focus-within:ring-indigo-500 transition-shadow">
                      <input 
                        className="w-full text-sm outline-none mb-2 font-medium"
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
                      <Button 
                        size="sm" 
                        onClick={handleAddTask} 
                        className="w-full"
                        disabled={!newTaskTitle || isAddingTask}
                      >
                        {isAddingTask ? 'Adding...' : 'Add Task'}
                      </Button>
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
            const isWhatsApp = update.tag === 'WhatsApp';
            return (
              <div key={update.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${isMe ? 'bg-indigo-50 text-indigo-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'} ${isWhatsApp ? 'bg-green-50 border border-green-200' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 text-xs opacity-70 font-medium ${isWhatsApp ? 'text-green-800' : ''}`}>
                    {update.tag === 'Call' && <Phone size={12} />}
                    {update.tag === 'Email' && <Mail size={12} />}
                    {update.tag === 'Note' && <FileText size={12} />}
                    {update.tag === 'Document' && <FileText size={12} />}
                    {update.tag === 'WhatsApp' && <MessageSquareIcon size={12} />}
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
            {(['Note', 'Call', 'Email', 'WhatsApp'] as const).map(tag => (
              <button
                key={tag}
                onClick={() => setNewUpdateTag(tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${newUpdateTag === tag ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'} ${tag === 'WhatsApp' && newUpdateTag === tag ? '!bg-[#25D366] !border-[#25D366]' : ''}`}
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

  const getFileIcon = (doc: DealDocument) => {
    switch (doc.type) {
      case 'google-doc': return <FileText size={20} />;
      case 'google-sheet': return <TableIcon size={20} />;
      case 'google-slide': return <Presentation size={20} />;
      case 'pdf': return <File size={20} />;
      default: return <File size={20} />;
    }
  };
  
  const getFileColorClass = (doc: DealDocument) => {
    switch (doc.type) {
        case 'google-doc': return 'bg-blue-100 text-blue-600';
        case 'google-sheet': return 'bg-emerald-100 text-emerald-600';
        case 'google-slide': return 'bg-amber-100 text-amber-600';
        case 'pdf': return 'bg-red-50 text-red-600';
        default: return 'bg-gray-100 text-gray-600';
    }
  };

  const renderDocuments = () => {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm">
         <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-800">Deal Documents</h3>
            <div className="flex gap-2">
               {/* Create Dropdown */}
               <div className="relative">
                  <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}>
                     Create <ChevronDown size={14} className="ml-1" />
                  </Button>
                  {isCreateDropdownOpen && (
                     <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50">
                        <button onClick={() => openGoogleFileModal('google-doc')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                           <FileText size={16} className="text-blue-600" /> Google Doc
                        </button>
                        <button onClick={() => openGoogleFileModal('google-sheet')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                           <TableIcon size={16} className="text-emerald-600" /> Google Sheet
                        </button>
                        <button onClick={() => openGoogleFileModal('google-slide')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                           <Presentation size={16} className="text-amber-600" /> Google Slide
                        </button>
                     </div>
                  )}
               </div>

               <div className="relative">
                  <input 
                    type="file" 
                    id="doc-upload" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="doc-upload" className="flex items-center gap-2 cursor-pointer bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-slate-900 transition-colors h-full">
                     <Upload size={14} /> Upload
                  </label>
               </div>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4" onClick={() => setIsCreateDropdownOpen(false)}>
            {deal.documents.length === 0 && (
               <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                  <FileText size={48} className="mx-auto mb-2 opacity-20" />
                  <p>No documents yet.</p>
                  <p className="text-xs">Upload contracts or create Google Docs.</p>
               </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deal.documents.map(doc => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
                   <div className={`p-2 rounded-lg ${getFileColorClass(doc)}`}>
                      {getFileIcon(doc)}
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                   </div>
                   <button className="text-gray-400 hover:text-indigo-600">
                      <Download size={16} />
                   </button>
                </div>
              ))}
            </div>
         </div>
      </div>
    );
  };

  // Helper for WhatsApp Icon (since it was missing in imports or custom svg needed)
  const MessageSquareIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50" onClick={() => setIsCreateDropdownOpen(false)}>
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
          {/* WhatsApp Integration Button */}
          <a 
            href={`https://wa.me/?text=Hi ${deal.clientName}, giving you an update on ${deal.address}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none h-10 px-4 py-2 text-sm bg-[#25D366] text-white hover:bg-[#128C7E]"
          >
             <MessageSquareIcon size={16} className="mr-2" /> Chat on WhatsApp
          </a>

          <Button variant="secondary" size="sm" icon={<Sparkles size={16} />} onClick={() => setIsListingModalOpen(true)}>
            Generate Listing
          </Button>
          <Button variant="outline" size="sm" icon={<MoreHorizontal size={16} />}>
            Actions
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Panel */}
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
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
            <button 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents ({deal.documents.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'kanban' && renderKanban()}
            {activeTab === 'activity' && renderActivity()}
            {activeTab === 'documents' && renderDocuments()}
          </div>
        </div>
        
        {/* Sidebar Info Panel */}
        <div className="w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto hidden xl:block">
           <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
             <DollarSign size={18} className="text-emerald-600" /> Financials
           </h3>
           <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Deal Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">$</span>
                  <input 
                    type="number" 
                    className="w-full pl-6 pr-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    onBlur={handleFinancialUpdate}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Commission {deal.type === 'Sale' ? '(%)' : '($)'}</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  onBlur={handleFinancialUpdate}
                />
              </div>
              <div className="pt-2 border-t border-gray-100 mt-2">
                 <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500">Est. Revenue</span>
                    <span className="text-emerald-600">
                      ${new Intl.NumberFormat('en-US').format(
                        deal.type === 'Sale' 
                          ? (price * commission / 100) 
                          : commission
                      )}
                    </span>
                 </div>
              </div>
           </div>

           <h3 className="font-semibold text-gray-900 mb-4">Deal Info</h3>
           <div className="space-y-3 text-sm">
             <div>
               <span className="text-gray-500 block text-xs">Client</span>
               <span className="text-gray-900">{deal.clientName}</span>
             </div>
             <div>
               <span className="text-gray-500 block text-xs">Created</span>
               <span className="text-gray-900">{new Date(deal.createdAt).toLocaleDateString()}</span>
             </div>
             <div>
               <span className="text-gray-500 block text-xs">Primary Agent</span>
               <span className="text-gray-900">{deal.primaryAgentName}</span>
             </div>
           </div>
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

      {/* Google File Creator Modal */}
      <Modal isOpen={isGoogleFileModalOpen} onClose={() => setIsGoogleFileModalOpen(false)} title={`Create New ${googleFileType === 'google-doc' ? 'Google Doc' : googleFileType === 'google-sheet' ? 'Google Sheet' : 'Google Slide'}`}>
         <div className="space-y-4">
            <InputGroup label="File Name">
               <input 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Q3 Sales Report"
                  value={googleFileName}
                  onChange={e => setGoogleFileName(e.target.value)}
                  autoFocus
               />
            </InputGroup>
            <Button className="w-full" onClick={handleCreateGoogleFile}>Create File</Button>
         </div>
      </Modal>
    </div>
  );
};
