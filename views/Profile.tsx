
import React, { useState } from 'react';
import { User } from '../types';
import { Card, Button, InputGroup } from '../components/Shared';
import { User as UserIcon, Mail, Shield, Save, Phone } from 'lucide-react';
import { dataService } from '../services/dataService';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');

  const handleSave = () => {
    const updatedUser = { ...user, displayName, email, phone };
    dataService.updateUser(updatedUser);
    onUpdate(updatedUser);
    alert('Profile updated successfully');
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
        <p className="text-gray-500 mt-1">Manage your account settings.</p>
      </header>

      <div className="max-w-2xl">
        <Card>
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold">
              {user.initials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{user.displayName}</h3>
              <div className="flex items-center gap-2 mt-1">
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                    {user.role === 'admin' ? 'Administrator' : 'Agent'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <InputGroup label="Display Name">
               <div className="relative">
                 <UserIcon size={18} className="absolute left-3 top-2.5 text-gray-400" />
                 <input 
                    className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                 />
               </div>
            </InputGroup>

            <InputGroup label="Email Address">
               <div className="relative">
                 <Mail size={18} className="absolute left-3 top-2.5 text-gray-400" />
                 <input 
                    className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                 />
               </div>
            </InputGroup>

             <InputGroup label="Phone Number">
               <div className="relative">
                 <Phone size={18} className="absolute left-3 top-2.5 text-gray-400" />
                 <input 
                    className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                 />
               </div>
            </InputGroup>

            <div className="pt-4">
              <Button onClick={handleSave} icon={<Save size={18} />}>Save Changes</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
