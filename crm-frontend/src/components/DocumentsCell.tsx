import React from 'react';
import { useState } from 'react';
import { Client, DocumentFile } from '../types';
import { Upload, FileText, X, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DocumentsCellProps {
  client: Client;
  onUpdate: (client: Client) => void;
}

export function DocumentsCell({ client, onUpdate }: DocumentsCellProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { currentUser } = useAuth();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !currentUser) return;

    setIsUploading(true);

    // Mock file upload - in production, this would upload to server
    const newDocuments: DocumentFile[] = Array.from<File>(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      type: file.type,
      uploadedBy: currentUser,
      uploadedDate: new Date().toISOString(),
      url: URL.createObjectURL(file), // Mock URL
    }));

    onUpdate({
      ...client,
      documents: [...client.documents, ...newDocuments],
      updatedDate: new Date().toISOString(),
    });

    setIsUploading(false);
    e.target.value = ''; // Reset input
  };

  const handleDeleteDocument = (docId: string) => {
    onUpdate({
      ...client,
      documents: client.documents.filter(doc => doc.id !== docId),
      updatedDate: new Date().toISOString(),
    });
  };

  const getFileIcon = (type: string) => {
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-2">
      {client.documents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {client.documents.map((doc) => (
            <div
              key={doc.id}
              className="group relative inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-300 hover:bg-gray-200"
              title={`${doc.name} - Uploaded by ${doc.uploadedBy.name}`}
            >
              {getFileIcon(doc.type)}
              <span className="max-w-[100px] truncate">{doc.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => window.open(doc.url, '_blank')}
                  className="hover:text-blue-600"
                  title="Download"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="hover:text-red-600"
                  title="Delete"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <label
        className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors cursor-pointer"
        title="Upload documents"
      >
        <Upload className="w-4 h-4" />
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
