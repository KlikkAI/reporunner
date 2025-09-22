// Gmail Node - Core Definition
import { UNIFIED_CATEGORIES } from '@/core/constants/categories';

export const gmailNodeMetadata = {
  id: 'gmail',
  name: 'Gmail',
  displayName: 'Gmail',
  icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
  category: UNIFIED_CATEGORIES.COMMUNICATION,
  description: 'Gmail email service integration - trigger on new emails and send emails',
  version: 1,

  // Input/Output definitions
  inputs: [
    {
      name: 'main',
      type: 'main',
      displayName: 'Input Data',
      description: 'Input data for the node',
      required: false,
    },
  ],

  outputs: [
    {
      name: 'main',
      type: 'main',
      displayName: 'Output Data',
      description: 'Output data from the node',
    },
  ],

  // Execution settings
  continueOnFail: false,
  retryOnFail: false,

  // UI categorization
  codex: {
    categories: ['communication', 'email'],
  },
};
