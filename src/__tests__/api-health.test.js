const request = require('supertest');
const express = require('express');
const router = require('../routes/health');
const { successResponse } = require('../utils/response');

// Mock the response utility
jest.mock('../utils/response', () => ({
  successResponse: jest.fn((res, message, data) => res.json({ success: true, message, data }))
}));

describe('Health API Endpoints', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', router);
  });
  
  beforeEach(() => {
    successResponse.mockClear();
  });
  
  it('should have a GET /api/health endpoint', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(successResponse).toHaveBeenCalled();
  });
});
