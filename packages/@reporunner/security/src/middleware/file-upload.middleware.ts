import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback, MulterError } from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { promisify } from "util";
import { exec } from "child_process";
import { ERROR_CODES } from "@reporunner/constants";

const execAsync = promisify(exec);
const unlinkAsync = promisify(fs.unlink);
const statAsync = promisify(fs.stat);

export interface FileUploadConfig {
  destination?: string;
  maxFileSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  blockedExtensions?: string[];
  preserveExtension?: boolean;
  generateUniqueName?: boolean;
  scanForVirus?: boolean;
  clamavPath?: string;
  validateMagicNumbers?: boolean;
  sanitizeFilename?: boolean;
  metadata?: boolean;
  hashAlgorithm?: "md5" | "sha1" | "sha256" | "sha512";
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  hash?: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  uploadedAt: Date;
  uploadedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  virusScanResult?: {
    scanned: boolean;
    clean: boolean;
    threat?: string;
  };
}

/**
 * Magic number signatures for file type validation
 */
const MAGIC_NUMBERS: Record<string, Buffer[]> = {
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png": [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "image/gif": [Buffer.from("GIF87a"), Buffer.from("GIF89a")],
  "image/webp": [Buffer.from("RIFF"), Buffer.from("WEBP")],
  "application/pdf": [Buffer.from([0x25, 0x50, 0x44, 0x46])],
  "application/zip": [
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),
  ],
  "application/x-rar": [Buffer.from("Rar!")],
  "application/x-7z-compressed": [
    Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]),
  ],
  "application/gzip": [Buffer.from([0x1f, 0x8b])],
  "text/plain": [
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from([0xff, 0xfe]),
    Buffer.from([0xfe, 0xff]),
  ],
  "application/msword": [
    Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  ],
  "application/vnd.openxmlformats-officedocument": [
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  ],
};

/**
 * Dangerous file extensions that should always be blocked
 */
const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".dll",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".vbs",
  ".vbe",
  ".js",
  ".jse",
  ".ws",
  ".wsf",
  ".wsc",
  ".wsh",
  ".ps1",
  ".ps1xml",
  ".ps2",
  ".ps2xml",
  ".psc1",
  ".psc2",
  ".msh",
  ".msh1",
  ".msh2",
  ".mshxml",
  ".msh1xml",
  ".msh2xml",
  ".scf",
  ".lnk",
  ".inf",
  ".reg",
  ".app",
  ".pif",
  ".hta",
  ".cpl",
  ".msc",
  ".jar",
  ".sh",
];

/**
 * Create secure file upload middleware
 */
export function createFileUploadMiddleware(config: FileUploadConfig = {}) {
  const {
    destination = "/tmp/uploads",
    maxFileSize = 10 * 1024 * 1024, // 10 MB
    maxFiles = 10,
    allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".pdf"],
    blockedExtensions = DANGEROUS_EXTENSIONS,
    preserveExtension = true,
    generateUniqueName = true,
    scanForVirus = false,
    clamavPath = "/usr/bin/clamscan",
    validateMagicNumbers = true,
    sanitizeFilename = true,
    metadata = true,
    hashAlgorithm = "sha256",
  } = config;

  // Ensure upload directory exists
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const sanitized = sanitizeFilename
        ? sanitizeFilenameString(file.originalname)
        : file.originalname;

      if (generateUniqueName) {
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
        const ext = preserveExtension ? path.extname(sanitized) : "";
        cb(null, `${path.basename(sanitized, ext)}-${uniqueSuffix}${ext}`);
      } else {
        cb(null, sanitized);
      }
    },
  });

  // File filter
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    // Check MIME type
    if (
      allowedMimeTypes.length > 0 &&
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      return cb(new Error(`File type ${file.mimetype} is not allowed`));
    }

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();

    // Block dangerous extensions
    if (blockedExtensions.includes(ext)) {
      return cb(
        new Error(`File extension ${ext} is blocked for security reasons`),
      );
    }

    // Check allowed extensions
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
      return cb(new Error(`File extension ${ext} is not allowed`));
    }

    // Sanitize filename for path traversal attempts
    if (
      file.originalname.includes("../") ||
      file.originalname.includes("..\\")
    ) {
      return cb(new Error("Invalid filename"));
    }

    cb(null, true);
  };

  // Create multer instance
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
    },
  });

  return {
    single: (fieldName: string) =>
      createUploadHandler(upload.single(fieldName), config),
    array: (fieldName: string, maxCount?: number) =>
      createUploadHandler(upload.array(fieldName, maxCount), config),
    fields: (fields: multer.Field[]) =>
      createUploadHandler(upload.fields(fields), config),
    any: () => createUploadHandler(upload.any(), config),
  };
}

/**
 * Create upload handler with additional security checks
 */
function createUploadHandler(multerMiddleware: any, config: FileUploadConfig) {
  return [
    multerMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.file
          ? [req.file]
          : (req.files as Express.Multer.File[]) || [];

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
              const isValid = await validateMagicNumber(
                file.path,
                file.mimetype,
              );
              if (!isValid) {
                errors.push(
                  `File ${file.originalname} content does not match declared MIME type`,
                );
                await unlinkAsync(file.path);
                continue;
              }
            }

            // Scan for viruses
            let virusScanResult;
            if (config.scanForVirus) {
              virusScanResult = await scanFileForVirus(
                file.path,
                config.clamavPath,
              );
              if (!virusScanResult.clean) {
                errors.push(
                  `File ${file.originalname} contains malware: ${virusScanResult.threat}`,
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
                userAgent: req.headers["user-agent"],
                virusScanResult,
              };
            }

            processedFiles.push({
              ...file,
              hash,
              metadata,
            } as UploadedFile);
          } catch (error: any) {
            errors.push(
              `Error processing file ${file.originalname}: ${error.message}`,
            );
            await unlinkAsync(file.path).catch(() => {});
          }
        }

        if (errors.length > 0 && processedFiles.length === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: ERROR_CODES.FILE_UPLOAD_ERROR,
              message: "File upload failed",
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
          await (global as any).auditLogger.log({
            type: "FILE_UPLOADED",
            severity: "LOW",
            userId: (req as any).user?.id,
            action: "File upload",
            result: "SUCCESS",
            details: {
              files: processedFiles.map((f) => ({
                filename: f.filename,
                originalname: f.originalname,
                size: f.size,
                mimetype: f.mimetype,
                hash: f.hash,
              })),
            },
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    },
  ];
}

/**
 * Validate magic number of file
 */
async function validateMagicNumber(
  filePath: string,
  mimeType: string,
): Promise<boolean> {
  const signatures = MAGIC_NUMBERS[mimeType];
  if (!signatures || signatures.length === 0) {
    // No signature to validate against
    return true;
  }

  const buffer = Buffer.alloc(Math.max(...signatures.map((s) => s.length)));
  const fd = fs.openSync(filePath, "r");

  try {
    fs.readSync(fd, buffer, 0, buffer.length, 0);

    for (const signature of signatures) {
      if (buffer.slice(0, signature.length).equals(signature)) {
        return true;
      }
    }

    return false;
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Scan file for viruses using ClamAV
 */
async function scanFileForVirus(
  filePath: string,
  clamavPath?: string,
): Promise<{
  scanned: boolean;
  clean: boolean;
  threat?: string;
}> {
  if (!clamavPath || !fs.existsSync(clamavPath)) {
    return { scanned: false, clean: true };
  }

  try {
    const { stdout, stderr } = await execAsync(
      `${clamavPath} --no-summary "${filePath}"`,
    );

    if (stderr) {
      console.error("ClamAV stderr:", stderr);
    }

    const output = stdout.toLowerCase();
    const clean = output.includes("ok") && !output.includes("found");

    if (!clean) {
      // Extract threat name
      const match = output.match(/: (.+) found/i);
      const threat = match ? match[1] : "Unknown threat";
      return { scanned: true, clean: false, threat };
    }

    return { scanned: true, clean: true };
  } catch (error: any) {
    // ClamAV returns exit code 1 if virus is found
    if (error.code === 1) {
      const match = error.stdout?.match(/: (.+) found/i);
      const threat = match ? match[1] : "Unknown threat";
      return { scanned: true, clean: false, threat };
    }

    console.error("ClamAV error:", error);
    return { scanned: false, clean: true };
  }
}

/**
 * Calculate file hash
 */
async function calculateFileHash(
  filePath: string,
  algorithm: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

/**
 * Sanitize filename
 */
function sanitizeFilenameString(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);

  // Remove special characters except dots and hyphens
  let sanitized = basename.replace(/[^a-zA-Z0-9.-]/g, "_");

  // Remove multiple dots (prevent extension spoofing)
  sanitized = sanitized.replace(/\.{2,}/g, "_");

  // Ensure filename doesn't start with a dot (hidden file)
  if (sanitized.startsWith(".")) {
    sanitized = "_" + sanitized.substring(1);
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
      const files = req.file
        ? [req.file]
        : (req.files as Express.Multer.File[]) || [];

      for (const file of files) {
        try {
          await unlinkAsync(file.path);
        } catch (error) {
          console.error(`Failed to delete file ${file.path}:`, error);
        }
      }
    }

    // Handle multer errors
    if (err instanceof MulterError) {
      let message = "File upload error";

      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          message = "File too large";
          break;
        case "LIMIT_FILE_COUNT":
          message = "Too many files";
          break;
        case "LIMIT_UNEXPECTED_FILE":
          message = "Unexpected field";
          break;
      }

      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.FILE_UPLOAD_ERROR,
          message,
          details: err.message,
        },
      });
    }

    next(err);
  };
}

/**
 * Create file type validation middleware
 */
export function createFileTypeValidator(
  allowedTypes: Record<string, string[]>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.file
      ? [req.file]
      : (req.files as Express.Multer.File[]) || [];

    for (const file of files) {
      const fieldTypes = allowedTypes[file.fieldname];

      if (!fieldTypes) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Unexpected file field: ${file.fieldname}`,
          },
        });
      }

      if (!fieldTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Invalid file type for ${file.fieldname}. Allowed types: ${fieldTypes.join(", ")}`,
          },
        });
      }
    }

    next();
  };
}

/**
 * Create file size limiter per field
 */
export function createFieldSizeLimiter(limits: Record<string, number>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.file
      ? [req.file]
      : (req.files as Express.Multer.File[]) || [];

    for (const file of files) {
      const limit = limits[file.fieldname];

      if (limit && file.size > limit) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.FILE_TOO_LARGE,
            message: `File ${file.originalname} exceeds size limit for ${file.fieldname}`,
          },
        });
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
  } = { basePath: "/uploads" },
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication if required
      if (options.requireAuth && !(req as any).user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: "Authentication required",
          },
        });
      }

      // Get requested file path
      const filename = req.params.filename || req.query.filename;

      if (!filename || typeof filename !== "string") {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Filename is required",
          },
        });
      }

      // Prevent path traversal
      if (filename.includes("../") || filename.includes("..\\")) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.SECURITY_VIOLATION,
            message: "Invalid filename",
          },
        });
      }

      const filePath = path.join(options.basePath, filename);

      // Verify file is within allowed paths
      const resolvedPath = path.resolve(filePath);
      const resolvedBase = path.resolve(options.basePath);

      if (!resolvedPath.startsWith(resolvedBase)) {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: "Access denied",
          },
        });
      }

      // Check if file exists
      try {
        await statAsync(resolvedPath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "File not found",
          },
        });
      }

      // Log download if enabled
      if (options.logDownloads && (global as any).auditLogger) {
        await (global as any).auditLogger.log({
          type: "FILE_DOWNLOADED",
          severity: "LOW",
          userId: (req as any).user?.id,
          action: "File download",
          result: "SUCCESS",
          details: { filename },
        });
      }

      // Set security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'");

      // Send file
      res.download(resolvedPath, path.basename(filename), (err) => {
        if (err) {
          console.error("Download error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: {
                code: ERROR_CODES.INTERNAL_ERROR,
                message: "Failed to download file",
              },
            });
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
