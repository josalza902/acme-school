import { initDB, getDB } from './db.js';

let db;
let estudianteActual = null;

function validarNota(nota) {
  return nota >= 0 && nota <= 100;
}

function buscarEstudiante() {
  const doc = document.getElementById('docEstudiante').value.trim();
  if (!doc) return alert('Por favor, ingrese un documento');

  const tx = db.transaction('estudiantes', 'readonly');
  const store = tx.objectStore('estudiantes');
  const req = store.get(doc);

  req.onsuccess = function () {
    if (req.result) {
      estudianteActual = req.result;
      document.getElementById('infoEstudiante').textContent = 
        `${estudianteActual.nombre} ${estudianteActual.apellido}`;
      document.getElementById('formNotas').style.display = 'block';
    } else {
      alert('Estudiante no encontrado');
    }
  };
}

function calcularYGuardar(e) {
  e.preventDefault();

  const nota1 = parseFloat(document.getElementById('nota1').value);
  const nota2 = parseFloat(document.getElementById('nota2').value);
  const nota3 = parseFloat(document.getElementById('nota3').value);

  if (![nota1, nota2, nota3].every(n => !isNaN(n) && validarNota(n))) {
    return alert('Las notas deben estar entre 0 y 100');
  }

  const definitiva = (nota1 * 0.3 + nota2 * 0.3 + nota3 * 0.4).toFixed(2);
  document.getElementById('resultado').textContent = `Nota Final: ${definitiva}`;

  const tx = db.transaction('calificaciones', 'readwrite');
  const store = tx.objectStore('calificaciones');
  store.put({
    documento: estudianteActual.documento,
    nombre: estudianteActual.nombre,
    apellido: estudianteActual.apellido,
    nota1, nota2, nota3,
    definitiva: parseFloat(definitiva)
  });

  alert('Calificación guardada correctamente');
  document.getElementById('formNotas').reset();
  document.getElementById('formNotas').style.display = 'none';
}

function verificarSesion() {
  const tx = db.transaction('sesion', 'readonly');
  const store = tx.objectStore('sesion');
  const req = store.get('admin');

  req.onsuccess = () => {
    if (!req.result || req.result.cargo !== 'profesor') {
      alert('Solo los profesores pueden calificar.');
      location.href = 'index.html';
    }
  };
}

initDB().then(() => {
  db = getDB();

  if (!db.objectStoreNames.contains('calificaciones')) {
    const upgrade = indexedDB.open('acmeSchoolDB', db.version + 1);
    upgrade.onupgradeneeded = function (e) {
      db = e.target.result;
      db.createObjectStore('calificaciones', { keyPath: 'documento' });
    };
  }

  verificarSesion();

  document.getElementById('buscar').addEventListener('click', buscarEstudiante);
  document.getElementById('formNotas').addEventListener('submit', calcularYGuardar);
  document.getElementById('volver').addEventListener('click', () => {
    location.href = 'dashboard.html';
  });
});
