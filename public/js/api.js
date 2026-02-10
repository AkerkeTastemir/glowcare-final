const API_BASE = '/api';

function getToken(){ return localStorage.getItem('token'); }
function setToken(t){ localStorage.setItem('token', t); }
function logout(){
  localStorage.removeItem('token');
  location.href = '/pages/auth.html';
}

function requireAuth(){
  if(!getToken()) location.href = '/pages/auth.html';
}

async function apiFetch(path, options = {}){
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';

  const token = getToken();
  if(token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if(res.status === 401){
    logout();
    return;
  }
  if(!res.ok){
    throw new Error(data.message || 'Request failed');
  }
  return data;
}