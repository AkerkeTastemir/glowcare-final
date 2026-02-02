requireAuth();
setActiveNav('navCatalog');
document.getElementById('btnLogout').addEventListener('click', logout);

const grid = document.getElementById('grid');
const msg = document.getElementById('msg');

const searchEl = document.getElementById('search');
const categoryEl = document.getElementById('category');
const minPriceEl = document.getElementById('minPrice');
const maxPriceEl = document.getElementById('maxPrice');
const pageInfo = document.getElementById('pageInfo');

let page = 1;
const limit = 12;
let total = 0;

function card(p){
  return `
    <div class="card-soft product-card">
      <p class="product-title">${p.title}</p>
      <div class="product-meta">${p.brand} • ${p.category}</div>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <span class="badge badge-soft rounded-pill px-2 py-1">${money(p.price)}</span>
        <span class="small-muted">Stock: <span class="fw-semibold">${p.stock}</span></span>
      </div>
      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-outline-dark btn-sm" data-wish="${p._id}">Wishlist</button>
        <button class="btn btn-accent text-white btn-sm" data-cart="${p._id}">Add to cart</button>
      </div>
    </div>
  `;
}

async function load(){
  msg.textContent = '';
  grid.innerHTML = '';

  const params = new URLSearchParams();
  if(searchEl.value.trim()) params.set('search', searchEl.value.trim());
  if(categoryEl.value.trim()) params.set('category', categoryEl.value.trim());
  if(minPriceEl.value) params.set('minPrice', minPriceEl.value);
  if(maxPriceEl.value) params.set('maxPrice', maxPriceEl.value);
  params.set('page', String(page));
  params.set('limit', String(limit));

  try{
    const data = await apiFetch(`/products?${params.toString()}`);
    const items = data.items || [];
    total = data.total || 0;
    pageInfo.textContent = `${page}`;

    if(items.length === 0){
      msg.textContent = 'No products found';
      return;
    }

    grid.innerHTML = items.map(card).join('');
    bind(items);
  }catch(e){
    msg.textContent = e.message;
  }
}

function bind(items){
  document.querySelectorAll('[data-wish]').forEach(btn => {
    btn.onclick = async () => {
      try{
        const id = btn.getAttribute('data-wish');
        await apiFetch(`/user/wishlist/${id}`, { method:'POST', body:'{}' });
        btn.textContent = 'Wishlisted';
        btn.disabled = true;
      }catch(e){
        alert(e.message);
      }
    };
  });

  document.querySelectorAll('[data-cart]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-cart');
      const p = items.find(x => x._id === id);
      if(!p) return;
      addToCart(p, 1);
      btn.textContent = 'Added';
      btn.disabled = true;
    };
  });
}

document.getElementById('btnApply').onclick = () => { page = 1; load(); };
document.getElementById('btnPrev').onclick = () => { if(page > 1){ page--; load(); } };
document.getElementById('btnNext').onclick = () => {
  const maxPage = Math.ceil(total / limit) || 1;
  if(page < maxPage){ page++; load(); }
};

load();