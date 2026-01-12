import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Store from '#models/store'
import User from '#models/user'

export default class AttachUserToStore extends BaseCommand {
  static commandName = 'attach:user-to-store'
  static description = 'Attach a user to a store by email and store ID'

  @args.string({ description: 'The email of the user to attach' })
  declare email: string

  @args.string({ description: 'The store ID' })
  declare storeId: string

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    try {
      // Find user
      const user = await User.findBy('email', this.email)
      if (!user) {
        this.logger.error(`User with email "${this.email}" not found.`)
        return
      }

      this.logger.info(`Found user: ${user.name} (${user.email})`)

      // Find store
      const storeId = Number(this.storeId)
      const store = await Store.find(storeId)
      if (!store) {
        this.logger.error(`Store with ID "${storeId}" not found.`)
        // Show available stores
        const stores = await Store.all()
        this.logger.info('Available stores:')
        stores.forEach((s) => {
          this.logger.info(`  ID: ${s.id}, Number: ${s.number}`)
        })
        return
      }

      this.logger.info(`Found store: ID ${store.id}, Number: ${store.number}`)

      // Load existing users
      await store.load('users')
      this.logger.info(`Store currently has ${store.users.length} users`)

      // Check if user is already attached
      const isAlreadyAttached = store.users.some((u) => u.id === user.id)
      if (isAlreadyAttached) {
        this.logger.info('User is already attached to this store')
        return
      }

      // Attach user
      await store.related('users').attach({
        [user.id]: {
          created_at: new Date(),
        },
      })
      this.logger.success(`✅ Successfully attached user ${user.email} to store ${store.number}`)

      // Verify
      await store.load('users')
      this.logger.info(`Store now has ${store.users.length} users`)
    } catch (error: any) {
      this.logger.error(`Error: ${error.message}`)
      this.logger.error(error.stack)
    }
  }
}
