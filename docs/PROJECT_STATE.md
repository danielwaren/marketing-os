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
- Instagram

Módulo en curso:

- Analytics (ANA-001 listo)

## Cron (publicación automática)

pg_cron + pg_net programan el job `publish-scheduled-instagram` cada minuto (`* * * * *`), que llama a la Edge Function publish-scheduled (verify_jwt=false, protegida por un secreto en Vault `ig_cron_secret` verificado con la función public.verify_ig_cron_secret). Publica los posts scheduled+instagram vencidos y los marca como published. Para pausar/reactivar: `select cron.unschedule('publish-scheduled-instagram')` / volver a `cron.schedule(...)`. Limitación conocida (MVP): no hay lock formal; con cron cada minuto y publicación <30s no hay solapamiento; si un post falla queda scheduled y se reintenta al minuto siguiente.

## Despliegue

Repo GitHub: https://github.com/danielwaren/marketing-os
Producción (Vercel): https://marketing-os-n1gi.vercel.app (auto-deploy desde main; variables PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY configuradas).

## Instagram (Meta)

App de Meta "HostalMonchito" (Instagram API con inicio de sesión de Instagram).
- Instagram App ID (público): 975230175570239
- INSTAGRAM_APP_SECRET: secreto de Edge Functions en Supabase (32 caracteres; ojo: NO confundir con otras claves largas).
- Redirect URI registrada en Meta: https://marketing-os-n1gi.vercel.app/app/instagram
- Cuenta conectada de prueba: @hostalmonchito (ID 17841450002347432).
- Permisos activos (test): instagram_business_basic, instagram_business_content_publish (+ manage_messages/comments/insights agregados en el scope de autorización).
- La app de Meta sigue en modo desarrollo: publicar en cuentas de terceros requiere App Review de Meta.

IG-001 está terminado. Feature src/features/instagram con tabla instagram_connections, Edge Function instagram-connection (status/connect/disconnect, intercambia code→token corto→token de larga duración ~60 días) y pantalla /app/instagram con "Conectar con Instagram" / "Conectado como @x" / "Desconectar". Verificado end-to-end en producción.

IG-002 está terminado. Edge Function instagram-publish publica un post (imagen + caption) en la cuenta conectada: genera signed URL de la imagen (server-side), crea el media container en graph.instagram.com, espera a que el status_code sea FINISHED, publica con media_publish y marca el post como published (con published_at). Botón "Publicar en Instagram" en la tarjeta del post (solo si Instagram está conectado, el post es de Instagram, tiene foto y no está publicado). Verificado con una publicación real en @hostalmonchito el 17 jul 2026. La lógica de Instagram (Graph API + signed URL + marcar published) se movió a supabase/functions/_shared/instagram.ts para reutilizarla.

IG-003 está terminado. Publicación automática de posts programados: cron cada minuto (job publish-scheduled-instagram) → Edge Function publish-scheduled reutiliza el mismo flujo de publicación y marca published. Verificado el pipeline y la autorización (200 con secreto correcto, 401 sin él) sin publicar nada real. En la tarjeta de un post programado la UI indica "Se publicará automáticamente en Instagram a esa hora" (o pide conectar Instagram/agregar foto si falta). Pendiente: prueba end-to-end real (programar un post 1-2 min a futuro) requiere confirmación del usuario porque publica en la cuenta real.

IG-004 está terminado. Permite publicar la foto del post como historia de Instagram (media_type=STORIES, sin caption). publishImagePost del módulo compartido acepta mediaType "feed" | "stories"; instagram-publish recibe mediaType. La historia NO cambia el estado del post (es efímera). Botón "Publicar historia" en la tarjeta (visible si Instagram está conectado, el post es de Instagram y tiene foto, sin importar el estado). UI verificada en producción; la publicación real de una historia queda a decisión del usuario (acción pública).

IG-005 está terminado. Permite publicar un carrusel (2-10 imágenes) eligiéndolas del banco de contenido. publishCarousel del módulo compartido crea un contenedor hijo por imagen (is_carousel_item), luego el contenedor padre (media_type=CAROUSEL, children) y publica. instagram-publish acepta mediaType="carousel" + mediaIds ordenados; verifica que las imágenes pertenezcan al workspace (getOrderedImagePaths) y marca el post published. Botón "Publicar carrusel" abre CarouselPickerDialog (selección múltiple con orden numerado 1-N). UI verificada de punta a punta; publicación real a decisión del usuario. MÓDULO INSTAGRAM CERRADO.

ANA-001 está terminado. Panel de estadísticas en /app/analytics: resumen de la cuenta de Instagram conectada (foto, @usuario, seguidores y número de publicaciones) más dos tarjetas de métricas — Alcance y Visitas al perfil de los últimos 30 días. Edge Function instagram-insights (verify_jwt, verifica que el workspace pertenezca al usuario y usa la conexión guardada) obtiene el perfil (fields username,followers_count,media_count,profile_picture_url) y las métricas agregadas vía /{ig-user-id}/insights con metric_type=total_value y rango since/until de 30 días. La lógica reutilizable (fetchAccountProfile, fetchTotalValueMetric) vive en supabase/functions/_shared/instagram.ts para los siguientes tickets ANA. Cada métrica degrada a null (se muestra "—") si Instagram no la reporta, sin romper el panel. Si no hay cuenta conectada muestra un EmptyState con enlace a /app/instagram. Verificado con datos reales de @hostalmonchito (424 seguidores, 21 publicaciones, alcance 197, 20 visitas al perfil). El engagement, alcance detallado, guardados, clics y comparativas quedan para ANA-002..006.

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
