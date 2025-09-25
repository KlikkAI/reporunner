single: (fieldName: string) => createUploadHandler(upload.single(fieldName), config), array;
: (fieldName: string, maxCount?: number) =>
      createUploadHandler(upload.array(fieldName, maxCount), config),
    fields: (fields: multer.Field[]) => createUploadHandler(upload.fields(fields), config),
    any: () => createUploadHandler(upload.any(), config),
  }
}

/**
 * Create upload handler with additional security checks
 */
function createUploadHandler(multerMiddleware: any, config: FileUploadConfig) {
  return [
    multerMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];

        if (files.length === 0) {
          return next();
        }

        // Process each uploaded file
        const processedFiles: UploadedFile[] = [];
        const errors: string[] = [];

        for (const file of files) {
          try {
            // Validate magic numbers
            if (config.validateMagicNumbers) {
              const isValid = await validateMagicNumber(file.path, file.mimetype);
              if (!isValid) {
                errors.push(`File ${file.originalname} content does not match declared MIME type`);
                await unlinkAsync(file.path);
                continue;
              }
            }

            // Scan for viruses
            let virusScanResult;
            if (config.scanForVirus) {
              virusScanResult = await scanFileForVirus(file.path, config.clamavPath);
              if (!virusScanResult.clean) {
                errors.push(
                  `File ${file.originalname} contains malware: ${virusScanResult.threat}`
                );
                await unlinkAsync(file.path);
                continue;
              }
            }

            // Calculate file hash
            let hash;
            if (config.hashAlgorithm) {
              hash = await calculateFileHash(file.path, config.hashAlgorithm);
            }

            // Create file metadata
            let metadata;
            if (config.metadata) {
              metadata = {
                uploadedAt: new Date(),
                uploadedBy: (req as any).user?.id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                virusScanResult,
              };
            }

            processedFiles.push({
              ...file,
              hash,
              metadata,
            } as UploadedFile);
          } catch (error: any) {
            errors.push(`Error processing file ${file.originalname}: ${error.message}`);
            await unlinkAsync(file.path).catch(() => {});
          }
        }

        if (errors.length > 0 && processedFiles.length === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: ERROR_CODES.FILE_UPLOAD_ERROR,
              message: 'File upload failed',
              details: errors,
            },
          });
        }

        // Attach processed files to request
        if (req.file) {
          req.file = processedFiles[0] as any;
        } else {
          req.files = processedFiles as any;
        }

        // Log upload audit event if audit logger is available
        if ((global as any).auditLogger) {
