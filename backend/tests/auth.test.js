require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Location = require('../src/models/Location');

describe('FR-AUTH: Authentication and User Security', () => {
  let zone;

  beforeEach(async () => {
    zone = await Location.create({
      name: 'North Shewa Zone',
      code: 'ETH-AM-NSZ',
      type: 'zone'
    });

    const pwd = await User.hashPassword('Admin@123456');
    await User.create({
      fullName: 'Test Admin',
      username: 'admin',
      passwordHash: pwd,
      role: 'admin',
      locationId: zone._id,
      status: 'active'
    });
  });

  test('FR-AUTH-01: Successful login issues JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('admin');
  });

  test('FR-AUTH-04: Block login for deactivated users', async () => {
    await User.updateOne({ username: 'admin' }, { status: 'inactive' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123456' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('FR-AUTH-05: Locks account after 5 failed login attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
    }

    // 6th attempt should return 423 Locked
    const lockedRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123456' });

    expect(lockedRes.status).toBe(423);
    expect(lockedRes.body.message).toMatch(/locked/i);
  });

  test('FR-AUTH-02: Change own password', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123456' });
    const token = loginRes.body.data.token;

    const changeRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Admin@123456',
        newPassword: 'NewAdmin@654321'
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.success).toBe(true);

    // Verify login with new password works
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'NewAdmin@654321' });

    expect(newLoginRes.status).toBe(200);
  });
});
