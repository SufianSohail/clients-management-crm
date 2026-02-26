import React from 'react';
import { useState, useRef } from 'react';
import { Client } from '../types';
import { Plus, X } from 'lucide-react';

interface FeaturesCellProps {
  client: Client;
  onUpdate: (client: Client) => void;
}

export function FeaturesCell({ client, onUpdate }: FeaturesCellProps) {
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddFeature = () => {
    if (inputValue.trim()) {
      onUpdate({
        ...client,
        featuresGiven: [...client.featuresGiven, inputValue.trim()],
        updatedDate: new Date().toISOString(),
      });
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    } else if (e.key === 'Backspace' && inputValue === '' && client.featuresGiven.length > 0) {
      // Remove last feature on backspace if input is empty
      onUpdate({
        ...client,
        featuresGiven: client.featuresGiven.slice(0, -1),
        updatedDate: new Date().toISOString(),
      });
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setInputValue('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    onUpdate({
      ...client,
      featuresGiven: client.featuresGiven.filter((_, i) => i !== index),
      updatedDate: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {client.featuresGiven.map((feature, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200 group"
        >
          {feature}
          <button
            onClick={() => handleRemoveFeature(index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-900"
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
            handleAddFeature();
            setIsAdding(false);
          }}
          placeholder="Type and press Enter"
          className="px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
          autoFocus
        />
      ) : (
        <button
          onClick={() => {
            setIsAdding(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
          title="Add feature"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
