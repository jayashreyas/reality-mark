
import React, { useState } from 'react';
import { Button } from '../components/Shared';
import { dataService } from '../services/dataService';
import { User } from '../types';
import { Home } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = dataService.login(email);
    if (user) {
      onLogin(user);
    } else {
      setError('Email not found. Please contact an administrator.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-indigo-600 p-3 rounded-xl text-white">
          <Home size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reality Mark</h1>
      </div>
      
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
        <p className="text-gray-500 mb-6 text-sm">Enter your team email to access the dashboard.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white text-gray-900"
              placeholder="name@realitymark.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100">
              {error}
            </div>
          )}
          
          <Button className="w-full" size="lg" type="submit">Sign In</Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>Demo Credentials:</p>
          <p>shreyas@realitymark.com (Admin)</p>
          <p>sarah@realitymark.com (Agent)</p>
        </div>
      </div>
    </div>
  );
};
