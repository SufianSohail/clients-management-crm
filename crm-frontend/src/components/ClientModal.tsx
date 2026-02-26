import React from "react"; // Add this at the top

import { useState, useEffect, useRef } from 'react';
import { Client, User, UrgencyLevel } from '../types';
import { X, Plus } from 'lucide-react';
import { mockUsers } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';

interface ClientModalProps {
  client: Client | null;
  onClose: () => void;
  onSave: (client: Client) => void;
}

export function ClientModal({ client, onClose, onSave }: ClientModalProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    featuresGiven: [] as string[],
    upsellOpportunities: [] as string[],
    urgency: 'short-term' as UrgencyLevel,
    assignedSalesPerson: null as User | null,
    contractStartDate: '',
    contractEndDate: '',
  });

  const [featureInput, setFeatureInput] = useState('');
  const [upsellInput, setUpsellInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const featureInputRef = useRef<HTMLInputElement>(null);

  // Get current user from auth context
  const { currentUser } = useAuth();
  const salesUsers = mockUsers.filter(u => u.role === 'sales');

  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName,
        contactName: client.contactName,
        email: client.email,
        phone: client.phone,
        featuresGiven: client.featuresGiven,
        upsellOpportunities: client.upsellOpportunities,
        urgency: client.urgency,
        assignedSalesPerson: client.assignedSalesPerson,
        contractStartDate: client.contractStartDate,
        contractEndDate: client.contractEndDate,
      });
    } else {
      // Auto-assign to current user for new clients if they are sales
      const defaultSales = currentUser?.role === 'sales' ? currentUser : salesUsers[0];
      setFormData(prev => ({ ...prev, assignedSalesPerson: defaultSales }));
    }
  }, [client, currentUser]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.assignedSalesPerson) {
      newErrors.assignedSalesPerson = 'Sales person assignment is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const savedClient: Client = client
      ? {
          ...client,
          ...formData,
          updatedDate: new Date().toISOString(),
        }
      : {
          id: Date.now().toString(),
          ...formData,
          salesTeam: currentUser!.team,
          documents: [],
          comments: [],
          createdBy: currentUser!,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          assignedSalesPerson: formData.assignedSalesPerson!,
        };

    onSave(savedClient);

    // Mock email notification for new assignment
    if (formData.assignedSalesPerson && (!client || client.assignedSalesPerson?.id !== formData.assignedSalesPerson.id)) {
      console.log(`📧 Email sent to ${formData.assignedSalesPerson.email}: You've been assigned to ${formData.companyName}`);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        featuresGiven: [...prev.featuresGiven, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const handleAddUpsell = () => {
    if (upsellInput.trim()) {
      setFormData(prev => ({
        ...prev,
        upsellOpportunities: [...prev.upsellOpportunities, upsellInput.trim()],
      }));
      setUpsellInput('');
    }
  };

  const handleUpsellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUpsell();
    } else if (e.key === 'Backspace' && upsellInput === '' && formData.upsellOpportunities.length > 0) {
      setFormData(prev => ({
        ...prev,
        upsellOpportunities: prev.upsellOpportunities.slice(0, -1),
      }));
    }
  };

  const handleRemoveUpsell = (index: number) => {
    setFormData(prev => ({
      ...prev,
      upsellOpportunities: prev.upsellOpportunities.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    } else if (e.key === 'Backspace' && featureInput === '' && formData.featuresGiven.length > 0) {
      setFormData(prev => ({
        ...prev,
        featuresGiven: prev.featuresGiven.slice(0, -1),
      }));
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      featuresGiven: prev.featuresGiven.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.contactName && (
                <p className="mt-1 text-sm text-red-500">{errors.contactName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Features Given
            </label>
            <div className="border border-gray-300 rounded-lg p-3 min-h-[80px]">
              <div className="flex flex-wrap gap-2 items-center">
                {formData.featuresGiven.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm border border-blue-200"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={featureInputRef}
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={handleFeatureKeyDown}
                  onBlur={handleAddFeature}
                  placeholder="Type feature and press Enter..."
                  className="flex-1 min-w-[200px] px-2 py-1 text-sm border-none focus:outline-none focus:ring-0"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Type a feature name and press Enter to add. Press Backspace to remove last feature.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upsell / Cross-Sell Opportunities
            </label>
            <div className="border border-gray-300 rounded-lg p-3 min-h-[80px]">
              <div className="flex flex-wrap gap-2 items-center">
                {formData.upsellOpportunities.map((upsell, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-sm border border-green-200"
                  >
                    {upsell}
                    <button
                      type="button"
                      onClick={() => handleRemoveUpsell(index)}
                      className="hover:text-green-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={upsellInput}
                  onChange={(e) => setUpsellInput(e.target.value)}
                  onKeyDown={handleUpsellKeyDown}
                  onBlur={handleAddUpsell}
                  placeholder="Type upsell and press Enter..."
                  className="flex-1 min-w-[200px] px-2 py-1 text-sm border-none focus:outline-none focus:ring-0"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Type an upsell or cross-sell opportunity and press Enter to add. Press Backspace to remove last tag.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as UrgencyLevel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="immediate">Immediate (1-2 days)</option>
                <option value="short-term">Short Term (within 4 weeks)</option>
                <option value="long-term">Long Term (over 4 weeks)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Start
              </label>
              <input
                type="date"
                value={formData.contractStartDate}
                onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract End
              </label>
              <input
                type="date"
                value={formData.contractEndDate}
                onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Sales Person <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.assignedSalesPerson?.id || ''}
              onChange={(e) => setFormData({
                ...formData,
                assignedSalesPerson: salesUsers.find(u => u.id === e.target.value) || null,
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.assignedSalesPerson ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select sales person...</option>
              {salesUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.team})
                </option>
              ))}
            </select>
            {errors.assignedSalesPerson && (
              <p className="mt-1 text-sm text-red-500">{errors.assignedSalesPerson}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Use the Comments section to add internal notes for sales handoff and collaboration.
              {currentUser && (
                <span className="block mt-1">
                  This client will be assigned to <strong>{currentUser.team}</strong> team.
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {client ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
