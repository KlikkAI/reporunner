return this.executeWebhook(node, context, inputs);

case 'condition':
return this.executeCondition(node, context, inputs);

case 'delay':
return this.executeDelay(node, context, inputs);

case 'transform':
return this.executeTransform(node, context, inputs);

default:
        logger.warn(`Unknown node
type: $;
{
  nodeType;
}
`);
        return {
          message: `;
Node;
type;
('${nodeType}');
executed(placeholder)`,
          nodeId: node.id,
          type: nodeType,
        };
    }
  }

  /**
   * Execute Gmail trigger node
   */
  private async executeGmailTrigger(
    node: IWorkflowNode,
    context: ExecutionContext,
    _inputs: Record<string, any>
  ): Promise<any> {
    try {
      const credentials = await this.getGmailCredentials(context.userId);
      const gmailService = new GmailService(credentials);

      const nodeConfig = node.data.configuration || {};
      const filters = nodeConfig.filters || [];
      const options = nodeConfig.options || {};

      // Get maxResults from node configuration, default to 1 for latest email workflow
      const maxResults = options.maxResults || 1;

      // Build Gmail query from filters
      let query = '';
      if (filters.length > 0) {
        const queryParts: string[] = [];
        filters.forEach((filter: any) => {
          switch (filter.field) {
            case 'from':
              queryParts.push(`;
from: $;
{
  filter.value;
}
`);
              break;
            case 'to':
              queryParts.push(`;
to: $;
{
  filter.value;
}
`);
              break;
            case 'subject':
              queryParts.push(`;
subject: $;
{
  filter.value;
}
`);
              break;
            case 'body':
              queryParts.push(`;
$;
{
  filter.value;
}
`);
              break;
            case 'hasAttachment':
              queryParts.push('has:attachment');
              break;
            case 'isUnread':
              queryParts.push('is:unread');
              break;
            case 'label':
              queryParts.push(`;
label: $;
{
  filter.value;
}
`);
              break;
          }
        });
        query = queryParts.join(' ');
      }

      // Get messages with configurable limit
      const messages = await gmailService.listMessages(query, maxResults);

      return {
        messages,
        totalCount: messages.length,
        query,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`;
Gmail;
trigger;
error: $;
{
  error.message;
}
`);
      throw new Error(`;
Gmail;
trigger;
failed: $;
{
  error.message;
}
`);
    }
  }

  /**
   * Execute Gmail send node
   */
  private async executeGmailSend(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>
  ): Promise<any> {
    try {
      const credentials = await this.getGmailCredentials(context.userId);
      const gmailService = new GmailService(credentials);

      const nodeConfig = node.data.configuration || {};
