import { spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, createWriteStream, WriteStream } from 'fs';
import { join } from 'path';
import { unlink } from 'fs/promises';

const LOGS_DIR = 'logs';
const MAX_LINES_PER_FILE = 3000;
const LOG_RETENTION_DAYS = 7;

/**
 * Ensure logs directory exists
 */
function ensureLogsDirectory(): void {
  try {
    if (!existsSync(LOGS_DIR)) {
      mkdirSync(LOGS_DIR, { recursive: true });
      console.log(`Created logs directory: ${LOGS_DIR}`);
    }
  } catch (error) {
    console.error(`Failed to create logs directory: ${error}`);
    throw error;
  }
}

/**
 * Format timestamp as yyyyMMdd-HHmmss
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Generate unique log filename with collision avoidance
 */
function generateLogFilename(baseTimestamp: string): string {
  let filename = `${baseTimestamp}.log`;
  let counter = 1;

  while (existsSync(join(LOGS_DIR, filename))) {
    filename = `${baseTimestamp}-${counter}.log`;
    counter++;
  }

  return filename;
}

/**
 * Clean up log files older than LOG_RETENTION_DAYS
 */
async function cleanupOldLogs(): Promise<void> {
  try {
    if (!existsSync(LOGS_DIR)) {
      return;
    }

    const now = Date.now();
    const retentionMs = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const files = readdirSync(LOGS_DIR);

    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.log')) {
        continue;
      }

      const filePath = join(LOGS_DIR, file);

      try {
        const stats = statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > retentionMs) {
          await unlink(filePath);
          deletedCount++;
        }
      } catch (error) {
        console.warn(`Failed to process log file ${file}: ${error}`);
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old log file(s)`);
    }
  } catch (error) {
    console.error(`Failed to cleanup old logs: ${error}`);
  }
}

/**
 * Log rotator that creates new files when line count exceeds threshold
 */
class LogRotator {
  private currentStream: WriteStream | null = null;
  private lineCount = 0;
  private enabled = true;

  constructor() {
    this.rotate();
  }

  /**
   * Create a new log file
   */
  private rotate(): void {
    if (!this.enabled) {
      return;
    }

    try {
      // Close existing stream
      if (this.currentStream) {
        this.currentStream.end();
      }

      // Generate new filename
      const timestamp = formatTimestamp(new Date());
      const filename = generateLogFilename(timestamp);
      const filePath = join(LOGS_DIR, filename);

      // Create new stream
      this.currentStream = createWriteStream(filePath, { flags: 'a' });
      this.lineCount = 0;

      this.currentStream.on('error', (error) => {
        console.error(`Log file write error: ${error}`);
        this.enabled = false;
        this.currentStream = null;
      });

      console.log(`Logging to: ${filePath}`);
    } catch (error) {
      console.error(`Failed to rotate log file: ${error}`);
      this.enabled = false;
      this.currentStream = null;
    }
  }

  /**
   * Write data to current log file and handle rotation
   */
  write(data: Buffer | string): void {
    if (!this.enabled || !this.currentStream) {
      return;
    }

    try {
      const text = data.toString();

      // Write to current log file
      this.currentStream.write(data);

      // Count newlines
      const newLines = (text.match(/\n/g) || []).length;
      this.lineCount += newLines;

      // Rotate if threshold exceeded
      if (this.lineCount >= MAX_LINES_PER_FILE) {
        this.rotate();
      }
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
      this.enabled = false;
    }
  }

  /**
   * Close current log file
   */
  close(): void {
    if (this.currentStream) {
      this.currentStream.end();
      this.currentStream = null;
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Ensure logs directory exists
    ensureLogsDirectory();

    // Cleanup old logs
    await cleanupOldLogs();

    // Initialize log rotator
    const logRotator = new LogRotator();

    // Spawn next dev process
    console.log('Starting Next.js development server...\n');
    const devProcess = spawn('next', ['dev'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    // Pipe stdout to both console and log file
    devProcess.stdout?.on('data', (data: Buffer) => {
      process.stdout.write(data);
      logRotator.write(data);
    });

    // Pipe stderr to both console and log file
    devProcess.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data);
      logRotator.write(data);
    });

    // Handle process exit
    devProcess.on('exit', (code) => {
      logRotator.close();
      process.exit(code ?? 0);
    });

    // Handle errors
    devProcess.on('error', (error) => {
      console.error(`Failed to start dev server: ${error}`);
      logRotator.close();
      process.exit(1);
    });

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\nShutting down development server...');
      logRotator.close();
      devProcess.kill('SIGINT');
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', () => {
      console.log('\nShutting down development server...');
      logRotator.close();
      devProcess.kill('SIGTERM');
    });

  } catch (error) {
    console.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error(`Unhandled error: ${error}`);
  process.exit(1);
});
