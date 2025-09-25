const filePath = path.join(options.basePath, filename);

// Verify file is within allowed paths
const resolvedPath = path.resolve(filePath);
const resolvedBase = path.resolve(options.basePath);

if (!resolvedPath.startsWith(resolvedBase)) {
  res.status(403).json({
    success: false,
    error: {
      code: ERROR_CODES.FORBIDDEN,
      message: 'Access denied',
    },
  });
  return;
}

// Check if file exists
try {
  await statAsync(resolvedPath);
} catch (_error) {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: 'File not found',
    },
  });
  return;
}

// Log download if enabled
if (options.logDownloads && (global as any).auditLogger) {
  await (global as any).auditLogger.log({
    type: 'FILE_DOWNLOADED',
    severity: 'LOW',
    userId: (req as any).user?.id,
    action: 'File download',
    result: 'SUCCESS',
    details: { filename },
  });
}

// Set security headers
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('Content-Security-Policy', "default-src 'none'");

// Send file
res.download(resolvedPath, path.basename(filename), (err) => {
  if (err) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to download file',
        },
      });
    }
  }
});
} catch (error)
{
  next(error);
}
}
}
