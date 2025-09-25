}

if (options.enablePathTraversalProtection !== false) {
  middlewares.push(createPathTraversalProtection());
}

if (options.enableCommandInjectionProtection !== false) {
  middlewares.push(createCommandInjectionProtection());
}

return middlewares;
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  login: {
    rules: [
      {
        field: 'email',
        type: 'email',
        required: true,
        normalizeEmail: true,
        toLowerCase: true,
        sanitize: true,
      },
      {
        field: 'password',
        type: 'string',
        required: true,
        minLength: 8,
        maxLength: 128,
      },
    ],
  },

  registration: {
    rules: [
      {
        field: 'email',
        type: 'email',
        required: true,
        normalizeEmail: true,
        toLowerCase: true,
        sanitize: true,
      },
      {
        field: 'password',
        type: 'string',
        required: true,
        minLength: 8,
        maxLength: 128,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      },
      {
        field: 'name',
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        sanitize: true,
        trim: true,
      },
    ],
  },

  pagination: {
    rules: [
      {
        field: 'page',
        location: 'query',
        type: 'number',
        min: 1,
        default: 1,
        transform: (v: any) => parseInt(v, 10),
      },
      {
        field: 'limit',
        location: 'query',
        type: 'number',
        min: 1,
        max: 100,
        default: 20,
        transform: (v: any) => parseInt(v, 10),
      },
      {
        field: 'sort',
        location: 'query',
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        toLowerCase: true,
      },
    ],
  },
};
