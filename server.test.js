const request = require('supertest');
const app = require('./server'); // import the Express app

describe('Server API', () => {
  beforeEach(() => {
    const db = require('./db');
    if (db.__reset) db.__reset();
    jest.clearAllMocks();
  });

  test('POST /runTest returns 400 if no prompt is provided', async () => {
    const res = await request(app)
      .post('/runTest')
      .send({})
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/Missing "prompt"/i);
  });

  test('POST /runTest saves a run and returns the DB row', async () => {
    const promptText = 'Hello, test prompt';
    const res = await request(app)
      .post('/runTest')
      .send({ prompt: promptText })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('prompt', promptText);
    expect(res.body).toHaveProperty('status', 'completed');
    expect(res.body).toHaveProperty('result', 'This is a stubbed response for the provided prompt.');
    expect(res.body).toHaveProperty('created_at');
  });

  test('GET /getResults returns an array of runs', async () => {
    // Create a run first
    await request(app)
      .post('/runTest')
      .send({ prompt: 'Ensure run exists' })
      .set('Accept', 'application/json');

    const res = await request(app)
      .get('/getResults')
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThanOrEqual(1);
  });
});