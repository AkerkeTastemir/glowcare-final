setActiveNav('navCatalog');
document.getElementById('btnLogout').addEventListener('click', logout);

const grid = document.getElementById('grid');
const msg = document.getElementById('msg');

const searchEl = document.getElementById('search');
const categoryEl = document.getElementById('category');
const minPriceEl = document.getElementById('minPrice');
const maxPriceEl = document.getElementById('maxPrice');
const pageInfo = document.getElementById('pageInfo');

const btnApply = document.getElementById('btnApply');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');

const btnToggleFilters = document.getElementById('btnToggleFilters');
const filtersPanel = document.getElementById('filtersPanel');
const btnClearFilters = document.getElementById('btnClearFilters');

const chipsWrap = document.getElementById('categoryChips');
const adminBar = document.getElementById('adminBar');

let page = 1;
const limit = 12;
let total = 0;

let isAdmin = false;

// ===== helpers =====
function debounce(fn, wait = 300) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function normalize(s) {
  return (s || '').toString().trim().toLowerCase();
}

// ===== Category chips =====
const categoriesSet = new Set();
const baseChips = ['all',  'cleanser', 'serum',  'moisturizer', 'sunscreen', 'exfoliant', 'toner', 'mask'];

function renderChips() {
  if (!chipsWrap) return;

  const active = normalize(categoryEl?.value);
  const merged = new Set(baseChips);
  for (const c of categoriesSet) merged.add(normalize(c));

  const chips = Array.from(merged).filter(Boolean);

  chipsWrap.innerHTML = chips.map(c => {
    const label = c === 'all' ? 'All' : c;
    const isActive = (c === 'all' && !active) || (active && active === c);
    return `<button class="chip ${isActive ? 'active' : ''}" data-chip="${c}">${label}</button>`;
  }).join('');

  chipsWrap.querySelectorAll('[data-chip]').forEach(btn => {
    btn.onclick = () => {
      const c = btn.getAttribute('data-chip');

      if (c === 'all') categoryEl.value = '';
      else categoryEl.value = c;

      page = 1;
      load();
      renderChips();
    };
  });
}

// ===== Card =====
function card(p) {
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
      <div class="admin-tools d-none mt-2">
        <button class="btn btn-sm btn-outline-dark" data-edit="${p._id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger" data-delete="${p._id}">Delete</button>
      </div>
    </div>
  `;
}

// ===== Load =====
async function load() {
  msg.textContent = '';
  grid.innerHTML = '';

  const params = new URLSearchParams();
  if (searchEl?.value.trim()) params.set('search', searchEl.value.trim());
  if (categoryEl?.value.trim()) params.set('category', categoryEl.value.trim());
  if (minPriceEl?.value) params.set('minPrice', minPriceEl.value);
  if (maxPriceEl?.value) params.set('maxPrice', maxPriceEl.value);
  params.set('page', String(page));
  params.set('limit', String(limit));

  try {
    const data = await apiFetch(`/products?${params.toString()}`);
    const items = data.items || [];
    total = data.total || 0;

    if (pageInfo) pageInfo.textContent = `${page}`;

    if (items.length === 0) {
      msg.textContent = 'No products found';
      return;
    }

    // collect categories for chips (from visible items)
    items.forEach(p => {
      if (p?.category) categoriesSet.add(normalize(p.category));
    });
    renderChips();

    grid.innerHTML = items.map(card).join('');

    if (isAdmin) {
      document.querySelectorAll('.admin-tools').forEach(el => el.classList.remove('d-none'));
    }

    bind(items);
  } catch (e) {
    msg.textContent = e.message;
  }
}

function bind(items) {
  document.querySelectorAll('[data-wish]').forEach(btn => {
    btn.onclick = async () => {
      try {
        const id = btn.getAttribute('data-wish');
        await apiFetch(`/user/wishlist/${id}`, { method: 'POST', body: '{}' });
        btn.textContent = 'Wishlisted';
        btn.disabled = true;
      } catch (e) {
        alert(e.message);
      }
    };
  });

  document.querySelectorAll('[data-cart]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-cart');
      const p = items.find(x => x._id === id);
      if (!p) return;
      addToCart(p, 1);
      btn.textContent = 'Added';
      btn.disabled = true;
    };
  });

  if (!isAdmin) return;

  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-delete');
      if (!confirm('Delete product?')) return;

      try {
        await apiFetch(`/products/${id}`, { method: 'DELETE' });
        load();
      } catch (e) {
        alert(e.message);
      }
    };
  });

  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-edit');
      const p = items.find(x => x._id === id);
      if (!p) return;

      const newPrice = prompt('New price', p.price);
      if (newPrice === null) return;

      try {
        await apiFetch(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ price: Number(newPrice) })
        });
        load();
      } catch (e) {
        alert(e.message);
      }
    };
  });
}

// ===== Search behavior (fixed) =====
const debouncedReload = debounce(() => {
  page = 1;
  load();
}, 300);

searchEl?.addEventListener('input', debouncedReload);
searchEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    page = 1;
    load();
  }
});

// ===== Filters panel controls =====
btnToggleFilters?.addEventListener('click', () => {
  filtersPanel.classList.toggle('show');
});

btnApply?.addEventListener('click', () => {
  page = 1;
  load();
});

btnClearFilters?.addEventListener('click', () => {
  categoryEl.value = '';
  minPriceEl.value = '';
  maxPriceEl.value = '';
  page = 1;
  load();
  renderChips();
});

btnPrev?.addEventListener('click', () => {
  if (page > 1) {
    page--;
    load();
  }
});

btnNext?.addEventListener('click', () => {
  const maxPage = Math.ceil(total / limit) || 1;
  if (page < maxPage) {
    page++;
    load();
  }
});

// ===== Admin actions (Add product + View analysis) =====
function ensureAdminUI() {
  if (!isAdmin || !adminBar) return;

  adminBar.style.display = 'flex';
  adminBar.classList.add('admin-bar');

  adminBar.innerHTML = `
    <button id="btnAddProduct" class="btn-admin primary">Add product</button>
    <button id="btnViewAnalysis" class="btn-admin">View analysis</button>

    <div id="analysisBox" class="analytics-card" style="display:none;">
      <h5>Analytics</h5>

      <div class="mb-2">
        <div class="fw-semibold">Top selling</div>
        <div id="topSellingList" class="small-muted">—</div>
      </div>
    </div>
  `;

  document.getElementById('btnAddProduct')?.addEventListener('click', async () => {
    const title = prompt('Title');
    if (title === null) return;

    const brand = prompt('Brand', '');
    if (brand === null) return;

    const category = prompt('Category', '');
    if (category === null) return;

    const priceStr = prompt('Price', '0');
    if (priceStr === null) return;

    const stockStr = prompt('Stock', '0');
    if (stockStr === null) return;

    const payload = {
      title: String(title).trim(),
      brand: String(brand).trim(),
      category: String(category).trim(),
      price: Number(priceStr),
      stock: Number(stockStr),
    };

    if (!payload.title || !payload.category || !Number.isFinite(payload.price) || !Number.isFinite(payload.stock)) {
      alert('Fill title/category and valid price/stock');
      return;
    }

    try {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
      page = 1;
      load();
      alert('Product added');
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById('btnViewAnalysis')?.addEventListener('click', async () => {
    const box = document.getElementById('analysisBox');
    const topEl = document.getElementById('topSellingList');

    if (!box) return;

    box.style.display = box.style.display === 'none' ? 'block' : 'none';
    if (box.style.display === 'none') return;

    topEl.textContent = 'Loading...';

    try {
      const top = await apiFetch('/orders/stats/top-selling');

      if (!Array.isArray(top) || top.length === 0) {
        topEl.textContent = 'No data';
      } else {
        topEl.innerHTML = `
          <ol class="analytics-list mt-2 mb-0">
            ${top.map(x => `
              <li>
                <b>${x.productName || x.title || x.name || 'Unnamed'}</b> — ${x.totalSold ?? x.count ?? 0}
              </li>
            `).join('')}
          </ol>
        `;
      }
    } catch (e) {
      topEl.textContent = 'Failed to load';
    }
  });
}

async function detectAdmin() {
  try {
    const user = await apiFetch('/user/profile');
    if (user.role === 'admin') {
      isAdmin = true;
      ensureAdminUI();
    }
  } catch { }
}

(async () => {
  await detectAdmin();
  renderChips();
  load();
})();