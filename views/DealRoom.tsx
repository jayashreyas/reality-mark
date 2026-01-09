
import React, { useState, useEffect } from 'react';
import { Deal, Task, User, Offer, DealStatus, DealType } from '../types';
import { Badge, Button, Modal, InputGroup } from '../components/Shared';
import { 
  Briefcase, DollarSign, Sparkles, FileText, CheckSquare, 
  Database, Home, Calendar, Users, Upload, Trash2, ArrowRight,
  TrendingUp, AlertCircle, CheckCircle2, ShieldCheck, Target, AlertTriangle, User as UserIcon, Save, Info
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { getDealSummary } from '../services/geminiService';

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
  const [activeTab, setActiveTab] = useState<'record' | 'ai-insights' | 'offers' | 'tasks'>('record');
  const [formData, setFormData] = useState<Deal>(deal);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setFormData(deal);
  }, [deal]);

  const handleInputChange = (field: keyof Deal, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calculate commission if price or rate changes
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
      alert("Deal record updated successfully.");
    } catch (e) {
      alert("Error saving deal. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiAssistant = async () => {
      setAiLoading(true);
      try {
          const summary = await getDealSummary(formData);
          // Suggest into notes without overwriting key fields
          handleInputChange('notes', (formData.notes ? formData.notes + '\n\n' : '') + 'AI SUMMARY: ' + summary);
      } catch (e) {
          alert("Nexus AI is temporarily unavailable.");
      } finally {
          setAiLoading(false);
      }
  };

  const renderRecordForm = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 gap-8">
        {/* Basic Property Info */}
        <section className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Home size={18} className="text-indigo-600"/> Property Details
            </h4>
            <InputGroup label="Property Address">
                <input 
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                />
            </InputGroup>
            <div className="grid grid-cols-3 gap-3">
                <InputGroup label="City">
                    <input className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={formData.city} onChange={e => handleInputChange('city', e.target.value)}/>
                </InputGroup>
                <InputGroup label="State">
                    <input className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={formData.state} onChange={e => handleInputChange('state', e.target.value)}/>
                </InputGroup>
                <InputGroup label="Zip">
                    <input className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={formData.zip} onChange={e => handleInputChange('zip', e.target.value)}/>
                </InputGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Property Type">
                    <input className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={formData.property_type} onChange={e => handleInputChange('property_type', e.target.value)}/>
                </InputGroup>
                <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Beds">
                        <input type="number" className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={formData.beds} onChange={e => handleInputChange('beds', Number(e.target.value))}/>
                    </InputGroup>
                    <InputGroup label="Baths">
                        <input type="number" step="0.5" className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={formData.baths} onChange={e => handleInputChange('baths', Number(e.target.value))}/>
                    </InputGroup>
                </div>
            </div>
        </section>

        {/* Transaction Info */}
        <section className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Target size={18} className="text-indigo-600"/> Transaction Status
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Deal Status">
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-bold text-indigo-700"
                        value={formData.status}
                        onChange={e => handleInputChange('status', e.target.value as DealStatus)}
                    >
                        <option value="Lead">Lead</option>
                        <option value="Active">Active</option>
                        <option value="Under Contract">Under Contract</option>
                        <option value="Pending">Pending</option>
                        <option value="Closed">Closed</option>
                        <option value="Lost">Lost</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </InputGroup>
                <InputGroup label="Trans. Type">
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 bg-white" value={formData.transaction_type} onChange={e => handleInputChange('transaction_type', e.target.value as DealType)}>
                        <option value="Sale">Sale</option>
                        <option value="Rental">Rental</option>
                    </select>
                </InputGroup>
            </div>
            <InputGroup label="Primary Client Name">
                <input className="w-full border border-gray-300 rounded-lg p-2.5 bg-white" value={formData.client_name} onChange={e => handleInputChange('client_name', e.target.value)}/>
            </InputGroup>
            <div className="grid grid-cols-3 gap-3">
                 <InputGroup label="Listed On">
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-xs" value={formData.listed_date} onChange={e => handleInputChange('listed_date', e.target.value)}/>
                </InputGroup>
                 <InputGroup label="Under Contract">
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-xs" value={formData.contract_date} onChange={e => handleInputChange('contract_date', e.target.value)}/>
                </InputGroup>
                 <InputGroup label="Settlement (Closed)">
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-xs" value={formData.settlement_date} onChange={e => handleInputChange('settlement_date', e.target.value)}/>
                </InputGroup>
            </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-8">
          {/* Financials */}
          <section className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600"/> Financials
            </h4>
            <InputGroup label="Contract Price ($)">
                <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-emerald-50/20 text-xl font-bold text-emerald-900"
                    value={formData.price}
                    onChange={e => handleInputChange('price', Number(e.target.value))}
                />
            </InputGroup>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Comm. Rate (%)">
                    <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg p-2 bg-white" value={formData.commission_rate} onChange={e => handleInputChange('commission_rate', Number(e.target.value))}/>
                </InputGroup>
                <InputGroup label="Comm. Amount ($)">
                    <input disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 font-bold text-gray-500" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(formData.commission_amount)}/>
                </InputGroup>
            </div>
          </section>

          {/* Notes & AI */}
          <section className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600"/> Internal Notes
                </h4>
                <Button variant="outline" size="sm" onClick={handleAiAssistant} disabled={aiLoading} icon={<Sparkles size={14} className="text-purple-600" />}>
                    {aiLoading ? 'Thinking...' : 'AI Summary'}
                </Button>
            </div>
            <textarea 
                className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                placeholder="Log contingencies, buyer mood, or special requests..."
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
            />
          </section>
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-4 -mb-4 p-4">
          <Button variant="danger" icon={<Trash2 size={18}/>} onClick={() => onDeleteDeal(deal.id)}>Archived Deal</Button>
          <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Discard Changes</Button>
              <Button onClick={handleSave} disabled={isSaving} icon={<Save size={18}/>}>
                  {isSaving ? 'Updating Database...' : 'Save Record'}
              </Button>
          </div>
      </div>
    </div>
  );

  const renderAIInsights = () => {
    if (!deal.ai_summary) {
        return (
            <div className="py-20 text-center space-y-4">
                <Sparkles size={48} className="mx-auto text-gray-300" />
                <p className="text-gray-500 max-w-xs mx-auto">No Nexus AI deep analysis found for this record. Only verified properties have access to this feature.</p>
            </div>
        );
    }

    const score = deal.ai_summary.investment_score;
    const scoreColor = score > 70 ? 'text-emerald-600' : score > 40 ? 'text-amber-600' : 'text-red-600';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Opportunity Score</p>
                    <div className={`text-4xl font-black ${scoreColor}`}>{score}</div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full ${score > 70 ? 'bg-emerald-500' : score > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${score}%`}}></div>
                    </div>
                </div>
                <div className="col-span-3 bg-indigo-600 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Target size={80}/></div>
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkles size={16}/> Market Positioning
                    </h4>
                    <p className="text-sm leading-relaxed text-indigo-50">{deal.ai_summary.market_positioning}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <UserIcon size={16} className="text-blue-500"/> Ownership Insights
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{deal.ai_summary.ownership_insights}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500"/> Negotiation Risks
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{deal.ai_summary.negotiation_risks}</p>
                </div>
            </div>
        </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={deal.address} 
      maxWidth="max-w-6xl"
    >
      <div className="flex h-[80vh]">
        {/* Sidebar Tabs */}
        <div className="w-56 border-r border-gray-100 pr-4 flex flex-col gap-1">
          {[
            { id: 'record', label: 'Full Record', icon: <Database size={16}/> },
            { id: 'ai-insights', label: 'AI Insights', icon: <Sparkles size={16}/> },
            { id: 'offers', label: 'Offer Board', icon: <TrendingUp size={16}/> },
            { id: 'tasks', label: 'Checklist', icon: <CheckSquare size={16}/> },
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
          
          <div className="mt-8 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Info size={10}/> Data Provenance</p>
              <p className="text-[10px] text-blue-800 leading-tight">Last modified by {deal.primaryAgentName} on {new Date(deal.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 pl-8 overflow-y-auto custom-scrollbar">
          {activeTab === 'record' && renderRecordForm()}
          {activeTab === 'ai-insights' && renderAIInsights()}
          {activeTab === 'offers' && (
              <div className="py-20 text-center text-gray-400 italic">Offer Board integration pending backend sync.</div>
          )}
           {activeTab === 'tasks' && (
              <div className="py-20 text-center text-gray-400 italic">Checklist module loaded via primary navigation.</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
