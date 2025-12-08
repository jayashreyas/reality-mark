
import React, { useState, useRef } from 'react';
import { Deal, Task } from '../types';
import { Card, Badge, Button } from '../components/Shared';
import { Search, Plus, Upload, Download } from 'lucide-react';
import { dataService } from '../services/dataService';

interface DealListProps {
  deals: Deal[];
  tasks: Task[];
  onOpenDeal: (id: string) => void;
  onNewDeal: () => void;
}

export const DealList: React.FC<DealListProps> = ({ deals, tasks, onOpenDeal, onNewDeal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const filteredDeals = deals.filter(deal => {
    const term = searchTerm.toLowerCase();
    return (
      deal.address.toLowerCase().includes(term) || 
      deal.clientName.toLowerCase().includes(term) ||
      deal.status.toLowerCase().includes(term) ||
      deal.primaryAgentName.toLowerCase().includes(term)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const handleExport = () => {
    const headers = ["ID", "Client", "Address", "Type", "Status", "Price", "Agent", "Date"];
    const rows = filteredDeals.map(d => [
        d.id, 
        `"${d.clientName}"`, 
        `"${d.address}"`, 
        d.type, 
        d.status, 
        d.price, 
        `"${d.primaryAgentName}"`, 
        d.createdAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "deals_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV Import Logic (Preserved) ---
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

      if (dataRows.length < 2) throw new Error("File empty or missing headers");

      const headers = dataRows[0].map(h => h.toLowerCase());
      
      const idxClient = headers.findIndex(h => h.includes('client') || h.includes('name'));
      const idxAddress = headers.findIndex(h => h.includes('address') || h.includes('property'));
      const idxType = headers.findIndex(h => h.includes('type'));
      const idxPrice = headers.findIndex(h => h.includes('price') || h.includes('amount'));
      const idxStatus = headers.findIndex(h => h.includes('status'));

      if (idxClient === -1 || idxAddress === -1) {
          throw new Error("Could not find required columns: 'Client Name' and 'Property Address'");
      }

      const newDeals: any[] = [];
      let skipped = 0;

      for (let i = 1; i < dataRows.length; i++) {
        const cols = dataRows[i];
        if (cols.length === 0) continue;

        const clientName = cols[idxClient];
        const address = cols[idxAddress];
        
        if (clientName && address) {
            const typeRaw = idxType !== -1 ? cols[idxType]?.toLowerCase() : 'sale';
            const priceRaw = idxPrice !== -1 ? cols[idxPrice]?.replace(/[^0-9.]/g, '') : '0';
            const statusRaw = idxStatus !== -1 ? cols[idxStatus] : 'Lead';

            newDeals.push({
                clientName,
                address,
                type: typeRaw.includes('rent') ? 'Rental' : 'Sale',
                status: statusRaw,
                price: Number(priceRaw) || 0,
                commissionRate: typeRaw.includes('rent') ? 0 : 2.5 // Default commission
            });
        } else {
            skipped++;
        }
      }

      if (newDeals.length > 0) {
          await dataService.addDeals(newDeals);
          window.location.reload(); 
          alert(`Imported ${newDeals.length} deals successfully.`);
      } else {
          alert('No valid deals found in CSV.');
      }
    } catch (e: any) {
        alert(e.message || "Import failed");
    } finally {
        setIsImporting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <Card className="flex-1 flex flex-col shadow-sm border border-gray-200" noPadding>
        {/* Header & Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white rounded-t-xl">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Deals Management</h2>
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{deals.length} records</span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }}
                    onChange={handleImportCSV} 
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Upload size={16} /> {isImporting ? 'Importing...' : 'Import / Sync'}
                </button>

                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Download size={16} /> Export
                </button>

                 <button 
                    onClick={onNewDeal}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Plus size={16} /> New Deal
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 bg-white">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Address</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Type</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Price</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Agent</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeals.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">
                      {deal.address}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                      {deal.type}
                  </td>
                   <td className="px-6 py-4 text-gray-600 font-medium">
                       {formatCurrency(deal.price)}
                   </td>
                  <td className="px-6 py-4">
                     <Badge color={
                       deal.status === 'Lead' ? 'yellow' : 
                       deal.status === 'Active' ? 'green' : 
                       deal.status === 'Closed' ? 'purple' : 
                       deal.status === 'Lost' ? 'red' : 'blue'
                     }>
                       {deal.status}
                     </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                      {deal.primaryAgentName}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                      {new Date(deal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => onOpenDeal(deal.id)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No deals found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
