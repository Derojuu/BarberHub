# BarberHub

> A Next.js + Prisma sample app for managing haircuts, purchases, points and coupons. This repository contains both customer-facing pages and an admin panel with content management (haircuts) and transactional approval flows.

## Table of contents
- What is this
- Key features
- Tech stack
- Prerequisites
- Environment variables
- Setup (development)
- Database (Prisma) commands
- Running the app
- Important API routes
- Typical manual test flow
- Troubleshooting
- Contributing
- License

## What is this

BarberHub is a small web application built with the Next.js App Router that demonstrates a booking/points/coupons workflow for a barber shop. Customers can register, book haircuts (which create pending point transactions), and redeem points for coupons. Admins can approve transactions, verify coupons, and manage haircuts (including uploading images to Cloudinary).

## Key features

- Customer registration/login (using username and password)
- Admin registration/login (protected by an admin secret)
- Bookings that create pending points transactions
- Admin approval workflow that atomically updates user `pointsBalance`
- Coupon purchase flow that atomically deducts points and creates coupon records
- Cloudinary signed uploads for admin-managed haircut images
- Prisma-backed persistence (PostgreSQL recommended)

## Tech stack

- Next.js (App Router) — React + TypeScript
- Prisma ORM + PostgreSQL (or other supported DB)
- Cloudinary for image hosting (signed uploads)
- JSON Web Tokens (JWT) + bcrypt for authentication
- TailwindCSS + Radix UI for UI primitives

## Prerequisites

- Node.js (v18+ recommended)
- pnpm (preferred; repo scripts expect `pnpm`) — you can still use npm/yarn but commands below use pnpm
- A PostgreSQL database (or other database supported by Prisma); ensure `DATABASE_URL` is set
- Cloudinary account (for image uploads) — `CLOUDINARY_URL` env var or separate keys

## Environment variables

Create a `.env` file in the project root (do NOT commit secrets). The app expects at least the following keys:

```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
JWT_SECRET="a-very-secret-key"
ADMIN_SECRET_KEY="your-admin-secret-key"
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
```

Notes:
- The project uses `CLOUDINARY_URL` (Cloudinary's single-string connection) for the server-side signing endpoint. If you prefer separate env vars, you can adapt the server sign endpoint accordingly.

## Setup (development)

Install dependencies:

```powershell
pnpm install
```

Set up the database schema and the Prisma client. The repo provides several handy scripts in `package.json`.

You can run a full DB setup (generate client + run migrations interactively):

```powershell
pnpm db:setup
```

Or run the commands individually:

```powershell
pnpm prisma:generate      # generate Prisma client
pnpm prisma:migrate       # create/run migrations (interactive)
# or, if you prefer not to use migrations:
pnpm prisma:push         # push Prisma schema to DB (no migration history)
```

To open Prisma Studio (DB GUI):

```powershell
pnpm prisma:studio
```

If you already have production data and are adding the `pointsBalance` field to `User`, consider backfilling it from existing approved `Points` rows. If you'd like, I can provide a small script to compute and write `pointsBalance` from approved transactions.

## Running the app

Start the dev server:

```powershell
pnpm dev
```

Build for production:

```powershell
pnpm build
pnpm start
```

## Important scripts (from package.json)

- `pnpm dev` — run Next.js in development mode
- `pnpm build` — build the app for production
- `pnpm start` — start the built app
- `pnpm prisma:generate` — generate Prisma client
- `pnpm prisma:migrate` — run interactive migrations
- `pnpm prisma:push` — push schema to DB
- `pnpm prisma:studio` — open Prisma Studio

## Important API routes (high level)

These routes are implemented under `app/api/` (App Router API routes). Key endpoints include:

- `POST /api/register` — customer registration (sends `username` + password)
- `POST /api/login` — customer login
- `POST /api/admin/register` — admin registration (requires `ADMIN_SECRET_KEY`)
- `POST /api/admin/login` — admin login
- `GET /api/haircuts` — list haircuts (services)
- `POST /api/haircuts` — (admin) create a haircut entry (image URL + metadata)
- `POST /api/purchases` — customer books a haircut; creates a pending Points transaction
- `GET /api/admin/transactions` — admin: list pending/previous transactions
- `POST /api/admin/validate-points` — admin: approve/deny a pending transaction; approval atomically updates the user's `pointsBalance`
- `POST /api/coupons` — customer: buy a coupon (transactionally decrements `pointsBalance` and creates a coupon)
- `POST /api/admin/verify-coupon` — admin: verify (redeem/mark used) a coupon
- `POST /api/admin/cloudinary/sign` — admin-only: generate signature and timestamp for client-side signed uploads to Cloudinary

Refer to the code under `app/api/*` for the full implementations and any required request shapes.

## Typical manual test flow

1. Start the app and ensure the DB is migrated and Prisma client generated.
2. As a customer:
   - Register a user (username + password).
   - Log in and book a haircut (this will create a pending transaction).
3. As an admin:
   - Register/Log in as an admin (requires `ADMIN_SECRET_KEY` during registration).
   - Open the admin panel and approve the pending transaction — this should atomically increase the customer's `pointsBalance`.
4. As the customer:
   - Check your points balance and redeem points for a coupon.
5. As admin:
   - Verify the coupon code and mark it used.

If you use the admin haircuts UI, create a Cloudinary-signed upload (the UI calls `/api/admin/cloudinary/sign` to get a signature and then uploads to Cloudinary directly). After upload, the admin UI sends the resulting `secure_url` to `POST /api/haircuts` to create the haircut record.

## Troubleshooting

- Dev server fails with TypeScript errors related to `pointsBalance`:
  - This usually means you added `pointsBalance` to `prisma/schema.prisma` but haven't run `prisma generate` or applied the migration. Run:

```powershell
pnpm prisma:generate
pnpm prisma:migrate
```

- `prisma` client type mismatch after schema change: re-run `pnpm prisma:generate`.
- Cloudinary uploads failing: verify `CLOUDINARY_URL` is set and the server can parse it. For troubleshooting, confirm the API key/secret/cloud name are correct in the URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME).
- Race conditions or negative `pointsBalance`: the server performs transactional updates for approvals and coupon purchases. If you see unexpected negative values, ensure your DB operations are not being bypassed and that migrations were applied successfully.

## Contributing

Contributions are welcome. A minimal suggested workflow:

1. Fork the repo.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make changes and add tests where appropriate.
4. Run the dev server and verify behavior.
5. Open a pull request with a clear description of the change.

If you're adding or changing the Prisma schema, please include migration files or document how to apply changes locally.
