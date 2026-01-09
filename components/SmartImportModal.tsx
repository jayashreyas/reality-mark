
import React, { useState, useRef } from 'react';
import { Modal, Button, Badge } from './Shared';
import { Upload, FileType, Sparkles, Loader2, CheckCircle, ArrowRight, Table as TableIcon } from 'lucide-react';
import { analyzeCsvMapping } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { SmartImportSummary, SmartImportRecord } from '../types';

interface SmartImportModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [mappingData, setMappingData] = useState<{ file_type: string, field_mapping: Record<string, string | null> } | null>(null);
  const [importSummary, setImportSummary] = useState<SmartImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) { setFile(selectedFile); setError(null); setMappingData(null); }
      else { setError('Please select a valid CSV file.'); }
    }
  };

  const parseCSV = (text: string): { headers: string[], rows: any[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line: string) => {
      const result = []; let current = ''; let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += char; }
      }
      result.push(current.trim());
      return result;
    };
    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseLine(line);
      const obj: any = {};
      headers.forEach((header, i) => { obj[header] = values[i]; });
      return obj;
    });
    return { headers, rows };
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsMapping(true); setError(null);
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) throw new Error("Empty file.");
      setAllRows(rows);
      const mapping = await analyzeCsvMapping(headers, rows.slice(0, 5));
      setMappingData(mapping);
    } catch (err: any) { setError(err.message || "Failed to map CSV fields."); }
    finally { setIsMapping(false); }
  };

  const handleUpload = async () => {
    if (!file || !mappingData || allRows.length === 0) return;
    setIsProcessing(true); setError(null);
    try {
      const m = mappingData.field_mapping;
      const mappedRecords: SmartImportRecord[] = allRows.map(row => {
          const type = (mappingData.file_type as any) || 'Listing';
          const getVal = (key: string) => m[key] ? row[m[key]!] : row[key]; // Try mapped then exact
          const getNum = (key: string) => {
            const val = getVal(key);
            if (!val) return 0;
            return Number(String(val).replace(/[^0-9.]/g, '')) || 0;
          };

          // Professional Schema Collection
          const listingData: any = {
              MLSNumber: getVal('MLS Number') || getVal('MLSNumber'),
              PropertyAddressFormatted: getVal('PropertyAddressFormatted') || getVal('address') || 'TBD',
              PropertyCityState: getVal('PropertyCityState') || getVal('city'),
              Zipcode: getVal('Zipcode') || getVal('zip'),
              Zip4: getVal('Zip4') || getVal('zip4'),
              CarrierRoute: getVal('CarrierRoute'),
              PropDoNotMail: getVal('PropDoNotMail'),
              OwnerNames: getVal('OwnerNames'),
              OwnerFirstName: getVal('OwnerFirstName'),
              OwnerLastName: getVal('OwnerLastName'),
              Owner2FirstName: getVal('Owner2FirstName'),
              Owner2LastName: getVal('Owner2LastName'),
              Owner3FirstName: getVal('Owner3FirstName'),
              Owner3LastName: getVal('Owner3LastName'),
              Owner4FirstName: getVal('Owner4FirstName'),
              Owner4LastName: getVal('Owner4LastName'),
              OwnerCareOf: getVal('OwnerCareOf'),
              OwnerAddress: getVal('OwnerAddress'),
              OwnerCityState: getVal('OwnerCityState'),
              OwnerZipCode: getVal('OwnerZipCode'),
              OwnerZip4: getVal('OwnerZip4'),
              OwnerCarrierRoute: getVal('OwnerCarrierRoute'),
              OwnerDoNotMail: getVal('OwnerDoNotMail'),
              OwnerOccupied: getVal('OwnerOccupied'),
              Municipality: getVal('Municipality'),
              SubdivisionNeighborhood: getVal('SubdivisionNeighborhood'),
              TaxID: getVal('TaxID'),
              TaxIDAlt: getVal('TaxIDAlt'),
              TaxMap: getVal('TaxMap'),
              Block: getVal('Block'),
              Lot: getVal('Lot'),
              QualCode: getVal('QualCode'),
              SchoolDistrict: getVal('SchoolDistrict'),
              CensusTractBlock: getVal('CensusTractBlock'),
              TaxYear: getVal('TaxYear'),
              AnnualTax: getNum('AnnualTax'),
              CountyTax: getNum('CountyTax'),
              MunicipalTax: getNum('MunicipalTax'),
              SchoolTax: getNum('SchoolTax'),
              TotalLandAsmt: getNum('TotalLandAsmt'),
              TotalBldgAsmt: getNum('TotalBldgAsmt'),
              TaxableTotalAsmt: getNum('TaxableTotalAsmt'),
              DeedRecordDate: getVal('DeedRecordDate'),
              SettleDate: getVal('SettleDate'),
              SaleAmt: getNum('SaleAmt'),
              SaleType: getVal('SaleType'),
              PropertyClass: getVal('PropertyClass'),
              CondoYN: getVal('CondoYN'),
              LandUse: getVal('LandUse'),
              LotFrontage: getVal('LotFrontage'),
              LotDepth: getVal('LotDepth'),
              LotSqFt: getNum('LotSqFt'),
              LotAcres: getNum('LotAcres'),
              LotShape: getVal('LotShape'),
              Zoning: getVal('Zoning'),
              CountyLandDesc: getVal('CountyLandDesc'),
              BldgSqFtTotal: getNum('BldgSqFtTotal'),
              Stories: getVal('Stories'),
              Bedrooms: getNum('Bedrooms'),
              Exterior: getVal('Exterior'),
              BsmtDesc: getVal('BsmtDesc'),
              FireplaceTotal: getNum('FireplaceTotal'),
              GrgType: getVal('GrgType'),
              PoolType: getVal('PoolType'),
              HeatDelivery: getVal('HeatDelivery'),
              YearBuilt: getNum('YearBuilt'),
              YearRemod: getNum('YearRemod'),
              CountyBldgDesc: getVal('CountyBldgDesc'),
              
              // Standard Fallbacks
              seller_name: getVal('OwnerNames') || getVal('full_name') || 'Unknown',
              address: getVal('PropertyAddressFormatted') || getVal('address') || 'TBD',
              price: getNum('SaleAmt') || getNum('sale_price') || 0,
              status: getVal('SettleDate') ? 'Sold' : 'Active'
          };

          return { record_type: type, data: listingData };
      });
      const result = await dataService.processSmartImport(mappedRecords);
      setImportSummary(result);
      onSuccess();
    } catch (err: any) { setError("Import process failed."); }
    finally { setIsProcessing(false); }
  };

  const reset = () => { setFile(null); setAllRows([]); setImportSummary(null); setMappingData(null); setError(null); setIsProcessing(false); setIsMapping(false); };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Universal Smart Import" maxWidth="max-w-2xl">
      <div className="space-y-6 py-2">
        {!importSummary ? (
          <>
            {!mappingData ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-indigo-100">
                    <Upload size={32} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">AI Data Ingestion</h4>
                  <p className="text-sm text-slate-500 mt-1">Upload a CSV. Nexus will detect professional property headers.</p>
                </div>
                <div className={`border-2 border-dashed rounded-3xl p-10 transition-all cursor-pointer flex flex-col items-center gap-3 ${file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50'}`} onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                  {file ? (
                    <><FileType size={48} className="text-indigo-600" /><p className="font-bold text-slate-900">{file.name}</p></>
                  ) : (
                    <><p className="font-bold text-slate-600">Click to browse or drag file here</p><p className="text-xs text-slate-400">Standard CSV supported</p></>
                  )}
                </div>
                {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-100">{error}</div>}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 rounded-xl font-black shadow-xl shadow-indigo-100" onClick={handleAnalyze} disabled={!file || isMapping} icon={isMapping ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>}>
                    {isMapping ? 'Scanning Structure...' : 'Analyze & Map'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <TableIcon size={24} className="text-indigo-600" />
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Nexus Identified Record Type</p>
                            <h5 className="text-xl font-black text-indigo-700">{mappingData.file_type}s</h5>
                        </div>
                    </div>
                    <Badge color="blue">Professional Mapping</Badge>
                 </div>
                 <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Professional Header Registry</p>
                    <div className="space-y-1">
                        {Object.entries(mappingData.field_mapping).slice(0, 12).map(([key, value]) => value && (
                            <div key={key} className="flex justify-between text-xs border-b border-slate-100 py-1.5">
                                <span className="text-slate-500 font-bold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="text-indigo-600 font-black">{value}</span>
                            </div>
                        ))}
                        <p className="text-[10px] text-slate-400 italic text-center mt-3 font-bold">+ {Math.max(0, Object.keys(mappingData.field_mapping).length - 12)} professional attributes</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setMappingData(null)}>Reset</Button>
                    <Button className="flex-1 rounded-xl font-black shadow-xl shadow-indigo-100" onClick={handleUpload} disabled={isProcessing} icon={isProcessing ? <Loader2 className="animate-spin"/> : <ArrowRight size={18}/>}>
                        {isProcessing ? 'Importing Data...' : `Sync ${allRows.length} Properties`}
                    </Button>
                 </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-8 py-6 animate-in zoom-in duration-300">
            <div className="mx-auto w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-xl border border-emerald-100"><CheckCircle size={56} /></div>
            <div><h4 className="text-2xl font-black text-slate-900 tracking-tight">Sync Complete!</h4><p className="text-slate-500 font-medium">Data has been successfully routed to the Professional Pipeline.</p></div>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xl font-black text-indigo-600">{importSummary.listings}</p><p className="text-[9px] uppercase font-black text-slate-400">Listings</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xl font-black text-indigo-600">{importSummary.offers}</p><p className="text-[9px] uppercase font-black text-slate-400">Offers</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xl font-black text-indigo-600">{importSummary.contacts}</p><p className="text-[9px] uppercase font-black text-slate-400">Contacts</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xl font-black text-indigo-600">{importSummary.tasks}</p><p className="text-[9px] uppercase font-black text-slate-400">Tasks</p></div>
            </div>
            <Button className="w-full rounded-2xl py-4 font-black" onClick={() => { reset(); onClose(); }}>Return to System</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
