if (existingReactionIndex !== -1) {
  // Update existing reaction
  comment.reactions[existingReactionIndex].type = type;
  comment.reactions[existingReactionIndex].timestamp = new Date();
} else {
  // Add new reaction
  comment.reactions.push({
    userId,
    type,
    timestamp: new Date(),
  });
}

await comment.save();

res.json(
  ApiResponse.success({
    reactions: comment.reactions,
    message: 'Reaction added successfully',
  })
);
})

/**
 * Remove reaction from comment
 * DELETE /collaboration/comments/:commentId/reactions
 */
public
removeReaction = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
  const { commentId } = req.params;

  if (!commentId) {
    res.status(400).json(ApiResponse.error('Comment ID is required'));
    return;
  }

  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json(ApiResponse.error('Authentication required'));
    return;
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404).json(ApiResponse.error('Comment not found'));
    return;
  }

  const reactionIndex = comment.reactions.findIndex((r) => r.userId === userId);
  if (reactionIndex === -1) {
    res.status(404).json(ApiResponse.error('User reaction not found'));
    return;
  }

  // Remove user's reaction
  comment.reactions.splice(reactionIndex, 1);
  await comment.save();

  res.json(
    ApiResponse.success({
      reactions: comment.reactions,
      message: 'Reaction removed successfully',
    })
  );
}
)

/**
 * Resolve comment
 * POST /collaboration/comments/:commentId/resolve
 */
public
resolveComment = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
    const { commentId } = req.params;
    const { resolution } = req.body;

    if (!commentId) {
      res.status(400).json(ApiResponse.error('Comment ID is required'));
      return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json(ApiResponse.error('Comment not found'));
      return;
    }

    if (comment.status === 'resolved') {
      res.status(409).json(ApiResponse.error('Comment is already resolved'));
      return;
    }

    comment.status = 'resolved';
    comment.resolvedBy = userId;
    comment.resolvedAt = new Date();
// Note: resolution field would need to be added to IComment interface if needed
