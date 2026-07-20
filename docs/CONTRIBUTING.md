# Reglas de desarrollo

Antes de escribir código:

1. Leer ARCHITECTURE.md

2. Leer ROADMAP.md

3. Respetar la estructura existente.

4. No duplicar componentes.

5. Reutilizar hooks y services.

6. Entregar archivos completos cuando un archivo tenga varios cambios.

7. No modificar módulos cerrados salvo bug o nueva funcionalidad.

8. Pensar la solución antes de escribir código.

9. Todo cambio importante (nuevo módulo, cambio de flujo, integración nueva) debe actualizar `src/pages/app/wiki.astro` para que siga reflejando cómo funciona la app hoy. Un ticket no se considera cerrado si dejó la wiki desactualizada.

---

## Formato de respuesta

Siempre responder con:

Objetivo

Archivos

Código completo

Prueba

Siguiente ticket

Evitar explicaciones largas.