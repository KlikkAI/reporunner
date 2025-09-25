// Gmail Node - Dynamic Properties Configuration

import type { NodeProperty } from '@/core/types/dynamicProperties';

// Gmail Trigger Properties
export const gmailTriggerProperties: NodeProperty[] = [
  {
    name: 'credential',
    displayName: 'Credential to connect with',
    type: 'credentialsSelect',
    description: 'Gmail OAuth2 credentials for accessing the API',
    required: true,
    credentialTypes: ['gmailOAuth2'],
    default: '',
  },
  {
    name: 'event',
    displayName: 'Event',
    type: 'select',
    description: 'The event that triggers the workflow',
    required: true,
    default: 'messageReceived',
    options: [
      { name: 'Message Received', value: 'messageReceived' },
      { name: 'Message Sent', value: 'messageSent' },
      { name: 'Message Read', value: 'messageRead' },
      { name: 'Message Starred', value: 'messageStarred' },
      { name: 'Message Deleted', value: 'messageDeleted' },
      { name: 'New Thread', value: 'newThread' },
      { name: 'Label Added', value: 'labelAdded' },
      { name: 'Label Removed', value: 'labelRemoved' },
    ],
  },
  {
    name: 'pollTimes',
    displayName: 'Poll Times',
    type: 'collection',
    description: 'Configure when to check for emails with hierarchical time selection',
    required: false,
    default: {
      mode: 'everyMinute',
    },
    values: [
      {
        name: 'mode',
        displayName: 'Polling Frequency',
        type: 'select',
        description: 'How often to check for new emails',
        required: true,
        default: 'everyMinute',
        options: [
          { name: 'Every Minute', value: 'everyMinute' },
          { name: 'Every Hour', value: 'everyHour' },
          { name: 'Every Day', value: 'everyDay' },
          { name: 'Every Week', value: 'everyWeek' },
          { name: 'Every Month', value: 'everyMonth' },
          { name: 'Custom Interval', value: 'customInterval' },
          { name: 'Custom Cron', value: 'customCron' },
        ],
      },
      {
        name: 'intervalMinutes',
        displayName: 'Interval (Minutes)',
        type: 'number',
        description: 'Check every X minutes',
        min: 1,
        max: 1440,
        default: 5,
        displayOptions: {
          show: {
            mode: ['customInterval'],
          },
        },
      },
      {
        name: 'minute',
        displayName: 'Minute',
        type: 'number',
        description: 'Minute of the hour (0-59)',
        min: 0,
        max: 59,
        default: 0,
        displayOptions: {
          show: {
            mode: ['everyHour', 'everyDay', 'everyWeek', 'everyMonth'],
          },
        },
      },
      {
        name: 'hour',
        displayName: 'Hour',
        type: 'number',
        description: 'Hour of the day (0-23)',
        min: 0,
        max: 23,
        default: 9,
        displayOptions: {
          show: {
            mode: ['everyDay', 'everyWeek', 'everyMonth'],
          },
