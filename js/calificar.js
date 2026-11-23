import { getDB, initDB, requireSession } from './db.js';

await initDB();
const session = await requireSession(['profesor']);
let currentStudent;

function validarNota(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function findStudent() {
  const id = document.getElementById('docEstudiante').value.trim();
  if (!id) {
    alert('Escribe el número de identificación del estudiante.');
    return;
  }

  const request = getDB().transaction('estudiantes', 'readonly').objectStore('estudiantes').get(id);
  request.onsuccess = () => {
    currentStudent = request.result;
    if (!currentStudent) {
      document.getElementById('formNotas').hidden = true;
      alert('No se encontró el estudiante.');
      return;
    }
    document.getElementById('infoEstudiante').textContent = `${currentStudent.nombre} (${currentStudent.id})`;
    document.getElementById('formNotas').hidden = false;
  };
}

if (session) {
  const gradesForm = document.getElementById('formNotas');
  document.getElementById('buscar').addEventListener('click', findStudent);
  gradesForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentStudent) return;

    const grades = [1, 2, 3].map((number) => Number(document.getElementById(`nota${number}`).value));
    if (!grades.every(validarNota)) {
      alert('Cada nota debe estar entre 0 y 100.');
      return;
    }

    const [nota1, nota2, nota3] = grades;
    const definitiva = Number((nota1 * 0.3 + nota2 * 0.3 + nota3 * 0.4).toFixed(2));
    document.getElementById('resultado').textContent = `Nota final: ${definitiva.toFixed(2)}`;

    const transaction = getDB().transaction('calificaciones', 'readwrite');
    transaction.objectStore('calificaciones').put({
      estudianteId: currentStudent.id,
      nombre: currentStudent.nombre,
      nota1,
      nota2,
      nota3,
      definitiva
    });
    transaction.oncomplete = () => {
      alert('Calificación guardada correctamente.');
      gradesForm.reset();
      gradesForm.hidden = true;
      currentStudent = undefined;
    };
    transaction.onerror = () => alert('No se pudo guardar la calificación.');
  });
  document.getElementById('volver').addEventListener('click', () => {
    location.href = 'dashboard.html';
  });
}
