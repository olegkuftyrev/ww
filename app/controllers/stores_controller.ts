import Store from '#models/store'
import User from '#models/user'
import UsageEntry from '#models/usage_entry'
import UsageCategory from '#models/usage_category'
import UsageProduct from '#models/usage_product'
import { createStoreValidator, updateStoreValidator } from '#validators/store'
import { storeUsageValidator } from '#validators/usage'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class StoresController {
  /**
   * Safely parse a string to a float, handling edge cases
   */
  private parseDecimal(value: string | null | undefined): number | null {
    if (!value) return null
    if (typeof value === 'string') {
      // Trim whitespace
      const trimmed = value.trim()
      if (trimmed === '' || trimmed === '-' || trimmed === '—') return null

      // Remove commas and other formatting
      const cleaned = trimmed.replace(/,/g, '')

      // Try to parse
      const parsed = Number.parseFloat(cleaned)

      // Check if valid number
      if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
        return null
      }

      return parsed
    }
    return null
  }

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
   * Display 1K Usage page for a store (for users assigned to the store)
   */
  async usage({ params, inertia, auth, response }: HttpContext) {
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

    // Load existing usage data
    const usageEntry = await UsageEntry.query()
      .where('store_id', store.id)
      .preload('categories', (query) => {
        query.preload('products')
      })
      .orderBy('uploaded_at', 'desc')
      .first()

    let existingData = null
    if (usageEntry) {
      existingData = {
        uploadedAt: usageEntry.uploadedAt.toISO(),
        categories: usageEntry.categories.map((category) => ({
          name: category.name,
          products: category.products.map((product) => ({
            productNumber: product.productNumber,
            productName: product.productName,
            unit: product.unit,
            w1: product.w1,
            w2: product.w2,
            w3: product.w3,
            w4: product.w4,
            average: product.average,
            conversion: product.conversion,
          })),
        })),
      }
    }

    return inertia.render('stores/usage', {
      store: {
        id: store.id,
        number: store.number,
      },
      existingData,
    })
  }

  /**
   * Store usage data for a store (replaces previous entry)
   */
  async storeUsage({ params, request, auth, response, session, logger }: HttpContext) {
    logger.info('=== storeUsage method called ===', {
      storeId: params.id,
      userId: auth.user?.id,
      userRole: auth.user?.role,
    })

    const store = await Store.find(params.id)
    logger.info('Store lookup', { storeId: params.id, found: !!store })

    if (!store) {
      logger.error('Store not found', { storeId: params.id })
      return response.notFound('Store not found')
    }

    logger.info('Store found', { storeId: store.id, storeNumber: store.number })

    // Check if user has access to this store (admin can access all, others only their stores)
    if (auth.user?.role !== 'admin') {
      logger.info('Checking user access (non-admin)', { userId: auth.user?.id })
      await auth.user!.load('stores')
      const hasAccess = auth.user!.stores.some((s) => s.id === store.id)
      logger.info('User access check result', {
        userId: auth.user?.id,
        hasAccess,
        userStoreIds: auth.user!.stores.map((s) => s.id),
      })

      if (!hasAccess) {
        logger.error('User does not have access to store', {
          userId: auth.user?.id,
          storeId: store.id,
        })
        return response.unauthorized('You do not have access to this store')
      }
    } else {
      logger.info('Admin user - access granted', { userId: auth.user?.id })
    }

    try {
      logger.info('Starting validation', { body: request.body() })
      const data = await request.validateUsing(storeUsageValidator)

      logger.info('Validation passed', {
        categoriesCount: data.categories.length,
        firstCategory: data.categories[0]?.name,
        firstCategoryProductsCount: data.categories[0]?.products.length,
        totalCategories: data.categories.length,
      })

      // Use transaction to ensure data consistency
      logger.info('Starting database transaction')
      const trx = await db.transaction()
      logger.info('Transaction started')

      try {
        // Delete previous usage entries for this store (Option B: Replace latest entry)
        // CASCADE will automatically delete related categories and products
        logger.info('Deleting previous usage entries', { storeId: store.id })
        const deletedCount = await UsageEntry.query({ client: trx })
          .where('store_id', store.id)
          .delete()
        logger.info('Deleted previous entries', { deletedCount, storeId: store.id })

        // Create new usage entry
        logger.info('Creating new usage entry', { storeId: store.id })
        const usageEntry = await UsageEntry.create(
          {
            storeId: store.id,
            uploadedAt: DateTime.now(),
          },
          { client: trx }
        )
        logger.info('Usage entry created', { usageEntryId: usageEntry.id, storeId: store.id })

        // Create categories and products
        logger.info('Starting to create categories', { categoriesCount: data.categories.length })
        for (let categoryIndex = 0; categoryIndex < data.categories.length; categoryIndex++) {
          const categoryData = data.categories[categoryIndex]
          logger.info(`Creating category ${categoryIndex + 1}/${data.categories.length}`, {
            categoryName: categoryData.name,
            productsCount: categoryData.products.length,
            usageEntryId: usageEntry.id,
          })

          const category = await UsageCategory.create(
            {
              usageEntryId: usageEntry.id,
              name: categoryData.name,
            },
            { client: trx }
          )
          logger.info('Category created', { categoryId: category.id, categoryName: category.name })

          logger.info(`Starting to create products for category: ${category.name}`, {
            productsCount: categoryData.products.length,
          })
          for (let productIndex = 0; productIndex < categoryData.products.length; productIndex++) {
            const productData = categoryData.products[productIndex]
            logger.info(`Creating product ${productIndex + 1}/${categoryData.products.length}`, {
              productNumber: productData.productNumber,
              productName: productData.product,
              categoryId: category.id,
            })

            // Prepare product data with validation and safe parsing
            const productPayload = {
              usageCategoryId: category.id,
              productNumber: productData.productNumber,
              productName: productData.product,
              unit: productData.unit,
              w1: this.parseDecimal(productData.weeks.w1),
              w2: this.parseDecimal(productData.weeks.w2),
              w3: this.parseDecimal(productData.weeks.w3),
              w4: this.parseDecimal(productData.weeks.w4),
              average: this.parseDecimal(productData.average),
            }

            logger.info('Product payload prepared', {
              productIndex,
              payload: productPayload,
              rawWeeks: productData.weeks,
              rawAverage: productData.average,
            })

            console.log('=== CREATING PRODUCT ===')
            console.log('Product data from request:', JSON.stringify(productData, null, 2))
            console.log('Product payload to insert:', JSON.stringify(productPayload, null, 2))

            const product = await UsageProduct.create(productPayload, { client: trx })
            logger.info('Product created', {
              productId: product.id,
              productNumber: product.productNumber,
              productName: product.productName,
            })
          }
          logger.info(`Finished creating products for category: ${category.name}`)
        }
        logger.info('Finished creating all categories and products')

        logger.info('Committing transaction', { storeId: store.id })
        await trx.commit()
        logger.info('Transaction committed successfully', { storeId: store.id })
      } catch (transactionError: any) {
        logger.error('Transaction error occurred', {
          error: transactionError.message,
          errorMessage: String(transactionError),
          stack: transactionError.stack,
          errorType: transactionError.constructor.name,
          errorDetails: JSON.stringify(transactionError, null, 2),
          storeId: store.id,
        })
        console.error('=== DETAILED TRANSACTION ERROR ===')
        console.error('Error:', transactionError)
        console.error('Message:', transactionError.message)
        console.error('Stack:', transactionError.stack)
        console.error(
          'Full error object:',
          JSON.stringify(transactionError, Object.getOwnPropertyNames(transactionError), 2)
        )
        await trx.rollback()
        logger.info('Transaction rolled back')
        throw transactionError
      }

      logger.info('Setting success flash message')
      session.flash('success', 'Usage data saved successfully!')
      logger.info('Redirecting back')
      return response.redirect().back()
    } catch (error: any) {
      logger.error('Error in storeUsage method', {
        error: error.message,
        stack: error.stack,
        errorType: error.constructor.name,
        storeId: store.id,
      })

      console.error('=== FINAL ERROR HANDLER ===')
      console.error('Error:', error)
      console.error('Error type:', error.constructor?.name)
      console.error('Error message:', error.message)

      if (error instanceof errors.E_VALIDATION_ERROR) {
        logger.error('Validation errors occurred', { errors: error.messages })
        session.flash('errors', error.messages)
        return response.redirect().back()
      }

      logger.error('Non-validation error occurred', { error: error.message })
      console.error('Non-validation error - full details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        constraint: error.constraint,
        table: error.table,
        column: error.column,
      })

      session.flash('errors', {
        general: error.message || 'Something went wrong. Please try again.',
      })
      return response.redirect().back()
    }
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
