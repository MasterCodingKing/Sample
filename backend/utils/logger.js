const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (from env or default to INFO)
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// Logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get log file path for today
const getLogFilePath = (type = 'app') => {
  const date = format(new Date(), 'yyyy-MM-dd');
  return path.join(logsDir, `${type}-${date}.log`);
};

// Format log message
const formatMessage = (level, message, meta = {}) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
};

// Write to file
const writeToFile = (filePath, message) => {
  try {
    fs.appendFileSync(filePath, message);
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
};

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  green: '\x1b[32m'
};

// Logger class
class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _log(level, levelName, color, message, meta = {}) {
    if (level > currentLevel) return;

    const contextMessage = `[${this.context}] ${message}`;
    const formattedMessage = formatMessage(levelName, contextMessage, meta);

    // Console output with color
    if (process.env.NODE_ENV !== 'production' || level <= LOG_LEVELS.WARN) {
      const coloredLevel = `${color}[${levelName}]${colors.reset}`;
      const timestamp = format(new Date(), 'HH:mm:ss.SSS');
      console.log(`${colors.gray}[${timestamp}]${colors.reset} ${coloredLevel} ${contextMessage}`);
      if (Object.keys(meta).length > 0) {
        console.log(colors.gray, meta, colors.reset);
      }
    }

    // File output
    writeToFile(getLogFilePath('app'), formattedMessage);

    // Error logs also go to separate error log file
    if (level === LOG_LEVELS.ERROR) {
      writeToFile(getLogFilePath('error'), formattedMessage);
    }
  }

  error(message, meta = {}) {
    this._log(LOG_LEVELS.ERROR, 'ERROR', colors.red, message, meta);
  }

  warn(message, meta = {}) {
    this._log(LOG_LEVELS.WARN, 'WARN', colors.yellow, message, meta);
  }

  info(message, meta = {}) {
    this._log(LOG_LEVELS.INFO, 'INFO', colors.blue, message, meta);
  }

  debug(message, meta = {}) {
    this._log(LOG_LEVELS.DEBUG, 'DEBUG', colors.gray, message, meta);
  }

  success(message, meta = {}) {
    this._log(LOG_LEVELS.INFO, 'SUCCESS', colors.green, message, meta);
  }

  // Log HTTP request
  request(req, responseTime, statusCode) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (req.user) {
      meta.userId = req.user.id;
      meta.role = req.user.role;
    }

    const level = statusCode >= 400 ? (statusCode >= 500 ? 'error' : 'warn') : 'info';
    this[level](`${req.method} ${req.originalUrl} ${statusCode}`, meta);

    // Write to access log
    writeToFile(getLogFilePath('access'), formatMessage('ACCESS', `${req.method} ${req.originalUrl} ${statusCode}`, meta));
  }

  // Log database query (for debugging)
  query(sql, duration) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      this.debug(`SQL Query (${duration}ms)`, { sql: sql.substring(0, 500) });
    }
  }

  // Log user activity
  activity(userId, action, details = {}) {
    const meta = { userId, action, ...details };
    this.info(`User activity: ${action}`, meta);
    writeToFile(getLogFilePath('activity'), formatMessage('ACTIVITY', action, meta));
  }
}

// Create child logger with context
const createLogger = (context) => new Logger(context);

// Default logger instance
const logger = new Logger('App');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, duration, res.statusCode);
  });
  
  next();
};

// Clean old log files (keep last N days)
const cleanOldLogs = (keepDays = 30) => {
  try {
    const files = fs.readdirSync(logsDir);
    const now = Date.now();
    const maxAge = keepDays * 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    logger.error('Failed to clean old logs', { error: error.message });
  }
};

module.exports = {
  logger,
  createLogger,
  requestLogger,
  cleanOldLogs,
  LOG_LEVELS
};
