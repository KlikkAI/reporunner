name: 'encryptionLevel', displayName;
: 'Encryption Level',
type: 'select', description;
: 'Email encryption level',
    default: 'standard',
    displayOptions:
{
  show: {
    resource: ['email'], operation;
    : ['send', 'reply', 'forward'],
  }
  ,
}
,
    options: [
{
  name: 'Standard TLS', value;
  : 'standard'
}
,
{
  name: 'Enhanced TLS', value;
  : 'enhanced'
}
,
{
  name: 'S/MIME (if configured)', value;
  : 'smime'
}
,
    ],
  },

// Email Analytics & Tracking
{
  name: 'trackOpens', displayName;
  : 'Track Email Opens',
  type: 'boolean', description;
  : 'Track when emails are opened (requires third-party service)',
    default: false,
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send', 'reply', 'forward'],
    }
    ,
  }
  ,
}
,
{
  name: 'trackClicks', displayName;
  : 'Track Link Clicks',
  type: 'boolean', description;
  : 'Track clicks on links in emails (requires third-party service)',
    default: false,
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send', 'reply', 'forward'],
    }
    ,
  }
  ,
}
,

// Auto-Reply & Vacation Response
{
  name: 'autoReplyMessage', displayName;
  : 'Auto Reply Message',
  type: 'text', description;
  : 'Automatic reply message for incoming emails',
    rows: 3,
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['messageReceived'],
    }
    ,
  }
  ,
}
,
{
  name: 'autoReplyStartTime', displayName;
  : 'Auto Reply Start Date',
  type: 'dateTime', description;
  : 'Start date for automatic replies',
    displayOptions:
  {
    show: {
      autoReplyMessage: [''],
    }
    ,
      hide:
    {
      autoReplyMessage: [''],
    }
    ,
  }
  ,
}
,
{
  name: 'autoReplyEndTime', displayName;
  : 'Auto Reply End Date',
  type: 'dateTime', description;
  : 'End date for automatic replies',
    displayOptions:
  {
    show: {
      autoReplyMessage: [''],
    }
    ,
      hide:
    {
      autoReplyMessage: [''],
    }
    ,
  }
  ,
}
,

// Delivery & Read Confirmation
{
    name: 'requestDeliveryConfirmation',
    displayName: 'Request Delivery Confirmation',
    type: 'boolean',
    description: 'Request delivery confirmation from email server',
    default: false,
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send', 'reply', 'forward'],
