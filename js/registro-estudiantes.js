import { getDB, initDB, requireSession } from './db.js';

await initDB();
const session = await requireSession(['administrativo', 'profesor']);
const form = document.getElementById('formEstudiante');

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

if (session && form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = form.elements.id.value.trim();
    const nombre = form.elements.nombre.value.trim();
    const email = form.elements.email.value.trim().toLowerCase();
    const fechaNacimiento = form.elements.fechaNacimiento.value;
    const foto = form.elements.foto.files[0];

    if (!foto || foto.size > 2 * 1024 * 1024) {
      alert('Selecciona una imagen de hasta 2 MB.');
      return;
    }

    try {
      const fotoBase64 = await readPhoto(foto);
      const transaction = getDB().transaction('estudiantes', 'readwrite');
      transaction.objectStore('estudiantes').add({ id, nombre, email, fechaNacimiento, foto: fotoBase64 });
      transaction.oncomplete = () => {
        alert('Estudiante registrado correctamente.');
        form.reset();
      };
      transaction.onerror = () => alert('No se pudo registrar; verifica si el documento ya existe.');
    } catch (error) {
      alert(error.message || 'No se pudo registrar el estudiante.');
    }
  });
}
