import { Request, Response, NextFunction } from 'express';
import { FileUploadMiddleware } from '../FileUploadMiddleware';
import { LocalStorageEngine } from '../storage/LocalStorageEngine';
import { BasicFileFilter } from '../filters/BasicFileFilter';
import { NoopTransform } from '../transforms/NoopTransform';
import { BasicFileValidator } from '../validators/BasicFileValidator';
import { UploadError } from '../errors/UploadError';
import { UploadedFile } from '../types/UploadedFile';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('FileUploadMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let uploadDir: string;
  let tempDir: string;

  beforeEach(async () => {
    // Setup temp directories
    uploadDir = join(tmpdir(), 'upload-test', 'uploads');
    tempDir = join(tmpdir(), 'upload-test', 'temp');

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });

    req = {
      headers: {
        'content-type': 'multipart/form-data'
      }
    };

    res = {};
    next = jest.fn();
  });

  afterEach(async () => {
    // Cleanup temp directories
    await fs.rm(join(tmpdir(), 'upload-test'), { recursive: true, force: true });
  });

  describe('Configuration', () => {
    it('should use default options when none provided', () => {
      const middleware = new FileUploadMiddleware();
      expect(middleware).toBeDefined();
    });

    it('should override default options', () => {
      const middleware = new FileUploadMiddleware({
        maxFileSize: 1024,
        maxFiles: 2,
        allowedTypes: ['image/png']
      });

      expect(middleware).toBeDefined();
    });
  });

  describe('File Processing', () => {
    let middleware: FileUploadMiddleware;
    let mockFile: UploadedFile;

    beforeEach(() => {
      middleware = new FileUploadMiddleware({
        uploadDir,
        tempDir
      });

      mockFile = {
        originalname: 'test.jpg',
        filename: 'test.jpg',
        path: join(tempDir, 'test.jpg'),
        size: 1024,
        mimetype: 'image/jpeg',
        modified: false,
        uploadedAt: new Date()
      };
    });

    it('should process valid file upload', async () => {
      // Create test file
      await fs.writeFile(mockFile.path, 'test content');

      // Mock request with file
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.files).toBeDefined();
      expect(req.files?.[0].path).toContain(uploadDir);
    });

    it('should reject files exceeding size limit', async () => {
      middleware = new FileUploadMiddleware({
        maxFileSize: 500, // 500 bytes
        uploadDir,
        tempDir
      });

      // Create large test file
      mockFile.size = 1000;
      await fs.writeFile(mockFile.path, Buffer.alloc(1000));

      // Mock request with file
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UploadError));
      const error = next.mock.calls[0][0] as UploadError;
      expect(error.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject disallowed file types', async () => {
      middleware = new FileUploadMiddleware({
        allowedTypes: ['image/png'],
        uploadDir,
        tempDir
      });

      // Create test file
      await fs.writeFile(mockFile.path, 'test content');

      // Mock request with file
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UploadError));
      const error = next.mock.calls[0][0] as UploadError;
      expect(error.code).toBe('FILE_NOT_ALLOWED');
    });

    it('should handle multiple files', async () => {
      middleware = new FileUploadMiddleware({
        maxFiles: 2,
        uploadDir,
        tempDir
      });

      const mockFile2 = {
        ...mockFile,
        originalname: 'test2.jpg',
        filename: 'test2.jpg',
        path: join(tempDir, 'test2.jpg')
      };

      // Create test files
      await fs.writeFile(mockFile.path, 'test content 1');
      await fs.writeFile(mockFile2.path, 'test content 2');

      // Mock request with files
      req.files = [mockFile, mockFile2];

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.files).toBeDefined();
      expect(req.files).toHaveLength(2);
    });

    it('should reject too many files', async () => {
      middleware = new FileUploadMiddleware({
        maxFiles: 1,
        uploadDir,
        tempDir
      });

      const mockFile2 = {
        ...mockFile,
        originalname: 'test2.jpg',
        filename: 'test2.jpg',
        path: join(tempDir, 'test2.jpg')
      };

      // Create test files
      await fs.writeFile(mockFile.path, 'test content 1');
      await fs.writeFile(mockFile2.path, 'test content 2');

      // Mock request with files
      req.files = [mockFile, mockFile2];

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UploadError));
      const error = next.mock.calls[0][0] as UploadError;
      expect(error.code).toBe('TOO_MANY_FILES');
    });
  });

  describe('Storage Engines', () => {
    it('should use custom storage engine', async () => {
      const mockStorage = {
        store: jest.fn().mockResolvedValue({ path: 'stored/file.jpg' }),
        remove: jest.fn(),
        exists: jest.fn(),
        stat: jest.fn(),
        createReadStream: jest.fn(),
        createWriteStream: jest.fn(),
        move: jest.fn(),
        copy: jest.fn()
      };

      const middleware = new FileUploadMiddleware({
        storage: mockStorage
      });

      const mockFile = {
        originalname: 'test.jpg',
        filename: 'test.jpg',
        path: join(tempDir, 'test.jpg'),
        size: 1024,
        mimetype: 'image/jpeg',
        modified: false,
        uploadedAt: new Date()
      };

      await fs.writeFile(mockFile.path, 'test content');
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(mockStorage.store).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      const mockStorage = {
        store: jest.fn().mockRejectedValue(new Error('Storage error')),
        remove: jest.fn(),
        exists: jest.fn(),
        stat: jest.fn(),
        createReadStream: jest.fn(),
        createWriteStream: jest.fn(),
        move: jest.fn(),
        copy: jest.fn()
      };

      const middleware = new FileUploadMiddleware({
        storage: mockStorage
      });

      const mockFile = {
        originalname: 'test.jpg',
        filename: 'test.jpg',
        path: join(tempDir, 'test.jpg'),
        size: 1024,
        mimetype: 'image/jpeg',
        modified: false,
        uploadedAt: new Date()
      };

      await fs.writeFile(mockFile.path, 'test content');
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('File Transformations', () => {
    it('should apply file transformations', async () => {
      const mockTransform = {
        transform: jest.fn().mockImplementation(file => ({
          ...file,
          modified: true,
          metadata: { transformed: true }
        }))
      };

      const middleware = new FileUploadMiddleware({
        transform: mockTransform,
        uploadDir,
        tempDir
      });

      const mockFile = {
        originalname: 'test.jpg',
        filename: 'test.jpg',
        path: join(tempDir, 'test.jpg'),
        size: 1024,
        mimetype: 'image/jpeg',
        modified: false,
        uploadedAt: new Date()
      };

      await fs.writeFile(mockFile.path, 'test content');
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(mockTransform.transform).toHaveBeenCalled();
      expect(req.files?.[0].modified).toBe(true);
      expect(req.files?.[0].metadata).toEqual({ transformed: true });
    });

    it('should handle transformation errors', async () => {
      const mockTransform = {
        transform: jest.fn().mockRejectedValue(new Error('Transform error'))
      };

      const middleware = new FileUploadMiddleware({
        transform: mockTransform,
        uploadDir,
        tempDir
      });

      const mockFile = {
        originalname: 'test.jpg',
        filename: 'test.jpg',
        path: join(tempDir, 'test.jpg'),
        size: 1024,
        mimetype: 'image/jpeg',
        modified: false,
        uploadedAt: new Date()
      };

      await fs.writeFile(mockFile.path, 'test content');
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('File Validation', () => {
    it('should validate files', async () => {
      const mockValidator = {
        validate: jest.fn(),
        addRule: jest.fn(),
        removeRule: jest.fn()
      };

      const middleware = new FileUploadMiddleware({
        validator: mockValidator,
        uploadDir,
        tempDir
      });

      const mockFile = {
        originalname: 'test.jpg',
        filename: 'test.jpg',
        path: join(tempDir, 'test.jpg'),
        size: 1024,
        mimetype: 'image/jpeg',
        modified: false,
        uploadedAt: new Date()
      };

      await fs.writeFile(mockFile.path, 'test content');
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(mockValidator.validate).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const mockValidator = {
        validate: jest.fn().mockRejectedValue(
          UploadError.validationError('test.jpg', ['Invalid file'])
        ),
        addRule: jest.fn(),
        removeRule: jest.fn()
      };

      const middleware = new FileUploadMiddleware({
        validator: mockValidator,
        uploadDir,
        tempDir
      });

      const mockFile = {
        originalname: 'test.jpg',
        filename: 'test.jpg',
        path: join(tempDir, 'test.jpg'),
        size: 1024,
        mimetype: 'image/jpeg',
        modified: false,
        uploadedAt: new Date()
      };

      await fs.writeFile(mockFile.path, 'test content');
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UploadError));
      const error = next.mock.calls[0][0] as UploadError;
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should clean up files on error', async () => {
      const mockStorage = {
        store: jest.fn().mockRejectedValue(new Error('Storage error')),
        remove: jest.fn(),
        exists: jest.fn(),
        stat: jest.fn(),
        createReadStream: jest.fn(),
        createWriteStream: jest.fn(),
        move: jest.fn(),
        copy: jest.fn()
      };

      const middleware = new FileUploadMiddleware({
        storage: mockStorage,
        uploadDir,
        tempDir
      });

      const mockFile = {
        originalname: 'test.jpg',
        filename: 'test.jpg',
        path: join(tempDir, 'test.jpg'),
        size: 1024,
        mimetype: 'image/jpeg',
        modified: false,
        uploadedAt: new Date()
      };

      await fs.writeFile(mockFile.path, 'test content');
      req.files = [mockFile];

      await middleware.handle(req as Request, res as Response, next);

      expect(mockStorage.remove).toHaveBeenCalled();
    });

    it('should handle missing content type', async () => {
      const middleware = new FileUploadMiddleware();
      req.headers = {};

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UploadError));
      const error = next.mock.calls[0][0] as UploadError;
      expect(error.code).toBe('INVALID_CONTENT_TYPE');
    });

    it('should handle unsupported content types', async () => {
      const middleware = new FileUploadMiddleware();
      req.headers = {
        'content-type': 'unsupported/type'
      };

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UploadError));
      const error = next.mock.calls[0][0] as UploadError;
      expect(error.code).toBe('UNSUPPORTED_CONTENT_TYPE');
    });
  });
});