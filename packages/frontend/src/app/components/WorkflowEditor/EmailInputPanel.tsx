import { useState } from './hooks/useState';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Clock, Mail, Paperclip, Search, Star } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

interface EmailInputPanelProps {
  emails?: any[];
  selectedEmailId?: string;
  onEmailSelect: (email: any) => void;
  isVisible?: boolean;
}

const EmailInputPanel: React.FC<EmailInputPanelProps> = ({
  emails = [],
  selectedEmailId,
  onEmailSelect,
  isVisible = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter emails based on search term
  const filteredEmails = emails.filter((email) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(searchLower) ||
      email.from?.toLowerCase().includes(searchLower) ||
      email.snippet?.toLowerCase().includes(searchLower)
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) {
        return 'Just now';
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return dateString;
    }
  };

  // Extract sender name from email
  const getSenderName = (from: string) => {
    if (!from) return 'Unknown';

    // Handle "Name <email@domain.com>" format
    const match = from.match(/^(.+?)\s*<(.+)>$/);
    if (match) {
      return match[1].trim();
    }

    // Handle plain email format
    if (from.includes('@')) {
      return from.split('@')[0];
    }

    return from;
  };

  // Get sender avatar color based on email
  const getAvatarColor = (from: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const hash = from.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-600 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-100 flex items-center">
            <span className="mr-2">📥</span>
            INPUT
            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
              {filteredEmails.length} emails
            </span>
          </h3>
        </div>

        {/* Search */}
        {emails.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search emails..."
              className="w-full pl-10 pr-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-gray-700"
            />
          </div>
        )}
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {emails.length === 0 ? (
          <div className="text-center text-gray-300 py-12 text-sm">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <p className="mb-2">No emails loaded</p>
            <p className="text-gray-400">Test the Gmail trigger to see emails</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center text-gray-300 py-12 text-sm">
            <p>No emails match your search</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredEmails.map((email, index) => {
              const isSelected = selectedEmailId === email.id;
              const senderName = getSenderName(email.from);
              const avatarColor = getAvatarColor(email.from);

              return (
                <div
                  key={email.id || index}
                  onClick={() => onEmailSelect(email)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-100'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0 text-white text-sm font-medium`}
                    >
                      {senderName.charAt(0).toUpperCase()}
                    </div>

                    {/* Email Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span
                            className={`font-medium text-sm truncate ${
                              isSelected ? 'text-white' : 'text-gray-200'
                            }`}
                          >
                            {senderName}
                          </span>

                          {/* Indicators */}
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {email.hasAttachments && (
                              <Paperclip className="w-3 h-3 text-gray-400" />
                            )}
                            {email.isUnread && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            )}
                            {email.labels?.includes('STARRED') && (
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span
                            className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}
                          >
                            {formatDate(email.date)}
                          </span>
                        </div>
                      </div>

                      {/* Subject */}
                      <div
                        className={`text-sm font-medium mb-1 truncate ${
                          isSelected ? 'text-white' : 'text-gray-100'
                        }`}
                      >
                        {email.subject || '(No subject)'}
                      </div>

                      {/* Snippet */}
                      <div
                        className={`text-xs leading-relaxed line-clamp-2 ${
                          isSelected ? 'text-blue-100' : 'text-gray-400'
                        }`}
                      >
                        {email.snippet || email.body || 'No content preview available'}
                      </div>

                      {/* Labels */}
                      {email.labels && email.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {email.labels.slice(0, 3).map((label: string) => (
                            <span
                              key={label}
                              className={`px-2 py-1 text-xs rounded-full ${
                                isSelected
                                  ? 'bg-blue-700 text-blue-100'
                                  : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              {label}
                            </span>
                          ))}
                          {email.labels.length > 3 && (
                            <span
                              className={`text-xs ${
                                isSelected ? 'text-blue-200' : 'text-gray-400'
                              }`}
                            >
                              +{email.labels.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailInputPanel;
