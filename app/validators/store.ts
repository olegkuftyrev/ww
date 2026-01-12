import vine from '@vinejs/vine'

/**
 * Validator for creating a store
 */
export const createStoreSchema = vine.object({
  number: vine.string().minLength(1).maxLength(255),
})

export const createStoreValidator = vine.compile(createStoreSchema)

/**
 * Validator for updating a store
 */
export const updateStoreSchema = vine.object({
  number: vine.string().minLength(1).maxLength(255),
})

export const updateStoreValidator = vine.compile(updateStoreSchema)
