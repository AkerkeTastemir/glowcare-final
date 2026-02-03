setActiveNav('navProfile');

if (localStorage.getItem('token')) {
  location.href = '/pages/profile.html';
}

const loginMsg = document.getElementById('loginMsg');
const regMsg = document.getElementById('regMsg');

document.getElementById('goRegister').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('registerCard').classList.remove('d-none');
  document.getElementById('loginCard').classList.add('d-none');

});

document.getElementById('goLogin').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginCard').classList.remove('d-none');
  document.getElementById('registerCard').classList.add('d-none');

});

document.getElementById('btnLogin').addEventListener('click', async () => {
  try {
    loginMsg.textContent = '';
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    location.href = '/pages/profile.html';
  } catch (e) {
    loginMsg.textContent = e.message;
  }
});

document.getElementById('btnRegister').addEventListener('click', async () => {
  try {
    regMsg.textContent = '';
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    setToken(data.token);
    location.href = '/pages/profile.html';
  } catch (e) {
    regMsg.textContent = e.message;
  }
});