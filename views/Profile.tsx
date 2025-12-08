
import React, { useState } from 'react';
import { User } from '../types';
import { Card, Button, InputGroup } from '../components/Shared';
import { User as UserIcon, Mail, Shield, Save } from 'lucide-react';
import { dataService } from '../services/dataService';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    
    // Auto-generate initials from new name
    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const updatedUser: User = {
      ...user,
      displayName,
      email,
      initials
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const savedUser = dataService.updateUser(updatedUser);
    onUpdate(savedUser);
    
    setIsSaving(false);
    setSuccessMsg('Profile updated successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="p-8 h-full flex flex-col items-center justify-start overflow-y-auto">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
            {user.initials}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{user.displayName}</h2>
          <div className="flex items-center justify-center gap-2 text-gray-500 mt-2">
            <Shield size={16} className={user.role === 'admin' ? 'text-purple-600' : 'text-gray-400'} />
            <span className="capitalize">{user.role}</span>
          </div>
        </header>

        <Card className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UserIcon size={24} className="text-indigo-600" />
            Profile Information
          </h3>
          
          <div className="space-y-6">
            <InputGroup label="Full Name">
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </InputGroup>

            <InputGroup label="Email Address">
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
            </InputGroup>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-semibold text-gray-700 text-sm mb-2">Account Status</h4>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Role</span>
                 <span className="font-medium bg-gray-200 px-2 py-1 rounded capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                 <span className="text-gray-500">User ID</span>
                 <span className="font-mono text-gray-400 text-xs">{user.id}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleSave} 
                disabled={isSaving}
                icon={isSaving ? undefined : <Save size={18} />}
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile'}
              </Button>
              
              {successMsg && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 text-center rounded-lg border border-green-200 text-sm font-medium animate-in fade-in">
                  {successMsg}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
