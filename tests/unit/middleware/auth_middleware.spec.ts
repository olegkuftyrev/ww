import { test } from '@japa/runner'
import AuthMiddleware from '#middleware/auth_middleware'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

test.group('Auth Middleware', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should allow authenticated user to proceed', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const ctx = new HttpContextFactory().merge({ auth: { user } }).create()
    ctx.auth.authenticateUsing = async () => {
      ctx.auth.user = user
      return user
    }

    const middleware = new AuthMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })

  test('should redirect unauthenticated user to login', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()
    ctx.auth.authenticateUsing = async () => {
      throw new Error('Unauthenticated')
    }
    ctx.response.redirect = (url: string) => {
      assert.equal(url, '/login')
      return ctx.response
    }

    const middleware = new AuthMiddleware()

    await assert.rejects(
      () =>
        middleware.handle(ctx, async () => {
          // Should not reach here
          assert.isTrue(false)
        }),
      'Unauthenticated'
    )
  })

  test('should use custom redirect URL when configured', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()
    ctx.auth.authenticateUsing = async () => {
      throw new Error('Unauthenticated')
    }
    ctx.response.redirect = (url: string) => {
      assert.equal(url, '/custom-login')
      return ctx.response
    }

    const middleware = new AuthMiddleware()
    middleware.redirectTo = '/custom-login'

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
