await comment.save();
await comment.populate('authorId', 'name email avatar');
await comment.populate('resolvedBy', 'name email avatar');

res.json(
  ApiResponse.success({
    comment: comment.toObject(),
    message: 'Comment resolved successfully',
  })
);
})

/**
 * Get comment analytics for a workflow
 * GET /collaboration/comments/:workflowId/analytics
 */
public
getCommentAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
    const { workflowId } = req.params;
    const { dateRange = 7 } = req.query; // days

    if (!workflowId) {
      res.status(400).json(ApiResponse.error('Workflow ID is required'));
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(dateRange));

    // Get comment analytics
    const commentStats = await Comment.aggregate([
      {
        $match: {
          workflowId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalComments: { $sum: 1 },
          openComments: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] },
          },
          resolvedComments: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
          },
          totalReplies: { $sum: { $size: '$thread' } },
          totalReactions: { $sum: { $size: '$reactions' } },
          averageRepliesPerComment: { $avg: { $size: '$thread' } },
        },
      },
    ]);

    // Get comment activity by day
    const dailyActivity = await Comment.aggregate([
      {
        $match: {
          workflowId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get top commenters
    const topCommenters = await Comment.aggregate([
      {
        $match: {
          workflowId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$authorId',
          commentCount: { $sum: 1 },
        },
      },
      { $sort: { commentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author',
        },
      },
      {
        $unwind: '$author',
      },
