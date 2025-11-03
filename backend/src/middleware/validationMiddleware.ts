import { body, validationResult, param } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle the validation result
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for user registration
export const validateRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  handleValidationErrors,
];

// Validation rules for user login
export const validateLogin = [
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Validation rules for creating or updating a board
export const validateBoard = [
    body('title')
      .trim()
      .notEmpty().withMessage('Board title is required')
      .isLength({ min: 3 }).withMessage('Board title must be at least 3 characters long'),
    handleValidationErrors,
  ];
  
  // Validation for checking a boardId param
  export const validateBoardId = [
    param('boardId').isInt().withMessage('Board ID must be an integer'),
    handleValidationErrors,
  ];

// Validation for a columnId param
export const validateColumnId = [
    param('columnId').isInt().withMessage('Column ID must be an integer'),
    handleValidationErrors,
  ];
  
  // Validation for a cardId param
  export const validateCardId = [
    param('cardId').isInt().withMessage('Card ID must be an integer'),
    handleValidationErrors,
  ];
  
  // Validation for creating/updating a column
  export const validateColumn = [
    body('title')
      .trim()
      .notEmpty().withMessage('Column title is required'),
    handleValidationErrors,
  ];
  
  // Validation for creating a card
  export const validateCard = [
    body('title')
      .trim()
      .notEmpty().withMessage('Card title is required'),
    handleValidationErrors,
  ];
  
  // Validation for updating a card (more fields)
  export const validateCardUpdate = [
    body('title')
      .optional()
      .trim()
      .notEmpty().withMessage('Title cannot be empty'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string'),
    body('due_date')
      .optional({ nullable: true })
      .isISO8601().withMessage('Due date must be a valid date'),
    body('labels')
      .optional()
      .isArray().withMessage('Labels must be an array'),
    handleValidationErrors,
  ];
  // Validation for moving a card
export const validateCardMove = [
    body('newColumnId')
      .isInt().withMessage('newColumnId must be an integer'),
    body('newPosition')
      .isInt().withMessage('newPosition must be an integer (starting from 0)'),
    handleValidationErrors,
  ];
  
  // Validation for moving a column
  export const validateColumnMove = [
    body('newPosition')
      .isInt().withMessage('newPosition must be an integer (starting from 0)'),
    handleValidationErrors,
  ];

  // Validation for inviting a user
export const validateInvite = [
  body('userId')
    .isInt().withMessage('userId must be an integer'),
  handleValidationErrors,
];

// Validation for removing a user (param check)
export const validateRemoveMember = [
  param('userId').isInt().withMessage('User ID must be an integer'),
  param('boardId').isInt().withMessage('Board ID must be an integer'),
  handleValidationErrors,
];