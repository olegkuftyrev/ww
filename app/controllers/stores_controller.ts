import Store from '#models/store'
import User from '#models/user'
import { createStoreValidator, updateStoreValidator } from '#validators/store'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'
import { DateTime } from 'luxon'

export default class StoresController {
  /**
   * Display a store dashboard (for users assigned to the store)
   */
  async show({ params, inertia, auth, response }: HttpContext) {
    const store = await Store.find(params.id)

    if (!store) {
      return response.notFound('Store not found')
    }

    // Check if user has access to this store (admin can access all, others only their stores)
    if (auth.user?.role !== 'admin') {
      await auth.user!.load('stores')
      const hasAccess = auth.user!.stores.some((s) => s.id === store.id)

      if (!hasAccess) {
        return response.unauthorized('You do not have access to this store')
      }
    }

    return inertia.render('stores/dashboard', {
      store: {
        id: store.id,
        number: store.number,
      },
    })
  }

  /**
   * Display a list of all stores (admin only)
   */
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = 15

    const stores = await Store.query().orderBy('created_at', 'desc').paginate(page, perPage)

    return inertia.render('stores/index', {
      stores: {
        data: stores.all().map((store) => ({
          id: store.id,
          number: store.number,
          createdAt: store.createdAt.toISO(),
        })),
        meta: stores.getMeta(),
      },
    })
  }

  /**
   * Show the create store form (admin only)
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('stores/create')
  }

  /**
   * Show the edit store form (admin only)
   */
  async edit({ params, inertia, response }: HttpContext) {
    const store = await Store.find(params.id)

    if (!store) {
      return response.notFound('Store not found')
    }

    // Load store users
    await store.load('users')

    // Get all users
    const allUsers = await User.query().orderBy('name', 'asc').orderBy('email', 'asc')

    // Get IDs of users already associated with this store
    const storeUserIds = store.users.map((user) => user.id)

    return inertia.render('stores/edit', {
      store: {
        id: store.id,
        number: store.number,
      },
      users: allUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      })),
      storeUsers: store.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      })),
    })
  }

  /**
   * Store a newly created store (admin only)
   */
  async store({ request, response, session, logger }: HttpContext) {
    try {
      logger.info('Creating store', { body: request.body() })

      const data = await request.validateUsing(createStoreValidator)

      logger.info('Validation passed', { number: data.number })

      const store = await Store.create({
        number: data.number,
      })

      logger.info('Store created successfully', { storeId: store.id, number: store.number })

      session.flash('success', 'Store created successfully!')

      return response.redirect('/stores')
    } catch (error: any) {
      logger.error('Error creating store', {
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
   * Update an existing store (admin only)
   */
  async update({ params, request, response, session, logger }: HttpContext) {
    try {
      const store = await Store.find(params.id)

      if (!store) {
        return response.notFound('Store not found')
      }

      logger.info('Updating store', { storeId: store.id, body: request.body() })

      const data = await request.validateUsing(updateStoreValidator)

      logger.info('Validation passed', { number: data.number })

      store.number = data.number
      await store.save()

      logger.info('Store updated successfully', { storeId: store.id, number: store.number })

      session.flash('success', 'Store updated successfully!')

      return response.redirect('/stores')
    } catch (error: any) {
      logger.error('Error updating store', {
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
   * Attach a user to a store (admin only)
   */
  async attachUser({ params, request, inertia, response, session, logger }: HttpContext) {
    try {
      const store = await Store.find(params.id)

      if (!store) {
        return response.notFound('Store not found')
      }

      const userId = Number(request.input('user_id'))

      if (!userId || Number.isNaN(userId)) {
        session.flash('errors', {
          general: 'User ID is required',
        })
        return response.redirect().toRoute('stores.edit', { id: params.id })
      }

      const user = await User.find(userId)

      if (!user) {
        session.flash('errors', {
          general: 'User not found',
        })
        return response.redirect().toRoute('stores.edit', { id: params.id })
      }

      await store.related('users').attach({
        [userId]: {
          created_at: DateTime.now().toSQL(),
        },
      })

      logger.info('User attached to store', { storeId: store.id, userId })

      session.flash('success', 'User added to store successfully!')

      return response.redirect().back()
    } catch (error: any) {
      logger.error('Error attaching user to store', {
        error: error.message,
        stack: error.stack,
        errorType: error.constructor.name,
      })

      session.flash('errors', {
        general: error.message || 'Something went wrong. Please try again.',
      })
      return response.redirect().toRoute('stores.edit', { id: params.id })
    }
  }

  /**
   * Detach a user from a store (admin only)
   */
  async detachUser({ params, request, inertia, response, session, logger }: HttpContext) {
    try {
      const store = await Store.find(params.id)

      if (!store) {
        return response.notFound('Store not found')
      }

      const userId = Number(request.input('user_id'))

      if (!userId || Number.isNaN(userId)) {
        session.flash('errors', {
          general: 'User ID is required',
        })
        return response.redirect().toRoute('stores.edit', { id: params.id })
      }

      await store.related('users').detach([userId])

      logger.info('User detached from store', { storeId: store.id, userId })

      session.flash('success', 'User removed from store successfully!')

      return response.redirect().back()
    } catch (error: any) {
      logger.error('Error detaching user from store', {
        error: error.message,
        stack: error.stack,
        errorType: error.constructor.name,
      })

      session.flash('errors', {
        general: error.message || 'Something went wrong. Please try again.',
      })
      return response.redirect().toRoute('stores.edit', { id: params.id })
    }
  }
}
