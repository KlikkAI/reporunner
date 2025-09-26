version: 1, description;
:
                    'This is a comprehensive description of what this node does and how it works...',
                  properties: Array(20)
                    .fill(0)
                    .map((_, i) => (
{
  displayName: `Property ${i}`, name;
  : `prop$
    i
  `,
  type: 'string',
  default: '',
                      description: `
  This;
  is;
  property;
  $;
  i;
  with a detailed
  description;
  ...`,
  options: Array(10)
                        .fill(0)
                        .map((_, j) => (
    name: `Option $
  {
    j;
  }
  `, value;
    : `;
  option$;
  j;
  `,
                          description: `;
  This;
  is;
  option;
  $;
  j;
  ...`,
  )),
}
)),
                },
              ],
            },
            nodeTypeData:
{
  // ... lots of UI metadata
}
,
            config:
{
}
,
            credentials: [],
            icon: '⚡',
            enhancedNodeType:
{
  // ... more UI data
}
,
          },
        })),
      }

// Calculate sizes
const leanSize = JSON.stringify(leanWorkflow).length;
const bloatedSize = JSON.stringify(legacyBloatedData).length;
const reductionPercentage = Math.round(((bloatedSize - leanSize) / bloatedSize) * 100);

console.log(`Lean workflow size: ${leanSize} characters`);
console.log(`Legacy workflow size: ${bloatedSize} characters`);
console.log(`Size reduction: ${reductionPercentage}%`);

// Assertions
expect(leanSize).toBeLessThan(2000); // Should be under 2KB for 6 nodes (very reasonable)
expect(reductionPercentage).toBeGreaterThan(95); // At least 95% reduction (achieved 99%!)
expect(leanWorkflow.nodes).toHaveLength(6);

// Verify lean nodes only contain essential data
leanWorkflow.nodes.forEach((node) => {
  expect(node).toHaveProperty('id');
  expect(node).toHaveProperty('type');
  expect(node).toHaveProperty('position');
  expect(node).toHaveProperty('parameters');

  // Should NOT have UI properties
  expect(node).not.toHaveProperty('data');
  expect(node).not.toHaveProperty('onDelete');
  expect(node).not.toHaveProperty('integrationData');
});
})

it('should maintain all essential workflow data in lean format', () =>
{
      const essentialData = {
        id: 'workflow-123',
        name: 'Customer Support Flow',
        active: true,
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 0, y: 100 },
            parameters: { triggerType: 'webhook' },
          },
          {
            id: 'ai-agent-1',
            type: 'action',
            position: { x: 200, y: 100 },
            parameters: {
              actionType: 'ai',
              provider: 'openai',
              model: 'gpt-4',
              systemPrompt: 'You are a helpful assistant',
            },
            credentials: 'openai-creds-1',
          },
        ],
        connections: {
          'trigger-1': {
            main: [{ node: 'ai-agent-1', type: 'main', index: 0 }],
          },
        },
        settings: { executionTimeout: 300 },
        tags: ['customer-support', 'ai'],
      };

      const serialized = JSON.stringify(essentialData);
      const deserialized = JSON.parse(serialized);
