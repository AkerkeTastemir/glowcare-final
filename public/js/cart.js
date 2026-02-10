requireAuth();
setActiveNav('navCart');
document.getElementById('btnLogout').addEventListener('click', logout);

const cartList = document.getElementById('cartList');
const cartMsg = document.getElementById('cartMsg');
const totalEl = document.getElementById('total');
const checkoutMsg = document.getElementById('checkoutMsg');

function renderCart(){
  const cart = getCart();
  cartMsg.textContent = '';
  checkoutMsg.textContent = '';
  cartList.innerHTML = '';

  if(cart.length === 0){
    cartMsg.textContent = 'Cart is empty';
    totalEl.textContent = '$0.00';
    return;
  }

  let total = 0;
  cart.forEach(i => total += (Number(i.price)||0) * (Number(i.quantity)||1));
  totalEl.textContent = money(total);

  cartList.innerHTML = cart.map(i => `
    <div class="d-flex align-items-center justify-content-between py-2 rowline">
      <div>
        <div class="fw-semibold">${i.title}</div>
        <div class="small-muted">${money(i.price)}</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <input class="form-control form-control-sm" style="width:80px" type="number" min="1" value="${i.quantity}" data-qty="${i.productId}">
        <button class="btn btn-outline-dark btn-sm" data-remove="${i.productId}">Remove</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.onclick = () => {
      removeFromCart(btn.getAttribute('data-remove'));
      renderCart();
    };
  });

  document.querySelectorAll('[data-qty]').forEach(inp => {
    inp.onchange = () => {
      updateQty(inp.getAttribute('data-qty'), inp.value);
      renderCart();
    };
  });
}

document.getElementById('btnClear').onclick = () => {
  setCart([]);
  renderCart();
};

document.getElementById('btnCheckout').onclick = async () => {
  try{
    checkoutMsg.textContent = '';
    const cart = getCart();
    if(cart.length === 0){
      checkoutMsg.className = 'small text-danger mt-2';
      checkoutMsg.textContent = 'Cart is empty';
      return;
    }

    const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
    const order = await apiFetch('/orders/checkout', {
      method:'POST',
      body: JSON.stringify({ items })
    });

    setCart([]);
    renderCart();

    checkoutMsg.className = 'small text-success mt-2';
    checkoutMsg.textContent = `Order created: ${order._id}`;
  }catch(e){
    checkoutMsg.className = 'small text-danger mt-2';
    checkoutMsg.textContent = e.message;
  }
};

renderCart();