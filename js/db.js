const DB_NAME = 'acmeSchoolPortfolio';
const DB_VERSION = 1;
let database;
let databasePromise;

export function initDB() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('usuarios')) {
        db.createObjectStore('usuarios', { keyPath: 'email' });
      }
      if (!db.objectStoreNames.contains('sesion')) {
        db.createObjectStore('sesion', { keyPath: 'clave' });
      }
      if (!db.objectStoreNames.contains('estudiantes')) {
        db.createObjectStore('estudiantes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cursos')) {
        db.createObjectStore('cursos', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('calificaciones')) {
        db.createObjectStore('calificaciones', { keyPath: 'estudianteId' });
      }
    };

    request.onsuccess = () => {
      database = request.result;
      database.onversionchange = () => {
        database.close();
        database = undefined;
        databasePromise = undefined;
      };
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = undefined;
      reject(request.error || new Error('No se pudo abrir la base de datos local.'));
    };
  });

  return databasePromise;
}

export function getDB() {
  if (!database) throw new Error('Primero debes inicializar la base de datos.');
  return database;
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function derivePassword(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  if (!crypto.subtle) throw new Error('Abre la aplicación desde HTTPS o localhost para configurar la cuenta.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    salt: toBase64(salt),
    passwordHash: toBase64(await derivePassword(password, salt))
  };
}

export async function verifyPassword(password, saltValue, hashValue) {
  if (!crypto.subtle) throw new Error('Abre la aplicación desde HTTPS o localhost para iniciar sesión.');
  const expected = fromBase64(hashValue);
  const actual = await derivePassword(password, fromBase64(saltValue));
  if (expected.length !== actual.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected[index] ^ actual[index];
  }
  return difference === 0;
}

export function getSession() {
  return new Promise((resolve, reject) => {
    const request = getDB().transaction('sesion', 'readonly').objectStore('sesion').get('admin');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export function saveSession(user) {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction('sesion', 'readwrite');
    transaction.objectStore('sesion').put({
      clave: 'admin',
      email: user.email,
      nombre: user.nombre,
      cargo: user.cargo
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function clearSession() {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction('sesion', 'readwrite');
    transaction.objectStore('sesion').delete('admin');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function requireSession(allowedRoles = []) {
  const session = await getSession();
  if (!session || (allowedRoles.length && !allowedRoles.includes(session.cargo))) {
    location.href = 'index.html';
    return null;
  }
  return session;
}
