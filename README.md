# ElectroHub

An electronic-components store with a storefront, product detail pages, a
shopping cart, and an **authenticated admin dashboard** backed by a real
server with persistent storage.

## Features

- Storefront with search, category filters and a localStorage cart.
- Product detail pages (specs, reviews, related items).
- Admin dashboard (`/admin.html`) to add / edit / delete parts **with photo
  uploads**.
- Login-protected admin API (session cookie, hashed passwords).
- Catalog + uploaded images persisted on the server (survives restarts).

## Tech

- Node.js + Express API
- Auth: `bcryptjs` password hashing + JWT in an httpOnly cookie
- Uploads: `multer` (disk storage, image-only, 4 MB limit)
- Storage: a small file-backed JSON store (`data/db.json`) with atomic writes
- Frontend: plain HTML/CSS/JS in `public/`

## Run locally

```bash
npm install
cp .env.example .env      # then edit ADMIN_PASSWORD and JWT_SECRET
npm start
```

Open http://127.0.0.1:3000 for the store and
http://127.0.0.1:3000/admin.html for the dashboard.

If you don't create a `.env`, a default admin account is created on first
run and its credentials are printed in the server log
(`admin` / `admin123`) — change these before going public.

## Configuration (env vars)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address (use `0.0.0.0` behind a proxy) |
| `ADMIN_USER` | `admin` | First admin username (seeded on first run) |
| `ADMIN_PASSWORD` | `admin123` | First admin password (seeded on first run) |
| `JWT_SECRET` | random | Session signing secret (set a fixed value in prod) |
| `SECURE_COOKIES` | `0` | Set `1` when served over HTTPS |

## Data & persistence

- `data/db.json` — products + admin accounts (created on first run, seeded
  with the built-in demo catalog taken from `public/products.js`).
- `data/uploads/` — uploaded product images.
- Both live under `data/` which is git-ignored. Back it up to keep your
  catalog. For multi-instance / serverless hosting, replace the file store
  in `db.js` with a managed database (Postgres, etc.) — the API surface
  (`getAll/get/create/update/remove`) stays the same.

## API

Public:
- `GET /api/products` — list products
- `GET /api/products/:id` — one product

Auth required (session cookie):
- `POST /api/login` `{username,password}` — sets session cookie
- `POST /api/logout`
- `GET /api/me`
- `POST /api/products` — multipart form (fields + optional `image`)
- `PUT /api/products/:id` — multipart form (`keepImage=1` to keep current photo)
- `DELETE /api/products/:id`

## Deployment notes

- Works on any host that runs Node and keeps a persistent disk
  (Render, Railway, Fly.io, a VPS, etc.). Set the env vars, run `npm start`,
  and put it behind HTTPS (set `SECURE_COOKIES=1`).
- **Netlify/Vercel static hosting alone won't run this server.** You can host
  the static `public/` folder there and point it at this API elsewhere by
  setting `window.ELECTROHUB_API = 'https://your-api-host'` before
  `products.js` loads. Note the file-based store is not suitable for
  ephemeral serverless filesystems — use a managed DB there.
- The storefront degrades gracefully: if the API is unreachable it falls back
  to the built-in demo catalog so the pages still render.
