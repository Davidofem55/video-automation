// Simple logger utility
export const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`);
    if (error) {
      console.error('Error details:', error.message);
      if (process.env.NODE_ENV !== 'production') {
        console.error('Stack:', error.stack);
      }
    }
  },

  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${message}`);
    if (data) console.warn(JSON.stringify(data, null, 2));
  },

  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[SUCCESS] ${timestamp} - ✅ ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },

  render: (stage, message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[RENDER] ${timestamp} - ${stage}: ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }
};

export default logger;
