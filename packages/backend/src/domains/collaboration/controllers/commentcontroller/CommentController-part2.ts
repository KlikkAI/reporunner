} = req.body

if (!workflowId || !content) {
  res.status(400).json(ApiResponse.error('Workflow ID and content are required'));
  return;
}

// Get user from request (assuming auth middleware sets req.user)
const authorId = (req as any).user?.id;
if (!authorId) {
  res.status(401).json(ApiResponse.error('Authentication required'));
  return;
}

try {
  const comment = new Comment({
    workflowId,
    authorId,
    parentCommentId,
    content,
    mentions,
    attachments,
    position,
    visibility,
    priority,
    tags,
    status: 'open',
  });

  await comment.save();
  await comment.populate('authorId', 'name email avatar');

  res.status(201).json(
    ApiResponse.success({
      comment: comment.toObject(),
      message: 'Comment created successfully',
    })
  );
} catch (error) {
  console.error('Error creating comment:', error);
  res.status(500).json(ApiResponse.error('Failed to create comment'));
}
})

/**
 * Update comment
 * PATCH /collaboration/comments/:commentId
 */
public
updateComment = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
  const { commentId } = req.params;
  const { content, visibility, priority, tags, status } = req.body;

  if (!commentId) {
    res.status(400).json(ApiResponse.error('Comment ID is required'));
    return;
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404).json(ApiResponse.error('Comment not found'));
    return;
  }

  // Check if user is author or has permission to edit
  const userId = (req as any).user?.id;
  if (comment.authorId !== userId) {
    res.status(403).json(ApiResponse.error('Not authorized to edit this comment'));
    return;
  }

  // Store edit history if content is being changed
  if (content && content !== comment.content) {
    comment.editHistory.push({
      timestamp: new Date(),
      previousContent: comment.content,
      editedBy: userId,
    });
    comment.content = content;
  }

  // Update other fields
  if (visibility) comment.visibility = visibility;
  if (priority) comment.priority = priority;
  if (tags) comment.tags = tags;
  if (status) comment.status = status;

  await comment.save();
  await comment.populate('authorId', 'name email avatar');

  res.json(
    ApiResponse.success({
      comment: comment.toObject(),
      message: 'Comment updated successfully',
    })
  );
}
)

/**
   * Delete comment
   * DELETE /collaboration/comments/:commentId
