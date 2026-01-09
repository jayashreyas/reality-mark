
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, InputGroup, Badge } from './Shared';
import { Search, Sparkles, Loader2, Home, User, DollarSign, Calendar, MapPin, ArrowRight, CheckCircle2, AlertCircle, Info, ShieldCheck, Database, Save } from 'lucide-react';
import { dataService } from '../services/dataService';
import { performDeepPropertyAnalysis } from '../services/geminiService';
import { PropertyLookupResult, Deal } from '../types';

declare var google: any;

interface AddressLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealCreated: () => void;
}

export const AddressLookupModal: React.FC<AddressLookupModalProps> = ({ isOpen, onClose, onDealCreated }) => {
  const [step, setStep] = useState<'search' | 'confirm' | 'fetching' | 'review' | 'saving'>('search');
  const [selectedPlace, setSelectedPlace] = useState<{ address: string, lat: number, lng: number } | null>(null);
  const [lookupResult, setLookupResult] = useState<PropertyLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoCompleteRef = useRef<HTMLInputElement>(null);

  // Editable Form State (Matches Deal Interface)
  const [formData, setFormData] = useState<Partial<Deal>>({
    address: '',
    client_name: '',
    price: 0,
    beds: 0,
    baths: 0,
    property_type: '',
    status: 'Active',
    transaction_type: 'Sale',
    commission_rate: 2.5
  });

  useEffect(() => {
    if (isOpen && step === 'search' && autoCompleteRef.current && (window as any).google) {
      const autocomplete = new google.maps.places.Autocomplete(autoCompleteRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          setError('Invalid selection. Please select an address from the dropdown suggestions.');
          return;
        }

        setSelectedPlace({
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
        setStep('confirm');
      });
    }
  }, [isOpen, step]);

  const handleFetchProperty = async () => {
    if (!selectedPlace) return;
    setStep('fetching');
    setError(null);

    try {
      const result = await dataService.lookupProperty({
          address: selectedPlace.address,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng
      });
      
      setLookupResult(result);
      setFormData({
        address: result.address,
        city: result.city,
        state: result.state,
        zip: result.zip,
        client_name: result.owner_name || '',
        price: result.estimated_value || result.last_sale_price || 0,
        beds: result.beds || 0,
        baths: result.baths || 0,
        property_type: result.property_type || 'Single Family',
        status: 'Active',
        transaction_type: 'Sale',
        commission_rate: 2.5,
        listed_date: new Date().toISOString().split('T')[0]
      });
      setStep('review');
    } catch (err) {
      setError('External property lookup failed. Ensure your property API is active.');
      setStep('search');
    }
  };

  const handleCreateDeal = async () => {
    setStep('saving');
    try {
        const newDeal = await dataService.createDeal({
          ...formData,
          raw_data: lookupResult ? {
            source: lookupResult.api_source,
            parcel_id: lookupResult.parcel_id,
            confidence_score: lookupResult.confidence_score,
            api_response: lookupResult.raw_response
          } : undefined
        });

        // Background AI analysis if available
        if (lookupResult) {
            performDeepPropertyAnalysis(lookupResult)
                .then(aiRes => dataService.updateDealAISummary(newDeal.id, aiRes))
                .catch(e => console.error("AI Error:", e));
        }

        onDealCreated();
        reset();
        onClose();
    } catch (err) {
        setError('Error committing to CRM. Please check database connectivity.');
        setStep('review');
    }
  };

  const reset = () => {
    setStep('search');
    setSelectedPlace(null);
    setLookupResult(null);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { if(step !== 'saving') { reset(); onClose(); } }} title="Property Pipeline" maxWidth="max-w-3xl">
      <div className="py-2">
        {step === 'search' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <MapPin size={32} />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Start Transaction</h4>
              <p className="text-sm text-gray-500 mt-1 px-8">Reality Mark uses Google-verified data to prefill property records accurately.</p>
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                <Search size={20} />
              </div>
              <input 
                ref={autoCompleteRef}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400 shadow-inner"
                placeholder="Select a verified address..."
                autoFocus
              />
            </div>
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
          </div>
        )}

        {step === 'confirm' && selectedPlace && (
           <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 shadow-md relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5"><MapPin size={120} /></div>
                 <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><ShieldCheck size={24}/></div>
                    <div className="flex-1">
                        <Badge color="green">Location Verified</Badge>
                        <h5 className="font-bold text-xl text-gray-900 leading-tight mt-2">{selectedPlace.address}</h5>
                    </div>
                 </div>
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setStep('search')}>Search Again</Button>
                 <Button className="flex-1 rounded-2xl" onClick={handleFetchProperty} icon={<ArrowRight size={20}/>}>Access Data & Pre-fill</Button>
              </div>
           </div>
        )}

        {step === 'fetching' && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <h4 className="text-lg font-bold text-gray-900">Synchronizing Public Records...</h4>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-between border-b-4 border-indigo-500">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2 rounded-xl text-indigo-400"><Home size={24}/></div>
                    <div>
                        <h4 className="font-bold text-lg leading-tight">{formData.address}</h4>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">{formData.city}, {formData.state} {formData.zip}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Match Integrity</div>
                    <Badge color="green">Tier 1 Data</Badge>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h5 className="text-xs font-black text-gray-400 uppercase border-b pb-1">Client & Terms</h5>
                    <InputGroup label="Registered Owner / Client">
                        <input className="w-full border border-gray-300 rounded-lg p-2.5 bg-blue-50/20" value={formData.client_name || ''} onChange={e => setFormData({...formData, client_name: e.target.value})}/>
                    </InputGroup>
                    <InputGroup label="Est. Price ($)">
                        <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 font-bold text-indigo-700" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}/>
                    </InputGroup>
                    <div className="grid grid-cols-2 gap-3">
                         <InputGroup label="Beds"><input type="number" className="w-full border border-gray-300 rounded-lg p-2" value={formData.beds} onChange={e => setFormData({...formData, beds: Number(e.target.value)})}/></InputGroup>
                         <InputGroup label="Baths"><input type="number" className="w-full border border-gray-300 rounded-lg p-2" value={formData.baths} onChange={e => setFormData({...formData, baths: Number(e.target.value)})}/></InputGroup>
                    </div>
                </div>
                <div className="space-y-4">
                    <h5 className="text-xs font-black text-gray-400 uppercase border-b pb-1">Transaction Logic</h5>
                    <InputGroup label="Initial Status">
                        <select className="w-full border border-gray-300 rounded-lg p-2.5 bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="Lead">Lead</option>
                            <option value="Active">Active</option>
                            <option value="Under Contract">Under Contract</option>
                        </select>
                    </InputGroup>
                    <InputGroup label="Property Type">
                        <input className="w-full border border-gray-300 rounded-lg p-2.5" value={formData.property_type || ''} onChange={e => setFormData({...formData, property_type: e.target.value})}/>
                    </InputGroup>
                    <InputGroup label="Listed Date">
                        <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5" value={formData.listed_date || ''} onChange={e => setFormData({...formData, listed_date: e.target.value})}/>
                    </InputGroup>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep('search')}>Abort</Button>
                <Button className="flex-1 rounded-xl shadow-lg" onClick={handleCreateDeal} icon={<Save size={18}/>}>Commit to Pipeline</Button>
            </div>
          </div>
        )}

        {step === 'saving' && (
             <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <h4 className="text-lg font-bold text-gray-900">Writing to Supabase...</h4>
            </div>
        )}
      </div>
    </Modal>
  );
};
