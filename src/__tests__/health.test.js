const request = require('supertest');
const app = require('../../src/app');

describe('Health Endpoints', () => {
  let expressApp;
  
  beforeAll(() => {
    expressApp = app;
  });
  
  it('should get API health status', async () => {
    const res = await request(expressApp).get('/api/health');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'OK');
    expect(res.body.data).toHaveProperty('database');
  });
  
  it('should get detailed health status', async () => {
    const res = await request(expressApp).get('/api/health/detailed');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('node_version');
    expect(res.body.data).toHaveProperty('platform');
  });
});
