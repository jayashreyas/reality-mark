
import React, { useState, useEffect, useRef } from 'react';
import { Offer, Deal, OfferStatus, User, Task, Update, DealDocument } from '../types';
import { Card, Badge, Button, Modal, InputGroup } from '../components/Shared';
import { DollarSign, Search, Filter, Plus, Calendar, ArrowRight, Upload, FileText, Trash2, Edit2, User as UserIcon, Briefcase, MapPin, Mail, CheckSquare, PlusCircle, MessageSquare, Phone, Send, ExternalLink, FileSpreadsheet, Download } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'activity' | 'documents'>('details');
  
  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Offer Sub-Data State
  const [offerTasks, setOfferTasks] = useState<Task[]>([]);
  const [offerUpdates, setOfferUpdates] = useState<Update[]>([]);
  
  // Tasks Input
  const [newOfferTask, setNewOfferTask] = useState('');
  
  // Activity Input
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Form State
  const [formPropertyAddress, setFormPropertyAddress] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formCoBuyer, setFormCoBuyer] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCoBuyerEmail, setFormCoBuyerEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formEMDPercent, setFormEMDPercent] = useState<number>(1.0);
  const [formLoanType, setFormLoanType] = useState('Conventional');
  const [formStatus, setFormStatus] = useState<OfferStatus>('Pending');
  const [formNotes, setFormNotes] = useState('');

  // Load sub-data when editing offer
  useEffect(() => {
    if (editingOffer && isModalOpen) {
      // Load Tasks
      dataService.getTasks().then(allTasks => {
        setOfferTasks(allTasks.filter(t => t.offerId === editingOffer.id));
      });
      // Load Updates
      dataService.getOfferUpdates(editingOffer.id).then(setOfferUpdates);
    }
  }, [editingOffer, isModalOpen]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'activity' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [offerUpdates, activeTab]);

  // Filter Logic
  const filteredOffers = offers.filter(offer => {
    const deal = deals.find(d => d.id === offer.dealId);
    const dealAddress = offer.propertyAddress || deal?.address || '';
    const matchesSearch = 
        offer.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || offer.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (offer?: Offer) => {
    setActiveTab('details');
    if (offer) {
      setEditingOffer(offer);
      setFormPropertyAddress(offer.propertyAddress);
      setFormClient(offer.clientName);
      setFormCoBuyer(offer.coBuyerName || '');
      setFormEmail(offer.buyerEmail || '');
      setFormCoBuyerEmail(offer.coBuyerEmail || '');
      setFormAddress(offer.buyerAddress || '');
      setFormAmount(offer.amount);
      setFormEMDPercent(offer.earnestMoneyPercent || 1.0);
      setFormLoanType(offer.loanType || 'Conventional');
      setFormStatus(offer.status);
      setFormNotes(offer.notes || '');
    } else {
      setEditingOffer(null);
      setFormPropertyAddress('');
      setFormClient('');
      setFormCoBuyer('');
      setFormEmail('');
      setFormCoBuyerEmail('');
      setFormAddress('');
      setFormAmount(0);
      setFormEMDPercent(1.0);
      setFormLoanType('Conventional');
      setFormStatus('Pending');
      setFormNotes('');
      setOfferTasks([]);
      setOfferUpdates([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveOffer = async () => {
    if (!formClient || !formAmount) {
        alert("Please enter at least the Primary Buyer Name and Offer Price.");
        return;
    }

    if (editingOffer) {
      await dataService.updateOffer({
        ...editingOffer,
        propertyAddress: formPropertyAddress,
        clientName: formClient,
        coBuyerName: formCoBuyer,
        buyerEmail: formEmail,
        coBuyerEmail: formCoBuyerEmail,
        buyerAddress: formAddress,
        amount: formAmount,
        earnestMoneyPercent: formEMDPercent,
        loanType: formLoanType as any,
        status: formStatus,
        notes: formNotes
      });
    } else {
      await dataService.createOffer({
        propertyAddress: formPropertyAddress,
        clientName: formClient,
        coBuyerName: formCoBuyer,
        buyerEmail: formEmail,
        coBuyerEmail: formCoBuyerEmail,
        buyerAddress: formAddress,
        amount: formAmount,
        earnestMoneyPercent: formEMDPercent,
        loanType: formLoanType as any,
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

  // --- Import / Export ---
  const handleExport = () => {
    const headers = "Property,Buyer,Price,Status,Date,Notes";
    const rows = filteredOffers.map(o => `"${o.propertyAddress}","${o.clientName}",${o.amount},${o.status},${o.submittedDate},"${o.notes || ''}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "offers_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
      // Simple parser for Offers
      const lines = text.split('\n');
      const rows = lines.map(line => line.split(',')); // Basic split, assuming simple CSV
      return rows;
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      try {
          const text = await file.text();
          const rows = parseCSV(text).filter(r => r.length > 1);
          // Expect columns: Property, Buyer, Amount
          const newOffers = [];
          for(let i=1; i<rows.length; i++) {
              const row = rows[i];
              if(row.length >= 3) {
                  newOffers.push({
                      propertyAddress: row[0]?.replace(/"/g, '').trim(),
                      clientName: row[1]?.replace(/"/g, '').trim(),
                      amount: Number(row[2]?.replace(/[^0-9.]/g, '')) || 0,
                      status: 'Pending' as OfferStatus,
                      submittedDate: new Date().toISOString()
                  });
              }
          }
          if(newOffers.length > 0) {
              await dataService.addOffers(newOffers);
              alert(`Imported ${newOffers.length} offers.`);
              onRefreshData();
          } else {
              alert("No valid offers found in CSV.");
          }
      } catch(e) {
          alert("Import failed.");
      } finally {
          setIsImporting(false);
      }
  };

  // --- Sub-Data Handlers ---
  const handleAddOfferTask = async () => {
      if (!newOfferTask.trim() || !editingOffer) return;
      const task = await dataService.createTask({
          title: newOfferTask,
          offerId: editingOffer.id,
          status: 'To Do',
          priority: 'Normal',
          assignedToName: currentUser.displayName,
          dueDate: new Date().toISOString()
      });
      setOfferTasks([...offerTasks, task]);
      setNewOfferTask('');
  };

  const handleToggleOfferTask = async (task: Task) => {
      const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
      const updated = { ...task, status: newStatus as any };
      await dataService.updateTask(updated);
      setOfferTasks(offerTasks.map(t => t.id === task.id ? updated : t));
  };

  const handlePostOfferUpdate = async () => {
      if (!newUpdateContent.trim() || !editingOffer) return;
      const update = await dataService.addUpdate({
          offerId: editingOffer.id,
          content: newUpdateContent,
          tag: 'Note',
          userId: currentUser.id,
          userName: currentUser.displayName
      });
      setOfferUpdates([update, ...offerUpdates]);
      setNewUpdateContent('');
  };

  const handleOfferFileUpload = async (offerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          await dataService.addOfferDocument(offerId, e.target.files[0]);
          if (editingOffer && editingOffer.id === offerId) {
             const updatedAll = await dataService.getAllOffers();
             const updated = updatedAll.find(o => o.id === offerId);
             if (updated) setEditingOffer(updated);
          }
          onRefreshData();
      }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <Card className="flex-1 flex flex-col shadow-sm border border-gray-200" noPadding>
        {/* Header & Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white rounded-t-xl">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Offers Management</h2>
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{offers.length} records</span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-gray-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                 <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }}
                    onChange={handleImportCSV} 
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Upload size={16} /> {isImporting ? 'Importing...' : 'Import / Sync'}
                </button>

                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Download size={16} /> Export
                </button>

                 <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Plus size={16} /> New Offer
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 bg-white">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Property Address</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Buyer</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Price</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Down Pmt</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Submitted</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOffers.map(offer => (
                <tr key={offer.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleOpenModal(offer)}>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                      {offer.propertyAddress || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                      {offer.clientName}
                  </td>
                   <td className="px-6 py-4 text-gray-600 font-medium">
                       ${offer.amount.toLocaleString()}
                   </td>
                   <td className="px-6 py-4 text-gray-600">
                       {offer.earnestMoneyPercent ? `${offer.earnestMoneyPercent}%` : 'N/A'}
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
                      {new Date(offer.submittedDate).toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal(offer); }}>
                             <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteOffer(offer.id); }}>
                             <Trash2 size={16} className="text-red-500"/>
                        </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOffers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No offers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Offer Modal (Mini Deal Room) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOffer ? 'Manage Offer Packet' : 'Log New Offer Packet'} maxWidth="max-w-4xl">
         <div className="flex flex-col h-[70vh]">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
              <button 
                className={`flex-1 min-w-[80px] pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                className={`flex-1 min-w-[80px] pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('tasks')}
                // Removed disabled
              >
                Tasks
              </button>
              <button 
                className={`flex-1 min-w-[80px] pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('activity')}
                // Removed disabled
              >
                Activity
              </button>
              <button 
                className={`flex-1 min-w-[80px] pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('documents')}
                // Removed disabled
              >
                Documents
              </button>
            </div>
            
            {!editingOffer && activeTab !== 'details' && (
               <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
                  Please save the offer details first to access other tabs.
               </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6 overflow-y-auto pr-2 flex-1">
                <InputGroup label="Property Address">
                  <input 
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-gray-900 bg-white"
                      placeholder="e.g. 123 Main St, Springfield"
                      value={formPropertyAddress}
                      onChange={e => setFormPropertyAddress(e.target.value)}
                  />
                </InputGroup>

                {/* Section 1: Buyer Details */}
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2"><UserIcon size={16}/> Buyer Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Primary Buyer">
                      <input 
                          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                          placeholder="e.g. John Smith"
                          value={formClient}
                          onChange={e => setFormClient(e.target.value)}
                      />
                    </InputGroup>
                    <InputGroup label="Buyer Email">
                      <input 
                          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                          placeholder="john@example.com"
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                      />
                    </InputGroup>
                    <InputGroup label="Co-Buyer (Optional)">
                      <input 
                          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                          placeholder="e.g. Mary Smith"
                          value={formCoBuyer}
                          onChange={e => setFormCoBuyer(e.target.value)}
                      />
                    </InputGroup>
                    <InputGroup label="Co-Buyer Email">
                      <input 
                          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                          placeholder="mary@example.com"
                          value={formCoBuyerEmail}
                          onChange={e => setFormCoBuyerEmail(e.target.value)}
                      />
                    </InputGroup>
                    <div className="col-span-2">
                      <InputGroup label="Current Mailing Address">
                        <input 
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                            placeholder="e.g. 500 Park Ave, NY"
                            value={formAddress}
                            onChange={e => setFormAddress(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </div>
                </div>

                {/* Section 2: Financial Terms */}
                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                  <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2"><Briefcase size={16}/> Financial Terms</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <InputGroup label="Offer Price">
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                            <input 
                              type="number"
                              className="w-full border border-gray-300 rounded-md pl-6 p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-gray-900 bg-white"
                              placeholder="0"
                              value={formAmount}
                              onChange={e => setFormAmount(Number(e.target.value))}
                            />
                        </div>
                      </InputGroup>
                      <InputGroup label="EMD % (Earnest Money)">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                              <input 
                                type="number"
                                step="0.1"
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                                placeholder="1.0"
                                value={formEMDPercent}
                                onChange={e => setFormEMDPercent(Number(e.target.value))}
                              />
                              <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                          </div>
                          <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                            = ${((formAmount * formEMDPercent) / 100).toLocaleString()}
                          </div>
                        </div>
                      </InputGroup>
                      <InputGroup label="Loan Type">
                        <select 
                            className="w-full border border-gray-300 rounded-md p-2 bg-white text-sm text-gray-900"
                            value={formLoanType}
                            onChange={e => setFormLoanType(e.target.value)}
                        >
                            <option value="Conventional">Conventional</option>
                            <option value="FHA">FHA</option>
                            <option value="VA">VA</option>
                            <option value="Cash">Cash</option>
                            <option value="Other">Other</option>
                        </select>
                      </InputGroup>
                      <InputGroup label="Status">
                        <select 
                            className="w-full border border-gray-300 rounded-md p-2 bg-white text-sm text-gray-900"
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
                  </div>
                </div>

                {/* Section 3: Notes */}
                <div>
                  <InputGroup label="Notes / Contingencies">
                      <textarea 
                        className="w-full border border-gray-300 rounded-md p-2 h-20 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 bg-white"
                        placeholder="e.g. Inspection within 10 days, closing in 30 days..."
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                      />
                  </InputGroup>
                </div>
                
                <div className="pt-2">
                    <Button 
                      className="w-full" 
                      onClick={handleSaveOffer}
                      // Removed disabled prop
                    >
                      {editingOffer ? 'Update Offer Packet' : 'Save Offer Packet'}
                    </Button>
                </div>
              </div>
            )}

             {activeTab === 'tasks' && editingOffer && (
               <div className="flex-1 flex flex-col overflow-hidden">
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 flex-shrink-0">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                       <CheckSquare size={16} /> Tasks for this Offer
                    </h4>
                    <div className="flex gap-2">
                       <input 
                          className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                          placeholder="Add new task (e.g. Request BFI)"
                          value={newOfferTask}
                          onChange={e => setNewOfferTask(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddOfferTask()}
                       />
                       <Button size="sm" icon={<PlusCircle size={16} />} onClick={handleAddOfferTask}>Add</Button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {offerTasks.length === 0 && (
                       <p className="text-center text-gray-400 text-sm py-8">No tasks for this offer yet.</p>
                    )}
                    {offerTasks.map(task => (
                       <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3">
                             <input 
                                type="checkbox" 
                                checked={task.status === 'Completed'}
                                onChange={() => handleToggleOfferTask(task)}
                                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                             />
                             <span className={`text-sm text-gray-700 ${task.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                                {task.title}
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>
            )}

            {activeTab === 'activity' && editingOffer && (
               <div className="flex-1 flex flex-col overflow-hidden">
                   {/* Feed */}
                   <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2" ref={scrollRef}>
                      {offerUpdates.length === 0 && (
                          <p className="text-center text-gray-400 text-sm py-8">No activity logged for this offer yet.</p>
                      )}
                      {offerUpdates.map(update => {
                        const isMe = update.userId === currentUser.id;
                        return (
                          <div key={update.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl p-3 text-sm ${isMe ? 'bg-indigo-50 text-indigo-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                               <div className="flex items-center gap-1.5 mb-1 opacity-70 text-xs font-semibold">
                                  <span>{update.userName}</span>
                                  <span>•</span>
                                  <span>{new Date(update.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                               </div>
                               <p>{update.content}</p>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                   
                   {/* Input */}
                   <div className="pt-3 border-t border-gray-100 flex gap-2">
                      <input 
                         className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                         placeholder="Log a note or call..."
                         value={newUpdateContent}
                         onChange={e => setNewUpdateContent(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handlePostOfferUpdate()}
                      />
                      <Button size="sm" icon={<Send size={16} />} onClick={handlePostOfferUpdate} />
                   </div>
               </div>
            )}

             {activeTab === 'documents' && editingOffer && (
               <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center flex-shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                           <FileText size={16} /> Offer Documents
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">Pre-approvals, BFI, Contracts</p>
                      </div>
                      <div className="relative">
                            <input 
                              type="file" 
                              id={`modal-offer-doc-${editingOffer.id}`} 
                              className="hidden" 
                              onChange={(e) => handleOfferFileUpload(editingOffer.id, e)}
                              onClick={(e) => (e.target as HTMLInputElement).value = ''}
                            />
                            <label htmlFor={`modal-offer-doc-${editingOffer.id}`} className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                               <Upload size={14} /> Upload New
                            </label>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {(!editingOffer.documents || editingOffer.documents.length === 0) && (
                         <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                            <FileText size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No documents attached.</p>
                         </div>
                      )}
                      {editingOffer.documents?.map(doc => (
                         <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className="bg-blue-50 text-blue-600 p-2 rounded">
                                  <FileText size={16} />
                               </div>
                               <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                                  <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <Button variant="ghost" size="sm">Download</Button>
                         </div>
                      ))}
                   </div>
               </div>
            )}
         </div>
      </Modal>
    </div>
  );
};
