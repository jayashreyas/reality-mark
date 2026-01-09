
import React, { useState, useEffect } from 'react';
import { Deal, Task, Update, User, Offer, DealStatus, OfferStatus } from '../types';
import { Badge, Button, Modal, InputGroup } from '../components/Shared';
import { 
  Briefcase, DollarSign, Sparkles, FileText, CheckSquare, 
  Database, Home, Calendar, Users, Upload, Trash2, ArrowRight,
  TrendingUp, AlertCircle, CheckCircle2, ShieldCheck, Target, AlertTriangle, User as UserIcon
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
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-insights' | 'property' | 'offers' | 'tasks' | 'full-record'>('overview');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDealData();
    }
  }, [isOpen, deal.id]);

  const loadDealData = async () => {
    const [allOffers, allTasks] = await Promise.all([
      dataService.getOffers(deal.id),
      dataService.getTasks()
    ]);
    setOffers(allOffers);
    setTasks(allTasks.filter(t => t.dealId === deal.id));
  };

  const handleAiSummarize = async () => {
    setIsAiLoading(true);
    try {
      const summary = await getDealSummary(deal);
      setAiSummary(summary);
    } catch (e) {
      setAiSummary("Could not generate summary.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Contract Price</p>
          <p className="text-xl font-bold text-emerald-900">{formatCurrency(deal.price)}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Potential Commission</p>
          <p className="text-xl font-bold text-indigo-900">{formatCurrency(deal.commission_amount)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Commission Rate</p>
          <p className="text-xl font-bold text-gray-900">{deal.commission_percent}%</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Calendar size={16}/> Transaction Timeline</h4>
          <Badge color={deal.status === 'Closed' ? 'purple' : 'blue'}>{deal.status}</Badge>
        </div>
        <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Listed Date</label>
            <p className="text-sm font-medium">{new Date(deal.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Settlement Date</label>
            <p className="text-sm font-bold text-indigo-600">{deal.settlement_date ? new Date(deal.settlement_date).toLocaleDateString() : 'PENDING'}</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2"><Sparkles size={16}/> Nexus Activity Summary</h4>
          <Button size="sm" variant="outline" onClick={handleAiSummarize} disabled={isAiLoading}>
            {isAiLoading ? 'Analysing...' : 'Generate'}
          </Button>
        </div>
        <div className="text-sm text-purple-800 leading-relaxed italic">
          {aiSummary || "Click to generate a narrative summary of this transaction's progress."}
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

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Executive Summary</h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap italic">"{deal.ai_summary.raw_text}"</p>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <ShieldCheck size={12}/> Analysis generated using verified public records and Estated AVM data.
            </div>
        </div>
    );
  };

  const renderFullRecord = () => (
    <div className="space-y-4">
        <div className="bg-slate-900 text-white rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Database size={14} className="text-indigo-400"/> Verified Property Metadata</h4>
            <Badge color="green">Match Confirmed</Badge>
        </div>
        <div className="p-4 max-h-[50vh] overflow-y-auto font-mono text-[11px] leading-loose">
            {deal.raw_data ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4 mb-4">
                        <div>
                            <span className="text-slate-500 block">SOURCE</span>
                            <span className="text-indigo-300 font-bold">{deal.raw_data.source}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">CONFIDENCE SCORE</span>
                            <span className="text-emerald-400 font-bold">{(deal.raw_data.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    {Object.entries(deal.raw_data.api_response || {}).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-2 border-b border-slate-800/50 py-1.5 hover:bg-slate-800/50 px-2 transition-colors">
                        <span className="text-slate-500 font-bold opacity-80 uppercase tracking-tighter">{k.replace(/_/g, ' ')}</span>
                        <span className="text-emerald-400 truncate pl-4" title={String(v)}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                    ))}
                </div>
            ) : <div className="text-slate-500 py-20 text-center italic">No raw metadata associated with this deal.</div>}
        </div>
        </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={deal.property_address} 
      maxWidth="max-w-6xl"
    >
      <div className="flex h-[80vh]">
        {/* Sidebar Tabs */}
        <div className="w-56 border-r border-gray-100 pr-4 flex flex-col gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: <Briefcase size={16}/> },
            { id: 'ai-insights', label: 'AI Insights', icon: <Sparkles size={16}/> },
            { id: 'property', label: 'Property Specs', icon: <Home size={16}/> },
            { id: 'offers', label: 'Offer Board', icon: <TrendingUp size={16}/> },
            { id: 'tasks', label: 'Checklist', icon: <CheckSquare size={16}/> },
            { id: 'full-record', label: 'Full Record', icon: <Database size={16}/> },
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
          
          <div className="mt-auto pt-4 border-t border-gray-100">
             <Button variant="danger" size="sm" className="w-full rounded-xl" icon={<Trash2 size={14}/>} onClick={() => onDeleteDeal(deal.id)}>Archived Deal</Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 pl-8 overflow-y-auto custom-scrollbar">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'ai-insights' && renderAIInsights()}
          {activeTab === 'full-record' && renderFullRecord()}
          {activeTab === 'property' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-8">
                    <InputGroup label="Property Type"><p className="text-gray-900 font-bold">{deal.property_type || 'Residential'}</p></InputGroup>
                    <InputGroup label="Year Built"><p className="text-gray-900 font-bold">{deal.year_built || 'N/A'}</p></InputGroup>
                    <div className="col-span-2 grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Beds</span>
                            <p className="text-2xl font-black text-gray-900">{deal.beds || 0}</p>
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Baths</span>
                            <p className="text-2xl font-black text-gray-900">{deal.baths || 0}</p>
                        </div>
                        <div className="text-center col-span-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Lot Size</span>
                            <p className="text-lg font-bold text-gray-900">{deal.lot_size || 'N/A'}</p>
                        </div>
                    </div>
                    <InputGroup label="City / Zip"><p className="text-gray-900 font-medium">{deal.city}, {deal.zip}</p></InputGroup>
                    <InputGroup label="Registered Owner"><p className="text-gray-900 font-medium">{deal.owner_name}</p></InputGroup>
                </div>
              </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
