/**
 * Logger Utility
 * Simple console-based logger with timestamps
 */

class Logger {
  constructor() {
    this.prefix = '[TokenScannerAPI]';
  }

  /**
   * Get formatted timestamp
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {Object} meta - Optional metadata
   */
  info(message, meta = null) {
    const timestamp = this.getTimestamp();
    console.log(`${timestamp} ${this.prefix} [INFO] ${message}`);
    if (meta) {
      console.log(JSON.stringify(meta, null, 2));
    }
  }

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {Object} meta - Optional metadata
   */
  error(message, meta = null) {
    const timestamp = this.getTimestamp();
    console.error(`${timestamp} ${this.prefix} [ERROR] ${message}`);
    if (meta) {
      console.error(JSON.stringify(meta, null, 2));
    }
  }

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {Object} meta - Optional metadata
   */
  warn(message, meta = null) {
    const timestamp = this.getTimestamp();
    console.warn(`${timestamp} ${this.prefix} [WARN] ${message}`);
    if (meta) {
      console.warn(JSON.stringify(meta, null, 2));
    }
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Message to log
   * @param {Object} meta - Optional metadata
   */
  debug(message, meta = null) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = this.getTimestamp();
      console.log(`${timestamp} ${this.prefix} [DEBUG] ${message}`);
      if (meta) {
        console.log(JSON.stringify(meta, null, 2));
      }
    }
  }
}

module.exports = new Logger();
