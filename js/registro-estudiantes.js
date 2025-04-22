let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('acmeSchoolDB', 2);

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains('estudiantes')) {
        db.createObjectStore('estudiantes', { keyPath: 'id' });
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

function checkSesion() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sesion', 'readonly');
    const store = tx.objectStore('sesion');
    const request = store.get('admin');

    request.onsuccess = function () {
      if (request.result) {
        resolve(request.result);
      } else {
        reject('Sesión no encontrada');
      }
    };

    request.onerror = function () {
      reject('Error al verificar sesión');
    };
  });
}

function leerFotoComoBase64(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject('Error al leer la imagen');
    lector.readAsDataURL(file);
  });
}

function registrarEstudiante() {
  const form = document.getElementById('formEstudiante');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = form.id.value.trim();
    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const fechaNacimiento = form.fechaNacimiento.value;
    const fotoInput = form.foto.files[0];

    if (!id || !nombre || !email || !fechaNacimiento || !fotoInput) {
      alert('Por favor, rellene todos los campos.');
      return;
    }

    try {
      const sesion = await checkSesion();
      if (!sesion) {
        alert('No tiene permiso para registrar estudiantes.');
        return;
      }

      const fotoBase64 = await leerFotoComoBase64(fotoInput);

      const nuevoEstudiante = {
        id,
        nombre,
        email,
        fechaNacimiento,
        foto: fotoBase64,
      };

      const tx = db.transaction('estudiantes', 'readwrite');
      const store = tx.objectStore('estudiantes');
      const request = store.add(nuevoEstudiante);

      request.onsuccess = function () {
        alert('Estudiante registrado correctamente');
        form.reset();
      };

      request.onerror = function () {
        alert('Error al registrar el estudiante (ya existe)');
      };
    } catch (error) {
      alert(error);
    }
  });
}

initDB().then(() => {
  registrarEstudiante();
});
