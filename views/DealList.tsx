
import React, { useState } from 'react';
import { Deal, DealStatus } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { Search, Plus, MapPin, DollarSign, Home, MoreHorizontal, ChevronRight, Sparkles, LayoutGrid, Calendar } from 'lucide-react';
import { dataService } from '../services/dataService';
import { AddressLookupModal } from '../components/AddressLookupModal';

interface DealListProps {
  deals: Deal[];
  onOpenDeal: (id: string) => void;
  onNewDeal: () => void;
  onRefreshData: () => void;
}

export const DealList: React.FC<DealListProps> = ({ deals, onOpenDeal, onNewDeal, onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);

  // Pipeline Stages per requirements
  const PIPELINE_STAGES: DealStatus[] = ['Active', 'Under Contract', 'Pending', 'Closed'];

  const filteredDeals = (deals || []).filter(d => 
    (d.address?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (d.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getDealsByStatus = (status: DealStatus) => 
    filteredDeals.filter(d => d.status === status);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

  const handleQuickStatusMove = async (deal: Deal, newStatus: DealStatus) => {
    await dataService.updateDealStatus(deal, newStatus);
    onRefreshData();
  };

  const DealCard: React.FC<{ deal: Deal }> = ({ deal }) => (
    <div 
      onClick={() => onOpenDeal(deal.id)}
      className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative"
    >
      <div className="flex justify-between items-start mb-2">
        <Badge color={
          deal.status === 'Active' ? 'green' : 
          deal.status === 'Closed' ? 'purple' : 
          deal.status === 'Under Contract' ? 'blue' : 'yellow'
        }>
          {deal.status}
        </Badge>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{deal.transaction_type}</div>
      </div>
      
      <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
        {deal.address}
      </h4>
      <div className="flex items-center text-xs text-gray-500 mb-3">
        <UserIcon size={12} className="mr-1 text-gray-400" /> {deal.client_name}
      </div>

      <div className="grid grid-cols-2 border-t border-gray-50 pt-3 gap-2">
        <div>
          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Price</p>
          <p className="text-xs font-bold text-gray-900">{formatCurrency(deal.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Comm.</p>
          <p className="text-xs font-medium text-emerald-600">{(deal.commission_rate).toFixed(1)}%</p>
        </div>
      </div>

      {deal.status === 'Closed' && deal.settlement_date && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-purple-600 bg-purple-50 p-1.5 rounded-lg border border-purple-100">
           <Calendar size={12}/> Closed on {new Date(deal.settlement_date).toLocaleDateString()}
        </div>
      )}

      {/* Quick Move Utility */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
          <div className="flex flex-col bg-white shadow-xl border border-gray-200 rounded-lg overflow-hidden translate-x-4">
              {PIPELINE_STAGES.filter(s => s !== deal.status).map(stage => (
                  <button 
                    key={stage}
                    onClick={(e) => { e.stopPropagation(); handleQuickStatusMove(deal, stage); }}
                    className="p-1.5 hover:bg-indigo-50 text-[10px] font-bold text-gray-500 hover:text-indigo-600 uppercase transition-colors text-left"
                  >
                      Move to {stage}
                  </button>
              ))}
          </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutGrid size={32} className="text-indigo-600"/> Deals Pipeline
          </h2>
          <p className="text-sm text-gray-500 font-medium">Tracking {deals.length} active transactions across the team.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search address or client..." 
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-72 bg-white text-gray-900 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setIsLookupModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-indigo-700 hover:bg-gray-50 transition-colors shadow-sm gap-2 border-b-4 active:border-b-0 active:translate-y-0.5"
          >
            <Sparkles size={18} className="text-indigo-600"/> Add by Address
          </button>

          <Button icon={<Plus size={18}/>} onClick={onNewDeal} className="rounded-xl font-bold shadow-lg shadow-indigo-100">
            Manual Deal
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="flex gap-8 h-full min-w-max pb-2">
          {PIPELINE_STAGES.map(stage => {
            const stageDeals = getDealsByStatus(stage);
            return (
              <div key={stage} className="w-[320px] flex flex-col bg-gray-100/50 rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-6 px-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{stage}</h3>
                    <span className="bg-white text-indigo-600 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm border border-indigo-100">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                      stage === 'Active' ? 'bg-green-500' : 
                      stage === 'Closed' ? 'bg-purple-500' : 'bg-blue-500'
                  } shadow-lg animate-pulse`}></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {stageDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                  {stageDeals.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-white/50">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No Records</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddressLookupModal 
        isOpen={isLookupModalOpen} 
        onClose={() => setIsLookupModalOpen(false)} 
        onDealCreated={onRefreshData}
      />
    </div>
  );
};

// Helper for card icons
const UserIcon = ({ size, className }: any) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
);
