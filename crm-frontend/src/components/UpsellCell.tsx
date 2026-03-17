import React, { useState, useRef } from 'react';
import { Client } from '../types';
import { Plus, X } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'https://localhost:7047';

interface UpsellCellProps {
    client: Client;
    onUpdate: (client: Client) => void;
}

export function UpsellCell({ client, onUpdate }: UpsellCellProps) {
    const [inputValue, setInputValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const persistUpdate = async (updatedClient: Client) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const urgencyReverseMap: Record<string, string> = {
                immediate: 'High',
                'short-term': 'Medium',
                'long-term': 'Low',
            };
            await axios.put(
                `${API_BASE}/api/client/${updatedClient.id}`,
                {
                    companyName: updatedClient.companyName,
                    contactName: updatedClient.contactName,
                    phoneNumber: updatedClient.phone,
                    email: updatedClient.email,
                    featuresGiven: updatedClient.featuresGiven,
                    upsellOpportunities: updatedClient.upsellOpportunities,
                    urgency: urgencyReverseMap[updatedClient.urgency] ?? 'Medium',
                    contractStartDate: updatedClient.contractStartDate || new Date().toISOString(),
                    contractEndDate: updatedClient.contractEndDate || new Date().toISOString(),
                    assignedSalesPersonId: updatedClient.assignedSalesPerson?.id ?? '',
                },
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            onUpdate(updatedClient);
        } catch {
            // Silently revert - the parent still has the old state
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddUpsell = () => {
        if (inputValue.trim()) {
            const updated: Client = {
                ...client,
                upsellOpportunities: [...client.upsellOpportunities, inputValue.trim()],
                updatedDate: new Date().toISOString(),
            };
            setInputValue('');
            persistUpdate(updated);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddUpsell();
        } else if (e.key === 'Backspace' && inputValue === '' && client.upsellOpportunities.length > 0) {
            const updated: Client = {
                ...client,
                upsellOpportunities: client.upsellOpportunities.slice(0, -1),
                updatedDate: new Date().toISOString(),
            };
            persistUpdate(updated);
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setInputValue('');
        }
    };

    const handleRemove = (index: number) => {
        const updated: Client = {
            ...client,
            upsellOpportunities: client.upsellOpportunities.filter((_, i) => i !== index),
            updatedDate: new Date().toISOString(),
        };
        persistUpdate(updated);
    };

    return (
        <div className={`flex flex-wrap gap-1.5 items-center ${isSaving ? 'opacity-70' : ''}`}>
            {client.upsellOpportunities.map((upsell, index) => (
                <span
                    key={index}
                    className="inline-flex items-center justify-center text-center gap-1 px-2.5 py-1 bg-green-50 text-green-800 rounded-full text-xs font-medium border border-green-300 group"
                >
                    {upsell}
                    <button
                        onClick={() => handleRemove(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-green-900"
                        title="Remove"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}

            {isAdding ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        handleAddUpsell();
                        setIsAdding(false);
                    }}
                    placeholder="Type and press Enter"
                    className="px-2 py-1 text-xs border border-green-500 rounded focus:outline-none focus:ring-1 focus:ring-green-500 w-32"
                    autoFocus
                />
            ) : (
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                    title="Add upsell opportunity"
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
