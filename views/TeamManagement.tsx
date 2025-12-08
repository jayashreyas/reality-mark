
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Card, Badge, Button, InputGroup, Modal } from '../components/Shared';
import { Users, Plus, Trash2, Shield, User as UserIcon, Mail, Phone, Edit2 } from 'lucide-react';
import { dataService } from '../services/dataService';

interface TeamManagementProps {
  currentUser: User;
  teamMembers: User[];
  onTeamUpdate: (newTeam: User[]) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ currentUser, teamMembers, onTeamUpdate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMember, setViewMember] = useState<User | null>(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('agent');

  const handleAddMember = () => {
    if (!newName || !newEmail) return;
    
    const initials = newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const newMember: User = {
      id: `u${Date.now()}`,
      displayName: newName,
      initials,
      role: newRole,
      email: newEmail,
      phone: newPhone
    };
    
    const updatedTeam = dataService.addTeamMember(newMember);
    onTeamUpdate(updatedTeam);
    
    // Reset and close
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('agent');
    setIsAddModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      const updatedTeam = dataService.deleteTeamMember(id);
      onTeamUpdate(updatedTeam);
      setViewMember(null);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users size={32} className="text-indigo-600" />
            Team Management
          </h2>
          <p className="text-gray-500 mt-1">Manage your team members and permissions.</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
          Add Member
        </Button>
      </header>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teamMembers.map(member => (
                <tr 
                  key={member.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => setViewMember(member)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {member.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.displayName}</p>
                        <p className="text-xs text-gray-500">ID: {member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} />
                      <span>{member.email || 'No email set'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} />
                      <span>{member.phone || 'No phone set'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${member.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {member.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                      {member.role === 'admin' ? 'Admin' : 'Agent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.id !== currentUser.id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id); }}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Member Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Team Member">
        <div className="space-y-4">
          <InputGroup label="Full Name">
            <input 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
              placeholder="e.g. Jane Doe"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </InputGroup>
          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Email Address">
                <input 
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                placeholder="jane@realitymark.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                />
            </InputGroup>
            <InputGroup label="Phone Number">
                <input 
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                placeholder="(555) 123-4567"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                />
            </InputGroup>
          </div>
          <InputGroup label="Role">
             <div className="flex gap-4">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                   type="radio" 
                   name="role" 
                   value="agent" 
                   checked={newRole === 'agent'} 
                   onChange={() => setNewRole('agent')}
                   className="text-indigo-600 focus:ring-indigo-500"
                 />
                 <span className="text-gray-900">Agent</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                   type="radio" 
                   name="role" 
                   value="admin" 
                   checked={newRole === 'admin'} 
                   onChange={() => setNewRole('admin')}
                   className="text-indigo-600 focus:ring-indigo-500"
                 />
                 <span className="text-gray-900">Admin</span>
               </label>
             </div>
          </InputGroup>
          <div className="pt-2">
            <Button className="w-full" onClick={handleAddMember}>Add Member</Button>
          </div>
        </div>
      </Modal>

      {/* View/Edit Member Modal */}
      <Modal isOpen={!!viewMember} onClose={() => setViewMember(null)} title="Team Member Details">
         {viewMember && (
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold">
                        {viewMember.initials}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{viewMember.displayName}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${viewMember.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {viewMember.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                            {viewMember.role === 'admin' ? 'Administrator' : 'Agent'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Mail size={14} /> Email
                        </div>
                        <div className="font-medium text-gray-900 select-all">{viewMember.email || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Phone size={14} /> Phone
                        </div>
                        <div className="font-medium text-gray-900 select-all">{viewMember.phone || 'N/A'}</div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                     <Button variant="outline" onClick={() => setViewMember(null)}>Close</Button>
                     {viewMember.id !== currentUser.id && (
                        <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => handleDeleteMember(viewMember.id)}>
                            Remove Member
                        </Button>
                     )}
                </div>
             </div>
         )}
      </Modal>
    </div>
  );
};
