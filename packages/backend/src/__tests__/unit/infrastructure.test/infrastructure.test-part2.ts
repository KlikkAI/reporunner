expect(updatedComment?.editHistory[0].previousContent).toBe('Original content');
})

it('should handle comment reactions', async () =>
{
  const testWorkflowId = '507f1f77bcf86cd799439011';

  // Create a comment
  const comment = await Comment.create({
    workflowId: testWorkflowId,
    authorId: testUser._id,
    content: 'Comment with reactions',
    status: 'open',
  });

  // Add reactions
  comment.reactions.push({
    userId: testUser._id.toString(),
    type: '👍',
    timestamp: new Date(),
  });

  comment.reactions.push({
    userId: 'another-user-id',
    type: '❤️',
    timestamp: new Date(),
  });

  await comment.save();

  // Verify reactions
  const commentWithReactions = await Comment.findById(comment._id);
  expect(commentWithReactions?.reactions).toHaveLength(2);
  expect(commentWithReactions?.reactions[0].type).toBe('👍');
  expect(commentWithReactions?.reactions[1].type).toBe('❤️');
}
)

it('should handle comment threads (replies)', async () =>
{
  const testWorkflowId = '507f1f77bcf86cd799439011';

  // Create a comment
  const comment = await Comment.create({
    workflowId: testWorkflowId,
    authorId: testUser._id,
    content: 'Parent comment',
    status: 'open',
  });

  // Add replies to thread
  comment.thread.push({
    authorId: testUser._id.toString(),
    content: 'First reply',
    timestamp: new Date(),
  });

  comment.thread.push({
    authorId: 'another-user-id',
    content: 'Second reply',
    timestamp: new Date(),
  });

  await comment.save();

  // Verify thread
  const commentWithThread = await Comment.findById(comment._id);
  expect(commentWithThread?.thread).toHaveLength(2);
  expect(commentWithThread?.thread[0].content).toBe('First reply');
  expect(commentWithThread?.thread[1].content).toBe('Second reply');
}
)
})

describe('Test Utilities', () =>
{
    it('should create test users successfully', async () => {
      const user1 = await testUtils.createTestUser({
        email: 'user1@test.com',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await testUtils.createTestUser({
        email: 'user2@test.com',
        firstName: 'User',
        lastName: 'Two',
      });

      expect(user1.email).toBe('user1@test.com');
      expect(user1.firstName).toBe('User');
      expect(user1.lastName).toBe('One');

      expect(user2.email).toBe('user2@test.com');
      expect(user2.firstName).toBe('User');
      expect(user2.lastName).toBe('Two');

      // Verify users are different
      expect(user1._id.toString()).not.toBe(user2._id.toString());
    });

    it('should generate JWT tokens', async () => {
      const token = await testUtils.generateTestToken(testUser._id.toString());

      expect(token).toBeTruthy();
