import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Registered Users Controller', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should show registration page', async () => {
    const client = testUtils.httpClient()
    const response = await client.get('/register')

    response.assertStatus(200)
    // Check if it's an Inertia response
    response.assertHeader('x-inertia', 'true')
  })

  test('should register new user successfully', async ({ assert }) => {
    const client = testUtils.httpClient()
    const response = await client.post('/api/auth/register').form({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/dashboard')

    // Verify user was created
    const user = await User.findBy('email', 'newuser@example.com')
    assert.exists(user)
    assert.equal(user!.name, 'New User')
    assert.equal(user!.email, 'newuser@example.com')
  })

  test('should register user with remember me', async ({ assert }) => {
    const client = testUtils.httpClient()
    const response = await client.post('/api/auth/register').form({
      name: 'New User 2',
      email: 'newuser2@example.com',
      password: 'password123',
      remember_me: 'on',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/dashboard')

    const user = await User.findBy('email', 'newuser2@example.com')
    assert.exists(user)
  })

  test('should reject registration with duplicate email', async () => {
    const client = testUtils.httpClient()
    await User.create({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
    })

    const response = await client.post('/api/auth/register').form({
      name: 'New User',
      email: 'existing@example.com',
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/register')
  })

  test('should reject registration with invalid email', async () => {
    const client = testUtils.httpClient()
    const response = await client.post('/api/auth/register').form({
      name: 'New User',
      email: 'invalid-email',
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/register')
  })

  test('should reject registration with short password', async () => {
    const client = testUtils.httpClient()
    const response = await client.post('/api/auth/register').form({
      name: 'New User',
      email: 'newuser3@example.com',
      password: '12345',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/register')
  })

  test('should reject registration with short name', async () => {
    const client = testUtils.httpClient()
    const response = await client.post('/api/auth/register').form({
      name: 'Jo',
      email: 'newuser4@example.com',
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/register')
  })

  test('should reject registration with long name', async () => {
    const client = testUtils.httpClient()
    const response = await client.post('/api/auth/register').form({
      name: 'a'.repeat(51),
      email: 'newuser5@example.com',
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/register')
  })

  test('should auto-login user after registration', async ({ assert }) => {
    const client = testUtils.httpClient()
    const response = await client.post('/api/auth/register').form({
      name: 'New User 3',
      email: 'newuser6@example.com',
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/dashboard')

    // Try to access protected route
    const dashboardResponse = await client.get('/dashboard')
    dashboardResponse.assertStatus(200)
  })
})
