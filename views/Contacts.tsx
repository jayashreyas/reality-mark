
import React, { useState, useEffect, useRef } from 'react';
import { Contact, ContactType } from '../types';
import { Card, Button, Modal, InputGroup, Badge } from '../components/Shared';
import { Users, Search, Filter, Plus, Phone, Mail, Edit2, Trash2, FileSpreadsheet, Download, Sparkles, Copy, MessageCircle, AlertTriangle, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { dataService } from '../services/dataService';
import { generateFollowUp, cleanImportData, extractPublicRecordData } from '../services/geminiService';

interface ContactsProps {
  contacts: Contact[];
  onRefresh: () => void;
}

export const Contacts: React.FC<ContactsProps> = ({ contacts, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // View Contact State
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  
  // AI Follow-up State
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [followUpData, setFollowUpData] = useState<{ sms: string; email: string } | null>(null);

  // AI Import Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [reviewData, setReviewData] = useState<{ cleaned: any[], issues: string[] } | null>(null);

  // AI Record Scrubber State
  const [isScrubModalOpen, setIsScrubModalOpen] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [rawScrubText, setRawScrubText] = useState('');
  const [scrubResult, setScrubResult] = useState<any | null>(null);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<ContactType>('Lead');
  const [notes, setNotes] = useState('');

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingId(contact.id);
      setName(contact.name);
      setEmail(contact.email);
      setPhone(contact.phone);
      setType(contact.type);
      setNotes(contact.notes || '');
    } else {
      setEditingId(null);
      setName('');
      setEmail('');
      setPhone('');
      setType('Lead');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !email) return;

    if (editingId) {
      const existing = contacts.find(c => c.id === editingId);
      if (existing) {
        await dataService.updateContact({
          ...existing,
          name,
          email,
          phone,
          type,
          notes
        });
      }
    } else {
      await dataService.addContact({
        name,
        email,
        phone,
        type,
        notes
      });
    }
    
    setIsModalOpen(false);
    onRefresh();
  };

  const handleScrubRecord = async () => {
    if (!rawScrubText.trim()) return;
    setIsScrubbing(true);
    setScrubResult(null);
    try {
      const result = await extractPublicRecordData(rawScrubText);
      setScrubResult(result);
    } catch (e) {
      alert("Failed to parse record.");
    } finally {
      setIsScrubbing(false);
    }
  };

  const handleSaveScrubbed = async () => {
    if (!scrubResult) return;
    const notesArr = [
      `Source: Public Record Scrub`,
      `Type: ${scrubResult.property_type || 'N/A'}`,
      `Bedrooms: ${scrubResult.bedrooms || 'N/A'}`,
      `Owner Occupied: ${scrubResult.owner_occupied === true ? 'Yes' : scrubResult.owner_occupied === false ? 'No' : 'N/A'}`,
      `Last Sale: ${scrubResult.last_sale_date || 'N/A'} (${scrubResult.date_source || 'Unknown Source'})`,
      `ZIP: ${scrubResult.zip || 'N/A'}`
    ];

    await dataService.addContact({
      name: scrubResult.full_name,
      email: '', 
      phone: '', 
      type: 'Lead',
      notes: notesArr.join('\n')
    });
    
    setIsScrubModalOpen(false);
    setRawScrubText('');
    setScrubResult(null);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this contact?')) {
      await dataService.deleteContact(id);
      onRefresh();
    }
  };

  const handleGenerateFollowUp = async (contact: Contact) => {
    setIsFollowUpLoading(true);
    setFollowUpData(null);
    setIsFollowUpOpen(true);
    try {
      const data = await generateFollowUp(contact);
      setFollowUpData(data);
    } catch (e) {
      setFollowUpData({ sms: "Error generating draft.", email: "Error generating draft." });
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = "Name,Email,Phone,Type,Notes";
    const row1 = "John Doe,john@example.com,555-123-4567,Buyer,Looking for 3 bed";
    const row2 = "Jane Smith,jane@example.com,555-987-6543,Seller,Has a condo downtown";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(`${headers}\n${row1}\n${row2}`);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "reality_mark_contacts_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const firstLine = text.split('\n')[0];
    let delimiter = ',';
    if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
    if (firstLine.includes('\t')) delimiter = '\t';

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuote && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === delimiter && !inQuote) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuote) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const dataRows = rows.filter(r => r.length > 0 && r.some(c => c.length > 0));

      if (dataRows.length < 2) {
        throw new Error("File appears to be empty or missing headers");
      }

      const headers = dataRows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const originalHeaders = dataRows[0].map(h => h.toLowerCase());

      const findCol = (includes: string[], avoids: string[] = []) => {
        return headers.findIndex((h, i) => {
           const orig = originalHeaders[i];
           return includes.some(term => orig.includes(term)) && 
                  !avoids.some(term => orig.includes(term));
        });
      };

      let idxName = findCol(['name', 'displayname'], ['given', 'family', 'user']);
      let idxFirstName = findCol(['givenname', 'firstname', 'first']);
      let idxLastName = findCol(['familyname', 'lastname', 'last']);
      let idxEmail = findCol(['email', 'e-mail'], ['type']); 
      const idxEmailValue = headers.findIndex(h => h.includes('email') && h.includes('value'));
      if (idxEmailValue !== -1) idxEmail = idxEmailValue;

      let idxPhone = findCol(['phone', 'mobile', 'cell'], ['type']);
      const idxPhoneValue = headers.findIndex(h => h.includes('phone') && h.includes('value'));
      if (idxPhoneValue !== -1) idxPhone = idxPhoneValue;

      let idxType = findCol(['type', 'group', 'category'], ['email', 'phone']);
      let idxNotes = findCol(['notes', 'description', 'biography', 'remark']);

      if (idxName === -1 && idxEmail === -1 && idxFirstName === -1) {
         idxName = 0; idxEmail = 1; idxPhone = 2; idxType = 3; idxNotes = 4;
      }

      const rawContactsBatch: any[] = [];
      for (let i = 1; i < dataRows.length; i++) {
        const cols = dataRows[i];
        if (cols.length === 0) continue;

        let cName = idxName !== -1 ? cols[idxName] : '';
        if (!cName || cName.trim() === '') {
           const first = idxFirstName !== -1 ? cols[idxFirstName] : '';
           const last = idxLastName !== -1 ? cols[idxLastName] : '';
           if (first || last) cName = `${first} ${last}`.trim();
        }

        let cEmail = idxEmail !== -1 ? cols[idxEmail] : '';
        let cPhone = idxPhone !== -1 ? cols[idxPhone] : '';
        const cTypeRaw = idxType !== -1 ? cols[idxType] || 'Lead' : 'Lead';
        const cNotes = idxNotes !== -1 ? cols[idxNotes] || '' : '';

        rawContactsBatch.push({
          name: cName || cEmail.split('@')[0] || 'Unknown',
          email: cEmail,
          phone: cPhone,
          type: cTypeRaw,
          notes: cNotes
        });
      }

      // Instead of direct import, open AI Review
      setIsReviewModalOpen(true);
      setIsCleaning(true);
      const cleanedResults = await cleanImportData(rawContactsBatch, 'contacts');
      setReviewData(cleanedResults);
      setIsCleaning(false);

    } catch (error: any) {
      alert(error.message || "Failed to parse CSV.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleApplyImport = async () => {
    if (!reviewData) return;
    setIsImporting(true);
    await dataService.addContacts(reviewData.cleaned);
    setIsReviewModalOpen(false);
    setReviewData(null);
    onRefresh();
    setIsImporting(false);
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || c.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 h-full flex flex-col">
       <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users size={32} className="text-indigo-600" />
            Contacts Directory
          </h2>
          <p className="text-gray-500 mt-1">Manage buyers, sellers, and leads.</p>
        </div>
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                icon={<ClipboardCheck size={18} className="text-purple-600" />} 
                onClick={() => setIsScrubModalOpen(true)}
            >
                Scrub Records
            </Button>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              onChange={handleImportCSV} 
              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
            />
            <Button 
              variant="outline"
              icon={<Download size={16} />}
              onClick={handleDownloadTemplate}
              title="Download CSV Template"
            >
              Template
            </Button>
            <Button 
                variant="outline" 
                icon={<FileSpreadsheet size={18} />} 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
            >
                {isImporting ? 'Importing...' : 'Import CSV'}
            </Button>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => handleOpenModal()}>
                Add Contact
            </Button>
        </div>
      </header>

      <Card className="flex-1 flex flex-col" noPadding>
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center flex-shrink-0">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search name or email..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <Filter size={18} className="text-gray-400" />
            {['All', 'Buyer', 'Seller', 'Lead', 'Vendor'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  filterType === t 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Last Contacted</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContacts.map(contact => (
                <tr 
                  key={contact.id} 
                  className="hover:bg-gray-50 transition-colors group cursor-pointer"
                  onClick={() => setViewContact(contact)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{contact.name}</div>
                    {contact.notes && <div className="text-xs text-gray-500 truncate max-w-xs">{contact.notes}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={
                      contact.type === 'Buyer' ? 'blue' : 
                      contact.type === 'Seller' ? 'purple' : 
                      contact.type === 'Lead' ? 'yellow' : 'gray'
                    }>
                      {contact.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={12} /> {contact.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={12} /> {contact.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                     {contact.lastContacted ? new Date(contact.lastContacted).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal(contact); }}><Edit2 size={14}/></Button>
                      <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}><Trash2 size={14}/></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Scrub Modal */}
      <Modal isOpen={isScrubModalOpen} onClose={() => setIsScrubModalOpen(false)} title="Public Record AI Scrubber" maxWidth="max-w-2xl">
        <div className="space-y-4">
            <p className="text-xs text-gray-500 italic">Paste messy public record data (property details, owner names, etc.) and Nexus AI will extract the structured CRM lead data.</p>
            <textarea 
                className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900 font-mono"
                placeholder="Paste raw property data here..."
                value={rawScrubText}
                onChange={(e) => setRawScrubText(e.target.value)}
            />
            {isScrubbing ? (
                <div className="flex items-center justify-center py-4 text-purple-600">
                    <Sparkles className="animate-spin mr-2" size={18} />
                    <span className="text-sm font-bold">Scrubbing Data...</span>
                </div>
            ) : scrubResult ? (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-xs font-bold text-purple-900 uppercase">Extraction Result</span>
                        <Badge color="purple">Record Found</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="text-gray-500">Name:</div><div className="font-bold text-gray-900">{scrubResult.full_name}</div>
                        <div className="text-gray-500">Address:</div><div className="text-gray-900">{scrubResult.address}</div>
                        <div className="text-gray-500">City/State:</div><div className="text-gray-900">{scrubResult.city_state}</div>
                        <div className="text-gray-500">ZIP:</div><div className="text-gray-900">{scrubResult.zip}</div>
                        <div className="text-gray-500">Property:</div><div className="text-gray-900">{scrubResult.property_type}</div>
                        <div className="text-gray-500">Last Sale:</div><div className="text-gray-900">{scrubResult.last_sale_date || 'N/A'}</div>
                        <div className="text-[10px] text-gray-400 col-span-2 mt-1">Source Column: {scrubResult.date_source}</div>
                    </div>
                </div>
            ) : null}
            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setScrubResult(null); setRawScrubText(''); }}>Clear</Button>
                {!scrubResult ? (
                    <Button className="flex-1" onClick={handleScrubRecord} disabled={!rawScrubText.trim()}>Extract Lead</Button>
                ) : (
                    <Button className="flex-1" onClick={handleSaveScrubbed}>Add to CRM as Lead</Button>
                )}
            </div>
        </div>
      </Modal>

      {/* Edit/Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Contact' : 'Add New Contact'}>
        <div className="space-y-4">
           <InputGroup label="Full Name">
             <input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
           </InputGroup>
           <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Email">
                <input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
              </InputGroup>
              <InputGroup label="Phone">
                <input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </InputGroup>
           </div>
           <InputGroup label="Type">
             <select className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" value={type} onChange={e => setType(e.target.value as ContactType)}>
               <option value="Lead">Lead</option>
               <option value="Buyer">Buyer</option>
               <option value="Seller">Seller</option>
               <option value="Vendor">Vendor</option>
               <option value="Other">Other</option>
             </select>
           </InputGroup>
           <InputGroup label="Notes">
             <textarea className="w-full border border-gray-300 rounded p-2 h-20 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key requirements, budget, etc." />
           </InputGroup>
           <Button className="w-full" onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Contact'}</Button>
        </div>
      </Modal>

      {/* View Contact Modal */}
      <Modal isOpen={!!viewContact} onClose={() => setViewContact(null)} title="Contact Details">
        {viewContact && (
          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold
                  ${viewContact.type === 'Buyer' ? 'bg-blue-100 text-blue-600' : 
                    viewContact.type === 'Seller' ? 'bg-purple-100 text-purple-600' :
                    viewContact.type === 'Lead' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                   {viewContact.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{viewContact.name}</h3>
                  <Badge color={
                      viewContact.type === 'Buyer' ? 'blue' : 
                      viewContact.type === 'Seller' ? 'purple' : 
                      viewContact.type === 'Lead' ? 'yellow' : 'gray'
                    }>
                      {viewContact.type}
                  </Badge>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    icon={<Sparkles size={14} className="text-indigo-600" />} 
                    onClick={() => handleGenerateFollowUp(viewContact)}
                >
                    Follow-up Assistant
                </Button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                   <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Mail size={14} /> Email
                   </div>
                   <div className="font-medium text-gray-900 select-all">{viewContact.email}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                   <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Phone size={14} /> Phone
                   </div>
                   <div className="font-medium text-gray-900 select-all">{viewContact.phone || 'N/A'}</div>
                </div>
             </div>

             <div>
               <label className="block text-xs font-medium text-gray-500 mb-2">Notes</label>
               <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 min-h-[80px] whitespace-pre-wrap">
                  {viewContact.notes || 'No notes found.'}
               </div>
             </div>
             
             <div className="text-xs text-gray-400 text-center pt-2">
                Last Contacted: {viewContact.lastContacted ? new Date(viewContact.lastContacted).toLocaleDateString() : 'Never'}
             </div>

             <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setViewContact(null)}>Close</Button>
                <Button variant="primary" className="flex-1" icon={<Edit2 size={16} />} onClick={() => { setViewContact(null); handleOpenModal(viewContact); }}>Edit Contact</Button>
             </div>
          </div>
        )}
      </Modal>

      {/* AI Follow-up Draft Modal */}
      <Modal isOpen={isFollowUpOpen} onClose={() => setIsFollowUpOpen(false)} title="AI Follow-up Suggestions" maxWidth="max-w-2xl">
        <div className="space-y-6">
            {isFollowUpLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-indigo-600">
                    <Sparkles size={32} className="animate-spin mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Generating follow-up drafts...</p>
                </div>
            ) : followUpData ? (
                <div className="space-y-6">
                    <section>
                        <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <MessageCircle size={16} className="text-green-500" /> SMS / WhatsApp Version
                        </h4>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 relative group">
                            <p className="text-sm text-gray-800 leading-relaxed pr-8 italic">"{followUpData.sms}"</p>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(followUpData.sms); alert("Copied SMS to clipboard!"); }}
                                className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-green-600 transition-colors"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Mail size={16} className="text-blue-500" /> Email Version
                        </h4>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative group">
                            <p className="text-sm text-gray-800 leading-relaxed pr-8 whitespace-pre-wrap">{followUpData.email}</p>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(followUpData.email); alert("Copied Email to clipboard!"); }}
                                className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </section>
                </div>
            ) : (
                <p className="text-center text-gray-500">Could not generate suggestions.</p>
            )}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button onClick={() => setIsFollowUpOpen(false)}>Done</Button>
            </div>
        </div>
      </Modal>

      {/* AI Import Review Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Nexus AI Import Review" maxWidth="max-w-4xl">
        <div className="space-y-6">
            {isCleaning ? (
                <div className="flex flex-col items-center justify-center py-20 text-purple-600">
                    <Sparkles size={48} className="animate-spin mb-4" />
                    <h3 className="text-xl font-bold uppercase tracking-widest">Nexus AI is cleaning your data...</h3>
                    <p className="text-sm text-gray-500 mt-2">Fixing addresses, suggestions types, and flagging issues.</p>
                </div>
            ) : reviewData ? (
                <div className="space-y-6">
                    {reviewData.issues.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h4 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
                                <AlertTriangle size={16} /> Data Flags ({reviewData.issues.length})
                            </h4>
                            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                                {reviewData.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                            </ul>
                        </div>
                    )}

                    <div>
                        <h4 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" /> Cleaned Preview (Top {reviewData.cleaned.length})
                        </h4>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2">Email</th>
                                        <th className="px-4 py-2">Phone</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reviewData.cleaned.map((c, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium">{c.name}</td>
                                            <td className="px-4 py-2">
                                                <Badge color={c.type === 'Buyer' ? 'blue' : c.type === 'Seller' ? 'purple' : 'yellow'}>{c.type}</Badge>
                                            </td>
                                            <td className="px-4 py-2">{c.email}</td>
                                            <td className="px-4 py-2">{c.phone}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                        <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>Discard</Button>
                        <Button variant="primary" icon={<CheckCircle2 size={18} />} onClick={handleApplyImport}>Apply AI Changes & Import</Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 italic">No review data available.</div>
            )}
        </div>
      </Modal>
    </div>
  );
};
