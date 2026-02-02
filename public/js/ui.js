function setActiveNav(id){
  document.querySelectorAll('.navlink').forEach(a => a.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
}

function money(n){
  if(typeof n !== 'number') return '';
  return `$${n.toFixed(2)}`;
}

function getCart(){
  try{ return JSON.parse(localStorage.getItem('cart') || '[]'); }
  catch{ return []; }
}
function setCart(items){
  localStorage.setItem('cart', JSON.stringify(items));
}
function addToCart(product, qty=1){
  const cart = getCart();
  const idx = cart.findIndex(i => i.productId === product._id);
  if(idx >= 0) cart[idx].quantity += qty;
  else cart.push({ productId: product._id, title: product.title, price: product.price, quantity: qty });
  setCart(cart);
}
function removeFromCart(productId){
  const cart = getCart().filter(i => i.productId !== productId);
  setCart(cart);
}
function updateQty(productId, qty){
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if(!item) return;
  item.quantity = Math.max(1, Number(qty) || 1);
  setCart(cart);
}