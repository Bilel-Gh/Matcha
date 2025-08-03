const logger = {
  error: (message: string, error?: any) => {
    console.error('🚨 [SERVER ERROR]', message);
    if (error) {
      console.error('Error details:', error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  },
  info: (message: string) => {
  },
  warn: (message: string) => {
  },
  debug: (message: string) => {
  },
};

export default logger;
