import React from 'react';
import { useState } from 'react';
import { Client, Comment } from '../types';
import { X, Send } from 'lucide-react';
import { mockUsers } from '../data/mockData';
import { formatDate, formatDistanceToNow } from '../utils/dateUtils';

interface CommentsModalProps {
  client: Client;
  onClose: () => void;
  onUpdate: (client: Client) => void;
}

export function CommentsModal({ client, onClose, onUpdate }: CommentsModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock current user (in real app, this would come from auth context)
  const currentUser = mockUsers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      commentedBy: currentUser,
      commentDate: new Date().toISOString(),
    };

    onUpdate({
      ...client,
      comments: [...client.comments, comment],
      updatedDate: new Date().toISOString(),
    });

    setNewComment('');
    setIsSubmitting(false);

    // Mock notification if tagging sales person
    if (client.assignedSalesPerson && newComment.includes('@')) {
      console.log(`📧 Email sent to ${client.assignedSalesPerson.email}: You were mentioned in a comment on ${client.companyName}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
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

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {client.comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to add one!
            </div>
          ) : (
            client.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {comment.commentedBy.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900">{comment.commentedBy.name}</span>
                    <span className="text-xs text-gray-500">{formatDistanceToNow(comment.commentDate)}</span>
                    <span className="text-xs text-gray-400">{formatDate(comment.commentDate)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-3">
            {currentUser && (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div className="flex-1 flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}