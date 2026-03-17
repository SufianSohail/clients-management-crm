import React, { useState } from 'react';
import { Client } from '../types';
import { ClientRow } from './ClientRow';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface ClientTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
}

export function ClientTable({ clients, onEditClient, onUpdateClient, onDeleteClient }: ClientTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof Client | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSort = (column: keyof Client) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedClients = [...clients].sort((a, b) => {
    if (!sortColumn) return 0;
    let aValue: any = a[sortColumn];
    let bValue: any = b[sortColumn];
    if (sortColumn === 'assignedSalesPerson') {
      aValue = a.assignedSalesPerson?.name || '';
      bValue = b.assignedSalesPerson?.name || '';
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedClients.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sortedClients.length);
  const visibleClients = sortedClients.slice(pageStart, pageEnd);

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  const SortIcon = ({ col }: { col: keyof Client }) => (
    <span className={`ml-1 text-gray-400 ${sortColumn === col ? 'text-blue-600' : ''}`}>
      {sortColumn === col ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const TH = ({ label, col, sortable = false, width }: { label: string; col?: keyof Client; sortable?: boolean; width?: string }) => (
    <th
      style={{ width }}
      className={`px-3 py-3 ${label === 'Docs' ? 'text-center' : 'text-left'} text-[11px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${sortable ? 'cursor-pointer select-none hover:text-blue-700 hover:bg-gray-100' : ''}`}
      onClick={sortable && col ? () => handleSort(col) : undefined}
    >
      <div className={`flex items-center ${label === 'Docs' ? 'justify-center' : ''}`}>
        {label}{sortable && col && <SortIcon col={col} />}
      </div>
    </th>
  );

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">No clients found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed min-w-[2000px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              <TH label="Team" col="salesTeam" sortable width="80px" />
              <TH label="Company" col="companyName" sortable width="130px" />
              <TH label="Contact" col="contactName" sortable width="120px" />
              <TH label="Features Given" width="450px" />
              <TH label="Upsell / Cross-Sell" width="450px" />
              <TH label="Urgency" col="urgency" sortable width="110px" />
              <TH label="Start Date" col="contractStartDate" sortable width="125px" />
              <TH label="End Date" col="contractEndDate" sortable width="125px" />
              <TH label="Sales Contact" col="assignedSalesPerson" sortable width="190px" />
              <TH label="Docs" width="65px" />
              <TH label="Comments" width="230px" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {visibleClients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onEdit={onEditClient}
                onUpdate={onUpdateClient}
                onDelete={onDeleteClient}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {PAGE_SIZE_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-gray-500">
            {sortedClients.length === 0 ? '0' : `${pageStart + 1}–${pageEnd}`} of {sortedClients.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <PagBtn onClick={() => goToPage(1)} disabled={safePage === 1} title="First page">
            <ChevronsLeft className="w-4 h-4" />
          </PagBtn>
          <PagBtn onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} title="Previous">
            <ChevronLeft className="w-4 h-4" />
          </PagBtn>

          {/* Page number pills */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce<(number | '...')[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...'
                ? <span key={`ell-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                : <button key={p}
                  onClick={() => goToPage(p as number)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${safePage === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >{p}</button>
            )}

          <PagBtn onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages} title="Next">
            <ChevronRight className="w-4 h-4" />
          </PagBtn>
          <PagBtn onClick={() => goToPage(totalPages)} disabled={safePage === totalPages} title="Last page">
            <ChevronsRight className="w-4 h-4" />
          </PagBtn>
        </div>
      </div>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, title }: {
  children: React.ReactNode; onClick: () => void; disabled: boolean; title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}