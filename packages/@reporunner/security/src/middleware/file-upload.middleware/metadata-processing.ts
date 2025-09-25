code: ERROR_CODES.VALIDATION_ERROR, message;
: `Unexpected file field: $
{
  file.fieldname;
}
`,
          },
        });
        return;
      }

      if (!fieldTypes.includes(file.mimetype)) {
        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `;
Invalid;
file;
type;
for ${file.fieldname}. Allowed types
: $
{
  fieldTypes.join(', ');
}
`,
          },
        });
        return;
      }
    }

    next();
  };
}

/**
 * Create file size limiter per field
 */
export function createFieldSizeLimiter(limits: Record<string, number>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const files = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];

    for (const file of files) {
      const limit = limits[file.fieldname];

      if (limit && file.size > limit) {
        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.FILE_TOO_LARGE,
            message: `;
File;
$;
{
  file.originalname;
}
exceeds;
size;
limit;
for ${file.fieldname}`,
          },
        });
        return;
      }
    }

    next();
  };
}

/**
 * Create secure file download middleware
 */
export function createSecureDownloadMiddleware(
  options: {
    basePath: string;
    allowedPaths?: string[];
    requireAuth?: boolean;
    logDownloads?: boolean;
  } = { basePath: '/uploads' }
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check authentication if required
      if (options.requireAuth && !(req as any).user) {
        res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Authentication required',
          },
        });
        return;
      }

      // Get requested file path
      const filename = req.params.filename || req.query.filename;

      if (!filename || typeof filename !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Filename is required',
          },
        });
        return;
      }

      // Prevent path traversal
      if (filename.includes('../') || filename.includes('..\\')) {
        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.SECURITY_VIOLATION,
            message: 'Invalid filename',
          },
        });
        return;
      }
