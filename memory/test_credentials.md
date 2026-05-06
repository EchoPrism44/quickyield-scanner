# QuickYield Test Credentials

## Admin
- Email: admin@quickyield.io
- Password: QuickYield2026!
- Role: admin

## Test User (Demo)
- Email: demo@quickyield.io
- Password: DemoUser2026!
- Role: user

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me

## Auth flow
- Frontend stores `access_token` in localStorage as `qy_token`
- Backend reads Bearer token from Authorization header (cookies also set as fallback)
