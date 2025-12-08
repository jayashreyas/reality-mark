
import React, { useState, useEffect, useRef } from 'react';
import { Contact, ContactType } from '../types';
import { Card, Button, Modal, InputGroup, Badge } from '../components/Shared';
import { Users, Search, Filter, Plus, Phone, Mail, Edit2, Trash2, FileSpreadsheet, Download } from 'lucide-react';
import { dataService } from '../services/dataService';

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<ContactType>('Lead');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const data = await dataService.getContacts();
    setContacts(data);
  };

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
    loadContacts();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this contact?')) {
      await dataService.deleteContact(id);
      loadContacts();
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

  // Improved CSV parser that handles quotes
  const parseCSVLine = (text: string) => {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const text = await file.text();
      // Split by newline, handling both \r\n and \n
      const lines = text.split(/\r?\n/);
      const newContactsBatch: Omit<Contact, 'id' | 'lastContacted'>[] = [];
      let duplicateCount = 0;

      // Determine start index: Skip header if "email" is found in first line (case insensitive)
      const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCSVLine(line);

        if (cols.length >= 2) {
           const cName = cols[0];
           const cEmail = cols[1];
           const cPhone = cols[2] || '';
           const cTypeRaw = cols[3] || 'Lead';
           const cNotes = cols.slice(4).join(','); // Join remaining cols as notes

           // Basic Validation
           if (cName && cEmail && cEmail.includes('@')) {
             // Check against current list to avoid obvious dupes
             const existsInCurrent = contacts.find(existing => existing.email.toLowerCase() === cEmail.toLowerCase());
             // Also check against the batch we are building to avoid duplicates within the CSV itself
             const existsInBatch = newContactsBatch.find(batch => batch.email.toLowerCase() === cEmail.toLowerCase());
             
             if (!existsInCurrent && !existsInBatch) {
                const validTypes = ['Buyer', 'Seller', 'Lead', 'Vendor'];
                // Default to 'Lead' if type is invalid, normalize case
                const normalizedType = cTypeRaw.charAt(0).toUpperCase() + cTypeRaw.slice(1).toLowerCase();
                const finalType = validTypes.includes(normalizedType) ? normalizedType as ContactType : 'Lead';

                newContactsBatch.push({
                  name: cName,
                  email: cEmail,
                  phone: cPhone,
                  type: finalType,
                  notes: cNotes
                });
             } else {
               duplicateCount++;
             }
           }
        }
      }

      if (newContactsBatch.length > 0) {
        await dataService.addContacts(newContactsBatch);
        await loadContacts();
        alert(`Import Complete!\n• Added: ${newContactsBatch.length}\n• Skipped (Duplicates): ${duplicateCount}`);
      } else {
        alert(duplicateCount > 0 
          ? `All ${duplicateCount} contacts in this file were duplicates.` 
          : "No valid contacts found in file.");
      }

    } catch (error) {
      console.error("Import failed", error);
      alert("Failed to parse the CSV file. Please make sure it follows the template format.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImportCSV} 
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
         {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search name or email..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Contact Info</th>
                <th className="px-6 py-3">Last Contacted</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-gray-50 transition-colors group">
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
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-gray-600">
                         <Mail size={12} /> {contact.email}
                       </div>
                       <div className="flex items-center gap-2 text-gray-600">
                         <Phone size={12} /> {contact.phone}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                     {contact.lastContacted ? new Date(contact.lastContacted).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(contact)}><Edit2 size={14}/></Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(contact.id)}><Trash2 size={14}/></Button>
                    </div>
                  </td>
                </tr>
              ))}
               {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Contact' : 'Add New Contact'}>
        <div className="space-y-4">
           <InputGroup label="Full Name">
             <input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
           </InputGroup>
           <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Email">
                <input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
              </InputGroup>
              <InputGroup label="Phone">
                <input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </InputGroup>
           </div>
           <InputGroup label="Type">
             <select className="w-full border border-gray-300 rounded p-2 bg-white" value={type} onChange={e => setType(e.target.value as ContactType)}>
               <option value="Lead">Lead</option>
               <option value="Buyer">Buyer</option>
               <option value="Seller">Seller</option>
               <option value="Vendor">Vendor</option>
               <option value="Other">Other</option>
             </select>
           </InputGroup>
           <InputGroup label="Notes">
             <textarea className="w-full border border-gray-300 rounded p-2 h-20 outline-none focus:ring-2 focus:ring-indigo-500" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key requirements, budget, etc." />
           </InputGroup>
           <Button className="w-full" onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Contact'}</Button>
        </div>
      </Modal>
    </div>
  );
};
