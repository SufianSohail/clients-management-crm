import React from 'react';
import { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Client, UrgencyLevel } from '../types';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  onClose: () => void;
  onImport: (clients: Partial<Client>[]) => void;
}

// Template column definitions
const TEMPLATE_COLUMNS = [
  'Company Name',
  'Contact Name',
  'Email',
  'Phone',
  'Features',
  'Upsell Opportunities',
  'Urgency',
  'Contract Start',
  'Contract End',
];

const SAMPLE_ROWS = [
  ['Acme Corp', 'John Doe', 'john@acme.com', '03001234567', 'CRM Integration, API Access', 'Analytics Dashboard, White Labeling', 'High', '2026-03-01', '2026-12-31'],
  ['Beta Ltd', 'Sara Ali', 'sara@beta.com', '+923009876543', 'Email Marketing', 'Enterprise Plan', 'Medium', '2026-04-01', '2027-03-31'],
];

const URGENCY_NOTES = [
  '• Urgency values: High, Medium, Low',
  '• Features and Upsell Opportunities: comma-separated values',
  '• Phone format: 03001234567 or +923001234567',
  '• Contract dates format: YYYY-MM-DD (e.g. 2026-03-15)',
];

export function ExcelImportModal({ onClose, onImport }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, ...SAMPLE_ROWS]);

    // Column widths
    ws['!cols'] = TEMPLATE_COLUMNS.map((_, i) => ({
      wch: i < 2 ? 20 : i < 4 ? 25 : i === 6 ? 12 : 15,
    }));

    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, 'crm_client_import_template.xlsx');
  };

  const parseRows = (jsonData: any[]): Partial<Client>[] => {
    const urgencyMap: Record<string, UrgencyLevel> = {
      High: 'immediate', Medium: 'short-term', Low: 'long-term',
      high: 'immediate', medium: 'short-term', low: 'long-term',
      immediate: 'immediate', 'short-term': 'short-term', 'long-term': 'long-term',
    };

    return jsonData
      .filter(row =>
        (row['Company Name'] || row['companyName']) &&
        (row['Email'] || row['email'])
      )
      .map((row, index) => {
        const rawUrgency = String(row['Urgency'] || row['urgency'] || 'Medium').trim();
        const urgency: UrgencyLevel = urgencyMap[rawUrgency] || 'short-term';

        const rawUpsell = row['Upsell Opportunities'] || row['upsellOpportunities'] || '';
        const upsellOpportunities: string[] = rawUpsell
          ? String(rawUpsell).split(',').map((u: string) => u.trim()).filter(Boolean)
          : [];

        const rawFeatures = row['Features'] || row['featuresGiven'] || '';
        const featuresGiven: string[] = rawFeatures
          ? String(rawFeatures).split(',').map((f: string) => f.trim()).filter(Boolean)
          : [];

        // Handle date values that may come as Excel serial numbers
        const parseDate = (val: any): string => {
          if (!val) return new Date().toISOString();
          if (typeof val === 'number') {
            // Excel serial date
            const date = XLSX.SSF.parse_date_code(val);
            if (date) return new Date(date.y, date.m - 1, date.d).toISOString();
          }
          const d = new Date(String(val));
          return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        };

        return {
          id: `import-${Date.now()}-${index}`,
          companyName: String(row['Company Name'] || row['companyName'] || '').trim(),
          contactName: String(row['Contact Name'] || row['contactName'] || '').trim(),
          email: String(row['Email'] || row['email'] || '').trim(),
          phone: String(row['Phone'] || row['phone'] || '').trim(),
          featuresGiven,
          upsellOpportunities,
          urgency,
          contractStartDate: parseDate(row['Contract Start'] || row['contractStartDate']),
          contractEndDate: parseDate(row['Contract End'] || row['contractEndDate']),
          salesTeam: currentUser!.team,
          assignedSalesPerson: currentUser! as any,
          documents: [],
          comments: [],
          createdBy: currentUser!,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
        };
      });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setPreview([]);
    setPreviewHeaders([]);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        if (jsonData.length === 0) {
          setError('The file appears to be empty. Please check the file and try again.');
          return;
        }

        const headers = Object.keys(jsonData[0]);
        setPreviewHeaders(headers);
        setPreview(jsonData.slice(0, 5));

        const parsed = parseRows(jsonData);
        setImportCount(parsed.length);

        if (parsed.length === 0) {
          setError('No valid rows found. Make sure Company Name and Email columns are present.');
        }
      } catch (err) {
        setError('Failed to read Excel file. Please check the format and try again.');
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
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const importedClients = parseRows(jsonData);

        if (importedClients.length === 0) {
          setError('No valid rows found. Ensure Company Name and Email are filled.');
          setIsProcessing(false);
          return;
        }

        onImport(importedClients);
        onClose();
      } catch (err) {
        setError('Failed to process Excel file. Please check the format and try again.');
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Format guide + Download Template button */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">Required Columns</h3>
                <div className="grid grid-cols-2 gap-x-4 text-sm text-blue-800">
                  {TEMPLATE_COLUMNS.map(col => (
                    <div key={col} className="flex items-center gap-1">
                      <span className="text-blue-400">•</span> {col}
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1">
                  {URGENCY_NOTES.map((note, i) => (
                    <p key={i} className="text-xs text-blue-700">{note}</p>
                  ))}
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Excel File</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    {importCount > 0 && (
                      <p className="text-xs text-green-600 mt-0.5">{importCount} valid rows detected</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Click to upload Excel file
                  </p>
                  <p className="text-xs text-gray-500 mt-1">XLSX or XLS — Download the template above for the correct format</p>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Preview (First {preview.length} rows)</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewHeaders.map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {previewHeaders.map((key, i) => (
                          <td key={i} className="px-3 py-2 text-gray-600 max-w-[150px] truncate">
                            {String(row[key] ?? '')}
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
              disabled={!file || isProcessing || importCount === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Importing...' : `Import ${importCount} Client${importCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
