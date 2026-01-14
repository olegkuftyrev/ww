/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const SessionController = () => import('#controllers/session_controller')
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const RegisteredUsersController = () => import('#controllers/registered_users_controller')
const ProfileController = () => import('#controllers/profile_controller')
const UsersController = () => import('#controllers/users_controller')
const StoresController = () => import('#controllers/stores_controller')
const HomeController = () => import('#controllers/home_controller')

// Web routes
router.get('/', [HomeController, 'index']).as('home')
router.group(() => {
  router.get('/login', [SessionController, 'create']).as('login')
  router.get('/register', [RegisteredUsersController, 'create']).as('register')
})

router
  .group(() => {
    router.get('/users', [UsersController, 'index']).as('users.index')
    router.get('/users/create', [UsersController, 'create']).as('users.create')
    router.post('/users', [UsersController, 'store']).as('users.store')
    router.get('/users/:id/edit', [UsersController, 'edit']).as('users.edit')
    router.put('/users/:id', [UsersController, 'update']).as('users.update')
  })
  .use([middleware.auth(), middleware.ensureAdmin()])

router
  .group(() => {
    // Specific routes must come before parameterized routes
    router.get('/stores', [StoresController, 'index']).as('stores.index')
    router.get('/stores/create', [StoresController, 'create']).as('stores.create')
    router.post('/stores', [StoresController, 'store']).as('stores.store')
    // Parameterized routes come after specific routes
    router.get('/stores/:id', [StoresController, 'show']).as('stores.show')
    router.get('/stores/:id/edit', [StoresController, 'edit']).as('stores.edit')
    router.put('/stores/:id', [StoresController, 'update']).as('stores.update')
    router.get('/stores/:id/usage', [StoresController, 'usage']).as('stores.usage')
    router.post('/stores/:id/usage/store', [StoresController, 'storeUsage']).as('stores.storeUsage')
    router
      .patch('/stores/:id/usage/products/:productId', [StoresController, 'updateProductWeek'])
      .as('stores.updateProductWeek')
    router.post('/stores/:id/users', [StoresController, 'attachUser']).as('stores.attachUser')
    router
      .post('/stores/:id/users/remove', [StoresController, 'detachUser'])
      .as('stores.detachUser')
  })
  .use([middleware.auth(), middleware.ensureAdmin()])

router
  .group(() => {
    router.on('/settings').redirect('/settings/profile')
    router.get('/settings/profile', [ProfileController, 'show']).as('settings.profile')
    router.put('/settings/profile', [ProfileController, 'update']).as('settings.profile.update')
    router
      .put('/settings/password', [ProfileController, 'updatePassword'])
      .as('settings.password.update')
    router.put('/settings/theme', [ProfileController, 'updateTheme']).as('settings.theme.update')
    router.on('/settings/security').renderInertia('settings/security').as('settings.security')
    router.on('/settings/appearance').renderInertia('settings/appearance').as('settings.appearance')
  })
  .use([middleware.auth()])

// API routes
// router.any('/api/*', [TrpcController, 'handle']).as('api')
router
  .group(() => {
    router.post('/login', [SessionController, 'store']).as('login')
    router.post('/register', [RegisteredUsersController, 'store']).as('register_user')
  })
  .use([middleware.guest()])
  .as('auth-routes')
  .prefix('api/auth')

router
  .group(() => {
    router.post('/logout', [SessionController, 'destroy']).as('logout')
  })
  .use([middleware.auth()])
