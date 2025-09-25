'.psc2',
  '.msh',
  '.msh1',
  '.msh2',
  '.mshxml',
  '.msh1xml',
  '.msh2xml',
  '.scf',
  '.lnk',
  '.inf',
  '.reg',
  '.app',
  '.pif',
  '.hta',
  '.cpl',
  '.msc',
  '.jar',
  '.sh',
]

/**
 * Create secure file upload middleware
 */
export function createFileUploadMiddleware(config: FileUploadConfig = {}) {
  const {
    destination = '/tmp/uploads',
    maxFileSize = 10 * 1024 * 1024, // 10 MB
    maxFiles = 10,
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
    blockedExtensions = DANGEROUS_EXTENSIONS,
    preserveExtension = true,
    generateUniqueName = true,
    sanitizeFilename = true,
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
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const ext = preserveExtension ? path.extname(sanitized) : '';
        cb(null, `${path.basename(sanitized, ext)}-${uniqueSuffix}${ext}`);
      } else {
        cb(null, sanitized);
      }
    },
  });

  // File filter
  const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Check MIME type
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed`));
    }

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();

    // Block dangerous extensions
    if (blockedExtensions.includes(ext)) {
      return cb(new Error(`File extension ${ext} is blocked for security reasons`));
    }

    // Check allowed extensions
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
      return cb(new Error(`File extension ${ext} is not allowed`));
    }

    // Sanitize filename for path traversal attempts
    if (file.originalname.includes('../') || file.originalname.includes('..\\')) {
      return cb(new Error('Invalid filename'));
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
