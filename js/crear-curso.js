import { initDB, getDB } from './db.js';

let db;
let estudiantes = [];

function crearCurso(e) {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const imagen = document.getElementById('imagen').value;

  if (!nombre || !descripcion || !imagen) {
    alert('Por favor, rellene todos los campos del curso.');
    return;
  }

  const curso = {
    nombre,
    descripcion,
    imagen,
    estudiantes: [] // al principio vacío
  };

  const tx = db.transaction('cursos', 'readwrite');
  const store = tx.objectStore('cursos');
  store.add(curso);

  alert('Curso creado exitosamente.');
  document.getElementById('formCurso').reset();
  document.getElementById('listaEstudiantes').innerHTML = '';
}

function buscarEstudiantes() {
  const query = document.getElementById('busquedaEstudiante').value.toLowerCase();
  const lista = document.getElementById('listaEstudiantes');
  lista.innerHTML = '';

  const tx = db.transaction('estudiantes', 'readonly');
  const store = tx.objectStore('estudiantes');
  const request = store.openCursor();

  request.onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const estudiante = cursor.value;
      const match =
        estudiante.documento.includes(query) ||
        estudiante.nombre.toLowerCase().includes(query) ||
        estudiante.apellido.toLowerCase().includes(query);

      if (match) {
        const li = document.createElement('li');
        li.textContent = `${estudiante.nombre} ${estudiante.apellido} (${estudiante.documento})`;
        li.addEventListener('click', () => asignarEstudiante(estudiante.documento, li));
        lista.appendChild(li);
      }
      cursor.continue();
    }
  };
}

function asignarEstudiante(documento, li) {
  const cursoTx = db.transaction('cursos', 'readwrite');
  const cursoStore = cursoTx.objectStore('cursos');

  cursoStore.getAll().onsuccess = function (e) {
    const cursos = e.target.result;
    const cursoActual = cursos[cursos.length - 1]; // último curso creado

    if (!cursoActual.estudiantes.includes(documento)) {
      cursoActual.estudiantes.push(documento);
      cursoStore.put(cursoActual);
      li.style.background = '#00ffcc';
      li.style.color = '#000';
    }
  };
}

function verificarSesion() {
  const tx = db.transaction('sesion', 'readonly');
  const store = tx.objectStore('sesion');
  const req = store.get('admin');

  req.onsuccess = () => {
    if (!req.result || req.result.cargo !== 'administrativo') {
      alert('Solo los administrativos pueden crear cursos.');
      location.href = 'index.html';
    }
  };
}

initDB().then(() => {
  db = getDB();

  if (!db.objectStoreNames.contains('cursos')) {
    const upgrade = indexedDB.open('acmeSchoolDB', db.version + 1);
    upgrade.onupgradeneeded = function (e) {
      db = e.target.result;
      db.createObjectStore('cursos', { keyPath: 'id', autoIncrement: true });
    };
  }

  verificarSesion();

  document.getElementById('formCurso').addEventListener('submit', crearCurso);
  document.getElementById('busquedaEstudiante').addEventListener('input', buscarEstudiantes);
  document.getElementById('volver').addEventListener('click', () => {
    location.href = 'dashboard.html';
  });
});
