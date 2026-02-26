import React from 'react';
import { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Client } from '../types';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  onClose: () => void;
  onImport: (clients: Partial<Client>[]) => void;
}

export function ExcelImportModal({ onClose, onImport }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setFile(selectedFile);

    // Read and preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setPreview(jsonData.slice(0, 5)); // Show first 5 rows as preview
      } catch (err) {
        setError('Failed to read Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = () => {
    if (!file || !currentUser) return;

    setIsProcessing(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel data to Client structure
        const importedClients: Partial<Client>[] = jsonData.map((row, index) => ({
          id: `import-${Date.now()}-${index}`,
          companyName: row['Company Name'] || row['companyName'] || '',
          contactName: row['Contact Name'] || row['contactName'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          featuresGiven: row['Features'] ? String(row['Features']).split(',').map((f: string) => f.trim()) : [],
          upsellOpportunities: row['Upsell Opportunities'] || row['upsellOpportunities'] || '',
          urgency: (row['Urgency'] || row['urgency'] || 'short-term').toLowerCase(),
          contractStartDate: row['Contract Start'] || row['contractStartDate'] || new Date().toISOString().split('T')[0],
          contractEndDate: row['Contract End'] || row['contractEndDate'] || '',
          salesTeam: currentUser.team,
          assignedSalesPerson: null,
          documents: [],
          comments: [],
          createdBy: currentUser,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
        }));

        onImport(importedClients);
        onClose();
      } catch (err) {
        setError('Failed to process Excel file. Please check the format and try again.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Import Clients from Excel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Excel Format Requirements</h3>
            <p className="text-sm text-blue-800 mb-2">
              Your Excel file should have the following columns:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Company Name</li>
              <li>Contact Name</li>
              <li>Email</li>
              <li>Phone</li>
              <li>Features (comma-separated)</li>
              <li>Upsell Opportunities</li>
              <li>Urgency (immediate, short-term, or long-term)</li>
              <li>Contract Start (YYYY-MM-DD)</li>
              <li>Contract End (YYYY-MM-DD)</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Click to upload Excel file
                </button>
              )}
              <p className="text-xs text-gray-500 mt-1">XLSX or XLS files only</p>
            </div>
          </div>

          {preview.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="px-3 py-2 text-gray-600">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Importing...' : 'Import Clients'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
