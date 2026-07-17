# Marketing OS

## Objetivo

Marketing OS es un sistema operativo para restaurantes, hostales y pequeños negocios gastronómicos.

Instagram es un módulo del sistema, no el producto.

---

## Stack

- Astro
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- Supabase
- OpenAI
- Vercel

---

## Arquitectura

Cada funcionalidad vive dentro de:

src/features/

Ejemplo

auth/
workspace/
media/
menu/
dashboard/
posts/
ai/

Cada módulo contiene:

components/
hooks/
services/
schemas/
types/

No crear lógica fuera de esta estructura.

---

## Responsabilidades

components
UI solamente.

hooks
Estado y lógica.

services
Supabase, OpenAI o APIs externas.

schemas
Validaciones Zod.

types
Interfaces.

---

## Componentes reutilizables

Todos los componentes compartidos deben vivir en:

src/components/common

o

src/components/ui

No duplicar componentes.

---

## Regla principal

Los módulos terminados no se modifican excepto por:

- Corrección de bugs.
- Nueva funcionalidad planificada.

Nunca modificar un módulo terminado para resolver un problema de otro módulo.

Media no depende de Menu.

Menu consume Media.

Posts consume Menu.

AI consume Posts y Menu.

Dashboard consume todos.

## Proveedores de IA

Durante el MVP se utilizará Gemini o Groq mediante una interfaz común de proveedores.

Prioridad inicial:

1. Gemini
2. Groq
3. Plantillas locales
4. OpenAI en una versión futura

OpenAI no forma parte de la primera implementación funcional.

Las claves privadas solo se utilizan desde servidor y nunca se exponen al navegador.