import { ValidationError } from './AppError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const validateString = (value: any, fieldName: string, options: { minLength?: number, maxLength?: number, regex?: RegExp, regexMessage?: string } = {}) => {
  const { minLength, maxLength, regex, regexMessage } = options;
  if (value === undefined || value === null) return; // Permet les champs optionnels

  if (typeof value !== 'string') {
    throw new ValidationError([`${fieldName} doit être une chaîne de caractères.`]);
  }
  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError([`${fieldName} doit contenir au moins ${minLength} caractères.`]);
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError([`${fieldName} ne doit pas dépasser ${maxLength} caractères.`]);
  }
  if (regex && !regex.test(value)) {
    throw new ValidationError([regexMessage || `${fieldName} a un format invalide.`]);
  }
};

const validateNumber = (value: any, fieldName: string, options: { min?: number, max?: number } = {}) => {
  const { min, max } = options;
  if (value === undefined || value === null) return; // Permet les champs optionnels

  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError([`${fieldName} doit être un nombre.`]);
  }
  if (min !== undefined && num < min) {
    throw new ValidationError([`${fieldName} doit être au moins ${min}.`]);
  }
  if (max !== undefined && num > max) {
    throw new ValidationError([`${fieldName} ne doit pas dépasser ${max}.`]);
  }
};

const validateArray = (value: any, fieldName: string, options: { minLength?: number, maxLength?: number } = {}) => {
  const { minLength, maxLength } = options;
  if (value === undefined || value === null) return; // Permet les champs optionnels

  if (!Array.isArray(value)) {
    throw new ValidationError([`${fieldName} doit être un tableau.`]);
  }
  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError([`${fieldName} doit contenir au moins ${minLength} éléments.`]);
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError([`${fieldName} ne doit pas dépasser ${maxLength} éléments.`]);
  }
};

// Validation pour l'inscription
export const validateRegister = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.email, 'email', { regex: EMAIL_REGEX, regexMessage: 'Format d\'email invalide.' });
    validateString(data.username, 'username', { minLength: 3, maxLength: 20, regex: USERNAME_REGEX, regexMessage: 'Le nom d\'utilisateur doit contenir 3-20 caractères alphanumériques et underscores.' });
    validateString(data.firstName, 'firstName', { minLength: 2, maxLength: 50 });
    validateString(data.lastName, 'lastName', { minLength: 2, maxLength: 50 });
    validateString(data.password, 'password', { minLength: 8, maxLength: 100 });
    validateString(data.birthDate, 'birthDate', { minLength: 1 });

    // Validation de l'âge (doit avoir au moins 18 ans)
    if (data.birthDate) {
      const birthDate = new Date(data.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        errors.push('Vous devez avoir au moins 18 ans pour vous inscrire.');
      }
    }

    // Validation du mot de passe
    if (data.password) {
      if (!/[A-Z]/.test(data.password)) {
        errors.push('Le mot de passe doit contenir au moins une lettre majuscule.');
      }
      if (!/[a-z]/.test(data.password)) {
        errors.push('Le mot de passe doit contenir au moins une lettre minuscule.');
      }
      if (!/[0-9]/.test(data.password)) {
        errors.push('Le mot de passe doit contenir au moins un chiffre.');
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la connexion
export const validateLogin = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.username, 'username', { minLength: 1 });
    validateString(data.password, 'password', { minLength: 1 });
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la récupération de mot de passe
export const validateForgotPassword = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.email, 'email', { regex: EMAIL_REGEX, regexMessage: 'Format d\'email invalide.' });
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la réinitialisation de mot de passe
export const validateResetPassword = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.token, 'token', { minLength: 1 });
    validateString(data.new_password, 'new_password', { minLength: 8, maxLength: 100 });

    // Validation du nouveau mot de passe
    if (data.new_password) {
      if (!/[A-Z]/.test(data.new_password)) {
        errors.push('Le mot de passe doit contenir au moins une lettre majuscule.');
      }
      if (!/[a-z]/.test(data.new_password)) {
        errors.push('Le mot de passe doit contenir au moins une lettre minuscule.');
      }
      if (!/[0-9]/.test(data.new_password)) {
        errors.push('Le mot de passe doit contenir au moins un chiffre.');
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la mise à jour du profil
export const validateProfileUpdate = (data: any) => {
  const errors: string[] = [];

  try {
    if (data.firstname !== undefined) {
      validateString(data.firstname, 'firstname', { minLength: 2, maxLength: 50 });
    }
    if (data.lastname !== undefined) {
      validateString(data.lastname, 'lastname', { minLength: 2, maxLength: 50 });
    }
    if (data.email !== undefined) {
      validateString(data.email, 'email', { regex: EMAIL_REGEX, regexMessage: 'Format d\'email invalide.' });
    }
    if (data.username !== undefined) {
      validateString(data.username, 'username', { minLength: 3, maxLength: 20, regex: USERNAME_REGEX, regexMessage: 'Le nom d\'utilisateur doit contenir 3-20 caractères alphanumériques et underscores.' });
    }
    if (data.gender !== undefined) {
      if (!['male', 'female', 'other'].includes(data.gender)) {
        errors.push('Le genre doit être male, female ou other.');
      }
    }
    if (data.sexual_preferences !== undefined) {
      if (!['male', 'female', 'both'].includes(data.sexual_preferences)) {
        errors.push('Les préférences sexuelles doivent être male, female ou both.');
      }
    }
    if (data.biography !== undefined) {
      validateString(data.biography, 'biography', { maxLength: 500 });
    }
    if (data.birth_date !== undefined) {
      validateString(data.birth_date, 'birth_date', { minLength: 1 });

      // Validation de l'âge
      const birthDate = new Date(data.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        errors.push('Vous devez avoir au moins 18 ans.');
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour le changement de mot de passe
export const validatePasswordChange = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.current_password, 'current_password', { minLength: 1 });
    validateString(data.new_password, 'new_password', { minLength: 8, maxLength: 100 });

    // Validation du nouveau mot de passe
    if (data.new_password) {
      if (!/[A-Z]/.test(data.new_password)) {
        errors.push('Le mot de passe doit contenir au moins une lettre majuscule.');
      }
      if (!/[a-z]/.test(data.new_password)) {
        errors.push('Le mot de passe doit contenir au moins une lettre minuscule.');
      }
      if (!/[0-9]/.test(data.new_password)) {
        errors.push('Le mot de passe doit contenir au moins un chiffre.');
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la création d'intérêt
export const validateInterestCreate = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.name, 'name', { minLength: 2, maxLength: 30 });
    if (data.tag !== undefined) {
      validateString(data.tag, 'tag', { maxLength: 50 });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la recherche d'intérêts
export const validateInterestSearch = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.q, 'q', { minLength: 1, maxLength: 100 });
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la mise à jour des intérêts utilisateur
export const validateUserInterestsUpdate = (data: any) => {
  const errors: string[] = [];

  try {
    validateArray(data.interests, 'interests', { maxLength: 10 });

    if (data.interests) {
      for (let i = 0; i < data.interests.length; i++) {
        const interestId = data.interests[i];
        if (typeof interestId !== 'number' || interestId <= 0) {
          errors.push(`L'ID d'intérêt à l'index ${i} doit être un nombre positif.`);
        }
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour l'ajout d'intérêt par nom
export const validateInterestAddByName = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.name, 'name', { minLength: 2, maxLength: 30 });
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la mise à jour de localisation
export const validateLocationUpdate = (data: any) => {
  const errors: string[] = [];

  try {
    validateNumber(data.latitude, 'latitude', { min: -90, max: 90 });
    validateNumber(data.longitude, 'longitude', { min: -180, max: 180 });
    validateString(data.source, 'source');

    if (data.source && !['gps', 'ip', 'manual'].includes(data.source)) {
      errors.push('La source doit être gps, ip ou manual.');
    }

    if (data.city !== undefined) {
      validateString(data.city, 'city', { maxLength: 100 });
    }
    if (data.country !== undefined) {
      validateString(data.country, 'country', { maxLength: 100 });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour le signalement d'utilisateur
export const validateReportUser = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.reason, 'reason', { minLength: 1, maxLength: 500 });
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour le blocage d'utilisateur
export const validateBlockUser = (data: any) => {
  const errors: string[] = [];

  try {
    if (data.reason !== undefined) {
      validateString(data.reason, 'reason', { maxLength: 255 });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour l'envoi de message
export const validateSendMessage = (data: any) => {
  const errors: string[] = [];

  try {
    validateNumber(data.receiverId, 'receiverId', { min: 1 });
    validateString(data.content, 'content', { minLength: 1, maxLength: 1000 });
    if (data.tempId !== undefined) {
      validateString(data.tempId, 'tempId', { minLength: 1 });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

// Validation pour la recherche de conversations
export const validateSearchConversations = (data: any) => {
  const errors: string[] = [];

  try {
    validateString(data.q, 'q', { minLength: 2, maxLength: 100 });
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(...error.details || []);
    } else {
      errors.push('Erreur de validation inattendue.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};
