# Grupo Scout Alcázar · Las Condes

Sitio web del Grupo Scout Alcázar (Las Condes, Santiago de Chile), hecho con React + Vite.

## Qué incluye

- **Páginas públicas:** Inicio, Quiénes Somos (con video configurable, Ley Scout y principios), Ramas y una página de detalle para cada rama, Preguntas Frecuentes y Contacto.
- **Páginas privadas** (requieren iniciar sesión): Fotos y álbumes, Eventos (calendario mensual), Comunicaciones y Equipo.
- **Administración:** crear, editar y eliminar ramas, integrantes, eventos, álbumes, fotos, comunicaciones y preguntas frecuentes. Cada registro se guarda por separado, así que editar uno no modifica los demás.
- **Subir fotos:** dentro de un álbum, un administrador puede arrastrar o elegir varias fotos a la vez. Se optimizan automáticamente; después se puede editar la descripción de cada foto, elegir la portada o eliminar fotos.
- **Panel de administración** (`/admin`): mensajes de contacto, aprobación de cuentas y datos del sitio (dirección, horario, redes sociales, video).

## Desarrollo

```bash
npm install
npm run dev
```

## Modos de datos

| Modo | Cuándo | Dónde se guardan los datos |
|------|--------|-----------------------------|
| **Local** (por defecto) | Sin variables de entorno | En el navegador (IndexedDB). Sirve para probar: cada navegador tiene sus propios datos. |
| **Supabase** | Con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` | Base de datos compartida: todos ven los mismos datos. |

**Cuentas:** la **primera cuenta** que se crea queda como **administradora**. Las siguientes quedan *pendientes* hasta que un administrador las apruebe como "Miembro" o "Administrador" en `/admin` → Usuarios.

### Activar Supabase (recomendado para el sitio real)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el archivo [`supabase/schema.sql`](supabase/schema.sql).
3. Copia `.env.example` a `.env` y completa la URL y la clave *anon* del proyecto (Project Settings → API).
4. Para GitHub Pages, agrega esas dos variables como *secrets* del repositorio (Settings → Secrets and variables → Actions) con los nombres `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

> Nota: las fotos se guardan en un bucket público de Supabase con nombres aleatorios. La galería solo se muestra a miembros aprobados, pero quien tenga el enlace directo de una foto puede verla.

## Publicar en GitHub Pages

El flujo `.github/workflows/deploy.yml` compila y publica el sitio cada vez que se sube un cambio a `main`.
Actívalo una vez en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
