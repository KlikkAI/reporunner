await (global as any).auditLogger.log({
  type: 'FILE_UPLOADED',
  severity: 'LOW',
  userId: (req as any).user?.id,
  action: 'File upload',
  result: 'SUCCESS',
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

        next()
} catch (error)
{
  next(error);
}
},
  ]
}

/**
 * Validate magic number of file
 */
async
function validateMagicNumber(filePath: string, mimeType: string): Promise<boolean> {
  const signatures = MAGIC_NUMBERS[mimeType];
  if (!signatures || signatures.length === 0) {
    // No signature to validate against
    return true;
  }

  const buffer = Buffer.alloc(Math.max(...signatures.map((s) => s.length)));
  const fd = fs.openSync(filePath, 'r');

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
  clamavPath?: string
): Promise<{
  scanned: boolean;
  clean: boolean;
  threat?: string;
}> {
  if (!clamavPath || !fs.existsSync(clamavPath)) {
    return { scanned: false, clean: true };
  }

  try {
    const { stdout, stderr } = await execAsync(`${clamavPath} --no-summary "${filePath}"`);

    if (stderr) {
    }

    const output = stdout.toLowerCase();
    const clean = output.includes('ok') && !output.includes('found');

    if (!clean) {
      // Extract threat name
      const match = output.match(/: (.+) found/i);
      const threat = match ? match[1] : 'Unknown threat';
      return { scanned: true, clean: false, threat };
    }

    return { scanned: true, clean: true };
  } catch (error: any) {
    // ClamAV returns exit code 1 if virus is found
    if (error.code === 1) {
      const match = error.stdout?.match(/: (.+) found/i);
      const threat = match ? match[1] : 'Unknown threat';
      return { scanned: true, clean: false, threat };
    }
    return { scanned: false, clean: true };
  }
}

/**
 * Calculate file hash
 */
