import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Client, User, UrgencyLevel } from '../types';
import { ClientTable } from '../components/ClientTable';
import { ClientModal } from '../components/ClientModal';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { DateFilter } from '../components/DateFilter'; // Import the new DateFilter component
import { Plus, Upload, Search, X, Filter, ChevronDown } from 'lucide-react';

const API_BASE = 'https://localhost:7047';

interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  team: string;
  role: string;
  isActive: boolean;
}

interface ApiDocument {
  id: string;
  name: string;
  fileUrl: string;
  uploadedByUserId: string;
  uploadedDate: string;
}

// Define the DateFilterState interface
export interface DateFilterState {
  type: 'contractStartDate' | 'updatedDate' | 'createdDate' | null;
  mode: 'year' | 'month' | 'range';
  year?: string; // "YYYY"
  month?: string; // "YYYY-MM"
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [teamFilterOpen, setTeamFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: null, mode: 'range' });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get<ApiUser[]>(`${API_BASE}/api/users`, {
        headers: getAuthHeaders(),
      });
      setUsers(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to load users:', err);
      return [];
    }
  }, []);

  const fetchClients = useCallback(async (userList?: ApiUser[]) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<any[]>(`${API_BASE}/api/client`, {
        headers: getAuthHeaders(),
      });
      const usersToUse = userList || users;
      const mapped = response.data.map(api => mapApiClientToUi(api, usersToUse));
      setClients(mapped);
    } catch (err) {
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [users]);

  useEffect(() => {
    const init = async () => {
      const loadedUsers = await fetchUsers();
      await fetchClients(loadedUsers);
    };
    init();
  }, []);

  function mapApiClientToUi(api: any, userList: ApiUser[]): Client {
    const urgencyMap: Record<string, UrgencyLevel> = {
      Low: 'long-term',
      Medium: 'short-term',
      High: 'immediate',
    };

    // Resolve assigned sales person from user list
    const assignedUser = api.assignedSalesPersonId
      ? userList.find(u => u.id === api.assignedSalesPersonId)
      : null;

    const assignedSalesPerson: User | null = assignedUser
      ? {
        id: assignedUser.id,
        name: assignedUser.fullName,
        email: assignedUser.email,
        role: 'support',
        team: assignedUser.team as any,
      }
      : null;

    // Map documents from API
    const documents = (api.documents ?? []).map((doc: ApiDocument) => ({
      id: doc.id,
      name: doc.name,
      type: 'application/octet-stream',
      uploadedBy: assignedSalesPerson || {
        id: doc.uploadedByUserId,
        name: 'Unknown',
        email: '',
        role: 'support' as const,
        team: api.assignedTeam,
      },
      uploadedDate: doc.uploadedDate,
      url: `${API_BASE}${doc.fileUrl}`,
    }));

    return {
      id: api.id,
      companyName: api.companyName,
      contactName: api.contactName,
      email: api.email,
      phone: api.phoneNumber,
      featuresGiven: api.featuresGiven ?? [],
      upsellOpportunities: api.upsellOpportunities ?? [],
      urgency: urgencyMap[api.urgency] ?? 'short-term',
      assignedSalesPerson,
      contractStartDate: api.contractStartDate,
      contractEndDate: api.contractEndDate,
      salesTeam: api.assignedTeam,
      documents,
      comments: [],
      createdBy: {
        id: api.createdByUserId ?? '',
        name: '',
        email: '',
        role: 'support',
        team: api.assignedTeam,
      },
      createdDate: api.createdAt,
      updatedDate: api.createdAt,
    };
  }

  function toCreateClientRequest(client: Client) {
    const urgencyReverseMap: Record<UrgencyLevel, string> = {
      immediate: 'High',
      'short-term': 'Medium',
      'long-term': 'Low',
    };

    return {
      companyName: client.companyName,
      contactName: client.contactName,
      phoneNumber: client.phone,
      email: client.email,
      featuresGiven: client.featuresGiven,
      upsellOpportunities: client.upsellOpportunities,
      urgency: urgencyReverseMap[client.urgency],
      contractStartDate: client.contractStartDate || new Date().toISOString(),
      contractEndDate: client.contractEndDate || new Date().toISOString(),
      assignedSalesPersonId: client.assignedSalesPerson?.id ?? '',
    };
  }

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleSaveClient = async (client: Client) => {
    try {
      if (editingClient) {
        const response = await axios.put<any>(
          `${API_BASE}/api/client/${client.id}`,
          toCreateClientRequest(client),
          { headers: getAuthHeaders() }
        );
        const updated = mapApiClientToUi(response.data, users);
        // Preserve documents from current client state
        setClients(prev =>
          prev.map(c => c.id === client.id ? { ...updated, documents: client.documents } : c)
        );
      } else {
        const response = await axios.post<any>(
          `${API_BASE}/api/client`,
          toCreateClientRequest(client),
          { headers: getAuthHeaders() }
        );
        const created = mapApiClientToUi(response.data, users);
        setClients(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (err) {
      alert('Failed to save client. Please try again.');
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    // Local update for doc/feature changes without API call (those are handled in their own cells)
    setClients(prev =>
      prev.map(c => c.id === updatedClient.id ? updatedClient : c)
    );
  };

  const handleDeleteClient = async (client: Client) => {
    if (!window.confirm(`Delete ${client.companyName}? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/api/client/${client.id}`, {
        headers: getAuthHeaders(),
      });
      setClients(prev => prev.filter(c => c.id !== client.id));
    } catch (err) {
      alert('Failed to delete client. Please try again.');
    }
  };

  const handleImportClients = async (importedClients: Partial<Client>[]) => {
    try {
      const created: Client[] = [];
      for (const partial of importedClients) {
        const response = await axios.post<any>(
          `${API_BASE}/api/client`,
          toCreateClientRequest(partial as Client),
          { headers: getAuthHeaders() }
        );
        created.push(mapApiClientToUi(response.data, users));
      }
      setClients(prev => [...created, ...prev]);
    } catch (err) {
      alert('Failed to import some clients. Please try again.');
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // 1. Search Filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);

      // 2. Team Filter
      const matchesTeam = selectedTeams.size === 0 || selectedTeams.has(c.salesTeam);

      // 3. Date Filter
      let matchesDate = true;
      if (dateFilter.type) {
        let targetDateString = '';
        if (dateFilter.type === 'contractStartDate') targetDateString = c.contractStartDate;
        else if (dateFilter.type === 'updatedDate') targetDateString = c.updatedDate;
        else if (dateFilter.type === 'createdDate') targetDateString = c.createdDate;

        if (!targetDateString) {
          matchesDate = false;
        } else {
          const targetDateObj = new Date(targetDateString);

          if (dateFilter.mode === 'year' && dateFilter.year) {
            matchesDate = targetDateObj.getFullYear().toString() === dateFilter.year;
          } else if (dateFilter.mode === 'month' && dateFilter.month) {
            // dateFilter.month is "YYYY-MM"
            const [y, m] = dateFilter.month.split('-');
            matchesDate = targetDateObj.getFullYear() === parseInt(y) &&
              (targetDateObj.getMonth() + 1) === parseInt(m);
          } else if (dateFilter.mode === 'range') {
            const tTime = targetDateObj.getTime();
            if (dateFilter.startDate) {
              const sTime = new Date(dateFilter.startDate).getTime();
              if (tTime < sTime) matchesDate = false;
            }
            if (dateFilter.endDate) {
              const eTime = new Date(dateFilter.endDate);
              eTime.setHours(23, 59, 59, 999); // Include entire end day
              if (tTime > eTime.getTime()) matchesDate = false;
            }
          }
        }
      }

      return matchesSearch && matchesTeam && matchesDate;
    });
  }, [clients, searchQuery, selectedTeams, dateFilter]);

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev => {
      const next = new Set(prev);
      next.has(team) ? next.delete(team) : next.add(team);
      return next;
    });
  };

  const TEAM_FILTER_OPTIONS = [
    { key: 'Sohaib', color: '#7c3aed' },
    { key: 'Sana', color: '#db2777' },
    { key: 'Sales', color: '#0d9488' },
  ];

  const activeTeamLabel = selectedTeams.size === 0
    ? 'All Teams'
    : [...selectedTeams].join(' + ');

  return (
    <div className="max-w-[1800px] mx-auto">
      {loading && <p className="text-gray-500 mb-3">Loading clients...</p>}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button onClick={() => fetchClients()} className="mt-2 text-sm text-red-700 underline">Try again</button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your client relationships</p>
        </div>

        {/* ONE-LINE TOOLBAR */}
        <div className="flex items-center gap-3">

          {/* Search bar */}
          <div className="relative w-[480px] flex-shrink-0">
            <Search className="absolute text-gray-400 w-4 h-10 top-1/2 -translate-y-1/2" style={{ left: '12px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by company, contact or email…"
              className="w-full h-10 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-[13px] shadow-sm"
              style={{ paddingLeft: '38px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Team filter dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setTeamFilterOpen(o => !o)}
              className={`flex items-center gap-2 px-4 h-10 border rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap shadow-sm ${selectedTeams.size > 0
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Filter className="w-4 h-4" />
              {activeTeamLabel}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {teamFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTeamFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[170px] py-1.5">
                  <button
                    onClick={() => setSelectedTeams(new Set())}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedTeams.size === 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${selectedTeams.size === 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                      }`}>{selectedTeams.size === 0 ? '✓' : ''}</span>
                    All Teams
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  {TEAM_FILTER_OPTIONS.map(({ key, color }) => (
                    <button key={key} onClick={() => toggleTeam(key)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                      <span
                        className="w-4 h-4 rounded border flex items-center justify-center text-[10px] text-white"
                        style={selectedTeams.has(key)
                          ? { backgroundColor: color, borderColor: color }
                          : { borderColor: '#d1d5db', backgroundColor: 'transparent' }
                        }
                      >{selectedTeams.has(key) ? '✓' : ''}</span>
                      <span className="font-medium" style={{ color: selectedTeams.has(key) ? color : '#374151' }}>{key}</span>
                    </button>
                  ))}
                  {selectedTeams.size > 0 && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <p className="px-4 py-2 text-xs text-gray-500 font-medium">
                        {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} shown
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Advanced Date Filter */}
          <DateFilter filterState={dateFilter} onChange={setDateFilter} />

          {/* Import */}
          <button onClick={() => setIsImportModalOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 h-10 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-[13px] font-medium whitespace-nowrap shadow-sm">
            <Upload className="w-4 h-4" /> Import
          </button>

          {/* Add client */}
          <button onClick={handleAddClient}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[13px] font-semibold whitespace-nowrap shadow-sm border border-blue-600">
            <Plus className="w-4 h-4" /> Add Client
          </button>

        </div> {/* Closes ONE-LINE TOOLBAR */}
      </div>

      {!loading && (
        <ClientTable
          clients={filteredClients}
          onEditClient={handleEditClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
        />
      )}

      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => { setIsModalOpen(false); setEditingClient(null); }}
          onSave={handleSaveClient}
        />
      )}

      {isImportModalOpen && (
        <ExcelImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportClients}
        />
      )}

    </div>
  );
}