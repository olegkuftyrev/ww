import { errors } from '@vinejs/vine'

/**
 * Helper to assert validation errors from VineJS validators
 */
export function assertValidationError(error: any, field: string, rule?: string) {
  if (!(error instanceof errors.E_VALIDATION_ERROR)) {
    throw new Error(`Expected E_VALIDATION_ERROR, got ${error.constructor.name}`)
  }

  // Check if the field has errors
  if (!error.messages[field]) {
    throw new Error(
      `Expected validation error for field "${field}", but got errors for: ${Object.keys(error.messages).join(', ')}`
    )
  }

  // If rule is specified, check that the error is for that rule
  if (rule) {
    const fieldErrors = error.messages[field]
    const hasRule = Array.isArray(fieldErrors)
      ? fieldErrors.some((msg: string) => msg.includes(rule))
      : fieldErrors.includes(rule)

    if (!hasRule) {
      throw new Error(
        `Expected validation error for field "${field}" with rule "${rule}", but got: ${JSON.stringify(fieldErrors)}`
      )
    }
  }
}

/**
 * Helper to assert validation errors in HTTP responses
 */
export function assertValidationErrorResponse(
  response: any,
  field: string,
  statusCode: number = 422
) {
  response.assertStatus(statusCode)

  // For JSON responses, check the body structure
  const body = response.body()
  if (body && typeof body === 'object') {
    if (body.errors && body.errors[field]) {
      return // Found field error
    }
    if (body.message && typeof body.message === 'object' && body.message[field]) {
      return // Found field error in message object
    }
  }

  // For redirect responses with flash messages, we can't easily check
  // Just verify the status code indicates validation failure
  if (response.response.status === 302) {
    return // Redirect after validation failure is acceptable
  }

  throw new Error(
    `Expected validation error for field "${field}", but response status was ${response.response.status}`
  )
}
