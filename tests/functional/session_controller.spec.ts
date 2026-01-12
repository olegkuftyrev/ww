import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Session Controller', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should show login page', async () => {
    const client = testUtils.httpClient()
    const response = await client.get('/login')

    response.assertStatus(200)
    // Check if it's an Inertia response
    response.assertHeader('x-inertia', 'true')
  })

  test('should login user with valid credentials', async ({ assert }) => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client.post('/api/auth/login').form({
      email: 'test@example.com',
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/dashboard')
  })

  test('should login user with remember me', async ({ assert }) => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test2@example.com',
      password: 'password123',
    })

    const response = await client.post('/api/auth/login').form({
      email: 'test2@example.com',
      password: 'password123',
      remember: 'on',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/dashboard')
  })

  test('should reject login with invalid credentials', async () => {
    const client = testUtils.httpClient()
    await User.create({
      name: 'Test User',
      email: 'test3@example.com',
      password: 'password123',
    })

    const response = await client.post('/api/auth/login').form({
      email: 'test3@example.com',
      password: 'wrongpassword',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/login')
  })

  test('should reject login with non-existent email', async () => {
    const client = testUtils.httpClient()
    const response = await client.post('/api/auth/login').form({
      email: 'nonexistent@example.com',
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/login')
  })

  test('should logout authenticated user', async () => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test4@example.com',
      password: 'password123',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test4@example.com',
      password: 'password123',
    })

    // Logout
    const response = await client.post('/api/auth/logout')

    response.assertStatus(302)
    response.assertRedirectsTo('/')
  })

  test('should redirect to dashboard if already authenticated', async () => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test5@example.com',
      password: 'password123',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test5@example.com',
      password: 'password123',
    })

    // Try to access login page with session (client maintains cookies automatically)
    const response = await client.get('/login')

    // Should redirect away from login page (guest middleware)
    response.assertStatus(302)
  })
})
