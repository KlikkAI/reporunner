export class Logger {
  static log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}
