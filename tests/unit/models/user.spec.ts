import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

test.group('User Model', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should create a user with hashed password', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'associate',
      status: 'active',
    })

    assert.exists(user.id)
    assert.equal(user.name, 'Test User')
    assert.equal(user.email, 'test@example.com')
    assert.notEqual(user.password, 'password123')
    assert.isTrue(await hash.verify(user.password, 'password123'))
  })

  test('should create user with default role and status', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test2@example.com',
      password: 'password123',
    })

    assert.equal(user.role, 'associate')
    assert.equal(user.status, 'active')
  })

  test('should verify user credentials correctly', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test3@example.com',
      password: 'password123',
    })

    const verifiedUser = await User.verifyCredentials('test3@example.com', 'password123')
    assert.equal(verifiedUser.id, user.id)
    assert.equal(verifiedUser.email, user.email)
  })

  test('should throw error for invalid credentials', async ({ assert }) => {
    await User.create({
      name: 'Test User',
      email: 'test4@example.com',
      password: 'password123',
    })

    await assert.rejects(
      () => User.verifyCredentials('test4@example.com', 'wrongpassword'),
      'Invalid user credentials'
    )
  })

  test('should throw error for non-existent user', async ({ assert }) => {
    await assert.rejects(
      () => User.verifyCredentials('nonexistent@example.com', 'password123'),
      'Invalid user credentials'
    )
  })

  test('should update user password and hash it', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test5@example.com',
      password: 'oldpassword',
    })

    const oldPasswordHash = user.password
    user.password = 'newpassword123'
    await user.save()

    await user.refresh()
    assert.notEqual(user.password, oldPasswordHash)
    assert.isTrue(await hash.verify(user.password, 'newpassword123'))
  })

  test('should find user by email', async ({ assert }) => {
    await User.create({
      name: 'Test User',
      email: 'test6@example.com',
      password: 'password123',
    })

    const foundUser = await User.findBy('email', 'test6@example.com')
    assert.exists(foundUser)
    assert.equal(foundUser!.email, 'test6@example.com')
  })

  test('should serialize user without password', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test7@example.com',
      password: 'password123',
    })

    const serialized = user.serialize()
    assert.notProperty(serialized, 'password')
    assert.property(serialized, 'id')
    assert.property(serialized, 'name')
    assert.property(serialized, 'email')
  })

  test('should update user attributes', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test8@example.com',
      password: 'password123',
      role: 'associate',
      status: 'active',
    })

    user.name = 'Updated Name'
    user.role = 'manager'
    user.status = 'inactive'
    await user.save()

    await user.refresh()
    assert.equal(user.name, 'Updated Name')
    assert.equal(user.role, 'manager')
    assert.equal(user.status, 'inactive')
  })

  test('should have timestamps', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test9@example.com',
      password: 'password123',
    })

    assert.exists(user.createdAt)
    assert.exists(user.updatedAt)
  })

  test('should update updatedAt on save', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test10@example.com',
      password: 'password123',
    })

    const originalUpdatedAt = user.updatedAt
    await new Promise((resolve) => setTimeout(resolve, 1000))

    user.name = 'Updated Name'
    await user.save()

    await user.refresh()
    assert.isTrue(user.updatedAt!.toMillis() > originalUpdatedAt!.toMillis())
  })
})
