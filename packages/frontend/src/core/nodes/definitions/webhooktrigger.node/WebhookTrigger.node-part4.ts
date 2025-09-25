},
      }
}

const responseMode = this.getNodeParameter('responseMode', 'onReceived') as string;

if (responseMode === 'onReceived') {
  const responseCode = this.getNodeParameter('responseCode', 200) as number;

  // Add custom response headers if configured
  if (nodeParameters.responseHeaders?.headers) {
    for (const header of nodeParameters.responseHeaders.headers) {
      resp.setHeader(header.name, header.value);
    }
  }

  resp.status(responseCode).json({
    message: 'Webhook received',
    timestamp: new Date().toISOString(),
  });
}

return [returnData];
}
}
