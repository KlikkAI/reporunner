if (!condition) return true;

// Simple condition evaluation
if (condition.type === 'value') {
  return input[condition.field] === condition.value;
}

return true;
}
}

class TransformNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const transformation = node.data.transformation || {};

    // Apply simple transformations
    let transformed = { ...input };

    if (transformation.mapping) {
      for (const [from, to] of Object.entries(transformation.mapping)) {
        if (input[from] !== undefined) {
          transformed[to as string] = input[from];
          delete transformed[from];
        }
      }
    }

    return {
      transformed,
      originalInput: input,
      nodeId: node.id,
    };
  }
}

class DelayNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const delay = node.data.delay || 1000;

    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      delayed: true,
      duration: delay,
      input,
      nodeId: node.id,
      timestamp: new Date(),
    };
  }
}

class WebhookNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const { url, method = 'POST', headers = {} } = node.data;

    if (!url) {
      throw new Error('Webhook URL is required');
    }

    // Simulate webhook call
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      webhook_called: true,
      url,
      method,
      headers,
      input,
      nodeId: node.id,
      response: { status: 200, data: 'success' },
    };
  }
}

class EmailNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const { to, subject, body } = node.data;

    if (!to) {
      throw new Error('Email recipient is required');
    }

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      email_sent: true,
      to,
      subject,
      body,
      input,
      nodeId: node.id,
      messageId: `msg_${Date.now()}`,
    };
  }
}

class DatabaseNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const { operation, collection, query } = node.data;
