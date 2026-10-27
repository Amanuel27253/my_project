export const COMMON_PASSWORDS = new Set([
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

export const validatePassword = (password, username = '') => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required',
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        notOnlyNumbersOrLetters: false,
        noUsername: true,
        notCommon: true
      }
    };
  }

  const lengthOk = password.length >= 8 && password.length <= 64;
  const uppercaseOk = /[A-Z]/.test(password);
  const lowercaseOk = /[a-z]/.test(password);
  const numberOk = /[0-9]/.test(password);
  const specialOk = /[^A-Za-z0-9]/.test(password);
  const notNumbersOnly = !/^\d+$/.test(password);
  const notLettersOnly = !/^[a-zA-Z]+$/.test(password);
  const notOnlyNumbersOrLetters = notNumbersOnly && notLettersOnly;

  let noUsername = true;
  if (username && typeof username === 'string') {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length >= 2 && password.toLowerCase().includes(cleanUsername)) {
      noUsername = false;
    }
  }

  const notCommon = !COMMON_PASSWORDS.has(password.trim().toLowerCase());

  let message = '';
  if (!lengthOk) {
    message = 'Password must be between 8 and 64 characters long.';
  } else if (!notOnlyNumbersOrLetters) {
    message = notNumbersOnly ? 'Password cannot consist of letters only.' : 'Password cannot consist of numbers only.';
  } else if (!uppercaseOk) {
    message = 'Password must contain at least one uppercase letter (A-Z).';
  } else if (!lowercaseOk) {
    message = 'Password must contain at least one lowercase letter (a-z).';
  } else if (!numberOk) {
    message = 'Password must contain at least one number (0-9).';
  } else if (!specialOk) {
    message = 'Password must contain at least one special character.';
  } else if (!noUsername) {
    message = 'Password must not contain the username.';
  } else if (!notCommon) {
    message = 'Password is on the common passwords blacklist and is too easy to guess.';
  }

  const isValid = lengthOk && uppercaseOk && lowercaseOk && numberOk && specialOk && notOnlyNumbersOrLetters && noUsername && notCommon;

  return {
    isValid,
    message,
    checks: {
      length: lengthOk,
      uppercase: uppercaseOk,
      lowercase: lowercaseOk,
      number: numberOk,
      special: specialOk,
      notOnlyNumbersOrLetters,
      noUsername,
      notCommon
    }
  };
};
