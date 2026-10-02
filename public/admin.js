// ===== Admin dashboard (backend-backed) =====
// Talks to the Express API for real persistence and uses a session cookie
// for authentication. Relies on products.js (CATEGORIES, API_BASE,
// productVisual, imgSrc).

const MAX_DIM = 700;
const JPEG_QUALITY = 0.82;
let imageBlob = null;      // new image to upload (Blob) or null
let imageDataUrl = '';     // preview data URL
let editingId = null;
let keepExistingImg = false;
let datasheetFile = null;    // new PDF datasheet to upload (File) or null
let keepExistingSheet = false;

const $a = s => document.querySelector(s);
function escA(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
async function api(path, opts){
  const o = Object.assign({ credentials: 'include' }, opts || {});
  return fetch(API_BASE + path, o);
}

// ---------- Auth ----------
async function checkAuth(){
  try {
    const r = await api('/api/me');
    if(r.ok){ const u = await r.json(); showDashboard(u); return; }
  } catch(e){
    showLogin('Cannot reach the server. Start the backend (npm start) and reload.');
    return;
  }
  showLogin();
}

function showLogin(err){
  $a('#loginView').style.display = 'grid';
  $a('#dashView').style.display = 'none';
  $a('#logoutBtn').style.display = 'none';
  const m = $a('#loginMsg');
  if(err){ m.textContent = err; m.className = 'form-msg bad'; }
  else { m.className = 'form-msg'; }
}

function showDashboard(user){
  $a('#loginView').style.display = 'none';
  $a('#dashView').style.display = 'block';
  $a('#logoutBtn').style.display = 'inline-flex';
  $a('#whoami').textContent = user && user.username ? user.username : 'admin';
  loadProducts();
}

async function doLogin(e){
  e.preventDefault();
  const m = $a('#loginMsg');
  const username = $a('#loginUser').value.trim();
  const password = $a('#loginPass').value;
  m.className = 'form-msg';
  try {
    const r = await api('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if(r.ok){ const u = await r.json(); showDashboard(u); $a('#loginForm').reset(); }
    else { const d = await r.json().catch(() => ({})); m.textContent = d.error || 'Invalid credentials.'; m.className = 'form-msg bad'; }
  } catch(err){ m.textContent = 'Cannot reach the server.'; m.className = 'form-msg bad'; }
}

async function doLogout(){
  try { await api('/api/logout', { method: 'POST' }); } catch(e){}
  showLogin();
}

// ---------- Image handling (client-side resize) ----------
function processImageFile(file){
  return new Promise((resolve, reject) => {
    if(!file || !file.type.startsWith('image/')) return reject('Please choose an image file.');
    const reader = new FileReader();
    reader.onerror = () => reject('Could not read the file.');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject('That file is not a valid image.');
      img.onload = () => {
        let { width:w, height:h } = img;
        if(w > h && w > MAX_DIM){ h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
        else if(h >= w && h > MAX_DIM){ w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#0f1529'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        c.toBlob(blob => {
          if(!blob) return reject('Could not process the image.');
          resolve({ blob, dataUrl: c.toDataURL('image/jpeg', JPEG_QUALITY) });
        }, 'image/jpeg', JPEG_QUALITY);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleFile(file){
  const msg = $a('#formMsg');
  try {
    const { blob, dataUrl } = await processImageFile(file);
    imageBlob = blob; imageDataUrl = dataUrl; keepExistingImg = false;
    const prev = $a('#imgPreview');
    prev.querySelector('img').src = dataUrl;
    prev.classList.add('show');
    $a('#dropzone').style.display = 'none';
    msg.className = 'form-msg';
  } catch(err){
    msg.textContent = typeof err === 'string' ? err : 'Image error.';
    msg.className = 'form-msg bad';
  }
}

function clearImage(){
  imageBlob = null; imageDataUrl = ''; keepExistingImg = false;
  $a('#imgPreview').classList.remove('show');
  $a('#dropzone').style.display = 'block';
  $a('#fileInput').value = '';
}

// ---------- Datasheet (PDF) handling ----------
function handleSheet(file){
  const msg = $a('#formMsg');
  if(!file) return;
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if(!isPdf){ msg.textContent = 'The datasheet must be a PDF file.'; msg.className = 'form-msg bad'; return; }
  if(file.size > 15 * 1024 * 1024){ msg.textContent = 'The datasheet is too large (max 15 MB).'; msg.className = 'form-msg bad'; return; }
  datasheetFile = file; keepExistingSheet = false;
  $a('#sheetName').textContent = file.name;
  $a('#sheetChip').style.display = 'flex';
  $a('#sheetDrop').style.display = 'none';
  msg.className = 'form-msg';
}

function clearSheet(){
  datasheetFile = null; keepExistingSheet = false;
  $a('#sheetChip').style.display = 'none';
  $a('#sheetDrop').style.display = 'block';
  $a('#sheetInput').value = '';
}

// ---------- Specs ----------
function parseSpecs(text){
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const i = line.indexOf(':');
    if(i === -1) return [line, ''];
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }).filter(pair => pair[0]);
}
function specsToText(specs){ return (specs || []).map(([k, v]) => k + ': ' + v).join('\n'); }

// ---------- Load + render ----------
let CACHE = [];
async function loadProducts(){
  try {
    const r = await api('/api/products');
    CACHE = r.ok ? await r.json() : [];
  } catch(e){ CACHE = []; }
  renderTable();
}

function updateStats(){
  const total = CACHE.length;
  const custom = CACHE.filter(p => p.custom).length;
  const out = CACHE.filter(p => p.stock === 0).length;
  const cats = new Set(CACHE.map(p => p.cat)).size;
  $a('#stTotal').textContent = total;
  $a('#stCustom').textContent = custom;
  $a('#stCats').textContent = cats;
  $a('#stOut').textContent = out;
}

function renderTable(){
  const tbody = $a('#tableBody');
  if(!CACHE.length){
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No products yet. Add your first part using the form on the left.</td></tr>`;
  } else {
    tbody.innerHTML = CACHE.slice().reverse().map(p => `
      <tr>
        <td><div class="pic">${productVisual(p)}</div></td>
        <td><div class="nm">${escA(p.name)}<small>${escA(p.sku || '')}</small></div></td>
        <td>${escA(p.cat)} <span class="pill ${p.custom ? '' : 'builtin'}">${p.custom ? 'custom' : 'built-in'}</span></td>
        <td>$${Number(p.price).toFixed(2)}<br><small style="color:var(--mut)">${p.stock} in stock</small></td>
        <td style="white-space:nowrap">
          <button class="icon-btn" data-edit="${p.id}">Edit</button>
          <button class="icon-btn del" data-del="${p.id}">Delete</button>
        </td>
      </tr>`).join('');
    tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteProduct(parseInt(b.dataset.del, 10)));
    tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => startEdit(parseInt(b.dataset.edit, 10)));
  }
  updateStats();
}

// ---------- Create / update ----------
function fieldVal(id){ return $a('#' + id).value.trim(); }
function markErr(id, on){ $a('#' + id).closest('.field').classList.toggle('err', on); }

async function saveProduct(e){
  e.preventDefault();
  const msg = $a('#formMsg');
  const name = fieldVal('fName');
  const price = parseFloat($a('#fPrice').value);
  const stock = parseInt($a('#fStock').value, 10);

  let ok = true;
  markErr('fName', !name); if(!name) ok = false;
  markErr('fPrice', !(price >= 0)); if(!(price >= 0)) ok = false;
  markErr('fStock', !(stock >= 0)); if(!(stock >= 0)) ok = false;
  if(!ok){ msg.textContent = 'Please fill in the required fields correctly.'; msg.className = 'form-msg bad'; return; }

  const fd = new FormData();
  fd.append('name', name);
  fd.append('cat', fieldVal('fCat') || 'Components');
  fd.append('price', String(Math.round(price * 100) / 100));
  fd.append('stock', String(stock));
  fd.append('sku', fieldVal('fSku'));
  fd.append('tag', fieldVal('fTag'));
  fd.append('desc', fieldVal('fDesc') || name);
  fd.append('long', fieldVal('fLong') || fieldVal('fDesc') || name);
  fd.append('specs', JSON.stringify(parseSpecs(fieldVal('fSpecs'))));
  if(imageBlob) fd.append('image', imageBlob, 'part.jpg');
  if(editingId != null) fd.append('keepImage', keepExistingImg ? '1' : '0');
  if(datasheetFile) fd.append('datasheet', datasheetFile, datasheetFile.name || 'datasheet.pdf');
  if(editingId != null) fd.append('keepDatasheet', keepExistingSheet ? '1' : '0');

  const submitBtn = $a('#submitBtn');
  submitBtn.disabled = true;
  try {
    const r = editingId != null
      ? await api('/api/products/' + editingId, { method: 'PUT', body: fd })
      : await api('/api/products', { method: 'POST', body: fd });
    if(r.status === 401){ showLogin('Your session expired. Please sign in again.'); return; }
    if(!r.ok){ const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Save failed.'); }
    await loadProducts();
    const wasEdit = editingId != null;
    resetForm();
    msg.textContent = wasEdit ? 'Part updated successfully.' : 'Part added \u2014 it is now live in the store.';
    msg.className = 'form-msg ok';
    setTimeout(() => { msg.className = 'form-msg'; }, 3500);
  } catch(err){
    msg.textContent = err.message || 'Save failed.';
    msg.className = 'form-msg bad';
  } finally {
    submitBtn.disabled = false;
  }
}

function startEdit(id){
  const p = CACHE.find(x => x.id === id);
  if(!p) return;
  editingId = id;
  $a('#fName').value = p.name || '';
  $a('#fCat').value = p.cat || 'Components';
  $a('#fPrice').value = p.price;
  $a('#fStock').value = p.stock;
  $a('#fSku').value = p.sku || '';
  $a('#fTag').value = p.tag || '';
  $a('#fDesc').value = p.desc || '';
  $a('#fLong').value = p.long || '';
  $a('#fSpecs').value = specsToText(p.specs);
  imageBlob = null; imageDataUrl = '';
  if(p.img){
    keepExistingImg = true;
    $a('#imgPreview').querySelector('img').src = imgSrc(p.img);
    $a('#imgPreview').classList.add('show');
    $a('#dropzone').style.display = 'none';
  } else { clearImage(); }
  datasheetFile = null;
  if(p.datasheet){
    keepExistingSheet = true;
    $a('#sheetName').textContent = 'Current datasheet (PDF)';
    $a('#sheetChip').style.display = 'flex';
    $a('#sheetDrop').style.display = 'none';
  } else { clearSheet(); }
  $a('#submitBtn').textContent = 'Save changes';
  $a('#panelTitle').textContent = 'Edit part';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id){
  if(!confirm('Delete this part? This cannot be undone.')) return;
  try {
    const r = await api('/api/products/' + id, { method: 'DELETE' });
    if(r.status === 401){ showLogin('Your session expired. Please sign in again.'); return; }
    if(editingId === id) resetForm();
    await loadProducts();
  } catch(e){ alert('Delete failed.'); }
}

function resetForm(){
  $a('#partForm').reset();
  clearImage();
  clearSheet();
  editingId = null;
  $a('#submitBtn').textContent = '+ Add part';
  $a('#panelTitle').textContent = 'Add a new part';
  document.querySelectorAll('.field.err').forEach(f => f.classList.remove('err'));
}

// ---------- Init ----------
function initAdmin(){
  $a('#fCat').innerHTML = CATEGORIES.filter(c => c !== 'All')
    .map(c => `<option value="${escA(c)}">${escA(c)}</option>`).join('');

  const dz = $a('#dropzone'); const fi = $a('#fileInput');
  dz.onclick = () => fi.click();
  fi.onchange = () => { if(fi.files[0]) handleFile(fi.files[0]); };
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
  $a('#clearImg').onclick = clearImage;

  const sd = $a('#sheetDrop'); const si = $a('#sheetInput');
  sd.onclick = () => si.click();
  si.onchange = () => { if(si.files[0]) handleSheet(si.files[0]); };
  sd.addEventListener('dragover', e => { e.preventDefault(); sd.classList.add('drag'); });
  sd.addEventListener('dragleave', () => sd.classList.remove('drag'));
  sd.addEventListener('drop', e => { e.preventDefault(); sd.classList.remove('drag'); if(e.dataTransfer.files[0]) handleSheet(e.dataTransfer.files[0]); });
  $a('#clearSheet').onclick = clearSheet;
  $a('#partForm').onsubmit = saveProduct;
  $a('#resetBtn').onclick = resetForm;
  $a('#loginForm').onsubmit = doLogin;
  $a('#logoutBtn').onclick = doLogout;

  checkAuth();
}
document.addEventListener('DOMContentLoaded', initAdmin);
