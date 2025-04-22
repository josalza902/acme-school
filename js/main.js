let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const requestDB = indexedDB.open('acmeSchoolDB', 2);  // Renombramos a 'requestDB'

    requestDB.onupgradeneeded = function (event) {
      db = event.target.result;

      if (!db.objectStoreNames.contains('usuarios')) {
        db.createObjectStore('usuarios', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('sesion')) {
        db.createObjectStore('sesion', { keyPath: 'clave' });
      }
    };

    requestDB.onsuccess = function () {
      db = requestDB.result;

      // Verificar si el admin ya existe
      const tx = db.transaction('usuarios', 'readonly');
      const store = tx.objectStore('usuarios');
      const requestUsuarios = store.getAll();  // Renombramos a 'requestUsuarios'

      requestUsuarios.onsuccess = function () {
        const usuarios = requestUsuarios.result;
        const adminExiste = usuarios.some(u => u.correo === 'admin@acmeschool.com');
        
        if (!adminExiste) {
          // Si no existe, lo agregamos
          const txAdd = db.transaction('usuarios', 'readwrite');
          const storeAdd = txAdd.objectStore('usuarios');
          const nuevoAdmin = {
            identificacion: '0001',
            nombre: 'Administrador General',
            cargo: 'Administrativo',
            correo: 'admin@acmeschool.com',
            password: 'admin123'
          };
          storeAdd.add(nuevoAdmin);

          console.log('✅ Admin creado por defecto: admin@acmeschool.com / admin123');
        } else {
          console.log('🔐 Admin ya existe');
        }

        // Redirigir a login o dashboard
        location.href = 'index.html'; // Redirigir a la página de login
      };

      resolve();
    };

    requestDB.onerror = function (event) {
      console.error("Error al abrir la base de datos:", event.target.error);
      reject('Error al abrir la base de datos');
    };
  });
}

function getDB() {
  return db;
}

initDB().then(() => {
  console.log('✅ Base de datos inicializada');
});
