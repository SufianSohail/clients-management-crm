import React, { useEffect, useState, useRef } from 'react';
import { Client } from '../types';
import { X, Send, AtSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatDistanceToNow } from '../utils/dateUtils';
import axios from 'axios';

const API_BASE = 'https://localhost:7047';

interface CommentResponse {
  id: string;
  clientId: string;
  text: string;
  commentedByUserId: string;
  commentedByName: string;
  commentDate: string;
}

interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  team: string;
}

interface MentionUser {
  handle: string;
  name: string;
}

interface CommentsModalProps {
  client: Client;
  onClose: () => void;
  onUpdate: (client: Client) => void;
}

export function CommentsModal({ client, onClose, onUpdate }: CommentsModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchComments();
    fetchMentionUsers();
  }, [client.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get<CommentResponse[]>(
        `${API_BASE}/api/comment/client/${client.id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      // Sort ascending for display
      setComments(response.data.slice().reverse());
    } catch (err) {
      setError('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentionUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<ApiUser[]>(`${API_BASE}/api/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const mapped: MentionUser[] = response.data.map(u => ({
        handle: `@${u.fullName.split(' ')[0].toLowerCase()}`,
        name: u.fullName,
      }));
      setMentionUsers(mapped);
    } catch {
      // fallback - no mentions dropdown
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);

    // Detect @ mention
    const lastAtIndex = val.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === val.length - 1) {
      setShowMentions(true);
      setMentionSearch('');
    } else if (lastAtIndex !== -1 && val.substring(lastAtIndex).match(/^@\w*$/)) {
      setShowMentions(true);
      setMentionSearch(val.substring(lastAtIndex + 1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (handle: string) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    if (lastAtIndex === -1) return;

    const before = newComment.substring(0, lastAtIndex);
    const after = newComment.substring(lastAtIndex).replace(/^@\w*/, '');
    const newText = before + handle + ' ' + after;

    setNewComment(newText);
    setShowMentions(false);

    // Explicitly set cursor position after the newly inserted handle and space
    setTimeout(() => {
      const textarea = document.getElementById('comment-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const cursorPosition = before.length + handle.length + 1;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const filteredMentions = mentionUsers.filter((u) =>
    u.name.toLowerCase().includes(mentionSearch) || u.handle.includes(mentionSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post<CommentResponse>(
        `${API_BASE}/api/comment/client/${client.id}`,
        { text: newComment.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setComments((prev) => [...prev, response.data]);
      setNewComment('');
      setShowMentions(false);
    } catch (err) {
      setError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const getTeamColor = (userId: string) => {
    // Simple color cycling based on userId
    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-orange-600', 'bg-pink-600'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash += userId.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
            <p className="text-sm text-gray-600">{client.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading comments...</div>
          ) : error && comments.length === 0 ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to add one!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${getTeamColor(comment.commentedByUserId)}`}>
                  {initials(comment.commentedByName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{comment.commentedByName}</span>
                    <span className="text-xs text-gray-500">{formatDistanceToNow(comment.commentDate)}</span>
                    <span className="text-xs text-gray-400">{formatDate(comment.commentDate)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          {error && comments.length > 0 && (
            <p className="text-sm text-red-500 mb-2">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-3">
            {currentUser && (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${getTeamColor(currentUser.id)}`}>
                {initials(currentUser.name)}
              </div>
            )}
            <div className="flex-1 relative">
              {showMentions && filteredMentions.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                  {filteredMentions.map((u) => (
                    <button
                      key={u.handle}
                      type="button"
                      onClick={() => insertMention(u.handle)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <AtSign className="w-3 h-3 text-blue-500" />
                      <span className="font-medium">{u.name}</span>
                      <span className="text-gray-400 text-xs">{u.handle}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={newComment}
                onChange={handleTextChange}
                placeholder="Add a comment... Use @ to tag someone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                  if (e.key === 'Escape') setShowMentions(false);
                }}
              />
              <p className="text-xs text-gray-400 mt-0.5">Press Enter to send, Shift+Enter for new line</p>
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 self-start"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}