// Product data (PRODUCTS, CATEGORIES) is loaded from products.js

// ===== State =====
let cart = JSON.parse(localStorage.getItem('eh_cart') || '{}');
let activeCat = 'All';
let searchTerm = '';

// ===== Helpers =====
const $ = s => document.querySelector(s);
const fmt = n => '$' + n.toFixed(2);
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function saveCart(){localStorage.setItem('eh_cart', JSON.stringify(cart));}

// ===== Render categories =====
function renderCats(){
  $('#cats').innerHTML = CATEGORIES.map(c =>
    `<button class="chip ${c===activeCat?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join('');
  document.querySelectorAll('#cats .chip').forEach(b =>
    b.onclick = () => { activeCat = b.dataset.cat; renderCats(); renderProducts(); });
}

// ===== Render products =====
function renderProducts(){
  const list = PRODUCTS.filter(p => {
    const okCat = activeCat === 'All' || p.cat === activeCat;
    const okSearch = !searchTerm ||
      (p.name + ' ' + p.desc + ' ' + p.cat).toLowerCase().includes(searchTerm);
    return okCat && okSearch;
  });
  $('#count').textContent = list.length + ' product' + (list.length!==1?'s':'');
  if(!list.length){ $('#grid').innerHTML =
    `<p style="color:var(--mut);grid-column:1/-1;padding:30px 0">No products match your search.</p>`; return; }
  $('#grid').innerHTML = list.map(p => {
    let st='stock', lbl='In stock';
    if(p.stock===0){st='stock out';lbl='Out of stock';}
    else if(p.stock<25){st='stock low';lbl='Low stock \u00B7 '+p.stock;}
    else lbl='In stock \u00B7 '+p.stock;
    return `<div class="card">
      <a class="thumb" href="product.html?id=${p.id}">${productVisual(p)}</a>
      <div class="body">
        <span class="tag">${esc(p.cat)}</span>
        <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
        <p class="desc">${esc(p.desc)}</p>
        <div class="meta">
          <div class="price">${fmt(p.price)} <small>/ unit</small></div>
          <div class="${st}">${lbl}</div>
        </div>
        <button class="btn btn-primary add" data-id="${p.id}" ${p.stock===0?'disabled':''}>
          ${p.stock===0?'Unavailable':'Add to cart'}
        </button>
      </div></div>`;
  }).join('');
  document.querySelectorAll('.add').forEach(b =>
    b.onclick = () => addToCart(parseInt(b.dataset.id)));
}

// ===== Cart logic =====
function addToCart(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p || p.stock === 0) return;
  cart[id] = (cart[id] || 0) + 1;
  if(cart[id] > p.stock) cart[id] = p.stock;
  saveCart(); updateCartUI(); toast(p.name + ' added to cart');
}
function changeQty(id, d){
  const p = PRODUCTS.find(x => x.id === id);
  cart[id] = (cart[id] || 0) + d;
  if(cart[id] <= 0) delete cart[id];
  else if(p && cart[id] > p.stock) cart[id] = p.stock;
  saveCart(); updateCartUI();
}
function removeItem(id){ delete cart[id]; saveCart(); updateCartUI(); }

function cartCount(){ return Object.values(cart).reduce((a,b)=>a+b,0); }
function cartSubtotal(){
  return Object.entries(cart).reduce((sum,[id,q]) => {
    const p = PRODUCTS.find(x => x.id === +id);
    return sum + (p ? p.price * q : 0);
  }, 0);
}

function updateCartUI(){
  if(!$('#badge')) return; // no cart UI on this page (e.g. admin)
  const n = cartCount();
  $('#badge').textContent = n;
  $('#badge').style.display = n ? 'grid' : 'none';
  const entries = Object.entries(cart);
  if(!entries.length){
    $('#cartItems').innerHTML = `<div class="cart-empty">\uD83D\uDED2<br><br>Your cart is empty.<br><small>Add some components to get started.</small></div>`;
    $('#drawerFoot').style.display = 'none';
    return;
  }
  $('#drawerFoot').style.display = 'block';
  $('#cartItems').innerHTML = entries.map(([id,q]) => {
    const p = PRODUCTS.find(x => x.id === +id); if(!p) return '';
    return `<div class="ci">
      <div class="ic">${productVisual(p)}</div>
      <div class="ci-info">
        <b>${esc(p.name)}</b>
        <div class="p">${fmt(p.price)}</div>
        <div class="qty">
          <button data-dec="${p.id}">\u2212</button>
          <span>${q}</span>
          <button data-inc="${p.id}">+</button>
        </div>
        <button class="rm" data-rm="${p.id}">Remove</button>
      </div>
      <div class="price" style="font-size:1rem">${fmt(p.price*q)}</div>
    </div>`;
  }).join('');
  const sub = cartSubtotal();
  const ship = sub > 50 || sub === 0 ? 0 : 4.99;
  $('#subtotal').textContent = fmt(sub);
  $('#shipping').textContent = ship === 0 ? 'FREE' : fmt(ship);
  $('#total').textContent = fmt(sub + ship);
  document.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>changeQty(+b.dataset.inc,1));
  document.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>changeQty(+b.dataset.dec,-1));
  document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>removeItem(+b.dataset.rm));
}

// ===== Drawer / overlay =====
function openCart(){ $('#drawer').classList.add('open'); $('#overlay').classList.add('open'); }
function closeCart(){ $('#drawer').classList.remove('open'); $('#overlay').classList.remove('open'); }

// ===== Toast =====
let toastT;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('show'), 1800);
}

// ===== Checkout =====
function checkout(){
  if(!cartCount()) return;
  const order = 'EH-' + Math.random().toString(36).slice(2,8).toUpperCase();
  $('#orderId').textContent = order;
  cart = {}; saveCart(); updateCartUI(); closeCart();
  $('#modal').classList.add('open');
}

// ===== Init =====
// Shared across pages: wires cart drawer, badge, toast and checkout.
// Catalog-only pieces (category chips, product grid, search) are guarded
// so this same file can be reused on the product detail page.
function init(){
  updateCartUI();
  const on = (sel, ev, fn) => { const el = $(sel); if(el) el[ev] = fn; };
  on('#cartBtn','onclick', openCart);
  on('#closeCart','onclick', closeCart);
  on('#overlay','onclick', closeCart);
  on('#checkout','onclick', checkout);
  on('#modalClose','onclick', () => $('#modal').classList.remove('open'));
  on('#shopNow','onclick', () => $('#catalog') && $('#catalog').scrollIntoView());
  on('#searchInput','oninput', e => { searchTerm = e.target.value.toLowerCase().trim(); renderProducts(); });
  // Load the live catalog from the backend, then render.
  fetchProducts().then(() => {
    if($('#cats')) renderCats();
    if($('#grid')) renderProducts();
  });
}
document.addEventListener('DOMContentLoaded', init);
