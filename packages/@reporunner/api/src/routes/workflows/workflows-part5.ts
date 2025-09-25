*     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     responses:
 *       200:
 *         description: Workflow deactivated successfully
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
  '/:workflowId/deactivate',
  authRequired,
  [param('workflowId').isUUID()],
  validateRequest,
  workflowController.deactivateWorkflow
)

export { router as workflowRoutes };
