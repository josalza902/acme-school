import { getDB, initDB, requireSession } from './db.js';

await initDB();
const session = await requireSession(['administrativo']);
const courseForm = document.getElementById('formCurso');
const courseSelect = document.getElementById('cursoActual');
const searchInput = document.getElementById('busquedaEstudiante');
const studentList = document.getElementById('listaEstudiantes');

function listCourses(selectedId = '') {
  const request = getDB().transaction('cursos', 'readonly').objectStore('cursos').getAll();
  request.onsuccess = () => {
    courseSelect.replaceChildren(new Option('Selecciona un curso', ''));
    request.result.forEach((course) => courseSelect.add(new Option(course.nombre, String(course.id))));
    if (selectedId) courseSelect.value = String(selectedId);
  };
}

function findStudents() {
  const query = searchInput.value.trim().toLowerCase();
  const request = getDB().transaction('estudiantes', 'readonly').objectStore('estudiantes').getAll();
  request.onsuccess = () => {
    studentList.replaceChildren();
    request.result
      .filter((student) => `${student.id} ${student.nombre} ${student.email}`.toLowerCase().includes(query))
      .forEach((student) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${student.nombre} (${student.id})`;
        button.addEventListener('click', () => assignStudent(student));
        item.append(button);
        studentList.append(item);
      });
  };
}

function assignStudent(student) {
  const courseId = Number(courseSelect.value);
  if (!courseId) {
    alert('Selecciona primero un curso.');
    return;
  }

  const transaction = getDB().transaction('cursos', 'readwrite');
  const store = transaction.objectStore('cursos');
  const request = store.get(courseId);
  let alreadyAssigned = false;
  request.onsuccess = () => {
    const course = request.result;
    if (!course) return;
    course.estudiantes = course.estudiantes || [];
    if (course.estudiantes.includes(student.id)) {
      alreadyAssigned = true;
      return;
    }
    course.estudiantes.push(student.id);
    store.put(course);
  };
  transaction.oncomplete = () => alert(
    alreadyAssigned ? 'Ese estudiante ya está asignado a este curso.' : 'Estudiante asignado al curso.'
  );
}

if (session) {
  listCourses();
  courseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const curso = {
      nombre: courseForm.elements.nombre.value.trim(),
      descripcion: courseForm.elements.descripcion.value.trim(),
      imagen: courseForm.elements.imagen.value,
      estudiantes: []
    };
    const transaction = getDB().transaction('cursos', 'readwrite');
    const request = transaction.objectStore('cursos').add(curso);
    let createdId;
    request.onsuccess = () => { createdId = request.result; };
    transaction.oncomplete = () => {
      courseForm.reset();
      listCourses(createdId);
    };
    transaction.onerror = () => alert('No se pudo guardar el curso.');
  });

  searchInput.addEventListener('input', findStudents);
  document.getElementById('volver').addEventListener('click', () => {
    location.href = 'dashboard.html';
  });
}
