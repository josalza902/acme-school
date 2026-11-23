import { clearSession, initDB, requireSession } from './db.js';

await initDB();
const session = await requireSession();

if (session) {
  document.getElementById('nombreUsuario').textContent = session.nombre;
  document.getElementById('cerrarSesion').addEventListener('click', async () => {
    await clearSession();
    location.href = 'index.html';
  });
}
