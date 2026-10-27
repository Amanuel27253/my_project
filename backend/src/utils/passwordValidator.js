/**
 * Strong Password Validator
 * 
 * Rules:
 * - Length: 8 to 64 characters
 * - Must contain:
 *     - At least one uppercase letter (A-Z)
 *     - At least one lowercase letter (a-z)
 *     - At least one number (0-9)
 *     - At least one special character
 * - Rejected:
 *     - Numbers only
 *     - Letters only
 *     - Passwords that contain the username (case-insensitive)
 *     - Passwords on a short list of common passwords (e.g., Password@123, Admin@123)
 */

const COMMON_PASSWORDS = new Set([
  'password@123',
  'password123',
  'password1234',
  'password@1234',
  'password#123',
  'password@1',
  'p@ssword123',
  'p@ssword1',
  'p@$$w0rd',
  'admin@123',
  'admin@1234',
  'admin@12345',
  'admin@123456',
  'admin123',
  'admin123456',
  'administrator@123',
  'welcome@123',
  'welcome@1234',
  'welcome@1',
  'welcome123',
  'qwerty@123',
  'qwerty12345',
  '12345678',
  '123456789',
  '1234567890',
  'letmein@123',
  'changeme@123',
  'secret@123',
  'root@123',
  'pass@word1',
  'pass@1234'
]);

// Special character matcher: anything other than letters and digits
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

/**
 * Validates a password against strong security rules.
 * 
 * @param {string} password - The password to validate
 * @param {string} [username] - The optional username to check against
 * @returns {{ isValid: boolean, message?: string }}
 */
const validatePassword = (password, username = '') => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  // Length check: 8 to 64 characters
  if (password.length < 8 || password.length > 64) {
    return {
      isValid: false,
      message: 'Password must be between 8 and 64 characters long'
    };
  }

  // Reject numbers only
  if (/^\d+$/.test(password)) {
    return {
      isValid: false,
      message: 'Password cannot consist of numbers only'
    };
  }

  // Reject letters only
  if (/^[a-zA-Z]+$/.test(password)) {
    return {
      isValid: false,
      message: 'Password cannot consist of letters only'
    };
  }

  // Must contain uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter (A-Z)'
    };
  }

  // Must contain lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter (a-z)'
    };
  }

  // Must contain number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number (0-9)'
    };
  }

  // Must contain special character
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (!@#$%^&*...)'
    };
  }

  // Reject passwords that contain the username (case-insensitive)
  if (username && typeof username === 'string') {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length >= 2 && password.toLowerCase().includes(cleanUsername)) {
      return {
        isValid: false,
        message: 'Password must not contain the username'
      };
    }
  }

  // Reject common passwords
  if (COMMON_PASSWORDS.has(password.trim().toLowerCase())) {
    return {
      isValid: false,
      message: 'Password is too common and easily guessed. Please choose a more secure password'
    };
  }

  return { isValid: true };
};

module.exports = {
  validatePassword,
  COMMON_PASSWORDS
};
