// Simple file-backed JSON data store with atomic writes.
// Keeps the whole catalog + admin accounts in data/db.json. Good enough for
// a single-node deployment; swap for Postgres/SQLite later without changing
// the API surface (getAll/get/create/update/remove/...).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// DATA_DIR can be overridden via env so a hosting provider's persistent
// disk (e.g. a Render Disk mounted at /var/data) survives restarts/deploys.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

function ensureDirs(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if(!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Pull the built-in demo catalog from the frontend file so the server and
// storefront share one source of truth. Falls back to an empty seed.
function seedProducts(){
  try {
    const code = fs.readFileSync(path.join(__dirname, 'public', 'products.js'), 'utf8');
    const sandbox = { window: undefined, document: undefined, fetch: undefined, localStorage: undefined };
    vm.createContext(sandbox);
    vm.runInContext(code + '\n;this.__BUILTIN = (typeof BUILTIN_PRODUCTS!=="undefined")?BUILTIN_PRODUCTS:[];', sandbox);
    const builtins = sandbox.__BUILTIN || [];
    return builtins.map(p => Object.assign({}, p, { custom: false, img: p.img || null }));
  } catch(e){
    console.warn('[db] Could not seed from frontend products.js:', e.message);
    return [];
  }
}

let state = null;

function load(){
  ensureDirs();
  if(fs.existsSync(DB_FILE)){
    try {
      state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch(e){
      console.error('[db] db.json is corrupt, starting fresh:', e.message);
      state = null;
    }
  }
  if(!state){
    state = { products: seedProducts(), admins: [], secret: null };
    persist();
    console.log('[db] Initialised data/db.json with ' + state.products.length + ' seed products.');
  }
  if(!Array.isArray(state.products)) state.products = [];
  if(!Array.isArray(state.admins)) state.admins = [];
  return state;
}

function persist(){
  ensureDirs();
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DB_FILE); // atomic on same filesystem
}

function getState(){ if(!state) load(); return state; }

// ---- Products ----
function getAll(){ return getState().products; }
function get(id){ return getState().products.find(p => p.id === id); }
function nextId(){ return getState().products.reduce((m, p) => Math.max(m, p.id), 0) + 1; }
function create(obj){
  const p = Object.assign({ id: nextId() }, obj);
  getState().products.push(p);
  persist();
  return p;
}
function update(id, obj){
  const arr = getState().products;
  const i = arr.findIndex(p => p.id === id);
  if(i === -1) return null;
  arr[i] = Object.assign({}, arr[i], obj, { id });
  persist();
  return arr[i];
}
function remove(id){
  const arr = getState().products;
  const i = arr.findIndex(p => p.id === id);
  if(i === -1) return false;
  const [removed] = arr.splice(i, 1);
  persist();
  return removed;
}

// ---- Admins ----
function getAdmin(username){ return getState().admins.find(a => a.username === username); }
function addAdmin(username, hash){
  getState().admins.push({ username, hash });
  persist();
}
function setSecret(s){ getState().secret = s; persist(); }
function getSecret(){ return getState().secret; }

module.exports = {
  DATA_DIR, UPLOAD_DIR, load,
  getAll, get, create, update, remove, nextId,
  getAdmin, addAdmin, setSecret, getSecret
};
