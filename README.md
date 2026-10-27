# FleetCore API: gestión de mantenimiento de flota

API REST para administrar el ciclo de vida de los mantenimientos preventivos y correctivos de la flota de vehículos de **FleetCore**: vehículos, mecánicos, talleres, mantenimientos, historial y auditoría.

Prueba de desempeño, Módulo 6.2: NestJS.

| Coder | Clan |
|---|---|
| **Manuel Rueda** | **Node.js Mañana** |

**Documentación Swagger:** <http://localhost:3000/docs>

---

## Tecnologías

- **NestJS 12** + **TypeScript**
- **PostgreSQL** + **TypeORM**
- **JWT** (`@nestjs/jwt`) y **bcrypt** (`bcryptjs`) para el hash de contraseñas
- **class-validator** / **class-transformer** para validar la entrada
- **Swagger** (`@nestjs/swagger`) para la documentación
- **Jest** para las pruebas unitarias
- **Docker** / **docker-compose** (opcional)

## Requisitos

- Node.js **22.12 o superior** (probado con Node 24)
- npm
- PostgreSQL **14 o superior** (probado con PostgreSQL 16)

---

## Instalación y ejecución

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Maru-rc/Prueba-final-node.git
cd Prueba-final-node
npm install
```

### 2. Crear la base de datos

Con un usuario administrador de PostgreSQL (por ejemplo `postgres`):

```sql
CREATE USER fleetcore WITH PASSWORD 'fleetcore123' CREATEDB;
CREATE DATABASE prueba_final OWNER fleetcore;
```

> Las tablas se crean automáticamente al arrancar la API o al ejecutar el seeder (TypeORM `synchronize`).

### 3. Configurar las variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con los datos de tu base de datos:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de la API | `3000` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario de la base de datos | `fleetcore` |
| `DB_PASSWORD` | Contraseña de la base de datos | `fleetcore123` |
| `DB_NAME` | Nombre de la base de datos | `prueba_final` |
| `JWT_SECRET` | Secreto para firmar los JWT | `cambia-este-secreto` |
| `JWT_EXPIRES_IN` | Duración del token | `1h` |
| `API_KEYS` | Claves para integraciones externas (separadas por coma) | `demo-key-partner-1,demo-key-partner-2` |

La aplicación **valida estas variables al arrancar**: si falta alguna o tiene un formato inválido, no inicia y muestra cuál es.

### 4. Poblar la base de datos (seeder)

```bash
npm run seed
```

Se puede ejecutar varias veces: **no duplica registros**, porque cada uno se busca por su campo único (email, nombre o placa) y solo se crea si no existe. Crea:

| Datos | Detalle |
|---|---|
| 3 usuarios | 1 ADMIN y 2 TECHNICIAN |
| 3 mecánicos | Carlos Pérez y Laura Gómez (activos, vinculados a los técnicos), Andrés Ruiz (inactivo) |
| 2 talleres | Taller Centro (activo), Taller Norte (inactivo) |
| 4 vehículos | ABC123 y DEF456 `AVAILABLE`, GHI789 `IN_MAINTENANCE`, JKL012 `INACTIVE` |
| 3 mantenimientos | 2 `COMPLETED` de ABC123 (historial) y 1 `IN_PROGRESS` de GHI789 asignado a Laura, con su auditoría |

### 5. Levantar la API

```bash
npm run start:dev      # desarrollo (recarga automática)
# o
npm run build && npm run start:prod
```

- API: <http://localhost:3000>
- **Swagger: <http://localhost:3000/docs>**

---

## Credenciales de prueba

| Rol | Email | Contraseña | Mecánico vinculado |
|---|---|---|---|
| ADMIN | `admin@fleetcore.com` | `Admin123*` | — |
| TECHNICIAN | `carlos.perez@fleetcore.com` | `Tecnico123*` | Carlos Pérez (id 1) |
| TECHNICIAN | `laura.gomez@fleetcore.com` | `Tecnico123*` | Laura Gómez (id 2) |

**API keys** para `/integrations` (header `x-api-key`): `demo-key-partner-1` o `demo-key-partner-2`.

### Probar en Swagger

1. Abre <http://localhost:3000/docs>.
2. Ejecuta `POST /auth/login` con una de las credenciales.
3. Copia el `accessToken` de la respuesta, pulsa **Authorize** y pégalo en `bearer`.
4. Para los endpoints de **Integraciones**, pulsa **Authorize** y escribe una API key en `api-key`.

---

## Roles y permisos

| Acción | ADMIN | TECHNICIAN |
|---|:---:|:---:|
| Registrarse / iniciar sesión | ✅ | ✅ |
| Crear usuarios con cualquier rol (`POST /users`) | ✅ | ❌ |
| Listar y consultar vehículos y talleres activos | ✅ | ✅ |
| Crear, editar, activar e inactivar vehículos, mecánicos y talleres | ✅ | ❌ |
| Crear mantenimientos y ver todos, activos, por vehículo, por mecánico e historial | ✅ | ❌ |
| Ver sus mantenimientos asignados con el taller donde debe hacerlos | — | ✅ |
| Ver un mantenimiento | ✅ todos | ✅ solo los suyos |
| Cambiar el estado de un mantenimiento | ✅ todos | ✅ solo los suyos |
| Consultar la auditoría | ✅ | ❌ |

## Endpoints

Todas las rutas requieren `Authorization: Bearer <token>`, excepto las marcadas como públicas o con API key.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Pública | Registro (crea un TECHNICIAN) |
| POST | `/auth/login` | Pública | Login; devuelve el JWT |
| GET | `/auth/me` | Autenticado | Usuario autenticado |
| POST / GET | `/users` | ADMIN | Crear / listar usuarios |
| GET | `/vehicles?status=` | ADMIN, TECHNICIAN | Listar vehículos (filtro opcional por estado) |
| GET | `/vehicles/:id` · `/vehicles/plate/:plate` | ADMIN, TECHNICIAN | Consultar por id o por placa |
| POST / PATCH | `/vehicles` · `/vehicles/:id` | ADMIN | Registrar / actualizar |
| PATCH | `/vehicles/:id/deactivate` · `/activate` | ADMIN | Inactivación lógica / reactivación |
| GET | `/mechanics?isActive=` · `/mechanics/:id` | ADMIN | Listar / consultar mecánicos |
| GET | `/mechanics/me` | TECHNICIAN | Perfil de mecánico propio |
| POST / PATCH | `/mechanics` · `/mechanics/:id` | ADMIN | Registrar / actualizar |
| PATCH | `/mechanics/:id/activate` · `/deactivate` | ADMIN | Activar / inactivar |
| GET | `/workshops?includeInactive=` · `/workshops/:id` | ADMIN, TECHNICIAN | Talleres activos / consultar uno |
| POST / PATCH | `/workshops` · `/workshops/:id` | ADMIN | Registrar / actualizar |
| PATCH | `/workshops/:id/activate` · `/deactivate` | ADMIN | Activar / inactivar |
| POST | `/maintenances` | ADMIN | Crear mantenimiento (`SCHEDULED`) |
| GET | `/maintenances?status=&type=` | ADMIN | Todos los mantenimientos |
| GET | `/maintenances/active` | ADMIN | Activos (`SCHEDULED` / `IN_PROGRESS`) |
| GET | `/maintenances/vehicle/:vehicleId` | ADMIN | Por vehículo (todos los estados) |
| GET | `/maintenances/vehicle/:vehicleId/history` | ADMIN | Historial del vehículo (`COMPLETED`) |
| GET | `/maintenances/mechanic/:mechanicId` | ADMIN | Asignados a un mecánico |
| GET | `/maintenances/me` | TECHNICIAN | Mis mantenimientos asignados |
| GET | `/maintenances/:id` | ADMIN, TECHNICIAN (suyos) | Consultar uno |
| PATCH | `/maintenances/:id/status` | ADMIN, TECHNICIAN (suyos) | Cambiar estado |
| GET | `/maintenances/audit-logs` · `/maintenances/:id/audit-logs` | ADMIN | Auditoría de cambios de estado |
| GET | `/integrations/vehicles/:plate/maintenance-history` | **x-api-key** | Historial por placa para sistemas externos |

---

## Reglas de negocio

**Mantenimientos**
- El vehículo, el mecánico y el taller deben existir (**404**) y estar activos (**409**). Un vehículo `INACTIVE` no recibe mantenimientos.
- Un vehículo no puede tener más de un mantenimiento activo (`SCHEDULED` o `IN_PROGRESS`) (**409**).
- **Horario del mecánico:** cada mantenimiento ocupa la franja `[scheduledAt, estimatedEndAt)`. Un mecánico no puede tener dos mantenimientos activos que se crucen, **en ningún taller** (**409**):
  - 7:30 y 7:30, en el mismo taller o en otro: ❌
  - 7:30–9:00 y otro que inicia a las 8:00: ❌
  - 7:30–9:00 y otro que inicia a las 9:00: ✅
- El kilometraje del mantenimiento no puede ser inferior al actual del vehículo (**400**).

**Transiciones de estado** (`PATCH /maintenances/:id/status`)

```
SCHEDULED ──► IN_PROGRESS ──► COMPLETED
    │               │
    └──► CANCELLED ◄┘
```

- `COMPLETED` y `CANCELLED` son estados finales: no cambian más (**409** con mensaje descriptivo).
- No se puede completar sin pasar por `IN_PROGRESS`.
- Para `COMPLETED` son obligatorios: `workPerformed`, `finalCost`, `finishedAt` y `finalMileage` (**400** indicando los que faltan).
- Efectos en el vehículo:
  - `IN_PROGRESS`: el vehículo pasa a `IN_MAINTENANCE`.
  - `COMPLETED`: el vehículo vuelve a `AVAILABLE` y se actualiza su kilometraje.
  - Cancelar uno en curso también lo deja `AVAILABLE`.
- Crear un mantenimiento y cambiar su estado corre en **transacciones** con bloqueo de filas: dos solicitudes simultáneas no pueden saltarse las reglas.
- Cada cambio de estado queda en la **auditoría** (quién, de qué estado a cuál, cuándo y con qué nota).

**Vehículos, mecánicos y talleres**
- No se borran: se **inactivan** para conservar el historial. Un vehículo con mantenimientos activos no se puede inactivar.
- Placa, email del mecánico y nombre del taller son únicos (**409**). La placa se guarda en mayúsculas.
- El kilometraje de un vehículo no puede disminuir.

## Formato de respuestas

Todas las respuestas exitosas pasan por un **interceptor** y todos los errores por un **Exception Filter** global:

```json
{ "success": true, "statusCode": 200, "data": { }, "timestamp": "2026-10-20T19:00:00.000Z" }
```

```json
{
  "success": false,
  "statusCode": 409,
  "message": "El vehículo ABC123 ya tiene un mantenimiento activo (#3, IN_PROGRESS)",
  "path": "/maintenances",
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

Los errores de validación incluyen el detalle por campo en `errors`. Los errores de validación, autenticación (401), autorización (403), recursos inexistentes (404) y conflictos (409), incluidos los de unicidad de PostgreSQL, **nunca se convierten en 500**.

---

## Pruebas

### Pruebas unitarias (Jest)

```bash
npm test           # 78 pruebas
npm run test:cov   # con cobertura (umbral mínimo: 40 %)
```

Cobertura actual: **43 % de sentencias, 51 % de ramas**. Cubre las reglas de transición de estado, el cruce de horarios (ejemplos del enunciado), la creación y los cambios de estado de mantenimientos, los guards (JWT, roles, API key), el filtro de errores, el interceptor y los servicios de vehículos, talleres, mecánicos y autenticación.

### Colección de Postman

`docs/FleetCore.postman_collection.json`: **66 peticiones** en 9 carpetas con pruebas automáticas que cubren autenticación, guards, CRUD, reglas de negocio, ciclo de vida, consultas, auditoría e integraciones.

1. Importa el archivo en Postman.
2. Con la API corriendo y la base poblada, ejecútala con el **Runner**, en orden.

También se puede correr por línea de comandos:

```bash
npx newman run docs/FleetCore.postman_collection.json
```

La salida de una ejecución completa (99/99 aserciones) está en `docs/evidencia-newman.txt`.

---

## Dump de la base de datos

`docs/prueba_final.sql` contiene la estructura y los datos del seeder. Para restaurarlo en una base vacía:

```bash
psql -h localhost -U fleetcore -d prueba_final -f docs/prueba_final.sql
```

## Docker (opcional)

Levanta la API y PostgreSQL 17 con un volumen para persistencia y una red interna. Usa las variables del `.env`.

```bash
docker compose up -d --build
docker compose exec api node dist/database/seeds/seed.js   # poblar la base
```

API en <http://localhost:3000>, Swagger en <http://localhost:3000/docs>.

---

## Decisiones de diseño

- **Registro público → TECHNICIAN.** `POST /auth/register` siempre crea técnicos para que nadie se registre como ADMIN. Los ADMIN se crean con `POST /users` (por otro ADMIN) o con el seeder.
- **Técnico ↔ mecánico.** El técnico (usuario que inicia sesión) se vincula uno a uno con un mecánico (perfil operativo). Así ve y actualiza solo los mantenimientos de su perfil.
- **Franja horaria.** Además de la fecha programada (`scheduledAt`), cada mantenimiento tiene `estimatedEndAt` para poder validar los cruces de horario.
- **Historial = mantenimientos `COMPLETED`.** "Por vehículo" devuelve todos los estados; el historial devuelve las intervenciones terminadas, con costo y fecha de cierre.
- **Decoradores personalizados:** `@Public()`, `@Roles()`, `@CurrentUser()` y `@ApiKeyAuth()`.
- **Mensajes en español**, incluidos los que Nest genera por defecto (campos no permitidos, rutas inexistentes, JSON inválido).

## Estructura del proyecto

```
src/
├── main.ts                      # arranque, ValidationPipe y Swagger
├── app.module.ts                # módulos, guards, interceptor y filtro globales
├── config/env.validation.ts     # validación de variables de entorno
├── common/
│   ├── decorators/              # @Public, @Roles, @CurrentUser, @ApiKeyAuth
│   ├── guards/                  # JwtAuthGuard, RolesGuard, ApiKeyGuard
│   ├── filters/                 # AllExceptionsFilter
│   ├── interceptors/            # ResponseInterceptor
│   └── ...                      # enums, interfaces, pipes, utilidades
├── database/
│   ├── database.module.ts       # conexión TypeORM
│   └── seeds/                   # seeder idempotente
└── modules/
    ├── auth/  users/
    ├── vehicles/  mechanics/  workshops/
    ├── maintenances/            # entidades, reglas de estado, servicio y controlador
    └── integrations/            # endpoint con x-api-key
docs/                            # dump SQL, colección de Postman y evidencia
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run start:dev` | API en modo desarrollo |
| `npm run build` / `npm run start:prod` | Compilar / ejecutar la versión compilada |
| `npm run seed` | Poblar la base de datos |
| `npm test` / `npm run test:cov` | Pruebas unitarias / con cobertura |
| `npm run lint` | Linter (oxlint) |
