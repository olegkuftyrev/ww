import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { errors } from '@adonisjs/auth'

/**
 * Middleware to ensure the authenticated user has admin role
 */
export default class EnsureAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()

    if (!ctx.auth.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: 'web',
      })
    }

    if (ctx.auth.user.role !== 'admin') {
      return ctx.response.forbidden({
        message: 'Access denied. Admin role required.',
      })
    }

    return next()
  }
}
