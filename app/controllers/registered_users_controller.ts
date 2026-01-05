import User from '#models/user'
import { createUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'

export default class RegisteredUsersController {
  /**
   * Show the registration page.
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  /**
   * Handle an incoming registration request.
   */
  async store({ request, auth, response, session }: HttpContext) {
    try {
      // Validate request data
      const data = await request.validateUsing(createUserValidator)

      // Create user with validated data
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: data.password, // no need to hash as it's already done in User model
      })

      // Login user
      await auth.use('web').login(user, !!request.input('remember_me'))

      session.flash('success', 'Account created successfully!')

      return response.redirect().toRoute('dashboard')
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        // Flash errors for Inertia to display
        session.flash('errors', error.messages)
        return response.redirect().back()
      }

      // Handle unexpected errors
      session.flash('errors', {
        email: 'Something went wrong. Please try again.',
      })
      return response.redirect().back()
    }
  }
}
