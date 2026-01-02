
import React, { useState, useEffect, useRef } from 'react';
import { Deal, Task, Update, User, TaskStatus, Offer, OfferStatus } from '../types';
import { Badge, Button, Modal, InputGroup } from '../components/Shared';
import { Briefcase, DollarSign, Sparkles, Phone, FileText, Send, PlusCircle, CheckSquare, Upload, Trash2 } from 'lucide-react';
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

  // Tasks State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(user.displayName);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Activity State
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [newUpdateTag, setNewUpdateTag] = useState<'Note' | 'Call' | 'Email' | 'WhatsApp'>('Note');
  const [aiSummary, setAiSummary] = useState<{summary: string, nextSteps: string[]} | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    await dataService.createTask({
      dealId: deal.id,
      title: newTaskTitle,
      assignedToName: newTaskAssignee || user.displayName,
      priority: 'Normal',
      status: 'To Do',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString()
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
    onRefreshData();
  };

  const handleTaskStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await dataService.updateTask({ ...task, status: newStatus });
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

  const renderDetails = () => (
      <div className="space-y-6 overflow-y-auto h-full p-1">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={16} /> Key Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <span className="text-xs text-gray-500 block">MLS #</span>
                      <span className="text-sm font-medium text-gray-900">{deal.mlsNumber || 'N/A'}</span>
                  </div>
                  <div>
                      <span className="text-xs text-gray-500 block">Category</span>
                      <span className="text-sm font-medium text-gray-900">{deal.category || 'N/A'}</span>
                  </div>
                  <div>
                      <span className="text-xs text-gray-500 block">Client</span>
                      <span className="text-sm font-medium text-gray-900">{deal.clientName}</span>
                  </div>
                  <div>
                      <span className="text-xs text-gray-500 block">Address</span>
                      <span className="text-sm font-medium text-gray-900">{deal.address}</span>
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
              </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" icon={<Sparkles size={16}/>} onClick={() => setIsListingModalOpen(true)}>
                AI Listing Description
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

  const renderTasks = () => (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex gap-2">
                  <input 
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                    placeholder="New task..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  />
                  <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle || isAddingTask}>Add</Button>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tasks.length === 0 && <p className="text-center text-gray-400 py-10">No tasks found.</p>}
              {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={task.status === 'Completed'} 
                          onChange={() => handleTaskStatusChange(task, task.status === 'Completed' ? 'To Do' : 'Completed')}
                          className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</span>
                      </div>
                      <Badge color={task.status === 'Completed' ? 'green' : 'blue'}>{task.status}</Badge>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderActivity = () => (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 text-sm">Updates</h3>
          <Button variant="outline" size="sm" icon={<Sparkles size={14} className="text-purple-600" />} onClick={handleAiSummary} disabled={isSummarizing}>
            {isSummarizing ? 'Analyzing...' : 'AI Summary'}
          </Button>
        </div>
        {aiSummary && (
          <div className="bg-purple-50 p-3 border-b border-purple-100">
            <p className="text-xs text-purple-800 leading-relaxed mb-1 font-medium">{aiSummary.summary}</p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
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
        <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
              <textarea className="flex-1 border border-gray-300 rounded-md p-2 text-sm resize-none h-10 bg-white text-gray-900" placeholder="Log update..." value={newUpdateContent} onChange={e => setNewUpdateContent(e.target.value)} />
              <Button size="sm" onClick={handlePostUpdate} icon={<Send size={14}/>} />
        </div>
      </div>
  );

  const renderOffers = () => (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {offers.length === 0 && <div className="text-center text-gray-400 text-sm italic py-8">No offers found.</div>}
              {offers.map(offer => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <div className="font-bold text-gray-900">{offer.clientName}</div>
                              <div className="text-xs text-gray-500">${offer.amount.toLocaleString()}</div>
                          </div>
                          <Badge color={offer.status === 'Accepted' ? 'green' : 'gray'}>{offer.status}</Badge>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderDocuments = () => (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
         <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-semibold text-gray-800 text-sm">Documents ({deal.documents.length})</h3>
             <label className="text-xs bg-slate-800 text-white px-2 py-1 rounded cursor-pointer">
                Upload
                <input type="file" className="hidden" onChange={handleFileUpload} />
             </label>
         </div>
         <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
             {deal.documents.map(doc => (
                 <div key={doc.id} className="border border-gray-200 rounded p-2 flex items-center gap-2 hover:bg-gray-50">
                     <FileText size={16} className="text-blue-500" />
                     <div className="flex-1 min-w-0">
                         <div className="text-xs font-medium truncate">{doc.name}</div>
                     </div>
                 </div>
             ))}
         </div>
      </div>
  );

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={deal.address} maxWidth="max-w-5xl">
       <div className="flex flex-col h-[70vh]">
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
             {['details', 'tasks', 'activity', 'offers', 'documents'].map(tab => (
                 <button 
                    key={tab}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab(tab as any)}
                 >
                    {tab === 'tasks' ? 'Tasks' : tab}
                 </button>
             ))}
          </div>
          <div className="flex-1 overflow-hidden">
              {activeTab === 'details' && renderDetails()}
              {activeTab === 'tasks' && renderTasks()}
              {activeTab === 'activity' && renderActivity()}
              {activeTab === 'offers' && renderOffers()}
              {activeTab === 'documents' && renderDocuments()}
          </div>
       </div>
    </Modal>

    {/* Listing Modal */}
    <Modal isOpen={isListingModalOpen} onClose={() => setIsListingModalOpen(false)} title="AI Listing Generator">
        <div className="space-y-4">
          {!generatedListing ? (
            <>
              <InputGroup label="Key Features">
                <textarea 
                  className="w-full border border-gray-300 rounded-md p-2 h-24 text-sm bg-white text-gray-900"
                  placeholder="e.g. Renovated kitchen..."
                  value={genFeatures}
                  onChange={e => setGenFeatures(e.target.value)}
                />
              </InputGroup>
              <Button className="w-full" onClick={handleGenerateListing} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Description'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm whitespace-pre-line text-gray-900">
                {generatedListing}
              </div>
              <Button className="w-full" onClick={() => setGeneratedListing('')}>Try Again</Button>
            </div>
          )}
        </div>
    </Modal>
    </>
  );
};
