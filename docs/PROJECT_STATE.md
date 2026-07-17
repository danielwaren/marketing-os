# Marketing OS

## Estado actual

Módulos cerrados:

- Auth
- Workspace
- Media
- Menu
- Dashboard
- Posts
- AI
- Calendar

Próximo módulo:

- Instagram

CAL-001 está terminado. Vista mensual del calendario en /app/calendar con navegación entre meses, día actual resaltado y las publicaciones ubicadas según scheduled_at (programadas) o published_at (publicadas), con un punto de color por estado.

CAL-002 está terminado. Permite programar un borrador eligiendo fecha y hora futura desde la tarjeta de la publicación (componente PostScheduler). Al programar se guarda scheduled_at y el estado pasa a "scheduled"; "Cancelar programación" lo devuelve a borrador y limpia la fecha. Las fechas se guardan en UTC y se muestran en hora local de Chile.

CAL-003 está terminado. Las publicaciones ya programadas muestran el PostScheduler precargado con su fecha actual y un botón "Reprogramar" que actualiza scheduled_at sin cambiar el estado.

CAL-004 está terminado. En el calendario, las publicaciones programadas son arrastrables (HTML5 drag and drop) y se pueden soltar en otro día para reprogramarlas; se conserva la hora original y solo cambia el día. El día objetivo se resalta al arrastrar sobre él.

CAL-005 está terminado. Vista mensual (6 semanas) con el mes y año como título, día actual resaltado y navegación mes a mes.

CAL-006 está terminado. Vista semanal (7 días) seleccionable mediante un interruptor Mes/Semana; el título muestra el rango de la semana y la navegación avanza semana a semana. Ambas vistas comparten la misma grilla y el mismo drag and drop.

## Decisión de proveedores durante el MVP

Prioridad:

1. Gemini
2. Groq
3. Plantillas locales
4. OpenAI desactivado

Las claves privadas se almacenan únicamente como secretos de Supabase Edge Functions.

AI-001 está terminado. Genera publicaciones usando menú, negocio, día, hora y clima actual. El clima es opcional mediante `WEATHER_API_KEY` y ningún fallo externo bloquea el fallback local.

AI-002 está terminado. Permite reescribir una publicación existente conservando los datos reales del menú y usando el mismo flujo de proveedores.

AI-003 está terminado. Permite generar una publicación corta de hasta 500 caracteres sin perder los datos ni la inclusión obligatoria del menú.

AI-004 está terminado. Permite generar una publicación larga de 700 a 1500 caracteres, organizada en varios párrafos y con una llamada a la acción.

AI-005 está terminado. Permite agregar exactamente cinco hashtags sin modificar el texto ni duplicar etiquetas: negocio y ciudad dinámicos, `#MenuDelDia`, `#comidacasera` y `#patagonia`.

AI-006 está terminado. Permite agregar emojis contextuales según el momento del día, menú, clima, ubicación y delivery sin duplicarlos.

AI-007 está terminado. Permite elegir un tono formal, cercano o promocional al generar, reescribir o extender una publicación.

AI-008 está terminado. Permite elegir enfoques reutilizables para menú diario, invitación a almorzar y comida casera local sin escribir instrucciones manuales.

AI-009 está terminado. Analiza automáticamente la fotografía asociada al menú con Gemini y utiliza solamente detalles visuales comprobables. Acepta JPEG, PNG y WebP de hasta 2 MB y mantiene el flujo normal si la imagen no está disponible.

AI-010 está terminado. Permite generar 2 o 3 versiones distintas del texto en una sola acción ("Generar 3 versiones"). Cada versión usa el mismo proveedor (Gemini, Groq o plantilla local) pero con instrucciones de variación para lograr redacciones diferentes conservando los mismos datos reales del menú. El usuario elige una versión para usarla en la publicación.
