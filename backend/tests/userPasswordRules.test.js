const { createUser, updateUser, resetPassword } = require('../src/controllers/userController');
const User = require('../src/models/User');

jest.mock('../src/models/User');
jest.mock('../middleware/audit', () => ({
  logAudit: jest.fn().mockResolvedValue({})
}), { virtual: true });

describe('Server-side password rules on user creation and reset', () => {
  let mockRes;
  let statusMock;
  let jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock
    };
    jest.clearAllMocks();
  });

  describe('createUser password validation', () => {
    test('rejects password shorter than 8 characters', async () => {
      const mockReq = {
        body: {
          fullName: 'Abebe Kebede',
          username: 'akebede',
          password: 'Aa1!sh',
          role: 'kebele_officer'
        }
      };

      await createUser(mockReq, mockRes);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/between 8 and 64 characters/i)
      }));
    });

    test('rejects password containing username', async () => {
      const mockReq = {
        body: {
          fullName: 'Abebe Kebede',
          username: 'akebede',
          password: 'akebede#Pass2026',
          role: 'kebele_officer'
        }
      };

      await createUser(mockReq, mockRes);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/must not contain the username/i)
      }));
    });

    test('rejects common passwords like Password@123', async () => {
      const mockReq = {
        body: {
          fullName: 'Abebe Kebede',
          username: 'akebede',
          password: 'Password@123',
          role: 'kebele_officer'
        }
      };

      await createUser(mockReq, mockRes);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/too common/i)
      }));
    });

    test('rejects password with letters only', async () => {
      const mockReq = {
        body: {
          fullName: 'Abebe Kebede',
          username: 'akebede',
          password: 'AlphaBetaGammaDelta',
          role: 'kebele_officer'
        }
      };

      await createUser(mockReq, mockRes);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/letters only/i)
      }));
    });

    test('accepts strong compliant password and creates user', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      User.hashPassword = jest.fn().mockResolvedValue('hashed_secret_pw');
      User.create = jest.fn().mockResolvedValue({
        _id: 'user123',
        fullName: 'Abebe Kebede',
        username: 'akebede',
        role: 'kebele_officer',
        toObject: () => ({
          _id: 'user123',
          fullName: 'Abebe Kebede',
          username: 'akebede',
          role: 'kebele_officer'
        })
      });

      const mockReq = {
        body: {
          fullName: 'Abebe Kebede',
          username: 'akebede',
          password: 'Secure#Pass2026!',
          role: 'kebele_officer'
        },
        user: { username: 'admin' },
        ip: '127.0.0.1'
      };

      await createUser(mockReq, mockRes);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringMatching(/created successfully/i)
      }));
    });
  });

  describe('resetPassword password validation', () => {
    test('rejects weak password on admin reset', async () => {
      User.findById = jest.fn().mockResolvedValue({
        _id: 'user456',
        username: 'store_manager'
      });

      const mockReq = {
        params: { id: 'user456' },
        body: { newPassword: '123' },
        user: { username: 'admin' }
      };

      await resetPassword(mockReq, mockRes);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/between 8 and 64 characters/i)
      }));
    });

    test('rejects reset password containing username', async () => {
      User.findById = jest.fn().mockResolvedValue({
        _id: 'user456',
        username: 'store_manager'
      });

      const mockReq = {
        params: { id: 'user456' },
        body: { newPassword: 'Store_Manager#2026' },
        user: { username: 'admin' }
      };

      await resetPassword(mockReq, mockRes);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/must not contain the username/i)
      }));
    });

    test('successfully resets password when strong password is provided', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      User.findById = jest.fn().mockResolvedValue({
        _id: 'user456',
        username: 'store_manager',
        failedLogins: 4,
        lockedUntil: new Date(),
        save: mockSave
      });
      User.hashPassword = jest.fn().mockResolvedValue('hashed_new_pw');

      const mockReq = {
        params: { id: 'user456' },
        body: { newPassword: 'W@rehouse#2026Key' },
        user: { username: 'admin' },
        ip: '127.0.0.1'
      };

      await resetPassword(mockReq, mockRes);

      expect(mockSave).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringMatching(/reset successfully/i)
      }));
    });
  });
});
