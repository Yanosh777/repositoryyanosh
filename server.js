// ElectroHub backend: Express API with cookie-session auth + file-backed
// persistence, serving the static storefront from ./public.
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1'; // bind locally by default; set 0.0.0.0 behind a proxy
const HOST = process.HOST||'0.0.0.0';
const SECURE_COOKIES = process.env.SECURE_COOKIES === '1'; // enable behind HTTPS
const TOKEN_TTL = '7d';

db.load();

// ---- Secret (persisted so sessions survive restarts) ----
let SECRET = process.env.JWT_SECRET || db.getSecret();
if(!SECRET){ SECRET = crypto.randomBytes(32).toString('hex'); db.setSecret(SECRET); }

// ---- Seed the first admin ----
function seedAdmin(){
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  if(!db.getAdmin(username)){
    db.addAdmin(username, bcrypt.hashSync(password, 10));
    if(!process.env.ADMIN_PASSWORD){
      console.warn('\n\u26A0\uFE0F  No ADMIN_PASSWORD set \u2014 created default admin account:');
      console.warn('    username: ' + username + '    password: ' + password);
      console.warn('    Change it via ADMIN_USER / ADMIN_PASSWORD env vars before going public.\n');
    }
  }
}
seedAdmin();

const app = express();
app.use(express.json());
app.use(cookieParser());

// ---- Uploads (disk storage, image-only, size-limited) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, db.UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (file.mimetype === 'image/png') ? '.png'
      : (file.mimetype === 'image/webp') ? '.webp' : '.jpg';
    cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  fileFilter: (req, file, cb) => {
    if(/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPG or WebP images are allowed.'));
  }
});

// ---- Auth helpers ----
function signToken(user){ return jwt.sign({ u: user.username }, SECRET, { expiresIn: TOKEN_TTL }); }
function requireAuth(req, res, next){
  const token = req.cookies[COOKIE];
  if(!token) return res.status(401).json({ error: 'Not authenticated.' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch(e){ return res.status(401).json({ error: 'Session expired.' }); }
}

// Basic in-memory login throttle (per IP)
const attempts = new Map();
function throttle(ip){
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, ts: now };
  if(now - rec.ts > 15 * 60 * 1000){ rec.count = 0; rec.ts = now; }
  rec.count++; attempts.set(ip, rec);
  return rec.count <= 10; // max 10 attempts / 15 min
}

// ---- Auth routes ----
app.post('/api/login', (req, res) => {
  const ip = req.ip || 'unknown';
  if(!throttle(ip)) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  const { username, password } = req.body || {};
  const admin = username && db.getAdmin(String(username));
  if(!admin || !bcrypt.compareSync(String(password || ''), admin.hash)){
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  const token = signToken(admin);
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: SECURE_COOKIES,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.json({ username: admin.username });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ username: req.user.u });
});

// ---- Product routes ----
app.get('/api/products', (req, res) => res.json(db.getAll()));
app.get('/api/products/:id', (req, res) => {
  const p = db.get(parseInt(req.params.id, 10));
  if(!p) return res.status(404).json({ error: 'Not found.' });
  res.json(p);
});

function parseBody(req){
  const b = req.body || {};
  let specs = [];
  try { specs = b.specs ? JSON.parse(b.specs) : []; } catch(e){ specs = []; }
  const price = parseFloat(b.price);
  const stock = parseInt(b.stock, 10);
  const name = String(b.name || '').trim();
  return {
    name,
    cat: String(b.cat || 'Components').trim(),
    price: isNaN(price) ? 0 : Math.round(price * 100) / 100,
    stock: isNaN(stock) ? 0 : stock,
    sku: String(b.sku || '').trim() || autoSku(name),
    tag: String(b.tag || '').trim(),
    desc: String(b.desc || '').trim() || name,
    long: String(b.long || '').trim() || name,
    specs: Array.isArray(specs) ? specs : [],
    rating: 4.5, reviews: 0, icon: '\uD83D\uDCE6', custom: true
  };
}
function autoSku(name){
  return 'EH-' + String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6) + '-' +
    crypto.randomBytes(2).toString('hex').toUpperCase();
}
function uploadedPath(req){
  return req.file ? '/uploads/' + path.basename(req.file.path) : null;
}
function removeUpload(imgPath){
  if(imgPath && imgPath.indexOf('/uploads/') === 0){
    const f = path.join(db.UPLOAD_DIR, path.basename(imgPath));
    fs.existsSync(f) && fs.unlink(f, () => {});
  }
}

app.post('/api/products', requireAuth, upload.single('image'), (req, res) => {
  const data = parseBody(req);
  if(!data.name) return res.status(400).json({ error: 'Name is required.' });
  const img = uploadedPath(req);
  if(img) data.img = img;
  const created = db.create(data);
  res.status(201).json(created);
});

app.put('/api/products/:id', requireAuth, upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.get(id);
  if(!existing) return res.status(404).json({ error: 'Not found.' });
  const data = parseBody(req);
  if(!data.name) return res.status(400).json({ error: 'Name is required.' });
  // Preserve rating/reviews/custom flag of the existing record where sensible
  data.custom = existing.custom;
  data.rating = existing.rating != null ? existing.rating : 4.5;
  data.reviews = existing.reviews != null ? existing.reviews : 0;
  if(existing.icon) data.icon = existing.icon;
  const newImg = uploadedPath(req);
  if(newImg){
    removeUpload(existing.img); // replace
    data.img = newImg;
  } else if(req.body.keepImage === '1'){
    data.img = existing.img || null;
  } else {
    data.img = null; // image was cleared
    removeUpload(existing.img);
  }
  const updated = db.update(id, data);
  res.json(updated);
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const removed = db.remove(id);
  if(!removed) return res.status(404).json({ error: 'Not found.' });
  removeUpload(removed.img);
  res.json({ ok: true });
});

// ---- Static assets ----
app.use('/uploads', express.static(db.UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Multer / generic error handler
app.use((err, req, res, next) => {
  if(err) return res.status(400).json({ error: err.message || 'Request failed.' });
  next();
});

app.listen(PORT, 0.0.0.0, () => {
  console.log('ElectroHub running at http://' + HOST + ':' + PORT);
});
