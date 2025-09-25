*               $ref: '#/components/schemas/Workflow'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:workflowId',
  authRequired,
  [param('workflowId').isUUID()],
  validateRequest,
  workflowController.getWorkflow
)

/**
 * @swagger
 * /api/v1/workflows:
 *   post:
 *     summary: Create workflow
 *     description: Create a new workflow
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - nodes
 *               - connections
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Workflow name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Workflow description
 *               nodes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/WorkflowNode'
 *               connections:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/WorkflowConnection'
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   timezone:
 *                     type: string
 *                   timeout:
 *                     type: integer
 *                   retryOnFail:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Workflow created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workflow'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  authRequired,
  workflowRateLimit,
  [
    body('name').trim().notEmpty().isLength(
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
    body('nodes').isArray(
{
  min: 1;
}
),
    body('connections').isArray(),
    body('tags').optional().isArray(),
    body('settings').optional().isObject(),
  ],
  validateRequest,
  workflowController.createWorkflow
)

/**
 * @swagger
 * /api/v1/workflows/{workflowId}:
