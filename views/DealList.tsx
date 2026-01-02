
import React, { useState, useRef } from 'react';
import { Deal, Task } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { Search, Plus, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { dataService } from '../services/dataService';

interface DealListProps {
  deals: Deal[];
  tasks: Task[];
  onOpenDeal: (id: string) => void;
  onNewDeal: () => void;
  onRefreshData: () => void;
}

export const DealList: React.FC<DealListProps> = ({ deals, onOpenDeal, onNewDeal, onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDeals = deals.filter(deal => {
    const term = searchTerm.toLowerCase();
    return (
      deal.address.toLowerCase().includes(term) || 
      deal.clientName.toLowerCase().includes(term) ||
      deal.status.toLowerCase().includes(term) ||
      deal.mlsNumber?.toLowerCase().includes(term)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // --- CSV Import Logic ---
  
  const handleDownloadTemplate = () => {
    const headers = "MLS #,Category,Status,Address,City,Beds,Baths,Sub Type,Price,Client Name,Office";
    const row = "MLS-1001,Residential,Active,123 Main St,Springfield,3,2,Single Family,450000,John Doe,Main Office";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(`${headers}\n${row}`);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "reality_mark_deals_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const firstLine = text.split('\n')[0];
    let delimiter = ',';
    if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
    if (firstLine.includes('\t')) delimiter = '\t';

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuote && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === delimiter && !inQuote) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuote) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const dataRows = rows.filter(r => r.length > 0 && r.some(c => c.length > 0));

      if (dataRows.length < 2) throw new Error("File appears empty.");

      const headers = dataRows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      
      const findCol = (terms: string[]) => headers.findIndex(h => terms.some(t => h.includes(t)));

      const idxMls = findCol(['mls', 'id']);
      const idxCat = findCol(['cat', 'type']);
      const idxStatus = findCol(['stat']);
      const idxAddr = findCol(['addr', 'street', 'prop']);
      const idxCity = findCol(['city']);
      const idxBeds = findCol(['bed']);
      const idxBaths = findCol(['bath']);
      const idxSub = findCol(['sub', 'style']);
      const idxPrice = findCol(['price', 'amount', 'val']);
      const idxClient = findCol(['client', 'owner', 'name']);
      const idxOffice = findCol(['office', 'agency']);

      const newDeals: Partial<Deal>[] = [];
      for (let i = 1; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length < 2) continue;

        newDeals.push({
          mlsNumber: idxMls !== -1 ? row[idxMls] : '',
          category: idxCat !== -1 ? row[idxCat] : 'Residential',
          status: (idxStatus !== -1 ? row[idxStatus] : 'Lead') as any,
          address: idxAddr !== -1 ? row[idxAddr] : 'Unnamed Property',
          city: idxCity !== -1 ? row[idxCity] : '',
          beds: idxBeds !== -1 ? Number(row[idxBeds]) || 0 : 0,
          baths: idxBaths !== -1 ? Number(row[idxBaths]) || 0 : 0,
          subType: idxSub !== -1 ? row[idxSub] : '',
          price: idxPrice !== -1 ? Number(row[idxPrice].replace(/[^0-9.]/g, '')) || 0 : 0,
          clientName: idxClient !== -1 ? row[idxClient] : 'Unknown Client',
          officeName: idxOffice !== -1 ? row[idxOffice] : '',
        });
      }

      if (newDeals.length > 0) {
        await dataService.addDeals(newDeals);
        onRefreshData();
      }
    } catch (e) {
      alert("Import failed. Please check your CSV format.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <Card className="flex-1 flex flex-col shadow-sm border border-gray-200" noPadding>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center gap-4 bg-white rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900">Deals Directory</h2>
            <div className="flex items-center gap-2">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search MLS, Address, Client..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImportCSV} 
                />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<Download size={14} />} 
                  onClick={handleDownloadTemplate}
                  title="Download CSV Template"
                >
                  Template
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<FileSpreadsheet size={16} />} 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import CSV'}
                </Button>

                <button onClick={onNewDeal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
                    <Plus size={16} /> New Deal
                </button>
            </div>
        </div>

        <div className="overflow-auto flex-1 bg-white">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-bold">MLS #</th>
                <th className="px-4 py-3 font-bold">Cat</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Address</th>
                <th className="px-4 py-3 font-bold">City</th>
                <th className="px-4 py-3 font-bold">Beds</th>
                <th className="px-4 py-3 font-bold">Baths</th>
                <th className="px-4 py-3 font-bold">Sub Type</th>
                <th className="px-4 py-3 font-bold">Status Date</th>
                <th className="px-4 py-3 font-bold">Contractual</th>
                <th className="px-4 py-3 font-bold">Search</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Office</th>
                <th className="px-4 py-3 font-bold text-right">Price</th>
                <th className="px-4 py-3 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeals.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3 text-indigo-600 font-semibold">{deal.mlsNumber || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{deal.category || '-'}</td>
                  <td className="px-4 py-3">
                     <Badge color={
                       deal.status === 'Lead' ? 'yellow' : 
                       deal.status === 'Active' ? 'green' : 
                       deal.status === 'Closed' ? 'purple' : 'blue'
                     }>
                       {deal.status}
                     </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium truncate max-w-[150px]" title={deal.address}>{deal.address}</td>
                  <td className="px-4 py-3 text-gray-600">{deal.city || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-center">{deal.beds ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-center">{deal.baths ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{deal.subType || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.statusDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{deal.contractualInfo || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{deal.searchId || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-[100px]">{deal.officeName || '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(deal.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => onOpenDeal(deal.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      OPEN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
