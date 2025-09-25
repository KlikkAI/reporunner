name: 'apiKey', type;
: 'string',
        typeOptions:
{
  password: true,
}
,
        default: '',
        required: true,
        description: 'API key for custom compute access',
      },
{
  displayName: 'Username', name;
  : 'username',
  type: 'string',
  default: '',
        required: false,
        description: 'Username for SSH/cluster access',
}
,
{
  displayName: 'SSH Private Key', name;
  : 'sshPrivateKey',
  type: 'string', typeOptions;
  :
  {
    password: true, multiline;
    : true,
  }
  ,
        default: '',
        required: false,
        description: 'SSH private key for cluster access',
}
,
    ],
  },
]
