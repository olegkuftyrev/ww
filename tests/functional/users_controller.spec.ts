import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

// Helper to login (client maintains session automatically)
async function loginUser(email: string, password: string) {
  const client = testUtils.httpClient()
  await client.post('/api/auth/login').form({ email, password })
  return client
}

test.group('Users Controller', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should list users for admin', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    })

    await User.create({
      name: 'User 1',
      email: 'user1@example.com',
      password: 'password123',
    })

    await User.create({
      name: 'User 2',
      email: 'user2@example.com',
      password: 'password123',
    })

    // Login as admin
    await client.post('/api/auth/login').form({
      email: 'admin@example.com',
      password: 'password123',
    })

    const response = await client.get('/users')

    response.assertStatus(200)
    response.assertHeader('x-inertia', 'true')
  })

  test('should deny access to non-admin users', async () => {
    const client = testUtils.httpClient()
    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'associate',
    })

    // Login as regular user
    await client.post('/api/auth/login').form({
      email: 'user@example.com',
      password: 'password123',
    })

    const response = await client.get('/users')

    response.assertStatus(403)
  })

  test('should deny access to manager users', async () => {
    const client = testUtils.httpClient()
    const manager = await User.create({
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'password123',
      role: 'manager',
    })

    // Login as manager
    await client.post('/api/auth/login').form({
      email: 'manager@example.com',
      password: 'password123',
    })

    const response = await client.get('/users')

    response.assertStatus(403)
  })

  test('should redirect unauthenticated user to login', async () => {
    const client = testUtils.httpClient()
    const response = await client.get('/users')

    response.assertStatus(302)
    response.assertRedirectsTo('/login')
  })

  test('should show create user form for admin', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin2@example.com',
      password: 'password123',
      role: 'admin',
    })

    const client = await loginUser('admin2@example.com', 'password123')
    const response = await client.get('/users/create')

    response.assertStatus(200)
    response.assertHeader('x-inertia', 'true')
  })

  test('should show edit user form for admin', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin3@example.com',
      password: 'password123',
      role: 'admin',
    })

    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const client = await loginUser('admin3@example.com', 'password123')
    const response = await client.get(`/users/${user.id}/edit`)

    response.assertStatus(200)
    response.assertHeader('x-inertia', 'true')
  })

  test('should return 404 for non-existent user', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin4@example.com',
      password: 'password123',
      role: 'admin',
    })

    const client = await loginUser('admin4@example.com', 'password123')
    const response = await client.get('/users/99999/edit')

    response.assertStatus(404)
  })

  test('should create user successfully', async ({ assert }) => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin5@example.com',
      password: 'password123',
      role: 'admin',
    })

    const client = await loginUser('admin5@example.com', 'password123')
    const response = await client.post('/users').form({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      role: 'associate',
      status: 'active',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/users')

    const user = await User.findBy('email', 'newuser@example.com')
    assert.exists(user)
    assert.equal(user!.name, 'New User')
    assert.equal(user!.role, 'associate')
    assert.equal(user!.status, 'active')
  })

  test('should create user with default role and status', async ({ assert }) => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin6@example.com',
      password: 'password123',
      role: 'admin',
    })

    const client = await loginUser('admin5@example.com', 'password123')
    const response = await client.post('/users').form({
      name: 'New User 2',
      email: 'newuser2@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    })

    response.assertStatus(302)

    const user = await User.findBy('email', 'newuser2@example.com')
    assert.exists(user)
    assert.equal(user!.role, 'associate')
    assert.equal(user!.status, 'active')
  })

  test('should reject user creation with duplicate email', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin7@example.com',
      password: 'password123',
      role: 'admin',
    })

    await User.create({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
    })

    const client = await loginUser('admin5@example.com', 'password123')
    const response = await client.post('/users').form({
      name: 'New User',
      email: 'existing@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/users')
  })

  test('should reject user creation with invalid data', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin8@example.com',
      password: 'password123',
      role: 'admin',
    })

    const client = await loginUser('admin5@example.com', 'password123')
    const response = await client.post('/users').form({
      name: 'Jo',
      email: 'invalid-email',
      password: '12345',
      password_confirmation: '12345',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/users')
  })

  test('should update user successfully', async ({ assert }) => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin9@example.com',
      password: 'password123',
      role: 'admin',
    })

    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'associate',
      status: 'active',
    })

    const client = await loginUser('admin9@example.com', 'password123')
    const response = await client.put(`/users/${user.id}`).form({
      name: 'Updated User',
      email: 'updated@example.com',
      role: 'manager',
      status: 'inactive',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/users')

    await user.refresh()
    assert.equal(user.name, 'Updated User')
    assert.equal(user.email, 'updated@example.com')
    assert.equal(user.role, 'manager')
    assert.equal(user.status, 'inactive')
  })

  test('should update user password when provided', async ({ assert }) => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin10@example.com',
      password: 'password123',
      role: 'admin',
    })

    const user = await User.create({
      name: 'Test User',
      email: 'test2@example.com',
      password: 'oldpassword',
    })

    const client = await loginUser('admin10@example.com', 'password123')
    const response = await client.put(`/users/${user.id}`).form({
      name: 'Test User',
      email: 'test2@example.com',
      password: 'newpassword123',
      password_confirmation: 'newpassword123',
    })

    response.assertStatus(302)

    // Verify password was updated
    const verifiedUser = await User.verifyCredentials('test2@example.com', 'newpassword123')
    assert.equal(verifiedUser.id, user.id)
  })

  test('should not update password when not provided', async ({ assert }) => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin11@example.com',
      password: 'password123',
      role: 'admin',
    })

    const user = await User.create({
      name: 'Test User',
      email: 'test3@example.com',
      password: 'oldpassword',
    })

    const oldPasswordHash = user.password

    const client = await loginUser('admin11@example.com', 'password123')
    const response = await client.put(`/users/${user.id}`).form({
      name: 'Updated Name',
      email: 'test3@example.com',
    })

    response.assertStatus(302)

    await user.refresh()
    assert.equal(user.name, 'Updated Name')
    // Password should remain unchanged
    assert.equal(user.password, oldPasswordHash)
  })

  test('should reject update with duplicate email', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin12@example.com',
      password: 'password123',
      role: 'admin',
    })

    const user1 = await User.create({
      name: 'User 1',
      email: 'user1@example.com',
      password: 'password123',
    })

    const user2 = await User.create({
      name: 'User 2',
      email: 'user2@example.com',
      password: 'password123',
    })

    const client = await loginUser('admin12@example.com', 'password123')
    const response = await client.put(`/users/${user1.id}`).form({
      name: 'User 1',
      email: 'user2@example.com',
    })

    response.assertStatus(302)
    response.assertRedirectsTo(`/users/${user1.id}/edit`)
  })

  test('should allow keeping same email on update', async ({ assert }) => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin13@example.com',
      password: 'password123',
      role: 'admin',
    })

    const user = await User.create({
      name: 'Test User',
      email: 'test4@example.com',
      password: 'password123',
    })

    const client = await loginUser('admin13@example.com', 'password123')
    const response = await client.put(`/users/${user.id}`).form({
      name: 'Updated Name',
      email: 'test4@example.com',
    })

    response.assertStatus(302)

    await user.refresh()
    assert.equal(user.name, 'Updated Name')
    assert.equal(user.email, 'test4@example.com')
  })

  test('should reject update with mismatched password confirmation', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin14@example.com',
      password: 'password123',
      role: 'admin',
    })

    const user = await User.create({
      name: 'Test User',
      email: 'test5@example.com',
      password: 'oldpassword',
    })

    const client = await loginUser('admin14@example.com', 'password123')
    const response = await client.put(`/users/${user.id}`).form({
      name: 'Test User',
      email: 'test5@example.com',
      password: 'newpassword123',
      password_confirmation: 'differentpassword',
    })

    response.assertStatus(302)
    response.assertRedirectsTo(`/users/${user.id}/edit`)
  })

  test('should return 404 when updating non-existent user', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin15@example.com',
      password: 'password123',
      role: 'admin',
    })

    const client = await loginUser('admin15@example.com', 'password123')
    const response = await client.put('/users/99999').form({
      name: 'Test User',
      email: 'test@example.com',
    })

    response.assertStatus(404)
  })

  test('should paginate users list', async () => {
    const client = testUtils.httpClient()
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin16@example.com',
      password: 'password123',
      role: 'admin',
    })

    // Create more than 15 users (default perPage)
    for (let i = 0; i < 20; i++) {
      await User.create({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: 'password123',
      })
    }

    const client = await loginUser('admin16@example.com', 'password123')
    const response = await client.get('/users?page=1')

    response.assertStatus(200)
    response.assertHeader('x-inertia', 'true')
  })
})
