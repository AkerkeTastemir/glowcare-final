requireAuth();
setActiveNav('navQuiz');

document.getElementById('btnLogout').addEventListener('click', logout);

const msg = document.getElementById('msg');

function getChecked(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(i => i.value);
}

document.getElementById('btnSave').onclick = async () => {
  try {
    msg.textContent = '';

    const skinType = document.getElementById('skinType').value;
    const concerns = getChecked('concerns');
    const preferences = getChecked('preferences');

    const data = await apiFetch('/user/quiz', {
      method: 'POST',
      body: JSON.stringify({ skinType, concerns, preferences })
    });

    msg.className = 'small text-success mt-2';
    msg.textContent = data.message || 'Quiz saved';

    setTimeout(() => {
      location.href = '/pages/home.html';
    }, 400);
  } catch (e) {
    msg.className = 'small text-danger mt-2';
    msg.textContent = e.message;
  }
};