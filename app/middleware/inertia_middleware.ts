import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class InertiaMiddleware {
  async handle({ auth, inertia }: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    inertia.share({
      auth: {
        isAuthenticated: auth.isAuthenticated,
      },

      user: async (ctx: HttpContext) => {
        if (!ctx.auth?.user) return null

        // Load user's stores
        await ctx.auth.user.load('stores')

        return {
          id: ctx.auth.user.id,
          name: ctx.auth.user.name,
          email: ctx.auth.user.email,
          role: ctx.auth.user.role,
          theme: ctx.auth.user.theme,
          status: ctx.auth.user.status,
          stores: ctx.auth.user.stores.map((store) => ({
            id: store.id,
            number: store.number,
          })),
        }
      },

      // You can share other global data here too
      flash: (ctx: HttpContext) => ({
        success: ctx.session.flashMessages.get('success'),
        errors: ctx.session.flashMessages.get('errors'),
      }),

      sidebarOpen: true,
    })

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}
