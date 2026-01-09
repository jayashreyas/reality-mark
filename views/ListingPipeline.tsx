
import React, { useState } from 'react';
import { Listing, ListingStatus } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { Search, Plus, MapPin, DollarSign, LayoutGrid, Calendar, ArrowRight, User } from 'lucide-react';
import { dataService } from '../services/dataService';

interface ListingPipelineProps {
  listings: Listing[];
  onOpenListing: (id: string) => void;
  onNewListing: () => void;
  onRefresh: () => void;
}

export const ListingPipeline: React.FC<ListingPipelineProps> = ({ listings, onOpenListing, onNewListing, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const STAGES: ListingStatus[] = ['Coming Soon', 'Active', 'Under Contract', 'Sold'];

  const filtered = listings.filter(l => 
    l.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => (
    <div 
      onClick={() => onOpenListing(listing.id)}
      className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all cursor-pointer group active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-3">
        <Badge color={
          listing.status === 'Active' ? 'green' : 
          listing.status === 'Sold' ? 'purple' : 
          listing.status === 'Under Contract' ? 'blue' : 'yellow'
        }>
          {listing.status}
        </Badge>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SFH</span>
      </div>
      
      <h4 className="font-black text-slate-900 text-base leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
        {listing.address}
      </h4>
      <div className="flex items-center text-[11px] text-slate-500 font-bold mb-4 uppercase gap-1">
        <User size={10} className="text-slate-400" /> {listing.seller_name}
      </div>

      <div className="flex items-end justify-between border-t border-slate-50 pt-4">
        <div>
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">List Price</p>
          <p className="text-base font-black text-slate-900">${listing.price.toLocaleString()}</p>
        </div>
        <button className="p-2 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <LayoutGrid size={40} className="text-indigo-600"/> Listing Pipeline
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Tracking {listings.length} properties for our sellers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search listings..." 
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-80 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button icon={<Plus size={18}/>} onClick={onNewListing} className="rounded-2xl font-black shadow-xl shadow-indigo-100 px-8">
            Create Listing
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-8 h-full min-w-max pb-2">
          {STAGES.map(stage => {
            const stageListings = filtered.filter(l => l.status === stage);
            return (
              <div key={stage} className="w-[340px] flex flex-col bg-slate-100/50 rounded-[2.5rem] p-6 border border-slate-200 shadow-inner">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{stage}</h3>
                  <span className="bg-white text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm border border-indigo-100">
                    {stageListings.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {stageListings.map(l => <ListingCard key={l.id} listing={l} />)}
                  {stageListings.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center bg-white/30 backdrop-blur-sm">
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">No Items</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
