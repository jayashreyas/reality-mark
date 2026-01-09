
import React, { useState } from 'react';
import { ListingStatus, User } from '../types';
import { Modal, Button, InputGroup } from './Shared';
import { Home, User as UserIcon, DollarSign, MapPin, Database, Sparkles, Save, Shield } from 'lucide-react';
import { dataService } from '../services/dataService';

interface NewListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export const NewListingModal: React.FC<NewListingModalProps> = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    MLSNumber: '',
    PropertyAddressFormatted: '',
    PropertyCityState: '',
    Zipcode: '',
    OwnerNames: '',
    SaleAmt: '',
    status: 'Active' as ListingStatus,
    commission_rate: 2.5
  });

  const handleCreate = async () => {
    if (!formData.PropertyAddressFormatted || !formData.OwnerNames) {
      alert("Address and Owner Names are required to start a record.");
      return;
    }

    setIsSaving(true);
    try {
      await dataService.createListing({
        ...formData,
        price: Number(formData.SaleAmt) || 0,
        address: formData.PropertyAddressFormatted,
        seller_name: formData.OwnerNames,
        primaryAgentId: currentUser.id,
        primaryAgentName: currentUser.displayName,
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        MLSNumber: '',
        PropertyAddressFormatted: '',
        PropertyCityState: '',
        Zipcode: '',
        OwnerNames: '',
        SaleAmt: '',
        status: 'Active',
        commission_rate: 2.5
      });
    } catch (e) {
      alert("Failed to create listing record.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Onboard New Listing Record" maxWidth="max-w-3xl">
      <div className="space-y-8 py-2">
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-center gap-4">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100">
            <Sparkles size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black text-indigo-900">Standard Listing Onboarding</h4>
            <p className="text-sm text-indigo-700">Initialize a professional property profile in the pipeline.</p>
          </div>
        </div>

        <section className="space-y-4">
          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin size={14} className="text-indigo-500" /> Property Identity
          </h5>
          <div className="grid grid-cols-2 gap-6">
            <InputGroup label="Property Address (Formatted)">
              <input 
                className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none font-bold bg-white" 
                placeholder="e.g. 123 Main St"
                value={formData.PropertyAddressFormatted}
                onChange={e => setFormData({...formData, PropertyAddressFormatted: e.target.value})}
              />
            </InputGroup>
            <InputGroup label="MLS Number (Optional)">
              <input 
                className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none font-bold bg-white" 
                placeholder="MLS# 123456"
                value={formData.MLSNumber}
                onChange={e => setFormData({...formData, MLSNumber: e.target.value})}
              />
            </InputGroup>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <InputGroup label="City / State">
              <input 
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="Springfield, IL"
                value={formData.PropertyCityState}
                onChange={e => setFormData({...formData, PropertyCityState: e.target.value})}
              />
            </InputGroup>
            <InputGroup label="Zipcode">
              <input 
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="62704"
                value={formData.Zipcode}
                onChange={e => setFormData({...formData, Zipcode: e.target.value})}
              />
            </InputGroup>
            <InputGroup label="Primary Owner Name">
               <input 
                className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none font-bold bg-white" 
                placeholder="John & Jane Doe"
                value={formData.OwnerNames}
                onChange={e => setFormData({...formData, OwnerNames: e.target.value})}
              />
            </InputGroup>
          </div>
        </section>

        <section className="space-y-4">
          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign size={14} className="text-indigo-500" /> Pipeline Configuration
          </h5>
          <div className="grid grid-cols-3 gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
            <InputGroup label="Listing Price ($)">
              <input 
                type="number" 
                className="w-full border border-slate-300 rounded-xl p-3 font-black text-slate-900" 
                placeholder="0"
                value={formData.SaleAmt}
                onChange={e => setFormData({...formData, SaleAmt: e.target.value})}
              />
            </InputGroup>
            <InputGroup label="Initial Status">
              <select 
                className="w-full border border-slate-300 rounded-xl p-3 bg-white font-black text-indigo-700"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as ListingStatus})}
              >
                <option value="Coming Soon">Coming Soon</option>
                <option value="Active">Active</option>
                <option value="Under Contract">Under Contract</option>
              </select>
            </InputGroup>
            <InputGroup label="Comm. Rate (%)">
              <input 
                type="number" 
                step="0.1" 
                className="w-full border border-slate-300 rounded-xl p-3" 
                value={formData.commission_rate}
                onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})}
              />
            </InputGroup>
          </div>
        </section>

        <div className="pt-6 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-2xl py-4 font-black" onClick={onClose}>Discard</Button>
          <Button 
            className="flex-[2] rounded-2xl py-4 font-black shadow-xl shadow-indigo-100" 
            onClick={handleCreate} 
            disabled={isSaving}
            icon={isSaving ? undefined : <Save size={18} />}
          >
            {isSaving ? 'Establishing Record...' : 'Publish to Pipeline'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
