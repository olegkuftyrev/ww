import { test } from '@japa/runner'
import GuestMiddleware from '#middleware/guest_middleware'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

test.group('Guest Middleware', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should allow unauthenticated user to proceed', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()
    ctx.auth.use = () =>
      ({
        check: async () => false,
      }) as any

    const middleware = new GuestMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })

  test('should redirect authenticated user to home', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const ctx = new HttpContextFactory().merge({ auth: { user } }).create()
    ctx.auth.use = () =>
      ({
        check: async () => true,
      }) as any
    ctx.response.redirect = (url: string) => {
      assert.equal(url, '/')
      return ctx.response
    }

    const middleware = new GuestMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })

  test('should use custom redirect URL when configured', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test2@example.com',
      password: 'password123',
    })

    const ctx = new HttpContextFactory().merge({ auth: { user } }).create()
    ctx.auth.use = () =>
      ({
        check: async () => true,
      }) as any
    ctx.response.redirect = (url: string) => {
      assert.equal(url, '/dashboard')
      return ctx.response
    }

    const middleware = new GuestMiddleware()
    middleware.redirectTo = '/dashboard'
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })
})
