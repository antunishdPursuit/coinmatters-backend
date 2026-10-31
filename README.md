# CoinMatters API

The Express and PostgreSQL API behind the
[CoinMatters frontend](https://github.com/antunishdPursuit/coinmatterscapstone-frontend).
It stores accounts and saved grocery lists and serves the products and stores
the frontend compares.

## Run Locally

Requirements:

- Node.js 20 or newer (tested on Node 24)
- PostgreSQL 16

Create an empty PostgreSQL 16 database; any local server works. Copy
`.env.example` to `.env` and fill it in; it explains each setting. Then:

```bash
npm ci
npm run db:setup
npm start
```

`npm run db:setup` creates the tables, loads the sample data into an empty
database and creates the limited account the app runs as. It is safe to run
again and brings an older database up to date. The frontend expects the API
at `http://127.0.0.1:3013` (`HOST=127.0.0.1`, `PORT=3013`) and runs at
`http://127.0.0.1:3220` (`ORIGIN_URL`).

## Sample Account

Log in as `testuser@example.com` with the password `password123`. The
account starts with two saved lists, a *Grocery List* (milk, eggs, water,
cheese) and a *Party List* (pizza, ice cream, water, yogurt), so comparing,
editing and deleting lists can be tried right away.

## Testing

```bash
npm test
```

The tests start the app on a free port, use the database in `.env`, and
remove the users they create.

## Security

Passwords are stored as bcrypt hashes and never sent back. Logging in sets an
HttpOnly cookie that lasts one hour. Every list route needs a login, and
users can only see and change their own lists. Requests that change data must
be JSON, logins and registrations are rate-limited, and the app connects to
the database with an account that can only do what it needs.

## Limitations

- Prices are sample data, not live store prices.
- ZIP codes are stored as numbers, so a code with a leading zero loses it.
- The session cookie is marked `Secure`, which browsers accept on
  `127.0.0.1` and `localhost` only; anywhere else the API needs HTTPS.
- The API runs locally only; there is no public deployment.

## Credits

CoinMatters began in 2023 as a team capstone project built by **Irwin
Jorge**, **Noni Porter** and **Dennys Antunish**, with **Lakisha Johnson**,
who shaped the initial layout and contributed code. Tech mentor **Will
Dickerson** helped design the data model, and design mentor **Dillon
Eversman** guided the page layout.

In 2026 Dennys rebuilt it with Claude Code, an AI coding assistant: updated
dependencies, security fixes, a safe database setup command, and tests.
