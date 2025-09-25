import { exec } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { ERROR_CODES } from '@reporunner/constants';
import type { NextFunction, Request, Response } from 'express';
import multer, { type FileFilterCallback, MulterError } from 'multer';

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
  hashAlgorithm?: 'md5' | 'sha1' | 'sha256' | 'sha512';
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
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
  'application/zip': [Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from([0x50, 0x4b, 0x05, 0x06])],
  'application/x-rar': [Buffer.from('Rar!')],
  'application/x-7z-compressed': [Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])],
  'application/gzip': [Buffer.from([0x1f, 0x8b])],
  'text/plain': [
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from([0xff, 0xfe]),
    Buffer.from([0xfe, 0xff]),
  ],
  'application/msword': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  'application/vnd.openxmlformats-officedocument': [Buffer.from([0x50, 0x4b, 0x03, 0x04])],
};

/**
 * Dangerous file extensions that should always be blocked
 */
const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.dll',
  '.bat',
  '.cmd',
  '.com',
  '.scr',
  '.vbs',
  '.vbe',
  '.js',
  '.jse',
  '.ws',
  '.wsf',
  '.wsc',
  '.wsh',
  '.ps1',
  '.ps1xml',
  '.ps2',
  '.ps2xml',
  '.psc1',
