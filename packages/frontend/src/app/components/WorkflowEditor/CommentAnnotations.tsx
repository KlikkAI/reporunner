/**
 * Comment Annotations
 *
 * Visual comment pins and thread overlays for workflow canvas,
 * providing contextual commenting system similar to Figma's comments.
 */

import { CheckOutlined, CommentOutlined, SendOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Input, Popover } from 'antd';
import type React from 'react';
import { useCallback, useState } from 'react';
import type { CollaborationComment } from '../../../core/services/collaborationService';
import { useCollaborationStore } from '../../../core/stores/collaborationStore';
import { useLeanWorkflowStore } from '../../../core/stores/leanWorkflowStore';

const { TextArea } = Input;

interface CommentAnnotationsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  transform: {
    x: number;
    y: number;
    zoom: number;
  };
  onCommentClick?: (position: { x: number; y: number }) => void;
}

interface CommentPinProps {
  comment: CollaborationComment;
  screenPosition: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
  onResolve: () => void;
}

export const CommentAnnotations: React.FC<CommentAnnotationsProps> = ({
  containerRef,
  transform,
  onCommentClick,
}) => {
  const {
    activeComments,
    selectedCommentId,
    currentUser,
    showComments,
    commentMode,
    selectComment,
    resolveComment,
    addComment,
    replyToComment,
  } = useCollaborationStore();
  const { currentWorkflow } = useLeanWorkflowStore();

  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [newCommentContent, setNewCommentContent] = useState('');
  const [pendingCommentPosition, setPendingCommentPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Convert workflow coordinates to screen coordinates
  const workflowToScreen = useCallback(
    (x: number, y: number) => ({
      x: (x + transform.x) * transform.zoom,
      y: (y + transform.y) * transform.zoom,
    }),
    [transform]
  );

  // Convert screen coordinates to workflow coordinates
  const screenToWorkflow = useCallback(
    (x: number, y: number) => ({
      x: x / transform.zoom - transform.x,
      y: y / transform.zoom - transform.y,
    }),
    [transform]
  );

  // Generate user colors
  const getUserColor = useCallback((userId: string): string => {
    const colors = [
      '#1890ff',
      '#52c41a',
      '#faad14',
      '#f5222d',
      '#722ed1',
      '#13c2c2',
      '#eb2f96',
      '#fa541c',
      '#2f54eb',
      '#a0d911',
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Handle canvas click for new comments
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      if (!(commentMode && containerRef.current)) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const workflowPos = screenToWorkflow(x, y);
      setPendingCommentPosition(workflowPos);
      onCommentClick?.(workflowPos);
    },
    [commentMode, containerRef, screenToWorkflow, onCommentClick]
  );

  // Handle adding new comment
  const handleAddComment = useCallback(async () => {
    if (!(newCommentContent.trim() && pendingCommentPosition)) {
      return;
    }

    try {
      await addComment({
        workflowId: currentWorkflow?.id || '',
        content: newCommentContent,
        position: pendingCommentPosition,
        resolved: false,
        mentions: [], // TODO: Parse mentions from content
      });

      setNewCommentContent('');
      setPendingCommentPosition(null);
    } catch (_error) {}
  }, [newCommentContent, pendingCommentPosition, addComment, currentWorkflow?.id]);

  // Handle replying to comment
  const handleReplyToComment = useCallback(
    async (commentId: string) => {
      const content = replyContents[commentId];
      if (!content?.trim()) {
        return;
      }

      try {
        await replyToComment(commentId, content);
        setReplyContents({ ...replyContents, [commentId]: '' });
      } catch (_error) {}
    },
    [replyContents, replyToComment]
  );

  // Comment Pin Component
  const CommentPin: React.FC<CommentPinProps> = ({
    comment,
    screenPosition,
    isSelected,
    onClick,
    onResolve,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const userColor = getUserColor(comment.author.id);

    const commentThread = (
      <Card size="small" className="w-80 max-h-96 overflow-auto" bodyStyle={{ padding: 12 }}>
        <div className="space-y-3">
          {/* Comment header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Avatar size={24} src={comment.author.avatar} style={{ backgroundColor: userColor }}>
                {comment.author.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {comment.author.name}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(comment.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
              }}
              className="text-green-600 hover:bg-green-50"
            >
              Resolve
            </Button>
          </div>

          {/* Comment content */}
          <div className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</div>

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Avatar
                      size={16}
                      src={reply.author.avatar}
                      style={{ backgroundColor: getUserColor(reply.author.id) }}
                    >
                      {reply.author.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <span className="font-medium text-xs text-gray-900 dark:text-gray-100">
                      {reply.author.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(reply.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 pl-6">
                    {reply.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply input */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <Input
                size="small"
                placeholder="Reply..."
                value={replyContents[comment.id] || ''}
                onChange={(e) =>
                  setReplyContents({
                    ...replyContents,
                    [comment.id]: e.target.value,
                  })
                }
                onPressEnter={() => handleReplyToComment(comment.id)}
              />
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleReplyToComment(comment.id)}
                disabled={!replyContents[comment.id]?.trim()}
              />
            </div>
          </div>
        </div>
      </Card>
    );

    return (
      <Popover
        content={commentThread}
        title={null}
        trigger="click"
        placement="topLeft"
        overlayClassName="comment-thread-popover"
      >
        <div
          className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-40 ${
            isSelected ? 'scale-110' : 'scale-100'
          }`}
          style={{
            left: screenPosition.x,
            top: screenPosition.y,
          }}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Comment pin */}
          <div
            className={`relative w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
              isSelected || isHovered ? 'transform scale-110' : ''
            }`}
            style={{
              backgroundColor: userColor,
              boxShadow: isSelected ? `0 0 0 3px ${userColor}40` : '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <CommentOutlined className="text-white text-sm" />

            {/* Unread replies indicator */}
            {comment.replies.length > 0 && (
              <Badge
                count={comment.replies.length}
                size="small"
                className="absolute -top-1 -right-1"
              />
            )}
          </div>

          {/* Connection line to author avatar */}
          {(isSelected || isHovered) && (
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
              <div className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-1">
                  <Avatar
                    size={16}
                    src={comment.author.avatar}
                    style={{ backgroundColor: userColor }}
                  >
                    {comment.author.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {comment.author.name}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Popover>
    );
  };

  // Pending comment input
  const PendingCommentInput: React.FC<{ position: { x: number; y: number } }> = ({ position }) => {
    const screenPos = workflowToScreen(position.x, position.y);

    return (
      <div
        className="absolute z-50"
        style={{
          left: screenPos.x + 20,
          top: screenPos.y,
        }}
      >
        <Card size="small" className="w-80 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Avatar
                size={24}
                src={currentUser?.avatar}
                style={{
                  backgroundColor: currentUser ? getUserColor(currentUser.id) : '#ccc',
                }}
              >
                {currentUser?.name.charAt(0).toUpperCase() || '?'}
              </Avatar>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Add a comment
              </span>
            </div>

            <TextArea
              rows={3}
              placeholder="What do you think about this?"
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end space-x-2">
              <Button
                size="small"
                onClick={() => {
                  setPendingCommentPosition(null);
                  setNewCommentContent('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={handleAddComment}
                disabled={!newCommentContent.trim()}
              >
                Post
              </Button>
            </div>
          </div>
        </Card>

        {/* Pin indicator */}
        <div
          className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          style={{
            left: -20,
            top: 20,
            backgroundColor: currentUser ? getUserColor(currentUser.id) : '#ccc',
          }}
        >
          <CommentOutlined className="text-white text-xs" />
        </div>
      </div>
    );
  };

  if (!(showComments && containerRef.current)) {
    return null;
  }

  return (
    <>
      {/* Canvas click handler for comment mode */}
      {commentMode && (
        <div
          className="absolute inset-0 z-30 cursor-crosshair"
          onClick={handleCanvasClick}
          style={{
            background: commentMode
              ? 'linear-gradient(45deg, transparent 40%, rgba(24, 144, 255, 0.1) 50%, transparent 60%)'
              : 'transparent',
          }}
        />
      )}

      {/* Existing comments */}
      {activeComments.map((comment) => {
        const screenPos = workflowToScreen(comment.position.x, comment.position.y);

        return (
          <CommentPin
            key={comment.id}
            comment={comment}
            screenPosition={screenPos}
            isSelected={selectedCommentId === comment.id}
            onClick={() => selectComment(comment.id)}
            onResolve={() => resolveComment(comment.id)}
          />
        );
      })}

      {/* Pending comment input */}
      {pendingCommentPosition && <PendingCommentInput position={pendingCommentPosition} />}

      {/* Comment mode instructions */}
      {commentMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg shadow-md border border-blue-200 dark:border-blue-700">
            <CommentOutlined className="mr-2" />
            Click anywhere on the canvas to add a comment
          </div>
        </div>
      )}
    </>
  );
};

export default CommentAnnotations;
