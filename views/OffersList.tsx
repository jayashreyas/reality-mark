
import React, { useState, useEffect } from 'react';
import { Offer, Deal, OfferStatus, User } from '../types';
import { Card, Badge, Button, Modal, InputGroup } from '../components/Shared';
import { DollarSign, Search, Filter, Plus, Calendar, ArrowRight, Upload, FileText, Trash2, Edit2 } from 'lucide-react';
import { dataService } from '../services/dataService';

interface OffersListProps {
  offers: Offer[];
  deals: Deal[];
  currentUser: User;
  onRefreshData: () => void;
  onOpenDeal: (id: string) => void;
}

export const OffersList: React.FC<OffersListProps> = ({ offers, deals, currentUser, onRefreshData, onOpenDeal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  
  // Form State
  const [formDealId, setFormDealId] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<OfferStatus>('Pending');
  const [formNotes, setFormNotes] = useState('');

  // Filter Logic
  const filteredOffers = offers.filter(offer => {
    const deal = deals.find(d => d.id === offer.dealId);
    const dealAddress = deal?.address || '';
    const matchesSearch = 
        offer.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || offer.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormDealId(offer.dealId);
      setFormClient(offer.clientName);
      setFormAmount(offer.amount);
      setFormStatus(offer.status);
      setFormNotes(offer.notes || '');
    } else {
      setEditingOffer(null);
      setFormDealId(deals.length > 0 ? deals[0].id : '');
      setFormClient('');
      setFormAmount(0);
      setFormStatus('Pending');
      setFormNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveOffer = async () => {
    if (!formDealId || !formClient || !formAmount) return;

    if (editingOffer) {
      await dataService.updateOffer({
        ...editingOffer,
        dealId: formDealId,
        clientName: formClient,
        amount: formAmount,
        status: formStatus,
        notes: formNotes
      });
    } else {
      await dataService.createOffer({
        dealId: formDealId,
        clientName: formClient,
        amount: formAmount,
        status: formStatus,
        notes: formNotes,
        submittedDate: new Date().toISOString(),
        documents: []
      });
    }
    setIsModalOpen(false);
    onRefreshData();
  };

  const handleDeleteOffer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      await dataService.deleteOffer(id);
      onRefreshData();
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign size={32} className="text-indigo-600" />
            All Offers
          </h2>
          <p className="text-gray-500 mt-1">Track negotiations and offer history across all deals.</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => handleOpenModal()}>
          Log New Offer
        </Button>
      </header>

      <Card className="flex-1 flex flex-col" noPadding>
         {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search client or property..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <Filter size={18} className="text-gray-400" />
            {['All', 'Pending', 'Accepted', 'Countered', 'Rejected', 'Withdrawn'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  filterStatus === status 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Client / Buyer</th>
                <th className="px-6 py-3">Property (Deal)</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Submitted</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOffers.map(offer => {
                const deal = deals.find(d => d.id === offer.dealId);
                return (
                  <tr key={offer.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {offer.clientName}
                      {offer.documents && offer.documents.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <FileText size={10} /> {offer.documents.length} Doc(s)
                          </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div 
                         className="text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                         onClick={() => deal && onOpenDeal(deal.id)}
                       >
                         {deal?.address || 'Unknown Deal'} <ArrowRight size={12} />
                       </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">
                      ${offer.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                       <Badge color={
                          offer.status === 'Accepted' ? 'green' : 
                          offer.status === 'Rejected' ? 'red' :
                          offer.status === 'Countered' ? 'purple' : 
                          offer.status === 'Withdrawn' ? 'gray' : 'yellow'
                        }>
                         {offer.status}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                       {new Date(offer.submittedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" onClick={() => handleOpenModal(offer)}><Edit2 size={14}/></Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteOffer(offer.id)}><Trash2 size={14}/></Button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOffers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No offers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Offer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOffer ? 'Edit Offer' : 'Log New Offer'}>
         <div className="space-y-4">
           <InputGroup label="Associated Deal">
             <select 
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
                value={formDealId}
                onChange={e => setFormDealId(e.target.value)}
                disabled={deals.length === 0}
             >
                {deals.map(d => (
                   <option key={d.id} value={d.id}>{d.address} - {d.clientName}</option>
                ))}
                {deals.length === 0 && <option value="">No deals available</option>}
             </select>
           </InputGroup>
           <InputGroup label="Client/Buyer Name">
             <input 
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Robert Smith"
                value={formClient}
                onChange={e => setFormClient(e.target.value)}
             />
           </InputGroup>
           <InputGroup label="Offer Amount">
             <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input 
                  type="number"
                  className="w-full border border-gray-300 rounded-md pl-6 p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="500000"
                  value={formAmount}
                  onChange={e => setFormAmount(Number(e.target.value))}
                />
             </div>
           </InputGroup>
           <InputGroup label="Status">
             <select 
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as OfferStatus)}
             >
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Countered">Countered</option>
                <option value="Withdrawn">Withdrawn</option>
             </select>
           </InputGroup>
           <InputGroup label="Notes/Conditions">
              <textarea 
                className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Subject to inspection..."
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
              />
           </InputGroup>
           <div className="pt-2">
              <Button 
                className="w-full" 
                onClick={handleSaveOffer}
                disabled={!formClient || !formAmount || !formDealId}
              >
                {editingOffer ? 'Update Offer' : 'Log Offer'}
              </Button>
           </div>
         </div>
      </Modal>
    </div>
  );
};
