import React from "react"; // Add this at the top

import { useState } from 'react';
import { Client } from '../types';
import { MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { UrgencyBadge } from './UrgencyBadge';
import { FeaturesCell } from './FeaturesCell';
import { DocumentsCell } from './DocumentsCell';
import { CommentsModal } from './CommentsModal';
import { formatDistanceToNow } from '../utils/dateUtils';
import { teamColors } from '../utils/teamColors';

interface ClientRowProps {
  client: Client;
  onEdit: (client: Client) => void;
  onUpdate: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientRow({ client, onEdit, onUpdate, onDelete }: ClientRowProps) {
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const lastComment = client.comments[client.comments.length - 1];
  const teamColor = teamColors[client.salesTeam];

  const formatContractPeriod = () => {
    if (!client.contractStartDate || !client.contractEndDate) return 'N/A';
    
    const start = new Date(client.contractStartDate);
    const end = new Date(client.contractEndDate);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors group">
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${teamColor.bg} ${teamColor.text} ${teamColor.border}`}>
            {client.salesTeam}
          </span>
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{client.companyName}</span>
              <button
                onClick={() => onEdit(client)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                title="Edit client"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDelete(client)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                title="Delete client"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-gray-900">{client.contactName}</span>
        </td>
        <td className="px-6 py-4">
          <FeaturesCell client={client} onUpdate={onUpdate} />
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {client.upsellOpportunities.length > 0 ? (
              client.upsellOpportunities.map((u, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-200"
                >
                  {u}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">No upsell opportunities</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <UrgencyBadge urgency={client.urgency} />
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-700">
            {formatContractPeriod()}
          </div>
        </td>
        <td className="px-6 py-4">
          {client.assignedSalesPerson ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {client.assignedSalesPerson.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-sm text-gray-900">{client.assignedSalesPerson.name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">No sales assigned</span>
          )}
        </td>
        <td className="px-6 py-4">
          <DocumentsCell client={client} onUpdate={onUpdate} />
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => setIsCommentsModalOpen(true)}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {lastComment ? (
              <div className="text-left">
                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                  {lastComment.text}
                </div>
                <div className="text-xs text-gray-400">
                  {lastComment.commentedBy.name} · {formatDistanceToNow(lastComment.commentDate)}
                </div>
              </div>
            ) : (
              <span>Add comment</span>
            )}
          </button>
        </td>
      </tr>

      {isCommentsModalOpen && (
        <CommentsModal
          client={client}
          onClose={() => setIsCommentsModalOpen(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}