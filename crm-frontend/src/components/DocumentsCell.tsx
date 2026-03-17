import React from 'react';
import { useState } from 'react';
import { Client } from '../types';
import { Upload, FileText, X, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_BASE = 'https://localhost:7047';

interface DocumentsCellProps {
  client: Client;
  onUpdate: (client: Client) => void;
}

export function DocumentsCell({ client, onUpdate }: DocumentsCellProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { currentUser } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !currentUser) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const updatedDocuments = [...client.documents];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post<{
          id: string;
          name: string;
          fileUrl: string;
          uploadedByUserId: string;
          uploadedDate: string;
        }>(
          `${API_BASE}/api/client/${client.id}/documents`,
          formData,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        updatedDocuments.push({
          id: response.data.id,
          name: response.data.name,
          type: file.type,
          uploadedBy: currentUser,
          uploadedDate: response.data.uploadedDate,
          url: `${API_BASE}${response.data.fileUrl}`,
        });
      }

      onUpdate({ ...client, documents: updatedDocuments });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/client/${client.id}/documents/${docId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      onUpdate({
        ...client,
        documents: client.documents.filter((doc) => doc.id !== docId),
      });
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete document. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center gap-0.5 w-full">
      {client.documents.length > 0 && (
        <div className="flex flex-wrap gap-0">
          {client.documents.map((doc) => (
            <div
              key={doc.id}
              className="group relative inline-flex items-center gap-0.5 px-0.5 py-0 bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200"
              title={`${doc.name} - Uploaded by ${doc.uploadedBy.name}`}
            >
              <FileText className="w-2 h-2 flex-shrink-0" />
              <span className="max-w-[28px] truncate text-[8px] leading-tight">{doc.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                  title="Download"
                >
                  <Download className="w-2 h-2" />
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="hover:text-red-600"
                  title="Delete"
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label
        className={`inline-flex items-center justify-center w-3 h-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded mb-0.5 transition-colors cursor-pointer flex-shrink-0 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Upload documents"
      >
        {isUploading ? (
          <Loader2 className="w-2 h-2 animate-spin" />
        ) : (
          <Upload className="w-2 h-2" />
        )}
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
      </label>
    </div>
  );
}
