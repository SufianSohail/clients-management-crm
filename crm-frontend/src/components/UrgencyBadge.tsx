import React from 'react';
import { UrgencyLevel } from '../types';

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
}

const urgencyConfig = {
  'immediate': {
    label: 'Immediate',
    description: '1-2 days',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  'short-term': {
    label: 'Short Term',
    description: 'Within 4 weeks',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  'long-term': {
    label: 'Long Term',
    description: 'Over 4 weeks',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
};

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency];
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      title={config.description}
    >
      {config.label}
    </span>
  );
}
