import { Router } from 'express';
import { validateBody, validateQuery, validateParams, validateRequest } from '../middleware/validation/ValidationMiddleware';
import { Validator } from '@reporunner/core';

const router = Router();

// Example schema for user creation
const createUserSchema = {
  name: {
    type: 'string',
    required: true,
    validator: new Validator()
      .string()
      .minLength(2)
      .maxLength(50)
  },
  email: {
    type: 'string',
    required: true,
    validator: new Validator()
      .string()
      .email()
  },
  age: {
    type: 'number',
    required: true,
    validator: new Validator()
      .number()
      .min(13)
      .max(120)
  }
};

// Example schema for query parameters
const userQuerySchema = {
  page: {
    type: 'number',
    validator: new Validator()
      .number()
      .min(1)
  },
  limit: {
    type: 'number',
    validator: new Validator()
      .number()
      .min(1)
      .max(100)
  },
  sortBy: {
    type: 'string',
    validator: new Validator()
      .string()
      .custom(value => ['name', 'age', 'createdAt'].includes(value), 'Invalid sort field')
  }
};

// Example schema for URL parameters
const userParamsSchema = {
  userId: {
    type: 'string',
    required: true,
    validator: new Validator()
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
  }
};

// Example 1: Validate request body only
router.post('/users',
  validateBody(createUserSchema).handle,
  (req, res) => {
    res.json({ message: 'User created', user: req.body });
  }
);

// Example 2: Validate query parameters
router.get('/users',
  validateQuery(userQuerySchema).handle,
  (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt' } = req.query;
    res.json({ message: 'Users retrieved', page, limit, sortBy });
  }
);

// Example 3: Validate URL parameters
router.get('/users/:userId',
  validateParams(userParamsSchema).handle,
  (req, res) => {
    res.json({ message: 'User retrieved', userId: req.params.userId });
  }
);

// Example 4: Validate multiple parts of the request
router.patch('/users/:userId',
  validateRequest({
    paramsSchema: userParamsSchema,
    bodySchema: {
      name: {
        type: 'string',
        validator: new Validator()
          .string()
          .minLength(2)
          .maxLength(50)
      },
      email: {
        type: 'string',
        validator: new Validator()
          .string()
          .email()
      }
    },
    sanitize: true
  }).handle,
  (req, res) => {
    res.json({
      message: 'User updated',
      userId: req.params.userId,
      updates: req.body
    });
  }
);

// Example 5: Custom validation logic
router.post('/teams',
  validateRequest({
    bodySchema: {
      name: {
        type: 'string',
        required: true,
        validator: new Validator()
          .string()
          .minLength(2)
          .maxLength(50)
      },
      members: {
        type: 'array',
        required: true
      }
    },
    async customValidation(req) {
      const { members } = req.body;
      
      // Custom validation: ensure members array is not empty
      if (!members.length) {
        throw new Error('Team must have at least one member');
      }

      // Custom validation: ensure all member IDs are valid
      for (const memberId of members) {
        // This would typically be a database check
        const isValidMember = typeof memberId === 'string' && 
          /^[0-9a-fA-F]{24}$/.test(memberId);
        
        if (!isValidMember) {
          throw new Error(`Invalid member ID: ${memberId}`);
        }
      }
    }
  }).handle,
  (req, res) => {
    res.json({ message: 'Team created', team: req.body });
  }
);

export default router;