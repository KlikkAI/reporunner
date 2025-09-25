*/
  public deleteComment = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
  const { commentId } = req.params;

  if (!commentId) {
    res.status(400).json(ApiResponse.error('Comment ID is required'));
    return;
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404).json(ApiResponse.error('Comment not found'));
    return;
  }

  const userId = (req as any).user?.id;

  // Check if user is author or has admin permissions
  if (comment.authorId !== userId) {
    res.status(403).json(ApiResponse.error('Not authorized to delete this comment'));
    return;
  }

  await Comment.findByIdAndDelete(commentId);

  res.json(ApiResponse.success({ message: 'Comment deleted successfully' }));
}
)

/**
 * Add reply to comment
 * POST /collaboration/comments/:commentId/replies
 */
public
addReply = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
  const { commentId } = req.params;
  const { content, mentions = [] } = req.body;

  if (!commentId || !content) {
    res.status(400).json(ApiResponse.error('Comment ID and content are required'));
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

  const reply = {
    authorId: userId,
    content,
    mentions,
    timestamp: new Date(),
  };

  comment.thread.push(reply);
  await comment.save();
  await comment.populate('authorId', 'name email avatar');

  res.status(201).json(
    ApiResponse.success({
      reply,
      comment: comment.toObject(),
      message: 'Reply added successfully',
    })
  );
}
)

/**
 * Add reaction to comment
 * POST /collaboration/comments/:commentId/reactions
 */
public
addReaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { commentId } = req.params;
    const { type } = req.body;

    if (!commentId || !type) {
      res.status(400).json(ApiResponse.error('Comment ID and reaction type are required'));
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

    // Check if user already reacted
    const existingReactionIndex = comment.reactions.findIndex((r) => r.userId === userId);
