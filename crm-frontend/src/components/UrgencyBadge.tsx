import React from 'react';
import { UrgencyLevel } from '../types';

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
}

// Using inline styles to guarantee colors are never purged by Tailwind
const urgencyConfig: Record<UrgencyLevel, { label: string; description: string; bg: string; text: string; border: string }> = {
  'immediate': {
    label: 'Immediate',
    description: '1-2 days',
    bg: '#fee2e2',
    text: '#991b1b',
    border: '#fecaca',
  },
  'short-term': {
    label: 'Short Term',
    description: 'Within 4 weeks',
    bg: '#e0e7ff',
    text: '#3730a3',
    border: '#c7d2fe',
  },
  'long-term': {
    label: 'Long Term',
    description: 'Over 4 weeks',
    bg: '#d1fae5',
    text: '#065f46',
    border: '#a7f3d0',
  },
};

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency] ?? urgencyConfig['short-term'];

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
        borderWidth: 1,
        borderStyle: 'solid',
      }}
      className="inline-flex items-center justify-center text-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      title={config.description}
    >
      {config.label}
    </span>
  );
}
