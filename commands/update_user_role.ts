import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

export default class UpdateUserRole extends BaseCommand {
  static commandName = 'update:user-role'
  static description = 'Update user role to admin'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'User email address', required: false })
  declare email: string

  async run() {
    const email = this.email || 'oleg@kuftyrev.us'

    this.logger.info(`Looking for user with email: ${email}`)

    const user = await User.findBy('email', email)

    if (!user) {
      this.logger.error(`User with email ${email} not found`)
      this.exitCode = 1
      return
    }

    this.logger.info(`Found user: ${user.name} (${user.email})`)
    this.logger.info(`Current role: ${user.role}`)

    if (user.role === 'admin') {
      this.logger.info('User already has admin role')
      return
    }

    user.role = 'admin'
    await user.save()

    this.logger.success(`✅ Successfully updated user role to: ${user.role}`)
  }
}
