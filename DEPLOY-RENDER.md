# Deploy the ElectroHub backend to Render

This makes the admin login, adding products, and image uploads work on a
live website (Netlify can't run the backend — Render can).

---

## Before you start

You need:
- A free Render account: https://render.com (sign up with GitHub/GitLab/email).
- Your project in a **GitHub (or GitLab) repository**. Render deploys from a
  Git repo. If your code isn't on GitHub yet, create a new repo and push the
  `electrohub` folder to it.

---

## Steps (dashboard, ~5 minutes)

1. **Log in to Render** and click **New +** -> **Web Service**.

2. **Connect your repository.** Pick the repo that contains ElectroHub and
   click **Connect**. (First time only: authorize Render to see your repos.)

3. **Fill in the settings:**
   - **Name:** `electrohub` (or anything you like)
   - **Region:** the one closest to you
   - **Branch:** `main` (or whichever branch has your code)
   - **Root Directory:** leave blank if the repo root *is* the electrohub
     folder. If electrohub is a sub-folder, type `electrohub`.
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (fine for testing)

4. **Add environment variables** (click "Advanced" -> "Add Environment
   Variable"). These set your admin login and keep it secure:

   | Key              | Value                                             |
   |------------------|---------------------------------------------------|
   | `ADMIN_USER`     | the username you want (e.g. `admin`)              |
   | `ADMIN_PASSWORD` | a strong password you choose                      |
   | `JWT_SECRET`     | a long random string (letters+numbers, 30+ chars) |
   | `NODE_VERSION`   | `16`                                              |

   > Your login will be whatever you put in `ADMIN_USER` / `ADMIN_PASSWORD`
   > here — **not** `admin123` anymore. Pick something only you know.
   >
   > **Do NOT add a `PORT` variable.** Render sets the port automatically and
   > the server reads it. (The server binds to `0.0.0.0` by default so Render
   > can detect the open port — you don't need to configure anything for this.)

5. **Click "Create Web Service."** Render installs the packages and starts the
   server. The first deploy takes a couple of minutes. When it's done you'll
   see a green **Live** badge and a URL like
   `https://electrohub.onrender.com`.

6. **Open your site.** Visit that URL — the storefront loads. Add `/admin.html`
   to the end (e.g. `https://electrohub.onrender.com/admin.html`) and log in
   with the username/password you set in step 4. Adding products and image
   uploads now work. 🎉

---

## Keeping your data (important)

Your added products and uploaded images are saved in a `data` folder on the
server. On Render's **Free** plan the disk is temporary — it resets whenever
the service restarts or you redeploy, so your changes would be lost and the
catalog goes back to the 18 built-in products.

To keep data permanently:
1. Use a paid instance type (needed for disks).
2. In your service: **Settings -> Disks -> Add Disk.**
   - **Name:** `electrohub-data`
   - **Mount Path:** `/var/data`
   - **Size:** 1 GB is plenty
3. Add one more environment variable: `DATA_DIR` = `/var/data`
4. Save and redeploy. Now products and images survive restarts.

(If you stay on the free plan, that's fine for a demo — just know the
catalog resets on restart.)

---

## Faster option: deploy with the included blueprint

The project ships a `render.yaml` file. Instead of filling the form by hand:
1. In Render, click **New +** -> **Blueprint**.
2. Connect the same repo. Render reads `render.yaml` and pre-fills everything.
3. It will still ask you to type a value for `ADMIN_PASSWORD` (kept secret).
4. Click apply and wait for it to go Live.

(The blueprint includes a 1 GB disk by default. If you're on the free plan,
open `render.yaml` and delete the `disk:` block and the `DATA_DIR` env var
first, since disks need a paid plan.)

---

## Connecting your Netlify storefront to this backend (optional)

You can keep the fast static storefront on Netlify and point it at the Render
backend for live data. In `public/products.js` and `public/admin.js` there is
an `API_BASE` setting — set it to your Render URL
(e.g. `https://electrohub.onrender.com`). If you'd like, I can wire that up
for you so Netlify + Render work together. Otherwise, just use the Render URL
for everything — it serves both the shop and the admin.

---

## Quick troubleshooting

- **Login says "Cannot reach the server":** the service may be asleep (free
  plan sleeps after inactivity). Reload once — the first request wakes it up
  (can take ~30 seconds).
- **Deploy log loops on "No open ports detected on 0.0.0.0":** make sure you
  did NOT set a `PORT` environment variable, and that you're running the
  latest code (the server binds to `0.0.0.0` and uses Render's port). Then
  trigger a redeploy (Manual Deploy -> Clear build cache & deploy).
- **Login rejected:** double-check `ADMIN_USER` / `ADMIN_PASSWORD` in the
  Render dashboard match what you're typing. Changing them requires a redeploy.
- **Added products disappeared:** that's the free-plan temporary disk — add a
  persistent disk (see above) to keep them.
