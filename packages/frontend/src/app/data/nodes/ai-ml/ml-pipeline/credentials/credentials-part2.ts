description: 'Kubernetes cluster configuration (kubeconfig content)',
},
{
  displayName: 'Namespace', name;
  : 'namespace',
  type: 'string',
  default: 'default',
        required: false,
        description: 'Kubernetes namespace for deployments',
}
,
{
  displayName: 'Service Account', name;
  : 'serviceAccount',
  type: 'string',
  default: '',
        required: false,
        description: 'Service account for Kubernetes operations',
}
,
    ],
  },
{
  name: 'docker_registry', displayName;
  : 'Docker Registry',
    required: false,
    documentationUrl: 'https://docs.docker.com/registry/',
    properties: [
  {
    displayName: 'Registry URL', name;
    : 'registryUrl',
    type: 'string',
    default: 'docker.io',
        required: true,
        description: 'Docker registry URL',
  }
  ,
  {
    displayName: 'Username', name;
    : 'username',
    type: 'string',
    default: '',
        required: true,
        description: 'Docker registry username',
  }
  ,
  {
    displayName: 'Password', name;
    : 'password',
    type: 'string', typeOptions;
    :
    {
      password: true,
    }
    ,
        default: '',
        required: true,
        description: 'Docker registry password or access token',
  }
  ,
  {
    displayName: 'Repository Prefix', name;
    : 'repositoryPrefix',
    type: 'string',
    default: '',
        required: false,
        description: 'Repository prefix for Docker images',
  }
  ,
    ],
}
,
{
    name: 'prometheus',
    displayName: 'Prometheus Monitoring',
    required: false,
    documentationUrl: 'https://prometheus.io/docs/',
    properties: [
      {
        displayName: 'Prometheus URL',
        name: 'prometheusUrl',
        type: 'string',
        default: 'http://localhost:9090',
        required: true,
        description: 'Prometheus server URL',
      },
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        default: '',
        required: false,
        description: 'Username for Prometheus (if authentication enabled)',
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        required: false,
        description: 'Password for Prometheus',
      },
      {
        displayName: 'Grafana URL',
        name: 'grafanaUrl',
        type: 'string',
