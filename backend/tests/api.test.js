const assert = require('assert')
const request = require('supertest')
const app = require('../src/index')
const db = require('../src/db')

describe('Auth API', () => {
  after(async () => {
    await db.pool.end()
  })

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test User', email: 'testuser@example.com', password: 'password123' })
    assert.strictEqual(res.status, 201)
    assert(res.body.token)
    assert.strictEqual(res.body.user.email, 'testuser@example.com')
  })

  it('should reject duplicate email on register', async () => {
    await request(app)
      .post('/auth/register')
      .send({ name: 'User 1', email: 'duplicate@example.com', password: 'password123' })
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'User 2', email: 'duplicate@example.com', password: 'password123' })
    assert.strictEqual(res.status, 400)
    assert(res.body.fields.email)
  })

  it('should login with valid credentials', async () => {
    const email = 'logintest@example.com'
    const password = 'password123'
    await request(app)
      .post('/auth/register')
      .send({ name: 'Login Test', email, password })
    const res = await request(app)
      .post('/auth/login')
      .send({ email, password })
    assert.strictEqual(res.status, 200)
    assert(res.body.token)
  })

  it('should reject invalid login', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrong' })
    assert.strictEqual(res.status, 401)
  })
})

describe('Projects API', () => {
  let token
  let userId
  let projectId

  before(async () => {
    const regRes = await request(app)
      .post('/auth/register')
      .send({ name: 'Project Test User', email: 'projecttest@example.com', password: 'password123' })
    token = regRes.body.token
    userId = regRes.body.user.id
  })

  after(async () => {
    await db.pool.end()
  })

  it('should create a project', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'A test project' })
    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.body.name, 'Test Project')
    projectId = res.body.id
  })

  it('should list projects for authenticated user', async () => {
    const res = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${token}`)
    assert.strictEqual(res.status, 200)
    assert(Array.isArray(res.body.projects))
  })

  it('should get project details', async () => {
    const res = await request(app)
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.name, 'Test Project')
    assert(Array.isArray(res.body.tasks))
  })

  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .get('/projects')
    assert.strictEqual(res.status, 401)
  })
})
