
import React, { useState, useRef } from 'react';
import { Modal, Button, Badge } from './Shared';
import { Upload, FileType, Sparkles, Loader2, CheckCircle, AlertCircle, ArrowRight, Table as TableIcon } from 'lucide-react';
import { analyzeCsvMapping } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { SmartImportSummary, SmartImportRecord } from '../types';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setMappingData(null);
      } else {
        setError('Please select a valid CSV file.');
      }
    }
  };

  const parseCSV = (text: string): { headers: string[], rows: any[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseLine(line);
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i];
      });
      return obj;
    });

    return { headers, rows };
  };

  const parseDateToISO = (val: any): string | null => {
    if (!val) return null;
    const date = new Date(val);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsMapping(true);
    setError(null);
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) throw new Error("Empty file.");
      
      setAllRows(rows);
      const sampleRows = rows.slice(0, 8);
      const mapping = await analyzeCsvMapping(headers, sampleRows);
      setMappingData(mapping);
    } catch (err: any) {
      setError(err.message || "Failed to map CSV fields.");
    } finally {
      setIsMapping(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !mappingData || allRows.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const m = mappingData.field_mapping;
      const typeMap: Record<string, SmartImportRecord['record_type']> = {
          'ClosedDeals': 'ClosedDeal',
          'ActiveDeals': 'ActiveDeal',
          'Leads': 'Lead',
          'Contacts': 'Contact'
      };

      const mappedRecords: SmartImportRecord[] = allRows.map(row => {
          const rawPrice = m.sale_price ? String(row[m.sale_price] || '') : '';
          const cleanedPrice = Number(rawPrice.replace(/[^0-9.]/g, '')) || null;
          
          const rawBeds = m.bedrooms ? String(row[m.bedrooms] || '') : '';
          const cleanedBeds = Number(rawBeds.replace(/[^0-9]/g, '')) || null;

          // Date logic per requirements
          const status = row['Status'] || '';
          const statusDate = parseDateToISO(row["Status Date"]);
          const contractualDate = parseDateToISO(row["Contractual Date"]);
          
          // Priority: "Settlement Date" or "Closing Date" > fallback if Closed (Status Date) > null
          let settlementDate = parseDateToISO(row["Settlement Date"] || row["Closing Date"]);
          if (!settlementDate && status === "Closed") {
            settlementDate = statusDate;
          }

          return {
              record_type: typeMap[mappingData.file_type] || 'Contact',
              data: {
                  full_name: (m.owner_name && row[m.owner_name]) ? row[m.owner_name] : (m.address && row[m.address] ? `Owner: ${row[m.address]}` : 'Unknown Client'),
                  address: m.address ? row[m.address] : null,
                  city: m.city ? row[m.city] : null,
                  zip: m.zip ? row[m.zip] : null,
                  property_type: m.property_type ? row[m.property_type] : null,
                  bedrooms: cleanedBeds,
                  sale_price: cleanedPrice,
                  status: mappingData.file_type === 'ClosedDeals' ? 'Closed' : (mappingData.file_type === 'ActiveDeals' ? 'Active' : null),
                  transaction_date: statusDate,
                  settlement_date: settlementDate,
                  contract_date: contractualDate,
                  notes: `Imported via Smart Mapping. Identified as: ${mappingData.file_type}`
              }
          };
      });

      if (mappedRecords.length === 0) {
        throw new Error("No records could be mapped from this file.");
      }

      const result = await dataService.processSmartImport(mappedRecords);
      setImportSummary(result);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to process import. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setAllRows([]);
    setImportSummary(null);
    setMappingData(null);
    setError(null);
    setIsProcessing(false);
    setIsMapping(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => { reset(); onClose(); }} 
      title="📥 Smart Import"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 py-2">
        {!importSummary ? (
          <>
            {!mappingData ? (
              <>
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <Upload size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Universal Real Estate Ingestion</h4>
                  <p className="text-sm text-gray-500 mt-1">Upload any real estate file. Nexus AI will auto-categorize it into Deals, Leads, or Contacts.</p>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center gap-3 ${
                    file ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".csv" 
                  />
                  {file ? (
                    <>
                      <FileType size={40} className="text-indigo-600" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="text-xs text-red-500 hover:underline font-medium"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-600">Click to browse or drag and drop</p>
                      <p className="text-xs text-gray-400">CSV files supported</p>
                    </>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={onClose}
                    disabled={isProcessing || isMapping}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleAnalyze} 
                    disabled={!file || isProcessing || isMapping}
                    icon={isMapping ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  >
                    {isMapping ? 'Analyzing Structure...' : 'Analyze CSV'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        <TableIcon size={24} className="text-indigo-600" />
                        <div>
                            <p className="text-xs font-bold text-indigo-900 uppercase">AI File Identification</p>
                            <h5 className="text-lg font-bold text-indigo-700">{mappingData.file_type}</h5>
                        </div>
                    </div>
                    <Badge color="blue">Structure Matched</Badge>
                 </div>

                 <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <h6 className="text-xs font-bold text-gray-600 uppercase">Field Mapping Preview</h6>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="text-[10px] text-gray-400 uppercase bg-white sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left">CRM Field</th>
                                    <th className="px-4 py-2 text-left">CSV Column</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Object.entries(mappingData.field_mapping).map(([crm, csv]) => (
                                    <tr key={crm}>
                                        <td className="px-4 py-2 font-medium text-gray-700 capitalize">{crm.replace('_', ' ')}</td>
                                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{csv || <span className="text-amber-400 italic">Not Found</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>

                 <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setMappingData(null)}>Back</Button>
                    <Button 
                        className="flex-1" 
                        onClick={handleUpload} 
                        disabled={isProcessing}
                        icon={isProcessing ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                    >
                        {isProcessing ? 'Processing Records...' : `Import ${allRows.length} Records`}
                    </Button>
                 </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle size={48} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">Import Complete!</h4>
              <p className="text-gray-500">Nexus AI has successfully categorized your data.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{importSummary.deals}</p>
                <p className="text-[10px] uppercase font-bold text-blue-400">Deals</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-2xl font-bold text-purple-600">{importSummary.leads}</p>
                <p className="text-[10px] uppercase font-bold text-purple-400">Leads</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-2xl font-bold text-gray-600">{importSummary.contacts}</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">Contacts</p>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full" 
                onClick={() => { reset(); onClose(); }}
                icon={<ArrowRight size={18} />}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
