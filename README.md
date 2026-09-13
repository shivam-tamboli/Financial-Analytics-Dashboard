# Penta — Financial Analytics Dashboard

Full-stack assignment: a financial dashboard with JWT login, charts, a filterable/sortable
transaction table, and CSV export. Frontend is React + TypeScript (Vite, Chakra UI, Recharts,
TanStack Query). Backend is Express + TypeScript on MongoDB, auth via JWT.

The UI follows the "Penta" design reference from the assignment (dark theme, sidebar nav,
metric cards, the income/expense trend chart, recent transactions panel).

```
backend/    Express API, Mongoose models, seed script
frontend/   Vite + React SPA
```

## Getting it running

You need Node 18+ and a MongoDB instance — local `mongod`, Docker, or Atlas all work.

**Backend:**

```bash
cd backend
cp .env.example .env   # then fill in your Mongo URI and JWT secret, see below
npm install
npm run seed            # loads data/transactions.json and creates the login user
npm run dev              # http://localhost:5050
```

**Frontend**, in a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Log in with:

```
username: analyst
password: Analyst@123
```

### Backend `.env`

`MONGO_URI` and `JWT_SECRET` don't have defaults — the app won't start without them, on
purpose, so a typo or a forgotten env var on a deployed host fails loudly instead of quietly
connecting to the wrong thing (or nothing).

| Variable | What it's for |
|---|---|
| `PORT` | API port, defaults to `5050` |
| `MONGO_URI` | Required. Local: `mongodb://127.0.0.1:27017/finance_dashboard`. Atlas: `mongodb+srv://<user>:<password>@<cluster-host>/finance_dashboard?appName=Cluster0` |
| `JWT_SECRET` | Required. Anything long and random works — `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime, defaults to `1d` |
| `CORS_ORIGIN` | Comma-separated allowed origins, e.g. `http://localhost:5173,https://your-app.vercel.app`. Add your deployed frontend URL here once you have one |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | The login account `npm run seed` creates |

Running `npm run seed` again is safe — it skips the user if it already exists, but it does
wipe and reload the `transactions` collection every time from `data/transactions.json`.

### About the avatars

The sample JSON only gives each row a `user_id`, no name or email. The seed script maps the
4 user ids to display names and builds a Gravatar URL from a placeholder email based on that
name (the sample's own `user_profile` field points at a service that returns a different
random face every time you load it, so it's useless as an actual avatar). Since none of those
placeholder emails have a real Gravatar registered, the request comes back 404, which the
frontend's Avatar component catches and falls back to initials — so you get "MF", "EN", etc.
instead of a broken image icon.

## What's in the app

Log in, and you land on the dashboard: balance/revenue/expenses/savings cards, an
income-vs-expense chart, a category breakdown, and recent transactions — all of which update
live as you filter. Below that is the transaction table with search, category/status/user
filters, a date/amount range popover, sortable columns, and pagination.

Hit "Export CSV" to pick which columns you want and whether to export the current filtered
view or everything, then download — the file is generated on the backend and streamed down
with a proper `Content-Disposition` header, so it just downloads like any normal file.

## API

Everything's under `/api`. Anything marked 🔒 needs `Authorization: Bearer <token>`.

**`POST /api/auth/login`** — `{ username, password }` → `{ token, user }`. Rate-limited to 20
attempts per 15 minutes per IP.

**`GET /api/auth/me`** 🔒 — returns the user from the token.

**`POST /api/auth/logout`** 🔒 — returns `200`. JWTs are stateless so there's nothing to
actually revoke server-side; this mostly exists so there's a real endpoint to hit on sign-out.
The token still gets thrown away client-side either way, which is what ends the session.

**`GET /api/transactions`** 🔒 — paginated/filtered/sorted list.

| Param | Notes |
|---|---|
| `page`, `limit` | default `1`, `10` — `limit` caps at `100` |
| `sortBy` | `date` \| `amount` \| `category` \| `status` \| `user_name` \| `id` |
| `sortOrder` | `asc` \| `desc` |
| `search` | matches user name/id, category, status, or amount/id if it's a number |
| `category` | `Revenue` \| `Expense` |
| `status` | `Paid` \| `Pending` |
| `userId` | e.g. `user_002` |
| `dateFrom` / `dateTo` | ISO dates, inclusive |
| `amountMin` / `amountMax` | inclusive |

Returns `{ data, pagination: { page, limit, total, totalPages } }`.

**`GET /api/transactions/summary`** 🔒 — same filters, no pagination. Returns balance/revenue/
expenses/savings, a category breakdown, monthly income vs. expense totals, and the 5 most
recent matching transactions. `balance` is revenue minus expenses across everything; `savings`
is the same but Paid-only, i.e. money that's actually settled rather than still pending.

**`GET /api/transactions/users`** 🔒 — distinct users for the filter dropdown.

**`POST /api/transactions/export`** 🔒 — `{ columns?, filters? }`, streams back a CSV with
`Content-Disposition: attachment`. 404s if nothing matches the filters.

Errors always come back as `{ error: { message, details? } }` with the status you'd expect
(400 for bad input, 401 for auth, 404, 409 on conflict, 500 otherwise).

## Database

`transactions`: `id` (unique), `date`, `amount`, `category`, `status`, `user_id`, `user_name`,
`user_profile`. `user_name` is denormalized onto each row on purpose so search/sort doesn't
need a join.

Indexed on `id` (unique), `{category, status, date}` (covers the default table query),
`date`, `user_id`, `amount`, and `user_name`. Worth noting: the free-text search still does a
full collection scan even with that index, since it's an unanchored case-insensitive regex
across several fields — indexes can't help much there. Doesn't matter at 300 rows.

`users` (login accounts, unrelated to the transaction `user_id`s): `username` (unique),
`passwordHash`, `name`.

## A few things worth knowing

- The Figma link in the assignment PDF wasn't reachable from here, so I worked from the
  screenshot of it instead.
- Only 4 users and 2 categories/statuses exist in the sample data, but nothing in the code
  assumes that — more of either would work without changes.
