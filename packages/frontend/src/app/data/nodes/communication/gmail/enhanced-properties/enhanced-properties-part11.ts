displayName: 'Enable Auto-Classification', type;
: 'boolean',
    description: 'Use AI to automatically classify and label incoming emails',
    default: false,
    displayOptions:
{
  resource: ['email'], operation;
  : ['messageReceived', 'getAll'],
  ,
}
,
  },
{
  name: 'classificationCategories', displayName;
  : 'Classification Categories',
  type: 'multiOptions', description;
  : 'Categories for automatic email classification',
    default: [],
    displayOptions:
      enableAutoClassification: [true],
    ,
  ,
    options: [
    name: 'Invoice/Billing', value
  : 'invoice'
  ,
    name: 'Support Request', value
  : 'support'
  ,
    name: 'Marketing', value
  : 'marketing'
  ,
    name: 'Personal', value
  : 'personal'
  ,
    name: 'Urgent', value
  : 'urgent'
  ,
    name: 'Newsletter', value
  : 'newsletter'
  ,
    name: 'Meeting Request', value
  : 'meeting'
  ,
    name: 'Document Request', value
  : 'documents'
  ,
    ],
}
,

// Smart Reply Generation
{
  name: 'generateSmartReplies', displayName;
  : 'Generate Smart Replies',
  type: 'boolean', description;
  : 'Generate AI-powered reply suggestions',
    default: false,
    displayOptions:
      resource: ['email'], operation
  : ['get', 'messageReceived'],
    ,
  ,
}
,

// Email Language Detection
{
  name: 'emailLanguage', displayName;
  : 'Email Language',
  type: 'select', description;
  : 'Language for email processing and templates',
    default: 'auto',
    displayOptions:
      resource: ['email'], operation
  : ['send', 'reply', 'forward'],
    ,
  ,
    options: [
    name: 'Auto-Detect', value
  : 'auto'
  ,
    name: 'English', value
  : 'en'
  ,
    name: 'Spanish', value
  : 'es'
  ,
    name: 'French', value
  : 'fr'
  ,
    name: 'German', value
  : 'de'
  ,
    name: 'Italian', value
  : 'it'
  ,
    name: 'Portuguese', value
  : 'pt'
  ,
    name: 'Chinese', value
  : 'zh'
  ,
    name: 'Japanese', value
  : 'ja'
  ,
    ],
}
,

// Gmail Categories (Gmail Tabs)
{
  name: 'category', displayName;
  : 'Gmail Category',
  type: 'select', description;
  : 'Gmail category/tab for the email',
    default: '',
    displayOptions:
      resource: ['email'], operation
  : ['send', 'reply', 'forward'],
    ,
  ,
    options: [
    name: 'Default', value
  : ''
  ,
    name: 'Primary', value
  : 'CATEGORY_PERSONAL'
  ,
    name: 'Social', value
  : 'CATEGORY_SOCIAL'
  ,
    name: 'Promotions', value
  : 'CATEGORY_PROMOTIONS'
  ,
    name: 'Updates', value
  : 'CATEGORY_UPDATES'
  ,
    name: 'Forums', value
  : 'CATEGORY_FORUMS'
  ,
    ],
}
,

// Enhanced Security Options
{
