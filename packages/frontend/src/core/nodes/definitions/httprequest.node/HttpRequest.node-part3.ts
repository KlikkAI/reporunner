break;
}
    }

// Build request body for POST/PUT/PATCH
let body: any;
if (['POST', 'PUT', 'PATCH'].includes(method)) {
  const bodyParam = this.getNodeParameter('body', '{}') as string;
  try {
    body = JSON.parse(bodyParam);
    requestHeaders['Content-Type'] = 'application/json';
  } catch (_error) {
    body = bodyParam;
    requestHeaders['Content-Type'] = 'text/plain';
  }
}

// Mock HTTP request for demo purposes
// In real implementation, would use fetch() or axios
return [
      {
        json: {
          request: {
            method,
            url,
            headers: requestHeaders,
            body: body || null,
            timeout,
          },
          response: {
            status: 200,
            statusText: 'OK',
            headers: {
              'content-type': 'application/json',
              'x-mock': 'true',
            },
            data:
              responseFormat === 'json'
                ? {
                    success: true,
                    message: 'Mock HTTP response',
                    timestamp: new Date().toISOString(),
                  }
                : 'Mock response text',
          },
          executionTime: Math.floor(Math.random() * 1000) + 100, // Mock execution time
          timestamp: new Date().toISOString(),
        },
      },
    ];
}
}
