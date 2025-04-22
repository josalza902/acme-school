let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('acmeSchoolDB', 2);

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains('usuarios')) {
        db.createObjectStore('usuarios', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sesion')) {
        db.createObjectStore('sesion', { keyPath: 'clave' });
      }
    };

    request.onsuccess = function () {
      db = request.result;
      resolve();
    };

    request.onerror = function (event) {
      console.error("Error al abrir la base de datos:", event.target.error);
      reject('Error al abrir la base de datos');
    };
  });
}

function checkAdmin() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sesion', 'readonly');
    const store = tx.objectStore('sesion');
    const request = store.get('admin');

    request.onsuccess = function () {
      if (request.result) {
        resolve(request.result);
      } else {
        reject('No está autenticado como administrativo');
      }
    };

    request.onerror = function () {
      reject('Error al verificar sesión');
    };
  });
}

function registerUser() {
  const form = document.getElementById('registroForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = form.id.value;
    const nombre = form.nombre.value;
    const cargo = form.cargo.value;
    const email = form.email.value;
    const password = form.password.value;

    // Verificar si todos los campos están llenos
    if (!id || !nombre || !cargo || !email || !password) {
      alert('Por favor, rellene todos los campos.');
      return;
    }

    try {
      // Verificar que el usuario está autenticado como administrativo
      const session = await checkAdmin();

      if (session && session.cargo === 'administrativo') {
        const tx = db.transaction('usuarios', 'readwrite');
        const store = tx.objectStore('usuarios');

        const nuevoUsuario = {
          id: id,
          nombre: nombre,
          cargo: cargo,
          email: email,
          password: password,
        };

        const request = store.add(nuevoUsuario);

        request.onsuccess = function () {
          alert('Usuario registrado correctamente');
          form.reset();
        };

        request.onerror = function () {
          alert('Error al registrar el usuario');
        };
      } else {
        alert('No tiene permiso para registrar usuarios');
      }
    } catch (error) {
      alert(error);
    }
  });
}

initDB().then(() => {
  registerUser();
});
