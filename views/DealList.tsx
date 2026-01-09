
import React, { useState } from 'react';
import { Deal, DealStatus } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { Search, Plus, MapPin, DollarSign, Home, MoreHorizontal, ChevronRight, Sparkles } from 'lucide-react';
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

  // Expanded stages to include Leads and Cancelled for full visibility
  const PIPELINE_STAGES: DealStatus[] = ['Lead', 'Active', 'Under Contract', 'Pending', 'Closed', 'Cancelled'];

  const filteredDeals = (deals || []).filter(d => 
    (d.property_address?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (d.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getDealsByStatus = (status: DealStatus) => 
    filteredDeals.filter(d => d.status === status);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

  const handleStatusChange = async (deal: Deal, newStatus: DealStatus) => {
    await dataService.updateDealStatus(deal, newStatus);
    onRefreshData();
  };

  const DealCard: React.FC<{ deal: Deal }> = ({ deal }) => (
    <div 
      onClick={() => onOpenDeal(deal.id)}
      className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative"
    >
      <div className="flex justify-between items-start mb-2">
        <Badge color={
          deal.status === 'Active' ? 'green' : 
          deal.status === 'Closed' ? 'purple' : 
          deal.status === 'Lead' ? 'yellow' : 'blue'
        }>
          {deal.status}
        </Badge>
        <div className="text-[10px] font-bold text-gray-400 uppercase">{deal.property_type || 'Residential'}</div>
      </div>
      
      <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
        {deal.property_address}
      </h4>
      <div className="flex items-center text-xs text-gray-500 mb-3">
        <MapPin size={12} className="mr-1" /> {deal.city || 'N/A'}, {deal.state || 'N/A'}
      </div>

      <div className="grid grid-cols-2 border-t border-gray-50 pt-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Price</p>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(deal.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Beds/Baths</p>
          <p className="text-sm font-medium text-gray-700">{deal.beds || 0} / {deal.baths || 0}</p>
        </div>
      </div>

      <select 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-gray-50 outline-none"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => handleStatusChange(deal, e.target.value as DealStatus)}
        value={deal.status}
      >
        {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction Pipeline</h2>
          <p className="text-sm text-gray-500">Manage active deals and track closings.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search address or client..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 bg-white text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setIsLookupModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm gap-2"
          >
            <Sparkles size={18} className="text-indigo-600"/> Add by Address
          </button>

          <Button icon={<Plus size={18}/>} onClick={onNewDeal}>
            New Deal
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-max">
          {PIPELINE_STAGES.map(stage => {
            const stageDeals = getDealsByStatus(stage);
            return (
              <div key={stage} className="w-80 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-700 uppercase text-xs tracking-widest">{stage}</h3>
                    <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {stageDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                  {stageDeals.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                      <p className="text-xs text-gray-400 font-medium">No deals in {stage}</p>
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
