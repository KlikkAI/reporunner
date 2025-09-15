import { body, query, param } from 'express-validator';

/**
 * Common parameter validators
 */
export const mongoIdParam = param('id').isMongoId().withMessage('Invalid ID format');

/**
 * Pagination query validators
 */
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Workflow creation validation
 */
export const createWorkflowValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workflow name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('nodes')
    .isArray()
    .withMessage('Nodes must be an array'),
  
  body('edges')
    .isArray()
    .withMessage('Edges must be an array'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),
];

/**
 * Workflow update validation
 */
export const updateWorkflowValidation = [
  mongoIdParam,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workflow name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('nodes')
    .optional()
    .isArray()
    .withMessage('Nodes must be an array'),
  
  body('edges')
    .optional()
    .isArray()
    .withMessage('Edges must be an array'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),
];

/**
 * Workflow search validation
 */
export const workflowSearchValidation = [
  ...paginationValidation,
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must not be empty'),
  
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('isActive must be a boolean'),
];

/**
 * Workflow execution validation
 */
export const executeWorkflowValidation = [
  mongoIdParam,
  body('triggerData')
    .optional()
    .isObject()
    .withMessage('Trigger data must be an object'),
];

/**
 * Workflow statistics validation
 */
export const workflowStatsValidation = [
  mongoIdParam,
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .toInt()
    .withMessage('Days must be between 1 and 365'),
];

/**
 * Execution query validation
 */
export const executionQueryValidation = [
  ...paginationValidation,
  query('workflowId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workflow ID format'),
  
  query('status')
    .optional()
    .isIn(['pending', 'running', 'success', 'error', 'cancelled'])
    .withMessage('Invalid status value'),
];