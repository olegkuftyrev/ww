import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

export default class CreateAdmin extends BaseCommand {
  static commandName = 'create:admin'
  static description = 'Create an admin user account'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Admin email address' })
  declare email: string

  @args.string({ description: 'Admin password', required: false })
  declare password: string

  @flags.string({ description: 'Admin name', alias: 'n' })
  declare name: string | undefined

  async run() {
    const email = this.email
    const password = this.password || this.prompt.secure('Enter password for admin user:')
    const name =
      this.name ||
      this.prompt.ask('Enter admin name (optional):', {
        default: 'Admin User',
      })

    // Check if user already exists
    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      this.logger.warning(`User with email ${email} already exists`)
      const update = await this.prompt.confirm('Do you want to update this user to admin?')

      if (update) {
        existingUser.role = 'admin'
        existingUser.status = 'active'
        if (name) existingUser.name = name
        if (password) {
          existingUser.password = password // Will be hashed automatically
        }
        await existingUser.save()
        this.logger.success(`✅ Successfully updated user ${email} to admin`)
        return
      } else {
        this.logger.info('Operation cancelled')
        return
      }
    }

    // Create new admin user
    try {
      const user = await User.create({
        name,
        email,
        password, // Will be automatically hashed by the model
        role: 'admin',
        status: 'active',
        theme: 'system',
      })

      this.logger.success(`✅ Successfully created admin user:`)
      this.logger.info(`   Email: ${user.email}`)
      this.logger.info(`   Name: ${user.name}`)
      this.logger.info(`   Role: ${user.role}`)
      this.logger.info(`   Status: ${user.status}`)
    } catch (error) {
      this.logger.error(`Failed to create admin user: ${error.message}`)
      this.exitCode = 1
    }
  }
}
