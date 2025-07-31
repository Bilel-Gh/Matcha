const logger = {
  error: (message: string, error?: any) => {
    // Afficher SEULEMENT les erreurs 500+ pour le debug - nécessaire pour voir les erreurs serveur
    console.error('🚨 [SERVER ERROR]', message);
    if (error) {
      console.error('Error details:', error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  },
  info: (message: string) => {
    // Silent logging for defense requirements - no console outputs allowed
  },
  warn: (message: string) => {
    // Silent logging for defense requirements - no console outputs allowed
  },
  debug: (message: string) => {
    // Silent logging for defense requirements - no console outputs allowed
  },
};

export default logger;
