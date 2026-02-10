requireAuth();
setActiveNav('navHome');
document.getElementById('btnLogout').addEventListener('click', logout);

const recGrid = document.getElementById('recGrid');
const newGrid = document.getElementById('newGrid');
const recMsg = document.getElementById('recMsg');

function productCard(p){
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
        ${typeof p.score === 'number' ? `• Score: <span class="fw-semibold">${p.score}</span>` : ''}
      </div>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-outline-dark btn-sm" data-wish="${p._id}">Wishlist</button>
        <button class="btn btn-accent text-white btn-sm" data-cart="${p._id}">Add to cart</button>
      </div>
    </div>
  `;
}

async function loadRecommendations(){
  recGrid.innerHTML = '';
  recMsg.textContent = '';

  try{
    const items = await apiFetch('/user/quiz/recommendations');
    if(!items || items.length === 0){
      recMsg.textContent = 'No recommendations found. Try updating your quiz.';
      return;
    }
    recGrid.innerHTML = items.map(productCard).join('');
    bindActions(items);
  }catch(e){
    if(String(e.message || '').toLowerCase().includes('quiz not completed')){
      recMsg.textContent = 'Quiz not completed. Please, take the survey.';
      return;
    }
    recMsg.textContent = e.message;
  }
}

async function loadNew(){
  newGrid.innerHTML = '';
  try{
    const data = await apiFetch('/products?limit=6&page=1');
    const items = data.items || [];
    newGrid.innerHTML = items.map(productCard).join('');
    bindActions(items);
  }catch(e){
    newGrid.innerHTML = `<div class="small text-danger">${e.message}</div>`;
  }
}

function bindActions(items){
  document.querySelectorAll('[data-wish]').forEach(btn => {
    btn.onclick = async () => {
      try{
        const id = btn.getAttribute('data-wish');
        await apiFetch(`/user/wishlist/${id}`, { method:'POST', body: '{}' });
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

loadRecommendations();
loadNew();