# Acme School — gestión académica

Prototipo académico en JavaScript modular para registrar estudiantes, crear cursos, asignar estudiantes y calcular calificaciones ponderadas. La persistencia se hace en IndexedDB del navegador.

## Uso

Abre el proyecto mediante HTTPS o un servidor local. En la primera visita, crea la cuenta administrativa desde la pantalla inicial; ya no hay una contraseña predeterminada. Luego podrás iniciar sesión, registrar usuarios y estudiantes, crear cursos y calificar estudiantes.

La versión actual usa una base local nueva; los datos del prototipo anterior no se migran automáticamente.

## Calificación

Las tres notas se validan entre 0 y 100. La nota final usa ponderaciones de 30 %, 30 % y 40 %.

## Alcance

Es una demostración de frontend: las cuentas, sesiones y datos viven en el almacenamiento local del navegador. El control de acceso del cliente no sustituye una API ni es adecuado para información real de estudiantes. Usa datos ficticios.
