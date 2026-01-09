
import React, { useState, useEffect } from 'react';
import { Deal, Task, User, Offer, DealStatus, OfferStatus, FinancingType } from '../types';
import { Badge, Button, Modal, InputGroup } from '../components/Shared';
import { 
  Briefcase, DollarSign, Sparkles, FileText, CheckSquare, 
  Database, Home, Calendar, Users, Upload, Trash2, ArrowRight,
  TrendingUp, AlertCircle, CheckCircle2, ShieldCheck, Target, AlertTriangle, Save, Info, Plus, PlusCircle, LayoutGrid, X
} from 'lucide-react';
import { dataService } from '../services/dataService';

// Fix: Removed missing import 'getDealSummary' from '../services/geminiService' as it was causing compilation errors and was not being utilized in this component.

interface DealRoomProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  user: User;
  onRefreshData: () => void;
  onDeleteDeal: (id: string) => void;
}

export const DealRoomModal: React.FC<DealRoomProps> = ({ 
  isOpen, onClose, deal, user, onRefreshData, onDeleteDeal 
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'offers' | 'ai-insights'>('record');
  const [formData, setFormData] = useState<Deal>(deal);
  const [isSaving, setIsSaving] = useState(false);
  
  // Offers State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  useEffect(() => {
    setFormData(deal);
    if (isOpen) loadOffers();
  }, [deal, isOpen]);

  const loadOffers = async () => {
    const fetched = await dataService.getOffersByDeal(deal.id);
    setOffers(fetched);
  };

  const handleInputChange = (field: keyof Deal, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'price' || field === 'commission_rate') {
          next.commission_amount = (next.price || 0) * ((next.commission_rate || 0) / 100);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataService.updateDeal(formData);
      onRefreshData();
    } finally {
      setIsSaving(false);
    }
  };

  const renderOfferBoard = () => {
    const columns: OfferStatus[] = ['Draft', 'Submitted', 'Countered', 'Accepted', 'Rejected'];
    
    return (
      <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp size={24} className="text-indigo-600"/> Offer Negotiation Board
            </h4>
            <p className="text-sm text-gray-500">Track and compare all incoming offers for this property.</p>
          </div>
          <Button icon={<PlusCircle size={18}/>} onClick={() => { setEditingOffer(null); setIsOfferModalOpen(true); }}>
            Log New Offer
          </Button>
        </div>

        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map(status => (
              <div key={status} className="w-72 flex flex-col bg-slate-100/50 rounded-2xl p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h5 className="font-black text-slate-500 uppercase text-[10px] tracking-widest">{status}</h5>
                  <Badge color="gray">{offers.filter(o => o.status === status).length}</Badge>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {offers.filter(o => o.status === status).map(offer => (
                    <div 
                      key={offer.id}
                      onClick={() => { setEditingOffer(offer); setIsOfferModalOpen(true); }}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-slate-900 text-sm">{offer.buyer_name}</p>
                        <Badge color={offer.financing_type === 'Cash' ? 'green' : 'blue'}>{offer.financing_type}</Badge>
                      </div>
                      <p className="text-lg font-black text-indigo-700">${(offer.offer_price || offer.amount || 0).toLocaleString()}</p>
                      {offer.closing_date && (
                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <Calendar size={12}/> Closes {new Date(offer.closing_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                  {offers.filter(o => o.status === status).length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRecordForm = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 gap-8">
        <section className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Home size={18} className="text-indigo-600"/> Property Details
            </h4>
            <InputGroup label="Property Address">
                <input className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} />
            </InputGroup>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Deal Status">
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-bold text-indigo-700" value={formData.status} onChange={e => handleInputChange('status', e.target.value as DealStatus)} >
                        <option value="Lead">Lead</option>
                        <option value="Active">Active</option>
                        <option value="Under Contract">Under Contract</option>
                        <option value="Pending">Pending</option>
                        <option value="Closed">Closed</option>
                    </select>
                </InputGroup>
                <InputGroup label="Listed Date">
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5" value={formData.listed_date} onChange={e => handleInputChange('listed_date', e.target.value)} />
                </InputGroup>
            </div>
        </section>

        <section className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600"/> Financials
            </h4>
            <InputGroup label="Contract Price ($)">
                <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 bg-emerald-50/20 text-xl font-bold text-emerald-900" value={formData.price} onChange={e => handleInputChange('price', Number(e.target.value))} />
            </InputGroup>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Comm. Rate (%)">
                    <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={formData.commission_rate} onChange={e => handleInputChange('commission_rate', Number(e.target.value))}/>
                </InputGroup>
                <InputGroup label="Estimated Amount">
                    <div className="p-2.5 bg-gray-100 rounded-lg font-bold text-gray-600">${formData.commission_amount.toLocaleString()}</div>
                </InputGroup>
            </div>
        </section>
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-4 -mb-4 p-4">
          <Button variant="danger" icon={<Trash2 size={18}/>} onClick={() => onDeleteDeal(deal.id)}>Delete Room</Button>
          <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Discard</Button>
              <Button onClick={handleSave} disabled={isSaving} icon={<Save size={18}/>}>
                  {isSaving ? 'Saving...' : 'Update Record'}
              </Button>
          </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={deal.address} maxWidth="max-w-6xl">
      <div className="flex h-[80vh]">
        <div className="w-56 border-r border-gray-100 pr-4 flex flex-col gap-1">
          {[
            { id: 'record', label: 'Full Record', icon: <Database size={16}/> },
            { id: 'offers', label: 'Offer Board', icon: <TrendingUp size={16}/> },
            { id: 'ai-insights', label: 'AI Insights', icon: <Sparkles size={16}/> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 pl-8 overflow-y-auto flex flex-col">
          {activeTab === 'record' && renderRecordForm()}
          {activeTab === 'offers' && renderOfferBoard()}
          {activeTab === 'ai-insights' && <div className="py-20 text-center text-gray-400">Deep AI analysis loading...</div>}
        </div>
      </div>

      {/* Internal Offer Add/Edit Modal */}
      <OfferModal 
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        deal={deal}
        offer={editingOffer}
        onSave={() => { loadOffers(); onRefreshData(); setIsOfferModalOpen(false); }}
      />
    </Modal>
  );
};

// --- Specialized Internal Offer Modal ---

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  offer: Offer | null;
  onSave: () => void;
}

const OfferModal: React.FC<OfferModalProps> = ({ isOpen, onClose, deal, offer, onSave }) => {
  const [localForm, setLocalForm] = useState<Partial<Offer>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    if (offer) setLocalForm(offer);
    else setLocalForm({ deal_id: deal.id, status: 'Draft', financing_type: 'Conventional', offer_price: deal.price });
  }, [offer, deal, isOpen]);

  const handleCommit = async () => {
    setIsProcessing(true);
    try {
      if (localForm.id) await dataService.updateOffer(localForm as Offer);
      else await dataService.createOffer(localForm);
      onSave();
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAISummary = () => {
    setAiSummary(`Generating narrative analysis for ${localForm.buyer_name || localForm.clientName}'s offer...`);
    setTimeout(() => {
        const price = localForm.offer_price || localForm.amount || 0;
        const score = price >= deal.price ? 'Strong' : 'Conservative';
        setAiSummary(`This is a ${score} ${localForm.financing_type} offer. Contingencies noted: ${localForm.contingencies || 'None'}. Suggest countering on closing date if speed is priority.`);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900">{localForm.id ? 'Edit Offer Packet' : 'Log New Offer Packet'}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{deal.address}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"><X size={24}/></button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
            <InputGroup label="Buyer Name">
              <input className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={localForm.buyer_name || localForm.clientName} onChange={e => setLocalForm({...localForm, buyer_name: e.target.value})} placeholder="Full Legal Name"/>
            </InputGroup>
            <InputGroup label="Offer Status">
              <select className="w-full border border-slate-300 rounded-xl p-3 bg-white" value={localForm.status} onChange={e => setLocalForm({...localForm, status: e.target.value as any})}>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Countered">Countered</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </InputGroup>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
            <InputGroup label="Offer Price">
               <input type="number" className="w-full border border-slate-300 rounded-xl p-3 font-black text-indigo-700" value={localForm.offer_price || localForm.amount} onChange={e => setLocalForm({...localForm, offer_price: Number(e.target.value)})}/>
            </InputGroup>
            <InputGroup label="Down Pmt">
               <input type="number" className="w-full border border-slate-300 rounded-xl p-3" value={localForm.down_payment} onChange={e => setLocalForm({...localForm, down_payment: Number(e.target.value)})}/>
            </InputGroup>
            <InputGroup label="EMD">
               <input type="number" className="w-full border border-slate-300 rounded-xl p-3" value={localForm.earnest_money} onChange={e => setLocalForm({...localForm, earnest_money: Number(e.target.value)})}/>
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <InputGroup label="Financing Type">
              <select className="w-full border border-slate-300 rounded-xl p-3 bg-white" value={localForm.financing_type || localForm.loanType} onChange={e => setLocalForm({...localForm, financing_type: e.target.value as any})}>
                <option value="Cash">Cash</option>
                <option value="Conventional">Conventional</option>
                <option value="FHA">FHA</option>
                <option value="VA">VA</option>
                <option value="Other">Other</option>
              </select>
            </InputGroup>
            <InputGroup label="Proposed Closing">
               <input type="date" className="w-full border border-slate-300 rounded-xl p-3" value={localForm.closing_date} onChange={e => setLocalForm({...localForm, closing_date: e.target.value})}/>
            </InputGroup>
          </div>

          <InputGroup label="Contingencies">
            <textarea className="w-full border border-slate-300 rounded-xl p-3 h-24" placeholder="Inspection, appraisal gap, sale of home..." value={localForm.contingencies} onChange={e => setLocalForm({...localForm, contingencies: e.target.value})}/>
          </InputGroup>

          <div className="bg-purple-50 border border-purple-100 p-6 rounded-3xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-3">
               <h4 className="text-sm font-black text-purple-900 uppercase tracking-widest flex items-center gap-2"><Sparkles size={16}/> Nexus Negotiation Strategy</h4>
               <Button variant="ghost" size="sm" onClick={generateAISummary} className="text-purple-600 hover:bg-purple-100">Sync Analysis</Button>
             </div>
             <p className="text-sm text-purple-800 italic leading-relaxed">{aiSummary || 'Click sync to generate a strategic comparison against the listing terms.'}</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          {localForm.id && <Button variant="danger" className="mr-auto" onClick={() => dataService.deleteOffer(localForm.id!).then(onSave)}>Delete</Button>}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCommit} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Save Offer Packet'}</Button>
        </div>
      </div>
    </div>
  );
};
