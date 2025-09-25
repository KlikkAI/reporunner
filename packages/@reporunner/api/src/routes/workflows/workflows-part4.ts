*     summary: Execute workflow
 *     description: Manually execute a workflow
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *
type: object * properties;
:
 *               inputData:
 *
type: object * description;
: Input data
for the workflow
 *               mode
:
 *
type: string
 *
enum: ['manual', 'test']
*                 default: 'manual'
 *     responses:
 *       202:
 *         description: Workflow execution started
 *         content:
 *           application/json:
 *             schema:
 *
type: object * properties;
:
 *                 executionId:
 *
type: string * format;
: uuid
 *                 status:
 *
type: string
 *
enum: ['pending', 'running']
*                 message:
 *
type: string * 400;
:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:workflowId/execute',
  authRequired,
  workflowRateLimit,
  [
    param('workflowId').isUUID(),
    body('inputData').optional().isObject(),
    body('mode').optional().isIn(['manual', 'test']),
  ],
  validateRequest,
  workflowController.executeWorkflow
)

/**
 * @swagger
 * /api/v1/workflows/{workflowId}/activate:
 *   post:
 *     summary: Activate workflow
 *     description: Activate a workflow to enable triggers
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     responses:
 *       200:
 *         description: Workflow activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:workflowId/activate',
  authRequired,
  [param('workflowId').isUUID()],
  validateRequest,
  workflowController.activateWorkflow
)

/**
 * @swagger
 * /api/v1/workflows/{workflowId}/deactivate:
 *   post:
 *     summary: Deactivate workflow
 *     description: Deactivate a workflow to disable triggers
