import React, { useState, useRef, useEffect } from 'react';
import { Client, SalesTeam } from '../types';
import { Edit2, Trash2, ChevronDown, Clock, MessageSquarePlus, AtSign, Send, X } from 'lucide-react';
import { UrgencyBadge } from './UrgencyBadge';
import { FeaturesCell } from './FeaturesCell';
import { UpsellCell } from './UpsellCell';
import { DocumentsCell } from './DocumentsCell';
import { CommentsModal } from './CommentsModal';
import { formatDate, formatDateOnly } from '../utils/dateUtils';
import { teamColors } from '../utils/teamColors';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_BASE = 'https://localhost:7047';
const TEAMS: SalesTeam[] = ['Sohaib', 'Sana', 'Sales'];

interface CommentPreview {
  id: string;
  text: string;
  commentedByName: string;
  commentDate: string;
}

interface MentionUser {
  handle: string;
  name: string;
}

interface ClientRowProps {
  client: Client;
  onEdit: (client: Client) => void;
  onUpdate: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function formatCommentText(text: string): React.ReactNode {
  // Highlight @mentions in bold
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+/.test(part)
      ? <strong key={i} className="font-semibold text-blue-700">{part}</strong>
      : <span key={i}>{part}</span>
  );
}

function formatCommentDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ClientRow({ client, onEdit, onUpdate, onDelete }: ClientRowProps) {
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isTeamEditing, setIsTeamEditing] = useState(false);
  const [latestComment, setLatestComment] = useState<CommentPreview | null>(null);

  // Inline comment state
  const [inlineComment, setInlineComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showInlineInput, setShowInlineInput] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);

  const inlineInputRef = useRef<HTMLTextAreaElement>(null);
  const { currentUser } = useAuth();
  const teamColor = teamColors[client.salesTeam] || teamColors['Sales'];

  useEffect(() => {
    fetchLatestComment();
    fetchMentionUsers();
  }, [client.id]);

  const fetchLatestComment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<CommentPreview[]>(
        `${API_BASE}/api/comment/client/${client.id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (response.data.length > 0) {
        const sorted = [...response.data].sort(
          (a, b) => new Date(b.commentDate).getTime() - new Date(a.commentDate).getTime()
        );
        setLatestComment(sorted[0]);
      }
    } catch { /* ignore */ }
  };

  const fetchMentionUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<{ id: string; fullName: string }[]>(`${API_BASE}/api/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMentionUsers(
        res.data.map(u => ({ handle: `@${u.fullName.split(' ')[0].toLowerCase()}`, name: u.fullName }))
      );
    } catch { /* ignore */ }
  };

  const handleTeamChange = async (newTeam: SalesTeam) => {
    setIsTeamEditing(false);
    try {
      const token = localStorage.getItem('token');
      const urgencyMap: Record<string, string> = { immediate: 'High', 'short-term': 'Medium', 'long-term': 'Low' };
      await axios.put(`${API_BASE}/api/client/${client.id}`, {
        companyName: client.companyName, contactName: client.contactName,
        phoneNumber: client.phone, email: client.email,
        featuresGiven: client.featuresGiven, upsellOpportunities: client.upsellOpportunities,
        urgency: urgencyMap[client.urgency] ?? 'Medium',
        contractStartDate: client.contractStartDate || new Date().toISOString(),
        contractEndDate: client.contractEndDate || new Date().toISOString(),
        assignedSalesPersonId: client.assignedSalesPerson?.id ?? '',
        assignedTeamOverride: newTeam,
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      onUpdate({ ...client, salesTeam: newTeam });
    } catch { alert('Failed to update team.'); }
  };

  const handleInlineTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInlineComment(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && /^@\w*$/.test(val.substring(lastAt))) {
      setShowMentions(true);
      setMentionSearch(val.substring(lastAt + 1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (handle: string) => {
    const lastAt = inlineComment.lastIndexOf('@');
    if (lastAt === -1) return;

    const before = inlineComment.substring(0, lastAt);
    const after = inlineComment.substring(lastAt).replace(/^@\w*/, '');
    const newText = before + handle + ' ' + after;

    setInlineComment(newText);
    setShowMentions(false);

    // Explicitly set cursor position
    setTimeout(() => {
      if (inlineInputRef.current) {
        inlineInputRef.current.focus();
        const cursorPosition = before.length + handle.length + 1;
        inlineInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const handlePostInlineComment = async () => {
    if (!inlineComment.trim() || !currentUser) return;
    setIsPostingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post<CommentPreview>(
        `${API_BASE}/api/comment/client/${client.id}`,
        { text: inlineComment.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setLatestComment(response.data);
      setInlineComment('');
      setShowInlineInput(false);
      setShowMentions(false);
    } catch { alert('Failed to post comment.'); }
    finally { setIsPostingComment(false); }
  };

  const filteredMentions = mentionUsers.filter(u =>
    u.name.toLowerCase().includes(mentionSearch) || u.handle.includes(mentionSearch)
  );


  return (
    <>
      <tr className={`hover:bg-gray-50/60 transition-colors group relative ${(isTeamEditing || showMentions) ? 'z-50' : 'z-auto'}`}>
        <td className="px-3 py-2 relative">
          <div>
            <button
              onClick={() => setIsTeamEditing(!isTeamEditing)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${teamColor.bg} ${teamColor.text} ${teamColor.border}`}
              title="Click to change team"
            >
              {client.salesTeam}
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {isTeamEditing && (
              <div className="absolute z-[100] top-12 left-4 bg-white border border-gray-200 rounded-2xl shadow-xl min-w-[120px] overflow-hidden py-1">
                {TEAMS.map(t => {
                  const tc = teamColors[t];
                  return (
                    <button key={t} onClick={() => handleTeamChange(t)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 flex items-center gap-2.5 ${tc.text} transition-colors`}>
                      <span className={`w-2.5 h-2.5 rounded-full border ${tc.bg} ${tc.border}`} />
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </td>

        {/* Company Name */}
        <td className="px-3 py-2 relative group">
          <div className="flex items-center h-full">
            <span className="font-semibold text-gray-900 text-[11px] truncate w-full">{client.companyName}</span>
          </div>
          <div className="absolute bottom-1 left-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button onClick={() => onEdit(client)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Edit">
              <Edit2 className="w-3 h-3 text-gray-500" />
            </button>
            <button onClick={() => onDelete(client)}
              className="p-1 hover:bg-red-100 rounded"
              title="Delete">
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        </td>

        {/* Contact */}
        <td className="px-2 py-1.5 overflow-hidden">
          <span className="text-gray-800 text-[11px] truncate block">{client.contactName}</span>
        </td>

        {/* Features */}
        <td className="px-2 py-1.5"><FeaturesCell client={client} onUpdate={onUpdate} /></td>

        {/* Upsell */}
        <td className="px-2 py-1.5"><UpsellCell client={client} onUpdate={onUpdate} /></td>

        {/* Urgency */}
        <td className="px-2 py-1.5"><UrgencyBadge urgency={client.urgency} /></td>

        {/* Contract Start */}
        <td className="px-3 py-2">
          <div className="text-[11px] text-gray-600 whitespace-nowrap">{formatDateOnly(client.contractStartDate)}</div>
        </td>

        {/* Contract End */}
        <td className="px-3 py-2">
          <div className="text-[11px] text-gray-600 whitespace-nowrap">{formatDateOnly(client.contractEndDate)}</div>
        </td>

        {/* Sales Contact */}
        <td className="px-3 py-2">
          {client.assignedSalesPerson ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                {client.assignedSalesPerson.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-[11px] text-gray-800">{client.assignedSalesPerson.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Unassigned</span>
          )}
        </td>

        {/* Documents */}
        <td className="px-3 py-2"><DocumentsCell client={client} onUpdate={onUpdate} /></td>

        {/* Comments — redesigned, compact, no overflow */}
        <td className="px-2 py-1.5" style={{ minWidth: 160, maxWidth: 190 }}>
          <div className="flex flex-col gap-1.5">

            {/* Latest comment preview */}
            {latestComment ? (
              <div className="bg-gray-50 border border-gray-200 rounded p-1 text-[9px] leading-tight">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="font-semibold" style={{ color: '#7f1d1d' }}>{latestComment.commentedByName}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-400 text-[8px]">{formatCommentDate(latestComment.commentDate)}</span>
                </div>
                <p className="text-gray-700 line-clamp-1">
                  {formatCommentText(latestComment.text)}
                </p>
              </div>
            ) : (
              <p className="text-[9px] text-gray-400 italic">No comments yet</p>
            )}

            {/* Inline comment input with @ mention */}
            {showInlineInput && (
              <div className="relative mt-1">
                {showMentions && filteredMentions.length > 0 && (
                  <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[160px]">
                    {filteredMentions.map(u => (
                      <button key={u.handle} type="button" onClick={() => insertMention(u.handle)}
                        className="w-full text-left px-2 py-1 hover:bg-gray-50 flex items-center gap-1.5 text-[9px]">
                        <AtSign className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-gray-800">{u.name}</span>
                        <span className="text-gray-400">{u.handle}</span>
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  ref={inlineInputRef}
                  value={inlineComment}
                  onChange={handleInlineTextChange}
                  placeholder="Write a comment… @ to mention"
                  rows={2}
                  className="w-full text-[9px] px-2 py-1 border border-blue-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostInlineComment(); }
                    if (e.key === 'Escape') { setShowInlineInput(false); setShowMentions(false); setInlineComment(''); }
                  }}
                  autoFocus
                />
                <div className="flex gap-1 mt-1 justify-end">
                  <button onClick={() => { setShowInlineInput(false); setInlineComment(''); }}
                    className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md">
                    Cancel
                  </button>
                  <button onClick={handlePostInlineComment}
                    disabled={!inlineComment.trim() || isPostingComment}
                    className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                    <Send className="w-2.5 h-2.5" /> Send
                  </button>
                </div>
              </div>
            )}

            {/* Action row */}
            {!showInlineInput && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInlineInput(true)}
                  className="flex items-center justify-center p-1.5 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  title="Add comment"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsCommentsModalOpen(true)}
                  className="flex items-center justify-center p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  title="View comment history"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>

      {isCommentsModalOpen && (
        <CommentsModal
          client={client}
          onClose={() => { setIsCommentsModalOpen(false); fetchLatestComment(); }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}