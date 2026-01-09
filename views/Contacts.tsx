
import React, { useState } from 'react';
import { Contact, ContactType } from '../types';
import { Card, Button, Modal, InputGroup, Badge } from '../components/Shared';
import { 
  Users, Search, Plus, Phone, Mail, Edit2, Trash2, 
  Star, Clock, Filter, ChevronRight, Hash, UserCircle, Settings, Download, MoreVertical, X
} from 'lucide-react';
import { dataService } from '../services/dataService';

export const Contacts: React.FC<{ contacts: Contact[], onRefresh: () => void }> = ({ contacts, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Starred' | 'Leads' | 'Vendors'>('All');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filtered = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeCategory === 'Starred') return matchesSearch && c.isStarred;
    if (activeCategory === 'Leads') return matchesSearch && c.type === 'Lead';
    if (activeCategory === 'Vendors') return matchesSearch && c.type === 'Vendor';
    return matchesSearch;
  });

  const SidebarItem = ({ id, label, icon }: any) => (
    <button
      onClick={() => setActiveCategory(id)}
      className={`w-full flex items-center gap-4 px-6 py-3 rounded-r-full transition-all ${
        activeCategory === id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-full bg-white">
      {/* Google Contacts Style Sidebar */}
      <aside className="w-64 flex flex-col py-6 border-r border-slate-100">
        <div className="px-6 mb-6">
          <Button variant="primary" icon={<Plus size={20}/>} className="w-full rounded-full shadow-md hover:shadow-lg py-6 font-bold text-base">
            Create Contact
          </Button>
        </div>
        <div className="flex-1 space-y-1">
          <SidebarItem id="All" label="Contacts" icon={<Users size={20}/>} />
          <SidebarItem id="Starred" label="Starred" icon={<Star size={20}/>} />
          <SidebarItem id="Leads" label="Leads" icon={<Hash size={20}/>} />
          <SidebarItem id="Vendors" label="Vendors" icon={<Settings size={20}/>} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 flex items-center px-8 border-b border-slate-50 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-2.5 text-slate-400" size={20} />
            <input 
              className="w-full max-w-2xl pl-12 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Search contacts"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><Download size={20}/></button>
            <button className="p-2.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><MoreVertical size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
              <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4 w-1/3">Name</th>
                <th className="px-8 py-4 w-1/4">Email</th>
                <th className="px-8 py-4 w-1/4">Phone</th>
                <th className="px-8 py-4 text-right">Job Title & Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(contact => (
                <tr 
                  key={contact.id}
                  className="group hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedContact(contact)}
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                        {contact.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{contact.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); dataService.toggleStar(contact.id); onRefresh(); }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full ${contact.isStarred ? 'text-amber-400 opacity-100' : 'text-slate-300'}`}
                      >
                        <Star size={18} fill={contact.isStarred ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-600 font-medium">{contact.email}</td>
                  <td className="px-8 py-4 text-sm text-slate-600 font-medium">{contact.phone}</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Badge color={contact.type === 'Lead' ? 'yellow' : 'blue'}>{contact.type}</Badge>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-200 rounded-full text-slate-400">
                        <Edit2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-32 text-center">
              <UserCircle size={64} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No contacts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Sidebar */}
      {selectedContact && (
        <div className="w-[400px] border-l border-slate-100 bg-white animate-in slide-in-from-right duration-300">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-black text-indigo-600">
                {selectedContact.name.charAt(0)}
              </div>
              <button onClick={() => setSelectedContact(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{selectedContact.name}</h3>
            <Badge color="blue">{selectedContact.type}</Badge>
            
            <div className="mt-10 space-y-6">
              <div className="flex items-center gap-4 text-slate-600">
                <Mail size={20} className="text-slate-400"/>
                <span className="text-sm font-bold">{selectedContact.email}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <Phone size={20} className="text-slate-400"/>
                <span className="text-sm font-bold">{selectedContact.phone}</span>
              </div>
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Notes</p>
                <p className="text-sm text-slate-700 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {selectedContact.notes || 'No notes added yet for this contact.'}
                </p>
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <Button variant="primary" className="flex-1 rounded-2xl">Send Message</Button>
              <Button variant="outline" className="flex-1 rounded-2xl">Edit Record</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
