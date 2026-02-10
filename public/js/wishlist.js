requireAuth();
setActiveNav('navWishlist');

document.getElementById('btnLogout').addEventListener('click', logout);

const grid = document.getElementById('grid');
const msg = document.getElementById('msg');

function card(p) {
  return `
    <div class="card-soft product-card">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <p class="product-title">${p.title}</p>
          <div class="product-meta">${p.brand} • ${p.category}</div>
        </div>
        <span class="badge badge-soft rounded-pill px-2 py-1">${money(p.price)}</span>
      </div>

      <div class="small-muted mt-2">
        Stock: <span class="fw-semibold">${p.stock}</span>
      </div>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-outline-dark btn-sm" data-remove="${p._id}">Remove</button>
        <button class="btn btn-accent text-white btn-sm" data-cart="${p._id}">Add to cart</button>
      </div>
    </div>
  `;
}

async function loadWishlist() {
  msg.textContent = '';
  grid.innerHTML = '';

  try {
    const items = await apiFetch('/user/wishlist');
    if (!items || items.length === 0) {
      msg.textContent = 'Wishlist is empty';
      return;
    }
    grid.innerHTML = items.map(card).join('');
    bind(items);
  } catch (e) {
    msg.textContent = e.message;
  }
}

function bind(items) {
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.onclick = async () => {
      try {
        const id = btn.getAttribute('data-remove');
        await apiFetch(`/user/wishlist/${id}`, { method: 'DELETE' });
        loadWishlist();
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
}

loadWishlist();