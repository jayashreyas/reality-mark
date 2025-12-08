
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
  
  // View Contact State
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  
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

  // Robust CSV Parser with Delimiter Detection
  const parseCSV = (text: string) => {
    // 1. Detect Delimiter (Comma, Semicolon, Tab)
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
          // Escaped quote "" -> "
          currentField += '"';
          i++; // Skip next quote
        } else {
          inQuote = !inQuote;
        }
      } else if (char === delimiter && !inQuote) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuote) {
        // Handle CRLF or LF
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    // Push last field/row
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
      
      // Filter out completely empty rows
      const dataRows = rows.filter(r => r.length > 0 && r.some(c => c.length > 0));

      if (dataRows.length < 2) {
        throw new Error("File appears to be empty or missing headers");
      }
      
      // Delimiter failure check
      if (dataRows[0].length <= 1) {
          throw new Error("Could not detect columns. Please ensure your CSV uses commas or semicolons.");
      }

      const newContactsBatch: Omit<Contact, 'id' | 'lastContacted'>[] = [];
      let duplicateCount = 0;
      let skippedCount = 0;

      // --- Smart Column Detection ---
      // Normalize headers: lowercase, remove non-alphanumeric
      const headers = dataRows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const originalHeaders = dataRows[0].map(h => h.toLowerCase());

      // Helper to find column index based on keywords, avoiding specific terms if needed
      const findCol = (includes: string[], avoids: string[] = []) => {
        // First try finding a header that includes one of the 'includes' AND none of the 'avoids'
        let idx = headers.findIndex((h, i) => {
           const orig = originalHeaders[i]; // Use original for safer matching of terms like 'value'
           return includes.some(term => orig.includes(term)) && 
                  !avoids.some(term => orig.includes(term));
        });
        return idx;
      };

      // 1. Name Strategy
      // Priority: 'name' -> 'displayname' -> then we will look for First/Last
      let idxName = findCol(['name', 'displayname'], ['given', 'family', 'user']);
      let idxFirstName = findCol(['givenname', 'firstname', 'first']);
      let idxLastName = findCol(['familyname', 'lastname', 'last']);

      // 2. Email Strategy
      // Priority: 'email...value' (Google/Outlook) -> 'email' (Generic) -> Avoid 'type'
      let idxEmail = findCol(['email', 'e-mail'], ['type']); 
      // Specific check for Google's "E-mail 1 - Value" which often maps to 'email1value'
      const idxEmailValue = headers.findIndex(h => h.includes('email') && h.includes('value'));
      if (idxEmailValue !== -1) idxEmail = idxEmailValue;

      // 3. Phone Strategy
      let idxPhone = findCol(['phone', 'mobile', 'cell'], ['type']);
      const idxPhoneValue = headers.findIndex(h => h.includes('phone') && h.includes('value'));
      if (idxPhoneValue !== -1) idxPhone = idxPhoneValue;

      // 4. Other fields
      let idxType = findCol(['type', 'group', 'category'], ['email', 'phone']);
      let idxNotes = findCol(['notes', 'description', 'biography', 'remark']);

      // Fallback for simple templates if detection failed completely
      if (idxName === -1 && idxEmail === -1 && idxFirstName === -1) {
         // Assume standard order: Name, Email, Phone, Type, Notes
         idxName = 0; idxEmail = 1; idxPhone = 2; idxType = 3; idxNotes = 4;
      }

      for (let i = 1; i < dataRows.length; i++) {
        const cols = dataRows[i];
        if (cols.length === 0) continue;

        // Extract Name
        let cName = idxName !== -1 ? cols[idxName] : '';
        // Construct name if missing
        if (!cName || cName.trim() === '') {
           const first = idxFirstName !== -1 ? cols[idxFirstName] : '';
           const last = idxLastName !== -1 ? cols[idxLastName] : '';
           if (first || last) cName = `${first} ${last}`.trim();
        }

        // Extract Email
        let cEmail = idxEmail !== -1 ? cols[idxEmail] : '';
        
        // Extract Phone
        let cPhone = idxPhone !== -1 ? cols[idxPhone] : '';

        // Extract Type & Notes
        const cTypeRaw = idxType !== -1 ? cols[idxType] || 'Lead' : 'Lead';
        const cNotes = idxNotes !== -1 ? cols[idxNotes] || '' : '';

        // Validation: Must have a Name OR an Email (that looks like an email)
        const hasName = cName && cName.trim().length > 0;
        const hasEmail = cEmail && cEmail.includes('@'); // Basic check to avoid importing "Work" or "Home" as email

        if (hasName || hasEmail) {
             // If email is invalid but name exists, allow it but clear invalid email
             if (!hasEmail) cEmail = ''; 

             // Duplicate Check
             const existsInCurrent = contacts.find(existing => existing.email.toLowerCase() === cEmail.toLowerCase() && cEmail !== '');
             const existsInBatch = newContactsBatch.find(batch => batch.email.toLowerCase() === cEmail.toLowerCase() && cEmail !== '');
             
             if (!existsInCurrent && !existsInBatch) {
                const validTypes = ['Buyer', 'Seller', 'Lead', 'Vendor'];
                // Normalize Type
                let normalizedType: ContactType = 'Lead';
                const lowerType = cTypeRaw.toLowerCase();
                
                if (lowerType.includes('buyer')) normalizedType = 'Buyer';
                else if (lowerType.includes('seller')) normalizedType = 'Seller';
                else if (lowerType.includes('vendor')) normalizedType = 'Vendor';
                
                newContactsBatch.push({
                  name: cName || cEmail.split('@')[0] || 'Unknown',
                  email: cEmail,
                  phone: cPhone,
                  type: normalizedType,
                  notes: cNotes
                });
             } else {
               duplicateCount++;
             }
        } else {
          skippedCount++;
        }
      }

      if (newContactsBatch.length > 0) {
        await dataService.addContacts(newContactsBatch);
        await loadContacts();
        alert(`Import Complete!\n• Added: ${newContactsBatch.length} contacts\n• Duplicates Ignored: ${duplicateCount}\n• Invalid Rows Skipped: ${skippedCount}`);
      } else {
        alert(
          duplicateCount > 0 
          ? `No new contacts added. Found ${duplicateCount} duplicates.` 
          : `No valid contacts found. Please check your CSV.\n(Tip: Ensure columns like 'Name', 'Email Value' or 'Given Name' exist).`
        );
      }

    } catch (error: any) {
      console.error("Import failed", error);
      alert(error.message || "Failed to parse the CSV file.");
    } finally {
      setIsImporting(false);
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
              style={{ display: 'none' }}
              onChange={handleImportCSV} 
              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} // Reset value to allow re-selecting same file
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
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center flex-shrink-0">
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
               {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit/Add Modal */}
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
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewContact.name}</h3>
                  <Badge color={
                      viewContact.type === 'Buyer' ? 'blue' : 
                      viewContact.type === 'Seller' ? 'purple' : 
                      viewContact.type === 'Lead' ? 'yellow' : 'gray'
                    }>
                      {viewContact.type}
                  </Badge>
                </div>
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
    </div>
  );
};
