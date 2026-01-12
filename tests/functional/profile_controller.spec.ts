import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Profile Controller', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should show profile page for authenticated user', async () => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    // Login first to get session
    await client.post('/api/auth/login').form({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client.get('/settings/profile')

    response.assertStatus(200)
    response.assertHeader('x-inertia', 'true')
  })

  test('should redirect to login for unauthenticated user', async () => {
    const client = testUtils.httpClient()
    const response = await client.get('/settings/profile')

    response.assertStatus(302)
    response.assertRedirectsTo('/login')
  })

  test('should update user profile successfully', async ({ assert }) => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test2@example.com',
      password: 'password123',
      role: 'associate',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test2@example.com',
      password: 'password123',
    })

    const response = await client.put('/settings/profile').form({
      name: 'Updated Name',
      email: 'updated@example.com',
      role: 'manager',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/settings/profile')

    await user.refresh()
    assert.equal(user.name, 'Updated Name')
    assert.equal(user.email, 'updated@example.com')
    assert.equal(user.role, 'manager')
  })

  test('should reject profile update with duplicate email', async () => {
    const client = testUtils.httpClient()
    const user1 = await User.create({
      name: 'User 1',
      email: 'user1@example.com',
      password: 'password123',
      role: 'associate',
    })

    const user2 = await User.create({
      name: 'User 2',
      email: 'user2@example.com',
      password: 'password123',
      role: 'associate',
    })

    // Login as user1
    await client.post('/api/auth/login').form({
      email: 'user1@example.com',
      password: 'password123',
    })

    const response = await client.put('/settings/profile').form({
      name: 'User 1',
      email: 'user2@example.com',
      role: 'associate',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/settings/profile')
  })

  test('should allow keeping same email', async ({ assert }) => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test3@example.com',
      password: 'password123',
      role: 'associate',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test3@example.com',
      password: 'password123',
    })

    const response = await client.put('/settings/profile').form({
      name: 'Updated Name',
      email: 'test3@example.com',
      role: 'associate',
    })

    response.assertStatus(302)

    await user.refresh()
    assert.equal(user.name, 'Updated Name')
    assert.equal(user.email, 'test3@example.com')
  })

  test('should update password successfully', async ({ assert }) => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test4@example.com',
      password: 'oldpassword',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test4@example.com',
      password: 'oldpassword',
    })

    const response = await client.put('/settings/password').form({
      password: 'newpassword123',
      password_confirmation: 'newpassword123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/settings/profile')

    // Verify password was updated
    const verifiedUser = await User.verifyCredentials('test4@example.com', 'newpassword123')
    assert.equal(verifiedUser.id, user.id)
  })

  test('should reject password update with mismatched confirmation', async () => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test5@example.com',
      password: 'oldpassword',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test5@example.com',
      password: 'oldpassword',
    })

    const response = await client.put('/settings/password').form({
      password: 'newpassword123',
      password_confirmation: 'differentpassword',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/settings/profile')
  })

  test('should reject password update with short password', async () => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test6@example.com',
      password: 'oldpassword',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test6@example.com',
      password: 'oldpassword',
    })

    const response = await client.put('/settings/password').form({
      password: '12345',
      password_confirmation: '12345',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/settings/profile')
  })

  test('should update theme successfully', async ({ assert }) => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test7@example.com',
      password: 'password123',
      theme: 'light',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test7@example.com',
      password: 'password123',
    })

    const response = await client.put('/settings/theme').form({
      theme: 'dark',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/settings/profile')

    await user.refresh()
    assert.equal(user.theme, 'dark')
  })

  test('should update theme to iron-man', async ({ assert }) => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test8@example.com',
      password: 'password123',
      theme: 'light',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test8@example.com',
      password: 'password123',
    })

    const response = await client.put('/settings/theme').form({
      theme: 'iron-man',
    })

    response.assertStatus(302)

    await user.refresh()
    assert.equal(user.theme, 'iron-man')
  })

  test('should reject invalid theme', async () => {
    const client = testUtils.httpClient()
    const user = await User.create({
      name: 'Test User',
      email: 'test9@example.com',
      password: 'password123',
    })

    // Login first
    await client.post('/api/auth/login').form({
      email: 'test9@example.com',
      password: 'password123',
    })

    const response = await client.put('/settings/theme').form({
      theme: 'invalid_theme',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/settings/profile')
  })
})
