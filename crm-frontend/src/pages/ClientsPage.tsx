import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Client, UrgencyLevel } from '../types';
import { ClientTable } from '../components/ClientTable';
import { ClientModal } from '../components/ClientModal';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { Plus, Upload } from 'lucide-react';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const response = await axios.get<any[]>('https://localhost:7047/api/client', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const mapped = response.data.map(mapApiClientToUi);
        setClients(mapped);
      } catch (err) {
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleSaveClient = async (client: Client) => {
    const token = localStorage.getItem('token');
    if (editingClient) {
      await axios.put(`https://localhost:7047/api/client/${client.id}`, toCreateClientRequest(client), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setClients(clients.map(c => c.id === client.id ? client : c));
    } else {
      const response = await axios.post<any>('https://localhost:7047/api/client', toCreateClientRequest(client), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const created = mapApiClientToUi(response.data);
      setClients([created, ...clients]);
    }
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleImportClients = async (importedClients: Partial<Client>[]) => {
    const token = localStorage.getItem('token');
    const created: Client[] = [];
    for (const partial of importedClients) {
      const response = await axios.post<any>('https://localhost:7047/api/client', toCreateClientRequest(partial as Client), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      created.push(mapApiClientToUi(response.data));
    }
    setClients([...created, ...clients]);
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    const token = localStorage.getItem('token');
    await axios.put(`https://localhost:7047/api/client/${updatedClient.id}`, toCreateClientRequest(updatedClient), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  function mapApiClientToUi(api: any): Client {
    const urgencyMap: Record<string, UrgencyLevel> = {
      Low: 'long-term',
      Medium: 'short-term',
      High: 'immediate',
    };

    return {
      id: api.id,
      companyName: api.companyName,
      contactName: api.contactName,
      email: api.email,
      phone: api.phoneNumber,
      featuresGiven: api.featuresGiven ?? [],
      upsellOpportunities: api.upsellOpportunities ?? [],
      urgency: urgencyMap[api.urgency] ?? 'short-term',
      assignedSalesPerson: null, // can be populated when backend returns user details
      contractStartDate: api.contractStartDate,
      contractEndDate: api.contractEndDate,
      salesTeam: api.assignedTeam,
      documents: [],
      comments: [],
      createdBy: {
        id: api.createdByUserId ?? '',
        name: '',
        email: '',
        role: 'sales',
        team: api.assignedTeam,
      },
      createdDate: api.createdAt,
      updatedDate: api.createdAt,
    };
  }

  function toCreateClientRequest(client: Client) {
    const urgencyReverseMap: Record<UrgencyLevel, string> = {
      'immediate': 'High',
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
      contractStartDate: client.contractStartDate,
      contractEndDate: client.contractEndDate,
      assignedSalesPersonId: client.assignedSalesPerson?.id ?? '',
    };
  }

  return (
    <div className="max-w-[1800px] mx-auto">
      {loading && <p className="text-gray-500 mb-4">Loading clients...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Clients</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your client relationships and track opportunities
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Import from Excel
          </button>
          <button
            onClick={handleAddClient}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Client
          </button>
        </div>
      </div>

      <ClientTable
        clients={clients}
        onEditClient={handleEditClient}
        onUpdateClient={handleUpdateClient}
        onDeleteClient={async (client) => {
          const token = localStorage.getItem('token');
          await axios.delete(`https://localhost:7047/api/client/${client.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          setClients(clients.filter(c => c.id !== client.id));
        }}
      />

      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }}
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