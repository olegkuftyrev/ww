import { test } from '@japa/runner'
import {
  createUserValidator,
  createUserByAdminValidator,
  updateProfileValidator,
  updatePasswordValidator,
  updateThemeValidator,
  updateUserByAdminValidator,
} from '#validators/user'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { errors } from '@vinejs/vine'
import { assertValidationError } from '../helpers.js'

test.group('User Validators', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('createUserValidator: should validate valid user data', async ({ assert }) => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    }

    const result = await createUserValidator.validate(data)
    assert.equal(result.name, 'John Doe')
    assert.equal(result.email, 'john@example.com')
    assert.equal(result.password, 'password123')
  })

  test('createUserValidator: should reject name shorter than 3 characters', async ({ assert }) => {
    const data = {
      name: 'Jo',
      email: 'john@example.com',
      password: 'password123',
    }

    try {
      await createUserValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'name')
    }
  })

  test('createUserValidator: should reject name longer than 50 characters', async ({ assert }) => {
    const data = {
      name: 'a'.repeat(51),
      email: 'john@example.com',
      password: 'password123',
    }

    try {
      await createUserValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'name')
    }
  })

  test('createUserValidator: should reject invalid email', async ({ assert }) => {
    const data = {
      name: 'John Doe',
      email: 'invalid-email',
      password: 'password123',
    }

    try {
      await createUserValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'email')
    }
  })

  test('createUserValidator: should reject password shorter than 6 characters', async ({
    assert,
  }) => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      password: '12345',
    }

    try {
      await createUserValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'password')
    }
  })

  test('createUserValidator: should reject password longer than 32 characters', async ({
    assert,
  }) => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'a'.repeat(33),
    }

    try {
      await createUserValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'password')
    }
  })

  test('createUserValidator: should reject duplicate email', async ({ assert }) => {
    await User.create({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
    })

    const data = {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'password123',
    }

    try {
      await createUserValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'email')
    }
  })

  test('createUserByAdminValidator: should validate valid admin user data', async ({ assert }) => {
    const data = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      role: 'admin',
      status: 'active',
    }

    const result = await createUserByAdminValidator.validate(data)
    assert.equal(result.role, 'admin')
    assert.equal(result.status, 'active')
  })

  test('createUserByAdminValidator: should require password confirmation', async ({ assert }) => {
    const data = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      password_confirmation: 'different123',
    }

    try {
      await createUserByAdminValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'password_confirmation')
    }
  })

  test('createUserByAdminValidator: should accept optional role', async ({ assert }) => {
    const data = {
      name: 'User',
      email: 'user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    }

    const result = await createUserByAdminValidator.validate(data)
    assert.isUndefined(result.role)
  })

  test('createUserByAdminValidator: should accept optional status', async ({ assert }) => {
    const data = {
      name: 'User',
      email: 'user2@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    }

    const result = await createUserByAdminValidator.validate(data)
    assert.isUndefined(result.status)
  })

  test('createUserByAdminValidator: should reject invalid role', async ({ assert }) => {
    const data = {
      name: 'User',
      email: 'user3@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      role: 'invalid_role',
    }

    try {
      await createUserByAdminValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'role')
    }
  })

  test('createUserByAdminValidator: should reject invalid status', async ({ assert }) => {
    const data = {
      name: 'User',
      email: 'user4@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      status: 'invalid_status',
    }

    try {
      await createUserByAdminValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'status')
    }
  })

  test('updateProfileValidator: should validate valid profile data', async ({ assert }) => {
    const data = {
      name: 'Updated Name',
      email: 'updated@example.com',
      role: 'manager',
    }

    const result = await updateProfileValidator.validate(data)
    assert.equal(result.name, 'Updated Name')
    assert.equal(result.email, 'updated@example.com')
    assert.equal(result.role, 'manager')
  })

  test('updateProfileValidator: should require role', async ({ assert }) => {
    const data = {
      name: 'Updated Name',
      email: 'updated2@example.com',
    }

    try {
      await updateProfileValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'role')
    }
  })

  test('updatePasswordValidator: should validate valid password data', async ({ assert }) => {
    const data = {
      password: 'newpassword123',
      password_confirmation: 'newpassword123',
    }

    const result = await updatePasswordValidator.validate(data)
    assert.equal(result.password, 'newpassword123')
  })

  test('updatePasswordValidator: should require password confirmation', async ({ assert }) => {
    const data = {
      password: 'newpassword123',
      password_confirmation: 'different123',
    }

    try {
      await updatePasswordValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'password_confirmation')
    }
  })

  test('updatePasswordValidator: should reject short password', async ({ assert }) => {
    const data = {
      password: '12345',
      password_confirmation: '12345',
    }

    try {
      await updatePasswordValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'password')
    }
  })

  test('updateThemeValidator: should validate valid theme', async ({ assert }) => {
    const themes = ['dark', 'light', 'system', 'iron-man']

    for (const theme of themes) {
      const data = { theme }
      const result = await updateThemeValidator.validate(data)
      assert.equal(result.theme, theme)
    }
  })

  test('updateThemeValidator: should reject invalid theme', async ({ assert }) => {
    const data = {
      theme: 'invalid_theme',
    }

    try {
      await updateThemeValidator.validate(data)
      assert.fail('Expected validation error to be thrown')
    } catch (error) {
      assert.instanceOf(error, errors.E_VALIDATION_ERROR)
      assert.property(error.messages, 'theme')
    }
  })

  test('updateUserByAdminValidator: should validate valid update data without password', async ({
    assert,
  }) => {
    const data = {
      name: 'Updated Name',
      email: 'updated@example.com',
      role: 'manager',
      status: 'inactive',
    }

    const result = await updateUserByAdminValidator.validate(data)
    assert.equal(result.name, 'Updated Name')
    assert.equal(result.email, 'updated@example.com')
    assert.equal(result.role, 'manager')
    assert.equal(result.status, 'inactive')
  })

  test('updateUserByAdminValidator: should validate valid update data with password', async ({
    assert,
  }) => {
    const data = {
      name: 'Updated Name',
      email: 'updated2@example.com',
      password: 'newpassword123',
      password_confirmation: 'newpassword123',
    }

    const result = await updateUserByAdminValidator.validate(data)
    assert.equal(result.password, 'newpassword123')
  })

  test('updateUserByAdminValidator: should accept optional password', async ({ assert }) => {
    const data = {
      name: 'Updated Name',
      email: 'updated3@example.com',
    }

    const result = await updateUserByAdminValidator.validate(data)
    assert.isUndefined(result.password)
  })

  test('updateUserByAdminValidator: should accept optional role and status', async ({ assert }) => {
    const data = {
      name: 'Updated Name',
      email: 'updated4@example.com',
    }

    const result = await updateUserByAdminValidator.validate(data)
    assert.isUndefined(result.role)
    assert.isUndefined(result.status)
  })
})
