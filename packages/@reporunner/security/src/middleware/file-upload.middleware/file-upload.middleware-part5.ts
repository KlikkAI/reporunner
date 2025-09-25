async function calculateFileHash(filePath: string, algorithm: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Sanitize filename
 */
function sanitizeFilenameString(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);

  // Remove special characters except dots and hyphens
  let sanitized = basename.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Remove multiple dots (prevent extension spoofing)
  sanitized = sanitized.replace(/\.{2,}/g, '_');

  // Ensure filename doesn't start with a dot (hidden file)
  if (sanitized.startsWith('.')) {
    sanitized = `_${sanitized.substring(1)}`;
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Create file cleanup middleware
 */
export function createFileCleanupMiddleware() {
  return async (err: any, req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Clean up uploaded files on error
    if (err) {
      const files = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];

      for (const file of files) {
        try {
          await unlinkAsync(file.path);
        } catch (_error) {}
      }
    }

    // Handle multer errors
    if (err instanceof MulterError) {
      let message = 'File upload error';

      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'File too large';
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Too many files';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected field';
          break;
      }

      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.FILE_UPLOAD_ERROR,
          message,
          details: err.message,
        },
      });
      return;
    }

    next(err);
  };
}

/**
 * Create file type validation middleware
 */
export function createFileTypeValidator(allowedTypes: Record<string, string[]>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const files = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];

    for (const file of files) {
      const fieldTypes = allowedTypes[file.fieldname];

      if (!fieldTypes) {
        res.status(400).json({
          success: false,
          error: {
