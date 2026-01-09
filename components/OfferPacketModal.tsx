
import React, { useState, useEffect } from 'react';
import { Offer, Listing, OfferStatus, FinancingType, User, Task, Update } from '../types';
import { Badge, Button, InputGroup } from './Shared';
import { 
  User as UserIcon, Mail, Phone, MapPin, DollarSign, 
  ShieldCheck, ClipboardCheck, Sparkles, 
  Trash2, X, CheckCircle, Percent,
  Send, MessageSquare, ListTodo, PlusCircle, RefreshCw, Copy
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { generateCounterOffer } from '../services/geminiService';

interface OfferPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  deal: Listing;
  currentUser: User;
  onSuccess: () => void;
}

export const OfferPacketModal: React.FC<OfferPacketModalProps> = ({ 
  isOpen, onClose, offer, deal, currentUser, onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'terms' | 'tasks' | 'activity'>('details');
  const [formData, setFormData] = useState<Partial<Offer>>({});
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newUpdate, setNewUpdate] = useState('');
  
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [aiDraft, setAiDraft] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (offer) {
        setFormData(offer);
        loadSubData(offer.id);
      } else {
        setFormData({
          listing_id: deal?.id,
          buyer_name: '',
          status: 'Draft',
          offer_price: deal?.price || 0,
          financing_type: 'Conventional',
          down_payment: 20
        });
        setTasks([]);
        setUpdates([]);
      }
      setAiDraft('');
      setActiveTab('details');
    }
  }, [isOpen, offer, deal]);

  const loadSubData = async (id: string) => {
    const [t, u] = await Promise.all([
      dataService.getTasks().then(all => all.filter(item => item.offerId === id)),
      dataService.getOfferUpdates(id)
    ]);
    setTasks(t);
    setUpdates(u);
  };

  const handleSave = async () => {
    if (!formData.buyer_name || !formData.offer_price) {
      alert("Buyer Name and Offer Price are required.");
      return;
    }
    try {
      if (formData.id) await dataService.updateOffer(formData as Offer);
      else await dataService.createOffer(formData);
      onSuccess();
      onClose();
    } catch (e) { alert(e); }
  };

  const handleDelete = async () => {
    if (formData.id && window.confirm("Delete this offer packet?")) {
      await dataService.deleteOffer(formData.id);
      onSuccess();
      onClose();
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim() || !offer) return;
    const up = await dataService.addUpdate({
      offerId: offer.id,
      content: newUpdate,
      userId: currentUser.id,
      userName: currentUser.displayName,
      tag: 'Note'
    });
    setUpdates([up, ...updates]);
    setNewUpdate('');
  };

  const handleAiNegotiate = async () => {
    if (!offer) return;
    setIsNegotiating(true);
    try {
      const res = await generateCounterOffer(offer, deal as any);
      setAiDraft(res);
    } catch (e) { console.error(e); }
    finally { setIsNegotiating(false); }
  };

  if (!isOpen) return null;

  // Placeholder check for deal since it might be undefined if called without a listing context
  const propertyAddress = deal?.address || formData.property_address || 'TBD Address';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge color={formData.status === 'Accepted' ? 'green' : 'blue'}>{formData.status || 'Draft'}</Badge>
              <h3 className="text-2xl font-black text-slate-800">{offer ? 'Offer Packet' : 'New Offer Entry'}</h3>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <MapPin size={12} /> {propertyAddress}
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X size={24}/></button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-8 bg-white">
          {[
            { id: 'details', label: 'Buyer & Contact', icon: <UserIcon size={16}/> },
            { id: 'terms', label: 'Financial Terms', icon: <DollarSign size={16}/> },
            { id: 'tasks', label: 'Action Items', icon: <ListTodo size={16}/> },
            { id: 'activity', label: 'Log & Activity', icon: <MessageSquare size={16}/> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-black transition-all border-b-4 ${
                activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white p-8 custom-scrollbar" style={{ maxHeight: '60vh' }}>
          
          {activeTab === 'details' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <UserIcon size={18} className="text-indigo-500" />
                  <h4 className="font-black text-slate-700 uppercase text-xs tracking-widest">Buyer Identification</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <InputGroup label="Primary Buyer Full Name">
                    <input className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900" value={formData.buyer_name} onChange={e => setFormData({...formData, buyer_name: e.target.value})} placeholder="e.g. John Doe" />
                  </InputGroup>
                  <InputGroup label="Buyer Email">
                    <input className="w-full border border-slate-300 rounded-xl p-3" value={formData.buyer_email} onChange={e => setFormData({...formData, buyer_email: e.target.value})} placeholder="buyer@example.com" />
                  </InputGroup>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MapPin size={18} className="text-indigo-500" />
                  <h4 className="font-black text-slate-700 uppercase text-xs tracking-widest">Property Assignment</h4>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-black text-slate-900">{propertyAddress}</p>
                    <p className="text-xs text-slate-500">{deal?.city || 'TBD'}, {deal?.state || ''}</p>
                  </div>
                  {deal && <Badge color="gray">Listing Price: ${deal.price.toLocaleString()}</Badge>}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-6 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 shadow-inner">
                <InputGroup label="Offer Price ($)">
                  <input type="number" className="w-full border border-indigo-200 rounded-xl p-3 font-black text-xl text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.offer_price} onChange={e => setFormData({...formData, offer_price: Number(e.target.value)})} />
                </InputGroup>
                <InputGroup label="Down Payment %">
                  <div className="relative">
                    <input type="number" className="w-full border border-indigo-200 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.down_payment} onChange={e => setFormData({...formData, down_payment: Number(e.target.value)})} />
                    <Percent size={14} className="absolute right-3 top-4 text-indigo-400" />
                  </div>
                </InputGroup>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <InputGroup label="Earnest Money Deposit ($)">
                    <input type="number" className="w-full border border-slate-300 rounded-xl p-3" value={formData.earnest_money} onChange={e => setFormData({...formData, earnest_money: Number(e.target.value)})} />
                  </InputGroup>
                  <InputGroup label="Financing Type">
                    <select className="w-full border border-slate-300 rounded-xl p-3 bg-white text-sm font-bold" value={formData.financing_type} onChange={e => setFormData({...formData, financing_type: e.target.value as FinancingType})}>
                      <option value="Cash">Cash</option>
                      <option value="Conventional">Conventional</option>
                      <option value="FHA">FHA</option>
                      <option value="VA">VA</option>
                      <option value="Other">Other</option>
                    </select>
                  </InputGroup>
                </div>
                <div className="space-y-4">
                  <h4 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Pipeline Stage</h4>
                  <select className="w-full border border-indigo-600 rounded-xl p-3 bg-white text-sm font-black text-indigo-700" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as OfferStatus})}>
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Countered">Countered</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Lost">Lost</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><ListTodo size={18} /> Offer To-Do List</h4>
                <div className="flex gap-2">
                  <input className="flex-1 border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Verify proof of funds..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && offer && dataService.createTask({ title: newTask, offerId: offer.id, assignedToName: currentUser.displayName }).then(() => { loadSubData(offer.id); setNewTask(''); })} />
                  <Button icon={<PlusCircle size={18}/>} disabled={!offer || !newTask.trim()} onClick={async () => { if(offer) { await dataService.createTask({ title: newTask, offerId: offer.id, assignedToName: currentUser.displayName }); loadSubData(offer.id); setNewTask(''); } }}>Add Task</Button>
                </div>
              </div>
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={t.status === 'Completed'} onChange={async () => { await dataService.updateTask({ ...t, status: t.status === 'Completed' ? 'To Do' : 'Completed' }); loadSubData(offer!.id); }} className="w-5 h-5 rounded-lg text-indigo-600" />
                      <span className={`text-sm font-bold ${t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.title}</span>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && <div className="text-center py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No assigned tasks</div>}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 mb-6">
                  {updates.map(up => (
                    <div key={up.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-indigo-500 uppercase">{up.userName}</span>
                        <span className="text-[9px] text-slate-400">{new Date(up.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700">{up.content}</p>
                    </div>
                  ))}
                  {updates.length === 0 && <div className="text-center py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No activity log found</div>}
                </div>
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <input className="flex-1 border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Log a status update..." value={newUpdate} onChange={e => setNewUpdate(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddUpdate()} />
                  <Button icon={<Send size={18}/>} disabled={!offer || !newUpdate.trim()} onClick={handleAddUpdate}>Post</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {offer && (
              <Button variant="danger" icon={<Trash2 size={18}/>} onClick={handleDelete}>Delete</Button>
            )}
            <Button variant="ghost" onClick={handleAiNegotiate} disabled={!offer || isNegotiating} icon={<Sparkles size={18} className="text-purple-600"/>} className="text-purple-700 font-black">AI Negotiator</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Discard</Button>
            <Button onClick={handleSave} icon={<CheckCircle size={18}/>} className="px-10">Commit Packet</Button>
          </div>
        </div>
      </div>

      {/* AI Result Modal */}
      {aiDraft && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-purple-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles size={24} />
                <h4 className="font-black text-lg">AI Generated Counter-Offer</h4>
              </div>
              <button onClick={() => setAiDraft('')} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 font-medium text-purple-900 text-sm leading-relaxed italic whitespace-pre-wrap">
                {aiDraft}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
               <Button variant="ghost" onClick={handleAiNegotiate} disabled={isNegotiating} icon={<RefreshCw size={18}/>}>Regenerate</Button>
               <Button icon={<Copy size={18}/>} onClick={() => { navigator.clipboard.writeText(aiDraft); alert("Copied!"); }}>Copy to Clipboard</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
