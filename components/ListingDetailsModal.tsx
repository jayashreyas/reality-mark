
import React, { useState, useEffect } from 'react';
import { Listing, ListingStatus, User, Update, Task } from '../types';
import { Modal, Button, InputGroup, Badge } from './Shared';
import { 
  Home, User as UserIcon, DollarSign, Calendar, MapPin, 
  Trash2, Save, X, Sparkles, MessageSquare, ListTodo, 
  PlusCircle, Send, CheckCircle2, TrendingUp, History,
  Database, Layers, Landmark, Shield
} from 'lucide-react';
import { dataService } from '../services/dataService';

interface ListingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  currentUser: User;
  onRefresh: () => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({ 
  isOpen, onClose, listing, currentUser, onRefresh 
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'ownership' | 'taxes' | 'specs' | 'lot' | 'history' | 'activity'>('details');
  const [formData, setFormData] = useState<Listing>(listing);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(listing);
      loadUpdates();
    }
  }, [listing, isOpen]);

  const loadUpdates = async () => {
    try {
      const u = await dataService.getListingUpdates(listing.id);
      setUpdates(u);
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataService.updateListing(formData);
      onRefresh();
      onClose();
    } catch (e) { alert("Failed to save changes."); }
    finally { setIsSaving(false); }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    const up = await dataService.addUpdate({
      listingId: listing.id,
      content: newUpdate,
      tag: 'Note',
      userId: currentUser.id,
      userName: currentUser.displayName,
    });
    setUpdates([up, ...updates]);
    setNewUpdate('');
  };

  const DataField = ({ label, value }: { label: string, value: any }) => (
    <div className="border-b border-slate-50 py-3 group hover:bg-slate-50/50 transition-colors">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800 leading-tight truncate" title={String(value || '')}>{value || '—'}</p>
    </div>
  );

  const SectionHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
    <h4 className="flex items-center gap-2 text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 border-b border-indigo-100 pb-2 mt-6">
      {icon} {title}
    </h4>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formData.PropertyAddressFormatted || formData.address} maxWidth="max-w-7xl">
      <div className="flex h-[82vh]">
        {/* Sidebar Tabs */}
        <div className="w-60 border-r border-slate-100 pr-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-6 mt-2">
             <Badge color={formData.status === 'Sold' ? 'purple' : 'green'}>{formData.status}</Badge>
             <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">MLS# {formData.MLSNumber || 'TBD'}</p>
          </div>
          
          {[
            { id: 'details', label: 'Primary Record', icon: <Database size={16}/> },
            { id: 'ownership', label: 'Ownership Tiers', icon: <UserIcon size={16}/> },
            { id: 'taxes', label: 'Taxes & Asmt', icon: <Landmark size={16}/> },
            { id: 'specs', label: 'Building Specs', icon: <Home size={16}/> },
            { id: 'lot', label: 'Lot & Zoning', icon: <Layers size={16}/> },
            { id: 'history', label: 'Sale History', icon: <History size={16}/> },
            { id: 'activity', label: 'Internal Log', icon: <MessageSquare size={16}/> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          
          <div className="mt-auto pt-4 border-t border-slate-50">
            <Button variant="danger" size="sm" className="w-full justify-start text-[10px] font-black uppercase tracking-widest rounded-xl" icon={<Trash2 size={14}/>}>Delete Property</Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 pl-10 overflow-y-auto custom-scrollbar bg-white">
          
          {activeTab === 'details' && (
            <div className="space-y-8 animate-in fade-in duration-300 pr-4">
               <header className="mb-10">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formData.PropertyAddressFormatted || formData.address}</h3>
                  <div className="flex items-center gap-4 text-slate-500 font-bold mt-2">
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-indigo-500"/> {formData.PropertyCityState}</span>
                    <span className="flex items-center gap-1.5"><Shield size={16} className="text-indigo-500"/> {formData.Zipcode} {formData.Zip4 && `-${formData.Zip4}`}</span>
                  </div>
               </header>

               <section>
                 <SectionHeader title="Core Identifiers" icon={<Database size={14}/>} />
                 <div className="grid grid-cols-3 gap-x-12 gap-y-4">
                    <DataField label="MLS Number" value={formData.MLSNumber} />
                    <DataField label="Municipality" value={formData.Municipality} />
                    <DataField label="Subdivision" value={formData.SubdivisionNeighborhood} />
                    <DataField label="Carrier Route" value={formData.CarrierRoute} />
                    <DataField label="Zipcode" value={formData.Zipcode} />
                    <DataField label="Zip+4" value={formData.Zip4} />
                    <DataField label="Do Not Mail" value={formData.PropDoNotMail} />
                 </div>
               </section>

               <section>
                 <SectionHeader title="Pipeline Terms" icon={<TrendingUp size={14}/>} />
                 <div className="grid grid-cols-3 gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <InputGroup label="Listing Price ($)">
                       <input type="number" className="w-full border-2 border-slate-200 rounded-xl p-3 font-black text-xl text-slate-900 focus:border-indigo-500 transition-all outline-none" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </InputGroup>
                    <InputGroup label="Pipeline Status">
                       <select className="w-full border-2 border-slate-200 rounded-xl p-3 bg-white font-black text-indigo-700 focus:border-indigo-500 transition-all outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ListingStatus})}>
                          <option value="Active">Active</option>
                          <option value="Under Contract">Under Contract</option>
                          <option value="Sold">Sold</option>
                          <option value="Expired">Expired</option>
                       </select>
                    </InputGroup>
                    <InputGroup label="Comm. Rate (%)">
                       <input type="number" step="0.1" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})} />
                    </InputGroup>
                 </div>
               </section>
            </div>
          )}

          {activeTab === 'ownership' && (
             <div className="space-y-8 animate-in fade-in duration-300 pr-4">
                <section>
                   <SectionHeader title="Primary Ownership" icon={<UserIcon size={14}/>} />
                   <div className="grid grid-cols-3 gap-x-12 gap-y-4">
                      <DataField label="Owner Names (Full)" value={formData.OwnerNames} />
                      <DataField label="Owner First Name" value={formData.OwnerFirstName} />
                      <DataField label="Owner Last Name" value={formData.OwnerLastName} />
                      <DataField label="Owner Occupied" value={formData.OwnerOccupied} />
                      <DataField label="Care Of" value={formData.OwnerCareOf} />
                      <DataField label="Owner Do Not Mail" value={formData.OwnerDoNotMail} />
                   </div>
                </section>
                <section>
                   <SectionHeader title="Secondary Registry" icon={<Layers size={14}/>} />
                   <div className="grid grid-cols-4 gap-x-10 gap-y-4">
                      <DataField label="Owner 2 First" value={formData.Owner2FirstName} />
                      <DataField label="Owner 2 Last" value={formData.Owner2LastName} />
                      <DataField label="Owner 3 First" value={formData.Owner3FirstName} />
                      <DataField label="Owner 3 Last" value={formData.Owner3LastName} />
                      <DataField label="Owner 4 First" value={formData.Owner4FirstName} />
                      <DataField label="Owner 4 Last" value={formData.Owner4LastName} />
                   </div>
                </section>
                <section>
                   <SectionHeader title="Billing & Mailing" icon={<MapPin size={14}/>} />
                   <div className="grid grid-cols-3 gap-x-12 gap-y-4">
                      <DataField label="Mailing Address" value={formData.OwnerAddress} />
                      <DataField label="City / State" value={formData.OwnerCityState} />
                      <DataField label="Mailing Zip Code" value={formData.OwnerZipCode} />
                      <DataField label="Mailing Zip+4" value={formData.OwnerZip4} />
                      <DataField label="Mailing Carrier Route" value={formData.OwnerCarrierRoute} />
                   </div>
                </section>
             </div>
          )}

          {activeTab === 'taxes' && (
             <div className="space-y-8 animate-in fade-in duration-300 pr-4">
                <section>
                   <SectionHeader title="Legal & Tax Identifiers" icon={<Landmark size={14}/>} />
                   <div className="grid grid-cols-4 gap-x-10 gap-y-4">
                      <DataField label="Tax ID" value={formData.TaxID} />
                      <DataField label="Alt Tax ID" value={formData.TaxIDAlt} />
                      <DataField label="Tax Map" value={formData.TaxMap} />
                      <DataField label="School District" value={formData.SchoolDistrict} />
                      <DataField label="Block" value={formData.Block} />
                      <DataField label="Lot" value={formData.Lot} />
                      <DataField label="Qual Code" value={formData.QualCode} />
                      <DataField label="Census Tract Block" value={formData.CensusTractBlock} />
                   </div>
                </section>
                <section>
                   <SectionHeader title={`Annual Taxation (${formData.TaxYear || 'Current'})`} icon={<DollarSign size={14}/>} />
                   <div className="grid grid-cols-3 gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 mb-8">
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Annual Tax</p><p className="text-2xl font-black text-slate-900">${Number(formData.AnnualTax || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">County Tax</p><p className="text-xl font-bold text-slate-700">${Number(formData.CountyTax || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">School Tax</p><p className="text-xl font-bold text-slate-700">${Number(formData.SchoolTax || 0).toLocaleString()}</p></div>
                   </div>
                   <div className="grid grid-cols-4 gap-x-10 gap-y-4">
                      <DataField label="Municipal Tax" value={`$${Number(formData.MunicipalTax || 0).toLocaleString()}`} />
                      <DataField label="Total Land Asmt" value={`$${Number(formData.TotalLandAsmt || 0).toLocaleString()}`} />
                      <DataField label="Total Bldg Asmt" value={`$${Number(formData.TotalBldgAsmt || 0).toLocaleString()}`} />
                      <DataField label="Taxable Total Asmt" value={`$${Number(formData.TaxableTotalAsmt || 0).toLocaleString()}`} />
                   </div>
                </section>
             </div>
          )}

          {activeTab === 'specs' && (
             <div className="space-y-8 animate-in fade-in duration-300 pr-4">
                <section>
                   <SectionHeader title="Structure Details" icon={<Home size={14}/>} />
                   <div className="grid grid-cols-4 gap-x-10 gap-y-4">
                      <DataField label="Property Class" value={formData.PropertyClass} />
                      <DataField label="Land Use" value={formData.LandUse} />
                      <DataField label="Year Built" value={formData.YearBuilt} />
                      <DataField label="Year Remodeled" value={formData.YearRemod} />
                      <DataField label="Total Bldg Sq Ft" value={formData.BldgSqFtTotal} />
                      <DataField label="Stories" value={formData.Stories} />
                      <DataField label="Bedrooms" value={formData.Bedrooms} />
                      <DataField label="Condo Y/N" value={formData.CondoYN} />
                   </div>
                </section>
                <section>
                   <SectionHeader title="Exterior & Mechanicals" icon={<Database size={14}/>} />
                   <div className="grid grid-cols-3 gap-x-12 gap-y-4">
                      <DataField label="Exterior Type" value={formData.Exterior} />
                      <DataField label="Basement" value={formData.BsmtDesc} />
                      <DataField label="Fireplaces" value={formData.FireplaceTotal} />
                      <DataField label="Garage" value={formData.GrgType} />
                      <DataField label="Pool" value={formData.PoolType} />
                      <DataField label="Heat System" value={formData.HeatDelivery} />
                   </div>
                   <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">County Bldg Desc</p>
                      <p className="text-sm font-medium text-slate-700 italic">{formData.CountyBldgDesc || 'No extended description available.'}</p>
                   </div>
                </section>
             </div>
          )}

          {activeTab === 'lot' && (
             <div className="space-y-8 animate-in fade-in duration-300 pr-4">
                <section>
                   <SectionHeader title="Lot Information" icon={<Layers size={14}/>} />
                   <div className="grid grid-cols-3 gap-x-12 gap-y-4">
                      <DataField label="Lot Acres" value={formData.LotAcres} />
                      <DataField label="Lot Sq Ft" value={formData.LotSqFt} />
                      <DataField label="Zoning" value={formData.Zoning} />
                      <DataField label="Frontage" value={formData.LotFrontage} />
                      <DataField label="Depth" value={formData.LotDepth} />
                      <DataField label="Shape" value={formData.LotShape} />
                   </div>
                </section>
                <section>
                   <SectionHeader title="Site Descriptions" icon={<Database size={14}/>} />
                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">County Land Desc</p>
                      <p className="text-sm font-medium text-slate-700 italic">{formData.CountyLandDesc || 'No extended land description available.'}</p>
                   </div>
                </section>
             </div>
          )}

          {activeTab === 'history' && (
             <div className="space-y-8 animate-in fade-in duration-300 pr-4">
                <section>
                   <SectionHeader title="Market Transactions" icon={<History size={14}/>} />
                   <div className="grid grid-cols-3 gap-10 p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl border-b-8 border-indigo-500">
                      <div><p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.1em] mb-1">Sale Amount</p><p className="text-2xl font-black">${Number(formData.SaleAmt || 0).toLocaleString()}</p></div>
                      <div><p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.1em] mb-1">Settle Date</p><p className="text-xl font-bold">{formData.SettleDate || '—'}</p></div>
                      <div><p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.1em] mb-1">Sale Type</p><p className="text-xl font-bold">{formData.SaleType || 'Unknown'}</p></div>
                   </div>
                   <div className="grid grid-cols-2 gap-x-12 mt-10">
                      <DataField label="Deed Record Date" value={formData.DeedRecordDate} />
                      <DataField label="Internal Listed Date" value={formData.createdAt} />
                   </div>
                </section>
             </div>
          )}

          {activeTab === 'activity' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 pr-4">
               <div className="flex-1 space-y-4 mb-8">
                  {updates.map(up => (
                    <div key={up.id} className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{up.userName}</span>
                         <span className="text-[9px] text-slate-400 font-bold">{new Date(up.timestamp).toLocaleString()}</span>
                       </div>
                       <p className="text-sm text-slate-700 font-medium">{up.content}</p>
                    </div>
                  ))}
                  {updates.length === 0 && <div className="py-20 text-center opacity-30 font-black uppercase text-xs tracking-widest">No Log Entries</div>}
               </div>
               <div className="pt-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white pb-2">
                  <input className="flex-1 border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 bg-slate-50 transition-all" placeholder="Enter an internal note..." value={newUpdate} onChange={e => setNewUpdate(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddUpdate()} />
                  <Button icon={<Send size={20}/>} className="rounded-2xl px-8" onClick={handleAddUpdate}>Post</Button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end gap-3">
         <Button variant="outline" className="rounded-2xl px-8 font-black uppercase tracking-widest text-xs" onClick={onClose}>Close Profile</Button>
         <Button className="rounded-2xl px-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Synchronizing...' : 'Save All Updates'}
         </Button>
      </div>
    </Modal>
  );
};
