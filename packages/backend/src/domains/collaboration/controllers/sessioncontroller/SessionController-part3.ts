}

// Update settings
if (settings) {
  session.settings = {
    ...session.settings,
    ...settings,
  };
  await session.save();
}

res.json(
  ApiResponse.success({
    session: session.toObject(),
    message: 'Session configuration updated successfully',
  })
);
})

/**
 * End collaboration session
 * POST /collaboration/sessions/:sessionId/end
 */
public
endSession = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
  const { sessionId } = req.params;

  if (!sessionId) {
    res.status(400).json(ApiResponse.error('Session ID is required'));
    return;
  }

  const session = await CollaborationSession.findOne({
    sessionId,
    isActive: true,
  });

  if (!session) {
    res.status(404).json(ApiResponse.error('Session not found'));
    return;
  }

  // End the session
  session.isActive = false;
  session.endedAt = new Date();
  await session.save();

  res.json(
    ApiResponse.success({
      session: session.toObject(),
      message: 'Collaboration session ended successfully',
    })
  );
}
)

/**
 * Get collaboration analytics for a workflow
 * GET /collaboration/analytics/:workflowId
 */
public
getCollaborationAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { workflowId } = req.params;
      const { dateRange = 7 } = req.query; // days

      if (!workflowId) {
        res.status(400).json(ApiResponse.error('Workflow ID is required'));
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(dateRange));

      // Get session analytics
      const sessionStats = await CollaborationSession.aggregate([
        {
          $match: {
            workflowId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            activeSessions: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
            averageParticipants: { $avg: { $size: '$participants' } },
            totalParticipants: { $sum: { $size: '$participants' } },
          },
        },
      ]);

      // Get operation analytics
      const operationStats = await Operation.aggregate([
        {
          $match: {
            workflowId,
            timestamp: { $gte: startDate },
          },
        },
