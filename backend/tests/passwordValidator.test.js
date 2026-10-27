const { validatePassword, COMMON_PASSWORDS } = require('../src/utils/passwordValidator');

describe('Strong Password Validator Rules', () => {
  describe('Length requirements (8 to 64 characters)', () => {
    test('rejects passwords shorter than 8 characters', () => {
      const res = validatePassword('Aa1!bcd');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/between 8 and 64 characters/i);
    });

    test('rejects passwords longer than 64 characters', () => {
      const longPass = 'A1!' + 'a'.repeat(65);
      const res = validatePassword(longPass);
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/between 8 and 64 characters/i);
    });

    test('accepts password of boundary length 8 and 64', () => {
      const pass8 = 'Abc#1234';
      expect(validatePassword(pass8).isValid).toBe(true);

      const pass64 = 'Abc#1234' + 'x'.repeat(56);
      expect(pass64.length).toBe(64);
      expect(validatePassword(pass64).isValid).toBe(true);
    });
  });

  describe('Character composition (Uppercase, Lowercase, Number, Special)', () => {
    test('rejects passwords with numbers only', () => {
      const res = validatePassword('1234567890');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/numbers only/i);
    });

    test('rejects passwords with letters only', () => {
      const res = validatePassword('Abcdefghijk');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/letters only/i);
    });

    test('rejects passwords missing uppercase letter', () => {
      const res = validatePassword('lower#1234');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/uppercase/i);
    });

    test('rejects passwords missing lowercase letter', () => {
      const res = validatePassword('UPPER#1234');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/lowercase/i);
    });

    test('rejects passwords missing numbers', () => {
      const res = validatePassword('Abcdefgh#$');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/number/i);
    });

    test('rejects passwords missing special character', () => {
      const res = validatePassword('Abcdefgh12');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/special character/i);
    });
  });

  describe('Rejection of username inclusion (case-insensitive)', () => {
    test('rejects password containing username in exact case', () => {
      const res = validatePassword('admin#Secure1', 'admin');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/must not contain the username/i);
    });

    test('rejects password containing username in mixed case', () => {
      const res = validatePassword('SuperAdmin@2026', 'admin');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/must not contain the username/i);
    });

    test('rejects password containing username when username has mixed case', () => {
      const res = validatePassword('Welcome_kebele01!2', 'Kebele01');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/must not contain the username/i);
    });

    test('accepts strong password that does not contain username', () => {
      const res = validatePassword('Strong#Pass2026', 'kebele_officer');
      expect(res.isValid).toBe(true);
    });
  });

  describe('Rejection of common passwords blacklist', () => {
    test('rejects Password@123', () => {
      const res = validatePassword('Password@123');
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/common.*blacklist|too common/i);
    });

    test('rejects case-insensitive variations like password@123 or PASSWORD@123', () => {
      expect(validatePassword('password@123').isValid).toBe(false);
      expect(validatePassword('PASSWORD@123').isValid).toBe(false);
    });

    test('rejects Admin@123, Welcome@123, and Secret@123', () => {
      expect(validatePassword('Admin@123').isValid).toBe(false);
      expect(validatePassword('Welcome@123').isValid).toBe(false);
      expect(validatePassword('Secret@123').isValid).toBe(false);
    });
  });

  describe('Accepts compliant strong passwords', () => {
    test('accepts strong, compliant passwords', () => {
      expect(validatePassword('Tegbared#2026$Ok', 'officer1').isValid).toBe(true);
      expect(validatePassword('N-Shewa!Secure88', 'manager').isValid).toBe(true);
      expect(validatePassword('DebreBerhan@891', 'admin_nsz').isValid).toBe(true);
    });
  });
});
