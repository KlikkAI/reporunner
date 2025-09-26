if (!userId) {
  res.status(400).json(ApiResponse.error('User ID is required'));
  return;
}

const filter: any = {
  'participants.userId': userId,
};

if (active !== undefined) {
  filter.isActive = active === 'true';
}

const sessions = await CollaborationSession.find(filter)
  .populate('workflowId', 'name description')
  .sort({ createdAt: -1 })
  .limit(Number(limit))
  .skip((Number(page) - 1) * Number(limit));

const total = await CollaborationSession.countDocuments(filter);

res.json(
  ApiResponse.success({
    sessions: sessions.map((s) => s.toObject()),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  })
);
})

/**
 * Get session operations history
 * GET /collaboration/sessions/:sessionId/operations
 */
public
getSessionOperations = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
  const { sessionId } = req.params;
  const { limit = 50, page = 1, status, type } = req.query;

  if (!sessionId) {
    res.status(400).json(ApiResponse.error('Session ID is required'));
    return;
  }

  const filter: any = { sessionId };

  if (status) {
    filter.status = status;
  }

  if (type) {
    filter.type = type;
  }

  const operations = await Operation.find(filter)
    .populate('authorId', 'name email')
    .sort({ timestamp: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Operation.countDocuments(filter);

  res.json(
    ApiResponse.success({
      operations: operations.map((op) => op.toObject()),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
}
)

/**
 * Update session configuration
 * PATCH /collaboration/sessions/:sessionId/config
 */
public
updateSessionConfig = asyncHandler(async (req: Request, res: Response): Promise<void> =>
{
    const { sessionId } = req.params;
    const { settings } = req.body;

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
