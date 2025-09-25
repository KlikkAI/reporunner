default: false,
        description: 'Apply data augmentation during training',
      },
{
  displayName: 'Text Augmentation', name;
  : 'textAugmentation',
  type: 'multiSelect',
  default: ['synonym_replacement'],
        displayOptions:
  {
    show: {
      enabled: [true], '/modelConfig/modelType';
      : ['language_model', 'classification'],
    }
    ,
  }
  ,
        options: [
  {
    name: 'Synonym Replacement', value;
    : 'synonym_replacement'
  }
  ,
  {
    name: 'Random Insertion', value;
    : 'random_insertion'
  }
  ,
  {
    name: 'Random Deletion', value;
    : 'random_deletion'
  }
  ,
  {
    name: 'Random Swap', value;
    : 'random_swap'
  }
  ,
  {
    name: 'Back Translation', value;
    : 'back_translation'
  }
  ,
  {
    name: 'Paraphrasing', value;
    : 'paraphrasing'
  }
  ,
        ],
        description: 'Text augmentation techniques',
}
,
{
  displayName: 'Image Augmentation', name;
  : 'imageAugmentation',
  type: 'multiSelect',
  default: ['rotation', 'flip'],
        displayOptions:
  {
    show: {
      enabled: [true], '/modelConfig/modelType';
      : ['computer_vision'],
    }
    ,
  }
  ,
        options: [
  {
    name: 'Rotation', value;
    : 'rotation'
  }
  ,
  {
    name: 'Horizontal Flip', value;
    : 'flip'
  }
  ,
  {
    name: 'Color Jitter', value;
    : 'color_jitter'
  }
  ,
  {
    name: 'Random Crop', value;
    : 'random_crop'
  }
  ,
  {
    name: 'Gaussian Blur', value;
    : 'gaussian_blur'
  }
  ,
  {
    name: 'Noise Addition', value;
    : 'noise_addition'
  }
  ,
        ],
        description: 'Image augmentation techniques',
}
,
{
  displayName: 'Augmentation Probability', name;
  : 'augmentationProbability',
  type: 'number',
  default: 0.3,
        displayOptions:
  {
    show: {
      enabled: [true],
    }
    ,
  }
  ,
        typeOptions:
  {
    minValue: 0.1, maxValue;
    : 1.0,
          numberPrecision: 2,
  }
  ,
        description: 'Probability of applying augmentation',
}
,
    ],
  },
]
