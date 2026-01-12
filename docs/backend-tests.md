# Backend Tests

This document provides comprehensive guidance on writing and running backend tests for the AdonisJS application.

## Overview

The project uses **Japa** as the testing framework, which is the official testing framework for AdonisJS. Tests are organized into two main categories:

- **Unit Tests**: Test individual components in isolation (models, middleware, validators)
- **Functional Tests**: Test HTTP endpoints and full request/response cycles

## Test Structure

```
tests/
├── bootstrap.ts              # Test configuration and setup
├── unit/                     # Unit tests (2s timeout)
│   ├── middleware/
│   ├── models/
│   └── validators/
└── functional/               # Functional tests (30s timeout)
    └── *_controller.spec.ts
```

### Test File Naming

- Test files must end with `.spec.ts` or `.spec.js`
- Unit tests: `tests/unit/**/*.spec.ts`
- Functional tests: `tests/functional/**/*.spec.ts`

## Running Tests

### Run All Tests

```bash
pnpm test
# or
node ace test
```

### Run Specific Test Suite

```bash
# Run only unit tests
node ace test --suite=unit

# Run only functional tests
node ace test --suite=functional
```

### Run Specific Test File

```bash
node ace test tests/unit/models/user.spec.ts
```

### Run Tests in Watch Mode

```bash
node ace test --watch
```

### Run Tests with Coverage

```bash
node ace test --coverage
```

## Test Configuration

Test configuration is defined in `adonisrc.ts`:

```typescript
tests: {
  suites: [
    {
      files: ['tests/unit/**/*.spec(.ts|.js)'],
      name: 'unit',
      timeout: 2000,  // 2 seconds
    },
    {
      files: ['tests/functional/**/*.spec(.ts|.js)'],
      name: 'functional',
      timeout: 30000,  // 30 seconds
    },
  ],
  forceExit: false,
}
```

## Writing Unit Tests

Unit tests focus on testing individual components in isolation.

### Basic Structure

```typescript
import { test } from '@japa/runner'
import YourComponent from '#path/to/component'
import db from '@adonisjs/lucid/services/db'

test.group('Component Name', (group) => {
  // Setup: runs before each test
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should do something', async ({ assert }) => {
    // Test implementation
  })
})
```

### Testing Models

Example: Testing the User model

```typescript
import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

test.group('User Model', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should create a user with hashed password', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    assert.exists(user.id)
    assert.notEqual(user.password, 'password123')
    assert.isTrue(await hash.verify(user.password, 'password123'))
  })

  test('should verify user credentials correctly', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const verifiedUser = await User.verifyCredentials('test@example.com', 'password123')
    assert.equal(verifiedUser.id, user.id)
  })
})
```

### Testing Middleware

Example: Testing authentication middleware

```typescript
import { test } from '@japa/runner'
import AuthMiddleware from '#middleware/auth_middleware'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

test.group('Auth Middleware', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should allow authenticated user to proceed', async ({ assert }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const ctx = new HttpContextFactory().merge({ auth: { user } }).create()
    ctx.auth.authenticateUsing = async () => {
      ctx.auth.user = user
      return user
    }

    const middleware = new AuthMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })
})
```

### Testing Validators

Example: Testing VineJS validators

```typescript
import { test } from '@japa/runner'
import { validator } from '@vinejs/vine'
import { createUserValidator } from '#validators/user'

test.group('User Validator', (group) => {
  test('should validate correct user data', async ({ assert }) => {
    const data = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    }

    const result = await validator.validate(createUserValidator(data))
    assert.equal(result.name, 'Test User')
    assert.equal(result.email, 'test@example.com')
  })

  test('should reject invalid email', async ({ assert }) => {
    const data = {
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123',
      password_confirmation: 'password123',
    }

    await assert.rejects(
      () => validator.validate(createUserValidator(data)),
      'The email field must be a valid email address'
    )
  })
})
```

## Writing Functional Tests

Functional tests test HTTP endpoints and full request/response cycles.

### Basic Structure

```typescript
import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

test.group('Controller Name', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should handle GET request', async ({ client }) => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client.get('/endpoint').loginAs(user)

    response.assertStatus(200)
  })
})
```

### Making Authenticated Requests

```typescript
// Login as a specific user
const response = await client.get('/users').loginAs(user)

// Make unauthenticated request
const response = await client.get('/users')
```

### Testing Different HTTP Methods

```typescript
// GET request
const response = await client.get('/users')

// POST request with form data
const response = await client.post('/users').form({
  name: 'New User',
  email: 'newuser@example.com',
  password: 'password123',
})

// PUT request
const response = await client.put(`/users/${user.id}`).form({
  name: 'Updated Name',
})

// DELETE request
const response = await client.delete(`/users/${user.id}`)
```

### Asserting Responses

```typescript
// Assert status code
response.assertStatus(200)
response.assertStatus(404)
response.assertStatus(302)

// Assert redirects
response.assertRedirectsTo('/users')
response.assertRedirectsTo('/login')

// Assert Inertia components (for Inertia.js responses)
response.assertInertiaComponent('users/index')
response.assertInertiaComponent('users/create')

// Assert JSON responses
response.assertBodyContains({ name: 'Test User' })

// Assert headers
response.assertHeader('content-type', 'application/json')
```

### Complete Functional Test Example

```typescript
import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

test.group('Users Controller', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('should list users for admin', async ({ client }) => {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    })

    const response = await client.get('/users').loginAs(admin)

    response.assertStatus(200)
    response.assertInertiaComponent('users/index')
  })

  test('should create user successfully', async ({ client, assert }) => {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    })

    const response = await client.post('/users').loginAs(admin).form({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      role: 'associate',
      status: 'active',
    })

    response.assertStatus(302)
    response.assertRedirectsTo('/users')

    const user = await User.findBy('email', 'newuser@example.com')
    assert.exists(user)
    assert.equal(user!.name, 'New User')
  })

  test('should deny access to non-admin users', async ({ client }) => {
    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'associate',
    })

    const response = await client.get('/users').loginAs(regularUser)

    response.assertStatus(403)
  })
})
```

## Database Transactions

All tests use database transactions to ensure test isolation. Each test runs within a transaction that is rolled back after the test completes.

```typescript
group.each.setup(async () => {
  await db.beginGlobalTransaction()
  return () => db.rollbackGlobalTransaction()
})
```

This ensures:
- Tests don't affect each other
- No test data persists after tests complete
- Tests can run in parallel safely

## Common Assertions

### Basic Assertions

```typescript
assert.exists(value)           // Value is not null/undefined
assert.notExists(value)         // Value is null/undefined
assert.equal(actual, expected)  // Strict equality
assert.notEqual(actual, expected)
assert.isTrue(value)
assert.isFalse(value)
```

### Object Assertions

```typescript
assert.property(object, 'key')
assert.notProperty(object, 'key')
assert.contains(object, value)
assert.notContains(object, value)
```

### Async Assertions

```typescript
// Assert that a promise rejects
await assert.rejects(
  () => User.verifyCredentials('invalid@example.com', 'wrong'),
  'Invalid user credentials'
)

// Assert that a promise resolves
await assert.doesNotReject(
  () => User.verifyCredentials('valid@example.com', 'correct')
)
```

## Test Organization Best Practices

### 1. Group Related Tests

Use `test.group()` to organize related tests:

```typescript
test.group('User Model', (group) => {
  // All user model tests here
})

test.group('Users Controller', (group) => {
  // All users controller tests here
})
```

### 2. Use Descriptive Test Names

```typescript
// Good
test('should create user with hashed password', async ({ assert }) => {})
test('should deny access to non-admin users', async ({ client }) => {})

// Bad
test('test user creation', async ({ assert }) => {})
test('test access', async ({ client }) => {})
```

### 3. Arrange-Act-Assert Pattern

Structure tests in three clear sections:

```typescript
test('should update user successfully', async ({ client, assert }) => {
  // Arrange: Set up test data
  const admin = await User.create({ /* ... */ })
  const user = await User.create({ /* ... */ })

  // Act: Perform the action
  const response = await client.put(`/users/${user.id}`)
    .loginAs(admin)
    .form({ name: 'Updated Name' })

  // Assert: Verify the result
  response.assertStatus(302)
  await user.refresh()
  assert.equal(user.name, 'Updated Name')
})
```

### 4. Test One Thing Per Test

Each test should verify a single behavior:

```typescript
// Good: Separate tests
test('should create user successfully', async () => {})
test('should reject duplicate email', async () => {})

// Bad: Multiple assertions in one test
test('should create user and handle errors', async () => {
  // Testing multiple things
})
```

### 5. Use Setup and Teardown

```typescript
group.each.setup(async () => {
  // Runs before each test
  await db.beginGlobalTransaction()
  return () => db.rollbackGlobalTransaction() // Runs after each test
})

group.setup(async () => {
  // Runs once before all tests in the group
})

group.teardown(async () => {
  // Runs once after all tests in the group
})
```

## Testing Authentication

### Creating Test Users

```typescript
const admin = await User.create({
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin',
})

const regularUser = await User.create({
  name: 'Regular User',
  email: 'user@example.com',
  password: 'password123',
  role: 'associate',
})
```

### Testing Authenticated Routes

```typescript
// Authenticated request
const response = await client.get('/protected').loginAs(user)

// Unauthenticated request
const response = await client.get('/protected')
response.assertStatus(302)
response.assertRedirectsTo('/login')
```

### Testing Role-Based Access

```typescript
test('should allow admin access', async ({ client }) => {
  const admin = await User.create({ role: 'admin' })
  const response = await client.get('/admin-only').loginAs(admin)
  response.assertStatus(200)
})

test('should deny non-admin access', async ({ client }) => {
  const user = await User.create({ role: 'associate' })
  const response = await client.get('/admin-only').loginAs(user)
  response.assertStatus(403)
})
```

## Testing Inertia.js Responses

When testing Inertia.js responses, use the `assertInertiaComponent` method:

```typescript
response.assertInertiaComponent('users/index')
response.assertInertiaComponent('users/create')
response.assertInertiaComponent('users/edit')
```

## Common Testing Patterns

### Testing Pagination

```typescript
test('should paginate users list', async ({ client }) => {
  const admin = await User.create({ role: 'admin' })

  // Create multiple records
  for (let i = 0; i < 20; i++) {
    await User.create({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      password: 'password123',
    })
  }

  const response = await client.get('/users?page=1').loginAs(admin)
  response.assertStatus(200)
  response.assertInertiaComponent('users/index')
})
```

### Testing Validation Errors

```typescript
test('should reject invalid data', async ({ client }) => {
  const admin = await User.create({ role: 'admin' })

  const response = await client.post('/users')
    .loginAs(admin)
    .form({
      name: 'Jo',  // Too short
      email: 'invalid-email',  // Invalid format
      password: '12345',  // Too short
    })

  response.assertStatus(302)
  // Validation errors are typically handled via redirects with flash messages
})
```

### Testing 404 Errors

```typescript
test('should return 404 for non-existent resource', async ({ client }) => {
  const admin = await User.create({ role: 'admin' })
  const response = await client.get('/users/99999/edit').loginAs(admin)
  response.assertStatus(404)
})
```

## Debugging Tests

### Running Single Test

```bash
node ace test --files=tests/unit/models/user.spec.ts
```

### Adding Console Logs

```typescript
test('should debug test', async ({ client, assert }) => {
  const response = await client.get('/users')
  console.log('Response status:', response.response.status)
  console.log('Response body:', response.response.body)
})
```

### Using Test Timeouts

If a test needs more time, you can increase the timeout:

```typescript
test('should handle long operation', async ({ assert }) => {
  // Test implementation
}).timeout(10000) // 10 seconds
```

## Continuous Integration

Tests are automatically run in CI/CD pipelines. Ensure all tests pass before pushing code:

```bash
pnpm test
```

## Additional Resources

- [Japa Documentation](https://japa.dev/docs)
- [AdonisJS Testing Guide](https://docs.adonisjs.com/guides/testing)
- [Japa Assertions](https://japa.dev/docs/assertions)

