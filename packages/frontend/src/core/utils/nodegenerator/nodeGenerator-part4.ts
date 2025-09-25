)
  .join(',\n')}
  ],
  
  // Action executors
  actions:
{
  $;
  {
    nodeTypes
      .map((nodeType) => {
        const actionName = nodeType.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const functionName = `execute${displayName}${nodeType.displayName.replace(/\s+/g, '')}`;
        return `    ${actionName}: ${functionName}`;
      })
      .join(',\n');
  }
  ,
    test: test$
  {
    displayName;
  }
  Connection;
}
}

// Export individual components
export {
  $
{
  name;
}
NodeMetadata, $;
{
  name;
}
Credentials, $;
{
  propertyImports;
}
,
  $
{
  actionImports;
}
,
  test$
{
  displayName;
}
Connection;
}`

return content;
}

/**
 * Main function to generate a complete node structure
 */
export function generateNode(
  options: NodeGeneratorOptions,
  basePath: string = './src/nodes/definitions'
) {
  const { name, category } = options;
  const nodePath = join(basePath, category, name);

  // Create directory structure
  mkdirSync(nodePath, { recursive: true });

  // Generate files
  const files = {
    'node.ts': generateNodeFile(options),
    'credentials.ts': generateCredentialsFile(options),
    'properties.ts': generatePropertiesFile(options),
    'actions.ts': generateActionsFile(options),
    'index.ts': generateIndexFile(options),
  };

  // Write files
  Object.entries(files).forEach(([filename, content]) => {
    writeFileSync(join(nodePath, filename), content);
  });
  Object.keys(files).forEach((_filename) => {});

  return nodePath;
}

// Example usage:
export const exampleDiscordNode: NodeGeneratorOptions = {
  name: 'discord',
  displayName: 'Discord',
  category: 'communication',
  icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg',
  description: 'Discord server and messaging integration',
  nodeTypes: [
    {
      id: 'send-message',
      displayName: 'Send Message',
      type: 'action',
      description: 'Send messages to Discord channels',
    },
    {
      id: 'create-channel',
      displayName: 'Create Channel',
      type: 'action',
      description: 'Create new Discord channels',
    },
  ],
  credentials: [
    {
      name: 'discord',
      required: true,
      description: 'Discord Bot Token',
    },
  ],
  properties: [
    {
      name: 'channel',
      displayName: 'Channel',
      type: 'string',
      description: 'Discord channel ID or name',
      required: true,
    },
    {
      name: 'message',
      displayName: 'Message',
      type: 'text',
