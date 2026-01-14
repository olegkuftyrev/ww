import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  /**
   * Show the welcome page.
   * Redirects authenticated users to settings.
   */
  async index({ inertia, auth, response }: HttpContext) {
    // If user is authenticated, redirect to settings
    if (auth.isAuthenticated) {
      return response.redirect('/settings')
    }

    // Otherwise, show the welcome page
    return inertia.render('welcome')
  }
}
