import { test } from '@japa/runner'
import EnsureAdminMiddleware from '#middleware/ensure_admin_middleware'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

test.group('Ensure Admin Middleware', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should allow admin user to proceed', async ({ assert }) => {
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    })

    const ctx = new HttpContextFactory().merge({ auth: { user: adminUser } }).create()
    ctx.auth.check = async () => {
      ctx.auth.user = adminUser
      return adminUser
    }

    const middleware = new EnsureAdminMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })

  test('should deny access to non-admin user', async ({ assert }) => {
    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'associate',
    })

    const ctx = new HttpContextFactory().merge({ auth: { user: regularUser } }).create()
    ctx.auth.check = async () => {
      ctx.auth.user = regularUser
      return regularUser
    }
    ctx.response.forbidden = (data: any) => {
      assert.equal(data.message, 'Access denied. Admin role required.')
      return ctx.response
    }

    const middleware = new EnsureAdminMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })

  test('should deny access to manager user', async ({ assert }) => {
    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'password123',
      role: 'manager',
    })

    const ctx = new HttpContextFactory().merge({ auth: { user: managerUser } }).create()
    ctx.auth.check = async () => {
      ctx.auth.user = managerUser
      return managerUser
    }
    ctx.response.forbidden = (data: any) => {
      assert.equal(data.message, 'Access denied. Admin role required.')
      return ctx.response
    }

    const middleware = new EnsureAdminMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })

  test('should throw error when user is not authenticated', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()
    ctx.auth.check = async () => {
      ctx.auth.user = null
      throw new Error('Unauthenticated')
    }

    const middleware = new EnsureAdminMiddleware()

    await assert.rejects(
      () =>
        middleware.handle(ctx, async () => {
          // Should not reach here
          assert.isTrue(false)
        }),
      'Unauthenticated'
    )
  })
})
