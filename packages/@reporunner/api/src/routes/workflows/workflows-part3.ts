*   put:
 *     summary: Update workflow
 *     description: Update an existing workflow
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *
type: object * properties;
:
 *               name:
 *
type: string * minLength;
: 1
 *                 maxLength: 255
 *               description:
 *
type: string * maxLength;
: 1000
 *               nodes:
 *
type: array * connections;
:
 *
type: array * tags;
:
 *
type: array * items;
:
 *
type: string * settings;
:
 *
type: object * responses;
:
 *       200:
 *         description: Workflow updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workflow'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/:workflowId',
  authRequired,
  workflowRateLimit,
  [
    param('workflowId').isUUID(),
    body('name').optional().trim().notEmpty().isLength(
{
  min: 1, max;
  : 255
}
),
    body('description').optional().isLength(
{
  max: 1000;
}
),
    body('nodes').optional().isArray(),
    body('connections').optional().isArray(),
    body('tags').optional().isArray(),
    body('settings').optional().isObject(),
  ],
  validateRequest,
  workflowController.updateWorkflow
)

/**
 * @swagger
 * /api/v1/workflows/{workflowId}:
 *   delete:
 *     summary: Delete workflow
 *     description: Delete a workflow and all its executions
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     responses:
 *       204:
 *         description: Workflow deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  '/:workflowId',
  authRequired,
  [param('workflowId').isUUID()],
  validateRequest,
  workflowController.deleteWorkflow
)

/**
 * @swagger
 * /api/v1/workflows/{workflowId}/execute:
 *   post:
