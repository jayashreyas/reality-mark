
import React, { useState, useEffect, useRef } from 'react';
import { Deal, Task, Update, User, TaskStatus, DealDocument, Offer, OfferStatus } from '../types';
import { Badge, Button, Modal, InputGroup } from '../components/Shared';
import { ArrowLeft, MoreHorizontal, Plus, Send, Phone, Mail, FileText, Sparkles, AlertCircle, User as UserIcon, DollarSign, File, Upload, Download, Table as TableIcon, Presentation, ChevronDown, Trash2, Edit2, Calendar, MapPin, Briefcase, CheckSquare, PlusCircle } from 'lucide-react';
import { dataService } from '../services/dataService';
import { generateListingDescription, summarizeDealActivity } from '../services/geminiService';

interface DealRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  user: User;
  teamMembers: User[];
  tasks: Task[];
  updates: Update[];
  offers: Offer[];
  onRefreshData: () => void;
}

export const DealRoomModal: React.FC<DealRoomModalProps> = ({ isOpen, onClose, deal, user, teamMembers, tasks, updates, offers, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'activity' | 'offers' | 'documents'>('details');
  
  // Listing Generator State
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [genFeatures, setGenFeatures] = useState('');
  const [genTone, setGenTone] = useState('Professional');
  const [generatedListing, setGeneratedListing] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Financials State
  const [price, setPrice] = useState(deal.price);
  const [commission, setCommission] = useState(deal.commissionRate);

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

  // Documents State
  const [isGoogleFileModalOpen, setIsGoogleFileModalOpen] = useState(false);
  const [googleFileType, setGoogleFileType] = useState<'google-doc' | 'google-sheet' | 'google-slide'>('google-doc');
  const [googleFileName, setGoogleFileName] = useState('');
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);

  // Nested Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  
  useEffect(() => {
    if (isOpen) {
        setPrice(deal.price);
        setCommission(deal.commissionRate);
    }
  }, [isOpen, deal]);

  useEffect(() => {
    if (activeTab === 'activity' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [updates, activeTab, isOpen]);

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
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString()
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

  const handleGenerateListing = async () => {
    setIsGenerating(true);
    try {
      const result = await generateListingDescription(deal.address, deal.type, genFeatures, genTone);
      setGeneratedListing(result);
    } catch (e) {
      setGeneratedListing("Error generating listing.");
    }
    setIsGenerating(false);
  };

  // --- Renderers ---

  const renderDetails = () => (
      <div className="space-y-6 overflow-y-auto h-full p-1">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={16} /> Key Deal Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <span className="text-xs text-gray-500 block">Client Name</span>
                      <span className="text-sm font-medium text-gray-900">{deal.clientName}</span>
                  </div>
                  <div>
                      <span className="text-xs text-gray-500 block">Property Address</span>
                      <span className="text-sm font-medium text-gray-900">{deal.address}</span>
                  </div>
                   <div>
                      <span className="text-xs text-gray-500 block">Deal Type</span>
                      <span className="text-sm font-medium text-gray-900">{deal.type}</span>
                  </div>
                  <div>
                      <span className="text-xs text-gray-500 block">Primary Agent</span>
                      <span className="text-sm font-medium text-gray-900">{deal.primaryAgentName}</span>
                  </div>
              </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
              <h4 className="text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <DollarSign size={16} /> Financials
              </h4>
              <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Deal Price">
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                        <input 
                            type="number"
                            className="w-full border border-gray-300 rounded-md pl-6 p-2 bg-white text-gray-900 text-sm"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            onBlur={handleFinancialUpdate}
                        />
                    </div>
                  </InputGroup>
                  <InputGroup label={`Commission ${deal.type === 'Sale' ? '(%)' : '($)'}`}>
                     <input 
                        type="number"
                        className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm"
                        value={commission}
                        onChange={(e) => setCommission(Number(e.target.value))}
                        onBlur={handleFinancialUpdate}
                    />
                  </InputGroup>
                  <div className="col-span-2 pt-2 border-t border-emerald-100 flex justify-between items-center">
                      <span className="text-sm text-emerald-800 font-medium">Estimated Revenue</span>
                      <span className="text-lg font-bold text-emerald-700">
                        ${new Intl.NumberFormat('en-US').format(
                            deal.type === 'Sale' 
                            ? (price * commission / 100) 
                            : commission
                        )}
                      </span>
                  </div>
              </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" icon={<Sparkles size={16}/>} onClick={() => setIsListingModalOpen(true)}>
                Generate Listing Description
            </Button>
            <a 
                href={`https://wa.me/?text=Update on ${deal.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none h-10 px-4 py-2 text-sm bg-[#25D366] text-white hover:bg-[#128C7E]"
            >
                <Phone size={16} className="mr-2" /> WhatsApp Client
            </a>
          </div>
      </div>
  );

  const renderKanban = () => {
    const columns: TaskStatus[] = ['To Do', 'In Progress', 'Waiting', 'Completed'];
    return (
      <div className="flex-1 overflow-x-auto h-full">
        <div className="flex gap-4 h-full min-w-[800px] p-1">
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
                      <input 
                        className="w-full text-sm border-b border-gray-200 focus:border-indigo-500 outline-none py-1 mb-2 bg-white text-gray-900"
                        placeholder="New Task..."
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      />
                       <select 
                            className="w-full text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-900 outline-none mb-2"
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                        >
                            <option value={user.displayName}>Me</option>
                            <option value="Unassigned">Unassigned</option>
                            {teamMembers.filter(m => m.id !== user.id).map(u => (
                                <option key={u.id} value={u.displayName}>{u.displayName}</option>
                            ))}
                        </select>
                      <Button size="sm" onClick={handleAddTask} className="w-full" disabled={!newTaskTitle || isAddingTask}>Add</Button>
                    </div>
                  )}
                  {colTasks.map(task => (
                    <div key={task.id} className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-medium text-gray-900 ${task.status === 'Completed' ? 'line-through' : ''}`}>{task.title}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                          <select
                            className="text-xs bg-transparent border-none p-0 text-gray-600 cursor-pointer max-w-[80px] truncate focus:ring-0"
                            value={task.assignedToName}
                            onChange={(e) => handleTaskAssigneeChange(task, e.target.value)}
                          >
                             {teamMembers.map(u => <option key={u.id} value={u.displayName}>{u.displayName}</option>)}
                             <option value="Unassigned">Unassigned</option>
                          </select>
                          <select 
                            className="text-xs border border-gray-200 rounded p-0.5 bg-white text-gray-900 cursor-pointer"
                            value={task.status}
                            onChange={(e) => handleTaskStatusChange(task, e.target.value as TaskStatus)}
                          >
                            {columns.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
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

  const renderActivity = () => (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 text-sm">Updates</h3>
          <Button variant="outline" size="sm" icon={<Sparkles size={14} className={isSummarizing ? "animate-pulse text-purple-600" : "text-purple-600"} />} onClick={handleAiSummary} disabled={isSummarizing}>
            {isSummarizing ? 'Analyzing...' : 'AI Summary'}
          </Button>
        </div>
        {aiSummary && (
          <div className="bg-purple-50 p-3 border-b border-purple-100">
            <p className="text-xs text-purple-800 leading-relaxed mb-1 font-medium">{aiSummary.summary}</p>
            <div className="text-xs text-purple-600">Next: {aiSummary.nextSteps.join(', ')}</div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {updates.length === 0 && <p className="text-center text-gray-400 py-10">No updates yet.</p>}
          {updates.map(update => {
            const isMe = update.userId === user.id;
            return (
              <div key={update.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${isMe ? 'bg-indigo-50 text-indigo-900' : 'bg-gray-100 text-gray-800'} text-sm`}>
                  <div className="flex items-center gap-1.5 mb-1 opacity-70 text-xs font-semibold">
                    <span>{update.userName}</span><span>•</span><span>{update.tag}</span>
                  </div>
                  <p>{update.content}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-gray-100 bg-white">
           <div className="flex gap-2 mb-2">
             {['Note', 'Call', 'Email', 'WhatsApp'].map(tag => (
                <button key={tag} onClick={() => setNewUpdateTag(tag as any)} className={`text-xs px-2 py-0.5 rounded-full border ${newUpdateTag === tag ? 'bg-slate-800 text-white' : 'bg-white text-gray-600'}`}>{tag}</button>
             ))}
           </div>
           <div className="flex gap-2">
              <textarea className="flex-1 border border-gray-300 rounded-md p-2 text-sm resize-none h-10 bg-white text-gray-900" placeholder="Log update..." value={newUpdateContent} onChange={e => setNewUpdateContent(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostUpdate(); }}} />
              <Button size="sm" onClick={handlePostUpdate} icon={<Send size={14}/>} />
           </div>
        </div>
      </div>
  );

  const renderOffers = () => (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-sm">Offers ({offers.length})</h3>
              {/* Note: Offer creation usually handled in OffersList, but could handle here if we passed the handler */}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {offers.length === 0 && <div className="text-center text-gray-400 text-sm italic py-8">No offers found.</div>}
              {offers.map(offer => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <div className="font-bold text-gray-900">{offer.clientName}</div>
                              <div className="text-xs text-gray-500">${offer.amount.toLocaleString()} • {offer.loanType}</div>
                          </div>
                          <Badge color={offer.status === 'Accepted' ? 'green' : 'gray'}>{offer.status}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{offer.notes || 'No notes'}</div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderDocuments = () => (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
         <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-semibold text-gray-800 text-sm">Documents ({deal.documents.length})</h3>
             <div className="flex gap-2">
                 <button onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)} className="text-xs bg-white border px-2 py-1 rounded">Create New</button>
                 <label className="text-xs bg-slate-800 text-white px-2 py-1 rounded cursor-pointer">
                    Upload
                    <input type="file" className="hidden" onChange={handleFileUpload} onClick={(e) => (e.target as HTMLInputElement).value = ''} />
                 </label>
             </div>
             {isCreateDropdownOpen && (
                 <div className="absolute right-10 top-32 bg-white shadow-lg border rounded p-1 z-50 flex flex-col w-32">
                     <button onClick={() => openGoogleFileModal('google-doc')} className="text-left text-xs p-2 hover:bg-gray-50">Google Doc</button>
                     <button onClick={() => openGoogleFileModal('google-sheet')} className="text-left text-xs p-2 hover:bg-gray-50">Google Sheet</button>
                 </div>
             )}
         </div>
         <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
             {deal.documents.map(doc => (
                 <div key={doc.id} className="border border-gray-200 rounded p-2 flex items-center gap-2 hover:bg-gray-50">
                     <FileText size={16} className="text-blue-500" />
                     <div className="flex-1 min-w-0">
                         <div className="text-xs font-medium truncate">{doc.name}</div>
                         <div className="text-[10px] text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                     </div>
                 </div>
             ))}
             {deal.documents.length === 0 && <div className="col-span-2 text-center text-gray-400 text-xs italic py-4">No documents</div>}
         </div>
      </div>
  );

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={deal.address} maxWidth="max-w-6xl">
       <div className="flex flex-col h-[75vh]">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto flex-shrink-0">
             {['details', 'tasks', 'activity', 'offers', 'documents'].map(tab => (
                 <button 
                    key={tab}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab(tab as any)}
                 >
                    {tab}
                 </button>
             ))}
          </div>

          <div className="flex-1 overflow-hidden">
              {activeTab === 'details' && renderDetails()}
              {activeTab === 'tasks' && renderKanban()}
              {activeTab === 'activity' && renderActivity()}
              {activeTab === 'offers' && renderOffers()}
              {activeTab === 'documents' && renderDocuments()}
          </div>
       </div>
    </Modal>

    {/* Listing Generator Modal */}
    <Modal isOpen={isListingModalOpen} onClose={() => setIsListingModalOpen(false)} title="AI Listing Generator">
        <div className="space-y-4">
          {!generatedListing ? (
            <>
              <InputGroup label="Key Features">
                <textarea 
                  className="w-full border border-gray-300 rounded-md p-2 h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                  placeholder="e.g. Renovated kitchen..."
                  value={genFeatures}
                  onChange={e => setGenFeatures(e.target.value)}
                />
              </InputGroup>
              <InputGroup label="Tone">
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
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
      <Modal isOpen={isGoogleFileModalOpen} onClose={() => setIsGoogleFileModalOpen(false)} title="Create New Google File">
         <div className="space-y-4">
            <InputGroup label="File Name">
               <input 
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                  placeholder="e.g. Report"
                  value={googleFileName}
                  onChange={e => setGoogleFileName(e.target.value)}
                  autoFocus
               />
            </InputGroup>
            <Button className="w-full" onClick={handleCreateGoogleFile}>Create File</Button>
         </div>
      </Modal>
    </>
  );
};
