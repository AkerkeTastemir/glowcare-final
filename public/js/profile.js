requireAuth();
setActiveNav('navProfile');

document.getElementById('btnLogout').addEventListener('click', logout);

const emailEl = document.getElementById('email');
const roleEl = document.getElementById('role');
const usernameEl = document.getElementById('username');
const msgEl = document.getElementById('msg');

async function loadProfile() {
  try {
    msgEl.textContent = '';
    const user = await apiFetch('/user/profile');
    emailEl.textContent = user.email || '';
    roleEl.textContent = user.role || 'user';
    usernameEl.value = user.username || '';
  } catch (e) {
    msgEl.className = 'small text-danger mt-2';
    msgEl.textContent = e.message;
  }
}

document.getElementById('btnSave').addEventListener('click', async () => {
  try {
    msgEl.textContent = '';
    const username = usernameEl.value.trim();

    const updated = await apiFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ username })
    });

    msgEl.className = 'small text-success mt-2';
    msgEl.textContent = 'Saved';
    usernameEl.value = updated.username || username;
  } catch (e) {
    msgEl.className = 'small text-danger mt-2';
    msgEl.textContent = e.message;
  }
});

loadProfile();
setupAdminUI();