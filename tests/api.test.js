const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Space = require('../models/Space');
const Testimonial = require('../models/Testimonial');
const RefreshToken = require('../models/RefreshToken');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Space.deleteMany({});
  await Testimonial.deleteMany({});
  await RefreshToken.deleteMany({});
});

describe('Proofly API Integration Tests', () => {
  describe('1. Authentication Flow', () => {
    it('should signup a new owner user and return access token + refresh token cookie', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('john@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should login an existing user and set httpOnly refresh token cookie', async () => {
      // Create user
      const passwordHash = await User.hashPassword('Password123!');
      await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        username: 'janedoe',
        passwordHash,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'jane@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=');
    });

    it('should rotate refresh token and return new access token', async () => {
      // Signup to get cookie
      const signupRes = await request(app).post('/api/auth/signup').send({
        name: 'Alice Smith',
        email: 'alice@example.com',
        username: 'alicesmith',
        password: 'Password123!',
      });

      const cookie = signupRes.headers['set-cookie'];

      // Request token refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', cookie);

      expect(refreshRes.statusCode).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body).toHaveProperty('accessToken');
      expect(refreshRes.headers['set-cookie']).toBeDefined();
    });
  });

  describe('2. Spaces Management (Owner Protected)', () => {
    let token;
    let user;

    beforeEach(async () => {
      const signupRes = await request(app).post('/api/auth/signup').send({
        name: 'Space Owner',
        email: 'owner@space.com',
        username: 'spaceowner',
        password: 'Password123!',
      });
      token = signupRes.body.accessToken;
      user = signupRes.body.user;
    });

    it('should create a new space for logged-in user', async () => {
      const res = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'My Cool Startup',
          slug: 'my-cool-startup',
          prompt: 'How was your experience using our app?',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.space.slug).toBe('my-cool-startup');
    });

    it('should fetch owner spaces with review counts', async () => {
      await Space.create({
        owner: user.id,
        name: 'Space 1',
        slug: 'space-1',
      });

      const res = await request(app)
        .get('/api/spaces')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.spaces.length).toBe(1);
      expect(res.body.spaces[0]).toHaveProperty('stats');
    });
  });

  describe('3. Public Review Submission & Moderation', () => {
    let token;
    let space;

    beforeEach(async () => {
      const signupRes = await request(app).post('/api/auth/signup').send({
        name: 'Review Moderator',
        email: 'mod@space.com',
        username: 'moduser',
        password: 'Password123!',
      });
      token = signupRes.body.accessToken;

      const spaceRes = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Public Test Space',
          slug: 'test-space',
        });
      space = spaceRes.body.space;
    });

    it('should allow public review submission without login (defaults to pending)', async () => {
      const res = await request(app)
        .post('/api/public/spaces/test-space/testimonials')
        .send({
          clientName: 'Bob Builder',
          email: 'bob@build.com',
          companyRole: 'Lead Contractor',
          rating: 5,
          reviewText: 'Outstanding service and high quality output!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.testimonial.status).toBe('pending');
    });

    it('should allow space owner to approve pending testimonial', async () => {
      const review = await Testimonial.create({
        space: space._id,
        clientName: 'Charlie',
        email: 'charlie@test.com',
        rating: 5,
        reviewText: 'Fantastic product!',
        status: 'pending',
      });

      const res = await request(app)
        .patch(`/api/testimonials/${review._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'approved' });

      expect(res.statusCode).toBe(200);
      expect(res.body.testimonial.status).toBe('approved');
    });

    it('should return approved testimonials on public wall and EXCLUDE customer email', async () => {
      await Testimonial.create({
        space: space._id,
        clientName: 'David Secret',
        email: 'david.private@secret.com',
        rating: 5,
        reviewText: 'Private email should never leak!',
        status: 'approved',
      });

      const res = await request(app).get('/api/public/spaces/test-space/wall');

      expect(res.statusCode).toBe(200);
      expect(res.body.testimonials.length).toBe(1);
      expect(res.body.testimonials[0].clientName).toBe('David Secret');
      expect(res.body.testimonials[0].email).toBeUndefined(); // EMAIL MUST BE OMITTED
    });
  });

  describe('4. Analytics & Embed Generator', () => {
    let token;
    let space;

    beforeEach(async () => {
      const signupRes = await request(app).post('/api/auth/signup').send({
        name: 'Analytics User',
        email: 'analytics@space.com',
        username: 'analyticsuser',
        password: 'Password123!',
      });
      token = signupRes.body.accessToken;

      const spaceRes = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Analytics Test Space',
          slug: 'analytics-space',
        });
      space = spaceRes.body.space;

      // Seed 2 approved testimonials (ratings 5 and 4)
      await Testimonial.create([
        {
          space: space._id,
          clientName: 'User A',
          email: 'a@test.com',
          rating: 5,
          reviewText: 'Awesome!',
          status: 'approved',
        },
        {
          space: space._id,
          clientName: 'User B',
          email: 'b@test.com',
          rating: 4,
          reviewText: 'Great!',
          status: 'approved',
        },
      ]);
    });

    it('should calculate summary analytics (average rating 4.5)', async () => {
      const res = await request(app)
        .get(`/api/analytics/${space._id}/summary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.summary.averageRating).toBe(4.5);
      expect(res.body.summary.approvedReviews).toBe(2);
    });

    it('should return valid embed widget configuration and HTML snippet', async () => {
      const res = await request(app).get('/api/public/spaces/analytics-space/embed?type=carousel&theme=dark');

      expect(res.statusCode).toBe(200);
      expect(res.body.embedConfig.type).toBe('carousel');
      expect(res.body.snippets.iframeCode).toContain('<iframe src=');
    });
  });
});
