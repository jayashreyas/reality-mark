
import React, { useState } from 'react';
import { Offer, Listing, OfferStatus, User } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { TrendingUp, Search, Plus, MapPin, Sparkles, Clock, CheckCircle2, XCircle, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { OfferPacketModal } from '../components/OfferPacketModal';
import { dataService } from '../services/dataService';

interface OfferPipelineProps {
  offers: Offer[];
  listings: Listing[];
  currentUser: User;
  onRefreshData: () => void;
  onOpenListing: (id: string) => void;
}

export const OfferPipeline: React.FC<OfferPipelineProps> = ({ offers, listings, currentUser, onRefreshData, onOpenListing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isPacketModalOpen, setIsPacketModalOpen] = useState(false);

  const STAGES: OfferStatus[] = ['Draft', 'Submitted', 'Countered', 'Accepted', 'Lost'];

  const filtered = offers.filter(o => 
    o.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.property_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const OfferCard: React.FC<{ offer: Offer }> = ({ offer }) => (
    <div 
      onClick={() => { setSelectedOffer(offer); setIsPacketModalOpen(true); }}
      className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all cursor-pointer group active:scale-95"
    >
      <div className="flex justify-between items-start mb-3">
        <Badge color={
          offer.status === 'Accepted' ? 'green' : 
          offer.status === 'Countered' ? 'purple' : 
          offer.status === 'Lost' ? 'red' : 'blue'
        }>
          {offer.status}
        </Badge>
        <span className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
          {offer.financing_type || offer.loanType}
        </span>
      </div>
      
      <h4 className="font-black text-slate-900 text-base leading-tight mb-1">{offer.buyer_name}</h4>
      <div className="flex items-center text-[11px] text-slate-500 font-bold mb-4 uppercase gap-1">
        <MapPin size={10} /> {offer.property_address || offer.propertyAddress}
      </div>

      <div className="flex items-end justify-between border-t border-slate-50 pt-4 mt-2">
        <div>
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Offer Amount</p>
          <p className="text-lg font-black text-slate-900">${(offer.offer_price || offer.amount || 0).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">DP: {offer.down_payment}%</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50 overflow-hidden">
      <header className="flex justify-between items-end mb-10 flex-shrink-0">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
             <TrendingUp size={40} className="text-indigo-600" /> Offer Pipeline
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Tracking our buyers' active property negotiations.</p>
        </div>
        <div className="flex gap-3">
            <Button variant="primary" icon={<Plus size={18}/>} onClick={() => { setSelectedOffer(null); setIsPacketModalOpen(true); }} className="rounded-xl font-black shadow-xl shadow-indigo-100 px-8">
              New Buyer Offer
            </Button>
        </div>
      </header>

      <div className="flex items-center justify-between mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by buyer or property..." 
            className="w-full pl-12 pr-4 py-3 bg-transparent text-sm focus:outline-none font-medium text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-6 px-4">
           <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Team Sync <span className="text-emerald-500 animate-pulse ml-2">● Live</span></p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-8 h-full min-w-max pb-2">
          {STAGES.map(stage => {
            const stageOffers = filtered.filter(o => o.status === stage);
            return (
              <div key={stage} className="w-[340px] flex flex-col bg-slate-100/50 rounded-[2.5rem] p-5 border border-slate-200 shadow-inner">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{stage}</h3>
                  </div>
                  <span className="bg-white text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                    {stageOffers.length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {stageOffers.map(offer => <OfferCard key={offer.id} offer={offer} />)}
                  {stageOffers.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center bg-white/30 backdrop-blur-sm mt-2">
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">No Items</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isPacketModalOpen && (
        <OfferPacketModal 
          isOpen={isPacketModalOpen}
          onClose={() => setIsPacketModalOpen(false)}
          offer={selectedOffer}
          deal={listings[0] as any} // Fallback
          currentUser={currentUser}
          onSuccess={onRefreshData}
        />
      )}
    </div>
  );
};
