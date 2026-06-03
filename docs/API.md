# API Routes

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/demo`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `PATCH /api/auth/settings`

## Lessons

- `GET /api/lessons`
- `POST /api/lessons` admin only
- `DELETE /api/lessons/:id` admin only

## Progress

- `POST /api/progress/session`
- `GET /api/progress/dashboard`
- `GET /api/progress/leaderboard`

## Admin

- `GET /api/admin/overview`
- `GET /api/admin/users`
