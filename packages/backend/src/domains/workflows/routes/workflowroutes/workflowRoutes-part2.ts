authenticate, [param('id').isMongoId()], catchAsync(workflowController.duplicateWorkflow);
)

/**
 * @route   POST /workflows/:id/execute
 * @desc    Execute workflow
 * @access  Private
 */
router.post(
  '/:id/execute',
  authenticate,
  [param('id').isMongoId(), body('triggerData').optional().isObject()],
  catchAsync(workflowController.executeWorkflow)
)

/**
 * @route   POST /workflows/:id/test
 * @desc    Test workflow (dry run)
 * @access  Private
 */
router.post(
  '/:id/test',
  authenticate,
  [param('id').isMongoId()],
  catchAsync(workflowController.testWorkflow)
);

/**
 * @route   GET /workflows/:id/statistics
 * @desc    Get workflow statistics
 * @access  Private
 */
router.get(
  '/:id/statistics',
  authenticate,
  [param('id').isMongoId(), query('days').optional().isInt({ min: 1, max: 365 }).toInt()],
  catchAsync(workflowController.getWorkflowStatistics)
);

/**
 * @route   GET /workflows/executions
 * @desc    Get all executions
 * @access  Private
 */
router.get(
  '/executions',
  authenticate,
  [
    query('workflowId').optional().isMongoId(),
    query('status').optional().isIn(['pending', 'running', 'success', 'error', 'cancelled']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  catchAsync(workflowController.getExecutions)
);

/**
 * @route   GET /workflows/executions/stats
 * @desc    Get execution statistics
 * @access  Private
 */
router.get(
  '/executions/stats',
  authenticate,
  [query('workflowId').optional().isMongoId()],
  catchAsync(workflowController.getExecutionStatistics)
);

/**
 * @route   GET /workflows/executions/:id
 * @desc    Get execution by ID
 * @access  Private
 */
router.get(
  '/executions/:id',
  authenticate,
  [param('id').isMongoId()],
  catchAsync(workflowController.getExecutionById)
);

/**
 * @route   POST /workflows/executions/:id/stop
 * @desc    Stop execution
 * @access  Private
 */
router.post(
  '/executions/:id/stop',
  authenticate,
  [param('id').isMongoId()],
  catchAsync(workflowController.stopExecution)
);

/**
 * @route   POST /workflows/test
 * @desc    Test workflow (dry run) from body
 * @access  Private
 */
router.post(
