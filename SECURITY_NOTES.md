# 🔐 Notas de Seguridad — IBIME Gymnastics Club

## ¿Por qué la API Key de Firebase es pública y eso está bien?

En proyectos web con Firebase, la `apiKey` es un **identificador público** del proyecto,
no una credencial secreta. Firebase lo diseña así: la seguridad real se implementa mediante
**Firebase Security Rules** en Firestore y Realtime Database.

**La API key expuesta en GitHub es aceptable SIEMPRE QUE las Security Rules estén bien configuradas.**

---

## 🔐 Sistema de Autenticación por Roles

### Estrategia por tipo de usuario

| Portal | Método Auth | Email interno | Creado por |
|---|---|---|---|
| Alumno escuela | ID + PIN / contraseña (sin Firebase Auth) | No aplica | Recepción |
| Alumno público | Google / Apple (opcional) | El suyo | Él mismo |
| Profesor | Email interno + contraseña | `profe.{id}@prisma.com` | Admin |
| Recepción | Email interno + contraseña | `recepcion@prisma.com` | Admin |
| Admin | Email interno + contraseña | `admin@prisma.com` | Admin |
| Caja | Email interno + contraseña | `caja@prisma.com` | Admin |

> ⚠️ El dominio `@prisma.com` se usa **solo internamente** en Firebase Auth. Nunca se muestra
> en la UI como el correo real del usuario.

### Colección `usuarios_staff`

Cada usuario de staff tiene un documento en Firestore `usuarios_staff/{uid}`:

```
correo: string         // email interno en Firebase Auth
rol: string            // "admin" | "recepcion" | "caja"
nombre: string         // nombre visible en UI
createdAt: timestamp
```

---

## ✅ Configurar usuarios de staff en Firebase Auth Console

1. Ve a **Firebase Console → Authentication → Users**
2. Haz clic en **"Añadir usuario"**
3. Crea los siguientes usuarios con sus correos internos:

   | Usuario | Email | Notar |
   |---|---|---|
   | Administrador | `admin@prisma.com` | Rol: `admin` |
   | Recepción | `recepcion@prisma.com` | Rol: `recepcion` |
   | Caja | `caja@prisma.com` | Rol: `caja` |
   | Profesor Juan | `profe.juan-garcia@prisma.com` | El ID debe coincidir con el doc en `profesores/{id}` |

4. Copia el **UID** de cada usuario creado
5. En Firestore, crea el documento `usuarios_staff/{uid}` con los campos indicados arriba

### Crear email de profesor

El email se construye como `profe.{profesorId}@prisma.com` donde `profesorId` es el ID del
documento en la colección `profesores`. Por ejemplo, si el ID del profesor en Firestore es
`juan-garcia`, su email es `profe.juan-garcia@prisma.com`.

---

## ✅ Firestore Security Rules

El archivo `firestore.rules` en la raíz del repositorio contiene las reglas de seguridad
completas. Despliégalas en Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() { return request.auth != null; }

    function isStaff() {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/usuarios_staff/$(request.auth.uid));
    }

    function getStaffRole() {
      return get(/databases/$(database)/documents/usuarios_staff/$(request.auth.uid)).data.rol;
    }

    function isAdmin() { return isStaff() && getStaffRole() == 'admin'; }

    function isRecepcionOrAdmin() {
      return isStaff() && (getStaffRole() == 'recepcion' || getStaffRole() == 'admin');
    }

    match /alumnos/{alumnoId} {
      allow read: if isAuthenticated() && (request.auth.uid == resource.data.authUID || isStaff());
      allow write: if isRecepcionOrAdmin();
      allow update: if isAuthenticated() && request.auth.uid == resource.data.authUID;
    }

    match /catalogo/{docId} { allow read: if true; allow write: if isAdmin(); }
    match /reservas/{docId} {
      allow read: if isAuthenticated() && (request.auth.uid == resource.data.authUID || isStaff());
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (request.auth.uid == resource.data.authUID || isStaff());
    }
    match /pagos/{docId} { allow read: if isStaff(); allow write: if isRecepcionOrAdmin(); }
    match /config/{docId} { allow read: if true; allow write: if isAdmin(); }
    match /usuarios_staff/{uid} {
      allow read: if isAuthenticated() && request.auth.uid == uid;
      allow write: if isAdmin();
    }
    match /profesores/{docId} { allow read: if true; allow write: if isAdmin(); }
    match /asistencias/{docId} { allow read: if isStaff(); allow write: if isAuthenticated(); }
    match /comentarios_clases/{docId} { allow read: if isStaff(); allow write: if isAuthenticated(); }
  }
}
```

---

## ✅ Realtime Database Rules

Ve a: Firebase Console → Realtime Database → Rules

```json
{
  "rules": {
    "estatus_acceso": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "notificaciones": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

## ✅ Documentos de configuración en Firestore

| Documento | Campos requeridos |
|---|---|
| `config/inscripcion` | `monto` (number, ej: 800) |
| `config/costos_fitness` | `d1`–`d5` (precio regular), `p1`–`p5` (pronto pago) |
| `config/costos_gimnasia` | `d1`–`d5`, `p1`–`p5` |
| `config/contador_alumnos` | `ultimo_numero` (number) |
| `config/contador_pagos` | `ultimo_numero` (number) |

---

## 📋 Historial de cambios de seguridad

| Problema | Solución |
|---|---|
| Contraseña `gymnastics2026` hardcodeada en HTML/JS | Eliminada; reemplazada por Firebase Auth |
| Listeners de Firestore globales sin unsubscribe | Cancelados en logout (`_unsubDashboard`, etc.) |
| Race condition al crear reservas | Cupo y reserva en misma transacción atómica |
| `hoy` constante global en profesores.js | Reemplazada por `getHoy()` dinámico |
| `quitarAlumnoDeClase` restauraba cupo de una sola clase | Ahora agrupa por `claseId` en planes semanaleses |
| `setInterval` sin cleanup en alumno.js | Handle guardado y `clearInterval` en logout |
| Datos sensibles (password, pin, curp) en localStorage | Solo se guarda el `id` del alumno |
| Reglas permisivas `if true` en Firestore | Reemplazadas por reglas basadas en `request.auth` |
| Archivos HTML duplicados | Eliminados los 4 archivos con `(2)` / `(1)` |
| Profesores creados manualmente en Auth Console | Ahora se crean desde el panel Admin → tab "👨‍🏫 Profesores" |

---

## 👨‍🏫 Gestión de Profesores desde el Panel Admin

### ¿Cómo crear un nuevo profesor?

Los profesores ahora se crean directamente desde el tab **"👨‍🏫 Profesores"** del panel de administración (`gymnastics_admin_clases.html`). **Ya NO es necesario crearlos manualmente en Firebase Auth Console.**

1. Ingresa al panel Admin y ve al tab "👨‍🏫 Profesores"
2. Completa el formulario: nombre, celular, disciplina (opcional) y contraseña inicial
3. El sistema genera automáticamente el email interno: `profe.{nombre-apellido}@prisma.com`
4. Al hacer clic en "➕ Crear Profesor" se pedirá confirmar la contraseña del admin
5. El sistema crea el usuario en Firebase Auth y el documento en Firestore de forma automática

### Campo `passwordPendiente`

- Es un campo **temporal** en `profesores/{id}`
- El admin puede actualizar la contraseña de un profesor desde el panel de edición
- La nueva contraseña se guarda como `passwordPendiente` en Firestore
- Al siguiente inicio de sesión del profesor, el sistema aplica la contraseña automáticamente y **elimina el campo** `passwordPendiente`
- Si por algún motivo no se puede aplicar, el acceso del profesor **no se bloquea** (ya está autenticado)

### Eliminar un profesor

Al eliminar un profesor desde el panel:
1. Las clases asignadas a ese profesor en el catálogo quedan sin profesor asignado
2. El documento `profesores/{id}` se elimina de Firestore
3. **⚠️ El usuario en Firebase Auth NO se elimina automáticamente** — debe hacerse manualmente en la [Firebase Console](https://console.firebase.google.com/) → Authentication → Users
