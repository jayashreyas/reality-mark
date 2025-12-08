
import React, { useState } from 'react';
import { Deal, Task } from '../types';
import { Card, Badge, Button, InputGroup } from '../components/Shared';
import { Search, Plus, Filter } from 'lucide-react';

interface DealListProps {
  deals: Deal[];
  tasks: Task[];
  onOpenDeal: (id: string) => void;
  onNewDeal: () => void;
}

export const DealList: React.FC<DealListProps> = ({ deals, tasks, onOpenDeal, onNewDeal }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDeals = deals.filter(deal => {
    const matchesStatus = filterStatus === 'All' || deal.status === filterStatus;
    const matchesSearch = 
      deal.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
      deal.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getNextTask = (dealId: string) => {
    const dealTasks = tasks
      .filter(t => t.dealId === dealId && t.status !== 'Completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return dealTasks[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">All Deals</h2>
          <p className="text-gray-500 mt-1">Manage your sales and rental pipeline.</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={onNewDeal}>
          New Deal
        </Button>
      </header>

      <Card className="flex-1 flex flex-col" noPadding>
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search address or client..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <Filter size={18} className="text-gray-400" />
            {['All', 'Lead', 'Active', 'Under Contract', 'Closed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  filterStatus === status 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Property</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Next Action</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeals.map(deal => {
                const nextTask = getNextTask(deal.id);
                return (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {deal.address}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {deal.clientName.charAt(0)}
                        </div>
                        {deal.clientName}
                      </div>
                    </td>
                     <td className="px-6 py-4 text-gray-600">{formatCurrency(deal.price)}</td>
                    <td className="px-6 py-4">
                       <Badge color={
                         deal.status === 'Lead' ? 'yellow' : 
                         deal.status === 'Active' ? 'blue' : 
                         deal.status === 'Closed' ? 'green' : 
                         deal.status === 'Lost' ? 'red' : 'purple'
                       }>
                         {deal.status}
                       </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {nextTask ? (
                        <div>
                          <p className="text-gray-900 truncate max-w-[150px]">{nextTask.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(nextTask.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No tasks</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => onOpenDeal(deal.id)}>
                        Open
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No deals match your criteria.
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
