import User from '#models/user'
import { createUserByAdminValidator, updateUserByAdminValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'

export default class UsersController {
  /**
   * Display a list of all users (admin only)
   */
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = 15

    const users = await User.query().orderBy('created_at', 'desc').paginate(page, perPage)

    return inertia.render('users/index', {
      users: {
        data: users.all().map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt.toISO(),
        })),
        meta: users.getMeta(),
      },
    })
  }

  /**
   * Show the create user form (admin only)
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('users/create')
  }

  /**
   * Show the edit user form (admin only)
   */
  async edit({ params, inertia, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound('User not found')
    }

    return inertia.render('users/edit', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })
  }

  /**
   * Store a newly created user (admin only)
   */
  async store({ request, response, session, logger }: HttpContext) {
    try {
      logger.info('Creating user', { body: request.body() })

      const data = await request.validateUsing(createUserByAdminValidator)

      logger.info('Validation passed', { email: data.email })

      const user = await User.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'associate',
        status: data.status || 'active',
      })

      logger.info('User created successfully', { userId: user.id, email: user.email })

      session.flash('success', 'User created successfully!')

      return response.redirect('/users')
    } catch (error: any) {
      logger.error('Error creating user', {
        error: error.message,
        stack: error.stack,
        errorType: error.constructor.name,
      })

      if (error instanceof errors.E_VALIDATION_ERROR) {
        logger.error('Validation errors', { errors: error.messages })
        session.flash('errors', error.messages)
        return response.redirect().back()
      }

      logger.error('Unexpected error', { error })
      session.flash('errors', {
        general: error.message || 'Something went wrong. Please try again.',
      })
      return response.redirect().back()
    }
  }

  /**
   * Update an existing user (admin only)
   */
  async update({ params, request, response, session, logger }: HttpContext) {
    try {
      const user = await User.find(params.id)

      if (!user) {
        return response.notFound('User not found')
      }

      logger.info('Updating user', { userId: user.id, body: request.body() })

      // Check if email is unique (excluding current user)
      if (request.input('email') !== user.email) {
        const existingUser = await User.findBy('email', request.input('email'))
        if (existingUser && existingUser.id !== user.id) {
          session.flash('errors', {
            email: 'This email is already taken.',
          })
          return response.redirect().back()
        }
      }

      // Validate password confirmation if password is provided
      const password = request.input('password')
      const passwordConfirmation = request.input('password_confirmation')
      if (password && password.trim() !== '') {
        if (password !== passwordConfirmation) {
          session.flash('errors', {
            password_confirmation: 'Password confirmation does not match.',
          })
          return response.redirect().back()
        }
      }

      const data = await request.validateUsing(updateUserByAdminValidator)

      logger.info('Validation passed', { email: data.email })

      user.name = data.name
      user.email = data.email

      // Update password only if provided
      if (data.password && data.password.trim() !== '') {
        user.password = data.password
      }

      if (data.role) {
        user.role = data.role
      }

      if (data.status) {
        user.status = data.status
      }

      await user.save()

      logger.info('User updated successfully', { userId: user.id, email: user.email })

      session.flash('success', 'User updated successfully!')

      return response.redirect('/users')
    } catch (error: any) {
      logger.error('Error updating user', {
        error: error.message,
        stack: error.stack,
        errorType: error.constructor.name,
      })

      if (error instanceof errors.E_VALIDATION_ERROR) {
        logger.error('Validation errors', { errors: error.messages })
        session.flash('errors', error.messages)
        return response.redirect().back()
      }

      logger.error('Unexpected error', { error })
      session.flash('errors', {
        general: error.message || 'Something went wrong. Please try again.',
      })
      return response.redirect().back()
    }
  }
}
