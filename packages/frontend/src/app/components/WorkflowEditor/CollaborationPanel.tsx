/**
 * Collaboration Panel
 *
 * Real-time collaboration interface with user presence, comments,
 * conflict resolution, and collaboration settings. Inspired by
 * Figma's collaboration features and Google Docs comments.
 */

import {
  CheckOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Empty,
  Input,
  Modal,
  Radio,
  Switch,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
} from 'antd';
import type React from 'react';
import { useCallback, useState } from 'react';
import type { CollaborationConflict } from '../../../core/services/collaborationService';
import { useCollaborationStore } from '../../../core/stores/collaborationStore';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface CollaborationPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ isVisible, onToggle }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [newCommentPosition, setNewCommentPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<CollaborationConflict | null>(null);

  const {
    isConnected,
    connectionStatus,
    currentUser,
    userPresences,
    activeComments,
    selectedComment: selectedCommentId,
    addComment,
    resolveComment,
    setSelectedComment: selectComment,
  } = useCollaborationStore();

  // activeWorkflow would be used for collaboration features
  // const { activeWorkflow } = useLeanWorkflowStore();

  // Stub values for features not yet implemented
  const operationHistory: any[] = [];
  const activeConflicts: any[] = [];
  const showUserCursors = true;
  const showUserSelections = true;
  const showComments = true;
  const commentMode = false;
  const selectedNodeIds: string[] = [];

  // Stub functions for features not yet implemented
  const replyToComment = (_commentId: string, _content: string) => {};
  const resolveConflict = (_conflictId: string, _resolution: any) => {};
  const toggleCommentMode = () => {};
  const toggleUserCursors = () => {};
  const toggleUserSelections = () => {};
  const toggleComments = () => {};

  // Generate user colors for consistent display
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

  // Handle adding a comment
  const handleAddComment = useCallback(async () => {
    if (!(newCommentContent.trim() && newCommentPosition)) {
      return;
    }

    try {
      await addComment({
        workflowId: currentWorkflow?.id || '',
        content: newCommentContent,
        position: newCommentPosition,
        nodeId: selectedNodeIds.length === 1 ? selectedNodeIds[0] : undefined,
        resolved: false,
        mentions: [], // TODO: Parse mentions from content
      });

      setNewCommentContent('');
      setNewCommentPosition(null);
    } catch (_error) {}
  }, [newCommentContent, newCommentPosition, addComment]);

  // Handle replying to a comment
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
    [replyContents]
  );

  // Handle conflict resolution
  const handleResolveConflict = useCallback(
    async (conflict: CollaborationConflict, resolution: any) => {
      try {
        await resolveConflict(conflict.id, resolution);
        setConflictModalVisible(false);
        setSelectedConflict(null);
      } catch (_error) {}
    },
    []
  );

  // Users Tab
  const UsersTab: React.FC = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Active Users ({userPresences.length + (currentUser ? 1 : 0)})
        </h3>
        <Badge
          status={isConnected ? 'processing' : 'error'}
          text={connectionStatus}
          className="capitalize"
        />
      </div>

      <div className="space-y-2">
        {/* Current user */}
        {currentUser && (
          <Card size="small" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20">
            <div className="flex items-center space-x-3">
              <Avatar
                size={32}
                src={currentUser.avatar}
                style={{ backgroundColor: getUserColor(currentUser.id) }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {currentUser.name} (You)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{currentUser.email}</div>
              </div>
              <Badge status="processing" />
            </div>
          </Card>
        )}

        {/* Other users */}
        {userPresences.map((presence) => (
          <Card key={presence.userId} size="small">
            <div className="flex items-center space-x-3">
              <Avatar
                size={32}
                src={presence.user.avatar}
                style={{ backgroundColor: getUserColor(presence.userId) }}
              >
                {presence.user.name.charAt(0).toUpperCase()}
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {presence.user.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {presence.user.email}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge
                  status={presence.status === 'active' ? 'success' : 'default'}
                  text={presence.status}
                />
                {presence.cursor && (
                  <div className="text-xs text-gray-500 mt-1">
                    Cursor: {Math.round(presence.cursor.x)}, {Math.round(presence.cursor.y)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {userPresences.length === 0 && !currentUser && (
        <Empty description="No active users" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      <Divider />

      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">Presence Settings</h4>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show User Cursors</span>
          <Switch size="small" checked={showUserCursors} onChange={toggleUserCursors} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show User Selections</span>
          <Switch size="small" checked={showUserSelections} onChange={toggleUserSelections} />
        </div>
      </div>
    </div>
  );

  // Comments Tab
  const CommentsTab: React.FC = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Comments ({activeComments.length})
        </h3>
        <div className="flex space-x-2">
          <Button
            size="small"
            type={commentMode ? 'primary' : 'default'}
            icon={<CommentOutlined />}
            onClick={toggleCommentMode}
          >
            {commentMode ? 'Cancel' : 'Add Comment'}
          </Button>
          <Switch
            size="small"
            checked={showComments}
            onChange={toggleComments}
            checkedChildren="Show"
            unCheckedChildren="Hide"
          />
        </div>
      </div>

      {commentMode && (
        <Card size="small" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20">
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Click on the canvas to place a comment, or add a general comment below.
            </div>
            <TextArea
              rows={3}
              placeholder="Add your comment..."
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button
                size="small"
                onClick={() => setNewCommentPosition({ x: 100, y: 100 })}
                disabled={!newCommentContent.trim()}
              >
                Add General Comment
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                onClick={handleAddComment}
                disabled={!(newCommentContent.trim() && newCommentPosition)}
              >
                Post Comment
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {activeComments.length === 0 ? (
          <Empty description="No active comments" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          activeComments.map((comment) => (
            <Card
              key={comment.id}
              size="small"
              className={selectedCommentId === comment.id ? 'border-blue-500 shadow-md' : ''}
              onClick={() => selectComment(comment.id)}
            >
              <div className="space-y-2">
                {/* Comment header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar
                      size={24}
                      src={comment.user.avatar}
                      style={{ backgroundColor: getUserColor(comment.user.id) }}
                    >
                      {comment.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {comment.user.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(comment.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {comment.nodeId && <Tag color="blue">Node Comment</Tag>}
                    <Tooltip title="Resolve Comment">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveComment(comment.id);
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* Comment content */}
                <div className="text-sm text-gray-700 dark:text-gray-300 ml-8">
                  {comment.content}
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex space-x-2">
                        <Avatar
                          size={20}
                          src={reply.user.avatar}
                          style={{ backgroundColor: getUserColor(reply.user.id) }}
                        >
                          {reply.user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-xs text-gray-900 dark:text-gray-100">
                              {reply.user.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {reply.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                <div className="ml-8 pt-2 border-t border-gray-200 dark:border-gray-700">
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
                      type="text"
                      size="small"
                      icon={<SendOutlined />}
                      onClick={() => handleReplyToComment(comment.id)}
                      disabled={!replyContents[comment.id]?.trim()}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  // Conflicts Tab
  const ConflictsTab: React.FC = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Conflicts ({activeConflicts.length})
        </h3>
        {activeConflicts.length > 0 && <Badge count={activeConflicts.length} status="error" />}
      </div>

      {activeConflicts.length === 0 ? (
        <div className="text-center py-8">
          <CheckOutlined className="text-4xl text-green-500 mb-2" />
          <div className="text-gray-600 dark:text-gray-400">No conflicts detected</div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeConflicts.map((conflict) => (
            <Card
              key={conflict.id}
              size="small"
              className="border-red-200 bg-red-50 dark:bg-red-900/20"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <ExclamationCircleOutlined className="text-red-500" />
                      <span className="font-medium text-red-700 dark:text-red-300">
                        {conflict.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Affected nodes: {conflict.affectedNodes.join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(conflict.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="small"
                    type="primary"
                    danger
                    onClick={() => {
                      setSelectedConflict(conflict);
                      setConflictModalVisible(true);
                    }}
                  >
                    Resolve
                  </Button>
                </div>

                <div className="pl-6">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {conflict.operations.length} conflicting operations
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Activity Tab
  const ActivityTab: React.FC = () => (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>

      <Timeline className="mt-4">
        {operationHistory
          .slice(-10)
          .reverse()
          .map((operation) => (
            <Timeline.Item
              key={operation.id}
              dot={
                <Avatar size={20} style={{ backgroundColor: getUserColor(operation.userId) }}>
                  {operation.userId.charAt(0).toUpperCase()}
                </Avatar>
              }
            >
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {operation.type.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(operation.timestamp).toLocaleString()}
                </div>
                {operation.data?.nodeId && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Node: {operation.data.nodeId}
                  </div>
                )}
              </div>
            </Timeline.Item>
          ))}
      </Timeline>

      {operationHistory.length === 0 && (
        <Empty description="No recent activity" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );

  return (
    <>
      <Drawer
        title="Collaboration"
        placement="right"
        onClose={onToggle}
        open={isVisible}
        width={400}
        className="collaboration-drawer"
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="h-full">
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Users
              </span>
            }
            key="users"
          >
            <UsersTab />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CommentOutlined />
                Comments
                {activeComments.length > 0 && (
                  <Badge count={activeComments.length} size="small" style={{ marginLeft: 4 }} />
                )}
              </span>
            }
            key="comments"
          >
            <CommentsTab />
          </TabPane>

          <TabPane
            tab={
              <span>
                <WarningOutlined />
                Conflicts
                {activeConflicts.length > 0 && (
                  <Badge
                    count={activeConflicts.length}
                    size="small"
                    status="error"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </span>
            }
            key="conflicts"
          >
            <ConflictsTab />
          </TabPane>

          <TabPane
            tab={
              <span>
                <ClockCircleOutlined />
                Activity
              </span>
            }
            key="activity"
          >
            <ActivityTab />
          </TabPane>
        </Tabs>
      </Drawer>

      {/* Conflict Resolution Modal */}
      <Modal
        title="Resolve Conflict"
        open={conflictModalVisible}
        onCancel={() => {
          setConflictModalVisible(false);
          setSelectedConflict(null);
        }}
        footer={null}
        width={600}
      >
        {selectedConflict && (
          <div className="space-y-4">
            <Alert
              type="warning"
              message={`${selectedConflict.type.replace('_', ' ')} Conflict`}
              description={`This conflict involves ${selectedConflict.operations.length} operations affecting ${selectedConflict.affectedNodes.length} nodes.`}
            />

            <div className="space-y-3">
              <h4 className="font-medium">Choose Resolution Strategy:</h4>

              <Radio.Group className="w-full" size="small">
                <div className="space-y-2">
                  <Radio value="last_write_wins">
                    <div>
                      <div className="font-medium">Last Write Wins</div>
                      <div className="text-sm text-gray-600">
                        Keep the most recent changes and discard older ones
                      </div>
                    </div>
                  </Radio>
                  <Radio value="merge">
                    <div>
                      <div className="font-medium">Smart Merge</div>
                      <div className="text-sm text-gray-600">
                        Attempt to automatically merge compatible changes
                      </div>
                    </div>
                  </Radio>
                  <Radio value="manual">
                    <div>
                      <div className="font-medium">Manual Resolution</div>
                      <div className="text-sm text-gray-600">
                        Review each change individually and decide
                      </div>
                    </div>
                  </Radio>
                </div>
              </Radio.Group>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button onClick={() => setConflictModalVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                onClick={() =>
                  handleResolveConflict(selectedConflict, {
                    strategy: 'last_write_wins',
                  })
                }
              >
                Resolve Conflict
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CollaborationPanel;
