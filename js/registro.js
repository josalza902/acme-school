import { getDB, hashPassword, initDB, requireSession } from './db.js';

await initDB();
const session = await requireSession(['administrativo']);
const form = document.getElementById('registroForm');

if (session && form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const identificacion = form.elements.id.value.trim();
    const nombre = form.elements.nombre.value.trim();
    const cargo = form.elements.cargo.value;
    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;

    if (password.length < 10) {
      alert('La contraseña debe tener al menos 10 caracteres.');
      return;
    }

    try {
      const passwordData = await hashPassword(password);
      const transaction = getDB().transaction('usuarios', 'readwrite');
      transaction.objectStore('usuarios').add({ identificacion, nombre, cargo, email, ...passwordData });
      transaction.oncomplete = () => {
        alert('Usuario registrado correctamente.');
        form.reset();
      };
      transaction.onerror = () => alert('No se pudo registrar el usuario; verifica si el correo ya existe.');
    } catch (error) {
      alert(error.message || 'No se pudo registrar el usuario.');
    }
  });
}
