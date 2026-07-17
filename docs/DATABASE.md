# Base de datos

## workspaces

Empresa del usuario.

---

## media

Banco de contenido.

Consumido por:

- Menu
- Posts
- AI

---

## daily_menus

Menú del día.

El formulario solicita solamente entrada, plato principal y postre. Durante el MVP el precio interno del menú es $12.000.

Puede tener una fotografía.

---

## posts

Borradores de publicaciones.

Estado:

draft
scheduled
published

---

## Relaciones

Workspace

├── Media

├── DailyMenu

├── Posts

└── Dashboard

Posts consume DailyMenu.

DailyMenu consume Media.

Dashboard consume todos.
