import { SalesTeam } from '../types';

export const teamColors: Record<SalesTeam, { bg: string; text: string; border: string }> = {
  Sohaib: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  Sana: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  Sales: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
};
