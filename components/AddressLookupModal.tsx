
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, InputGroup, Badge } from './Shared';
import { Search, Sparkles, Loader2, Home, User, DollarSign, Calendar, MapPin, ArrowRight, CheckCircle2, AlertCircle, Info, ShieldCheck, Database } from 'lucide-react';
import { dataService } from '../services/dataService';
import { performDeepPropertyAnalysis } from '../services/geminiService';
import { PropertyLookupResult } from '../types';

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

  // Editable Form State
  const [formData, setFormData] = useState({
    price: 0,
    clientName: '',
    beds: 0,
    baths: 0,
    lotSize: '',
    yearBuilt: 0,
    type: 'Sale' as 'Sale' | 'Rental'
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
        price: result.estimated_value || result.last_sale_price || 0,
        clientName: result.owner_name || '',
        beds: result.beds || 0,
        baths: result.baths || 0,
        lotSize: result.lot_size || '',
        yearBuilt: result.year_built || 0,
        type: 'Sale'
      });
      setStep('review');
    } catch (err) {
      setError('External property lookup failed. Ensure your property API is active.');
      setStep('search');
    }
  };

  const handleCreateDeal = async () => {
    if (!lookupResult) return;
    setStep('saving');
    
    try {
        // Create basic record
        const newDeal = await dataService.createDeal({
          property_address: lookupResult.address,
          city: lookupResult.city,
          state: lookupResult.state,
          zip: lookupResult.zip,
          property_type: lookupResult.property_type,
          beds: formData.beds,
          baths: formData.baths,
          lot_size: formData.lotSize,
          year_built: formData.yearBuilt,
          owner_name: formData.clientName,
          price: formData.price,
          status: 'Active',
          type: formData.type,
          latitude: lookupResult.latitude,
          longitude: lookupResult.longitude,
          raw_data: {
            source: lookupResult.api_source,
            parcel_id: lookupResult.parcel_id,
            confidence_score: lookupResult.confidence_score,
            api_response: lookupResult.raw_response
          }
        });

        // Trigger AI analysis asynchronously after save
        const aiAnalysis = await performDeepPropertyAnalysis(lookupResult);
        await dataService.updateDealAISummary(newDeal.id, aiAnalysis);

        onDealCreated();
        reset();
        onClose();
    } catch (err) {
        setError('Error committing to CRM. Please try again.');
        setStep('review');
    }
  };

  const reset = () => {
    setStep('search');
    setSelectedPlace(null);
    setLookupResult(null);
    setError(null);
  };

  const SourceLabel = ({ text, color = 'blue' }: { text: string, color?: 'blue' | 'emerald' | 'amber' }) => (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ml-2 border ${
        color === 'blue' ? 'text-blue-600 border-blue-200 bg-blue-50' : 
        color === 'emerald' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
        'text-amber-600 border-amber-200 bg-amber-50'
    }`}>
        {text}
    </span>
  );

  return (
    <Modal isOpen={isOpen} onClose={() => { if(step !== 'saving') { reset(); onClose(); } }} title="Property Pipeline" maxWidth="max-w-2xl">
      <div className="py-2">
        {step === 'search' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <MapPin size={32} />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Start Transaction</h4>
              <p className="text-sm text-gray-500 mt-1 px-8">Nexus AI requires a Google-verified address to match public tax records accurately.</p>
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                <Search size={20} />
              </div>
              <input 
                ref={autoCompleteRef}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                placeholder="Select a verified address..."
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && selectedPlace && (
           <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 shadow-md relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5"><MapPin size={120} /></div>
                 <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><ShieldCheck size={24}/></div>
                    <div className="flex-1">
                        <Badge color="green">Verified Location Found</Badge>
                        <h5 className="font-bold text-xl text-gray-900 leading-tight mt-2">{selectedPlace.address}</h5>
                        <p className="text-sm text-gray-500 mt-1">Ready to sync with county property records.</p>
                    </div>
                 </div>
              </div>

              <div className="flex gap-3">
                 <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setStep('search')}>Search Again</Button>
                 <Button className="flex-1 rounded-2xl" onClick={handleFetchProperty} icon={<ArrowRight size={20}/>}>Access Public Data</Button>
              </div>
           </div>
        )}

        {step === 'fetching' && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900">Synchronizing Public Records...</h4>
              <p className="text-sm text-gray-500">Connecting to Estated Data Tier 1.</p>
            </div>
          </div>
        )}

        {step === 'review' && lookupResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-between border-b-4 border-indigo-500">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2 rounded-xl text-indigo-400"><Home size={24}/></div>
                    <div>
                        <h4 className="font-bold text-lg leading-tight">{lookupResult.address}</h4>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">{lookupResult.city}, {lookupResult.state} {lookupResult.zip}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Parcel Match ID</div>
                    <div className="text-sm font-mono text-emerald-400">{lookupResult.parcel_id || 'N/A'}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <InputGroup label="Deal Classification">
                        <select 
                            className="w-full border border-gray-300 rounded-xl p-2.5 bg-white text-gray-900"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                        >
                            <option value="Sale">Sale</option>
                            <option value="Rental">Rental</option>
                        </select>
                    </InputGroup>
                </div>
                <InputGroup label="Registered Owner">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={16}/>
                        <input 
                            className="w-full pl-10 border border-gray-300 rounded-xl p-2.5 bg-blue-50/20 text-gray-900"
                            value={formData.clientName}
                            onChange={e => setFormData({...formData, clientName: e.target.value})}
                        />
                        <div className="mt-1"><SourceLabel text="County Deed" color="blue" /></div>
                    </div>
                </InputGroup>
                <InputGroup label="Est. Market Value">
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3 text-gray-400" size={16}/>
                        <input 
                            type="number"
                            className="w-full pl-10 border border-gray-300 rounded-xl p-2.5 bg-emerald-50/20 text-gray-900 font-bold"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        />
                         <div className="mt-1"><SourceLabel text="AVM Estated" color="emerald" /></div>
                    </div>
                </InputGroup>
                <div className="grid grid-cols-2 gap-3">
                   <InputGroup label="Beds">
                      <input type="number" className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-900 bg-amber-50/10" value={formData.beds} onChange={e => setFormData({...formData, beds: Number(e.target.value)})}/>
                      <SourceLabel text="Verified" color="amber" />
                   </InputGroup>
                   <InputGroup label="Baths">
                      <input type="number" step="0.5" className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-900 bg-amber-50/10" value={formData.baths} onChange={e => setFormData({...formData, baths: Number(e.target.value)})}/>
                      <SourceLabel text="Verified" color="amber" />
                   </InputGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <InputGroup label="Built">
                      <input type="number" className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-900" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: Number(e.target.value)})}/>
                   </InputGroup>
                   <InputGroup label="Lot Size">
                      <input className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-900" value={formData.lotSize} onChange={e => setFormData({...formData, lotSize: e.target.value})}/>
                   </InputGroup>
                </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                <Sparkles size={18} className="text-indigo-600 animate-pulse" />
                <p className="text-xs text-indigo-700 font-medium">Nexus AI will analyze this verified data immediately after commit.</p>
            </div>

            <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep('search')}>Abort Search</Button>
                <Button className="flex-1 rounded-xl shadow-lg shadow-indigo-200" onClick={handleCreateDeal} icon={<CheckCircle2 size={18}/>}>Commit & Analyze</Button>
            </div>
          </div>
        )}

        {step === 'saving' && (
             <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <div className="text-center">
                    <h4 className="text-lg font-bold text-gray-900">Nexus AI Analyzing Records...</h4>
                    <p className="text-sm text-gray-500">Building ownership insights and negotiation strategy.</p>
                </div>
            </div>
        )}
      </div>
    </Modal>
  );
};
