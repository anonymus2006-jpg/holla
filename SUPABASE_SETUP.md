# Conexión a Supabase - Guía de Configuración

## Paso 1: Crear un proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Crea un nuevo proyecto
4. Anota tu **Project URL** y **Anon Key** (los necesitarás)

## Paso 2: Crear la tabla de participantes

En el panel de Supabase:

1. Ve a **SQL Editor**
2. Ejecuta este SQL:

```sql
create table participantes (
  id bigint primary key generated always as identity,
  nombre text not null check (char_length(nombre) <= 100),
  apellido text not null check (char_length(apellido) <= 100),
  edad int not null check (edad between 0 and 120),
  telefono text not null check (
    char_length(telefono) <= 20
    and telefono ~ E'^\\+?[0-9\\-]+$'
  ),
  correo text not null unique check (char_length(correo) <= 150),
  fecha_inscripcion timestamptz default now()
);
```

## Paso 3: Configurar las credenciales en supabase.js

Abre el archivo `supabase.js` y reemplaza estas líneas con TUS credenciales:

```javascript
const SUPABASE_URL = 'TU_PROJECT_URL_AQUI';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';
```

Por ejemplo:
```javascript
const SUPABASE_URL = 'https://tuproyecto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## Paso 4: Habilitar acceso público (Políticas de seguridad)

En el panel de Supabase:

1. Ve a **Database > Policies** o **Table Editor > Policies**
2. Selecciona la tabla `participantes`
3. Añade una política **INSERT** para **anon (usuarios públicos)**:
   - Nombre: `Allow public insert`
   - Expresión: `true`

Esto permite que cualquiera pueda insertar datos en la tabla.

> Si recibes un error 401 en el navegador, normalmente significa que la clave anon es inválida o que la política INSERT para `anon` no se ha configurado correctamente.

## Paso 5: Probar la conexión

1. Abre `inscripcion.html` en el navegador
2. Abre la consola (F12 > Console)
3. Rellena el formulario y envía
4. Verifica en la consola mensajes como:
   - `Supabase: creando cliente desde window.supabase.createClient`
   - `Supabase: insert participante`
   - `Supabase: respuesta insert`

Si ves estos mensajes, la conexión funciona.

## Solución de problemas

### Error: "Supabase: librería no encontrada"
- Asegúrate de que el `<script>` de Supabase está en `inscripcion.html`
- Recarga la página (Ctrl+F5)

### Error: "La configuración de Supabase no está lista"
- Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` sean correctos
- No incluyas espacios extras

### Error 401 (Unauthorized)
- Esto normalmente significa que la `anon key` o el URL del proyecto no coinciden
- Copia los valores exactos de Database > Settings > API > Project URL y anon key
- No uses la `service_role` key en el cliente

### Error 403 (Forbidden)
- Si obtienes 403, la clave es válida pero la política de INSERT no permite la operación
- Revisa la política de INSERT público para la tabla `participantes`

### Error: "table "participantes" does not exist"
- Ejecuta el SQL de la tabla nuevamente (Paso 2)
- Asegúrate de ejecutarlo en el mismo proyecto

### Error: "relation does not exist"
- La tabla no fue creada correctamente
- Repite el Paso 2

## Verificar que funcionó

En Supabase, ve a **Table Editor > participantes** y verifica que veas los datos que insertaste desde el formulario.
