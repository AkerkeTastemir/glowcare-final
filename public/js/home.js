requireAuth();
setActiveNav('navHome');
document.getElementById('btnLogout').addEventListener('click', logout);

const recGrid = document.getElementById('recGrid');
const newGrid = document.getElementById('newGrid');
const recMsg = document.getElementById('recMsg');

// Carousel elements
const carTrack = document.getElementById('carTrack');
const carDots = document.getElementById('carDots');
const carPrev = document.getElementById('carPrev');
const carNext = document.getElementById('carNext');

let carIndex = 0;
let carTimer = null;



const carouselSlides = [
  { img: '/images/slide1.png', title: '', subtitle: '' },
  { img: '/images/slide2.png', title: '', subtitle: '' },
  { img: '/images/slide3.png', title: '', subtitle: '' },
  { img: '/images/slide4.png', title: '', subtitle: '' },
];

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

/* ===== Carousel ===== */
function renderCarousel(){
  if (!carTrack || !carDots) return;

  carTrack.innerHTML = carouselSlides.map(s => `
    <div class="gc-car-slide">
      <img class="gc-car-img" src="${s.img}" alt="${s.title}">
      <div class="gc-car-overlay">
        <div class="gc-car-title">${s.title}</div>
        <div class="gc-car-sub">${s.subtitle}</div>
      </div>
    </div>
  `).join('');

  carDots.innerHTML = carouselSlides.map((_, i) =>
    `<button class="gc-dot ${i===0 ? 'active' : ''}" data-dot="${i}" aria-label="Go to slide ${i+1}"></button>`
  ).join('');

  carDots.querySelectorAll('[data-dot]').forEach(b => {
    b.onclick = () => {
      carIndex = Number(b.getAttribute('data-dot'));
      updateCarousel();
      restartCarouselTimer();
    };
  });

  carPrev?.addEventListener('click', () => {
    carIndex = (carIndex - 1 + carouselSlides.length) % carouselSlides.length;
    updateCarousel();
    restartCarouselTimer();
  });

  carNext?.addEventListener('click', () => {
    carIndex = (carIndex + 1) % carouselSlides.length;
    updateCarousel();
    restartCarouselTimer();
  });

  updateCarousel();
  restartCarouselTimer();
}

function updateCarousel(){
  if (!carTrack || !carDots) return;
  carTrack.style.transform = `translateX(-${carIndex * 100}%)`;

  carDots.querySelectorAll('.gc-dot').forEach((d, i) => {
    d.classList.toggle('active', i === carIndex);
  });
}

function restartCarouselTimer(){
  if (carTimer) clearInterval(carTimer);
  carTimer = setInterval(() => {
    carIndex = (carIndex + 1) % carouselSlides.length;
    updateCarousel();
  }, 8000); // ✅ change to 120000 if you really want 2 minutes
}

/* ===== Data loads ===== */
async function loadRecommendations(){
  recGrid.innerHTML = '';

  try{
    const items = await apiFetch('/user/quiz/recommendations');

    if(!items || items.length === 0){
      recMsg.style.display = 'block';
      recMsg.className = 'gc-hint gc-hint-success mt-2';
      recMsg.textContent = 'Take the Skin Quiz to unlock personalized recommendations 💚';
      return;
    }

    recMsg.style.display = 'none';
    recGrid.innerHTML = items.map(productCard).join('');
    bindActions(items);
  }catch(e){
    const msg = String(e.message || '').toLowerCase();

    if(msg.includes('quiz not completed')){
      recMsg.style.display = 'block';
      recMsg.className = 'gc-hint gc-hint-success mt-2';
      recMsg.textContent = 'Take the Skin Quiz to unlock personalized recommendations 💚';
      return;
    }

    recMsg.style.display = 'block';
    recMsg.className = 'gc-hint gc-hint-danger mt-2';
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

// init
renderCarousel();
loadNew();
loadRecommendations();