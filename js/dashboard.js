let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('acmeSchoolDB', 2);

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

function verificarSesion() {
  const tx = db.transaction('sesion', 'readonly');
  const store = tx.objectStore('sesion');
  const request = store.get('admin');

  request.onsuccess = function () {
    if (!request.result) {
      alert('Debe iniciar sesión primero.');
      location.href = 'index.html';
    }
  };

  request.onerror = function () {
    alert('Error al verificar sesión.');
    location.href = 'index.html';
  };
}

function cerrarSesion() {
  const tx = db.transaction('sesion', 'readwrite');
  const store = tx.objectStore('sesion');
  const request = store.delete('admin');

  request.onsuccess = function () {
    alert('Sesión cerrada correctamente.');
    location.href = 'index.html';
  };

  request.onerror = function () {
    alert('No se pudo cerrar la sesión.');
  };
}

initDB().then(() => {
  verificarSesion();

  const btnCerrar = document.getElementById('cerrarSesion');
  btnCerrar.addEventListener('click', cerrarSesion);
});
