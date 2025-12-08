
import React, { useState, useEffect, useRef } from 'react';
import { Deal, Task, Update, User, TaskStatus, DealDocument, Offer, OfferStatus } from '../types';
import { Card, Badge, Button, Modal, InputGroup } from '../components/Shared';
import { ArrowLeft, MoreHorizontal, Plus, Send, Phone, Mail, FileText, Sparkles, AlertCircle, User as UserIcon, DollarSign, File, Upload, Download, Table as TableIcon, Presentation, ChevronDown, Trash2, Edit2, Calendar, MapPin, Briefcase, CheckSquare, PlusCircle } from 'lucide-react';
import { dataService } from '../services/dataService';
import { generateListingDescription, summarizeDealActivity } from '../services/geminiService';

interface DealRoomProps {
  deal: Deal;
  user: User;
  teamMembers: User[];
  tasks: Task[];
  updates: Update[];
  offers: Offer[];
  onBack: () => void;
  onRefreshData: () => void;
}

export const DealRoom: React.FC<DealRoomProps> = ({ deal, user, teamMembers, tasks, updates, offers, onBack, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'activity' | 'documents' | 'offers'>('kanban');
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

  // Offers State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [activeOfferTab, setActiveOfferTab] = useState<'details' | 'tasks' | 'activity' | 'documents'>('details');
  const [offerTasks, setOfferTasks] = useState<Task[]>([]);
  const [offerUpdates, setOfferUpdates] = useState<Update[]>([]);
  const [newOfferTask, setNewOfferTask] = useState('');
  const [newOfferUpdateContent, setNewOfferUpdateContent] = useState('');
  const offerScrollRef = useRef<HTMLDivElement>(null);
  
  // Offer Form State
  const [offerPropertyAddress, setOfferPropertyAddress] = useState('');
  const [offerClient, setOfferClient] = useState('');
  const [offerCoBuyer, setOfferCoBuyer] = useState('');
  const [offerEmail, setOfferEmail] = useState('');
  const [offerCoBuyerEmail, setOfferCoBuyerEmail] = useState('');
  const [offerAddress, setOfferAddress] = useState('');
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [offerEMDPercent, setOfferEMDPercent] = useState<number>(1.0); // Default 1%
  const [offerLoanType, setOfferLoanType] = useState('Conventional');
  const [offerStatus, setOfferStatus] = useState<OfferStatus>('Pending');
  const [offerNotes, setOfferNotes] = useState('');

  useEffect(() => {
    if (activeTab === 'activity' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [updates, activeTab]);

  useEffect(() => {
    if (activeOfferTab === 'activity' && offerScrollRef.current) {
      offerScrollRef.current.scrollTop = offerScrollRef.current.scrollHeight;
    }
  }, [offerUpdates, activeOfferTab]);

  // --- Actions ---

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);
    
    const assignee = newTaskAssignee || user.displayName || 'Unassigned';

    await dataService.createTask({
      dealId: deal.id,
      title: newTaskTitle,
      assignedToName: assignee,
      priority: 'Normal',
      status: 'To Do',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString() // +2 days
    });
    setNewTaskTitle('');
    setNewTaskAssignee(user.displayName);
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

  // --- Offer Actions ---

  const handleOpenOfferModal = async (offer?: Offer) => {
    setActiveOfferTab('details');
    if (offer) {
      setCurrentOffer(offer);
      setOfferPropertyAddress(offer.propertyAddress || deal.address);
      setOfferClient(offer.clientName);
      setOfferCoBuyer(offer.coBuyerName || '');
      setOfferEmail(offer.buyerEmail || '');
      setOfferCoBuyerEmail(offer.coBuyerEmail || '');
      setOfferAddress(offer.buyerAddress || '');
      setOfferAmount(offer.amount);
      setOfferEMDPercent(offer.earnestMoneyPercent || 1.0);
      setOfferLoanType(offer.loanType || 'Conventional');
      setOfferStatus(offer.status);
      setOfferNotes(offer.notes || '');
      
      // Fetch sub-data
      const allTasks = await dataService.getTasks();
      setOfferTasks(allTasks.filter(t => t.offerId === offer.id));
      const ups = await dataService.getOfferUpdates(offer.id);
      setOfferUpdates(ups);

    } else {
      setCurrentOffer(null);
      setOfferPropertyAddress(deal.address);
      setOfferClient(deal.clientName);
      setOfferCoBuyer('');
      setOfferEmail('');
      setOfferCoBuyerEmail('');
      setOfferAddress('');
      setOfferAmount(0);
      setOfferEMDPercent(1.0);
      setOfferLoanType('Conventional');
      setOfferStatus('Pending');
      setOfferNotes('');
      setOfferTasks([]);
      setOfferUpdates([]);
    }
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = async () => {
    if (!offerClient || !offerAmount) {
        alert("Please enter at least the Primary Buyer Name and Offer Price.");
        return;
    }

    if (currentOffer) {
      await dataService.updateOffer({
        ...currentOffer,
        propertyAddress: offerPropertyAddress,
        clientName: offerClient,
        coBuyerName: offerCoBuyer,
        buyerEmail: offerEmail,
        coBuyerEmail: offerCoBuyerEmail,
        buyerAddress: offerAddress,
        amount: offerAmount,
        earnestMoneyPercent: offerEMDPercent,
        loanType: offerLoanType as any,
        status: offerStatus,
        notes: offerNotes
      });
    } else {
      await dataService.createOffer({
        dealId: deal.id,
        propertyAddress: offerPropertyAddress,
        clientName: offerClient,
        coBuyerName: offerCoBuyer,
        buyerEmail: offerEmail,
        coBuyerEmail: offerCoBuyerEmail,
        buyerAddress: offerAddress,
        amount: offerAmount,
        earnestMoneyPercent: offerEMDPercent,
        loanType: offerLoanType as any,
        status: offerStatus,
        notes: offerNotes,
        submittedDate: new Date().toISOString(),
        documents: []
      });
    }
    setIsOfferModalOpen(false);
    onRefreshData();
  };

  const handleDeleteOffer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      await dataService.deleteOffer(id);
      onRefreshData();
    }
  };

  const handleOfferFileUpload = async (offerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await dataService.addOfferDocument(offerId, e.target.files[0]);
      // Update local state if editing
      if (currentOffer && currentOffer.id === offerId) {
         const updatedOffers = await dataService.getAllOffers();
         const updated = updatedOffers.find(o => o.id === offerId);
         if (updated) setCurrentOffer(updated);
      }
      onRefreshData();
    }
  };

  // --- Offer Sub-Data Handlers ---
  const handleAddOfferTask = async () => {
    if (!newOfferTask.trim() || !currentOffer) return;
    const task = await dataService.createTask({
      title: newOfferTask,
      offerId: currentOffer.id,
      status: 'To Do',
      priority: 'Normal',
      assignedToName: user.displayName,
      dueDate: new Date().toISOString()
    });
    setOfferTasks([...offerTasks, task]);
    setNewOfferTask('');
  };

  const handleToggleOfferTask = async (task: Task) => {
    const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    const updatedTask = { ...task, status: newStatus as any };
    await dataService.updateTask(updatedTask);
    setOfferTasks(offerTasks.map(t => t.id === task.id ? updatedTask : t));
  };

  const handleDeleteOfferTask = async (taskId: string) => {
    await dataService.deleteTask(taskId);
    setOfferTasks(offerTasks.filter(t => t.id !== taskId));
  };

  const handlePostOfferUpdate = async () => {
    if (!newOfferUpdateContent.trim() || !currentOffer) return;
    const update = await dataService.addUpdate({
      offerId: currentOffer.id,
      content: newOfferUpdateContent,
      tag: 'Note',
      userId: user.id,
      userName: user.displayName
    });
    setOfferUpdates([update, ...offerUpdates]);
    setNewOfferUpdateContent('');
    
    // Ensure sync
    dataService.getOfferUpdates(currentOffer.id).then(setOfferUpdates);
  };

  // --- Renderers ---

  const renderKanban = () => {
    // ... existing Kanban renderer (unchanged)
    const columns: TaskStatus[] = ['To Do', 'In Progress', 'Waiting', 'Completed'];
    return (
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-[1000px] p-1">
          {columns.map(status => {
            const colTasks = tasks.filter(t => t.status === status);
            return (
              <div key={status} className="flex-1 bg-gray-100 rounded-xl flex flex-col max-h-full">
                <div className="p-3 border-b border-gray-200 font-semibold text-gray-700 flex justify-between items-center bg-gray-100 rounded-t-xl sticky top-0 z-10">
                  {status}
                  <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">{colTasks.length}</span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                  {status === 'To Do' && (
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm mb-3">
                      <div className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">New Task</div>
                      <input 
                        className="w-full text-sm border-b border-gray-200 focus:border-indigo-500 outline-none py-1 mb-2 bg-white placeholder-gray-400 text-gray-900"
                        placeholder="What needs to be done?"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      />
                      <div className="flex gap-2 mb-3">
                         <select 
                            className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-900 flex-1 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                          >
                            <option value={user.displayName}>Me ({user.displayName})</option>
                            <option value="Unassigned">Unassigned</option>
                            <option value="General Team">General Team</option>
                            <optgroup label="Team Members">
                              {teamMembers.filter(m => m.id !== user.id).map(u => (
                                <option key={u.id} value={u.displayName}>{u.displayName}</option>
                              ))}
                            </optgroup>
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
                    <div key={task.id} className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-medium text-gray-900 ${task.status === 'Completed' ? 'line-through' : ''}`}>{task.title}</span>
                        {task.priority === 'High' && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5" title="High Priority" />}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                      
                      <div className="flex items-center gap-2 mb-3">
                         <UserIcon size={12} className="text-gray-400 flex-shrink-0" />
                         <select
                            className="text-xs bg-transparent border-none p-0 text-gray-600 focus:ring-0 cursor-pointer w-full truncate"
                            value={task.assignedToName}
                            onChange={(e) => handleTaskAssigneeChange(task, e.target.value)}
                          >
                            <option value="Unassigned">Unassigned</option>
                            <option value="General Team">General Team</option>
                            <optgroup label="Team Members">
                              {teamMembers.map(u => <option key={u.id} value={u.displayName}>{u.displayName}</option>)}
                            </optgroup>
                          </select>
                      </div>

                      <select 
                        className="w-full text-xs border border-gray-200 rounded p-1 bg-white text-gray-900 cursor-pointer"
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task, e.target.value as TaskStatus)}
                      >
                        {columns.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                  {colTasks.length === 0 && status !== 'To Do' && (
                    <div className="text-center text-xs text-gray-400 py-4 italic">No tasks</div>
                  )}
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
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20 text-gray-900 bg-white"
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
                    onClick={(e) => (e.target as HTMLInputElement).value = ''}
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

  const renderOffers = () => {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-800">Offers & Negotiation ({offers.length})</h3>
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => handleOpenOfferModal()}>
                Log New Offer
            </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {offers.length === 0 && (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <DollarSign size={48} className="mx-auto mb-2 opacity-20" />
                <p>No offers logged.</p>
                <p className="text-xs">Track incoming or outgoing offers here.</p>
              </div>
          )}
          <div className="grid grid-cols-1 gap-6">
             {offers.map(offer => (
                <Card key={offer.id} className="border border-gray-200 hover:shadow-lg transition-shadow relative group overflow-hidden" noPadding>
                  <div className="p-5">
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                       <div>
                          <h4 className="text-xl font-bold text-gray-900">{offer.clientName} {offer.coBuyerName ? `& ${offer.coBuyerName}` : ''}</h4>
                           <div className="flex flex-col gap-1 text-sm text-gray-500 mt-1">
                               <div className="flex items-center gap-1 font-medium text-indigo-700">
                                   <MapPin size={14} /> {offer.propertyAddress || deal.address}
                               </div>
                               <div className="flex flex-wrap gap-4">
                                   <span className="flex items-center gap-1"><Mail size={14} /> {offer.buyerEmail || 'No Email'}</span>
                                   <span className="flex items-center gap-1"><MapPin size={14} /> {offer.buyerAddress || 'No Address'}</span>
                               </div>
                           </div>
                       </div>
                       <Badge color={
                          offer.status === 'Accepted' ? 'green' : 
                          offer.status === 'Rejected' ? 'red' :
                          offer.status === 'Countered' ? 'purple' : 
                          offer.status === 'Withdrawn' ? 'gray' : 'yellow'
                        }>{offer.status}</Badge>
                    </div>

                    {/* Financial Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                       <div>
                          <div className="text-xs text-gray-500 font-medium uppercase">Offer Price</div>
                          <div className="text-lg font-bold text-gray-900">${offer.amount.toLocaleString()}</div>
                       </div>
                       <div>
                          <div className="text-xs text-gray-500 font-medium uppercase">Earnest Money</div>
                          <div className="text-base font-semibold text-gray-700">
                              {offer.earnestMoneyPercent ? `${offer.earnestMoneyPercent}%` : 'N/A'}
                              {offer.earnestMoneyPercent && (
                                  <span className="text-xs text-gray-400 font-normal ml-1">
                                      (${((offer.amount * offer.earnestMoneyPercent) / 100).toLocaleString()})
                                  </span>
                              )}
                          </div>
                       </div>
                       <div>
                          <div className="text-xs text-gray-500 font-medium uppercase">Loan Type</div>
                          <div className="text-base font-semibold text-gray-700">{offer.loanType || 'N/A'}</div>
                       </div>
                       <div>
                          <div className="text-xs text-gray-500 font-medium uppercase">Date</div>
                          <div className="text-base font-semibold text-gray-700">{new Date(offer.submittedDate).toLocaleDateString()}</div>
                       </div>
                    </div>

                    {/* Notes */}
                    {offer.notes && (
                      <div className="text-sm text-gray-600 mb-4 border-l-2 border-indigo-200 pl-3">
                         {offer.notes}
                      </div>
                    )}
                    
                    {/* Documents */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-bold text-gray-500 uppercase">Packet Documents</span>
                         <div className="relative">
                            <input 
                              type="file" 
                              id={`offer-doc-${offer.id}`} 
                              className="hidden" 
                              onChange={(e) => handleOfferFileUpload(offer.id, e)}
                              onClick={(e) => (e.target as HTMLInputElement).value = ''}
                            />
                            <label htmlFor={`offer-doc-${offer.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 font-medium">
                               <Upload size={12} /> Add Doc
                            </label>
                         </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {offer.documents && offer.documents.length > 0 ? (
                          offer.documents.map(doc => (
                            <a key={doc.id} href="#" className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md text-xs text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
                               <FileText size={12} className={doc.name.toLowerCase().includes('approval') ? 'text-green-600' : 'text-gray-500'} />
                               {doc.name}
                            </a>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No documents attached (Missing Pre-Approval/BFI)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-end gap-2">
                     <Button variant="outline" size="sm" icon={<Edit2 size={12} />} onClick={() => handleOpenOfferModal(offer)}>Manage Packet</Button>
                     <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => handleDeleteOffer(offer.id)}>Delete</Button>
                  </div>
                </Card>
             ))}
          </div>
        </div>
      </div>
    );
  };

  // Helper for WhatsApp Icon
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
          <div className="flex gap-6 border-b border-gray-200 flex-shrink-0 overflow-x-auto">
            <button 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'kanban' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('kanban')}
            >
              Tasks & Timeline
            </button>
            <button 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity & Updates
            </button>
             <button 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'offers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('offers')}
            >
              Offers ({offers.length})
            </button>
            <button 
              className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
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
            {activeTab === 'offers' && renderOffers()}
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
                    className="w-full pl-6 pr-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
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
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
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
                  className="w-full border border-gray-300 rounded-md p-2 h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                  placeholder="e.g. Renovated kitchen, hardwood floors, large backyard..."
                  value={genFeatures}
                  onChange={e => setGenFeatures(e.target.value)}
                />
              </InputGroup>
              <InputGroup label="Tone">
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white"
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
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 max-h-[300px] overflow-y-auto text-sm whitespace-pre-line text-gray-900">
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
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                  placeholder="e.g. Q3 Sales Report"
                  value={googleFileName}
                  onChange={e => setGoogleFileName(e.target.value)}
                  autoFocus
               />
            </InputGroup>
            <Button className="w-full" onClick={handleCreateGoogleFile}>Create File</Button>
         </div>
      </Modal>

       {/* Enhanced Offer Packet Modal (Mini Deal Room) */}
      <Modal isOpen={isOfferModalOpen} onClose={() => setIsOfferModalOpen(false)} title={currentOffer ? 'Manage Offer Packet' : 'Log New Offer Packet'} maxWidth="max-w-4xl">
         <div className="flex flex-col h-[70vh]">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
              <button 
                className={`flex-1 min-w-[80px] pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeOfferTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveOfferTab('details')}
              >
                Details
              </button>
              <button 
                className={`flex-1 min-w-[80px] pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeOfferTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveOfferTab('tasks')}
                // Removed disabled
              >
                Tasks
              </button>
              <button 
                className={`flex-1 min-w-[80px] pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeOfferTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveOfferTab('activity')}
                // Removed disabled
              >
                Activity
              </button>
              <button 
                className={`flex-1 min-w-[80px] pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeOfferTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveOfferTab('documents')}
                // Removed disabled
              >
                Documents
              </button>
            </div>
            
            {!currentOffer && activeOfferTab !== 'details' && (
               <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
                  Please save the offer details first to access other tabs.
               </div>
            )}

            {activeOfferTab === 'details' && (
              <div className="space-y-6 overflow-y-auto pr-2 flex-1">
                <InputGroup label="Property Address">
                  <input 
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-gray-900 bg-white"
                      placeholder="e.g. 123 Main St, Springfield"
                      value={offerPropertyAddress}
                      onChange={e => setOfferPropertyAddress(e.target.value)}
                  />
                </InputGroup>

                {/* Section 1: Buyer Details */}
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2"><UserIcon size={16}/> Buyer Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Primary Buyer">
                      <input 
                          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                          placeholder="e.g. John Smith"
                          value={offerClient}
                          onChange={e => setOfferClient(e.target.value)}
                      />
                    </InputGroup>
                    <InputGroup label="Buyer Email">
                      <input 
                          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                          placeholder="john@example.com"
                          value={offerEmail}
                          onChange={e => setOfferEmail(e.target.value)}
                      />
                    </InputGroup>
                    <InputGroup label="Co-Buyer (Optional)">
                      <input 
                          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                          placeholder="e.g. Mary Smith"
                          value={offerCoBuyer}
                          onChange={e => setOfferCoBuyer(e.target.value)}
                      />
                    </InputGroup>
                    <InputGroup label="Co-Buyer Email">
                      <input 
                          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                          placeholder="mary@example.com"
                          value={offerCoBuyerEmail}
                          onChange={e => setOfferCoBuyerEmail(e.target.value)}
                      />
                    </InputGroup>
                    <div className="col-span-2">
                      <InputGroup label="Current Mailing Address">
                        <input 
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                            placeholder="e.g. 500 Park Ave, NY"
                            value={offerAddress}
                            onChange={e => setOfferAddress(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </div>
                </div>

                {/* Section 2: Financial Terms */}
                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                  <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2"><Briefcase size={16}/> Financial Terms</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <InputGroup label="Offer Price">
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                            <input 
                              type="number"
                              className="w-full border border-gray-300 rounded-md pl-6 p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-gray-900 bg-white"
                              placeholder="0"
                              value={offerAmount}
                              onChange={e => setOfferAmount(Number(e.target.value))}
                            />
                        </div>
                      </InputGroup>
                      <InputGroup label="EMD % (Earnest Money)">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                              <input 
                                type="number"
                                step="0.1"
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                                placeholder="1.0"
                                value={offerEMDPercent}
                                onChange={e => setOfferEMDPercent(Number(e.target.value))}
                              />
                              <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                          </div>
                          <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                            = ${((offerAmount * offerEMDPercent) / 100).toLocaleString()}
                          </div>
                        </div>
                      </InputGroup>
                      <InputGroup label="Loan Type">
                        <select 
                            className="w-full border border-gray-300 rounded-md p-2 bg-white text-sm text-gray-900"
                            value={offerLoanType}
                            onChange={e => setOfferLoanType(e.target.value)}
                        >
                            <option value="Conventional">Conventional</option>
                            <option value="FHA">FHA</option>
                            <option value="VA">VA</option>
                            <option value="Cash">Cash</option>
                            <option value="Other">Other</option>
                        </select>
                      </InputGroup>
                      <InputGroup label="Status">
                        <select 
                            className="w-full border border-gray-300 rounded-md p-2 bg-white text-sm text-gray-900"
                            value={offerStatus}
                            onChange={e => setOfferStatus(e.target.value as OfferStatus)}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Countered">Countered</option>
                            <option value="Withdrawn">Withdrawn</option>
                        </select>
                      </InputGroup>
                  </div>
                </div>

                {/* Section 3: Notes & Docs */}
                <div>
                  <InputGroup label="Notes / Contingencies">
                      <textarea 
                        className="w-full border border-gray-300 rounded-md p-2 h-20 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                        placeholder="e.g. Inspection within 10 days, closing in 30 days..."
                        value={offerNotes}
                        onChange={e => setOfferNotes(e.target.value)}
                      />
                  </InputGroup>
                </div>
                
                <div className="pt-2">
                    <Button 
                      className="w-full" 
                      onClick={handleSaveOffer}
                      // Removed disabled prop
                    >
                      {currentOffer ? 'Update Offer Packet' : 'Save Offer Packet'}
                    </Button>
                </div>
              </div>
            )}

            {activeOfferTab === 'tasks' && currentOffer && (
               <div className="flex-1 flex flex-col overflow-hidden">
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 flex-shrink-0">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                       <CheckSquare size={16} /> Tasks for this Offer
                    </h4>
                    <div className="flex gap-2">
                       <input 
                          className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                          placeholder="Add new task (e.g. Request BFI)"
                          value={newOfferTask}
                          onChange={e => setNewOfferTask(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddOfferTask()}
                       />
                       <Button size="sm" icon={<PlusCircle size={16} />} onClick={handleAddOfferTask}>Add</Button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {offerTasks.length === 0 && (
                       <p className="text-center text-gray-400 text-sm py-8">No tasks for this offer yet.</p>
                    )}
                    {offerTasks.map(task => (
                       <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3">
                             <input 
                                type="checkbox" 
                                checked={task.status === 'Completed'}
                                onChange={() => handleToggleOfferTask(task)}
                                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                             />
                             <span className={`text-sm text-gray-700 ${task.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                                {task.title}
                             </span>
                          </div>
                          <button onClick={() => handleDeleteOfferTask(task.id)} className="text-gray-400 hover:text-red-500">
                             <Trash2 size={14} />
                          </button>
                       </div>
                    ))}
                 </div>
               </div>
            )}

            {activeOfferTab === 'activity' && currentOffer && (
               <div className="flex-1 flex flex-col overflow-hidden">
                   {/* Feed */}
                   <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2" ref={offerScrollRef}>
                      {offerUpdates.length === 0 && (
                          <p className="text-center text-gray-400 text-sm py-8">No activity logged for this offer yet.</p>
                      )}
                      {offerUpdates.map(update => {
                        const isMe = update.userId === user.id;
                        return (
                          <div key={update.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl p-3 text-sm ${isMe ? 'bg-indigo-50 text-indigo-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                               <div className="flex items-center gap-1.5 mb-1 opacity-70 text-xs font-semibold">
                                  <span>{update.userName}</span>
                                  <span>•</span>
                                  <span>{new Date(update.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                               </div>
                               <p>{update.content}</p>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                   
                   {/* Input */}
                   <div className="pt-3 border-t border-gray-100 flex gap-2">
                      <input 
                         className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                         placeholder="Log a note or call..."
                         value={newOfferUpdateContent}
                         onChange={e => setNewOfferUpdateContent(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handlePostOfferUpdate()}
                      />
                      <Button size="sm" icon={<Send size={16} />} onClick={handlePostOfferUpdate} />
                   </div>
               </div>
            )}

            {activeOfferTab === 'documents' && currentOffer && (
               <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center flex-shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                           <FileText size={16} /> Offer Documents
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">Pre-approvals, BFI, Contracts</p>
                      </div>
                      <div className="relative">
                            <input 
                              type="file" 
                              id={`modal-offer-doc-${currentOffer.id}`} 
                              className="hidden" 
                              onChange={(e) => handleOfferFileUpload(currentOffer.id, e)}
                              onClick={(e) => (e.target as HTMLInputElement).value = ''}
                            />
                            <label htmlFor={`modal-offer-doc-${currentOffer.id}`} className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                               <Upload size={14} /> Upload New
                            </label>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {(!currentOffer.documents || currentOffer.documents.length === 0) && (
                         <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                            <FileText size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No documents attached.</p>
                         </div>
                      )}
                      {currentOffer.documents?.map(doc => (
                         <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className="bg-blue-50 text-blue-600 p-2 rounded">
                                  <FileText size={16} />
                               </div>
                               <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                                  <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <Button variant="ghost" size="sm">Download</Button>
                         </div>
                      ))}
                   </div>
               </div>
            )}
         </div>
      </Modal>
    </div>
  );
};
