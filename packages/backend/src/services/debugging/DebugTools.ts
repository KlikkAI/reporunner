/**
 * Debug Tools Service
 * TODO: Implement debug tooling
 */

class DebugTools {
  globalDebugMode = false;

  enableDebugMode() {
    this.globalDebugMode = true;
  }

  disableDebugMode() {
    this.globalDebugMode = false;
  }
}

export const debugTools = new DebugTools();
