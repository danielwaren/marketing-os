# Marketing OS

# BACKLOG

---

# SPRINT 1

## AUTH-001 ✅
Login

## AUTH-002 ✅
Persistencia de sesión

## WORKSPACE-001 ✅
Crear Workspace

## WORKSPACE-002 ✅
Obtener Workspace

---

# SPRINT 2

## MEDIA-001 ✅
Subir imágenes

## MEDIA-002 ✅
Galería

## MEDIA-003 ✅
Signed URLs

## MEDIA-004 ✅
Eliminar imágenes

## MEDIA-005 ✅
Reemplazar imágenes

MÓDULO MEDIA CERRADO

---

## MENU-001 ✅
Crear menú

## MENU-002 ✅
Asociar fotografía

## MENU-003 ✅
CRUD completo

MÓDULO MENU CERRADO

---

# SPRINT 3

## DASHBOARD-001 ✅
Dashboard principal

MÓDULO DASHBOARD CERRADO

---

# POSTS

## POST-001 ✅
Crear borrador

## POST-002 ✅
Autocompletar usando Menú

## POST-003 ✅
Editar borrador

## POST-004 ✅
Eliminar borrador

## POST-005 ✅
Estados

draft

scheduled

published

## POST-006 ✅
Mostrar fotografía asociada

## POST-007 ✅
Cards profesionales

## POST-008 ✅
Filtros

Todos

Borradores

Programados

Publicados

## POST-009 ✅
Buscador

## POST-010 ✅
Duplicar publicación

## POST-011 ✅
Vista previa Instagram

## POST-012 ⏭️ OMITIDO
Vista previa Facebook

Fuera del alcance actual por decisión del usuario.

## POST-013 ⏭️ OMITIDO
Vista previa WhatsApp

Fuera del alcance actual por decisión del usuario.

MÓDULO POSTS CERRADO

---

# AI

## AI-001 ✅
Generar texto

## AI-002 ✅
Reescribir publicación

## AI-003 ✅
Texto corto

## AI-004 ✅
Texto largo

## AI-005 ✅
Agregar hashtags

## AI-006 ✅
Emojis inteligentes

## AI-007 ✅
Tono

Formal

Casual

Promocional

## AI-008 ✅
Prompts reutilizables

## AI-009 ✅
Generación desde fotografías

## AI-010 ✅
Versiones múltiples

MÓDULO AI CERRADO

---

# CALENDAR

## CAL-001 ✅
Calendario

## CAL-002 ✅
Programar publicación

## CAL-003 ✅
Reprogramar

## CAL-004 ✅
Drag & Drop

## CAL-005 ✅
Vista mensual

## CAL-006 ✅
Vista semanal

MÓDULO CALENDAR CERRADO

---

# INSTAGRAM

## IG-001 ✅
Conectar Meta

## IG-002 ✅
Publicar

## IG-003 ✅
Programar

## IG-004 ✅
Historias

## IG-005 ✅
Carruseles

MÓDULO INSTAGRAM CERRADO

---

# ANALYTICS

## ANA-001 ✅
Dashboard

## ANA-002 ✅
Engagement

## ANA-003 ✅
Alcance

## ANA-004 ✅
Guardados

## ANA-005 ✅
Clicks

## ANA-006 ✅
Comparativas

MÓDULO ANALYTICS CERRADO

---

# GALERÍA

## GAL-001 ✅
Conectar Google Photos

Autenticar con Google (OAuth) y permitir elegir fotos mediante el Photos Picker API. Google ya no permite leer la librería completa sin una revisión de seguridad extensa, así que la selección es por sesión (el usuario elige fotos puntuales cada vez, no una sincronización automática de todo el álbum). Verificado de punta a punta con cuenta real de Google.

## GAL-002 ✅
Guardar fotos seleccionadas en el banco de medios

Importar las fotos elegidas en el Picker hacia el módulo Media existente (Supabase Storage), para que se puedan usar igual que las imágenes subidas manualmente. Verificado de punta a punta con cuenta real de Google.

MÓDULO GALERÍA CERRADO

## GAL-003 ✅
Sugerir posts con fotos del banco en el dashboard

## GAL-004 ✅
Sugerir historias con fotos del banco en el dashboard

Sección "Sugerencias de contenido" en el dashboard: surfacea fotos del banco (priorizando las importadas de Google Photos) y propone convertirlas en post (GAL-003) o historia (GAL-004). Cada tarjeta lleva al editor de publicaciones con la sugerencia guardada. Verificado con datos reales.

---

# AUTOMATIZACIÓN DE HISTORIAS

## AUTO-001 ✅
Generar historias automáticamente con IA

La IA genera el texto de la historia (Claude, con análisis de la foto adjunta) a partir de una foto sugerida del banco de imágenes; el usuario puede editarlo y guardarlo como borrador o publicarlo. Edge Function `generate-story` (mismos proveedores/modelos que `generate-post-text`: Claude→Gemini→Groq→plantilla local). Verificado con datos reales: texto generado por Claude analizando la foto y el contexto del negocio.

## AUTO-002 ✅
Activar auto-publicación de historias generadas por IA

Toggle "Auto-publicar historias de IA" en el dashboard (columna `workspaces.auto_publish_stories`, apagado por defecto). Cuando está activo, "Generar con IA" genera y publica sin paso de revisión manual, reutilizando el pipeline de publicación ya probado (`instagram-publish`, mediaType "stories"). Cuando está apagado, muestra el texto para editar y botones explícitos "Guardar borrador" / "Publicar ahora". Verificado: generación real y flujo de guardado como borrador end-to-end.

MÓDULO AUTOMATIZACIÓN DE HISTORIAS CERRADO

---

# MULTIEMPRESA

## WS-001
Cambiar Workspace

## WS-002
Selector de empresa

## WS-003
Invitar usuarios

## WS-004
Roles

Admin

Editor

Viewer

---

# CONFIGURACIÓN

## SET-001
Perfil

## SET-002
Instagram

## SET-003
OpenAI

## SET-004
Marca

## SET-005
Prompts

## SET-006
Preferencias

---

REGLA

Siempre continuar por el PRIMER ticket pendiente.

Nunca saltarse tickets.

Nunca crear tickets nuevos sin autorización del usuario.
