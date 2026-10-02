// ===== Product detail page =====
// Relies on products.js (PRODUCTS) and app.js (cart helpers: addToCart,
// cart state, saveCart, updateCartUI, toast, $, fmt, esc).

function getParam(name){
  return new URLSearchParams(location.search).get(name);
}

function stars(r){
  const full = Math.round(r);
  return '\u2605'.repeat(full) + '\u2606'.repeat(5 - full);
}

function stockLabel(p){
  if(p.stock === 0) return {cls:'out', txt:'Out of stock'};
  if(p.stock < 25) return {cls:'low', txt:'Low stock \u00B7 only ' + p.stock + ' left'};
  return {cls:'', txt:'In stock \u00B7 ' + p.stock + ' available'};
}

function renderDetail(){
  const id = parseInt(getParam('id'), 10);
  const p = PRODUCTS.find(x => x.id === id);
  const root = document.getElementById('pd-root');

  if(!p){
    document.title = 'Product not found \u2014 ElectroHub';
    root.innerHTML = `<div class="not-found">
      <h2>Product not found</h2>
      <p>The item you are looking for does not exist or has been removed.</p>
      <br><a class="btn btn-primary" href="index.html">\u2190 Back to store</a></div>`;
    return;
  }

  document.title = p.name + ' \u2014 ElectroHub';
  const st = stockLabel(p);
  const specRows = p.specs.map(([k,v]) =>
    `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');

  // Demo reviews derived from product data
  const reviews = [
    {name:'Alex M.', r:5, t:'Exactly as described, fast shipping. Works perfectly in my build.'},
    {name:'Priya S.', r:p.rating >= 4.6 ? 5 : 4, t:'Good quality for the price. Would order again.'},
    {name:'Jordan T.', r:4, t:'Does the job well. Packaging could be a little better.'},
  ];
  const reviewsHtml = reviews.map(rv => `<div class="review">
      <div class="top"><b>${esc(rv.name)}</b><span class="stars">${stars(rv.r)}</span></div>
      <p>${esc(rv.t)}</p></div>`).join('');

  root.innerHTML = `
    <div class="breadcrumb">
      <a href="index.html">Home</a><span>/</span>
      <a href="index.html#catalog">${esc(p.cat)}</a><span>/</span>
      <span style="opacity:1;color:var(--txt)">${esc(p.name)}</span>
    </div>

    <div class="pd">
      <div>
        <div class="pd-gallery">
          ${p.tag ? `<span class="pd-tag">${esc(p.tag)}</span>` : ''}
          <div class="pd-main" id="pdMain">${productVisual(p)}</div>
        </div>
        <div class="pd-thumbs">
          <div class="t active">${productVisual(p)}</div>
          <div class="t">\uD83D\uDCE6</div>
          <div class="t">\uD83D\uDD0D</div>
          <div class="t">\uD83D\uDCCB</div>
        </div>
      </div>

      <div class="pd-info">
        <div class="cat">${esc(p.cat)}</div>
        <h1>${esc(p.name)}</h1>
        <div class="pd-rate">
          <span class="stars">${stars(p.rating)}</span>
          <span>${p.rating.toFixed(1)} \u00B7 ${p.reviews} reviews</span>
        </div>
        <div class="pd-price">
          <span class="now">${fmt(p.price)}</span>
          <span class="per">per unit \u00B7 incl. tax</span>
        </div>
        <div class="pd-stock ${st.cls}">${st.txt}</div>
        <p class="pd-long">${esc(p.long)}</p>

        <div class="pd-buy">
          <div class="qty-sel">
            <button id="qMinus">\u2212</button>
            <input id="qInput" type="text" value="1" inputmode="numeric" aria-label="Quantity">
            <button id="qPlus">+</button>
          </div>
          <button class="btn btn-primary" id="pdAdd" ${p.stock===0?'disabled':''}>
            ${p.stock===0 ? 'Unavailable' : '\uD83D\uDED2 Add to cart'}
          </button>
          <button class="btn btn-ghost" id="pdBuy" ${p.stock===0?'disabled':''}>Buy now</button>
        </div>

        <div class="pd-meta">
          <div>SKU: <b>${esc(p.sku)}</b></div>
          <div>Category: <b>${esc(p.cat)}</b></div>
          <div>Shipping: <b>${p.price>=50?'Free':'$4.99'}</b></div>
          <div>Returns: <b>30 days</b></div>
        </div>
      </div>
    </div>

    <div class="pd-tabs">
      <button class="active" data-tab="desc">Description</button>
      <button data-tab="specs">Specifications</button>
      <button data-tab="reviews">Reviews (${p.reviews})</button>
    </div>
    <div class="tab-panel active" id="tab-desc">
      <p class="pd-long" style="max-width:760px">${esc(p.long)}</p>
      <p class="pd-long" style="max-width:760px">${esc(p.desc)}</p>
    </div>
    <div class="tab-panel" id="tab-specs">
      <table class="spec-table"><tbody>${specRows}</tbody></table>
    </div>
    <div class="tab-panel" id="tab-reviews">${reviewsHtml}</div>

    <div class="related">
      <div class="section-head"><h2>Related products</h2></div>
      <div id="relatedGrid" class="grid"></div>
    </div>`;

  wireDetail(p);
  renderRelated(p);
}

function wireDetail(p){
  const qInput = document.getElementById('qInput');
  const clamp = () => {
    let v = parseInt(qInput.value, 10);
    if(isNaN(v) || v < 1) v = 1;
    if(v > p.stock) v = Math.max(1, p.stock);
    qInput.value = v;
    return v;
  };
  document.getElementById('qMinus').onclick = () => { qInput.value = Math.max(1, (parseInt(qInput.value,10)||1) - 1); clamp(); };
  document.getElementById('qPlus').onclick  = () => { qInput.value = (parseInt(qInput.value,10)||1) + 1; clamp(); };
  qInput.onchange = clamp;

  const addQty = () => {
    const q = clamp();
    cart[p.id] = Math.min((cart[p.id] || 0) + q, p.stock);
    saveCart(); updateCartUI(); toast(q + ' \u00D7 ' + p.name + ' added to cart');
  };
  const addBtn = document.getElementById('pdAdd');
  const buyBtn = document.getElementById('pdBuy');
  if(addBtn && p.stock > 0) addBtn.onclick = addQty;
  if(buyBtn && p.stock > 0) buyBtn.onclick = () => { addQty(); openCart(); };

  // Tabs
  document.querySelectorAll('.pd-tabs button').forEach(b => b.onclick = () => {
    document.querySelectorAll('.pd-tabs button').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('tab-' + b.dataset.tab).classList.add('active');
  });

  // Gallery thumbs
  document.querySelectorAll('.pd-thumbs .t').forEach(t => t.onclick = () => {
    document.querySelectorAll('.pd-thumbs .t').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
  });
}

function renderRelated(p){
  const rel = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const pool = rel.length ? rel : PRODUCTS.filter(x => x.id !== p.id).slice(0, 4);
  document.getElementById('relatedGrid').innerHTML = pool.map(r => {
    const st = stockLabel(r);
    return `<div class="card">
      <a class="thumb" href="product.html?id=${r.id}">${productVisual(r)}</a>
      <div class="body">
        <span class="tag">${esc(r.cat)}</span>
        <h3><a href="product.html?id=${r.id}">${esc(r.name)}</a></h3>
        <p class="desc">${esc(r.desc)}</p>
        <div class="meta">
          <div class="price">${fmt(r.price)} <small>/ unit</small></div>
          <div class="stock ${st.cls}">${r.stock===0?'Out':'In stock'}</div>
        </div>
        <a class="btn btn-primary add" href="product.html?id=${r.id}" style="text-align:center">View details</a>
      </div></div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Load the live catalog from the backend before rendering the detail.
  fetchProducts().then(() => {
    renderDetail();
    const si = document.getElementById('searchInput');
    if(si) si.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ location.href = 'index.html#catalog'; }
    });
  });
});
