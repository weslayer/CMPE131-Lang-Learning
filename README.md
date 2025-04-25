nihao huzz!

### `docker-compose up -d` to run

# Language Learning App

## Modern Authentication System

This project uses a modern, flexible authentication system that combines NextAuth.js with JWT tokens:

### Authentication Options

1. **Header-based Authentication** (Primary Method)
   - Frontend passes NextAuth user information in headers:
     - `X-User-ID`: Unique user identifier from NextAuth
     - `X-User-Email`: User's email address
     - `X-User-Name`: User's display name
   - These headers are automatically added by our auth utilities

2. **JWT Token Authentication** (Alternative Method)
   - For services that prefer token-based authentication
   - Tokens can be obtained from the `/auth/token` endpoint
   - Standard Bearer token authentication: `Authorization: Bearer <token>`

### Frontend Utilities

The auth system provides convenient helper functions:

```typescript
// Get authentication headers for any request
const headers = await getAuthHeaders();

// Get a JWT token
const token = await getApiToken();

// Create an authenticated fetch function
const authFetch = await createAuthFetch();
const data = await authFetch('/api/something');
```

### Security and Best Practices

- All requests are protected against CSRF attacks
- JWT tokens are signed with a secure key and have limited lifetime
- User IDs are consistently used across the system
- Headers are validated on the server side

### User Management

Users are automatically created on first login, with a unified database interface that:
1. First tries to find users by their NextAuth ID
2. Falls back to email-based lookup if needed
3. Creates new users when they don't exist

This approach provides maximum flexibility while maintaining security and consistency.

### Streamlined Flashcard Access

The application includes optimized endpoints for flashcard operations:

1. **Simplified Retrieval:** `/api/my-flashcards` (GET) - Get all flashcards with a single API call
2. **Simplified Creation:** `/api/my-flashcards` (POST) - Create flashcards and add to default deck in one operation
3. **Direct Frontend Functions:** Use the utility functions in `flashcard-actions.ts`:
   - `getMyFlashcards()` - Fetch all user flashcards
   - `createFlashcard(data)` - Create a new flashcard

These streamlined endpoints combine multiple database operations into single API calls for improved performance and reduced code complexity.

### Migration to NextAuth IDs

If you're upgrading from a previous version, run the migration script to ensure all users have NextAuth-compatible IDs:

```bash
cd backend
python migrate_users_to_nextauth.py
```

### JWT Token Structure

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://...",
  "exp": 1234567890
}
```

### Environment Variables

For proper JWT authentication, these environment variables must be configured:

- `JWT_SECRET_KEY`: The secret key used to sign and verify JWT tokens
- `JWT_ALGORITHM`: The algorithm used for JWT tokens (default: "HS256")
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token lifetime in minutes (default: 30)

These should be set in both frontend and backend .env files.

## Backend Setup

// ... rest of the README content