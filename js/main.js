import { getDB, hashPassword, initDB, saveSession, verifyPassword } from './db.js';

const loginForm = document.getElementById('loginForm');
const setupForm = document.getElementById('setupForm');
const status = document.getElementById('authStatus');
const errorMessage = document.getElementById('error-message');

function readRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function showMessage(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#b42318' : '';
  if (errorMessage) errorMessage.style.display = 'none';
}

await initDB();
const users = getDB().transaction('usuarios', 'readonly').objectStore('usuarios');
const existingUsers = await readRequest(users.getAll());

if (existingUsers.length === 0) {
  setupForm.hidden = false;
  loginForm.hidden = true;
  document.getElementById('authTitle').textContent = 'Configura la cuenta administrativa';
}

setupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const nombre = setupForm.elements.nombre.value.trim();
  const email = setupForm.elements.correo.value.trim().toLowerCase();
  const password = setupForm.elements.password.value;

  if (password.length < 10) {
    showMessage('La contraseña debe tener al menos 10 caracteres.', true);
    return;
  }

  try {
    const passwordData = await hashPassword(password);
    const admin = { email, nombre, cargo: 'administrativo', identificacion: 'admin', ...passwordData };
    const transaction = getDB().transaction('usuarios', 'readwrite');
    transaction.objectStore('usuarios').add(admin);
    transaction.oncomplete = async () => {
      await saveSession(admin);
      location.href = 'dashboard.html';
    };
    transaction.onerror = () => showMessage('No se pudo crear la cuenta. Revisa si el correo ya existe.', true);
  } catch (error) {
    showMessage(error.message || 'No se pudo crear la cuenta.', true);
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.elements.correo.value.trim().toLowerCase();
  const password = loginForm.elements.password.value;

  try {
    const user = await readRequest(getDB().transaction('usuarios', 'readonly').objectStore('usuarios').get(email));
    if (!user || !(await verifyPassword(password, user.salt, user.passwordHash))) {
      showMessage('Correo o contraseña incorrectos.', true);
      return;
    }

    await saveSession(user);
    location.href = 'dashboard.html';
  } catch (error) {
    showMessage(error.message || 'No se pudo iniciar sesión.', true);
  }
});
