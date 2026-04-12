const log = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const icons = { info: 'ℹ️', warn: '⚠️', error: '❌', debug: '🐛', success: '✅' };
  console.log(`${icons[level] || '📋'} [${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
};

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
  success: (msg, meta) => log('success', msg, meta),
};
