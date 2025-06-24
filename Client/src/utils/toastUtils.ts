// ✅ UTILITAIRES TOAST - Importation facile pour toute l'application
// Utilisable partout avec : import { showToastError, showToastSuccess } from '../utils/toastUtils';

export {
  showToastError,
  showToastSuccess,
  showToastWarning,
  showToastCustomInfo,
  showToastLoading,
  showToast
} from '../components/ToastContainer';

// Types utiles pour TypeScript
export interface ToastErrorOptions {
  title: string;
  error?: any;
  duration?: number;
}

export interface ToastSuccessOptions {
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastWarningOptions {
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastInfoOptions {
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastLoadingOptions {
  title: string;
  message?: string;
  duration?: number;
}

// ✅ EXEMPLES D'UTILISATION DANS LES COMMENTAIRES :

/**
 * EXEMPLES D'UTILISATION :
 *
 * // Import
 * import { showToastError, showToastSuccess, showToastWarning } from '../utils/toastUtils';
 *
 * // Erreur simple
 * showToastError("Failed to like user");
 *
 * // Erreur avec objet error
 * try {
 *   await likeUser(userId);
 * } catch (error) {
 *   showToastError("Failed to like user", error);
 * }
 *
 * // Succès
 * showToastSuccess("User liked successfully", "Profile updated!");
 *
 * // Avertissement
 * showToastWarning("Profile incomplete", "Please add more photos");
 *
 * // Information
 * showToastCustomInfo("Settings saved", "Your preferences have been updated");
 *
 * // Chargement
 * showToastLoading("Uploading photo", "Please wait...");
 */
